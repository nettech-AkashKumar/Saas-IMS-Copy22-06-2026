import React, { useEffect, useState, useRef, useMemo } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { TbFileExport } from "react-icons/tb";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ViewDetailsImg from "../../../../assets/images/view-details.png";
import EditICONImg from "../../../../assets/images/edit.png";
import DeleteICONImg from "../../../../assets/images/delete.png";
import Pagination from "../../../../components/Pagination";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import ConfirmDeleteModal from "../../../ConfirmDelete";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import Convertpurchasepopupmodal from "../../../../components/features/purchase/Purchases/Convertpurchasepopupmodal";
import { hasPermission } from "../../../../utils/permission/hasPermission";
import { useAuth } from "../../../auth/AuthContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";


/* ---------------- STATUS STYLES FOR CREDIT NOTES ---------------- */
const creditStatusStyles = {
  credit_processing: {
    color: "#7E7000",
    bg: "#F7F7C7",
    dot: true,
    label: "Processing",
  },
  credit_approved: {
    color: "#059669",
    bg: "transparent",
    dot: false,
    icon: <FaCheck size={12} />,
    label: "Approved",
  },
  credit_rejected: {
    color: "#DC2626",
    bg: "transparent",
    dot: false,
    icon: <RxCross2 size={12} />,
    label: "Rejected",
  },
  credit_draft: {
    color: "#7E7000",
    bg: "#F7F7C7",
    dot: true,
    label: "Draft",
  },
};

/* ---------------- RETURN TYPE STYLES ---------------- */
const returnTypeStyles = {
  Partial: { color: "#DAC100" },
  Full: { color: "#0078D9" },
};

/* ---------------- STATUS MAPPER FOR CREDIT NOTES ---------------- */
const mapCreditStatus = (status) => {
  switch (status) {
    case "draft":
      return { label: "Draft", type: "credit_draft" };
    case "pending":  // ✅ ADD THIS
      return { label: "Processing", type: "credit_processing" };
    case "approved":  // ✅ Change from "applied" to "approved"
      return { label: "Approved", type: "credit_approved" };
    case "rejected":  // ✅ Change from "cancelled" to "rejected"
      return { label: "Rejected", type: "credit_rejected" };
    default:
      return { label: "Processing", type: "credit_processing" };
  }
};
/* ---------------- RETURN TYPE ---------------- */
const getReturnType = (items = []) => {
  if (!items.length) return "—";
  const totalSelected = items.reduce((sum, item) => sum + (item.returnQuantity || 0), 0);
  const totalOriginal = items.reduce((sum, item) => sum + (item.originalQuantity || item.quantity || 0), 0);

  return totalSelected === totalOriginal ? "Full" : "Partial";
};

/* ---------------- MENU ITEMS ---------------- */
const menuItems = [
  {
    label: "Edit",
    icon: (
      <img src={EditICONImg} alt="Edit" style={{ width: 18, height: 18 }} />
    ),
    action: "edit",
    permission: "upadte"
  },
  {
    label: "View Details",
    icon: (
      <img
        src={ViewDetailsImg}
        alt="View Details"
        style={{ width: 18, height: 18 }}
      />
    ),
    action: "view",
    permission: "read"
  },
   {
    label: "Approve",
    icon: <FaCheck size={18} style={{ color: "#059669" }} />,
    action: "approve",
    permission: "update"
  },
  {
    label: "Reject",
    icon: <RxCross2 size={18} style={{ color: "#DC2626" }} />,
    action: "reject",
    permission: "update"
  },
  // {
  //   label: "Delete",
  //   icon: (
  //     <img src={DeleteICONImg} alt="Delete" style={{ width: 18, height: 18 }} />
  //   ),
  //   action: "delete",
  //   permission: "delete"
  // },
];

/* ---------------- TABS DATA ---------------- */
// const tabsData = [
//   { label: "All", value: "all", count: 0 },
//   { label: "Processing", value: "processing", count: 0 },
//   { label: "Approved", value: "approved", count: 0 },
//   { label: "Rejected", value: "rejected", count: 0 },
// ];

export default function CreditNoteList() {
  const { user } = useAuth();
  const [allCreditNotes, setAllCreditNotes] = useState([]);
  const [filteredCreditNotes, setFilteredCreditNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [tabsData, setTabsData] = useState([
    { label: "All", value: "all", count: 0 },
    { label: "Processing", value: "processing", count: 0 },
    { label: "Approved", value: "approved", count: 0 },
    { label: "Rejected", value: "rejected", count: 0 },
  ]);
  const [totalCounts, setTotalCounts] = useState({
    all: 0,
    draft: 0,
    issued: 0,
    settled: 0,
    cancelled: 0,
  });
  const [selectedNotesForExport, setSelectedNotesForExport] = useState([]);
  const [selectAllForExport, setSelectAllForExport] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);

  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  /* ---------------- FETCH ALL CREDIT NOTES ---------------- */
  const fetchCreditNotes = async () => {
    try {
      setLoading(true);

      // Fetch summary for counts
      await fetchTotalCounts();

      // Fetch all credit notes for local filtering
      const res = await api.get("/api/credit-notes", {
        params: {
          page: 1,
          limit: 1000,
          search: "",
        },
      });
      const notes = Array.isArray(res.data?.creditNotes) ? res.data.creditNotes : [];
      setAllCreditNotes(notes);
      applyFilters(notes);
    } catch (err) {
      // console.error(err);
      // toast.error("Failed to load credit notes");
      toast.error(err?.response?.data?.message || "Failed to load credit notes");
      setAllCreditNotes([]);
      setFilteredCreditNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCreditNoteStatus = async (status) => {
    if (!selectedCreditNote) return;

    try {

      const response = await api.put(
        `/api/credit-notes/${selectedCreditNote._id}/status`,
        { status },
      );

      if (response.data.success) {
        toast.success(
          `Credit note ${status === "approved" ? "approved" : "rejected"} successfully`,
        );
        await fetchCreditNotes();

        // Update local state
        setAllCreditNotes((prev) =>
          prev.map((note) =>
            note._id === selectedCreditNote._id
              ? {
                ...note,
                status: status,
                approvedDate: status === "approved" ? new Date() : null,
                rejectedDate: status === "rejected" ? new Date() : null,
              }
              : note,
          ),
        );

        // Refresh counts
        fetchTotalCounts();

        setShowStatusModal(false);
        setSelectedCreditNote(null);
      }
    } catch (error) {
      // console.error("Error updating credit note status:", error);
      toast.error(error.response?.data?.error || "Failed to update status");
    }
  };

  /* ---------------- APPLY FILTERS LOCALLY ---------------- */
  const applyFilters = (notes) => {
    let filtered = [...notes];

    // Apply tab filter
    if (activeTab !== "all") {
      switch (activeTab) {
        case "processing":
          filtered = filtered.filter(
            (note) => note.status === "pending", // ✅ Only "pending" status
          );
          break;
        case "approved":
          filtered = filtered.filter((note) => note.status === "approved"); // ✅ "approved"
          break;
        case "rejected":
          filtered = filtered.filter((note) => note.status === "rejected"); // ✅ "rejected"
          break;
        default:
          break;
      }
    }

    // Apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.customerName?.toLowerCase().includes(searchTerm) ||
          note.creditNoteNumber?.toLowerCase().includes(searchTerm) ||
          note.invoiceNumber?.toLowerCase().includes(searchTerm),
      );
    }

    setFilteredCreditNotes(filtered);
    // Reset selection when filters change
    setSelectedNotesForExport([]);
    setSelectAllForExport(false);
  };

  /* ---------------- FETCH TOTAL COUNTS ---------------- */
  const fetchTotalCounts = async () => {
    try {
      // If you have a summary endpoint, use it
      const summaryRes = await api.get("/api/credit-notes/summary/overview");
      const summary = summaryRes.data.summary || summaryRes.data;

      const allCount = summary.totalCount || 0;
      const pendingCount = summary.byStatus?.pending?.count || summary.pendingCount || 0;
      const approvedCount = summary.byStatus?.approved?.count || summary.approvedCount || 0;
      const rejectedCount = summary.byStatus?.rejected?.count || summary.rejectedCount || 0;

      setTabsData([
        { label: "All", value: "all", count: allCount },
        { label: "Processing", value: "processing", count: pendingCount },
        { label: "Approved", value: "approved", count: approvedCount },
        { label: "Rejected", value: "rejected", count: rejectedCount },
      ]);

      setTotalCounts({
        all: allCount,
        draft: 0,
        issued: pendingCount,
        settled: approvedCount,
        cancelled: rejectedCount,
      });
    } catch (error) {
      console.error("Failed to fetch counts, calculating locally:", error);
      // Calculate counts from allCreditNotes if we have data
      if (allCreditNotes.length > 0) {
        const allCount = allCreditNotes.length;
        const pendingCount = allCreditNotes.filter((n) => n.status === "pending").length;
        const approvedCount = allCreditNotes.filter((n) => n.status === "approved").length;
        const rejectedCount = allCreditNotes.filter((n) => n.status === "rejected").length;

        setTabsData([
          { label: "All", value: "all", count: allCount },
          { label: "Processing", value: "processing", count: pendingCount },
          { label: "Approved", value: "approved", count: approvedCount },
          { label: "Rejected", value: "rejected", count: rejectedCount },
        ]);
      }
    }
  };

  /* ---------------- PAGINATED CREDIT NOTES (CURRENT PAGE) ---------------- */
  const paginatedCreditNotes = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredCreditNotes.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredCreditNotes, currentPage]);

  /* ---------------- MAPPED ROWS FOR DISPLAY ---------------- */
  const rows = useMemo(() => {
    return paginatedCreditNotes.map((note) => {
      const status = mapCreditStatus(note.status);

      return {
        _id: note._id,
        customer: note.customerName,
        invoice: note.creditNoteNumber || note.invoiceNumber || "—",
        date: note.date ? new Date(note.date).toLocaleDateString() : "-",
        returntype: getReturnType(note.items),
        paymentmode: note.paymentMode || "—",
        status,
        totalamount: `₹ ${(note.totalAmount || 0).toLocaleString("en-IN")}`,
        dueamount:
          note.status === "applied"
            ? "₹ 0"
            : `₹ ${(note.totalAmount || 0).toLocaleString("en-IN")}`,
        originalNote: note,
      };
    });
  }, [paginatedCreditNotes]);

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    fetchCreditNotes();
  }, []);

  useEffect(() => {
    applyFilters(allCreditNotes);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [activeTab, search, allCreditNotes]);

  /* ---------------- PDF EXPORT ---------------- */
  const handleExportExcel = async () => {
    if (selectedNotesForExport.length === 0) {
      toast.error("Please select at least one credit note to export");
      return;
    }
    // Get notes to export
    let notesToExport = [];

    if (selectedNotesForExport.length > 0) {
      // Export selected notes only
      notesToExport = paginatedCreditNotes.filter((note) =>
        selectedNotesForExport.includes(note._id),
      );
    } else if (selectAllForExport) {
      // Export ALL notes on current page
      notesToExport = [...paginatedCreditNotes];
    } else {
      // No selection - export all filtered notes
      notesToExport = [...filteredCreditNotes];
    }

    if (notesToExport.length === 0) {
      toast.warn("No credit notes to export");
      return;
    }

    try {
      // Define columns for Excel
      const tableColumns = [
        // "S.No",
        "Credit Note No.",
        "Customer",
        "Date",
        "Status",
        "Total Amount",
        "Due Amount",
        "Return Type"
      ];

      // Prepare table rows
      const tableRows = notesToExport.map((note, index) => [
        // index + 1,
        note.creditNoteNumber || "—",
        note.customerName || "—",
        note.date ? format(new Date(note.date), "dd MMM yyyy") : "-",
        mapCreditStatus(note.status).label,
        `₹${(note.totalAmount || 0).toFixed(2)}`,
        note.status === "settled" ? "₹0.00" : `₹${(note.totalAmount || 0).toFixed(2)}`,
        getReturnType(note.items)
      ]);

      // Create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Credit Notes");

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
      [8, 20, 30, 18, 15, 18, 18, 25].forEach((width, i) => {
        worksheet.getColumn(i + 1).width = width;
      });

      // Add data rows
      tableRows.forEach((row) => worksheet.addRow(row));

      // Generate filename
      let filename = "credit-notes";
      if (selectedNotesForExport.length > 0) {
        filename = `selected-credit-notes-${selectedNotesForExport.length}`;
      } else if (selectAllForExport) {
        filename = `page-${currentPage}-credit-notes`;
      } else {
        filename = `all-credit-notes-${filteredCreditNotes.length}`;
      }

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `${filename}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      );

      toast.success(
        selectedNotesForExport.length > 0
          ? `${selectedNotesForExport.length} selected credit notes exported`
          : selectAllForExport
            ? `Page ${currentPage} credit notes exported`
            : `All ${filteredCreditNotes.length} credit notes exported`
      );

    } catch (error) {
      console.error("Excel export error:", error);
      toast.error(error?.message || "Failed to generate Excel file");
    }
  };

  /* ---------------- CHECKBOX HANDLERS ---------------- */
  const handleCheckboxChange = (id) => {
    setSelectedNotesForExport((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((noteId) => noteId !== id)
        : [...prev, id];

      // Update "Select All" checkbox state
      setSelectAllForExport(
        paginatedCreditNotes.every((note) => updated.includes(note._id)),
      );
      return updated;
    });
  };

  const handleSelectAllForExport = () => {
    if (selectAllForExport) {
      // Deselect all
      setSelectedNotesForExport([]);
    } else {
      // Select all on current page
      setSelectedNotesForExport(paginatedCreditNotes.map((note) => note._id));
    }
    setSelectAllForExport(!selectAllForExport);
  };

  const isValidObjectId = (id) => {
    // object id validation regex
    // object id is a 24-character hex string
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  }

  /* ---------------- MENU ACTION HANDLER ---------------- */

  const handleMenuAction = (action, id, row) => {
    // Add validation check
    if (id === "all" || !isValidObjectId(id)) {
      toast.error("Invalid credit note selection");
      return;
    }

    switch (action) {
      case "edit":
        if (
          row.status.label === "Approved" ||
          row.status.label === "Rejected"
        ) {
          toast.error(
            `Cannot edit a ${row.status.label.toLowerCase()} credit note`,
          );
          return;
        }
        navigate(`/edit-creditnote/${id}`, {
          state: { creditNoteId: id, mode: "edit" },
        });
        break;

      case "view":
        navigate(`/creditnote-details/${id}`, {
          state: { creditNoteId: id, mode: "view" },
        });
        break;
        case "approve":
      // Only allow approve for processing status
      if (row.status.label !== "Processing") {
        toast.error(`Cannot approve a ${row.status.label.toLowerCase()} credit note`);
        return;
      }
      setSelectedCreditNote(row.originalNote);
      setShowStatusModal(true);
      break;

    case "reject":
      // Only allow reject for processing status
      if (row.status.label !== "Processing") {
        toast.error(`Cannot reject a ${row.status.label.toLowerCase()} credit note`);
        return;
      }
      setSelectedCreditNote(row.originalNote);
      setShowStatusModal(true);
      break;

      // case "delete":
      //   setSelectedCredit(row);
      //   setShowDeleteModal(true);
      //   break;

      default:
        break;
    }
    setOpenMenu(null);
  };

  /* ---------------- CLICK OUTSIDE MENU ---------------- */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const cardStyle = {
    borderRadius: 6,
    boxShadow: "rgba(0, 0, 0, 0.1)",
    padding: 0,
    background: "white",
  };

  return (
    <div className="container-fluid p-3">
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
            Credit Notes
          </h3>
        </div>
        {hasPermission(user, "CreditNote", "create") && (
          <Link
            style={{ textDecoration: "none" }}
            to="/credit-note"
          >
            <button
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
              <MdAddShoppingCart className="fs-5" />
              Create Credit Note
            </button>
          </Link>
        )}
      </div>

      {/* Search + Tabs + Export */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "16px",
          overflowX: "hidden",
          overflowY: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 16,
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
          <div className="d-flex align-items-center" style={{ width: "50%" }}>
            <div
              style={{
                background: "#F3F8FB",
                padding: 3,
                borderRadius: 8,
                display: "flex",
                gap: 8,
                overflowX: "auto",
              }}
            >
              {tabsData.map((t) => {
                const active = activeTab === t.value;
                return (
                  <div
                    key={t.value}
                    onClick={() => setActiveTab(t.value)}
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
                      width: "fit-content",
                      whiteSpace: "nowrap",
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
          <div
            className="col-12 col-md-6 d-flex align-items-center justify-content-end"
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
              width: "50%",
            }}
          >
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
              <FiSearch style={{ color: "#14193D66" }} />
              <input
                type="search"
                placeholder="Search by customer name or credit note number"
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
            {hasPermission(user, "CreditNote", "export") && (
              <button
                className="btn"
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
                  cursor: "pointer",
                }}
                onClick={handleExportExcel}
              >
                <TbFileExport className="fs-5" style={{ color: "#6C748C" }} />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Table card */}
        <div style={{ ...cardStyle }}>
          <div
            className=""
            style={{
              overflowY: "auto",
              height: "calc(100vh - 310px)",
              maxHeight: '500px',
            }}
          >
            <table
              style={{
                width: "100%",
                borderSpacing: "0 0px",
                fontFamily: "Inter",
              }}
            >
              <thead style={{ position: "sticky", top: 0, zIndex: 9 }}>
                <tr style={{ backgroundColor: "#F3F8FB", textAlign: "left" }}>
                  <th
                    style={{
                      padding: "0px 0px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0px",
                        justifyContent: "center",
                      }}
                    >
                      <input
                        type="checkbox"
                        aria-label="select row"
                        checked={selectAllForExport}
                        onChange={handleSelectAllForExport}
                      />
                    </div>
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Customer Name
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Credit Note No.
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Return Type
                  </th>
                  {/* <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Payment Mode
                  </th> */}
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Total Amount
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Due Amount
                  </th>
                  <th
                    className="text-center"
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                      fontFamily: '"Inter", sans-serif',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      {search || activeTab !== "all" ? (
                        "No matching credit notes found"
                      ) : (
                        <div className="py-4">
                          <div
                            style={{
                              fontSize: "48px",
                              color: "#D1D5DB",
                              marginBottom: "16px",
                            }}
                          >
                            📄
                          </div>
                          <h5 style={{ color: "#6B7280", marginBottom: "8px" }}>
                            No Credit Notes Found
                          </h5>
                          <p style={{ color: "#9CA3AF", marginBottom: "24px" }}>
                            {search
                              ? "Try a different search term"
                              : "Create your first credit note to get started"}
                          </p>
                          {!search && (
                            <Link to="/credit-note">
                              <button
                                className="btn d-flex align-items-center mx-auto"
                                style={{
                                  background: "#1F7FFF",
                                  border: "1.5px solid #1F7FFF",
                                  color: "white",
                                  borderRadius: "8px",
                                  padding: "8px 16px",
                                  fontWeight: 500,
                                  fontSize: "14px",
                                }}
                              >
                                <MdAddShoppingCart
                                  style={{ marginRight: 8, fontSize: "16px" }}
                                />
                                Create First Credit Note
                              </button>
                            </Link>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((row, idx) => {
                    const sty = creditStatusStyles[row.status.type] || creditStatusStyles.credit_processing;

                    return (
                      <tr
                        key={row._id}
                        className="table-hover"
                        style={{
                          borderBottom: "1px solid #EAEAEA",
                          cursor: "pointer",
                        }}
                      >
                        {/* Checkbox */}
                        <td
                          className="text-center"
                          style={{ padding: "4px 16px" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <input
                              type="checkbox"
                              aria-label="select row"
                              checked={selectedNotesForExport.includes(row._id)}
                              onChange={() => handleCheckboxChange(row._id)}
                            />
                          </div>
                        </td>

                        {/* Customer */}
                        <td style={{ color: "#0E101A", padding: "4px 16px" }}>
                          {row.customer}
                        </td>

                        {/* Credit Note No. */}
                        <td style={{ padding: "4px 16px" }}>{row.invoice}</td>

                        {/* Date */}
                        <td style={{ padding: "4px 16px" }}>{row.date}</td>

                        {/* Return Type */}
                        <td
                          style={{
                            color: returnTypeStyles[row.returntype]?.color,
                            padding: "4px 16px",
                          }}
                        >
                          {row.returntype}
                        </td>

                        {/* Payment Mode */}
                        {/* <td style={{ padding: "4px 16px" }}>
                          {row.paymentmode}
                        </td> */}

                        {/* Status chip - Clickable for Processing status */}
                        <td style={{ padding: "4px 16px" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "2px 5px",
                              borderRadius: 50,
                              background: sty.bg,
                              color: sty.color,
                              fontSize: 14,
                              whiteSpace: "nowrap",
                              minWidth: 120,
                              // cursor:
                              //   row.status.type === "credit_processing"
                              //     ? "pointer"
                              //     : "default",
                              // opacity:
                              //   row.status.type === "credit_processing"
                              //     ? 1
                              //     : 0.9,
                              cursor: "default",
                              opacity: 0.9
                            }}
                            // onClick={(e) => {
                            //   e.stopPropagation();
                            //   if (row.status.type === "credit_processing") {
                            //     setSelectedCreditNote(row.originalNote);
                            //     setShowStatusModal(true);
                            //   }
                            // }}
                            // title={
                            //   row.status.type === "credit_processing"
                            //     ? "Click to approve or reject"
                            //     : row.status.type === "credit_approved"
                            //       ? "Already approved"
                            //       : row.status.type === "credit_rejected"
                            //         ? "Already rejected"
                            //         : "Status cannot be changed"
                            // }
                            title={
                              row.status.type === "credit_processing"
                                ? "Use action menu to approve or reject"
                                : row.status.type === "credit_approved"
                                  ? "Already approved"
                                  : row.status.type === "credit_rejected"
                                    ? "Already rejected"
                                    : "Status cannot be changed"
                            }
                          >
                            {sty.dot ? (
                              <span
                                style={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: 20,
                                  background: sty.color,
                                  display: "inline-block",
                                }}
                              />
                            ) : (
                              <span style={{ color: sty.color }}>
                                {sty.icon}
                              </span>
                            )}
                            {row.status.label}
                            {row.status.type === "credit_processing" && (
                              <span
                                style={{ marginLeft: "4px", fontSize: "12px" }}
                              ></span>
                            )}
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td style={{ padding: "4px 16px" }}>
                          {row.totalamount}
                        </td>

                        {/* Due Amount */}
                        <td style={{ padding: "4px 16px" }}>{row.dueamount}</td>

                        {/* Actions */}
                        <td
                          style={{
                            padding: "4px 16px",
                            position: "relative",
                            overflow: "visible",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setOpenMenu(openMenu === idx ? null : idx);

                              const dropdownHeight = 160;
                              const spaceBelow =
                                window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;

                              if (
                                spaceBelow < dropdownHeight &&
                                spaceAbove > dropdownHeight
                              ) {
                                setOpenUpwards(true);
                                setDropdownPos({
                                  x: rect.left,
                                  y: rect.top - 6,
                                });
                              } else {
                                setOpenUpwards(false);
                                setDropdownPos({
                                  x: rect.left,
                                  y: rect.bottom + 6,
                                });
                              }
                            }}
                            className="btn"
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
                            <HiOutlineDotsHorizontal size={28} color="grey" />
                          </button>

                          {openMenu === idx && (
                            <div
                              style={{
                                position: "fixed",
                                top: openUpwards
                                  ? dropdownPos.y - 60
                                  : dropdownPos.y,
                                left: dropdownPos.x - 80,
                                zIndex: 999999,
                              }}
                            >
                              <div
                                ref={menuRef}
                                style={{
                                  background: "white",
                                  padding: 8,
                                  borderRadius: 12,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  minWidth: 170,
                                  height: "auto",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                }}
                              >
                                {menuItems
                                  .filter(item => hasPermission(user, "CreditNote", item.permission))
                                  .map((item, index) => (
                                    <div
                                      key={index}
                                      onClick={() =>
                                        handleMenuAction(
                                          item.action,
                                          row._id,
                                          row,
                                        )
                                      }
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "2px 16px",
                                        borderRadius: 8,
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        transition: "0.2s",
                                        color: item.className
                                          ? "#dc3545"
                                          : "#344054",
                                        textDecoration: "none",
                                        ...(item.action === "edit" &&
                                          (row.status.label === "Approved" ||
                                            row.status.label === "Rejected")
                                          ? {
                                            opacity: 0.5,
                                            cursor: "not-allowed",
                                          }
                                          : {}),
                                      }}
                                      onMouseEnter={(e) => {
                                        if (
                                          !(
                                            item.action === "edit" &&
                                            (row.status.label === "Approved" ||
                                              row.status.label === "Rejected")
                                          )
                                        ) {
                                          e.currentTarget.style.backgroundColor =
                                            "#e3f2fd";
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                          "transparent";
                                      }}
                                    >
                                      <span style={{ fontSize: "24px" }}>
                                        {item.icon}
                                      </span>
                                      <span>{item.label}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={currentPage}
            total={filteredCreditNotes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              // Reset selection when page changes
              setSelectedNotesForExport([]);
              setSelectAllForExport(false);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
              setSelectedNotesForExport([]);
              setSelectAllForExport(false);
            }}
          />
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedCredit(null);
          }}
          onConfirm={async () => {
            try {
              await api.delete(
                `/api/credit-notes/${selectedCredit._id}`,
              );
              toast.success("Credit Note deleted successfully!");
              fetchCreditNotes(); // Refresh the list
            } catch (error) {
              toast.error(
                error.response?.data?.error || "Failed to delete Credit Note",
              );
            } finally {
              setShowDeleteModal(false);
              setSelectedCredit(null);
            }
          }}
          title="Delete Credit Note"
          message={`Are you sure you want to delete credit note "${selectedCredit?.creditNoteNumber || selectedCredit?.invoice
            }"? This action cannot be undone.`}
        />

        {/* Status Update Modal (Same modal as debit notes) */}
        <Convertpurchasepopupmodal
          isOpen={showStatusModal}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedCreditNote(null);
          }}
          onConfirm={handleUpdateCreditNoteStatus}
          currentStatus={selectedCreditNote?.status}
          type="credit" // This tells the modal it's for credit notes
        />

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}
