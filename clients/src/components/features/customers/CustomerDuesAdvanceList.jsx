import React, { useEffect, useState, useRef } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import "react-datepicker/dist/react-datepicker.css";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import Custommrr from "../../../assets/images/suppimg.png";
import CustomerDetails from "../../../pages/Modal/customerModals/CustomerDetails";
import AddCustomers from "../../../pages/Modal/customerModals/AddCustomerModal";
import { useNavigate } from "react-router-dom";
import { TbFileExport } from "react-icons/tb";
import api from "../../../pages/config/axiosInstance";
import Pagination from "../../../components/Pagination";
import ConfirmDeleteModal from "../../ConfirmDelete";
import { toast } from "react-toastify";
import { IoIosArrowBack } from "react-icons/io";
import CreditNoteImg from "../../../assets/images/create-creditnote.png";
import CreditICONImg from "../../../assets/images/create-icon1.png";
import GenerateICONImg from "../../../assets/images/create-icon4.png";
import DeleteICONImg from "../../../assets/images/delete.png";
import EditICONImg from "../../../assets/images/edit.png";
import EditCustomerModal from "../../../pages/Modal/customerModals/EditCustomerModal";
import CustomerDueEmpty from "./CustomerDueEmpty";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasPermission } from "../../../utils/permission/hasPermission";
import { useAuth } from "../../auth/AuthContext";
import ProductDefaultImage from '../../../assets/images/product-default.png'
import * as XLSX from "xlsx";
import DateFilterDropdown from "../../../components/DateFilterDropdown";

