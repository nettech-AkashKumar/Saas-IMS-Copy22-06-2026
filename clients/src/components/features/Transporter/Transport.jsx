import React, { useEffect, useState, useRef, useMemo } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import { TbFileExport } from "react-icons/tb";
import Pagination from "../../../components/Pagination";
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
import ProductDefaultImage from "../../../assets/images/product-default.png";
import { useAuth } from "../../auth/AuthContext";
import AddTransportModals from "./AddTransportModals";



export default function Transport() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  // const [transporters, settransporters] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const navigate = useNavigate();
  // Add these to your existing state declarations
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  // const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [openRow, setOpenRow] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  const menuItems = [
    ...(hasPermission(user, "transporter", "update")
      ? [
  {
    label: "Edit",
    icon: <img src={EditICONImg} size={18} />,
    action: "edit",
    permission: "update",
  },
      ]
      : []),

         ...(hasPermission(user, "transporter", "delete")
      ? [
  {
    label: "Delete",
    icon: <img src={DeleteICONImg} size={18} />,
    action: "delete",
    permission: "delete",
  },
     ]
      : []),
];

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

  useEffect(() => {
    fetchTransporters();
  }, []);

  // Calculate tab counts
  const fetchTransporters = async () => {
    setLoading(true);

    try {
      const res = await api.get("/api/transporter/active-transporters");
      setTransporters(res.data.transporters || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load transporters",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditData(item);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");
    if (!confirmDelete) return;
    try {
      await api.delete(`/api/transporter/delete/${id}`);
      toast.success("Transporter Deleted Successfully");
      fetchTransporters();
    } catch (err) {
      toast.error("Delete Failed");
    }
  };

  const calculateTabCounts = useMemo(() => {
    return {
      All: transporters.length,

      Truck: transporters.filter(
        (t) => t.assignVehicleID?.vehicleType?.toLowerCase() === "truck",
      ).length,

      Pickup: transporters.filter(
        (t) => t.assignVehicleID?.vehicleType?.toLowerCase() === "pickup",
      ).length,

      Bike: transporters.filter(
        (t) => t.assignVehicleID?.vehicleType?.toLowerCase() === "bike",
      ).length,

      Toto: transporters.filter(
        (t) => t.assignVehicleID?.vehicleType?.toLowerCase() === "toto",
      ).length,
    };
  }, [transporters]);

  // Create tabs data with calculated counts
  const tabsData = [
    { label: "All", count: calculateTabCounts.All },
  ];

  const filteredTransporters = useMemo(() => {
    if (!transporters.length) return [];

    let filtered = [...transporters];

    // FILTER BY VEHICLE TYPE
    if (activeTab !== "All") {
      filtered = filtered.filter(
        (transporter) =>
          transporter.assignVehicleID?.vehicleType?.toLowerCase() ===
          activeTab.toLowerCase(),
      );
    }

    // SEARCH
    if (search.trim()) {
      const searchTerm = search.toLowerCase();

      filtered = filtered.filter(
        (transporter) =>
          transporter.transporterName?.toLowerCase().includes(searchTerm) ||
          transporter.ownerName?.toLowerCase().includes(searchTerm) ||
          transporter.transporterGST?.toLowerCase().includes(searchTerm) ||
          transporter.assignVehicleID?.vehicleNumber
            ?.toLowerCase()
            .includes(searchTerm) ||
          transporter.assignVehicleID?.vehicleType
            ?.toLowerCase()
            .includes(searchTerm),
      );
    }

    return filtered;
  }, [transporters, activeTab, search]);

  // Paginate filtered transporters
  const paginatedTransporters = useMemo(() => {
    const indexOfLastTerm = currentPage * itemsPerPage;
    const indexOfFirstTerm = indexOfLastTerm - itemsPerPage;
    // return filteredtransporters.slice(indexOfFirstTerm, indexOfLastTerm);
    return filteredTransporters.slice(indexOfFirstTerm, indexOfLastTerm);
  }, [filteredTransporters, currentPage, itemsPerPage]);

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

  const handleMenuAction = async (action, transporter) => {
    setOpenMenuIndex(null);

    switch (action) {
      case "edit":
        setEditData(transporter);
        setOpenAddModal(true);
        break;

      case "delete":
        setSelectedTransporter(transporter);
        setShowDeleteModal(true);
        break;

      case "toggle_status":
        try {
          const currentStatus = transporter.status?.trim()?.toLowerCase();

          const newStatus = currentStatus === "active" ? "inactive" : "active";

          const res = await api.put(
            `/api/transporter/update-status/${transporter._id}`,
            {
              status: newStatus,
            },
          );

          // Update UI instantly
          setTransporters((prev) =>
            prev.map((item) =>
              item._id === transporter._id
                ? {
                  ...item,
                  status: res.data.transporter.status,
                }
                : item,
            ),
          );

          toast.success(`Transporter set to ${newStatus}`);
        } catch (error) {
          console.log(error);

          toast.error(
            error?.response?.data?.message || "Failed to update status",
          );
        }
        break;
        try {
          const currentStatus = transporter.status?.trim()?.toLowerCase();

          const newStatus = currentStatus === "active" ? "inactive" : "active";

          const res = await api.put(
            `/api/transporter/update-status/${transporter._id}`,
            {
              status: newStatus,
            },
          );

          // Update UI instantly without full refresh
          setTransporters((prev) =>
            prev.map((item) =>
              item._id === transporter._id
                ? { ...item, status: res.data.transporter.status }
                : item,
            ),
          );

          toast.success(`Transporter set to ${newStatus}`);
        } catch (error) {
          console.log(error);

          toast.error(
            error?.response?.data?.message || "Failed to update status",
          );
        }
        break;
        try {
          const newStatus =
            transporter.status?.trim()?.toLowerCase() === "active"
              ? "inactive"
              : "active";

          await api.put(`/api/transporter/update-status/${transporter._id}`, {
            status: newStatus,
          });

          toast.success(`Transporter set to ${newStatus} successfully`);

          fetchTransporters();
        } catch (error) {
          console.log(error);

          toast.error("Failed to update status");
        }
        break;

      default:
        break;
    }
  };

  const handleRowClick = (transporter, event) => {
    if (
      !event.target.closest('input[type="checkbox"]') &&
      !event.target.closest(".button-action") &&
      !event.target.closest("button")
    ) {
      setEditData(transporter);

      // open in view mode
      setIsViewMode(true);

      setOpenAddModal(true);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    setSelectedRowIds(new Set());
    setSelectAllGlobal(false);
  }, [activeTab, search]);

  useEffect(() => {
    setSearch("");
    setCurrentPage(1); // Reset pagination
  }, [activeTab]);

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.text("Transporters Report", 14, 15);

    const tableColumns = ["Transporter Name", "Owner Name", "GST", "Status"];

    if (selectedRowIds.size === 0) {
      toast.error("Select at least 1 transporter");
      return;
    }

    const visibleRows = filteredTransporters.filter((transporter) =>
      selectedRowIds.has(transporter._id),
    );

    const tableRows = visibleRows.map((transporter) => [
      transporter.transporterName || "-",
      transporter.ownerName || "-",
      transporter.transporterGST || "-",
      transporter.status || "Inactive",
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
    });

    doc.save("transporters-report.pdf");

    toast.success("PDF Exported Successfully");
  };

  useEffect(() => {
    const allCurrentPageIds = paginatedTransporters.map(
      (customer) => customer._id,
    );
    const allSelected =
      allCurrentPageIds.length > 0 &&
      allCurrentPageIds.every((id) => selectedRowIds.has(id));
    setSelectAllGlobal(allSelected);
  }, [selectedRowIds, paginatedTransporters]);

  // handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        openDetailsModal &&
        detailsRef.current &&
        !detailsRef.current.contains(event.target)
      ) {
        setOpenDetailsModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDetailsModal]);

  return (
    <div className="p-4" style={{ fontFamily: '"Inter", sans-serif' }}>
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ marginBottom: "20px" }}
      >
        <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
          Transporter
        </h3>
        {hasPermission(user, "transporter", "create") && (
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
            + Add Transport
          </button>
        )}
      </div>

      {/* Main Card */}
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
                placeholder="Search By Transporter Name, Owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {hasPermission(user, "transporter", "export") && (
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
                  cursor:
                    paginatedTransporters.length > 0
                      ? "pointer"
                      : "not-allowed",
                  opacity: paginatedTransporters.length > 0 ? 1 : 0.5,
                }}
                onClick={handleExportPDF}
                disabled={paginatedTransporters.length === 0}
                title={
                  selectedRowIds.size > 0
                    ? `Export ${selectedRowIds.size} selected transporter(s)`
                    : "Export all visible transporters"
                }
              >
                <TbFileExport className="fs-5" style={{ color: "#6C748C" }} />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div
          className=""
          style={{
            overflowY: "auto",
            height: "calc(100vh - 310px)",
            maxHeight: "500px",
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
                    padding: "4px 16px",
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
                      aria-label="select all"
                      checked={selectAllGlobal}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select ALL filtered transporters across all pages
                          const allIds = new Set(
                            filteredTransporters.map((c) => c._id),
                          );
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
                  "Transporter Name",
                  "Owner",
                  "No. Of Vehicles",
                  "No Of Drivers",
                  "Total Delivery",
                  "Total Business",
                  "Actions",
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "4px 16px",
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
                  <td colSpan="8" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedTransporters.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: 0 }}>
                    <div
                      style={{
                        marginTop: "20px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "rgba(255, 68, 31, 1)",
                      }}
                    >
                      No Transporter Found
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransporters.map((transporter, index) => (
                  <tr
                    key={transporter._id}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                      cursor: "pointer",
                    }}
                    className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    onClick={(e) => handleRowClick(transporter, e)}
                  >
                    {/* Checkbox Column */}
                    <td
                      style={{
                        padding: "4px 16px",
                        color: "#0E101A",
                        fontSize: "14px",
                      }}
                      onClick={(e) => e.stopPropagation()}
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
                          aria-label="select transporter"
                          checked={selectedRowIds.has(transporter._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            const next = new Set(selectedRowIds);
                            if (e.target.checked) {
                              next.add(transporter._id);
                            } else {
                              next.delete(transporter._id);
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
                      }}
                    >
                      <div
                        className="d-flex align-items-center"
                        style={{ gap: 10 }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 400,
                              color: "#0E101A",
                            }}
                          >
                            {transporter.transporterName || "Unknown"}
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
                      {transporter.ownerName || "-"}
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {transporter.assignVehicleID ? transporter.assignVehicleID.length || 0 : "-"}
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {transporter.assignDriverID ? transporter.assignDriverID?.length || 0 : "-"}
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      11
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      ₹ 4,589.22/-
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
                            openMenuIndex === index ? null : index,
                          );
                          const rect = e.currentTarget.getBoundingClientRect();
                          setOpenMenuIndex(
                            openMenuIndex === index ? null : index,
                          );

                          const dropdownHeight = 260; // your menu height
                          const spaceBelow = window.innerHeight - rect.bottom;
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
                              .filter((item) =>
                                hasPermission(
                                  user,
                                  "Customer",
                                  item.permission,
                                ),
                              )
                              .map((item) => (
                                <div
                                  key={item.action}
                                  onClick={() =>
                                    handleMenuAction(item.action, transporter)
                                  }
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
                                  {/* <span>{item.label}</span> */}
                                  <span>
                                    {item.label}
                                  </span>
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
            total={filteredTransporters.length}
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
            setSelectedTransporter(null);
          }}
          onConfirm={async () => {
            try {
              await api.delete(
                `/api/transporter/delete/${selectedTransporter._id}`,
              );

              toast.success("Transporter deleted successfully");

              fetchTransporters();
            } catch (error) {
              toast.error(
                error?.response?.data?.message ||
                "Failed to delete transporter",
              );
            } finally {
              setShowDeleteModal(false);
              setSelectedTransporter(null);
            }
          }}
        />
      </div>

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
            overflow: "auto",
          }}
          onClick={() => setOpenAddModal(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AddTransportModals
              //              onClose={() => {
              //   setOpenAddModal(false);
              //   fetchTransporters();
              // }}
              onClose={() => {
                setOpenAddModal(false);
                setEditData(null);
                setIsViewMode(false);
              }}
              editData={editData}
              isView={isViewMode}
              fetchTransporters={fetchTransporters}
            />
          </div>
        </div>
      )}

    </div>
  );
}
