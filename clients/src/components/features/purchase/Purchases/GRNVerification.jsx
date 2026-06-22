import React, { useState, useRef, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { MdAddShoppingCart } from "react-icons/md";
import { Link } from "react-router-dom";
import { TbFileExport } from "react-icons/tb";
import { IoPrintOutline } from "react-icons/io5";
import { FaMoneyBillWave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import EmptyGRN from "./EmptyGRN";
import { hasPermission } from "../../../../utils/permission/hasPermission";


// Components
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import ViewDetailsImg from "../../../../assets/images/view-details.png";
import EditICONImg from "../../../../assets/images/edit.png";
import CreditNoteImg from "../../../../assets/images/create-creditnote.png";
import DatePicker from "../../../DateFilterDropdown";
import Pagination from "../../../../components/Pagination";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useAuth } from "../../../auth/AuthContext";

const tabsData = [
  { label: "All Orders", count: 0, value: "all" },
  // { label: "Pending", count: 0, value: "pending" },
  { label: "Partially Received", count: 0, value: "partial" },
  { label: "Fully Received", count: 0, value: "full" },
  { label: "Over Received", count: 0, value: "over" },
];

const statusStyles = {
  full: {
    color: "#059669",
    bg: "#D1FAE5",
    label: "Full Received",
  },
  partial: {
    color: "#D97706",
    bg: "#FEF3C7",
    label: "Partial Received",
  },
  over: {
    color: "#DC2626",
    bg: "#FEE2E2",
    label: "Over Received",
  },
  pending: {
    color: "#6B7280",
    bg: "#F3F4F6",
    label: "Pending",
  },
  rejected: {
    color: "#DC2626",
    bg: "#FEE2E2",
    label: "Rejected",
  },
};

const menuItems = [
  {
    label: "Convert to Purchase",
    icon: <MdAddShoppingCart size={18} />,
    action: "convert-to-purchase",
    permission: "create"
  },
];


const getMenuItems = (order) => {
  // ✅ Check convertedToPurchase field instead of status
  const isConverted = order.convertedToPurchase === true;
  return [
    {
      label: isConverted ? "Convert to Purchase (Already Converted)" : "Convert to Purchase",
      icon: <MdAddShoppingCart
        size={18}
        style={{
          opacity: isConverted ? 0.4 : 1,
          color: isConverted ? "#999" : "inherit"
        }}
      />,
      action: "convert-to-purchase",
      permission: "create",
      disabled: isConverted,
      tooltip: isConverted ? "This GRN has already been converted to a Purchase" : ""
    }
  ];
};

export default function GRNVerification() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All Orders");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [initialTabs, setInitialTabs] = useState(tabsData);
  const [grns, setGrns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [activeRow, setActiveRow] = useState(null);
  const [openRow, setOpenRow] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const menuRef = useRef(null);

  // Mock stats
  const initialStats = [
    { title: "Total Purchase Value", value: "0", currency: "INR", image: "", link: "" },
    { title: "Total Order", value: "0", currency: "", image: "", link: "" },
    { title: "Average Purchasing", value: "0", currency: "INR", image: "", link: "" },
    { title: "Due Payments", value: "0", currency: "INR", image: "", link: "" },
  ];

const handleGRNAction = (grn, action) => {
  setSelectedInvoice(grn);

  switch (action) {
    case "convert-to-purchase":
      // ✅ Check if already converted using convertedToPurchase
      if (grn.convertedToPurchase === true) {
        toast.warning("This GRN has already been converted to a Purchase");
        setOpenMenu(null);
        return;
      }
      // Make sure the full grn object is passed
      navigate("/create-purchase", {
        state: {
          editPurchaseOrder: null,
          grnData: grn,
          mode: "convert-from-grn"
        }
      });
      break;
  }
  setOpenMenu(null);
};

  // ========== FETCH GRNs ==========
  const fetchGRNs = async (page = 1, status = "", limitOverride) => {
    try {
      setLoading(true);
      const currentLimit = limitOverride !== undefined ? limitOverride : itemsPerPage;

      const params = {
        page,
        limit: currentLimit,
        ...(search && { search }),
      };

      // Handle tab filtering
      let statusFilter = status;
      if (activeTab !== "All Orders") {
        const tabMap = {
          // "Pending": "pending",
          "Partially Received": "partial",
          "Fully Received": "full",
          "Over Received": "over"
        };
        statusFilter = tabMap[activeTab] || status;
      }
      if (statusFilter && statusFilter !== "all") {
        params.status = statusFilter;
      }

      if (selectedDateRange.startDate) {
        params.startDate = format(selectedDateRange.startDate, "yyyy-MM-dd");
      }
      if (selectedDateRange.endDate) {
        params.endDate = format(selectedDateRange.endDate, "yyyy-MM-dd");
      }

      const response = await api.get("/api/grn", { params });

      if (response.data.success) {
        setGrns(response.data.grns || []);
        setTotalCount(response.data.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
        if (response.data.pagination?.page) {
          setCurrentPage(response.data.pagination.page);
        }
        if (response.data.pagination?.limit) {
          setItemsPerPage(response.data.pagination.limit);
        }
        // Update tab counts
        updateTabCounts(response.data.grns || []);
      }
    } catch (error) {
      console.error("Fetch GRNs error:", error);
      toast.error("Failed to load GRNs");
    } finally {
      setLoading(false);
    }
  };

  // ========== UPDATE TAB COUNTS ==========
  const updateTabCounts = (grnList) => {
    const counts = {
      all: grnList.length,
      // pending: 0,
      partial: 0,
      full: 0,
      over: 0,
    };

    grnList.forEach(grn => {
      const status = getGRNStatus(grn);
      // if (status === "pending") counts.pending++;
      if (status === "partial") counts.partial++;
      else if (status === "full") counts.full++;
      else if (status === "over") counts.over++;
    });

    setInitialTabs([
      { ...tabsData[0], count: counts.all },
      { ...tabsData[1], count: counts.partial },
      { ...tabsData[2], count: counts.full },
      { ...tabsData[3], count: counts.over },
    ]);
  };

  // ========== GET GRN STATUS ==========
  const getGRNStatus = (grn) => {
    if (!grn || !grn.items || grn.items.length === 0) {
      return "pending";
    }

    let hasPartial = false;
    let hasFull = false;
    let hasOver = false;

    grn.items.forEach(item => {
      const totalReceived = (item.previousReceived || 0) + (item.receivingNow || 0);
      if (totalReceived > item.orderedQty) hasOver = true;
      else if (totalReceived === item.orderedQty) hasFull = true;
      else if (totalReceived > 0 && totalReceived < item.orderedQty) hasPartial = true;
    });

    if (hasOver) return "over";
    if (hasPartial) return "partial";
    if (hasFull) return "full";
    return "pending";
  };

  // ========== GET STATUS STYLE ==========
  const getStatusStyle = (grn) => {
    const status = getGRNStatus(grn);
    return statusStyles[status] || statusStyles.pending;
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchGRNs(currentPage);
  }, [currentPage, itemsPerPage, search, selectedDateRange]);

  // ========== HANDLERS ==========
  const handleTabChange = (tab) => {
    setActiveTab(tab.label);
    const statusMap = {
      // "Pending": "pending",
      "Partially Received": "partial",
      "Fully Received": "full",
      "Over Received": "over"
    };
    const status = statusMap[tab.label] || "";
    fetchGRNs(1, status);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    // Debounced search is handled by useEffect
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    const statusMap = {
      // "Pending": "pending",
      "Partially Received": "partial",
      "Fully Received": "full",
      "Over Received": "over"
    };
    const status = statusMap[activeTab] || "";
    fetchGRNs(page, status);
  };

  const handleItemsPerPageChange = (n) => {
    setItemsPerPage(n);
    setCurrentPage(1);
    const statusMap = {
      // "Pending": "pending",
      "Partially Received": "partial",
      "Fully Received": "full",
      "Over Received": "over"
    };
    const status = statusMap[activeTab] || "";
    fetchGRNs(1, status, n);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  };

  // ========== EXPORT TO EXCEL ==========
  const handleExportExcel = () => {
    try {
      if (selectedRowIds.size === 0) {
        toast.error("Please select at least one row to export");
        return;
      }

      const grnsToExport = grns.filter((grn) => selectedRowIds.has(grn._id));

      if (grnsToExport.length === 0) {
        toast.warn("No GRNs selected to export");
        return;
      }

      const excelData = grnsToExport.map((grn, index) => {
        const supplierName = grn.supplierId?.supplierName || "Unknown Supplier";
        const statusStyle = getStatusStyle(grn);
        const totalReceivedQty = grn.items?.reduce((sum, item) => sum + (item.receivingNow || 0), 0) || 0;

        return {
          "S.No": index + 1,
          "GRN No.": grn.grnNumber || "—",
          "PO No.": grn.purchaseOrderId?.purchaseNo || "—",
          "Supplier Name": supplierName,
          "Received Qty": totalReceivedQty,
          "Receive Date": formatDate(grn.receiveDate),
          "Status": statusStyle.label,
          "Total Amount": `₹${(grn.grandTotal || 0).toLocaleString("en-IN")}`,
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 8 },   // S.No
        { wch: 18 },  // GRN No.
        { wch: 18 },  // PO No.
        { wch: 30 },  // Supplier Name
        { wch: 12 },  // Received Qty
        { wch: 15 },  // Receive Date
        { wch: 15 },  // Status
        { wch: 15 },  // Total Amount
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "GRN Reports");
      const filename = `grn-reports-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success(`${grnsToExport.length} GRN${grnsToExport.length > 1 ? 's' : ''} exported successfully`);
      setSelectedRowIds(new Set());
      setAllVisibleSelected(false);
      setSelectAllPages(false);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error?.message || "Failed to export data");
    }
  };

  // ========== SELECT ALL HANDLERS ==========
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      const allIds = grns.map(grn => grn._id);
      setSelectedRowIds(new Set(allIds));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRowIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRowIds(newSelected);
  };

  const handleRowClick = (grn) => {
    navigate(`/show-grn/${grn._id}`);
  };

  return (
    <div className="px-4 py-4" style={{ overflowY: "auto", height: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center justify-content-center gap-3">
          <h3
            style={{
              fontSize: "22px",
              color: "#0E101A",
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              lineHeight: "120%",
            }}
          >
            GRN Verification
          </h3>
        </div>

        <div className="d-flex align-items-center gap-3">
          <DatePicker
            selectedDateRange={selectedDateRange}
            setSelectedDateRange={setSelectedDateRange}
          />
        </div>
      </div>
      {!loading && grns.length === 0 && !search && !selectedDateRange.startDate && !selectedDateRange.endDate && activeTab === "All Orders" ? (
        <EmptyGRN />
      ) : (
        <div
          style={{
            overflowX: "auto",
            width: "100%",
            padding: 16,
            background: "white",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div
            className="d-flex"
            style={{
              gap: "20px",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div className="col-md-6 d-flex align-items-center" style={{ width: "50%" }}>
              <div
                style={{
                  background: "#F3F8FB",
                  padding: 2,
                  borderRadius: 8,
                  display: "flex",
                  gap: 8,
                  overflowX: "auto",
                }}
              >
                {initialTabs.map((t) => {
                  const active = activeTab === t.label;
                  return (
                    <div
                      key={t.label}
                      onClick={() => handleTabChange(t)}
                      role="button"
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: active ? "#fff" : "transparent",
                        boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        cursor: "pointer",
                        minWidth: 90,
                        whiteSpace: "nowrap",
                        height: "33px",
                      }}
                    >
                      <div style={{ fontSize: 14, color: "#0E101A" }}>
                        {t.label}
                      </div>
                      <div style={{ color: "#727681", fontSize: 14 }}>
                        {t.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="d-flex align-items-center gap-4" style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
              width: "50%",
            }}>
              {/* Search Box */}
              <div
                style={{
                  width: "50%",
                  position: "relative",
                  padding: "4px 8px 4px 20px",
                  display: "flex",
                  borderRadius: 8,
                  alignItems: "center",
                  background: "#FCFCFC",
                  border: "1px solid #EAEAEA",
                  gap: "5px",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
              >
                <FiSearch style={{ color: "#14193D66" }} className="fs-5" />
                <input
                  type="search"
                  placeholder="Search by GRN No., PO No., or Supplier"
                  value={search}
                  onChange={handleSearch}
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
              <button
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
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#0E101A",
                  height: "33px",
                  cursor: grns.length > 0 ? "pointer" : "not-allowed",
                  opacity: grns.length > 0 ? 1 : 0.5,
                }}
                onClick={handleExportExcel}
                disabled={grns.length === 0}
                title={selectedRowIds.size > 0 ? `Export ${selectedRowIds.size} selected` : "Select rows to export"}
              >
                <TbFileExport className="fs-5" style={{ color: "#6C748C" }} />
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="" style={{ overflow: "auto", maxHeight: "calc(100vh - 250px)" }}>
            <table
              style={{
                width: "100%",
                borderSpacing: "0 0px",
                fontFamily: "Inter",
              }}
            >
              <thead style={{ position: "sticky", top: 0, zIndex: 9 }}>
                <tr style={{ backgroundColor: "#F3F8FB", textAlign: "left" }}>
                  <th style={{ padding: "0px 0px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0px", justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        aria-label="select all"
                        checked={selectedRowIds.size === grns.length && grns.length > 0}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    Supplier Name
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    PO No.
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    GRN No.
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    Received Qty
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    Received Date
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    Status
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    Total Amount
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : grns.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-5">
                      No GRN records found
                    </td>
                  </tr>
                ) : (
                  grns.map((grn, idx) => {
                    const statusStyle = getStatusStyle(grn);
                    const supplierName = grn.supplierId?.supplierName || "Unknown Supplier";
                    const totalReceivedQty = grn.items?.reduce((sum, item) => sum + (item.receivingNow || 0), 0) || 0;

                    return (
                      <tr
                        key={grn._id}
                        className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                        style={{
                          borderBottom: "1px solid #EAEAEA",
                          cursor: 'pointer',
                        }}
                        onClick={() => handleRowClick(grn)}
                      >
                        {/* Checkbox */}
                        <td className="text-center" style={{ padding: "6px 16px" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              aria-label="select row"
                              checked={selectedRowIds.has(grn._id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectRow(grn._id);
                              }}
                            />
                          </div>
                        </td>

                        {/* Supplier */}
                        <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                          {supplierName}
                        </td>

                        {/* PO No. */}
                        <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                          {grn.purchaseOrderId?.purchaseNo || "—"}
                        </td>

                        {/* GRN No. */}
                        <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                          {grn.grnNumber || "—"}
                        </td>

                        {/* Received Qty */}
                        <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                          {totalReceivedQty}
                        </td>

                        {/* Received Date */}
                        <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                          {formatDate(grn.receiveDate)}
                        </td>

                        {/* Status chip */}
                        <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "2px 10px",
                              borderRadius: 50,
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              fontSize: 14,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusStyle.label}
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                          ₹ {grn.grandTotal?.toLocaleString("en-IN")}/-
                        </td>
                        <td
                          style={{
                            padding: "6px 16px",
                            position: "relative",
                            overflow: "visible",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              // Get the button position
                              const rect = e.currentTarget.getBoundingClientRect();
                              const dropdownHeight = 160;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;

                              // Calculate position
                              let y;
                              if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                                setOpenUpwards(true);
                                y = rect.top - 6;
                              } else {
                                setOpenUpwards(false);
                                y = rect.bottom + 6;
                              }

                              setDropdownPos({
                                x: rect.left,
                                y: y,
                              });

                              setOpenMenu(openMenu === idx ? null : idx);
                            }}
                            className="btn"
                            style={{
                              border: "none",
                              background: "transparent",
                              padding: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                            aria-label="actions"
                          >
                            <HiOutlineDotsHorizontal size={20} color="grey" />
                          </button>

                          {openMenu === idx && (
                            <div
                              style={{
                                position: "fixed",
                                top: openUpwards ? dropdownPos.y - 110 : dropdownPos.y,
                                left: dropdownPos.x - 110,
                                zIndex: 999999,
                              }}
                            >
                              <div
                                ref={menuRef}
                                style={{
                                  background: "white",
                                  padding: 8,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  minWidth: 210,
                                  display: "flex",
                                  flexDirection: "column",
                                  borderRadius: '8px',
                                  gap: 4,
                                }}
                              >
                                {/* ✅ Use getMenuItems(grn) - only shows Convert to Purchase */}
                                {getMenuItems(grn)
                                  .filter(item => hasPermission(user, "Purchase", item.permission))
                                  .map((item) => (
                                    <div
                                      key={item.action}
                                      onClick={() => {
                                        if (!item.disabled) {
                                          handleGRNAction(grn, item.action);
                                        }
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "8px 18px",
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: item.disabled ? "not-allowed" : "pointer",
                                        transition: "0.2s",
                                        borderRadius: '8px',
                                        textDecoration: "none",
                                        color: item.disabled ? "#999" : "#344054",
                                        opacity: item.disabled ? 0.6 : 1,
                                        backgroundColor: item.disabled ? "#f5f5f5" : "transparent",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!item.disabled) {
                                          e.currentTarget.style.backgroundColor = "#e3f2fd";
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = item.disabled ? "#f5f5f5" : "transparent";
                                      }}
                                      title={item.tooltip || ""}
                                    >
                                      <span style={{ fontSize: "20px", opacity: item.disabled ? 0.4 : 1 }}>
                                        {item.icon}
                                      </span>
                                      <span>{item.label}</span>
                                      {item.disabled && (
                                        <span style={{
                                          fontSize: "10px",
                                          color: "#999",
                                          marginLeft: "auto",
                                          background: "#eee",
                                          padding: "2px 6px",
                                          borderRadius: "4px"
                                        }}>
                                          Converted
                                        </span>
                                      )}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && grns.length > 0 && (
            <div className="page-redirect-btn px-2">
              <Pagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                total={totalCount}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}