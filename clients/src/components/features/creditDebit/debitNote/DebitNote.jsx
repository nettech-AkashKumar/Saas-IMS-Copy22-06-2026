import React, { useEffect, useState, useRef, useMemo } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
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
import DateFilterDropdown from "../../../../components/DateFilterDropdown";
import * as XLSX from "xlsx";
/* ---------------- STATUS STYLES ---------------- */
const statusStyles = {
  // Debit Note specific styles
  debit_processing: {
    // For "issued" debit notes
    color: "#7E7000",
    bg: "#F7F7C7",
    dot: true,
    label: "Processing",
  },
  debit_approved: {
    // For "settled" debit notes
    color: "#059669",
    bg: "transparent",
    dot: false,
    icon: <FaCheck size={12} />,
    label: "Approved",
  },
  debit_rejected: {
    // For "cancelled" debit notes
    color: "#DC2626",
    bg: "transparent",
    dot: false,
    icon: <RxCross2 size={12} />,
    label: "Rejected",
  },
  debit_draft: {
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

/* ---------------- STATUS MAPPER ---------------- */
const mapStatus = (status) => {
  switch (status) {
    case "draft":
      return { label: "Draft", type: "debit_draft" };
    case "issued":
      return { label: "Processing", type: "debit_processing" };
    case "settled":
      return { label: "Approved", type: "debit_approved" };
    case "cancelled":
      return { label: "Rejected", type: "debit_rejected" };
    default:
      return { label: "Processing", type: "debit_processing" };
  }
};

/* ---------------- RETURN TYPE ---------------- */
const getReturnType = (items = []) => {
  if (!items.length) return "—";
  
  // Check if any item has partial quantity returned
  const allItems = items.every(item => {
    const originalQty = item.originalQuantity || item.quantity;
    const returnedQty = item.quantity;
    return returnedQty === originalQty;
  });
  
  if (allItems) {
    return "Full";
  } else {
    return "Partial";
  }
};

/* ---------------- MENU ITEMS ---------------- */
const menuItems = [
  {
    label: "Edit",
    icon: (
      <img src={EditICONImg} alt="Edit" style={{ width: 18, height: 18 }} />
    ),
    action: "edit",
    permission: "update"
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
  //   className: "text-danger",
  // },
];

/* ---------------- TABS DATA ---------------- */
const tabsData = [
  { label: "All", value: "all", count: 0 },
  { label: "Processing", value: "processing", count: 0 },
  { label: "Approved", value: "settled", count: 0 },
  { label: "Cancelled", value: "cancelled", count: 0 },
];

export default function DebitNote() {
  const { user } = useAuth();
  const [allDebitNotes, setAllDebitNotes] = useState([]);
  const [filteredDebitNotes, setFilteredDebitNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
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
  const [selectedDebit, setSelectedDebit] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedDebitNote, setSelectedDebitNote] = useState(null);
const [totalRecords, setTotalRecords] = useState(0);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [activeRow, setActiveRow] = useState(null);

  const toggleRow = (idx) => {
    const newOpen = openRow === idx ? null : idx;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === idx) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(idx);
    }
  };

  /* ---------------- FETCH ALL DEBIT NOTES ---------------- */
  // const fetchDebitNotes = async () => {
  //   try {
  //     setLoading(true);

  //     // Fetch summary for counts
  //     await fetchTotalCounts();

  //     // Fetch all debit notes for local filtering
  //     const res = await api.get("/api/supplier-debit-notes", {
  //       params: {
  //         page: 1,
  //         limit: 1000,
  //         search: "",
  //       },
  //     });

  //     const notes = res.data.debitNotes || [];
  //     setAllDebitNotes(notes);
  //     applyFilters(notes);
  //   } catch (err) {
  //     console.error(err);
  //     // toast.error("Failed to load debit notes");
  //     toast.error(err?.response?.data?.displayMessage || 
  //       err?.response?.data?.message ||
  //       err?.message ||
  //       "Failed to load debit notes");
  //     setAllDebitNotes([]);
  //     setFilteredDebitNotes([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  /* ---------------- FETCH DEBIT NOTES WITH SERVER-SIDE PAGINATION ---------------- */
const fetchDebitNotes = async () => {
  try {
    setLoading(true);
    // Build params for server-side pagination
    const params = {
      page: currentPage,
      limit: itemsPerPage,
      search: search || undefined,
    };
         // Add date range filter if both dates are selected
    if (dateRange?.startDate && dateRange?.endDate) {
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();
    }

    // Add status filter based on active tab
    if (activeTab !== "all") {
      switch (activeTab) {
        case "processing":
          // For processing, we need both draft and issued
          // Backend might need to handle this differently
          params.status = "processing"; // You may need to modify backend to accept 'processing'
          break;
        case "settled":
          params.status = "settled";
          break;
        case "cancelled":
          params.status = "cancelled";
          break;
        default:
          break;
      }
    }

    const res = await api.get("/api/supplier-debit-notes", { params });

    const notes = res.data.debitNotes || [];
    const paginationData = res.data.pagination || {};
    
    setAllDebitNotes(notes);
    setFilteredDebitNotes(notes);
     setTotalRecords(paginationData.totalCount || notes.length);
    // Update total counts from server response
    if (paginationData.totalCount !== undefined) {
      // Update tabs data with correct counts
      await fetchTotalCounts();
    }
    
  } catch (err) {
    console.error(err);
    toast.error(err?.response?.data?.displayMessage || 
      err?.response?.data?.message ||
      err?.message ||
      "Failed to load debit notes");
    setAllDebitNotes([]);
    setFilteredDebitNotes([]);
  } finally {
    setLoading(false);
  }
};
  const handleUpdateDebitNoteStatus = async (status) => {
    if (!selectedDebitNote) return;

    try {
      // NO NEED TO MAP! The modal already sends correct status:
      // - "settled" for Approve
      // - "cancelled" for Reject
      const backendStatus = status; // Just use what comes from modal

      const response = await api.put(
        `/api/supplier-debit-notes/${selectedDebitNote._id}/status`,
        { status: backendStatus },
      );

      if (response.data.success) {
        toast.success(
          `Debit note ${backendStatus === "settled" ? "approved" : "rejected"} successfully`,
        );

        // Update local state
        setAllDebitNotes((prev) =>
          prev.map((note) =>
            note._id === selectedDebitNote._id
              ? {
                ...note,
                status: backendStatus,
                settledDate: backendStatus === "settled" ? new Date() : null,
              }
              : note,
          ),
        );

        // Refresh
        fetchTotalCounts();

        setShowStatusModal(false);
        setSelectedDebitNote(null);
      }
    } catch (error) {
      // console.error("Error updating debit note status:", error);
      // toast.error(error.response?.data?.error || "Failed to update status");
      toast.error(error?.response?.data?.displayMessage || 
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update status");
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
            (note) => note.status === "draft" || note.status === "issued",
          );
          break;
        case "settled":
          filtered = filtered.filter((note) => note.status === "settled");
          break;
        case "cancelled":
          filtered = filtered.filter((note) => note.status === "cancelled");
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
          note.supplierName?.toLowerCase().includes(searchTerm) ||
          note.debitNoteNumber?.toLowerCase().includes(searchTerm) ||
          note.supplierInvoiceNo?.toLowerCase().includes(searchTerm),
      );
    }

    setFilteredDebitNotes(filtered);
    // Reset selection when filters change
    setSelectedNotesForExport([]);
    setSelectAllForExport(false);
  };

  /* ---------------- FETCH TOTAL COUNTS ---------------- */
  const fetchTotalCounts = async () => {
    try {
      const summaryRes = await api.get(
        "/api/supplier-debit-notes/summary/overview",
      );
      const summary = summaryRes.data.summary;

      const allCount = summary.totalCount || 0;
      const draftCount = summary.byStatus?.draft?.count || 0;
      const issuedCount = summary.byStatus?.issued?.count || 0;
      const settledCount = summary.byStatus?.settled?.count || 0;
      const cancelledCount = summary.byStatus?.cancelled?.count || 0;
      const processingCount = draftCount + issuedCount;

      // Update tabsData
      tabsData[0].count = allCount;
      tabsData[1].count = processingCount;
      tabsData[2].count = settledCount;
      tabsData[3].count = cancelledCount;

      setTotalCounts({
        all: allCount,
        draft: draftCount,
        issued: issuedCount,
        settled: settledCount,
        cancelled: cancelledCount,
      });
    } catch (error) {
      // console.error("Failed to fetch counts:", error);
      toast.error(error?.response?.data?.displayMessage || 
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch counts");

      // Fallback: calculate from local data
      const allCount = allDebitNotes.length;
      const draftCount = allDebitNotes.filter(
        (n) => n.status === "draft",
      ).length;
      const issuedCount = allDebitNotes.filter(
        (n) => n.status === "issued",
      ).length;
      const settledCount = allDebitNotes.filter(
        (n) => n.status === "settled",
      ).length;
      const cancelledCount = allDebitNotes.filter(
        (n) => n.status === "cancelled",
      ).length;
      const processingCount = draftCount + issuedCount;

      tabsData[0].count = allCount;
      tabsData[1].count = processingCount;
      tabsData[2].count = settledCount;
      tabsData[3].count = cancelledCount;
    }
  };

  /* ---------------- PAGINATED DEBIT NOTES (CURRENT PAGE) ---------------- */
  // const paginatedDebitNotes = useMemo(() => {
  //   const indexOfLastItem = currentPage * itemsPerPage;
  //   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  //   return filteredDebitNotes.slice(indexOfFirstItem, indexOfLastItem);
  // }, [filteredDebitNotes, currentPage]);

  /* ---------------- MAPPED ROWS FOR DISPLAY ---------------- */
  const rows = useMemo(() => {
    return filteredDebitNotes.map((note) => {
      const status = mapStatus(note.status);

      return {
        _id: note._id,
        supplier: note.supplierName,
        debitNoteNumber: note.debitNoteNumber,
      purchaseOrderNo: note.purchaseOrderNo || note.supplierInvoiceNo || "—",
        dates: note.date ? new Date(note.date).toLocaleDateString() : "-",
        returntype: getReturnType(note.items),
        paymentmode: note.paymentMode || "—",
        status,
        totalamount: `₹ ${(note.totalAmount || 0).toLocaleString("en-IN")}`,
        dueamount:
          note.status === "settled"
            ? "₹ 0"
            : `₹ ${(note.totalAmount || 0).toLocaleString("en-IN")}`,
        originalNote: note,
      };
    });
  }, [filteredDebitNotes]);

  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {
    fetchDebitNotes();
  }, [dateRange]);
  useEffect(() => {
  fetchDebitNotes();
}, [currentPage, itemsPerPage, activeTab, search]);

  useEffect(() => {
    applyFilters(allDebitNotes);
    // setCurrentPage(1); // Reset to page 1 when filters change
  }, [activeTab, search, allDebitNotes]);

  useEffect(() => {
  setCurrentPage(1);
}, [activeTab, search]);

  /* ---------------- PDF EXPORT ---------------- */
  // const handleExportPDF = () => {
  //   // Get notes to export
  //   let notesToExport = [];

  //   if (selectedNotesForExport.length > 0) {
  //     // Export selected notes only
  //     notesToExport = paginatedDebitNotes.filter((note) =>
  //       selectedNotesForExport.includes(note._id),
  //     );
  //   } else if (selectAllForExport) {
  //     // Export ALL notes on current page
  //     notesToExport = [...paginatedDebitNotes];
  //   } else {
  //     // No selection - export all filtered notes (entire list, not just current page)
  //     notesToExport = [...filteredDebitNotes];
  //   }

  //   if (notesToExport.length === 0) {
  //     toast.warn("No debit notes to export");
  //     return;
  //   }

  //   const doc = new jsPDF();

  //   // Title
  //   doc.setFontSize(16);
  //   doc.text("Debit Notes Report", 14, 16);

  //   // Filter info
  //   let filterInfo = "";
  //   if (activeTab !== "all") {
  //     const tabLabel = tabsData.find((t) => t.value === activeTab)?.label;
  //     // filterInfo = `Status: ${tabLabel}`;
  //   }
  //   if (search) {
  //     filterInfo += filterInfo
  //       ? ` | Search: "${search}"`
  //       : `Search: "${search}"`;
  //   }
  //   if (filterInfo) {
  //     doc.text(filterInfo, 14, 40);
  //   }

  //   // Table columns
  //   const tableColumn = ["Debit Note No.", "Supplier", "Date", "Status"];

  //   // Table rows
  //   const tableRows = notesToExport.map((note) => [
  //     note.debitNoteNumber || "—",
  //     note.supplierName || "—",
  //     note.date ? new Date(note.date).toLocaleDateString() : "-",
  //     mapStatus(note.status).label,
  //     `₹${(note.totalAmount || 0).toFixed(2)}`,
  //     note.status === "settled"
  //       ? "₹0.00"
  //       : `₹${(note.totalAmount || 0).toFixed(2)}`,
  //     getReturnType(note.items),
  //   ]);

  //   // Start position for table
  //   const startY = filterInfo ? 50 : 40;

  //   // Add table
  //   autoTable(doc, {
  //     startY: startY,
  //     head: [tableColumn],
  //     body: tableRows,
  //     theme: "grid",
  //     headStyles: { fillColor: [155, 155, 155] },
  //     margin: { top: startY },
  //   });
  //   // Generate filename
  //   let filename = "debit-notes";
  //   if (selectedNotesForExport.length > 0) {
  //     filename = `selected-debit-notes-${selectedNotesForExport.length}`;
  //   } else if (selectAllForExport) {
  //     filename = `page-${currentPage}-debit-notes`;
  //   } else {
  //     filename = `all-debit-notes-${filteredDebitNotes.length}`;
  //   }

  //   doc.save(`${filename}-${new Date().toISOString().split("T")[0]}.pdf`);

  //   toast.success(
  //     selectedNotesForExport.length > 0
  //       ? `${selectedNotesForExport.length} selected debit notes exported`
  //       : selectAllForExport
  //         ? `Page ${currentPage} debit notes exported`
  //         : `All ${filteredDebitNotes.length} debit notes exported`,
  //   );
  // };

  const handleExportExcel = () => {
  try {
    if(selectedNotesForExport.length === 0) {
      toast.error('Select at least 1 supplier to export data');
      return;
    }
    // Get notes to export
    let notesToExport = [];

    if (selectedNotesForExport.length > 0) {
      // Export selected notes only
      notesToExport = allDebitNotes.filter((note) =>
        selectedNotesForExport.includes(note._id),
      );
    } else if (selectAllForExport) {
      // Export ALL notes on current page
      notesToExport = [...allDebitNotes];
    } else {
      // No selection - export all filtered notes (entire list)
      notesToExport = [...filteredDebitNotes];
    }

    if (notesToExport.length === 0) {
      toast.warn("No debit notes to export");
      return;
    }

    // Prepare data for Excel
    const excelData = notesToExport.map((note, index) => {
      const statusMap = mapStatus(note.status);
      
      return {
        // "S.No": index + 1,
        "Debit Note No.": note.debitNoteNumber || "—",
        "Supplier Name": note.supplierName || "—",
        "Purchase Order No.": note.purchaseOrderNo || note.supplierInvoiceNo || "—",
        "Date": note.date ? new Date(note.date).toLocaleDateString() : "-",
        "Return Type": getReturnType(note.items),
        // "Payment Mode": note.paymentMode || "—",
        "Status": statusMap.label,
        "Total Amount": `₹${(note.totalAmount || 0).toLocaleString("en-IN")}`,
        "Due Amount": note.status === "settled" ? "₹0" : `₹${(note.totalAmount || 0).toLocaleString("en-IN")}`
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      // { wch: 8 },   // S.No
      { wch: 18 },  // Debit Note No.
      { wch: 25 },  // Supplier Name
      { wch: 18 },  // Purchase Order No.
      { wch: 12 },  // Date
      { wch: 12 },  // Return Type
      // { wch: 15 },  // Payment Mode
      { wch: 12 },  // Status
      { wch: 15 },  // Total Amount
      { wch: 15 }   // Due Amount
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Debit Notes");

    // Generate filename
    let filename = "debit-notes";
    if (selectedNotesForExport.length > 0) {
      filename = `selected-debit-notes-${selectedNotesForExport.length}`;
    } else if (selectAllForExport) {
      filename = `page-${currentPage}-debit-notes`;
    } else {
      filename = `all-debit-notes-${filteredDebitNotes.length}`;
    }

    // Save the file
    XLSX.writeFile(wb, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success(
      selectedNotesForExport.length > 0
        ? `${selectedNotesForExport.length} selected debit notes exported to Excel`
        : selectAllForExport
          ? `Page ${currentPage} debit notes exported to Excel`
          : `All ${filteredDebitNotes.length} debit notes exported to Excel`,
    );
  } catch (error) {
    console.error("Export error:", error);
    toast.error(error?.message || "Failed to export data");
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
        allDebitNotes.every((note) => updated.includes(note._id)),
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
      setSelectedNotesForExport(allDebitNotes.map((note) => note._id));
    }
    setSelectAllForExport(!selectAllForExport);
  };

  /* ---------------- MENU ACTION HANDLER ---------------- */
  const handleMenuAction = (action, id, row) => {
    switch (action) {
      case "edit":
        if (
          row.status.label === "Approved" ||
          row.status.label === "Cancelled"
        ) {
          toast.error(
            `Cannot edit a ${row.status.label.toLowerCase()} debit note`,
          );
          return;
        }
        navigate(`/edit-debitnote/${id}`, {
          state: { debitNoteId: id, mode: "edit" },
        });
        break;

      case "view":
        navigate(`/debitnote-details/${id}`, {
          state: { debitNoteId: id, mode: "view" },
        });
        break;
         case "approve":
      // Only allow approve for processing status
      if (row.status.label !== "Processing") {
        toast.error(`Cannot approve a ${row.status.label.toLowerCase()} debit note`);
        return;
      }
      setSelectedDebitNote(row.originalNote);
      setShowStatusModal(true);
      break;

    case "reject":
      // Only allow reject for processing status
      if (row.status.label !== "Processing") {
        toast.error(`Cannot reject a ${row.status.label.toLowerCase()} debit note`);
        return;
      }
      setSelectedDebitNote(row.originalNote);
      setShowStatusModal(true);
      break;

      case "delete":
        setSelectedDebit(row);
        setShowDeleteModal(true);
        break;

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
            Debit Notes
          </h3>
        </div>
        <div className="d-flex align-items-center gap-3">
                      <DateFilterDropdown
                        selectedDateRange={dateRange}
                        setSelectedDateRange={setDateRange}
                      />
        {hasPermission(user, "DebitNote", "create") && (
          <Link
            style={{ textDecoration: "none" }}
            to="/create-supplier-debitnote"
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
              Create Debit Note
            </button>
          </Link>
        )}
      </div>
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
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "black",
                }}
              />
            </div>

            {/* Export Button - Simple single button */}
            {hasPermission(user, "DebitNote", "export") && (
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
            style={{ maxHeight: "calc(100vh - 410px)", overflowY: "auto" }}
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
                    Supplier Name
                  </th>
                  <th
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    Debit Note No.
                  </th>
                  <th style={{ padding: "12px 16px", color: "#727681", fontSize: "14px", fontWeight: 400 }}>
  Purchase No.
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
                        "No matching debit notes found"
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
                            No Debit Notes Found
                          </h5>
                          <p style={{ color: "#9CA3AF", marginBottom: "24px" }}>
                            {search
                              ? "Try a different search term"
                              : "Create your first debit note to get started"}
                          </p>
                          {!search && (
                            <></>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((row, idx) => {
                    const sty =
                      statusStyles[row.status.type] || statusStyles.warning;

                    return (
                      <tr
                        key={row._id}
                        className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
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

                        {/* Supplier */}
                        <td style={{ color: "#0E101A", padding: "4px 16px" }}>
                          {row.supplier}
                        </td>

                       {/* Debit Note No. */}
<td style={{ padding: "4px 16px" }}>{row.debitNoteNumber}</td>
                        <td style={{ padding: "4px 16px", color: "#0E101A" }}>
  {row.purchaseOrderNo}
</td>

                        {/* Dates */}
                        <td style={{ padding: "4px 16px" }}>{row.dates}</td>

                        {/* Return Type */}
                        <td
                          style={{
                            color: returnTypeStyles[row.returntype]?.color,
                            padding: "4px 16px",
                          }}
                        >
                          {row.returntype}
                        </td>

                        {/* Payment Mode
                        <td style={{ padding: "4px 16px" }}>
                          {row.paymentmode}
                        </td> */}

                        {/* Status chip */}
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
                              //   row.status.type === "debit_processing"
                              //     ? "pointer"
                              //     : "default",
                              // opacity:
                              //   row.status.type === "debit_processing"
                              //     ? 1
                              //     : 0.9,
                              cursor:"default",
                              opacity:0.9
                            }}
                            // onClick={(e) => {
                            //   e.stopPropagation();
                            //   if (row.status.type === "debit_processing") {
                            //     setSelectedDebitNote(row.originalNote);
                            //     setShowStatusModal(true);
                            //   }
                            // }}
                            title={
                              row.status.type === "debit_processing"
                                ? "Click to approve or reject"
                                : row.status.type === "debit_approved"
                                  ? "Already approved"
                                  : row.status.type === "debit_rejected"
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
                            {/* {row.status.type === "debit_processing" && (
                              <span
                                style={{ marginLeft: "4px", fontSize: "12px" }}
                              ></span>
                            )} */}
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

                              const dropdownHeight = 160; // your menu height
                              const spaceBelow =
                                window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;

                              // decide direction
                              if (
                                spaceBelow < dropdownHeight &&
                                spaceAbove > dropdownHeight
                              ) {
                                setOpenUpwards(true);
                                setDropdownPos({
                                  x: rect.left,
                                  y: rect.top - 6, // position above button
                                });
                              } else {
                                setOpenUpwards(false);
                                setDropdownPos({
                                  x: rect.left,
                                  y: rect.bottom + 6, // position below button
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
                                  height: "auto", // height must match dropdownHeight above
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                }}
                              >
                                {menuItems
                                  .filter(item => hasPermission(user, "DebitNote", item.permission))
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
                                            row.status.label === "Cancelled")
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
                                              row.status.label === "Cancelled")
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
            total={totalRecords}
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

        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedDebit(null);
          }}
          onConfirm={async () => {
            try {
              // Use the correct API endpoint for debit notes
              await api.delete(
                `/api/supplier-debit-notes/${selectedDebit._id}`,
              );
              toast.success("Debit Note deleted successfully!");
              fetchDebitNotes(); // Refresh the list
            } catch (error) {
              // toast.error(
              //   error.response?.data?.error || "Failed to delete Debit Note",
              // );
               toast.error(error?.response?.data?.displayMessage || 
              error?.response?.data?.message || 
              error?.message || 
              "Failed to delete Debit Note");
            } finally {
              setShowDeleteModal(false);
              setSelectedDebit(null);
            }
          }}
          title="Delete Debit Note"
          message={`Are you sure you want to delete debit note "${selectedDebit?.debitNoteNumber || selectedDebit?.invoice
            }"? This action cannot be undone.`}
        />
        <Convertpurchasepopupmodal
          isOpen={showStatusModal}
          onCancel={() => {
            setShowStatusModal(false);
            setSelectedDebitNote(null);
          }}
          onConfirm={handleUpdateDebitNoteStatus}
          currentStatus={selectedDebitNote?.status}
          type="debit" // This tells the modal it's for debit notes
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
