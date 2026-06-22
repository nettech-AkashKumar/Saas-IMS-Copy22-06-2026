import React, { useEffect, useState, useRef, forwardRef } from "react";
import { format } from "date-fns";
import { toWords } from "number-to-words";
import { IoIosCloseCircleOutline } from "react-icons/io";
import api from "../config/axiosInstance";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import { toast } from "react-toastify";

// Sales Order Content Component
export const SalesOrderContent = forwardRef(
  ({ salesOrder, customer, companyData, banks, terms, template, taxSettings }, ref) => {
    if (!salesOrder) return null;

    const parseNumber = (val) => parseFloat(val) || 0;

    const getNonEmptyProducts = () => {
      if (!salesOrder?.items) return [];
      return salesOrder.items.filter(
        (item) =>
          (item.itemName && item.itemName.trim() !== "") ||
          (item.name && item.name.trim() !== "") ||
          (item.productId?.productName && item.productId.productName.trim() !== "")
      );
    };

    // System settings for serial no
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
      const fetchProductSettings = async () => {
        try {
          const response = await api.get("/api/system-settings");
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
          console.error("Error fetching system settings:", error);
        }
      };
      fetchProductSettings();
    }, []);

    const orderDate = salesOrder.orderDate ? new Date(salesOrder.orderDate) : new Date();
    const expectedDeliveryDate = salesOrder.expectedDeliveryDate
      ? new Date(salesOrder.expectedDeliveryDate)
      : null;
    const salesOrderNo = salesOrder.salesOrderNo || "-";
    const subtotal = parseNumber(salesOrder.subtotal);
    const totalTax = parseNumber(salesOrder.totalTax);
    const totalDiscount = parseNumber(salesOrder.totalDiscount);
    const additionalChargesTotal = parseNumber(salesOrder.additionalCharges);
    const grandTotal = parseNumber(salesOrder.grandTotal);
    const status = salesOrder.status || "draft";

    const cleanSerialNumbers = (serialNos) => {
  if (!serialNos) return [];
  
  // If it's not an array, try to parse it
  let serialArray = Array.isArray(serialNos) ? serialNos : [serialNos];
  
  // Filter out empty values, "[]" strings, and empty arrays
  return serialArray.filter(s => {
    if (!s) return false;
    if (s === "[]") return false;
    if (Array.isArray(s) && s.length === 0) return false;
    if (typeof s === 'string') {
      const trimmed = s.trim();
      if (trimmed === "" || trimmed === "[]") return false;
      // Handle case where string is actually an array string like '["SN123"]'
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch {
          return true;
        }
      }
      return true;
    }
    return true;
  });
};

    // const formatSerialNumbers = (serialNumbers) => {
    //    const cleanedSerials = cleanSerialNumbers(serialNumbers);
    //   if (!cleanedSerials  || !Array.isArray(cleanedSerials )) return "";
    //   let result = "";
    //   for (let i = 0; i < cleanedSerials .length; i++) {
    //     if (i > 0) {
    //       result += ", ";
    //     }
    //     result += serialNumbers[i];
    //     if ((i + 1) % 2 === 0 && i < serialNumbers.length - 1) {
    //       result += ",\n";
    //     }
    //   }
    //   return result;
    // };
    const formatSerialNumbers = (serialNumbers) => {
  // Clean the serial numbers first
  const cleanedSerials = cleanSerialNumbers(serialNumbers);
  
  if (!cleanedSerials || cleanedSerials.length === 0) return "-";
  
  let result = "";
  for (let i = 0; i < cleanedSerials.length; i++) {
    if (i > 0) {
      result += ", ";
    }
    // If the serial is a string that looks like JSON, parse it
    let serialValue = cleanedSerials[i];
    if (typeof serialValue === 'string' && serialValue.startsWith('[') && serialValue.endsWith(']')) {
      try {
        const parsed = JSON.parse(serialValue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          serialValue = parsed[0]; // Take the first value
        } else {
          serialValue = "-";
        }
      } catch {
        // Keep as is
      }
    }
    result += serialValue;
    if ((i + 1) % 2 === 0 && i < cleanedSerials.length - 1) {
      result += ",\n";
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
          fontSize: "10px",
        }}
      >
        {/* Company logo + Sales Order Title */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ width: "100px", height: "70px" }}>
            <img
              src={companyData?.companyLogo || CompanyLogo}
              alt="company logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div style={{ width: "200px" }}>
            <span
              style={{
                fontSize: "35px",
                fontFamily: "Garamond",
                color: "black",
                fontWeight: "500",
              }}
            >
              Sales Order
            </span>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 0.76,
            background: "var(--White-Stroke, #EAEAEA)",
            marginTop: "8px",
          }}
        />

        {/* Order Date & Order Number */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            marginTop: "2px",
          }}
        >
          <span>Order Date - {format(orderDate, "dd MMM yyyy")}</span>
          <span style={{ marginRight: "12px" }}>
            Order No. - {salesOrderNo}
          </span>
        </div>

        {/* Expected Delivery Date */}
        {expectedDeliveryDate && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              marginTop: "2px",
            }}
          >
            <span>Expected Delivery - {format(expectedDeliveryDate, "dd MMM yyyy")}</span>
            <span style={{ marginRight: "12px" }}>
              Status -{" "}
              <span
                style={{
                  color:
                    status === "converted_to_invoice"
                      ? "#0E9F6E"
                      : status === "cancelled"
                      ? "#dc3545"
                      : "#1F7FFF",
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {status.replace(/_/g, " ")}
              </span>
            </span>
          </div>
        )}

        <div
          style={{
            width: "100%",
            height: 0.76,
            marginTop: "1px",
            background: "var(--White-Stroke, #EAEAEA)",
          }}
        />

        {/* From + To */}
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

        {/* Company Details + Customer Details */}
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

        {/* Products Table */}
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
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">
                  Sr No.
                </th>
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">
                  Name of the Products
                </th>
                {settings.lotno && (
                  <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">
                    Lot No.
                  </th>
                )}
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">
                  HSN
                </th>
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">
                  QTY
                </th>
                {settings.serialno && (
                  <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">
                    Serial No.
                  </th>
                )}
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">
                  Rate
                </th>
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} colSpan="2">
                  Tax
                </th>
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", fontWeight: "400" }} rowSpan="2">
                  Total
                </th>
              </tr>
              <tr>
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>
                  %
                </th>
                <th style={{ borderRight: "1px solid #EAEAEA", borderBottom: "1px solid #EAEAEA", width: "40px", fontWeight: "400" }}>
                  ₹
                </th>
              </tr>
            </thead>
            <tbody>
              {getNonEmptyProducts().map((item, idx) => (
                <tr key={idx}>
                  <td style={{ borderRight: "1px solid #EAEAEA", height: "40px", textAlign: "center" }}>
                    {idx + 1}
                  </td>
                  <td style={{ borderRight: "1px solid #EAEAEA", padding: "0px 20px" }}>
                    {item.itemName || item.name || item.productId?.productName || ""}
                    {settings.description && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {item.description || ""}
                      </div>
                    )}
                  </td>
                  {settings.lotno && (
                    <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
                      {item.lotNumber || "-"}
                    </td>
                  )}
                  <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
                    {item.hsnCode || "-"}
                  </td>
                  <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
                    {item.qty || ""}
                  </td>
                  {settings.serialno && (
                    <td style={{ borderRight: "1px solid #EAEAEA", height: "40px", textAlign: "center", verticalAlign: "middle" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "100%",
                          height: "100%",
                          whiteSpace: "pre-line",
                        }}
                      >
                        {/* {item.selectedSerialNos && item.selectedSerialNos.length > 0
                          ? formatSerialNumbers(item.selectedSerialNos)
                          : "-"} */}
                          {(() => {
                // Clean the serial numbers
                const cleaned = cleanSerialNumbers(item.selectedSerialNos);
                return cleaned.length > 0 ? formatSerialNumbers(item.selectedSerialNos) : "-";
            })()}
                      </div>
                    </td>
                  )}
                  <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
                    {item.unitPrice ? `₹${parseNumber(item.unitPrice).toFixed(2)}` : ""}
                  </td>
                  <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
                    {item.taxRate || "0"}%
                  </td>
                  <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
                    ₹{(item.taxAmount || 0).toFixed(2)}
                  </td>
                  <td style={{ borderRight: "1px solid #EAEAEA", textAlign: "center" }}>
                    ₹{(item.amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pricing Summary */}
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
                color: "black",
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
                    </div>
          </div>

          <div style={{ width: "50%", padding: "3px", borderLeft: "1px solid #EAEAEA" }}>
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "1px 8px",
              }}
            >
              <span style={{ fontWeight: "700", fontSize: "14px", color: "black" }}>
                Total
              </span>
              <span style={{ color: "black", fontWeight: "600", fontSize: "13px" }}>
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
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
            <span style={{ color: "black" }}>{salesOrder.termsAndConditions || terms?.termsText || "N/A"}</span>
          </div>
          {/* for signature start */}
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

          {/* for signature end */}
        </div>

        {/* Notes */}
        {salesOrder.notes && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-around",
              marginTop: "5px",
            }}
          >
            <div style={{ width: "100%", padding: "3px", textAlign: "center" }}>
              <u>Notes</u>
              <span style={{ color: "black", display: "block" }}>{salesOrder.notes}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

// Preview Modal Component
const PreviewSalesOrder = ({ isOpen, onClose, salesOrderId, salesOrderData, customerData, companyData }) => {
  const [salesOrder, setSalesOrder] = useState(salesOrderData || null);
  const [customer, setCustomer] = useState(customerData || null);
  const [companyDataState, setCompanyDataState] = useState(companyData || null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const modelRef = useRef(null);
  const invoiceRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, salesOrderId, salesOrderData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // If we have a salesOrderId, fetch full details from backend
      if (salesOrderId && !salesOrderData) {
        const res = await api.get(`/api/sales-orders/${salesOrderId}`);
        if (res.data.success) {
          const order = res.data.salesOrder;
          setSalesOrder(order);
          if (order.customerId) {
            const addressParts = [];
            const addr = order.customerId;
            if (addr.address) addressParts.push(addr.address);
            if (addr.city) addressParts.push(addr.city);
            if (addr.state) addressParts.push(addr.state);
            if (addr.country) addressParts.push(addr.country);
            if (addr.pincode) addressParts.push(addr.pincode);
            setCustomer({
              name: addr.name,
              address: addressParts.length > 0 ? addressParts.join(", ") : (addr.address || "-"),
              phone: addr.phone,
              email: addr.email,
              gstin: addr.gstin,
            });
          }
        }
      } else {
        setSalesOrder(salesOrderData);
        setCustomer(customerData);
      }

      // Fetch common data if not provided
      if (!companyData) {
        const companyRes = await api.get(`/api/companyprofile/get`);
        setCompanyDataState(companyRes.data.data);
      }

      const banksRes = await api.get("/api/company-bank/list");
      setBanks(banksRes.data.data);

      const termsRes = await api.get("/api/notes-terms-settings");
      setTerms(termsRes.data.data);

      const templateRes = await api.get("/api/print-templates/all");
      setTemplate(templateRes.data.data);

      const taxRes = await api.get("/api/tax-gst-settings");
      setTaxSettings(taxRes.data.data);
    } catch (error) {
      console.error("Error fetching preview data:", error);
      toast.error(error?.response?.data?.message || "Failed to fetch preview data");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const taxSettingsData = salesOrder?.taxSettings || taxSettings || { enableGSTBilling: true };

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
          marginTop: "15px",
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
                color: "black",
              }}
            >
              Preview Sales Order
            </div>

            {/* action buttons */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                <div style={{ padding: "50px", textAlign: "center", background: "white", width: "100%" }}>
                  Loading...
                </div>
              ) : (
                <SalesOrderContent
                  ref={invoiceRef}
                  salesOrder={salesOrder}
                  customer={customer}
                  companyData={companyDataState}
                  banks={banks}
                  terms={terms}
                  template={template}
                  taxSettings={taxSettingsData}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewSalesOrder;