import React, { useState, useEffect } from "react";
import login_background from "../../assets/Image/login.svg";
import munc_logo from "../../assets/Image/munc-logo.png";
import "../../assets/css/Responsive.css";
import { MdKeyboardBackspace } from "react-icons/md";
import BASE_URL from "../../services/config/config";
import { useLocation, useNavigate, Link } from "react-router-dom";
import "../../../styles/login.css";
import { MdOutlineEmail } from "react-icons/md";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import MuncLogo from "../../../assets/img/logo/munclogotm.png";
import loginBg from "../../../assets/img/login.jpg";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance";
import Cookies from "js-cookie";
// import { useAuth } from "../AuthContext";

const AllLogin = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getRootDomain = (hostname) => {
    if (!hostname) return "";
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return "localhost";
    }

    const parts = hostname.split(".").filter(Boolean);
    if (parts.length >= 2) return parts.slice(-2).join(".");
    return hostname;
  };

  const getHostByRole = (role, subdomain) => {
    const { hostname, port } = window.location;

    const isLocal = hostname.includes("localhost");
    const localPort = port ? `:${port}` : "";

    // ✅ SUPER ADMIN
    if (role === "SUPER_ADMIN") {
      return isLocal
        ? `admin.localhost${localPort}`
        : `admin.${getRootDomain(hostname)}`;
    }

    // ✅ TENANT
    if (!subdomain) return window.location.host;

    return isLocal
      ? `${subdomain}.localhost${localPort}`
      : `${subdomain}.${getRootDomain(hostname)}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password)
      return alert("Email and password required");

    try {
      setSubmitting(true);
      const res = await fetch(`${BASE_URL}/api/auth/all-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Send and receive cookies
        body: JSON.stringify(form),
      });

      const data = await res.json();
      console.log("API response:", data);

      if (!res.ok) {
        if (data?.code === "ACCOUNT_INACTIVE") {
          alert(
            "⚠️ Your account is inactive.\nPlease contact your service provider.",
          );
        } else {
          alert(data.message || "Login failed");
        }
        return;
      }

      if (!data?.token) {
        alert("Invalid login response from server");
        return;
      }

      // ✅ Determine if Super Admin or Tenant based on response structure
      const isSuperAdmin = !data.subdomain && !data.dbName;
      const isOTP = data.twoFactor === true;

      if (isOTP) {
        // ✅ Handle OTP flow - store temporary data and redirect to OTP page
        sessionStorage.setItem("otpPending", "true");
        sessionStorage.setItem("otpEmail", data.email);
        sessionStorage.setItem("userId", data.userId);
        if (data.subdomain) sessionStorage.setItem("subdomain", data.subdomain);
        if (data.dbName) sessionStorage.setItem("dbName", data.dbName);

        window.location.href = "/otp-verification";
        return;
      }

      // ✅ Set localStorage tokens
      if (isSuperAdmin) {
        localStorage.setItem("adminToken", data.token);
        localStorage.removeItem("token");
        console.log("Set adminToken:", data.token);
      } else {
        if (!data.subdomain) {
          alert("Tenant subdomain not found for this account");
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.removeItem("adminToken");
        localStorage.setItem("subdomain", data.subdomain);
        localStorage.setItem("dbName", data.dbName);
        console.log(
          "Set tenant token:",
          data.token,
          "subdomain:",
          data.subdomain,
        );
      }

      // ✅ Determine redirect host and path
      const host = getHostByRole(
        isSuperAdmin ? "SUPER_ADMIN" : "TENANT",
        data.subdomain,
      );
      const redirectPath = isSuperAdmin ? "/admin/dashboard" : "/dashboard";

      // ✅ Pass auth data via query params for cross-subdomain token restoration
      const params = new URLSearchParams();
      if (isSuperAdmin) {
        params.set("adminToken", data.token);
      } else {
        params.set("token", data.token);
        if (data.subdomain) params.set("subdomain", data.subdomain);
        if (data.dbName) params.set("dbName", data.dbName);
      }

      const dashboardUrl = `${window.location.protocol}//${host}${redirectPath}?${params.toString()}`;
      console.log("Redirecting to:", dashboardUrl);
      window.location.replace(dashboardUrl);
    } catch (err) {
      console.error(err);
      alert("Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  //Dynamic years copyright
  const currentYear = new Date().getFullYear();

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div
          className="login-wrapper bg-img"
          style={{
            backgroundImage: `url(${loginBg})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="login-content authent-content"
            style={{ backgroundColor: "white" }}
          >
            <form
              onSubmit={submit}
              style={{
                display: "flex",
                justifyContent: "center",
                fontFamily: "Inter",
              }}
            >
              <div className="login-userset">
                {/* logo */}
                <div className="login-logo logo-normal d-flex justify-content-center">
                  <img
                    src={MuncLogo}
                    alt="img"
                    style={{
                      maxWidth: "400px",
                      width: "100%",
                    }}
                  />
                </div>

                {/* title */}
                <div className="login-userheading text-center">
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#000000",
                    }}
                  >
                    Login to your Account
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#1E1E1E",
                      fontWeight: "400",
                    }}
                  >
                    Welcome back! Please enter your details.
                  </p>
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label line-height letter-spacing-0">
                    Email <span className="text-danger"> *</span>
                  </label>
                  <div className="input-group">
                    <div
                      className="input-placeholder input-outline input-all-box"
                      style={{
                        width: "100%",
                        maxWidth: "400px",
                        border: "1px solid #DEDEDE",
                        backgroundColor: "#FBFBFB",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        outline: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="email"
                        placeholder="Enter Company Email"
                        value={form.email}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="input-placeholder"
                        // placeholder="Enter your email"
                        required
                        style={{
                          border: "none",
                          outline: "none",
                          background: "none",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                      <span className="">
                        <MdOutlineEmail />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label className="form-label letter-spacing-0">
                    Password <span className="text-danger"> *</span>
                  </label>
                  <div className="pass-group input-group">
                    <div
                      className="input-outline input-all-box"
                      style={{
                        width: "100%",
                        maxWidth: "400px",
                        border: "1px solid #DEDEDE",
                        backgroundColor: "#FBFBFB",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        outline: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <input
                        className="input-placeholder"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter Company Passowrd"
                        value={form.password}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        // className="pass-input form-control border-end-0"
                        required
                        // placeholder="Enter your password"
                        style={{
                          border: "none",
                          outline: "none",
                          background: "none",
                          width: "100%",
                          height: "100%",
                        }}
                      />
                      <span
                        className=""
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                      </span>
                    </div>
                  </div>
                </div>

                {/* login button */}
                <div className="form-login">
                  <button
                    type="submit"
                    className="input-all-box btn-login input-outline"
                    disabled={submitting}
                    style={{
                      backgroundColor: "#0084FF",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      width: "100%",
                      maxWidth: "400px",
                      border: "none",
                      fontSize: "16px",
                      fontWeight: "500",
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "Logging in..." : "Login"}
                  </button>
                </div>

                {/* Register Redirect Link */}
                {/* <label
                  htmlFor=""
                  style={{
                    fontWeight: "400",
                    fontSize: "clamp(12px,2vw,14px)",
                    color: "#000000",
                    marginTop: "10px",
                    display:"flex",
                    justifyContent:"center"
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
                </label> */}

                {/* copyright info */}
                <div className="my-1 d-flex justify-content-center align-items-center copyright-text">
                  <p>Copyright © {currentYear} Kasper Infotech Pvt. Ltd.</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllLogin;

// import React, { useState } from "react";
// import login_background from "../../assets/Image/login.svg";
// import munc_logo from "../../assets/Image/munc-logo.png";
// import { Link } from "react-router-dom";
// import "../../assets/css/Responsive.css";
// import { MdKeyboardBackspace } from "react-icons/md";
// import BASE_URL from "../../services/config/config";
// import api from "../../../pages/config/axiosInstance";

// const AllLogin = () => {
//   const [form, setForm] = useState({ email: "", password: "" });
//   const [submitting, setSubmitting] = useState(false);

//   const getRootDomain = (hostname) => {
//     if (!hostname) return "";
//     if (hostname === "localhost" || hostname.endsWith(".localhost")) {
//       return "localhost";
//     }

//     const parts = hostname.split(".").filter(Boolean);
//     if (parts.length >= 2) return parts.slice(-2).join(".");
//     return hostname;
//   };

//   const getHostByRole = (role, subdomain) => {
//     const { hostname, port } = window.location;

//     const isLocal = hostname.includes("localhost");
//     const localPort = port ? `:${port}` : "";

//     // ✅ SUPER ADMIN
//     if (role === "SUPER_ADMIN") {
//       return isLocal
//         ? `admin.localhost${localPort}`
//         : `admin.${getRootDomain(hostname)}`;
//     }

//     // ✅ TENANT
//     if (!subdomain) return window.location.host;

//     return isLocal
//       ? `${subdomain}.localhost${localPort}`
//       : `${subdomain}.${getRootDomain(hostname)}`;
//   };

//   const submit = async (e) => {
//     e.preventDefault();
//     if (!form.email || !form.password)
//       return alert("Email and password required");

//     try {
//       setSubmitting(true);
//       const response = await api.post("/api/auth/all-login", form, {
//         withCredentials: true,
//         skipAuthInterceptor: true,
//       });

//       const data = response.data;
//       console.log("API response:", data);
//       if (!response.status || response.status >= 400) {
//         if (data?.code === "ACCOUNT_INACTIVE") {
//           alert(
//             "⚠️ Your account is inactive.\nPlease contact your service provider.",
//           );
//         } else {
//           alert(data.message || "Login failed");
//         }
//         return;
//       }

//       if (!data?.token || !data?.role) {
//         alert("Invalid login response from server");
//         return;
//       }

//       if (data.role === "SUPER_ADMIN") {
//         localStorage.setItem("adminToken", data.token);
//         localStorage.removeItem("token");
//         console.log("Set adminToken:", data.token);
//       } else {
//         if (!data.subdomain) {
//           alert("Tenant subdomain not found for this account");
//           return;
//         }
//         localStorage.setItem("token", data.token);
//         localStorage.removeItem("adminToken");
//         console.log(
//           "Set tenant token:",
//           data.token,
//           "subdomain:",
//           data.subdomain,
//         );
//       }

//       const host = getHostByRole(data.role, data.subdomain);
//       const redirectPath =
//         data.redirectPath ||
//         (data.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/dashboard");
//       // Pass auth data via query param to bridge cross-subdomain localStorage gap
//       const params = new URLSearchParams();
//       if (data.role === "SUPER_ADMIN") {
//         params.set("adminToken", data.token);
//       } else {
//         params.set("token", data.token);
//         if (data.subdomain) params.set("subdomain", data.subdomain);
//         if (data.dbName) params.set("dbName", data.dbName);
//       }

//       const dashboardUrl = `${window.location.protocol}//${host}${redirectPath}?${params.toString()}`;
//       console.log("Redirecting to:", dashboardUrl);
//       window.location.replace(dashboardUrl);
//     } catch (err) {
//       console.error(err);
//       alert("Login failed");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div>
//       <div className="d-flex" style={{ height: "100vh" }}>
//         {/* login-container */}
//         <div
//           className="login-container"
//           style={{
//             backgroundColor: "white",
//             width: "100%",
//             // height: "100vh",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontFamily: "Inter",
//           }}
//         >
//           <div
//             className="register-account-container"
//             style={{
//               padding: "40px",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               alignItems: "center",
//             }}
//           >
//             {/* employee login button */}
//             <label
//               htmlFor=""
//               style={{
//                 fontWeight: "400",
//                 fontSize: "clamp(14px,2vw,16px)",
//                 color: "#000000",
//                 display: "flex",
//                 width: "100%",
//                 paddingBottom: "15px",
//               }}
//             >
//               <Link
//                 to="/admin/login"
//                 style={{ textDecoration: "none", color: "black" }}
//               >
//                 <MdKeyboardBackspace style={{ color: "black" }} /> Super Admin
//                 Login
//               </Link>
//             </label>

//             {/* munc logo */}
//             <img
//               src={munc_logo}
//               alt="munc_logo"
//               style={{
//                 maxWidth: "214px",
//                 width: "100%",
//                 paddingBottom: "15px",
//               }}
//             />

//             {/* login account head title */}
//             <div className="register-account-head-title text-center">
//               <h3
//                 style={{
//                   fontSize: "clamp(14px,2vw,20px)",
//                   fontWeight: "600",
//                   color: "#000000",
//                 }}
//               >
//                 Login to your Account
//               </h3>
//               <p
//                 style={{
//                   fontSize: "clamp(12px,2vw,14px)",
//                   color: "#1E1E1E",
//                   fontWeight: "400",
//                 }}
//               >
//                 Welcome back! Please enter your details.
//               </p>
//             </div>

//             {/* login account form */}
//             <form
//               onSubmit={submit}
//               style={{ display: "flex", gap: "16px", flexDirection: "column" }}
//             >
//               {/* Company Email */}
//               <div
//                 style={{ display: "flex", flexDirection: "column", gap: "5px" }}
//               >
//                 <label
//                   htmlFor=""
//                   style={{
//                     fontWeight: "400",
//                     fontSize: "clamp(12px,2vw,14px)",
//                     color: "#000000",
//                   }}
//                 >
//                   Email
//                 </label>
//                 <input
//                   className="input-placeholder input-outline input-all-box"
//                   type="email"
//                   placeholder="Enter Company Email"
//                   value={form.email}
//                   onChange={(e) =>
//                     setForm((prev) => ({ ...prev, email: e.target.value }))
//                   }
//                   style={{
//                     width: "400px",
//                     border: "1px solid #DEDEDE",
//                     backgroundColor: "#FBFBFB",
//                     borderRadius: "8px",
//                     padding: "12px 16px",
//                     outline: "none",
//                   }}
//                 />
//               </div>

//               {/* Password */}
//               <div
//                 style={{ display: "flex", flexDirection: "column", gap: "5px" }}
//               >
//                 <label
//                   htmlFor=""
//                   style={{
//                     fontWeight: "400",
//                     fontSize: "clamp(12px,2vw,14px)",
//                     color: "#000000",
//                   }}
//                 >
//                   Password
//                 </label>
//                 <input
//                   className="input-placeholder input-outline input-all-box"
//                   type="password"
//                   placeholder="Enter Company Passowrd"
//                   value={form.password}
//                   onChange={(e) =>
//                     setForm((prev) => ({ ...prev, password: e.target.value }))
//                   }
//                   style={{
//                     width: "400px",
//                     border: "1px solid #DEDEDE",
//                     backgroundColor: "#FBFBFB",
//                     borderRadius: "8px",
//                     padding: "12px 16px",
//                     outline: "none",
//                   }}
//                 />
//               </div>

//               {/* Next Button */}
//               <button
//                 type="submit"
//                 className="input-all-box"
//                 disabled={submitting}
//                 style={{
//                   backgroundColor: "#0084FF",
//                   padding: "12px 16px",
//                   borderRadius: "8px",
//                   width: "400px",
//                   border: "none",
//                   color: "white",
//                   fontSize: "clamp(14px,2vw,16px)",
//                   fontWeight: "500",
//                   opacity: submitting ? 0.75 : 1,
//                   cursor: submitting ? "not-allowed" : "pointer",
//                 }}
//               >
//                 {submitting ? "Logging in..." : "Login"}
//               </button>
//             </form>

//             {/* Register Redirect Link */}
//             <label
//               htmlFor=""
//               style={{
//                 fontWeight: "400",
//                 fontSize: "clamp(12px,2vw,14px)",
//                 color: "#000000",
//                 marginTop: "10px",
//               }}
//             >
//               {" "}
//               Don’t have an Account ?{" "}
//               <Link
//                 to="/register-login-details"
//                 style={{ textDecoration: "none" }}
//               >
//                 Register
//               </Link>
//             </label>
//           </div>
//         </div>

//         {/* login-background */}
//         <div
//           className="login-background"
//           style={{
//             backgroundColor: "#0447AA",
//             width: "100%",
//             // height: "100vh",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//           }}
//         >
//           <img
//             src={login_background}
//             alt="login_background"
//             style={{ width: "100%", maxWidth: "682px" }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AllLogin;
