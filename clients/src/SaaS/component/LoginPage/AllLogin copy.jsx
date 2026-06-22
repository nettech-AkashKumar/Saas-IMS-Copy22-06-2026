import React, { useState } from "react";
import login_background from "../../assets/Image/login.svg";
import munc_logo from "../../assets/Image/munc-logo.png";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/css/Responsive.css";
import { MdKeyboardBackspace } from "react-icons/md";
import axios from "axios";
import BASE_URL from "../../../pages/config/config"
const LoginAccount = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // 🔁 Handle Input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // 🔐 Handle Login API
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Please enter email & password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/auth/all-login`,
        form,
      );

      const data = res.data;

      console.log("LOGIN RESPONSE:", data); // ✅ DEBUG

      // ✅ Store data
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      if (data.role === "TENANT") {
        localStorage.setItem("subdomain", data.subdomain);
        localStorage.setItem("dbName", data.dbName);
      }

      // ✅ Redirect based on role
      if (data.role === "SUPER_ADMIN") {
        navigate("/admin/dashboard");
      } else if (data.role === "TENANT") {
        // 🔥 MAIN FIX (Subdomain redirect)
        const subdomain = data.subdomain;

        const newUrl = `http://${subdomain}.localhost:3000/dashboard`;

        window.location.href = newUrl;
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
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
            {/* Back */}
            <label style={{ width: "100%", paddingBottom: "15px" }}>
              <Link
                to="/admin/login"
                style={{ textDecoration: "none", color: "black" }}
              >
                <MdKeyboardBackspace /> Super Admin Login
              </Link>
            </label>

            {/* Logo */}
            <img
              src={munc_logo}
              alt="logo"
              style={{ maxWidth: "214px", paddingBottom: "15px" }}
            />

            {/* Title */}
            <div className="text-center">
              <h3>Login to your Account</h3>
              <p>Welcome back! Please enter your details.</p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", gap: "16px", flexDirection: "column" }}
            >
              {/* Email */}
              <div>
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter Company Email"
                  className="input-all-box"
                  style={{
                    width: "400px",
                    border: "1px solid #DEDEDE",
                    backgroundColor: "#FBFBFB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                />
              </div>

              {/* Password */}
              <div>
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter Password"
                  className="input-all-box"
                  style={{
                    width: "400px",
                    border: "1px solid #DEDEDE",
                    backgroundColor: "#FBFBFB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                />
              </div>

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: "#0084FF",
                  padding: "12px",
                  borderRadius: "8px",
                  width: "400px",
                  border: "none",
                  color: "white",
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Register */}
            <p style={{ marginTop: "10px" }}>
              Don’t have an Account?{" "}
              <Link to="/register-login-details">Register</Link>
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div
          className="login-background"
          style={{
            backgroundColor: "#0447AA",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            src={login_background}
            alt="bg"
            style={{ maxWidth: "682px", width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginAccount;
