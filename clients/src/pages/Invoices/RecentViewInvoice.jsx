import React, { useState, useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import "react-datepicker/dist/react-datepicker.css";
import { FiSend, FiEdit } from "react-icons/fi";
import { IoPrintOutline } from "react-icons/io5";
import { TbInvoice } from "react-icons/tb";
import { GoDownload } from "react-icons/go";
import DatePicker from "../../components/DateFilterDropdown";
import RecentViewInvoiceModal from "../../pages/Modal/RecentViewInvoiceModal";
import { Link } from "react-router-dom";
import total_orders_icon from "../../assets/images/totalorders-icon.png";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../pages/config/axiosInstance";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


const iconMap = {
  "Send Invoice": <FiSend size={16} style={{ color: "#6C748C" }} />,
  "Edit Invoice": <FiEdit size={16} style={{ color: "#6C748C" }} />,
  Print: <IoPrintOutline size={16} style={{ color: "#6C748C" }} />,
};

const RecentViewInvoice = ({ type = "purchase" }) => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [zoom, setZoom] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [invoiceData, setInvoiceData] = useState(null);
  const [supplierData, setSupplierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [banks, setBanks] = useState([]);

  const handleBack = () => {
    navigate(location.state?.from || -1);
  }

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);

        if (id && id !== "undefined") {
          console.log(`📡 Fetching ${type} invoice from API with ID:`, id);

          let apiUrl;
          if (type === "purchase") {
            apiUrl = `/api/purchase-orders/${id}`;
          } else if (type === "sales") {
            apiUrl = `/api/invoices/${id}`; // Customer invoices endpoint
          }

          const response = await api.get(apiUrl);
          console.log("✅ API Response:", response.data);

          if (response.data.success && response.data.invoice) {
            const fullInvoice = response.data.invoice;
            console.log("🛒 Invoice items:", fullInvoice.items?.length || 0);

            setInvoiceData(fullInvoice);

            // Handle supplier/customer data based on type
            if (type === "purchase") {
              // For purchase orders, we have supplier
              if (fullInvoice.supplierId) {
                if (typeof fullInvoice.supplierId === 'object') {
                  setSupplierData(fullInvoice.supplierId);
                } else {
                  await fetchSupplier(fullInvoice.supplierId);
                }
              }
            } else if (type === "sales") {
              // For sales invoices, we have customer
              if (fullInvoice.customerId) {
                if (typeof fullInvoice.customerId === 'object') {
                  setCustomerData(fullInvoice.customerId);
                } else {
                  await fetchCustomer(fullInvoice.customerId);
                }
              }
            }
          } else {
            throw new Error("Invalid API response");
          }
        } else {
          console.error("❌ Invalid invoice ID");
          toast.error("Invalid invoice URL");
          navigate(type === "purchase" ? "/supplier-list" : "/customer-list");
        }
      } catch (error) {
        console.error("❌ Error fetching invoice:", error);
        // toast.error("Failed to load invoice details");
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message || 
          error?.message || 
          "Failed to load invoice details"
        );
        navigate(type === "purchase" ? "/supplier-list" : "/customer-list");
      } finally {
        setLoading(false);
      }
    };

    const fetchSupplier = async (supplierId) => {
      try {
        const response = await api.get(`/api/suppliers/${supplierId}`);
        setSupplierData(response.data);
      } catch (error) {
        // console.error("Failed to fetch supplier:", error);
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message || 
          error?.message || 
          "Failed to fetch supplier"
        );
      }
    };

    const fetchCustomer = async (customerId) => {
      try {
        const response = await api.get(`/api/customers/${customerId}`);
        setCustomerData(response.data);
      } catch (error) {
        // console.error("Failed to fetch customer:", error);
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message || 
          error?.message || 
          "Failed to fetch customer"
        );
      }
    };

    fetchInvoiceData();
    fetchBanks();
  }, [id, type, navigate]);

  const fetchBanks = async () => {
  try {
    const res = await api.get("/api/company-bank/list");
    setBanks(res.data.data);
  } catch (error) {
    console.error("Error fetching bank details:", error);
    toast.error(error?.response?.data?.displayMessage ||
      error?.response?.data?.message || 
      error?.message || 
      "Failed to fetch bank details"
    );
  }
};

  // Function to handle Send Invoice
  const handleSendInvoice = async () => {
    if (!invoiceData) {
      toast.error("Invoice data not available");
      return;
    }

    setIsSending(true);
    try {
      // Determine recipient based on invoice type
      let recipientEmail, recipientPhone, recipientName;

      if (type === "purchase") {
        // For purchase invoice, send to supplier
        recipientEmail = supplierData?.email || supplierData?.supplier?.email || supplierData?.supplierId?.email;
        recipientPhone = supplierData?.phone || supplierData?.supplier?.phone || supplierData?.supplierId?.phone;
        recipientName = supplierData?.supplierName || supplierData?.supplier?.supplierName || supplierData?.supplierId?.supplierName;
      } else {
        // For sales invoice, send to customer
        recipientEmail = invoiceData.customerId?.email || customerData?.email;
        recipientPhone = invoiceData.customerId?.phone || customerData?.phone;
        recipientName = invoiceData.customerId?.name || customerData?.name;
      }

      console.log("📱 Contact details:", {
        email: recipientEmail,
        phone: recipientPhone,
        name: recipientName,
        type
      });

      // Check if we have at least one contact method
      if (!recipientEmail && !recipientPhone) {
        toast.error(`No contact information found for this ${type === "purchase" ? "supplier" : "customer"}`);
        setIsSending(false);
        return;
      }

      // Show options dialog
      if (recipientEmail && recipientPhone) {
        // Both email and phone available - show choice
        const choice = window.confirm(
          `Send ${type === "purchase" ? "Purchase" : "Sales"} Invoice to ${recipientName || "recipient"}?\n\n` +
          `Email: ${recipientEmail}\n` +
          `Phone: ${recipientPhone}\n\n` +
          `Click OK for Email\n` +
          `Click Cancel for WhatsApp`
        );

        if (choice) {
          await sendViaEmail(recipientEmail);
        } else {
          await sendViaWhatsApp(recipientPhone, recipientName);
        }
      } else if (recipientEmail) {
        // Only email available
        const confirmSend = window.confirm(
          `Send ${type === "purchase" ? "Purchase" : "Sales"} Invoice via email to:\n${recipientEmail}`
        );
        if (confirmSend) {
          await sendViaEmail(recipientEmail);
        }
      } else if (recipientPhone) {
        // Only phone available
        const confirmSend = window.confirm(
          `Send ${type === "purchase" ? "Purchase" : "Sales"} Invoice via WhatsApp to:\n${recipientPhone}`
        );
        if (confirmSend) {
          await sendViaWhatsApp(recipientPhone, recipientName);
        }
      }

    } catch (error) {
      console.error("❌ Error sending invoice:", error);
      // toast.error("Failed to send invoice: " + error.message);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message || 
        error?.message || 
        "Failed to send invoice"
      );
    } finally {
      setIsSending(false);
    }
  };

  // Function to send via Email
  const sendViaEmail = async (email) => {
    try {
      console.log("📧 Sending email to:", email);

      const response = await api.post('/api/invoices/send-email', {
        invoiceId: id,
        toEmail: email,
        type: type, // Add type parameter
        subject: `${type === "purchase" ? 'Purchase' : 'Sales'} Invoice - ${invoiceData.invoiceNo}`
      });

      console.log("📧 Email response:", response.data);

      if (response.data.success) {
        toast.success(`✅ Invoice sent via email to ${email}`);

        // Update local invoice status if needed
        if (invoiceData) {
          setInvoiceData(prev => ({
            ...prev,
            status: 'sent'
          }));
        }
      } else {
        toast.error(`❌ ${response.data.message || "Failed to send email"}`);
      }

    } catch (error) {
      // console.error("❌ Error sending email:", error);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message || 
        error?.message || 
        "Failed to send email"
      );

      // Check if it's a network error or server error
      if (error.response) {
        // Server responded with error
        toast.error(`Server error: ${error.response.data?.message || error.response.statusText}`);
      } else if (error.request) {
        // No response received
        toast.error("No response from server. Please check your connection.");
      } else {
        // Something else
        toast.error("Failed to send email: " + error.message);
      }
    }
  };

  // Function to send via WhatsApp
  const sendViaWhatsApp = async (phone, name = "") => {
    try {
      console.log("📱 Sending WhatsApp to phone:", phone);

      // Format phone number for WhatsApp
      const cleanPhone = formatPhoneForWhatsApp(phone);

      if (!cleanPhone) {
        toast.error("❌ Invalid phone number format");
        return;
      }

      console.log("📱 Formatted phone:", cleanPhone);

      // Create message
      const message = createWhatsAppMessage(name);

      // Encode message for WhatsApp URL
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      console.log("📱 WhatsApp URL:", whatsappUrl);

      // Test the URL first
      const testUrl = `https://wa.me/${cleanPhone}`;
      console.log("📱 Test URL:", testUrl);

      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      toast.success(`💬 Opening WhatsApp for ${name || "customer"}...`);

    } catch (error) {
      // console.error("❌ Error sending via WhatsApp:", error);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message || 
        error?.message || 
        "Failed to open WhatsApp"
      );
    }
  };

  // Helper function to format phone number for WhatsApp - FIXED VERSION
  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return null;

    console.log("📱 Original phone:", phone);

    // Remove all non-digit characters except plus
    let cleanPhone = phone.replace(/[^\d+]/g, '');

    console.log("📱 After removing non-digits:", cleanPhone);

    // If phone starts with '+', keep it
    if (cleanPhone.startsWith('+')) {
      // Remove the + and continue processing
      cleanPhone = cleanPhone.substring(1);
    }

    // If phone starts with '0', remove it (for Indian numbers)
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }

    console.log("📱 After removing leading 0:", cleanPhone);

    // Check if it's a valid length
    if (cleanPhone.length < 10) {
      console.error("❌ Phone number too short:", cleanPhone);
      return null;
    }

    // If phone is 10 digits, assume India (+91)
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    // WhatsApp requires country code without +
    console.log("📱 Final formatted phone:", cleanPhone);
    return cleanPhone;
  };

  // Helper function to create WhatsApp message
  const createWhatsAppMessage = (name = "") => {
    const date = invoiceData.invoiceDate
      ? new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      : 'N/A';

    const greeting = name ? `Hi ${name}!` : "Hello!";

    return `${greeting}

Here is your ${type === "purchase" ? 'purchase' : 'sales'} invoice details:

*Invoice No:* ${invoiceData.invoiceNo || 'N/A'}
*Date:* ${date}
*Total Amount:* ₹${invoiceData.grandTotal?.toFixed(2) || '0.00'}
*Due Amount:* ₹${invoiceData.dueAmount?.toFixed(2) || '0.00'}
*Status:* ${invoiceData.status?.toUpperCase() || 'PENDING'}

You can view the complete invoice here:
${window.location.origin}/invoices/${id}

Thank you for your business!`;
  };

  // Function to handle Edit Invoice
  const handleEditInvoice = () => {
    if (!invoiceData) {
      toast.error("Invoice data not available");
      return;
    }

    if (type === "purchase") {
      navigate(`/edit-purchase-invoice/${id}`, {
        state: { invoiceData: invoiceData }
      });
    } else {
      navigate(`/edit-sales-invoice/${id}`, {
        state: { invoiceData: invoiceData }
      });
    }
  };

  // Function to handle Print
  const handlePrint = () => {
    setIsPrinting(true);

    try {
      // Find the invoice modal container
      const invoiceModal = document.querySelector('.recent-view-invoice-modal');

      if (!invoiceModal) {
        toast.error("Invoice content not available for printing");
        setIsPrinting(false);
        return;
      }

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Invoice - ${invoiceData?.invoiceNo}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
            }
            @media print {
              body {
                padding: 0;
              }
              @page {
                margin: 0;
              }
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          ${invoiceModal.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();

      toast.success("🖨️ Opening print dialog...");

    } catch (error) {
      console.error("❌ Error printing invoice:", error);
      // toast.error("Failed to print invoice");
      toast.error(error?.message || "Failed to print invoice");
    } finally {
      setIsPrinting(false);
    }
  };

  // Function to handle Download PDF
  const handleDownloadPDF = async () => {
    try {
      const invoiceModal = document.querySelector('.recent-view-invoice-modal');
      if (!invoiceModal) {
        toast.error("Invoice content not available");
        return;
      }

      const canvas = await html2canvas(invoiceModal, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const fileName = `${type === "purchase" ? 'purchase' : 'sales'}-invoice-${invoiceData?.invoiceNo || "invoice"}.pdf`;
      pdf.save(fileName);

      toast.success("✅ PDF downloaded successfully!");

    } catch (error) {
      console.error("❌ Error downloading PDF:", error);
      // toast.error("Failed to download PDF");
      toast.error(error?.message || "Failed to download PDF");
    }
  };

  // Get status color based on type
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'received':
        return { bg: "#D4F7C7", text: "#01774B" };
      case 'pending':
      case 'draft':
      case 'sent':
        return { bg: "#FFFAC7", text: "#7E7000" };
      case 'overdue':
        return { bg: "#FFE7E7", text: "#DC2626" };
      case 'partial':
        return { bg: "#E0F2FE", text: "#0369A1" };
      default:
        return { bg: "#F3F4F6", text: "#6B7280" };
    }
  };

  // Get status text based on type
  const getStatusText = (status) => {
    if (type === "purchase") {
      return status === 'received' ? 'Received' :
        status === 'draft' ? 'Draft' :
          status === 'partial' ? 'Partial' :
            status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
    } else {
      return status === 'paid' ? 'Paid' :
        status === 'draft' ? 'Draft' :
          status === 'sent' ? 'Sent' :
            status === 'partial' ? 'Partial' :
              status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
    }
  };

  // Get breadcrumb navigation based on type
  const getBreadcrumb = () => {
    if (type === "purchase") {
      return {
        backLink: "/supplier-list",
        backText: "Total Orders",
        currentText: invoiceData?.invoiceNo || `PO-${invoiceData?._id?.slice(-6)}`
      };
    } else {
      return {
        backLink: "/customers",
        backText: "Sales Invoice",
        currentText: invoiceData?.invoiceNo || `INV-${invoiceData?._id?.slice(-6)}`
      };
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        fontFamily: "Inter, sans-serif"
      }}>
        Loading invoice details...
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        fontFamily: "Inter, sans-serif"
      }}>
        Invoice not found.
      </div>
    );
  }

  const statusColors = getStatusColor(invoiceData.status);
  const statusText = getStatusText(invoiceData.status);
  const breadcrumb = getBreadcrumb();

  return (
    <div className="p-4" style={{ overflow: "auto", height: "100vh" }}>
      <div
        style={{
          fontFamily: "Inter, sans-serif",
          background: "#F9F9F9",
        }}
      >
        {/* Main Container */}
        <div
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          {/* Breadcrumb */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#727681",
              fontSize: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* <Link to={breadcrumb.backLink}> */}
                <span
                onClick={handleBack}
                  style={{
                    backgroundColor: "white",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    border: "1px solid #FCFCFC",
                    cursor:"pointer"
                  }}
                >
                  <img src={total_orders_icon} alt="total_orders_icon" />
                </span>
              {/* </Link> */}
              <Link style={{textDecoration:"none"}} to="/dashboard">
              <span
                style={{
                  color: "#727681",
                  fontWeight: 400,
                  fontSize: "14px",
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                Dashboard
              </span>
              </Link>
              <span
                style={{
                  color: "#727681",
                  fontWeight: 400,
                  fontSize: "14px",
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                /
              </span>
              <Link style={{textDecoration:"none"}} to="/invoice">
              <span
                style={{
                  color: "#727681",
                  fontWeight: 400,
                  fontSize: "14px",
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {breadcrumb.backText}
              </span>
              </Link>
              <span
                style={{
                  color: "#727681",
                  fontWeight: 400,
                  fontSize: "14px",
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                /
              </span>
              <span
                style={{
                  color: "#0E101A",
                  fontWeight: 400,
                  fontSize: "14px",
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {breadcrumb.currentText}
              </span>
            </div>
          </div>

          {/* Header Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: "500",
                  color: "#0E101A",
                  fontFamily: '"Inter", sans-serif',
                }}
              >
                {invoiceData.invoiceNo || (type === "purchase" ? `Purchase Order ${invoiceData._id?.slice(-6)}` : `Sales Invoice ${invoiceData._id?.slice(-6)}`)}

              </h1>

              {/* Date Picker (mock) */}
              {/* <div className="d-flex align-items-center gap-4">
                <DatePicker />
              </div> */}
            </div>

            {/* Status + Action Buttons */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", gap: "12px" }}>
                <span
                  style={{
                    padding: "0px 12px",
                    background: statusColors.bg,
                    color: statusColors.text,
                    borderRadius: "50px",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: invoiceData.status === 'received' || invoiceData.status === 'paid' ? "500" : "400",
                  }}
                >
                  {(invoiceData.status === 'received' || invoiceData.status === 'paid') ? (
                    <>
                      <FaCheck style={{ fontSize: "10px", fontWeight: 300 }} />
                      {statusText}
                    </>
                  ) : (
                    <>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          background: statusColors.text,
                          borderRadius: "50%",
                        }}
                      />
                      {statusText}
                    </>
                  )}
                </span>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                {/* Send Invoice Button */}
                <button
                  onClick={handleSendInvoice}
                  disabled={isSending}
                  style={{
                    padding: "4px 12px",
                    background: "white",
                    border: "1px solid #FCFCFC",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#0E101A",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: isSending ? "not-allowed" : "pointer",
                    opacity: isSending ? 0.7 : 1,
                  }}
                >
                  {isSending ? "Sending..." : "Send Invoice"}
                  {iconMap["Send Invoice"]}
                </button>

                {/* Edit Invoice Button */}
                {/* <button
                  onClick={handleEditInvoice}
                  style={{
                    padding: "4px 12px",
                    background: "white",
                    border: "1px solid #FCFCFC",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#0E101A",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  Edit Invoice
                  {iconMap["Edit Invoice"]}
                </button> */}

                {/* Print Button */}
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: "4px 12px",
                    background: "white",
                    border: "1px solid #FCFCFC",
                    borderRadius: "8px",
                    fontSize: "14px",
                    color: "#0E101A",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                  }}
                >
                  Print PDF
                  {iconMap["Print"]}
                </button>
              </div>
            </div>
            <hr
              style={{
                border: "none",
                height: "1px",
                background: "#D9D9D9",
                margin: 0,
              }}
            />
          </div>

          {/* Main Content: Invoice Card + Notes */}
          <div style={{ display: "flex", gap: "20px", alignItems:"flex-start" }}>
            {/* LEFT — Original Invoice */}
            <div
              className="recent-view-invoice"
              style={{
                border: "1px solid #EAEAEA",
                position: "relative",
                width:"540px",
                height:"70vh",
                cursor: zoom ? "zoom-in" : "default",
              }}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => {
                setZoom(false);
                setMousePos({ x: 0, y: 0 });
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({
                  x: (e.clientX - rect.left) / rect.width,
                  y: (e.clientY - rect.top) / rect.height,
                });
              }}
            >
              <div className="recent-view-invoice-modal">
                <RecentViewInvoiceModal
                  invoiceData={invoiceData}
                  supplierData={supplierData}
                  customerData={customerData}
                  type={type}
                  banks={banks}
                />
              </div>
            </div>

            {/* RIGHT — Zoomed Preview */}
            <div
              style={{
                border: "1px solid #EAEAEA",
                background: "#fff",
                position: "relative",
                width:"1200px",
                height:"72vh",
                overflowY:"scroll",
                overflowX:"auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Clip Zoom Area */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                }}
              >
                {/* Zoomable Content */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    transform: zoom
                      ? `scale(2.1) translate(${-(mousePos.x * 50)}%, ${-(mousePos.y * 50)}%)`
                      : "scale(2) translate(0, 0)",
                    transformOrigin: "top left",
                    transition: zoom ? "transform 0.05s" : "transform 0.3s ease-out",
                    pointerEvents: "none",
                  }}
                >
                  <RecentViewInvoiceModal
                    invoiceData={invoiceData}
                    supplierData={supplierData}
                    customerData={customerData}
                    type={type}
                    banks={banks}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentViewInvoice;