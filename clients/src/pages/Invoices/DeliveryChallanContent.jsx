import React, { forwardRef, useState, useEffect } from 'react';
import { format } from "date-fns";
import api from "../config/axiosInstance";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import { toWords } from "number-to-words";

export const DeliveryChallanContent = forwardRef(({ challan, customer, companyData, banks, terms, template }, ref) => {
    if (!challan) return null;

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
       // Calculate totals from challan data
    const subtotal = challan.subtotal || 0;
    const totalTax = challan.totalTax || 0;
    const totalDiscount = challan.totalDiscount || 0;
    const pointsRedeemedAmount = challan.pointsRedeemedAmount || 0;
    const additionalChargesTotal = challan.additionalCharges || 0;
    const grandTotal = challan.grandTotal || 0;
    const amountReceived = challan.paidAmount || 0;

    // Calculate total quantity
    const totalQuantity = challan.items?.reduce((sum, item) => sum + (item.qty || item.dispatchedQty || 0), 0) || 0;

    // Prepare items for display
  // Update this section in DeliveryChallanContent component
const displayItems = challan.items?.map(item => {
        const qty = item.qty || item.dispatchedQty || 0;
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
            hsnCode: item.hsnCode || item.productId?.hsn?.hsnCode || "-",
            qty: qty,
            unit: item.unit || "-",
            lotNumber: item.lotNumber || "-",
            taxRate: taxRate,
            taxAmount: taxAmount,
            amount: totalAmount,
            unitPrice: unitPrice,
            selectedSerialNos: item.serialNumbers || [],
        };
    }) || [];

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
            {/* company logo + DELIVERY CHALLAN title */}
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
                    }}>Delivery Challan</span>
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

            {/* challan date + challan no */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    Challan Date - {format(new Date(challan.challanDate), "dd MMM yyyy")}
                </span>
                <span style={{ marginRight: "12px" }}>
                    Challan No. - {challan.challanNo}
                </span>
            </div>

            {/* Challan Type & Status */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    Challan Type - {challan.challanType?.replace("_", " ").toUpperCase()}
                </span>
                <span style={{ marginRight: "12px" }}>
                    Status - <span style={{
                        color: challan.status === "dispatched" ? "#1F7FFF" : challan.status === "delivered" ? "#0D6828" : "#B77100"
                    }}>{challan.status?.toUpperCase()}</span>
                </span>
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
                    <span>From</span>
                </div>
                <div style={{ width: "50%", textAlign: "center" }}>
                    <span>Customer Details</span>
                </div>
            </div>

            {/* from = company details + to = customers details */}
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
                {/* company details = from */}
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
                            {companyData?.companyName || "-"}
                        </span>
                    </div>
                    <div>
                        Address:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {companyData?.companyaddress || "-"}
                        </span>
                    </div>
                    <div>
                        Phone:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {companyData?.companyphone || "-"}
                        </span>
                    </div>
                    <div>
                        Email:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {companyData?.companyemail || "-"}
                        </span>
                    </div>
                    <div>
                        GSTIN:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {companyData?.gstin || "-"}
                        </span>
                    </div>
                </div>

                {/* customer details = to */}
                <div style={{ width: "50%", padding: "3px 10px" }}>
                    <div>
                        Name:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {customer?.name || "-"}
                        </span>
                    </div>
                    <div>
                        Address:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {customer?.address || "-"}
                        </span>
                    </div>
                    <div>
                        Phone:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {customer?.phone || "-"}
                        </span>
                    </div>
                    <div>
                        Email:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {customer?.email || "-"}
                        </span>
                    </div>
                    <div>
                        GSTIN:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {customer?.gstin || "-"}
                        </span>
                    </div>
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
                        {challan.fromAddress || "N/A"}
                    </span>
                </div>
                <div style={{ width: "50%", padding: "3px 10px" }}>
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.toAddress || "N/A"}
                    </span>
                </div>
            </div>

            {/* Purpose of Movement & E-way Bill */}
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
                    <div>
                        Purpose of Movement:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {challan.purposeOfMovement || "N/A"}
                        </span>
                    </div>
                </div>
                <div style={{ width: "50%", padding: "3px 10px" }}>
                    <div>
                        E-way Bill No.:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {challan.ewayBillNo || "N/A"}
                        </span>
                    </div>
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
            textAlign: "center",
        }}
    >
        <span>Transport Details</span>
    </div>
    {/* Driver details ONLY for Roadways LR mode */}
    {challan.transportMode === "roadways" && challan.subMode === "LR" && (challan.driverId?.driverName || challan.driverId?.phoneNumber) && (
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
        <div>
            Transport Mode:{" "}
            <span style={{ color: "black", fontWeight: "600" }}>
                {challan.transportMode === "roadways" ? "Roadways" : challan.transportMode === "railways" ? "Railways" : "N/A"}
            </span>
        </div>
        
        {/* Roadways LR Mode (Truck) */}
        {challan.transportMode === "roadways" && challan.subMode === "LR" && (
            <>
                <div>
                    LR Number:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.lrNo || "N/A"}
                    </span>
                </div>
                {challan.transporterId?.transporterName && (
                    <div>
                        Transporter:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {challan.transporterId?.transporterName}
                        </span>
                    </div>
                )}
                {challan.vehicleId?.vehicleNumber && (
                    <div>
                        Vehicle No.:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {challan.vehicleId?.vehicleNumber}
                        </span>
                    </div>
                )}
            </>
        )}
        
        {/* Roadways RR Mode (Train within Roadways) */}
        {challan.transportMode === "roadways" && challan.subMode === "RR" && (
            <>
                <div>
                    Railway Receipt No.:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.railwayReceiptNo || "N/A"}
                    </span>
                </div>
                <div>
                    Train No.:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.trainNo || "N/A"}
                    </span>
                </div>
                <div>
                    Wagon No.:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.wagonNo || "N/A"}
                    </span>
                </div>
            </>
        )}
        
        {/* Railways Mode (Simple) - NO driver details */}
        {challan.transportMode === "railways" && (
            <>
                <div>
                    RR Number:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.rrbNo || "N/A"}
                    </span>
                </div>
                <div>
                    Train No.:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.railwayTrainNo || "N/A"}
                    </span>
                </div>
                <div>
                    Wagon No.:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.railwayWagonNo || "N/A"}
                    </span>
                </div>
            </>
        )}
        
        {/* Charges - applicable for all modes */}
        {challan.freightCharge > 0 && (
            <div>
                Freight Charge:{" "}
                <span style={{ color: "black", fontWeight: "600" }}>
                    ₹{challan.freightCharge.toFixed(2)}
                </span>
            </div>
        )}
        {challan.otherCharges > 0 && (
            <div>
                Other Charges:{" "}
                <span style={{ color: "black", fontWeight: "600" }}>
                    ₹{challan.otherCharges.toFixed(2)}
                </span>
            </div>
        )}
    </div>
    
    {/* Driver Details - ONLY for Roadways LR mode (truck transport) */}
    {challan.transportMode === "roadways" && challan.subMode === "LR" && (challan.driverId?.driverName || challan.driverId?.phoneNumber) && (
        <div style={{ width: "50%", padding: "3px 10px" }}>
            {challan.driverId?.driverName && (
                <div>
                    Driver Name:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.driverId?.driverName}
                    </span>
                </div>
            )}
            {challan.driverId?.phoneNumber && (
                <div>
                    Driver Phone:{" "}
                    <span style={{ color: "black", fontWeight: "600" }}>
                        {challan.driverId?.phoneNumber}
                    </span>
                </div>
            )}
        </div>
    )}
