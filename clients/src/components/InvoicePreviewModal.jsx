import React from "react";

const InvoicePreviewModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.4)",
          display: "flex",
          justifyContent: "center", 
          alignItems: "center",
          zIndex: 9999,
        }}
      >
       <div
          style={{
            width: "35%",
            height: "90%",
            paddingTop: 18.37,
            paddingRight: 27.37,
            paddingBottom: 27.37,
            paddingLeft: 27.37,
            background: "#F3F5F6",
            boxShadow:
              "-0.757650554px -0.757650554px 0.68px rgba(0,0,0,0.10) inset",
            borderRadius: 12.12,
            outline: "0.76px #EAEAEA solid",
            outlineOffset: "-0.76px",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
         <div
            style={{
              paddingBottom: 0,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "600",
                color: "#1E293B",
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Preview
            </h3>

            {/* Close button */}
            <div
            style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: "#ffff",
                border: "1px solid #E2E8F0",
                color: "#bc3336",
                fontSize: "20px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
            <button
              onClick={onClose}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: "#ffff",
                border: "1px solid #bc3336",
                color: "#bc3336",
                fontSize: "18px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign:"center"
              }}
            >
              ×
            </button>
            </div>
          </div>

          <hr style={{color:"#c3c4c7ff", margin:"10px" }} />
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              left: 0,
              top: 0,
              background: "var(--White-White-1, white)",
              boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
              padding: "10px 30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: "13px" }}>
                <b>Invoice no. - </b>
                <span style={{ color: "#727681", fontWeight: "500" }}>
                  INV001
                </span>
              </div>
              <div style={{ fontSize: "13px" }}>
                <b>Date - </b>
                <span style={{ color: "#727681", fontWeight: "500" }}>
                  23 Oct 2025
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "end",
              }}
            >
              <div style={{ fontSize: "13px" }}>
                <b>Due Date - </b>
                <span style={{ color: "#727681", fontWeight: "500" }}>
                  23 Oct 2025
                </span>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: 0.76,
                left: 31.77,
                marginTop: "5px",
                background: "var(--White-Stroke, #EAEAEA)",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "start",
                marginTop: "30px",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  width: "50%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <b>Customer Name</b>
                <span style={{ color: "#727681", fontWeight: "500" }}>
                  Alok Ranjan
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  width: "50%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <b>Customer Phone No.</b>
                <span style={{ color: "#727681", fontWeight: "500" }}>
                  9876543210
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "start",
                marginTop: "25px",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  width: "80%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <b>Customer Address</b>
                <span style={{ color: "#727681", fontWeight: "500" }}>
                  Sector 45, Faridabad, Haryana 121010
                </span>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: 0.76,
                left: 31.77,
                marginTop: "15px",
                background: "var(--White-Stroke, #EAEAEA)",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "start",
                marginTop: "30px",
                width: "100%",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  width: "40%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <b style={{ color: "#727681", backgroundColor: "#b0b1b348" }}>
                  Item Name
                </b>
                <span style={{ fontWeight: "500", marginTop: "5px" }}>
                  H&M Regular Fit Men's{" "}
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  width: "15%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <b style={{ color: "#727681", backgroundColor: "#b0b1b348" }}>
                  QTY
                </b>
                <span style={{ fontWeight: "500", marginTop: "5px" }}>02</span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  width: "15%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <b style={{ color: "#727681", backgroundColor: "#b0b1b348" }}>
                  Price
                </b>
                <span style={{ fontWeight: "500", marginTop: "5px" }}>
                  ₹1,600
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  width: "15%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <b style={{ color: "#727681", backgroundColor: "#b0b1b348" }}>
                  Tax
                </b>
                <span style={{ fontWeight: "500", marginTop: "5px" }}>
                  ₹295.2
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  width: "15%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <b style={{ color: "#727681", backgroundColor: "#b0b1b348" }}>
                  Amount
                </b>
                <span style={{ fontWeight: "500", marginTop: "5px" }}>
                  ₹1,934.2
                </span>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: 0.76,
                left: 31.77,
                marginTop: "15px",
                background: "var(--White-Stroke, #EAEAEA)",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "end",
                marginTop: "10px",
              }}
            >
              <div style={{ width: "50%" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                  }}
                >
                  <span>Subtotal</span>
                  <span>₹1,600</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                  }}
                >
                  <span>Taxes (%)</span>
                  <span>₹290.2</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#727681",
                    fontSize: "13px",
                  }}
                >
                  <span>Discount</span>
                  <span>XX</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#727681",
                    fontSize: "13px",
                  }}
                >
                  <span>Additional Charges</span>
                  <span>XX</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#727681",
                    fontSize: "13px",
                  }}
                >
                  <span>🪙 Shopping Points</span>
                  <span>XX</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: 0.76,
                    left: 31.77,
                    marginTop: "8px",
                    background: "var(--White-Stroke, #EAEAEA)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "15px",
                  }}
                >
                  <span>Total</span>
                  <span>₹1,930.2</span>
                </div>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                display: "flex",
                marginTop: "180px",
                bottom: "0px",
                justifyContent: "center",
                color: "var(--Black-Black, #0E101A)",
                fontSize: 10,
                fontFamily: "Poppins",
                fontStyle: "italic",
                fontWeight: "400",
                lineHeight: 5,
                wordWrap: "break-word",
              }}
            >
              Congratulations! You’ve earned 🪙 50 shopping points 🎉
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  );
};

export default InvoicePreviewModal;
