import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { Bar } from "react-chartjs-2";
import { he } from "date-fns/locale";

// pages
import "../../../styles/style.css";
import "../../../styles/Responsive.css";
import "../../../styles/Dashboard.css";
import axios from "axios";
import Graph from "../../Graph";
import BASE_URL from "../../../pages/config/config";
import PaymentStatusChart from "../graph/PaymentStatusChart";
import SalesGraph from "../graph/SalesGraph";
import api from "../../../pages/config/axiosInstance";
import { useAuth } from "../../auth/AuthContext";
import DateFilterDropdown from "../../DateFilterDropdown";

// icons
import { TbAlertTriangle, TbBox, TbBrandPocket, TbChartPie, TbFileText, TbGift, TbHash, TbInfoCircle, TbLifebuoy, TbRepeat, TbShoppingCart, TbUserCheck, TbUsers, } from "react-icons/tb";
import { RiArrowDownSLine } from "react-icons/ri";
import { FaLayerGroup } from "react-icons/fa";
import { FcExpired } from "react-icons/fc";
import { getTotalStockValue } from "../../../utils/getTotalStockValue";
import { GrTransaction } from "react-icons/gr";
import { MdUpdate } from "react-icons/md";

// images
// import NoImg from "../../../assets/img/no_user.png";
import NoImg from "../../../assets/images/product-default.png";
import dashcard_icon1 from "../../../assets/images/dashcard-1.png";
import dashcard_icon2 from "../../../assets/images/dashcard-2.png";
import dashcard_icon3 from "../../../assets/images/dashcard-3.png";
import dashcard_icon4 from "../../../assets/images/dashcardd-4.png";
import dashcard_icon5 from "../../../assets/images/dashcard-5.png";
import dashcard_icon6 from "../../../assets/images/dashcard-6.png";
import dashcard_icon7 from "../../../assets/images/dashcard-7.png";
import dashcard_icon8 from "../../../assets/images/dashcard-8.png";
import advertisment_ims from "../../../assets/images/munc-dahsboard-img.png";
import i_icon from "../../../assets/images/i.png";
import time from "../../../assets/images/time.png";
import select_range_date from "../../../assets/images/select-date.png";
import p_1 from "../../../assets/images/p-1.png";
import p_2 from "../../../assets/images/p-2.png";
import p_3 from "../../../assets/images/p-3.png";
import p_4 from "../../../assets/images/p-4.png";
import p_5 from "../../../assets/images/p-5.png";
import adevertisements from "../../../assets/images/Advertisements.png";
import noData from "../../../assets/images/no-data.png";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
);

const data = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Retailer",
      data: [90, 50, 150, 60, 120, 70, 150, 100], // from your image
      borderColor: "#00a76f",
      backgroundColor: "#00a76f",
      fill: false,
      pointRadius: 4,
      pointBackgroundColor: "#00a76f",
      pointBorderWidth: 0,
    },
  ],
};

const datas = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Total Sales",
      data: [90, 50, 150, 60, 120, 70, 150, 100], // from your image
      borderColor: "#7313AA",
      backgroundColor: "#7313AA",
      fill: false,
      pointRadius: 4,
      pointBackgroundColor: "#7313AA",
      pointBorderWidth: 0,
    },
    {
      label: "Profit Earned",
      data: [50, 80, 30, 5, 140, 170, 70], // from your image
      borderColor: "#EE23B1",
      backgroundColor: "#EE23B1",
      fill: false,
      pointRadius: 4,
    },
  ],
};

const options = {
  responsive: true,
  plugins: {
    legend: { display: false },
  },

  scales: {
    x: {
      grid: { display: false },
      ticks: {
        color: "#727681",
        font: { size: 14, family: "Inter", weight: 500 },
      },
    },
    y: {
      border: {
        display: false,
      },
      position: "right",
      grid: { display: false },
      min: 0,
      max: 200,
      ticks: {
        stepSize: 50,
        color: "#727681",
        font: {
          size: 14,
          weight: 500,
          family: "Inter",
        },
        callback: (value) => `₹${value}k`,
      },
    },
  },
};

const datasThree = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  datasets: [
    {
      label: "Purchase Orders",
      data: [90, 160, 180, 110, 100, 150, 60],
      backgroundColor: "#F9E2D9",
      borderRadius: 4,

      barPercentage: 0.8,
      categoryPercentage: 0.5,
    },
    {
      label: "Sales Orders",
      data: [140, 10, 50, 100, 200, 190, 150],
      backgroundColor: "#FF8F1F",
      borderRadius: 4,
      barPercentage: 0.8,
      categoryPercentage: 0.5,
    },
  ],
};

const optionssThree = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false, // remove axis border
      },
      ticks: {
        color: "#6C748C",
        font: {
          size: 14,
          weight: 500,
          family: "Inter",
        },
      },
    },
    y: {
      border: {
        display: false,
      },
      position: "right",
      grid: {
        display: false,
        drawBorder: false, // remove axis border
      },
      min: 0,
      max: 200,
      ticks: {
        stepSize: 50,
        color: "#6C748C",
        font: {
          size: 14,
          weight: 500,
          family: "Inter",
        },
        callback: (value) => `₹${value}k`,
      },
    },
  },
};

// const trackPurchaseOrder = [
//   {
//     supplier: "WeaveX Fabrics",
//     deliverIn: "23 Days",
//     status: "Processing",
//     total: "₹1,485.22/-",
//   },
//   {
//     supplier: "WeaveX Fabrics",
//     deliverIn: "23 Days",
//     status: "Delivered",
//     total: "₹1,485.22/-",
//   },
//   {
//     supplier: "WeaveX Fabrics",
//     deliverIn: "23 Days",
//     status: "Cancelled",
//     total: "₹1,485.22/-",
//   },
//   {
//     supplier: "WeaveX Fabrics",
//     deliverIn: "23 Days",
//     status: "Processing",
//     total: "₹1,485.22/-",
//   },
//   {
//     supplier: "WeaveX Fabrics",
//     deliverIn: "23 Days",
//     status: "Cancelled",
//     total: "₹1,485.22/-",
//   },
// ];

const AdminDashboard = () => {
  const { user } = useAuth();
  // const { t } = useTranslation();
  //transaction
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sale");
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [activeTransactionTab, setActiveTransactionTab] = useState("sales");
  const [notificationCount, setNotificationCount] = useState(0);
  const userObj = user;
  const userId = userObj?.id || userObj?._id; // Handle both id and _id
  const [totalInvoiceDue, setTotalInvoiceDue] = useState(0);
  const [invoiceDueCount, setInvoiceDueCount] = useState(0);
  const [invoiceDueGrowth, setInvoiceDueGrowth] = useState(0);
  const [totalPurchaseReturnValue, setTotalPurchaseReturnValue] = useState(0);
  const [totalSupplier, setTotalSupplier] = useState(0);
  const [totalCustomer, setTotalCustomer] = useState(0);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [totalStockValue, setTotalStockValue] = useState(0);
  const [totalReturnAmount, setTotalReturnAmount] = useState(0);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [totalSaleValue, setTotalSaleValue] = useState(0);
  const [totalSalesReturnValue, setTotalSalesReturnValue] = useState(0);
  const [totalDebitNoteAmount, setTotalDebitNoteAmount] = useState(0);
  const [totalDebitNoteCount, setTotalDebitNoteCount] = useState(0);
  const [totalExpensesAmount, setTotalExpensesAmount] = useState(0);
  const [totalExpensesCount, setTotalExpensesCount] = useState(0);

  // Add these with your other state variables
  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const buildDateQueryParams = () => {
    if (selectedDateRange.startDate && selectedDateRange.endDate) {
      const formatDate = (date) => {
        return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
      };

      return `startDate=${formatDate(selectedDateRange.startDate)}&endDate=${formatDate(selectedDateRange.endDate)}`;
    }
    return "";
  };

  const [last7DaysInventoryValue, setLast7DaysInventoryValue] = useState(0);
  const [last7DaysTotalOrderAmount, setLast7DaysTotalOrderAmount] = useState(0);
  const [last7DaysAvgSelling, setLast7DaysAvgSelling] = useState(0);
  const [last7DaysDuePayments, setLast7DaysDuePayments] = useState(0);
  const [last7DaysNewlyAdded, setLast7DaysNewlyAdded] = useState(0);
  const [last7DaysLowStocks, setLast7DaysLowStocks] = useState(0);
  const [last7DaysOutOfStocks, setLast7DaysOutOfStocks] = useState(0);
  const [last7DaysTotalSaleOrders, setLast7DaysTotalSaleOrders] = useState(0);

  // for recent orders
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [retailSales, setRetailSales] = useState([]);
  const [products, setProducts] = useState([]);
  //Total Inventry Value
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [warned, setWarned] = useState(false);
  const [allSales, setAllSales] = useState([]);
  const [allPurchases, setAllPurchases] = useState([]);
  // console.log("All Sales:", allPurchases);
  const [allSalesReturns, setAllSalesReturns] = useState([]);
  const [allPurchaseReturns, setAllPurchaseReturns] = useState([]);
  // Separate time filters for each section
  const [recentSalesFilter, setRecentSalesFilter] = useState("weekly");
  const [topSellingFilter, setTopSellingFilter] = useState("weekly");
  const [recentTransactionsFilter, setRecentTransactionsFilter] =
    useState("weekly");
  const [newlyAddedProducts, setNewlyAddedProducts] = useState([]);
  const [avgSelling, setAvgSelling] = useState(0);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);

  const filteredSales = recentSales.filter((sale) => {
    if (!sale.createdAt) return false;
    const saleDate = new Date(sale.createdAt);
    const now = new Date();
    if (recentSalesFilter === "today") {
      return saleDate.toDateString() === now.toDateString();
    }
    if (recentSalesFilter === "weekly") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return saleDate >= oneWeekAgo && saleDate <= now;
    }
    if (recentSalesFilter === "monthly") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return saleDate >= oneMonthAgo && saleDate <= now;
    }
    return true;
  });

  // Helper to get absolute loss value
  const getLoss = () => {
    const profit = getProfit();
    return profit < 0 ? Math.abs(profit) : 0;
  };

  // Profit/Loss calculation based on price and quantity
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const dateParams = buildDateQueryParams();
        // const res = await api.get("/api/products");
        const res = await api.get(
          `/api/products${dateParams ? `?${dateParams}` : ""}`,
        );
        const products = res.data.products || res.data || [];

        // ⭐ TOTAL INVENTORY VALUE
        const totalValue = products.reduce((sum, p) => {
          const qty = Number(p.quantity) || 0;
          const price = Number(p.sellingPrice) || 0;
          return sum + qty * price;
        }, 0);
        setTotalInventoryValue(totalValue);

        // ⭐ EXPIRED PRODUCT LOGIC
        const expired = products.filter((product) => {
          const expiryArr =
            product.variants?.get?.("Expire") || product.variants?.["Expire"];

          if (!expiryArr || expiryArr.length === 0) return false;

          return expiryArr.some((dateStr) => {
            const [day, month, year] = dateStr.split("-").map(Number);
            if (!day || !month || !year) return false;

            const expDate = new Date(year, month - 1, day);
            const today = new Date();

            return expDate < today;
          });
        });
        setExpiredProducts(expired);

        // ⭐ NEWLY ADDED PRODUCTS (Last 3 Days)
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        const newlyAdded = products.filter((p) => {
          if (!p.createdAt) return false;
          const created = new Date(p.createdAt);
          return created >= threeDaysAgo && created <= today;
        });
        setNewlyAddedProducts(newlyAdded);

        // ⭐ AVERAGE SELLING PRICE
        let count = products.length;
        let totalSellingPrice = products.reduce((sum, p) => {
          return sum + (Number(p.sellingPrice) || 0);
        }, 0);
        let average = count > 0 ? totalSellingPrice / count : 0;
        setAvgSelling(Math.round(average));
        // console.log("All product for out-of-stock check:", products)

        // ⭐ OUT OF STOCK PRODUCTS
        const outOfStock = products.filter(
          (p) => Number(p.stockQuantity) === 0,
        );
        setOutOfStockProducts(outOfStock);
      } catch (err) {
        setExpiredProducts([]);
        setNewlyAddedProducts([]);
        setOutOfStockProducts([]);
      } finally {
        setExpiredLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ============= FETCH PRODUCTS FOR LOW STOCKS AND OUT OF STOCKS =============
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const response = await api.get("/api/products");
        const productsData = response.data?.products || response.data || [];
        setProducts(Array.isArray(productsData) ? productsData : []);

        // Calculate low stocks and out of stocks from all products
        const lowStock = productsData.filter(p => {
          const stock = Number(p.stockQuantity || p.quantity || 0);
          const minStock = Number(p.minStockToMaintain || 0);
          return stock > 0 && stock <= minStock;
        });

        const outOfStock = productsData.filter(p =>
          Number(p.stockQuantity || p.quantity || 0) === 0
        );

        setLowStockProducts(lowStock);
        setOutOfStockProducts(outOfStock);
        setLast7DaysLowStocks(lowStock.length);
        setLast7DaysOutOfStocks(outOfStock.length);

      } catch (error) {
        // console.error("Error fetching products:", error);
        setProducts([]);
        setLowStockProducts([]);
        setOutOfStockProducts([]);
        setLast7DaysLowStocks(0);
        setLast7DaysOutOfStocks(0);
      }
    };

    fetchProductsData();
  }, []); // Run once on mount

  const filteredPurchases = recentPurchases.filter((purchase) => {
    if (!purchase.createdAt) return false;
    const purchaseDate = new Date(purchase.createdAt);
    const now = new Date();
    if (recentTransactionsFilter === "today") {
      return purchaseDate.toDateString() === now.toDateString();
    }
    if (recentTransactionsFilter === "weekly") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return purchaseDate >= oneWeekAgo && purchaseDate <= now;
    }
    if (recentTransactionsFilter === "monthly") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return purchaseDate >= oneMonthAgo && purchaseDate <= now;
    }
    return true;
  });

  const getProfit = () => {
    // Calculate total purchase cost
    let totalPurchase = 0;
    if (Array.isArray(filteredPurchases)) {
      filteredPurchases.forEach((purchase) => {
        if (Array.isArray(purchase.products)) {
          purchase.products.forEach((prod) => {
            totalPurchase +=
              (Number(prod.purchasePrice) || 0) * (Number(prod.quantity) || 0);
          });
        }
      });
    }
    // Calculate total sales revenue
    let totalSales = 0;
    if (Array.isArray(filteredSales)) {
      filteredSales.forEach((sale) => {
        if (Array.isArray(sale.products)) {
          sale.products.forEach((prod) => {
            totalSales +=
              (Number(prod.sellingPrice) || 0) * (Number(prod.saleQty) || 0);
          });
        }
      });
    }
    // Profit = Total Sales - Total Purchase
    return totalSales - totalPurchase;
  };

  const getLastSevenDaysRange = () => {
    if (selectedDateRange.startDate && selectedDateRange.endDate) {
      return {
        start: selectedDateRange.startDate,
        end: selectedDateRange.endDate,
      };
    }
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); //start of the day
    // Set now to today at 23:59:59.999 local time
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    return { start: sevenDaysAgo, end: todayEnd };
  };

  const topSellingProducts = useMemo(() => {
    try {
      const productSales = {};
      const { start, end } = getLastSevenDaysRange();

      // Filter sales from last 7 days
      const filteredSales = sales.filter((sale) => {
        if (!sale.invoiceDate) return false;
        const saleDate = new Date(sale.invoiceDate);
        return saleDate >= start && saleDate <= end;
      });

      // console.log("Sales in last 7 days", filteredSales.length);

      // if no sales in last 7 days, return empty array
      if (filteredSales.length === 0) {
        // console.log("No sales found in last 7 days");
        return [];
      }

      // Aggregate product sales from filtered sales
      filteredSales.forEach((sale) => {
        if (Array.isArray(sale.items)) {
          sale.items.forEach((item) => {
            // console.log("Processing item:", item);
            // Use productName as the identifier since we don't have product ID
            const key = item.productName || "Unknown Product";

            // Extract data from the item object
            const name = item.productName || "Unknown Product";
            const sku = item.itemBarcode || item.hsn || "N/A";
            const sellingPrice = Number(item.unitPrice || 0);
            const quantity = Number(item.qty || 0);

            // Get product image
            let image = NoImg;
            let purchasePrice = 0;

            // Try to find the product in existing products array to get image
            if (item.productName && products.length > 0) {
              const foundProduct = products.find(
                (p) =>
                  p.name === item.productName ||
                  p.productName === item.productName ||
                  p.productName?.toLowerCase() ===
                  item.productName?.toLowerCase(),
              );

              if (foundProduct) {
                if (foundProduct.images && foundProduct.images.length > 0) {
                  image = foundProduct.images[0].url;
                } else if (foundProduct.productImage) {
                  image = foundProduct.productImage;
                } else if (foundProduct.image) {
                  image = foundProduct.image;
                }
                // get purchase price
                purchasePrice = Number(
                  foundProduct.purchasePrice || foundProduct.price || 0,
                );
              }
            }

            // calculate profit
            const profitPerUnit = sellingPrice - purchasePrice;
            const totalProfit = profitPerUnit * quantity;

            if (!productSales[key]) {
              productSales[key] = {
                id: key,
                name,
                sku,
                sellingPrice,
                purchasePrice,
                sellQuantity: quantity,
                image,
                totalRevenue: sellingPrice * quantity,
                totalProfit: totalProfit,
                profitPerUnit: profitPerUnit,
              };
            } else {
              productSales[key].sellQuantity += quantity;
              productSales[key].totalRevenue += sellingPrice * quantity;
              productSales[key].totalProfit += totalProfit;
            }
          });
        }
      });

      // Convert to array, sort by quantity sold (descending), and take top 5
      const sortedProducts = Object.values(productSales)
        .filter((p) => p.sellQuantity > 0)
        .sort((a, b) => b.sellQuantity - a.sellQuantity)
        .slice(0, 5);

      // console.log("calculated top selling product", sortedProducts);
      return sortedProducts;
    } catch (error) {
      console.error("Error calculating top selling products:", error);
      return [];
    }
  }, [sales, products, selectedDateRange]); // Recalculate when sales or products change

  // Calculate latest sale time for the update timestamp
  const latestTopSaleTime = useMemo(() => {
    if (sales.length === 0) return null;

    // Filter sales from last 7 days
    const { start, end } = getLastSevenDaysRange();
    const filteredSales = sales.filter((sale) => {
      if (!sale.invoiceDate) return false;
      const saleDate = new Date(sale.invoiceDate);
      return saleDate >= start && saleDate <= end;
    });

    if (filteredSales.length === 0) return null;

    // Get the most recent sale date
    const sortedByDate = [...filteredSales].sort(
      (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate),
    );

    return sortedByDate[0]?.invoiceDate;
  }, [sales, selectedDateRange]);

  // Replace your existing products fetch useEffect with this:
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products");
        const productsData = res.data?.products || res.data || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!loading && products.length > 0 && !warned) {
      const today = new Date();
      const tenDaysLater = new Date(today);
      tenDaysLater.setDate(today.getDate() + 10);
      const soonToExpire = products.filter((product) => {
        const expiryArr =
          product.variants?.get?.("Expire") || product.variants?.["Expire"];
        if (!expiryArr || expiryArr.length === 0) return false;
        return expiryArr.some((dateStr) => {
          // Accept formats like '30-08-2025'
          const [day, month, year] = dateStr.split("-").map(Number);
          if (!day || !month || !year) return false;
          const expDate = new Date(year, month - 1, day);
          return expDate >= today && expDate <= tenDaysLater;
        });
      });
      if (soonToExpire.length > 0) {
        window.toast &&
          window.toast.warn("Some products are expiring within 10 days!");
        setWarned(true);
      }
    }
  }, [loading, products, warned]);

  // Expired products state
  const [expiredProducts, setExpiredProducts] = useState([]);
  const [expiredLoading, setExpiredLoading] = useState(true);

  useEffect(() => {
    // Fetch all products and filter for expiry within next 10 days (same as ExpriedProduct.jsx)
    api
      .get("/api/products")
      .then((res) => {
        const data = res.data;
        const today = new Date();
        const tenDaysLater = new Date();
        tenDaysLater.setDate(today.getDate() + 10);
        const soonToExpire = Array.isArray(data)
          ? data.filter((product) => {
            const expiryArr =
              product.variants?.get?.("Expiry") ||
              product.variants?.["Expiry"];
            if (!expiryArr || expiryArr.length === 0) return false;
            return expiryArr.some((dateStr) => {
              const [day, month, year] = dateStr.split("-").map(Number);
              if (!day || !month || !year) return false;
              const expDate = new Date(year, month - 1, day);
              return expDate >= today && expDate <= tenDaysLater;
            });
          })
          : [];
        setExpiredProducts(soonToExpire);
        setExpiredLoading(false);
      })

      .catch(() => {
        setExpiredProducts([]);
        setExpiredLoading(false);
      });
  }, []);

  useEffect(() => {
    // Fetch recent purchases
    api.get("/api/purchases?limit=5&sort=desc").then((res) => {
      const data = res.data;
      setRecentPurchases(Array.isArray(data.purchases) ? data.purchases : []);
    });

    // Fetch debit note summary
    api.get("/api/debit-notes/summary").then((res) => {
      const data = res.data;
      setTotalDebitNoteAmount(data.totalAmount || 0);
      setTotalDebitNoteCount(data.totalCount || 0);
    });
  }, []);

  useEffect(() => {
    // Fetch expenses summary
    api.get("/api/expenses/summary").then((res) => {
      const data = res.data;
      setTotalExpensesAmount(data.totalAmount || 0);
      setTotalExpensesCount(data.totalCount || 0);
    });
  }, []);

  useEffect(() => {
    api
      .get("/api/purchases/return/all")
      .then((res) => {
        const returns = Array.isArray(res.data?.returns)
          ? res.data.returns
          : [];
        const totalReturnValue = returns.reduce(
          (acc, ret) => acc + (Number(ret.grandTotal) || 0),
          0,
        );
        setTotalPurchaseReturnValue(totalReturnValue);
      })
      .catch(() => {
        setTotalPurchaseReturnValue(0);
      });
  }, []);

  useEffect(() => {
    // Fetch suppliers
    api.get("/api/suppliers").then((res) => {
      const data = res.data;
      setTotalSupplier(Array.isArray(data) ? data.length : 0);
    });

    // Fetch customers
    api.get("/api/customers").then((res) => {
      const data = res.data;
      setTotalCustomer(Array.isArray(data) ? data.length : 0);
    });
  }, []);

  useEffect(() => {
    // Fetch purchases & returns summary
    api.get("/api/purchases/report").then((res) => {
      const data = res.data;
      setTotalPurchaseAmount(data?.totals?.purchase || 0);
      setTotalReturnAmount(data?.totals?.return || 0);
    });
  }, []);

  // Fetch stock value
  useEffect(() => {
    getTotalStockValue().then((val) => setTotalStockValue(val));
  }, []);

  useEffect(() => {
    // Fetch low stock products
    api.get("/api/products").then((res) => {
      const lowStock = products.filter((p) => {
        const stock = Number(p.stockQuantity || 0);
        const minStock = Number(p.minStockToMaintain || 0);

        return stock > 0 && stock <= minStock;
      });
      setLowStockProducts(lowStock);
    });
  }, []);

  // Fetch recent sales
  useEffect(() => {
    const fetchRecentSales = async () => {
      const dateParams = buildDateQueryParams();
      try {
        const res = await api.get(
          `/api/invoices/sales/list${dateParams ? `?${dateParams}` : "?limit=5&sort=desc"}`,
        );
        const data = res.data;
        const allSales = data.sales || [];
        setRecentSales(allSales.slice(0, 5));
        setTotalSaleValue(
          allSales.reduce((acc, sale) => acc + (sale.grandTotal || 0), 0),
        );
        setTotalOrderCount(allSales.length);
        setAllSales(allSales);
      } catch (error) {
        console.error("Error fetching sales:", error);
        setTotalOrderCount(0);
      }
    };
    fetchRecentSales();
  }, [selectedDateRange]);

  useEffect(() => {
    api
      .get("/api/sales/dashboard/stats")
      .then((res) => {
        const totalReturnValue = Number(res.data?.totalReturnAmount) || 0;
        setTotalSalesReturnValue(totalReturnValue);
      })
      .catch(() => {
        setTotalSalesReturnValue(0);
      });
  }, []);

  const [invoiceCount, setInvoiceCount] = useState(0);
  // const [totalInvoiceDue, setTotalInvoiceDue] = useState(0);
  const [totalInvoicePaid, setTotalInvoicePaid] = useState(0);

  useEffect(() => {
    // Helper to fetch all paginated invoices and sum paid/due
    const fetchAllInvoices = async () => {
      let allInvoices = [];
      let page = 1;
      let hasMore = true;
      let totalDue = 0;
      let totalPaid = 0;

      while (hasMore) {
        const res = await api.get(
          `/api/invoice/allinvoice?page=${page}&limit=100`,
        );
        const data = await res.data;
        const invoices = Array.isArray(data.invoices) ? data.invoices : [];
        allInvoices = allInvoices.concat(invoices);

        invoices.forEach((row) => {
          const inv = row.invoice || {};
          const sale = row.sale || {};
          totalDue += Number(inv.dueAmount || sale.dueAmount || 0);
          totalPaid += Number(inv.paidAmount || sale.paidAmount || 0);
        });

        hasMore = invoices.length === 100;
        page += 1;
      }

      setInvoiceCount(allInvoices.length);
      setTotalInvoiceDue(totalDue);
      setTotalInvoicePaid(totalPaid);
    };
    fetchAllInvoices();
  }, []);

  const [totalCreditNoteAmount, setTotalCreditNoteAmount] = useState(0);

  useEffect(() => {
    // Fetch all credit notes and sum their amounts
    api("/api/credit-notes/all")
      .then((res) => {
        const notes = Array.isArray(res.data.data) ? res.data.data : [];
        const totalCredit = notes.reduce(
          (acc, note) =>
            acc +
            (Number(note.total) ||
              Number(note.amount) ||
              Number(note.grandTotal) ||
              0),
          0,
        );
        setTotalCreditNoteAmount(totalCredit);
      })
      .catch(() => setTotalCreditNoteAmount(0));
  }, []);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await api.get("/api/invoices/sales/list?limit=1000");
        const salesData = response.data?.data?.sales || response.data?.sales || [];
        setSales(salesData);
      } catch (error) {
        console.error("Error fetching sales:", error);
        setSales([]);
      }
    };

    fetchSalesData();
  }, []);

  // console.log("Total Credit Note Amount:", totalCreditNoteAmount);
  const fetchData = async (url) => {
    try {
      const res = await api.get(url);
      return res.data;
    } catch (err) {
      // console.error(err);
      return {};
    }
  };

  // Example usage for sales returns (match route to backend)
  const fetchSalesReturns = async () => {
    const data = await fetchData(`${BASE_URL}/api/sales/dashboard/stats`);
    setAllSalesReturns([]);
  };

  // Example usage for purchase returns (match route to backend)
  const fetchPurchaseReturns = async () => {
    const data = await fetchData(`${BASE_URL}/api/purchases/return/all`);
    setAllPurchaseReturns(Array.isArray(data?.returns) ? data.returns : []);
  };

  // 🔹 fetch all sales
  const fetchSales = async () => {
    const data = await fetchData(`${BASE_URL}/api/sales?limit=1000000`);
    const sales = data.sales || [];
    setAllSales(sales);
    setRecentSales(sales.slice(0, 5));
    const totalValue = sales.reduce(
      (acc, sale) => acc + (sale.grandTotal || 0),
      0,
    );
    setTotalSaleValue(totalValue);
  };

  useEffect(() => {
    setTotalSaleValue(
      filteredSales.reduce((acc, sale) => acc + (sale.grandTotal || 0), 0),
    );
  }, [filteredSales]);

  // fetch all purchases
  const fetchPurchases = async () => {
    const data = await fetchData(`${BASE_URL}/api/purchases?limit=1000000`);
    setAllPurchases(data.purchases || []);
  };

  useEffect(() => {
    fetchSales();
    fetchPurchases();
    fetchSalesReturns();
    fetchPurchaseReturns();
  }, []);

  // Calculate total purchase and return values from allPurchases and allPurchaseReturns
  useEffect(() => {
    if (allPurchases.length > 0) {
      setTotalPurchaseAmount(
        allPurchases.reduce(
          (acc, purchase) => acc + (purchase.grandTotal || 0),
          0,
        ),
      );
    }

    if (allPurchaseReturns.length > 0) {
      setTotalReturnAmount(
        allPurchaseReturns.reduce((acc, ret) => acc + (ret.grandTotal || 0), 0),
      );
    }
  }, [allPurchases, allPurchaseReturns]);

  // Nwe Redesign
  const goToLowStocksPage = () => {
    navigate("/product");
  };

  const goTotalOrders = () => {
    navigate("/product");
  };

  // const styles = {
  //   Graphcard: {
  //     background: "white",
  //     border: "1px solid rgb(223 225 227 / 70%)",
  //     boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
  //     padding: "24px",
  //     borderRadius: "12px",
  //     display: "flex",
  //     flexDirection: "column",
  //     gap: "20px",
  //     width: "100%",
  //     minWidth: "525.67px",
  //     height: "457px",
  //     overflowY: "hidden",
  //   },
  //   GraphcardAdvert: {
  //     boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
  //     padding: "24px",
  //     borderRadius: "12px",
  //     display: "flex",
  //     flexDirection: "column",
  //     gap: "20px",
  //     width: "100%",
  //     minWidth: "525.67px",
  //     height: "457px",
  //     overflowY: "hidden",
  //   },
  //   Graphcardrecentorders: {
  //     background: "white",
  //     border: "1px solid rgb(223 225 227 / 70%)",
  //     boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
  //     padding: "24px",
  //     borderRadius: "12px",
  //     display: "flex",
  //     flexDirection: "column",
  //     gap: "20px",
  //     width: "100%",
  //     minWidth: "1083px",
  //     height: "457px",
  //   },
  //   Graphheader: {
  //     display: "flex",
  //     alignItems: "center",
  //     gap: "15px",
  //   },
  //   Graphtitle: {
  //     fontWeight: "500",
  //     fontSize: "16px",
  //     color: "#0E101A",
  //     fontFamily: "Inter",
  //     display: "flex",
  //     alignItems: "center",
  //     gap: "10px",
  //   },
  //   Graphbadge: {
  //     background: "#E5F0FF",
  //     color: "#1F7FFF",
  //     padding: "4px 8px",
  //     borderRadius: "50px",
  //     fontSize: "16px",
  //     fontFamily: "Inter",
  //     fontWeight: "400",
  //   },
  //   Graphsubtext: {
  //     fontSize: "14px",
  //     color: "#6C748C",
  //     margin: "4px 0 16px 0",
  //     fontFamily: "Inter",
  //   },
  //   GraphsalesRow: {
  //     display: "flex",
  //     justifyContent: "space-between",
  //     marginBottom: "8px",
  //   },
  //   Graphamount: {
  //     fontSize: "16px",
  //     fontWeight: "600",
  //     margin: "0",
  //   },
  //   Graphcurrency: {
  //     fontSize: "12px",
  //     fontWeight: "400",
  //   },
  //   Graphlabel: {
  //     fontSize: "12px",
  //     margin: "0",
  //   },
  //   Graphfooter: {
  //     display: "flex",
  //     justifyContent: "space-between",
  //     marginTop: "20px",
  //     fontSize: "14px",
  //     color: "#666",
  //     fontFamily: "Inter",
  //   },
  //   Graphlink: {
  //     color: "#1F7FFF",
  //     textDecoration: "none",
  //     fontFamily: "Inter",
  //     fontSize: "14px",
  //   },
  //   Graphupdate: {
  //     display: "flex",
  //     alignItems: "center",
  //     gap: "5px",
  //     //  fontFamily:'"Poppins", sans-serif',
  //   },
  // };
  
  const styles = {
    Graphcard: {
      background: "white",
      border: "1px solid rgb(223 225 227 / 70%)",
      boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
      padding: "24px",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
      minWidth: "525.67px",
      height: "457px",
      overflowY: "hidden",
      boxSizing: "border-box",
    },
    GraphcardAdvert: {
      boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
      padding: "24px",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
      minWidth: "525.67px",
      height: "457px",
      overflowY: "hidden",
      boxSizing: "border-box",
    },
    Graphcardrecentorders: {
      background: "white",
      border: "1px solid rgb(223 225 227 / 70%)",
      boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
      padding: "24px",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
      minWidth: "1083px",
      height: "457px",
      boxSizing: "border-box",
    },
    Graphheader: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
    },
    Graphtitle: {
      fontWeight: "500",
      fontSize: "16px",
      color: "#0E101A",
      fontFamily: "Inter",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    Graphbadge: {
      background: "#E5F0FF",
      color: "#1F7FFF",
      padding: "4px 8px",
      borderRadius: "50px",
      fontSize: "16px",
      fontFamily: "Inter",
      fontWeight: "400",
    },
    Graphsubtext: {
      fontSize: "14px",
      color: "#6C748C",
      margin: "4px 0 16px 0",
      fontFamily: "Inter",
    },
    GraphsalesRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "8px",
    },
    Graphamount: {
      fontSize: "16px",
      fontWeight: "600",
      margin: "0",
    },
    Graphcurrency: {
      fontSize: "12px",
      fontWeight: "400",
    },
    Graphlabel: {
      fontSize: "12px",
      margin: "0",
    },
    Graphfooter: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "20px",
      fontSize: "14px",
      color: "#666",
      fontFamily: "Inter",
    },
    Graphlink: {
      color: "#1F7FFF",
      textDecoration: "none",
      fontFamily: "Inter",
      fontSize: "14px",
    },
    Graphupdate: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },

    // NEW reusable alignment styles
    GraphlegendWrap: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      columnGap: "24px",
      rowGap: "12px",
      width: "100%",
    },
    GraphlegendWrapSingle: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      width: "100%",
    },
    GraphlegendItem: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      minWidth: 0,
    },
    GraphlegendTop: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontFamily: "Inter",
      fontSize: "14px",
      fontWeight: "500",
      color: "#727681",
      whiteSpace: "nowrap",
    },
    GraphlegendBar: {
      width: "20px",
      height: "4px",
      borderRadius: "999px",
      flexShrink: 0,
    },
    GraphlegendValue: {
      color: "#0E101A",
      fontSize: "20px",
      fontWeight: "500",
      fontFamily: "Inter",
      lineHeight: 1.2,
      wordBreak: "break-word",
    },
    GraphlegendSubValue: {
      color: "#727681",
      fontSize: "12px",
      fontWeight: "400",
      fontFamily: "Inter",
      lineHeight: 1.2,
    },
  };

  const fetchSalesList = async () => {
    try {
      const res = await api.get("/api/invoices/sales/list");
      const data = res.data.data.sales;
      setSales(res.data.data.sales);
    } catch (error) {
      console.error("Error fetching during fetch sales data", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/api/customers");
      // console.log('resds data', res.data)
      setCustomers(res.data || []);
    } catch (err) {
      toast.error("Failed to load customers");
      setCustomers([]);
    }
  };

  //   const fetchPurchase = async() => {
  // try {
  // const res = await api.get("/api/purchase-orders");
  // console.log("purchase res.data", res.data)
  // setPurchase(res.data);
  // }catch(error) {
  // console.error("Error fetching purchase");
  // }
  // }

  const fetchPurchaseOrders = async () => {
    try {
      const res = await api.get("/api/purchase-orders");
      // console.log("Purchase orders data:", res.data);
      const orders = res.data.invoices || res.data || [];
      setPurchaseOrders(Array.isArray(orders) ? orders : []);
    } catch (error) {
      console.error("Error fetcing purchase orders", error);
      setPurchaseOrders([]);
    }
  };

  useEffect(() => {
    fetchSalesList();
    fetchCustomers();
    fetchPurchaseOrders();
  }, []);

  // for recent order last 7 days
  const lastWeekSales = sales.filter((item) => {
    if (!item.invoiceDate) return false;
    const invoiceDate = new Date(item.invoiceDate);
    const { start, end } = getLastSevenDaysRange();
    return invoiceDate >= start && invoiceDate <= end;
  });

  const latestSale = lastWeekSales?.[0];

  // for recent sale updated time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);

    const diffMs = now - created; //milisecond
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    if (diffHours < 24) return `${diffHours}hrs ago`;
    return `${diffDays} days ago`;
  };

  const getCustomerTimeAgo = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Just now";

    const diffMs = new Date() - date;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} mins ago`;
    if (hrs < 24) return `${hrs} hrs ago`;
    return `${days} days ago`;
  };

  const invoiceCountByCustomer = useMemo(() => {
    const map = new Map();

    sales.forEach((sale) => {
      if (!sale.customer) return;
      map.set(sale.customer, (map.get(sale.customer) || 0) + 1);
    });

    return map;
  }, [sales]);

  const classifiedCustomers = useMemo(() => {
    const result = {
      new: [],
      returning: [],
    };

    customers.forEach((customer) => {
      const invoiceCount = invoiceCountByCustomer.get(customer.name) || 0;

      if (invoiceCount > 1) {
        result.returning.push(customer);
      } else {
        result.new.push(customer);
      }
    });

    return result;
  }, [customers, invoiceCountByCustomer]);

  const totalNewCustomers = classifiedCustomers.new.length;
  const totalReturningCustomers = classifiedCustomers.returning.length;

  const totalNewCustomerAmount = classifiedCustomers.new.reduce(
    (sum, c) => sum + (Number(c.totalPurchaseAmount) || 0),
    0,
  );

  const totalReturningCustomerAmount = classifiedCustomers.returning.reduce(
    (sum, c) => sum + (Number(c.totalPurchaseAmount) || 0),
    0,
  );

  // Replace the getCustomerChartData useMemo with this:
  const getCustomerChartData = useMemo(() => {
    const { start, end } = getLastSevenDaysRange();
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Initialize arrays for each day - for AMOUNTS
    const newCustomerAmountData = new Array(7).fill(0);
    const returningCustomerAmountData = new Array(7).fill(0);

    // Track UNIQUE customers per day
    const newCustomerCountData = new Array(7).fill(0);
    const returningCustomerCountData = new Array(7).fill(0);

    // Track overall customer purchase history
    const customerPurchaseHistory = new Map();

    // Track customers by day to ensure uniqueness
    const dailyUniqueCustomers = Array(7)
      .fill()
      .map(() => ({
        new: new Set(),
        returning: new Set(),
      }));

    // First pass: Process ALL sales to build customer history
    // This helps us identify if a customer is new or returning
    sales.forEach((sale) => {
      if (!sale.customer) return;

      const customerName = sale.customer;
      const saleDate = new Date(sale.invoiceDate || sale.createdAt);
      const amount = Number(sale.totalAmount || sale.grandTotal || 0);

      if (!customerPurchaseHistory.has(customerName)) {
        customerPurchaseHistory.set(customerName, {
          name: customerName,
          purchaseDates: [],
          amounts: [],
          firstPurchaseDate: null,
        });
      }

      const customerData = customerPurchaseHistory.get(customerName);
      customerData.purchaseDates.push(saleDate);
      customerData.amounts.push(amount);

      // Set first purchase date
      if (
        !customerData.firstPurchaseDate ||
        saleDate < customerData.firstPurchaseDate
      ) {
        customerData.firstPurchaseDate = saleDate;
      }
    });

    // Second pass: Process only sales within the date range
    sales.forEach((sale) => {
      if (!sale.invoiceDate || !sale.customer) return;

      const saleDate = new Date(sale.invoiceDate);

      // Check if sale is within selected date range
      if (saleDate < start || saleDate > end) return;

      const day = saleDate.getDay(); // 0 = Sun
      const index = day === 0 ? 6 : day - 1;

      const customerName = sale.customer;
      const amount = Number(sale.totalAmount || sale.grandTotal || 0);

      const customerData = customerPurchaseHistory.get(customerName);
      if (!customerData) return; // Should not happen, but safety check

      // Determine if this is the customer's first purchase ever
      // A customer is "new" if this is their first purchase ever
      // A customer is "returning" if they've made purchases before this date

      // Get all purchases BEFORE this current purchase date
      const purchasesBeforeThis = customerData.purchaseDates.filter(
        (date) => date < saleDate,
      );

      const isFirstPurchaseEver = purchasesBeforeThis.length === 0;
      const isReturningCustomer = purchasesBeforeThis.length > 0;

      // Check if we've already counted this customer for this day
      const daySets = dailyUniqueCustomers[index];

      if (isFirstPurchaseEver) {
        // New customer - first purchase ever
        if (!daySets.new.has(customerName)) {
          // First time counting this new customer for this day
          daySets.new.add(customerName);
          newCustomerCountData[index] += 1;
          newCustomerAmountData[index] += amount;
        } else {
          // Already counted this new customer for today, just add amount
          newCustomerAmountData[index] += amount;
        }
      } else if (isReturningCustomer) {
        // Returning customer
        if (!daySets.returning.has(customerName)) {
          // First time counting this returning customer for this day
          daySets.returning.add(customerName);
          returningCustomerCountData[index] += 1;
          returningCustomerAmountData[index] += amount;
        } else {
          // Already counted this returning customer for today, just add amount
          returningCustomerAmountData[index] += amount;
        }
      }
    });

    // Calculate overall totals (across all days)
    let totalNewCustomers = 0;
    let totalReturningCustomers = 0;
    let totalNewCustomerAmount = 0;
    let totalReturningCustomerAmount = 0;

    // Create sets to track unique customers across all days
    const allNewCustomers = new Set();
    const allReturningCustomers = new Set();

    dailyUniqueCustomers.forEach((daySets, index) => {
      // Add to unique customer sets
      daySets.new.forEach((customer) => allNewCustomers.add(customer));
      daySets.returning.forEach((customer) =>
        allReturningCustomers.add(customer),
      );

      // Sum amounts
      totalNewCustomerAmount += newCustomerAmountData[index];
      totalReturningCustomerAmount += returningCustomerAmountData[index];
    });

    totalNewCustomers = allNewCustomers.size;
    totalReturningCustomers = allReturningCustomers.size;

    // Convert amounts to thousands for chart display
    const newCustomerChartData = newCustomerAmountData.map((v) =>
      Math.round(v / 1000),
    );
    const returningCustomerChartData = returningCustomerAmountData.map((v) =>
      Math.round(v / 1000),
    );

    return {
      labels,
      newCustomersData: newCustomerChartData,
      returningCustomersData: returningCustomerChartData,
      rawNewCustomerAmounts: newCustomerAmountData,
      rawReturningCustomerAmounts: returningCustomerAmountData,
      newCustomerCounts: Array.from(
        dailyUniqueCustomers,
        (day) => day.new.size,
      ),
      returningCustomerCounts: Array.from(
        dailyUniqueCustomers,
        (day) => day.returning.size,
      ),
      totalNewCustomers,
      totalReturningCustomers,
      totalNewCustomerAmount,
      totalReturningCustomerAmount,
      dailyUniqueCustomers, // For debugging
    };
  }, [sales, selectedDateRange]);

  // console.log('getCustomerChartDataxcxcxcsds', getCustomerChartData)

  const customerChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "#FFFFFF",
          titleColor: "#0E101A",
          bodyColor: "#727681",
          borderColor: "#E5E7EB",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function (context) {
              const datasetIndex = context.datasetIndex;
              const dataIndex = context.dataIndex;

              let amount = 0;
              let customerCount = 0;
              let label = "";

              if (datasetIndex === 0) {
                // New Customers
                amount =
                  getCustomerChartData.rawNewCustomerAmounts[dataIndex] || 0;
                customerCount =
                  getCustomerChartData.newCustomerCounts[dataIndex] || 0;
                label = "New Customers";
              } else if (datasetIndex === 1) {
                // Returning Customers
                amount =
                  getCustomerChartData.rawReturningCustomerAmounts[dataIndex] ||
                  0;
                customerCount =
                  getCustomerChartData.returningCustomerCounts[dataIndex] || 0;
                label = "Returning Customers";
              }

              return `${label}: ₹${amount.toLocaleString()} (${customerCount} unique ${customerCount === 1 ? "customer" : "customers"})`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: "#6C748C",
            font: {
              size: 14,
              weight: 500,
              family: "Inter",
            },
          },
          border: {
            display: false,
          },
        },
        y: {
          position: "right",
          beginAtZero: true,
          min: 0,
          max: 200000, // Fixed max at 200k
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            stepSize: 50000, // Creates ticks at 0, 50000, 100000, 150000, 200000
            color: "#6C748C",
            font: {
              size: 14,
              weight: 500,
              family: "Inter",
            },
            callback: function (value) {
              if (value === 0) return "0";
              return value / 1000 + "k"; // Format as 50k, 100k, 150k, 200k
            },
          },
          border: {
            display: false,
          },
        },
      },
    }),
    [getCustomerChartData],
  );

  const newCustomers = getCustomerChartData.totalNewCustomers;
  const returningCustomers = getCustomerChartData.totalReturningCustomers;
  const latestCustomerUpdate = customers
    .map((c) => new Date(c.updatedAt))
    .sort((a, b) => b - a)[0];

  const lastSevenDaysCustomer = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0]; //yyyy-mm-dd
  });

  const newCustomerData = [];
  const returningCustomerData = [];

  lastSevenDaysCustomer.forEach((day) => {
    const newCount = customers.filter((c) =>
      c.createdAt?.startsWith(day),
    ).length;

    const returningCount = customers.filter(
      (c) => c.createdAt < day && c.lastPurchaseDate?.startsWith(day),
    ).length;
    newCustomerData.push(newCount);
    returningCustomerData.push(returningCount);
  });

  const datasFour = useMemo(
    () => ({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "New Customers",
          data: getCustomerChartData.rawNewCustomerAmounts, // Use raw amounts, not divided by 1000
          backgroundColor: "#C8DFFF",
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.5,
        },
        {
          label: "Returning Customers",
          data: getCustomerChartData.rawReturningCustomerAmounts, // Use raw amounts
          backgroundColor: "#1F7FFF",
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.5,
        },
      ],
    }),
    [getCustomerChartData],
  );

  // for daily earning
  // const dailyEarnings = useMemo(() => {
  //   const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  //   const { start, end } = getLastSevenDaysRange();

  //   // Initialize arrays for each day
  //   const dailySales = new Array(7).fill(0);
  //   const dailyProfit = new Array(7).fill(0);

  //   // Filter sales from last 7 days
  //   const filteredSales = sales.filter((sale) => {
  //     if (!sale.invoiceDate) return false;
  //     const saleDate = new Date(sale.invoiceDate);
  //     return saleDate >= start && saleDate <= end;
  //   });

  //   // console.log("Filtered sales for daily earnings:", filteredSales.length); // Debug log

  //   // Process each sale
  //   filteredSales.forEach((sale) => {
  //     if (sale.invoiceDate) {
  //       const saleDate = new Date(sale.invoiceDate);
  //       // Get day of week (0 = Sunday, 1 = Monday, etc.)
  //       const dayOfWeek = saleDate.getDay();
  //       // Adjust to make Monday = 0, Sunday = 6
  //       const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  //       if (adjustedIndex >= 0 && adjustedIndex < 7) {
  //         // Add total sales amount - use correct field
  //         const saleAmount = sale.totalAmount || sale.grandTotal || 0;
  //         dailySales[adjustedIndex] += saleAmount;

  //         // Calculate profit from sales items
  //         let profit = 0;
  //         if (Array.isArray(sale.items)) {
  //           sale.items.forEach((item) => {
  //             const quantity = Number(item.qty || 0);
  //             const sellingPrice = Number(item.unitPrice || 0);
  //             const totalRevenue = sellingPrice * quantity;

  //             // Try to find product to get purchase price for profit calculation
  //             let itemProfit = 0;
  //             if (item.productName && products.length > 0) {
  //               const foundProduct = products.find(
  //                 (p) =>
  //                   p.productName === item.productName ||
  //                   p.name === item.productName ||
  //                   p.productName?.toLowerCase() ===
  //                     item.productName?.toLowerCase(),
  //               );

  //               if (foundProduct) {
  //                 const purchasePrice = Number(
  //                   foundProduct.purchasePrice || foundProduct.price || 0,
  //                 );
  //                 itemProfit = (sellingPrice - purchasePrice) * quantity;
  //               } else {
  //                 // Default to 20% profit margin if product not found
  //                 itemProfit = totalRevenue * 0.2;
  //               }
  //             } else {
  //               // Default to 20% profit margin
  //               itemProfit = totalRevenue * 0.2;
  //             }
  //             profit += itemProfit;
  //           });
  //         }
  //         dailyProfit[adjustedIndex] += profit;
  //       }
  //     }
  //   });

  //   // Debug log to see what's being calculated
  //   // console.log("Daily sales:", dailySales);
  //   // console.log("Daily profit:", dailyProfit);

  //   // Format data for charts (convert to thousands for display)
  //   const chartSales = dailySales.map((value) => Math.round(value / 1000));
  //   const chartProfit = dailyProfit.map((value) => Math.round(value / 1000));

  //   return {
  //     labels: days,
  //     sales: dailySales,
  //     profit: dailyProfit,
  //     chartSales: chartSales,
  //     chartProfit: chartProfit,
  //     totalSales: dailySales.reduce((sum, val) => sum + val, 0),
  //     totalProfit: dailyProfit.reduce((sum, val) => sum + val, 0),
  //   };
  // }, [sales, products, selectedDateRange]);

  const dailyEarnings = useMemo(() => {
    const dailySales = new Array(7).fill(0);
    const dailyProfit = new Array(7).fill(0);

    lastWeekSales.forEach(sale => {
      if (sale.invoiceDate) {
        const saleDate = new Date(sale.invoiceDate);
        const index = saleDate.getDay() === 0 ? 6 : saleDate.getDay() - 1;

        const saleAmount = Number(sale.totalAmount || sale.grandTotal || 0);
        dailySales[index] += saleAmount;

        // Calculate profit (simplified)
        let profit = 0;
        if (Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            profit += Number(item.unitPrice || 0) * Number(item.qty || 0) * 0.2; // 20% margin
          });
        }
        dailyProfit[index] += profit;
      }
    });

    return {
      sales: dailySales,
      profit: dailyProfit,
      totalSales: dailySales.reduce((a, b) => a + b, 0),
      totalProfit: dailyProfit.reduce((a, b) => a + b, 0)
    };
  }, [lastWeekSales]);

  // Create dynamic data for the chart
  // Update this in your code
  // const dailyEarningData = useMemo(
  //   () => ({
  //     labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  //     datasets: [
  //       {
  //         label: "Total Sales",
  //         data: dailyEarnings.sales,
  //         borderColor: "#7313AA",
  //         backgroundColor: "transparent",
  //         borderWidth: 2,
  //         tension: 0.4,
  //         // No point styling here
  //       },
  //       {
  //         label: "Profit Earned",
  //         data: dailyEarnings.profit,
  //         borderColor: "#EE23B1",
  //         backgroundColor: "transparent",
  //         borderWidth: 2,
  //         tension: 0.4,
  //         // No point styling here
  //       },
  //     ],
  //   }),
  //   [dailyEarnings],
  // );

  const dailyEarningData = useMemo(() => ({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Total Sales",
        data: dailyEarnings.sales,
        borderColor: "#7313AA",
        backgroundColor: "transparent",
        tension: 0.4,
      },
      {
        label: "Profit Earned",
        data: dailyEarnings.profit,
        borderColor: "#EE23B1",
        backgroundColor: "transparent",
        tension: 0.4,
      },
    ],
  }), [dailyEarnings]);

  const dailyEarningOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        position: "right",
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          callback: (value) => value === 0 ? "0" : value / 1000 + "k",
          color: "#727681", font: { size: 14, family: "Inter", weight: 500 },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#727681",
          font: { size: 14, family: "Inter", weight: 500 },
        },
      },
    },
  };

  // Calculate percentage growth (simplified - you can make this more accurate)
  const calculateGrowthPercentage = () => {
    if (dailyEarnings.totalSales === 0) return 0;
    const profitPercentage =
      (dailyEarnings.totalProfit / dailyEarnings.totalSales) * 100;
    return Math.round(profitPercentage);
  };

  // const dailyEarningOptions = useMemo(
  //   () => ({
  //     responsive: true,
  //     maintainAspectRatio: false,
  //     plugins: {
  //       legend: { display: false },
  //       tooltip: {
  //         enabled: true,
  //         backgroundColor: "#FFFFFF",
  //         titleColor: "#0E101A",
  //         bodyColor: "#727681",
  //         borderColor: "#E5E7EB",
  //         borderWidth: 1,
  //         padding: 12,
  //         callbacks: {
  //           label: function (context) {
  //             const label = context.dataset.label || "";
  //             const value = context.raw || 0;
  //             return `${label}: ₹${value.toLocaleString()}`;
  //           },
  //         },
  //       },
  //     },
  //     scales: {
  //       x: {
  //         grid: { display: false },
  //         ticks: {
  //           color: "#727681",
  //           font: { size: 14, family: "Inter", weight: 500 },
  //         },
  //         border: { display: false },
  //       },
  //       y: {
  //         position: "right",
  //         beginAtZero: true,
  //         min: 0,
  //         max: 200000,
  //         grid: { display: false },
  //         ticks: {
  //           stepSize: 50000,
  //           color: "#727681",
  //           font: {
  //             size: 14,
  //             weight: 500,
  //             family: "Inter",
  //           },
  //           callback: function (value) {
  //             if (value === 0) return "0";
  //             return value / 1000 + "k";
  //           },
  //         },
  //         border: { display: false },
  //       },
  //     },
  //     elements: {
  //       line: {
  //         tension: 0.4,
  //         borderWidth: 2,
  //         fill: false,
  //       },
  //       point: {
  //         radius: function (context) {
  //           // Only show point at the last data point for each dataset
  //           const lastIndex = context.dataset.data.length - 1;
  //           return context.dataIndex === lastIndex ? 6 : 0;
  //         },
  //         backgroundColor: function (context) {
  //           const lastIndex = context.dataset.data.length - 1;
  //           if (context.dataIndex === lastIndex) {
  //             // Return different colors based on dataset
  //             return context.dataset.label === "Total Sales"
  //               ? "#7313AA"
  //               : "#EE23B1";
  //           }
  //           return "transparent";
  //         },
  //         borderColor: function (context) {
  //           const lastIndex = context.dataset.data.length - 1;
  //           return context.dataIndex === lastIndex ? "#FFFFFF" : "transparent";
  //         },
  //         borderWidth: function (context) {
  //           const lastIndex = context.dataset.data.length - 1;
  //           return context.dataIndex === lastIndex ? 2 : 0;
  //         },
  //         hoverRadius: 8,
  //         hitRadius: 10,
  //       },
  //     },
  //   }),
  //   [dailyEarnings],
  // );

  // function to calculate delivery days
  
  const calculateDeliveryDays = (dueDate) => {
    if (!dueDate) return "N/A";

    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    return `${diffDays} Days`;
  };

  // Function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Function to get status color and text
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case "received":
      case "delivered":
        return {
          text: "Delivered",
          bgColor: "#D4F7C7",
          textColor: "#01774B",
          icon: "✓",
        };
      case "processing":
      case "pending":
        return {
          text: "Processing",
          bgColor: "#F7F7C7",
          textColor: "#7E7000",
          icon: "•",
        };
      case "cancelled":
      case "rejected":
        return {
          text: "Cancelled",
          bgColor: "#F7C7C9",
          textColor: "#A80205",
          icon: "✕",
        };
      case "converted":
        return {
          text: "Converted",
          bgColor: "#C7D4F7",
          textColor: "#001774",
          icon: "↻",
        };
      default:
        return {
          text: status || "Pending",
          bgColor: "#F0F0F0",
          textColor: "#666666",
          icon: "•",
        };
    }
  };

  // Filter last 7 days purchase orders
  const getLast7DaysPurchaseOrders = () => {
    const { start, end } = getLastSevenDaysRange();

    return purchaseOrders
      .filter((order) => {
        if (!order.invoiceDate) return false;
        const orderDate = new Date(order.invoiceDate);
        return orderDate >= start && orderDate <= end;
      })
      .slice(0, 5); // Get top 5 for display
  };

  // Calculate latest update time
  const getLatestPurchaseUpdate = () => {
    if (purchaseOrders.length === 0) return null;

    const sortedByDate = [...purchaseOrders].sort(
      (a, b) =>
        new Date(b.invoiceDate || b.createdAt) -
        new Date(a.invoiceDate || a.createdAt),
    );

    return sortedByDate[0]?.invoiceDate || sortedByDate[0]?.createdAt;
  };

  // Calculate last 7 days sales and purchase data dynamically - MODIFIED FOR AMOUNTS
  const last7DaysSalesReport = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const { start, end } = getLastSevenDaysRange();

    // Initialize arrays for each day - AMOUNTS in thousands
    const dailyPurchaseAmounts = new Array(7).fill(0);
    const dailySalesAmounts = new Array(7).fill(0);

    // Initialize arrays for order counts (if needed for display)
    const dailyPurchaseOrders = new Array(7).fill(0);
    const dailySalesOrders = new Array(7).fill(0);

    // Process purchase orders for last 7 days
    if (Array.isArray(purchaseOrders)) {
      purchaseOrders.forEach((purchase) => {
        if (purchase.invoiceDate) {
          const purchaseDate = new Date(purchase.invoiceDate);
          if (purchaseDate >= start && purchaseDate <= end) {
            const dayOfWeek = purchaseDate.getDay();
            const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            if (adjustedIndex >= 0 && adjustedIndex < 7) {
              dailyPurchaseOrders[adjustedIndex] += 1;
              dailyPurchaseAmounts[adjustedIndex] += purchase.grandTotal || 0;
            }
          }
        }
      });
    }

    // Process sales orders for last 7 days
    if (Array.isArray(sales)) {
      sales.forEach((sale) => {
        if (sale.invoiceDate) {
          const saleDate = new Date(sale.invoiceDate);
          if (saleDate >= start && saleDate <= end) {
            const dayOfWeek = saleDate.getDay();
            const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            if (adjustedIndex >= 0 && adjustedIndex < 7) {
              dailySalesOrders[adjustedIndex] += 1;
              dailySalesAmounts[adjustedIndex] +=
                sale.totalAmount || sale.grandTotal || 0;
            }
          }
        }
      });
    }

    // Convert amounts to thousands for display
    const purchaseAmountData = dailyPurchaseAmounts.map((amount) =>
      Math.round(amount / 1000),
    );
    const salesAmountData = dailySalesAmounts.map((amount) =>
      Math.round(amount / 1000),
    );

    // Calculate totals
    const totalPurchaseOrders = dailyPurchaseOrders.reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalSalesOrders = dailySalesOrders.reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalPurchaseAmount = dailyPurchaseAmounts.reduce(
      (sum, val) => sum + val,
      0,
    );
    const totalSalesAmount = dailySalesAmounts.reduce(
      (sum, val) => sum + val,
      0,
    );

    // Calculate growth percentage based on amounts
    const calculateGrowthPercentage = () => {
      const totalAmount = totalPurchaseAmount + totalSalesAmount;
      if (totalAmount === 0) return 0;

      // Simple growth calculation (you can replace with actual previous week data)
      const previousWeekAmount = Math.round(totalAmount * 0.8); // 80% of current week
      const growth = totalAmount - previousWeekAmount;
      return Math.round((growth / previousWeekAmount) * 100);
    };

    return {
      labels: days,
      purchaseOrders: dailyPurchaseOrders, // Keep for reference
      salesOrders: dailySalesOrders, // Keep for reference
      purchaseAmounts: purchaseAmountData, // In thousands for chart
      salesAmounts: salesAmountData, // In thousands for chart
      rawPurchaseAmounts: dailyPurchaseAmounts, // Original amounts
      rawSalesAmounts: dailySalesAmounts, // Original amounts
      totalPurchaseOrders,
      totalSalesOrders,
      totalPurchaseAmount,
      totalSalesAmount,
      growthPercentage: calculateGrowthPercentage(),
    };
  }, [purchaseOrders, sales, selectedDateRange]);

  // Get latest update time for sales report
  const dynamicDatasThree = useMemo(
    () => ({
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Purchase Amount",
          data: last7DaysSalesReport.rawPurchaseAmounts, // Use raw amounts
          backgroundColor: "#F9E2D9",
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.5,
        },
        {
          label: "Sales Amount",
          data: last7DaysSalesReport.rawSalesAmounts, // Use raw amounts
          backgroundColor: "#FF8F1F",
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.5,
        },
      ],
    }),
    [last7DaysSalesReport],
  );

  const dynamicOptionssThree = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          backgroundColor: "#FFFFFF",
          titleColor: "#0E101A",
          bodyColor: "#727681",
          borderColor: "#E5E7EB",
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.raw || 0;
              const index = context.dataIndex;

              if (label === "Purchase Amount") {
                const orderCount =
                  last7DaysSalesReport.purchaseOrders[index] || 0;
                return `Purchase: ₹${value.toLocaleString()} (${orderCount} orders)`;
              } else if (label === "Sales Amount") {
                const orderCount = last7DaysSalesReport.salesOrders[index] || 0;
                return `Sales: ₹${value.toLocaleString()} (${orderCount} orders)`;
              }
              return `${label}: ₹${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: "#6C748C",
            font: {
              size: 14,
              weight: 500,
              family: "Inter",
            },
          },
          border: {
            display: false,
          },
        },
        y: {
          position: "right",
          beginAtZero: true,
          min: 0,
          max: 200000, // Fixed max at 200k
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            stepSize: 50000, // Fixed step size of 50k
            color: "#6C748C",
            font: {
              size: 14,
              weight: 500,
              family: "Inter",
            },
            callback: function (value) {
              if (value === 0) return "0";
              return value / 1000 + "k"; // Format as 50k, 100k, 150k, 200k
            },
          },
          border: {
            display: false,
          },
        },
      },
    };
  }, [last7DaysSalesReport]); // Keep dependency for tooltip data

  const getSalesReportUpdateTime = () => {
    const purchaseTimes = purchaseOrders.map(
      (p) => new Date(p.invoiceDate || p.createdAt),
    );
    const salesTimes = sales.map((s) => new Date(s.invoiceDate || s.createdAt));
    const allTimes = [...purchaseTimes, ...salesTimes].filter(
      (time) => !isNaN(time.getTime()),
    );

    if (allTimes.length === 0) return null;

    const latestTime = new Date(Math.max(...allTimes));
    return latestTime;
  };

  // calculate retail sales data dynamically
  const retailSalesData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const { start, end } = getLastSevenDaysRange();

    // Initialize arrays for each day
    const dailyRetailSales = new Array(7).fill(0);

    // filter sales from last 7 days
    // Filter sales from last 7 days
    const filteredSales = sales.filter((sale) => {
      if (!sale.invoiceDate) return false;
      const saleDate = new Date(sale.invoiceDate);
      return saleDate >= start && saleDate <= end;
    });

    // Process each sale
    filteredSales.forEach((sale) => {
      if (sale.invoiceDate) {
        const saleDate = new Date(sale.invoiceDate);
        const dayOfWeek = saleDate.getDay();
        const adjustedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        if (adjustedIndex >= 0 && adjustedIndex < 7) {
          // Add total sales amount
          const saleAmount = sale.totalAmount || sale.grandTotal || 0;
          dailyRetailSales[adjustedIndex] += saleAmount;
        }
      }
    });

    const chartData = dailyRetailSales.map((value) => Math.round(value / 1000));
    // calculate total
    const totalRetailSales = dailyRetailSales.reduce(
      (sum, val) => sum + val,
      0,
    );

    // calculate growth percentage
    const calculateGrowthPercentage = () => {
      if (totalRetailSales === 0) return 0;
      const previousWeekTotal = Math.round(totalRetailSales * 0.8);
      const growth = totalRetailSales - previousWeekTotal;
      return Math.round((growth / previousWeekTotal) * 100);
    };

    return {
      labels: days,
      sales: dailyRetailSales,
      chartData: chartData,
      totalSales: totalRetailSales,
      growthPercentage: calculateGrowthPercentage(),
    };
  }, [sales, selectedDateRange]);

  // Replace your current dynamicRetailData with this:
  const dynamicRetailData = useMemo(() => ({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [{
      label: "Retailer Sales",
      data: retailSalesData.sales,
      borderColor: "#13AA64",
      backgroundColor: "transparent",
      tension: 0.4,
      pointRadius: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1 ? 6 : 0,
      pointBackgroundColor: "#13AA64",
      pointBorderColor: "#FFFFFF",
      pointBorderWidth: 2,
    }]
  }), [retailSalesData]);

  const dynamicRetailOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        position: "right",
        beginAtZero: true,
        grid: { display: false },
        ticks: {
          callback: (value) => value === 0 ? "0" : value / 1000 + "k",
          color: "#727681", font: { size: 14, family: "Inter", weight: 500 },
        },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#727681", font: { size: 14, family: "Inter", weight: 500 } },
      },
    },
  };

  // Get latest update time for retail
  const getRetailUpdateTime = () => {
    if (sales.length === 0) return null;

    const filteredSales = sales.filter((sale) => sale.invoiceDate);
    if (filteredSales.length === 0) return null;

    const sortedByDate = [...filteredSales].sort(
      (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate),
    );

    return sortedByDate[0]?.invoiceDate;
  };

  const calculateLast7DaysData = async () => {
    const { start, end } = getLastSevenDaysRange();

    try {
      // 1. Last 7 Days Inventory Value
      const productsRes = await api.get("/api/products?limit=1000");
      const allProducts = productsRes.data?.products || productsRes.data || [];

      // Filter products based on date range
      const last7DaysProducts = allProducts.filter((product) => {
        const productDate = new Date(product.createdAt || product.updatedAt);
        return productDate >= start && productDate <= end;
      });

      // Calculate inventory value for last 7 days products
      const last7DaysInventory = last7DaysProducts.reduce((sum, product) => {
        const qty = Number(product.stockQuantity || product.quantity || 0);
        const price = Number(product.sellingPrice || 0);
        return sum + qty * price;
      }, 0);
      setLast7DaysInventoryValue(last7DaysInventory);

      // 2. Last 7 Days Average Selling Price
      if (last7DaysProducts.length > 0) {
        const totalSellingPrice = last7DaysProducts.reduce(
          (sum, p) => sum + (Number(p.sellingPrice) || 0),
          0,
        );
        setLast7DaysAvgSelling(
          Math.round(totalSellingPrice / last7DaysProducts.length),
        );
      }

      // 3. Last 7 Days Due Payments
      const invoicesRes = await api.get(
        "/api/invoices/sales/list?limit=100000",
      );
      const invoices = invoicesRes.data?.data?.sales || invoicesRes.data?.sales || [];
      const last7DaysDue = invoices.reduce((sum, invoice) => {
        const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt);
        const isInLast7Days = invoiceDate >= start && invoiceDate <= end;
        if (isInLast7Days) {
          const dueAmount = Number(invoice.dueAmount) || 0;
          return sum + dueAmount;
        }
        return sum;
      }, 0);
      setLast7DaysDuePayments(last7DaysDue);

      // 4. Last 7 Days Newly Added Products
      const last7DaysNewlyAdded = allProducts.filter((product) => {
        const created = new Date(product.createdAt);
        return created >= start && created <= end;
      });
      setLast7DaysNewlyAdded(last7DaysNewlyAdded.length);

      // 5. Last 7 Days Low Stocks - USING ALL PRODUCTS (not filtered by date)
      const lowStock = allProducts.filter((product) => {
        const stock = Number(product.stockQuantity || product.quantity || 0);
        const minStock = Number(product.minStockToMaintain || 0);
        return stock > 0 && stock <= minStock;
      });
      setLowStockProducts(lowStock);
      setLast7DaysLowStocks(lowStock.length); // This updates the card

      // 6. Last 7 Days Out of Stocks - USING ALL PRODUCTS (not filtered by date)
      const outOfStock = allProducts.filter((product) => {
        const stock = Number(product.stockQuantity || product.quantity || 0);
        return stock === 0;
      });
      setOutOfStockProducts(outOfStock);
      setLast7DaysOutOfStocks(outOfStock.length); // This updates the card

      // 7. Last 7 Days Total Sale Orders
      const salesRes = await api.get("/api/invoices/sales/list?limit=100000");
      const allSales = salesRes.data?.data?.sales || salesRes.data?.sales || [];
      const last7DaysSales = allSales.filter((sale) => {
        const saleDate = new Date(sale.invoiceDate || sale.createdAt);
        return saleDate >= start && saleDate <= end;
      });
      setLast7DaysTotalSaleOrders(last7DaysSales.length);

    } catch (error) {
      console.error("Error calculating last 7 days data:", error);
    }
  };

  useEffect(() => {
    calculateLast7DaysData();
  }, [products, sales, purchaseOrders, selectedDateRange]);

  useEffect(() => {
    // Call all your data fetching functions when date range changes
    const fetchAllData = async () => {
      await fetchSalesList();
      // await fetchProducts();
      await fetchCustomers();
      await fetchPurchaseOrders();
      // Add any other data fetching functions you need
    };

    fetchAllData();
  }, [selectedDateRange]);

  // Add this function to show dynamic date range text
  const getDateRangeText = () => {
    if (selectedDateRange.startDate && selectedDateRange.endDate) {
      const formatDate = (date) => {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      };
      return `${formatDate(selectedDateRange.startDate)} - ${formatDate(selectedDateRange.endDate)}`;
    }
    return "Last 7 days";
  };

  // Data Zero lenth logic
  const isDataZero = (chartData) => {
    if (!chartData || !chartData.datasets) return true;

    return chartData.datasets.every(
      (ds) => !ds.data || ds.data.every((val) => Number(val) === 0),
    );
  };

  return (
    <div
      className="dashboard p-4  d-flex flex-column gap-4"
      style={{ overflowY: "auto", height: "calc(100vh - 60px)" }}
    >
      {/* Dashboard-header */}
      <div className="dashboard-header-mobile">

        <h1
          className="dashboard-title-mobile d-none"
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: "30px",
            marginBottom: "0",
          }}
        >
          Dashbaord
        </h1>

        <div
          className="dashbaord-header d-flex justify-content-between align-items-center w-100"
          style={{
            borderBottom: "1px solid rgb(194, 201, 209)",
            paddingBottom: "24px",
          }}
        >
          <div className="d-flex align-items-center" style={{ gap: "19px" }}>
            <h1
              className="dashboard-title"
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: "30px",
                marginBottom: "0",
                color: "black",
              }}
            >
              Dashbaord
            </h1>
            <DateFilterDropdown
              selectedDateRange={selectedDateRange}
              setSelectedDateRange={setSelectedDateRange}
            />
          </div>
          
          <button
            className=""
            style={{
              backgroundColor: "white",
              border: "1px solid rgb(224, 222, 222)",
              borderRadius: "8px",
              color: "hsla(0, 1%, 36%, 1.00)",
              fontFamily: "Inter",
              fontSize: "15px",
              padding: "4px 12px",
            }}
          >
            Last Updated 20 min ago <MdUpdate />
          </button>
        </div>
      </div>

      {/* Dashboard Card boxes */}
      <div className="dashboard-card">

        {/* 1st line boxed */}
        <div
          className="dhaboard-card-1-container d-flex justify-content-between"
          style={{ gap: "30px" }}
        >
          {/* Total Inventory Value */}
          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Total Inventory Value
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    ₹{String(last7DaysInventoryValue).length > 7 ? last7DaysInventoryValue.toLocaleString() + ".." : last7DaysInventoryValue.toFixed(2).toLocaleString()}
                    {/* <span style={{ color: "grey", fontSize: "20px" }}>
                      {String(last7DaysInventoryValue).length > 7 && ".."}
                    </span> */}
                  </h5>
                  <span
                    className=""
                    style={{ fontSize: "14px", color: "#0E101A" }}
                  >
                    INR
                  </span>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon1}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          {/* Total Order Amount */}
          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            // onClick={goTotalOrders}
            style={{
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
              // cursor: "pointer",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Total Order Amount
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    ₹{String(totalSaleValue).length > 7  ? Math.round(retailSalesData.totalSales).toLocaleString() + ".." : Math.round(retailSalesData.totalSales).toFixed(2).toLocaleString()}
                    {/* <span style={{ color: "grey", fontSize: "20px" }}>
                      {String(totalSaleValue).length > 7 && ".."}
                    </span> */}
                  </h5>
                  <span
                    className=""
                    style={{ fontSize: "14px", color: "#0E101A" }}
                  >
                    INR
                  </span>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon2}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          {/* Average Selling */}
          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Average Selling
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    ₹{String(last7DaysAvgSelling).length > 7 ? last7DaysAvgSelling.toLocaleString() + ".." : last7DaysAvgSelling.toFixed(2).toLocaleString()}
                    {/* <span style={{ color: "grey", fontSize: "20px" }}>
                      {String(last7DaysAvgSelling).length > 7 && ".."}
                    </span> */}
                  </h5>
                  <span
                    className=""
                    style={{ fontSize: "14px", color: "#0E101A" }}
                  >
                    INR
                  </span>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon3}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          {/* Due Payments */}
          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Due Payments
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    ₹{String(last7DaysDuePayments).length > 7 ? last7DaysDuePayments.toLocaleString() + ".." : last7DaysDuePayments.toFixed(2).toLocaleString()}
                    {/* <span style={{ color: "grey", fontSize: "20px" }}>
                      {String(last7DaysDuePayments).length > 7 && ".."}
                    </span> */}
                  </h5>
                  <span
                    className=""
                    style={{ fontSize: "14px", color: "#0E101A" }}
                  >
                    INR
                  </span>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon4}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>
        </div>

        {/* 2nd line boxed */}
        <div
          className="dashboard-card-2-container d-flex justify-content-between"
          style={{ gap: "30px" }}
        >
          {/* Newly Added */}
          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              //  width:"100%",
              // minWidth: "372.25px",
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Newly Added
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    {last7DaysNewlyAdded}
                    <span style={{ color: "grey", fontSize: "20px" }}>
                      {String(last7DaysNewlyAdded.length).length > 2}
                    </span>
                  </h5>
                  <span
                    className=""
                    style={{ fontSize: "14px", color: "#0E101A" }}
                  ></span>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon5}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          {/*  Low Stocks */}
          <div
            // onClick={goToLowStocksPage}
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative cursor-pointer"
            style={{
              //  width:"100%",
              // minWidth: "372.25px",
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
              // cursor: "pointer",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Low Stocks
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    {last7DaysLowStocks}
                    <span style={{ color: "grey", fontSize: "20px" }}>
                      {String(last7DaysLowStocks.length).length > 2}
                    </span>
                  </h5>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon6}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          {/*  Out Of Stocks */}
          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              //  width:"100%",
              // minWidth: "372.25px",
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Out Of Stocks
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    {last7DaysOutOfStocks}
                    <span style={{ color: "grey", fontSize: "20px" }}>
                      {String(last7DaysOutOfStocks.length).length > 2}
                    </span>
                  </h5>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon7}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          {/*  Total Order */}
          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              //  width:"100%",
              // minWidth: "372.25px",
              //  maxWidth: "372.25px",
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Total Sale Order
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    {last7DaysTotalSaleOrders}
                    <span style={{ color: "grey", fontSize: "20px" }}>
                      {String(last7DaysTotalSaleOrders).length > 7 && ".."}
                    </span>
                  </h5>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon8}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* all graphs */}
      <div
        className="graph-main-dashboard"
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {/* 1 line Graph container */}
        <div className="graph-container">
          {/* Retail */}
          <div className="graph-1-dash" style={styles.Graphcard}>
            <div style={{ width: "100$" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Retailer <img src={i_icon} alt="i_icon" />
                  </span>
                  <span style={styles.Graphbadge}>
                    {retailSalesData.growthPercentage > 0 ? "+" : ""}
                    {retailSalesData.growthPercentage}%
                  </span>
                </div>
                <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
              </div>
              {isDataZero(dynamicRetailData) ? (
                <div
                  className="blank-data-section"
                  style={{ paddingTop: "80px", textAlign: "center" }}
                >
                  <img
                    src={noData}
                    alt="no-data"
                    style={{ width: "100%", maxWidth: "120px" }}
                  />
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#939090",
                    }}
                  >
                    No Available Data
                  </h1>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#A0A0A0",
                    }}
                  >
                    You don’t have any data yet.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.GraphsalesRow}>
                    <div
                      className=" w-100"
                      style={{
                        padding: "16px 0",
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#727681",
                        borderBottom: "1px solid #C2C9D1",
                      }}
                    >
                      <div className="d-flex flex-column gap-2">
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: "57px" }}
                        >
                          <span
                            className="d-flex align-items-center gap-2"
                            style={{
                              fontFamily: "Inter",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: "#13AA64",
                                width: "20px",
                                height: "4px",
                              }}
                            ></span>
                            Reatailer
                          </span>
                        </div>
                        <div style={styles.GraphlegendValue}>
                          ₹
                          {Math.round(
                            retailSalesData.totalSales,
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div></div>
                  </div>

                  <div
                    className="dashboard-card-graph-scroll"
                    style={{
                      width: "100%",

                      height: "200px",
                      borderBottom: "1px solid rgb(194, 201, 209)",
                      padding: "15px 0",
                      boxSizing: "border-box",
                      // overflowY:"auto"
                    }}
                  >
                    <Line
                      data={dynamicRetailData}
                      options={dynamicRetailOptions}
                    />
                  </div>

                  <div style={styles.Graphfooter}>
                    <a href="/" style={styles.Graphlink}>
                      View All
                    </a>
                    <span style={styles.Graphupdate}>
                      <img src={time} alt="time" />
                      {getRetailUpdateTime()
                        ? `Updated ${getTimeAgo(getRetailUpdateTime())}`
                        : "No recent sales"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sales Report */}
          {/* <div className="graph-2-dash" style={styles.Graphcard}>
            <div style={{ objectFit: "content", width: "100%" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Sales Report <img src={i_icon} alt="i_icon" />
                  </span>
                  <span style={styles.Graphbadge}>
                    {last7DaysSalesReport.growthPercentage > 0 ? '+' : ''}
                    {last7DaysSalesReport.growthPercentage}%
                  </span>
                </div>
                <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
              </div>

              {isDataZero(dynamicDatasThree) ? (
                <div
                  className="blank-data-section"
                  style={{ paddingTop: "80px", textAlign: "center" }}
                >
                  <img src={noData} alt="no-data" style={{ width: "100%", maxWidth: "120px" }} />
                  <h1 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#939090"
                  }}>
                    No Available Data
                  </h1>
                  <p style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#A0A0A0"
                  }}>
                    You don't have any data yet.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.GraphsalesRow}>
                    <div
                      className="w-100"
                      style={{
                        padding: "16px 0",
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#727681",
                        borderBottom: "1px solid #C2C9D1",
                      }}
                    >
                      <div className="d-flex flex-column gap-2">
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: "57px" }}
                        >
                          <span
                            className="d-flex align-items-center gap-2"
                            style={{
                              fontFamily: "Inter",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: "#FFC9B4",
                                width: "20px",
                                height: "4px",
                              }}
                            ></span>
                            Purchase Orders
                          </span>
                          <span
                            className="d-flex align-items-center gap-2"
                            style={{
                              fontFamily: "Inter",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: "#FF8F1F",
                                width: "20px",
                                height: "4px",
                              }}
                            ></span>
                            Sales Orders
                          </span>
                        </div>
                        <div
                          className="d-flex"
                          style={{ marginLeft: "25px", gap: "57px" }}
                        >
                          <span
                            style={{
                              color: "#0E101A",
                              fontSize: "20px",
                              fontWeight: "500",
                              fontFamily: "Inter",
                            }}
                          >
                            ₹{last7DaysSalesReport.totalPurchaseAmount?.toLocaleString() || '0'}
                          </span>
                          <span
                            style={{
                              color: "#0E101A",
                              fontSize: "20px",
                              fontWeight: "500",
                              fontFamily: "Inter",
                            }}
                          >
                            ₹{last7DaysSalesReport.totalSalesAmount?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="dashboard-card-graph-scroll"
                    style={{
                      width: "100%",
                      minWidth: "363px",
                      height: "200px",
                      borderBottom: "1px solid rgb(194, 201, 209)",
                      paddingBottom: "15px",
                      paddingTop: "15px",
                    }}
                  >
                    <Bar
                      data={dynamicDatasThree}
                      options={dynamicOptionssThree}
                    />
                  </div>

                  <div style={styles.Graphfooter}>
                    <a href="/sales-report" style={styles.Graphlink}>
                      View All
                    </a>
                    <span style={styles.Graphupdate}>
                      <img src={time} alt="time" />
                      {getSalesReportUpdateTime() ? `Updated ${getTimeAgo(getSalesReportUpdateTime())}` : "No recent data"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div> */}
          <div className="graph-2-dash" style={styles.Graphcard}>
            <div style={{ width: "100%" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Sales Report <img src={i_icon} alt="i_icon" />
                  </span>
                  <span style={styles.Graphbadge}>
                    {last7DaysSalesReport.growthPercentage > 0 ? "+" : ""}
                    {last7DaysSalesReport.growthPercentage}%
                  </span>
                </div>
                <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
              </div>

              {isDataZero(dynamicDatasThree) ? (
                <div
                  className="blank-data-section"
                  style={{ paddingTop: "80px", textAlign: "center" }}
                >
                  <img
                    src={noData}
                    alt="no-data"
                    style={{ width: "100%", maxWidth: "120px" }}
                  />
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#939090",
                    }}
                  >
                    No Available Data
                  </h1>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#A0A0A0",
                    }}
                  >
                    You don't have any data yet.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.GraphsalesRow}>
                    <div
                      className="w-100"
                      style={{
                        padding: "16px 0",
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#727681",
                        borderBottom: "1px solid #C2C9D1",
                      }}
                    >
                      <div style={styles.GraphlegendWrap}>
                        <div style={styles.GraphlegendItem}>
                          <div style={styles.GraphlegendTop}>
                            <span
                              style={{
                                ...styles.GraphlegendBar,
                                backgroundColor: "#FFC9B4",
                              }}
                            />
                            Purchase Orders
                          </div>
                          <div style={styles.GraphlegendValue}>
                            ₹
                            {last7DaysSalesReport.totalPurchaseAmount?.toLocaleString() ||
                              "0"}
                          </div>
                        </div>

                        <div style={styles.GraphlegendItem}>
                          <div style={styles.GraphlegendTop}>
                            <span
                              style={{
                                ...styles.GraphlegendBar,
                                backgroundColor: "#FF8F1F",
                              }}
                            />
                            Sales Orders
                          </div>
                          <div style={styles.GraphlegendValue}>
                            ₹
                            {last7DaysSalesReport.totalSalesAmount?.toLocaleString() ||
                              "0"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="dashboard-card-graph-scroll"
                    style={{
                      width: "100%",
                      height: "200px",
                      borderBottom: "1px solid rgb(194, 201, 209)",
                      padding: "15px 0",
                      boxSizing: "border-box",
                    }}
                  >
                    <Bar
                      data={dynamicDatasThree}
                      options={dynamicOptionssThree}
                    />
                  </div>

                  <div style={styles.Graphfooter}>
                    <a href="/sales-report" style={styles.Graphlink}>
                      View All
                    </a>
                    <span style={styles.Graphupdate}>
                      <img src={time} alt="time" />
                      {getSalesReportUpdateTime()
                        ? `Updated ${getTimeAgo(getSalesReportUpdateTime())}`
                        : "No recent data"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/*ims-advertisment-app-banner*/}
          <div
            style={styles.GraphcardAdvert}
            className="ims-advertisment-app-banner position-relative"
          >
            <img
              src={adevertisements}
              alt="adevertisements"
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </div>

        {/* 2 line Graph container */}
        <div className="graph-container-two">
          {/* Top Selling Products */}
          <div className="top-selling-dash" style={styles.Graphcard}>
            <div style={{ objectFit: "content", width: "100%" }}>
              <div className="d-flex justify-content-between">
                <div>
                  <div style={styles.Graphheader}>
                    <span style={styles.Graphtitle}>
                      Top Selling Products{" "}
                      <img src={i_icon} alt="i_icon" />
                    </span>
                    <span style={styles.Graphbadge}>+20%</span>
                  </div>
                  <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
                </div>
              </div>
              {isDataZero(dynamicRetailData) ? (
                <div
                  className="blank-data-section"
                  style={{ paddingTop: "80px", textAlign: "center" }}
                >
                  <img
                    src={noData}
                    alt="no-data"
                    style={{ width: "100%", maxWidth: "120px" }}
                  />
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#939090",
                    }}
                  >
                    No Available Data
                  </h1>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#A0A0A0",
                    }}
                  >
                    You don’t have any data yet.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="dashboard-card-graph-scroll"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      fontFamily: "Inter",
                      height: "300px",
                      borderBottom: "1px solid #EAEAEA",
                    }}
                  >
                    {topSellingProducts &&
                      topSellingProducts.length > 0 ? (
                      topSellingProducts.map((p, index) => {
                        // Calculate total revenue
                        const totalRevenue =
                          (p.sellingPrice || 0) * (p.sellQuantity || 0);

                        return (
                          <div
                            key={p.id + index}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "5px 0px",
                              borderTop:
                                index === 0
                                  ? "none"
                                  : "1px solid #EAEAEA",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                flex: 1,
                              }}
                            >
                              <img
                                src={p.image}
                                alt={p.name}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  objectFit: "cover",
                                  borderRadius: "6px",
                                }}
                                onError={(e) => {
                                  e.target.onerror = null; // Prevent infinite loop
                                  e.target.src = NoImg; // Set to default image
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    fontWeight: 500,
                                    fontSize: "14px",
                                    color: "#0E101A",
                                    marginBottom: "4px",
                                  }}
                                >
                                  {p.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#0D6828",
                                    fontWeight: 500,
                                    backgroundColor: "#E8F5E9",
                                    padding: "4px 8px",
                                    borderRadius: "12px",
                                    display: "inline-block",
                                  }}
                                >
                                  {p.sellQuantity || 0}{" "}
                                  <span style={{ color: "#555" }}>
                                    units sold
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                              }}
                            >
                              <div
                                style={{
                                  fontFamily: "Inter",
                                  fontWeight: 600,
                                  fontSize: "16px",
                                  color: "#0E101A",
                                  marginBottom: "4px",
                                }}
                              >
                                ₹{totalRevenue.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                          color: "#6C748C",
                          fontFamily: "Inter",
                        }}
                      >
                        No sales data available for the last 7 days
                      </div>
                    )}
                  </div>

                  <div style={styles.Graphfooter}>
                    <a href="/product" style={styles.Graphlink}>
                      View All
                    </a>
                    <span style={styles.Graphupdate}>
                      <img src={time} alt="time" />
                      {latestTopSaleTime
                        ? `Updated ${getTimeAgo(latestTopSaleTime)}`
                        : "No recent sales"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Daily Earning (old) */}
          {/* <div className="graph-5-dash" style={styles.Graphcard}>
            <div style={{ objectFit: "content", width: "100%" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Earning <img src={i_icon} alt="i_icon" />
                  </span>
                  <span style={styles.Graphbadge}>
                    +{calculateGrowthPercentage()}%
                  </span>
                </div>
                <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
              </div>

              {isDataZero(dailyEarningData) ? (
                <div
                  className="blank-data-section"
                  style={{ paddingTop: "80px", textAlign: "center" }}
                >
                  <img src={noData} alt="no-data" style={{ width: "100%", maxWidth: "120px" }} />
                  <h1 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#939090"
                  }}>
                    No Available Data
                  </h1>
                  <p style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#A0A0A0"
                  }}>
                    You don't have any data yet.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.GraphsalesRow}>
                    <div
                      className="w-100"
                      style={{
                        padding: "16px 0",
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#727681",
                        borderBottom: "1px solid #C2C9D1",
                      }}
                    >
                      <div className="d-flex flex-column gap-2">
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: "57px" }}
                        >
                          <span
                            className="d-flex align-items-center gap-2"
                            style={{
                              fontFamily: "Inter",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: "#7313AA",
                                width: "20px",
                                height: "4px",
                              }}
                            ></span>
                            Total Sales
                          </span>
                          <span
                            className="d-flex align-items-center gap-2"
                            style={{
                              fontFamily: "Inter",
                              fontSize: "14px",
                              fontWeight: "500",
                            }}
                          >
                            <span
                              style={{
                                backgroundColor: "#EE23B1",
                                width: "20px",
                                height: "4px",
                              }}
                            ></span>
                            Profit Earned
                          </span>
                        </div>
                        <div
                          className="d-flex"
                          style={{ marginLeft: "25px", gap: "57px" }}
                        >
                          <span
                            style={{
                              color: "#0E101A",
                              fontSize: "20px",
                              fontWeight: "500",
                              fontFamily: "Inter",
                            }}
                          >
                            ₹{Math.round(dailyEarnings.totalSales).toLocaleString()}
                          </span>
                          <span
                            style={{
                              color: "#0E101A",
                              fontSize: "20px",
                              fontWeight: "500",
                              fontFamily: "Inter",
                            }}
                          >
                            ₹{Math.round(dailyEarnings.totalProfit).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="dashboard-card-graph-scroll"
                    style={{
                      width: "100%",
                      minWidth: "363px",
                      height: "200px",
                      borderBottom: "1px solid rgb(194, 201, 209)",
                      paddingBottom: "15px",
                      paddingTop: "15px",
                    }}
                  >
                    <Line
                      data={dailyEarningData}
                      options={dailyEarningOptions}
                    />
                  </div>

                  <div style={styles.Graphfooter}>
                    <a href="/earnings" style={styles.Graphlink}>
                      View All
                    </a>
                    <span style={styles.Graphupdate}>
                      <img src={time} alt="time" />
                      {latestTopSaleTime ? `Updated ${getTimeAgo(latestTopSaleTime)}` : "No recent data"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div> */}

          {/* Daily Earning */}
          <div className="graph-5-dash" style={styles.Graphcard}>
            <div style={{ width: "100%" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Earning <img src={i_icon} alt="i_icon" />
                  </span>
                  <span style={styles.Graphbadge}>
                    +{calculateGrowthPercentage()}%
                  </span>
                </div>
                <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
              </div>

              {isDataZero(dailyEarningData) ? (
                <div
                  className="blank-data-section"
                  style={{ paddingTop: "80px", textAlign: "center" }}
                >
                  <img
                    src={noData}
                    alt="no-data"
                    style={{ width: "100%", maxWidth: "120px" }}
                  />
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#939090",
                    }}
                  >
                    No Available Data
                  </h1>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#A0A0A0",
                    }}
                  >
                    You don't have any data yet.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.GraphsalesRow}>
                    <div
                      className="w-100"
                      style={{
                        padding: "16px 0",
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#727681",
                        borderBottom: "1px solid #C2C9D1",
                      }}
                    >
                      <div style={styles.GraphlegendWrap}>
                        <div style={styles.GraphlegendItem}>
                          <div style={styles.GraphlegendTop}>
                            <span
                              style={{
                                ...styles.GraphlegendBar,
                                backgroundColor: "#7313AA",
                              }}
                            />
                            Total Sales
                          </div>
                          <div style={styles.GraphlegendValue}>
                            ₹
                            {Math.round(
                              dailyEarnings.totalSales,
                            ).toLocaleString()}
                          </div>
                        </div>

                        <div style={styles.GraphlegendItem}>
                          <div style={styles.GraphlegendTop}>
                            <span
                              style={{
                                ...styles.GraphlegendBar,
                                backgroundColor: "#EE23B1",
                              }}
                            />
                            Profit Earned
                          </div>
                          <div style={styles.GraphlegendValue}>
                            ₹
                            {Math.round(
                              dailyEarnings.totalProfit,
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="dashboard-card-graph-scroll"
                    style={{
                      width: "100%",
                      height: "200px",
                      borderBottom: "1px solid rgb(194, 201, 209)",
                      padding: "15px 0",
                      boxSizing: "border-box",
                    }}
                  >
                    <Line
                      data={dailyEarningData}
                      options={dailyEarningOptions}
                    />
                  </div>

                  <div style={styles.Graphfooter}>
                    <a href="/earnings" style={styles.Graphlink}>
                      View All
                    </a>
                    <span style={styles.Graphupdate}>
                      <img src={time} alt="time" />
                      {latestTopSaleTime
                        ? `Updated ${getTimeAgo(latestTopSaleTime)}`
                        : "No recent data"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Track Purchase Order (old) */}
          {/* <div className="graph-6-dash" style={styles.Graphcard}>
            <div style={{ borderBottom: "1px solid #C2C9D1" }}>
              <div style={styles.Graphheader}>
                <span style={styles.Graphtitle}>
                  Track Purchase Order <img src={i_icon} alt="i_icon" />
                </span>
                <span style={styles.Graphbadge}>
                  {purchaseOrders.length > 0
                    ? `+${Math.min(purchaseOrders.length * 10, 100)}%`
                    : "0%"}
                </span>
              </div>
              <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
            </div>
            {isDataZero(dynamicRetailData) ? (
              <div
                className="blank-data-section"
                style={{ paddingTop: "80px", textAlign: "center" }}
              >
                <img
                  src={noData}
                  alt="no-data"
                  style={{ width: "100%", maxWidth: "120px" }}
                />
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#939090",
                  }}
                >
                  No Available Data
                </h1>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#A0A0A0",
                  }}
                >
                  You don’t have any data yet.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="dashboard-card-graph-scroll"
                  style={{ borderBottom: "1px solid #C2C9D1", height: "300px" }}
                >
                  <table style={{ fontFamily: "Inter", width: "100%" }}>
                    <thead style={{ backgroundColor: "#F3F8FB" }}>
                      <tr style={{ color: "#727681", fontSize: "14px" }}>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Supplier
                        </th>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Deliver In
                        </th>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Status
                        </th>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getLast7DaysPurchaseOrders().map((order, idx) => {
                        const statusInfo = getStatusInfo(order.status);
                        const deliverIn = calculateDeliveryDays(order.dueDate);
                        return (
                          <tr
                            key={order._id || idx}
                            style={{ fontSize: "14px" }}
                          >
                            <td
                              style={{
                                padding: "10px 16px",
                                fontWeight: "400",
                              }}
                            >
                              {order.supplierId?.supplierName || 0}
                            </td>
                            <td
                              style={{
                                padding: "10px 16px",
                                fontWeight: "400",
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 8px",
                                  borderRadius: "12px",
                                  backgroundColor:
                                    deliverIn === "Overdue"
                                      ? "#F7C7C9"
                                      : deliverIn === "Today"
                                        ? "#F7F7C7"
                                        : "#E5F0FF",
                                  color:
                                    deliverIn === "Overdue"
                                      ? "#A80205"
                                      : deliverIn === "Today"
                                        ? "#7E7000"
                                        : "#1F7FFF",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                }}
                              >
                                {deliverIn}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "10px 16px",
                                fontWeight: "400",
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  textAlign: "center",
                                  padding: "4px 12px",
                                  borderRadius: "50px",
                                  backgroundColor: statusInfo.bgColor,
                                  color: statusInfo.textColor,
                                  fontSize: "13px",
                                  fontWeight: "500",
                                  width: "fit-content",
                                }}
                              >
                                <span style={{ fontSize: "12px" }}>
                                  {statusInfo.icon}
                                </span>
                                {statusInfo.text}
                              </span>
                            </td>

                            <td
                              style={{
                                padding: "10px 16px",
                                fontWeight: "400",
                              }}
                            >
                              {order.grandTotal?.toLocaleString() || "0"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={styles.Graphfooter}>
                  <a href="/" style={styles.Graphlink}>
                    View All
                  </a>
                  <span style={styles.Graphupdate}>
                    <img src={time} alt="time" />
                    Updated 30 mins ago
                  </span>
                </div>
              </>
            )}
          </div> */}

          {/* Track Purchase Order */}
          <div className="graph-6-dash" style={styles.Graphcard}>
            <div style={{ borderBottom: "1px solid #C2C9D1" }}>
              <div style={styles.Graphheader}>
                <span style={styles.Graphtitle}>
                  Track Purchase Order <img src={i_icon} alt="i_icon" />
                </span>
                <span style={styles.Graphbadge}>
                  {purchaseOrders.length > 0
                    ? `+${Math.min(purchaseOrders.length * 10, 100)}%`
                    : "0%"}
                </span>
              </div>
              <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
            </div>

            {isDataZero(dynamicRetailData) ? (
              <div
                className="blank-data-section"
                style={{ paddingTop: "80px", textAlign: "center" }}
              >
                <img
                  src={noData}
                  alt="no-data"
                  style={{ width: "100%", maxWidth: "120px" }}
                />
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#939090",
                  }}
                >
                  No Available Data
                </h1>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#A0A0A0",
                  }}
                >
                  You don’t have any data yet.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="dashboard-card-graph-scroll"
                  style={{
                    borderBottom: "1px solid #C2C9D1",
                    height: "300px",
                    overflowX: "auto",
                    overflowY: "auto",
                    width: "100%",

                  }}
                >
                  {/* Add wrapper div for horizontal scroll */}
                  <div style={{ minWidth: "600px" }}> {/* Ensures table doesn't shrink too much */}
                    <table style={{
                      fontFamily: "Inter",
                      width: "100%",
                      borderCollapse: "collapse",
                    }}>
                      <thead style={{
                        backgroundColor: "#F3F8FB",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}>
                        <tr style={{ color: "#727681", fontSize: "14px" }}>
                          <th style={{
                            padding: "12px 16px",
                            fontWeight: "500",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Supplier
                          </th>
                          <th style={{
                            padding: "12px 16px",
                            fontWeight: "500",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Deliver In
                          </th>
                          <th style={{
                            padding: "12px 16px",
                            fontWeight: "500",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Status
                          </th>
                          <th style={{
                            padding: "12px 16px",
                            fontWeight: "500",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}>
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getLast7DaysPurchaseOrders().map((order, idx) => {
                          const statusInfo = getStatusInfo(order.status);
                          const deliverIn = calculateDeliveryDays(order.dueDate);
                          return (
                            <tr
                              key={order._id || idx}
                              style={{
                                fontSize: "14px",
                                borderBottom: idx < getLast7DaysPurchaseOrders().length - 1 ? "1px solid #E2E8F0" : "none",
                              }}
                            >
                              <td style={{
                                padding: "12px 16px",
                                fontWeight: "400",
                                color: "#1E293B",
                              }}>
                                <div style={{
                                  maxWidth: "150px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}>
                                  {order.supplierId?.supplierName || "N/A"}
                                </div>
                              </td>

                              <td style={{
                                padding: "12px 16px",
                                fontWeight: "400",
                              }}>
                                <span style={{
                                  display: "inline-block",
                                  padding: "4px 10px",
                                  borderRadius: "20px",
                                  backgroundColor:
                                    deliverIn === "Overdue" ? "#FEE2E2" :
                                      deliverIn === "Today" ? "#FEF3C7" :
                                        deliverIn === "N/A" ? "#F3F4F6" : "#EFF6FF",
                                  color:
                                    deliverIn === "Overdue" ? "#DC2626" :
                                      deliverIn === "Today" ? "#B45309" :
                                        deliverIn === "N/A" ? "#6B7280" : "#2563EB",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  whiteSpace: "nowrap",
                                }}>
                                  {deliverIn}
                                </span>
                              </td>

                              <td style={{
                                padding: "12px 16px",
                                fontWeight: "400",
                              }}>
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  padding: "4px 12px",
                                  borderRadius: "20px",
                                  backgroundColor: statusInfo.bgColor || "#F3F4F6",
                                  color: statusInfo.textColor || "#4B5563",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  whiteSpace: "nowrap",
                                }}>
                                  <span style={{ fontSize: "14px" }}>
                                    {statusInfo.icon || "•"}
                                  </span>
                                  {statusInfo.text || order.status || "Pending"}
                                </span>
                              </td>

                              <td style={{
                                padding: "12px 16px",
                                fontWeight: "500",
                                color: "#0F172A",
                                textAlign: "right",
                                whiteSpace: "nowrap",
                              }}>
                                ₹{order.grandTotal?.toLocaleString() || "0"}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Show message if no orders */}
                        {getLast7DaysPurchaseOrders().length === 0 && (
                          <tr>
                            <td colSpan="4" style={{
                              padding: "32px 16px",
                              textAlign: "center",
                              color: "#64748B",
                              fontSize: "14px",
                            }}>
                              No purchase orders in the last 7 days
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={styles.Graphfooter}>
                  <a href="/purchase-orders" style={styles.Graphlink}>
                    View All
                  </a>
                  <span style={styles.Graphupdate}>
                    <img src={time} alt="time" />
                    Updated {getLast7DaysPurchaseOrders().length > 0
                      ? `${getTimeAgo(getLatestPurchaseUpdate())}`
                      : "No recent orders"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* graph container three */}
        <div className="graph-container-three">
          {/* Recent Orders (old) */}
          {/* <div className="graph-7-dash" style={styles.Graphcardrecentorders}>
            <div style={{ borderBottom: "1px solid #C2C9D1" }}>
              <div style={styles.Graphheader}>
                <span style={styles.Graphtitle}>
                  Recent Orders <img src={i_icon} alt="i_icon" />
                </span>
                <span style={styles.Graphbadge}>+20%</span>
              </div>
              <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
            </div>
            {isDataZero(dynamicRetailData) ? (
              <div
                className="blank-data-section"
                style={{ paddingTop: "80px", textAlign: "center" }}
              >
                <img
                  src={noData}
                  alt="no-data"
                  style={{ width: "100%", maxWidth: "120px" }}
                />
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#939090",
                  }}
                >
                  No Available Data
                </h1>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#A0A0A0",
                  }}
                >
                  You don’t have any data yet.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="dashboard-card-graph-scroll"
                  style={{ borderBottom: "1px solid #C2C9D1", height: "300px" }}
                >
                  <table
                    style={{
                      fontFamily: "Inter",
                      width: "100%",
                      height: "200px",
                    }}
                  >
                    <thead style={{ backgroundColor: "#F3F8FB" }}>
                      <tr style={{ color: "#727681", fontSize: "14px" }}>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Order ID
                        </th>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Customer
                        </th>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          No. Of Items
                        </th>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Status
                        </th>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Payment Method
                        </th>
                        <th style={{ padding: "10px 16px", fontWeight: "400" }}>
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastWeekSales.map((item, idx) => (
                        <tr key={idx} style={{ fontSize: "14px" }}>
                          <td
                            style={{ padding: "10px 16px", fontWeight: "400" }}
                          >
                            {item.invoiceNo}
                          </td>
                          <td
                            style={{ padding: "10px 16px", fontWeight: "400" }}
                          >
                            {item.customer}
                          </td>
                          <td
                            style={{ padding: "10px 16px", fontWeight: "400" }}
                          >
                            {item.soldItems}
                          </td>

                          <td
                            style={{ padding: "10px 16px", fontWeight: "400" }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                textAlign: "center",
                                padding: "1px 6px",
                                borderRadius: "50px",
                                backgroundColor:
                                  item.status === "Pending"
                                    ? "#FFF2D5"
                                    : item.status === "Success"
                                      ? "#D4F7C7"
                                      : "",

                                color:
                                  item.status === "Pending"
                                    ? "#CF4F00"
                                    : item.status === "Success"
                                      ? "#01774B"
                                      : "",
                              }}
                            >
                              <span style={{ fontSize: "12px" }}>
                                {item.status === "Pending"
                                  ? "!"
                                  : item.status === "Success"
                                    ? "✓"
                                    : ""}
                              </span>

                              {item.status}
                            </span>
                          </td>
                          <td
                            style={{ padding: "10px 16px", fontWeight: "400" }}
                          >
                            {item.paymentMethod}
                          </td>
                          <td
                            style={{ padding: "10px 16px", fontWeight: "400" }}
                          >
                            {item.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={styles.Graphfooter}>
                  <a href="/online-orders" style={styles.Graphlink}>
                    View All
                  </a>
                  <span style={styles.Graphupdate}>
                    <img src={time} alt="time" />
                    {latestSale
                      ? `Updated ${getTimeAgo(latestSale.invoiceDate)}`
                      : "No recent updates"}
                  </span>
                </div>
              </>
            )}
          </div> */}

          {/* Recent Orders */}
          <div className="graph-7-dash" style={styles.Graphcardrecentorders}>
            <div style={{ borderBottom: "1px solid #C2C9D1" }}>
              <div style={styles.Graphheader}>
                <span style={styles.Graphtitle}>
                  Recent Orders <img src={i_icon} alt="i_icon" />
                </span>
                <span style={styles.Graphbadge}>+20%</span>
              </div>
              <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
            </div>

            {isDataZero(dynamicRetailData) ? (
              <div
                className="blank-data-section"
                style={{ paddingTop: "80px", textAlign: "center" }}
              >
                <img
                  src={noData}
                  alt="no-data"
                  style={{ width: "100%", maxWidth: "120px" }}
                />
                <h1
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#939090",
                  }}
                >
                  No Available Data
                </h1>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#A0A0A0",
                  }}
                >
                  You don’t have any data yet.
                </p>
              </div>
            ) : (
              <>
                <div
                  className="dashboard-card-graph-scroll"
                  style={{
                    borderBottom: "1px solid #C2C9D1",
                    height: "300px",
                    overflowX: "auto",
                    overflowY: "auto",
                    width: "100%",
                  }}
                >
                  {/* Wrapper div for horizontal scroll - keeps original colors */}
                  <div style={{ minWidth: "1000px" }}>
                    <table style={{
                      fontFamily: "Inter",
                      width: "100%",
                      borderCollapse: "collapse",
                    }}>
                      <thead style={{
                        backgroundColor: "#F3F8FB",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}>
                        <tr style={{ color: "#727681", fontSize: "14px" }}>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Order ID
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Customer
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}>
                            No. Of Items
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Status
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Payment Method
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}>
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastWeekSales.map((item, idx) => (
                          <tr
                            key={idx}
                            style={{
                              fontSize: "14px",
                              borderBottom: idx < lastWeekSales.length - 1 ? "1px solid #E2E8F0" : "none",
                            }}
                          >
                            <td style={{
                              padding: "10px 16px",
                              fontWeight: "400",
                              whiteSpace: "nowrap",
                            }}>
                              {item.invoiceNo}
                            </td>

                            <td style={{
                              padding: "10px 16px",
                              fontWeight: "400",
                            }}>
                              <div style={{
                                maxWidth: "150px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}>
                                {item.customer}
                              </div>
                            </td>

                            <td style={{
                              padding: "10px 16px",
                              fontWeight: "400",
                              textAlign: "center",
                              whiteSpace: "nowrap",
                            }}>
                              {item.soldItems}
                            </td>

                            <td style={{
                              padding: "10px 16px",
                              fontWeight: "400",
                            }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                  padding: "1px 12px",
                                  borderRadius: "50px",
                                  backgroundColor:
                                    item.status === "Pending"
                                      ? "#FFF2D5"
                                      : item.status === "Success"
                                        ? "#D4F7C7"
                                        : "#F3F4F6",
                                  color:
                                    item.status === "Pending"
                                      ? "#CF4F00"
                                      : item.status === "Success"
                                        ? "#01774B"
                                        : "#4B5563",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span style={{ fontSize: "12px" }}>
                                  {item.status === "Pending"
                                    ? "!"
                                    : item.status === "Success"
                                      ? "✓"
                                      : ""}
                                </span>
                                {item.status}
                              </span>
                            </td>

                            <td style={{
                              padding: "10px 16px",
                              fontWeight: "400",
                              whiteSpace: "nowrap",
                            }}>
                              {item.paymentMethod}
                            </td>

                            <td style={{
                              padding: "10px 16px",
                              fontWeight: "400",
                              textAlign: "right",
                              whiteSpace: "nowrap",
                            }}>
                              {item.totalAmount?.toFixed(2)}
                            </td>
                          </tr>
                        ))}

                        {/* Show message if no orders - keeps original styling */}
                        {lastWeekSales.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{
                              padding: "32px 16px",
                              textAlign: "center",
                              color: "#727681",
                              fontSize: "14px",
                            }}>
                              No orders in the last 7 days
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={styles.Graphfooter}>
                  <a href="/online-orders" style={styles.Graphlink}>
                    View All
                  </a>
                  <span style={styles.Graphupdate}>
                    <img src={time} alt="time" />
                    {latestSale
                      ? `Updated ${getTimeAgo(latestSale.invoiceDate)}`
                      : "No recent updates"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* New Customer Vs Returning Customer (old) */}
          {/* <div className="graph-8-dash" style={styles.Graphcard}>
            <div style={{ objectFit: "content", width: "100%" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    New Customer Vs Returning Customer{" "}
                    <img src={i_icon} alt="i_icon" />
                  </span>
                  <span style={styles.Graphbadge}>+20%</span>
                </div>
                <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
              </div>
              {isDataZero(dynamicRetailData) ? (
                <div
                  className="blank-data-section"
                  style={{ paddingTop: "80px", textAlign: "center" }}
                >
                  <img src={noData} alt="no-data" style={{ width: "100%", maxWidth: "120px" }} />
                  <h1 style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#939090"
                  }}>
                    No Available Data
                  </h1>
                  <p style={{
                    fontSize: "15px",
                    fontWeight: "500",
                    color: "#A0A0A0"
                  }}>
                    You don’t have any data yet.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.GraphsalesRow}>
                    <div className="w-100" style={{
                      padding: "16px 0",
                      fontFamily: '"Poppins", sans-serif',
                      fontWeight: "500",
                      fontSize: "14px",
                      color: "#727681",
                      borderBottom: "1px solid #C2C9D1",
                    }}>
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex align-items-center" style={{ gap: "57px" }}>
                          <span className="d-flex align-items-center gap-2" style={{
                            fontFamily: "Inter",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}>
                            <span style={{ backgroundColor: "#C8DFFF", width: "20px", height: "4px" }}></span>
                            New Customers
                          </span>
                          <span className="d-flex align-items-center gap-2" style={{
                            fontFamily: "Inter",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}>
                            <span style={{ backgroundColor: "#1F7FFF", width: "20px", height: "4px" }}></span>
                            Returning Customers
                          </span>
                        </div>
                        <div className="d-flex" style={{ marginLeft: "25px", gap: "57px" }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{
                              color: "#0E101A",
                              fontSize: "20px",
                              fontWeight: "500",
                              fontFamily: "Inter",
                            }}>
                              {getCustomerChartData.totalNewCustomers}
                            </span>
                            <span style={{
                              color: "#727681",
                              fontSize: "12px",
                              fontFamily: "Inter",
                            }}>
                              ₹{Math.round(getCustomerChartData.totalNewCustomerAmount).toLocaleString()}
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{
                              color: "#0E101A",
                              fontSize: "20px",
                              fontWeight: "500",
                              fontFamily: "Inter",
                            }}>
                              {getCustomerChartData.totalReturningCustomers}
                            </span>
                            <span style={{
                              color: "#727681",
                              fontSize: "12px",
                              fontFamily: "Inter",
                            }}>
                              ₹{Math.round(getCustomerChartData.totalReturningCustomerAmount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="dashboard-card-graph-scroll"
                    style={{
                      width: "100%",
                      height: "175px",
                      borderBottom: "1px solid rgb(194, 201, 209)",
                      paddingBottom: "15px",
                    }}
                  >
                    <Bar
                      data={datasFour}
                      options={customerChartOptions}
                    />
                  </div>

                  <div style={styles.Graphfooter}>
                    <a href="/customers" style={styles.Graphlink}>
                      View All
                    </a>
                    <span style={styles.Graphupdate}>
                      <img src={time} alt="time" />
                      {latestCustomerUpdate ? `Updated ${getCustomerTimeAgo(latestCustomerUpdate)}` : "No recent updates"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div> */}

          {/* New Customer Vs Returning Customer */}
          <div className="graph-8-dash" style={styles.Graphcard}>
            <div style={{ width: "100%" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    New Customer Vs Returning Customer{" "}
                    <img src={i_icon} alt="i_icon" />
                  </span>
                  <span style={styles.Graphbadge}>+20%</span>
                </div>
                <p style={styles.Graphsubtext}>{getDateRangeText()}</p>
              </div>

              {isDataZero(datasFour) ? (
                <div
                  className="blank-data-section"
                  style={{ paddingTop: "80px", textAlign: "center" }}
                >
                  <img
                    src={noData}
                    alt="no-data"
                    style={{ width: "100%", maxWidth: "120px" }}
                  />
                  <h1
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#939090",
                    }}
                  >
                    No Available Data
                  </h1>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: "500",
                      color: "#A0A0A0",
                    }}
                  >
                    You don’t have any data yet.
                  </p>
                </div>
              ) : (
                <>
                  <div style={styles.GraphsalesRow}>
                    <div
                      className="w-100"
                      style={{
                        padding: "16px 0",
                        fontFamily: '"Poppins", sans-serif',
                        fontWeight: "500",
                        fontSize: "14px",
                        color: "#727681",
                        borderBottom: "1px solid #C2C9D1",
                      }}
                    >
                      <div style={styles.GraphlegendWrap}>
                        <div style={styles.GraphlegendItem}>
                          <div style={styles.GraphlegendTop}>
                            <span
                              style={{
                                ...styles.GraphlegendBar,
                                backgroundColor: "#C8DFFF",
                              }}
                            />
                            New Customers
                          </div>
                          <div style={styles.GraphlegendValue}>
                            {getCustomerChartData.totalNewCustomers}
                          </div>
                          <div style={styles.GraphlegendSubValue}>
                            ₹
                            {Math.round(
                              getCustomerChartData.totalNewCustomerAmount,
                            ).toLocaleString()}
                          </div>
                        </div>

                        <div style={styles.GraphlegendItem}>
                          <div style={styles.GraphlegendTop}>
                            <span
                              style={{
                                ...styles.GraphlegendBar,
                                backgroundColor: "#1F7FFF",
                              }}
                            />
                            Returning Customers
                          </div>
                          <div style={styles.GraphlegendValue}>
                            {getCustomerChartData.totalReturningCustomers}
                          </div>
                          <div style={styles.GraphlegendSubValue}>
                            ₹
                            {Math.round(
                              getCustomerChartData.totalReturningCustomerAmount,
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="dashboard-card-graph-scroll"
                    style={{
                      width: "100%",
                      height: "175px",
                      borderBottom: "1px solid rgb(194, 201, 209)",
                      padding: "15px 0",
                      boxSizing: "border-box",
                    }}
                  >
                    <Bar data={datasFour} options={customerChartOptions} />
                  </div>

                  <div style={styles.Graphfooter}>
                    <a href="/customers" style={styles.Graphlink}>
                      View All
                    </a>
                    <span style={styles.Graphupdate}>
                      <img src={time} alt="time" />
                      {latestCustomerUpdate
                        ? `Updated ${getCustomerTimeAgo(latestCustomerUpdate)}`
                        : "No recent updates"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
