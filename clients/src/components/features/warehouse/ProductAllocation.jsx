import React, { useEffect, useRef, useState } from "react";
import { IoLogoTwitch } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useNavigate, useLocation } from "react-router-dom";
import Pagination from "../../../components/Pagination";
import api from "../../../pages/config/axiosInstance";
import ProductDefaultImage from '../../../assets/images/product-default.png'
import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
import { useAuth } from "../../auth/AuthContext";

function ProductAllocation() {
   const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const warehouseRef = useRef(null);
  const [warehouseDropdown, setWarehouseDropdown] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [viewOptions, setViewOptions] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (warehouseRef.current && !warehouseRef.current.contains(event.target)) {
        setWarehouseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchAllocatedProducts();
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/api/warehouse/active");
      setWarehouses(res.data.data || []);
    } catch (error) {
      // console.log(error);
    }
  };

  const fetchAllocatedProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/warehouse/product-allocation");
      setTransferData(res.data.data || []);
    } catch (error) {
      // console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search and warehouse
  const filteredData = transferData.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      item.product?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.locationCode?.toLowerCase().includes(q) ||
      item.warehouse?.toLowerCase().includes(q) ||
      item.zone?.toLowerCase().includes(q) ||
      item.rack?.toLowerCase().includes(q) ||
      item.shelf?.toLowerCase().includes(q) ||
      item.bins?.toLowerCase().includes(q);

    const matchesWarehouse = !selectedWarehouse || item.warehouse === selectedWarehouse;

    // ✅ ADD THIS — compare YYYY-MM-DD strings directly
    const matchesDate = !selectedDate || (
      item.date && new Date(item.date).toISOString().slice(0, 10) === selectedDate
    );

    return matchesSearch && matchesWarehouse && matchesDate;
  });

  // Paginated slice
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedWarehouse, selectedDate]);

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "100vh" }}>
      <div
        className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ marginBottom: "20px" }}
      >
        <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
          Product Allocation
        </h3>
           {hasPermission (user, "AssignTarget", "create") && (
        <div
          onClick={() => navigate("/assign-product", { state: { from: location.pathname } })}
          title="Assign Product"
          className="button-hover"
          style={{
            borderRadius: "8px",
            padding: "5px 16px",
            border: "1px solid #1F7FFF",
            color: "rgb(31, 127, 255)",
            backgroundColor: "white",
            fontSize: "14px",
            fontWeight: "500",
            fontFamily: "Inter",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <IoLogoTwitch className="fs-5" />
          Assign Product
        </div>
           )}
      </div>

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
        {/* Filters */}
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-end">
          <div style={{ display: "flex", justifyContent: "end", gap: "12px", height: "40px", width: "100%" }}>

            {/* Search */}
            <div
              style={{
                flex: 2,
                position: "relative",
                padding: "8px 16px 8px 36px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
              }}
            >
              <FiSearch
                className="fs-5"
                style={{ position: "absolute", left: 12, color: "#9CA3AF" }}
              />
              <input
                type="search"
                style={{ width: "100%", border: "none", outline: "none", fontSize: 14, background: "#FCFCFC", color: "#0E101A" }}
                placeholder="Search by Product Name, location code..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Date filter */}
            <div
              style={{
                flex: 1,
                padding: "8px 16px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
              }}
            >
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                style={{ border: "none", outline: "none", background: "transparent", width: "100%" }}
              />
            </div>

            {/* Warehouse Dropdown */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
              <div
                ref={warehouseRef}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  background: "white",
                  borderRadius: "8px",
                  border: "1px solid #EAEAEA",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  display: "flex",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <div
                  onClick={() => setWarehouseDropdown(!warehouseDropdown)}
                  style={{ display: "flex", gap: "5px", width: "100%" }}
                >
                  <span style={{ color: selectedWarehouse ? "#0E101A" : "#727681", fontSize: "14px", fontWeight: "400", width: "100%" }}>
                    {selectedWarehouse || "Select Warehouse"}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {selectedWarehouse && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWarehouse("");
                        setCurrentPage(1);
                      }}
                      style={{ fontSize: 11, color: "#1F7FFF", cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Clear
                    </span>
                  )}
                  <div onClick={() => setWarehouseDropdown(!warehouseDropdown)}>
                    {warehouseDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
                  </div>
                </div>

                {warehouseDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "42px",
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      border: "1px solid #E1E1E1",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      maxHeight: "300px",
                      overflowY: "auto",
                      zIndex: 1000,
                    }}
                  >
                    {warehouses.length === 0 ? (
                      <div style={{ padding: "10px 14px", fontSize: 14, color: "#727681" }}>No warehouses found</div>
                    ) : (
                      warehouses.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedWarehouse(item.warehouseName);
                            setWarehouseDropdown(false);
                            setCurrentPage(1);
                          }}
                          className="button-hover"
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontSize: 14,
                            color: "#0E101A",
                            borderBottom: index !== warehouses.length - 1 ? "1px solid #F3F3F3" : "none",
                            background: selectedWarehouse === item.warehouseName ? "#F0F7FF" : "transparent",
                          }}
                        >
                          {item.warehouseName}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowY: "auto", height: "calc(100vh - 320px)", }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr style={{ background: "#F3F8FB" }}>
                {[
                  { label: "Product", align: "left" },
                  { label: "Warehouse", align: "left" },
                  { label: "Zone", align: "left" },
                  { label: "Rack", align: "left" },
                  { label: "Shelf", align: "left" },
                  { label: "Bins", align: "left" },
                  { label: "Location Code", align: "left" },
                  { label: "Allocated Qty", align: "left" },
                  { label: "Movement Type", align: "left" },
                  { label: "Actions", align: "center" },
                ].map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 16px",
                      textAlign: h.align,
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-4" style={{ color: "#727681", fontSize: 14 }}>
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="11">
                    <div style={{ height: "250px", display: "flex", justifyContent: "center", alignItems: "center", color: "#727681", fontSize: 16, fontWeight: 500 }}>
                      {transferData.length === 0 ? "No Assigned Products Found" : "No results match your search"}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((transfer, index) => (
                  <tr key={`${transfer.id}-${index}`} style={{ borderBottom: "1px solid #EAEAEA" }}>

                    {/* Product */}
                    <td style={{ padding: "7px 16px", minWidth: "240px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {transfer.image ? <img
                          src={transfer.image}
                          alt={transfer.product}
                          style={{ width: "44px", height: "44px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        /> : <img
                          src={ProductDefaultImage}
                          alt={transfer.product}
                          style={{ width: "44px", height: "35px", borderRadius: "6px", objectFit: "cover", flexShrink: 0 }}
                          onError={(e) => { e.target.style.display = "none"; }}
                        />}
                        <div style={{ fontSize: "14px", color: "#0E101A", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>
                          {transfer.product || "-"}
                        </div>
                      </div>
                    </td>

                    {/* Warehouse */}
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#0E101A", whiteSpace: "nowrap" }}>
                      {transfer.warehouse || "-"}
                    </td>

                    {/* Zone */}
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#0E101A", whiteSpace: "nowrap" }}>
                      {transfer.zone || "-"}
                    </td>

                    {/* Rack */}
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#0E101A", whiteSpace: "nowrap" }}>
                      {transfer.rack || "-"}
                    </td>

                    {/* Shelf */}
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#0E101A", whiteSpace: "nowrap" }}>
                      {transfer.shelf || "-"}
                    </td>

                    {/* Bins */}
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#0E101A", whiteSpace: "nowrap" }}>
                      {transfer.bins || "-"}
                    </td>

                    {/* Location Code */}
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#0E101A", whiteSpace: "nowrap" }}>
                      {transfer.locationCode || "-"}
                    </td>

                    {/* Available */}
                    <td style={{ padding: "12px 16px", fontSize: 14, color: "#0E101A", whiteSpace: "nowrap" }}>
                      {transfer.allocatedQty || 0}
                    </td>

                    {/* Movement Type */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          background:
                            transfer.movementType === "Bin" ? "#ECFDF3"
                              : transfer.movementType === "Shelf" ? "#EFF6FF"
                                : transfer.movementType === "Rack" ? "#FFF7ED"
                                  : transfer.movementType === "Zone" ? "#F5F3FF"
                                    : "#F3F4F6",
                          color:
                            transfer.movementType === "Bin" ? "#027A48"
                              : transfer.movementType === "Shelf" ? "#1D4ED8"
                                : transfer.movementType === "Rack" ? "#C2410C"
                                  : transfer.movementType === "Zone" ? "#6D28D9"
                                    : "#374151",
                        }}
                      >
                        {transfer.movementType || "-"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      style={{ padding: "12px 16px", textAlign: "center", minWidth: "100px", position: "relative" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{ display: "flex", justifyContent: "center", cursor: "pointer" }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const dropdownHeight = 140;
                          const spaceBelow = window.innerHeight - rect.bottom;
                          if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
                            setOpenUpwards(true);
                            setDropdownPos({ x: rect.left, y: rect.top - 6 });
                          } else {
                            setOpenUpwards(false);
                            setDropdownPos({ x: rect.left, y: rect.bottom + 6 });
                          }
                          setViewOptions(viewOptions === transfer.id + index ? false : transfer.id + index);
                        }}
                      >
                        <div style={{ width: 20, height: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {[0, 1, 2].map((d) => (
                            <div key={d} style={{ width: 4, height: 4, borderRadius: "50%", background: "#6C748C" }} />
                          ))}
                        </div>
                      </div>

                      {viewOptions === transfer.id + index && (
                        <div
                          style={{
                            position: "fixed",
                            top: openUpwards ? dropdownPos.y - 140 : dropdownPos.y,
                            left: dropdownPos.x - 130,
                            zIndex: 999999,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            ref={modelRef}
                            style={{
                              background: "#fff",
                              borderRadius: "12px",
                              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                              minWidth: "180px",
                              padding: "8px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            {hasPermission (user, "AssignTraget", "update") && (
                            <div
                              onClick={() => navigate(`/product/edit/${transfer.id}`)}
                              className="button-action"
                              style={{ padding: "10px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
                            >
                              Edit
                            </div>
                            )}
                            <div
                              onClick={() => {
                                // console.log("Restock", transfer.id); 
                                setViewOptions(false);
                              }}
                              className="button-action"
                              style={{ padding: "10px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}
                            >
                              Restock
                            </div>
                             {hasPermission (user, "AssignTraget", "delete") && (
                            <div
                              onClick={() => {
                                // console.log("Delete", transfer.id); 
                                setViewOptions(false);
                              }}
                              className="button-action"
                              style={{ padding: "10px 12px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", color: "#EF4444", display: "flex", alignItems: "center", gap: "10px" }}
                            >
                              Delete
                            </div>
                             )}
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
            total={filteredData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          />
        </div>
      </div>
    </div>
  );
}

export default ProductAllocation;