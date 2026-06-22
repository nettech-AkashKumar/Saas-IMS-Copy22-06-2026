import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../pages/config/axiosInstance";
import { sanitizeInput } from "../../../utils/sanitize";

// icons
import { CiCirclePlus } from "react-icons/ci";
import { IoCloseCircleOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { GoUpload } from "react-icons/go";

const AddVehicle = ({ fetchVehicles, cleanUpModal, closeModal, show, editData, viewData }) => {

    const { t } = useTranslation();
    const isEditMode = !!editData;
    const isViewMode = !!viewData;

    const [vehicleType, setVehicleType] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [capacity, setCapacity] = useState("");
    const [insuranceExpiry, setInsuranceExpiry] = useState("");
    const [lastServiceDate, setLastServiceDate] = useState("");
    const [assignDriver, setAssignDriver] = useState("");
    const [assignTransporter, setAssignTransporter] = useState("");
    const [vehicleImage, setVehicleImage] = useState("");
    const [polutionPaper, setPolutionPaper] = useState("");
    const [ownerCard, setOwnerCard] = useState("");

    const [errors, setErrors] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [driverTotalItems, setDriverTotalItems] = useState(0);
    const [successMessage, setSuccessMessage] = useState(false);
    const [frontErrorMessage, setFrontErrorMessage] = useState("");
    const [transporters, setTransporters] = useState([]);

    const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/i;

    // Add this state after the files state
    const [existingFiles, setExistingFiles] = useState({
        vehicleImage: null, 
        polutionPaper: null,
        ownerCard: null,
    });

    const toDateInput = (val) => {
        if (!val) return "";
        const d = new Date(val);
        if (isNaN(d)) return "";
        return d.toISOString().split("T")[0];
    };

    const resetForm = () => {
        setVehicleType("");
        setVehicleNumber("");
        setCapacity("");
        setInsuranceExpiry("");
        setLastServiceDate("");
        setAssignDriver("");
        setAssignTransporter("");
        setErrors({});
        setFrontErrorMessage("");
        setFiles({ vehicleImage: null, polutionPaper: null, ownerCard: null });
        setExistingFiles({ vehicleImage: null, polutionPaper: null, ownerCard: null });
    };

    const modalData = editData || viewData;

    useEffect(() => {
        if (!show) return; // only run when modal opens

        if (modalData) {
            // ── Edit mode: pre-fill fields ──────────────────────
            setVehicleType(modalData.vehicleType || "");
            setVehicleNumber(modalData.vehicleNumber || "");
            setCapacity(modalData.capacity || "");
            setInsuranceExpiry(toDateInput(modalData.insuranceExpiry));
            setLastServiceDate(toDateInput(modalData.lastServiceDate));
            setAssignDriver(modalData?.assignDriver?.[0]?._id || "");
            setAssignTransporter(modalData?.assignTransporter?._id || modalData?.assignTransporter || "");
            setFiles({ vehicleImage: null, polutionPaper: null, ownerCard: null });

            setExistingFiles({
                vehicleImage: modalData.vehicleImage?.[0] || null,
                polutionPaper: modalData.polutionPaper?.[0] || null,
                ownerCard: modalData.ownerCard?.[0] || null,
            });

            setFiles({ vehicleImage: null, polutionPaper: null, ownerCard: null });

        } else {
            resetForm();
            setExistingFiles({ vehicleImage: null, polutionPaper: null, ownerCard: null });
        }

        setErrors({});
        setFrontErrorMessage("");
        setSuccessMessage(false);
    }, [show, modalData]);

    useEffect(() => {
    }, [show]);

    const [files, setFiles] = useState({
        vehicleImage: null,
        polutionPaper: null,
        ownerCard: null,
    });

    const handleFileChange = (e, field) => {
        if (e.target.files.length > 0) {
            setFiles({
                ...files,
                [field]: e.target.files[0],
            });
        }
    };

    const getShortName = (name) => {
        if (!name) return "Upload";

        const ext = name.split(".").pop();
        const base = name.substring(0, 3);

        return base + ".." + ext;
    };

    const removeFile = (field) => {
        setFiles({
            ...files,
            [field]: null,
        });
    };

    const handleClose = () => {
        resetForm();
        if (closeModal) {
            closeModal();
        }
    };

    const fetchTransporters = async () => {
    try {
        const res = await api.get("/api/transporter/active-transporters");
        setTransporters(res.data.transporters || []);
    } catch (error) {
        toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load transporters");
    }
};
    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/driver/get");
            const data = res.data.driver || [];
            setDrivers(data);
            setDriverTotalItems(res.data.total || 0);
        } catch (error) {
            toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load drivers");
        } finally {
            setLoading(false);
        }
    };

