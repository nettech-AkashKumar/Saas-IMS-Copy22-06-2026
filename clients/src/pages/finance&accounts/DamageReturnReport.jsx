import React, { useEffect, useState, useRef } from "react";
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

function DamageReturnReport() {
    const [damageData, setDamageData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [viewBarcode, setViewBarcode] = useState(false);
    const [selectedBarcode, setSelectedBarcode] = useState(null);
    const [selectedRowIds, setSelectedRowIds] = useState(new Set());
    const [allVisibleSelected, setAllVisibleSelected] = useState(false);
    const [activeRow, setActiveRow] = useState(null);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    });

    const [activeTab, setActiveTab] = useState("All");
    const [statusCounts, setStatusCounts] = useState({
        all: 0,
        approved: 0,
        processing: 0,
        rejected: 0
    });

    // Fetch damage/return data from credit notes
    const fetchDamageData = async () => {
        setLoading(true);
        try {
            // Fetch data from credit notes API
            const [creditNotesRes, productsRes] = await Promise.all([
                api.get("/api/credit-notes", {
                    params: {
                        page: 1,
                        limit: 1000,
                        // Don't filter by status initially, fetch all and filter manually
                    }
                }),
                api.get("/api/products", { params: { page: 1, limit: 1000 } })
            ]);

            // Get product mapping for quick lookup
            const productMap = {};
            const products = productsRes.data.products || productsRes.data || [];
            products.forEach(product => {
                if (product._id) {
                    productMap[product._id] = {
                        name: product.productName,
                        category: product.category?.categoryName || "Uncategorized",
                        barcode: product.itemBarcode,
                        purchasePrice: product.purchasePrice,
                        sellingPrice: product.sellingPrice
                    };
                }
            });

            // Process credit notes data (Returns & Damages)
            const creditNotesData = Array.isArray(creditNotesRes.data) ?
                creditNotesRes.data :
                (creditNotesRes.data.data || creditNotesRes.data.creditNotes || []);

            // console.log("Credit Notes Data:", creditNotesData); // Debug log
            // console.log("Product Map:", productMap); // Debug log

            const damageTransactions = [];

            creditNotesData.forEach(creditNote => {
                // console.log("Processing credit note:", creditNote._id, "Status:", creditNote.status); // Debug

                // Only process approved/settled/applied credit notes for damage report
                const isApproved = creditNote.status === "applied" ||
                    creditNote.status === "settled" ||
                    creditNote.status === "approved";

                if (isApproved && creditNote.items && creditNote.items.length > 0) {
                    // console.log("Credit note items:", creditNote.items); // Debug

                    creditNote.items.forEach((item, index) => {
                        // console.log(`Item ${index}:`, item); // Debug

                        const product = productMap[item.productId] || {};

                        // Try multiple possible quantity field names
                        const quantity = Math.abs(parseInt(
                            item.returnQuantity ||
                            item.quantity ||
                            item.qty ||
                            item.returnQty ||
                            0
                        ));

                        // Try multiple possible unit price field names
                        const unitPrice = item.unitPrice ||
                            item.price ||
                            product.sellingPrice ||
                            0;

                        let itemAmount;
                        // Calculate total of all items without tax (subtotal)
                        const totalItemsSubtotal = creditNote.items.reduce((sum, it) => {
                            const itQuantity = Math.abs(parseInt(
                                it.returnQuantity || it.quantity || it.qty || it.returnQty || 0
                            ));
                            const itUnitPrice = it.unitPrice || it.price || 0;
                            return sum + (itQuantity * itUnitPrice);
                        }, 0);

                        // Calculate this item's subtotal
                        const itemSubtotal = quantity * unitPrice;

                        if (totalItemsSubtotal > 0 && creditNote.totalAmount) {
                            // Calculate this item's proportion of the total
                            const proportion = itemSubtotal / totalItemsSubtotal;
                            itemAmount = proportion * creditNote.totalAmount;
                        } else {
                            // Fallback - just use subtotal if we can't calculate proportion
                            itemAmount = itemSubtotal;
                        }

                        // console.log(`Calculated - Quantity: ${quantity}, Unit Price: ${unitPrice}, Item Subtotal: ${itemSubtotal}, Item Amount (with tax): ${itemAmount}`); // Debug

                        // Only add if we have a positive quantity
                        if (quantity > 0) {
                            const transaction = {
                                id: `${creditNote._id}-${item.productId}-${index}`,
                                productName: product.name || item.productName || item.itemName || "Unknown Product",
                                category: product.category || item.category || "Uncategorized",
                                itemBarcode: product.barcode || item.barcode || item.itemCode,
                                date: creditNote.date || creditNote.createdAt,
                                time: creditNote.date || creditNote.createdAt,
                                quantity: quantity,
                                purchasePrice: product.purchasePrice || 0,
                                sellingPrice: product.sellingPrice || unitPrice,
                                amount: parseFloat(itemAmount.toFixed(2)), // Round to 2 decimals
                                reason: item.reason || creditNote.notes || creditNote.reason || "Damage/Return",
                                status: "Damage/Return",
                                source: "Credit Note",
                                referenceId: creditNote.creditNoteNumber || creditNote.invoiceNumber || creditNote._id,
                                transactionDate: creditNote.date || creditNote.createdAt,
                                transactionTime: creditNote.date || creditNote.createdAt,
                                productId: item.productId,
                                creditNoteId: creditNote._id,
                                subtotal: itemSubtotal, // Keep track of subtotal for reference
                                creditNoteTotal: creditNote.totalAmount // Keep track of credit note total
                            };
                            damageTransactions.push(transaction);
                        } else {
                            // console.log(`Skipping item with quantity 0 or negative:`, item);
                        }
                    });
                }
            });

            // console.log("Final damage transactions:", damageTransactions); // Debug log

            // Sort by transaction date (newest first)
            damageTransactions.sort((a, b) => {
                const dateA = new Date(a.transactionDate || a.date);
                const dateB = new Date(b.transactionDate || b.date);
                return dateB - dateA; // Newest first
            });

            // Apply search filter
            let filteredTransactions = [...damageTransactions];
            if (search) {
                const searchLower = search.toLowerCase();
                filteredTransactions = filteredTransactions.filter(transaction =>
                    transaction.productName?.toLowerCase().includes(searchLower) ||
                    transaction.category?.toLowerCase().includes(searchLower) ||
                    transaction.itemBarcode?.toLowerCase().includes(searchLower) ||
                    transaction.referenceId?.toLowerCase().includes(searchLower) ||
                    transaction.reason?.toLowerCase().includes(searchLower)
                );
            }

            // Calculate counts
            const allCount = damageTransactions.length;
            const approvedCount = damageTransactions.length;
            const processingCount = 0;
            const rejectedCount = 0;

            setStatusCounts({
                all: allCount,
                approved: approvedCount,
                processing: processingCount,
                rejected: rejectedCount
            });

            // Apply pagination
            const total = filteredTransactions.length;
            const startIndex = (pagination.page - 1) * pagination.limit;
            const endIndex = startIndex + pagination.limit;
            const paginatedData = filteredTransactions.slice(startIndex, endIndex);

            setDamageData(paginatedData);
            setPagination(prev => ({
                ...prev,
                total: total,
                totalPages: Math.ceil(total / prev.limit)
            }));

        } catch (error) {
            // console.error("Error fetching damage data:", error);
            // console.error("Error details:", error.response?.data); // More detailed error
            toast.error("Failed to load return & damages report");
            setDamageData([]);
            setStatusCounts({ all: 0, approved: 0, processing: 0, rejected: 0 });
        } finally {
            setLoading(false);
        }
    };

    // Handle search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination(prev => ({ ...prev, page: 1 }));
            fetchDamageData();
        }, 300);

        return () => clearTimeout(timer);
    }, [search, activeTab]);

    // Fetch data on component mount and page change
    useEffect(() => {
        fetchDamageData();
    }, [pagination.page]);

    // Handle search input
    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    // Export to PDF
    const handleExport = () => {
        const dataToExport = selectedRowIds.size > 0
            ? damageData.filter((item) => selectedRowIds.has(item.id))
            : damageData;

        if (!dataToExport.length) {
            toast.warn("No data to export");
            return;
        }

        try {
            const doc = new jsPDF("portrait", "mm", "a4");

            // Add header
            doc.setFontSize(20);
            doc.setTextColor(155, 155, 155);
            doc.text("Return & Damages Report", 105, 15, { align: "center" });

            // Add date and info
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Generated: ${format(new Date(), "dd MMM yyyy hh:mm a")}`, 105, 22, { align: "center" });
            doc.text(`Total Records: ${dataToExport.length}`, 105, 27, { align: "center" });

            // Draw line
            doc.setDrawColor(200, 200, 200);
            doc.line(10, 32, 200, 32);

            // Add table data
            const tableData = dataToExport.map((item, index) => [
                index + 1,
                formatDate(item.transactionDate || item.date),
                item.productName || "N/A",
                item.itemBarcode || "N/A",
                item.quantity,
                `${item.amount.toFixed(2)}`,
                item.reason.length > 30 ? item.reason.substring(0, 30) + "..." : item.reason
            ]);

            autoTable(doc, {
                startY: 35,
                head: [
                    ["#", "Date", "Product", "Item Code", "Quantity", "Amount", "Reason"]
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
                    { align: "center" }
                );
            }

            doc.save(`return_damages_report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`);
            toast.success(`Exported ${dataToExport.length} record(s) as PDF`);

            // Clear selection
            setSelectedRowIds(new Set());
            setAllVisibleSelected(false);
        } catch (error) {
            // console.error("PDF export error:", error);
            toast.error("Failed to generate PDF");
        }
    };

    // Toggle select all for current page
    const toggleSelectAll = (e) => {
        const next = new Set(selectedRowIds);
        if (e.target.checked) {
            damageData.forEach(item => {
                if (item.id) next.add(item.id);
            });
        } else {
            damageData.forEach(item => {
                if (item.id) next.delete(item.id);
            });
        }
        setSelectedRowIds(next);
    };

    // Toggle single selection
    const toggleSelectRow = (id) => {
        const next = new Set(selectedRowIds);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelectedRowIds(next);
    };

    // Show barcode modal
    const showBarcode = (item) => {
        if (item?.itemBarcode) {
            setSelectedBarcode(item);
            setViewBarcode(true);
        }
    };

    // Close barcode modal
    const closeBarcode = () => {
        setViewBarcode(false);
        setSelectedBarcode(null);
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPagination(prev => ({ ...prev, page: 1 }));
        // You can implement filtering by status if needed
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return format(parseISO(dateString), "dd/MM/yyyy");
        } catch (error) {
            try {
                return format(new Date(dateString), "dd/MM/yyyy");
            } catch {
                return "Invalid Date";
            }
        }
    };

    // Format time
    const formatTime = (dateString) => {
        if (!dateString) return "N/A";
        try {
            return format(parseISO(dateString), "hh:mm a");
        } catch (error) {
            try {
                return format(new Date(dateString), "hh:mm a");
            } catch {
                return "Invalid Time";
            }
        }
    };

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (viewBarcode && !event.target.closest(".barcode-modal")) {
                closeBarcode();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [viewBarcode]);

    // Update allVisibleSelected for current page
    useEffect(() => {
        if (damageData.length > 0) {
            const allSelected = damageData.every(item => item.id && selectedRowIds.has(item.id));
            setAllVisibleSelected(allSelected);
        } else {
            setAllVisibleSelected(false);
        }
    }, [selectedRowIds, damageData]);

    const tabs = [
        { label: "All", count: statusCounts.all, active: activeTab === "All" },
        { label: "Approved", count: statusCounts.approved, active: activeTab === "Approved" },
        { label: "Processing", count: statusCounts.processing, active: activeTab === "Processing" },
        { label: "Rejected", count: statusCounts.rejected, active: activeTab === "Rejected" },
    ];

    return (
        <div className="px-4 py-4">
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
                        Damage & Return Report
                    </h2>
                </div>
            </div>

            {/* Main Content */}
            <div
                style={{
                    width: "100%",
                    minHeight: "auto",
                    maxHeight: "calc(100vh - 320px)",
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
                                    cursor: "pointer",
                                }}
                                onClick={() => handleTabChange(tab.label)}
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
                                placeholder="Search by product name, code, or reason"
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
                    </div>
                </div>

                {/* Table */}
                <div
                    style={{
                        overflowY: "auto",
                        maxHeight: "510px",
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
                                        width: 80,
                                        fontWeight: "400",
                                    }}
                                >
                                    <div
                                        style={{ display: "flex", alignItems: "center", gap: 12 }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
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
                                        width: 150,
                                        fontWeight: "400",
                                    }}
                                >
                                    Products
                                </th>
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
                                    Item Code
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        width: 100,
                                        fontWeight: "400",
                                    }}
                                >
                                    Quantity
                                </th>
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
                                    Amount
                                </th>
                                <th
                                    style={{
                                        textAlign: "left",
                                        padding: "4px 16px",
                                        color: "#727681",
                                        fontSize: 14,
                                        width: 200,
                                        fontWeight: "400",
                                    }}
                                >
                                    Reason
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : damageData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-3">
                                        No return or damage records found
                                    </td>
                                </tr>
                            ) : (
                                damageData.map((item, index) => (
                                    <tr
                                        key={item.id || index}
                                        className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                                        style={{ borderBottom: "1px solid #FCFCFC" }}
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
                                                    checked={selectedRowIds.has(item.id)}
                                                    onChange={() => toggleSelectRow(item.id)}
                                                    style={{ width: 18, height: 18 }}
                                                />
                                                {formatDate(item.transactionDate || item.date)}
                                                <div style={{ fontSize: 12, color: "#666" }}>
                                                    {formatTime(item.transactionTime || item.time)}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Product Name & Category */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                verticalAlign: "middle",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: 14,
                                                        color: "#0E101A",
                                                        whiteSpace: "nowrap",
                                                        display: "flex",
                                                        gap: "5px",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div>
                                                        {item.productName}
                                                        <span style={{ marginLeft: 4, color: "#727681" }}>
                                                            ₹{item.sellingPrice}/-
                                                        </span>
                                                    </div>
                                                    <span
                                                        style={{
                                                            display: "inline-block",
                                                            padding: "4px 8px",
                                                            background: "#FFE0FC",
                                                            color: "#AE009B",
                                                            borderRadius: 36,
                                                            fontSize: 12,
                                                            marginTop: 4,
                                                        }}
                                                    >
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
                                                    Ref: {item.referenceId}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Item Code */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#0E101A",
                                            }}
                                        >
                                            {item.itemBarcode ? (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 8,
                                                        cursor: "pointer",
                                                    }}
                                                    onClick={() => showBarcode(item)}
                                                >
                                                    {item.itemBarcode}
                                                    <FaBarcode className="fs-6 text-secondary" />
                                                </div>
                                            ) : (
                                                "N/A"
                                            )}
                                        </td>

                                        {/* Quantity */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#0E101A",
                                            }}
                                        >
                                            {item.quantity}
                                        </td>

                                        {/* Amount */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#0E101A",
                                            }}
                                        >
                                            ₹{item.amount.toFixed(2)}
                                        </td>

                                        {/* Reason */}
                                        <td
                                            style={{
                                                padding: "8px 16px",
                                                fontSize: 14,
                                                color: "#0E101A",
                                            }}
                                        >
                                            {item.reason.length > 30
                                                ? item.reason.substring(0, 30) + "..."
                                                : item.reason}
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
                                    <span>{selectedBarcode.productName} /</span>
                                    <span>₹{selectedBarcode.sellingPrice}/-</span>
                                </div>
                                {selectedBarcode.itemBarcode ? (
                                    <>
                                        <img src={Barcode} alt="Barcode" style={{ width: "100%" }} />
                                        <div style={{ textAlign: "center", color: "#666" }}>
                                            {selectedBarcode.itemBarcode}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                                        No barcode available
                                    </div>
                                )}
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

export default DamageReturnReport;