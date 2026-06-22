import React, { forwardRef, useState, useEffect } from 'react';
import { format } from "date-fns";
import api from "../../../pages/config/axiosInstance";
import CompanyLogo from "../../../assets/images/kasperlogo.png";
import { toWords } from "number-to-words";

export const ShipmentPrintContent = forwardRef(({ shipment, customer, companyData, banks, terms, template }, ref) => {
    if (!shipment) return null;

    const parseNumber = (val) => parseFloat(val) || 0;

    // System settings state
    const [settings, setSettings] = useState({
        brand: false,
        category: false,
        subcategory: false,
        itembarcode: false,
        hsn: false,
        description: false,
        lotno: false,
        serialno: false,
        variants: { size: false, color: false },
        units: false,
        expiry: false,
    });

    // Tax settings state
    const [taxSettings, setTaxSettings] = useState({
        enableGSTBilling: true,
        priceIncludeGST: true,
        defaultGSTRate: "18",
        autoRoundOff: "0",
    });

    // Fetch settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/api/system-settings');
                if (response.data.success) {
                    const data = response.data.data;
                    setSettings({
                        brand: data.brand || false,
                        category: data.category || false,
                        subcategory: data.subcategory || false,
                        itembarcode: data.itembarcode || false,
                        hsn: data.hsn || false,
                        description: data.description || false,
                        lotno: data.lotno || false,
                        serialno: data.serialno || false,
                        variants: {
                            size: data.variants?.size || false,
                            color: data.variants?.color || false,
                        },
                        units: data.units || false,
                        expiry: data.expiry || false,
                    });
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            }
        };
        
        const fetchTaxSettings = async () => {
            try {
                const response = await api.get('/api/tax-gst-settings');
                if (response.data.success) {
                    const data = response.data.data;
                    setTaxSettings({
                        enableGSTBilling: data.enableGSTBilling !== false,
                        priceIncludeGST: data.priceIncludeGST !== false,
                        defaultGSTRate: data.defaultGSTRate || "18",
                        autoRoundOff: data.autoRoundOff || "0",
                    });
                }
            } catch (error) {
                console.error("Error fetching tax settings:", error);
            }
        };
        
        fetchSettings();
        fetchTaxSettings();
    }, []);

    const formatSerialNumbers = (serialNumbers) => {
        if (!serialNumbers || !Array.isArray(serialNumbers)) return "-";
        const filtered = serialNumbers.filter(s => s && s !== "[]");
        if (filtered.length === 0) return "-";
        let result = "";
        for (let i = 0; i < filtered.length; i++) {
            if (i > 0) result += ", ";
            result += filtered[i];
            if ((i + 1) % 2 === 0 && i < filtered.length - 1) {
                result += ",\n";
            }
        }
        return result;
    };

    // Get transport details based on mode
    const getTransportDetails = () => {
        if (shipment.transportMode === "roadways") {
            if (shipment.subMode === "LR") {
                return {
                    mode: "Roadways (LR)",
                    documentNo: shipment.lrNo || "N/A",
                    transporter: shipment.transporterId?.transporterName || "N/A",
                    vehicle: shipment.vehicleId?.vehicleNumber || "N/A",
                    driver: shipment.driverId?.driverName || "N/A",
                    driverPhone: shipment.driverId?.phoneNumber || "N/A",
                };
            } else if (shipment.subMode === "RR") {
                return {
                    mode: "Railways (RR)",
                    documentNo: shipment.railwayReceiptNo || "N/A",
                    trainNo: shipment.trainNo || "N/A",
                    wagonNo: shipment.wagonNo || "N/A",
                };
            }
        } else if (shipment.transportMode === "railways") {
            return {
                mode: "Railways",
                documentNo: shipment.rrbNo || "N/A",
                trainNo: shipment.railwayTrainNo || "N/A",
                wagonNo: shipment.railwayWagonNo || "N/A",
            };
        }
        return { mode: "N/A", documentNo: "N/A" };
    };

    const transport = getTransportDetails();

    // Calculate totals
    const subtotal = shipment.subtotal || 0;
    const totalTax = shipment.totalTax || 0;
    const totalDiscount = shipment.totalDiscount || 0;
    const pointsRedeemedAmount = (shipment.shoppingPointsUsed || 0) * (shipment.pointValue || 10);
    const additionalChargesTotal = (shipment.additionalCharges || 0) + (shipment.freightCharge || 0) + (shipment.otherCharges || 0);
    const grandTotal = shipment.grandTotal || 0;
    const amountReceived = shipment.paidAmount || 0;

    // Calculate total quantity
    const totalQuantity = shipment.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

    // Prepare items for display
    const displayItems = shipment.items?.map(item => {
        const qty = item.quantity || 0;
        const unitPrice = item.unitPrice || 0;
        const taxRate = item.taxRate || 0;
        
        const amountWithoutTax = qty * unitPrice;
        const taxAmount = taxSettings.enableGSTBilling 
            ? (amountWithoutTax * taxRate) / 100 
            : 0;
        const totalAmount = taxSettings.enableGSTBilling 
            ? amountWithoutTax + taxAmount 
            : amountWithoutTax;
        
        return {
            ...item,
            name: item.itemName,
            itemName: item.itemName,
            hsnCode: item.hsnCode || "-",
            qty: qty,
            unit: item.unit || "-",
            lotNumber: item.lotNumber || "-",
            taxRate: taxRate,
            taxAmount: taxAmount,
            amount: totalAmount,
            unitPrice: unitPrice,
            selectedSerialNos: item.selectedSerialNos || [],
        };
    }) || [];

    // Get status style
    const getStatusStyle = (status) => {
        switch(status) {
            case 'delivered': return { color: "#0D6828", bg: "#E8F5E9" };
            case 'in_transit': return { color: "#ED6C02", bg: "#FFF3E0" };
            case 'out_for_delivery': return { color: "#1F7FFF", bg: "#EAF3FF" };
            case 'booked': return { color: "#1F7FFF", bg: "#EAF3FF" };
            case 'picked_up': return { color: "#2E7D32", bg: "#E8F5E9" };
            case 'cancelled': return { color: "#D32F2F", bg: "#FFEBEE" };
            case 'failed': return { color: "#D32F2F", bg: "#FFEBEE" };
            default: return { color: "#6B7280", bg: "#F3F4F6" };
        }
    };

    const statusStyle = getStatusStyle(shipment.status);

    return (
        <div
            ref={ref}
            style={{
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                background: "var(--White-White-1, white)",
                boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
                padding: "10px 30px",
                fontFamily: "IBM Plex Mono",
                fontSize: '10px',
            }}
        >
            {/* company logo + SHIPMENT title */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div style={{ width: "100px", height: '70px' }}>
                    <img
                        src={companyData?.companyLogo || CompanyLogo}
                        alt="company logo"
                        style={{ width: "100%", height: '100%', objectFit: "contain" }}
                    />
                </div>
                <div style={{ width: "250px", textAlign: "right" }}>
                    <span style={{
                        fontSize: '28px',
                        fontFamily: 'Garamond',
                        color: 'black',
                        fontWeight: '500',
                    }}>Shipment</span>
                </div>
            </div>

            <div
                style={{
                    width: "100%",
                    height: 0.76,
                    left: 31.77,
                    background: "var(--White-Stroke, #EAEAEA)",
                    marginTop: "8px",
                }}
            />

            {/* shipment date + shipment no */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    Shipment Date - {shipment.shipmentDate ? format(new Date(shipment.shipmentDate), "dd MMM yyyy") : "N/A"}
                </span>
                <span style={{ marginRight: "12px" }}>
                    Shipment No. - {shipment.shipmentNo}
                </span>
            </div>

            {/* Transport Mode & Status */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    Transport Mode - {transport.mode}
                </span>
                <span style={{ marginRight: "12px" }}>
                    Status - <span style={{ color: statusStyle.color }}>{shipment.status?.toUpperCase() || "N/A"}</span>
                </span>
            </div>

            {/* Document No & Invoice No */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    Document No. - {transport.documentNo}
                </span>
                {shipment.invoiceNo && (
                    <span style={{ marginRight: "12px" }}>
                        Invoice No. - {shipment.invoiceNo}
                    </span>
                )}
            </div>

            <div
                style={{
                    width: "100%",
                    height: 0.76,
                    left: 31.77,
                    marginTop: "1px",
                    background: "var(--White-Stroke, #EAEAEA)",
                }}
            />

            {/* from + to */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "2px",
                    alignItems: "center",
                    borderBottom: "1px solid #EAEAEA",
                }}
            >
                <div
                    style={{
                        borderRight: "1px solid #EAEAEA",
                        width: "50%",
                        textAlign: "center",
                    }}
                >
                    <span>From (Consignor)</span>
                </div>
                <div style={{ width: "50%", textAlign: "center" }}>
                    <span>To (Consignee)</span>
                </div>
            </div>

            {/* from = company details + to = customer details */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "2px",
                    alignItems: "center",
                    borderBottom: "1px solid #EAEAEA",
                }}
            >
                {/* company details = from (consignor) */}
                <div
                    style={{
                        borderRight: "1px solid #EAEAEA",
                        width: "50%",
                        padding: "3px",
                    }}
                >
                    <div>
                        Name:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {shipment.consignor?.name || "-"}
                        </span>
                    </div>
                    <div>
                        Address:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {shipment.consignor?.address || "-"}
                        </span>
                    </div>
                    <div>
                        Phone:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {shipment.consignor?.phone || "-"}
                        </span>
                    </div>
                    <div>
                        Email:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {shipment.consignor?.email || "-"}
                        </span>
                    </div>
                    {shipment.consignor?.gstin && (
                        <div>
                            GSTIN:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                                {shipment.consignor?.gstin}
                            </span>
                        </div>
                    )}
                </div>

                {/* customer details = to (consignee) */}
                <div style={{ width: "50%", padding: "3px 10px" }}>
                    <div>
                        Name:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {shipment.consignee?.name || "-"}
                        </span>
                    </div>
                    <div>
                        Address:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {shipment.consignee?.address || "-"}
                        </span>
                    </div>
                    <div>
                        Phone:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {shipment.consignee?.phone || "-"}
                        </span>
                    </div>
                    <div>
                        Email:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {shipment.consignee?.email || "-"}
                        </span>
                    </div>
                    {shipment.consignee?.gstin && (
                        <div>
                            GSTIN:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                                {shipment.consignee?.gstin}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Addresses Section */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "2px",
                    alignItems: "center",
                    borderBottom: "1px solid #EAEAEA",
                }}
            >
                <div
                    style={{
                        borderRight: "1px solid #EAEAEA",
                        width: "50%",
                        textAlign: "center",
                    }}
                >
                    <span>From Address</span>
                </div>
                <div style={{ width: "50%", textAlign: "center" }}>
                    <span>To Address</span>
                </div>
            </div>

            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "2px",
                    alignItems: "center",
                    borderBottom: "1px solid #EAEAEA",
                }}
            >
                <div
                    style={{
                        borderRight: "1px solid #EAEAEA",
                        width: "50%",
                        padding: "3px",
                    }}
                >
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {shipment.consignor?.address || "N/A"}
                    </span>
                </div>
                <div style={{ width: "50%", padding: "3px 10px" }}>
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {shipment.toAddress || "N/A"}
                    </span>
                </div>
            </div>

            {/* Transport Details */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "2px",
                    alignItems: "center",
                    borderBottom: "1px solid #EAEAEA",
                }}
            >
                <div
                    style={{
                        borderRight: "1px solid #EAEAEA",
                        width: "50%",
                        textAlign: "center",
                    }}
                >
                    <span>Transport Details</span>
                </div>
                {transport.driver && transport.driver !== "N/A" && (
                    <div style={{ width: "50%", textAlign: "center" }}>
                        <span>Driver Details</span>
                    </div>
                )}
            </div>

            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "2px",
                    alignItems: "center",
                    borderBottom: "1px solid #EAEAEA",
                }}
            >
                <div
                    style={{
                        borderRight: "1px solid #EAEAEA",
                        width: "50%",
                        padding: "3px",
                    }}
                >
                    {transport.transporter && transport.transporter !== "N/A" && (
                        <div>
                            Transporter:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                                {transport.transporter}
                            </span>
                        </div>
                    )}
                    {transport.vehicle && transport.vehicle !== "N/A" && (
                        <div>
                            Vehicle No.:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                                {transport.vehicle}
                            </span>
                        </div>
                    )}
                    {transport.trainNo && transport.trainNo !== "N/A" && (
                        <div>
                            Train No.:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                                {transport.trainNo}
                            </span>
                        </div>
                    )}
                    {transport.wagonNo && transport.wagonNo !== "N/A" && (
                        <div>
                            Wagon No.:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                                {transport.wagonNo}
                            </span>
                        </div>
                    )}
                    {shipment.expectedDeliveryDate && (
                        <div>
                            Expected Delivery:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                                {format(new Date(shipment.expectedDeliveryDate), "dd MMM yyyy")}
                            </span>
                        </div>
                    )}
                </div>
                {transport.driver && transport.driver !== "N/A" && (
                    <div style={{ width: "50%", padding: "3px 10px" }}>
                        <div>
                            Driver Name:{" "}
                            <span style={{ color: "black", fontWeight: "600" }}>
                                {transport.driver}
                            </span>
                        </div>
                        {transport.driverPhone && transport.driverPhone !== "N/A" && (
                            <div>
                                Driver Phone:{" "}
                                <span style={{ color: "black", fontWeight: "600" }}>
                                    {transport.driverPhone}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* product list table */}
            <div className="table-responsive mt-3">
                <table
                    style={{
                        width: "100%",
                        border: "1px solid #EAEAEA",
                        borderCollapse: "collapse",
                    }}
                >
                    <thead style={{ textAlign: "center" }}>
                        <tr>
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Sr No.</th>
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Name of the Products</th>
                            {settings.lotno && <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Lot No.</th>}
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">HSN</th>
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">QTY</th>
                            {settings.serialno && <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Serial No.</th>}
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Rate</th>
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} colSpan="2">Tax</th>
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Total</th>
                        </tr>
                        <tr>
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>%</th>
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>₹</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayItems.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ borderRight: "1px solid #EAEAEA", height: "40px", textAlign: "center" }}>{idx + 1}</td>
                                <td style={{ borderRight: "1px solid #EAEAEA", padding: "0px 20px" }}>
                                    {item.itemName || item.name || ""}
                                    {settings.description && item.description && <div style={{ display: "flex", flexDirection: "column", fontSize: "8px" }}>{item.description}</div>}
                                </td>
                                {settings.lotno && <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.lotNumber || "-"}</td>}
                                <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.hsnCode || "-"}</td>
                                <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.qty || ""}</td>
                                {settings.serialno && (
                                    <td style={{ borderRight: "1px solid #EAEAEA", height: "40px", textAlign: "center", verticalAlign: "middle" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", whiteSpace: "pre-line" }}>
                                            {item.selectedSerialNos && item.selectedSerialNos.length > 0 ? formatSerialNumbers(item.selectedSerialNos) : "-"}
                                        </div>
                                    </td>
                                )}
                                <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
                                    {item.unitPrice ? `₹${parseNumber(item.unitPrice).toFixed(2)}` : ""}
                                </td>
                                <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.taxRate || "0"}%</td>
                                <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>₹{(item.taxAmount || 0).toFixed(2)}</td>
                                <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>₹{(item.amount || 0).toFixed(2)}</td>
                            </tr>
                        ))}
                        {displayItems.length === 0 && (
                            <tr>
                                <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>No items found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Notes Section */}
            {shipment.notes && (
                <div style={{ marginTop: "10px" }}>
                    <div
                        style={{
                            width: "100%",
                            height: 0.76,
                            background: "var(--White-Stroke, #EAEAEA)",
                            marginBottom: "5px",
                        }}
                    />
                    <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Notes</div>
                    <div style={{ fontSize: "9px" }}>{shipment.notes}</div>
                </div>
            )}

            {/* pricing details */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    marginTop: "15px",
                    borderTop: "1px solid #EAEAEA",
                    borderBottom: "1px solid #EAEAEA",
                }}
            >
                <div
                    style={{
                        borderRight: "",
                        width: "50%",
                        padding: "3px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <u>Total in words</u>
                    <span
                        style={{
                            fontSize: "12px",
                            marginTop: "5px",
                            fontWeight: "600",
                            color: 'black',
                        }}
                    >
                        {toWords(grandTotal).toUpperCase()} RUPEES ONLY
                    </span>
                    <div
                        style={{
                            width: "100%",
                            height: 0.76,
                            left: 31.77,
                            background: "var(--White-Stroke, #EAEAEA)",
                            marginTop: "10px",
                        }}
                    />
                </div>

                <div
                    style={{
                        width: "50%",
                        padding: "3px",
                        borderLeft: "1px solid #EAEAEA",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #EAEAEA",
                            padding: "2px 8px",
                        }}
                    >
                        <span>Sub-total</span>
                        <span style={{ color: "black" }}>
                            ₹{subtotal.toFixed(2)}
                        </span>
                    </div>
                    {taxSettings?.enableGSTBilling && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #EAEAEA",
                                padding: "2px 8px",
                            }}
                        >
                            <span>Tax Amount</span>
                            <span style={{ color: "black" }}>
                                ₹{totalTax.toFixed(2)}
                            </span>
                        </div>
                    )}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #EAEAEA",
                            padding: "2px 8px",
                        }}
                    >
                        <span>Discount</span>
                        <span style={{ color: "black" }}>
                            ₹{totalDiscount.toFixed(2)}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #EAEAEA",
                            padding: "2px 8px",
                        }}
                    >
                        <span>🪙 Shopping Points</span>
                        <span style={{ color: "black" }}>
                            ₹{pointsRedeemedAmount.toFixed(2)}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #EAEAEA",
                            padding: "2px 8px",
                        }}
                    >
                        <span>Additional Charges</span>
                        <span style={{ color: "black" }}>
                            ₹{additionalChargesTotal.toFixed(2)}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #EAEAEA",
                            padding: "2px 8px",
                        }}
                    >
                        <span
                            style={{ fontWeight: "700", fontSize: "14px", color: 'black' }}
                        >
                            Total
                        </span>
                        <span
                            style={{
                                color: "black",
                                fontWeight: "600",
                                fontSize: "13px",
                            }}
                        >
                            ₹{grandTotal.toFixed(2)}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "1px 8px",
                        }}
                    >
                        <span>Due Amount</span>
                        <span style={{ color: "black" }}>
                            ₹{Math.max(0, grandTotal - (parseNumber(amountReceived))).toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* term & conditions + signature */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-around",
                    borderBottom: "1px solid #EAEAEA",
                    marginTop: "5px",
                }}
            >
                <div
                    style={{
                        borderRight: "",
                        width: "50%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                    }}
                >
                    <u>Term & Conditions</u>
                    <span style={{ color: 'black' }}>{terms ? terms?.termsText : "N/A"}</span>
                </div>

                {/* signature */}
                <div
                    style={{
                        width: "50%",
                        borderLeft: "1px solid #EAEAEA",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "5px 0px 10px 0px",
                        }}
                    >
                        {Array.isArray(template) && template.find(t => t.templateType === 'normal')?.signatureUrl ? (
                            <img
                                src={template.find(t => t.templateType === 'normal').signatureUrl}
                                style={{ width: '100px' }}
                                alt="signature"
                            />
                        ) : (
                            <span style={{ color: '#999', fontSize: '20px', marginTop: '20px' }}>Not Set</span>
                        )}
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            borderTop: "1px solid #EAEAEA",
                            padding: "1px 8px",
                        }}
                    >
                        <span style={{ fontWeight: "500", fontSize: "10px" }}>Signature</span>
                    </div>
                </div>
            </div>

            {/* footer = tracking info */}
            <div
                style={{
                    width: "100%",
                    justifyContent: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: "5px",
                }}
            >
                <span style={{ fontSize: "9px" }}>
                    This is a system generated document. No signature required.
                </span>
                <span style={{ fontSize: "9px", marginTop: "2px" }}>
                    For any queries, please contact us at {companyData?.companyemail || ""}
                </span>
            </div>
        </div>
    );
});