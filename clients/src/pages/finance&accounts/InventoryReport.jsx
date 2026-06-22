import React, { useEffect, useState, useRef, useMemo } from "react";
import { IoIosSearch } from "react-icons/io";
import { FaBarcode } from "react-icons/fa6";
import { TbFileExport } from "react-icons/tb";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import api from "../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
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
import DateFilterDropdown from "../../components/DateFilterDropdown";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function InventoryReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewBarcode, setViewBarcode] = useState(false);
  const [selectedBarcode, setSelectedBarcode] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [activeRow, setActiveRow] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedDateRange, setSelectedDateRange] = useState({ startDate: null, endDate: null });

  // Raw data from APIs
  const [salesData, setSalesData] = useState([]);       // direct sales invoices
  const [posData, setPosData] = useState([]);           // POS transactions
  const [purchaseData, setPurchaseData] = useState([]); // purchase orders

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // ─── Fetch all three sources ───────────────────────────────────────────────
  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [salesRes, posRes, purchaseRes, productsRes] = await Promise.all([
        api.get("/api/invoices", { params: { page: 1, limit: 1000 } }),
        api.get("/api/pos-sales/transactions", { params: { page: 1, limit: 1000 } }),
        api.get("/api/purchase-orders", { params: { page: 1, limit: 1000 } }),
        api.get("/api/products", { params: { page: 1, limit: 1000 } }),
      ]);

      // Build product lookup map
      const productMap = {};
      (productsRes.data?.products || []).forEach((p) => {
        if (p?._id) productMap[p._id] = { name: p.productName, category: p.category?.categoryName || "Uncategorized", barcode: p.itemBarcode, price: p.sellingPrice };
      });

      // ─── Stock Out: Direct Sales ───────────────────────────────────────────
      const invoices = salesRes.data?.invoices || [];
      const stockOutDirect = [];
      invoices.forEach((sale) => {
        (sale.items || []).forEach((item, idx) => {
          const pId = item.productId?._id || item.productId;
          const product = (pId && productMap[pId]) || {};
          stockOutDirect.push({
            id: `sale-${sale._id}-${idx}`,
            productName: product.name || item.productName || item.itemName || "-",
            category: product.category || "-",
            itemBarcode: product.barcode || item.itemBarcode || null,
            date: sale.invoiceDate || sale.createdAt,
            quantity: Math.abs(parseInt(item.qty) || 0),
            unit: item.unit || "-",
            status: "Out",
            source: "Sale",
            referenceId: sale.invoiceNo || sale._id,
            price: item.unitPrice || product.price || 0,
            discountAmount: item.discount || 0,
            totalAmount: item.grandTotal || 0,
            paymentType: sale.paymentType || "-",
            _raw: sale,
          });
        });
      });

      // ─── Stock Out: POS ────────────────────────────────────────────────────
      const posSales = posRes?.data?.data || [];
      const stockOutPOS = [];
      (Array.isArray(posSales) ? posSales : []).forEach((pos) => {
        (pos.items || []).forEach((item, idx) => {
          // productId is populated — pull barcode & category from it
          const populated = item.productId && typeof item.productId === "object" ? item.productId : {};

          stockOutPOS.push({
            id: `pos-${pos._id}-${idx}`,
            productName: item.productName || populated.productName || item.itemName || "-",
            category: item.category || populated.category?.categoryName || "-", 
            itemBarcode: item.itemBarcode || populated.itemBarcode || null, 
            date: pos.createdAt,
            quantity: Math.abs(parseInt(item.quantity) || 0),
            unit: item.unit || "-",
            status: "Out",
            source: "POS",
            referenceId: pos.invoiceNumber || pos._id,
            price: item.unitPrice || item.price || 0,
            discountAmount: item.discount || 0,
            totalAmount: item.totals?.totalAmount || 0,
            paymentType: pos.paymentDetails?.paymentMethod || "-",
            _raw: pos,
          });
        });
      });

      // ─── Stock In: Purchase ────────────────────────────────────────────────
      const purchases = purchaseRes.data?.purchaseOrders || purchaseRes.data?.purchases || purchaseRes.data?.invoices || [];
      const stockIn = [];
      (Array.isArray(purchases) ? purchases : []).forEach((purchase) => {
        (purchase.items || []).forEach((item, idx) => {
          const pId = item.productId?._id || item.productId;
          const productFromItem = item.productId && typeof item.productId === "object" ? item.productId : {};
          const product = (pId && productMap[pId]) || {};
          stockIn.push({
            id: `purchase-${purchase._id}-${idx}`,
            productName: product.name || productFromItem.productName || item.itemName || item.productName || "-",
            category: product.category || "-",
            itemBarcode: product.barcode || item.itemBarcode || null,
            date: purchase.purchaseDate || purchase.invoiceDate || purchase.createdAt,
            quantity: Math.abs(parseInt(item.qty) || 0),
            unit: item.unit || "-",
            status: "In",
            source: "Purchase",
            referenceId: purchase.purchaseNo || purchase.invoiceNo || purchase._id,
            price: item.unitPrice || item.price || product.price || 0,
            discountAmount: item.discount || 0,
            totalAmount: item.total || item.amount || 0,
            paymentType: purchase.paymentType || "-",
            _raw: purchase,
          });
        });
      });

      setSalesData(stockOutDirect);
      setPosData(stockOutPOS);
      setPurchaseData(stockIn);
    } catch (error) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventoryData(); }, []);

  // ─── Apply date + search + tab filter ─────────────────────────────────────
  const filteredData = useMemo(() => {
    // Determine base data by tab
    let base = [];
    if (activeTab === "Stock In") base = purchaseData;
    else if (activeTab === "Stock Out") base = [...salesData, ...posData];
    else base = [...purchaseData, ...salesData, ...posData];

    // Date filter
    if (selectedDateRange?.startDate && selectedDateRange?.endDate) {
      const from = new Date(selectedDateRange.startDate);
      const to = new Date(selectedDateRange.endDate);
      to.setHours(23, 59, 59, 999);
      base = base.filter((item) => {
        const d = new Date(item.date);
        return d >= from && d <= to;
      });
    }

    // Search filter
    if (search) {
      const term = search.toLowerCase();
      base = base.filter((item) =>
        item.productName?.toLowerCase().includes(term) ||
        item.category?.toLowerCase().includes(term) ||
        item.itemBarcode?.toLowerCase().includes(term) ||
        item.referenceId?.toLowerCase().includes(term)
      );
    }

    // Sort newest first
    return [...base].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activeTab, purchaseData, salesData, posData, selectedDateRange, search]);

  // ─── Paginated slice ───────────────────────────────────────────────────────
  const currentPageData = useMemo(() => {
    const start = (pagination.page - 1) * pagination.limit;
    return filteredData.slice(start, start + pagination.limit);
  }, [filteredData, pagination.page, pagination.limit]);

  // Keep pagination total in sync
  useEffect(() => {
    setPagination((prev) => ({
      ...prev, page: 1,
      total: filteredData.length,
      totalPages: Math.ceil(filteredData.length / prev.limit),
    }));
  }, [filteredData]);

  // ─── Tab counts (unfiltered by date/search, just by source) ───────────────
  const tabCounts = useMemo(() => ({
    all: filteredData.length,  // reflects current filters
    in: filteredData.filter(i => i.status === "In").length,
    out: filteredData.filter(i => i.status === "Out").length,
  }), [filteredData]);

  // ─── Computed stat cards ───────────────────────────────────────────────────
  const computedStats = useMemo(() => {
    const inRange = (dateStr) => {
      if (!selectedDateRange?.startDate || !selectedDateRange?.endDate) return true;
      const d = new Date(dateStr);
      const from = new Date(selectedDateRange.startDate);
      const to = new Date(selectedDateRange.endDate);
      to.setHours(23, 59, 59, 999);
      return d >= from && d <= to;
    };

    // ─── Direct sales: sum grandTotal per invoice (not per item) ──────────────
    // Get unique invoices from salesData rows that pass date filter
    const seenSaleIds = new Set();
    let directSalesRevenue = 0;
    salesData.forEach((item) => {
      const invoiceId = item._raw?._id;
      if (invoiceId && !seenSaleIds.has(invoiceId) && inRange(item.date)) {
        seenSaleIds.add(invoiceId);
        directSalesRevenue += item._raw?.grandTotal || 0;
      }
    });

    // ─── POS: sum totals.totalAmount per transaction ──────────────────────────
    const seenPosIds = new Set();
    let posRevenue = 0;
    posData.forEach((item) => {
      const posId = item._raw?._id;
      if (posId && !seenPosIds.has(posId) && inRange(item.date)) {
        seenPosIds.add(posId);
        posRevenue += item._raw?.totals?.totalAmount || 0;
      }
    });

    // ─── Purchase: sum grandTotal per purchase order ──────────────────────────
    const seenPurchaseIds = new Set();
    let totalPurchaseCost = 0;
    purchaseData.forEach((item) => {
      const purchaseId = item._raw?._id;
      if (purchaseId && !seenPurchaseIds.has(purchaseId) && inRange(item.date)) {
        seenPurchaseIds.add(purchaseId);
        totalPurchaseCost += item._raw?.grandTotal || item._raw?.totalAmount || 0;
      }
    });

    // ─── Formulas ──────────────────────────────────────────────────────────────
    const totalRevenue = (directSalesRevenue + posRevenue).toFixed(2);       // ✅ all money customers paid
    const grossProfit = (totalRevenue - totalPurchaseCost).toFixed(2);      // ✅ SP - CP

    // Product quantities (per item rows, date-filtered)
    const filteredIn = purchaseData.filter((i) => inRange(i.date));
    const filteredOut = [...salesData, ...posData].filter((i) => inRange(i.date));
    const productsPurchased = filteredIn.reduce((s, i) => s + (i.quantity || 0), 0);
    const productsSold = filteredOut.reduce((s, i) => s + (i.quantity || 0), 0);
    const productSoldNet = (productsPurchased - productsSold).toFixed(2);

    // Unique order/invoice counts
    const totalOrders = seenSaleIds.size + seenPosIds.size + seenPurchaseIds.size;

    return [
      { title: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, currency: "", image: Dollarimg, link: "" },
      { title: "Product Sold", value: productSoldNet, currency: "", image: Orderimg, link: "" },
      { title: "Gross Profit", value: `₹${grossProfit.toLocaleString("en-IN")}`, currency: "", image: Purchaseimg, link: "" },
    ];
  }, [purchaseData, salesData, posData, selectedDateRange]);

  // ─── Checkboxes ───────────────────────────────────────────────────────────
  const toggleSelectAll = (e) => {
    if (e.target.checked) setSelectedRowIds(new Set(filteredData.map((i) => i.id)));
    else setSelectedRowIds(new Set());
  };

  const toggleSelectRow = (id) => {  // ✅ fixed — was incorrectly using toggleSelectAll in rows
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSearch = (e) => setSearch(e.target.value);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedRowIds(new Set());
  };

  const tabs = [
    { label: "All", count: tabCounts.all, active: activeTab === "All" },
    { label: "Stock In", count: tabCounts.in, active: activeTab === "Stock In" },
    { label: "Stock Out", count: tabCounts.out, active: activeTab === "Stock Out" },
  ];

  // ─── Barcode handlers (unchanged) ─────────────────────────────────────────
  const showBarcode = (item) => { if (item?.itemBarcode) { setSelectedBarcode(item); setViewBarcode(true); } };
  const closeBarcode = () => { setViewBarcode(false); setSelectedBarcode(null); };

  useEffect(() => {
    const handleClickOutside = (e) => { if (viewBarcode && !e.target.closest(".barcode-modal")) closeBarcode(); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode]);

  useEffect(() => {
    if (viewBarcode && selectedBarcode?.itemBarcode) {
      setTimeout(() => {
        try {
          JsBarcode(`#barcode-svg-${selectedBarcode.itemBarcode}`, selectedBarcode.itemBarcode, { format: "CODE128", width: 2, height: 100, displayValue: true });
        } catch (e) { }
      }, 100);
    }
  }, [viewBarcode, selectedBarcode]);

  const handleExport = () => {
    if (selectedRowIds.size === 0) { toast.warning("Please select at least one row to export"); return; }
    const dataToExport = filteredData.filter((i) => selectedRowIds.has(i.id));
    try {
      const doc = new jsPDF("portrait", "mm", "a4");
      doc.setFontSize(20); doc.setTextColor(155, 155, 155);
      doc.text("Inventory Report", 105, 15, { align: "center" });
      doc.setFontSize(10); doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy hh:mm a")}`, 105, 22, { align: "center" });
      autoTable(doc, {
        startY: 30,
        head: [["#", "Date", "Product", "Category", "Qty", "Unit", "Source", "Reference No", "Stock", "Price", "Total"]],
        body: dataToExport.map((item, i) => [
          i + 1,
          new Date(item.date).toLocaleDateString("en-IN"),
          item.productName, item.category, item.quantity, item.unit || "-",
          item.source, item.referenceId, item.status,
          `₹${item.price}`, `₹${item.totalAmount}`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [155, 155, 155], textColor: "white", fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: 10, right: 10 },
      });
      doc.save(`inventory_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`);
      toast.success(`Exported ${dataToExport.length} record(s)`);
      setSelectedRowIds(new Set());
    } catch (e) { toast.error("Failed to export"); }
  };

  const handleExcel = async () => {
    if (selectedRowIds.size === 0) {
      toast.error("Select at least 1 row to export data");
      return;
    }

    const selectedRows = filteredData.filter((item) => selectedRowIds.has(item.id));
    if (selectedRows.length === 0) {
      toast.error("No matching rows to export");
      return;
    }

    try {
      const tableColumns = [
        "SR.", "Date", "Product Name", "Item Code", "QTY", "Unit",
        "Transaction Source", "Reference No", "Payment Type",
        "Stock IN/OUT", "Category", "Price", "Discount Amount", "Total Amount",
      ];

      const tableRows = selectedRows.map((item, i) => [
        i + 1,
        new Date(item.date).toLocaleString("en-GB", {
          day: "2-digit", month: "numeric", year: "numeric",
          hour: "2-digit", minute: "2-digit", hour12: true,
        }),
        item.productName || "-",
        item.itemBarcode || "-",
        item.quantity || 0,
        item.unit || "-",
        item.source || "-",
        item.referenceId || "-",
        item.paymentType || "-",
        `Stock ${item.status}`,
        item.category || "-",
        item.price || 0,
        item.discountAmount || 0,
        item.totalAmount || 0,
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Inventory Report");

      // Column widths matching column order above
      [6, 22, 24, 16, 8, 8, 18, 18, 16, 14, 16, 12, 16, 16].forEach((w, i) => {
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
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `inventory_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`
      );

      toast.success(`Inventory Report exported successfully! (${selectedRows.length} rows)`);
      setSelectedRowIds(new Set());
    } catch (error) {
      toast.error("Failed to export. Please try again.");
    }
  };

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "91vh" }}>
      {/* Header */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 0px 16px 0px" }}>
        <h2 style={{ margin: 0, color: "black", fontSize: 22, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Product Timeline</h2>
        <DateFilterDropdown selectedDateRange={selectedDateRange} setSelectedDateRange={setSelectedDateRange} />
      </div>

      <div className="d-flex flex-wrap g-3 mb-3">
        {computedStats.map((s, idx) => (
          <Link to={s.link} key={idx} className="col-3"
            style={{ textDecoration: "none", paddingRight: s.title === "Total Orders/Invoices" ? "0px" : "30px" }}>
            <div className="d-flex justify-content-between align-items-center bg-white position-relative"
              style={{ width: "100%", height: "86px", padding: "16px 24px 16px 16px", fontFamily: "Inter", boxShadow: "0px 1px 4px 0px rgba(0,0,0,0.10)", border: "1px solid #E5F0FF", borderRadius: "8px" }}>
              <span style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: "4px", height: "70%", backgroundColor: "#1F7FFF", borderRadius: "1px 10px 1px 10px" }} />
              <div className="d-flex align-items-center" style={{ gap: "24px" }}>
                <div className="d-flex flex-column" style={{ gap: "11px" }}>
                  <h6 className="mb-0" style={{ fontSize: "14px", color: "#727681", fontWeight: "500" }}>{s.title}</h6>
                  <h5 className="mb-0" style={{ fontSize: "22px", color: "#0E101A", fontWeight: "600" }}>{s.value}</h5>
                </div>
              </div>
              <div className="d-flex justify-content-center align-items-center rounded-circle"
                style={{ width: "50px", height: "50px", backgroundColor: "#FFFFFF", border: "1px solid #E5F0FF", flexShrink: 0 }}>
                <img src={s.image} alt={s.title} style={{ width: "36px", height: "36px", objectFit: "contain" }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content — keep your existing wrapper styles */}
      <div style={{ width: "100%", padding: 16, background: "white", borderRadius: 16, display: "flex", flexDirection: "column", gap: 16, fontFamily: "Inter, sans-serif" }}>

        {/* Tabs + Search + Export — keep your existing styles, just update tab rendering */}
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", height: "33px" }}>
          {/* tabs */}
          <div style={{ display: "flex", gap: 8, padding: 2, background: "#F3F8FB", borderRadius: 8, height: "33px", width: "fit-content" }}>
            {tabs.map((tab) => (
              <div key={tab.label} onClick={() => handleTabChange(tab.label)}
                style={{ padding: "4px 12px", background: tab.active ? "white" : "transparent", borderRadius: 8, boxShadow: tab.active ? "0px 1px 4px rgba(0,0,0,0.10)" : "none", display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#0E101A", cursor: "pointer" }}>
                {tab.label} <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>
          {/* Search + Export */}
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
            {hasPermission(user, "InventoryReport", "export") && (
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
        <div className="table-responsive" style={{ overflowY: "auto", height: "calc(100vh - 310px)", maxHeight: "505px" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, backgroundColor: "#F3F8FB", height: "38px", }}>
              <tr style={{ background: "#F3F8FB" }}>
                {["Date", "Product Name", "Item Code", "QTY", "Unit", "Transaction Source", "Reference No", "Payment Type", "Stock IN/OUT", "Category", "Price", "Discount Amount", "Total Amount"].map((col) => (
                  <th key={col} style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, fontWeight: "400", backgroundColor: "#F3F8FB" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {col === "Date" && (
                        <input type="checkbox"
                          checked={filteredData.length > 0 && selectedRowIds.size === filteredData.length}
                          onChange={toggleSelectAll}
                          style={{ width: 18, height: 18 }} />
                      )}
                      {col}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="13" className="text-center py-4"><div className="spinner-border text-primary" role="status" /></td></tr>
              ) : currentPageData.length === 0 ? (
                <tr><td colSpan="13" className="text-center text-muted py-3">No inventory records found</td></tr>
              ) : currentPageData.map((item, index) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #EAEAEA", cursor: "pointer" }}>
                  <td style={{ padding: "8px 16px", verticalAlign: "middle", height: "46px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, color: "black" }}>
                      {/* ✅ fixed: uses toggleSelectRow not toggleSelectAll */}
                      <input type="checkbox" checked={selectedRowIds.has(item.id)} onChange={() => toggleSelectRow(item.id)} style={{ width: 18, height: 18 }} />
                      {new Date(item.date).toLocaleString("en-GB", { day: "2-digit", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                    </div>
                  </td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{item.productName}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>
                    {item.itemBarcode ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => showBarcode(item)}>
                        {item.itemBarcode} <FaBarcode className="fs-6 text-secondary" />
                      </div>
                    ) : "N/A"}
                  </td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{item.quantity}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{item.unit}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{item.source}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#1F7FFF" }}>{item.referenceId || "-"}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{item.paymentType}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500, backgroundColor: item.status === "In" ? "#E6F9F0" : "#FFF2D5", color: item.status === "In" ? "#14A060" : "#CF4F00" }}>
                      Stock {item.status}
                    </span>
                  </td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>{item.category}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>₹{item.price}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>₹{item.discountAmount || 0}</td>
                  <td style={{ padding: "8px 16px", fontSize: 14, color: "#0E101A" }}>₹{item.totalAmount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination currentPage={pagination.page} total={pagination.total} itemsPerPage={pagination.limit}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onItemsPerPageChange={(val) => setPagination((prev) => ({ ...prev, limit: val, page: 1 }))} />
        </div>
      </div>
    </div>
  );
};
export default InventoryReport;
