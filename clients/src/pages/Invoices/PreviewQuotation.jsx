import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { format } from "date-fns";
import { toWords } from "number-to-words";
import api from "../config/axiosInstance";
import CompanyLogo from "../../assets/images/kasperlogo.png";

// Separate QuotationContent component for reuse
export const QuotationContent = forwardRef(({ quotation, customer, companyData, banks, terms, template, taxSettings }, ref) => {
    if (!quotation) return null;

    const parseNumber = (val) => parseFloat(val) || 0;

    const getNonEmptyProducts = () => {
        if (!quotation?.items) return [];
        return quotation.items.filter(item =>
            (item.itemName && item.itemName.trim() !== "") ||
            (item.name && item.name.trim() !== "") ||
            (item.productId?.productName && item.productId.productName.trim() !== "")
        ).map(item => {
            let hsnCode = item.hsnCode || "";

            if (!hsnCode && item.productId) {
                // Check if hsn is populated (object with hsnCode)
                if (item.productId.hsn && typeof item.productId.hsn === 'object') {
                    hsnCode = item.productId.hsn.hsnCode || "";
                }
                // Check direct hsnCode field on product
                if (!hsnCode) {
                    hsnCode = item.productId.hsnCode || "";
                }
            }

            // Handle serial numbers - FIX THIS SECTION
            let selectedSerialNos = [];

            // Check if selectedSerialNos exists
            if (item.selectedSerialNos) {
                // Case 1: It's already an array
                if (Array.isArray(item.selectedSerialNos)) {
                    // If the array has one element that looks like a JSON string
                    if (item.selectedSerialNos.length === 1 &&
                        typeof item.selectedSerialNos[0] === 'string' &&
                        item.selectedSerialNos[0].startsWith('[') &&
                        item.selectedSerialNos[0].endsWith(']')) {
                        try {
                            // Parse the inner JSON string
                            const parsed = JSON.parse(item.selectedSerialNos[0]);
                            if (Array.isArray(parsed)) {
                                selectedSerialNos = parsed;
                            }
                        } catch (e) {
                            selectedSerialNos = item.selectedSerialNos;
                        }
                    } else {
                        // Use the array directly
                        selectedSerialNos = item.selectedSerialNos;
                    }
                }
                // Case 2: It's a string
                else if (typeof item.selectedSerialNos === 'string') {
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

            // Also check other possible fields
            if (selectedSerialNos.length === 0) {
                if (item.serialNumbers && Array.isArray(item.serialNumbers)) {
                    selectedSerialNos = item.serialNumbers;
                } else if (item.serialno) {
                    if (typeof item.serialno === 'string') {
                        try {
                            if (item.serialno.startsWith('[') && item.serialno.endsWith(']')) {
                                const parsed = JSON.parse(item.serialno);
                                if (Array.isArray(parsed)) {
                                    selectedSerialNos = parsed;
                                }
                            } else {
                                selectedSerialNos = item.serialno.split(',').map(s => s.trim()).filter(s => s);
                            }
                        } catch (e) {
                            selectedSerialNos = item.serialno.split(',').map(s => s.trim()).filter(s => s);
                        }
                    } else if (Array.isArray(item.serialno)) {
                        selectedSerialNos = item.serialno;
                    }
                }
            }

            return {
                ...item,
                name: item.name || item.itemName || item.productId?.productName,
                hsnCode: hsnCode || "",
                description: item.description || item.productId?.description || "",
                lotNumber: item.lotNumber || item.productId?.lotNumber || "",
                selectedSerialNos: selectedSerialNos // Use the parsed serial numbers
            };
        });
    };

    // for system setting for serial no
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
                        color: data.variants?.color || false
                    },
                    units: data.units || false,
                    expiry: data.expiry || false,
                });
            }
        } catch (error) {
            // console.error("Error fetching system settings:", error);
            // toast.error("Failed to fetch system settings");
            toast.error(error?.response?.data?.message || "Failed to fetch system settings");
        }
    };

    const quotationDate = quotation?.quotationDate ? new Date(quotation.quotationDate) : new Date();
    const expiryDate = quotation?.expiryDate ? new Date(quotation.expiryDate) : new Date();
    const quotationNo = quotation?.quotationNo || "-";
    const subtotal = parseNumber(quotation?.subtotal);
    const totalTax = parseNumber(quotation?.totalTax);
    const totalDiscount = parseNumber(quotation?.totalDiscount);
    const pointsRedeemedAmount = parseNumber(quotation?.pointsRedeemedAmount || quotation?.shoppingPointsUsed);
    const additionalChargesTotal = parseNumber(quotation?.additionalCharges);
    const grandTotal = parseNumber(quotation?.grandTotal);
    const validForDays = quotation?.validForDays || 30;

    const formatSerialNumbers = (serialNumbers) => {
        if (!serialNumbers || !Array.isArray(serialNumbers)) return "";
        let result = "";
        for (let i = 0; i < serialNumbers.length; i++) {
            if (i > 0) {
                result += ", ";
            }
            result += serialNumbers[i];

            if ((i + 1) % 2 === 0 && i < serialNumbers.length - 1) {
                result += ",\n"; // Add a newline after every 2 serial numbers
            }
        }
        return result;
    };

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
            {/* company logo + quotation title */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                {/* company logo */}
                <div style={{ width: "100px", height: '70px' }}>
                    <img
                        src={companyData?.companyLogo || CompanyLogo}
                        alt="company logo"
                        style={{ width: "100%", height: '100%', objectFit: "contain" }}
                    />
                </div>

                {/* quotation title */}
                <div style={{ width: "170px" }}>
                    <span style={{
                        fontSize: '35px',
                        fontFamily: 'Garamond',
                        color: 'black',
                        fontWeight: '500',
                    }}>Quotation</span>
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

            {/* quotation date + quotation no + validity */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    QUOTATION Date - {format(quotationDate, "dd MMM yyyy")}
                </span>
                <span style={{ marginRight: "12px" }}>
                    Quotation No. - {quotationNo}
                </span>
            </div>

            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    Valid Till - {format(expiryDate, "dd MMM yyyy")} ({validForDays} days)
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
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
                            {customer?.name || "-"}
                        </span>
                    </div>
                    <div>
                        Address:{" "}
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
                            {(() => {
                                // Format address properly
                                if (!customer) return "-";

                                const parts = [];

                                // First, check if customer has a direct address string (this should be the street address)
                                if (customer.address) {
                                    if (typeof customer.address === 'string') {
                                        parts.push(customer.address);
                                    } else if (typeof customer.address === 'object' && customer.address.addressLine) {
                                        parts.push(customer.address.addressLine);
                                    }
                                }

                                // Then check for addressLine
                                if (customer.addressLine && !parts.includes(customer.addressLine)) {
                                    parts.push(customer.addressLine);
                                }

                                // Add city
                                if (customer.city) parts.push(customer.city);

                                // Add state
                                if (customer.state) parts.push(customer.state);

                                // Add country
                                if (customer.country) parts.push(customer.country);

                                // Add pincode (without extra space)
                                if (customer.pincode) parts.push(customer.pincode);

                                return parts.length > 0 ? parts.join(", ") : "-";
                            })()}
                        </span>
                    </div>
                    <div style={{ marginTop: "0px" }}>
                        Phone:{" "}
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
                            {customer?.phone || "-"}
                        </span>
                    </div>
                    <div style={{ marginTop: "0px" }}>
                        Email:{" "}
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
                            {customer?.email || "-"}
                        </span>
                    </div>
                    <div style={{ marginTop: "0px" }}>
                        GSTIN:{" "}
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
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
                            <th
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                }}
                                rowSpan="2"
                            >
                                Sr No.
                            </th>
                            <th
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                }}
                                rowSpan="2"
                            >
                                Name of the Products
                            </th>
                            {settings.lotno && (
                                <th
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        borderBottom: "1px solid #EAEAEA",
                                        fontWeight: "400",
                                    }}
                                    rowSpan="2"
                                >
                                    Lot No.
                                </th>
                            )}
                            <th
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                }}
                                rowSpan="2"
                            >
                                HSN
                            </th>
                            <th
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                }}
                                rowSpan="2"
                            >
                                QTY
                            </th>
                            {settings.serialno && (
                                <th
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        borderBottom: "1px solid #EAEAEA",
                                        fontWeight: "400",
                                    }}
                                    rowSpan="2"
                                >
                                    Serial No.
                                </th>
                            )}
                            <th
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                }}
                                rowSpan="2"
                            >
                                Rate
                            </th>
                            {taxSettings?.enableGSTBilling ? (
                                <>
                                    <th
                                        style={{
                                            borderRight: "1px solid #EAEAEA",
                                            borderBottom: "1px solid #EAEAEA",
                                            fontWeight: "400",
                                        }}
                                        colSpan="2"
                                    >
                                        Tax
                                    </th>
                                </>
                            ) : (
                                <>
                                    <th
                                        style={{
                                            borderRight: "1px solid #EAEAEA",
                                            borderBottom: "1px solid #EAEAEA",
                                            fontWeight: "400",
                                        }}
                                        colSpan="2"
                                    >
                                        Tax
                                    </th>
                                </>
                            )}
                            <th
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                }}
                                rowSpan="2"
                            >
                                Total
                            </th>
                        </tr>
                        <tr>
                            {taxSettings?.enableGSTBilling ? (
                                <>
                                    <th
                                        style={{
                                            borderRight: "1px solid #EAEAEA",
                                            borderBottom: "1px solid #EAEAEA",
                                            width: "40px",
                                            fontWeight: "400",
                                        }}
                                    >
                                        %
                                    </th>
                                    <th
                                        style={{
                                            borderRight: "1px solid #EAEAEA",
                                            borderBottom: "1px solid #EAEAEA",
                                            width: "40px",
                                            fontWeight: "400",
                                        }}
                                    >
                                        ₹
                                    </th>
                                </>
                            ) : (
                                <>
                                    <th
                                        style={{
                                            borderRight: "1px solid #EAEAEA",
                                            borderBottom: "1px solid #EAEAEA",
                                            width: "40px",
                                            fontWeight: "400",
                                        }}
                                    >
                                        %
                                    </th>
                                    <th
                                        style={{
                                            borderRight: "1px solid #EAEAEA",
                                            borderBottom: "1px solid #EAEAEA",
                                            width: "40px",
                                            fontWeight: "400",
                                        }}
                                    >
                                        ₹
                                    </th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {getNonEmptyProducts().map((item, idx) => (
                            <tr key={idx}>
                                <td
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        height: "40px",
                                        textAlign: "center",
                                    }}
                                >
                                    {idx + 1}
                                </td>
                                <td
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        padding: "0px 20px",
                                    }}
                                >
                                    {item.name || ""}
                                    {settings.description && (
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            {item.description || ""}
                                        </div>
                                    )}
                                </td>
                                {settings.lotno && (
                                    <td
                                        style={{
                                            borderRight: "1px solid #EAEAEA",
                                            textAlign: "center",
                                        }}
                                    >
                                        {item.lotNumber || "-"}
                                    </td>
                                )}
                                <td
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                    }}
                                >
                                    {item.hsnCode || "-"}
                                </td>
                                <td
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                    }}
                                >
                                    {item.qty || ""}
                                </td>
                                {settings.serialno && (
                                    <td
                                        style={{
                                            borderRight: "1px solid #EAEAEA",
                                            height: "40px",
                                            textAlign: "center",
                                            verticalAlign: "middle",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                width: "100%",
                                                height: "100%",
                                                whiteSpace: "pre-line"
                                            }}
                                        >
                                            {item.selectedSerialNos && item.selectedSerialNos.length > 0
                                                ? formatSerialNumbers(item.selectedSerialNos)
                                                : "-"}
                                        </div>
                                    </td>
                                )}
                                <td
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                    }}
                                >
                                    {item.unitPrice
                                        ? `₹${parseNumber(item.unitPrice).toFixed(2)}`
                                        : ""}
                                </td>
                                <td
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                    }}
                                >
                                    {item.taxRate || "0"}%
                                </td>
                                <td
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                    }}
                                >
                                    ₹{(item.taxAmount || 0).toFixed(2)}
                                </td>
                                <td
                                    style={{
                                        borderRight: "1px solid #EAEAEA",
                                        textAlign: "center",
                                    }}
                                >
                                    ₹{(item.amount || 0).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    height: "100px",
                                    textAlign: "center",
                                }}
                            ></td>
                            <td
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    padding: "0px 20px",
                                }}
                            ></td>
                            <td
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                }}
                            ></td>
                            <td
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                }}
                            ></td>
                            <td
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                }}
                            ></td>
                            <td
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                }}
                            ></td>
                            <td
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                }}
                            ></td>
                            <td
                                style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                }}
                            ></td>
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
                    {/* <div
                        style={{
                            width: "100%",
                            height: 0.76,
                            left: 31.77,
                            background: "var(--White-Stroke, #EAEAEA)",
                            marginTop: "10px",
                        }}
                    /> */}
                    {/* <div
                        style={{
                            marginTop: "2px",
                            textDecoration: "underline",
                        }}
                    >
                        Bank Details
                    </div> */}
                    {/* <div
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
                                <span
                                    style={{
                                        color: "black",
                                        fontWeight: "600",
                                    }}
                                >
                                    {banks.length > 0
                                        ? banks[0]?.bankName
                                        : "N/A"}
                                </span>
                            </div>
                            <div>
                                Branch:{" "}
                                <span
                                    style={{
                                        color: "black",
                                        fontWeight: "600",
                                    }}
                                >
                                    {banks.length > 0
                                        ? banks[0]?.branch
                                        : "N/A"}
                                </span>
                            </div>
                            <div>
                                Acc No.:{" "}
                                <span
                                    style={{
                                        color: "black",
                                        fontWeight: "600",
                                    }}
                                >
                                    {banks.length > 0
                                        ? banks[0]?.accountNumber
                                        : "N/A"}
                                </span>
                            </div>
                            <div>
                                IFSC:{" "}
                                <span
                                    style={{
                                        color: "black",
                                        fontWeight: "600",
                                    }}
                                >
                                    {banks.length > 0 ? banks[0]?.ifsc : "N/A"}
                                </span>
                            </div>
                            <div>
                                Upi:{" "}
                                <span
                                    style={{
                                        color: "black",
                                        fontWeight: "600",
                                    }}
                                >
                                    {banks.length > 0 ? banks[0]?.upiId : "N/A"}
                                </span>
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: "90px",
                                    objectFit: "contain",
                                }}
                            >
                                <img
                                    src={
                                        banks.length > 0
                                            ? banks[0]?.qrCode
                                            : ""
                                    }
                                    alt="QR Code"
                                    style={{ width: "100%" }}
                                />
                            </div>
                            <div>Pay Using QR</div>
                        </div>
                    </div> */}
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

