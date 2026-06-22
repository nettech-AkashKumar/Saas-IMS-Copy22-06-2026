

import React, { useState } from "react";
import { LuCheck } from "react-icons/lu";

export default function PricingDesign({ plan }) {
  const [previewMode, setPreviewMode] = useState("monthly"); // monthly or yearly
  const DISCOUNT_RATE = 0.15;

  if (!plan) return null;

  // Calculate price with offer and yearly discount
  const calculatePrice = (
    priceStr,
    period,
    currency = "\u20b9",
    offerType = "none",
    offerValue = 0,
  ) => {
    if (!priceStr)
      return {
        display: "Custom",
        raw: null,
        originalPrice: null,
        totalDiscount: null,
      };

    const basePrice = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);

    if (isNaN(basePrice)) {
      return {
        display: priceStr,
        raw: null,
        originalPrice: null,
        totalDiscount: null,
      };
    }

    let priceAfterOffer = basePrice;

    // Apply offer to base price
    if (offerType === "fixed" && offerValue > 0) {
      priceAfterOffer = basePrice - offerValue;
    } else if (offerType === "percentage" && offerValue > 0) {
      priceAfterOffer = Math.round(basePrice * (1 - offerValue / 100));
    }

    if (period === "yearly") {
      const yearlyBase = basePrice * 12;
      const yearlyAfterOffer = priceAfterOffer * 12;
      const yearlyDiscounted = Math.round(
        yearlyAfterOffer * (1 - DISCOUNT_RATE),
      );

      return {
        display: `${currency}${yearlyDiscounted}`,
        originalPrice: yearlyBase,
        yearlyAfterOffer: yearlyAfterOffer,
        totalDiscount: DISCOUNT_RATE * 100,
        offerApplied: offerType !== "none",
      };
    }

    return {
      display: `${currency}${priceAfterOffer}`,
      originalPrice: basePrice,
      offerApplied: offerType !== "none" && offerValue > 0,
    };
  };

  const pricing = calculatePrice(
    plan.price,
    previewMode,
    plan.currencySymbol || "\u20b9",
    plan.offerType || "none",
    plan.offerValue || 0,
  );

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f8f9fa",
        borderRadius: "12px",
        marginTop: "15px",
      }}
    >
      <h3 style={{ color: "#333", marginBottom: "10px" }}>Preview</h3>

      {/* Toggle Preview Mode */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "15px",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => setPreviewMode("monthly")}
          style={{
            padding: "6px 12px",
            backgroundColor: previewMode === "monthly" ? "#1976d2" : "#e0e0e0",
            color: previewMode === "monthly" ? "white" : "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => setPreviewMode("yearly")}
          style={{
            padding: "6px 12px",
            backgroundColor: previewMode === "yearly" ? "#1976d2" : "#e0e0e0",
            color: previewMode === "yearly" ? "white" : "#333",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          Yearly (-15%)
        </button>
      </div>

      {/* Preview Card */}
      <div
        style={{
          maxWidth: "280px",
          margin: "0 auto",
          backgroundColor: "white",
          borderRadius: "8px",
          padding: "20px",
          border: plan.recommended ? "2px solid #1976d2" : "1px solid #ddd",
          position: "relative",
        }}
      >
        {plan.recommended && (
          <div
            style={{
              position: "absolute",
              top: "-12px",
              right: "20px",
              backgroundColor: "#ffc107",
              color: "#000",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            Recommended
          </div>
        )}

        {plan.offerType && plan.offerType !== "none" && (
          <div
            style={{
              position: "absolute",
              top: "-12px",
              left: "20px",
              backgroundColor: "#ff6b6b",
              color: "white",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            {plan.offerType === "fixed"
              ? `Save ${plan.offerValue}`
              : `${plan.offerValue}% OFF`}
          </div>
        )}

        <h1 style={{ margin: "0 0 5px 0", fontSize: "32px", color: "#1976d2" }}>
          {pricing.display}
        </h1>
        <span style={{ fontSize: "12px", color: "#999" }}>
          / {previewMode === "yearly" ? "Year" : "Month"}
        </span>

        {/* Show original price with discounts */}
        {previewMode === "yearly" && pricing.originalPrice && (
          <div
            style={{
              fontSize: "12px",
              color: "#999",
              marginBottom: "10px",
              marginTop: "5px",
            }}
          >
            <div style={{ textDecoration: "line-through" }}>
              {plan.currencySymbol || "₹"}
              {pricing.originalPrice}
              {pricing.offerApplied && (
                <span style={{ marginLeft: "5px" }}>-Offer</span>
              )}
            </div>
            {pricing.yearlyAfterOffer && (
              <div style={{ fontSize: "11px", marginTop: "2px" }}>
                After offer: {plan.currencySymbol || "₹"}
                {pricing.yearlyAfterOffer} -{pricing.totalDiscount}%
              </div>
            )}
          </div>
        )}

        <h3 style={{ margin: "15px 0 10px 0", fontSize: "16px" }}>
          {plan.title}
        </h3>

        <p style={{ margin: "10px 0", fontSize: "12px", color: "#666" }}>
          {plan.description}
        </p>

        <ul
          style={{
            textAlign: "left",
            margin: "10px 0",
            listStyle: "none",
            padding: "0",
          }}
        >
          {plan.features?.map((feature, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "8px",
                fontSize: "13px",
              }}
            >
              <LuCheck style={{ marginRight: "8px", color: "#22c55e" }} />
              {feature.name}
            </li>
          ))}
        </ul>

        {plan.modulePermissions && (
          <div style={{ marginTop: "10px", textAlign: "left" }}>
            <h4 style={{ fontSize: "14px", marginBottom: "10px" }}>
              Plan permissions preview
            </h4>
            <div
              style={{
                maxHeight: "140px",
                overflowY: "auto",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
              }}
            >
              {Object.entries(plan.modulePermissions)
                .filter(([, perms]) =>
                  Object.entries(perms).some(
                    ([key, value]) => key !== "all" && value,
                  ),
                )
                .slice(0, 8)
                .map(([module, perms]) => {
                  const enabled = Object.entries(perms)
                    .filter(([key, value]) => key !== "all" && value)
                    .map(([key]) => key);
                  if (!enabled.length) return null;
                  return (
                    <div
                      key={module}
                      style={{
                        fontSize: "12px",
                        marginBottom: "6px",
                        color: "#444",
                      }}
                    >
                      <strong>{module}</strong>: {enabled.join(", ")}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <button
          style={{
            width: "100%",
            padding: "10px",
            marginTop: "15px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          {plan.buttonText}
        </button>
      </div>
    </div>
  );
}










// web&editor related code, not deleted but commented out for now, can be reused later when we add offer editing and yearly discount editing features
// import React, { useState } from "react";
// import { LuCheck } from "react-icons/lu";
// import "./pricing-design.css";

// export default function PricingDesign({ plan }) {
//   const [previewMode, setPreviewMode] = useState("monthly");
//   const DISCOUNT_RATE = 0.15;

//   if (!plan) return null;

//   const calculatePrice = (
//     priceStr,
//     period,
//     currency = "\u20b9",
//     offerType = "none",
//     offerValue = 0,
//   ) => {
//     if (!priceStr) {
//       return {
//         display: "Custom",
//         raw: null,
//         originalPrice: null,
//         totalDiscount: null,
//       };
//     }

//     const basePrice = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);

//     if (isNaN(basePrice)) {
//       return {
//         display: priceStr,
//         raw: null,
//         originalPrice: null,
//         totalDiscount: null,
//       };
//     }

//     let priceAfterOffer = basePrice;

//     if (offerType === "fixed" && offerValue > 0) {
//       priceAfterOffer = basePrice - offerValue;
//     } else if (offerType === "percentage" && offerValue > 0) {
//       priceAfterOffer = Math.round(basePrice * (1 - offerValue / 100));
//     }

//     if (period === "yearly") {
//       const yearlyBase = basePrice * 12;
//       const yearlyAfterOffer = priceAfterOffer * 12;
//       const yearlyDiscounted = Math.round(
//         yearlyAfterOffer * (1 - DISCOUNT_RATE),
//       );

//       return {
//         display: `${currency}${yearlyDiscounted}`,
//         originalPrice: yearlyBase,
//         yearlyAfterOffer: yearlyAfterOffer,
//         totalDiscount: DISCOUNT_RATE * 100,
//         offerApplied: offerType !== "none",
//       };
//     }

//     return {
//       display: `${currency}${priceAfterOffer}`,
//       originalPrice: basePrice,
//       offerApplied: offerType !== "none" && offerValue > 0,
//     };
//   };

//   const pricing = calculatePrice(
//     plan.price,
//     previewMode,
//     plan.currencySymbol || "\u20b9",
//     plan.offerType || "none",
//     plan.offerValue || 0,
//   );

//   return (
//     <div className="heroedito-pricing-wrapper">
//       <h3 className="heroedito-preview-title">Preview</h3>

//       {/* Toggle */}
//       <div className="heroedito-toggle">
//         <button
//           className={`heroedito-toggle-btn ${
//             previewMode === "monthly" ? "active" : ""
//           }`}
//           onClick={() => setPreviewMode("monthly")}
//         >
//           Monthly
//         </button>
//         <button
//           className={`heroedito-toggle-btn ${
//             previewMode === "yearly" ? "active" : ""
//           }`}
//           onClick={() => setPreviewMode("yearly")}
//         >
//           Yearly (-15%)
//         </button>
//       </div>

//       {/* Card */}
//       <div
//         className={`heroedito-pricing-card ${
//           plan.recommended ? "recommended" : ""
//         }`}
//       >
//         {plan.recommended && (
//           <div className="heroedito-badge recommended-badge">Recommended</div>
//         )}

//         {plan.offerType && plan.offerType !== "none" && (
//           <div className="heroedito-badge offer-badge">
//             {plan.offerType === "fixed"
//               ? `Save ${plan.offerValue}`
//               : `${plan.offerValue}% OFF`}
//           </div>
//         )}

//         <h1 className="heroedito-price">{pricing.display}</h1>
//         <span className="heroedito-period">
//           / {previewMode === "yearly" ? "Year" : "Month"}
//         </span>

//         {previewMode === "yearly" && pricing.originalPrice && (
//           <div className="heroedito-original-section">
//             <div className="heroedito-strike">
//               {plan.currencySymbol || "₹"}
//               {pricing.originalPrice}
//             </div>

//             {pricing.yearlyAfterOffer && (
//               <div className="heroedito-after-offer">
//                 After offer: {plan.currencySymbol || "₹"}
//                 {pricing.yearlyAfterOffer} (-{pricing.totalDiscount}%)
//               </div>
//             )}
//           </div>
//         )}

//         <h3 className="heroedito-plan-title">{plan.title}</h3>

//         <p className="heroedito-plan-desc">{plan.description}</p>

//         <ul className="heroedito-feature-list">
//           {plan.features?.map((feature, idx) => (
//             <li key={idx}>
//               <LuCheck className="heroedito-check-icon" />
//               {feature.name}
//             </li>
//           ))}
//         </ul>

//         <button className="heroedito-pricing-btn">{plan.buttonText}</button>
//       </div>
//     </div>
//   );
// }