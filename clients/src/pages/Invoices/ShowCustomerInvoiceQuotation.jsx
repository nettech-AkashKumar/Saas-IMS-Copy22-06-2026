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
import { format } from "date-fns";
import { toWords } from "number-to-words";
import { toast } from "react-toastify";
import api from "../config/axiosInstance";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../assets/images/taxinvoice.png";
import { QuotationContent } from "./PreviewQuotation";

// ✅ Quotation-only typography + layout tokens (won't affect right panel)
const quotationTokens = {
  fontFamily: "Roboto, Inter, system-ui, -apple-system, Segoe UI, Arial",
  text: "#2B2F38",
  muted: "#6C748C",
  border: "#EAEAEA",
  black: "#0E101A",
  bgHead: "#FAFBFC",
};

const quotationStyles = {
  page: {
    width: "595px",
    minWidth: "595px",
    maxWidth: "595px",
    height: "842px",
    minHeight: "842px",
    position: "relative",
    background: "#fff",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    overflow: "hidden",
  },

  base: {
    fontFamily: quotationTokens.fontFamily,
    color: quotationTokens.text,
    fontSize: 12,
    lineHeight: 1.35,
    width: "100%",
    height: "100%",
  },

  topTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    padding: 0,
    color: "#474951",
    fontFamily: "Inter",
  },

  card: {
    width: "100%",
    height: "100%",
    background: "#fff",
    boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
    padding: "10px 30px",
  },

  divider: {
    width: "100%",
    height: 1,
    background: quotationTokens.border,
  },

  label: {
    color: quotationTokens.muted,
    fontWeight: 500,
  },

  value: {
    color: quotationTokens.black,
    fontWeight: 600,
  },

  metaRow: {
    width: "100%",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 12,
    color: quotationTokens.text,
  },

  sectionTabs: {
    width: "100%",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    borderBottom: `1px solid ${quotationTokens.border}`,
    padding: "6px 0px",
  },

  sectionTabHalf: {
    width: "50%",
    textAlign: "center",
  },

  halfBoxRow: {
    width: "100%",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "stretch",
    borderBottom: `1px solid ${quotationTokens.border}`,
  },

  halfBox: {
    width: "50%",
    padding: 8,
  },

  halfBoxRightBorder: {
    borderRight: `1px solid ${quotationTokens.border}`,
  },

  table: {
    width: "100%",
    border: `1px solid ${quotationTokens.border}`,
    borderCollapse: "collapse",
    fontSize: 11.5,
  },

  th: {
    borderRight: `1px solid ${quotationTokens.border}`,
    borderBottom: `1px solid ${quotationTokens.border}`,
    padding: "8px 8px",
    textAlign: "center",
    fontWeight: 700,
    color: quotationTokens.black,
    background: quotationTokens.bgHead,
    verticalAlign: "middle",
  },

  td: {
    borderRight: `1px solid ${quotationTokens.border}`,
    borderBottom: `1px solid ${quotationTokens.border}`,
    padding: "8px 8px",
    verticalAlign: "top",
    color: quotationTokens.text,
  },

  tdCenter: { textAlign: "center" },
  tdRight: { textAlign: "right" },

  footerNote: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginTop: 10,
    fontSize: 11.5,
    color: quotationTokens.text,
    textAlign: "center",
  },
};

function ShowCustomerInvoiceQuotation() {
  const { quotationId } = useParams();
  const navigate = useNavigate();

  const [quotationData, setQuotationData] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);

  const invoiceRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const res = await api.get(`/api/quotations/${quotationId}`);
        if (res.data.success) {
          setQuotationData(res.data.quotation);
          setCustomerData(res.data.quotation.customerId);
        } else {
          toast.error(res.data.error || "Failed to load quotation");
          navigate("/quotation");
        }
      } catch (err) {
        console.error("Error fetching quotation:", err);
        // toast.error("Failed to load quotation");
        toast.error(err?.response?.data?.message || "Failed to load quotation");
        navigate("/quotation");
      } finally {
        setLoading(false);
      }
    };
    fetchQuotation();
  }, [quotationId, navigate]);

  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      setCompanyData(res.data.data);
    } catch (error) {
      // console.error("Error fetching company profile:", error);
      toast.error(error?.response?.data?.message || "Failed to load company profile");
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      setBanks(res.data.data);
    } catch (error) {
      // console.error("Error fetching bank details:", error);
      toast.error(error?.response?.data?.message || "Failed to load bank details");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
    } catch (error) {
      // console.error("Error fetching notes & terms settings:", error);
      toast.error(error?.response?.data?.message || "Failed to load notes & terms settings");
    }
  };

  const fetchSignature = async () => {
    try {
      const res = await api.get("/api/print-templates/all");
      setTemplate(res.data.data);
    } catch (error) {
      // console.error("Error fetching template settings:", error);
      toast.error(error?.response?.data?.message || "Failed to load template settings");
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchSettings();
    fetchSignature();
    fetchBanks();
  }, []);

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);

    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = await import("html2canvas");

      const element = invoiceRef.current;

      const canvas = await html2canvas.default(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        windowWidth: 595, // Match the component's fixed width
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;

      // Calculate image height in mm
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Multi-page logic
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      pdf.save(`quotation-${quotationData?.quotationNo || "quotation"}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      // toast.error("Failed to generate PDF");
      toast.error(error?.response?.data?.message || "Failed to generate PDF");
    } finally {
      setIsDownloading(false);
    }

  };

  if (loading) return <div>Loading quotation...</div>;
  if (!quotationData) return <div>Quotation not found</div>;

  const customer = quotationData.customerId ? {
    name: quotationData.customerId.name,
  address: (() => {
    const addr = quotationData.customerId;
    const parts = [];
    
    // First, check if there's a direct address field (this should be the street address)
    if (addr.address) {
      // If address is a string, add it directly
      if (typeof addr.address === 'string') {
        parts.push(addr.address);
      } 
      // If address is an object with addressLine
      else if (typeof addr.address === 'object' && addr.address.addressLine) {
        parts.push(addr.address.addressLine);
      }
    }
    
    // Also check for addressLine directly on the customer object
    if (addr.addressLine && !parts.includes(addr.addressLine)) {
      parts.push(addr.addressLine);
    }
    
    // Add city
    if (addr.city) parts.push(addr.city);
    
    // Add state
    if (addr.state) parts.push(addr.state);
    
    // Add country
    if (addr.country) parts.push(addr.country);
    
    // Add pincode LAST (without any prefix)
    if (addr.pincode) parts.push(addr.pincode);
    
    return parts.length > 0 ? parts.join(", ") : "No address provided";
  })(),
    phone: quotationData.customerId.phone,
    email: quotationData.customerId.email,
    gstin: quotationData.customerId.gstin
  } : {};
  const products = quotationData.items || [];

  const totalInWords =
    quotationData.grandTotal != null
      ? `${toWords(quotationData.grandTotal).toUpperCase()} RUPEES ONLY`
      : "";

  return (
    <div className="px-4 py-4" style={{ height: "100vh" }}>
      <div style={{ height: "calc(100vh - 70px)", overflow: "auto" }}>
        {/* back button */}
        <Link to="/quotation" style={{ textDecoration: "none" }}>
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
            <IoIosArrowBack
              style={{ color: "#6C748C", fontSize: "18px" }}
            />
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
          {/* Left Panel: Quotation Preview */}
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
            {/* heading */}
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
                Quotation
              </p>
            </div>

            <QuotationContent
              ref={invoiceRef}
              quotation={quotationData}
              customer={customerData}
              companyData={companyData}
              banks={banks}
              terms={terms}
              template={template}
            />
          </div>

          {/* Right Panel: Actions */}
          <div
            style={{
              width: "100%",
              height: "auto",
            }}
          >
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
                  alignSelf: "stretch",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  display: "flex",
                  width: "100%",
                }}
              >
                {/* Print Section */}
                <div
                  style={{
                    flex: "1 1 0",
                    padding: 16,
                    background: "var(--White-Universal-White, white)",
                    boxShadow:
                      "-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset",
                    borderRadius: 14.49,
                    outline: "0.91px var(--White-Stroke, #EAEAEA) solid",
                    outlineOffset: "-0.91px",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 16,
                    display: "inline-flex",
                    width: "50%",
                  }}
                >
                  <div
                    style={{
                      alignSelf: "stretch",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 8,
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        alignSelf: "stretch",
                        color: "var(--Black-Black, #0E101A)",
                        fontSize: 16,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        wordWrap: "break-word",
                      }}
                    >
                      Print
                    </div>
                    <div
                      style={{
                        alignSelf: "stretch",
                        height: 0.91,
                        background: "var(--White-Stroke, #EAEAEA)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      alignSelf: "stretch",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 24,
                      display: "inline-flex",
                      flexWrap: "wrap",
                      alignContent: "center",
                    }}
                  >
                    <div
                      data-property-1="Pdf"
                      data-selected="False"
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: "var(--White-Universal-White, white)",
                        borderRadius: 8,
                        outline: isDownloading ? '1px var(--White-Stroke, #1F7FFF) solid' : '1px var(--White-Stroke, #EAEAEA) solid',
                        outlineOffset: "-1px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                        cursor: "pointer",
                      }}
                      onClick={handleDownloadPDF}
                    >
                      <div
                        data-property-1="Download"
                        style={{
                          width: 20,
                          height: 20,
                          position: "relative",
                          overflow: "hidden",
                          color: "#1F7FFF",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <RiFileDownloadLine />
                      </div>
                      <div
                        style={{
                          width: 114,
                          height: 19,
                          color: "black",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "400",
                          wordWrap: "break-word",
                        }}
                      >
                        {isDownloading ? "Downloading..." : "Download PDF"}
                      </div>
                    </div>
                    <div
                      data-property-1="Thermal print"
                      data-selected="False"
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: "var(--White-Universal-White, white)",
                        borderRadius: 8,
                        outline: "1px var(--White-Stroke, #EAEAEA) solid",
                        outlineOffset: "-1px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        data-property-1="Download"
                        style={{
                          width: 20,
                          height: 20,
                          position: "relative",
                          overflow: "hidden",
                          color: "#1F7FFF",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PiNewspaperClipping />
                      </div>
                      <div
                        style={{
                          width: 114,
                          height: 19,
                          color: "black",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "400",
                          wordWrap: "break-word",
                        }}
                      >
                        Thermal Print
                      </div>
                    </div>
                    <div
                      data-property-1="Normsal priont"
                      data-selected="False"
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: "var(--White-Universal-White, white)",
                        borderRadius: 8,
                        outline: "1px var(--White-Stroke, #EAEAEA) solid",
                        outlineOffset: "-1px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        data-property-1="Download"
                        style={{
                          width: 20,
                          height: 20,
                          position: "relative",
                          overflow: "hidden",
                          color: "#1F7FFF",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <ImPrinter />
                      </div>
                      <div
                        style={{
                          width: 114,
                          height: 19,
                          color: "black",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "400",
                          wordWrap: "break-word",
                        }}
                      >
                        Normal Print
                      </div>
                    </div>
                  </div>
                </div>

                {/* Send Section */}
                <div
                  style={{
                    flex: "1 1 0",
                    padding: 16,
                    background: "var(--White-Universal-White, white)",
                    boxShadow:
                      "-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset",
                    borderRadius: 14.49,
                    outline: "0.91px var(--White-Stroke, #EAEAEA) solid",
                    outlineOffset: "-0.91px",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    gap: 16,
                    display: "inline-flex",
                    width: "50%",
                  }}
                >
                  <div
                    style={{
                      alignSelf: "stretch",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 8,
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        alignSelf: "stretch",
                        color: "var(--Black-Black, #0E101A)",
                        fontSize: 16,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        wordWrap: "break-word",
                      }}
                    >
                      Send
                    </div>
                    <div
                      style={{
                        alignSelf: "stretch",
                        height: 0.91,
                        background: "var(--White-Stroke, #EAEAEA)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      alignSelf: "stretch",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 24,
                      display: "inline-flex",
                      flexWrap: "wrap",
                      alignContent: "center",
                    }}
                  >
                    <div
                      data-property-1="Message"
                      data-selected="False"
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: "var(--White-Universal-White, white)",
                        borderRadius: 8,
                        outline: "1px var(--White-Stroke, #EAEAEA) solid",
                        outlineOffset: "-1px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        data-property-1="Download"
                        style={{
                          width: 20,
                          height: 20,
                          position: "relative",
                          overflow: "hidden",
                          color: "#1F7FFF",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <RiMessage2Fill />
                      </div>
                      <div
                        style={{
                          width: 114,
                          height: 19,
                          color: "black",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "400",
                          wordWrap: "break-word",
                        }}
                      >
                        Message
                      </div>
                    </div>
                    <div
                      data-property-1="Whatsapp"
                      data-selected="False"
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: "var(--White-Universal-White, white)",
                        borderRadius: 8,
                        outline: "1px var(--White-Stroke, #EAEAEA) solid",
                        outlineOffset: "-1px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        data-property-1="Download"
                        style={{
                          width: 20,
                          height: 20,
                          position: "relative",
                          overflow: "hidden",
                          color: "#25D366",
                          fontSize: "20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <RiWhatsappFill />
                      </div>
                      <div
                        style={{
                          width: 114,
                          height: 19,
                          color: "black",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "400",
                          wordWrap: "break-word",
                        }}
                      >
                        WhatsApp
                      </div>
                    </div>
                    <div
                      data-property-1="Mail"
                      data-selected="False"
                      style={{
                        height: 42,
                        paddingLeft: 16,
                        paddingRight: 16,
                        background: "var(--White-Universal-White, white)",
                        borderRadius: 8,
                        outline: "1px var(--White-Stroke, #EAEAEA) solid",
                        outlineOffset: "-1px",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        data-property-1="Gmail"
                        style={{
                          width: 20,
                          height: 15,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: 4.54,
                            height: 11.08,
                            left: 0,
                            top: 3.85,
                            position: "absolute",
                            background: "#4285F4",
                          }}
                        />
                        <div
                          style={{
                            width: 4.54,
                            height: 11.08,
                            left: 15.45,
                            top: 3.85,
                            position: "absolute",
                            background: "#34A853",
                          }}
                        />
                        <div
                          style={{
                            width: 11.6,
                            height: 6,
                            left: 4.22,
                            top: 3,
                            position: "absolute",
                            background: "#EA4335",
                          }}
                        />
                        <div
                          style={{
                            width: 4,
                            height: 6,
                            left: 8,
                            top: 6,
                            position: "absolute",
                            background: "#EA4335",
                          }}
                        />
                        <div
                          style={{
                            width: 4.54,
                            height: 7.24,
                            left: 15.45,
                            top: 0,
                            position: "absolute",
                            background: "#FBBC04",
                          }}
                        />
                        <div
                          style={{
                            width: 4.54,
                            height: 7.24,
                            left: 0,
                            top: 0,
                            position: "absolute",
                            background: "#C5221F",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: 114,
                          height: 19,
                          color: "black",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "400",
                          wordWrap: "break-word",
                        }}
                      >
                        Mail
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* invoice format */}
              <div
                style={{
                  width: '100%',
                  paddingTop: 24,
                  paddingBottom: 24,
                  paddingLeft: 24,
                  paddingRight: 43.48,
                  background: 'var(--White-Universal-White, white)',
                  boxShadow: '-0.9059333801269531px -0.9059333801269531px 0.8153400421142578px rgba(0, 0, 0, 0.10) inset',
                  borderRadius: 14.49,
                  outline: '0.91px var(--White-Stroke, #EAEAEA) solid',
                  outlineOffset: '-0.91px',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                  gap: 16,
                  display: 'flex',
                  height: 'auto',
                }}
              >
                <div
                  style={{
                    alignSelf: 'stretch',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: 8,
                    display: 'flex'
                  }}
                >
                  <div
                    style={{
                      alignSelf: 'stretch',
                      color: 'var(--Black-Black, #0E101A)',
                      fontSize: 19.93,
                      fontFamily: 'Poppins',
                      fontWeight: '500',
                      wordWrap: 'break-word'
                    }}
                  >
                    Invoice Format
                  </div>
                  <div
                    style={{
                      alignSelf: 'stretch',
                      height: 0.91,
                      background: 'var(--White-Stroke, #EAEAEA)'
                    }}
                  />
                </div>
                <div
                  style={{
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    gap: 24,
                    display: 'inline-flex'
                  }}
                >
                  <Link
                    // to='/m/thermaltemplate'
                    style={{
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'var(--White-Universal-White, white)',
                      borderRadius: 8,
                      outline: '2px var(--Blue-Blue, #1F7FFF) solid',
                      outlineOffset: '-2px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      display: 'flex',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }}
                  >
                    <div
                      data-property-1="Download"
                      style={{
                        width: 20,
                        height: 20,
                        position: 'relative',
                        overflow: 'hidden',
                        color: '#1F7FFF',
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PiNewspaperClipping />
                    </div>
                    <div
                      style={{
                        width: 114,
                        height: 19,
                        color: 'black',
                        fontSize: 14,
                        fontFamily: 'Inter',
                        fontWeight: '400',
                        wordWrap: 'break-word'
                      }}
                    >
                      Thermal Print
                    </div>
                  </Link>
                  <div
                    style={{
                      paddingLeft: 16,
                      paddingRight: 16,
                      paddingTop: 8,
                      paddingBottom: 8,
                      background: 'var(--White-Universal-White, white)',
                      borderRadius: 8,
                      outline: '1px var(--White-Stroke, #EAEAEA) solid',
                      outlineOffset: '-1px',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      display: 'flex',
                      cursor: 'pointer'
                    }}
                  >
                    <div
                      data-property-1="Download"
                      style={{
                        width: 20,
                        height: 20,
                        position: 'relative',
                        overflow: 'hidden',
                        color: '#1F7FFF',
                        fontSize: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ImPrinter />
                    </div>
                    <div
                      style={{
                        width: 114,
                        height: 19,
                        color: 'black',
                        fontSize: 14,
                        fontFamily: 'Inter',
                        fontWeight: '400',
                        wordWrap: 'break-word'
                      }}
                    >
                      Normal Print
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 410,
                    position: 'relative',
                  }}
                >
                  <Link
                    // to="/m/invoicetemplate2"
                    style={{
                      width: '32%',
                      maxWidth: 280,
                      height: 409,
                      left: 0,
                      top: 1.28,
                      position: 'absolute',
                      background: 'var(--White-Stroke, #EAEAEA)',
                      overflow: 'hidden',
                      borderRadius: 6.04,
                      outline: '2px var(--Blue-Blue, #1F7FFF) solid',
                      outlineOffset: '-1.51px',
                      cursor: 'pointer',
                      color: 'black',
                    }}
                  >
                    <div
                      style={{
                        width: 245,
                        height: 390,
                        left: 7,
                        top: 10,
                        position: 'absolute',
                        backgroundColor: 'white',
                      }}
                    >
                      <div style={{ width: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 10px' }}>
                        <div style={{ marginTop: '5px', fontWeight: '500', fontSize: '12px' }}>Shop Name</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', color: '#727681' }}>Address and contact no.</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', }}>*** INVOICE ***</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                          <span>Invoice No.: 1822</span>
                        </div>
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                          <span>Payment Mode: CASH</span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: 0.76,
                            left: 31.77,
                            marginTop: '1px',
                            background: 'var(--White-Stroke, #EAEAEA)'
                          }}
                        />
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                          <div>Customer Name</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Alok Ranjan</span>
                            <span>9876543210</span>
                          </div>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: 0.76,
                            left: 31.77,
                            marginTop: '1px',
                            background: 'var(--White-Stroke, #EAEAEA)'
                          }}
                        />
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Counter - #1</span>
                            <span>03/02/2025 09:45 am</span>
                          </div>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            borderTop: '1px dashed #EAEAEA', // dashed line
                            marginTop: '1px',
                          }}
                        />
                        <div style={{ fontSize: '10px', width: '100%' }}>
                          <table style={{ fontSize: '10px', width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>QTY</th>
                                <th style={{ textAlign: 'right' }}>COST</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                            </tbody>
                          </table>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <table style={{ fontSize: '10px', width: '100%' }}>
                            <tbody>
                              <tr>
                                <td>Subtotal</td>
                                <td>04</td>
                                <td style={{ textAlign: 'right' }}>₹7,740.8</td>
                              </tr>
                              <tr>
                                <td>Discount</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>- ₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>CGST @ 18%</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>SGST @ 18%</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                              </tr>
                            </tbody>
                          </table>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>🪙 Shopping Points</span>
                              <span>- ₹1,935.2</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Additional Charges</span>
                              <span>- ₹1,935.2</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Total</span>
                              <span>₹1,935.2</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Due</span>
                              <span>Nil</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              color: 'var(--Black-Black, #0E101A)',
                              fontSize: 8,
                              fontFamily: 'Poppins',
                              fontStyle: 'italic',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                              marginTop: '10px',
                            }}
                          >
                            Congratulations! You’ve earned 🪙 50 shopping points 🎉
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 3.02,
                        left: 2.26,
                        top: 3.09,
                        position: 'absolute',
                        background: 'rgba(255, 255, 255, 0.78)',
                        borderRadius: 3.02,
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6.04,
                        display: 'inline-flex'
                      }}
                    >
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'var(--Black-Black, #0E101A)',
                          fontSize: 10.51,
                          fontFamily: 'Poppins',
                          fontStyle: 'italic',
                          fontWeight: '500',
                          wordWrap: 'break-word'
                        }}
                      >
                        #1 Default Template
                      </div>
                    </div>
                  </Link>
                  <Link
                    // to="/m/invoicetemplate2"
                    style={{
                      width: '32%',
                      maxWidth: 280,
                      height: 409,
                      left: '34.5%',
                      top: 1.28,
                      position: 'absolute',
                      background: 'var(--White-Stroke, #EAEAEA)',
                      overflow: 'hidden',
                      borderRadius: 6.04,
                      outline: '2px var(--Blue-Blue, #1F7FFF) solid',
                      outlineOffset: '-1.51px',
                      cursor: 'pointer',
                      color: 'black',
                    }}
                  >
                    <div
                      style={{
                        width: 245,
                        height: 390,
                        left: 7,
                        top: 10,
                        position: 'absolute',
                        backgroundColor: 'white',
                      }}
                    >
                      <div style={{ width: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 10px' }}>
                        <div style={{ marginTop: '5px', fontWeight: '500', fontSize: '12px' }}>Shop Name</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', color: '#727681' }}>Address and contact no.</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', }}>*** INVOICE ***</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                          <span>Invoice No.: 1822</span>
                        </div>
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                          <span>Payment Mode: CASH</span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: 0.76,
                            left: 31.77,
                            marginTop: '1px',
                            background: 'var(--White-Stroke, #EAEAEA)'
                          }}
                        />
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                          <div>Customer Name</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Alok Ranjan</span>
                            <span>9876543210</span>
                          </div>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: 0.76,
                            left: 31.77,
                            marginTop: '1px',
                            background: 'var(--White-Stroke, #EAEAEA)'
                          }}
                        />
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Counter - #1</span>
                            <span>03/02/2025 09:45 am</span>
                          </div>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            borderTop: '1px dashed #EAEAEA', // dashed line
                            marginTop: '1px',
                          }}
                        />
                        <div style={{ fontSize: '10px', width: '100%' }}>
                          <table style={{ fontSize: '10px', width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>QTY</th>
                                <th style={{ textAlign: 'right' }}>COST</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                            </tbody>
                          </table>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <table style={{ fontSize: '10px', width: '100%' }}>
                            <tbody>
                              <tr>
                                <td>Subtotal</td>
                                <td>04</td>
                                <td style={{ textAlign: 'right' }}>₹7,740.8</td>
                              </tr>
                              <tr>
                                <td>Discount</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>- ₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>CGST @ 18%</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>SGST @ 18%</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                              </tr>
                            </tbody>
                          </table>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>🪙 Shopping Points</span>
                              <span>- ₹1,935.2</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Additional Charges</span>
                              <span>- ₹1,935.2</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Total</span>
                              <span>₹1,935.2</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Due</span>
                              <span>Nil</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              color: 'var(--Black-Black, #0E101A)',
                              fontSize: 8,
                              fontFamily: 'Poppins',
                              fontStyle: 'italic',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                              marginTop: '10px',
                            }}
                          >
                            Congratulations! You’ve earned 🪙 50 shopping points 🎉
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 3.02,
                        left: 2.26,
                        top: 3.09,
                        position: 'absolute',
                        background: 'rgba(255, 255, 255, 0.78)',
                        borderRadius: 3.02,
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6.04,
                        display: 'inline-flex'
                      }}
                    >
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'var(--Black-Black, #0E101A)',
                          fontSize: 10.51,
                          fontFamily: 'Poppins',
                          fontStyle: 'italic',
                          fontWeight: '500',
                          wordWrap: 'break-word'
                        }}
                      >
                        #2 Template
                      </div>
                    </div>
                  </Link>
                  <Link
                    // to="/m/invoicetemplate2"
                    style={{
                      width: '32%',
                      maxWidth: 280,
                      height: 409,
                      left: '69%',
                      top: 1.28,
                      position: 'absolute',
                      background: 'var(--White-Stroke, #EAEAEA)',
                      overflow: 'hidden',
                      borderRadius: 6.04,
                      outline: '2px var(--Blue-Blue, #1F7FFF) solid',
                      outlineOffset: '-1.51px',
                      cursor: 'pointer',
                      color: 'black',
                    }}
                  >
                    <div
                      style={{
                        width: 245,
                        height: 390,
                        left: 7,
                        top: 10,
                        position: 'absolute',
                        backgroundColor: 'white',
                      }}
                    >
                      <div style={{ width: '100%', justifyContent: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0px 10px' }}>
                        <div style={{ marginTop: '5px', fontWeight: '500', fontSize: '12px' }}>Shop Name</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', color: '#727681' }}>Address and contact no.</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', }}>*** INVOICE ***</div>
                        <div style={{ marginTop: '0px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                          <span>Invoice No.: 1822</span>
                        </div>
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', }}>
                          <span>Payment Mode: CASH</span>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: 0.76,
                            left: 31.77,
                            marginTop: '1px',
                            background: 'var(--White-Stroke, #EAEAEA)'
                          }}
                        />
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                          <div>Customer Name</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Alok Ranjan</span>
                            <span>9876543210</span>
                          </div>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: 0.76,
                            left: 31.77,
                            marginTop: '1px',
                            background: 'var(--White-Stroke, #EAEAEA)'
                          }}
                        />
                        <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Counter - #1</span>
                            <span>03/02/2025 09:45 am</span>
                          </div>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            borderTop: '1px dashed #EAEAEA', // dashed line
                            marginTop: '1px',
                          }}
                        />
                        <div style={{ fontSize: '10px', width: '100%' }}>
                          <table style={{ fontSize: '10px', width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th>QTY</th>
                                <th style={{ textAlign: 'right' }}>COST</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>White T-Shirt - Nike</td>
                                <td>01</td>
                                <td style={{ textAlign: 'right' }}>₹1,935.2</td>
                              </tr>
                            </tbody>
                          </table>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <table style={{ fontSize: '10px', width: '100%' }}>
                            <tbody>
                              <tr>
                                <td>Subtotal</td>
                                <td>04</td>
                                <td style={{ textAlign: 'right' }}>₹7,740.8</td>
                              </tr>
                              <tr>
                                <td>Discount</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>- ₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>CGST @ 18%</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                              </tr>
                              <tr>
                                <td>SGST @ 18%</td>
                                <td></td>
                                <td style={{ textAlign: 'right' }}>+ ₹1,935.2</td>
                              </tr>
                            </tbody>
                          </table>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>🪙 Shopping Points</span>
                              <span>- ₹1,935.2</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Additional Charges</span>
                              <span>- ₹1,935.2</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              borderTop: '1px dashed #EAEAEA', // dashed line
                              marginTop: '1px',
                            }}
                          />
                          <div style={{ marginTop: '1px', fontWeight: '500', fontSize: '10px', display: 'flex', justifyContent: 'left', width: '100%', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Total</span>
                              <span>₹1,935.2</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Due</span>
                              <span>Nil</span>
                            </div>
                          </div>
                          <div
                            style={{
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              color: 'var(--Black-Black, #0E101A)',
                              fontSize: 8,
                              fontFamily: 'Poppins',
                              fontStyle: 'italic',
                              fontWeight: '400',
                              wordWrap: 'break-word',
                              marginTop: '10px',
                            }}
                          >
                            Congratulations! You’ve earned 🪙 50 shopping points 🎉
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: 3.02,
                        left: 2.26,
                        top: 3.09,
                        position: 'absolute',
                        background: 'rgba(255, 255, 255, 0.78)',
                        borderRadius: 3.02,
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 6.04,
                        display: 'inline-flex'
                      }}
                    >
                      <div
                        style={{
                          textAlign: 'center',
                          color: 'var(--Black-Black, #0E101A)',
                          fontSize: 10.51,
                          fontFamily: 'Poppins',
                          fontStyle: 'italic',
                          fontWeight: '500',
                          wordWrap: 'break-word'
                        }}
                      >
                        #3 Template
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Done Button */}
              <div
                style={{
                  height: 36,
                  padding: 8,
                  background: 'var(--Blue-Blue, #1F7FFF)',
                  boxShadow: '-1px -1px 4px rgba(0, 0, 0, 0.25) inset',
                  borderRadius: 8,
                  outline: '1.50px var(--Blue-Blue, #1F7FFF) solid',
                  outlineOffset: '-1.50px',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  gap: 4,
                  display: 'inline-flex',
                  cursor: 'pointer',
                  color: 'white',
                }}
              >
                <Link
                  to="/quotation"
                  style={{
                    color: "white",
                    fontSize: 14,
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: 5,
                    wordWrap: "break-word",
                    textDecoration: "none",
                  }}
                >
                  Done
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShowCustomerInvoiceQuotation;


