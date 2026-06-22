// import React, { useState, useEffect } from "react";
// import "./pricing.css";
// import { getPublicPricing } from "../../../services/adminApi";
// import { useSocket } from "../../../../Context/SocketContext";

// export default function PricingPlans() {
//   const [plans, setPlans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [previewMode, setPreviewMode] = useState("monthly");
//   const { connectSocket, onCMSUpdate, removeCMSListener } = useSocket();

//   const DISCOUNT_RATE = 0.15;

//   const calculatePrice = (
//     priceStr,
//     period,
//     currency = "₹",
//     offerType = "none",
//     offerValue = 0,
//   ) => {
//     if (!priceStr)
//       return {
//         display: "Custom",
//         originalPrice: null,
//         yearlyAfterOffer: null,
//         totalDiscount: null,
//         offerApplied: false,
//       };

//     const basePrice = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);

//     if (Number.isNaN(basePrice)) {
//       return {
//         display: priceStr,
//         originalPrice: null,
//         yearlyAfterOffer: null,
//         totalDiscount: null,
//         offerApplied: false,
//       };
//     }

//     let priceAfterOffer = basePrice;
//     let offerApplied = false;

//     if (offerType === "fixed" && offerValue > 0) {
//       priceAfterOffer = Math.max(0, basePrice - offerValue);
//       offerApplied = true;
//     } else if (offerType === "percentage" && offerValue > 0) {
//       priceAfterOffer = Math.round(basePrice * (1 - offerValue / 100));
//       offerApplied = true;
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
//         yearlyAfterOffer,
//         totalDiscount: DISCOUNT_RATE * 100,
//         offerApplied,
//       };
//     }

//     return {
//       display: `${currency}${priceAfterOffer}`,
//       originalPrice: basePrice,
//       yearlyAfterOffer: null,
//       totalDiscount: null,
//       offerApplied,
//     };
//   };

//   useEffect(() => {
//     // 📝 Initial Load
//     console.log("📝 Public Website Pricing: Loading initial pricing data...");
//     getPublicPricing()
//       .then((data) => {
//         console.log(
//           "✅ Public Website Pricing: Data loaded successfully:",
//           data,
//         );
//         setPlans(data);
//       })
//       .catch((err) => {
//         console.error("❌ Public Website Pricing: Failed to load:", err);
//       })
//       .finally(() => setLoading(false));

//     // 🔌 Socket Connect
//     console.log(
//       "🔌 Public Website Pricing: Attempting socket connection to:",
//       import.meta.env.VITE_API_URL,
//     );
//     const socket = connectSocket(import.meta.env.VITE_API_URL);

//     if (socket && socket.connected) {
//       console.log("✅ Public Website Pricing: Socket already connected");
//     }

//     // Listen for pricing updates
//     onCMSUpdate((payload) => {
//       console.log("🔥 Public Website Pricing: CMS update received:", payload);
//       if (payload.section === "pricing") {
//         console.log("✨ Public Website Pricing: Reloading pricing data...");
//         getPublicPricing()
//           .then((data) => {
//             console.log(
//               "✅ Public Website Pricing: Updated pricing data:",
//               data,
//             );
//             setPlans(data);
//           })
//           .catch((err) => {
//             console.error("❌ Public Website Pricing: Failed to reload:", err);
//           });
//       }
//     });

//     return () => {
//       console.log("🧹 Public Website Pricing: Cleaning up listeners");
//       removeCMSListener();
//     };
//   }, []);

//   if (loading) {
//     return (
//       <div
//         className="pricing-section"
//         style={{ textAlign: "center", padding: "40px" }}
//       >
//         <p>Loading pricing plans...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="pricing-section">
//       <h2 className="pricing-title">Pricing & Plans</h2>

//       <div className="pricing-toggle">
//         <button
//           type="button"
//           className={`pricing-pill ${previewMode === "monthly" ? "active" : ""}`}
//           onClick={() => setPreviewMode("monthly")}
//         >
//           Monthly
//         </button>
//         <button
//           type="button"
//           className={`pricing-pill ${previewMode === "yearly" ? "active" : ""}`}
//           onClick={() => setPreviewMode("yearly")}
//         >
//           Yearly (-15%)
//         </button>
//       </div>

//       <div className="pricing-container">
//         {plans.map((plan, index) => {
//           const pricing = calculatePrice(
//             plan.price,
//             previewMode,
//             plan.currencySymbol || "₹",
//             plan.offerType || "none",
//             plan.offerValue || 0,
//           );
//           const offerBadge =
//             plan.offerType === "fixed" && plan.offerValue > 0
//               ? `Save ${plan.currencySymbol || "₹"}${plan.offerValue}`
//               : plan.offerType === "percentage" && plan.offerValue > 0
//               ? `${plan.offerValue}% OFF`
//               : "";

//           return (
//             <div
//               key={plan._id || index}
//               className={`pricing-card ${plan.recommended ? "recommended" : ""}`}
//             >
//               {plan.recommended && (
//                 <div className="recommended-badge">Recommended</div>
//               )}
//               {offerBadge && (
//                 <div className="pricing-offer-badge">{offerBadge}</div>
//               )}

//               <h1 className="price">
//                 {pricing.display} <span>/{previewMode === "yearly" ? "Year" : "Month"}</span>
//               </h1>

//               <h3>{plan.title}</h3>

//               <p className="desc">{plan.description}</p>

//               {previewMode === "yearly" && pricing.originalPrice && (
//                 <p className="pricing-yearly-note">
//                   <span className="original-price">
//                     {plan.currencySymbol || "₹"}{pricing.originalPrice}
//                   </span>{" "}
//                   before annual discount
//                 </p>
//               )}

//               <ul>
//                 {plan.features?.map((feature, idx) => (
//                   <li key={idx}>{feature.name}</li>
//                 ))}
//               </ul>

//               <button className="upgrade-btn">{plan.buttonText}</button>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import "./pricing-modern.css";
import { getPublicPricing } from "../../../services/adminApi";
import { useSocket } from "../../../../Context/SocketContext";

export default function PricingPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState("monthly");
  const { connectSocket, onCMSUpdate, removeCMSListener } = useSocket();

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
        yearlyAfterOffer: null,
        offerApplied: false,
      };

    const basePrice = parseInt(priceStr.replace(/[^0-9]/g, ""), 10);
    if (Number.isNaN(basePrice)) {
      return {
        display: priceStr,
        originalPrice: null,
        yearlyAfterOffer: null,
        offerApplied: false,
      };
    }

    let priceAfterOffer = basePrice;
    let offerApplied = false;

    if (offerType === "fixed" && offerValue > 0) {
      priceAfterOffer = Math.max(0, basePrice - offerValue);
      offerApplied = true;
    } else if (offerType === "percentage" && offerValue > 0) {
      priceAfterOffer = Math.round(basePrice * (1 - offerValue / 100));
      offerApplied = true;
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
        yearlyAfterOffer,
        offerApplied,
      };
    }

    return {
      display: `${currency}${priceAfterOffer}`,
      originalPrice: basePrice,
      yearlyAfterOffer: null,
      offerApplied,
    };
  };

  useEffect(() => {
    getPublicPricing()
      .then((data) => setPlans(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));

    const socket = connectSocket(import.meta.env.VITE_API_URL);

    onCMSUpdate((payload) => {
      if (payload.section === "pricing") {
        getPublicPricing().then((data) => setPlans(data));
      }
    });

    return () => removeCMSListener();
  }, []);

  if (loading) {
    return (
      <div className="pricing-section">
        <p style={{ textAlign: "center" }}>Loading pricing plans...</p>
      </div>
    );
  }

  return (
    <div className="pricing-section">
      <h2 className="pricing-title">Pricing & Plans</h2>

      <div className="pricing-toggle">
        <button
          className={`pricing-pill ${previewMode === "monthly" ? "active" : ""}`}
          onClick={() => setPreviewMode("monthly")}
        >
          Monthly
        </button>
        <button
          className={`pricing-pill ${previewMode === "yearly" ? "active" : ""}`}
          onClick={() => setPreviewMode("yearly")}
        >
          Yearly (-15%)
        </button>
      </div>

      <div className="pricing-container">
        {plans.map((plan, index) => {
          const pricing = calculatePrice(
            plan.price,
            previewMode,
            plan.currencySymbol || "₹",
            plan.offerType || "none",
            plan.offerValue || 0,
          );

          return (
            <div
              key={plan._id || index}
              className={`pricing-card ${plan.recommended ? "recommended" : ""}`}
            >
              {plan.recommended && (
                <div className="popular-pill">Most Popular</div>
              )}

              <div className="pricing-inner">
                <div>
                  {pricing.offerApplied && (
                    <div className="original-price-line">
                      {plan.currencySymbol || "₹"}
                      {previewMode === "yearly"
                        ? pricing.yearlyAfterOffer
                        : pricing.originalPrice}
                    </div>
                  )}

                  <h1 className="final-price">
                    {pricing.display}
                    <span>/{previewMode === "yearly" ? "Year" : "Month"}</span>
                  </h1>

                  {/* {pricing.offerApplied && (
                    <div className="you-save">
                      {plan.offerType === "percentage"
                        ? `Save ${plan.offerValue}%`
                        : `Save ${plan.currencySymbol || "₹"}${plan.offerValue}`}
                    </div>
                  )} */}
                  {pricing.offerApplied && (
                    <div className="save-badge">
                      {plan.offerType === "percentage"
                        ? `Save ${plan.offerValue}%`
                        : `Save ${plan.currencySymbol || "₹"}${plan.offerValue}`}
                    </div>
                  )}

                  <h3 className="plan-title">{plan.title}</h3>
                  <p className="desc">{plan.description}</p>
                </div>

                <div>
                  <ul>
                    {plan.features?.map((feature, idx) => (
                      <li key={idx}>{feature.name}</li>
                    ))}
                  </ul>

                  <a href={plan.buttonUrl || "#"} className="upgrade-btn">
                    {plan.buttonText}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
