import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { FiChevronDown } from "react-icons/fi";
import { CiBarcode } from "react-icons/ci";
import { RiImageAddFill } from "react-icons/ri";
import { RiDeleteBinLine } from "react-icons/ri";
import { FaBarcode } from "react-icons/fa6";
import { FiMinus, FiPlus, FiX } from "react-icons/fi";
import { IoIosCheckmark } from "react-icons/io";
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiSearch } from "react-icons/fi";
import DatePicker from "react-datepicker";
import { FaCircleExclamation } from "react-icons/fa6";

// images
import indialogo from "../../assets/images/india-logo.png";
import total_orders_icon from "../../assets/images/totalorders-icon.png";
import ProductDefaultImage from "../../../src/assets/images/product-default.png";
import api from "../../pages/config/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

function ConvertGRNVerificationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const purchaseOrder = location.state?.purchaseOrder;

  // ========== STATES ==========
  const [supplierSearch, setSupplierSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [searchData, setSearchData] = useState({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [additionalDiscountType, setAdditionalDiscountType] = useState("Percentage");
  const [companyData, setCompanyData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);
  const [printSettings, setPrintSettings] = useState({
    showHSN: true,
    showDescription: true,
    showRate: true,
    showTax: true,
    showTotalsInWords: true,
    showBankDetails: true,
    showTermsConditions: true,
    signatureUrl: "",
  });
  const [viewManageOptions, setViewManageOptions] = useState(false);
  const [viewInvoiceOptions, setViewInvoiceOptions] = useState(false);
  const [viewChargeOptions, setViewChargeOptions] = useState(false);
  const [selectedChargeType, setSelectedChargeType] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [popupMode, setPopupMode] = useState(null);
  const [popupSelectedProduct, setPopupSelectedProduct] = useState(null);
  const [popupSelectedColor, setPopupSelectedColor] = useState("");
  const [popupSelectedSize, setPopupSelectedSize] = useState("");
  const [popupSelectedSerialno, setPopupSelectedSerialno] = useState("");
  const [popupSelectedQty, setPopupSelectedQty] = useState(1);
  const [popupActiveImageIndex, setPopupActiveImageIndex] = useState(0);
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [referenceNo, setReferenceNo] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date());
  const [isReceiptDatePickerOpen, setIsReceiptDatePickerOpen] = useState(false);
  const [viewReceiptDateOptions, setViewReceiptDateOptions] = useState(false);
  const [isCustomReceiptDatePickerOpen, setIsCustomReceiptDatePickerOpen] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState([]);
  const [supplier, setSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstin: "",
    supplierId: "",
  });
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [invoiceNo, setInvoiceNo] = useState("");
  const [settings, setSettings] = useState({
    brand: false,
    category: false,
    subcategory: false,
    itembarcode: false,
    hsn: false,
    lotno: false,
    serialno: false,
    variants: { size: false, color: false },
    units: false,
    expiry: false,
  });
  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
    priceIncludeGST: true,
    defaultGSTRate: "18",
    autoRoundOff: "0",
  });
  const [products, setProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [additionalChargesDetails, setAdditionalChargesDetails] = useState({
    shipping: 0,
    handling: 0,
    packing: 0,
    service: 0,
    other: 0,
  });
  const [additionalDiscountPct, setAdditionalDiscountPct] = useState("");
  const [additionalDiscountAmt, setAdditionalDiscountAmt] = useState("");
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [fullyReceived, setFullyReceived] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("draft");
  const [addSerialPopup, setAddSerialPopup] = useState(false);
  const [showBatchPopup, setShowBatchPopup] = useState(false);
  const [showSerialPopup, setShowSerialPopup] = useState(false);

  const [productCache, setProductCache] = useState({});
  const [trackingByRowId, setTrackingByRowId] = useState({});
  const [serialInput, setSerialInput] = useState("");
  const [activeTrackingRowId, setActiveTrackingRowId] = useState(null);

  // ========== FETCH PRODUCTS FOR TRACKING ==========
  useEffect(() => {
    const fetchProductsForTracking = async () => {
      const idsToFetch = [...new Set(products.map(p => p.productId).filter(Boolean))]
        .filter(id => !productCache[id]);
      if (idsToFetch.length === 0) return;

      try {
        const results = await Promise.all(
          idsToFetch.map(id => api.get(`/api/products/${id}`).then(res => ({ id, data: res.data })))
        );
        setProductCache(prev => {
          const next = { ...prev };
          results.forEach(({ id, data }) => { next[id] = data; });
          return next;
        });
      } catch (err) {
        console.error("Failed to fetch product details for tracking pre-fill:", err);
      }
    };
    fetchProductsForTracking();
  }, [products]);

  // ========== INITIALIZE TRACKING ==========
  useEffect(() => {
    setTrackingByRowId(prev => {
      const next = { ...prev };
      products.forEach((p) => {
        if (next[p.id] || !p.productId) return;
        const product = productCache[p.productId];
        if (!product) return;

        const variants = product.variants || [];
        const ref =
          variants.find(v => p.lotNumber && String(v.lotNumber || "") === String(p.lotNumber)) ||
          variants.find(v =>
            (!p.selectedColor || v.color === p.selectedColor) &&
            (!p.selectedSize || v.size === p.selectedSize)
          ) ||
          variants[0] ||
          null;

        // next[p.id] = {  
        //     variantId: ref?._id || "",
        //     lotNumber: ref?.lotNumber || "",
        //     modelNo: ref?.modelNo || "",
        //     expiryDate: ref?.expiryDate ? String(ref.expiryDate).split("T")[0] : "",
        //     manufacturingDate: ref?.manufacturingDate ? String(ref.manufacturingDate).split("T")[0] : "",
        //     warrantyType: ref?.warrantyType || "",
        //     warrantyPeriod: ref?.warrantyPeriod || "",
        //     coverageScope: ref?.coverageScope || "",
        //     serviceMode: ref?.serviceMode || "",
        //     maxClaimsAllowed: ref?.maxClaimsAllowed || "",
        //     inspectionRequired: ref?.inspectionRequired || false,
        //     warrantyStartsFrom: ref?.warrantyStartsFrom || "",
        //     linkedto: ref?.linkedto || "Manufacturer Warranty",
        //     extensionPeriod: ref?.extensionPeriod || "",
        //     coverageType: ref?.coverageType || "",
        //     extendedWarrantyPrice: ref?.extendedWarrantyPrice || "",
        //     lifetimeDefination: ref?.lifetimeDefination || "",
        //     coverageOf: ref?.coverageOf || "",
        //     whatNotCovered: ref?.whatNotCovered || "",
        //     maxClaims: ref?.maxClaims || "",
        //     replacementOnceOnly: ref?.replacementOnceOnly || false,
        //     availableSerialNumbers: ref?.serialNumbers || [],
        //     selectedSerialNos: [],
        //     isModified: false,
        //   };
        next[p.id] = {
          variantId: ref?._id || "",
          lotNumber: "",                    // always blank for new purchase
          modelNo: "",                      // always blank — let user type or confirm manually
          expiryDate: "",                   // always blank
          manufacturingDate: "",            // always blank
          warrantyType: ref?.warrantyType || "",
          warrantyPeriod: ref?.warrantyPeriod || "",
          coverageScope: ref?.coverageScope || "",
          serviceMode: ref?.serviceMode || "",
          maxClaimsAllowed: ref?.maxClaimsAllowed || "",
          inspectionRequired: ref?.inspectionRequired || false,
          warrantyStartsFrom: ref?.warrantyStartsFrom || "",
          linkedto: ref?.linkedto || "Manufacturer Warranty",
          extensionPeriod: ref?.extensionPeriod || "",
          coverageType: ref?.coverageType || "",
          extendedWarrantyPrice: ref?.extendedWarrantyPrice || "",
          lifetimeDefination: ref?.lifetimeDefination || "",
          coverageOf: ref?.coverageOf || "",
          whatNotCovered: ref?.whatNotCovered || "",
          maxClaims: ref?.maxClaims || "",
          replacementOnceOnly: ref?.replacementOnceOnly || false,
          availableSerialNumbers: ref?.serialNumbers || [],
          selectedSerialNos: [],
          isModified: false,
        };
      });
      return next;
    });
  }, [productCache, products]);

  // ========== TRACKING HELPERS ==========
  const updateTracking = (rowId, field, value) => {
    setTrackingByRowId(prev => {
      const current = prev[rowId] || {};
      return {
        ...prev,
        [rowId]: { ...current, [field]: value, isModified: true },
      };
    });
  };

  const getCurrentTracking = (rowId) => {
    return trackingByRowId[rowId] || {};
  };

  // ========== SERIAL NUMBER MANAGEMENT ==========
  const handleAddSerial = () => {
    if (!serialInput.trim()) return;
    const currentSerials = trackingByRowId[activeTrackingRowId]?.selectedSerialNos || [];
    const newSerials = serialInput.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);

    const validSerials = newSerials.filter(s => /^[a-zA-Z0-9\-_]+$/.test(s));
    if (validSerials.length === 0) {
      toast.error("Invalid serial number format. Use alphanumeric, dash, or underscore.");
      return;
    }

    const existingSet = new Set(currentSerials);
    const duplicates = validSerials.filter(s => existingSet.has(s));
    if (duplicates.length > 0) {
      toast.warning(`Duplicate serials: ${duplicates.join(', ')}`);
    }

    const uniqueSerials = validSerials.filter(s => !existingSet.has(s));
    if (uniqueSerials.length === 0) {
      toast.info("No new serials to add");
      return;
    }

    updateTracking(activeTrackingRowId, "selectedSerialNos", [...currentSerials, ...uniqueSerials]);
    setSerialInput("");
    toast.success(`Added ${uniqueSerials.length} serial numbers`);
  };

  const handleRemoveSerial = (serialToRemove) => {
    const currentSerials = trackingByRowId[activeTrackingRowId]?.selectedSerialNos || [];
    updateTracking(activeTrackingRowId, "selectedSerialNos",
      currentSerials.filter(s => s !== serialToRemove)
    );
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r?\n/).filter(Boolean);
      const serials = lines.map(line => line.trim()).filter(s => /^[a-zA-Z0-9\-_]+$/.test(s));

      if (serials.length === 0) {
        toast.error("No valid serials found in CSV");
        return;
      }

      const currentSerials = trackingByRowId[activeTrackingRowId]?.selectedSerialNos || [];
      const existingSet = new Set(currentSerials);
      const newSerials = serials.filter(s => !existingSet.has(s));

      if (newSerials.length === 0) {
        toast.info("All serials already exist");
        return;
      }

      updateTracking(activeTrackingRowId, "selectedSerialNos", [...currentSerials, ...newSerials]);
      toast.success(`Added ${newSerials.length} serials from CSV`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ========== BATCH QUANTITY MANAGEMENT ==========
  const handleBatchQuantityChange = (value) => {
    const numValue = parseFloat(value) || 0;
    setProducts(prev => prev.map(p => {
      if (p.id === activeTrackingRowId) {
        return { ...p, receivingNow: numValue };
      }
      return p;
    }));
    updateTracking(activeTrackingRowId, "quantity", numValue);
  };

  // ========== LOAD PURCHASE ORDER DATA ==========
  useEffect(() => {
    if (purchaseOrder) {
      loadPurchaseOrderData();
    }
    setReceiptDate(new Date());
  }, [purchaseOrder]);

  const loadPurchaseOrderData = () => {
    if (!purchaseOrder) return;

    // 1. Load Supplier Details
    const supplierData = purchaseOrder.supplierId;
    if (supplierData) {
      const addressParts = [];
      if (supplierData.address) addressParts.push(supplierData.address);
      if (supplierData.city) addressParts.push(supplierData.city);
      if (supplierData.state) addressParts.push(supplierData.state);
      if (supplierData.country) addressParts.push(supplierData.country);
      if (supplierData.pincode) addressParts.push(supplierData.pincode);

      setSupplier({
        name: supplierData.supplierName || supplierData.name || "",
        phone: supplierData.phone || "",
        address: addressParts.join(", "),
        email: supplierData.email || "",
        gstin: supplierData.gstin || "",
        supplierId: supplierData._id || "",
      });
      setSupplierSearch(supplierData.supplierName || supplierData.name || "");
      setPhoneSearch(supplierData.phone || "");
    }

    setInvoiceNo(purchaseOrder.purchaseNo || "");

    if (purchaseOrder.additionalChargesDetails) {
      setAdditionalChargesDetails({
        shipping: purchaseOrder.additionalChargesDetails.shipping || 0,
        handling: purchaseOrder.additionalChargesDetails.handling || 0,
        packing: purchaseOrder.additionalChargesDetails.packing || 0,
        service: purchaseOrder.additionalChargesDetails.service || 0,
        other: purchaseOrder.additionalChargesDetails.other || 0,
      });
    }

    if (purchaseOrder.attachments && purchaseOrder.attachments.length > 0) {
      const attachments = purchaseOrder.attachments.map(att => ({
        file: null,
        url: att.url,
        preview: att.url,
        filename: att.filename,
        type: att.fileType,
        fileExt: att.filename?.split('.').pop()?.toLowerCase(),
        public_id: att.public_id,
        isExisting: true
      }));
      setUploadedAttachments(attachments);
    }

    const loadedProducts = purchaseOrder.items.map((item, index) => {
      const orderedQty = item.qty || 0;
      const previousReceived = item.previousReceivedQty || 0;
      const remainingQty = orderedQty - previousReceived;

      return {
        id: Date.now() + index,
        productId: item.productId?._id || item.productId,
        itemName: item.itemName,
        unit: item.unit,
        unitPrice: item.unitPrice,
        receivingPrice: item.unitPrice,
        orderedQty: orderedQty,
        previousReceived: previousReceived,
        receivingNow: remainingQty > 0 ? remainingQty : 0,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount || 0,
        amount: 0,
        status: remainingQty > 0 ? "pending" : "full",
        selectedSerialNos: item.selectedSerialNos || [],
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        lotNumber: item.lotNumber || "",
      };
    });
    setProducts(loadedProducts);
  };

  // ========== CALCULATIONS ==========
  const subtotal = products.reduce((sum, p) => sum + (p.receivingNow * (p.receivingPrice || p.unitPrice)), 0);
  const totalTax = products.reduce((sum, p) => sum + ((p.receivingNow * (p.receivingPrice || p.unitPrice) * (p.taxRate || 0)) / 100), 0);

  const additionalChargesTotal = Object.values(additionalChargesDetails).reduce((sum, charge) => {
    const val = parseFloat(charge) || 0;
    return sum + val;
  }, 0);

  const grandTotal = subtotal + totalTax + additionalChargesTotal;

  // ========== HANDLERS ==========
  const handleBack = () => {
    navigate(location.state?.from || -1);
  };

  const handleReceiptDateSelect = (option) => {
    const today = new Date();
    let selectedDate = new Date();

    switch (option) {
      case "Today":
        selectedDate = today;
        break;
      case "Yesterday":
        selectedDate = new Date(today.setDate(today.getDate() - 1));
        break;
      case "Last Week":
        selectedDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case "Last 15 Days":
        selectedDate = new Date(today.setDate(today.getDate() - 15));
        break;
      case "Last Month":
        selectedDate = new Date(today.setMonth(today.getMonth() - 1));
        break;
      case "Custom":
        setIsCustomReceiptDatePickerOpen(true);
        setViewReceiptDateOptions(false);
        return;
      default:
        selectedDate = today;
    }
    setReceiptDate(selectedDate);
    setViewReceiptDateOptions(false);
    setIsCustomReceiptDatePickerOpen(false);
  };

  const updateReceivingQty = (id, value) => {
    const numValue = parseFloat(value) || 0;
    setProducts(prev => prev.map(p => {
      if (p.id !== id) return p;

      const remaining = p.orderedQty - p.previousReceived;
      let status = "pending";

      if (numValue === remaining && remaining > 0) status = "full";
      else if (numValue > remaining) status = "over";
      else if (numValue > 0 && numValue < remaining) status = "partial";

      const amount = numValue * (p.receivingPrice || p.unitPrice);

      return {
        ...p,
        receivingNow: numValue,
        status: status,
        amount: amount
      };
    }));
  };

  // const updateReceivingPrice = (id, value) => {
  //   const numValue = parseFloat(value) || 0;
  //   setProducts(prev => prev.map(p => {
  //     if (p.id !== id) return p;
  //     const amount = p.receivingNow * numValue;
  //     return {
  //       ...p,
  //       receivingPrice: numValue,
  //       amount: amount
  //     };
  //   }));
  // };
  const updateReceivingPrice = (id, value) => {
    // Allow empty string to clear the field
    if (value === "" || value === null || value === undefined) {
      setProducts(prev => prev.map(p => {
        if (p.id !== id) return p;
        return {
          ...p,
          receivingPrice: "",  // Store as empty string to allow clearing
          amount: 0
        };
      }));
      return;
    }

    const numValue = parseFloat(value);
    // Only update if it's a valid number
    if (!isNaN(numValue)) {
      setProducts(prev => prev.map(p => {
        if (p.id !== id) return p;
        const amount = (p.receivingNow || 0) * numValue;
        return {
          ...p,
          receivingPrice: numValue,
          amount: amount
        };
      }));
    }
  };

  const handleChargeSelect = (chargeType) => {
    setSelectedChargeType(chargeType);
    setViewChargeOptions(false);
  };

  const handleChargeDone = () => {
    if (chargeAmount && selectedChargeType) {
      const chargeKey = selectedChargeType.toLowerCase().replace(" charge", "");
      const validChargeKeys = ["shipping", "handling", "packing", "service", "other"];
      if (validChargeKeys.includes(chargeKey)) {
        const amount = parseFloat(chargeAmount) || 0;
        setAdditionalChargesDetails((prev) => ({
          ...prev,
          [chargeKey]: amount,
        }));
        setChargeAmount("");
        setSelectedChargeType("");
        setViewChargeOptions(false);
        toast.success(`${selectedChargeType} added: ₹${amount}`);
      }
    }
  };

  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files);

    const allowedTypes = [
      "image/jpeg", "image/jpg", "image/png", "image/gif",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.xlsx', '.csv', '.doc', '.docx', '.txt'];

    const validFiles = files.filter((file) => {
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.includes(file.type) || allowedExtensions.includes(fileExt);
    });

    if (validFiles.length !== files.length) {
      toast.error("Some files were not allowed. Allowed: Images, PDF, Excel, CSV, DOC, TXT");
    }

    const newFiles = validFiles.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      filename: file.name,
      type: file.type,
      size: file.size,
      fileExt: file.name.split('.').pop()?.toLowerCase(),
      isNew: true
    }));

    setUploadedAttachments((prev) => [...prev, ...newFiles]);
  };

  const removeAttachment = (index) => {
    setUploadedAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeProductRow = (id) => {
    if (products.length <= 1) {
      toast.warning("Cannot remove the last product");
      return;
    }

    const productToRemove = products.find(p => p.id === id);
    if (!productToRemove) return;

    if (productToRemove.receivingNow > 0) {
      toast.warning("Cannot delete a product that has already been received. Please set receiving quantity to 0 first.");
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== id));
    toast.info(`${productToRemove.itemName} removed from GRN`);
  };

  // ========== SUBMIT HANDLER ==========
  const handleSubmit = async () => {
    const hasReceiving = products.some(p => p.receivingNow > 0);
    if (!hasReceiving) {
      toast.error("Please specify at least one product to receive");
      return;
    }

    // Validate tracking for products with receiving quantity
    for (const product of products) {
      if (product.receivingNow > 0) {
        const tracking = trackingByRowId[product.id] || {};

        // If lot number is enabled and product has receiving quantity, lot number is required
        if (settings.lotno && !tracking.lotNumber) {
          toast.error(`Batch/Lot number is required for ${product.itemName}`);
          return;
        }

        // If expiry tracking is enabled and product has receiving quantity, expiry date is required
        if (settings.expiry && !tracking.expiryDate) {
          toast.error(`Expiry date is required for ${product.itemName}`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("purchaseOrderId", purchaseOrder._id);
      formData.append("receiveDate", receiptDate ? receiptDate.toISOString() : new Date().toISOString());
      formData.append("subtotal", subtotal);
      formData.append("totalTax", totalTax);

      const shipping = parseFloat(additionalChargesDetails.shipping) || 0;
      const handling = parseFloat(additionalChargesDetails.handling) || 0;
      const packing = parseFloat(additionalChargesDetails.packing) || 0;
      const service = parseFloat(additionalChargesDetails.service) || 0;
      const other = parseFloat(additionalChargesDetails.other) || 0;
      const additionalChargesTotal = shipping + handling + packing + service + other;

      formData.append("additionalCharges", additionalChargesTotal);
      formData.append("additionalChargesDetails[shipping]", shipping);
      formData.append("additionalChargesDetails[handling]", handling);
      formData.append("additionalChargesDetails[packing]", packing);
      formData.append("additionalChargesDetails[service]", service);
      formData.append("additionalChargesDetails[other]", other);

      formData.append("grandTotal", grandTotal);
      formData.append("notes", "");

      // Add items with receiving details
      products.forEach((p, index) => {
        if (p.receivingNow > 0) {
          const tracking = trackingByRowId[p.id] || {};

          let cleanSerialNos = [];
          const serialNos = tracking.selectedSerialNos || [];
          if (Array.isArray(serialNos)) {
            cleanSerialNos = serialNos.filter(s => s !== "" && s !== "[]" && s !== null && s !== undefined);
          } else if (typeof serialNos === 'string') {
            try {
              if (serialNos.startsWith('[') && serialNos.endsWith(']')) {
                const parsed = JSON.parse(serialNos);
                if (Array.isArray(parsed)) {
                  cleanSerialNos = parsed.filter(s => s !== "" && s !== "[]" && s !== null && s !== undefined);
                }
              }
            } catch (e) {
              // If it's a single value
              if (serialNos.trim() !== "" && serialNos !== "[]") {
                cleanSerialNos = [serialNos.trim()];
              }
            }
          }

          formData.append(`items[${index}][productId]`, p.productId);
          formData.append(`items[${index}][itemName]`, p.itemName);
          formData.append(`items[${index}][unit]`, p.unit);
          formData.append(`items[${index}][orderedQty]`, p.orderedQty);
          formData.append(`items[${index}][previousReceived]`, p.previousReceived);
          formData.append(`items[${index}][receivingNow]`, p.receivingNow);
          formData.append(`items[${index}][unitPrice]`, p.unitPrice);
          formData.append(`items[${index}][receivingPrice]`, p.receivingPrice || p.unitPrice);
          formData.append(`items[${index}][taxRate]`, p.taxRate);
          formData.append(`items[${index}][taxAmount]`, p.taxAmount || 0);
          formData.append(`items[${index}][amount]`, p.amount || 0);
          formData.append(`items[${index}][selectedSerialNos]`, JSON.stringify(cleanSerialNos));
          formData.append(`items[${index}][selectedColor]`, p.selectedColor || "");
          formData.append(`items[${index}][selectedSize]`, p.selectedSize || "");

          // ===== TRACKING FIELDS =====
          formData.append(`items[${index}][variantId]`, tracking.variantId || "");
          formData.append(`items[${index}][lotNumber]`, tracking.lotNumber || "");
          formData.append(`items[${index}][modelNo]`, tracking.modelNo || "");
          formData.append(`items[${index}][expiryDate]`, tracking.expiryDate || "");
          formData.append(`items[${index}][manufacturingDate]`, tracking.manufacturingDate || "");
          formData.append(`items[${index}][warrantyType]`, tracking.warrantyType || "");
          formData.append(`items[${index}][warrantyPeriod]`, tracking.warrantyPeriod || "");
          formData.append(`items[${index}][coverageScope]`, tracking.coverageScope || "");
          formData.append(`items[${index}][serviceMode]`, tracking.serviceMode || "");
          formData.append(`items[${index}][maxClaimsAllowed]`, tracking.maxClaimsAllowed || "");
          formData.append(`items[${index}][inspectionRequired]`, tracking.inspectionRequired ? "true" : "false");
          formData.append(`items[${index}][warrantyStartsFrom]`, tracking.warrantyStartsFrom || "");
          formData.append(`items[${index}][linkedto]`, tracking.linkedto || "");
          formData.append(`items[${index}][extensionPeriod]`, tracking.extensionPeriod || "");
          formData.append(`items[${index}][coverageType]`, tracking.coverageType || "");
          formData.append(`items[${index}][extendedWarrantyPrice]`, tracking.extendedWarrantyPrice || "");
          formData.append(`items[${index}][lifetimeDefination]`, tracking.lifetimeDefination || "");
          formData.append(`items[${index}][coverageOf]`, tracking.coverageOf || "");
          formData.append(`items[${index}][whatNotCovered]`, tracking.whatNotCovered || "");
          formData.append(`items[${index}][maxClaims]`, tracking.maxClaims || "");
          formData.append(`items[${index}][replacementOnceOnly]`, tracking.replacementOnceOnly ? "true" : "false");
        }
      });

      // Handle attachments
      const existingAttachments = [];
      const newFiles = [];

      uploadedAttachments.forEach((attachment) => {
        if (attachment.file instanceof File) {
          newFiles.push(attachment);
        } else if (attachment.url && attachment.public_id) {
          existingAttachments.push({
            url: attachment.url,
            public_id: attachment.public_id,
            filename: attachment.filename
          });
        }
      });

      if (existingAttachments.length > 0) {
        formData.append("existingAttachments", JSON.stringify(existingAttachments));
      }

      newFiles.forEach((attachment) => {
        if (attachment.file instanceof File) {
          formData.append("attachments", attachment.file, attachment.filename);
        }
      });

      const response = await api.post("/api/grn", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        toast.success("GRN created successfully!");
        navigate("/grnverification-list");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to create GRN");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== STYLES ==========
  const styles = `
    .product-row:hover .delete-icon {
      opacity: 1 !important;
    }
    .product-row:hover {
      background-color: #f8f9fa !important;
    }
    .table-input {
      width: 100%;
      height: 38px;
      background: white;
      overflow: hidden;
      border-radius: 4px;
      outline: 1px var(--Stroke, #EAEAEA) solid;
      outline-offset: -1px;
      padding: 6px 8px;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      color: var(--Black-Primary, #0E101A);
      text-align: center;
    }
    .table-input:focus {
      outline: 1px var(--Blue-Blue, #1F7FFF) solid;
      outline-offset: -1px;
    }
    .table-input-disabled {
      background: var(--Spinning-Frame, #E9F0F4);
      color: var(--Black-Secondary, #6C748C);
      cursor: not-allowed;
      outline: 1px var(--Stroke, #C2C9D1) solid;
    }
    .table-input-readonly {
      background: var(--Spinning-Frame, #E9F0F4);
    }
    .warranty-section {
      border-top: 1px solid #EAEAEA;
      padding-top: 16px;
      margin-top: 8px;
    }
  `;
  return (
    <>
      <style>{styles}</style>
      <div className="p-4" style={{ height: "100vh" }}>
        <div style={{ overflow: "hidden", height: "calc(100vh - 100px)" }}>
          {/* Header */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                height: "32px",
              }}
            >
              <span
                onClick={handleBack}
                style={{
                  backgroundColor: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "1px solid #FCFCFC",
                  cursor: "pointer",
                }}
              >
                <img src={total_orders_icon} alt="total_orders_icon" />
              </span>
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
                GRN Verification
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                height: "33px",
              }}
            >
              <div
                onClick={() => setViewInvoiceOptions(true)}
                style={{
                  padding: "6px 16px",
                  background: "#1F7FFF",
                  border: "1px solid #1F7FFF",
                  borderRadius: 8,
                  fontSize: "14px",
                  display: "flex",
                  gap: "8px",
                  alignItems: "center",
                  height: "33px",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <span className="fs-6">Preview</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              width: "100%",
              padding: "16px",
              background: "var(--White, white)",
              borderRadius: "16px",
              border: "1px var(--Stroke, #EAEAEA) solid",
              flexDirection: "column",
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: "24px",
              display: "flex",
              overflowX: "auto",
              height: "calc(100vh - 200px)",
            }}
          >
            {/* Supplier Details */}
            <div style={{ width: "100%" }}>
              <div
                style={{
                  color: "black",
                  fontSize: "16px",
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "19.20px",
                }}
              >
                Supplier Details
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "16px",
                  width: "100%",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    display: "inline-flex",
                  }}
                >
                  {/* Left side - Supplier details */}
                  <div style={{ width: "50%", borderRight: "2px solid #eee" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        gap: "45px",
                        width: "100%",
                      }}
                    >
                      {/* Supplier Name - Display supplier name */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          width: "40%",
                        }}
                      >
                        <label>Supplier Name</label>
                        <div
                          style={{
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #EAEAEA",
                            padding: "8px 12px",
                            marginTop: "4px",
                            background: "#F9FAFB",
                            fontSize: "14px",
                          }}
                        >
                          {supplier.name || "-"}
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          width: "40%",
                        }}
                      >
                        <label>Phone No.</label>
                        <div
                          style={{
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #EAEAEA",
                            padding: "8px 12px",
                            marginTop: "4px",
                            background: "#F9FAFB",
                            fontSize: "14px",
                          }}
                        >
                          {supplier.phone || "-"}
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    {/* <div style={{ marginTop: "10px", width: "50%" }}>
                      <label>Billing Address</label>
                      <div>
                        <textarea
                          placeholder="Enter Billing Address"
                          style={{
                            width: "170%",
                            height: "80px",
                            borderRadius: "8px",
                            border: "1px dashed #EAEAEA",
                            padding: "8px",
                            marginTop: "4px",
                            resize: "none",
                          }}
                          value={supplier.address}
                          onChange={(e) => setSupplier({ ...supplier, address: e.target.value })}
                        ></textarea>
                      </div>
                    </div> */}
                  </div>

                  {/* Right side - Purchase details */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      gap: "0px",
                      width: "50%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "end",
                        gap: "0px",
                        flexDirection: "column",
                      }}
                    >
                      <div
                        style={{
                          height: 30,
                          justifyContent: "flex-start",
                          alignItems: "center",
                          display: "inline-flex",
                          gap: "16px",
                          cursor: "pointer",
                        }}
                      >
                        {/* Purchase Order Number - Readonly */}
                        <div style={{ position: "relative", width: 200 }}>
                          <span
                            style={{
                              position: "absolute",
                              top: "-7px",
                              left: "12px",
                              background: "#fff",
                              padding: "0 6px",
                              fontSize: "11px",
                              color: "#6B7280",
                              zIndex: 10,
                            }}
                          >
                            Purchase Order Number
                          </span>
                          <div
                            style={{
                              height: 38,
                              padding: "0 12px",
                              border: "1px solid #A2A8B8",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "#F9FAFB",
                            }}
                          >
                            <input
                              type="text"
                              value={invoiceNo}
                              placeholder="PO Number"
                              maxLength={16}
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: 14,
                                fontFamily: "Inter",
                                fontWeight: "400",
                                background: "transparent",
                              }}
                              disabled
                            />
                          </div>
                        </div>

                        {/* GRN number - Will be auto-generated on save */}
                        <div style={{ position: "relative", width: 200 }}>
                          <span
                            style={{
                              position: "absolute",
                              top: "-7px",
                              left: "12px",
                              background: "#fff",
                              padding: "0 6px",
                              fontSize: "11px",
                              color: "#6B7280",
                              zIndex: 10,
                            }}
                          >
                            GRN No.
                          </span>
                          <div
                            style={{
                              height: 38,
                              padding: "0 12px",
                              border: "1px solid #A2A8B8",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              background: "#F9FAFB",
                            }}
                          >
                            <input
                              type="text"
                              value="Auto-generated on save"
                              placeholder="Auto-generated on save"
                              maxLength={16}
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: 14,
                                fontFamily: "Inter",
                                fontWeight: "400",
                                background: "transparent",
                                color: "#6B7280",
                              }}
                              disabled
                            />
                          </div>
                        </div>

                        {/* Received Date */}
                        <div style={{ position: "relative", width: 200 }}>
                          <span
                            style={{
                              position: "absolute",
                              top: "-7px",
                              left: "12px",
                              background: "#ffff",
                              padding: "0 6px",
                              fontSize: "11px",
                              color: "#6B7280",
                              zIndex: 10,
                            }}
                          >
                            Receive Date
                          </span>
                          <div
                            style={{
                              height: 38,
                              padding: "0 12px",
                              border: "1px solid #A2A8B8",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: "pointer",
                              background: "#fff",
                            }}
                            onClick={() => setViewReceiptDateOptions(true)}
                          >
                            <LuCalendarMinus2 />
                            <div
                              style={{
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: 14,
                                fontFamily: "Inter",
                                fontWeight: "400",
                                lineHeight: 16.8,
                                wordWrap: "break-word",
                              }}
                            >
                              {receiptDate ? format(receiptDate, "dd MMM yyyy") : "Select Date"}
                            </div>
                            <FiChevronDown />

                            {/* Receipt Date Options Dropdown */}
                            {viewReceiptDateOptions && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "40px",
                                  left: "0px",
                                  zIndex: 999999,
                                }}
                              >
                                <div
                                  style={{
                                    background: "white",
                                    padding: 6,
                                    borderRadius: 12,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                    minWidth: 200,
                                    height: "auto",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 4,
                                  }}
                                >
                                  {[
                                    "Today",
                                    "Yesterday",
                                    "Last Week",
                                    "Last 15 Days",
                                    "Last Month",
                                    "Custom",
                                  ].map((option) => (
                                    <div
                                      key={option}
                                      style={{
                                        display: "flex",
                                        justifyContent: "flex-start",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "5px 12px",
                                        borderRadius: 8,
                                        border: "none",
                                        cursor: "pointer",
                                        fontFamily: "Inter, sans-serif",
                                        fontSize: 14,
                                        fontWeight: 400,
                                        color: "#6C748C",
                                        textDecoration: "none",
                                      }}
                                      className="button-action"
                                      onClick={() => handleReceiptDateSelect(option)}
                                    >
                                      <span style={{ color: "black" }}>{option}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Custom Date Picker for Receipt Date */}
                            {isCustomReceiptDatePickerOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "35px",
                                  left: "-100px",
                                  zIndex: 1000000,
                                  background: "white",
                                  padding: "10px",
                                  borderRadius: "8px",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DatePicker
                                  selected={receiptDate}
                                  onChange={(date) => {
                                    if (date) {
                                      setReceiptDate(date);
                                      setIsCustomReceiptDatePickerOpen(false);
                                      setViewReceiptDateOptions(false);
                                    }
                                  }}
                                  inline
                                  calendarClassName="custom-calendar"
                                />
                                <div
                                  style={{
                                    textAlign: "center",
                                    marginTop: "10px",
                                    display: "flex",
                                    gap: "10px",
                                    justifyContent: "center",
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      const today = new Date();
                                      setReceiptDate(today);
                                      setIsCustomReceiptDatePickerOpen(false);
                                      setViewReceiptDateOptions(false);
                                    }}
                                    style={{
                                      padding: "5px 15px",
                                      background: "#1F7FFF",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Today
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsCustomReceiptDatePickerOpen(false);
                                      setViewReceiptDateOptions(false);
                                    }}
                                    style={{
                                      padding: "5px 15px",
                                      background: "#f3f4f6",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Add Products */}
            <div
              style={{
                width: "100%",
                height: "100%",
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 16,
                display: "inline-flex",
              }}
            >
              <div
                style={{
                  alignSelf: "stretch",
                  justifyContent: "space-between",
                  alignItems: "center",
                  display: "inline-flex",
                }}
              >
                <div
                  style={{
                    color: "var(--Black-Black, #0E101A)",
                    fontSize: 16,
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: "19.20px",
                    wordWrap: "break-word",
                  }}
                >
                  Add Products
                </div>
                <div
                  style={{
                    height: 31.95,
                    justifyContent: "flex-start",
                    alignItems: "center",
                    display: "flex",
                  }}
                >
                  {/* <div
                    style={{
                      alignSelf: "stretch",
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 4.26,
                      paddingBottom: 4.26,
                      background: "white",
                      borderRadius: 8.52,
                      outline: "1.07px var(--Blue-Blue, #1F7FFF) solid",
                      outlineOffset: "-1.07px",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 8.52,
                      display: "flex",
                      cursor: "pointer",
                    }}
                    onClick={addProductRow}
                  >
                    <CiBarcode className="fs-4" />
                  </div> */}
                </div>
              </div>

              {/* Products Table */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  zIndex: 999,
                  cursor: "pointer",
                }}
              >
                {/* Table Header - Keep as is */}
                <div
                  style={{
                    width: "max-content",
                    minWidth: "100%",
                    paddingLeft: 8,
                    paddingRight: 8,
                    paddingTop: 6,
                    paddingBottom: 6,
                    background: "#E5F0FF",
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxSizing: "border-box",
                  }}
                >
                  {/* left */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Sl No.
                      </div>
                    </div>

                    <div
                      style={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Items
                      </div>
                    </div>
                  </div>

                  {/* right */}
                  <div
                    style={{
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 12,
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Unit Price
                      </div>
                    </div>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
                    {/* Receiving price */}
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Receiving Price
                      </div>
                    </div>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
                    {/* ordered quantity */}
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Ordered Qty
                      </div>
                    </div>
                    {/* previous received */}
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Previous Received
                      </div>
                    </div>
                    <div
                      style={{
                        width: 120,
                        height: 30,
                        paddingLeft: 12,
                        paddingRight: 12,
                        paddingTop: 4,
                        paddingBottom: 4,
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          color: "#727681",
                          fontSize: 14,
                          fontFamily: "Inter",
                          fontWeight: "500",
                          lineHeight: "16.80px",
                          wordWrap: "break-word",
                        }}
                      >
                        Receiving Now
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products List */}
                {!products || products.length === 0 ? (
                  <div
                    style={{
                      width: "100%",
                      padding: "16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    No Product found
                  </div>
                ) : (
                  <div
                    style={{
                      alignSelf: "stretch",
                      minHeight: "auto",
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 4,
                      paddingBottom: 4,
                      background: "white",
                      borderBottomRightRadius: 8,
                      borderBottomLeftRadius: 8,
                      borderLeft: "1px var(--White-Stroke, #EAEAEA) solid",
                      borderRight: "1px var(--White-Stroke, #EAEAEA) solid",
                      borderBottom: "1px var(--White-Stroke, #EAEAEA) solid",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      display: "flex",
                    }}
                  >
                    {products.map((p, idx) => (
                      <div
                        key={p.id}
                        style={{
                          width: "100%",
                          height: 46,
                          background: "white",
                          borderBottom: "1px var(--White-Stroke, #EAEAEA) solid",
                          justifyContent: "flex-start",
                          alignItems: "flex-start",
                          display: "flex",
                          position: "relative",
                          zIndex: activeSearchId === p.id ? 0 : 1,
                          overflow: "visible",
                        }}
                        className="product-row"
                      >
                        <div
                          className="delete-icon"
                          style={{
                            position: "absolute",
                            left: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            opacity: 0,
                            transition: "opacity 0.2s",
                            zIndex: 1,
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: p.receivingNow === 0 ? "pointer" : "not-allowed",
                            pointerEvents: p.receivingNow === 0 ? "auto" : "none",
                          }}
                        >
                          <RiDeleteBinLine
                            className="text-danger"
                            style={{
                              cursor: p.receivingNow === 0 ? "pointer" : "not-allowed",
                              opacity: p.receivingNow === 0 ? 1 : 0.3,
                              fontSize: "16px"
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (p.receivingNow === 0) {
                                removeProductRow(p.id);
                              } else {
                                toast.warning("Cannot delete a product that has already been received");
                              }
                            }}
                          />
                        </div>

                        <div
                          style={{
                            flex: "1 1 0%",
                            alignSelf: "stretch",
                            paddingTop: 4,
                            paddingBottom: 4,
                            justifyContent: "flex-start",
                            alignItems: "center",
                            gap: 8,
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              flex: "1 1 0%",
                              height: 40,
                              justifyContent: "flex-start",
                              alignItems: "center",
                              display: "flex",
                              gap: "15px",
                            }}
                          >
                            <div
                              style={{
                                width: 80,
                                height: 30,
                                paddingLeft: 2,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 8,
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  textAlign: "center",
                                  color: "var(--Black-Black, #0E101A)",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "16.80px",
                                  wordWrap: "break-word",
                                }}
                              >
                                {idx + 1}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center" }}>
                              <div
                                className="search-input-container"
                                style={{
                                  flex: "1 1 auto",
                                  minWidth: 0,
                                  position: "relative",
                                  overflow: "visible",
                                }}
                              >
                                <input
                                  type="text"
                                  value={p.itemName}
                                  onChange={(e) => { }}
                                  placeholder="Search Product by its name or item bar code"
                                  style={{
                                    border: "none",
                                    outline: "none",
                                    width: "100%",
                                    backgroundColor: "transparent",
                                    padding: "8px",
                                  }}
                                  readOnly
                                />
                              </div>
                              <div
                                style={{}}>
                                <button onClick={() => { setActiveTrackingRowId(p.id); setShowBatchPopup(true) }} style={{ border: "none", background: "transparent", color: "#1f7fff" }}>+ Manage Tracking</button>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              height: 40,
                              justifyContent: "flex-end",
                              alignItems: "center",
                              gap: 12,
                              display: "flex",
                            }}
                          >
                            {/* Unit Price */}
                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                                outline: "1px var(--Stroke, #EAEAEA) solid",
                                borderRadius: 4,
                                background: "#F9FAFB",
                              }}
                            >
                              <input
                                type="number"
                                placeholder="0.00"
                                className="table-input"
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  background: "transparent",
                                }}
                                value={p.unitPrice}
                                readOnly
                              />
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            {/* Receiving Price - Editable */}
                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                                outline: "1px var(--Stroke, #EAEAEA) solid",
                                borderRadius: 4,
                              }}
                            >
                              <input
                                type="number"
                                placeholder="0.00"
                                className="table-input"
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                }}
                                value={p.receivingPrice === "" ? "" : (p.receivingPrice || p.unitPrice)}
                                onChange={(e) => updateReceivingPrice(p.id, e.target.value)}
                                onBlur={(e) => {
                                  // If value is empty on blur, set it back to unit price
                                  const value = e.target.value;
                                  if (value === "" || value === null || value === undefined) {
                                    setProducts(prev => prev.map(prod => {
                                      if (prod.id !== p.id) return prod;
                                      return {
                                        ...prod,
                                        receivingPrice: prod.unitPrice,
                                        amount: (prod.receivingNow || 0) * prod.unitPrice
                                      };
                                    }));
                                  }
                                }}
                              />
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            {/* Ordered Qty - Readonly */}
                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                                outline: "1px var(--Stroke, #EAEAEA) solid",
                                borderRadius: 4,
                                background: "#F9FAFB",
                              }}
                            >
                              <input
                                type="number"
                                placeholder="0"
                                className="table-input"
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  background: "transparent",
                                }}
                                value={p.orderedQty}
                                readOnly
                              />
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            {/* Previous Received - Readonly */}
                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                                outline: "1px var(--Stroke, #EAEAEA) solid",
                                borderRadius: 4,
                                background: "#F9FAFB",
                              }}
                            >
                              <input
                                type="number"
                                placeholder="0"
                                className="table-input"
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  background: "transparent",
                                }}
                                value={p.previousReceived}
                                readOnly
                              />
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            {/* Receiving Now - Editable */}
                            <div
                              style={{
                                width: 120,
                                alignSelf: "stretch",
                                paddingLeft: 12,
                                paddingRight: 12,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "space-between",
                                alignItems: "center",
                                display: "flex",
                                outline: "1px var(--Stroke, #EAEAEA) solid",
                                borderRadius: 4,
                              }}
                            >
                              <input
                                type="number"
                                placeholder="0"
                                className="table-input"
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                }}
                                value={p.receivingNow}
                                onChange={(e) => updateReceivingQty(p.id, e.target.value)}
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div
              style={{
                background: "#fff",
                padding: "2px",
                width: "100%",
                marginTop: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "32px",
                  width: "100%",
                }}
              >
                {/* LEFT SIDE */}
                <div
                  style={{
                    width: "50%",
                    paddingRight: "32px",
                    borderRight: "2px solid #eee",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "24px",
                      color: "var(--Black-Black, #0E101A)",
                      fontSize: 16,
                      fontFamily: "Inter",
                      fontWeight: "500",
                      lineHeight: "19.20px",
                      wordWrap: "break-word",
                    }}
                  >
                    Payment Details
                  </div>

                  {/* Additional Discount */}
                  {/* <div style={{ marginBottom: "24px", width: "50%" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      Additional Discount
                    </div>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        width: "195px",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px" }}>
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
                          <input
                            type="number"
                            placeholder="0.00"
                            value={additionalDiscountType === "Percentage" ? additionalDiscountPct || "" : additionalDiscountType === "Fixed" ? additionalDiscountAmt || "" : ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = parseFloat(value);
                              if (additionalDiscountType === "Percentage") {
                                setAdditionalDiscountPct(value === "" ? "" : numValue);
                              } else if (additionalDiscountType === "Fixed") {
                                setAdditionalDiscountAmt(value === "" ? "" : numValue);
                              }
                            }}
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
                              minWidth: "60px",
                            }}
                          >
                            <select
                              value={additionalDiscountType}
                              onChange={(e) => {
                                const type = e.target.value;
                                setAdditionalDiscountType(type);
                                if (type === "") {
                                  setAdditionalDiscountPct("");
                                  setAdditionalDiscountAmt("");
                                }
                              }}
                              style={{
                                color: "var(--Black-Secondary, #6C748C)",
                                fontSize: "14px",
                                fontFamily: "Poppins",
                                fontWeight: "400",
                                border: "none",
                                background: "transparent",
                                cursor: "pointer",
                                outline: "none",
                              }}
                            >
                              <option value="">₹/%</option>
                              <option value="Fixed">₹</option>
                              <option value="Percentage">%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div> */}

                  {/* Additional Charges */}
                  <div
                    style={{
                      marginBottom: "24px",
                      display: "flex",
                      width: "100%",
                      gap: "10px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "8px",
                        }}
                      >
                        Additional Charges
                      </div>
                      {Object.entries(additionalChargesDetails).some(([_, value]) => value > 0) && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                            marginBottom: "12px",
                            padding: "8px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            border: "1px solid #e5e7eb",
                          }}
                        >
                          {Object.entries(additionalChargesDetails)
                            .filter(([_, value]) => value > 0)
                            .map(([key, value]) => (
                              <div
                                key={key}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  backgroundColor: "#e8f4ff",
                                  padding: "4px 12px",
                                  borderRadius: "16px",
                                  fontSize: "12px",
                                }}
                              >
                                <span style={{ fontWeight: "500", textTransform: "capitalize" }}>{key}:</span>
                                <span>₹{value.toFixed(2)}</span>
                                <button
                                  onClick={() => {
                                    setAdditionalChargesDetails((prev) => ({
                                      ...prev,
                                      [key]: 0,
                                    }));
                                  }}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#dc3545",
                                    fontSize: "14px",
                                    padding: "0",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          paddingRight: "6px",
                          position: "relative",
                        }}
                      >
                        <div style={{ padding: "10px 12px", fontSize: "14px" }}>₹</div>

                        <input
                          placeholder="0.00"
                          style={{
                            flex: 1,
                            border: "none",
                            padding: "10px 12px",
                            outline: "none",
                            fontSize: "14px",
                            width: "400px",
                          }}
                          value={chargeAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numericValue = value.replace(/[^\d.]/g, "");
                            setChargeAmount(numericValue);
                          }}
                        />


                        <div
                          style={{
                            background: "#2563eb",
                            color: "#fff",
                            padding: "6px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            border: "none",
                            marginRight: "6px",
                            cursor: "pointer",
                            minWidth: "80px",
                            textAlign: "center",
                          }}
                          onClick={() => setViewChargeOptions(!viewChargeOptions)}
                        >
                          {selectedChargeType ? selectedChargeType.replace("charge", "") : "Select Charge"} <FiChevronDown />
                        </div>
                        {viewChargeOptions && (
                          <div
                            style={{
                              position: "absolute",
                              top: "45px",
                              left: "0px",
                              zIndex: 999999,
                            }}
                          >
                            <div
                              style={{
                                background: "white",
                                padding: 6,
                                borderRadius: 12,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                minWidth: 300,
                                height: "auto",
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              {["Shipping Charge", "Handling Charge", "Packing Charge", "Service Charge", "Other Charge"].map((charge) => (
                                <div
                                  key={charge}
                                  style={{
                                    display: "flex",
                                    justifyContent: "flex-start",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "5px 12px",
                                    borderRadius: 8,
                                    border: "none",
                                    cursor: "pointer",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: 16,
                                    fontWeight: 400,
                                    color: "#6C748C",
                                    textDecoration: "none",
                                    transition: "background-color 0.2s",
                                  }}
                                  onClick={() => handleChargeSelect(charge)}
                                >
                                  <span style={{ color: "black" }}>{charge}</span>
                                  {selectedChargeType === charge && (
                                    <span style={{ color: "#1F7FFF", fontSize: "12px" }}>Selected</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={handleChargeDone}
                        disabled={!chargeAmount || !selectedChargeType}
                        style={{
                          padding: "6px 12px",
                          fontSize: "12px",
                          borderRadius: "20px",
                          background: chargeAmount && selectedChargeType ? "#fff" : "#f0f0f0",
                          border: "1px solid #d1d5db",
                          color: chargeAmount && selectedChargeType ? "#2563eb" : "#9ca3af",
                          marginTop: "25px",
                          cursor: chargeAmount && selectedChargeType ? "pointer" : "not-allowed",
                        }}
                      >
                        Add Charge
                      </button>

                    </div>
                  </div>

                  {/* Upload Attachments */}
                  <div style={{ marginTop: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                      Attachments (Images, PDF, Excel, CSV, DOC, TXT)
                    </div>
                    <div
                      style={{
                        width: "80px",
                        height: "90px",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: "pointer",
                        flexDirection: "column",
                        fontSize: "12px",
                        color: "#9ca3af",
                        position: "relative",
                      }}
                      onClick={() => document.getElementById("attachment-upload").click()}
                    >
                      <input
                        id="attachment-upload"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/jpg,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        onChange={handleAttachmentUpload}
                        style={{
                          position: "absolute",
                          opacity: 0,
                          width: "100%",
                          height: "100%",
                          cursor: "pointer",
                        }}
                      />

                      <div
                        style={{
                          width: "26px",
                          height: "26px",
                          borderRadius: "999px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          fontSize: "18px",
                        }}
                      >
                        <RiImageAddFill />
                      </div>
                      <span style={{ fontSize: "10px", textAlign: "center", marginTop: "4px" }}>
                        PDF, Excel, CSV
                      </span>
                    </div>

                    {uploadedAttachments.length > 0 && (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {uploadedAttachments.map((file, index) => (
                          <div key={index} style={{ position: "relative", width: "80px", cursor: "pointer" }}>
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.filename}
                                style={{
                                  width: "80px",
                                  height: "80px",
                                  objectFit: "cover",
                                  borderRadius: "4px",
                                  border: "1px solid #EAEAEA",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "80px",
                                  height: "80px",
                                  backgroundColor: "#F3F4F6",
                                  borderRadius: "4px",
                                  border: "1px solid #EAEAEA",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "4px",
                                }}
                              >
                                <span style={{ fontSize: "30px" }}>📄</span>
                                <div
                                  style={{
                                    fontSize: "10px",
                                    textAlign: "center",
                                    wordBreak: "break-all",
                                    marginTop: "4px",
                                    maxWidth: "70px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {file.filename?.length > 15 ? file.filename.slice(0, 12) + "..." : file.filename}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => removeAttachment(index)}
                              style={{
                                position: "absolute",
                                top: "-5px",
                                right: "-5px",
                                background: "red",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div style={{ width: "50%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Subtotal :</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>

                  {taxSettings.enableGSTBilling ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ color: "#6b7280" }}>Taxes :</span>
                      <span>₹{totalTax.toFixed(2)}</span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontSize: "14px",
                        opacity: 0.5,
                      }}
                    >
                      <span style={{ color: "#A2A8B8" }}>Taxes :</span>
                      <span style={{ color: "#A2A8B8" }}>₹{totalTax.toFixed(2)}</span>
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>
                      Additional Charges
                      {Object.entries(additionalChargesDetails).some(([_, value]) => value > 0) && (
                        <span
                          style={{
                            color: "#3b82f6",
                            marginLeft: "4px",
                            fontSize: "11px",
                          }}
                        >
                          (
                          {Object.entries(additionalChargesDetails)
                            .filter(([_, value]) => value > 0)
                            .map(([key, value]) => `${key}: ₹${value}`)
                            .join(", ")}
                          )
                        </span>
                      )}
                      :
                    </span>
                    <span style={{ color: "#9ca3af" }}>₹{additionalChargesTotal.toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      height: "1px",
                      background: "#eee",
                      margin: "12px 0",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontWeight: "700",
                      fontSize: "20px",
                      marginTop: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    <span>Total Amount :-</span>
                    <span>₹{grandTotal.toFixed(2)}</span>
                  </div>

                  {/* <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "14px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ accentColor: "#ffffffff" }}
                      checked={fullyReceived}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFullyReceived(checked);
                        if (checked) {
                          setAmountPaid(grandTotal.toFixed(2));
                        }
                      }}
                    />
                    <span>Fully Paid</span>
                  </div>

                  <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          marginBottom: "6px",
                        }}
                      >
                        Amount Paid
                      </div>
                      <div
                        style={{
                          width: "100%",
                          borderRadius: "10px",
                          padding: "10px",
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                          outline: "none",
                          display: "flex",
                        }}
                      >
                        ₹
                        <input
                          placeholder="0.00"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          style={{
                            borderRadius: "10px",
                            border: "none",
                            background: "#f9fafb",
                            outline: "none",
                            width: "100%",
                          }}
                          disabled={fullyReceived}
                        />
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          marginBottom: "6px",
                        }}
                      >
                        Amount Due
                      </div>
                      <div
                        style={{
                          width: "100%",
                          borderRadius: "10px",
                          padding: "10px",
                          border: "1px solid #e5e7eb",
                          background: "#f9fafb",
                          outline: "none",
                          display: "flex",
                        }}
                      >
                        ₹
                        <input
                          placeholder="0.00"
                          value={Math.max(0, grandTotal - (parseFloat(amountPaid) || 0)).toFixed(2)}
                          readOnly
                          style={{
                            borderRadius: "10px",
                            border: "none",
                            background: "#f9fafb",
                            outline: "none",
                            width: "100%",
                          }}
                        />
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>


          {/* Action Buttons */}
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
                paddingRight: 0,
                justifyContent: "flex-start",
                alignItems: "flex-start",
                gap: 15,
                display: "inline-flex",
              }}
            >
              <div
                onClick={handleBack}
                style={{
                  height: 36,
                  padding: 8,
                  background: "var(--Blue-Blue, #1F7FFF)",
                  boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                  borderRadius: 8,
                  outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                  outlineOffset: "-1.50px",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 4,
                  display: "flex",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontSize: 14,
                    fontFamily: "Inter",
                    fontWeight: "500",
                    wordWrap: "break-word",
                  }}
                >
                  Cancel
                </div>
              </div>
              <div
                onClick={handleSubmit}
                disabled={isSubmitting}
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
                  textDecoration: "none",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                <div
                  style={{
                    color: "var(--Blue-Blue, #1F7FFF)",
                    fontSize: 14,
                    fontFamily: "Inter",
                    fontWeight: "500",
                    wordWrap: "break-word",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Approve"}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* BATCH POPUP - CORRECTED VERSION */}
        {showBatchPopup && (
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
                width: "1100px",
                maxHeight: "90vh",
                overflowY: "auto",
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
                Batch Details
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
                    <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)" }}>Batch No.</div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Batch No."
                        value={trackingByRowId[activeTrackingRowId]?.lotNumber || ""}
                        onChange={(e) => updateTracking(activeTrackingRowId, "lotNumber", e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                      />
                    </div>
                  </div>

                  {/* Model no. */}
                  <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)" }}>Model No.</div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Model No."
                        value={trackingByRowId[activeTrackingRowId]?.modelNo || ""}
                        onChange={(e) => updateTracking(activeTrackingRowId, "modelNo", e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                      />
                    </div>
                  </div>

                  {/* Quantity */}
                  <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)" }}>Quantity</div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                      <input
                        type="number"
                        placeholder="00"
                        value={products.find(p => p.id === activeTrackingRowId)?.receivingNow || 0}
                        onChange={(e) => handleBatchQuantityChange(e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowBatchPopup(false);
                          setShowSerialPopup(true);
                        }}
                        style={{
                          padding: "4px 6px",
                          background: "#1F7FFF",
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
                        <span style={{ color: "white", fontSize: "14px" }}>Serial No.</span>
                      </button>
                    </div>
                  </div>

                  {/* Min. Stock to Maintain */}
                  <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)" }}>Min. Stock to Maintain</div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                      <input
                        type="number"
                        placeholder="00"
                        style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {/* Manufacturing Date */}
                  <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)" }}>Manufacturing Date</div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                      <input
                        type="date"
                        value={trackingByRowId[activeTrackingRowId]?.manufacturingDate || ""}
                        onChange={(e) => updateTracking(activeTrackingRowId, "manufacturingDate", e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                      />
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ fontSize: "12px", color: "var(--Black-Grey, #727681)" }}>Expiry Date</div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                      <input
                        type="date"
                        value={trackingByRowId[activeTrackingRowId]?.expiryDate || ""}
                        onChange={(e) => updateTracking(activeTrackingRowId, "expiryDate", e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                      />
                    </div>
                  </div>

                  {/* Warranty Type */}
                  <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Warranty Type</span>
                    </div>
                    <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                      <select
                        value={trackingByRowId[activeTrackingRowId]?.warrantyType || ""}
                        onChange={(e) => updateTracking(activeTrackingRowId, "warrantyType", e.target.value)}
                        style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                      >
                        <option value="">Select Warranty Type</option>
                        <option value="Manufacturing">Manufacturing Warranty</option>
                        <option value="Extended">Extended Warranty</option>
                        <option value="Lifetime">Lifetime Warranty</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* WARRANTY SECTIONS - Using tracking directly */}
                {trackingByRowId[activeTrackingRowId]?.warrantyType === "Manufacturing" && (
                  <div style={{ borderTop: "1px solid #EAEAEA", paddingTop: "16px", marginTop: "8px" }}>
                    <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "500" }}>
                      Manufacturing Warranty Details
                    </div>

                    <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
                      <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Warranty Period</span>
                      <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                        <select
                          value={trackingByRowId[activeTrackingRowId]?.warrantyPeriod || ""}
                          onChange={(e) => updateTracking(activeTrackingRowId, "warrantyPeriod", e.target.value)}
                          style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                        >
                          <option value="">Select Warranty Period</option>
                          <option value="1">1 Month</option>
                          <option value="3">3 Months</option>
                          <option value="6">6 Months</option>
                          <option value="12">12 Months</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "12px" }}>
                      <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Coverage Scope</span>
                      <div style={{ height: "40px", background: "white", borderRadius: "8px", display: "flex", alignItems: "center", gap: "52px", flexWrap: "wrap" }}>
                        {["Parts", "Labour", "Parts + Labour", "Replacement Only"].map((scope) => (
                          <div key={scope} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="radio"
                              name={`coverageScope-${activeTrackingRowId}`}
                              checked={trackingByRowId[activeTrackingRowId]?.coverageScope === scope}
                              onChange={() => updateTracking(activeTrackingRowId, "coverageScope", scope)}
                              style={{ width: 15, height: 15, accentColor: "#1F7FFF", cursor: "pointer" }}
                            />
                            <label style={{ color: 'black', fontSize: "13px" }}>{scope}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "12px" }}>
                      <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Service Mode</span>
                      <div style={{ height: "40px", background: "white", borderRadius: "8px", display: "flex", alignItems: "center", gap: "52px", flexWrap: "wrap" }}>
                        {["Carry In", "On-Site", "Pickup & Drop"].map((mode) => (
                          <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="radio"
                              name={`serviceMode-${activeTrackingRowId}`}
                              checked={trackingByRowId[activeTrackingRowId]?.serviceMode === mode}
                              onChange={() => updateTracking(activeTrackingRowId, "serviceMode", mode)}
                              style={{ width: 15, height: 15, accentColor: "#1F7FFF", cursor: "pointer" }}
                            />
                            <label style={{ color: 'black', fontSize: "13px" }}>{mode}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Max Claims Allowed</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <input
                            type="number"
                            placeholder="eg., 1,2,3"
                            value={trackingByRowId[activeTrackingRowId]?.maxClaimsAllowed || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "maxClaimsAllowed", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          />
                        </div>
                      </div>

                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Inspection Required</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <select
                            value={trackingByRowId[activeTrackingRowId]?.inspectionRequired ? "Yes" : "No"}
                            onChange={(e) => updateTracking(activeTrackingRowId, "inspectionRequired", e.target.value === "Yes")}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          >
                            <option value="">Select</option>
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Warranty Starts From</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <select
                            value={trackingByRowId[activeTrackingRowId]?.warrantyStartsFrom || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "warrantyStartsFrom", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
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

                {trackingByRowId[activeTrackingRowId]?.warrantyType === "Extended" && (
                  <div style={{ borderTop: "1px solid #EAEAEA", paddingTop: "16px", marginTop: "8px" }}>
                    <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "500" }}>
                      Extended Warranty Details
                    </div>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Linked to</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="Manufacturer Warranty"
                            value={trackingByRowId[activeTrackingRowId]?.linkedto || "Manufacturer Warranty"}
                            onChange={(e) => updateTracking(activeTrackingRowId, "linkedto", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          />
                        </div>
                      </div>

                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Extension Period</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <select
                            value={trackingByRowId[activeTrackingRowId]?.extensionPeriod || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "extensionPeriod", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          >
                            <option value="">Select</option>
                            <option value="6">6 Months</option>
                            <option value="12">12 Months</option>
                            <option value="24">24 Months</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Coverage Type</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <select
                            value={trackingByRowId[activeTrackingRowId]?.coverageType || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "coverageType", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          >
                            <option value="">Select</option>
                            <option value="Same As Manufacturer">Same As Manufacturer</option>
                            <option value="Enhanced">Enhanced Coverage</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Extended Warranty Price</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <input
                            type="number"
                            placeholder="Enter Warranty Price"
                            value={trackingByRowId[activeTrackingRowId]?.extendedWarrantyPrice || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "extendedWarrantyPrice", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {trackingByRowId[activeTrackingRowId]?.warrantyType === "Lifetime" && (
                  <div style={{ borderTop: "1px solid #EAEAEA", paddingTop: "16px", marginTop: "8px" }}>
                    <div style={{ color: "black", fontSize: "16px", fontFamily: "Inter", fontWeight: "500" }}>
                      Lifetime Warranty Details
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: '1px solid #1F7FFF', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#E5F0FF', marginTop: "12px" }}>
                      <FaCircleExclamation style={{ color: '#1F7FFF' }} />
                      <span style={{ color: '#1F7FFF' }}>Lifetime ≠ forever without rules. You must define scope, or claims will explode.</span>
                    </div>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Lifetime Definition</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <select
                            value={trackingByRowId[activeTrackingRowId]?.lifetimeDefination || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "lifetimeDefination", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          >
                            <option value="">Select</option>
                            <option value="Product Manufacturing Life">Product Manufacturing Life</option>
                            <option value="Brand Support Life">Brand Support Life</option>
                            <option value="Fixed Years">Fixed Years</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Coverage of</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <select
                            value={trackingByRowId[activeTrackingRowId]?.coverageOf || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "coverageOf", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          >
                            <option value="">Select</option>
                            <option value="Manufacturing Defects Only">Manufacturing Defects Only</option>
                            <option value="Structural Parts Only">Structural Parts Only</option>
                            <option value="Limited Replacement">Limited Replacement</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>What is Not Covered</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <select
                            value={trackingByRowId[activeTrackingRowId]?.whatNotCovered || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "whatNotCovered", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          >
                            <option value="">Select</option>
                            <option value="Wear & Tear">Wear & Tear</option>
                            <option value="Consumables">Consumables</option>
                            <option value="Accessories">Accessories</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "12px" }}>
                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Max Claims</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <input
                            type="text"
                            placeholder="e.g., 1,3,6"
                            value={trackingByRowId[activeTrackingRowId]?.maxClaims || ""}
                            onChange={(e) => updateTracking(activeTrackingRowId, "maxClaims", e.target.value)}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
                          />
                        </div>
                      </div>

                      <div style={{ width: "275px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ color: "var(--Black-Grey, #727681)", fontSize: "12px" }}>Replacement Once Only?</span>
                        <div style={{ height: "40px", padding: "0 12px", background: "white", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", alignItems: "center" }}>
                          <select
                            value={trackingByRowId[activeTrackingRowId]?.replacementOnceOnly ? "Yes" : "No"}
                            onChange={(e) => updateTracking(activeTrackingRowId, "replacementOnceOnly", e.target.value === "Yes")}
                            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: "14px" }}
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

              <div style={{ alignItems: "center", marginTop: "12px", display: 'flex', justifyContent: 'end' }}>
                <button
                  type="button"
                  onClick={() => setShowBatchPopup(false)}
                  style={{
                    padding: "8px 20px",
                    background: "#1F7FFF",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: 'white', fontSize: "14px", fontWeight: "500" }}>Done</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {showSerialPopup && (
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
            onClick={() => setShowSerialPopup(false)}
          >
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
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  marginBottom: "14px",
                  color: "#111827",
                }}
              >
                Added {trackingByRowId[activeTrackingRowId]?.selectedSerialNos?.length || 0} Serial Numbers
              </div>

              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "10px",
                  padding: "16px",
                  border: "1px solid #E5E7EB",
                }}
              >
                <div style={{ width: "100%" }}>
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
                            const serials = pasted.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
                            const currentSerials = trackingByRowId[activeTrackingRowId]?.selectedSerialNos || [];
                            const existingSet = new Set(currentSerials);
                            const newSerials = serials.filter(s => !existingSet.has(s) && /^[a-zA-Z0-9\-_]+$/.test(s));
                            if (newSerials.length > 0) {
                              updateTracking(activeTrackingRowId, "selectedSerialNos", [...currentSerials, ...newSerials]);
                              toast.success(`Added ${newSerials.length} serials from paste`);
                            }
                            setSerialInput("");
                          }
                        }}
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
                      <label
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
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleCSVUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const currentSerials = trackingByRowId[activeTrackingRowId]?.selectedSerialNos || [];
                          if (currentSerials.length === 0) {
                            toast.info("No serials to download");
                            return;
                          }
                          const csvContent = "Serial Number\n" + currentSerials.join("\n");
                          const blob = new Blob([csvContent], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "serials.csv";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        style={{
                          padding: "6px 10px",
                          background: "#EAEAEA",
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "13px",
                        }}
                      >
                        ⬇ Download CSV
                      </button>
                    </div>

                    {/* List */}
                    <div
                      style={{
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                        maxHeight: "280px",
                        overflowY: "auto",
                      }}
                    >
                      {(trackingByRowId[activeTrackingRowId]?.selectedSerialNos || []).map((serial, sIndex) => (
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
                          <button
                            type="button"
                            onClick={() => handleRemoveSerial(serial)}
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
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ alignItems: "center", marginTop: "12px", display: 'flex', justifyContent: 'end' }}>
                <button
                  onClick={() => setShowSerialPopup(false)}
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
    </>
  );
}

export default ConvertGRNVerificationForm;