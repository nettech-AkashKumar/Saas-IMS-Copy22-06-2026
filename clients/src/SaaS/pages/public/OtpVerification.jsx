import React, { useRef, useState } from 'react'
import login_background from "../../assets/Image/CustomerDue.png";
import munc_logo from "../../assets/Image/munc-logo.png";
import { Link } from "react-router-dom";
import "../../assets/css/Responsive.css";  
  import { useNavigate } from "react-router-dom";


const OtpVerification = () => {


const navigate = useNavigate();

const verifyOtp = () => {
  const code = otp.join("");

  if (code.length !== 6) {
    return alert("Enter valid OTP");
  }

  navigate("/register-company-details");
};

    const [otp, setOtp] = useState(new Array(6).fill(""));
    const inputRefs = useRef([]);

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

    return (
        <div>
            <div className="d-flex" style={{ height: "100vh" }}>

                {/* otp-verification-container */}
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

                        {/* otp verification head title */}
                        <div className="register-account-head-title text-center">
                            <h3
                                style={{
                                    fontSize: "clamp(14px,2vw,20px)",
                                    fontWeight: "600",
                                    color: "#000000",
                                }}
                            >
                                Check Your Email
                            </h3>
                            <p
                                style={{
                                    fontSize: "clamp(12px,2vw,14px)",
                                    color: "#1E1E1E",
                                    fontWeight: "400",
                                }}
                            >
                                We’ve sent you an OTP to confirm your account.
                            </p>
                        </div>

                        {/* otp verification form */}
                        <form action="">
                            <div className="otp-verification-form">
                                <div className="" style={{ gap: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength="1"
                                            value={digit}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            onChange={(e) => handleChange(e, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            className=""
                                            style={{
                                                width: "50px",
                                                height: "55px",
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
                        </form>

                        {/* <Link to="/register-company-details">
                            <button className='input-all-box' style={{
                                width: "200px",
                                border: "1px solid #0084FF",
                                color: "#ffffff",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                fontSize: "clamp(14px,2vw,16px)",
                                fontWeight: "500",
                                backgroundColor: "#0084FF"
                            }}>Verify</button>
                        </Link> */}
                        {/* button */}
                        <button onClick={verifyOtp}>Verify</button>

                        <label
                            htmlFor=""
                            style={{
                                fontWeight: "400",
                                fontSize: "clamp(12px,2vw,14px)",
                                color: "black",
                                marginTop: "10px",
                            }}
                        >
                            {" "}
                            <Link to="/otp-verification" style={{ textDecoration: "none", color: "black" }}>Resend OTP ?</Link>
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
                    <img src={login_background} alt="login_background" style={{ width: "100%", maxWidth: "682px" }} />
                </div>
            </div>
        </div>
    )
}

export default OtpVerification