export default function CustomerDuesAdvanceList({ data }) {
  const { user } = useAuth();
  // console.log("data for with", data);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  //   const [openModal, setOpenModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  //   const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const [tabCounts, setTabCounts] = useState({
    All: 0,
    Due: 0,
    Advance: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);

  const navigate = useNavigate();
  const menuRef = useRef(null);

  const [activeRow, setActiveRow] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());


  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

  const fetchCustomers = async () => {
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
      const typeParam = activeTab === "All" ? "all" : (activeTab || "").toLowerCase();
      const res = await api.get("/api/customers/filter/dues-advance", {
        params: { type: typeParam, search: search || "", ...params },
      });
      const { customers: fetchedCustomers, tabCounts: counts } = res.data;
      setCustomers(fetchedCustomers);
      setFilteredCustomers(fetchedCustomers);
      // console.log("Fetched customers:", fetchedCustomers);
      setTabCounts({
        All: counts.all,
        Due: counts.due,
        Advance: counts.advance,
      })
    } catch (error) {
      // console.error(error);
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to fetch customers"
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchCustomers();
  }, [dateRange]);
  
  useEffect(() => {
    setSearch("");              // ✅ clear search
    setSelectedRowIds(new Set()); // already doing
    setCurrentPage(1);          // reset pagination
  }, [activeTab]);
  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [activeTab]);
  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchCustomers();
      }
    }, 500); // Debounce delay of 500ms

    return () => {
      clearTimeout(timer);
    };
  }, [search, activeTab]);
  useEffect(() => {
    setSelectedRowIds(new Set());
    setSelectAllGlobal(false);
  }, [search, activeTab]);

  // useEffect(() => {
  //   const filteredRows = customers.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase()))
  //   setFilteredCustomers(filteredRows)
  //   setCurrentPage(1);
  // }, [search, customers])

  // pagination
  const indexOfLastTerm = currentPage * itemsPerPage;
  const indexOfFirstTerm = indexOfLastTerm - itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(indexOfFirstTerm, indexOfLastTerm);

  const allVisibleSelected = paginatedCustomers.length > 0 && paginatedCustomers.every(c => selectedRowIds.has(c._id));
  // useEffect(() => {
  //   if (!loading && customers.length === 0) {
  //     navigate("/customerdueempty", { replace: true })
  //   }
  // }, [loading, customers, navigate])

  const handleExportExcel = () => {
  try {
    if (selectedRowIds.size === 0) {
      toast.error("Select at least 1 row to export data");
      return;
    }

    // Get selected customers
    const rowsToExport = filteredCustomers.filter(c =>
      selectedRowIds.has(c._id)
    );

    if (rowsToExport.length === 0) {
      toast.error("No customers to export");
      return;
    }

    // Prepare data for Excel
    const excelData = rowsToExport.map((customer, index) => {
      // Build full address from individual fields
      const addressParts = [];
      if (customer.address) addressParts.push(customer.address);
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
        "Address": fullAddress || "—",
        "Points Available": customer.availablePoints || 0,
        "Due Amount": `₹${(customer.totalDueAmount || 0).toFixed(2)}`,
        "Total Spent": `₹${(customer.totalPurchaseAmount || 0).toFixed(2)}`
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      // { wch: 8 },   // S.No
      { wch: 25 },  // Customer Name
      { wch: 15 },  // Phone
      { wch: 25 },  // Email
      { wch: 40 },  // Address
      { wch: 15 },  // Points Available
      { wch: 15 },  // Due Amount
      { wch: 15 }   // Total Spent
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Customers Dues & Advance");

    // Save the file
    const filename = `customers_dues_advance_${rowsToExport.length}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    
    toast.success(`Exported ${rowsToExport.length} customer${rowsToExport.length !== 1 ? "s" : ""}`);
  } catch (error) {
    toast.error(error?.message || "Failed to export data");
  }
};

  return (
    <div className="p-4" style={{ fontFamily: '"Inter", sans-serif' }}>

      {tabCounts.length === 0 && !search ? (
        <>
          <CustomerDueEmpty />
        </>
      ) : (
        <>
          {/* Header */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0px 0px 16px 0px", // Optional: padding for container
            }}
          >
            <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
              Dues and Advance
            </h3>
            <div className="d-flex align-items-center gap-3">
                <DateFilterDropdown
                  selectedDateRange={dateRange}
                  setSelectedDateRange={setDateRange}
                />
                </div>
          </div>

          {/* Search + Tabs + Table */}
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
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
              {/* TABS */}
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
                  {Object.entries(tabCounts || {}).map(([label, count]) => {
                    const active = activeTab === label;
                    return (
                      <div
                        key={label}
                        onClick={() => setActiveTab(label)}
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
                          {label}
                        </div>
                        <div style={{ color: "#727681", fontSize: 14 }}>
                          {count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SEARCH */}
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
                    placeholder="Search by Customer Name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {hasPermission(user, "DuesAdvance", "export") && (
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
                      cursor: 'pointer',
                    }}
                    onClick={handleExportExcel}
                    disabled={paginatedCustomers.length === 0}
                  >
                    <TbFileExport className="fs-5" style={{ color: "#6C748C" }} />
                    Export
                  </button>
                )}
              </div>
            </div>

            {/* TABLE */}
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
                          // checked={allVisibleSelected}
                          // onChange={(e) => {
                          //   const next = new Set(selectedRowIds);
                          //   if (e.target.checked) {
                          //     // Add all current page customers
                          //     paginatedCustomers.forEach(customer => {
                          //       if (customer._id) next.add(customer._id);
                          //     });
                          //   } else {
                          //     // Remove all current page customers
                          //     paginatedCustomers.forEach(customer => {
                          //       if (customer._id) next.delete(customer._id);
                          //     });
                          //   }
                          //   setSelectedRowIds(next);
                          // }}
                          checked={selectAllGlobal}
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Select ALL customers across all pages
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
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody style={{ overflowY: 'auto', }}>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
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
                        >No Record Found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCustomers.map((customer, index) => (
                      <tr
                        key={customer._id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setOpenDetailsModal(true);
                        }}
                        style={{
                          borderBottom: "1px solid #EAEAEA",
                          height: "46px",
                          cursor: 'pointer'
                        }}
                        className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                      >
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
                              // onChange={(e) => {
                              //   e.stopPropagation();
                              //   const next = new Set(selectedRowIds);
                              //   if (e.target.checked) {
                              //     if (customer._id) next.add(customer._id);
                              //   } else {
                              //     if (customer._id) next.delete(customer._id);
                              //   }
                              //   setSelectedRowIds(next);
                              // }}
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
                        <td style={{ padding: "4px 16px" }}>
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
                                {customer?.name}
                              </div>
                              <div style={{ fontSize: 12, color: "#727681" }}>
                                {customer?.phone}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td
                          style={{
                            padding: "14px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                          }}
                        >
                          {customer?.availablePoints || 0}🪙 points
                        </td>

                        <td
                          style={{
                            padding: "14px 16px",
                            fontWeight: 500,
                            color: customer?.totalDueAmount && customer.totalDueAmount > 0 ? "#D92D20" : "#16A34A",
                          }}
                        >
                          {customer?.totalDueAmount && customer.totalDueAmount > 0 ? `₹${customer.totalDueAmount.toFixed(2)}/-` : "₹0.00/-"}
                        </td>

                        <td
                          style={{ padding: "14px 16px", color: customer?.totalPurchaseAmount && customer.totalPurchaseAmount > 0 ? "#16A34A" : "#0E101A", fontWeight: 500 }}
                        >
                          {customer?.totalPurchaseAmount ? `₹${customer.totalPurchaseAmount.toFixed(2)}/-` : "₹0.00/-"}
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
              />
            </div>
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
                toast.success("Customer due advance deleted successfully!")
                fetchCustomers();
              } catch (error) {
                toast.error(error?.response?.data?.displayMessage || "Failed to delete due advance customer")
              } finally {
                setShowDeleteModal(false);
                setSelectedCustomer(null);
              }
            }}
          />

          {/* SIDE MODAL */}
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

          {/* Edit Customer Modal */}
          {openEditModal && selectedCustomer && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
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
        </>
      )}
    </div >
  );
}
