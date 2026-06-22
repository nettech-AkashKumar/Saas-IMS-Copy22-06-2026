import React, { useState, useEffect } from "react";
import "./faq.css";
import { getPublicFAQs } from "../../../services/adminApi";
import { useSocket } from "../../../../Context/SocketContext";

const defaultFaqData = [
  {
    question: "Q1. What is an Inventory Management System?",
    answer:
      "Inventory Management System helps businesses track stock, manage purchases & sales, handle warehouses, and generate reports in real time.",
  },
  {
    question: "Q2. Can it manage multiple warehouses?",
    answer:
      "Yes, the system allows you to manage multiple warehouses and track stock across different locations easily.",
  },
  {
    question: "Q3. Does it support barcode scanning?",
    answer:
      "Yes, barcode scanning is supported for quick product entry and stock updates.",
  },
  {
    question: "Q4. Can I generate invoices and GST reports?",
    answer:
      "Yes, you can generate invoices and GST reports directly from the system.",
  },
  {
    question: "Q5. Is it suitable for small businesses?",
    answer:
      "Yes, the system is designed for businesses of all sizes including startups and SMEs.",
  },
  {
    question: "Q6. Will I get alerts for low stock?",
    answer:
      "Yes, automatic alerts notify you when stock levels fall below a defined limit.",
  },
];

function FAQ() {
  const [faqData, setFaqData] = useState(defaultFaqData);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { connectSocket, onCMSUpdate, removeCMSListener } = useSocket();

  useEffect(() => {
    // 📝 Initial Load
    console.log("📝 Public Website FAQ: Loading initial FAQ data...");
    getPublicFAQs()
      .then((data) => {
        console.log("✅ Public Website FAQ: Data loaded successfully:", data);
        setFaqData(data && data.length > 0 ? data : defaultFaqData);
      })
      .catch((err) => {
        console.error("❌ Public Website FAQ: Failed to load:", err);
        setFaqData(defaultFaqData);
      })
      .finally(() => setLoading(false));

    // 🔌 Socket Connect
    console.log(
      "🔌 Public Website FAQ: Attempting socket connection to:",
      import.meta.env.VITE_API_URL,
    );
    const socket = connectSocket(import.meta.env.VITE_API_URL);

    if (socket && socket.connected) {
      console.log("✅ Public Website FAQ: Socket already connected");
    }

    // Listen for FAQ updates
    onCMSUpdate((payload) => {
      console.log("🔥 Public Website FAQ: CMS update received:", payload);
      if (payload.section === "faqs") {
        console.log("✨ Public Website FAQ: Reloading FAQ data...");
        getPublicFAQs()
          .then((data) => {
            console.log("✅ Public Website FAQ: Updated FAQ data:", data);
            setFaqData(data && data.length > 0 ? data : defaultFaqData);
          })
          .catch((err) => {
            console.error("❌ Public Website FAQ: Failed to reload:", err);
          });
      }
    });

    return () => {
      console.log("🧹 Public Website FAQ: Cleaning up listeners");
      removeCMSListener();
    };
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  if (loading) {
    return (
      <section className="faq-section">
        <div className="faq-header">
          <h2>Frequently Asked Questions</h2>
          <p>Find answers to common questions about our system</p>
        </div>
        <div className="faq-container">
          <div
            className="faq-box"
            style={{ textAlign: "center", padding: "40px" }}
          >
            <p>Loading FAQs...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="faq-section">
      <div className="faq-header">
        <h2>Frequently Asked Questions</h2>
        <p>Find answers to common questions about our system</p>
      </div>

      <div className="faq-container">
        <div className="faq-box">
          {faqData && faqData.length > 0 ? (
            faqData.map((item, index) => (
              <div key={index} className="faq-item">
                <div className="faq-question" onClick={() => toggleFAQ(index)}>
                  {item.question}

                  <span
                    className={`arrow ${activeIndex === index ? "rotate" : ""}`}
                  >
                    ▼
                  </span>
                </div>

                {activeIndex === index && (
                  <div className="faq-answer">
                    <p>{item.answer}</p>
                    {index === 0 && (
                      <a href="#" className="know-more">
                        Know More
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>
              No FAQs available
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default FAQ;

// import React, { useState } from "react";
// import "./faq.css";
// const faqData = [
//   {
//     question: "Q1. What is an Inventory Management System?",
//     answer:
//       "Inventory Management System helps businesses track stock, manage purchases & sales, handle warehouses, and generate reports in real time.",
//   },
//   {
//     question: "Q2. Can it manage multiple warehouses?",
//     answer:
//       "Yes, the system allows you to manage multiple warehouses and track stock across different locations easily.",
//   },
//   {
//     question: "Q3. Does it support barcode scanning?",
//     answer:
//       "Yes, barcode scanning is supported for quick product entry and stock updates.",
//   },
//   {
//     question: "Q4. Can I generate invoices and GST reports?",
//     answer:
//       "Yes, you can generate invoices and GST reports directly from the system.",
//   },
//   {
//     question: "Q5. Is it suitable for small businesses?",
//     answer:
//       "Yes, the system is designed for businesses of all sizes including startups and SMEs.",
//   },
//   {
//     question: "Q6. Will I get alerts for low stock?",
//     answer:
//       "Yes, automatic alerts notify you when stock levels fall below a defined limit.",
//   },
// ];
// function FAQ() {
//    const [activeIndex, setActiveIndex] = useState(0);

//   const toggleFAQ = (index) => {
//     setActiveIndex(activeIndex === index ? null : index);
//   };
//   return (
//      <div className="faq-container">
//       <h2 className="faq-title">FAQs</h2>

//       <div className="faq-box">
//         {faqData.map((item, index) => (
//           <div key={index} className="faq-item">

//             <div
//               className="faq-question"
//               onClick={() => toggleFAQ(index)}
//             >
//               {item.question}

//               <span
//                 className={`arrow ${
//                   activeIndex === index ? "rotate" : ""
//                 }`}
//               >
//                 ▼
//               </span>
//             </div>

//             {activeIndex === index && (
//               <div className="faq-answer">
//                 <p>{item.answer}</p>
//                 {index === 0 && (
//                   <a href="#" className="know-more">
//                     Know More
//                   </a>
//                 )}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default FAQ;
