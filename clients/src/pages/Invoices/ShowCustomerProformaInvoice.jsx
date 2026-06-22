import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import {
  RiFileDownloadLine,
  RiMessage2Fill,
  RiWhatsappFill,
} from "react-icons/ri";
import { PiNewspaperClipping } from "react-icons/pi";
import { ImPrinter } from "react-icons/im";
import { toast } from "react-toastify";
import api from "../config/axiosInstance";
import { ProformaInvoiceContent } from "./PreviewProformaInvoice";

function ShowProformaInvoice() {
  const { proformaId } = useParams();
  const navigate = useNavigate();
  const [proformaData, setProformaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);
  const proformaRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareLoadingId, setShareLoadingId] = useState(null);
  const [shareLoadingWhatsapp, setShareLoadingWhatsapp] = useState(null);
  const [shareLoadingSms, setShareLoadingSms] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  // Fetch proforma data
  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const res = await api.get(`/api/proforma-invoices/${proformaId}`);
        if (res.data.success) {
          setProformaData(res.data.data);
        } else {
          toast.error("Failed to load proforma invoice");
          navigate("/proforma-invoices");
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to load proforma invoice");
        navigate("/proforma-invoices");
      } finally {
        setLoading(false);
      }
    };
    fetchProforma();
  }, [proformaId, navigate]);

  // Fetch company data, banks, terms, etc.
  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      setCompanyData(res.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch company profile");
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      setBanks(res.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch bank details");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch notes & terms settings");
    }
  };

  const fetchSignature = async () => {
    try {
      const res = await api.get("/api/print-templates/all");
      setTemplate(res.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch template settings");
    }
  };

  const fetchTaxSettings = async () => {
    try {
      const res = await api.get("/api/tax-gst-settings");
      setTaxSettings(res.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch tax settings");
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchSettings();
    fetchSignature();
    fetchBanks();
    fetchTaxSettings();
  }, []);

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (!proformaRef.current) return;
    setIsDownloading(true);

    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = await import("html2canvas");

      const element = proformaRef.current;

      const canvas = await html2canvas.default(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: 595,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;

      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`proforma-${proformaData?.proformaNo || "invoice"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error(error?.message || "Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  // Share via email
  const shareProformaEmail = async () => {
    try {
      setShareLoadingId(proformaData?._id);
      await api.post(`/api/proforma-invoices/email/${encodeURIComponent(proformaData?._id)}`, {
        email: proformaData?.customerId?.email
      });
      toast.success("Proforma Invoice shared via email");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to share via email");
    } finally {
      setShareLoadingId(null);
    }
  };

  // Share via WhatsApp
  const shareProformaWhatsapp = async () => {
    try {
      setShareLoadingWhatsapp(proformaData?._id);
      await api.post(`/api/proforma-invoices/whatsapp/${encodeURIComponent(proformaData?._id)}`, {
        phone: proformaData?.customerId?.phone
      });
      toast.success("Proforma Invoice shared via WhatsApp");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to share via WhatsApp");
    } finally {
      setShareLoadingWhatsapp(null);
    }
  };

  // Share via SMS
  const shareProformaSms = async () => {
    try {
      setShareLoadingSms(proformaData?._id);
      await api.post(`/api/proforma-invoices/sms/${proformaData?._id}`, {
        phone: proformaData?.customerId?.phone
      });
      toast.success("Proforma Invoice shared via SMS");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to share via SMS");
    } finally {
      setShareLoadingSms(null);
    }
  };

  // Convert to Sales Order
  const handleConvertToSalesOrder = async () => {
    setIsConverting(true);
    try {
      const response = await api.post(`/api/proforma-invoices/${proformaId}/convert-to-sales-order`);
      if (response.data.success) {
        toast.success("Successfully converted to Sales Order!");
        navigate(`/edit-sales-order/${response.data.salesOrder._id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to convert to Sales Order");
    } finally {
      setIsConverting(false);
    }
  };

  // Convert to Sales Invoice
  const handleConvertToSalesInvoice = async () => {
    setIsConverting(true);
    try {
      const response = await api.post(`/api/proforma-invoices/${proformaId}/convert-to-invoice`);
      if (response.data.success) {
        toast.success("Successfully converted to Sales Invoice!");
        navigate(`/edit-invoice/${response.data.invoice._id}`);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to convert to Sales Invoice");
    } finally {
      setIsConverting(false);
    }
  };

  // Record Advance Payment
  const recordAdvancePayment = async () => {
    const amount = prompt("Enter advance payment amount:", proformaData?.advancePaid || 0);
    if (amount && !isNaN(parseFloat(amount))) {
      try {
        const response = await api.post(`/api/proforma-invoices/${proformaId}/record-advance`, {
          amount: parseFloat(amount)
        });
        if (response.data.success) {
          toast.success("Advance payment recorded!");
          // Refresh data
          const res = await api.get(`/api/proforma-invoices/${proformaId}`);
          if (res.data.success) {
            setProformaData(res.data.data);
          }
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || "Failed to record advance payment");
      }
    }
  };

  if (loading) return <div>Loading proforma invoice...</div>;
  if (!proformaData) return <div>Proforma Invoice not found</div>;

  const customer = proformaData.customerId ? {
    name: proformaData.customerId.name,
    address: (() => {
      const addr = proformaData.customerId;
      const parts = [];
      if (addr.address) parts.push(addr.address);
      if (addr.city) parts.push(addr.city);
      if (addr.state) parts.push(addr.state);
      if (addr.country) parts.push(addr.country);
      if (addr.pincode) parts.push(addr.pincode);
      return parts.length > 0 ? parts.join(", ") : "No address provided";
    })(),
    phone: proformaData.customerId.phone,
    email: proformaData.customerId.email,
    gstin: proformaData.customerId.gstin
  } : {};

  // Calculate due amount
  const dueAmount = proformaData.grandTotal - (proformaData.advancePaid || 0);

  return (
    <div className="p-4" style={{ height: "100vh" }}>
      <div style={{ height: "calc(100vh - 70px)", overflow: "auto" }}>
        {/* Back button */}
        <Link to="/proforma-invoices" style={{ textDecoration: "none" }}>
          <span
            style={{
              cursor: "pointer",
              position: "fixed",
              left: "240px",
              top: "70px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #EAEAEA",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              zIndex: 10000,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <IoIosArrowBack style={{ color: "#6C748C", fontSize: "18px" }} />
          </span>
        </Link>

        <div
          style={{
            width: "100%",
            padding: "0px 16px 30px 24px",
            display: "flex",
            gap: 12,
            alignItems: "stretch",
            minHeight: "100%",
            justifyContent: "center",
          }}
        >
          {/* Left Side - Proforma Invoice Content */}
          <div
            style={{
              width: "595px",
              minWidth: "595px",
              maxWidth: "595px",
              height: "auto",
              minHeight: "820px",
              position: "relative",
              background: "#fff",
              borderRadius: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                padding: "10px 20px 5px 20px",
                visibility: isDownloading ? "hidden" : "visible",
                borderBottom: '1px solid #EFEFEF',
              }}
            >
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  margin: 0,
                  padding: 0,
                  color: "#474951",
                  fontFamily: "Inter",
                }}
              >
                Proforma Invoice
              </p>
            </div>
            
            {/* You need to create ProformaInvoiceContent component similar to InvoiceContent */}
            <ProformaInvoiceContent
              ref={proformaRef}
              proforma={proformaData}
              customer={customer}
              companyData={companyData}
              banks={banks}
              terms={terms}
              template={template}
              taxSettings={taxSettings}
            />
          </div>

          {/* Right Side - Actions */}
          <div style={{ width: "100%", height: "auto" }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: 12,
                display: 'inline-flex'
              }}
            >
              {/* Print & Send Section */}
              <div
                style={{
                  alignSelf: 'stretch',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 12,
                  display: 'flex',
                  width: '100%'
                }}
              >
                {/* Print */}
                <div
                  style={{
                    flex: '1 1 0',
                    padding: 16,
                    background: 'white',
                    boxShadow: '-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset',
                    borderRadius: 14.49,
                    outline: '0.91px solid #EAEAEA',
                    outlineOffset: '-0.91px',
                    width: '50%'
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Print</div>
                    <div style={{ height: 0.91, background: '#EAEAEA' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div
                      onClick={handleDownloadPDF}
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: 'white',
                        borderRadius: 8,
                        outline: isDownloading ? '1px solid #1F7FFF' : '1px solid #EAEAEA',
                        outlineOffset: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <RiFileDownloadLine style={{ color: '#1F7FFF', fontSize: 20 }} />
                      <span>{isDownloading ? "Downloading..." : "Download PDF"}</span>
                    </div>
                    <div
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: 'white',
                        borderRadius: 8,
                        outline: '1px solid #EAEAEA',
                        outlineOffset: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <PiNewspaperClipping style={{ color: '#1F7FFF', fontSize: 20 }} />
                      <span>Thermal Print</span>
                    </div>
                    <div
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: 'white',
                        borderRadius: 8,
                        outline: '1px solid #EAEAEA',
                        outlineOffset: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <ImPrinter style={{ color: '#1F7FFF', fontSize: 20 }} />
                      <span>Normal Print</span>
                    </div>
                  </div>
                </div>

                {/* Send */}
                <div
                  style={{
                    flex: '1 1 0',
                    padding: 16,
                    background: 'white',
                    boxShadow: '-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset',
                    borderRadius: 14.49,
                    outline: '0.91px solid #EAEAEA',
                    outlineOffset: '-0.91px',
                    width: '50%'
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Send</div>
                    <div style={{ height: 0.91, background: '#EAEAEA' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div
                      onClick={shareProformaSms}
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: 'white',
                        borderRadius: 8,
                        outline: shareLoadingSms ? '1px solid #4285F4' : '1px solid #EAEAEA',
                        outlineOffset: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <RiMessage2Fill style={{ color: '#1F7FFF', fontSize: 20 }} />
                      <span>{shareLoadingSms ? 'Sending...' : 'Message'}</span>
                    </div>
                    <div
                      onClick={shareProformaWhatsapp}
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: 'white',
                        borderRadius: 8,
                        outline: shareLoadingWhatsapp ? '1px solid #4285F4' : '1px solid #EAEAEA',
                        outlineOffset: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <RiWhatsappFill style={{ color: '#25D366', fontSize: 20 }} />
                      <span>{shareLoadingWhatsapp ? 'Sending...' : 'WhatsApp'}</span>
                    </div>
                    <div
                      onClick={shareProformaEmail}
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: 'white',
                        borderRadius: 8,
                        outline: shareLoadingId ? '1px solid #4285F4' : '1px solid #EAEAEA',
                        outlineOffset: '-1px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ width: 20, height: 15, position: 'relative' }}>
                        {/* Gmail icon */}
                        <div style={{ width: 4.54, height: 11.08, left: 0, top: 3.85, position: 'absolute', background: '#4285F4' }} />
                        <div style={{ width: 4.54, height: 11.08, left: 15.45, top: 3.85, position: 'absolute', background: '#34A853' }} />
                        <div style={{ width: 11.60, height: 6, left: 4.22, top: 3, position: 'absolute', background: '#EA4335' }} />
                        <div style={{ width: 4, height: 6, left: 8, top: 6, position: 'absolute', background: '#EA4335' }} />
                        <div style={{ width: 4.54, height: 7.24, left: 15.45, top: 0, position: 'absolute', background: '#FBBC04' }} />
                        <div style={{ width: 4.54, height: 7.24, left: 0, top: 0, position: 'absolute', background: '#C5221F' }} />
                      </div>
                      <span>{shareLoadingId ? 'Mailing...' : 'Mail'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion Options */}
              <div
                style={{
                  width: '100%',
                  padding: 24,
                  background: 'white',
                  borderRadius: 14.49,
                  outline: '1px solid #EAEAEA',
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Convert To</div>
                  <div style={{ height: 0.91, background: '#EAEAEA' }} />
                </div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleConvertToSalesInvoice}
                    disabled={isConverting}
                    style={{
                      padding: "10px 24px",
                      background: "#1F7FFF",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: isConverting ? "not-allowed" : "pointer",
                      opacity: isConverting ? 0.6 : 1,
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    {isConverting ? "Converting..." : "Convert to Sales Invoice"}
                  </button>
                  <button
                    onClick={handleConvertToSalesOrder}
                    disabled={isConverting}
                    style={{
                      padding: "10px 24px",
                      background: "#10B981",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      cursor: isConverting ? "not-allowed" : "pointer",
                      opacity: isConverting ? 0.6 : 1,
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    {isConverting ? "Converting..." : "Convert to Sales Order"}
                  </button>
                </div>
              </div>

              {/* Advance Payment Section */}
              <div
                style={{
                  width: '100%',
                  padding: 24,
                  background: 'white',
                  borderRadius: 14.49,
                  outline: '1px solid #EAEAEA',
                }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Payment Details</div>
                  <div style={{ height: 0.91, background: '#EAEAEA' }} />
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#6b7280' }}>Payment Terms:</span>
                    <span style={{ fontWeight: 500 }}>{proformaData.paymentTerms || "100% advance"}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#6b7280' }}>Advance Amount:</span>
                    <span style={{ fontWeight: 500 }}>₹{(proformaData.advanceAmount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#6b7280' }}>Advance Paid:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 500 }}>₹{(proformaData.advancePaid || 0).toFixed(2)}</span>
                      <button
                        onClick={recordAdvancePayment}
                        style={{
                          padding: "4px 12px",
                          background: "#1F7FFF",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          cursor: "pointer",
                          fontSize: 12
                        }}
                      >
                        Record Payment
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#6b7280' }}>Due Amount:</span>
                    <span style={{ fontWeight: 500, color: dueAmount > 0 ? "#dc2626" : "#10b981" }}>
                      ₹{dueAmount.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Payment Status:</span>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      backgroundColor: proformaData.advancePaymentStatus === "paid" ? "#d1fae5" : proformaData.advancePaymentStatus === "partial" ? "#fef3c7" : "#fee2e2",
                      color: proformaData.advancePaymentStatus === "paid" ? "#065f46" : proformaData.advancePaymentStatus === "partial" ? "#92400e" : "#991b1b",
                      fontSize: 12
                    }}>
                      {proformaData.advancePaymentStatus === "paid" ? "Paid" : proformaData.advancePaymentStatus === "partial" ? "Partial" : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {proformaData.bankDetails && (
                <div
                  style={{
                    width: '100%',
                    padding: 24,
                    background: 'white',
                    borderRadius: 14.49,
                    outline: '1px solid #EAEAEA',
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>Bank Details</div>
                    <div style={{ height: 0.91, background: '#EAEAEA' }} />
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>Bank Name:</span>
                      <span style={{ fontWeight: 500 }}>{proformaData.bankDetails?.bankName || "-"}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>Account Holder:</span>
                      <span style={{ fontWeight: 500 }}>{proformaData.bankDetails?.accountHolderName || "-"}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>Account Number:</span>
                      <span style={{ fontWeight: 500 }}>{proformaData.bankDetails?.accountNumber || "-"}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>IFSC Code:</span>
                      <span style={{ fontWeight: 500 }}>{proformaData.bankDetails?.ifsc || "-"}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#666' }}>Branch:</span>
                      <span style={{ fontWeight: 500 }}>{proformaData.bankDetails?.branch || "-"}</span>
                    </div>
                    {proformaData.bankDetails?.upiId && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>UPI ID:</span>
                        <span style={{ fontWeight: 500 }}>{proformaData.bankDetails.upiId}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Done Button */}
              <Link to="/proforma-invoices" style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    height: 36,
                    padding: "0 24px",
                    background: '#1F7FFF',
                    borderRadius: 8,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 500
                  }}
                >
                  Done
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowProformaInvoice;