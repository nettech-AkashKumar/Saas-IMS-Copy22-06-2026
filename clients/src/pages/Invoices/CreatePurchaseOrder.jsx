import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { useLocation, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import AddSuppliers from "../Modal/suppliers/AddSupplierModals";
// images
import indialogo from "../../assets/images/india-logo.png";
import total_orders_icon from "../../assets/images/totalorders-icon.png";
import ProductDefaultImage from "../../../src/assets/images/product-default.png";
import api from "../config/axiosInstance";
import { toast } from "react-toastify";

const normalizeVariantAttr = (value) => String(value ?? "").trim().toLowerCase();

const getVariantForSelection = (product, color, size) => {
  const variants = product?.variants || [];
  if (!Array.isArray(variants) || variants.length === 0) return null;
  const hasColor = Boolean(normalizeVariantAttr(color));
  const hasSize = Boolean(String(size ?? "").trim());
  const exact = variants.find((v) => {
    const colorOk = hasColor ? normalizeVariantAttr(v?.color) === normalizeVariantAttr(color) : true;
    const sizeOk = hasSize ? String(v?.size) === String(size) : true;
    return colorOk && sizeOk;
  });
  if (exact) return exact;
  if (hasColor) {
    const byColor = variants.find((v) => normalizeVariantAttr(v?.color) === normalizeVariantAttr(color));
    if (byColor) return byColor;
  }
  if (hasSize) {
    const bySize = variants.find((v) => String(v?.size) === String(size));
    if (bySize) return bySize;
  }
  return variants[0] || null;
};

const getVariantAvailableQuantity = (product, variant) => {
  const vQty = Number(variant?.stockQuantity ?? variant?.quantity ?? 0);
  if (vQty > 0) return vQty;
  return Number(product?.quantity ?? product?.stockQuantity ?? 0);
};

// ========== PRODUCT POPUP COMPONENT ==========
const ProductPopup = ({
  selectedProduct,
  productVariants,
  productImages,
  activeImageIndex,
  setActiveImageIndex,
  productColors,
  selectedColor,
  setSelectedColor,
  productSizes,
  selectedSize,
  setSelectedSize,
  productSerialno,
  selectedSerialno,
  setSelectedSerialno,
  productLot,
  selectedLot,
  setSelectedLot,
  selectedQty,
  availableQty,
  increaseQty,
  decreaseQty,
  disableQty,
  onClose,
  price,
  mrp,
  unit,
  expiryText,
  getExpiryDisplayText,
  onPrimaryClick
}) => {
  const selectedSerialArr = Array.isArray(selectedSerialno) ? selectedSerialno : [];
  const maxSerials = Math.max(Number(selectedQty || 1), 1);

  const selectedLotVariant = productVariants?.find(
    v => String(v.lotNumber || "") === String(selectedLot || "")
  ) || null;

  const serialsForSelectedLot = selectedLotVariant
    ? (Array.isArray(selectedLotVariant.serialNumbers)
      ? selectedLotVariant.serialNumbers.filter(Boolean).map(String)
      : [])
    : (Array.isArray(productSerialno) ? productSerialno : []);

  const handleSelectRandom = () => {
    if (Array.isArray(productLot) && productLot.length > 0) {
      const randomLot = productLot[0];
      if (setSelectedLot) setSelectedLot(randomLot);
      setSelectedSerialno([]);
    }
    if (serialsForSelectedLot.length > 0) {
      setSelectedSerialno([serialsForSelectedLot[0]]);
    }
  };

  const hasBatchOrSerial = (Array.isArray(productLot) && productLot.length > 0) || serialsForSelectedLot.length > 0;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "380px", background: "white", display: "flex", flexDirection: "column", position: "relative", boxSizing: "border-box", borderRadius: "8px", fontFamily: "Inter", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}>
        {/* Header */}
        <div style={{ background: "#F5F5F5", padding: "8px 12px", borderBottom: "1px solid #E5E5E5", fontSize: "12px", fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center", borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}>
          <span style={{ color: "#222", fontSize: "12px", fontWeight: 500 }}>Choose Batch / Serial / Expiry</span>
          <FiX onClick={onClose} style={{ cursor: "pointer", color: "#555", fontSize: "16px" }} />
        </div>

        <div style={{ padding: "0 8px 8px 8px" }}>
          {/* Product Info Row */}
          <div style={{ display: "flex", gap: "8px", padding: "8px", borderBottom: "1px solid #EAEAEA" }}>
            <img
              alt="Product"
              src={productImages?.length > 0 ? productImages[Math.min(Math.max(Number(activeImageIndex) || 0, 0), productImages.length - 1)] : ProductDefaultImage}
              onClick={() => {
                if (!productImages?.length) return;
                setActiveImageIndex((prev) => (Number(prev || 0) + 1) % productImages.length);
              }}
              style={{ border: "1px solid #DBDBDB", width: "72px", height: "64px", objectFit: "cover", borderRadius: "4px", cursor: productImages?.length > 1 ? "pointer" : "default", flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedProduct?.productName || "Product Name"}
              </div>
              <div style={{ fontSize: "10px", color: "#888", marginTop: "2px" }}>
                <span>{selectedProduct?.brand?.brandName || "Brand"} • </span>
                <span>{selectedProduct?.category?.categoryName || "Category"} • </span>
                {availableQty} {unit || selectedProduct?.unit || "Unit"}
              </div>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#1F7FFF", marginTop: "4px" }}>
                ₹{Number(selectedProduct.variants[0].purchasePrice || 0).toFixed(2)}
                {mrp && <del style={{ color: "#8D8D8D", fontSize: "11px", fontWeight: "400", marginLeft: "6px" }}>₹{mrp}</del>}
              </div>
              {Number(selectedProduct?.warrantyPeriod) > 0 ? (
                <div style={{ marginTop: "6px" }}>
                  <span
                    style={{
                      backgroundColor: "#FFE6FA",
                      border: "1px solid #FF87DB",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      color: "#770067",
                      fontSize: "10px",
                      fontWeight: "400",
                      display: "inline-block",
                    }}
                  >
                    {`${selectedProduct?.warrantyPeriod} Month Manufacturing Warranty`}
                  </span>
                </div>
              ) : (
                <div style={{ marginTop: "6px" }}>
                  <span
                    style={{
                      color: "#8D8D8D",
                      fontSize: "10px",
                      fontWeight: 400,
                    }}
                  >
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable middle section */}
          <div style={{ maxHeight: "280px", overflow: "auto", padding: "10px 4px", borderBottom: "1px solid #C3C3C3", display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* COLOR */}
            {productColors?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#666",
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                  }}
                >
                  Color
                </span>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {productColors.map((color, idx) => {
                    const active = selectedColor === color;

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: color,
                          border: active
                            ? "3px solid #1F7FFF"
                            : "2px solid #EAEAEA",
                          cursor: "pointer",
                          boxSizing: "border-box",
                        }}
                      >
                        {color === "white" && (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              border: "1px solid #ccc",
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* SIZE */}
            {productSizes?.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#666",
                    fontWeight: 600,
                    letterSpacing: "0.3px",
                  }}
                >
                  Size
                </span>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {productSizes.map((size, idx) => {
                    const active = String(selectedSize) === String(size);

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        style={{
                          border: `1px solid ${active ? "#1F7FFF" : "#EAEAEA"
                            }`,
                          background: active ? "#1F7FFF" : "#fff",
                          color: active ? "#fff" : "#555",
                          borderRadius: "4px",
                          padding: "6px 12px",
                          fontSize: "11px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {/* ALL BATCHES */}
            {/* {Array.isArray(productLot) && productLot.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "10px", color: "#666", fontWeight: 600, letterSpacing: "0.3px" }}>
                  Batches / Lot No.
                </span>
                {productLot.map((lot, idx) => {
                  const isSelected = String(lot) === String(selectedLot || "");
                  const lotVariant = productVariants?.find(v => String(v.lotNumber || "") === String(lot));
                  const lotQty = lotVariant ? Number(lotVariant.stockQuantity || lotVariant.openingQuantity || 0) : 0;
                  const lotExpiry = lotVariant?.expiryDate ? getExpiryDisplayText(lotVariant.expiryDate) : expiryText;
                  return (
                    <label key={idx} style={{ border: `1px solid ${isSelected ? "#1F7FFF" : "#EAEAEA"}`, borderRadius: "4px", padding: "8px 10px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: isSelected ? "#F0F7FF" : "#fff" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, color: "#222" }}>
                        <input type="radio" name="lot" checked={isSelected} onChange={() => { if (setSelectedLot) setSelectedLot(lot); setSelectedSerialno([]); }} style={{ accentColor: "#1F7FFF", cursor: "pointer" }} />
                        {lot}
                      </span>
                      {lotExpiry && <span style={{ color: lotExpiry === "Expired" ? "#f91f1fff" : "#005677", fontSize: "10px", marginLeft: "8px" }}>{lotExpiry}</span>}
                      <span style={{ fontSize: "11px", color: "#555", fontWeight: 500, whiteSpace: "nowrap", marginLeft: "8px" }}>{lotQty} units</span>
                    </label>
                  );
                })}
              </div>
            )} */}

            {/* SERIAL NUMBERS */}
            {/* {serialsForSelectedLot.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "10px", color: "#666", fontWeight: 600, letterSpacing: "0.3px" }}>
                  Serial No. ({selectedSerialArr.length}/{maxSerials} selected)
                </span>
                {serialsForSelectedLot.map((sn, idx) => {
                  const isSelected = selectedSerialArr.includes(sn);
                  const disableUnchecked = !isSelected && selectedSerialArr.length >= maxSerials;
                  return (
                    <label key={idx} style={{ border: `1px solid ${isSelected ? "#1F7FFF" : "#EAEAEA"}`, borderRadius: "4px", padding: "8px 10px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: disableUnchecked ? "not-allowed" : "pointer", background: isSelected ? "#F0F7FF" : "#fff", opacity: disableUnchecked ? 0.5 : 1 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: isSelected ? 600 : 400, color: isSelected ? "#1F7FFF" : "#222" }}>
                        <input type="checkbox" checked={isSelected} disabled={disableUnchecked} onChange={() => {
                          setSelectedSerialno((prev) => {
                            const arr = Array.isArray(prev) ? prev.map(String) : [];
                            if (arr.includes(sn)) return arr.filter(x => x !== sn);
                            if (arr.length >= maxSerials) {
                              toast.warning(`Maximum ${maxSerials} serial numbers can be selected`);
                              return arr;
                            }
                            return [...arr, sn];
                          });
                        }} style={{ accentColor: "#1F7FFF", cursor: disableUnchecked ? "not-allowed" : "pointer" }} />
                        {sn}
                      </span>
                      <span style={{ fontSize: "11px", color: "#555", fontWeight: 500, whiteSpace: "nowrap", marginLeft: "8px" }}>1 unit</span>
                    </label>
                  );
                })}
              </div>
            )} */}

            {/* Empty state */}
            {(!Array.isArray(productLot) || productLot.length === 0) && serialsForSelectedLot.length === 0 && (
              <div style={{ textAlign: "center", color: "#aaa", fontSize: "12px", padding: "16px 0" }}>
                No batch or serial numbers available
              </div>
            )}
          </div>

          {/* Quantity controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderTop: "1px solid #EAEAEA" }}>
            <span style={{ fontSize: "11px", color: "#444", fontWeight: 600 }}>Quantity</span>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #EAEAEA", borderRadius: "8px", overflow: "hidden" }}>
              <button onClick={decreaseQty} disabled={selectedQty <= 1} style={{ background: "#F8F9FB", border: "none", borderRight: "1px solid #EAEAEA", padding: "7px 11px", fontSize: "14px", color: "#111827", display: "flex", alignItems: "center", cursor: selectedQty <= 1 ? "not-allowed" : "pointer", opacity: selectedQty <= 1 ? 0.6 : 1 }}>
                <FiMinus size={13} />
              </button>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", padding: "0 16px", minWidth: "36px", textAlign: "center" }}>
                {String(selectedQty).padStart(2, "0")}
              </div>
              <button onClick={increaseQty} disabled={disableQty} style={{ background: "#F8F9FB", border: "1px solid #EAEAEA", padding: "10px", fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", borderTopRightRadius: "8px", borderBottomRightRadius: "8px", cursor: disableQty ? "not-allowed" : "pointer", opacity: disableQty ? 0.6 : 1 }}>
                <FiPlus size={13} />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "8px", padding: "8px 4px 4px 4px" }}>
            {hasBatchOrSerial && (
              <button onClick={handleSelectRandom} style={{ flex: 1, background: "white", border: "1px solid #EAEAEA", padding: "10px 0", fontSize: "12px", fontWeight: 500, color: "#333", borderRadius: "6px", cursor: "pointer" }}>
                Select Random
              </button>
            )}
            <button onClick={onPrimaryClick} style={{ flex: 1, backgroundColor: "#1F7FFF", border: "1px solid #0084FF", padding: "10px 0", fontSize: "12px", fontWeight: 500, color: "white", borderRadius: "6px", cursor: "pointer" }}>
              Add Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


function CreatePurchaseOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const editPurchaseOrderData = location.state?.editPurchaseOrder;
  const mode = location.state?.mode; // "view" or "edit"
  const isViewMode = mode === 'view';
  const isEditMode = !!editPurchaseOrderData?._id;
  const isReadOnly = isViewMode;
  const [originalStatus, setOriginalStatus] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
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

  // ========== VARIANT POPUP STATES ==========
  const [popupMode, setPopupMode] = useState(null);
  const [popupSelectedProduct, setPopupSelectedProduct] = useState(null);
  const [popupSelectedColor, setPopupSelectedColor] = useState("");
  const [popupSelectedSize, setPopupSelectedSize] = useState("");
  const [popupSelectedSerialno, setPopupSelectedSerialno] = useState([]);
  const [popupSelectedLot, setPopupSelectedLot] = useState('');
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
  const [products, setProducts] = useState([
    {
      id: Date.now(),
      productId: "",
      itemName: "",
      name: "",
      qty: "",
      unit: "Piece",
      unitPrice: "",
      taxRate: 0,
      taxType: "GST 0%",
      taxAmount: 0,
      discountPct: "",
      discountAmt: 0,
      amount: 0,
      hsnCode: "",
      stock: 0,
      selectedColor: "",
      selectedSize: "",
      selectedSerialNos: [],
      selectedLot: "",
      lotNumber: "",
      description: "",
    },
  ]);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const receiptDateRef = useRef(null);
  const productSearchInputRef = useRef(null);
  const inputRef = useRef(null);
  const pendingFocusRowIdRef = useRef(null);
  const modelRef = useRef(null);
  const chargeRef = useRef(null);
  const viewManageRef = useRef(null);
  const hasAddedInitialProduct = useRef(false);

  const getHeaderText = () => {
    if (isViewMode) return "View Purchase Order";
    if (isEditMode) return "Edit Purchase Order";
    return "Create Purchase Order";
  };

  // ========== HELPER FUNCTIONS ==========
  const focusNextProductRowInput = () => {
    const inputs = Array.from(document.querySelectorAll("input[data-row-id]"));
    if (inputs.length === 0) return;
    const visible = inputs.filter(
      (el) => el && !el.disabled && el.offsetParent !== null,
    );
    const candidates = (visible.length ? visible : inputs).slice().reverse();
    const target =
      candidates.find((el) => String(el.value || "").trim() === "") ||
      candidates[0];
    target?.focus();
  };

  const getSelectedProductIds = (excludeRowId) => {
    const selectedRows = products.filter(p => p.id !== excludeRowId && p.productId);
    const selectedByProduct = {};
    selectedRows.forEach(p => {
      if (!selectedByProduct[p.productId]) {
        selectedByProduct[p.productId] = [];
      }
      selectedByProduct[p.productId].push(p);
    });

    const idsToExclude = [];
    Object.entries(selectedByProduct).forEach(([productId, rows]) => {
      const fullProduct = allProducts.find(p => p._id === productId);
      if (!fullProduct) return;
      const variantsCount = Array.isArray(fullProduct.variants) ? fullProduct.variants.length : 0;
      if (!variantsCount || variantsCount <= 1) {
        idsToExclude.push(productId);
      }
    });
    return idsToExclude;
  };

  const getExpiryDisplayText = (expiryDate) => {
    if (!expiryDate) return "";
    const date = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((date - today) / 86400000);
    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expire: today";
    if (diffDays === 1) return "Expire: in 1 day";
    return `Expire: in ${diffDays} days`;
  };

  // ========== VARIANT POPUP COMPUTED VALUES ==========
  const popupSelectedVariant = useMemo(() => {
    if (!popupSelectedProduct) return null;
    if (!Array.isArray(popupSelectedProduct?.variants)) return null;
    if (popupSelectedProduct.variants.length === 0) return null;
    if (popupMode !== "variant") return popupSelectedProduct.variants[0] || null;
    return getVariantForSelection(
      popupSelectedProduct,
      popupSelectedColor,
      popupSelectedSize,
    );
  }, [popupSelectedProduct, popupSelectedColor, popupSelectedSize, popupMode]);

  const popupVariantSerials = useMemo(() => {
    if (!popupSelectedProduct?.variants?.length) return [];
    if (popupSelectedLot) {
      const lotVariant = popupSelectedProduct.variants.find(
        v => String(v.lotNumber || '') === String(popupSelectedLot)
      );
      const serials = lotVariant?.serialNumbers;
      if (Array.isArray(serials)) return serials.filter(Boolean).map(String);
    }
    const serials = popupSelectedVariant?.serialNumbers;
    if (!Array.isArray(serials)) return [];
    return serials.filter(Boolean).map(String);
  }, [popupSelectedProduct, popupSelectedVariant, popupSelectedLot]);

  const popupVariantImages = useMemo(() => {
    const imgs = popupSelectedVariant?.images?.length > 0
      ? popupSelectedVariant.images
      : popupSelectedProduct?.images || [];
    if (!imgs || imgs.length === 0) return [ProductDefaultImage];
    return imgs.map((img) => img?.url || img);
  }, [popupSelectedProduct, popupSelectedVariant]);

  const popupAvailableQty = useMemo(() => {
    if (!popupSelectedProduct) return 0;
    if (popupSelectedLot) {
      const lotVariant = popupSelectedProduct.variants?.find(
        v => String(v.lotNumber || "") === String(popupSelectedLot)
      );
      if (lotVariant) {
        return Number(lotVariant.stockQuantity || lotVariant.openingQuantity || 0);
      }
    }
    return getVariantAvailableQuantity(popupSelectedProduct, popupSelectedVariant);
  }, [popupSelectedProduct, popupSelectedVariant, popupSelectedLot]);

  const popupDisplayPrice = useMemo(() => {
    if (!popupSelectedProduct) return 0;
    const sellingPrice = Number(popupSelectedVariant?.purchasePrice ?? popupSelectedProduct?.purchasePrice ?? 0);
    const tax = Number(popupSelectedVariant?.tax ?? popupSelectedProduct?.tax ?? 0);
    if (taxSettings?.priceIncludeGST) {
      return sellingPrice + (sellingPrice * tax) / 100;
    }
    return sellingPrice;
  }, [popupSelectedProduct, popupSelectedVariant, taxSettings]);

  const popupProductColors = useMemo(() => {
    if (!popupSelectedProduct?.variants?.length) return [];
    return [...new Set(popupSelectedProduct.variants.map(v => v.color).filter(Boolean))];
  }, [popupSelectedProduct]);

  const popupProductSizes = useMemo(() => {
    if (!popupSelectedProduct?.variants?.length) return [];
    return [...new Set(popupSelectedProduct.variants.map(v => v.size).filter(Boolean))];
  }, [popupSelectedProduct]);

  const popupProductLot = useMemo(() => {
    if (!popupSelectedProduct?.variants?.length) return [];
    return [...new Set(popupSelectedProduct.variants.map(v => v.lotNumber).filter(Boolean))];
  }, [popupSelectedProduct]);

  const increasePopupQty = () => {
    if (!popupSelectedProduct) return;
    let maxAllowed = Number(popupAvailableQty || 0);
    if (popupSelectedQty < maxAllowed) {
      setPopupSelectedQty((prev) => prev + 1);
    } else {
      toast.warning(`Only ${maxAllowed} units available`);
    }
  };

  const decreasePopupQty = () => {
    if (popupSelectedQty > 1) {
      setPopupSelectedQty((prev) => prev - 1);
      setPopupSelectedSerialno((prev) =>
        Array.isArray(prev) ? prev.slice(0, popupSelectedQty - 1) : []
      );
    }
  };

  const isMaxQtyReached = () => {
    return popupSelectedQty >= (popupAvailableQty || 0);
  };

  const closeProductPopups = () => {
    setPopupMode(null);
    setPopupSelectedProduct(null);
    setShowVariantPopup(false);
    setPopupSelectedLot('');
    setPopupSelectedSerialno([]);
    setPopupSelectedQty(1);
  };

  // ========== PRODUCT HANDLERS ==========
  const handleSearch = (e, rowId) => {
    const term = e.target.value;
    const alreadySelectedIds = getSelectedProductIds(rowId);
    const filtered = allProducts.filter(
      (p) => {
        if (alreadySelectedIds.includes(p._id)) return false;
        return (
          p.productName?.toLowerCase().includes(term.toLowerCase()) ||
          String(p.itemBarcode || "").toLowerCase().includes(term.toLowerCase())
        );
      }
    );
    setSearchData((prev) => ({
      ...prev,
      [rowId]: {
        term,
        filtered,
        isOpen: true,
      },
    }));
  };

  const openDropdown = (rowId) => {
    setActiveSearchId(rowId);
  };

  const handleProductSelect = (product, rowId) => {
    const exactProduct = allProducts.find((p) => p._id === product._id);
    if (!exactProduct) {
      toast.error("Product not found");
      return;
    }

    const variantsCount = Array.isArray(exactProduct?.variants) ? exactProduct.variants.length : 0;
    const hasMultipleVariants = variantsCount > 1;

    // Show variant popup for products with variants
    if (hasMultipleVariants) {
      const availableStock = exactProduct.stockQuantity || 0;
      if (availableStock <= 0) {
        toast.error(`${exactProduct.productName} is out of stock!`);
        return;
      }
      setPopupSelectedProduct(exactProduct);
      setPopupSelectedQty(1);
      setPopupActiveImageIndex(0);
      const firstVariant = exactProduct?.variants?.[0] || null;
      setPopupSelectedColor(firstVariant?.color || "");
      setPopupSelectedSize(firstVariant?.size || "");
      setPopupSelectedSerialno([]);
      setPopupSelectedLot("");
      setPopupMode("variant");
      setShowVariantPopup(true);
      return;
    }

    // For non-variant products, proceed with normal selection
    const availableStock = exactProduct.stockQuantity || 0;
    if (availableStock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    // Check if product already exists in another row
    const existingProductIndex = products.findIndex(
      (p) => p.productId === exactProduct._id && p.id !== rowId,
    );

    if (existingProductIndex !== -1) {
      const existingRow = products[existingProductIndex];
      const currentQty = parseFloat(existingRow.qty) || 0;
      const newQty = currentQty + 1;

      setProducts((prev) =>
        prev.map((p, idx) => {
          if (idx === existingProductIndex) {
            return { ...p, qty: newQty };
          }
          return p;
        })
      );
      updateProduct(products[existingProductIndex].id, "qty", newQty);
      removeProductRow(rowId);
      setSearchData((prev) => {
        const newData = { ...prev };
        delete newData[rowId];
        return newData;
      });
      setActiveSearchId(null);
      setTimeout(() => focusNextProductRowInput(), 100);
      return;
    }

    const defaultTaxRate = taxSettings.defaultGSTRate || "0";
    const productTaxRate = parseFloat(exactProduct.tax?.match(/\d+/)?.[0]);
    const finalTaxRate = productTaxRate || parseFloat(defaultTaxRate);
    const firstVariant = exactProduct?.variants?.[0] || null;

    updateProduct(rowId, "productId", exactProduct._id);
    updateProduct(rowId, "stock", availableStock);
    updateProduct(rowId, "itemName", exactProduct.productName);
    updateProduct(rowId, "name", exactProduct.productName);
    updateProduct(rowId, "unitPrice", exactProduct.purchasePrice || 0);
    updateProduct(rowId, "taxRate", finalTaxRate);
    updateProduct(rowId, "taxType", exactProduct.tax || `GST${finalTaxRate}%`);
    updateProduct(rowId, "unit", firstVariant?.unit || exactProduct.unit || "Piece");
    updateProduct(rowId, "hsnCode", exactProduct.hsn?.hsnCode || "");
    updateProduct(rowId, "description", firstVariant?.description || exactProduct.description || "");
    updateProduct(rowId, "lotNumber", firstVariant?.lotNumber || exactProduct.lotNumber || "");
    updateProduct(rowId, "qty", 1);
    // FOR PURCHASE ORDERS: Set discount to 0
    updateProduct(rowId, "discountPct", 0);
    updateProduct(rowId, "discountAmt", 0);

    setSearchData((prev) => ({
      ...prev,
      [rowId]: {
        term: exactProduct.productName,
        filtered: [],
        isOpen: false,
      },
    }));

    setActiveSearchId(null);
    setTimeout(() => focusNextProductRowInput(), 100);
  };

  const addVariantToRow = (productInfo) => {
    const { productId, description, variant, quantity, selectedColor, selectedSize, selectedSerialnos, selectedLot } = productInfo;

    const variantSize = selectedSize || variant?.size || "";
    const variantColor = selectedColor || variant?.color || "";
    const serialKey = Array.isArray(selectedSerialnos) ? selectedSerialnos.sort().join(',') : '';
    const variantKey = `${productId}-${variantColor}-${variantSize}-${selectedLot}-${serialKey}`;

    // Check if this variant already exists
    const existingProductIndex = products.findIndex(p => {
      if (!p.productId || p.productId === "") return false;
      const existingSize = p.selectedSize || "";
      const existingColor = p.selectedColor || "";
      const existingSerialKey = Array.isArray(p.selectedSerialNos) ? p.selectedSerialNos.sort().join(',') : '';
      const existingKey = `${p.productId}-${existingColor}-${existingSize}-${p.selectedLot || ''}-${existingSerialKey}`;
      return existingKey === variantKey;
    });

    if (existingProductIndex !== -1) {
      const existingRow = products[existingProductIndex];
      const currentQty = parseFloat(existingRow.qty) || 0;
      const availableStock = variant.stockQuantity || 0;

      if (currentQty + quantity > availableStock) {
        toast.error(`Cannot exceed available stock of ${availableStock}`);
        return;
      }

      const newQty = currentQty + quantity;
      const newSerialNos = [...(existingRow.selectedSerialNos || []), ...(selectedSerialnos || [])];

      setProducts((prev) =>
        prev.map((p, idx) => {
          if (idx === existingProductIndex) {
            return {
              ...p,
              qty: newQty,
              selectedSerialNos: newSerialNos,
            };
          }
          return p;
        })
      );

      updateProduct(products[existingProductIndex].id, "qty", newQty);
      updateProduct(products[existingProductIndex].id, "selectedSerialNos", newSerialNos);

      setActiveSearchId(null);
      setShowVariantPopup(false);
      setPopupSelectedProduct(null);
      setTimeout(() => focusNextProductRowInput(), 100);
      return;
    }

    // Find empty row or create new one
    let targetRowId = null;
    const emptyRowIndex = products.findIndex(p => !p.productId || p.productId === "");

    if (emptyRowIndex !== -1) {
      targetRowId = products[emptyRowIndex].id;
    } else {
      addProductRow({ focus: true });
      targetRowId = products[products.length - 1]?.id;
    }

    if (!targetRowId) return;

    const productName = productInfo.productName || popupSelectedProduct?.productName || "Product";
    const finalSize = selectedSize || variant?.size || "";
    const finalColor = selectedColor || variant?.color || "";

    updateProduct(targetRowId, "productId", productId);
    updateProduct(targetRowId, "itemName", `${productName}${finalColor ? ` (${finalColor})` : ""}${finalSize ? ` / ${finalSize}` : ""}`);
    updateProduct(targetRowId, "name", `${productName}${finalColor ? ` (${finalColor})` : ""}${finalSize ? ` / ${finalSize}` : ""}`);
    updateProduct(targetRowId, "description", description || variant?.description || "");
    updateProduct(targetRowId, "unitPrice", variant.purchasePrice || variant.sellingPrice);
    updateProduct(targetRowId, "taxRate", parseFloat(variant.tax) || 0);
    updateProduct(targetRowId, "taxType", variant.taxType || `GST ${variant.tax || 0}%`);
    updateProduct(targetRowId, "unit", variant.unit);
    updateProduct(targetRowId, "qty", quantity);
    updateProduct(targetRowId, "stock", variant.stockQuantity);
    updateProduct(targetRowId, "lotNumber", variant.lotNumber || "");
    updateProduct(targetRowId, "selectedSerialNos", selectedSerialnos || []);
    updateProduct(targetRowId, "selectedColor", finalColor);
    updateProduct(targetRowId, "selectedSize", finalSize);
    updateProduct(targetRowId, "selectedLot", selectedLot);
    // FOR PURCHASE ORDERS: Set discount to 0
    updateProduct(targetRowId, "discountPct", 0);
    updateProduct(targetRowId, "discountAmt", 0);

    // if (variant.discountAmount) {
    //   if (variant.discountType === "Percentage") {
    //     updateProduct(targetRowId, "discountPct", variant.discountAmount);
    //   } else {
    //     updateProduct(targetRowId, "discountAmt", variant.discountAmount);
    //   }
    // }

    setActiveSearchId(null);
    setShowVariantPopup(false);
    setPopupSelectedProduct(null);
    setTimeout(() => focusNextProductRowInput(), 100);
  };

  const handleAddProductFromPopup = () => {
    if (!popupSelectedProduct) return;
    if (!popupSelectedVariant) {
      toast.error("Variant not available");
      return;
    }
    const availableQty = getVariantAvailableQuantity(popupSelectedProduct, popupSelectedVariant);
    if (availableQty <= 0) {
      toast.error("Out of stock");
      return;
    }
    const selectedSerials = Array.isArray(popupSelectedSerialno)
      ? popupSelectedSerialno.filter(Boolean)
      : [];

    // if (popupVariantSerials.length > 0) {
    //   if (selectedSerials.length === 0) {
    //     toast.error("Please select at least one serial number");
    //     return;
    //   }
    //   if (selectedSerials.length !== popupSelectedQty) {
    //     toast.error(`Please select exactly ${popupSelectedQty} serial number(s)`);
    //     return;
    //   }
    // }

    const qtyToAdd = Math.min(Number(popupSelectedQty || 1), availableQty);

    addVariantToRow({
      productId: popupSelectedProduct._id,
      productName: popupSelectedProduct.productName,
      description: popupSelectedProduct.description || "",
      variant: popupSelectedVariant,
      quantity: qtyToAdd,
      selectedColor: popupSelectedColor,
      selectedSize: popupSelectedSize,
      selectedSerialnos: selectedSerials,
      selectedLot: popupSelectedLot,
    });

    closeProductPopups();
    focusNextProductRowInput();
  };

  const addProductRow = ({ focus = false } = {}) => {
    const newId = Date.now() + Math.random();
    if (focus) pendingFocusRowIdRef.current = newId;
    const currentlySelectedIds = products.filter(p => p.productId).map(p => p.productId);
    setProducts((prev) => [
      ...prev,
      {
        id: newId,
        productId: "",
        itemName: "",
        name: "",
        qty: "",
        unit: "Piece",
        unitPrice: "",
        taxRate: 0,
        taxType: "GST 0%",
        taxAmount: 0,
        discountPct: "",
        discountAmt: 0,
        amount: 0,
        hsnCode: "",
        stock: 0,
        selectedColor: "",
        selectedSize: "",
        selectedSerialNos: [],
        selectedLot: "",
        lotNumber: "",
        description: "",
      },
    ]);
    setSearchData((prev) => ({
      ...prev,
      [newId]: {
        term: "",
        filtered: allProducts.filter(p => !currentlySelectedIds.includes(p._id)),
        isOpen: false,
      },
    }));
  };

  const removeProductRow = (id) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSearchData((prev) => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
    }
  };

  const updateProduct = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        let updated = { ...p };

        if (field === "qty") {
          const numValue = parseFloat(value);
          updated.qty = isNaN(numValue) ? "" : numValue;
        } else if (field === "unitPrice") {
          const numValue = parseFloat(value);
          updated.unitPrice = isNaN(numValue) ? "" : numValue;
        } else if (field === "discountPct") {
          const numValue = parseFloat(value);
          // updated.discountPct = isNaN(numValue) ? "" : numValue;
          updated.discountPct = 0;
        } else if (field === "discountAmt") {
          const numValue = parseFloat(value);
          // updated.discountAmt = isNaN(numValue) ? "" : numValue;
          updated.discountAmt = 0;
        } else if (field === "selectedSerialNos") {
          updated.selectedSerialNos = Array.isArray(value) ? value : [];
        } else {
          updated[field] = value;
        }

        // Recalculate line amount
        const qty = parseFloat(updated.qty) || 0;
        const unitPrice = parseFloat(updated.unitPrice) || 0;
        const baseAmount = qty * unitPrice;

        // let discountAmt = parseFloat(updated.discountAmt) || 0;
        // let discountPct = parseFloat(updated.discountPct) || 0;

        const discountAmt = 0;
        const discountPct = 0;

        updated.discountAmt = 0;
        updated.discountPct = 0;

        // if (discountPct > 0 && baseAmount > 0) {
        //   discountAmt = (baseAmount * discountPct) / 100;
        //   updated.discountAmt = discountAmt;
        // }

        // const afterDiscount = Math.max(baseAmount - discountAmt, 0);
        const afterDiscount = baseAmount;
        const taxRate = parseFloat(updated.taxRate) || 0;
        const taxAmount = taxSettings.enableGSTBilling ? (afterDiscount * taxRate) / 100 : 0;
        const amount = afterDiscount + taxAmount;

        updated.taxAmount = taxAmount;
        updated.amount = amount;

        return updated;
      }),
    );
  };

  // ========== SUPPLIER HANDLERS ==========
  const handleBack = () => {
    navigate(location.state?.from || -1);
  };

  // Replace handleSupplierSelect function
  const handleSupplierSelect = (selectedSupplier) => {
    if (!selectedSupplier) {
      console.warn("No supplier selected");
      return;
    }

    // Get name from different possible fields
    const supplierName = selectedSupplier.supplierName || selectedSupplier.name || "";

    // Get phone from different possible fields
    const supplierPhone = selectedSupplier.phone || selectedSupplier.phoneNumber || "";

    // Build address from different possible structures
    const addressParts = [];

    if (selectedSupplier.address) {
      if (typeof selectedSupplier.address === "string") {
        addressParts.push(selectedSupplier.address);
      } else if (typeof selectedSupplier.address === "object") {
        if (selectedSupplier.address.addressLine)
          addressParts.push(selectedSupplier.address.addressLine);
        if (selectedSupplier.address.city)
          addressParts.push(selectedSupplier.address.city);
        if (selectedSupplier.address.state)
          addressParts.push(selectedSupplier.address.state);
        if (selectedSupplier.address.country)
          addressParts.push(selectedSupplier.address.country);
        if (selectedSupplier.address.pincode)
          addressParts.push(selectedSupplier.address.pincode);
      }
    }

    // Also check direct fields
    if (selectedSupplier.city && !addressParts.includes(selectedSupplier.city))
      addressParts.push(selectedSupplier.city);
    if (selectedSupplier.state && !addressParts.includes(selectedSupplier.state))
      addressParts.push(selectedSupplier.state);
    if (selectedSupplier.country && !addressParts.includes(selectedSupplier.country))
      addressParts.push(selectedSupplier.country);
    if (selectedSupplier.pincode && !addressParts.includes(selectedSupplier.pincode))
      addressParts.push(selectedSupplier.pincode);

    setSupplier({
      name: supplierName,
      phone: supplierPhone,
      address: addressParts.join(", "),
      email: selectedSupplier.email || "",
      gstin: selectedSupplier.gstin || "",
      supplierId: selectedSupplier._id || selectedSupplier.id || "",
    });

    setSupplierSearch(supplierName);
    setPhoneSearch(supplierPhone);
    setShowSupplierDropdown(false);
  };

  const handleClearSupplier = () => {
    setSupplier({
      name: "",
      phone: "",
      email: "",
      address: "",
      gstin: "",
      supplierId: "",
    });
    setSupplierSearch("");
    setPhoneSearch("");
    setShowSupplierDropdown(false);
  };

  const handleNewSupplierCreated = (newSupplier) => {
    fetchSuppliersForSearch();
    handleSupplierSelect(newSupplier);
    toast.success("Supplier created successfully!");
  };

  // ========== FETCH FUNCTIONS ==========
  const fetchSuppliersForSearch = async () => {
    try {
      const response = await api.get("/api/suppliers/active-suppliers");
      if (response.data && Array.isArray(response.data.suppliers)) {
        setAllSuppliers(response.data.suppliers || []);
        setFilteredSuppliers(response.data.suppliers);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/products?limit=1000");
      const fetchedProducts = response.data.products || response.data;
      setAllProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  // const fetchPurchaseNumber = async () => {
  //   try {
  //     const response = await api.get("/api/purchase-orders/generate-number");
  //     if (response.data.success) {
  //       setInvoiceNo(response.data.purchaseNo);
  //     }
  //   } catch (error) {
  //     console.error("Error fetching purchase number:", error);
  //     const prefix = "PO";
  //     const date = new Date();
  //     setInvoiceNo(`${prefix}${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}001`);
  //   }
  // };

  const loadTaxSettings = async () => {
    try {
      const response = await api.get("/api/tax-gst-settings");
      if (response.data.success) {
        setTaxSettings({
          enableGSTBilling: response.data.data.enableGSTBilling !== false,
          priceIncludeGST: response.data.data.priceIncludeGST !== false,
          defaultGSTRate: response.data.data.defaultGSTRate || "18",
          autoRoundOff: response.data.data.autoRoundOff || "0",
        });
      }
    } catch (error) {
      console.error("Error fetching tax settings:", error);
    }
  };

  // ========== OTHER HANDLERS ==========
  const handleChargeSelect = (chargeType) => {
    setSelectedChargeType(chargeType);
    setViewChargeOptions(false);
  };

  const handleChargeDone = () => {
    if (chargeAmount && selectedChargeType) {
      const chargeKey = selectedChargeType.toLowerCase().replace(" charge", "");
      const validChargeKeys = ["shipping", "handling", "packing", "service", "other"];
      if (validChargeKeys.includes(chargeKey)) {
        // FIX: Use parseFloat to ensure it's a number
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
    } else {
      toast.error("Please select a charge type and enter amount");
    }
  };

  const handleDateSelect = (option) => {
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
        setIsDatePickerOpen(true);
        setViewManageOptions(false);
        return;
      default:
        selectedDate = today;
    }
    setInvoiceDate(selectedDate);
    setViewManageOptions(false);
    setIsDatePickerOpen(false);
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

  const handleAttachmentUpload = (event) => {
    const files = Array.from(event.target.files);
    const newFiles = files.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      filename: file.name,
      type: file.type,
      size: file.size,
      isNew: true
    }));
    setUploadedAttachments((prev) => [...prev, ...newFiles]);
  };

  const handleViewManage = () => setViewManageOptions(true);
  const handleViewChargeOptions = () => setViewChargeOptions((prev) => !prev);

  // ========== CALCULATIONS ==========
  const subtotal = products.reduce((sum, p) => sum + (parseFloat(p.qty) || 0) * (parseFloat(p.unitPrice) || 0), 0);
  const totalTax = products.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
  const itemsDiscount = products.reduce((sum, p) => sum + (p.discountAmt || 0), 0);
  const additionalChargesTotal = Object.values(additionalChargesDetails).reduce((sum, charge) => sum + (charge || 0), 0);
  const additionalDiscountValue = additionalDiscountType === "Percentage" && additionalDiscountPct
    ? (subtotal * parseFloat(additionalDiscountPct)) / 100
    : additionalDiscountType === "Fixed" && additionalDiscountAmt
      ? parseFloat(additionalDiscountAmt) || 0
      : 0;
  const totalDiscount = itemsDiscount + additionalDiscountValue;
  const grandTotalBefore = subtotal + totalTax + additionalChargesTotal - totalDiscount;
  let roundedTotal = grandTotalBefore;
  let roundOffAdded = 0;
  if (taxSettings.autoRoundOff !== "0" && taxSettings.enableGSTBilling) {
    const roundValue = parseInt(taxSettings.autoRoundOff);
    if (roundValue > 0) {
      roundedTotal = Math.round(grandTotalBefore / roundValue) * roundValue;
      roundOffAdded = roundedTotal - grandTotalBefore;
    }
  }
  const grandTotal = Math.max(0, roundedTotal);
  const amountDue = Math.max(0, grandTotal - (parseFloat(amountPaid) || 0));

  useEffect(() => {
    if (fullyReceived) {
      setAmountPaid(grandTotal.toFixed(2));
    }
  }, [fullyReceived, grandTotal]);

  // ========== SUBMIT HANDLER ==========
  const handleSubmit = async (shouldPrint = false) => {
    if (!supplier.supplierId) {
      toast.error("Please select a supplier first");
      return;
    }

    if (isViewMode) {
      toast.info("View mode - changes are not saved");
      return;
    }

    // Check if editing a completed order
    if (isEditMode && originalStatus === "approved") {
      toast.error("Cannot edit an approved purchase order");
      return;
    }

    const nonEmptyProducts = products.filter(
      (p) => p.productId && p.productId.trim() !== "" && p.qty > 0
    );

    if (nonEmptyProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Basic Info
      formData.append("supplierId", supplier.supplierId);
      formData.append("purchaseDate", invoiceDate.toISOString());
      formData.append("referenceNo", referenceNo);
      formData.append("receiptDate", receiptDate ? receiptDate.toISOString() : "");
      formData.append("billingAddress", supplier.address);
      formData.append("shippingAddress", supplier.address);

      // Financial Calculations
      formData.append("subtotal", subtotal);
      formData.append("totalTax", totalTax);
      formData.append("totalDiscount", totalDiscount);
      formData.append("autoRoundOff", autoRoundOff);
      formData.append("grandTotal", grandTotal);

      // Payment Details
      formData.append("paidAmount", parseFloat(amountPaid) || 0);
      formData.append("fullyReceived", fullyReceived);

      // Additional Discount
      formData.append("additionalDiscount[pct]", parseFloat(additionalDiscountPct) || 0);
      formData.append("additionalDiscount[amt]", parseFloat(additionalDiscountAmt) || 0);

      // Additional Charges - FIX: Use the actual state values
      const shippingCharge = parseFloat(additionalChargesDetails.shipping) || 0;
      const handlingCharge = parseFloat(additionalChargesDetails.handling) || 0;
      const packingCharge = parseFloat(additionalChargesDetails.packing) || 0;
      const serviceCharge = parseFloat(additionalChargesDetails.service) || 0;
      const otherCharge = parseFloat(additionalChargesDetails.other) || 0;

      const additionalChargesTotal = shippingCharge + handlingCharge + packingCharge + serviceCharge + otherCharge;

      // Send the total
      formData.append("additionalCharges", additionalChargesTotal);

      // Send each charge detail INDIVIDUALLY - FIX: Use proper keys
      formData.append("additionalChargesDetails[shipping]", shippingCharge);
      formData.append("additionalChargesDetails[handling]", handlingCharge);
      formData.append("additionalChargesDetails[packing]", packingCharge);
      formData.append("additionalChargesDetails[service]", serviceCharge);
      formData.append("additionalChargesDetails[other]", otherCharge);

      // Notes
      formData.append("notes", "");
      formData.append("termsAndConditions", "");

      // Products
      nonEmptyProducts.forEach((p, index) => {
        formData.append(`items[${index}][productId]`, p.productId);
        formData.append(`items[${index}][itemName]`, p.itemName);
        formData.append(`items[${index}][hsnCode]`, p.hsnCode || "");
        formData.append(`items[${index}][qty]`, parseFloat(p.qty));
        formData.append(`items[${index}][unit]`, p.unit);
        formData.append(`items[${index}][unitPrice]`, parseFloat(p.unitPrice));
        formData.append(`items[${index}][taxRate]`, p.taxRate);
        formData.append(`items[${index}][taxAmount]`, p.taxAmount);
        formData.append(`items[${index}][discountPct]`, parseFloat(p.discountPct) || 0);
        formData.append(`items[${index}][discountAmt]`, p.discountAmt);
        formData.append(`items[${index}][amount]`, p.amount);
        formData.append(`items[${index}][selectedSerialNos]`, JSON.stringify(p.selectedSerialNos || []));
        formData.append(`items[${index}][selectedColor]`, p.selectedColor || "");
        formData.append(`items[${index}][selectedSize]`, p.selectedSize || "");
        formData.append(`items[${index}][lotNumber]`, p.lotNumber || "");
      });

      // Attachments
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


      let response;

      // ✅ FIX: Check if we're editing or creating
      if (isEditMode && editPurchaseOrderData?._id) {
        // UPDATE existing purchase order
        response = await api.put(`/api/purchase-orders/${editPurchaseOrderData._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Purchase Order updated successfully!");
      } else {
        // CREATE new purchase order
        response = await api.post("/api/purchase-orders", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Purchase Order created successfully!");
      }

      if (response.data.success) {
        const orderId = response.data.purchaseOrder?._id || response.data.purchase?._id;

        if (shouldPrint) {
          navigate(`/skeleton?redirect=/purchase-preview/${orderId}`);
        } else {
          navigate("/purchaseorder-list");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(error?.response?.data?.message || "Failed to save purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    fetchSuppliersForSearch();
    fetchProducts();
    // fetchPurchaseNumber();
    loadTaxSettings();
  }, []);

  useEffect(() => {
    if (products.length > 0 && allProducts.length > 0) {
      setSearchData((prev) => {
        const updated = { ...prev };
        products.forEach((p) => {
          if (!updated[p.id]) {
            updated[p.id] = {
              term: "",
              filtered: allProducts,
              isOpen: false,
            };
          }
        });
        return updated;
      });
    }
  }, [products, allProducts]);

  useEffect(() => {
    if (isReadOnly) return;
    const lastProduct = products[products.length - 1];
    if (lastProduct && lastProduct.itemName && lastProduct.itemName.trim() !== "") {
      const timer = setTimeout(() => {
        const hasEmptyRow = products.some((p) => !p.itemName || p.itemName.trim() === "");
        if (!hasEmptyRow) {
          addProductRow({ focus: true });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [products, isReadOnly]);

  useEffect(() => {
    const rowId = pendingFocusRowIdRef.current;
    if (!rowId) return;
    const input = document.querySelector(`[data-row-id="${rowId}"]`);
    if (!input) return;
    input.focus();
    pendingFocusRowIdRef.current = null;
  }, [products.length]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-input-container")) {
        setSearchData((prev) => {
          const closed = {};
          Object.keys(prev).forEach((id) => {
            closed[id] = { ...prev[id], isOpen: false };
          });
          return closed;
        });
      }
      if (receiptDateRef.current && !receiptDateRef.current.contains(event.target)) {
        setViewReceiptDateOptions(false);
        setIsCustomReceiptDatePickerOpen(false);
      }
      if (viewManageRef.current && !viewManageRef.current.contains(event.target)) {
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(event.target)) {
        setViewInvoiceOptions(false);
      }
      if (chargeRef.current && !chargeRef.current.contains(event.target)) {
        setViewChargeOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleSupplierClickOutside = (event) => {
      const supplierContainers = document.querySelectorAll(".supplier-search-container");
      let isInside = false;
      supplierContainers.forEach((container) => {
        if (container.contains(event.target)) {
          isInside = true;
        }
      });
      if (!isInside && showSupplierDropdown) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleSupplierClickOutside);
    return () => document.removeEventListener("mousedown", handleSupplierClickOutside);
  }, [showSupplierDropdown]);

  useEffect(() => {
    if (!supplierSearch.trim() && !phoneSearch.trim()) {
      setFilteredSuppliers(allSuppliers);
      return;
    }
    const filtered = allSuppliers.filter((sup) => {
      const nameMatch = supplierSearch.trim() ? sup.name?.toLowerCase().includes(supplierSearch.toLowerCase()) : false;
      const phoneMatch = phoneSearch.trim() ? sup.phone?.includes(phoneSearch) : false;
      const emailMatch = supplierSearch.trim() ? sup.email?.toLowerCase().includes(supplierSearch.toLowerCase()) : false;
      return nameMatch || phoneMatch || emailMatch;
    });
    setFilteredSuppliers(filtered);
  }, [supplierSearch, phoneSearch, allSuppliers]);

  // Add this function after your other functions
  const loadPurchaseOrderData = (purchaseOrder) => {
    // Set original status for tracking
    setOriginalStatus(purchaseOrder.status);

    // 1. Load supplier data
    if (purchaseOrder.supplierId) {
      const supplierData = purchaseOrder.supplierId;
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
        supplierId: supplierData._id || supplierData,
      });
      setSupplierSearch(supplierData.supplierName || supplierData.name || "");
      setPhoneSearch(supplierData.phone || "");
    }

    // 2. Set purchase order basic info
    if (purchaseOrder.purchaseDate) {
      setInvoiceDate(new Date(purchaseOrder.purchaseDate));
    }
    if (purchaseOrder.purchaseNo) {
      setInvoiceNo(purchaseOrder.purchaseNo);
    }
    if (purchaseOrder.referenceNo) {
      setReferenceNo(purchaseOrder.referenceNo);
    }
    if (purchaseOrder.receiptDate) {
      setReceiptDate(new Date(purchaseOrder.receiptDate));
    }

    // 3. Set billing address
    if (purchaseOrder.billingAddress) {
      setSupplier(prev => ({ ...prev, address: purchaseOrder.billingAddress }));
    }

    // 4. Load products
    if (purchaseOrder.items && purchaseOrder.items.length > 0) {
      const loadedProducts = purchaseOrder.items.map((item, index) => ({
        id: Date.now() + index + Math.random(),
        productId: item.productId?._id || item.productId,
        itemName: item.itemName,
        name: item.itemName,
        qty: item.qty || 1,
        unit: item.unit || "Piece",
        unitPrice: item.unitPrice || 0,
        taxRate: item.taxRate || 0,
        taxType: item.taxType || `GST ${item.taxRate || 0}%`,
        taxAmount: item.taxAmount || 0,
        discountPct: item.discountPct || 0,
        discountAmt: item.discountAmt || 0,
        amount: item.amount || 0,
        hsnCode: item.hsnCode || "",
        description: item.description || "",
        lotNumber: item.lotNumber || "",
        selectedSerialNos: item.selectedSerialNos || [],
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        stock: item.productId?.stockQuantity || 0,
      }));
      setProducts(loadedProducts);
      hasAddedInitialProduct.current = true;
    }

    // 5. Load additional charges
    if (purchaseOrder.additionalChargesDetails) {
      setAdditionalChargesDetails({
        shipping: purchaseOrder.additionalChargesDetails.shipping || 0,
        handling: purchaseOrder.additionalChargesDetails.handling || 0,
        packing: purchaseOrder.additionalChargesDetails.packing || 0,
        service: purchaseOrder.additionalChargesDetails.service || 0,
        other: purchaseOrder.additionalChargesDetails.other || 0,
      });
    }

    // 6. Load attachments
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

    // 7. Load payment info
    if (purchaseOrder.paidAmount !== undefined) {
      setAmountPaid(purchaseOrder.paidAmount.toString());
      setFullyReceived(purchaseOrder.fullyReceived || false);
    }

    if (isViewMode) {
      toast.info("Viewing purchase order");
    } else if (isEditMode) {
      toast.info("Editing purchase order - You can modify and save changes");
    }
  };
  useEffect(() => {
    if (editPurchaseOrderData && !hasAddedInitialProduct.current) {
      loadPurchaseOrderData(editPurchaseOrderData);
    }
  }, [editPurchaseOrderData]);

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
                {getHeaderText()}
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
                      {/* Supplier Name */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          width: "40%",
                        }}
                      >
                        <label>
                          Supplier Name<span style={{ color: "red" }}>*</span>
                        </label>
                        <div
                          style={{
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #EAEAEA",
                            padding: "6px 8px",
                            display: "flex",
                            gap: "4px",
                            marginTop: "4px",
                            alignItems: "center",
                            position: "relative",
                          }}
                          className="supplier-search-container"
                        >
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <FiSearch
                              style={{
                                color: "#666",
                                cursor: isReadOnly ? "default" : "pointer",
                                fontSize: "16px",
                              }}
                              onClick={() => !isReadOnly && setShowSupplierDropdown(true)}
                            />
                            <input
                              type="text"
                              placeholder="Search by name..."
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: isReadOnly ? "default" : "pointer",
                              }}
                              value={supplierSearch}
                              onChange={(e) => setSupplierSearch(e.target.value)}
                              onFocus={() => setShowSupplierDropdown(true)}
                              readOnly={isReadOnly}
                              disabled={isReadOnly}
                            />
                          </div>
                          {/* Only show buttons if not in view mode */}
                          {!isReadOnly && (
                            <div style={{ display: "flex", gap: "4px" }}>
                              {supplier.supplierId ? (
                                <button
                                  onClick={handleClearSupplier}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#dc3545",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    padding: "2px 6px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  REMOVE
                                </button>
                              ) : (
                                <button
                                  onClick={() => setOpenAddModal(true)}
                                  style={{
                                    background: "#1F7FFF",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    padding: "4px 8px",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                  }}
                                >
                                  + Add
                                </button>
                              )}
                            </div>
                          )}

                          {showSupplierDropdown && !isReadOnly && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                backgroundColor: "white",
                                border: "1px solid #EAEAEA",
                                borderRadius: "8px",
                                maxHeight: "300px",
                                overflowY: "auto",
                                zIndex: 1000,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                marginTop: "4px",
                              }}
                            >
                              <div
                                style={{
                                  padding: "8px 12px",
                                  borderBottom: "1px solid #f0f0f0",
                                  backgroundColor: "#f8f9fa",
                                  fontSize: "12px",
                                  color: "#666",
                                }}
                              >
                                {filteredSuppliers.length} supplier(s) found
                                <button
                                  onClick={() => {
                                    setOpenAddModal(true);
                                    setShowSupplierDropdown(false);
                                  }}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#1F7FFF",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    marginLeft: "8px",
                                  }}
                                >
                                  + Add new
                                </button>
                              </div>
                              {filteredSuppliers.map((sup) => (
                                <div
                                  key={sup._id}
                                  onClick={() => handleSupplierSelect(sup)}
                                  style={{
                                    padding: "12px 16px",
                                    borderBottom: "1px solid #f0f0f0",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    transition: "background-color 0.2s",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor = "white")
                                  }
                                >
                                  <div
                                    style={{
                                      width: "32px",
                                      height: "32px",
                                      borderRadius: "50%",
                                      backgroundColor: "#e0f0ff",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontWeight: "bold",
                                      color: "#1F7FFF",
                                      fontSize: "14px",
                                    }}
                                  >
                                    {sup.name?.charAt(0).toUpperCase() || "S"}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "500" }}>{sup.name}</div>
                                    <div style={{ fontSize: "12px", color: "#666" }}>
                                      {sup.phone || "No phone"} • ✉️ {sup.email || "No email"}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

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
                        <label>
                          Phone No.<span style={{ color: "red" }}>*</span>
                        </label>
                        <div
                          style={{
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #EAEAEA",
                            padding: "8px 8px",
                            display: "flex",
                            gap: "16px",
                            marginTop: "4px",
                            alignItems: "center",
                            position: "relative",
                          }}
                          className="supplier-search-container"
                        >
                          <div
                            className="d-flex"
                            style={{
                              borderRight: "1px solid #EAEAEA",
                              width: "70px",
                            }}
                          >
                            <img src={indialogo} alt="india-logo" style={{ width: 20 }} />
                            <span style={{ color: "black", padding: "0px 10px" }}>+91</span>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <FiSearch
                              style={{
                                color: "#666",
                                cursor: "pointer",
                                fontSize: "16px",
                              }}
                              onClick={() => setShowSupplierDropdown(true)}
                            />
                            <input
                              type="text"
                              placeholder="Search by phone..."
                              style={{
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: isReadOnly ? "default" : "pointer",
                              }}
                              value={phoneSearch}
                              onChange={(e) => setPhoneSearch(e.target.value)}
                              onFocus={() => setShowSupplierDropdown(true)}
                              readOnly={isReadOnly}
                              disabled={isReadOnly}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div style={{ marginTop: "10px", width: "50%" }}>
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
                          readOnly={isReadOnly}
                          disabled={isReadOnly}
                        ></textarea>
                      </div>
                    </div>
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
                        {/* Purchase Number */}
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
                              background: "#fff",
                            }}
                          >
                            <input
                              type="text"
                              value={invoiceNo}
                              onChange={(e) => setInvoiceNo(e.target.value)}
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
                              }}
                              disabled
                            />
                          </div>
                        </div>

                        {/* Purchase Date */}
                        <div style={{ position: "relative", width: 150 }}>
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
                            Purchase Order Date
                          </span>

                          <div
                            ref={viewManageRef}
                            style={{
                              height: 38,
                              padding: "0 12px",
                              border: "1px solid #A2A8B8",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              cursor: isReadOnly ? "default" : "pointer",
                              background: "#fff",
                            }}
                            onClick={() => !isReadOnly && handleViewManage}
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
                              {format(invoiceDate, "dd MMM yyyy")}
                            </div>
                            <FiChevronDown />
                            {viewManageOptions && (
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
                                  {["Today", "Yesterday", "Last Week", "Last 15 Days", "Last Month", "Custom"].map((option) => (
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
                                      onClick={() => handleDateSelect(option)}
                                    >
                                      <span style={{ color: "black" }}>{option}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {isDatePickerOpen && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "35px",
                                  left: "0px",
                                  zIndex: 1000000,
                                  background: "white",
                                  padding: "10px",
                                  borderRadius: "8px",
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <DatePicker
                                  selected={invoiceDate}
                                  onChange={(date) => {
                                    if (date) setInvoiceDate(date);
                                    setIsDatePickerOpen(false);
                                    setViewManageOptions(false);
                                  }}
                                  inline
                                />
                                <div style={{ textAlign: "center", marginTop: "10px" }}>
                                  <button
                                    onClick={() => {
                                      setIsDatePickerOpen(false);
                                      setViewManageOptions(false);
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
                {/* Table Header */}
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
                        Qty
                      </div>
                    </div>
                    {/* {settings.serialno && (
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
                          Serial No
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    /> */}
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
                        Unit
                      </div>
                    </div>
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
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
                    {taxSettings.enableGSTBilling ? (
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
                          Tax
                        </div>
                      </div>
                    ) : (
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
                          opacity: 0.5,
                        }}
                      >
                        <div
                          style={{
                            color: "#A2A8B8",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "500",
                            lineHeight: "16.80px",
                            wordWrap: "break-word",
                          }}
                        >
                          Tax
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
                    {taxSettings.enableGSTBilling ? (
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
                          Tax Amount
                        </div>
                      </div>
                    ) : (
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
                          opacity: 0.5,
                        }}
                      >
                        <div
                          style={{
                            color: "#A2A8B8",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "500",
                            lineHeight: "16.80px",
                            wordWrap: "break-word",
                          }}
                        >
                          Tax Amount
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        width: 1,
                        height: 30,
                        background: "var(--Black-Disable, #A2A8B8)",
                      }}
                    />
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
                        Amount
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
                        {!isReadOnly && (
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
                            }}
                          >
                            <RiDeleteBinLine
                              className="text-danger"
                              style={{ cursor: "pointer", fontSize: "16px" }}
                              onClick={() => removeProductRow(p.id)}
                            />
                          </div>
                        )}

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
                                data-row-id={p.id}
                                ref={inputRef}
                                type="text"
                                value={p.itemName || searchData[p.id]?.term || ""}
                                onChange={(e) => {
                                  if (isReadOnly) return;
                                  handleSearch(e, p.id);
                                  openDropdown(p.id);
                                }}
                                onKeyDown={(e) => {
                                  if (isReadOnly) return;
                                  if (e.key !== "Enter") return;
                                  const first = (searchData[p.id]?.filtered || [])[0];
                                  if (first) {
                                    handleProductSelect(first, p.id);
                                    e.preventDefault();
                                  }
                                }}
                                onFocus={() => {
                                  if (isReadOnly) return;
                                  setSearchData((prev) => {
                                    const closed = {};
                                    Object.keys(prev).forEach((id) => {
                                      closed[id] = { ...prev[id], isOpen: false };
                                    });
                                    return closed;
                                  });
                                  setTimeout(() => {
                                    openDropdown(p.id);
                                    const alreadySelectedIds = getSelectedProductIds(p.id);
                                    setSearchData((prev) => ({
                                      ...prev,
                                      [p.id]: {
                                        ...prev[p.id],
                                        isOpen: true,
                                        filtered: allProducts.filter((prod) => !alreadySelectedIds.includes(prod._id)),
                                      },
                                    }));
                                  }, 0);
                                }}
                                placeholder={isReadOnly ? "View only" : "Search Product by its name or item bar code"}
                                style={{
                                  border: "none",
                                  outline: "none",
                                  width: "100%",
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                  padding: "8px",
                                }}
                              />

                              {searchData[p.id]?.isOpen && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    width: "400px",
                                    maxHeight: "400px",
                                    overflowY: "auto",
                                    backgroundColor: "#fff",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "6px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                                    zIndex: 10000,
                                    marginTop: "4px",
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <div
                                    style={{
                                      padding: "8px 12px",
                                      borderBottom: "1px solid #f0f0f0",
                                      backgroundColor: "#f8f9fa",
                                      fontSize: "12px",
                                      color: "#666",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      position: "sticky",
                                      top: 0,
                                      zIndex: 1,
                                    }}
                                  >
                                    <span>
                                      {(searchData[p.id]?.filtered || []).length} product(s) found
                                      {searchData[p.id]?.term && ` for "${searchData[p.id]?.term}"`}
                                    </span>
                                  </div>

                                  {(searchData[p.id]?.filtered || []).length === 0 ? (
                                    <div
                                      style={{
                                        padding: "12px",
                                        color: "#666",
                                        textAlign: "center",
                                        fontSize: "14px",
                                      }}
                                    >
                                      No products found
                                    </div>
                                  ) : (
                                    (searchData[p.id]?.filtered || []).map((product) => (
                                      <div
                                        key={product._id}
                                        onClick={() => handleProductSelect(product, p.id)}
                                        style={{
                                          padding: "12px",
                                          cursor: "pointer",
                                          borderBottom: "1px solid #f0f0f0",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "12px",
                                          backgroundColor: "#fff",
                                          transition: "background-color 0.2s",
                                        }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.backgroundColor = "#f8f9fa")
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.backgroundColor = "#fff")
                                        }
                                      >
                                        <div
                                          style={{
                                            width: "50px",
                                            height: "50px",
                                            flexShrink: 0,
                                          }}
                                        >
                                          {product.images?.[0]?.url ? (
                                            <img
                                              src={product.images?.[0]?.url}
                                              alt="Product"
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                borderRadius: "4px",
                                                border: "1px solid #e5e7eb",
                                              }}
                                            />
                                          ) : (
                                            <img
                                              src={ProductDefaultImage}
                                              alt="No Image"
                                              style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                borderRadius: "4px",
                                                border: "1px solid #e5e7eb",
                                              }}
                                            />
                                          )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div
                                            style={{
                                              fontWeight: "500",
                                              color: "#1f2937",
                                              fontSize: "14px",
                                              lineHeight: "1.4",
                                              whiteSpace: "nowrap",
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                            }}
                                          >
                                            {product.productName}
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                            }}
                                          >
                                            <div
                                              style={{
                                                color: "#6b7280",
                                                fontSize: "14px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "start",
                                                gap: "4px",
                                              }}
                                            >
                                              <FaBarcode /> {product.itemBarcode}
                                            </div>
                                            <div
                                              style={{
                                                color: "#6b7280",
                                                fontSize: "14px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "end",
                                              }}
                                            >
                                              HSN: {product.hsn?.hsnCode || ""}
                                            </div>
                                          </div>
                                          <div
                                            style={{
                                              display: "flex",
                                              justifyContent: "space-between",
                                              alignItems: "center",
                                            }}
                                          >
                                            <div
                                              style={{
                                                fontWeight: "600",
                                                color: "#1f2937",
                                                fontSize: "14px",
                                              }}
                                            >
                                              ₹{product.purchasePrice || product.price || 0}
                                            </div>
                                            <div
                                              style={{
                                                fontSize: "12px",
                                                color: product.stockQuantity <= 0 ? "#ef4444" : "#6b7280",
                                                fontWeight: "500",
                                              }}
                                            >
                                              Stock: {product.stockQuantity || 0}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
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
                                backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                              }}
                            >
                              <input
                                type="number"
                                placeholder="0"
                                min="1"
                                step="1"
                                className="table-input"
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                }}
                                value={p.qty}
                                onChange={(e) => {
                                  if (isReadOnly) return;
                                  const newProducts = [...products];
                                  newProducts[idx].qty = e.target.value;
                                  setProducts(newProducts);
                                }}
                                readOnly={isReadOnly}
                              />
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

                            {/* {settings.serialno && (
                              <>
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
                                    type="text"
                                    placeholder="Serial No"
                                    className="table-input"
                                    style={{
                                      width: "100%",
                                      border: "none",
                                      outline: "none",
                                      cursor:isReadOnly ? "default" : "pointer",
                                      backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                    }}
                                    value={p.serialno || ""}
                                    onChange={(e) => {
                                      const newProducts = [...products];
                                      newProducts[idx].serialno = e.target.value;
                                      setProducts(newProducts);
                                    }}
                                    readOnly={isReadOnly}
                                    disabled={isReadOnly}
                                  />
                                </div>
                                <div
                                  style={{
                                    width: 1,
                                    height: 30,
                                    background: "var(--Black-Disable, #A2A8B8)",
                                  }}
                                />
                              </>
                            )} */}

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
                                backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                              }}
                            >
                              <input
                                type="text"
                                placeholder=""
                                className="table-input"
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  cursor: isReadOnly ? "default" : "pointer",
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                }}
                                value={p.unit}
                                onChange={(e) => {
                                  const newProducts = [...products];
                                  newProducts[idx].unit = e.target.value;
                                  setProducts(newProducts);
                                }}
                                readOnly={isReadOnly}
                                disabled={isReadOnly}
                              />
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

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
                                backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
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
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                }}
                                value={p.unitPrice}
                                onChange={(e) => {
                                  if (isReadOnly) return;
                                  const newProducts = [...products];
                                  newProducts[idx].unitPrice = e.target.value;
                                  setProducts(newProducts);
                                }}
                                readOnly={isReadOnly}
                              />
                            </div>

                            <div
                              style={{
                                width: 1,
                                height: 30,
                                background: "var(--Black-Disable, #A2A8B8)",
                              }}
                            />

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
                                backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                              }}
                            >
                              <input
                                type="text"
                                className={`table-input ${!taxSettings.enableGSTBilling ? "table-input-disabled" : ""}`}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  background: "transparent",
                                  color: taxSettings.enableGSTBilling ? "inherit" : "#A2A8B8",
                                  cursor: isReadOnly ? "default" : "pointer",
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                }}
                                disabled={isReadOnly}
                                readOnly={isReadOnly}
                                value={`${p.taxRate}%`}
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
                                backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                              }}
                            >
                              <input
                                type="number"
                                className={`table-input ${!taxSettings.enableGSTBilling ? "table-input-disabled" : ""}`}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                  color: taxSettings.enableGSTBilling ? "inherit" : "#A2A8B8",
                                  cursor: isReadOnly ? "default" : "pointer",
                                }}
                                disabled={isReadOnly}
                                readOnly={isReadOnly}
                                value={p.taxAmount.toFixed(2)}
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
                                backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                              }}
                            >
                              <input
                                type="number"
                                className="table-input"
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  cursor: isReadOnly ? "default" : "pointer",
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                }}
                                disabled={isReadOnly}
                                readOnly={isReadOnly}
                                value={p.amount.toFixed(2)}
                                readOnly
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
                            backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                          }}
                          value={chargeAmount}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            const value = e.target.value;
                            const numericValue = value.replace(/[^\d.]/g, "");
                            const parts = numericValue.split(".");
                            if (parts.length > 2) {
                              const formattedValue = parts[0] + "." + parts.slice(1).join("");
                              setChargeAmount(formattedValue);
                            } else {
                              setChargeAmount(numericValue);
                            }
                          }}
                          readOnly={isReadOnly}
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
                          onClick={() => !isReadOnly && setViewChargeOptions(!viewChargeOptions)}
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
                          cursor: isReadOnly ? "default" : "pointer",
                        }}
                        readOnly={isReadOnly}
                        disabled={isReadOnly}
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
                              onClick={() => {
                                setUploadedAttachments(uploadedAttachments.filter((_, i) => i !== index));
                              }}
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
                  {/* Summary */}
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

                  {/* <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Product Discount :</span>
                    <span style={{ color: "#9ca3af" }}>₹{itemsDiscount.toFixed(2)}</span>
                  </div> */}

                  {/* <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>Additional Discount :</span>
                    <span style={{ color: "#9ca3af" }}>₹{additionalDiscountValue.toFixed(2)}</span>
                  </div> */}

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

                  {/* Auto round-off */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ accentColor: "#ffffffff" }}
                      checked={taxSettings.autoRoundOff !== "0" && taxSettings.enableGSTBilling}
                      onChange={() => { }}
                      disabled
                    />
                    <span>Auto Round-off</span>
                    <span style={{ marginLeft: "auto" }}>
                      {roundOffAdded >= 0 ? "+" : "-"} ₹{Math.abs(roundOffAdded).toFixed(2)}
                    </span>
                  </div>

                  <div
                    style={{
                      height: "1px",
                      background: "#eee",
                      margin: "12px 0",
                    }}
                  />

                  {/* Total Amount */}
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

                  {/* Fully Paid */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      fontSize: "14px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="checkbox"
                      style={{ accentColor: "#ffffffff", cursor: isReadOnly ? "default" : "pointer" }}
                      checked={fullyReceived}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFullyReceived(checked);
                        if (checked) {
                          setAmountPaid(grandTotal.toFixed(2));
                        }
                      }}
                      readOnly={isReadOnly}
                      disabled={isReadOnly}
                    />
                    <span>Fully Paid</span>
                  </div>

                  {/* Amount Inputs */}
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
                          disabled={fullyReceived || isReadOnly}
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
                          value={amountDue.toFixed(2)}
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
                  </div>
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
              {!isViewMode && (
                <>
                  <div
                    onClick={() => handleSubmit(false)}
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
                      {isSubmitting ? "Saving..." : "Save"}
                    </div>
                  </div>

                  <div
                    onClick={() => handleSubmit(true)}
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
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      opacity: isSubmitting ? 0.7 : 1,
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
                      {isSubmitting ? "Saving..." : "Save & Print"}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {openAddModal && (
          <div
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
            }}
            onClick={() => setOpenAddModal(false)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <AddSuppliers
                onClose={() => {
                  setOpenAddModal(false);
                  fetchSuppliersForSearch();
                }}
                onSuccess={handleNewSupplierCreated}
              />
            </div>
          </div>
        )}
        {/* Add the variant popup at the end of your component */}
        {showVariantPopup && popupMode && popupSelectedProduct && (
          <ProductPopup
            selectedProduct={popupSelectedProduct}
            productVariants={popupSelectedProduct?.variants || []}
            productImages={popupVariantImages}
            activeImageIndex={popupActiveImageIndex}
            setActiveImageIndex={setPopupActiveImageIndex}
            productColors={popupProductColors}
            selectedColor={popupSelectedColor}
            setSelectedColor={setPopupSelectedColor}
            productSizes={popupProductSizes}
            selectedSize={popupSelectedSize}
            setSelectedSize={setPopupSelectedSize}
            productSerialno={popupVariantSerials}
            selectedSerialno={popupSelectedSerialno}
            setSelectedSerialno={setPopupSelectedSerialno}
            productLot={popupProductLot}
            selectedLot={popupSelectedLot}
            setSelectedLot={setPopupSelectedLot}
            selectedQty={popupSelectedQty}
            availableQty={popupAvailableQty}
            increaseQty={increasePopupQty}
            decreaseQty={decreasePopupQty}
            disableQty={isMaxQtyReached()}
            onClose={closeProductPopups}
            price={popupDisplayPrice}
            mrp={popupSelectedVariant?.mrp ?? null}
            unit={popupSelectedVariant?.unit ?? popupSelectedProduct?.unit ?? "Unit"}
            expiryText={getExpiryDisplayText(popupSelectedVariant?.expiryDate)}
            getExpiryDisplayText={getExpiryDisplayText}
            onPrimaryClick={handleAddProductFromPopup}
          />
        )}
      </div>
    </>
  );
}

export default CreatePurchaseOrder;