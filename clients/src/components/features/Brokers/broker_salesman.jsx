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
import AddBroker from "./AddBroker.jsx";
import AddSalesman from "./AddSalesman.jsx";

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

const BrokerSalesman = () => {

  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Salesman");
  const [brokers, setBrokers] = useState([]);
  const [brokerTotalItems, setBrokerTotalItems] = useState(0);
  const [brokerCounts, setBrokerCounts] = useState({ all: 0, active: 0, inactive: 0 });
  const [selectedBrokers, setSelectedBrokers] = useState(new Set());
  const [selectAllBrokersAcrossPages, setSelectAllBrokersAcrossPages] = useState(false);
  const brokerRowsCacheRef = useRef(new Map());
  const [salesmen, setSalesmen] = useState([]);
  const [salesmanTotalItems, setSalesmanTotalItems] = useState(0);
  const [salesmanCounts, setSalesmanCounts] = useState({ all: 0 });
  const [selectedSalesmen, setSelectedSalesmen] = useState(new Set());
  const [selectAllSalesmenAcrossPages, setSelectAllSalesmenAcrossPages] = useState(false);
  const salesmanRowsCacheRef = useRef(new Map());
  const [searchBroker, setSearchBroker] = useState("");
  const [searchSalesman, setSearchSalesman] = useState("");
  const [sortOrder, setSortOrder] = useState("Latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteMode, setDeleteMode] = useState("single");
  const [showAddBrokerModal, setShowAddBrokerModal] = useState(false);
  const [showAddSalesmanModal, setShowAddSalesmanModal] = useState(false);
  const [viewOptions, setViewOptions] = useState(false);
  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [viewBrokerData, setViewBrokerData] = useState(null);
  const [viewSalesmanData, setViewSalesmanData] = useState(null);
  const [editDataBroker, setEditDataBroker] = useState(null);
  const [editDataSalesman, setEditDataSalesman] = useState(null);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/broker/active-brokers");
      let data = res.data.broker || [];

      if (searchBroker.trim()) {
        const term = searchBroker.toLowerCase();

        data = data.filter((broker) =>
          broker?.brokerName?.toLowerCase().includes(term) ||
          broker?.phoneNumber?.toString().includes(term) ||
          broker?.email?.toLowerCase().includes(term)
        );
      }

      const totalItems = data.length;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = data.slice(startIndex, endIndex);

      setBrokers(paginatedData);

      setBrokerTotalItems(totalItems);

      paginatedData.forEach((v) => {
        if (v && v._id) {
          brokerRowsCacheRef.current.set(v._id, v);
        }
      });

    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load brokers");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokerCounts = async () => {
    try {
      const res = await api.get("/api/broker/active-brokers");
      const all = res.data.broker || [];
      setBrokerCounts({
        all: all.length,
      });
    } catch (_) { /* silent */ }
  };

  const fetchSalesman = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/salesman/active-salesman");
      let data = res.data.salesman || [];

      if (searchSalesman.trim()) {
        const term = searchSalesman.toLowerCase();

        data = data.filter((salesman) =>
          salesman?.salesmanName?.toLowerCase().includes(term) ||
          salesman?.phoneNumber?.toString().includes(term) ||
          salesman?.email?.toLowerCase().includes(term)
        );
      }

      const totalItems = data.length;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = data.slice(startIndex, endIndex);

      setSalesmen(paginatedData);
      setSalesmanTotalItems(totalItems);

      paginatedData.forEach((d) => {
        if (d && d._id) {
          salesmanRowsCacheRef.current.set(d._id, d);
        }
      });

    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load salesmen");
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesmanCounts = async () => {
    try {
      const res = await api.get("/api/salesman/active-salesman");
      const all = res.data.salesman || [];
      setSalesmanCounts({ all: all.length });
    } catch (_) { /* silent */ }
  };

  useEffect(() => {
    if (activeTab === "Broker") {
      fetchBrokers();
      fetchBrokerCounts();
    } else {
      fetchSalesman();
      fetchSalesmanCounts();
    }
  }, [activeTab, currentPage, itemsPerPage, searchSalesman, searchBroker, sortOrder]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedBrokers(new Set());
    setSelectedSalesmen(new Set());
    setSelectAllSalesmenAcrossPages(false);
    setSelectAllBrokersAcrossPages(false);
    salesmanRowsCacheRef.current = new Map();
    brokerRowsCacheRef.current = new Map();
  }, [activeTab, searchSalesman, searchBroker, sortOrder]);

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

  const handleBrokerCheckboxChange = (id) => {
    const next = new Set(selectedBrokers);
    if (next.has(id)) { next.delete(id); setSelectAllBrokersAcrossPages(false); }
    else next.add(id);
    setSelectedBrokers(next);
  };

  const handleToggleSelectAllBrokers = async (checked) => {
    if (!checked) { setSelectedBrokers(new Set()); setSelectAllBrokersAcrossPages(false); return; }
    try {
      const res = await api.get("/api/broker/active-brokers");
      const rows = res.data.broker || [];
      rows.forEach(r => { if (r && r._id) brokerRowsCacheRef.current.set(r._id, r); });
      setSelectedBrokers(new Set(rows.map(r => r._id).filter(Boolean)));
      setSelectAllBrokersAcrossPages(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error selecting all broker");
    }
  };

  const handleSalesmanCheckboxChange = (id) => {
    const next = new Set(selectedSalesmen);
    if (next.has(id)) { next.delete(id); setSelectAllSalesmenAcrossPages(false); }
    else next.add(id);
    setSelectedSalesmen(next);
  };

  const handleToggleSelectAllSalesmen = async (checked) => {
    if (!checked) { setSelectedSalesmen(new Set()); setSelectAllSalesmenAcrossPages(false); return; }
    try {
      const res = await api.get("/api/salesman/active-salesman");
      const rows = res.data.salesman || [];
      rows.forEach(r => { if (r && r._id) salesmanRowsCacheRef.current.set(r._id, r); });
      setSelectedSalesmen(new Set(rows.map(r => r._id).filter(Boolean)));
      setSelectAllSalesmenAcrossPages(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Error selecting all salesman");
    }
  };

  const handleDeleteBroker = (id) => { setDeleteMode("single"); setDeleteTargetId(id); setShowDeleteModal(true); };
  const handleDeleteSalesman = (id) => { setDeleteMode("single"); setDeleteTargetId(id); setShowDeleteModal(true); };

  const handleBulkDelete = () => {
    const hasSelection = activeTab === "broker" ? selectedBrokers.size > 0 : selectedSalesmen.size > 0;
    if (!hasSelection) return;
    setDeleteMode("bulk");
    setDeleteTargetId(null);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => { setShowDeleteModal(false); setDeleteTargetId(null); };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      if (activeTab === "Broker") {
        if (deleteMode === "single" && deleteTargetId) {
          await api.delete(`/api/broker/delete/${deleteTargetId}`);
          toast.success("Broker deleted successfully");
        } else if (deleteMode === "bulk" && selectedBrokers.size > 0) {
          await Promise.all(Array.from(selectedBrokers).map(id => api.delete(`/api/broker/delete/${id}`)));
          toast.success("Selected brokers deleted");
          setSelectedBrokers(new Set());
        }
        fetchBrokers();
        fetchBrokerCounts();
      } else {
        if (deleteMode === "single" && deleteTargetId) {
          await api.delete(`/api/salesman/delete/${deleteTargetId}`);
          toast.success("Salesman deleted successfully");
        } else if (deleteMode === "bulk" && selectedSalesmen.size > 0) {
          await Promise.all(Array.from(selectedSalesmen).map(id => api.delete(`/api/salesman/delete/${id}`)));
          toast.success("Selected salesmen deleted");
          setSelectedSalesmen(new Set());
        }
        fetchSalesman();
        fetchSalesmanCounts();
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
    if (activeTab === "Broker") {
      if (selectedBrokers.size === 0) { toast.error("Select at least 1 row to export"); return; }
      const rows = Array.from(selectedBrokers).map(id => brokerRowsCacheRef.current.get(id)).filter(Boolean);
      if (!rows.length) { toast.error("No data to export"); return; }
      try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Brokers");
        [25, 20, 20, 20, 20, 20, 20].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
        const hdr = ws.addRow(["Broker Name", "Phone Number", "Email Id", "Comission Type", "GSTIN", "Created Date"]);
        hdr.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "99c5ff" } };
          cell.border = { top: { style: "thin", color: { argb: "338bff" } }, left: { style: "thin", color: { argb: "338bff" } }, bottom: { style: "thin", color: { argb: "338bff" } }, right: { style: "thin", color: { argb: "338bff" } } };
        });
        rows.forEach(v => ws.addRow([v.brokerName || "", v.phoneNumber || "", v.email || "", v.comissionType || "", v.gstin || "", v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "-",]));
        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "brokers.xlsx");
        toast.success("Excel exported successfully!");
      } catch (error) { toast.error(error?.message || "Export failed"); }
    } else {
      if (selectedSalesmen.size === 0) { toast.error("Select at least 1 row to export"); return; }
      const rows = Array.from(selectedSalesmen).map(id => salesmanRowsCacheRef.current.get(id)).filter(Boolean);
      if (!rows.length) { toast.error("No data to export"); return; }
      try {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("Salesmen");
        [25, 20, 20, 20, 20, 20, 20].forEach((w, i) => { ws.getColumn(i + 1).width = w; });
        const hdr = ws.addRow(["Salesman Name", "Phone Number", "Email Id", "Assigned Broker", "GSTIN", "Created Date"]);
        hdr.eachCell(cell => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "99c5ff" } };
          cell.border = { top: { style: "thin", color: { argb: "338bff" } }, left: { style: "thin", color: { argb: "338bff" } }, bottom: { style: "thin", color: { argb: "338bff" } }, right: { style: "thin", color: { argb: "338bff" } } };
        });
        rows.forEach(d => ws.addRow([d.salesmanName || "", d.phoneNumber || "", d.email || "", d.brokerId?.brokerName || "", d.gstin || "", d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "-",]));
        const buffer = await wb.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "salesmen.xlsx");
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

  const brokerPageIds = brokers.map(v => v._id);
  const allBrokersSelectedOnPage = brokerPageIds.length > 0 && brokerPageIds.every(id => selectedBrokers.has(id));

  const salesmanPageIds = salesmen.map(d => d._id);
  const allSalesmenSelectedOnPage = salesmanPageIds.length > 0 && salesmanPageIds.every(id => selectedSalesmen.has(id));

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
            {hasPermission(user, "BrokerSalesman", "update") && (
          <div style={actionMenuStyle} className="button-action" onClick={onEdit}>
            <img src={edit} alt="" /><span style={{ color: "black" }}>Edit</span>
          </div>
            )}
             {hasPermission(user, "BrokerSalesman", "delete") && (
          <div style={actionMenuStyle} className="button-action" onClick={onDelete}>
            <img src={deletebtn} alt="" /><span style={{ color: "black" }}>Delete</span>
          </div>
             )}
        </div>
      </div>
    ) : null
  );


  useEffect(() => {
    fetchBrokers();
    fetchBrokerCounts();
    fetchSalesman();
    fetchSalesmanCounts();
  }, []);

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
            Broker & Salesman
          </h2>
        </div>

        {/* Right: Action Buttons */}
        {hasPermission(user, "BrokerSalesman", "create") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: "33px",
            }}
          >
            {activeTab === "Broker" ? (
              <>
                <a
                  title="Add broker Button"
                  className="button-hover"
                  onClick={() => {
                    setEditDataBroker(null);
                    setViewBrokerData(null);
                    setShowAddBrokerModal(true);
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
                >+ Add Broker</a>
              </>
            ) : (
              <>
                <a
                  title="Add salesman Button"
                  className="button-hover" onClick={() => {
                    setEditDataSalesman(null);
                    setShowAddSalesmanModal(true);
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
                >+ Add Salesman</a>
              </>
            )}

          </div>
        )}
      </div>

      {/* tab + search + table */}
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
              { label: "Salesman", count: salesmanCounts.all },
              { label: "Broker", count: brokerCounts.all },
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
              {activeTab === "Broker" ? (<input
                type="search"
                placeholder="Search by Broker Name..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                value={searchBroker}
                onChange={e => { setSearchBroker(e.target.value); setCurrentPage(1); }}
              />) : (<input
                type="search"
                placeholder="Search by Salesman Name..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                value={searchSalesman}
                onChange={e => { setSearchSalesman(e.target.value); setCurrentPage(1); }}
              />
              )}
            </div>


          {hasPermission(user, "BrokerSalesman", "Export") && (
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
        {activeTab === "Broker" ? (
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
                        <label className="checkboxs">
                          <input type="checkbox" style={{ width: 18, height: 18 }}
                          onClick={(e) => e.stopPropagation()}
                            checked={selectAllBrokersAcrossPages || allBrokersSelectedOnPage}
                            onChange={e => handleToggleSelectAllBrokers(e.target.checked)} />
                          <span className="checkmarks" />
                        </label>
                        Broker Name
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
                      Email Id
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
                      Comission Type
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
                  ) : brokers.length === 0 ? (
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
                          No Broker Found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {brokers.map((broker, index) => (
                        <tr key={broker._id}
                          onClick={() => {
                            setViewBrokerData(broker);
                            setEditDataBroker(null);
                            setShowAddBrokerModal(true);
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
                              <label className="checkboxs" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" style={{ width: 18, height: 18 }}
                                  checked={selectedBrokers.has(broker._id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleBrokerCheckboxChange(broker._id);
                                  }}
                                />
                                <span className="checkmarks" />
                              </label>
                              {broker.brokerImage?.[0]?.url ? (
                                <img
                                  src={broker.brokerImage?.[0]?.url}
                                  alt={broker.brokerName}
                                  className="me-1"
                                  style={{ objectFit: 'fill', width: '35px', height: '35px', borderRadius: '6px', }}
                                />
                              ) : (
                                <img
                                  src={ProductDefaultImage}
                                  alt={broker.brokerName}
                                  className="me-1"
                                  style={{ objectFit: 'fill', width: '35px', height: '35px', borderRadius: '6px', }}
                                />)}
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
                                {broker.brokerName || "-"}
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
                            {broker.phoneNumber || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {broker.email || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {broker.comissionType || "-"}
                          </td>
                          <td
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...tdStyle, position: "relative", overflow: "visible", textAlign: "center" }}>
                            <ThreeDots index={index} onOpen={openDropdown} />
                            <DropdownMenu index={index}
                              onView={() => { setShowAddBrokerModal(true); setViewOptions(false); setViewBrokerData(broker); setEditDataSalesman(null); setEditDataBroker(null); }}
                              onEdit={() => { setShowAddBrokerModal(true); setEditDataBroker(broker); setViewOptions(false); setViewBrokerData(null); }}
                              onDelete={() => { handleDeleteBroker(broker._id); setViewOptions(false); }} />
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
                total={brokerTotalItems}
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
                        <label className="checkboxs" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" style={{ width: 18, height: 18 }}
                            checked={selectAllSalesmenAcrossPages || allSalesmenSelectedOnPage}
                            onChange={e => handleToggleSelectAllSalesmen(e.target.checked)} />
                          <span className="checkmarks" />
                        </label>
                        Salesman Name
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
                      Email Id
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
                      Assigned Broker
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
                  ) : salesmen.length === 0 ? (
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
                          No Salesman Found
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {salesmen.map((salesman, index) => (
                        <tr
                          key={salesman._id}
                          onClick={() => {
                            setViewSalesmanData(salesman);
                            setEditDataSalesman(null);
                            setShowAddSalesmanModal(true);
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
                              <label className="checkboxs" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" style={{ width: 18, height: 18 }}
                                  checked={selectedSalesmen.has(salesman._id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleSalesmanCheckboxChange(salesman._id);
                                  }}
                                />
                                <span className="checkmarks" />
                              </label>
                              {salesman.salesmanImage?.[0]?.url ? (
                                <img
                                  src={salesman.salesmanImage?.[0]?.url}
                                  alt={salesman.salesmanName}
                                  className="me-1"
                                  style={{ objectFit: 'fill', width: '35px', height: '35px', borderRadius: '6px', }}
                                />
                              ) : (
                                <img
                                  src={ProductDefaultImage}
                                  alt={salesman.salesmanName}
                                  className="me-1"
                                  style={{ objectFit: 'fill', width: '35px', height: '35px', borderRadius: '6px', }}
                                />)}
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
                                {salesman.salesmanName || "-"}
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
                            {salesman.phoneNumber || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {salesman.email || "-"}
                          </td>
                          <td
                            style={{
                              padding: "4px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: "pointer",
                            }}>
                            {salesman?.brokerId?.brokerName || "-"}
                          </td>
                          <td
                            onClick={(e) => e.stopPropagation()}
                            style={{ ...tdStyle, position: "relative", overflow: "visible", textAlign: "center" }}>
                            <ThreeDots index={`d-${index}`} onOpen={openDropdown} />
                            <DropdownMenu index={`d-${index}`}
                              onView={() => { setShowAddSalesmanModal(true); setViewOptions(false); setViewSalesmanData(salesman); setEditDataSalesman(null); }}
                              onEdit={() => { setShowAddSalesmanModal(true); setEditDataSalesman(salesman); setViewOptions(false); setViewSalesmanData(null); }}
                              onDelete={() => { handleDeleteSalesman(salesman._id); setViewOptions(false); }} />
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
                total={salesmanTotalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={p => setCurrentPage(p)}
                onItemsPerPageChange={n => { setItemsPerPage(n); setCurrentPage(1); }}
              />
            </div>
          </>
        )}
      </div>

      {showAddBrokerModal && (
        <AddBroker
          key={editDataBroker ? editDataBroker._id : "add-broker"}
          fetchBrokers={fetchBrokers}
          viewData={viewBrokerData}
          show={showAddBrokerModal}
          cleanUpModal={cleanUpModal}
          editData={editDataBroker}
          closeModal={() => {
            setShowAddBrokerModal(false);
            setViewBrokerData(null);
            setEditDataBroker(null);
          }}
        />
      )}

      {showAddSalesmanModal && (
        <AddSalesman
          key={editDataSalesman ? editDataSalesman._id : "add-salesman"}
          fetchSalesman={fetchSalesman}
          viewData={viewSalesmanData}
          show={showAddSalesmanModal}
          cleanUpModal={cleanUpModal}
          editData={editDataSalesman}
          closeModal={() => {
            setShowAddSalesmanModal(false);
            setViewSalesmanData(null);
            setEditDataSalesman(null);
          }}
        />
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName={activeTab === "Broker" ? "broker" : "salesman"}
      />
    </div>
  );
};

export default BrokerSalesman;
