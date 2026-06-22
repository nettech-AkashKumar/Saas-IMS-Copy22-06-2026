// import React, { useState } from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios';
// import BASE_URL from '../../../pages/config/config';

// function ResetPassword() {
//   const { token } = useParams();
//   const [newPassword, setNewPassword] = useState('');

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await axios.post(`${BASE_URL}/api/auth/reset-password/${token}`, { newPassword });
//       alert(res.data.message);
//     } catch (err) {
//       alert(err.response.data.message || 'Reset failed');
//     }
//   };

//   return (
//     <div className="form-container">
//       <h2>Reset Your Password</h2>
//       <form onSubmit={handleSubmit}>
//         <input
//           type="password"
//           placeholder="New Password"
//           value={newPassword}
//           onChange={(e) => setNewPassword(e.target.value)}
//           required
//         />
//         <button type="submit">Reset Password</button>
//       </form>
//     </div>
//   );
// }

// export default ResetPassword;



import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import MuncLogo from "../../../assets/img/logo/munclogotm.png";
import loginBg from "../../../assets/images/forget-password.jpg";
import api from "../../../pages/config/axiosInstance.js"

function ResetPassword() {
  const navigate = useNavigate();

  useEffect(() => {
    const img = new Image();
    img.src = loginBg;
  }, []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  useEffect(() => {
    const checkSession = async () => {
      try {
        await api.get("/api/forgot/reset-session-check");
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Invalid or expired reset session"
        );
        navigate("/forgot-password");
      }
    };

    checkSession();
  }, [navigate]);

  const handleReset = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!passwordRegex.test(newPassword)) {
      newErrors.password =
        "Password must be 8+ chars, include uppercase, lowercase,\n number & symbol";
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await api.post("/api/forgot/forgot_pass", {
        pass: newPassword,
        confirm_pass: confirmPassword,
      });
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div className="main-wrapper">
      <div className="account-content">
              <div className="login-wrapper bg-img" style={{
                backgroundImage: `url(${loginBg})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}>
          <div className="login-content authent-content" style={{ backgroundColor: "white" }}>
            <form onSubmit={handleReset} style={{ display: "flex", justifyContent: "center", fontFamily: "Inter" }}>
              <div className="login-userset">

                {/* logo */}
                <div className="login-logo logo-normal d-flex justify-content-center">
                  <img src={MuncLogo} alt="logo" style={{ maxWidth: "400px", width: "100%", }} />
                </div>

                {/* title */}
                <div className="login-userheading text-center">
                  <h3 style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#000000",
                  }}>
                    Reset Your Password
                  </h3>
                  <p style={{
                    fontSize: "14px",
                    color: "#1E1E1E",
                    fontWeight: "400",
                  }}>
                    Please enter new password below and confirm to reset.
                  </p>
                </div>

                {/* New Password */}
                <div className="mb-3">
                  <label className="form-label">New Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <div className="input-placeholder input-outline input-all-box" style={{
                      width: "100%",
                      maxWidth: "400px",
                      border: "1px solid #DEDEDE",
                      backgroundColor: "#FBFBFB",
                      borderRadius: "8px",
                      // padding: "12px 16px",
                      outline: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {errors.password && (
                    <p
                      className="text-danger"
                      style={{ fontSize: "12px", marginTop: "5px", whiteSpace: "pre-line" }}
                    >
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label className="form-label">Confirm Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <div className="input-placeholder input-outline input-all-box" style={{
                      width: "100%",
                      maxWidth: "400px",
                      border: "1px solid #DEDEDE",
                      backgroundColor: "#FBFBFB",
                      borderRadius: "8px",
                      // padding: "12px 16px",
                      outline: "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <input
                        type="password"
                        className="form-control"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {errors.confirmPassword && (
                    <p
                      className="text-danger"
                      style={{ fontSize: "12px", marginTop: "5px" }}
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* reset button */}
                <div className="form-login">
                  <button
                    type="submit"
                    className="input-all-box btn-login input-outline"
                    style={{
                      backgroundColor: "#0084FF",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      width: "100%",
                      maxWidth: "400px",
                      border: "none",
                      fontSize: "16px",
                      fontWeight: "500",
                    }}
                  >
                    Reset Password
                  </button>
                </div>

                <div className="signinform text-center">
                  <h4>
                    Remember your password?{" "}
                    <span
                      className="hover-a"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate("/login")}
                    >
                      Login Instead
                    </span>
                  </h4>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
