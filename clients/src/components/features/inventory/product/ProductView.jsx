import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import Select from "react-select";
import sanitizeHtml from "sanitize-html";

// pages
import api from "../../../../pages/config/axiosInstance"
import CreateCategoryModal from "../../category/CreateCategoryModel"

// icons
import { TbChevronUp, TbEye, TbRefresh } from "react-icons/tb";
import { MdImageSearch, MdLockOutline } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa6";
import { RiDeleteBinLine } from "react-icons/ri";
import { FcAddImage } from "react-icons/fc";
import { BsThreeDotsVertical } from "react-icons/bs";

// images
import AiLogo from "../../../../assets/images/AI.png";

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

const ProductView = () => {
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

  const [step, setStep] = useState(0);
  const [stepStatus, setStepStatus] = useState(Array(steps.length).fill("pending"));
  const [activeTab, setActiveTab] = useState("Color");
  const [formData, setFormData] = useState({
    productName: "",
    category: "",
    subCategory: "",
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
  const [loading, setLoading] = useState(true);
  const [noProductFound, setNoProductFound] = useState(false);
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
  const [selectedSerialNo, setSelectedSerialNo] = useState("");
  const [variants, setVariants] = useState([{ selectedVariant: "", selectedValue: [], valueDropdown: [] },]);
  const [lotPricing, setLotPricing] = useState(false);
  const [listTab, setListTab] = useState("Lot / Batch");
  const [variantDropdown, setVariantDropdown] = useState([]);
  const [images, setImages] = useState([]);
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
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "image/*": [] },
    onDrop,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setNoProductFound(false);
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
        const firstVariant = (data.variants && data.variants.length > 0) ? data.variants[0] : {};
        const totalStock = (data.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
        const totalOpening = (data.variants || []).reduce((sum, v) => sum + (v.openingQuantity || 0), 0);
        setFormData((prev) => ({
          ...prev,
          ...sanitizedData,
          ...data,
          // Fallback to first variant for redundant fields removed from top level
          unit: data.unit || firstVariant.unit || "",
          purchasePrice: data.purchasePrice || firstVariant.purchasePrice || 0,
          sellingPrice: data.sellingPrice || firstVariant.sellingPrice || 0,
          tax: data.tax || firstVariant.tax || 0,
          openingQuantity: data.openingQuantity || totalOpening || 0,
          stockQuantity: data.stockQuantity || totalStock || 0,
          minStockToMaintain: data.minStockToMaintain || firstVariant.minStockToMaintain || 0,
          discountAmount: data.discountAmount || firstVariant.discountAmount || 0,
          discountType: data.discountType || firstVariant.discountType || "Fixed",
          lotNumber: data.lotNumber || firstVariant.lotNumber || "",
          discountValue: computedDiscountValue,
        }));
        const lotFlag = typeof data.lot_pricing === "boolean" ? data.lot_pricing : false;
        setLotPricing(lotFlag);
        setListTab(lotFlag ? "Lot / Batch" : "Pricing & Variants");
        let details = {};
        if (data.lotDetails) {
          details = data.lotDetails;
          if (typeof details === "string") {
            try {
              details = JSON.parse(details);
            } catch (e) {
              details = {};
            }
          }
        }
        setLotDetails({
          lotNo: (details && details.lotNo) || data.lotNumber || firstVariant.lotNumber || "",
          lotmrp: (details && details.lotmrp) || data.mrp || firstVariant.mrp || "",
          fabricBatchNo: (details && details.fabricBatchNo) || "",
          productionDate:
            (details && details.productionDate) ||
            (data.manufacturingDate ? data.manufacturingDate.split("T")[0] : (firstVariant.manufacturingDate ? firstVariant.manufacturingDate.split("T")[0] : "")) || "",
          designCode: (details && details.designCode) || "",
          quantity:
            (details && details.quantity) ||
            data.openingQuantity ||
            totalOpening ||
            data.stockQuantity ||
            totalStock ||
            "",
          size: (details && details.size) || data.size || firstVariant.size || "",
          color: (details && details.color) || data.color || firstVariant.color || "",
        });
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
        const unitVal = data.unit || firstVariant.unit || "";
        if (unitVal) setSelectedUnits({ value: unitVal, label: unitVal });
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
        if (data.variants && data.variants.length > 0) {
          const mappedVariants = data.variants.map(v => ({
            purchasePrice: v.purchasePrice,
            mrp: v.mrp,
            sellingPrice: v.sellingPrice,
            tax: v.tax,
            size: v.size,
            color: v.color,
            barcode: v.barcode || "",
            openingQuantity: v.openingQuantity || 0,
            stockQuantity: v.stockQuantity,
            minStockToMaintain: v.minStockToMaintain,
            discountAmount: v.discountAmount,
            discountType: v.discountType,
            manufacturingDate: v.manufacturingDate ? v.manufacturingDate.split("T")[0] : "",
            expiryDate: v.expiryDate ? v.expiryDate.split("T")[0] : "",
            unit: v.unit,
            lotNumber: v.lotNumber || "",
            serialNumbers: v.serialNumbers || [],
            images: v.images || [],
          }));
          setVariants(mappedVariants);
        } else {
          const initialSerials = Array.isArray(data.serialNumbers)
            ? data.serialNumbers
            : Array.isArray(data.serialno)
              ? data.serialno
              : typeof data.serialno === "string" && data.serialno
                ? data.serialno
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)
                : [];

          const existingVariant = {
            selectedVariant: "",
            selectedValue: [],
            valueDropdown: [],
            purchasePrice: data.purchasePrice,
            purchasingPrice: data.purchasePrice,
            mrp: data.mrp,
            sellingPrice: data.sellingPrice,
            tax: data.tax,
            size: data.size,
            color: data.color,
            barcode: data.barcode || "",
            openingQuantity: data.openingQuantity || initialSerials.length || 0,
            stockQuantity: data.stockQuantity,
            minStockToMaintain: data.minStockToMaintain,
            discountAmount: data.discountAmount,
            discountType: data.discountType,
            manufacturingDate: data.manufacturingDate
              ? data.manufacturingDate.split("T")[0]
              : "",
            expiryDate: data.expiryDate ? data.expiryDate.split("T")[0] : "",
            unit: data.unit,
            lotNumber: data.lotNumber || "",
            serialNumbers: initialSerials,
            serialNumber: Array.isArray(initialSerials)
              ? initialSerials.join(", ")
              : initialSerials || "",
          };
          setVariants([existingVariant]);
        }
        if (data.images && data.images.length > 0) {
          const existingImages = data.images.map((img) => ({
            preview: img.url, // Dropzone expects `preview`
            url: img.url, // Keep original URL if you need
            public_id: img.public_id,
          }));
          setImages(existingImages);
        }
        setLoading(false);
      } catch (err) {
        const status = err?.response?.status;
        const code = err?.response?.data?.code;
        if (status === 404 || code === "NOT_FOUND") {
          setNoProductFound(true);
          setLoading(false);
          return;
        }
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

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
      } catch (err) {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
      }
    };
    const fetchBrands = async () => {
      try {
        const res = await api.get("/api/brands/active-brands");
        const options = res.data.brands.map((brand) => ({
          value: brand._id,
          label: sanitizeHtml(brand.brandName, sanitizeOptions), // Commented out: Sanitization
        }));
        setBrandOptions(options);
      } catch (error) { }
    };
    const fetchUnits = async () => {
      try {
        const res = await api.get("/api/unit/units/status/active");
        const options = res.data.units.map((unit) => ({
          value: unit.shortName,
          label: sanitizeHtml(
            `${unit.unitsName} (${unit.shortName})`,
            sanitizeOptions
          ), // Commented out: Sanitization
          // label: `${unit.unitsName} (${unit.shortName})`,
        }));
        setUnitsOptions(options);
      } catch (err) {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
      }
    };

    // const fetchWarehouses = async () => {
    //   try {
    //     // const token = localStorage.getItem("token");
    //     const res = await api.get("/api/warehouse/active");
    //     if (res.data.success) {
    //       const options = res.data.data.map((wh) => ({
    //         value: wh._id,
    //         label: sanitizeHtml(wh.warehouseName, sanitizeOptions),
    //         // label: wh.warehouseName,
    //       }));
    //       setOptionsWare(options);
    //     }
    //   } catch (err) {
    //     toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    //   }
    // };

    const fetchHSN = async () => {
      try {
        const res = await api.get("/api/hsn/all");
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
      } catch (err) {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
      }
    };

    fetchCategories();
    fetchBrands();
    fetchUnits();
    // fetchSuppliers();
    // fetchWarehouses();
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
    if (!categoryId) {
      setSelectedCategory(null);
      setSelectedsubCategory(null);
      setSubcategories([]);
      setSubCategoryId(null);
      return;
    }

    if (categories.length === 0) return;

    const foundCat = categories.find((opt) => opt.value === categoryId);
    if (foundCat) {
      setSelectedCategory(foundCat);
      fetchSubcategoriesByCategory(foundCat.value);
    } else {
      setSelectedCategory(null);
      setSelectedsubCategory(null);
      setSubcategories([]);
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
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
      setSubcategories([]);
    }
  };

  useEffect(() => {
    if (subCategoryId && subcategories.length > 0) {
      const found = subcategories.find((opt) => opt.value === subCategoryId);
      if (found) {
        setSelectedsubCategory(found);
      }
    } else if (!subCategoryId) {
      setSelectedsubCategory(null);
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

  const handleBrandChange = (selectedOption) => setSelectedBrands(selectedOption);
  const handleUnitChange = (selectedOption) => setSelectedUnits(selectedOption);
  const handleWarehouseChange = (selectedOption) => setSelectedWarehouse(selectedOption);
  const handleHSNChange = (selectedOption) => setSelectedHSN(selectedOption);
  const subCategoryChange = (selectedOption) => setSelectedsubCategory(selectedOption);

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
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
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
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
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
    const sanitizedValue =
      type !== "checkbox" ? sanitizeHtml(value, sanitizeOptions) : value;
    const error =
      type !== "checkbox" ? validateInput(name, sanitizedValue) : "";
    setErrors((prev) => ({ ...prev, [name]: error }));
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : sanitizedValue,
    }));
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
  };

  const validateStep = () => {
    const newErrors = {};
    if (!formData.productName) newErrors.productName = "Product Name is required";
    if (formData.productName && !regexPatterns.productName.test(formData.productName)) newErrors.productName = "Invalid Product Name";
    if (!selectedCategory) newErrors.category = "Category is required";
    if (!selectedsubCategory) newErrors.subCategory = "Subcategory is required";
    if (!selectedHSN) newErrors.hsn = "HSN Code is required";
    if (formData.isAdvanced) {
      if (!formData.leadTime) newErrors.leadTime = "Lead Time is required";
      if (formData.leadTime && !regexPatterns.leadTime.test(formData.leadTime)) newErrors.leadTime = "Invalid Lead Time";
      if (!formData.reorderLevel) newErrors.reorderLevel = "Reorder Level is required";
      if (formData.reorderLevel && !regexPatterns.reorderLevel.test(formData.reorderLevel)) newErrors.reorderLevel = "Invalid Reorder Level";
      if (!formData.initialStock) newErrors.initialStock = "Initial Stock is required";
      if (formData.initialStock && !regexPatterns.initialStock.test(formData.initialStock)) newErrors.initialStock = "Invalid Initial Stock";
      if (formData.trackType === "serial" && !formData.serialNumber)
        newErrors.serialNumber = "Serial Number is required";
      if (formData.serialNumber && !regexPatterns.serialNumber.test(formData.serialNumber)) newErrors.serialNumber = "Invalid Serial Number";
      if (formData.trackType === "batch" && !formData.batchNumber)
        newErrors.batchNumber = "Batch Number is required";
      if (formData.batchNumber && !regexPatterns.batchNumber.test(formData.batchNumber)) newErrors.batchNumber = "Invalid Batch Number";
    }
    if (!formData.purchasePrice) newErrors.purchasePrice = "Purchase Price is required";
    if (formData.purchasePrice && !regexPatterns.price.test(formData.purchasePrice)) newErrors.purchasePrice = "Purchase Price must be a positive number with up to 2 decimal places";
    if (!formData.sellingPrice) newErrors.sellingPrice = "Selling Price is required";
    if (formData.sellingPrice && !regexPatterns.price.test(formData.sellingPrice)) newErrors.sellingPrice = "Selling Price must be a positive number with up to 2 decimal places";
    if (!formData.tax) newErrors.tax = "Tax Rate is required";
    // NEW: Update errors state with validation results
    setErrors(newErrors);
    return Object.values(newErrors).filter(Boolean); // Return array of error messages for toast notifications
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateStep();
    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
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
    if (formData.store) formPayload.append("store", formData.store);
    formPayload.append("warehouse", selectedWarehouse?.value || "");
    // Use variants[0] for fields managed in the Variants section
    const primaryVariant = variants[0] || {};
    if (primaryVariant.purchasePrice) formPayload.append("purchasePrice", primaryVariant.purchasePrice);
    if (primaryVariant.mrp) formPayload.append("mrp", primaryVariant.mrp);
    if (primaryVariant.sellingPrice) formPayload.append("sellingPrice", primaryVariant.sellingPrice);
    if (formData.retailPrice) formPayload.append("retailPrice", formData.retailPrice);
    if (primaryVariant.openingQuantity) formPayload.append("openingQuantity", primaryVariant.openingQuantity);
    if (primaryVariant.minStockToMaintain) formPayload.append("minStockToMaintain", primaryVariant.minStockToMaintain);
    if (primaryVariant.size) formPayload.append("size", primaryVariant.size);
    if (primaryVariant.color) formPayload.append("color", primaryVariant.color); formPayload.append("unit", selectedUnits?.value || "");
    if (primaryVariant.tax) formPayload.append("tax", primaryVariant.tax);
    if (primaryVariant.discountType) formPayload.append("discountType", primaryVariant.discountType);
    if (primaryVariant.discountAmount) formPayload.append("discountAmount", primaryVariant.discountAmount);
    if (formData.itemType) formPayload.append("itemType", formData.itemType);
    if (formData.isAdvanced) formPayload.append("isAdvanced", formData.isAdvanced ? true : false);
    if (formData.trackType) formPayload.append("trackType", formData.trackType); formPayload.append("isReturnable", formData.isReturnable ? true : false);
    if (formData.leadTime) formPayload.append("leadTime", formData.leadTime);
    if (formData.reorderLevel) formPayload.append("reorderLevel", formData.reorderLevel);
    if (formData.initialStock) formPayload.append("initialStock", formData.initialStock);
    if (formData.serialNumber) formPayload.append("serialNumber", formData.serialNumber);
    if (formData.batchNumber) formPayload.append("batchNumber", formData.batchNumber);
    if (formData.returnable) formPayload.append("returnable", formData.returnable ? true : false);
    if (formData.expirationDate) formPayload.append("expirationDate", formData.expirationDate); formPayload.append("hsn", selectedHSN?.value || "");
    if (formData.itemBarcode) formPayload.append("itemBarcode", formData.itemBarcode);

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
    if (formData.variants && Object.keys(formData.variants).length > 0)
      formPayload.append("variants", JSON.stringify(formData.variants));
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
      await api.put(`/api/products/${id}`, formPayload);
      toast.success("Product updated successfully!");
      const returnPath = location.state?.from || '/product';
      navigate(returnPath);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    }
  };

  const handleRemoveImage = async (file) => {
    if (file.public_id) {
      try {
        const res = await api.delete(`/api/products/${id}`, {
          data: { public_id: file.public_id },
        });
        setImages(res.data.images);
      } catch (err) {
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
      }
    } else {
      setImages((prev) => prev.filter((f) => f !== file));
    }
  };

  const handleValueChange = (index, value) => {
    setVariants(prev =>
      prev.map((v, i) => (i === index ? { ...v, selectedValue: value } : v))
    );
  };

  const handleAddVariant = () => {
    setVariants(prev => [
      ...prev,
      { selectedVariant: "", selectedValue: [], valueDropdown: [] }
    ]);
  };

  const handleRemoveVariant = index => {
    if (variants.length > 1) {
      setVariants(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleVariantImageChange = (index, e) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 1 * 1024 * 1024;
    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = [];
    const invalidErrors = [];
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
    }
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

  return (
    <div className="p-4" style={{ height: '100vh' }}>

      {/* header */}
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0px 0px 16px 0px", }} >
        <div style={{ display: "flex", alignItems: "center", gap: 11, }} >
          <Link
            to={location.state?.from || "/dashboard"}
            style={{ width: 32, height: 32, background: "white", borderRadius: 53, border: "1.07px solid #EAEAEA", display: "flex", justifyContent: "center", alignItems: "center", textDecoration: "none", }} >
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>
          <h2 style={{ margin: 0, color: "black", fontSize: 22, fontWeight: 500, lineHeight: "26.4px", }} >
            View Product Details
          </h2>
        </div>
      </div>

      {/* body */}
      <div>
        {loading ? (
          <div>
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        ) : noProductFound ? (
          <div className="text-center py-4" style={{ color: "#6C748C", padding: "12px 16px", verticalAlign: "middle", textAlign: "center", fontSize: 16, }}>
            No product found
          </div>
        ) : (
          <div style={{ width: "100%", padding: "16px 0px 16px 16px", background: "var(--White, white)", borderRadius: "16px", border: "1px var(--Stroke, #EAEAEA) solid", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: "24px", display: "flex", overflowX: 'auto', overflowY: "auto", maxHeight: "calc(100vh - 160px)", position: 'relative' }} >
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
                <div
                  style={{
                    color: "black",
                    fontSize: "16px",
                    fontFamily: "Inter",
                    fontWeight: "500",
                  }}
                >
                  General Details
                </div>

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
                  {formData.productName && (<div
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
                        Product Name
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
                      }}
                    >
                      <div
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
                      >{formData.productName}</div>
                    </div>
                  </div>)}

                  {/* category + sub-category */}
                  {selectedCategory && <div style={{
                    width: "22%",
                    display: 'flex',
                    gap: '16px',
                  }}>

                    {/* category */}
                    <div
                      style={{
                        width: selectedsubCategory ? "50%" : "100%",
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
                        }}
                      ><div
                        style={{
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          color: "var(--Black-Black, #0E101A)",
                        }}
                      >
                          {selectedCategory?.label || "N/A"}
                        </div>
                      </div>
                    </div>

                    {/* sub-category */}
                    {selectedsubCategory && <div
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
                          Sub - Category
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
                        }}
                      ><div
                        style={{
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          color: "var(--Black-Black, #0E101A)",
                        }}
                      >
                          {selectedsubCategory?.label || "N/A"}
                        </div>
                      </div>
                    </div>}
                  </div>}

                  {/* brand */}
                  {selectedBrands && <div
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
                        Brand
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
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          color: "var(--Black-Black, #0E101A)",
                        }}
                      >
                        {selectedBrands?.label || "-"}
                      </div>

                    </div>
                  </div>}

                  {/* description */}
                  {formData.description && (
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
                          Description
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          minHeight: "40px",
                          padding: "8px 12px",
                          background: "white",
                          borderRadius: "8px",
                          border:
                            "1px var(--White-Stroke, #EAEAEA) solid",
                          display: "flex",
                          alignItems: "center",
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
                        >
                          {formData.description}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* hsn code */}
                  {selectedHSN && <div
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
                        HSN
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
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          fontSize: "14px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                          color: "var(--Black-Black, #0E101A)",
                        }}
                        title={selectedHSN?.label}
                      >
                        {selectedHSN?.label.length > 30 ? selectedHSN?.label.slice(0, 30) + "..." : selectedHSN?.label}
                      </div>
                    </div>
                  </div>}

                  {/* unit */}
                  {formData.unit && lotPricing === false && (
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
                          Unit
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
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            color: "var(--Black-Black, #0E101A)",
                          }}
                        >
                          {formData.unit}
                        </div>
                      </div>
                    </div>
                  )}
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

              {lotPricing === true && listTab === "Lot / Batch" && (
                <div className="delete-hover">
                  <div
                    style={{
                      color: "black",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "500",
                      lineHeight: "19.20px",
                    }}
                  >
                    Lot / Batch
                  </div>

                  {variants.map((variant, index) => {
                    const openingQty =
                      Number(variant.openingQuantity || lotDetails.quantity || 0) ||
                      0;
                    const purchase =
                      Number(variant.purchasePrice || 0) || 0;
                    const selling =
                      Number(variant.sellingPrice || 0) || 0;
                    const perUnitCost =
                      openingQty > 0 && purchase > 0
                        ? (purchase / openingQty).toFixed(2)
                        : "0.00";
                    const perUnitSelling =
                      openingQty > 0 && selling > 0
                        ? (selling / openingQty).toFixed(2)
                        : "0.00";

                    return (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          gap: "19px",
                          width: "1830px",
                          overflowX: "auto",
                          padding: "16px 8px 0px 8px",
                        }}
                      >
                        {/* lot number */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "210px",
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
                              Lot No.
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
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                flex: 1,
                              }}
                            >
                              <div
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
                                {variant.lotNumber || lotDetails.lotNo || "-"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* unit */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "210px",
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
                            <div
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
                              {variant.unit || formData.unit || "-"}
                            </div>
                          </div>
                        </div>

                        {/* purchasing price */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "210px",
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
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                width: "100%",
                              }}
                            >
                              <div
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
                                {variant.purchasePrice || ""}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* tax */}
                        {variant.tax && <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "210px",
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
                            <div
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
                              {variant.tax ? `${variant.tax}%` : "-"}
                            </div>
                          </div>
                        </div>}

                        {/* opening quantity */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "210px",
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
                              Opening Quantity in lot
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
                            <div
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
                              {openingQty || ""}
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
                              ₹ {perUnitCost}
                            </span>
                          </span>
                        </div>

                        {/* available quantity */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "210px",
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
                              Available Quantity in lot
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
                            <div
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
                              {variant.stockQuantity || 0}
                            </div>
                          </div>
                        </div>

                        {/* min stock to maintain */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "210px",
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
                            <div
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
                              {variant.minStockToMaintain || 0}
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
                              ₹ {perUnitCost}
                            </span>
                          </span>
                        </div>

                        {/* selling price */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            width: "210px",
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
                            <div
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
                              {variant.sellingPrice || ""}
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
                              ₹ {perUnitSelling}
                            </span>
                          </span>
                        </div>

                      </div>
                    );
                  })}

                  {Array.isArray(variants) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }} className="delete-hover">
                      <div
                        style={{
                          color: "black",
                          fontSize: "16px",
                          fontFamily: "Inter",
                          fontWeight: "500",
                        }}
                      >
                        Serial Numbers
                      </div>

                      {variants.map((v, index) => (
                        v.serialNumbers && v.serialNumbers.length > 0 && (
                          <div
                            key={index}
                            style={{
                              width: "100%",
                              padding: "12px",
                              background: "#F9FAFB",
                              borderRadius: "8px",
                              border: "1px solid #EAEAEA",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px"
                            }}
                          >
                            <span style={{ fontSize: "14px", color: "#727681", fontWeight: "500" }}>
                              {`Serial Numbers: ${lotPricing ? `Lot ${index + 1}` : `Variant ${index + 1}`}`}
                            </span>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {v.serialNumbers.map((sn, i) => (
                                <span
                                  key={i}
                                  style={{
                                    padding: "4px 8px",
                                    background: "white",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                    border: "1px solid #EAEAEA",
                                    color: "#333",
                                  }}
                                >
                                  {sn}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      ))}

                      {variants.every(v => !v.serialNumbers || v.serialNumbers.length === 0) && (
                        <div
                          style={{
                            width: "100%",
                            padding: "12px",
                            background: "#F9FAFB",
                            borderRadius: "8px",
                            border: "1px solid #EAEAEA",
                          }}
                        >
                          <span>No Serial Numbers Added</span>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {lotPricing === false && listTab === "Pricing & Variants" && (
                <div style={{ width: '1832px' }} className="delete-hover">
                  {/* heading */}
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

                  {variants.map((variant, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        gap: "16px",
                        width: "1830px",
                        overflowX: "auto",
                        padding: "16px 8px",
                      }}
                    >

                      {/* Delete button */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "20px",
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
                          }}
                        >
                          <BsThreeDotsVertical className="fs-4" />
                        </div>
                      </div>

                      {/* purchasing price */}
                      {variant.purchasePrice && (
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
                              Purchasing Price
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
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
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
                                {variant.purchasePrice || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* MRP */}
                      {variant.mrp && (
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
                              MRP
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
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <div
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
                                {variant.mrp || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Selling Price */}
                      {variant.sellingPrice && <div
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
                            Selling Price
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
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
                            >{variant.sellingPrice || 0}
                            </div>
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
                      </div>}

                      {/* TAX */}
                      {variant.tax && <div
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
                            Tax
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
                          <div
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
                          >{variant.tax || 0}%
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
                      </div>}

                      {/* Size */}
                      {variant.size && <div
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
                            Size
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
                          <div
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
                            {/* {variant.size === 'XS' ? 'Extra Small (XS)' : variant.size === 'S' ? 'Small (S)' : variant.size === 'M' ? 'Medium (M)' : variant.size === 'L' ? 'Large (L)' : variant.size === 'XL' ? 'Extra Large (XL)' : 'N/A' || "N/A"} */}
                            {variant.size || "N/A"}
                          </div>
                        </div>
                      </div>}

                      {/* Color */}
                      {variant.color && <div
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
                            Color
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
                          <div
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
                          >{variant.color || "N/A"}
                          </div>
                        </div>
                      </div>}

                      {/* unit */}
                      {(variant.unit || formData.unit) && lotPricing === true && <div
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
                            Unit
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
                            color: 'black',
                          }}
                        >
                          {variant.unit || formData.unit || "N/A"}
                        </div>
                      </div>}

                      {/* Opening Quantity */}
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
                            Opening Quantity
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                              }}
                            >{variant.openingQuantity || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Available Quantity */}
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
                            Available Quantity
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                              }}
                            >{variant.stockQuantity || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Min. Stock to Maintain */}
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
                            Min. Stock to Maintain
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
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                border: "none",
                                background: "transparent",
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                              }}
                            >{variant.minStockToMaintain || 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Discount Section */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          width: "180px",
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
                              border: "1px var(--Stroke, #EAEAEA) solid",
                              justifyContent: "space-between",
                              display: "flex",
                              position: "relative",
                              width: "100%",
                            }}
                          >
                            <div
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
                                display: "flex",
                                alignItems: "center",
                              }}
                            >{variant.discountAmount || 0}
                            </div>
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
                                <div
                                  style={{
                                    color: "var(--Black-Secondary, #6C748C)",
                                    fontSize: "14px",
                                    fontFamily: "Poppins",
                                    fontWeight: "400",
                                    border: "none",
                                    background: "transparent",
                                  }}
                                >{variant.discountType === 'Fixed' ? '₹' : variant.discountType === 'Percentage' ? '%' : '-' || "-"}
                                </div>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {listTab === "Manufacturing" && (
                <div style={{}} className="delete-hover">
                  <div
                    style={{
                      color: "black",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "500",
                    }}
                  >
                    Manufacturing & Expiry Details
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
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            color: "var(--Black-Black, #0E101A)",
                          }}
                        >
                          {variants[0]?.manufacturingDate || "-"}
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
                          border: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          gap: "8px",
                          display: "flex",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            color: "var(--Black-Black, #0E101A)",
                          }}
                        >
                          {variants[0]?.expiryDate || "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {listTab === "Warranty" && (
                <div style={{}} className="delete-hover">
                  <div
                    style={{
                      color: "black",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "500",
                    }}
                  >
                    Warranty Details
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
                        <div
                          style={{
                            width: "100%",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            color: "var(--Black-Black, #0E101A)",
                          }}
                        >
                          {formData.warrantyType || "-"}
                        </div>
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
                        <div
                          style={{
                            width: "100%",
                            fontSize: "14px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            color: "var(--Black-Black, #0E101A)",
                          }}
                        >
                          {formData.warrantyPeriod || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.warrantyType === "Manufacturing" && (
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
                        </div>
                        <div
                          style={{
                            height: "40px",
                            background: "white",
                            borderRadius: "8px",
                            border: "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            display: "flex",
                            padding: "0 12px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              color: "var(--Black-Black, #0E101A)",
                            }}
                          >
                            {formData.coverageScope || "-"}
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
                        </div>
                        <div
                          style={{
                            height: "40px",
                            background: "white",
                            borderRadius: "8px",
                            border: "1px var(--White-Stroke, #EAEAEA) solid",
                            justifyContent: "flex-start",
                            alignItems: "center",
                            display: "flex",
                            padding: "0 12px",
                          }}
                        >
                          <div
                            style={{
                              width: "100%",
                              fontSize: "14px",
                              fontFamily: "Inter",
                              fontWeight: "400",
                              color: "var(--Black-Black, #0E101A)",
                            }}
                          >
                            {formData.serviceMode || "-"}
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.maxClaimsAllowed || "-"}
                            </div>
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.inspectionRequired === true ? 'Yes' : 'No' || "-"}
                            </div>
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.warrantyStartsFrom || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.warrantyType === "Extended" && (
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
                          rowGap: "20px",
                          columnGap: "16px",
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
                              border: "1px var(--White-Stroke, #EAEAEA) solid",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "8px",
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.linkedto || "-"}
                            </div>
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
                              Extension Period
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.extensionPeriod || "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          rowGap: "20px",
                          columnGap: "16px",
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
                              Coverage Type
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.coverageType || "-"}
                            </div>
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
                              border: "1px var(--White-Stroke, #EAEAEA) solid",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "8px",
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.extendedWarrantyPrice || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.warrantyType === "Lifetime" && (
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
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            width: "100%",
                            border: "1px solid #1F7FFF",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            backgroundColor: "#E5F0FF",
                            fontSize: "12px",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            color: "#1F7FFF",
                          }}
                        >
                          Lifetime ≠ forever without rules. You must define scope, or claims will explode.
                        </div>
                      </div>

                      <div
                        style={{
                          rowGap: "20px",
                          columnGap: "16px",
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
                              Lifetime defination
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.lifetimeDefination || "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          rowGap: "20px",
                          columnGap: "16px",
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
                              Coverage of
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.coverageOf || "-"}
                            </div>
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
                              What is Not Covered
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.whatNotCovered || "-"}
                            </div>
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
                              border: "1px var(--White-Stroke, #EAEAEA) solid",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: "8px",
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.maxClaims || "-"}
                            </div>
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
                              Replacement Once only?
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
                            <div
                              style={{
                                width: "100%",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "400",
                                color: "var(--Black-Black, #0E101A)",
                              }}
                            >
                              {formData.replacementOnceOnly || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* barcode */}
              <div style={{ width: "99%", borderTop: '1px solid #EAEAEA', }}>
                <div
                  style={{
                    width: "45%",
                    marginTop: '24px',
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div className="d-flex justify-content-start align-items-center gap-4">
                    <div
                      style={{
                        color: "black",
                        fontSize: "16px",
                        fontFamily: "Inter",
                        fontWeight: "500",
                      }}
                    >
                      Barcode
                    </div>
                  </div>

                  {/* item code / bar code */}
                  <div style={{
                    width: "100%",
                    display: "grid",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "24px",
                  }}>
                    {variants.map((item, index) => (
                      <div
                        key={item.id}
                        style={{
                          width: "100%",
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
                            {listTab === "Lot / Batch" ? "Barcode" : "Barcode of Variant: " + (index + 1)}
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
                          >
                            {item.barcode || ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {images.length > 0 && (
                <div style={{ width: "1832px", borderTop: '1px solid #EAEAEA', }}>
                  <div
                    style={{
                      width: "36%",
                      marginTop: '24px',
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      border: "1px solid #EAEAEA",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        color: "black",
                        fontSize: "16px",
                        fontFamily: "Inter",
                        fontWeight: "500",
                      }}
                    >
                      Images
                    </div>

                    <div
                      style={{
                        // display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        // gap: "16px",
                      }}
                    >

                      {/* Variant/Lot Images */}
                      {variants.map((v, index) => (
                        v.images && v.images.length > 0 && (
                          <div key={index} style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            width: "300px",
                            minHeight: "150px",
                            alignItems: "center",
                            border: "2px dashed #EAEAEA",
                            borderRadius: "8px",
                            padding: '25px',
                          }}>
                            <span style={{ fontSize: "14px", color: "#727681", fontWeight: "500" }}>
                              {`Images: ${lotPricing ? `Lot ${index + 1}` : `Variant ${index + 1}`}`}
                            </span>
                            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "13px" }}>
                              {v.images.map((img, i) => (
                                <div key={i} style={{ position: "relative" }}>
                                  <img
                                    src={img.url}
                                    className="img-thumbnail"
                                    style={{ height: 100, width: 100, objectFit: "cover" }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>)}
      </div>
    </div >
  );
};

export default ProductView;
