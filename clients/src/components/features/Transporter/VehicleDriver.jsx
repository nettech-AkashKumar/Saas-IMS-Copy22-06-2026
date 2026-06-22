import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// pages
import "../../../styles/category/category.css";
import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
import api from "../../../pages/config/axiosInstance.js"
import { useAuth } from "../../auth/AuthContext";
import Pagination from "../../../components/Pagination";
import DeleteModal from "../../ConfirmDelete.jsx";
import AddDriver from "./AddDriver";
import AddVehicle from "./AddVehicle";

// icons
import { TbEdit, TbTrash } from "react-icons/tb";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { CiCirclePlus } from "react-icons/ci";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { GrFormPrevious } from "react-icons/gr";
import { MdNavigateNext } from "react-icons/md";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileExport } from "react-icons/tb";

// images
import ProductDefaultImage from '../../../assets/images/product-default.png'
import edit from "../../../assets/images/edit.png";
import deletebtn from "../../../assets/images/delete.png";
import view from "../../../assets/images/view-details.png";

const VehicleDriver = () => {

  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Vehicle");
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTotalItems, setVehicleTotalItems] = useState(0);
  const [vehicleCounts, setVehicleCounts] = useState({ all: 0, active: 0, inactive: 0 });
  const [selectedVehicles, setSelectedVehicles] = useState(new Set());
  const [selectAllVehiclesAcrossPages, setSelectAllVehiclesAcrossPages] = useState(false);
  const vehicleRowsCacheRef = useRef(new Map());
  const [drivers, setDrivers] = useState([]);
  const [driverTotalItems, setDriverTotalItems] = useState(0);
  const [driverCounts, setDriverCounts] = useState({ all: 0 });
  const [selectedDrivers, setSelectedDrivers] = useState(new Set());
  const [selectAllDriversAcrossPages, setSelectAllDriversAcrossPages] = useState(false);
  const driverRowsCacheRef = useRef(new Map());
  const [searchVehicle, setSearchVehicle] = useState("");
  const [searchDriver, setSearchDriver] = useState("");
  const [sortOrder, setSortOrder] = useState("Latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteMode, setDeleteMode] = useState("single");
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [viewOptions, setViewOptions] = useState(false);
  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [viewVehicleData, setViewVehicleData] = useState(null);
  const [viewDriverData, setViewDriverData] = useState(null);
  const [editDataVehicle, setEditDataVehicle] = useState(null);
  const [editDataDriver, setEditDataDriver] = useState(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/vehicle/active-vehicles");
      let data = res.data.vehicle || [];

      if (searchVehicle.trim()) {
        const term = searchVehicle.toLowerCase();

        data = data.filter((vehicle) =>
          vehicle?.vehicleNumber
            ?.toLowerCase()
            .includes(term) ||

          vehicle?.assignDriver?.driverName
            ?.toLowerCase()
            .includes(term) ||

          vehicle?.assignTransporter?.transporterName
            ?.toLowerCase()
            .includes(term)
        );
      }

      const totalItems = data.length;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = data.slice(startIndex, endIndex);

      setVehicles(paginatedData);

      setVehicleTotalItems(totalItems);

      paginatedData.forEach((v) => {
        if (v && v._id) {
          vehicleRowsCacheRef.current.set(v._id, v);
        }
      });

    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleCounts = async () => {
    try {
      const res = await api.get("/api/vehicle/active-vehicles");
      const all = res.data.vehicle || [];
      setVehicleCounts({
        all: all.length,
      });
    } catch (_) { /* silent */ }
  };

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/driver/active-drivers");
      let data = res.data.driver || [];

      if (searchDriver.trim()) {
        const term = searchDriver.toLowerCase();

        data = data.filter((driver) =>
          driver?.driverName
            ?.toLowerCase()
            .includes(term) ||

          driver?.phoneNumber
            ?.toLowerCase()
            .includes(term) ||

          driver?.licenceNumber
            ?.toLowerCase()
            .includes(term) ||

          driver?.vehicleId?.vehicleNumber
            ?.toLowerCase()
            .includes(term) ||

          driver?.transporterId?.[0]?.transporterName
            ?.toLowerCase()
            .includes(term)
        );
      }

      const totalItems = data.length;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = data.slice(startIndex, endIndex);

      setDrivers(paginatedData);
      setDriverTotalItems(totalItems);

      paginatedData.forEach((d) => {
        if (d && d._id) {
          driverRowsCacheRef.current.set(d._id, d);
        }
      });

    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverCounts = async () => {
    try {
      const res = await api.get("/api/driver/active-drivers");
      const all = res.data.driver || [];
      setDriverCounts({ all: all.length });
    } catch (_) { /* silent */ }
  };

  useEffect(() => {
    if (activeTab === "Vehicle") {
      fetchVehicles();
      fetchVehicleCounts();
      fetchDrivers();
      fetchDriverCounts();
    } else {
      fetchVehicles();
      fetchVehicleCounts();
      fetchDrivers();
      fetchDriverCounts();
    }
  }, [activeTab, currentPage, itemsPerPage, searchVehicle, searchDriver, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedVehicles(new Set());
    setSelectedDrivers(new Set());
    setSelectAllVehiclesAcrossPages(false);
    setSelectAllDriversAcrossPages(false);
    vehicleRowsCacheRef.current = new Map();
    driverRowsCacheRef.current = new Map();
  }, [activeTab, searchVehicle, searchDriver, sortOrder]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewOptions === false) return;
      const insideDropdown = modelRef.current && modelRef.current.contains(event.target);
      const insideButton = buttonRefs.current[viewOptions] && buttonRefs.current[viewOptions].contains(event.target);
      if (!insideDropdown && !insideButton) setViewOptions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewOptions]);

  const handleVehicleCheckboxChange = (id) => {
    const next = new Set(selectedVehicles);
    if (next.has(id)) { next.delete(id); setSelectAllVehiclesAcrossPages(false); }
    else next.add(id);
    setSelectedVehicles(next);
  };

  const handleToggleSelectAllVehicles = async (checked) => {
    if (!checked) { setSelectedVehicles(new Set()); setSelectAllVehiclesAcrossPages(false); return; }
    try {
      const res = await api.get("/api/vehicle/active-vehicles");
      const rows = res.data.vehicle || [];
      rows.forEach(r => { if (r && r._id) vehicleRowsCacheRef.current.set(r._id, r); });
      setSelectedVehicles(new Set(rows.map(r => r._id).filter(Boolean)));
      setSelectAllVehiclesAcrossPages(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error selecting all vehicles");
    }
  };

  const handleDriverCheckboxChange = (id) => {
    const next = new Set(selectedDrivers);
    if (next.has(id)) { next.delete(id); setSelectAllDriversAcrossPages(false); }
    else next.add(id);
    setSelectedDrivers(next);
  };

  const handleToggleSelectAllDrivers = async (checked) => {
    if (!checked) { setSelectedDrivers(new Set()); setSelectAllDriversAcrossPages(false); return; }
    try {
      const res = await api.get("/api/driver/active-drivers");
      const rows = res.data.driver || [];
      rows.forEach(r => { if (r && r._id) driverRowsCacheRef.current.set(r._id, r); });
      setSelectedDrivers(new Set(rows.map(r => r._id).filter(Boolean)));
      setSelectAllDriversAcrossPages(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error selecting all drivers");
    }
  };

  const handleDeleteVehicle = (id) => { setDeleteMode("single"); setDeleteTargetId(id); setShowDeleteModal(true); };
  const handleDeleteDriver = (id) => { setDeleteMode("single"); setDeleteTargetId(id); setShowDeleteModal(true); };

  const handleBulkDelete = () => {
    const hasSelection = activeTab === "Vehicle" ? selectedVehicles.size > 0 : selectedDrivers.size > 0;
    if (!hasSelection) return;
    setDeleteMode("bulk");
    setDeleteTargetId(null);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => { setShowDeleteModal(false); setDeleteTargetId(null); };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      if (activeTab === "Vehicle") {
        if (deleteMode === "single" && deleteTargetId) {
          await api.delete(`/api/vehicle/delete/${deleteTargetId}`);
          toast.success("Vehicle deleted successfully");
        } else if (deleteMode === "bulk" && selectedVehicles.size > 0) {
          await Promise.all(Array.from(selectedVehicles).map(id => api.delete(`/api/vehicle/delete/${id}`)));
          toast.success("Selected vehicles deleted");
          setSelectedVehicles(new Set());
        }
        fetchVehicles();
        fetchVehicleCounts();
      } else {
        if (deleteMode === "single" && deleteTargetId) {
          await api.delete(`/api/driver/delete/${deleteTargetId}`);
          toast.success("Driver deleted successfully");
        } else if (deleteMode === "bulk" && selectedDrivers.size > 0) {
          await Promise.all(Array.from(selectedDrivers).map(id => api.delete(`/api/driver/delete/${id}`)));
          toast.success("Selected drivers deleted");
          setSelectedDrivers(new Set());
        }
        fetchDrivers();
        fetchDriverCounts();
      }
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  const handleExcel = async () => {
    if (activeTab === "Vehicle") {
      if (selectedVehicles.size === 0) { toast.error("Select at least 1 row to export"); return; }
      const rows = Array.from(selectedVehicles).map(id => vehicleRowsCacheRef.current.get(id)).filter(Boolean);
      if (!rows.length) { toast.error("No data to export"); return; }
      try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Vehicles");
        [20, 20, 20].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
        const hdr = ws.addRow(["Vehicle Name", "Created Date"]);
        hdr.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "99c5ff" } };
          cell.border = { top: { style: "thin", color: { argb: "338bff" } }, left: { style: "thin", color: { argb: "338bff" } }, bottom: { style: "thin", color: { argb: "338bff" } }, right: { style: "thin", color: { argb: "338bff" } } };
        });
        rows.forEach(v => ws.addRow([v.vehicleNumber || "", v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "-"]));
        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "vehicles.xlsx");
        toast.success("Excel exported successfully!");
      } catch (error) { toast.error(error?.message || "Export failed"); }
    } else {
      if (selectedDrivers.size === 0) { toast.error("Select at least 1 row to export"); return; }
      const rows = Array.from(selectedDrivers).map(id => driverRowsCacheRef.current.get(id)).filter(Boolean);
      if (!rows.length) { toast.error("No data to export"); return; }
      try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Drivers");
        [25, 20, 25, 20].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
        const hdr = ws.addRow(["Driver Name", "Phone Number", "License Number"]);
        hdr.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "99c5ff" } };
          cell.border = { top: { style: "thin", color: { argb: "338bff" } }, left: { style: "thin", color: { argb: "338bff" } }, bottom: { style: "thin", color: { argb: "338bff" } }, right: { style: "thin", color: { argb: "338bff" } } };
        });
        rows.forEach(d => ws.addRow([d.driverName || "", d.phoneNumber || "", d.licenceNumber || ""]));
        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "drivers.xlsx");
        toast.success("Excel exported successfully!");
      } catch (error) { toast.error(error?.message || "Export failed"); }
    }
  };

  const cleanUpModal = () => {
    document.body.classList.remove("modal-open");
    document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
    setTimeout(() => { document.body.style.overflow = ""; document.body.style.paddingRight = ""; }, 50);
  };

  const openDropdown = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      setOpenUpwards(true);
      setDropdownPos({ x: rect.left, y: rect.top - 6 });
    } else {
      setOpenUpwards(false);
      setDropdownPos({ x: rect.left, y: rect.bottom + 6 });
    }
    setViewOptions(viewOptions === index ? false : index);
  };

  const vehiclePageIds = vehicles.map(v => v._id);
  const allVehiclesSelectedOnPage = vehiclePageIds.length > 0 && vehiclePageIds.every(id => selectedVehicles.has(id));

  const driverPageIds = drivers.map(d => d._id);
  const allDriversSelectedOnPage = driverPageIds.length > 0 && driverPageIds.every(id => selectedDrivers.has(id));

  const thStyle = { textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400" };
  const tdStyle = { padding: "4px 16px", fontSize: 14, color: "#0E101A", cursor: "pointer" };
  const actionMenuStyle = {
    display: "flex", justifyContent: "flex-start", alignItems: "center", gap: 8,
    padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
    fontFamily: "Inter, sans-serif", fontSize: 16, fontWeight: 400,
    color: "#6C748C", textDecoration: "none",
  };

  const ThreeDots = ({ index, onOpen }) => (
    <div
      style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative", cursor: "pointer" }}
      ref={(el) => (buttonRefs.current[index] = el)}
    >
      <div
        style={{ width: 24, height: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}
        onClick={(e) => onOpen(e, index)}
      >
        {[0, 1, 2].map(i => <div key={i} style={{ width: 4, height: 4, background: "#6C748C", borderRadius: 2 }} />)}
      </div>
    </div>
  );

  const DropdownMenu = ({ index, onEdit, onDelete, onView }) => (
    viewOptions === index ? (
      <div style={{ position: "fixed", top: openUpwards ? dropdownPos.y - 80 : dropdownPos.y, left: dropdownPos.x - 80, zIndex: 999999 }}>
        <div ref={modelRef} style={{ background: "white", padding: 8, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.15)", minWidth: 180, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={actionMenuStyle} className="button-action" onClick={onView}>
            <img src={view} alt="" /><span style={{ color: "black" }}>View</span>
          </div>
           {hasPermission(user, "VehicleDriver", "update") && (
          <div style={actionMenuStyle} className="button-action" onClick={onEdit}>
            <img src={edit} alt="" /><span style={{ color: "black" }}>Edit</span>
          </div>
           )}
            {hasPermission(user, "VehicleDriver", "delete") && (
          <div style={actionMenuStyle} className="button-action" onClick={onDelete}>
            <img src={deletebtn} alt="" /><span style={{ color: "black" }}>Delete</span>
          </div>
            )}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="p-4">

      {/* header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px", // Optional: padding for container
          flexWrap: "wrap"
        }}
      >
        {/* Left: Title + Icon */}
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
              lineHeight: "26.4px",
            }}
          >
            Vehicle & Driver
          </h2>
        </div>

        {/* Right: Action Buttons */}
        {hasPermission(user, "VehicleDriver", "create") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: "33px",
            }}
          >
            {activeTab === "Vehicle" ? (
              <>
                <a
                  title="Add vehicle Button"
                  className="button-hover"
                  onClick={() => {
                    setEditDataVehicle(null);
                    setViewVehicleData(null);
                    setShowAddVehicleModal(true);
                  }}
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
                >+ Add Vehicle</a>
              </>
            ) : (
              <>
                <a
                  title="Add driver Button"
                  className="button-hover" onClick={() => {
                    setEditDataDriver(null);
                    setShowAddDriverModal(true);
                  }}
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
                >+ Add Driver</a>
              </>
            )}

          </div>
        )}
      </div>

      {/* /tab + search + list */}
      <div
        style={{
          width: "100%",
          minHeight: "auto",
          maxHeight: "calc(100vh - 160px)",
          padding: 16,
          background: "white",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "Inter, sans-serif",
        }}>
        {/* tab + search bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
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
              height: "38px",
              width: "auto",
            }}
          >
            {[
              { label: "Vehicle", count: vehicleCounts.all },
              { label: "Driver", count: driverCounts.all },
            ].map((tab) => (
              <div
                key={tab.label}
                style={{
                  padding: "6px 12px",
                  background: activeTab === tab.label ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow: activeTab === tab.label ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setActiveTab(tab.label);
                  setCurrentPage(1);
                }}
              >
                {t(tab.label)}
                <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          {/* Search Bar */}
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
              <IoIosSearch className="fs-4" />
              {activeTab === "Vehicle" ? (<input
                type="search"
                placeholder="Search by Vehicle Number..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                value={searchVehicle}
                onChange={e => { setSearchVehicle(e.target.value); setCurrentPage(1); }}
              />) : (<input
                type="search"
                placeholder="Search by Driver Name..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                value={searchDriver}
                onChange={e => { setSearchDriver(e.target.value); setCurrentPage(1); }}
              />
              )}
            </div>
                
                 {hasPermission(user, "VehicleDriver", "Export") && (
            <button
              title={`Export ${activeTab}`}
              onClick={handleExcel}
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

        {/* table */}
        {activeTab === "Vehicle" ? (
          <>
            {/* table */}
            <div
              className="table-responsive"
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
                }}>
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    height: "38px",
                  }}>
                  <tr style={{ background: "#F3F8FB" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <label className="checkboxs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input type="checkbox" style={{ width: 18, height: 18 }}
                            checked={selectAllVehiclesAcrossPages || allVehiclesSelectedOnPage}
                            onChange={e => handleToggleSelectAllVehicles(e.target.checked)} />
                          <span className="checkmarks" />
                        </label>
                        Number Plate
                      </div>
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Type
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Capacity
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Insurance Expiry
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Last Service
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Assigned Driver
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Assigned Transporter
                    </th>
                    <th style={{ ...thStyle, textAlign: "center" }}>{t("Action")}</th>
                  </tr>
                </thead>
                <tbody style={{ overflowY: 'auto' }}>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: 0 }}>
                        <div
                          style={{
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: 'rgba(255, 68, 31, 1)'
                          }}
                        >
                          No Vehicle Found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {vehicles.map((vehicle, index) => (
                        <tr key={vehicle._id}
                          onClick={() => {
                            setViewVehicleData(vehicle);
                            setEditDataVehicle(null);
                            setShowAddVehicleModal(true);
                          }}
                          style={{
                            borderBottom: "1px solid #EAEAEA",
                            height: "46px",
                          }}
                          className="table-hover">
                          <td
                            style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <label className="checkboxs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input type="checkbox" style={{ width: 18, height: 18 }}
                                  checked={selectedVehicles.has(vehicle._id)}
                                  onChange={() => handleVehicleCheckboxChange(vehicle._id)} />
                                <span className="checkmarks" />
                              </label>
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
                                }}>
                                {vehicle.vehicleNumber || "-"}
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {vehicle.vehicleType || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {vehicle.capacity ? vehicle.capacity + " kg" : "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {new Date(vehicle.insuranceExpiry).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {new Date(vehicle.lastServiceDate).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {vehicle?.assignDriver?.driverName || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {vehicle?.assignTransporter?.transporterName || "-"}
                          </td>
                          <td
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...tdStyle, position: "relative", overflow: "visible", textAlign: "center" }}>
                            <ThreeDots index={index} onOpen={openDropdown} />
                            <DropdownMenu index={index}
                              onView={() => { setShowAddVehicleModal(true); setViewOptions(false); setViewVehicleData(vehicle); setEditDataDriver(null); }}
                              onEdit={() => { setShowAddVehicleModal(true); setEditDataVehicle(vehicle); setViewOptions(false); setViewVehicleData(null); }}
                              onDelete={() => { handleDeleteVehicle(vehicle._id); setViewOptions(false); }} />
                          </td>
                        </tr>
                      ))}
                    </>)}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="page-redirect-btn px-2">
              <Pagination
                currentPage={currentPage}
                total={vehicleTotalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={p => setCurrentPage(p)}
                onItemsPerPageChange={n => { setItemsPerPage(n); setCurrentPage(1); }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              className="table-responsive"
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
                }}>
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    height: "38px",
                  }}>
                  <tr style={{ background: "#F3F8FB" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <label className="checkboxs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input type="checkbox" style={{ width: 18, height: 18 }}
                            checked={selectAllDriversAcrossPages || allDriversSelectedOnPage}
                            onChange={e => handleToggleSelectAllDrivers(e.target.checked)} />
                          <span className="checkmarks" />
                        </label>
                        Driver Name
                      </div>
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Phone No.
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      License No
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Assigned Vehicle
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Assigned Transporter
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Advance
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        width: "auto",
                        fontWeight: "400",
                      }}>
                      Credit days
                    </th>
                    <th style={{ ...thStyle, textAlign: "center" }}>{t("Action")}</th>
                  </tr>
                </thead>
                <tbody style={{ overflowY: 'auto' }}>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : drivers.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: 0 }}>
                        <div
                          style={{
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            color: 'rgba(255, 68, 31, 1)'
                          }}
                        >
                          No Driver Found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {drivers.map((driver, index) => (
                        <tr
                          key={driver._id}
                          onClick={() => {
                            setViewDriverData(driver);
                            setEditDataDriver(null);
                            setShowAddDriverModal(true);
                          }}
                          style={{
                            borderBottom: "1px solid #EAEAEA",
                            height: "46px",
                          }}
                          className="table-hover">
                          <td style={{
                            padding: "4px 16px",
                            verticalAlign: "middle",
                          }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <label className="checkboxs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input type="checkbox" style={{ width: 18, height: 18 }}
                                  checked={selectedDrivers.has(driver._id)}
                                  onChange={() => handleDriverCheckboxChange(driver._id)} />
                                <span className="checkmarks" />
                              </label>
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
                                }}>
                                {driver.driverName || "-"}
                              </div>
                            </div>
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {driver.phoneNumber || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {driver.licenceNumber || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {driver?.vehicleId?.vehicleNumber || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {driver?.transporterId?.[0]?.transporterName || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {driver.advance ? "₹" + driver.advance + "/-" : "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {driver.creditDay ? driver.creditDay + " Days" : "-"}
                          </td>
                          <td
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...tdStyle, position: "relative", overflow: "visible", textAlign: "center" }}>
                            <ThreeDots index={`d-${index}`} onOpen={openDropdown} />
                            <DropdownMenu index={`d-${index}`}
                              onView={() => { setShowAddDriverModal(true); setViewOptions(false); setViewDriverData(driver); setEditDataDriver(null); setEditDataDriver(null); }}
                              onEdit={() => { setShowAddDriverModal(true); setEditDataDriver(driver); setViewOptions(false); setViewDriverData(null); }}
                              onDelete={() => { handleDeleteDriver(driver._id); setViewOptions(false); }} />
                          </td>
                        </tr>
                      ))}
                    </>)}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="page-redirect-btn px-2">
              <Pagination
                currentPage={currentPage}
                total={driverTotalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={p => setCurrentPage(p)}
                onItemsPerPageChange={n => { setItemsPerPage(n); setCurrentPage(1); }}
              />
            </div>
          </>
        )}
      </div>

      {showAddDriverModal && (
        <AddDriver
          key={editDataDriver ? editDataDriver._id : "add-driver"}
          fetchDrivers={fetchDrivers}
          viewData={viewDriverData}
          show={showAddDriverModal}
          cleanUpModal={cleanUpModal}
          editData={editDataDriver}
          closeModal={() => {
            setShowAddDriverModal(false);
            setViewDriverData(null);
            setEditDataDriver(null);
          }}
        />
      )}

      {showAddVehicleModal && (
        <AddVehicle
          key={editDataVehicle ? editDataVehicle._id : "add-vehicle"}
          fetchVehicles={fetchVehicles}
          viewData={viewVehicleData}
          show={showAddVehicleModal}
          cleanUpModal={cleanUpModal}
          editData={editDataVehicle}
          closeModal={() => {
            setShowAddVehicleModal(false);
            setViewVehicleData(null);
            setEditDataVehicle(null);
          }}
        />
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName={activeTab === "Vehicle" ? "vehicle" : "driver"}
      />
    </div>
  );
}

export default VehicleDriver;