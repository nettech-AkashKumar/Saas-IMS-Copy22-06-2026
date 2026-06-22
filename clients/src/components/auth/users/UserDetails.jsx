import React, { useState } from "react";
import { FaRegEdit, FaEye, FaEyeSlash } from "react-icons/fa";

const UserDetails = ({ data, onEdit }) => {
  const [showPassword, setShowPassword] = useState(false);
  if (!data) return null;

  const containerStyle = {
    position: "relative",
    padding: "20px",
    fontFamily: '"Inter", sans-serif',
    height: "100%",
  };

  const cardStyle = {
    padding: "20px",
    backgroundColor: "#FFF",
    width: "700px",
    position: "relative",
  };

  const labelStyle = {
    fontSize: "13px",
    color: "#727681",
    marginBottom: "6px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid #E5E7EB",
    background: "#F9FAFB",
    fontSize: "14px",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div className="d-flex justify-content-between">
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 500,
              color: "#0E101A",
              fontFamily: "Inter, sans-serif",
              lineHeight: "120%",
              marginBottom: "20px",
            }}
          >
            User Details
          </h2>

          <span style={{ cursor: "pointer" }} onClick={() => onEdit(data)}>
            <FaRegEdit style={{ color: "#6C748C", height: 22, width: 22 }} />
          </span>
        </div>

        <hr />

        {/* Top Profile Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginTop: "10px",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "#E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            {data?.name?.charAt(0) || "U"}
          </div>

          {/* Name + Role */}
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: 500,
                color: "#0E101A",
                fontFamily: "Inter, 'sans-serif",
                lineHeight: "120%"
              }}
            >
              {data?.name}
            </h3>
            <div style={{ marginTop: "5px" }}>
              <span
                style={{
                  fontSize: "13px",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  background: "#E5F0FF",
                  color: "#0E101A",
                }}
              >
                {data?.role?.roleName || "User"}
              </span>
            </div>
          </div>

          {/* Right Contact */}
          <div
            style={{
              marginLeft: "auto",
              textAlign: "right",
              fontSize: "14px",
              lineHeight: "22px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#0E101A",
                fontFamily: "Inter, 'sans-serif",
                lineHeight: "120%"
              }}>
              Phone no. -
              <span style={{ color: "#727681" }}>{data?.phone || "---"}</span>
            </div>

            <div
              style={{
                fontSize: "14px",
                fontWeight: 500,
                color: "#0E101A",
                fontFamily: "Inter, 'sans-serif",
                lineHeight: "120%"
              }}
            >
              Email Id -
              <span style={{ color: "#727681" }}>{data?.email || "---"}</span>
            </div>
          </div>
        </div>

        {/* Login Credential Section */}
        <h3
          style={{
            marginTop: "35px",
            fontSize: "22px",
            fontWeight: 500,
            color: "#0E101A",
            fontFamily: "Inter, 'sans-serif",
            lineHeight: "120%"

          }}
        >
          Login Credential
        </h3>

        <div style={{ marginTop: "15px" }}>
          <div style={{ marginBottom: "15px" }}>
            <div style={labelStyle}>Username</div>
            <div style={{ width: "50%" }}>
              <input
                type="text"
                value={data?.username || ""}
                disabled
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <div style={labelStyle}>Password</div>
            <div style={{ position: "relative", width: "50%" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={data?.plainPassword || ""}
                disabled
                style={inputStyle}
              />
              <button
                className="absolute"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#727681"
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {data?.plainPassword && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "6px",
                  fontStyle: "italic"
                }}
              >
                Plain text password stored for admin viewing only
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
