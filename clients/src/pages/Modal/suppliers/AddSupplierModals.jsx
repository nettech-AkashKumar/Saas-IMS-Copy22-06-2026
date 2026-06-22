import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Supplier.css";
import { GoChevronUp, GoChevronDown } from "react-icons/go";
import { RxCross2 } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { Country, State, City } from "country-state-city";
import Select from "react-select";
import DOMPurify from "dompurify";
import { useEffect } from "react";
import { RiVerifiedBadgeLine } from "react-icons/ri";

const businessTypeOptions = [
  { value: "Manufacturer", label: "Manufacturer" },
  { value: "Distributor", label: "Distributor" },
  { value: "Wholesaler", label: "Wholesaler" },
];

const AddSupplier = ({ onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [showAddress, setShowAddress] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [frontErrorMessage, setFrontErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [gstVerifyButton, setGstVerifyButton] = useState(false);

  // Country/State/City
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  // for category
  const [category, setCategory] = useState(false);

  const [form, setForm] = useState({
    supplierName: "",
    businessType: "",
    phone: "",
    email: "",
    gstin: "",
    categoryBrand: "",
    address: {
      addressLine: "",
      country: "",
      state: "",
      city: "",
      pincode: "",
    },
    bank: {
      bankName: "",
      accountNumber: "",
      ifsc: "",
      branch: "",
    },
    status: true,
  });

  /* ================= SANITIZE ================= */
  const sanitize = (value) =>
    DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

  /* ================= VALIDATION ================= */
  const validateField = (name, value) => {
    if (!value.trim()) {
      if (["supplierName", "phone", "businessType"].includes(name))
        return "This field is required";
      return "";
    }

    switch (name) {
      case "supplierName":
        // Check minimum length
        if (value.trim().length < 2) {
          return "Supplier name must be at least 2 characters";
        }
        return "";

      case "phone":
        return /^\d{10}$/.test(value)
          ? ""
          : "Enter valid 10-digit phone number";
      case "email":
        return /^\S+@\S+\.\S+$/.test(value) ? "" : "Invalid email address";
      case "gstin":
        return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value)
          ? ""
          : "Invalid GSTIN";
      case "pincode":
        return /^\d{6}$/.test(value) ? "" : "Invalid pincode";
      // ✅ Account Number Validation
      case "accountNumber":
        return /^\d{9,18}$/.test(value)
          ? ""
          : "Account number must be 9-18 digits";

      // ✅ IFSC Validation
      case "ifsc":
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value)
          ? ""
          : "Invalid IFSC code";
      default:
        return "";
    }
  };

  /* ================= INPUT HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const clean = sanitize(value);
    const error = validateField(name, clean);

    setErrors((p) => ({ ...p, [name]: error }));
    setForm((p) => ({ ...p, [name]: clean }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    const clean = sanitize(value);
    const error = validateField(name, clean);

    setErrors((p) => ({ ...p, [name]: error }));
    setForm((p) => ({
      ...p,
      address: { ...p.address, [name]: clean },
    }));
  };

  // const handleBankChange = (e) => {
  //   const { name, value } = e.target;
  //   setForm((p) => ({
  //     ...p,
  //     bank: { ...p.bank, [name]: sanitize(value) },
  //   }));
  // };
  const handleBankChange = (e) => {
    const { name, value } = e.target;

    let cleanValue = sanitize(value);

    // Only digits for account number
    if (name === "accountNumber") {
      cleanValue = cleanValue.replace(/\D/g, "");
    }

    // Uppercase IFSC
    if (name === "ifsc") {
      cleanValue = cleanValue.toUpperCase();
    }

    const error = validateField(name, cleanValue);

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));

    setForm((prev) => ({
      ...prev,
      bank: {
        ...prev.bank,
        [name]: cleanValue,
      },
    }));

    // Auto fetch IFSC details only if valid
    if (
      name === "ifsc" &&
      /^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanValue)
    ) {
      fetchBankDetails(cleanValue);
    }
  };

  /* ================= COUNTRY / STATE / CITY ================= */
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
      (c) => ({ value: c.name, label: c.name }),
    )
    : [];

  const handleCountryChange = (opt) => {
    setSelectedCountry(opt);
    setSelectedState(null);
    setSelectedCity(null);
    setForm((p) => ({
      ...p,
      address: { ...p.address, country: opt?.label || "", state: "", city: "" },
    }));
  };

  const handleStateChange = (opt) => {
    setSelectedState(opt);
    setSelectedCity(null);
    setForm((p) => ({
      ...p,
      address: { ...p.address, state: opt?.label || "", city: "" },
    }));
  };

  const handleCityChange = (opt) => {
    setSelectedCity(opt);
    setForm((p) => ({
      ...p,
      address: { ...p.address, city: opt?.value || "" },
    }));
  };

  /* ================= FINAL SUBMIT ================= */
  const validateForm = () => {
    const e = {};
    if (!form.supplierName?.trim()) {
      e.supplierName = "Supplier name required";
    } else if (/\d/.test(form.supplierName)) {
      e.supplierName = "Supplier name cannot contain numbers";
    }
    if (!form.phone) e.phone = "Phone required";
    if (!form.businessType) e.businessType = "Business type required";
    // if (!selectedCountry) e.country = "Country required";
    // if (!selectedState) e.state = "State required";
    // if (!selectedCity) e.city = "City required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (form.gstin && !gstVerified && gstVerifyButton) {
      // toast.error("Please verify GSTIN before saving");
      setErrors((prev) => ({
        ...prev,
        gstin: "Please verify GSTIN before saving"
      }))
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/suppliers", form);
      // toast.success("Supplier created successfully");
      setSuccessMessage(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        // navigate("/supplier-list");
        onClose();
      }, 1500);
    } catch (err) {
      // toast.error(err?.response?.data?.message || "Failed to create supplier");
      const errMsg = err?.response?.data?.message || "Failed to create supplier";
      if (err?.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setFrontErrorMessage(errMsg);
        setTimeout(() => {
          setFrontErrorMessage("");
        }, 3000)
      }
    } finally {
      setLoading(false);
    }
  };

  // filling ifsc code and account no it will fetch bank name, branch name auto by ifsc api
  const fetchBankDetails = async (ifsc) => {
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
      if (!res.ok) {
        throw new Error("Invalid IFSC");
      }

      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        bank: {
          ...prev.bank,
          bankName: data.BANK,
          branch: data.BRANCH,
        },
      }));
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        ifsc: "Invalid IFSC Code",
      }));
      setFrontErrorMessage("Invalid IFSC Code");
      setTimeout(() => {
        setFrontErrorMessage("");
      }, 3000);
      setForm((prev) => ({
        ...prev,
        bank: {
          ...prev.bank,
          bankName: "",
          branch: "",
        },
      }));
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/category/categories");
      setCategory(res.data);
    } catch (error) {
      // console.error("Error fetching categories", error);
      setFrontErrorMessage(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        "Error fetching categories");
      setTimeout(() => {
        setFrontErrorMessage("");
      }, 3000);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const categoryOptions = Array.isArray(category)
    ? category.map((cat) => ({
      value: cat.categoryName,
      label: cat.categoryName,
    }))
    : [];

  // GST Verify State
  const [gstError, setGstError] = useState(null);
  const [gstResponse, setGstResponse] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);

  // GST Verify Logic
  const handleSearch = async () => {
    const gst = (form.gstin || "").trim().toUpperCase();

    if (!gst) {
      setGstError("Please enter a GSTIN.");
      setGstVerified(false);
      return;
    }

    // optional: frontend format check before API call
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    if (!gstRegex.test(gst)) {
      setErrors((prev) => ({
        ...prev,
        gstin: "Invalid GSTIN format",
      }));
      return;
    }

    setGstLoading(true);
    setGstError(null);
    setGstVerified(false);
    setGstResponse(null);

    try {
      const res = await api.get(`/api/gst/${encodeURIComponent(gst)}`);
      const data = res.data;
      setGstResponse(data);
      const verified = data && data.error === false;
      if (verified) {
        setGstVerified(true);
        setErrors((prev) => ({
          ...prev,
          gstin: "",
        }))
      } else {
        setGstVerified(false);
        setErrors((prev) => ({
          ...prev,
          gstin: "GST is not verified"
        }));
        setFrontErrorMessage("GST is not verified");
        setTimeout(() => {
          setFrontErrorMessage("");
        }, 3000);
      }
    } catch (err) {
      setGstError(
        err?.response?.data?.message || err?.response?.data || err.message,
      );
      setGstVerified(false);
      setErrors((prev) => ({
        ...prev,
        gstin: "GST verification failed",
      }));
      setFrontErrorMessage("GST verification failed");
      setTimeout(() => {
        setFrontErrorMessage("");
      }, 3000);
    } finally {
      setGstLoading(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      style={{
        backgroundColor: " rgba(0, 0, 0, 0.27)",
        backdropFilter: "blur(1px)",
      }}
    >
      <div className="modal-dialog modal-lg" style={{}}>
        <div className="modal-content">
          <div
            className="modal-header"
            style={{
              borderBottom: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "end",
              borderRadius: "50%",
              padding: "15px 15px",
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
              onClick={onClose}
            >
              <RxCross2
                style={{ color: "#727681", fontSize: "15px", fontWeight: 900 }}
              />
            </button>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              margin: "10px 20px",
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
              Add Supplier
            </h5>
            {/* Business Type Dropdown */}
            <div
              style={{
                marginLeft: "inherit",
                width: "220px",
                position: "relative",
              }}
            >
              <Select
                options={businessTypeOptions}
                value={businessTypeOptions.find(
                  (opt) => opt.value === form.businessType,
                )}
                onChange={(selected) =>
                  setForm((p) => ({
                    ...p,
                    businessType: selected?.value || "",
                  }))
                }
                placeholder="Business Type..."
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    minHeight: "38px",
                    boxShadow: "none",
                  }),
                }}
              />
              {errors.businessType && (
                <small
                  style={{
                    position: "absolute",
                    top: "42px",
                    left: 2,
                    fontSize: "12px",
                  }}
                  className="text-danger"
                >
                  {errors.businessType}
                </small>
              )}
            </div>
          </div>

          <div className="modal-body">
            <div className="d-flex flex-wrap justify-content-between">
              {/* Supplier Name */}
              <div className="col-6 mb-3" style={{ paddingRight: '20px' }}>
                <label className="form-label supplierlabel">
                  Supplier Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter Name"
                  name="supplierName"
                  value={form.supplierName}
                  onChange={(e) => {
                    handleChange(e);
                  }}
                />
                {errors.supplierName && (
                  <small className="text-danger d-block mt-1">
                    {errors.supplierName}
                  </small>
                )}
              </div>

              {/* GSTIN */}
              <div className="col-6 mb-3" style={{ paddingLeft: "20px" }}>
                <label className="form-label supplierlabel">
                  GSTIN (optional)
                </label>

                <div className="d-flex align-items-center form-control supplierinput shadow-none">
                  <input
                    type="text"
                    placeholder="Enter GSTIN"
                    name="gstin"
                    value={form.gstin}
                    onChange={(e) => {
                      const upper = e.target.value.toUpperCase();
                      handleChange({ target: { name: "gstin", value: upper } });
                      setGstError(null);
                      setGstVerified(false);
                    }}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                    }}
                  />

                  {!gstVerified && !gstLoading && form.gstin && (
                    <>
                      {gstVerifyButton && (
                        <button
                          type="button"
                          onClick={handleSearch}
                          style={{
                            padding: "2px 8px",
                            background: "rgb(31, 127, 255)",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "13px",
                            border: "none",
                            marginLeft: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Verify
                        </button>
                      )}
                    </>
                  )}

                  {/* Show Verifying text */}
                  {gstLoading && (
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#1f7fff",
                        marginLeft: "8px",
                      }}
                    >
                      Verifying...
                    </span>
                  )}

                  {/* Show Green Icon AFTER success */}
                  {gstVerified && !gstLoading && (
                    <RiVerifiedBadgeLine
                      style={{
                        color: "green",
                        fontSize: "22px",
                        marginLeft: "8px",
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="d-flex flex-wrap justify-content-between">
              {/* Phone No. */}
              <div className="col-6 mb-3" style={{ paddingRight: '20px' }}>
                <label className="form-label supplierlabel">
                  Phone No. <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span
                    className="input-group-text"
                    style={{ backgroundColor: "#fff" }}
                  >
                    <img
                      src="https://flagcdn.com/in.svg"
                      alt="India"
                      width="20"
                      className="me-1"
                    />
                    +91
                  </span>
                  <input
                    type="tel"
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter Phone"
                    name="phone"
                    value={form.phone}
                    maxLength={10}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, "");
                      handleChange({
                        target: {
                          name: "phone",
                          value: cleaned,
                        },
                      });
                    }}
                  />
                </div>
                {errors.phone && (
                  <small className="text-danger d-block mt-1">
                    {errors.phone}
                  </small>
                )}
              </div>

              {/* Email ID */}
              <div className="col-6 mb-3" style={{ paddingLeft: "20px" }}>
                <label className="form-label supplierlabel">Email Id</label>
                <input
                  type="email"
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter Email Id"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <small className="text-danger d-block mt-1">
                    {errors.email}
                  </small>
                )}
              </div>
            </div>

            {/* Add Address Section */}
            <div
              className="mb-3 d-flex justify-content-between align-items-center "
              style={{
                border: "1px solid #E5F0FF",
                borderRadius: "8px",
                padding: "8px 12px",
                backgroundColor: "#F3F8FB",
                cursor: "pointer",
              }}
              onClick={() => setShowAddress(!showAddress)}
            >
              <span
                className=" btn-link text-decoration-none p-0"
                style={{ color: "#0d6efd" }}
              >
                + Add Address
              </span>
              <span>{showAddress ? <GoChevronDown /> : <GoChevronUp />}</span>
            </div>

            {showAddress && (
              <>
                <div className="mb-3">
                  <label className="form-label supplierlabel">Address</label>
                  <textarea
                    className="form-control supplierinput shadow-none"
                    rows="2"
                    placeholder="Enter Full Address"
                    name="addressLine"
                    value={form.address.addressLine}
                    onChange={handleAddressChange}
                  />
                </div>

                <div className="d-flex flex-wrap justify-content-between">
                  <div className="col-3 mb-3" style={{ paddingRight: '20px' }}>
                    <label className="form-label supplierlabel">Country</label>
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

                  <div className="col-md-3 mb-3" style={{ paddingRight: '20px' }}>
                    <label className="form-label supplierlabel">State</label>
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

                  <div className="col-md-3 mb-3" style={{ paddingRight: '10px' }}>
                    <label className="form-label supplierlabel">City</label>
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

                  <div className="col-md-3 mb-3" style={{ paddingLeft: '10px' }}>
                    <label className="form-label supplierlabel">Pin code</label>
                    <input
                      type="text"
                      name="pincode"
                      value={form.address.pincode}
                      onChange={handleAddressChange}
                      className="form-control supplierinput shadow-none"
                      placeholder="Enter Pin Code"
                      maxLength="6"
                    />
                    {errors.pincode && (
                      <small className="text-danger">{errors.pincode}</small>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Add Bank Details */}
            <div
              className="mb-3 d-flex justify-content-between align-items-center"
              style={{
                border: "1px solid #E5F0FF",
                borderRadius: "8px",
                padding: "8px 12px",
                backgroundColor: "#F3F8FB",
                cursor: "pointer",
              }}
              onClick={() => setShowBank(!showBank)}
            >
              <span
                className=" btn-link text-decoration-none p-0"
                style={{ color: "#0d6efd" }}
              >
                + Add Bank Details
              </span>
              <span>{showBank ? <GoChevronDown /> : <GoChevronUp />}</span>
            </div>

            {showBank && (
              <>
                <div className="d-flex flex-wrap justify-content-between">
                  <div className="col-6 mb-3" style={{ paddingRight: '20px' }}>
                    <label className="form-label supplierlabel">
                      Account No.
                    </label>
                    <input
                      type="text"
                      className="form-control supplierinput shadow-none"
                      placeholder="Enter Account No"
                      name="accountNumber"
                      value={form.bank.accountNumber}
                      onChange={handleBankChange}
                      maxLength={18}
                    />
                    {errors.accountNumber && (
                      <small className="text-danger d-block mt-1">
                        {errors.accountNumber}
                      </small>
                    )}
                  </div>

                  <div className="col-6 mb-3" style={{ paddingLeft: "20px" }}>
                    <label className="form-label supplierlabel">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      className="form-control supplierinput shadow-none"
                      placeholder="Enter IFSC Code"
                      name="ifsc"
                      value={form.bank.ifsc}
                      maxLength={11}
                      onChange={handleBankChange}
                    />
                    {errors.ifsc && (
                      <small className="text-danger d-block mt-1">
                        {errors.ifsc}
                      </small>
                    )}
                  </div>
                </div>

                <div className="d-flex flex-wrap justify-content-between">
                  <div className="col-6 mb-3" style={{ paddingRight: '20px' }}>
                    <label className="form-label supplierlabel">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="Filled automatically via Account No. & IFSC"
                      className="form-control supplierinput shadow-none"
                      name="bankName"
                      value={form.bank.bankName}
                      readOnly
                    />
                  </div>

                  <div className="col-6 mb-3" style={{ paddingLeft: "20px" }}>
                    <label className="form-label supplierlabel">Branch</label>
                    <input
                      type="text"
                      placeholder="Filled automatically via Account No. & IFSC"
                      className="form-control supplierinput shadow-none"
                      name="branch"
                      value={form.bank.branch}
                      readOnly
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div
            className="modal-footer d-flex align-items-start justify-content-start"
            style={{ borderTop: "none" }}
          >
            <button
              onClick={handleSave}
              type="button"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* success message */}
        <div
          style={{
            position: "absolute",
            top: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "0 70px",
            boxSizing: "border-box",
            pointerEvents: "none",
          }}
        >
          {successMessage && (
            <div
              className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
              style={{
                border: "1px solid #0D6828",
                color: "#0D6828",
                background: "#EBFFF1",
                borderRadius: "8px",
                padding: "10px",
                margin: "15px 0",
              }}
            >
              <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                Supplier Successfully Created
              </label>
            </div>
          )}
          {frontErrorMessage && (
            <div className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
              style={{
                border: "1px solid #DC3545",
                color: "#DC3545",
                background: "#FFF1F3",
                borderRadius: "8px",
                padding: "10px",
                margin: "15px 0",
                pointerEvents: "auto",
              }}
            >
              <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                {frontErrorMessage}
              </label>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddSupplier;
