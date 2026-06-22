import React, { useState } from "react";
import login_background from "../../assets/Image/login.svg";
import munc_logo from "../../assets/Image/munc-logo.png";
import { Link, useNavigate } from "react-router-dom";
// import { loginTenant } from "../../services/adminApi";
import "../../assets/css/Responsive.css";
import { MdKeyboardBackspace } from "react-icons/md";

const LoginAccount = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const subdomain = window.location.hostname.split(".")[0];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return alert("All fields required");
    try {
      // await loginTenant(form.email, form.password, subdomain);
      // Redirect to tenant dashboard in same tab
      window.location.href = "/dashboard";
    } catch (err) {
      alert(err.message || "Login failed");
    }
  };
  return (
    <div>
      <div className="d-flex" style={{ height: "100vh" }}>
        {/* login-container */}
        <div
          className="login-container"
          style={{
            backgroundColor: "white",
            width: "100%",
            // height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter",
          }}
        >
          <div
            className="register-account-container"
            style={{
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* employee login button */}
            <label
              htmlFor=""
              style={{
                fontWeight: "400",
                fontSize: "clamp(14px,2vw,16px)",
                color: "#000000",
                display: "flex",
                width: "100%",
                paddingBottom: "15px",
              }}
            >
              <Link
                to="/superadmin-login"
                style={{ textDecoration: "none", color: "black" }}
              >
                <MdKeyboardBackspace style={{ color: "black" }} /> Super Admin
                Login
              </Link>
            </label>

            {/* munc logo */}
            <img
              src={munc_logo}
              alt="munc_logo"
              style={{
                maxWidth: "214px",
                width: "100%",
                paddingBottom: "15px",
              }}
            />

            {/* login account head title */}
            <div className="register-account-head-title text-center">
              <h3
                style={{
                  fontSize: "clamp(14px,2vw,20px)",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                Login to your Account
              </h3>
              <p
                style={{
                  fontSize: "clamp(12px,2vw,14px)",
                  color: "#1E1E1E",
                  fontWeight: "400",
                }}
              >
                Welcome back! Please enter your details.
              </p>
            </div>

            {/* login account form */}
            <form
              onSubmit={submit}
              style={{ display: "flex", gap: "16px", flexDirection: "column" }}
            >
              {/* Company Email */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <label
                  htmlFor=""
                  style={{
                    fontWeight: "400",
                    fontSize: "clamp(12px,2vw,14px)",
                    color: "#000000",
                  }}
                >
                  Email
                </label>
                <input
                  className="input-placeholder input-outline input-all-box"
                  type="email"
                  placeholder="Enter Company Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={{
                    width: "400px",
                    border: "1px solid #DEDEDE",
                    backgroundColor: "#FBFBFB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Password */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <label
                  htmlFor=""
                  style={{
                    fontWeight: "400",
                    fontSize: "clamp(12px,2vw,14px)",
                    color: "#000000",
                  }}
                >
                  Password
                </label>
                <input
                  className="input-placeholder input-outline input-all-box"
                  type="password"
                  placeholder="Enter Company Passowrd"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  style={{
                    width: "400px",
                    border: "1px solid #DEDEDE",
                    backgroundColor: "#FBFBFB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Next Button */}

              <button
                className="input-all-box"
                style={{
                  backgroundColor: "#0084FF",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  width: "400px",
                  border: "none",
                  color: "white",
                  fontSize: "clamp(14px,2vw,16px)",
                  fontWeight: "500",
                }}
              >
                Login
              </button>
            </form>

            {/* Register Redirect Link */}
            <label
              htmlFor=""
              style={{
                fontWeight: "400",
                fontSize: "clamp(12px,2vw,14px)",
                color: "#000000",
                marginTop: "10px",
              }}
            >
              {" "}
              Don’t have an Account ?{" "}
              <Link
                to="/register-login-details"
                style={{ textDecoration: "none" }}
              >
                Register
              </Link>
            </label>
          </div>
        </div>

        {/* login-background */}
        <div
          className="login-background"
          style={{
            backgroundColor: "#0447AA",
            width: "100%",
            // height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={login_background}
            alt="login_background"
            style={{ width: "100%", maxWidth: "682px" }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginAccount;
