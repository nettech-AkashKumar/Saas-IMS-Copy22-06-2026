import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FaMoneyBillWave, FaCalendarAlt, FaQrcode } from "react-icons/fa";
import { format } from "date-fns";
import QRCode from "qrcode";
import api from "../../../../pages/config/axiosInstance";

const PurchasePaymentModal = ({ 
  isOpen, 
  onClose, 
  purchaseOrder,
  onSave,
  existingPayments = [] 
}) => {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [remainingDue, setRemainingDue] = useState(0);
  
  // UPI QR Code states - Same as POS implementation
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [companyData, setCompanyData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);

  // Fetch company details - Similar to POS but using bank endpoint
  const fetchCompanyDetails = async () => {
    try {
      // Try to get UPI ID from bank details first (like POS)
      const bankRes = await api.get("/api/company-bank/list");
      const banks = bankRes.data.data || [];
      const defaultBank = banks.find(bank => bank.isDefault);
      
      if (defaultBank?.upiId) {
        setCompanyData({
          upiId: defaultBank.upiId,
          companyName: defaultBank.accountHolderName || "Business"
        });
        return;
      }
      
      // Fallback to company profile
      const profileRes = await api.get("/api/companyprofile/get");
      const profile = profileRes.data.data;
      if (profile) {
        setCompanyData({
          upiId: profile.upiId || "",
          companyName: profile.companyName || "Business"
        });
      }
    } catch (error) {
      console.error("Failed to fetch company data:", error);
      // Don't show error toast to user, just log
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCompanyDetails();
    }
  }, [isOpen]);

  // Generate UPI QR code when payment method is UPI and amount is set
  useEffect(() => {
    if (paymentMethod === "upi" && companyData?.upiId && paymentAmount && parseFloat(paymentAmount) > 0) {
      generateUPIQRCode();
    } else {
      setQrCodeUrl("");
    }
  }, [paymentMethod, paymentAmount, companyData]);

  useEffect(() => {
    if (purchaseOrder) {
      const due = (purchaseOrder.grandTotal || 0) - (purchaseOrder.paidAmount || 0);
      setRemainingDue(Math.max(0, due));
    }
  }, [purchaseOrder]);

  const generateUPIQRCode = async () => {
    if (!companyData?.upiId || !paymentAmount || parseFloat(paymentAmount) <= 0) return;
    
    setLoadingQR(true);
    try {
      const upiString = `upi://pay?pa=${companyData.upiId}&pn=${encodeURIComponent(companyData.companyName || "Business")}&am=${parseFloat(paymentAmount).toFixed(2)}&cu=INR`;
      
      const qrDataUrl = await QRCode.toDataURL(upiString, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff"
        }
      });
      
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleAmountChange = (e) => {
    let value = e.target.value;
    value = value.replace(/[^\d.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) {
      value = parts[0] + "." + parts.slice(1).join("");
    }
    if (parts[1] && parts[1].length > 2) {
      value = parts[0] + "." + parts[1].substring(0, 2);
    }
    
    const numValue = parseFloat(value);
    if (numValue > remainingDue) {
      setPaymentAmount(remainingDue.toFixed(2));
    } else {
      setPaymentAmount(value);
    }
  };

  const handleSetFullPayment = () => {
    setPaymentAmount(remainingDue.toFixed(2));
  };

  const handleSubmit = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > remainingDue) {
      alert(`Payment amount cannot exceed remaining due amount of ₹${remainingDue.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    
    const paymentData = {
      amount: amount,
      paymentMethod: paymentMethod,
      paymentDate: paymentDate,
      referenceNumber: referenceNumber,
      notes: notes
    };

    try {
      await onSave(paymentData);
      onClose();
    } catch (error) {
      console.error("Payment submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalPaid = purchaseOrder?.paidAmount || 0;
  const totalAmount = purchaseOrder?.grandTotal || 0;
  const paidPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
        fontFamily: "Inter, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "600px",
          maxWidth: "90%",
          maxHeight: "85vh",
          background: "#fff",
          borderRadius: "16px",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid #EAEAEA",
            background: "#fff",
          }}
        >
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#0E101A" }}>
              Record Payment
            </h3>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "4px 0 0 0" }}>
              PO #{purchaseOrder?.invoiceNo}
            </p>
          </div>
          <IoClose
            size={24}
            style={{ cursor: "pointer", color: "#666" }}
            onClick={onClose}
          />
        </div>

        {/* Body */}
        <div style={{ padding: "24px", overflowY: "auto", maxHeight: "calc(85vh - 140px)" }}>
          {/* Payment Summary */}
          <div
            style={{
              background: "#F8F9FA",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ color: "#6B7280", fontSize: "14px" }}>Total Amount:</span>
              <span style={{ fontWeight: 600, fontSize: "16px", color: "#0E101A" }}>
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ color: "#6B7280", fontSize: "14px" }}>Already Paid:</span>
              <span style={{ fontWeight: 600, fontSize: "16px", color: "#059669" }}>
                ₹{totalPaid.toLocaleString("en-IN")}
              </span>
            </div>
            <div style={{ height: "1px", background: "#E5E7EB", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6B7280", fontSize: "14px" }}>Remaining Due:</span>
              <div>
                <span style={{ fontWeight: 700, fontSize: "20px", color: "#DC2626" }}>
                  ₹{remainingDue.toLocaleString("en-IN")}
                </span>
                {remainingDue > 0 && (
                  <button
                    onClick={handleSetFullPayment}
                    style={{
                      marginLeft: "12px",
                      padding: "4px 12px",
                      fontSize: "12px",
                      background: "#E5F0FF",
                      border: "none",
                      borderRadius: "6px",
                      color: "#1F7FFF",
                      cursor: "pointer",
                    }}
                  >
                    Pay Full
                  </button>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{ marginTop: "16px" }}>
              <div
                style={{
                  height: "8px",
                  background: "#E5E7EB",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${paidPercentage}%`,
                    height: "100%",
                    background: paidPercentage === 100 ? "#059669" : "#1F7FFF",
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "6px", textAlign: "center" }}>
                {paidPercentage.toFixed(1)}% Paid
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: "#374151" }}>
              Payment Amount <span style={{ color: "#DC2626" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "16px",
                  fontWeight: 500,
                  color: "#6B7280",
                }}
              >
                ₹
              </span>
              <input
                type="text"
                placeholder="0.00"
                value={paymentAmount}
                onChange={handleAmountChange}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 32px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "16px",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#1F7FFF")}
                onBlur={(e) => (e.target.style.borderColor = "#D1D5DB")}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: "#374151" }}>
              Payment Method
            </label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {["cash", "bank_transfer", "upi", "cheque", "credit"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: paymentMethod === method ? "2px solid #1F7FFF" : "1px solid #D1D5DB",
                    background: paymentMethod === method ? "#E5F0FF" : "#fff",
                    color: paymentMethod === method ? "#1F7FFF" : "#374151",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textTransform: "capitalize",
                  }}
                >
                  {method === "bank_transfer" ? "Bank Transfer" : method === "upi" ? "UPI / QR" : method}
                </button>
              ))}
            </div>
          </div>

          {/* UPI QR Code Section */}
          {paymentMethod === "upi" && (
            <div
              style={{
                marginBottom: "20px",
                padding: "16px",
                background: "#F8F9FA",
                borderRadius: "12px",
                textAlign: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <FaQrcode size={20} color="#1F7FFF" />
                <span style={{ fontWeight: 500, color: "#0E101A" }}>Scan to Pay via UPI</span>
              </div>
              
              {!companyData?.upiId ? (
                <div style={{ color: "#DC2626", fontSize: "13px", padding: "20px" }}>
                  UPI ID not configured. Please add UPI ID in company bank settings.
                </div>
              ) : !paymentAmount || parseFloat(paymentAmount) <= 0 ? (
                <div style={{ color: "#6B7280", fontSize: "13px", padding: "20px" }}>
                  Enter amount above to generate QR code
                </div>
              ) : loadingQR ? (
                <div style={{ padding: "20px" }}>
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : qrCodeUrl ? (
                <div>
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    style={{
                      width: "200px",
                      height: "200px",
                      margin: "0 auto",
                      display: "block",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                      padding: "8px",
                      background: "#fff",
                    }}
                  />
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "#6B7280" }}>
                    <div>UPI ID: {companyData.upiId}</div>
                    <div>Amount: ₹{parseFloat(paymentAmount).toFixed(2)}</div>
                    <div style={{ marginTop: "8px" }}>
                      Or use any UPI app to scan and pay
                    </div>
                  </div>
                </div>
              ) : null}
              
              {/* Manual UPI details */}
              {companyData?.upiId && paymentAmount && parseFloat(paymentAmount) > 0 && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px",
                    background: "#fff",
                    borderRadius: "8px",
                    fontSize: "12px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ color: "#6B7280" }}>Pay to:</span>
                    <span style={{ fontWeight: 500 }}>{companyData.upiId}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6B7280" }}>Amount:</span>
                    <span style={{ fontWeight: 500 }}>₹{parseFloat(paymentAmount).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Date */}
          {/* <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: "#374151" }}>
              Payment Date
            </label>
            <div style={{ position: "relative" }}>
              <FaCalendarAlt
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9CA3AF",
                }}
              />
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 40px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          </div> */}
          {/* Payment Date - Read Only */}
<div style={{ marginBottom: "20px" }}>
  <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: "#374151" }}>
    Payment Date
  </label>
  <div 
    style={{
      padding: "12px",
      background: "#F8F9FA",
      border: "1px solid #D1D5DB",
      borderRadius: "8px",
      fontSize: "14px",
      color: "#374151",
    }}
  >
    <FaCalendarAlt style={{ marginRight: "8px", color: "#9CA3AF" }} />
    {new Date().toLocaleDateString("en-IN", { 
      day: "2-digit", 
      month: "short", 
      year: "numeric" 
    })}
    <span style={{ fontSize: "12px", color: "#6B7280", marginLeft: "8px" }}>
      (Auto-set to today's date)
    </span>
  </div>
</div>

          {/* Reference Number (for bank transfer/cheque) */}
          {(paymentMethod === "bank_transfer" || paymentMethod === "cheque") && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: "#374151" }}>
                {paymentMethod === "bank_transfer" ? "Transaction ID / Reference No." : "Cheque Number"}
              </label>
              <input
                type="text"
                placeholder={paymentMethod === "bank_transfer" ? "Enter transaction ID" : "Enter cheque number"}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: "#374151" }}>
              Notes (Optional)
            </label>
            <textarea
              placeholder="Add payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Payment History (if any) */}
          {existingPayments && existingPayments.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "12px", color: "#374151" }}>
                Payment History
              </label>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {existingPayments.map((payment, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "12px",
                      background: "#F8F9FA",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 500 }}>₹{payment.amount.toLocaleString("en-IN")}</span>
                      <span style={{ color: "#6B7280" }}>{format(new Date(payment.date), "dd MMM yyyy")}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#6B7280" }}>
                      <span>Method: {payment.method?.replace("_", " ")}</span>
                      {payment.reference && <span>Ref: {payment.reference}</span>}
                    </div>
                    {payment.notes && <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>{payment.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "4px 24px",
            borderTop: "1px solid #EAEAEA",
            background: "#fff",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "#fff",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || isSubmitting}
            style={{
              padding: "10px 28px",
              background: "#1F7FFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: (!paymentAmount || parseFloat(paymentAmount) <= 0 || isSubmitting) ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: 500,
              opacity: (!paymentAmount || parseFloat(paymentAmount) <= 0 || isSubmitting) ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Processing..." : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchasePaymentModal;