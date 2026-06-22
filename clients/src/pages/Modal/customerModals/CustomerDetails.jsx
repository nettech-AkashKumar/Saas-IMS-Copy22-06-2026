import React, { useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import Dollarimg from "../../../assets/images/dollar.png";
import { HiArrowsUpDown } from "react-icons/hi2";
import { Link } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import { toast } from "react-toastify"
import api from "../../../pages/config/axiosInstance"
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";


const CustomerDetails = ({ data, onClose, onEdit }) => {
  const navigate = useNavigate();

  if (!data) return null;
  // Supplier Basic Details
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data?._id) {
      fetchCustomerStatistics();
    }
  }, [data]);

  const fetchCustomerStatistics = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/customers/${data._id}/statistics`);
      const apiData = res.data;
      setCustomerData({
        customer: {
          _id: data._id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
        statistics: {
          availablePoints: apiData.statistics?.availablePoints || data.availablePoints || 0,
          totalPurchaseAmount: apiData.statistics?.totalPurchaseAmount || data.totalPurchaseAmount || 0,
          totalDueAmount: apiData.statistics?.totalDueAmount || data.totalDueAmount || 0,
          totalPurchases: apiData.statistics?.totalPurchases || data.totalPurchases || 0,
          averageOrderValue: apiData.statistics?.averageOrderValue || data.averageOrderValue || 0,
          loyaltyTier: apiData.statistics?.loyaltyTier || data.loyaltyTier || "regular",
          totalPointsEarned: apiData.statistics?.totalPointsEarned || data.totalPointsEarned || 0,
          totalPointsRedeemed: apiData.statistics?.totalPointsRedeemed || data.totalPointsRedeemed || 0,
          firstPurchaseDate: apiData.statistics?.firstPurchaseDate || data.firstPurchaseDate || null,
          lastPurchaseDate: apiData.statistics?.lastPurchaseDate || data.lastPurchaseDate || null,
          unpaidInvoices: apiData.statistics?.unpaidInvoices || 0,
          overdueInvoices: apiData.statistics?.overdueInvoices || 0,
          pointValue: apiData.statistics?.pointValue || 10,
          redeemableValue: apiData.statistics?.redeemableValue || (data.availablePoints || 0) * 10,
          tierBenefits: apiData.statistics?.tierBenefits || {
            pointsMultiplier: 1,
            discountPercentage: 0,
            freeShippingThreshold: 5000,
          }
        },
        recentPurchases: apiData.recentPurchases || [],
        summary: {
          totalInvoices: apiData.summary?.totalInvoices || 0,
          paidInvoices: apiData.summary?.paidInvoices || 0,
          partialInvoices: apiData.summary?.partialInvoices || 0,
          draftInvoices: apiData.summary?.draftInvoices || 0,
          overdueInvoices: apiData.summary?.overdueInvoices || 0,
          totalAmountOwed: apiData.summary?.totalAmountOwed || data.totalDueAmount || 0,
        }
      });

    } finally {
      setLoading(false);
    }
  }

  //  Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return '---';
    }
  };
  // Recalculate due amount
  const handleRecalculateDue = async () => {
    try {
      await api.post(`/api/customers/${data._id}/recalculate-due`);
      toast.success("Due amount recalculated successfully!");
      fetchCustomerStatistics(); // Refresh data
    } catch (error) {
      toast.error("Failed to recalculate due amount");
    }
  };


  if (!customerData) {
    return (
      <div
        style={{ padding: "20px", textAlign: "center" }}
      >
        Loading customer details...
      </div>
    )
  }

  const { customer, statistics, recentPurchases, summary } = customerData;


  // Stats (cards)
  const stats = [
    { label: "Total Spent", value: formatCurrency(statistics.totalPurchaseAmount || 0), currency: "" },
    {
      label: "Total Orders", value: statistics.totalPurchases || 0,
      currency: ""
    },
    {
      label: "First Purchase", value: statistics.firstPurchaseDate ?
        formatDate(statistics.firstPurchaseDate) : "---"

    },
    {
      label: "Due Amount", value: formatCurrency(statistics.totalDueAmount || 0), color: statistics.totalDueAmount > 0 ? "#dc2626" : "#0E101A",
      currency: ""
    },
  ];



  const cardStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    position: "relative",
    width: "100%",
    height: "86px",
    padding: "16px 24px 16px 16px",
    fontFamily: "Inter",
    boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
    border: "1px solid #E5F0FF",
    borderRadius: "8px",
  };

  const labelStyle = {
    fontSize: "14px",
    color: "#727681",
    fontWeight: 500,
    marginBottom: "8px",
    fontFamily: '"Inter", sans-serif',
    lineHeight: "120%",
  };

  const valueStyle = {
    fontSize: "22px",
    color: "#0E101A",
    fontWeight: 500,
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
  };

  // Update the row click handler
  const handleRowClick = (purchase) => {
    console.log("Row clicked:", purchase);

    if (purchase && purchase._id) {
      // Navigate to sales invoice view
      navigate(`/sales-invoice/${purchase._id}`, {
        state: {
          invoiceData: purchase,
          customerData: customerData // Pass customer data
        }
      });
    } else {
      toast.error("Unable to open invoice");
    }
  };

  return (
    <div
      className=""
      style={{
        position: "relative",
        padding: "20px",
        fontFamily: '"Inter", sans-serif',
        height: "100%", // Add this
      }}
    >
      <div style={{ position: "relative", overflow: "visible", }}>
        <div
          style={{
            padding: "20px",
            backgroundColor: "#FFFF",
            width: "700px",
            position: "relative",
            // overflow: "visible",
          }}
        >
          {/* supplier, edit */}
          <div className="d-flex justify-content-between">
            <div style={{ display: "flex", alignItems: "center" }}>
              {/* my span */}
              <h2
                style={{
                  color: "#000000",
                  fontWeight: 500,
                  fontSize: "22px",
                  lineHeight: "120%",
                  marginBottom: "20px",
                }}
              >
                Customer Details
              </h2>
            </div>
            <span
              style={{ cursor: "pointer" }}
              onClick={() => onEdit(data)}
            >
              <FaRegEdit
                style={{ color: "#6C748C", height: "24px", width: "24px" }}
              />
            </span>
          </div>
          <hr style={{ color: "#ccc" }} />

          {/* Top Section */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Profile Circle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#E5E7EB",
              }}
            >
              {customer?.name?.charAt(0) || "C"}
            </div>

            {/* Customer Info */}
            <div className="d-flex flex-column">
              <h3
                style={{
                  color: "#0E101A",
                  fontWeight: 400,
                  fontSize: "20px",
                  lineHeight: "120%",
                  fontFamily: '"Inter", sans-serif',
                  margin: 0,
                  marginTop: "20px",
                }}
              >
                {customer?.name}
              </h3>
              <span
                style={{
                  textAlign: "center",
                  fontWeight: 400,
                  fontSize: "14px",
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: "120%",
                  color: "#0E101A",
                  padding: "5px",
                  backgroundColor: "#E5F0FF",
                  borderRadius: "12px",
                  // width: "100px",
                }}
              >
                🪙{statistics.availablePoints} points
              </span>
              <span
                style={{
                  fontWeight: 400,
                  fontSize: "14px",
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: "120%",
                  color: "red",
                  padding: "5px",
                }}
              >
                {statistics.loyaltyTier}
              </span>
            </div>

            {/* Right Side Contact Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontWeight: 400,
                fontFamily: '"Inter", sans-serif',
                marginLeft: "auto",
                textAlign: "right",
                fontSize: "14px",
              }}
            >
              <span style={{ color: "black" }}>
                Phone no. -{" "}
                <span style={{ color: "#727681" }}>{customer?.phone || "---"}</span>
              </span>
              <span style={{ color: "black" }}>
                Email Id -{" "}
                <span style={{ color: "#727681" }}>{customer?.email || "---"}</span>
              </span>
              <span style={{ color: "black" }}>
                Address -{" "}
                <span style={{ color: "#727681" }}>{customer?.address || "---"}</span>
              </span>
            </div>
          </div>

          {/* Stats Section */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>Loading statistics...</div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "20px",
                  marginTop: "25px",
                }}
              >
                {stats.map((item, index) => (
                  <div key={index} style={cardStyle}>
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "4px",
                        height: "70%",
                        backgroundColor: "#1F7FFF",
                        borderRadius: "1px 10px 1px 10px",
                      }}
                    ></span>

                    {/* Left Content */}
                    <div>
                      <div style={labelStyle}>{item.label}</div>

                      <div style={{ ...valueStyle, color: item.color || "#0E101A" }}>
                        {item.value}
                        {item.currency && (
                          <span style={{ fontSize: "14px" }}>{item.currency}</span>
                        )}
                      </div>
                    </div>

                    {/* Right Icon Circle */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E5F0FF",
                        borderRadius: "50%",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={Dollarimg}
                        alt="dollar"
                        style={{
                          width: "36px",
                          height: "36px",
                          objectFit: "contain",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <h3
                style={{
                  color: "#0E101A",
                  fontSize: "16px",
                  fontWeight: 500,
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: "120%",
                  marginTop: "40px",
                }}
              >
                Recently Purchased
              </h3>
              {recentPurchases.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#727681" }}>No Purchase found</div>) : (
                <div
                  style={{
                    maxHeight: "100%", // Add this container
                    overflowY: "auto",
                  }}
                >

                  <table
                    style={{
                      width: "100%",
                      marginTop: "10px",
                      borderCollapse: "collapse",
                      background: "#fff",
                    }}
                  >
                    <thead
                      style={{
                        backgroundColor: "#E9F0F4",
                        padding: "4px 16px",
                        borderRadius: "12px 12px 0px 0px",
                      }}
                    >
                      <tr
                        style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB" }}
                      >
                        <th
                          style={{
                            color: "#727681",
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "120%",
                            fontFamily: '"Inter", sans-serif',
                            padding: "12px",
                          }}
                        >
                          Invoice No
                          <HiArrowsUpDown />
                        </th>
                        <th
                          style={{
                            color: "#727681",
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "120%",
                            fontFamily: '"Inter", sans-serif',
                            padding: "12px",
                          }}
                        >
                          Order Date
                        </th>
                        <th
                          style={{
                            color: "#727681",
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "120%",
                            fontFamily: '"Inter", sans-serif',
                            padding: "12px",
                          }}
                        >
                          Total Amount
                        </th>
                        <th
                          style={{
                            color: "#727681",
                            fontSize: "14px",
                            fontWeight: 400,
                            lineHeight: "120%",
                            fontFamily: '"Inter", sans-serif',
                            padding: "12px",
                          }}
                        >
                          Due Amount
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentPurchases?.slice(0, 5).map((row, index) => (
                        <tr key={index} onClick={() => handleRowClick(row)} style={{ cursor: "pointer", borderBottom: "1px solid #F3F4F6" }}>
                          <td
                            style={{
                              color: "#0E101A",
                              fontSize: "14px",
                              fontWeight: 400,
                              lineHeight: "120%",
                              fontFamily: '"Inter", sans-serif',
                              padding: "12px",
                            }}
                          >
                            {row.invoiceNo || '---'}
                          </td>
                          <td
                            style={{
                              color: "#0E101A",
                              fontSize: "14px",
                              fontWeight: 400,
                              lineHeight: "120%",
                              fontFamily: '"Inter", sans-serif',
                              padding: "12px",
                            }}
                          >
                            {formatDate(row.date || row.invoiceDate)}
                          </td>
                          <td
                            style={{
                              color: "#0E101A",
                              fontSize: "14px",
                              fontWeight: 400,
                              lineHeight: "120%",
                              fontFamily: '"Inter", sans-serif',
                              padding: "12px",
                            }}
                          >
                            {formatCurrency(row.totalAmount || row.grandTotal)}
                          </td>
                          <td
                            style={{
                              fontSize: "14px",
                              lineHeight: "120%",
                              fontFamily: '"Inter", sans-serif',
                              padding: "12px",
                              color: row.dueColor || "#000",
                              fontWeight: row.dueColor ? "600" : "400",
                            }}
                          >
                            {formatCurrency(row.dueAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;






