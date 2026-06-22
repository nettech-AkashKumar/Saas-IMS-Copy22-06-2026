import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";

// pages
import EmptyOcd from "../Promo/EmptyOcd";
import api from "../../../pages/config/axiosInstance";
import { hasPermission } from '../../../utils/permission/hasPermission';
import { useAuth } from "../../auth/AuthContext";
// import DateRangePicker from '../../componets/DateRangePicker';

// icons
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiUpload, FiCheck, FiChevronDown } from "react-icons/fi";
import { GrSend } from "react-icons/gr";
import { MdAddShoppingCart } from "react-icons/md";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { RiDeleteBinLine, RiArrowUpWideLine, RiArrowDownWideLine, RiArrowDropDownLine, RiArrowDropUpLine, RiListView } from "react-icons/ri";
import { FiX } from 'react-icons/fi'

function PointsRewards() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rewards, setRewards] = useState([]);
  const [cashback, setCashback] = useState([]);
  const [referral, setReferral] = useState([]);
  const [tiered, setTiered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReward, setSelectedReward] = useState(null);
  const [detailsPopup, setDetailsPopup] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all active reward systems
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/reward-systems/active-rewards");
        if (Array.isArray(res.data)) {
          const shoppingPoints = res.data.filter(item => item.rewardType === "Shopping Points");
          setRewards(shoppingPoints);
          const cashback = res.data.filter(item => item.rewardType === "Cashback");
          setCashback(cashback);
          const referral = res.data.filter(item => item.rewardType === "Referral");
          setReferral(referral);
          const tiered = res.data.filter(item => item.rewardType === "Tiered");
          setTiered(tiered);
        } else if (res.data.data) {
          setRewards(res.data.data);
        } else {
          setRewards([]);
        }
      } catch (err) {
        setError("Failed to load rewards");
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, []);

  // Handle click to open details popup
  const handleSelectReward = (reward) => {
    setSelectedReward(reward);
    setDetailsPopup(true);
  };

  // Handle click to close details popup
  const handleCloseClick = () => {
    setSelectedReward(null);
    setDetailsPopup(false);
  };

  const handleClick = () => {
    navigate("/createshoppingpoints");
  };

  const handleToggleStatus = async (e) => {
    e.stopPropagation();
    if (!selectedReward?._id || actionLoading) return;

    const previousReward = selectedReward;
    const newStatus = selectedReward.status === "active" ? "inactive" : "active";
    const updatedReward = { ...selectedReward, status: newStatus };

    setSelectedReward(updatedReward);
    setRewards((prev) => prev.map((reward) => reward._id === updatedReward._id ? updatedReward : reward));

    try {
      setActionLoading(true);
      const res = await api.put(`/api/reward-systems/${selectedReward._id}`, { status: newStatus });
      const savedReward = res.data?.data || updatedReward;
      setSelectedReward(savedReward);
      setRewards((prev) => prev.map((reward) => reward._id === savedReward._id ? savedReward : reward));
      toast.success(`Reward marked ${newStatus}`);
    } catch (err) {
      setSelectedReward(previousReward);
      setRewards((prev) => prev.map((reward) => reward._id === previousReward._id ? previousReward : reward));
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditReward = (e) => {
    e.stopPropagation();
    if (!selectedReward?._id) return;
    navigate("/createshoppingpoints", {
      state: {
        mode: "edit",
        reward: selectedReward,
        step: 2,
      },
    });
  };

  const handleDeleteReward = async (e) => {
    e.stopPropagation();
    if (!selectedReward?._id || actionLoading) return;

    const rewardToDelete = selectedReward;
    setRewards((prev) => prev.filter((reward) => reward._id !== rewardToDelete._id));
    setDetailsPopup(false);
    setSelectedReward(null);

    try {
      setActionLoading(true);
      await api.delete(`/api/reward-systems/${rewardToDelete._id}`);
      toast.success("Reward deleted successfully");
    } catch (err) {
      setRewards((prev) => [rewardToDelete, ...prev]);
      toast.error(err.response?.data?.message || "Failed to delete reward");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "No expiry";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // link copyimport { toast } from "react-toastify";
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedReward?.offerName || "");
      alert("Copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy coupon code");
    }
  };

  const handleLinkCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedReward?.shareLink || "");
      alert("Link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (rewards.length === 0) return <EmptyOcd />;

  return (
    <div className='p-4'>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h2 style={{
          margin: 0,
          color: 'black',
          fontSize: 22,
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          lineHeight: '26.4px',
        }}>
          Points & Rewards
        </h2>

        {/* </div> */}
        {hasPermission(user, "PointsRewards", "create") && (
          <button
            className='button-hover'
            onClick={handleClick}
            style={{
              padding: "6px 16px",
              background: "white",
              border: "1px solid #1F7FFF",
              color: "#1F7FFF",
              borderRadius: 8,
              textDecoration: "none",
              fontSize: "14px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              height: "33px",
            }}
          >
            <MdAddShoppingCart className="fs-5" />
            <span className="fs-6">Create Point & Reward</span>
          </button>
        )}
      </div>

      <div style={{
        overflowY: 'auto',
        height: '80vh',
      }}>
        {/* Loading / Error */}
        {loading && <p>Loading rewards...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Rewards List */}
        {!loading && !error && rewards.length === 0 && (
          <p>No reward systems created yet. Click "Add Shopping Points" to create one!</p>
        )}

        {/* shopping points */}
        <div>
          <h3 style={{
            margin: 0,
            color: 'black',
            fontSize: 20,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            lineHeight: '40px',
          }}>
            💠 Shopping Points
          </h3>

          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            // height: '80vh',
            overflowY: 'auto'
          }}>
            {rewards.length === 0 ? <p style={{ marginLeft: 16 }}>No shopping points rewards available.</p> : rewards.map((reward) => (
              <div
                key={reward._id}
                style={{
                  position: 'relative',
                  width: "394px",
                  height: "170px",
                  background: reward.status === "active" ? "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(178,255,0,0.12) 100%), #fff" : "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(255, 0, 0, 0.12) 100%), #fff",
                  overflow: "hidden",
                  borderRadius: 16,
                  outline: "1px solid #EAEAEA",
                  padding: "16px",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
                onClick={() => {
                  handleSelectReward(reward);
                }}
              >
                {/* Header Section */}
                <div style={{ display: "flex", flexDirection: "column", }}>
                  {/* name + status */}
                  <div
                    style={{
                      // width: 250,
                      left: 16,
                      height: 35,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}>
                    <div
                      style={{
                        fontSize: 24,
                        color: "#0E101A",
                        fontFamily: "Inter",
                        fontWeight: 400,
                      }}
                    >
                      {/* {reward.rewardType} */}
                      {reward.offerName.toUpperCase()}
                    </div>

                    {/* Status Badge */}
                    <div
                      style={{
                        height: 25,
                        padding: "4px 8px",
                        background: reward.status === "active" ? "#D4F7C7" : "#f6bebeff",
                        borderRadius: 50,
                        color: reward.status === "active" ? "#01774B" : "#D00003",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: reward.status === "active" ? "#01774B" : "#D00003",
                          fontSize: 14,
                          fontFamily: "Inter",
                        }}
                      >
                        {reward.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* box details */}
                  <div
                    style={{
                      width: 292,
                      fontSize: 16,
                      color: "#727681",
                      fontFamily: "Inter",
                      fontWeight: 400,
                      lineHeight: "18px",
                    }}
                  >
                    {reward.rewardType === "Shopping Points" && (
                      <>
                        <span>Get points for every ₹{reward.minInvoiceValue}+ purchase. Redeem Next Time.
                          {/* on purchase above ₹{reward.maxEligibleAmount}. Eligible after ₹{reward.minPurchase}. */}
                        </span>
                      </>
                    )}

                    {reward.rewardType === "Cashback" && (
                      <>
                        <span>Get cashback {reward.maxEligibleAmount} on purchases above ₹{reward.minInvoiceValue}.</span>
                      </>
                    )}

                    {reward.rewardType === "Referral" && (
                      <>
                        <span>Referral Rewards {reward.amountForPoint} Active ₹{reward.minPurchase}</span>
                      </>
                    )}

                    {reward.rewardType === "Tiered" && (<>
                      <span>Tiered Loyalty {reward.amountForPoint} Program ₹{reward.minPurchase}</span>
                    </>)}
                  </div>
                </div>

                {/* Footer Section */}
                <div
                  style={{
                    position: 'absolute',
                    width: 360,
                    left: 16,
                    top: 130,
                    padding: "8px 0",
                    borderTop: "1px solid #EAEAEA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Left section */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#1F7FFF",
                        fontFamily: "Inter",
                      }}
                    >
                      Show Details
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        color: "#727681",
                        fontFamily: "Inter",
                      }}
                    >
                      {reward.deadline && (
                        <>
                          • Valid till {(formatDate(reward.deadline))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right icon */}
                  <div
                    style={{
                    }}
                  >
                    <GrSend style={{ color: "#1F7FFF" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* cashback */}
        <div>
          <h3 style={{
            marginTop: 20,
            color: 'black',
            fontSize: 20,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            lineHeight: '40px',
          }}>
            💠 Cashback
          </h3>

          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            // height: '80vh',
            overflowY: 'auto'
          }}>
            {cashback.length === 0 ? <p style={{ marginLeft: 16 }}>No cashback rewards available.</p> : cashback.map((reward) => (
              <div
                key={reward._id}
                style={{
                  position: 'relative',
                  width: "394px",
                  height: "170px",
                  background: reward.status === "active" ? "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(178,255,0,0.12) 100%), #fff" : "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(255, 0, 0, 0.12) 100%), #fff",
                  overflow: "hidden",
                  borderRadius: 16,
                  outline: "1px solid #EAEAEA",
                  padding: "16px",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
                onClick={() => {
                  handleSelectReward(reward);
                }}
              >
                {/* Header Section */}
                <div style={{ display: "flex", flexDirection: "column", }}>
                  {/* name + status */}
                  <div
                    style={{
                      // width: 250,
                      left: 16,
                      height: 35,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}>
                    <div
                      style={{
                        fontSize: 24,
                        color: "#0E101A",
                        fontFamily: "Inter",
                        fontWeight: 400,
                      }}
                    >
                      {/* {reward.rewardType} */}
                      {reward.offerName.toUpperCase()}
                    </div>

                    {/* Status Badge */}
                    <div
                      style={{
                        height: 25,
                        padding: "4px 8px",
                        background: reward.status === "active" ? "#D4F7C7" : "#f6bebeff",
                        borderRadius: 50,
                        color: reward.status === "active" ? "#01774B" : "#D00003",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: reward.status === "active" ? "#01774B" : "#D00003",
                          fontSize: 14,
                          fontFamily: "Inter",
                        }}
                      >
                        {reward.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* box details */}
                  <div
                    style={{
                      width: 292,
                      fontSize: 16,
                      color: "#727681",
                      fontFamily: "Inter",
                      fontWeight: 400,
                      lineHeight: "18px",
                    }}
                  >
                    {reward.rewardType === "Shopping Points" && (
                      <>
                        <span>Get points for every ₹{reward.minInvoiceValue}+ purchase. Redeem Next Time.
                          {/* on purchase above ₹{reward.maxEligibleAmount}. Eligible after ₹{reward.minPurchase}. */}
                        </span>
                      </>
                    )}

                    {reward.rewardType === "Cashback" && (
                      <>
                        <span>Get cashback {reward.maxEligibleAmount} on purchases above ₹{reward.minInvoiceValue}.</span>
                      </>
                    )}

                    {reward.rewardType === "Referral" && (
                      <>
                        <span>Referral Rewards {reward.amountForPoint} Active ₹{reward.minPurchase}</span>
                      </>
                    )}

                    {reward.rewardType === "Tiered" && (<>
                      <span>Tiered Loyalty {reward.amountForPoint} Program ₹{reward.minPurchase}</span>
                    </>)}
                  </div>
                </div>

                {/* Footer Section */}
                <div
                  style={{
                    position: 'absolute',
                    width: 360,
                    left: 16,
                    top: 130,
                    padding: "8px 0",
                    borderTop: "1px solid #EAEAEA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Left section */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#1F7FFF",
                        fontFamily: "Inter",
                      }}
                    >
                      Show Details
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        color: "#727681",
                        fontFamily: "Inter",
                      }}
                    >
                      {reward.deadline && (
                        <>
                          • Valid till {(formatDate(reward.deadline))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right icon */}
                  <div
                    style={{
                    }}
                  >
                    <GrSend style={{ color: "#1F7FFF" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* referral */}
        <div>
          <h3 style={{
            marginTop: 20,
            color: 'black',
            fontSize: 20,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            lineHeight: '40px',
          }}>
            💠 Referral
          </h3>

          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            // height: '80vh',
            overflowY: 'auto'
          }}>
            {referral.length === 0 ? <p style={{ marginLeft: 16 }}>No referral rewards available.</p> : referral.map((reward) => (
              <div
                key={reward._id}
                style={{
                  position: 'relative',
                  width: "394px",
                  height: "170px",
                  background: reward.status === "active" ? "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(178,255,0,0.12) 100%), #fff" : "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(255, 0, 0, 0.12) 100%), #fff",
                  overflow: "hidden",
                  borderRadius: 16,
                  outline: "1px solid #EAEAEA",
                  padding: "16px",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
                onClick={() => {
                  handleSelectReward(reward);
                }}
              >
                {/* Header Section */}
                <div style={{ display: "flex", flexDirection: "column", }}>
                  {/* name + status */}
                  <div
                    style={{
                      // width: 250,
                      left: 16,
                      height: 35,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}>
                    <div
                      style={{
                        fontSize: 24,
                        color: "#0E101A",
                        fontFamily: "Inter",
                        fontWeight: 400,
                      }}
                    >
                      {/* {reward.rewardType} */}
                      {reward.offerName.toUpperCase()}
                    </div>

                    {/* Status Badge */}
                    <div
                      style={{
                        height: 25,
                        padding: "4px 8px",
                        background: reward.status === "active" ? "#D4F7C7" : "#f6bebeff",
                        borderRadius: 50,
                        color: reward.status === "active" ? "#01774B" : "#D00003",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: reward.status === "active" ? "#01774B" : "#D00003",
                          fontSize: 14,
                          fontFamily: "Inter",
                        }}
                      >
                        {reward.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* box details */}
                  <div
                    style={{
                      width: 292,
                      fontSize: 16,
                      color: "#727681",
                      fontFamily: "Inter",
                      fontWeight: 400,
                      lineHeight: "18px",
                    }}
                  >
                    {reward.rewardType === "Shopping Points" && (
                      <>
                        <span>Get points for every ₹{reward.minInvoiceValue}+ purchase. Redeem Next Time.
                          {/* on purchase above ₹{reward.maxEligibleAmount}. Eligible after ₹{reward.minPurchase}. */}
                        </span>
                      </>
                    )}

                    {reward.rewardType === "Cashback" && (
                      <>
                        <span>Get cashback {reward.maxEligibleAmount} on purchases above ₹{reward.minInvoiceValue}.</span>
                      </>
                    )}

                    {reward.rewardType === "Referral" && (
                      <>
                        <span>Referral Rewards {reward.amountForPoint} Active ₹{reward.minPurchase}</span>
                      </>
                    )}

                    {reward.rewardType === "Tiered" && (<>
                      <span>Tiered Loyalty {reward.amountForPoint} Program ₹{reward.minPurchase}</span>
                    </>)}
                  </div>
                </div>

                {/* Footer Section */}
                <div
                  style={{
                    position: 'absolute',
                    width: 360,
                    left: 16,
                    top: 130,
                    padding: "8px 0",
                    borderTop: "1px solid #EAEAEA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Left section */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#1F7FFF",
                        fontFamily: "Inter",
                      }}
                    >
                      Show Details
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        color: "#727681",
                        fontFamily: "Inter",
                      }}
                    >
                      {reward.deadline && (
                        <>
                          • Valid till {(formatDate(reward.deadline))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right icon */}
                  <div
                    style={{
                    }}
                  >
                    <GrSend style={{ color: "#1F7FFF" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* tiered */}
        <div>
          <h3 style={{
            marginTop: 20,
            color: 'black',
            fontSize: 20,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            lineHeight: '40px',
          }}>
            💠 Tiered Loyalty
          </h3>

          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            // height: '80vh',
            overflowY: 'auto'
          }}>
            {tiered.length === 0 ? <p style={{ marginLeft: 16 }}>No tiered loyalty rewards available.</p> : tiered.map((reward) => (
              <div
                key={reward._id}
                style={{
                  position: 'relative',
                  width: "394px",
                  height: "170px",
                  background: reward.status === "active" ? "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(178,255,0,0.12) 100%), #fff" : "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(255, 0, 0, 0.12) 100%), #fff",
                  overflow: "hidden",
                  borderRadius: 16,
                  outline: "1px solid #EAEAEA",
                  padding: "16px",
                  boxSizing: "border-box",
                  cursor: "pointer",
                }}
                onClick={() => {
                  handleSelectReward(reward);
                }}
              >
                {/* Header Section */}
                <div style={{ display: "flex", flexDirection: "column", }}>
                  {/* name + status */}
                  <div
                    style={{
                      // width: 250,
                      left: 16,
                      height: 35,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}>
                    <div
                      style={{
                        fontSize: 24,
                        color: "#0E101A",
                        fontFamily: "Inter",
                        fontWeight: 400,
                      }}
                    >
                      {/* {reward.rewardType} */}
                      {reward.offerName.toUpperCase()}
                    </div>

                    {/* Status Badge */}
                    <div
                      style={{
                        height: 25,
                        padding: "4px 8px",
                        background: reward.status === "active" ? "#D4F7C7" : "#f6bebeff",
                        borderRadius: 50,
                        color: reward.status === "active" ? "#01774B" : "#D00003",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: reward.status === "active" ? "#01774B" : "#D00003",
                          fontSize: 14,
                          fontFamily: "Inter",
                        }}
                      >
                        {reward.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* box details */}
                  <div
                    style={{
                      width: 292,
                      fontSize: 16,
                      color: "#727681",
                      fontFamily: "Inter",
                      fontWeight: 400,
                      lineHeight: "18px",
                    }}
                  >
                    {reward.rewardType === "Shopping Points" && (
                      <>
                        <span>Get points for every ₹{reward.minInvoiceValue}+ purchase. Redeem Next Time.
                          {/* on purchase above ₹{reward.maxEligibleAmount}. Eligible after ₹{reward.minPurchase}. */}
                        </span>
                      </>
                    )}

                    {reward.rewardType === "Cashback" && (
                      <>
                        <span>Get cashback {reward.maxEligibleAmount} on purchases above ₹{reward.minInvoiceValue}.</span>
                      </>
                    )}

                    {reward.rewardType === "Referral" && (
                      <>
                        <span>Referral Rewards {reward.amountForPoint} Active ₹{reward.minPurchase}</span>
                      </>
                    )}

                    {reward.rewardType === "Tiered" && (<>
                      <span>Tiered Loyalty {reward.amountForPoint} Program ₹{reward.minPurchase}</span>
                    </>)}
                  </div>
                </div>

                {/* Footer Section */}
                <div
                  style={{
                    position: 'absolute',
                    width: 360,
                    left: 16,
                    top: 130,
                    padding: "8px 0",
                    borderTop: "1px solid #EAEAEA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {/* Left section */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#1F7FFF",
                        fontFamily: "Inter",
                      }}
                    >
                      Show Details
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        color: "#727681",
                        fontFamily: "Inter",
                      }}
                    >
                      {reward.deadline && (
                        <>
                          • Valid till {(formatDate(reward.deadline))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right icon */}
                  <div
                    style={{
                    }}
                  >
                    <GrSend style={{ color: "#1F7FFF" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* details popup */}
      {detailsPopup && (
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
          onClick={() => handleCloseClick()}
        >
          <div
            style={{
              backgroundColor: "white",
              width: "512px",
              // height: "440px",
              padding: "20px",
              borderRadius: "16px",
              display: "flex",
              flexDirection: "column",
              gap: '24px',
              background: selectedReward?.status === "active" ? "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(178,255,0,0.12) 100%), #fff" : "linear-gradient(137deg, rgba(255,255,255,0) 0%, rgba(255, 0, 0, 0.12) 100%), #fff",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* name + status + details */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div
                style={{
                  width: '100%',
                  height: 40,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                <div
                  style={{
                    left: 16,
                    height: 35,
                    fontSize: '20px',
                    color: "#0E101A",
                    fontFamily: "Inter",
                    fontWeight: 400,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={actionLoading}
                    style={{
                      height: 25,
                      padding: "4px 8px",
                      background: selectedReward?.status === "active" ? "#D4F7C7" : "#f9cdcdff",
                      borderRadius: 50,
                      color: selectedReward?.status === "active" ? "#01774B" : "#D00003",
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      cursor: actionLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    <span
                      style={{
                        color: selectedReward?.status === "active" ? "#01774B" : "#D00003",
                        fontSize: 14,
                        fontFamily: "Inter",
                      }}
                    >
                      {selectedReward?.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div
                    onClick={handleEditReward}
                    style={{
                      cursor: 'pointer',
                    }}>
                    <MdOutlineModeEditOutline style={{ color: "#727681" }} className='fs-5' />
                  </div>
                  <div
                    onClick={handleDeleteReward}
                    style={{
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                    }}>
                    <RiDeleteBinLine style={{ color: "#727681" }} className='fs-5' />
                  </div>
                  <div style={{
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
                  }}>
                    <FiX style={{ cursor: "pointer" }} onClick={handleCloseClick} />
                  </div>
                </div>
              </div>

              <div
                style={{
                  width: '100%',
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  opacity: 1,
                  borderRadius: 8,
                  padding: '8px 16px',
                  backgroundColor: "#FFFFFF",
                  boxShadow: "1px 1px 4px 0px #0000003B",
                }}>
                {/* name */}
                <div
                  style={{
                    padding: '3px 0',
                    fontSize: '20px',
                    color: "#0E101A",
                    fontFamily: "Inter",
                    fontWeight: 400,
                  }}
                >
                  {selectedReward?.offerName.toUpperCase()}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {/* copy button */}
                  <button
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 400,
                      fontStyle: "Regular",
                      fontSize: "14px",
                      leadingTrim: "NONE",
                      letterSpacing: "0%",
                      color: "#FFFFFF",
                      border: "1px solid #1F7FFF",
                      backgroundColor: "#1F7FFF",
                      height: '30px',
                      borderRadius: '4px',
                      padding: '0 12px',
                    }}
                    onClick={handleCopy}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div
                style={{
                  width: '100%',
                  fontSize: '16px',
                  color: "#727681",
                  fontFamily: "Inter",
                  fontWeight: 400,
                }}
              >
                {selectedReward?.rewardType === "Shopping Points" && (
                  <>
                    <span>Get points for every ₹{selectedReward?.minInvoiceValue}+ purchase. Redeem Next Time.
                      {/* on purchase above ₹{selectedReward?.maxEligibleAmount}. Eligible after ₹{selectedReward?.minPurchase}. */}
                    </span>
                  </>
                )}

                {selectedReward?.rewardType === "Cashback" && (
                  <>
                    <span>Get cashback {selectedReward?.maxEligibleAmount} on purchases above ₹{selectedReward?.minInvoiceValue}.</span>
                  </>
                )}

                {selectedReward?.rewardType === "Referral" && (
                  <>
                    <span>Referral Rewards {selectedReward?.amountForPoint} Active ₹{selectedReward?.minPurchase}</span>
                  </>
                )}

                {selectedReward?.rewardType === "Tiered" && (<>
                  <span>Tiered Loyalty {selectedReward?.amountForPoint} Program ₹{selectedReward?.minPurchase}</span>
                </>)}
              </div>
            </div>

            {/* how it works section */}
            <div style={{
              width: '100%',
              display: "flex",
              flexDirection: "column",
              gap: '16px',
            }}>
              {/* title: how it works */}
              <div style={{
                fontFamily: "Inter",
                fontWeight: 500,
                fontStyle: "Medium",
                fontSize: "14px",
                leadingTrim: "NONE",
                lineHeight: "120%",
                letterSpacing: "0%",
                color: "#0E101A",
              }}>
                <span>How it works:</span>
              </div>

              {/* earning rules */}
              <div style={{
                width: '100%',
                display: "flex",
                flexDirection: "column",
                gap: '8px',
              }}>
                <span style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  color: "#727681",
                }}>
                  Earning Rules
                </span>

                <span style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  color: "#0E101A",
                }}>
                  ⚡️ Customers earn 1 point for every ₹{selectedReward?.amountForPoint} spent
                </span>

                <span style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  color: "#0E101A",
                }}>
                  💰 Points are applicable only on purchases above ₹{selectedReward?.minInvoiceValue} minimum value
                </span>

                <span style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  color: "#0E101A",
                }}>
                  ⏳ Reward offer is valid till {(formatDate(selectedReward?.deadline))}
                </span>

              </div>

              {/* Redemption Rules */}
              <div style={{
                width: '100%',
                display: "flex",
                flexDirection: "column",
                gap: '8px',
              }}>
                <span style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  color: "#727681",
                }}>
                  Redemption Rules
                </span>

                <span style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  color: "#0E101A",
                }}>
                  🎁 1 point = ₹{selectedReward?.pointValue} value during redemption
                </span>

                <span style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  color: "#0E101A",
                }}>
                  💰 Customers can redeem up to {selectedReward?.maxEligibleAmount}% of the total invoice value
                </span>

                <span style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  lineHeight: "120%",
                  letterSpacing: "0%",
                  color: "#0E101A",
                }}>
                  🧾 Minimum invoice value required for redemption: ₹{selectedReward?.minInvoiceValue}
                </span>

              </div>

            </div>

            {/* link + copy button */}
            {/* <div style={{
              width: '100%',
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: 48,
              angle: 0,
              opacity: 1,
              borderRadius: 8,
              paddingTop: 12,
              paddingRight: 16,
              paddingBottom: 12,
              paddingLeft: 16,
              backgroundColor: "#FFFFFF",
              boxShadow: "1px 1px 4px 0px #0000003B",
            }}>
              <span style={{
                fontFamily: "Inter",
                fontWeight: 400,
                fontStyle: "Regular",
                fontSize: "14px",
                leadingTrim: "NONE",
                lineHeight: "120%",
                letterSpacing: "0%",
                color: "#727681",
              }}>
                🔗 <a href={selectedReward?.shareLink} target="_blank" rel="noopener noreferrer" style={{ color: '#727681' }}>
                  {selectedReward?.shareLink.length > 40 ? selectedReward?.shareLink.substring(0, 40) + '...' : selectedReward?.shareLink}
                </a>
              </span>

              <button
                style={{
                  fontFamily: "Inter",
                  fontWeight: 400,
                  fontStyle: "Regular",
                  fontSize: "14px",
                  leadingTrim: "NONE",
                  letterSpacing: "0%",
                  color: "#FFFFFF",
                  border: "1px solid #1F7FFF",
                  backgroundColor: "#1F7FFF",
                  height: '30px',
                  borderRadius: '4px',
                  padding: '0 12px',
                }}
                onClick={handleCopy}
              >
                Copy Link
              </button>
            </div> */}
          </div>
        </div>)}

    </div>
  )
}

export default PointsRewards
