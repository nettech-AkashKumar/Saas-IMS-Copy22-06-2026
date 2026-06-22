import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Country, State, City } from "country-state-city";
import Select from "react-select";

// pages
import api from "../../../pages/config/axiosInstance";
import { sanitizeInput } from "../../../utils/sanitize";

// icons
import { CiCirclePlus } from "react-icons/ci";
import { IoCloseCircleOutline } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { GoUpload } from "react-icons/go";

const AddBroker = ({ fetchBrokers, cleanUpModal, closeModal, show, editData, viewData }) => {

    const { t } = useTranslation();
    const isEditMode = !!editData; // true when editing
    const isViewMode = !!viewData;

    const [comissionType, setComissionType] = useState("");
    const [brokerName, setBrokerName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [email, setEmail] = useState("");
    const [assignSalesman, setAssignSalesman] = useState([]);
    const [brokerImage, setBrokerImage] = useState("");
    const [brokersList, setBrokersList] = useState([]);
    const [brokerTotalItems, setBrokerTotalItems] = useState(0);
    const [salesman, setSalesman] = useState([]);
    const [salesmanTotalItems, setSalesmanTotalItems] = useState(0);

    // country - state - city
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);

    // gst
    const [gstin, setGstin] = useState("");
    const [isGstinVerified, setIsGstinVerified] = useState(false);
    const [gstVerifyButton, setGstVerifyButton] = useState(false);
    const [gstError, setGstError] = useState(null);
    const [gstResponse, setGstResponse] = useState(null);
    const [gstLoading, setGstLoading] = useState(false);
    const [gstVerified, setGstVerified] = useState(false);

    const [successMessage, setSuccessMessage] = useState(false);
    const [frontErrorMessage, setFrontErrorMessage] = useState("");
    const [errors, setErrors] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(false);

    const brokerNameRegex = /^[a-zA-Z\s]+$/;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

    const [form, setForm] = useState({
        address: "",
        country: "",
        state: "",
        city: "",
        pincode: "",
    });

    // Enhanced real-time validation
    const validateField = (name, value) => {
        if (!value.trim()) {
            if (["name", "phone"].includes(name)) return "This field is required";
            return "";
        }

        switch (name) {
            case "name": // Allows letters with single spaces between words
                if (value.trim().length < 2) {
                    return "Customer name must be at least 2 characters";
                }
                return "";
            case "phone":
                return /^\d{10}$/.test(value)
                    ? ""
                    : "Enter valid 10-digit phone number";
            case "email":
                return /^\S+@\S+\.\S+$/.test(value) ? "" : "Invalid email address";
            case "pincode":
                return /^\d{6}$/.test(value) ? "" : "Enter valid 6-digit pincode";
            case "gstin":
                return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
                    value,
                )
                    ? ""
                    : "Invalid GSTIN format";
            default:
                return "";
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const sanitized = sanitizeInput(value);
        const error = validateField(name, sanitized);

        setErrors((prev) => ({ ...prev, [name]: error }));
        setForm((prev) => ({ ...prev, [name]: sanitized }));

        if (name === "gstin") {
            setGstError(null);
            setGstVerified(false);
            setErrors((prev) => ({
                ...prev,
                gstin: error
            }))
        }
    };

    // Add this state after the files state
    const [existingFiles, setExistingFiles] = useState({
        brokerImage: null,
    });

    // Country/State/City options
    const countryOptions = Country.getAllCountries().map((c) => ({
        value: c.isoCode,
        label: c.name,
    }));

    const stateOptions = selectedCountry
        ? State.getStatesOfCountry(selectedCountry.value).map((s) => ({
            value: s.isoCode,
            label: s.name,
        }))
        : [];

    const cityOptions = selectedState
        ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map(
            (c) => ({
                value: c.name,
                label: c.name,
            }),
        )
        : [];

    // Dropdown handlers
    const handleCountryChange = (option) => {
        setSelectedCountry(option);
        setSelectedState(null);
        setSelectedCity(null);
        setForm((prev) => ({
            ...prev,
            country: option ? option.label : "",
            state: "",
            city: "",
        }));
        setErrors((prev) => ({ ...prev, country: "", state: "", city: "" }));
    };

    const handleStateChange = (option) => {
        setSelectedState(option);
        setSelectedCity(null);
        setForm((prev) => ({
            ...prev,
            state: option ? option.label : "",
            city: "",
        }));
        setErrors((prev) => ({ ...prev, state: "", city: "" }));
    };

    const handleCityChange = (option) => {
        setSelectedCity(option);
        setForm((prev) => ({ ...prev, city: option ? option.value : "" }));
        setErrors((prev) => ({ ...prev, city: "" }));
    };

    const toDateInput = (val) => {
        if (!val) return "";
        const d = new Date(val);
        if (isNaN(d)) return "";
        return d.toISOString().split("T")[0];
    };

    const resetForm = () => {
        setComissionType("");
        setBrokerName("");
        setPhoneNumber("");
        setEmail("");
        setAssignSalesman([]);
        setErrors({});
        setFrontErrorMessage("");
        setFiles({ brokerImage: null });
        setExistingFiles({ brokerImage: null });
        setGstin("");
        setForm({ address: "", country: "", state: "", city: "", pincode: "" });
        setSelectedCountry(null);
        setSelectedState(null);
        setSelectedCity(null);
    };

    const modalData = editData || viewData;

    useEffect(() => {
        if (!show) return; // only run when modal opens

        if (modalData) {
            // ── Edit mode: pre-fill fields ──────────────────────
            setComissionType(modalData.comissionType || "");
            setBrokerName(modalData.brokerName || "");
            setPhoneNumber(modalData.phoneNumber || "");
            setEmail(modalData.email || "");
            setGstin(modalData.gstin || "");
            setAssignSalesman(
                Array.isArray(modalData?.assignSalesman)
                    ? modalData.assignSalesman.map((s) => s._id || s)
                    : modalData?.assignSalesman?._id
                        ? [modalData.assignSalesman._id]
                        : []
            );

            setForm({
                address: modalData.address || "",
                country: modalData.country || "",
                state: modalData.state || "",
                city: modalData.city || "",
                pincode: modalData.pincode || "",
            });

            if (modalData.country) {
                const country = Country.getAllCountries().find(c => c.name === modalData.country);
                if (country) {
                    const countryOption = { value: country.isoCode, label: country.name };
                    setSelectedCountry(countryOption);

                    if (modalData.state) {
                        const state = State.getStatesOfCountry(country.isoCode).find(s => s.name === modalData.state);
                        if (state) {
                            setSelectedState({ value: state.isoCode, label: state.name });
                        }
                    }
                }
            }

            if (modalData.city) {
                setSelectedCity({ value: modalData.city, label: modalData.city });
            }

            if (modalData.pincode) {
                setForm((prev) => ({ ...prev, pincode: modalData.pincode }));
            }

            setExistingFiles({
                brokerImage: modalData.brokerImage?.[0] || null,
            });

            setFiles({ brokerImage: null });

        } else {
            resetForm();
            setExistingFiles({ brokerImage: null });
        }

        setErrors({});
        setFrontErrorMessage("");
        setSuccessMessage(false);
    }, [show, modalData]); // ✅ triggers on every open

    useEffect(() => {
    }, [show]);

    const [files, setFiles] = useState({
        brokerImage: null,
    });

    const handleFileChange = (e, field) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const allowedTypes = ["image/jpeg", "image/png"];

            // Reset input so same file can be re-selected after error
            e.target.value = "";

            if (!allowedTypes.includes(file.type)) {
                setFrontErrorMessage("Only JPEG and PNG images are allowed.");
                return;
            }

            if (file.size > 1 * 1024 * 1024) { // 1MB
                setFrontErrorMessage("Image size must be less than 1MB.");
                return;
            }

            setFrontErrorMessage(""); // clear any previous error
            setFiles({ ...files, [field]: file });
        }
    };

    const getShortName = (name) => {
        if (!name) return "Upload";

        const ext = name.split(".").pop(); // pdf, png
        const base = name.substring(0, 3); // first 4 letters

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

    const fetchSalesmen = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/salesman/get");
            const data = res.data.salesman || [];
            setSalesman(data);
            setSalesmanTotalItems(res.data.total || 0);
        } catch (error) {
            toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || "Failed to load salesmen");
        } finally {
            setLoading(false);
        }
    };

    const handleAddBroker = async (e) => {
        e.preventDefault();
        let newErrors = {};

        if (!comissionType) {
            newErrors.comissionType = "Please select a comission type";
        }
        if (!brokerName) {
            newErrors.brokerName = t(
                "Broker name is required."
            );
        }
        else if (!brokerNameRegex.test(brokerName)) {
            newErrors.brokerName = t(
                "Broker name must be only letters and spaces"
            );
        }
        if (!phoneNumber || phoneNumber.length !== 10) {
            newErrors.phoneNumber = t(
                "Phone number must be of 10 digits"
            );
        }
        if (!email) {
            newErrors.email = t(
                "Email is required"
            );
        }
        if (gstin && !gstinRegex.test(gstin)) {
            newErrors.gstin = t(
                "GSTIN is incorrect. Please enter a valid GSTIN."
            );
        }

        if (!assignSalesman || assignSalesman.length === 0) {
            newErrors.assignSalesman = "Please assign at least one salesman.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const formData = new FormData();
        if (comissionType) formData.append("comissionType", comissionType);
        if (brokerName) formData.append("brokerName", brokerName);
        if (phoneNumber) formData.append("phoneNumber", phoneNumber);
        if (email) formData.append("email", email);
        if (gstin) formData.append("gstin", gstin);
        assignSalesman.forEach((id) => formData.append("assignSalesman[]", id));
        if (files.brokerImage) formData.append("brokerImage", files.brokerImage);
        if (form.address) formData.append("address", form.address);
        if (form.country) formData.append("country", form.country);
        if (form.state) formData.append("state", form.state);
        if (form.city) formData.append("city", form.city);
        if (form.pincode) formData.append("pincode", form.pincode);
        formData.append("removeBrokerImage", !files.brokerImage && !existingFiles.brokerImage ? "true" : "false");

        try {
            setIsAdding(true);

            if (isEditMode) {
                // ── UPDATE ──────────────────────────────────────────────────
                await api.put(`/api/broker/update/${editData._id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                // setSuccessMessage(true);
                toast.success(t("Broker updated successfully!"));
            } else {
                // ── CREATE ──────────────────────────────────────────────────
                await api.post("/api/broker/add", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                // setSuccessMessage(true);
                toast.success(t("Broker added successfully!"));
            }
            if (fetchBrokers) fetchBrokers();
            closeModal();
            resetForm();
        } catch (error) {
            const errorMessage =
                error.response?.data?.displayMessage ||
                error.response?.data?.message;

            if (errorMessage === "Broker Number already exists") {
                setFrontErrorMessage("Broker Phone Number already exists.");
            } else {
                setFrontErrorMessage(
                    errorMessage || "Failed to Save Broker. Please try again."
                );
            }
        } finally {
            setIsAdding(false);
        }
    };

    useEffect(() => {
        fetchSalesmen();
    }, []);

    return (
        <div
            id="add-broker"
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
                    minWidth: "770px",
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
                                    Broker Successfully {isEditMode ? "Updated" : "Created"}
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
                            {isViewMode ? "View Broker" : isEditMode ? "Edit Broker" : "Add Broker"}
                        </h5>
                    </div>

                    {/* inputs */}
                    <form onSubmit={handleAddBroker}>
                        <div className="modal-body">

                            {/* upload row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Broker Image <span className="" style={{ fontSize: '10px', }}>(Size: Less than 1MB, Type: JPEG, PNG)</span>
                                    </label>

                                    {/* ── Show existing Cloudinary image ── */}
                                    {!files.brokerImage && existingFiles.brokerImage ? (
                                        <div style={{ position: "relative", border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                                            <a href={existingFiles.brokerImage.url} target="_blank" rel="noreferrer"
                                                style={{ color: "#1F7FFF", fontSize: "14px", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                                                <img src={existingFiles.brokerImage.url} alt="Broker Image" style={{ width: "80px", height: "80px", borderRadius: "8px" }} />
                                            </a>
                                            {!isViewMode && (
                                                <button
                                                    type="button"
                                                    style={{ position: "absolute", top: 0, left: "60%", color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                    onClick={() => setExistingFiles(prev => ({ ...prev, brokerImage: null }))}
                                                >
                                                    <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                </button>)}
                                        </div>
                                    ) : (
                                        <>
                                            {!isViewMode ? (
                                                <div onClick={() => document.getElementById("brokerImage").click()}
                                                    style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    <span style={{ color: "#0E101A", fontSize: "14px" }}>
                                                        {files.brokerImage ? getShortName(files.brokerImage.name) : "Upload"}
                                                    </span>
                                                    {files.brokerImage ? (
                                                        <button type="button"
                                                            style={{ color: "red", border: "2px solid red", borderRadius: "50%", backgroundColor: "transparent", width: "20px", height: "20px", cursor: "pointer", flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}
                                                            onClick={(e) => { e.stopPropagation(); removeFile("brokerImage"); }}>
                                                            <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                                                        </button>
                                                    ) : (
                                                        <GoUpload style={{ fontSize: "18px", color: "#0E101A" }} />
                                                    )}
                                                    <input
                                                        id="brokerImage"
                                                        type="file"
                                                        accept="image/jpeg,image/png"
                                                        onChange={(e) => handleFileChange(e, "brokerImage")}
                                                        style={{ display: "none" }}
                                                    />
                                                </div>) : (
                                                <div style={{ border: "1px solid #EAEAEA", padding: "8px 12px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                    Not Uploaded
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 1st row*/}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* broker name */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Broker Name <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t("Enter Broker Name")}
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
                                        value={brokerName}
                                        onChange={(e) => setBrokerName(e.target.value)}
                                    />
                                    {errors.brokerName && (
                                        <p className="text-danger">{errors.brokerName}</p>
                                    )}
                                </div>

                                {/* gstin */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        GSTIN
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={t("Enter GSTIN")}
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
                                        value={gstin}
                                        onChange={(e) => setGstin(e.target.value)}
                                    />
                                    {errors.gstin && (
                                        <p className="text-danger">{errors.gstin}</p>
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
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                            setPhoneNumber(value);
                                            setFrontErrorMessage("");
                                        }}
                                    />
                                    {errors.phoneNumber && (
                                        <p className="text-danger">{errors.phoneNumber}</p>
                                    )}
                                </div>

                                {/* email id */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Email Id <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder={t("Enter Email Id")}
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                    {errors.email && (
                                        <p className="text-danger">{errors.email}</p>
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
                                {/* comission type */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Comission Type <span className="text-danger">*</span>
                                    </label>
                                    <select
                                        value={comissionType}
                                        onChange={(e) => setComissionType(e.target.value)}
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
                                        <option value="Percentage">Percentage</option>
                                        <option value="Currency">Currency</option>
                                    </select>
                                    {errors.comissionType && (
                                        <p className="text-danger">{errors.comissionType}</p>
                                    )}
                                </div>

                                {/* assign salesman */}
                                <div className="mb-3 w-100">
                                    <label
                                        className="supplierlabel mb-1"
                                        style={{ color: "#727681", fontSize: "12px" }}
                                    >
                                        Assign Salesman <span className="text-danger">*</span>
                                    </label>
                                    <Select
                                        isMulti
                                        isDisabled={isViewMode}
                                        placeholder="Select Salesman"
                                        options={salesman.map((s) => ({
                                            value: s._id,
                                            label: s.salesmanName || "-",
                                        }))}
                                        value={salesman
                                            .filter((s) => assignSalesman.includes(s._id))
                                            .map((s) => ({ value: s._id, label: s.salesmanName || "-" }))}
                                        onChange={(selectedOptions) => {
                                            setAssignSalesman(
                                                selectedOptions ? selectedOptions.map((o) => o.value) : []
                                            );
                                        }}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                border: "1px solid #E6EAED",
                                                backgroundColor: "#ffffff",
                                                fontSize: "0.875rem",
                                                fontWeight: "400",
                                                borderRadius: "0.35rem",
                                                padding: "0rem 6px",
                                                width: "100%",
                                                outline: "none",
                                                boxShadow: "none",
                                                minHeight: "40px",
                                            }),
                                        }}
                                    />
                                    {errors.assignSalesman && (
                                        <p className="text-danger">{errors.assignSalesman}</p>
                                    )}
                                </div>
                            </div>

                            {/* 4th row */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(1, 1fr)",
                                    columnGap: "20px",
                                }}
                            >
                                {/* Address */}
                                <div className="mb-3">
                                    <label className="form-label supplierlabel">Address</label>
                                    <textarea
                                        name="address"
                                        value={form.address}
                                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                                        disabled={isViewMode}
                                        className="form-control supplierinput shadow-none"
                                        rows="4"
                                        placeholder="Enter Full Address"
                                        style={{ border: "1px dashed #EAEAEA" }}
                                    />
                                </div>

                                {/* Country, State, City Dropdowns */}
                                <div className="d-flex flex-wrap justify-content-between">
                                    <div className="col-3 mb-3" style={{ paddingRight: '20px' }}>
                                        <label className="form-label supplierlabel">
                                            Country
                                        </label>
                                        <Select
                                            options={countryOptions}
                                            value={selectedCountry}
                                            onChange={handleCountryChange}
                                            placeholder="Select Country"
                                            className="supplierinput"
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    boxShadow: "none",
                                                    borderColor: "#ced4da",
                                                }),
                                            }}
                                        />
                                        {errors.country && (
                                            <small className="text-danger">{errors.country}</small>
                                        )}
                                    </div>

                                    <div className="col-3 mb-3" style={{ paddingRight: '20px' }}>
                                        <label className="form-label supplierlabel">
                                            State
                                        </label>
                                        <Select
                                            options={stateOptions}
                                            value={selectedState}
                                            onChange={handleStateChange}
                                            placeholder="Select State"
                                            isDisabled={!selectedCountry}
                                            className="supplierinput"
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    boxShadow: "none",
                                                    borderColor: "#ced4da",
                                                }),
                                            }}
                                        />
                                        {errors.state && (
                                            <small className="text-danger">{errors.state}</small>
                                        )}
                                    </div>

                                    <div className="col-3 mb-3" style={{ paddingRight: '10px' }}>
                                        <label className="form-label supplierlabel">
                                            City
                                        </label>
                                        <Select
                                            options={cityOptions}
                                            value={selectedCity}
                                            onChange={handleCityChange}
                                            placeholder="Select City"
                                            isDisabled={!selectedState}
                                            className="supplierinput"
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    boxShadow: "none",
                                                    borderColor: "#ced4da",
                                                }),
                                            }}
                                        />
                                        {errors.city && (
                                            <small className="text-danger">{errors.city}</small>
                                        )}
                                    </div>

                                    <div className="col-3 mb-3" style={{ paddingLeft: "10px" }}>
                                        <label className="form-label supplierlabel">Pin code</label>
                                        <input
                                            type="number"
                                            name="pincode"
                                            value={form.pincode}
                                            onChange={handleChange}
                                            className="form-control supplierinput shadow-none"
                                            placeholder="Enter Pin Code"
                                            maxLength="6"
                                        />
                                        {errors.pincode && (
                                            <small className="text-danger">{errors.pincode}</small>
                                        )}
                                    </div>
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

export default AddBroker;