import React, { useEffect, useRef, useState } from "react";
import { LuSearch, LuUserPlus } from "react-icons/lu";
import { BsThreeDots } from "react-icons/bs";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import Supplierimg from "../../../assets/images/suppimg.png";
import { CiCircleInfo } from "react-icons/ci";
import "../../../pages/Modal/suppliers/Supplier.css";
import { Link, useNavigate } from "react-router-dom";
import AddSupplier from "../../../pages/Modal/suppliers/AddSupplierModals";
import SupplierDetails from "./SupplierDetails";
import { PiInfo } from "react-icons/pi";
import { FiSearch } from "react-icons/fi";
import { TbFileExport } from "react-icons/tb";
import CreditNoteImg from "../../../assets/images/create-creditnote.png";
import CreditICONImg from "../../../assets/images/create-icon1.png";
import GenerateICONImg from "../../../assets/images/create-icon4.png";
import DeleteICONImg from "../../../assets/images/delete.png";
import EditICONImg from "../../../assets/images/edit.png";
import Pagination from "../../../components/Pagination";
import ConfirmDeleteModal from "../../../components/ConfirmDelete";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import EditSupplierModal from "../../../pages/Modal/suppliers/EditSupplierModals";
import { IoIosArrowBack } from "react-icons/io";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { GoPlus } from "react-icons/go";
import { hasPermission } from "../../../utils/permission/hasPermission";
import ProductDefaultImage from '../../../assets/images/product-default.png'
import * as XLSX from "xlsx";
import DateFilterDropdown from "../../../components/DateFilterDropdown";

const menuItems = [
  {
    label: "Edit",
    icon: <img src={EditICONImg} size={18} />,
    action: "edit",
    permission: "update"
  },
  {
    label: "Create Purchase",
    icon: <img src={CreditICONImg} size={18} />,
    action: "invoice",
    permission: "create"
  },
  {
    label: "Create Debit Notes",
    icon: <img src={CreditNoteImg} size={18} />,
    action: "credit_note",
    permission: "create"
  },
  {
    label: "Delete",
    icon: <img src={DeleteICONImg} size={18} />,
    action: "delete",
    permission: "delete"
  },
];
import { useAuth } from "../../auth/AuthContext";

const SupplierList = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [openModal, setOpenModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [search, setSearch] = useState("");
  const [openAddSupplierModal, setOpenAddSupplierModal] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEditModal, setOpenEditModal] = useState(false);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  // const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  const [activeRow, setActiveRow] = useState(null);

  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params={};
          // Add date range filter if both dates are selected
    if (dateRange?.startDate && dateRange?.endDate) {
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();
    }
      const res = await api.get("/api/suppliers/active-suppliers", {params});
      // console.log('ressssss', res.data)
      setSuppliers(res.data.suppliers || []);
    } catch (err) {
      // console.error(err);
      toast.error(err?.response?.data?.displayMessage ||
        err?.response?.data?.message ||
        "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [dateRange]);

  const tabsData = [
    { label: "All", count: suppliers.length },
    {
      label: "Manufacturer",
      count: suppliers.filter((s) => s.businessType === "Manufacturer").length,
    },
    {
      label: "Distributor",
      count: suppliers.filter((s) => s.businessType === "Distributor").length,
    },
    {
      label: "Wholesaler",
      count: suppliers.filter((s) => s.businessType === "Wholesaler").length,
    },
  ]

  const menuRef = useRef();
  const addSupplierRef = useRef(null);

  const detailsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuIndex(false);
      }
      if (
        addSupplierRef.current &&
        !addSupplierRef.current.contains(e.target)
      ) {
        setOpenAddSupplierModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat("en-IN").format(Math.abs(amount));
    return `${amount < 0 ? "-" : ""}₹ ${formatted}/-`;
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesTab =
      activeTab === "All" || s.businessType === activeTab;

    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.toLowerCase().includes(search.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  // 1. Reset everything when tab changes
  useEffect(() => {
    setSearch("");
    setCurrentPage(1);
    setSelectedRowIds(new Set());
    setSelectAllGlobal(false);
  }, [activeTab]);

  // 2. Reset page & selection when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedRowIds(new Set());
    setSelectAllGlobal(false);
  }, [search]);


  // 3. Keep the selectAllGlobal sync effect as-is
  useEffect(() => {
    if (filteredSuppliers.length === 0) {
      setSelectAllGlobal(false);
      return;
    }
    const allSelected = filteredSuppliers.every(s => selectedRowIds.has(s._id));
    setSelectAllGlobal(allSelected);
  }, [selectedRowIds, filteredSuppliers]);

  const handleMenuAction = async (action, supplier) => {
    // console.log("🔄 Edit clicked, supplier object:", supplier);
    // console.log("📌 Supplier ID:", supplier._id)
    setOpenMenuIndex(null);
    switch (action) {
      case "edit":
        setSelectedSupplier(supplier);
        setOpenEditModal(true);
        break;
      case "delete":
        setSelectedSupplier(supplier);
        setShowDeleteModal(true);
        break;
      case "invoice":
        navigate(`/create-purchase/${supplier._id}`, {
          state: { supplier }
        });
        break;
      case "credit_note":
        navigate(`/create-supplier-debitnote/${supplier._id}`, {
          state: {
            type: "supplier",
            supplier: supplier,
            from: "/supplier-list"  // Add this line
          }
        });
        break;
      default:
        break;
    }
  };

  const handleRowClick = (supplierId, event) => {
    if (!event.target.closest('input[type="checkbox"]') &&
      !event.target.closest('.button-action')) {
      setSelectedSupplier(supplierId);
      setOpenModal(true);
    };
  }

  useEffect(() => {
      // Only redirect if no date filter is applied
  const hasDateFilter = dateRange?.startDate && dateRange?.endDate;
    if (!loading && suppliers.length === 0 && !hasDateFilter) {
      navigate("/empty-supplier", { replace: true });
    }
  }, [loading, suppliers, navigate, dateRange]);


  // const handleExportPDF = () => {
  //   const doc = new jsPDF();
  //   doc.text("Supplier Report", 14, 15);

  //   const tableColumns = [
  //     "Supplier Name",
  //     "Phone",
  //     "Email",
  //     "Address",
  //     "Business Type",
  //     // "Category/Brand",
  //     "Balance Amount",
  //     "Total Spent"
  //   ];

  //   // Get visible rows - selected ones or all if none selected
  //   if (selectedRowIds.size === 0) {
  //     toast.error("Select at least 1 supplier.");
  //   }
  //   const visibleRows = filteredSuppliers.filter(supplier => selectedRowIds.has(supplier._id))

  //   if (visibleRows.length === 0) {
  //     // toast.error("No supplier selected to export");
  //     return;
  //   }

  //   const tableRows = visibleRows.map(supplier => [
  //     supplier.name || "—",
  //     supplier.phone || "—",
  //     supplier.email || "—",
  //     `${supplier.address.addressLine || ""}` || "",
  //     supplier.businessType || "—",
  //     // supplier.category?.join(", ") || "—",
  //     `INR${supplier.balance >= 0 ? "" : "-"}INR ${Math.abs(supplier.balance || 0).toFixed(2)}`,
  //     `INR ${(supplier.totalSpent || 0).toFixed(2)}`
  //   ]);

  //   autoTable(doc, {
  //     head: [tableColumns],
  //     body: tableRows,
  //     startY: 20,
  //     styles: {
  //       fontSize: 8,
  //     },
  //     headStyles: {
  //       fillColor: [155, 155, 155],
  //       textColor: "white",
  //     },
  //     theme: "striped",
  //   });

  //   const filename = `suppliers-${visibleRows.length}-${new Date().toISOString().split('T')[0]}`;
  //   doc.save(`${filename}.pdf`);

  //   toast.success(`Exported ${visibleRows.length} supplier${visibleRows.length !== 1 ? "s" : ""}`);

  //   // Clear selection after export
  //   setSelectedRowIds(new Set());
  //   setSelectAllGlobal(false);
  // };

  const handleExportExcel = () => {
  try {
    if (selectedRowIds.size === 0) {
      toast.error("Select at least 1 supplier to export data");
      return;
    }

    // Get selected suppliers
    const rowsToExport = filteredSuppliers.filter(supplier =>
      selectedRowIds.has(supplier._id)
    );

    if (rowsToExport.length === 0) {
      toast.error("No suppliers to export");
      return;
    }

    // Prepare data for Excel
    const excelData = rowsToExport.map((supplier, index) => {
      // Build full address from address fields
      const addressParts = [];
      if (supplier.address?.addressLine) addressParts.push(supplier.address.addressLine);
      if (supplier.address?.city) addressParts.push(supplier.address.city);
      if (supplier.address?.state) addressParts.push(supplier.address.state);
      if (supplier.address?.country) addressParts.push(supplier.address.country);
      if (supplier.address?.pincode) addressParts.push(supplier.address.pincode);
      
      const fullAddress = addressParts.filter(part => part && part.trim() !== "").join(", ");

      return {
        // "S.No": index + 1,
        "Supplier Name": supplier.name || "—",
        "Phone": supplier.phone || "—",
        "Email": supplier.email || "—",
        "Address": fullAddress || "—",
        "Business Type": supplier.businessType || "—",
        "Balance Amount": supplier.balance >= 0 ? `₹${supplier.balance.toFixed(2)}` : `-₹${Math.abs(supplier.balance).toFixed(2)}`,
        "Total Spent": `₹${(supplier.totalSpent || 0).toFixed(2)}`
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      // { wch: 8 },   // S.No
      { wch: 25 },  // Supplier Name
      { wch: 15 },  // Phone
      { wch: 25 },  // Email
      { wch: 40 },  // Address
      { wch: 18 },  // Business Type
      { wch: 15 },  // Balance Amount
      { wch: 15 }   // Total Spent
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");

    // Save the file
    const filename = `suppliers_${rowsToExport.length}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    toast.success(`Exported ${rowsToExport.length} supplier${rowsToExport.length !== 1 ? "s" : ""}`);

    // Clear selection after export
    setSelectedRowIds(new Set());
    setSelectAllGlobal(false);
  } catch (error) {
    toast.error(error?.message || "Failed to export data");
  }
};
  // useEffect(() => {
  //   const allCurrentPageIds = paginatedSuppliers.map(supplier => supplier._id);
  //   const allSelected =
  //     allCurrentPageIds.length > 0 &&
  //     allCurrentPageIds.every(id => selectedRowIds.has(id));
  //   setSelectAllGlobal(allSelected);
  // }, [selectedRowIds, paginatedSuppliers]);

  useEffect(() => {
    if (filteredSuppliers.length === 0) {
      setSelectAllGlobal(false);
      return;
    }
    const allSelected =
      filteredSuppliers.every(s => selectedRowIds.has(s._id));
    setSelectAllGlobal(allSelected);
  }, [selectedRowIds, filteredSuppliers]);

  // handle click outside for close supplier detail modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openModal && detailsRef.current && !detailsRef.current.contains(event.target)) {
        setOpenModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openModal])

  return (
    <div className="p-4" style={{ fontFamily: '"Inter", sans-serif', height: "100vh", overflowY: "auto" }}>

      <div style={{ fontFamily: '"Inter", sans-serif' }}>
        {/* Header Section */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0px 0px 16px 0px", // Optional: padding for container
          }}
        >
          <span
            style={{
              color: "#0E101A",
              fontWeight: 500,
              fontSize: "22px",
              lineHeight: "120%",
              fontFamily: '"Inter", sans-serif',
            }}
          >
            Suppliers
          </span>
          <div className="d-flex align-items-center gap-3">
              <DateFilterDropdown
                selectedDateRange={dateRange}
                setSelectedDateRange={setDateRange}
              />
          {hasPermission(user, "Supplier", "create") && (
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
              onClick={() => setOpenAddSupplierModal(true)}
            >
              + Add Supplier
            </button>
          )}
        </div>
        </div>

        {/* main Section */}
        <div
          style={{
            width: "100%",
            minHeight: "auto",
            maxHeight: "calc(100vh - 150px)",
            padding: 16,
            background: "white",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Filters and Search */}
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
                        boxShadow: active
                          ? "0 1px 4px rgba(0,0,0,0.08)"
                          : "none",
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

            <div className="" style={{
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
                  placeholder="Search by Supplier Name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {hasPermission(user, "Supplier", "export") && (
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
                    cursor: paginatedSuppliers.length > 0 ? "pointer" : "not-allowed",
                    opacity: paginatedSuppliers.length > 0 ? 1 : 0.5,
                  }}
                  onClick={handleExportExcel}
                  disabled={filteredSuppliers.length === 0}
                  title={
                    selectedRowIds.size > 0
                      ? `Export ${selectedRowIds.size} selected supplier(s)`
                      : "Select at least one supplier to export."
                  }

                >
                  <TbFileExport
                    className="fs-5" style={{ color: "#6C748C" }}
                  />
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
                            const allIds = new Set(filteredSuppliers.map((s) => s._id));
                            setSelectedRowIds(allIds);
                            setSelectAllGlobal(true);
                          } else {
                            setSelectedRowIds(new Set());
                            setSelectAllGlobal(false);
                          }
                        }}
                      />
                    </div>
                  </th>
                  {[
                    "Supplier Name",
                    // "Category / Brand Dealing With",
                    "Bussiness Type",
                    "Balance Amount",
                    "Total Spent",
                    "Actions",
                  ].map((heading, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "12px 16px",
                        color: "#727681",
                        fontSize: "14px",
                        fontWeight: 400,
                      }}
                    >
                      {heading === "Balance Amount" ? (
                        <>
                          {heading}{" "}
                          <PiInfo
                            style={{ color: "#6C748C", fontWeight: 500 }}
                          />
                        </>
                      ) : (
                        heading
                      )}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {paginatedSuppliers.length === 0 ? (
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
                      >No Supplier Found
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedSuppliers.map((supplier, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                        cursor: 'pointer',
                      }}
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                      onClick={(e) => handleRowClick(supplier._id, e)}
                    >
                      <td
                        style={{
                          padding: "0px 0px",
                          color: "#0E101A",
                          fontSize: "14px",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: 'center' }}>
                          <input
                            type="checkbox"
                            aria-label="select supplier"
                            checked={selectedRowIds.has(supplier._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const next = new Set(selectedRowIds);
                              if (e.target.checked) {
                                if (supplier._id) next.add(supplier._id);
                              } else {
                                if (supplier._id) next.delete(supplier._id);
                              }
                              setSelectedRowIds(next);
                            }}
                          />
                        </div>
                      </td>
                      {/* Supplier Name */}
                      <td
                        style={{
                          padding: "4px 16px",
                          color: "#0E101A",
                          fontSize: "14px",
                        }}>
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: "10px" }}
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
                            <img src={ProductDefaultImage} alt='Product Default Image' className="media-image" />
                          </div>
                          <div>
                            <div
                              style={{
                                color: "#0E101A",
                                fontWeight: 400,
                                fontSize: "14px",
                                fontFamily: '"Inter", sans-serif',
                              }}
                            >
                              {supplier.name}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#727681",
                                fontFamily: '"Inter", sans-serif',
                              }}
                            >
                              {supplier.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      {/* <td style={{ padding: "4px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                          }}
                        >
                          {supplier.category.map((item, i) => (
                            <span
                              key={i}
                              style={{
                                backgroundColor: "#E5F0FF",
                                color: "#0E101A",
                                borderRadius: "16px",
                                padding: "4px 12px",
                                fontSize: "14px",
                                fontFamily: '"Inter", sans-serif',
                              }}
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </td> */}

                      {/* Bussiness Type */}
                      <td
                        style={{
                          color: "#0E101A",
                          fontWeight: "500",
                          padding: "4px 16px",
                          fontFamily: '"Inter", sans-serif',
                        }}
                      >
                        {supplier.businessType}
                      </td>
                      {/* Balance */}
                      <td
                        style={{
                          color: supplier.balance < 0 ? "#D00003" : "#0D6828",
                          fontWeight: "500",
                          padding: "4px 16px",
                          fontFamily: '"Inter", sans-serif',
                        }}
                      >
                        {formatCurrency(supplier.balance)}
                      </td>

                      {/* Total Spent */}
                      <td
                        style={{
                          color: "#0E101A",
                          fontSize: "14px",
                          padding: "4px 16px",
                          fontFamily: '"Inter", sans-serif',
                        }}
                      >
                        ₹{" "}
                        {new Intl.NumberFormat("en-IN").format(
                          supplier.totalSpent
                        )}
                        /-
                      </td>

                      {/* Actions */}
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
                                ? dropdownPos.y - 220
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
                              {menuItems
                                .filter(item => hasPermission(user, "Supplier", item.permission))
                                .map((item) => (

                                  <div
                                    key={item.action}
                                    onClick={() =>
                                      handleMenuAction(item.action, supplier)
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
                                ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="page-redirect-btn px-2">
            <Pagination
              currentPage={currentPage}
              total={filteredSuppliers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          </div>

        </div>

        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          onCancel={() => { setShowDeleteModal(false); setSelectedSupplier(null); }}
          onConfirm={async () => {
            try {
              await api.delete(`/api/suppliers/${selectedSupplier._id}`);
              toast.success("Supplier deleted successfully");
              setSuppliers((prev) =>
                prev.filter((s) => s._id !== selectedSupplier._id)
              );
              setShowDeleteModal(false);
              setSelectedSupplier(null);
            } catch (error) {
              console.error("Delete Supplier Error:", error);
              // toast.error(
              //   error.response?.data?.message ||
              //   "Failed to delete supplier"
              // );
              toast.error(err?.response?.data?.displayMessage ||
                err?.response?.data?.message ||
                "Failed to delete supplier");
            }
          }}
        />

        {openModal && selectedSupplier && (
          <>
            <span
              onClick={() => setOpenModal(false)}
              style={{
                cursor: "pointer",
                position: "fixed",
                left: "calc(100vw - 900px - 60px)", // Position just left of panel
                top: "20px",
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
                width: "100%",
                maxWidth: "940px",
                height: "100vh",
                background: "white",
                boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
                transition: "right 0.4s ease",
                zIndex: 9999,
                overflow: "auto",

              }}
            >
              <SupplierDetails
                supplierId={selectedSupplier}
                onClose={() => setOpenModal(false)}
              />
            </div>
          </>
        )}

        {/* add supplier */}
        {openAddSupplierModal && (
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
          >
            <AddSupplier onClose={() => setOpenAddSupplierModal(false)} onSuccess={fetchSuppliers} />
          </div>
        )}

        {/* edit supplier */}
        {openEditModal && selectedSupplier && (
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
          >
            <EditSupplierModal
              supplierId={selectedSupplier._id}
              onClose={() => { setOpenEditModal(false); setSelectedSupplier(null); }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierList;
