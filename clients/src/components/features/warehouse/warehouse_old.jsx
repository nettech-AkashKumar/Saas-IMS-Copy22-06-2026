import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

// pages
import axios from "axios";
import BASE_URL from "../../../pages/config/config";
import AddWarehouseModal from "./AddWarehouse";
import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
import api from "../../../pages/config/axiosInstance.js"
import { useAuth } from "../../auth/AuthContext";

// icons
import { MdArrowForwardIos } from "react-icons/md";
import { PiWarehouseFill } from "react-icons/pi";
import { FaHeart } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";

// images
import Polygon from "../../../assets/images/Polygon-2.png";
import Poly from "../../../assets/images/Polygon-1.png";
import Polygont from "../../../assets/images/Polygon3.png";
import Polygo from "../../../assets/images/Polygon4.png";

function Warehouse() {

  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [favourites, setFavourites] = useState([]);

    const warehousesCard = [
    {
      id: 1,
      warehouseName: "Central Warehouse",
      city: "Delhi",
      warehouseOwner: "Amit Kumar",
      stockValue: 250000,
      isFavorite: true,
    },
    {
      id: 2,
      warehouseName: "North Hub",
      city: "Noida",
      warehouseOwner: "Rahul Sharma",
      stockValue: 180000,
      isFavorite: false,
    },
    {
      id: 3,
      warehouseName: "East Storage",
      city: "Kolkata",
      warehouseOwner: "Rohit Verma",
      stockValue: 320000,
      isFavorite: true,
    },
    {
      id: 4,
      warehouseName: "South Depot",
      city: "Bangalore",
      warehouseOwner: "Anjali Singh",
      stockValue: 410000,
      isFavorite: false,
    },
  ];

  const toggleFavourite = async (warehouse) => {
    try {
      const response = await api.put(`/api/warehouse/${warehouse._id}/toggle-favorite`,);
      setWarehouses((prev) =>
        prev.map((wh) =>
          wh._id === warehouse._id ? { ...wh, isFavorite: response.data.warehouse.isFavorite } : wh
        )
      );
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/warehouse'); // <- endpoint

      setWarehouses(res.data.data.reverse());
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await api.get('/api/products');
      // Defensive: support both res.data.products and res.data (array)
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else if (Array.isArray(res.data.products)) {
        setProducts(res.data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    try {
      const res = await api.get('/api/sales');
      setSales(res.data.sales);
    } catch (err) {
      console.error("Error fetching sales:", err);
      setSales([]);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
    fetchSales();
  }, [fetchWarehouses, fetchProducts, fetchSales]);

  const salesMap = sales.reduce((acc, sale) => {
    if (!sale.products || !Array.isArray(sale.products)) return acc;
    sale.products.forEach((p) => {
      if (!p || !p.productId) return;
      const pid =
        typeof p.productId === "object" ? p.productId._id : p.productId;
      if (!pid) return;
      if (!acc[pid]) acc[pid] = 0;
      acc[pid] += p.saleQty || 0;
    });
    return acc;
  }, {});

  return (
    <div className="p-4" style={{ overflow: "auto", width: "100%", height: "100vh" }}>

      {/* header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px", // Optional: padding for container
          flexWrap: "wrap"
        }}
      >
        {/* Left: Title + Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: "33px",

          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            Warehouse
          </h2>
        </div>

        {/* Right: Action Buttons */}
        {hasPermission(user, "Warehouse", "create") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: "33px",
            }}
          >
            <a
              title="Add warehouse Button"
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
            >+ Add Warehouse</a>
          </div>
        )}
      </div>

      {/* Recently Accessed */}
      <div
        style={{
          fontWeight: "500",
          fontSize: "16px",
          color: "#262626",
          marginTop: "20px",
        }}
      >
        {/* favrouite */}
        <div
          style={{
            fontWeight: "500",
            fontSize: "16px",
            color: "#262626",
            marginTop: "10px",
            paddingBottom: "4px",
          }}
        >
          <h3 style={{
            margin: 0,
            color: 'black',
            fontSize: 20,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            lineHeight: '40px',
          }}>
            💠 Favourite
          </h3>

          <div style={{ marginTop: "2px" }}>
            <div className="row">
              {warehouses
                .filter((item) => item.isFavorite)
                .map((fav) => {
                  const filteredProducts = products.filter(
                    (p) => p.warehouseName === fav.warehouseName
                  );
                  const totalStockValue = filteredProducts.reduce(
                    (sum, item) => {
                      const quantity = Number(item.quantity) || 0;
                      const sellingPrice = Number(item.sellingPrice) || 0;
                      return sum + quantity * sellingPrice;
                    },
                    0
                  );
                  return (
                    <div className="col-3" key={fav._id}>
                      <div
                        style={{
                          backgroundColor: "white",
                          padding: "10px",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          height: "150px",
                          position: "relative",
                          marginBottom: "30px",
                          overflow: "hidden",
                        }}
                      >

                        <img
                          src={Polygon}
                          alt="Polygon"
                          style={{
                            position: "absolute",
                            bottom: "0",
                            left: "auto",
                            top: "auto",
                            right: "0",
                            width: "100%",
                            height: "50px",
                            zIndex: "0",
                          }}
                        />

                        <img
                          src={Poly}
                          alt="Polygon"
                          style={{
                            position: "absolute",
                            bottom: "0",
                            left: "auto",
                            top: "auto",
                            right: "0",
                            width: "100%",
                            height: "50px",
                            zIndex: "0",
                          }}
                        />

                        <img
                          src={Polygont}
                          alt="Polygon"
                          style={{
                            position: "absolute",
                            bottom: "auto",
                            left: "0",
                            top: "0",
                            right: "auto",
                            width: "100%",
                            height: "50px",
                            zIndex: "0",
                          }}
                        />

                        <img
                          src={Polygo}
                          alt="Polygon"
                          style={{
                            position: "absolute",
                            bottom: "auto",
                            left: "0",
                            top: "0",
                            right: "auto",
                            width: "100%",
                            height: "50px",
                            zIndex: "0",
                          }}
                        />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            marginBottom: "10px",
                          }}
                        >
                          <div
                            style={{
                              backgroundColor: "#f1f1f1",
                              backgroundColor: "#fff",
                              border: "1px solid #e6e6e6",
                              borderRadius: "8px",
                              padding: "10px",
                              alignItems: "center",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <span>
                              <PiWarehouseFill
                                style={{
                                  color: "#1368EC",
                                  fontSize: "20px",
                                  fontWeight: "bold",
                                }}
                              />
                              <Link to={`/WarehouseDetails/${fav._id}`}>
                                {fav.warehouseName}
                              </Link>
                            </span>
                          </div>
                          <div
                            style={{
                              padding: "10px",
                              backgroundColor: "#f1f1f1",
                              borderRadius: "8px",
                              width: "fit-content",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <FaHeart
                              onClick={() => toggleFavourite(fav)}
                              style={{
                                cursor: "pointer",
                                color: "red",
                                fontWeight: "500",
                                fontSize: "26px",
                              }}
                            />
                          </div>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "10px",
                            right: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",

                          }}
                        >
                          <div>
                            <Link to={`/WarehouseDetails/${fav._id}`}>
                              <p style={{ margin: "0", fontWeight: "500" }}>
                                {fav.city} - {fav.warehouseOwner}
                              </p>
                              <span style={{ color: "#1368EC" }}>
                                ₹{totalStockValue.toLocaleString("en-IN")}
                              </span>
                              <span style={{ marginLeft: "4px", fontSize: "16px", color: "#676767" }}>
                                Stock Valuation
                              </span>
                            </Link>
                          </div>
                          <div>
                            <Link to={`/WarehouseDetails/${fav._id}`}>
                              <FaArrowRight />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              {warehouses.filter((item) => item.isFavorite).length === 0 && (
                <p>No favourites yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* all */}
        <div
          style={{
            fontWeight: "500",
            fontSize: "16px",
            color: "#262626",
            marginTop: "10px",
            paddingBottom: "4px",
          }}
        >
          <h3 style={{
            margin: 0,
            color: 'black',
            fontSize: 20,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 400,
            lineHeight: '40px',
          }}>
            💠 All Warehouse
          </h3>

          <div
            style={{
              fontWeight: "500",
              fontSize: "16px",
              color: "#262626",
              marginTop: "10px",
              paddingBottom: "4px",
            }}
          >
            {/* Cards */}
            <div style={{ marginTop: "2px" }}>
              <div className="row">
                {warehouses.map((item) => {
                  const filteredProducts = products.filter(
                    (p) => p.warehouseName === item.warehouseName
                  );
                  const totalStockValue = filteredProducts.reduce(
                    (sum, item) => {
                      const quantity = Number(item.quantity) || 0;
                      const sellingPrice = Number(item.sellingPrice) || 0;
                      return sum + quantity * sellingPrice;
                    },
                    0
                  );
                  return (
                    <div className="col-3" key={item._id}>
                      <div
                        style={{
                          backgroundColor: "white",
                          padding: "10px",
                          borderRadius: "8px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "30px",
                          height: "150px",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={Polygon}
                          alt="Polygon"
                          style={{
                            position: "absolute",
                            bottom: "0",
                            left: "auto",
                            top: "auto",
                            right: "0",
                            width: "100%",
                            height: "50px",
                            zIndex: "0",
                          }}
                        />

                        <img
                          src={Poly}
                          alt="Polygon"
                          style={{
                            position: "absolute",
                            bottom: "0",
                            left: "auto",
                            top: "auto",
                            right: "0",
                            bottom: "auto",
                            left: "0",
                            top: "0",
                            right: "auto",
                            width: "100%",
                            height: "50px",
                            zIndex: "0",
                          }}
                        />

                        <img
                          src={Polygont}
                          alt="Polygon"
                          style={{
                            position: "absolute",
                            bottom: "auto",
                            bottom: "0",
                            left: "0",
                            top: "0",
                            top: "auto",
                            right: "auto",
                            width: "100%",
                            height: "50px",
                            zIndex: "0",
                          }}
                        />

                        <img
                          src={Polygo}
                          alt="Polygon"
                          style={{
                            position: "absolute",
                            bottom: "auto",
                            left: "0",
                            top: "0",
                            right: "auto",
                            width: "100%",
                            height: "50px",
                            zIndex: "0",
                          }}
                        />

                        {/* WH-006 and Heart - Left Side */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            marginBottom: "10px",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          {/* Left: WH-006 */}
                          <div
                            style={{
                              backgroundColor: "#fff",
                              border: "1px solid #e6e6e6",
                              borderRadius: "8px",
                              padding: "10px ",
                              alignItems: "center",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <span>
                              <PiWarehouseFill
                                style={{
                                  color: "#1368EC",
                                  fontSize: "20px",
                                  fontWeight: "bold",
                                }}
                              />
                              <Link to={`/WarehouseDetails/${item._id}`}>
                                {item.warehouseName}
                              </Link>
                            </span>
                          </div>

                          {/* Right: Heart icon */}
                          <div
                            style={{
                              padding: "10px",
                              backgroundColor: "#f1f1f1",
                              borderRadius: "8px",
                              width: "fit-content",
                            }}
                          >
                            <FaHeart
                              onClick={() => toggleFavourite(item)}
                              style={{
                                cursor: "pointer",
                                // color: favourites.some(
                                //   (fav) => fav._id === item._id
                                // )
                                //   ? "red"
                                //   : "#1368EC",
                                // fontWeight: "500",
                                // fontSize: "26px",
                                color: item.isFavorite ? "red" : "#1368EC",
                                fontWeight: "500",
                                fontSize: "26px",
                              }}
                            />
                          </div>
                        </div>

                        {/* Bottom Section (Address + Arrow) */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: "10px",
                            left: "10px",
                            right: "10px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                          }}
                        >
                          {/* Address */}
                          <div>
                            <Link to={`/WarehouseDetails/${item._id}`}>
                              <p style={{ margin: "0", fontWeight: "500" }}>
                                {/* Delhi - Ram Prashad */}
                                {item?.city}
                                &nbsp;-&nbsp;{item?.warehouseOwner}
                                {/* {item?.contactPerson?.lastName} */}
                              </p>
                              <span style={{ color: "#1368EC" }}>
                                ₹{totalStockValue.toLocaleString("en-IN")}
                              </span>
                              <span style={{ marginLeft: "4px", fontSize: "16px", color: "#676767" }}>
                                Stock Valuation
                              </span>
                            </Link>
                          </div>

                          {/* Arrow */}
                          <div>
                            <Link to={`/WarehouseDetails/${item._id}`}>
                              <FaArrowRight />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {warehouses.length === 0 && (
                  <p>No warehouses available yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Warehouse;