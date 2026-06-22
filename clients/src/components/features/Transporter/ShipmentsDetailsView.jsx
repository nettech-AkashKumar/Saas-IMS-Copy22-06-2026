import React, { useState } from "react";
import { FaRegEdit } from "react-icons/fa";
import { toast } from "react-toastify";
import { useEffect } from "react";

const ShipmentsDetailsView = ({ data, onClose, onEdit }) => {
  if (!data) return null;

  const getDocumentNumber = () => {
  if (data.subMode === 'LR') {
    return data.lrNo || 'N/A';
  } else if (data.subMode === 'RR') {
    return data.railwayReceiptNo || 'N/A';
  } else if (data.transportMode === 'railways') {
    return data.railwayReceiptNo || 'N/A';
  }
  return 'N/A';
};

const getTransportModeLabel = () => {
  if (data.transportMode === 'roadways') {
    if (data.subMode === 'LR') return 'Roadways (Truck)';
    if (data.subMode === 'RR') return 'Railways (Train)';
    return 'Roadways';
  } else if (data.transportMode === 'railways') {
    return 'Railways (Train)';
  }
  return data.transportMode || 'N/A';
};

const isTrainTransport = () => {
  return data.transportMode === 'railways' || data.subMode === 'RR';
};

  // Helper function to calculate delivery charge from additionalChargesDetails
  const calculateDeliveryCharge = () => {
    // Check both rawShipment and direct data for additionalChargesDetails
    const charges = data.rawShipment?.additionalChargesDetails || data.additionalChargesDetails;
    if (!charges) return 0;
    return (
      (charges.shipping || 0) +
      (charges.handling || 0) +
      (charges.packing || 0) +
      (charges.service || 0) +
      (charges.other || 0)
    );
  };

  // Helper to get items from shipment data
  const getItems = () => {
    // Try to get items from rawShipment first, then direct items
    const items = data.rawShipment?.items || data.items || [];
    
    if (items.length === 0) return [];
    
    return items.map(item => ({
      productName: item.itemName || item.productName || 'N/A',
      quantity: item.quantity || item.qty || 0,
      price: item.unitPrice || 0,
      totalAmount: item.amount || (item.unitPrice * (item.quantity || item.qty || 0)) || 0
    }));
  };

  // Get data from the passed prop (no API call needed)
  const shipmentDetails = {
    invoiceNo: data.invoiceNo || 'N/A',
    customerName: data.customerData?.name || data.customer || 'N/A',
    customerPhone: data.customerData?.phone || 'N/A',
    customerEmail: data.customerData?.email || 'N/A',
    deliveryAddress: data.deliveryAddress || data.customerData?.address || 'N/A',
    dispatchDate: data.dispatchDate,
    transporter: data.transporter?.name || 'N/A',
    vehicleNumber: data.vehicle?.number || 'N/A',
    driverName: data.driver?.name || 'N/A',
    driverPhone: data.driver?.phone || 'N/A',
     documentNumber: getDocumentNumber(),
  transportModeLabel: getTransportModeLabel(),
  isTrain: isTrainTransport(),
  // For train
  trainNo: data.rawShipment?.railwayTrainNo || data.trainNo || 'N/A',
  wagonNo: data.rawShipment?.railwayWagonNo || data.wagonNo || 'N/A',
  railwayReceiptNo: data.railwayReceiptNo || 'N/A',
    totalAmount: data.totalAmount || 0,
    deliveryCharge: calculateDeliveryCharge(),
    status: data.status || 'assigned',
    items: getItems()
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

  return (
    <div
      className=""
      style={{
        position: "relative",
        padding: "20px",
        fontFamily: '"Inter", sans-serif',
        height: "100%",
      }}
    >
      <div style={{ position: "relative", overflow: "visible" }}>
        <div
          style={{
            backgroundColor: "#FFFF",
            maxWidth: "712px",
            position: "relative",
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: "#FFFF",
              width: "700px",
              position: "relative",
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center">
              <h2
                style={{
                  color: "#000000",
                  fontWeight: 500,
                  fontSize: "22px",
                  lineHeight: "120%",
                }}
              >
                Shipment Details
              </h2>

              <FaRegEdit
                onClick={() => onEdit && onEdit(data)}
                style={{
                  fontSize: "22px",
                  color: "#667085",
                  cursor: "pointer",
                }}
              />
            </div>

            <hr style={{ borderColor: "#E5E7EB" }} />
<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
  <div>
    <p style={{ fontSize: "12px", color: "#727681", margin: 0 }}>Transport Mode</p>
    <p style={{ fontSize: "14px", fontWeight: 500, color: "#1F7FFF", margin: "4px 0 0 0" }}>
      {shipmentDetails.transportModeLabel}
    </p>
  </div>
  <div>
    <p style={{ fontSize: "12px", color: "#727681", margin: 0 }}>Document No.</p>
    <p style={{ fontSize: "14px", fontWeight: 500, color: "#1F7FFF", margin: "4px 0 0 0" }}>
      {shipmentDetails.documentNumber}
    </p>
  </div>
</div>
            {/* VEHICLE OWNER */}
           {!shipmentDetails.isTrain ? (
  // Truck: Show Vehicle Owner and Driver Details
  <>
   <div>
  <p
    style={{
      color: "#0E101A",
      fontSize: "16px",
      fontWeight: 500,
      fontFamily: '"Inter", sans-serif',
      lineHeight: "120%",
    }}
  >
    Vehicle Owner Details
  </p>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
    }}
  >
    {/* LEFT */}
    <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
      <div
        style={{
          width: "80px",
          height: "80px",
          fontSize: "22px",
          background: "#E5E7EB",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#727681",
        }}
      >
        {shipmentDetails.transporter?.charAt(0) || "T"}
      </div>

      <div>
        <h3
          style={{
            color: "#0E101A",
            fontWeight: 400,
            fontSize: "20px",
            lineHeight: "120%",
            fontFamily: '"Inter", sans-serif',
            margin: 0,
          }}
        >
          {shipmentDetails.transporter}
        </h3>

        <p
          style={{
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "120%",
            fontFamily: '"Inter", sans-serif',
            color: "#727681",
            marginTop: "4px",
          }}
        >
          {shipmentDetails.vehicleNumber}
        </p>
      </div>
    </div>

    {/* RIGHT */}
    <div style={{ textAlign: "right" }}>
      <p style={{ margin: "6px 0", fontSize: "14px", fontWeight: 400, fontFamily: '"Inter", sans-serif', lineHeight: "120%" }}>
        <span style={{ color: "black" }}>Phone no. - </span>
        <span style={{ color: "#727681" }}>
          {shipmentDetails.driverPhone || "---"}
        </span>
      </p>

      <p style={{ margin: "6px 0", fontSize: "14px", fontWeight: 400, fontFamily: '"Inter", sans-serif', lineHeight: "120%" }}>
        <span style={{ color: "black" }}>Email Id - </span>
        <span style={{ color: "#727681" }}>
          {shipmentDetails.customerEmail || "---"}
        </span>
      </p>

      <p style={{ margin: "6px 0", fontSize: "14px", fontWeight: 400, fontFamily: '"Inter", sans-serif', lineHeight: "120%", maxWidth: "360px" }}>
        <span style={{ color: "black" }}>Address - </span>
        <span style={{ color: "#727681" }}>
          {shipmentDetails.deliveryAddress || "---"}
        </span>
      </p>
    </div>
  </div>
</div>
<div>
  <p
    style={{
      color: "#0E101A",
      fontSize: "16px",
      fontWeight: 500,
      fontFamily: '"Inter", sans-serif',
      lineHeight: "120%",
    }}
  >
    Driver Details
  </p>

  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "20px",
    }}
  >
    {/* LEFT */}
    <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
      <div
        style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "#E5E7EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "22px",
          color: "#727681",
        }}
      >
        {shipmentDetails.driverName?.charAt(0) || "D"}
      </div>

      <div>
        <h3
          style={{
            color: "#0E101A",
            fontWeight: 400,
            fontSize: "20px",
            lineHeight: "120%",
            fontFamily: '"Inter", sans-serif',
            margin: 0,
          }}
        >
          {shipmentDetails.driverName}
        </h3>

        <p
          style={{
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "120%",
            fontFamily: '"Inter", sans-serif',
            color: "#727681",
            marginTop: "4px",
          }}
        >
          {shipmentDetails.vehicleNumber}
        </p>
      </div>
    </div>

    {/* RIGHT */}
    <div style={{ textAlign: "right" }}>
      <p style={{ margin: "6px 0", fontSize: "14px", fontWeight: 400, fontFamily: '"Inter", sans-serif', lineHeight: "120%" }}>
        <span style={{ color: "black" }}>Phone no. - </span>
        <span style={{ color: "#727681" }}>
          {shipmentDetails.driverPhone || "---"}
        </span>
      </p>

      <p style={{ margin: "6px 0", fontSize: "14px", fontWeight: 400, fontFamily: '"Inter", sans-serif', lineHeight: "120%" }}>
        <span style={{ color: "black" }}>Email Id - </span>
        <span style={{ color: "#727681" }}>
          {shipmentDetails.customerEmail || "---"}
        </span>
      </p>

      <p style={{ margin: "6px 0", fontSize: "14px", fontWeight: 400, fontFamily: '"Inter", sans-serif', lineHeight: "120%", maxWidth: "360px" }}>
        <span style={{ color: "black" }}>Address - </span>
        <span style={{ color: "#727681" }}>
          {shipmentDetails.deliveryAddress || "---"}
        </span>
      </p>
    </div>
  </div>
</div>
  </>
) : (
  // Train: Show Train Details instead
  <div>
    <p style={{ color: "#0E101A", fontSize: "16px", fontWeight: 500 }}>Train Details</p>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div style={{ width: "80px", height: "80px", fontSize: "22px", background: "#E5E7EB", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#727681" }}>
          🚆
        </div>
        <div>
          <h3 style={{ color: "#0E101A", fontWeight: 400, fontSize: "20px", margin: 0 }}>Train Transport</h3>
          <p style={{ fontWeight: 400, fontSize: "14px", color: "#727681", marginTop: "4px" }}>Train No: {shipmentDetails.trainNo}</p>
          <p style={{ fontWeight: 400, fontSize: "14px", color: "#727681", marginTop: "4px" }}>Wagon No: {shipmentDetails.wagonNo}</p>
          <p style={{ fontWeight: 400, fontSize: "12px", color: "#1F7FFF", marginTop: "4px" }}>RR No: {shipmentDetails.railwayReceiptNo}</p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: "6px 0", fontSize: "14px" }}><span style={{ color: "black" }}>Email - </span><span style={{ color: "#727681" }}>{shipmentDetails.customerEmail || "---"}</span></p>
        <p style={{ margin: "6px 0", fontSize: "14px", maxWidth: "360px" }}><span style={{ color: "black" }}>Address - </span><span style={{ color: "#727681" }}>{shipmentDetails.deliveryAddress || "---"}</span></p>
      </div>
    </div>
  </div>
)}

            <hr style={{ margin: "30px 0", borderColor: "#E5E7EB" }} />


            <hr style={{ margin: "30px 0", borderColor: "#E5E7EB" }} />

            {/* FROM TO */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ marginBottom: "18px" }}>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                    color: "#0E101A",
                    marginBottom: "0"
                  }}
                >
                  From
                </p>

                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                    color: "#727681",
                  }}
                >
                  {data.consignorData?.address || data.fromAddress || 'N/A'}
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                    color: "#0E101A",
                    marginBottom: "0"
                  }}
                >
                  To
                </p>

                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                    color: "#727681",
                  }}
                >
                   {data.toAddress || shipmentDetails.deliveryAddress}
                </p>
              </div>
            </div>

            {/* DATES */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "24px",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                    color: "#0E101A",
                    marginBottom: "0"
                  }}
                >
                  Expected Delivery Date
                </p>

                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                    color: "#727681",
                  }}
                >
                  {formatDate(data.rawShipment?.expectedDeliveryDate || data.expectedDeliveryDate)}
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                    color: "#0E101A",
                    marginBottom: "0"
                  }}
                >
                  Dispatch Date
                </p>

                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 400,
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                    color: "#727681",
                  }}
                >
                  {formatDate(shipmentDetails.dispatchDate)}
                </p>
              </div>
            </div>

            <hr style={{ margin: "30px 0", borderColor: "#E5E7EB" }} />

            {/* ITEMS */}
            <div>
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
                Items
              </h3>

              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: "#E9F0F4",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>
                      Items
                    </th>

                    <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>
                      Quantity
                    </th>

                    <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>
                      Unit Price
                    </th>

                    <th style={{ color: "#727681", fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', padding: "12px" }}>
                      Total Amount
                    </th>
                    </tr>
                </thead>

                <tbody>
                  {shipmentDetails.items?.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #E5E7EB",
                      }}
                    >
                      <td style={{ fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', color: "#0E101A", padding: "12px" }}>
                        {index + 1}. {item.productName}
                      </td>

                      <td style={{ fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', color: "#0E101A", padding: "12px" }}>
                        {item.quantity}
                      </td>

                      <td style={{ fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', color: "#0E101A", padding: "12px" }}>
                        ₹ {item.price.toLocaleString('en-IN')}/-
                      </td>

                      <td style={{ fontSize: "14px", fontWeight: 400, lineHeight: "120%", fontFamily: '"Inter", sans-serif', color: "#0E101A", padding: "12px" }}>
                        ₹ {item.totalAmount.toLocaleString('en-IN')}/-
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add STATUS_DISPLAY at the top or import it
const STATUS_DISPLAY = {
  assigned: { label: "Assigned", bgColor: "#EAF3FF", color: "#1F7FFF" },
  in_transit: { label: "In Transit", bgColor: "#FFF3E0", color: "#ED6C02" },
  out_for_delivery: { label: "Out for Delivery", bgColor: "#E8F5E9", color: "#2E7D32" },
  delivered: { label: "Delivered", bgColor: "#E8F5E9", color: "#2E7D32" },
  failed: { label: "Failed", bgColor: "#FFEBEE", color: "#D32F2F" },
  cancelled: { label: "Cancelled", bgColor: "#FFEBEE", color: "#D32F2F" }
};

export default ShipmentsDetailsView;
// import React, { useState } from "react";
// import { FaRegEdit } from "react-icons/fa";
// import Dollarimg from "../../../assets/images/dollar.png";
// import { HiArrowsUpDown } from "react-icons/hi2";
// import { Link } from "react-router-dom";
// import { IoIosArrowBack } from "react-icons/io";
// import { toast } from "react-toastify"
// import api from "../../../pages/config/axiosInstance"
// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";


// const ShipmentsDetailsView = ({ data, onClose, onEdit }) => {
//   const navigate = useNavigate();

//   if (!data) return null;
//   // Supplier Basic Details
//   const [customerData, setCustomerData] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (data?._id) {
//       fetchShipmentDetails();
//     }
//   }, [data]);

// // Replace the fetchCustomerStatistics function with this:
// const fetchShipmentDetails = async () => {
//   setLoading(true);
//   try {
//     // Fetch invoice details instead of customer statistics
//     const res = await api.get(`/api/invoices/${data.invoiceId}`);
//     const invoiceData = res.data.invoice;
    
//     setShipmentDetails({
//       invoiceNo: invoiceData.invoiceNo,
//       customerName: invoiceData.customerId?.name || 'N/A',
//       customerPhone: invoiceData.customerId?.phone || 'N/A',
//       customerEmail: invoiceData.customerId?.email || 'N/A',
//       deliveryAddress: invoiceData.shippingAddress || invoiceData.billingAddress,
//       dispatchDate: invoiceData.invoiceDate,
//       transporter: invoiceData.transporterId?.transporterName || 'N/A',
//       vehicleNumber: invoiceData.vehicleId?.vehicleNumber || 'N/A',
//       driverName: invoiceData.driverId?.driverName || 'N/A',
//       driverPhone: invoiceData.driverId?.phoneNumber || 'N/A',
//       totalAmount: invoiceData.grandTotal,
//       deliveryCharge: calculateDeliveryCharge(invoiceData.additionalChargesDetails),
//       status: invoiceData.shipmentStatus || 'assigned',
//       items: invoiceData.items || []
//     });
//   } catch (error) {
//     console.error("Failed to fetch shipment details:", error);
//     toast.error("Failed to load shipment details");
//   } finally {
//     setLoading(false);
//   }
// };

//   //  Format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2,
//     }).format(amount);
//   }

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return '---';
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-IN', {
//         day: '2-digit',
//         month: 'short',
//         year: 'numeric'
//       });
//     } catch (error) {
//       return '---';
//     }
//   };
//   // Recalculate due amount
//   const handleRecalculateDue = async () => {
//     try {
//       await api.post(`/api/customers/${data._id}/recalculate-due`);
//       toast.success("Due amount recalculated successfully!");
//       fetchShipmentDetails(); // Refresh data
//     } catch (error) {
//       toast.error("Failed to recalculate due amount");
//     }
//   };


//   if (!customerData) {
//     return (
//       <div
//         style={{ padding: "20px", textAlign: "center" }}
//       >
//         Loading customer details...
//       </div>
//     )
//   }

//   const { customer, statistics, recentPurchases, summary } = customerData;


//   // Stats (cards)
//   const stats = [
//     { label: "Total Spent", value: formatCurrency(statistics.totalPurchaseAmount || 0), currency: "" },
//     {
//       label: "Total Orders", value: statistics.totalPurchases || 0,
//       currency: ""
//     },
//     {
//       label: "First Purchase", value: statistics.firstPurchaseDate ?
//         formatDate(statistics.firstPurchaseDate) : "---"

//     },
//     {
//       label: "Due Amount", value: formatCurrency(statistics.totalDueAmount || 0), color: statistics.totalDueAmount > 0 ? "#dc2626" : "#0E101A",
//       currency: ""
//     },
//   ];



//   const cardStyle = {
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//     backgroundColor: "#FFFFFF",
//     position: "relative",
//     width: "100%",
//     height: "86px",
//     padding: "16px 24px 16px 16px",
//     fontFamily: "Inter",
//     boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
//     border: "1px solid #E5F0FF",
//     borderRadius: "8px",
//   };

//   const labelStyle = {
//     fontSize: "14px",
//     color: "#727681",
//     fontWeight: 500,
//     marginBottom: "8px",
//     fontFamily: '"Inter", sans-serif',
//     lineHeight: "120%",
//   };

//   const valueStyle = {
//     fontSize: "22px",
//     color: "#0E101A",
//     fontWeight: 500,
//     display: "flex",
//     alignItems: "flex-end",
//     gap: "6px",
//   };

//   // Update the row click handler
//   const handleRowClick = (purchase) => {
//     console.log("Row clicked:", purchase);

//     if (purchase && purchase._id) {
//       // Navigate to sales invoice view
//       navigate(`/sales-invoice/${purchase._id}`, {
//         state: {
//           invoiceData: purchase,
//           customerData: customerData // Pass customer data
//         }
//       });
//     } else {
//       toast.error("Unable to open invoice");
//     }
//   };

//   return (
//     <div
//       className=""
//       style={{
//         position: "relative",
//         padding: "20px",
//         fontFamily: '"Inter", sans-serif',
//         height: "100%", // Add this
//       }}
//     >
//       <div style={{ position: "relative", overflow: "visible", }}>
//         <div
//           style={{
//             padding: "24px",
//             backgroundColor: "#FFFF",
//             maxWidth: "712px",
//             position: "relative",
//             // overflow: "visible",
//           }}
//         >
//           {/* supplier, edit */}
//           <div className="d-flex justify-content-between">
//             <div style={{ display: "flex", alignItems: "center" }}>
//               {/* my span */}
//               <h2
//                 style={{
//                   color: "#000000",
//                   fontWeight: 500,
//                   fontSize: "22px",
//                   lineHeight: "120%",
//                   marginBottom: "20px",
//                 }}
//               >
//                 Shipment Details
//               </h2>
//             </div>
//             <span
//               style={{ cursor: "pointer" }}
//               onClick={() => onEdit(data)}
//             >
//               <FaRegEdit
//                 style={{ color: "#6C748C", height: "24px", width: "24px" }}
//               />
//             </span>
//           </div>
//           <hr style={{ color: "#ccc" }} />

//           {/* Top Section */}
//           <div
//             style={{
//               display: "flex",
//               gap: "10px",
//               alignItems: "center",
//               justifyContent: "center",
//             }}
//           >
//             {/* Profile Circle */}
//             <div
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 fontSize: "22px",
//                 width: "80px",
//                 height: "80px",
//                 borderRadius: "50%",
//                 background: "#E5E7EB",
//               }}
//             >
//               {customer?.name?.charAt(0) || "C"}
//             </div>

//             {/* Customer Info */}
//             <div className="d-flex flex-column">
//               <h3
//                 style={{
//                   color: "#0E101A",
//                   fontWeight: 400,
//                   fontSize: "20px",
//                   lineHeight: "120%",
//                   fontFamily: '"Inter", sans-serif',
//                   margin: 0,
//                   marginTop: "20px",
//                 }}
//               >
//                 {customer?.name}
//               </h3>
//               <span
//                 style={{
//                   textAlign: "center",
//                   fontWeight: 400,
//                   fontSize: "14px",
//                   fontFamily: '"Inter", sans-serif',
//                   lineHeight: "120%",
//                   color: "#0E101A",
//                   padding: "5px",
//                   backgroundColor: "#E5F0FF",
//                   borderRadius: "12px",
//                   // width: "100px",
//                 }}
//               >
//                 🪙{statistics.availablePoints} points
//               </span>
//               <span
//                 style={{
//                   fontWeight: 400,
//                   fontSize: "14px",
//                   fontFamily: '"Inter", sans-serif',
//                   lineHeight: "120%",
//                   color: "red",
//                   padding: "5px",
//                 }}
//               >
//                 {statistics.loyaltyTier}
//               </span>
//             </div>

//             {/* Right Side Contact Info */}
//             <div
//               style={{
//                 display: "flex",
//                 flexDirection: "column",
//                 fontWeight: 400,
//                 fontFamily: '"Inter", sans-serif',
//                 marginLeft: "auto",
//                 textAlign: "right",
//                 fontSize: "14px",
//               }}
//             >
//               <span style={{ color: "black" }}>
//                 Phone no. -{" "}
//                 <span style={{ color: "#727681" }}>{customer?.phone || "---"}</span>
//               </span>
//               <span style={{ color: "black" }}>
//                 Email Id -{" "}
//                 <span style={{ color: "#727681" }}>{customer?.email || "---"}</span>
//               </span>
//               <span style={{ color: "black" }}>
//                 Address -{" "}
//                 <span style={{ color: "#727681" }}>{customer?.address || "---"}</span>
//               </span>
//             </div>
//           </div>

//           {/* Stats Section */}
//           {loading ? (
//             <div style={{ textAlign: "center", padding: "40px" }}>Loading statistics...</div>
//           ) : (
//             <>
//               <div
//                 style={{
//                   display: "grid",
//                   gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
//                   gap: "20px",
//                   marginTop: "25px",
//                 }}
//               >
//                 {stats.map((item, index) => (
//                   <div key={index} style={cardStyle}>
//                     <span
//                       style={{
//                         position: "absolute",
//                         left: 0,
//                         top: "50%",
//                         transform: "translateY(-50%)",
//                         width: "4px",
//                         height: "70%",
//                         backgroundColor: "#1F7FFF",
//                         borderRadius: "1px 10px 1px 10px",
//                       }}
//                     ></span>

//                     {/* Left Content */}
//                     <div>
//                       <div style={labelStyle}>{item.label}</div>

//                       <div style={{ ...valueStyle, color: item.color || "#0E101A" }}>
//                         {item.value}
//                         {item.currency && (
//                           <span style={{ fontSize: "14px" }}>{item.currency}</span>
//                         )}
//                       </div>
//                     </div>

//                     {/* Right Icon Circle */}
//                     <div
//                       style={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         width: "50px",
//                         height: "50px",
//                         backgroundColor: "#FFFFFF",
//                         border: "1px solid #E5F0FF",
//                         borderRadius: "50%",
//                         flexShrink: 0,
//                       }}
//                     >
//                       <img
//                         src={Dollarimg}
//                         alt="dollar"
//                         style={{
//                           width: "36px",
//                           height: "36px",
//                           objectFit: "contain",
//                         }}
//                       />
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Table */}
//               <h3
//                 style={{
//                   color: "#0E101A",
//                   fontSize: "16px",
//                   fontWeight: 500,
//                   fontFamily: '"Inter", sans-serif',
//                   lineHeight: "120%",
//                   marginTop: "40px",
//                 }}
//               >
//                 Recently Purchased
//               </h3>
//               {recentPurchases.length === 0 ? (
//                 <div style={{ textAlign: "center", padding: "20px", color: "#727681" }}>No Purchase found</div>) : (
//                 <div
//                   style={{
//                     maxHeight: "100%", // Add this container
//                     overflowY: "auto",
//                   }}
//                 >

//                   <table
//                     style={{
//                       width: "100%",
//                       marginTop: "10px",
//                       borderCollapse: "collapse",
//                       background: "#fff",
//                     }}
//                   >
//                     <thead
//                       style={{
//                         backgroundColor: "#E9F0F4",
//                         padding: "4px 16px",
//                         borderRadius: "12px 12px 0px 0px",
//                       }}
//                     >
//                       <tr
//                         style={{ textAlign: "left", borderBottom: "1px solid #E5E7EB" }}
//                       >
//                         <th
//                           style={{
//                             color: "#727681",
//                             fontSize: "14px",
//                             fontWeight: 400,
//                             lineHeight: "120%",
//                             fontFamily: '"Inter", sans-serif',
//                             padding: "12px",
//                           }}
//                         >
//                           Invoice No
//                           <HiArrowsUpDown />
//                         </th>
//                         <th
//                           style={{
//                             color: "#727681",
//                             fontSize: "14px",
//                             fontWeight: 400,
//                             lineHeight: "120%",
//                             fontFamily: '"Inter", sans-serif',
//                             padding: "12px",
//                           }}
//                         >
//                           Order Date
//                         </th>
//                         <th
//                           style={{
//                             color: "#727681",
//                             fontSize: "14px",
//                             fontWeight: 400,
//                             lineHeight: "120%",
//                             fontFamily: '"Inter", sans-serif',
//                             padding: "12px",
//                           }}
//                         >
//                           Total Amount
//                         </th>
//                         <th
//                           style={{
//                             color: "#727681",
//                             fontSize: "14px",
//                             fontWeight: 400,
//                             lineHeight: "120%",
//                             fontFamily: '"Inter", sans-serif',
//                             padding: "12px",
//                           }}
//                         >
//                           Due Amount
//                         </th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {recentPurchases?.slice(0, 5).map((row, index) => (
//                         <tr key={index} onClick={() => handleRowClick(row)} style={{ cursor: "pointer", borderBottom: "1px solid #F3F4F6" }}>
//                           <td
//                             style={{
//                               color: "#0E101A",
//                               fontSize: "14px",
//                               fontWeight: 400,
//                               lineHeight: "120%",
//                               fontFamily: '"Inter", sans-serif',
//                               padding: "12px",
//                             }}
//                           >
//                             {row.invoiceNo || '---'}
//                           </td>
//                           <td
//                             style={{
//                               color: "#0E101A",
//                               fontSize: "14px",
//                               fontWeight: 400,
//                               lineHeight: "120%",
//                               fontFamily: '"Inter", sans-serif',
//                               padding: "12px",
//                             }}
//                           >
//                             {formatDate(row.date || row.invoiceDate)}
//                           </td>
//                           <td
//                             style={{
//                               color: "#0E101A",
//                               fontSize: "14px",
//                               fontWeight: 400,
//                               lineHeight: "120%",
//                               fontFamily: '"Inter", sans-serif',
//                               padding: "12px",
//                             }}
//                           >
//                             {formatCurrency(row.totalAmount || row.grandTotal)}
//                           </td>
//                           <td
//                             style={{
//                               fontSize: "14px",
//                               lineHeight: "120%",
//                               fontFamily: '"Inter", sans-serif',
//                               padding: "12px",
//                               color: row.dueColor || "#000",
//                               fontWeight: row.dueColor ? "600" : "400",
//                             }}
//                           >
//                             {formatCurrency(row.dueAmount)}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ShipmentsDetailsView;






