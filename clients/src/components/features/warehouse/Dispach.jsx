import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';
import { Link } from "react-router-dom";

// pages
import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
import api from "../../../pages/config/axiosInstance.js"
import { useAuth } from "../../auth/AuthContext.js";
import Pagination from "../../Pagination.jsx";
import DeleteModal from "../../ConfirmDelete.jsx";
import DateFilterDropdown from "../../DateFilterDropdown.jsx";

// icons
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { TbFileExport } from "react-icons/tb";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { IoPrintOutline } from "react-icons/io5";
import { GrDocumentUpdate } from "react-icons/gr";
import { HiOutlineCalendarDateRange } from "react-icons/hi2";
import { MdCancelPresentation } from "react-icons/md";
import { MdNavigateNext, MdOutlineKeyboardArrowUp } from "react-icons/md";
import { VscNotebookTemplate } from "react-icons/vsc";
import { PiNotepadBold } from "react-icons/pi";
import { PiNotepadLight } from "react-icons/pi";

// images
import ProductDefaultImage from "../../../assets/images/product-default.png";
import edit from "../../../assets/images/edit.png";
import deletebtn from "../../../assets/images/delete.png";
import viewdetails from "../../../assets/images/view-details.png";
import duplicate from "../../../assets/images/duplicate.png";
import generateinvoice from "../../../assets/images/create-icon1.png";

