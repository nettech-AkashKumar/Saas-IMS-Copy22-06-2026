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
import Dollarimg from "../../assets/images/dollar.png";
import Orderimg from "../../assets/images/order.png";
import Purchaseimg from "../../assets/images/profit-cash.png";
import Dueamountimg from "../../assets/images/number-one.png";
import KasperLogo from "../../assets/images/kasper-logo.png";
import { useAuth } from "../../components/auth/AuthContext";
import { Link } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import DateFilterDropdown from "../../components/DateFilterDropdown";

// Add this with your other constants
const statusStyles = {
  received: {
    bg: "#D4F7C7",
    color: "#01774B",
    label: "Received",
  },
  converted: {
    bg: "#F7F7C7",
    color: "#746E00",
    label: "Converted",
  },
  partial: {
    bg: "#C7E6F7",
    color: "#005B74",
    label: "Partial",
  },
  draft: {
    bg: "#F3F3F3",
    color: "#6B7280",
    label: "Draft",
  },
  cancelled: {
    bg: "#F7C7C9",
    color: "#A80205",
    label: "Cancelled",
  },
  pending: {
    bg: "#FFF2D5",
    color: "#CF4F00",
    label: "Pending",
  },
  approved: {
    bg: "#D4F7C7",
    color: "#01774B",
    label: "Approved",
  },
  rejected: {
    bg: "#F7C7C9",
    color: "#A80205",
    label: "Rejected",
  },
  overdue: {
    bg: "#F7C7C9",
    color: "#A80205",
    label: "Overdue",
  },
};

