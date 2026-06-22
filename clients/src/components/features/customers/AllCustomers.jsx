import React, { useEffect, useState, useRef, useMemo } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import { TbFileExport } from "react-icons/tb";
import Pagination from "../../../components/Pagination";
import AddCustomers from "../../../pages/Modal/customerModals/AddCustomerModal"; // Your new Add modal
import EditCustomerModal from "../../../pages/Modal/customerModals/EditCustomerModal"; // Your new Edit modal
import CustomerDetails from "../../../pages/Modal/customerModals/CustomerDetails"; // Side details panel
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import CreditNoteImg from "../../../assets/images/create-creditnote.png";
import CreditICONImg from "../../../assets/images/create-icon1.png";
import GenerateICONImg from "../../../assets/images/create-icon4.png";
import DeleteICONImg from "../../../assets/images/delete.png";
import EditICONImg from "../../../assets/images/edit.png";
import ConfirmDeleteModal from "../../ConfirmDelete";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasPermission } from "../../../utils/permission/hasPermission";
import ProductDefaultImage from '../../../assets/images/product-default.png'
import * as XLSX from "xlsx";
import DateFilterDropdown from "../../../components/DateFilterDropdown";

const menuItems = [
  {
    label: "Edit",
    icon: <img src={EditICONImg} size={18} />,
    action: "edit",
    permission: "update",
  },
  {
    label: "Create Invoice",
    icon: <img src={CreditICONImg} size={18} />,
    action: "invoice",
    permission: "create",
  },
  {
    label: "Generate Quotation",
    icon: <img src={GenerateICONImg} size={30} />,
    action: "quotation",
    permission: "create",
  },
  {
    label: "Create Credit Notes",
    icon: <img src={CreditNoteImg} size={18} />,
    action: "credit_note",
    permission: "create",
  },
  {
    label: "Delete",
    icon: <img src={DeleteICONImg} size={18} />,
    action: "delete",
    permission: "delete",
  },
];

import { useAuth } from "../../auth/AuthContext";

