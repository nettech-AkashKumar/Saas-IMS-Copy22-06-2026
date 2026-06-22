import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

// pages
import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
import api from "../../../pages/config/axiosInstance.js";
import { useAuth } from "../../auth/AuthContext.js";
import Pagination from "../../Pagination.jsx";
import DeleteModal from "../../ConfirmDelete.jsx";
import DateFilterDropdown from "../../DateFilterDropdown.jsx";

// icons
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import {
  TbFileExport,
  TbEdit,
  TbTrash,
  TbEye,
} from "react-icons/tb";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { IoPrintOutline } from "react-icons/io5";
import { FaFileInvoice } from "react-icons/fa";
import { FaTruckFast } from "react-icons/fa6";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  fontWeight: 400,
  cursor: "pointer",
  borderRadius: 8,
};

const DeliverychallanList = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // =========================
  // STATES
  // =========================
  const [deliveryChallans, setDeliveryChallans] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);

  const [selectedChallans, setSelectedChallans] = useState(new Set());

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteMode, setDeleteMode] = useState("single");

  // dropdowns
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openConvertDropdownId, setOpenConvertDropdownId] =
    useState(null);

  const [dropdownPos, setDropdownPos] = useState({
    x: 0,
    y: 0,
  });

  const [convertDropdownPos, setConvertDropdownPos] =
    useState({
      x: 0,
      y: 0,
    });

  const [convertingId, setConvertingId] = useState(null);

  const dropdownRef = useRef(null);
  const convertDropdownRef = useRef(null);

  // date filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // counts
  const [counts, setCounts] = useState({
    all: 0,
    recent: 0,
    pending: 0,
  });

  // =========================
  // FETCH DELIVERY CHALLANS
  // =========================
  const fetchDeliveryChallans = async () => {
    setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm?.trim(),
      };

      // Only send real DB status
      if (
        statusFilter &&
        statusFilter !== "All" &&
        statusFilter !== "Recent"
      ) {
        params.status = statusFilter;
      }

      // Recent tab
      if (statusFilter === "Recent") {
        const today = new Date();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        params.startDate = sevenDaysAgo.toISOString();
        params.endDate = today.toISOString();
      }

      // Manual date filter
      if (
        startDate &&
        endDate &&
        statusFilter !== "Recent"
      ) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      // console.log("Fetching delivery challans with params:",
      //   params
      // );

      const response = await api.get(
        "/api/delivery-challans",
        { params }
      );

      if (response?.data?.success) {
        const challans =
          response.data.deliveryChallans || [];

        setDeliveryChallans(challans);

        setTotalItems(response.data.total || 0);
      } else {
        setDeliveryChallans([]);
        setTotalItems(0);
      }
    } catch (error) {
      // console.error(
      //   "Error fetching delivery challans:",
      //   error
      // );

      // console.error(
      //   "Server response:",
      //   error?.response?.data
      // );

      toast.error(
        error?.response?.data?.message ||
        "Failed to fetch delivery challans"
      );

      setDeliveryChallans([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };
  // =========================
  // FETCH COUNTS
  // =========================
  const fetchCounts = async () => {
    try {
      const today = new Date();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);

      const [allRes, recentRes] = await Promise.all([
        api.get("/api/delivery-challans", {
          params: {
            page: 1,
            limit: 1,
          },
        }),

        api.get("/api/delivery-challans", {
          params: {
            page: 1,
            limit: 1,
            startDate: sevenDaysAgo.toISOString(),
            endDate: today.toISOString(),
          },
        }),
      ]);

      setCounts({
        all: allRes?.data?.total || 0,
        recent: recentRes?.data?.total || 0,
      });
    } catch (error) {
      // console.error("Error fetching counts:", error);

      // console.error(
      //     "Count API error:",
      //     error?.response?.data
      // );
    }
  };

  // =========================
  // EFFECTS
  // =========================
  useEffect(() => {
    fetchDeliveryChallans();
    fetchCounts();
  }, [
    currentPage,
    itemsPerPage,
    searchTerm,
    statusFilter,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedChallans(new Set());
  }, [searchTerm, statusFilter, startDate, endDate]);

  // outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdownId(null);
      }

      if (
        convertDropdownRef.current &&
        !convertDropdownRef.current.contains(event.target)
      ) {
        setOpenConvertDropdownId(null);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // =========================
  // CHECKBOX HANDLERS
  // =========================
  const handleCheckboxChange = (id) => {
    const updated = new Set(selectedChallans);

    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }

    setSelectedChallans(updated);
  };

  const handleToggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedChallans(new Set());
      return;
    }

    const allIds = deliveryChallans
      .map((item) => item._id)
      .filter(Boolean);

    setSelectedChallans(new Set(allIds));
  };

  // =========================
  // DELETE
  // =========================
  const handleDeleteChallan = (id) => {
    setDeleteMode("single");
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedChallans.size === 0) {
      toast.error(
        "Please select at least one delivery challan"
      );
      return;
    }

    setDeleteMode("bulk");
    setDeleteTargetId(null);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);

      if (deleteMode === "single" && deleteTargetId) {
        await api.delete(
          `/api/delivery-challans/${deleteTargetId}`
        );

        toast.success(
          "Delivery challan deleted successfully"
        );
      }

      if (
        deleteMode === "bulk" &&
        selectedChallans.size > 0
      ) {
        await Promise.all(
          Array.from(selectedChallans).map((id) =>
            api.delete(`/api/delivery-challans/${id}`)
          )
        );

        toast.success(
          "Selected delivery challans deleted successfully"
        );

        setSelectedChallans(new Set());
      }

      setShowDeleteModal(false);
      setDeleteTargetId(null);

      fetchDeliveryChallans();
      fetchCounts();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        "Error deleting delivery challan"
      );
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
    setDeleteMode("single");
  };

  // =========================
  // CONVERT TO INVOICE
  // =========================
  // const convertToInvoice = async (challan) => {
  //   try {
  //     setConvertingId(challan._id);
  //     setOpenConvertDropdownId(null);

  //     // Check if already converted
  //     if (challan.generatedInvoice) {
  //       toast.info(
  //         `Already converted to invoice: ${challan.generatedInvoiceNo || ""}`
  //       );
  //       setConvertingId(null);
  //       return;
  //     }

  //     const response = await api.post(
  //       `/api/delivery-challans/${challan._id}/convert-to-invoice`
  //     );

  //     if (response?.data?.success) {
  //       toast.success(
  //         `Invoice created: ${response.data.invoice.invoiceNo}`
  //       );

  //       // Refresh the list so generatedInvoice shows
  //       fetchDeliveryChallans();

  //       // Navigate to view the created invoice
  //       navigate(`/show-invoice/${response.data.invoice._id}`);
  //     } else {
  //       toast.error("Failed to convert delivery challan");
  //     }
  //   } catch (error) {
  //     toast.error(
  //       error?.response?.data?.error ||
  //       error?.response?.data?.message ||
  //       "Failed to convert delivery challan"
  //     );
  //   } finally {
  //     setConvertingId(null);
  //   }
  // };
  // =========================
  // CONVERT TO INVOICE - Navigate to Create Invoice page
  // =========================
  const convertToInvoice = async (challan) => {
    try {
      setConvertingId(challan._id);
      setOpenConvertDropdownId(null);

      // Check if already converted
      if (challan.generatedInvoice) {
        toast.info(
          `Already converted to invoice: ${challan.generatedInvoiceNo || ""}`
        );
        setConvertingId(null);
        return;
      }

      // Fetch complete delivery challan data with populated fields
      const response = await api.get(`/api/delivery-challans/${challan._id}`);

      if (response?.data?.success) {
        const completeChallan = response.data.deliveryChallan;

        // Navigate to Create Invoice page with source delivery challan data
        navigate("/createinvoice", {
          state: {
            sourceDeliveryChallan: completeChallan,
            isFromDeliveryChallan: true,
            autoFill: true
          }
        });
      } else {
        toast.error("Failed to load delivery challan data");
      }
    } catch (error) {
      console.error("Error loading delivery challan:", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to load delivery challan data"
      );
    } finally {
      setConvertingId(null);
    }
  };

  // =========================
  // CONVERT TO EWB
  // =========================
  const generateEwayBill = async (challan) => {
    try {
      setConvertingId(challan._id);

      setOpenConvertDropdownId(null);

      toast.info(
        "Preparing E-Way Bill from delivery challan..."
      );

      const response = await api.get(
        `/api/delivery-challans/${challan._id}`
      );

      if (response?.data?.success) {
        const completeChallan =
          response.data.deliveryChallan;

        navigate("/create-ewaybill", {
          state: {
            sourceDeliveryChallan: completeChallan,
            autoFill: true,
          },
        });

        toast.success(
          "Delivery challan converted successfully"
        );
      } else {
        toast.error(
          "Failed to load delivery challan"
        );
      }
    } catch (error) {
      // console.error(error);

      toast.error(
        error?.response?.data?.message ||
        "Failed to generate E-Way Bill"
      );
    } finally {
      setConvertingId(null);
    }
  };

  // =========================
  // EXPORT EXCEL
  // =========================
  const handleExcel = async () => {
    // Get selected rows - works with Set or Array
    const selectedIds = selectedChallans.size > 0
      ? Array.from(selectedChallans)
      : [];

    try {
      // Get data to export
      let exportData = [];

      if (selectedIds.length > 0) {
        exportData = deliveryChallans.filter(item => selectedIds.includes(item._id));
      } else {
        exportData = deliveryChallans;
      }

      if (exportData.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Define columns for Excel
      const tableColumns = [
        // "S.No",
        "Challan No",
        "Customer",
        "Date",
        "Status",
        "Vehicle",
        "E-Way Bill"
      ];

      // Prepare table rows
      const tableRows = exportData.map((item, index) => [
        // index + 1,
        item.challanNo || "N/A",
        item.customerId?.name || "N/A",
        item.challanDate ? format(new Date(item.challanDate), "dd MMM yyyy") : "N/A",
        item.status || "N/A",
        item.vehicleId?.vehicleNumber || item.vehicleNo || "N/A",
        item.ewayBillNo || "N/A"
      ]);

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Delivery Challans");

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
      [8, 20, 30, 18, 15, 20, 20].forEach((width, i) => {
        worksheet.getColumn(i + 1).width = width;
      });

      // Add data rows
      tableRows.forEach((row) => worksheet.addRow(row));

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `delivery_challans_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        fileName
      );

      toast.success(`Exported ${exportData.length} delivery challan(s) as Excel`);

    } catch (error) {
      // console.error("Excel export error:", error);
      toast.error(error?.message || "Failed to generate Excel file");
    }
  };

  // =========================
  // VIEW
  // =========================
  const handleViewDetails = (challan) => {
    navigate("/createdeliverychallan", {
      state: {
        viewDeliveryChallan: challan,
      },
    });

    setOpenDropdownId(null);
  };

  // =========================
  // EDIT
  // =========================
  const handleEdit = (challan) => {
    navigate("/createdeliverychallan", {
      state: {
        editDeliveryChallan: challan,
      },
    });

    setOpenDropdownId(null);
  };

  // =========================
  // PRINT
  // =========================
  const handlePrint = async (challan) => {
    try {
      setOpenDropdownId(null);
      toast.info("Preparing print...");

      const response = await api.get(
        `/api/delivery-challans/${challan._id}`
      );

      if (!response.data.success) {
        toast.error("Failed to load delivery challan");
        return;
      }

      const challanData = response.data.deliveryChallan;

      const companyRes = await api.get(
        "/api/companyprofile/get"
      );
      const companyData = companyRes.data.data;

      const termsRes = await api.get(
        "/api/notes-terms-settings"
      );
      const terms = termsRes.data.data;

      const templateRes = await api.get(
        "/api/print-templates/all"
      );
      const template = templateRes.data.data;

      const banksRes = await api.get(
        "/api/company-bank/list"
      );
      const banks = banksRes.data.data;

      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";

      document.body.appendChild(tempDiv);

      const { createRoot } = await import(
        "react-dom/client"
      );

      const { DeliveryChallanContent } = await import(
        "../../../pages/Invoices/DeliveryChallanContent.jsx" // adjust path
      );

      const root = createRoot(tempDiv);

      root.render(
        <DeliveryChallanContent
          challan={challanData}
          customer={challanData.customerId}
          companyData={companyData}
          banks={banks}
          terms={terms}
          template={template}
        />
      );

      setTimeout(() => {
        const printWindow = window.open(
          "",
          "_blank"
        );

        if (printWindow) {
          const printContent =
            tempDiv.cloneNode(true);

          printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>
                Delivery Challan ${challanData.challanNo || ""
            }
              </title>

              <style>
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }

                body {
                  font-family:
                    "IBM Plex Mono",
                    "Inter",
                    sans-serif;
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

                    window.onafterprint = () =>
                      window.close();
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
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to load delivery challan for printing"
      );
    }
  };

  // =========================
  // DROPDOWN
  // =========================
  const toggleActionDropdown = (e, id) => {
    e.stopPropagation();

    if (openDropdownId === id) {
      setOpenDropdownId(null);
      return;
    }

    const rect =
      e.currentTarget.getBoundingClientRect();

    setDropdownPos({
      x: rect.left + window.scrollX - 120,
      y: rect.bottom + window.scrollY + 5,
    });

    setOpenDropdownId(id);
    setOpenConvertDropdownId(null);
  };

  const toggleConvertDropdown = (e, id) => {
    e.stopPropagation();

    if (openConvertDropdownId === id) {
      setOpenConvertDropdownId(null);
      return;
    }

    const rect =
      e.currentTarget.getBoundingClientRect();

    setConvertDropdownPos({
      x: rect.left + window.scrollX - 100,
      y: rect.bottom + window.scrollY + 5,
    });

    setOpenConvertDropdownId(id);
    setOpenDropdownId(null);
  };

  // =========================
  // TABS
  // =========================
  const tabs = useMemo(
    () => [
      {
        label: "All",
        value: "All",
        count: counts.all,
      },
      {
        label: "Recent",
        value: "Recent",
        count: counts.recent,
      },
    ],
    [counts]
  );

  // =========================
  // SELECT ALL
  // =========================
  const allSelectedOnPage =
    deliveryChallans.length > 0 &&
    deliveryChallans.every((item) =>
      selectedChallans.has(item._id)
    );

  // =========================
  // UI
  // =========================
  return (
    <div className="p-4">
      {/* HEADER */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "black",
            fontSize: 22,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
          }}
        >
          Delivery Challan
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <DateFilterDropdown
            onDateChange={({ startDate, endDate }) => {
              setStartDate(startDate || "");
              setEndDate(endDate || "");
              setStatusFilter("All");
            }}
          />

          {hasPermission(
            user,
            "Delivery Challan",
            "create"
          ) && (
              <Link
                to="/createdeliverychallan"
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
                + Add Delivery Challan
              </Link>
            )}
        </div>
      </div>

      {/* MAIN */}
      <div
        style={{
          width: '100%',
          minHeight: 'auto',
          maxHeight: 'calc(100vh - 160px)',
          padding: 16,
          background: 'white',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: '100%',
            height: "33px",
          }}
        >
          {/* tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              flexWrap: "wrap",
              maxWidth: '50%',
              width: "fit-content",
              height: "33px",
            }}
          >
            {tabs.map((tab) => (
              <div
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setCurrentPage(1);
                  setStartDate("");
                  setEndDate("");
                }}
                style={{
                  padding: "4px 12px",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                  cursor: "pointer",
                  background:
                    statusFilter === tab.value
                      ? "white"
                      : "transparent",
                  boxShadow:
                    statusFilter === tab.value
                      ? "0 1px 4px rgba(0,0,0,0.1)"
                      : "none",
                }}
              >
                {tab.label}
                <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          {/* actions */}
          <div
            style={{
              display: "inline-flex",
              justifyContent: "end",
              alignItems: "center",
              gap: 16,
              width: '50%',
              height: "33px",
            }}
          >
            {/* {selectedChallans.size > 0 && (
              <button
                onClick={handleBulkDelete}
                style={{
                  border: "none",
                  background: "#dc3545",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Delete ({selectedChallans.size})
              </button>
            )} */}

            {/* search */}
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
              <IoIosSearch style={{ fontSize: '25px' }} />

              <input
                type="search"
                placeholder="Search challan..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
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

            {/* export */}
            {hasPermission(
              user,
              "Delivery Challan",
              "export"
            ) && (
                <>
                  <button
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
                      cursor: deliveryChallans.length > 0 ? "pointer" : "not-allowed",
                      fontFamily: "Inter, sans-serif",
                      fontSize: 14,
                      fontWeight: 400,
                      color: "#0E101A",
                      height: "33px",
                      opacity: deliveryChallans.length > 0 ? 1 : 0.5,
                    }}
                  >
                    <TbFileExport className="fs-5 text-secondary" />
                    Export
                  </button>
                </>
              )}
          </div>
        </div>

        {/* TABLE */}
        <div
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
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                height: "38px",
              }}
            >
              <tr style={{ background: "#F3F8FB", }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 80,
                    fontWeight: '400'
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      style={{ width: 18, height: 18 }}
                      onChange={(e) =>
                        handleToggleSelectAll(
                          e.target.checked
                        )
                      }
                    />
                    Challan No.
                  </div>
                </th>

                <th style={{
                  textAlign: "left",
                  padding: "4px 16px",
                  color: "#727681",
                  fontSize: 14,
                  width: 200,
                  fontWeight: '400'
                }}>
                  Customer Name
                </th>

                <th style={{
                  textAlign: "left",
                  padding: "4px 16px",
                  color: "#727681",
                  fontSize: 14,
                  width: 160,
                  fontWeight: '400'
                }}>
                  Date
                </th>

                <th style={{
                  textAlign: "left",
                  padding: "4px 16px",
                  color: "#727681",
                  fontSize: 14,
                  width: 112,
                  fontWeight: '400'
                }}>
                  Items
                </th>

                <th style={{
                  textAlign: "left",
                  padding: "4px 16px",
                  color: "#727681",
                  fontSize: 14,
                  width: 100,
                  fontWeight: '400'
                }}>
                  Vehicle
                </th>

                <th style={{
                  textAlign: "left",
                  padding: "4px 16px",
                  color: "#727681",
                  fontSize: 14,
                  width: 100,
                  fontWeight: '400'
                }}>
                  E-Way Bill
                </th>

                <th style={{
                  textAlign: "left",
                  padding: "4px 16px",
                  color: "#727681",
                  fontSize: 14,
                  width: 100,
                  fontWeight: '400'
                }}>
                  Convert
                </th>

                <th style={{
                  textAlign: "center",
                  padding: "4px 16px",
                  color: "#727681",
                  fontSize: 14,
                  width: 100,
                  fontWeight: '400'
                }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="8" className="text-center py-4">
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : deliveryChallans.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-5 text-muted"
                  >
                    No Delivery Challan Found
                  </td>
                </tr>
              ) : (
                deliveryChallans.map((ch) => {
                  const totalQty =
                    ch?.items?.reduce(
                      (acc, item) =>
                        acc +
                        (Number(item?.qty) || 0),
                      0
                    ) || 0;

                  return (
                    <tr
                      key={ch._id}
                      onClick={() =>
                        handleViewDetails(ch)
                      }
                      style={{ borderBottom: "1px solid #EAEAEA", cursor: 'pointer' }}
                    >
                      {/* checkbox */}
                      <td style={{ padding: "8px 16px", verticalAlign: "middle", height: '46px', }}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 12 }}
                        >
                          <input
                            type="checkbox"
                            style={{ width: 18, height: 18, }}
                            checked={selectedChallans.has(
                              ch._id
                            )}
                            onChange={() =>
                              handleCheckboxChange(
                                ch._id
                              )
                            }
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                color: "#0E101A",
                                whiteSpace: "nowrap",
                                display: "flex",
                                gap: "5px",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              {ch?.challanNo || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* customer */}
                      <td style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}>
                        <span> {ch?.customerId?.name ||
                          "N/A"}</span>
                      </td>

                      {/* date */}
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A", }}>
                        {ch?.challanDate
                          ? new Date(
                            ch.challanDate
                          ).toLocaleDateString()
                          : "N/A"}
                      </td>

                      {/* items */}
                      <td style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}>
                        {totalQty}
                      </td>

                      {/* vehicle */}
                      <td style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}>
                        {ch?.vehicleId
                          ?.vehicleNumber ||
                          ch?.vehicleNo ||
                          "N/A"}
                      </td>

                      {/* eway */}
                      <td style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}>
                        {ch?.ewayBillNo || "N/A"}
                      </td>

                      {/* convert */}
                      {/* convert button in table row — replace existing */}
                      {/* <td
                        style={{
                          padding: 12,
                          textAlign: "center",
                        }}
                      >
                        <button
                          onClick={(e) =>
                            toggleConvertDropdown(
                              e,
                              ch._id
                            )
                          }
                          disabled={
                            convertingId === ch._id
                          }
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 10px",
                            border:
                              "1px solid #1F7FFF",
                            background: "white",
                            color: "#1F7FFF",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          {convertingId === ch._id
                            ? "Processing..."
                            : "Convert"}

                          <IoIosArrowDown />
                        </button>
                      </td> */}
                      {/* <td  style={{ padding: "8px 16px", fontSize: 14 }}>
                        <button
                          onClick={(e) => toggleConvertDropdown(e, ch._id)}
                          disabled={convertingId === ch._id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 10px",
                            border: `1px solid ${ch.generatedInvoice ? "#28a745" : "#1F7FFF"}`,
                            background: "white",
                            color: ch.generatedInvoice ? "#28a745" : "#1F7FFF",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          {convertingId === ch._id
                            ? "Processing..."
                            : ch.generatedInvoice
                              ? "Converted ✓"
                              : "Convert"}
                          <IoIosArrowDown />
                        </button>
                      </td> */}
                      <td style={{ padding: "6px 16px" }}>
                        <button
                          onClick={(e) => toggleConvertDropdown(e, ch._id)}
                          disabled={convertingId === ch._id}
                          style={{
                            padding: "4px 12px",
                            background: ch.generatedInvoice ? "#E5E7EB" : "#f3f7ff",
                            color: ch.generatedInvoice ? "#6B7280" : "#3b82f6",
                            border: ch.generatedInvoice
                              ? "1px solid #D1D5DB"
                              : "1px solid #dbeafe",
                            borderRadius: "16px",
                            cursor:
                              convertingId === ch._id || ch.generatedInvoice
                                ? "not-allowed"
                                : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "13px",
                            fontWeight: 500,
                            opacity: convertingId === ch._id ? 0.6 : 1,
                          }}
                        >
                          {convertingId === ch._id
                            ? "Converting..."
                            : ch.generatedInvoice
                              ? "Converted"
                              : "Convert to"}

                          {!ch.generatedInvoice && (
                            <span
                              style={{
                                display: "inline-block",
                                transition: "0.3s",
                              }}
                            >
                              <IoIosArrowDown size={14} />
                            </span>
                          )}
                        </button>
                      </td>

                      {/* action */}
                      <td
                        style={{
                          padding: "4px 16px",
                          position: "relative",
                          overflow: "visible",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) =>
                            toggleActionDropdown(
                              e,
                              ch._id
                            )
                          }
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                          aria-label="actions"
                        >
                          <HiOutlineDotsHorizontal
                            size={18} color="grey"
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="mt-3">
          <Pagination
            currentPage={currentPage}
            total={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) =>
              setCurrentPage(page)
            }
            onItemsPerPageChange={(limit) => {
              setItemsPerPage(limit);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* CONVERT DROPDOWN */}
      {/* {openConvertDropdownId && (
        <div
          ref={convertDropdownRef}
          style={{
            position: "absolute",
            left: convertDropdownPos.x,
            top: convertDropdownPos.y,
            background: "white",
            border: "1px solid #EAEAEA",
            borderRadius: 8,
            minWidth: 190,
            zIndex: 999,
            boxShadow:
              "0px 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {(() => {
            const challan = deliveryChallans.find(
              (item) => item._id === openConvertDropdownId
            );
            const alreadyConverted = !!challan?.generatedInvoice;

            return (
              <>
               
                {alreadyConverted ? (
                  
                  <button
                    onClick={() => {
                      setOpenConvertDropdownId(null);
                      navigate(
                        `/show-invoice/${challan.generatedInvoice}`
                      );
                    }}
                    style={dropdownButtonStyle}
                  >
                    <FaFileInvoice />
                    View Invoice
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (challan) convertToInvoice(challan);
                    }}
                    disabled={convertingId === openConvertDropdownId}
                    style={{
                      ...dropdownButtonStyle,
                      opacity:
                        convertingId === openConvertDropdownId
                          ? 0.6
                          : 1,
                      cursor:
                        convertingId === openConvertDropdownId
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    <FaFileInvoice />
                    {convertingId === openConvertDropdownId
                      ? "Converting..."
                      : "Tax Invoice"}
                  </button>
                )}

                <button
                  onClick={() => {
                    const challan =
                      deliveryChallans.find(
                        (item) =>
                          item._id ===
                          openConvertDropdownId
                      );

                    if (challan)
                      generateEwayBill(challan);
                  }}
                  style={dropdownButtonStyle}
                >
                  <FaTruckFast />
                  E-Way Bill
                </button>
              </>
            );
          })()}
        </div>
      )} */}
      {openConvertDropdownId && (
        <div
          ref={convertDropdownRef}
          style={{
            position: "absolute",
            left: convertDropdownPos.x,
            top: convertDropdownPos.y,
            width: "180px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
            overflow: "hidden",
            padding: "6px 0",
          }}
        >
          {(() => {
            const challan = deliveryChallans.find(
              (item) => item._id === openConvertDropdownId
            );

            const alreadyConverted = !!challan?.generatedInvoice;

            return (
              <>
                {alreadyConverted ? (
                  <div
                    onClick={() => {
                      setOpenConvertDropdownId(null);
                      navigate(
                        `/show-invoice/${challan.generatedInvoice}`
                      );
                    }}
                    style={{
                      padding: "8px 16px",
                      cursor: "pointer",
                      fontSize: "14px",
                      transition: "0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#f3f7ff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <FaFileInvoice size={16} color="#3b82f6" />
                    View Invoice
                  </div>
                ) : (
                  <div
                    onClick={() => {
                      if (
                        challan &&
                        convertingId !== openConvertDropdownId
                      ) {
                        convertToInvoice(challan);
                      }
                    }}
                    style={{
                      padding: "8px 16px",
                      cursor:
                        convertingId === openConvertDropdownId
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "14px",
                      transition: "0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      opacity:
                        convertingId === openConvertDropdownId
                          ? 0.6
                          : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (
                        convertingId !== openConvertDropdownId
                      ) {
                        e.currentTarget.style.background =
                          "#f3f7ff";
                      }
                    }}
                    onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      "transparent")
                    }
                  >
                    <FaFileInvoice size={16} color="#3b82f6" />
                    {convertingId === openConvertDropdownId
                      ? "Converting..."
                      : "Tax Invoice"}
                  </div>
                )}

                <div
                  onClick={() => {
                    const challan = deliveryChallans.find(
                      (item) =>
                        item._id === openConvertDropdownId
                    );

                    if (challan) generateEwayBill(challan);
                  }}
                  style={{
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f3f7ff")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <FaTruckFast size={16} color="#3b82f6" />
                  E-Way Bill
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ACTION DROPDOWN */}
      {/* {openDropdownId && (
        <div
          ref={dropdownRef}
          style={{
  position: "absolute",
  left: dropdownPos.x,
  top: dropdownPos.y,
  background: "white",
  padding: 8,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  minWidth: 180,
  display: "flex",
  flexDirection: "column",
  gap: 4,
  zIndex: 999999,
}}
        >
          
          <button
            onClick={() => {
              const challan =
                deliveryChallans.find(
                  (item) =>
                    item._id === openDropdownId
                );

              if (challan)
                handleViewDetails(challan);
            }}
            style={dropdownButtonStyle}
          >
            <TbEye />
            View
          </button>

         
          {hasPermission(
            user,
            "Delivery Challan",
            "edit"
          ) && (
              <button
                onClick={() => {
                  const challan =
                    deliveryChallans.find(
                      (item) =>
                        item._id ===
                        openDropdownId
                    );

                  if (challan)
                    handleEdit(challan);
                }}
                style={dropdownButtonStyle}
              >
                <TbEdit />
                Edit
              </button>
            )}

          
          <button
            onClick={() => {
              const challan =
                deliveryChallans.find(
                  (item) =>
                    item._id === openDropdownId
                );

              if (challan)
                handlePrint(challan);
            }}
            style={dropdownButtonStyle}
          >
            <IoPrintOutline />
            Print
          </button>

        
          {hasPermission(
            user,
            "Delivery Challan",
            "delete"
          ) && (
              <button
                onClick={() =>
                  handleDeleteChallan(
                    openDropdownId
                  )
                }
                style={{
                  ...dropdownButtonStyle,
                  color: "#dc3545",
                }}
              >
                <TbTrash />
                Delete
              </button>
            )}
        </div>
      )} */}
      {openDropdownId && (
        <div
          style={{
            position: "fixed",
            top: dropdownPos.y,
            left: dropdownPos.x,
            zIndex: 999999,
          }}
        >
          <div
            ref={dropdownRef}
            style={{
              background: "white",
              padding: 8,
              borderRadius: 12,
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              minWidth: 180,
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {/* View */}
            <div
              onClick={() => {
                const challan = deliveryChallans.find(
                  (item) => item._id === openDropdownId
                );
                if (challan) handleViewDetails(challan);
              }}
              style={menuItemStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e3f2fd";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <TbEye />
              <span>View</span>
            </div>

            {/* Edit */}
            {hasPermission(user, "Delivery Challan", "edit") && (
              <div
                onClick={() => {
                  const challan = deliveryChallans.find(
                    (item) => item._id === openDropdownId
                  );
                  if (challan) handleEdit(challan);
                }}
                style={menuItemStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e3f2fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <TbEdit />
                <span>Edit</span>
              </div>
            )}

            {/* Print */}
            <div
              onClick={() => {
                const challan = deliveryChallans.find(
                  (item) => item._id === openDropdownId
                );
                if (challan) handlePrint(challan);
              }}
              style={menuItemStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e3f2fd";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <IoPrintOutline />
              <span>Print</span>
            </div>

            {/* Delete */}
            {hasPermission(user, "Delivery Challan", "delete") && (
              <div
                onClick={() =>
                  handleDeleteChallan(openDropdownId)
                }
                style={{
                  ...menuItemStyle,
                  color: "#dc3545",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e3f2fd";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <TbTrash />
                <span>Delete</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      <DeleteModal
        show={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Delivery Challan"
        message={
          deleteMode === "bulk"
            ? `Are you sure you want to delete ${selectedChallans.size} selected delivery challan(s)?`
            : "Are you sure you want to delete this delivery challan?"
        }
      />
    </div>
  );
};

const dropdownButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: 16,
  fontWeight: 400,
  cursor: "pointer",
  borderRadius: 8,
  border: "none",
  background: "transparent",
  width: "100%",
  textAlign: "left",
};

export default DeliverychallanList;