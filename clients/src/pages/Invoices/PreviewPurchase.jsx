import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { format } from "date-fns";
import { toWords } from "number-to-words";
import api from "../config/axiosInstance";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../assets/images/taxinvoice.png";

// Separate PurchaseOrderContent component for reuse
export const PurchaseOrderContent = forwardRef(({ order, supplier, companyData, banks, terms, template, taxSettings }, ref) => {
    if (!order) return null;

    const parseNumber = (val) => parseFloat(val) || 0;

    const getNonEmptyProducts = () => {
        if (!order?.items) return [];
        return order.items.filter(item =>
            (item.itemName && item.itemName.trim() !== "") ||
            (item.name && item.name.trim() !== "") ||
            (item.productId?.productName && item.productId.productName.trim() !== "")
        ).map(item => ({
            ...item,
            name: item.name || item.itemName || item.productId?.productName,
            hsnCode: item.hsnCode || item.productId?.hsnCode
        }));
    };

    const orderDate = order?.purchaseDate ? new Date(order.purchaseDate) : new Date();
    const dueDate = order?.dueDate ? new Date(order.dueDate) : new Date();
    const orderNo = order?.purchaseNo || "-";
    const subtotal = parseNumber(order?.subtotal);
    const totalTax = parseNumber(order?.totalTax);
    const totalDiscount = parseNumber(order?.totalDiscount);
    const additionalChargesTotal = parseNumber(order?.additionalCharges);
    const grandTotal = parseNumber(order?.grandTotal);
    const amountPaid = parseNumber(order?.paidAmount);
    const amountDue = Math.max(0, grandTotal - amountPaid);

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
            {/* company logo + purchase order title */}
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

                {/* purchase order title */}
                <div style={{ width: "200px" }}>
                    <span style={{
                        fontSize: '30px',
                        fontFamily: 'Garamond',
                        color: 'black',
                        fontWeight: '500',
                    }}>Purchase Order</span>
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

            {/* order date + order no */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span>
                    ORDER Date - {format(orderDate, "dd MMM yyyy")}
                </span>
                <span style={{ marginRight: "12px" }}>
                    Reference No. - {order?.referenceNo || "-"}
                </span>
            </div>

            {/* due date */}
            <div
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "2px",
                }}
            >
                <span style={{ marginRight: "12px" }}>
                    ORDER No. - {orderNo}
                </span>
                 <span style={{ marginRight: "12px" }}>
                    Receipt Date - {order?.receiptDate ? format(new Date(order.receiptDate), "dd MMM yyyy") : "-"}
                </span>
            </div>
            <div>
                 <span>
                    DUE Date - {format(dueDate, "dd MMM yyyy")}
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
                    <span>Supplier Details</span>
                </div>
            </div>

            {/* from = company details + to = supplier details */}
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

                {/* supplier details = to */}
                <div style={{ width: "50%", padding: "3px 10px" }}>
                    <div>
                        Name:{" "}
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
                            {supplier?.name || supplier?.supplierName || "-"}
                        </span>
                    </div>
                    <div>
                        Address:{" "}
                        <span style={{ color: "black", fontWeight: "600" }}>
                            {/* FIX: Check if address is an object and format it properly */}
                            {supplier?.address
                                ? (typeof supplier.address === 'object'
                                    ? `${supplier.address.addressLine || ''}, ${supplier.address.city || ''}, ${supplier.address.state || ''} - ${supplier.address.pincode || ''}`.replace(/^, |, $/g, '') || 'N/A'
                                    : supplier.address)
                                : "-"}
                        </span>
                    </div>
                    <div style={{ marginTop: "0px" }}>
                        Phone:{" "}
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
                            {supplier?.phone || "-"}
                        </span>
                    </div>
                    <div style={{ marginTop: "0px" }}>
                        Email:{" "}
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
                            {supplier?.email || "-"}
                        </span>
                    </div>
                    <div style={{ marginTop: "0px" }}>
                        GSTIN:{" "}
                        <span
                            style={{ color: "black", fontWeight: "600" }}
                        >
                            {supplier?.gstin || "-"}
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
                                </td>
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
                    <div
                        style={{
                            width: "100%",
                            height: 0.76,
                            left: 31.77,
                            background: "var(--White-Stroke, #EAEAEA)",
                            marginTop: "10px",
                        }}
                    />
                    {/* <div
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
                                UPI:{" "}
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
                            borderBottom: "1px solid #EAEAEA",
                            padding: "2px 8px",
                        }}
                    >
                        <span>Advance Pay / Initial Pay</span>
                        <span style={{ color: "#059669", fontWeight: "500" }}>
                            ₹{amountPaid.toFixed(2)}
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
                            ₹{amountDue.toFixed(2)}
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
                    <span style={{ color: 'black' }}>
                        {terms ? terms?.termsText : "N/A"}
                    </span>
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
                                alt="Signature"
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
                        <span style={{ fontWeight: "500", fontSize: "10px" }}>
                            Authorized Signature
                        </span>
                    </div>
                </div>
            </div>

            {/* footer */}
            <div
                style={{
                    width: "100%",
                    justifyContent: "center",
                    display: "flex",
                }}
            >
                <span style={{ marginTop: "5px", fontSize: "8px", color: "#666" }}>
                    This is a computer generated purchase order
                </span>
            </div>
        </div>
    );
});

const PreviewPurchase = ({ isOpen, onClose, orderData, supplierData, companyData }) => {
    const [order, setOrder] = useState(orderData || null);
    const [supplier, setSupplier] = useState(supplierData || null);
    const [company, setCompany] = useState(companyData || null);
    const [banks, setBanks] = useState([]);
    const [terms, setTerms] = useState(null);
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const modelRef = useRef(null);
    const orderRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, orderData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            setOrder(orderData);
            setSupplier(supplierData);
            setCompany(companyData);

            // Fetch common data
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

    const taxSettings = order?.taxSettings || { enableGSTBilling: true };

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
            onClick={(e) => e.target === e.currentTarget && onClose()}
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
                            Preview
                        </div>

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
                                <PurchaseOrderContent
                                    ref={orderRef}
                                    order={order}
                                    supplier={supplier}
                                    companyData={company}
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

export default PreviewPurchase;