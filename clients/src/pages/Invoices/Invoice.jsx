import axios from "axios";
import { TbEye, TbTrash } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { MdNavigateNext, MdOutlineFileDownload, MdOutlineKeyboardArrowUp } from "react-icons/md";
import { GrFormPrevious, GrShareOption } from "react-icons/gr";
import DeleteAlert from "../../utils/sweetAlert/DeleteAlert";
import BASE_URL from "../config/config";
import { toast } from "react-toastify";
import api from "../../pages/config/axiosInstance"
import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ConfirmDeleteModal from "../../components/ConfirmDelete";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { hasPermission } from "../../utils/permission/hasPermission";
import { useAuth } from "../../components/auth/AuthContext";
import InvoiceAssignTransportModal from "../../components/features/Transporter/InvoiceAssignTransportModal";
import Dollarimg from "../../assets/images/dollar.png";
import Orderimg from "../../assets/images/order.png";
import Purchaseimg from "../../assets/images/purchaserupe.png";
import Dueamountimg from "../../assets/images/dueamount.png";
import DateFilterDropdown from "../../components/DateFilterDropdown";
import { format } from "date-fns";
import { IoPrint, IoPrintOutline } from "react-icons/io5";
import { InvoiceContent } from "../../pages/Invoices/PreviewInvoice";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";


// Pasted statsTop array
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

// Add menu items similar to customers
const menuItems = [
  {
    label: "View Details",
    icon: <TbEye size={18} />,
    action: "view",
  },
  // {
  //   label: "Convert to Sales Order",  // Add this
  //   icon: <MdOutlineFileDownload size={18} />,
  //   action: "convert",
  // },
  {
    label: "Create Credit Note",
    icon: <TbEye size={18} />,
    action: "credit_note",
  },
  //   {
  //   label: "Delete",
  //   icon: <TbTrash size={18} />,
  //   action: "delete",
  // },
  {
    label: "Print",
    icon: <IoPrint size={18} />,
    action: "print",
  },
  {
    label: "Create Delivery Challan",
    icon: <TbEye size={18} />,
    action: "delivery_challan",
  },
  {
    label: "Create E-way Bill",
    icon: <TbEye size={18} />,
    action: "Create E-way Bill", // 👈 Updated to match your switch-case block exactly
  },
  {
    label: "Assign Transport",
    icon: <TbEye size={18} />,
    action: "transport",
  },
  // {
  //   label: "Share",
  //   icon: <GrShareOption size={18} />,
  //   action: "share",
  // },
];

