import React from "react";
import login_background from "../../assets/Image/login-image.png";
import munc_logo from "../../assets/Image/munc-logo.png";
import { Link } from "react-router-dom";
import "../../assets/css/Responsive.css";
import { MdKeyboardBackspace } from "react-icons/md";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/adminApi";

const LoginSuperAdmin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔒 Protect admin dashboard
  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      navigate("/admin/login", { replace: true });
    }
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return alert("All fields required");

    try {
      setLoading(true);
      await loginAdmin(form.email, form.password);
      navigate("/admin/dashboard");
    } catch (err) {
      alert(err.message);
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
                to="/login"
                style={{ textDecoration: "none", color: "black" }}
              >
                <MdKeyboardBackspace style={{ color: "black" }} /> Employee
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
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-placeholder input-outline input-all-box"
                  type="email"
                  placeholder="Enter Company Email"
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
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="input-placeholder input-outline input-all-box"
                  type="password"
                  placeholder="Enter Company Password"
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
              {/* <Link to="/super-admindashboard">
                <button
                  className='input-all-box'
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
              </Link> */}
            </form>
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
            style={{ width: "100%", maxWidth: "782px" }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginSuperAdmin;
