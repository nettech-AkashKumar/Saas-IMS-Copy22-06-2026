import React, { useState } from "react";
import FaqEditor from "./FaqEditor";
import FaqDesign from "./FaqDesign";
import "./faq-design.css";

export default function Faqs() {
  const [activeTab, setActiveTab] = useState("editor");

  return (
    <div className="faqs-wrapper">
      <div className="faqs-tabs">
        <button
          className={`tab-btn ${activeTab === "editor" ? "active" : ""}`}
          onClick={() => setActiveTab("editor")}
        >
          ✏️ Edit Content
        </button>
        <button
          className={`tab-btn ${activeTab === "design" ? "active" : ""}`}
          onClick={() => setActiveTab("design")}
        >
          🎨 Preview
        </button>
      </div>

      <div className="faqs-content">
        {activeTab === "editor" && <FaqEditor />}
        {activeTab === "design" && <FaqDesign />}
      </div>
    </div>
  );
}
