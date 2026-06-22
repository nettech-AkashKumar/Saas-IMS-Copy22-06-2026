import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// pages
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "react-quill/dist/quill.snow.css";
import api from "../../config/axiosInstance.js";

// icons
import { RiImageAddFill } from "react-icons/ri";

// images
import tick from "../../../assets/images/tick.png";

const CreateExpensesModal = ({ closeModal, modelRef, onSaved }) => {

  const sanitizeText = (value = "") => {
    return value
      .replace(/<[^>]*>?/gm, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const paidByNameRegex = /^[A-Za-z\s]{1,20}$/;

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!expenseTitle || sanitizeText(expenseTitle).length < 1) {
      newErrors.expenseTitle = "Expense title must be at least 1 characters";
    }

    if (!notes || sanitizeText(notes).length < 1) {
      newErrors.notes = "Description must be at least 1 character";
    }

    if (!amount || Number(amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }

    if (!paymentMode) {
      newErrors.paymentMode = "Please select a payment mode";
    }

    if (!paidTo || sanitizeText(paidTo).length < 1) {
      newErrors.paidTo = "Paid By is required";
    } else if (!paidByNameRegex.test(sanitizeText(paidTo))) {
      newErrors.paidTo = "Paid By must be between 1 to 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("Unsettled");
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [date, setDate] = useState(new Date());
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      files.forEach(f => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const formData = new FormData();
      formData.append("date", date.toISOString());
      formData.append("paymentStatus", paymentStatus || "Unsettled");
      formData.append("expenseTitle", sanitizeText(expenseTitle));
      formData.append("amount", Number(amount));
      formData.append("notes", sanitizeText(notes));
      formData.append("paymentMode", paymentMode);
      formData.append("paidTo", sanitizeText(paidTo));

      files.forEach(f => formData.append("receipt", f));

      const res = await api.post("/api/expenses", formData);

      setIsSaved(true);
      setShowSuccess(true);
      setTimeout(() => {
        if (onSaved) onSaved();
        if (closeModal) closeModal();
      }, 1000);
    } catch (error) {
      // toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to create expense");
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleRemoveImage = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f =>
      f.type === "image/png" || f.type === "image/jpeg" || f.type === "application/pdf"
    );
    setFiles(droppedFiles);
  };

  useEffect(() => {
    setErrors({});
  }, [expenseTitle, notes, amount, paymentMode, paidTo]);

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
        zIndex: 99999999,
      }}
    >
      <div
        ref={modelRef}
        className="create-category-modelbox"
        style={{
          backgroundColor: "white",
          width: "950px",
          padding: "30px 100px 60px",
          borderRadius: "8px",
        }}
      >
        {/* close button */}
        <div style={{ display: "flex", justifyContent: "end" }}>
          <button
            onClick={closeModal}
            style={{
              border: "2px solid #727681",
              borderRadius: "50px",
              width: "25px",
              height: "25px",
              backgroundColor: "white",
              color: "#727681",
              fontWeight: "500",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "13px",
            }}
          >
            X
          </button>
        </div>

        {/* success message */}
        {showSuccess && (
          <div
            className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
            style={{
              border: "1px solid #0D6828",
              color: "#0D6828",
              background: "#EBFFF1",
              borderRadius: "8px",
              padding: "10px",
              marginTop: "15px",
            }}
          >
            <label htmlFor="" style={{ fontFamily: "Inter", fontSize: "14px" }}>
              <img src={tick} alt="tick" /> Expense Successfully Added
            </label>
          </div>
        )}

        <div className="d-flex justify-content-between pt-2">
          <h1 style={{ color: "#0E101A", fontSize: "22px", fontFamily: "Inter" }}>
            Add Expense
          </h1>
          {/* Payment Status */}
          <div style={{
            background: '#0D6828',
            border: 'none',
            padding: '5px 10px 0px 2px',
            borderRadius: '8px',
          }}>
            <select style={{
              border: 'none',
              background: '#0D6828',
              color: 'white',
              padding: '2px 10px'
            }}
              value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
            >
              <option value="Settled">Settled</option>
              <option value="Unsettled">Unsettled</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Expense Title */}
          <div className="add-category-form d-flex gap-3 pt-3 pb-3">
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Expense Title <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="border-hover"
                type="name"
                placeholder="Enter Name"
                value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)}
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
              {errors.expenseTitle && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.expenseTitle}
                </small>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="d-flex flex-column gap-1 w-100 pb-3">
            <label
              htmlFor=""
              style={{
                color: "black",
                fontFamily: "Inter",
                fontSize: "13px",
              }}
            >
              Description <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              className="border-hover"
              rows={3}
              placeholder="Enter Remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                border: "2px dashed #dfddddff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontFamily: "Inter",
                color: "grey",
                outline: "none",
              }}
            ></textarea>
            {errors.notes && (
              <small style={{ color: "red", fontSize: "12px" }}>
                {errors.notes}
              </small>
            )}
          </div>

          <div className="add-category-form d-flex gap-3 pb-5">
            {/* Expense Amount */}
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Expense Amount <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="number"
                className="border-hover"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                name=""
                id=""
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontFamily: "Inter",
                  color: "grey",
                  outline: "none",
                }}
              />
              {errors.amount && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.amount}
                </small>
              )}
            </div>

            {/* Payment Mode */}
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Payment Mode <span style={{ color: "red" }}>*</span>
              </label>
              <select
                className="border-hover"
                name=""
                id=""
                value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontFamily: "Inter",
                  color: "grey",
                  outline: "none",
                }}
              >
                <option value="">select</option>
                <option value="cash">Cash</option>
                <option value="upi">Upi</option>
                <option value="partial">Partial</option>
              </select>
              {errors.paymentMode && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.paymentMode}
                </small>
              )}
            </div>

            {/* Paid By */}
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Paid By <span style={{ color: "red" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Enter Paid by"
                className="border-hover"
                value={paidTo} onChange={(e) => setPaidTo(e.target.value)}
                name=""
                id=""
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontFamily: "Inter",
                  color: "grey",
                  outline: "none",
                }}
              />
              {errors.paidTo && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.paidTo}
                </small>
              )}
            </div>
          </div>

          {/* Upload */}
          <div className="add-category-form d-flex gap-3 pb-4">
            <div>
              <div
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Upload Bill / Invoice Pdf / Receipt
              </div>

              <div
                style={{
                  width: "80px",
                  height: "90px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "pointer",
                  flexDirection: "column",
                  fontSize: "12px",
                  color: "#9ca3af",
                  position: 'relative',
                  objectFit: "cover",
                  marginTop: '10px',
                }}
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <span role="img" aria-label="upload" >
                  {files.length > 0 ? files.map((f, i) => (
                    f.type === "application/pdf" ? (
                      <div key={i} style={{
                        width: "100px", height: "100px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "1px solid #ddd", borderRadius: "6px", marginRight: "10px",
                        backgroundColor: "#f9f9f9", fontSize: "12px", fontWeight: "500"
                      }}>
                        📄 {f.name}
                      </div>
                    ) : (
                      <div style={{
                        width: '80px',
                        height: '90px',
                      }}>
                        <img
                          key={i}
                          src={URL.createObjectURL(f)}
                          alt="preview"
                          style={{ width: "100%", height: "100%", objectFit: "fill", borderRadius: "6px", marginRight: "10px" }}
                        />
                        <button
                          type="button"
                          style={{
                            cursor: "pointer",
                            position: "absolute",
                            top: -8,
                            right: -8,
                            border: "none",
                            borderRadius: "50%",
                            backgroundColor: "red",
                            color: "white",
                            width: "20px",
                            height: "20px",
                            lineHeight: "20px",
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveImage(i);
                          }}
                        >
                          &times;
                        </button>
                      </div>
                    )
                  )) : (
                    <>
                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "999px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "18px",
                        }}
                      >
                        <RiImageAddFill />
                      </div>
                    </>
                  )}
                </span>
                <input
                  id="receipt-upload"
                  type="file"
                  accept="image/png, image/jpeg, application/pdf"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  ref={fileInputRef}
                />
              </div>
              {errors.receipt && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.receipt}
                </small>
              )}
            </div>
          </div>

          <button
            className="button-hover"
            disabled={isSaved || Object.keys(errors).length > 0}
            style={{
              backgroundColor: "rgb(31, 127, 255)",
              // color: "white",
              fontFamily: "Inter",
              border: "none",
              borderRadius: "8px",
              padding: "4px 8px",
              color: "white",
            }}
          >
            {isSaved ? "Done" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateExpensesModal;
