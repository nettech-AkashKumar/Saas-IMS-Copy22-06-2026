import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { toWords } from "number-to-words";
import DatePicker from "react-datepicker";

// pages
import "react-datepicker/dist/react-datepicker.css";
import api from "../config/axiosInstance";
import PreviewPurchaseOrder from "./PreviewPurchase";
import AddSuppliers from "../Modal/suppliers/AddSupplierModals";

// icons
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiChevronDown } from "react-icons/fi";
import { CiBarcode } from "react-icons/ci";
import { RiImageAddFill } from "react-icons/ri";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import { FaArrowLeft, FaBarcode, FaCircleExclamation, FaFileImport } from "react-icons/fa6";
import { FiMinus, FiPlus, FiX } from "react-icons/fi";
import { IoIosCheckmark } from "react-icons/io";
import { useLocation } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

// images
import indialogo from "../../assets/images/india-logo.png";
import total_orders_icon from "../../assets/images/totalorders-icon.png";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../assets/images/taxinvoice.png";
import ProductDefaultImage from "../../../src/assets/images/product-default.png";

// pos start for add here
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
// pos end here

const ProductPopup = ({
  selectedProduct,
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
  setLot,
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
  mode = "details",
  onPrimaryClick
}) => {
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "451px", background: "white", display: "flex", flexDirection: "column", position: "relative", boxSizing: "border-box", borderRadius: "8px", fontFamily: "Inter" }}>
        <div style={{ backgroundColor: "#F6F9FA", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", borderBottom: "1px solid #EAEAEA", borderTopLeftRadius: "8px", borderTopRightRadius: "8px" }}>
          <label>Choose Variant</label>
          <FiX onClick={onClose} style={{ cursor: "pointer" }} />
        </div>
        <div style={{ padding: "8px 8px" }}>
          <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #C3C3C3", padding: "8px 0px" }}>
            <span>
              <img
                alt="Product"
                src={productImages?.length > 0 ? productImages[Math.min(Math.max(Number(activeImageIndex) || 0, 0), productImages.length - 1)] : ProductDefaultImage}
                onClick={() => {
                  if (!productImages?.length) return;
                  setActiveImageIndex((prev) => (Number(prev || 0) + 1) % productImages.length);
                }}
                style={{
                  border: "1px solid #DBDBDB",
                  width: "81px",
                  height: "72px",
                  objectFit: "cover",
                  borderRadius: "4px",
                  cursor: productImages?.length > 1 ? "pointer" : "default",
                }}
              />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ color: "#0E101A", fontWeight: "500", fontSize: "14px" }}>
                {selectedProduct?.productName || "Product Name"}
              </label>
              <label style={{ color: "#8D8D8D", fontSize: "12px", fontWeight: "400", display: "flex", gap: "4px" }}>
                <span>{selectedProduct?.brand?.brandName || "Brand"} • </span>
                <span>{selectedProduct?.category?.categoryName || "Category"} • </span>
                {availableQty} {unit || selectedProduct?.unit || "Unit"}
              </label>
              <label style={{ color: "#1F7FFF", fontSize: "20px", fontWeight: "500" }}>
                ₹{price?.toFixed(2)}
                {mrp && <del style={{ color: "#8D8D8D", fontSize: "12px", fontWeight: "400", marginLeft: "8px" }}>₹{mrp}</del>}
              </label>
              {expiryText && (
                <label style={{
                  backgroundColor: expiryText === "Expired" ? "#fbd7d7ff" : "#E6F8FF",
                  border: expiryText === "Expired" ? "1px solid #f85f5fff" : "1px solid #7CDAFF",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  color: expiryText === "Expired" ? "#f91f1fff" : "#005677",
                  fontSize: "10px",
                  fontWeight: "400",
                  width: "fit-content",
                  height: "20px",
                  textAlign: "center"
                }}>
                  {expiryText}
                </label>
              )}
              {Number(selectedProduct?.warrantyPeriod) > 0 && (
                <label style={{
                  backgroundColor: "#E6F8FF",
                  border: "1px solid #7CDAFF",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  color: "#005677",
                  fontSize: "10px",
                  fontWeight: "400",
                  width: "fit-content",
                  height: "20px",
                  textAlign: "center"
                }}>
                  {`${selectedProduct?.warrantyPeriod} Month Warranty`}
                </label>
              )}
            </span>
          </div>

          <div style={{ maxHeight: "190px", overflow: "auto", padding: "10px 10px", borderBottom: "1px solid #C3C3C3", display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {/* Color */}
            {productColors?.length !== 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: '8px' }}>
                <label style={{ color: "#0E101A", fontSize: "12px" }}>Color</label>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  {productColors?.map((color, idx) => {
                    const active = selectedColor === color;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          backgroundColor: color,
                          width: "27px",
                          height: "27px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: "3px",
                          boxSizing: "border-box",
                          border: active ? "3px solid #2F80ED" : "2px solid #E0E0E0",
                        }}
                      >
                        <div style={{
                          backgroundColor: color,
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          border: color === "white" ? "1px solid #ccc" : "none",
                        }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size */}
            {productSizes?.length !== 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ color: "#0E101A", fontSize: "12px" }}>Size</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {productSizes?.map((size, idx) => {
                    const active = String(selectedSize) === String(size);
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        style={{
                          border: "1px solid #EAEAEA",
                          borderRadius: "4px",
                          fontSize: "14px",
                          padding: "4px 12px",
                          cursor: "pointer",
                          color: active ? "white" : "#727681",
                          background: active ? "#2F80ED" : "transparent",
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {availableQty > 0 && availableQty < 10 ? (
                  <div style={{ backgroundColor: "#FFE5E5", color: "#B70000", fontSize: "12px", fontWeight: "400", border: "1px solid #B70000", padding: "8px", borderRadius: "4px", width: "100%", marginBottom: "10px" }}>
                    <IoIosCheckmark size={15} /> Only {availableQty} Left
                  </div>
                ) : availableQty > 10 && availableQty < 50 ? (
                  <div style={{ backgroundColor: "#FDFFCF", color: "#B77100", fontSize: "12px", fontWeight: "400", border: "1px solid #B77100", padding: "8px", borderRadius: "4px", width: "100%", marginBottom: "10px" }}>
                    <IoIosCheckmark size={15} /> Only {availableQty} Left
                  </div>
                ) : availableQty > 0 ? (
                  <div style={{ backgroundColor: "#CFFFDE", color: "#0D6828", fontSize: "12px", fontWeight: "400", border: "1px solid #0D6828", padding: "8px", borderRadius: "4px", width: "100%", marginBottom: "10px" }}>
                    <IoIosCheckmark size={15} /> Only {availableQty} Left
                  </div>
                ) : null}
              </div>
            )}

            {/* Serial No */}
            {productSerialno?.length !== 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ color: "#0E101A", fontSize: "12px" }}>Serial No.</label>
                {productSerialno?.map((serialno, idx) => (
                  <div key={idx}>
                    <div style={{ width: "100%", border: "1px solid #EAEAEA", padding: "16px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input
                          type="radio"
                          name="serialno"
                          className="input-radio"
                          checked={String(selectedSerialno) === String(serialno)}
                          onChange={() => setSelectedSerialno(String(serialno))}
                        />
                        {serialno}
                      </span>
                      <span>1 unit</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Batches/Lot No */}
            {productLot?.length !== 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ color: "#0E101A", fontSize: "12px" }}>Batches / Lot No.</label>
                {productLot?.map((lot, idx) => (
                  <div key={idx}>
                    <div style={{ width: "100%", border: "1px solid #EAEAEA", padding: "16px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <input type="radio" name="lot" /> {lot}
                      </span>
                      <span>30 units</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <label>Quantity</label>
            <div style={{ border: "1px solid #EAEAEA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <button
                onClick={decreaseQty}
                disabled={disableQty || selectedQty <= 1}
                style={{
                  background: "#F8F9FB",
                  border: "1px solid #EAEAEA",
                  padding: "10px",
                  fontSize: "12px",
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  borderTopLeftRadius: "8px",
                  borderBottomLeftRadius: "8px",
                  cursor: disableQty || selectedQty <= 1 ? "not-allowed" : "pointer",
                  opacity: disableQty || selectedQty <= 1 ? 0.6 : 1,
                }}
              >
                <FiMinus />
              </button>
              <div style={{ fontSize: "12px", fontWeight: 500, color: "#111827" }}>
                {String(selectedQty).padStart(2, "0")}
              </div>
              <button
                onClick={increaseQty}
                disabled={disableQty}
                style={{
                  background: "#F8F9FB",
                  border: "1px solid #EAEAEA",
                  padding: "10px",
                  fontSize: "12px",
                  color: "#111827",
                  display: "flex",
                  alignItems: "center",
                  borderTopRightRadius: "8px",
                  borderBottomRightRadius: "8px",
                  cursor: disableQty ? "not-allowed" : "pointer",
                  opacity: disableQty ? 0.6 : 1,
                }}
              >
                <FiPlus />
              </button>
            </div>
          </div>

          <button
            style={{ backgroundColor: "#1F7FFF", border: "1px solid #0084FF", padding: "12px 20px", color: "white", borderRadius: "4px", width: "100%", cursor: "pointer" }}
            onClick={onPrimaryClick}
          >
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
};

function CreatePurchase() {
  const location = useLocation();
  const grnData = location.state?.grnData;
  const viewManageRef = useRef(null);
  const hasAddedInitialProduct = useRef(false);
  const { supplierId } = useParams();
  const navigate = useNavigate();
  const receiptDateRef = useRef(null);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const productSearchInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [searchData, setSearchData] = useState({});
  const inputRef = useRef(null);
  const pendingFocusRowIdRef = useRef(null);
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [additionalDiscountType, setAdditionalDiscountType] =
    useState("Amount");

  const [companyData, setCompanyData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);

  // Add this state with your other state declarations
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

  // Modals
  const [viewManageOptions, setViewManageOptions] = useState(false);
  const [viewInvoiceOptions, setViewInvoiceOptions] = useState(false);
  const [viewChargeOptions, setViewChargeOptions] = useState(false);
  const [selectedChargeType, setSelectedChargeType] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [popupMode, setPopupMode] = useState(null);
  const [popupSelectedProduct, setPopupSelectedProduct] = useState(null);
  const [popupSelectedColor, setPopupSelectedColor] = useState("");
  const [popupSelectedSize, setPopupSelectedSize] = useState("");
  const [popupSelectedSerialno, setPopupSelectedSerialno] = useState('');
  const [popupSelectedQty, setPopupSelectedQty] = useState(1);
  const [popupActiveImageIndex, setPopupActiveImageIndex] = useState(0);
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [referenceNo, setReferenceNo] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date());
  const [isReceiptDatePickerOpen, setIsReceiptDatePickerOpen] = useState(false);
  const [viewReceiptDateOptions, setViewReceiptDateOptions] = useState(false);
  const [isCustomReceiptDatePickerOpen, setIsCustomReceiptDatePickerOpen] = useState(false);
  const [originalStatus, setOriginalStatus] = useState(null);
  const editPurchaseOrderData = location.state?.editPurchaseOrder;
  const mode = location.state?.mode;
  const isViewMode = mode === 'view';
  const isEditMode = !!editPurchaseOrderData?._id;
  const isConvertFromGRN = location.state?.mode === "convert-from-grn";
  const isConvertFromPO = location.state?.mode === "convert-from-po";
  const isReorderMode = location.state?.mode === "reorder";
  const isReadOnly = isViewMode || isConvertFromGRN || (isEditMode && originalStatus === "approved");
  const [uploadedAttachments, setUploadedAttachments] = useState([]);

  const [productCache, setProductCache] = useState({});
  const [trackingByRowId, setTrackingByRowId] = useState({});
  const [serialInput, setSerialInput] = useState("");
  const [activeTrackingRowId, setActiveTrackingRowId] = useState(null);
  const [showBatchPopup, setShowBatchPopup] = useState(false);
  const [showSerialPopup, setShowSerialPopup] = useState(false);
  const [addSerialPopup, setAddSerialPopup] = useState(false);

  const modelRef = useRef(null);
  const chargeRef = useRef(null);
  const isFromNavbar = !supplierId;

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

  // System settings for product fields
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

  // Tax settings
  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
    priceIncludeGST: true,
    defaultGSTRate: "18",
    autoRoundOff: "0",
  });

  // Products state
  const [products, setProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  // Additional Charges
  const [additionalChargesDetails, setAdditionalChargesDetails] = useState({
    shipping: 0,
    handling: 0,
    packing: 0,
    service: 0,
    other: 0,
  });

  const getHeaderText = () => {
    if (isViewMode) return "View Purchase";
    if (mode === "convert-from-grn") return "Convert GRN to Purchase";
    if (mode === "convert-from-po") return "Convert Purchase Order to Purchase";
    if (isReorderMode) return "Reorder Purchase";
    if (isEditMode) return "Edit Purchase";
    return "Create Purchase";
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (receiptDateRef.current && !receiptDateRef.current.contains(event.target)) {
        setViewReceiptDateOptions(false);
        setIsCustomReceiptDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isConvertFromGRN && grnData) {
      loadGRNData(grnData);
    }
  }, [isConvertFromGRN, grnData]);

  useEffect(() => {
    if (isConvertFromPO && editPurchaseOrderData) {
      loadPurchaseOrderDataForConversion(editPurchaseOrderData);
    }
  }, [isConvertFromPO, editPurchaseOrderData]);


  const loadGRNData = (grn) => {
    // 1. Load supplier from GRN
    if (grn.supplierId) {
      const supplierData = grn.supplierId;
      const supplierName = supplierData.supplierName || supplierData.name || "";
      const supplierPhone = supplierData.phone || "";
      const supplierAddress = supplierData.address || "";
      const supplierEmail = supplierData.email || "";
      const supplierGstin = supplierData.gstin || "";
      const supplierId = supplierData._id || supplierData;

      setSupplier({
        name: supplierName,
        phone: supplierPhone,
        address: supplierAddress,
        email: supplierEmail,
        gstin: supplierGstin,
        supplierId: supplierId,
      });

      setSupplierSearch(supplierName);
      setPhoneSearch(supplierPhone);
    }

    // 2. Set invoice date from GRN receive date or current date
    if (grn.receiveDate) {
      setInvoiceDate(new Date(grn.receiveDate));
    }
    if (grn.purchaseOrderId && grn.purchaseOrderId.purchaseNo) {
    setInvoiceNo(grn.purchaseOrderId.purchaseNo);
  } else if (grn.purchaseOrderId && typeof grn.purchaseOrderId === 'object') {
    // If purchaseOrderId is populated but we don't have purchaseNo
    setInvoiceNo(`PO-${grn.purchaseOrderId._id}`);
  } 

    // 3. Load products from GRN items - FIX: Properly calculate tax and amount
    if (grn.items && grn.items.length > 0) {
      const loadedProducts = grn.items.map((item, index) => {
        // Get quantities
        const qty = item.receivingNow || item.qty || 1;
        const unitPrice = item.unitPrice || item.receivingPrice || 0;

        // Calculate tax amount (if tax rate is provided)
        const taxRate = item.taxRate || 0;
        const taxAmount = taxSettings.enableGSTBilling ? (qty * unitPrice * taxRate) / 100 : 0;

        // Calculate total amount (unit price * qty + tax)
        const amount = (qty * unitPrice) + taxAmount;

        return {
          id: Date.now() + index + Math.random(),
          productId: item.productId?._id || item.productId,
          itemName: item.itemName,
          name: item.itemName,
          qty: qty,
          unit: item.unit || "Piece",
          unitPrice: unitPrice,
          taxRate: taxRate,
          taxType: item.taxType || `GST ${taxRate}%`,
          taxAmount: taxAmount,
          discountPct: 0,  // No discount for purchase from GRN
          discountAmt: 0,
          amount: amount,
          hsnCode: item.hsnCode || "",
          description: item.description || "",
          lotNumber: item.lotNumber || "",
          selectedSerialNos: item.selectedSerialNos || [],
          selectedColor: item.selectedColor || "",
          selectedSize: item.selectedSize || "",
          stock: 0,
        };
      });
      setProducts(loadedProducts);
      hasAddedInitialProduct.current = true;
    }

    // 4. Load additional charges from GRN
    if (grn.additionalChargesDetails) {
      setAdditionalChargesDetails({
        shipping: grn.additionalChargesDetails.shipping || 0,
        handling: grn.additionalChargesDetails.handling || 0,
        packing: grn.additionalChargesDetails.packing || 0,
        service: grn.additionalChargesDetails.service || 0,
        other: grn.additionalChargesDetails.other || 0,
      });
    }

    // 5. Load paid amount from GRN
    if (grn.paidAmount) {
      setAmountPaid(grn.paidAmount.toString());
      if (grn.fullyReceived) {
        setFullyReceived(true);
      }
    }

    // 6. Load attachments from GRN
    if (grn.attachments && grn.attachments.length > 0) {
      const attachments = grn.attachments.map(att => ({
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

    toast.info("GRN data loaded for conversion to Purchase Order");
  };

  const loadPurchaseOrderDataForConversion = (purchaseOrder) => {
    // 1. Load supplier from Purchase Order
    if (purchaseOrder.supplierId) {
      const supplierData = purchaseOrder.supplierId;
      const supplierName = supplierData.supplierName || supplierData.name || "";
      const supplierPhone = supplierData.phone || "";
      const supplierAddress = supplierData.address || "";
      const supplierEmail = supplierData.email || "";
      const supplierGstin = supplierData.gstin || "";
      const supplierId = supplierData._id || supplierData;

      setSupplier({
        name: supplierName,
        phone: supplierPhone,
        address: supplierAddress,
        email: supplierEmail,
        gstin: supplierGstin,
        supplierId: supplierId,
      });
      setSupplierSearch(supplierName);
      setPhoneSearch(supplierPhone);
    }

    // 2. Set purchase date
    if (purchaseOrder.purchaseDate) {
      setInvoiceDate(new Date(purchaseOrder.purchaseDate));
    }
    if (purchaseOrder.purchaseNo) {
    setInvoiceNo(`PUR-${purchaseOrder.purchaseNo}`);
  } 


    // 3. Set reference number and receipt date
    if (purchaseOrder.referenceNo) {
      setReferenceNo(purchaseOrder.referenceNo);
    }
    if (purchaseOrder.receiptDate) {
      setReceiptDate(new Date(purchaseOrder.receiptDate));
    }

    // 4. Load products from Purchase Order items
    if (purchaseOrder.items && purchaseOrder.items.length > 0) {
      const loadedProducts = purchaseOrder.items.map((item, index) => {
        const qty = item.qty || 1;
        const unitPrice = item.unitPrice || 0;

        // Calculate tax amount
        const taxRate = item.taxRate || 0;
        const taxAmount = taxSettings.enableGSTBilling ? (qty * unitPrice * taxRate) / 100 : 0;

        // Calculate total amount (unit price * qty + tax) - no discount for purchase
        const amount = (qty * unitPrice) + taxAmount;

        return {
          id: Date.now() + index + Math.random(),
          productId: item.productId?._id || item.productId,
          itemName: item.itemName,
          name: item.itemName,
          qty: qty,
          unit: item.unit || "Piece",
          unitPrice: unitPrice,
          taxRate: taxRate,
          taxType: item.taxType || `GST ${taxRate}%`,
          taxAmount: taxAmount,
          discountPct: 0,  // No discount on purchase
          discountAmt: 0,
          amount: amount,
          hsnCode: item.hsnCode || item.hsn || "",
          description: item.description || "",
          lotNumber: item.lotNumber || "",
          selectedSerialNos: item.selectedSerialNos || [],
          selectedColor: item.selectedColor || "",
          selectedSize: item.selectedSize || "",
          stock: 0,
        };
      });
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

    // 6. Load additional discount
    if (purchaseOrder.additionalDiscount) {
      if (purchaseOrder.additionalDiscount.pct > 0) {
        setAdditionalDiscountType("Percentage");
        setAdditionalDiscountPct(purchaseOrder.additionalDiscount.pct);
      } else if (purchaseOrder.additionalDiscount.amt > 0) {
        setAdditionalDiscountType("Fixed");
        setAdditionalDiscountAmt(purchaseOrder.additionalDiscount.amt);
      }
    }

    // 7. Load paid amount
    if (purchaseOrder.paidAmount) {
      setAmountPaid(purchaseOrder.paidAmount.toString());
      if (purchaseOrder.fullyReceived) {
        setFullyReceived(true);
      }
    }

    // 8. Load attachments
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

    toast.info("Purchase Order loaded for conversion. You can modify and save.");
  };

  // Add this function with your other handlers
  const handleReceiptDateSelect = (option) => {
    const today = new Date();
    let selectedDate = new Date();

    switch (option) {
      case "Today":
        selectedDate = today;
        setReceiptDate(selectedDate);
        setViewReceiptDateOptions(false);
        setIsCustomReceiptDatePickerOpen(false);
        break;
      case "Yesterday":
        selectedDate = new Date(today.setDate(today.getDate() - 1));
        setReceiptDate(selectedDate);
        setViewReceiptDateOptions(false);
        setIsCustomReceiptDatePickerOpen(false);
        break;
      case "Last Week":
        selectedDate = new Date(today.setDate(today.getDate() - 7));
        setReceiptDate(selectedDate);
        setViewReceiptDateOptions(false);
        setIsCustomReceiptDatePickerOpen(false);
        break;
      case "Last 15 Days":
        selectedDate = new Date(today.setDate(today.getDate() - 15));
        setReceiptDate(selectedDate);
        setViewReceiptDateOptions(false);
        setIsCustomReceiptDatePickerOpen(false);
        break;
      case "Last Month":
        selectedDate = new Date(today.setMonth(today.getMonth() - 1));
        setReceiptDate(selectedDate);
        setViewReceiptDateOptions(false);
        setIsCustomReceiptDatePickerOpen(false);
        break;
      case "Custom":
        setIsCustomReceiptDatePickerOpen(true);
        break;
    }
  };

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
        return { ...p, qty: numValue };
      }
      return p;
    }));
    updateTracking(activeTrackingRowId, "quantity", numValue);
  };

  useEffect(() => {
    const total =
      (additionalChargesDetails.shipping || 0) +
      (additionalChargesDetails.handling || 0) +
      (additionalChargesDetails.packing || 0) +
      (additionalChargesDetails.service || 0) +
      (additionalChargesDetails.other || 0);
  }, [additionalChargesDetails]);

  const [additionalDiscountPct, setAdditionalDiscountPct] = useState("");
  const [additionalDiscountAmt, setAdditionalDiscountAmt] = useState("");
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [fullyReceived, setFullyReceived] = useState(false);
  const [amountPaid, setAmountPaid] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("draft");
  const [isReadsOnly, setIsReadOnly] = useState(false);

  const handleBack = () => {
    navigate(location?.state?.from || -1);
  }

  // Fetch system settings
  useEffect(() => {
    fetchProductSettings();
  }, []);

  const fetchProductSettings = async () => {
    try {
      const response = await api.get("/api/system-settings");
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          brand: data.brand || false,
          category: data.category || false,
          subcategory: data.subcategory || false,
          itembarcode: data.itembarcode || false,
          hsn: data.hsn || false,
          lotno: data.lotno || false,
          serialno: data.serialno || false,
          variants: {
            size: data.variants?.size || false,
            color: data.variants?.color || false,
          },
          units: data.units || false,
          expiry: data.expiry || false,
        });
      }
    } catch (error) {
      // toast.error("Failed to fetch system settings");
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch system settings",
      );
    }
  };

  // Fetch tax settings
  useEffect(() => {
    const loadTaxSettings = async () => {
      try {
        const response = await api.get("/api/tax-gst-settings");
        if (response.data.success) {
          const data = response.data.data;
          setTaxSettings({
            enableGSTBilling: data.enableGSTBilling !== false,
            priceIncludeGST: data.priceIncludeGST !== false,
            defaultGSTRate: data.defaultGSTRate || "18",
            autoRoundOff: data.autoRoundOff || "0",
          });
        }
      } catch (error) {
        // console.error("Error fetching tax settings:", error);
        toast.error(
          error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Error fetching tax settings:",
        );
      }
    };
    loadTaxSettings();
  }, []);

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
        //   variantId: ref?._id || "",
        //   lotNumber: ref?.lotNumber || "",
        //   modelNo: ref?.modelNo || "",
        //   expiryDate: ref?.expiryDate ? String(ref.expiryDate).split("T")[0] : "",
        //   manufacturingDate: ref?.manufacturingDate ? String(ref.manufacturingDate).split("T")[0] : "",
        //   warrantyType: ref?.warrantyType || "",
        //   warrantyPeriod: ref?.warrantyPeriod || "",
        //   coverageScope: ref?.coverageScope || "",
        //   serviceMode: ref?.serviceMode || "",
        //   maxClaimsAllowed: ref?.maxClaimsAllowed || "",
        //   inspectionRequired: ref?.inspectionRequired || false,
        //   warrantyStartsFrom: ref?.warrantyStartsFrom || "",
        //   linkedto: ref?.linkedto || "Manufacturer Warranty",
        //   extensionPeriod: ref?.extensionPeriod || "",
        //   coverageType: ref?.coverageType || "",
        //   extendedWarrantyPrice: ref?.extendedWarrantyPrice || "",
        //   lifetimeDefination: ref?.lifetimeDefination || "",
        //   coverageOf: ref?.coverageOf || "",
        //   whatNotCovered: ref?.whatNotCovered || "",
        //   maxClaims: ref?.maxClaims || "",
        //   replacementOnceOnly: ref?.replacementOnceOnly || false,
        //   availableSerialNumbers: ref?.serialNumbers || [],
        //   selectedSerialNos: [],
        //   isModified: false,
        // };
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

  // Generate invoice number
  // useEffect(() => {
  //   const generateInvoiceNumber = () => {
  //     const prefix = "PO";
  //     const date = new Date();
  //     const year = date.getFullYear();
  //     const month = String(date.getMonth() + 1).padStart(2, "0");
  //     const sequence = Math.floor(Math.random() * 1000)
  //       .toString()
  //       .padStart(3, "0");
  //     return `${prefix}${year}${month}${sequence}`;
  //   };
  //   setInvoiceNo(generateInvoiceNumber());
  // }, []);

  // Fetch suppliers for search
  useEffect(() => {
    if (isFromNavbar) {
      fetchSuppliersForSearch();
    }
  }, [isFromNavbar]);

  const fetchSuppliersForSearch = async () => {
    try {
      const params = {}
      const response = await api.get("/api/suppliers/active-suppliers", { params });
      if (response.data && Array.isArray(response.data.suppliers)) {
        setAllSuppliers(response.data.suppliers || []);
        setFilteredSuppliers(response.data.suppliers);
      } else {
        setAllSuppliers([]);
        setFilteredSuppliers([]);
      }
    } catch (error) {
      // console.error("Error fetching suppliers:", error);
      // toast.error("Failed to load suppliers");
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load suppliers",
      );
    }
  };

  // Handle supplier search
  useEffect(() => {
    if (!supplierSearch.trim() && !phoneSearch.trim()) {
      setFilteredSuppliers(allSuppliers);
      return;
    }
    const filtered = allSuppliers.filter((sup) => {
      const nameMatch = supplierSearch.trim()
        ? sup.name?.toLowerCase().includes(supplierSearch.toLowerCase())
        : false;
      const phoneMatch = phoneSearch.trim()
        ? sup.phone?.includes(phoneSearch)
        : false;
      const emailMatch = supplierSearch.trim()
        ? sup.email?.toLowerCase().includes(supplierSearch.toLowerCase())
        : false;
      return nameMatch || phoneMatch || emailMatch;
    });
    setFilteredSuppliers(filtered);
  }, [supplierSearch, phoneSearch, allSuppliers]);

  // Click outside handler for supplier dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const supplierContainers = document.querySelectorAll(
        ".supplier-search-container",
      );
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSupplierDropdown]);

  // Handle supplier select
  const handleSupplierSelect = (selectedSupplier) => {
    const addressParts = [];

    // Check different possible address structures
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
    if (
      selectedSupplier.state &&
      !addressParts.includes(selectedSupplier.state)
    )
      addressParts.push(selectedSupplier.state);
    if (
      selectedSupplier.country &&
      !addressParts.includes(selectedSupplier.country)
    )
      addressParts.push(selectedSupplier.country);
    if (
      selectedSupplier.pincode &&
      !addressParts.includes(selectedSupplier.pincode)
    )
      addressParts.push(selectedSupplier.pincode);
    setSupplier({
      name: selectedSupplier.name || "",
      phone: selectedSupplier.phone || "",
      address: addressParts.join(", "),
      email: selectedSupplier.email || "",
      gstin: selectedSupplier.gstin || "",
      supplierId: selectedSupplier._id,
    });
    setSupplierSearch(selectedSupplier.name || "");
    setPhoneSearch(selectedSupplier.phone || "");
    setShowSupplierDropdown(false);
  };

  // Handle new supplier creation
  const handleNewSupplierCreated = (newSupplier) => {
    fetchSuppliersForSearch();
    handleSupplierSelect(newSupplier);
    toast.success("Supplier created successfully!");
  };

  // Clear selected supplier
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

  // Fetch supplier and products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (supplierId) {
          const supplierRes = await api.get(`/api/suppliers/${supplierId}`);
          const s = supplierRes.data;
          const addressParts = [];
          if (s.address) {
            if (typeof s.address === "string") {
              addressParts.push(s.address);
            } else if (typeof s.address === "object") {
              if (s.address.addressLine)
                addressParts.push(s.address.addressLine);
              if (s.address.city) addressParts.push(s.address.city);
              if (s.address.state) addressParts.push(s.address.state);
              if (s.address.country) addressParts.push(s.address.country);
              if (s.address.pincode) addressParts.push(s.address.pincode);
            }
          }
          setSupplier({
            name: s.supplierName || "",
            phone: s.phone || "",
            address: [
              s.address?.addressLine,
              s.address?.city,
              s.address?.state,
              s.address?.pincode,
            ]
              .filter(Boolean)
              .join(", "),
            email: s.email || "",
            gstin: s.gstin || "",
            supplierId: s._id,
          });
          setSupplierSearch(s.supplierName || "");
          setPhoneSearch(s.phone || "");
        }

        const productsRes = await api.get("/api/products?limit=1000");
        setProductLoading(true);
        const fetchedProducts = productsRes.data.products || productsRes.data;
        setAllProducts(fetchedProducts);
        setProductOptions(
          fetchedProducts.map((p) => ({
            value: p._id,
            label: p.productName,
            price: p.purchasePrice || 0,
            taxRate: parseFloat(p.tax?.match(/\d+/)?.[0]) || 0,
            unit: p.unit || "Piece",
            hsnCode: p.hsn?.hsnCode || "",
            taxType: p.tax || "GST 0%",
            discountAmount: p.discountAmount || 0,
            discountType: p.discountType || "Percentage",
            imageUrl: p.images?.[0]?.url || "",
            stock: p.stockQuantity || 0,
          })),
        );

        if (!hasAddedInitialProduct.current && products.length === 0) {
          addProductRow({ focus: false });
          hasAddedInitialProduct.current = true;
        }
      } catch (error) {
        // console.error("Data fetch error:", err);
        // toast.error("Failed to load data");
        toast.error(
          error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load data",
        );
      } finally {
        setLoading(false);
        setProductLoading(false);
      }
    };
    loadData();
  }, [supplierId]);

  // Initialize search data
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

  // Handle click outside search dropdowns
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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-add new product row
  useEffect(() => {
    if (isReadOnly) return;
    const lastProduct = products[products.length - 1];
    if (
      lastProduct &&
      lastProduct.itemName &&
      lastProduct.itemName.trim() !== ""
    ) {
      const timer = setTimeout(() => {
        const hasEmptyRow = products.some(
          (p) => !p.itemName || p.itemName.trim() === "",
        );
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

  // Handle click outside for date picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        viewManageRef.current &&
        !viewManageRef.current.contains(event.target)
      ) {
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleViewManage = () => setViewManageOptions(true);
  const handleViewChargeOptions = () => setViewChargeOptions((prev) => !prev);
  // Handle click outside for modals
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Fetch company data
  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      setCompanyData(res.data.data);
    } catch (error) {
      // console.error("Error fetching company profile:", error);
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load company profile",
      );
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      setBanks(res.data.data);
    } catch (error) {
      // console.error("Error fetching bank details:", error);
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load bank details",
      );
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
    } catch (error) {
      // console.error("Error fetching notes & terms settings:", error);
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load notes & terms settings",
      );
    }
  };

  const fetchPrintTemplate = async () => {
    try {
      const res = await api.get("/api/print-templates", {
        params: { type: "normal", includeData: false },
      });
      if (res.data.success && res.data.data) {
        setTemplate(res.data.data.template);
      }
    } catch (error) {
      // console.error("Error fetching print template", error);
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load print template",
      );
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchPrintTemplate();
    fetchSettings();
    fetchBanks();
  }, []);

  // Add these computed values
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
    const serials = popupSelectedVariant?.serialNumbers;
    if (!Array.isArray(serials)) return [];
    return serials.filter(Boolean).map((s) => String(s));
  }, [popupSelectedVariant]);

  const popupIsSerialized = popupVariantSerials.length > 0;

  const popupVariantImages = useMemo(() => {
    const imgs = popupSelectedVariant?.images?.length > 0
      ? popupSelectedVariant.images
      : popupSelectedProduct?.images || [];
    if (!imgs || imgs.length === 0) return [ProductDefaultImage];
    return imgs.map((img) => img?.url || img);
  }, [popupSelectedProduct, popupSelectedVariant]);

  const popupAvailableQty = useMemo(() => {
    if (!popupSelectedProduct) return 0;
    return getVariantAvailableQuantity(popupSelectedProduct, popupSelectedVariant);
  }, [popupSelectedProduct, popupSelectedVariant]);

  const popupDisplayPrice = useMemo(() => {
    if (!popupSelectedProduct) return 0;
    const sellingPrice = Number(popupSelectedVariant?.purchasePrice ?? popupSelectedProduct?.purchasePrice ?? 0);
    const tax = Number(popupSelectedVariant?.tax ?? popupSelectedProduct?.tax ?? 0);
    if (taxSettings?.priceIncludeGST) {
      return sellingPrice + (sellingPrice * tax) / 100;
    }
    return sellingPrice;
  }, [popupSelectedProduct, popupSelectedVariant, taxSettings]);

  // Get unique colors and sizes from variants
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
    return popupSelectedProduct.variants.map(v => v.lotNumber).filter(Boolean);
  }, [popupSelectedProduct]);

  const increasePopupQty = () => {
    if (!popupSelectedProduct) return;
    if (popupIsSerialized) return;
    if (popupSelectedQty < Number(popupAvailableQty || 0)) {
      setPopupSelectedQty((prev) => prev + 1);
    }
  };

  const decreasePopupQty = () => {
    if (popupIsSerialized) return;
    if (popupSelectedQty > 1) {
      setPopupSelectedQty((prev) => prev - 1);
    }
  };

  const closeProductPopups = () => {
    setPopupMode(null);
    setPopupSelectedProduct(null);
    setShowVariantPopup(false);
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
    if (popupVariantSerials.length > 1 && !popupSelectedSerialno) {
      toast.error("Please select serial number");
      return;
    }
    const serialToUse = popupVariantSerials.length === 1 ? popupVariantSerials[0] : popupSelectedSerialno;
    const qtyToAdd = popupIsSerialized ? 1 : Math.min(Number(popupSelectedQty || 1), availableQty);

    addVariantToRow({
      productId: popupSelectedProduct._id,
      productName: popupSelectedProduct.productName,
      description: popupSelectedProduct.description || "",
      variant: popupSelectedVariant,
      quantity: qtyToAdd,
      selectedColor: popupSelectedColor,
      selectedSize: popupSelectedSize,
      selectedSerialno: serialToUse
    });

    closeProductPopups();
    focusNextProductRowInput();
  };

  // const getSelectedProductIds = (excludeRowId) => {
  //   return products
  //     .filter(p => p.id !== excludeRowId && p.productId)
  //     .map(p => p.productId);
  // };

  const getSelectedProductIds = (excludeRowId) => {
    const selectedRows = products.filter(p => p.id !== excludeRowId && p.productId);

    // Group selected rows by productId
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
      const hasMultipleVariants = variantsCount > 1;

      if (!hasMultipleVariants) {
        // Non-variant: exclude once selected
        idsToExclude.push(productId);
      } else {
        // Variant product: exclude only if all variants are selected
        if (rows.length >= variantsCount) {
          idsToExclude.push(productId);
        }
      }
    });

    return idsToExclude;
  };

  // Handle search
  const handleSearch = (e, rowId) => {
    const term = e.target.value;
    const normalized = String(term || "").trim();
    const alreadySelectedIds = getSelectedProductIds(rowId);
    const digits = normalized.replace(/\\D/g, "").slice(0, 13);
    if (digits.length === 13 && !/[a-z]/i.test(normalized)) {
      const matched = (allProducts || []).find((p) => {
        const code = String(
          p?.itemBarcode || p?.itemBarCode || p?.itembarcode || "",
        ).replace(/\\D/g, "");
        return code === digits;
      });
      if (matched) {
        handleProductSelect(matched, rowId);
        return;
      }
    }
    const filtered = allProducts.filter(
      (p) => {
        if (alreadySelectedIds.includes(p._id)) return false;
        return (
          !alreadySelectedIds.includes(p._id) &&
          (p.productName?.toLowerCase().includes(term.toLowerCase()) ||
            String(p.itemBarcode || p.itemBarCode || p.itembarcode || "")
              .toLowerCase()
              .includes(term.toLowerCase()))
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

  // Handle product selection with duplicate check
  // const handleProductSelect = (product, rowId) => {
  //   const availableStock = product.stockQuantity || 0;
  //   if (availableStock <= 0) {
  //     toast.error("Product is out of stock");
  //     return;
  //   }

  //   // Check if this product is already in the products array (excluding current row)
  //   const existingProductIndex = products.findIndex(
  //     (p) => p.productId === product._id && p.id !== rowId,
  //   );

  //   if (existingProductIndex !== -1) {
  //     // If product already exists in another row, increase quantity of that row
  //     const existingRow = products[existingProductIndex];
  //     const currentQty = parseFloat(existingRow.qty) || 0;

  //     // Ensure we don't exceed available stock
  //     if (currentQty >= availableStock) {
  //       toast.error(`Cannot exceed available stock of ${availableStock}`);
  //       return;
  //     }

  //     const newQty = currentQty + 1;

  //     setProducts((prev) =>
  //       prev.map((p, idx) => {
  //         if (idx === existingProductIndex) {
  //           return {
  //             ...p,
  //             qty: newQty,
  //           };
  //         }
  //         return p;
  //       }),
  //     );

  //     // Update calculations for the existing row
  //     updateProduct(products[existingProductIndex].id, "qty", newQty);

  //     // Remove the current empty row
  //     removeProductRow(rowId);

  //     // Update search data for the removed row
  //     setSearchData((prev) => {
  //       const newData = { ...prev };
  //       delete newData[rowId];
  //       return newData;
  //     });

  //     setActiveSearchId(null);
  //     setTimeout(() => focusNextProductRowInput(), 0);
  //     setTimeout(() => focusNextProductRowInput(), 650);
  //     return;
  //   }

  //   // If product doesn't exist, proceed with normal selection
  //   const defaultTaxRate = taxSettings.defaultGSTRate || "0";
  //   const productTaxRate = parseFloat(product.tax?.match(/\d+/)?.[0]);
  //   const finalTaxRate = productTaxRate || parseFloat(defaultTaxRate);

  //   updateProduct(rowId, "productId", product._id);
  //   updateProduct(rowId, "stock", availableStock);
  //   updateProduct(rowId, "itemName", product.productName);
  //   updateProduct(rowId, "name", product.productName);
  //   updateProduct(rowId, "unitPrice", product.purchasePrice || 0);
  //   updateProduct(rowId, "taxRate", finalTaxRate);
  //   updateProduct(rowId, "taxType", product.tax || `GST${finalTaxRate}%`);
  //   updateProduct(rowId, "unit", product.unit || "Piece");
  //   updateProduct(rowId, "hsnCode", product.hsn?.hsnCode || "");
  //   updateProduct(rowId, "qty", 1);

  //   setSearchData((prev) => ({
  //     ...prev,
  //     [rowId]: {
  //       term: product.productName || product.itemBarCode,
  //       filtered: [],
  //       isOpen: false,
  //     },
  //   }));

  //   setActiveSearchId(null);
  //   setTimeout(() => focusNextProductRowInput(), 0);
  //   setTimeout(() => focusNextProductRowInput(), 650);
  // };

  const handleProductSelect = (product, rowId) => {
    const exactProduct = allProducts.find((p) => p._id === product._id);
    if (!exactProduct) {
      toast.error("Product not found");
      return;
    }

    const variantsCount = Array.isArray(exactProduct?.variants) ? exactProduct.variants.length : 0;
    const hasMultipleVariants = variantsCount > 1;

    if (hasMultipleVariants) {
      setPopupSelectedProduct(exactProduct);
      setPopupSelectedQty(1);
      setPopupActiveImageIndex(0);
      const firstVariant = exactProduct?.variants?.[0] || null;
      setPopupSelectedColor(firstVariant?.color || "");
      setPopupSelectedSize(firstVariant?.size || "");
      const firstSerials = Array.isArray(firstVariant?.serialNumbers) ? firstVariant.serialNumbers.filter(Boolean) : [];
      setPopupSelectedSerialno(firstSerials.length === 1 ? firstSerials[0] : "");
      setPopupMode("variant");
      setShowVariantPopup(true);
      return;
    }

    // Rest of your existing handleProductSelect logic for single products
    const availableStock = exactProduct.stockQuantity || 0;

    // if (availableStock <= 0) {
    //   toast.error("Product is out of stock");
    //   return;
    // }

    // Check if this product is already in the products array
    const existingProductIndex = products.findIndex(
      (p) => p.productId === exactProduct._id && p.id !== rowId,
    );

    if (existingProductIndex !== -1) {
      const existingRow = products[existingProductIndex];
      const currentQty = parseFloat(existingRow.qty) || 0;

      if (currentQty >= availableStock) {
        toast.error(`Cannot exceed available stock of ${availableStock}`);
        return;
      }

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
      setTimeout(() => focusNextProductRowInput(), 0);
      setTimeout(() => focusNextProductRowInput(), 650);
      return;
    }

    const defaultTaxRate = taxSettings.defaultGSTRate || "0";
    const productTaxRate = parseFloat(exactProduct.tax?.match(/\d+/)?.[0]);
    const finalTaxRate = productTaxRate || parseFloat(defaultTaxRate);

    updateProduct(rowId, "productId", exactProduct._id);
    updateProduct(rowId, "stock", availableStock);
    updateProduct(rowId, "itemName", exactProduct.productName);
    updateProduct(rowId, "name", exactProduct.productName);
    updateProduct(rowId, "unitPrice", exactProduct.purchasePrice || 0);
    updateProduct(rowId, "taxRate", finalTaxRate);
    updateProduct(rowId, "taxType", exactProduct.tax || `GST${finalTaxRate}%`);
    updateProduct(rowId, "unit", exactProduct.unit || "Piece");
    updateProduct(rowId, "hsnCode", exactProduct.hsn?.hsnCode || "");
    updateProduct(rowId, "qty", 1);

    setSearchData((prev) => ({
      ...prev,
      [rowId]: {
        term: exactProduct.productName,
        filtered: [],
        isOpen: false,
      },
    }));

    setActiveSearchId(null);
    setTimeout(() => focusNextProductRowInput(), 0);
    setTimeout(() => focusNextProductRowInput(), 650);
  };

  // for pos start
  const addVariantToRow = (productInfo) => {
    const { productId, description, variant, quantity, selectedColor, selectedSize, selectedSerialno } = productInfo;

    // Create a unique identifier for this variant
    const variantKey = `${productId}-${selectedColor || ''}-${selectedSize || ''}-${selectedSerialno || ''}`;

    // Check if this variant already exists in the products array
    const existingProductIndex = products.findIndex(p => {
      if (!p.productId || p.productId === "") return false;
      const existingKey = `${p.productId}-${p.selectedColor || ''}-${p.selectedSize || ''}-${(p.selectedSerialNos || []).join(',') || ''}`;
      return existingKey === variantKey;
    });

    if (existingProductIndex !== -1) {
      // Product with same variant exists, increase quantity
      const existingRow = products[existingProductIndex];
      const currentQty = parseFloat(existingRow.qty) || 0;
      const availableStock = variant.stockQuantity || 0;

      // if (currentQty + quantity > availableStock) {
      //   toast.error(`Cannot exceed available stock of ${availableStock}`);
      //   return;
      // }

      const newQty = currentQty + quantity;

      setProducts((prev) =>
        prev.map((p, idx) => {
          if (idx === existingProductIndex) {
            return {
              ...p,
              qty: newQty,
            };
          }
          return p;
        })
      );

      updateProduct(products[existingProductIndex].id, "qty", newQty);
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

    // Update the row with variant info
    updateProduct(targetRowId, "productId", productId);
    updateProduct(targetRowId, "itemName", `${productName}${selectedColor ? ` (${selectedColor})` : ""}${selectedSize ? ` / ${selectedSize}` : ""}`);
    updateProduct(targetRowId, "name", `${productName}${selectedColor ? ` (${selectedColor})` : ""}${selectedSize ? ` / ${selectedSize}` : ""}`);
    updateProduct(targetRowId, "description", description);
    updateProduct(targetRowId, "unitPrice", variant.purchasePrice || variant.sellingPrice);
    updateProduct(targetRowId, "taxRate", parseFloat(variant.tax) || 0);
    updateProduct(targetRowId, "taxType", variant.taxType || `GST ${variant.tax || 0}%`);
    updateProduct(targetRowId, "unit", variant.unit);
    updateProduct(targetRowId, "qty", quantity);
    updateProduct(targetRowId, "stock", variant.stockQuantity);
    updateProduct(targetRowId, "lotNumber", variant.lotNumber || "");
    updateProduct(targetRowId, "selectedSerialNos", selectedSerialno ? [selectedSerialno] : []);
    updateProduct(targetRowId, "selectedColor", selectedColor || "");
    updateProduct(targetRowId, "selectedSize", selectedSize || "");

    if (variant.discountAmount) {
      if (variant.discountType === "Percentage") {
        updateProduct(targetRowId, "discountPct", variant.discountAmount);
      } else {
        updateProduct(targetRowId, "discountAmt", variant.discountAmount);
      }
    }

    setActiveSearchId(null);
    setShowVariantPopup(false);
    setPopupSelectedProduct(null);
    setTimeout(() => focusNextProductRowInput(), 100);
  };

  // for pos end
  const addProductRow = ({ focus = false } = {}) => {
    if (isReadOnly) return;
    const newId = Date.now() + Math.random();
    if (focus) pendingFocusRowIdRef.current = newId;
    const currentlySelectedIds = products
      .filter(p => p.productId)
      .map(p => p.productId);
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
        selectedColor: "",  // Add this
        selectedSize: "",   // Add this
        selectedSerialNos: [], // Add this
        lotNumber: "",      // Add this
        description: "",    // Add this
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
          if (value === "") {
            updated.qty = "";
            return updated;
          }
          const numValue = parseFloat(value);
          if (isNaN(numValue)) {
            updated.qty = "";
            return updated;
          }
          const availableStock = parseFloat(updated.stock) || 0;

          if (numValue < 1) {
            updated.qty = numValue; // Don't force to 1
          }
          // else if (numValue > availableStock && availableStock > 0) {
          //   updated.qty = availableStock;
          //   toast.error(`Cannot exceed available stock of ${availableStock}`);
          // }
          else {
            updated.qty = numValue;
          }
        } else {
          updated[field] = value;
        }

        if (field === "productId") {
          updated.productId = value;
          const selected = productOptions.find((opt) => opt.value === value);
          if (selected) {
            let discountPct = 0;
            let discountAmt = 0;

            if (selected.discountType === "Percentage") {
              discountPct = parseFloat(
                (selected.discountAmount || 0).toFixed(2),
              );
            } else if (selected.discountType === "Fixed") {
              discountAmt = selected.discountAmount || 0;
              if (selected.price > 0) {
                discountPct = parseFloat(
                  ((discountAmt / selected.price) * 100).toFixed(2),
                );
              }
            }

            updated = {
              ...updated,
              itemName: selected.label,
              name: selected.label,
              unitPrice: selected.price,
              taxRate: selected.taxRate,
              taxType: selected.taxType,
              unit: selected.unit,
              hsnCode: selected.hsnCode,
              qty: 1,
              stock: selected.stock || 0,
              discountPct: discountPct,
              discountAmt: discountAmt,
            };
          }
        }

        if (field === "discountPct") {
          const pctValue = parseFloat(value) || 0;
          updated.discountPct = pctValue;
        } else if (field === "discountAmt") {
          const amtValue = parseFloat(value) || 0;
          updated.discountAmt = amtValue;
        }

        // Recalculate line
        const qty = parseFloat(updated.qty) || 1;
        let unitPrice = parseFloat(updated.unitPrice) || 0;
        const baseAmount = qty * unitPrice;

        let discAmt = 0;
        let discPct = 0;

        if (
          field === "discountAmt" &&
          value !== "" &&
          !isNaN(parseFloat(value))
        ) {
          discAmt = parseFloat(parseFloat(value).toFixed(2)) || 0;
          discAmt = Math.min(discAmt, baseAmount);
          discPct =
            baseAmount > 0
              ? parseFloat(((discAmt / baseAmount) * 100).toFixed(2))
              : 0;
          updated.discountPct = discPct;
          updated.discountAmt = discAmt;
        } else if (
          field === "discountPct" &&
          value !== "" &&
          !isNaN(parseFloat(value))
        ) {
          discPct = parseFloat(parseFloat(value).toFixed(2)) || 0;
          discAmt = parseFloat(((baseAmount * discPct) / 100).toFixed(2));
          discAmt = Math.min(discAmt, baseAmount);
          updated.discountPct = discPct;
          updated.discountAmt = discAmt;
        } else {
          discPct = parseFloat(parseFloat(updated.discountPct || 0).toFixed(2));
          discAmt = parseFloat(((baseAmount * discPct) / 100).toFixed(2));
          discAmt = Math.min(discAmt, baseAmount);
          updated.discountPct = discPct;
          updated.discountAmt = discAmt;
        }

        const taxableAmount = Math.max(baseAmount - discAmt, 0);
        const taxRate = parseFloat(updated.taxRate) || 0;
        const taxAmount = taxSettings.enableGSTBilling
          ? parseFloat(((taxableAmount * taxRate) / 100).toFixed(2))
          : 0;
        updated.taxAmount = taxAmount;

        let finalAmount = taxableAmount;
        if (taxSettings.enableGSTBilling) {
          finalAmount += taxAmount;
        }
        updated.amount = parseFloat(finalAmount.toFixed(2));

        return updated;
      }),
    );
  };

  // Calculate totals
  const subtotal = products.reduce((sum, p) => {
    const qty = parseFloat(p.qty) || 0;
    const unitPrice = parseFloat(p.unitPrice) || 0;
    return sum + qty * unitPrice;
  }, 0);

  const totalTax = taxSettings.enableGSTBilling
    ? products.reduce((sum, p) => sum + (p.taxAmount || 0), 0)
    : 0;

  const itemsDiscount = products.reduce(
    (sum, p) => sum + (p.discountAmt || 0),
    0,
  );

  const additionalChargesTotal = Object.values(additionalChargesDetails).reduce(
    (sum, charge) => sum + parseFloat(charge || 0),
    0,
  );

  const additionalDiscountValue =
    additionalDiscountType === "Percentage" && additionalDiscountPct
      ? (subtotal * parseFloat(additionalDiscountPct)) / 100
      : additionalDiscountType === "Fixed" && additionalDiscountAmt
        ? parseFloat(additionalDiscountAmt) || 0
        : 0;

  const totalDiscount = itemsDiscount + additionalDiscountValue;

  const grandTotalBefore =
    subtotal + totalTax + additionalChargesTotal - totalDiscount;

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

  // Update amount paid when fully received
  useEffect(() => {
    if (fullyReceived) {
      setAmountPaid(grandTotal.toFixed(2));
    }
  }, [fullyReceived, grandTotal]);
  const amountDue = Math.max(0, grandTotal - (parseFloat(amountPaid) || 0));

  // Handle file upload
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
  // Handle charge selection
  const handleChargeSelect = (chargeType) => {
    setSelectedChargeType(chargeType);
    setViewChargeOptions(false);
  };

  const handleChargeDone = () => {
    if (chargeAmount && selectedChargeType) {
      const chargeKey = selectedChargeType.toLowerCase().replace(" charge", "");
      const validChargeKeys = [
        "shipping",
        "handling",
        "packing",
        "service",
        "other",
      ];
      if (validChargeKeys.includes(chargeKey)) {
        setAdditionalChargesDetails((prev) => {
          const updated = {
            ...prev,
            [chargeKey]: parseFloat(chargeAmount) || 0,
          };
          return updated;
        });
        setChargeAmount("");
        setSelectedChargeType("");
        setViewChargeOptions(false);
      }
    }
  };

  // Handle date selection
  const handleDateSelect = (option) => {
    const today = new Date();
    let selectedDate = new Date();

    switch (option) {
      case "Today":
        selectedDate = today;
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Yesterday":
        selectedDate = new Date(today.setDate(today.getDate() - 1));
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last Week":
        selectedDate = new Date(today.setDate(today.getDate() - 7));
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last 15 Days":
        selectedDate = new Date(today.setDate(today.getDate() - 15));
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last Month":
        selectedDate = new Date(today.setMonth(today.getMonth() - 1));
        setInvoiceDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Custom":
        setIsDatePickerOpen(true);
        break;
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (isFromNavbar) {
      if (!supplier.supplierId) {
        newErrors.supplierName = "Please select a supplier";
      }
    } else {
      if (!supplier.name.trim()) {
        newErrors.supplierName = "Supplier name is required";
      }
    }

    if (!supplier.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(supplier.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    // if (!supplier.address.trim()) {
    //   newErrors.address = "Address is required";
    // }

    if (products.length === 0) {
      newErrors.products = "At least one product is required";
    }

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };
  const validateProductsBeforeSave = () => {
    const invalidProducts = products.filter((p) => {
      // Check if product is selected (has productId) but quantity is 0 or empty
      if (p.productId && (!p.qty || parseFloat(p.qty) === 0)) {
        return true;
      }
      return false;
    });

    if (invalidProducts.length > 0) {
      const productNames = invalidProducts
        .map((p) => p.itemName || "Selected product")
        .join(", ");
      toast.error(`Please set quantity for: ${productNames}`);
      return false;
    }

    return true;
  };

  // Load purchase order data for edit
  useEffect(() => {
    const loadPurchaseOrderData = () => {
      if (editPurchaseOrderData) {
        populateFormWithPurchaseOrderData(editPurchaseOrderData);
        if (isViewMode) {
          setIsReadOnly(true);
          toast.info("Viewing purchase order");
        } else {
          setIsReadOnly(false);
          toast.info("Editing purchase order - You can modify and save changes");
        }
      }
    };

    if (editPurchaseOrderData && !hasAddedInitialProduct.current) {
      loadPurchaseOrderData();
    }
  }, [editPurchaseOrderData]);

  const populateFormWithPurchaseOrderData = (purchaseOrder) => {
    // Set original status for tracking
    setOriginalStatus(purchaseOrder.status);

    if (!isReorderMode) {
      setOriginalStatus(purchaseOrder.status);
    }
    // Load supplier data
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
        supplierId: supplierData._id,
      });
      setSupplierSearch(supplierData.supplierName || supplierData.name || "");
      setPhoneSearch(supplierData.phone || "");
    }

    // Set purchase order basic info
    if (purchaseOrder.purchaseDate) setInvoiceDate(new Date(purchaseOrder.purchaseDate));
    if (!isReorderMode && purchaseOrder.purchaseNo) {
      setInvoiceNo(purchaseOrder.purchaseNo);
    }
    if (!isReorderMode && purchaseOrder.status) {
      setStatus(purchaseOrder.status);
    }
    if (purchaseOrder.purchaseNo) setInvoiceNo(purchaseOrder.purchaseNo);
    if (purchaseOrder.status) setStatus(purchaseOrder.status);
    setReferenceNo(purchaseOrder.referenceNo || "");
    setReceiptDate(purchaseOrder.receiptDate ? new Date(purchaseOrder.receiptDate) : null);

    // Set billing address if available
    if (purchaseOrder.billingAddress) {
      setSupplier(prev => ({ ...prev, address: purchaseOrder.billingAddress }));
    }

    // Load items
    if (purchaseOrder.items && purchaseOrder.items.length > 0) {
      const loadedProducts = purchaseOrder.items.map((item, index) => ({
        id: Date.now() + index + Math.random(),
        productId: item.productId?._id || item.productId,
        itemName: item.itemName,
        name: item.itemName,
        qty: item.qty,
        unit: item.unit,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxType: item.taxType,
        taxAmount: item.taxAmount,
        discountPct: item.discountPct,
        discountAmt: item.discountAmt,
        amount: item.amount,
        hsnCode: item.hsn,
        description: item.description || "",
        lotNumber: item.lotNumber || "",
        selectedSerialNos: item.selectedSerialNos || [],
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        serialno: item.serialno || "",
        stock: item.productId?.stockQuantity || 0,
      }));
      setProducts(loadedProducts);
      hasAddedInitialProduct.current = true;
    }


    // Set additional discount
    if (purchaseOrder.additionalDiscount) {
      if (purchaseOrder.additionalDiscount.pct > 0) {
        setAdditionalDiscountType("Percentage");
        setAdditionalDiscountPct(purchaseOrder.additionalDiscount.pct);
      } else if (purchaseOrder.additionalDiscount.amt > 0) {
        setAdditionalDiscountType("Fixed");
        setAdditionalDiscountAmt(purchaseOrder.additionalDiscount.amt);
      }
    }

    // Set additional charges
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

    // Set payment info
    if (purchaseOrder.grandTotal) {
      if (isReorderMode) {
        setAmountPaid("0");
        setFullyReceived(false);
      } else {
        setAmountPaid(purchaseOrder.paidAmount?.toString() || "");
        setFullyReceived(purchaseOrder.fullyReceived || false);
      }
    }

    // Set attachments if any
    if (purchaseOrder.attachments && purchaseOrder.attachments.length > 0) {
      const images = purchaseOrder.attachments.map(att => ({
        file: null,
        preview: att.url,
        filename: att.filename,
        existing: true,
        url: att.url,
        public_id: att.public_id
      }));
      setUploadedImages(images);
    }

    // Set round off
    if (purchaseOrder.autoRoundOff !== undefined) {
      setAutoRoundOff(purchaseOrder.autoRoundOff);
    }
  };

  // Handle form submission
  const handleSubmit = async (shouldPrint = false) => {
    // Check if editing a completed order
    if (isEditMode && originalStatus === "received") {
      toast.error("Cannot edit an approved purchase order");
      return;
    }
    if (!supplier.supplierId) {
      toast.error("Please select a supplier first");
      return;
    }

    if (isSubmitting) {
      return;
    }

    const { isValid, errors } = validateForm();
    if (!isValid) {
      const firstErrorKey = Object.keys(errors)[0];
      toast.error(errors[firstErrorKey]);
      return;
    }

    const nonEmptyProducts = products.filter(
      (p) =>
        p.productId &&
        p.productId.trim() !== "" &&
        p.itemName &&
        p.itemName.trim() !== "",
    );

    if (nonEmptyProducts.length !== products.length) {
      setProducts(nonEmptyProducts);
    }

    if (nonEmptyProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }
    if (!validateProductsBeforeSave()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
       if (isConvertFromGRN && grnData?._id) {
      formData.append("_isConvertFromGRN", "true");
      formData.append("grnId", grnData._id);
      formData.append("mode", "convert-from-grn");
    }

      // Basic Info
      formData.append("supplierId", supplier.supplierId);
      formData.append("purchaseDate", invoiceDate.toISOString());
      formData.append(
        "dueDate",
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      );
      formData.append("referenceNo", referenceNo);
      formData.append("receiptDate", receiptDate ? receiptDate.toISOString() : "");
      formData.append("billingAddress", supplier.address);
      formData.append("shippingAddress", supplier.address);
      formData.append("subtotal", subtotal);
      formData.append("totalTax", totalTax);
      formData.append("totalDiscount", totalDiscount);
      formData.append("additionalCharges", additionalChargesTotal);
      formData.append("autoRoundOff", autoRoundOff);
      formData.append("grandTotal", grandTotal);
      formData.append("paidAmount", parseFloat(amountPaid) || 0);
      formData.append("fullyReceived", fullyReceived);
      formData.append("paymentMethod", "bank_transfer");
      formData.append(
        "status",
        fullyReceived || (parseFloat(amountPaid) || 0) >= grandTotal
          ? "received"
          : "converted",
      );
      formData.append("notes", "");
      formData.append("termsAndConditions", "");

      formData.append(
        "additionalDiscount[pct]",
        parseFloat(additionalDiscountPct) || 0,
      );
      formData.append(
        "additionalDiscount[amt]",
        parseFloat(additionalDiscountAmt) || 0,
      );

      formData.append(
        "additionalChargesDetails[shipping]",
        additionalChargesDetails.shipping,
      );
      formData.append(
        "additionalChargesDetails[handling]",
        additionalChargesDetails.handling,
      );
      formData.append(
        "additionalChargesDetails[packing]",
        additionalChargesDetails.packing,
      );
      formData.append(
        "additionalChargesDetails[service]",
        additionalChargesDetails.service,
      );
      formData.append(
        "additionalChargesDetails[other]",
        additionalChargesDetails.other,
      );

      formData.append(
        "taxSettings[enableGSTBilling]",
        taxSettings.enableGSTBilling,
      );
      formData.append(
        "taxSettings[priceIncludeGST]",
        taxSettings.priceIncludeGST,
      );
      formData.append("taxSettings[autoRoundOff]", taxSettings.autoRoundOff);
      formData.append(
        "taxSettings[defaultGSTRate]",
        taxSettings.defaultGSTRate,
      );

      nonEmptyProducts.forEach((p, index) => {
        const tracking = trackingByRowId[p.id] || {};

        formData.append(`items[${index}][productId]`, p.productId);
        formData.append(`items[${index}][itemName]`, p.itemName || p.name);
        formData.append(`items[${index}][hsnCode]`, p.hsnCode || "");
        formData.append(`items[${index}][qty]`, parseFloat(p.qty));
        formData.append(`items[${index}][unit]`, p.unit);
        formData.append(`items[${index}][unitPrice]`, parseFloat(p.unitPrice));
        formData.append(`items[${index}][taxType]`, `GST ${p.taxRate}%`);
        formData.append(`items[${index}][taxRate]`, p.taxRate);
        formData.append(`items[${index}][taxAmount]`, p.taxAmount);
        formData.append(`items[${index}][discountPct]`, parseFloat(p.discountPct) || 0);
        formData.append(`items[${index}][discountAmt]`, p.discountAmt);
        formData.append(`items[${index}][amount]`, p.amount);

        // ===== ADD TRACKING FIELDS =====
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
        // formData.append(`items[${index}][selectedSerialNos]`, JSON.stringify(tracking.selectedSerialNos || []));
        formData.append(`items[${index}][selectedColor]`, p.selectedColor || "");
        formData.append(`items[${index}][selectedSize]`, p.selectedSize || "");

         const serialNos = tracking.selectedSerialNos || [];
    // Filter out empty values and ensure it's a proper array
    const cleanSerialNos = Array.isArray(serialNos) 
      ? serialNos.filter(s => s !== "" && s !== null && s !== undefined)
      : [];
    formData.append(`items[${index}][selectedSerialNos]`, JSON.stringify(cleanSerialNos));

        if (settings.serialno) {
          formData.append(`items[${index}][serialno]`, p.serialno || "");
        }
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
      const existingPurchaseOrderId = editPurchaseOrderData?._id;


      // ✅ Reorder mode - ALWAYS create new
      if (isReorderMode) {
        response = await api.post("/api/purchase", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Purchase reordered successfully!");
      }
      // ✅ FIX: Check if we're converting from PO - always create new
      else if (isConvertFromPO) {
        response = await api.post("/api/purchase", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Purchase created successfully from Purchase Order!");
      }
      // ✅ FIX: Check if we're converting from GRN - always create new
      else if (isConvertFromGRN) {
        response = await api.post("/api/purchase", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Purchase created successfully from GRN!");
      }
      // ✅ FIX: Check if we're editing an existing purchase
      else if (isEditMode && existingPurchaseOrderId) {
        response = await api.put(`/api/purchase/${existingPurchaseOrderId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Purchase updated successfully!");
      }
      // ✅ FIX: Create new purchase
      else {
        response = await api.post("/api/purchase", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Purchase created successfully!");
      }

      if (response.data.success) {
        const newPurchaseId = response.data.purchase._id;

        if (response.data.purchase.purchaseNo) {
          setInvoiceNo(response.data.purchase.purchaseNo);
        }

        if (shouldPrint) {
          navigate(`/skeleton?redirect=/purchase-preview/${newPurchaseId}`);
        } else {
          navigate("/skeleton?redirect=/purchase-list");
        }
      } else {
        toast.error(response.data.error || "Operation failed");
      }
    } catch (error) {
      console.error("Purchase operation failed:", error);
      toast.error(
        error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Operation failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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

  if (loading) return <div>Loading...</div>;

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
                {/* {isViewMode ? "View Purchase" : (isEditMode ? "Edit Purchase" : "Create Purchase")} */}
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
                            {isFromNavbar && !supplier.supplierId && (
                              <FiSearch
                                style={{
                                  color: "#666",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                }}
                                onClick={() => setShowSupplierDropdown(true)}
                              />
                            )}
                            <input
                              type="text"
                              placeholder={
                                isFromNavbar && !isConvertFromGRN
                                  ? "Search by name..."
                                  : "Enter Name"
                              }
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: isReadOnly ? "default" : (isFromNavbar ? "pointer" : "text"),
                              }}
                              value={
                                isFromNavbar ? supplierSearch : supplier.name
                              }
                              onChange={(e) => {
                                if (isReadOnly) return;
                                if (isFromNavbar) {
                                  setSupplierSearch(e.target.value);
                                  setPhoneSearch("");
                                  setShowSupplierDropdown(true);
                                } else {
                                  setSupplier({
                                    ...supplier,
                                    name: e.target.value,
                                  });
                                }
                              }}
                              onFocus={() => {
                                if (isReadOnly) return;
                                if (isFromNavbar) setShowSupplierDropdown(true);
                              }}
                              readOnly={isFromNavbar && supplier.supplierId}
                              disabled={isReadOnly}
                            />
                          </div>

                          {!isReadOnly && isFromNavbar && (
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

                          {!isReadOnly && isFromNavbar && showSupplierDropdown && (
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
                              {filteredSuppliers.length === 0 ? (
                                <div
                                  style={{
                                    padding: "12px",
                                    color: "#666",
                                    textAlign: "center",
                                  }}
                                >
                                  {supplierSearch.trim() ||
                                    phoneSearch.trim() ? (
                                    <>
                                      No suppliers found
                                      {supplierSearch.trim() &&
                                        ` for name: "${supplierSearch}"`}
                                      {phoneSearch.trim() &&
                                        ` for phone: "${phoneSearch}"`}
                                      <div style={{ marginTop: "8px" }}>
                                        <button
                                          onClick={() => {
                                            setOpenAddModal(true);
                                            setShowSupplierDropdown(false);
                                          }}
                                          style={{
                                            padding: "6px 12px",
                                            backgroundColor: "#1F7FFF",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                          }}
                                        >
                                          + Add New Supplier
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    "Start typing to search suppliers"
                                  )}
                                </div>
                              ) : (
                                <>
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
                                    {supplierSearch.trim() &&
                                      ` for name: "${supplierSearch}"`}
                                    {phoneSearch.trim() &&
                                      ` for phone: "${phoneSearch}"`}
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
                                      (e.currentTarget.style.backgroundColor =
                                        "#f8f9fa")
                                      }
                                      onMouseLeave={(e) =>
                                      (e.currentTarget.style.backgroundColor =
                                        "white")
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
                                        {sup.name?.charAt(0).toUpperCase() ||
                                          "S"}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "500" }}>
                                          {sup.name}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            color: "#666",
                                          }}
                                        >
                                          {sup.phone || "No phone"} • ✉️{" "}
                                          {sup.email || "No email"}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
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
                            <img src={indialogo} alt="india-logo" />
                            <span
                              style={{ color: "black", padding: "0px 10px" }}
                            >
                              +91
                            </span>
                          </div>
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {isFromNavbar && !supplier.supplierId && (
                              <FiSearch
                                style={{
                                  color: "#666",
                                  cursor: "pointer",
                                  fontSize: "16px",
                                }}
                                onClick={() => setShowSupplierDropdown(true)}
                              />
                            )}
                            <input
                              type="text"
                              placeholder={
                                isFromNavbar && !isConvertFromGRN
                                  ? "Search by phone..."
                                  : "Enter Supplier No"
                              }
                              style={{
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: isReadOnly ? "default" : (isFromNavbar ? "pointer" : "text"),
                              }}
                              value={
                                isFromNavbar ? phoneSearch : supplier.phone
                              }
                              onChange={(e) => {
                                if (isReadOnly) return;
                                const value = e.target.value.replace(/\D/g, "");
                                if (isFromNavbar) {
                                  setPhoneSearch(value);
                                  setSupplierSearch("");
                                  setShowSupplierDropdown(true);
                                } else {
                                  setSupplier({ ...supplier, phone: value });
                                }
                              }}
                              onFocus={() => {
                                if (isReadOnly) return;
                                if (isFromNavbar) setShowSupplierDropdown(true)
                              }}
                              readOnly={isReadOnly && isFromNavbar && supplier.supplierId}
                              disabled={isReadOnly}
                              maxLength="10"
                            />
                          </div>
                        </div>
                        {errors.phone && (
                          <div
                            style={{
                              color: "red",
                              fontSize: "12px",
                              marginTop: "4px",
                            }}
                          >
                            {errors.phone}
                          </div>
                        )}
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
                            backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                          }}
                          value={supplier.address}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            setSupplier({
                              ...supplier,
                              address: e.target.value,
                            })
                          }}
                        ></textarea>
                      </div>
                      {errors.address && (
                        <div
                          style={{
                            color: "red",
                            fontSize: "12px",
                            marginTop: "4px",
                          }}
                        >
                          {errors.address}
                        </div>
                      )}
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
                            Purchase Date
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
                              cursor: "pointer",
                              background: isReadOnly ? "#f5f5f5" : "#fff",
                            }}
                            onClick={() => !isReadOnly && handleViewManage()}
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
                                      onClick={() => handleDateSelect(option)}
                                    >
                                      <span style={{ color: "black" }}>
                                        {option}
                                      </span>
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
                                  calendarClassName="custom-calendar"
                                />
                                <div
                                  style={{
                                    textAlign: "center",
                                    marginTop: "10px",
                                  }}
                                >
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
                            {/* <div
                              style={{
                                color: "var(--Black-Black, #0E101A)",
                                fontSize: 14,
                                fontFamily: "Inter",
                                fontWeight: "400",
                                lineHeight: 16.8,
                                wordWrap: "break-word",
                              }}
                            >
                              {invoiceNo}
                            </div> */}
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

                        {/* reference number and receipt date start*/}
                        <div style={{ position: "relative", width: 160 }}>
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
                            Reference No.
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
                              placeholder="Enter Reference No."
                              value={referenceNo}
                              onChange={(e) => setReferenceNo(e.target.value)}
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                background: "transparent",
                              }}
                            />
                          </div>
                        </div>

                        {/* Receipt Date */}
                        <div ref={receiptDateRef} style={{ position: "relative", width: 200 }}>
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
                            Receipt Date
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
                  {!isReadOnly && (
                    <div
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
                      // onClick={() => setViewInvoiceOptions(true)}
                      onClick={() => {
                        // Focus on the first product search input
                        if (productSearchInputRef.current) {
                          productSearchInputRef.current.focus();
                        } else {
                          // If the ref is not set, try to find the input by data attribute
                          const firstProductInput = document.querySelector('input[data-row-id]');
                          if (firstProductInput) {
                            firstProductInput.focus();
                          }
                        }
                      }}
                    >
                      <CiBarcode className="fs-4" />
                    </div>
                  )}
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
                    {/* <div
                      style={{
                        width: 200,
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
                        Discount
                      </div>
                    </div>
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
                          borderBottom:
                            "1px var(--White-Stroke, #EAEAEA) solid",
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
                                value={
                                  p.itemName || searchData[p.id]?.term || ""
                                }
                                onChange={(e) => {
                                  if (isReadOnly) return;
                                  handleSearch(e, p.id);
                                  openDropdown(p.id);
                                }}
                                onKeyDown={(e) => {
                                  if (isReadOnly) return;
                                  if (e.key !== "Enter") return;
                                  const raw = e.currentTarget.value;
                                  const normalized = String(raw || "").trim();
                                  const digits = normalized
                                    .replace(/\\D/g, "")
                                    .slice(0, 13);
                                  if (
                                    digits.length === 13 &&
                                    !/[a-z]/i.test(normalized)
                                  ) {
                                    const matched = (allProducts || []).find(
                                      (prod) => {
                                        const code = String(
                                          prod?.itemBarcode ||
                                          prod?.itemBarCode ||
                                          prod?.itembarcode ||
                                          "",
                                        ).replace(/\\D/g, "");
                                        return code === digits;
                                      },
                                    );
                                    if (matched) {
                                      handleProductSelect(matched, p.id);
                                      e.preventDefault();
                                      return;
                                    }
                                  }
                                  const first = (searchData[p.id]?.filtered ||
                                    [])[0];
                                  if (first) {
                                    handleProductSelect(first, p.id);
                                    e.preventDefault();
                                  }
                                }}
                                // onFocus={() => {
                                //   openDropdown(p.id);
                                //   setSearchData((prev) => ({
                                //     ...prev,
                                //     [p.id]: {
                                //       ...prev[p.id],
                                //       isOpen: true,
                                //       filtered: allProducts,
                                //     },
                                //   }));
                                // }}
                                onFocus={() => {
                                  if (isReadOnly) return;
                                  // Close all dropdowns first to force clean re-render
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
                                readOnly={isReadOnly}
                              />

                              {searchData[p.id]?.isOpen && !isReadOnly && (
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
                                      {
                                        (searchData[p.id]?.filtered || [])
                                          .length
                                      }{" "}
                                      product(s) found
                                      {searchData[p.id]?.term &&
                                        ` for "${searchData[p.id]?.term}"`}
                                    </span>
                                  </div>

                                  {(searchData[p.id]?.filtered || []).length ===
                                    0 ? (
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
                                    (searchData[p.id]?.filtered || []).map(
                                      (product) => (
                                        <div
                                          key={product._id}
                                          onClick={() =>
                                            handleProductSelect(product, p.id)
                                          }
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
                                          (e.currentTarget.style.backgroundColor =
                                            "#f8f9fa")
                                          }
                                          onMouseLeave={(e) =>
                                          (e.currentTarget.style.backgroundColor =
                                            "#fff")
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
                                                <FaBarcode />{" "}
                                                {product.itemBarcode}
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
                                                HSN:{" "}
                                                {product.hsn?.hsnCode || ""}
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
                                                ₹
                                                {product.purchasePrice ||
                                                  product.price ||
                                                  0}
                                              </div>
                                              <div
                                                style={{
                                                  fontSize: "12px",
                                                  color:
                                                    product.stockQuantity <= 0
                                                      ? "#ef4444"
                                                      : "#6b7280",
                                                  fontWeight: "500",
                                                }}
                                              >
                                                Stock:{" "}
                                                {product.stockQuantity || 0}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                            {!isReadOnly && (
                              <div style={{ marginLeft: "8px" }}>
                                <button
                                  onClick={() => {
                                    setActiveTrackingRowId(p.id);
                                    setShowBatchPopup(true);
                                  }}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#1f7fff",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    padding: "4px 8px",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  + Manage Tracking
                                </button>
                              </div>
                            )}
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
                                max={p.stock || ""}
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
                                  const rawValue = e.target.value;
                                  if (rawValue === "") {
                                    updateProduct(p.id, "qty", "");
                                  } else {
                                    const numValue = parseFloat(rawValue);
                                    if (!isNaN(numValue)) {
                                      updateProduct(
                                        p.id,
                                        "qty",
                                        Math.max(1, numValue),
                                      );
                                    }
                                  }
                                }}
                                readOnly={isReadOnly}
                                onBlur={(e) => {
                                  if (
                                    !e.target.value ||
                                    parseFloat(e.target.value) < 1
                                  ) {
                                    updateProduct(p.id, "qty", 1);
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
                                    }}
                                    value={p.serialno || ""}
                                    onChange={(e) =>
                                      updateProduct(
                                        p.id,
                                        "serialno",
                                        e.target.value,
                                      )
                                    }
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
                                  updateProduct(
                                    p.id,
                                    "unitPrice",
                                    e.target.value,
                                  )
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
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                  color: taxSettings.enableGSTBilling
                                    ? "inherit"
                                    : "#A2A8B8",
                                  cursor: "default",
                                }}
                                value={`${p.taxRate}%`}
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
                                type="number"
                                className={`table-input ${!taxSettings.enableGSTBilling ? "table-input-disabled" : ""}`}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  outline: "none",
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                  color: taxSettings.enableGSTBilling
                                    ? "inherit"
                                    : "#A2A8B8",
                                  cursor: "default",
                                }}
                                value={p.taxAmount.toFixed(2)}
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

                            {/* <div
                              style={{
                                width: 200,
                                alignSelf: "stretch",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 4,
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  flex: "1 1 0%",
                                  alignSelf: "stretch",
                                  position: "relative",
                                  background: "white",
                                  overflow: "hidden",
                                  borderRadius: 4,
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  outlineOffset: "-1px",
                                }}
                              >
                                <div
                                  style={{
                                    left: 1,
                                    top: 10,
                                    position: "absolute",
                                    color: "var(--Black-Primary, #0E101A)",
                                    fontSize: 14,
                                    fontFamily: "Inter",
                                    fontWeight: "400",
                                    lineHeight: "16.80px",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  <input
                                    type="number"
                                    placeholder="0.00"
                                    style={{
                                      width: "100%",
                                      border: "none",
                                      outline: "none",
                                      padding: "0px 10px",
                                    }}
                                    value={p.discountPct || ""}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? ""
                                          : parseFloat(e.target.value) || 0;
                                      updateProduct(p.id, "discountPct", value);
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    width: 25,
                                    paddingRight: 4,
                                    left: 73,
                                    top: 1,
                                    position: "absolute",
                                    background: "var(--Spinning-Frame, #E9F0F4)",
                                    outline: "1px var(--Stroke, #C2C9D1) solid",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "inline-flex",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 1,
                                      height: 38,
                                      opacity: 0,
                                      background: "var(--Stroke, #C2C9D1)",
                                    }}
                                  />
                                  <div
                                    style={{
                                      color: "var(--Black-Secondary, #6C748C)",
                                      fontSize: 14,
                                      fontFamily: "Poppins",
                                      fontWeight: "400",
                                      lineHeight: "16.80px",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    %
                                  </div>
                                </div>
                              </div>

                              <div
                                style={{
                                  flex: "1 1 0%",
                                  alignSelf: "stretch",
                                  position: "relative",
                                  background: "white",
                                  overflow: "hidden",
                                  borderRadius: 4,
                                  outline: "1px var(--Stroke, #EAEAEA) solid",
                                  outlineOffset: "-1px",
                                }}
                              >
                                <div
                                  style={{
                                    left: 1,
                                    top: 10,
                                    position: "absolute",
                                    color: "var(--Black-Primary, #0E101A)",
                                    fontSize: 14,
                                    fontFamily: "Inter",
                                    fontWeight: "400",
                                    lineHeight: "16.80px",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  <input
                                    type="number"
                                    placeholder="0.00"
                                    style={{
                                      width: "100%",
                                      border: "none",
                                      outline: "none",
                                      padding: "0px 10px",
                                    }}
                                    value={p.discountAmt || ""}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? ""
                                          : parseFloat(e.target.value) || 0;
                                      updateProduct(p.id, "discountAmt", value);
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    width: 25,
                                    paddingRight: 4,
                                    left: 73,
                                    top: 1,
                                    position: "absolute",
                                    background:
                                      "var(--Spinning-Frame, #E9F0F4)",
                                    outline: "1px var(--Stroke, #C2C9D1) solid",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "inline-flex",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 1,
                                      height: 38,
                                      opacity: 0,
                                      background: "var(--Stroke, #C2C9D1)",
                                    }}
                                  />
                                  <div
                                    style={{
                                      color: "var(--Black-Secondary, #6C748C)",
                                      fontSize: 14,
                                      fontFamily: "Poppins",
                                      fontWeight: "400",
                                      lineHeight: "16.80px",
                                      wordWrap: "break-word",
                                    }}
                                  >
                                    ₹
                                  </div>
                                </div>
                              </div>
                            </div>

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
                                  backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
                                }}
                                value={p.amount.toFixed(2)}
                                readOnly={isReadOnly}
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
                  <div style={{ marginBottom: "24px", width: "50%" }}>
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
                            value={
                              additionalDiscountType === "Percentage"
                                ? additionalDiscountPct || ""
                                : additionalDiscountType === "Fixed"
                                  ? additionalDiscountAmt || ""
                                  : ""
                            }
                            onChange={(e) => {
                              if (isReadOnly) return;
                              const value = e.target.value;
                              const numValue = parseFloat(value);

                              if (additionalDiscountType === "Percentage") {
                                setAdditionalDiscountPct(
                                  value === "" ? "" : numValue,
                                );
                                if (
                                  value !== "" &&
                                  !isNaN(numValue) &&
                                  subtotal > 0
                                ) {
                                  const fixedValue =
                                    (subtotal * numValue) / 100;
                                  setAdditionalDiscountAmt(fixedValue);
                                } else {
                                  setAdditionalDiscountAmt("");
                                }
                              } else if (additionalDiscountType === "Fixed") {
                                setAdditionalDiscountAmt(
                                  value === "" ? "" : numValue,
                                );
                                if (
                                  value !== "" &&
                                  !isNaN(numValue) &&
                                  subtotal > 0
                                ) {
                                  const pctValue = (numValue / subtotal) * 100;
                                  setAdditionalDiscountPct(pctValue);
                                } else {
                                  setAdditionalDiscountPct("");
                                }
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
                              backgroundColor: isReadOnly ? "#f5f5f5" : "transparent",
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
                              <option value="Fixed">₹</option>
                              <option value="Percentage">%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

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
                      {Object.entries(additionalChargesDetails).some(
                        ([_, value]) => value > 0,
                      ) && (
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
                                  <span
                                    style={{
                                      fontWeight: "500",
                                      textTransform: "capitalize",
                                    }}
                                  >
                                    {key}:
                                  </span>
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
                        ref={chargeRef}
                      >
                        <div style={{ padding: "10px 12px", fontSize: "14px" }}>
                          ₹
                        </div>

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
                              const formattedValue =
                                parts[0] + "." + parts.slice(1).join("");
                              setChargeAmount(formattedValue);
                            } else {
                              setChargeAmount(numericValue);
                            }
                          }}
                          onKeyPress={(e) => {
                            if (!/[0-9.]/.test(e.key)) {
                              e.preventDefault();
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
                          onClick={handleViewChargeOptions}
                        >
                          {selectedChargeType
                            ? selectedChargeType.replace("charge", "")
                            : "Select Charge"}{" "}
                          <FiChevronDown />
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
                              {[
                                "Shipping Charge",
                                "Handling Charge",
                                "Packing Charge",
                                "Service Charge",
                                "Other Charge",
                              ].map((charge) => (
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
                                  className="button-action"
                                  onClick={() => handleChargeSelect(charge)}
                                  onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "#f8f9fa")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "white")
                                  }
                                >
                                  <span style={{ color: "black" }}>
                                    {charge}
                                  </span>
                                  {selectedChargeType === charge && (
                                    <span
                                      style={{
                                        color: "#1F7FFF",
                                        fontSize: "12px",
                                      }}
                                    >
                                      Selected
                                    </span>
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
                      {!isReadOnly && (
                        <button
                          onClick={handleChargeDone}
                          disabled={!chargeAmount || !selectedChargeType}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            borderRadius: "20px",
                            background:
                              chargeAmount && selectedChargeType
                                ? "#fff"
                                : "#f0f0f0",
                            border: "1px solid #d1d5db",
                            color:
                              chargeAmount && selectedChargeType
                                ? "#2563eb"
                                : "#9ca3af",
                            marginTop: "25px",
                            cursor:
                              chargeAmount && selectedChargeType
                                ? "pointer"
                                : "not-allowed",
                          }}
                        >
                          Add Charge
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Upload Images */}
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

                    {/* Display uploaded files */}
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
                          <a
                            key={index}
                            href={file.url || file.preview}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: "none" }}
                          >
                            <div key={index} style={{ position: "relative", width: "80px", cursor: "pointer" }}>
                              {file.url ? (
                                file.type?.startsWith('image/') || file.fileExt === 'jpg' || file.fileExt === 'png' || file.fileExt === 'jpeg' || file.fileExt === 'gif' ? (
                                  <img
                                    src={file.url}
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
                                    {file.filename?.toLowerCase().includes('pdf') ? (
                                      <span style={{ fontSize: "30px" }}>📄</span>
                                    ) : file.filename?.toLowerCase().includes('xlsx') || file.filename?.toLowerCase().includes('xls') ? (
                                      <span style={{ fontSize: "30px" }}>📊</span>
                                    ) : file.filename?.toLowerCase().includes('csv') ? (
                                      <span style={{ fontSize: "30px" }}>📋</span>
                                    ) : file.filename?.toLowerCase().includes('doc') ? (
                                      <span style={{ fontSize: "30px" }}>📝</span>
                                    ) : (
                                      <span style={{ fontSize: "30px" }}>📎</span>
                                    )}
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
                                )
                              ) : (
                                file.type?.startsWith('image/') ? (
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
                                    {file.filename?.toLowerCase().includes('pdf') ? (
                                      <span style={{ fontSize: "30px" }}>📄</span>
                                    ) : file.filename?.toLowerCase().includes('xlsx') || file.filename?.toLowerCase().includes('xls') ? (
                                      <span style={{ fontSize: "30px" }}>📊</span>
                                    ) : file.filename?.toLowerCase().includes('csv') ? (
                                      <span style={{ fontSize: "30px" }}>📋</span>
                                    ) : file.filename?.toLowerCase().includes('doc') ? (
                                      <span style={{ fontSize: "30px" }}>📝</span>
                                    ) : (
                                      <span style={{ fontSize: "30px" }}>📎</span>
                                    )}
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
                                )
                              )}

                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setUploadedAttachments((prev) => prev.filter((_, i) => i !== index));
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
                          </a>
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
                      <span style={{ color: "#A2A8B8" }}>
                        ₹{totalTax.toFixed(2)}
                      </span>
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
                    <span style={{ color: "#9ca3af" }}>
                      ₹{itemsDiscount.toFixed(2)}
                    </span>
                  </div> */}

                  {/* <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>
                      Additional Discount :
                    </span>
                    <span style={{ color: "#9ca3af" }}>
                      ₹{additionalDiscountValue.toFixed(2)}
                    </span>
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
                      {Object.entries(additionalChargesDetails).some(
                        ([_, value]) => value > 0,
                      ) && (
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
                    <span style={{ color: "#9ca3af" }}>
                      ₹{additionalChargesTotal.toFixed(2)}
                    </span>
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
                      checked={
                        taxSettings.autoRoundOff !== "0" &&
                        taxSettings.enableGSTBilling
                      }
                      onChange={(e) => {
                        toast.info(
                          "Auto Round-off is controlled from tax setting page",
                        );
                      }}
                      disabled
                    />
                    <span>Auto Round-off</span>
                    <span style={{ marginLeft: "auto" }}>
                      {roundOffAdded >= 0 ? "+" : "-"} ₹
                      {Math.abs(roundOffAdded).toFixed(2)}
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
                      style={{ accentColor: "#ffffffff" }}
                      checked={fullyReceived}
                      onChange={(e) => {
                        if (isReadOnly) return;
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
            </div>
          </div>
        </div>

        {/* Add Supplier Modal */}
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

        {/* Preview Modal */}
        {viewInvoiceOptions && (
          <PreviewPurchaseOrder
            isOpen={viewInvoiceOptions}
            onClose={() => setViewInvoiceOptions(false)}
            orderData={{
              purchaseNo: invoiceNo,  // ✅ Fixed (or rename state variable)
              purchaseDate: invoiceDate,  // ✅ Fixed
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              items: products,
              subtotal,
              totalTax,
              totalDiscount,
              additionalCharges: additionalChargesTotal,
              grandTotal,
              paidAmount: amountPaid,
              taxSettings,
            }}
            supplierData={{
              name: supplier.name,
              address: supplier.address,
              phone: supplier.phone,
              email: supplier.email,
              gstin: supplier.gstin,
            }}
            companyData={companyData}
          />
        )}
        {/* variants selection popup */}
        {showVariantPopup && popupMode && popupSelectedProduct && (
          <ProductPopup
            selectedProduct={popupSelectedProduct}
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
            selectedQty={popupSelectedQty}
            availableQty={popupAvailableQty}
            increaseQty={increasePopupQty}
            decreaseQty={decreasePopupQty}
            disableQty={popupIsSerialized}
            onClose={closeProductPopups}
            price={popupDisplayPrice}
            mrp={popupSelectedVariant?.mrp ?? null}
            unit={popupSelectedVariant?.unit ?? popupSelectedProduct?.unit}
            expiryText={getExpiryDisplayText(popupSelectedVariant?.expiryDate)}
            onPrimaryClick={handleAddProductFromPopup}
          />
        )}
        {/* batch popup */}
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
                        value={products.find(p => p.id === activeTrackingRowId)?.qty || 0}
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

                {/* Warranty Sections - Copy from ConvertGRNVerificationForm */}
                {trackingByRowId[activeTrackingRowId]?.warrantyType === "Manufacturing" && (
                  <div style={{ borderTop: "1px solid #EAEAEA", paddingTop: "16px", marginTop: "8px" }}>
                    {/* Manufacturing warranty details - copy from your ConvertGRNVerificationForm */}
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
        {/* serial */}
        {/* SERIAL POPUP */}
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
                    background: "#1F7FFF",
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

export default CreatePurchase;
