import React, { useEffect, useState, useRef } from "react";
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

function ExpireReoptr() {
  const statsTop = [
    {
      title: "Expired Products",
      value: "0",
    //   currency: "INR",
      image: Dollarimg,
      link: "",
    },
    {
      title: "Expiring in 30 Days",
      value: "0",
    //   currency: "",
      image: Orderimg,
      link: "",
    },
    {
      title: "Expired Stock Value",
      value: "0",
      currency: "INR",
      image: Purchaseimg,
      link: "",
    },
    {
      title: "Expiring Stock Value",
      value: "0",
      currency: "INR",
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
            !String(productCode)
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
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
      img.src = KasperLogo;

      img.onload = () => {
        // =========================
        // HEADER
        // =========================

        doc.addImage(img, "PNG", 10, 8, 38, 14);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);

        doc.text("SALES REPORT - PRODUCT WISE", 200, 15, { align: "right" });

        const fromDate = format(startDate, "dd/MM/yy");
        const toDate = format(endDate, "dd/MM/yy");

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);

        doc.text(`${fromDate} - ${toDate}`, 200, 22, { align: "right" });

        // =========================
        // TABLE DATA
        // =========================

        const tableData = productsToExport.map((row, index) => [
          index + 1,
          row.code || "-",
          row.name || "-",
          row.unitSold || 0,
          row.openingQuantity ?? row.availableQty ?? 0,
          `₹ ${(row.revenue || 0).toLocaleString("en-IN")}/-`,
          `₹ ${(row.profit || 0).toLocaleString("en-IN")}/-`,
        ]);

        autoTable(doc, {
          startY: 38,
          head: [
            [
              "SR.",
              "ITEM CODE",
              "PRODUCTS",
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
        console.error("Logo loading failed:", err);
        toast.error("Failed to load logo image");

        // Check if image path is correct
        console.log("KasperLogo Path:", KasperLogo);
      };
    } catch (error) {
      console.error("PDF Export Error:", error);
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
      setPagination((prev) => ({
        ...prev,
        page: 1,
        total: total,
        totalPages: Math.ceil(total / prev.limit),
      }));
    }
  }, [productInventory, salesData, search]);

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

  const tabs = [
    {
      label: "All",
      count: filteredProducts.length,
      active: true,
    },
    {
      label: "POS",
      count: filteredProducts.length,
      active: false,
    },
    {
      label: "Direct Sales",
      count: filteredProducts.length,
      active: false,
    },
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
  const handleProductClick = (product) => {
    // This would need actual invoice data
    // For now, you might navigate to a filtered list
    navigate(`/sales-invoices?product=${product.id}`);
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
            Expire Report
          </h2>
        </div>

        <DateFilterDropdown />
      </div>

      {/* Top stat cards */}
      <div className="d-flex flex-wrap g-3 mb-3">
        {initialStats.map((s, idx) => (
          <Link
            to={s.link}
            key={idx}
            className="col-3"
            style={{
              textDecoration: "none",
              paddingRight: s.title === "Expiring Stock Value" ? "0px" : "30px",
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
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <input
                      type="checkbox"
                      // checked={allVisibleSelected}
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
                  Purchase From
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
                  Due Amount
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
                  Billing Address
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
                  Assigned Vehicle
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
                  Assigned Driver
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
                  Transport Charges
                </th> */}
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
                  Other Charge 1
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
                  Other Charge 2
                </th> */}
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
                  Sold By
                </th> */}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentPageProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
                    No products found
                  </td>
                </tr>
              ) : (
                ((
                  <>
                    {/* {console.log("Rendering products:", currentPageProducts)}, */}
                  </>
                ),
                currentPageProducts.map((product, index) => (
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
                          // checked={selectedRowIds.has(product.code)}
                          // onChange={() => toggleSelectRow(product.code)}
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
                          {/* {product.name} */}
                          03/06/2026
                        </div>
                      </div>
                    </td>

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
                      <Link style={{ textDecoration: "underline" }}>
                        {" "}
                        INV-001
                      </Link>
                    </td>

                    {/*Sales Source*/}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {/* {product.unitSold} */}
                      POS Sale
                    </td>

                    {/* Customer Name */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {/* ₹{product.revenue?.toFixed(2)} */}
                      Krishna Murthy
                    </td>

                    {/* Number Of Product */}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {/* {product.availableQty} */}
                      12
                    </td>
                    {/* Total Amount*/}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {/* {product.availableQty} */}
                      ₹2,500
                    </td>
                    {/* Profit*/}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {/* {product.availableQty} */}
                      ₹2,500
                    </td>
                    {/* Tax Amount*/}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {/* {product.availableQty} */}
                      ₹70
                    </td>
                    {/* Extra Discount*/}
                    <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {/* {product.availableQty} */}
                      ₹25
                    </td>
                    {/* Due Amount*/}
                    {/* <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {product.availableQty}
                      ₹100
                    </td> */}
                    {/* Biilings Address*/}
                    {/* <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {product.availableQty}
                      Ranchi, Firayalal Chowk..
                    </td> */}
                    {/*Assigned Vehicle*/}
                    {/* <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {product.availableQty}
                      JH01 AB 1233
                    </td> */}
                    {/*Assigned Driver*/}
                    {/* <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                       {product.availableQty} 
                      Ashutosh Prasad
                    </td> */}
                    {/*Transport Charges*/}
                    {/* <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                       {product.availableQty} 
                      ₹100
                    </td> */}
                    {/*Other Charge 1*/}
                    {/* <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                         {product.availableQty} 
                      </td> */}
                    {/*Other Charge 2*/}
                    {/* <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {product.availableQty} 
                      </td> */}
                    {/*Sold By*/}
                    {/* <td
                      style={{
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                       {product.availableQty} 
                      Priyanshu
                    </td> */}
                  </tr>
                )))
              )}
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

export default ExpireReoptr;
