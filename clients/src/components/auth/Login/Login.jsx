import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../../../styles/login.css";
import { MdOutlineEmail } from "react-icons/md";
import { FaRegEyeSlash, FaRegEye } from "react-icons/fa";
import MuncLogo from "../../../assets/img/logo/munclogotm.png";
import loginBg from "../../../assets/img/login.jpg";
import { Link } from "react-router-dom";
import axios from "axios";
import BASE_URL from "../../../pages/config/config";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance";
import Cookies from "js-cookie";
import { useAuth } from "../AuthContext";

const Login = () => {
  const location = useLocation();
  const inactiveMessage = location.state?.inactive;
  const { setUser } = useAuth();

  useEffect(() => {
    const img = new Image();
    img.src = loginBg;
  }, []);

  useEffect(() => {
    if (inactiveMessage) {
      toast.error("You are set Inactive by admin. Please first contact him");
    }
  }, [inactiveMessage]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);

  // state for two factor authentication
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [emailForOtp, setEmailForOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getCurrentSubdomain = () => {
    const host = window.location.hostname.toLowerCase();
    const skipHosts = ["localhost", "127.0.0.1", "imsmymunc.com"];
    if (skipHosts.includes(host) || host.startsWith("admin.")) {
      return null;
    }
    return host.split(".")[0];
  };

  const currentSubdomain = getCurrentSubdomain();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // for device management
  const logDeviceSession = (userId) => {
    // const token = localStorage.getItem("token"); // <-- Add this line
    // const token = Cookies.get("token");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          api
            .post(
              "/api/auth/log-device",
              {
                userId,
                latitude,
                longitude,
              },
              {
                skipAuthInterceptor: true,
              },
            )
            // .then((res) => console.log("Device logged:", res.data))
            .catch((err) =>
              console.error(
                "Device log failed:",
                err.response?.data || err.message,
              ),
            );
        },
        (error) => {
          // console.error("Geolocation error:", error)
        },
      );
    } else {
      // console.warn("Geolocation not supported")
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent multiple submits
    setLoading(true);

    try {
      //ste 2: Proceed with normal login
      // let deviceId = localStorage.getItem("deviceId");
      let deviceId = Cookies.get("deviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        Cookies.set("deviceId", deviceId, { expires: 365, path: "/" });
      }
      const deviceInfo = navigator.userAgent;

      const payload = {
        email: formData.email,
        password: formData.password,
        deviceId,
        deviceInfo,
        rememberMe,
      };

      if (currentSubdomain) {
        payload.subdomain = currentSubdomain;
      }

      const res = await api.post("/api/auth/login", payload, {
        withCredentials: true,
        skipAuthInterceptor: true,
      });
      console.log("LOGIN RESPONSE:", res.data);

      // Handle 2FA required
      if (res.data.twoFactor === true) {
        // Backend already set cookies, just store tenant info
        const { subdomain, dbName } = res.data;
        if (subdomain) {
          Cookies.set("subdomain", subdomain, {
            expires: new Date(Date.now() + 5 * 60 * 1000),
            path: "/",
          });
        }
        if (dbName) {
          Cookies.set("dbName", dbName, {
            expires: new Date(Date.now() + 5 * 60 * 1000),
            path: "/",
          });
        }
        navigate("/otp", {
          replace: true,
          state: {
            email: res.data.email,
            subdomain: res.data.subdomain,
            dbName: res.data.dbName,
            fromLogin: true,
            timestamp: Date.now(),
            rememberMe,
          },
        });
        return;
      }

      // Handle successful login (trusted device or super admin)
      let normalizedUser = null;
      let redirectPath = "/dashboard";

      if (res?.data?.user) {
        const user = res.data.user;
        normalizedUser = {
          ...user,
          _id: user._id || user.id,
        };
      }

      // Store tenant info if present
      if (res.data.subdomain) {
        localStorage.setItem("subdomain", res.data.subdomain);
        Cookies.set("subdomain", res.data.subdomain, { path: "/" });
      }
      if (res.data.dbName) {
        localStorage.setItem("dbName", res.data.dbName);
        Cookies.set("dbName", res.data.dbName, { path: "/" });
      }

      // Store token in localStorage for axios interceptor
      if (res.data.token) {
        if (res.data.role === "SUPER_ADMIN") {
          localStorage.setItem("adminToken", res.data.token);
          localStorage.removeItem("token");
        } else {
          localStorage.setItem("token", res.data.token);
          localStorage.removeItem("adminToken");
        }
      }

      // Use redirectPath from backend if available
      if (res.data.redirectPath) {
        redirectPath = res.data.redirectPath;
      }

      // Fetch current user
      try {
        const me = await api.get("/api/auth/me", {
          withCredentials: true,
        });
        const hydrated = me?.data?.user || normalizedUser;
        if (hydrated) {
          setUser(hydrated);
          try {
            if (rememberMe) {
              localStorage.setItem("user", JSON.stringify(hydrated));
            } else {
              localStorage.removeItem("user");
            }
            const cookieExpiry = rememberMe ? 30 : 7;
            Cookies.set("userId", hydrated._id || hydrated.id, {
              expires: cookieExpiry,
              path: "/",
            });
            if (hydrated.email) {
              Cookies.set("userEmail", hydrated.email, {
                expires: cookieExpiry,
                path: "/",
              });
            }
            if (hydrated.name) {
              Cookies.set("userName", hydrated.name, {
                expires: cookieExpiry,
                path: "/",
              });
            }
          } catch (e) {
            void e;
          }
          try {
            window.__authGraceUntil = Date.now() + 3000;
          } catch (e) {
            void e;
          }
        }
      } catch (e) {
        void e;
      }

      setTimeout(() => {
        if (normalizedUser?._id) {
          logDeviceSession(normalizedUser._id);
        }
      }, 500);

      toast.success("Login Successful!");
      navigate(redirectPath);
    } catch (error) {
      // console.error("Login Error:", error);
      //reset loading here if login fails
      setLoading(false);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        alert("Something went wrong. Try again.");
      }
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
              onSubmit={handleSubmit}
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
                  <label className="form-label letter-spacing-0">
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
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        // className="form-control border-end-0"
                        className="input-placeholder"
                        placeholder="Enter your email"
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
                        value={formData.password}
                        onChange={handleChange}
                        // className="pass-input form-control border-end-0"
                        required
                        placeholder="Enter your password"
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

                {/* remember me*/}
                <div className="form-login authentication-check">
                  <div className="">
                    <div className="col-12 d-flex align-items-center justify-content-between">
                      <div className="custom-control custom-checkbox p-0">
                        <label className="checkboxs mb-0 pb-0 line-height-1 fs-16 text-gray-6">
                          <input
                            type="checkbox"
                            className="form-control"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                          />
                          <span className="checkmarks" />
                          Remember me
                        </label>
                      </div>
                      <div className="text-end">
                        <Link
                          to="/forgot-password"
                          className="text-orange fs-16 fw-medium"
                        >
                          Forgot Password?
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* login button */}
                <div className="form-login">
                  <button
                    type="submit"
                    className="input-all-box btn-login input-outline"
                    disabled={loading}
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
                    {loading ? "Login..." : "Login"}
                  </button>
                </div>

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

export default Login;