const PreviewQuotation = ({ isOpen, onClose, quotationId, quotationData: initialQuotationData, customerData: initialCustomerData, companyData: initialCompanyData, showPrintButton = false }) => {
    const [quotation, setQuotation] = useState(initialQuotationData || null);
    const [customer, setCustomer] = useState(initialCustomerData || null);
    const [companyData, setCompanyData] = useState(initialCompanyData || null);
    const [banks, setBanks] = useState([]);
    const [terms, setTerms] = useState(null);
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hideModal, setHideModal] = useState(false);
    const modelRef = useRef(null);
    const quotationRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, quotationId, initialQuotationData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // If we have a quotationId, fetch full details from backend
            if (quotationId && !initialQuotationData) {
                const res = await api.get(`/api/quotations/${quotationId}`);
                if (res.data.success) {
                    const quot = res.data.quotation;
                    setQuotation(quot);
                    if (quot.customerId) {
                        const addr = quot.customerId;
                        const addressParts = [];

                        // Build address in proper order: Street Address, City, State, Country, Pincode
                        if (addr.address) addressParts.push(addr.address);
                        if (addr.city) addressParts.push(addr.city);
                        if (addr.state) addressParts.push(addr.state);
                        if (addr.country) addressParts.push(addr.country);
                        if (addr.pincode) addressParts.push(addr.pincode);
                        setCustomer({
                            name: quot.customerId.name,
                            // address: [quot.customerId.country, quot.customerId.state, quot.customerId.city, quot.customerId.pincode].filter(Boolean).join(", ") || quot.customerId.address,
                            // address: [quot.customerId.country, quot.customerId.state, quot.customerId.city, quot.customerId.pincode].filter(Boolean).join(", ") || quot.customerId.address,
                            address: addressParts.length > 0 ? addressParts.join(", ") : (quot.customerId.address || "-"),
                            phone: quot.customerId.phone,
                            email: quot.customerId.email,
                            gstin: quot.customerId.gstin
                        });
                    }
                }
            } else {
                setQuotation(initialQuotationData);
                setCustomer(initialCustomerData);
            }

            // Fetch common data if not provided
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
            // console.error("Error fetching preview data:", error);
            toast.error(error?.response?.data?.message || "Failed to fetch preview data");
        } finally {
            setLoading(false);
        }
    };
    if (!isOpen) return null;
    const taxSettings = quotation?.taxSettings || { enableGSTBilling: true };

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
            onClick={(e) =>
                e.target === e.currentTarget && onClose()
            }
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
                    {/* header */}
                    <div
                        style={{
                            borderBottom: "1px solid #EAEAEA",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        {/* title */}
                        <div
                            style={{
                                fontSize: "20px",
                                fontWeight: "600",
                                marginBottom: "10px",
                                color: 'black',
                            }}
                        >
                            Preview Quotation
                        </div>
                        {/* for action in print in quotation start */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {/* Print Button - Only visible when opened from Quotation list for printing */}
                            {showPrintButton && (
                                <div
                                    onClick={() => {
                                        if (quotationRef.current) {
                                            // Create a new window for printing
                                            const printWindow = window.open('', '_blank');
                                            if (printWindow) {
                                                // Clone the content to avoid modifying the original
                                                const printContent = quotationRef.current.cloneNode(true);

                                                printWindow.document.write(`
                            <!DOCTYPE html>
                            <html>
                                <head>
                                    <title>Quotation ${quotation?.quotationNo || ''}</title>
                                    <style>
                                        * {
                                            margin: 0;
                                            padding: 0;
                                            box-sizing: border-box;
                                        }
                                        body {
                                            font-family: 'IBM Plex Mono', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                            padding: 20px;
                                            background: white;
                                        }
                                        @media print {
                                            body {
                                                padding: 0;
                                                margin: 0;
                                            }
                                            .no-print {
                                                display: none;
                                            }
                                        }
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
                        </div>
                        {/* for action in print in quotation end */}

                        {/* close button */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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

                    {/* main body */}
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
                                <QuotationContent
                                    ref={quotationRef}
                                    quotation={quotation}
                                    customer={customer}
                                    companyData={companyData}
                                    banks={banks}
                                    terms={terms}
                                    template={template}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewQuotation;