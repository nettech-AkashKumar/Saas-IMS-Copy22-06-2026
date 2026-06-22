import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../../styles/OtpVerification.css";
import TwoStepImage from "../../assets/images/twostep.png";
import Munc from "../../assets/img/logo/munclogotm.png";
import api from "../../pages/config/axiosInstance";
import Cookies from "js-cookie";
import { useAuth } from "../auth/AuthContext";

const OtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [timer, setTimer] = useState(30);
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const inputRefs = useRef([]);
  const { setUser } = useAuth();
  //Dynamic years copyright
  const currentYear = new Date().getFullYear();

  // CRITICAL FIX: Wait for cookies to be available
  useEffect(() => {
    // console.log("OTP PAGE MOUNTED - Checking session...");

    // Give cookies time to be set (they come from backend)
    const checkSession = () => {
      const hasOtpCookie = Cookies.get("otpPending") === "true";
      const hasEmailCookie = Cookies.get("otpEmail");
      const hasUserIdCookie = Cookies.get("userId");
      const hasLocationState = location.state?.fromLogin;

      // console.log("Session check:", {
      //   hasOtpCookie,
      //   hasEmailCookie,
      //   hasUserIdCookie,
      //   hasLocationState,
      //   allCookies: document.cookie
      // });

      // If ANY validation method passes, stay on page
      if (hasOtpCookie || hasEmailCookie || hasLocationState) {
        // console.log("✅ OTP session validated");
        setIsLoading(false);
        return;
      }

      // No session found - give it a few more tries
      console.log("⚠️ No session yet, will check again in 500ms");
      setTimeout(checkSession, 500);
    };

    // Initial check after a short delay
    setTimeout(checkSession, 100);
  }, [navigate, location]);

  // Timer effect
  useEffect(() => {
    if (!isLoading && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isLoading, timer]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/, "");
    const newOtp = [...otp];
    newOtp[index] = value ? value.slice(-1) : "";
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      // Get email from cookies or location state
      const email = Cookies.get("otpEmail") || location.state?.email;
      const rememberMe = location.state?.rememberMe || false;
      const subdomain = Cookies.get("subdomain") || location.state?.subdomain;
      const dbName = Cookies.get("dbName") || location.state?.dbName;

      if (!email) {
        toast.error("Email not found. Please login again.");
        navigate("/login");
        return;
      }
      //  console.log("Verifying OTP for:", { email, otp: otpCode });

      const requestData = {
        email: email,
        otp: otpCode,
        deviceId: Cookies.get("deviceId"),
        deviceInfo: navigator.userAgent,
        rememberMe: rememberMe,
        subdomain: subdomain,
        dbName: dbName,
      };

      const res = await api.post(`/api/auth/verify_otp`, requestData, {
        withCredentials: true,
      });

      if (res?.data?.success) {
        toast.success("OTP verified successfully!");

        const authToken = res?.data?.token || "";
        const resolvedUser = res?.data?.user;

        // ✅ Store tenant info if present
        if (subdomain && dbName) {
          localStorage.setItem("subdomain", subdomain);
          localStorage.setItem("dbName", dbName);
          if (authToken) {
            localStorage.setItem("token", authToken);
          }
          localStorage.removeItem("adminToken");
        } else {
          // Super admin
          if (authToken) {
            localStorage.setItem("adminToken", authToken);
          }
          localStorage.removeItem("token");
        }

        if (resolvedUser) {
          setUser(resolvedUser);
        } else {
          const userDataCookie = Cookies.get("userData");
          if (userDataCookie) {
            const userData = JSON.parse(userDataCookie);
            setUser(userData);
          }
        }

        // Clear OTP cookies
        Cookies.remove("otpPending", { path: "/" });
        Cookies.remove("otpEmail", { path: "/" });
        Cookies.remove("subdomain", { path: "/" });
        Cookies.remove("dbName", { path: "/" });

        // ✅ Navigate based on login type
        const isDashboardOnly =
          !subdomain && !dbName ? "/admin/dashboard" : "/dashboard";
        navigate(isDashboardOnly, { replace: true });
      } else {
        toast.error("Invalid OTP");
        setOtp(new Array(6).fill(""));
        inputRefs.current[0].focus();
      }
    } catch (error) {
      console.error("OTP verification error:", error);

      if (error.response?.status === 401 || error.response?.status === 400) {
        toast.error(
          error.response?.data?.message ||
            "OTP session expired. Please login again.",
        );
        Cookies.remove("otpPending", { path: "/" });
        Cookies.remove("otpEmail", { path: "/" });
        navigate("/login");
        return;
      }

      toast.error(error.response?.data?.message || "OTP verification failed");
      setOtp(new Array(6).fill(""));
      inputRefs.current[0].focus();
    }
  };
  const logDeviceSession = async (userId) => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await api.post(
            `/api/auth/log-device`,
            { userId, latitude, longitude },
            { withCredentials: true, skipAuthInterceptor: true },
          );
        } catch (error) {
          // console.error("Device log failed:", error);
          toast.error(
            error?.response?.data?.displayMessage ||
              error?.response?.data?.message ||
              error?.message ||
              "Failed to log device session",
          );
        }
      },
      (error) => {
        // console.error("Geolocation error:", error);
      },
    );
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    try {
      // Get email from cookies or location state
      const email = Cookies.get("otpEmail") || location.state?.email;

      if (!email) {
        toast.error("Email not found. Please login again.");
        return;
      }

      const res = await api.post(`/api/auth/resend-otp`, { email });
      toast.success(res.data.message || "OTP resent successfully");
      setOtp(new Array(6).fill(""));
      inputRefs.current[0].focus();
      setTimer(30);
    } catch (error) {
      // toast.error(error.response?.data?.message || "Failed to resend OTP");
      toast.error(
        error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to resend OTP",
      );
      console.error("Resend OTP error:", error);
    } finally {
      setIsResending(false);
    }
  };

  // Show loading screen
  if (isLoading) {
    return (
      <div className="twostep-page">
        <div className="twostep-left">
          <div
            className="twostep-box"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "400px",
              textAlign: "center",
            }}
          >
            <h2>Loading OTP Verification...</h2>
            <p>Please wait while we verify your session</p>
            <div style={{ marginTop: "20px" }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main OTP form
  return (
    <div className="twostep-page">
      <div className="twostep-left">
        <div className="twostep-box">
          <p>
            <img src={Munc} alt="mnc" />
          </p>
          <h2 className="twostep-title">2 Step Verification</h2>
          <p className="twostep-subtitle">
            Please enter the OTP received to confirm your account ownership.
          </p>

          <form onSubmit={handleVerifyOtp} className="twostep-form">
            <div className="twostep-otp-boxes">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="twostep-otp-input"
                />
              ))}
            </div>

            <div className="twostep-resend">
              {timer > 0 ? (
                <p className="resend-text">
                  Resend OTP in 00:{timer < 10 ? `0${timer}` : timer}s
                </p>
              ) : (
                <p
                  className="resend-action"
                  onClick={!isResending ? handleResendOtp : null}
                >
                  Didn't get the OTP?{" "}
                  <span>{isResending ? "Resending..." : "Resend OTP"}</span>
                </p>
              )}
            </div>

            <button type="submit" className="twostep-submit-btn">
              Submit
            </button>
          </form>
          <p className="twostep-footer">Copyright © {currentYear} Munches</p>
        </div>
      </div>

      <div className="twostep-right">
        <img
          src={TwoStepImage}
          alt="OTP illustration"
          className="twostep-image"
        />
      </div>
    </div>
  );
};

export default OtpVerification;
