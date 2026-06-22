import React, { useState, useEffect } from "react";
import { getPublicFAQs } from "../../../../services/adminApi";
import FAQ from "../../../../component/website/component/FAQ";
import "./faq-design.css";

export default function FaqDesign() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      console.log("📝 FAQ Design Preview: Loading FAQs...");
      const data = await getPublicFAQs();
      console.log("✅ FAQ Design Preview: FAQs loaded:", data);
      setFaqs(data || []);
    } catch (error) {
      console.error("❌ FAQ Design Preview: Failed to load FAQs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="faq-design-container">
        <p style={{ textAlign: "center", padding: "40px" }}>
          Loading preview...
        </p>
      </div>
    );
  }

  return (
    <div className="faq-design-container">
      <div className="design-header">
        <h2>Preview</h2>
        <p>This is how your FAQs will look on the website</p>
      </div>

      <div className="design-preview">
        <FAQ />
      </div>
    </div>
  );
}