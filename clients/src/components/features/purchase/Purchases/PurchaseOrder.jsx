import React, { useEffect, useState, useRef } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import "react-datepicker/dist/react-datepicker.css";
import { Link, useNavigate } from "react-router-dom";
import Dollarimg from "../../../../assets/images/dollar.png";
import Orderimg from "../../../../assets/images/order.png";
import Purchaseimg from "../../../../assets/images/purchaserupe.png";
import Dueamountimg from "../../../../assets/images/dueamount.png";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import PurchaseImg from "../../../../assets/images/purchase.png";
import { MdOutlineAddShoppingCart } from 'react-icons/md';
import ConfirmDeleteModal from "../../../../components/ConfirmDelete";
import Convertpurchasepopupmodal from "./Convertpurchasepopupmodal";
import DatePicker from "../../../DateFilterDropdown";
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import Pagination from "../../../../components/Pagination";
import { TbFileExport } from "react-icons/tb";
import CreditNoteImg from "../../../../assets/images/create-creditnote.png";
import DeleteICONImg from "../../../../assets/images/delete.png";
import ViewDetailsImg from "../../../../assets/images/view-details.png";
import EditICONImg from "../../../../assets/images/edit.png";
import DuplicateICONImg from "../../../../assets/images/duplicate.png";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import EmptyPurchase from "./EmptyPurchase"
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { hasPermission } from "../../../../utils/permission/hasPermission";
import { useAuth } from "../../../auth/AuthContext";
import { FaMoneyBillWave } from "react-icons/fa";
import PurchasePaymentModal from "./PurchasePaymentModal";
import { IoPrintOutline } from "react-icons/io5";
import { PurchaseOrderContent } from "../../../../pages/Invoices/PreviewPurchase";
import * as XLSX from "xlsx";

// const statsTop = [
//     {
//         title: "Total Purchase Value",
//         value: "0",
//         currency: "INR",
//         image: Dollarimg,
//         link: "",
//     },
//     {
//         title: "Total Order",
//         value: "0",
//         currency: "",
//         image: Orderimg,
//         link: "",
//     },
//     {
//         title: "Average Purchasing",
//         value: "0",
//         currency: "INR",
//         image: Purchaseimg,
//         link: "",
//     },
//     {
//         title: "Due Payments",
//         value: "0",
//         currency: "INR",
//         image: Dueamountimg,
//         link: "",
//     },
// ];

const tabsData = [
    { label: "All Orders", count: 0, value: "all" },
    { label: "Pending", count: 0, value: "pending" },
    { label: "Approved", count: 0, value: "approved" },
    { label: "Rejected", count: 0, value: "rejected" },
];


// Update your statusStyles object:
// Update statusStyles to match backend status values
const statusStyles = {
    pending: {
        color: "#7E7000",
        bg: "#F7F7C7",
        dot: true,
        label: "Pending",
    },
    approved: {
        color: "#059669",
        dot: false,
        icon: <FaCheck size={12} />,
        label: "Approved",
        bg: "#D1FAE5",
    },
    cancelled: {
        color: "#DC2626",
        dot: false,
        icon: <RxCross2 size={12} />,
        label: "Cancelled",
        bg: "#FEE2E2",
    },
    partial_received: {
        color: "#D97706",
        bg: "#FEF3C7",
        dot: true,
        label: "Partial Received",
    },
    default: {
        color: "#6B7280",
        bg: "#F3F4F6",
        dot: true,
        label: "Unknown",
    },
};
const menuItems = [
    {
        label: "View Details",
        icon: (
            <img src={ViewDetailsImg} alt="view" style={{ width: 18, height: 18 }} />
        ),
        action: "view",
        permission: "read"
    },
    {
        label: "Edit",
        icon: <img src={EditICONImg} alt="edit" style={{ width: 18, height: 18 }} />,
        action: "edit",
        permission: "update"
    },
    {
        label: "Print",  // ADD THIS
        icon: <IoPrintOutline size={18} />,
        action: "print",
        permission: "read"
    },
    {
        label: "Cancel",
        icon: (
            <img src={ViewDetailsImg} alt="view" style={{ width: 18, height: 18 }} />
        ),
        action: "view",
        permission: "read"
    },
    {
        label: "Convert to",
        icon: <MdAddShoppingCart size={18} />,
        action: "convert",
        permission: "create",
        children: [
            {
                label: "GRN Verification",
                action: "grn-verification",
            },
            {
                label: "Purchase",
                action: "purchase",
            },
        ],
    },
];

