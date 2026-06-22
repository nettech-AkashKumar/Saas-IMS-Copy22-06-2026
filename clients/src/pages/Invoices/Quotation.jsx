import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { TbEye, TbTrash, TbEdit } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { MdNavigateNext, MdOutlineKeyboardArrowUp } from "react-icons/md";
import { GrFormPrevious, GrShareOption } from "react-icons/gr";
import { HiDotsHorizontal, HiDotsVertical } from "react-icons/hi"; // Add this for three dots
import { FaFileInvoice } from "react-icons/fa"; // Add this for proforma icon
import DeleteAlert from "../../utils/sweetAlert/DeleteAlert";
import BASE_URL from "../config/config";
import { toast } from "react-toastify";
import api from "../../pages/config/axiosInstance";
import { Link, NavLink } from "react-router-dom";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasPermission } from "../../utils/permission/hasPermission";
import { useAuth } from "../../components/auth/AuthContext";
import { GoPlus } from "react-icons/go";
import { RiListView, RiDeleteBinLine } from "react-icons/ri";
import { LuCalendarMinus2 } from "react-icons/lu";
import { IoPrintOutline } from "react-icons/io5";
import { QuotationContent } from "../../pages/Invoices/PreviewQuotation"
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";

function Quotation() {
  const { user } = useAuth();
  const [quotation, setQuotation] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null); // Track which dropdown is open
  const navigate = useNavigate();
  const [shareLoadingId, setShareLoadingId] = useState(null);
  const [convertingId, setConvertingId] = useState(null); // Track which quotation is being converted
  const [activeRow, setActiveRow] = useState(null);
  const dropdownRef = useRef(null);
  const convertDropdownRef = useRef(null);
  const [openConvertDropdownId, setOpenConvertDropdownId] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [convertDropdownPos, setConvertDropdownPos] = useState({ x: 0, y: 0 });
  const [convertOpenUpwards, setConvertOpenUpwards] = useState(false);

  const getStatusBadge = (status) => {
    switch (status) {
      case "draft":
      case "active":
        case "converted_to_proforma":
    case "converted_to_invoice":
    case "converted_to_order":
        return {
          bg: "#d1fae5",
          color: "#059669",
          text: "Active",
        };
      case "revised":
        return {
          bg: "#fef3c7",
          color: "#d97706",
          text: "Revised",
        };
      default:
       return null;
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      // close action dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpenDropdownId(null);
      }

      // close convert dropdown
      if (
        convertDropdownRef.current &&
        !convertDropdownRef.current.contains(event.target)
      ) {
        setOpenConvertDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


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

  // Fetch quotations from backend
  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search,
        customerId: customer || undefined,
        // startDate,
        // endDate,
      };
      // Add date range for "Recent" tab
      if (activeTab === "Recent") {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        params.startDate = sevenDaysAgo.toISOString();
        params.endDate = today.toISOString();
      } else if (startDate && endDate) {
        // Use custom dates if provided
        params.startDate = startDate;
        params.endDate = endDate;
      }
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      const res = await api.get("/api/quotations", { params });
      if (res.data?.success && Array.isArray(res.data.quotations)) {
        setQuotation(res.data.quotations);
        setTotal(res.data.total || 0);
        // console.log('eressdr', res.data.quotations)
      } else {
        setQuotation([]);
        setTotal(0);
      }
    } catch (err) {
      // console.error("Failed to fetch quotations:", err);
      toast.error(err?.response?.data?.message || "Failed to fetch quotations");
      setQuotation([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotations();
  }, [page, limit, search, customer, invoiceId, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [search, customer, startDate, endDate]);

  const handleTabClick = (tabLabel) => {
    setActiveTab(tabLabel);
    setPage(1); // Reset to first page when changing tabs
  };

  const totalPages = Math.ceil(total / limit);

  const [summary, setSummary] = useState({
    subTotal: 0,
    discountSum: 0,
    taxableSum: 0,
    cgst: 0,
    sgst: 0,
    taxSum: 0,
    shippingCost: 0,
    labourCost: 0,
    orderDiscount: 0,
    roundOff: 0,
    grandTotal: 0,
  });

  useEffect(() => {
    if (!Array.isArray(quotation)) return;
    const allItems = quotation.flatMap((inv) =>
      Array.isArray(inv.items) ? inv.items : [],
    );
    let subTotal = 0;
    let discountSum = 0;
    let taxableSum = 0;
    let taxSum = 0;
    let grandTotal = 0;

    allItems.forEach((item) => {
      const qty = Number(item.qty || 1);
      const price = Number(item.unitPrice || 0);
      const discountAmount = Number(item.discountAmt || 0);
      const taxableAmount = Math.max(0, qty * price - discountAmount);
      const taxRate = Number(item.taxRate || 0);
      const taxAmount =
        item.taxAmount !== undefined
          ? Number(item.taxAmount || 0)
          : (taxableAmount * taxRate) / 100;
      const lineTotal =
        item.amount !== undefined
          ? Number(item.amount || 0)
          : taxableAmount + taxAmount;

      subTotal += qty * price;
      discountSum += discountAmount;
      taxableSum += taxableAmount;
      taxSum += taxAmount;
      grandTotal += lineTotal;
    });

    const cgst = taxSum / 2;
    const sgst = taxSum / 2;

    setSummary({
      subTotal,
      discountSum,
      taxableSum,
      cgst,
      sgst,
      taxSum,
      grandTotal,
    });
  }, [quotation]);

  const handleBulkDelete = async () => {
    const confirmed = await DeleteAlert({});
    if (!confirmed) return;
    try {
      await api.post("/api/quotation/bulk-delete", {
        ids: selectedInvoices,
      });
      toast.success("Selected quotations deleted");
      setSelectedInvoices([]);
      fetchQuotations();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error(error?.response?.data?.message || "Unauthorized. Please login again");
      } else if (error.response?.status === 403) {
        toast.error(error?.response?.data?.message || "You don't have permission to delete quotations");
      } else {
        toast.error("Bulk delete quotations failed. Please try again");
      }
    }
  };
  // Calculate total quantity from items
  const calculateTotalQty = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.qty || 0), 0);
  };

  // Convert to Proforma Invoice
  const convertToProforma = async (quotationData) => {
    setConvertingId(quotationData._id);
    try {
      const response = await api.post(`/api/quotations/${quotationData._id}/convert-to-proforma`);
      if (response.data.success) {
        toast.success("Successfully converted to Proforma Invoice!");
        navigate(`/create-proforma/${response.data.proforma._id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to convert to Proforma Invoice");
    } finally {
      setConvertingId(null);
      setOpenDropdownId(null);
    }
  };

  const shareQuotation = async (quotationMongoId, customerEmail, customerPhone) => {
    try {
      setShareLoadingId(quotationMongoId);
      await api.post(`/api/quotation/email/${encodeURIComponent(quotationMongoId)}`, { email: customerEmail || undefined });
      await api.post(`/api/quotation/whatsapp/${encodeURIComponent(quotationMongoId)}`, { phone: customerPhone || undefined });
      await api.post(`/api/quotation/sms/${encodeURIComponent(quotationMongoId)}`, { phone: customerPhone || undefined });
      toast.success("Quotation shared.");
    } catch (e) {
      // console.error(e);
      toast.error(e?.response?.data?.message || "Failed to share quotation.");
    } finally {
      setShareLoadingId(null);
    }
  };

  const [viewBarcode, setViewBarcode] = useState([]);
  const [viewOptions, setViewOptions] = useState([]);

  const buttonRefs = useRef([]);
  const modelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideModel = modelRef.current && modelRef.current.contains(event.target);
      const isClickInsideButton = buttonRefs.current[viewBarcode] && buttonRefs.current[viewBarcode].contains(event.target);
      buttonRefs.current[viewOptions] && buttonRefs.current[viewOptions].contains(event.target);
      if (!isClickInsideModel && !isClickInsideButton) {
        setViewBarcode(false);
        setViewOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode, viewOptions]);

  const tabs = [
    { label: "All", count: total, active: activeTab === "All" },
    { label: "Recent", count: total, active: activeTab === "Recent" },
  ];

const handleExcel = async () => {
  // Get selected IDs - works for both Array and Set
  const selectedIds = Array.isArray(selectedInvoices) 
    ? selectedInvoices 
    : Array.from(selectedInvoices);
  
  if (selectedIds.length === 0) {
    toast.error("Select at least 1 row to export data");
    return;
  }

  try {
    // Get selected rows data
    const selectedRows = quotation.filter(q => selectedIds.includes(q._id));
    
    if (selectedRows.length === 0) {
      toast.error("No data available to export");
      return;
    }

    // Define columns for Excel
    const tableColumns = [
      "Quotation No.",
      "Customer Name",
      "Amount",
      "Status",
      "Quotation Date",
    ];

    // Prepare table rows
    const tableRows = selectedRows.map((q) => [
      q.quotationNo || "-",
      q.customerId?.name || "-",
      (q.grandTotal || 0).toFixed(2),
      q.status?.toUpperCase() || "DRAFT",
      q.quotationDate ? format(new Date(q.quotationDate), "dd MMM yyyy") : "-",
      // q.validUntil ? format(new Date(q.validUntil), "dd MMM yyyy") : "-"
    ]);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Quotations");

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
    [20, 30, 15, 20, 20, 20].forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });

    // Add data rows
    tableRows.forEach((row) => worksheet.addRow(row));

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `quotations_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );
    
    toast.success(`Exported ${selectedRows.length} quotation(s) as Excel`);
    
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error(error?.message || "Failed to generate Excel file");
  }
};

  const handleNegotiate = (quotationData) => {
    // Navigate to PROFORMA creation page with quotation data
    navigate("/create-proforma", {
      state: {
        sourceQuotation: quotationData,
        isFromQuotation: true
      }
    });
  };

  const canEditQuotation = (quotation) => {
    const nonEditableStatuses = ["converted_to_proforma", "converted_to_invoice", "converted_to_order"];
    return !nonEditableStatuses.includes(quotation.status);
  };

  const canConvertToProforma = (quotation) => {
    const convertibleStatuses = ["draft", "sent", "accepted"];
    return convertibleStatuses.includes(quotation.status);
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
            Quotation
          </h2>
        </div>
        {hasPermission(user, "Quotation", "create") && (
          <Link to="/create-quotition">
            <button
              title="Create Quotation"
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
              + Create Quotation
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
            {/* {selectedInvoices.length > 0 && (
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
                Delete ({selectedInvoices.length})
              </button>
            )} */}

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
                placeholder="Search by Quotation Number..."
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
            {hasPermission(user, "Quotation", "export") && (
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
                    width: 80,
                    fontWeight: "400",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="checkbox"
                      id="select-all"
                      style={{ width: 18, height: 18 }}
                      checked={(() => {
                        const allIds = quotation.map((i) => i._id).filter(Boolean);
                        const uniqueSelected = new Set(selectedInvoices);
                        return allIds.length > 0 && uniqueSelected.size === allIds.length;
                      })()}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(quotation.map((i) => i._id).filter(Boolean));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                    />
                    Quotation No
                  </div>
                </th>
                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: 200, fontWeight: "400" }}>
                  Customer Name
                </th>
                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: 200, fontWeight: "400" }}>
                  Quantity
                </th>
                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: 112, fontWeight: "400" }}>
                  Amount
                </th>
                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: 100, fontWeight: "400" }}>
                  Convert
                </th>
                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: 100, fontWeight: "400" }}>
                  Status
                </th>
                <th style={{ textAlign: "center", padding: "4px 16px", color: "#727681", fontSize: 14, width: 120, fontWeight: "400" }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : quotation.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-3">
                    <span style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "center", fontSize: 14, color: "#6C748C" }}>
                      No Quotation Found
                    </span>
                  </td>
                </tr>
              ) : (
                quotation.map((inv, idx) => (
                  <tr
                    key={inv._id || idx}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                      height: "46px",
                      cursor: "pointer"
                    }}
                    className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                     onClick={() => {
    // Navigate to view page when row is clicked
    navigate("/create-quotition", {
      state: { viewQuotation: inv, mode: "view" }
    });
  }}
                  >
                    <td style={{ padding: "8px 16px", verticalAlign: "middle", height: "46px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <input
                          type="checkbox"
                          style={{ width: 18, height: 18 }}
                          checked={selectedInvoices.includes(inv._id)}
                          onChange={(e) => {
                             e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedInvoices((prev) => [...prev, inv._id]);
                            } else {
                              setSelectedInvoices((prev) => prev.filter((id) => id !== inv._id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div style={{ fontSize: 14, color: "#0E101A", whiteSpace: "nowrap", display: "flex", gap: "5px", alignItems: "center" }}>
                          <div>{inv.quotationNo}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      <span>{inv.customerId?.name || inv.customerId?.email || inv.customerId?._id || "-"}</span>
                    </td>
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      <span>{inv.items[0]?.qty || "-"}</span>
                    </td>

                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      ₹{inv.grandTotal?.toFixed(2) || "0.00"}
                    </td>

                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      {/* <span className={`badge badge-soft-${inv.status === "paid" ? "success" : "danger"} badge-xs shadow-none`}>
                        <i className="ti ti-point-filled me-1" />
                        {inv.status || "-"}
                      </span> */}
                      {/* for quotation convert start */}
                      {inv.status !== 'revised' && (
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          {/* Button */}
                          <button
                            // onClick={() => setOpenConvertDropdownId(openConvertDropdownId === inv._id ? null : inv._id)}
                            onClick={(e) => {
                              e.stopPropagation();

                              const rect = e.currentTarget.getBoundingClientRect();

                              setOpenConvertDropdownId(
                                openConvertDropdownId === inv._id ? null : inv._id
                              );

                              const dropdownHeight = 180;

                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;

                              if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
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
                          >
                            Convert to
                            <span
                              style={{
                                transform: openConvertDropdownId === inv._id ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "0.3s",
                                display: "inline-block",
                              }}
                            >
                              <MdOutlineKeyboardArrowUp />
                            </span>
                          </button>

                          {/* Dropdown */}
                          {openConvertDropdownId === inv._id && (
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
                                padding: "8px 8px",
                              }}
                            >
                              <div
                                onClick={(e) => { e.stopPropagation(); convertToProforma(inv)}}
                                style={{
                                  padding: "8px 20px",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  transition: "0.2s",
                                  borderRadius: "18px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f7ff")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                Proforma Invoice
                              </div>
                              <div
                                onClick={(e) => {
                                   e.stopPropagation();
                                  navigate("/create-sales-order", {
                                    state: {
                                      sourceQuotation: inv,
                                      isFromQuotation: true
                                    }
                                  });
                                  setOpenConvertDropdownId(null);
                                }}
                                style={{
                                  padding: "8px 20px",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  transition: "0.2s",
                                  borderRadius: "18px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f7ff")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                Sales Order
                              </div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Navigate to sales invoice creation with quotation data
                                  navigate("/createinvoice", {
                                    state: {
                                      sourceQuotation: inv,
                                      isFromQuotation: true
                                    }
                                  });
                                  setOpenConvertDropdownId(null);
                                }}
                                style={{
                                  padding: "8px 20px",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                  transition: "0.2s",
                                  borderRadius: "18px",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f7ff")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                Sales Invoice
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px 16px", fontSize: 14 }}>
                      {getStatusBadge(inv.status) && (
                        <span style={{
                          backgroundColor: getStatusBadge(inv.status).bg,
                          color: getStatusBadge(inv.status).color,
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500",
                          display: "inline-block"
                        }}>
                          {getStatusBadge(inv.status).text}
                        </span>
                      )}
                    </td>

                    {/* Action Column with Three Dots Menu */}

                    <td onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
                      <div className="d-flex align-items-center justify-content-center">
                        {/* Three Dots Button */}
                        <div
                          className=""
                          // onClick={() => setOpenDropdownId(openDropdownId === inv._id ? null : inv._id)}
                          onClick={(e) => {
                            e.stopPropagation();

                            const rect = e.currentTarget.getBoundingClientRect();

                            setOpenDropdownId(openDropdownId === inv._id ? null : inv._id);

                            const dropdownHeight = 220;

                            const spaceBelow = window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;

                            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                              setOpenUpwards(true);

                              setDropdownPos({
                                x: rect.left,
                                y: rect.top,
                              });
                            } else {
                              setOpenUpwards(false);

                              setDropdownPos({
                                x: rect.left,
                                y: rect.bottom + 6,
                              });
                            }
                          }}
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
                        {openDropdownId === inv._id && (
                          <div
                            ref={dropdownRef}
                            style={{
                              position: "fixed",
                              top: openUpwards
                                ? dropdownPos.y - 220
                                : dropdownPos.y,
                              left: dropdownPos.x - 120,
                              width: "140px",
                              background: "#fff",
                              borderRadius: "18px",
                              boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
                              border: "1px solid #e5e7eb",
                              zIndex: 1000,
                              overflow: "hidden",
                              padding: "8px 8px",
                            }}
                          >
                            {/* view */}
                            {inv.status !== 'revised' && (
                              <>
                                <Link
                                  to="/create-quotition"
                                  state={{ viewQuotation: inv, mode: "view" }}
                                  style={{ textDecoration: "none" }}
                                >
                                  <div
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
                                    <RiListView size={24} />
                                    <span style={{ fontSize: "14px", color: "black" }}>View</span>
                                  </div>
                                </Link>

                                {/* edit */}
                                <Link
                                  // to="/create-quotition"
                                  to={`/create-quotition`}
                                  state={{ editQuotation: inv, mode: "edit" }}
                                  style={{ textDecoration: "none" }}
                                >
                                  <div
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
                                      fontSize: 16,
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
                                </Link>
                              </>
                            )}
                            {/* print */}

                            <div
                              onClick={async () => {
                                try {
                                  // Show loading toast
                                  toast.info("Preparing print...");

                                  // Fetch the full quotation data
                                  const response = await api.get(`/api/quotations/${inv._id}`);
                                  if (response.data.success) {
                                    const quotationData = response.data.quotation;

                                    // Fetch company data
                                    const companyRes = await api.get(`/api/companyprofile/get`);
                                    const companyData = companyRes.data.data;

                                    // Fetch terms and template
                                    const termsRes = await api.get("/api/notes-terms-settings");
                                    const terms = termsRes.data.data;

                                    const templateRes = await api.get("/api/print-templates/all");
                                    const template = templateRes.data.data;

                                    // Create a temporary hidden div with the quotation content
                                    const tempDiv = document.createElement('div');
                                    tempDiv.style.position = 'absolute';
                                    tempDiv.style.left = '-9999px';
                                    tempDiv.style.top = '-9999px';
                                    document.body.appendChild(tempDiv);

                                    // Create a React root and render the QuotationContent
                                    const { createRoot } = await import('react-dom/client');
                                    const root = createRoot(tempDiv);

                                    root.render(
                                      <QuotationContent
                                        quotation={quotationData}
                                        customer={quotationData.customerId}
                                        companyData={companyData}
                                        banks={[]}
                                        terms={terms}
                                        template={template}
                                        taxSettings={quotationData.taxSettings || { enableGSTBilling: true }}
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
                  <title>Quotation ${quotationData.quotationNo || ''}</title>
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
                                  toast.error("Failed to load quotation for printing");
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
                                fontSize: 16,
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

                            {/* Delete Button ONLY */}
                            {hasPermission(user, "Quotation", "delete") && (
                              <div
                                onClick={async () => {
                                  const confirmed = await DeleteAlert({});
                                  if (confirmed) {
                                    try {
                                      await api.delete(`/api/quotations/${inv._id}`);
                                      toast.success("Quotation deleted successfully");
                                      fetchQuotations();
                                    } catch (error) {
                                      toast.error(error?.response?.data?.message || "Failed to delete quotation");
                                    }
                                  }
                                  setOpenDropdownId(null);
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
                                  fontSize: 16,
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
              setLimit(n);
              setPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Quotation;