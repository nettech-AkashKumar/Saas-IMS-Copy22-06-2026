import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';

// pages
import api from '../../pages/config/axiosInstance';
import { useAuth } from '../../components/auth/AuthContext';

// icons
import { FiX } from 'react-icons/fi'

const PosCouponModel = ({ onClose }) => {

  const { user } = useAuth();
  const navigate = useNavigate();

  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReward, setSelectedReward] = useState(null);
  const [detailsPopup, setDetailsPopup] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);

  // Fetch all active reward systems
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/reward-systems");

        if (Array.isArray(res.data)) {
          const activeRewards = res.data.filter(item => item.status === "active" && item.rewardType === "Shopping Points");
          setRewards(activeRewards);
        } else if (res.data.data) {
          const activeRewards = res.data.data.filter(item => item.status === "active" && item.rewardType === "Shopping Points");
          setRewards(activeRewards);
        } else {
          // const activeRewards = [];
          // setRewards(activeRewards);
        }

      } catch (err) {
        setError("Failed to load rewards");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.30)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "451px",
          background: "white",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxSizing: "border-box",
          borderRadius: "8px",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            backgroundColor: "#F6F9FA",
            padding: "12px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            borderBottom: "1px solid #EAEAEA",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
          }}
        >
          <label htmlFor="" style={{ color: "#0E101A" }}>Available Coupons</label>
          <FiX onClick={onClose} style={{ cursor: "pointer" }} />
        </div>
        <div style={{ padding: "12px", display: "flex", flexDirection: 'column', gap: "15px" }}>

          {/* customer details */}
          <label htmlFor="" style={{ color: "#0E101A", fontSize: "14px" }}>Vouchers for customer: Alok (98765 43542)</label>

          <div style={{
            width: "100%",
            maxHeight: "340px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            overflowY: "auto",
          }}>
            {loading ?
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div> :
              rewards.length === 0 ? (
                <div className='text-center p-4'>
                  No Coupon Available For You
                </div>
              ) : (
                rewards.map((reward) => (
                  <div key={reward._id}>
                    <div
                      onMouseEnter={() => setHoverIndex(reward._id)}
                      onMouseLeave={() => setHoverIndex(null)}
                      style={{
                        border: "1px solid #EAEAEA",
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        backgroundColor: hoverIndex === reward._id ? "#007bff11" : "#FFFFFF",
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        cursor: "pointer"
                      }}>
                      <span style={{
                        backgroundColor:
                          reward.maxEligibleAmount <= 10 ? "#FF4D4F" :
                            reward.maxEligibleAmount <= 20 ? "#c86700ff" :
                              reward.maxEligibleAmount <= 30 ? "#d2cc0cff" :
                                reward.maxEligibleAmount <= 40 ? "#00C80D" :
                                  reward.maxEligibleAmount <= 50 ? "#00c8c8ff" :
                                    reward.maxEligibleAmount <= 60 ? "#0050c8ff" :
                                      reward.maxEligibleAmount <= 70 ? "#6e00c8ff" :
                                        reward.maxEligibleAmount <= 80 ? "#aa00c8ff" :
                                          reward.maxEligibleAmount <= 90 ? "#c80057ff" :
                                            reward.maxEligibleAmount <= 99 ? "#ff4d4dff" :
                                              "black",
                        borderRadius: "50%",
                        height: "44px",
                        width: "44px",
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: "center",
                        fontSize: "16px",
                        color: "white",
                        textAlign: 'center'
                      }}>
                        {reward.maxEligibleAmount}%
                      </span>
                      <span style={{
                        display: "flex",
                        flexDirection: "column"
                      }}>
                        <label style={{
                          color: "#0E101A",
                          fontSize: "14px",
                          fontWeight: "500"
                        }}>
                          {reward.offerName.toUpperCase()}
                        </label>
                        <label style={{
                          color: "#727681",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}>
                          {reward.maxEligibleAmount}% off on minimum purchase of ₹{reward.minInvoiceValue} or above.
                        </label>
                      </span>
                    </div>

                    {/* <div style={{ border: "1px solid #EAEAEA", width: "100%", padding: "10px", borderRadius: "8px", backgroundColor: "#eaeaea2a", display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ backgroundColor: "#eaeaeaa3", borderRadius: "50%", height: "44px", width: "44px", display: 'flex', justifyContent: 'center', alignItems: "center", fontSize: "16px", color: "white", textAlign: 'center' }}>
                    20%
                  </span>
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="" style={{ color: "#eaeaea", fontSize: "14px", fontWeight: "500" }}>NEW50</label>
                    <label htmlFor="" style={{ color: "#eaeaeac3", fontSize: "12px", fontWeight: "500" }}>50%off on Minimum Purchase of 999</label>
                  </span>
                </div> */}

                  </div>
                )))}
          </div>

          <div style={{ border: "1px dashed #A2A8B8", height: "1px", width: "100%" }}></div>
          <button onClick={onClose} style={{ border: "1px solid #A2A8B8", backgroundColor: "#FFFFFF", padding: "10px", width: "100%", borderRadius: "8px", color: "#727681" }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default PosCouponModel