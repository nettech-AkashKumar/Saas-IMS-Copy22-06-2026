import React from 'react'
import login_background from "../../assets/Image/munc-dahsboard-img.png";
import munc_logo from "../../assets/Image/munc-logo.png";
import { Link } from "react-router-dom";
import "../../assets/css/Responsive.css";

const SuccessMessage = () => {
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

            {/* suyccess */}
            <div className="register-account-head-title text-center">
              <h3
                style={{
                  fontSize: "clamp(14px,2vw,20px)",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                🎉 Registration Successful
              </h3>
              <p
                style={{
                  fontSize: "clamp(12px,2vw,14px)",
                  color: "#1E1E1E",
                  fontWeight: "400",
                }}
              >
                Thanks for signing up! 🥳
                <br />
                Your account is under verification process. You will receive email after activation, then you can login.
                <br />
                Your Company Website: <span style={{ color: "green" }}>www.netario.munc.com</span>
              </p>
            </div>

            <Link to="/login">
              <button className='input-all-box' style={{
                width: "240px",
                border: "1px solid #0084FF",
                color: "#0084FF",
                padding: "12px 16px",
                borderRadius: "8px",
                fontSize: "clamp(14px,2vw,16px)",
                fontWeight: "500",
                backgroundColor: "transparent"
              }}>Thanks For Choosing Us !</button>
            </Link>

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
          <img src={login_background} alt="login_background" style={{ width: "100%", maxWidth: "482px" }} />
        </div>
      </div>
    </div>
  )
}

export default SuccessMessage