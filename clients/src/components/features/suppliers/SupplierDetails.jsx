import React, { useState, useEffect } from "react";
import { FaRegEdit } from "react-icons/fa";
import { CiUser } from "react-icons/ci";
import Dollarimg from "../../../assets/images/dollar.png";
import { HiArrowsUpDown } from "react-icons/hi2";
import { Link, useParams, useNavigate } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import EditSupplierModal from "../../../pages/Modal/suppliers/EditSupplierModals";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";


const SupplierDetails = ({ onClose, supplierId }) => {
  console.log("Supplier ID in SupplierDetails:", supplierId);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [supplierData, setSupplierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Supplier Basic Details
  useEffect(() => {
    if (supplierId) {
      fetchSupplierStatistics();
    }
  }, [supplierId]);
  const fetchSupplierStatistics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/suppliers/${supplierId}/statistics`);
      console.log("Supplier statistics:", res.data);
      setSupplierData(res.data);
    } catch (err) {
      // toast.error("Failed to load supplier statistics");
      toast.error(err?.response?.data?.displayMessage ||
                err?.response?.data?.message || 
                err?.message || 
                "Failed to load supplier statistics");
      console.error("Error fetching supplier statistics:", err);
      onClose?.();
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

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

  // Handle recalculate
  const handleRecalculate = async () => {
    try {
      await api.post(`/api/suppliers/${supplierId}/recalculate-due`);
      toast.success("Supplier statistics recalculated!");
      fetchSupplierStatistics();
    } catch (error) {
      toast.error("Failed to recalculate");
    }
  };

  // click handler for table row
  const handleRowClick = (purchase) => {
    if (purchase && purchase._id) {
      navigate(`/purchase-orders/${purchase._id}`, {
        state: {
          invoiceData: purchase,
          supplierData: supplierData
        }
      });
    } else {
      toast.error("Unable to open invoice - missing ID");
    }
  }

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading supplier details...</div>;
  }

  if (!supplierData) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Supplier not found.</div>;
  }

  const { supplier, statistics, recentPurchases, summary } = supplierData;

  // Stats (cards)
  const stats = [
    {
      label: "Total Spent",
      value: formatCurrency(statistics.totalPurchaseAmount || 0)
    },
    {
      label: "Total Purchases This Month",
      value: formatCurrency(statistics.lastPurchaseAmount || 0)
    },
    {
      label: "Total Orders",
      value: statistics.totalInvoices || 0
    },
    {
      label: "First Purchase",
      value: formatDate(statistics.firstInvoiceDate)
    },
    {
      label: "Due Amount",
      value: formatCurrency(statistics.totalDueAmount || 0),
      color: statistics.totalDueAmount > 0 ? "#dc2626" : "#0E101A"
    },
    {
      label: "Prepaid Amount",
      value: formatCurrency(statistics.totalPaidAmount || 0),
      color: "#10b981"
    },
  ];

  // Tags (category chips)
  const categories = supplier?.categoryBrand
    ? supplier.categoryBrand.split(",").map(c => c.trim())
    : [];

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
    lineHeight: "120%"
  };

  const valueStyle = {
    fontSize: "22px",
    color: "#0E101A",
    fontWeight: 500,
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
  };


  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading supplier details...
      </div>
    );
  }
  if (!supplier) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        Supplier not found.
      </div>
    );
  }
  return (
    <div style={{ padding: "20px", fontFamily: '"Inter", sans-serif'}}>
      <div style={{ padding: "20px", backgroundColor: "#FFFF" }}>
        {/* supplier, edit */}
        <div className="d-flex justify-content-between"  style={{flexWrap:"wrap"}} >
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ color: "#000000", fontWeight: 500, fontSize: "22px", lineHeight: "120%", marginBottom: "20px" }}>Supplier Details</h2>
          </div>
          <span style={{ cursor: "pointer" }} onClick={() => setOpenEditModal(true)}><FaRegEdit style={{ color: "#6C748C", height: "24px", width: "24px" }} /></span>
        </div>

        {/* Top Section */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", justifyContent: "center" }}>
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
            {supplier?.supplierName.charAt(0) || "c"}
          </div>

          {/* Supplier Info */}
          <div>
            <h3 style={{ color: "#0E101A", fontWeight: 400, fontSize: "20px", lineHeight: "120%", fontFamily: '"Inter", sans-serif', margin: 0, marginTop: "20px" }}>{supplier?.supplierName || ""}</h3>
            <span style={{ fontWeight: 400, fontSize: "14px", fontFamily: '"Inter", sans-serif', lineHeight: "120%", color: "#0E101A" }}>
              Bussiness Type - <span style={{ fontWeight: 400, fontSize: "14px", fontFamily: '"Inter", sans-serif', lineHeight: "120%", color: "#727681" }}>{supplier?.businessType || ""}</span>
            </span>
            <div style={{marginTop:"4px"}}>
            <p style={{display:"inline-block", fontWeight: 400, fontSize: "14px", fontFamily: '"Inter", sans-serif', lineHeight: "120%", color: "#0E101A", padding: "5px", backgroundColor: "#E5F0FF", borderRadius: "12px", maxWidth:"280px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}  title={supplier?.address?.addressLine}>📍Address -
              {supplier?.address ?
                `${supplier.address.addressLine || ''}`
                : ''
              }

            </p>

            </div>
          </div>

          {/* Right Side Contact Info */}
          <div style={{ display: "flex", flexDirection: "column", fontWeight: 400, fontFamily: '"Inter", sans-serif', marginLeft: "auto", textAlign: "right", fontSize: "14px" }}>
            <span style={{ color: "black" }}>Phone no. - <span style={{ color: "#727681" }}>{supplier?.phone || ""}</span></span>
            <span style={{ color: "black" }}>Email Id - <span style={{ color: "#727681" }}>{supplier?.email || ""}</span></span>
            {/* <span style={{ color: "black" }}>Address - <span style={{ color: "#727681" }}> {supplier?.address ?
              `${supplier.address.addressLine || ''}`
              : ''
            }</span>
            </span> */}
          </div>
        </div>

        {/* Category Chips */}
        <div style={{ marginTop: "20px" }}>
          <span style={{ fontFamily: '"Inter", sans-serif', fontSize: "16px", fontWeight: 500, color: "#0E101A" }}>Supplied Items by Category</span>
          <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
            {categories.map((cat, index) => (
              <div
                key={index}
                style={{
                  padding: "6px 14px",
                  background: "#F1F5F9",
                  borderRadius: "20px",
                  fontSize: "14px",
                }}
              >
                {cat}
              </div>
            ))}
          </div>
        </div>

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

              {/* Blue Left Accent Line */}
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
                  style={{ width: "36px", height: "36px", objectFit: "contain" }}
                />
              </div>
            </div>
          ))}
        </div>


        {/* Table */}
        <h3 style={{ color: "#0E101A", fontSize: "16px", fontWeight: 500, fontFamily: '"Inter", sans-serif', lineHeight: "120%", marginTop: "40px" }}>Recently Purchased</h3>
        {recentPurchases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#727681" }}>No purchases found</div>
        ) : (
          <table
            style={{
              width: "100%",
              marginTop: "10px",
              borderCollapse: "collapse",
              background: "#fff",
            }}
          >
            <thead style={{ backgroundColor: "#E9F0F4", padding: "4px 16px", borderRadius: "16px" }}>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>Order No<HiArrowsUpDown /></th>
                <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>Order Date</th>
                <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>Total Amount</th>
                <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>Due Amount</th>
                <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>Payment Method</th>
              </tr>
            </thead>

            <tbody style={{ textAlign: "start" }}>
              {recentPurchases.map((row, index) => (
                <tr key={index} onClick={() => handleRowClick(row)} style={{cursor:"pointer", borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ color: "#0E101A", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>{row.invoiceNo}</td>
                  <td style={{ color: "#0E101A", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>{formatDate(row.date)}</td>
                  <td style={{ color: "#0E101A", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>{formatCurrency(row.totalAmount)}</td>
                  <td style={{ fontSize: "14px", lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px", color: row.dueAmount > 0 ? "#dc2626" : "#0E101A", fontWeight: row.dueAmount > 0 ? "600" : "400" }}>
                    {formatCurrency(row.dueAmount)}
                  </td>
                  <td style={{ fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', color: "#0E101A", padding: "12px" }}>
                    {/* Handle different cases */}
                    {(() => {
                      const method = row.paymentMethod || row.method || "cash";
                      // Format nicely
                      if (method === "bank_transfer") return "Bank Transfer";
                      if (method === "upi") return "UPI";
                      return method.charAt(0).toUpperCase() + method.slice(1);
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {openEditModal && supplier && (
        <EditSupplierModal
          supplierId={supplier._id}
          onClose={() => setOpenEditModal(false)}
        />
      )}

    </div>
  );
};

export default SupplierDetails;