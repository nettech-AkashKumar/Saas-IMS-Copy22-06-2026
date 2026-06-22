import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from "date-fns";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import JsBarcode from "jsbarcode";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// pages
import "../../../../styles/product/product-list.css";
import DeleteAlert from "../../../../utils/sweetAlert/DeleteAlert";
import "./product.css";
import Pagination from "../../../Pagination";
import DatePicker from "../../../DateFilterDropdown";
import DeleteModal from "../../../ConfirmDelete";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../../../pages/config/axiosInstance"
import { useAuth } from "../../../auth/AuthContext";
import { hasPermission } from '../../../../utils/permission/hasPermission';

// icons
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { RiListView, RiDeleteBinLine } from "react-icons/ri";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import { LuCalendarMinus2 } from "react-icons/lu";
import { FaRegFolder, FaRegFolderOpen } from "react-icons/fa";

// images
import Barcode from "../../../../assets/images/barcode.jpg";
import edit from "../../../../assets/images/edit.png";
import viewdetails from "../../../../assets/images/view-details.png";
import stockin from "../../../../assets/images/stock-in.png";
import stockout from "../../../../assets/images/stock-out.png";
import deletebtn from "../../../../assets/images/delete.png";
import duplicate from "../../../../assets/images/duplicate.png";
import ProductDefaultImage from '../../../../assets/images/product-default.png'
import Shield from '../../../../assets/images/shield.svg';

const Product = () => {

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef();
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [_expiringProducts, _setExpiringProducts] = useState([]);
  const [_expiringCount, setExpiringCount] = useState(0);
  const [_activeTabs, setActiveTabs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const selectedRowsCacheRef = useRef(new Map());
  const [total, setTotal] = useState(0);
  const [_brandOptions, setBrandOptions] = useState([]);
  const [_categoryOptions, setCategoryOptions] = useState([]);
  const [_subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [_hsnOptions, setHsnOptions] = useState([]);
  const [selectedBrand, _setSelectedBrand] = useState(null);
  const [selectedCategory, _setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedHsn, _setSelectedHsn] = useState(null);
  const [search, setSearch] = useState("");
  const [leftSearch, setLeftSearch] = useState("");
  const [listTab, setListTab] = useState("All");
  const [barcodeModal, setBarcodeModal] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [serialNoPopup, setSerialNoPopup] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [variantExplicitlySelected, setVariantExplicitlySelected] = useState(false);

  const variantExplicitlySelectedRef = useRef(false);
  const selectedVariantIndexRef = useRef(0);

  const setVariantSelection = (explicitly, index) => {
    variantExplicitlySelectedRef.current = explicitly;
    selectedVariantIndexRef.current = index;
    setVariantExplicitlySelected(explicitly);
    setSelectedVariantIndex(index);
  };

  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRowIds(new Set());
    setSelectAllAcrossPages(false);
    selectedRowsCacheRef.current = new Map();
  }, [listTab]);

  const [activeRow, setActiveRow] = useState(null);
  const [openRow, setOpenRow] = useState(null);

  const _toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

  const [settings, setSettings] = useState({
    category: false,
    subcategory: false,
    brand: false,
    description: false,
    itembarcode: false,
    hsn: false,
    units: false,
    lotno: false,
    pricing: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/system-settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          category: data.category || false,
          subcategory: data.subcategory || false,
          brand: data.brand || false,
          description: data.description || false,
          itembarcode: data.itembarcode || false,
          hsn: data.hsn || false,
          units: data.units || false,
          lotno: data.lotno || false,
          pricing: data.pricing || false,
        });
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const _formatDateTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d)) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;
    const hh = String(h).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${m} ${ampm}`;
  };

  const [viewMode, setViewMode] = useState(true);

  const [viewBarcode, setViewBarcode] = useState([]);
  const [viewOptions, setViewOptions] = useState([]);

  const [viewManageOptions, setViewManageOptions] = useState(false);
  const handleViewManage = () => { setViewManageOptions(true); };

  const buttonRefs = useRef([]);
  const modelRef = useRef(null); // reference to modal area
  const manageRef = useRef(null);

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  const handleViewMode = () => { setViewMode((prevMode) => !prevMode); };

  // Handle Barcode rendering for list view popup
  useEffect(() => {
    if (viewBarcode !== false && products[viewBarcode] && products[viewBarcode].itemBarcode) {
      setTimeout(() => {
        const product = products[viewBarcode];
        const element = document.getElementById(`barcode-svg-${viewBarcode}`);
        if (element) {
          try {
            let format = "CODE128";
            // if (/^\d{12,13}$/.test(product.itemBarcode)) format = "EAN13";
            JsBarcode(element, product.itemBarcode, {
              format: format,
              lineColor: "#000",
              width: 2,
              height: 100,
              displayValue: true,
            });
          } catch (_e) {
            void _e;
            // Fallback or retry
            try {
              JsBarcode(element, product.itemBarcode, {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
              });
            } catch (err) {
              toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
            }
          }
        }
      }, 100);
    }
  }, [viewBarcode, products]);

  // Handle Barcode rendering for detail view modal
  useEffect(() => {
    if (barcodeModal && typeof barcodeModal === "string") {  // ✅ it's a string, not an object
      setTimeout(() => {
        const element = document.getElementById('barcode-svg-modal');
        if (element) {
          try {
            JsBarcode(element, barcodeModal, {  // ✅ use barcodeModal directly
              format: "CODE128",
              lineColor: "#000",
              width: 2,
              height: 100,
              displayValue: true,
            });
          } catch (_e) {
            void _e;
            try {
              JsBarcode(element, barcodeModal, {  // ✅ use barcodeModal directly
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
              });
            } catch (err) {
              toast.error(err?.message || "Error rendering barcode");
            }
          }
        }
      }, 100);
    }
  }, [barcodeModal]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideModel =
        modelRef.current && modelRef.current.contains(event.target);
      const isClickInsideBarcodeButton =
        buttonRefs.current[viewBarcode] &&
        buttonRefs.current[viewBarcode].contains(event.target);
      const isClickInsideOptionsButton =
        buttonRefs.current[viewOptions] &&
        buttonRefs.current[viewOptions].contains(event.target);
      const isClickInsideManage =
        manageRef.current && manageRef.current.contains(event.target);

      if (
        !isClickInsideModel &&
        !isClickInsideBarcodeButton &&
        !isClickInsideOptionsButton &&
        !isClickInsideManage
      ) {
        setViewBarcode(false);
        setViewOptions(false);
        setViewManageOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode, viewOptions, viewManageOptions]);

  useEffect(() => {
    // const token = localStorage.getItem("token");
    // Brands
    api
      .get("/api/brands/active-brands")
      .then((res) =>
        setBrandOptions(
          res.data.brands.map((b) => ({ value: b._id, label: b.brandName }))
        )
      )
      .catch((err) => {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
        setBrandOptions([]);
      });
    // Categories
    api
      .get("/api/category/categories")
      .then((res) =>
        setCategoryOptions(
          res.data.map((c) => ({ value: c._id, label: c.categoryName }))
        )
      )
      .catch((err) => {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
        setCategoryOptions([]);
      });
    // HSN
    api
      .get("/api/hsn/all")
      .then((res) => {
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data?.items)
              ? res.data.items
              : [];
        setHsnOptions(list.map((h) => ({ value: h._id, label: h.hsnCode })));
      })
      .catch((err) => {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
        setHsnOptions([]);
      });
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategoryOptions([]);
      setSelectedSubcategory(null);
      return;
    }
    // const token = localStorage.getItem("token");
    api
      .get(
        `/api/subcategory/by-category/${selectedCategory.value}`)
      .then((res) =>
        setSubcategoryOptions(
          res.data.map((s) => ({ value: s._id, label: s.name }))
        )
      )
      .catch((err) => {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
        setSubcategoryOptions([]);
      });
  }, [selectedCategory]);

  const [loadingProduct, setLoadingProduct] = useState(true);

  const fetchProducts = React.useCallback(async () => {
    setLoadingProduct(true);
    const params = {
      page: currentPage,
      limit: itemsPerPage,
    };

    if (selectedBrand) params.brand = selectedBrand.value;
    if (selectedCategory) params.category = selectedCategory.value;
    if (selectedSubcategory) params.subcategory = selectedSubcategory.value;
    if (selectedHsn) params.hsn = selectedHsn.value;
    if (search) params.search = search;
    try {
      const res = await api.get(`/api/products`, {
        // headers: { Authorization: `Bearer ${token}` },
        params,
      });

      // console.log("currentPage", currentPage);
      // console.log("itemsPerPage", itemsPerPage);
      // console.log("products length", res.data.products.length);

      setTotal(res.data.products.length);
      setProducts(res.data.products);
      setTotal(res.data.total);
      // Initialize all to "general"
      // const initialTabs = res.data.products.reduce((acc, product) => {
      //   acc[product._id] = "general";
      //   return acc;
      // }, {});
      // setActiveTabs(initialTabs);

    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
      setProducts([]);
      setTotal(0);
    } finally {
      setLoadingProduct(false);
    }

  }, [
    selectedBrand,
    selectedCategory,
    selectedSubcategory,
    selectedHsn,
    search,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // useEffect(() => {
  //   const start = (currentPage - 1) * itemsPerPage;
  //   const end = start + itemsPerPage;

  //   setProducts(allProducts.slice(start, end));
  // }, [allProducts, currentPage, itemsPerPage]);

  const _handleTabClick = (productId, tab) => {
    setActiveTabs((prev) => ({ ...prev, [productId]: tab }));
  };

  const getExpiryStatus = React.useCallback((expiryValue) => {
    if (!expiryValue) return "";

    const dateStr = Array.isArray(expiryValue) && expiryValue.length > 0
      ? expiryValue[0]
      : expiryValue;

    if (!dateStr) return "";

    const expiryDate = new Date(dateStr);
    if (isNaN(expiryDate.getTime())) {
      // Fallback for DD-MM-YYYY if it's still coming in that format somehow
      if (typeof dateStr === "string" && dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
        const [day, month, year] = dateStr.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        if (!isNaN(d.getTime())) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          d.setHours(0, 0, 0, 0);
          const diffTime = d - today;
          const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysDiff <= 0) return "Expired";
          if (daysDiff <= 2) return "Expiring Soon";
        }
      }
      return "";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const diffTime = expiryDate - today;
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysDiff <= 0) return "Expired";
    if (daysDiff <= 2) return "Expiring Soon";

    return "";
  }, []);

  const toNumber = React.useCallback((value, fallback = 0) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }, []);

  const getProductVariants = React.useCallback((product) => {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    if (variants.length > 0) {
      return variants.map((variant, index) => ({
        ...variant,
        _variantIndex: index,
        stockQuantity: toNumber(variant?.stockQuantity, toNumber(variant?.openingQuantity)),
        minStockToMaintain: toNumber(variant?.minStockToMaintain, toNumber(product?.minStockToMaintain)),
        unit: variant?.unit || product?.unit || "",
        expiryDate: variant?.expiryDate || product?.expiryDate || "",
      }));
    }

    return [{
      _variantIndex: 0,
      stockQuantity: toNumber(product?.stockQuantity),
      minStockToMaintain: toNumber(product?.minStockToMaintain),
      unit: product?.unit || "",
      expiryDate: product?.expiryDate || "",
      size: product?.size || "",
      color: product?.color || "",
      lotNumber: product?.lotNumber || "",
      barcode: product?.itemBarcode || "",
    }];
  }, [toNumber]);

  const getVariantLabel = React.useCallback((variant, index) => {
    const labelParts = [variant?.color, variant?.size].filter(Boolean);
    if (labelParts.length > 0) return labelParts.join(" / ");
    if (variant?.lotNumber) return `Lot ${variant.lotNumber}`;
    return `Variant ${index + 1}`;
  }, []);

  const getVariantQuantityText = React.useCallback((product) => {
    const productVariants = getProductVariants(product);
    const hasRealVariants = Array.isArray(product?.variants) && product.variants.length > 0;

    return productVariants.map((variant, index) => {
      const quantity = toNumber(variant?.stockQuantity);
      const unit = variant?.unit ? ` ${String(variant.unit).toLowerCase()}` : "";
      const quantityText = `${quantity}${unit}`;

      return hasRealVariants
        ? `${quantityText}` : quantityText;

      // return hasRealVariants
      //   ? `
      //   ${getVariantLabel(variant, index)} - 
      //   ${quantityText}`
      //   : quantityText;

    }).join(", ");
  }, [getProductVariants, getVariantLabel, toNumber]);

  const getTotalVariantQuantity = React.useCallback((product) => {
    const productVariants = getProductVariants(product);

    return productVariants.reduce((total, variant) => {
      return total + toNumber(variant?.stockQuantity);
    }, 0);
  }, [getProductVariants, toNumber]);

  const isLowStockProduct = React.useCallback((product) => (
    getProductVariants(product).some((variant) => {
      const quantity = toNumber(variant?.stockQuantity);
      const alert = toNumber(variant?.minStockToMaintain);
      return quantity < alert && quantity !== 0;
    })
  ), [getProductVariants, toNumber]);

  const isOutOfStockProduct = React.useCallback((product) => (
    getProductVariants(product).some((variant) => toNumber(variant?.stockQuantity) === 0)
  ), [getProductVariants, toNumber]);

  const isExpiredProduct = React.useCallback((product) => (
    getProductVariants(product).some((variant) => getExpiryStatus(variant?.expiryDate) === "Expired")
  ), [getExpiryStatus, getProductVariants]);

  const isStockAlertProduct = React.useCallback((product) => (
    isLowStockProduct(product) || isOutOfStockProduct(product)
  ), [isLowStockProduct, isOutOfStockProduct]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products");

        const list = res.data.products || [];

        // setProducts(list);
        setAllProducts(list);

        const count = list.filter((product) => isExpiredProduct(product)).length;

        setExpiringCount(count);

        // setExpiringProducts(names);

        // Initialize tabs
        // const initialTabs = res.data.reduce((acc, product) => {
        //   acc[product._id] = "general";
        //   return acc;
        // }, {});
        // setActiveTabs(initialTabs);
      } catch (err) {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
        setProducts([]);
        setTotal(0);
      }
    };
    fetchProducts();
  }, [isExpiredProduct]);

  const [_popup, setPopup] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // store product
  const formRef = useRef(null);

  const _handlePopupOpen = (product) => {
    setSelectedProduct(product); // set product
    setPopup(true); // open popup
  };

  const _handlePopupClose = () => {
    setPopup(false); // open popup
  };

  const closeForm = () => {
    setPopup(false);
    setSelectedProduct(null); // clear selected product
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        closeForm();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // const token = localStorage.getItem("token");
    const loadAll = async () => {
      try {
        const res = await api.get("/api/products", {
          // headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { page: 1, limit: 1000 },
        });
        const list = res.data.products || res.data || [];
        setAllProducts(list);
        setActiveTabs((prev) => {
          const next = { ...prev };
          list.forEach((p) => {
            if (!next[p._id]) next[p._id] = "general";
          });
          return next;
        });
        if (!selectedProduct && list.length) {
          setSelectedProduct(list[0]);
        }
      } catch (_e) {
        void _e;
        setAllProducts([]);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (viewMode && !selectedProduct && allProducts.length) {
      setSelectedProduct(allProducts[0]);
    }
  }, [viewMode, allProducts, selectedProduct]);

  const matchesProductSearch = React.useCallback((product, query) => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) return true;

    const hsnCode =
      typeof product?.hsn === "string"
        ? product.hsn
        : product?.hsn?.hsnCode || "";
    const hsnDesc =
      typeof product?.hsn === "object" && product?.hsn !== null
        ? product?.hsn?.description || ""
        : "";

    const values = [
      product?.productName,
      product?.description,
      product?.itemBarcode,
      product?.brand?.brandName,
      product?.category?.categoryName,
      product?.subcategory?.name,
      product?.subCategory?.name,
      hsnCode,
      hsnDesc,
      product?.size,
      product?.unit,
      product?.color,
      ...(Array.isArray(product?.variants)
        ? product.variants.flatMap((variant, index) => [
          getVariantLabel(variant, index),
          variant?.barcode,
          variant?.size,
          variant?.color,
          variant?.lotNumber,
          variant?.unit,
        ])
        : []),
    ];

    return values.some((v) => String(v || "").toLowerCase().includes(q));
  }, [getVariantLabel]);

  const filteredAllProducts = React.useMemo(() => {
    if (!leftSearch.trim()) return allProducts;
    return allProducts.filter((p) => matchesProductSearch(p, leftSearch));
  }, [leftSearch, allProducts, matchesProductSearch]);

  useEffect(() => {
    if (!viewMode) return;
    const exists = filteredAllProducts.some(
      (p) => p._id === (selectedProduct?._id || "")
    );
    if (!exists) {
      if (filteredAllProducts.length)
        setSelectedProduct(filteredAllProducts[0]);
      else setSelectedProduct(null);
    }
  }, [leftSearch, filteredAllProducts, viewMode]);

  const listCounts = React.useMemo(() => {
    const totalAll = allProducts.length;
    // const now = new Date();
    // const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const newStocks = allProducts.filter(p => {
      const d = new Date(p.createdAt);
      return !isNaN(d) && d >= new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    }).length;
    const lowStocks = allProducts.filter((p) => {
      return isLowStockProduct(p);
    }).length;
    const outOfStocks = allProducts.filter((p) => {
      return isOutOfStockProduct(p);
    }).length;
    const expiredStocks = allProducts.filter((p) => {
      return isExpiredProduct(p);
    }).length;
    const oldStocks = Math.max(0, totalAll - newStocks);
    return {
      totalAll,
      lowStocks,
      outOfStocks,
      newStocks,
      oldStocks,
      expiredStocks,
    };
  }, [allProducts, isExpiredProduct, isLowStockProduct, isOutOfStockProduct]);

  const visibleProducts = React.useMemo(() => {
    if (listTab === "Low Stock") {
      let filtered = allProducts.filter((p) => {
        return isLowStockProduct(p);
      });

      if (search.trim()) {
        filtered = filtered.filter((p) =>
          matchesProductSearch(p, search)
        );
      }

      return {
        data: filtered.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        ),
        total: filtered.length,
      };
    }
    if (listTab === "Out of Stock") {
      let filtered = allProducts.filter((p) =>
        isOutOfStockProduct(p)
      );

      if (search.trim()) {
        filtered = filtered.filter((p) =>
          matchesProductSearch(p, search)
        );
      }

      return {
        data: filtered.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage
        ),
        total: filtered.length,
      };
    }

    if (listTab === "Expired") {
      let filtered = allProducts.filter((p) => {
        return isExpiredProduct(p);
      });
      if (search.trim()) filtered = filtered.filter((p) => matchesProductSearch(p, search));
      return {
        data: filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
        total: filtered.length
      };
    }
    if (listTab === "New Stock") {
      const timeLimit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days matching listCounts

      let filtered = allProducts.filter((p) => {
        const d = new Date(p.createdAt);
        return !isNaN(d) && d >= timeLimit;
      });
      if (search.trim()) filtered = filtered.filter((p) => matchesProductSearch(p, search));
      return {
        data: filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
        total: filtered.length
      };
    }
    if (listTab === "Old Stock") {
      const timeLimit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days matching listCounts
      let filtered = allProducts.filter((p) => {
        const d = new Date(p.createdAt);
        return isNaN(d) || d < timeLimit;
      });
      if (search.trim()) filtered = filtered.filter((p) => matchesProductSearch(p, search));
      return {
        data: filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
        total: filtered.length
      };
    }
    // All Products (Server Side Pagination)
    let filtered = products;

    if (search.trim()) {
      filtered = filtered.filter((p) =>
        matchesProductSearch(p, search)
      );
    }

    return {
      data: filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      ),
      total: filtered.length,
    };
  }, [
    products,
    allProducts,
    listTab,
    currentPage,
    itemsPerPage,
    matchesProductSearch,
    search,
    isExpiredProduct,
    isLowStockProduct,
    isOutOfStockProduct,
  ]);

  const { data: currentVisibleProducts, total: currentTotal } = visibleProducts;
  const allVisibleSelected = currentVisibleProducts.length > 0 && currentVisibleProducts.every((p) => selectedRowIds.has(p._id));

  useEffect(() => {
    const cache = selectedRowsCacheRef.current;
    currentVisibleProducts.forEach((p) => {
      if (p && p._id) cache.set(p._id, p);
    });
  }, [currentVisibleProducts]);

  const getAllRowsForCurrentTab = React.useCallback(async () => {
    if (listTab === "All") {
      const params = {
        page: 1,
        limit: 1000,
      };
      if (selectedBrand) params.brand = selectedBrand.value;
      if (selectedCategory) params.category = selectedCategory.value;
      if (selectedSubcategory) params.subcategory = selectedSubcategory.value;
      if (selectedHsn) params.hsn = selectedHsn.value;
      if (search) params.search = search;
      const res = await api.get(`/api/products`, { params });
      const list = res.data.products || [];
      const count = Number(res.data.total) || list.length;
      if (count > 1000) {
        toast.error("Maximum 1000 rows can be selected");
      }
      return list;
    }

    if (listTab === "Low Stock") {
      let rows = allProducts.filter((p) => {
        return isLowStockProduct(p);
      });
      if (search.trim()) rows = rows.filter((p) => matchesProductSearch(p, search));
      return rows;
    }
    if (listTab === "Out of Stock") {
      let rows = allProducts.filter((p) => isOutOfStockProduct(p));
      if (search.trim()) rows = rows.filter((p) => matchesProductSearch(p, search));
      return rows;
    }
    if (listTab === "Expired") {
      let rows = allProducts.filter((p) => {
        return isExpiredProduct(p);
      });
      if (search.trim()) rows = rows.filter((p) => matchesProductSearch(p, search));
      return rows;
    }
    if (listTab === "New Stock") {
      const timeLimit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      let rows = allProducts.filter((p) => new Date(p.createdAt) >= timeLimit);
      if (search.trim()) rows = rows.filter((p) => matchesProductSearch(p, search));
      return rows;
    }
    if (listTab === "Old Stock") {
      const timeLimit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      let rows = allProducts.filter((p) => isNaN(new Date(p.createdAt)) || new Date(p.createdAt) < timeLimit);
      if (search.trim()) rows = rows.filter((p) => matchesProductSearch(p, search));
      return rows;
    }
    let rows = allProducts;
    if (search.trim()) rows = rows.filter((p) => matchesProductSearch(p, search));
    return rows;
  }, [allProducts, listTab, matchesProductSearch, search, selectedBrand, selectedCategory, selectedHsn, selectedSubcategory, isExpiredProduct, isLowStockProduct, isOutOfStockProduct]);

  const handleToggleSelectAll = async (checked) => {
    if (!checked) {
      setSelectAllAcrossPages(false);
      setSelectedRowIds(new Set());
      return;
    }
    try {
      const rows = await getAllRowsForCurrentTab();
      const cache = selectedRowsCacheRef.current;
      const ids = rows.map((r) => r && r._id).filter(Boolean);
      rows.forEach((r) => {
        if (r && r._id) cache.set(r._id, r);
      });
      setSelectedRowIds(new Set(ids));
      setSelectAllAcrossPages(true);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/products/pro/${deleteTargetId}`);
      setAllProducts((prev) => {
        const index = prev.findIndex((p) => p._id === deleteTargetId);
        if (index === -1) return prev;
        const updated = prev.filter((p) => p._id !== deleteTargetId);
        if (selectedProduct && selectedProduct._id === deleteTargetId) {
          const next = updated[index] || updated[index - 1] || null;
          setSelectedProduct(next || null);
        }
        return updated;
      });
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      await fetchProducts();
      toast.success("Product deleted successfully");
    } catch (err) {
      setShowDeleteModal(false);
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    }
  };

  const handleDuplicate = async (id) => {
    if (!id) return;
    try {
      setViewOptions(false);
      const res = await api.post(`/api/products/${id}/duplicate`);
      const created = res.data;
      if (created && created._id) {
        setAllProducts((prev) => [created, ...prev]);
      }
      await fetchProducts();
      toast.success("Product duplicated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    }
  };

  const _handlePdf = () => {
    if (selectedRowIds.size === 0) {
      toast.error("Select atleast 1 row to export data");
      return;
    }
    const doc = new jsPDF();
    doc.text("Product Data", 14, 15);
    const tableColumns = [
      "Product Name",
      "Category",
      "Available Quantity",
      "Item Code",
      "Purchasing Price",
      "Selling Price",
    ];

    const selectedRows = Array.from(selectedRowIds)
      .map((id) => selectedRowsCacheRef.current.get(id))
      .filter(Boolean);

    if (selectedRows.length === 0) {
      toast.error("No data available to export");
      return;
    }

    const tableRows = selectedRows.map((e) => [
      e.productName,
      e.category?.categoryName,
      getVariantQuantityText(e),
      e.itemBarcode,
      e.purchasePrice,
      e.sellingPrice,
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [155, 155, 155],
        textColor: "white",
      },
      theme: "striped",
    });

    doc.save("products.pdf");
    toast.success("Products PDF file downloaded successfully!");
  };

  const handleExcel = async () => {
    try {
      if (selectedRowIds.size === 0) {
        toast.error("Select atleast 1 row to export data");
        return;
      }
      const tableColumns = [
        "Product Name",
        "Category",
        "Available Quantity",
        "Unit",
        "Brand",
        "Item Code",
        "Serial Numbers",
        "Purchasing Price",
        "Selling Price",
      ];

      let rowsSource = [];
      if (selectedRowIds.size > 0) {
        rowsSource = Array.from(selectedRowIds)
          .map((id) => selectedRowsCacheRef.current.get(id))
          .filter(Boolean);
      } else {
        // If no rows selected, export all filtered data
        if (listTab === "Low Stock") {
          rowsSource = allProducts.filter((p) => isLowStockProduct(p));
        } else if (listTab === "Out of Stock") {
          rowsSource = allProducts.filter((p) => isOutOfStockProduct(p));
        } else if (listTab === "Expired") {
          rowsSource = allProducts.filter((p) => isExpiredProduct(p));
        } else if (listTab === "New Stock") {
          const timeLimit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          rowsSource = allProducts.filter((p) => new Date(p.createdAt) >= timeLimit);
        } else if (listTab === "Old Stock") {
          const timeLimit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
          rowsSource = allProducts.filter((p) => isNaN(new Date(p.createdAt)) || new Date(p.createdAt) < timeLimit);
        } else {
          // All Products
          rowsSource = allProducts;
        }
      }

      if (rowsSource.length === 0) {
        toast.error("No data available to export");
        return;
      }

      // without serial numbers
      // const tableRows = rowsSource.map((e) => [
      //   e.productName,
      //   e.category?.categoryName || "-",
      //   e.stockQuantity,
      //   e.unit,
      //   e.brand?.brandName || e.brand || "-",
      //   e.itemBarcode,
      //   e.purchasePrice,
      //   e.sellingPrice,
      // ]);

      const tableRows = [];

      //with full details
      // rowsSource.forEach((e) => {
      //   // If product has serial numbers
      //   if (
      //     e.lot_pricing === true &&
      //     Array.isArray(e.serialno) &&
      //     e.serialno.length > 0
      //   ) {
      //     e.serialno.forEach((serial) => {
      //       tableRows.push([
      //         e.productName || "-",
      //         e.category?.categoryName || "-",
      //         e.stockQuantity ?? "-",
      //         e.unit || "-",
      //         e.brand?.brandName || e.brand || "-",
      //         e.itemBarcode || "-",
      //         serial || "-",
      //         e.purchasePrice ?? "-",
      //         e.sellingPrice ?? "-",
      //       ]);
      //     });
      //   } else {
      //     tableRows.push([
      //       e.productName || "-",
      //       e.category?.categoryName || "-",
      //       e.stockQuantity ?? "-",
      //       e.unit || "-",
      //       e.brand?.brandName || e.brand || "-",
      //       e.itemBarcode || "-",
      //       "-",
      //       e.purchasePrice ?? "-",
      //       e.sellingPrice ?? "-",
      //     ]);
      //   }
      // });

      //with only serial numbers
      rowsSource.forEach((e) => {

        if (
          e.lot_pricing === true &&
          Array.isArray(e.serialno) &&
          e.serialno.length > 0
        ) {

          e.serialno.forEach((serial, index) => {

            // First serial row -> full product details
            if (index === 0) {
              tableRows.push([
                e.productName || "-",
                e.category?.categoryName || "-",
                getVariantQuantityText(e) || "-",
                e.unit || "-",
                e.brand?.brandName || e.brand || "-",
                e.itemBarcode || "-",
                serial,
                e.purchasePrice ?? "-",
                e.sellingPrice ?? "-"
              ]);
            }

            // Remaining serial rows -> only serial number
            else {
              tableRows.push([
                "",
                "",
                "",
                "",
                "",
                "",
                serial,
                "",
                ""
              ]);
            }

          });

        } else {

          tableRows.push([
            e.productName || "-",
            e.category?.categoryName || "-",
            getVariantQuantityText(e) || "-",
            e.unit || "-",
            e.brand?.brandName || e.brand || "-",
            e.itemBarcode || "-",
            "-",
            e.purchasePrice ?? "-",
            e.sellingPrice ?? "-"
          ]);

        }

      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Products");

      const headerRow = worksheet.addRow(tableColumns);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "99c5ff" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "338bff" } },
          left: { style: "thin", color: { argb: "338bff" } },
          bottom: { style: "thin", color: { argb: "338bff" } },
          right: { style: "thin", color: { argb: "338bff" } },
        };
      });

      [20, 20, 20, 20, 20, 20, 20, 20, 20].forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      worksheet.getColumn(3).alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getColumn(6).alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getColumn(7).alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getColumn(8).alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getColumn(9).alignment = { horizontal: "center", vertical: "middle" };

      tableRows.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "products.xlsx",
      );
      toast.success("Products Excel file downloaded successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    }
  };

  const _handleCSV = () => {
    try {
      if (selectedRowIds.size === 0) {
        toast.error("Select atleast 1 row to export data");
        return;
      }
      const tableHeader = ["Product Name", "SKU", "Quantity", "Status", "Price"];
      const selectedRows = Array.from(selectedRowIds)
        .map((id) => selectedRowsCacheRef.current.get(id))
        .filter(Boolean);
      const csvRows = [
        tableHeader.join(","),
        ...selectedRows.map((e) =>
          [e.productName, e.sku, e.quantity, e.trackType, e.sellingPrice].join(
            ","
          )
        ),
      ];
      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "products.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    }
  };

  const _handleImportClick = () => {
    fileInputRef.current.click();
  };

  const _handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) {
      alert("Please select a valid .xlsx file");
      e.target.value = "";
      return;
    }

    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append("file", file);

      // Send to backend
      // const token = localStorage.getItem("token");
      // if (!token) {
      //   throw new Error("No token found in localStorage");
      // }
      await api.post("/api/products/import", formData);
      toast.success("Imported successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      e.target.value = ""; // Clear input
    }
  };

  const [_isOn, _setIsOn] = useState(false);
  const [detailsTab, setDetailsTab] = useState("Basic Details");

  const [_date, _setDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const [inventoryData, setInventoryData] = useState([]);
  const [transactionTab, setTransactionTab] = useState("All");

  const dateFilteredData = React.useMemo(() => {
    if (!selectedDateRange.startDate && !selectedDateRange.endDate) {
      return inventoryData;
    }
    const start = selectedDateRange.startDate ? new Date(selectedDateRange.startDate) : null;
    if (start) start.setHours(0, 0, 0, 0);

    const end = selectedDateRange.endDate ? new Date(selectedDateRange.endDate) : null;
    if (end) end.setHours(23, 59, 59, 999);

    return inventoryData.filter((t) => {
      if (!t.rawDate) return false;
      const d = new Date(t.rawDate);
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    });
  }, [inventoryData, selectedDateRange]);

  const transactionCounts = React.useMemo(() => {
    const sales = dateFilteredData.filter((t) => t.source === "Sales" || t.source === "POS").length;
    const purchases = dateFilteredData.filter((t) => t.source === "Purchase").length;
    return {
      All: dateFilteredData.length,
      Sales: sales,
      Purchase: purchases,
    };
  }, [dateFilteredData]);

  const filteredTransactions = React.useMemo(() => {
    if (transactionTab === "Sales")
      return dateFilteredData.filter((t) => t.source === "Sales" || t.source === "POS");
    if (transactionTab === "Purchase")
      return dateFilteredData.filter((t) => t.source === "Purchase");
    return dateFilteredData;
  }, [dateFilteredData, transactionTab]);

  useEffect(() => {
    setSelectedDateRange({ startDate: null, endDate: null });
    variantExplicitlySelectedRef.current = false;
    selectedVariantIndexRef.current = 0;
    setVariantExplicitlySelected(false);
    setSelectedVariantIndex(0);
  }, [selectedProduct?._id]);

  // tax & gst settings
  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
    priceIncludeGST: true,
    defaultGSTRate: "18",
    autoRoundOff: "0"
  })

  // fetch tax setting
  useEffect(() => {
    const loadTaxSettings = async () => {
      try {
        const response = await api.get('/api/tax-gst-settings');
        if (response.data.success) {
          const data = response.data.data;
          setTaxSettings({
            enableGSTBilling: data.enableGSTBilling !== false,
            priceIncludeGST: data.priceIncludeGST !== false,
            defaultGSTRate: data.defaultGSTRate || "18",
            autoRoundOff: data.autoRoundOff || "0"
          })
        }
      } catch (error) {
        toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
      }
    }
    loadTaxSettings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, listTab]);

  const activeVariant = React.useMemo(() => {
    if (!selectedProduct) return null;
    const variants = Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0
      ? selectedProduct.variants
      : null;
    if (!variants) return null;
    return variants[selectedVariantIndex] ?? variants[0];
  }, [selectedProduct, selectedVariantIndex]);

  const av = activeVariant || {};
  const avBatchNo = av.lotNumber || selectedProduct?.lotNumber || "";
  const avModelNo = av.modelNo || selectedProduct?.modelNo || "";
  const avSerialNo = av.serialNumbers || selectedProduct?.serialNumbers || "";
  const avPurchasePrice = toNumber(av.purchasePrice ?? selectedProduct?.purchasePrice);
  const avTax = toNumber(av.tax ?? selectedProduct?.tax);
  const avMrp = toNumber(av.mrp ?? selectedProduct?.mrp);
  const avSellingPrice = toNumber(av.sellingPrice ?? selectedProduct?.sellingPrice);
  const avSize = av.size || selectedProduct?.size || "";
  const avColor = av.color || selectedProduct?.color || "";
  const avOpeningQty = toNumber(av.openingQuantity ?? selectedProduct?.openingQuantity);
  const avStock = toNumber(av.stockQuantity ?? selectedProduct?.stockQuantity);
  const avUnit = av.unit || selectedProduct?.unit || "";
  const avMin = toNumber(av.minStockToMaintain ?? selectedProduct?.minStockToMaintain);
  const avDiscountAmount = av.discountAmount ?? selectedProduct?.discountAmount ?? 0;
  const avDiscountType = av.discountType || selectedProduct?.discountType || "";
  const avManufacturingDate = av.manufacturingDate || selectedProduct?.manufacturingDate || "";
  const avExpiryDate = av.expiryDate || selectedProduct?.expiryDate || "";
  const avWarrantyPeriod = av.warrantyPeriod || selectedProduct?.warrantyPeriod || "";

  const avImages = av.images || selectedProduct?.images || [];

  const avSellingWithGst = avSellingPrice + avSellingPrice * avTax / 100;
  const isAvLowStock = avStock < avMin && avStock !== 0;
  const isAvOutOfStock = avStock === 0;
  const isAvAlert = isAvLowStock || isAvOutOfStock;

  const avBarcode = av.itemBarcode || selectedProduct?.itemBarcode || "";

  useEffect(() => {
    if (!selectedProduct) {
      setInventoryData([]);
      return;
    }

    setLoading(true);

    const fetchTransactions = async () => {
      try {
        const [salesRes, purchasesRes, posSalesRes] = await Promise.all([
          api.get("/api/invoices/sales/list", { params: { page: 1, limit: 1000 } }),
          api.get("/api/purchase-orders", { params: { page: 1, limit: 1000 } }),
          api.get("/api/pos-sales/transactions", { params: { page: 1, limit: 1000 } })
        ]);

        const salesData = salesRes.data.data?.sales || salesRes.data.sales || [];
        const purchaseData = purchasesRes.data.invoices || purchasesRes.data.purchases || [];
        const posSalesData = posSalesRes.data.data || [];

        const hasRealVariants = Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0;

        // ✅ Read from REFS — always current, no stale closure
        const isExplicit = variantExplicitlySelected;
        const variantIdx = selectedVariantIndex;

        let targetBarcodes = [];

        if (hasRealVariants) {
          if (isExplicit) {
            const specificVariant = selectedProduct.variants[variantIdx];
            const bc = specificVariant?.itemBarcode || specificVariant?.barcode;
            if (bc) targetBarcodes = [bc];
          } else {
            // All variant barcodes for product-level view
            targetBarcodes = selectedProduct.variants
              .map(v => v?.itemBarcode || v?.barcode)
              .filter(Boolean);
          }
        } else {
          if (selectedProduct.itemBarcode) {
            targetBarcodes = [selectedProduct.itemBarcode];
          }
        }

        const newTransactions = [];

        // Sales
        salesData.forEach(sale => {

          if (!sale.items?.length) return;
          sale.items.forEach(item => {
            const isMatch =
              item.itemBarcode === targetBarcodes[0];

            if (isMatch) {
              newTransactions.push({
                date: sale.invoiceDate ? format(parseISO(sale.invoiceDate), "dd/MM/yyyy") : "-",
                productName: selectedProduct.productName,
                id: sale.invoiceNo,
                customerName: sale.customer,
                status: "Out",
                stock: -Math.abs(parseInt(item.qty) || 0),
                amount: `₹${item.unitPrice || 0}`,
                rawDate: sale.invoiceDate,
                source: "Sales",
              });
            }
          });
        });

        // Purchases
        purchaseData.forEach(purchase => {
          if (!purchase.items?.length) return;
          purchase.items.forEach(item => {
            const pBarcode = item.productId?.itemBarcode || item.itemBarcode;
            const isMatch = targetBarcodes.length > 0
              ? (pBarcode && targetBarcodes.includes(pBarcode))
              : String(item.productId?._id || item.productId) === String(selectedProduct._id);

            if (isMatch) {
              newTransactions.push({
                date: purchase.purchaseDate ? format(parseISO(purchase.purchaseDate), "dd/MM/yyyy") : "-",
                productName: selectedProduct.productName,
                id: purchase.purchaseNo,
                status: "In",
                stock: Math.abs(parseInt(item.qty) || 0),
                amount: `₹${item.unitPrice || 0}`,
                rawDate: purchase.purchaseDate,
                customerName: purchase?.supplierId?.supplierName,
                source: "Purchase",
              });
            }
          });
        });

        // POS
        posSalesData.forEach(sale => {
          if (!sale.items?.length) return;
          sale.items.forEach(item => {
            const itemId = item.productId?._id || item.productId;
            const itemName = item.productId?.productName || item.productName;
            const itemBarcode = item.itemBarcode || item.productId?.itemBarcode;

            let isMatch = false;
            if (targetBarcodes.length > 0 && itemBarcode) {
              isMatch = targetBarcodes.includes(itemBarcode);
            } else {
              isMatch = String(itemId) === String(selectedProduct._id) ||
                itemName === selectedProduct.productName;
            }

            if (isMatch) {
              newTransactions.push({
                date: sale.saleDate ? format(parseISO(sale.saleDate), "dd/MM/yyyy") : "-",
                productName: itemName || selectedProduct.productName,
                id: sale.invoiceNumber,
                customerName: sale.customer?.name || "Walk-in Customer",
                status: "Out",
                stock: -Math.abs(item.quantity || 0),
                amount: `₹${item.totalPrice || 0}`,
                rawDate: sale.saleDate,
                source: "POS",
              });
            }
          });
        });

        newTransactions.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        setInventoryData(newTransactions);

      } catch (error) {
        toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
        setInventoryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedProduct, variantExplicitlySelected, selectedVariantIndex]);

  return (
    <>
      <div className="p-4" style={{ overflowY: "auto", height: "100vh" }}>
        {/* back + header */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0px 0px 16px 0px",
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
            {/* <div style={{
                width: 32,
                height: "33px",
                background: 'white',
                borderRadius: 53,
                border: '1.07px solid #EAEAEA',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <FaArrowLeft style={{ color: '#A2A8B8' }} />
              </div> */}

            <span
              className="productHeader"
              style={{
                margin: 0,
                color: "black",
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                lineHeight: "26.4px",
              }}
            >
              Products
            </span>
          </div>

          {/* Right: Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: "33px",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              background: "white",
              borderRadius: 8,
              border: "1px solid #A2A8B8",
              padding: "2px",
            }}>

              <button
                title="Full Detail"
                style={{
                  padding: "8px",
                  background: viewMode ? "#1F7FFF" : "white",
                  color: viewMode ? "white" : "gray",
                  borderTopLeftRadius: 8,
                  borderBottomLeftRadius: 8,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  height: "30px",
                  overflow: "hidden",
                }}
                onClick={handleViewMode}
              >
                <MdOutlineViewSidebar
                  className=""
                  style={{ transform: "rotate(180deg)", fontSize: "20px" }}
                />
              </button>

              <button
                title="Minimum Details"
                style={{
                  padding: "8px",
                  background: viewMode ? "white" : "#1F7FFF",
                  color: viewMode ? "gray" : "white",
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  height: "30px",
                  overflow: "hidden",
                }}
                onClick={handleViewMode}
              >
                <RiListView className="" style={{ fontSize: "20px" }} />
              </button>
            </div>

            {/* <NavLink
                to="/add-product"
                style={{
                  padding: "8px 16px",
                  background: "white",
                  border: "2px solid #1F7FFF",
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: "14px",
                  display: "flex",
                  gap: "6px",
                  alignItems: "center",
                  height: "33px",
                }}
              >
                <MdAddShoppingCart
                  style={{
                    color: "#1F7FFF",
                    fontSize: "16px",
                  }}
                />
                <span
                  className=""
                  style={{
                    color: "#1F7FFF",
                    fontSize: "14px",
                    fontWeight: "600",
                  }}
                >
                  Add Product
                </span>
              </NavLink> */}

            {hasPermission(user, "Product", "create") && (
              <div
                onClick={() => navigate(`/add-product`, { state: { from: location.pathname } })}
                title="Add Product Button"
                className="button-hover addproduct"
                style={{
                  borderRadius: "8px",
                  padding: "5px 16px",
                  border: "1px solid #1F7FFF",
                  color: "rgb(31, 127, 255)",
                  fontFamily: "Inter",
                  backgroundColor: "white",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <MdAddShoppingCart className="fs-5" />
                Add Products</div>
            )}
          </div>
        </div>

        {/* view mode */}
        {!viewMode ? (
          <>
            {/* verticle section */}
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
              {/* tabs + search + export */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  overflowX: "auto"
                }}
              >
                {/* Tabs */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: 2,
                    background: "#F3F8FB",
                    borderRadius: 8,
                    // flexWrap: "wrap",
                    // height: "38px",
                    width: "auto",
                  }}
                >
                  {[
                    { label: "All", count: listCounts.totalAll },
                    { label: "New Stock", count: listCounts.newStocks },
                    { label: "Old Stock", count: listCounts.oldStocks },
                    { label: "Low Stock", count: listCounts.lowStocks },
                    { label: "Out of Stock", count: listCounts.outOfStocks },
                    { label: "Expired", count: listCounts.expiredStocks },
                  ].map((tab) => (
                    <div
                      key={tab.label}
                      className="tabDiv"
                      style={{
                        padding: "6px 12px",
                        background: listTab === tab.label ? "white" : "transparent",
                        borderRadius: 8,
                        boxShadow:
                          listTab === tab.label
                            ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                            : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        color: "#0E101A",
                        cursor: "pointer",
                      }}
                      onClick={() => setListTab(tab.label)}
                    >
                      <span className="tabLable">{tab.label}</span>
                      <span
                        className="tabLable"
                        style={{ color: "#727681" }}>
                        {tab.count}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Search Bar & export import */}
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
                    <IoIosSearch className="fs-4" />
                    <input
                      type="search"
                      placeholder="Search..."
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        background: "#FCFCFC",
                        color: "rgba(19.75, 25.29, 61.30, 0.40)",
                      }}
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                        setSelectedRowIds(new Set());
                        setSelectAllAcrossPages(false);
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "inline-flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    {/* Export Button */}
                    {hasPermission(user, "Product", "export") && (
                      <button
                        title="Export"
                        onClick={handleExcel}
                        style={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: 9,
                          padding: "8px 16px",
                          background: "#FCFCFC",
                          borderRadius: 8,
                          outline: "1px solid #EAEAEA",
                          outlineOffset: "-1px",
                          border: "none",
                          cursor: "pointer",
                          fontFamily: "Inter, sans-serif",
                          fontSize: 14,
                          fontWeight: 400,
                          color: "#0E101A",
                          height: "33px",
                        }}
                      >
                        <TbFileExport className="fs-5 text-secondary" />
                        Export
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div
                className=""
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}
              >
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}
                >
                  {/* Header */}
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}
                  >
                    <tr style={{ background: "#F3F8FB" }}>
                      {/* product name & category */}
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <label className="checkboxs">
                            <input
                              type="checkbox"
                              style={{ width: 18, height: 18 }}
                              checked={allVisibleSelected}
                              onChange={async (e) => {
                                await handleToggleSelectAll(e.target.checked);
                              }}
                            />
                            <span className="checkmarks" />
                          </label>
                          Product Name & Category
                        </div>
                      </th>

                      {/* quantity */}
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}
                      >
                        Available Quantity
                      </th>

                      {/* item code */}
                      {settings.itembarcode &&
                        <th
                          style={{
                            textAlign: "left",
                            padding: "4px 16px",
                            color: "#727681",
                            fontSize: 14,
                            width: "auto",
                            fontWeight: "400",
                          }}
                        >
                          Item Code
                        </th>}

                      {/* purchase price */}
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}
                      >
                        Purchase Price
                      </th>

                      {/* selling price */}
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}
                      >
                        Selling Price {taxSettings.priceIncludeGST ? "(with GST)" : ""}
                      </th>

                      {/* actions */}
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody style={{ overflowY: "auto" }}>
                    {loadingProduct ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : currentVisibleProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Product Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {currentVisibleProducts.map((product, index) => (
                          <>
                            <tr
                              key={index}
                              style={{
                                borderBottom: "1px solid #EAEAEA",
                                height: "46px",
                              }}
                              className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                            >
                              {/* Product Name & Category */}
                              <td
                                style={{
                                  padding: "4px 16px",
                                  verticalAlign: "middle",
                                  cursor: 'pointer'
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                  }}
                                >
                                  <label className="checkboxs">
                                    <input
                                      type="checkbox"
                                      style={{ width: 18, height: 18 }}
                                      checked={selectedRowIds.has(product._id)}
                                      onChange={(e) => {
                                        const next = new Set(selectedRowIds);
                                        if (e.target.checked) {
                                          if (product._id) next.add(product._id);
                                        } else {
                                          if (product._id) next.delete(product._id);
                                          if (selectAllAcrossPages) setSelectAllAcrossPages(false);
                                        }
                                        setSelectedRowIds(next);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="checkmarks" />
                                  </label>
                                  {Array.isArray(product.variants) && product.variants.length > 1 ? (
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedRows((prev) => {
                                          const next = new Set(prev);
                                          next.has(product._id) ? next.delete(product._id) : next.add(product._id);
                                          return next;
                                        });
                                      }}
                                      style={{ cursor: "pointer", color: "#1F7FFF", display: "flex", alignItems: "center" }}
                                      title="Show variants"
                                    >
                                      {expandedRows.has(product._id) ? <FaRegFolderOpen style={{ fontSize: 16 }} /> : <FaRegFolder style={{ fontSize: 16 }} />}
                                    </span>
                                  ) : (
                                    <></>
                                  )}
                                  <a className="avatar avatar-md">
                                    {product?.images?.[0] ? (
                                      <img src={product.images[0].url} alt={product.productName} className="media-image" />
                                    ) : (
                                      <img src={ProductDefaultImage} alt='Product Default Image' className="media-image" />
                                    )}
                                  </a>
                                  <div>
                                    <div
                                      style={{
                                        fontSize: 14,
                                        color: "#0E101A",
                                        whiteSpace: "nowrap",
                                        display: "flex",
                                        gap: "5px",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        cursor: "pointer",
                                      }}
                                      // onClick={() => {
                                      //   handleViewMode(true);
                                      //   setSelectedProduct(product)
                                      // }
                                      // }
                                      onClick={() =>
                                        navigate(
                                          `/product/view/${product._id}`, { state: { from: location.pathname } }
                                        )
                                      }
                                    >
                                      <div>
                                        {product.productName}{" "}
                                      </div>
                                      {product.category && <span
                                        style={{
                                          display: "inline-block",
                                          padding: "4px 8px",
                                          background: "#FFE0FC",
                                          color: "#AE009B",
                                          borderRadius: 36,
                                          fontSize: 12,
                                          marginTop: 4,
                                        }}
                                      >
                                        {product.category?.categoryName}
                                      </span>}
                                      {Number(product.warrantyPeriod) > 0 && <img src={Shield} />}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Quantity */}
                              <td
                                style={{
                                  padding: "4px 16px",
                                  fontSize: 14,
                                  color: "#0E101A",
                                  cursor: "pointer",
                                }}
                                // onClick={() => {
                                //   handleViewMode(true);
                                //   setSelectedProduct(product)
                                // }
                                // }
                                onClick={() =>
                                  navigate(
                                    `/product/view/${product._id}`, { state: { from: location.pathname } }
                                  )
                                }
                              >
                                <span style={{ color: isStockAlertProduct(product) ? "#D8484A" : "#727681" }}>
                                  {/* {getVariantQuantityText(product)} */}
                                  {getTotalVariantQuantity(product)} {product.unit || "Unit"}
                                </span>
                              </td>

                              {/* Item Code */}
                              <td
                                style={{
                                  padding: "4px 16px",
                                  fontSize: 14,
                                  color: "#0E101A",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {product.itemBarcode ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      cursor: "pointer",
                                      position: "relative",
                                    }}
                                    onClick={() =>
                                      setViewBarcode(
                                        viewBarcode === index ? false : index
                                      )
                                    }
                                    ref={(el) =>
                                      (buttonRefs.current[index] = el)
                                    }
                                  >
                                    {product.itemBarcode}
                                    {product.itemBarcode ? (
                                      <FaBarcode className="fs-6 text-secondary" />
                                    ) : (
                                      "-"
                                    )}
                                  </div>
                                ) : (
                                  "-"
                                )}
                                {viewBarcode === index && (
                                  <>
                                    <div
                                      style={{
                                        position: "fixed",
                                        inset: 0,
                                        background: "rgba(0,0,0,0.5)",
                                        zIndex: 999999,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                      }}
                                    >
                                      <div
                                        ref={modelRef}
                                        style={{
                                          width: "70%",
                                          backgroundColor: "#f5f4f4ff",
                                          borderRadius: 16,
                                          padding: 24,
                                          display: "flex",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: "300px",
                                            height: "auto",
                                            backgroundColor: "white",
                                            outfit: "contain",
                                            boxShadow:
                                              "10px 10px 40px rgba(0,0,0,0.10)",
                                            borderRadius: 16,
                                            padding: 16,
                                            border: "2px solid #dbdbdbff",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                          }}
                                        >
                                          <span>
                                            {product.productName} / ₹{product.purchasePrice}/-
                                          </span>
                                          <div className="d-flex flex-column align-items-center">
                                            <svg id={`barcode-svg-${index}`}></svg>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </td>

                              {/* Purchase Price */}
                              <td
                                style={{
                                  padding: "4px 16px",
                                  fontSize: 14,
                                  color: "#0E101A",
                                  cursor: "pointer",
                                }}
                                // onClick={() => {
                                //   handleViewMode(true);
                                //   setSelectedProduct(product)
                                // }
                                // }
                                onClick={() =>
                                  navigate(
                                    `/product/view/${product._id}`, { state: { from: location.pathname } }
                                  )
                                }
                              >
                                ₹{product.purchasePrice}/-
                              </td>

                              {/* Selling Price */}
                              <td
                                style={{
                                  padding: "4px 16px",
                                  fontSize: 14,
                                  color: "#0E101A",
                                  cursor: "pointer",
                                }}
                                // onClick={() => {
                                //   handleViewMode(true);
                                //   setSelectedProduct(product)
                                // }
                                // }
                                onClick={() =>
                                  navigate(
                                    `/product/view/${product._id}`, { state: { from: location.pathname } }
                                  )
                                }
                              >
                                {taxSettings.priceIncludeGST ? "₹" + (product.sellingPrice + (product.sellingPrice * product.tax / 100)).toFixed(2) + "/-" : "₹" + product.sellingPrice.toFixed(2) + "/-"}
                              </td>

                              {/* Actions */}
                              <td
                                style={{
                                  padding: "4px 16px",
                                  position: "relative",
                                  overflow: "visible",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    position: "relative",
                                    cursor: "pointer",
                                  }}
                                  onClick={() =>
                                    setViewOptions(
                                      viewOptions === index ? false : index
                                    )
                                  }
                                  ref={(el) => (buttonRefs.current[index] = el)}
                                >
                                  <div
                                    style={{
                                      width: 24,
                                      height: 24,
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                    }}
                                    onClick={(e) => {
                                      const rect =
                                        e.currentTarget.getBoundingClientRect();

                                      const dropdownHeight = 260; // your menu height
                                      const spaceBelow =
                                        window.innerHeight - rect.bottom;
                                      const spaceAbove = rect.top;

                                      // decide direction
                                      if (
                                        spaceBelow < dropdownHeight &&
                                        spaceAbove > dropdownHeight
                                      ) {
                                        setOpenUpwards(true);
                                        setDropdownPos({
                                          x: rect.left,
                                          y: rect.top - 6, // position above button
                                        });
                                      } else {
                                        setOpenUpwards(false);
                                        setDropdownPos({
                                          x: rect.left,
                                          y: rect.bottom + 6, // position below button
                                        });
                                      }

                                      setViewOptions(
                                        viewOptions === index ? false : index
                                      );
                                    }}
                                    ref={(el) =>
                                      (buttonRefs.current[index] = el)
                                    }
                                  >
                                    <div
                                      style={{
                                        width: 4,
                                        height: 4,
                                        background: "#6C748C",
                                        borderRadius: 2,
                                      }}
                                    />
                                    <div
                                      style={{
                                        width: 4,
                                        height: 4,
                                        background: "#6C748C",
                                        borderRadius: 2,
                                      }}
                                    />
                                    <div
                                      style={{
                                        width: 4,
                                        height: 4,
                                        background: "#6C748C",
                                        borderRadius: 2,
                                      }}
                                    />
                                  </div>
                                  {viewOptions === index && (
                                    <>
                                      <div
                                        style={{
                                          position: "fixed",
                                          top: openUpwards
                                            ? dropdownPos.y - 190
                                            : dropdownPos.y,
                                          left: dropdownPos.x - 80,
                                          zIndex: 999999,
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div
                                          ref={modelRef}
                                          style={{
                                            background: "white",
                                            padding: 8,
                                            borderRadius: 12,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            minWidth: 180,
                                            height: "auto", // height must match dropdownHeight above
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 4,
                                          }}
                                        >
                                          {hasPermission(user, "Product", "update") && (
                                            <div
                                              onClick={() =>
                                                navigate(
                                                  `/product/edit/${product._id}`, { state: { from: location.pathname } }
                                                )
                                              }
                                              style={{
                                                display: "flex",
                                                justifyContent: "flex-start",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "8px 12px",
                                                borderRadius: 8,
                                                border: "none",
                                                cursor: "pointer",
                                                fontFamily: "Inter, sans-serif",
                                                fontSize: 16,
                                                fontWeight: 400,
                                                color: "#6C748C",
                                                textDecoration: "none",
                                              }}
                                              className="button-action"
                                            >
                                              <img src={edit} alt="" />
                                              <span style={{ color: "black" }}>
                                                Edit
                                              </span>
                                            </div>
                                          )}
                                          <div
                                            // onClick={() => {
                                            //   handleViewMode();
                                            //   setSelectedProduct(product);
                                            // }}
                                            onClick={() =>
                                              navigate(
                                                `/product/view/${product._id}`, { state: { from: location.pathname } }
                                              )
                                            }
                                            style={{
                                              display: "flex",
                                              justifyContent: "flex-start",
                                              alignItems: "center",
                                              gap: 8,
                                              padding: "8px 12px",
                                              borderRadius: 8,
                                              border: "none",
                                              cursor: "pointer",
                                              fontFamily: "Inter, sans-serif",
                                              fontSize: 16,
                                              fontWeight: 400,
                                              color: "#6C748C",
                                              textDecoration: "none",
                                            }}
                                            className="button-action"
                                          >
                                            <img src={viewdetails} alt="" />
                                            <span style={{ color: "black" }}>
                                              View Details
                                            </span>
                                          </div>
                                          {/* <Link
                                          to="/create-purchase-orders"
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            border: "none",
                                            cursor: "pointer",
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: 16,
                                            fontWeight: 400,
                                            color: "#6C748C",
                                            textDecoration: "none",
                                          }}
                                          className="button-action"
                                        >
                                          <img src={stockin} alt="" />
                                          <span style={{ color: "black" }}>
                                            Stock In
                                          </span>
                                        </Link>
                                        <Link
                                          to="/createinvoice"
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            border: "none",
                                            cursor: "pointer",
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: 16,
                                            fontWeight: 400,
                                            color: "#6C748C",
                                            textDecoration: "none",
                                          }}
                                          className="button-action"
                                        >
                                          <img src={stockout} alt="" />
                                          <span style={{ color: "black" }}>
                                            Stock Out
                                          </span>
                                        </Link> */}
                                          <div
                                            onClick={() => handleDuplicate(product._id)}
                                            style={{
                                              display: "flex",
                                              justifyContent: "flex-start",
                                              alignItems: "center",
                                              gap: 8,
                                              padding: "8px 12px",
                                              borderRadius: 8,
                                              border: "none",
                                              cursor: "pointer",
                                              fontFamily: "Inter, sans-serif",
                                              fontSize: 16,
                                              fontWeight: 400,
                                              color: "#6C748C",
                                              textDecoration: "none",
                                            }}
                                            className="button-action"
                                          >
                                            <img src={duplicate} alt="" />
                                            <span style={{ color: "black" }}>
                                              Duplicate
                                            </span>
                                          </div>
                                          {hasPermission(user, "Product", "delete") && (
                                            <div
                                              onClick={() =>
                                                handleDelete(product._id)
                                              }
                                              style={{
                                                display: "flex",
                                                justifyContent: "flex-start",
                                                alignItems: "center",
                                                gap: 8,
                                                padding: "8px 12px",
                                                borderRadius: 8,
                                                border: "none",
                                                cursor: "pointer",
                                                fontFamily: "Inter, sans-serif",
                                                fontSize: 16,
                                                fontWeight: 400,
                                                color: "#6C748C",
                                                textDecoration: "none",
                                              }}
                                              className="button-action"
                                            >
                                              <img src={deletebtn} alt="" />
                                              <span style={{ color: "black" }}>
                                                Delete
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {expandedRows.has(product._id) && Array.isArray(product.variants) && product.variants.length > 1 && (
                              product.variants.map((variant, vIdx) => (
                                <tr
                                  key={`${product._id}-variant-${vIdx}`}
                                  style={{
                                    borderBottom: vIdx === product.variants.length - 1 ? "1px solid #EAEAEA" : "none",
                                    background: "#F9FBFF",
                                    height: "40px",
                                  }}
                                >
                                  {/* Variant Name/Label */}
                                  <td style={{ padding: "4px 16px 4px 100px", fontSize: 13, color: "#0E101A" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                      <span style={{ color: "#1F7FFF", fontWeight: 500 }}>
                                        {[variant.color, variant.size].filter(Boolean).join(" / ") || `Variant ${vIdx + 1}`}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Variant Quantity */}
                                  <td style={{ padding: "4px 16px", fontSize: 13 }}>
                                    <span style={{
                                      color: toNumber(variant.stockQuantity) <= toNumber(variant.minStockToMaintain) && toNumber(variant.stockQuantity) !== 0
                                        ? "#D8484A"
                                        : toNumber(variant.stockQuantity) === 0
                                          ? "#D8484A"
                                          : "#727681"
                                    }}>
                                      {toNumber(variant.stockQuantity)} {variant.unit || product.unit || ""}
                                    </span>
                                  </td>

                                  {/* itembarcode */}
                                  <td style={{ padding: "4px 16px", fontSize: 13, color: "#0E101A" }}>
                                    {variant.itemBarcode ?? "—"}
                                  </td>

                                  {/* Purchase Price */}
                                  <td style={{ padding: "4px 16px", fontSize: 13, color: "#0E101A" }}>
                                    ₹{variant.purchasePrice ?? "—"}/-
                                  </td>

                                  {/* Selling Price */}
                                  <td style={{ padding: "4px 16px", fontSize: 13, color: "#0E101A" }}>
                                    {taxSettings.priceIncludeGST
                                      ? "₹" + (toNumber(variant.sellingPrice) + toNumber(variant.sellingPrice) * toNumber(variant.tax) / 100).toFixed(2) + "/-"
                                      : "₹" + toNumber(variant.sellingPrice).toFixed(2) + "/-"}
                                  </td>

                                  {/* Actions — empty for variant rows */}
                                  <td />
                                </tr>
                              ))
                            )}
                          </>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentPage}
                  total={currentTotal}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(p) => {
                    setCurrentPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsPerPage(n);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* horizontal section */}
            <div
              style={{
                display: "flex",
                gap: 16,
                fontFamily: "Inter, sans-serif",
                height: "calc(100vh - 155px)",
              }}
            >
              {/* Left Sidebar */}
              <div
                style={{
                  width: 300,
                  background: "white",
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  overflowY: "auto",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>
                  Products
                </h3>
                <div
                  style={{
                    position: "relative",
                    padding: "8px 16px 8px 10px",
                    background: "#FCFCFC",
                    border: "1px solid #EAEAEA",
                    borderRadius: 8,
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  <IoIosSearch className="fs-5" />
                  <input
                    type="search"
                    placeholder="Search..."
                    value={leftSearch}
                    onChange={(e) => {
                      setLeftSearch(e.target.value);
                      setSelectedRowIds(new Set());
                    }}
                    style={{
                      border: "none",
                      outline: "none",
                      fontSize: 14,
                      color: "#727681",
                      background: 'transparent'
                    }}
                  />
                </div>

                <hr style={{ border: "1px solid #EAEAEA", margin: 0 }} />

                {/* Product List */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    // gap: 8,
                    cursor: 'pointer',
                  }}
                >
                  {(filteredAllProducts.length
                    ? filteredAllProducts
                    : allProducts
                  ).map((p) => (
                    <>
                      <div
                        key={p._id}
                        style={{
                          padding: "8px 12px",
                          background:
                            selectedProduct && selectedProduct._id === p._id
                              ? "#F6FAFF"
                              : "white",
                          borderBottom: "1px solid #EAEAEA",
                          // borderRadius: 8,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                        onClick={() => {
                          setSelectedProduct(p);
                          setVariantSelection(false, 0); // ✅ reset
                          if (Array.isArray(p.variants) && p.variants.length > 1) {
                            setExpandedRows((prev) => {
                              const next = new Set(prev);
                              next.has(p._id) ? next.delete(p._id) : next.add(p._id);
                              return next;
                            });
                          }
                        }}
                      >
                        <div
                          style={{
                            fontSize: 16,
                            color: "#0E101A",
                            fontWeight: 400,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {Array.isArray(p.variants) && p.variants.length > 1 ? (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(p);
                                setVariantSelection(true, vi); // ✅ mark explicit
                              }}
                              style={{ cursor: "pointer", color: "#1F7FFF", display: "flex", alignItems: "center" }}
                              title="Show variants"
                            >
                              {expandedRows.has(p._id) ? <FaRegFolderOpen /> : <FaRegFolder />}
                            </span>
                          ) : (
                            <></>
                          )}&nbsp;{p.productName}
                          {Number(p.warrantyPeriod) > 0 && <img src={Shield} />}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 14,
                            color: "#727681",
                          }}
                        >
                          {taxSettings.priceIncludeGST ? "₹" + (p.sellingPrice + (p.sellingPrice * p.tax / 100)).toFixed(2) + "/-" : "₹" + p.sellingPrice.toFixed(2) + "/-"}
                          <span>
                            {/* Qty - <span style={{ color: isStockAlertProduct(p) ? "#D8484A" : "#727681" }}>{getVariantQuantityText(p)}</span> */}
                            Qty - <span style={{ color: isStockAlertProduct(p) ? "#D8484A" : "#727681" }}>{getTotalVariantQuantity(p)}</span>
                          </span>
                        </div>
                      </div>
                      {expandedRows.has(p._id) && Array.isArray(p.variants) && p.variants.length > 1 && (
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          {p.variants.map((v, vi) => (
                            <div
                              key={vi}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(p);
                                // setSelectedVariantIndex(vi);
                                // setVariantExplicitlySelected(true);
                                setVariantSelection(true, vi);
                              }}
                              style={{
                                padding: "6px 10px",
                                background: selectedProduct?._id === p._id && selectedVariantIndex === vi && expandedRows.has(p._id)
                                  ? "#DBEAFE"
                                  : selectedProduct?._id === p._id
                                    ? "#EDF4FF"
                                    : "#F9FAFB",
                                // borderRadius: 6,
                                // borderLeft: selectedProduct?._id === p._id && selectedVariantIndex === vi && expandedRows.has(p._id) ? "2px solid #1F7FFF" : "2px solid #C7D9F8",
                                fontSize: 13,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: 8,
                                cursor: "pointer",
                              }}
                            >
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <span style={{ fontWeight: 500, color: "#0E101A" }}>
                                  {p.productName || ""}- {[v.color, v.size].filter(Boolean).join(" / ") || `Variant ${vi + 1}`}
                                </span>
                                {/* <div style={{ display: "flex", gap: 4 }}>
                                  {v.size && (
                                    <span style={{ padding: "1px 6px", background: "#EEF5FF", color: "#1F7FFF", borderRadius: 20, fontSize: 11 }}>
                                      {v.size}
                                    </span>
                                  )}
                                  {v.color && (
                                    <span style={{ padding: "1px 6px", background: "#F5EEFF", color: "#7B2FBE", borderRadius: 20, fontSize: 11 }}>
                                      {v.color}
                                    </span>
                                  )}
                                </div> */}
                              </div>
                              <span style={{ fontSize: 12, color: toNumber(v.stockQuantity) === 0 ? "#D8484A" : "#727681", whiteSpace: "nowrap" }}>
                                {toNumber(v.stockQuantity)} {v.unit || p.unit || "pcs"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ))}
                  {filteredAllProducts.length === 0 ? (
                    <div style={{ padding: "0px 10px", color: "#727681", }}>
                      No Product Found
                    </div>
                  ) : allProducts.length === 0 ? (
                    <div style={{ padding: "0px 10px", color: "#727681", }}>
                      No Product Found
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Right Main Content */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  overflowY: "auto",
                }}
              >
                {selectedProduct ? (
                  <>
                    {/* Overview + stats + details tab */}
                    <div
                      style={{
                        background: "white",
                        borderRadius: 16,
                        padding: 16,
                        border: "1px solid #EAEAEA",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      {/* overview header + Managae dropdown */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h3
                          style={{ margin: 0, fontSize: 16, fontWeight: 500 }}
                        >
                          Overview
                        </h3>
                        <div
                          style={{
                            padding: "4px 6px",
                            background: "#1F7FFF",
                            color: "white",
                            borderRadius: 4,
                            border: "none",
                            fontSize: 14,
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            cursor: "pointer",
                            justifyContent: "center",
                            position: "relative",
                          }}
                          onClick={handleViewManage}
                        >
                          <div
                            style={{
                              background: "#1F7FFF",
                              color: "white",
                              border: "none",
                              outline: "none",
                            }}
                          >
                            <span>Manage </span>
                            <IoIosArrowDown />
                          </div>
                          {viewManageOptions && (
                            <>
                              <div
                                style={{
                                  position: "absolute",
                                  top: "40px",
                                  left: "-90px",
                                  zIndex: 999999,
                                }}
                              >
                                <div
                                  ref={manageRef}
                                  style={{
                                    background: "white",
                                    padding: 8,
                                    borderRadius: 12,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    minWidth: 180,
                                    height: "auto", // height must match dropdownHeight above
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                  }}
                                >
                                  <div
                                    onClick={() =>
                                      selectedProduct &&
                                      navigate(
                                        `/product/edit/${selectedProduct._id}`, { state: { from: location.pathname } }
                                      )
                                    }
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-start",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "8px 12px",
                                      borderRadius: 8,
                                      border: "none",
                                      cursor: "pointer",
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: 16,
                                      fontWeight: 400,
                                      color: "#6C748C",
                                      textDecoration: "none",
                                    }}
                                    className="button-action"
                                  >
                                    <img src={edit} alt="" />
                                    <span style={{ color: "black" }}>
                                      Edit
                                    </span>
                                  </div>
                                  {/* <Link
                                    to="/create-purchase-orders"
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-start",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "8px 12px",
                                      borderRadius: 8,
                                      border: "none",
                                      cursor: "pointer",
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: 16,
                                      fontWeight: 400,
                                      color: "#6C748C",
                                      textDecoration: "none",
                                    }}
                                    className="button-action"
                                  >
                                    <img src={stockin} alt="" />
                                    <span style={{ color: "black" }}>
                                      Stock In
                                    </span>
                                  </Link>
                                  <Link
                                    to="/createinvoice"
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-start",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "8px 12px",
                                      borderRadius: 8,
                                      border: "none",
                                      cursor: "pointer",
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: 16,
                                      fontWeight: 400,
                                      color: "#6C748C",
                                      textDecoration: "none",
                                    }}
                                    className="button-action"
                                  >
                                    <img src={stockout} alt="" />
                                    <span style={{ color: "black" }}>
                                      Stock Out
                                    </span>
                                  </Link> */}
                                  <div
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(selectedProduct._id);
                                    }}
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-start",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: "8px 12px",
                                      borderRadius: 8,
                                      border: "none",
                                      cursor: "pointer",
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: 16,
                                      fontWeight: 400,
                                      color: "#6C748C",
                                      textDecoration: "none",
                                    }}
                                    className="button-action"
                                  >
                                    <img src={deletebtn} alt="" />
                                    <span style={{ color: "black" }}>
                                      Delete
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Status of overview */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(4, 1fr)",
                          gap: 4,
                          padding: 4,
                          border: "1px solid #EAEAEA",
                          borderRadius: 8,
                        }}
                      >
                        {[
                          ["Total Revenue", "₹" + ((avSellingPrice - avPurchasePrice) * avStock).toFixed(2)],
                          ["Total Order", transactionCounts.All],
                          ["Available Quantity", isAvAlert ? <span style={{ color: "#D8484A" }}>{avStock}</span> : <span style={{ color: "black" }}>{avStock}</span>],
                          ["Profit Per Items", "₹" + (avSellingPrice - avPurchasePrice).toFixed(2)],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            style={{
                              padding: 12,
                              background: "white",
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              borderRight: label == 'Profit Per Items' ? "none" : "1px solid #EAEAEA",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "start",
                                textAlign: "left",
                                width: "100%",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 22,
                                  fontWeight: 500,
                                  color: "#0E101A",
                                  width: "10%",
                                }}
                              ></div>
                              <div
                                style={{
                                  fontSize: 22,
                                  fontWeight: 500,
                                  color: "#0E101A",
                                  width: "100%",
                                }}
                              >
                                <div
                                  style={{ color: "#727681", fontSize: 14 }}
                                >
                                  {label}
                                </div>
                                <span>{value || "0"}</span>
                              </div>
                              {/* <div style={{ fontSize: 14, color: 'black', width: '40%', position: 'relative', top: '10px' }}>+15%</div> */}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tabs + Details + Images */}
                      <div style={{ display: "flex", gap: 16, width: "100%", justifyContent: "space-between" }}>
                        {/* Left: Tabs & Details */}
                        <div style={{ display: "flex", flexDirection: "column", gap: '30px', width: '900px' }}>

                          {/* basic details */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                // borderBottom: "1px solid #EAEAEA",
                                marginBottom: 10,
                              }}
                            >
                              <div
                                style={{
                                  padding: "6px 12px",
                                  borderBottom: "none",
                                  color: "black",
                                  fontWeight: 500,
                                  fontSize: 16,
                                  cursor: "pointer",
                                }}
                              // onClick={() => setDetailsTab(tab)}
                              >
                                Basic Details
                              </div>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 16,
                                flexWrap: "wrap",
                                padding: "0px 12px",
                              }}
                            >
                              {[
                                ["Name:", selectedProduct.productName + `${avSize ? ` -> ${avSize}` : ""}` + `${avColor ? `/${avColor}` : ""}`],
                                ["Category:", (selectedProduct.category?.categoryName || "-")],
                                ["Sub Category:", (selectedProduct.subcategory?.name ? `${selectedProduct.subcategory.name}` : ""),],
                                ["Brand:", (selectedProduct.brand?.brandName ? `${selectedProduct.brand.brandName}` : ""),],
                                ["HSN:", selectedProduct.hsn?.hsnCode || "-"],
                                ["Item Code:",
                                  <span
                                    key="code"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                    }}

                                  >
                                    <div
                                      style={{ cursor: "pointer" }}
                                      onClick={() => setBarcodeModal(avBarcode)}
                                    >
                                      {avBarcode}
                                    </div>
                                    {barcodeModal && (
                                      <div
                                        style={{
                                          position: "fixed",
                                          inset: 0,
                                          background: "rgba(0,0,0,0.5)",
                                          zIndex: 999999,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                        onClick={() => setBarcodeModal(null)}
                                      >
                                        <div style={{
                                          width: "70%",
                                          backgroundColor: "#f5f4f4ff",
                                          borderRadius: 16,
                                          padding: 24,
                                          display: "flex",
                                          justifyContent: "center",
                                          alignItems: "center",
                                        }}>
                                          <div
                                            style={{
                                              width: "300px",
                                              height: "auto",
                                              backgroundColor: "white",
                                              outfit: "contain",
                                              boxShadow:
                                                "10px 10px 40px rgba(0,0,0,0.10)",
                                              borderRadius: 16,
                                              padding: 16,
                                              border: "2px solid #dbdbdbff",
                                              display: "flex",
                                              flexDirection: "column",
                                              gap: 8,
                                            }}
                                          >
                                            <div>
                                              {selectedProduct.productName + `${avSize ? ` -> ${avSize}` : ""}` + `${avColor ? `/${avColor}` : ""}`} - ₹ {(avSellingPrice + (avSellingPrice * avTax / 100)).toFixed(2)}/-
                                            </div>
                                            <div className="d-flex justify-content-center align-items-center">
                                              <svg id="barcode-svg-modal"></svg>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {avBarcode ? (
                                      <FaBarcode className="fs-6 text-secondary" />
                                    ) : (
                                      <span>-</span>
                                    )}
                                  </span>,
                                ],
                                ["Available Qty:", avStock < avMin ? (<><span style={{ color: "#D8484A" }}>{avStock || "0"}</span> {avUnit}</>) : (<><span style={{ color: "black" }}>{avStock || "0"}</span> {avUnit}</>)],
                                ["Min. Stock to Maintain:", avMin || "0"],
                                ["Opening Quantity:", avOpeningQty || "-"],
                                ["Unit:", selectedProduct.dualUnit
                                  ? `1 ${avUnit || "Unit"} = ${selectedProduct.secondaryUnitQuantity ?? "-"} ${selectedProduct.secondaryUnit || ""}`
                                  : avUnit || "-"
                                ],
                              ].map(([label, value]) => (
                                <div
                                  key={label}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontSize: 16,
                                  }}
                                >
                                  <span style={{ color: "#727681" }}>
                                    {label}
                                  </span>
                                  <span style={{ color: "#0E101A" }}>
                                    {value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* pricing details */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                // borderBottom: "1px solid #EAEAEA",
                              }}
                            >
                              <div
                                style={{
                                  padding: "0px 12px",
                                  borderBottom: "none",
                                  color: "black",
                                  fontWeight: 500,
                                  fontSize: 16,
                                  cursor: "pointer",
                                  marginBottom: 8,
                                }}
                              // onClick={() => setDetailsTab(tab)}
                              >
                                Pricing
                              </div>
                            </div>

                            <div style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex' }}>

                              <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex' }}>
                                <div style={{ flex: '1 1 0', paddingLeft: 16, paddingRight: 16, paddingTop: 4, paddingBottom: 4, background: 'var(--Blue-Light-Blue, #E5F0FF)', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                                  <div style={{ flex: '1 1 0', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', lineHeight: 16.80, wordWrap: 'break-word' }}>
                                        Purchasing Price
                                      </div>
                                    </div>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', lineHeight: 16.80, wordWrap: 'break-word' }}>
                                        Tax
                                      </div>
                                    </div>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', lineHeight: 16.80, wordWrap: 'break-word' }}>
                                        MRP
                                      </div>
                                    </div>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', lineHeight: 16.80, wordWrap: 'break-word' }}>
                                        Selling Price
                                      </div>
                                    </div>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', lineHeight: 16.80, wordWrap: 'break-word' }}>
                                        Discount
                                      </div>
                                    </div>
                                    {/* <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', lineHeight: 16.80, wordWrap: 'break-word' }}>
                                        Profit
                                      </div>
                                    </div> */}
                                  </div>
                                </div>
                              </div>

                              <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 1, display: 'flex' }}>
                                <div style={{ alignSelf: 'stretch', borderBottom: '1px var(--White-Stroke, #EAEAEA) solid', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 1, display: 'flex' }}>
                                  <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex' }}>
                                    <div style={{ flex: '1 1 0', background: 'var(--White-White-1, white)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'inline-flex' }}>
                                      <div style={{ alignSelf: 'stretch', paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, background: 'var(--White-White-1, white)', borderBottom: '1px #FCFCFC solid', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                                        <div style={{ flex: '1 1 0', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              ₹ {(avPurchasePrice || 0).toFixed(2)}/-
                                            </div>
                                          </div>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              {avTax || "-"}%
                                            </div>
                                          </div>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                          ₹ {((avMrp) || 0).toFixed(2)}/-
                                            </div>
                                          </div>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              ₹ {(avSellingPrice ? ((avSellingPrice + (avSellingPrice * avTax / 100)).toFixed(2)) + " /-" : avSellingPrice)}
                                              {/* {taxSettings.priceIncludeGST ? "₹" + (avSellingPrice || 0).toFixed(2) + "" : "₹" + (avSellingPrice || 0).toFixed(2) + "/-"} */}
                                            </div>
                                          </div>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              {avDiscountType === "Percentage" ? (`${avDiscountAmount}%`) : avDiscountType === "Fixed" ? (`₹ ${(avDiscountAmount || 0).toFixed(2)} /-`) : ("-")}
                                            </div>
                                          </div>
                                          {/* <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              ₹ {((avSellingPrice + (avSellingPrice * avTax / 100)) - avPurchasePrice).toFixed(2)}/-
                                            </div>
                                          </div> */}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* batch details */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                // borderBottom: "1px solid #EAEAEA",
                              }}
                            >
                              <div
                                style={{
                                  padding: "0px 12px",
                                  borderBottom: "none",
                                  color: "black",
                                  fontWeight: 500,
                                  fontSize: 16,
                                  cursor: "pointer",
                                  marginBottom: 8,
                                }}
                              // onClick={() => setDetailsTab(tab)}
                              >
                                Batch
                              </div>
                            </div>
                            <div style={{ width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex' }}>
                              <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'flex-start', display: 'inline-flex' }}>
                                <div style={{ flex: '1 1 0', paddingLeft: 16, paddingRight: 16, paddingTop: 4, paddingBottom: 4, background: 'var(--Blue-Light-Blue, #E5F0FF)', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                                  <div style={{ flex: '1 1 0', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Batch No.</div>
                                    </div>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Model No.</div>
                                    </div>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word', }}>Serial No</div>
                                    </div>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Mfg. Date</div>
                                    </div>
                                    <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                      <div style={{ color: '#727681', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>Expiry</div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div style={{ alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 1, display: 'flex' }}>
                                <div style={{ alignSelf: 'stretch', borderBottom: '1px var(--White-Stroke, #EAEAEA) solid', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 1, display: 'flex' }}>
                                  <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'center', display: 'inline-flex' }}>
                                    <div style={{ flex: '1 1 0', background: 'var(--White-White-1, white)', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 10, display: 'inline-flex' }}>
                                      <div style={{ alignSelf: 'stretch', paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, background: 'var(--White-White-1, white)', borderBottom: '1px #FCFCFC solid', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                                        <div style={{ flex: '1 1 0', justifyContent: 'space-between', alignItems: 'center', display: 'flex' }}>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              {avBatchNo || '-'}
                                            </div>
                                          </div>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              {avModelNo || '-'}
                                            </div>
                                          </div>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div
                                              onClick={() => setSerialNoPopup(true)}
                                              style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word', cursor: 'pointer' }}>
                                              {avSerialNo?.length > 0 ? (<u>{avSerialNo?.length}</u>) : '-'}
                                            </div>
                                          </div>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              {avManufacturingDate ? (
                                                <>
                                                  {new Date(avManufacturingDate).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric"
                                                  })}</>
                                              ) : '-'}
                                            </div>
                                          </div>
                                          <div style={{ flex: '1 1 0', height: 30, paddingLeft: 12, paddingRight: 12, paddingTop: 4, paddingBottom: 4, justifyContent: 'flex-start', alignItems: 'center', gap: 8, display: 'flex' }}>
                                            <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 16, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                                              {avExpiryDate ? (
                                                <>
                                                  {new Date(avExpiryDate).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric"
                                                  })}</>
                                              ) : '-'}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* warranty details */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                // borderBottom: "1px solid #EAEAEA",
                                marginBottom: 6,
                              }}
                            >
                              <div
                                style={{
                                  padding: "6px 12px",
                                  borderBottom: "none",
                                  color: "black",
                                  fontWeight: 500,
                                  fontSize: 16,
                                  cursor: "pointer",
                                }}
                              // onClick={() => setDetailsTab(tab)}
                              >
                                Warranty
                              </div>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: 16,
                                flexWrap: "wrap",
                                padding: "0px 12px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  fontSize: 16,
                                }}
                              >
                                {avWarrantyPeriod ? <span style={{
                                  backgroundColor: "#FFE6FA",
                                  border: "1px solid #FF87DB",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  color: "#770067",
                                  fontSize: "14px",
                                  fontWeight: "400",
                                  width: "auto",
                                  textAlign: "center",
                                }}>
                                  {`${avWarrantyPeriod} Month Manufacturing Warranty`}
                                </span> :
                                  <span>
                                    No Warranty
                                  </span>}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right: Images */}
                        <div style={{ display: "flex", gap: 20, padding: "20px 50px", flexDirection: "column" }}>
                          {/* 1st image */}
                          {avImages?.[0] && (
                            <div
                              style={{
                                width: "200px",
                                height: "160px",
                                borderRadius: 8,
                                objectFit: "cover",
                                border: "1px solid #EAEAEA",
                              }}
                            >
                              <img
                                src={avImages[0].url}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: 8,
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          )}
                          {/* 2nd image */}
                          {avImages?.[1] && (
                            <div
                              style={{
                                width: "200px",
                                height: "160px",
                                borderRadius: 8,
                                objectFit: "cover",
                                border: "1px solid #EAEAEA",
                              }}
                            >
                              <img
                                src={avImages[1].url}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: 8,
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          )}
                          {/* 3rd image */}
                          {avImages?.[2] && (
                            <div
                              style={{
                                width: "200px",
                                height: "160px",
                                borderRadius: 8,
                                objectFit: "cover",
                                border: "1px solid #EAEAEA",
                              }}
                            >
                              <img
                                src={avImages[2].url}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: 8,
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Serial Numbers Display */}
                    {serialNoPopup && (
                      <div
                        onClick={() => setSerialNoPopup(false)}
                        style={{
                          position: "fixed",
                          top: 0,
                          left: 0,
                          width: "100vw",
                          height: "100vh",
                          backgroundColor: "rgba(0,0,0,0.27)",
                          backdropFilter: "blur(1px)",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          zIndex: 99999999,
                          overflow: "auto"
                        }}>
                        {serialNoPopup && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              backgroundColor: "white",
                              maxWidth: "958px",
                              borderRadius: "8px",
                              overflow: "auto",
                              maxHeight: "100vh",
                              padding: "12px",
                              background: "#fff",
                              border: "1px solid #EAEAEA"
                            }}>
                            <div style={{ fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1F1F1F" }}>Serial Numbers for: {avSerialNo?.length} Available Quantity</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {avSerialNo.map((sn, i) => (
                                <span key={i} style={{
                                  padding: "4px 8px",
                                  background: "#F9FAFB",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                  border: "1px solid #EAEAEA",
                                  color: "#333"
                                }}>
                                  {sn}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Transactions */}
                    <div
                      style={{
                        flex: 1,
                        background: "white",
                        borderRadius: 16,
                        padding: 16,
                        border: "1px solid #EAEAEA",
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <h3
                        style={{ margin: 0, fontSize: 16, fontWeight: 500 }}
                      >
                        Transactions
                      </h3>

                      {/* Tabs + date picker */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* tabs */}
                        <div
                          style={{
                            display: "flex",
                            background: "#E5F0FF",
                            borderRadius: 8,
                            padding: 2,
                            gap: 8,
                            flexWrap: "wrap",
                            height: "38px",
                          }}
                        >
                          {[
                            ["All", transactionCounts.All],
                            ["Sales", transactionCounts.Sales],
                            ["Purchase", transactionCounts.Purchase]
                          ].map(([tab, count]) => (
                            <div
                              key={tab}
                              onClick={() => setTransactionTab(tab)}
                              style={{
                                padding: "6px 12px",
                                background: transactionTab === tab ? "white" : "transparent",
                                borderRadius: 8,
                                boxShadow:
                                  transactionTab === tab
                                    ? "0px 1px 4px rgba(0,0,0,0.1)"
                                    : "none",
                                fontSize: 14,
                                color: "#0E101A",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                cursor: "pointer",
                              }}
                            >
                              {tab}
                              <span style={{ color: "#727681" }}>
                                {count}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* date picker */}
                        <div
                          className="position-relative"
                          style={{ width: "auto" }}
                        >
                          <DatePicker
                            selectedDateRange={selectedDateRange}
                            setSelectedDateRange={setSelectedDateRange}
                          />
                        </div>
                      </div>

                      {/* Table */}
                      <div style={{ overflowY: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: 800,
                          }}
                        >
                          <thead
                            style={{ background: "#E5F0FF", height: "38px" }}
                          >
                            <tr>
                              {[
                                "Date",
                                "Transaction Type",
                                "Transaction ID",
                                "Customer / Supplier",
                                "Stock In / Out",
                                "Amount",
                              ].map((h) => (
                                <th
                                  key={h}
                                  style={{
                                    textAlign: "left",
                                    padding: "4px 16px",
                                    color: "#727681",
                                    fontSize: 14,
                                    fontWeight: "500",
                                  }}
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {loading ? (
                              <tr>
                                <td colSpan="5" className="text-center py-4">
                                  <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                  </div>
                                </td>
                              </tr>
                            ) : filteredTransactions.length === 0 ? (
                              <tr>
                                <td colSpan="6" className="text-center text-muted py-3">
                                  No Records Found
                                </td>
                              </tr>
                            ) : (
                              filteredTransactions.map((t, i) => (
                                <tr
                                  key={i}
                                  style={{ borderBottom: "1px solid #FCFCFC" }}
                                >
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      fontSize: 14,
                                      color: "#0E101A",
                                    }}
                                  >
                                    {t.date}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      fontSize: 14,
                                      color: "#0E101A",
                                    }}
                                  >
                                    {t.source}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      fontSize: 14,
                                      color: "#0E101A",
                                    }}
                                  >
                                    {t.id}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      fontSize: 14,
                                      color: "#0E101A",
                                    }}
                                  >
                                    {t.customerName}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 4,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 16,
                                        fontWeight: 600,
                                        color:
                                          t.stock > 0 ? "#0D6828" : "#D00003",
                                      }}
                                    >
                                      {Math.abs(t.stock)}
                                    </span>
                                    <span
                                      style={{ fontSize: 14, color: "#0E101A" }}
                                    >
                                      {t.quantity} Stock {t.status}
                                    </span>
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      fontSize: 14,
                                      color: "#0E101A",
                                    }}
                                  >
                                    {t.amount}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-center text-muted py-3">
                      No Product Selected to Display.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName="product"
      />

    </>
  );
};

export default Product;
