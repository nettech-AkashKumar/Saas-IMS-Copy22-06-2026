import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// icons
import { MdAddShoppingCart } from "react-icons/md";

// images
import DamageReportLogo from "../../../../assets/images/damagereportlogo.png";
import CreateDamageModal from "./CreateDamageModal";

function EmptyDamageReturn() {
  const [showDamageReportModel, setDamageReportModel] = useState(false);

  const handleDamageReportModel = () => {
    setDamageReportModel(true);
  };

  return (
    <div
      className=""
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, sans-serif",
        position: "relative",
        overflow: "auto",
      }}
    >
      <div
        style={{
          marginTop: "80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Text Content */}
        <div
          style={{
            textAlign: "center",
            maxWidth: "680px",
            padding: "0 20px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#1a1a1a",
              margin: "0 0 20px 0",
            }}
          >
            Damage Product
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: "#727681",
              lineHeight: "1.7",
              marginBottom: "40px",
            }}
          >
            Manage all your damaged items here. Currently, there are no damage
            records in
            <br />
            your inventory.
          </p>
        </div>

        {/* Gift Box Illustration */}
        <div
          style={{
            width: "240px",
            height: "240px",
            position: "relative",
            marginBottom: "40px",
            objectFit: "contain",
          }}
        >
          <img
            src={DamageReportLogo}
            alt="Reward Logo"
            style={{ width: "100%" }}
          />
        </div>

        {/* Create Button */}
        <button
          onClick={(e) => {  // FIXED: Add wrapper
            e.stopPropagation();
            handleDamageReportModel();
          }}
          style={{
            padding: "6px 36px",
            background: "#1F7FFF",
            color: "white",
            fontSize: "18px",
            fontWeight: "600",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            textDecoration: "none",
            boxShadow:
              "0 8px 25px rgba(31, 127, 255, 0.3), inset -1px -1px 6px rgba(0,0,0,0.2)",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow =
              "0 12px 30px rgba(31, 127, 255, 0.4)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 8px 25px rgba(31, 127, 255, 0.3), inset -1px -1px 6px rgba(0,0,0,0.2)";
          }}
        >
          {/* Sparkle Icon */}
          <MdAddShoppingCart style={{ fontSize: "24px" }} />
          Record Damage
        </button>
      </div>

      {showDamageReportModel && (
        <CreateDamageModal
          closeModal={() => setDamageReportModel(false)} />
      )}
    </div>
  );
}

export default EmptyDamageReturn;
