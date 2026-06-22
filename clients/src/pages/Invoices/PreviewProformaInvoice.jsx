import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { format } from "date-fns";
import { toWords } from "number-to-words";
import { toast } from "react-toastify";
import api from "../config/axiosInstance";
import CompanyLogo from "../../assets/images/kasperlogo.png";

// Separate ProformaInvoiceContent component for reuse
export const ProformaInvoiceContent = forwardRef(({ proforma, customer, companyData, banks, terms, template, taxSettings }, ref) => {
    if (!proforma) return null;

    const parseNumber = (val) => parseFloat(val) || 0;

    const getNonEmptyProducts = () => {
        if (!proforma?.items) {
            return [];
        }

        return proforma.items.filter(item =>
            (item.itemName && item.itemName.trim() !== "") ||
            (item.name && item.name.trim() !== "") ||
            (item.productId?.productName && item.productId.productName.trim() !== "")
        ).map(item => {
            let hsnCode = item.hsnCode || "";
            if (!hsnCode && item.productId) {
                if (item.productId.hsn && typeof item.productId.hsn === 'object') {
                    hsnCode = item.productId.hsn.hsnCode || "";
                }
                if (!hsnCode) {
                    hsnCode = item.productId.hsnCode || "";
                }
            }

            let selectedSerialNos = [];
            if (item.selectedSerialNos) {
                if (Array.isArray(item.selectedSerialNos)) {
                    if (item.selectedSerialNos.length === 1 &&
                        typeof item.selectedSerialNos[0] === 'string' &&
                        item.selectedSerialNos[0].startsWith('[') &&
                        item.selectedSerialNos[0].endsWith(']')) {
                        try {
                            const parsed = JSON.parse(item.selectedSerialNos[0]);
                            if (Array.isArray(parsed)) {
                                selectedSerialNos = parsed;
                            }
                        } catch (e) {
                            selectedSerialNos = item.selectedSerialNos;
                        }
                    } else {
                        selectedSerialNos = item.selectedSerialNos;
                    }
                } else if (typeof item.selectedSerialNos === 'string') {
                    try {
                        if (item.selectedSerialNos.startsWith('[') && item.selectedSerialNos.endsWith(']')) {
                            const parsed = JSON.parse(item.selectedSerialNos);
                            if (Array.isArray(parsed)) {
                                selectedSerialNos = parsed;
                            }
                        } else {
                            selectedSerialNos = item.selectedSerialNos.split(',').map(s => s.trim()).filter(s => s);
                        }
                    } catch (e) {
                        selectedSerialNos = item.selectedSerialNos.split(',').map(s => s.trim()).filter(s => s);
                    }
                }
            }

            return {
                ...item,
                name: item.name || item.itemName || item.productId?.productName,
                hsnCode: hsnCode || "",
                description: item.description || item.productId?.description || "",
                lotNumber: item.lotNumber || item.productId?.lotNumber || "",
                selectedSerialNos: selectedSerialNos
            };
        });
    };

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

    useEffect(() => {
        fetchProductSettings();
    }, []);

    const fetchProductSettings = async () => {
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
            toast.error(error?.response?.data?.message || "Failed to fetch system settings");
        }
    };

    const proformaDate = proforma?.proformaDate ? new Date(proforma.proformaDate) : new Date();
    const validUntil = proforma?.validUntil ? new Date(proforma.validUntil) : new Date();
    const proformaNo = proforma?.proformaNo || "-";
    const subtotal = parseNumber(proforma?.subtotal);
    const totalTax = parseNumber(proforma?.totalTax);
    const totalDiscount = parseNumber(proforma?.totalDiscount);
    const additionalChargesTotal = parseNumber(proforma?.additionalCharges);
    const grandTotal = parseNumber(proforma?.grandTotal);
    const advancePaid = parseNumber(proforma?.advancePaid);
    const advanceAmount = parseNumber(proforma?.advanceAmount);
    const dueAmount = grandTotal - advancePaid;

    const formatSerialNumbers = (serialNumbers) => {
        if (!serialNumbers || !Array.isArray(serialNumbers)) return "-";
        let result = "";
        for (let i = 0; i < serialNumbers.length; i++) {
            if (i > 0) {
                result += ", ";
            }
            result += serialNumbers[i];
            if ((i + 1) % 2 === 0 && i < serialNumbers.length - 1) {
                result += ",\n";
            }
        }
        return result;
    };

    // Get default bank
    const defaultBank = proforma?.bankDetails || (banks?.find(bank => bank.isDefault === true) || banks?.[0]);

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
            {/* company logo + proforma invoice */}
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
                <div style={{ width: "auto" }}>
                    <span style={{
                        fontSize: '35px',
                        fontFamily: 'Garamond',
                        color: 'black',
                        fontWeight: '500',
                    }}>Proforma Invoice</span>
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

            {/* proforma date + proforma no */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    Proforma Date - {format(proformaDate, "dd MMM yyyy")}
                </span>
                <span style={{ marginRight: "12px" }}>
                    Proforma No. - {proformaNo}
                </span>
            </div>

            {/* valid until */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    Valid Until - {format(validUntil, "dd MMM yyyy")}
                </span>
                <span style={{ marginRight: "12px" }}>
                    Status: <span style={{
                        padding: "2px 6px",
                        borderRadius: "12px",
                        backgroundColor: proforma.status === "draft" ? "#fee2e2" : proforma.status === "advance_paid" ? "#fef3c7" : "#d1fae5",
                        color: proforma.status === "draft" ? "#991b1b" : proforma.status === "advance_paid" ? "#92400e" : "#065f46",
                        fontSize: "10px"
                    }}>
                        {proforma.status === "draft" ? "Draft" : proforma.status === "advance_paid" ? "Advance Paid" : "Converted"}
                    </span>
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
                            {companyData?.companyaddress || companyData?.address || "-"}
                        </span>
                    </div>
                    <div>
                        Phone:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {companyData?.companyphone || companyData?.phone || "-"}
                        </span>
                    </div>
                    <div>
                        Email:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {companyData?.companyemail || companyData?.email || "-"}
                        </span>
                    </div>
                    <div>
                        GSTIN:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {companyData?.gstin || "-"}
                        </span>
                    </div>
                </div>

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
                            {proforma?.billingAddress || customer?.address || "-"}
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

            {/* product list table */}
            <div className="table-responsive mt-3">
                <table
                    className=""
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
                            {settings.lotno && (
                                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Lot No.</th>
                            )}
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">HSN</th>
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">QTY</th>
                            {settings.serialno && (
                                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Serial No.</th>
                            )}
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Rate</th>
                            {taxSettings?.enableGSTBilling !== false ? (
                                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} colSpan="2">Tax</th>
                            ) : (
                                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} colSpan="2">Tax</th>
                            )}
                            <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">Total</th>
                        </tr>
                        <tr>
                            {taxSettings?.enableGSTBilling !== false ? (
                                <>
                                    <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>%</th>
                                    <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>₹</th>
                                </>
                            ) : (
                                <>
                                    <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>%</th>
                                    <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>₹</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {getNonEmptyProducts().map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ borderRight: "1px solid #EAEAEA", height: "40px", textAlign: "center" }}>{idx + 1}</td>
                                <td style={{ borderRight: "1px solid #EAEAEA", padding: "0px 20px" }}>
                                    {item.name || ""}
                                    {settings.description && (
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            {item.description || ""}
                                        </div>
                                    )}
                                </td>
                                {settings.lotno && (
                                    <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.lotNumber || "-"}</td>
                                )}
                                <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.hsnCode || "-"}</td>
                                <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>{item.qty || ""}</td>
                                {settings.serialno && (
                                    <td style={{ borderRight: "1px solid #EAEAEA", height: "40px", textAlign: "center", verticalAlign: "middle" }}>
                                        <div style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                            height: "100%",
                                            whiteSpace: "pre-line"
                                        }}>
                                            {/* {formatSerialNumbers(item.selectedSerialNos)} */}
                                            {formatSerialNumbers(item.selectedSerialNos?.length) > 0
                                                ? formatSerialNumbers(item.selectedSerialNos.join(", "))
                                                : "-"
                                            }
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
                        <tr>
                            <td style={{ borderRight: "1px solid #EAEAEA", height: "100px", textAlign: "center" }}></td>
                            <td style={{ borderRight: "1px solid #EAEAEA", padding: "0px 20px" }}></td>
                            {settings.lotno && <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}></td>}
                            <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}></td>
                            <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}></td>
                            {settings.serialno && <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}></td>}
                            <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}></td>
                            <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}></td>
                            <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}></td>
                        </tr>
                    </tbody>
                </table>
            </div>

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
                    <div
                        style={{
                            marginTop: "2px",
                            textDecoration: "underline",
                        }}
                    >
                        Bank Details
                    </div>
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0px 5px",
                        }}
                    >
                        <div style={{ textAlign: "left" }}>
                            <div>
                                Bank:{" "}
                                <span style={{ color: "black", fontWeight: "600" }}>
                                    {defaultBank?.bankName || "N/A"}
                                </span>
                            </div>
                            <div>
                                Branch:{" "}
                                <span style={{ color: "black", fontWeight: "600" }}>
                                    {defaultBank?.branch || "N/A"}
                                </span>
                            </div>
                            <div>
                                Acc No.:{" "}
                                <span style={{ color: "black", fontWeight: "600" }}>
                                    {defaultBank?.accountNumber || "N/A"}
                                </span>
                            </div>
                            <div>
                                IFSC:{" "}
                                <span style={{ color: "black", fontWeight: "600" }}>
                                    {defaultBank?.ifsc || "N/A"}
                                </span>
                            </div>
                            <div>
                                UPI:{" "}
                                <span style={{ color: "black", fontWeight: "600" }}>
                                    {defaultBank?.upiId || "N/A"}
                                </span>
                            </div>
                            {proforma.paymentTerms && (
                                <div>
                                    Terms:{" "}
                                    <span style={{ color: "black", fontWeight: "600" }}>
                                        {proforma.paymentTerms}
                                    </span>
                                </div>
                            )}
                        </div>
                        {defaultBank?.qrCode && (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ width: "90px", objectFit: "contain" }}>
                                    <img src={defaultBank.qrCode} alt="QR Code" style={{ width: "100%" }} />
                                </div>
                                <div>Pay Using QR</div>
                            </div>
                        )}
                    </div>
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
                        <span style={{ color: "black" }}>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {taxSettings?.enableGSTBilling !== false && (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #EAEAEA",
                                padding: "2px 8px",
                            }}
                        >
                            <span>Tax Amount</span>
                            <span style={{ color: "black" }}>₹{totalTax.toFixed(2)}</span>
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
                        <span style={{ color: "black" }}>₹{totalDiscount.toFixed(2)}</span>
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
                        <span style={{ color: "black" }}>₹{additionalChargesTotal.toFixed(2)}</span>
                    </div>

                    {/* Advance Payment Section */}
                    {advanceAmount > 0 && (
                        <>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    borderBottom: "1px solid #EAEAEA",
                                    padding: "2px 8px",
                                }}
                            >
                                <span>Advance Amount Required</span>
                                <span style={{ color: "black" }}>₹{advanceAmount.toFixed(2)}</span>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    borderBottom: "1px solid #EAEAEA",
                                    padding: "2px 8px",
                                }}
                            >
                                <span>Advance Paid</span>
                                <span style={{ color: "black" }}>₹{advancePaid.toFixed(2)}</span>
                            </div>
                        </>
                    )}

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #EAEAEA",
                            padding: "2px 8px",
                        }}
                    >
                        <span style={{ fontWeight: "700", fontSize: "14px", color: 'black' }}>Total</span>
                        <span style={{ color: "black", fontWeight: "600", fontSize: "13px" }}>₹{grandTotal.toFixed(2)}</span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderBottom: "1px solid #EAEAEA",
                            padding: "2px 8px",
                        }}
                    >
                        <span style={{ fontWeight: "700", fontSize: "14px", color: 'black' }}>Paid Amount</span>
                        <span style={{ color: "black", fontWeight: "600", fontSize: "13px" }}>₹{advancePaid.toFixed(2)}</span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "2px 8px",
                        }}
                    >
                        <span>Due Amount</span>
                        <span style={{ color: dueAmount > 0 ? "#dc2626" : "#10b981", fontWeight: "600" }}>
                            ₹{dueAmount.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* terms & conditions + signature */}
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
                    <u>Terms & Conditions</u>
                    <span style={{ color: 'black' }}>{proforma?.termsAndConditions || terms?.termsText || "N/A"}</span>
                </div>

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

            {/* footer note */}
            <div
                style={{
                    width: "100%",
                    justifyContent: "center",
                    display: "flex",
                }}
            >
                <span style={{ marginTop: "5px", fontSize: "9px", color: "#666" }}>
                    This is a computer generated proforma invoice. Please transfer the advance amount to the above bank details.
                </span>
            </div>
        </div>
    );
});

const PreviewProformaInvoice = ({ isOpen, onClose, proformaId, proformaData: initialProformaData, customerData: initialCustomerData, companyData: initialCompanyData, showPrintButton = false }) => {
    const [proforma, setProforma] = useState(initialProformaData || null);
    const [customer, setCustomer] = useState(initialCustomerData || null);
    const [companyData, setCompanyData] = useState(initialCompanyData || null);
    const [banks, setBanks] = useState([]);
    const [terms, setTerms] = useState(null);
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const modelRef = useRef(null);
    const proformaRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, proformaId, initialProformaData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (proformaId && !initialProformaData) {
                const res = await api.get(`/api/proforma-invoices/${proformaId}`);
                if (res.data.success) {
                    const pf = res.data.data;
                    setProforma(pf);
                    if (pf.customerId) {
                        const addressParts = [];
                        if (pf.customerId.address) addressParts.push(pf.customerId.address);
                        if (pf.customerId.city) addressParts.push(pf.customerId.city);
                        if (pf.customerId.state) addressParts.push(pf.customerId.state);
                        if (pf.customerId.country) addressParts.push(pf.customerId.country);
                        if (pf.customerId.pincode) addressParts.push(pf.customerId.pincode);

                        setCustomer({
                            name: pf.customerId.name,
                            address: addressParts.length > 0 ? addressParts.join(", ") : (pf.customerId.address || "-"),
                            phone: pf.customerId.phone,
                            email: pf.customerId.email,
                            gstin: pf.customerId.gstin
                        });
                    }
                }
            } else {
                setProforma(initialProformaData);
                setCustomer(initialCustomerData);
            }

            if (!initialCompanyData) {
                const companyRes = await api.get(`/api/companyprofile/get`);
                setCompanyData(companyRes.data.data);
            }

            const banksRes = await api.get("/api/company-bank/list");
            setBanks(banksRes.data.data);

            const termsRes = await api.get("/api/notes-terms-settings");
            setTerms(termsRes.data.data);

            const templateRes = await api.get("/api/print-templates/all");
            setTemplate(templateRes.data.data);

        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to fetch preview data");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const taxSettings = proforma?.taxSettings || { enableGSTBilling: true };

    return (
        <div
            style={{
                position: "fixed",
                top: "0px",
                left: "0px",
                zIndex: 999999,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.27)",
                backdropFilter: "blur(0.1px)",
                overflow: "auto",
            }}
            onClick={(e) => e.target === e.currentFront && onClose()}
        >
            <div
                style={{
                    background: "#F3F5F6",
                    padding: 6,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    width: "40%",
                    marginTop: '15px',
                    height: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    position: "absolute",
                }}
                ref={modelRef}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    style={{
                        width: "100%",
                        height: "100%",
                        paddingLeft: 36.37,
                        paddingRight: 36.37,
                        padding: "16px 36px 36px 36px",
                    }}
                >
                    <div
                        style={{
                            borderBottom: "1px solid #EAEAEA",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                marginBottom: "10px",
                                color: 'black',
                            }}
                        >
                            Preview
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {showPrintButton && (
                                <div
                                    onClick={() => {
                                        if (proformaRef.current) {
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                const printContent = proformaRef.current.cloneNode(true);
                                                printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>Proforma Invoice ${proforma?.proformaNo || ''}</title>
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body { font-family: 'IBM Plex Mono', 'Inter', sans-serif; padding: 20px; background: white; }
                      @media print { body { padding: 0; margin: 0; } }
                    </style>
                  </head>
                  <body>
                    ${printContent.outerHTML}
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
                                        }
                                    }}
                                    style={{
                                        color: "#1F7FFF",
                                        padding: "8px 16px",
                                        background: "white",
                                        border: "1px solid #1F7FFF",
                                        borderRadius: "8px",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        gap: "8px",
                                        fontSize: "14px",
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M6 9V3h12v6M6 21h12v-6H6v6zM21 9H3v6h2v-2h14v2h2V9z" />
                                        <path d="M6 15h12v4H6v-4z" />
                                    </svg>
                                    Print / Save as PDF
                                </div>
                            )}
                            <div
                                style={{
                                    color: "red",
                                    padding: "9px",
                                    background: "white",
                                    border: "1px solid #EAEAEA",
                                    borderRadius: "50%",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                }}
                                onClick={onClose}
                            >
                                <IoIosCloseCircleOutline size={24} />
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            paddingTop: 20,
                            position: "relative",
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            gap: 18.18,
                            display: "inline-flex",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                height: "100%",
                                position: "relative",
                            }}
                        >
                            {loading ? (
                                <div style={{ padding: '50px', textAlign: 'center', background: 'white', width: '100%' }}>Loading...</div>
                            ) : (
                                <ProformaInvoiceContent
                                    ref={proformaRef}
                                    proforma={proforma}
                                    customer={customer}
                                    companyData={companyData}
                                    banks={banks}
                                    terms={terms}
                                    template={template}
                                    taxSettings={taxSettings}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewProformaInvoice;