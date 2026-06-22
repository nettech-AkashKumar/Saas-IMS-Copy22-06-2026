import axios from "axios";
import { TbEye, TbTrash } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { MdNavigateNext, MdOutlineFileDownload, MdOutlineKeyboardArrowUp } from "react-icons/md";
import { GrFormPrevious, GrShareOption } from "react-icons/gr";
import DeleteAlert from "../../../utils/sweetAlert/DeleteAlert";
import BASE_URL from "../../../pages/config/config";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance"
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import Pagination from "../../../components/Pagination";
import Barcode from "../../../assets/images/barcode.jpg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ConfirmDeleteModal from "../../../components/ConfirmDelete";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { hasPermission } from "../../../utils/permission/hasPermission";
import { useAuth } from "../../../components/auth/AuthContext";
import InvoiceAssignTransportModal from "../../../components/features/Transporter/InvoiceAssignTransportModal";
import Dollarimg from "../../../assets/images/dollar.png";
import Orderimg from "../../../assets/images/order.png";
import Purchaseimg from "../../../assets/images/purchaserupe.png";
import Dueamountimg from "../../../assets/images/dueamount.png";
import DateFilterDropdown from "../../../components/DateFilterDropdown";
import { format } from "date-fns";
import { IoPrint, IoPrintOutline } from "react-icons/io5";
import { InvoiceContent } from "../../../pages/Invoices/PreviewInvoice";
import CalculateInterestModal from "./CalculateInterestModal";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";


// Add menu items similar to customers
const menuItems = [
    {
        label: "Calculate Interest",
        icon: <TbEye size={18} />,
        action: "interest",
    },
    {
        label: "Edit Interest Rate",
        icon: <MdOutlineFileDownload size={18} />,
        action: "editInterest",
    },
    {
        label: "Print",
        icon: <IoPrint size={18} />,
        action: "print",
    },
];

const OverdueInvoice = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [search, setSearch] = useState("");
    const [customer, setCustomer] = useState("");
    const [invoiceId, setInvoiceId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [activeTab, setActiveTab] = useState("All");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const navigate = useNavigate();
    const [shareLoadingId, setShareLoadingId] = useState(null);
    // Add new state for convert dropdown (similar to Proforma)
    const [openConvertDropdownId, setOpenConvertDropdownId] = useState(null);
    const [convertingId, setConvertingId] = useState(null);
    const convertDropdownRef = useRef(null);
    const [convertDropdownPos, setConvertDropdownPos] = useState({ x: 0, y: 0 });
    const [convertOpenUpwards, setConvertOpenUpwards] = useState(false);


    // Add state for delete modal and menu
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [openMenuIndex, setOpenMenuIndex] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
    const [openUpwards, setOpenUpwards] = useState(false);
    const menuRef = useRef();
    const [activeRow, setActiveRow] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedInvoiceForTransport, setSelectedInvoiceForTransport] = useState(null);
    // for dispatch
    const [showDispatchModal, setShowDispatchModal] = useState(false);
    const [selectedInvoiceForDispatch, setSelectedInvoiceForDispatch] = useState(null);
    const [updatingDispatch, setUpdatingDispatch] = useState(false);
    // for show interest modal
    const [showInterestModal, setShowInterestModal] = useState(false);
    const [selectedInvoiceForInterest, setSelectedInvoiceForInterest] = useState(null);
    // Add this state for Edit Interest Modal
    const [showEditInterestModal, setShowEditInterestModal] = useState(false);
    const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState(null);
    const [editInterestRate, setEditInterestRate] = useState("");
    const [editMinAmount, setEditMinAmount] = useState("");
    const [updatingInterest, setUpdatingInterest] = useState(false);

    // Add handler for Edit Interest
    const handleEditInterest = (invoice) => {
        setSelectedInvoiceForEdit(invoice);
        setEditInterestRate(invoice.interestSettings?.interestRate || "");
        setEditMinAmount(invoice.interestSettings?.minAmount || "");
        setShowEditInterestModal(true);
    };

    // Add function to update interest settings
    const handleUpdateInterestSettings = async () => {
        if (!selectedInvoiceForEdit) return;

        setUpdatingInterest(true);
        try {
            const response = await api.post(`/api/invoices/${selectedInvoiceForEdit._id}/interest`, {
                interestRate: parseFloat(editInterestRate) || 0,
                minAmount: parseFloat(editMinAmount) || 0,
                notes: "Manual update from Overdue page"
            });

            if (response.data.success) {
                toast.success("Interest settings updated successfully!");
                fetchInvoices(); // Refresh the list
                setShowEditInterestModal(false);
                setSelectedInvoiceForEdit(null);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update interest settings");
        } finally {
            setUpdatingInterest(false);
        }
    };

    // Add this function to handle interest calculation
    const handleCalculateInterest = (invoice) => {
        setSelectedInvoiceForInterest(invoice);
        setShowInterestModal(true);
    };

    // Add this function after your other functions (around line 250)
    const handleDispatchInvoice = async (invoice) => {
        setUpdatingDispatch(true);
        try {
            const response = await api.put(`/api/invoices/${invoice._id}/dispatch`, {
                dispatched: true,
                dispatchedAt: new Date().toISOString(),
                shipmentStatus: "dispatched"
            });

            if (response.data.success) {
                toast.success("Invoice marked as dispatched successfully!");
                fetchInvoices(); // Refresh the list
                setShowDispatchModal(false);
                setSelectedInvoiceForDispatch(null);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to mark as dispatched");
        } finally {
            setUpdatingDispatch(false);
        }
    };

    const orderStatusStyles = {
        open: {
            bg: "#EAF3FF",
            color: "#1F7FFF",
        },
        closed: {
            bg: "#DDF8E5",
            color: "#1E9E52",
        },
    };

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

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (convertDropdownRef.current && !convertDropdownRef.current.contains(event.target)) {
                setOpenConvertDropdownId(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle menu actions
    const handleMenuAction = async (action, invoice) => {
        setOpenMenuIndex(null);
        switch (action) {
            case "interest":
                handleCalculateInterest(invoice);
                break;
            case "editInterest":
                handleEditInterest(invoice);
                break;
            case "print":
                try {
                    toast.info("Preparing print...");

                    // Fetch the full invoice data
                    const response = await api.get(`/api/invoices/${invoice._id}`);
                    if (response.data.success) {
                        const invoiceData = response.data.invoice;

                        // Fetch company data
                        const companyRes = await api.get(`/api/companyprofile/get`);
                        const companyData = companyRes.data.data;

                        // Fetch terms and template
                        const termsRes = await api.get("/api/notes-terms-settings");
                        const terms = termsRes.data.data;

                        const templateRes = await api.get("/api/print-templates/all");
                        const template = templateRes.data.data;

                        const banksRes = await api.get("/api/company-bank/list");
                        const banks = banksRes.data.data;

                        // Create a temporary hidden div
                        const tempDiv = document.createElement('div');
                        tempDiv.style.position = 'absolute';
                        tempDiv.style.left = '-9999px';
                        tempDiv.style.top = '-9999px';
                        document.body.appendChild(tempDiv);

                        // Dynamically import and render
                        const { createRoot } = await import('react-dom/client');
                        const { InvoiceContent } = await import('../../../pages/Invoices/PreviewInvoice');
                        const root = createRoot(tempDiv);

                        root.render(
                            <InvoiceContent
                                invoice={invoiceData}
                                customer={invoiceData.customerId}
                                companyData={companyData}
                                banks={banks}
                                terms={terms}
                                template={template}
                                taxSettings={invoiceData.taxSettings || { enableGSTBilling: true }}
                            />
                        );

                        // Wait and print
                        setTimeout(() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                                const printContent = tempDiv.cloneNode(true);

                                printWindow.document.write(`
<!DOCTYPE html>
<html>
  <head>
    <title>Invoice ${invoiceData.invoiceNo || ''}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'IBM Plex Mono', 'Inter', sans-serif; padding: 20px; background: white; }
      @media print { body { padding: 0; margin: 0; } }
    </style>
  </head>
  <body>
    ${printContent.innerHTML}
    <script>
      window.onload = () => {
        setTimeout(() => {
          window.print();
          window.onafterprint = () => window.close();
        }, 500);
      };
    <\/script>
  </body>
</html>
          `);
                                printWindow.document.close();
                            }
                            document.body.removeChild(tempDiv);
                            toast.dismiss();
                        }, 500);
                    }
                } catch (error) {
                    toast.error("Failed to load invoice for printing");
                    // console.error(error);
                }
                break;
            default:
                break;
        }
    };

    const isOverdue = (invoice) => {
        const dueAmount = invoice.dueAmount || 0;
        const dueDate = new Date(invoice.dueDate);
        const currentDate = new Date();
        // Reset time part for accurate date comparison
        currentDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);
        return dueAmount > 0 && dueDate < currentDate;
    };

    // Fetch invoices from backend (CustomerInvoiceController)
    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: search || undefined,
                customerId: customer || undefined,
            };

            if (dateRange.start && dateRange.end) {
                params.startDate = format(dateRange.start, 'yyyy-MM-dd') + 'T00:00:00.000Z';
                params.endDate = format(dateRange.end, 'yyyy-MM-dd') + 'T23:59:59.999Z';
            }

            Object.keys(params).forEach((key) => {
                if (!params[key]) delete params[key];
            });

            const res = await api.get('/api/invoices', { params });

            if (res.data?.success && Array.isArray(res.data.invoices)) {
                // Filter only overdue invoices
                const allInvoices = res.data.invoices;
                const overdueInvoices = allInvoices.filter(inv => isOverdue(inv));

                setInvoices(overdueInvoices);
                setTotal(overdueInvoices.length);
            } else {
                setInvoices([]);
                setTotal(0);
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to fetch invoices");
            setInvoices([]);
            setTotal(0);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInvoices();
    }, [page, limit, search, customer, invoiceId, dateRange.start, dateRange.end, activeTab]);

    useEffect(() => {
        setPage(1);
    }, [search, customer, startDate, endDate]);

    // Add the convert function
    const convertToSalesOrder = async (invoice) => {
        setConvertingId(invoice._id);
        try {
            // Call your existing API endpoint for converting invoice to sales order
            const response = await api.post(`/api/invoices/${invoice._id}/convert-to-sales-order`);
            if (response.data.success) {
                toast.success("Successfully converted to Sales Order!");
                // Optionally navigate to the sales order
                navigate(`/sales-orders/${response.data.salesOrder._id}`);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to convert to Sales Order");
        } finally {
            setConvertingId(null);
            setOpenConvertDropdownId(null);
        }
    };


    const handleTabClick = (tabLabel) => {
        setActiveTab(tabLabel);
        setPage(1); // Reset to first page when changing tabs
        // Clear custom date filters when using tabs
        if (tabLabel !== "All") {
            setDateRange({ start: null, end: null });
        }
    };

    // Delete invoice function
    const deleteInvoice = async (invoiceId) => {
        try {
            await api.delete(`/api/invoices/${invoiceId}`);
            toast.success("Invoice deleted successfully!");
            fetchInvoices(); // Refresh the list
        } catch (error) {
            // console.error("Failed to delete invoice:", error);
            // toast.error("Failed to delete invoice");
            toast.error(error?.response?.data?.message || "Failed to delete invoice");
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        const confirmed = await DeleteAlert({});
        if (!confirmed) return;
        try {
            await api.post(
                '/api/invoice/bulk-delete',
                {
                    ids: selectedInvoices,
                },
            );
            toast.success("Selected invoices deleted");
            setSelectedInvoices([]);
            fetchInvoices();
        } catch (error) {
            // console.log(error);
            if (error.response?.status === 401) {
                // toast.error("Unauthorized. please login again");
                toast.error(error?.response?.data?.message || "Unauthorized. Please login again");
            } else if (error.response?.status === 403) {
                toast.error(error?.response?.data?.message || "You don't have permission to delete invoices");
            } else {
                toast.error(error?.response?.data?.message || "Bulk delete failed. Please try again");
            }
        }
    };

    // Share invoice via email (matches backend: POST /api/invoice/email/:id)
    const shareInvoice = async (invoiceMongoId, customerEmail, customerPhone) => {
        try {
            setShareLoadingId(invoiceMongoId);

            // Send Email
            await api.post(
                `/api/invoice/email/${encodeURIComponent(invoiceMongoId)}`,
                { email: customerEmail || undefined },
            );

            // Send WhatsApp
            await api.post(
                `/api/invoice/whatsapp/${encodeURIComponent(invoiceMongoId)}`,
                { phone: customerPhone || undefined },
            );

            // Send SMS
            await api.post(
                `/api/invoice/sms/${invoiceMongoId}`,
                { phone: customerPhone },
            );

            toast.success("Invoice shared.");
        } catch (e) {
            // console.error(e);
            toast.error(e?.response?.data?.message || "Failed to share invoice.");
        } finally {
            setShareLoadingId(null);
        }
    };

    // Export PDF function
   const handleExcel = async () => {
  // Get selected rows
  const selectedIds = Array.isArray(selectedInvoices) 
    ? selectedInvoices 
    : Array.from(selectedInvoices);
  
  const visibleRows = selectedIds.length > 0
    ? invoices.filter((e) => selectedIds.includes(e._id))
    : invoices;

  if (visibleRows.length === 0) {
    toast.warn("No invoices selected to export");
    return;
  }

  try {
    // Define columns for Excel
    const tableColumns = [
      "S.No",
      "Invoice No",
      "Customer Name",
      "Due Date",
      "Amount",
      "Paid",
      "Amount Due",
      "Status"
    ];

    // Prepare table rows
    const tableRows = visibleRows.map((inv, index) => [
      index + 1,
      inv.invoiceNo || "-",
      inv.customerId?.name || "-",
      inv.dueDate ? format(new Date(inv.dueDate), "dd MMM yyyy") : "-",
      (inv.grandTotal || 0).toFixed(2),
      (inv.paidAmount || 0).toFixed(2),
      (inv.dueAmount || 0).toFixed(2),
      inv.status?.toUpperCase() || "DRAFT"
    ]);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Invoices");

    // Add header row with styling
    const headerRow = worksheet.addRow(tableColumns);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "99c5ff" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.font = { bold: true };
    });

    // Set column widths
    [8, 20, 30, 18, 15, 15, 15, 18].forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });

    // Add data rows
    tableRows.forEach((row) => worksheet.addRow(row));

    // Generate filename
    const filename = `invoices-${visibleRows.length}-${format(new Date(), 'yyyy-MM-dd')}`;

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${filename}.xlsx`
    );
    
    toast.success(`Exported ${visibleRows.length} invoice${visibleRows.length !== 1 ? "s" : ""}`);
    
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error(error?.message || "Failed to generate Excel file");
  }
};

    const tabs = [
        { label: "All", count: total, active: activeTab === "All" },
    ];
    const calculateTotalQty = (items) => {
        if (!items || !Array.isArray(items)) return 0;
        return items.reduce((sum, item) => sum + (item.qty || 0), 0);
    }
    // Handle date range change
    const handleDateChange = (dates) => {
        setDateRange({
            start: dates.startDate,
            end: dates.endDate
        });
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return format(new Date(dateString), "dd/MM/yy");
    };

    // Calculate arriving date (7 days after order date)
    const getArrivingDate = (orderDate) => {
        if (!orderDate) return "-";
        const date = new Date(orderDate);
        date.setDate(date.getDate() + 7);
        return format(date, "dd/MM/yy");
    };


    return (
        <div className="p-4">
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
                {/* Left: Title + Icon */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 11,
                        height: '33px'
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            color: "black",
                            fontSize: 22,
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 500,
                            height: '33px'
                        }}
                    >
                        Overdue Invoice
                    </h2>
                </div>
                <div className="d-flex align-items-center gap-3" style={{ cursor: "pointer" }}>
                    {/* <DateFilterDropdown onChange={handleDateChange} /> */}
                    <DateFilterDropdown
                        onChange={handleDateChange}
                        selectedDateRange={dateRange}
                        setSelectedDateRange={setDateRange}
                    />
                    {/* {hasPermission(user, "Invoices", "create") && (
                        <Link to="/createinvoice">
                            <button
                                title="Create Quotation"
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
                            >
                                + Create Overdue
                            </button>
                        </Link>
                    )} */}
                </div>
            </div>
            {/* main body */}
            <div style={{
                width: '100%',
                minHeight: 'auto',
                maxHeight: 'calc(100vh - 160px)',
                padding: 16,
                background: 'white',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                fontFamily: 'Inter, sans-serif',
            }}>
                {/* tabs + Search Bar & import */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: '100%',
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
                            maxWidth: '50%',
                            width: "fit-content",
                            height: "33px",
                        }}
                    >
                        {tabs.map((tab) => (
                            <div
                                key={tab.label}
                                onClick={() => handleTabClick(tab.label)}
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
                                    cursor: "pointer"
                                }}
                            >
                                {tab.label}
                                <span style={{ color: "#727681" }}>{tab.count}</span>
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            display: "inline-flex",
                            justifyContent: "end",
                            alignItems: "center",
                            gap: 16,
                            width: '50%',
                            height: "33px",
                        }}
                    >
                        {/* Bulk delete button */}
                        {/* {selectedInvoices.length > 0 && (
              <div
                className="button-hover"
                style={{
                  borderRadius: "8px",
                  padding: "5px 16px",
                  border: "1px solid #dc3545",
                  color: "#dc3545",
                  fontFamily: "Inter",
                  backgroundColor: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
                onClick={handleBulkDelete}
              >
                <TbTrash /> Delete Selected ({selectedInvoices.length})
              </div>
            )} */}

                        {/* search bar */}
                        <div
                            style={{
                                width: "50%",
                                position: "relative",
                                padding: "5px 0px 5px 10px",
                                display: "flex",
                                borderRadius: 8,
                                alignItems: "center",
                                background: "#FCFCFC",
                                border: "1px solid #EAEAEA",
                                gap: "5px",
                                color: "rgba(19.75, 25.29, 61.30, 0.40)",
                                height: "33px",
                            }}
                        >
                            <IoIosSearch style={{ fontSize: '25px' }} />
                            <input
                                type="search"
                                placeholder="Search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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

                        {/* Export Button */}
                        <button
                            title="Export"
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
                                cursor: invoices.length > 0 ? "pointer" : "not-allowed",
                                fontFamily: "Inter, sans-serif",
                                fontSize: 14,
                                fontWeight: 400,
                                color: "#0E101A",
                                height: "33px",
                                opacity: invoices.length > 0 ? 1 : 0.5,
                            }}
                            disabled={invoices.length === 0}
                        >
                            <TbFileExport className="fs-5 text-secondary" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div
                    // className="table-responsive"
                    style={{
                        overflowY: "auto",
                        height: "calc(100vh - 310px)",
                        maxHeight: '500px',
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
                            <tr style={{ background: "#F3F8FB", }}>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    <div
                                        style={{ display: "flex", alignItems: "center", gap: 12 }}
                                    >
                                        <input
                                            type="checkbox"
                                            id="select-all"
                                            style={{ width: 18, height: 18 }}
                                            checked={
                                                (() => {
                                                    const allIds = invoices.map((i) => i._id).filter(Boolean);
                                                    const uniqueSelected = new Set(selectedInvoices);
                                                    return allIds.length > 0 && uniqueSelected.size === allIds.length;
                                                })()
                                            }
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedInvoices(
                                                        invoices.map((i) => i._id).filter(Boolean)
                                                    );
                                                } else {
                                                    setSelectedInvoices([]);
                                                }
                                            }}
                                        />
                                        Invoice No
                                    </div>
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    Customer Name
                                </th>
                                {/* <th style={{
                                    textAlign: "left",
                                    padding: "4px 16px",
                                    color: "#727681",
                                    fontSize: 14,
                                    width: 160,
                                    fontWeight: '400'
                                }}>
                                    Quantity
                                </th> */}
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    Total Amount
                                </th>
                                {/* <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
                    fontWeight: '400'
                  }}
                >
                  Paid
                </th> */}
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
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
                                        fontWeight: '400'
                                    }}
                                >
                                    Due Date
                                </th>

                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    Overdue days
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    Interest Rate
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    Min. Amount
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    Interest Amount
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    (Total + interest)amt
                                </th>
                                <th
                                    style={{
                                        textAlign: "center",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        fontWeight: '400'
                                    }}
                                >
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-5">
                                        Loading invoices...
                                    </td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="text-center py-5 text-muted">
                                        No invoices found
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv, idx) => (
                                    <tr key={inv._id}
                                        style={{ borderBottom: "1px solid #EAEAEA", cursor: 'pointer' }}
                                        onClick={() => navigate(`/sales-invoice/${inv._id}`, {
                                            state: { from: "/invoice" }
                                        })}
                                        className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                                    >
                                        {/* invoice no */}
                                        <td style={{ padding: "8px 16px", verticalAlign: "middle", height: '46px', }}>
                                            <div
                                                style={{ display: "flex", alignItems: "center", gap: 12 }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    style={{ width: 18, height: 18, }}
                                                    checked={selectedInvoices.includes(inv._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedInvoices((prev) => {
                                                                const next = new Set(prev);
                                                                next.add(inv._id);
                                                                return Array.from(next);
                                                            });
                                                        } else {
                                                            setSelectedInvoices((prev) =>
                                                                prev.filter((id) => id !== inv._id)
                                                            );
                                                        }
                                                    }}
                                                />
                                                <div>
                                                    <div
                                                        style={{
                                                            fontSize: 14,
                                                            color: "#82b8ff",
                                                            whiteSpace: "nowrap",
                                                            display: "flex",
                                                            gap: "5px",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        {inv.invoiceNo}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* customer details */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#0E101A",
                                            }}
                                        >
                                            <span>
                                                {inv.customerId?.name ||
                                                    inv.customerId?.email ||
                                                    inv.customerId?._id ||
                                                    "-"}
                                            </span>
                                        </td>
                                        {/* <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A", }}>{calculateTotalQty(inv.items)}</td> */}

                                        {/* amount */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#0E101A",
                                            }}
                                        >
                                            ₹{inv.grandTotal?.toFixed(2) || "0.00"}
                                        </td>

                                        {/* paid */}
                                        {/* due amount */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: (inv.dueAmount || 0) > 0 ? "#dc3545" : "#0E101A",
                                            }}
                                        >
                                            ₹{Number(inv.dueAmount ?? 0).toFixed(2)}
                                        </td>
                                        {/* due date */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: (inv.dueDate || 0) > 0 ? "#dc3545" : "#0E101A",
                                            }}
                                        >
                                            {new Date(inv.dueDate).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric"
                                            })}
                                        </td>



                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#dc3545",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {Math.ceil((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))} days
                                        </td>
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: (inv.dueAmount || 0) > 0 ? "#dc3545" : "#0E101A",
                                            }}
                                        >
                                            {inv.interestSettings?.interestRate || 0}%
                                        </td>
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: (inv.dueAmount || 0) > 0 ? "#dc3545" : "#0E101A",
                                            }}
                                        >
                                            ₹ {inv.interestSettings?.minAmount || 0}
                                        </td>
                                        {/* <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: (inv.dueAmount || 0) > 0 ? "#0E101A" : "#0E101A",
                                            }}
                                        >
                                            ₹{(((inv.interestSettings?.minAmount || 0) *
                                            ((inv.interestSettings?.interestRate || 0)/100) *
                                          (Math.ceil((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))) ) / 365).toFixed(2) || "0.00"}
                                        </td> */}

                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#0E101A",
                                            }}
                                        >
                                            {(() => {
                                                const dueAmount = inv.dueAmount || 0;
                                                const interestRate = inv.interestSettings?.interestRate || 0;
                                                const minAmount = inv.interestSettings?.minAmount || 0;
                                                const daysOverdue = Math.ceil((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));

                                                // Calculate interest only if due amount >= min amount
                                                if (dueAmount > 0 && interestRate > 0 && minAmount > 0 && dueAmount >= minAmount) {
                                                    const interestAmount = (dueAmount * interestRate * daysOverdue) / (100 * 365);
                                                    return `₹${interestAmount.toFixed(2)}`;
                                                } else if (inv.interestSettings?.interestAmount && inv.interestSettings?.interestAmount > 0) {
                                                    return `₹${inv.interestSettings.interestAmount.toFixed(2)}`;
                                                } else {
                                                    return "₹0.00";
                                                }
                                            })()}
                                        </td>
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#0E101A",
                                            }}
                                        >
                                            {(() => {
                                                const grandTotal = inv.grandTotal || 0;
                                                const dueAmount = inv.dueAmount || 0;
                                                const interestRate = inv.interestSettings?.interestRate || 0;
                                                const minAmount = inv.interestSettings?.minAmount || 0;
                                                const daysOverdue = Math.ceil((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
                                                let interestAmount = 0;

                                                if (dueAmount > 0 && interestRate > 0 && minAmount > 0 && dueAmount >= minAmount) {
                                                    interestAmount = (dueAmount * interestRate * daysOverdue) / (100 * 365);
                                                } else if (inv.interestSettings?.interestAmount && inv.interestSettings?.interestAmount > 0) {
                                                    interestAmount = inv.interestSettings.interestAmount;
                                                }

                                                const totalWithInterest = grandTotal + interestAmount;
                                                return (
                                                    <div>
                                                        <div>₹{grandTotal.toFixed(2)}</div>
                                                        {interestAmount > 0 && (
                                                            <div style={{ fontSize: "12px", color: "#FF9800" }}>
                                                                + ₹{interestAmount.toFixed(2)} interest
                                                            </div>
                                                        )}
                                                        {interestAmount > 0 && (
                                                            <div style={{ fontSize: "13px", fontWeight: "bold", color: "#4CAF50" }}>
                                                                = ₹{totalWithInterest.toFixed(2)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td
                                            style={{
                                                padding: "4px 16px",
                                                position: "relative",
                                                overflow: "visible",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* three dot button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuIndex(
                                                        openMenuIndex === idx ? null : idx
                                                    );
                                                    const rect = e.currentTarget.getBoundingClientRect();

                                                    const dropdownHeight = 180;
                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                    const spaceAbove = rect.top;

                                                    // decide direction
                                                    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
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
                                            {openMenuIndex === idx && (
                                                <div
                                                    style={{
                                                        position: "fixed",
                                                        top: openUpwards
                                                            ? dropdownPos.y - 180
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
                                                            height: "auto",
                                                            display: "flex",
                                                            flexDirection: "column",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        {menuItems.map((item) => (
                                                            <div
                                                                key={item.action}
                                                                onClick={() => handleMenuAction(item.action, inv)}
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
                                                                    e.currentTarget.style.backgroundColor = "#e3f2fd";
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.backgroundColor = "transparent";
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
                <div className="px-2">
                    <Pagination
                        currentPage={page}
                        total={total}
                        itemsPerPage={limit}
                        onPageChange={(p) => setPage(p)}
                        onItemsPerPageChange={(n) => {
                            setLimit(n);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onCancel={() => {
                    setShowDeleteModal(false);
                    setSelectedInvoice(null);
                }}
                onConfirm={async () => {
                    try {
                        await deleteInvoice(selectedInvoice._id);
                        toast.success("Invoice deleted successfully!");
                        fetchInvoices();
                    } catch (error) {
                        toast.error("Failed to delete invoice");
                    } finally {
                        setShowDeleteModal(false);
                        setSelectedInvoice(null);
                    }
                }}
                title="Delete Invoice"
                message={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceNo || ''}? This action cannot be undone.`}
            />
            {/* Dispatch Confirmation Modal */}
            {showDispatchModal && selectedInvoiceForDispatch && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 999999,
                    }}
                    onClick={() => setShowDispatchModal(false)}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            width: "400px",
                            maxWidth: "90%",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: "16px", fontSize: "20px" }}>Confirm Dispatch</h3>
                        <p style={{ marginBottom: "24px", color: "#666" }}>
                            Are you sure you want to mark invoice <strong>{selectedInvoiceForDispatch.invoiceNo}</strong> as dispatched?
                            <br />
                            This will change the status from <strong>Open</strong> to <strong>Closed</strong>.
                        </p>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button
                                onClick={() => setShowDispatchModal(false)}
                                style={{
                                    padding: "8px 16px",
                                    background: "#f5f5f5",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDispatchInvoice(selectedInvoiceForDispatch)}
                                disabled={updatingDispatch}
                                style={{
                                    padding: "8px 16px",
                                    background: "#1F7FFF",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: updatingDispatch ? "not-allowed" : "pointer",
                                    opacity: updatingDispatch ? 0.7 : 1,
                                }}
                            >
                                {updatingDispatch ? "Processing..." : "Confirm Dispatch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showInterestModal && selectedInvoiceForInterest && (
                <CalculateInterestModal
                    show={showInterestModal}
                    onClose={() => {
                        setShowInterestModal(false);
                        setSelectedInvoiceForInterest(null);
                    }}
                    invoice={selectedInvoiceForInterest}
                    onSuccess={(data) => {
                        // Optionally refresh the list or update the invoice
                        fetchInvoices();
                    }}
                />
            )}
            {/* Edit Interest Rate Modal */}
            {showEditInterestModal && selectedInvoiceForEdit && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 999999,
                    }}
                    onClick={() => setShowEditInterestModal(false)}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "24px",
                            width: "450px",
                            maxWidth: "90%",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: 600 }}>
                            Edit Interest Settings
                        </h3>
                        <p style={{ marginBottom: "20px", color: "#666", fontSize: "14px" }}>
                            Invoice: <strong>{selectedInvoiceForEdit.invoiceNo}</strong>
                            <br />
                            Due Amount: <strong style={{ color: "#dc3545" }}>₹{selectedInvoiceForEdit.dueAmount?.toFixed(2) || "0.00"}</strong>
                            <br />
                            Overdue Days: <strong>{Math.ceil((new Date() - new Date(selectedInvoiceForEdit.dueDate)) / (1000 * 60 * 60 * 24))} days</strong>
                        </p>

                        <div style={{ marginBottom: "16px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                                Interest Rate (% per annum)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={editInterestRate}
                                onChange={(e) => setEditInterestRate(e.target.value)}
                                placeholder="e.g., 18"
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                            />
                            <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                Annual interest rate (1-99%)
                            </p>
                        </div>

                        <div style={{ marginBottom: "24px" }}>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                                Minimum Amount for Interest (₹)
                            </label>
                            <input
                                type="number"
                                step="100"
                                value={editMinAmount}
                                onChange={(e) => setEditMinAmount(e.target.value)}
                                placeholder="e.g., 1000"
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    outline: "none",
                                }}
                            />
                            <p style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                                Interest applies only when due amount exceeds this value
                            </p>
                        </div>

                        {/* Preview calculated interest */}
                        {editInterestRate && editMinAmount && selectedInvoiceForEdit.dueAmount >= parseFloat(editMinAmount) && (
                            <div style={{
                                marginBottom: "20px",
                                padding: "12px",
                                background: "#E8F4FF",
                                borderRadius: "8px",
                            }}>
                                <p style={{ fontSize: "13px", margin: 0 }}>
                                    <strong>Preview:</strong><br />
                                    Interest = (₹{selectedInvoiceForEdit.dueAmount?.toFixed(2)} × {editInterestRate}% × {Math.ceil((new Date() - new Date(selectedInvoiceForEdit.dueDate)) / (1000 * 60 * 60 * 24))} days) / (100 × 365)<br />
                                    = <strong style={{ color: "#1F7FFF" }}>
                                        ₹{((selectedInvoiceForEdit.dueAmount || 0) * (parseFloat(editInterestRate) || 0) * Math.ceil((new Date() - new Date(selectedInvoiceForEdit.dueDate)) / (1000 * 60 * 60 * 24))) / (100 * 365).toFixed(2)}
                                    </strong>
                                </p>
                            </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button
                                onClick={() => setShowEditInterestModal(false)}
                                style={{
                                    padding: "10px 20px",
                                    background: "#f5f5f5",
                                    border: "1px solid #ddd",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdateInterestSettings}
                                disabled={updatingInterest}
                                style={{
                                    padding: "10px 24px",
                                    background: "#1F7FFF",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: updatingInterest ? "not-allowed" : "pointer",
                                    opacity: updatingInterest ? 0.7 : 1,
                                    fontSize: "14px",
                                    fontWeight: 500,
                                }}
                            >
                                {updatingInterest ? "Saving..." : "Save Settings"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverdueInvoice;