const Invoice = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [customer, setCustomer] = useState("");
  const [invoiceId, setInvoiceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [activeTab, setActiveTab] = useState("All");
  const [tabCounts, setTabCounts] = useState({ All: 0, Recent: 0, Paid: 0, Due: 0 });
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

  // Add state for stats
  const [initialStats, setInitialStats] = useState(statsTop);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgSelling: 0,
    duePayments: 0
  });

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

  // Add function to calculate stats from invoices
  const calculateStats = (invoicesData) => {
    const totalRevenue = invoicesData.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);
    const totalOrders = invoicesData.length;
    const avgSelling = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const duePayments = invoicesData.reduce((sum, inv) => sum + (inv.dueAmount || 0), 0);

    setStats({
      totalRevenue,
      totalOrders,
      avgSelling,
      duePayments
    });

    setInitialStats([
      {
        ...statsTop[0],
        value: `₹${totalRevenue?.toLocaleString('en-IN') || 0}`,
      },
      {
        ...statsTop[1],
        value: (totalOrders || 0).toLocaleString('en-IN'),
      },
      {
        ...statsTop[2],
        value: `₹${avgSelling?.toLocaleString('en-IN') || 0}`,
      },
      {
        ...statsTop[3],
        value: `₹${duePayments?.toLocaleString('en-IN') || 0}`,
      },
    ]);
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
      case "view":
        navigate(`/sales-invoice/${invoice._id}`, {
          state: { from: "/invoice" }
        });
        break;

      case "credit_note":
        try {
          toast.info("Preparing Credit Note...");
          // Fetch the full invoice data to pass to credit note
          const creditNoteResponse = await api.get(`/api/invoices/${invoice._id}`);
          if (creditNoteResponse?.data?.success) {
            const completeInvoice = creditNoteResponse.data.invoice;
            navigate("/credit-note", {
              state: {
                sourceInvoice: completeInvoice,
                isFromInvoice: true,
                autoFill: true,
                invoiceId: invoice._id,
              },
            });
            toast.success("Invoice data loaded for Credit Note");
          } else {
            toast.error("Failed to load invoice data");
          }
        } catch (error) {
          console.error("Credit note redirection issue:", error);
          toast.error(error?.response?.data?.message || "Failed to prepare Credit Note");
        }
        break;

      case "delivery_challan":
        try {
          toast.info("Preparing Delivery Challan...");
          // Fetch the full invoice data to pass to delivery challan
          const deliveryResponse = await api.get(`/api/invoices/${invoice._id}`);
          if (deliveryResponse?.data?.success) {
            const completeInvoice = deliveryResponse.data.invoice;
            navigate("/createdeliverychallan", {
              state: {
                sourceInvoice: completeInvoice,
                isFromInvoice: true,
                autoFill: true,
                invoiceId: invoice._id,
              },
            });
            toast.success("Invoice data loaded for Delivery Challan");
          } else {
            toast.error("Failed to load invoice data");
          }
        } catch (error) {
          console.error("Delivery challan redirection issue:", error);
          toast.error(error?.response?.data?.message || "Failed to prepare Delivery Challan");
        }
        break;


      // 🟢 UPDATED: Using the reliable Delivery Challan async-fetch concept
      case "Create E-way Bill":
        try {
          toast.info("Preparing E-Way Bill from invoice...");

          // Fetch the full structured invoice details from your server
          const response = await api.get(`/api/invoices/${invoice._id}`);

          if (response?.data?.success) {
            const completeInvoice = response.data.invoice;

            // Safely redirect to the matching hyphenated route path passing full nested metrics
            navigate("/create-ewaybill", {
              state: {
                sourceInvoice: completeInvoice,
                autoFill: true,
              },
            });
            toast.success("Invoice data synchronized successfully");
          } else {
            toast.error("Failed to load full invoice data");
          }
        } catch (error) {
          console.error("E-way bill redirection issue:", error);
          toast.error(
            error?.response?.data?.message || "Failed to prepare E-Way Bill page navigation"
          );
        }
        break;

      case "convert":
        await convertToSalesOrder(invoice);
        break;

      case "transport":
        setSelectedInvoiceForTransport(invoice);
        setShowAssignModal(true);
        break;

      case "share":
        await shareInvoice(
          invoice._id,
          invoice.customerId?.email,
          invoice.customerId?.phone
        );
        break;

      case "delete":
        setSelectedInvoice(invoice);
        setShowDeleteModal(true);
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
            const { InvoiceContent } = await import('../../pages/Invoices/PreviewInvoice');
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
        }
        break;

      default:
        break;
    }
  };

  // Fetch invoices from backend (CustomerInvoiceController)
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search, // matches invoiceNo search in controller
        customerId: customer || undefined,
      };
      // Handle different tabs
      if (activeTab === "Recent") {
        // Last 7 days
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        today.setHours(23, 59, 59, 999);

        params.startDate = sevenDaysAgo.toISOString();
        params.endDate = today.toISOString();
      }
      else if (activeTab === "Paid") {
        // Filter by status = "paid"
        params.status = "paid";
      }
      else if (activeTab === "Due") {
        // Filter by dueAmount > 0
        params.dueAmount = "gt_0"; // You can add this param to backend or filter client-side
      }
      // else if (startDate && endDate) {
      //   params.startDate = startDate;
      //   params.endDate = endDate;
      // }
      else if (dateRange.start && dateRange.end) {
        params.startDate = format(dateRange.start, 'yyyy-MM-dd') + 'T00:00:00.000Z';
        params.endDate = format(dateRange.end, 'yyyy-MM-dd') + 'T23:59:59.999Z';
      }
      // Remove empty params
      Object.keys(params).forEach((key) => {
        if (!params[key]) delete params[key];
      });
      const res = await api.get('/api/invoices', {
        params,
      });
      if (res.data?.success && Array.isArray(res.data.invoices)) {
        let invoicesData = res.data.invoices;

        // For "Due" tab, filter client-side
        if (activeTab === "Due") {
          invoicesData = invoicesData.filter(inv => (inv.dueAmount || 0) > 0);
        }

        setInvoices(invoicesData);  // ← use invoicesData, not res.data.invoices
        setTotal(res.data.total || 0);
        calculateStats(invoicesData);  // ← also pass invoicesData here

      } else {
        setInvoices([]);
        setTotal(0);
        calculateStats([]);
      }
    } catch (err) {
      // console.error("Failed to fetch invoices:", err);
      toast.error(err?.response?.data?.message || "Failed to fetch invoices");
      setInvoices([]);
      setTotal(0);
      calculateStats([]);
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
    // Get selected rows - works with your existing selectedInvoices array
    const selectedIds = Array.isArray(selectedInvoices)
      ? selectedInvoices
      : Array.from(selectedInvoices);

    if (selectedIds.length === 0) {
      toast.error("Select at least 1 row to export data");
      return;
    }

    try {
      // Get selected rows data
      const selectedRows = invoices.filter(inv => selectedIds.includes(inv._id));

      if (selectedRows.length === 0) {
        toast.error("No data available to export");
        return;
      }

      // Define columns for Excel
      const tableColumns = [
        "Invoice No.",
        "Customer Name",
        "Due Date",
        "Amount",
        "Paid",
        "Amount Due",
        "Status"
      ];

      // Prepare table rows
      const tableRows = selectedRows.map((inv) => [
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
      [20, 30, 18, 15, 15, 15, 18].forEach((width, i) => {
        worksheet.getColumn(i + 1).width = width;
      });

      // Add data rows
      tableRows.forEach((row) => worksheet.addRow(row));

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `invoices_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        fileName
      );

      toast.success(`Exported ${selectedRows.length} invoice(s) as Excel`);

    } catch (error) {
      console.error("Excel export error:", error);
      toast.error(error?.message || "Failed to generate Excel file");
    }
  };

  const tabs = [
    { label: "All", count: tabCounts.All, active: activeTab === "All" },
    { label: "Recent", count: tabCounts.Recent, active: activeTab === "Recent" },
    { label: "Paid", count: tabCounts.Paid, active: activeTab === "Paid" },
    { label: "Due", count: tabCounts.Due, active: activeTab === "Due" },
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

  const fetchTabCounts = async () => {
    try {
      const [allRes, recentRes, paidRes, dueRes] = await Promise.all([
        api.get('/api/invoices', { params: { page: 1, limit: 1 } }),
        api.get('/api/invoices', { params: { page: 1, limit: 1, startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString(); })(), endDate: new Date().toISOString() } }),
        api.get('/api/invoices', { params: { page: 1, limit: 1, status: 'paid' } }),
        api.get('/api/invoices', { params: { page: 1, limit: 1 } }),
      ]);

      const allDueRes = await api.get('/api/invoices', { params: { page: 1, limit: 99999 } });
      const dueCount = allDueRes.data.invoices.filter(inv => (inv.dueAmount || 0) > 0).length;

      setTabCounts({
        All: allRes.data.total || 0,
        Recent: recentRes.data.total || 0,
        Paid: paidRes.data.total || 0,
        Due: dueCount,
      });
    } catch (err) {
      // console.error("Failed to fetch tab counts", err);
    }
  };

  useEffect(() => {
    fetchTabCounts();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [activeTab, dateRange]);

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
            Sale Invoice
          </h2>
        </div>
        <div className="d-flex align-items-center gap-3" style={{ cursor: "pointer" }}>
          {/* <DateFilterDropdown onChange={handleDateChange} /> */}
          <DateFilterDropdown
            onChange={handleDateChange}
            selectedDateRange={dateRange}
            setSelectedDateRange={setDateRange}
          />
          {hasPermission(user, "Invoices", "create") && (
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
                + Create Invoice
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards Section - PASTED FROM SALES ORDER */}
      <div className="d-flex flex-wrap g-3 mb-3">
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
      </div>

      {/* main body */}
      <div
        style={{
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
        }}
      >
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
                  borderRadius: 8,
                  background: tab.active ? "white" : "transparent",
                  boxShadow: tab.active ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
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
                placeholder="Search by Invoice Number..."
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
                    width: 80,
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
                    Invoice No.
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 200,
                    fontWeight: '400'
                  }}
                >
                  Customer Name
                </th>
                <th style={{
                  textAlign: "left",
                  padding: "4px 16px",
                  color: "#727681",
                  fontSize: 14,
                  width: 160,
                  fontWeight: '400'
                }}>
                  Quantity
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 112,
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
                    width: 100,
                    fontWeight: '400'
                  }}
                >
                  Due Amount
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
                  Status
                </th> */}
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
                    fontWeight: '400'
                  }}
                >
                  Transport
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: 100,
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
                  <td colSpan="8" className="text-center py-4">
                    <div
                      className="spinner-border text-primary"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
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
                      >
                        <input
                          type="checkbox"
                          style={{ width: 18, height: 18, }}
                          checked={selectedInvoices.includes(inv._id)}
                          onClick={(e) => e.stopPropagation()}
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
                              color: "#0E101A",
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
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A", }}>{calculateTotalQty(inv.items)}</td>

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
                    {/* <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      ₹{Number(inv.paidAmount ?? 0).toFixed(2)}
                    </td> */}

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

                    {/* <td 
  onClick={(e) => e.stopPropagation()}
  style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A", textAlign: "center", fontWeight: "400" }}
>
  {inv.status !== "converted" ? (  // Check if not already converted
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          const rect = e.currentTarget.getBoundingClientRect();
          
          setOpenConvertDropdownId(
            openConvertDropdownId === inv._id ? null : inv._id
          );
          
          const dropdownHeight = 100;
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
        style={{
          padding: "4px 10px",
          background: "#f3f7ff",
          color: "#3b82f6",
          border: "1px solid #dbeafe",
          borderRadius: "16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "14px",
        }}
        disabled={convertingId === inv._id}
      >
        {convertingId === inv._id ? (
          <div className="spinner-border spinner-border-sm" style={{ width: "12px", height: "12px" }} />
        ) : (
          <>
            Convert to
            <span
              style={{
                transform: openConvertDropdownId === inv._id ? "rotate(180deg)" : "rotate(0deg)",
                transition: "0.3s",
                display: "inline-block",
              }}
            >
              <MdOutlineKeyboardArrowUp />
            </span>
          </>
        )}
      </button>
      
      {openConvertDropdownId === inv._id && (
        <div
          ref={convertDropdownRef}
          style={{
            position: "fixed",
            top: convertOpenUpwards ? convertDropdownPos.y - 100 : convertDropdownPos.y,
            left: convertDropdownPos.x,
            width: "180px",
            background: "#fff",
            borderRadius: "18px",
            boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
            border: "1px solid #e5e7eb",
            zIndex: 1000,
            overflow: "hidden",
            padding: "8px",
          }}
        >
          <div
            onClick={() => convertToSalesOrder(inv)}
            style={{
              padding: "8px 20px",
              cursor: "pointer",
              fontSize: "14px",
              transition: "0.2s",
              borderRadius: "18px",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f7ff")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Sales Order
          </div>
        </div>
      )}
    </div>
  ) : (
    <span style={{ fontSize: "12px", color: "#999" }}>
      Converted
    </span>
  )}
</td> */}
                    {/* <td
  onClick={(e) => {
    e.stopPropagation();
    // Only allow clicking on Open status AND when transporter is assigned
    if (!inv.dispatched && inv.transporterId) {
      setSelectedInvoiceForDispatch(inv);
      setShowDispatchModal(true);
    } else if (!inv.dispatched && !inv.transporterId) {
      toast.warning("Please assign a transporter first before dispatching");
    }
  }}
  style={{ 
    padding: "6px 16px", 
    cursor: (!inv.dispatched && inv.transporterId) ? "pointer" : "default" 
  }}
>
  {(() => {
    const orderStatus = inv.dispatched ? "closed" : "open";
    const style = orderStatusStyles[orderStatus];
    return (
      <div
      title={(!inv.dispatched && !inv.transporterId) ? "Assign transporter first to dispatch" : ""}
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
          opacity: (!inv.dispatched && !inv.transporterId) ? 0.6 : 1,
        }}
      >
        {orderStatus === "open" ? "Open" : "Closed"}
      </div>
    );
  })()}
</td> */}
                    {/* <td 
  onClick={(e) => e.stopPropagation()}
  style={{ padding: "8px 16px", fontSize: 14 }}
>
  {inv.transporterId ? (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "20px",
        backgroundColor: "#E8F5E9",
        color: "#2E7D32",
        fontSize: "12px",
        fontWeight: 500
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2E7D32", display: "inline-block" }} />
      Assigned
    </span>
  ) : (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "20px",
        backgroundColor: "#FFF3E0",
        color: "#ED6C02",
        fontSize: "12px",
        fontWeight: 500
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ED6C02", display: "inline-block" }} />
      Not Assigned
    </span>
  )}
</td> */}
                    {/* <td 
  onClick={(e) => e.stopPropagation()}
  style={{ padding: "8px 16px", fontSize: 14 }}
>
  {(() => {
    // Check if ANY transport details are assigned
    const hasLR = inv.lrNo;
    const hasRR = inv.railwayReceiptNo || inv.wagonNo || inv.trainNo;
    const hasRailways = inv.railwayWagonNo || inv.railwayTrainNo || inv.rrbNo;
    const hasTransporter = inv.transporterId;
    
    const isAssigned = hasTransporter || hasLR || hasRR || hasRailways;
    
    return isAssigned ? (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "20px",
          backgroundColor: "#E8F5E9",
          color: "#2E7D32",
          fontSize: "12px",
          fontWeight: 500
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2E7D32", display: "inline-block" }} />
        Assigned
      </span>
    ) : (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "20px",
          backgroundColor: "#FFF3E0",
          color: "#ED6C02",
          fontSize: "12px",
          fontWeight: 500
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ED6C02", display: "inline-block" }} />
        Not Assigned
      </span>
    );
  })()}
</td> */}

                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ padding: "8px 16px", fontSize: 14 }}
                    >
                      {(() => {
                        // Check invoice's own transport fields
                        const hasInvoiceTransport = inv.transporterId || inv.lrNo || inv.railwayReceiptNo || inv.rrbNo;

                        // Check if there's a related shipment with transport (if shipment data is populated)
                        const hasShipmentTransport = inv.shipmentId && (
                          inv.shipmentId.transporterId ||
                          inv.shipmentId.lrNo ||
                          inv.shipmentId.railwayReceiptNo
                        );

                        // Also check if shipmentNo exists (indicates shipment was created)
                        const hasShipmentNo = inv.shipmentNo;

                        const isAssigned = hasInvoiceTransport || hasShipmentTransport || hasShipmentNo;

                        return isAssigned ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              backgroundColor: "#E8F5E9",
                              color: "#2E7D32",
                              fontSize: "12px",
                              fontWeight: 500
                            }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#2E7D32", display: "inline-block" }} />
                            Assigned
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "20px",
                              backgroundColor: "#FFF3E0",
                              color: "#ED6C02",
                              fontSize: "12px",
                              fontWeight: 500
                            }}
                          >
                            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ED6C02", display: "inline-block" }} />
                            Not Assigned
                          </span>
                        );
                      })()}
                    </td>
                    {/* status */}
                    {/* <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      <span
                        className={`badge badge-soft-${(inv.status === "paid" ? "success" : "danger")} badge-xs shadow-none`}
                      >
                        <i className="ti ti-point-filled me-1" />
                        {inv.status || "-"}
                      </span>
                    </td> */}

                    {/* action */}
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
      {/* Invoice assign transport */}
      <InvoiceAssignTransportModal
        show={showAssignModal}
        closeModal={() => {
          setShowAssignModal(false);
          setSelectedInvoiceForTransport(null);
        }}
        invoice={selectedInvoiceForTransport}
        onSuccess={() => {
          fetchInvoices();
        }}
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
    </div>
  );
};

export default Invoice;