// Call it in useEffect
useEffect(() => {
    fetchTransporters();
    fetchDrivers();
}, []);


    const handleAddVehicle = async (e) => {
        e.preventDefault();
        let newErrors = {};

        if (!vehicleType) {
            newErrors.vehicleType = "Please select a vehicle type";
        }
        if (!vehicleNumber) {
            newErrors.vehicleNumber = "Vehicle number is required.";
        }
        if (!vehicleNumberRegex.test(vehicleNumber)) {
            newErrors.vehicleNumber = "Incorrect or invalide format.";
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const formData = new FormData();
        if (vehicleType) formData.append("vehicleType", vehicleType);
        if (vehicleNumber) formData.append("vehicleNumber", vehicleNumber);
        if (capacity) formData.append("capacity", capacity);
        if (insuranceExpiry) formData.append("insuranceExpiry", toDateInput(insuranceExpiry));
        if (lastServiceDate) formData.append("lastServiceDate", toDateInput(lastServiceDate));
        if (assignDriver) formData.append("assignDriver", assignDriver);
        if (assignTransporter) formData.append("assignTransporter", assignTransporter);
        if (files.vehicleImage) formData.append("vehicleImage", files.vehicleImage);
        if (files.polutionPaper) formData.append("polutionPaper", files.polutionPaper);
        if (files.ownerCard) formData.append("ownerCard", files.ownerCard);
        formData.append("removeVehicleImage", !files.vehicleImage && !existingFiles.vehicleImage ? "true" : "false");
        formData.append("removePolutionPaper", !files.polutionPaper && !existingFiles.polutionPaper ? "true" : "false");
        formData.append("removeOwnerCard", !files.ownerCard && !existingFiles.ownerCard ? "true" : "false");

        try {
            setIsAdding(true);

            if (isEditMode) {
                // ── UPDATE ──────────────────────────────────────────────────
                await api.put(`/api/vehicle/update/${editData._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                // setSuccessMessage(true);
                toast.success(t("Vehicle updated successfully!"));
            } else {
                // ── CREATE ──────────────────────────────────────────────────
                await api.post("/api/vehicle/add", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                // setSuccessMessage(true);
                toast.success(t("Vehicle added successfully!"));
            }
            if (fetchVehicles) fetchVehicles();
            closeModal();
            resetForm();
        } catch (error) {
            if (error.response?.data?.message === "Vehicle Number already exists") {
                setErrors({ vehicleNumber: t("Vehicle number already exists.") });
            } else {
                setFrontErrorMessage(error.response?.data?.displayMessage || error.response?.data?.message || t("Failed to Save Vehicle. Please try again."));
            }
        } finally {
            setIsAdding(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    return (
        <div
            id="add-vehicle"
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
                overflow: "auto"
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    minWidth: "600px",
                    maxWidth: "958px",
                    padding: "30px 40px",
                    borderRadius: "8px",
                    overflow: "auto",
                    maxHeight: "100vh",
                }}
            >
                <div className="">

                    {/* close button */}
                    <div
                        className="modal-header"
                        style={{
                            borderBottom: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "end",
                            borderRadius: "50%",
                            //   padding: "5px 5px",
                            marginBottom: "10px",
                        }}
                    >
                        <button
                            style={{
                                color: "#727681",
                                fontSize: "10px",
                                fontWeight: 800,
                                border: "2px solid #727681",
                                borderRadius: "50%",
                                backgroundColor: "transparent",
                                width: "30px",
                                height: "30px",
                                cursor: "pointer",
                            }}
                            type="button"
                            onClick={handleClose}
                        >
                            <RxCross2
                                style={{ color: "#727681", fontSize: "15px", fontWeight: 900 }}
                            />
                        </button>
                    </div>

                    {/* Success Message */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            boxSizing: "border-box",
                            pointerEvents: "none",
                        }}
                    >
                        {frontErrorMessage && (
                            <div
                                className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                                style={{
                                    border: "1px solid #DC3545",
                                    color: "#DC3545",
                                    background: "#FFF1F3",
                                    borderRadius: "8px",
                                    padding: "10px",
                                    pointerEvents: "auto",
                                }}
                            >
                                <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                                    Error: {frontErrorMessage}
                                </label>
                            </div>
                        )}

                        {successMessage && (
                            <div
                                className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                                style={{
                                    border: "1px solid #0D6828",
                                    color: "#0D6828",
                                    background: "#EBFFF1",
                                    borderRadius: "8px",
                                    padding: "10px",
                                }}
                            >
                                <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                                    Vehicle Successfully {isEditMode ? "Updated" : "Created"}
                                </label>
                            </div>
                        )}
                    </div>

                    {/* heading */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "24px",
                        }}
                    >
                        <h5
                            className="modal-title"
                            style={{
                                color: "#0E101A",
                                fontWeight: 500,
                                fontSize: "22px",
                                fontFamily: '"Inter", sans-serif',
                                lineHeight: "120%",
                            }}
                        >
                            {isViewMode ? "View Vehicle" : isEditMode ? "Edit Vehicle" : "Add Vehicle"}
                        </h5>
                    </div>

                    {/* inputs */}
                    <form onSubmit={handleAddVehicle}>
                        <div className="modal-body">

                            {/* 1st row*/}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* type */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        value={vehicleType}
                                        onChange={(e) => setVehicleType(e.target.value)}
                                        disabled={isViewMode}
                                        style={{
                                            border: "1px solid #E6EAED",
                                            backgroundColor: "#ffffff",
                                            fontWeight: "400",
                                            borderRadius: "0.35rem",
                                            padding: "8px 12px",
                                            width: "100%",
                                            fill: "currentColor",
                                            outline: "none",
                                        }}>
                                        <option value="">Select</option>
                                        <option value="Truck">Truck</option>
                                        <option value="Pickup">Pickup</option>
                                        <option value="Toto">Toto</option>
                                        <option value="Bike">Bike</option>
                                    </select>
                                    {errors.vehicleType && (
                                        <p className="text-danger">{errors.vehicleType}</p>
                                    )}
                                </div>

                                {/* number plate */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Number Plate <span style={{ color: "#727681", fontSize: "10px" }}>(format: KA01AB1234)</span> <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t("Enter Vehicle Name")}
                                        maxLength={50}
                                        disabled={isViewMode}
                                        className="form-control"
                                        style={{
                                            border: "1px solid #E6EAED",
                                            backgroundColor: "#ffffff",
                                            fontWeight: "400",
                                            borderRadius: "0.35rem",
                                            padding: "8px 12px",
                                            width: "100%",
                                            fill: "currentColor",
                                            outline: "none",
                                        }}
                                        value={vehicleNumber}
                                        onChange={(e) => setVehicleNumber(e.target.value)}
                                    />
                                    {errors.vehicleNumber && (
                                        <p className="text-danger">{errors.vehicleNumber}</p>
                                    )}
                                </div>
                            </div>

                            {/* 2nd row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* capacity */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Capacity (Kg)
                                    </label>
                                    <input
                                        type="number"
                                        placeholder={t("Enter Vehicle Name")}
                                        maxLength={50}
                                        disabled={isViewMode}
                                        className="form-control"
                                        style={{
                                            border: "1px solid #E6EAED",
                                            backgroundColor: "#ffffff",
                                            fontWeight: "400",
                                            borderRadius: "0.35rem",
                                            padding: "8px 12px",
                                            width: "100%",
                                            fill: "currentColor",
                                            outline: "none",
                                        }}
                                        value={capacity}
                                        onChange={(e) => setCapacity(e.target.value)}
                                    />
                                    {errors.capacity && (
                                        <p className="text-danger">{errors.capacity}</p>
                                    )}
                                </div>

                                {/* insurance expiry */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Insurance Expiry
                                    </label>
                                    <input
                                        type="date"
                                        placeholder={t("Enter Insurance Expiry")}
                                        maxLength={50}
                                        disabled={isViewMode}
                                        className="form-control"
                                        style={{
                                            border: "1px solid #E6EAED",
                                            backgroundColor: "#ffffff",
                                            fontWeight: "400",
                                            borderRadius: "0.35rem",
                                            padding: "8px 12px",
                                            width: "100%",
                                            fill: "currentColor",
                                            outline: "none",
                                        }}
                                        value={insuranceExpiry}
                                        onChange={(e) => setInsuranceExpiry(e.target.value)}
                                    />
                                    {errors.insuranceExpiry && (
                                        <p className="text-danger">{errors.insuranceExpiry}</p>
                                    )}
                                </div>
                            </div>

                            {/* 3rd row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* last service */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Last Service
                                    </label>
                                    <input
                                        type="date"
                                        placeholder={t("Enter Last Service")}
                                        maxLength={50}
                                        disabled={isViewMode}
                                        className="form-control"
                                        style={{
                                            border: "1px solid #E6EAED",
                                            backgroundColor: "#ffffff",
                                            fontWeight: "400",
                                            borderRadius: "0.35rem",
                                            padding: "8px 12px",
                                            width: "100%",
                                            fill: "currentColor",
                                            outline: "none",
                                        }}
                                        value={lastServiceDate}
                                        onChange={(e) => setLastServiceDate(e.target.value)}
                                    />
                                    {errors.lastServiceDate && (
                                        <p className="text-danger">{errors.lastServiceDate}</p>
                                    )}
                                </div>

                                {/* assign driver */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Assign Driver
                                    </label>
                                    <select
                                        value={assignDriver}
                                        onChange={(e) => setAssignDriver(e.target.value)}
                                        disabled={isViewMode}
                                        style={{
                                            border: "1px solid #E6EAED",
                                            backgroundColor: "#ffffff",
                                            fontWeight: "400",
                                            borderRadius: "0.35rem",
                                            padding: "8px 12px",
                                            width: "100%",
                                            fill: "currentColor",
                                            outline: "none",
                                        }}
                                    >
                                        <option value="">Select</option>
                                        {drivers.map((driver, index) => (
                                            <option key={driver._id} value={driver._id}>
                                                {driver.driverName || "-"}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.assignDriver && (
                                        <p className="text-danger">{errors.assignDriver}</p>
                                    )}
                                </div>
                            </div>

                            {/* 4th row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* assign transporter */}
                                {/* assign transporter */}
<div className="mb-3 w-100">
    <label
        className="supplierlabel mb-1"
        style={{ color: "#727681", fontSize: "12px" }}
    >
        Assign Transporter
    </label>
    <select
        value={assignTransporter}
        onChange={(e) => setAssignTransporter(e.target.value)}
        disabled={isViewMode}
        style={{
            border: "1px solid #E6EAED",
            backgroundColor: "#ffffff",
            fontWeight: "400",
            borderRadius: "0.35rem",
            padding: "8px 12px",
            width: "100%",
            fill: "currentColor",
            outline: "none",
        }}
    >
        <option value="">Select</option>
        {transporters.map((transporter) => (
            <option key={transporter._id} value={transporter._id}>
                {transporter.transporterName || "-"}
            </option>
        ))}
    </select>
    {errors.assignTransporter && (
        <p className="text-danger">{errors.assignTransporter}</p>
    )}
</div>
                            </div>

                            <hr style={{ height: "1.2px", backgroundColor: "#EAEAEA" }} />

                            {/* upload row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Vehicle Image
                                    </label>

                                    {/* ── Show existing Cloudinary image ── */}
                                    {!files.vehicleImage && existingFiles.vehicleImage ? (
                                        <div style={{ position: "relative", border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                                            <a href={existingFiles.vehicleImage.url} target="_blank" rel="noreferrer"
                                                style={{ color: "#1F7FFF", fontSize: "14px", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                                                <img src={existingFiles.vehicleImage.url} alt="Vehicle Image" style={{ width: "80px", height: "80px", borderRadius: "8px" }} />
                                            </a>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    style={{ position: "absolute", top: 0, left: "60%", color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                    onClick={() => setExistingFiles(prev => ({ ...prev, vehicleImage: null }))}
                                                >
                                                    <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                </button>)}
                                        </div>
                                    ) : (
                                        <>
                                            {!isViewMode ? (
                                                <div onClick={() => document.getElementById("vehicleImage").click()}
                                                    style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    <span style={{ color: "#0E101A", fontSize: "14px" }}>
                                                        {files.vehicleImage ? getShortName(files.vehicleImage.name) : "Upload"}
                                                    </span>
                                                    {files.vehicleImage ? (
                                                        <button type="button"
                                                            style={{ color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                            onClick={(e) => { e.stopPropagation(); removeFile("vehicleImage"); }}>
                                                            <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                        </button>
                                                    ) : (
                                                        <GoUpload style={{ fontSize: "18px", color: "#0E101A" }} />
                                                    )}
                                                    <input id="vehicleImage" type="file" onChange={(e) => handleFileChange(e, "vehicleImage")} style={{ display: "none" }} />
                                                </div>) : (
                                                <div style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    Not Uploaded
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Pollution Paper
                                    </label>

                                    {/* ── Show existing Cloudinary image ── */}
                                    {!files.polutionPaper && existingFiles.polutionPaper ? (
                                        <div style={{ position: "relative", border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                                            <a href={existingFiles.polutionPaper.url} target="_blank" rel="noreferrer"
                                                style={{ color: "#1F7FFF", fontSize: "14px", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                                                <img src={existingFiles.polutionPaper.url} alt="Polution Paper" style={{ width: "80px", height: "80px", borderRadius: "8px" }} />
                                            </a>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    style={{ position: "absolute", top: 0, left: "60%", color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                    onClick={() => setExistingFiles(prev => ({ ...prev, polutionPaper: null }))}
                                                >
                                                    <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                </button>)}
                                        </div>
                                    ) : (
                                        <>
                                            {!isViewMode ? (
                                                <div onClick={() => document.getElementById("polutionPaper").click()}
                                                    style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    <span style={{ color: "#0E101A", fontSize: "14px" }}>
                                                        {files.polutionPaper ? getShortName(files.polutionPaper.name) : "Upload"}
                                                    </span>
                                                    {files.polutionPaper ? (
                                                        <button type="button"
                                                            style={{ color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                            onClick={(e) => { e.stopPropagation(); removeFile("polutionPaper"); }}>
                                                            <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                        </button>
                                                    ) : (
                                                        <GoUpload style={{ fontSize: "18px", color: "#0E101A" }} />
                                                    )}
                                                    <input id="polutionPaper" type="file" onChange={(e) => handleFileChange(e, "polutionPaper")} style={{ display: "none" }} />
                                                </div>) : (
                                                <div style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    Not Uploaded
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Owner Card
                                    </label>

                                    {/* ── Show existing Cloudinary image ── */}
                                    {!files.ownerCard && existingFiles.ownerCard ? (
                                        <div style={{ position: "relative", border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                                            <a href={existingFiles.ownerCard.url} target="_blank" rel="noreferrer"
                                                style={{ color: "#1F7FFF", fontSize: "14px", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                                                <img src={existingFiles.ownerCard.url} alt="Owner Card" style={{ width: "80px", height: "80px", borderRadius: "8px" }} />
                                            </a>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    style={{ position: "absolute", top: 0, left: "60%", color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                    onClick={() => setExistingFiles(prev => ({ ...prev, ownerCard: null }))}
                                                >
                                                    <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                </button>)}
                                        </div>
                                    ) : (
                                        <>
                                            {!isViewMode ? (
                                                <div onClick={() => document.getElementById("ownerCard").click()}
                                                    style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    <span style={{ color: "#0E101A", fontSize: "14px" }}>
                                                        {files.ownerCard ? getShortName(files.ownerCard.name) : "Upload"}
                                                    </span>
                                                    {files.ownerCard ? (
                                                        <button type="button"
                                                            style={{ color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                            onClick={(e) => { e.stopPropagation(); removeFile("ownerCard"); }}>
                                                            <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                        </button>
                                                    ) : (
                                                        <GoUpload style={{ fontSize: "18px", color: "#0E101A" }} />
                                                    )}
                                                    <input id="ownerCard" type="file" onChange={(e) => handleFileChange(e, "ownerCard")} style={{ display: "none" }} />
                                                </div>) : (
                                                <div style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    Not Uploaded
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* save button */}
                        <div
                            className="modal-footer d-flex align-items-start justify-content-start"
                            style={{ borderTop: "none" }}
                        >
                            {!isViewMode && (<button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isAdding}
                            >
                                {isAdding ? "Saving..." : "Save"}
                            </button>)}
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddVehicle;
