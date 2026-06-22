import React from "react";
import { useNavigate } from "react-router-dom";
import munc_logo from "../../assets/Image/munc-logo.png";

const SuccessPopupModal = ({ isOpen, companyName, subdomain, onClose }) => {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    onClose();
    navigate("/login");
  };

  if (!isOpen) return null;

  return (
    <div
      className="success-modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >
      <div
        className="success-modal-content"
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Logo */}
        <img
          src={munc_logo}
          alt="munc_logo"
          style={{
            maxWidth: "150px",
            width: "100%",
            marginBottom: "24px",
          }}
        />

        {/* Success Icon */}
        <div
          style={{
            fontSize: "64px",
            marginBottom: "16px",
          }}
        >
          🎉
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#0E101A",
            marginBottom: "12px",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Registration Successful!
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: "14px",
            color: "#727681",
            marginBottom: "8px",
            lineHeight: "1.6",
            fontFamily: "Inter, sans-serif",
          }}
        >
          🥳 Thanks for signing up!
        </p>

        {/* Company Details */}
        {companyName && (
          <div
            style={{
              backgroundColor: "#F3F8FB",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#727681",
                margin: "8px 0",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <strong>Company:</strong> {companyName}
            </p>
            {subdomain && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#727681",
                  margin: "8px 0",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <strong>Workspace URL:</strong>{" "}
                <span style={{ color: "#1F7FFF", fontWeight: "500" }}>
                  {subdomain}.imsmymunc.com
                </span>
              </p>
            )}
          </div>
        )}

        {/* Info Box */}
        <div
          style={{
            backgroundColor: "#FFF3CD",
            border: "1px solid #FFC107",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "24px",
            fontSize: "13px",
            color: "#856404",
            fontFamily: "Inter, sans-serif",
            lineHeight: "1.5",
          }}
        >
          <strong>⏳ Under Verification</strong>
          <p style={{ margin: "6px 0 0 0" }}>
            Your account is under verification. You'll receive an email once
            activated, then you can login.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoToLogin}
          style={{
            width: "100%",
            padding: "12px 16px",
            backgroundColor: "#1F7FFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            transition: "background-color 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#1565D8")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#1F7FFF")}
        >
          Go to Login
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            width: "32px",
            height: "32px",
            backgroundColor: "#F0F0F0",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#E0E0E0")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "#F0F0F0")}
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessPopupModal;
