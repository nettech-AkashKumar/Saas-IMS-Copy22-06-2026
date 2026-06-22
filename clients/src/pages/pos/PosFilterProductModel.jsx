import React, { useMemo } from "react";
import { PiDotOutlineFill } from "react-icons/pi";

const PosFilterProductModel = ({
  close,
  categories,
  brands,
  filters,
  onChange,
  onApply,
  onClear,
  maxPrice,
}) => {
  const safeMaxPrice = useMemo(() => {
    const v = Number(maxPrice);
    if (!Number.isFinite(v) || v <= 0) return 0;
    return Math.ceil(v);
  }, [maxPrice]);

  const priceMin = Number(filters?.priceMin ?? 0);
  const priceMax =
    filters?.priceMax == null ? safeMaxPrice : Number(filters.priceMax);
  const safeMin = Math.max(0, Math.min(priceMin || 0, safeMaxPrice));
  const safeMax = Math.max(safeMin, Math.min(priceMax || 0, safeMaxPrice));

  const setFilter = (patch) => onChange({ ...filters, ...patch });

  const toggleInArray = (arr, value) => {
    const list = Array.isArray(arr) ? arr : [];
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  };

  return (
    <>
      <style>
        {`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          background: transparent;
        }

        input[type="range"]::-webkit-slider-runnable-track {
          background: transparent; /* hide track */
          height: 6px;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: blue;
          border-radius: 50%;
          margin-top: -4px;
          cursor: pointer;
        }

        input[type="range"]::-moz-range-track {
          background: transparent;
        }

        input[type="range"]::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: black;
          border-radius: 50%;
          cursor: pointer;
        }
        `}
      </style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "600px",
          height: "calc(100vh - 220px)",
          backgroundColor: "white",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.08),0px 10px 25px rgba(0, 0, 0, 0.12)",
          borderRadius: "8px",
          fontFamily: "Inter",
          border: "1px solid #A2A8B8",
          position: "absolute",
          zIndex: "9999",
          top: "43px",
          right: "0"
        }}
      >
        <header
          style={{
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #A2A8B8",
          }}
        >
          <span
            style={{ color: "#0E101A", fontSize: "14px", fontWeight: "500" }}
          >
            Filter Products
          </span>

          <div style={{ display: "flex", gap: "8px" }}>
            {/* apply */}
            <button
              onClick={() => {
                onApply(filters);
                close();
              }}
              style={{
                backgroundColor: "#1F7FFF",
                border: "1px solid #1F7FFF",
                color: "#fff",
                fontSize: "12px",
                fontWeight: "400",
                borderRadius: "4px",
                padding: "2px 6px",
              }}
            >
              Apply Filter
            </button>

            {/* clear all */}
            <button
              onClick={() => onClear()}
              style={{
                backgroundColor: "#E5F0FF",
                border: "1px solid #1F7FFF",
                color: "#1F7FFF",
                fontSize: "12px",
                fontWeight: "400",
                borderRadius: "4px",
                padding: "2px 6px",
              }}
            >
              Clear all
            </button>
          </div>
        </header>

        {/* Filter Container */}
        <div style={{ padding: "16px 16px", display: "flex", gap: "16px", overflow: "auto", height: "calc(100vh - 280px)" }}>

          {/* left */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Category */}
            <div
              style={{
                backgroundColor: "#F8F9FB",
                borderRadius: "8px",
                padding: "8px",
                width: "270px",
                boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.25)",
                textAlign: 'left',
              }}
            >
              <label
                htmlFor=""
                style={{
                  color: "#727681",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Category
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  padding: "10px 15px",
                }}
              >
                <span
                  style={{
                    color: "#0E101A",
                    fontSize: "12px",
                    fontWeight: "400",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    type="radio"
                    name="pos-filter-category"
                    checked={!filters?.categoryId}
                    onChange={() => setFilter({ categoryId: "" })}
                  />
                  All Categories
                </span>
                {(categories || []).map((cat) => (
                  <span
                    key={cat._id}
                    style={{
                      color: "#0E101A",
                      fontSize: "12px",
                      fontWeight: "400",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="radio"
                      name="pos-filter-category"
                      checked={String(filters?.categoryId || "") === String(cat._id)}
                      onChange={() => setFilter({ categoryId: String(cat._id) })}
                    />
                    {cat.categoryName || "Category"}
                  </span>
                ))}
              </div>
            </div>

            {/* Brand */}
            <div
              style={{
                backgroundColor: "#F8F9FB",
                borderRadius: "8px",
                padding: "8px",
                width: "270px",
                boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.25)",
                textAlign: 'left',
              }}
            >
              <label
                htmlFor=""
                style={{
                  color: "#727681",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Brand
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  padding: "10px 15px",
                }}
              >
                <span
                  style={{
                    color: "#0E101A",
                    fontSize: "12px",
                    fontWeight: "400",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(filters?.brandIds || []).length === 0}
                    onChange={() => setFilter({ brandIds: [] })}
                  />
                  All Brands
                </span>
                {(brands || []).map((b) => (
                  <span
                    key={b._id}
                    style={{
                      color: "#0E101A",
                      fontSize: "12px",
                      fontWeight: "400",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={(filters?.brandIds || []).includes(String(b._id))}
                      onChange={() =>
                        setFilter({
                          brandIds: toggleInArray(filters?.brandIds, String(b._id)),
                        })
                      }
                    />
                    {b.brandName || "Brand"}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* right */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* Stock Status */}
            <div
              style={{
                backgroundColor: "#F8F9FB",
                borderRadius: "8px",
                padding: "8px",
                width: "270px",
                boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.25)",
                textAlign: 'left',
              }}
            >
              <label
                htmlFor=""
                style={{
                  color: "#727681",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Stock Status
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  columnGap: "10px",
                  rowGap: "10px",
                }}
              >
                <button
                  onClick={() =>
                    setFilter({
                      stockStatus: filters?.stockStatus === "in" ? "" : "in",
                    })
                  }
                  style={{
                    border: "1px solid #A2A8B8",
                    borderRadius: "8px",
                    padding: "8px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: filters?.stockStatus === "in" ? "#E5F0FF" : "#F8F9FB",
                    fontSize: "12px",
                  }}
                >
                  <PiDotOutlineFill size={20} color="#0D6828" />
                  In Stock
                </button>
                <button
                  onClick={() =>
                    setFilter({
                      stockStatus: filters?.stockStatus === "low" ? "" : "low",
                    })
                  }
                  style={{
                    border: "1px solid #A2A8B8",
                    borderRadius: "8px",
                    padding: "8px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: filters?.stockStatus === "low" ? "#E5F0FF" : "#F8F9FB",
                    fontSize: "12px",
                  }}
                >
                  <PiDotOutlineFill size={20} color="#FFBC3F" />
                  Low Stock
                </button>
                <button
                  onClick={() =>
                    setFilter({
                      stockStatus: filters?.stockStatus === "out" ? "" : "out",
                    })
                  }
                  style={{
                    border: "1px solid #A2A8B8",
                    borderRadius: "8px",
                    padding: "8px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: filters?.stockStatus === "out" ? "#E5F0FF" : "#F8F9FB",
                    fontSize: "12px",
                  }}
                >
                  <PiDotOutlineFill size={20} color="#D00003" />
                  Out of Stock
                </button>
              </div>
            </div>

            {/* Price Range */}
            <div
              style={{
                backgroundColor: "#F8F9FB",
                borderRadius: "8px",
                padding: "8px",
                width: "270px",
                boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.25)",
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label
                  htmlFor=""
                  style={{
                    color: "#727681",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  Price Range
                </label>
                <button
                  style={{
                    backgroundColor: "#E5F0FF",
                    border: "1px solid #1F7FFF",
                    color: "#1F7FFF",
                    fontSize: "12px",
                    fontWeight: "400",
                    borderRadius: "4px",
                  }}
                >
                  {String(safeMin).padStart(2, "0")} -{" "}
                  {String(safeMax).padStart(2, "0")}
                </button>
              </div>

              {/* minimum price */}
              <div
                style={{
                  backgroundColor: "#F8F9FB",
                  borderRadius: "10px",
                  width: "100%",
                  height: "10px",
                  position: "relative",
                  border: '1px solid #A2A8B8',
                  margin: "10px 0"
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={safeMaxPrice}
                  value={safeMin}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(Number(e.target.value), safeMax));
                    setFilter({ priceMin: v, priceMax: safeMax });
                  }}
                  style={{
                    width: "100%",
                    height: "10px",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 2,
                    background: "transparent",
                  }}
                />
              </div>

              {/* maximum price */}
              <div
                style={{
                  backgroundColor: "#F8F9FB",
                  borderRadius: "10px",
                  width: "100%",
                  height: "10px",
                  position: "relative",
                  border: '1px solid #A2A8B8',
                  margin: "10px 0"
                }}
              >
                <input
                  type="range"
                  min={0}
                  max={safeMaxPrice}
                  value={safeMax}
                  onChange={(e) => {
                    const v = Math.max(safeMin, Math.min(Number(e.target.value), safeMaxPrice));
                    setFilter({ priceMin: safeMin, priceMax: v });
                  }}
                  style={{
                    width: "100%",
                    height: "10px",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    zIndex: 2,
                    background: "transparent",
                  }}
                />
              </div>
            </div>

            {/* Product Type */}
            <div
              style={{
                backgroundColor: "#F8F9FB",
                borderRadius: "8px",
                padding: "8px",
                width: "270px",
                boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.25)",
                textAlign: 'left',
              }}
            >
              <label
                htmlFor=""
                style={{
                  color: "#727681",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Product Type
              </label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  padding: "10px 15px",
                }}
              >
                <span
                  style={{
                    color: "#0E101A",
                    fontSize: "12px",
                    fontWeight: "400",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(filters?.productTypes || []).includes("single")}
                    onChange={() =>
                      setFilter({
                        productTypes: toggleInArray(filters?.productTypes, "single"),
                      })
                    }
                  />
                  Single
                </span>
                <span
                  style={{
                    color: "#0E101A",
                    fontSize: "12px",
                    fontWeight: "400",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(filters?.productTypes || []).includes("variants")}
                    onChange={() =>
                      setFilter({
                        productTypes: toggleInArray(filters?.productTypes, "variants"),
                      })
                    }
                  />
                  Variants
                </span>
                <span
                  style={{
                    color: "#0E101A",
                    fontSize: "12px",
                    fontWeight: "400",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={(filters?.productTypes || []).includes("serial")}
                    onChange={() =>
                      setFilter({
                        productTypes: toggleInArray(filters?.productTypes, "serial"),
                      })
                    }
                  />
                  Serial
                </span>
              </div>
            </div>

            {/* Tax Rate */}
            <div
              style={{
                backgroundColor: "#F8F9FB",
                borderRadius: "8px",
                padding: "8px",
                width: "270px",
                boxShadow: "0px 0px 4px rgba(0, 0, 0, 0.25)",
                textAlign: 'left',
              }}
            >
              <label
                htmlFor=""
                style={{
                  color: "#727681",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                GST Rate
              </label>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: '5px',
                  padding: "10px 15px",
                }}
              >
                <button
                  onClick={() => setFilter({ taxRate: null })}
                  style={{
                    borderRadius: "21px",
                    padding: "8px",
                    height: "30px",
                    backgroundColor: filters?.taxRate == null ? "#E5F0FF" : "#F8F9FB",
                    border: filters?.taxRate == null ? "1px solid #1F7FFF" : "1px solid #A2A8B8",
                    fontSize: "12px",
                    color: filters?.taxRate == null ? "#1F7FFF" : "#565656",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter({ taxRate: filters?.taxRate === 0 ? null : 0 })}
                  style={{
                    border: filters?.taxRate === 0 ? "1px solid #1F7FFF" : "1px solid #A2A8B8",
                    backgroundColor: filters?.taxRate === 0 ? "#E5F0FF" : "#F8F9FB",
                    color: filters?.taxRate === 0 ? "#1F7FFF" : "#565656",
                    borderRadius: "21px",
                    padding: "8px",
                    height: "30px",
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  0%
                </button>
                <button
                  onClick={() =>
                    setFilter({
                      taxRate: filters?.taxRate === 5 ? null : 5,
                    })
                  }
                  style={{
                    border: filters?.taxRate === 5 ? "1px solid #1F7FFF" : "1px solid #A2A8B8",
                    backgroundColor: filters?.taxRate === 5 ? "#E5F0FF" : "#F8F9FB",
                    color: filters?.taxRate === 5 ? "#1F7FFF" : "#565656",
                    borderRadius: "21px",
                    padding: "8px",
                    height: "30px",
                    fontSize: "12px",
                    textAlign: 'center',
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  5%
                </button>
                <button
                  onClick={() =>
                    setFilter({
                      taxRate: filters?.taxRate === 12 ? null : 12,
                    })
                  }
                  style={{
                    border: filters?.taxRate === 12 ? "1px solid #1F7FFF" : "1px solid #A2A8B8",
                    backgroundColor: filters?.taxRate === 12 ? "#E5F0FF" : "#F8F9FB",
                    color: filters?.taxRate === 12 ? "#1F7FFF" : "#565656",
                    borderRadius: "21px",
                    padding: "8px",
                    height: "30px",
                    fontSize: "12px",
                    textAlign: 'center',
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  12%
                </button>
                <button
                  onClick={() =>
                    setFilter({
                      taxRate: filters?.taxRate === 18 ? null : 18,
                    })
                  }
                  style={{
                    border: filters?.taxRate === 18 ? "1px solid #1F7FFF" : "1px solid #A2A8B8",
                    backgroundColor: filters?.taxRate === 18 ? "#E5F0FF" : "#F8F9FB",
                    color: filters?.taxRate === 18 ? "#1F7FFF" : "#565656",
                    borderRadius: "21px",
                    padding: "8px",
                    height: "30px",
                    fontSize: "12px",
                    textAlign: 'center',
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  18%
                </button>
                <button
                  onClick={() =>
                    setFilter({
                      taxRate: filters?.taxRate === 40 ? null : 40,
                    })
                  }
                  style={{
                    border: filters?.taxRate === 40 ? "1px solid #1F7FFF" : "1px solid #A2A8B8",
                    backgroundColor: filters?.taxRate === 40 ? "#E5F0FF" : "#F8F9FB",
                    color: filters?.taxRate === 40 ? "#1F7FFF" : "#565656",
                    borderRadius: "21px",
                    padding: "8px",
                    height: "30px",
                    textAlign: 'center',
                    fontSize: "12px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                >
                  40%
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default PosFilterProductModel;
