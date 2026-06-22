import React from "react";
import whatsapp_interface from "../../../assets/images/whatsapp-interface.png";
import whatsapp_features1 from "../../../assets/images/whatsapp-1.png";
import whatsapp_features2 from "../../../assets/images/whatsapp-2.png";
import whatsapp_features3 from "../../../assets/images/whatsapp-3.png";
import { Link } from "react-router-dom";
import "../../../styles/Responsive.css"


const WhatsappInterface = () => {
  return (
    
      <div className="py-4 px-4 overflow-auto" style={{height:"calc(100vh - 84px)"}}>
    
    <div className="whatsapp-interface d-flex flex-column justify-content-center align-items-center gap-5 overflow-y-auto">
      {/* WhatsApp Interface  Image */}
      <div className="d-flex flex-column justify-content-center align-items-center">
        <div className="text-center" style={{wordBreak:"break-all"}}>
          <h1
            style={{ fontFamily: "Inter", fontSize: "32px", fontWeight: "400" }}
          >
            Connect WhatsApp
          </h1>
          <p
            style={{
              fontFamily: "Inter",
              fontSize: "16px",
              fontWeight: "400",
              color: "#727681",
            }}
          >
            Connect Your WhatsApp for Instant Invoice Sharing & <br /> Seamless
            Communication
          </p>
        </div>
        <img src={whatsapp_interface} alt="whatsapp_interface" />
      </div>
      {/* WhatsApp Interface Features And LInk Button */}
      <div className="d-flex flex-column align-items-center justify-content-center gap-4">
        <div className="d-flex justify-content-center gap-5">
          <div
            className="whatsapp-features-info-container d-flex  gap-4"
            style={{ width:"100%",maxWidth: "400px" }}
          >
            <img
              src={whatsapp_features1}
              alt="whatsapp_features1"
              style={{ width: "100%" }}
            />
            <div>
              <h6
                className="mb-0"
                style={{
                  fontFamily: "Inter",
                  fontSize: "16px",
                  fontWeight: "400",
                }}
              >
                Instant Invoice Sharing
              </h6>
              <p
                className="mb-0"
                style={{
                  fontFamily: "Inter",
                  fontSize: "16px",
                  fontWeight: "400",
                  color: "#727681",
                }}
              >
                Send invoices, orders, and receipts directly via WhatsApp for
                faster, hassle-free communication with customers.
              </p>
            </div>
          </div>
          <div
            className="whatsapp-features-info-container d-flex  gap-4"
            style={{ width:"100%",maxWidth: "400px" }}
          >
            <img
              src={whatsapp_features2}
              alt="whatsapp_features1"
              style={{ width: "100%" }}
            />
            <div>
              <h6
                className="mb-0"
                style={{
                  fontFamily: "Inter",
                  fontSize: "16px",
                  fontWeight: "400",
                }}
              >
                Instant Invoice Sharing
              </h6>
              <p
                className="mb-0"
                style={{
                  fontFamily: "Inter",
                  fontSize: "16px",
                  fontWeight: "400",
                  color: "#727681",
                }}
              >
                Send invoices, orders, and receipts directly via WhatsApp for
                faster, hassle-free communication with customers.
              </p>
            </div>
          </div>
          <div
            className="whatsapp-features-info-container d-flex  gap-4"
            style={{ width:"100%",maxWidth: "400px" }}
          >
            <img
              src={whatsapp_features3}
              alt="whatsapp_features1"
              style={{ width: "100%" }}
            />
            <div>
              <h6
                className="mb-0"
                style={{
                  fontFamily: "Inter",
                  fontSize: "16px",
                  fontWeight: "400",
                }}
              >
                Instant Invoice Sharing
              </h6>
              <p
                className="mb-0"
                style={{
                  fontFamily: "Inter",
                  fontSize: "16px",
                  fontWeight: "400",
                  color: "#727681",
                }}
              >
                Send invoices, orders, and receipts directly via WhatsApp for
                faster, hassle-free communication with customers.
              </p>
            </div>
          </div>
        </div>
        <button
          className="button-hover"
          style={{
            backgroundColor: "#1F7FFF",
            borderRadius: "8px",
            padding: "8px 16px",
            border: "none",
           
            fontFamily: "Inter",
            fontSize: "16px",
            fontWeight: "500",
          }}
        >
          <Link to="/whatsapp-scanner" style={{ color: "white", textDecoration:"none"}}>Link My WhatsApp</Link>
        </button>
      </div>
    </div>
      </div>
   
  );
};

export default WhatsappInterface;
