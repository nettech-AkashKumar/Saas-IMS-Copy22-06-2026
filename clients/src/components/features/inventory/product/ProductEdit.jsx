import React, { useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import BASE_URL from "../../../../pages/config/config";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { TbChevronUp, TbEye, TbRefresh } from "react-icons/tb";
import Select from "react-select";
import { MdImageSearch, MdLockOutline } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa6";
import AiLogo from "../../../../assets/images/AI.png";
import sanitizeHtml from "sanitize-html";
import api from "../../../../pages/config/axiosInstance"
import CreateCategoryModal from "../../category/CreateCategoryModel"
import CreateSubCategoryModel from "../../category/CreateSubCategoryModel";
import { FaCircleExclamation } from "react-icons/fa6";
import { BsThreeDotsVertical } from "react-icons/bs";
import { RiDeleteBinLine } from "react-icons/ri";
import { FcAddImage } from "react-icons/fc";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const regexPatterns = {
  productName: /^[a-zA-Z0-9\s\-_&()]{2,100}$/, // Alphanumeric, spaces, some special chars, 2-100 chars
  price: /^\d+(\.\d{1,2})?$/, // Positive number with up to 2 decimal places
  quantity: /^(?:[1-9]\d*)$/,
  discountValue: /^\d+(\.\d{1,2})?$/, // Positive number with up to 2 decimal places
  leadTime: /^\d+$/, // Positive integer
  reorderLevel: /^\d+$/, // Positive integer
  initialStock: /^\d+$/, // Positive integer
};

const sanitizeOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "p", "br"],
  allowedAttributes: {
    a: ["href"],
  },
};