</div>


            {/* product list table - COMPLETE PRODUCT DETAILS */}
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
                                    {settings.description && <div style={{ display: "flex", flexDirection: "column" }}>{item.description || ""}</div>}
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
            {challan.notes && (
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
                    <div style={{ fontSize: "9px" }}>{challan.notes}</div>
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
                            ₹
                            {Math.max(
                                0,
                                grandTotal -
                                (parseFloat(amountReceived) || 0),
                            ).toFixed(2)}
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
                    <span style={{
                        color: 'black'
                    }}>{terms ? terms?.termsText : "N/A"}</span>
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
                        <span
                            style={{ fontWeight: "500", fontSize: "10px" }}
                        >
                            Signature
                        </span>
                    </div>
                </div>
            </div>

            {/* footer = earned point details */}
             <div
                style={{
                    width: "100%",
                    justifyContent: "center",
                    display: "flex",
                }}
            >
                <span style={{ marginTop: "5px" }}>
                    Earned 🪙 {Math.floor(grandTotal / 100)} Shopping
                    Point on this purchase. Redeem on your next
                    purchase.
                </span>
            </div>
        </div>
        
    );
});


// import React, { forwardRef, useState, useEffect } from 'react';
// import { format } from "date-fns";
// import api from "../config/axiosInstance";
// import CompanyLogo from "../../assets/images/kasperlogo.png";
// import { toWords } from "number-to-words";

// export const DeliveryChallanContent = forwardRef(({ challan, customer, companyData, banks, terms, template }, ref) => {
//     if (!challan) return null;

//     const parseNumber = (val) => parseFloat(val) || 0;

//     const [settings, setSettings] = useState({
//         brand: false, category: false, subcategory: false,
//         itembarcode: false, hsn: false, description: false,
//         lotno: false, serialno: false,
//         variants: { size: false, color: false },
//         units: false, expiry: false,
//     });

//     const [taxSettings, setTaxSettings] = useState({
//         enableGSTBilling: true, priceIncludeGST: true,
//         defaultGSTRate: "18", autoRoundOff: "0",
//     });

//     useEffect(() => {
//         const fetchSettings = async () => {
//             try {
//                 const [sysRes, taxRes] = await Promise.all([
//                     api.get('/api/system-settings'),
//                     api.get('/api/tax-gst-settings'),
//                 ]);
//                 if (sysRes.data.success) {
//                     const d = sysRes.data.data;
//                     setSettings({
//                         brand: d.brand || false,
//                         category: d.category || false,
//                         subcategory: d.subcategory || false,
//                         itembarcode: d.itembarcode || false,
//                         hsn: d.hsn || false,
//                         description: d.description || false,
//                         lotno: d.lotno || false,
//                         serialno: d.serialno || false,
//                         variants: { size: d.variants?.size || false, color: d.variants?.color || false },
//                         units: d.units || false,
//                         expiry: d.expiry || false,
//                     });
//                 }
//                 if (taxRes.data.success) {
//                     const d = taxRes.data.data;
//                     setTaxSettings({
//                         enableGSTBilling: d.enableGSTBilling !== false,
//                         priceIncludeGST: d.priceIncludeGST !== false,
//                         defaultGSTRate: d.defaultGSTRate || "18",
//                         autoRoundOff: d.autoRoundOff || "0",
//                     });
//                 }
//             } catch (err) {
//                 console.error("Error fetching settings:", err);
//             }
//         };
//         fetchSettings();
//     }, []);

//     const formatSerialNumbers = (serialNumbers) => {
//         if (!serialNumbers || !Array.isArray(serialNumbers)) return "-";
//         const filtered = serialNumbers.filter(s => s && s !== "[]" && s !== "");
//         if (filtered.length === 0) return "-";
//         return filtered.join(", ");
//     };

//     // ── Use saved values from challan directly — do NOT recalculate ──
//     const subtotal             = parseNumber(challan.subtotal);
//     const totalTax             = parseNumber(challan.totalTax);
//     const totalDiscount        = parseNumber(challan.totalDiscount);
//     const pointsRedeemedAmount = parseNumber(challan.pointsRedeemedAmount);
//     const additionalChargesTotal = parseNumber(challan.additionalCharges);
//     const grandTotal           = parseNumber(challan.grandTotal);
//     const amountReceived       = parseNumber(challan.paidAmount);

//     const totalQuantity = challan.items?.reduce(
//         (sum, item) => sum + parseNumber(item.qty || item.dispatchedQty), 0
//     ) || 0;

//     // ── Map items using SAVED financial data — no recalculation ──────
//     const displayItems = (challan.items || []).map(item => {
//         const qty       = parseNumber(item.qty || item.dispatchedQty);
//         const unitPrice = parseNumber(item.unitPrice);
//         const taxRate   = parseNumber(item.taxRate);

//         // Use saved values; only recalculate if missing (legacy docs)
//         const taxAmount = item.taxAmount != null
//             ? parseNumber(item.taxAmount)
//             : parseNumber(((qty * unitPrice * taxRate) / 100).toFixed(2));

//         const amount = item.amount != null
//             ? parseNumber(item.amount)
//             : parseNumber((qty * unitPrice + taxAmount).toFixed(2));

//         // Serial numbers — handle both field names
//         const serialNos =
//             item.serialNumbers?.filter(s => s && s !== "[]" && s !== "") ||
//             item.selectedSerialNos?.filter(s => s && s !== "[]" && s !== "") ||
//             [];

//         return {
//             ...item,
//             itemName:          item.itemName || "",
//             hsnCode:           item.hsnCode || item.productId?.hsn?.hsnCode || "-",
//             qty,
//             unit:              item.unit || "-",
//             lotNumber:         item.lotNumber || "-",
//             unitPrice,
//             taxRate,
//             taxAmount,
//             amount,
//             selectedSerialNos: serialNos,
//         };
//     });

//     // ── Safe toWords — handle decimals and zero ───────────────────────
//     const grandTotalWords = (() => {
//         try {
//             const rounded = Math.round(grandTotal);
//             if (rounded === 0) return "ZERO";
//             return toWords(rounded).toUpperCase();
//         } catch {
//             return grandTotal.toFixed(2);
//         }
//     })();

//     return (
//         <div
//             ref={ref}
//             style={{
//                 width: "100%",
//                 height: "100%",
//                 left: 0,
//                 top: 0,
//                 background: "white",
//                 boxShadow: "0px 1px 4px rgba(0,0,0,0.10)",
//                 padding: "10px 30px",
//                 fontFamily: "IBM Plex Mono",
//                 fontSize: '10px',
//             }}
//         >
//             {/* Header */}
//             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//                 <div style={{ width: "100px", height: '70px' }}>
//                     <img
//                         src={companyData?.companyLogo || CompanyLogo}
//                         alt="company logo"
//                         style={{ width: "100%", height: '100%', objectFit: "contain" }}
//                     />
//                 </div>
//                 <div style={{ width: "250px", textAlign: "right" }}>
//                     <span style={{ fontSize: '28px', fontFamily: 'Garamond', color: 'black', fontWeight: '500' }}>
//                         Delivery Challan
//                     </span>
//                 </div>
//             </div>

//             <div style={{ width: "100%", height: 0.76, background: "#EAEAEA", marginTop: "8px" }} />

//             {/* Challan meta */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
//                 <span>Challan Date - {format(new Date(challan.challanDate), "dd MMM yyyy")}</span>
//                 <span style={{ marginRight: "12px" }}>Challan No. - {challan.challanNo}</span>
//             </div>
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-between", marginTop: "2px" }}>
//                 <span>Challan Type - {challan.challanType?.replace(/_/g, " ").toUpperCase()}</span>
//                 <span style={{ marginRight: "12px" }}>
//                     Status -{" "}
//                     <span style={{
//                         color: challan.status === "dispatched" ? "#1F7FFF"
//                             : challan.status === "delivered" ? "#0D6828" : "#B77100"
//                     }}>
//                         {challan.status?.toUpperCase()}
//                     </span>
//                 </span>
//             </div>

//             <div style={{ width: "100%", height: 0.76, background: "#EAEAEA", marginTop: "2px" }} />

//             {/* From / To headers */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "2px", borderBottom: "1px solid #EAEAEA" }}>
//                 <div style={{ borderRight: "1px solid #EAEAEA", width: "50%", textAlign: "center" }}>From</div>
//                 <div style={{ width: "50%", textAlign: "center" }}>Customer Details</div>
//             </div>

//             {/* From / To detail */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "2px", borderBottom: "1px solid #EAEAEA" }}>
//                 <div style={{ borderRight: "1px solid #EAEAEA", width: "50%", padding: "3px" }}>
//                     {[
//                         ["Name", companyData?.companyName],
//                         ["Address", companyData?.companyaddress],
//                         ["Phone", companyData?.companyphone],
//                         ["Email", companyData?.companyemail],
//                         ["GSTIN", companyData?.gstin],
//                     ].map(([label, val]) => (
//                         <div key={label}>{label}: <span style={{ fontWeight: "600" }}>{val || "-"}</span></div>
//                     ))}
//                 </div>
//                 <div style={{ width: "50%", padding: "3px 10px" }}>
//                     {[
//                         ["Name", customer?.name],
//                         ["Address", customer?.address],
//                         ["Phone", customer?.phone],
//                         ["Email", customer?.email],
//                         ["GSTIN", customer?.gstin],
//                     ].map(([label, val]) => (
//                         <div key={label}>{label}: <span style={{ fontWeight: "600" }}>{val || "-"}</span></div>
//                     ))}
//                 </div>
//             </div>

//             {/* From Address / To Address */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "2px", borderBottom: "1px solid #EAEAEA" }}>
//                 <div style={{ borderRight: "1px solid #EAEAEA", width: "50%", textAlign: "center" }}>From Address</div>
//                 <div style={{ width: "50%", textAlign: "center" }}>To Address</div>
//             </div>
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "2px", borderBottom: "1px solid #EAEAEA" }}>
//                 <div style={{ borderRight: "1px solid #EAEAEA", width: "50%", padding: "3px" }}>
//                     <span style={{ fontWeight: "600" }}>{challan.fromAddress || "N/A"}</span>
//                 </div>
//                 <div style={{ width: "50%", padding: "3px 10px" }}>
//                     <span style={{ fontWeight: "600" }}>{challan.toAddress || "N/A"}</span>
//                 </div>
//             </div>

//             {/* Purpose / Eway Bill */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "2px", borderBottom: "1px solid #EAEAEA" }}>
//                 <div style={{ borderRight: "1px solid #EAEAEA", width: "50%", padding: "3px" }}>
//                     Purpose of Movement: <span style={{ fontWeight: "600" }}>{challan.purposeOfMovement || "N/A"}</span>
//                 </div>
//                 <div style={{ width: "50%", padding: "3px 10px" }}>
//                     E-way Bill No.: <span style={{ fontWeight: "600" }}>{challan.ewayBillNo || "N/A"}</span>
//                 </div>
//             </div>

//             {/* Transport section header */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "2px", borderBottom: "1px solid #EAEAEA" }}>
//                 <div style={{ borderRight: "1px solid #EAEAEA", width: "50%", textAlign: "center" }}>Transport Details</div>
//                 {challan.transportMode === "roadways" && challan.subMode === "LR" &&
//                     (challan.driverId?.driverName || challan.driverId?.phoneNumber) && (
//                     <div style={{ width: "50%", textAlign: "center" }}>Driver Details</div>
//                 )}
//             </div>

//             {/* Transport detail */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "2px", borderBottom: "1px solid #EAEAEA" }}>
//                 <div style={{ borderRight: "1px solid #EAEAEA", width: "50%", padding: "3px" }}>
//                     <div>
//                         Transport Mode:{" "}
//                         <span style={{ fontWeight: "600" }}>
//                             {challan.transportMode === "roadways" ? "Roadways"
//                                 : challan.transportMode === "railways" ? "Railways" : "N/A"}
//                         </span>
//                     </div>

//                     {challan.transportMode === "roadways" && challan.subMode === "LR" && (<>
//                         <div>LR Number: <span style={{ fontWeight: "600" }}>{challan.lrNo || "N/A"}</span></div>
//                         {challan.transporterId?.transporterName && (
//                             <div>Transporter: <span style={{ fontWeight: "600" }}>{challan.transporterId.transporterName}</span></div>
//                         )}
//                         {challan.vehicleId?.vehicleNumber && (
//                             <div>Vehicle No.: <span style={{ fontWeight: "600" }}>{challan.vehicleId.vehicleNumber}</span></div>
//                         )}
//                     </>)}

//                     {challan.transportMode === "roadways" && challan.subMode === "RR" && (<>
//                         <div>Railway Receipt No.: <span style={{ fontWeight: "600" }}>{challan.railwayReceiptNo || "N/A"}</span></div>
//                         <div>Train No.: <span style={{ fontWeight: "600" }}>{challan.trainNo || "N/A"}</span></div>
//                         <div>Wagon No.: <span style={{ fontWeight: "600" }}>{challan.wagonNo || "N/A"}</span></div>
//                     </>)}

//                     {challan.transportMode === "railways" && (<>
//                         <div>RR Number: <span style={{ fontWeight: "600" }}>{challan.rrbNo || "N/A"}</span></div>
//                         <div>Train No.: <span style={{ fontWeight: "600" }}>{challan.railwayTrainNo || "N/A"}</span></div>
//                         <div>Wagon No.: <span style={{ fontWeight: "600" }}>{challan.railwayWagonNo || "N/A"}</span></div>
//                     </>)}

//                     {parseNumber(challan.freightCharge) > 0 && (
//                         <div>Freight Charge: <span style={{ fontWeight: "600" }}>₹{parseNumber(challan.freightCharge).toFixed(2)}</span></div>
//                     )}
//                     {parseNumber(challan.otherCharges) > 0 && (
//                         <div>Other Charges: <span style={{ fontWeight: "600" }}>₹{parseNumber(challan.otherCharges).toFixed(2)}</span></div>
//                     )}
//                 </div>

//                 {challan.transportMode === "roadways" && challan.subMode === "LR" &&
//                     (challan.driverId?.driverName || challan.driverId?.phoneNumber) && (
//                     <div style={{ width: "50%", padding: "3px 10px" }}>
//                         {challan.driverId?.driverName && (
//                             <div>Driver Name: <span style={{ fontWeight: "600" }}>{challan.driverId.driverName}</span></div>
//                         )}
//                         {challan.driverId?.phoneNumber && (
//                             <div>Driver Phone: <span style={{ fontWeight: "600" }}>{challan.driverId.phoneNumber}</span></div>
//                         )}
//                     </div>
//                 )}
//             </div>

//             {/* Items table */}
//             <div className="table-responsive mt-3">
//                 <table style={{ width: "100%", border: "1px solid #EAEAEA", borderCollapse: "collapse" }}>
//                     <thead style={{ textAlign: "center" }}>
//                         <tr>
//                             <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Sr No.</th>
//                             <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Product</th>
//                             {settings.lotno && <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Lot No.</th>}
//                             <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">HSN</th>
//                             <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">QTY</th>
//                             {settings.units && <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Unit</th>}
//                             {settings.serialno && <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Serial No.</th>}
//                             <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Rate</th>
//                             {taxSettings.enableGSTBilling && (
//                                 <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} colSpan="2">Tax</th>
//                             )}
//                             <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Total</th>
//                         </tr>
//                         {taxSettings.enableGSTBilling && (
//                             <tr>
//                                 <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>%</th>
//                                 <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>₹</th>
//                             </tr>
//                         )}
//                     </thead>
//                     <tbody>
//                         {displayItems.length === 0 ? (
//                             <tr>
//                                 <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>No items found</td>
//                             </tr>
//                         ) : displayItems.map((item, idx) => (
//                             <tr key={idx}>
//                                 <td style={{ borderRight: "1px solid #EAEAEA", height: "40px", textAlign: "center" }}>{idx + 1}</td>
//                                 <td style={{ borderRight: "1px solid #EAEAEA", padding: "4px 8px" }}>
//                                     {item.itemName}
//                                     {settings.description && item.description && item.description !== "-" && (
//                                         <div style={{ fontSize: "9px", color: "#666" }}>{item.description}</div>
//                                     )}
//                                 </td>
//                                 {settings.lotno && (
//                                     <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
//                                         {item.lotNumber !== "-" ? item.lotNumber : "-"}
//                                     </td>
//                                 )}
//                                 <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.hsnCode}</td>
//                                 <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.qty}</td>
//                                 {settings.units && (
//                                     <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.unit}</td>
//                                 )}
//                                 {settings.serialno && (
//                                     <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center", whiteSpace: "pre-line" }}>
//                                         {formatSerialNumbers(item.selectedSerialNos)}
//                                     </td>
//                                 )}
//                                 <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
//                                     ₹{item.unitPrice.toFixed(2)}
//                                 </td>
//                                 {taxSettings.enableGSTBilling && (<>
//                                     <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.taxRate}%</td>
//                                     <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>₹{item.taxAmount.toFixed(2)}</td>
//                                 </>)}
//                                 <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>₹{item.amount.toFixed(2)}</td>
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>

