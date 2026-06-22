// design modern
import React, { useRef, useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./RegisterLoginDetailsAdmin.css";
import login_background from "../../component/website/assets/images/dashboard.png";
import munc_logo from "../../assets/Image/munc-logo.png";
import mini_logo from "../../assets/Image/MUNCSMALL.svg";
import { MdKeyboardBackspace } from "react-icons/md";
import BASE_URL from "../../services/config/config";
import { useRegister } from "../../context/RegisterContext";
import { useNavigate, useParams } from "react-router-dom";
import PopUpIndustryChoose from "./PopUpIndustryChoose";

import { LuCheck } from "react-icons/lu";
import { GrShare } from "react-icons/gr";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaBuilding,
  FaGlobe,
  FaFileInvoice,
  FaLink,
  FaUserTie,
} from "react-icons/fa";
import { getPublicPricing } from "../../services/adminApi";
import SuccessPopupModal from "./SuccessPopupModal";

const steps = ["Profile", "Company", "Preferences"];

const RegisterLoginDetailsAdmin = () => {
  const params = useParams();
  const stepAliasToIndex = {
    profile: 0,
    company: 1,
    preferences: 2,
  };

  const stepIndexToAlias = ["profile", "company", "preferences"];

  const [step, setStep] = useState(0);
  const [activePlan, setActivePlan] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [showSelectIndustry, setshowSelectIndustry] = useState(false);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const DISCOUNT_RATE = 0.15;

  const calculatePrice = (
    priceStr,
    period,
    currency = "₹",
    offerType = "none",
    offerValue = 0,
  ) => {
    if (!priceStr)
      return {
        display: "Custom",
        originalPrice: null,
      };

    const basePrice = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
    if (Number.isNaN(basePrice)) {
      return {
        display: priceStr,
        originalPrice: null,
      };
    }

    let priceAfterOffer = basePrice;

    if (offerType === "fixed" && offerValue > 0) {
      priceAfterOffer = Math.max(0, basePrice - offerValue);
    } else if (offerType === "percentage" && offerValue > 0) {
      priceAfterOffer = Math.round(basePrice * (1 - offerValue / 100));
    }

    if (period === "annually") {
      const yearlyAfterOffer = priceAfterOffer * 12;
      const yearlyDiscounted = Math.round(
        yearlyAfterOffer * (1 - DISCOUNT_RATE),
      );

      return {
        display: `${currency}${yearlyDiscounted}`,
        originalPrice: basePrice * 12,
      };
    }

    return {
      display: `${currency}${priceAfterOffer}`,
      originalPrice: basePrice,
    };
  };

  const navigate = useNavigate();

  const updateStep = (nextStep) => {
    if (nextStep < 0 || nextStep >= stepIndexToAlias.length) return;
    setStep(nextStep);
    navigate(`/register/${stepIndexToAlias[nextStep]}`);
  };

  useEffect(() => {
    if (params.step) {
      const idx = stepAliasToIndex[params.step.toLowerCase()];
      if (idx !== undefined) {
        setStep(idx);
      }
    }
  }, [params.step]);

  useEffect(() => {
    // Fetch pricing plans
    const fetchPricing = async () => {
      try {
        const plans = await getPublicPricing();
        setPricingPlans(plans);
      } catch (error) {
        console.error("Failed to fetch pricing plans:", error);
      }
    };
    fetchPricing();
  }, []);

  const [form, setForm] = useState({
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    adminPassword: "",
    adminConfirmPassword: "",
    companyName: "",
    companyPhone: "",
    companyEmail: "",
    employeeSize: "",
    industry: "",
    gst: "",
    subdomain: "",
    website: "",
  });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const inputRefs = useRef([]);
  const [errors, setErrors] = useState({});

  const patterns = {
    name: /^[A-Za-z][A-Za-z\s]{2,49}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone10: /^\d{10}$/,
    companyPhone: /^\d{10,11}$/,
    password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
    subdomain: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    gst: /^[0-9A-Z]{15}$/,
    website: /^https?:\/\/[\w.-]+\.[a-z]{2,}(\/.*)?$/i,
  };

  const notifyError = (message) => toast.error(message);
  const notifySuccess = (message) => toast.success(message);
  const notifyInfo = (message) => toast.info(message);

  const validateAdminStep = () => {
    const newErrors = {};
    if (!patterns.name.test(form.adminName.trim()))
      newErrors.adminName = "Enter valid admin name (min 3 letters)";
    if (!patterns.email.test(form.adminEmail.trim()))
      newErrors.adminEmail = "Enter valid admin email";
    if (!patterns.phone10.test(form.adminPhone))
      newErrors.adminPhone = "Enter valid 10-digit mobile number";
    if (!patterns.password.test(form.adminPassword))
      newErrors.adminPassword =
        "Password must be 8+ chars with letter, number, special char";
    if (
      form.adminPassword &&
      form.adminConfirmPassword &&
      form.adminPassword !== form.adminConfirmPassword
    )
      newErrors.adminConfirmPassword = "Passwords do not match";
    if (!otpVerified) newErrors.otp = "Please verify your email with OTP first";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      notifyError(Object.values(newErrors)[0]);
      return false;
    }
    return true;
  };

  const validateCompanyStep = () => {
    const newErrors = {};
    if (!form.companyName.trim() || form.companyName.trim().length < 2)
      newErrors.companyName = "Enter valid company name";
    if (!patterns.companyPhone.test(form.companyPhone))
      newErrors.companyPhone = "Enter valid company phone (10-11 digits)";
    if (!patterns.email.test(form.companyEmail.trim()))
      newErrors.companyEmail = "Enter valid company email";
    if (!form.employeeSize) newErrors.employeeSize = "Select team size";
    if (!form.industry) newErrors.industry = "Select industry";
    if (!patterns.subdomain.test(form.subdomain.trim()))
      newErrors.subdomain = "Use lowercase letters, numbers, hyphens only";
    if (form.gst && !patterns.gst.test(form.gst.trim()))
      newErrors.gst = "GST must be 15 alphanumeric uppercase characters";
    if (form.website && !patterns.website.test(form.website.trim()))
      newErrors.website = "Website must start with http:// or https://";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      notifyError(Object.values(newErrors)[0]);
      return false;
    }
    return true;
  };

  const handleGo = (idx) => {
    setErrors({});
    updateStep(idx);
  };

  const registerCompany = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (step !== 2) {
      notifyError("Please complete all steps before creating your account");
      return;
    }

    if (!selectedPlan) {
      notifyError("Please select a plan");
      return;
    }

    const payload = {
      adminName: form.adminName,
      adminEmail: form.adminEmail,
      phone: form.adminPhone,
      adminPassword: form.adminPassword,
      companyName: form.companyName,
      companyPhone: form.companyPhone,
      companyEmail: form.companyEmail,
      employeeSize: form.employeeSize,
      industry: form.industry,
      gst: form.gst,
      subdomain: form.subdomain,
      website: form.website,
      plan: selectedPlan,
      billingCycle: activePlan,
    };

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/public/register-company`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          notifyInfo(data.message || "Company already registered");
          return;
        }
        notifyError(data.message || "Registration failed");
        return;
      }

      notifySuccess(data.message || "Account created successfully");

      // Show success modal
      setShowSuccessModal(true);

      // Clear form and reset to step 0 after successful account creation
      setForm({
        adminName: "",
        adminEmail: "",
        adminPhone: "",
        adminPassword: "",
        adminConfirmPassword: "",
        companyName: "",
        companyPhone: "",
        companyEmail: "",
        employeeSize: "",
        industry: "",
        gst: "",
        subdomain: "",
        website: "",
      });
      setOtp(["", "", "", "", "", ""]);
      setOtpVerified(false);
      setOtpSent(false);
      setSelectedPlan("");
      setActivePlan("monthly");
      setErrors({});
      updateStep(0);
    } catch (error) {
      notifyError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!validateAdminStep()) {
        return;
      }
      setErrors({});
      updateStep(1);
      return;
    }

    if (step === 1) {
      if (!validateCompanyStep()) {
        return;
      }
      setErrors({});
      updateStep(2);
      return;
    }

    if (step === 2) {
      if (!selectedPlan) {
        notifyError("Please select a plan");
        return;
      }
      return;
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setErrors({});
      updateStep(step - 1);
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];

      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const verifyOtp = async () => {
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      notifyError("Enter valid 6-digit OTP");
      return false;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/otp/verifyOtps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.adminEmail,
          otp: otpValue,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        notifyError(data.message || "OTP verification failed");
        return false;
      }

      notifySuccess(data.message || "OTP verified");

      setOtpVerified(true);
      return true;
    } catch (error) {
      console.error("Verify OTP error:", error);
      notifyError("Server error while verifying OTP");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (showSuccess = true) => {
    if (!patterns.email.test(form.adminEmail.trim())) {
      notifyError("Please enter a valid email first");
      return false;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/api/otp/sendOtps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: form.adminEmail }),
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON response:", text);
        notifyError("Server error: API did not return JSON");
        return false;
      }

      if (!res.ok) {
        notifyError(data.message || "Failed to send OTP");
        return false;
      }

      if (showSuccess) {
        notifySuccess(data.message || "OTP sent successfully");
      }

      setOtpSent(true);
      return true;
    } catch (error) {
      console.error("Send OTP error:", error);
      notifyError("Failed to send OTP");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleIndustrySelect = (industry) => {
    setForm({ ...form, industry });
    if (errors.industry) setErrors((prev) => ({ ...prev, industry: "" }));
    setshowSelectIndustry(false);
  };

  const progressPct = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="auth-wrapper">
      <ToastContainer position="top-right" autoClose={2500} pauseOnHover />

      {/* LEFT SECTION - Form */}
      <div className="auth-container auth-left-section">
        <div className="auth-card-wrapper">
          <div className="auth-card">
            {/* Header */}
            <div className="auth-card-header">
              <div className="header-content">
                <img src={munc_logo} className="auth-logo" alt="logo" />
                <h5 className="auth-title">Create Your Account</h5>
                <p className="auth-subtitle">
                  Manage your inventory effortlessly. Create your account to
                  begin.
                </p>
              </div>

              {/* Progress & Stepper */}
              <div className="progress-section">
                <div className="progress-info">
                  <span className="progress-text">
                    Step {step + 1} of {steps.length}
                  </span>
                  <span className="progress-percent">{progressPct}%</span>
                </div>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: progressPct + "%" }}
                  />
                </div>

                {/* Stepper */}
                <ol className="stepper-list">
                  {steps.map((label, idx) => (
                    <li
                      key={label}
                      className={`stepper-item ${step === idx ? "active" : ""} ${
                        step > idx ? "done" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="stepper-btn"
                        onClick={() => handleGo(idx)}
                      >
                        <span className="stepper-dot">
                          {idx === 0 ? (
                            <FaUser />
                          ) : idx === 1 ? (
                            <FaBuilding />
                          ) : (
                            <FaUserTie />
                          )}
                        </span>

                        <span className="stepper-label">
                          <span className="stepper-title">{label}</span>
                          <span className="stepper-hint">
                            {
                              [
                                "Who is this for",
                                "Context and size",
                                "What they need",
                              ][idx]
                            }
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Form Body */}
            <div className="auth-card-body">
              <form onSubmit={(e) => e.preventDefault()}>
                {/* STEP 0: Admin Details */}
                {step === 0 && (
                  <div className="form-section">
                    {/* Full Name */}
                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">
                          <FaUserTie className="label-icon" /> Admin Full Name
                        </label>
                        <div
                          className={`input-wrapper ${errors.adminName ? "error" : ""}`}
                        >
                          <span className="input-icon">
                            <FaUser size={13} />
                          </span>
                          <input
                            className={`form-input ${
                              errors.adminName ? "error" : ""
                            }`}
                            placeholder="e.g. Rahul Sharma"
                            value={form.adminName}
                            onChange={(e) => {
                              setForm({ ...form, adminName: e.target.value });
                              if (errors.adminName)
                                setErrors((prev) => ({
                                  ...prev,
                                  adminName: "",
                                }));
                            }}
                          />
                        </div>
                        {errors.adminName ? (
                          <small className="error-text">
                            {errors.adminName}
                          </small>
                        ) : (
                          <small className="hint-text">
                            Enter the primary administrator's full name
                          </small>
                        )}
                      </div>

                      {/* Phone */}
                      <div className="form-col">
                        <label className="form-label">
                          <FaPhone className="label-icon" /> Mobile Number
                        </label>
                        <div
                          className={`input-wrapper ${errors.adminPhone ? "error" : ""}`}
                        >
                          <span className="input-prefix">+91</span>
                          <input
                            className={`form-input ${
                              errors.adminPhone ? "error" : ""
                            }`}
                            placeholder="e.g. 98765 43210"
                            value={form.adminPhone}
                            maxLength={10}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                adminPhone: e.target.value.replace(/\D/g, ""),
                              });
                              if (errors.adminPhone)
                                setErrors((prev) => ({
                                  ...prev,
                                  adminPhone: "",
                                }));
                            }}
                          />
                        </div>
                        {errors.adminPhone ? (
                          <small className="error-text">
                            {errors.adminPhone}
                          </small>
                        ) : (
                          <small className="hint-text">
                            10-digit mobile number without country code
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                      <label className="form-label">
                        <FaEnvelope className="label-icon" /> Work Email Address
                      </label>
                      <div
                        className={`input-wrapper ${errors.adminEmail ? "error" : ""}`}
                      >
                        <span className="input-icon">
                          <FaEnvelope size={13} />
                        </span>
                        <input
                          className={`form-input ${
                            errors.adminEmail ? "error" : ""
                          }`}
                          type="email"
                          placeholder="e.g. rahul@yourcompany.com"
                          value={form.adminEmail}
                          onChange={(e) => {
                            setForm({ ...form, adminEmail: e.target.value });
                            if (errors.adminEmail)
                              setErrors((prev) => ({
                                ...prev,
                                adminEmail: "",
                              }));
                          }}
                        />
                        <button
                          type="button"
                          className="btn-otp"
                          onClick={sendOtp}
                          disabled={loading || otpVerified}
                        >
                          {loading
                            ? "Sending..."
                            : otpVerified
                              ? "✓ Sent"
                              : "Send OTP"}
                        </button>
                      </div>
                      {errors.adminEmail ? (
                        <small className="error-text">
                          {errors.adminEmail}
                        </small>
                      ) : (
                        <small className="hint-text">
                          OTP will be sent to verify your email
                        </small>
                      )}
                      {errors.otp && (
                        <small className="error-text">⚠ {errors.otp}</small>
                      )}
                    </div>

                    {/* OTP Input */}
                    {otpSent && !otpVerified && (
                      <div className="otp-box">
                        <label className="otp-label">
                          🔐 Enter 6-Digit OTP sent to{" "}
                          <span className="otp-email">{form.adminEmail}</span>
                        </label>
                        <div className="otp-inputs">
                          {otp.map((digit, idx) => (
                            <input
                              key={idx}
                              type="text"
                              maxLength="1"
                              value={digit}
                              ref={(el) => (inputRefs.current[idx] = el)}
                              onChange={(e) => handleOtpChange(e, idx)}
                              onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                              className="otp-input"
                            />
                          ))}
                        </div>
                        <div className="otp-actions">
                          <small className="otp-resend">
                            Didn't receive it?{" "}
                            <button
                              type="button"
                              className="btn-link"
                              onClick={sendOtp}
                            >
                              Resend OTP
                            </button>
                          </small>
                          <button
                            type="button"
                            className="btn-verify"
                            onClick={verifyOtp}
                          >
                            Verify OTP
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Verified Message */}
                    {otpVerified && (
                      <div className="success-box">
                        <span className="success-text">
                          ✅ Email verified successfully
                        </span>
                      </div>
                    )}

                    {/* Passwords */}
                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">
                          <FaLock className="label-icon" /> Create Password
                        </label>
                        <div
                          className={`input-wrapper ${errors.adminPassword ? "error" : ""}`}
                        >
                          <span className="input-icon">
                            <FaLock size={13} />
                          </span>
                          <input
                            type="password"
                            className={`form-input ${
                              errors.adminPassword ? "error" : ""
                            }`}
                            placeholder="Min. 8 characters with symbols"
                            value={form.adminPassword}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                adminPassword: e.target.value,
                              });
                              if (errors.adminPassword)
                                setErrors((prev) => ({
                                  ...prev,
                                  adminPassword: "",
                                }));
                            }}
                          />
                        </div>
                        {errors.adminPassword ? (
                          <small className="error-text">
                            {errors.adminPassword}
                          </small>
                        ) : (
                          <small className="hint-text">
                            Use letters, numbers & special characters
                          </small>
                        )}
                      </div>

                      <div className="form-col">
                        <label className="form-label">
                          <FaLock className="label-icon" /> Confirm Password
                        </label>
                        <div
                          className={`input-wrapper ${errors.adminConfirmPassword ? "error" : ""}`}
                        >
                          <span className="input-icon">
                            <FaLock size={13} />
                          </span>
                          <input
                            type="password"
                            className={`form-input ${
                              errors.adminConfirmPassword ? "error" : ""
                            }`}
                            placeholder="Re-enter your password"
                            value={form.adminConfirmPassword}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                adminConfirmPassword: e.target.value,
                              });
                              if (errors.adminConfirmPassword)
                                setErrors((prev) => ({
                                  ...prev,
                                  adminConfirmPassword: "",
                                }));
                            }}
                          />
                        </div>
                        {errors.adminConfirmPassword ? (
                          <small className="error-text">
                            {errors.adminConfirmPassword}
                          </small>
                        ) : form.adminPassword && form.adminConfirmPassword ? (
                          <small
                            className={
                              form.adminPassword === form.adminConfirmPassword
                                ? "success-text"
                                : "error-text"
                            }
                          >
                            {form.adminPassword === form.adminConfirmPassword
                              ? "✓ Passwords match"
                              : "✗ Passwords do not match"}
                          </small>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 1: Company Details */}
                {step === 1 && (
                  <div className="form-section">
                    {/* Company Name */}
                    <div className="form-group">
                      <label className="form-label">
                        <FaBuilding className="label-icon" /> Legal Company Name
                      </label>
                      <div
                        className={`input-wrapper ${errors.companyName ? "error" : ""} `}
                      >
                        <span className="input-icon">
                          <FaBuilding size={12} />
                        </span>
                        <input
                          className={`form-input ${
                            errors.companyName ? "error" : ""
                          }`}
                          placeholder="e.g. Acme Technologies Pvt. Ltd."
                          value={form.companyName}
                          onChange={(e) => {
                            setForm({ ...form, companyName: e.target.value });
                            if (errors.companyName)
                              setErrors((prev) => ({
                                ...prev,
                                companyName: "",
                              }));
                          }}
                        />
                      </div>
                      {errors.companyName ? (
                        <small className="error-text">
                          {errors.companyName}
                        </small>
                      ) : (
                        <small className="hint-text">
                          Registered legal name of your company
                        </small>
                      )}
                    </div>

                    {/* Phone & Email */}
                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">
                          <FaPhone className="label-icon" /> Phone
                        </label>
                        <div
                          className={`input-wrapper ${errors.companyPhone ? "error" : ""}`}
                        >
                          <span className="input-prefix">+91</span>
                          <input
                            className={`form-input ${
                              errors.companyPhone ? "error" : ""
                            }`}
                            placeholder="e.g. 11 4567 8900"
                            value={form.companyPhone}
                            maxLength={11}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                companyPhone: e.target.value.replace(/\D/g, ""),
                              });
                              if (errors.companyPhone)
                                setErrors((prev) => ({
                                  ...prev,
                                  companyPhone: "",
                                }));
                            }}
                          />
                        </div>
                        {errors.companyPhone && (
                          <small className="error-text">
                            {errors.companyPhone}
                          </small>
                        )}
                      </div>

                      <div className="form-col">
                        <label className="form-label">
                          <FaEnvelope className="label-icon" /> Business Email
                        </label>
                        <div
                          className={`input-wrapper ${errors.companyEmail ? "error" : ""}`}
                        >
                          <span className="input-icon">
                            <FaEnvelope size={11} />
                          </span>
                          <input
                            className={`form-input ${
                              errors.companyEmail ? "error" : ""
                            }`}
                            type="email"
                            placeholder="e.g. contact@acme.com"
                            value={form.companyEmail}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                companyEmail: e.target.value,
                              });
                              if (errors.companyEmail)
                                setErrors((prev) => ({
                                  ...prev,
                                  companyEmail: "",
                                }));
                            }}
                          />
                        </div>
                        {errors.companyEmail && (
                          <small className="error-text">
                            {errors.companyEmail}
                          </small>
                        )}
                      </div>
                    </div>

                    {/* Team Size & Industry */}
                    <div className="form-row">
                      <div className="form-col">
                        <label className="form-label">
                          <FaUser className="label-icon" /> Team Size
                        </label>
                        <div
                          className={`input-wrapper ${errors.employeeSize ? "error" : ""} `}
                        >
                          <span className="input-icon">
                            <FaUser size={11} />
                          </span>
                          <select
                            className={`form-select ${errors.employeeSize ? "error" : ""}`}
                            value={form.employeeSize}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                employeeSize: e.target.value,
                              });
                              if (errors.employeeSize)
                                setErrors((prev) => ({
                                  ...prev,
                                  employeeSize: "",
                                }));
                            }}
                          >
                            <option value="">Select size…</option>
                            <option value="0-10">🧑‍💼 1–10 (Startup)</option>
                            <option value="10-25">👥 10–25 (Small)</option>
                            <option value="25-50">🏢 25–50 (Growing)</option>
                            <option value="50-100">🏬 50–100 (Mid-size)</option>
                            <option value="100+">🏭 100+ (Enterprise)</option>
                          </select>
                        </div>
                        {errors.employeeSize ? (
                          <small className="error-text">
                            {errors.employeeSize}
                          </small>
                        ) : (
                          <small className="hint-text">
                            Helps tailor the right plan
                          </small>
                        )}
                      </div>

                      <div className="form-col">
                        <label className="form-label">
                          <FaBuilding className="label-icon" /> Industry
                        </label>
                        <div
                          className={`input-wrapper ${errors.industry ? "error" : ""}`}
                          onClick={() => setshowSelectIndustry(true)}
                        >
                          <span className="input-icon ">
                            <FaBuilding size={11} />
                          </span>

                          <span className="select-text">
                            {form.industry ? form.industry : "e.g. Retail, IT…"}
                          </span>
                          {/* <span className="select-arrow">›</span> */}
                        </div>
                        {errors.industry ? (
                          <small className="error-text">
                            {errors.industry}
                          </small>
                        ) : (
                          <small className="hint-text">
                            Sector your company operates in
                          </small>
                        )}
                      </div>
                    </div>

                    {/* GST */}
                    <div className="form-group">
                      <label className="form-label">
                        <FaFileInvoice className="label-icon" /> GST Number
                        <span className="badge-optional">Optional</span>
                      </label>
                      <div className="input-wrapper">
                        <span className="input-icon">
                          <FaFileInvoice size={12} />
                        </span>
                        <input
                          className={`form-input ${errors.gst ? "error" : ""}`}
                          placeholder="e.g. 27AAPFU0939F1ZV"
                          value={form.gst}
                          maxLength={15}
                          onChange={(e) => {
                            setForm({
                              ...form,
                              gst: e.target.value.toUpperCase(),
                            });
                            if (errors.gst)
                              setErrors((prev) => ({ ...prev, gst: "" }));
                          }}
                        />
                      </div>
                      {errors.gst ? (
                        <small className="error-text">{errors.gst}</small>
                      ) : (
                        <small className="hint-text">15-character GSTIN</small>
                      )}
                    </div>

                    {/* Subdomain & Website */}
                    <div className="form-row subdomain-website-row">
                      <div className="form-col">
                        <label className="form-label">
                          <FaLink className="label-icon" /> Workspace URL
                        </label>
                        <div
                          className={`input-wrapper ${errors.subdomain ? "error" : ""}  `}
                        >
                          {/* <span className="input-icon">
                            <FaLink size={11} />
                          </span> */}
                          <input
                            className={`form-input ${
                              errors.subdomain ? "error" : ""
                            }`}
                            placeholder="e.g. acme"
                            value={form.subdomain}
                            onChange={(e) => {
                              setForm({
                                ...form,
                                subdomain: e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, ""),
                              });
                              if (errors.subdomain)
                                setErrors((prev) => ({
                                  ...prev,
                                  subdomain: "",
                                }));
                            }}
                          />
                          <span className="input-suffix domain-suffix">
                            .imsmymunc.com
                          </span>
                        </div>
                        {errors.subdomain ? (
                          <small className="error-text">
                            {errors.subdomain}
                          </small>
                        ) : form.subdomain ? (
                          <small className="success-text">
                            ✓ <b>{form.subdomain}</b>.imsmymunc.com
                          </small>
                        ) : (
                          <small className="hint-text">
                            Your unique workspace URL
                          </small>
                        )}
                      </div>

                      <div className="form-col">
                        <label className="form-label">
                          <FaGlobe className="label-icon" /> Website
                          <span className="badge-optional">Optional</span>
                        </label>
                        <div className="input-wrapper">
                          <span className="input-icon">
                            <FaGlobe size={12} />
                          </span>
                          <input
                            className={`form-input ${
                              errors.website ? "error" : ""
                            }`}
                            placeholder="e.g. https://acme.com"
                            value={form.website}
                            onChange={(e) => {
                              setForm({ ...form, website: e.target.value });
                              if (errors.website)
                                setErrors((prev) => ({
                                  ...prev,
                                  website: "",
                                }));
                            }}
                          />
                        </div>
                        {errors.website ? (
                          <small className="error-text">{errors.website}</small>
                        ) : (
                          <small className="hint-text">
                            Public-facing company website
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Plan Selection */}
                {step === 2 && (
                  <div className="form-section plans-section">
                    {/* Plan Toggle */}
                    <div className="plans-header">
                      <span
                        className={`savings-badge ${
                          activePlan === "annually" ? "active" : ""
                        }`}
                        onClick={() => setActivePlan("annually")}
                      >
                        Save 15% on Yearly Plan
                      </span>
                      <div className="toggle-group">
                        <button
                          type="button"
                          className={`toggle-btn ${
                            activePlan === "monthly" ? "active" : ""
                          }`}
                          onClick={() => setActivePlan("monthly")}
                        >
                          Monthly
                        </button>
                        <button
                          type="button"
                          className={`toggle-btn ${
                            activePlan === "annually" ? "active" : ""
                          }`}
                          onClick={() => setActivePlan("annually")}
                        >
                          Yearly
                        </button>
                      </div>
                    </div>

                    {/* Plan Cards */}
                    {(() => {
                      const plans = pricingPlans.map((plan) => {
                        const discountLabel =
                          plan.offerType === "percentage" && plan.offerValue > 0
                            ? `${plan.offerValue}% OFF`
                            : plan.offerType === "fixed" && plan.offerValue > 0
                              ? `Save ${plan.currencySymbol || "₹"}${plan.offerValue}`
                              : "";
                        const pricing = calculatePrice(
                          plan.price,
                          activePlan,
                          plan.currencySymbol || "₹",
                          plan.offerType || "none",
                          plan.offerValue || 0,
                        );

                        return {
                          key:
                            plan._id ||
                            plan.title?.toLowerCase().replace(/\s+/g, "") ||
                            Math.random().toString(36).substr(2, 9),
                          name: plan.title,
                          price: pricing.display,
                          priceText:
                            activePlan === "annually" ? "/Year" : "/Month",
                          currencySymbol: plan.currencySymbol || "₹",
                          discountLabel,
                          features: plan.features?.map((f) => f.name) || [],
                          highlight: plan.recommended,
                          badge: plan.recommended ? "Recommended" : "",
                        };
                      });

                      return (
                        <div className="plans-grid">
                          {plans.map((plan) => (
                            <label
                              key={plan.key}
                              className={`plan-card ${
                                selectedPlan === plan.key ? "selected" : ""
                              } ${plan.highlights ? "highlights" : ""}`}
                            >
                              {plan.badge && (
                                <span className="plan-badge">{plan.badge}</span>
                              )}

                              <input
                                type="radio"
                                name="plan"
                                checked={selectedPlan === plan.key}
                                onChange={() => setSelectedPlan(plan.key)}
                                style={{ display: "none" }}
                              />

                              <div className="plan-radio">
                                {selectedPlan === plan.key && (
                                  <span className="radio-dot" />
                                )}
                              </div>

                              <div className="plan-content">
                                <h6 className="plan-name">{plan.name}</h6>
                                <div className="plan-price">
                                  <span className="price">{plan.price}</span>
                                  <span className="period">
                                    {plan.priceText}
                                  </span>
                                  {plan.discountLabel && (
                                    <span className="discount">
                                      {plan.discountLabel}
                                    </span>
                                  )}
                                </div>
                                <ul className="plan-features">
                                  {plan.features.map((f, i) => (
                                    <li key={i}>
                                      <LuCheck className="feature-icon" /> {f}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </label>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                  <button
                    type="button"
                    className="btn1 btn-secondary"
                    onClick={handlePrev}
                    disabled={step === 0}
                  >
                    Back
                  </button>

                  {step < steps.length - 1 ? (
                    <button
                      type="button"
                      className="btn1 btn-primary"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      {loading ? "Please wait..." : "Next"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn1 btn-success"
                      disabled={loading}
                      onClick={registerCompany}
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </button>
                  )}
                </div>
              </form>

              {showSelectIndustry && (
                <PopUpIndustryChoose
                  setshowSelectIndustry={setshowSelectIndustry}
                  selectIndustry={handleIndustrySelect}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION - Hero Image */}
      <div className="auth-container auth-right-section">
        <div className="hero-content">
          <div className="hero-logo">
            {/* <div className="hero-icon">📦</div> */}
            <div className="hero-icon">
              <img src={mini_logo} alt="M" />
            </div>
            <div>
              <h4>Mun-C</h4>
              <p>Inventory Management</p>
            </div>
          </div>

          <h1 className="hero-title">
            Smart Inventory <br /> Better Business
          </h1>

          <p className="hero-subtitle">
            Manage your stock, orders, sales and suppliers in one powerful
            platform.
          </p>

          <div className="hero-featuress">
            <div className="feature-item">
              <div className="feature-icon">📊</div>
              <div>
                <h6>Real-time Stock Tracking</h6>
                <p>Track your inventory in real-time and avoid stockouts.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🛒</div>
              <div>
                <h6>Purchase & Sales</h6>
                <p>Manage purchases, sales and returns seamlessly.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">📈</div>
              <div>
                <h6>Reports & Analytics</h6>
                <p>Get detailed insights and grow your business.</p>
              </div>
            </div>
          </div>

          <div className="hero-image">
            <img src={login_background} alt="dashboard" />
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessPopupModal
        isOpen={showSuccessModal}
        companyName={form.companyName}
        subdomain={form.subdomain}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
};

export default RegisterLoginDetailsAdmin;

// import React, { useRef, useState, useEffect } from "react";
// import "bootstrap/dist/css/bootstrap.min.css";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "./RegisterLoginDetailsAdmin.css";
// import login_background from "../../component/website/assets/images/dashboard.png";
// import munc_logo from "../../assets/Image/munc-logo.png";
// import { MdKeyboardBackspace } from "react-icons/md";
// import BASE_URL from "../../services/config/config";
// import { useRegister } from "../../context/RegisterContext";
// import { useNavigate, useParams } from "react-router-dom";
// import PopUpIndustryChoose from "./PopUpIndustryChoose";

// import { LuCheck } from "react-icons/lu";
// import { GrShare } from "react-icons/gr";
// import {
//   FaUser,
//   FaEnvelope,
//   FaPhone,
//   FaLock,
//   FaBuilding,
//   FaGlobe,
//   FaFileInvoice,
//   FaLink,
//   FaUserTie,
// } from "react-icons/fa";
// const steps = ["Profile", "Company", "Preferences"];

// const AuthPage = () => {
//   const params = useParams();
//   const stepAliasToIndex = {
//     profile: 0,
//     company: 1,
//     preferences: 2,
//   };

//   const stepIndexToAlias = ["profile", "company", "preferences"];

//   const [step, setStep] = useState(0);
//   const [activePlan, setActivePlan] = useState("monthly");
//   const [selectedPlan, setSelectedPlan] = useState("");
//   const [otpVerified, setOtpVerified] = useState(false);
//   const [showSelectIndustry, setshowSelectIndustry] = useState(false);

//   const navigate = useNavigate();

//   const updateStep = (nextStep) => {
//     if (nextStep < 0 || nextStep >= stepIndexToAlias.length) return;
//     setStep(nextStep);
//     navigate(`/register/${stepIndexToAlias[nextStep]}`);
//   };

//   useEffect(() => {
//     if (params.step) {
//       const idx = stepAliasToIndex[params.step.toLowerCase()];
//       if (idx !== undefined) {
//         setStep(idx);
//       }
//     }
//   }, [params.step]);
//   const [form, setForm] = useState({
//     adminName: "",
//     adminEmail: "",
//     adminPhone: "",
//     adminPassword: "",
//     adminConfirmPassword: "",
//     companyName: "",
//     companyPhone: "",
//     companyEmail: "",
//     employeeSize: "",
//     industry: "",
//     gst: "",
//     subdomain: "",
//     website: "",
//   });
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [loading, setLoading] = useState(false);
//   const [otpSent, setOtpSent] = useState(false);
//   const inputRefs = useRef([]);
//   // const [selectedPlan, setSelectedPlan] = useState("free");
//   const [errors, setErrors] = useState({});

//   const patterns = {
//     name: /^[A-Za-z][A-Za-z\s]{2,49}$/,
//     email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
//     phone10: /^\d{10}$/,
//     companyPhone: /^\d{10,11}$/,
//     password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
//     subdomain: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
//     gst: /^[0-9A-Z]{15}$/,
//     website: /^https?:\/\/[\w.-]+\.[a-z]{2,}(\/.*)?$/i,
//   };

//   const notifyError = (message) => toast.error(message);
//   const notifySuccess = (message) => toast.success(message);
//   const notifyInfo = (message) => toast.info(message);

//   const validateAdminStep = () => {
//     const newErrors = {};
//     if (!patterns.name.test(form.adminName.trim()))
//       newErrors.adminName = "Enter valid admin name (min 3 letters)";
//     if (!patterns.email.test(form.adminEmail.trim()))
//       newErrors.adminEmail = "Enter valid admin email";
//     if (!patterns.phone10.test(form.adminPhone))
//       newErrors.adminPhone = "Enter valid 10-digit mobile number";
//     if (!patterns.password.test(form.adminPassword))
//       newErrors.adminPassword =
//         "Password must be 8+ chars with letter, number, special char";
//     if (
//       form.adminPassword &&
//       form.adminConfirmPassword &&
//       form.adminPassword !== form.adminConfirmPassword
//     )
//       newErrors.adminConfirmPassword = "Passwords do not match";
//     if (!otpVerified) newErrors.otp = "Please verify your email with OTP first";
//     setErrors(newErrors);
//     if (Object.keys(newErrors).length > 0) {
//       notifyError(Object.values(newErrors)[0]);
//       return false;
//     }
//     return true;
//   };

//   const validateCompanyStep = () => {
//     const newErrors = {};
//     if (!form.companyName.trim() || form.companyName.trim().length < 2)
//       newErrors.companyName = "Enter valid company name";
//     if (!patterns.companyPhone.test(form.companyPhone))
//       newErrors.companyPhone = "Enter valid company phone (10-11 digits)";
//     if (!patterns.email.test(form.companyEmail.trim()))
//       newErrors.companyEmail = "Enter valid company email";
//     if (!form.employeeSize) newErrors.employeeSize = "Select team size";
//     if (!form.industry) newErrors.industry = "Select industry";
//     if (!patterns.subdomain.test(form.subdomain.trim()))
//       newErrors.subdomain = "Use lowercase letters, numbers, hyphens only";
//     if (form.gst && !patterns.gst.test(form.gst.trim()))
//       newErrors.gst = "GST must be 15 alphanumeric uppercase characters";
//     if (form.website && !patterns.website.test(form.website.trim()))
//       newErrors.website = "Website must start with http:// or https://";
//     setErrors(newErrors);
//     if (Object.keys(newErrors).length > 0) {
//       notifyError(Object.values(newErrors)[0]);
//       return false;
//     }
//     return true;
//   };

//   const handleGo = (idx) => {
//     setErrors({});
//     updateStep(idx);
//   };

//   const registerCompany = async (e) => {
//     if (e && e.preventDefault) e.preventDefault();

//     // Only allow submission on the final step (preferences)
//     if (step !== 2) {
//       notifyError("Please complete all steps before creating your account");
//       return;
//     }

//     if (!selectedPlan) {
//       notifyError("Please select a plan");
//       return;
//     }

//     const payload = {
//       adminName: form.adminName,
//       adminEmail: form.adminEmail,
//       phone: form.adminPhone, // Fix: send as 'phone' to match backend
//       adminPassword: form.adminPassword,
//       companyName: form.companyName,
//       companyPhone: form.companyPhone,
//       companyEmail: form.companyEmail,
//       employeeSize: form.employeeSize,
//       industry: form.industry,
//       gst: form.gst,
//       subdomain: form.subdomain,
//       website: form.website,
//       plan: selectedPlan,
//       billingCycle: activePlan,
//     };

//     try {
//       setLoading(true);

//       const res = await fetch(`${BASE_URL}/api/public/register-company`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(payload),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         if (res.status === 409) {
//           notifyInfo(data.message || "Company already registered");
//           return;
//         }
//         notifyError(data.message || "Registration failed");
//         return;
//       }

//       notifySuccess(data.message || "Account created successfully");
//     } catch (error) {
//       notifyError("Something went wrong");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleNext = async () => {
//     // STEP 1 → Admin Details
//     if (step === 0) {
//       if (!validateAdminStep()) {
//         return;
//       }
//       setErrors({});
//       updateStep(1);
//       return;
//     }

//     // STEP 2 → Company Details
//     if (step === 1) {
//       if (!validateCompanyStep()) {
//         return;
//       }
//       setErrors({});
//       updateStep(2);
//       return;
//     }

//     // STEP 3 → Preferences (Plan Selection)
//     if (step === 2) {
//       if (!selectedPlan) {
//         notifyError("Please select a plan");
//         return;
//       }
//       // keep on preferences. user must click Create Account to submit.
//       return;
//     }
//   };

//   const handlePrev = () => {
//     if (step > 0) {
//       setErrors({});
//       updateStep(step - 1);
//     }
//   };

//   const handleOtpChange = (e, index) => {
//     const value = e.target.value.replace(/[^0-9]/g, "");

//     if (!value) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);

//     if (index < 5) {
//       inputRefs.current[index + 1].focus();
//     }
//   };

//   const handleOtpKeyDown = (e, index) => {
//     if (e.key === "Backspace") {
//       const newOtp = [...otp];

//       if (otp[index]) {
//         newOtp[index] = "";
//         setOtp(newOtp);
//       } else if (index > 0) {
//         inputRefs.current[index - 1].focus();
//       }
//     }
//   };

//   const verifyOtp = async () => {
//     const otpValue = otp.join("");

//     if (otpValue.length !== 6) {
//       notifyError("Enter valid 6-digit OTP");
//       return false;
//     }

//     try {
//       setLoading(true);

//       const res = await fetch(`${BASE_URL}/api/otp/verifyOtps`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           email: form.adminEmail,
//           otp: otpValue,
//         }),
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         notifyError(data.message || "OTP verification failed");
//         return false;
//       }

//       notifySuccess(data.message || "OTP verified");

//       setOtpVerified(true);
//       return true;
//     } catch (error) {
//       console.error("Verify OTP error:", error);
//       notifyError("Server error while verifying OTP");
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };
//   const sendOtp = async (showSuccess = true) => {
//     if (!patterns.email.test(form.adminEmail.trim())) {
//       notifyError("Please enter a valid email first");
//       return false;
//     }

//     try {
//       setLoading(true);

//       const res = await fetch(`${BASE_URL}/api/otp/sendOtps`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email: form.adminEmail }),
//       });

//       const text = await res.text();

//       let data;
//       try {
//         data = JSON.parse(text);
//       } catch (err) {
//         console.error("Invalid JSON response:", text);
//         notifyError("Server error: API did not return JSON");
//         return false;
//       }

//       if (!res.ok) {
//         notifyError(data.message || "Failed to send OTP");
//         return false;
//       }

//       if (showSuccess) {
//         notifySuccess(data.message || "OTP sent successfully");
//       }

//       setOtpSent(true);
//       return true;
//     } catch (error) {
//       console.error("Send OTP error:", error);
//       notifyError("Failed to send OTP");
//       return false;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Industry selection callback
//   const handleIndustrySelect = (industry) => {
//     setForm({ ...form, industry });
//     if (errors.industry) setErrors((prev) => ({ ...prev, industry: "" }));
//     setshowSelectIndustry(false);
//   };

//   const progressPct = Math.round(((step + 1) / steps.length) * 100);

//   return (
//     <div className="auth-wrapper">
//       <ToastContainer position="top-right" autoClose={2500} pauseOnHover />
//       <div className="container-fluid h-100">
//         <div className="row h-100">
//           {/* LEFT PANEL */}
//           <div
//             className="col-lg-6 d-flex align-items-center justify-content-center auth-right"
//             style={{
//               height: "100vh",
//               overflowY: "auto",
//               position: "relative",
//               zIndex: 1,
//             }}
//           >
//             <div
//               className="card auth-card shadow-lg w-100 d-flex flex-column"
//               // className="card auth-card shadow-lg w-100 d-flex flex-column"
//               style={{ height: "100%", maxWidth: "100%" }}
//             >
//               {/* Sticky Header: logo, title, progress, stepper */}
//               <div
//                 className="card-header  p-0"
//                 style={{
//                   position: "sticky",
//                   top: 0,
//                   zIndex: 10,
//                   // boxShadow: "0 2px 8px 0 rgba(0,0,0,0.03)",
//                 }}
//               >
//                 <div
//                   className="text-center pt-4 pb-2 px-4"
//                   // style={{ background: "#fff" }}
//                 >
//                   <img src={munc_logo} className="logo mb-2" alt="logo" />
//                   <h5>Create Your Account</h5>
//                   <p className="text-muted small mb-0">
//                     Manage your inventory effortlessly. Create your account to
//                     begin.
//                   </p>
//                 </div>
//                 {/* PROGRESS + STEPPER */}
//                 <div
//                   className="progressWrap px-4 pb-2"
//                   // style={{ background: "#fff" }}
//                 >
//                   <div className="progressTop">
//                     <span>
//                       Step {step + 1} of {steps.length}
//                     </span>
//                     <span>{progressPct}%</span>
//                   </div>
//                   <div className="progress">
//                     <div
//                       className="progress__bar"
//                       style={{ width: progressPct + "%" }}
//                     />
//                   </div>
//                   {/* STEPPER */}
//                   <ol className="stepper">
//                     {steps.map((label, idx) => (
//                       <li
//                         key={label}
//                         className={`step
//                         ${step === idx ? "is-active" : ""}
//                         ${step > idx ? "is-done" : ""}`}
//                       >
//                         <button
//                           type="button"
//                           className="stepBtn"
//                           onClick={() => handleGo(idx)}
//                         >
//                           <span className="stepDot">
//                             <i
//                               className={[
//                                 "fa-solid",
//                                 idx === 0
//                                   ? "fa-user"
//                                   : idx === 1
//                                     ? "fa-building"
//                                     : "fa-sliders",
//                               ].join(" ")}
//                             />
//                           </span>
//                           <span className="stepText">
//                             <span className="stepTitle">{label}</span>
//                             <span className="stepHint">
//                               {
//                                 [
//                                   "Who is this for",
//                                   "Context and size",
//                                   "What they need",
//                                 ][idx]
//                               }
//                             </span>
//                           </span>
//                         </button>
//                       </li>
//                     ))}
//                   </ol>
//                 </div>
//               </div>
//               {/* Scrollable Form Area */}
//               <div
//                 className="card-body p-4"
//                 style={{ overflowY: "auto", flex: 1, minHeight: 0 }}
//               >
//                 {/* FORM */}
//                 <form onSubmit={registerCompany}>
//                   {step === 0 && (
//                     <div
//                       style={{
//                         // background: "#f8f9fc",
//                         // border: "1px solid #e3e8f0",
//                         borderRadius: "14px",
//                         overflow: "hidden",
//                       }}
//                     >
//                       <div>
//                         {/* Full Name */}
//                         <div className="row g-2 mb-3">
//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "12px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               <FaUserTie className="me-1 text-primary" /> Admin
//                               Full Name
//                             </label>
//                             <div className="input-group">
//                               <span className="input-group-text bg-white border-end-0">
//                                 <FaUser className="text-muted" size={13} />
//                               </span>
//                               <input
//                                 className={`form-control border-start-0${errors.adminName ? " is-invalid" : ""}`}
//                                 placeholder="e.g. Rahul Sharma"
//                                 value={form.adminName}
//                                 onChange={(e) => {
//                                   setForm({
//                                     ...form,
//                                     adminName: e.target.value,
//                                   });
//                                   if (errors.adminName)
//                                     setErrors((prev) => ({
//                                       ...prev,
//                                       adminName: "",
//                                     }));
//                                 }}
//                                 style={{ boxShadow: "none" }}
//                               />
//                             </div>
//                             {errors.adminName ? (
//                               <small className="text-danger">
//                                 {errors.adminName}
//                               </small>
//                             ) : (
//                               <small className="text-muted">
//                                 Enter the primary administrator's full name
//                               </small>
//                             )}
//                           </div>
//                           {/* Phone */}
//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "12px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               <FaPhone className="me-1 text-primary" /> Mobile
//                               Number
//                             </label>
//                             <div className="input-group">
//                               <span
//                                 className="input-group-text bg-white border-end-0 fw-semibold text-muted"
//                                 style={{ fontSize: "13px" }}
//                               >
//                                 +91
//                               </span>
//                               <input
//                                 className={`form-control border-start-0${errors.adminPhone ? " is-invalid" : ""}`}
//                                 placeholder="e.g. 98765 43210"
//                                 value={form.adminPhone}
//                                 maxLength={10}
//                                 onChange={(e) => {
//                                   setForm({
//                                     ...form,
//                                     adminPhone: e.target.value.replace(
//                                       /\D/g,
//                                       "",
//                                     ),
//                                   });
//                                   if (errors.adminPhone)
//                                     setErrors((prev) => ({
//                                       ...prev,
//                                       adminPhone: "",
//                                     }));
//                                 }}
//                                 style={{ boxShadow: "none" }}
//                               />
//                             </div>
//                             {errors.adminPhone ? (
//                               <small className="text-danger">
//                                 {errors.adminPhone}
//                               </small>
//                             ) : (
//                               <small className="text-muted">
//                                 10-digit mobile number without country code
//                               </small>
//                             )}
//                           </div>
//                         </div>

//                         {/* EMAIL */}
//                         <div className="mb-3">
//                           <label
//                             className="form-label fw-semibold text-secondary"
//                             style={{
//                               fontSize: "12px",
//                               letterSpacing: "0.5px",
//                               textTransform: "uppercase",
//                             }}
//                           >
//                             <FaEnvelope className="me-1 text-primary" /> Work
//                             Email Address
//                           </label>
//                           <div className="input-group">
//                             <span className="input-group-text bg-white border-end-0">
//                               <FaEnvelope className="text-muted" size={13} />
//                             </span>
//                             <input
//                               className={`form-control border-start-0${errors.adminEmail ? " is-invalid" : ""}`}
//                               type="email"
//                               placeholder="e.g. rahul@yourcompany.com"
//                               value={form.adminEmail}
//                               onChange={(e) => {
//                                 setForm({
//                                   ...form,
//                                   adminEmail: e.target.value,
//                                 });
//                                 if (errors.adminEmail)
//                                   setErrors((prev) => ({
//                                     ...prev,
//                                     adminEmail: "",
//                                   }));
//                               }}
//                             />
//                             {/* SEND OTP */}
//                             <button
//                               type="button"
//                               className="btn btn-outline-primary btn-sm px-3"
//                               onClick={sendOtp}
//                               disabled={loading || otpVerified}
//                             >
//                               {loading
//                                 ? "Sending..."
//                                 : otpVerified
//                                   ? "✓ Sent"
//                                   : "Send OTP"}
//                             </button>
//                           </div>
//                           {errors.adminEmail ? (
//                             <small className="text-danger">
//                               {errors.adminEmail}
//                             </small>
//                           ) : (
//                             <small className="text-muted">
//                               OTP will be sent to verify your email
//                             </small>
//                           )}
//                           {errors.otp && (
//                             <small className="text-danger d-block mt-1">
//                               ⚠ {errors.otp}
//                             </small>
//                           )}
//                         </div>

//                         {/* OTP INPUT */}
//                         {otpSent && !otpVerified && (
//                           <div className="mb-3 p-3 bg-light rounded border">
//                             <label
//                               className="form-label fw-semibold"
//                               style={{ fontSize: "12px" }}
//                             >
//                               🔐 Enter 6-Digit OTP sent to{" "}
//                               <span className="text-primary">
//                                 {form.adminEmail}
//                               </span>
//                             </label>
//                             <div
//                               style={{
//                                 display: "flex",
//                                 gap: "8px",
//                                 justifyContent: "center",
//                               }}
//                             >
//                               {otp.map((digit, idx) => (
//                                 <input
//                                   key={idx}
//                                   type="text"
//                                   maxLength="1"
//                                   value={digit}
//                                   ref={(el) => (inputRefs.current[idx] = el)}
//                                   onChange={(e) => handleOtpChange(e, idx)}
//                                   onKeyDown={(e) => handleOtpKeyDown(e, idx)}
//                                   style={{
//                                     width: "42px",
//                                     height: "42px",
//                                     fontSize: "20px",
//                                     textAlign: "center",
//                                     border: "2px solid #dee2e6",
//                                     borderRadius: "8px",
//                                     outline: "none",
//                                     fontWeight: "700",
//                                   }}
//                                 />
//                               ))}
//                             </div>
//                             <div className="d-flex justify-content-between align-items-center mt-2">
//                               <small className="text-muted">
//                                 Didn't receive it?{" "}
//                                 <button
//                                   type="button"
//                                   className="btn btn-link btn-sm p-0"
//                                   onClick={sendOtp}
//                                 >
//                                   Resend OTP
//                                 </button>
//                               </small>
//                               <button
//                                 type="button"
//                                 className="btn btn-success btn-sm px-4"
//                                 onClick={verifyOtp}
//                               >
//                                 Verify OTP
//                               </button>
//                             </div>
//                           </div>
//                         )}

//                         {/* VERIFIED MESSAGE */}
//                         {otpVerified && (
//                           <div
//                             className="mb-2 px-3 py-2 rounded"
//                             style={{
//                               background: "#e6f9f0",
//                               border: "1px solid #b2dfdb",
//                             }}
//                           >
//                             <span
//                               className="text-success fw-semibold"
//                               style={{ fontSize: "13px" }}
//                             >
//                               ✅ Email verified successfully
//                             </span>
//                           </div>
//                         )}

//                         <div className="row  g-2 mb-3">
//                           {/* Password */}
//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "12px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               <FaLock className="me-1 text-primary" /> Create
//                               Password
//                             </label>
//                             <div className="input-group">
//                               <span className="input-group-text bg-white border-end-0">
//                                 <FaLock className="text-muted" size={13} />
//                               </span>
//                               <input
//                                 type="password"
//                                 className={`form-control border-start-0${errors.adminPassword ? " is-invalid" : ""}`}
//                                 placeholder="Min. 8 characters with symbols"
//                                 value={form.adminPassword}
//                                 onChange={(e) => {
//                                   setForm({
//                                     ...form,
//                                     adminPassword: e.target.value,
//                                   });
//                                   if (errors.adminPassword)
//                                     setErrors((prev) => ({
//                                       ...prev,
//                                       adminPassword: "",
//                                     }));
//                                 }}
//                                 style={{ boxShadow: "none" }}
//                               />
//                             </div>
//                             {errors.adminPassword ? (
//                               <small className="text-danger">
//                                 {errors.adminPassword}
//                               </small>
//                             ) : (
//                               <small className="text-muted">
//                                 Use letters, numbers & special characters
//                               </small>
//                             )}
//                           </div>

//                           {/* Confirm Password */}
//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "12px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               <FaLock className="me-1 text-primary" /> Confirm
//                               Password
//                             </label>
//                             <div className="input-group">
//                               <span className="input-group-text bg-white border-end-0">
//                                 <FaLock className="text-muted" size={13} />
//                               </span>
//                               <input
//                                 type="password"
//                                 className={`form-control border-start-0${errors.adminConfirmPassword ? " is-invalid" : ""}`}
//                                 placeholder="Re-enter your password"
//                                 value={form.adminConfirmPassword}
//                                 onChange={(e) => {
//                                   setForm({
//                                     ...form,
//                                     adminConfirmPassword: e.target.value,
//                                   });
//                                   if (errors.adminConfirmPassword)
//                                     setErrors((prev) => ({
//                                       ...prev,
//                                       adminConfirmPassword: "",
//                                     }));
//                                 }}
//                                 style={{ boxShadow: "none" }}
//                               />
//                             </div>
//                             {errors.adminConfirmPassword ? (
//                               <small className="text-danger">
//                                 {errors.adminConfirmPassword}
//                               </small>
//                             ) : form.adminPassword &&
//                               form.adminConfirmPassword ? (
//                               <small
//                                 className={
//                                   form.adminPassword ===
//                                   form.adminConfirmPassword
//                                     ? "text-success"
//                                     : "text-danger"
//                                 }
//                               >
//                                 {form.adminPassword ===
//                                 form.adminConfirmPassword
//                                   ? "✓ Passwords match"
//                                   : "✗ Passwords do not match"}
//                               </small>
//                             ) : null}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* STEP 1: Company Details */}
//                   {step === 1 && (
//                     <div
//                       style={{
//                         // background: "#f8f9fc",
//                         // border: "1px solid #e3e8f0",
//                         borderRadius: "14px",
//                         overflow: "hidden",
//                       }}
//                     >
//                       {/* Card Body */}
//                       <div>
//                         {/* Section: Basic Info */}
//                         <div
//                           style={{
//                             fontSize: "10px",
//                             fontWeight: "700",
//                             letterSpacing: "1px",
//                             textTransform: "uppercase",
//                             color: "#0447AA",
//                             borderBottom: "1px solid #e3e8f0",
//                             paddingBottom: "6px",
//                             marginBottom: "14px",
//                           }}
//                         >
//                           Basic Information
//                         </div>

//                         {/* Company Name */}
//                         <div className="mb-3">
//                           <label
//                             className="form-label fw-semibold text-secondary"
//                             style={{
//                               fontSize: "11px",
//                               letterSpacing: "0.5px",
//                               textTransform: "uppercase",
//                             }}
//                           >
//                             <FaBuilding className="me-1 text-primary" /> Legal
//                             Company Name
//                           </label>
//                           <div className="input-group">
//                             <span className="input-group-text bg-white border-end-0">
//                               <FaBuilding className="text-muted" size={12} />
//                             </span>
//                             <input
//                               className={`form-control border-start-0${errors.companyName ? " is-invalid" : ""}`}
//                               placeholder="e.g. Acme Technologies Pvt. Ltd."
//                               value={form.companyName}
//                               onChange={(e) => {
//                                 setForm({
//                                   ...form,
//                                   companyName: e.target.value,
//                                 });
//                                 if (errors.companyName)
//                                   setErrors((prev) => ({
//                                     ...prev,
//                                     companyName: "",
//                                   }));
//                               }}
//                               style={{ boxShadow: "none", fontSize: "13px" }}
//                             />
//                           </div>
//                           {errors.companyName ? (
//                             <small
//                               className="text-danger"
//                               style={{ fontSize: "11px" }}
//                             >
//                               {errors.companyName}
//                             </small>
//                           ) : (
//                             <small
//                               className="text-muted"
//                               style={{ fontSize: "11px" }}
//                             >
//                               Registered legal name of your company
//                             </small>
//                           )}
//                         </div>

//                         {/* Company Phone & Email */}
//                         <div className="row g-2 mb-1">
//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "11px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               <FaPhone className="me-1 text-primary" /> Phone
//                             </label>
//                             <div className="input-group">
//                               <span
//                                 className="input-group-text bg-white border-end-0 fw-semibold text-muted"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 +91
//                               </span>
//                               <input
//                                 className={`form-control border-start-0${errors.companyPhone ? " is-invalid" : ""}`}
//                                 placeholder="e.g. 11 4567 8900"
//                                 value={form.companyPhone}
//                                 maxLength={11}
//                                 onChange={(e) => {
//                                   setForm({
//                                     ...form,
//                                     companyPhone: e.target.value.replace(
//                                       /\D/g,
//                                       "",
//                                     ),
//                                   });
//                                   if (errors.companyPhone)
//                                     setErrors((prev) => ({
//                                       ...prev,
//                                       companyPhone: "",
//                                     }));
//                                 }}
//                                 style={{ boxShadow: "none", fontSize: "13px" }}
//                               />
//                             </div>
//                             {errors.companyPhone && (
//                               <small
//                                 className="text-danger"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 {errors.companyPhone}
//                               </small>
//                             )}
//                           </div>

//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "11px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               <FaEnvelope className="me-1 text-primary" />{" "}
//                               Business Email
//                             </label>
//                             <div className="input-group">
//                               <span className="input-group-text bg-white border-end-0">
//                                 <FaEnvelope className="text-muted" size={11} />
//                               </span>
//                               <input
//                                 className={`form-control border-start-0${errors.companyEmail ? " is-invalid" : ""}`}
//                                 type="email"
//                                 placeholder="e.g. contact@acme.com"
//                                 value={form.companyEmail}
//                                 onChange={(e) => {
//                                   setForm({
//                                     ...form,
//                                     companyEmail: e.target.value,
//                                   });
//                                   if (errors.companyEmail)
//                                     setErrors((prev) => ({
//                                       ...prev,
//                                       companyEmail: "",
//                                     }));
//                                 }}
//                                 style={{ boxShadow: "none", fontSize: "13px" }}
//                               />
//                             </div>
//                             {errors.companyEmail && (
//                               <small
//                                 className="text-danger"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 {errors.companyEmail}
//                               </small>
//                             )}
//                           </div>
//                         </div>

//                         {/* Divider */}
//                         <div
//                           style={{
//                             fontSize: "10px",
//                             fontWeight: "700",
//                             letterSpacing: "1px",
//                             textTransform: "uppercase",
//                             color: "#0447AA",
//                             borderBottom: "1px solid #e3e8f0",
//                             paddingBottom: "6px",
//                             marginTop: "18px",
//                             marginBottom: "14px",
//                           }}
//                         >
//                           Organisation Profile
//                         </div>

//                         {/* Team Size & Industry */}
//                         <div className="row g-2 mb-3">
//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "11px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               Team Size
//                             </label>
//                             <select
//                               className={`form-select${errors.employeeSize ? " is-invalid" : ""}`}
//                               value={form.employeeSize}
//                               onChange={(e) => {
//                                 setForm({
//                                   ...form,
//                                   employeeSize: e.target.value,
//                                 });
//                                 if (errors.employeeSize)
//                                   setErrors((prev) => ({
//                                     ...prev,
//                                     employeeSize: "",
//                                   }));
//                               }}
//                               style={{ boxShadow: "none", fontSize: "13px" }}
//                             >
//                               <option value="">Select size…</option>
//                               <option value="0-10">🧑‍💼 1–10 (Startup)</option>
//                               <option value="10-25">👥 10–25 (Small)</option>
//                               <option value="25-50">🏢 25–50 (Growing)</option>
//                               <option value="50-100">
//                                 🏬 50–100 (Mid-size)
//                               </option>
//                               <option value="100+">🏭 100+ (Enterprise)</option>
//                             </select>
//                             {errors.employeeSize ? (
//                               <small
//                                 className="text-danger"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 {errors.employeeSize}
//                               </small>
//                             ) : (
//                               <small
//                                 className="text-muted"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 Helps tailor the right plan
//                               </small>
//                             )}
//                           </div>

//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "11px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               Industry
//                             </label>
//                             <div
//                               onClick={() => setshowSelectIndustry(true)}
//                               className="form-control d-flex align-items-center"
//                               style={{
//                                 cursor: "pointer",
//                                 background: form.industry ? "#fff" : "#f8f9fa",
//                                 color: form.industry ? "#212529" : "#6c757d",
//                                 border: errors.industry
//                                   ? "1px solid #dc3545"
//                                   : "1px solid #dee2e6",
//                                 boxShadow: "none",
//                                 fontSize: "13px",
//                                 height: "38px",
//                               }}
//                             >
//                               <FaBuilding
//                                 className="me-2 text-primary"
//                                 size={11}
//                               />
//                               <span
//                                 style={{
//                                   flex: 1,
//                                   overflow: "hidden",
//                                   textOverflow: "ellipsis",
//                                   whiteSpace: "nowrap",
//                                 }}
//                               >
//                                 {form.industry
//                                   ? form.industry
//                                   : "e.g. Retail, IT…"}
//                               </span>
//                               <span
//                                 className="text-primary"
//                                 style={{ fontSize: "10px" }}
//                               >
//                                 ›
//                               </span>
//                             </div>
//                             {errors.industry ? (
//                               <small
//                                 className="text-danger"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 {errors.industry}
//                               </small>
//                             ) : (
//                               <small
//                                 className="text-muted"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 Sector your company operates in
//                               </small>
//                             )}
//                           </div>
//                         </div>

//                         {/* GST */}
//                         <div className="mb-3">
//                           <label
//                             className="form-label fw-semibold text-secondary"
//                             style={{
//                               fontSize: "11px",
//                               letterSpacing: "0.5px",
//                               textTransform: "uppercase",
//                             }}
//                           >
//                             <FaFileInvoice className="me-1 text-primary" /> GST
//                             Number
//                             <span
//                               className="ms-2 badge bg-light text-secondary fw-normal"
//                               style={{ fontSize: "10px" }}
//                             >
//                               Optional
//                             </span>
//                           </label>
//                           <div className="input-group">
//                             <span className="input-group-text bg-white border-end-0">
//                               <FaFileInvoice className="text-muted" size={12} />
//                             </span>
//                             <input
//                               className={`form-control border-start-0${errors.gst ? " is-invalid" : ""}`}
//                               placeholder="e.g. 27AAPFU0939F1ZV"
//                               value={form.gst}
//                               maxLength={15}
//                               onChange={(e) => {
//                                 setForm({
//                                   ...form,
//                                   gst: e.target.value.toUpperCase(),
//                                 });
//                                 if (errors.gst)
//                                   setErrors((prev) => ({ ...prev, gst: "" }));
//                               }}
//                               style={{
//                                 boxShadow: "none",
//                                 fontFamily: "monospace",
//                                 letterSpacing: "1px",
//                                 fontSize: "13px",
//                               }}
//                             />
//                           </div>
//                           {errors.gst ? (
//                             <small
//                               className="text-danger"
//                               style={{ fontSize: "11px" }}
//                             >
//                               {errors.gst}
//                             </small>
//                           ) : (
//                             <small
//                               className="text-muted"
//                               style={{ fontSize: "11px" }}
//                             >
//                               15-character GSTIN
//                             </small>
//                           )}
//                         </div>

//                         {/* Divider */}
//                         <div
//                           style={{
//                             fontSize: "10px",
//                             fontWeight: "700",
//                             letterSpacing: "1px",
//                             textTransform: "uppercase",
//                             color: "#0447AA",
//                             borderBottom: "1px solid #e3e8f0",
//                             paddingBottom: "6px",
//                             marginBottom: "14px",
//                           }}
//                         >
//                           Online Presence
//                         </div>

//                         {/* Subdomain & Website */}
//                         <div className="row g-2">
//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "11px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               <FaLink className="me-1 text-primary" /> Workspace
//                               URL
//                             </label>
//                             <div className="input-group">
//                               <input
//                                 className={`form-control${errors.subdomain ? " is-invalid" : ""}`}
//                                 placeholder="e.g. acme"
//                                 value={form.subdomain}
//                                 onChange={(e) => {
//                                   setForm({
//                                     ...form,
//                                     subdomain: e.target.value
//                                       .toLowerCase()
//                                       .replace(/[^a-z0-9-]/g, ""),
//                                   });
//                                   if (errors.subdomain)
//                                     setErrors((prev) => ({
//                                       ...prev,
//                                       subdomain: "",
//                                     }));
//                                 }}
//                                 style={{ boxShadow: "none", fontSize: "13px" }}
//                               />
//                               <span
//                                 className="input-group-text bg-light text-muted"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 .munc.com
//                               </span>
//                             </div>
//                             {errors.subdomain ? (
//                               <small
//                                 className="text-danger"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 {errors.subdomain}
//                               </small>
//                             ) : form.subdomain ? (
//                               <small
//                                 className="text-success"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 ✓ <b>{form.subdomain}</b>.munc.com
//                               </small>
//                             ) : (
//                               <small
//                                 className="text-muted"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 Your unique workspace URL
//                               </small>
//                             )}
//                           </div>

//                           <div className="col-6">
//                             <label
//                               className="form-label fw-semibold text-secondary"
//                               style={{
//                                 fontSize: "11px",
//                                 letterSpacing: "0.5px",
//                                 textTransform: "uppercase",
//                               }}
//                             >
//                               <FaGlobe className="me-1 text-primary" /> Website
//                               <span
//                                 className="ms-1 badge bg-light text-secondary fw-normal"
//                                 style={{ fontSize: "10px" }}
//                               >
//                                 Optional
//                               </span>
//                             </label>
//                             <div className="input-group">
//                               <span className="input-group-text bg-white border-end-0">
//                                 <FaGlobe className="text-muted" size={12} />
//                               </span>
//                               <input
//                                 className={`form-control border-start-0${errors.website ? " is-invalid" : ""}`}
//                                 placeholder="e.g. https://acme.com"
//                                 value={form.website}
//                                 onChange={(e) => {
//                                   setForm({ ...form, website: e.target.value });
//                                   if (errors.website)
//                                     setErrors((prev) => ({
//                                       ...prev,
//                                       website: "",
//                                     }));
//                                 }}
//                                 style={{ boxShadow: "none", fontSize: "13px" }}
//                               />
//                             </div>
//                             {errors.website ? (
//                               <small
//                                 className="text-danger"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 {errors.website}
//                               </small>
//                             ) : (
//                               <small
//                                 className="text-muted"
//                                 style={{ fontSize: "11px" }}
//                               >
//                                 Public-facing company website
//                               </small>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )}

//                   {/* STEP 2: Plan Selection */}
//                   {step === 2 && (
//                     <div
//                       style={{
//                         // background: "#f8f9fc",
//                         // border: "1px solid #e3e8f0",
//                         borderRadius: "14px",
//                         overflow: "hidden",
//                       }}
//                     >
//                       <div style={{ padding: "18px 20px" }}>
//                         {/* Modern SaaS Plan Selection UI */}
//                         <div
//                           className="d-flex align-items-center mb-4"
//                           style={{ justifyContent: "space-between" }}
//                         >
//                           <span
//                             className={
//                               activePlan === "annually"
//                                 ? "badge bg-success px-2 py-1"
//                                 : "small text-primary"
//                             }
//                             style={{ cursor: "pointer", fontWeight: 600 }}
//                             onClick={() => setActivePlan("annually")}
//                           >
//                             Save 15% on Yearly Plan
//                           </span>
//                           <div className="toggle-switch d-flex align-items-center">
//                             <button
//                               type="button"
//                               className={
//                                 "toggle-btn " +
//                                 (activePlan === "monthly" ? "active" : "")
//                               }
//                               style={{
//                                 border: "1px solid #E9E9E9",
//                                 borderRadius: "20px 0 0 20px",
//                                 background:
//                                   activePlan === "monthly" ? "#4a67ff" : "#fff",
//                                 color:
//                                   activePlan === "monthly" ? "#fff" : "#333",
//                                 padding: "6px 22px",
//                                 fontWeight: 600,
//                                 outline: "none",
//                                 cursor: "pointer",
//                                 transition: "all 0.2s",
//                               }}
//                               onClick={() => setActivePlan("monthly")}
//                             >
//                               Monthly
//                             </button>
//                             <button
//                               type="button"
//                               className={
//                                 "toggle-btn " +
//                                 (activePlan === "annually" ? "active" : "")
//                               }
//                               style={{
//                                 border: "1px solid #E9E9E9",
//                                 borderRadius: "0 20px 20px 0",
//                                 background:
//                                   activePlan === "annually"
//                                     ? "#4a67ff"
//                                     : "#fff",
//                                 color:
//                                   activePlan === "annually" ? "#fff" : "#333",
//                                 padding: "6px 22px",
//                                 fontWeight: 600,
//                                 outline: "none",
//                                 cursor: "pointer",
//                                 transition: "all 0.2s",
//                                 marginLeft: "-1px",
//                               }}
//                               onClick={() => setActivePlan("annually")}
//                             >
//                               Yearly
//                             </button>
//                           </div>
//                         </div>
//                         {/* Plan Cards */}
//                         {(() => {
//                           // Monthly base prices
//                           const standardMonthly = 122;
//                           const proMonthly = 589;
//                           // Yearly calculation
//                           const months = 12;
//                           const discount = 0.15;
//                           const standardYearlyRaw = standardMonthly * months;
//                           const proYearlyRaw = proMonthly * months;
//                           const standardYearly = Math.round(
//                             standardYearlyRaw * (1 - discount),
//                           );
//                           const proYearly = Math.round(
//                             proYearlyRaw * (1 - discount),
//                           );
//                           // Card data
//                           const plans = [
//                             {
//                               key: "free",
//                               name: "Free",
//                               price: 0,
//                               priceText:
//                                 activePlan === "annually" ? "/Year" : "/Month",
//                               features: ["Upto 2 Employee"],
//                               highlight: false,
//                               badge: "",
//                             },
//                             {
//                               key: "standard",
//                               name: "Standard",
//                               price:
//                                 activePlan === "annually"
//                                   ? standardYearly
//                                   : standardMonthly,
//                               priceText:
//                                 activePlan === "annually" ? "/Year" : "/Month",
//                               features: ["Upto 10 Employee"],
//                               highlight:
//                                 activePlan === "monthly" ? false : true,
//                               badge:
//                                 activePlan === "annually"
//                                   ? "Best Value"
//                                   : "Most Popular",
//                               raw:
//                                 activePlan === "annually"
//                                   ? standardYearlyRaw
//                                   : undefined,
//                             },
//                             {
//                               key: "pro",
//                               name: "Pro",
//                               price:
//                                 activePlan === "annually"
//                                   ? proYearly
//                                   : proMonthly,
//                               priceText:
//                                 activePlan === "annually" ? "/Year" : "/Month",
//                               features: ["Upto 50 Employee"],
//                               highlight: false,
//                               badge: "",
//                               raw:
//                                 activePlan === "annually"
//                                   ? proYearlyRaw
//                                   : undefined,
//                             },
//                           ];
//                           return (
//                             <div className="row g-3">
//                               {plans.map((plan) => (
//                                 <div className="col-md-4" key={plan.key}>
//                                   <label
//                                     className={`plan-card w-100 h-100 d-block rounded-4 shadow-sm position-relative ${
//                                       selectedPlan === plan.key
//                                         ? "plan-selected border-primary shadow-lg"
//                                         : "border"
//                                     } ${plan.highlight ? "plan-highlight" : ""}`}
//                                     style={{
//                                       cursor: "pointer",
//                                       borderWidth:
//                                         selectedPlan === plan.key ? 2 : 1,
//                                       borderColor:
//                                         selectedPlan === plan.key
//                                           ? "#4a67ff"
//                                           : "#e3e8f0",
//                                       background:
//                                         selectedPlan === plan.key
//                                           ? "#f5f8ff"
//                                           : "#fff",
//                                       transition: "all 0.2s",
//                                       minHeight: 180,
//                                       padding: 0,
//                                     }}
//                                   >
//                                     {/* Badge */}
//                                     {plan.badge && (
//                                       <span
//                                         className="badge bg-primary position-absolute"
//                                         style={{
//                                           top: 10,
//                                           right: 16,
//                                           fontSize: 10,
//                                           fontWeight: 600,
//                                           letterSpacing: 0.5,
//                                           zIndex: 2,
//                                         }}
//                                       >
//                                         {plan.badge}
//                                       </span>
//                                     )}
//                                     {/* Custom Radio */}
//                                     <input
//                                       type="radio"
//                                       name="plan"
//                                       checked={selectedPlan === plan.key}
//                                       onChange={() => setSelectedPlan(plan.key)}
//                                       style={{ display: "none" }}
//                                     />
//                                     <div className="p-4">
//                                       <div className="d-flex align-items-center mb-2">
//                                         <span
//                                           className={`plan-radio me-2 ${selectedPlan === plan.key ? "plan-radio-checked" : ""}`}
//                                           style={{
//                                             width: 22,
//                                             height: 22,
//                                             borderRadius: "50%",
//                                             border: `2px solid ${selectedPlan === plan.key ? "#4a67ff" : "#bfc9d9"}`,
//                                             display: "inline-flex",
//                                             alignItems: "center",
//                                             justifyContent: "center",
//                                             background: "#fff",
//                                             marginRight: 10,
//                                           }}
//                                         >
//                                           {selectedPlan === plan.key && (
//                                             <span
//                                               style={{
//                                                 width: 10,
//                                                 height: 10,
//                                                 borderRadius: "50%",
//                                                 background: "#4a67ff",
//                                                 display: "block",
//                                               }}
//                                             />
//                                           )}
//                                         </span>
//                                         <span
//                                           style={{
//                                             fontWeight: 700,
//                                             fontSize: 17,
//                                           }}
//                                         >
//                                           {plan.name}
//                                         </span>
//                                       </div>
//                                       <div className="mb-2">
//                                         <span
//                                           style={{
//                                             fontSize: 26,
//                                             fontWeight: 700,
//                                             color: "#0447AA",
//                                           }}
//                                         >
//                                           ₹{plan.price}
//                                         </span>
//                                         <span
//                                           className="text-muted ms-1"
//                                           style={{ fontSize: 13 }}
//                                         >
//                                           {plan.priceText}
//                                         </span>
//                                         {activePlan === "annually" &&
//                                           plan.raw && (
//                                             <span
//                                               className="text-success ms-2"
//                                               style={{
//                                                 fontSize: 12,
//                                                 fontWeight: 500,
//                                               }}
//                                             >
//                                               <s className="text-muted">
//                                                 ₹{plan.raw}
//                                               </s>{" "}
//                                               -15%
//                                             </span>
//                                           )}
//                                       </div>
//                                       <ul className="list-unstyled mb-0">
//                                         {plan.features.map((f, i) => (
//                                           <li
//                                             key={i}
//                                             className="text-muted"
//                                             style={{ fontSize: 13 }}
//                                           >
//                                             <LuCheck className="me-1 text-success" />{" "}
//                                             {f}
//                                           </li>
//                                         ))}
//                                       </ul>
//                                     </div>
//                                   </label>
//                                 </div>
//                               ))}
//                             </div>
//                           );
//                         })()}
//                       </div>
//                     </div>
//                   )}
//                   {/* BUTTONS */}
//                   <div className="d-flex justify-content-between mt-4">
//                     <button
//                       type="button"
//                       className="btn btn-light"
//                       onClick={handlePrev}
//                       disabled={step === 0}
//                     >
//                       Back
//                     </button>

//                     {step < steps.length - 1 ? (
//                       <button
//                         type="button"
//                         className="btn btn-primary"
//                         onClick={handleNext}
//                         disabled={loading}
//                       >
//                         {loading ? "Please wait..." : "Next"}
//                       </button>
//                     ) : (
//                       <button
//                         type="submit"
//                         className="btn btn-success"
//                         disabled={loading}
//                       >
//                         {loading ? "Creating Account..." : "Create Account"}
//                       </button>
//                     )}
//                   </div>
//                 </form>
//               </div>
//               {showSelectIndustry && (
//                 <PopUpIndustryChoose
//                   setshowSelectIndustry={setshowSelectIndustry}
//                   selectIndustry={handleIndustrySelect}
//                 />
//               )}
//             </div>
//           </div>

//           {/* RIGHT IMAGE */}

//           <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center auth-left">
//             <div className="inventory-hero">
//               {/* Logo */}
//               <div className="hero-logo">
//                 <div className="logo-icon">📦</div>
//                 <div>
//                   <h4>Invenzo</h4>
//                   <p>Inventory Management</p>
//                 </div>
//               </div>

//               {/* Heading */}
//               <h1 className="hero-title">
//                 Smart Inventory <br /> Better Business
//               </h1>

//               <p className="hero-subtitle">
//                 Manage your stock, orders, sales and suppliers in one powerful
//                 platform.
//               </p>

//               {/* Features */}
//               <div className="hero-features">
//                 <div className="feature">
//                   <div className="icon">📊</div>
//                   <div>
//                     <h6>Real-time Stock Tracking</h6>
//                     <p>
//                       Track your inventory in real-time and avoid stockouts.
//                     </p>
//                   </div>
//                 </div>

//                 <div className="feature">
//                   <div className="icon">🛒</div>
//                   <div>
//                     <h6>Purchase & Sales</h6>
//                     <p>Manage purchases, sales and returns seamlessly.</p>
//                   </div>
//                 </div>

//                 <div className="feature">
//                   <div className="icon">📈</div>
//                   <div>
//                     <h6>Reports & Analytics</h6>
//                     <p>Get detailed insights and grow your business.</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Bottom Image */}
//               <div className="hero-image">
//                 <img
//                   src={login_background}
//                   className="img-fluid"
//                   alt="dashboard"
//                 />
//               </div>
//             </div>
//           </div>

//           {/* <div
//             className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center auth-left"
//             style={{
//               position: "fixed",
//               right: 0,
//               top: 0,
//               height: "100vh",
//               width: "50vw",
//               minWidth: 0,
//               zIndex: 2,
//               background: "#f8f9fb",
//             }}
//           >
//             <img
//               src={login_background}
//               className="img-fluid auth-img"
//               alt="inventory"
//               style={{ maxHeight: "90vh", objectFit: "contain" }}
//             />
//           </div> */}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AuthPage;
