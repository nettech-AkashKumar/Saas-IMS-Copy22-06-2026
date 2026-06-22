import { useState, useEffect, useCallback } from "react";
//npm
import DonutChart from "react-donut-chart";
import { Box, Typography } from "@mui/material";
import { LineChart } from "@mui/x-charts";
import { PieChart, Pie, Cell } from "recharts";
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
import { Link, useParams, useNavigate } from "react-router-dom";
import { he } from "date-fns/locale";
import api from "../../../pages/config/axiosInstance";
//images
import Polygon from "../../../assets/images/Polygon-2.png";
import Poly from "../../../assets/images/Polygon-1.png";
import Polygont from "../../../assets/images/Polygon3.png";
import Polygo from "../../../assets/images/Polygon4.png";
import nodata from "../../../assets/images/no-data.png";
import { Info, Clock, ChevronDown, Calendar, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function WarehouseDetails() {
  const [activeTab, setActiveTab] = useState("All");
  const [product, setProducts] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedRack, setSelectedRack] = useState(null);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [zoneProducts, setZoneProducts] = useState([]);
  const [warehouseProductCount, setWarehouseProductCount] = useState(0);
  const [allWarehouseProducts, setAllWarehouseProducts] = useState([]);

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
  const navigate = useNavigate();

  const isDataZero = (data) => {
    return !data || data.length === 0;
  };

  // ✅ Count total products in warehouse from all zones/racks/shelves/bins
  const countWarehouseProducts = (warehouse) => {
    if (!warehouse?.zones) return 0;

    let totalCount = 0;
    warehouse.zones.forEach((zone) => {
      if (zone.racks && Array.isArray(zone.racks)) {
        zone.racks.forEach((rack) => {
          if (rack.shelves && Array.isArray(rack.shelves)) {
            rack.shelves.forEach((shelf) => {
              if (shelf.bins && Array.isArray(shelf.bins)) {
                shelf.bins.forEach((bin) => {
                  if (bin.products && Array.isArray(bin.products)) {
                    totalCount += bin.products.length;
                  }
                });
              }
            });
          }
        });
      }
    });
    return totalCount;
  };

  // ✅ Extract ALL unique product entries from warehouse
  const extractAllWarehouseProductEntries = (warehouse) => {
    if (!warehouse?.zones) return [];

    const entries = [];
    const productMap = {}; // To avoid duplicates and track quantities

    warehouse.zones.forEach((zone) => {
      if (zone.racks && Array.isArray(zone.racks)) {
        zone.racks.forEach((rack) => {
          if (rack.shelves && Array.isArray(rack.shelves)) {
            rack.shelves.forEach((shelf) => {
              if (shelf.bins && Array.isArray(shelf.bins)) {
                shelf.bins.forEach((bin) => {
                  if (bin.products && Array.isArray(bin.products)) {
                    bin.products.forEach((storedProduct) => {
                      const productId =
                        storedProduct.productId?._id || storedProduct.productId;
                      if (productId) {
                        const key = productId.toString();
                        if (!productMap[key]) {
                          productMap[key] = {
                            productId,
                            totalQuantity: 0,
                            locations: [],
                          };
                        }
                        productMap[key].totalQuantity +=
                          storedProduct.quantity || 0;
                        productMap[key].locations.push({
                          zone: zone.zoneName || zone.zoneCode,
                          rack: rack.rackName || rack.rackCode,
                          shelf: shelf.shelfName || shelf.shelfCode,
                          bin: bin.binName,
                          binQRCode: bin.binQRCode,
                          quantity: storedProduct.quantity || 0,
                          unit: storedProduct.unit || "Pcs",
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    return Object.values(productMap);
  };

  // ✅ Fetch and match all warehouse products with Product model
  const fetchAndMatchWarehouseProducts = async (warehouse) => {
    try {
      const entries = extractAllWarehouseProductEntries(warehouse);
      if (entries.length === 0) {
        setAllWarehouseProducts([]);
        return;
      }

      // Get unique product IDs
      const uniqueProductIds = entries.map((e) => e.productId);

      // Fetch all product details
      const productDetailsPromises = uniqueProductIds.map((productId) =>
        api.get(`/api/products/${productId}`).catch(() => null),
      );

      const responses = await Promise.all(productDetailsPromises);
      const productDetails = responses
        .filter((res) => res !== null)
        .map((res) => res.data.product || res.data);

      // Match and enrich with warehouse location data
      const matchedProducts = productDetails.map((product) => {
        const entry = entries.find(
          (e) =>
            e.productId === product._id ||
            e.productId.toString() === product._id.toString(),
        );
        return {
          ...product,
          warehouseQuantity: entry?.totalQuantity || 0,
          storageLocations: entry?.locations || [],
        };
      });

      setAllWarehouseProducts(matchedProducts);
      setWarehouseProductCount(entries.length);
    } catch (err) {
      console.error("Error fetching warehouse products:", err);
      setAllWarehouseProducts([]);
      setWarehouseProductCount(0);
    }
  };

  // ✅ Extract products from a specific zone, rack, and shelf
  const getZoneProducts = (zone = null, rack = null, shelf = null) => {
    if (!warehousesDetails?.zones) return [];

    let productsData = [];

    warehousesDetails.zones.forEach((z) => {
      if (zone && z._id !== zone._id && z.zoneCode !== zone.zoneCode) return;

      if (z.racks && Array.isArray(z.racks)) {
        z.racks.forEach((r) => {
          if (rack && r._id !== rack._id && r.rackCode !== rack.rackCode)
            return;

          if (r.shelves && Array.isArray(r.shelves)) {
            r.shelves.forEach((s) => {
              if (
                shelf &&
                s._id !== shelf._id &&
                s.shelfCode !== shelf.shelfCode
              )
                return;

              if (s.bins && Array.isArray(s.bins)) {
                s.bins.forEach((bin) => {
                  if (bin.products && Array.isArray(bin.products)) {
                    bin.products.forEach((storedProduct) => {
                      const productId =
                        storedProduct.productId?._id || storedProduct.productId;
                      const matchingProduct = product.find(
                        (p) => p._id === productId,
                      );

                      if (matchingProduct) {
                        productsData.push({
                          ...matchingProduct,
                          binQuantity: storedProduct.quantity || 0,
                          binUnit: storedProduct.unit || "Pcs",
                          zone: z.zoneName || z.zoneCode,
                          rack: r.rackName || r.rackCode,
                          shelf: s.shelfName || s.shelfCode,
                          bin: bin.binName,
                          binQRCode: bin.binQRCode,
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    return productsData;
  };

  // ✅ Click handler for zone
  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
    setSelectedRack(null);
    setSelectedShelf(null);
    const zoneProds = getZoneProducts(zone);
    setZoneProducts(zoneProds);
    setActiveTab("Zones");
  };

  // ✅ Click handler for rack
  const handleRackClick = (zone, rack) => {
    setSelectedRack(rack);
    setSelectedShelf(null);
    const zoneProds = getZoneProducts(zone, rack);
    setZoneProducts(zoneProds);
  };

  // ✅ Click handler for shelf
  const handleShelfClick = (zone, rack, shelf) => {
    setSelectedShelf(shelf);
    const zoneProds = getZoneProducts(zone, rack, shelf);
    setZoneProducts(zoneProds);
  };

  // ✅ Extract all product entries from zones, racks, shelves, bins
  const collectProductEntries = (warehouse) => {
    const entries = [];
    if (!warehouse || !warehouse.zones) return entries;

    warehouse.zones.forEach((zone) => {
      if (zone.racks && Array.isArray(zone.racks)) {
        zone.racks.forEach((rack) => {
          if (rack.shelves && Array.isArray(rack.shelves)) {
            rack.shelves.forEach((shelf) => {
              if (shelf.bins && Array.isArray(shelf.bins)) {
                shelf.bins.forEach((bin) => {
                  if (bin.products && Array.isArray(bin.products)) {
                    bin.products.forEach((storedProduct) => {
                      const productId =
                        storedProduct.productId?._id || storedProduct.productId;
                      if (productId) {
                        entries.push({
                          productId,
                          zone: zone.zoneName || zone.zoneCode,
                          rack: rack.rackName || rack.rackCode,
                          shelf: shelf.shelfName || shelf.shelfCode,
                          bin: bin.binName,
                          storedQuantity: storedProduct.quantity || 0,
                          unit: storedProduct.unit || "Pcs",
                        });
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    });

    return entries;
  };

  // ✅ Fetch product details for entries
  const fetchProductDetailsFromZones = async (entries) => {
    if (!entries || entries.length === 0) {
      setProducts([]);
      return;
    }

    try {
      const uniqueProductIds = [...new Set(entries.map((e) => e.productId))];

      // Fetch all product details
      const productDetailsPromises = uniqueProductIds.map((productId) =>
        api.get(`/api/products/${productId}`).catch(() => null),
      );

      const responses = await Promise.all(productDetailsPromises);
      const productDetails = responses
        .filter((res) => res !== null)
        .map((res) => res.data.product || res.data);

      // Enrich products with zone/shelf/bin location data
      const enrichedProducts = productDetails.map((product) => {
        const locations = entries.filter((e) => e.productId === product._id);
        return {
          ...product,
          storageLocations: locations,
        };
      });

      setProducts(enrichedProducts);

      const initialTabs = enrichedProducts.reduce((acc, product) => {
        acc[product._id] = "general";
        return acc;
      }, {});
      setActiveTabs(initialTabs);
    } catch (err) {
      console.error("Failed to fetch product details from zones", err);
      setProducts([]);
    }
  };

  const detailsWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/warehouse/${id}`);
      setWarehousesDetails(res.data.warehouse);

      if (res.data.warehouse.blocks) {
        setBlocks(res.data.warehouse.blocks);
      }

      // ✅ Fetch and match all products in warehouse
      await fetchAndMatchWarehouseProducts(res.data.warehouse);

      // ✅ Calculate product count
      const count = countWarehouseProducts(res.data.warehouse);
      setWarehouseProductCount(count);

      // ✅ Fetch products from zones/shelves/bins for display
      const entries = collectProductEntries(res.data.warehouse);
      await fetchProductDetailsFromZones(entries);
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

  // Products are now fetched from warehouse zones in detailsWarehouses()
  // No separate product fetch needed

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

  // ✅ Enhanced Stock In/Out filtering with proper data mapping
  const filteredPurchases = purchases.filter((purchase) => {
    let statusMatch = true;

    // Filter by active tab
    if (activeTab === "Stock In") {
      statusMatch = purchase.status === "Received";
    } else if (activeTab === "Stock Out") {
      statusMatch = purchase.status === "Ordered";
    } else if (activeTab === "Transfer") {
      statusMatch = purchase.status === "Transfer";
    } else if (activeTab === "Processing") {
      statusMatch = purchase.status === "Processing";
    }
    // "All" tab shows all status

    if (!statusMatch) return false;

    if (!Array.isArray(purchase.products) || purchase.products.length === 0) {
      return false;
    }

    // Check if any product belongs to this warehouse
    const warehouseMatch = purchase.products.some((purchaseProduct) => {
      const productId = getId(purchaseProduct?.product);
      if (!productId) return false;

      const productWarehouse = productToWarehouseMap[productId];
      return productWarehouse === warehousesDetails?.warehouseName;
    });

    return warehouseMatch;
  });

  // ✅ Get Stock In purchases (products added to warehouse)
  const stockInData = purchases
    .filter((p) => p.status === "Received" && warehousesDetails?.warehouseName)
    .flatMap((purchase) =>
      (purchase.products || []).map((prod) => ({
        _id: purchase._id,
        productId: getId(prod?.product),
        productName: prod.product?.productName || "Unknown",
        quantity: prod.quantity || 0,
        date: purchase.createdAt || purchase.date,
        status: purchase.status,
        reference: purchase.purchaseNumber || purchase._id,
        type: "Stock In",
      })),
    )
    .filter(
      (item) =>
        productToWarehouseMap[item.productId] ===
        warehousesDetails?.warehouseName,
    );

  // ✅ Get Stock Out sales/transfers (products removed from warehouse)
  const stockOutData = sales
    .flatMap((sale) =>
      (sale.products || []).map((prod) => ({
        _id: sale._id,
        productId: getId(prod?.productId),
        productName: prod.product?.productName || "Unknown",
        quantity: prod.saleQty || 0,
        date: sale.createdAt || sale.date,
        status: "Completed",
        reference: sale.invoiceNumber || sale._id,
        type: "Stock Out",
      })),
    )
    .filter(
      (item) =>
        productToWarehouseMap[item.productId] ===
        warehousesDetails?.warehouseName,
    );

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

  // Stock Movement Graph Data
  const [timeFrame, setTimeFrame] = useState("This Month");

  const categoryColorMap = {
    Electronics: "#2F80ED",
    Food: "#7FB3FF",
    Cloth: "#A5C9FF",
    Furniture: "#CDE1FF",
    Utensils: "#E0EBFF",
    Others: "#F0F5FF",
  };

  const categoryCounts = filteredProducts.reduce((acc, item) => {
    const category =
      item.category?.name || item.category || item.productCategory || "Others";
    const normalized = category || "Others";
    const quantity = Number(item.quantity) || 0;
    acc[normalized] = (acc[normalized] || 0) + quantity;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
    color: categoryColorMap[name] || "#D0E1FB",
  }));

  if (categoryData.length === 0) {
    categoryData.push({ name: "Others", value: 1, color: "#D0E1FB" });
  }

  const totalValue = categoryData.reduce((acc, item) => acc + item.value, 0);

  const monthDays = Array.from({ length: 31 }, (_, i) => ({
    day: (i + 1).toString(),
    inward: 0,
    outward: 0,
  }));

  const stockMovementEntries = [...stockInData, ...stockOutData];

  stockMovementEntries.forEach((item) => {
    const date = new Date(item.date);
    const today = new Date();
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    ) {
      const dayIndex = date.getDate() - 1;
      const entry = monthDays[dayIndex];
      if (!entry) return;
      if (item.type === "Stock In") {
        entry.inward += Number(item.quantity) || 0;
      } else if (item.type === "Stock Out") {
        entry.outward += Number(item.quantity) || 0;
      }
    }
  });

  const monthlyDayWiseData = monthDays;

  const weekLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = weekLabels.map((day) => ({ day, inward: 0, outward: 0 }));

  stockMovementEntries.forEach((item) => {
    const date = new Date(item.date);
    const today = new Date();
    if (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth()
    ) {
      const weekIndex = date.getDay();
      const entry = weeklyData[weekIndex];
      if (!entry) return;
      if (item.type === "Stock In") {
        entry.inward += Number(item.quantity) || 0;
      } else if (item.type === "Stock Out") {
        entry.outward += Number(item.quantity) || 0;
      }
    }
  });

  const activeData =
    timeFrame === "This Week" ? weeklyData : monthlyDayWiseData;

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "90vh" }}>
      {/* Header: line */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ marginBottom: "20px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Link
            to="/warehouse"
            style={{
              color: "#676767",
              fontSize: "18px",
              fontWeight: "500",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              textDecoration: "none",
            }}
          >
            Warehouse
          </Link>
          <MdArrowForwardIos style={{ color: "#676767" }} />
          <span
            style={{
              fontSize: "18px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "600", color: "black" }}>
              {warehousesDetails?.warehouseName}
            </span>
          </span>
        </div>

        {/* <div>
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
        </div> */}
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

        {/* Card 4 - Warehouse Products Count */}
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
                Products in Warehouse
              </span>

              <h4
                className="mb-0"
                style={{
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#0E101A",
                }}
              >
                {warehouseProductCount}
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
              <PiWarehouseBold />
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

      {/* Product Distribution + Stock Movement */}

      <div
        className=""
        style={{
          display: "flex",
          gap: "24px",
        }}
      >
        {/* Donut Graph */}
        <div
          className=""
          style={{
            marginTop: "20px",
            minHeight: "520px",
            width: "300px",
            background: "white",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #F1F1F1",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h3
              style={{
                color: "#262626",
                fontWeight: 600,
                fontSize: "16px",
              }}
            >
              Product Distribution
            </h3>
          </div>

          <div
            style={{
              height: "260px",
              width: "100%",
              position: "relative",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip cursor={false} />
              </PieChart>
            </ResponsiveContainer>

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  color: "#000",
                  fontSize: "14px",
                }}
              >
                Total
              </span>

              <span
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#000",
                }}
              >
                {totalValue}
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {categoryData.map((item) => (
              <div
                key={item.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{
                      accentColor: item.color,
                      width: "16px",
                      height: "16px",
                    }}
                  />

                  <span
                    style={{
                      fontSize: "14px",
                      color: "#000",
                    }}
                  >
                    {item.name}

                    <span
                      style={{
                        color: "#6B7280",
                      }}
                    >
                      {" "}
                      ({item.value})
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Movement */}
        <div
          style={{
            marginTop: "20px",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            minHeight: "520px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#0E101A",
                  margin: 0,
                }}
              >
                Stock Movement
              </h3>

              <p
                style={{
                  color: "#727681",
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                {timeFrame}
              </p>
            </div>

            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              style={{
                padding: "8px 12px",
                border: "1px solid #E6E6E6",
                borderRadius: "8px",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          {/* Chart */}
          <div
            style={{
              height: "400px",
              overflowX: "auto",
            }}
          >
            <div
              style={{
                width: timeFrame === "This Month" ? "2600px" : "100%",
                height: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={activeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  barGap={8}
                  barCategoryGap={8}
                >
                  <CartesianGrid vertical={false} horizontal={false} />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#9CA3AF",
                      fontSize: 14,
                    }}
                    dy={10}
                    interval={0}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: "#9CA3AF",
                      fontSize: 12,
                    }}
                  />

                  <Tooltip cursor={{ fill: "transparent" }} />

                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{
                      paddingTop: "35px",
                    }}
                  />

                  <Bar
                    name="Inward"
                    dataKey="inward"
                    fill="#E0EBFF"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />

                  <Bar
                    name="Outward"
                    dataKey="outward"
                    fill="#1F7FFF"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
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
          {/* Table */}
          <div
            style={{
              overflowY: "auto",
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
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                    }}
                  >
                    Product
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
                    SKU
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
                    MRP
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
                    Available Qty
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
                    Unit Sold
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
                    Revenue
                  </th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {product
                  .filter(
                    (item) =>
                      item.warehouseName === warehousesDetails?.warehouseName,
                  )
                  .sort(
                    (a, b) => (salesMap[b._id] || 0) - (salesMap[a._id] || 0),
                  )
                  .slice(0, 5).length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div
                        style={{
                          minHeight: "280px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <img
                          src={nodata}
                          alt="No Data"
                          style={{
                            width: "140px",
                            height: "140px",
                            objectFit: "contain",
                          }}
                        />

                        <span
                          style={{
                            color: "#727681",
                            fontSize: "16px",
                            fontWeight: 500,
                          }}
                        >
                          No Top Selling Product Found
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  product
                    .filter(
                      (item) =>
                        item.warehouseName === warehousesDetails?.warehouseName,
                    )
                    .sort(
                      (a, b) => (salesMap[b._id] || 0) - (salesMap[a._id] || 0),
                    )
                    .slice(0, 5)
                    .map((item, idx) => {
                      const soldUnits = salesMap[item._id] || 0;

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid #EAEAEA",
                          }}
                        >
                          {/* Product */}
                          <td
                            style={{
                              padding: "12px 16px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <div
                                style={{
                                  width: 40,
                                  height: 40,
                                  border: "1px solid #EAEAEA",
                                  borderRadius: 8,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  overflow: "hidden",
                                }}
                              >
                                <img
                                  src={item.images[0]?.url}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              </div>

                              <span
                                style={{
                                  fontSize: 14,
                                  color: "#0E101A",
                                  fontWeight: 500,
                                }}
                              >
                                {item.productName}
                              </span>
                            </div>
                          </td>

                          {/* SKU */}
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                            }}
                          >
                            {item.sku}
                          </td>

                          {/* MRP */}
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                            }}
                          >
                            ₹{item.sellingPrice}
                          </td>

                          {/* Available Qty */}
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                            }}
                          >
                            {item.quantity} {item.unit}
                          </td>

                          {/* Sold */}
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                            }}
                          >
                            {soldUnits}
                          </td>

                          {/* Revenue */}
                          <td
                            style={{
                              padding: "12px 16px",
                              fontSize: 14,
                              color: "#16A34A",
                              fontWeight: 600,
                            }}
                          >
                            ₹{soldUnits * item.sellingPrice}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
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
          {warehousesDetails?.zones?.map((zone, idx) => (
            <div className="col-3 p-2" key={idx}>
              <div
                onClick={() => {
                  // Call handler to display zone products in table
                  handleZoneClick(zone);
                  // Navigate to zone details
                  navigate(`/zones`, {
                    state: {
                      warehouse: warehousesDetails,
                      zone,
                    },
                  });
                }}
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
                      {zone.zoneName || zone.zoneCode || `Zone ${idx + 1}`}
                    </span>
                  </div>

                  {/* Percentage */}
                  {/* <div
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
                    {calculateZoneUsagePercentage(idx)}%
                  </div> */}
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
                      {getUniqueProductsForZone(idx).length > 0 ? (
                        getUniqueProductsForZone(idx)
                          .slice(0, 2)
                          .map((productName, productIdx) => (
                            <span
                              key={productIdx}
                              style={{
                                background: "#F3F8FF",
                                color: "#1368EC",
                                padding: "2px 8px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 500,
                              }}
                            >
                              {productName}
                            </span>
                          ))
                      ) : (
                        <span
                          style={{
                            background: "#F3F4F6",
                            color: "#6B7280",
                            padding: "2px 8px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 500,
                          }}
                        >
                          No Products
                        </span>
                      )}
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              width: "fit-content",
              overflowX: "auto",
            }}
          >
            {["All", "Zones", "Stock In", "Stock Out"].map((tab) => (
              <div
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === "Stock In") {
                    // Stock In tab selected
                  } else if (tab === "Stock Out") {
                    // Stock Out tab selected
                  }
                }}
                style={{
                  padding: "6px 12px",
                  background: activeTab === tab ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow:
                    activeTab === tab
                      ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                      : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "#0E101A",
                  cursor: "pointer",
                  transition: "0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {tab}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* Table */}
        <div
          style={{
            overflowY: "auto",
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
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 400,
                  }}
                >
                  Product
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
                  Time
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
                  Qty
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
                  Movement Type
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
                  Source/Destination
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
                  Reference
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {(() => {
                // Determine which data to display based on activeTab
                let displayData = [];
                let noDataMessage = "No data found";

                if (activeTab === "Zones") {
                  displayData = zoneProducts;
                  noDataMessage = "No products in selected zone";
                } else if (activeTab === "Stock In") {
                  displayData = stockInData;
                  noDataMessage = "No Stock In transactions found";
                } else if (activeTab === "Stock Out") {
                  displayData = stockOutData;
                  noDataMessage = "No Stock Out transactions found";
                } else {
                  displayData = filteredPurchases;
                  noDataMessage = "No Stock Movement Found";
                }

                // Check if data is empty
                if (displayData?.length === 0) {
                  return (
                    <tr>
                      <td colSpan="6">
                        <div
                          style={{
                            minHeight: "280px",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <img
                            src={nodata}
                            alt="No Data"
                            style={{
                              width: "140px",
                              height: "140px",
                              objectFit: "contain",
                            }}
                          />

                          <span
                            style={{
                              color: "#727681",
                              fontSize: "16px",
                              fontWeight: 500,
                            }}
                          >
                            {noDataMessage}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Render data rows
                return displayData.slice(0, 10).map((item, index) => {
                  // For Zones tab
                  if (activeTab === "Zones") {
                    return (
                      <tr
                        key={item._id || index}
                        style={{
                          borderBottom: "1px solid #EAEAEA",
                        }}
                      >
                        <td style={{ padding: "12px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <img
                              src={item.images?.[0]?.url}
                              alt=""
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                objectFit: "cover",
                                border: "1px solid #EAEAEA",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 14,
                                color: "#0E101A",
                                fontWeight: 500,
                              }}
                            >
                              {item.productName || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                          }}
                        >
                          {item.zone || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                          }}
                        >
                          {item.binQuantity || 0}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                          }}
                        >
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 500,
                              background: "#E8F5E9",
                              color: "#2E7D32",
                            }}
                          >
                            Stored
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                          }}
                        >
                          {item.rack || "N/A"}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                          }}
                        >
                          {item.bin || "N/A"}
                        </td>
                      </tr>
                    );
                  }

                  // For Stock In/Out tab
                  return (
                    <tr
                      key={item._id || index}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              color: "#0E101A",
                              fontWeight: 500,
                            }}
                          >
                            {item.productName || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {formatDateTime(item.date)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {item.quantity || 0}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                        }}
                      >
                        <span
                          style={{
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                            background:
                              item.type === "Stock In" ? "#E8FFF3" : "#FFF1F2",
                            color:
                              item.type === "Stock In" ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {item.type}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {item.reference || "N/A"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {item.status || "N/A"}
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Warehouse Products */}
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
          <span>All Warehouse Products ({allWarehouseProducts.length})</span>
        </div>

        <div
          style={{
            overflowY: "auto",
            maxHeight: "600px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#F8FAFC",
                  borderBottom: "1px solid #EAEAEA",
                }}
              >
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Product Name
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  SKU
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Quantity
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  Storage Locations
                </th>
              </tr>
            </thead>
            <tbody>
              {allWarehouseProducts.length === 0 ? (
                <tr>
                  <td colSpan="4">
                    <div
                      style={{
                        minHeight: "200px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <img
                        src={nodata}
                        alt="No Data"
                        style={{
                          width: "120px",
                          height: "120px",
                          objectFit: "contain",
                        }}
                      />
                      <span
                        style={{
                          color: "#727681",
                          fontSize: "14px",
                          fontWeight: 500,
                        }}
                      >
                        No products in warehouse
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                allWarehouseProducts.map((prod, idx) => (
                  <tr
                    key={prod._id || idx}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                    }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {prod.images?.[0]?.url && (
                          <img
                            src={prod.images[0].url}
                            alt={prod.productName}
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 4,
                              objectFit: "cover",
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: 14,
                            color: "#0E101A",
                            fontWeight: 500,
                          }}
                        >
                          {prod.productName || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                      }}
                    >
                      {prod.sku || "N/A"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        fontWeight: 600,
                      }}
                    >
                      {prod.warehouseQuantity || 0}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 12, color: "#727681" }}>
                        {prod.storageLocations &&
                        prod.storageLocations.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                            }}
                          >
                            {prod.storageLocations.map((loc, locIdx) => (
                              <div
                                key={locIdx}
                                style={{
                                  background: "#F3F8FB",
                                  padding: "4px 8px",
                                  borderRadius: 4,
                                  fontSize: 11,
                                }}
                              >
                                {loc.zone} → {loc.rack} → {loc.shelf} →{" "}
                                {loc.bin} ({loc.quantity})
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#999" }}>
                            No location data
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