export default function Customers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const navigate = useNavigate();
  // Add these to your existing state declarations
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  // const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const menuRef = useRef();
  const detailsRef = useRef(null);

  // Fetch customers on mount
  useEffect(() => {
    fetchCustomers();
  }, [dateRange]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
        // Add date range filter if both dates are selected
    if (dateRange?.startDate && dateRange?.endDate) {
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();
    }
      const res = await api.get("/api/customers/active-customers", { params });
      setCustomers(res.data?.customers || []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate tab counts
  const calculateTabCounts = useMemo(() => {
    if (!customers.length) return { All: 0, New: 0, Elite: 0, Overdue: 0 };
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // Fix date mutation issue

    let newCount = 0;
    let eliteCount = 0;
    let overdueCount = 0;

    customers.forEach(customer => {
      const createdAt = new Date(customer.createdAt);

      // New: Created in last 30 days
      if (createdAt >= sevenDaysAgo) {
        newCount++;
      }

      // Elite: Based on spending or loyalty tier
      const isElite =
        (customer.totalPurchaseAmount > 10000) || // Spent more than 10,000
        (customer.loyaltyTier === "gold" || customer.loyaltyTier === "platinum") ||
        (customer.totalPurchases > 10); // More than 10 purchases

      if (isElite) {
        eliteCount++;
      }

      // Overdue: Has due amount and possibly overdue invoices
      if (customer.totalDueAmount > 0) {
        overdueCount++;
      }
    });

    return {
      All: customers.length,
      New: newCount,
      Elite: eliteCount,
      Overdue: overdueCount
    };
  }, [customers]);

  // Create tabs data with calculated counts
  const tabsData = [
    { label: "All", count: calculateTabCounts.All },
    { label: "New", count: calculateTabCounts.New },
    { label: "Elite", count: calculateTabCounts.Elite },
    { label: "Overdue", count: calculateTabCounts.Overdue },
  ];

  // Filter customers based on active tab and search
  const filteredCustomers = useMemo(() => {
    if (!customers.length) return [];

    let filtered = [...customers];

    // Apply tab filter
    if (activeTab !== "All") {
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);

      switch (activeTab) {
        case "New":
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          filtered = filtered.filter(customer => {
            const createdAt = new Date(customer.createdAt);
            return createdAt >= sevenDaysAgo;
          });
          break;

        case "Elite":
          filtered = filtered.filter(customer => {
            // Define elite criteria
            const isElite =
              (customer.totalPurchaseAmount > 10000) || // Spent more than 10,000
              (customer.loyaltyTier === "gold" || customer.loyaltyTier === "platinum") ||
              (customer.totalPurchases > 10); // More than 10 purchases
            return isElite;
          });
          break;

        case "Overdue":
          filtered = filtered.filter(customer =>
            customer.totalDueAmount > 0
          );
          break;
        default:
          break;
      }
    }

    // Apply search filter
    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.name?.toLowerCase().includes(searchTerm) ||
        customer.phone?.includes(search) ||
        customer.email?.toLowerCase().includes(searchTerm) ||
        customer.address?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [customers, activeTab, search]);

  // Paginate filtered customers
  const paginatedCustomers = useMemo(() => {
    const indexOfLastTerm = currentPage * itemsPerPage;
    const indexOfFirstTerm = indexOfLastTerm - itemsPerPage;
    return filteredCustomers.slice(indexOfFirstTerm, indexOfLastTerm);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuAction = async (action, customer) => {
    setOpenMenuIndex(null);
    switch (action) {
      case "edit":
        setSelectedCustomer(customer);
        setOpenEditModal(true);
        break;
      case "delete":
        setSelectedCustomer(customer);
        setShowDeleteModal(true);
        break;
      case "invoice":
        navigate(`/createinvoice/${customer._id}`, {
          state: { customer }
        });
        break;
      case "quotation":
        navigate(`/create-quotition/${customer._id}`, {
          state: { customer },
        });
        break;
      case "credit_note":
        navigate(`/credit-note/${customer._id}`, {
          state: { customer },
        });
        break;
      default:
        break;
    }
  };

  const handleRowClick = (customer) => {
    if (!event.target.closest('input[type="checkbox"]') &&
      !event.target.closest('.button-action')) {
      setSelectedCustomer(customer);
      setOpenDetailsModal(true);
    };
  }

  useEffect(() => {
    if (!loading && customers.length === 0) {
      navigate("/empty-customers", { replace: true });
    }
  }, [loading, customers, navigate]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    setSelectedRowIds(new Set());
    setSelectAllGlobal(false);
  }, [activeTab, search]);

  useEffect(() => {
    setSearch("");
    setCurrentPage(1);    // Reset pagination
  }, [activeTab]);

const handleExportExcel = () => {
  try {
    if (selectedRowIds.size === 0) {
      toast.error("Select at least 1 row to export data");
      return;
    }

    // Get selected customers
    const visibleRows = filteredCustomers.filter(customer =>
      selectedRowIds.has(customer._id)
    );

    if (visibleRows.length === 0) {
      toast.error("No customers selected to export");
      return;
    }

    // Prepare data for Excel
    const excelData = visibleRows.map((customer, index) => {
        const addressParts = [];
      if (customer.city) addressParts.push(customer.city);
      if (customer.state) addressParts.push(customer.state);
      if (customer.country) addressParts.push(customer.country);
      if (customer.pincode) addressParts.push(customer.pincode);
      
      const fullAddress = addressParts.filter(part => part && part.trim() !== "").join(", ");
      return {
      // "S.No": index + 1,
      "Customer Name": customer.name || "—",
      "Phone": customer.phone || "—",
      "Email": customer.email || "—",
      "Address": fullAddress  || "—",
      "Points Available": customer.availablePoints || 0,
      "Due Amount": `₹${(customer.totalDueAmount || 0).toFixed(2)}`,
      "Total Spent": `₹${(customer.totalPurchaseAmount || 0).toFixed(2)}`
    }});

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      // { wch: 8 },   // S.No
      { wch: 25 },  // Customer Name
      { wch: 15 },  // Phone
      { wch: 25 },  // Email
      { wch: 30 },  // Address
      { wch: 15 },  // Points Available
      { wch: 15 },  // Due Amount
      { wch: 15 }   // Total Spent
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    // Save the file
    const filename = `customers_${visibleRows.length}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    toast.success(`Exported ${visibleRows.length} customer${visibleRows.length !== 1 ? "s" : ""}`);

    // Clear selection after export
    setSelectedRowIds(new Set());
    setSelectAllGlobal(false);
  } catch (error) {
    toast.error(error?.message || "Failed to export data");
  }
};

  // Add this useEffect near your other useEffect hooks
  useEffect(() => {
    const allCurrentPageIds = paginatedCustomers.map(customer => customer._id);
    const allSelected =
      allCurrentPageIds.length > 0 &&
      allCurrentPageIds.every(id => selectedRowIds.has(id));
    setSelectAllGlobal(allSelected);
  }, [selectedRowIds, paginatedCustomers]);

  // handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDetailsModal && detailsRef.current && !detailsRef.current.contains(event.target)) {
        setOpenDetailsModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDetailsModal]);

  return (
    <div className="p-4" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ marginBottom: "20px" }}
      >
        <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
          Customers
        </h3>
         <div className="d-flex align-items-center gap-3">
    <DateFilterDropdown
      selectedDateRange={dateRange}
      setSelectedDateRange={setDateRange}
    />
        {hasPermission(user, "Customer", "create") && (
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
            onClick={() => setOpenAddModal(true)}
          >
            + Add Customer
          </button>
        )}
      </div>
      </div>

      {/* Main Card */}
      <div style={{
        overflowX: "auto",
        width: "100%",
        padding: 16,
        background: "white",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "Inter, sans-serif",
      }}>
        {/* Tabs + Search + Export */}
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div
              style={{
                background: "#F3F8FB",
                padding: 3,
                borderRadius: 8,
                display: "flex",
                gap: 8,
                overflowX: "auto",
                height: "33px",
              }}
            >
              {tabsData.map((t) => {
                const active = activeTab === t.label;
                return (
                  <div
                    key={t.label}
                    onClick={() => setActiveTab(t.label)}
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

          <div style={{
            display: "flex",
            justifyContent: "end",
            gap: "24px",
            height: "33px",
            width: "50%"
          }}>
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
              <FiSearch className="fs-5" />
              <input
                type="search"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                placeholder="Search by Customer Name or Phone No."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {hasPermission(user, "Customer", "export") && (
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
                  cursor: paginatedCustomers.length > 0 ? "pointer" : "not-allowed",
                  opacity: paginatedCustomers.length > 0 ? 1 : 0.5,
                }}
                onClick={handleExportExcel}
                disabled={paginatedCustomers.length === 0}
                title={ selectedRowIds.size > 0 ? `Export ${selectedRowIds.size} selected customer(s)` : "Export all visible customers" }
              >
                <TbFileExport className="fs-5" style={{ color: "#6C748C" }} />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Table */}
            <div className=""
              style={{
                overflowY: "auto",
                height: "calc(100vh - 310px)",
                maxHeight: '500px',
              }}>
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
                    padding: "0px 0px",
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0px", justifyContent: 'center' }}>
                    <input
                      type="checkbox"
                      aria-label="select all"
                      checked={selectAllGlobal}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select ALL filtered customers across all pages
                          const allIds = new Set(filteredCustomers.map(c => c._id));
                          setSelectedRowIds(allIds);
                          setSelectAllGlobal(true);
                        } else {
                          // Unselect all
                          setSelectedRowIds(new Set());
                          setSelectAllGlobal(false);
                        }
                      }}
                    />
                  </div>
                </th>
                {[
                  "Customer Name",
                  "Points Available",
                  "Due Amount",
                  "Total Spent",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    {h}
                  </th>
                ))}
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
              ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: 0 }}>
                      <div
                        style={{
                          marginTop: "20px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          color: 'rgba(255, 68, 31, 1)'
                        }}
                      >No Customer Found
                      </div>
                    </td>
                  </tr>
              ) : (
                paginatedCustomers.map((customer, index) => (
                  <tr
                    key={customer._id}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                      cursor: 'pointer',
                    }}
                    className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    onClick={() => handleRowClick(customer)}
                  >
                    {/* Checkbox Column */}
                    <td style={{
                      padding: "0px 0px",
                      color: "#0E101A",
                      fontSize: "14px",
                    }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: 'center' }}>
                        <input
                          type="checkbox"
                          aria-label="select customer"
                          checked={selectedRowIds.has(customer._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const next = new Set(selectedRowIds);
                            if (e.target.checked) {
                              next.add(customer._id);
                            } else {
                              next.delete(customer._id);
                              setSelectAllGlobal(false);
                            }
                            setSelectedRowIds(next);
                          }}
                        />
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        color: "#0E101A",
                        fontSize: "14px",
                      }}>
                      <div
                        className="d-flex align-items-center"
                        style={{ gap: 10 }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "#eee",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            color: "#666",
                          }}
                        >
                          {/* {customer.name?.charAt(0).toUpperCase() || "C"} */}
                          <img src={ProductDefaultImage} alt='Product Default Image' className="media-image" />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 400,
                              color: "#0E101A",
                            }}
                          >
                            {customer.name || "Unknown"}
                          </div>
                          <div style={{ fontSize: 12, color: "#727681" }}>
                            {customer.phone || "No phone"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      🪙 {customer.availablePoints || 0} points
                    </td>

                    <td
                      style={{
                        padding: "4px 16px",
                        fontWeight: 500,
                        color: customer.totalDueAmount > 0 ? "#D92D20" : "#727681",
                      }}
                    >
                      {customer.totalDueAmount > 0 ? `₹${customer.totalDueAmount.toFixed(2)}` : "₹0.00/-"}
                    </td>

                    <td style={{ padding: "4px 16px", color: customer.totalPurchaseAmount > 0 ? "#16A34A" : "#727681", }}>
                      {customer.totalPurchaseAmount > 0 ? `₹${customer.totalPurchaseAmount.toFixed(2)}` : "₹0.00/-"}
                    </td>

                    <td
                      style={{
                        padding: "4px 16px",
                        position: "relative",
                        overflow: "visible",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >

                      {/* three dot button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuIndex(
                            openMenuIndex === index ? null : index
                          );
                          const rect =
                            e.currentTarget.getBoundingClientRect();
                          setOpenMenuIndex(openMenuIndex === index ? null : index)

                          const dropdownHeight = 260; // your menu height
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

                      {/* dropdown */}
                      {openMenuIndex === index && (
                        <div
                          style={{
                            position: "fixed",
                            top: openUpwards
                              ? dropdownPos.y - 270
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
                              minWidth: 180,
                              height: "auto", // height must match dropdownHeight above
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            {/* {menuItems.map((item) => (
                              
                              <div
                                key={item.action}
                                onClick={() =>
                                  handleMenuAction(item.action, customer)
                                }
                                className="button-action"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "8px 12px",
                                  fontFamily: "Inter, sans-serif",
                                  fontSize: 16,
                                  fontWeight: 400,
                                  cursor: "pointer",
                                  borderRadius: 8,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "#e3f2fd";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor =
                                    "transparent";
                                }}
                              >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                              </div>
                            ))} */}
                            {menuItems
                              .filter(item => hasPermission(user, "Customer", item.permission))
                              .map((item) => (
                                <div
                                  key={item.action}
                                  onClick={() => handleMenuAction(item.action, customer)}
                                  className="button-action"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderRadius: 8,
                                  }}
                                >
                                  <span>{item.icon}</span>
                                  <span>{item.label}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={currentPage}
            total={filteredCustomers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>

        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onCancel={() => {
            setShowDeleteModal(false);
            setSelectedCustomer(null);
          }}
          onConfirm={async () => {
            try {
              await api.delete(`/api/customers/${selectedCustomer._id}`);
              toast.success("Customer deleted successfully!");
              fetchCustomers();
            } catch (error) {
              toast.error(error?.response?.data?.displayMessage || "Failed to delete customer");
            } finally {
              setShowDeleteModal(false);
              setSelectedCustomer(null);
            }
          }}
        />
      </div>

      {/* Side Details Modal */}
      {openDetailsModal && selectedCustomer && (
        <>
          <span
            onClick={() => setOpenDetailsModal(false)}
            style={{
              cursor: "pointer",
              position: "fixed",
              left: "calc(100vw - 760px)", // Position just left of panel
              top: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #EAEAEA",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              zIndex: 10000, // Higher than panel's z-index
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <IoIosArrowBack style={{ color: "#6C748C", fontSize: "18px" }} />
          </span>
          <div
            ref={detailsRef}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "740px",
              height: "100vh",
              background: "white",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
              transition: "right 0.4s ease",
              zIndex: 9999,
              overflowY: "auto",
            }}
          >
            <CustomerDetails
              data={selectedCustomer}
              onClose={() => setOpenDetailsModal(false)}
              onEdit={(customer) => {
                setOpenDetailsModal(true);
                setSelectedCustomer(customer);
                setOpenEditModal(true);
              }}
            />
          </div>
        </>
      )}

      {/* Add Customer Modal */}
      {openAddModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.27)",
            backdropFilter: "blur(1px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999999,
            overflow: "auto"
          }}
          onClick={() => setOpenAddModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AddCustomers
              onClose={() => {
                setOpenAddModal(false);
                fetchCustomers();
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}

      {openEditModal && selectedCustomer && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.27)",
            backdropFilter: "blur(1px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999999,
          }}
          onClick={() => setOpenEditModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <EditCustomerModal
              customer={selectedCustomer}
              onClose={() => {
                setOpenEditModal(false);
                setSelectedCustomer(null);
                fetchCustomers();
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
