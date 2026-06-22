import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ButtonGroup } from "react-bootstrap";
import { toast } from "react-toastify";

// pages
import "./PointsRewards.css";
import Surprisebox from "../../../assets/images/Surprisebox.gif";
import api from "../../../pages/config/axiosInstance"

// icons
import { FaArrowLeft } from "react-icons/fa6";
import { GrSend } from "react-icons/gr";
import { FaRegCopy } from "react-icons/fa6";
import { RiMessage2Fill } from "react-icons/ri";
import { RiWhatsappFill } from "react-icons/ri";

// images
import Coin from "../../../assets/images/Coin.png";
import CashinHand from "../../../assets/images/CashinHand.png";
import Handshake from "../../../assets/images/Handshake.png";
import Rank from "../../../assets/images/Rank.png";
import Box from "../../../assets/images/Box.png";
import Coins from "../../../assets/images/Coins.png";

function CreateShoppingPoints() {
  const location = useLocation();
  const editReward = location.state?.mode === "edit" ? location.state.reward : null;
  const isEditMode = Boolean(editReward?._id);
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const rewards = [
    {
      id: "Shopping Points",
      title: "Shopping Points",
      desc: "Earn points for every dollar spent, redeemable for discounts or products.",
      icon: Coin,
      color: "#1F7FFF",
    },
    {
      id: "Cashback",
      title: "Cashback",
      desc: "Get a percentage back of money spent as cash or store credit.",
      icon: CashinHand,
    },
    {
      id: "Referral",
      title: "Referral Rewards",
      desc: "Earn rewards for referring new customers, who also get a reward.",
      icon: Handshake,
    },
    {
      id: "Tiered",
      title: "Tiered Loyalty",
      desc: "Unlock higher reward levels (e.g., Bronze, Silver, Gold) based on spending.",
      icon: Rank,
    },
  ];

  const [selected, setSelected] = useState(editReward?.rewardType || "Shopping Points");
  const [activeTab, setActiveTab] = useState("reward");
  const switchTab = (tab) => setActiveTab(tab);
  const [currentStep, setCurrentStep] = useState(location.state?.step || 1);
  const [offerName, setOfferName] = useState(editReward?.offerName || "");
  const [amountForPoint, setAmountForPoint] = useState(editReward?.amountForPoint || "");
  const [minPurchase, setMinPurchase] = useState(editReward?.minPurchase || "");
  const [deadline, setDeadline] = useState(formatDateForInput(editReward?.deadline));
  const [pointValue, setPointValue] = useState(editReward?.pointValue || "");
  const [maxEligibleAmount, setMaxEligibleAmount] = useState(editReward?.maxEligibleAmount || "");
  const [minInvoiceValue, setMinInvoiceValue] = useState(editReward?.minInvoiceValue || "");
  const [shareoptions, setShareoptions] = useState(false);
  const [loading, setLoading] = useState(false); // For button loading state
  const [error, setError] = useState(""); // For error messages
  const [errors, setErrors] = useState({}); // For form validation errors
  const handleShareOptions = () => setShareoptions(!shareoptions);

  const handleSelectNext = async () => {
    if (!selected) {
      toast.error("Please select a reward type");
      return;
    }
    setCurrentStep(2);
  };

  const handleSetupNext = async () => {

    // 1️⃣ Mandatory fields
    if (!selected) {
      toast.error("Reward type is required");
      return;
    }

    if (!offerName.trim()) {
      setErrors({ offerName: "Coupon Code is required" });
      switchTab("reward");
      return;
    }

    // 2️⃣ Validate Reward Setup (All fields required)
    if (!amountForPoint || amountForPoint <= 0) {
      setErrors({ amountForPoint: "Valid amount for 1 point is required in Reward Setup" });
      switchTab("reward");
      return;
    }
    if (!minPurchase || minPurchase <= 0) {
      setErrors({ minPurchase: "Valid minimum purchase amount is required in Reward Setup" });
      switchTab("reward");
      return;
    }
    if (!deadline) {
      setErrors({ deadline: "Deadline is required in Reward Setup" });
      switchTab("reward");
      return;
    }

    // 3️⃣ Validate Redeem Setup (All fields required)
    if (!pointValue || pointValue <= 0) {
      setErrors({ pointValue: "Valid point value is required in Redeem Setup" });
      switchTab("redeem");
      return;
    }
    if (!maxEligibleAmount || maxEligibleAmount <= 0) {
      setErrors({ maxEligibleAmount: "Valid max eligible amount is required in Redeem Setup" });
      switchTab("redeem");
      return;
    }
    if (!minInvoiceValue || minInvoiceValue <= 0) {
      setErrors({ minInvoiceValue: "Valid minimum invoice value is required in Redeem Setup" });
      switchTab("redeem");
      return;
    }

    // 4️⃣ Payload (clean)
    const payload = {
      rewardType: selected,
      offerName: offerName.trim(),
      amountForPoint: Number(amountForPoint),
      minPurchase: Number(minPurchase),
      deadline,
      pointValue: Number(pointValue),
      maxEligibleAmount: Number(maxEligibleAmount),
      minInvoiceValue: Number(minInvoiceValue),
    };

    try {
      setLoading(true);
      if (isEditMode) {
        await api.put(`/api/reward-systems/${editReward._id}`, payload);
      } else {
        await api.post("/api/reward-systems/create", payload);
      }
      setCurrentStep(3);
      toast.success(`Reward system ${isEditMode ? "updated" : "created"} successfully`);
    } catch (err) {
      const msg = err.response?.data?.message || "Save failed";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  return (
    <div
      className="p-4"
      style={{
        width: "100%",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        overflowY: 'hidden',
        flexDirection: "column",
        height: "90vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "35px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
          }}
        >
          <Link
            to="/point-rewards"
            style={{
              width: 32,
              height: 32,
              background: "white",
              borderRadius: 53,
              border: "1.07px solid #EAEAEA",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>

          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            Points & Rewards
          </h2>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ color: "red", textAlign: "center", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}>
        {/* Select Reward System */}
        {currentStep === 1 && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div className="pointCard"
              style={{
                maxHeight: "calc(100vh - 190px)",
                overflowY: "auto",
              }}
            >
              {/* Main Card */}
              <div
                style={{
                  background: "white",
                  borderRadius: "20px",
                  padding: "20px 40px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.05)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    maxWidth: "920px",
                    margin: "0 auto",
                    textAlign: "left",
                    zIndex: 10,
                  }}
                >
                  {/* Title & Description */}
                  <div
                    style={{
                      marginBottom: "48px",
                      width: "720px",
                      marginTop: "30px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "30px",
                        fontWeight: "600",
                        color: "#0E101A",
                        marginTop: "16px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "left",
                        gap: "12px",
                      }}
                    >
                      <img src={Box} alt="box logo" /> Select Reward System
                    </span>
                    <p
                      style={{
                        fontSize: "16px",
                        color: "#727681",
                        lineHeight: "2",
                      }}
                    >
                      Select the type of reward you'd like to offer to your
                      customers, whether it's points, discounts, or exclusive
                      perks.
                      <br />
                      Customize your reward options to enhance engagement and
                      loyalty.
                    </p>
                  </div>

                  {/* Reward Options Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(210px, 1fr))",
                      gap: "25px",
                      marginBottom: "50px",
                    }}
                  >
                    {rewards.map((reward) => (
                      <div
                        key={reward.id}
                        onClick={() => setSelected(reward.id)}
                        style={{
                          padding: "28px 20px 6px",
                          background: "white",
                          borderRadius: "16px",
                          border:
                            selected === reward.id
                              ? "3px solid #1F7FFF"
                              : "1px solid #EAEAEA",
                          boxShadow:
                            selected === reward.id
                              ? "0 10px 30px rgba(31,127,255,0.15)"
                              : "0 4px 15px rgba(0,0,0,0.05)",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {/* Checkmark */}
                        {selected === reward.id && (
                          <div
                            style={{
                              position: "absolute",
                              top: "40px",
                              right: "20px",
                              width: "28px",
                              height: "28px",
                              // background: '#1F7FFF',
                              borderRadius: "20%",
                              border: "2px solid #1F7FFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#1F7FFF"
                              strokeWidth="3"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        )}

                        <img
                          src={reward.icon}
                          alt={reward.title}
                          style={{
                            width: "56px",
                            height: "54px",
                            marginBottom: "50px",
                          }}
                        />

                        <h3
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#0E101A",
                            marginBottom: "2px",
                          }}
                        >
                          {reward.title}
                        </h3>
                        <p style={{ fontSize: "11px", color: "#727681" }}>
                          {reward.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Next Button + image */}
                  <div
                    style={{
                      zIndex: 1,
                      // position: "absolute",
                      // right: "340px",
                      // top: "680px",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <button
                      // className="button-hover"
                      // onClick={handleSelectNext}
                      onClick={handleSelectNext}
                      disabled={loading}
                      style={{
                        padding: "10px 18px",
                        background: "#1F7FFF",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "600",
                        border: "none",
                        borderRadius: "12px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "12px",
                        // boxShadow: '0 8px 25px rgba(31,127,255,0.3), inset -1px -1px 6px rgba(0,0,0,0.2)',
                        transition: "all 0.3s",
                        marginBottom: "40px",
                        textDecoration: "none",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "translateY(-3px)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "translateY(0)")
                      }
                    >
                      {loading ? "Saving..." : "Next"}
                    </button>

                    {/* Coins Icon */}
                    <div>
                      <img src={Coins} alt="coins design" />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )}

        {/* Set Up Your Reward System */}
        {currentStep === 2 && (
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              // height: "100vh",
              overflow: "auto",
            }}
          >
            <div
              className="pointCard"
              style={{
                width: "900px",
                padding: "0px",
                maxHeight: "calc(100vh - 190px)",
                overflowY: "auto",
              }}>
              <div
                style={{
                  width: "100%",
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "60px 70px",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: "32px",
                  boxSizing: "border-box",
                }}
              >
                {/* Tabs */}
                <div
                  style={{
                    border: "1px solid #EAEAEA",
                    padding: "12px",
                    borderRadius: "12px",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{ display: "flex", gap: "16px", width: "100%" }}
                  >
                    <button
                      onClick={() => switchTab("reward")}
                      style={{
                        padding: "12px 20px",
                        border: "none",
                        backgroundColor:
                          activeTab === "reward" ? "#E5F0FF" : "transparent",
                        color: activeTab === "reward" ? "#1F7FFF" : "#727681",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "500",
                        cursor: "pointer",
                        width: "50%",
                      }}
                    >
                      Reward Setup
                    </button>

                    <button
                      onClick={() => switchTab("redeem")}
                      style={{
                        padding: "12px 20px",
                        border: "none",
                        backgroundColor:
                          activeTab === "redeem" ? "#E5F0FF" : "transparent",
                        color: activeTab === "redeem" ? "#1F7FFF" : "#727681",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "500",
                        cursor: "pointer",
                        width: "50%",
                      }}
                    >
                      Redeem Setup
                    </button>
                  </div>
                </div>

                {/* 2 Column Layout */}
                <div
                  style={{
                    display: "flex",
                    gap: "0px",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Left: Form */}
                  <div style={{ flex: 1, maxWidth: "60%" }}>
                    {/* Reward Tab */}
                    {activeTab === "reward" && (
                      <form
                        // onSubmit={handleRewardSubmit}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "24px",
                            fontWeight: "600",
                            color: "#0E101A",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <img src={Box} alt="box logo" /> Set Up Your Reward
                          System
                        </h2>

                        {/* Coupon Code */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <label
                            style={{ fontSize: "14px", color: "#0E101A" }}
                          >
                            Coupon Code
                          </label>
                          <input
                            value={offerName}
                            onChange={(e) => setOfferName(e.target.value)}
                            placeholder="Enter coupon code"
                            style={{
                              padding: "10px 12px",
                              borderRadius: "8px",
                              border: "1px solid #A2A8B8",
                              fontSize: "14px",
                            }}
                          />
                          <span
                            style={{ fontSize: "12px", color: "#727681" }}
                          >
                            Please provide a Coupon Code for your offer setup
                          </span>
                          {errors.offerName && (
                            <p className="text-danger">{errors.offerName}</p>
                          )}
                        </div>

                        {/* Amount for 1 Point */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <label
                            style={{ fontSize: "14px", color: "#0E101A" }}
                          >
                            Set Amount for 1 Reward Point
                          </label>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            {/* Left Box */}
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                borderRadius: "8px",
                                border: "1px solid #A2A8B8",
                                padding: "8px 12px",
                              }}
                            >
                              <span style={{ fontSize: "14px" }}>₹</span>
                              <input
                                type="number"
                                value={amountForPoint}
                                minLength={0}
                                onChange={(e) =>
                                  setAmountForPoint(e.target.value)
                                }
                                style={{
                                  border: "none",
                                  outline: "none",
                                  fontSize: "14px",
                                  flex: 1,
                                }}
                              />
                            </div>

                            <span
                              style={{
                                fontSize: "18px",
                                fontWeight: "500",
                                color: "#727681",
                              }}
                            >
                              =
                            </span>

                            {/* Right Box */}
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                borderRadius: "8px",
                                border: "1px solid #EAEAEA",
                                padding: "8px 12px",
                              }}
                            >
                              <span
                                style={{ fontSize: "14px", color: "#727681" }}
                              >
                                1 Point
                              </span>
                            </div>
                          </div>

                          <span
                            style={{ fontSize: "12px", color: "#727681" }}
                          >
                            How much do they need to spend to earn 1 point?
                          </span>
                          {errors.amountForPoint && (
                            <p className="text-danger">{errors.amountForPoint}</p>
                          )}
                        </div>

                        {/* Minimum Purchase */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <label
                            style={{ fontSize: "14px", color: "#0E101A" }}
                          >
                            Minimum purchase amount to earn points
                          </label>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              borderRadius: "8px",
                              border: "1px solid #A2A8B8",
                              padding: "8px 12px",
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>₹</span>
                            <input
                              type="number"
                              value={minPurchase}
                              minLength={0}
                              onChange={(e) =>
                                setMinPurchase(e.target.value)
                              }
                              style={{
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                flex: 1,
                              }}
                            />
                          </div>

                          <span
                            style={{ fontSize: "12px", color: "#727681" }}
                          >
                            How much do they need to spend to be eligible?
                          </span>
                          {errors.minPurchase && (
                            <p className="text-danger">{errors.minPurchase}</p>
                          )}
                        </div>

                        {/* Deadline */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <label
                            style={{ fontSize: "14px", color: "#0E101A" }}
                          >
                            Set Deadline
                          </label>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <input
                              type="date"
                              value={deadline}
                              onChange={(e) => setDeadline(e.target.value)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: "8px",
                                border: "1px solid #A2A8B8",
                                fontSize: "14px",
                                flex: 1,
                              }}
                            />
                          </div>

                          <span
                            style={{ fontSize: "12px", color: "#727681" }}
                          >
                            Set the expiry date for this offer.
                          </span>
                          {errors.deadline && (
                            <p className="text-danger">{errors.deadline}</p>
                          )}
                        </div>

                        {/* buttons */}
                        <div
                          style={{ display: "flex", gap: "20px", marginTop: "10px" }}
                        >
                          <button
                            onClick={handleBack} disabled={loading}
                            className="button-hover"
                            to="/m/createshoppingpoints"
                            type="button"
                            style={{
                              padding: "4px 8px",
                              background: "white",
                              border: "1.5px solid #1F7FFF",
                              borderRadius: "8px",
                              color: "#1F7FFF",
                              fontWeight: "500",
                              cursor: "pointer",
                              textDecoration: "none",
                            }}
                          >
                            Back
                          </button>

                          <button
                            className="button-hover"
                            // onClick={handleSetupNext}
                            onClick={() => switchTab("redeem")}
                            disabled={loading}
                            style={{
                              padding: "4px 8px",
                              background: "#1F7FFF",
                              border: "1.5px solid #1F7FFF",
                              borderRadius: "8px",
                              color: "white",
                              fontWeight: "500",
                              cursor: "pointer",
                              textDecoration: "none",
                            }}
                          >
                            {loading ? "Creating Reward System..." : "Next"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Redeem Tab */}
                    {activeTab === "redeem" && (
                      <form
                        // onSubmit={handleRedeemSubmit}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "20px",
                        }}
                      >
                        <h2
                          style={{
                            fontSize: "24px",
                            fontWeight: "600",
                            color: "#0E101A",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <img src={Box} alt="box logo" /> Set Up Your Redeem
                          System
                        </h2>

                        {/* 1 Point = ₹ X */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <label
                            style={{ fontSize: "14px", color: "#0E101A" }}
                          >
                            Set value of 1 point in Rupees for redemption
                          </label>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                borderRadius: "8px",
                                border: "1px solid #EAEAEA",
                                padding: "8px 12px",
                                background: "#ffffff",
                              }}
                            >
                              <span
                                style={{ fontSize: "14px", color: "#727681" }}
                              >
                                1 Point
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize: "18px",
                                fontWeight: "500",
                                color: "#727681",
                              }}
                            >
                              =
                            </span>

                            <div
                              style={{
                                width: "45%",
                                minWidth: "130px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                borderRadius: "8px",
                                border: "1px solid #A2A8B8",
                                padding: "8px 12px",
                              }}
                            >
                              <span style={{ fontSize: "14px" }}>₹</span>
                              <input
                                type="number"
                                placeholder="00"
                                value={pointValue}
                                minLength={0}
                                onChange={(e) =>
                                  setPointValue(e.target.value)
                                }
                                style={{
                                  border: "none",
                                  outline: "none",
                                  fontSize: "14px",
                                  width: "100%",
                                }}
                              />
                            </div>
                          </div>

                          <span
                            style={{ fontSize: "12px", color: "#727681" }}
                          >
                            Enter conversion for redemption
                          </span>
                          {errors.pointValue && (
                            <p className="text-danger">{errors.pointValue}</p>
                          )}
                        </div>

                        {/* Max eligible amount (%) */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <label
                            style={{ fontSize: "14px", color: "#0E101A" }}
                          >
                            Enter maximum amount (%) eligible for points
                          </label>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              borderRadius: "8px",
                              border: "1px solid #A2A8B8",
                              padding: "8px 12px",
                              width: "50%",
                              // minWidth: "140px",
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>%</span>
                            <input
                              type="number"
                              placeholder="00"
                              value={maxEligibleAmount}
                              minLength={0}
                              maxLength={100}
                              onChange={(e) =>
                                setMaxEligibleAmount(e.target.value)
                              }
                              style={{
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                flex: 1,
                                minWidth: "170px",
                              }}
                            />
                          </div>
                          {errors.maxEligibleAmount && (
                            <p className="text-danger">{errors.maxEligibleAmount}</p>
                          )}
                        </div>

                        {/* Minimum invoice value */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                          }}
                        >
                          <label
                            style={{ fontSize: "14px", color: "#0E101A" }}
                          >
                            Set minimum invoice value for redemption
                            eligibility
                          </label>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "3px",
                              borderRadius: "8px",
                              border: "1px solid #A2A8B8",
                              padding: "8px 12px",
                              width: "50%",
                              minWidth: "160px",
                            }}
                          >
                            <span style={{ fontSize: "14px" }}>₹</span>
                            <input
                              type="number"
                              placeholder="00"
                              value={minInvoiceValue}
                              minLength={0}
                              onChange={(e) =>
                                setMinInvoiceValue(e.target.value)
                              }
                              style={{
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                flex: 1,
                              }}
                            />
                          </div>
                          {errors.minInvoiceValue && (
                            <p className="text-danger">{errors.minInvoiceValue}</p>
                          )}
                        </div>

                        {/* buttons */}
                        <div
                          style={{ display: "flex", gap: "20px", marginTop: "10px" }}
                        >
                          <button
                            onClick={() => switchTab("reward")}
                            disabled={loading}
                            className="button-hover"
                            type="button"
                            style={{
                              padding: "4px 8px",
                              background: "white",
                              border: "1.5px solid #1F7FFF",
                              borderRadius: "8px",
                              color: "#1F7FFF",
                              fontWeight: "500",
                              cursor: "pointer",
                              textDecoration: "none",
                            }}
                          >
                            Back
                          </button>

                          <button
                            type="button"
                            className="button-hover"
                            // onClick={handleSetupNext}
                            onClick={handleSetupNext}
                            disabled={loading}
                            style={{
                              padding: "4px 8px",
                              background: "#1F7FFF",
                              border: "1.5px solid #1F7FFF",
                              borderRadius: "8px",
                              color: "white",
                              fontWeight: "500",
                              cursor: "pointer",
                              textDecoration: "none",
                            }}
                          >
                            {loading ? "Creating Reward System..." : "Finish"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    right: "30px",
                    top: "450px",
                  }}
                >
                  <img src={Coins} alt="coins design" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* successfully design */}
        {currentStep === 3 && (
          <div
            className=""
            style={{
              // minHeight: "100vh",
              width: "100%",
              // background: "#F8FAFC",
              fontFamily: "Inter, system-ui, sans-serif",
              display: "flex",
              overflow: "auto",
              alignItems: "center",
              justifyContent: "center",
              height: "calc(100vh - 210px)",
            }}
          >
            <div
              style={{
                maxHeight: "calc(100vh - 200px)",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  width: "532px",
                  height: "auto",
                  boxShadow: "0px 0px 23px rgba(0,110,255,0.25)",
                  overflow: "hidden",
                  borderRadius: 16,
                  outline: "1px solid #EAEAEA",
                  background: "#fff",
                  zIndex: 2,
                  position: "relative",
                  paddingBottom: "30px",
                }}
              >
                {/* Close Button */}
                <Link
                  to="/point-rewards"
                  style={{
                    display: "flex",
                    justifyContent: "end",
                    padding: "15px",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      right: "16px",
                      top: "16px",
                      border: "2px solid #D00003",
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontWeight: "600",
                      color: "#D00003",
                      fontSize: "18px",
                    }}
                  >
                    X
                  </div>
                </Link>

                {/* Image */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={Surprisebox}
                    style={{
                      width: "450px",
                      borderRadius: "12px",
                      objectFit: "cover",
                    }}
                  />
                </div>

                {/* Gradient Circle */}
                <div
                  style={{
                    height: "auto",
                    width: "532px",
                    borderTopLeftRadius: "50%",
                    borderTopRightRadius: "50%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "30px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      borderRadius: "50%",
                      background:
                        "linear-gradient(318deg, #091A45 0%, #436AEB 100%)",
                      position: "absolute",
                      width: "1750px",
                      height: "1600px",
                      zIndex: 1,
                    }}
                  ></div>

                  <div
                    style={{
                      zIndex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "40px",
                    }}
                  >
                    {/* Heading */}
                    <div>
                      <div
                        style={{
                          width: "100%",
                          marginTop: "60px",
                          textAlign: "center",
                          fontSize: "32px",
                          fontWeight: 700,
                          color: "#fff",
                          fontFamily: "Inter",
                        }}
                      >
                        Congratulations !!!
                      </div>

                      {/* Subtext */}
                      <div
                        style={{
                          width: "100%",
                          textAlign: "center",
                          fontSize: "16px",
                          fontWeight: 400,
                          color: "#F5F5F5",
                          fontFamily: "Inter",
                        }}
                      >
                        You have successfully created your Reward System.
                      </div>
                    </div>

                    {/* Link Box + Share Button */}
                    {/* <div
                      style={{
                        width: "100%",
                        top: "515px",
                        display: "flex",
                        justifyContent: "center",
                        gap: "25px",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ display: "flex", gap: "14px" }}>
                        
                        <div
                          style={{
                            width: "320px",
                            height: "48px",
                            padding: "12px 16px",
                            background: "#fff",
                            borderRadius: "8px",
                            outline: "1.5px solid #1F7FFF",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            justifyContent: "space-between",
                            boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
                          }}
                        >
                          <div
                            style={{
                              color: "#1F7FFF",
                              fontSize: "16px",
                              fontWeight: 500,
                              fontFamily: "Inter",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            https://kasperinfotech.dummylinkforrewards
                          </div>

                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              background: "white",
                              borderRadius: "4px",
                            }}
                          >
                            <FaRegCopy style={{ color: "#1F7FFF" }} />
                          </div>
                        </div>

                        <div
                          style={{
                            height: "48px",
                            padding: "12px 16px",
                            background: "#fff",
                            borderRadius: "8px",
                            outline: "1.5px solid #1F7FFF",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            cursor: "pointer",
                            boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
                          }}
                          onClick={handleShareOptions}
                        >
                          <div
                            style={{
                              color: "#1F7FFF",
                              fontSize: "16px",
                              fontWeight: 500,
                              fontFamily: "Inter",
                            }}
                          >
                            Share
                          </div>

                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              background: "white",
                              borderRadius: "4px",
                            }}
                          >
                            <GrSend style={{ color: "#1F7FFF" }} />
                          </div>
                        </div>
                      </div>

                      {shareoptions && (
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "14px",
                          }}
                        >
                          
                          <div
                            style={{
                              padding: "12px 16px",
                              background: "#ffffff",
                              boxShadow:
                                "inset -1px -1px 4px rgba(0,0,0,0.25)",
                              borderRadius: "8px",
                              outline: "1.5px solid #1F7FFF",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              minWidth: "98px",
                            }}
                          >
                            <RiWhatsappFill
                              style={{ color: "#25D366", fontSize: "40px" }}
                            />
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#1F7FFF",
                                fontFamily: "Inter",
                              }}
                            >
                              WhatsApp
                            </div>
                          </div>

                          <div
                            style={{
                              padding: "12px 16px",
                              background: "#ffffff",
                              boxShadow:
                                "inset -1px -1px 4px rgba(0,0,0,0.25)",
                              borderRadius: "8px",
                              outline: "1.5px solid #1F7FFF",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "8px",
                              cursor: "pointer",
                              minWidth: "102px",
                            }}
                          >
                            <RiMessage2Fill
                              style={{ color: "#1F7FFF", fontSize: "40px" }}
                            />
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#1F7FFF",
                                fontFamily: "Inter",
                              }}
                            >
                              Message
                            </div>
                          </div>
                        </div>
                      )}
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateShoppingPoints;
