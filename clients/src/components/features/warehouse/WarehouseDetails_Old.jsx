import { useState, useEffect, useCallback } from "react";
//npm
import DonutChart from "react-donut-chart";
import { Box, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts";
// icons
import { MdArrowForwardIos } from "react-icons/md";
import { FaSackDollar } from "react-icons/fa6";
import { RiAlertFill } from "react-icons/ri";
import { FaStopCircle } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { PiWarehouseBold } from "react-icons/pi";
import { CiSearch } from "react-icons/ci";
import { IoFilter } from "react-icons/io5";
import { LuArrowUpDown } from "react-icons/lu";
//
import BASE_URL from "../../../pages/config/config";
import axios from "axios";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { he } from "date-fns/locale";
import api from "../../../pages/config/axiosInstance";
//images
import Polygon from "../../../assets/images/Polygon-2.png";
import Poly from "../../../assets/images/Polygon-1.png";
import Polygont from "../../../assets/images/Polygon3.png";
import Polygo from "../../../assets/images/Polygon4.png";

function WarehouseDetails() {
  const [activeTab, setActiveTab] = useState("All");
  const [product, setProducts] = useState([]);

  const { id } = useParams();

  const [bgColor, setBgColor] = useState("");
  const [warehousesDetails, setWarehousesDetails] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [stockHistory, setStockHistory] = useState([]);
  const [activeTabs, setActiveTabs] = useState({});
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTooltips, setShowTooltips] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const token = localStorage.getItem("token");

  const detailsWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      // const token = localStorage.getItem("token");

      const res = await api.get(`/api/warehouse/${id}`); // <- endpoint
      // console.log("diwakar", res.data);

      setWarehousesDetails(res.data.warehouse); // backend: { success, data }

      // Set blocks data from warehouse response
      if (res.data.warehouse.blocks) {
        setBlocks(res.data.warehouse.blocks);
      }
    } catch (err) {
      setError(err);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    detailsWarehouses();
  }, [detailsWarehouses]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/sales");
      const data = res.data.sales;
      // console.log("sales8788qs", data);

      setSales(res.data.sales);
    } catch (err) {
      setSales([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  //for history table

  const fetchPurchases = async () => {
    try {
      const res = await api.get("/api/purchases");
      // console.log("Purchase API response:", res.data);
      setPurchases(res.data.purchases);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      setPurchases([]);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Fetch Stock Movement History
  const fetchStockHistory = async () => {
    // console.log("fetchStockHistory called - starting API request");
    try {
      const res = await api.get("/api/stock-history");
      // console.log("Stock History API response:", res.data);
      // console.log("Stock History logs count:", res.data.logs?.length || 0);
      setStockHistory(res.data.logs || []);
    } catch (error) {
      console.error("Error fetching stock history:", error);
      setStockHistory([]);
    }
  };

  useEffect(() => {
    fetchStockHistory();
  }, []);

  // products fetching

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products");

        // console.log("Products API response:", res.data);

        // ensure array
        const productsArr = Array.isArray(res.data)
          ? res.data
          : res.data.products || [];

        setProducts(productsArr);

        const initialTabs = productsArr.reduce((acc, product) => {
          acc[product._id] = "general";
          return acc;
        }, {});
        setActiveTabs(initialTabs);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchProducts();
  }, []);

  //sales map for top selling products
  const salesMap = sales.reduce((acc, sale) => {
    if (!sale.products || !Array.isArray(sale.products)) return acc; // skip if no products

    sale.products.forEach((p) => {
      if (!p || !p.productId) return; // skip if productId missing

      const pid =
        typeof p.productId === "object" ? p.productId._id : p.productId;
      if (!pid) return;

      if (!acc[pid]) acc[pid] = 0;
      acc[pid] += p.saleQty || 0; // ensure safe number
    });

    return acc;
  }, {});

  // Create a mapping of product ID to warehouse name for efficient lookup
  const productToWarehouseMap = product.reduce((acc, prod) => {
    acc[prod._id] = prod.warehouseName;
    return acc;
  }, {});

  const getId = (ref) => {
    if (!ref) return null;
    if (typeof ref === "string") return ref;
    if (typeof ref === "object") return ref._id || ref.id || null;
    return null;
  };

  const filteredPurchases = purchases.filter((purchase) => {
    let statusMatch = true;
    if (activeTab === "Stock In") statusMatch = purchase.status === "Received";
    else if (activeTab === "Stock Out")
      statusMatch = purchase.status === "Ordered";
    else if (activeTab === "Transfer")
      statusMatch = purchase.status === "Transfer";
    else if (activeTab === "Processing")
      statusMatch = purchase.status === "Processing";

    if (!Array.isArray(purchase.products) || purchase.products.length === 0) {
      return false;
    }

    const warehouseMatch = purchase.products.some((purchaseProduct) => {
      const productId = getId(purchaseProduct?.product);
      if (!productId) return false;

      const productWarehouse = productToWarehouseMap[productId];
      return productWarehouse === warehousesDetails?.warehouseName;
    });

    return statusMatch && warehouseMatch;
  });

  // ✅ Get all products of this warehouse

  //time & date format
  function formatDateTime(dateString) {
    const date = new Date(dateString);

    // Extract hours, minutes, am/pm
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert 0 to 12

    // Format date
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();

    return `${hours}:${minutes} ${ampm} - ${day}-${month}-${year}`;
  }

  //low stock items

  // const lowStockItems = product.filter(
  //   (item) =>
  //     item.warehouseName === warehousesDetails?.warehouseName &&
  //     item.quantity < 2500 &&
  //     item.quantity > 0
  // );
  const lowStockItems = Array.isArray(product)
    ? product.filter(
        (item) =>
          item.warehouseName === warehousesDetails?.warehouseName &&
          item.quantity < (item.quantityAlert || 0) &&
          item.quantity > 0,
      )
    : [];

  //Out of Stock items
  const outOfStockItems = Array.isArray(product)
    ? product.filter(
        (item) =>
          item.warehouseName === warehousesDetails?.warehouseName &&
          item.quantity === 0,
      )
    : [];

  //dougnut chart data
  const filteredProducts = Array.isArray(product)
    ? product.filter(
        (item) => item.warehouseName === warehousesDetails?.warehouseName,
      )
    : [];

  const totalStock = filteredProducts.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0),
    0,
  );

  const sortedProducts = [...filteredProducts].sort(
    (a, b) => (parseFloat(b.quantity) || 0) - (parseFloat(a.quantity) || 0),
  );

  const topProducts = sortedProducts.slice(0, 4);

  const otherProducts = sortedProducts.slice(4);
  const otherTotal = otherProducts.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0),
    0,
  );

  // total initial items
  const totalInitialItems = filteredProducts.reduce((sum, item) => {
    return sum + (parseFloat(item.initialStock) || 0);
  }, 0);

  let chartData = topProducts.map((item) => ({
    label: item.productName,
    value: parseFloat(item.quantity) || 0, // raw quantity
  }));

  if (otherProducts.length > 0) {
    chartData.push({
      label: "Others",
      value: otherTotal, // raw quantity, not percentage
    });
  }

  // ✅ Calculate total revenue for all filtered products
  const totalRevenue = filteredProducts.reduce((sum, item) => {
    const soldUnits = salesMap[item._id] || 0;
    return sum + soldUnits * item.sellingPrice;
  }, 0);

  // ✅ Calculate total stock value: item.quantity * item.sellingPrice
  const totalStockValue = filteredProducts.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const sellingPrice = Number(item.sellingPrice) || 0;
    return sum + quantity * sellingPrice;
  }, 0);

  // total available items
  const totalItems = filteredProducts.reduce((sum, item) => {
    return sum + (item.quantity || 0);
  }, 0);

  //storage
  const [zones, setZones] = useState([]);
  useEffect(() => {
    if (warehousesDetails?.layout?.zones) {
      const zoneCount = Number(warehousesDetails?.layout?.zones || 0);
      const zoneArray = Array.from(
        { length: zoneCount },
        (_, i) => `Zone ${i + 1}`,
      );
      setZones(zoneArray);
    } else {
      setZones([]);
    }
  }, [warehousesDetails]);

  // Function to calculate percentage of cells with assigned products for a specific zone
  const calculateZoneUsagePercentage = (zoneIndex) => {
    if (!blocks || blocks.length === 0) return 0;

    const zoneName = `Zone${zoneIndex + 1}`;
    const zoneData = blocks.find((block) => block.zone === zoneName);

    if (!zoneData || !zoneData.cells || zoneData.cells.length === 0) return 0;

    const totalCells = zoneData.cells.length;
    const occupiedCells = zoneData.cells.filter(
      (cell) =>
        cell.items && Array.isArray(cell.items) && cell.items.length > 0,
    ).length;

    return Math.round((occupiedCells / totalCells) * 100);
  };

  // Function to get unique product names for a specific zone
  const getUniqueProductsForZone = (zoneIndex) => {
    if (!blocks || blocks.length === 0) return [];

    const zoneName = `Zone${zoneIndex + 1}`;
    const zoneData = blocks.find((block) => block.zone === zoneName);

    if (!zoneData || !zoneData.cells || zoneData.cells.length === 0) return [];

    const uniqueProducts = new Set();

    zoneData.cells.forEach((cell) => {
      if (cell.items && Array.isArray(cell.items)) {
        cell.items.forEach((item) => {
          let productName = null;

          // First try to get productName directly from item
          if (item.productName) {
            productName = item.productName;
          }
          // If not found, look up by productId in the products array
          else if (item.productId && Array.isArray(product)) {
            const foundProduct = product.find(
              (p) =>
                p._id === item.productId || p._id === item.productId.toString(),
            );
            if (foundProduct) {
              productName = foundProduct.productName;
            }
          }

          if (productName) {
            uniqueProducts.add(productName);
          }
        });
      }
    });

    return Array.from(uniqueProducts);
  };

  // LineChart Current year months
  const currentYear = new Date().getFullYear();

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const xLabels = months.map((m, i) => `${m} ${currentYear}`);

  const soldItemsPerMonth = xLabels.map((label) => {
    const [monthStr, yearStr] = label.split(" ");
    const month = new Date(`${monthStr} 1, ${yearStr}`).getMonth();
    const year = parseInt(yearStr);

    let totalSold = 0;

    sales.forEach((sale) => {
      const saleDate = new Date(sale.date || sale.createdAt);
      if (saleDate.getMonth() === month && saleDate.getFullYear() === year) {
        if (Array.isArray(sale.products)) {
          sale.products.forEach((p) => {
            const productId = getId(p?.productId);
            if (!productId) return;

            const productWarehouse = productToWarehouseMap[productId];
            if (productWarehouse === warehousesDetails?.warehouseName) {
              totalSold += p.saleQty || 0;
            }
          });
        }
      }
    });

    return totalSold;
  });

  const purchasesItemsPerMonth = months.map((monthStr) => {
    const month = new Date(`${monthStr} 1, ${currentYear}`).getMonth();
    const year = currentYear;
    let totalQuantityChanged = 0;

    // console.log(`Processing month: ${monthStr}, stockHistory length: ${stockHistory.length}`);

    stockHistory.forEach((stockEntry) => {
      const stockDate = new Date(stockEntry.date);
      if (stockDate.getMonth() === month && stockDate.getFullYear() === year) {
        // Filter by warehouse - check if product belongs to current warehouse
        if (stockEntry.product) {
          const productId =
            typeof stockEntry.product === "object"
              ? stockEntry.product._id
              : stockEntry.product;

          const productWarehouse = productToWarehouseMap[productId];

          // console.log(`Stock entry for ${monthStr}: productId=${productId}, warehouse=${productWarehouse}, currentWarehouse=${warehousesDetails?.warehouseName}, quantityChanged=${stockEntry.quantityChanged}`);

          if (productWarehouse === warehousesDetails?.warehouseName) {
            // Use quantityChanged from stock history (positive for purchases, negative for sales/returns)
            const quantityChanged = stockEntry.quantityChanged || 0;
            // Only count positive quantities (purchases/stock in)
            if (quantityChanged > 0) {
              totalQuantityChanged += quantityChanged;
              // console.log(`Added ${quantityChanged} to ${monthStr}, total now: ${totalQuantityChanged}`);
            }
          }
        }
      }
    });

    // console.log(`Final total for ${monthStr}: ${totalQuantityChanged}`);
    return totalQuantityChanged;
  });

  return (
    <div
      className="p-4"
      style={{
        overflowX: "auto",
        overflowY: "auto",
        maxHeight: "calc(100vh - 70px)",
      }}
    >
      {/* Header: line */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center", // Removed duplicate and kept one instance
            gap: "10px",
          }}
        >
          <h2
            style={{
              color: "#676767",
              fontSize: "18px",
              fontWeight: "500",
              margin: 0, // Added to prevent default margin interference
              display: "flex",
              alignItems: "center", // Ensure h2 content aligns with icons
              gap: "10px", // Moved gap here to work with flex
            }}
          >
            Warehouse <MdArrowForwardIos />
            <Link
              style={{ color: "#676767", textDecoration: "none" }}
              to={"/warehouse"}
            >
              All Warehouse
            </Link>
          </h2>
          <span
            style={{
              fontSize: "18px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
            }}
          >
            <MdArrowForwardIos style={{ color: "#676767" }} />{" "}
            <span style={{ fontWeight: "600", color: "black" }}>
              {warehousesDetails?.warehouseName}
            </span>
          </span>
        </div>
        <div>
          <Link to={`/Godown/${id}`}>
            <button
              style={{
                backgroundColor: "#1368EC",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Assign Product
            </button>
          </Link>
        </div>
      </div>

      {/* Top Cards */}
      <div className="d-flex flex-wrap g-3 mb-3">
        {/* Card 1 */}
        <div className="col-4" style={{ paddingRight: "30px" }}>
          <div
            className="d-flex justify-content-between align-items-center bg-white position-relative h-100"
            style={{
              padding: "16px 24px 16px 16px",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
              boxShadow: "0px 1px 4px rgba(0,0,0,0.10)",
            }}
          >
            {/* Left Border */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "4px",
                height: "70%",
                background: "#1F7FFF",
                borderRadius: "0px 10px 10px 0px",
              }}
            />

            {/* Content */}
            <div className="d-flex flex-column gap-2">
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#727681",
                }}
              >
                Total Stock Value
              </span>

              <h4
                className="mb-0"
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#0E101A",
                }}
              >
                ₹{totalStockValue.toLocaleString("en-IN")}
              </h4>
            </div>

            {/* Icon */}
            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                border: "1px solid #E5F0FF",
                background: "#fff",
                color: "#1F7FFF",
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              <RiAlertFill />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="col-4" style={{ paddingRight: "30px" }}>
          <div
            className="d-flex justify-content-between align-items-center bg-white position-relative h-100"
            style={{
              padding: "16px 24px 16px 16px",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
              boxShadow: "0px 1px 4px rgba(0,0,0,0.10)",
            }}
          >
            {/* Left Border */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "4px",
                height: "70%",
                background: "#1F7FFF",
                borderRadius: "0px 10px 10px 0px",
              }}
            />

            {/* Content */}
            <div className="d-flex flex-column gap-2">
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#727681",
                }}
              >
                Low Stock
              </span>

              <h4
                className="mb-0"
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#0E101A",
                }}
              >
                {lowStockItems.length}
              </h4>
            </div>

            {/* Icon */}
            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                border: "1px solid #E5F0FF",
                background: "#fff",
                color: "#1F7FFF",
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              <FaStopCircle />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="col-4" style={{}}>
          <div
            className="d-flex justify-content-between align-items-center bg-white position-relative h-100"
            style={{
              padding: "16px 24px 16px 16px",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
              boxShadow: "0px 1px 4px rgba(0,0,0,0.10)",
            }}
          >
            {/* Left Border */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: "4px",
                height: "70%",
                background: "#1F7FFF",
                borderRadius: "0px 10px 10px 0px",
              }}
            />

            {/* Content */}
            <div className="d-flex flex-column gap-2">
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#727681",
                }}
              >
                Out Of Stock
              </span>

              <h4
                className="mb-0"
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#0E101A",
                }}
              >
                {outOfStockItems.length}
              </h4>
            </div>

            {/* Icon */}
            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                border: "1px solid #E5F0FF",
                background: "#fff",
                color: "#1F7FFF",
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              <FaSackDollar />
            </div>
          </div>
        </div>
      </div>

      {/* warehouse details */}
      <div
        style={{
          marginTop: "15px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "10px 16px",
        }}
      >
        <div style={{ gap: "10px", marginBottom: "20px" }}>
          <span style={{ color: "black", fontWeight: "400", fontSize: "16px" }}>
            Warehouse Name
          </span>
          <br />
          <span
            style={{ color: "#676767", fontWeight: "400", fontSize: "16px" }}
          >
            {/* Wh-001 */}
            {warehousesDetails?.warehouseName}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <span
              style={{ color: "black", fontWeight: "400", fontSize: "16px" }}
            >
              Owner
            </span>
            <br />
            <span
              style={{ color: "#676767", fontWeight: "400", fontSize: "16px" }}
            >
              {/* Ajay Kumar */}
              {warehousesDetails?.warehouseOwner}
            </span>
          </div>

          <div>
            <span
              style={{ color: "black", fontWeight: "400", fontSize: "16px" }}
            >
              Branch
            </span>
            <br />
            <span
              style={{ color: "#676767", fontWeight: "400", fontSize: "16px" }}
            >
              {/* Pune */}
              {warehousesDetails?.city}
            </span>
          </div>

          <div>
            <span
              style={{ color: "black", fontWeight: "400", fontSize: "16px" }}
            >
              Contact No
            </span>
            <br />
            <span
              style={{ color: "#676767", fontWeight: "400", fontSize: "16px" }}
            >
              {/* Ajay Kumar */}
              {warehousesDetails?.phone}
            </span>
          </div>

          <div>
            <span
              style={{ color: "black", fontWeight: "400", fontSize: "16px" }}
            >
              Total Available Item
            </span>
            <br />
            <span
              style={{ color: "#676767", fontWeight: "400", fontSize: "16px" }}
            >
              <b>{totalItems}</b>
            </span>
          </div>
        </div>
      </div>

      {/* Dougnut & chart js */}
      <div style={{ display: "flex", gap: "24px" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            padding: "16px",
            gap: "16px",
            marginTop: "20px",
            width: "291.76px",
            height: "519.76px",
          }}
        >
          <span
            style={{ color: "#262626", fontWeight: "500", fontSize: "16px" }}
          >
            Storage
          </span>
          <br />
          <div>
            <span
              style={{ color: "#262626", fontWeight: "400", fontSize: "16px" }}
            >
              Capacity : {totalInitialItems}
            </span>
            <br />
            <span
              style={{ color: "#1368ec", fontWeight: "400", fontSize: "16px" }}
            >
              {parseFloat(
                (100 - ((totalItems / totalInitialItems) * 100 || 0)).toFixed(
                  2,
                ),
              )}
              % Left
            </span>
          </div>

          {/* Donut Chart */}
          <DonutChart
            data={chartData}
            colors={["#B8D2F9", "#4286F0", "#A1C3F7", "#B8D2F9", "#D0E1FB"]}
            width={220}
            height={250}
            legend={false}
            interactive={true}
            formatValues={(value) => {
              if (!totalInitialItems) return "0%";
              return `${Math.round((value / totalInitialItems) * 100)}%`;
            }}
            strokeColor="#fff"
            strokeWidth={4}
            style={{
              margin: "20px auto 0",
              display: "block",
            }}
          />
          <div
            style={{
              justifyContent: "center",
              gap: "12px",
              marginTop: "12px",
            }}
          >
            {chartData.map((item, index) => (
              <div
                key={index}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    backgroundColor: [
                      "#B8D2F9",
                      "#4286F0",
                      "#A1C3F7",
                      "#B8D2F9",
                      "#D0E1FB",
                    ][index],
                    borderRadius: "2px",
                  }}
                />
                <span style={{ fontSize: "14px", color: "#262626" }}>
                  {item.label} (
                  {((item.value / totalInitialItems) * 100).toFixed(0, 2)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Line Chart */}
        <div style={{ width: "100%" }}>
          <Box
            sx={{
              width: "auto",
              height: "520px",
              borderRadius: "8px",
              padding: "24px",
              gap: "8px",
              backgroundColor: "#fff",
              marginTop: "20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            {/* Header */}
            <Typography sx={{ fontSize: "16px", fontWeight: 500 }}>
              Sales Activity
            </Typography>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 400,
                color: "#1976d2",
                mb: 2,
              }}
            >
              ₹{totalRevenue.toLocaleString("en-IN")}
            </Typography>

            {/* Chart */}
            <LineChart
              xAxis={[
                {
                  scaleType: "point",
                  data: xLabels,
                  axisLine: false,
                  tickSize: 0,
                },
              ]}
              yAxis={[
                {
                  axisLine: { display: false },
                  tickSize: 0,
                  min: 0,
                  max: Math.max(...soldItemsPerMonth, 500),
                  gridLine: { style: { stroke: "#e0e0e0" } }, // light horizontal grid
                },
              ]}
              series={[
                {
                  id: "sold",
                  label: "Sold Items",
                  data: soldItemsPerMonth,
                  color: "#90caf9",
                  curve: "catmullRom",
                  showMark: false,
                  lineStyle: {
                    strokeDasharray: "6 6",
                    strokeWidth: 2,
                  },
                },
                {
                  id: "purchased",
                  label: "Purchase Items",
                  data: purchasesItemsPerMonth,
                  color: "#1976d2",
                  curve: "catmullRom",
                  showMark: false,
                  lineStyle: {
                    strokeWidth: 2,
                  },
                },
              ]}
              height={300}
              legend={{
                position: { vertical: "top", horizontal: "right" },
              }}
              grid={{ vertical: false }}
            />
          </Box>
        </div>
      </div>

      {/* Top Selling Products */}
      <div
        style={{
          backgroundColor: "#fff",
          marginTop: "20px",
          borderRadius: "8px",
          gap: "8px",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e6e6e6",
            font: "robot",
            fontWeight: "500",
            fontSize: "18px",
            color: "#262626",
          }}
        >
          <span>Top Selling Products</span>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table
            className="table datatable"
            // style={{
            //   width: "100%",
            //   borderCollapse: "collapse",
            //   backgroundColor: "#fff",
            //   padding: "16px 24px",
            // }}
          >
            <thead className="thead-light">
              <tr
              // style={{
              //   color: "#676767",
              //   fontFamily: "roboto",
              //   fontSize: "16px",
              //   fontWeight: "400",
              // }}
              >
                <th
                  style={{ padding: "12px 24px", display: "flex", gap: "20px" }}
                >
                  {/* <input type="checkbox" /> */}Product
                </th>
                <th style={{ padding: "12px 24px" }}>SKU</th>
                <th style={{ padding: "12px 24px" }}>MRP</th>
                <th style={{ padding: "12px 24px" }}>Available Quantity</th>
                <th style={{ padding: "12px 24px" }}>Unit Sold</th>
                <th style={{ padding: "12px 24px" }}>Revenue</th>
              </tr>
            </thead>

            <tbody>
              {product
                .filter(
                  (item) =>
                    item.warehouseName === warehousesDetails?.warehouseName,
                ) // filter by warehouse
                .sort((a, b) => (salesMap[b._id] || 0) - (salesMap[a._id] || 0))
                .slice(0, 5) // limit to 5 products
                .map((item, idx) => {
                  const soldUnits = salesMap[item._id] || 0; // total sold across all sales
                  return (
                    <tr key={idx} style={{ cursor: "pointer" }}>
                      <td
                        style={{
                          padding: "12px 24px",
                          borderBottom: "1px solid #e6e6e6",
                          display: "flex",
                          gap: "20px",
                        }}
                      >
                        {/* <input type="checkbox" /> */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            width: "50px",
                            justifyContent: "center",
                            height: "50px",
                            border: "1px solid #e6e6e6",
                            borderRadius: "8px",
                            padding: "5px",
                          }}
                        >
                          <img
                            src={item.images[0]?.url}
                            alt=""
                            style={{
                              width: "35px",
                            }}
                          />
                        </div>
                        {item.productName}
                      </td>
                      <td
                        style={{
                          padding: "12px 24px",
                          borderBottom: "1px solid #e6e6e6",
                        }}
                      >
                        {item.sku}
                      </td>
                      <td
                        style={{
                          padding: "12px 24px",
                          borderBottom: "1px solid #e6e6e6",
                        }}
                      >
                        {item.sellingPrice}
                      </td>
                      <td
                        style={{
                          padding: "12px 24px",
                          borderBottom: "1px solid #e6e6e6",
                        }}
                      >
                        {item.quantity} {item.unit}
                      </td>
                      <td
                        style={{
                          padding: "12px 24px",
                          borderBottom: "1px solid #e6e6e6",
                        }}
                      >
                        {soldUnits}
                      </td>
                      <td
                        style={{
                          padding: "12px 24px",
                          borderBottom: "1px solid #e6e6e6",
                        }}
                      >
                        ₹{soldUnits * item.sellingPrice}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zones */}
      <div
        style={{
          marginTop: "20px",
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0px 0px 8px 3px #0000001A",
          padding: "16px",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "0px 0px 20px 0px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 500,
              color: "#262626",
            }}
          >
            Zones
          </span>
        </div>

        {/* Cards */}
        <div className="d-flex flex-wrap g-3 mb-3">
          {[1, 2, 3, 4].map((item, idx) => (
            <div className="col-3 p-2" key={idx}>
              <div
                style={{
                  backgroundColor: "#fff",
                  borderRadius: "12px",
                  padding: "16px",
                  height: "170px",
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "0px 1px 4px rgba(0,0,0,0.10)",
                  border: "1px solid #E5F0FF",
                }}
              >
                {/* Bottom Shape */}
                <img
                  src={Polygon}
                  alt=""
                  style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "100%",
                    height: "50px",
                    zIndex: 0,
                  }}
                />

                {/* Top Shape */}
                <img
                  src={Polygont}
                  alt=""
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "50px",
                    zIndex: 0,
                  }}
                />

                {/* Top */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    position: "relative",
                    zIndex: 2,
                  }}
                >
                  {/* Zone Name */}
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #E5F0FF",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <PiWarehouseBold
                      style={{
                        color: "#1368EC",
                        fontSize: "18px",
                      }}
                    />

                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#0E101A",
                      }}
                    >
                      Zone {idx + 1}
                    </span>
                  </div>

                  {/* Percentage */}
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "#1368EC",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    75%
                  </div>
                </div>

                {/* Bottom */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "16px",
                    left: "16px",
                    right: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "end",
                    zIndex: 2,
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#0E101A",
                      }}
                    >
                      Storage Utilization
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "4px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: "#F3F8FF",
                          color: "#1368EC",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        Electronics
                      </span>

                      <span
                        style={{
                          background: "#F3F8FF",
                          color: "#1368EC",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: 500,
                        }}
                      >
                        Grocery
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "#F8FAFC",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <FaArrowRight
                      style={{
                        color: "#1368EC",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Movement History */}
      <div
        style={{
          backgroundColor: "#fff",
          marginTop: "20px",
          borderRadius: "8px",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e6e6e6",
            fontWeight: "500",
            fontSize: "18px",
            color: "#262626",
          }}
        >
          <div
            style={{
              font: "robot",
              fontWeight: "500",
              fontSize: "18px",
              color: "#262626",
            }}
          >
            <span>Stock Movement history</span>
            {/* <div
              style={{
                borderRadius: "4px",
                border: "1px solid #e6e6e6",
                backgroundColor: "#ffffff",
                padding: "6px",
                gap: "8px",
              }}
            >
              <select
                name=""
                id=""
                style={{
                  border: "none",
                  fontWeight: "400",
                  color: "#676767",
                  fontSize: "16px",
                }}
              >
                <option value="Warehouse">Select Warehouse</option>
              </select>
            </div> */}
          </div>
        </div>

        <div
          style={{
            padding: "8px 24px",
            gap: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: "16px" }}>
            <span
              style={{
                fontFamily: "Roboto",
                fontWeight: "400",
                color: activeTab === "All" ? "#1A6FED" : "#262626",
                cursor: "pointer",
                backgroundColor: activeTab === "All" ? "#d1d1d1" : "#F1F1F1",
                fontSize: "14px",
                borderRadius: "8px",
                border: "1px solid #e6e6e6",
                padding: "7px 10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onClick={() => setActiveTab("All")}
            >
              All
            </span>

            <span
              style={{
                fontFamily: "Roboto",
                fontWeight: "400",
                color: activeTab === "Stock In" ? "#1A6FED" : "#262626",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "Stock In" ? "#d1d1d1" : "#F1F1F1",
                fontSize: "14px",
                borderRadius: "8px",
                border: "1px solid #e6e6e6",
                padding: "7px 10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onClick={() => setActiveTab("Stock In")}
            >
              Stock In
            </span>

            <span
              style={{
                fontFamily: "Roboto",
                fontWeight: "400",
                fontSize: "14px",
                color: activeTab === "Stock Out" ? "#1A6FED" : "#262626",
                cursor: "pointer",
                backgroundColor:
                  activeTab === "Stock Out" ? "#d1d1d1" : "#F1F1F1",
                borderRadius: "8px",
                border: "1px solid #e6e6e6",
                padding: "7px 10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
              onClick={() => setActiveTab("Stock Out")}
            >
              Stock Out
            </span>
          </div>
        </div>

        {/* Table */}
        <div>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#fff",
            }}
          >
            <thead style={{ backgroundColor: "#f1f1f1" }}>
              <tr
                style={{
                  color: "#676767",
                  fontFamily: "Roboto, sans-serif",
                  fontSize: "16px",
                  fontWeight: "400",
                }}
              >
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "left",
                    display: "flex",
                    gap: "20px",
                  }}
                >
                  Product
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Time
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>QTY</th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Movement type
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Source/Destination
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left" }}>
                  Reference/Note
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPurchases.slice(0, 5).map((purchase) => (
                <tr key={purchase._id} style={{ cursor: "pointer" }}>
                  <td
                    style={{
                      padding: "12px 24px",
                      borderBottom: "1px solid #e6e6e6",
                      display: "flex",
                      gap: "20px",
                    }}
                  >
                    <img
                      src={purchase.products[0]?.product?.images[0]?.url}
                      alt=""
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "4px",
                        border: "1px solid #f1f1f1",
                        backgroundColor: "#D9D9D9",
                      }}
                    />
                    {purchase.products[0]?.product?.productName
                      ? purchase.products[0]?.product?.productName
                      : "N/A"}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      borderBottom: "1px solid #e6e6e6",
                    }}
                  >
                    {formatDateTime(purchase.createdAt)}
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      borderBottom: "1px solid #e6e6e6",
                    }}
                  >
                    {purchase.products[0]?.product?.quantity}
                  </td>
                  <td
                    style={{ borderBottom: "1px solid #ddd", padding: "8px" }}
                  >
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: "500",
                        color:
                          purchase.status === "Ordered" ? "#DFFFE0" : "#FCE4E6",
                        backgroundColor:
                          purchase.status === "Ordered" ? "#2bAE66" : "#D64550",
                      }}
                    >
                      {purchase.status}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      borderBottom: "1px solid #e6e6e6",
                    }}
                  >
                    {purchase.supplier
                      ? `${purchase.supplier.firstName} ${purchase.supplier.lastName}`
                      : "N/A"}{" "}
                    ({purchase.supplier?.supplierCode || "N/A"})
                  </td>
                  <td
                    style={{
                      padding: "12px 24px",
                      borderBottom: "1px solid #e6e6e6",
                    }}
                  >
                    {purchase.referenceNumber}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const tagStyle = {
  fontWeight: "400",
  fontSize: "14px",
  color: "#262626",
  padding: "4px 8px",
  border: "1px solid #e6e6e6",
  backgroundColor: "#f1f1f1",
  borderRadius: "8px",
};

export default WarehouseDetails;
