import React, { useEffect, useRef, useState } from "react";
import { IoLogoTwitch } from "react-icons/io";
import { FiSearch } from "react-icons/fi";
import { AiOutlineEye } from "react-icons/ai";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../../pages/config/axiosInstance";
import Pagination from "../../../components/Pagination";

function TransferProduct() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [warehouseDropdown, setWarehouseDropdown] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [transferData, setTransferData] = useState([]);

  const navigate = useNavigate();
  const warehouseRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelRef.current && !modelRef.current.contains(event.target)) {
        setViewOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        warehouseRef.current &&
        !warehouseRef.current.contains(event.target)
      ) {
        setWarehouseDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // const transferData = [
  //   {
  //     id: 1,
  //     code: "TRF-001",
  //     name: "Main Warehouse",
  //     location: "Delhi",
  //     products: 120,
  //     type: "Transfer",
  //     stockQty: 450,
  //     zones: 8,
  //     manager: "Rahul Sharma",
  //     status: "Active",
  //   },
  //   {
  //     id: 2,
  //     code: "TRF-002",
  //     name: "Secondary Warehouse",
  //     location: "Mumbai",
  //     type: "Received",
  //     products: 85,
  //     stockQty: 320,
  //     zones: 5,
  //     manager: "Amit Verma",
  //     status: "Inactive",
  //   },
  //   {
  //     id: 3,
  //     code: "TRF-003",
  //     name: "Cold Storage",
  //     location: "Bangalore",
  //     type: "Transfer",
  //     products: 60,
  //     stockQty: 210,
  //     zones: 4,
  //     manager: "Neha Singh",
  //     status: "Active",
  //   },
  //   {
  //     id: 4,
  //     code: "TRF-004",
  //     name: "Retail Warehouse",
  //     type: "Received",
  //     location: "Pune",
  //     products: 150,
  //     stockQty: 600,
  //     zones: 10,
  //     manager: "Vikas Kumar",
  //     status: "Active",
  //   },
  // ];

  const products = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
      name: "Moda Men's Solid Round Neck T-shirt",
      sku: "KB-WM-204",
      qty: "100 Pcs",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
      name: "Nike Sports T-shirt",
      sku: "NK-TS-102",
      qty: "200 Pcs",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
      name: "Adidas Casual Wear",
      sku: "AD-CW-309",
      qty: "150 Pcs",
    },
  ];

  const tabsData = [
    {
      label: "Transfer",
      count: transferData.filter((item) => item.type === "Transfer").length,
    },
    {
      label: "Received",
      count: transferData.filter((item) => item.type === "Received").length,
    },
  ];

  const filteredTransfers = transferData.filter((item) => {
  if (activeTab === "Transfer") return item.type === "Transfer";
  if (activeTab === "Received") return item.type === "Received";
  return true;
});

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/warehouse/transfer");

      setTransferData(res.data.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "90vh" }}>
      <div
        className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ marginBottom: "20px" }}
      >
        <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
          Stock Transfer
        </h3>

        <div
          onClick={() =>
            navigate("/add-transfer", {
              state: { from: location.pathname },
            })
          }
          title="Add Warehouse Button"
          className="button-hover"
          style={{
            borderRadius: "8px",
            padding: "5px 16px",
            border: "1px solid #1F7FFF",
            color: "rgb(31, 127, 255)",
            fontFamily: "Inter",
            backgroundColor: "white",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
          }}
        >
          <IoLogoTwitch className="fs-5" />
          New Transfer
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          width: "100%",
          padding: 16,
          background: "white",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Search */}
        <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              width: "fit-content",
            }}
          >
            {tabsData.map((tab) => (
              <div
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                style={{
                  padding: "6px 12px",
                  background: activeTab === tab.label ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow:
                    activeTab === tab.label
                      ? "0px 1px 4px rgba(0,0,0,0.10)"
                      : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#0E101A",
                  }}
                >
                  {tab.label}
                </span>

                <span
                  style={{
                    color: "#727681",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {tab.count}
                </span>
              </div>
            ))}
          </div>
          {/* Search */}
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
              width: "50%",
            }}
          >
            <div
              style={{
                width: "50%",
                position: "relative",
                padding: "8px 16px 8px 20px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
              }}
            >
              <FiSearch className="fs-5" />

              <input
                type="search"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div
              style={{
                width: "25%",
                position: "relative",
                padding: "8px 16px 8px 20px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
              }}
            >
              <input
                type="date"
                style={{
                  border: "none",
                  outline: "none",
                }}
              />
            </div>
            {/* Warehouse Dropdown */}
            <div
              style={{
                width: "40%",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              {/* Custom Select */}
              <div
                ref={warehouseRef}
                style={{
                  width: "100%",
                  height: "40px",
                  padding: "0 12px",
                  background: "white",
                  borderRadius: "8px",
                  border: "1px solid #EAEAEA",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "8px",
                  display: "flex",
                  position: "relative",
                  cursor: "pointer",
                }}
              >
                {/* Selected Value */}
                <div
                  onClick={() => setWarehouseDropdown(!warehouseDropdown)}
                  style={{
                    display: "flex",
                    gap: "5px",
                    width: "100%",
                  }}
                >
                  <span
                    style={{
                      color: "#0E101A",
                      fontSize: "14px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                      width: "100%",
                    }}
                  >
                    {selectedWarehouse || "Select Warehouse"}
                  </span>
                </div>

                {/* Arrow */}
                <div onClick={() => setWarehouseDropdown(!warehouseDropdown)}>
                  {warehouseDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
                </div>

                {/* Dropdown */}
                {warehouseDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "42px",
                      left: 0,
                      right: 0,
                      backgroundColor: "white",
                      border: "1px solid #E1E1E1",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      maxHeight: "300px",
                      overflowY: "auto",
                      zIndex: 1000,
                    }}
                  >
                    {[
                      "Main Warehouse",
                      "Retail Warehouse",
                      "Cold Storage",
                      "Distribution Center",
                      "Backup Warehouse",
                      "Smart Warehouse",
                    ].map((item, index) => (
                      <div
                        key={index}
                        onClick={() => {
                          setSelectedWarehouse(item);
                          setWarehouseDropdown(false);
                        }}
                        className="button-hover"
                        style={{
                          padding: "10px 14px",
                          cursor: "pointer",
                          fontSize: 14,
                          color: "#0E101A",
                          borderBottom:
                            index !== 5 ? "1px solid #F3F3F3" : "none",
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          style={{
            overflowY: "auto",
            height: "calc(100vh - 310px)",
            maxHeight: "500px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            {/* Header */}
            <thead
              style={{
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <tr style={{ background: "#F3F8FB" }}>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
                    fontWeight: 400,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    Transfer ID
                  </div>
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Source Warehouse
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Destination Warehouse
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Items
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Total Quantity
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Date & Time
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Created By
                </th>

                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : transferData.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div
                      style={{
                        height: "250px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#FF441F",
                        fontSize: 16,
                        fontWeight: 500,
                      }}
                    >
                      No Transfer Found
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer, index) => (
                  <tr
                    key={transfer._id}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                    }}
                  >
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: 500,
                      }}
                    >
                      {transfer.transferNumber}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {transfer.sourceWarehouse?.warehouseName || "-"}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {transfer.destinationWarehouse?.warehouseName || "-"}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {transfer.products?.length || 0}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {transfer.products?.reduce(
                        (sum, item) => sum + Number(item.transferQty || 0),
                        0,
                      )}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {new Date(transfer.createdAt).toLocaleString()}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {transfer.contactPerson}
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {transfer.contactPerson}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
      {/* Transfer Details Modal */}
      {showTransferModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            backdropFilter: "blur(2px)",
            padding: "20px",
          }}
          onClick={() => setShowTransferModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "780px",
              maxHeight: "95vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "20px",
              padding: "20px",
              boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            {/* Top Warehouse Section */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #E6E6E6",
                borderRadius: "20px",
                padding: "18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              {/* From */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <div className="d-flex gap-2 align-items-center">
                  <div style={{ fontSize: "18px" }}>🚚</div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        color: "#676767",
                        fontFamily: "Inter",
                        fontWeight: "400",
                      }}
                    >
                      From
                    </p>

                    <span
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "#262626",
                        fontFamily: "Inter",
                      }}
                    >
                      Delhi Warehouse (DEL 1)
                    </span>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div
                style={{
                  fontSize: "24px",
                  color: "#6B7280",
                }}
              >
                →
              </div>

              {/* To */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                }}
              >
                <div className="d-flex gap-2 align-items-center">
                  <div style={{ fontSize: "18px" }}>🏠</div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        color: "#676767",
                        fontFamily: "Inter",
                        fontWeight: "400",
                      }}
                    >
                      To
                    </p>

                    <span
                      style={{
                        margin: 0,
                        fontSize: "16px",
                        fontWeight: 500,
                        color: "#262626",
                        fontFamily: "Inter",
                      }}
                    >
                      Delhi Warehouse (DEL 1)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #E6E6E6",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "10px",
              }}
            >
              <h5
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  marginBottom: "10px",
                  color: "#262626",
                  fontFamily: "Roboto",
                }}
              >
                Products
              </h5>

              <div
                style={{
                  width: "100%",
                  background: "#fff",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >
                  {/* Table Header */}
                  <thead>
                    <tr
                      style={{
                        background: "#F3F8FB",
                        height: "50px",
                      }}
                    >
                      <th
                        style={{
                          textAlign: "left",
                          padding: "0 10px",
                          fontSize: "14px",
                          color: "#727681",
                          fontWeight: 400,
                          width: "80px",
                          fontFamily: "Inter",
                        }}
                      >
                        S No.
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "0 10px",
                          fontSize: "14px",
                          color: "#727681",
                          fontWeight: 400,
                          fontFamily: "Inter",
                        }}
                      >
                        Items
                      </th>

                      <th
                        style={{
                          textAlign: "left",
                          padding: "0 10px",
                          fontSize: "14px",
                          color: "#727681",
                          fontWeight: 400,
                          fontFamily: "Inter",
                          width: "140px",
                        }}
                      >
                        Qty
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {products.map((item, index) => (
                      <tr
                        key={item.id}
                        // style={{
                        //   borderBottom:
                        //     index !== products.length - 1
                        //       ? "1px solid #F1F1F1"
                        //       : "none",
                        // }}
                      >
                        {/* Serial Number */}
                        <td
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            color: "#0E101A",
                          }}
                        >
                          {item.id}
                        </td>

                        {/* Product */}
                        <td
                          style={{
                            padding: "8px 16px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "14px",
                            }}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              style={{
                                width: "36px",
                                height: "36px",
                                borderRadius: "4px",
                                objectFit: "cover",
                                border: "1px solid #F1F1F1",
                              }}
                            />

                            <div>
                              <h6
                                style={{
                                  margin: 0,
                                  fontSize: "14px",
                                  fontWeight: 400,
                                  color: "#0E101A",
                                  fontFamily: "Inter",
                                }}
                              >
                                {item.name}
                              </h6>

                              <p
                                style={{
                                  margin: 0,
                                  marginTop: "4px",
                                  fontSize: "12px",
                                  color: "#727681",
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                }}
                              >
                                SKU {item.sku}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td
                          style={{
                            padding: "8px 16px",
                            fontSize: "14px",
                            color: "#0E101A",
                            fontFamily: "Inter",
                            fontWeight: "400",
                          }}
                        >
                          {item.qty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Product Summary */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "16px",
                padding: "16px",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  marginBottom: "10px",
                  color: "#262626",
                  fontFamily: "Roboto",
                }}
              >
                Product Summary
              </span>

              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                }}
              >
                <div
                  style={{
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#676767",
                      fontWeight: 400,
                      fontFamily: "Roboto",
                    }}
                  >
                    Total Product
                  </p>

                  <span
                    style={{
                      margin: 0,
                      marginTop: "8px",
                      fontWeight: 500,
                      color: "#262626",
                      fontSize: "14px",
                    }}
                  >
                    3
                  </span>
                </div>

                <div
                  style={{
                    width: "50%",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#676767",
                      fontWeight: 400,
                      fontFamily: "Roboto",
                    }}
                  >
                    Total Quantity
                  </p>

                  <span
                    style={{
                      margin: 0,
                      marginTop: "8px",
                      fontWeight: 500,
                      color: "#262626",
                      fontSize: "14px",
                    }}
                  >
                    500 Pcs
                  </span>
                </div>
              </div>
            </div>

            {/* Transport Detail */}
            <div
              style={{
                background: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "20px",
                padding: "16px",
              }}
            >
              <span
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  marginBottom: "10px",
                  color: "#262626",
                  fontFamily: "Roboto",
                }}
              >
                Transport Detail
              </span>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    marginTop: "10px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      color: "#6B7280",
                    }}
                  >
                    Vehicle Number
                  </p>

                  <span
                    style={{
                      margin: 0,
                      marginTop: "8px",
                      fontWeight: 500,
                      color: "#111827",
                    }}
                  >
                    DL04-TA-4445
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "10px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      color: "#6B7280",
                    }}
                  >
                    Contact Person
                  </p>

                  <span
                    style={{
                      margin: 0,
                      marginTop: "8px",
                      fontWeight: 500,
                      color: "#111827",
                    }}
                  >
                    Manoj Lal
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "10px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "15px",
                      color: "#6B7280",
                    }}
                  >
                    Contact Number
                  </p>

                  <span
                    style={{
                      margin: 0,
                      marginTop: "8px",
                      fontWeight: 500,
                      color: "#111827",
                    }}
                  >
                    9120930985
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransferProduct;