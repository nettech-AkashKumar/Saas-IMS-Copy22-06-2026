import React, { useEffect, useState, useRef } from "react";
import { IoIosSearch } from "react-icons/io";
import { FaBarcode } from "react-icons/fa6";
import { TbFileExport } from "react-icons/tb";
import { TiTick } from "react-icons/ti";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import api from "../config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import { hasPermission } from "../../utils/permission/hasPermission";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/auth/AuthContext";
import DateFilterDropdown from "../../components/DateFilterDropdown";
import Dollarimg from "../../assets/images/dollar.png";
import Orderimg from "../../assets/images/order.png";
import Purchaseimg from "../../assets/images/profit-cash.png";
import Dueamountimg from "../../assets/images/number-one.png";
import KasperLogo from "../../assets/images/kasper-logo.png";

function CreditNoteReport() {
  const statsTop = [
    {
      title: "Total Credit Notes",
      value: "0",
      currency: "",
      image: Dollarimg,
      link: "",
    },
    {
      title: "Total Refund Amount",
      value: "0",
      currency: "",
      image: Orderimg,
      link: "",
    },
    {
      title: "Pending Credit Amount",
      value: "0",
      currency: "INR",
      image: Purchaseimg,
      link: "",
    },
  ];

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [viewDebitCreditModel, setViewDebitCreditModel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [initialStats, setInitialStats] = useState(statsTop);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Combined data for both credit and debit notes
  const [combinedData, setCombinedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // Status styles
  const statusStyles = {
    Approved: {
      bg: "#D4F7C7",
      color: "#01774B",
      label: "Approved",
    },
    Rejected: {
      bg: "#F7C7C9",
      color: "#A80205",
      label: "Rejected",
    },
    Processing: {
      bg: "#FFF2D5",
      color: "#CF4F00",
      label: "Processing",
    },
    Paid: {
      bg: "#D4F7C7",
      color: "#01774B",
      label: "Paid",
    },
    Pending: {
      bg: "#FFF2D5",
      color: "#CF4F00",
      label: "Pending",
    },
    Due: {
      bg: "#F7C7C9",
      color: "#A80205",
      label: "Due",
    },
  };

  // Tabs data
  const [tabs, setTabs] = useState([
    { label: "All", count: 0, value: "all", active: true },
    // { label: "Debit Note", count: 0, value: "debit" },
    // { label: "Credit Note", count: 0, value: "credit" },
  ]);

  // Fetch both credit and debit notes
  const fetchAllNotes = async () => {
    setLoading(true);
    try {
      // Fetch debit notes
      const debitRes = await api.get("/api/supplier-debit-notes", {
        params: { page: 1, limit: 1000 },
      });

      // Fetch credit notes
      const creditRes = await api.get("/api/credit-notes", {
        params: { page: 1, limit: 1000 },
      });

      const debitNotesRaw =
        debitRes.data?.debitNotes ||
        debitRes.data?.data ||
        (Array.isArray(debitRes.data) ? debitRes.data : []);
      const debitNotes = Array.isArray(debitNotesRaw) ? debitNotesRaw : [];

      const creditNotesRaw =
        creditRes.data?.creditNotes ||
        creditRes.data?.data ||
        (Array.isArray(creditRes.data) ? creditRes.data : []);
      const creditNotes = Array.isArray(creditNotesRaw) ? creditNotesRaw : [];

      // Helper function to get creator name
      const getCreatorInfo = (createdBy) => {
        if (!createdBy) return { name: "Unknown", role: "Unknown Role" };
        // Get user name
        const userName =
          createdBy.firstName && createdBy.lastName
            ? `${createdBy.firstName} ${createdBy.lastName}`
            : createdBy.username || createdBy.email || "Unknown";
        const roleName =
          createdBy.role?.roleName || createdBy.role || "Unknown Role";
        return { name: userName, role: roleName || "Unknown Role" };
      };

      // Map debit notes to unified format
      const mappedDebitNotes = debitNotes.map((note) => {
        const creator = getCreatorInfo(note.createdBy);
        return {
          id: note._id,
          issueDate: note.date
            ? format(new Date(note.date), "dd/MM/yyyy")
            : "-",
          supplier: note.supplierName || "Unknown Supplier",
          refinvno: note.debitNoteNumber || "N/A",
          type: "Debit Note",
          amount: `₹${(note.totalAmount || note.total || note.amount || 0).toFixed(2)}`,
          paystatus:
            note.status === "settled" ||
            note.status === "applied" ||
            note.status === "Approved"
              ? "Paid"
              : "Pending",
          status:
            note.status === "settled" ||
            note.status === "applied" ||
            note.status === "Approved"
              ? "Approved"
              : note.status === "cancelled" || note.status === "Rejected"
                ? "Rejected"
                : "Processing",

          createdby: creator.role,
          reason: note.reason || "No reason provided",
          originalNote: note,
          noteType: "debit",
        };
      });

      // Map credit notes to unified format
      const mappedCreditNotes = creditNotes.map((note) => {
        const creator = getCreatorInfo(note.createdBy);
        return {
          id: note._id,
          issueDate:
            note.date || note.creditNoteDate || note.createdAt
              ? format(
                  new Date(note.date || note.creditNoteDate || note.createdAt),
                  "dd/MM/yyyy",
                )
              : "-",
          supplier:
            note.customerName ||
            (note.customer && note.customer.name) ||
            "Unknown Customer",
          refinvno: note.creditNoteNumber || note.creditNoteId || "N/A",
          type: "Credit Note",
          amount: `₹${(note.totalAmount || note.total || note.amount || 0).toFixed(2)}`,
          paystatus:
            note.status === "settled" ||
            note.status === "applied" ||
            note.status === "Approved"
              ? "Paid"
              : "Pending",
          status:
            note.status === "settled" ||
            note.status === "applied" ||
            note.status === "Approved"
              ? "Approved"
              : note.status === "cancelled" || note.status === "Rejected"
                ? "Rejected"
                : "Processing",
          createdby: creator.role,
          reason: note.reason || "No reason provided",
          originalNote: note,
          noteType: "credit",
        };
      });

      // Combine both arrays
      const allNotes = [...mappedDebitNotes, ...mappedCreditNotes];
      setCombinedData(allNotes);
      setFilteredData(allNotes);

      // Update tab counts
      const debitCount = mappedDebitNotes.length;
      const creditCount = mappedCreditNotes.length;

      setTabs([
        { label: "All", count: allNotes.length, value: "all", active: true },
        // {
        //   label: "Debit Note",
        //   count: debitCount,
        //   value: "debit",
        //   active: false,
        // },
        // {
        //   label: "Credit Note",
        //   count: creditCount,
        //   value: "credit",
        //   active: false,
        // },
      ]);

      // Set pagination
      setPagination((prev) => ({
        ...prev,
        total: allNotes.length,
        totalPages: Math.ceil(allNotes.length / prev.limit),
        page: 1,
      }));
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load credit/debit notes");
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);

    if (!searchTerm) {
      // Reset to all products
      const filtered = filterByTab(combinedData, activeTab);
      setFilteredData(filtered);
      const total = filtered.length;
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    } else {
      // Filter products based on search term
      const baseData = filterByTab(combinedData, activeTab);
      const filtered = baseData.filter(
        (product) =>
          product.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.refinvno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.type?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredData(filtered);
      const total = filtered.length;
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    }
  };

  // Filter by tab
  const filterByTab = (data, tab) => {
    if (tab === "all") return data;
    return data.filter((item) =>
      tab === "debit" ? item.noteType === "debit" : item.noteType === "credit",
    );
  };

  // Handle tab change
  const handleTabChange = (tabValue) => {
    const updatedTabs = tabs.map((tab) => ({
      ...tab,
      active: tab.value === tabValue,
    }));
    setTabs(updatedTabs);
    setActiveTab(tabValue);

    const filtered = filterByTab(combinedData, tabValue);
    setFilteredData(filtered);

    const total = filtered.length;
    setPagination((prev) => ({
      ...prev,
      page: 1,
      total: total,
      totalPages: Math.ceil(total / prev.limit),
    }));
  };

  // Get current page products
  const getCurrentPageProducts = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredData.slice(startIndex, endIndex);
  };

  // Export to PDF
  // const handleExport = () => {
  //   const productsToExport = selectedRowIds.size > 0
  //     ? filteredData.filter(product => selectedRowIds.has(product.id))
  //     : filteredData;

  //   if (!productsToExport.length) {
  //     toast.warn("No notes to export");
  //     return;
  //   }

  //   try {
  //     const doc = new jsPDF("portrait", "mm", "a4");

  //     // Add header
  //     doc.setFontSize(20);
  //     doc.setTextColor(155, 155, 155);
  //     doc.text("Credit & Debit Notes Report", 105, 15, { align: "center" });

  //     // Add date and info
  //     doc.setFontSize(10);
  //     doc.setTextColor(100, 100, 100);
  //     doc.text(`Generated: ${format(new Date(), "dd MMM yyyy hh:mm a")}`, 105, 22, { align: "center" });
  //     doc.text(`Total Notes: ${productsToExport.length}`, 105, 27, { align: "center" });

  //     // Draw line
  //     doc.setDrawColor(200, 200, 200);
  //     doc.line(10, 32, 200, 32);

  //     // Add table data
  //     const tableData = productsToExport.map((row, index) => [
  //       index + 1,
  //       row.issueDate,
  //       row.supplier,
  //       row.refinvno,
  //       row.type,
  //       row.amount,
  //       row.paystatus,
  //       row.status,
  //       row.createdby,
  //     ]);

  //     autoTable(doc, {
  //       startY: 35,
  //       head: [
  //         [
  //           "#",
  //           "Issue Date",
  //           "Supplier/Customer",
  //           "Ref. Invoice No.",
  //           "Type",
  //           "Amount",
  //           "Payment Status",
  //           "Status",
  //           "Created By",
  //         ],
  //       ],
  //       body: tableData,
  //       theme: "grid",
  //       headStyles: {
  //         fillColor: [155, 155, 155],
  //         textColor: "white",
  //         fontSize: 10,
  //       },
  //       bodyStyles: { fontSize: 9 },
  //       alternateRowStyles: { fillColor: [245, 245, 245] },
  //       margin: { left: 10, right: 10 },
  //     });

  //     // Add footer
  //     const pageCount = doc.internal.getNumberOfPages();
  //     for (let i = 1; i <= pageCount; i++) {
  //       doc.setPage(i);
  //       doc.setFontSize(8);
  //       doc.setTextColor(150, 150, 150);
  //       doc.text(
  //         `Page ${i} of ${pageCount}`,
  //         doc.internal.pageSize.width / 2,
  //         doc.internal.pageSize.height - 10,
  //         { align: "center" },
  //       );
  //     }

  //     doc.save(
  //       `credit_debit_notes_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`,
  //     );
  //     toast.success(`Exported ${productsToExport.length} note(s) as PDF`);

  //     // Clear selection
  //     setSelectedRowIds(new Set());
  //     setAllVisibleSelected(false);
  //   } catch (error) {
  //     console.error("PDF export error:", error);
  //     toast.error("Failed to generate PDF");
  //   }
  // };
  const handleExport = () => {
    // ❌ If nothing selected → show toast
    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one note to export");
      return;
    }

    // ✅ Only selected data
    const productsToExport = filteredData.filter((product) =>
      selectedRowIds.has(product.id),
    );

    try {
      const doc = new jsPDF("portrait", "mm", "a4");

      doc.setFontSize(20);
      doc.setTextColor(155, 155, 155);
      doc.text("Credit & Debit Notes Report", 105, 15, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated: ${format(new Date(), "dd MMM yyyy hh:mm a")}`,
        105,
        22,
        { align: "center" },
      );
      doc.text(`Total Notes: ${productsToExport.length}`, 105, 27, {
        align: "center",
      });

      doc.setDrawColor(200, 200, 200);
      doc.line(10, 32, 200, 32);

      const tableData = productsToExport.map((row, index) => [
        index + 1,
        row.issueDate,
        row.supplier,
        row.refinvno,
        row.type,
        row.amount,
        row.paystatus,
        row.status,
        row.createdby,
      ]);

      autoTable(doc, {
        startY: 35,
        head: [
          [
            "#",
            "Issue Date",
            "Supplier/Customer",
            "Ref. Invoice No.",
            "Type",
            "Amount",
            "Payment Status",
            "Status",
            "Created By",
          ],
        ],
        body: tableData,
        theme: "grid",
      });

      doc.save(
        `credit_debit_notes_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`,
      );

      toast.success(`Exported ${productsToExport.length} note(s)`);

      // reset selection
      setSelectedRowIds(new Set());
    } catch (error) {
      console.error(error);
      toast.error("Export failed");
    }
  };

  // Toggle select all for CURRENT PAGE
  // const toggleSelectAll = (e) => {
  //   const currentPageProducts = getCurrentPageProducts();
  //   const next = new Set(selectedRowIds);

  //   if (e.target.checked) {
  //     // Add only current page items
  //     currentPageProducts.forEach((product) => next.add(product.id));
  //   } else {
  //     // Remove only current page items
  //     currentPageProducts.forEach((product) => next.delete(product.id));
  //   }

  //   setSelectedRowIds(next);
  // };
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(filteredData.map((item) => item.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  // Toggle single selection
  const toggleSelectRow = (id) => {
    const next = new Set(selectedRowIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedRowIds(next);
  };

  // Show debit/credit modal
  const handleDebitCreditModel = (product) => {
    setSelectedProduct(product);
    setViewDebitCreditModel(true);
  };

  // Update allVisibleSelected for current page
  useEffect(() => {
    const currentPageProducts = getCurrentPageProducts();
    if (currentPageProducts.length > 0) {
      const allSelected = currentPageProducts.every((product) =>
        selectedRowIds.has(product.id),
      );
      setAllVisibleSelected(allSelected);
    } else {
      setAllVisibleSelected(false);
    }
  }, [selectedRowIds, pagination.page, filteredData]);

  // Initial data fetch
  useEffect(() => {
    fetchAllNotes();
  }, []);

  // Get current page products
  const currentPageProducts = getCurrentPageProducts();
  return (
    <div className="p-4" style={{ overflowY: "auto", height: "91vh" }}>
      {/* back, header, view style */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: "33px",
          }}
        >
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
            Credit Note Report
          </h2>
        </div>
        <DateFilterDropdown />
      </div>

      {/* Top stat cards */}
      <div className="d-flex flex-wrap gap-3 mb-3">
        {initialStats.map((s, idx) => (
          <Link
            to={s.link}
            key={idx}
            className="col-3"
            style={{ textDecoration: "none", }}
          >
            <div
              className="d-flex justify-content-between align-items-center bg-white position-relative"
              style={{
                width: "100%",
                height: "86px",
                padding: "16px 24px 16px 16px",
                fontFamily: "Inter",
                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
                border: "1px solid #E5F0FF",
                borderRadius: "8px",
                backgroundColor: "#FFFFFF",
              }}
            >
              {/* Blue Left Accent Line */}
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "70%",
                  backgroundColor: "#1F7FFF",
                  borderRadius: "1px 10px 1px 10px",
                }}
              ></span>

              {/* Left Content */}
              <div
                className="d-flex align-items-center"
                style={{ gap: "24px" }}
              >
                <div className="d-flex flex-column" style={{ gap: "11px" }}>
                  <h6
                    className="mb-0"
                    style={{
                      fontSize: "14px",
                      color: "#727681",
                      fontWeight: "500",
                    }}
                  >
                    {s.title}
                  </h6>
                  <div className="d-flex align-items-end gap-2">
                    <h5
                      className="mb-0"
                      style={{
                        fontSize: "22px",
                        color: "#0E101A",
                        fontWeight: "600",
                      }}
                    >
                      {s.value}
                    </h5>
                    {s.currency && (
                      <span style={{ fontSize: "14px", color: "#0E101A" }}>
                        {s.currency}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Icon Circle */}
              <div
                className="d-flex justify-content-center align-items-center rounded-circle"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5F0FF",
                  flexShrink: 0,
                }}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  style={{
                    width: "36px",
                    height: "36px",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* main content */}
      <div
        style={{
          width: "100%",
          minHeight: "auto",
          maxHeight: "calc(100vh - 320px)",
          padding: "16px",
          background: "white",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          fontFamily: "Inter, sans-serif",
          overflowY: "auto",
        }}
      >
        {/* tabs + Search Bar & export import */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            height: "33px",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              flexWrap: "wrap",
              height: "33px",
              maxWidth: "50%",
              minWidth: "auto",
            }}
          >
            {tabs.map((tab) => (
              <div
                key={tab.value}
                onClick={() => handleTabChange(tab.value)}
                role="button"
                style={{
                  padding: "4px 12px",
                  background: tab.active ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow: tab.active
                    ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                  cursor: "pointer",
                }}
              >
                {tab.label}
                <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          {/* Search Bar & export import */}
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
              width: "50%",
            }}
          >
            <div
              style={{
                width: "50%",
                position: "relative",
                padding: "8px 16px 8px 20px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
              }}
            >
              <IoIosSearch />
              <input
                type="text"
                placeholder="Search by supplier, invoice no, or type"
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

            <div
              style={{
                display: "inline-flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 16,
              }}
            >
              {/* Export Button */}
              {hasPermission(user, "CreditDebitNoteReport", "export") && (
                <button
                  onClick={handleExport}
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
        </div>

        {/* Table */}
        <div className="table-responsive"
          style={{
            overflowY: "auto",
            height: "calc(100vh - 310px)",
            maxHeight: '505px',
          }}
        >
          <table
            className="table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
                height: "38px",
                backgroundColor: "#F3F8FB",
              }}
            >
              <tr style={{ background: "#F3F8FB" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <input
                      type="checkbox"
                      // checked={allVisibleSelected}
                      // onChange={toggleSelectAll}
                      checked={
                        filteredData.length > 0 &&
                        filteredData.every((item) =>
                          selectedRowIds.has(item.id),
                        )
                      }
                      onChange={handleSelectAll}
                      style={{ width: 18, height: 18 }}
                    />
                    Date
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 200,
                    fontWeight: "400",
                  }}
                >
                  Credit Note No.
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Invoice No.
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Customer
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Return Products
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Return QTY
                </th>

                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Unit
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Credit Amount
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Refund Amount
                </th>
                
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Due Amount
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Transaction Source
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Payment Type
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 120,
                    fontWeight: "400",
                  }}
                >
                  Reason
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentPageProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-muted py-3">
                    {search
                      ? "No notes found matching your search"
                      : "No credit/debit notes found"}
                  </td>
                </tr>
              ) : (
                currentPageProducts.map((product, index) => {
                  const statusStyle =
                    statusStyles[product.status] || statusStyles.Processing;
                  const paymentStyle =
                    statusStyles[product.paystatus] || statusStyles.Pending;

                  return (
                    <tr
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                      key={index}
                      style={{ borderBottom: "1px solid #FCFCFC" }}
                    >
                      {/* issued date */}
                      <td
                        style={{ padding: "8px 16px", verticalAlign: "middle" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                          onClick={() => handleDebitCreditModel(product)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedRowIds.has(product.id)}
                            onChange={() => toggleSelectRow(product.id)}
                            style={{ width: 18, height: 18 }}
                            onClick={(e) => e.stopPropagation()}
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
                                cursor: "pointer",
                              }}
                            >
                              <div>{product.issueDate}</div>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* supplier/customer */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.supplier}
                      </td>
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.supplier}
                      </td>
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.supplier}
                      </td>
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.supplier}
                      </td>

                      {/* ref invoice no */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.refinvno}
                      </td>

                      {/* type */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color:
                            product.type === "Debit Note"
                              ? "#FF6B6B"
                              : "#4CAF50",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.type}
                      </td>

                      {/* amount */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.amount}
                      </td>

                      {/* payment status */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "2px 8px",
                            borderRadius: 50,
                            background: paymentStyle.bg,
                            color: paymentStyle.color,
                            fontSize: 12,
                            fontWeight: 400,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {product.paystatus === "Paid" && (
                            <TiTick style={{ marginRight: 4 }} />
                          )}
                          {paymentStyle.label}
                        </div>
                      </td>

                      {/* status */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            borderRadius: 36,
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          {product.status === "Approved" ? (
                            <TiTick />
                          ) : product.status === "Rejected" ? (
                            "x"
                          ) : (
                            ""
                          )}{" "}
                          {product.status}
                        </span>
                      </td>

                      {/* createdby */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.createdby}
                      </td>
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.createdby}
                      </td>
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDebitCreditModel(product)}
                      >
                        {product.createdby}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={pagination.page}
            total={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            onItemsPerPageChange={(val) =>
              setPagination((prev) => ({ ...prev, limit: val, page: 1 }))
            }
          />
        </div>
      </div>

      {/* view debit credit report model */}
      {viewDebitCreditModel && (
        <ViewDebitCreditModal
          closeModal={() => setViewDebitCreditModel(false)}
          selectedProduct={selectedProduct}
        />
      )}
    </div>
  )
}

export default CreditNoteReport
