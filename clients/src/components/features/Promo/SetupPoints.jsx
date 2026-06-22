import React, { useState } from 'react'
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiUpload, FiCheck, FiChevronDown } from "react-icons/fi";
import { Link } from 'react-router-dom';

import Box from '../../assets/images/Box.png';
import Coins from '../../assets/images/Coins.png';
import DateRangePicker from '../../componets/DateRangePicker';

function SetupPoints() {
    const [activeTab, setActiveTab] = useState("reward");

    // Reward form state
    const [offerName, setOfferName] = useState("10% Shopping Points");
    const [amountForPoint, setAmountForPoint] = useState('');
    const [minPurchase, setMinPurchase] = useState('');
    const [deadline, setDeadline] = useState("2025-12-31");

    // Redeem form state
    const [pointValue, setPointValue] = useState('');
    const [maxEligibleAmount, setMaxEligibleAmount] = useState('');
    const [minInvoiceValue, setMinInvoiceValue] = useState('');

    const switchTab = (tab) => setActiveTab(tab);

    const handleRewardSubmit = (e) => {
        e.preventDefault();
        // Replace with your API call
        console.log("Reward setup saved:", { offerName, amountForPoint, minPurchase, deadline });
        alert("Reward setup saved (console)");
    };

    const handleRedeemSubmit = (e) => {
        e.preventDefault();
        // Replace with your API call
        console.log("Redeem setup saved:", { pointValue, maxEligibleAmount, minInvoiceValue });
        alert("Redeem setup saved (console)");
    };

    return (
       <div className="page-wrapper">
        <div className="content">
              <div
            className='px-4 py-2'
            style={{
                minHeight: '100vh',
                width: '100%',
                background: '#F8FAFC',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex',
                overflow: 'auto',
                flexDirection: 'column',
                marginBottom: '40px',
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                }}>
                    <Link to="/m/createshoppingpoints" style={{
                        width: 32,
                        height: 32,
                        background: 'white',
                        borderRadius: 53,
                        border: '1.07px solid #EAEAEA',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <FaArrowLeft style={{ color: '#A2A8B8' }} />
                    </Link>

                    <h2 style={{
                        margin: 0,
                        color: 'black',
                        fontSize: 22,
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 500,
                        lineHeight: '26.4px',
                    }}>
                        Points and Rewards
                    </h2>
                </div>

                {/* Date Range Picker (Decorative) */}
                <div style={{ display: 'flex', height: '40px', border: '1px solid #EAEAEA', borderRadius: '8px', }}>

                </div>
            </div>

            {/* Content Area */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', height: '100vh', overflow: 'auto' }}>
                <div style={{ width: "900px", padding: "0px" }}>
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
                            boxSizing: "border-box"
                        }}
                    >
                        {/* Tabs */}
                        <div style={{ border: "1px solid #EAEAEA", padding: '12px', borderRadius: '12px', display: "flex", justifyContent: "center" }}>
                            <div style={{ display: "flex", gap: "16px", width: "100%" }}>
                                <button
                                    onClick={() => switchTab("reward")}
                                    style={{
                                        padding: "12px 20px",
                                        border: "none",
                                        backgroundColor: activeTab === "reward" ? "#E5F0FF" : "transparent",
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
                                        backgroundColor: activeTab === "redeem" ? "#E5F0FF" : "transparent",
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
                                boxSizing: "border-box"
                            }}
                        >
                            {/* Left: Form */}
                            <div style={{ flex: 1, maxWidth: "60%" }}>
                                {/* Reward Tab */}
                                {activeTab === "reward" && (
                                    <form onSubmit={handleRewardSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#0E101A", display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <img src={Box} alt="box logo" /> Set Up Your Reward System
                                        </h2>

                                        {/* Offer Name */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "14px", color: "#0E101A" }}>Offer Name</label>
                                            <input
                                                value={offerName}
                                                onChange={(e) => setOfferName(e.target.value)}
                                                placeholder="Enter offer title"
                                                style={{
                                                    padding: "10px 12px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #A2A8B8",
                                                    fontSize: "14px"
                                                }}
                                            />
                                            <span style={{ fontSize: "12px", color: "#727681" }}>
                                                Please provide a title for your offer setup
                                            </span>
                                        </div>

                                        {/* Amount for 1 Point */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "14px", color: "#0E101A" }}>Set Amount for 1 Reward Point</label>

                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                {/* Left Box */}
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #A2A8B8",
                                                        padding: "8px 12px"
                                                    }}
                                                >
                                                    <span style={{ fontSize: "14px" }}>₹</span>
                                                    <input
                                                        type="number"
                                                        value={amountForPoint}
                                                        min={0}
                                                        onChange={(e) => setAmountForPoint(Number(e.target.value))}
                                                        style={{
                                                            border: "none",
                                                            outline: "none",
                                                            fontSize: "14px",
                                                            flex: 1
                                                        }}
                                                    />
                                                </div>

                                                <span style={{ fontSize: "18px", fontWeight: "500", color: "#727681" }}>=</span>

                                                {/* Right Box */}
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #EAEAEA",
                                                        padding: "8px 12px"
                                                    }}
                                                >
                                                    <span style={{ fontSize: "14px", color: "#727681" }}>1 Point</span>
                                                </div>
                                            </div>

                                            <span style={{ fontSize: "12px", color: "#727681" }}>
                                                How much do they need to spend to earn 1 point?
                                            </span>
                                        </div>

                                        {/* Minimum Purchase */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "14px", color: "#0E101A" }}>
                                                Minimum purchase amount to earn points
                                            </label>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #A2A8B8",
                                                    padding: "8px 12px"
                                                }}
                                            >
                                                <span style={{ fontSize: "14px" }}>₹</span>
                                                <input
                                                    type="number"
                                                    value={minPurchase}
                                                    min={0}
                                                    onChange={(e) => setMinPurchase(Number(e.target.value))}
                                                    style={{
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: "14px",
                                                        flex: 1
                                                    }}
                                                />
                                            </div>

                                            <span style={{ fontSize: "12px", color: "#727681" }}>
                                                How much do they need to spend to be eligible?
                                            </span>
                                        </div>

                                        {/* Deadline */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "14px", color: "#0E101A" }}>Set Deadline</label>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between"
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

                                            <span style={{ fontSize: "12px", color: "#727681" }}>
                                                Set the expiry date for this offer.
                                            </span>
                                        </div>
                                    </form>
                                )}

                                {/* Redeem Tab */}
                                {activeTab === "redeem" && (
                                    <form
                                        onSubmit={handleRedeemSubmit}
                                        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
                                    >
                                        <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#0E101A", display: 'flex', alignItems: 'center', gap: '12px', }}>
                                            <img src={Box} alt="box logo" /> Set Up Your Redeem System
                                        </h2>

                                        {/* 1 Point = ₹ X */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "14px", color: "#0E101A" }}>
                                                Set value of 1 point in Rupees for redemption
                                            </label>

                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div
                                                    style={{
                                                        flex: 1,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #EAEAEA",
                                                        padding: "8px 12px",
                                                        background: "#ffffff"
                                                    }}
                                                >
                                                    <span style={{ fontSize: "14px", color: "#727681" }}>1 Point</span>
                                                </div>

                                                <span style={{ fontSize: "18px", fontWeight: "500", color: "#727681" }}>=</span>

                                                <div
                                                    style={{
                                                        width: "45%",
                                                        minWidth: "130px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #A2A8B8",
                                                        padding: "8px 12px"
                                                    }}
                                                >
                                                    <span style={{ fontSize: "14px" }}>₹</span>
                                                    <input
                                                        type="number"
                                                        placeholder='00'
                                                        value={pointValue}
                                                        min={0}
                                                        onChange={(e) => setPointValue(Number(e.target.value))}
                                                        style={{
                                                            border: "none",
                                                            outline: "none",
                                                            fontSize: "14px",
                                                            width: "100%"
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <span style={{ fontSize: "12px", color: "#727681" }}>
                                                Enter conversion for redemption
                                            </span>
                                        </div>

                                        {/* Max eligible amount (%) */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "14px", color: "#0E101A" }}>
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
                                                    minWidth: "160px"
                                                }}
                                            >
                                                <span style={{ fontSize: "14px" }}>₹</span>
                                                <input
                                                    type="number"
                                                    placeholder='00'
                                                    value={maxEligibleAmount}
                                                    min={0}
                                                    max={100}
                                                    onChange={(e) => setMaxEligibleAmount(Number(e.target.value))}
                                                    style={{
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: "14px",
                                                        flex: 1
                                                    }}
                                                />

                                            </div>
                                        </div>

                                        {/* Minimum invoice value */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            <label style={{ fontSize: "14px", color: "#0E101A" }}>
                                                Set minimum invoice value for redemption eligibility
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
                                                    minWidth: "160px"
                                                }}
                                            >
                                                <span style={{ fontSize: "14px" }}>₹</span>
                                                <input
                                                    type="number"
                                                    placeholder='00'
                                                    value={minInvoiceValue}
                                                    min={0}
                                                    onChange={(e) => setMinInvoiceValue(Number(e.target.value))}
                                                    style={{
                                                        border: "none",
                                                        outline: "none",
                                                        fontSize: "14px",
                                                        flex: 1
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </form>
                                )}

                            </div>

                        </div>
                        {/* Buttons */}
                        <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
                            <Link
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
                                    textDecoration: "none"
                                }}
                            >
                                Back
                            </Link>

                            <Link
                                to="/m/skeleton?redirect=/m/ocdcomplete"
                                type="submit"
                                style={{
                                    padding: "4px 8px",
                                    background: "#1F7FFF",
                                    border: "1.5px solid #1F7FFF",
                                    borderRadius: "8px",
                                    color: "white",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    textDecoration: "none"
                                }}
                            >
                                Next
                            </Link>
                        </div>

                        <div style={{
                            position: 'absolute',
                            right: '30px',
                            top: '450px'
                        }}>
                            <img src={Coins} alt="coins design" />
                        </div>

                    </div>
                </div>
            </div>

        </div>
        </div>
       </div>
    )
}

export default SetupPoints