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
import { RiArrowDropDownLine, RiVerifiedBadgeLine } from "react-icons/ri";

const AddDriver = ({ fetchDrivers, cleanUpModal, closeModal, show, editData, viewData }) => {

    const { t } = useTranslation();
    const isEditMode = !!editData; // true when editing
    const isViewMode = !!viewData;

    const [driverName, setDriverName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [licenceNumber, setLicenceNumber] = useState("");
    const [vehicleId, setVehicleId] = useState("");
    const [licenceExpiry, setLicenceExpiry] = useState("");
    const [joiningDate, setJoiningDate] = useState("");
    const [transporterId, setTransporterId] = useState("");
    const [advance, setAdvance] = useState("");
    const [creditDay, setCreditDay] = useState("");
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolderName, setAccountHolderName] = useState("");
    const [accountType, setAccountType] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [branch, setBranch] = useState("");
    const [vehicles, setVehicles] = useState([]);
    const [vehicleTotalItems, setVehicleTotalItems] = useState(0);

    const [files, setFiles] = useState({
        aadhaarCard: null,
        panCard: null,
        licenseCard: null,
    });

    const [errors, setErrors] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const driverNameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^[0-9]{10}$/;
    const licenceNumberRegex = /^[A-Z]{2}-?[0-9]{2}-?[0-9]{4}-?[0-9]{7}$/;
    const bankNameRegex = /^[A-Za-z\s]{1,50}$/;
    const accountNumberRegex = /^\d{1,18}$/;
    const accountHolderNameRegex = /^[A-Za-z\s]{1,50}$/;
    const ifscCodeRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    const branchRegex = /^[A-Za-z\s]{1,50}$/;

    const [successMessage, setSuccessMessage] = useState(false);
    const [frontErrorMessage, setFrontErrorMessage] = useState("");

    const [existingFiles, setExistingFiles] = useState({
        aadhaarCard: null,
        panCard: null,
        licenseCard: null,
    });

    const toDateInput = (val) => {
        if (!val) return "";
        const d = new Date(val);
        if (isNaN(d)) return "";
        return d.toISOString().split("T")[0];
    };

    const resetForm = () => {
        setDriverName("");
        setPhoneNumber("");
        setLicenceNumber("");
        setVehicleId("");
        setLicenceExpiry("");
        setJoiningDate("");
        setTransporterId("");
        setAdvance("");
        setCreditDay("");
        setBankName("");
        setAccountNumber("");
        setAccountHolderName("");
        setAccountType("");
        setIfscCode("");
        setBranch("");

        setFiles({
            aadhaarCard: null,
            panCard: null,
            licenseCard: null,
        });

        setErrors({});
        setFrontErrorMessage("");
        setExistingFiles({ aadhaarCard: null, panCard: null, licenseCard: null });
    };

    const modalData = editData || viewData;

    useEffect(() => {
        if (!show) return;

        if (modalData) {
            // Edit Mode
            setDriverName(modalData.driverName || "");
            setPhoneNumber(modalData.phoneNumber || "");
            setLicenceNumber(modalData.licenceNumber || "");
            setVehicleId(modalData.vehicleId?.[0]?._id || "");
            setLicenceExpiry(toDateInput(modalData.licenceExpiry));
            setJoiningDate(toDateInput(modalData.joiningDate));
            setTransporterId(modalData.transporterId?.[0]?._id || "");
            setAdvance(modalData.advance || "");
            setCreditDay(modalData.creditDay || "");
            setBankName(modalData.bankName || "");
            setAccountNumber(modalData.accountNumber || "");
            setAccountHolderName(modalData.accountHolderName || "");
            setAccountType(modalData.accountType || "");
            setIfscCode(modalData.ifscCode || "");
            setBranch(modalData.branch || "");

            setExistingFiles({
                aadhaarCard: modalData.aadhaarCard?.[0] || null,
                panCard: modalData.panCard?.[0] || null,
                licenseCard: modalData.licenseCard?.[0] || null,
            });

            setFiles({ aadhaarCard: null, panCard: null, licenseCard: null });

        } else {
            resetForm();
            setExistingFiles({ aadhaarCard: null, panCard: null, licenseCard: null });
        }

        setErrors({});
        setFrontErrorMessage("");
        setSuccessMessage(false);
    }, [show, modalData]);

    const [showBankDetails, setshowBankDetails] = useState(false);
    const toggleBankDetails = () => {
        setshowBankDetails((prev) => !prev);
    };

    const driverNameRef = useRef(null);

    useEffect(() => {
        if (show && driverNameRef.current) {
            driverNameRef.current.focus();
        }
    }, [show]);

    useEffect(() => {
        if (show) {
            setErrors({});
            driverNameRef.current?.focus();
        }
    }, [show]);

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

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/vehicle/get");
            const data = res.data.vehicle || [];
            setVehicles(data);
            setVehicleTotalItems(res.data.total || 0);
        } catch (error) {
            toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load vehicles");
        } finally {
            setLoading(false);
        }
    };

    const handleAddDriver = async (e) => {
        e.preventDefault();
        let newErrors = {};

        if (!driverName) {
            newErrors.driverName = t(
                "Driver name required"
            );
        }
        else if (!driverNameRegex.test(driverName)) {
            newErrors.driverName = t(
                "Driver name must be of only letters and spaces"
            );
        }

        if (!phoneRegex.test(phoneNumber)) {
            newErrors.phoneNumber = t(
                "Phone number must be of 10 digits"
            );
        }

        if (!licenceNumber) {
            newErrors.licenceNumber = t(
                "Licence number required"
            );
        }
        else if (!licenceNumberRegex.test(licenceNumber)) {
            newErrors.licenceNumber = t(
                "Incorrect or invalide format."
            );
        }

        if (!bankNameRegex.test(bankName) && bankName) {
            newErrors.bankName = t(
                "Bank name must be only letters and spaces"
            );
        }

        if (!accountNumberRegex.test(accountNumber) && accountNumber) {
            newErrors.accountNumber = t(
                "Account number should be upto 18 digits"
            );
        }

        if (!accountHolderNameRegex.test(accountHolderName) && accountHolderName) {
            newErrors.accountHolderName = t(
                "Account holder name must be only letters and spaces"
            );
        }

        if (!ifscCodeRegex.test(ifscCode) && ifscCode) {
            newErrors.ifscCode = t(
                "IFSC code must be of 11 digits"
            );
        }

        if (!branchRegex.test(branch) && branch) {
            newErrors.branch = t(
                "Branch name must be only letters and spaces"
            );
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const formData = new FormData();
        if (driverName) formData.append("driverName", driverName);
        if (phoneNumber) formData.append("phoneNumber", phoneNumber);
        if (vehicleId) formData.append("vehicleId", vehicleId);
        if (licenceNumber) formData.append("licenceNumber", licenceNumber);
        if (licenceExpiry) formData.append("licenceExpiry", licenceExpiry);
        if (joiningDate) formData.append("joiningDate", joiningDate);
        if (transporterId) formData.append("transporterId", transporterId);
        if (advance) formData.append("advance", advance);
        if (creditDay) formData.append("creditDay", creditDay);
        if (bankName) formData.append("bankName", bankName);
        if (accountNumber) formData.append("accountNumber", accountNumber);
        if (accountHolderName) formData.append("accountHolderName", accountHolderName);
        if (accountType) formData.append("accountType", accountType);
        if (ifscCode) formData.append("ifscCode", ifscCode);
        if (branch) formData.append("branch", branch);
        if (files.aadhaarCard) formData.append("aadhaarCard", files.aadhaarCard);
        if (files.panCard) formData.append("panCard", files.panCard);
        if (files.licenseCard) formData.append("licenseCard", files.licenseCard);
        formData.append("removeAadhaarCard", !files.aadhaarCard && !existingFiles.aadhaarCard ? "true" : "false");
        formData.append("removePanCard", !files.panCard && !existingFiles.panCard ? "true" : "false");
        formData.append("removeLicenseCard", !files.licenseCard && !existingFiles.licenseCard ? "true" : "false");

        try {
            setIsAdding(true);

            if (isEditMode) {
                await api.put(`/api/driver/update/${editData._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data", },
                });
                // setSuccessMessage(true);
                toast.success(t("Driver updated successfully!"));
            } else {
                await api.post("/api/driver/add", formData, {
                    headers: { "Content-Type": "multipart/form-data", },
                });
                // setSuccessMessage(true);
                toast.success(t("Driver added successfully!"));
            }
            if (fetchDrivers) fetchDrivers();
            closeModal();
            resetForm();
        } catch (error) {
            if (error.response?.data?.message === "License Number already exists") {
                setErrors({ licenceNumber: t("Licence number already exists.") });
            } else {
                setFrontErrorMessage(error.response?.data?.displayMessage || error.response?.data?.message || t("Failed to add driver. Please try again."));
            }
        } finally {
            setIsAdding(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
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
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                            type="button"
                            onClick={closeModal}
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
                                    {frontErrorMessage}
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
                            {isViewMode ? "View Driver" : isEditMode ? "Edit Driver" : "Add Driver"}
                        </h5>
                    </div>

                    {/* inputs */}
                    <form onSubmit={handleAddDriver}>
                        <div className="modal-body">

                            {/* 1st row*/}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* driver name */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Driver Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter Driver Name"
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
                                        value={driverName}
                                        ref={driverNameRef}
                                        onChange={(e) => setDriverName(e.target.value)}
                                    />
                                    {errors.driverName && (
                                        <p className="text-danger">{errors.driverName}</p>
                                    )}
                                </div>

                                {/* phone number */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Phone Number <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        placeholder={t("Enter Phone Number")}
                                        maxLength={10}
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
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                    />
                                    {errors.phoneNumber && (
                                        <p className="text-danger">{errors.phoneNumber}</p>
                                    )}
                                </div>

                                {/* licence number */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Licence No. <span style={{ color: "#727681", fontSize: "10px" }}>(format: DL0120260012345)</span> <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter Licence Number"
                                        maxLength={16}
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
                                        value={licenceNumber}
                                        onChange={(e) => setLicenceNumber(e.target.value)}
                                    />
                                    {errors.licenceNumber && (
                                        <p className="text-danger">{errors.licenceNumber}</p>
                                    )}
                                </div>
                            </div>

                            {/* 2nd row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* assign vehicle */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Assign Vehicle
                                    </label>
                                    <select
                                        value={vehicleId}
                                        onChange={(e) => setVehicleId(e.target.value)}
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
                                        {vehicles.map((vehicle, index) => (
                                            <option key={vehicle._id} value={vehicle._id}>
                                                {vehicle.vehicleNumber || "-"}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.vehicleId && (
                                        <p className="text-danger">{errors.vehicleId}</p>
                                    )}
                                </div>

                                {/* licence expiry */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Licence Expiry
                                    </label>
                                    <input
                                        type="date"
                                        placeholder="Enter Licence Expiry"
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
                                        value={licenceExpiry}
                                        onChange={(e) => setLicenceExpiry(e.target.value)}
                                    />
                                    {errors.licenceExpiry && (
                                        <p className="text-danger">{errors.licenceExpiry}</p>
                                    )}
                                </div>

                                {/* joining date */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Joining Date
                                    </label>
                                    <input
                                        type="date"
                                        placeholder="Enter Joining Date"
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
                                        value={joiningDate}
                                        onChange={(e) => setJoiningDate(e.target.value)}
                                    />
                                    {errors.joiningDate && (
                                        <p className="text-danger">{errors.joiningDate}</p>
                                    )}
                                </div>
                            </div>

                            {/* 3rd row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* assign transporter */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Assign Transporter
                                    </label>
                                    <select
                                        value={transporterId}
                                        onChange={(e) => setTransporterId(e.target.value)}
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
                                    </select>
                                    {errors.transporterId && (
                                        <p className="text-danger">{errors.transporterId}</p>
                                    )}
                                </div>

                                {/* advance */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Advance
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="Enter Advance"
                                        className="form-control"
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
                                        value={advance}
                                        onChange={(e) => setAdvance(e.target.value)}
                                    />
                                    {errors.advance && (
                                        <p className="text-danger">{errors.advance}</p>
                                    )}
                                </div>

                                {/* credit days */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Credit Days
                                    </label>
                                    <select
                                        value={creditDay}
                                        onChange={(e) => setCreditDay(e.target.value)}
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
                                        <option value="1">1 day</option>
                                        <option value="3">3 day</option>
                                        <option value="7">7 days</option>
                                    </select>
                                    {errors.creditDay && (
                                        <p className="text-danger">{errors.creditDay}</p>
                                    )}
                                </div>
                            </div>

                            <hr style={{ height: "1.2px", backgroundColor: "#EAEAEA" }} />

                            <label
                                onClick={toggleBankDetails}
                                htmlFor=""
                                style={{
                                    fontSize: "14px",
                                    color: "rgb(13, 110, 253)",
                                    fontWeight: "500",
                                    marginBottom: "24px",
                                    backgroundColor: "rgb(243, 248, 251)",
                                    border: "1px solid rgb(229, 240, 255)",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    width: "100%",
                                    justifyContent: "space-between",
                                    display: "flex",
                                }}
                            >
                                <span style={{ color: "rgb(13, 110, 253)" }}>
                                    {" "}
                                    + Add Bank Account{" "}
                                </span>
                                <span>
                                    <RiArrowDropDownLine
                                        style={{
                                            color: "grey",
                                            fontSize: "20px",
                                            transition: "0.3s",
                                            transform: showBankDetails
                                                ? "rotate(180deg)"
                                                : "rotate(0deg)",
                                        }}
                                    />
                                </span>
                            </label>

                            {showBankDetails && (
                                <>
                                    {/* bank row 1st */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, 1fr)",
                                            columnGap: "20px",
                                        }}
                                    >
                                        {/* bank name */}
                                        <div className="mb-3 w-100">
                                            <label
                                                className="supplierlabel mb-1"
                                                style={{ color: "#727681", fontSize: "12px" }}
                                            >
                                                Bank Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter Bank Name"
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
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                            />
                                            {errors.bankName && (
                                                <p className="text-danger">{errors.bankName}</p>
                                            )}
                                        </div>

                                        {/* account number */}
                                        <div className="mb-3 w-100">
                                            <label
                                                className="supplierlabel mb-1"
                                                style={{ color: "#727681", fontSize: "12px" }}
                                            >
                                                Account Number
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Enter Account Number"
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
                                                value={accountNumber}
                                                onChange={(e) => setAccountNumber(e.target.value)}
                                            />
                                            {errors.accountNumber && (
                                                <p className="text-danger">{errors.accountNumber}</p>
                                            )}
                                        </div>

                                        {/* account holder name */}
                                        <div className="mb-3 w-100">
                                            <label
                                                className="supplierlabel mb-1"
                                                style={{ color: "#727681", fontSize: "12px" }}
                                            >
                                                Account Holder Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter Account Holder Name"
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
                                                value={accountHolderName}
                                                onChange={(e) => setAccountHolderName(e.target.value)}
                                            />
                                            {errors.accountHolderName && (
                                                <p className="text-danger">{errors.accountHolderName}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* bank row 2nd */}
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(3, 1fr)",
                                            columnGap: "20px",
                                        }}
                                    >
                                        {/* Account Type */}
                                        <div className="mb-3 w-100">
                                            <label
                                                className="supplierlabel mb-1"
                                                style={{ color: "#727681", fontSize: "12px" }}
                                            >
                                                Account Type
                                            </label>
                                            <select
                                                value={accountType}
                                                onChange={(e) => setAccountType(e.target.value)}
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
                                                <option value="savings">Savings</option>
                                                <option value="current">Current</option>
                                            </select>
                                            {errors.accountType && (
                                                <p className="text-danger">{errors.accountType}</p>
                                            )}
                                        </div>

                                        {/* ifsc code */}
                                        <div className="mb-3 w-100">
                                            <label
                                                className="supplierlabel mb-1"
                                                style={{ color: "#727681", fontSize: "12px" }}
                                            >
                                                IFSC Code
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter IFSC Code"
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
                                                value={ifscCode}
                                                onChange={(e) => setIfscCode(e.target.value)}
                                            />
                                            {errors.ifscCode && (
                                                <p className="text-danger">{errors.ifscCode}</p>
                                            )}
                                        </div>

                                        {/* branch name */}
                                        <div className="mb-3 w-100">
                                            <label
                                                className="supplierlabel mb-1"
                                                style={{ color: "#727681", fontSize: "12px" }}
                                            >
                                                Branch Name
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Enter Branch Name"
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
                                                value={branch}
                                                onChange={(e) => setBranch(e.target.value)}
                                            />
                                            {errors.branch && (
                                                <p className="text-danger">{errors.branch}</p>
                                            )}
                                        </div>
                                    </div>
                                </>)}

                            <hr style={{ height: "1.2px", backgroundColor: "#EAEAEA" }} />

                            {/* upload row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(3, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* aadhar card */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Aadhar Card
                                    </label>

                                    {/* ── Show existing Cloudinary image ── */}
                                    {!files.aadhaarCard && existingFiles.aadhaarCard ? (
                                        <div style={{ position: "relative", border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                                            <a href={existingFiles.aadhaarCard.url} target="_blank" rel="noreferrer"
                                                style={{ color: "#1F7FFF", fontSize: "14px", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                                                <img src={existingFiles.aadhaarCard.url} alt="Aadhaar Card" style={{ width: "80px", height: "80px", borderRadius: "8px" }} />
                                            </a>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    style={{ position: "absolute", top: 0, left: "60%", color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                    onClick={() => setExistingFiles(prev => ({ ...prev, aadhaarCard: null }))}
                                                >
                                                    <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                </button>)}
                                        </div>
                                    ) : (
                                        /* ── New file picker ── */
                                        <>
                                            {!isViewMode ? (
                                                <div onClick={() => document.getElementById("aadhaarCard").click()}
                                                    style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    <span style={{ color: "#0E101A", fontSize: "14px" }}>
                                                        {files.aadhaarCard ? getShortName(files.aadhaarCard.name) : "Upload"}
                                                    </span>
                                                    {files.aadhaarCard ? (
                                                        <button type="button"
                                                            style={{ color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                            onClick={(e) => { e.stopPropagation(); removeFile("aadhaarCard"); }}>
                                                            <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                        </button>
                                                    ) : (
                                                        <GoUpload style={{ fontSize: "18px", color: "#0E101A" }} />
                                                    )}
                                                    <input id="aadhaarCard" type="file" onChange={(e) => handleFileChange(e, "aadhaarCard")} style={{ display: "none" }} />
                                                </div>) : (
                                                <div style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    Not Uploaded
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* pan card */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        PAN Card
                                    </label>

                                    {!files.panCard && existingFiles.panCard ? (
                                        <div style={{ position: "relative", border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                                            <a href={existingFiles.panCard.url} target="_blank" rel="noreferrer"
                                                style={{ color: "#1F7FFF", fontSize: "14px", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                                                <img src={existingFiles.panCard.url} alt="PAN Card" style={{ width: "80px", height: "80px", borderRadius: "8px" }} />
                                            </a>
                                            {!isViewMode && (
                                                <button type="button"
                                                    style={{ position: "absolute", top: 0, left: "60%", color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                    onClick={() => setExistingFiles(prev => ({ ...prev, panCard: null }))}
                                                >
                                                    <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                </button>)}
                                        </div>
                                    ) : (
                                        <>
                                            {!isViewMode ? (
                                                <div onClick={() => document.getElementById("panCard").click()}
                                                    style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    <span style={{ color: "#0E101A", fontSize: "14px" }}>
                                                        {files.panCard ? getShortName(files.panCard.name) : "Upload"}
                                                    </span>
                                                    {files.panCard ? (
                                                        <button type="button"
                                                            style={{ color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                            onClick={(e) => { e.stopPropagation(); removeFile("panCard"); }}>
                                                            <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                        </button>
                                                    ) : (
                                                        <GoUpload style={{ fontSize: "18px", color: "#0E101A" }} />
                                                    )}
                                                    <input id="panCard" type="file" onChange={(e) => handleFileChange(e, "panCard")} style={{ display: "none" }} />
                                                </div>) : (
                                                <div style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    Not Uploaded
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* license card */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        License Card
                                    </label>

                                    {!files.licenseCard && existingFiles.licenseCard ? (
                                        <div style={{ position: "relative", border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                                            <a href={existingFiles.licenseCard.url} target="_blank" rel="noreferrer"
                                                style={{ color: "#1F7FFF", fontSize: "14px", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                                                <img src={existingFiles.licenseCard.url} alt="License Card" style={{ width: "80px", height: "80px", borderRadius: "8px" }} />
                                            </a>
                                            {!isViewMode && (
                                                <button type="button"
                                                    style={{ position: "absolute", top: "0", left: "60%", color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                    onClick={() => setExistingFiles(prev => ({ ...prev, licenseCard: null }))}
                                                >
                                                    <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                </button>)}
                                        </div>
                                    ) : (
                                        <>
                                            {!isViewMode ? (
                                                <div onClick={() => document.getElementById("licenseCard").click()}
                                                    style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    <span style={{ color: "#0E101A", fontSize: "14px" }}>
                                                        {files.licenseCard ? getShortName(files.licenseCard.name) : "Upload"}
                                                    </span>
                                                    {files.licenseCard ? (
                                                        <button type="button"
                                                            style={{ color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                            onClick={(e) => { e.stopPropagation(); removeFile("licenseCard"); }}>
                                                            <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                        </button>
                                                    ) : (
                                                        <GoUpload style={{ fontSize: "18px", color: "#0E101A" }} />
                                                    )}
                                                    <input id="licenseCard" type="file" onChange={(e) => handleFileChange(e, "licenseCard")} style={{ display: "none" }} />
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
                            {!isViewMode && (
                                <button
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

export default AddDriver;
