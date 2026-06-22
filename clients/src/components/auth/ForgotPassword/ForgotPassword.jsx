import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import MuncLogo from "../../../assets/img/logo/munclogotm.png";
import emailBg from "../../../assets/images/Email.jpg";
import otpBg from "../../../assets/images/OTP.jpg";
import { MdOutlineEmail } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../pages/config/axiosInstance";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resend, setResend] = useState(false);
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const img1 = new Image();
    img1.src = emailBg;
  }, []);

  useEffect(() => {
    const img2 = new Image();
    img2.src = otpBg;
  }, []);

  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleOtpChange = (e, index) => {
    let value = e.target.value.replace(/\D/, ""); // allow only digits
    if (value.length > 1) value = value[0]; // only 1 digit per box

    const otpArray = otp.split("");
    otpArray[index] = value;
    const newOtp = otpArray.join("");
    setOtp(newOtp);

    // auto focus next input
    if (value && e.target.nextSibling) {
      e.target.nextSibling.focus();
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Email is required");
      return;
    }

    try {
      setLoading(true);

      const verifyRes = await api.post("/api/forgot/verify_email", { email });
      const idFromServer = verifyRes?.data?.userId;
      if (!idFromServer) {
        toast.error("Unable to verify email");
        return;
      }

      setUserId(idFromServer);

      await api.post(`/api/forgot/send_otp/${idFromServer}`);

      toast.success("OTP sent to your email");
      setStep(2);
      setTimer(180);
      setCanResend(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userId) {
      toast.error("User session expired, please try again");
      setStep(1);
      return;
    }

    try {
      setResend(true);
      await api.post(`/api/forgot/send_otp/${userId}`);
      toast.success("OTP resent successfully");
      setTimer(180);
      setCanResend(false);
      setOtp(""); // Clear OTP input
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
      setResend(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("Please verify your email first");
      return;
    }

    if (!email) {
      toast.error("Email is required");
      return;
    }

    if (!otp || otp.length !== 4) {
      toast.error("Please enter the 4-digit OTP");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/forgot/verify_otp", {
        userId,
        otp,
      });

      toast.success("OTP verified successfully");
      navigate("/reset-password");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="account-content">
        <div className="login-wrapper bg-img" style={{
          backgroundImage: step === 1 ? `url(${emailBg})` : `url(${otpBg})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
          <div className="login-content authent-content" style={{ backgroundColor: "white" }}>
            {step === 1 ? (
              <form onSubmit={handleRequestOtp} style={{ display: "flex", justifyContent: "center", fontFamily: "Inter" }}>
                <div className="login-userset">

                  {/* logo */}
                  <div className="login-logo logo-normal d-flex justify-content-center">
                    <img src={MuncLogo} alt="img" style={{ maxWidth: "400px", width: "100%", }} />
                  </div>

                  {/* title */}
                  <div className="login-userheading text-center">
                    <h3 style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#000000",
                    }}>
                      Forgot password?
                    </h3>
                    <p style={{
                      fontSize: "14px",
                      color: "#1E1E1E",
                      fontWeight: "400",
                    }}>
                      verify yourself to change your password.
                    </p>
                  </div>

                  {/* input email */}
                  <div className="mb-3">
                    <label className="form-label">Email <span className="text-danger"> *</span></label>
                    <div className="input-group">
                      <div className="input-placeholder input-outline input-all-box" style={{
                        width: "100%",
                        maxWidth: "400px",
                        border: "1px solid #DEDEDE",
                        backgroundColor: "#FBFBFB",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        outline: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <input
                          type="email"
                          className="input-placeholder"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          style={{ border: "none", outline: "none", background: "none", width: "100%", height: "100%" }}
                        />
                        <span className="">
                          <MdOutlineEmail />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* send otp button */}
                  <div className="form-login">
                    <button
                      type="submit"
                      disabled={loading}
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
                      }}>
                      {loading ? "Please wait..." : "Send OTP"}
                    </button>
                  </div>

                  {/* link for other options */}
                  <div className="signinform text-center">
                    <h4>Already have an account ? <Link to="/login" className="hover-a">Sign In Instead</Link></h4>
                  </div>

                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="digit-group" style={{ display: "flex", justifyContent: "center", fontFamily: "Inter" }}>
                <div className="login-userset">

                  {/* image */}
                  <div className="login-logo logo-normal d-flex justify-content-center">
                    <img src={MuncLogo} alt="img" style={{ maxWidth: "400px", width: "100%", }} />
                  </div>

                  {/* title */}
                  <div className="login-userheading text-center">
                    <h3 style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#000000",
                    }}>
                      Enter OTP
                    </h3>
                    <p style={{
                      fontSize: "14px",
                      color: "#1E1E1E",
                      fontWeight: "400",
                    }}>
                      Please enter 4-digit OTP received on your email.
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="otp-verification-form">
                    <div className="" style={{ gap: "0px", display: "flex", justifyContent: "space-around", alignItems: "center", marginBottom: "25px" }}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <input
                          key={i}
                          type="text"
                          // className="rounded mx-1 w-25 py-2 text-center fs-20 fw-bold"
                          maxLength={1}
                          value={otp[i] || ""}
                          onChange={(e) => handleOtpChange(e, i)}
                          style={{
                            width: "70px",
                            height: "60px",
                            fontSize: "22px",
                            textAlign: "center",
                            border: "1px solid #ccc",
                            borderRadius: "8px",
                            outline: "none",
                            transition: "border 0.3s",
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* verify button */}
                  <div className="form-login" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', }}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="input-all-box"
                      style={{
                        backgroundColor: "#0084FF",
                        padding: "12px 16px",
                        borderRadius: "8px",
                        width: "100%",
                        maxWidth: "200px",
                        border: "none",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "500",
                      }}>
                      {loading ? "Verifying..." : "Verify"}
                    </button>
                  </div>

                  {/* opt expire timer */}
                  <div className="text-center mt-3">
                    {canResend ? (
                      <p style={{ fontSize: "14px", color: "#1E1E1E" }}>
                        Didn't receive the OTP?{" "}
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={resend}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#0084FF",
                            cursor: "pointer",
                            fontWeight: "600",
                            padding: 0,
                          }}
                        >
                          {resend ? 'Sending...' : 'Resend OTP'}
                        </button>
                      </p>
                    ) : (
                      <p style={{ fontSize: "14px", color: "#1E1E1E" }}>
                        Resend OTP in <span style={{ fontWeight: "600", color: "#0084FF" }}>{timer}s</span>
                      </p>
                    )}
                  </div>

                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
