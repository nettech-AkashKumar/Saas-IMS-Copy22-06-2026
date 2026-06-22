import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import Select from "react-select";
import axios from "axios";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import { NavLink } from "react-router-dom";

// pages
import "./product.css";
import BASE_URL from "../../../../pages/config/config";
import CategoryModal from "../../../../pages/Modal/categoryModals/CategoryModal";
import api from "../../../../pages/config/axiosInstance"
import { useAuth } from "../../../auth/AuthContext";
import CreateCategoryModal from "../../category/CreateCategoryModel"
import CreateSubCategoryModel from "../../category/CreateSubCategoryModel";
import AddBrandModal from "../brand/AddBrandModal.jsx";
import AddHSNModal from "../hsn/AddHsnModals.jsx";
import AddUnitsModals from "../units/AddUnitsModals.jsx";
import AddSizeModal from "../Size/AddSizeModal.jsx";
import AddColorModal from "../Color/AddColorModal.jsx";
import AddTaxModal from "../../inventory/Tax/TaxAddModal.jsx"

// icons
import { MdImageSearch } from "react-icons/md";
import { TbTrash } from "react-icons/tb";
import { TbChevronUp, TbEye, TbRefresh } from "react-icons/tb";
import { FaArrowLeft } from "react-icons/fa6";
import { FiUpload, FiCheck, FiChevronDown } from "react-icons/fi";
import { RiDeleteBinLine } from "react-icons/ri";
import { FcAddImage } from "react-icons/fc";
import { MdLockOutline } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaCircleExclamation } from "react-icons/fa6";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

// images
import AiLogo from "../../../../assets/images/AI.png";

const getEditablePurchasePrice = (variant) => {
  const storedPrice = Number(variant?.purchasePrice);
  const taxRate = Number(variant?.tax);
  const taxType = variant?.purchasePriceTaxType;
  if (!Number.isFinite(storedPrice) || !taxType || !Number.isFinite(taxRate) || taxRate <= 0) {
    return variant?.purchasePrice || 0;
  }

  const enteredPrice = taxType === "withgst"
    ? storedPrice * (1 + taxRate / 100)
    : storedPrice / (1 + taxRate / 100);

  return Number(enteredPrice.toFixed(2));
};

const ProductCreate = () => {
  const { id } = useParams();
  const location = useLocation();
  const [existingImages, setExistingImages] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [productLotPricing, setProductLotPricing] = useState(false);
  const [save, setSave] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const [originalVariants, setOriginalVariants] = useState([]);
  const [dualUnit, setDualUnit] = useState(false);

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/api/products/${id}`);
      const data = res.data;

      setFormData((prev) => ({
        ...prev,
        productName: data.productName || "",
        description: data.description || "",
        itemBarcode: data.itemBarcode || "",
        productType: data.productType || ((data.variants?.length || 0) > 1 ? "Variant" : "Single"),
        secondaryUnitQuantity: data.secondaryUnitQuantity || "",
        // other fields will be handled by variants
      }));
      setDualUnit(Boolean(data.dualUnit));
      setTrackExpiry(typeof data.checkedExpiry === "boolean" ? data.checkedExpiry : Boolean(!data.lot_pricing && data.variants?.some((v) => v.expiryDate)));
      setTrackSerialNo(typeof data.checkedSerial === "boolean" ? data.checkedSerial : false);
      setTrackBatchNo(typeof data.checkedBatch === "boolean" ? data.checkedBatch : Boolean(data.lot_pricing));
      setTrackWarranty(typeof data.checkedWarranty === "boolean" ? data.checkedWarranty : Boolean(data.variants?.some((v) => v.warrantyType)));

      if (data.category) {
        const catId = typeof data.category === "object" ? data.category._id : data.category;
        const catLabel = typeof data.category === "object" ? data.category.categoryName : data.categoryName || "";
        setSelectedCategory({ value: catId, label: catLabel });
      }
      if (data.subcategory) {
        const subId = typeof data.subcategory === "object" ? data.subcategory._id : data.subcategory;
        const subLabel = typeof data.subcategory === "object" ? data.subcategory.name : data.subCategoryName || "";
        setSelectedsubCategory({ value: subId, label: subLabel });
      }
      if (data.brand) {
        const brandId = typeof data.brand === "object" ? data.brand._id : data.brand;
        const brandLabel = typeof data.brand === "object" ? data.brand.brandName : data.brandName || "";
        setSelectedBrands({ value: brandId, label: brandLabel });
      }
      if (data.hsn) {
        const hsnId = typeof data.hsn === "object" ? data.hsn._id : data.hsn;
        const hsnLabel = typeof data.hsn === "object" ? `${data.hsn.hsnCode} - ${data.hsn.description || ""}` : (data.hsnCode ? `${data.hsnCode} - ${data.hsnDescription || ""}` : "");
        setSelectedHSN({ value: hsnId, label: hsnLabel });
      }
      // if (data.warehouse) {
      //   const whId = typeof data.warehouse === "object" ? data.warehouse._id : data.warehouse;
      //   const whLabel = typeof data.warehouse === "object" ? data.warehouse.warehouseName : data.warehouseName || "";
      //   setSelectedWarehouse({ value: whId, label: whLabel });
      // }
      if (data.unit) {
        setSelectedUnits({ value: data.unit, label: data.unit });
      }
      if (data.secondaryUnit) {
        setSelectedSecondaryUnits({ value: data.secondaryUnit, label: data.secondaryUnit });
      }

      // Handle Variants & Images
      const initialSerials = Array.isArray(data.serialNumbers) ? data.serialNumbers : [];
      const existingVariant = {
        purchasePrice: data.purchasePrice || 0,
        mrp: data.mrp || 0,
        sellingPrice: data.sellingPrice || 0,
        tax: data.tax || 0,
        size: data.size || "",
        color: data.color || "",
        openingQuantity: data.openingQuantity || initialSerials.length || 0,
        stockQuantity: data.stockQuantity || 0,
        minStockToMaintain: data.minStockToMaintain || 0,
        discountAmount: data.discountAmount || 0,
        discountType: data.discountType || "Fixed",
        purchasePriceTaxType: data.purchasePriceTaxType || "withoutgst",
        manufacturingDate: data.manufacturingDate ? data.manufacturingDate.split("T")[0] : "",
        expiryDate: data.expiryDate ? data.expiryDate.split("T")[0] : "",
        unit: data.unit || "",
        secondaryUnit: data.secondaryUnit || "",
        lotNumber: data.lotNumber || "",
        modelNo: data.modelNo || "",
        serialNumbers: initialSerials,
        warrantyType: data.warrantyType || "",
        warrantyPeriod: data.warrantyPeriod || "",
        images: [], // New images to be uploaded
        existingImages: data.images || [],
      };

      if (data.variants && data.variants.length > 0) {
        setSelectedSizes(
          [...new Set(data.variants.map((v) => v.size).filter(Boolean))]
            .map((value) => ({ value, label: value })),
        );
        setSelectedColors(
          [...new Set(data.variants.map((v) => v.color).filter(Boolean))]
            .map((value) => ({ value, label: value })),
        );
        const mappedVariants = data.variants.map(v => ({
          _id: v._id || "",
          purchasePrice: getEditablePurchasePrice(v),
          mrp: v.mrp || 0,
          sellingPrice: v.sellingPrice || 0,
          tax: v.tax || 0,
          size: v.size || "",
          color: v.color || "",
          barcode: v.barcode || "",
          openingQuantity: v.openingQuantity || 0,
          stockQuantity: v.stockQuantity || 0,
          minStockToMaintain: v.minStockToMaintain || 0,
          discountAmount: v.discountAmount || 0,
          discountType: v.discountType || "Fixed",
          purchasePriceTaxType: v.purchasePriceTaxType || (v.gst ? "withgst" : "withoutgst"),
          manufacturingDate: v.manufacturingDate ? v.manufacturingDate.split("T")[0] : "",
          expiryDate: v.expiryDate ? v.expiryDate.split("T")[0] : "",
          unit: v.unit || "",
          secondaryUnit: v.secondaryUnit || "",
          lotNumber: v.lotNumber || "",
          modelNo: v.modelNo || "",
          serialNumbers: v.serialNumbers || [],
          warrantyType: v.warrantyType || "",
          warrantyPeriod: v.warrantyPeriod || "",
          coverageScope: v.coverageScope || "",
          serviceMode: v.serviceMode || "",
          maxClaimsAllowed: v.maxClaimsAllowed || "",
          inspectionRequired: v.inspectionRequired ? "Yes" : "No",
          warrantyStartsFrom: v.warrantyStartsFrom || "",
          linkedto: v.linkedto || "Manufacturer Warranty",
          extensionPeriod: v.extensionPeriod || "",
          coverageType: v.coverageType || "",
          extendedWarrantyPrice: v.extendedWarrantyPrice || "",
          lifetimeDefination: v.lifetimeDefination || "",
          coverageOf: v.coverageOf || "",
          whatNotCovered: v.whatNotCovered || "",
          maxClaims: v.maxClaims || "",
          replacementOnceOnly: v.replacementOnceOnly ? "Yes" : "No",
          images: [], // New images to be uploaded
          existingImages: v.images || [],
        }));
        setVariants(mappedVariants);
        setOriginalVariants(mappedVariants);
      } else {
        setVariants([existingVariant]);
      }

      if (data.images && data.images.length > 0) {
        setExistingImages(data.images.map(img => ({
          url: img.url,
          public_id: img.public_id,
        })));
      }

      if (typeof data.lot_pricing !== "undefined") {
        setListTab(data.lot_pricing ? "Lot / Batch" : "Pricing & Variants");
        setProductLotPricing(data.lot_pricing);
      }

      setLoading(false);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
      setLoading(false);
    }
  };

  const { t } = useTranslation();

  const [dropdown, setDropDown] = useState(false);
  const [dropdownSubCat, setDropDownSubCat] = useState(false);
  const [dropdownBrand, setDropDownBrand] = useState(false);
  const [dropdownHSN, setDropDownHSN] = useState(false);
  const [dropdownUnit, setDropDownUnit] = useState(false);
  const [dropdownUnitIndex, setDropDownUnitIndex] = useState(null);
  const [dropdownSecondaryUnit, setDropDownSecondaryUnit] = useState(false);
  const [dropdownSecondaryUnitIndex, setDropDownSecondaryUnitIndex] = useState(null);
  const [dropdownTaxIndex, setDropDownTaxIndex] = useState(null);
  const [dropdownSizeIndex, setDropDownSizeIndex] = useState(null);
  const [dropdownColorIndex, setDropDownColorIndex] = useState(null);
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const dropdownRef = useRef(null);
  const dropdownSubCatRef = useRef(null);
  const dropdownBrandRef = useRef(null);
  const dropdownHSNRef = useRef(null);
  const dropdownUnitsRef = useRef(null);
  const dropdownSecondaryUnitsRef = useRef(null);
  const sizeDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);

  const dropdownUnitsIndexRefs = useRef([]);
  const dropdownSecondaryUnitsIndexRefs = useRef([]);
  const dropdownTaxIndexRefs = useRef([]);
  const dropdownSizeIndexRefs = useRef([]);
  const dropdownColorIndexRefs = useRef([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target)) {
        setSizeDropdownOpen(false);
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target)) {
        setColorDropdownOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropDown(false);
      }
      if (dropdownSubCatRef.current && !dropdownSubCatRef.current.contains(event.target)) {
        setDropDownSubCat(false);
      }
      if (dropdownBrandRef.current && !dropdownBrandRef.current.contains(event.target)) {
        setDropDownBrand(false);
      }
      if (dropdownHSNRef.current && !dropdownHSNRef.current.contains(event.target)) {
        setDropDownHSN(false);
      }
      if (dropdownUnitsRef.current && !dropdownUnitsRef.current.contains(event.target)) {
        setDropDownUnit(false);
        setDropDownUnitIndex(null);
      }
      if (dropdownSecondaryUnitsRef.current && !dropdownSecondaryUnitsRef.current.contains(event.target)) {
        setDropDownSecondaryUnit(false);
        setDropDownSecondaryUnitIndex(null);
      }
      const activeUnitRef = dropdownUnitIndex !== null ? dropdownUnitsIndexRefs.current[dropdownUnitIndex] : null;
      if (activeUnitRef && !activeUnitRef.contains(event.target)) {
        setDropDownUnit(false);
        setDropDownUnitIndex(null);
      }
      const activeTaxRef = dropdownTaxIndex !== null ? dropdownTaxIndexRefs.current[dropdownTaxIndex] : null;
      if (activeTaxRef && !activeTaxRef.contains(event.target)) {
        setDropDownTaxIndex(null);
      }
      const activeSizeRef = dropdownSizeIndex !== null ? dropdownSizeIndexRefs.current[dropdownSizeIndex] : null;
      if (activeSizeRef && !activeSizeRef.contains(event.target)) {
        setDropDownSizeIndex(null);
      }
      const activeColorRef = dropdownColorIndex !== null ? dropdownColorIndexRefs.current[dropdownColorIndex] : null;
      if (activeColorRef && !activeColorRef.contains(event.target)) {
        setDropDownColorIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownUnitIndex, dropdownSecondaryUnitIndex, dropdownTaxIndex, dropdownSizeIndex, dropdownColorIndex]);

  const [isOn, setIsOn] = useState(false);
  const [showAddCategoryModel, setShowAddCategoryModel] = useState(false);
  const [showAddSubCategoryModel, setShowAddSubCategoryModel] = useState(false);
  const [showAddBrandModel, setShowAddBrandModel] = useState(false);
  const [showAddHSNModel, setShowAddHSNModel] = useState(false);
  const modelAddRef = useRef(null);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [errors, setErrors] = useState({});
  const [highlightedFields, setHighlightedFields] = useState([]);
  const fileRef = useRef(null);

  const [settings, setSettings] = useState({
    category: false,
    subcategory: false,
    brand: false,
    description: false,
    itembarcode: false,
    hsn: false,
    units: false,
    lotno: false,
    serialno: false,
    pricing: false,
  });

  useEffect(() => {
    fetchSettings();
    fetchBrands();
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
          serialno: data.serialno || false,
          pricing: data.pricing || false,
        });
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const [listTab, setListTab] = useState("Lot / Batch");
  useEffect(() => {
    if (!settings.lotno && settings.pricing) {
      setListTab("Pricing & Variants");
    }
  }, [settings.lotno, settings.pricing]);

  useEffect(() => {
    if (isEdit) return; // In edit mode, listTab is set by fetchProduct based on database
    if (settings.lotno) {
      setListTab("Lot / Batch");
    } else if (settings.pricing) {
      setListTab("Pricing & Variants");
    }
  }, [settings.lotno, settings.pricing, isEdit]);

  const isLotMode = isEdit ? productLotPricing : !!settings.lotno;
  const isVariantMode = isEdit ? !productLotPricing : !!settings.pricing;

  const fetchBrands = async () => {
    try {
      const res = await api.get("/api/brands/active-brands");
      const options = res.data.brands.map((brand) => ({
        value: brand._id,
        label: sanitizeInput(brand.brandName, true),
      }));
      setBrandOptions(options);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const handleBrandChange = (selectedOption) => {
    setSelectedBrands(selectedOption);
  };

  const [addserialpopup, setAddSerialPopup] = useState(false);
  const [currentVariantIndex, setCurrentVariantIndex] = useState(null);
  const [serialInput, setSerialInput] = useState("");

  const isValidSerial = (serial) => {
    const value = serial.trim();
    if (!value) return false;
    if (value.length < 3 || value.length > 50) return false;
    return /^[a-zA-Z0-9-_]+$/.test(value);
  };

  const handleBulkAddSerials = (input) => {
    if (!input || currentVariantIndex === null) return;

    const rawSerials = input
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setVariants((prev) => {
      const updated = [...prev];
      const variant = { ...updated[currentVariantIndex] };

      const existing = variant.serialNumbers || [];
      const merged = [...existing];

      rawSerials.forEach((serial) => {
        if (isValidSerial(serial) && !merged.includes(serial)) {
          merged.push(serial);
        }
      });

      variant.serialNumbers = merged;
      if (!isEdit) {                              // ✅ only in create mode
        variant.openingQuantity = merged.length;
      }
      variant.stockQuantity = merged.length;      // ✅ always update stock

      updated[currentVariantIndex] = variant;
      return updated;
    });
  };

  const handleAddSerial = () => {
    if (!serialInput.trim() || currentVariantIndex === null) return;
    handleBulkAddSerials(serialInput);
    setSerialInput(""); // ✅ clear single input
  };

  const handleRemoveSerial = (sIndex) => {
    setVariants((prev) => {
      const updated = [...prev];
      const variant = { ...updated[currentVariantIndex] };

      const serials = [...(variant.serialNumbers || [])];
      serials.splice(sIndex, 1);

      variant.serialNumbers = serials;
      if (!isEdit) {                              // ✅ only in create mode
        variant.openingQuantity = serials.length;
      }
      variant.stockQuantity = serials.length;     // ✅ always update stock

      updated[currentVariantIndex] = variant;
      return updated;
    });
  };

  const downloadCSVTemplate = () => {
    const csvContent =
      "serial\nABC123\nXYZ456\nPQR789\n";

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "serial_template.csv");

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const lotColumns = [
    { label: "Lot No.", editableValue: "12" },
    { label: "Lot MRP", editableValue: "₹ 2,367.08/-" },
    { label: "Fabric Batch No.", editableValue: "MO123" },
    { label: "Production Date", editableValue: "22/09/2023", opacity: 0.69 },
    { label: "Design Code", editableValue: "DC-0123" },
    { label: "Quantity", editableValue: "112" },
    { label: "Size", editableValue: "S, M, L, XL, XXL" },
    { label: "Color", editableValue: "Red, Green, Yellow", opacity: 0.83 },
  ];

  // Lot No. state (array for each column)
  const [lotData, setLotData] = useState(
    lotColumns.map((col) => ({
      ...col,
      label: col.label,
      editableValue: col.value,
    }))
  );

  const lotFieldKeys = [
    "lotNo",
    "lotmrp",
    "fabricBatchNo",
    "productionDate",
    "designCode",
    "quantity",
    "size",
    "color",
  ];

  const [lotDetails, setLotDetails] = useState({
    lotNo: "",
    lotmrp: "",
    fabricBatchNo: "",
    productionDate: "",
    designCode: "",
    quantity: "",
    size: "",
    color: "",
  });

  const validationPatterns = {
    productName: /^[A-Za-z0-9\s\-]{2,50}$/,
    price: /^\d+(\.\d{1,2})?$/,
    quantity: /^(?:[1-9]\d*)$/,
    description: /^.*$/,
    seoTitle: /^[a-zA-Z0-9\s\-]{2,60}$/,
    seoDescription: /^[a-zA-Z0-9\s\-,.]{2,160}$/,
    leadTime: /^\d{1,4}$/,
    reorderLevel: /^\d{1,6}$/,
    initialStock: /^\d{1,6}$/,
    serialNumber: /^[A-Z0-9\-]{1,50}$/,
    batchNumber: /^[A-Z0-9\-]{1,50}$/,
    discountValue: /^\d+(\.\d{1,2})?$/,
    categoryName: /^[A-Za-z\s]{2,50}$/,
    categorySlug: /^[a-z0-9\-]{2,50}$/,
    variantValue: /^[a-zA-Z0-9\s,]{1,100}$/,
  };

  const sanitizeInput = (value, preserveSpaces = false) => {
    if (typeof value !== "string") return value;
    let input = value;
    // Remove HTML tags
    input = input.replace(/<[^>]*>?/gm, "");
    // Normalize whitespace
    input = preserveSpaces
      ? input.replace(/\s+/g, " ")
      : input.trim().replace(/\s+/g, " ");
    // Remove dangerous characters (optional)
    input = input.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    // DOMPurify fallback for extra safety
    input = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
    return input;
  };

  const steps = [
    t("descriptionAndMedia"),
    t("pricing"),
    t("images"),
    t("variants"),
  ];

  const variantTabs = [
    t("color"),
    t("size"),
    t("expiry"),
    t("material"),
    t("model"),
    t("weight"),
    t("skinType"),
    t("packagingType"),
    t("flavour"),
  ];

  // const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(
    Array(steps.length).fill("pending")
  );
  const [activeTab, setActiveTab] = useState("Color");
  // const [images, setImages] = useState([]); // Removed unused global images
  // const variantImageInputRef = useRef(null); // Removed unused ref
  const objectUrlsRef = useRef([]);
  const [formErrors, setFormErrors] = useState({});
  const [variants, setVariants] = useState([
    { selectedVariant: "", selectedValue: "", valueDropdown: [] },
  ]);

  const inputChange = (key, value) => {
    // setFormData((prev) => ({ ...prev, [key]: value }));
    const sanitizedValue = sanitizeInput(value, true);
    const error = validateField(key, sanitizedValue);
    setFormErrors((prev) => ({ ...prev, [key]: error }));
    setFormData((prev) => ({ ...prev, [key]: sanitizedValue }));
  };

  useEffect(() => {
    return () => {
      // Cleanup object URLs
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const validateStep = () => {
    const newErrors = {};

    // Step 0: Basic Info
    if (!formData.productName)
      newErrors.productName = "Product Name is required";
    if (
      formData.productName &&
      !validationPatterns.productName.test(formData.productName)
    )
      newErrors.productName = "Invalid Product Name";
    if (!selectedCategory) newErrors.category = "Category is required";
    if (!selectedsubCategory)
      newErrors.subCategory = "Subcategory is required";
    if (!formData.store) newErrors.store = "Store is required";
    // if (!selectedWarehouse) newErrors.warehouse = "Warehouse is required";
    if (!selectedHSN) newErrors.hsn = "HSN Code is required";
    if (formData.itemType === "Good" && !selectedBrands)
      newErrors.brand = "Brand is required";
    if (formData.isAdvanced) {
      if (!formData.leadTime) newErrors.leadTime = "Lead Time is required";
      if (
        formData.leadTime &&
        !validationPatterns.leadTime.test(formData.leadTime)
      )
        newErrors.leadTime = "Invalid Lead Time";
      if (!formData.reorderLevel) newErrors.reorderLevel = "Reorder Level is required";
      if (
        formData.reorderLevel &&
        !validationPatterns.reorderLevel.test(formData.reorderLevel)
      )
        newErrors.reorderLevel = "Invalid Reorder Level";
      if (!formData.initialStock) newErrors.initialStock = "Initial Stock is required";
      if (
        formData.initialStock &&
        !validationPatterns.initialStock.test(formData.initialStock)
      )
        newErrors.initialStock = "Invalid Initial Stock format";
      if (formData.trackType === "serial" && !formData.serialNumber)
        newErrors.serialNumber = "Serial Number is required";
      if (
        formData.serialNumber &&
        !validationPatterns.serialNumber.test(formData.serialNumber)
      )
        newErrors.serialNumber = "Invalid Serial Number";
      if (formData.trackType === "batch" && !formData.batchNumber)
        newErrors.batchNumber = "Batch Number is required";
      if (
        formData.batchNumber &&
        !validationPatterns.batchNumber.test(formData.batchNumber)
      )
        newErrors.batchNumber = "Invalid Batch Number";
    }
    // Step 1: Pricing
    if (!formData.mrp) newErrors.purchasePrice = "Purchase Price is required";
    if (
      formData.mrp &&
      !validationPatterns.price.test(formData.mrp)
    )
      newErrors.purchasePrice = "Purchase Price must be a positive number with up to 2 decimal places";
    if (!formData.quantity) newErrors.quantity = "Quantity must be at least 1";
    if (
      formData.quantity &&
      !validationPatterns.quantity.test(formData.quantity)
    )
      newErrors.quantity = "Quantity atleast should be 1";
    if (!formData.tax) newErrors.sellingPrice = "Selling Price is required";
    if (
      formData.tax &&
      !validationPatterns.price.test(formData.tax)
    )
      newErrors.sellingPrice = "Selling Price must be a positive number with up to 2 decimal places";
    if (!formData.wholesalePrice)
      newErrors.wholesalePrice = "Wholesale Price must be a positive number with up to 2 decimal places";
    if (
      formData.wholesalePrice &&
      !validationPatterns.price.test(formData.wholesalePrice)
    )
      newErrors.wholesalePrice = "Wholesale Price is required";
    if (!formData.retailPrice) newErrors.retailPrice = "Retail Price must be a positive number with up to 2 decimal places";
    if (
      formData.retailPrice &&
      !validationPatterns.price.test(formData.retailPrice)
    )
      newErrors.retailPrice = "Retail Price is required";
    if (!selectedUnits) newErrors.unit = "Unit is required";
    if (!selectedSecondaryUnits) newErrors.secondaryUnit = "Secondary Unit is required";
    if (!formData.taxType) newErrors.taxType = "Tax Type is required";
    if (!formData.tax) newErrors.tax = "Tax Rate is required";
    if (!formData.discountType) newErrors.discountType = "Discount Type is required";
    if (!formData.discountValue) newErrors.discountValue = "Discount Value must be a positive number with up to 2 decimal places";
    if (
      formData.discountValue &&
      !validationPatterns.discountValue.test(formData.discountValue)
    )
      newErrors.discountValue = "Discount Value must be a positive number with up to 2 decimal places";

    // Description is optional; 30-word limit enforced in handleChange and controller
    if (
      formData.seoTitle &&
      !validationPatterns.seoTitle.test(formData.seoTitle)
    )
      newErrors.seoTitle = "Invalid SEO Title";
    if (
      formData.seoDescription &&
      !validationPatterns.seoDescription.test(formData.seoDescription)
    )
      newErrors.seoDescription = "Invalid SEO Description";
    // Optional: Add image validation if required
    // if (images.length === 0) newErrors.images = t("atLeastOneImageRequired");

    // Step 3: Variants
    const hasValidVariant = variants.some(
      (variant) => variant.selectedVariant && variant.selectedValue
    );
    if (!hasValidVariant) {
      newErrors.variants = "At least one variant with a valid value is required";
    }
    variants.forEach((variant, index) => {
      if (
        variant.selectedValue &&
        !validationPatterns.variantValue.test(variant.selectedValue)
      ) {
        newErrors[`variantValue_${index}`] = t("invalidVariantFormat");
      }
    });

    // Update formErrors state with new validation errors
    setFormErrors(newErrors);

    // Return array of error messages for toast notifications
    return Object.values(newErrors).filter(Boolean);
  };

  const handleNext = () => {
    const errors = validateStep();
    const updatedStatus = [...stepStatus];
    updatedStatus[step] = errors.length === 0 ? "complete" : "incomplete";
    setStepStatus(updatedStatus);

    if (errors.length === 0 && step < steps.length - 1) {
      setStep((prev) => prev + 1);
    } else if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
    }
  };
  const handlePrev = () => {
    if (step > 0) setStep((prev) => prev - 1);
  };

  const handleVariantImageChange = (index, event) => {
    const files = Array.from(event.target.files || []);
    const currentImages = variants[index]?.images || [];
    const currentExistingImages = variants[index]?.existingImages || [];

    if (currentImages.length + currentExistingImages.length + files.length > 6) {
      toast.error("Maximum 6 images allowed per variant");
      event.target.value = "";
      return;
    }

    const maxSize = 1 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = [];
    const invalidFiles = [];
    files.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        invalidFiles.push({
          file,
          error: `Invalid file type for ${file.name}. Only JPEG, PNG, or JPG allowed.`,
        });
      } else if (file.size > maxSize) {
        invalidFiles.push({
          file,
          error: `Image ${file.name} exceeds 1MB limit.`,
        });
      } else {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.push(url);
        validFiles.push(Object.assign(file, { preview: url }));
      }
    });
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ error }) => toast.error(error));
      setFormErrors((prev) => ({
        ...prev,
        [`variantImages_${index}`]: "Image size should not exceeded 1MB.",
      }));
    }
    if (validFiles.length > 0) {
      setVariants((prev) => {
        const updated = [...prev];
        const variant = { ...updated[index] };
        variant.images = [...(variant.images || []), ...validFiles];
        updated[index] = variant;
        return updated;
      });

      setFormErrors((prev) => ({ ...prev, [`variantImages_${index}`]: "" }));
    }
    event.target.value = "";
  };

  const handleRemoveExistingImage = async (file) => {
    if (file.public_id) {
      try {
        const res = await api.delete(`/api/products/${id}`, {
          data: { public_id: file.public_id },
        });
        setExistingImages(res.data.images || []);
        toast.success("Image removed successfully");
      } catch (error) {
        toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
      }
    } else {
      setExistingImages((prev) => prev.filter((f) => f !== file));
    }
  };

  const handleRemoveImage = (variantIndex, fileToRemove) => {
    setVariants((prev) => {
      const updated = [...prev];
      const variant = { ...updated[variantIndex] };
      if (fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      variant.images = (variant.images || []).filter((f) => f !== fileToRemove);
      updated[variantIndex] = variant;
      return updated;
    });
  };

  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedsubCategory, setSelectedsubCategory] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState(null);
  const [selectedSecondaryUnits, setSelectedSecondaryUnits] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [dropdownSearch, setDropdownSearch] = useState({
    category: "",
    subcategory: "",
    brand: "",
    hsn: "",
    unit: "",
    secondaryUnit: "",
    size: "",
    color: "",
    tax: "",
  });

  const [trackExpiry, setTrackExpiry] = useState(false);
  const [trackSerialNo, setTrackSerialNo] = useState(false);
  const [trackWarranty, setTrackWarranty] = useState(false);
  const [trackBatchNo, setTrackBatchNo] = useState(false);
  const [showWarrantyPopup, setShowWarrantyPopup] = useState(false);
  const [showBatchPopup, setShowBatchPopup] = useState(false);
  const [sameDetailsAsFirstVariant, setSameDetailsAsFirstVariant] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [, setSelectedSubcategory] = useState(null);
  const [unitsOptions, setUnitsOptions] = useState([]);
  const [taxOptions, setTaxOptions] = useState([]);
  const [sizesOptions, setSizesOptions] = useState([]);
  const [colorsOptions, setColorsOptions] = useState([]);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [showAddSizeModal, setShowAddSizeModal] = useState(false);
  const [showAddColorModal, setShowAddColorModal] = useState(false);

  const sortLatestFirst = (items) => {
    return [...items].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : (a?.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : (b?.updatedAt ? new Date(b.updatedAt).getTime() : 0);
      if (bTime !== aTime) return bTime - aTime;
      return String(b?._id || "").localeCompare(String(a?._id || ""));
    });
  };

  const updateDropdownSearch = (key, value) => {
    setDropdownSearch((prev) => ({ ...prev, [key]: value }));
  };

  const clearDropdownSearch = (key) => {
    setDropdownSearch((prev) => ({ ...prev, [key]: "" }));
  };

  const filterDropdownOptions = (options, key) => {
    const term = String(dropdownSearch[key] || "").trim().toLowerCase();
    if (!term) return options;
    return (options || []).filter((option) =>
      String(option?.label || option?.value || "")
        .toLowerCase()
        .includes(term)
    );
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get("/api/unit/units/status/active");
      let units = [];
      if (Array.isArray(res.data)) {
        units = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        units = res.data.data;
      } else if (res.data && Array.isArray(res.data.units)) {
        units = res.data.units;
      }

      const formatted = sortLatestFirst(units)
        .map((item) => ({
          value: item.unitsName || item.name || "",
          label: item.unitsName || item.name || "Unnamed Unit",
        }))
        .filter((item) => item.value);

      setUnitsOptions(formatted);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const fetchtaxs = async () => {
    try {
      const res = await api.get("/api/tax/active-tax");
      let tax = [];
      if (Array.isArray(res.data)) {
        tax = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        tax = res.data.data;
      } else if (res.data && Array.isArray(res.data.taxs)) {
        tax = res.data.taxs;
      }

      const formatted = sortLatestFirst(tax)
        .map((item) => ({
          value: item.taxRate || "",
          label: item.taxName + " - " + item.taxShortName + " - " + item.taxRate + "%" || "Unnamed Tax",
        }))
        .filter((item) => item.value);

      setTaxOptions(formatted);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const fetchSizes = async () => {
    try {
      const res = await api.get("/api/size/active-sizes");
      let sizes = [];
      if (Array.isArray(res.data)) {
        sizes = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        sizes = res.data.data;
      } else if (res.data && Array.isArray(res.data.sizes)) {
        sizes = res.data.sizes;
      }

      const formatted = sortLatestFirst(sizes)
        .map((item) => ({
          value: item.sizeName || item.name || "",
          label: item.sizeName || item.name || "Unnamed Size",
        }))
        .filter((item) => item.value);

      setSizesOptions(formatted);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const fetchColors = async () => {
    try {
      const res = await api.get("/api/color/active-color");
      let colors = [];
      if (Array.isArray(res.data)) {
        colors = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        colors = res.data.data;
      } else if (res.data && Array.isArray(res.data.colors)) {
        colors = res.data.colors;
      }

      const formatted = sortLatestFirst(colors)
        .map((item) => ({
          value: item.colorName || item.name || "",
          label: item.colorName || item.name || "Unnamed Color",
        }))
        .filter((item) => item.value);

      setColorsOptions(formatted);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  useEffect(() => {
    fetchUnits();
    fetchSizes();
    fetchColors();
    fetchtaxs();
  }, []);

  const [options, setOptions] = useState([]);
  const [optionsware, setOptionsWare] = useState([]);
  // const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  const [formData, setFormData] = useState({
    productName: "",
    itemBarcode: "",
    purchasePrice: "",
    mrp: "",
    modelNo: "",
    sellingPrice: "",
    tax: "",
    size: "",
    color: "",
    expiry: "",
    units: "",
    secondaryUnit: "",
    secondaryUnitQuantity: "",
    openingQuantity: "",
    stockQuantity: "",
    minStockToMaintain: "",
    discountType: "",
    discountValue: "",
    productType: "Single",
  });

  const [warrantyType, setWarrantyType] = useState("");
  const [warrantyPeriod, setWarrantyPeriod] = useState("");
  const [warrantyDetails, setWarrantyDetails] = useState({
    coverageScope: "",
    serviceMode: "",
    maxClaimsAllowed: "",
    inspectionRequired: false,
    warrantyStartsFrom: "",
    linkedto: "Manufacturer Warranty",
    extensionPeriod: "",
    coverageType: "",
    extendedWarrantyPrice: "",
    lifetimeDefination: "",
    coverageOf: "",
    whatNotCovered: "",
    maxClaims: "",
    replacementOnceOnly: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = sanitizeInput(value, true);
    if (name === "description") {
      const words = String(sanitizedValue).trim().split(/\s+/).filter(Boolean);
      if (words.length > 30) {
        sanitizedValue = words.slice(0, 30).join(" ");
      }
    }
    const error = validateField(name, sanitizedValue);
    setFormErrors((prev) => ({ ...prev, [name]: error }));

    // If switching itemType, reset fields specific to the other type
    if (name === "itemType") {
      if (value === "Service") {
        // Clear all Good-specific fields
        setFormData((prev) => ({
          ...prev,
          itemType: value,
          mrp: "",
          modelNo: "",
          wholesalePrice: "",
          retailPrice: "",
          quantity: "",
          unit: "",
          secondaryUnit: "",
          taxType: "",
          tax: "",
          discountType: "",
          discountValue: "",
          description: "",
          seoTitle: "",
          seoDescription: "",
          sellingType: "",
          barcodeSymbology: "",
          productType: "Single",
          isAdvanced: false,
          trackType: "serial",
          isReturnable: false,
          leadTime: "",
          reorderLevel: "",
          initialStock: "",
          serialNumber: "",
          batchNumber: "",
          returnable: false,
          expirationDate: "",
        }));
      } else if (value === "Good") {
        // Clear all Service-specific fields (if any in future)
        setFormData((prev) => ({
          ...prev,
          itemType: value,
          // Add service-specific fields here if needed
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    }
  };

  const handleVariantBarcodeChange = (variantIndex, rawValue) => {
    const digits = String(rawValue ?? "").replace(/\D/g, "").slice(0, 13);
    setVariants((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      if (!next[variantIndex]) return prev;
      next[variantIndex] = { ...next[variantIndex], barcode: digits };
      return next;
    });
    if (variantIndex === 0) {
      setFormData((prev) => ({ ...prev, itemBarcode: digits }));
      if (digits && digits.length < 13) {
        setFormErrors((prev) => ({ ...prev, itemBarcode: "Enter 13 digit code" }));
      } else {
        setFormErrors((prev) => ({ ...prev, itemBarcode: "" }));
      }
    }
  };

  const handleItemBarcodeChange = (e) => {
    const raw = e?.target?.value ?? "";
    handleVariantBarcodeChange(0, raw);
  };

  const getVariantKey = (sizeValue, colorValue) => `${String(sizeValue || "")}__${String(colorValue || "")}`;

  const applySameDetailsFromFirstVariant = (firstVariant, targetVariant) => {
    const base = firstVariant || {};
    const target = targetVariant || {};

    const {
      size,
      color,
      barcode,
      serialNumbers,
      images,
      existingImages,
      ...restTarget
    } = target;

    const {
      size: _bSize,
      color: _bColor,
      barcode: _bBarcode,
      serialNumbers: _bSerialNumbers,
      images: _bImages,
      existingImages: _bExistingImages,
      ...restBase
    } = base;

    return {
      ...restTarget,
      ...restBase,
      size,
      color,
      barcode,
      serialNumbers,
      images,
      existingImages,
    };
  };

  // Replace the variants useEffect with this:
  useEffect(() => {
    if (formData.productType !== "Variant") {
      setSelectedSizes((prev) => (prev.length > 0 ? [] : prev));
      setSelectedColors((prev) => (prev.length > 0 ? [] : prev));
      setVariants((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const first = list[0] || {};
        if (list.length === 1 && !first.size && !first.color) {
          return prev;
        }
        return [{ ...first, size: "", color: "" }];
      });
      return;
    }

    const sizes = (Array.isArray(selectedSizes) ? selectedSizes : [])
      .map((s) => s?.value)
      .filter(Boolean);
    const colors = (Array.isArray(selectedColors) ? selectedColors : [])
      .map((c) => c?.value)
      .filter(Boolean);

    const sizeValues = sizes.length > 0 ? sizes : [""];
    const colorValues = colors.length > 0 ? colors : [""];

    setVariants((prev) => {
      const prevList = Array.isArray(prev) ? prev : [];
      const first = prevList[0] || {};

      const existingByKey = new Map();
      prevList.forEach((v) => {
        existingByKey.set(getVariantKey(v?.size, v?.color), v);
      });

      const next = [];
      for (const s of sizeValues) {
        for (const c of colorValues) {
          const key = getVariantKey(s, c);
          const existing = existingByKey.get(key);
          if (existing) {
            next.push(sameDetailsAsFirstVariant ? applySameDetailsFromFirstVariant(first, existing) : existing);
          } else {
            next.push({
              ...first,
              size: s,
              color: c,
              barcode: "",         // placeholder, will be filled below
              serialNumbers: [],
              images: [],
              existingImages: [],
            });
          }
        }
      }
      return next;
    });
  }, [formData.productType, selectedSizes, selectedColors, sameDetailsAsFirstVariant]);

  // NEW: generate barcodes for any variant missing one
  const pendingBarcodeIndexes = useRef(new Set());

  useEffect(() => {
    if (formData.productType !== "Variant") return;

    const missingIndexes = variants
      .map((v, i) =>
        i > 0 && !String(v?.barcode || "").trim() && !pendingBarcodeIndexes.current.has(i)
          ? i
          : null
      )
      .filter((i) => i !== null);

    if (missingIndexes.length === 0) return;

    // Mark them as in-flight immediately so re-renders don't re-trigger
    missingIndexes.forEach((i) => pendingBarcodeIndexes.current.add(i));

    const generateForMissing = async () => {
      const updates = await Promise.all(
        missingIndexes.map(async (i) => {
          try {
            const res = await api.post("/api/products/generate-barcode", {});
            return { index: i, barcode: String(res?.data?.barcode || "").trim() };
          } catch {
            return { index: i, barcode: "" };
          }
        })
      );

      setVariants((prev) => {
        const next = [...prev];
        updates.forEach(({ index, barcode }) => {
          if (barcode && next[index]) {
            next[index] = { ...next[index], barcode };
          }
          // Whether it succeeded or failed, remove from pending
          pendingBarcodeIndexes.current.delete(index);
        });
        return next;
      });
    };

    generateForMissing();
  }, [variants.length, formData.productType]);

  const handleVariantChange = (index, field, value) => {
    setVariants((prev) => {
      const updatedVariants = Array.isArray(prev) ? [...prev] : [];
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
      return updatedVariants;
    });
  };

  const validateField = (name, value) => {
    if (
      !value &&
      [
        "productName",
        "quantity",
        "discountValue",
      ].includes(name)
    ) {
      return t("fieldRequired");
    }

    switch (name) {
      case "productName":
        return validationPatterns.productName.test(value)
          ? ""
          : t("invalidProductName");
      // case "itemBarcode":
      //   return validationPatterns.itemBarcode.test(value) ? "" : t("invalidBarcodeFormat");
      case "purchasePrice":
      case "sellingPrice":
      case "wholesalePrice":
      case "retailPrice":
        return validationPatterns.price.test(value)
          ? ""
          : t("invalidPriceFormat");
      case "quantity":
        return validationPatterns.quantity.test(value)
          ? ""
          : t("invalidQuantityFormat");
      case "description":
        // Enforce word limit; allow any characters otherwise
        if (!value) return "";
        const words = String(value).trim().split(/\s+/).filter(Boolean);
        return words.length <= 30 ? "" : "Description must be 30 words or fewer";
      case "seoTitle":
        return validationPatterns.seoTitle.test(value)
          ? ""
          : t("invalid SEO Title Format");
      case "seoDescription":
        return validationPatterns.seoDescription.test(value)
          ? ""
          : t("invalid SEO Description Format");
      case "leadTime":
        return validationPatterns.leadTime.test(value)
          ? ""
          : t("invalid Lead Time Format");
      case "reorderLevel":
        return validationPatterns.reorderLevel.test(value)
          ? ""
          : t("invalid Reorder Level Format");
      case "initialStock":
        return validationPatterns.initialStock.test(value)
          ? ""
          : t("invalid Initial Stock Format");
      case "serialNumber":
        return validationPatterns.serialNumber.test(value)
          ? ""
          : t("invalid Serial Number Format");
      case "batchNumber":
        return validationPatterns.batchNumber.test(value)
          ? ""
          : t("invalid Batch Number Format");
      case "discountValue":
        return validationPatterns.discountValue.test(value)
          ? ""
          : t("invalid Discount Value Format");
      case "variantValue":
        return validationPatterns.variantValue.test(value)
          ? ""
          : t("invalid Variant Format");
      default:
        return "";
    }
  };

  const validateCategoryName = (value) => {
    if (!value) {
      return "Category name is required";
    }
    // if (!nameRegex.test(value)) {
    //   return "Category Name Contains Letters Only.";
    // }
    return "";
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();

    let newErrors = {};

    const hasSelectedCategory = !!selectedCategory?.value;

    if (hasSelectedCategory && !categoryName.trim()) {
      if (!subCategoryName.trim()) {
        newErrors.subCategoryName = "Subcategory name is required";
      }
    } else {
      // Only validate categoryName when we're creating a new category
      const categoryError = validateCategoryName(categoryName);
      if (categoryError) {
        newErrors.categoryName = categoryError;
      }
    }

    // ❌ REMOVE THIS LINE — it was overwriting the conditional logic above
    // newErrors.categoryName = validateCategoryName(categoryName);

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);  // ← also make sure you setErrors BEFORE returning
      return;
    }

    setErrors(newErrors);

    try {
      if (hasSelectedCategory && !categoryName.trim() && subCategoryName.trim()) {
        await api.post(
          `/api/subcategory/categories/${selectedCategory.value}/subcategories`,
          { name: subCategoryName.trim() }
        );
        toast.success("Subcategory created successfully!");
      } else {
        await api.post("/api/category/categories", {
          categoryName: categoryName.trim(),
          subCategoryName: subCategoryName?.trim() || "",
        });
        toast.success("Category created successfully!");
      }

      setCategoryName("");
      setSubCategoryName("");
      setErrors({});
      fetchCategories();
      if (selectedCategory?.value) {
        await fetchSubcategoriesByCategory(selectedCategory.value);
      }
      setShowAddCategoryModel(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Error"
      );
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();

    if (!selectedCategory?.value) {
      toast.error("Please select a category first");
      return;
    }

    if (!subCategoryName.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    try {
      await api.post(
        `/api/subcategory/categories/${selectedCategory.value}/subcategories`,
        { name: subCategoryName.trim() }
      );
      toast.success("Subcategory created successfully!");
      setSubCategoryName("");
      await fetchSubcategoriesByCategory(selectedCategory.value);
      setShowAddSubCategoryModel(false);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/category/categories");
      const data = res.data;

      // Ensure only active categories
      const activeCategories = (Array.isArray(data) ? data : data?.categories || [])
        .filter(cat => cat.isDelete !== true);

      const options = activeCategories.map((category) => ({
        value: category._id,
        label: sanitizeInput(category.categoryName, true),
      }));

      setCategories(options);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  useEffect(() => {
    if (selectedCategory?.value) {
      fetchSubcategoriesByCategory(selectedCategory.value);
    } else {
      setSubcategories([]);
      setSelectedsubCategory(null); // ← Important!
    }
  }, [selectedCategory]);

  const fetchSubcategoriesByCategory = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }
    try {
      const res = await api.get(`/api/subcategory/by-category/${categoryId}`);
      const data = res.data;

      // Extra safety: filter client-side too
      const activeSubcats = (Array.isArray(data) ? data : data?.subcategories || [])
        .filter(sub => sub.isDelete !== true);

      const options = activeSubcats.map((subcat) => ({
        value: subcat._id,
        label: sanitizeInput(subcat.name, true),
      }));

      setSubcategories(options);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
      setSubcategories([]);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const subCategoryChange = (selectedOption) => {
    setSelectedsubCategory(selectedOption);
    // console.log("Selected subcategory:", selectedOption);
  };

  const validateFinalSubmit = () => {
    const newErrors = {};
    const emptyFields = [];

    // REQUIRED FIELDS ONLY (Global)
    if (!formData.productName) {
      newErrors.productName = "Product Name is required";
      emptyFields.push("variant_0_productName");
    }
    if (!selectedCategory && settings.category) {
      newErrors.category = "Category is required";
      emptyFields.push("variant_0_category");
    }
    if (!selectedsubCategory && settings.subcategory) {
      newErrors.subCategory = "Sub-category is required";
      emptyFields.push("variant_0_subCategory");
    }
    if (!selectedBrands && settings.brand) {
      newErrors.brand = "Brand is required";
      emptyFields.push("variant_0_brand");
    }
    if (!selectedHSN && settings.hsn) {
      newErrors.hsn = "HSN is required";
      emptyFields.push("variant_0_hsn");
    }
    if (settings.itembarcode && !/^\d{13}$/.test(String(formData.itemBarcode || ""))) {
      newErrors.itemBarcode = "Enter 13 digit code";
      emptyFields.push("variant_0_itemBarcode");
    }

    // Description: required when enabled in settings (highlight in both modes)
    if (settings.description && !formData.description) {
      newErrors.description = "Description is required";
      emptyFields.push("description");
    }
    if (settings.units && !selectedUnits) {
      newErrors.units = dualUnit ? "Primary Unit is required" : "Unit is required";
      emptyFields.push("variant_0_unit");
    }
    if (dualUnit && !selectedSecondaryUnits) {
      newErrors.secondaryUnit = "Secondary Unit is required";
      emptyFields.push("secondaryUnit");
    }
    if (dualUnit && Number(formData.secondaryUnitQuantity) <= 0) {
      newErrors.secondaryUnitQuantity = "Secondary unit quantity must be greater than 0";
      emptyFields.push("secondaryUnitQuantity");
    }

    // Determine Mode: validate against variants irrespective of current tab
    const isVariantMode = Array.isArray(variants) && variants.length > 0;

    // Normalize units in non-lot Pricing & Variants: apply top unit to all variants
    // if (!isLotMode && settings.units && isVariantMode) {
    //   const topUnit = variants?.[0]?.unit || "";
    //   if (topUnit) {
    //     const normalized = variants.map(v => ({ ...v, unit: v?.unit || topUnit }));
    //     const changed = normalized.some((v, i) => v.unit !== (variants[i]?.unit || ""));
    //     if (changed) setVariants(normalized);  // ← setState inside a function called during render/effect
    //   }
    // }

    if (isVariantMode) {
      // Validate Variants
      const checkVariants = (!isLotMode && settings.units && variants?.[0]?.unit)
        ? variants.map(v => ({ ...v, unit: v?.unit || variants[0].unit }))
        : variants;
      checkVariants.forEach((variant, index) => {
        if (isLotMode) {
          // Lot / Batch mode: these fields are required per lot
          if (settings.units && !variant.unit) {
            newErrors[`variant_${index}_unit`] = `Unit is required for variant ${index + 1}`;
            emptyFields.push(`variant_${index}_unit`);
          }
          if (!variant.purchasePrice || Number(variant.purchasePrice) < 1) {
            newErrors[`variant_${index}_purchasePrice`] = `Purchase Price must be at least 1 for variant ${index + 1}`;
            emptyFields.push(`variant_${index}_purchasePrice`);
          }
          if (!variant.sellingPrice || Number(variant.sellingPrice) < 1) {
            newErrors[`variant_${index}_sellingPrice`] = `Selling Price must be at least 1 for variant ${index + 1}`;
            emptyFields.push(`variant_${index}_sellingPrice`);
          }
          // In Lot / Batch, Opening Quantity must be >= 1 (0 should highlight)
          // if (variant.openingQuantity === undefined || variant.openingQuantity === "" || Number(variant.openingQuantity) < 1) {
          //   newErrors[`variant_${index}_openingQuantity`] = `Opening Quantity must be at least 1 for variant ${index + 1}`;
          //   emptyFields.push(`variant_${index}_openingQuantity`);
          // }
          // lotNumber is required when Lot No. feature is enabled
          // if (!variant.lotNumber) {
          //   newErrors[`variant_${index}_lotNumber`] = `Lot Number is required for variant ${index + 1}`;
          //   emptyFields.push(`variant_${index}_lotNumber`);
          // }
          // if (variant.minStockToMaintain === undefined || variant.minStockToMaintain === "" || Number(variant.minStockToMaintain) < 1) {
          //   newErrors[`variant_${index}_minStockToMaintain`] = `Minimum stock must be at least 1 for variant ${index + 1}`;
          //   emptyFields.push(`variant_${index}_minStockToMaintain`);
          // }
          // Enforce serial numbers when serial tracking is enabled
          // if (settings.serialno) {
          //   if (!variant.serialNumbers || variant.serialNumbers.length === 0) {
          //     newErrors[`variant_${index}_serialNumber`] = `Serial Number is required for variant ${index + 1}`;
          //     emptyFields.push(`variant_${index}_serialNumber`);
          //   }
          // }
        } else {
          // Pricing & Variants flow
          if (formData.productType === "Variant" && !variant.size) {
            newErrors[`variant_${index}_size`] = `Size is required for variant ${index + 1}`;
            emptyFields.push(`variant_${index}_size`);
          }
          if (formData.productType === "Variant" && !variant.color) {
            newErrors[`variant_${index}_color`] = `Color is required for variant ${index + 1}`;
            emptyFields.push(`variant_${index}_color`);
          }
          if (!variant.purchasePrice || Number(variant.purchasePrice) < 1) {
            newErrors[`variant_${index}_purchasePrice`] = `Purchase Price must be at least 1 for variant ${index + 1}`;
            emptyFields.push(`variant_${index}_purchasePrice`);
          }
          // MRP requirement only in Pricing & Variants section
          if (listTab === "Pricing & Variants") {
            if (variant.mrp === undefined || variant.mrp === "" || Number(variant.mrp) < 0) {
              newErrors[`variant_${index}_mrp`] = `MRP is required for variant ${index + 1}`;
              emptyFields.push(`variant_${index}_mrp`);
            }
          } else {
            // Outside Pricing & Variants: MRP optional but if provided must be >= 0
            if (variant.mrp !== undefined && variant.mrp !== "" && Number(variant.mrp) < 0) {
              newErrors[`variant_${index}_mrp`] = `MRP must be at least 0 for variant ${index + 1}`;
              emptyFields.push(`variant_${index}_mrp`);
            }
          }
          if (!variant.sellingPrice || Number(variant.sellingPrice) < 1) {
            newErrors[`variant_${index}_sellingPrice`] = `Selling Price must be at least 1 for variant ${index + 1}`;
            emptyFields.push(`variant_${index}_sellingPrice`);
          }
          if (settings.units && !variant.unit) {
            newErrors[`variant_${index}_unit`] = `Unit is required for variant ${index + 1}`;
            emptyFields.push(`variant_${index}_unit`);
          }
          // Opening Quantity required (>= 0 is acceptable here, but must be provided)
          // if (variant.openingQuantity === undefined || variant.openingQuantity === "" || Number(variant.openingQuantity) < 0) {
          //   newErrors[`variant_${index}_openingQuantity`] = `Opening Quantity is required for variant ${index + 1}`;
          //   emptyFields.push(`variant_${index}_openingQuantity`);
          // }
          // Min. Stock to Maintain - required on Pricing & Variants; otherwise optional >= 0
          if (listTab === "Pricing & Variants") {
            // if (variant.minStockToMaintain === undefined || variant.minStockToMaintain === "" || Number(variant.minStockToMaintain) < 0) {
            //   newErrors[`variant_${index}_minStockToMaintain`] = `Minimum stock is required for variant ${index + 1}`;
            //   emptyFields.push(`variant_${index}_minStockToMaintain`);
            // }
          } else {
            // if (variant.minStockToMaintain === undefined || variant.minStockToMaintain === "" || Number(variant.minStockToMaintain) < 1) {
            //   newErrors[`variant_${index}_minStockToMaintain`] = `Minimum stock must be at least 1 for variant ${index + 1}`;
            //   emptyFields.push(`variant_${index}_minStockToMaintain`);
            // }
          }
        }
      });
    } else {
      // Validate Main Form Fields (Single Product)
      const mainVariant = variants[0] || {};
      if (isLotMode) {
        if (settings.units && !mainVariant.unit) {
          newErrors.units = "Unit is required";
          emptyFields.push("variant_0_unit");
        }
        if (!mainVariant.secondaryUnit) {
          newErrors.secondaryUnit = "Secondary Unit is required";
          emptyFields.push("variant_0_secondaryUnit");
        }
        if (!mainVariant.purchasePrice || Number(mainVariant.purchasePrice) < 1) {
          newErrors.purchasePrice = "Purchase Price must be at least 1";
          emptyFields.push("variant_0_purchasePrice");
        }
        if (!mainVariant.sellingPrice || Number(mainVariant.sellingPrice) < 1) {
          newErrors.sellingPrice = "Selling Price must be at least 1";
          emptyFields.push("variant_0_sellingPrice");
        }
        // if (mainVariant.openingQuantity === undefined || mainVariant.openingQuantity === "" || Number(mainVariant.openingQuantity) < 1) {
        //   newErrors.openingQuantity = "Opening Quantity must be at least 1";
        //   emptyFields.push("variant_0_openingQuantity");
        // }
      } else {
        if (!mainVariant.purchasePrice || Number(mainVariant.purchasePrice) < 1) {
          newErrors.purchasePrice = "Purchase Price must be at least 1";
          emptyFields.push("variant_0_purchasePrice");
        }
        // MRP is not required by model
        if (mainVariant.mrp !== undefined && mainVariant.mrp !== "" && Number(mainVariant.mrp) < 0) {
          newErrors.mrp = "MRP must be at least 0";
          emptyFields.push("variant_0_mrp");
        }
        if (!mainVariant.sellingPrice || Number(mainVariant.sellingPrice) < 1) {
          newErrors.sellingPrice = "Selling Price must be at least 1";
          emptyFields.push("variant_0_sellingPrice");
        }
      }

      // lotNumber is required if Lot No. feature is enabled
      if (isLotMode && !mainVariant.lotNumber) {
        newErrors.lotNumber = "Lot Number is required";
        emptyFields.push("variant_0_lotNumber");
      }

      if (!isLotMode && formData.productType === "Variant" && !mainVariant.size) {
        newErrors.size = "Size is required";
        emptyFields.push("variant_0_size");
      }
      if (!isLotMode && formData.productType === "Variant" && !mainVariant.color) {
        newErrors.color = "Color is required";
        emptyFields.push("variant_0_color");
      }
      if (!isLotMode && settings.units && !mainVariant.unit) {
        newErrors.units = "Unit is required";
        emptyFields.push("variant_0_unit");
      }
      if (!isLotMode) {
        const openingQtyMissing = (mainVariant.openingQuantity === undefined || mainVariant.openingQuantity === "" || Number(mainVariant.openingQuantity) < 0);
        // if (openingQtyMissing) {
        //   newErrors.openingQuantity = "Opening Quantity is required";
        //   emptyFields.push("variant_0_openingQuantity");
        // }
        // Min. Stock to Maintain - required on Pricing & Variants; otherwise optional >= 0
        if (listTab === "Pricing & Variants") {
          // if (mainVariant.minStockToMaintain === undefined || mainVariant.minStockToMaintain === "" || Number(mainVariant.minStockToMaintain) < 0) {
          //   newErrors.minStockToMaintain = "Minimum stock is required";
          //   emptyFields.push("variant_0_minStockToMaintain");
          // }
        } else {
          // if (mainVariant.minStockToMaintain !== undefined && mainVariant.minStockToMaintain !== "" && Number(mainVariant.minStockToMaintain) < 0) {
          //   newErrors.minStockToMaintain = "Minimum stock must be at least 0";
          //   emptyFields.push("variant_0_minStockToMaintain");
          // }
        }
      }
      // Enforce serial numbers when Lot/Batch is enabled (single product)
      if (isLotMode) {
        if (!mainVariant.serialNumbers || mainVariant.serialNumbers.length === 0) {
          newErrors.serialNumber = "Serial Number is required";
          emptyFields.push("variant_0_serialNumber");
        }
      }
    }

    setHighlightedFields(emptyFields);
    try {
      // console.groupCollapsed("ProductCreate: Missing required fields");
      // console.log("mode", isLotMode ? "lot" : "non-lot");
      // console.log("tab", listTab);
      // console.log("missingKeys", emptyFields);
      // console.log("errorMap", newErrors);
      // console.groupEnd();
    } catch (_) { }
    setFormErrors(newErrors);
    return Object.values(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSave(true);

    const errors = validateFinalSubmit();

    if (errors.length > 0) {
      try {
        console.warn("Product Create: Required fields missing", errors);
      } catch (_) { }
      toast.error("Please fill all the required fields");
      setSave(false);
      return;
    }

    const formPayload = new FormData();

    formPayload.append("productName", sanitizeInput(formData.productName, true));
    if (settings.description) {
      const desc = Array.isArray(formData.description) ? "" : String(formData.description || "");
      formPayload.append("description", sanitizeInput(desc, true));
    }

    const lotPricingFlag = isEdit ? productLotPricing : !!settings.lotno;
    formPayload.append("lot_pricing", lotPricingFlag);
    formPayload.append("checkedExpiry", trackExpiry ? "true" : "false");
    formPayload.append("checkedSerial", trackSerialNo ? "true" : "false");
    formPayload.append("checkedBatch", trackBatchNo ? "true" : "false");
    formPayload.append("checkedWarranty", trackWarranty ? "true" : "false");
    formPayload.append("productType", formData.productType);
    formPayload.append("dualUnit", dualUnit ? "true" : "false");
    formPayload.append("secondaryUnit", dualUnit ? (selectedSecondaryUnits?.value || "") : "");
    formPayload.append("secondaryUnitQuantity", dualUnit ? (formData.secondaryUnitQuantity || 0) : 0);

    const mainVariant = variants[0] || {};

    formPayload.append("mrp", mainVariant.mrp || 0);
    formPayload.append("modelNo", mainVariant.modelNo || "");
    if (settings.brand) formPayload.append("brand", selectedBrands?.value || "");
    if (settings.category) formPayload.append("category", selectedCategory?.value || "");
    if (settings.subcategory) formPayload.append("subCategory", selectedsubCategory?.value || "");
    if (settings.hsn && selectedHSN?.value) {
      formPayload.append("hsn", selectedHSN.value);
    }
    if (settings.itembarcode) formPayload.append("itemBarcode", formData.itemBarcode || "");

    // Normalize unit from first variant into all variants for payload only (no setVariants)
    const topUnit = variants[0]?.unit || "";
    const normalizedVariants = (!isLotMode && settings.units && topUnit)
      ? variants.map(v => ({ ...v, unit: v?.unit || topUnit }))
      : variants;

    const variantsPayload = normalizedVariants.map((v, index) => {
      const originalVariant = originalVariants[index];

      return {
        ...v,
        barcode:
          isEdit
            ? (v.barcode?.trim() || originalVariant?.barcode || "")
            : (v.barcode?.trim() || ""),
        imageCount: v.images?.length || 0,
        images: v.existingImages || [],
        lotNumber: v.lotNumber || "",
        lot_pricing: lotPricingFlag,
        manufacturingDate: v.manufacturingDate || "",
        expiryDate: v.expiryDate || "",
      };
    });

    formPayload.append("variants", JSON.stringify(variantsPayload));

    const allImages = variants.flatMap(v => v.images || []);
    allImages.forEach((img) => formPayload.append("images", img));

    if (isEdit) {
      formPayload.append("existingImages", JSON.stringify(existingImages));
    }

    formPayload.append(
      "lotDetails",
      JSON.stringify({
        lotNo: lotDetails.lotNo,
        lotmrp: lotDetails.lotmrp,
        fabricBatchNo: lotDetails.fabricBatchNo,
        productionDate: lotDetails.productionDate || null,
        designCode: lotDetails.designCode,
        quantity: lotDetails.quantity,
        size: lotDetails.size,
        color: lotDetails.color,
      })
    );

    try {
      if (isEdit) {
        await api.put(`/api/products/${id}`, formPayload);
        toast.success("Product updated successfully");
      } else {
        await api.post("/api/products/create", formPayload);
        toast.success("Product created successfully");
      }
      navigate("/product");
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    } finally {
      setSave(false);
    }
  };

  // useEffect(() => {
  //   const fetchWarehouses = async () => {
  //     try {
  //       const res = await api.get("/api/warehouse/active");
  //       if (res.data.success) {

  //         const formatted = res.data.data.map((wh) => ({
  //           value: wh._id,
  //           label: sanitizeInput(wh.warehouseName, true),
  //         }));
  //         setOptionsWare(formatted);
  //       }
  //     } catch (error) {
  //       toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchWarehouses();
  // }, []);

  useEffect(() => {
    // Create mode only
    if (!id) {
      generateBarcodeOnLoad();
    }
  }, [id]);

  const generateBarcodeOnLoad = async () => {
    try {
      const res = await api.post("/api/products/generate-barcode");

      if (res.status === 200 && res.data.barcode) {
        const code = String(res.data.barcode).trim();
        setFormData((prev) => ({
          ...prev,
          itemBarcode: code,
        }));
        setVariants((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          if (!next[0]) return prev;
          next[0] = { ...next[0], barcode: code };
          return next;
        });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to generate barcode"
      );
    }
  };

  const handleGenerateBarcode = async (variantIndex = 0) => {
    try {
      const variantId = variants?.[variantIndex]?._id
        ? String(variants[variantIndex]._id)
        : null;

      const body = isEdit
        ? (variantId ? { productId: id, variantId } : { productId: id })
        : {};

      const res = await api.post("/api/products/generate-barcode", body);

      if (res.status === 200 && res.data.barcode) {
        const code = String(res.data.barcode).trim();

        setVariants((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          if (!next[variantIndex]) return prev;
          next[variantIndex] = { ...next[variantIndex], barcode: code };
          return next;
        });

        if (variantIndex === 0) {
          setFormData((prev) => ({ ...prev, itemBarcode: code }));
          setFormErrors((prev) => ({ ...prev, itemBarcode: "" }));
        }

        toast.success("Barcode generated successfully!");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Error"
      );
    }
  };

  const handleAddNewVariant = async () => {
    const newIndex = Array.isArray(variants) ? variants.length : 0;
    setVariants((prev) => [...(Array.isArray(prev) ? prev : []), { images: [], existingImages: [], barcode: "" }]);
    try {
      const res = await api.post("/api/products/generate-barcode", {});
      const code = String(res?.data?.barcode || "").trim();
      if (!code) return;
      setVariants((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        if (!next[newIndex]) return prev;
        next[newIndex] = { ...next[newIndex], barcode: code };
        return next;
      });
    } catch (error) { }
  };

  // const handleWarehouseChange = (selectedOption) => {
  //   setSelectedWarehouse(selectedOption);
  // };

  const [allOptionsHsn, setAllOptionsHsn] = useState([]);
  const [selectedHSN, setSelectedHSN] = useState(null);
  // const [showAddHSNModel, setShowAddHSNModel] = useState(false);
  const [hsnModalData, setHsnModalData] = useState({ hsnCode: "", description: "", gstRate: "", id: null });
  const [hsnErrors, setHsnErrors] = useState({});
  const [allHsnOptions, setAllHsnOptions] = useState([]); // original
  const [optionsHsn, setOptionsHsn] = useState([]); // filtered

  const fetchHSN = async () => {
    try {
      const res = await api.get("/api/hsn/all");
      if (res.data.success) {
        const formatted = res.data.data.map((item) => ({
          value: item._id,
          label: sanitizeInput(
            `${item.hsnCode} - ${item.description || ""}`,
            // `${item.hsnCode} - ${item.description || ""} - ${item.gstRate || ""}%`,
            true
          ),
          description: item.description || "",
        }));
        setAllHsnOptions(formatted);
        setOptionsHsn(formatted);
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHSN();
  }, []);

  useEffect(() => {
    const normalize = (str) => str?.toLowerCase().trim() || "";

    if (!selectedCategory && !selectedsubCategory) {
      setOptionsHsn(allHsnOptions);
      return;
    }

    let categoryFiltered = [...allHsnOptions];
    let finalFiltered = [];

    // Step 1: Filter by category
    if (selectedCategory) {
      const categoryName = normalize(selectedCategory.label);

      categoryFiltered = categoryFiltered.filter((hsn) =>
        normalize(hsn.description).includes(categoryName)
      );
    }

    // Step 2: If subcategory selected → try filtering
    if (selectedsubCategory) {
      const subCategoryName = normalize(selectedsubCategory.label);

      const subFiltered = categoryFiltered.filter((hsn) =>
        normalize(hsn.description).includes(subCategoryName)
      );

      // ✅ KEY LOGIC (fallback)
      if (subFiltered.length > 0) {
        finalFiltered = subFiltered;
      } else {
        finalFiltered = categoryFiltered; // fallback to category
      }
    } else {
      finalFiltered = categoryFiltered;
    }

    setOptionsHsn(finalFiltered);
  }, [selectedCategory, selectedsubCategory, allHsnOptions]);

  const handleHSNChange = (selectedOption) => {
    setSelectedHSN(selectedOption);
  };

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isEdit && isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    setSelectedHSN(null);
  }, [selectedCategory, selectedsubCategory]);

  const toggleUnitDropdown = (e, index = null) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    });

    if (index === null) {
      setDropDownUnit(!dropdownUnit);
    } else {
      setDropDownUnitIndex(dropdownUnitIndex === index ? null : index);
    }
  };

  const toggleSecondaryUnitDropdown = (e, index = null) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    });

    if (index === null) {
      setDropDownSecondaryUnit(!dropdownSecondaryUnit);
    } else {
      setDropDownSecondaryUnitIndex(dropdownSecondaryUnitIndex === index ? null : index);
    }
  };

  const toggleTaxDropdown = (e, index = null) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    });

    if (index === null) {
      setDropDownTaxIndex(!dropdownTaxIndex);
    } else {
      setDropDownTaxIndex(dropdownTaxIndex === index ? null : index);
    }
  };

  const toggleSizeDropdown = (e, index = null) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    });

    if (index === null) {
      setDropDownSizeIndex(!dropdownSizeIndex);
    } else {
      setDropDownSizeIndex(dropdownSizeIndex === index ? null : index);
    }
  };

  const toggleColorDropdown = (e, index = null) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    });

    if (index === null) {
      setDropDownColorIndex(!dropdownColor);
    } else {
      setDropDownColorIndex(dropdownColorIndex === index ? null : index);
    }
  };

  const handleUnitChange = (selectedOption, index = null) => {
    const unitValue = selectedOption ? selectedOption.value : "";

    if (index === null) {
      // Apply to all variants (initial unit selection)
      setSelectedUnits(selectedOption);
      setVariants((prev) => {
        const updated = prev.map((v) => ({ ...v, unit: unitValue }));
        return updated;
      });
    } else {
      // Apply to specific variant row
      setVariants((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], unit: unitValue };
        return updated;
      });
    }
  };

  const openWarrantyPopup = (index) => {
    const variant = variants[index] || {};
    setCurrentVariantIndex(index);
    setWarrantyType(variant.warrantyType || "");
    setWarrantyPeriod(variant.warrantyPeriod || "");
    setWarrantyDetails({
      coverageScope: variant.coverageScope || "",
      serviceMode: variant.serviceMode || "",
      maxClaimsAllowed: variant.maxClaimsAllowed || "",
      inspectionRequired: variant.inspectionRequired === true || variant.inspectionRequired === "Yes" ? "Yes" : "No",
      warrantyStartsFrom: variant.warrantyStartsFrom || "",
      linkedto: variant.linkedto || "Manufacturer Warranty",
      extensionPeriod: variant.extensionPeriod || "",
      coverageType: variant.coverageType || "",
      extendedWarrantyPrice: variant.extendedWarrantyPrice || "",
      lifetimeDefination: variant.lifetimeDefination || "",
      coverageOf: variant.coverageOf || "",
      whatNotCovered: variant.whatNotCovered || "",
      maxClaims: variant.maxClaims || "",
      replacementOnceOnly: variant.replacementOnceOnly === true || variant.replacementOnceOnly === "Yes" ? "Yes" : "No",
    });
    setShowWarrantyPopup(true);
  };

  const saveWarrantyDetails = () => {
    if (currentVariantIndex === null) return;
    setVariants((prev) => {
      const next = [...prev];
      next[currentVariantIndex] = {
        ...next[currentVariantIndex],
        warrantyType,
        warrantyPeriod,
        ...warrantyDetails,
      };
      return next;
    });
    setShowWarrantyPopup(false);
  };

  const handleSecondaryUnitChange = (selectedOption) => {
    setSelectedSecondaryUnits(selectedOption);
    setFormErrors((prev) => ({ ...prev, secondaryUnit: "" }));
  };

  const handleTaxChange = (selectedOption, index = null) => {
    const taxValue = selectedOption ? selectedOption.value : "";

    if (index === null) {
      // Apply to all variants (initial tax selection)
      setSelectedTax(selectedOption);
      setVariants((prev) => {
        const updated = prev.map((v) => ({ ...v, tax: taxValue }));
        return updated;
      });
    } else {
      // Apply to specific variant row
      setVariants((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], tax: taxValue };
        return updated;
      });
    }
  };

  const handleSizeChange = (selectedOption, index = null) => {
    const sizeValue = selectedOption ? selectedOption.value : "";

    if (index === null) {
      setSelectedSizes(selectedOption ? [selectedOption] : []);
      setVariants((prev) => {
        const updated = prev.map((v) => ({ ...v, size: sizeValue }));
        return updated;
      });
    } else {
      // Apply to specific variant row
      setVariants((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], size: sizeValue };
        return updated;
      });
    }
  };

  const handleColorChange = (selectedOption, index = null) => {
    const colorValue = selectedOption ? selectedOption.value : "";

    if (index === null) {
      setSelectedColors(selectedOption ? [selectedOption] : []);
      setVariants((prev) => {
        const updated = prev.map((v) => ({ ...v, color: colorValue }));
        return updated;
      });
    } else {
      // Apply to specific variant row
      setVariants((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], color: colorValue };
        return updated;
      });
    }
  };

  const handleHSNModalSubmit = async (e) => {
    if (e) e.preventDefault();
    let newErrors = {};
    const { hsnCode, description, gstRate } = hsnModalData;

    const hsnRegex = /^[0-9]{2,8}$/;

    if (!hsnCode || !hsnCode.trim()) {
      newErrors.hsnCode = "HSN code is required";
    } else if (!hsnRegex.test(hsnCode.trim())) {
      newErrors.hsnCode = "HSN code must be 2-8 digits";
    }

    if (!description || !description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!gstRate || !gstRate.trim()) {
      newErrors.gstRate = "GST rate is required";
    }

    if (gstRate < 0 || gstRate > 100) {
      newErrors.gstRate = "GST rate must be between 0 and 100";
    }

    if (Object.keys(newErrors).length > 0) {
      setHsnErrors(newErrors);
      // toast.error("Please fix the validation errors");
      return;
    }

    setHsnErrors({});

    try {
      const cleanhsnCode = sanitizeInput(hsnCode.trim());
      const cleanhsnDescription = sanitizeInput(description.trim());

      await api.post(`/api/hsn`, {
        hsnCode: cleanhsnCode,
        description: cleanhsnDescription,
        gstRate: gstRate
      });

      toast.success("HSN created successfully!");
      setHsnModalData({ hsnCode: '', description: '', id: null });
      setHsnErrors({});
      setShowAddHSNModel(false);
      await fetchHSN();
    } catch (err) {
      if (err.response?.status === 409) {
        setHsnErrors({ hsnCode: "HSN code already exists" });
      } else {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to save HSN");
      }
    }
  };

  const filteredCategories = filterDropdownOptions(categories, "category");
  const filteredSubcategories = filterDropdownOptions(subcategories, "subcategory");
  const filteredBrands = filterDropdownOptions(brandOptions, "brand");
  const filteredHsns = filterDropdownOptions(optionsHsn, "hsn");
  const filteredUnits = filterDropdownOptions(unitsOptions, "unit");
  const filteredSizes = filterDropdownOptions(sizesOptions, "size");
  const filteredColors = filterDropdownOptions(colorsOptions, "color");
  const filteredTaxes = filterDropdownOptions(taxOptions, "tax");

  return (
    <div className="p-4" style={{ height: "100vh" }}>
      {/* back, header, view style */}
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
        {/* Title + Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,

          }}
        >
          {/* Icon Container */}
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
            }}
          >
            {/* Icon (placeholder) */}
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              // fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
        </div>
        <div>
          {!isEdit && (
            <div
              style={{
                padding: "6px 10px",
                background: "#1F7FFF",
                color: "white",
                fontSize: "16px",
                fontWeight: "400",
                border: "none",
                borderRadius: "12px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                textDecoration: "none",
                boxShadow:
                  "0 8px 20px rgba(31, 127, 255, 0.3), inset -1px -1px 6px rgba(0,0,0,0.2)",
                transition: "all 0.3s ease",
              }}
            >
              <img
                src={AiLogo}
                alt="Ai Logo"
                style={{ filter: "grayscale(100%) brightness(500%)" }}
              />
              Add With AI
              <MdLockOutline style={{ fontSize: "20px" }} />
            </div>
          )}
        </div>
      </div>

      {/* body */}
      <div>
        <form onSubmit={handleSubmit} >
          <div
            style={{
              width: "100%",
              padding: "16px 0px 16px 16px",
              background: "var(--White, white)",
              borderRadius: "16px",
              border: "1px var(--Stroke, #EAEAEA) solid",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: "24px",
              display: "flex",
              overflowX: 'auto',
              overflowY: "auto",
              maxHeight: "calc(100vh - 200px)",
              position: 'relative'
            }}
          >
            <div style={{
              width: "100%",
              background: "var(--White, white)",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: "24px",
              display: "flex",
              overflowX: 'auto',
              overflowY: "auto",
              height: '100vh',
              position: 'relative'
            }}
            >
              {/* General Details */}
              <div style={{
                width: "99%",
                borderBottom: '1px solid #EAEAEA',
                paddingBottom: '24px'
              }}>
                {/* heading */}
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    display: 'flex',
                    alignItems: 'center',
                    gap: '28px'
                  }}
                >
                  <span>General Details</span>
                  {!isEdit && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="productType" value="Single" checked={formData.productType === "Single"} onChange={handleChange} />
                      <span>Single</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="radio" name="productType" value="Variant" checked={formData.productType === "Variant"} onChange={handleChange} />
                      <span>Variant</span>
                    </div>
                  </div>}
                </div>

                {/* input fields */}
                <div
                  style={{
                    rowGap: "20px",
                    columnGap: '50px',
                    width: "100%",
                    marginTop: "16px",
                    display: "flex",
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Product Name */}
                  <div
                    style={{
                      width: "22%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--Black-Grey, #727681)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        Product Name <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                      </span>

                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: (highlightedFields.includes("productName") || highlightedFields.includes("variant_0_productName")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <input
                        type="text"
                        name="productName"
                        placeholder="Enter Name"
                        value={formData.productName}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* category + sub-category */}
                  {settings.category && <div style={{
                    width: "22%",
                    display: 'flex',
                    gap: '16px',
                  }}
                  >
                    {/* category */}
                    <div
                      style={{
                        width: settings.subcategory === true ? "50%" : "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Category <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                        </span>
                      </div>
                      <div
                        ref={dropdownRef}
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: (highlightedFields.includes("category") || highlightedFields.includes("variant_0_category")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                          <input
                            type="text"
                            value={dropdown ? dropdownSearch.category : (selectedCategory?.label || "")}
                            placeholder="Select"
                            readOnly={!dropdown}
                            onFocus={() => {
                              if (!dropdown) {
                                setDropDown(true);
                                clearDropdownSearch("category");
                              }
                            }}
                            onChange={(e) => updateDropdownSearch("category", e.target.value)}
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                              outline: "none",
                            }}
                          />
                        </div>

                        {!dropdown && <div
                          onClick={() => setDropDown(true)}>
                          <IoIosArrowDown />
                        </div>}
                        {dropdown && <div
                          onClick={() => setDropDown(false)}>
                          <IoIosArrowUp />
                        </div>}

                        {dropdown && <div style={{
                          position: 'absolute',
                          top: '40px',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #E1E1E1',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          // height: 'auto',
                          maxHeight: '365px',
                          width: '100%',
                          // overflowY: 'auto',
                          zIndex: 1000
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '325px', height: 'auto' }}>

                            {/* mapping of categories */}
                            <div
                              className="button-hover"
                              style={{
                                display: 'flex',
                                justifyContent: 'start',
                                alignItems: 'center',
                                width: '100%',
                                padding: '5px 14px',
                                borderBottom: "1px solid #E1E1E1",
                              }}>
                              <label
                                onClick={() => {
                                  setSelectedCategory(null);
                                  setDropDown(false);
                                  clearDropdownSearch("category");
                                  setSelectedsubCategory(null);
                                  setFormErrors((prev) => ({ ...prev, category: "" }));
                                }}
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: 'pointer',
                                  fontStyle: 'italic',
                                  width: '100%'
                                }}
                              >
                                Unselect
                              </label>
                            </div>

                            {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                              <input
                                type="text"
                                value={dropdownSearch.category}
                                onChange={(e) => updateDropdownSearch("category", e.target.value)}
                                placeholder="Search category"
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  border: "1px solid #E1E1E1",
                                  borderRadius: "6px",
                                  padding: "0 10px",
                                  outline: "none",
                                  fontSize: "13px",
                                }}
                              />
                            </div> */}

                            {filteredCategories.length === 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "10px 0",
                                }}
                              >
                                No Category found
                              </div>
                            ) : filteredCategories.map((cat) => (
                              <div key={cat.value}
                                className="button-hover"
                                style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', padding: '5px 14px', }}>
                                <label
                                  onClick={() => {
                                    setSelectedCategory(cat);
                                    setDropDown(false);
                                    clearDropdownSearch("category");
                                    setSelectedsubCategory(null);
                                    setFormErrors((prev) => ({ ...prev, category: "" }));
                                    fetchSubcategoriesByCategory(cat.value);
                                  }}
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: 'pointer',
                                    width: '100%'
                                  }}
                                >
                                  {cat.label}
                                </label>
                              </div>))}
                          </div>

                          <div style={{ width: "auto", height: "1px", background: "var(--Stroke, #EAEAEA)", }} />

                          {/* add new category */}
                          <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }}>
                            <span
                              title="Add New Category"
                              onClick={() => setShowAddCategoryModel(true)}
                              style={{
                                color: "var(--Danger, #1F7FFF)",
                                fontSize: "12px",
                                fontFamily: "Inter",
                                fontWeight: "500",
                                lineHeight: "14px",
                                padding: '0px 2px',
                                borderRadius: '4px',
                                border: '1px solid var(--Danger, #1F7FFF)',
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </span>
                            <span
                              onClick={() => setShowAddCategoryModel(true)}
                              style={{
                                fontSize: 15,
                                color: "black",
                                fontWeight: "400",
                                cursor: 'pointer',
                              }}>&nbsp;Add Category</span>
                          </div>
                        </div>}

                      </div>
                    </div>

                    {/* sub category */}
                    {settings.subcategory && <div
                      style={{
                        width: "50%",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Sub - Category <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                        </span>
                        {/* <div
                        title="Add New Category"
                        onClick={() => setShowAddCategoryModel(true)}
                        style={{
                          color: "var(--Danger, #1F7FFF)",
                          fontSize: "15px",
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "13px",
                          padding: '0px 2px',
                          borderRadius: '4px',
                          border: '1px solid var(--Danger, #1F7FFF)',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </div> */}

                      </div>
                      <div
                        ref={dropdownSubCatRef}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: (highlightedFields.includes("subCategory") || highlightedFields.includes("variant_0_subCategory")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                          position: 'relative',
                        }}
                      >
                        {/* <select
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                      color: "var(--Black-Black, #0E101A)",
                      fontSize: "14px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      outline: "none",
                    }}
                  >
                    <option value="">Select</option>
                    <option value="">Hoodie</option>
                  </select> */}
                        {/* <Select
                            name="subCategory"
                            options={subcategories}
                            value={selectedsubCategory}
                            onChange={subCategoryChange}
                            placeholder="Select Sub-Category"
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              outline: "none",
                            }}
                          /> */}
                        {/* <select
                          value={selectedsubCategory?.value || ""}
                          onChange={(e) => {
                            const selected =
                              subcategories.find(
                                (sub) => sub.value === e.target.value
                              ) || null;

                            // keep same behavior as react-select
                            subCategoryChange(selected);
                          }}
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            outline: "none",
                          }}
                        >
                          <option value="">Select Subcategory</option>

                          {subcategories.map((sub) => (
                            <option key={sub.value} value={sub.value}>
                              {sub.label}
                            </option>
                          ))}
                        </select> */}

                        <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                          <input
                            type="text"
                            value={dropdownSubCat ? dropdownSearch.subcategory : (selectedsubCategory?.label || "")}
                            placeholder="Select"
                            readOnly={!dropdownSubCat}
                            onFocus={() => {
                              if (!dropdownSubCat) {
                                setDropDownSubCat(true);
                                clearDropdownSearch("subcategory");
                              }
                            }}
                            onChange={(e) => updateDropdownSearch("subcategory", e.target.value)}
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                              outline: "none",
                            }}
                          />
                        </div>

                        {!dropdownSubCat && <div
                          onClick={() => setDropDownSubCat(true)}>
                          <IoIosArrowDown />
                        </div>}
                        {dropdownSubCat && <div
                          onClick={() => setDropDownSubCat(false)}>
                          <IoIosArrowUp />
                        </div>}

                        {dropdownSubCat && <div style={{
                          position: 'absolute',
                          top: '40px',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #E1E1E1',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          maxHeight: '365px',
                          width: '100%',
                          // overflowY: 'auto',
                          zIndex: 1000
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '325px', height: 'auto' }}>

                            {/* mapping of categories */}
                            <div
                              className="button-hover"
                              style={{
                                display: 'flex',
                                justifyContent: 'start',
                                alignItems: 'center',
                                width: '100%',
                                padding: '5px 14px',
                                borderBottom: "1px solid #E1E1E1",
                              }}>
                              <label
                                onClick={() => {
                                  setSelectedsubCategory(null);
                                  setDropDownSubCat(false);
                                  clearDropdownSearch("subcategory");
                                  setFormErrors((prev) => ({ ...prev, subCategory: "" }));
                                }}
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: 'pointer',
                                  fontStyle: 'italic',
                                  width: '100%',
                                }}
                              >
                                Unselect
                              </label>
                            </div>

                            {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                              <input
                                type="text"
                                value={dropdownSearch.subcategory}
                                onChange={(e) => updateDropdownSearch("subcategory", e.target.value)}
                                placeholder="Search subcategory"
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  border: "1px solid #E1E1E1",
                                  borderRadius: "6px",
                                  padding: "0 10px",
                                  outline: "none",
                                  fontSize: "13px",
                                }}
                              />
                            </div> */}

                            {filteredSubcategories.length === 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "10px 0",
                                }}
                              >
                                No Subcategory found
                              </div>
                            ) : filteredSubcategories.map((sub) => (
                              <div key={sub.value}
                                className="button-hover"
                                style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', padding: '5px 14px', }}>
                                <label
                                  onClick={() => {
                                    setSelectedsubCategory(sub);
                                    setDropDownSubCat(false);
                                    clearDropdownSearch("subcategory");
                                    setFormErrors((prev) => ({ ...prev, subCategory: "" }));
                                  }}
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: 'pointer',
                                    width: '100%',
                                  }}
                                >
                                  {sub.label}
                                </label>
                              </div>))}
                          </div>

                          <div
                            style={{
                              width: "auto",
                              height: "1px",
                              background: "var(--Stroke, #EAEAEA)",
                            }}
                          />

                          {selectedCategory ? <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }}>
                            <span
                              title="Add New Subcategory"
                              onClick={() => setShowAddSubCategoryModel(true)}
                              style={{
                                color: "var(--Danger, #1F7FFF)",
                                fontSize: "12px",
                                fontFamily: "Inter",
                                fontWeight: "500",
                                lineHeight: "14px",
                                padding: '0px 2px',
                                borderRadius: '4px',
                                border: '1px solid var(--Danger, #1F7FFF)',
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </span>
                            <span
                              onClick={() => setShowAddSubCategoryModel(true)}
                              style={{
                                fontSize: 13,
                                color: "black",
                                fontWeight: "400",
                                cursor: 'pointer',
                              }}>&nbsp;Add Subcategory</span>
                          </div> : <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }}>
                            <span
                              style={{
                                fontSize: 12,
                                color: "black",
                                fontWeight: "400",
                                fontStyle: 'italic',
                              }}>*select category first*</span>
                          </div>}

                        </div>}

                      </div>
                    </div>}
                  </div>}

                  {/* brand */}
                  {settings.brand && <div
                    style={{
                      width: "22%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--Black-Grey, #727681)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        Brand <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                      </span>
                    </div>

                    <div
                      ref={dropdownBrandRef}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: (highlightedFields.includes("brand") || highlightedFields.includes("variant_0_brand")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", gap: "5px", width: '100%' }}>
                        <input
                          type="text"
                          value={dropdownBrand ? dropdownSearch.brand : (selectedBrands?.label || "")}
                          placeholder={loading ? "Loading Brands..." : "Select Brand"}
                          readOnly={!dropdownBrand}
                          onFocus={() => {
                            if (!dropdownBrand) {
                              setDropDownBrand(true);
                              clearDropdownSearch("brand");
                            }
                          }}
                          onChange={(e) => updateDropdownSearch("brand", e.target.value)}
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                            outline: "none",
                          }}
                        />
                      </div>

                      {!dropdownBrand && (
                        <div onClick={() => setDropDownBrand(true)}>
                          <IoIosArrowDown />
                        </div>
                      )}
                      {dropdownBrand && (
                        <div onClick={() => setDropDownBrand(false)}>
                          <IoIosArrowUp />
                        </div>
                      )}

                      {dropdownBrand && (
                        <div
                          style={{
                            position: "absolute",
                            top: "40px",
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            border: "1px solid #E1E1E1",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            maxHeight: "365px",
                            width: "100%",
                            zIndex: 1000,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              overflowY: "auto",
                              maxHeight: "325px",
                              height: "auto",
                              width: '100%',
                            }}
                          >
                            <div
                              className="button-hover"
                              style={{
                                display: "flex",
                                justifyContent: "start",
                                alignItems: "center",
                                width: "100%",
                                padding: "5px 14px",
                                borderBottom: "1px solid #E1E1E1",
                              }}
                            >
                              <label
                                onClick={() => {
                                  handleBrandChange(null);
                                  setDropDownBrand(false);
                                  clearDropdownSearch("brand");
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    brand: "",
                                  }));
                                }}
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  fontStyle: "italic",
                                  width: '100%',
                                }}
                              >
                                Unselect
                              </label>
                            </div>

                            {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                              <input
                                type="text"
                                value={dropdownSearch.brand}
                                onChange={(e) => updateDropdownSearch("brand", e.target.value)}
                                placeholder="Search brand"
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  border: "1px solid #E1E1E1",
                                  borderRadius: "6px",
                                  padding: "0 10px",
                                  outline: "none",
                                  fontSize: "13px",
                                }}
                              />
                            </div> */}

                            {filteredBrands.length === 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "10px 0",
                                }}
                              >
                                No Brand found
                              </div>
                            ) : filteredBrands.map((opt) => (
                              <div
                                key={opt.value}
                                className="button-hover"
                                style={{
                                  display: "flex",
                                  justifyContent: "start",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "5px 14px",
                                }}
                              >
                                <label
                                  onClick={() => {
                                    handleBrandChange(opt);
                                    setDropDownBrand(false);
                                    clearDropdownSearch("brand");
                                    setFormErrors((prev) => ({
                                      ...prev,
                                      brand: "",
                                    }));
                                  }}
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    width: '100%',
                                  }}
                                >
                                  {opt.label.length > 40
                                    ? opt.label.slice(0, 40) + "..."
                                    : opt.label}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div
                            style={{
                              width: "auto",
                              height: "1px",
                              background: "var(--Stroke, #EAEAEA)",
                            }}
                          />

                          <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }}
                            onClick={() => setShowAddBrandModel(true)}>
                            <span
                              title="Add New Brand"
                              style={{
                                color: "var(--Danger, #1F7FFF)",
                                fontSize: "12px",
                                fontFamily: "Inter",
                                fontWeight: "500",
                                lineHeight: "14px",
                                padding: '0px 2px',
                                borderRadius: '4px',
                                border: '1px solid var(--Danger, #1F7FFF)',
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </span>
                            <span
                              style={{
                                fontSize: 15,
                                color: "black",
                                fontWeight: "400",
                                cursor: 'pointer',
                              }}>&nbsp;Add New Brand</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>}

                  {/* hsn code */}
                  {settings.hsn && <div
                    style={{
                      width: "22%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--Black-Grey, #727681)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        HSN <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                      </span>
                    </div>

                    <div
                      ref={dropdownHSNRef}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border:
                          highlightedFields.includes("hsn") ||
                            highlightedFields.includes("variant_0_hsn")
                            ? "1px var(--White-Stroke, #fa3333ff) solid"
                            : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", gap: "5px", width: '100%' }}>
                        <input
                          type="text"
                          value={dropdownHSN ? dropdownSearch.hsn : (selectedHSN?.label || "")}
                          placeholder={loading ? "Loading HSN..." : "Select HSN"}
                          readOnly={!dropdownHSN}
                          onFocus={() => {
                            if (!dropdownHSN) {
                              setDropDownHSN(true);
                              clearDropdownSearch("hsn");
                            }
                          }}
                          onChange={(e) => updateDropdownSearch("hsn", e.target.value)}
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                            outline: "none",
                          }}
                        />
                      </div>

                      {!dropdownHSN && (
                        <div onClick={() => setDropDownHSN(true)}>
                          <IoIosArrowDown />
                        </div>
                      )}
                      {dropdownHSN && (
                        <div onClick={() => setDropDownHSN(false)}>
                          <IoIosArrowUp />
                        </div>
                      )}

                      {dropdownHSN && (
                        <div
                          style={{
                            position: "absolute",
                            top: "40px",
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            border: "1px solid #E1E1E1",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            maxHeight: "360px",
                            width: "100%",
                            zIndex: 1000,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              overflowY: "auto",
                              maxHeight: "315px",
                              height: "auto",
                            }}
                          >
                            <div
                              className="button-hover"
                              style={{
                                display: "flex",
                                justifyContent: "start",
                                alignItems: "center",
                                width: "100%",
                                padding: "5px 14px",
                                borderBottom: "1px solid #E1E1E1",
                              }}
                            >
                              <label
                                onClick={() => {
                                  handleHSNChange(null);
                                  setDropDownHSN(false);
                                  clearDropdownSearch("hsn");
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    hsn: "",
                                  }));
                                }}
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  fontStyle: "italic",
                                  width: '100%',
                                }}
                              >
                                Unselect
                              </label>
                            </div>

                            {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                              <input
                                type="text"
                                value={dropdownSearch.hsn}
                                onChange={(e) => updateDropdownSearch("hsn", e.target.value)}
                                placeholder="Search HSN"
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  border: "1px solid #E1E1E1",
                                  borderRadius: "6px",
                                  padding: "0 10px",
                                  outline: "none",
                                  fontSize: "13px",
                                }}
                              />
                            </div> */}

                            {filteredHsns.length === 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "10px 0",
                                }}
                              >
                                No HSN found
                              </div>
                            ) : filteredHsns.map((hsn) => (
                              <div
                                key={hsn.value}
                                className="button-hover"
                                style={{
                                  display: "flex",
                                  justifyContent: "start",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "5px 14px",
                                }}
                              >
                                <label
                                  onClick={() => {
                                    handleHSNChange(hsn);
                                    setDropDownHSN(false);
                                    clearDropdownSearch("hsn");
                                    setFormErrors((prev) => ({
                                      ...prev,
                                      hsn: "",
                                    }));
                                  }}
                                  style={{
                                    fontSize: 14,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    width: '100%',
                                  }}
                                >
                                  {hsn.label.length > 40
                                    ? hsn.label.slice(0, 40) + "..."
                                    : hsn.label}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div
                            style={{
                              width: "auto",
                              height: "1px",
                              background: "var(--Stroke, #EAEAEA)",
                            }}
                          />

                          <div style={{
                            display: 'flex',
                            justifyContent: 'start',
                            alignItems: 'center',
                            padding: '8px 14px',
                          }}
                            onClick={() => setShowAddHSNModel(true)}
                          >
                            <span
                              title="Add New HSN"
                              style={{
                                color: "var(--Danger, #1F7FFF)",
                                fontSize: "12px",
                                fontFamily: "Inter",
                                fontWeight: "500",
                                lineHeight: "14px",
                                padding: '0px 2px',
                                borderRadius: '4px',
                                border: '1px solid var(--Danger, #1F7FFF)',
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </span>
                            <span
                              style={{
                                fontSize: 15,
                                color: "black",
                                fontWeight: "400",
                                cursor: 'pointer',
                              }}>&nbsp;Add New HSN</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>}

                  {/* unit */}
                  {settings.units && !dualUnit && <div
                    style={{
                      width: "22%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <div style={{
                        width: "100%",
                        display: "flex",
                        gap: "2px",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}>
                        <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          {t("Unit")} <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                        </span>
                        {!isEdit && <span
                          style={{
                            color: "var(--Black-Grey, #727681)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={dualUnit}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setDualUnit(checked);
                              if (!checked) {
                                setSelectedSecondaryUnits(null);
                                setFormData((prev) => ({ ...prev, secondaryUnitQuantity: "" }));
                              }
                            }}
                            style={{ border: '1px solid #6C748C' }}
                          />
                          {t("Dual Unit")}
                        </span>}
                      </div>
                    </div>

                    <div
                      ref={dropdownUnitsRef}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border:
                          highlightedFields.includes("unit") ||
                            highlightedFields.includes("variant_0_unit")
                            ? "1px var(--White-Stroke, #fa3333ff) solid"
                            : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                        position: "relative",
                        zIndex: dropdownUnit ? 1001 : 1,
                      }}
                      onClick={(e) => toggleUnitDropdown(e)}
                    >
                      <div style={{ display: "flex", gap: "5px", width: '100%' }}>
                        <input
                          type="text"
                          value={dropdownUnit ? dropdownSearch.unit : (selectedUnits?.label || "")}
                          placeholder={loading ? "Loading Unit..." : "Select Unit"}
                          readOnly={!dropdownUnit}
                          onFocus={() => {
                            if (!dropdownUnit) {
                              setDropDownUnit(true);
                              clearDropdownSearch("unit");
                            }
                          }}
                          onChange={(e) => updateDropdownSearch("unit", e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            width: "100%",
                            border: "none",
                            background: "transparent",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                            outline: "none",
                          }}
                        />
                      </div>

                      {!dropdownUnit && (
                        <div onClick={() => setDropDownUnit(true)}>
                          <IoIosArrowDown />
                        </div>
                      )}
                      {dropdownUnit && (
                        <div onClick={() => setDropDownUnit(false)}>
                          <IoIosArrowUp />
                        </div>
                      )}

                      {dropdownUnit && (
                        <div
                          style={{
                            position: "absolute",
                            top: "40px",
                            left: 0,
                            right: 0,
                            backgroundColor: "white",
                            border: "1px solid #E1E1E1",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            maxHeight: "360px",
                            width: "100%",
                            zIndex: 1000,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              overflowY: "auto",
                              maxHeight: "315px",
                              height: "auto",
                            }}
                          >
                            <div
                              className="button-hover"
                              style={{
                                display: "flex",
                                justifyContent: "start",
                                alignItems: "center",
                                width: "100%",
                                padding: "5px 14px",
                                borderBottom: "1px solid #E1E1E1",
                              }}
                            >
                              <label
                                onClick={() => {
                                  handleUnitChange(null);
                                  setDropDownUnit(false);
                                  clearDropdownSearch("unit");
                                  setFormErrors((prev) => ({
                                    ...prev,
                                    unit: "",
                                  }));
                                }}
                                style={{
                                  fontSize: 15,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  fontStyle: "italic",
                                  width: '100%',
                                }}
                              >
                                Unselect
                              </label>
                            </div>

                            {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                              <input
                                type="text"
                                value={dropdownSearch.unit}
                                onChange={(e) => updateDropdownSearch("unit", e.target.value)}
                                placeholder="Search unit"
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  border: "1px solid #E1E1E1",
                                  borderRadius: "6px",
                                  padding: "0 10px",
                                  outline: "none",
                                  fontSize: "13px",
                                }}
                              />
                            </div> */}

                            {filteredUnits.length === 0 ? (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "10px 0",
                                }}
                              >
                                No unit found
                              </div>
                            ) : filteredUnits.map((unit) => (
                              <div
                                key={unit.value}
                                className="button-hover"
                                style={{
                                  display: "flex",
                                  justifyContent: "start",
                                  alignItems: "center",
                                  width: "100%",
                                  padding: "5px 14px",
                                }}
                              >
                                <label
                                  onClick={() => {
                                    handleUnitChange(unit);
                                    setDropDownUnit(false);
                                    clearDropdownSearch("unit");
                                    setFormErrors((prev) => ({
                                      ...prev,
                                      unit: "",
                                    }));
                                  }}
                                  style={{
                                    fontSize: 14,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    width: "100%",
                                  }}
                                >
                                  {unit.label && unit.label.length > 40
                                    ? unit.label.slice(0, 40) + "..."
                                    : unit.label || "Unnamed Unit"}
                                </label>
                              </div>
                            ))}
                          </div>

                          <div
                            style={{
                              width: "auto",
                              height: "1px",
                              background: "var(--Stroke, #EAEAEA)",
                            }}
                          />

                          <div style={{
                            display: 'flex',
                            justifyContent: 'start',
                            alignItems: 'center',
                            padding: '8px 14px',
                          }}
                            onClick={() => setShowAddUnitModal(true)}
                          >
                            <span
                              title="Add New Unit"
                              style={{
                                color: "var(--Danger, #1F7FFF)",
                                fontSize: "12px",
                                fontFamily: "Inter",
                                fontWeight: "500",
                                lineHeight: "14px",
                                padding: '0px 2px',
                                borderRadius: '4px',
                                border: '1px solid var(--Danger, #1F7FFF)',
                                cursor: 'pointer',
                              }}
                            >
                              +
                            </span>
                            <span
                              style={{
                                fontSize: 15,
                                color: "black",
                                fontWeight: "400",
                                cursor: 'pointer',
                              }}>&nbsp;Add New Units</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>}

                  {/* dual unit */}
                  {dualUnit && <div style={{
                    width: "22%",
                    display: 'flex',
                    gap: '16px',
                    flexDirection: 'column',
                  }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '16px',
                      alignItems: 'center',
                    }}>
                      {/* Primary */}
                      <div
                        style={{
                          width: "50%",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--Black-Grey, #727681)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            Primary Unit <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                          </span>
                        </div>
                        <div
                          ref={dropdownUnitsRef}
                          style={{
                            width: "100%",
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border:
                              highlightedFields.includes("unit") ||
                                highlightedFields.includes("variant_0_unit")
                                ? "1px var(--White-Stroke, #fa3333ff) solid"
                                : "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                            position: "relative",
                            zIndex: dropdownUnit ? 1001 : 1,
                          }}
                          onClick={(e) => toggleUnitDropdown(e)}
                        >
                          <div style={{ display: "flex", gap: "5px", width: '100%' }}>
                            <input
                              type="text"
                              value={dropdownUnit ? dropdownSearch.unit : (selectedUnits?.label || "")}
                              placeholder={loading ? "Loading Unit..." : "Select Primary Unit"}
                              readOnly={!dropdownUnit}
                              onFocus={() => {
                                if (!dropdownUnit) {
                                  setDropDownUnit(true);
                                  clearDropdownSearch("unit");
                                }
                              }}
                              onChange={(e) => updateDropdownSearch("unit", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                lineHeight: "14.40px",
                                outline: "none",
                              }}
                            />
                          </div>

                          {!dropdownUnit && (
                            <div onClick={() => setDropDownUnit(true)}>
                              <IoIosArrowDown />
                            </div>
                          )}
                          {dropdownUnit && (
                            <div onClick={() => setDropDownUnit(false)}>
                              <IoIosArrowUp />
                            </div>
                          )}

                          {dropdownUnit && (
                            <div
                              style={{
                                position: "absolute",
                                top: "40px",
                                left: 0,
                                right: 0,
                                backgroundColor: "white",
                                border: "1px solid #E1E1E1",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                maxHeight: "360px",
                                width: "100%",
                                zIndex: 1000,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  overflowY: "auto",
                                  maxHeight: "315px",
                                  height: "auto",
                                }}
                              >
                                <div
                                  className="button-hover"
                                  style={{
                                    display: "flex",
                                    justifyContent: "start",
                                    alignItems: "center",
                                    width: "100%",
                                    padding: "5px 14px",
                                    borderBottom: "1px solid #E1E1E1",
                                  }}
                                >
                                  <label
                                    onClick={() => {
                                      handleUnitChange(null);
                                      setDropDownUnit(false);
                                      clearDropdownSearch("unit");
                                      setFormErrors((prev) => ({
                                        ...prev,
                                        unit: "",
                                      }));
                                    }}
                                    style={{
                                      fontSize: 15,
                                      color: "black",
                                      fontWeight: "500",
                                      cursor: "pointer",
                                      fontStyle: "italic",
                                      width: '100%',
                                    }}
                                  >
                                    Unselect
                                  </label>
                                </div>

                                {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                              <input
                                type="text"
                                value={dropdownSearch.unit}
                                onChange={(e) => updateDropdownSearch("unit", e.target.value)}
                                placeholder="Search unit"
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  border: "1px solid #E1E1E1",
                                  borderRadius: "6px",
                                  padding: "0 10px",
                                  outline: "none",
                                  fontSize: "13px",
                                }}
                              />
                            </div> */}

                                {filteredUnits.length === 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "10px 0",
                                    }}
                                  >
                                    No primary unit found
                                  </div>
                                ) : filteredUnits.map((unit) => (
                                  <div
                                    key={unit.value}
                                    className="button-hover"
                                    style={{
                                      display: "flex",
                                      justifyContent: "start",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "5px 14px",
                                    }}
                                  >
                                    <label
                                      onClick={() => {
                                        handleUnitChange(unit);
                                        setDropDownUnit(false);
                                        clearDropdownSearch("unit");
                                        setFormErrors((prev) => ({
                                          ...prev,
                                          unit: "",
                                        }));
                                      }}
                                      style={{
                                        fontSize: 14,
                                        color: "black",
                                        fontWeight: "500",
                                        cursor: "pointer",
                                        width: "100%",
                                      }}
                                    >
                                      {unit.label && unit.label.length > 40
                                        ? unit.label.slice(0, 40) + "..."
                                        : unit.label || "Unnamed Unit"}
                                    </label>
                                  </div>
                                ))}
                              </div>

                              <div
                                style={{
                                  width: "auto",
                                  height: "1px",
                                  background: "var(--Stroke, #EAEAEA)",
                                }}
                              />

                              <div style={{
                                display: 'flex',
                                justifyContent: 'start',
                                alignItems: 'center',
                                padding: '8px 14px',
                              }}
                                onClick={() => setShowAddUnitModal(true)}
                              >
                                <span
                                  title="Add New Unit"
                                  style={{
                                    color: "var(--Danger, #1F7FFF)",
                                    fontSize: "12px",
                                    fontFamily: "Inter",
                                    fontWeight: "500",
                                    lineHeight: "14px",
                                    padding: '0px 2px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--Danger, #1F7FFF)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  +
                                </span>
                                <span
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "400",
                                    cursor: 'pointer',
                                  }}>&nbsp;Add New Units</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Secondary Unit */}
                      <div
                        style={{
                          width: "50%",
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--Black-Grey, #727681)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            Secondary Unit <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                          </span>
                          {/* <div
                        title="Add New Category"
                        onClick={() => setShowAddCategoryModel(true)}
                        style={{
                          color: "var(--Danger, #1F7FFF)",
                          fontSize: "15px",
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "13px",
                          padding: '0px 2px',
                          borderRadius: '4px',
                          border: '1px solid var(--Danger, #1F7FFF)',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </div> */}

                        </div>
                        <div
                          ref={dropdownSecondaryUnitsRef}
                          style={{
                            width: "100%",
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border:
                              highlightedFields.includes("unit") ||
                                highlightedFields.includes("variant_0_unit")
                                ? "1px var(--White-Stroke, #fa3333ff) solid"
                                : "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                            position: "relative",
                            zIndex: dropdownSecondaryUnit ? 1001 : 1,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropDownSecondaryUnit((open) => !open);
                          }}
                        >
                          <div style={{ display: "flex", gap: "5px", width: '100%' }}>
                            <input
                              type="text"
                              value={dropdownSecondaryUnit ? dropdownSearch.secondaryUnit : (selectedSecondaryUnits?.label || "")}
                              placeholder={loading ? "Loading Unit..." : "Select Secondary Unit"}
                              readOnly={!dropdownSecondaryUnit}
                              onFocus={() => {
                                if (!dropdownSecondaryUnit) {
                                  setDropDownSecondaryUnit(true);
                                  clearDropdownSearch("secondaryUnit");
                                }
                              }}
                              onChange={(e) => updateDropdownSearch("secondaryUnit", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                lineHeight: "14.40px",
                                outline: "none",
                              }}
                            />
                          </div>

                          {!dropdownSecondaryUnit && (
                            <div onClick={() => setDropDownSecondaryUnit(true)}>
                              <IoIosArrowDown />
                            </div>
                          )}
                          {dropdownSecondaryUnit && (
                            <div onClick={() => setDropDownSecondaryUnit(false)}>
                              <IoIosArrowUp />
                            </div>
                          )}

                          {dropdownSecondaryUnit && (
                            <div
                              style={{
                                position: "absolute",
                                top: "40px",
                                left: 0,
                                right: 0,
                                backgroundColor: "white",
                                border: "1px solid #E1E1E1",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                maxHeight: "360px",
                                width: "100%",
                                zIndex: 1000,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  overflowY: "auto",
                                  maxHeight: "315px",
                                  height: "auto",
                                }}
                              >
                                <div
                                  className="button-hover"
                                  style={{
                                    display: "flex",
                                    justifyContent: "start",
                                    alignItems: "center",
                                    width: "100%",
                                    padding: "5px 14px",
                                    borderBottom: "1px solid #E1E1E1",
                                  }}
                                >
                                  <label
                                    onClick={() => {
                                      handleSecondaryUnitChange(null);
                                      setDropDownSecondaryUnit(false);
                                      clearDropdownSearch("secondaryUnit");
                                      setFormErrors((prev) => ({
                                        ...prev,
                                        unit: "",
                                      }));
                                    }}
                                    style={{
                                      fontSize: 15,
                                      color: "black",
                                      fontWeight: "500",
                                      cursor: "pointer",
                                      fontStyle: "italic",
                                      width: '100%',
                                    }}
                                  >
                                    Unselect
                                  </label>
                                </div>

                                {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                              <input
                                type="text"
                                value={dropdownSearch.unit}
                                onChange={(e) => updateDropdownSearch("unit", e.target.value)}
                                placeholder="Search unit"
                                style={{
                                  width: "100%",
                                  height: "32px",
                                  border: "1px solid #E1E1E1",
                                  borderRadius: "6px",
                                  padding: "0 10px",
                                  outline: "none",
                                  fontSize: "13px",
                                }}
                              />
                            </div> */}

                                {filteredUnits.length === 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "10px 0",
                                    }}
                                  >
                                    No secondary unit found
                                  </div>
                                ) : filteredUnits.map((unit) => (
                                  <div
                                    key={unit.value}
                                    className="button-hover"
                                    style={{
                                      display: "flex",
                                      justifyContent: "start",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "5px 14px",
                                    }}
                                  >
                                    <label
                                      onClick={() => {
                                        handleSecondaryUnitChange(unit);
                                        setDropDownSecondaryUnit(false);
                                        clearDropdownSearch("secondaryUnit");
                                        setFormErrors((prev) => ({
                                          ...prev,
                                          unit: "",
                                        }));
                                      }}
                                      style={{
                                        fontSize: 14,
                                        color: "black",
                                        fontWeight: "500",
                                        cursor: "pointer",
                                        width: "100%",
                                      }}
                                    >
                                      {unit.label && unit.label.length > 40
                                        ? unit.label.slice(0, 40) + "..."
                                        : unit.label || "Unnamed Unit"}
                                    </label>
                                  </div>
                                ))}
                              </div>

                              <div
                                style={{
                                  width: "auto",
                                  height: "1px",
                                  background: "var(--Stroke, #EAEAEA)",
                                }}
                              />

                              <div style={{
                                display: 'flex',
                                justifyContent: 'start',
                                alignItems: 'center',
                                padding: '8px 14px',
                              }}
                                onClick={() => setShowAddUnitModal(true)}
                              >
                                <span
                                  title="Add New Unit"
                                  style={{
                                    color: "var(--Danger, #1F7FFF)",
                                    fontSize: "12px",
                                    fontFamily: "Inter",
                                    fontWeight: "500",
                                    lineHeight: "14px",
                                    padding: '0px 2px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--Danger, #1F7FFF)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  +
                                </span>
                                <span
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "400",
                                    cursor: 'pointer',
                                  }}>&nbsp;Add New Units</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      border: '1px solid #EAEAEA',
                      borderRadius: '8px',
                      padding: '0px 16px',
                      gap: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span>1</span>
                      <span>{selectedUnits?.label || "Primary Unit"}</span>
                      <span
                        style={{
                          color: '#A2A8B8',
                          fontSize: 14,
                          border: '1px solid #EAEAEA',
                          padding: '4px 10px',
                          backgroundColor: '#F5F7FA',
                        }}>
                        =
                      </span>
                      <span>
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          value={formData.secondaryUnitQuantity || ""}
                          onChange={(e) => setFormData((prev) => ({ ...prev, secondaryUnitQuantity: e.target.value }))}
                          style={{ width: '60px', padding: '0px 0px 0px 4px', borderRadius: '4px', border: 'none', outline: 'none', backgroundColor: '#F5F7FA', fontSize: 14, height: '26px' }}
                        />
                      </span>
                      <span>{selectedSecondaryUnits?.label || "Secondary Unit"}</span>
                    </div>

                  </div>}

                  {/* description */}
                  {settings.description && <div
                    style={{
                      width: "22%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "4px",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--Black-Grey, #727681)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        Description <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: highlightedFields.includes("description") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <input
                        type="text"
                        name="description"
                        placeholder="Enter Description (max 30 words)"
                        maxLength={30}
                        value={formData.description}
                        onChange={handleChange}
                        style={{
                          width: "100%",
                          border: "none",
                          background: "transparent",
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>}

                </div>
              </div>

              {/* pricing header & check boxes */}
              <div
                style={{
                  color: "black",
                  fontSize: "16px",
                  fontFamily: "Inter",
                  fontWeight: "500",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '123px'
                }}>
                <div style={{ padding: '6px 12px', borderBottom: '2px solid #1F7FFF' }}>
                  <span style={{ color: "#0E101A", fontSize: 16, fontWeight: 500, lineHeight: "19.20px" }}>
                    Pricing & Details
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: trackBatchNo ? '#A2A8B8' : '#6C748C', padding: '4px 8px' }}>
                    <input
                      type="checkbox"
                      checked={trackExpiry}
                      disabled={trackBatchNo}
                      onChange={(e) => setTrackExpiry(e.target.checked)}
                      style={{ border: '1px solid #6C748C' }}
                    />
                    <span>Expiry</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: trackBatchNo ? '#A2A8B8' : '#6C748C', padding: '4px 8px' }}>
                    <input
                      type="checkbox"
                      checked={trackSerialNo}
                      disabled={trackBatchNo}
                      onChange={(e) => {
                        setTrackSerialNo(e.target.checked);
                        if (!e.target.checked) {
                          setAddSerialPopup(false);
                        }
                      }}
                      style={{ border: '1px solid #6C748C' }}
                    />
                    <span>Serial No.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6C748C', padding: '4px 8px' }}>
                    <input
                      type="checkbox"
                      checked={trackBatchNo}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTrackBatchNo(checked);
                        if (checked) {
                          setTrackExpiry(false);
                          setTrackSerialNo(false);
                          setAddSerialPopup(false);
                        }
                      }}
                      style={{ border: '1px solid #6C748C' }}
                    />
                    <span>Batch No.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6C748C', padding: '4px 8px' }}>
                    <input
                      type="checkbox"
                      checked={trackWarranty}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTrackWarranty(checked);
                        if (!checked) setShowWarrantyPopup(false);
                      }}
                      style={{ border: '1px solid #6C748C' }}
                    />
                    <span>Warranty</span>
                  </div>
                </div>
              </div>

              {/* Pricing & Variants */}
              <div
              // className="delete-hover"
              >

                {/* header */}
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                    marginBottom: '8px'
                  }}
                >
                  {formData.productType === "Variant" && (
                    <div style={{ display: "flex", gap: "16px", alignItems: "flex-end" }}>
                      <div
                        ref={sizeDropdownRef}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "180px",
                        }}
                        className="col-1"
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                          <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>
                            Size
                          </span>
                        </div>

                        <div
                          style={{
                            width: "100%",
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border: "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                            position: "relative",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="text"
                            value={sizeDropdownOpen ? dropdownSearch.size : (selectedSizes.length > 0 ? selectedSizes.map((s) => s.label).join(", ") : "")}
                            placeholder={loading ? "Loading Size..." : "Select Size"}
                            readOnly={!sizeDropdownOpen}
                            onFocus={() => {
                              if (!sizeDropdownOpen) {
                                setSizeDropdownOpen(true);
                                clearDropdownSearch("size");
                              }
                            }}
                            onChange={(e) => updateDropdownSearch("size", e.target.value)}
                            style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", border: "none", background: "transparent", outline: "none" }}
                          />
                          <div style={{ transform: sizeDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", cursor: "pointer" }} onClick={() => setSizeDropdownOpen((v) => !v)}>
                            <IoIosArrowUp />
                          </div>

                          {sizeDropdownOpen && (
                            <div
                              style={{
                                position: "absolute",
                                top: "40px",
                                left: 0,
                                right: 0,
                                backgroundColor: "white",
                                border: "1px solid #E1E1E1",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                maxHeight: "360px",
                                width: "100%",
                                zIndex: 1000,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "315px", height: "auto" }}>
                                <div
                                  className="button-hover"
                                  style={{ display: "flex", justifyContent: "start", alignItems: "center", width: "100%", padding: "5px 14px", borderBottom: "1px solid #E1E1E1" }}
                                  onClick={() => {
                                    setSelectedSizes([]);
                                    clearDropdownSearch("size");
                                  }}
                                >
                                  <label style={{ fontSize: 14, color: "black", fontWeight: "400", cursor: "pointer", fontStyle: "italic", width: "100%" }}>
                                    Unselect
                                  </label>
                                </div>

                                {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                                  <input
                                    type="text"
                                    value={dropdownSearch.size}
                                    onChange={(e) => updateDropdownSearch("size", e.target.value)}
                                    placeholder="Search size"
                                    style={{
                                      width: "100%",
                                      height: "32px",
                                      border: "1px solid #E1E1E1",
                                      borderRadius: "6px",
                                      padding: "0 10px",
                                      outline: "none",
                                      fontSize: "13px",
                                    }}
                                  />
                                </div> */}

                                {filteredSizes.length === 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "10px 0",
                                      fontSize: 14,
                                      fontWeight: '400',
                                    }}
                                  >
                                    No Size found
                                  </div>
                                ) : filteredSizes.map((size) => {
                                  const checked = selectedSizes.some((s) => s.value === size.value);
                                  return (
                                    <div
                                      key={size.value}
                                      className="button-hover"
                                      style={{ display: "flex", justifyContent: "start", alignItems: "center", width: "100%", padding: "5px 14px", gap: "8px" }}
                                      onClick={() => {
                                        setSelectedSizes((prev) => {
                                          const list = Array.isArray(prev) ? prev : [];
                                          const exists = list.some((s) => s.value === size.value);
                                          return exists ? list.filter((s) => s.value !== size.value) : [...list, size];
                                        });
                                      }}
                                    >
                                      <input type="checkbox" checked={checked} readOnly />
                                      <label style={{ fontSize: 14, color: "black", fontWeight: "400", cursor: "pointer", width: "100%" }}>
                                        {size.label || "Unnamed Size"}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>

                              <div style={{ width: "auto", height: "1px", background: "var(--Stroke, #EAEAEA)" }} />

                              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }} onClick={() => setShowAddSizeModal(true)}>
                                <span title="Add New Size" style={{ color: "var(--Danger, #1F7FFF)", fontSize: "12px", fontFamily: "Inter", fontWeight: "500", lineHeight: "14px", padding: '0px 2px', borderRadius: '4px', border: '1px solid var(--Danger, #1F7FFF)', cursor: 'pointer' }}>
                                  +
                                </span>
                                <span style={{ fontSize: 15, color: "black", fontWeight: "400", cursor: 'pointer' }}>&nbsp;Add New Sizes</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        ref={colorDropdownRef}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "180px",
                        }}
                        className="col-1"
                      >
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                          <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>
                            Color
                          </span>
                        </div>

                        <div
                          style={{
                            width: "100%",
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border: "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                            position: "relative",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="text"
                            value={colorDropdownOpen ? dropdownSearch.color : (selectedColors.length > 0 ? selectedColors.map((c) => c.label).join(", ") : "")}
                            placeholder={loading ? "Loading Color..." : "Select Color"}
                            readOnly={!colorDropdownOpen}
                            onFocus={() => {
                              if (!colorDropdownOpen) {
                                setColorDropdownOpen(true);
                                clearDropdownSearch("color");
                              }
                            }}
                            onChange={(e) => updateDropdownSearch("color", e.target.value)}
                            style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", border: "none", background: "transparent", outline: "none" }}
                          />
                          <div style={{ transform: colorDropdownOpen ? "rotate(180deg)" : "rotate(0deg)", cursor: "pointer" }} onClick={() => setColorDropdownOpen((v) => !v)}>
                            <IoIosArrowUp />
                          </div>

                          {colorDropdownOpen && (
                            <div
                              style={{
                                position: "absolute",
                                top: "40px",
                                left: 0,
                                right: 0,
                                backgroundColor: "white",
                                border: "1px solid #E1E1E1",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                maxHeight: "360px",
                                width: "100%",
                                zIndex: 1000,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "315px", height: "auto" }}>
                                <div
                                  className="button-hover"
                                  style={{ display: "flex", justifyContent: "start", alignItems: "center", width: "100%", padding: "5px 14px", borderBottom: "1px solid #E1E1E1" }}
                                  onClick={() => {
                                    setSelectedColors([]);
                                    clearDropdownSearch("color");
                                  }}
                                >
                                  <label style={{ fontSize: 14, color: "black", fontWeight: "400", cursor: "pointer", fontStyle: "italic", width: "100%" }}>
                                    Unselect
                                  </label>
                                </div>

                                {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                                  <input
                                    type="text"
                                    value={dropdownSearch.color}
                                    onChange={(e) => updateDropdownSearch("color", e.target.value)}
                                    placeholder="Search color"
                                    style={{
                                      width: "100%",
                                      height: "32px",
                                      border: "1px solid #E1E1E1",
                                      borderRadius: "6px",
                                      padding: "0 10px",
                                      outline: "none",
                                      fontSize: "13px",
                                    }}
                                  />
                                </div> */}

                                {filteredColors.length === 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "10px 0",
                                      fontSize: 14,
                                      fontWeight: '400',
                                    }}
                                  >
                                    No Color found
                                  </div>
                                ) : filteredColors.map((color) => {
                                  const checked = selectedColors.some((c) => c.value === color.value);
                                  return (
                                    <div
                                      key={color.value}
                                      className="button-hover"
                                      style={{ display: "flex", justifyContent: "start", alignItems: "center", width: "100%", padding: "5px 14px", gap: "8px" }}
                                      onClick={() => {
                                        setSelectedColors((prev) => {
                                          const list = Array.isArray(prev) ? prev : [];
                                          const exists = list.some((c) => c.value === color.value);
                                          return exists ? list.filter((c) => c.value !== color.value) : [...list, color];
                                        });
                                      }}
                                    >
                                      <input type="checkbox" checked={checked} readOnly />
                                      <label style={{ fontSize: 14, color: "black", fontWeight: "400", cursor: "pointer", width: "100%" }}>
                                        {color.label || "Unnamed Color"}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>

                              <div style={{ width: "auto", height: "1px", background: "var(--Stroke, #EAEAEA)" }} />

                              <div style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', padding: '8px 14px' }} onClick={() => setShowAddColorModal(true)}>
                                <span title="Add New Color" style={{ color: "var(--Danger, #1F7FFF)", fontSize: "12px", fontFamily: "Inter", fontWeight: "500", lineHeight: "14px", padding: '0px 2px', borderRadius: '4px', border: '1px solid var(--Danger, #1F7FFF)', cursor: 'pointer' }}>
                                  +
                                </span>
                                <span style={{ fontSize: 15, color: "black", fontWeight: "400", cursor: 'pointer' }}>&nbsp;Add New Colors</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* variant section */}
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "16px",
                      flexDirection: "column",
                    }}
                  // className="row"
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        padding: '8px 8px 0px 8px',
                        // marginTop:'16px',
                        // width: '1840px',
                        // overflowX: 'auto',
                        position: 'relative',
                        // zIndex: dropdownTaxIndex === index || dropdownSizeIndex === index || dropdownColorIndex === index ? 1001 : 1,
                      }}>

                      {/* Delete button */}
                      {formData.productType === "Variant" && (<div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "45px",
                        }}
                        className="col-1"
                      >
                        <div
                          className=""
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: '8px',
                            height: "100%",
                            cursor: variants.length <= 1 ? "not-allowed" : "pointer",
                          }}
                          onClick={() => {
                            if (variants.length <= 1) return;
                            setVariants(variants.filter((_, i) => i !== index));
                          }}
                        >
                          <BsThreeDotsVertical className="fs-4" /> <RiDeleteBinLine className="text-danger fs-4" />
                        </div>
                      </div>)}

                      {/* Variant Name */}
                      {formData.productType === "Variant" && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            width: "90px",
                            padding: "0 8px",
                            color: "#0E101A",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "500",
                            wordWrap: 'break-word',
                          }}
                          className=""
                        >
                          {`${[variant.size, variant.color].filter(Boolean).join(" - ") || `Variant - ${index + 1}`}`}
                        </div>
                      )}

                      {/* Purchasing Price*/}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "250px",
                        }}
                        className="col-1"
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--Black-Grey, #727681)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            Purchasing Price <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                          </span>
                        </div>
                        <div
                          style={{
                            height: "40px",
                            paddingLeft: "8px",
                            background: "white",
                            borderRadius: "8px",
                            border: highlightedFields.includes(`variant_${index}_purchasePrice`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="number"
                              placeholder="0.00"
                              name="purchasePrice"
                              value={variant.purchasePrice || ""}
                              onChange={(e) => handleVariantChange(index, "purchasePrice", e.target.value)}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                outline: "none",
                              }}
                            />

                            <div
                              style={{
                                paddingRight: "4px",
                                background: "var(--Spinning-Frame, #E9F0F4)",
                                borderTopRightRadius: "8px",
                                borderBottomRightRadius: "8px",
                                border: "1px var(--Stroke, #C2C9D1) solid",
                                justifyContent: "center",
                                alignItems: "center",
                                display: "flex",
                                padding: "7px",
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--Black-Secondary, #6C748C)",
                                  fontSize: "14px",
                                  fontFamily: "Poppins",
                                  fontWeight: "400",
                                }}
                              >
                                <select
                                  name="purchasePriceTaxType"
                                  value={variant.purchasePriceTaxType || "withoutgst"}
                                  onChange={(e) => handleVariantChange(index, "purchasePriceTaxType", e.target.value)}
                                  style={{
                                    color: "var(--Black-Secondary, #6C748C)",
                                    fontSize: "14px",
                                    fontFamily: "Poppins",
                                    fontWeight: "400",
                                    border: "none",
                                    background: "transparent",
                                    outline: "none",
                                  }}
                                >
                                  {/* <option value="">Select</option> */}
                                  <option value="withgst">With GST</option>
                                  <option value="withoutgst">Without GST</option>
                                </select>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* TAX */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "150px",
                        }}
                        className="col-1"
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--Black-Grey, #727681)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            Tax
                          </span>
                        </div>

                        {/* <div
                          style={{
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border: highlightedFields.includes(`variant_${index}_tax`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                          }}
                        >
                          <select
                            name="tax"
                            value={variant.tax || ""}
                            onChange={(e) => handleVariantChange(index, "tax", e.target.value)}
                            style={{
                              width: "100%",
                              border: "none",
                              background: "transparent",
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              outline: "none",
                            }}
                          >
                            <option value="">Select GST</option>
                            <option value="0.25">0.25%</option>
                            <option value="3">3%</option>
                            <option value="5">5%</option>
                            <option value="18">18%</option>
                            <option value="40">40%</option>
                          </select>
                        </div> */}

                        <div
                          ref={(el) => {
                            dropdownTaxIndexRefs.current[index] = el;
                          }}
                          style={{
                            width: "100%",
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border: "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                            position: "relative",
                          }}
                          onClick={(e) => toggleTaxDropdown(e, index)}
                        >
                          <div style={{ display: "flex", gap: "5px", width: '100%' }}>
                            <input
                              type="text"
                              value={dropdownTaxIndex === index ? dropdownSearch.tax : (variant.tax || "")}
                              placeholder={loading ? "Loading Tax..." : "Select Tax"}
                              readOnly={dropdownTaxIndex !== index}
                              onFocus={() => {
                                if (dropdownTaxIndex !== index) {
                                  setDropDownTaxIndex(index);
                                  clearDropdownSearch("tax");
                                }
                              }}
                              onChange={(e) => updateDropdownSearch("tax", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                lineHeight: "14.40px",
                                outline: "none",
                              }}
                            />
                          </div>

                          {dropdownTaxIndex !== index && (
                            <div>
                              <IoIosArrowDown />
                            </div>
                          )}
                          {dropdownTaxIndex === index && (
                            <div>
                              <IoIosArrowUp />
                            </div>
                          )}

                          {dropdownTaxIndex === index && (
                            <div
                              style={{
                                position: "absolute",
                                top: "40px",
                                left: 0,
                                right: 0,
                                backgroundColor: "white",
                                border: "1px solid #E1E1E1",
                                borderRadius: "8px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                maxHeight: "360px",
                                width: "100%",
                                zIndex: 1000,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  overflowY: "auto",
                                  maxHeight: "315px",
                                  height: "auto",
                                }}
                              >
                                <div
                                  className="button-hover"
                                  style={{
                                    display: "flex",
                                    justifyContent: "start",
                                    alignItems: "center",
                                    width: "100%",
                                    padding: "5px 14px",
                                    borderBottom: "1px solid #E1E1E1",
                                  }}
                                >
                                  <label
                                    onClick={() => {
                                      handleTaxChange(null, index);
                                      setDropDownTaxIndex(null);
                                      clearDropdownSearch("tax");
                                      setFormErrors((prev) => ({
                                        ...prev,
                                        [`variant_${index}_tax`]: "",
                                      }));
                                    }}
                                    style={{
                                      fontSize: 15,
                                      color: "black",
                                      fontWeight: "500",
                                      cursor: "pointer",
                                      fontStyle: "italic",
                                      width: '100%',
                                    }}
                                  >
                                    Unselect
                                  </label>
                                </div>

                                {/* <div style={{ padding: "8px 14px", borderBottom: "1px solid #E1E1E1" }}>
                                  <input
                                    type="text"
                                    value={dropdownSearch.tax}
                                    onChange={(e) => updateDropdownSearch("tax", e.target.value)}
                                    placeholder="Search tax"
                                    style={{
                                      width: "100%",
                                      height: "32px",
                                      border: "1px solid #E1E1E1",
                                      borderRadius: "6px",
                                      padding: "0 10px",
                                      outline: "none",
                                      fontSize: "13px",
                                    }}
                                  />
                                </div> */}

                                {filteredTaxes.length === 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "10px 0",
                                    }}
                                  >
                                    No Tax found
                                  </div>
                                ) : filteredTaxes.map((tax) => (
                                  <div
                                    key={tax.value}
                                    className="button-hover"
                                    style={{
                                      display: "flex",
                                      justifyContent: "start",
                                      alignItems: "center",
                                      width: "100%",
                                      padding: "5px 14px",
                                    }}
                                  >
                                    <label
                                      onClick={() => {
                                        handleTaxChange(tax, index);
                                        setDropDownTaxIndex(null);
                                        clearDropdownSearch("tax");
                                        setFormErrors((prev) => ({
                                          ...prev,
                                          [`variant_${index}_tax`]: "",
                                        }));
                                      }}
                                      style={{
                                        fontSize: 14,
                                        color: "black",
                                        fontWeight: "500",
                                        cursor: "pointer",
                                        width: "100%",
                                      }}
                                    >
                                      {tax.label || "Unnamed Tax"}
                                    </label>
                                  </div>
                                ))}
                              </div>

                              <div
                                style={{
                                  width: "auto",
                                  height: "1px",
                                  background: "var(--Stroke, #EAEAEA)",
                                }}
                              />

                              <div style={{
                                display: 'flex',
                                justifyContent: 'start',
                                alignItems: 'center',
                                padding: '8px 14px',
                              }}
                                onClick={() => setShowAddTaxModal(true)}
                              >
                                <span
                                  title="Add New Tax"
                                  style={{
                                    color: "var(--Danger, #1F7FFF)",
                                    fontSize: "12px",
                                    fontFamily: "Inter",
                                    fontWeight: "500",
                                    lineHeight: "14px",
                                    padding: '0px 2px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--Danger, #1F7FFF)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  +
                                </span>
                                <span
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "400",
                                    cursor: 'pointer',
                                  }}>&nbsp;Add New Tax</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <span
                          style={{
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "11px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                            marginBottom: "0px",
                          }}
                        >
                          TAX amount -{" "}
                          <span
                            style={{
                              color: "var(--Black-Black, red)",
                              fontSize: "11px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            ₹{(Number(variant.sellingPrice) > 0 && Number(variant.tax) > 0 ? (variant.sellingPrice * variant.tax / 100) : 0).toFixed(2)}/-
                          </span>
                        </span>
                      </div>

                      {/* MRP */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "150px",
                        }}
                        className="col-1"
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--Black-Grey, #727681)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            MRP <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                          </span>
                        </div>
                        <div
                          style={{
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border: (highlightedFields.includes(`variant_${index}_mrp`) || highlightedFields.includes("mrp")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="number"
                              placeholder="0.00"
                              name="mrp"
                              value={variant.mrp || ""}
                              onChange={(e) => handleVariantChange(index, "mrp", e.target.value)}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Selling Price */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "150px",
                        }}
                        className="col-1"
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--Black-Grey, #727681)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            Selling Price <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                          </span>
                        </div>
                        <div
                          style={{
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border: highlightedFields.includes(`variant_${index}_sellingPrice`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <input
                              type="number"
                              placeholder="0.00"
                              name="sellingPrice"
                              value={variant.sellingPrice || ""}
                              onChange={(e) => handleVariantChange(index, "sellingPrice", e.target.value)}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>
                        <span
                          style={{
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: "11px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          Profit -{" "}
                          <span
                            style={{
                              color: "var(--Black-Black, green)",
                              fontSize: "11px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            ₹ {(Number(variant.sellingPrice) > 0 && Number(variant.purchasePrice) > 0 ? (variant.sellingPrice - variant.purchasePrice) : 0).toFixed(2)} ({(Number(variant.sellingPrice) > 0 && Number(variant.purchasePrice) > 0 ? (((variant.sellingPrice - variant.purchasePrice) / variant.purchasePrice) * 100) : 0).toFixed(2)}%)
                          </span>
                        </span>
                      </div>

                      {!trackBatchNo && (
                        <>
                          {/* opening quantity */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              width: "180px",
                            }}
                            className="col-1"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--Black-Grey, #727681)",
                                  fontSize: "12px",
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "14.40px",
                                }}
                              >
                                Opening Quantity <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                              </span>
                            </div>
                            <div
                              style={{
                                height: "40px",
                                padding: "0 12px",
                                background: "white",
                                borderRadius: "8px",
                                border: (highlightedFields.includes(`variant_${index}_openingQuantity`) || highlightedFields.includes(`variant_${index}_serialNumber`) || highlightedFields.includes("openingQuantity") || highlightedFields.includes("serialNumber")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "8px",
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flex: 1
                                }}
                              >
                                <input
                                  type="number"
                                  placeholder="00"
                                  name="openingQuantity"
                                  value={variant.openingQuantity || ""}
                                  onChange={(e) => handleVariantChange(index, "openingQuantity", e.target.value)}
                                  disabled={isEdit}
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    color: "var(--Black-Black, #0E101A)",
                                    fontSize: "14px",
                                    fontFamily: "Inter",
                                    fontWeight: "400",
                                    outline: "none",
                                  }}
                                />
                              </div>

                              {trackSerialNo && !isEdit && (
                                <button
                                  type="button"
                                  style={{
                                    padding: "4px 6px",
                                    background: "var(--Blue, #1F7FFF)",
                                    borderRadius: "4px",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "80px",
                                  }}
                                  onClick={() => {
                                    setCurrentVariantIndex(index);
                                    setAddSerialPopup(true);
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "var(--White, white)",
                                      fontSize: "14px",
                                      fontFamily: "Inter",
                                      fontWeight: "400",
                                    }}
                                  >
                                    Serial No.
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Available quantity */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              width: "180px",
                            }}
                            className="col-1"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--Black-Grey, #727681)",
                                  fontSize: "12px",
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "14.40px",
                                }}
                              >
                                Available Quantity <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                              </span>
                            </div>
                            <div
                              style={{
                                height: "40px",
                                padding: "0 12px",
                                background: "white",
                                borderRadius: "8px",
                                border: (highlightedFields.includes(`variant_${index}_openingQuantity`) || highlightedFields.includes(`variant_${index}_serialNumber`) || highlightedFields.includes("openingQuantity") || highlightedFields.includes("serialNumber")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                justifyContent: "space-between",
                                alignItems: "center",
                                gap: "8px",
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flex: 1
                                }}
                              >
                                <input
                                  type="number"
                                  placeholder="00"
                                  name="stockQuantity"
                                  value={variant.stockQuantity || ""}
                                  onChange={(e) => handleVariantChange(index, "stockQuantity", e.target.value)}
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    color: "var(--Black-Black, #0E101A)",
                                    fontSize: "14px",
                                    fontFamily: "Inter",
                                    fontWeight: "400",
                                    outline: "none",
                                  }}
                                />
                              </div>

                              {trackSerialNo && (
                                <button
                                  type="button"
                                  style={{
                                    padding: "4px 6px",
                                    background: "var(--Blue, #1F7FFF)",
                                    borderRadius: "4px",
                                    border: "none",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "80px",
                                  }}
                                  onClick={() => {
                                    setCurrentVariantIndex(index);
                                    setAddSerialPopup(true);
                                  }}
                                >
                                  <span
                                    style={{
                                      color: "var(--White, white)",
                                      fontSize: "14px",
                                      fontFamily: "Inter",
                                      fontWeight: "400",
                                    }}
                                  >
                                    Serial No.
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* min stock to maintain */}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              width: "150px",
                            }}
                            className="col-1"
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--Black-Grey, #727681)",
                                  fontSize: "12px",
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "14.40px",
                                }}
                              >
                                Min. Stock to Maintain <span style={{ color: "var(--Danger, #D00003)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px", }}>*</span>
                              </span>
                            </div>
                            <div
                              style={{
                                height: "40px",
                                padding: "0 12px",
                                background: "white",
                                borderRadius: "8px",
                                border: (highlightedFields.includes(`variant_${index}_minStockToMaintain`) || highlightedFields.includes("minStockToMaintain")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: "8px",
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <input
                                  type="number"
                                  placeholder="00"
                                  name="minStockToMaintain"
                                  value={variant.minStockToMaintain || ""}
                                  onChange={(e) => handleVariantChange(index, "minStockToMaintain", e.target.value)}
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    color: "var(--Black-Black, #0E101A)",
                                    fontSize: "14px",
                                    fontFamily: "Inter",
                                    fontWeight: "400",
                                    outline: "none",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Discount Section */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "150px",
                        }}
                        className="col-2"
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "baseline",
                            gap: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: "var(--Black-Grey, #727681)",
                              fontSize: "12px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            Discount Price
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }} className="">
                          <div
                            style={{
                              height: "40px",
                              paddingLeft: "8px",
                              background: "var(--White, white)",
                              borderRadius: "8px",
                              border: (highlightedFields.includes(`variant_${index}_discountAmount`) || highlightedFields.includes("discountValue")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--Stroke, #EAEAEA) solid",
                              justifyContent: "space-between",
                              display: "flex",
                              position: "relative",
                            }}
                          >
                            <input
                              type="number"
                              placeholder="00"
                              name="discountAmount"
                              value={variant.discountAmount || ""}
                              onChange={(e) => handleVariantChange(index, "discountAmount", e.target.value)}
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                overflow: "hidden",
                                outline: "none",
                              }}
                            />
                            <div
                              style={{
                                paddingRight: "4px",
                                background: "var(--Spinning-Frame, #E9F0F4)",
                                borderTopRightRadius: "8px",
                                borderBottomRightRadius: "8px",
                                border: "1px var(--Stroke, #C2C9D1) solid",
                                justifyContent: "center",
                                alignItems: "center",
                                display: "flex",
                                padding: "6px",
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--Black-Secondary, #6C748C)",
                                  fontSize: "14px",
                                  fontFamily: "Poppins",
                                  fontWeight: "400",
                                }}
                              >
                                <select
                                  name="discountType"
                                  value={variant.discountType || ""}
                                  onChange={(e) => handleVariantChange(index, "discountType", e.target.value)}
                                  style={{
                                    color: "var(--Black-Secondary, #6C748C)",
                                    fontSize: "14px",
                                    fontFamily: "Poppins",
                                    fontWeight: "400",
                                    border: "none",
                                    background: "transparent",
                                    outline: "none",
                                  }}
                                >
                                  {/* <option value="">Select</option> */}
                                  <option value="Fixed">₹</option>
                                  <option value="Percentage">%</option>
                                </select>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* barcode */}
                      {settings.itembarcode && (() => {
                        const barcodeValue = String(variant?.barcode || "").trim() || (index === 0 ? String(formData.itemBarcode || "").trim() : "");
                        const invalidLen = barcodeValue.length > 0 && barcodeValue.length < 13;
                        const shouldHighlight = highlightedFields.includes(`variant_${index}_itemBarcode`) || (index === 0 && highlightedFields.includes("itemBarcode"));

                        return (
                          <div
                            style={{
                              width: "200px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "baseline",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--Black-Grey, #727681)",
                                  fontSize: "12px",
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "14.40px",
                                }}
                              >
                                {listTab === "Lot / Batch" ? "Barcode" : `Barcode of Variant: ${index + 1}`}
                              </span>
                              <span
                                style={{
                                  color: "var(--Danger, #D00003)",
                                  fontSize: "12px",
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "14.40px",
                                }}
                              >
                                *
                              </span>
                            </div>

                            <div
                              style={{
                                height: "40px",
                                padding: "0 12px",
                                background: "white",
                                borderRadius: "8px",
                                border: (shouldHighlight || invalidLen) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  maxLength={13}
                                  value={barcodeValue}
                                  onChange={(e) => handleVariantBarcodeChange(index, e.target.value)}
                                  placeholder="Enter 13 digit code"
                                  style={{
                                    width: "100%",
                                    border: "none",
                                    background: "transparent",
                                    color: "var(--Black-Black, #0E101A)",
                                    fontSize: "14px",
                                    fontFamily: "Inter",
                                    fontWeight: "400",
                                    outline: "none",
                                  }}
                                />
                              </div>
                              <div>
                                {!isEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateBarcode(index)}
                                    style={{
                                      padding: "4px 6px",
                                      background: "var(--Blue, #1F7FFF)",
                                      borderRadius: "4px",
                                      border: "none",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "var(--White, white)",
                                        fontSize: "14px",
                                        fontFamily: "Inter",
                                        fontWeight: "400",
                                      }}
                                    >
                                      Auto
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                            {invalidLen && (
                              <div style={{ color: "var(--Danger, #D00003)", fontSize: 12, fontFamily: "Inter", fontWeight: 400 }}>
                                Enter 13 digit code
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* batch popup button */}
                      {trackBatchNo && (
                        <div
                          style={{
                            gap: "4px",
                            width: "90px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          className="col-1"
                        >
                          <button
                            type="button"
                            style={{
                              padding: "4px 6px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "90px",
                              border: 'none',
                              background: 'transparent',
                            }}
                            onClick={() => {
                              setCurrentVariantIndex(index);
                              setShowBatchPopup(true);
                            }}
                          >
                            <span
                              style={{
                                color: "#1F7FFF",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                              }}>
                              {variant.lotNumber ? `Batch: ${variant.lotNumber}` : "+ Batch"}
                            </span>
                          </button>
                        </div>
                      )}

                      {/* expiry date */}
                      {trackExpiry && !trackBatchNo && (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "150px",
                          }}
                          className="col-1"
                        >
                          <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                            <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>
                              Expiry Date
                            </span>
                          </div>
                          <div
                            style={{
                              height: "40px",
                              padding: "0 12px",
                              background: "white",
                              borderRadius: "8px",
                              border: highlightedFields.includes(`variant_${index}_expiryDate`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                              justifyContent: "flex-start",
                              alignItems: "center",
                              gap: "8px",
                              display: "flex",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", width: '100%' }}>
                              <input
                                type="date"
                                placeholder="31/12/2026"
                                value={variant.expiryDate || ""}
                                onChange={(e) => handleVariantChange(index, "expiryDate", e.target.value)}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  background: "transparent",
                                  color: "var(--Black-Black, #0E101A)",
                                  fontSize: "14px",
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* enter serial numbers popup */}
                      {addserialpopup && currentVariantIndex !== null && (
                        <div
                          style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.35)",
                            backdropFilter: "blur(2px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 99999999,
                          }}
                          onClick={() => setAddSerialPopup(false)}
                        >
                          {/* Modal Box */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: "100%",
                              maxWidth: "780px",
                              background: "#F7F9FC",
                              borderRadius: "12px",
                              border: "1px solid #E5E7EB",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                              padding: "20px",
                            }}
                          >
                            {/* Header */}
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                marginBottom: "14px",
                                color: "#111827",
                              }}
                            >
                              Added {variants[currentVariantIndex]?.serialNumbers?.length || 0} Serial Numbers ({variants[currentVariantIndex]?.serialNumbers?.length || 0} Quantities)
                            </div>

                            {/* Content Card */}
                            <div
                              style={{
                                background: "#ffffff",
                                borderRadius: "10px",
                                padding: "16px",
                                border: "1px solid #E5E7EB",
                              }}
                            >
                              <div style={{ width: "100%" }}>
                                {/* Serial Manager */}
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "14px",
                                  }}
                                >
                                  {/* Input Row */}
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: "10px",
                                      alignItems: "center",
                                    }}
                                  >
                                    <input
                                      type="number"
                                      placeholder="Enter serial (comma / new line supported)"
                                      value={serialInput}
                                      onChange={(e) => setSerialInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          handleAddSerial();
                                        }
                                      }}
                                      onPaste={(e) => {
                                        const pasted = e.clipboardData.getData("text");
                                        if (pasted.includes(",") || pasted.includes("\n")) {
                                          e.preventDefault();
                                          handleBulkAddSerials(pasted);
                                        }
                                      }}
                                      // placeholder=" Enter serial no/ Paste Serial"
                                      style={{
                                        flex: 1,
                                        height: "40px",
                                        border: "1px solid #D1D5DB",
                                        borderRadius: "8px",
                                        padding: "0 12px",
                                        fontSize: "14px",
                                        outline: "none",
                                      }}
                                    />

                                    <button
                                      type="button"
                                      onClick={handleAddSerial}
                                      style={{
                                        height: "40px",
                                        padding: "0 18px",
                                        background: "#111827",
                                        color: "#fff",
                                        borderRadius: "8px",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                      }}
                                    >
                                      Add
                                    </button>
                                  </div>

                                  {/* Controls */}
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "16px",
                                      fontSize: "13px",
                                      color: "#374151",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => fileRef.current.click()}
                                      style={{
                                        padding: "6px 10px",
                                        background: "#EAEAEA",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                      }}
                                    >
                                      Upload CSV
                                    </button>
                                    <button
                                      type="button"
                                      onClick={downloadCSVTemplate}
                                      style={{
                                        padding: "6px 10px",
                                        background: "#EAEAEA",
                                        border: "1px solid #ccc",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                        fontSize: "13px",
                                      }}
                                    >
                                      ⬇ Download CSV Template
                                    </button>

                                    {/* <div style={{ marginLeft: "auto", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>Total: {serialList.length}</span>
                  {currentVariantIndex !== null && variants[currentVariantIndex]?.openingQuantity && (
                    <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 400 }}>
                      / {variants[currentVariantIndex].openingQuantity}
                    </span>
                  )}
                </div> */}
                                  </div>

                                  {/* CSV / EXCEL Upload */}
                                  <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    style={{ display: "none" }}
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        handleExcelUpload(file);
                                        e.target.value = ""; // same file re-upload fix
                                      }
                                    }}
                                  />

                                  {/* List */}
                                  <div
                                    style={{
                                      border: "1px solid #E5E7EB",
                                      borderRadius: "8px",
                                      maxHeight: "280px",
                                      overflowY: "auto",
                                    }}
                                  >
                                    {(variants[currentVariantIndex]?.serialNumbers || []).map(
                                      (serial, sIndex) => (
                                        <div
                                          key={sIndex}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "10px 12px",
                                            borderBottom: "1px solid #E5E7EB",
                                            fontSize: "13px",
                                          }}
                                        >
                                          <div style={{ fontWeight: 500 }}>
                                            {sIndex + 1}. {serial}
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              alignItems: "center",
                                              gap: "10px",
                                            }}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveSerial(sIndex)}
                                              style={{
                                                background: "none",
                                                border: "none",
                                                color: "#DC2626",
                                                fontSize: "16px",
                                                cursor: "pointer",
                                              }}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Done */}
                            <div style={{ alignItems: "center", marginTop: "12px", display: 'flex', justifyContent: 'end' }}>
                              <button
                                onClick={() => setAddSerialPopup(false)}
                                style={{
                                  padding: "4px 6px",
                                  background: "var(--Blue, #1F7FFF)",
                                  borderRadius: "4px",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "end",
                                }}
                              >
                                <span style={{ color: 'white' }}>Done</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* batch popup */}
                      {showBatchPopup && currentVariantIndex !== null && (
                        <div
                          style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.35)",
                            backdropFilter: "blur(2px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 99999999,
                          }}
                          onClick={() => setShowBatchPopup(false)}
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              // width: "100%",
                              width: "1100px",
                              background: "#F7F9FC",
                              borderRadius: "12px",
                              border: "1px solid #E5E7EB",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                marginBottom: "14px",
                                color: "#111827",
                              }}
                            >
                              Batch Details {formData.productType === "Variant" && ` : Variant ${currentVariantIndex + 1}`}
                            </div>

                            <div
                              style={{
                                background: "#ffffff",
                                borderRadius: "10px",
                                padding: "16px",
                                border: "1px solid #E5E7EB",
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                              }}
                            >
                              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                {/* Batch No. */}
                                <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)", fontFamily: "Inter" }}>Batch No.</div>
                                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px var(--White-Stroke, #EAEAEA) solid", display: "flex", alignItems: "center" }}>
                                    <input
                                      type="number"
                                      placeholder="Batch No."
                                      value={variants[currentVariantIndex]?.lotNumber || ""}
                                      onChange={(e) => handleVariantChange(currentVariantIndex, "lotNumber", e.target.value)}
                                      style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", fontFamily: "Inter" }}
                                    />
                                  </div>
                                </div>

                                {/* Model no. */}
                                <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)", fontFamily: "Inter" }}>Model No.</div>
                                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px var(--White-Stroke, #EAEAEA) solid", display: "flex", alignItems: "center" }}>
                                    <input
                                      type="text"
                                      placeholder="Model No."
                                      value={variants[currentVariantIndex]?.modelNo || ""}
                                      onChange={(e) => handleVariantChange(currentVariantIndex, "modelNo", e.target.value)}
                                      style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", fontFamily: "Inter" }}
                                    />
                                  </div>
                                </div>

                                {/* Opening Quantity */}
                                <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)", fontFamily: "Inter" }}>Opening Quantity</div>
                                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px var(--White-Stroke, #EAEAEA) solid", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                    <input
                                      type="number"
                                      placeholder="00"
                                      value={variants[currentVariantIndex]?.openingQuantity || ""}
                                      onChange={(e) => handleVariantChange(currentVariantIndex, "openingQuantity", e.target.value)}
                                      disabled={isEdit}
                                      style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", fontFamily: "Inter" }}
                                    />
                                    {!isEdit && <button
                                      type="button"
                                      onClick={() => {
                                        setShowBatchPopup(false);
                                        setAddSerialPopup(true);
                                      }}
                                      style={{
                                        padding: "4px 6px",
                                        background: "var(--Blue, #1F7FFF)",
                                        borderRadius: "4px",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "80px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "var(--White, white)",
                                          fontSize: "14px",
                                          fontFamily: "Inter",
                                          fontWeight: "400",
                                        }}
                                      >
                                        Serial No.
                                      </span>
                                    </button>}
                                  </div>
                                </div>

                                {/* available quantity */}
                                {isEdit && <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)", fontFamily: "Inter" }}>Available Quantity</div>
                                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px var(--White-Stroke, #EAEAEA) solid", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                                    <input
                                      type="number"
                                      placeholder="00"
                                      value={variants[currentVariantIndex]?.stockQuantity || ""}
                                      onChange={(e) => handleVariantChange(currentVariantIndex, "stockQuantity", e.target.value)}
                                      style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", fontFamily: "Inter" }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setShowBatchPopup(false);
                                        setAddSerialPopup(true);
                                      }}
                                      style={{
                                        padding: "4px 6px",
                                        background: "var(--Blue, #1F7FFF)",
                                        borderRadius: "4px",
                                        border: "none",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "80px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "var(--White, white)",
                                          fontSize: "14px",
                                          fontFamily: "Inter",
                                          fontWeight: "400",
                                        }}
                                      >
                                        Serial No.
                                      </span>
                                    </button>
                                  </div>
                                </div>}

                                {/* Min. Stock to Maintain */}
                                <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)", fontFamily: "Inter" }}>Min. Stock to Maintain</div>
                                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px var(--White-Stroke, #EAEAEA) solid", display: "flex", alignItems: "center" }}>
                                    <input
                                      type="number"
                                      placeholder="00"
                                      value={variants[currentVariantIndex]?.minStockToMaintain || ""}
                                      onChange={(e) => handleVariantChange(currentVariantIndex, "minStockToMaintain", e.target.value)}
                                      style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", fontFamily: "Inter" }}
                                    />
                                  </div>
                                </div>

                              </div>

                              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                                {/* Manufacturing Date */}
                                <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)", fontFamily: "Inter" }}>Manufacturing Date</div>
                                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px var(--White-Stroke, #EAEAEA) solid", display: "flex", alignItems: "center" }}>
                                    <input
                                      type="date"
                                      value={variants[currentVariantIndex]?.manufacturingDate || ""}
                                      onChange={(e) => handleVariantChange(currentVariantIndex, "manufacturingDate", e.target.value)}
                                      style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px", fontFamily: "Inter" }}
                                    />
                                  </div>
                                </div>

                                {/* Expiry Date */}
                                <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)", fontFamily: "Inter" }}>Expiry Date</div>
                                  <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px var(--White-Stroke, #EAEAEA) solid", display: "flex", alignItems: "center" }}>
                                    <input
                                      type="date"
                                      placeholder="31/12/2026"
                                      value={variants[currentVariantIndex]?.expiryDate || ""}
                                      onChange={(e) => handleVariantChange(currentVariantIndex, "expiryDate", e.target.value)}
                                      style={{
                                        width: "100%",
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--Black-Black, #0E101A)",
                                        fontSize: "14px",
                                        fontFamily: "Inter",
                                        fontWeight: "400",
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>

                            </div>

                            <div style={{ alignItems: "center", marginTop: "12px", display: 'flex', justifyContent: 'end' }}>
                              <button
                                type="button"
                                onClick={() => setShowBatchPopup(false)}
                                style={{
                                  padding: "4px 6px",
                                  background: "var(--Blue, #1F7FFF)",
                                  borderRadius: "4px",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "end",
                                }}
                              >
                                <span style={{ color: 'white' }}>Done</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* warranty popup button */}
                      {trackWarranty && (
                        <div
                          style={{
                            gap: "4px",
                            width: "90px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          className="col-1"
                        >
                          <button
                            type="button"
                            style={{
                              padding: "4px 6px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "90px",
                              border: 'none',
                              background: 'transparent',
                            }}
                            onClick={() => openWarrantyPopup(index)}
                          >
                            <span
                              style={{
                                color: "#1F7FFF",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                              }}
                            >
                              + Warranty
                            </span>
                          </button>
                        </div>
                      )}

                      {/* warranty popup */}
                      {currentVariantIndex === index && trackWarranty && showWarrantyPopup && (
                        <div
                          style={{
                            position: "fixed",
                            inset: 0,
                            background: "rgba(0,0,0,0.35)",
                            backdropFilter: "blur(2px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            zIndex: 99999999,
                          }}
                          onClick={() => setShowWarrantyPopup(false)}
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              width: "1100px",
                              background: "#F7F9FC",
                              borderRadius: "12px",
                              border: "1px solid #E5E7EB",
                              boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                              padding: "20px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "18px",
                                fontWeight: 600,
                                marginBottom: "14px",
                                color: "#111827",
                              }}
                            >
                              Warranty Details {formData.productType === "Variant" && ` : Variant ${currentVariantIndex + 1}`}
                            </div>

                            <div className=""
                              style={{
                                background: "#ffffff",
                                borderRadius: "10px",
                                padding: "16px",
                                border: "1px solid #E5E7EB",
                                display: "flex",
                                flexDirection: "column",
                                gap: "14px",
                              }}>
                              {/* warranty header */}
                              <div
                                style={{
                                  color: "black",
                                  fontSize: "16px",
                                  fontFamily: "Inter",
                                  fontWeight: "500",
                                  // lineHeight: "19.20px",
                                }}
                              >
                                Add Warranty Details
                              </div>

                              {/* Warranty select */}
                              <div
                                style={{
                                  display: "flex",
                                  gap: "16px",
                                  // marginTop:'16px',
                                  width: '100%',
                                  overflowX: 'auto',
                                  padding: '16px 0px 0px 0px',
                                }}
                              // className="row"
                              >
                                {/* warranty type */}
                                <div
                                  style={{
                                    width: "275px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "4px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "baseline",
                                      gap: "4px",
                                    }}
                                  >
                                    <span
                                      style={{
                                        color: "var(--Black-Grey, #727681)",
                                        fontSize: "12px",
                                        fontFamily: "Inter",
                                        fontWeight: "400",
                                        lineHeight: "14.40px",
                                      }}
                                    >
                                      Warranty Type
                                    </span>
                                  </div>
                                  <div
                                    style={{
                                      height: "40px",
                                      padding: "0 12px",
                                      background: "white",
                                      borderRadius: "8px",
                                      border: "1px var(--White-Stroke, #EAEAEA) solid",
                                      justifyContent: "flex-start",
                                      alignItems: "center",
                                      gap: "8px",
                                      display: "flex",
                                    }}
                                  >
                                    <select
                                      name="warrantyType"
                                      value={warrantyType}
                                      onChange={(e) => setWarrantyType(e.target.value)}
                                      style={{
                                        width: "100%",
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--Black-Black, #0E101A)",
                                        fontSize: "14px",
                                        fontFamily: "Inter",
                                        fontWeight: "400",
                                        outline: "none",
                                      }}
                                    >
                                      <option value="">Select Warranty Type</option>
                                      <option value="Manufacturing">Manufacturing Warranty</option>
                                      <option value="Extended">Extended Warranty</option>
                                      <option value="Lifetime">Lifetime Warranty</option>
                                    </select>
                                  </div>
                                </div>

                              </div>

                              {/* open according to selected warranty type */}
                              <div>
                                {warrantyType === "Manufacturing" && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0px 0px 0px 0px', marginTop: '24px', }}>

                                    {/* warranty period */}
                                    <div
                                      style={{
                                        width: "275px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "baseline",
                                          gap: "4px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            color: "var(--Black-Grey, #727681)",
                                            fontSize: "12px",
                                            fontFamily: "Inter",
                                            fontWeight: "400",
                                            lineHeight: "14.40px",
                                          }}
                                        >
                                          Warranty Period
                                        </span>

                                      </div>
                                      <div
                                        style={{
                                          height: "40px",
                                          padding: "0 12px",
                                          background: "white",
                                          borderRadius: "8px",
                                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                                          justifyContent: "flex-start",
                                          alignItems: "center",
                                          gap: "8px",
                                          display: "flex",
                                        }}
                                      >
                                        <select
                                          name="warrantyPeriod"
                                          value={warrantyPeriod}
                                          onChange={(e) => setWarrantyPeriod(e.target.value)}
                                          style={{
                                            width: "100%",
                                            border: "none",
                                            background: "transparent",
                                            color: "var(--Black-Black, #0E101A)",
                                            fontSize: "14px",
                                            fontFamily: "Inter",
                                            fontWeight: "400",
                                            outline: "none",
                                          }}
                                        >
                                          <option value="">Select Warranty Period</option>
                                          <option value="1">1 Month</option>
                                          <option value="3">3 Month</option>
                                          <option value="6">6 Month</option>
                                          <option value="12">12 Month</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* coverage scope */}
                                    <div
                                      style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "2px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "baseline",
                                          gap: "4px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            color: "var(--Black-Grey, #727681)",
                                            fontSize: "12px",
                                            fontFamily: "Inter",
                                            fontWeight: "400",
                                            lineHeight: "14.40px",
                                          }}
                                        >
                                          Coverage Scope
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          height: "40px",
                                          background: "white",
                                          borderRadius: "8px",
                                          border: (highlightedFields.includes("coverageScope") || highlightedFields.includes("variant_0_coverageScope")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "none",
                                          justifyContent: "flex-start",
                                          alignItems: "center",
                                          gap: "52px",
                                          display: "flex",
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input
                                            type="radio"
                                            name="coverageScope"
                                            checked={warrantyDetails.coverageScope === "Parts"}
                                            onChange={() => setWarrantyDetails(prev => ({ ...prev, coverageScope: "Parts" }))}
                                            style={{
                                              width: 15,
                                              height: 15,
                                              accentColor: "#1F7FFF",
                                              cursor: "pointer",
                                            }}
                                          />
                                          <lable style={{ color: 'black' }}>Parts</lable>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input
                                            type="radio"
                                            name="coverageScope"
                                            checked={warrantyDetails.coverageScope === "Labour"}
                                            onChange={() => setWarrantyDetails(prev => ({ ...prev, coverageScope: "Labour" }))}
                                            style={{
                                              width: 15,
                                              height: 15,
                                              accentColor: "#1F7FFF",
                                              cursor: "pointer",
                                            }}
                                          />
                                          <lable style={{ color: 'black' }}>Labour</lable>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input
                                            type="radio"
                                            name="coverageScope"
                                            checked={warrantyDetails.coverageScope === "Parts + Labour"}
                                            onChange={() => setWarrantyDetails(prev => ({ ...prev, coverageScope: "Parts + Labour" }))}
                                            style={{
                                              width: 15,
                                              height: 15,
                                              accentColor: "#1F7FFF",
                                              cursor: "pointer",
                                            }}
                                          />
                                          <lable style={{ color: 'black' }}>Parts + Labour</lable>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input
                                            type="radio"
                                            name="coverageScope"
                                            checked={warrantyDetails.coverageScope === "Replacement Only"}
                                            onChange={() => setWarrantyDetails(prev => ({ ...prev, coverageScope: "Replacement Only" }))}
                                            style={{
                                              width: 15,
                                              height: 15,
                                              accentColor: "#1F7FFF",
                                              cursor: "pointer",
                                            }}
                                          />
                                          <lable style={{ color: 'black' }}>Replacement Only</lable>
                                        </div>

                                      </div>
                                    </div>

                                    {/* service mode */}
                                    <div
                                      style={{
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "2px",
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: "flex",
                                          alignItems: "baseline",
                                          gap: "4px",
                                        }}
                                      >
                                        <span
                                          style={{
                                            color: "var(--Black-Grey, #727681)",
                                            fontSize: "12px",
                                            fontFamily: "Inter",
                                            fontWeight: "400",
                                            lineHeight: "14.40px",
                                          }}
                                        >
                                          Service Mode
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          height: "40px",
                                          background: "white",
                                          borderRadius: "8px",
                                          border: (highlightedFields.includes("serviceMode") || highlightedFields.includes("variant_0_serviceMode")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "none",
                                          justifyContent: "flex-start",
                                          alignItems: "center",
                                          gap: "52px",
                                          display: "flex",
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input
                                            type="radio"
                                            name="serviceMode"
                                            checked={warrantyDetails.serviceMode === "Carry In"}
                                            onChange={() => setWarrantyDetails(prev => ({ ...prev, serviceMode: "Carry In" }))}
                                            style={{
                                              width: 15,
                                              height: 15,
                                              accentColor: "#1F7FFF",
                                              cursor: "pointer",
                                            }}
                                          />
                                          <lable style={{ color: 'black' }}>Carry In</lable>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input
                                            type="radio"
                                            name="serviceMode"
                                            checked={warrantyDetails.serviceMode === "On-Site"}
                                            onChange={() => setWarrantyDetails(prev => ({ ...prev, serviceMode: "On-Site" }))}
                                            style={{
                                              width: 15,
                                              height: 15,
                                              accentColor: "#1F7FFF",
                                              cursor: "pointer",
                                            }}
                                          />
                                          <lable style={{ color: 'black' }}>On-Site</lable>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                          <input
                                            type="radio"
                                            name="serviceMode"
                                            checked={warrantyDetails.serviceMode === "Pickup & Drop"}
                                            onChange={() => setWarrantyDetails(prev => ({ ...prev, serviceMode: "Pickup & Drop" }))}
                                            style={{
                                              width: 15,
                                              height: 15,
                                              accentColor: "#1F7FFF",
                                              cursor: "pointer",
                                            }}
                                          />
                                          <lable style={{ color: 'black' }}>Pickup & Drop</lable>
                                        </div>

                                      </div>
                                    </div>

                                    {/* clame section */}
                                    <div
                                      style={{
                                        gap: '16px',
                                        width: "100%",
                                        display: "flex",
                                        flexWrap: 'wrap'
                                      }}
                                    >

                                      {/* Max Claims Allowed */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Max Claims Allowed
                                          </span>
                                          <span
                                            style={{
                                              color: "var(--Danger, #D00003)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            *
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: (highlightedFields.includes("maxClaimsAllowed") || highlightedFields.includes("variant_0_maxClaimsAllowed")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <input
                                            type="number"
                                            name="maxClaimsAllowed"
                                            placeholder="eg., 1,2,3"
                                            value={warrantyDetails.maxClaimsAllowed}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, maxClaimsAllowed: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          />
                                        </div>
                                      </div>

                                      {/* Inspection Required */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Inspection Required
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <select
                                            name="inspectionRequired"
                                            value={warrantyDetails.inspectionRequired}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, inspectionRequired: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                          </select>
                                        </div>
                                      </div>

                                      {/* Warranty Starts From* */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Warranty Starts From
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <select
                                            name="warrantyStartsFrom"
                                            value={warrantyDetails.warrantyStartsFrom}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, warrantyStartsFrom: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="Invoice Date">Invoice Date (Recommended)</option>
                                            <option value="Delivery Date">Delivery Date</option>
                                          </select>
                                        </div>
                                      </div>

                                    </div>
                                  </div>
                                )}

                                {warrantyType === "Extended" && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0px 0px 0px 0px', marginTop: '24px', }}>

                                    {/* linked */}
                                    <div
                                      style={{
                                        rowGap: "20px",
                                        columnGap: '16px',
                                        width: "100%",
                                        display: "flex",
                                        flexWrap: 'wrap'
                                      }}
                                    >

                                      {/* linked to */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Linked to
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_linkedto") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <input
                                            type="text"
                                            name="linkedto"
                                            placeholder="Manufacturer Warranty"
                                            value={warrantyDetails.linkedto}
                                            // onChange={(e) => setWarrantyDetails(prev => ({ ...prev, linkedto: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          />
                                        </div>
                                      </div>

                                      {/* extension period */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Extension Period
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_extensionPeriod") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <select
                                            name="extensionPeriod"
                                            value={warrantyDetails.extensionPeriod}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, extensionPeriod: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="6 Month">6 Month</option>
                                            <option value="12 Month">12 Month</option>
                                          </select>
                                        </div>
                                      </div>

                                    </div>

                                    {/* coverage */}
                                    <div
                                      style={{
                                        rowGap: "20px",
                                        columnGap: '16px',
                                        width: "100%",
                                        display: "flex",
                                        flexWrap: 'wrap'
                                      }}
                                    >

                                      {/* coverage type * */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Coverage Type
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_coverageType") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <select
                                            name="coverageType"
                                            value={warrantyDetails.coverageType}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, coverageType: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="Same As Manufacturer">Same As Manufacturer</option>
                                          </select>
                                        </div>
                                      </div>

                                      {/* extended warranty period */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Extended Warranty Price
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_extendedWarrantyPrice") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <input
                                            type="number"
                                            name="extendedWarrantyPrice"
                                            placeholder="Enter Warranty Price"
                                            value={warrantyDetails.extendedWarrantyPrice}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, extendedWarrantyPrice: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          />
                                        </div>
                                      </div>

                                    </div>
                                  </div>
                                )}

                                {warrantyType === "Lifetime" && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0px 0px 0px 0px', marginTop: '24px', }}>

                                    {/* warning */}
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: '1px solid #1F7FFF', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#E5F0FF' }}>
                                        <FaCircleExclamation style={{ color: '#1F7FFF' }} /> <span style={{ color: '#1F7FFF' }}>Lifetime ≠ forever without rules. You must define scope, or claims will explode.</span>
                                      </div>
                                    </div>

                                    {/* lifetime defination */}
                                    <div
                                      style={{
                                        rowGap: "20px",
                                        columnGap: '16px',
                                        width: "100%",
                                        display: "flex",
                                        flexWrap: 'wrap'
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Lifetime defination
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_lifetimeDefination") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <select
                                            name="lifetimeDefination"
                                            value={warrantyDetails.lifetimeDefination}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, lifetimeDefination: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="Product Manufacturing Life">Product Manufacturing Life</option>
                                            <option value="Brand Support Life">Brand Support Life</option>
                                            <option value="Fixed Years">Fixed Years</option>
                                          </select>
                                        </div>
                                      </div>

                                    </div>

                                    {/* coverage of */}
                                    <div
                                      style={{
                                        rowGap: "20px",
                                        columnGap: '16px',
                                        width: "100%",
                                        display: "flex",
                                        flexWrap: 'wrap'
                                      }}
                                    >

                                      {/* coverage of */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Coverage of
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_coverageOf") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <select
                                            name="coverageOf"
                                            value={warrantyDetails.coverageOf}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, coverageOf: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="Manufacturing Defects Only">Manufacturing Defects Only</option>
                                            <option value="Structural Parts Only">Structural Parts Only</option>
                                            <option value="Limited Replacement">Limited Replacement</option>
                                          </select>
                                        </div>
                                      </div>

                                      {/* what is not covered */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            What is Not Covered
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_whatNotCovered") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <select
                                            name="whatNotCovered"
                                            value={warrantyDetails.whatNotCovered}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, whatNotCovered: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="Wear & Tear">Wear & Tear</option>
                                            <option value="Consumables">Consumables</option>
                                            <option value="Accessories">Accessories</option>
                                          </select>
                                        </div>
                                      </div>

                                      {/* max claims */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Max Claims
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_maxClaims") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <input
                                            type="text"
                                            name="maxClaims"
                                            placeholder="eh., 1,3,6"
                                            value={warrantyDetails.maxClaims}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, maxClaims: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          />
                                        </div>
                                      </div>

                                      {/* replacement once only */}
                                      <div
                                        style={{
                                          width: "275px",
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "4px",
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "baseline",
                                            gap: "4px",
                                          }}
                                        >
                                          <span
                                            style={{
                                              color: "var(--Black-Grey, #727681)",
                                              fontSize: "12px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              lineHeight: "14.40px",
                                            }}
                                          >
                                            Replacement Once only?
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            height: "40px",
                                            padding: "0 12px",
                                            background: "white",
                                            borderRadius: "8px",
                                            border: highlightedFields.includes("variant_0_replacementOnceOnly") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: "8px",
                                            display: "flex",
                                          }}
                                        >
                                          <select
                                            name="replacementOnceOnly"
                                            value={warrantyDetails.replacementOnceOnly}
                                            onChange={(e) => setWarrantyDetails(prev => ({ ...prev, replacementOnceOnly: e.target.value }))}
                                            style={{
                                              width: "100%",
                                              border: "none",
                                              background: "transparent",
                                              color: "var(--Black-Black, #0E101A)",
                                              fontSize: "14px",
                                              fontFamily: "Inter",
                                              fontWeight: "400",
                                              outline: "none",
                                            }}
                                          >
                                            <option value="">Select</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                          </select>
                                        </div>
                                      </div>

                                    </div>
                                  </div>
                                )}
                              </div>

                            </div>

                            <div style={{ alignItems: "center", marginTop: "12px", display: 'flex', justifyContent: 'end' }}>
                              <button
                                type="button"
                                onClick={saveWarrantyDetails}
                                style={{
                                  padding: "4px 6px",
                                  background: "var(--Blue, #1F7FFF)",
                                  borderRadius: "4px",
                                  border: "none",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "end",
                                }}
                              >
                                <span style={{ color: 'white' }}>Done</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* same details checkmark box */}
                    {index === 0 && formData.productType === "Variant" && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6C748C', padding: '4px 8px' }}>
                          <input
                            type="checkbox"
                            checked={sameDetailsAsFirstVariant}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSameDetailsAsFirstVariant(checked);
                              if (checked) {
                                setVariants((prev) => {
                                  const list = Array.isArray(prev) ? prev : [];
                                  if (list.length <= 1) return prev;
                                  const first = list[0] || {};
                                  return list.map((v, i) => (i === 0 ? v : applySameDetailsFromFirstVariant(first, v)));
                                });
                              }
                            }}
                            style={{ border: '1px solid #6C748C' }}
                          />
                          <span>Same details as first variant</span>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>

              {/* Import Images */}
              <div style={{
                width: "99%",
                borderTop: '1px solid #EAEAEA',
              }}>
                <div
                  style={{
                    width: variants.length === 1 ? "350px" : "660px",
                    marginTop: '24px',
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    border: "1px solid #EAEAEA",
                    padding: "16px",
                  }}
                >
                  <div className="d-flex justify-content-start align-items-center gap-4">
                    <div
                      style={{
                        color: "black",
                        fontSize: "16px",
                        fontFamily: "Inter",
                        fontWeight: "500",
                        marginBottom: "20px",
                      }}
                    >
                      Import Images
                    </div>
                    <div
                      style={{
                        color: "black",
                        fontSize: "16px",
                        fontFamily: "Inter",
                        fontWeight: "500",
                        marginBottom: "20px",
                      }}
                    >
                      <div
                        style={{
                          padding: "6px 10px",
                          background: "#1F7FFF",
                          color: "white",
                          fontSize: "16px",
                          fontWeight: "400",
                          border: "none",
                          borderRadius: "12px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          textDecoration: "none",
                          boxShadow:
                            "0 8px 20px rgba(31, 127, 255, 0.3), inset -1px -1px 6px rgba(0,0,0,0.2)",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <img
                          src={AiLogo}
                          alt="Ai Logo"
                          style={{ filter: "grayscale(100%) brightness(500%)" }}
                        />
                        Generate
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      // display: "flex",
                      // gap: "16px",
                      width: "100%",
                      flexWrap: "wrap",
                      marginBottom: "0px",
                      display: "grid",
                      alignItems: "flex-start",
                      justifyContent: "flex-start",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: "24px",
                    }}
                  >
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                        }}
                      >
                        <span
                          style={{
                            color: "black",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "16.80px",
                          }}
                        >
                          {/* {`Add ${isEdit ? 'More' : `Variant: ${index + 1}`} Images`} */}
                          {`Add ${isEdit ? ' More' : `${formData.productType === "Variant" ? "Variant: " + (index + 1) : ""}`} Images`}
                        </span>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            width: "300px",
                            minHeight: "150px",
                            alignItems: "center",
                            border: "2px dashed #EAEAEA",
                            borderRadius: "8px",
                            padding: '25px',
                          }}
                        >
                          {/* Existing images for this variant */}
                          {variant.existingImages?.length > 0 && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginBottom: "15px" }}>
                              <span style={{ fontSize: "12px", color: "#727681", fontWeight: "500" }}>
                                {`Existing: ${isLotMode ? `${index + 1}` : `Variant ${index + 1}`} Images`}
                              </span>
                              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "13px" }}>
                                {variant.existingImages.map((img, i) => (
                                  <div key={i} style={{ position: "relative", border: "1px solid #EAEAEA", borderRadius: "4px" }}>
                                    <img
                                      src={img.url}
                                      alt="existing"
                                      style={{ height: 100, width: 100, objectFit: "cover", borderRadius: "4px" }}
                                    />
                                    <button
                                      type="button"
                                      style={{
                                        position: "absolute",
                                        top: -5,
                                        right: -5,
                                        background: "red",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "50%",
                                        width: "18px",
                                        height: "18px",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                      }}
                                      onClick={() => {
                                        const updated = [...variants];
                                        const removedImage = updated[index].existingImages[i];
                                        updated[index].existingImages = updated[index].existingImages.filter((_, idx) => idx !== i);
                                        setVariants(updated);
                                        // Also remove from global existingImages to keep payload consistent
                                        handleRemoveExistingImage(removedImage);
                                      }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Preview OR placeholder */}
                          {variant.images?.length ? (
                            <>
                              <div className="d-flex flex-wrap gap-2" style={{ gap: 12 }}>
                                {variant.images.map((f, i) => (
                                  <div
                                    className=""
                                    key={i}
                                    style={{ position: "relative" }}
                                  >
                                    <img
                                      key={i}
                                      src={f.preview}
                                      alt="preview"
                                      className="img-thumbnail"
                                      style={{
                                        height: 100,
                                        width: 100,
                                        objectFit: "cover",
                                      }}
                                    />
                                    <button
                                      type="button"
                                      style={{
                                        cursor: "pointer",
                                        position: "absolute",
                                        top: -6,
                                        right: -0,
                                        border: "none",
                                        borderRadius: "50%",
                                        backgroundColor: "red",
                                        color: "white",
                                        width: "20px",
                                        height: "20px",
                                        lineHeight: "20px",
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleRemoveImage(index, f);
                                      }}
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                                {variant.images.length < 6 && (
                                  <label
                                    htmlFor={`variant-image-${index}`}
                                    className=""
                                    style={{
                                      height: 100,
                                      width: 100,
                                      display: "flex",
                                      justifyContent: "center",
                                      alignItems: "center",
                                      border: "2px dashed #EAEAEA",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <FcAddImage size={30} />
                                  </label>
                                )}
                              </div>
                            </>
                          ) : (
                            <label
                              htmlFor={`variant-image-${index}`}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 8,
                                color: "#727681",
                                width: "100%",
                                height: "100%",
                                cursor: "pointer",
                              }}
                            >
                              <FcAddImage size={30} />
                              <span style={{ color: "#727681" }}>
                                Drag image here or <span style={{ color: "#1F7FFF" }}>browse</span>
                              </span>
                              <span style={{ fontSize: 12, color: "#727681" }}>
                                JPEG, PNG, JPG (max 1MB)
                              </span>
                            </label>
                          )}
                          <input
                            id={`variant-image-${index}`}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => handleVariantImageChange(index, e)}
                            style={{ display: "none" }}
                          />
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              </div>

            </div>
          </div>

          {/* cancel and Save Button */}
          <div
            style={{
              width: "100%",
              justifyContent: "end",
              alignItems: "center",
              display: "flex",
              marginTop: 14,
            }}
          >
            <div
              style={{
                paddingLeft: 47,
                paddingRight: 47,
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 8,
                display: "inline-flex",
              }}
            >
              <Link
                to="/product"
                style={{
                  height: 36,
                  padding: 8,
                  background: "var(--White-Universal-White, white)",
                  boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                  borderRadius: 8,
                  outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                  outlineOffset: "-1.50px",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 4,
                  display: "flex",
                  cursor: save ? "not-allowed" : "pointer",
                }}
              >
                <div
                  style={{
                    color: "var(--Blue-Blue, #1F7FFF)",
                    fontSize: 14,
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: 5,
                    wordWrap: "break-word",
                  }}
                >
                  Cancel
                </div>
              </Link>
              <button
                type="submit"
                className="button-color button-hover d-flex justify-content-center align-items-center"
                style={{
                  height: 36,
                  padding: 8,
                  // background: "var(--Blue-Blue, #1F7FFF)",
                  boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                  borderRadius: 8,
                  // outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                  outlineOffset: "-1.50px",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 4,
                  display: "flex",
                  cursor: save ? "not-allowed" : "pointer",
                }}
                disabled={save}
              >
                <div
                  style={{
                    color: "white",
                    fontSize: 14,
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: 5,
                    wordWrap: "break-word",
                  }}
                >
                  {save ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update' : 'Save')}
                </div>
              </button>
            </div>
          </div>
        </form>
      </div >

      {showAddCategoryModel && (
        <CreateCategoryModal
          closeModal={() => {
            setShowAddCategoryModel(false);
            setCategoryName("");
            setSubCategoryName("");
            setErrors({});
          }}
          modalId="categoryModal"
          categoryName={categoryName}
          onCategoryChange={(e) => setCategoryName(e.target.value)}
          subCategoryName={subCategoryName} // ✅ ADD THIS
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onSubmit={handleSubmitCategory}
          errors={errors}
          submitLabel={[t("Save")]}
          title={[t("Add Category")]}
        />
      )}

      {
        showAddSubCategoryModel && (
          <CreateSubCategoryModel
            modelAddRef={modelAddRef}
            closeModal={() => {
              setShowAddSubCategoryModel(false);
              setSubCategoryName("");
            }}
            categoryName={selectedCategory?.label}
            subCategoryName={subCategoryName}
            onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
            onSubmit={handleAddSubCategory}
          />
        )
      }

      {
        showAddBrandModel && (
          <AddBrandModal
            fetchBrands={fetchBrands}
            closeModal={() => setShowAddBrandModel(false)}
          />
        )
      }

      {
        showAddUnitModal && (
          <AddUnitsModals
            show={showAddUnitModal}
            closeModal={() => setShowAddUnitModal(false)}
            fetchUnits={fetchUnits}
          />
        )
      }

      {
        showAddTaxModal && (
          <AddTaxModal
            show={showAddTaxModal}
            closeModal={() => setShowAddTaxModal(false)}
            fetchtaxs={fetchtaxs}
          />
        )
      }

      {
        showAddSizeModal && (
          <AddSizeModal
            show={showAddSizeModal}
            closeModal={() => setShowAddSizeModal(false)}
            fetchSizes={fetchSizes}
          />
        )
      }

      {
        showAddColorModal && (
          <AddColorModal
            show={showAddColorModal}
            closeModal={() => setShowAddColorModal(false)}
            fetchColors={fetchColors}
          />
        )
      }

      {
        showAddHSNModel && (
          <AddHSNModal
            show={showAddHSNModel}
            onClose={() => {
              setShowAddHSNModel(false);
              setHsnModalData({ hsnCode: "", description: "", gstRate: "", id: null });
              setHsnErrors({});
            }}
            modalData={hsnModalData}
            setModalData={setHsnModalData}
            onSubmit={handleHSNModalSubmit}
            errors={hsnErrors}
          />
        )
      }

    </div >
  );
};

export default ProductCreate;
