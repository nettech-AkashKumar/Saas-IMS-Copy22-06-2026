import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FiSearch, FiTrash2 } from "react-icons/fi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";

function AddTransfer() {
  const location = useLocation();
  const [sourceDropdown, setSourceDropdown] = useState(false);
  const [destinationDropdown, setDestinationDropdown] = useState(false);
  const [showSearchProducts, setShowSearchProducts] = useState(false);
  const [selectedSourceWarehouse, setSelectedSourceWarehouse] = useState(null);
  const [selectedDestinationWarehouse, setSelectedDestinationWarehouse] =
    useState(null);
  const [unitDropdown, setUnitDropdown] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [search, setSearch] = useState("");
  const unitOptions = ["Pcs", "Box", "Kg"];
  const sourceDropdownRef = useRef(null);
  const destinationDropdownRef = useRef(null);
  const [warehouses, setWarehouses] = useState([]);
  const [checkedProducts, setCheckedProducts] = useState([]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // const products = [
  //   {
  //     id: 1,
  //     name: "Moda Men's Solid Round Neck T-shirt",
  //     sku: "KB-WM-204",
  //     qty: 1240,
  //     image:
  //       "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
  //   },
  //   {
  //     id: 2,
  //     name: "Moda Men's Solid Round Neck T-shirt",
  //     sku: "KB-WM-204",
  //     qty: 1240,
  //     image:
  //       "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
  //   },
  //   {
  //     id: 3,
  //     name: "Moda Men's Solid Round Neck T-shirt",
  //     sku: "KB-WM-204",
  //     qty: 1240,
  //     image:
  //       "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
  //   },
  // ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sourceDropdownRef.current &&
        !sourceDropdownRef.current.contains(event.target)
      ) {
        setSourceDropdown(false);
      }

      if (
        destinationDropdownRef.current &&
        !destinationDropdownRef.current.contains(event.target)
      ) {
        setDestinationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchProducts(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/api/warehouse/active"); // ← correct
      setWarehouses(res.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchWarehouseProducts = async (warehouseId) => {
    try {
      const res = await api.get(
        `/api/warehouse/${warehouseId}/allocated-products`,
      );
      console.log("✅ API response:", res.data);
      setProducts(res.data.data || []);
    } catch (error) {
      console.log("❌ fetchWarehouseProducts error:", error);
    }
  };

  const [allocatedMap, setAllocatedMap] = useState({});

  const fetchAllocatedMap = async () => {
    try {
      const res = await api.get("/api/warehouse/product-allocation");
      const map = {};
      (res.data.data || []).forEach((row) => {
        const id = row.id?.toString();
        if (id) {
          map[id] = (map[id] || 0) + Number(row.allocatedQty || 0);
        }
      });
      setAllocatedMap(map);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllocatedMap();
  }, []);

  const handleSubmit = async () => {
  try {
    if (!selectedSourceWarehouse) {
      return toast.error("Please select source warehouse");
    }

    if (!selectedDestinationWarehouse) {
      return toast.error("Please select destination warehouse");
    }

    if (selectedProducts.length === 0) {
      return toast.error("Please add products");
    }

    if (!contactPerson.trim()) {
      return toast.error("Please enter contact person");
    }

    const payload = {
      sourceWarehouse: selectedSourceWarehouse._id,
      destinationWarehouse: selectedDestinationWarehouse._id,

      vehicleNumber,
      contactPerson,
      contactNumber,

      products: selectedProducts.map((item) => ({
        productId: item._id,
        productName: item.productName,
        locationCode: item.locationCode,
        unit: item.unit,
        totalQty: item.allocatedQty,
        transferQty: Number(item.transferQty),
      })),
    };

    console.log("TRANSFER PAYLOAD", payload);

    // ✅ Save to DB
    const res = await api.post(
      "/api/warehouse/transfer",
      payload
    );

    console.log("TRANSFER RESPONSE", res.data);

    // ✅ Success Toast
    toast.success(
      res.data?.message || "Transfer Created Successfully"
    );

    // ✅ Reset all fields
    setSelectedSourceWarehouse(null);
    setSelectedDestinationWarehouse(null);

    setProducts([]);
    setSelectedProducts([]);

    setSearch("");

    setVehicleNumber("");
    setContactPerson("");
    setContactNumber("");

    setShowSearchProducts(false);

    setSourceDropdown(false);
    setDestinationDropdown(false);

    setCheckedProducts([]);

  } catch (error) {
    console.log(error);

    toast.error(
      error?.response?.data?.message ||
      "Something went wrong"
    );
  }
};

  return (
    <div className="p-4" style={{ height: "100vh" }}>
      {/* Header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Left Side */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
          }}
        >
          {/* Back Button */}
          <Link
            to={location.state?.from || "/dashboard"}
            style={{
              width: 32,
              height: 32,
              background: "white",
              borderRadius: 53,
              border: "1.07px solid #EAEAEA",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            Transfer Product
          </h2>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          padding: "16px",
          background: "white",
          borderRadius: "16px",
          border: "1px solid #EAEAEA",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: "calc(100vh - 200px)",
          position: "relative",
          marginBottom: "20px",
        }}
      >
        <div style={{}}>
          {/* SOURCE & DESTINATION */}
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 500,
              marginBottom: "10px",
              color: "#000000",
            }}
          >
            Source & Destination
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "35px",
              paddingBottom: "16px",
            }}
          >
            {/* Source Warehouse */}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  color: "#727681",
                  marginBottom: "8px",
                  display: "block",
                  fontWeight: 400,
                }}
              >
                Source warehouse
              </label>

              <div
                ref={sourceDropdownRef}
                style={{
                  width: "100%",
                  border: "1px solid #EAEAEA",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <div
                  onClick={() => setSourceDropdown(!sourceDropdown)}
                  style={{
                    width: "100%",
                    fontSize: "16px",
                    color: "#111827",
                  }}
                >
                  {selectedSourceWarehouse?.warehouseName || "Select warehouse"}
                </div>

                <div onClick={() => setSourceDropdown(!sourceDropdown)}>
                  {sourceDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
                </div>

                {sourceDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "56px",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      zIndex: 1000,
                    }}
                  >
                    {warehouses.map((item, index) => (
                      <div
                        key={item._id}
                        onClick={() => {
                          setSelectedSourceWarehouse(item);
                          setSourceDropdown(false);
                          if (selectedDestinationWarehouse?._id === item._id) {
                            setSelectedDestinationWarehouse(null);
                          }

                          setProducts([]);
                          setSelectedProducts([]);
                          setSearch("");

                          fetchWarehouseProducts(item._id);
                        }}
                        className="button-hover"
                        style={{
                          padding: "12px 14px",
                          fontSize: "15px",
                          cursor: "pointer",
                          borderBottom:
                            index !== warehouses.length - 1
                              ? "1px solid #F3F4F6"
                              : "none",
                        }}
                      >
                        {item.warehouseName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Destination Warehouse */}
            <div>
              <label
                style={{
                  fontSize: "12px",
                  color: "#727681",
                  marginBottom: "8px",
                  display: "block",
                  fontWeight: 400,
                }}
              >
                Destination warehouse
              </label>

              <div
                ref={destinationDropdownRef}
                style={{
                  width: "100%",
                  border: "1px solid #EAEAEA",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                <div
                  onClick={() => setDestinationDropdown(!destinationDropdown)}
                  style={{
                    width: "100%",
                    fontSize: "16px",
                    color: selectedDestinationWarehouse ? "#111827" : "#9CA3AF",
                  }}
                >
                  {selectedDestinationWarehouse?.warehouseName ||
                    "Select warehouse"}
                </div>

                <div
                  onClick={() => setDestinationDropdown(!destinationDropdown)}
                >
                  {destinationDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
                </div>

                {destinationDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "56px",
                      left: 0,
                      right: 0,
                      background: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      zIndex: 1000,
                    }}
                  >
                    {warehouses
                      .filter(
                        (item) => item._id !== selectedSourceWarehouse?._id,
                      )
                      .map((item, index) => (
                        <div
                          key={item._id}
                          onClick={() => {
                            setSelectedDestinationWarehouse(item);
                            setDestinationDropdown(false);
                          }}
                          className="button-hover"
                          style={{
                            padding: "12px 14px",
                            fontSize: "15px",
                            cursor: "pointer",
                            borderBottom:
                              index !== warehouses.length - 1
                                ? "1px solid #F3F4F6"
                                : "none",
                          }}
                        >
                          {item.warehouseName}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: "1px",
              background: "#EAEAEA",
              marginBottom: "10px",
            }}
          />

          {/* PRODUCT DETAILS */}
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 500,
              marginBottom: "10px",
              color: "#000000",
            }}
          >
            Product Details
          </h3>

          {/* Search */}
          <div
            ref={searchRef}
            style={{
              position: "relative",
              marginBottom: "10px",
            }}
          >
            <FiSearch
              size={18}
              color="#9CA3AF"
              style={{
                position: "absolute",
                top: "50%",
                left: "14px",
                transform: "translateY(-50%)",
                zIndex: 1,
              }}
            />

            <input
              type="text"
              placeholder="Search by name, barcode or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSearchProducts(true)}
              style={{
                width: "100%",
                border: "1px solid #EAEAEA",
                borderRadius: "8px",
                padding: "8px 12px",
                paddingLeft: "38px",
                fontSize: "15px",
                outline: "none",
              }}
            />

            {/* Search Product List */}
            {showSearchProducts && (
              <div
                style={{
                  position: "absolute",
                  top: "48px",
                  left: 0,
                  width: "100%",
                  background: "#fff",
                  border: "1px solid #EAEAEA",
                  borderRadius: "12px",
                  padding: "12px",
                  zIndex: 1000,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {/* Guard: no source warehouse selected */}
                {!selectedSourceWarehouse ? (
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#9CA3AF",
                      textAlign: "center",
                      padding: "10px 0",
                    }}
                  >
                    Please select a source warehouse first
                  </div>
                ) : (
                  (() => {
                    // Filter products of selected source warehouse only
                    const filtered = products.filter((item) => {
                      const q = search.toLowerCase().trim();
                      if (!q) return true;
                      return (
                        item.productName?.toLowerCase().includes(q) ||
                        item.productCode?.toLowerCase().includes(q) ||
                        item.barcode?.toLowerCase().includes(q)
                      );
                    });

                    // Already added to table — exclude duplicates
                    const notYetAdded = filtered.filter(
                      (item) =>
                        !selectedProducts.find(
                          (p) => p._id === item._id.toString(),
                        ),
                    );

                    if (notYetAdded.length === 0) {
                      return (
                        <div
                          style={{
                            fontSize: "13px",
                            color: "#9CA3AF",
                            textAlign: "center",
                            padding: "10px 0",
                          }}
                        >
                          {search
                            ? "No products match your search"
                            : "No products available"}
                        </div>
                      );
                    }

                    return notYetAdded.map((item, index) => (
                      <div
                        key={item._id || index}
                        style={{
                          border: "1px solid #EAEAEA",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* Left */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <img
                            src={
                              item.images?.[0]?.url ||
                              "https://via.placeholder.com/36"
                            }
                            alt="product"
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "6px",
                              objectFit: "cover",
                            }}
                          />

                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#111827",
                              }}
                            >
                              {item.productName}
                            </div>

                            <div
                              style={{
                                fontSize: "12px",
                                color: "#727681",
                                marginTop: "2px",
                              }}
                            >
                              location: {item.locationCode}
                            </div>
                          </div>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={() => {
                            const alreadyAdded = selectedProducts.some(
                              (p) => p._id === item._id,
                            );

                            if (!alreadyAdded) {
                              setSelectedProducts((prev) => [
                                ...prev,
                                {
                                  ...item,
                                  transferQty: "",
                                  unit: item.unit || "-",
                                },
                              ]);
                            }
                          }}
                          style={{
                            background: selectedProducts.some(
                              (p) => p._id === item._id,
                            )
                              ? "#22C55E"
                              : "#1F7FFF",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 14px",
                          }}
                        >
                          {selectedProducts.some((p) => p._id === item._id)
                            ? "Added"
                            : "+ Add"}
                        </button>
                      </div>
                    ));
                  })()
                )}
              </div>
            )}
          </div>

          {/* TABLE */}
          <div
            style={{
              overflowY: "auto",
              width: "100%",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              {/* Header */}
              <thead>
                <tr
                  style={{
                    background: "#F3F8FB",
                    height: "54px",
                  }}
                >
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                      width: "80px",
                    }}
                  >
                    S No.
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                    }}
                  >
                    Items
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                      width: "180px",
                    }}
                  >
                    Transfer Qty
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                      width: "180px",
                    }}
                  >
                    Unit
                  </th>

                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                      width: "150px",
                    }}
                  >
                    Total Qty
                  </th>

                  <th
                    style={{
                      textAlign: "center",
                      padding: "12px 16px",
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                      width: "100px",
                    }}
                  >
                    Action
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {selectedProducts.map((item, index) => (
                  <tr
                    key={item._id || index}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                    }}
                  >
                    {/* Serial */}
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: 400,
                      }}
                    >
                      {index + 1}
                    </td>

                    {/* Product */}
                    <td style={{ padding: "14px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <img
                          src={
                            item.images?.[0]?.url ||
                            "https://via.placeholder.com/44"
                          }
                          alt="product"
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "6px",
                            objectFit: "cover",
                            border: "1px solid #F1F1F1",
                          }}
                        />

                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              color: "#0E101A",
                              fontWeight: 500,
                              marginBottom: "3px",
                            }}
                          >
                            {item.productName}
                          </div>

                          <div
                            style={{
                              fontSize: "12px",
                              color: "#727681",
                              fontWeight: 400,
                            }}
                          >
                            location: {item.locationCode}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Qty */}
                    <td style={{ padding: "14px 16px" }}>
                      <input
                        type="number"
                        value={item.transferQty ?? " "}
                        onChange={(e) => {
                          const entered = Number(e.target.value);
                          const maxQty = item.allocatedQty || 0; // ✅ cap at total qty

                          const updated = [...selectedProducts];
                          updated[index] = {
                            ...updated[index],
                            transferQty: entered > maxQty ? maxQty : entered, // ✅ clamp
                          };
                          setSelectedProducts(updated);
                        }}
                        style={{
                          width: "120px",
                          height: "40px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "8px",
                          padding: "0 12px",
                          fontSize: "14px",
                          outline: "none",
                        }}
                      />
                    </td>

                    {/* Unit */}
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: "14px",
                        color: "#0E101A",
                        fontWeight: 400,
                      }}
                    >
                      {item.unit || ""}
                    </td>

                    {/* Total Qty */}
                    <td
                      style={{
                        padding: "14px 16px",
                        fontSize: 14,
                        color: "#727681",
                        fontWeight: 400,
                      }}
                    >
                      <div
                        style={{
                          width: "140px",
                          height: "40px",
                          border: "1px solid #D1D5DB",
                          borderRadius: "8px",
                          padding: "0 12px",
                          display: "flex",
                          alignItems: "center",
                          background: "#fff",
                          fontSize: "14px",
                          color: "#0E101A",
                        }}
                      >
                        {item.allocatedQty || 0}
                      </div>
                    </td>

                    {/* Action */}
                    <td
                      style={{
                        padding: "14px 16px",
                        textAlign: "center",
                      }}
                    >
                      <FiTrash2
                        size={18}
                        color="#FF4D4F"
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setSelectedProducts(
                            selectedProducts.filter((_, i) => i !== index),
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Divider */}
          <div
            style={{
              marginTop: "10px",
              marginBottom: "10px",
            }}
          />

          {/* TRANSPORT DETAIL */}
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 500,
              marginBottom: "10px",
              color: "#000000",
            }}
          >
            Transport Detail
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "40px",
            }}
          >
            {/* Vehicle Number */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  color: "#727681",
                  fontWeight: 400,
                }}
              >
                Vehicle Number
              </label>

              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="Enter number"
                style={{
                  width: "100%",
                  height: "52px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "10px",
                  padding: "0 14px",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
            </div>

            {/* Contact Person */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  color: "#727681",
                  fontWeight: 400,
                }}
              >
                Contact Person <span style={{ color: "red" }}>*</span>
              </label>

              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Enter Name"
                style={{
                  width: "100%",
                  height: "52px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "10px",
                  padding: "0 14px",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
            </div>

            {/* Contact Number */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  color: "#727681",
                  fontWeight: 400,
                }}
              >
                Contact Number
              </label>

              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Enter Number"
                style={{
                  width: "100%",
                  height: "52px",
                  border: "1px solid #D1D5DB",
                  borderRadius: "10px",
                  padding: "0 14px",
                  fontSize: "15px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-3">
        <button
          type="button"
          style={{
            background: "#ffffff",
            color: "#1F7FFF",
            border: "1px solid #1F7FFF",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          style={{
            background: "#1F7FFF",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            cursor: "pointer",
            marginBottom: "10px",
          }}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default AddTransfer;
