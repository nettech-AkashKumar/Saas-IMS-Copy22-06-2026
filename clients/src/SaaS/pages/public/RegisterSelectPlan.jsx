import React, { useState } from "react";
import login_background from "../../assets/Image/categoryblank.png";
import munc_logo from "../../assets/Image/munc-logo.png";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/css/Responsive.css";
import { MdKeyboardBackspace } from "react-icons/md";
import { LuCheck } from "react-icons/lu";
import { GrShare } from "react-icons/gr";
import { useRegister } from "../../context/RegisterContext";
// import BASE_URL from '../../services/config/config';

const BASE_URL = "http://localhost:4000";
const RegisterSelectPlan = () => {
  const [activePlan, setActivePlan] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("FREE");
  const navigate = useNavigate();

  const { registerData } = useRegister();

  const registerCompany = async (plan) => {
    // Validate required fields
    const requiredFields = [
      "companyName",
      "companyEmail",
      "companyPhone",
      "employeeSize",
      "industry",
      "subdomain",
      "adminName",
      "adminEmail",
      "adminPassword",
      "phone",
    ];
    for (let field of requiredFields) {
      if (!registerData[field]) {
        alert(`Please fill the required field: ${field}`);
        return;
      }
    }

    const payload = {
      companyName: registerData.companyName,
      companyEmail: registerData.companyEmail,
      companyPhone: registerData.companyPhone,
      employeeSize: registerData.employeeSize,
      industry: registerData.industry,
      gst: registerData.gst,
      website: registerData.website,
      subdomain: registerData.subdomain,
      adminName: registerData.adminName,
      adminEmail: registerData.adminEmail,
      adminPassword: registerData.adminPassword,
      phone: registerData.phone,
      plan,
    };

    try {
      const res = await fetch(`${BASE_URL}/api/public/register-company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed. Please try again.");
        return;
      }

      alert("Company Registered Successfully 🎉");
      navigate("/success-message");
    } catch (err) {
      alert("Something went wrong. Please try again.");
    }
  };
  return (
    <div>
      <div className="d-flex" style={{ height: "100vh" }}>
        {/* login-container */}
        <div
          className="login-container"
          style={{
            backgroundColor: "white",
            width: "100%",
            // height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter",
          }}
        >
          <div
            className="register-account-container"
            style={{
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* back button */}
            <label
              htmlFor=""
              style={{
                fontWeight: "400",
                fontSize: "clamp(14px,2vw,16px)",
                color: "#000000",
                display: "flex",
                width: "100%",
                paddingBottom: "15px",
              }}
            >
              <Link
                to="/register-company-details"
                style={{ textDecoration: "none", color: "black" }}
              >
                <MdKeyboardBackspace style={{ color: "black" }} /> Back
              </Link>
            </label>

            {/* munc logo */}
            <img
              src={munc_logo}
              alt="munc_logo"
              style={{
                maxWidth: "214px",
                width: "100%",
                paddingBottom: "15px",
              }}
            />

            {/* subscription header */}
            <div className="register-account-head-title text-center">
              <h3
                style={{
                  fontSize: "clamp(14px,2vw,20px)",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                Register your Account
              </h3>
              <p
                style={{
                  fontSize: "clamp(12px,2vw,14px)",
                  color: "#1E1E1E",
                  fontWeight: "400",
                }}
              >
                Select Plan
              </p>
            </div>

            {/* Monthly Yearly */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                paddingBottom: "15px",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "clamp(12px,2vw,14px)",
                  color: "#0056F5",
                }}
              >
                Save 15% on Yearly Plan
              </span>
              <div
                style={{
                  border: "1px solid #E9E9E9",
                  borderRadius: "68px",
                  width: "fit-content",
                  height: "34px",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  background: "#fff",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActivePlan("monthly")}
                  style={{
                    borderRadius: "16px",
                    padding: "4px 14px",
                    border: "none",
                    fontSize: "clamp(12px,2vw,14px)",
                    backgroundColor:
                      activePlan === "monthly" ? "#4a67ff" : "transparent",
                    color: activePlan === "monthly" ? "#fff" : "#333",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlan("annually")}
                  style={{
                    borderRadius: "16px",
                    padding: "4px 14px",
                    border: "none",
                    fontSize: "clamp(12px,2vw,14px)",
                    backgroundColor:
                      activePlan === "annually" ? "#4a67ff" : "transparent",
                    color: activePlan === "annually" ? "#fff" : "#333",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Annually
                </button>
              </div>
            </div>

            <form
              action=""
              style={{ display: "flex", gap: "16px", flexDirection: "column" }}
            >
              {(() => {
                const standardMonthly = 122;
                const proMonthly = 589;
                const months = 12;
                const discount = 0.15;
                const standardYearlyRaw = standardMonthly * months;
                const proYearlyRaw = proMonthly * months;
                const standardYearly = Math.round(
                  standardYearlyRaw * (1 - discount),
                );
                const proYearly = Math.round(proYearlyRaw * (1 - discount));
                const plans = [
                  {
                    key: "FREE",
                    name: "Free",
                    price: 0,
                    priceText: activePlan === "annually" ? "/Year" : "/Month",
                    features: ["Upto 2 Employee"],
                    badge: "",
                    savings: "",
                  },
                  {
                    key: "BASIC",
                    name: "Standard",
                    price:
                      activePlan === "annually"
                        ? standardYearly
                        : standardMonthly,
                    priceText: activePlan === "annually" ? "/Year" : "/Month",
                    features: ["Upto 10 Employee"],
                    badge:
                      activePlan === "annually" ? "Best Value" : "Most Popular",
                    raw:
                      activePlan === "annually" ? standardYearlyRaw : undefined,
                    savings:
                      activePlan === "annually"
                        ? `Save ₹${standardYearlyRaw - standardYearly} PA`
                        : "",
                  },
                  {
                    key: "PRO",
                    name: "Pro",
                    price: activePlan === "annually" ? proYearly : proMonthly,
                    priceText: activePlan === "annually" ? "/Year" : "/Month",
                    features: ["Upto 50 Employee"],
                    badge: "",
                    raw: activePlan === "annually" ? proYearlyRaw : undefined,
                    savings:
                      activePlan === "annually"
                        ? `Save ₹${proYearlyRaw - proYearly} PA`
                        : "",
                  },
                ];

                return (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {plans.map((plan) => {
                      const isSelected = selectedPlan === plan.key;
                      return (
                        <label
                          key={plan.key}
                          className="plan-card"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            borderRadius: "16px",
                            border: isSelected
                              ? "2px solid #4a67ff"
                              : "1px solid #e3e8f0",
                            background: isSelected ? "#f5f8ff" : "#fff",
                            padding: "24px",
                            cursor: "pointer",
                            boxShadow: isSelected
                              ? "0 10px 30px rgba(74,103,255,0.12)"
                              : "0 0 0 rgba(0,0,0,0)",
                            transition: "all 0.2s ease",
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: "16px",
                            position: "relative",
                          }}
                        >
                          {plan.badge && (
                            <span
                              style={{
                                position: "absolute",
                                top: 16,
                                right: 16,
                                background: "#4a67ff",
                                color: "#fff",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "6px 10px",
                                borderRadius: "999px",
                              }}
                            >
                              {plan.badge}
                            </span>
                          )}
                          <input
                            type="radio"
                            name="plan"
                            checked={isSelected}
                            onChange={() => setSelectedPlan(plan.key)}
                            style={{ display: "none" }}
                          />
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "12px",
                              }}
                            >
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: "50%",
                                  border: `2px solid ${isSelected ? "#4a67ff" : "#bfc9d9"}`,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#fff",
                                }}
                              >
                                {isSelected && (
                                  <span
                                    style={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: "50%",
                                      background: "#4a67ff",
                                      display: "block",
                                    }}
                                  />
                                )}
                              </span>
                              <span
                                style={{ fontSize: "18px", fontWeight: 700 }}
                              >
                                {plan.name}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-end",
                                gap: "8px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "32px",
                                  fontWeight: 700,
                                  color: "#0447AA",
                                }}
                              >
                                ₹{plan.price}
                              </span>
                              <span
                                style={{ fontSize: "14px", color: "#626d93" }}
                              >
                                {plan.priceText}
                              </span>
                            </div>
                            {plan.raw && (
                              <div
                                style={{
                                  marginTop: "10px",
                                  fontSize: "13px",
                                  color: "#0b9a04",
                                  fontWeight: 500,
                                }}
                              >
                                <span
                                  style={{
                                    textDecoration: "line-through",
                                    color: "#8c96a8",
                                  }}
                                >
                                  ₹{plan.raw}
                                </span>{" "}
                                - 15% off
                              </div>
                            )}
                            {plan.savings && (
                              <div
                                style={{
                                  marginTop: "8px",
                                  fontSize: "13px",
                                  color: "#0b9a04",
                                }}
                              >
                                {plan.savings}
                              </div>
                            )}
                            <ul
                              style={{
                                marginTop: "18px",
                                paddingLeft: "18px",
                                color: "#626d93",
                                fontSize: "14px",
                              }}
                            >
                              {plan.features.map((feature, idx) => (
                                <li
                                  key={idx}
                                  style={{
                                    marginBottom: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                  }}
                                >
                                  <LuCheck /> {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Explore */}
              <label
                htmlFor=""
                style={{
                  fontWeight: "400",
                  fontSize: "clamp(12px,2vw,14px)",
                  color: "#000000",
                }}
              >
                <span style={{ color: "#0056F5" }}>
                  Explore Plans in details
                </span>{" "}
                <GrShare />
              </label>

              {/* Submit Button */}
              <button
                type="button"
                className="input-all-box"
                onClick={() => registerCompany(selectedPlan)}
                style={{
                  backgroundColor: "#0084FF",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  width: "400px",
                  border: "none",
                  color: "white",
                  fontSize: "clamp(14px,2vw,16px)",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>

        {/* login-background */}
        <div
          className="login-background"
          style={{
            backgroundColor: "#0447AA",
            width: "100%",
            // height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={login_background}
            alt="login_background"
            style={{ width: "100%", maxWidth: "482px" }}
          />
        </div>
      </div>
    </div>
  );
};

export default RegisterSelectPlan;
