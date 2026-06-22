import { TbEye, TbTrash, TbEdit, TbFileExport } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../pages/config/axiosInstance";
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { IoIosSearch } from "react-icons/io";
import { MdAddShoppingCart, MdOutlineFileDownload, MdOutlineKeyboardArrowUp, } from "react-icons/md";
import { FaFileInvoice } from "react-icons/fa";
import { HiDotsHorizontal, HiDotsVertical } from "react-icons/hi";
import Pagination from "../../components/Pagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasPermission } from "../../utils/permission/hasPermission";
import { useAuth } from "../../components/auth/AuthContext";
import DeleteAlert from "../../utils/sweetAlert/DeleteAlert";
import PreviewProformaInvoice from "../../pages/Invoices/PreviewProformaInvoice"
import { IoPrintOutline } from "react-icons/io5";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";

function ProformaInvoices() {
  const { user } = useAuth();
  const [proformas, setProformas] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedProformas, setSelectedProformas] = useState([]);
  const [convertingId, setConvertingId] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [openActionDropdownId, setOpenActionDropdownId] = useState(null);
  const [openConvertDropdownId, setOpenConvertDropdownId] = useState(null);
  const actionDropdownRef = useRef(null);
  const convertDropdownRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  const [convertDropdownPos, setConvertDropdownPos] = useState({ x: 0, y: 0 });
  const [convertOpenUpwards, setConvertOpenUpwards] = useState(false);


  // States for Print/Preview modal
  const [printProforma, setPrintProforma] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [tabCounts, setTabCounts] = useState({
    All: 0,
    Recent: 0,
    Paid: 0,
    Due: 0
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is on the button that toggles the dropdown
      const isButtonClick = event.target.closest('button') &&
        event.target.closest('button').innerText?.includes('Convert to');

      // Only close if click is outside both the dropdown and the button
      if (convertDropdownRef.current && !convertDropdownRef.current.contains(event.target) && !isButtonClick) {
        setOpenConvertDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionDropdownRef.current && !actionDropdownRef.current.contains(event.target)) {
        setOpenActionDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // Fetch proforma invoices from backend
  const fetchProformas = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        // limit,
        limit: limit === "all" ? 10000 : limit,
        search: search || undefined,
        customerId: customer || undefined,
        // startDate,
        // endDate,
      };
      // Handle different tabs
      if (activeTab === "Recent") {
        // Last 7 days
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        today.setHours(23, 59, 59, 999);

        params.startDate = sevenDaysAgo.toISOString();
        params.endDate = today.toISOString();
      }
      else if (activeTab === "Paid") {
        // Fully paid proformas (dueAmount = 0 or status = fully_paid)
        params.status = "fully_paid";
      }
      else if (activeTab === "Due") {
        // Proformas with pending payment (dueAmount > 0)
        params.hasDue = true;
      }
      else if (startDate && endDate) {
        // Use custom dates if provided
        params.startDate = startDate;
        params.endDate = endDate;
      }

      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      let res = await api.get("/api/proforma-invoices", { params });

      if (res.data?.success) {
        let proformaData = Array.isArray(res.data.data) ? res.data.data : [];
        // For "Due" tab, filter client-side if backend doesn't support hasDue parameter
        if (activeTab === "Due") {
          proformaData = proformaData.filter(p => (p.dueAmount || 0) > 0);
        }
        setProformas(proformaData);
        if (limit === "all") {
          setTotal(proformaData.length);
        } else {
          setTotal(res.data.total || proformaData.length || 0);
        }
      } else {
        setProformas([]);
        setTotal(0);
      }
    } catch (err) {
      // console.error("Failed to fetch proforma invoices:", err);
      toast.error(err?.response?.data?.message || "Failed to fetch proforma invoices");
      setProformas([]);
      setTotal(0);
    }
    setLoading(false);
  };

  //   const fetchTabCounts = async () => {
  //   try {
  //     const counts = {};

  //     // Get All count (no filters)
  //     const allRes = await api.get("/api/proforma-invoices", { params: { limit: 1 } });
  //     counts.All = allRes.data?.total || 0;

  //     // Get Recent count (last 7 days)
  //     const today = new Date();
  //     const sevenDaysAgo = new Date();
  //     sevenDaysAgo.setDate(today.getDate() - 7);
  //     sevenDaysAgo.setHours(0, 0, 0, 0);
  //     today.setHours(23, 59, 59, 999);

  //     const recentRes = await api.get("/api/proforma-invoices", { 
  //       params: {
  //         startDate: sevenDaysAgo.toISOString(),
  //         endDate: today.toISOString(),
  //         limit: 1
  //       }
  //     });
  //     counts.Recent = recentRes.data?.total || 0;

  //     // Get Paid count
  //     const paidRes = await api.get("/api/proforma-invoices", { 
  //       params: { status: "fully_paid", limit: 1 }
  //     });
  //     counts.Paid = paidRes.data?.total || 0;

  //     // Get Due count
  //     const dueRes = await api.get("/api/proforma-invoices", { 
  //       params: { hasDue: true, limit: 1 }
  //     });
  //     counts.Due = dueRes.data?.total || 0;

  //     setTabCounts(counts);
  //   } catch (error) {
  //     console.error("Error fetching tab counts:", error);
  //   }
  // };

  const fetchTabCounts = async () => {
    try {
      const counts = {};

      // Get All count
      const allRes = await api.get("/api/proforma-invoices", { params: { limit: 1 } });
      counts.All = allRes.data?.total || 0;

      // Get Recent count
      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      today.setHours(23, 59, 59, 999);

      const recentRes = await api.get("/api/proforma-invoices", {
        params: {
          startDate: sevenDaysAgo.toISOString(),
          endDate: today.toISOString(),
          limit: 1
        }
      });
      counts.Recent = recentRes.data?.total || 0;

      // ✅ Fix for Paid - fetch all and filter by dueAmount === 0
      const allDataRes = await api.get("/api/proforma-invoices", {
        params: { limit: 10000 }
      });

      if (allDataRes.data?.success && Array.isArray(allDataRes.data.data)) {
        const paidProformas = allDataRes.data.data.filter(p => (p.dueAmount || 0) === 0);
        counts.Paid = paidProformas.length;
      } else {
        counts.Paid = 0;
      }

      // ✅ Fix for Due - filter by dueAmount > 0
      const dueProformas = allDataRes.data.data.filter(p => (p.dueAmount || 0) > 0);
      counts.Due = dueProformas.length;

      setTabCounts(counts);
    } catch (error) {
      console.error("Error fetching tab counts:", error);
      setTabCounts({ All: 0, Recent: 0, Paid: 0, Due: 0 });
    }
  };

  useEffect(() => {
    fetchProformas();
  }, [page, limit, search, customer, startDate, endDate, activeTab]);

  useEffect(() => {
    fetchTabCounts();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, customer, startDate, endDate]);

  const handleTabClick = (tabLabel) => {
    setActiveTab(tabLabel);
    setPage(1); // Reset to first page when changing tabs
    // Clear custom date filters when using tabs
    if (tabLabel !== "All") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProformas.length === 0) {
      toast.warning("Please select proforma invoices to delete");
      return;
    }
    const confirmed = await DeleteAlert({});
    if (!confirmed) return;
    try {
      await api.post("/api/proforma-invoices/bulk-delete", {
        ids: selectedProformas,
      });
      toast.success(`${selectedProformas.length} proforma invoice(s) deleted successfully`);
      setSelectedProformas([]);
      fetchProformas();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error(error?.response?.data?.message || "Unauthorized. Please login again");
      } else if (error.response?.status === 403) {
        toast.error(error?.response?.data?.message || "You don't have permission to delete proforma invoices");
      } else {
        toast.error("Bulk delete failed. Please try again");
      }
    }
  };

  // Calculate total quantity from items
  const calculateTotalQty = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.qty || 0), 0);
  };

  // Handle Delete Single Proforma
  const handleDeleteProforma = async (proformaId) => {
    // console.log("Deleting proforma ID:", proformaId);
    const confirmed = await DeleteAlert({});
    if (!confirmed) return;
    try {
      await api.delete(`/api/proforma-invoices/${proformaId}`);
      toast.success("Proforma Invoice deleted successfully");
      fetchProformas();
    } catch (error) {
      // console.error("Delete error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete proforma invoice");
    }
    setOpenActionDropdownId(null);
  };

  // Handle Print Proforma
  const handlePrintProforma = (proformaData) => {
    setPrintProforma(proformaData);
    setShowPrintModal(true);
  };

  const handleViewProforma = (proformaId, proformaData) => {
    navigate(`/view-proforma/${proformaId}`, {
      state: {
        viewProforma: proformaData,
        mode: "view"
      }
    });
  };

  // Update the handleEditProforma function
  const handleEditProforma = (proformaId, proformaData) => {
    navigate(`/edit-proforma/${proformaId}`, {
      state: {
        editProforma: proformaData,
        mode: "edit"
      }
    });
  };


  // Convert to Sales Order
  const convertToSalesOrder = async (proforma) => {
    setConvertingId(proforma._id);
    try {
      // Fetch complete proforma data with populated customer
      const response = await api.get(`/api/proforma-invoices/${proforma._id}`);
      if (response.data.success) {
        const completeProforma = response.data.data;
        navigate("/create-sales-order", {
          state: {
            sourceProforma: completeProforma,
            isFromProforma: true,
            proformaId: completeProforma._id
          }
        });
      } else {
        toast.error("Failed to load proforma data");
      }
    } catch (error) {
      // console.error("Error fetching proforma:", error);
      toast.error(error?.response?.data?.message || "Failed to load proforma data");
    } finally {
      setConvertingId(null);
      setOpenConvertDropdownId(null);
    }
  };

  // Convert to Sales Invoice - Navigate to form with complete data
  const convertToSalesInvoice = async (proforma) => {
    setConvertingId(proforma._id);
    try {
      // Fetch complete proforma data with populated customer
      const response = await api.get(`/api/proforma-invoices/${proforma._id}`);
      if (response.data.success) {
        const completeProforma = response.data.data;
        navigate("/createinvoice", {
          state: {
            sourceProforma: completeProforma,
            isFromProforma: true,
            proformaId: completeProforma._id
          }
        });
      } else {
        toast.error("Failed to load proforma data");
      }
    } catch (error) {
      // console.error("Error fetching proforma:", error);
      toast.error(error?.response?.data?.message || "Failed to load proforma data");
    } finally {
      setConvertingId(null);
      setOpenConvertDropdownId(null);
    }
  };

  // Export to PDF
  const handleExcel = async () => {
    // Get selected rows - works with your existing selectedProformas array
    const selectedIds = Array.isArray(selectedProformas)
      ? selectedProformas
      : Array.from(selectedProformas);

    if (selectedIds.length === 0) {
      toast.error("Select at least 1 row to export data");
      return;
    }

    try {
      // Get selected rows data
      const selectedRows = proformas.filter(p => selectedIds.includes(p._id));

      if (selectedRows.length === 0) {
        toast.error("No data available to export");
        return;
      }

      // Define columns for Excel
      const tableColumns = [
        "Proforma No.",
        "Customer Name",
        "Quantity",
        "Total Amount",
        "Status",
        "Date"
      ];

      // Prepare table rows
      const tableRows = selectedRows.map((p) => [
        p.proformaNo || "-",
        p.customerId?.name || "-",
        calculateTotalQty(p.items) || 0,
        (p.grandTotal || 0).toFixed(2),
        p.status?.toUpperCase() || "DRAFT",
        p.proformaDate ? format(new Date(p.proformaDate), "dd MMM yyyy") : "-"
      ]);

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Proforma Invoices");

      // Add header row with styling
      const headerRow = worksheet.addRow(tableColumns);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "99c5ff" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.font = { bold: true };
      });

      // Set column widths
      [20, 30, 12, 18, 15, 18].forEach((width, i) => {
        worksheet.getColumn(i + 1).width = width;
      });

      // Add data rows
      tableRows.forEach((row) => worksheet.addRow(row));

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `proforma_invoices_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        fileName
      );

      toast.success(`Exported ${selectedRows.length} proforma invoice(s) as Excel`);

    } catch (error) {
      console.error("Excel export error:", error);
      toast.error(error?.message || "Failed to generate Excel file");
    }
  };

  // Check if proforma can be converted
  const canConvert = (proforma) => {
    const convertibleStatuses = ["draft", "sent", "accepted", "advance_paid"];
    return convertibleStatuses.includes(proforma.status);
  };

  const tabs = [
    { label: "All", count: tabCounts.All, active: activeTab === "All" },
    { label: "Recent", count: tabCounts.Recent, active: activeTab === "Recent" },
    { label: "Paid", count: tabCounts.Paid, active: activeTab === "Paid" },
    { label: "Due", count: tabCounts.Due, active: activeTab === "Due" },
  ];

  const handleActionDropdown = (e, id) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    const dropdownHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom;

    setOpenUpwards(spaceBelow < dropdownHeight);

    setDropdownPos({
      x: rect.left,
      y: rect.bottom + window.scrollY,
    });

    setOpenActionDropdownId(
      openActionDropdownId === id ? null : id
    );
  };

  const handleConvertDropdown = (e, id) => {
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    const dropdownHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;

    setConvertOpenUpwards(spaceBelow < dropdownHeight);

    setConvertDropdownPos({
      x: rect.left,
      y: rect.bottom + window.scrollY,
    });

    setOpenDropdownId(
      openDropdownId === id ? null : id
    );
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, height: "33px" }}>
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              height: "33px",
            }}
          >
            Proforma Invoices
          </h2>
        </div>

        {/* Create Proforma Button */}
        {hasPermission(user, "Proforma", "create") && (
          <Link to="/create-proforma">
            <button
              title="Create Proforma Invoice"
              className="button-hover"
              style={{
                borderRadius: "8px",
                padding: "5px 16px",
                border: "1px solid #1F7FFF",
                color: "rgb(31, 127, 255)",
                fontFamily: "Inter",
                backgroundColor: "white",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              + Create Proforma
            </button>
          </Link>
        )}
      </div>

      {/* Main Body */}
      <div
        style={{
          width: "100%",
          minHeight: "auto",
          maxHeight: "calc(100vh - 160px)",
          padding: 16,
          background: "white",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Tabs + Search Bar & Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            height: "33px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              flexWrap: "wrap",
              maxWidth: "50%",
              width: "fit-content",
              height: "33px",
            }}
          >
            {tabs.map((tab) => (
              <div
                key={tab.label}
                onClick={() => handleTabClick(tab.label)}
                style={{
                  padding: "4px 12px",
                  background: tab.active ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow: tab.active ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                  cursor: "pointer"
                }}
              >
                {tab.label}
                <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "inline-flex",
              justifyContent: "end",
              alignItems: "center",
              gap: 16,
              width: "50%",
              height: "33px",
            }}
          >
            {/* Bulk Delete Button */}
            {selectedProformas.length > 0 && hasPermission(user, "ProformaInvoices", "delete") && (
              <button
                className="btn btn-danger btn-sm"
                onClick={handleBulkDelete}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "12px",
                  padding: "4px 12px",
                }}
              >
                <TbTrash size={14} />
                Delete ({selectedProformas.length})
              </button>
            )}

            {/* Search Bar */}
            <div
              style={{
                width: "50%",
                position: "relative",
                padding: "5px 0px 5px 10px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
                height: "33px",
              }}
            >
              <IoIosSearch style={{ fontSize: "25px" }} />
              <input
                type="search"
                placeholder="Search by Proforma No or Customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
              />
            </div>

            {/* Export Button */}
            {hasPermission(user, "Proforma", "export") && (
              <button
                title="Export"
                onClick={handleExcel}
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 9,
                  padding: "8px 16px",
                  background: "#FCFCFC",
                  borderRadius: 8,
                  outline: "1px solid #EAEAEA",
                  outlineOffset: "-1px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#0E101A",
                  height: "33px",
                }}
              >
                <TbFileExport className="fs-5 text-secondary" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div
          // className="table-responsive"
          style={{
            overflowY: "auto",
            height: "calc(100vh - 310px)",
            maxHeight: '500px',
          }}
        >
          <table
            className="table-responsive"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              overflowX: "auto",
            }}
          >
            {/* Header */}
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                height: "38px",
              }}
            >
              <tr style={{ background: "#F3F8FB" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 120,
                    fontWeight: "400",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="checkbox"
                      style={{ width: 18, height: 18 }}
                      checked={(() => {
                        const allIds = proformas.map((i) => i._id).filter(Boolean);
                        const uniqueSelected = new Set(selectedProformas);
                        return allIds.length > 0 && uniqueSelected.size === allIds.length;
                      })()}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProformas(proformas.map((i) => i._id).filter(Boolean));
                        } else {
                          setSelectedProformas([]);
                        }
                      }}
                    />
                    PI No.
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 200,
                    fontWeight: "400",
                  }}
                >
                  Customer Name
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 80,
                    fontWeight: "400",
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 120,
                    fontWeight: "400",
                  }}
                >
                  Total Amount
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 120,
                    fontWeight: "400",
                  }}
                >
                  Due Amount
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 120,
                    fontWeight: "400",
                  }}
                >
                  Status(Convert)
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
                    fontWeight: "400",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : proformas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-3">
                    <span style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "center", fontSize: 14, color: "#6C748C" }}>
                      No Proforma Invoices Found
                    </span>
                  </td>
                </tr>
              ) : (
                proformas.map((proforma, idx) => (
                  <tr
                    key={proforma._id || idx}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                      height: "46px",
                      cursor: "pointer"
                    }}
                    onClick={() => handleViewProforma(proforma._id, proforma)}
                  >
                    {/* PI No */}
                    <td style={{ padding: "8px 16px", verticalAlign: "middle" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <input
                          type="checkbox"
                          style={{ width: 18, height: 18 }}
                          checked={selectedProformas.includes(proforma._id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            if (e.target.checked) {
                              setSelectedProformas((prev) => [...prev, proforma._id]);
                            } else {
                              setSelectedProformas((prev) => prev.filter((id) => id !== proforma._id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div style={{ fontSize: 14, color: "#0E101A", fontWeight: "500" }}>
                          {proforma.proformaNo}
                        </div>
                      </div>
                    </td>

                    {/* Customer Name */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      <div>
                        <div>{proforma.customerId?.name || "-"}</div>
                        {/* <div style={{ fontSize: 12, color: "#727681" }}>{proforma.customerId?.phone || ""}</div> */}
                      </div>
                    </td>

                    {/* Qty */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A", textAlign: "right" }}>
                      {calculateTotalQty(proforma.items)}
                    </td>

                    {/* Total Amount */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A", textAlign: "right", fontWeight: "400" }}>
                      ₹{(proforma.grandTotal || 0).toFixed(2)}
                    </td>
                    {/* Due Amount */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: (proforma.dueAmount || 0) > 0 ? "#d62022" : "#0E101A", textAlign: "right", fontWeight: "400" }}>
                      ₹{(proforma.dueAmount || 0).toFixed(2)}
                    </td>

                    {/* Convert Button with Dropdown */}
                    {/* <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                      {canConvert(proforma) ? (
                        <div style={{ position: "relative" }}>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => setOpenDropdownId(openDropdownId === proforma._id ? null : proforma._id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer",
                              backgroundColor: "#28a745",
                              color: "white",
                              border: "none",
                              borderRadius: "4px",
                            }}
                            disabled={convertingId === proforma._id}
                          >
                            {convertingId === proforma._id ? (
                              <div className="spinner-border spinner-border-sm" style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                            ) : (
                              <MdAddShoppingCart size={14} />
                            )}
                            Convert
                          </button>

                          {openDropdownId === proforma._id && (
                            <div
                              ref={dropdownRef}
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: "50%",
                                transform: "translateX(-50%)",
                                marginTop: "4px",
                                backgroundColor: "white",
                                border: "1px solid #e0e0e0",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                zIndex: 1000,
                                minWidth: "160px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                onClick={() => convertToSalesOrder(proforma._id)}
                                style={{
                                  padding: "10px 16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f0f0f0",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                              >
                                <MdOutlineFileDownload size={16} color="#2196F3" />
                                <span>Convert to Sales Order</span>
                              </div>
                              <div
                                onClick={() => convertToSalesInvoice(proforma)}  // Pass the whole proforma object
                                style={{
                                  padding: "10px 16px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  cursor: "pointer",
                                  transition: "background-color 0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                              >
                                <FaFileInvoice size={16} color="#4CAF50" />
                                <span>Convert to Sales Invoice</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#999" }}>Converted</span>
                      )}
                    </td> */}
                    {/* <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "center" }}>
                      {canConvert(proforma) ? (
                        <div style={{ position: "relative" }}>
                          <button
                            className="btn btn-sm"
                            // onClick={() => setOpenDropdownId(openDropdownId === proforma._id ? null : proforma._id)}
                            onClick={(e) => handleConvertDropdown(e, proforma._id)}
                            style={{
                            padding: "4px 10px",
                            background: "#f3f7ff",
                            color: "#3b82f6",
                            border: "1px solid #dbeafe",
                            borderRadius: "16px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "14px",
                            }}
                            disabled={convertingId === proforma._id}
                          >
                            {convertingId === proforma._id ? (
                              <div className="spinner-border spinner-border-sm" style={{ width: "12px", height: "12px", marginRight: "4px" }} />
                            ) : (
                              "Convert to"
                            )}
                            <span
                              style={{
                                transform: openDropdownId === proforma._id ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "0.3s",
                                display: "inline-block",
                              }}
                            >
                              <MdOutlineKeyboardArrowUp />
                            </span>
                          </button>

                          {openDropdownId === proforma._id && (
                            <div
                              ref={dropdownRef}
                              style={{
                                position: "fixed",
                                top: convertOpenUpwards
                                  ? convertDropdownPos.y - 180
                                  : convertDropdownPos.y + 8,
                                left: convertDropdownPos.x - 40,
                                transform: "translateX(-50%)",
                                marginTop: "8px",
                                backgroundColor: "white",
                                border: "1px solid #e0e0e0",
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                zIndex: 1000,
                                minWidth: "220px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                onClick={() => {
                                  convertToSalesOrder(proforma._id);
                                  setOpenDropdownId(null);
                                }}
                                style={{
                                  padding: "12px 20px",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  transition: "0.2s",
                                  borderBottom: "1px solid #eee",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <span>Sales Order</span>
                              </div>
                              <div
                                onClick={() => {
                                  convertToSalesInvoice(proforma);
                                  setOpenDropdownId(null);
                                }}
                                style={{
                                  padding: "12px 20px",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  transition: "0.2s",
                                  borderBottom: "1px solid #eee",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <span>Sales Invoice</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#999" }}>Converted</span>
                      )}
                    </td> */}
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A", textAlign: "center", fontWeight: "400" }}
                    >
                      {canConvert(proforma) ? (
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          {/* Convert Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              const rect = e.currentTarget.getBoundingClientRect();

                              setOpenConvertDropdownId(
                                openConvertDropdownId === proforma._id
                                  ? null
                                  : proforma._id
                              );

                              const dropdownHeight = 180;

                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;

                              if (
                                spaceBelow < dropdownHeight &&
                                spaceAbove > dropdownHeight
                              ) {
                                setConvertOpenUpwards(true);

                                setConvertDropdownPos({
                                  x: rect.left,
                                  y: rect.top,
                                });
                              } else {
                                setConvertOpenUpwards(false);

                                setConvertDropdownPos({
                                  x: rect.left,
                                  y: rect.bottom + 6,
                                });
                              }
                            }}
                            style={{
                              padding: "4px 10px",
                              background: "#f3f7ff",
                              color: "#3b82f6",
                              border: "1px solid #dbeafe",
                              borderRadius: "16px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontSize: "14px",
                            }}
                            disabled={convertingId === proforma._id}
                          >
                            {convertingId === proforma._id ? (
                              <div
                                className="spinner-border spinner-border-sm"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                }}
                              />
                            ) : (
                              <>
                                Convert to
                                <span
                                  style={{
                                    transform:
                                      openConvertDropdownId === proforma._id
                                        ? "rotate(180deg)"
                                        : "rotate(0deg)",
                                    transition: "0.3s",
                                    display: "inline-block",
                                  }}
                                >
                                  <MdOutlineKeyboardArrowUp />
                                </span>
                              </>
                            )}
                          </button>

                          {/* Dropdown */}
                          {openConvertDropdownId === proforma._id && (
                            <div
                              ref={convertDropdownRef}
                              style={{
                                position: "fixed",
                                top: convertOpenUpwards
                                  ? convertDropdownPos.y - 180
                                  : convertDropdownPos.y,
                                left: convertDropdownPos.x,
                                width: "220px",
                                background: "#fff",
                                borderRadius: "18px",
                                boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
                                border: "1px solid #e5e7eb",
                                zIndex: 1000,
                                overflow: "hidden",
                                padding: "8px",
                              }}
                            >
                              {/* Sales Order */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  convertToSalesOrder(proforma);
                                  setOpenConvertDropdownId(null);
                                }}
                                style={{
                                  padding: "8px 20px",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  transition: "0.2s",
                                  borderRadius: "18px",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#f3f7ff")
                                }
                                onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                                }
                              >
                                Sales Order
                              </div>

                              {/* Sales Invoice */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  convertToSalesInvoice(proforma);
                                  setOpenConvertDropdownId(null);
                                }}
                                style={{
                                  padding: "8px 20px",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  transition: "0.2s",
                                  borderRadius: "18px",
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background = "#f3f7ff")
                                }
                                onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                                }
                              >
                                Sales Invoice
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#999" }}>
                          Converted
                        </span>
                      )}
                    </td>
                    {/* Action - Preview Only */}
                    {/* Action Column with Three Dots Menu */}
                    <td onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
                      <div className="d-flex align-items-center justify-content-center">
                        {/* Three Dots Button */}
                        <div
                          className=""
                          // onClick={() => setOpenActionDropdownId(openActionDropdownId === proforma._id ? null : proforma._id)}
                          onClick={(e) => handleActionDropdown(e, proforma._id)}
                          style={{
                            padding: "6px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer"
                          }}
                        >
                          <HiDotsHorizontal size={24} />
                          <span style={{ fontSize: "12px" }}></span>
                        </div>

                        {/* Dropdown Menu */}
                        {openActionDropdownId === proforma._id && (
                          <div
                            // ref={dropdownRef}
                            ref={actionDropdownRef}
                            style={{
                              position: "fixed",
                              top: openUpwards
                                ? dropdownPos.y - 260
                                : dropdownPos.y + 8,
                              left: dropdownPos.x - 120,
                              width: "200px",
                              background: "#fff",
                              borderRadius: "18px",
                              boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
                              border: "1px solid #e5e7eb",
                              zIndex: 1000,
                              overflow: "hidden",
                              padding: "8px 8px",
                            }}
                          >
                            {/* View */}
                            <div
                              onClick={() => handleViewProforma(proforma._id, proforma)}
                              style={{
                                padding: "8px 12px",
                                fontSize: "16px",
                                transition: "0.2s",
                                borderRadius: "18px",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 8,
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 400,
                                color: "#6C748C",
                                textDecoration: "none",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f7ff")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              <TbEye size={24} />
                              <span style={{ fontSize: "14px", color: "black" }}>View</span>
                            </div>

                            {/* Edit */}
                            <div
                              onClick={() => handleEditProforma(proforma._id, proforma)}
                              style={{
                                padding: "8px 12px",
                                fontSize: "16px",
                                transition: "0.2s",
                                borderRadius: "18px",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 8,
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 400,
                                color: "#6C748C",
                                textDecoration: "none",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f7ff")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              <TbEdit size={24} />
                              <span style={{ fontSize: "14px", color: "black" }}>Edit</span>
                            </div>

                            {/* Delete Button */}
                            {hasPermission(user, "ProformaInvoices", "delete") && (
                              <div
                                onClick={() => handleDeleteProforma(proforma._id)}
                                style={{
                                  padding: "8px 12px",
                                  fontSize: "16px",
                                  transition: "0.2s",
                                  borderRadius: "18px",
                                  display: "flex",
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                  gap: 8,
                                  border: "none",
                                  cursor: "pointer",
                                  fontFamily: "Inter, sans-serif",
                                  fontWeight: 400,
                                  color: "#6C748C",
                                  textDecoration: "none",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f7ff")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                              >
                                <TbTrash size={24} />
                                <span style={{ fontSize: "14px", color: "black" }}>Delete</span>
                              </div>
                            )}
                            {/* Print */}
                            <div
                              onClick={async () => {
                                try {
                                  // Show loading toast
                                  toast.info("Preparing print...");

                                  // Fetch the full quotation data
                                  const response = await api.get(`/api/proforma-invoices/${proforma._id}`);
                                  if (response.data.success) {
                                    const proformaData = response.data.data;

                                    // Fetch company data
                                    const companyRes = await api.get(`/api/companyprofile/get`);
                                    const companyData = companyRes.data.data;

                                    // Fetch terms and template
                                    const termsRes = await api.get("/api/notes-terms-settings");
                                    const terms = termsRes.data.data;

                                    const templateRes = await api.get("/api/print-templates/all");
                                    const template = templateRes.data.data;

                                    const banksRes = await api.get("/api/company-bank/list");
                                    const banks = banksRes.data.data;

                                    // Create a temporary hidden div with the proforma content
                                    const tempDiv = document.createElement('div');
                                    tempDiv.style.position = 'absolute';
                                    tempDiv.style.left = '-9999px';
                                    tempDiv.style.top = '-9999px';
                                    document.body.appendChild(tempDiv);

                                    // Dynamically import react-dom/client and render the ProformaInvoiceContent
                                    const { createRoot } = await import('react-dom/client');
                                    const { ProformaInvoiceContent } = await import('../../pages/Invoices/PreviewProformaInvoice');
                                    const root = createRoot(tempDiv);

                                    root.render(
                                      <ProformaInvoiceContent
                                        proforma={proformaData}
                                        customer={proformaData.customerId}
                                        companyData={companyData}
                                        banks={banks}
                                        terms={terms}
                                        template={template}
                                        taxSettings={proformaData.taxSettings || { enableGSTBilling: true }}
                                      />
                                    );

                                    // Wait for render and then print
                                    setTimeout(() => {
                                      const printWindow = window.open('', '_blank');
                                      if (printWindow) {
                                        const printContent = tempDiv.cloneNode(true);


                                        printWindow.document.write(`
<!DOCTYPE html>
<html>
  <head>
    <title>Proforma Invoice ${proformaData.proformaNo || ''}</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'IBM Plex Mono', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        background: white;
      }
      @media print {
        body {
          padding: 0;
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    ${printContent.innerHTML}
    <script>
      window.onload = () => {
        setTimeout(() => {
          window.print();
          window.onafterprint = () => window.close();
        }, 500);
      };
    <\/script>
  </body>
</html>
            `);
                                        printWindow.document.close();
                                      }
                                      document.body.removeChild(tempDiv);
                                      toast.dismiss();
                                    }, 500);
                                  }
                                } catch (error) {
                                  toast.error("Failed to load proforma for printing");
                                  // console.error(error);
                                }
                              }}
                              style={{
                                padding: "8px 12px",
                                fontSize: "16px",
                                transition: "0.2s",
                                borderRadius: "18px",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 8,
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 400,
                                color: "#6C748C",
                                textDecoration: "none",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f7ff")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              <IoPrintOutline size={24} />
                              <span style={{ fontSize: "14px", color: "black" }}>Print</span>
                            </div>
                            {/* Generate delivery challan */}
                            {/* <div
                              style={{
                                padding: "8px 12px",
                                fontSize: "16px",
                                transition: "0.2s",
                                borderRadius: "18px",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 8,
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 400,
                                color: "#6C748C",
                                textDecoration: "none",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f7ff")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              <TbEdit size={24} />
                              <span style={{ fontSize: "14px", color: "black" }}>Generate Delivery Challan</span>
                            </div> */}
                            {/* <div
                              style={{
                                padding: "8px 12px",
                                fontSize: "16px",
                                transition: "0.2s",
                                borderRadius: "18px",
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 8,
                                border: "none",
                                cursor: "pointer",
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 400,
                                color: "#6C748C",
                                textDecoration: "none",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f7ff")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                            >
                              <TbEdit size={24} />
                              <span style={{ fontSize: "14px", color: "black" }}>Generate e-invoice</span>
                            </div> */}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-2">
          <Pagination
            currentPage={page}
            total={total}
            itemsPerPage={limit}
            onPageChange={(p) => setPage(p)}
            onItemsPerPageChange={(n) => {
              if (n === "all" || n === total) {
                setLimit(n);
                setPage(1);
              }
              else {
                setLimit(n);
                setPage(1);
              }
            }}
          />
        </div>
      </div>
      {/* Print Proforma Modal */}
      {showPrintModal && printProforma && (
        <PreviewProformaInvoice
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setPrintProforma(null);
          }}
          proformaId={printProforma._id}
          showPrintButton={true}
        />
      )}
    </div>
  );
}

export default ProformaInvoices;