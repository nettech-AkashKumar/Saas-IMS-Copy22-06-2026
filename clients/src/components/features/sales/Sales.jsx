import React, { useEffect, useState, useRef } from "react";
import { FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import Dollarimg from "../../../assets/images/dollar.png";
import Orderimg from "../../../assets/images/order.png";
import Purchaseimg from "../../../assets/images/purchaserupe.png";
import Dueamountimg from "../../../assets/images/dueamount.png";
import { HiOutlineArrowsUpDown } from "react-icons/hi2";
import { TbFileExport } from "react-icons/tb";
import ConfirmDeleteModal from "../../../components/ConfirmDelete";
import Pagination from "../../../components/Pagination";
import CreditNoteImg from "../../../assets/images/create-creditnote.png";
import DeleteICONImg from "../../../assets/images/delete.png";
import ViewDetailsImg from "../../../assets/images/view-details.png";
import DateFilterDropdown from "../../../components/DateFilterDropdown";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";
import jsPDF from 'jspdf';
import autoTable from "jspdf-autotable";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { hasPermission } from "../../../utils/permission/hasPermission";
import { useAuth } from "../../auth/AuthContext";
import { MdOutlineKeyboardArrowUp } from "react-icons/md";
import { FaFileInvoice } from "react-icons/fa";
import { IoPrintOutline } from "react-icons/io5";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const statsTop = [
  {
    title: "Total Revenue",
    value: "₹0", // Default value
    currency: "",
    image: Dollarimg,
    link: ""
  },
  {
    title: "Total Order",
    value: "0",
    image: Orderimg,
    currency: "",
    link: "/m/total-orders"
  },
  {
    title: "Average Selling",
    value: "₹0",
    currency: "",
    image: Purchaseimg,
    link: ""
  },
  {
    title: "Due Payments",
    value: "₹0",
    currency: "",
    image: Dueamountimg,
    link: ""
  },
];

const tabsData = [
  { label: "All", count: 0 },
  { label: "Recent", count: 0 },
  // { label: "Paid", count: 0 },
  // { label: "Due", count: 0 }
];

// const statusStyles = {
//   paid: { bg: "#D4F7C7", color: "#01774B", dot: false },
//   draft: { bg: "#F7F7C7", color: "#746E00", dot: false },
//   partial: { bg: "#C7E6F7", color: "#005B74", dot: false },
//   overdue: { bg: "#F7C7C9", color: "#A80205", dot: false },
//   sent: { bg: "#E8C7F7", color: "#5A0074", dot: false },
//   cancelled: { bg: "#C7C7C7", color: "#3D3D3D", dot: false }
// };
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

const paymentStatusStyles = {
  pending: {
    bg: "#F7F4D5",
    color: "#9A8700",
    dot: "#9A8700",
  },
  half: {
    bg: "#FFE7E7",
    color: "#E53935",
    dot: "#E53935",
  },
};

const Sales = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgSelling: 0,
    duePayments: 0
  });
  const [initialStats, setInitialStats] = useState(statsTop);
  const [initialTabs, setInitialTabs] = useState(tabsData);

  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [openRow, setOpenRow] = useState(null);
  // for convert to invocie
  const [openConvertDropdownId, setOpenConvertDropdownId] = useState(null);
  const [convertDropdownPos, setConvertDropdownPos] = useState({ x: 0, y: 0 });
  const [convertOpenUpwards, setConvertOpenUpwards] = useState(false);
  const [convertingId, setConvertingId] = useState(null);
  const convertDropdownRef = useRef(null);


  const [tabCounts, setTabCounts] = useState({
    all: 0,
    recent: 0,
    // paid: 0,
    // due: 0
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const menuRef = useRef(null);

  const toggleRow = (idx) => {
    const newOpen = openRow === idx ? null : idx;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === idx) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(idx);
    }
  };



  // FIX 1: Update allVisibleSelected when selectedRowIds or sales change
  // Currently you have:
  useEffect(() => {
    if (sales.length > 0) {
      const allSelected = sales.every(sale => selectedRowIds.has(sale._id));
      setAllVisibleSelected(allSelected);
    } else {
      setAllVisibleSelected(false);
    }
  }, [selectedRowIds, sales]);

  const menuItems = (invoice) => {
    const isConverted = invoice.status === "converted_to_invoice";
    return [
      {
        label: "View Details",
        icon: <img src={ViewDetailsImg} size={18} />,
        action: "details",
        permission: "read",
        onClick: () => navigate(`/create-sales-order/${invoice._id}`, { 
          state: {
             from: "/online-orders",
             mode: 'view'
             }
        })
      },
      // {
      //   label: "Create Credit Notes",
      //   icon: <img src={CreditNoteImg} size={18} />,
      //   action: "credit_note",
      //   permission: "create",
      //   onClick: () => navigate('/credit-note', {
      //     state: { 
      //       sourceSalesOrder:invoice,
      //       isFromSalesOrder:true,
      //       from: "/online-orders"
      //      }
      //   })
      // },
      {
        label: "Print",
        icon: <IoPrintOutline size={18} />,
        action: "print",
        permission: "create",
        onClick: async () => {
          try {
            toast.info("Preparing print...");

            // Fetch the full sales order data
            const response = await api.get(`/api/sales-orders/${invoice._id}`);
            if (response.data.success) {
              const salesOrderData = response.data.salesOrder;

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

              // Create a temporary hidden div with the sales order content
              const tempDiv = document.createElement('div');
              tempDiv.style.position = 'absolute';
              tempDiv.style.left = '-9999px';
              tempDiv.style.top = '-9999px';
              document.body.appendChild(tempDiv);

              // Dynamically import react-dom/client and render the SalesOrderContent
              const { createRoot } = await import('react-dom/client');
              const { SalesOrderContent } = await import('../../../pages/Invoices/PreviewSalesOrder');
              const root = createRoot(tempDiv);

              root.render(
                <SalesOrderContent
                  salesOrder={salesOrderData}
                  customer={salesOrderData.customerId}
                  companyData={companyData}
                  banks={banks}
                  terms={terms}
                  template={template}
                  taxSettings={salesOrderData.taxSettings || { enableGSTBilling: true }}
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
    <title>Sales Order ${salesOrderData.salesOrderNo || ''}</title>
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
            toast.error("Failed to load sales order for printing");
            // console.error(error);
          }
        }
      },
      // {
      //   label: "Delete",
      //   icon: <img src={DeleteICONImg} size={18} />,
      //   action: "delete",
      //   permission: "delete",
      //   disabled: isConverted,
      //   onClick: () => {
      //     if (!isConverted) {
      //       setSelectedInvoice(invoice);
      //       setShowDeleteModal(true);
      //     } else {
      //       toast.error("Cannot delete sales order that has been converted to invoice");
      //     }
      //   }
      // },
      {
        label: "Create Delivery Challan",
        icon: <img src={CreditNoteImg} size={18} />,
        action: "delivery_challan",
        permission: "create",
        onClick: () => navigate('/createdeliverychallan', {
          state:{
            sourceSalesOrder:invoice,
            isFromSalesOrder:true,
            from:"/online-orders"
          }
        })
      },
      {
        label: "Create  E-way Bill",
        icon: <img src={CreditNoteImg} size={18} />,
        action: "eway_bill",
        permission: "create",
      },
    ];
  }

  // navigate(`/sales-invoice/${id}`, {
  //   state:{from: "/online-sales"}
  // });

  // Add this inside your existing useEffect or create a new one
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (convertDropdownRef.current && !convertDropdownRef.current.contains(event.target)) {
        setOpenConvertDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch sales data
  // const fetchSalesList = async () => {
  //   setLoading(true);
  //   try {
  //     const params = {
  //       page: pagination.page,
  //       limit: pagination.limit,
  //       search: search || undefined,
  //     };

  //     // Handle "Recent" tab specially - filter by last 7 days
  //     if (activeTab === "Recent") {
  //       const sevenDaysAgo = new Date();
  //       sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  //       params.startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
  //       params.endDate = format(new Date(), 'yyyy-MM-dd');
  //     } else if (activeTab !== "All") {
  //       // For other tabs (if you add more later)
  //       params.status = activeTab.toLowerCase();
  //     }

  //     // Apply date range filter if selected from DateFilterDropdown
  //     if (dateRange.start && activeTab !== "Recent") {
  //       params.startDate = format(dateRange.start, 'yyyy-MM-dd');
  //     }
  //     if (dateRange.end && activeTab !== "Recent") {
  //       params.endDate = format(dateRange.end, 'yyyy-MM-dd');
  //     }

  //     Object.keys(params).forEach(key => {
  //     if (params[key] === undefined || params[key] === "") delete params[key];
  //   });

  //     const response = await api.get('/api/sales-orders', { params });
  //     // console.log('salessdresponsedataww', response.data)

  //     if (response.data.success) {
  //       const salesOrders = response.data.salesOrders || [];
  //       const allCount = response.data.total || 0;

  //       const mappedSales = salesOrders.map(order => ({
  //         _id: order._id,
  //         invoiceNo: order.salesOrderNo,
  //         orderNo: order.salesOrderNo,
  //         customer: order.customerId?.name || "N/A",
  //         customerId: order.customerId?._id,
  //         soldItems: order.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0,
  //         totalAmount: order.grandTotal || 0,
  //         dueAmount: order.dueAmount || 0,
  //         status: order.status,
  //         dispatched: order.status === "confirmed" || order.status === "processing" || order.status === "completed",
  //         invoiceDate: order.orderDate,
  //         items: order.items?.map(item => ({
  //           productName: item.itemName,
  //           itemBarcode: item.hsnCode || "-",
  //           qty: item.qty,
  //           category: "-",
  //           unitPrice: item.unitPrice,
  //           total: item.amount
  //         })) || []
  //       }));

  //       setSales(mappedSales);

  //       const p = response.data.pagination;
  //       setPagination(prev => ({
  //         ...prev,
  //         page: p?.page || 1,
  //         limit: p?.limit || 10,
  //         total: p?.total || 0,
  //         totalPages: p?.totalPages || 1
  //       }));

  //       // Get accurate counts for both tabs
  //       const allCount = p?.total || mappedSales.length;

  //       // IMPORTANT: Get recent count by making a separate API call WITHOUT pagination limit
  //       let recentCount = 0;
  //       try {
  //         const sevenDaysAgo = new Date();
  //         sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  //         // Use a large limit to get all records or just use pagination.total
  //         const recentParams = {
  //           page: 1,
  //           limit: 1000, // Get up to 1000 records
  //           startDate: format(sevenDaysAgo, 'yyyy-MM-dd'),
  //           endDate: format(new Date(), 'yyyy-MM-dd')
  //         };
  //         const recentResponse = await api.get('/api/sales-orders', { params: recentParams });
  //         recentCount = recentResponse.data.pagination?.total || recentResponse.data.salesOrders?.length || 0;
  //       } catch (err) {
  //         // console.error("Error fetching recent count:", err);
  //         // Fallback: calculate from current data if on Recent tab
  //         if (activeTab === "Recent") {
  //           recentCount = mappedSales.length;
  //         } else {
  //           // Only calculate from first page data (inaccurate but better than 0)
  //           recentCount = mappedSales.filter(sale => {
  //             const orderDate = new Date(sale.invoiceDate);
  //             const sevenDaysAgo = new Date();
  //             sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  //             return orderDate >= sevenDaysAgo;
  //           }).length;
  //         }
  //       }

  //       // Update tabs with real counts
  //       setInitialTabs([
  //         { label: "All", count: allCount },
  //         { label: "Recent", count: recentCount }
  //       ]);

  //       setTabCounts({
  //         all: allCount,
  //         recent: recentCount
  //       });

  //       // For stats, we need total revenue from ALL orders, not just current page
  //       // Make a separate API call to get all orders for accurate stats
  //       let totalRevenue = mappedSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  //       let totalOrders = allCount;

  //       // If we're not on All tab or paginated, fetch full data for accurate stats
  //       if (activeTab !== "All" || mappedSales.length < allCount) {
  //         try {
  //           const allOrdersParams = {
  //             page: 1,
  //             limit: 1000, // Get up to 1000 orders
  //             ...(activeTab === "Recent" ? {
  //               startDate: format(sevenDaysAgo, 'yyyy-MM-dd'),
  //               endDate: format(new Date(), 'yyyy-MM-dd')
  //             } : {})
  //           };
  //           const allOrdersResponse = await api.get('/api/sales-orders', { params: allOrdersParams });
  //           const allOrders = allOrdersResponse.data.salesOrders || [];
  //           totalRevenue = allOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
  //           totalOrders = allOrdersResponse.data.pagination?.total || allOrders.length;
  //         } catch (err) {
  //           // console.error("Error fetching all orders for stats:", err);
  //         }
  //       }

  //       setInitialStats([
  //         { ...statsTop[0], value: `₹${totalRevenue.toLocaleString('en-IN') || 0}` },
  //         { ...statsTop[1], value: totalOrders.toLocaleString('en-IN') },
  //         { ...statsTop[2], value: `₹${(totalRevenue / (totalOrders || 1)).toLocaleString('en-IN') || 0}` },
  //         { ...statsTop[3], value: `₹0` },
  //       ]);
  //     }
  //   } catch (error) {
  //     toast.error(error?.response?.data?.displayMessage ||
  //       error?.response?.data?.message ||
  //       error?.message ||
  //       "Failed to load sales data"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // Fetch sales data - FIXED VERSION
const fetchSalesList = async () => {
  setLoading(true);
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: search || undefined, // Send search to backend
    };

    // Handle "Recent" tab specially - filter by last 7 days
    if (activeTab === "Recent") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      params.startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
      params.endDate = format(new Date(), 'yyyy-MM-dd');
    } else if (activeTab !== "All") {
      params.status = activeTab.toLowerCase();
    }

    // Apply date range filter if selected from DateFilterDropdown
    if (dateRange.start && activeTab !== "Recent") {
      params.startDate = format(dateRange.start, 'yyyy-MM-dd');
    }
    if (dateRange.end && activeTab !== "Recent") {
      params.endDate = format(dateRange.end, 'yyyy-MM-dd');
    }

    // Remove undefined params
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === "") delete params[key];
    });

    const response = await api.get('/api/sales-orders', { params });
    
    if (response.data.success) {
      const salesOrders = response.data.salesOrders || [];
      const allCount = response.data.total || 0;

      const mappedSales = salesOrders.map(order => ({
        _id: order._id,
        invoiceNo: order.salesOrderNo,
        orderNo: order.salesOrderNo,
        customer: order.customerId?.name || "N/A",
        customerId: order.customerId?._id,
        soldItems: order.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0,
        totalAmount: order.grandTotal || 0,
        dueAmount: order.dueAmount || 0,
        status: order.status,
        invoiceDate: order.orderDate,
        items: order.items?.map(item => ({
          productName: item.itemName,
          itemBarcode: item.hsnCode || "-",
          qty: item.qty,
          category: "-",
          unitPrice: item.unitPrice,
          total: item.amount
        })) || []
      }));

      setSales(mappedSales);

      setPagination(prev => ({
        ...prev,
        page: response.data.pagination?.page || 1,
        limit: response.data.pagination?.limit || 10,
        total: response.data.total || 0,
        totalPages: response.data.pagination?.totalPages || 1
      }));

      // Get accurate Recent count
      let recentCount = 0;
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentParams = {
          page: 1,
          limit: 1, // Just need count, not data
          startDate: format(sevenDaysAgo, 'yyyy-MM-dd'),
          endDate: format(new Date(), 'yyyy-MM-dd')
        };
        const recentResponse = await api.get('/api/sales-orders', { params: recentParams });
        recentCount = recentResponse.data.total || 0;
      } catch (err) {
        console.error("Error fetching recent count:", err);
        // Fallback: calculate from current data if on Recent tab
        if (activeTab === "Recent") {
          recentCount = mappedSales.length;
        }
      }

      // Update tabs with real counts
      setInitialTabs([
        { label: "All", count: allCount },
        { label: "Recent", count: recentCount }
      ]);

      setTabCounts({
        all: allCount,
        recent: recentCount
      });

      // Calculate stats
      let totalRevenue = 0;
      let totalOrders = allCount;
      
      // If we have all data on current page, use it
      if (mappedSales.length > 0) {
        totalRevenue = mappedSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      }
      
      // If not all data is loaded, fetch aggregated stats
      if (mappedSales.length < allCount && allCount > 0) {
        try {
          const statsParams = { page: 1, limit: 1000 };
          if (activeTab === "Recent") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            statsParams.startDate = format(sevenDaysAgo, 'yyyy-MM-dd');
            statsParams.endDate = format(new Date(), 'yyyy-MM-dd');
          }
          const statsResponse = await api.get('/api/sales-orders', { params: statsParams });
          const allOrders = statsResponse.data.salesOrders || [];
          totalRevenue = allOrders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
          totalOrders = statsResponse.data.total || allOrders.length;
        } catch (err) {
          console.error("Error fetching all orders for stats:", err);
        }
      }

      setInitialStats([
        { ...statsTop[0], value: `₹${totalRevenue.toLocaleString('en-IN') || 0}` },
        { ...statsTop[1], value: totalOrders.toLocaleString('en-IN') },
        { ...statsTop[2], value: `₹${(totalRevenue / (totalOrders || 1)).toLocaleString('en-IN') || 0}` },
        { ...statsTop[3], value: `₹0` },
      ]);
    }
  } catch (error) {
    toast.error(error?.response?.data?.displayMessage ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load sales data"
    );
  } finally {
    setLoading(false);
  }
};


  // Update the convertToInvoice function in Sales.js
  const convertToInvoice = async (salesOrder) => {
    setConvertingId(salesOrder._id);
    try {
      // Fetch complete sales order data with populated customer and full item details
      const response = await api.get(`/api/sales-orders/${salesOrder._id}`);
      if (response.data.success) {
        const completeSalesOrder = response.data.salesOrder;

        // Navigate to create invoice page with sales order data
        navigate("/createinvoice", {
          state: {
            sourceSalesOrder: completeSalesOrder,
            isFromSalesOrder: true,
            salesOrderId: completeSalesOrder._id,
            // Add a flag to refresh the sales list when coming back
            refreshSalesList: true
          }
        });
      } else {
        toast.error("Failed to load sales order data");
      }
    } catch (error) {
      // console.error("Error fetching sales order:", error);
      toast.error(error?.response?.data?.message || "Failed to load sales order data");
    } finally {
      setConvertingId(null);
      setOpenConvertDropdownId(null);
    }
  };

  // Handle delete invoice
  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    try {
      await api.delete(`/api/sales-orders/${selectedInvoice._id}`);
      toast.success('Sales order deleted successfully');
      fetchSalesList();
    } catch (error) {
      // This will show the specific error message from backend
      const errorMessage = error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete sales order";
      toast.error(errorMessage);
      // console.error("Delete error:", errorMessage);
    } finally {
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    }
  };

  const formatCurrency = (amount) => {
  return `₹${(amount || 0).toFixed(2)}`;
};
 // PDF Export function - FIXED VERSION
