import React from "react";

const PosSortByModel = ({ close, value, onSelect, onClear }) => {
  const options = [
    { key: "name_asc", label: "Name (A - Z)" },
    { key: "name_desc", label: "Name (Z - A)" },
    { key: "price_low_high", label: "Price (Low - High)" },
    { key: "price_high_low", label: "Price (High - Low)" },
    { key: "recently_added", label: "Recently Added" },
    { key: "low_stock_first", label: "Low Stock First" },
    { key: "high_stock_first", label: "High Stock First" },
    { key: "nearest_expiry", label: "Nearest Expiry" },
    { key: "high_profit_margin", label: "High Profit Margin" },
    { key: "discounted_items", label: "Discounted Items" },
  ];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "180px",
        height: "auto",
        backgroundColor: "white",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.08),0px 10px 25px rgba(0, 0, 0, 0.12)",
        borderRadius: "8px",
        fontFamily: "Inter",
        border: "1px solid #A2A8B8",
        position: "absolute",
        zIndex: "9999",
        top: "43px",
        left: "0",
        padding: "8px",
        overflow: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ fontWeight: 600, color: "#0E101A" }}>Sort By :</span>
        <button
          onClick={() => {
            if (onClear) onClear();
            close();
          }}
          style={{
            backgroundColor: "#E5F0FF",
            border: "1px solid #1F7FFF",
            color: "#1F7FFF",
            fontSize: "12px",
            fontWeight: "500",
            borderRadius: "4px",
            padding: "2px 6px",
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: '10px' }}>
        {options.map((opt) => {
          const active = String(value || "") === opt.key;
          return (
            <div style={{ display: "flex", textAlign: "left", flexDirection: "column" }}>
              {opt.label === "Recently Added" ?
                <span style={{ borderTop: '1px solid #A2A8B8', padding: '4px', fontWeight: '400', fontSize: '12px', color: '#515457' }}>Sales & Activity (POS)</span>
                : opt.label === "High Profit Margin" ?
                  <span style={{ borderTop: '1px solid #A2A8B8', padding: '4px', fontWeight: '400', fontSize: '12px', color: '#515457' }}>Business Insights</span> : ""}
              <button
                key={opt.key}
                onClick={() => {
                  if (onSelect) onSelect(opt.key);
                  close();
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  backgroundColor: "#FFFFFF",
                  color: "#0E101A",
                  borderRadius: "8px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  fontSize: active ? "13px" : "12px",
                  fontWeight: active ? "600" : "400",
                }}
              >
                {active ? "•" : ""} {opt.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PosSortByModel;