export default function ProductEdit() {

  const [dropdown, setDropDown] = useState(false);
  const [dropdownSubCat, setDropDownSubCat] = useState(false);
  const [dropdownBrand, setDropDownBrand] = useState(false);
  const [dropdownHSN, setDropDownHSN] = useState(false);
  const dropdownRef = useRef(null);
  const dropdownSubCatRef = useRef(null);
  const dropdownBrandRef = useRef(null);
  const dropdownHSNRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [settings, setSettings] = useState({
    category: false,
    subcategory: false,
    brand: false,
    description: false,
    itembarcode: false,
    hsn: false,
    units: false,
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
        });
      }
    } catch (error) {
      // console.error("Error fetching system settings:", error);
      toast.error("Failed to fetch system settings");
    }
  };

  const [showAddSubCategoryModel, setShowAddSubCategoryModel] = useState(false);
  const modelAddRef = useRef(null);
  const fileRef = useRef(null);

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
    } catch (err) {
      // console.error(err);
      toast.error(
        err.response?.data?.message || "Error creating subcategory"
      );
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await api.get("/api/brands/active-brands");
      const options = res.data.brands.map((brand) => ({
        value: brand._id,
        label: sanitizeInput(brand.brandName, true),
      }));
      setBrandOptions(options);
    } catch (error) {
      // console.error("Fetch Brands Error:",error.response?.data || error.message);
    }
  };

  const [isOn, setIsOn] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

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
      variant.openingQuantity = merged.length;

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
      variant.openingQuantity = serials.length;

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
  const handleExcelUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (typeof text !== "string") return;
      handleBulkAddSerials(text);
    };
    reader.readAsText(file);
  };

  const [step, setStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(
    Array(steps.length).fill("pending")
  );
  const [activeTab, setActiveTab] = useState("Color");
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    subCategory: "",
    description: "",
    // itemBarcode: "",
    purchasePrice: "",
    sellingPrice: "",
    wholesalePrice: "",
    retailPrice: "",
    quantity: "",
    discountType: "",
    discountValue: "",
    variants: {},
    sellingType: "",
    hsn: "",
  });

  const [errors, setErrors] = useState({});
  const [highlightedFields, setHighlightedFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedsubCategory, setSelectedsubCategory] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);
  const [unitsOptions, setUnitsOptions] = useState([]);
  const [options, setOptions] = useState([]);
  const [optionsware, setOptionsWare] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [optionsHsn, setOptionsHsn] = useState([]);
  const [selectedHSN, setSelectedHSN] = useState(null);
  const [showHSNModal, setShowHSNModal] = useState(false);
  const [brandId, setBrandId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [subCategoryId, setSubCategoryId] = useState(null);
  const [supplierId, setSupplierId] = useState(null);
  const [warehouseId, setWarehouseId] = useState(null);
  const [showAddCategoryModel, setShowAddCategoryModel] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [subCategoryName, setSubCategoryName] = useState("");

  const [variants, setVariants] = useState([
    { selectedVariant: "", selectedValue: [], valueDropdown: [] },
  ]);

  const [lotPricing, setLotPricing] = useState(null);
  const [listTab, setListTab] = useState("Lot / Batch");

  const [warrantyType, setWarrantyType] = useState("");
  const [warrantyPeriod, setWarrantyPeriod] = useState("");
  const [warrantyDetails, setWarrantyDetails] = useState({
    coverageScope: "",
    serviceMode: "",
    maxClaimsAllowed: "",
    inspectionRequired: false,
    warrantyStartsFrom: "",
    linkedto: "",
    extensionPeriod: "",
    coverageType: "",
    extendedWarrantyPrice: "",
    lifetimeDefination: "",
    coverageOf: "",
    whatNotCovered: "",
    maxClaims: "",
    replacementOnceOnly: false,
  });

  const [variantDropdown, setVariantDropdown] = useState([]);
  const [images, setImages] = useState([]);
  const [isDirty, setIsDirty] = useState(false);

  const onDrop = (acceptedFiles) => {
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = [];
    const invalidFiles = [];

    acceptedFiles.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        invalidFiles.push({ file, error: `Invalid file type for ${file.name}. Only JPEG, PNG, or JPG allowed.` });
      } else if (file.size > maxSize) {
        invalidFiles.push({ file, error: `Image ${file.name} exceeds 1MB limit.` });
      } else {
        validFiles.push(Object.assign(file, { preview: URL.createObjectURL(file) }));
      }
    });

    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ error }) => toast.error(error));
      setErrors((prev) => ({ ...prev, images: "Image size should not exceeded 1MB." }));
    }

    if (validFiles.length > 0) {
      setImages((prev) => [...prev, ...validFiles]);
      setErrors((prev) => ({ ...prev, images: "" }));
      setIsDirty(true);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/api/products/${id}`);
        const data = res.data;
        const sanitizedData = {
          ...data,
          productName: sanitizeHtml(data.productName || "", sanitizeOptions),
        };
        // setFormData(sanitizedData);
        // setFormData({ ...formData, ...data });
        let computedDiscountValue = "";
        if (data.discountType === "Fixed") {
          computedDiscountValue = data.discountAmount;
        } else if (data.discountType === "Percentage") {
          computedDiscountValue = data.discountAmount;
        }

        setFormData((prev) => ({
          ...prev,
          ...sanitizedData,
          ...data,
          discountValue: computedDiscountValue,
        }));

        if (typeof data.lot_pricing !== "undefined") {
          const flag = data.lot_pricing === true;
          setLotPricing(flag);
          setListTab(flag ? "Lot / Batch" : "Pricing & Variants");
        }

        if (data.lotDetails) {
          let details = data.lotDetails;
          if (typeof details === 'string') {
            try {
              details = JSON.parse(details);
            } catch (e) {
              // console.error("Error parsing lotDetails", e);
              details = {};
            }
          }
          setLotDetails({
            lotNo: details.lotNo || "",
            lotmrp: details.lotmrp || "",
            fabricBatchNo: details.fabricBatchNo || "",
            productionDate: details.productionDate || "",
            designCode: details.designCode || "",
            quantity: details.quantity || "",
            size: details.size || "",
            color: details.color || "",
          });
        }

        // if (data.brand)  setSelectedBrands({ value: data.brand._id || data.brand, label: data.brand.brandName || data.brand });
        if (data.brand) {
          setBrandId(data.brand._id || data.brand);
        }

        if (data.subcategory) {
          setSubCategoryId(data.subcategory._id || data.subcategory);
        }
        if (data.category) {
          setCategoryId(data.category._id || data.category);
        }

        if (data.unit) setSelectedUnits({ value: data.unit, label: data.unit });
        // if (data.supplier) setSelectedSupplier({ value: data.supplier._id || data.supplier, label: data.supplier.firstName ? `${data.supplier.firstName}${data.supplier.lastName} (${data.supplier.supplierCode})` : data.supplier });
        if (data.supplier) {
          setSupplierId(data.supplier._id || data.supplier);
        }

        // if (data.warehouse) setSelectedWarehouse({ value: data.warehouse._id || data.warehouse, label: data.warehouse.warehouseName || data.warehouse });
        if (data.warehouse) {
          setWarehouseId(data.warehouse._id || data.warehouse);
        }
        if (data.hsn) {
          const hsnOption = optionsHsn.find(
            (opt) => opt.value === (data.hsn._id || data.hsn)
          );
          if (hsnOption) setSelectedHSN(hsnOption);
        }



        // --- VARIANTS PATCH ---
        // Map root product data to the first variant entry
        const initialSerials = Array.isArray(data.serialNumbers)
          ? data.serialNumbers
          : Array.isArray(data.serialno)
            ? data.serialno
            : typeof data.serialno === "string" && data.serialno
              ? data.serialno.split(",").map((s) => s.trim()).filter(Boolean)
              : [];

        const existingVariant = {
          selectedVariant: "",
          selectedValue: [],
          valueDropdown: [],
          purchasePrice: data.purchasePrice,
          mrp: data.mrp,
          sellingPrice: data.sellingPrice,
          tax: data.tax,
          size: data.size,
          color: data.color,
          openingQuantity: data.openingQuantity || initialSerials.length || 0,
          minStockToMaintain: data.minStockToMaintain,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          manufacturingDate: data.manufacturingDate ? data.manufacturingDate.split("T")[0] : "",
          expiryDate: data.expiryDate ? data.expiryDate.split("T")[0] : "",
          unit: data.unit,
          lotNumber: data.lotNumber || "",
          serialNumbers: initialSerials,
        };
        setVariants([existingVariant]);

        if (data.images && data.images.length > 0) {
          const existingImages = data.images.map((img) => ({
            preview: img.url, // Dropzone expects `preview`
            url: img.url, // Keep original URL if you need
            public_id: img.public_id,
          }));
          setImages(existingImages);
        }

        setWarrantyType(data.warrantyType || "");
        setWarrantyPeriod(data.warrantyPeriod || "");
        setWarrantyDetails((prev) => ({
          ...prev,
          coverageScope: data.coverageScope || "",
          serviceMode: data.serviceMode || "",
          maxClaimsAllowed: data.maxClaimsAllowed || "",
          inspectionRequired:
            data.inspectionRequired === true ||
            data.inspectionRequired === "true",
          warrantyStartsFrom: data.warrantyStartsFrom || "",
          linkedto: data.linkedto || "",
          extensionPeriod: data.extensionPeriod || "",
          coverageType: data.coverageType || "",
          extendedWarrantyPrice: data.extendedWarrantyPrice || "",
          lifetimeDefination: data.lifetimeDefination || "",
          coverageOf: data.coverageOf || "",
          whatNotCovered: data.whatNotCovered || "",
          maxClaims: data.maxClaims || "",
          replacementOnceOnly:
            data.replacementOnceOnly === true ||
            data.replacementOnceOnly === "true",
        }));

        // if (data.hsnCode) setSelectedHSN({ value: data.hsnCode._id || data.hsnCode, label: data.hsnCode.hsnCode ? `${data.hsnCode.hsnCode} - ${data.hsnCode.description || ''}` : data.hsnCode });
        setLoading(false);
      } catch (err) {
        toast.error("Failed to fetch product");
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {

    api.get("/api/variant-attributes/active-variants")
      .then(res => {
        const data = res.data;
        setVariantDropdown(data)
      })
      .catch(err => console.error("Error fetching variant dropdown:", err));
  }, [BASE_URL]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/category/categories");
        const data = res.data;

        // Filter only active (non-deleted) categories
        const activeCategories = (Array.isArray(data) ? data : data?.categories || [])
          .filter(cat => cat.isDelete !== true);

        const options = activeCategories.map((category) => ({
          value: category._id,
          label: sanitizeHtml(category.categoryName, sanitizeOptions),
        }));

        setCategories(options);
      } catch (error) {
        // console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };
    const fetchBrands = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get("/api/brands/active-brands");
        const options = res.data.brands.map((brand) => ({
          value: brand._id,
          label: sanitizeHtml(brand.brandName, sanitizeOptions), // Commented out: Sanitization
          // label: brand.brandName,
          // label: brand.brandName,
        }));
        setBrandOptions(options);
      } catch (error) { }
    };
    const fetchUnits = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get(
          "/api/unit/units/status/active");
        const options = res.data.units.map((unit) => ({
          value: unit.shortName,
          label: sanitizeHtml(
            `${unit.unitsName} (${unit.shortName})`,
            sanitizeOptions
          ), // Commented out: Sanitization
          // label: `${unit.unitsName} (${unit.shortName})`,
        }));
        setUnitsOptions(options);
      } catch (error) { }
    };

    const fetchWarehouses = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get("/api/warehouse/active");
        if (res.data.success) {
          const options = res.data.data.map((wh) => ({
            value: wh._id,
            label: sanitizeHtml(wh.warehouseName, sanitizeOptions),
            // label: wh.warehouseName,
          }));
          setOptionsWare(options);
        }
      } catch (error) { }
    };
    const fetchHSN = async () => {
      try {
        // const token = localStorage.getItem("token");
        const res = await api.get("/api/hsn/all");
        // console.log("hsnd", res.data.data);
        if (res.data.success) {
          const options = res.data.data.map((item) => ({
            value: item._id,
            label: sanitizeHtml(
              `${item.hsnCode} - ${item.description || ""}`,
              sanitizeOptions
            ),
            // label: `${item.hsnCode} - ${item.description || ""}`,
          }));
          setOptionsHsn(options);
        }
      } catch (error) { }
    };

    fetchCategories();
    fetchBrands();
    fetchUnits();
    // fetchSuppliers();
    fetchWarehouses();
    fetchHSN();
  }, []);

  useEffect(() => {
    if (brandOptions.length > 0 && brandId) {
      const found = brandOptions.find((opt) => opt.value === brandId);
      if (found) {
        setSelectedBrands(found);
      }
    }
  }, [brandOptions, brandId]);

  useEffect(() => {
    if (categoryId && categories.length > 0) {
      const foundCat = categories.find((opt) => opt.value === categoryId);
      if (foundCat) {
        setSelectedCategory(foundCat);
        fetchSubcategoriesByCategory(foundCat.value); // Now filtered!
      }
    } else {
      setSelectedCategory(null);
      setSelectedsubCategory(null);
      setSubcategories([]);
      setSubCategoryId(null);
    }
  }, [categoryId, categories]);

  const fetchSubcategoriesByCategory = async (categoryId) => {
    if (!categoryId) {
      setSubcategories([]);
      return;
    }

    try {
      const res = await api.get(`/api/subcategory/by-category/${categoryId}`);
      const data = res.data;

      // Filter only active subcategories
      const activeSubcats = (Array.isArray(data) ? data : data?.subcategories || [])
        .filter(sub => sub.isDelete !== true);

      const options = activeSubcats.map((subcat) => ({
        value: subcat._id,
        label: subcat.name,
      }));

      setSubcategories(options);
    } catch (error) {
      // console.error("Error fetching subcategories:", error);
      toast.error("Failed to load subcategories");
      setSubcategories([]);
    }
  };

  useEffect(() => {
    if (subCategoryId && subcategories.length > 0) {
      const found = subcategories.find((opt) => opt.value === subCategoryId);
      if (found) {
        setSelectedsubCategory(found);
      }
    }
  }, [subCategoryId, subcategories]);

  useEffect(() => {
    if (supplierId && options.length > 0) {
      const found = options.find((opt) => opt.value === supplierId);
      if (found) {
        setSelectedSupplier(found);
      }
    }
  }, [supplierId, options]);

  useEffect(() => {
    if (warehouseId && optionsware.length > 0) {
      const found = optionsware.find((opt) => opt.value === warehouseId);
      if (found) setSelectedWarehouse(found);
    }
  }, [warehouseId, optionsware]);

  useEffect(() => {
    if (optionsHsn.length > 0 && formData.hsn) {
      const hsnValue =
        typeof formData.hsn === "object" ? formData.hsn._id : formData.hsn;
      const found = optionsHsn.find((opt) => opt.value === hsnValue);
      if (found) setSelectedHSN(found);
    }
  }, [optionsHsn, formData.hsn]);

  const handleBrandChange = (selectedOption) => {
    setSelectedBrands(selectedOption);
    setIsDirty(true);
  };
  const handleUnitChange = (selectedOption) => {
    setSelectedUnits(selectedOption);
    setIsDirty(true);
  };
  const handleWarehouseChange = (selectedOption) => {
    setSelectedWarehouse(selectedOption);
    setIsDirty(true);
  };
  const handleHSNChange = (selectedOption) => {
    setSelectedHSN(selectedOption);
    setIsDirty(true);
  };
  const subCategoryChange = (selectedOption) => {
    setSelectedsubCategory(selectedOption);
    setIsDirty(true);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!categoryName || !categoryName.trim()) {
      newErrors.categoryName = "Category Name is required";
    }
    setErrors((prev) => ({ ...prev, ...newErrors }));
    if (Object.keys(newErrors).length > 0) return;
    try {
      const payload = { categoryName };
      if (subCategoryName && subCategoryName.trim()) {
        payload.subCategoryName = subCategoryName;
      }

      const resCat = await api.post("/api/category/categories", payload);
      const createdCat = resCat.data?.category || resCat.data;

      if (createdCat?._id) {
        const resAll = await api.get("/api/category/categories");
        const optionsAll = resAll.data.map((c) => ({
          value: c._id,
          label: sanitizeHtml(c.categoryName, sanitizeOptions),
        }));
        setCategories(optionsAll);

        const found = optionsAll.find((o) => o.value === createdCat._id);
        if (found) {
          setSelectedCategory(found);
          setCategoryId(found.value);

          const resSub = await api.get(`/api/subcategory/by-category/${found.value}`);
          const dataSub = resSub.data;
          const listSub = Array.isArray(dataSub) ? dataSub : dataSub?.subcategories || [];
          const optionsSub = listSub.map((subcat) => ({
            value: subcat._id,
            label: subcat.name,
          }));
          setSubcategories(optionsSub);

          if (subCategoryName && subCategoryName.trim()) {
            const createdSub = optionsSub.find((s) => s.label === subCategoryName.trim()) || (optionsSub.length === 1 ? optionsSub[0] : null);
            if (createdSub) {
              setSelectedsubCategory(createdSub);
              setSubCategoryId(createdSub.value);
            } else {
              setSelectedsubCategory(null);
              setSubCategoryId(null);
            }
          } else {
            setSelectedsubCategory(null);
            setSubCategoryId(null);
          }
        }
      }

      setShowAddCategoryModel(false);
      setCategoryName("");
      setSubCategoryName("");
      toast.success("Category created successfully");
      setIsDirty(true);
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("Category already exists");
      } else {
        toast.error("Failed to create category");
      }
    }
  };

  const handleGenerateBarcode = async () => {
    try {
      const res = await api.post("/api/products/generate-barcode", { productId: id });
      const code = res.data?.barcode;
      if (code) {
        setFormData((prev) => ({ ...prev, itemBarcode: code }));
        toast.success("Barcode generated");
      } else {
        toast.error("Failed to generate barcode");
      }
    } catch (err) {
      toast.error("Failed to generate barcode");
    }
  };

  const validateInput = (name, value) => {
    if (regexPatterns[name]) {
      return regexPatterns[name].test(value) ? "" : `Invalid ${name}`;
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let sanitizedValue =
      type !== "checkbox" ? sanitizeHtml(value, sanitizeOptions) : value;
    if (name === "description") {
      const words = String(sanitizedValue).trim().split(/\s+/).filter(Boolean);
      if (words.length > 30) {
        sanitizedValue = words.slice(0, 30).join(" ");
      }
    }
    const error =
      type !== "checkbox" ? validateInput(name, sanitizedValue) : "";
    setErrors((prev) => ({ ...prev, [name]: error }));
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : sanitizedValue,
    }));
    setIsDirty(true);
  };

  const inputChange = (key, value) => {
    const sanitizedValue = sanitizeHtml(value, sanitizeOptions);
    if (step === 3) {
      const parsedValues = sanitizedValue
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v);
      setFormData((prev) => ({
        ...prev,
        variants: { ...prev.variants, [key]: parsedValues },
      }));
    } else {
      const error = validateInput(key, sanitizedValue);
      setErrors((prev) => ({ ...prev, [key]: error }));
      setFormData((prev) => ({ ...prev, [key]: sanitizedValue }));
    }
    setIsDirty(true);
  };

  const validateStep = () => {
    const newErrors = {};
    const emptyFields = [];

    const normalizedVariants = variants.map((v) => {
      let unit = v.unit;
      return { ...v, unit };
    });
    if (JSON.stringify(normalizedVariants) !== JSON.stringify(variants)) {
      setVariants(normalizedVariants);
    }

    if (!formData.productName) {
      newErrors.productName = "Product Name is required";
      emptyFields.push("productName");
    }
    if (formData.productName && !regexPatterns.productName.test(formData.productName)) {
      newErrors.productName = "Invalid Product Name";
    }

    if (settings.category && !selectedCategory) {
      newErrors.category = "Category is required";
      emptyFields.push("category");
    }
    if (settings.category && settings.subcategory && !selectedsubCategory) {
      newErrors.subCategory = "Sub-category is required";
      emptyFields.push("subCategory");
    }
    if (settings.brand && !selectedBrands) {
      newErrors.brand = "Brand is required";
      emptyFields.push("brand");
    }
    if (settings.description && !formData.description) {
      newErrors.description = "Description is required";
      emptyFields.push("description");
    }
    if (settings.hsn && !selectedHSN) {
      newErrors.hsn = "HSN is required";
      emptyFields.push("hsn");
    }

    normalizedVariants.forEach((variant, index) => {
      if (lotPricing) {
        if (settings.units && !variant.unit) {
          newErrors[`variant_${index}_unit`] = `Unit is required for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_unit`);
        }

        if (!variant.purchasePrice || Number(variant.purchasePrice) < 1) {
          emptyFields.push(`variant_${index}_purchasePrice`);
        }

        if (!variant.sellingPrice || Number(variant.sellingPrice) < 1) {
          emptyFields.push(`variant_${index}_sellingPrice`);
        }

        if (
          variant.openingQuantity === undefined ||
          variant.openingQuantity === "" ||
          Number(variant.openingQuantity) < 1
        ) {
          emptyFields.push(`variant_${index}_openingQuantity`);
        }

        if (!variant.lotNumber) {
          newErrors[`variant_${index}_lotNumber`] = `Lot Number is required for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_lotNumber`);
        }

        if (
          variant.minStockToMaintain !== undefined &&
          variant.minStockToMaintain !== "" &&
          Number(variant.minStockToMaintain) < 0
        ) {
          emptyFields.push(`variant_${index}_minStockToMaintain`);
        }

        if (
          variant.mrp !== undefined &&
          variant.mrp !== "" &&
          Number(variant.mrp) < 0
        ) {
          emptyFields.push(`variant_${index}_mrp`);
        }
      } else {
        if (settings.units && !variant.unit) {
          newErrors[`variant_${index}_unit`] = `Unit is required for variant ${index + 1}`;
          emptyFields.push(`variant_${index}_unit`);
        }

        if (
          variant.purchasePrice === "" ||
          variant.purchasePrice === null ||
          typeof variant.purchasePrice === "undefined" ||
          Number(variant.purchasePrice) < 1
        ) {
          emptyFields.push(`variant_${index}_purchasePrice`);
        }

        if (
          variant.mrp === "" ||
          variant.mrp === null ||
          typeof variant.mrp === "undefined" ||
          Number(variant.mrp) < 0
        ) {
          emptyFields.push(`variant_${index}_mrp`);
        }

        if (
          variant.sellingPrice === "" ||
          variant.sellingPrice === null ||
          typeof variant.sellingPrice === "undefined" ||
          Number(variant.sellingPrice) < 1
        ) {
          emptyFields.push(`variant_${index}_sellingPrice`);
        }

        if (
          variant.openingQuantity === undefined ||
          variant.openingQuantity === "" ||
          Number(variant.openingQuantity) < 0
        ) {
          emptyFields.push(`variant_${index}_openingQuantity`);
        }

        if (listTab === "Pricing & Variants") {
          if (
            variant.minStockToMaintain === undefined ||
            variant.minStockToMaintain === "" ||
            Number(variant.minStockToMaintain) < 0
          ) {
            emptyFields.push(`variant_${index}_minStockToMaintain`);
          }
        } else {
          if (
            variant.minStockToMaintain !== undefined &&
            variant.minStockToMaintain !== "" &&
            Number(variant.minStockToMaintain) < 0
          ) {
            emptyFields.push(`variant_${index}_minStockToMaintain`);
          }
        }
      }
    });

    if (!lotPricing && settings.units) {
      const mainVariant = normalizedVariants[0] || {};
      if (!mainVariant.unit) {
        emptyFields.push("unit");
      }
    }

    if (warrantyType === "Manufacturing") {
      if (!warrantyDetails.coverageScope) {
        newErrors.coverageScope = "Coverage Scope is required";
        emptyFields.push("coverageScope");
      }
      if (!warrantyDetails.serviceMode) {
        newErrors.serviceMode = "Service Mode is required";
        emptyFields.push("serviceMode");
      }
      if (
        warrantyDetails.maxClaimsAllowed === "" ||
        warrantyDetails.maxClaimsAllowed === null ||
        typeof warrantyDetails.maxClaimsAllowed === "undefined" ||
        Number(warrantyDetails.maxClaimsAllowed) < 1
      ) {
        newErrors.maxClaimsAllowed = "Max Claims Allowed must be at least 1";
        emptyFields.push("maxClaimsAllowed");
      }
      if (!warrantyDetails.inspectionRequired) {
        newErrors.inspectionRequired = "Inspection Required is required";
        emptyFields.push("inspectionRequired");
      }
      if (!warrantyDetails.warrantyStartsFrom) {
        newErrors.warrantyStartsFrom = "Warranty Starts From is required";
        emptyFields.push("warrantyStartsFrom");
      }
    }

    normalizedVariants.forEach((_, index) => {
      if (emptyFields.includes(`variant_${index}_purchasePrice`)) newErrors.purchasePrice = "Purchase Price must be at least 1";
      if (emptyFields.includes(`variant_${index}_mrp`)) newErrors.mrp = "MRP must be at least 0";
      if (emptyFields.includes(`variant_${index}_sellingPrice`)) newErrors.sellingPrice = "Selling Price must be at least 1";
      if (emptyFields.includes(`variant_${index}_openingQuantity`)) newErrors.openingQuantity = lotPricing ? "Opening Quantity must be at least 1" : "Opening Quantity must be 0 or more";
      if (emptyFields.includes(`variant_${index}_minStockToMaintain`)) newErrors.minStockToMaintain = "Min Stock to Maintain must be 0 or more";
    });

    if (formData.purchasePrice && !regexPatterns.price.test(formData.purchasePrice)) newErrors.purchasePrice = "Purchase Price must be a positive number with up to 2 decimal places";
    if (formData.sellingPrice && !regexPatterns.price.test(formData.sellingPrice)) newErrors.sellingPrice = "Selling Price must be a positive number with up to 2 decimal places";

    setHighlightedFields(emptyFields);
    try {
      // console.groupCollapsed("ProductEdit: Required fields missing");
      // console.log("lot mode:", lotPricing);
      // console.log("missingKeys:", emptyFields);
      // console.log("errorMap:", newErrors);
      // console.groupEnd();
    } catch (_) { }
    setErrors(newErrors);
    return Object.values(newErrors).filter(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep();

    if (validationErrors.length > 0) {
      toast.error("Please fill all the required fields");
      return;
    }
    let newBarcode = "";
    try {
      const res = await api.post("/api/products/generate-barcode", { productId: id });
      newBarcode = res.data?.barcode || "";
      if (!newBarcode) {
        toast.error("Failed to generate barcode");
        return;
      }
    } catch (err) {
      toast.error("Failed to generate barcode");
      return;
    }

    const formPayload = new FormData();
    // Append fields as before
    if (formData.productName) formPayload.append("productName", formData.productName);
    if (formData.sku) formPayload.append("sku", formData.sku);
    formPayload.append("brand", selectedBrands?.value || "");
    formPayload.append("category", selectedCategory?.value || "");
    formPayload.append("subcategory", selectedsubCategory?.value || "");
    // formPayload.append("supplier", selectedSupplier?.value || "");
    if (formData.description) formPayload.append("description", formData.description);
    if (formData.store) formPayload.append("store", formData.store);
    formPayload.append("warehouse", selectedWarehouse?.value || "");
    const lotPricingFlag = !!lotPricing;
    formPayload.append("lot_pricing", lotPricingFlag);
    // Use variants[0] for fields managed in the Variants section
    const primaryVariant = variants[0] || {};

    if (primaryVariant.purchasePrice !== undefined && primaryVariant.purchasePrice !== null && primaryVariant.purchasePrice !== "") formPayload.append("purchasePrice", primaryVariant.purchasePrice);
    if (primaryVariant.mrp !== undefined && primaryVariant.mrp !== null && primaryVariant.mrp !== "") formPayload.append("mrp", primaryVariant.mrp);
    if (primaryVariant.sellingPrice !== undefined && primaryVariant.sellingPrice !== null && primaryVariant.sellingPrice !== "") formPayload.append("sellingPrice", primaryVariant.sellingPrice);

    if (formData.retailPrice) formPayload.append("retailPrice", formData.retailPrice);

    if (primaryVariant.openingQuantity !== undefined && primaryVariant.openingQuantity !== null && primaryVariant.openingQuantity !== "") formPayload.append("openingQuantity", primaryVariant.openingQuantity);
    if (primaryVariant.minStockToMaintain !== undefined && primaryVariant.minStockToMaintain !== null && primaryVariant.minStockToMaintain !== "") formPayload.append("minStockToMaintain", primaryVariant.minStockToMaintain);

    formPayload.append("size", primaryVariant.size || "");
    formPayload.append("color", primaryVariant.color || "");
    if (primaryVariant.manufacturingDate) formPayload.append("manufacturingDate", primaryVariant.manufacturingDate);
    if (primaryVariant.expiryDate) formPayload.append("expiryDate", primaryVariant.expiryDate);
    formPayload.append("lotNumber", primaryVariant.lotNumber || "");
    formPayload.append(
      "serialNumbers",
      JSON.stringify(primaryVariant.serialNumbers || [])
    );

    if (primaryVariant.unit) formPayload.append("unit", primaryVariant.unit);
    else formPayload.append("unit", selectedUnits?.value || "");
    formPayload.append("tax", primaryVariant.tax ?? 0);

    {
      const hasDiscountAmount = !(
        primaryVariant.discountAmount === "" ||
        primaryVariant.discountAmount === null ||
        typeof primaryVariant.discountAmount === "undefined"
      );
      const discountTypeVal = hasDiscountAmount ? (primaryVariant.discountType || "Fixed") : "Fixed";
      formPayload.append("discountType", discountTypeVal);
      formPayload.append("discountAmount", primaryVariant.discountAmount ?? 0);
    }
    if (formData.itemType) formPayload.append("itemType", formData.itemType);
    if (formData.isAdvanced) formPayload.append("isAdvanced", formData.isAdvanced ? true : false);
    if (formData.trackType) formPayload.append("trackType", formData.trackType);
    formPayload.append("isReturnable", formData.isReturnable ? true : false);
    if (formData.leadTime) formPayload.append("leadTime", formData.leadTime);
    if (formData.reorderLevel) formPayload.append("reorderLevel", formData.reorderLevel);
    if (formData.initialStock) formPayload.append("initialStock", formData.initialStock);
    if (formData.batchNumber) formPayload.append("batchNumber", formData.batchNumber);
    if (formData.returnable) formPayload.append("returnable", formData.returnable ? true : false);
    if (formData.expirationDate) formPayload.append("expirationDate", formData.expirationDate);
    formPayload.append("hsn", selectedHSN?.value || "");
    formPayload.append("itemBarcode", newBarcode);

    formPayload.append("warrantyType", warrantyType || "");
    formPayload.append("warrantyPeriod", warrantyPeriod || "");
    formPayload.append(
      "coverageScope",
      Array.isArray(warrantyDetails.coverageScope)
        ? warrantyDetails.coverageScope.join(",")
        : warrantyDetails.coverageScope || ""
    );
    formPayload.append("serviceMode", warrantyDetails.serviceMode || "");
    formPayload.append("maxClaimsAllowed", warrantyDetails.maxClaimsAllowed || "");
    formPayload.append(
      "inspectionRequired",
      warrantyDetails.inspectionRequired === true ||
        warrantyDetails.inspectionRequired === "true"
        ? "true"
        : "false"
    );
    formPayload.append(
      "warrantyStartsFrom",
      warrantyDetails.warrantyStartsFrom || ""
    );
    formPayload.append("linkedto", warrantyDetails.linkedto || "");
    formPayload.append("extensionPeriod", warrantyDetails.extensionPeriod || "");
    formPayload.append("coverageType", warrantyDetails.coverageType || "");
    formPayload.append(
      "extendedWarrantyPrice",
      warrantyDetails.extendedWarrantyPrice || ""
    );
    formPayload.append(
      "lifetimeDefination",
      warrantyDetails.lifetimeDefination || ""
    );
    formPayload.append("coverageOf", warrantyDetails.coverageOf || "");
    formPayload.append("whatNotCovered", warrantyDetails.whatNotCovered || "");
    formPayload.append("maxClaims", warrantyDetails.maxClaims || "");
    formPayload.append(
      "replacementOnceOnly",
      warrantyDetails.replacementOnceOnly ? "true" : "false"
    );

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

    // Prepare variants payload
    const variantsPayload = variants.map(v => {
      const taxVal = v.tax === "" || v.tax === null || v.tax === undefined ? 0 : Number(v.tax) || 0;
      const hasDiscountAmount = !(v.discountAmount === "" || v.discountAmount === null || v.discountAmount === undefined);
      const discountVal = hasDiscountAmount ? Number(v.discountAmount) || 0 : 0;
      const discountTypeVal = hasDiscountAmount ? (v.discountType || "Fixed") : "Fixed";
      return {
        ...v,
        tax: taxVal,
        discountAmount: discountVal,
        discountType: discountTypeVal,
        imageCount: v.images ? v.images.length : 0,
        lotNumber: v.lotNumber || "",
        lot_pricing: lotPricingFlag,
        manufacturingDate:
          primaryVariant.manufacturingDate || v.manufacturingDate || "",
        expiryDate: primaryVariant.expiryDate || v.expiryDate || "",
      };
    });

    if (variantsPayload.length > 0) {
      formPayload.append("variants", JSON.stringify(variantsPayload));
    } else if (formData.variants && Object.keys(formData.variants).length > 0) {
      formPayload.append("variants", JSON.stringify(formData.variants));
    }

    const filesToUpload = [];
    images.forEach((imgFile) => {
      if (!imgFile.public_id) filesToUpload.push(imgFile);
    });
    variants.forEach((v) => {
      (v.images || []).forEach((f) => {
        filesToUpload.push(f);
      });
    });
    filesToUpload.forEach((f) => formPayload.append("images", f));

    const existingImageUrls = images
      .filter((img) => img.public_id)
      .map((img) => ({ url: img.url, public_id: img.public_id }));
    formPayload.append("existingImages", JSON.stringify(existingImageUrls));

    try {
      // const token = localStorage.getItem("token");
      await api.put(`/api/products/${id}`, formPayload);
      toast.success("Product updated successfully!");
      setIsDirty(false);
      const returnPath = location.state?.from || '/product';
      navigate(returnPath);
    } catch (err) {
      // console.log(err.response?.data);
      const errorMessage = err.response?.data?.message || "Failed to update product";
      toast.error(errorMessage);
    }
  };

  const handleRemoveImage = async (file) => {
    if (file.public_id) {
      try {
        const res = await api.delete(`/api/products/${id}`, {
          data: { public_id: file.public_id },
        });
        setImages(res.data.images);
      } catch (error) {
        // console.error("Failed to delete image", error);
      }
    } else {
      setImages((prev) => prev.filter((f) => f !== file));
    }
    setIsDirty(true);
  };

  const handleVariantChange = (index, fieldOrVariant, maybeValue) => {
    if (typeof maybeValue !== "undefined") {
      if (fieldOrVariant === "unit") {
        setVariants(prev => prev.map(v => ({ ...v, unit: maybeValue })));
      } else {
        setVariants(prev =>
          prev.map((v, i) => (i === index ? { ...v, [fieldOrVariant]: maybeValue } : v))
        );
      }
      setIsDirty(true);
      return;
    }
    const value = (fieldOrVariant || "").trim();
    setVariants(prev =>
      prev.map((v, i) =>
        i === index ? { ...v, selectedVariant: value, selectedValue: [], valueDropdown: [] } : v
      )
    );
    setIsDirty(true);
    if (!value) return;
    api
      .get(`/api/variant-attributes/values/${encodeURIComponent(value)}`)
      .then(res => {
        const data = res.data;
        const values = [];
        data.forEach(val => {
          if (typeof val === "string") {
            values.push(...val.split(",").map(v => v.trim()).filter(Boolean));
          }
        });
        setVariants(prev =>
          prev.map((v, i) => (i === index ? { ...v, valueDropdown: values } : v))
        );
      })
      .catch(err => console.error("Error fetching value dropdown:", err));
  };

  const handleValueChange = (index, value) => {
    setVariants(prev =>
      prev.map((v, i) => (i === index ? { ...v, selectedValue: value } : v))
    );
    setIsDirty(true);
  };

  const handleAddVariant = () => {
    setVariants(prev => {
      const unit = prev[0]?.unit || selectedUnits?.value || "";
      return [
        ...prev,
        { selectedVariant: "", selectedValue: [], valueDropdown: [], unit }
      ];
    });
    setIsDirty(true);
  };

  const handleRemoveVariant = index => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index));
      setIsDirty(true);
    }
  };

  const handleVariantImageChange = (index, e) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 1 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = [];
    const invalidErrors = [];

    // Check limit
    const currentVariant = variants[index];
    const existingCount = images.length; // Images from DB
    const newCount = currentVariant.images ? currentVariant.images.length : 0; // Newly added images
    const totalCurrent = existingCount + newCount;

    if (totalCurrent + files.length > 6) {
      toast.error("Maximum 6 images allowed");
      e.target.value = ""; // Reset input
      return;
    }

    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        invalidErrors.push(`Invalid file type for ${file.name}. Only JPEG, PNG, or JPG allowed.`);
      } else if (file.size > maxSize) {
        invalidErrors.push(`Image ${file.name} exceeds 1MB limit.`);
      } else {
        validFiles.push(Object.assign(file, { preview: URL.createObjectURL(file) }));
      }
    });
    if (invalidErrors.length) {
      invalidErrors.forEach(msg => toast.error(msg));
    }
    if (validFiles.length) {
      setVariants(prev =>
        prev.map((v, i) =>
          i === index ? { ...v, images: [...(v.images || []), ...validFiles] } : v
        )
      );
      setIsDirty(true);
    }
  };

  const handleRemoveVariantImage = (variantIndex, fileToRemove) => {
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
    setIsDirty(true);
  };

  useEffect(() => {
    if (variants && variants.length > 0) {
      const updatedVariants = variants.reduce((acc, v) => {
        if (v.selectedVariant && v.selectedValue?.length > 0) {
          acc[v.selectedVariant.trim()] = v.selectedValue;
        }
        return acc;
      }, {});
      setFormData((prev) => ({ ...prev, variants: updatedVariants }))
    }
  }, [variants]);
  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4" style={{ height: '100vh' }}>

      {/* header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
          }}
        >
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
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            {t("Edit Product")}
          </h2>
        </div>
        <div>
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
        </div>
      </div>

      {/* body */}
      <div>
        <form onSubmit={handleSubmit}>
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
              maxHeight: "calc(100vh - 158px)",
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
              // maxHeight: "calc(100vh - 160px)",
              height: '100vh',
              position: 'relative'
            }}
            >
              {/* General Details */}
              <div style={{ width: "1832px", borderBottom: '1px solid #EAEAEA', paddingBottom: '24px' }}>
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                  }}
                >
                  General Details
                </div>
                <div
                  style={{
                    rowGap: "20px",
                    columnGap: '60px',
                    width: "100%",
                    marginTop: "16px",
                    display: "flex",
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Product Name */}
                  <div
                    style={{
                      width: "400px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: '0 0 22.5%',
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
                        Product Name
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
                        border: highlightedFields.includes("productName") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                  {settings.category && <div style={{ display: 'flex', gap: '16px', flex: '0 0 22.5%', }}>

                    {/* category */}
                    <div
                      style={{
                        width: settings.subcategory ? "50%" : "100%",
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
                          Category
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
                        ref={dropdownRef}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: highlightedFields.includes("category") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                          position: 'relative'
                        }}
                      >
                        {/* <select
                        value={selectedCategory?.value || ""}
                        onChange={(e) => {
                          const selected = categories.find((cat) => cat.value === e.target.value) || null;
                          setSelectedCategory(selected);
                          setCategoryId(selected?.value || null);

                          // Clear subcategory when category changes
                          setSelectedsubCategory(null);
                          setSubCategoryId(null);

                          if (selected) {
                            fetchSubcategoriesByCategory(selected.value);
                          } else {
                            setSubcategories([]);
                          }
                          setIsDirty(true);
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
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select> */}
                        <div style={{ display: 'flex', gap: '5px', }} onClick={() => setDropDown(true)}>
                          {selectedCategory?.label ? <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>{selectedCategory?.label}</span> : <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>Select Category</span>}
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
                          maxHeight: '465px',
                          width: settings.subcategory ? '200px' : '400px',
                          // overflowY: 'auto',
                          zIndex: 1000
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '325px', height: 'auto' }}>

                            {/* mapping of categories */}

                            {categories.map((cat) => (
                              <div
                                key={cat.value}
                                className="button-hover"
                                onClick={() => {
                                  setSelectedCategory(cat);
                                  setCategoryId(cat.value);
                                  setDropDown(false);
                                  setSelectedsubCategory(null);
                                  setSubCategoryId(null);
                                  setFormErrors((prev) => ({ ...prev, category: "" }));
                                  fetchSubcategoriesByCategory(cat.value);
                                  setIsDirty(true);
                                }}
                                style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', padding: '5px 14px', cursor: 'pointer' }}
                              >
                                <label
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: 'pointer',
                                  }}
                                >
                                  {cat.label}
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
                              }}>&nbsp;Add New Category</span>
                          </div>
                        </div>}

                      </div>
                    </div>

                    {/* sub-category */}
                    {settings.subcategory && <div
                      style={{
                        width: "192px",
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
                          Sub - Category <span
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
                          border: highlightedFields.includes("subCategory") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                          position: 'relative'
                        }}
                      >
                        {/* <select
                        value={selectedsubCategory?.value || ""}
                        onChange={(e) => {
                          const selected =
                            subcategories.find(
                              (sub) => sub.value === e.target.value
                            ) || null;
                          subCategoryChange(selected);
                          setSubCategoryId(selected?.value || null);
                          setFormErrors((prev) => ({ ...prev, subCategory: "" }));
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
                        <option value="">Select Sub-Category</option>
                        {subcategories.map((sub) => (
                          <option key={sub.value} value={sub.value}>
                            {sub.label}
                          </option>
                        ))}
                      </select> */}
                        <div style={{ display: 'flex', gap: '5px', }} onClick={() => setDropDownSubCat(true)} >
                          {selectedsubCategory?.label ? <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>{selectedsubCategory?.label}</span> : <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: "14px", fontFamily: "Inter", fontWeight: "400", lineHeight: "14.40px" }}>Select Subcategory</span>}
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
                          maxHeight: '465px',
                          width: '200px',
                          // overflowY: 'auto',
                          zIndex: 1000
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: '325px', height: 'auto' }}>

                            {/* mapping of categories */}
                            {subcategories.map((sub) => (
                              <div
                                key={sub.value}
                                className="button-hover"
                                onClick={() => {
                                  setSelectedsubCategory(sub);
                                  setSubCategoryId(sub.value);
                                  setDropDownSubCat(false);
                                  setFormErrors((prev) => ({ ...prev, subCategory: "" }));
                                  setIsDirty(true);
                                }}
                                style={{ display: 'flex', justifyContent: 'start', alignItems: 'center', width: '100%', padding: '5px 14px', cursor: 'pointer' }}
                              >
                                <label
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: 'pointer',
                                  }}
                                >
                                  {sub.label}
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
                                fontSize: 15,
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
                      width: "400px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: '0 0 22.5%',
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
                        Brand
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
                      ref={dropdownBrandRef}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: highlightedFields.includes("brand")
                          ? "1px var(--White-Stroke, #fa3333ff) solid"
                          : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{ display: "flex", gap: "5px" }}
                        onClick={() => setDropDownBrand(true)}
                      >
                        {selectedBrands?.label ? (
                          <span
                            style={{
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            {selectedBrands.label.length > 40
                              ? selectedBrands.label.slice(0, 40) + "..."
                              : selectedBrands.label}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            {loading ? "Loading Brands..." : "Select Brand"}
                          </span>
                        )}
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
                            width: "400px",
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
                              }}
                            >
                              <label
                                onClick={() => {
                                  handleBrandChange(null);
                                  setDropDownBrand(false);
                                  setErrors((prev) => ({
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
                                  width: '100%'
                                }}
                              >
                                Select Brand
                              </label>
                            </div>

                            {brandOptions.map((opt) => (
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
                                    setErrors((prev) => ({
                                      ...prev,
                                      brand: "",
                                    }));
                                  }}
                                  style={{
                                    fontSize: 15,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    width: '100%'
                                  }}
                                >
                                  {opt.label.length > 40
                                    ? opt.label.slice(0, 40) + "..."
                                    : opt.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>}

                  {/* description */}
                  {settings.description && <div
                    style={{
                      width: "400px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: '0 0 22.5%',
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
                        Description
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
                        border: highlightedFields.includes("description")
                          ? "1px var(--White-Stroke, #fa3333ff) solid"
                          : "1px var(--White-Stroke, #EAEAEA) solid",
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
                        value={formData.description || ""}
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

                  {/* item code / bar code */}
                  {settings.itembarcode && <div
                    style={{
                      width: "400px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: '0 0 22.5%',
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
                        Item code / Bar code
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
                        border: highlightedFields.includes("itemBarcode") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          border: "none",
                          background: "transparent",
                          color: "var(--Black-Black, #0E101A)",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          outline: "none",
                        }}
                      >{formData.itemBarcode || "Automatically Generated"}
                      </div>
                    </div>
                  </div>}

                  {/* hsn code */}
                  {settings.hsn && <div
                    style={{
                      width: "400px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: '0 0 22.5%',
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
                        HSN
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
                      ref={dropdownHSNRef}
                      style={{
                        width: "100%",
                        height: "40px",
                        padding: "0 12px",
                        background: "white",
                        borderRadius: "8px",
                        border: highlightedFields.includes("hsn")
                          ? "1px var(--White-Stroke, #fa3333ff) solid"
                          : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{ display: "flex", gap: "5px" }}
                        onClick={() => setDropDownHSN(true)}
                      >
                        {selectedHSN?.label ? (
                          <span
                            style={{
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            {selectedHSN.label.length > 40
                              ? selectedHSN.label.slice(0, 40) + "..."
                              : selectedHSN.label}
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--Black-Black, #0E101A)",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              lineHeight: "14.40px",
                            }}
                          >
                            {loading ? "Loading HSN..." : "Select HSN"}
                          </span>
                        )}
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
                            maxHeight: "365px",
                            width: "400px",
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
                              }}
                            >
                              <label
                                onClick={() => {
                                  handleHSNChange(null);
                                  setDropDownHSN(false);
                                  setErrors((prev) => ({
                                    ...prev,
                                    hsn: "",
                                  }));
                                }}
                                style={{
                                  fontSize: 14,
                                  color: "black",
                                  fontWeight: "500",
                                  cursor: "pointer",
                                  fontStyle: "italic",
                                  width: '100%'
                                }}
                              >
                                Select HSN
                              </label>
                            </div>

                            {optionsHsn.map((hsn) => (
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
                                    setErrors((prev) => ({
                                      ...prev,
                                      hsn: "",
                                    }));
                                  }}
                                  style={{
                                    fontSize: 14,
                                    color: "black",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    width: '100%'
                                  }}
                                >
                                  {hsn.label.length > 40
                                    ? hsn.label.slice(0, 40) + "..."
                                    : hsn.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>}

                  {/* unit */}
                  {lotPricing === false && settings.units && <div
                    style={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      flex: '0 0 22.5%',
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
                        Unit
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
                        border: (highlightedFields.includes("unit") || highlightedFields.includes("variant_0_unit")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: "8px",
                        display: "flex",
                      }}
                    >
                      <select
                        name="unit"
                        value={(variants && variants[0] && variants[0].unit) || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Apply selected unit to all variants in Pricing & Variants mode
                          const updated = variants.map(v => ({ ...v, unit: val }));
                          setVariants(updated);
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
                        <option value="">Select Unit</option>
                        <option value="Piece">Piece</option>
                        <option value="Kg">Kg</option>
                        <option value="Liter">Liter</option>
                        <option value="Metre">Metre</option>
                      </select>
                    </div>
                  </div>}
                </div>
              </div>

              {/* tabs */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  padding: 2,
                  background: "#F3F8FB",
                  borderRadius: 8,
                  width: "fit-content",
                }}
              >
                {[
                  {
                    label: "Lot / Batch",
                    visible: lotPricing === true,
                  },
                  {
                    label: "Pricing & Variants",
                    visible: lotPricing === false,
                  },
                  { label: "Manufacturing", visible: true },
                  { label: "Warranty", visible: true },
                ]
                  .filter((tab) => tab.visible)
                  .map((tab) => (
                    <div
                      key={tab.label}
                      style={{
                        padding: "6px 12px",
                        background:
                          listTab === tab.label ? "white" : "transparent",
                        borderRadius: 8,
                        boxShadow:
                          listTab === tab.label
                            ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                            : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        color: "#0E101A",
                        cursor: "pointer",
                      }}
                      onClick={() => setListTab(tab.label)}
                    >
                      {tab.label}
                    </div>
                  ))}
              </div>

              {/* lot / batch */}
              {listTab === 'Lot / Batch' && <div className="delete-hover">

                {/* header */}
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                  }}
                >
                  Lot / Batch"
                </div>

                {/* variant section */}
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      gap: "19px",
                      // marginTop:'16px',
                      width: '1830px',
                      overflowX: 'auto',
                      padding: '16px 8px 0px 8px',
                    }}
                  // className="row"
                  >
                    {/* Delete button */}
                    <div
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
                          cursor: index === 0 ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (index === 0) return;
                          if (variants.length <= 1) return;
                          setVariants(variants.filter((_, i) => i !== index));
                        }}
                      >
                        <BsThreeDotsVertical className="fs-4" /> <RiDeleteBinLine className="text-danger fs-4" />
                      </div>
                    </div>

                    {/* lot no / serial no */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                          {lotPricing ? "Lot No." : "Serial Number"}
                        </span>
                        {lotPricing && <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span>}
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border: (highlightedFields.includes(`variant_${index}_lotNumber`) || highlightedFields.includes(`variant_${index}_serialNumber`) || highlightedFields.includes("lotNumber") || highlightedFields.includes("serialNumber")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            flex: 1
                          }}
                        >
                          {lotPricing ? (
                            <input
                              type="text"
                              placeholder="Enter Lot No."
                              name="lotNumber"
                              value={variant.lotNumber || ""}
                              onChange={(e) => handleVariantChange(index, "lotNumber", e.target.value)}
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
                          ) : (
                            <div style={{ fontSize: '14px', color: 'var(--Black-Grey, #727681)' }}>
                              {variant.serialNumbers?.length || 0} Serials Added
                            </div>
                          )}
                        </div>

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
                            width: "100px",
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
                            + Serial No.
                          </span>
                        </button>

                      </div>
                    </div>

                    {/* unit */}
                    {settings.units && <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                          Unit
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
                          border: (highlightedFields.includes(`variant_${index}_unit`) || highlightedFields.includes("units")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <select
                          name="unit"
                          value={variant.unit || ""}
                          onChange={(e) => handleVariantChange(index, "unit", e.target.value)}
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
                          <option value="">Select Unit</option>
                          <option value="Piece">Piece</option>
                          <option value="Kg">Kg</option>
                          <option value="Liter">Liter</option>
                          <option value="Metre">Metre</option>
                        </select>
                      </div>
                    </div>}

                    {/* Purchasing Price*/}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                          Purchasing Price
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
                          border: (highlightedFields.includes(`variant_${index}_purchasePrice`) || highlightedFields.includes("purchasePrice")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            width: '100%',
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
                        </div>
                      </div>
                    </div>

                    {/* TAX */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                        {/* <span
                          style={{
                            color: "var(--Danger, #D00003)",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          *
                        </span> */}
                      </div>
                      <div
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
                          <option value="">Select</option>
                          <option value="0.25">0.25%</option>
                          <option value="3">3%</option>
                          <option value="5">5%</option>
                          <option value="18">18%</option>
                          <option value="40">40%</option>
                        </select>
                      </div>
                    </div>

                    {/* Quantity in lot */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                          Quantity in lot
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
                          border: (highlightedFields.includes(`variant_${index}_openingQuantity`) || highlightedFields.includes(`variant_${index}_serialNumber`) || highlightedFields.includes("openingQuantity") || highlightedFields.includes("serialNumber")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            width: '100%',
                          }}
                        >
                          <input
                            type="number"
                            placeholder="00"
                            name="openingQuantity"
                            value={variant.openingQuantity || ""}
                            onChange={(e) => handleVariantChange(index, "openingQuantity", e.target.value)}
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
                        Per Unit Cost -{" "}
                        <span
                          style={{
                            color: "var(--Black-Black, green)",
                            fontSize: "11px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          ₹ {(variant.purchasePrice / variant.openingQuantity).toFixed(2)}
                        </span>
                      </span>
                    </div>

                    {/* Selling Price / lot */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                          Selling Price per lot
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
                          border: (highlightedFields.includes(`variant_${index}_sellingPrice`) || highlightedFields.includes("sellingPrice")) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            width: '100%',
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
                        Selling Price / Unit -{" "}
                        <span
                          style={{
                            color: "var(--Black-Black, green)",
                            fontSize: "11px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "14.40px",
                          }}
                        >
                          ₹ {(variant.sellingPrice / variant.openingQuantity).toFixed(2)}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>}

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
                              type="text"
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

                      {/* Done */}
                      <div style={{ alignItems: "center", marginTop: "12px", display: 'flex', justifyContent: 'center' }}>
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
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ color: 'white' }}>Done</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pricing & Variants */}
              {listTab === "Pricing & Variants" && (
                <div style={{}} className="delete-hover">

                  {/* header */}
                  <div
                    style={{
                      color: "black",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "500",
                      lineHeight: "19.20px",
                    }}
                  >
                    Pricing & Variants
                  </div>

                  {/* variant section */}
                  {variants.map((variant, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "16px",
                        // marginTop:'16px',
                        width: '1830px',
                        overflowX: 'auto',
                        padding: '16px 8px 0px 8px',
                      }}
                    // className="row"
                    >

                      {/* Purchasing Price*/}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "190px",
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
                            Purchasing Price
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
                            border: (highlightedFields.includes(`variant_${index}_purchasePrice`)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                          </div>
                        </div>
                      </div>

                      {/* MRP */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "190px",
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
                            MRP
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
                            border: (highlightedFields.includes(`variant_${index}_mrp`)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                          width: "190px",
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
                            Selling Price
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
                            border: (highlightedFields.includes(`variant_${index}_sellingPrice`)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            ₹ {(variant.sellingPrice - variant.purchasePrice).toFixed(2)} (
                            {(((variant.sellingPrice - variant.purchasePrice) / variant.purchasePrice) * 100).toFixed(2)}%)
                          </span>
                        </span>
                      </div>

                      {/* TAX */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "185px",
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
                          {/* <span
                        style={{
                          color: "var(--Danger, #D00003)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        *
                      </span> */}
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
                            <option value="0">0%</option>
                            <option value="0.25">0.25%</option>
                            <option value="3">3%</option>
                            <option value="5">5%</option>
                            <option value="18">18%</option>
                            <option value="40">40%</option>
                          </select>
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
                            ₹{(variant.sellingPrice * variant.tax / 100).toFixed(2)}/-
                          </span>
                        </span>
                      </div>

                      {/* Size */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "185px",
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
                            Size
                          </span>
                        </div>
                        <div
                          style={{
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border: highlightedFields.includes(`variant_${index}_size`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                          }}
                        >
                          <select
                            name="size"
                            value={variant.size || ""}
                            onChange={(e) => handleVariantChange(index, "size", e.target.value)}
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
                            <option value="">Select Size</option>
                            <option value="XS">Extra Small (XS)</option>
                            <option value="S">Small (S)</option>
                            <option value="M">Medium (M)</option>
                            <option value="L">Large (L)</option>
                            <option value="XL">Extra Large (XL)</option>
                          </select>
                        </div>
                      </div>

                      {/* Color */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "185px",
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
                            Color
                          </span>
                        </div>
                        <div
                          style={{
                            height: "40px",
                            padding: "0 12px",
                            background: "white",
                            borderRadius: "8px",
                            border: highlightedFields.includes(`variant_${index}_color`) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: "8px",
                            display: "flex",
                          }}
                        >
                          <select
                            name="color"
                            value={variant.color || ""}
                            onChange={(e) => handleVariantChange(index, "color", e.target.value)}
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
                            <option value="">Select Color</option>
                            <option value="Red">Red</option>
                            <option value="Yellow">yellow</option>
                            <option value="Black">black</option>
                            <option value="Green">green</option>
                          </select>
                        </div>
                      </div>

                      {/* Opening Quantity */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "190px",
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
                            Opening Quantity
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
                            border: (highlightedFields.includes(`variant_${index}_openingQuantity`)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                              name="openingQuantity"
                              value={variant.openingQuantity || ""}
                              onChange={(e) => handleVariantChange(index, "openingQuantity", e.target.value)}
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

                      {/* Min. Stock to Maintain */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "185px",
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
                            Min. Stock to Maintain
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
                            border: (highlightedFields.includes(`variant_${index}_minStockToMaintain`)) ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
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
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Discount Section */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "185px",
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
                          {/* <span
                        style={{
                          color: "var(--Danger, #D00003)",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          lineHeight: "14.40px",
                        }}
                      >
                        *
                      </span> */}
                        </div>
                        <div style={{ display: "flex", gap: "8px" }} className="">
                          <div
                            style={{
                              height: "40px",
                              paddingLeft: "8px",
                              background: "var(--White, white)",
                              borderRadius: "8px",
                              border: "1px var(--Stroke, #EAEAEA) solid",
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
                                  }}
                                >
                                  <option value="">₹/%</option>
                                  <option value="Fixed">₹</option>
                                  <option value="Percentage">%</option>
                                </select>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      {/* <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "50px",
                      }}
                      className="col-1"
                    >
                      <div
                        className=""
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                        }}
                        onClick={() => {
                          if (index === 0) return;
                          if (variants.length <= 1) return;
                          setVariants(variants.filter((_, i) => i !== index));
                        }}
                      >
                        <RiDeleteBinLine className="delete-hover-icon text-danger fs-5" />
                      </div>
                    </div> */}
                    </div>
                  ))}

                  {/* add variant button */}
                  {/* <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      overflow: "hidden",
                      border: "2px solid var(--Blue, #1F7FFF)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                    onClick={() => setVariants([...variants, {}])}
                  >
                    <div
                      style={{
                        color: "#1F7FFF",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      +
                    </div>
                  </div>
                  <span
                    style={{
                      color: "var(--Black, #212436)",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "19.20px",
                    }}
                  >
                    Add New Variant
                  </span>
                </div> */}
                </div>
              )}

              {/* Manufacturing */}
              {listTab === "Manufacturing" && (
                <div className="delete-hover">
                  <div
                    style={{
                      color: "black",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "500",
                    }}
                  >
                    Add Manufacturing & Expiry Details
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      width: "1830px",
                      overflowX: "auto",
                      padding: "16px 0px 0px 0px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                          Manufacturing Date
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border:
                            highlightedFields.includes("manufacturingDate") ||
                              highlightedFields.includes("variant_0_manufacturingDate")
                              ? "1px var(--White-Stroke, #fa3333ff) solid"
                              : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            width: "100%",
                          }}
                        >
                          <input
                            type="date"
                            placeholder="31/12/2026"
                            value={variants[0]?.manufacturingDate || ""}
                            onChange={(e) =>
                              handleVariantChange(
                                0,
                                "manufacturingDate",
                                e.target.value
                              )
                            }
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

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "275px",
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
                          Expiry Date
                        </span>
                      </div>
                      <div
                        style={{
                          height: "40px",
                          padding: "0 12px",
                          background: "white",
                          borderRadius: "8px",
                          border:
                            highlightedFields.includes("expiryDate") ||
                              highlightedFields.includes("variant_0_expiryDate")
                              ? "1px var(--White-Stroke, #fa3333ff) solid"
                              : "1px var(--White-Stroke, #EAEAEA) solid",
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
                            width: "100%",
                          }}
                        >
                          <input
                            type="date"
                            placeholder="31/12/2026"
                            value={variants[0]?.expiryDate || ""}
                            onChange={(e) =>
                              handleVariantChange(0, "expiryDate", e.target.value)
                            }
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
                </div>
              )}

              {/* Warranty */}
              {listTab === "Warranty" && (
                <div className="delete-hover">

                  {/* header */}
                  <div
                    style={{
                      color: "black",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "500",
                    }}
                  >
                    Add Warranty Details
                  </div>

                  {/* warrantry fields */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      width: "1830px",
                      overflowX: "auto",
                      padding: "16px 0px 0px 0px",
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
                  </div>

                  {/* open according to selected warranty type */}
                  <div>
                    {warrantyType === "Manufacturing" && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "20px",
                          borderTop: "1px solid #EAEAEA",
                          padding: "24px 0px 0px 0px",
                          marginTop: "24px",
                        }}
                      >
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
                              background: "white",
                              borderRadius: "8px",
                              border:
                                highlightedFields.includes("coverageScope") ||
                                  highlightedFields.includes("variant_0_coverageScope")
                                  ? "1px var(--White-Stroke, #fa3333ff) solid"
                                  : "none",
                              justifyContent: "flex-start",
                              alignItems: "center",
                              gap: "52px",
                              display: "flex",
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
                                type="radio"
                                name="coverageScope"
                                checked={warrantyDetails.coverageScope === "Parts"}
                                onChange={() =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    coverageScope: "Parts",
                                  }))
                                }
                                style={{
                                  width: 15,
                                  height: 15,
                                  accentColor: "#1F7FFF",
                                  cursor: "pointer",
                                }}
                              />
                              <lable style={{ color: "black" }}>Parts</lable>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <input
                                type="radio"
                                name="coverageScope"
                                checked={warrantyDetails.coverageScope === "Labour"}
                                onChange={() =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    coverageScope: "Labour",
                                  }))
                                }
                                style={{
                                  width: 15,
                                  height: 15,
                                  accentColor: "#1F7FFF",
                                  cursor: "pointer",
                                }}
                              />
                              <lable style={{ color: "black" }}>Labour</lable>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <input
                                type="radio"
                                name="coverageScope"
                                checked={
                                  warrantyDetails.coverageScope === "Parts + Labour"
                                }
                                onChange={() =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    coverageScope: "Parts + Labour",
                                  }))
                                }
                                style={{
                                  width: 15,
                                  height: 15,
                                  accentColor: "#1F7FFF",
                                  cursor: "pointer",
                                }}
                              />
                              <lable style={{ color: "black" }}>
                                Parts + Labour
                              </lable>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <input
                                type="radio"
                                name="coverageScope"
                                checked={
                                  warrantyDetails.coverageScope ===
                                  "Replacement Only"
                                }
                                onChange={() =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    coverageScope: "Replacement Only",
                                  }))
                                }
                                style={{
                                  width: 15,
                                  height: 15,
                                  accentColor: "#1F7FFF",
                                  cursor: "pointer",
                                }}
                              />
                              <lable style={{ color: "black" }}>
                                Replacement Only
                              </lable>
                            </div>
                          </div>
                        </div>

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
                              background: "white",
                              borderRadius: "8px",
                              border:
                                highlightedFields.includes("serviceMode") ||
                                  highlightedFields.includes("variant_0_serviceMode")
                                  ? "1px var(--White-Stroke, #fa3333ff) solid"
                                  : "none",
                              justifyContent: "flex-start",
                              alignItems: "center",
                              gap: "52px",
                              display: "flex",
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
                                type="radio"
                                name="serviceMode"
                                checked={warrantyDetails.serviceMode === "Carry In"}
                                onChange={() =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    serviceMode: "Carry In",
                                  }))
                                }
                                style={{
                                  width: 15,
                                  height: 15,
                                  accentColor: "#1F7FFF",
                                  cursor: "pointer",
                                }}
                              />
                              <lable style={{ color: "black" }}>Carry In</lable>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <input
                                type="radio"
                                name="serviceMode"
                                checked={warrantyDetails.serviceMode === "On-Site"}
                                onChange={() =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    serviceMode: "On-Site",
                                  }))
                                }
                                style={{
                                  width: 15,
                                  height: 15,
                                  accentColor: "#1F7FFF",
                                  cursor: "pointer",
                                }}
                              />
                              <lable style={{ color: "black" }}>On-Site</lable>
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                              }}
                            >
                              <input
                                type="radio"
                                name="serviceMode"
                                checked={
                                  warrantyDetails.serviceMode === "Pickup & Drop"
                                }
                                onChange={() =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    serviceMode: "Pickup & Drop",
                                  }))
                                }
                                style={{
                                  width: 15,
                                  height: 15,
                                  accentColor: "#1F7FFF",
                                  cursor: "pointer",
                                }}
                              />
                              <lable style={{ color: "black" }}>
                                Pickup & Drop
                              </lable>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            gap: "16px",
                            width: "100%",
                            display: "flex",
                            flexWrap: "wrap",
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
                                border:
                                  highlightedFields.includes("maxClaimsAllowed") ||
                                    highlightedFields.includes(
                                      "variant_0_maxClaimsAllowed"
                                    )
                                    ? "1px var(--White-Stroke, #fa3333ff) solid"
                                    : "1px var(--White-Stroke, #EAEAEA) solid",
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
                                onChange={(e) =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    maxClaimsAllowed: e.target.value,
                                  }))
                                }
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
                                border:
                                  "1px var(--White-Stroke, #EAEAEA) solid",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: "8px",
                                display: "flex",
                              }}
                            >
                              <select
                                name="inspectionRequired"
                                value={
                                  warrantyDetails.inspectionRequired === true
                                    ? "true"
                                    : warrantyDetails.inspectionRequired ===
                                      false
                                      ? "false"
                                      : ""
                                }
                                onChange={(e) =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    inspectionRequired:
                                      e.target.value === "true",
                                  }))
                                }
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
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                              </select>
                            </div>
                          </div>

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
                                border:
                                  "1px var(--White-Stroke, #EAEAEA) solid",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: "8px",
                                display: "flex",
                              }}
                            >
                              <select
                                name="warrantyStartsFrom"
                                value={warrantyDetails.warrantyStartsFrom}
                                onChange={(e) =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    warrantyStartsFrom: e.target.value,
                                  }))
                                }
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
                                <option value="Invoice Date">
                                  Invoice Date (Recommended)
                                </option>
                                <option value="Delivery Date">
                                  Delivery Date
                                </option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {warrantyType === "Extended" && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid #EAEAEA', padding: '24px 0px 0px 0px', marginTop: '24px', }}>

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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid #EAEAEA', padding: '24px 0px 0px 0px', marginTop: '24px', }}>

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
                                border: highlightedFields.includes("variant_0_replacementOnceOnly") ? "1px var(--White-Stroke, #fa3333ff) solid" : "1px var(--White-Stroke, #EAEAEA) solid",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: "8px",
                                display: "flex",
                              }}
                            >
                              <select
                                name="replacementOnceOnly"
                                value={
                                  warrantyDetails.replacementOnceOnly === true
                                    ? "Yes"
                                    : warrantyDetails.replacementOnceOnly === false
                                      ? "No"
                                      : ""
                                }
                                onChange={(e) =>
                                  setWarrantyDetails((prev) => ({
                                    ...prev,
                                    replacementOnceOnly: e.target.value === "Yes",
                                  }))
                                }
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
              )}

              {/* Import Images */}
              <div style={{ width: "1832px", borderTop: '1px solid #EAEAEA', }}>
                <div
                  style={{
                    width: "335px",
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
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: "24px",
                      width: "100%",
                      flexWrap: "wrap",
                    }}
                  >
                    {variants.map((variant, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "16px",
                          padding: '16px',
                        }}
                      >

                        {images.length === 0 ? (
                          <>
                            <label
                              htmlFor={`variant-image-${index}`}
                              style={{
                                width: "350px",
                                minHeight: "200px",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                border: "2px dashed #EAEAEA",
                                borderRadius: "8px",
                                padding: '16px',
                              }}
                            >
                              {/* Preview OR placeholder */}
                              {variant.images?.length ? (
                                <>
                                  <div className="row" style={{ gap: 12 }}>
                                    {variant.images.map((f, i) => (
                                      <div
                                        className="col-auto"
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
                                      </div>
                                    ))}
                                    {variant.images.length < 6 && (
                                      <div
                                        className="col-auto"
                                        style={{
                                          height: 100,
                                          width: 100,
                                          display: "flex",
                                          justifyContent: "center",
                                          alignItems: "center",
                                          border: "2px dashed #EAEAEA",
                                          borderRadius: "8px",
                                          marginLeft: 12,
                                        }}
                                      >
                                        <FcAddImage size={30} />
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 8,
                                    color: "#727681",
                                    pointerEvents: "none",
                                  }}
                                >
                                  <FcAddImage size={30} />
                                  <span style={{ color: "#727681" }}>
                                    Drag image here or <span style={{ color: "#1F7FFF" }}>browse</span>
                                  </span>
                                  <span style={{ fontSize: 12, color: "#727681" }}>
                                    JPEG, PNG, JPG (max 1MB)
                                  </span>
                                </div>
                              )}

                              <input
                                id={`variant-image-${index}`}
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={(e) => handleVariantImageChange(index, e)}
                                style={{ display: "none" }}
                              />
                            </label>
                          </>
                        ) : (
                          <>
                            <div className="row mt-2" style={{ gap: 12 }}>
                              {images.map((file, i) => (
                                <div
                                  className="col-auto"
                                  key={`existing-${i}`}
                                  style={{ position: "relative" }}
                                >
                                  <img
                                    src={file.url || file.preview}
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
                                      handleRemoveImage(file);
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                              {variant.images?.map((file, i) => (
                                <div
                                  className="col-auto"
                                  key={`new-${i}`}
                                  style={{ position: "relative" }}
                                >
                                  <img
                                    src={file.preview}
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
                                      handleRemoveVariantImage(index, file);
                                    }}
                                  >
                                    &times;
                                  </button>
                                </div>
                              ))}
                              {(images.length + (variant.images?.length || 0)) < 6 && (
                                <div
                                  className="col-auto"
                                  onClick={() => document.getElementById(`variant-image-add-${index}`).click()}
                                  style={{
                                    height: 100,
                                    width: 100,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    border: "2px dashed #EAEAEA",
                                    borderRadius: "8px",
                                    marginLeft: 12,
                                    cursor: "pointer",
                                  }}
                                >
                                  <FcAddImage size={30} />
                                  <input
                                    id={`variant-image-add-${index}`}
                                    type="file"
                                    multiple
                                    accept="image/jpeg,image/png,image/jpg"
                                    onChange={(e) => handleVariantImageChange(index, e)}
                                    style={{ display: "none" }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
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
                  marginTop: 16,
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
                      cursor: "pointer",
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
                      cursor: "pointer",
                      opacity: 1,
                    }}
                  // disabled={!isDirty}
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
                      Save
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>

      {showAddCategoryModel && (
        <CreateCategoryModal
          closeModal={() => setShowAddCategoryModel(false)}
          modalId="categoryModal"
          title={[t("Add Category")]}
          categoryName={categoryName}
          onCategoryChange={(e) => setCategoryName(e.target.value)}
          subCategoryName={subCategoryName}
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onSubmit={handleSubmitCategory}
          submitLabel={[t("Save")]}
          errors={errors}
        />
      )}

      {showAddSubCategoryModel && (
        <CreateSubCategoryModel
          modelAddRef={modelAddRef}
          closeModal={() => setShowAddSubCategoryModel(false)}
          categoryName={selectedCategory?.label}
          subCategoryName={subCategoryName}
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onSubmit={handleAddSubCategory}
        />
      )}

    </div>
  );
};