const handleExport = async () => {
  if (selectedRowIds.size === 0) {
    toast.error("Select at least 1 row to export data");
    return;
  }

  try {
    // Get selected rows data
    const selectedRows = sales.filter(sale => selectedRowIds.has(sale._id));
    
    if (selectedRows.length === 0) {
      toast.error("No data available to export");
      return;
    }

    // Define columns for Excel
    const tableColumns = [
      "Order No.",
      "Order Date",
      "Customer Name",
      "Quantity",
      "Total Amount",
      "Status",
    ];

    // Prepare table rows
    const tableRows = selectedRows.map((sale) => [
      sale.orderNo || sale.invoiceNo || "-",
      sale.invoiceDate ? format(new Date(sale.invoiceDate), "dd MMM yyyy") : "-",
      sale.customer || "-",
      sale.soldItems || 0,
      sale.totalAmount?.toFixed(2) || "0",
      sale.status?.toUpperCase() || "DRAFT",
    ]);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sales Orders");

    // Add header row with styling
    const headerRow = worksheet.addRow(tableColumns);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "99c5ff" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "338bff" } },
        left: { style: "thin", color: { argb: "338bff" } },
        bottom: { style: "thin", color: { argb: "338bff" } },
        right: { style: "thin", color: { argb: "338bff" } },
      };
      cell.font = { bold: true };
    });

    // Set column widths
    const columnWidths = [20, 30, 15, 20, 20, 20, 20];
    columnWidths.forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });

    // Add data rows
    tableRows.forEach((row) => worksheet.addRow(row));

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `sales_orders_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );
    
    toast.success(`Exported ${selectedRows.length} sales order(s) as Excel`);
    
    // Clear selection after export
    setSelectedRowIds(new Set());
    setAllVisibleSelected(false);
    
  } catch (error) {
    console.error("Excel export error:", error);
    toast.error(error?.message || "Failed to generate Excel file");
  }
};

  // Handle date range change
  const handleDateChange = (dates) => {
    // console.log("DatePicker output:", dates);
    setDateRange({
      start: dates.startDate,
      end: dates.endDate
    });
  };

  useEffect(() => {
    fetchSalesList();
  }, [activeTab, search, pagination.page, pagination.limit, dateRange.start, dateRange.end]);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    // Clear selection when filters change
    setSelectedRowIds(new Set());
    setAllVisibleSelected(false);
  }, [activeTab, search, dateRange.start, dateRange.end]);

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

  return (
    <div className="container-fluid p-4" style={{ overflow: "auto", height: "100vh" }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div className="d-flex align-items-center justify-content-center gap-3">
          <h3 style={{
            fontSize: "22px",
            color: "#0E101A",
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            lineHeight: "120%",
          }}>
            Sale Order
          </h3>
        </div>
        <div className="d-flex align-items-center gap-3" style={{ cursor: "pointer" }}>
          {/* <DateFilterDropdown onChange={handleDateChange} /> */}
          <DateFilterDropdown
            onChange={handleDateChange}
            selectedDateRange={dateRange}
            setSelectedDateRange={setDateRange}
          />
          {/* {hasPermission(user, "SalesOrder", "create") && ( */}
          <Link to="/create-sales-order">
            <button
              title="Create Sales Order"
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
              + Create Sales Order
            </button>
          </Link>
          {/* )} */}
        </div>
      </div>

      {/* Stats Cards */}
      {/* <div className="d-flex flex-wrap g-3 mb-3">
        {initialStats.map((stat, idx) => (
          <Link to={stat.link} key={idx} className="col-3" style={{ textDecoration: "none", paddingRight: stat.title === 'Due Payments' ? '0px' : '30px' }}>
            <div className="d-flex justify-content-between align-items-center bg-white position-relative"
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
              <span style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "4px",
                height: "70%",
                backgroundColor: "#1F7FFF",
                borderRadius: "1px 10px 1px 10px",
              }}></span>

              <div className="d-flex align-items-center" style={{ gap: "24px" }}>
                <div className="d-flex flex-column" style={{ gap: "11px" }}>
                  <h6 className="mb-0" style={{
                    fontSize: "14px",
                    color: "#727681",
                    fontWeight: "500",
                  }}>
                    {stat.title}
                  </h6>
                  <div className="d-flex align-items-end gap-2">
                    <h5 className="mb-0" style={{
                      fontSize: "22px",
                      color: "#0E101A",
                      fontWeight: "600",
                    }}>
                      {stat.value}
                    </h5>
                    {stat.currency && (
                      <span style={{ fontSize: "14px", color: "#0E101A" }}>
                        {stat.currency}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-center align-items-center rounded-circle"
                style={{
                  width: "50px",
                  height: "50px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5F0FF",
                  flexShrink: 0,
                }}
              >
                <img src={stat.image} alt={stat.title} style={{
                  width: "36px",
                  height: "36px",
                  objectFit: "contain",
                }} />
              </div>
            </div>
          </Link>
        ))}
      </div> */}

      {/* Main Content */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "16px",
        overflowX: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {/* Tabs and Search */}
        <div
          // className="d-flex"
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            height: "33px",
          }}>
          <div
            // className="col-md-6 d-flex align-items-center" 
            style={{
              display: "flex",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              flexWrap: "wrap",
              maxWidth: "50%",
              width: "fit-content",
              height: "33px",
            }}
          >
            {initialTabs.map((tab) => {
              const active = activeTab === tab.label;
              return (
                <div
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  role="button"
                  style={{
                    padding: "4px 12px",
                    background: active ? "white" : "transparent",
                    borderRadius: 8,
                    boxShadow: active ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
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
              );
            })}
          </div>

          <div className="d-flex align-items-center gap-4" style={{
            display: "flex",
            justifyContent: "end",
            gap: "24px",
            height: "33px",
            width: "50%",
          }}>
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
                placeholder="Search by Order No. or Customer..."
                value={search} onChange={(e) => setSearch(e.target.value)}
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
            {hasPermission(user, "Sales", "export") && (
              <button
                onClick={handleExport}
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
                  cursor: 'pointer'
                }}>
                <TbFileExport className="fs-5" style={{ color: "#6C748C", marginRight: "10px" }} />
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
            maxHeight: '500px',
          }}>
          <table
            style={{
              width: "100%",
              borderSpacing: "0 0px",
              fontFamily: "Inter",
            }}
          >
            <thead style={{ position: "sticky", top: 0, zIndex: 9 }}>
              <tr style={{ backgroundColor: "#F3F8FB", textAlign: "left" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 120,
                    fontWeight: "400",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      style={{ width: 18, height: 18 }}
                      onChange={(e) => {
                        const next = new Set(selectedRowIds);
                        if (e.target.checked) {
                          // Add only current page items
                          sales.forEach(s => next.add(s._id));
                        } else {
                          // Remove only current page items
                          sales.forEach(s => next.delete(s._id));
                        }
                        setSelectedRowIds(next);
                      }}
                    />
                    Order No.
                  </div>
                </th>
                {/* <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Order No.
                  <HiOutlineArrowsUpDown style={{ marginLeft: "10px" }} />
                </th> */}
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Customer Name
                </th>
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Quantity
                </th>
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Total Amount
                </th>
                {/* <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Due Amount
                </th> */}
                <th style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
                  Order Status
                </th>
                <th className="text-center" style={{
                  padding: "12px 16px",
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: 400,
                  fontFamily: '"Inter", sans-serif',
                }}>
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
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-3">
                    No Record Found
                  </td>
                </tr>
              ) : (
                sales.map((sale, idx) => {
                  const statusStyle = orderStatusStyles[sale.status?.toLowerCase()] || orderStatusStyles.draft;
                  return (
                    <React.Fragment key={sale._id}>
                      <tr 
                      // onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === idx ? null : idx) }}
                      onClick={(e) =>{e.stopPropagation();
                        navigate(`/create-sales-order/${sale._id}`, {
                          state:{
                            from:"/online-orders",
                            mode:"view"
                          }
                        })
                      } }
                        className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                        style={{
                          borderBottom: "1px solid #EAEAEA",
                          height: "46px",
                          cursor:"pointer"
                        }}>
                        <td
                          onClick={(e) => e.stopPropagation()}
                          style={{ padding: "8px 16px", verticalAlign: "middle" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <input
                              type="checkbox"
                              style={{ width: 18, height: 18 }}
                              checked={selectedRowIds.has(sale._id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                const next = new Set(selectedRowIds);
                                next.has(sale._id) ? next.delete(sale._id) : next.add(sale._id);
                                setSelectedRowIds(next);
                              }}
                            />
                            <div style={{ fontSize: 14, color: "#0E101A", fontWeight: "500" }}>
                              {sale.orderNo || sale.invoiceNo}
                            </div>
                          </div>
                        </td>
                        {/* <td style={{ color: "#0E101A", padding: "6px 16px" }}>{sale.orderNo || sale.invoiceNo}</td> */}
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>{sale.customer}</td>
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>{sale.soldItems}</td>
                        <td style={{ color: "#0E101A", padding: "6px 16px" }}>₹{sale.totalAmount?.toFixed(2)}</td>
                        {/* <td style={{ padding: "6px 16px" }}>
                          {(() => {
                            const total = sale.totalAmount || 0;
                            const due = sale.dueAmount || 0;
                            const paid = total - due;

                            // FULL DUE -> Pending
                            if (due === total && due > 0) {
                              return (
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "4px 12px",
                                    borderRadius: "20px",
                                    background: "#F7F4D5",
                                    color: "#9A8700",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                  }}
                                >
                                  <span
                                    style={{
                                      width: "7px",
                                      height: "7px",
                                      borderRadius: "50%",
                                      background: "#9A8700",
                                    }}
                                  />
                                  Pending
                                </div>
                              );
                            }

                            // PARTIAL PAYMENT -> SHOW DUE AMOUNT IN RED
                            if (due > 0 && due < total) {
                              return (
                                <span
                                  style={{
                                    color: "#E53935",
                                    fontWeight: 500,
                                    fontSize: "14px",
                                  }}
                                >
                                  ₹{due.toFixed(2)}/-
                                </span>
                              );
                            }

                            // FULLY PAID
                            return (
                              <span
                                style={{
                                  color: "#1E9E52",
                                  fontWeight: 500,
                                  fontSize: "14px",
                                }}
                              >
                                Paid
                              </span>
                            );
                          })()}
                        </td> */}
                        {/* <td style={{ color: "#0E101A", padding: "6px 16px" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "2px 16px",
                            borderRadius: 50,
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            fontSize: 14,
                            whiteSpace: "nowrap",
                            fontWeight: 400,
                            fontFamily: '"inter" sans-serif"',
                          }}>
                            {sale.status?.charAt(0).toUpperCase() + sale.status?.slice(1)}
                          </div>
                        </td> */}
                        {/* <td style={{ padding: "6px 16px" }}>
                          {(() => {

                            const orderStatus = sale.dispatched ? "closed" : "open";

                            const style = orderStatusStyles[orderStatus];

                            return (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "4px 14px",
                                  borderRadius: "20px",
                                  background: style.bg,
                                  color: style.color,
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  minWidth: "78px",
                                }}
                              >
                                {orderStatus === "open" ? "Open" : "Closed"}
                              </div>
                            );
                          })()}
                        </td> */}

                        <td style={{ padding: "6px 16px" }}>
                          {sale.status === "converted_to_invoice" ? (
                            // If already converted, show a disabled badge or text
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "4px 14px",
                                borderRadius: "20px",
                                background: "#E5E7EB",
                                color: "#6B7280",
                                fontSize: "13px",
                                fontWeight: 500,
                                minWidth: "78px",
                              }}
                            >
                              Converted
                            </div>
                          ) : (
                            // Show convert button for non-converted orders
                            <div
                              style={{
                                position: "relative",
                                display: "inline-block",
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  setOpenConvertDropdownId(openConvertDropdownId === sale._id ? null : sale._id);

                                  const dropdownHeight = 120;
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  const spaceAbove = rect.top;

                                  if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                                    setConvertOpenUpwards(true);
                                    setConvertDropdownPos({
                                      x: rect.left,
                                      y: rect.top,
                                    });
                                  } else {
                                    setConvertOpenUpwards(false);
                                    setConvertDropdownPos({
                                      x: rect.left,
                                      y: rect.bottom + 6,
                                    });
                                  }
                                }}
                                disabled={convertingId === sale._id}
                                style={{
                                  padding: "4px 12px",
                                  background: "#f3f7ff",
                                  color: "#3b82f6",
                                  border: "1px solid #dbeafe",
                                  borderRadius: "16px",
                                  cursor: convertingId === sale._id ? "not-allowed" : "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  opacity: convertingId === sale._id ? 0.6 : 1,
                                }}
                              >
                                {convertingId === sale._id ? "Converting..." : "Convert to"}
                                <span
                                  style={{
                                    transform: openConvertDropdownId === sale._id ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "0.3s",
                                    display: "inline-block",
                                  }}
                                >
                                  <MdOutlineKeyboardArrowUp size={16} />
                                </span>
                              </button>

                              {/* Convert Dropdown */}
                              {openConvertDropdownId === sale._id && (
                                <div
                                  ref={convertDropdownRef}
                                  style={{
                                    position: "fixed",
                                    top: convertOpenUpwards ? convertDropdownPos.y - 120 : convertDropdownPos.y,
                                    left: convertDropdownPos.x,
                                    width: "180px",
                                    background: "#fff",
                                    borderRadius: "12px",
                                    boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
                                    border: "1px solid #e5e7eb",
                                    zIndex: 1000,
                                    overflow: "hidden",
                                    padding: "6px 0",
                                  }}
                                >
                                  <div
                                    onClick={() => convertToInvoice(sale)}
                                    style={{
                                      padding: "8px 16px",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                      transition: "0.2s",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f7ff")}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                  >
                                    <FaFileInvoice size={16} color="#3b82f6" />
                                    Sales Invoice
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "4px 16px",
                            position: "relative",
                            overflow: "visible",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}>
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
                                  ? dropdownPos.y - 150
                                  : dropdownPos.y,
                                left: dropdownPos.x - 120,
                                zIndex: 999999,
                              }}
                            >
                              <div ref={menuRef} style={{
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
                                onClick={(e) => e.stopPropagation()}
                              >
                                {menuItems(sale)
                                  .filter(item => hasPermission(user, "Sales", item.permission))
                                  .map((item) => (
                                    <div key={item.action} onClick={(e) => {
                                      e.stopPropagation();
                                      if (!item.disabled) {
                                        item.onClick();
                                        setOpenMenu(null);
                                      }
                                    }} style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "12px",
                                      padding: "8px 18px",
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: "14px",
                                      fontWeight: 500,
                                      cursor: item.disabled ? "not-allowed" : "pointer",
                                      transition: "0.2s",
                                      borderRadius: '8px',
                                      textDecoration: "none",
                                      color: item.disabled ? "#999" : "344054",
                                      opacity: item.disabled ? 0.5 : 1,
                                    }} onMouseEnter={(e) => {
                                      if (!item.disabled) {
                                        e.currentTarget.style.backgroundColor = "#e3f2fd";
                                      }
                                    }} onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                    }}>
                                      <span style={{ fontSize: "18px" }}>{item.icon}</span>
                                      <span>{item.label}</span>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* FIX 5: Expanded Row with correct colSpan */}
                      {expandedRow === idx && (
                        <tr>
                          <td colSpan="8" style={{ padding: 0, border: "none" }}>
                            <div style={{
                              maxHeight: expandedRow === idx ? "1000px" : "0px",
                              overflow: "hidden",
                              transition: "max-height 0.4s ease, padding 0.4s ease",
                              padding: expandedRow === idx ? "16px" : "0 16px",
                              backgroundColor: "#fff",
                            }}>
                              <div style={{ paddingBottom: "8px" }}>
                                <h6 style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#0E101A",
                                  margin: 0,
                                }}>
                                  Product Details for Order: {sale.orderNo || sale.invoiceNo}
                                </h6>
                              </div>

                              <div style={{ overflowX: "auto" }}>
                                <table className="table mb-0" style={{
                                  width: "100%",
                                  borderCollapse: "separate",
                                  borderSpacing: 0,
                                  fontSize: "14px",
                                  fontFamily: "Inter, sans-serif",
                                }}>
                                  <thead>
                                    <tr style={{ backgroundColor: "#F3F8FB" }}>
                                      {["Product Name", "Item BarCode", "Qty", "Unit Price", "Total"].map((h) => (
                                        <th key={h} style={{
                                          padding: "10px 16px",
                                          color: "#727681",
                                          fontWeight: 400,
                                          textAlign: "left",
                                        }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {/* {console.log("Salesdsds itemsdd:", sale.items)} */}
                                    {sale.items?.map((item, i) => (
                                      <tr key={i}>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          {item.productName}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          {item.itemBarcode || "-"}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          {item.qty}
                                        </td>
                                        {/* <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          {item.category}
                                        </td> */}
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          ₹{item.unitPrice?.toFixed(2)}
                                        </td>
                                        <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                                          ₹{item.total?.toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                }))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={pagination.page}
            total={pagination.totalPages * pagination.limit}
            itemsPerPage={pagination.limit}
            onPageChange={(page) =>
              setPagination(prev => ({ ...prev, page }))
            }
            onItemsPerPageChange={(val) =>
              setPagination(prev => ({ ...prev, limit: val, page: 1 }))
            }
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
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice ${selectedInvoice?.invoiceNo}? This action cannot be undone.${selectedInvoice?.status === "converted_to_invoice"
          ? " This sales order has been converted to invoice and cannot be deleted."
          : ""
          }`}
      />

    </div>
  );
};

export default Sales;