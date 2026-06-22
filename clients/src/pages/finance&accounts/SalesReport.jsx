import React, { useEffect, useState, useRef, useMemo } from "react";
import { IoIosSearch } from "react-icons/io";
import { FaBarcode } from "react-icons/fa6";
import { TbFileExport } from "react-icons/tb";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import api from "../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";
import { hasPermission } from "../../utils/permission/hasPermission";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../components/auth/AuthContext";
import DateFilterDropdown from "../../components/DateFilterDropdown";
import Dollarimg from "../../assets/images/dollar.png";
import Orderimg from "../../assets/images/order.png";
import Purchaseimg from "../../assets/images/profit-cash.png";
import Dueamountimg from "../../assets/images/number-one.png";
import KasperLogo from "../../assets/images/kasper-logo.png";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import PreviewInvoice from "../../pages/Invoices/PreviewInvoice";

function SalesReport() {
  const [companyImages, setCompanyImages] = useState(null);
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const res = await api.get("/api/companyprofile/get");
        if (res.status === 200) {
          setCompanyImages(res.data.data);
        }
      } catch (error) {
      }
    };
    fetchCompanyDetails();
  }, []);

  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [salesData, setSalesData] = useState([]);
  const [salesLength, setSalesLength] = useState(0);
  const [posSales, setPosSales] = useState([]);
  const [posSalesLength, setPosSalesLength] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [posSearch, setPosSearch] = useState("");
  const [viewBarcode, setViewBarcode] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [productInventory, setProductInventory] = useState({}); // Store product inventory
  const [activeRow, setActiveRow] = useState(null);
  const [selectedProductInvoices, setSelectedProductInvoices] = useState([]);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [aggregatedProducts, setAggregatedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [posCurrentPage, setPosCurrentPage] = useState(1);
  const [posItemsPerPage, setPosItemsPerPage] = useState(10);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [filteredPosSales, setFilteredPosSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({ startDate: null, endDate: null });
  const [selectedSalesIds, setSelectedSalesIds] = useState(new Set());
  const [selectedPosIds, setSelectedPosIds] = useState(new Set());
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState(null);
  const [allCurrentPage, setAllCurrentPage] = useState(1);
  const [allItemsPerPage, setAllItemsPerPage] = useState(10);
  const [allSearch, setAllSearch] = useState("");
  const [filteredCombined, setFilteredCombined] = useState([]);

  const totalItems = filteredInvoices.length;
  const totalPosItems = filteredPosSales.length;

  const currentPageInvoices = (() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(startIndex, startIndex + itemsPerPage);
  })();

  const currentPagePosSales = (() => {
    const startIndex = (posCurrentPage - 1) * posItemsPerPage;
    return filteredPosSales.slice(startIndex, startIndex + posItemsPerPage);
  })();

  // Combine direct sales and POS data
  const combinedData = useMemo(() => {
    const directSales = filteredInvoices.map((inv) => ({
      _id: inv._id,
      date: inv.invoiceDate,
      invoiceNo: inv.invoiceNo,
      source: "Sale",
      customerName: inv.customerId?.name || "-",
      noOfProducts: inv.items?.length || 0,
      totalAmount: inv.grandTotal || 0,
      profit: null, // not available for direct sales
      tax: inv.totalTax || 0,
      extraDiscount: inv.additionalDiscount?.amt || 0,
      dueAmount: inv.dueAmount || 0,
      billingAddress: inv.billingAddress || "-",
      assignedVehicle: inv.vehicleId?.vehicleNumber || "-",
      assignedDriver: inv.driverId?.driverName || "-",
      transportCharges: inv.additionalChargesDetails?.shipping || 0,
      soldBy: inv.createdBy?.name || "-",
      _raw: inv,
      _type: "direct",
    }));

    const pos = filteredPosSales.map((pos) => ({
      _id: pos._id,
      date: pos.createdAt,
      invoiceNo: pos.invoiceNumber,
      source: "POS",
      customerName: pos.customer?.customerId?.name || "-",
      noOfProducts: pos.items?.length || 0,
      totalAmount: pos.totals?.totalAmount || 0,
      profit: pos.totals?.totalProfit || 0,
      tax: pos.totals?.tax || 0,
      extraDiscount: pos.totals?.overallDiscount || 0,
      dueAmount: pos.paymentDetails?.dueAmount || 0,
      soldBy: pos.createdBy?.name || "-",
      _raw: pos,
      _type: "pos",
    }));

    return [...directSales, ...pos].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [filteredInvoices, filteredPosSales]);

  // Keep filteredCombined in sync whenever combinedData or allSearch changes
  useEffect(() => {
    if (!allSearch) {
      setFilteredCombined(combinedData);
    } else {
      const term = allSearch.toLowerCase();
      setFilteredCombined(
        combinedData.filter(
          (row) =>
            row.invoiceNo?.toLowerCase().includes(term) ||
            row.customerName?.toLowerCase().includes(term)
        )
      );
    }
    setAllCurrentPage(1);
  }, [combinedData, allSearch]);

  const currentPageAllSales = (() => {
    const startIndex = (allCurrentPage - 1) * allItemsPerPage;
    return filteredCombined.slice(startIndex, startIndex + allItemsPerPage);
  })();

  const tabs = [
    { label: "All", count: combinedData.length, active: true },
    { label: "Direct Sales", count: filteredInvoices.length, active: false },
    { label: "POS", count: filteredPosSales.length, active: false },
  ];

  const fetchAllSalesData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/invoices", { params: { page: 1, limit: 1000 } });

      setSalesLength(response.data?.total || 0); // Update salesLength state
      if (response.data?.success && Array.isArray(response.data.invoices)) {
        const sales = response.data.invoices;
        setSalesLength(sales.length);
        setSalesData(sales);
        setFilteredInvoices(applyDateFilter(sales, selectedDateRange, "invoiceDate"));
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error("Failed to load sales report");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchAllSalesData(); }, []);

  // Fetch sales transactions-------------------------------------------------------------------------------------------------
  const fetchPosSales = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/pos-sales/transactions", { params: { page: 1, limit: 1000 } });
      const sales = response?.data?.data;
      const salesArr = Array.isArray(sales) ? sales : [];
      setPosSales(salesArr);
      setFilteredPosSales(applyDateFilter(salesArr, selectedDateRange, "createdAt"));
      setPosSalesLength(sales?.length || 0);
      setCurrentPage(1);
    } catch (error) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to load POS transactions",);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchPosSales(); }, []);

  // ─── search for Sales ─────────────────────────────────────────────────────────────────
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearch(term);
    setCurrentPage(1);
    const dateFiltered = applyDateFilter(salesData, selectedDateRange, "invoiceDate");
    if (!term) {
      setFilteredInvoices(dateFiltered);
    } else {
      setFilteredInvoices(
        dateFiltered.filter(
          (inv) =>
            inv.invoiceNo?.toLowerCase().includes(term.toLowerCase()) ||
            inv.customerId?.name?.toLowerCase().includes(term.toLowerCase())
        )
      );
    }
  };

  // ─── sales checkbox ───────────────────────────────────────────────────────────────
  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedSalesIds((prev) => {
        const next = new Set(prev);
        currentPageInvoices.forEach((inv) => next.add(inv._id));
        return next;
      });
    } else {
      setSelectedSalesIds((prev) => {
        const next = new Set(prev);
        currentPageInvoices.forEach((inv) => next.delete(inv._id));
        return next;
      });
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedSalesIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── search for POS Sales ─────────────────────────────────────────────────────────────────
  const handlePosSearch = (e) => {
    const term = e.target.value;
    setPosSearch(term);
    setPosCurrentPage(1);
    const dateFiltered = applyDateFilter(posSales, selectedDateRange, "createdAt");
    if (!term) {
      setFilteredPosSales(dateFiltered);
    } else {
      setFilteredPosSales(
        dateFiltered.filter(
          (pos) =>
            pos.invoiceNumber?.toLowerCase().includes(term.toLowerCase()) ||
            pos.customer?.customerId?.name?.toLowerCase().includes(term.toLowerCase())
        )
      );
    }
  };

  // ─── pos checkbox ───────────────────────────────────────────────────────────────
  const togglePosSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPosIds((prev) => {
        const next = new Set(prev);
        currentPagePosSales.forEach((pos) => next.add(pos._id));
        return next;
      });
    } else {
      setSelectedPosIds((prev) => {
        const next = new Set(prev);
        currentPagePosSales.forEach((pos) => next.delete(pos._id));
        return next;
      });
    }
  };

  const togglePosSelectRow = (id) => {
    setSelectedPosIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Fetch product inventory ─────────────────────────────────────────────────────
  const fetchProductInventory = async () => {
    try {
      const response = await api.get("/api/products");

      const inventoryMap = {};

      response.data.products.forEach((product) => {
        inventoryMap[product._id] = product.stockQuantity;

        if (product.itemBarcode) {
          inventoryMap[product.itemBarcode] = product.stockQuantity;
        }

        if (product.productName) {
          inventoryMap[product.productName] = product.stockQuantity;
        }
      });

      setProductInventory(inventoryMap);
    } catch (error) {
      // console.error("Error fetching inventory:", error);
    }
  };

  // Calculate product statistics from sales data with search filtering
  const calculateProductStats = (sales, searchTerm = "") => {
    const productMap = new Map();
    let totalRevenue = 0;
    let totalUnitsSold = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.totalAmount || 0;

      if (sale.items && sale.items.length > 0) {
        sale.items.forEach((item) => {
          const productId = item.productId || item.productName;
          const productName = item.productName?.toLowerCase() || "";
          // const productCode = item.itemBarcode || productId;
          const productCode = normalizeCode(item.itemBarcode);

          // Filter by search term if provided
          if (
            searchTerm &&
            !productName.includes(searchTerm.toLowerCase()) &&
            // !productCode.toLowerCase().includes(searchTerm.toLowerCase())
            !String(productCode).toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            return; // Skip if doesn't match search
          }

          if (!productMap.has(productId)) {
            productMap.set(productId, {
              id: productId,
              name: item.productName,
              code: productCode,
              unitSold: 0,
              revenue: 0,
              availableQty:
                productInventory[item.productId] ??
                productInventory[item.itemBarcode] ??
                productInventory[item.productName] ??
                0,

              unitPrice: item.unitPrice || 0,
            });
          }

          const product = productMap.get(productId);
          const qty = parseInt(item.qty) || 0;
          product.unitSold += qty;
          product.revenue += item.total || (item.unitPrice || 0) * qty;
          totalUnitsSold += qty;
        });
      }
    });

    // Convert to array and sort by unitSold (descending)
    const productsArray = Array.from(productMap.values()).sort(
      (a, b) => b.unitSold - a.unitSold,
    );

    return {
      products: productsArray,
      totalProducts: productsArray.length,
      totalRevenue,
      totalUnitsSold,
    };
  };

  const fetchProductInvoices = async (productId, productName) => {
    setLoadingInvoices(true);
    try {
      // Get all sales that contain this product
      const response = await api.get("/api/invoices/sales/list", {
        params: {
          limit: 100, // Get enough records
          page: 1
        }
      });

      if (response.data.success) {
        // Filter invoices that contain this product
        const invoicesWithProduct = response.data.data.sales.filter(sale =>
          sale.items?.some(item =>
            item.productId === productId ||
            item.productName?.toLowerCase().includes(productName.toLowerCase())
          )
        );

        setSelectedProductInvoices(invoicesWithProduct);
        setShowInvoicesModal(true);
      }
    } catch (error) {
      console.error("Error fetching product invoices:", error);
      toast.error("Failed to load invoices for this product");
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Show barcode modal
  const showBarcode = (product) => {
    if (!product.code || product.code === "NA") return;
    setSelectedBarcode(product);
    setViewBarcode(true);
  };

  // Close barcode modal
  const closeBarcode = () => {
    setViewBarcode(false);
    setSelectedBarcode(null);
  };

  // Recalculate when product inventory updates
  useEffect(() => {
    if (salesData.length > 0 && Object.keys(productInventory).length > 0) {
      const productStats = calculateProductStats(
        salesData,
        search,
        productInventory,
      );
      setAggregatedProducts(productStats.products);
      setFilteredProducts(productStats.products);

      const total = productStats.products.length;

    }
  }, [productInventory, salesData, search]);

  // Initial data fetch
  useEffect(() => {
    fetchAllSalesData();
  }, []);

  // Close barcode when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewBarcode && !event.target.closest(".barcode-modal")) {
        closeBarcode();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode]);

  // Handle Barcode rendering for list view popup
  useEffect(() => {
    if (viewBarcode && selectedBarcode && selectedBarcode.code) {
      setTimeout(() => {
        const element = document.getElementById(
          `barcode-svg-${selectedBarcode.code}`,
        );
        if (element) {
          try {
            let format = "CODE128";
            // if (/^\d{12,13}$/.test(selectedBarcode.code)) format = "EAN13";
            JsBarcode(element, selectedBarcode.code, {
              format: format,
              lineColor: "#000",
              width: 2,
              height: 100,
              displayValue: true,
            });
          } catch (e) {
            // Fallback or retry
            try {
              JsBarcode(element, selectedBarcode.code, {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
              });
            } catch (err) {
              // console.error("Barcode generation failed", err);
            }
          }
        }
      }, 100);
    }
  }, [viewBarcode, selectedBarcode]);

  const normalizeCode = (code) => {
    const v = String(code ?? "").trim();
    if (!v) return "NA";
    const low = v.toLowerCase();
    if (low === "na" || low === "n/a" || low === "null" || low === "undefined") return "NA";
    return v;
  };

  const hasBarcode = (code) => normalizeCode(code) !== "NA";

  const handleProductClick = (product) => {
    // This would need actual invoice data
    // For now, you might navigate to a filtered list
    navigate(`/sales-invoices?product=${product.id}`);
  };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = {};
      // Add date range filter if both dates are selected
      const res = await api.get("/api/customers/active-customers", { params });
      setCustomers(res.data?.customers || []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || "Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/vehicle/active-vehicles");
      let data = res.data.vehicle || [];
      setVehicles(data);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/driver/active-drivers");
      let data = res.data.driver || [];
      setDrivers(data);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load drivers");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/api/user/getuser`);
      setUsers(res.data || []);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load users");
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleExport = () => {
    if (selectedSalesIds.size === 0) {
      toast.warning("Please select at least one row to export");
      return;
    }
    const toExport = filteredInvoices.filter((inv) => selectedSalesIds.has(inv._id));
    if (!toExport.length) { toast.warning("No rows to export"); return; }

    try {
      const doc = new jsPDF("portrait", "mm", "a4");
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = companyImages?.companyLogo || KasperLogo;
      img.onload = () => {
        doc.addImage(img, "PNG", 10, 8, 38, 14);
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("SALES REPORT", 200, 15, { align: "right" });
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const { startDate: sd, endDate: ed } = selectedDateRange;
        doc.text(
          sd && ed
            ? `${format(sd, "dd/MM/yy")} - ${format(ed, "dd/MM/yy")}`
            : "All dates",
          200, 22, { align: "right" }
        );

        const tableData = toExport.map((inv, i) => [
          i + 1,
          inv.invoiceNo || "-",
          inv.customerId?.name || "-",
          new Date(inv.invoiceDate).toLocaleDateString("en-IN"),
          `₹${inv.grandTotal || 0}`,
          inv.createdBy?.name || "-",
        ]);

        autoTable(doc, {
          startY: 38,
          head: [["SR.", "Invoice No.", "Customer", "Date", "Total Amount", "Sold By"]],
          body: tableData,
          theme: "grid",
          headStyles: { fillColor: [210, 214, 219], textColor: [0, 0, 0], fontSize: 9 },
          bodyStyles: { fontSize: 9 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 10, right: 10 },
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
        }

        doc.save(`sales_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`);
        toast.success(`Exported ${toExport.length} row(s) as PDF`);
        setSelectedSalesIds(new Set());
      };
      img.onerror = () => toast.error("Failed to load logo");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  const handleExcel = async () => {
    try {
      if (activeTab === "All") {
        const selectedRows = filteredCombined.filter(
          (row) =>
            (row._type === "direct" && selectedSalesIds.has(row._id)) ||
            (row._type === "pos" && selectedPosIds.has(row._id))
        );
        if (selectedRows.length === 0) { toast.error("Select at least 1 row to export data"); return; }

        const tableColumns = ["SR.", "Date", "Invoice No.", "Sales Source", "Customer",
          "No. Of Products", "Total Amount", "Profit", "Tax Amount", "Extra Discount",
          "Due Amount", "Billing Address", "Assigned Vehicle", "Assigned Driver",
          "Transport Charges", "Sold By"];

        const tableRows = selectedRows.map((row, i) => [
          i + 1,
          new Date(row.date).toLocaleString("en-GB", { day: "2-digit", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
          row.invoiceNo || "-",
          row.source,
          row.customerName,
          row.noOfProducts,
          row.totalAmount,
          row.profit ?? "-",
          row.tax,
          row.extraDiscount,
          row.dueAmount,
          row.billingAddress,
          row.assignedVehicle,
          row.assignedDriver,
          row.transportCharges,
          row.soldBy,
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Report");
        [6, 22, 18, 14, 20, 16, 16, 14, 14, 16, 14, 24, 20, 20, 18, 18].forEach((w, i) => {
          worksheet.getColumn(i + 1).width = w;
        });
        const headerRow = worksheet.addRow(tableColumns);
        headerRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "99c5ff" } };
          cell.border = {
            top: { style: "thin", color: { argb: "338bff" } },
            left: { style: "thin", color: { argb: "338bff" } },
            bottom: { style: "thin", color: { argb: "338bff" } },
            right: { style: "thin", color: { argb: "338bff" } },
          };
        });
        tableRows.forEach((row) => worksheet.addRow(row));

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          `all_sales_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`);
        toast.success("Sales Report exported successfully!");
        setSelectedSalesIds(new Set());
        setSelectedPosIds(new Set());
        return; // ← important, don't fall through
      }
      if (activeTab === "Direct Sales") {
        if (selectedSalesIds.size === 0) { toast.error("Select atleast 1 row to export data"); return; }

        const toExport = filteredInvoices.filter((inv) => selectedSalesIds.has(inv._id));
        if (!toExport.length) { toast.error("No data available to export"); return; }

        const tableColumns = ["SR.", "Date", "Invoice No.", "Sales Source", "Customer", "No. Of Products", "Total Amount", "Tax Amount", "Extra Discount", "Due Amount", "Billing Address", "Assigned Vehicle", "Assigned Driver", "Transport Charges", "Sold By"];
        const tableRows = toExport.map((inv, i) => [
          i + 1,
          new Date(inv.invoiceDate).toLocaleString("en-GB", { day: "2-digit", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
          inv.invoiceNo || "-",
          "Sale",
          inv.customerId?.name || "-",
          inv.items?.length || 0,
          inv.grandTotal || 0,
          inv.totalTax || 0,
          inv.additionalDiscount?.amt || 0,
          inv.dueAmount || 0,
          inv.billingAddress || "-",
          inv.vehicleId?.vehicleNumber || "-",
          inv.driverId?.driverName || "-",
          inv.additionalChargesDetails?.shipping || 0,
          inv.createdBy?.name || "-",
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sales Report");

        [6, 22, 18, 14, 20, 16, 16, 14, 16, 14, 24, 20, 20, 18, 18].forEach((w, i) => {
          worksheet.getColumn(i + 1).width = w;
        });

        const headerRow = worksheet.addRow(tableColumns);
        headerRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "99c5ff" } };
          cell.border = {
            top: { style: "thin", color: { argb: "338bff" } },
            left: { style: "thin", color: { argb: "338bff" } },
            bottom: { style: "thin", color: { argb: "338bff" } },
            right: { style: "thin", color: { argb: "338bff" } },
          };
        });

        tableRows.forEach((row) => worksheet.addRow(row));

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `sales_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`);
        toast.success("Sales Report Excel file downloaded successfully!");
        setSelectedSalesIds(new Set());

      } else {
        if (selectedPosIds.size === 0) { toast.error("Select atleast 1 row to export data"); return; }

        const toExport = filteredPosSales.filter((pos) => selectedPosIds.has(pos._id));
        if (!toExport.length) { toast.error("No data available to export"); return; }

        const tableColumns = ["SR.", "Date", "Invoice No.", "Sales Source", "Customer", "No. Of Products", "Total Amount", "Profit", "Tax Amount", "Extra Discount", "Due Amount", "Sold By"];
        const tableRows = toExport.map((pos, i) => [
          i + 1,
          new Date(pos.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }),
          pos.invoiceNumber || "-",
          "POS",
          pos.customer?.customerId?.name || "-",
          pos.items?.length || 0,
          pos.totals?.totalAmount || 0,
          pos.totals?.totalProfit || 0,
          pos.totals?.tax || 0,
          pos.totals?.overallDiscount || 0,
          pos.paymentDetails?.dueAmount || 0,
          pos.createdBy?.name || "-",
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("POS Sales Report");

        [6, 22, 18, 14, 20, 16, 16, 14, 16, 14, 18, 16].forEach((w, i) => {
          worksheet.getColumn(i + 1).width = w;
        });

        const headerRow = worksheet.addRow(tableColumns);
        headerRow.eachCell((cell) => {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "99c5ff" } };
          cell.border = {
            top: { style: "thin", color: { argb: "338bff" } },
            left: { style: "thin", color: { argb: "338bff" } },
            bottom: { style: "thin", color: { argb: "338bff" } },
            right: { style: "thin", color: { argb: "338bff" } },
          };
        });

        tableRows.forEach((row) => worksheet.addRow(row));

        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `pos_sales_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`);
        toast.success("POS Sales Report Excel file downloaded successfully!");
        setSelectedPosIds(new Set());
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const computedStats = useMemo(() => {
    let totalRevenue, productsSold, grossProfit, totalOrders;

    if (activeTab === "All") {
      totalRevenue = (filteredCombined.reduce((sum, r) => sum + (r.totalAmount || 0), 0)).toFixed(2);
      productsSold = (filteredCombined.reduce((sum, r) => sum + (r.noOfProducts || 0), 0));
      grossProfit = (filteredCombined.reduce((sum, r) => sum + (r.profit || 0), 0)).toFixed(2);
      totalOrders = filteredCombined.length;
    } else if (activeTab === "Direct Sales") {
      totalRevenue = (filteredInvoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0)).toFixed(2);
      productsSold = (filteredInvoices.reduce((sum, inv) => sum + (inv.items?.length || 0), 0));
      grossProfit = (filteredInvoices.reduce((sum, inv) => sum + (inv.profit || 0), 0)).toFixed(2);
      totalOrders = filteredInvoices.length;
    } else {
      totalRevenue = (filteredPosSales.reduce((sum, pos) => sum + (pos.totals?.totalAmount || 0), 0)).toFixed(2);
      productsSold = filteredPosSales.reduce((sum, pos) => sum + (pos.items?.length || 0), 0);
      grossProfit = (filteredPosSales.reduce((sum, pos) => sum + (pos.totals?.totalProfit || 0), 0)).toFixed(2);
      totalOrders = filteredPosSales.length;
    }

    return [
      { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, currency: "", image: Dollarimg, link: "" },
      { title: "Product Sold", value: productsSold, currency: "", image: Orderimg, link: "" },
      { title: "Gross Profit", value: `₹${grossProfit.toLocaleString("en-IN")}`, currency: "", image: Purchaseimg, link: "" },
      { title: "Total Orders/Invoices", value: totalOrders, currency: "", image: Dueamountimg, link: "" },
    ];
  }, [activeTab, filteredInvoices, filteredPosSales, filteredCombined]);

  const applyDateFilter = (data, dateRange, dateField) => {
    const { startDate, endDate } = dateRange;
    if (!startDate || !endDate) return data;
    return data.filter((item) => {
      const d = new Date(item[dateField]);
      return d >= startDate && d <= endDate;
    });
  };

  useEffect(() => {
    const dateFiltered = applyDateFilter(salesData, selectedDateRange, "invoiceDate");
    if (!search) {
      setFilteredInvoices(dateFiltered);
    } else {
      setFilteredInvoices(
        dateFiltered.filter(
          (inv) =>
            inv.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
            inv.customerId?.name?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
    setCurrentPage(1);
    setAllCurrentPage(1);
  }, [selectedDateRange, salesData]);

  useEffect(() => {
    const dateFiltered = applyDateFilter(posSales, selectedDateRange, "createdAt");
    if (!posSearch) {
      setFilteredPosSales(dateFiltered);
    } else {
      setFilteredPosSales(
        dateFiltered.filter(
          (pos) =>
            pos.invoiceNumber?.toLowerCase().includes(posSearch.toLowerCase()) ||
            pos.customer?.customerId?.name?.toLowerCase().includes(posSearch.toLowerCase())
        )
      );
    }
    setPosCurrentPage(1);
    setAllCurrentPage(1)
  }, [selectedDateRange, posSales]);

  const handlePreviewInvoice = async (inv) => {
    // Check if invoiceId exists in shipment
    if (inv.invoiceNo) {
      try {
        const response = await api.get(`/api/invoices/${inv.invoiceNo}`);
        if (response.data.success) {
          const invoiceData = response.data.invoice;

          // Get customer data from the invoice (this will be the consignee/receiver)
          let customerForPreview = null;

          if (invoiceData.customerId) {
            // If invoice has customerId populated
            const cust = invoiceData.customerId;
            const addressParts = [];
            if (cust.address) addressParts.push(cust.address);
            if (cust.city) addressParts.push(cust.city);
            if (cust.state) addressParts.push(cust.state);
            if (cust.country) addressParts.push(cust.country);
            if (cust.pincode) addressParts.push(cust.pincode);

            customerForPreview = {
              name: cust.name || '',
              phone: cust.phone || '',
              address: addressParts.join(", ") || cust.address || '',
              email: cust.email || '',
              gstin: cust.gstin || ''
            };
          } else {
            // Fallback to shipment's consignee data
            customerForPreview = {
              name: shipment.customerData?.name || '',
              phone: shipment.customerData?.phone || '',
              address: shipment.customerData?.address || '',
              email: shipment.customerData?.email || '',
              gstin: shipment.customerData?.gstin || ''
            };
          }

          setSelectedInvoiceForPreview({
            invoiceId: inv.invoiceId,
            invoiceData: invoiceData,
            customerData: customerForPreview  // Use the correct customer data
          });
          setShowPreviewModal(true);
        }
      } catch (error) {
        toast.error("Failed to fetch invoice details");
      }
    } else {
      toast.error("No invoice associated with this invoice number");
    }
  };

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "91vh" }}>
      {/* Header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
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
              height: "33px",
            }}
          >
            Sales Report
          </h2>
        </div>

        <DateFilterDropdown
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
        />
      </div>

      {/* Top stat cards */}
      {activeTab === "Direct Sales" ? (
        <div className="d-flex flex-wrap g-3 mb-3">
          {computedStats.map((s, idx) => (
            <Link
              to={s.link}
              key={idx}
              className="col-3"
              style={{
                textDecoration: "none",
                paddingRight: s.title === "Total Orders/Invoices" ? "0px" : "30px",
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
                {/* Blue Left Accent Line */}
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

                {/* Left Content */}
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

                {/* Right Icon Circle */}
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
        </div>
      ) : activeTab === "POS" ? (
        <div className="d-flex flex-wrap g-3 mb-3">
          {computedStats.map((s, idx) => (
            <Link
              to={s.link}
              key={idx}
              className="col-3"
              style={{
                textDecoration: "none",
                paddingRight: s.title === "Total Orders/Invoices" ? "0px" : "30px",
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
                {/* Blue Left Accent Line */}
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

                {/* Left Content */}
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

                {/* Right Icon Circle */}
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
        </div>
      ) : (
        <div className="d-flex flex-wrap g-3 mb-3">
          {computedStats.map((s, idx) => (
            <Link
              to={s.link}
              key={idx}
              className="col-3"
              style={{
                textDecoration: "none",
                paddingRight: s.title === "Total Orders/Invoices" ? "0px" : "30px",
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
                {/* Blue Left Accent Line */}
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

                {/* Left Content */}
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

                {/* Right Icon Circle */}
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
        </div>
      )}

      {/* Main Content */}
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
        {/* Tabs + Search Bar & Export */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
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
              maxWidth: "50%",
              width: "fit-content",
              height: "33px",
            }}
          >
            {tabs.map((tab) => (
              <div
                key={tab.label}
                style={{
                  padding: "4px 12px",
                  background: activeTab === tab.label ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow: activeTab === tab.label ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: activeTab === tab.label ? "#0E101A" : "#0E101A",
                  cursor: "pointer",
                }}
                onClick={() => {
                  setActiveTab(tab.label);
                  setSelectedSalesIds(new Set());
                  setSelectedPosIds(new Set());
                  setAllSearch("");
                  setSearch("");
                  setPosSearch("");
                }}
              >
                {tab.label} <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          {/* search */}
          {activeTab === "Direct Sales" ? (
            <div
              style={{
                display: "inline-flex",
                justifyContent: "end",
                alignItems: "center",
                gap: 16,
                width: "50%",
                height: "33px",
              }}
            >
              {/* Search Bar */}
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
                <IoIosSearch style={{ fontSize: "25px" }} />
                <input
                  type="search"
                  placeholder="Search"
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
              {hasPermission(user, "SalesReport", "export") && (
                <button
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
          ) : activeTab === "POS" ? (
            <div
              style={{
                display: "inline-flex",
                justifyContent: "end",
                alignItems: "center",
                gap: 16,
                width: "50%",
                height: "33px",
              }}
            >
              {/* Search Bar */}
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
                <IoIosSearch style={{ fontSize: "25px" }} />
                <input
                  type="search"
                  placeholder="Search"
                  value={posSearch}
                  onChange={handlePosSearch}
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
              {hasPermission(user, "SalesReport", "export") && (
                <button
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
          ) : (
            <div
              style={{
                display: "inline-flex",
                justifyContent: "end",
                alignItems: "center",
                gap: 16,
                width: "50%",
                height: "33px",
              }}
            >
              {/* Search Bar */}
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
                <IoIosSearch style={{ fontSize: "25px" }} />
                <input
                  type="search"
                  placeholder="Search"
                  value={allSearch}
                  onChange={(e) => {
                    setAllSearch(e.target.value);
                  }}
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
              {hasPermission(user, "SalesReport", "export") && (
                <button
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
          )}
        </div>

        {/* Table */}
        {activeTab === "Direct Sales" ? (
          <>
            <div className="table-responsive"
              style={{
                overflowY: "auto",
                height: "calc(100vh - 310px)",
                maxHeight: '505px',
              }}
            >
              <table
                className="table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    height: "38px",
                    backgroundColor: "#F3F8FB",
                  }}
                >
                  <tr style={{ background: "#F3F8FB" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "40px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 12 }}
                      >
                        <input
                          type="checkbox"
                          // checked={allVisibleSelected}
                          checked={
                            currentPageInvoices.length > 0 &&
                            currentPageInvoices.every((inv) => selectedSalesIds.has(inv._id))
                          }
                          onChange={toggleSelectAll}
                          style={{ width: 18, height: 18 }}
                        />
                        Date
                      </div>
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "120px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Invoice No.
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "120px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Sales Source
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "150px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Customer
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "140px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      No. Of Product
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "130px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Total Amount
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Profit
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "120px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Tax Amount
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "140px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Extra Discount
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
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
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Billing Address
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Assigned Vehicle
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "200px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Assigned Driver
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Transport Charges
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "200px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Sold By
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="15" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentPageInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="15" className="text-center text-muted py-3">
                        No Invoice found
                      </td>
                    </tr>
                  ) : (currentPageInvoices.map((inv, index) => (
                    <tr
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                      key={inv._id}
                      style={{ borderBottom: "1px solid rgb(234, 234, 234)", cursor: "pointer" }}
                    >
                      {/* Date */}
                      <td
                        style={{
                          padding: "8px 16px",
                          verticalAlign: "middle",
                          height: "46px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSalesIds.has(inv._id)}
                            onChange={() => toggleSelectRow(inv._id)}
                            style={{ width: 18, height: 18 }}
                          />
                          <div
                            style={{
                              fontSize: 14,
                              color: "#0E101A",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(inv.invoiceDate).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Invoice No */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {/* {hasBarcode(product.code) ? (
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                            onClick={() => showBarcode(product)}
                          >
                            {normalizeCode(product.code)}
                            <FaBarcode className="fs-6 text-secondary" />
                          </div>
                        ) : (
                          <span style={{ color: "#0E101A" }}>---</span>
                        )} */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewInvoice(inv);
                          }}
                          style={{ textDecoration: "underline", color: "#1F7FFF" }}
                        >
                          {inv.invoiceNo}
                        </div>
                      </td>

                      {/*Sales Source*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        Sale
                      </td>

                      {/* Customer Name */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {inv.customerId?.name || "-"}
                      </td>

                      {/* Number Of Product */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {inv.items.length}
                      </td>

                      {/* Total Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{inv.grandTotal}
                      </td>

                      {/* Profit*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹-
                      </td>

                      {/* Tax Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{inv.totalTax}
                      </td>

                      {/* Extra Discount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{inv.additionalDiscount?.amt}
                      </td>

                      {/* Due Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{inv.dueAmount}
                      </td>

                      {/* Biilings Address*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {inv.billingAddress}
                      </td>

                      {/*Assigned Vehicle*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {inv.vehicleId?.vehicleNumber || "-"}
                      </td>

                      {/*Assigned Driver*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {inv.driverId?.driverName || "-"}
                      </td>

                      {/*Transport Charges*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{inv.additionalChargesDetails?.shipping || 0}
                      </td>

                      {/*Sold By*/}
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                        {inv.createdBy?.name || "-"}
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
          </>
        ) : activeTab === "POS" ? (
          <>
            <div className="table-responsive"
              style={{
                overflowY: "auto",
                height: "calc(100vh - 310px)",
                maxHeight: '505px',
              }}
            >
              <table
                className="table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    height: "38px",
                    backgroundColor: "#F3F8FB",
                  }}
                >
                  <tr style={{ background: "#F3F8FB" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "40px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 12 }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            currentPagePosSales.length > 0 &&
                            currentPagePosSales.every((pos) => selectedPosIds.has(pos._id))
                          }
                          onChange={togglePosSelectAll}
                          style={{ width: 18, height: 18 }}
                        />
                        Date
                      </div>
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "120px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Invoice No.
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "120px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Sales Source
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "150px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Customer
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "140px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      No. Of Product
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "130px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Total Amount
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Profit
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "120px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Tax Amount
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "140px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Extra Discount
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
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
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Billing Address
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Assigned Vehicle
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "200px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Assigned Driver
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "100px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Transport Charges
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "4px 16px",
                        color: "#727681",
                        fontSize: 14,
                        // width: "200px",
                        fontWeight: "400",
                        backgroundColor: "#F3F8FB",
                      }}
                    >
                      Sold By
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="15" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentPagePosSales.length === 0 ? (
                    <tr>
                      <td colSpan="15" className="text-center text-muted py-3">
                        No Invoice found
                      </td>
                    </tr>
                  ) : (currentPagePosSales.map((pos, index) => (
                    <tr
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                      key={pos._id}
                      style={{ borderBottom: "1px solid rgb(234, 234, 234)", cursor: "pointer" }}
                    >
                      {/* Date */}
                      <td
                        style={{
                          padding: "8px 16px",
                          verticalAlign: "middle",
                          height: "46px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPosIds.has(pos._id)}
                            onChange={() => togglePosSelectRow(pos._id)}
                            style={{ width: 18, height: 18 }}
                          />
                          <div
                            style={{
                              fontSize: 14,
                              color: "#0E101A",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(pos.createdAt).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Invoice No */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {/* {hasBarcode(product.code) ? (
                          <div
                            style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                            onClick={() => showBarcode(product)}
                          >
                            {normalizeCode(product.code)}
                            <FaBarcode className="fs-6 text-secondary" />
                          </div>
                        ) : (
                          <span style={{ color: "#0E101A" }}>---</span>
                        )} */}
                        <Link style={{ textDecoration: "underline", color: "#1F7FFF" }}>{pos.invoiceNumber}</Link>
                      </td>

                      {/*Sales Source*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        POS
                      </td>

                      {/* Customer Name */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {pos.customer?.customerId?.name || "-"}
                      </td>

                      {/* Number Of Product */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {pos.items.length}
                      </td>

                      {/* Total Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{pos.totals.totalAmount}
                      </td>

                      {/* Profit*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{pos.totals.totalProfit}
                      </td>

                      {/* Tax Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{pos.totals.tax}
                      </td>

                      {/* Extra Discount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{pos.totals?.overallDiscount}
                      </td>

                      {/* Due Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        ₹{pos.paymentDetails.dueAmount}
                      </td>

                      {/* Due Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        -
                      </td>

                      {/* Due Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        -
                      </td>

                      {/* Due Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        -
                      </td>

                      {/* Due Amount*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        -
                      </td>

                      {/*Sold By*/}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A"
                        }}>
                        {pos.createdBy?.name || "-"}
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
                currentPage={posCurrentPage}
                total={totalPosItems}
                itemsPerPage={posItemsPerPage}
                onPageChange={(p) => {
                  setPosCurrentPage(p);
                }}
                onItemsPerPageChange={(n) => {
                  setPosItemsPerPage(n);
                  setPosCurrentPage(1);
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="table-responsive"
              style={{
                overflowY: "auto",
                height: "calc(100vh - 310px)",
                maxHeight: '505px',
              }}
            >
              <table
                className="table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    height: "38px",
                    backgroundColor: "#F3F8FB",
                  }}
                >
                  <tr style={{ background: "#F3F8FB" }}>
                    {["Date", "Invoice No.", "Sales Source", "Customer", "No. Of Product", "Total Amount", "Profit", "Tax Amount", "Extra Discount", "Due Amount", "Billing Address", "Assigned Vehicle", "Assigned Driver", "Transport Charges", "Sold By"
                    ].map((col) => (
                      <th
                        key={col}
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          // width: "40px",
                          fontWeight: "400",
                          backgroundColor: "#F3F8FB",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          {col === "Date" && (
                            <input
                              type="checkbox"
                              checked={
                                currentPageAllSales.length > 0 &&
                                currentPageAllSales.every((row) =>
                                  row._type === "direct"
                                    ? selectedSalesIds.has(row._id)
                                    : selectedPosIds.has(row._id)
                                )
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSalesIds((prev) => {
                                    const next = new Set(prev);
                                    currentPageAllSales.filter(r => r._type === "direct").forEach(r => next.add(r._id));
                                    return next;
                                  });
                                  setSelectedPosIds((prev) => {
                                    const next = new Set(prev);
                                    currentPageAllSales.filter(r => r._type === "pos").forEach(r => next.add(r._id));
                                    return next;
                                  });
                                } else {
                                  setSelectedSalesIds((prev) => {
                                    const next = new Set(prev);
                                    currentPageAllSales.filter(r => r._type === "direct").forEach(r => next.delete(r._id));
                                    return next;
                                  });
                                  setSelectedPosIds((prev) => {
                                    const next = new Set(prev);
                                    currentPageAllSales.filter(r => r._type === "pos").forEach(r => next.delete(r._id));
                                    return next;
                                  });
                                }
                              }}
                              style={{ width: 18, height: 18 }}
                            />
                          )}
                          {col}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="15" className="text-center py-4">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentPageAllSales.length === 0 ? (
                    <tr>
                      <td colSpan="15" className="text-center text-muted py-3">No records found</td>
                    </tr>
                  ) : currentPageAllSales.map((row) => (
                    <tr key={`${row._type}-${row._id}`} style={{ borderBottom: "1px solid rgb(234, 234, 234)", cursor: "pointer" }}>
                      <td
                        style={{
                          padding: "8px 16px",
                          verticalAlign: "middle",
                          height: "46px",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            color:'black',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPosIds.has(row._id) || selectedSalesIds.has(row._id)}
                            onChange={() => {
                              if (row._type === "direct") toggleSelectRow(row._id);
                              else togglePosSelectRow(row._id);
                            }}
                            style={{ width: 18, height: 18 }}
                          />
                          {new Date(row.date).toLocaleString("en-GB", { day: "2-digit", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                        </div>
                      </td>
                      <td style={{ padding: "8px 16px", fontSize: 14 }}>
                        {row._type === "direct" ? (
                          <div
                            onClick={(e) => { e.stopPropagation(); handlePreviewInvoice(row._raw); }}
                            style={{ textDecoration: "underline", color: "#1F7FFF", cursor: "pointer" }}
                          >
                            {row.invoiceNo}
                          </div>
                        ) : (
                          <span style={{ color: "#1F7FFF", textDecoration: "underline" }}>{row.invoiceNo}</span>
                        )}
                      </td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                        <span style={{
                          padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                          backgroundColor: row.source === "Sale" ? "#E5F0FF" : "#E6F9F0",
                          color: row.source === "Sale" ? "#1F7FFF" : "#14A060",
                        }}>
                          {row.source}
                        </span>
                      </td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{row.customerName}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{row.noOfProducts}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>₹{row.totalAmount}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                        {row.profit !== null ? `₹${row.profit}` : "₹-"}
                      </td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>₹{row.tax}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>₹{row.extraDiscount}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>₹{row.dueAmount}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{row.billingAddress || "-"}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{row.assignedVehicle || "-"}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{row.assignedDriver || "-"}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>₹{row.transportCharges || 0}</td>
                      <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{row.soldBy || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="page-redirect-btn px-2">
              <Pagination
                currentPage={allCurrentPage}
                total={filteredCombined.length}
                itemsPerPage={allItemsPerPage}
                onPageChange={(p) => setAllCurrentPage(p)}
                onItemsPerPageChange={(n) => { setAllItemsPerPage(n); setAllCurrentPage(1); }}
              />
            </div>
          </>
        )}
      </div>

      {showPreviewModal && selectedInvoiceForPreview && (
        <PreviewInvoice
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedInvoiceForPreview(null);
          }}
          invoiceId={selectedInvoiceForPreview.invoiceId}
          invoiceData={selectedInvoiceForPreview.invoiceData}
          customerData={selectedInvoiceForPreview.customerData}
          companyData={null}
        />
      )}
    </div>
  );
}

export default SalesReport;