//             {/* Notes */}
//             {challan.notes && (
//                 <div style={{ marginTop: "10px" }}>
//                     <div style={{ width: "100%", height: 0.76, background: "#EAEAEA", marginBottom: "5px" }} />
//                     <div style={{ fontWeight: "bold", marginBottom: "5px" }}>Notes</div>
//                     <div style={{ fontSize: "9px" }}>{challan.notes}</div>
//                 </div>
//             )}

//             {/* Totals */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", marginTop: "15px", borderTop: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA" }}>
//                 <div style={{ width: "50%", padding: "3px", display: "flex", flexDirection: "column", alignItems: "center" }}>
//                     <u>Total in words</u>
//                     <span style={{ fontSize: "12px", marginTop: "5px", fontWeight: "600", color: 'black' }}>
//                         {grandTotalWords} RUPEES ONLY
//                     </span>
//                     <div style={{ width: "100%", height: 0.76, background: "#EAEAEA", marginTop: "10px" }} />
//                 </div>

//                 <div style={{ width: "50%", padding: "3px", borderLeft: "1px solid #EAEAEA" }}>
//                     {[
//                         ["Sub-total", `₹${subtotal.toFixed(2)}`],
//                         taxSettings.enableGSTBilling ? ["Tax Amount", `₹${totalTax.toFixed(2)}`] : null,
//                         ["Discount", `₹${totalDiscount.toFixed(2)}`],
//                         pointsRedeemedAmount > 0 ? ["🪙 Shopping Points", `₹${pointsRedeemedAmount.toFixed(2)}`] : null,
//                         additionalChargesTotal > 0 ? ["Additional Charges", `₹${additionalChargesTotal.toFixed(2)}`] : null,
//                     ].filter(Boolean).map(([label, val]) => (
//                         <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #EAEAEA", padding: "2px 8px" }}>
//                             <span>{label}</span>
//                             <span style={{ color: "black" }}>{val}</span>
//                         </div>
//                     ))}
//                     <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #EAEAEA", padding: "2px 8px" }}>
//                         <span style={{ fontWeight: "700", fontSize: "14px", color: 'black' }}>Total</span>
//                         <span style={{ color: "black", fontWeight: "600", fontSize: "13px" }}>₹{grandTotal.toFixed(2)}</span>
//                     </div>
//                     <div style={{ display: "flex", justifyContent: "space-between", padding: "1px 8px" }}>
//                         <span>Due Amount</span>
//                         <span style={{ color: "black" }}>₹{Math.max(0, grandTotal - amountReceived).toFixed(2)}</span>
//                     </div>
//                 </div>
//             </div>

//             {/* Terms & Signature */}
//             <div style={{ width: "100%", display: "flex", justifyContent: "space-around", borderBottom: "1px solid #EAEAEA", marginTop: "5px" }}>
//                 <div style={{ width: "50%", display: "flex", flexDirection: "column", alignItems: "center" }}>
//                     <u>Terms & Conditions</u>
//                     <span style={{ color: 'black' }}>{terms?.termsText || "N/A"}</span>
//                 </div>
//                 <div style={{ width: "50%", borderLeft: "1px solid #EAEAEA" }}>
//                     <div style={{ display: "flex", justifyContent: "center", padding: "5px 0px 10px 0px" }}>
//                         {Array.isArray(template) && template.find(t => t.templateType === 'normal')?.signatureUrl ? (
//                             <img src={template.find(t => t.templateType === 'normal').signatureUrl} style={{ width: '100px' }} />
//                         ) : (
//                             <span style={{ color: '#999', fontSize: '20px', marginTop: '20px' }}>Not Set</span>
//                         )}
//                     </div>
//                     <div style={{ display: "flex", justifyContent: "center", borderTop: "1px solid #EAEAEA", padding: "1px 8px" }}>
//                         <span style={{ fontWeight: "500", fontSize: "10px" }}>Signature</span>
//                     </div>
//                 </div>
//             </div>

//             {/* Footer */}
//             <div style={{ width: "100%", justifyContent: "center", display: "flex" }}>
//                 <span style={{ marginTop: "5px" }}>
//                     Earned 🪙 {Math.floor(grandTotal / 100)} Shopping Points on this purchase.
//                 </span>
//             </div>
//         </div>
//     );
// });