const getMenuItems = (order) => {
    const items = [
        {
            label: "View Details",
            icon: <img src={ViewDetailsImg} alt="view" style={{ width: 18, height: 18 }} />,
            action: "view",
            permission: "read"
        },
        // {
        //   label: "Edit",
        //   icon: <img src={EditICONImg} alt="edit" style={{ width: 18, height: 18 }} />,
        //   action: "edit",
        //   permission: "update"
        // },
        {
            label: "Print",
            icon: <IoPrintOutline size={18} />,
            action: "print",
            permission: "read"
        }
    ];
    if (order.status === "pending") {
        items.push({
            label: "Edit",
            icon: <img src={EditICONImg} alt="edit" style={{ width: 18, height: 18 }} />,
            action: "edit",
            permission: "update"
        });
    }

    // Add Cancel option only for pending orders
    if (order.status === "pending") {
        items.push({
            label: "Cancel",
            icon: <RxCross2 size={18} />,
            action: "cancel",
            permission: "update"
        });
    }

    // Add Convert To option only for pending orders
    if (order.status === "pending") {
        items.push({
            label: "Convert To",
            icon: <MdAddShoppingCart size={18} />,
            action: "convert",
            permission: "create",
            children: [
                {
                    label: "GRN Verification",
                    action: "grn-verification",
                },
                {
                    label: "Purchase",
                    action: "purchase",
                },
            ],
        });
    }
    return items;
}
export default function PurchaseOrder() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("All Orders");
    const [search, setSearch] = useState("");
    const [openMenu, setOpenMenu] = useState(null);
    const [modalContent, setModalContent] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const menuRef = useRef(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [selectedDateRange, setSelectedDateRange] = useState({
        startDate: null,
        endDate: null,
    });
    const [showModal, setShowModal] = useState(false);
    const [initialTabs, setInitialTabs] = useState(tabsData);

    // State for purchase orders
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [stats, setStats] = useState(statsTop);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [selectedOrdersForExport, setSelectedOrdersForExport] = useState([]);
    const [selectAllOrdersForExport, setSelectAllOrdersForExport] = useState(false);
    // const [initialStats, setInitialStats] = useState(statsTop);
    const [openSubMenu, setOpenSubMenu] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);

    const [selectedRowIds, setSelectedRowIds] = useState(new Set());
    const [allVisibleSelected, setAllVisibleSelected] = useState(false);

    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
    const [openUpwards, setOpenUpwards] = useState(false);

    const [activeRow, setActiveRow] = useState(null);
    const [openRow, setOpenRow] = useState(null);

    const [selectAllPages, setSelectAllPages] = useState(false);
    const [allOrdersCount, setAllOrdersCount] = useState(0);
    // Add with other state declarations
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

    const toggleRow = (idx) => {
        const newOpen = openRow === idx ? null : idx;
        setOpenRow(newOpen);
        if (newOpen === null && activeRow === idx) {
            setActiveRow(null);
        } else if (newOpen !== null) {
            setActiveRow(idx);
        }
    };

    // ADD THIS: Track if system has ANY orders
    const [hasAnyOrdersInSystem, setHasAnyOrdersInSystem] = useState(null);

    const fetchPurchaseOrders = async (page = 1, status = "", limitOverride) => {
        try {
            setLoading(true);
            const currentLimit = limitOverride !== undefined ? limitOverride : itemsPerPage;

            const params = {
                page,
                limit: currentLimit,
                ...(status && status !== "all" && { status }),
                ...(search && { search }),
            };

            if (selectedDateRange.startDate) {
                params.startDate = format(selectedDateRange.startDate, "yyyy-MM-dd");
            }
            if (selectedDateRange.endDate) {
                params.endDate = format(selectedDateRange.endDate, "yyyy-MM-dd");
            }

            // Make sure this URL matches your backend route
            const response = await api.get("/api/purchase-orders", { params });

            if (response.data.success) {
                // Check if the response uses 'purchaseOrders' or 'purchases'
                const orders = response.data.purchaseOrders || response.data.purchases || [];
                setPurchaseOrders(orders);
                setTotalCount(response.data.total || 0);
                setTotalPages(response.data.pagination?.totalPages || 1);

                if (response.data.pagination?.page) {
                    setCurrentPage(response.data.pagination.page);
                }

                if (response.data.pagination?.limit && limitOverride === undefined) {
                    setItemsPerPage(response.data.pagination.limit);
                }

                await fetchTabCounts();
                //   await fetchStats();
            } else {
                toast.error(response.data.error || "Failed to load purchase orders");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load purchase orders");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedInvoice) return;

        try {
            const response = await api.put(`/api/purchase-orders/${selectedInvoice._id}/cancel`);
            if (response.data.success) {
                toast.success("Purchase order cancelled successfully");
                setShowCancelModal(false);
                setSelectedInvoice(null);
                fetchPurchaseOrders(currentPage);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to cancel purchase order");
        }
    };


    // Fetch fresh tab counts from API
    // Fetch fresh tab counts from API
    const fetchTabCounts = async () => {
        try {
            const response = await api.get("/api/purchase-orders/status-counts");

            if (response.data && response.data.success) {
                const counts = response.data.counts || {};

                setInitialTabs([
                    { ...tabsData[0], count: counts.all || 0 },
                    { ...tabsData[1], count: counts.pending || 0 },
                    { ...tabsData[2], count: counts.approved || 0 },
                    { ...tabsData[3], count: counts.cancelled || 0 },
                ]);
            } else {
                // Fallback: calculate from current orders
                calculateCountsFromOrders();
            }
        } catch (error) {
            console.error("Failed to fetch tab counts:", error);
            // Fallback: calculate from current orders
            calculateCountsFromOrders();
        }
    };

    // Add this helper function
    const calculateCountsFromOrders = () => {
        const counts = {
            all: purchaseOrders.length,
            pending: purchaseOrders.filter(o => o.status === "pending").length,
            approved: purchaseOrders.filter(o => o.status === "approved").length,
            cancelled: purchaseOrders.filter(o => o.status === "cancelled").length,
        };

        setInitialTabs([
            { ...tabsData[0], count: counts.all },
            { ...tabsData[1], count: counts.pending },
            { ...tabsData[2], count: counts.approved },
            { ...tabsData[3], count: counts.cancelled },
        ]);
    };

    // Fetch fresh stats from API
    // const fetchStats = async () => {
    //     try {
    //         const response = await api.get("/api/purchase-orders/stats");
    //         if (response.data.success) {
    //             const stats = response.data.stats;
    //             setInitialStats([
    //                 {
    //                     ...statsTop[0],
    //                     value: (stats.totalAmount || 0).toLocaleString("en-IN"),
    //                 },
    //                 {
    //                     ...statsTop[1],
    //                     value: (stats.totalInvoices || 0).toString(),
    //                 },
    //                 {
    //                     ...statsTop[2],
    //                     value: Math.round(stats.avgPurchaseValue || 0).toLocaleString("en-IN"),
    //                 },
    //                 {
    //                     ...statsTop[3],
    //                     value: (stats.totalDue || 0).toLocaleString("en-IN"),
    //                 },
    //             ]);
    //         }
    //     } catch (error) {
    //         console.warn("Failed to fetch stats:", error);
    //     }
    // };

    // Update tab counts based on data
    const updateTabCounts = (orders) => {
        const newTabCounts = [
            { ...tabsData[0], count: orders.length },
            {
                ...tabsData[1],
                count: orders.filter((o) => o.status === "pending").length,
            },
            {
                ...tabsData[2],
                count: orders.filter((o) => o.status === "received").length,
            },
            {
                ...tabsData[3],
                count: orders.filter((o) => o.status === "cancelled").length,
            },
        ];
        // update both state
        // setTabs(newTabCounts);
        setInitialTabs(newTabCounts);
    };

    // Update statistics cards
    // const updateStats = (orders) => {
    //     const totalPurchaseValue = orders.reduce(
    //         (sum, order) => sum + (order.grandTotal || 0),
    //         0
    //     );
    //     const totalOrders = orders.length;
    //     const averagePurchasing =
    //         totalOrders > 0 ? totalPurchaseValue / totalOrders : 0;
    //     const duePayments = orders.reduce(
    //         (sum, order) => sum + (order.dueAmount || 0),
    //         0
    //     );
    //     setInitialStats([
    //         {
    //             ...statsTop[0],
    //             value: totalPurchaseValue.toLocaleString("en-IN"),
    //         },
    //         {
    //             ...statsTop[1],
    //             value: totalOrders.toString(),
    //         },
    //         {
    //             ...statsTop[2],
    //             value: Math.round(averagePurchasing).toLocaleString("en-IN"),
    //         },
    //         {
    //             ...statsTop[3],
    //             value: duePayments.toLocaleString("en-IN"),
    //         },
    //     ]);
    // }

    // Handle menu actions
    const handleMenuAction = (purchase, action) => {
        setSelectedInvoice(purchase);

        switch (action) {
            case "edit":
                navigate(`/create-purchase-order`, {
                    state: {
                        editPurchaseOrder: purchase,
                        mode: "edit"
                    }
                });
                break;
            case "view":
                navigate(`/create-purchase-order`, {
                    state: {
                        editPurchaseOrder: purchase,
                        mode: "view"
                    }
                });
                break;
            case "print":  // ADD THIS CASE
                handlePrintPurchaseOrder(purchase);
                break;
            case "delete":
                setShowDeleteModal(true);
                break;
            case "duplicate":
                handleDuplicateInvoice(purchase);
                break;
            // case "payment":  // NEW CASE
            //     setSelectedOrderForPayment(purchase);
            //     setShowPaymentModal(true);
            //     break;
            // case "debit_note":
            //     navigate(`/create-supplier-debitnote/${purchase._id}`, {
            //         state: {
            //             type: "purchase",
            //             invoice: purchase,
            //             from: "/purchase-list"
            //         }
            //     });
            //     break;
            case "grn-verification":
                navigate("/convertgrnverificationform", {
                    state: {
                        purchaseOrder: purchase,
                        mode: "convert"
                    }
                });
                break;
            case "purchase":
                navigate(`/create-purchase`, {
                    state: {
                        editPurchaseOrder: purchase,
                        mode: "convert-from-po"
                    }
                });
                break;
            case "cancel":
                // Show cancel confirmation modal
                setSelectedInvoice(purchase);
                setShowCancelModal(true);
                break;
            default:
                break;
        }
        setOpenMenu(null);
    };

    // Handle duplicate invoice
    const handleDuplicateInvoice = async (purchase) => {
        try {
            const response = await api.post(
                `/api/purchase-orders/${purchase._id}/duplicate`
            );
            if (response.data.success) {
                toast.success("Purchase order duplicated successfully");
                fetchPurchaseOrders();
            }
        } catch (error) {
            toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to duplicate purchase order");

        }
    };

    // Handle delete invoice
    const handleDeleteInvoice = async () => {
        if (!selectedInvoice) return;

        try {
            const response = await api.delete(
                `/api/purchase-orders/${selectedInvoice._id}`
            );
            if (response.data.success) {
                toast.success("Purchase order deleted successfully");
                // ✅ Just remove from local state and refetch
                setPurchaseOrders((prev) => prev.filter((order) => order._id !== selectedInvoice._id))
                fetchPurchaseOrders(currentPage);
                setShowDeleteModal(false);
                setSelectedInvoice(null);
            }
        } catch (error) {
            toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to delete purchase order");

        }
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab.label);
        let status = "";
        switch (tab.label) {
            case "Pending":
                status = "pending";    // ✅ Changed from "pending"
                break;
            case "Approved":
                status = "approved";   // ✅ Changed from "received"
                break;
            case "Rejected":
                status = "cancelled";  // ✅ Correct
                break;
            default:
                status = "";
        }
        fetchPurchaseOrders(1, status);
    };

    // Handle search
    const handleSearch = (e) => {
        setSearch(e.target.value);
        // Add debounce here if needed
        fetchPurchaseOrders(1);
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
        let status = "";
        switch (activeTab) {
            case "Pending":
                status = "pending";    // ✅ Changed from "pending"
                break;
            case "Approved":
                status = "approved";   // ✅ Changed from "received"
                break;
            case "Rejected":
                status = "cancelled";  // ✅ Correct
                break;
            default:
                status = "";
        }
        fetchPurchaseOrders(page, status, itemsPerPage);
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

    // Initial fetch
    useEffect(() => {
        fetchPurchaseOrders(1, "", itemsPerPage);
    }, []);

    // Handle date range change
    useEffect(() => {
        fetchPurchaseOrders(1, "", itemsPerPage);
    }, [selectedDateRange]);

    // Handle search with debounce
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            if (search !== undefined) {
                fetchPurchaseOrders(1, "", itemsPerPage);
            }
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [search])

    useEffect(() => {
        function handleClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const cardStyle = {
        borderRadius: 6,
        boxShadow: "rgba(0, 0, 0, 0.1)",
        padding: 0,
        background: "white",
    };

    const updatePurchaseStatus = async (status) => {
        if (!selectedInvoice) return;

        try {
            // When approving, also update the financial status
            const updateData = { status };

            if (status === "received") {
                // When approved, set the due amount to the actual amount
                updateData.dueAmount = selectedInvoice.grandTotal - (selectedInvoice.paidAmount || 0);
            } else if (status === "cancelled") {
                // When rejected, ensure no amount is due
                updateData.dueAmount = 0;
            }

            await api.put(`/api/purchase-orders/${selectedInvoice._id}`, updateData);

            toast.success(`Purchase Order ${status === "received" ? "Approved" : "Rejected"}`);
            setShowModal(false);
            setSelectedInvoice(null);
            fetchPurchaseOrders(currentPage);
        } catch (err) {
            toast.error(err?.response?.data?.displayMessage ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to update status");
        }
    };
    // const handleExportPDF = () => {
    //   const doc = new jsPDF();
    //   doc.text("Purchase Orders Report", 14, 15);

    //   const tableColumns = [
    //     "PO No.",
    //     "Supplier",
    //     "Order Date",
    //     "Due Date",
    //     "Items",
    //     "Status",
    //   ];

    //   // Get visible rows - selected ones or all if none selected
    //   const visibleRows =
    //     selectedRowIds.size > 0
    //       ? purchaseOrders.filter((order) => selectedRowIds.has(order._id))
    //       : purchaseOrders;

    //   if (visibleRows.length === 0) {
    //     toast.warn("No purchase orders selected to export");
    //     return;
    //   }

    //   const tableRows = visibleRows.map((order) => [
    //     order.purchaseNo || "—",
    //     order.supplierId?.supplierName || "Unknown Supplier",
    //     order.purchaseDate
    //       ? format(new Date(order.purchaseDate), "dd/MM/yyyy")
    //       : "-",
    //     order.dueDate ? format(new Date(order.dueDate), "dd/MM/yyyy") : "-",
    //     order.items?.length || 0,
    //     order.status || "draft",
    //     `₹${(order.grandTotal || 0).toLocaleString("en-IN")}`,
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

    //   const filename = `purchase-orders-${visibleRows.length}-items-${format(
    //     new Date(),
    //     "yyyy-MM-dd"
    //   )}`;
    //   doc.save(`${filename}.pdf`);

    //   toast.success(
    //     `Exported ${visibleRows.length} purchase order${visibleRows.length !== 1 ? "s" : ""
    //     }`
    //   );
    //   // Clear selection after export
    //   setSelectedRowIds(new Set());
    //   setAllVisibleSelected(false);
    // };

    const handleExportExcel = () => {
        try {
            if (selectedRowIds.size === 0) {
                toast.error("Please select at least one row to export");
                return;
            }
            // Get orders to export
            let ordersToExport = [];

            if (selectedRowIds.size > 0) {
                // Export selected orders only
                ordersToExport = purchaseOrders.filter((order) =>
                    selectedRowIds.has(order._id)
                );
            } else {
                // No selection - export all current purchase orders
                ordersToExport = [...purchaseOrders];
            }

            if (ordersToExport.length === 0) {
                toast.warn("No purchase orders to export");
                return;
            }

            // Prepare data for Excel
            const excelData = ordersToExport.map((order, index) => {
                const supplierName = order.supplierId?.supplierName || "Unknown Supplier";
                const itemsCount = order.items?.length || 0;

                // Get status display
                let statusDisplay = "Unknown";
                if (order.status === "pending") statusDisplay = "Pending";
                else if (order.status === "received") statusDisplay = "Approved";
                else if (order.status === "cancelled") statusDisplay = "Cancelled";

                return {
                    "S.No": index + 1,
                    "Purchase No.": order.purchaseNo || "—",
                    "Supplier Name": supplierName,
                    "No. of Items": itemsCount,
                    "Order Date": order.purchaseDate ? format(new Date(order.purchaseDate), "dd/MM/yyyy") : "-",
                    "Expected Arrival": getArrivingDate(order.purchaseDate),
                    "Status": statusDisplay,
                    "Total Amount": `₹${(order.grandTotal || 0).toLocaleString("en-IN")}`,
                    "Due Amount": `₹${(order.dueAmount || 0).toLocaleString("en-IN")}`
                };
            });

            // Create workbook and worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Set column widths
            const colWidths = [
                { wch: 8 },   // S.No
                { wch: 18 },  // Purchase No.
                { wch: 30 },  // Supplier Name
                { wch: 12 },  // No. of Items
                { wch: 12 },  // Order Date
                { wch: 15 },  // Expected Arrival
                { wch: 12 },  // Status
                { wch: 15 },  // Total Amount
                { wch: 15 }   // Due Amount
            ];
            ws['!cols'] = colWidths;

            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, "Purchase Orders");

            // Generate filename
            let filename = "purchase-orders";
            if (selectedRowIds.size > 0) {
                filename = `selected-purchase-orders-${selectedRowIds.size}`;
            } else {
                filename = `all-purchase-orders-${purchaseOrders.length}`;
            }

            // Save the file
            XLSX.writeFile(wb, `${filename}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);

            toast.success(
                selectedRowIds.size > 0
                    ? `${selectedRowIds.size} selected purchase order${selectedRowIds.size !== 1 ? "s" : ""} exported to Excel`
                    : `All ${purchaseOrders.length} purchase order${purchaseOrders.length !== 1 ? "s" : ""} exported to Excel`
            );

            // Clear selection after export (optional)
            setSelectedRowIds(new Set());
            setAllVisibleSelected(false);
            setSelectAllPages(false);
        } catch (error) {
            console.error("Export error:", error);
            toast.error(error?.message || "Failed to export data");
        }
    };

    // Add to your existing useEffect or create a new one
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showExportMenu && !event.target.closest(".export-container")) {
                setShowExportMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showExportMenu]);

    // Add this useEffect near your other useEffect hooks
    useEffect(() => {
        const allCurrentPageIds = purchaseOrders.map((order) => order._id);
        const allSelected =
            allCurrentPageIds.length > 0 &&
            allCurrentPageIds.every((id) => selectedRowIds.has(id));
        setAllVisibleSelected(allSelected);
    }, [selectedRowIds, purchaseOrders]);

    useEffect(() => {
        if (!loading && hasAnyOrdersInSystem === false && !selectedDateRange.startDate && !selectedDateRange.endDate && search === "" && activeTab === "All Orders") {
            navigate("/empty-purchase", { replace: true })
        }
    }, [loading, hasAnyOrdersInSystem, selectedDateRange, search, activeTab, navigate])

    // Add with other handler functions
    const handleRecordPayment = async (paymentData) => {
        try {
            const response = await api.post(
                `/api/purchase-orders/${selectedOrderForPayment._id}/payment`,
                paymentData
            );

            if (response.data.success) {
                toast.success(`Payment of ₹${paymentData.amount} recorded successfully`);
                setShowPaymentModal(false);
                setSelectedOrderForPayment(null);
                fetchPurchaseOrders(currentPage); // Refresh the list
            }
        } catch (error) {
            toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to record payment");
        }
    };
    // Add this function with your other handler functions
    const handlePrintPurchaseOrder = async (order) => {
        try {
            toast.info("Preparing print...");

            // Fetch the full purchase order data
            const response = await api.get(`/api/purchase-orders/${order._id}`);
            if (response.data.success) {
                // ✅ FIX: Use 'purchaseOrder' instead of 'purchase'
                const purchaseOrderData = response.data.purchaseOrder || response.data.purchase;

                if (!purchaseOrderData) {
                    toast.error("Purchase order data not found");
                    return;
                }

                // Fetch company data
                const companyRes = await api.get(`/api/companyprofile/get`);
                const companyData = companyRes.data.data;

                // Fetch terms and template
                const termsRes = await api.get("/api/notes-terms-settings");
                const terms = termsRes.data.data;

                const templateRes = await api.get("/api/print-templates/all");
                const template = templateRes.data.data;

                // Fetch bank details
                const banksRes = await api.get("/api/company-bank/list");
                const banks = banksRes.data.data;

                // Create a temporary hidden div with the purchase order content
                const tempDiv = document.createElement('div');
                tempDiv.style.position = 'absolute';
                tempDiv.style.left = '-9999px';
                tempDiv.style.top = '-9999px';
                document.body.appendChild(tempDiv);

                // Dynamically import and render the PurchaseOrderContent component
                const { createRoot } = await import('react-dom/client');
                const { PurchaseOrderContent } = await import('../../../../pages/Invoices/PreviewPurchase');
                const root = createRoot(tempDiv);

                root.render(
                    <PurchaseOrderContent
                        order={purchaseOrderData}
                        supplier={purchaseOrderData.supplierId}
                        companyData={companyData}
                        banks={banks}
                        terms={terms}
                        template={template}
                        taxSettings={purchaseOrderData.taxSettings || { enableGSTBilling: true }}
                    />
                );

                // Wait for render and then print
                setTimeout(() => {
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                        const printContent = tempDiv.cloneNode(true);

                        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Purchase Order ${purchaseOrderData.purchaseNo || ''}</title>
                <style>
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  body {
                    font-family: 'IBM Plex Mono', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    padding: 20px;
                    background: white;
                  }
                  @media print {
                    body {
                      padding: 0;
                      margin: 0;
                    }
                  }
                  /* Add any additional print styles here */
                  .no-print {
                    display: none !important;
                  }
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
                    } else {
                        toast.error("Please allow popups for printing");
                    }
                    document.body.removeChild(tempDiv);
                    toast.dismiss();
                }, 1000); // Increased timeout for better rendering
            } else {
                toast.error(response.data.error || "Failed to load purchase order");
            }
        } catch (error) {
            console.error("Print error:", error);
            toast.error(error?.response?.data?.message || "Failed to load purchase order for printing");
        }
    };

    return (
        <div className="px-4 py-4" style={{ overflowY: "auto", height: "100vh" }}>
            {/* Header: back + title + right-side controls */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center justify-content-center gap-3">
                    {/* <span
            style={{
              backgroundColor: "white",
              width: "32px",
              height: "32px",
              borderRadius: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "1px solid #FCFCFC",
              cursor: "pointer",
            }}
          >
            <img src={total_orders_icon} alt="total_orders_icon" />
          </span> */}
                    <h3
                        style={{
                            fontSize: "22px",
                            color: "#0E101A",
                            fontFamily: '"Inter", sans-serif',
                            fontWeight: 500,
                            lineHeight: "120%",
                        }}
                    >
                        All Purchase Orders
                    </h3>
                </div>

                <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center gap-4">
                        <DatePicker
                            selectedDateRange={selectedDateRange}
                            setSelectedDateRange={setSelectedDateRange}
                        />
                    </div>

                    {/* Create Purchase order */}
                    {hasPermission(user, "Purchase", "create") && (
                        <Link style={{ textDecoration: "none" }} to="/create-purchase-order">
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
                            >
                                <MdAddShoppingCart className="fs-5" />
                                Create Purchase Order
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Top stat cards */}
            {/* <div className="d-flex flex-wrap g-3 mb-3">
                {initialStats.map((s, idx) => (
                    <Link
                        to={s.link}
                        key={idx}
                        className="col-3"
                        style={{ textDecoration: "none" }}
                    >
                        <div
                            className="d-flex justify-content-between align-items-center bg-white position-relative"
                            style={{
                                width: "98%",
                                height: "86px",
                                padding: "16px 24px 16px 16px",
                                fontFamily: "Inter",
                                boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
                                border: "1px solid #E5F0FF",
                                borderRadius: "8px",
                                backgroundColor: "#FFFFFF",
                            }}
                        >
                            
                            <span
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: "4px",
                                    height: "70%",
                                    backgroundColor: "#1F7FFF",
                                    borderRadius: "1px 10px 1px 10px",
                                }}
                            ></span>

                            
                            <div
                                className="d-flex align-items-center"
                                style={{ gap: "24px" }}
                            >
                                <div className="d-flex flex-column" style={{ gap: "11px" }}>
                                    <h6
                                        className="mb-0"
                                        style={{
                                            fontSize: "14px",
                                            color: "#727681",
                                            fontWeight: "500",
                                        }}
                                    >
                                        {s.title}
                                    </h6>
                                    <div className="d-flex align-items-end gap-2">
                                        <h5
                                            className="mb-0"
                                            style={{
                                                fontSize: "22px",
                                                color: "#0E101A",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {s.value}
                                        </h5>
                                        {s.currency && (
                                            <span style={{ fontSize: "14px", color: "#0E101A" }}>
                                                {s.currency}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                           
                            <div
                                className="d-flex justify-content-center align-items-center rounded-circle"
                                style={{
                                    width: "50px",
                                    height: "50px",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #E5F0FF",
                                    flexShrink: 0,
                                }}
                            >
                                <img
                                    src={s.image}
                                    alt={s.title}
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        objectFit: "contain",
                                    }}
                                />
                            </div>
                        </div>
                    </Link>
                ))}
            </div> */}

            {/* Search + Tabs + Table */}
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
                <div
                    className="d-flex"
                    style={{
                        gap: "20px",
                        justifyContent: "space-between",
                        width: "100%",
                    }}
                >
                    <div className="col-md-6 d-flex align-items-center" style={{ width: "50%" }}>
                        <div
                            style={{
                                background: "#F3F8FB",
                                padding: 2,
                                borderRadius: 8,
                                display: "flex",
                                gap: 8,
                                overflowX: "auto",
                            }}
                        >
                            {initialTabs.map((t) => {
                                const active = activeTab === t.label;
                                return (
                                    <div
                                        key={t.label}
                                        onClick={() => handleTabChange(t)}
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
                                            minWidth: 90,
                                            whiteSpace: "nowrap",
                                            height: "33px",
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
                    <div className="d-flex align-items-center gap-4" style={{
                        display: "flex",
                        justifyContent: "end",
                        gap: "24px",
                        height: "33px",
                        width: "50%",
                    }}>
                        {/* Search Box */}
                        <div
                            style={{
                                width: "50%",
                                position: "relative",
                                padding: "4px 8px 4px 20px",
                                display: "flex",
                                borderRadius: 8,
                                alignItems: "center",
                                background: "#FCFCFC",
                                border: "1px solid #EAEAEA",
                                gap: "5px",
                                color: "rgba(19.75, 25.29, 61.30, 0.40)",
                            }}
                        >
                            <FiSearch style={{ color: "#14193D66" }} className="fs-5" />
                            <input
                                type="search"
                                placeholder="Search by supplier name, purchase order no."
                                value={search}
                                onChange={handleSearch}
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
                        {hasPermission(user, "Purchase", "export") && (
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
                                        selectedRowIds.size > 0 || purchaseOrders.length > 0
                                            ? "pointer"
                                            : "not-allowed",
                                    opacity:
                                        selectedRowIds.size > 0 || purchaseOrders.length > 0
                                            ? 1
                                            : 0.5,
                                }}
                                onClick={handleExportExcel}
                                disabled={purchaseOrders.length === 0}
                                title={
                                    selectedRowIds.size > 0
                                        ? `Export ${selectedRowIds.size} selected`
                                        : "Export all"
                                }
                            >
                                <TbFileExport className="fs-5" style={{ color: "#6C748C" }} />
                                Export
                            </button>
                        )}
                    </div>
                </div>

                {/* Table card */}
                <div className="" style={{ overflow: "auto", maxHeight: "calc(100vh - 455px)" }}>
                    <table
                        style={{
                            width: "100%",
                            borderSpacing: "0 0px",
                            fontFamily: "Inter",
                        }}
                    >
                        <thead style={{ position: "sticky", top: 0, zIndex: 9 }}>
                            <tr style={{ backgroundColor: "#F3F8FB", textAlign: "left" }}>
                                {/* Checkbox */}
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
                                            checked={selectAllPages || (allVisibleSelected && purchaseOrders.length > 0)}
                                            onChange={(e) => {
                                                const checked = e.target.checked;
                                                if (checked) {
                                                    setSelectAllPages(true);
                                                    const next = new Set(selectedRowIds);
                                                    // Add all current page orders
                                                    purchaseOrders.forEach((order) => {
                                                        if (order._id) next.add(order._id);
                                                    });
                                                    setSelectedRowIds(next);
                                                } else {
                                                    // User wants to deselect all
                                                    setSelectAllPages(false);
                                                    setSelectedRowIds(new Set());
                                                }
                                            }}
                                        />
                                    </div>
                                </th>

                                {/* Supplier Name */}
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        color: "#727681",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        fontFamily: '"Inter", sans-serif',
                                    }}
                                >
                                    Supplier Name
                                </th>

                                {/* Invoice */}
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        color: "#727681",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        fontFamily: '"Inter", sans-serif',
                                    }}
                                >
                                    Purchase Order No.
                                </th>

                                {/* Items */}
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        color: "#727681",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        fontFamily: '"Inter", sans-serif',
                                    }}
                                >
                                    No. Of Items
                                </th>

                                {/* Dates */}
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        color: "#727681",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        fontFamily: '"Inter", sans-serif',
                                    }}
                                >
                                    Order Date
                                </th>

                                {/* Status */}
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        color: "#727681",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        fontFamily: '"Inter", sans-serif',
                                    }}
                                >
                                    Status
                                </th>

                                {/* Total */}
                                <th
                                    style={{
                                        padding: "12px 16px",
                                        color: "#727681",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        fontFamily: '"Inter", sans-serif',
                                    }}
                                >
                                    Total Amount
                                </th>

                                {/* Actions */}
                                <th
                                    className="text-center"
                                    style={{
                                        padding: "12px 16px",
                                        color: "#727681",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        fontFamily: '"Inter", sans-serif',
                                    }}
                                >
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4">
                                        <div
                                            className="spinner-border text-primary"
                                            role="status"
                                        >
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : purchaseOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted py-5">
                                        No purchase orders found
                                    </td>
                                </tr>
                            ) : (
                                purchaseOrders.map((order, idx) => {
                                    const sty =
                                        statusStyles[order.status] || statusStyles.default;
                                    const supplierName =
                                        order.supplierId?.supplierName || "Unknown Supplier";
                                    const itemsCount = order.items?.length || 0;

                                    return (
                                        <tr key={order._id}
                                            className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                                            style={{
                                                borderBottom: "1px solid #EAEAEA",
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => navigate(`/show-purchase/${order._id}`)}
                                        >
                                            {/* Checkbox */}
                                            <td
                                                className="text-center"
                                                style={{ padding: "6px 16px" }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: 'center' }}>
                                                    <input
                                                        type="checkbox"
                                                        aria-label="select row"
                                                        checked={selectedRowIds.has(order._id)}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            const next = new Set(selectedRowIds);
                                                            if (e.target.checked) {
                                                                if (order._id) next.add(order._id);
                                                            } else {
                                                                if (order._id) next.delete(order._id);
                                                            }
                                                            setSelectedRowIds(next);
                                                        }}
                                                    />
                                                </div>
                                            </td>

                                            {/* Supplier */}
                                            <td
                                                style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}
                                            >
                                                {supplierName} ({itemsCount} items)
                                            </td>

                                            {/* Invoice */}
                                            <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                                                {order.purchaseNo}
                                            </td>

                                            {/* Items */}
                                            <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>{itemsCount}</td>

                                            {/* Dates */}
                                            <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: 6,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <span>{formatDate(order.purchaseDate)}</span>
                                                </div>
                                            </td>

                                            {/* Status chip */}
                                            <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                                                <div
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        padding: "2px 5px",
                                                        borderRadius: 50,
                                                        background: sty.bg,
                                                        color: sty.color,
                                                        fontSize: 14,
                                                        whiteSpace: "nowrap",
                                                        minWidth: 120,
                                                        cursor: order.status === "pending" ? "pointer" : "default",
                                                        opacity: order.status === "pending" ? 1 : 0.9
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (order.status === "pending") {
                                                            setSelectedInvoice(order);
                                                            // setShowModal(true);
                                                        }
                                                    }}
                                                    title={
                                                        order.status === "pending"
                                                            ? "Click to approve or reject this purchase"
                                                            : order.status === "received"
                                                                ? "Approved - Status cannot be changed"
                                                                : "Cancelled - Status cannot be changed"
                                                    }
                                                >
                                                    {sty.dot ? (
                                                        <span
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: 20,
                                                                background: sty.color,
                                                                display: "inline-block",
                                                            }}
                                                        />
                                                    ) : (
                                                        <span style={{ color: sty.color }}>
                                                            {sty.icon}
                                                        </span>
                                                    )}
                                                    {sty.label}
                                                    {order.status !== "pending" && (
                                                        <span style={{ marginLeft: "4px", fontSize: "12px" }}></span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td style={{ fontFamily: "inter 'sans-serif", fontWeight: 400, fontSize: "14px", lineHeight: "120%", padding: "6px 16px", color: "#0E101A" }}>
                                                ₹ {order.grandTotal?.toLocaleString("en-IN")}/-
                                            </td>

                                            {/* Actions */}
                                            <td
                                                style={{
                                                    padding: "6px 16px",
                                                    position: "relative",
                                                    overflow: "visible",
                                                    display: "flex",
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        const rect =
                                                            e.currentTarget.getBoundingClientRect();
                                                        setOpenMenu(openMenu === idx ? null : idx)

                                                        const dropdownHeight = 160; // your menu height
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
                                                    <HiOutlineDotsHorizontal size={20} color="grey" />
                                                </button>

                                                {openMenu === idx && (
                                                    <div
                                                        style={{
                                                            position: "fixed",
                                                            top: openUpwards
                                                                ? dropdownPos.y - 110
                                                                : dropdownPos.y,
                                                            left: dropdownPos.x - 110,
                                                            zIndex: 999999,
                                                        }}
                                                    >
                                                        <div
                                                            ref={menuRef}
                                                            style={{
                                                                background: "white",
                                                                padding: 8,
                                                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                                                minWidth: 210,
                                                                height: "auto", // height must match dropdownHeight above
                                                                display: "flex",
                                                                flexDirection: "column",
                                                                borderRadius: '8px',
                                                                gap: 4,
                                                            }}
                                                        >
                                                            {getMenuItems(order)
                                                                .filter(item => hasPermission(user, "Purchase", item.permission))
                                                                .map((item) => (
                                                                    <div key={item.action} style={{ position: "relative" }}>
                                                                        <div
                                                                            onClick={() => {
                                                                                if (!item.children) {
                                                                                    handleMenuAction(order, item.action);
                                                                                }
                                                                            }}
                                                                            style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                justifyContent: "space-between",
                                                                                gap: "12px",
                                                                                padding: "8px 18px",
                                                                                fontFamily: "Inter, sans-serif",
                                                                                fontSize: "14px",
                                                                                fontWeight: 500,
                                                                                cursor: "pointer",
                                                                                transition: "0.2s",
                                                                                borderRadius: '8px',
                                                                                textDecoration: "none",
                                                                                color: "#344054",
                                                                            }}
                                                                            onMouseEnter={(e) => {
                                                                                e.currentTarget.style.backgroundColor = "#e3f2fd";
                                                                                // Open submenu on hover
                                                                                if (item.children && openSubMenu !== item.action) {
                                                                                    setOpenSubMenu(item.action);
                                                                                }
                                                                            }}
                                                                            onMouseLeave={(e) => {
                                                                                e.currentTarget.style.backgroundColor = "transparent";
                                                                            }}
                                                                        >
                                                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                                                <span style={{ fontSize: "20px" }}>{item.icon}</span>
                                                                                <span>{item.label}</span>
                                                                            </div>
                                                                            {item.children && <span style={{ fontSize: "12px" }}>▶</span>}
                                                                        </div>

                                                                        {/* Submenu for Convert to */}
                                                                        {item.children && openSubMenu === item.action && (
                                                                            <div
                                                                                style={{
                                                                                    position: "absolute",
                                                                                    left: "100%",
                                                                                    top: 40,
                                                                                    background: "white",
                                                                                    padding: "8px",
                                                                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                                                                    minWidth: "180px",
                                                                                    borderRadius: "8px",
                                                                                    zIndex: 1000000,
                                                                                    marginLeft: "-200px"
                                                                                }}
                                                                                onMouseEnter={() => setOpenSubMenu(item.action)}
                                                                                onMouseLeave={() => setOpenSubMenu(null)}
                                                                            >
                                                                                {item.children.map((child) => (
                                                                                    <div
                                                                                        key={child.action}
                                                                                        onClick={() => {
                                                                                            handleMenuAction(order, child.action);
                                                                                            setOpenMenu(null);
                                                                                            setOpenSubMenu(null);
                                                                                        }}
                                                                                        style={{
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "12px",
                                                                                            padding: "8px 18px",
                                                                                            fontFamily: "Inter, sans-serif",
                                                                                            fontSize: "14px",
                                                                                            fontWeight: 500,
                                                                                            cursor: "pointer",
                                                                                            transition: "0.2s",
                                                                                            borderRadius: "8px",
                                                                                            textDecoration: "none",
                                                                                            color: "#344054",
                                                                                        }}
                                                                                        onMouseEnter={(e) => {
                                                                                            e.currentTarget.style.backgroundColor = "#e3f2fd";
                                                                                        }}
                                                                                        onMouseLeave={(e) => {
                                                                                            e.currentTarget.style.backgroundColor = "transparent";
                                                                                        }}
                                                                                    >
                                                                                        <span>{child.label}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            {/* animation */}
                                                            <style>{`
                                    @keyframes fadeIn {
                                      from { opacity: 0; transform: translateY(-6px); }
                                      to { opacity: 1; transform: translateY(0); }
                                    }
                                  `}</style>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {showCancelModal && selectedInvoice && (
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
                        onClick={() => setShowCancelModal(false)}
                    >
                        <div
                            style={{
                                background: "white",
                                padding: "24px",
                                borderRadius: "12px",
                                maxWidth: "450px",
                                width: "90%",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ marginTop: 0, color: "#DC2626" }}>Cancel Purchase Order</h3>
                            <p style={{ fontSize: "14px", color: "#555", marginBottom: "20px" }}>
                                Are you sure you want to cancel purchase order <strong>{selectedInvoice?.purchaseNo}</strong>?
                                <br />
                                <span style={{ color: "#DC2626", fontSize: "13px" }}>This action cannot be undone.</span>
                            </p>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    style={{
                                        padding: "8px 20px",
                                        borderRadius: "8px",
                                        border: "1px solid #ddd",
                                        background: "white",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                    }}
                                >
                                    No, Keep
                                </button>
                                <button
                                    onClick={handleCancelOrder}
                                    style={{
                                        padding: "8px 20px",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: "#DC2626",
                                        color: "white",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                    }}
                                >
                                    Yes, Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ConfirmDeleteModal
                    isOpen={showDeleteModal}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setSelectedInvoice(null);
                    }}
                    onConfirm={handleDeleteInvoice}
                    title="Delete Purchase Order"
                    message={`Are you sure you want to delete Purchase ${selectedInvoice?.purchaseNo}? This action cannot be undone.`}
                />

                {/* Convert purchase modal */}
                <Convertpurchasepopupmodal
                    isOpen={showModal}
                    onCancel={() => setShowModal(false)}
                    onConfirm={(status) => updatePurchaseStatus(status)}
                    currentStatus={selectedInvoice?.status}
                    type="purchase"
                />

                {/* Pagination */}
                {!loading && purchaseOrders.length > 0 && (
                    <div className="page-redirect-btn px-2">
                        <Pagination
                            currentPage={currentPage}
                            itemsPerPage={itemsPerPage}
                            total={totalCount}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={(n) => {
                                setItemsPerPage(n);
                                setCurrentPage(1);
                                let status = "";
                                switch (activeTab) {
                                    case "Pending":
                                        status = "pending";
                                        break;
                                    case "Approved":
                                        status = "approved";
                                        break;
                                    case "Rejected":
                                        status = "cancelled";
                                        break;
                                    default:
                                        status = "";
                                }
                                fetchPurchaseOrders(1, status, n);
                            }}
                        />
                    </div>
                )}
            </div>
            {/* Payment Modal */}
            {showPaymentModal && selectedOrderForPayment && (
                <PurchasePaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => {
                        setShowPaymentModal(false);
                        setSelectedOrderForPayment(null);
                    }}
                    purchaseOrder={selectedOrderForPayment}
                    onSave={handleRecordPayment}
                    existingPayments={selectedOrderForPayment?.paymentHistory || []}
                />
            )}
        </div>
    );
}
