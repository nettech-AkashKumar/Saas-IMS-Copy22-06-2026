import React, { useEffect, useState, useRef, useMemo } from "react";
import { IoIosSearch } from "react-icons/io";
import { FaBarcode } from "react-icons/fa6";
import { TbFileExport } from "react-icons/tb";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
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

function ProductWiseReport() {
  // Company logo
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

  const statsTop = [
    {
      title: "Total Revenue",
      value: "0",
      currency: "INR",
      image: Dollarimg,
      link: "",
    },
    {
      title: "Product Sold",
      value: "0",
      currency: "",
      image: Orderimg,
      link: "",
    },
    {
      title: "Gross Profit",
      value: "0",
      currency: "INR",
      image: Purchaseimg,
      link: "",
    },
    {
      title: "Top Products",
      value: "0",
      //   currency: "INR",
      image: Dueamountimg,
      link: "",
    },
  ];

  const navigate = useNavigate();
  const { user } = useAuth();
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewBarcode, setViewBarcode] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [productInventory, setProductInventory] = useState({}); // Store product inventory
  const [activeRow, setActiveRow] = useState(null);
  const [selectedProductInvoices, setSelectedProductInvoices] = useState([]);
  const [showInvoicesModal, setShowInvoicesModal] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [initialStats, setInitialStats] = useState(statsTop);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("All");
  const [posSales, setPosSales] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({ startDate: null, endDate: null });
  const [filteredSalesData, setFilteredSalesData] = useState([]);
  const [filteredPosSalesData, setFilteredPosSalesData] = useState([]);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Store aggregated products
  const [aggregatedProducts, setAggregatedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Fetch product inventory
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

  const fetchPosSales = async () => {
    try {
      const response = await api.get("/api/pos-sales/transactions", {
        params: { page: 1, limit: 1000 },
      });
      const sales = response?.data?.data;
      setPosSales(Array.isArray(sales) ? sales : []);
    } catch (error) {
      toast.error("Failed to load POS transactions");
    }
  };

  // Calculate product statistics from sales data with search filtering
  const calculateProductStats = (sales, searchTerm = "") => {
    const productMap = new Map();
    let totalRevenue = 0;
    let totalUnitsSold = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.totalAmount || 0;
      if (!sale.items?.length) return;

      sale.items.forEach((item) => {
        const productId = item.productId || item.productName;
        if (!productId) return;
        const productName = item.productName?.toLowerCase() || "";
        const productCode = normalizeCode(item.itemBarcode);
        if (
          searchTerm &&
          !productName.includes(searchTerm.toLowerCase()) &&
          !String(productCode).toLowerCase().includes(searchTerm.toLowerCase())
        ) return;

        if (!productMap.has(productId)) {
          productMap.set(productId, {
            id: productId,
            name: item.productName,
            code: productCode,
            category: item.category || "",
            variants: item.variants || [],
            unitSold: 0,
            revenue: 0,
            profit: 0,
            profitKnown: true,
            costTotal: 0,
            supplier: item.supplier || "—",
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
        product.costTotal += (item.costPrice || 0) * qty;
        if (item.itemProfit !== undefined && item.itemProfit !== null) {
          // POS: profit stored per item in normalizePosItems
          product.profit += item.itemProfit;
        } else if (item.profit !== undefined && item.profit > 0) {
          // Direct sales: profit stored on invoice item schema
          product.profit += item.profit;
        } else if (item.costPrice > 0) {
          // Fallback: compute from costPrice if available
          product.profit += itemRevenue - (item.costPrice || 0) * qty;
        } else {
          // No profit data available
          product.profitKnown = (product.profitKnown === undefined) ? false : product.profitKnown;
        }

        totalUnitsSold += qty;
      });
    });

    const productsArray = Array.from(productMap.values()).sort(
      (a, b) => b.unitSold - a.unitSold,
    );
    return { products: productsArray, totalRevenue, totalUnitsSold };
  };

  // Fetch sales data - get ALL sales without pagination for aggregation
  const fetchAllSalesData = async () => {
    setLoading(true);
    try {
      // First fetch product inventory
      await fetchProductInventory();

      // Fetch ALL sales data without pagination for aggregation
      const params = {
        page: 1,
        limit: 1000, // Large limit to get all data
        search: "", // We'll handle search client-side for products
      };

      const response = await api.get("/api/invoices/sales/list", { params });
      if (response.data.success) {
        setSalesData(response.data.data.sales);
      }
      if (response.data.success) {
        const sales = response.data.data.sales;
        setSalesData(sales);

        // Calculate initial product statistics
        const productStats = calculateProductStats(
          sales,
          search,
          productInventory,
        );
        setAggregatedProducts(productStats.products);
        setFilteredProducts(productStats.products);

        // Set pagination for the filtered products
        const totalFiltered = productStats.products.length;
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: totalFiltered,
          totalPages: Math.ceil(totalFiltered / prev.limit),
        }));
      }
    } catch (error) {
      // console.error("Error fetching sales data:", error);
      toast.error("Failed to load sales report");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductInvoices = async (productId, productName) => {
    setLoadingInvoices(true);
    try {
      // Get all sales that contain this product
      const response = await api.get("/api/invoices/sales/list", {
        params: {
          limit: 100, // Get enough records
          page: 1,
        },
      });

      if (response.data.success) {
        // Filter invoices that contain this product
        const invoicesWithProduct = response.data.data.sales.filter((sale) =>
          sale.items?.some(
            (item) =>
              item.productId === productId ||
              item.productName
                ?.toLowerCase()
                .includes(productName.toLowerCase()),
          ),
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

  const normalizePosItems = (posSalesList) => {
    return posSalesList.map((pos) => ({
      totalAmount: pos.totals?.totalAmount || 0,
      items: (pos.items || []).map((item) => ({
        productId: item.productId?._id || item.productId || item.productName,
        productName: item.productId?.productName || item.productName || item.itemName,
        // ✅ now available after populate fix
        itemBarcode: item.productId?.itemBarcode || item.itemBarcode || "N/A",
        qty: item.quantity || item.qty || 0,
        unitPrice: item.unitPrice || item.price || 0,
        discountAmt: item.discount || 0,
        total: item.total || item.amount || 0,
        itemProfit: item.profit || 0,
        category: item.productId?.category?.categoryName || item.category || "",
        costPrice: item.productId?.costPrice || item.costPrice || 0,
        variants: item.productId?.variants || [],
        supplier: item.productId?.supplier || "",
      })),
    }));
  };

  const getActiveSales = (tab) => {
    const normalizedPos = normalizePosItems(filteredPosSalesData);
    if (tab === "Direct Sales") return filteredSalesData;
    if (tab === "POS") return normalizedPos;
    return [...filteredSalesData, ...normalizedPos];
  };

  // Handle search
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearch(searchTerm);

    if (!searchTerm) {
      // Reset to all products
      setFilteredProducts(aggregatedProducts);
      const total = aggregatedProducts.length;
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    } else {
      // Filter products based on search term
      const filtered = aggregatedProducts.filter(
        (product) =>
          product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredProducts(filtered);
      const total = filtered.length;
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    }
  };

  // Get current page products
  const getCurrentPageProducts = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredProducts.slice(startIndex, endIndex);
  };

  // Export to PDF
  const handleExport = () => {
    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one product to export");
      return;
    }

    const productsToExport = filteredProducts.filter((p) =>
      selectedRowIds.has(p.id),
    );

    if (!productsToExport.length) {
      toast.warning("No products to export");
      return;
    }

    try {
      const doc = new jsPDF("portrait", "mm", "a4");

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = companyImages?.companyLogo || KasperLogo;

      img.onload = () => {
        // =========================
        // HEADER
        // =========================

        doc.addImage(img, "PNG", 10, 8, 38, 14);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);

        doc.text("SALES REPORT - PRODUCT WISE", 200, 15, { align: "right" });

        const fromDate = selectedDateRange.startDate
          ? format(new Date(selectedDateRange.startDate), "dd/MM/yy")
          : "All";
        const toDate = selectedDateRange.endDate
          ? format(new Date(selectedDateRange.endDate), "dd/MM/yy")
          : "dates";

        doc.text(`${fromDate} - ${toDate}`, 200, 22, { align: "right" });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);

        // =========================
        // TABLE DATA
        // =========================

        const tableData = productsToExport.map((row, index) => [
          index + 1,
          row.name || "-",
          row.code || "-",
          row.unitSold || 0,
          row.openingQuantity ?? row.availableQty ?? 0,
          `Rs. ${(row.revenue || 0).toLocaleString("en-IN")}/-`,
          `Rs. ${(row.profit || 0).toLocaleString("en-IN")}/-`,
        ]);

        autoTable(doc, {
          startY: 38,
          head: [
            [
              "SR.",
              "PRODUCTS",
              "ITEM CODE",
              "UNITS SOLD",
              "AVAILABLE QTY",
              "SALES REVENUE",
              "PROFIT",
            ],
          ],
          body: tableData,
          theme: "grid",

          headStyles: {
            fillColor: [210, 214, 219],
            textColor: [0, 0, 0],
            fontStyle: "normal",
            lineColor: [160, 160, 160],
            lineWidth: 0.1,
            fontSize: 9,
          },

          bodyStyles: {
            fontSize: 9,
          },

          alternateRowStyles: {
            fillColor: [245, 245, 245],
          },

          margin: {
            left: 10,
            right: 10,
          },
        });

        // =========================
        // FOOTER
        // =========================

        const pageCount = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);

          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);

          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" },
          );
        }

        // =========================
        // SAVE PDF
        // =========================

        doc.save(
          `sales_product_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`,
        );

        toast.success(`Exported ${productsToExport.length} product(s) as PDF`);

        setSelectedRowIds(new Set());
        setAllVisibleSelected(false);
      };

      img.onerror = (err) => {
        toast.error("Failed to load logo image");
      };
    } catch (error) {
      toast.error("Failed to generate PDF");
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      // Select ALL filtered products (not just current page)
      const allIds = filteredProducts.map((p) => p.id);
      setSelectedRowIds(new Set(allIds));
    } else {
      // Unselect all
      setSelectedRowIds(new Set());
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

  // Single init fetch
  useEffect(() => {
    fetchAllSalesData();
    fetchPosSales();
  }, []);

  // Single recalculation that always uses active tab + both data sources
  useEffect(() => {
    if (!loading) {
      const activeSales = getActiveSales(activeTab);
      const productStats = calculateProductStats(activeSales, search);
      setAggregatedProducts(productStats.products);
      setFilteredProducts(productStats.products);
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: productStats.products.length,
        totalPages: Math.ceil(productStats.products.length / prev.limit),
      }));
    }
  }, [activeTab, filteredSalesData, filteredPosSalesData, productInventory, search]);

  // Initial data fetch
  useEffect(() => {
    fetchAllSalesData();
  }, []);

  useEffect(() => {
    const currentPageProducts = getCurrentPageProducts();

    if (currentPageProducts.length > 0) {
      const allSelected = currentPageProducts.every((p) =>
        selectedRowIds.has(p.id),
      );
      setAllVisibleSelected(allSelected);
    } else {
      setAllVisibleSelected(false);
    }
  }, [selectedRowIds, pagination.page, filteredProducts]);

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

  // Get current page products
  const currentPageProducts = getCurrentPageProducts();

  const tabCounts = useMemo(() => {
    const countProducts = (sales) => {
      const ids = new Set();
      sales.forEach((sale) =>
        sale.items?.forEach((item) => {
          const id = item.productId || item.productName;
          if (id) ids.add(id);
        })
      );
      return ids.size;
    };

    const normalizedPos = normalizePosItems(filteredPosSalesData);

    return {
      all: countProducts([...filteredSalesData, ...normalizedPos]),
      direct: countProducts(filteredSalesData),
      pos: countProducts(normalizedPos),
    };
  }, [filteredSalesData, filteredPosSalesData]);

  const tabs = [
    { label: "All", count: tabCounts.all },
    { label: "Direct Sales", count: tabCounts.direct },
    { label: "POS", count: tabCounts.pos },
  ];

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
    if (low === "na" || low === "n/a" || low === "null" || low === "undefined")
      return "NA";
    return v;
  };

  const hasBarcode = (code) => normalizeCode(code) !== "NA";

  const handleProductClick = (product) => { navigate(`/sales-invoices?product=${product.id}`); };

  const handleExcel = async () => {
    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one product to export");
      return;
    }

    const productsToExport = filteredProducts.filter((p) =>
      selectedRowIds.has(p.id)
    );

    if (!productsToExport.length) {
      toast.warning("No products to export");
      return;
    }

    try {
      const tableColumns = [
        "SR.", "Product Name", "Item Code", "Category", "Variant Count",
        "Units Sold", "Available QTY", "Sales Revenue (₹)", "Profit (₹)",
      ];

      const tableRows = productsToExport.map((row, i) => [
        i + 1,
        row.name || "-",
        row.code || "-",
        row.category || "-",
        row.variants?.length ?? 0,
        row.unitSold || 0,
        row.availableQty ?? 0,
        parseFloat((row.revenue || 0).toFixed(2)),
        row.profitKnown === false ? "N/A" : parseFloat((row.profit || 0).toFixed(2)),
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Product Wise Report");

      // Column widths
      [6, 28, 20, 18, 14, 12, 14, 20, 16].forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      // Header row
      const headerRow = worksheet.addRow(tableColumns);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "99c5ff" },
        };
        cell.font = { bold: true };
        cell.border = {
          top: { style: "thin", color: { argb: "338bff" } },
          left: { style: "thin", color: { argb: "338bff" } },
          bottom: { style: "thin", color: { argb: "338bff" } },
          right: { style: "thin", color: { argb: "338bff" } },
        };
      });

      // Data rows
      tableRows.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `product_wise_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`
      );

      toast.success(`Exported ${productsToExport.length} product(s) as Excel`);
      setSelectedRowIds(new Set());
    } catch (error) {
      toast.error("Failed to generate Excel file");
    }
  };

  const computedStats = useMemo(() => {
    const totalRevenue = filteredProducts.reduce((sum, p) => sum + (p.revenue || 0), 0);
    const totalUnitsSold = filteredProducts.reduce((sum, p) => sum + (p.unitSold || 0), 0);
    const grossProfit = filteredProducts.reduce((sum, p) => sum + (p.profit || 0), 0);
    const topProduct = filteredProducts.reduce(
      (best, p) => (!best || p.unitSold > best.unitSold ? p : best),
      null
    );

    return [
      {
        title: "Total Revenue",
        value: `₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        currency: "",
        image: Dollarimg,
        link: "",
      },
      {
        title: "Product Sold",
        value: totalUnitsSold,
        currency: "",
        image: Orderimg,
        link: "",
      },
      {
        title: "Gross Profit",
        value: `₹${grossProfit.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
        currency: "",
        image: Purchaseimg,
        link: "",
      },
      {
        title: "Top Product",
        value: topProduct?.name || "—",
        currency: "",
        image: Dueamountimg,
        link: "",
      },
    ];
  }, [filteredProducts]);

  const applyDateFilter = (data, dateRange, dateField) => {
    const { startDate, endDate } = dateRange;
    if (!startDate || !endDate) return data;
    return data.filter((item) => {
      const d = new Date(item[dateField]);
      return d >= new Date(startDate) && d <= new Date(endDate);
    });
  };

  useEffect(() => {
    setFilteredSalesData(applyDateFilter(salesData, selectedDateRange, "invoiceDate"));
    setFilteredPosSalesData(applyDateFilter(posSales, selectedDateRange, "createdAt"));
  }, [selectedDateRange, salesData, posSales]);

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
            Product wise Report
          </h2>
        </div>

        <DateFilterDropdown
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
        />
      </div>

      {/* Top stat cards */}
      <div className="d-flex flex-wrap g-3 mb-3">
        {computedStats.map((s, idx) => (
          <Link
            to={s.link}
            key={idx}
            className="col-3"
            style={{ textDecoration: "none", paddingRight: idx === computedStats.length - 1 ? "0px" : "30px" }}
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
              />

              <div className="d-flex align-items-center" style={{ gap: "24px", minWidth: 0 }}>
                <div className="d-flex flex-column" style={{ gap: "11px", minWidth: 0 }}>
                  <h6
                    className="mb-0"
                    style={{ fontSize: "14px", color: "#727681", fontWeight: "500" }}
                  >
                    {s.title}
                  </h6>
                  <h5
                    className="mb-0"
                    style={{
                      fontSize: s.title === "Top Product" ? "13px" : "22px",
                      color: "#0E101A",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "160px",
                    }}
                    title={s.title === "Top Product" ? s.value : undefined}
                  >
                    {s.value}
                  </h5>
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
                  style={{ width: "36px", height: "36px", objectFit: "contain" }}
                />
              </div>
            </div>
          </Link>
        ))}
      </div>

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
                onClick={() => {
                  setActiveTab(tab.label);
                  setSearch("");
                }}
                style={{
                  padding: "4px 12px",
                  background: activeTab === tab.label ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow: activeTab === tab.label ? "0px 1px 4px rgba(0,0,0,0.10)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                  cursor: "pointer",
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
                type="text"
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
                  gap: 4,
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
                {/* &nbsp;
                <FaFilePdf className="fs-5" style={{ color: "#DC2626" }}
                  onClick={handleExport} />
                <FaFileExcel className="fs-5" style={{ color: "#c6c914ff" }}
                  onClick={handleExcel} /> */}
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            overflowY: "auto",
            height: "calc(100vh - 310px)",
            maxHeight: "505px",
          }}
        >
          <table
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
              }}
            >
              <tr style={{ background: "#F3F8FB" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 80,
                    fontWeight: "400",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        selectedRowIds.size === filteredProducts.length
                      }
                      onChange={toggleSelectAll}
                      style={{ width: 18, height: 18 }}
                    />
                    Product Name
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 200,
                    fontWeight: "400",
                  }}
                >
                  Item Code
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 123,
                    fontWeight: "400",
                  }}
                >
                  Varient
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 112,
                    fontWeight: "400",
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 100,
                    fontWeight: "400",
                  }}
                >
                  Unit Sold
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 100,
                    fontWeight: "400",
                  }}
                >
                  Available QTY
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 100,
                    fontWeight: "400",
                  }}
                >
                  Sales Revenue
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 100,
                    fontWeight: "400",
                  }}
                >
                  Profit
                </th>
                {/* <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 100,
                    fontWeight: "400",
                  }}
                >
                  Purchase From
                </th> */}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentPageProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-muted py-3">
                    No Products found
                  </td>
                </tr>
              ) : currentPageProducts.map((product, index) => (
                <tr
                  className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                  key={product.id}
                  style={{
                    borderBottom: "1px solid rgb(234, 234, 234)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setSelectedProduct(product);
                    fetchProductInvoices(product.id, product.name);
                  }}
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
                        checked={selectedRowIds.has(product.id)}
                        onChange={() => toggleSelectRow(product.id)}
                        style={{ width: 18, height: 18 }}
                      />
                      <div
                        style={{
                          fontSize: 14,
                          color: "#0E101A",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {product.name}
                      </div>
                    </div>
                  </td>

                  {/* Product Code */}
                  <td
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "#0E101A",
                    }}
                  >
                    {product.code} <FaBarcode className="fs-6 text-secondary" />
                  </td>

                  {/* variant */}
                  <td
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "#0E101A",
                    }}
                  >
                    {product.variants?.length}
                  </td>

                  {/* Category */}
                  <td
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "#0E101A",
                    }}
                  >
                    {product.category}
                  </td>

                  {/* unit sold */}
                  <td
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "#0E101A",
                    }}
                  >
                    {product.unitSold}
                  </td>

                  {/* availablecQty */}
                  <td
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "#0E101A",
                    }}
                  >
                    {product.availableQty}
                  </td>

                  {/* sales revenue */}
                  <td
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "#0E101A",
                    }}
                  >
                    ₹{product.revenue?.toFixed(2)}
                  </td>

                  {/* profit */}
                  <td
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "#0E101A",
                    }}
                  >
                    {product.profitKnown === false
                      ? <span style={{ color: "#727681" }}>N/A</span>
                      : `₹${(product.profit || 0).toFixed(2)}`
                    }
                  </td>

                  {/* purchased by */}
                  {/* <td
                    style={{
                      padding: "8px 16px",
                      fontSize: 14,
                      color: "#0E101A",
                    }}
                  >
                    {product.supplier || "—"}
                  </td> */}
                </tr>

              ))}
            </tbody>
          </table>
        </div>

        {/* Barcode Modal */}
        {viewBarcode && selectedBarcode && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="barcode-modal"
              style={{
                width: "70%",
                backgroundColor: "#f5f4f4ff",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "400px",
                  height: "auto",
                  backgroundColor: "white",
                  boxShadow: "10px 10px 40px rgba(0,0,0,0.10)",
                  borderRadius: 16,
                  padding: 16,
                  border: "2px solid #dbdbdbff",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", gap: "10px" }}>
                  <span>{selectedBarcode.name} /</span>
                  <span>₹{selectedBarcode.unitPrice}/-</span>
                </div>
                {/* <img src={Barcode} alt="Barcode" style={{ width: "100%" }} />
                <div style={{ textAlign: "center", color: "#666" }}>
                  {selectedBarcode.code}
                </div> */}
                <div className="d-flex justify-content-center align-items-center">
                  <svg id={`barcode-svg-${selectedBarcode.code}`}></svg>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Invoices Modal */}
        {showInvoicesModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => {
              setShowInvoicesModal(false);
              setSelectedProduct(null);
            }}
          >
            <div
              style={{
                width: "80%",
                maxWidth: "900px",
                maxHeight: "80vh",
                backgroundColor: "white",
                borderRadius: 16,
                padding: 24,
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>
                  Invoices containing:{" "}
                  {selectedProduct?.name || "Selected Product"}
                </h3>
                <button
                  onClick={() => {
                    setShowInvoicesModal(false);
                    setSelectedProduct(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 24,
                    cursor: "pointer",
                    color: "#666",
                  }}
                >
                  ×
                </button>
              </div>

              {loadingInvoices ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : selectedProductInvoices.length === 0 ? (
                <div
                  style={{ textAlign: "center", padding: 40, color: "#727681" }}
                >
                  No invoices found for this product
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{ backgroundColor: "#F3F8FB" }}>
                    <tr>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          color: "#727681",
                          fontSize: 14,
                          fontWeight: 400,
                        }}
                      >
                        Invoice No
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          color: "#727681",
                          fontSize: 14,
                          fontWeight: 400,
                        }}
                      >
                        Date
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          color: "#727681",
                          fontSize: 14,
                          fontWeight: 400,
                        }}
                      >
                        Customer
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          color: "#727681",
                          fontSize: 14,
                          fontWeight: 400,
                        }}
                      >
                        Qty Sold
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          color: "#727681",
                          fontSize: 14,
                          fontWeight: 400,
                        }}
                      >
                        Total Amount
                      </th>
                      <th
                        style={{
                          padding: "12px",
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
                          padding: "12px",
                          textAlign: "left",
                          color: "#727681",
                          fontSize: 14,
                          fontWeight: 400,
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProductInvoices.map((invoice) => {
                      const productItem = invoice.items?.find(
                        (item) =>
                          item.productId === selectedProduct?.id ||
                          item.productName
                            ?.toLowerCase()
                            .includes(
                              selectedProduct?.name?.toLowerCase() || "",
                            ),
                      );

                      return (
                        <tr
                          key={invoice._id}
                          style={{ borderBottom: "1px solid #eee" }}
                        >
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            {invoice.invoiceNo}
                          </td>
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            {new Date(invoice.invoiceDate).toLocaleDateString(
                              "en-IN",
                            )}
                          </td>
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            {invoice.customer}
                          </td>
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            {productItem?.qty || 0}
                          </td>
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            ₹{invoice.totalAmount?.toFixed(2)}
                          </td>
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            <span
                              style={{
                                padding: "4px 8px",
                                borderRadius: 4,
                                fontSize: 12,
                                backgroundColor:
                                  invoice.status === "paid"
                                    ? "#d4edda"
                                    : invoice.status === "partial"
                                      ? "#fff3cd"
                                      : "#f8d7da",
                                color:
                                  invoice.status === "paid"
                                    ? "#155724"
                                    : invoice.status === "partial"
                                      ? "#856404"
                                      : "#721c24",
                              }}
                            >
                              {invoice.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: "12px", fontSize: 14 }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/sales-invoice/${invoice._id}`, {
                                  state: {
                                    invoiceData: invoice,
                                    fromSalesReport: true,
                                  },
                                });
                              }}
                              style={{
                                padding: "6px 12px",
                                backgroundColor: "#1F7FFF",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontSize: 12,
                              }}
                            >
                              View Invoice
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={pagination.page}
            total={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            onItemsPerPageChange={(val) =>
              setPagination((prev) => ({ ...prev, limit: val, page: 1 }))
            }
          />
        </div>
      </div>
    </div>
  );
}

export default ProductWiseReport;
