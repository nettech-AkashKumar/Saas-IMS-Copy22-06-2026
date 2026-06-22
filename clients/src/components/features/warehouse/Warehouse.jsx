import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Pagination from "../../../components/Pagination";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import api from "../../../pages/config/axiosInstance";

/* <======----- ICONS -----=======> */
import { PiWarehouseFill } from "react-icons/pi";
import { FiSearch } from "react-icons/fi";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";

/* <=========---- img ----========> */
import edit from "../../../assets/images/edit.png";
import viewdetails from "../../../assets/images/view-details.png";
import deletebtn from "../../../assets/images/delete.png";
import duplicate from "../../../assets/images/duplicate.png";
import warehouse from "../../../assets/images/warehouse.png";
import boxwarehouse from "../../../assets/images/warehousebox.png";
import packages from "../../../assets/images/package.png";
import locations from "../../../assets/images/location.png";
import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
import { useAuth } from "../../auth/AuthContext";

function Warehouse() {
   const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [viewOptions, setViewOptions] = useState(false);
  const [warehouseData, setWarehouseData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [totalWarehouses, setTotalWarehouses] = useState(0);
  const [activeWarehouses, setActiveWarehouses] = useState(0);
  const [totalStock, setTotalStock] = useState(0);

  const initialStats = [
    { title: "Total Warehouse", value: totalWarehouses, image: warehouse },
    { title: "Active Warehouse", value: activeWarehouses, image: boxwarehouse },
    { title: "Total Stock", value: totalStock, image: packages },
    { title: "Low Stock", value: "-", image: locations },
  ];

  const tabsData = [
    { label: "All", count: totalWarehouses },
    { label: "Active", count: activeWarehouses },
    { label: "Inactive", count: totalWarehouses - activeWarehouses },
  ];

  const [dropdownPos, setDropdownPos] = useState({
    x: 0,
    y: 0,
  });
  const [openUpwards, setOpenUpwards] = useState(false);

  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelRef.current && !modelRef.current.contains(event.target)) {
        setViewOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const deleteWarehouse = async (warehouseId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this warehouse?",
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/warehouse/${warehouseId}`);
      const updatedData = warehouseData.filter((w) => w.id !== warehouseId);
      setWarehouseData(updatedData);
      setTotalWarehouses(updatedData.length);
      setActiveWarehouses(updatedData.filter((w) => w.status === "Active").length);
      setViewOptions(false);
      toast.success("Warehouse deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete warehouse. Please try again.",);
    }
  };

  // Fetch warehouse data from API
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        setLoading(true);
        const [warehouseRes, allocationRes] = await Promise.all([
          api.get("/api/warehouse"),
          api.get("/api/warehouse/product-allocation"),
        ]);
        const warehouses = warehouseRes.data.data || [];
        const allocations = allocationRes.data.data || [];
        const grandTotalStock = allocations.reduce((sum, row) => sum + Number(row.allocatedQty || 0), 0);
        setTotalStock(grandTotalStock);
        const warehouseStats = {};
        allocations.forEach((row) => {
          const name = row.warehouse;
          if (!name) return;
          if (!warehouseStats[name]) {
            warehouseStats[name] = { productIds: new Set(), totalQty: 0 };
          }
          warehouseStats[name].productIds.add(row.id?.toString());
          warehouseStats[name].totalQty += Number(row.allocatedQty || 0);
        });

        const transformedData = warehouses.map((wh) => {
          const stats = warehouseStats[wh.warehouseName] || { productIds: new Set(), totalQty: 0 };
          return {
            id: wh._id,
            code: wh.warehouseCode || "N/A",
            name: wh.warehouseName || "Unnamed",
            location: `${wh.city || ""}, ${wh.state || ""}, ${wh.country || ""}`.replace(/^,\s*/, ""),
            products: stats.productIds.size,
            stockQty: stats.totalQty,
            zones: wh.zones?.length || 0,
            manager: wh.warehouseOwner || wh.contactPerson || "N/A",
            email: wh.email || "",
            address: wh.address || "",
            phone: wh.phone || "",
            country: wh.country || "",
            state: wh.state || "",
            city: wh.city || "",
            pinCode: wh.pinCode || wh.pincode || "",
            space: wh.space || wh.warehouseType || "",
            layout: wh.layout || {},
            status: wh.status?.charAt(0).toUpperCase() + wh.status?.slice(1).toLowerCase() || "Active",
          };
        });
        const lifoData = [...transformedData].reverse();
        setWarehouseData(lifoData);
        setTotalWarehouses(lifoData.length);
        setActiveWarehouses(lifoData.filter((w) => w.status === "Active").length);
      } catch (error) {
        toast.error("Failed to load warehouses");
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredWarehouses = warehouseData.filter((warehouse) => {
    const matchesSearch =
      warehouse.name.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.manager.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.location.toLowerCase().includes(search.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === "All" || warehouse.status?.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWarehouses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);

  // const handleExportExcel = () => {
  //   const selectedData = warehouseData.filter((item) =>
  //     selectedRows.includes(item.id),
  //   );

  //   if (selectedData.length === 0) {
  //     toast.error("Please select warehouse");
  //     return;
  //   }

  //   const exportData = selectedData.map((item) => ({
  //     Code: item.code,
  //     Warehouse: item.name,
  //     Location: item.location,
  //     Products: item.products,
  //     StockQty: item.stockQty,
  //     Zones: item.zones,
  //     Manager: item.manager,
  //     Status: item.status,
  //   }));

  //   const worksheet = XLSX.utils.json_to_sheet(exportData);

  //   const workbook = XLSX.utils.book_new();

  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Warehouses");

  //   XLSX.writeFile(workbook, "warehouses.xlsx");
  // };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab]);

  const handleExportPDF = () => {
    const selectedData = warehouseData.filter((item) =>
      selectedRows.includes(item.id),
    );

    if (selectedData.length === 0) {
      toast.error("Please select warehouse");
      return;
    }
    const doc = new jsPDF();
    doc.text("Warehouse Report", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [
        [
          "Code",
          "Warehouse",
          "Location",
          "Products",
          "Stock",
          "Zones",
          "Manager",
          "Status",
        ],
      ],

      body: selectedData.map((item) => [
        item.code,
        item.name,
        item.location,
        item.products,
        item.stockQty,
        item.zones,
        item.manager,
        item.status,
      ]),
    });
    doc.save("warehouses.pdf");
  };

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "91vh" }}>
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ marginBottom: "20px" }}
      >
        <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
          Warehouse
        </h3>
       
       {hasPermission (user, "warehouse", "create") && (
        <div
          onClick={() =>
            navigate("/add-warehouse", {
              state: { from: location.pathname },
            })
          }
          title="Add Warehouse Button"
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
            cursor: "pointer",
          }}
        >
          <PiWarehouseFill className="fs-5" />
          Add Warehouse
        </div>
        )}
      </div>

      {/* Top stat cards */}
      <div className="d-flex flex-wrap g-3 mb-3">
        {initialStats.map((s, idx) => (
          <div
            key={idx}
            className="col-3"
            style={{
              textDecoration: "none",
              paddingRight: s.title === "Low Stock" ? "0px" : "30px",
            }}
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
              {/* Left Blue Border */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "70%",
                  background: "#1F7FFF",
                  borderRadius: "0px 10px 10px 0px",
                }}
              />

              {/* Content */}
              <div className="d-flex flex-column" style={{ gap: "10px" }}>
                <h6
                  className="mb-0"
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#727681",
                  }}
                >
                  {s.title}
                </h6>

                <div className="d-flex align-items-center gap-2">
                  <h4
                    className="mb-0"
                    style={{
                      fontSize: "22px",
                      fontWeight: 600,
                      color: "#0E101A",
                    }}
                  >
                    {s.value}
                  </h4>

                  {s.currency && (
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#0E101A",
                      }}
                    >
                      {s.currency}
                    </span>
                  )}
                </div>
              </div>

              {/* Icon */}
              <div
                className="d-flex justify-content-center align-items-center rounded-circle"
                style={{
                  width: "50px",
                  height: "50px",
                  border: "1px solid #E5F0FF",
                  background: "#fff",
                  flexShrink: 0,
                }}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
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
        {/* Tabs + Search */}
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
          {/* Tabs */}
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                padding: 2,
                background: "#F3F8FB",
                borderRadius: 8,
                width: "auto",
                overflowX: "auto",
              }}
            >
              {tabsData.map((tab) => (
                <div
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  style={{
                    padding: "6px 12px",
                    background:
                      activeTab === tab.label ? "white" : "transparent",
                    borderRadius: 8,
                    boxShadow:
                      activeTab === tab.label
                        ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                        : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    color: "#0E101A",
                    cursor: "pointer",
                    transition: "0.2s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {tab.label}
                  </span>

                  <span
                    style={{
                      color: "#727681",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {tab.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
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
                placeholder="Search by Warehouse Name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* <Export> */}
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
                cursor: warehouseData.length > 0 ? "pointer" : "not-allowed",

                opacity: warehouseData.length > 0 ? 1 : 0.5,
              }}
              onClick={handleExportPDF}
              disabled={warehouseData.length === 0}
              title="Export Warehouse PDF"
            >
              <FaFilePdf className="fs-5" style={{ color: "#DC2626" }} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            overflowY: "auto",
            height: "calc(100vh - 310px)",
            maxHeight: '505px',
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
            {/* Header */}
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
                    width: "auto",
                    fontWeight: "400",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <label className="checkboxs">
                      <input
                        type="checkbox"
                        checked={
                          currentItems.length > 0 &&
                          selectedRows.length === currentItems.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(
                              currentItems.map((item) => item.id),
                            );
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                        style={{
                          width: 18,
                          height: 18,
                        }}
                      />

                      <span className="checkmarks" />
                    </label>
                    Code
                  </div>
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Warehouse Name
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Location
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Products
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Stock qty
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Zones
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Manager
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Status
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div
                      style={{
                        height: "250px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#FF441F",
                        fontSize: 16,
                        fontWeight: 500,
                      }}
                    >
                      No Warehouse Found
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((warehouse, index) => (
                  <tr
                    key={warehouse.id}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                    }}
                  >
                    {/* Warehouse code + Checkbox */}
                    <td
                      style={{
                        padding: "12px 16px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <label className="checkboxs">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(warehouse.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRows((prev) => [
                                  ...prev,
                                  warehouse.id,
                                ]);
                              } else {
                                setSelectedRows((prev) =>
                                  prev.filter((id) => id !== warehouse.id),
                                );
                              }
                            }}
                            style={{
                              width: 18,
                              height: 18,
                            }}
                          />

                          <span className="checkmarks" />
                        </label>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              color: "#0E101A",
                              fontWeight: 400,
                            }}
                          >
                            {warehouse.code}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Warehouse Name */}
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: 500,
                      }}
                    >
                      {warehouse.name}
                    </td>

                    {/* Location */}
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: "400",
                      }}
                    >
                      {warehouse.location}
                    </td>

                    {/* Products */}
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: "400",
                      }}
                    >
                      {warehouse.products}
                    </td>

                    {/* Stock Qty */}
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: "400",
                      }}
                    >
                      {warehouse.stockQty}
                    </td>

                    {/* Zones */}
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: "400",
                      }}
                    >
                      {warehouse.zones}
                    </td>

                    {/* Manager */}
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: "500",
                      }}
                    >
                      {warehouse.manager}
                    </td>

                    {/* Status */}
                    <td
                      style={{
                        padding: "4px 16px",
                      }}
                    >
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 500,
                          background:
                            warehouse.status === "Active"
                              ? "#E8FFF3"
                              : "#FFF1F2",
                          color:
                            warehouse.status === "Active"
                              ? "#16A34A"
                              : "#DC2626",
                        }}
                      >
                        {warehouse.status}
                      </span>
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
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          position: "relative",
                          cursor: "pointer",
                        }}
                        ref={(el) => (buttonRefs.current[index] = el)}
                      >
                        {/* 3 Dot Button */}
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                          onClick={(e) => {
                            const rect =
                              e.currentTarget.getBoundingClientRect();

                            const dropdownHeight = 220;

                            const spaceBelow = window.innerHeight - rect.bottom;

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

                            setViewOptions(
                              viewOptions === index ? false : index,
                            );
                          }}
                        >
                          <div
                            style={{
                              width: 4,
                              height: 4,
                              background: "#6C748C",
                              borderRadius: 2,
                            }}
                          />

                          <div
                            style={{
                              width: 4,
                              height: 4,
                              background: "#6C748C",
                              borderRadius: 2,
                            }}
                          />

                          <div
                            style={{
                              width: 4,
                              height: 4,
                              background: "#6C748C",
                              borderRadius: 2,
                            }}
                          />
                        </div>

                        {/* Dropdown */}
                        {viewOptions === index && (
                          <div
                            style={{
                              position: "fixed",
                              top: openUpwards
                                ? dropdownPos.y - 190
                                : dropdownPos.y,
                              left: dropdownPos.x - 80,
                              zIndex: 999999,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              ref={modelRef}
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
                              <Link to={`/warehousedetails/${warehouse.id}`}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 14,
                                  }}
                                  className="button-action"
                                >
                                  <img src={viewdetails} alt="" />

                                  <span style={{ color: "black" }}>View</span>
                                </div>
                              </Link>
                              {/* Edit */}
                              {hasPermission (user, "warehouse", "update") && (
                              <div
                                onClick={() =>
                                  navigate("/add-warehouse", {
                                    state: {
                                      warehouse,
                                      from: "/warehouse",
                                    },
                                  })
                                }
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  fontSize: 14,
                                }}
                                className="button-action"
                              >
                                <img src={edit} alt="" />

                                <span style={{ color: "black" }}>Edit</span>
                              </div>
                              )}
                              {/* Zone */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  fontSize: 14,
                                }}
                                className="button-action"
                              >
                                <img src={duplicate} alt="" />

                                <span style={{ color: "black" }}>Zone</span>
                              </div>

                              {/* Delete */}
                              {/* <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                  gap: 8,
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  cursor: "pointer",
                                  fontSize: 14,
                                }}
                                className="button-action"
                                onClick={() => deleteWarehouse(warehouse.id)}
                              >
                                <img src={deletebtn} alt="" />

                                <span style={{ color: "black" }}>Delete</span>
                              </div> */}
                            </div>
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
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={currentPage}
            total={filteredWarehouses.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Warehouse;
