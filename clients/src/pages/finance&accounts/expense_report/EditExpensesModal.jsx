import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

// pages
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "react-quill/dist/quill.snow.css";
import api from "../../config/axiosInstance.js";

// icons
import { RiImageAddFill } from "react-icons/ri";

// images
import tick from "../../../assets/images/tick.png";

const EditExpensesModal = ({ closeModal, modelRef, onSaved, isEdit = false, expense = null }) => {

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
    const [existingReceipt, setExistingReceipt] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        return () => {
            files.forEach(f => URL.revokeObjectURL(f.preview));
        };
    }, [files]);

    useEffect(() => {
        if (!expense) return;

        setExpenseTitle(expense.expenseTitle || "");
        setAmount(expense.amount ?? "");
        setPaymentMode(expense.paymentMode || "");
        setPaidTo(expense.paidTo || "");
        setPaymentStatus(
            expense.paymentStatus === "Paid"
                ? "Settled"
                : expense.paymentStatus === "Pending"
                    ? "Unsettled"
                    : expense.paymentStatus || "Unsettled"
        );
        setNotes(expense.notes || "");
        setDate(expense.date ? new Date(expense.date) : new Date());

        if (Array.isArray(expense.receipt) && expense.receipt.length > 0) {
            const r = expense.receipt[0]; // take first receipt
            setExistingReceipt({
                url: r.url,
                type: r.url.endsWith(".pdf") ? "pdf" : "image",
            });
        } else {
            setExistingReceipt(null);
        }
    }, [expense]);

    const handleRemoveReceipt = () => {
        setFiles([]);
        setExistingReceipt(null);
    };

//     const handleSave = async (e) => {
//         e.preventDefault();

//         if (!validateForm()) return;

//         try {
//             const formData = new FormData();
//             formData.append("date", date.toISOString());
//             formData.append("paymentStatus", paymentStatus || "Unsettled");
//             formData.append("expenseTitle", sanitizeText(expenseTitle));
//             formData.append("amount", Number(amount));
//             formData.append("notes", sanitizeText(notes));
//             formData.append("paymentMode", paymentMode);
//             formData.append("paidTo", sanitizeText(paidTo));

//             files.forEach(f => formData.append("receipt", f));
//             // formData.append("removeReceipt", existingReceipt === null);

// const shouldRemoveReceipt = !existingReceipt && files.length === 0
// formData.append("removeReceipt", shouldRemoveReceipt ? "true" : "false");
// files.forEach(f => formData.append("receipt", f));

//             const res = isEdit && expense?._id
//                 ? await api.put(`/api/expenses/${expense._id}`, formData)
//                 : await api.post('/api/expenses', formData);

//             setIsSaved(true);
//             setShowSuccess(true);
//             setTimeout(() => {
//                 if (onSaved) onSaved();
//                 if (closeModal) closeModal();
//             }, 1000);
//         } catch (error) {
//             toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to update expense");
//         }
//     };

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

    // ✅ IMPORTANT LOGIC
    const shouldRemoveReceipt = !existingReceipt && files.length === 0;

    formData.append("removeReceipt", shouldRemoveReceipt ? "true" : "false");

    // ✅ append new file if exists
    if (files.length > 0) {
      formData.append("receipt", files[0]);
    }

    const res = isEdit && expense?._id
      ? await api.put(`/api/expenses/${expense._id}`, formData)
      : await api.post(`/api/expenses`, formData);

    setIsSaved(true);
    setShowSuccess(true);

    setTimeout(() => {
      if (onSaved) onSaved();
      if (closeModal) closeModal();
    }, 1000);

  } catch (err) {
    toast.error(
      err?.response?.data?.displayMessage ||
      err?.response?.data?.message ||
      err?.message ||
      "Failed to update expense"
    );
  }
};

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(selectedFiles);
        setExistingReceipt(null);
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

    const hasPreview = files.length > 0 || existingReceipt;

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
                            <img src={tick} alt="tick" /> Expense Successfully Edited
                        </label>
                    </div>
                )}

                <div className="d-flex justify-content-between pt-2">
                    <h1 style={{ color: "#0E101A", fontSize: "22px", fontFamily: "Inter" }}>
                        Edit Expense
                    </h1>
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
                            padding: '2px 16px'
                        }}
                            value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}
                        >
                            <option value="Settled">Settled</option>
                            <option value="Unsettled">Unsettled</option>
                        </select>
                    </div>
                </div>

                <form action="" onSubmit={handleSave}>
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

                    <div className="add-category-form d-flex gap-3 pb-3">
                        <div className="d-flex flex-column gap-1 w-100">
                            <label
                                htmlFor=""
                                style={{
                                    color: "black",
                                    fontFamily: "Inter",
                                    fontSize: "13px",
                                }}
                            >
                                Date <span style={{ color: "red" }}>*</span>
                            </label>
                            <input
                                type="date"
                                className="border-hover"
                                value={(() => {
                                    try {
                                        const d = date instanceof Date ? date : new Date(date);
                                        return d.toISOString().slice(0, 10);
                                    } catch {
                                        return new Date().toISOString().slice(0, 10);
                                    }
                                })()}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setDate(v ? new Date(v + "T00:00:00") : new Date());
                                }}
                                style={{
                                    border: "1px solid #dfddddff",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    fontFamily: "Inter",
                                    color: "grey",
                                    outline: "none",
                                }}
                            />
                        </div>
                    </div>
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
                                placeholder="Enter Paid to"
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

                    <div className="add-category-form d-flex gap-3 pb-4">
                        {/* Upload */}
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
                                onClick={() => {
                                    if (!hasPreview) {
                                        fileInputRef.current && fileInputRef.current.click();
                                    }
                                }}
                            >
                                {/* ❌ REMOVE BUTTON */}
                                {hasPreview && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveReceipt();
                                        }}
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
                                    >
                                        ×
                                    </button>
                                )}

                                {/* 📄 NEW FILE PREVIEW */}
                                {files.length > 0 && (
                                    files[0].type === "application/pdf" ? (
                                        <div style={{ fontSize: "12px", textAlign: "center" }}>
                                            📄 PDF
                                        </div>
                                    ) : (
                                        <img
                                            src={URL.createObjectURL(files[0])}
                                            alt="preview"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    )
                                )}

                                {/* 🧾 EXISTING RECEIPT (EDIT MODE) */}
                                {!files.length && existingReceipt && (
                                    existingReceipt.type === "pdf" ? (
                                        <div style={{ fontSize: "12px", textAlign: "center" }}>
                                            📄 PDF
                                        </div>
                                    ) : (
                                        <img
                                            src={existingReceipt.url}
                                            alt="existing receipt"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    )
                                )}


                                {/* ➕ DEFAULT UI */}
                                {!hasPreview && (
                                    <RiImageAddFill size={22} />
                                )}

                                <input
                                    type="file"
                                    accept="image/png,image/jpeg,application/pdf"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    style={{ display: "none" }}
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

export default EditExpensesModal;