const Dispatch = () => {

    const { user } = useAuth();
    const { t } = useTranslation();
    const [dispatches, setDispatches] = useState([]);
    const [selectedDispatches, setSelectedDispatches] = useState(new Set());
    const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
    const selectedRowsCacheRef = useRef(new Map());
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState("Latest");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [counts, setCounts] = useState({ all: 0, open: 0, close: 0 });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [deleteMode, setDeleteMode] = useState("single");
    const [loading, setLoading] = useState(false);
    const [viewOptions, setViewOptions] = useState(false);
    const buttonRefs = useRef([]);
    const modelRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
    const [openUpwards, setOpenUpwards] = useState(false);
    const [dateRange, setDateRange] = useState({ start: null, end: null });

    // Fetch dispatches (delivery challans) on mount and when filters change
    useEffect(() => {
        fetchDispatches();
        fetchCounts();
    }, [currentPage, itemsPerPage, searchTerm, statusFilter, sortOrder, dateRange]);

    const fetchDispatches = async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                status: statusFilter !== "All" ? statusFilter : undefined,
                sort: sortOrder,
                startDate: dateRange.start,
                endDate: dateRange.end
            };

            // Assuming your API endpoint for delivery challans/dispatch
            const res = await api.get("/api/delivery-challans", { params });
            // Or if using invoices with dispatch status: "/api/invoices/dispatched"

            setDispatches(res.data.dispatches || res.data.deliveryChallans || []);
            setTotalItems(res.data.total || 0);
        } catch (error) {
            toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to load dispatches");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const cache = selectedRowsCacheRef.current;
        dispatches.forEach((d) => {
            if (d && d._id) cache.set(d._id, d);
        });
    }, [dispatches]);

    const fetchCounts = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/delivery-challans/counts", {
                params: { search: searchTerm }
            });
            setCounts({
                all: res.data.all || 0,
                open: res.data.open || 0,
                close: res.data.close || 0
            });
        } catch (error) {
            // If counts API doesn't exist, calculate from all data
            try {
                const res = await api.get("/api/delivery-challans", { params: { limit: 1000, search: searchTerm } });
                const allDispatches = res.data.dispatches || [];
                setCounts({
                    all: allDispatches.length,
                    open: allDispatches.filter(d => d.status === "Open" || d.status === "pending").length,
                    close: allDispatches.filter(d => d.status === "Close" || d.status === "delivered" || d.status === "completed").length
                });
            } catch (err) {
                console.error("Failed to load counts", err);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDispatch = (dispatchId) => {
        setDeleteMode("single");
        setDeleteTargetId(dispatchId);
        setShowDeleteModal(true);
    };

    const handleCheckboxChange = (id) => {
        const next = new Set(selectedDispatches);
        if (next.has(id)) {
            next.delete(id);
            if (selectAllAcrossPages) setSelectAllAcrossPages(false);
        } else {
            next.add(id);
        }
        setSelectedDispatches(next);
    };

    const handleToggleSelectAll = async (checked) => {
        if (!checked) {
            setSelectedDispatches(new Set());
            setSelectAllAcrossPages(false);
            return;
        }
        try {
            const res = await api.get("/api/delivery-challans", {
                params: {
                    limit: 1000,
                    search: searchTerm,
                    status: statusFilter !== "All" ? statusFilter : undefined,
                    sort: sortOrder,
                },
            });
            const rows = res.data.dispatches || [];
            const total = Number(res.data.total) || rows.length;
            if (total > 1000) {
                toast.error("Maximum 1000 rows can be selected");
            }
            const cache = selectedRowsCacheRef.current;
            rows.forEach((r) => {
                if (r && r._id) cache.set(r._id, r);
            });
            setSelectedDispatches(new Set(rows.map((r) => r && r._id).filter(Boolean)));
            setSelectAllAcrossPages(true);
        } catch (err) {
            toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
        }
    };

    const handleBulkDelete = () => {
        if (selectedDispatches.size === 0) return;
        setDeleteMode("bulk");
        setDeleteTargetId(null);
        setShowDeleteModal(true);
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteTargetId(null);
    };

    const confirmDelete = async () => {
        try {
            setLoading(true);
            if (deleteMode === "single" && deleteTargetId) {
                await api.delete(`/api/delivery-challans/${deleteTargetId}`);
                toast.success("Dispatch deleted successfully");
            } else if (deleteMode === "bulk" && selectedDispatches.size > 0) {
                await Promise.all(
                    Array.from(selectedDispatches).map((id) =>
                        api.delete(`/api/delivery-challans/${id}`)
                    )
                );
                toast.success("Selected dispatches deleted");
                setSelectedDispatches(new Set());
            }
            setShowDeleteModal(false);
            setDeleteTargetId(null);
            fetchDispatches();
            fetchCounts();
        } catch (err) {
            toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
            setShowDeleteModal(false);
            setDeleteTargetId(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
        setSelectedDispatches(new Set());
        setSelectAllAcrossPages(false);
        selectedRowsCacheRef.current = new Map();
    }, [statusFilter, searchTerm, sortOrder, dateRange]);

    const exportToExcel = () => {
        try {
            const excelData = dispatches.map((dispatch, index) => ({
                "S.No": index + 1,
                "Dispatch No": dispatch.dispatchNo || dispatch.deliveryChallanNo || "N/A",
                "Customer Name": dispatch.customerName || dispatch.customerId?.name || "N/A",
                "Date": new Date(dispatch.date || dispatch.createdAt).toLocaleDateString(),
                "Total Amount": `₹${(dispatch.totalAmount || 0).toLocaleString('en-IN')}`,
                "Vehicle No": dispatch.vehicleNumber || dispatch.vehicleId?.vehicleNumber || "N/A",
                "E-way Bill No": dispatch.ewayBillNo || "N/A",
                "Status": dispatch.status || "N/A"
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);
            
            const colWidths = [
                { wch: 8 },   // S.No
                { wch: 15 },  // Dispatch No
                { wch: 20 },  // Customer Name
                { wch: 12 },  // Date
                { wch: 15 },  // Total Amount
                { wch: 15 },  // Vehicle No
                { wch: 15 },  // E-way Bill No
                { wch: 12 }   // Status
            ];
            ws['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(wb, ws, "Dispatches");
            XLSX.writeFile(wb, `dispatches_report_${new Date().toISOString().split('T')[0]}.xlsx`);
            toast.success("Excel file exported successfully!");
        } catch (error) {
            toast.error(error?.message || "Error exporting to Excel");
        }
    };

    const exportToPDF = async () => {
        try {
            const doc = new jsPDF();
            doc.text("Dispatch Report", 14, 15);

            const tableColumns = ["Dispatch No", "Customer Name", "Date", "Total Amount", "Vehicle No", "E-way Bill No", "Status"];
            const tableRows = dispatches.map((dispatch) => [
                dispatch.dispatchNo || dispatch.deliveryChallanNo || "N/A",
                dispatch.customerName || dispatch.customerId?.name || "N/A",
                new Date(dispatch.date || dispatch.createdAt).toLocaleDateString(),
                `₹${(dispatch.totalAmount || 0).toLocaleString('en-IN')}`,
                dispatch.vehicleNumber || dispatch.vehicleId?.vehicleNumber || "N/A",
                dispatch.ewayBillNo || "N/A",
                dispatch.status || "N/A"
            ]);

            autoTable(doc, {
                head: [tableColumns],
                body: tableRows,
                startY: 20,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [155, 155, 155], textColor: "white" },
                theme: "striped",
            });

            doc.save(`dispatches_report_${new Date().toISOString().split('T')[0]}.pdf`);
            toast.success("PDF exported successfully!");
        } catch (error) {
            toast.error(error?.message || "Error exporting to PDF");
        }
    };

    const handleDateChange = (dates) => {
        setDateRange({
            start: dates.startDate,
            end: dates.endDate
        });
        setCurrentPage(1);
    };

    const paginatedDispatches = dispatches;
    const pageIds = paginatedDispatches.map((d) => d._id);
    const allSelectedOnPage = pageIds.length > 0 && pageIds.every((id) => selectedDispatches.has(id));

    const cleanUpModal = () => {
        document.body.classList.remove("modal-open");
        document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
        setTimeout(() => {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
        }, 50);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (viewOptions === false) return;

            const isClickInsideDropdown = modelRef.current && modelRef.current.contains(event.target);
            const isClickOnButton = buttonRefs.current[viewOptions] && buttonRefs.current[viewOptions].contains(event.target);

            if (!isClickInsideDropdown && !isClickOnButton) {
                setViewOptions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [viewOptions]);

    // Generate dispatch number (if not from API)
    const getDispatchNumber = (dispatch, index) => {
        if (dispatch.dispatchNo) return dispatch.dispatchNo;
        if (dispatch.deliveryChallanNo) return dispatch.deliveryChallanNo;
        return `DC-${String(index + 1).padStart(3, '0')}`;
    };

    return (
        <div className="p-4">
            {/* header */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0px 0px 16px 0px",
                    flexWrap: "wrap"
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
                            lineHeight: "26.4px",
                        }}
                    >
                        Dispatch
                    </h2>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        height: "33px",
                    }}
                >
                    <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
                        <DateFilterDropdown
                            onChange={handleDateChange}
                            selectedDateRange={dateRange}
                            setSelectedDateRange={setDateRange}
                        />
                    </div>

                    <Link
                        title="Add Delivery Challan"
                        className="button-hover"
                        to="/createdispatch"
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
                        + Create Dispatch
                    </Link>
                </div>
            </div>

            {/* Main Card */}
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
                {/* tabs + search bar */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        flexWrap: "wrap",
                        gap: "10px"
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
                            { label: "All", count: counts.all, value: "All" },
                            { label: "Open", count: counts.open, value: "Open" },
                            { label: "Close", count: counts.close, value: "Close" },
                        ].map((tab) => (
                            <div
                                key={tab.label}
                                style={{
                                    padding: "6px 12px",
                                    background: statusFilter === tab.value ? "white" : "transparent",
                                    borderRadius: 8,
                                    boxShadow: statusFilter === tab.value ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: 14,
                                    color: "#0E101A",
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    setStatusFilter(tab.value);
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
                            <input
                                type="search"
                                placeholder="Search by Dispatch No, Customer, E-waybill..."
                                style={{
                                    width: "100%",
                                    border: "none",
                                    outline: "none",
                                    fontSize: 14,
                                    background: "#FCFCFC",
                                    color: "rgba(19.75, 25.29, 61.30, 0.40)",
                                }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {hasPermission(user, "Delivery Challan", "export") && (
                            <button
                                title="Export"
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
                                onClick={() => {
                                    if (dispatches.length === 0) {
                                        toast.error("No data to export");
                                        return;
                                    }
                                    exportToExcel();
                                }}
                            >
                                <TbFileExport className="fs-5 text-secondary" />
                                Export
                            </button>
                        )}
                    </div>
                </div>

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
                                            <input
                                                type="checkbox"
                                                style={{ width: 18, height: 18 }}
                                                checked={selectAllAcrossPages || allSelectedOnPage}
                                                onChange={(e) => handleToggleSelectAll(e.target.checked)}
                                            />
                                            <span className="checkmarks" />
                                        </label>
                                        Sr No.
                                    </div>
                                </th>
                                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400" }}>
                                    Dispatch No.
                                </th>
                                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400" }}>
                                    Customer Name
                                </th>
                                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400" }}>
                                    Date
                                </th>
                                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400" }}>
                                    Total amount
                                </th>
                                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400" }}>
                                    Vehicle No.
                                </th>
                                <th style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400" }}>
                                    E-way bill No.
                                </th>
                                <th style={{ textAlign: "center", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400" }}>
                                    {t("Action")}
                                </th>
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
                            ) : paginatedDispatches.length === 0 ? (
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
                                            No Dispatch Found
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedDispatches.map((dispatch, index) => (
                                    <tr key={dispatch._id}
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
                                                <label className="checkboxs">
                                                    <input
                                                        type="checkbox"
                                                        style={{ width: 18, height: 18 }}
                                                        checked={selectedDispatches.has(dispatch._id)}
                                                        onChange={() => handleCheckboxChange(dispatch._id)}
                                                    />
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
                                                    {((currentPage - 1) * itemsPerPage) + index + 1}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "4px 16px", fontSize: 14, color: "#1F7FFF", cursor: "pointer" }}>
                                            {getDispatchNumber(dispatch, index)}
                                        </td>
                                        <td style={{ padding: "4px 16px", fontSize: 14, color: "#0E101A" }}>
                                            {dispatch.customerName || dispatch.customerId?.name || "N/A"}
                                        </td>
                                        <td style={{ padding: "4px 16px", fontSize: 14, color: "#0E101A" }}>
                                            {new Date(dispatch.date || dispatch.createdAt).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            })}
                                        </td>
                                        <td style={{ padding: "4px 16px", fontSize: 14, color: "#0E101A" }}>
                                            ₹{(dispatch.totalAmount || 0).toLocaleString('en-IN')}/-
                                        </td>
                                        <td style={{ padding: "4px 16px", fontSize: 14, color: "#0E101A" }}>
                                            {dispatch.vehicleNumber || dispatch.vehicleId?.vehicleNumber || "N/A"}
                                        </td>
                                        <td style={{ padding: "4px 16px", fontSize: 14, color: "#0E101A" }}>
                                            <span style={{ color: "#1F7FFF" }}>
                                                {dispatch.ewayBillNo || "N/A"}
                                            </span>
                                        </td>
                                        <td className=""
                                            style={{
                                                padding: "4px 16px",
                                                position: "relative",
                                                overflow: "visible",
                                            }}>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                    position: "relative",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                    onClick={(e) => {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        const dropdownHeight = 260;
                                                        const spaceBelow = window.innerHeight - rect.bottom;
                                                        const spaceAbove = rect.top;
                                                        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                                                            setOpenUpwards(true);
                                                            setDropdownPos({ x: rect.left, y: rect.top - 6 });
                                                        } else {
                                                            setOpenUpwards(false);
                                                            setDropdownPos({ x: rect.left, y: rect.bottom + 6 });
                                                        }
                                                        setViewOptions(viewOptions === index ? false : index);
                                                    }}
                                                    ref={(el) => (buttonRefs.current[index] = el)}
                                                >
                                                    <HiOutlineDotsHorizontal size={24} color="grey" />
                                                </div>

                                                {viewOptions === index && (
                                                    <div
                                                        style={{
                                                            position: "fixed",
                                                            top: openUpwards ? dropdownPos.y - 110 : dropdownPos.y,
                                                            left: dropdownPos.x - 120,
                                                            zIndex: 999999,
                                                            width: 225,
                                                        }}
                                                    >
                                                        <div
                                                            ref={modelRef}
                                                            style={{
                                                                background: "white",
                                                                padding: 8,
                                                                borderRadius: 12,
                                                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                                                minWidth: 180,
                                                                height: "auto",
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                gap: 4,
                                                            }}
                                                        >
                                                            <Link
                                                                to={`/dispatch/${dispatch._id}`}
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "flex-start",
                                                                    alignItems: "center",
                                                                    gap: 8,
                                                                    padding: "8px 12px",
                                                                    borderRadius: 8,
                                                                    border: "none",
                                                                    cursor: "pointer",
                                                                    fontFamily: "Inter, sans-serif",
                                                                    fontSize: 16,
                                                                    fontWeight: 400,
                                                                    color: "#6C748C",
                                                                    textDecoration: "none",
                                                                }}
                                                                className="button-action"
                                                            >
                                                                <img src={viewdetails} alt="" />
                                                                <span style={{ color: "black" }}>View Details</span>
                                                            </Link>
                                                            <Link
                                                                to={`/editdispatch/${dispatch._id}`}
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "flex-start",
                                                                    alignItems: "center",
                                                                    gap: 8,
                                                                    padding: "8px 12px",
                                                                    borderRadius: 8,
                                                                    border: "none",
                                                                    cursor: "pointer",
                                                                    fontFamily: "Inter, sans-serif",
                                                                    fontSize: 16,
                                                                    fontWeight: 400,
                                                                    color: "#6C748C",
                                                                    textDecoration: "none",
                                                                }}
                                                                className="button-action"
                                                            >
                                                                <img src={edit} alt="" />
                                                                <span style={{ color: "black" }}>Edit</span>
                                                            </Link>
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "flex-start",
                                                                    alignItems: "center",
                                                                    gap: 8,
                                                                    padding: "8px 12px",
                                                                    borderRadius: 8,
                                                                    border: "none",
                                                                    cursor: "pointer",
                                                                    fontFamily: "Inter, sans-serif",
                                                                    fontSize: 16,
                                                                    fontWeight: 400,
                                                                    color: "#6C748C",
                                                                    textDecoration: "none",
                                                                }}
                                                                className="button-action"
                                                                onClick={() => handleDeleteDispatch(dispatch._id)}
                                                            >
                                                                <img src={deletebtn} alt="" />
                                                                <span style={{ color: "black" }}>Delete</span>
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display: "flex",
                                                                    justifyContent: "flex-start",
                                                                    alignItems: "center",
                                                                    gap: 8,
                                                                    padding: "8px 12px",
                                                                    borderRadius: 8,
                                                                    border: "none",
                                                                    cursor: "pointer",
                                                                    fontFamily: "Inter, sans-serif",
                                                                    fontSize: 16,
                                                                    fontWeight: 400,
                                                                    color: "#6C748C",
                                                                    textDecoration: "none",
                                                                }}
                                                                className="button-action"
                                                                onClick={() => {
                                                                    // Handle print
                                                                    window.open(`/print-dispatch/${dispatch._id}`, '_blank');
                                                                }}
                                                            >
                                                                <IoPrintOutline size={28} />
                                                                <span style={{ color: "black" }}>Print</span>
                                                            </div>
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

                {/* pagination */}
                <div className="page-redirect-btn px-2">
                    <Pagination
                        currentPage={currentPage}
                        total={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={(p) => {
                            setCurrentPage(p);
                        }}
                        onItemsPerPageChange={(n) => {
                            setItemsPerPage(n);
                            setCurrentPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Delete Modal */}
            <DeleteModal
                show={showDeleteModal}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                title="Delete Dispatch"
                message={deleteMode === "single" 
                    ? "Are you sure you want to delete this dispatch?" 
                    : `Are you sure you want to delete ${selectedDispatches.size} dispatches?`}
            />
        </div>
    );
}

export default Dispatch;
// import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import html2canvas from "html2canvas";
// import * as XLSX from "xlsx";
// import { toast } from "react-toastify";
// import { useTranslation } from 'react-i18next';
// import { Link } from "react-router-dom";

// // pages
// import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
// import api from "../../../pages/config/axiosInstance.js"
// import { useAuth } from "../../auth/AuthContext.js";
// import Pagination from "../../Pagination.jsx";
// import DeleteModal from "../../ConfirmDelete.jsx";
// import DateFilterDropdown from "../../DateFilterDropdown.jsx";

// // icons
// import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
// import { TbFileExport } from "react-icons/tb";
// import { HiOutlineDotsHorizontal } from "react-icons/hi";
// import { IoPrintOutline } from "react-icons/io5";
// import { GrDocumentUpdate } from "react-icons/gr";
// import { HiOutlineCalendarDateRange } from "react-icons/hi2";
// import { MdCancelPresentation } from "react-icons/md";
// import { MdNavigateNext, MdOutlineKeyboardArrowUp } from "react-icons/md";
// import { VscNotebookTemplate } from "react-icons/vsc";
// import { PiNotepadBold } from "react-icons/pi";
// import { PiNotepadLight } from "react-icons/pi";

// // images
// import ProductDefaultImage from "../../../assets/images/product-default.png";
// import edit from "../../../assets/images/edit.png";
// import deletebtn from "../../../assets/images/delete.png";
// import viewdetails from "../../../assets/images/view-details.png";
// import duplicate from "../../../assets/images/duplicate.png";
// import generateinvoice from "../../../assets/images/create-icon1.png";

// const Dispach = () => {

//     const { user } = useAuth();
//     const { t } = useTranslation();
//     const [brands, setBrands] = useState([]);
//     const [selectedBrands, setSelectedBrands] = useState(new Set());
//     const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
//     const selectedRowsCacheRef = useRef(new Map());
//     const [searchTerm, setSearchTerm] = useState("");
//     const [statusFilter, setStatusFilter] = useState("All");
//     const [sortOrder, setSortOrder] = useState("Latest");
//     const [currentPage, setCurrentPage] = useState(1);
//     const [itemsPerPage, setItemsPerPage] = useState(10);
//     const [totalItems, setTotalItems] = useState(0);
//     const [counts, setCounts] = useState({ all: 0, active: 0, inactive: 0 });
//     const [showDeleteModal, setShowDeleteModal] = useState(false);
//     const [deleteTargetId, setDeleteTargetId] = useState(null);
//     const [deleteMode, setDeleteMode] = useState("single");
//     const [editingBrand, setEditingBrand] = useState(null);
//     const [showAddBrandModal, setShowAddBrandModal] = useState(false);
//     const [showEditBrandModal, setShowEditBrandModal] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [viewOptions, setViewOptions] = useState(false);
//     const buttonRefs = useRef([]);
//     const modelRef = useRef(null);
//     const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
//     const [openUpwards, setOpenUpwards] = useState(false);

//     useEffect(() => {
//         fetchBrands();
//         fetchCounts();
//     }, [currentPage, itemsPerPage, searchTerm, statusFilter, sortOrder]);

//     const fetchBrands = async () => {
//         try {
//             setLoading(true);
//             const res = await api.get("/api/brands/getBrands", {
//                 params: {
//                     page: currentPage,
//                     limit: itemsPerPage,
//                     search: searchTerm,
//                     status: statusFilter,
//                     sort: sortOrder,
//                 },
//             });

//             setBrands(res.data.brands || []);
//             setTotalItems(res.data.total || 0);
//         } catch (error) {
//             toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to load brands");
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         const cache = selectedRowsCacheRef.current;
//         brands.forEach((b) => {
//             if (b && b._id) cache.set(b._id, b);
//         });
//     }, [brands]);

//     const fetchCounts = async () => {
//         try {
//             setLoading(true);
//             const res = await api.get("/api/brands/getBrands", {
//                 params: { limit: 1000, search: searchTerm }
//             });
//             const allBrands = res.data.brands || [];
//             setCounts({
//                 all: allBrands.length,
//                 active: allBrands.filter(b => b.status === "Active").length,
//                 inactive: allBrands.filter(b => b.status === "Inactive").length
//             });
//         } catch (error) {
//             toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to load brand counts");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleDeleteBrand = (brandId) => {
//         setDeleteMode("single");
//         setDeleteTargetId(brandId);
//         setShowDeleteModal(true);
//     };

//     const paginatedBrands = brands;

//     const handleCheckboxChange = (id) => {
//         const next = new Set(selectedBrands);
//         if (next.has(id)) {
//             next.delete(id);
//             if (selectAllAcrossPages) setSelectAllAcrossPages(false);
//         } else {
//             next.add(id);
//         }
//         setSelectedBrands(next);
//     };

//     const handleToggleSelectAll = async (checked) => {
//         if (!checked) {
//             setSelectedBrands(new Set());
//             setSelectAllAcrossPages(false);
//             return;
//         }
//         try {
//             const res = await api.get("/api/brands/getBrands", {
//                 params: {
//                     limit: 1000,
//                     search: searchTerm,
//                     status: statusFilter,
//                     sort: sortOrder,
//                 },
//             });
//             const rows = res.data.brands || [];
//             const total = Number(res.data.total) || rows.length;
//             if (total > 1000) {
//                 toast.error("Maximum 1000 rows can be selected");
//             }
//             const cache = selectedRowsCacheRef.current;
//             rows.forEach((r) => {
//                 if (r && r._id) cache.set(r._id, r);
//             });
//             setSelectedBrands(new Set(rows.map((r) => r && r._id).filter(Boolean)));
//             setSelectAllAcrossPages(true);
//         } catch (err) {
//             toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
//         }
//     };

//     const handleBulkDelete = () => {
//         if (selectedBrands.size === 0) return;
//         setDeleteMode("bulk");
//         setDeleteTargetId(null);
//         setShowDeleteModal(true);
//     };

//     const cancelDelete = () => {
//         setShowDeleteModal(false);
//         setDeleteTargetId(null);
//     };

//     const confirmDelete = async () => {
//         try {
//             setLoading(true);
//             if (deleteMode === "single" && deleteTargetId) {
//                 await api.delete(`/api/brands/deleteBrand/${deleteTargetId}`);
//                 toast.success("Brand deleted successfully");
//             } else if (deleteMode === "bulk" && selectedBrands.size > 0) {
//                 await Promise.all(
//                     Array.from(selectedBrands).map((id) =>
//                         api.delete(`/api/brands/deleteBrand/${id}`)
//                     )
//                 );
//                 toast.success("Selected brands deleted");
//                 setSelectedBrands(new Set());
//             }
//             setShowDeleteModal(false);
//             setDeleteTargetId(null);
//             fetchBrands();
//             fetchCounts();
//         } catch (err) {
//             toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
//             setShowDeleteModal(false);
//             setDeleteTargetId(null);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => {
//         setCurrentPage(1);
//         setSelectedBrands(new Set());
//         setSelectAllAcrossPages(false);
//         selectedRowsCacheRef.current = new Map();
//     }, [statusFilter, searchTerm, sortOrder]);

//     const handleExcel = async () => {
//         if (selectedBrands.size === 0) {
//             toast.error("Select atleast 1 row to export data");
//             return;
//         }
//         const tableColumns = ["Brand Name", "Created Date", "Status"];
//         let rowsSource = [];

//         try {
//             if (selectedBrands.size > 0) {
//                 rowsSource = Array.from(selectedBrands)
//                     .map((id) => selectedRowsCacheRef.current.get(id))
//                     .filter(Boolean);
//             }

//             if (!rowsSource || rowsSource.length === 0) {
//                 toast.error("No data available to export");
//                 return;
//             }

//             const tableRows = rowsSource.map((e) => [
//                 e.brandName || "",
//                 e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "-",
//                 e.status || "-",
//             ]);

//             const workbook = new ExcelJS.Workbook();
//             const worksheet = workbook.addWorksheet("Brands");

//             [20, 20, 20].forEach((w, i) => {
//                 worksheet.getColumn(i + 1).width = w;
//             });

//             const headerRow = worksheet.addRow(tableColumns);
//             headerRow.eachCell((cell) => {
//                 cell.fill = {
//                     type: "pattern",
//                     pattern: "solid",
//                     fgColor: { argb: "99c5ff" },
//                 };
//                 cell.border = {
//                     top: { style: "thin", color: { argb: "338bff" } },
//                     left: { style: "thin", color: { argb: "338bff" } },
//                     bottom: { style: "thin", color: { argb: "338bff" } },
//                     right: { style: "thin", color: { argb: "338bff" } },
//                 };
//             });

//             tableRows.forEach((row) => worksheet.addRow(row));

//             const buffer = await workbook.xlsx.writeBuffer();
//             saveAs(
//                 new Blob([buffer], {
//                     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//                 }),
//                 "brands.xlsx",
//             );
//             toast.success("Brands Excel file downloaded successfully!");
//         } catch (error) {
//             toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
//         }
//     };

//     const exportToPDF = async () => {
//         try {
//             const doc = new jsPDF();

//             // Add title
//             doc.text("Brand Report", 14, 15);

//             // Define table columns
//             const tableColumns = ["Brand Name", "Created Date", "Status", "Description"];

//             // Prepare table rows
//             const tableRows = brands.map((brand) => [
//                 brand.brandName || "N/A",
//                 new Date(brand.createdAt).toLocaleDateString(),
//                 brand.status || "N/A",
//                 brand.description || "N/A"
//             ]);

//             // Create table using autoTable
//             autoTable(doc, {
//                 head: [tableColumns],
//                 body: tableRows,
//                 startY: 20,
//                 styles: {
//                     fontSize: 8,
//                 },
//                 headStyles: {
//                     fillColor: [155, 155, 155],
//                     textColor: "white",
//                 },
//                 theme: "striped",
//             });

//             // Save the PDF
//             doc.save(`brands_report_${new Date().toISOString().split('T')[0]}.pdf`);
//             toast.success("PDF exported successfully!");
//         } catch (error) {
//             toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
//         }
//     };

//     const exportToExcel = () => {
//         try {
//             // Prepare data for Excel
//             const excelData = brands.map((brand, index) => ({
//                 "S.No": index + 1,
//                 "Brand Name": brand.brandName || "N/A",
//                 "Created Date": new Date(brand.createdAt).toLocaleDateString(),
//                 "Status": brand.status || "N/A",
//                 "Description": brand.description || "N/A"
//             }));

//             // Create workbook and worksheet
//             const wb = XLSX.utils.book_new();
//             const ws = XLSX.utils.json_to_sheet(excelData);

//             // Set column widths
//             const colWidths = [
//                 { wch: 8 },  // S.No
//                 { wch: 20 }, // Brand Name
//                 { wch: 15 }, // Created Date
//                 { wch: 12 }, // Status
//                 { wch: 30 }  // Description
//             ];
//             ws['!cols'] = colWidths;

//             // Add worksheet to workbook
//             XLSX.utils.book_append_sheet(wb, ws, "Brands");

//             // Save the file
//             XLSX.writeFile(wb, `brands_report_${new Date().toISOString().split('T')[0]}.xlsx`);
//             toast.success("Excel file exported successfully!");
//         } catch (error) {
//             toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
//         }
//     };

//     const pageIds = paginatedBrands.map((b) => b._id);
//     const allSelectedOnPage =
//         pageIds.length > 0 && pageIds.every((id) => selectedBrands.has(id));

//     const cleanUpModal = () => {
//         document.body.classList.remove("modal-open");
//         document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
//         setTimeout(() => {
//             document.body.style.overflow = "";
//             document.body.style.paddingRight = "";
//         }, 50);
//     };

//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             if (viewOptions === false) return;

//             const isClickInsideDropdown =
//                 modelRef.current && modelRef.current.contains(event.target);

//             const isClickOnButton =
//                 buttonRefs.current[viewOptions] &&
//                 buttonRefs.current[viewOptions].contains(event.target);

//             if (!isClickInsideDropdown && !isClickOnButton) {
//                 setViewOptions(false); // ✅ CLOSE DROPDOWN
//             }
//         };

//         document.addEventListener("mousedown", handleClickOutside);

//         return () => {
//             document.removeEventListener("mousedown", handleClickOutside);
//         };
//     }, [viewOptions]);

//     return (
//         <div className="p-4">

//             {/* header */}
//             <div
//                 style={{
//                     width: "100%",
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     padding: "0px 0px 16px 0px", // Optional: padding for container
//                     flexWrap: "wrap"
//                 }}
//             >
//                 {/* Left: Title + Icon */}
//                 <div
//                     style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 11,
//                         height: "33px",

//                     }}
//                 >
//                     <h2
//                         style={{
//                             margin: 0,
//                             color: "black",
//                             fontSize: 22,
//                             fontFamily: "Inter, sans-serif",
//                             fontWeight: 500,
//                             lineHeight: "26.4px",
//                         }}
//                     >
//                         Dispatch
//                     </h2>
//                 </div>

//                 {/* Right: Action Buttons */}
//                 <div
//                     style={{
//                         display: "flex",
//                         alignItems: "center",
//                         gap: 16,
//                         height: "33px",
//                     }}
//                 >

//                     <div className="d-flex align-items-center gap-2" style={{ cursor: "pointer" }}>
//                         <DateFilterDropdown
//                         />
//                     </div>

//                     <Link
//                         title="Add Delivery Challan"
//                         className="button-hover"
//                         to="/createdispatch"
//                         style={{
//                             borderRadius: "8px",
//                             padding: "5px 16px",
//                             border: "1px solid #1F7FFF",
//                             color: "rgb(31, 127, 255)",
//                             fontFamily: "Inter",
//                             backgroundColor: "white",
//                             fontSize: "14px",
//                             fontWeight: "500",
//                             display: "flex",
//                             alignItems: "center",
//                             gap: 8,
//                             cursor: "pointer",
//                         }}
//                     >
//                         + Create Dispatch
//                     </Link>
//                 </div>
//             </div>

//             {/* /product list */}
//             <div
//                 style={{
//                     width: "100%",
//                     minHeight: "auto",
//                     maxHeight: "calc(100vh - 160px)",
//                     padding: 16,
//                     background: "white",
//                     borderRadius: 16,
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: 16,
//                     fontFamily: "Inter, sans-serif",
//                 }}>
//                 {/* tab + search bar */}
//                 <div
//                     style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         width: "100%",
//                     }}
//                 >
//                     {/* Tabs */}
//                     <div
//                         style={{
//                             display: "flex",
//                             gap: 8,
//                             padding: 2,
//                             background: "#F3F8FB",
//                             borderRadius: 8,
//                             flexWrap: "wrap",
//                             height: "38px",
//                             width: "auto",
//                         }}
//                     >
//                         {[
//                             { label: "All", count: 0, value: "All" },
//                             { label: "Open", count: 0, value: "Open" },
//                             { label: "Close", count: 0, value: "Close" },
//                         ].map((tab) => (
//                             <div
//                                 key={tab.label}
//                                 style={{
//                                     padding: "6px 12px",
//                                     background: statusFilter === tab.value ? "white" : "transparent",
//                                     borderRadius: 8,
//                                     boxShadow: statusFilter === tab.value ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
//                                     display: "flex",
//                                     alignItems: "center",
//                                     gap: 8,
//                                     fontSize: 14,
//                                     color: "#0E101A",
//                                     cursor: "pointer",
//                                 }}
//                                 onClick={() => {
//                                     setStatusFilter(tab.value);
//                                     setCurrentPage(1);
//                                 }}
//                             >
//                                 {t(tab.label)}
//                                 <span style={{ color: "#727681" }}>{tab.count}</span>
//                             </div>
//                         ))}
//                     </div>

//                     {/* Search Bar */}
//                     <div
//                         style={{
//                             display: "flex",
//                             justifyContent: "end",
//                             gap: "24px",
//                             height: "33px",
//                             width: "50%",
//                         }}
//                     >
//                         <div
//                             style={{
//                                 width: "50%",
//                                 position: "relative",
//                                 padding: "8px 16px 8px 20px",
//                                 display: "flex",
//                                 borderRadius: 8,
//                                 alignItems: "center",
//                                 background: "#FCFCFC",
//                                 border: "1px solid #EAEAEA",
//                                 gap: "5px",
//                                 color: "rgba(19.75, 25.29, 61.30, 0.40)",
//                             }}
//                         >
//                             <IoIosSearch className="fs-4" />
//                             <input
//                                 type="search"
//                                 placeholder="Search by Ewaybill Number..."
//                                 style={{
//                                     width: "100%",
//                                     border: "none",
//                                     outline: "none",
//                                     fontSize: 14,
//                                     background: "#FCFCFC",
//                                     color: "rgba(19.75, 25.29, 61.30, 0.40)",
//                                 }}
//                             />
//                         </div>

//                         {hasPermission(user, "Delivery Challan", "export") && (
//                             <button
//                                 title="Export"
//                                 style={{
//                                     display: "flex",
//                                     justifyContent: "flex-start",
//                                     alignItems: "center",
//                                     gap: 9,
//                                     padding: "8px 16px",
//                                     background: "#FCFCFC",
//                                     borderRadius: 8,
//                                     outline: "1px solid #EAEAEA",
//                                     outlineOffset: "-1px",
//                                     border: "none",
//                                     cursor: "pointer",
//                                     fontFamily: "Inter, sans-serif",
//                                     fontSize: 14,
//                                     fontWeight: 400,
//                                     color: "#0E101A",
//                                     height: "33px",
//                                 }}
//                             >
//                                 <TbFileExport className="fs-5 text-secondary" />
//                                 Export
//                             </button>
//                         )}
//                     </div>
//                 </div>

//                 {/* table */}
//                 <div
//                     className="table-responsive"
//                     style={{
//                         overflowY: "auto",
//                         height: "calc(100vh - 310px)",
//                         maxHeight: '500px',
//                     }}>
//                     <table
//                         className="table-responsive"
//                         style={{
//                             width: "100%",
//                             borderCollapse: "collapse",
//                             overflowX: "auto",
//                         }}>
//                         <thead
//                             style={{
//                                 position: "sticky",
//                                 top: 0,
//                                 zIndex: 10,
//                                 height: "38px",
//                             }}>
//                             <tr style={{ background: "#F3F8FB" }}>
//                                 <th
//                                     style={{
//                                         textAlign: "left",
//                                         padding: "4px 16px",
//                                         color: "#727681",
//                                         fontSize: 14,
//                                         width: "auto",
//                                         fontWeight: "400",
//                                     }}>
//                                     <div
//                                         style={{
//                                             display: "flex",
//                                             alignItems: "center",
//                                             gap: 12,
//                                         }}
//                                     >
//                                         <label className="checkboxs">
//                                             <input
//                                                 type="checkbox"
//                                                 style={{ width: 18, height: 18 }}
//                                             // checked={selectAllAcrossPages || allSelectedOnPage}
//                                             // onChange={(e) => handleToggleSelectAll(e.target.checked)}
//                                             />
//                                             <span className="checkmarks" />
//                                         </label>
//                                         Sr No.
//                                     </div>
//                                 </th>
//                                 <th
//                                     style={{
//                                         textAlign: "left",
//                                         padding: "4px 16px",
//                                         color: "#727681",
//                                         fontSize: 14,
//                                         width: "auto",
//                                         fontWeight: "400",
//                                     }}>
//                                     Customer Name
//                                 </th>
//                                 <th
//                                     style={{
//                                         textAlign: "left",
//                                         padding: "4px 16px",
//                                         color: "#727681",
//                                         fontSize: 14,
//                                         width: "auto",
//                                         fontWeight: "400",
//                                     }}>
//                                     Date
//                                 </th>
//                                 <th
//                                     style={{
//                                         textAlign: "left",
//                                         padding: "4px 16px",
//                                         color: "#727681",
//                                         fontSize: 14,
//                                         width: "auto",
//                                         fontWeight: "400",
//                                     }}>
//                                     Total amount
//                                 </th>
//                                 <th
//                                     style={{
//                                         textAlign: "left",
//                                         padding: "4px 16px",
//                                         color: "#727681",
//                                         fontSize: 14,
//                                         width: "auto",
//                                         fontWeight: "400",
//                                     }}>
//                                     Vehicle No.
//                                 </th>
//                                 <th
//                                     style={{
//                                         textAlign: "left",
//                                         padding: "4px 16px",
//                                         color: "#727681",
//                                         fontSize: 14,
//                                         width: "auto",
//                                         fontWeight: "400",
//                                     }}>
//                                     E-way bill No.
//                                 </th>
//                                 <th
//                                     style={{
//                                         textAlign: "left",
//                                         padding: "4px 16px",
//                                         color: "#727681",
//                                         fontSize: 14,
//                                         width: "auto",
//                                         fontWeight: "400",
//                                     }}>
//                                 </th>
//                                 <th
//                                     style={{
//                                         textAlign: "center",
//                                         padding: "4px 16px",
//                                         color: "#727681",
//                                         fontSize: 14,
//                                         width: "auto",
//                                         fontWeight: "400",
//                                     }}>
//                                     {t("Action")}
//                                 </th>
//                             </tr>
//                         </thead>
//                         <tbody style={{ overflowY: 'auto' }}>
//                             {loading ? (
//                                 <tr>
//                                     <td colSpan="6" className="text-center py-4">
//                                         <div className="spinner-border text-primary" role="status">
//                                             <span className="visually-hidden">Loading...</span>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ) : paginatedBrands.length === 0 ? (
//                                 <tr>
//                                     <td colSpan="6" style={{ padding: 0 }}>
//                                         <div
//                                             style={{
//                                                 marginTop: "20px",
//                                                 display: "flex",
//                                                 justifyContent: "center",
//                                                 alignItems: "center",
//                                                 color: 'rgba(255, 68, 31, 1)'
//                                             }}
//                                         >
//                                             No Brand Found
//                                         </div>
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 <>
//                                     {paginatedBrands.map((brand, index) => (
//                                         <tr key={brand._id}
//                                             style={{
//                                                 borderBottom: "1px solid #EAEAEA",
//                                                 height: "46px",
//                                             }}
//                                             className="table-hover">
//                                             <td style={{
//                                                 padding: "4px 16px",
//                                                 verticalAlign: "middle",
//                                             }}>
//                                                 <div
//                                                     style={{
//                                                         display: "flex",
//                                                         alignItems: "center",
//                                                         gap: 12,
//                                                     }}
//                                                 >
//                                                     <label className="checkboxs">
//                                                         <input
//                                                             type="checkbox"
//                                                             style={{ width: 18, height: 18 }}
//                                                             checked={selectedBrands.has(brand._id)}
//                                                             onChange={() => handleCheckboxChange(brand._id)}
//                                                         />
//                                                         <span className="checkmarks" />
//                                                     </label>
//                                                     <div
//                                                         style={{
//                                                             fontSize: 14,
//                                                             color: "#0E101A",
//                                                             whiteSpace: "nowrap",
//                                                             display: "flex",
//                                                             gap: "5px",
//                                                             justifyContent: "center",
//                                                             alignItems: "center",
//                                                             cursor: "pointer",
//                                                         }}>
//                                                         DCW-001
//                                                     </div>
//                                                 </div>
//                                             </td>
//                                             <td
//                                                 style={{
//                                                     padding: "4px 16px",
//                                                     fontSize: 14,
//                                                     color: "#0E101A",
//                                                     cursor: "pointer",
//                                                 }}>
//                                                 Kasim
//                                             </td>
//                                             <td
//                                                 style={{
//                                                     padding: "4px 16px",
//                                                     fontSize: 14,
//                                                     color: "#0E101A",
//                                                     cursor: "pointer",
//                                                 }}>
//                                                 {new Date(brand.createdAt).toLocaleDateString("en-GB", {
//                                                     day: "2-digit",
//                                                     month: "short",
//                                                     year: "numeric"
//                                                 })}
//                                             </td>
//                                             <td
//                                                 style={{
//                                                     padding: "4px 16px",
//                                                     fontSize: 14,
//                                                     color: "#0E101A",
//                                                     cursor: "pointer",
//                                                 }}>
//                                                 ₹100/-
//                                             </td>
//                                             <td
//                                                 style={{
//                                                     padding: "4px 16px",
//                                                     fontSize: 14,
//                                                     color: "#0E101A",
//                                                     cursor: "pointer",
//                                                 }}>
//                                                 Aditya
//                                             </td>
//                                             <td
//                                                 style={{
//                                                     padding: "4px 16px",
//                                                     fontSize: 14,
//                                                     color: "#0E101A",
//                                                     cursor: "pointer",
//                                                 }}>
//                                                 <span style={{
//                                                     color: "#1F7FFF",
//                                                 }}>
//                                                     VHI-1234
//                                                 </span>
//                                             </td>
//                                             <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A", alignItems: "center", cursor: "pointer", display: "flex", justifyContent: "flex-end" }}>
//                                                 <div
//                                                     style={{
//                                                         position: "relative",
//                                                         display: "inline-block",
//                                                     }}
//                                                 >
//                                                     {/* Button */}
//                                                     <button
//                                                         style={{
//                                                             padding: "4px 10px",
//                                                             background: "#f3f7ff",
//                                                             color: "#3b82f6",
//                                                             border: "1px solid #dbeafe",
//                                                             borderRadius: "16px",
//                                                             cursor: "pointer",
//                                                             display: "flex",
//                                                             alignItems: "center",
//                                                             gap: "6px",
//                                                             fontSize: "14px",
//                                                         }}
//                                                     >
//                                                         Convert to
//                                                         <span
//                                                             style={{
//                                                                 transition: "0.3s",
//                                                                 display: "inline-block",
//                                                             }}
//                                                         >
//                                                             <MdOutlineKeyboardArrowUp />
//                                                         </span>
//                                                     </button>
//                                                 </div>
//                                             </td>

//                                             <td className=""
//                                                 style={{
//                                                     padding: "4px 16px",
//                                                     position: "relative",
//                                                     overflow: "visible",
//                                                 }}>
//                                                 <div
//                                                     style={{
//                                                         display: "flex",
//                                                         justifyContent: "center",
//                                                         alignItems: "center",
//                                                         position: "relative",
//                                                         cursor: "pointer",
//                                                     }}
//                                                     onClick={() =>
//                                                         setViewOptions(
//                                                             viewOptions === index ? false : index
//                                                         )
//                                                     }
//                                                     ref={(el) => (buttonRefs.current[index] = el)}
//                                                 >
//                                                     {/* 3 dots*/}
//                                                     <div
//                                                         style={{
//                                                             width: 24,
//                                                             height: 24,
//                                                             display: "flex",
//                                                             justifyContent: "space-between",
//                                                             alignItems: "center",
//                                                         }}
//                                                         onClick={(e) => {
//                                                             const rect = e.currentTarget.getBoundingClientRect();
//                                                             const dropdownHeight = 260; // your menu height
//                                                             const spaceBelow =
//                                                                 window.innerHeight - rect.bottom;
//                                                             const spaceAbove = rect.top;
//                                                             if (
//                                                                 spaceBelow < dropdownHeight &&
//                                                                 spaceAbove > dropdownHeight
//                                                             ) {
//                                                                 setOpenUpwards(true);
//                                                                 setDropdownPos({
//                                                                     x: rect.left,
//                                                                     y: rect.top - 6, // position above button
//                                                                 });
//                                                             } else {
//                                                                 setOpenUpwards(false);
//                                                                 setDropdownPos({
//                                                                     x: rect.left,
//                                                                     y: rect.bottom + 6, // position below button
//                                                                 });
//                                                             }
//                                                             setViewOptions(
//                                                                 viewOptions === index ? false : index
//                                                             );
//                                                         }}
//                                                     // ref={(el) => (buttonRefs.current[index] = el)}
//                                                     >
//                                                         <HiOutlineDotsHorizontal size={24} color="grey" />
//                                                     </div>

//                                                     {/* option model */}
//                                                     {viewOptions === index && (
//                                                         <>
//                                                             <div
//                                                                 style={{
//                                                                     position: "fixed",
//                                                                     top: openUpwards
//                                                                         ? dropdownPos.y - 110
//                                                                         : dropdownPos.y,
//                                                                     left: dropdownPos.x - 120,
//                                                                     zIndex: 999999,
//                                                                     width: 225,
//                                                                 }}
//                                                             >
//                                                                 <div
//                                                                     ref={modelRef}
//                                                                     style={{
//                                                                         background: "white",
//                                                                         padding: 8,
//                                                                         borderRadius: 12,
//                                                                         boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//                                                                         minWidth: 180,
//                                                                         height: "auto", // height must match dropdownHeight above
//                                                                         display: "flex",
//                                                                         flexDirection: "column",
//                                                                         gap: 4,
//                                                                     }}
//                                                                 >
//                                                                     <div
//                                                                         style={{
//                                                                             display: "flex",
//                                                                             justifyContent: "flex-start",
//                                                                             alignItems: "center",
//                                                                             gap: 8,
//                                                                             padding: "8px 12px",
//                                                                             borderRadius: 8,
//                                                                             border: "none",
//                                                                             cursor: "pointer",
//                                                                             fontFamily: "Inter, sans-serif",
//                                                                             fontSize: 16,
//                                                                             fontWeight: 400,
//                                                                             color: "#6C748C",
//                                                                             textDecoration: "none",
//                                                                         }}
//                                                                         className="button-action"
//                                                                         onClick={(e) => {
//                                                                             e.preventDefault();
//                                                                             setEditingBrand(brand);
//                                                                             setShowEditBrandModal(true);
//                                                                         }}
//                                                                     >
//                                                                         <img src={viewdetails} alt="" />
//                                                                         <span style={{ color: "black" }}>
//                                                                             View Details
//                                                                         </span>
//                                                                     </div>
//                                                                     <div
//                                                                         style={{
//                                                                             display: "flex",
//                                                                             justifyContent: "flex-start",
//                                                                             alignItems: "center",
//                                                                             gap: 8,
//                                                                             padding: "8px 12px",
//                                                                             borderRadius: 8,
//                                                                             border: "none",
//                                                                             cursor: "pointer",
//                                                                             fontFamily: "Inter, sans-serif",
//                                                                             fontSize: 16,
//                                                                             fontWeight: 400,
//                                                                             color: "#6C748C",
//                                                                             textDecoration: "none",
//                                                                         }}
//                                                                         className="button-action"
//                                                                         onClick={(e) => {
//                                                                             e.preventDefault();
//                                                                             setEditingBrand(brand);
//                                                                             setShowEditBrandModal(true);
//                                                                         }}
//                                                                     >
//                                                                         <img src={edit} alt="" />
//                                                                         <span style={{ color: "black" }}>
//                                                                             Edit
//                                                                         </span>
//                                                                     </div>
//                                                                     <div
//                                                                         style={{
//                                                                             display: "flex",
//                                                                             justifyContent: "flex-start",
//                                                                             alignItems: "center",
//                                                                             gap: 8,
//                                                                             padding: "8px 12px",
//                                                                             borderRadius: 8,
//                                                                             border: "none",
//                                                                             cursor: "pointer",
//                                                                             fontFamily: "Inter, sans-serif",
//                                                                             fontSize: 16,
//                                                                             fontWeight: 400,
//                                                                             color: "#6C748C",
//                                                                             textDecoration: "none",
//                                                                         }}
//                                                                         className="button-action"
//                                                                         onClick={(e) => {
//                                                                             e.preventDefault();
//                                                                             setEditingBrand(brand);
//                                                                             setShowEditBrandModal(true);
//                                                                         }}
//                                                                     >
//                                                                         <img src={deletebtn} alt="" />
//                                                                         <span style={{ color: "black" }}>
//                                                                             Delete
//                                                                         </span>
//                                                                     </div>
//                                                                     <div
//                                                                         style={{
//                                                                             display: "flex",
//                                                                             justifyContent: "flex-start",
//                                                                             alignItems: "center",
//                                                                             gap: 8,
//                                                                             padding: "8px 12px",
//                                                                             borderRadius: 8,
//                                                                             border: "none",
//                                                                             cursor: "pointer",
//                                                                             fontFamily: "Inter, sans-serif",
//                                                                             fontSize: 16,
//                                                                             fontWeight: 400,
//                                                                             color: "#6C748C",
//                                                                             textDecoration: "none",
//                                                                         }}
//                                                                         className="button-action"
//                                                                         onClick={(e) => {
//                                                                             e.preventDefault();
//                                                                             setEditingBrand(brand);
//                                                                             setShowEditBrandModal(true);
//                                                                         }}
//                                                                     >
//                                                                         <img src={duplicate} alt="" />
//                                                                         <span style={{ color: "black" }}>
//                                                                             Duplicate
//                                                                         </span>
//                                                                     </div>
//                                                                     <div
//                                                                         style={{
//                                                                             display: "flex",
//                                                                             justifyContent: "flex-start",
//                                                                             alignItems: "center",
//                                                                             gap: 8,
//                                                                             padding: "8px 12px",
//                                                                             borderRadius: 8,
//                                                                             border: "none",
//                                                                             cursor: "pointer",
//                                                                             fontFamily: "Inter, sans-serif",
//                                                                             fontSize: 16,
//                                                                             fontWeight: 400,
//                                                                             color: "#6C748C",
//                                                                             textDecoration: "none",
//                                                                         }}
//                                                                         className="button-action"
//                                                                         onClick={(e) => {
//                                                                             e.preventDefault();
//                                                                             setEditingBrand(brand);
//                                                                             setShowEditBrandModal(true);
//                                                                         }}
//                                                                     >
//                                                                         <IoPrintOutline size={28} />
//                                                                         <span style={{ color: "black" }}>
//                                                                             Print
//                                                                         </span>
//                                                                     </div>
//                                                                     <div
//                                                                         style={{
//                                                                             display: "flex",
//                                                                             justifyContent: "flex-start",
//                                                                             alignItems: "center",
//                                                                             gap: 8,
//                                                                             padding: "8px 12px",
//                                                                             borderRadius: 8,
//                                                                             border: "none",
//                                                                             cursor: "pointer",
//                                                                             fontFamily: "Inter, sans-serif",
//                                                                             fontSize: 16,
//                                                                             fontWeight: 400,
//                                                                             color: "#6C748C",
//                                                                             textDecoration: "none",
//                                                                         }}
//                                                                         className="button-action"
//                                                                         onClick={(e) => {
//                                                                             e.preventDefault();
//                                                                             setEditingBrand(brand);
//                                                                             setShowEditBrandModal(true);
//                                                                         }}
//                                                                     >
//                                                                         <img src={viewdetails} alt="" />
//                                                                         <span style={{ color: "black" }}>
//                                                                             Preview
//                                                                         </span>
//                                                                     </div>
//                                                                 </div>
//                                                             </div>
//                                                         </>
//                                                     )}
//                                                 </div>
//                                             </td>
//                                         </tr>
//                                     ))}
//                                 </>)}
//                         </tbody>
//                     </table>
//                 </div>

//                 {/* pagination */}
//                 <div className="page-redirect-btn px-2">
//                     <Pagination
//                         currentPage={currentPage}
//                         total={totalItems}
//                         itemsPerPage={itemsPerPage}
//                         onPageChange={(p) => {
//                             setCurrentPage(p);
//                         }}
//                         onItemsPerPageChange={(n) => {
//                             setItemsPerPage(n);
//                             setCurrentPage(1);
//                         }}
//                     />
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default Dispach;