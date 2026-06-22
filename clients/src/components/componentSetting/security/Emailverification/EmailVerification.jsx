import React, { useState, useRef } from "react";
// import "./EmailVerification.css";
import axios from "axios";
import BASE_URL from "../../../../pages/config/config";
import api from "../../../../pages/config/axiosInstance";
import { useAuth } from "../../../auth/AuthContext";

const EmailVerification = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
// const token = localStorage.getItem("token");


  const handleSendOtp = async () => {
    try {
      await api.post("/api/email/send-otp",
         { newEmail: email ,

         });
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to send OTP");
    }
  };

  const handleOtpChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = value;
      setOtp(updatedOtp);

      if (value && index < 5) {
        otpRefs[index + 1].current.focus();
      }

    }
  };

  const handleResend = () => {
    handleSendOtp();
  };

  const handleSubmit = async () => {
    try {
      // const userData = JSON.parse(localStorage.getItem("user"));
      const userData = user
      const currentEmail = userData.email;
      const otpString = otp.join("");
      await api.post("/api/email/verify-otp", {
        currentEmail,
        newEmail: email,
        otp: otpString,
      });
      setStep(3);
      setTimeout(() => {
        onClose();
      }, 3000)
    } catch (err) {
      alert(err.response?.data?.error || "Failed to verify OTP");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pphnnemail-overlay">
      <div className="pphnnemail-card">
        {step === 1 && (
          <>
            <h3 className="eerrerhead">Email Verification</h3>
            <label className="enterlabeler">Enter Email</label>
            <input 
              className="pphnnemail-otp-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              className="pphnnemail-btn black"
              onClick={handleSendOtp}
              disabled={!email}
            >
              Send OTP
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h3 className="eerrerhead">Email Verification</h3>
            <label>Enter Email</label>
            <input className="pphnnemail-otp-input"
              type="email" value={email} disabled />

            <p className="pphnnemail-info">
              Enter Verification Code sent to your Email
            </p>
            <div className="pphnnemail-otp-boxes">
              {otp.map((digit, idx) => (
                <input
                  className="pphnnemail-otp-input"
                  key={idx}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={otpRefs[idx]}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                />
              ))}
            </div>
            <p className="pphnnemail-resend">
              Have not received the OTP?{" "}
              <span className="seededagain" onClick={handleResend}>Send again</span>
            </p>
            <button
              className="pphnnemail-btn black"
              onClick={handleSubmit}
              disabled={otp.join("").length !== 6}
            >
              Submit
            </button>
          </>
        )}

        {step === 3 && (
          <div className="pphnnemail-success">
            <p>Email verified successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;

