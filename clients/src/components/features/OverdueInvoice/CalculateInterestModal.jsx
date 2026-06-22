// CalculateInterestModal.js
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance";

const CalculateInterestModal = ({ show, onClose, invoice, onSuccess }) => {
  const [interestRate, setInterestRate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [calculatedInterest, setCalculatedInterest] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);

  // Calculate days overdue
  const getDaysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = today - due;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  // Calculate interest based on formula
  const calculateInterest = () => {
    setErrors({});
    
    // Validate interest rate
    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate < 1 || rate > 99) {
      setErrors({ interestRate: "Interest rate must be between 1% and 99%" });
      return;
    }

    // Validate minimum amount
    const minAmt = parseFloat(minAmount);
    if (isNaN(minAmt) || minAmt < 0) {
      setErrors({ minAmount: "Please enter a valid minimum amount" });
      return;
    }

    const dueAmount = invoice?.dueAmount || 0;
    const daysOverdue = getDaysOverdue(invoice?.dueDate);

    // Check if due amount meets minimum requirement
    if (dueAmount < minAmt) {
      toast.warning(`Due amount (₹${dueAmount.toFixed(2)}) is less than minimum amount (₹${minAmt.toFixed(2)}). Interest not applicable.`);
      setCalculatedInterest({
        amount: 0,
        daysOverdue,
        dueAmount,
        interestRate: rate,
        message: "Minimum amount not met"
      });
      return;
    }

    // Calculate interest (simple interest formula: P * R * T / 365)
    // P = Principal (due amount)
    // R = Rate (annual interest rate)
    // T = Time (days overdue)
    const interest = (dueAmount * rate * daysOverdue) / (100 * 365);
    
    setCalculatedInterest({
      amount: interest,
      daysOverdue,
      dueAmount,
      interestRate: rate,
      message: interest > 0 ? "Interest calculated successfully" : "No interest applicable"
    });

    toast.success(`Interest calculated: ₹${interest.toFixed(2)}`);
  };

  // Save interest settings for this invoice
  const saveInterestSettings = async () => {
    if (!calculatedInterest) {
      toast.error("Please calculate interest first");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post(`/api/invoices/${invoice._id}/interest`, {
        interestRate: calculatedInterest.interestRate,
        minAmount: parseFloat(minAmount),
        interestAmount: calculatedInterest.amount,
        calculatedAt: new Date().toISOString(),
        daysOverdue: calculatedInterest.daysOverdue
      });

      if (response.data.success) {
        toast.success("Interest settings saved successfully!");
        if (onSuccess) onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save interest settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (show) {
      setInterestRate("");
      setMinAmount("");
      setCalculatedInterest(null);
      setErrors({});
    }
  }, [show]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target) && show) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.27)",
        backdropFilter: "blur(1px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: "500px",
          maxWidth: "90%",
          backgroundColor: "white",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid #EAEAEA",
            backgroundColor: "#F6F9FA",
          }}
        >
          <h4 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Calculate Interest
          </h4>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "20px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {/* Invoice Info */}
          <div
            style={{
              backgroundColor: "#F8F9FA",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#666", fontSize: "13px" }}>Invoice No:</span>
              <span style={{ fontWeight: 500 }}>{invoice?.invoiceNo}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#666", fontSize: "13px" }}>Customer:</span>
              <span style={{ fontWeight: 500 }}>{invoice?.customerId?.name}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ color: "#666", fontSize: "13px" }}>Due Amount:</span>
              <span style={{ fontWeight: 600, color: "#dc3545" }}>
                ₹{(invoice?.dueAmount || 0).toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666", fontSize: "13px" }}>Days Overdue:</span>
              <span style={{ fontWeight: 500, color: "#dc3545" }}>
                {getDaysOverdue(invoice?.dueDate)} days
              </span>
            </div>
          </div>

          {/* Interest Rate Input */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Interest Rate (%) <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="99"
              value={interestRate}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (value >= 1 && value <= 99) {
                  setInterestRate(e.target.value);
                } else if (e.target.value === "") {
                  setInterestRate("");
                } else if (value < 1) {
                  setInterestRate("1");
                } else if (value > 99) {
                  setInterestRate("99");
                } else {
                  setInterestRate(e.target.value);
                }
              }}
              placeholder="Enter interest rate (1% - 99%)"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${errors.interestRate ? "#dc3545" : "#D0D5DD"}`,
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {errors.interestRate && (
              <p style={{ color: "#dc3545", fontSize: "12px", marginTop: "4px" }}>
                {errors.interestRate}
              </p>
            )}
            <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
              Annual interest rate (1% to 99%)
            </p>
          </div>

          {/* Minimum Amount Input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: 500 }}>
              Minimum Amount for Interest <span style={{ color: "red" }}>*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="Enter minimum amount"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: `1px solid ${errors.minAmount ? "#dc3545" : "#D0D5DD"}`,
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
              }}
            />
            {errors.minAmount && (
              <p style={{ color: "#dc3545", fontSize: "12px", marginTop: "4px" }}>
                {errors.minAmount}
              </p>
            )}
            <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
              Interest will only apply if due amount exceeds this value
            </p>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateInterest}
            disabled={isCalculating}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#1F7FFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: isCalculating ? "not-allowed" : "pointer",
              marginBottom: "16px",
            }}
          >
            {isCalculating ? "Calculating..." : "Calculate Interest"}
          </button>

          {/* Calculated Interest Display */}
          {calculatedInterest && (
            <div
              style={{
                backgroundColor: calculatedInterest.amount > 0 ? "#E8F5E9" : "#FFF3E0",
                padding: "16px",
                borderRadius: "8px",
                marginBottom: "20px",
              }}
            >
              <h5 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600 }}>
                Interest Calculation Result
              </h5>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#666" }}>Due Amount:</span>
                <span>₹{calculatedInterest.dueAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#666" }}>Days Overdue:</span>
                <span>{calculatedInterest.daysOverdue} days</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ color: "#666" }}>Interest Rate:</span>
                <span>{calculatedInterest.interestRate}% per annum</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #ddd" }}>
                <span style={{ fontWeight: 600, fontSize: "16px" }}>Interest Amount:</span>
                <span style={{ fontWeight: 600, fontSize: "16px", color: calculatedInterest.amount > 0 ? "#2E7D32" : "#ED6C02" }}>
                  ₹{calculatedInterest.amount.toFixed(2)}
                </span>
              </div>
              {calculatedInterest.message && (
                <p style={{ fontSize: "11px", color: "#666", marginTop: "8px", textAlign: "center" }}>
                  {calculatedInterest.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "16px 20px",
            borderTop: "1px solid #EAEAEA",
            backgroundColor: "#FCFCFC",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              backgroundColor: "white",
              border: "1px solid #D0D5DD",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={saveInterestSettings}
            disabled={!calculatedInterest || isSaving}
            style={{
              padding: "8px 20px",
              backgroundColor: "#1F7FFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: (!calculatedInterest || isSaving) ? "not-allowed" : "pointer",
              opacity: (!calculatedInterest || isSaving) ? 0.6 : 1,
            }}
          >
            {isSaving ? "Saving..." : "Save Interest Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalculateInterestModal;