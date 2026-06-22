import React from "react";
import { useNavigate } from "react-router-dom";
import { MdBlock } from "react-icons/md";

const AccessDenied = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f6fa",
        fontFamily:"Inter"
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "10px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <MdBlock size={70} color="#e74c3c" />

        <h1 style={{ marginTop: "20px", color: "#333" }}>
          Access Denied
        </h1>

        <p style={{ color: "#666", margin: "15px 0" }}>
          You do not have permission to access this page.
        </p>

        <button
          className="button-color button-hover"
          onClick={() => navigate("/dashboard")}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
           
            cursor: "pointer",
            color:"white"
          }}
        >
           Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
