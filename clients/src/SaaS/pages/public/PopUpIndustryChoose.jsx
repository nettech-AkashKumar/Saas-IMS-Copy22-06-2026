import React, { useState } from "react";
import account_img from "../../assets/Image/munc-logo.png";
import retailECommerce from "../../assets/Image/ind1.png";
import Food from "../../assets/Image/ind2.png";
import Healthcare from "../../assets/Image/ind3.png";
import Construction from "../../assets/Image/ind4.png";
import Cosmetics from "../../assets/Image/ind5.png";
import { FaRegCircleCheck } from "react-icons/fa6";
import { CiSearch } from "react-icons/ci";

const PopUpIndustryChoose = ({ setshowSelectIndustry, selectIndustry }) => {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const industries = [
    {
      id: 1,
      name: "Retail & E-Commerce",
      desc: "Gift Items, Kitchenware, Furniture sets etc.",
      icon: retailECommerce,
    },
    {
      id: 2,
      name: "Food & Beverage",
      desc: "Packaged snacks, Dairy, Vegetables etc.",
      icon: Food,
    },
    {
      id: 3,
      name: "Healthcare & Pharmaceuticals",
      desc: "Medicines, Equipment, Supplements etc.",
      icon: Healthcare,
    },
    {
      id: 4,
      name: "Construction & Real Estate",
      desc: "Materials, Tools, Property etc.",
      icon: Construction,
    },
    {
      id: 5,
      name: "Cosmetics & Personal Care",
      desc: "Beauty, Hygiene, Grooming products etc.",
      icon: Cosmetics,
    },
  ];

  const filteredIndustries = industries.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()),
  );

  const handleClick = () => {
    if (selected == null) {
      alert("Please select an industry");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (selectIndustry) {
        const industryObj = industries.find((item) => item.id === selected);
        selectIndustry(industryObj ? industryObj.name : "");
      }
      setshowSelectIndustry(false);
    }, 500);
  };
  return (
    <div
      onClick={() => setshowSelectIndustry(false)}
      style={{
        position: "absolute",
        backgroundColor: "rgba(0,0,0,0.27)",
        backdropFilter: "blur(1px)",
        width: "100%",
        zIndex: "9999",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        top: "0",
        bottom: "0",
      }}
    >
      {/* <div className="login-all-pages d-flex flex-column align-items-center justify-content-center" style={{ position:"absolute",zIndex:"9999", top:"0", bottom:"0",}}> */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="login-form"
        style={{
          //   width: "370px",
          fontFamily: "Inter, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          backgroundColor: "white",
          padding: "20px 20px",
          border: "1px solid #bcbcbc36",
          overflow: "auto",
          borderRadius: "8px",
          //   height:"400px"
          alignItems: "center",
        }}
      >
        {/* logo */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <img
            src={account_img}
            alt="account_img"
            style={{ maxWidth: "150px" }}
          />
        </div>
        <div style={{ fontFamily: '"Inter", sans-serif', textAlign: "center" }}>
          <h2 className="login-headline-content" style={{ fontSize: "20px" }}>
            Select Industry
          </h2>
        </div>
        {/* 🔍 Search box */}
        <div
          className="nav-search-input d-flex align-items-center gap-1"
          style={{
            backgroundColor: "#FCFCFC",
            border: "1px solid #CFCFCF",
            width: "100%",
            padding: "5px 16px",
            borderRadius: "8px",
          }}
        >
          <CiSearch size={20} style={{ color: "#6C748C" }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              backgroundColor: "transparent",
            }}
          />
        </div>

        {/* 📋 Industry List */}
        <div>
          {filteredIndustries.map((item) => (
            <div
              className="sign-in-input"
              key={item.id}
              onClick={() => setSelected(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                border: "1px solid #EAEAEA",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "10px",
                cursor: "pointer",
                backgroundColor:
                  selected === item.id ? "rgba(0,132,255,0.05)" : "#fff",
                transition: "all 0.2s ease",
                boxShadow:
                  selected === item.id ? "0 0 0 2px #0084FF33" : "none",
              }}
            >
              <img
                src={item.icon}
                alt={item.name}
                style={{
                  width: "28px",
                  height: "28px",
                  objectFit: "contain",
                }}
              />

              <div style={{ flexGrow: 1 }}>
                <div
                  className="select-title-icon"
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#333",
                  }}
                >
                  {item.name}
                </div>
                <div
                  className="select-title-icon"
                  style={{ fontSize: "14px", color: "#888" }}
                >
                  {item.desc}
                </div>
              </div>

              {/* ✅ Check Circle */}
              {selected === item.id ? (
                <FaRegCircleCheck size={28} color="#0084FF" />
              ) : (
                <div
                  className="select-circle"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    border: "2px solid #ccc",
                    backgroundColor: "#fff",
                    boxSizing: "border-box",
                    transition: "all 0.2s ease",
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* 🟦 Continue Button */}
        <button
          className="create-continue-btn"
          onClick={handleClick}
          style={{
            backgroundColor: "#0084FF",
            borderRadius: "8px",
            width: "100%",
            padding: "12px 16px",
            border: "none",
            color: "white",
            fontFamily: '"Inter", sans-serif',
            fontSize: "16px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            position: "relative",
            transition: "background-color 0.3s ease",
            opacity: loading ? 0.8 : 1,
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              Loading
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  border: "3px solid rgba(255, 255, 255, 0.5)",
                  borderTop: "3px solid #fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              ></div>
            </>
          ) : (
            "Continue"
          )}
          <style>
            {`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}
          </style>
        </button>
        {/* </div> */}
      </div>
    </div>
  );
};

export default PopUpIndustryChoose;