function PurchaseReport() {
  const statsTop = [
    {
      title: "Total Purchase Value",
      value: "0",
      currency: "INR",
      image: Dollarimg,
      link: "",
    },
    {
      title: "Total Purchase Orders",
      value: "0",
      currency: "",
      image: Orderimg,
      link: "",
    },
    {
      title: "Total items Purchase",
      value: "0",
      currency: "INR",
      image: Purchaseimg,
      link: "",
    },
    {
      title: "Pending Purchase Orders",
      value: "0",
      currency: "INR",
      image: Dueamountimg,
      link: "",
    },
  ];
  const { user } = useAuth();
  const [purchaseData, setPurchaseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewBarcode, setViewBarcode] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [productInventory, setProductInventory] = useState({});
  const [activeRow, setActiveRow] = useState(null);
  const [initialStats, setInitialStats] = useState(statsTop);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState({ startDate: null, endDate: null });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [aggregatedProducts, setAggregatedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

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

  const calculateProductStats = (
    purchases,
    searchTerm = "",
    currentInventory = productInventory,
  ) => {
    const productMap = new Map();
    let totalCost = 0;
    let totalUnitsPurchased = 0;

    purchases.forEach((purchase) => {
      // Get the purchase order status
      const purchaseStatus = getPurchaseStatus(purchase);

      if (purchase.items && purchase.items.length > 0) {
        purchase.items.forEach((item) => {
          const productId = item.productId || item.productName;
          const productName =
            item.productName?.toLowerCase() ||
            item.itemName?.toLowerCase() ||
            "";
          const productCode =
            item.itemBarcode ||
            item.productId ||
            item.productName ||
            item.itemName ||
            "";

          // Filter by search term if provided
          if (
            searchTerm &&
            !productName.includes(searchTerm.toLowerCase()) &&
            !(productCode || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          ) {
            return; // Skip if doesn't match search
          }

          if (!productMap.has(productId)) {
            const availableQty =
              currentInventory[item.productId] ??
              currentInventory[item.itemBarcode] ??
              currentInventory[item.productName] ??
              currentInventory[item.itemName] ??
              0;
            productMap.set(productId, {
              id: productId,
              name: item.productName || item.itemName,
              code: productCode,
              unitPurchased: 0,
              totalCost: 0,
              availableQty: availableQty,
              unitPrice: item.unitPrice || item.price || 0,
              status: purchaseStatus, // Add status here
              statusKey: purchase.status?.toLowerCase() || "draft", // For styling
            });
          }

          const product = productMap.get(productId);
          const qty = parseInt(item.qty) || 0;
          product.unitPurchased += qty;
          product.totalCost +=
            item.total || item.amount || (item.unitPrice || 0) * qty;
          totalUnitsPurchased += qty;
        });
      }

      // Add purchase total to overall cost
      totalCost += purchase.grandTotal || purchase.totalAmount || 0;
    });

    // Convert to array and sort by unitPurchased (descending)
    const productsArray = Array.from(productMap.values()).sort(
      (a, b) => b.unitPurchased - a.unitPurchased,
    );

    return {
      products: productsArray,
      totalProducts: productsArray.length,
      totalCost,
      totalUnitsPurchased,
    };
  };

  const fetchAllPurchaseData = async () => {
    setLoading(true);
    try {
      await fetchProductInventory();
      const params = { page: 1, limit: 1000 };
      const response = await api.get("/api/purchase", { params });

      if (response.data.success) {
        // ✅ backend returns normalizedPurchases as "purchases"
        const purchases = response.data.purchases || [];
        setPurchaseData(purchases);

        // product stats still useful for stat cards
        const productStats = calculateProductStats(purchases, search, productInventory);
        setAggregatedProducts(productStats.products);

        // ✅ table shows purchase orders, not aggregated products
        setFilteredProducts(purchases);
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: purchases.length,
          totalPages: Math.ceil(purchases.length / prev.limit),
        }));
      }
    } catch (error) {
      toast.error("Failed to load purchase report");
    } finally {
      setLoading(false);
    }
  };

  const getPurchaseStatus = (purchaseOrder) => {
    const status = purchaseOrder.status?.toLowerCase() || "draft";

    const statusMap = {
      converted: "Converted", // Purchase order created from purchase requisition
      received: "Received", // Goods received
      partial: "Partially Received",
      draft: "Draft",
      cancelled: "Cancelled",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      overdue: "Overdue",
    };

    return statusMap[status] || "Pending";
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    const searchTerm = e.target.value;
    setSearch(searchTerm);

    if (!searchTerm) {
      setFilteredProducts(purchaseData);
      setPagination((prev) => ({
        ...prev, page: 1,
        total: purchaseData.length,
        totalPages: Math.ceil(purchaseData.length / prev.limit),
      }));
    } else {
      const filtered = purchaseData.filter((p) =>
        p.purchaseNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierId?.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      setPagination((prev) => ({
        ...prev, page: 1,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / prev.limit),
      }));
    }
  };

  const getCurrentPageProducts = () => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredProducts.slice(startIndex, endIndex);
  };

  const handleExport = () => {
    // const productsToExport =
    //   selectedRowIds.size > 0
    //     ? filteredProducts.filter((product) => selectedRowIds.has(product.code))
    //     : filteredProducts;

    // if (!productsToExport.length) {
    //   toast.warn("No products to export");
    //   return;
    // }
    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one product to export");
      return;
    }

    const productsToExport = filteredProducts.filter((p) =>
      selectedRowIds.has(p.id),
    );

    try {
      const doc = new jsPDF("portrait", "mm", "a4");

      // Add header
      doc.setFontSize(20);
      doc.setTextColor(155, 155, 155);
      doc.text("Purchase Product Report", 105, 15, { align: "center" });

      // Add date and info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Generated: ${format(new Date(), "dd MMM yyyy hh:mm a")}`,
        105,
        22,
        { align: "center" },
      );
      doc.text(`Total Products: ${productsToExport.length}`, 105, 27, {
        align: "center",
      });

      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(10, 32, 200, 32);

      // Add table data
      const tableData = productsToExport.map((row, index) => [
        index + 1,
        row.name,
        row.code,
        row.unitPurchased,
        `${row.totalCost?.toFixed(2)}`,
        row.availableQty || 0,
        row.status || "Pending",
      ]);

      autoTable(doc, {
        startY: 35,
        head: [
          [
            "#",
            "Product Name",
            "Item Code",
            "Units Purchased",
            "Total Cost",
            "Available Qty(Current Stock)",
            "Status",
          ],
        ],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [155, 155, 155],
          textColor: "white",
          fontSize: 10,
        },
        bodyStyles: { fontSize: 9 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 10, right: 10 },
      });

      // Add footer
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

      doc.save(
        `purchase_product_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`,
      );
      toast.success(`Exported ${productsToExport.length} product(s) as PDF`);

      // Clear selection
      setSelectedRowIds(new Set());
      setAllVisibleSelected(false);
    } catch (error) {
      // console.error("PDF export error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(filteredProducts.map((p) => p._id)));
    } else {
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

  const showBarcode = (product) => {
    setSelectedBarcode(product);
    setViewBarcode(true);
  };

  const closeBarcode = () => {
    setViewBarcode(false);
    setSelectedBarcode(null);
  };

  useEffect(() => {
    fetchAllPurchaseData();
  }, []);

  useEffect(() => {
    const currentPageProducts = getCurrentPageProducts();
    if (currentPageProducts.length > 0) {
      const allSelected = currentPageProducts.every((product) =>
        selectedRowIds.has(product.code),
      );
      setAllVisibleSelected(allSelected);
    } else {
      setAllVisibleSelected(false);
    }
  }, [selectedRowIds, pagination.page, filteredProducts]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewBarcode && !event.target.closest(".barcode-modal")) {
        closeBarcode();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode]);

  const currentPageProducts = getCurrentPageProducts();

  const tabs = [
    {
      label: "All",
      count: filteredProducts.length,
      active: true,
    },
  ];

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

