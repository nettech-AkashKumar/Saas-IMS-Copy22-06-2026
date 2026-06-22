import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { format } from "date-fns";

const PurchaseViewDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [fullyReceived, setFullyReceived] = useState(false);
    const [amountReceived, setAmountReceived] = useState(0);
    const [amountToReturn, setAmountToReturn] = useState(0);

    // State similar to debit note but with purchase data
    const [purchaseData, setPurchaseData] = useState({
        supplierId: "",
        supplierName: "",
        phone: "",
        invoiceId: "",
        invoiceNumber: "",
        date: "",
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        shippingCharges: 0,
        autoRoundOff: false,
        roundOff: 0,
        totalAmount: 0,
        fullyReceived: false,
        notes: "",
        status: "",
        invoiceDate: "",
        dueDate: "",
        referenceNo: "",
        receiptDate: "",
    });

    useEffect(() => {
        fetchPurchaseOrderDetails();
    }, [id]);

    const fetchPurchaseOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/purchase/${id}`);

            if (response.data.success) {
                const order = response.data.purchase || response.data.purchaseOrder || response.data;

                // Format items - REMOVE order-level fields from items
                const formattedItems = order.items?.map((item, index) => ({
                    id: index + 1,
                    productId: item.productId?._id || item.productId,
                    name: item.itemName || item.name || item.productId?.productName || "Product",
                    description: item.description || "",
                    quantity: item.qty || item.quantity || 0,
                    originalQuantity: item.qty || item.quantity || 0,
                    unit: item.unit || "Pcs",
                    unitPrice: item.unitPrice || item.price || 0,
                    tax: item.taxType || `GST @ ${item.taxRate || 5}%`,
                    taxRate: item.taxRate || 5,
                    taxAmount: item.taxAmount || 0,
                    discountPercent: item.discountPct || 0,
                    discountAmount: item.discountAmount || 0,
                    amount: item.amount || 0,
                    referenceNo: item.referenceNo || "",
                    receiptDate: item.receiptDate || "",
                    isSelected: true,
                })) || [];

                // Calculate totals
                let subtotal = 0;
                let totalDiscount = 0;
                let totalTax = 0;

                formattedItems.forEach((item) => {
                    subtotal += (item.quantity || 0) * (item.unitPrice || 0);
                    totalDiscount += item.discountAmount || 0;
                    totalTax += item.taxAmount || 0;
                });

                const grandTotal = order.grandTotal ||
                    (subtotal + totalTax - totalDiscount + (order.additionalCharges || order.shippingCharges || 0));

                // Get amount paid from order
                const amountPaid = order.amountPaid || order.paidAmount || 0;
                const fullyReceivedStatus = order.fullyReceived || false;

                // Update purchaseData
                setPurchaseData({
                    supplierId: order.supplierId?._id || order.supplierId || "",
                    supplierName: order.supplierId?.supplierName || order.supplierName || "Unknown Supplier",
                    phone: order.supplierId?.phone || order.phone || "",
                    purchaseId: order._id,
                    purchaseNo: order.purchaseNo || order.invoiceNumber || "",  // ✅ Changed from invoiceNumber
                    purchaseDate: order.purchaseDate || order.date || "",  // ✅ Changed from date/invoiceDate
                    dueDate: order.dueDate || "",
                    items: formattedItems,
                    subtotal: subtotal,
                    discount: totalDiscount,
                    tax: totalTax,
                    shippingCharges: order.additionalCharges || order.shippingCharges || 0,
                    autoRoundOff: order.autoRoundOff || false,
                    roundOff: order.roundOff || 0,
                    totalAmount: grandTotal,
                    fullyReceived: fullyReceivedStatus,
                    amountPaid: amountPaid,
                    notes: order.notes || "",
                    status: order.status || "",
                    referenceNo: order.referenceNo || "",
                    receiptDate: order.receiptDate || "",
                });

                // Update the other states
                setFullyReceived(fullyReceivedStatus);
                setAmountReceived(amountPaid);

            } else {
                toast.error("Failed to load purchase order details");
            }
        } catch (error) {
            console.error("Error fetching purchase details:", error);
            // toast.error("Failed to load purchase order details");
            toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message ||
                error?.message ||
                "Failed to load purchase order details"
            );
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        // Calculate amount to return/balance
        const received = parseFloat(amountReceived) || 0;
        const total = purchaseData.totalAmount || 0;
        const balance = total - received;
        setAmountToReturn(balance);
    }, [amountReceived, purchaseData.totalAmount]);

    const formatDate = (dateString) => {
        if (!dateString) return "";
        try {
            return format(new Date(dateString), "yyyy-MM-dd");
        } catch (error) {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="p-4 d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
                {/* Header - SIMILAR UI but with View Details */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                        <Link
                            to="/purchase-list"
                            style={{ marginRight: "10px" }}
                        >
                            <span
                                style={{
                                    backgroundColor: "white",
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    border: "1px solid #FCFCFC",
                                }}
                            >
                                <img src={total_orders_icon} alt="total_orders_icon" />
                            </span>
                        </Link>
                        <h4
                            className="m-0"
                            style={{
                                fontSize: "22px",
                                color: "#0E101A",
                                fontFamily: '"Inter", sans-serif',
                                fontWeight: 500,
                                lineHeight: "120%",
                            }}
                        >
                            View Details
                        </h4>
                    </div>
                    {/* Status Badge */}
                    <div className="d-flex justify-content-end mt-3">
                        <span
                            style={{
                                padding: "6px 16px",
                                borderRadius: "20px",
                                backgroundColor:
                                    purchaseData.status === "received" ? "#D1FAE5" :
                                        purchaseData.status === "cancelled" ? "#FEE2E2" :
                                            purchaseData.status === "converted" ? "#FEF3C7" :
                                                purchaseData.status === "draft" ? "#E5F0FF" : "#F3F4F6",
                                color:
                                    purchaseData.status === "received" ? "#059669" :
                                        purchaseData.status === "cancelled" ? "#DC2626" :
                                            purchaseData.status === "converted" ? "#D97706" :
                                                purchaseData.status === "draft" ? "#1F7FFF" : "#6B7280",
                                fontWeight: 500,
                                textTransform: "capitalize",
                                fontSize: "14px",
                            }}
                        >
                            {purchaseData.status || "Unknown"}
                        </span>
                    </div>
                </div>

                {/* Supplier Details Section - EXACT SAME UI structure but read-only */}
                <div
                    className="section-card"
                    style={{
                        padding: "20px",
                        height: "auto",
                        overflow: "auto",
                        maxHeight: "calc(100vh - 160px)",
                    }}
                >
                    <h6 className="section-title">Supplier Details</h6>

                    {/* Main Horizontal Wrapper - SAME */}
                    <div className="d-flex justify-content-between mb-4">
                        {/* LEFT AREA (Supplier + Phone) */}
                        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                            {/* Supplier Name */}
                            <div className="col-md-7">
                                <label className="form-label supplierlabel">
                                    Supplier Name <span className="text-danger">*</span>
                                </label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type="text"
                                        className="form-control supplierinput shadow-none"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            border: "1px solid #A2A8B8",
                                            backgroundColor: "#f8f9fa",
                                            cursor: "default",
                                        }}
                                        value={purchaseData.supplierName}
                                        readOnly
                                    />
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="col-md-7">
                                <label className="form-label supplierlabel">Phone No.</label>

                                <div className="input-group">
                                    <span
                                        className="input-group-text bg-white"
                                        style={{ border: "1px solid #A2A8B8" }}
                                    >
                                        <img
                                            src="https://flagcdn.com/in.svg"
                                            alt="India"
                                            width="20"
                                            className="me-1"
                                        />
                                        +91
                                    </span>

                                    <input
                                        type="tel"
                                        className="form-control supplierinput shadow-none"
                                        placeholder="Enter Phone"
                                        style={{
                                            border: "1px solid #A2A8B8",
                                        }}
                                        value={purchaseData.phone}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>
                        {/* LEFT END */}

                        {/* middle line */}
                        <div
                            style={{
                                width: "1px",
                                height: "70px",
                                backgroundColor: "#E0E0E0",
                                margin: "0 20px",
                            }}
                        ></div>

                        {/* RIGHT SIDE (Invoice No + Date) */}
                        <div className="d-flex flex-column gap-3">
                            {/* Invoice No */}
                            <div className="d-flex justify-content-end gap-4">
                               
                                {/* for receipt date */}
                                <div
                                    style={{
                                        padding: "6px 10px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "8px",
                                        backgroundColor: "#f8f9fa",
                                        color: "#6b7280",
                                        fontSize: "14px",
                                        minWidth: "120px",
                                    }}
                                >
                                    {formatDate(purchaseData.receiptDate) || "Receipt Date"}
                                </div>
                                {/* for reference number */}
                                <div
                                    style={{
                                        padding: "6px 10px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "8px",
                                        backgroundColor: "#f8f9fa",
                                        color: "#6b7280",
                                        fontSize: "14px",
                                        minWidth: "120px",
                                    }}
                                >
                                    {purchaseData.referenceNo || "Reference Number"}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="d-flex justify-content-end gap-4">
                                 <div style={{ position: "relative", width: "100%" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "10px 14px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "12px",
                                            backgroundColor: "#f8f9fa",
                                            cursor: "default",
                                            fontSize: "14px",
                                            fontFamily: '"Inter", sans-serif',
                                            color: "#6b7280",
                                            height: "37px",
                                            opacity: 0.8,
                                        }}
                                    >
                                        <span style={{ flex: 1 }}>
                                            {purchaseData.purchaseNo || "Purchase Invoice No"}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                    <div
                                        style={{
                                            padding: "6px 10px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "8px",
                                            backgroundColor: "#f8f9fa",
                                            color: "#6b7280",
                                            fontSize: "14px",
                                            minWidth: "120px",
                                        }}
                                    >
                                        {formatDate(purchaseData.purchaseDate) || "Purchase Date"}
                                    </div>
                                </div>
                                {/* <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                    <label style={{ fontSize: "12px", color: "#727681" }}>Due Date</label>
                                    <div
                                        style={{
                                            padding: "6px 10px",
                                            border: "1px solid #D1D5DB",
                                            borderRadius: "8px",
                                            backgroundColor: "#f8f9fa",
                                            color: "#374151",
                                            fontSize: "14px",
                                            minWidth: "120px",
                                        }}
                                    >
                                        {formatDate(purchaseData.dueDate) || "-"}
                                    </div>
                                </div> */}
                            </div>
                        </div>
                        {/* RIGHT END */}
                    </div>

                    {/* Add Products Section - EXACTLY SAME structure but read-only */}
                    <div className="mb-4">
                        <h6 className="section-title">Products</h6>

                        <table className="table po-table mt-3 table-bordered-custom">
                            <thead style={{ textAlign: "center" }}>
                                <tr>
                                    <th style={{ width: "70px", position: "relative" }}>
                                        Sl No.
                                    </th>
                                    <th style={{ textAlign: "left", position: "relative" }}>
                                        Items
                                    </th>
                                    <th style={{ position: "relative" }}>Qty</th>
                                    <th style={{ position: "relative" }}>Unit</th>
                                    <th style={{ position: "relative" }}>Unit Price</th>
                                    <th style={{ position: "relative" }}>Tax</th>
                                    <th style={{ position: "relative" }}>Tax Amount</th>
                                    <th style={{ position: "relative" }}>Discount</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>

                            <tbody>
                                {/* Display items */}
                                {purchaseData.items.length > 0
                                    ? purchaseData.items.map((item, index) => (
                                        <tr key={item.id}>
                                            <td
                                                className="numslno"
                                                style={{
                                                    border: "2px solid #1F7FFF",
                                                    position: "relative",
                                                }}
                                            >
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "15px",
                                                    justifyContent: "center"
                                                }}>
                                                    {/* No delete icon */}
                                                    {item.id}
                                                </div>
                                            </td>

                                            {/* Items */}
                                            <td
                                                className="itemsno items-cell"
                                                style={{ position: "relative" }}
                                            >
                                                <input
                                                    type="text"
                                                    className="form-control supplierinput shadow-none"
                                                    style={{
                                                        outline: "none !important",
                                                        border: "none",
                                                        backgroundColor: "transparent",
                                                    }}
                                                    value={item.name}
                                                    readOnly
                                                />
                                            </td>

                                            {/* Qty */}
                                            <td
                                                className="items-cell"
                                                style={{ width: "100px", position: "relative" }}
                                            >
                                                <input
                                                    type="text"
                                                    className="form-control center shadow-none"
                                                    style={{
                                                        width: "100%",
                                                        border: "1px solid #A2A8B8",
                                                        backgroundColor: "#f8f9fa",
                                                    }}
                                                    value={item.quantity}
                                                    readOnly
                                                />
                                            </td>

                                            {/* Unit */}
                                            <td
                                                className="items-cell"
                                                style={{ width: "100px", position: "relative" }}
                                            >
                                                <select
                                                    className="form-control center shadow-none"
                                                    style={{
                                                        width: "100%",
                                                        border: "1px solid #A2A8B8",
                                                        backgroundColor: "#f8f9fa",
                                                    }}
                                                    value={item.unit}
                                                    disabled
                                                    readOnly
                                                >
                                                    <option>Pcs</option>
                                                    <option>Kg</option>
                                                    <option>Gram</option>
                                                    <option>Liter</option>
                                                    <option>Meter</option>
                                                </select>
                                            </td>

                                            {/* Unit Price */}
                                            <td
                                                className="items-cell"
                                                style={{ width: "120px", position: "relative" }}
                                            >
                                                <input
                                                    type="text"
                                                    className="form-control shadow-none"
                                                    style={{
                                                        border: "1px solid #A2A8B8",
                                                        backgroundColor: "#f8f9fa",
                                                    }}
                                                    value={`₹${item.unitPrice.toFixed(2)}`}
                                                    readOnly
                                                />
                                            </td>

                                            {/* Tax */}
                                            <td
                                                className="items-cell"
                                                style={{ width: "120px", position: "relative" }}
                                            >
                                                <input
                                                    type="text"
                                                    className="form-control  shadow-none"
                                                    style={{
                                                        border: "1px solid #A2A8B8",
                                                        backgroundColor: "#f8f9fa",
                                                    }}
                                                    value={item.tax}
                                                    readOnly
                                                />
                                            </td>

                                            {/* Tax Amount */}
                                            <td
                                                className="items-cell"
                                                style={{ width: "120px", position: "relative" }}
                                            >
                                                <input
                                                    type="text"
                                                    placeholder="₹0.00"
                                                    className="form-control shadow-none"
                                                    style={{
                                                        border: "1px solid #A2A8B8",
                                                        backgroundColor: "#f8f9fa",
                                                    }}
                                                    value={`₹${item.taxAmount.toFixed(2)}`}
                                                    readOnly
                                                />
                                            </td>

                                            {/* Discount */}
                                            <td
                                                className="items-cell"
                                                style={{ width: "200px", position: "relative" }}
                                            >
                                                <div
                                                    className="discount-box"
                                                    style={{ display: "flex", gap: "10px" }}
                                                >
                                                    <div style={{ position: "relative" }}>
                                                        <input
                                                            type="text"
                                                            className="form-control  shadow-none"
                                                            style={{
                                                                height: "38px",
                                                                paddingRight: "30px",
                                                                width: "100%",
                                                                border: "1px solid #A2A8B8",
                                                                backgroundColor: "#f8f9fa",
                                                            }}
                                                            value={`${item.discountPercent}%`}
                                                            readOnly
                                                        />
                                                        <div
                                                            className="symbol"
                                                            style={{
                                                                height: "36px",
                                                                position: "absolute",
                                                                right: "0px",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                pointerEvents: "none",
                                                                color: "#555",
                                                            }}
                                                        >
                                                            %{" "}
                                                        </div>
                                                    </div>
                                                    <div style={{ position: "relative" }}>
                                                        <input
                                                            type="text"
                                                            className="form-control shadow-none"
                                                            style={{
                                                                height: "38px",
                                                                width: "100%",
                                                                border: "1px solid #A2A8B8",
                                                                backgroundColor: "#f8f9fa",
                                                            }}
                                                            value={`₹${item.discountAmount.toFixed(2)}`}
                                                            readOnly
                                                        />
                                                        <div
                                                            style={{
                                                                height: "36px",
                                                                position: "absolute",
                                                                right: "0px",
                                                                top: "50%",
                                                                transform: "translateY(-50%)",
                                                                pointerEvents: "none",
                                                                color: "#555",
                                                            }}
                                                            className="symbol"
                                                        >
                                                            ₹{" "}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Amount */}
                                            <td style={{ width: "120px" }}>
                                                <input
                                                    type="text"
                                                    className="form-control shadow-none"
                                                    style={{
                                                        width: "100%",
                                                        border: "1px solid #A2A8B8",
                                                        backgroundColor: "#f8f9fa",
                                                    }}
                                                    value={`₹${item.amount.toFixed(2)}`}
                                                    readOnly
                                                />
                                            </td>
                                        </tr>
                                    ))
                                    : /* Show 1 empty row by default */
                                    [1].map((num) => (
                                        <tr key={num}>
                                            <td
                                                className="numslno"
                                                style={{
                                                    border: "2px solid #1F7FFF",
                                                    position: "relative",
                                                }}
                                            >
                                                {num}
                                            </td>

                                            {/* Items */}
                                            <td
                                                className="itemsno items-cell"
                                                style={{ position: "relative" }}
                                            >
                                                <input
                                                    type="text"
                                                    className="form-control supplierinput shadow-none"
                                                    placeholder="No items"
                                                    style={{
                                                        outline: "none !important",
                                                        border: "none",
                                                    }}
                                                    readOnly
                                                />
                                            </td>

                                            {/* Rest of cells */}
                                            {[...Array(7)].map((_, i) => (
                                                <td
                                                    key={i}
                                                    className="items-cell"
                                                    style={{ width: i === 5 ? "200px" : "150px", position: "relative" }}
                                                >
                                                    <input
                                                        type="text"
                                                        className="form-control shadow-none"
                                                        style={{
                                                            border: "1px solid #A2A8B8",
                                                            backgroundColor: "#f8f9fa",
                                                        }}
                                                        readOnly
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment + Summary - EXACTLY SAME structure but read-only */}
                    <div className="row">
                        {/* Payment Left */}
                        <div className="col-md-7">
                            <div className="">
                                <h6 className="section-title" style={{ color: "#0E101A" }}>
                                    Payment Details
                                </h6>
                                <div className="mt-3">
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        style={{ backgroundColor: "#f8f9fa" }}
                                        value={purchaseData.notes || "No notes available"}
                                        readOnly
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Summary Right */}
                        <div className="col-md-5">
                            <div className="p-4">
                                <div className="summary-line">
                                    <span
                                        style={{
                                            color: "#0E101A",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        Subtotal :
                                    </span>
                                    <span
                                        style={{
                                            color: "#0E101A",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        ₹{purchaseData.subtotal.toFixed(2)}
                                    </span>
                                </div>
                                <div className="summary-line">
                                    <span
                                        style={{
                                            color: "#727681",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        Discount:
                                    </span>
                                    <span
                                        style={{
                                            color: "#727681",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        ₹{purchaseData.discount.toFixed(2)}
                                    </span>
                                </div>
                                <div className="summary-line">
                                    <span
                                        style={{
                                            color: "#727681",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        Tax:
                                    </span>
                                    <span
                                        style={{
                                            color: "#727681",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        ₹{purchaseData.tax.toFixed(2)}
                                    </span>
                                </div>
                                <div className="summary-line">
                                    <span
                                        style={{
                                            color: "#727681",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        Shipping Charges:
                                    </span>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span>₹</span>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            style={{
                                                width: "80px",
                                                padding: "2px 8px",
                                                backgroundColor: "#f8f9fa"
                                            }}
                                            value={purchaseData.shippingCharges.toFixed(2)}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="summary-line">
                                    <span>
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={purchaseData.autoRoundOff}
                                            disabled
                                            readOnly
                                        />
                                        <span
                                            style={{
                                                color: "#0E101A",
                                                fontWeight: 400,
                                                fontSize: "16px",
                                                lineHeight: "120%",
                                                fontFamily: 'Inter", sans-serif',
                                                marginLeft: "10px",
                                            }}
                                        >
                                            Auto Round-off
                                        </span>
                                    </span>
                                    <span
                                        style={{
                                            color: "#0E101A",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        {purchaseData.roundOff >= 0 ? "+" : "-"}₹
                                        {Math.abs(purchaseData.roundOff).toFixed(2)}
                                    </span>
                                </div>
                                <hr style={{ color: "#727681" }} />
                                <div className="summary-line">
                                    <h5
                                        style={{
                                            color: "#0E101A",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        Total Amount :-
                                    </h5>
                                    <h4
                                        style={{
                                            color: "#0E101A",
                                            fontWeight: 500,
                                            fontSize: "16px",
                                            lineHeight: "120%",
                                            fontFamily: 'Inter", sans-serif',
                                        }}
                                    >
                                        ₹{purchaseData.totalAmount.toFixed(2)}
                                    </h4>
                                </div>
                                <div className="form-check mb-2">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={fullyReceived}
                                        disabled
                                        readOnly
                                    />
                                    <label
                                        className="form-check-label"
                                        style={{
                                            color: "#727681",
                                            fontWeight: 400,
                                            fontSize: "16px",
                                        }}
                                    >
                                        Fully Received
                                    </label>
                                </div>

                                {/* Amount Inputs */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "16px",
                                        marginTop: "12px",
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#6b7280",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            Amount Received
                                        </div>
                                        <div
                                            style={{
                                                width: "100%",
                                                borderRadius: "10px",
                                                padding: "10px",
                                                border: "1px solid #e5e7eb",
                                                background: "#f9fafb",
                                                outline: "none",
                                                display: "flex",
                                            }}
                                        >
                                            ₹
                                            <input
                                                placeholder="0.00"
                                                className=""
                                                value={amountReceived === 0 ? "0.00" : amountReceived.toFixed(2)}
                                                readOnly
                                                style={{
                                                    borderRadius: "10px",
                                                    border: "none",
                                                    background: "#f9fafb",
                                                    outline: "none",
                                                    width: "100%",
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#6b7280",
                                                marginBottom: "6px",
                                            }}
                                        >
                                            Amount {amountToReturn >= 0 ? "to Pay" : "to Return"}
                                        </div>
                                        <div
                                            style={{
                                                width: "100%",
                                                borderRadius: "10px",
                                                padding: "10px",
                                                border: "1px solid #e5e7eb",
                                                background: "#f9fafb",
                                                outline: "none",
                                                display: "flex",
                                            }}
                                        >
                                            ₹
                                            <input
                                                placeholder="0.00"
                                                className=""
                                                value={Math.abs(amountToReturn).toFixed(2)}
                                                readOnly
                                                style={{
                                                    borderRadius: "10px",
                                                    border: "none",
                                                    background: "#f9fafb",
                                                    outline: "none",
                                                    width: "100%",
                                                    color: amountToReturn > 0 ? "#DC2626" : amountToReturn < 0 ? "#059669" : "#374151",
                                                    fontWeight: amountToReturn !== 0 ? 500 : 400,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseViewDetails;