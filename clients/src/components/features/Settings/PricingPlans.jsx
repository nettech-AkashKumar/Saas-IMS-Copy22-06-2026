import React, { useState } from "react";
import { BsCheckLg } from "react-icons/bs";
import { FaArrowDown } from "react-icons/fa6";
// import medley from "../../../assets/images/medley.png";
// import netario from "../../../assets/images/netario.png";
// import upbs from "../../../assets/images/upbs-logo.png";

const PricingPlans = () => {
  const [planType, setPlanType] = useState("monthly");
  return (
    <div>
      <div
        className="setting-user-profile-container"
        style={{
          fontFamily: "Inter, sans-serif",
          backgroundColor: "#fff",
          // overflow: "auto",
          // height: "100vh"
        }}
      >
        <div
          style={{
            marginBottom: "32px",
            fontSize: "16px",
            fontWeight: "500",
            color: "#0E101A",
          }}
        >
          Pricing & Plans
        </div>
        <div
          style={{
            overflow: "auto",
            height: "calc(100vh - 32vh)",
            width: "100%",
          }}
        >
          {/* Button and Title header */}
          <div
            className="text-center"
            style={{ fontFamily: "Inter", marginBottom: "20px" }}
          >
            <button
              style={{
                backgroundColor: "#DBEEFF",
                color: "#0056F5",
                borderRadius: "51px",
                padding: "8px 12px",
                border: "none",
                width: "149px",
                textAlign: "center",
                fontSize: "12px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
            >
              Unlock Your Potential
            </button>
            <div>
              <b
                style={{
                  color: "#000000",
                  fontWeight: "600",
                  fontSize: "36px",
                }}
              >
                Affordable Pricing for Every Business
              </b>
              <p
                style={{
                  color: "#626D93",
                  fontWeight: "400",
                  fontSize: "16px",
                }}
              >
                Streamline your inventory with our powerful tools. Scale up or
                down at any <br /> time. No hidden setup fees.
              </p>
            </div>
          </div>
          {/* Select Plan section */}
          {/* select plan btn  header*/}
          <div
            style={{
              fontFamily: "Inter",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <select name="" id="" style={{ border: "1px solid #E9E9E9" }}>
              <option value="">INR</option>
              <option value="">$</option>
              <option value="">%</option>
            </select>
            <div className="d-flex align-items-center gap-1">
              <p
                style={{
                  color: "#0056F5",
                  fontSize: "14px",
                  fontWeight: "400",
                  marginBottom: "0",
                }}
              >
                Save 15% on Yearly Plan
              </p>
              <div
                style={{
                  border: "1px solid #E9E9E9",
                  borderRadius: "68px",
                  width: "167px",
                  height: "34px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                }}
              >
                <button
                  onClick={() => setPlanType("monthly")}
                  style={{
                    borderRadius: "16px",
                    textAlign: "center",
                    backgroundColor:
                      planType === "monthly" ? "#0056F5" : "transparent",
                    color: planType === "monthly" ? "#fff" : "#000",
                    border: "none",
                    padding: "2px 8px",
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setPlanType("annually")}
                  style={{
                    borderRadius: "16px",
                    textAlign: "center",
                    border: "none",
                    backgroundColor:
                      planType === "annually" ? "#0056F5" : "transparent",
                    color: planType === "annually" ? "#fff" : "#000",
                    padding: "2px 8px",
                  }}
                >
                  Annually
                </button>
              </div>
            </div>
          </div>
          {/* Plan Section */}
          <div
            style={{
              fontFamily: "Inter",
              //  overflowY:"auto",
              // height: "calc(100vh - 78vh)",
              marginTop: "40px",
              display: "flex",
              justifyContent: "space-between",
              // gap: "24px",
            }}
          >
            {/* Free plan card */}
            <div
              style={{
                maxWidth: "240px",
                height: "524px",
                border: "1px solid #E9E9E9",
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div className="d-flex flex-column">
                <span
                  style={{
                    color: "#000000",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  Free
                </span>
                <span
                  style={{
                    color: "#626D93",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Free for 5 Days
                </span>
              </div>
              <div
                style={{
                  color: "#000000",
                  fontSize: "32px",
                  fontWeight: "600",
                }}
              >
                ₹0{" "}
                <span
                  style={{
                    color: "#626D93",
                    fontWeight: "400",
                    fontSize: "12px",
                  }}
                >
                  Month
                </span>
              </div>
              <button
                style={{
                  backgroundColor: "#0056F5",
                  width: "200px",
                  borderRadius: "4px",
                  padding: "8px",
                  border: "none",
                  color: "white",
                }}
              >
                Start 5 Days Trial
              </button>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  fontFamily: "Outfit",
                  filter: "blur(3px)",
                }}
              >
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  All Free Features:
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Add Products
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Manage 1 Inventory
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Inventory Overview
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Invoices
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Custom Invoice Templates
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Customers
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Credit Note
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  19 More
                  <FaArrowDown color="#0056F5" />
                </span>
              </div>
            </div>
            {/* Standard plan card */}
            <div
              style={{
                maxWidth: "240px",
                height: "524px",
                border: "1px solid #E9E9E9",
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div className="d-flex flex-column">
                <span
                  style={{
                    color: "#000000",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  Standard
                </span>
                <span
                  style={{
                    color: "#626D93",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Best For Small Business
                </span>
              </div>
              <div
                style={{
                  color: "#000000",
                  fontSize: "32px",
                  fontWeight: "600",
                }}
              >
                ₹219{" "}
                <span
                  style={{
                    color: "#626D93",
                    fontWeight: "400",
                    fontSize: "12px",
                  }}
                >
                  Month
                </span>
              </div>
              <button
                style={{
                  backgroundColor: "#0056F5",
                  width: "200px",
                  borderRadius: "4px",
                  padding: "8px",
                  border: "none",
                  color: "white",
                }}
              >
                Get Started
              </button>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  fontFamily: "Outfit",
                  filter: "blur(3px)",
                }}
              >
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  All Free Features:
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" />
                  Add Products
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Inventory Overview
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" />
                  Create Invoices
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Invoices
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Custom Invoice Templates
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Customers
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Credit Note
                </span>
              </div>
            </div>
            {/* Pro plan card */}
            <div
              style={{
                maxWidth: "240px",
                height: "524px",
                border: "2px solid #0056F5",
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                position: "relative",
                overflow: "visible",
                zIndex: 1,
              }}
            >
              <button
                style={{
                  backgroundColor: "#0056F5",
                  borderRadius: "16px",
                  border: "none",
                  padding: "6px 10px",
                  color: "white",
                  width: "108px",
                  position: "absolute",
                  zIndex: 999999,
                  top: "-12px",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                Most Popular
              </button>
              <div className="d-flex flex-column">
                <span
                  style={{
                    color: "#000000",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  Pro
                </span>
                <span
                  style={{
                    color: "#626D93",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Best For Growing Business
                </span>
              </div>
              <div
                style={{
                  color: "#000000",
                  fontSize: "32px",
                  fontWeight: "600",
                }}
              >
                ₹339{" "}
                <span
                  style={{
                    color: "#626D93",
                    fontWeight: "400",
                    fontSize: "12px",
                  }}
                >
                  Month
                </span>
              </div>
              <button
                style={{
                  backgroundColor: "#0056F5",
                  width: "200px",
                  borderRadius: "4px",
                  padding: "8px",
                  border: "none",
                  color: "white",
                }}
              >
                Get Started
              </button>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  fontFamily: "Outfit",
                  filter: "blur(3px)",
                }}
              >
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  All Free Features:
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" />
                  Add Products
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Inventory Overview
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" />
                  Create Invoices
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Invoices
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Custom Invoice Templates
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Customers
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Credit Note
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Credit Note
                </span>
              </div>
            </div>
            {/* Enterprises plan card */}
            <div
              style={{
                maxWidth: "240px",
                height: "524px",
                border: "1px solid #E9E9E9",
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div className="d-flex flex-column">
                <span
                  style={{
                    color: "#000000",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  Enterprise
                </span>
                <span
                  style={{
                    color: "#626D93",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Your features, your rules. Designed your way.
                </span>
              </div>
              <div
                style={{
                  color: "#000000",
                  fontSize: "32px",
                  fontWeight: "600",
                }}
              >
                Custom{" "}
                <span
                  style={{
                    color: "#626D93",
                    fontWeight: "400",
                    fontSize: "12px",
                  }}
                >
                  Month
                </span>
              </div>
              <button
                style={{
                  backgroundColor: "#0056F5",
                  width: "200px",
                  borderRadius: "4px",
                  padding: "8px",
                  border: "none",
                  color: "white",
                }}
              >
                Contact Team
              </button>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  fontFamily: "Outfit",
                  filter: "blur(3px)",
                }}
              >
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "500",
                    fontSize: "14px",
                  }}
                >
                  All Free Features:
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" />
                  Add Products
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Inventory Overview
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" />
                  Create Invoices
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Invoices
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Custom Invoice Templates
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Customers
                </span>
                <span
                  style={{
                    color: "#000000",
                    fontWeight: "400",
                    fontSize: "14px",
                  }}
                >
                  <BsCheckLg color="#0056F5" /> Create Credit Note
                </span>
              </div>
            </div>
          </div>
          {/*Footer content  */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
              marginTop: "20px",
            }}
          >
            <label
              htmlFor=""
              style={{
                color: "#000000",
                fontSize: "14px",
                fontFamily: "Inter",
                fontWeight: "400",
              }}
            >
              Trusted by innovative companies worldwide
            </label>
            <div>
              <img src={medley} alt="medley" />
              <img src={netario} alt="netario" />
              <img src={upbs} alt="upbs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPlans;