const fetchPurchaseOrders = async () => {
  try {
    const params = { page: 1, limit: 1000 };

    const response = await api.get("/api/purchase-orders", { params });

    if (response.data.success) {
      const orders = response.data.purchaseOrders || response.data.purchases || [];
      setPurchaseOrders(orders);
    }
  } catch (error) {
  }
};

useEffect(() => {
  fetchAllPurchaseData();
  fetchPurchaseOrders();
}, []);

const computedStats = useMemo(() => {
  const totalValue = filteredProducts.reduce((sum, p) => sum + (p.grandTotal || 0), 0);
  const totalOrders = filteredProducts.length;
  const totalItems = filteredProducts.reduce((sum, p) => sum + (p.items?.length || 0), 0);
  
  const pendingOrders = purchaseOrders.filter(
    (p) => p.status?.toLowerCase() === "pending"
  ).length;

  return [
    { title: "Total Purchase Value", value: `₹${totalValue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, currency: "", image: Dollarimg, link: "" },
    { title: "Total Purchase Orders", value: totalOrders, currency: "", image: Orderimg, link: "" },
    { title: "Total Items Purchase", value: totalItems, currency: "", image: Purchaseimg, link: "" },
    { title: "Pending Purchase Orders", value: pendingOrders, currency: "", image: Dueamountimg, link: "" },
  ];
}, [filteredProducts, purchaseOrders]);

  useEffect(() => {
    let filtered = purchaseData;

    if (selectedDateRange?.startDate && selectedDateRange?.endDate) {
      const from = new Date(selectedDateRange.startDate);
      const to = new Date(selectedDateRange.endDate);
      to.setHours(23, 59, 59, 999);
      filtered = purchaseData.filter((p) => {
        const d = new Date(p.purchaseDate);
        return d >= from && d <= to;
      });
    }

    if (search) {
      filtered = filtered.filter((p) =>
        p.purchaseNo?.toLowerCase().includes(search.toLowerCase()) ||
        p.supplierId?.supplierName?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
    setPagination((prev) => ({
      ...prev,
      page: 1,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / prev.limit),
    }));
  }, [selectedDateRange, purchaseData, search]);

  const handleExcel = async () => {
    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one row to export");
      return;
    }

    const rowsToExport = filteredProducts.filter((p) => selectedRowIds.has(p._id));

    const tableColumns = [
      "SR.", "Date", "Purchase No.", "Supplier",
      "No. of Products", "Total Amount", "Tax Amount",
      "Extra Discount", "Due Amount", "Supplier Address",
    ];

    const tableRows = rowsToExport.map((p, i) => [
      i + 1,
      p.purchaseDate
        ? new Date(p.purchaseDate).toLocaleDateString("en-IN")
        : "-",
      p.purchaseNo || "-",
      p.supplierId?.supplierName || "-",
      p.items?.length || 0,
      p.grandTotal || 0,
      p.totalTax || 0,
      p.additionalDiscount?.amt || 0,
      p.dueAmount || 0,
      p.billingAddress || "-",
    ]);

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Purchase Report");

      // Column widths matching column order above
      [6, 14, 16, 22, 16, 16, 14, 16, 14, 28].forEach((w, i) => {
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
        cell.font = { bold: true };
      });

      tableRows.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `purchase_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`
      );

      toast.success(`Exported ${rowsToExport.length} row(s) successfully!`);
      setSelectedRowIds(new Set());
    } catch (error) {
      toast.error("Failed to export. Please try again.");
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
            Purchase Report
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
            style={{ textDecoration: "none", paddingRight: s.title === "Pending Purchase Orders" ? "0px" : "30px", }}
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
            {hasPermission(user, "PurchaseReport", "export") && (
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
        </div>

        {/* Table */}
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
                    // width: 123,
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
                        filteredProducts.length > 0 &&
                        selectedRowIds.size === filteredProducts.length
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
                    // width: 123,
                    fontWeight: "400",
                    backgroundColor: "#F3F8FB",
                  }}
                >
                  Purchase No.
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 123,
                    fontWeight: "400",
                    backgroundColor: "#F3F8FB",
                  }}
                >
                  Supplier
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 123,
                    fontWeight: "400",
                    backgroundColor: "#F3F8FB",
                  }}
                >
                  No. of Products
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 150,
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
                    // width: 100,
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
                    // width: 100,
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
                    // width: 100,
                    fontWeight: "400",
                    backgroundColor: "#F3F8FB",
                  }}
                >
                  Due amount
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    // width: 100,
                    fontWeight: "400",
                    backgroundColor: "#F3F8FB",
                  }}
                >
                  Supplier Address
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="13" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentPageProducts.length === 0 ? (
                <tr>
                  <td colSpan="13" className="text-center text-muted py-3">
                    No Purchase found
                  </td>
                </tr>
              ) : (
                currentPageProducts.map((purchase, index) => (
                  <tr key={purchase._id} style={{ borderBottom: "1px solid #EAEAEA" }}>
                    {/* Date */}
                    <td style={{ padding: "8px 16px", verticalAlign: "middle", height: "46px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.has(purchase._id)}
                          onChange={() => toggleSelectRow(purchase._id)}
                          style={{ width: 18, height: 18 }}
                        />
                        <div style={{ fontSize: 14, color: "#0E101A", whiteSpace: "nowrap" }}>
                          {purchase.purchaseDate
                            ? new Date(purchase.purchaseDate).toLocaleDateString("en-IN")
                            : "-"}
                        </div>
                      </div>
                    </td>

                    {/* Purchase No */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#1F7FFF", cursor: "pointer",textDecoration: "underline", }}>
                      {purchase.purchaseNo || "-"}
                    </td>

                    {/* Supplier */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      {purchase.supplierId?.supplierName || "-"}
                    </td>

                    {/* No. of Products */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      {purchase.items?.length || 0}
                    </td>

                    {/* Total Amount */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      ₹{(purchase.grandTotal || 0)}
                    </td>

                    {/* Tax Amount */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      ₹{(purchase.totalTax || 0)}
                    </td>

                    {/* Extra Discount */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      ₹{(purchase.additionalDiscount?.amt || 0)}
                    </td>

                    {/* Due Amount */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      ₹{(purchase.dueAmount || 0)}
                    </td>

                    {/* Supplier Address */}
                    <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                      {purchase.billingAddress || "-"}
                    </td>
                  </tr>
                ))
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

export default PurchaseReport;
