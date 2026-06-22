import React, { useEffect, useRef, useState, useMemo, useLayoutEffect, } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";

// pages
import "./pos.css";
import "react-toastify/dist/ReactToastify.css";
import barcodeDetector from "../../utils/barcodeDetector";
import PosTransaction from "./PosTransaction";
import CreateDamageModal from "../../../src/components/features/inventory/Damage&Return/CreateDamageModal";
import api from "../../pages/config/axiosInstance";
import PosCouponModel from "./PosCouponModel";
import PosFilterProductModel from "./PosFilterProductModel";
import PosSortByModel from "./PosSortByModel";
import { useAuth } from "../../components/auth/AuthContext";
import PosCustomerlist from "./PosCustomerlist";
import Calculator from "./Calculator";
import PosReturn from "./PosReturn";

import {
  printThermalBill,
  connectQZ,
} from "../../utils/qzTray";
//icons
import { RiDeleteBinLine, RiArrowUpWideLine, RiArrowDownWideLine, RiArrowDropDownLine, RiArrowDropUpLine, RiListView } from "react-icons/ri";
import { IoIosSearch, IoIosArrowBack, IoIosArrowForward, IoMdAddCircleOutline, IoIosList, IoIosCheckmark, } from "react-icons/io";
import { MdBarcodeReader, MdCircle, MdKeyboardArrowRight, MdOutlineArrowRightAlt, MdOutlineCalculate, MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowRight, MdOutlineStopCircle, MdPrint, MdQrCodeScanner, } from "react-icons/md";
import { PiBagThin, PiHandPalm, PiLineVertical, PiNotepad, PiShoppingBagThin, } from "react-icons/pi";
import { LiaFilterSolid, LiaShoppingBagSolid } from "react-icons/lia";
import { MdOutlineSort } from "react-icons/md";
import { AiOutlineDownload } from "react-icons/ai";
import { IoMdAdd } from "react-icons/io";
import { RxCross2, RxCrossCircled, RxDashboard } from "react-icons/rx";
import { FiX, FiChevronDown, FiMinus, FiPlus } from "react-icons/fi";
import { FaArrowLeft, FaBarcode, FaFileImport, FaArrowRightLong } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";

//images
import Upi from "../../assets/img/upi.png";
import Banks from "../../assets/img/banks.png";
import EmptyBag from "../../assets/images/pos-cart-img.png";
import no_customer from "../../assets/images/no-customer.png";
import cash_icon from "../../assets/images/cash-icon.png";
import upi_icon from "../../assets/images/upi-icon.png";
import card_icon from "../../assets/images/card-icon.png";
import split_icon from "../../assets/images/split-icon.png";
import PaymentDone from '../../assets/img/payment-done.png';
import DEFAULT_PRODUCT_IMAGE from "../../assets/images/product-default.png";

const DEFAULT_PRODUCT_FILTERS = { categoryId: "", brandIds: [], stockStatus: "", priceMin: null, priceMax: null, productTypes: [], taxRate: null, };

const Pos = () => {
  const { user: authUser } = useAuth();
  const userData = authUser;
  const fileSelectRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [companyImages, setCompanyImages] = useState(null);
  const [newSales, setNewSales] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [applycoinpopup, setApplycoinpopup] = useState(false);
  const [pointsToApply, setPointsToApply] = useState("");
  const [applyFull, setApplyFull] = useState(false);
  const [appliedPoints, setAppliedPoints] = useState(0);
  const [proceedToPay, setProceedToPay] = useState(false);
  const [showPriceBreakup, setShowPriceBreakup] = useState(false);
  const [files, setFiles] = useState([]);
  const [popupMode, setPopupMode] = useState(null);
  const [popupSelectedProduct, setPopupSelectedProduct] = useState(null);
  const [popupSelectedColor, setPopupSelectedColor] = useState("");
  const [popupSelectedSize, setPopupSelectedSize] = useState("");
  const [popupSelectedSerialnos, setPopupSelectedSerialnos] = useState([]);
  const [popupEditCartItemId, setPopupEditCartItemId] = useState(null);
  const [popupSelectedQty, setPopupSelectedQty] = useState(1);
  const [popupActiveImageIndex, setPopupActiveImageIndex] = useState(0);
  const [showQtyPopup, setShowQtyPopup] = useState(false);
  const [openCashier, setOpenCashier] = useState(false);
  const cashierRef = useRef(null);
  const [showFilterProductsModel, setShowFilterProductsModel] = useState(false);
  const [showSortByModel, setShowSortByModel] = useState(false);
  const filterDropdownRef = useRef(null);
  const sortByDropdownRef = useRef(null);
  const [productSortKey, setProductSortKey] = useState("");
  const [appliedProductFilters, setAppliedProductFilters] = useState(DEFAULT_PRODUCT_FILTERS,);
  const [draftProductFilters, setDraftProductFilters] = useState(DEFAULT_PRODUCT_FILTERS,);
  const scrollTopRef = useRef(0);
  const [showExtraCharges, setShowExtraCharges] = useState(false);
  const [showPosCouponModel, setShowPosCouponModel] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [productCardView, setProductCardView] = useState("standard");
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [searchdrop, setSearchDrop] = useState(false);
  const [categoryValue, setCategoryValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchProduct, setSearchProduct] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const searchProductRef = useRef(null);
  const scrollRef = useRef(null);
  const [showTransactionPopup, setShowTransactionPopup] = useState(false);
  const [showDamageReportModel, setDamageReportModel] = useState(false);
  const onClose = () => { setShowPaymentPopup(false); };
  const handleScroll = () => { scrollTopRef.current = scrollRef.current.scrollTop; };
  useLayoutEffect(() => { if (scrollRef.current) { scrollRef.current.scrollTop = scrollTopRef.current; } });
  const [showPosCustomerlistModel, setShowPosCustomerlistModel] = useState(false);
  const [showCalculatorModel, setCalculatorModel] = useState(false);
  const [showReturnModel, setReturnModel] = useState(false);
  const searchInputRef = useRef(null);
  const [printerName, setPrinterName] = useState(
    localStorage.getItem("printerName") || ""
  );
  const focusSearchInput = () => {
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    const triggerBackgroundDaemonTunnel = async () => {
      try {
        await connectQZ();
        console.log("Background printing pipeline primed.");
      } catch (err) {
        console.warn("Silent hardware link is currently sleeping or offline.");
      }
    };
    triggerBackgroundDaemonTunnel();
  }, []);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    focusSearchInput();
  }, [productCardView]);

  useEffect(() => {
    if (!showFilterProductsModel) return;
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setShowFilterProductsModel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilterProductsModel]);

  useEffect(() => {
    if (!showSortByModel) return;
    const handleClickOutside = (e) => {
      if (sortByDropdownRef.current && !sortByDropdownRef.current.contains(e.target)) {
        setShowSortByModel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortByModel]);

  useEffect(() => {
    if (!searchProduct) return;
    const handleClickOutside = (e) => {
      if (searchProductRef.current && !searchProductRef.current.contains(e.target)) {
        setSearchProduct(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchProduct]);

  const startOfDayTime = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  const formatLongDate = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const getExpiryDisplayText = (expiryDate) => {
    if (!expiryDate) return "";
    const expiryTime = startOfDayTime(expiryDate);
    if (!expiryTime) return "";
    const todayTime = startOfDayTime(new Date());
    if (!todayTime) return "";
    const diffDays = Math.ceil((expiryTime - todayTime) / 86400000);
    // if (diffDays < 0) return `Expired: on ${formatLongDate(expiryDate)}`;
    if (diffDays < 0) return `Expired`;
    if (diffDays === 0) return "Expire: today";
    if (diffDays === 1) return "Expire: in 1 day";
    return `Expire: in ${diffDays} days`;
  };

  const ProductPopup = ({ selectedProduct, productImages, activeImageIndex, setActiveImageIndex, productColors, selectedColor, setSelectedColor, productSizes, selectedSize, setSelectedSize, productSerialno, selectedSerialnos, setSelectedSerialnos, productLot, setLot, setSelectedLot, selectedQty, availableQty, increaseQty, decreaseQty, disableQty, onClose, price, mrp, unit, expiryText, mode = "details", onPrimaryClick, primaryLabel, }) => {
    return (
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "451px", background: "white", display: "flex", flexDirection: "column", position: "relative", boxSizing: "border-box", borderRadius: "8px", fontFamily: "Inter", }}>
          <div style={{ backgroundColor: "#F6F9FA", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", borderBottom: "1px solid #EAEAEA", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", }}>
            <label htmlFor="">Choose Variant</label>
            <FiX onClick={onClose} style={{ cursor: "pointer" }} />
          </div>
          <div style={{ padding: "8px 8px" }}>
            <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid #C3C3C3", padding: "8px 0px", }} >
              <span>
                <img alt="Product"
                  src={productImages?.length > 0 ? productImages[Math.min(Math.max(Number(activeImageIndex) || 0, 0), productImages.length - 1,)] : DEFAULT_PRODUCT_IMAGE}
                  onClick={() => {
                    if (!productImages?.length) return;
                    setActiveImageIndex((prev) => (Number(prev || 0) + 1) % productImages.length);
                  }}
                  style={{
                    border: "1px solid #DBDBDB", width: "81px", height: "72px", objectFit: "cover", borderRadius: "4px",
                    cursor: productImages?.length > 1 ? "pointer" : "default",
                  }}
                />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: "4px" }} >
                <label style={{ color: "#0E101A", fontWeight: "500", fontSize: "14px", }} > {selectedProduct?.productName || "Product Name"} </label>
                <label style={{ color: "#8D8D8D", fontSize: "12px", fontWeight: "400", display: "flex", gap: "4px", }} >
                  <span style={{ color: "#8D8D8D" }}>{selectedProduct?.brand?.brandName || "Brand"} • </span>
                  <span style={{ color: "#8D8D8D" }}>{selectedProduct?.category?.categoryName || "Category"} • </span>
                  {availableQty} {unit || selectedProduct?.unit || "Unit"}
                </label>
                <label style={{ color: "#1F7FFF", fontSize: "20px", fontWeight: "500", }}>
                  {" "}₹{price.toFixed(2)} {mrp ? (<del style={{ color: "#8D8D8D", fontSize: "12px", fontWeight: "400", }}>₹{mrp}</del>) : null}
                </label>
                {expiryText && (<label style={{ backgroundColor: expiryText == "Expired" ? "#fbd7d7ff" : "#E6F8FF", border: expiryText == "Expired" ? "1px solid #f85f5fff" : "1px solid #7CDAFF", padding: "2px 6px", borderRadius: "4px", color: expiryText == "Expired" ? "#f91f1fff" : "#005677", fontSize: "10px", fontWeight: "400", width: "120px", height: "20px", textAlign: "center", }} >
                  {expiryText} </label>)}
                {Number(selectedProduct?.warrantyPeriod) > 0 && (<label style={{ backgroundColor: "#E6F8FF", border: "1px solid #7CDAFF", padding: "2px 6px", borderRadius: "4px", color: "#005677", fontSize: "10px", fontWeight: "400", width: "120px", height: "20px", textAlign: "center", }} >
                  {`${selectedProduct?.warrantyPeriod} Month Warranty`} </label>)}
              </span>
            </div>
            <div ref={scrollRef} onScroll={handleScroll}
              style={{ maxHeight: "190px", overflow: "auto", padding: "10px 10px", borderBottom: "1px solid #C3C3C3", display: 'flex', flexDirection: 'column', gap: '11px' }}>
              {/* Color */}
              {productColors?.length != 0 && (<div style={{ display: "flex", flexDirection: "column", gap: '8px', }} >
                <label style={{ color: "#0E101A", fontSize: "12px" }} > Color </label>
                <div style={{ display: "flex", gap: "12px" }}>
                  {productColors.map((color, idx) => {
                    const active = selectedColor === color;
                    return (
                      <button key={idx}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          backgroundColor: color, width: "27px", height: "27px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: "3px", boxSizing: "border-box",
                          border: active ? "3px solid #2F80ED" : "2px solid #E0E0E0",
                        }}
                      > <div style={{
                        backgroundColor: color, width: "100%", height: "100%", borderRadius: "50%",
                        border: color === "white" ? "1px solid #ccc" : "none",
                      }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>)}
              {/* Size */}
              {productSizes?.length != 0 && (<div style={{ display: "flex", flexDirection: "column", gap: "8px", }} >
                <label style={{ color: "#0E101A", fontSize: "12px" }} > Size </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }} >
                  {productSizes.map((size, idx) => {
                    const active = String(selectedSize) === String(size);
                    return (
                      <button key={idx}
                        onClick={() => setSelectedSize(size)}
                        style={{
                          border: "1px solid #EAEAEA", borderRadius: "4px", fontSize: "14px", padding: "1px 6px", cursor: "pointer",
                          color: active ? "white" : "#727681",
                          background: active ? "#2F80ED" : "transparent",
                        }}
                      > {size} </button>
                    );
                  })}
                </div>
                {availableQty > 0 && availableQty < 10 ? (<div style={{ backgroundColor: "#FFE5E5", color: "#B70000", fontSize: "12px", fontWeight: "400", border: "1px solid #B70000", padding: "8px", borderRadius: "4px", width: "100%", marginBottom: "10px", }} >
                  <IoIosCheckmark size={15} /> Only {availableQty} Left
                </div>) : availableQty > 10 && availableQty < 50 ? (<div style={{ backgroundColor: "#FDFFCF", color: "#B77100", fontSize: "12px", fontWeight: "400", border: "1px solid #B77100", padding: "8px", borderRadius: "4px", width: "100%", marginBottom: "10px", }} >
                  <IoIosCheckmark size={15} /> Only {availableQty} Left
                </div>) : (<div style={{ backgroundColor: "#CFFFDE", color: "#0D6828", fontSize: "12px", fontWeight: "400", border: "1px solid #0D6828", padding: "8px", borderRadius: "4px", width: "100%", marginBottom: "10px", }} >
                  <IoIosCheckmark size={15} /> Only {availableQty} Left
                </div>)}
              </div>)}
              {/* Serial No */}
              {productSerialno?.length != 0 && (<div style={{ display: "flex", flexDirection: "column", gap: "8px", }} >
                <label style={{ color: "#0E101A", fontSize: "12px" }}> Serial No. </label>
                {productSerialno.map((serialno, idx) => {
                  const sn = String(serialno);
                  const selected = Array.isArray(selectedSerialnos) && selectedSerialnos.some((s) => String(s) === sn);
                  const maxAllowed = Math.max(Number(selectedQty || 0), 0);
                  const selectedCount = Array.isArray(selectedSerialnos) ? selectedSerialnos.length : 0;
                  const disableUnchecked = !selected && maxAllowed > 0 && selectedCount >= maxAllowed;
                  return (
                    <div key={idx}>
                      <div style={{ width: "100%", border: "1px solid #EAEAEA", padding: "16px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: disableUnchecked ? 0.55 : 1, }} >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px", }} >
                          <input
                            type="checkbox"
                            className="input-radio"
                            checked={selected}
                            disabled={disableUnchecked}
                            onChange={() => {
                              setSelectedSerialnos((prev) => {
                                const arr = Array.isArray(prev) ? prev.map((x) => String(x)) : [];
                                if (arr.includes(sn)) {
                                  return arr.filter((x) => x !== sn);
                                }
                                if (maxAllowed > 0 && arr.length >= maxAllowed) return arr;
                                return [...arr, sn];
                              });
                            }}
                          /> {sn}
                        </span>
                        <span>1 unit</span>
                      </div>
                    </div>
                  );
                })}
              </div>)}
              {/* Batches/Lot No */}
              {productLot?.length != 0 && (<div style={{ display: "flex", flexDirection: "column", gap: "8px", }} >
                <label style={{ color: "#0E101A", fontSize: "12px" }}> Batches / Lot No. </label>
                {productLot.map((lot, idx) => (
                  <div key={idx}>
                    <div style={{ width: "100%", border: "1px solid #EAEAEA", padding: "16px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center", }} >
                      <span style={{ display: "flex", alignItems: "center", gap: "10px", color: "red", }} >
                        <input type="radio" /> Exp: 12 Jul 2027 (Expired)
                      </span> <span>30 units</span>
                    </div>
                  </div>))}
              </div>)}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", }} >
              <label htmlFor="">Quantity</label>
              <div style={{ border: "1px solid #EAEAEA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", }} >
                <button onClick={decreaseQty}
                  disabled={disableQty || selectedQty <= 1}
                  style={{
                    background: "#F8F9FB", border: "1px solid #EAEAEA", padding: "10px", fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px",
                    cursor: disableQty || selectedQty <= 1 ? "not-allowed" : "pointer",
                    opacity: disableQty || selectedQty <= 1 ? 0.6 : 1,
                  }}
                > <FiMinus /> </button>
                <div style={{ fontSize: "12px", fontWeight: 500, color: "#111827", }} >
                  {String(selectedQty).padStart(2, "0")}
                </div>
                <button onClick={increaseQty}
                  disabled={disableQty}
                  style={{
                    background: "#F8F9FB", border: "1px solid #EAEAEA", padding: "10px", fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", borderTopRightRadius: "8px", borderBottomRightRadius: "8px",
                    cursor: disableQty ? "not-allowed" : "pointer",
                    opacity: disableQty ? 0.6 : 1,
                  }}
                > <FiPlus /> </button>
              </div>
            </div>
            <button style={{ backgroundColor: "#1F7FFF", border: "1px solid #0084FF", padding: "12px 20px", color: "white", borderRadius: "4px", width: "100%", }}
              onClick={onPrimaryClick} >
              {primaryLabel || "Add Product"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cashierRef.current && !cashierRef.current.contains(e.target)) {
        setOpenCashier(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStop = () => { window.open("/pos", "_blank"); };

  useEffect(() => {
    return () => { files.forEach((f) => URL.revokeObjectURL(f.preview)); };
  }, [files]);

  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const res = await api.get("/api/companyprofile/get");
        if (res.status === 200) {
          setCompanyImages(res.data.data);
        }
      } catch (error) {
      }
    };
    fetchCompanyDetails();
  }, []);

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
      const byColor = variants.find((v) => normalizeVariantAttr(v?.color) === normalizeVariantAttr(color),);
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

  const buildCartLineId = (productId, variant, color, size) => {
    const vId = variant?._id ? String(variant._id) : "";
    if (vId) return `${productId}:${vId}`;
    const c = normalizeVariantAttr(color) || "na";
    const s = String(size ?? "").trim() || "na";
    return `${productId}:${c}:${s}`;
  };

  const addProductVariantToCart = (product, variant, qtyToAdd = 1, serialnos = []) => {
    if (!product?._id) return;
    const resolvedVariant = variant || getVariantForSelection(product);
    if (!resolvedVariant) return;
    const availableQty = getVariantAvailableQuantity(product, resolvedVariant);
    if (availableQty <= 0) {
      toast.error("Out of stock");
      return;
    }
    const variantSerials = Array.isArray(resolvedVariant?.serialNumbers) ? resolvedVariant.serialNumbers.filter(Boolean).map((s) => String(s)) : [];
    const isSerialized = variantSerials.length > 0;
    const incomingSerials = Array.isArray(serialnos)
      ? serialnos.filter(Boolean).map((s) => String(s).trim()).filter(Boolean)
      : (typeof serialnos === "string" ? [String(serialnos).trim()].filter(Boolean) : []);
    const maxQtyBySerial = isSerialized ? variantSerials.length : Infinity;
    const maxQty = Math.min(Number(availableQty || 0), Number.isFinite(maxQtyBySerial) ? maxQtyBySerial : Number(availableQty || 0));
    const normalizedQtyToAdd = isSerialized ? incomingSerials.length : Number(qtyToAdd || 0);
    if (normalizedQtyToAdd <= 0) return;
    const sellingPrice = Number(resolvedVariant?.sellingPrice ?? product?.sellingPrice ?? 0,);
    const tax = Number(resolvedVariant?.tax ?? product?.tax ?? 0);
    const discountValue = Number(resolvedVariant?.discountAmount ?? resolvedVariant?.discountValue ?? product?.discountAmount ?? product?.discountValue ?? 0,);
    const resolvedDiscountType = resolvedVariant?.discountType ?? product?.discountType ?? "Fixed";
    const discountPerUnit = resolvedDiscountType === "Percentage" ? (sellingPrice * discountValue) / 100 : discountValue;
    const selectedColor = resolvedVariant?.color ?? "";
    const selectedSize = resolvedVariant?.size ?? "";
    const lineId = buildCartLineId(
      String(product._id),
      resolvedVariant,
      selectedColor,
      selectedSize,
    );
    setSelectedItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (it) => String(it._id) === String(lineId),
      );
      if (existingIndex !== -1) {
        const updated = [...prevItems];
        const existingItem = updated[existingIndex];
        const existingSerials = Array.isArray(existingItem.selectedSerialnos)
          ? existingItem.selectedSerialnos.map((s) => String(s))
          : (existingItem.selectedSerialno ? [String(existingItem.selectedSerialno)] : []);
        const mergedSerials = isSerialized
          ? Array.from(new Set([...existingSerials, ...incomingSerials]))
          : [];
        const nextQty = isSerialized ? mergedSerials.length : (Number(existingItem.quantity || 0) + normalizedQtyToAdd);
        const newQty = Math.min(nextQty, Number(existingItem.availableQuantity ?? maxQty));
        const finalSerials = isSerialized ? mergedSerials.slice(0, newQty) : [];
        if (isSerialized && finalSerials.length !== newQty) {
          toast.error("Select serial numbers equal to quantity");
          return prevItems;
        }
        updated[existingIndex] = {
          ...existingItem,
          quantity: newQty,
          selectedSerialnos: isSerialized ? finalSerials : [],
          selectedSerialno: isSerialized ? (finalSerials.length === 1 ? finalSerials[0] : null) : (existingItem.selectedSerialno ?? null),
          sellingPrice,
          tax,
          discountValue,
          discountType: resolvedDiscountType,
          totalPrice: newQty * sellingPrice,
          totalDiscount: newQty * discountPerUnit,
          totalTax: (sellingPrice * tax * newQty) / 100,
          availableQuantity: Number(existingItem.availableQuantity ?? maxQty),
        };
        return updated;
      }
      const newQty = Math.min(normalizedQtyToAdd, maxQty);
      const initialSerials = isSerialized ? incomingSerials.slice(0, newQty) : [];
      if (isSerialized && initialSerials.length !== newQty) {
        toast.error("Select serial numbers equal to quantity");
        return prevItems;
      }

      const unitRate = Number(sellingPrice || 0);
      const currentQty = Number(newQty || 1);
      const lineTotalAmount = currentQty * unitRate;

      // Accurate reverse tax calculation for tax-inclusive retail items
      const computedLineTax = lineTotalAmount - (lineTotalAmount / (1 + (Number(tax || 0) / 100)));

      const newItem = {
        _id: lineId,
        productId: String(product._id),
        variantId: resolvedVariant?._id ? String(resolvedVariant._id) : null,
        productName: product?.productName,
        itemBarcode: resolvedVariant?.barcode || product?.itemBarcode || product?.barcode || product?.productBarcode || "",
        brand: product?.brand,
        category: product?.category,
        subcategory: product?.subcategory,
        warrantyType: product?.warrantyType ?? "",
        warrantyPeriod: product?.warrantyPeriod ?? null,
        warrantyStartsFrom: product?.warrantyStartsFrom ?? "",
        expiryDate: resolvedVariant?.expiryDate ?? null,
        images: resolvedVariant?.images?.length > 0 ? resolvedVariant.images : product?.images || [],
        unit: resolvedVariant?.unit ?? product?.unit,
        selectedColor,
        selectedSize,
        selectedSerialnos: isSerialized ? initialSerials : [],
        selectedSerialno: isSerialized ? (initialSerials.length === 1 ? initialSerials[0] : null) : null,
        isSerialized,

        // --- PRICE MAPPING KEYS (Keeps both local state and backend references synced) ---
        sellingPrice: unitRate,
        salePrice: unitRate,     // Added fallback for backend/printout lookups
        price: unitRate,         // Added fallback for backend/printout lookups

        // --- TAX MAPPING KEYS ---
        tax: Number(tax || 0),
        taxRate: Number(tax || 0),

        // --- DISCOUNT MAPPING KEYS ---
        discountValue: Number(discountValue || 0),
        discount: Number(discountValue || 0),
        discountType: resolvedDiscountType,

        // --- CALCULATED TOTALS MATRIX ---
        availableQuantity: maxQty,
        quantity: currentQty,
        totalPrice: lineTotalAmount,
        totalDiscount: currentQty * Number(discountPerUnit || 0),
        totalTax: Number(computedLineTax.toFixed(2)), // Fixed reverse tax math
      };

      return [...prevItems, newItem];
    });
  };

  const getCartQuantityForProduct = (productId) => {
    const pid = String(productId ?? "");
    return selectedItems.reduce((sum, item) => {
      if (item?.isBag) return sum;
      const itemPid = String(item?.productId ?? item?._id ?? "");
      if (itemPid !== pid) return sum;
      return sum + (Number(item?.quantity) || 0);
    }, 0);
  };

  const handleSearchDropChange = () => {
    setSearchDrop(true);
  };

  const handleCategoryChange = (e) => {
    setCategoryValue(e.target.value);
    const capitalizedValue = e.target.value ? e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "";
    const statusFilter = activeQuickFilter === "all" ? capitalizedValue : activeQuickFilter.charAt(0).toUpperCase() + activeQuickFilter.slice(1);
    fetchPosSales(1, transactionSearchQuery, statusFilter, socketValue);
  };

  const [socketValue, setSocketValue] = useState("");

  const handleSocketChange = (e) => {
    setSocketValue(e.target.value);
    const statusFilter = activeQuickFilter === "all" ? categoryValue ? categoryValue.charAt(0).toUpperCase() + categoryValue.slice(1) : "" : activeQuickFilter.charAt(0).toUpperCase() + activeQuickFilter.slice(1);
    const capitalizedPaymentMethod = e.target.value ? e.target.value.toLowerCase() === "upi" ? "UPI" : e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1) : "";
    fetchPosSales(
      1,
      transactionSearchQuery,
      statusFilter,
      capitalizedPaymentMethod,
    );
  };

  const [activeQuickFilter, setActiveQuickFilter] = useState("all");

  const handleClear = () => {
    setSearchDrop(false);
    setCategoryValue("");
    setSocketValue("");
    setWarehouseValue("");
    setExprationValue("");
    setActiveQuickFilter("all");
    fetchPosSales(1, transactionSearchQuery, "", "");
  };

  const handleQuickFilter = (filterType) => {
    setActiveQuickFilter(filterType);
    const statusFilter = filterType === "all" ? "" : filterType.charAt(0).toUpperCase() + filterType.slice(1);
    fetchPosSales(1, transactionSearchQuery, statusFilter, socketValue);
  };

  // payment popup------------------------------------------------------------------------------------------------------------------
  const checkPaymentPopup = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setShowPaymentPopup(true);
  };

  //cash popup------------------------------------------------------------------------------------------------------------------
  const [cashPopup, setCashPopup] = useState(false);

  const handleCashPopupChange = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setCashPopup(!cashPopup);
  };

  const [cardpopup, setCardPopup] = useState(false);
  const CardRef = useRef(null);

  const handleCardPopupChange = () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer first");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setCardPopup(!cardpopup);
  };

  const closeCard = () => {
    setCardPopup(false);
    setCardNumber("");
    setCardHolderName("");
    setValidTill("");
    setCvv("");
  };

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [validTill, setValidTill] = useState("");
  const [cvv, setCvv] = useState("");

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 16) {
      setCardNumber(value);
    }
  };

  const handleCardHolderNameChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z\s]/g, "");
    setCardHolderName(value);
  };

  const handleValidTillChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      const month = value.substring(0, 2);
      const year = value.substring(2, 4);
      if (parseInt(month) > 12 || parseInt(month) < 1) {
        return;
      }
      value = month + (year ? "/" + year : "");
    }
    if (value.length <= 5) {
      setValidTill(value);
    }
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 3) {
      setCvv(value);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (CardRef.current && !CardRef.current.contains(event.target)) {
        closeCard();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "F2") {
        event.preventDefault();
        setCardPopup((prev) => !prev);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  //upi popup--------------------------------------------------------------------------------------------------------------------------
  const [upipopup, setUpiPopup] = useState(false);
  const UpiRef = useRef(null);

  const handleUpiPopupChange = () => {
    setShowPaymentPopup(false);
    if (!selectedCustomer) {
      toast.error("Please select a customer first");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setUpiPopup(!upipopup);
  };

  const closeUpi = () => {
    setUpiPopup(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (UpiRef.current && !UpiRef.current.contains(event.target)) {
        closeUpi();
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "F3") {
        event.preventDefault();
        setUpiPopup((prev) => !prev);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Selected payment method state for highlighting---------------------------------------------------------------------------------
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  //transaction popup---------------------------------------------------------------------------------------------------------------
  const [transactionpopup, setTransactionPopup] = useState(false);
  const TransactionRef = useRef(null);

  const closeTransaction = () => { setTransactionPopup(false); };

  const handlePopupClose = () => {
    setShowTransactionPopup(false);
    setOpenCashier(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (TransactionRef.current && !TransactionRef.current.contains(event.target)) {
        closeTransaction();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //discount popup--------------------------------------------------------------------------------------------------------------------
  const [discountpopup, setDiscountPopup] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState(null);
  const [discountQuantity, setDiscountQuantity] = useState(1);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountFixed, setDiscountFixed] = useState(0);
  const [discountType, setDiscountType] = useState("Fixed");
  const DiscountRef = useRef(null);

  const handleProductDiscountClick = (item) => {
    const productId = item?.productId ?? item?._id;
    const product = products.find((p) => String(p._id) === String(productId));
    setSelectedItemForDiscount({
      ...item,
      availableQuantity:
        Number(item?.availableQuantity ?? 0) ||
        (product ? Number(product.quantity || 0) : 0),
    });
    setDiscountQuantity(item.quantity);
    setDiscountPercentage(item.discountType === "Percentage" ? item.discountValue : 0,);
    setDiscountFixed(item.discountType === "Fixed" ? item.discountValue : 0);
    setDiscountType(item.discountType || "Fixed");
    setDiscountPopup(true);
  };

  const closeDiscount = () => {
    setDiscountPopup(false);
    setSelectedItemForDiscount(null);
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity > 0) {
      setDiscountQuantity(newQuantity);
    }
  };

  const handleDiscountPercentageChange = (value) => {
    setDiscountPercentage(Number(value) || 0);
    setDiscountType("Percentage");
  };

  const handleDiscountFixedChange = (value) => {
    setDiscountFixed(Number(value) || 0);
    setDiscountType("Fixed");
  };

  const applyDiscountChanges = () => {
    if (selectedItemForDiscount) {
      if (selectedItemForDiscount?.isSerialized) {
        const selectedSerials = Array.isArray(selectedItemForDiscount.selectedSerialnos)
          ? selectedItemForDiscount.selectedSerialnos
          : (selectedItemForDiscount.selectedSerialno ? [selectedItemForDiscount.selectedSerialno] : []);
        if (Number(discountQuantity) !== selectedSerials.length) {
          toast.error("For serialized items, quantity must match selected serial numbers");
          return;
        }
      }
      const updatedItems = selectedItems.map((item) =>
        item._id === selectedItemForDiscount._id
          ? {
            ...item,
            quantity: discountQuantity,
            discountValue: discountType === "Percentage" ? discountPercentage : discountFixed,
            discountAmount: discountType === "Percentage" ? discountPercentage : discountFixed,
            discountType: discountType,
            totalPrice: discountQuantity * item.sellingPrice,
            totalTax: (item.tax * discountQuantity * item.sellingPrice) / 100,
            totalDiscount: discountType === "Percentage" ? (discountQuantity * item.sellingPrice * discountPercentage) / 100 : discountFixed * discountQuantity,
          }
          : item,
      );
      setSelectedItems(updatedItems);
      closeDiscount();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (DiscountRef.current && !DiscountRef.current.contains(event.target)) {
        closeDiscount();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const calculateDiscountedPrice = (product) => {
    if (product.discountAmount && product.discountAmount > 0) {
      if (product.discountType === "Percentage") {
        const discountAmount = (product.sellingPrice * product.discountAmount) / 100;
        return product.sellingPrice - discountAmount;
      } else if (product.discountType === "Fixed") {
        return product.sellingPrice - product.discountAmount;
      }
    }
    const cartItem = selectedItems.find((item) => item._id === product._id);
    if (cartItem && cartItem.discountValue && cartItem.discountValue > 0) {
      if (cartItem.discountType === "Percentage") {
        const discountAmount = (product.sellingPrice * cartItem.discountValue) / 100;
        return product.sellingPrice - discountAmount;
      } else if (cartItem.discountType === "Fixed") {
        return product.sellingPrice - cartItem.discountValue;
      }
    }
    return product.sellingPrice;
  };

  const calculateDiscountedTotalPrice = (item) => {
    if (item.discountValue && item.discountValue > 0) {
      if (item.discountType === "Percentage") {
        const discountAmount = (item.sellingPrice * item.discountValue) / 100;
        const discountedPrice = item.sellingPrice - discountAmount;
        return item.quantity * discountedPrice;
      } else if (item.discountType === "Fixed") {
        const discountedPrice = item.sellingPrice - item.discountValue;
        return item.quantity * discountedPrice;
      }
    }
    return item.quantity * item.sellingPrice;
  };

  const calculateDiscountedTax = (item) => {
    if (item.discountValue && item.discountValue > 0) {
      if (item.discountType === "Percentage") {
        const discountAmount = (item.sellingPrice * item.discountValue) / 100;
        const discountedPrice = item.sellingPrice - discountAmount;
        return (discountedPrice * item.tax * item.quantity) / 100;
      } else if (item.discountType === "Fixed") {
        const discountedPrice = item.sellingPrice - item.discountValue;
        return (discountedPrice * item.tax * item.quantity) / 100;
      }
    }
    return (item.sellingPrice * item.tax * item.quantity) / 100;
  };

  //payment done popup-------------------------------------------------------------------------------------------------------
  const [paymentpopup, setPaymentPopup] = useState(false);
  const PaymentRef = useRef(null);
  const handlePaymentPopupChange = () => { setPaymentPopup(!paymentpopup); }
  const closePayment = () => { setPaymentPopup(false); };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (PaymentRef.current && !PaymentRef.current.contains(event.target)) {
        closePayment();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  //fetch products details---------------------------------------------------------------------------------------------------------
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products for filtering
  const [activeTabs, setActiveTabs] = useState({});
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [lowHighSortActive, setLowHighSortActive] = useState(false);
  const [preSortProductsSnapshot, setPreSortProductsSnapshot] = useState([]);
  const [selectedSortMode, setSelectedSortMode] = useState(null); // 'price' | 'date' | null
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeInputRef = React.useRef(null);
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const highlightTimerRef = useRef(null);
  const scannerBufferRef = React.useRef([]); // array of {char, time}
  const scannerClearTimerRef = React.useRef(null);
  const lastScanMapRef = React.useRef(new Map());
  const inFlightRef = React.useRef(new Set());

  const filterMaxPrice = useMemo(() => {
    const list = Array.isArray(allProducts) ? allProducts : [];
    let max = 0;
    for (const p of list) {
      const variantPrices = Array.isArray(p?.variants) ? p.variants.map((v) => Number(v?.sellingPrice) || 0) : [];
      const pMax = Math.max(Number(p?.sellingPrice) || 0, ...variantPrices);
      if (pMax > max) max = pMax;
    }
    return max;
  }, [allProducts]);

  const appliedFilterCount = useMemo(() => {
    let count = 0;
    const f = appliedProductFilters || DEFAULT_PRODUCT_FILTERS;
    if (String(f.categoryId || "").trim()) count += 1;
    if (Array.isArray(f.brandIds) && f.brandIds.length > 0) count += 1;
    if (String(f.stockStatus || "").trim()) count += 1;
    if (f.priceMin != null || f.priceMax != null) count += 1;
    if (Array.isArray(f.productTypes) && f.productTypes.length > 0) count += 1;
    if (f.taxRate != null && f.taxRate !== "") count += 1;
    return count;
  }, [appliedProductFilters]);

  useEffect(() => {
    const onKeyDown = (e) => {
      try {
        const key = e.key;
        const now = Date.now();

        // Ignore if user is typing in an input/textarea/select (except the barcode input)
        const active = document.activeElement;
        const isTypingElsewhere =
          active &&
          (active.tagName === "TEXTAREA" ||
            active.tagName === "SELECT" ||
            (active.tagName === "INPUT" && active !== barcodeInputRef.current && active !== searchInputRef.current));

        if (isTypingElsewhere) return;

        if (key === "Enter") {
          const buf = scannerBufferRef.current;
          if (buf.length >= 2) {
            const duration = buf[buf.length - 1].time - buf[0].time;
            if (duration <= 1000) {
              const code = buf.map((x) => x.char).join("");
              scannerBufferRef.current = [];
              lookupBarcodeAndAdd(code);
              e.preventDefault();
              return;
            }
          }
          scannerBufferRef.current = [];
          return;
        }

        if (key && key.length === 1) {
          scannerBufferRef.current.push({ char: key, time: now });
          if (scannerClearTimerRef.current)
            clearTimeout(scannerClearTimerRef.current);
          scannerClearTimerRef.current = setTimeout(() => {
            scannerBufferRef.current = [];
          }, 1200);
        }
      } catch (err) { }
    };

    // Use capture:true so it fires before any element-level handlers
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (scannerClearTimerRef.current)
        clearTimeout(scannerClearTimerRef.current);
    };
  }, []);

  const videoRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const [scanning, setScanning] = useState(false);
  const scanStreamRef = React.useRef(null);
  const detectorRef = React.useRef(null);

  const lookupBarcodeAndAdd = async (code, opts = { showToast: true }) => {
    if (!code) return false;
    const normalize = (c) =>
      String(c || "").replace(/\s+/g, " ").trim().toUpperCase();
    const normCode = normalize(code);
    const COOLDOWN_MS = 1500;
    const lastMap = lastScanMapRef.current;
    const lastTime = lastMap.get(normCode) || 0;
    if (Date.now() - lastTime < COOLDOWN_MS) {
      barcodeInputRef.current?.focus();
      return false;
    }
    if (inFlightRef.current.has(normCode)) return false;
    inFlightRef.current.add(normCode);
    try {
      ;
      const res = await api.get(`/api/products/barcode/${encodeURIComponent(normCode)}`,);
      if (res && res.data) {
        const prod = res.data;
        const frontendProduct = {
          _id: prod._id,
          productName: prod.productName,
          sellingPrice: Number(prod.sellingPrice) || 0,
          discountValue: Number(prod.discountAmount) || 0,
          tax: Number(prod.tax) || 0,
          images: prod.images || [],
          quantity: Number(prod.stockQuantity || 0),
          unit: prod.unit || "pcs",
        };
        handleProductClick(frontendProduct);
        try {
          if (opts && opts.showToast !== false) {
            const priceDisplay = prod.sellingPrice != null ? `₹${Number(prod.sellingPrice).toFixed(2)}` : "";
          }
        } catch (e) {
        }
        try {
          setHighlightedProductId(prod._id);
          if (highlightTimerRef.current)
            clearTimeout(highlightTimerRef.current);
          highlightTimerRef.current = setTimeout(
            () => setHighlightedProductId(null),
            2500,
          );
          const el = document.getElementById(`product-card-${prod._id}`);
          if (el && typeof el.scrollIntoView === "function")
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (e) {
        }
        setBarcodeInput("");
        barcodeInputRef.current?.focus();
        lastMap.set(normCode, Date.now());
        return true;
      }
    } catch (err) {
      barcodeInputRef.current?.focus();
      return false;
    } finally {
      inFlightRef.current.delete(normCode);
    }
  };

  useEffect(() => {
    const handler = async (e) => {
      try {
        const prod = e.detail;
        const code = prod?.itemBarcode || prod?.barcode || prod?.productBarcode || null;
        if (code) {
          await lookupBarcodeAndAdd(code, { showToast: false });
        }
      } catch (err) { }
    };
    window.addEventListener("barcode:found", handler);
    return () => window.removeEventListener("barcode:found", handler);
  }, []);

  const handleFileInput = async (e) => {
    try {
      const file = e?.target?.files?.[0];
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      const img = document.createElement("img");
      img.src = objectUrl;
      await img.decode();
      const code = await barcodeDetector.detectFromImageElement(img);
      if (code) {
        const ok = await lookupBarcodeAndAdd(code);
        if (ok) {
          if (typeof navigator !== "undefined" && navigator.vibrate)
            navigator.vibrate(100);
          try {
            stopScanner();
          } catch (e) { }
        }
      } else {
        toast.error("No barcode found in the selected image");
      }
      URL.revokeObjectURL(objectUrl);
      e.target.value = "";
    } catch (err) {
      toast.error("Error processing image");
      if (e && e.target) e.target.value = "";
    }
  };

  const startScanner = async () => {
    try {
      if (!("mediaDevices" in navigator) || !navigator.mediaDevices.getUserMedia) {
        toast.info("Camera not available — please capture or select a photo to scan",);
        fileInputRef.current?.click();
        return;
      }
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, });
      scanStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      try {
        detectorRef.current = barcodeDetector.startVideoDetector(
          videoRef.current,
          async (code) => {
            try {
              const ok = await lookupBarcodeAndAdd(code);
              if (ok && typeof navigator !== "undefined" && navigator.vibrate)
                navigator.vibrate(100);
            } catch (err) {
            } finally {
              stopScanner();
            }
          },
          {
            formats: [
              "ean_13",
              "ean_8",
              "code_128",
              "code_39",
              "upc_a",
              "upc_e",
              "qr_code",
            ],
            intervalMs: 300,
          },
        );
      } catch (err) {
        toast.error("Barcode scanning is not supported in this browser.");
        stopScanner();
        return;
      }
    } catch (err) {
      toast.info("Unable to access camera — please capture or select a photo to scan",);
      setScanning(false);
      setTimeout(() => fileInputRef.current?.click(), 200);
    }
  };

  const stopScanner = () => {
    try {
      setScanning(false);
      if (scanStreamRef.current) {
        scanStreamRef.current.getTracks().forEach((t) => t.stop());
        scanStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      if (detectorRef.current) {
        try {
          if (typeof detectorRef.current.stop === "function") {
            detectorRef.current.stop();
          } else if (
            detectorRef.current.zxingReader &&
            typeof detectorRef.current.zxingReader.reset === "function"
          ) {
            detectorRef.current.zxingReader.reset();
          }
        } catch (e) { }
      }
      detectorRef.current = null;
    } catch (err) { }
  };

  const handleBarcodeSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const code = (barcodeInput || "").trim();
    if (!code) return;
    try {
      const ok = await lookupBarcodeAndAdd(code);
      setBarcodeInput("");
      barcodeInputRef.current?.focus();
      return ok;
    } catch (err) {
      setBarcodeInput("");
      barcodeInputRef.current?.focus();
    }
  };

  const [transactionSearchQuery, setTransactionSearchQuery] = useState("");

  const isProductExpired = (product) => {
    const expiryArr = product.variants?.get?.("Expire") || product.variants?.["Expire"] || product.variants?.get?.("expire") || product.variants?.["expire"];
    if (!expiryArr || expiryArr.length === 0) return false;
    return expiryArr.some((dateStr) => {
      if (typeof dateStr === "string") {
        const dateMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
        if (dateMatch) {
          const [, day, month, year] = dateMatch.map(Number);
          if (day && month && year && day <= 31 && month <= 12) {
            const expDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            expDate.setHours(0, 0, 0, 0);
            if (!isNaN(expDate.getTime())) {
              return expDate < today;
            }
          }
        }
      }
      return false;
    });
  };

  const getEntityId = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value._id) return String(value._id);
    return "";
  };

  const productMatchesSearch = (product, query) => {
    const searchTerm = String(query || "").trim().toLowerCase();
    if (!searchTerm) return true;
    const brandName = product?.brand && typeof product.brand === "object" ? product.brand.brandName : product?.brand;
    const categoryName = product?.category && typeof product.category === "object" ? product.category.categoryName : product?.category;
    const subcategoryName = product?.subcategory && typeof product.subcategory === "object" ? product.subcategory.subCategoryName : product?.subcategory;
    const variantBarcodeMatch = Array.isArray(product?.variants)
      ? product.variants.some((v) => String(v?.itemBarcode || v?.barcode || v?.productBarcode || "").toLowerCase().includes(searchTerm))
      : false;
    return (
      product.productName?.toLowerCase().includes(searchTerm) ||
      product.itemBarcode?.toLowerCase().includes(searchTerm) ||
      product.barcode?.toLowerCase().includes(searchTerm) ||
      product.productBarcode?.toLowerCase().includes(searchTerm) ||
      variantBarcodeMatch ||
      product.description?.toLowerCase().includes(searchTerm) ||
      String(brandName || "").toLowerCase().includes(searchTerm) ||
      String(categoryName || "").toLowerCase().includes(searchTerm) ||
      String(subcategoryName || "").toLowerCase().includes(searchTerm) ||
      product.seoTitle?.toLowerCase().includes(searchTerm) ||
      product.seoDescription?.toLowerCase().includes(searchTerm)
    );
  };

  const sortProductsList = (list, sortKey) => {
    const arr = Array.isArray(list) ? [...list] : [];
    const key = String(sortKey || "");
    if (!key) return arr;
    const getPrices = (product) => {
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      const variantPrices = variants.map((v) => Number(v?.sellingPrice) || 0);
      const candidatePrices = [
        Number(product?.sellingPrice) || 0,
        ...variantPrices,
      ].filter((n) => Number.isFinite(n) && n > 0);
      return candidatePrices.length ? candidatePrices : [0];
    };
    const getMinPrice = (product) => Math.min(...getPrices(product));
    const getMaxPrice = (product) => Math.max(...getPrices(product));
    const getCreatedTime = (product) => {
      const t = new Date(product?.createdAt || product?.updatedAt || 0).getTime();
      return Number.isFinite(t) ? t : 0;
    };
    const getQty = (product) => Number(product?.quantity ?? product?.stockQuantity ?? 0) || 0;
    const getNearestExpiryTime = (product) => {
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      const times = variants
        .map((v) => (v?.expiryDate ? new Date(v.expiryDate).getTime() : NaN))
        .filter((t) => Number.isFinite(t));
      return times.length ? Math.min(...times) : Number.POSITIVE_INFINITY;
    };

    const getMaxMargin = (product) => {
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      const margins = variants
        .map((v) => (Number(v?.sellingPrice) || 0) - (Number(v?.purchasePrice) || 0))
        .filter((n) => Number.isFinite(n));
      if (margins.length) return Math.max(...margins);
      return (Number(product?.sellingPrice) || 0) - (Number(product?.purchasePrice) || 0);
    };

    const isDiscounted = (product) => {
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      if (Number(product?.discountAmount) > 0 || Number(product?.discountValue) > 0)
        return true;
      return variants.some((v) => Number(v?.discountAmount) > 0);
    };

    const cmpString = (a, b) => String(a || "").localeCompare(String(b || ""), undefined, { sensitivity: "base" });

    const compare = (a, b) => {
      if (key === "name_asc") return cmpString(a?.productName, b?.productName);
      if (key === "name_desc") return cmpString(b?.productName, a?.productName);
      if (key === "price_low_high") return getMinPrice(a) - getMinPrice(b);
      if (key === "price_high_low") return getMaxPrice(b) - getMaxPrice(a);
      if (key === "recently_added") return getCreatedTime(b) - getCreatedTime(a);
      if (key === "low_stock_first") return getQty(a) - getQty(b);
      if (key === "high_stock_first") return getQty(b) - getQty(a);
      if (key === "nearest_expiry") return getNearestExpiryTime(a) - getNearestExpiryTime(b);
      if (key === "high_profit_margin") return getMaxMargin(b) - getMaxMargin(a);
      if (key === "discounted_items") {
        const da = isDiscounted(a) ? 1 : 0;
        const db = isDiscounted(b) ? 1 : 0;
        if (db !== da) return db - da;
        return getCreatedTime(b) - getCreatedTime(a);
      }
      return 0;
    };

    arr.sort((a, b) => {
      const r = compare(a, b);
      return r !== 0 ? r : cmpString(a?._id, b?._id);
    });
    return arr;
  };

  const filterProductsList = (list, opts) => {
    const base = Array.isArray(list) ? list : [];
    const {
      selectedCategoryId,
      searchQuery,
      filters,
    } = opts || {};

    const categoryId = String(filters?.categoryId || "").trim();
    const brandIds = Array.isArray(filters?.brandIds) ? filters.brandIds : [];
    const stockStatus = String(filters?.stockStatus || "");
    const priceMin = filters?.priceMin == null ? null : Number(filters.priceMin);
    const priceMax = filters?.priceMax == null ? null : Number(filters.priceMax);
    const productTypes = Array.isArray(filters?.productTypes) ? filters.productTypes : [];
    const taxRate = filters?.taxRate == null || filters.taxRate === "" ? null : Number(filters.taxRate);
    return base.filter((product) => {
      if (isProductExpired(product)) return false;
      if (selectedCategoryId) {
        const pid = getEntityId(product?.category);
        if (String(pid) !== String(selectedCategoryId)) return false;
      }
      if (categoryId) {
        const pid = getEntityId(product?.category);
        if (String(pid) !== String(categoryId)) return false;
      }
      if (brandIds.length > 0) {
        const bid = getEntityId(product?.brand) || String(product?.brand || "");
        if (!brandIds.some((x) => String(x) === String(bid))) return false;
      }
      if (!productMatchesSearch(product, searchQuery)) return false;
      const variants = Array.isArray(product?.variants) ? product.variants : [];
      const totalQty = Number(product?.quantity ?? product?.stockQuantity ?? 0);
      const minStockValues = variants
        .map((v) => Number(v?.minStockToMaintain))
        .filter((n) => Number.isFinite(n));
      const minStock = minStockValues.length ? Math.min(...minStockValues) : 0;
      if (stockStatus === "out") {
        if (totalQty > 0) return false;
      } else if (stockStatus === "low") {
        if (!(totalQty > 0 && totalQty <= minStock)) return false;
      } else if (stockStatus === "in") {
        if (!(totalQty > minStock)) return false;
      }
      const variantPrices = variants.map((v) => Number(v?.sellingPrice) || 0);
      const candidatePrices = [
        Number(product?.sellingPrice) || 0,
        ...variantPrices,
      ].filter((n) => Number.isFinite(n) && n > 0);
      const priceValue = candidatePrices.length ? Math.min(...candidatePrices) : 0;
      if (priceMin != null && Number.isFinite(priceMin) && priceValue < priceMin)
        return false;
      if (priceMax != null && Number.isFinite(priceMax) && priceValue > priceMax)
        return false;
      const hasSerial = variants.some(
        (v) => Array.isArray(v?.serialNumbers) && v.serialNumbers.length > 0,
      );
      const isSingle = variants.length === 1 && !hasSerial;
      const isVariants = variants.length > 1 && !hasSerial;
      const isSerial = hasSerial;
      if (productTypes.length > 0) {
        const ok =
          (productTypes.includes("single") && isSingle) ||
          (productTypes.includes("variants") && isVariants) ||
          (productTypes.includes("serial") && isSerial);
        if (!ok) return false;
      }
      if (taxRate != null && Number.isFinite(taxRate)) {
        const taxes = variants
          .map((v) => Number(v?.tax))
          .filter((n) => Number.isFinite(n));
        const productTax = Number(product?.tax);
        const ok = taxes.includes(taxRate) || productTax === taxRate;
        if (!ok) return false;
      }
      return true;
    });
  };

  const buildVisibleProducts = (baseList, opts) => sortProductsList(filterProductsList(baseList, opts), productSortKey);

  const searchSuggestions = useMemo(() => {
    const q = String(searchProductQuery || "").trim();
    if (!q) return [];
    return buildVisibleProducts(allProducts, {
      selectedCategoryId: selectedCategory?._id ? String(selectedCategory._id) : "",
      searchQuery: q,
      filters: appliedProductFilters,
    }).slice(0, 10);
  }, [searchProductQuery, allProducts, selectedCategory?._id, appliedProductFilters, productSortKey]);

  const lastManualBarcodeRef = useRef("");
  const tryAutoSelectProductByBarcode = (raw) => {
    const value = String(raw || "").trim();
    if (!value) {
      lastManualBarcodeRef.current = "";
      return false;
    }
    if (/[a-z]/i.test(value)) {
      lastManualBarcodeRef.current = "";
      return false;
    }
    const digits = value.replace(/\D/g, "").slice(0, 13);
    if (digits.length !== 13) {
      lastManualBarcodeRef.current = "";
      return false;
    }

    if (lastManualBarcodeRef.current === digits) return false;
    lastManualBarcodeRef.current = digits;
    let match = null;
    let matchedVariant = null;
    for (const p of (allProducts || [])) {
      const code = String(p?.itemBarcode || p?.itembarcode || "").replace(/\D/g, "");
      if (code === digits) {
        match = p;
        matchedVariant = null;
        break;
      }
      const variants = Array.isArray(p?.variants) ? p.variants : [];
      const v = variants.find((vv) =>
        String(vv?.itemBarcode || vv?.barcode || vv?.productBarcode || "").replace(/\D/g, "") === digits
      );
      if (v) {
        match = p;
        matchedVariant = v;
        break;
      }
    }
    if (!match) return false;
    const variantsCount = Array.isArray(match?.variants) ? match.variants.length : 0;
    const variantToAdd = matchedVariant || (variantsCount > 0 ? match.variants[0] : null);
    if (!variantToAdd) return false;
    const availableQty = getVariantAvailableQuantity(match, variantToAdd);
    if (availableQty <= 0) {
      toast.error("Out of stock");
      return false;
    }
    const serials = Array.isArray(variantToAdd?.serialNumbers) ? variantToAdd.serialNumbers.filter(Boolean) : [];
    if (serials.length === 1) {
      addProductVariantToCart(match, variantToAdd, 1, [serials[0]]);
      focusSearchInput();
    } else if (serials.length > 1) {
      openProductPopup(match, variantToAdd);
    } else {
      addProductVariantToCart(match, variantToAdd, 1);
      focusSearchInput();
    }
    setSearchProductQuery("");
    setSearchProduct(false);
    return true;
  };

  const handleProductSearch = (query) => {
    setProductSearchQuery(query);
    const next = buildVisibleProducts(allProducts, {
      selectedCategoryId: selectedCategory?._id ? String(selectedCategory._id) : "",
      searchQuery: query,
      filters: appliedProductFilters,
    });
    setProducts(next);
  };

  const applyDropdownFilters = (filtersToApply) => {
    const nextFilters = filtersToApply || DEFAULT_PRODUCT_FILTERS;
    setAppliedProductFilters(nextFilters);
    setDraftProductFilters(nextFilters);
    const next = buildVisibleProducts(allProducts, {
      selectedCategoryId: selectedCategory?._id ? String(selectedCategory._id) : "",
      searchQuery: productSearchQuery,
      filters: nextFilters,
    });
    setProducts(next);
  };

  const clearDropdownFilters = () => {
    setAppliedProductFilters(DEFAULT_PRODUCT_FILTERS);
    setDraftProductFilters(DEFAULT_PRODUCT_FILTERS);
    const next = buildVisibleProducts(allProducts, {
      selectedCategoryId: selectedCategory?._id ? String(selectedCategory._id) : "",
      searchQuery: productSearchQuery,
      filters: DEFAULT_PRODUCT_FILTERS,
    });
    setProducts(next);
  };

  const handleLowHighSortToggle = () => {
    if (!lowHighSortActive) {
      setPreSortProductsSnapshot(products);
      if (selectedSortMode === "date") {
        const sortedAscDate = [...products].sort((a, b) => {
          const ad = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const bd = new Date(b.createdAt || b.updatedAt || 0).getTime();
          return ad - bd;
        });
        setProducts(sortedAscDate);
      } else {
        const sortedAscPrice = [...products].sort((a, b) => Number(a.sellingPrice || 0) - Number(b.sellingPrice || 0),);
        setProducts(sortedAscPrice);
      }
      setLowHighSortActive(true);
    } else {
      if (preSortProductsSnapshot && preSortProductsSnapshot.length > 0) {
        setProducts(preSortProductsSnapshot);
      } else {
        setProducts(allProducts);
      }
      setLowHighSortActive(false);
    }
  };

  // Thermal Bill Generation-------------------------------------------------------------------------------------------------------------
  const generateThermalBill = (saleData) => {
    // ESC/POS Directives for alignment and emphasis
    const CENTER = '\x1B\x61\x01';
    const LEFT = '\x1B\x61\x00';
    const BOLD_ON = '\x1B\x45\x01';
    const BOLD_OFF = '\x1B\x45\x00';
    const LINE = '------------------------------------------------\n'; // Exactly 40 characters wide - 50

    // Helper to space text perfectly across a 40-character line (Left label, Right value)
    const padLine = (label, value) => {
      const lbl = String(label);
      const val = String(value);
      const spaces = 48 - lbl.length - val.length;
      return spaces > 0 ? `${lbl}${" ".repeat(spaces)}${val}\n` : `${lbl} ${val}\n`;
    };

    // --- 1. HEADER (Centered Store Profile) ---
    let headerText = `${CENTER}`;
    headerText += `${BOLD_ON}${((companyImages?.companyName || "Store Name")).toUpperCase()}\n${BOLD_OFF}`;
    if (companyImages?.companyaddress) headerText += `${companyImages.companyaddress}\n`;
    if (companyImages?.companyphone) headerText += `Phone - ${companyImages.companyphone}\n`;
    if (companyImages?.companyemail || companyImages?.email) headerText += `${companyImages?.companyemail || companyImages?.email}\n`;
    if (companyImages?.gstNumber || companyImages?.gstin) {
      headerText += `GST No. - ${companyImages.gstNumber || companyImages.gstin}\n`;
    }

    headerText += `\nTax Invoice\nCustomer Copy\n\n`;

    // --- 2. METADATA BLOCK ---
    headerText += `${CENTER}`;

    // Format Date clean without long timezone text string bloating 40 chars wrap limit
    const formattedDate = saleData?.createdAt
      ? new Date(saleData.createdAt).toLocaleString("en-GB", {
        day: "2-digit",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).replace(",", "")
      : new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).replace(",", "");

    headerText += padLine(`Invoice- ${saleData?.invoiceNumber || "N/A"}`, formattedDate);
    headerText += padLine(`Payment Mode- ${saleData?.paymentDetails?.paymentMethod || "UPI"}`, `Status- Paid`);
    headerText += LINE;

    // --- 3. ITEMS MATRIX (Strict Column Widths: Name=14, Qty=8, Price=9, Total=9 -> Total 40) ---
    let itemsText = `Name          QTY    Price/unit   Total\n`;
    itemsText += LINE;

    const targetItems = saleData?.items || saleData?.selectedItems || [];

    targetItems.forEach((item) => {
      const name = (item.productName || 'Item').substring(0, 13).padEnd(14);
      const qty = `${item.quantity || 1} Pcs`.padEnd(8);

      const itemPrice = item.sellingPrice !== undefined ? item.sellingPrice : (item.price !== undefined ? item.price : (item.unitPrice || 0));
      const price = `Rs.${Number(itemPrice).toFixed(0)}`.padEnd(9);

      const itemTotal = item.totalPrice || (itemPrice * (item.quantity || 1));
      const total = `Rs.${Number(itemTotal).toFixed(2)}`.padStart(9);

      itemsText += `${name}${qty}${price}${total}\n`;
    });

    itemsText += LINE;

    // --- 4. PAYMENT SUMMARY ---
    const subTotalVal = Number(saleData?.totals?.subtotal ?? saleData?.subtotal ?? 0);
    const itemDiscountVal = Number(saleData?.totals?.discount ?? saleData?.discount ?? 0);
    const overallDiscountVal = Number(saleData?.totals?.overallDiscount ?? saleData?.overallDiscount ?? saleData?.overallDiscountAmount ?? 0);
    const taxVal = (saleData?.items || saleData?.selectedItems || []).reduce((sum, item) => sum + Number(item?.tax || 0), 0);
    const totalAmount = Number(saleData?.totals?.totalAmount ?? saleData?.totalAmount ?? 0);
    const receivedVal = Number(saleData?.paymentDetails?.amountReceived ?? saleData?.amountReceived ?? totalAmount);
    const changeReturnedVal = Number(saleData?.paymentDetails?.changeReturned ?? saleData?.changeReturned ?? 0);
    const additionalCharges = Array.isArray(saleData?.additionalCharges) ? saleData.additionalCharges : [];
    const additionalTotal = additionalCharges.reduce((sum, c) => sum + Number(c?.amount || 0), 0);
    const discountVal = Number(saleData?.discount || saleData?.totals?.discount || 0);

    let summaryText = `\n${CENTER}${BOLD_ON}Payment Summary${BOLD_OFF}\n`;

    // Sub Total
    summaryText += padLine("Sub Total", `Rs. ${subTotalVal.toFixed(2)}`);

    if (itemDiscountVal > 0) {
      summaryText += padLine("Item Discount", `Rs. -${itemDiscountVal.toFixed(2)}`);
    }

    if (overallDiscountVal > 0) {
      summaryText += padLine("Overall Discount", `Rs. -${overallDiscountVal.toFixed(2)}`);
    }

    additionalCharges.forEach((charge) => {
      if (charge?.name && Number(charge?.amount) > 0) {
        summaryText += padLine(charge.name, `Rs. ${Number(charge.amount).toFixed(2)}`);
      }
    });

    summaryText += LINE;

    summaryText += padLine("CGST", `Rs. ${taxVal.toFixed(2) / 2}`);
    summaryText += padLine("SGST", `Rs. ${taxVal.toFixed(2) / 2}`);
    summaryText += padLine("Total Tax", `Rs. ${taxVal.toFixed(2)}`);

    summaryText += LINE;

    // Grand Total (bold)
    summaryText += `${BOLD_ON}`;
    summaryText += padLine("Grand Total", `Rs. ${totalAmount.toFixed(2)}`);
    summaryText += `${BOLD_OFF}`;

    summaryText += padLine("Amount Received", `Rs. ${receivedVal.toFixed(2)}`);

    if (changeReturnedVal > 0) {
      summaryText += padLine("Change Returned", `Rs. ${changeReturnedVal.toFixed(2)}`);
    }

    const dueVal = totalAmount - receivedVal;
    if (dueVal > 0) {
      summaryText += padLine("Due Amount", `Rs. ${dueVal.toFixed(2)}`);
    }

    // --- 5. CUSTOMER DETAILS ---
    let customerText = "";
    const custName = saleData?.customer?.name;
    const custPhone = saleData?.customer?.phone;
    if (custName || custPhone) {
      customerText += `\n${CENTER}${BOLD_ON}Customer Details${BOLD_OFF}\n`;
      if (custName) customerText += padLine("Name:", custName);
      if (custPhone) customerText += padLine("Phone:", custPhone);
    }

    // --- 6. FOOTER ---
    let footerText = `\n${LINE}${CENTER}`;
    footerText += `Thank You for Visiting ${companyImages?.companyName || "Us"}\n`;
    footerText += `Have a Nice Day\n\n\n\n`;

    // Clean ESC/POS feed paper and cutting lines execution parameters
    footerText += '\x1B' + '\x64' + '\x04' + '\x1B' + '\x6D';

    return `${headerText}${itemsText}${summaryText}${customerText}${footerText}`;
  };

  const handleSortModeChange = (value) => {
    let mode = null;
    if (value === "sortByPrice") mode = "price";
    if (value === "sortByDate") mode = "date";
    setSelectedSortMode(mode);
    setLowHighSortActive(false);
    const base = products;
    setPreSortProductsSnapshot([]); // fresh snapshot next toggle
    if (mode === "price") {
      const sortedDescPrice = [...base].sort((a, b) => Number(b.sellingPrice || 0) - Number(a.sellingPrice || 0),); // High -> Low
      setProducts(sortedDescPrice);
      setPreSortProductsSnapshot(sortedDescPrice);
    } else if (mode === "date") {
      const sortedDescDate = [...base].sort((a, b) => {
        const ad = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const bd = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return bd - ad; // New -> Old
      });
      setProducts(sortedDescDate);
      setPreSortProductsSnapshot(sortedDescDate);
    }
  };

  const refreshProducts = async () => {
    try {
      const res = await api.get("/api/products");
      const productsData = res.data.products || res.data || [];
      const activeProducts = productsData.filter((product) => !isProductExpired(product) && !product.isDelete).map((product) => {
        const variantQty = Array.isArray(product?.variants) && product.variants.length > 0 ? product.variants.reduce((sum, v) => sum + (Number(v?.stockQuantity) || 0), 0,) : 0;
        const baseQty = product.quantity !== undefined ? Number(product.quantity) || 0 : product.stockQuantity !== undefined ? Number(product.stockQuantity) || 0 : 0;
        return {
          ...product,
          quantity: baseQty > 0 ? baseQty : variantQty,
        };
      });
      setAllProducts(activeProducts);
      setProducts(
        buildVisibleProducts(activeProducts, {
          selectedCategoryId: selectedCategory?._id ? String(selectedCategory._id) : "",
          searchQuery: productSearchQuery,
          filters: appliedProductFilters,
        }),
      );
    } catch (err) {
      setAllProducts([]);
      setProducts([]);
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to load products",);
    }
  };

  useEffect(() => { refreshProducts(); }, []);

  //fetch category of products----------------------------------------------------------------------------------------------------
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/category/categories");
      const activeCategories = res.data.filter((cat) => !cat.isDelete);
      setCategories(activeCategories);
    } catch (error) { }
  };

  useEffect(() => { fetchCategories(); }, []);

  const fetchBrands = async () => {
    try {
      const res = await api.get("/api/brands/active-brands");
      const apiBrands = res.data?.brands || res.data || [];
      setBrands(Array.isArray(apiBrands) ? apiBrands : []);
    } catch (error) {
      setBrands([]);
    }
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleCategoryClick = (category) => {
    if (selectedCategory && selectedCategory._id === category._id) {
      setSelectedCategory(null);
      const next = buildVisibleProducts(allProducts, {
        selectedCategoryId: "",
        searchQuery: productSearchQuery,
        filters: appliedProductFilters,
      });
      setProducts(next);
    } else {
      setSelectedCategory(category);
      const next = buildVisibleProducts(allProducts, {
        selectedCategoryId: category?._id ? String(category._id) : "",
        searchQuery: productSearchQuery,
        filters: appliedProductFilters,
      });
      setProducts(next);
    }
  };

  // Product selection and cart functionality---------------------------------------------------------------------------------
  const [selectedItems, setSelectedItems] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [roundedAmount, setRoundedAmount] = useState(0);
  const [totalTax, setTotalTax] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [overallDiscountPopup, setOverallDiscountPopup] = useState(false);
  const [overallDiscountType, setOverallDiscountType] = useState("Fixed");
  const [overallDiscountValue, setOverallDiscountValue] = useState("");
  const [overallDiscountAmount, setOverallDiscountAmount] = useState(0);
  const [bagCharge, setBagCharge] = useState(0);
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [draftChargeName, setDraftChargeName] = useState("Delivery Charge");
  const [draftChargeAmount, setDraftChargeAmount] = useState("");
  const additionalChargesTotal = useMemo(() => {
    return (additionalCharges || []).reduce((sum, ch) => sum + (Number(ch?.amount) || 0), 0,);
  }, [additionalCharges]);

  const handleAddDraftCharge = () => {
    const name = draftChargeName;
    const amt = Math.max(Number(draftChargeAmount) || 0, 0);
    if (!name || amt <= 0) {
      toast.error("Enter extra charge amount");
      return;
    }

    setAdditionalCharges((prevCharges) => {
      const existingIndex = prevCharges.findIndex((charge) => charge.name === name);
      if (existingIndex === -1) {
        return [...prevCharges, { name, amount: amt }];
      }

      return prevCharges.map((charge, index) =>
        index === existingIndex
          ? { ...charge, amount: Number(charge.amount || 0) + amt }
          : charge
      );
    });
    setDraftChargeAmount("");
    setShowExtraCharges(false);
  };
  const handleRemoveAdditionalCharge = (name) => {
    setAdditionalCharges((prevCharges) => prevCharges.filter((charge) => charge.name !== name));
  };
  const [posSales, setPosSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    const total = selectedItems
      .filter((item) => item.isBag)
      .reduce((sum, currentBag) => sum + currentBag.totalPrice, 0);
    setBagCharge(total);
  }, [selectedItems]);

  const handleProductClick = (product) => {
    if (!product || !product._id) return;
    setSelectedItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => String(item._id) === String(product._id),);
      if (existingIndex !== -1) {
        const current = prevItems[existingIndex];
        const maxQty = Number(current.availableQuantity ?? products.find((p) => String(p._id) === String(current.productId ?? current._id),)?.quantity ?? 0,);
        const nextQty = Math.min((current.quantity || 0) + 1, maxQty);
        if (nextQty === current.quantity) {
          toast.info("Maximum available quantity reached");
          return prevItems;
        }
        const sellingPrice = Number(current.sellingPrice || 0);
        const discountValue = Number(current.discountValue || 0);
        const tax = Number(current.tax || 0);
        let actualDiscountPerUnit = 0;
        if (current.discountType === "Percentage") {
          actualDiscountPerUnit = (sellingPrice * discountValue) / 100;
        } else {
          actualDiscountPerUnit = discountValue;
        }
        const updated = prevItems.map((it, idx) => {
          if (idx !== existingIndex) return it;
          return {
            ...it,
            quantity: nextQty,
            totalPrice: nextQty * sellingPrice,
            totalDiscount: nextQty * actualDiscountPerUnit,
            totalTax: (sellingPrice * tax * nextQty) / 100,
          };
        });
        return updated;
      }
      const sellingPrice = Number(product.sellingPrice || 0);
      const discountValue = Number(product.discountAmount || 0);
      const tax = Number(product.tax || 0);
      let actualDiscountPerUnit = 0;
      if (product.discountType === "Percentage") {
        actualDiscountPerUnit = (sellingPrice * discountValue) / 100;
      } else {
        actualDiscountPerUnit = discountValue;
      }
      const available = Number(product.availableQuantity ?? product.quantity ?? 0);
      if (available <= 0) {
        toast.error("Out of stock");
        return prevItems;
      }
      const newItem = {
        ...product,
        productId: String(product._id),
        variantId: null,
        availableQuantity: available,
        warrantyPeriod: product.warrantyPeriod,
        quantity: Math.min(1, available),
        totalPrice: sellingPrice,
        totalDiscount: actualDiscountPerUnit,
        totalTax: (sellingPrice * tax) / 100,
        discountValue: discountValue,
      };
      return [...prevItems, newItem];
    });
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    const current = selectedItems.find((x) => x._id === itemId);
    if (!current) return;
    if (newQuantity <= 0) {
      setSelectedItems(selectedItems.filter((item) => item._id !== itemId));
      return;
    }
    if (current?.isSerialized) {
      const currentSerials = Array.isArray(current.selectedSerialnos)
        ? current.selectedSerialnos.map((s) => String(s))
        : (current.selectedSerialno ? [String(current.selectedSerialno)] : []);
      if (Number(newQuantity) < currentSerials.length) {
        const trimmed = currentSerials.slice(0, Number(newQuantity));
        setSelectedItems(selectedItems.map((item) => {
          if (item._id !== itemId) return item;
          const qty = trimmed.length;
          let actualDiscountPerUnit = 0;
          if (item.discountType === "Percentage") actualDiscountPerUnit = (item.sellingPrice * item.discountValue) / 100;
          else actualDiscountPerUnit = item.discountValue;
          return {
            ...item,
            quantity: qty,
            selectedSerialnos: trimmed,
            selectedSerialno: qty === 1 ? trimmed[0] : null,
            totalPrice: qty * item.sellingPrice,
            totalTax: (item.tax * qty * item.sellingPrice) / 100,
            totalDiscount: qty * actualDiscountPerUnit,
          };
        }));
        return;
      }
      if (Number(newQuantity) > currentSerials.length) {
        const productId = String(current.productId ?? "");
        const product = allProducts.find((p) => String(p._id) === productId) || products.find((p) => String(p._id) === productId);
        if (!product) {
          toast.error("Product data not available for serial selection");
          return;
        }
        const variant = current.variantId
          ? (product?.variants || []).find((v) => String(v?._id) === String(current.variantId)) || null
          : getVariantForSelection(product, current.selectedColor, current.selectedSize);
        if (!variant) {
          toast.error("Variant not available");
          return;
        }
        const variantSerials = Array.isArray(variant?.serialNumbers) ? variant.serialNumbers.filter(Boolean).map((s) => String(s)) : [];
        const availableQty = getVariantAvailableQuantity(product, variant);
        const maxAllowed = Math.min(Number(availableQty || 0), variantSerials.length || Number(availableQty || 0));
        setPopupSelectedProduct(product);
        setHighlightedProductId(product._id);
        setPopupSelectedColor(variant?.color || "");
        setPopupSelectedSize(variant?.size || "");
        setPopupActiveImageIndex(0);
        setPopupSelectedQty(Math.min(Number(newQuantity), maxAllowed));
        setPopupSelectedSerialnos(currentSerials);
        setPopupEditCartItemId(itemId);
        setPopupMode("variant");
        return;
      }
      return;
    }
    const updatedItems = selectedItems.map((item) => {
      if (item._id !== itemId) return item;
      const maxQty = Number(item.availableQuantity ?? products.find((p) => String(p._id) === String(item.productId ?? item._id),)?.quantity ?? 0,);
      const safeQty = Math.min(newQuantity, maxQty);
      let actualDiscountPerUnit = 0;
      if (item.discountType === "Percentage") actualDiscountPerUnit = (item.sellingPrice * item.discountValue) / 100;
      else actualDiscountPerUnit = item.discountValue;
      return {
        ...item,
        quantity: safeQty,
        totalPrice: safeQty * item.sellingPrice,
        totalTax: (item.tax * safeQty * item.sellingPrice) / 100,
        totalDiscount: safeQty * actualDiscountPerUnit,
      };
    });
    setSelectedItems(updatedItems);
  };

  const removeItem = (itemId) => {
    setSelectedItems(selectedItems.filter((item) => item._id !== itemId));
  };

  useEffect(() => {
    const nonBagItems = selectedItems.filter((item) => !item.isBag);
    const subtotal = nonBagItems.reduce(
      (sum, item) => sum + item.totalPrice, 0,);
    const discount = nonBagItems.reduce(
      (sum, item) => sum + item.totalDiscount, 0,);
    const tax = nonBagItems.reduce(
      (sum, item) => sum + calculateDiscountedTax(item), 0,);
    const items = nonBagItems.length;
    const quantity = nonBagItems.reduce((sum, item) => sum + item.quantity, 0);
    setSubTotal(subtotal);
    setDiscount(discount);
    setTotalTax(tax);
    setTotalItems(items);
    setTotalQuantity(quantity);
    const baseAfterItemDiscount = Math.max(subtotal - discount, 0);
    const rawOverall =
      overallDiscountType === "Percentage" ? (baseAfterItemDiscount * Math.min(Math.max(Number(overallDiscountValue) || 0, 0), 100)) / 100 : Math.max(Number(overallDiscountValue) || 0, 0);
    const overallApplied = Math.min(rawOverall, baseAfterItemDiscount);
    setOverallDiscountAmount(overallApplied);

    const calculatedTotal = subtotal - discount - overallApplied + tax + bagCharge + additionalChargesTotal;
    const pointsDeduction = Math.min(Number(appliedPoints) * 5, calculatedTotal,);
    const adjustedTotal = calculatedTotal - pointsDeduction;
    setTotalAmount(adjustedTotal);
    const decimalPart = adjustedTotal - Math.floor(adjustedTotal);
    if (decimalPart <= 0.49) {
      setRoundedAmount(Math.floor(adjustedTotal));
    } else {
      setRoundedAmount(Math.ceil(adjustedTotal));
    }
  }, [
    selectedItems,
    bagCharge,
    appliedPoints,
    overallDiscountType,
    overallDiscountValue,
    additionalChargesTotal,
  ]);

  const [amountReceived, setAmountReceived] = useState("");
  const changeToReturn = Math.max((Number(amountReceived) || 0) - roundedAmount, 0,);
  const dueAmount = Math.max(roundedAmount - (Number(amountReceived) || 0), 0);
  const amountToCoin = Math.floor(roundedAmount / 10 / 5);

  //opt structure-----------------------------------------------------------------------------------------------------------------
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const [otp, setOtp] = useState(["", "", "", ""]);

  const handleOtpChange = (index, value) => {
    if (/^[0-9]?$/.test(value)) {
      const updatedOtp = [...otp];
      updatedOtp[index] = value;
      setOtp(updatedOtp);
      if (value && index < 3) {
        otpRefs[index + 1].current.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        otpRefs[index - 1].current.focus();
      } else if (otp[index] !== "") {
        const updatedOtp = [...otp];
        updatedOtp[index] = "";
        setOtp(updatedOtp);
      }
    }
    else if (e.key === "ArrowLeft" && index > 0) {
      otpRefs[index - 1].current.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  //customers selection--------------------------------------------------------------------------------------------------------------
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchCustomers = async () => {
    try {
      const res = await api.get("/api/customers");
      setCustomers(res.data);
    } catch (err) {
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchPosSales();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    if (query.length > 10) {
      setSearchQuery("");
      setForm(prev => ({ ...prev, phone: "" }));
      return;
    }
    if (!/^[0-9]+$/.test(query)) {
      setSearchQuery("");
      setForm(prev => ({ ...prev, phone: "" }));
      return;
    }
    setSearchQuery(query);
    setForm(prev => ({ ...prev, phone: query }));
    if (query.trim() === "") {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const filtered = customers.filter((customer) => {
      const searchTerm = query.toLowerCase();
      return customer.phone?.toLowerCase().includes(searchTerm);
    });
    setSearchResults(filtered);
    setShowDropdown(filtered.length > 0);
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name || "");
    setShowDropdown(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Fetch sales transactions-------------------------------------------------------------------------------------------------
  const fetchPosSales = async (
    page = 1,
    searchQuery = "",
    statusFilter = "",
    paymentMethodFilter = "",
  ) => {
    try {
      setLoading(true);
      const response = await api.get("/api/pos-sales/transactions", {
        params: {
          page,
          limit: 10,
          ...(searchQuery?.trim() ? { search: searchQuery.trim() } : {}),
          ...(statusFilter?.trim() ? { status: statusFilter.trim() } : {}),
          ...(paymentMethodFilter?.trim()
            ? { paymentMethod: paymentMethodFilter.trim() }
            : {}),
        },
      });
      const sales = response?.data?.data;
      setPosSales(Array.isArray(sales) ? sales : []);
      const pagination = response?.data?.pagination || {};
      setTotalPages(Number(pagination.totalPages) || 1);
      setTotalSales(Number(pagination.totalSales) || 0);
      setCurrentPage(Number(pagination.currentPage) || page);
    } catch (error) {
      setPosSales([]);
      setTotalPages(1);
      setTotalSales(0);
      setCurrentPage(page);
      toast.error(error?.response?.data?.message || error?.message || "Failed to load POS transactions",);
    } finally {
      setLoading(false);
    }
  };

  // Transaction search functionality-------------------------------------------------------------------------------------------------
  const handleTransactionSearch = (query) => {
    setTransactionSearchQuery(query);
    const statusFilter = activeQuickFilter === "all" ? categoryValue : activeQuickFilter;
    const paymentMethodFilter = socketValue;
    fetchPosSales(1, query, statusFilter, paymentMethodFilter);
  };

  // Create POS sale---------------------------------------------------------------------------------------------------------------------
  const createPosSale = async (
    paymentMethod,
    amountReceived = 0,
    changeReturned = 0,
  ) => {
    let saleData;
    try {
      if (!selectedCustomer || selectedItems.length === 0) {
        toast.error("Please select a customer and items before proceeding");
        return;
      }
      const productItems = selectedItems.filter((i) => !i.isBag);
      if (productItems.length === 0) {
        toast.error("Add at least one product item before checkout");
        return;
      }
      saleData = {
        customerId: selectedCustomer._id,
        items: productItems.map((item) => ({
          productId: item.productId ?? item._id,
          variantId: item.variantId || null,
          serialNumbers: Array.isArray(item.selectedSerialnos) ? item.selectedSerialnos : (item.selectedSerialno ? [item.selectedSerialno] : []),
          quantity: Number(item.quantity),
          sellingPrice: Number(item.sellingPrice),
          totalPrice: Number(item.totalPrice),
          discountValue: Number(item.totalDiscount || 0), // Map totalDiscount to discountValue
          discountType: "Fixed", // Default to Fixed
          tax: Number(item.totalTax || 0), // Map totalTax to tax
        })),
        additionalCharges: (additionalCharges || [])
          .filter((c) => c && c.name && Number(c.amount) > 0)
          .map((c) => ({
            name: c.name,
            amount: Number(c.amount),
          })),
        overallDiscount: Number(overallDiscountAmount || 0),
        overallDiscountType: overallDiscountType || "Fixed",
        overallDiscountValue: Number(overallDiscountValue || 0),
        paymentMethod,
        amountReceived: Number(amountReceived || 0),
        changeReturned: Number(changeReturned || 0),
        bagCharge: Number(bagCharge || 0),
        subtotal: Number(subTotal || 0),
        discount: Number(discount || 0),
        tax: Number(totalTax || 0),
        totalAmount: Number(roundedAmount || 0),
        pointsUsed: Number(appliedPoints || 0),
      };
      const response = await api.post("/api/pos-sales/create", saleData);
      if (response.data.success) {
        setSelectedItems([]);
        setSelectedCustomer(null);
        setBagCharge(0);
        setAdditionalCharges([]);
        setDraftChargeAmount("");
        setOverallDiscountValue("");
        setOverallDiscountType("Fixed");
        setOverallDiscountAmount(0);
        setAmountReceived("");
        setSelectedSale(response.data.data);
        handlePaymentPopupChange();
        fetchPosSales(1, transactionSearchQuery);
        await refreshProducts();
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Error creating the sale";
      const details = error.response?.data?.details;
      if (details && typeof details === "object") {
        const errorMessages = Object.entries(details).map(([field, message]) => `${field}: ${message}`).join("\n");
        toast.error(`${msg}\n${errorMessages}`);
      } else {
        toast.error(msg);
      }
    }
  };

  // Handle Transaction popup pagination--------------------------------------------------------------------------------------------------------------------
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const statusFilter = activeQuickFilter === "all" ? categoryValue : activeQuickFilter;
      fetchPosSales(newPage, transactionSearchQuery, statusFilter, socketValue);
    }
  };

  //company details-----------------------------------------------------------------------------------------------------------------
  const [companyData, setCompanyData] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
    upiId: "",
  });

  const fetchCompanyProfile = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      const profile = res.data.data.find((bank) => bank.isDefault);
      if (profile) {
        setCompanyData({
          bankName: profile.bankName || "",
          accountHolderName: profile.accountHolderName || "",
          accountNumber: profile.accountNumber || "",
          ifsc: profile.ifsc || "",
          branch: profile.branch || "",
          upiId: profile.upiId || "",
        });
      }
    } catch (error) { }
  };

  useEffect(() => { fetchCompanyProfile(); }, []);

  const [companyDetails, setCompanyDetails] = useState({
    companyName: "",
    companyemail: "",
    companyphone: "",
    companyfax: "",
    companywebsite: "",
    companyaddress: "",
    companycountry: "",
    companystate: "",
    companycity: "",
    companypostalcode: "",
    gstin: "",
    cin: "",
    companydescription: "",
  });

  const fetchCompanyDetails = async () => {
    try {
      const res = await api.get("/api/companyprofile/get");
      const profile = res.data.data;
      if (profile) {
        setCompanyDetails({
          companyName: profile.companyName || "",
          companyemail: profile.companyemail || "",
          companyphone: profile.companyphone || "",
          companyfax: profile.companyfax || "",
          companywebsite: profile.companywebsite || "",
          companyaddress: profile.companyaddress || "",
          companycountry: profile.companycountry || "",
          companystate: profile.companystate || "",
          companycity: profile.companycity || "",
          companypostalcode: profile.companypostalcode || "",
          gstin: profile.gstin || "",
          cin: profile.cin || "",
          companydescription: profile.companydescription || "",
        });
      }
    } catch (error) { }
  };

  useEffect(() => { fetchCompanyDetails(); }, []);

  //upi qr code generation----------------------------------------------------------------------------------------------------------
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    if (companyData?.upiId && roundedAmount > 0) {
      const upiString = `upi://pay?pa=${companyData.upiId}&pn=${encodeURIComponent(companyData.companyName,)}&am=${roundedAmount}&cu=INR`;
      QRCode.toDataURL(upiString)
        .then((url) => { setQrCodeUrl(url); })
        .catch((err) => { });
    }
  }, [roundedAmount, companyData]);

  //invoice popup----------------------------------------------------------------------------------------------------------------------
  const [invoicepopup, setInvoicePopup] = useState(false);
  const InvoiceRef = useRef(null);

  const closeInvoice = () => {
    setInvoicePopup(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (InvoiceRef.current && !InvoiceRef.current.contains(event.target)) {
        closeInvoice();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const totalDiscountinvoice = selectedSale?.items?.reduce((acc, item) => acc + (item.discount || 0), 0,);
  const totalTaxinvoice = selectedSale?.items?.reduce((acc, item) => acc + (item.tax || 0), 0,);

  //print and download invoice----------------------------------------------------------------------------------------------------------------------
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = async () => {
    if (isGenerating) return;
    setInvoicePopup(true);
    setTimeout(async () => {
      if (!InvoiceRef.current) {
        toast.error("Cannot generate PDF: Invoice content is not available");
        setIsGenerating(false);
        return;
      }
      setIsGenerating(true);
      const element = InvoiceRef.current;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 297],
      });
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: true,
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 70;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 5;
        doc.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 10;
        while (heightLeft > 0) {
          doc.addPage();
          position = heightLeft - imgHeight + 5;
          doc.addImage(imgData, "PNG", 5, position, imgWidth, imgHeight);
          heightLeft -= pageHeight - 10;
        }
        doc.save("invoice.pdf");
      } catch (error) {
      } finally {
        setIsGenerating(false);
        setInvoicePopup(false);
      }
    }, 100);
  };

  const handleInvoicePrint = async () => {
    if (isGenerating) return;
    setInvoicePopup(true);
    setTimeout(async () => {
      if (!InvoiceRef.current) {
        toast.error("Cannot print: Invoice content is not available");
        setIsGenerating(false);
        return;
      }
      setIsGenerating(true);
      try {
        const canvas = await html2canvas(InvoiceRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
        <html>
          <head>
            <title>Print Invoice</title>
            <style>
              body {
                margin: 5mm;
                padding: 0;
                font-family: Arial, sans-serif;
                font-size: 10px;
                color: #333;
              }
              .invoice-container {
                max-width: 70mm;
                margin: 0 auto;
                background-color: #fff;
                padding: 5mm;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 5px;
                margin-bottom: 5px;
              }
              th, td {
                padding: 3px;
                text-align: left;
                font-size: 10px;
              }
              th {
                border-bottom: 1px solid #E1E1E1;
              }
              .text-right {
                text-align: right;
              }
              .text-center {
                text-align: center;
              }
              .section-title {
                font-size: 14px;
                font-weight: 600;
                margin-top: 5px;
              }
              .border-bottom {
                border-bottom: 1px solid #E1E1E1;
              }
              @media print {
                @page {
                  size: A5;
                  margin: 5mm;
                }
                .invoice-container {
                  box-shadow: none;
                  max-width: 70mm;
                }
                body {
                  margin: 0;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-container">
              <img src="${imgData}" style="width: 100%; height: auto;" />
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `);
        printWindow.document.close();
      } catch (error) {
      } finally {
        setIsGenerating(false);
        setInvoicePopup(false);
      }
    }, 100);
  };

  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
    priceIncludeGST: true,
    defaultGSTRate: "18",
    autoRoundOff: "0",
  });

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
      } catch (error) { }
    };
    loadTaxSettings();
  }, []);

  // Product Popup--------------------------------------------------------------------------------------------------
  const openProductPopup = (product, preferredVariant = null) => {
    if (!product) return;
    setPopupEditCartItemId(null);
    const variantsCount = Array.isArray(product?.variants) ? product.variants.length : 0;
    if (variantsCount <= 0) {
      toast.error("Out of stock");
      return;
    }
    if (variantsCount === 1) {
      const onlyVariant = preferredVariant || product.variants[0];
      const serials = Array.isArray(onlyVariant?.serialNumbers) ? onlyVariant.serialNumbers.filter(Boolean) : [];
      const availableQty = getVariantAvailableQuantity(product, onlyVariant);
      if (availableQty <= 0) {
        toast.error("Out of stock");
        return;
      }
      if (serials.length === 1) {
        addProductVariantToCart(product, onlyVariant, 1, [serials[0]]);
        focusSearchInput();
        return;
      }
      if (serials.length > 1) {
        setPopupSelectedProduct(product);
        setHighlightedProductId(product._id);
        setPopupSelectedQty(1);
        setPopupSelectedSerialnos([]);
        setPopupActiveImageIndex(0);
        setPopupSelectedColor(onlyVariant?.color || "");
        setPopupSelectedSize(onlyVariant?.size || "");
        setPopupMode("variant");
        return;
      }
      addProductVariantToCart(product, onlyVariant, 1);
      focusSearchInput();
      return;
    }
    if (Number(product.quantity || 0) <= 0) {
      toast.error("Out of stock");
      return;
    }
    setPopupSelectedProduct(product);
    setHighlightedProductId(product._id);
    setPopupSelectedQty(1);
    setPopupActiveImageIndex(0);
    const firstVariant = preferredVariant || product?.variants?.[0] || null;
    setPopupSelectedColor(firstVariant?.color || "");
    setPopupSelectedSize(firstVariant?.size || "");
    const firstSerials = Array.isArray(firstVariant?.serialNumbers) ? firstVariant.serialNumbers.filter(Boolean) : [];
    setPopupSelectedSerialnos(firstSerials.length === 1 ? [firstSerials[0]] : []);
    setPopupMode("variant");
  };

  const closeProductPopups = () => {
    setPopupMode(null);
    setPopupEditCartItemId(null);
  };

  const lastPopupVariantKeyRef = useRef("");

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

  useEffect(() => {
    if (!popupSelectedProduct) return;
    if (popupMode !== "variant") return;
    if (!popupSelectedVariant) return;
    const nextColor = popupSelectedVariant?.color || "";
    const nextSize = popupSelectedVariant?.size || "";
    if (nextColor &&
      normalizeVariantAttr(nextColor) !== normalizeVariantAttr(popupSelectedColor)
    ) {
      setPopupSelectedColor(nextColor);
    }
    if (nextSize && String(nextSize) !== String(popupSelectedSize)) {
      setPopupSelectedSize(nextSize);
    }
  }, [
    popupSelectedProduct,
    popupMode,
    popupSelectedVariant,
    popupSelectedColor,
    popupSelectedSize,
  ]);

  const popupVariantSerials = useMemo(() => {
    const serials = popupSelectedVariant?.serialNumbers;
    if (!Array.isArray(serials)) return [];
    return serials.filter(Boolean).map((s) => String(s));
  }, [popupSelectedVariant]);

  const popupIsSerialized = popupVariantSerials.length > 0;

  useEffect(() => {
    if (!popupSelectedProduct) return;
    if (popupMode !== "variant") return;
    if (!popupSelectedVariant) return;
    const variantKey = popupSelectedVariant?._id ? String(popupSelectedVariant._id) : `${normalizeVariantAttr(popupSelectedVariant?.color)}:${String(popupSelectedVariant?.size ?? "")}`;
    if (lastPopupVariantKeyRef.current === variantKey) return;
    lastPopupVariantKeyRef.current = variantKey;
    if (popupVariantSerials.length === 1) {
      setPopupSelectedQty(1);
      setPopupSelectedSerialnos([popupVariantSerials[0]]);
      return;
    }
    if (popupVariantSerials.length > 1) {
      setPopupSelectedQty(1);
      setPopupSelectedSerialnos([]);
      return;
    }
    setPopupSelectedSerialnos([]);
  }, [
    popupSelectedProduct,
    popupMode,
    popupSelectedVariant,
    popupVariantSerials,
  ]);

  const popupAvailableQty = useMemo(() => {
    if (!popupSelectedProduct) return 0;
    return getVariantAvailableQuantity(popupSelectedProduct, popupSelectedVariant);
  }, [popupSelectedProduct, popupSelectedVariant]);

  useEffect(() => {
    if (popupMode !== "variant") return;
    if (!popupIsSerialized) return;
    const maxAllowed = Math.min(Number(popupAvailableQty || 0), popupVariantSerials.length || Number(popupAvailableQty || 0));
    setPopupSelectedQty((prev) => {
      const next = Math.min(Math.max(Number(prev || 1), 1), maxAllowed > 0 ? maxAllowed : 1);
      return next;
    });
    setPopupSelectedSerialnos((prev) => {
      const arr = Array.isArray(prev) ? prev.map((s) => String(s)) : [];
      const valid = arr.filter((s) => popupVariantSerials.includes(String(s)));
      return valid.slice(0, Math.max(Number(popupSelectedQty || 1), 1));
    });
  }, [popupMode, popupIsSerialized, popupAvailableQty, popupVariantSerials, popupSelectedQty]);

  useEffect(() => {
    if (!popupMode) return;
    setPopupSelectedQty((prev) => {
      const max = Number(popupAvailableQty || 0);
      if (max <= 0) return 1;
      const next = Math.min(Number(prev || 1), max);
      return next < 1 ? 1 : next;
    });
  }, [popupAvailableQty, popupMode]);

  const popupDisplayPrice = useMemo(() => {
    if (!popupSelectedProduct) return 0;
    const sellingPrice = Number(popupSelectedVariant?.sellingPrice ?? popupSelectedProduct?.sellingPrice ?? 0);
    const tax = Number(popupSelectedVariant?.tax ?? popupSelectedProduct?.tax ?? 0);
    // if (taxSettings?.priceIncludeGST) {
    //   return sellingPrice + (sellingPrice * tax) / 100;
    // }
    return sellingPrice;
  }, [popupSelectedProduct, popupSelectedVariant,]);

  const popupVariantImages = useMemo(() => {
    const imgs = popupSelectedVariant?.images?.length > 0 ? popupSelectedVariant.images : popupSelectedProduct?.images || [];
    if (!imgs || imgs.length === 0) return [DEFAULT_PRODUCT_IMAGE];
    return imgs.map((img) => img?.url || img);
  }, [popupSelectedProduct, popupSelectedVariant]);

  const increasePopupQty = () => {
    if (!popupSelectedProduct) return;
    const maxAllowed = Math.min(Number(popupAvailableQty || 0), popupIsSerialized ? popupVariantSerials.length : Number(popupAvailableQty || 0));
    if (popupSelectedQty < maxAllowed) {
      setPopupSelectedQty((prev) => prev + 1);
    }
  };

  const decreasePopupQty = () => {
    if (popupSelectedQty > 1) {
      setPopupSelectedQty((prev) => prev - 1);
    }
  };

  const handleAddProductFromPopup = () => {
    if (!popupSelectedProduct) return;
    if (!popupSelectedVariant) {
      toast.error("Variant not available");
      return;
    }
    const availableQty = getVariantAvailableQuantity(
      popupSelectedProduct,
      popupSelectedVariant,
    );
    if (availableQty <= 0) {
      toast.error("Out of stock");
      return;
    }
    const maxAllowed = Math.min(Number(availableQty || 0), popupIsSerialized ? popupVariantSerials.length : Number(availableQty || 0));
    const qtyToUse = Math.min(Math.max(Number(popupSelectedQty || 1), 1), maxAllowed > 0 ? maxAllowed : 1);
    if (popupIsSerialized) {
      const selected = Array.isArray(popupSelectedSerialnos) ? popupSelectedSerialnos.map((s) => String(s)) : [];
      const validSelected = selected.filter((s) => popupVariantSerials.includes(String(s)));
      if (validSelected.length !== qtyToUse) {
        toast.error(`Please select ${qtyToUse} serial number${qtyToUse === 1 ? "" : "s"}`);
        return;
      }
      if (popupEditCartItemId) {
        setSelectedItems((prev) => prev.map((it) => {
          if (it._id !== popupEditCartItemId) return it;
          const sellingPrice = Number(it.sellingPrice || 0);
          const tax = Number(it.tax || 0);
          const discountValue = Number(it.discountValue || 0);
          const actualDiscountPerUnit = it.discountType === "Percentage" ? (sellingPrice * discountValue) / 100 : discountValue;
          return {
            ...it,
            quantity: qtyToUse,
            selectedSerialnos: validSelected,
            selectedSerialno: qtyToUse === 1 ? validSelected[0] : null,
            totalPrice: qtyToUse * sellingPrice,
            totalDiscount: qtyToUse * actualDiscountPerUnit,
            totalTax: (sellingPrice * tax * qtyToUse) / 100,
          };
        }));
        setPopupEditCartItemId(null);
      } else {
        addProductVariantToCart(
          popupSelectedProduct,
          popupSelectedVariant,
          qtyToUse,
          validSelected,
        );
      }
    } else {
      addProductVariantToCart(
        popupSelectedProduct,
        popupSelectedVariant,
        qtyToUse,
        [],
      );
    }
    closeProductPopups();
    setShowQtyPopup(false);
    focusSearchInput();
  };

  const GotoDash = () => { navigate("/"); };
  const handleCash = () => { setCashPopup(true); };

  // add customer-----------------------------------------------------------------------------------------------------------------------------
  const [errors, setErrors] = useState({});
  const [customerSave, setCustomerSave] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const sanitizeInput = (input) => {
    if (typeof input !== "string") return input;
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };

  const validateField = (name, value) => {
    if (!value.trim()) {
      if (["name", "phone"].includes(name)) return "This field is required";
      return "";
    }

    switch (name) {
      case "name": // Allows letters with single spaces between words
        if (value.trim().length < 2) {
          return "Customer name must be at least 2 characters";
        }
        return "";
      case "phone":
        return /^\d{10}$/.test(value) ? "" : "Enter valid 10-digit phone number";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const sanitized = sanitizeInput(value);
    const error = validateField(name, sanitized);
    setErrors((prev) => ({ ...prev, [name]: error }));
    setForm((prev) => ({ ...prev, [name]: sanitized }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Customer name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (form.phone && !/^\d{10}$/.test(form.phone)) newErrors.phone = "Enter valid 10-digit phone number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCustomerSave = async () => {
    if (!validateForm()) {
      return;
    }
    setCustomerSave(true);
    try {
      await api.post("/api/customers", {
        ...form,
      });
      toast.success("Customer added successfully !!");
      setForm({
        name: "",
        phone: "",
      });
      setErrors({});
      setCustomerSave(false);
      setShowDropdown(false);
      setSearchResults([]);
      setSearchQuery("");
      setProductSearchQuery();
      setSearchDrop(false);
      await fetchCustomers();
    } catch (err) {
      setErrors(err.response.data.errors);
    } finally {
      setCustomerSave(false);
    }
  };

  // New Sale-----------------------------------------------------------------------------------------------------------------------------
  const handleNewSales = () => {
    setNewSales(false);
    setPaymentPopup(false); setSelectedSale(null); setSelectedItems([]); setSelectedCustomer(null); setBagCharge(0); setAmountReceived(''); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setSubTotal(0); setTotalAmount(0); setRoundedAmount(0); setTotalTax(0); setTotalItems(0); setTotalQuantity(0); setDiscount(0); setCashPopup(false); setCardPopup(false); setUpiPopup(false); fetchPosSales(); setSelectedCategory(null); setProducts(allProducts); setUpdown(false); setSearchDrop(false); setCategoryValue(''); setSocketValue(''); setWarehouseValue(''); setExprationValue(''); setOtp(['', '', '', '']); setCountry(''); setState(''); setCity(''); setPinCode('');
    if (formRef.current) {
      formRef.current.reset();
    }
    const initialTabs = allProducts.reduce((acc, product) => {
      acc[product._id] = "general";
      return acc;
    }, {});
    setActiveTabs(initialTabs); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setPopup(false); setAddCustomerPopup(false); setDiscountPopup(false); setTransactionPopup(false); setSelectedSale(null); setCurrentPage(1); setTotalPages(1); setTotalSales(0); setLoading(false); setPosSales([]); setAmountReceived(''); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setPopup(false); setAddCustomerPopup(false); setDiscountPopup(false); setTransactionPopup(false); setSelectedSale(null); setCurrentPage(1); setTotalPages(1); setTotalSales(0); setLoading(false); setPosSales([]); setAmountReceived(''); window.location.reload();
  };

  return (
    <div>
      <div style={{ width: "100%", height: "100vh", backgroundColor: "#F4F8FA", overflow: "hidden", }} >
        {/* navbar */}
        <div className=""
          style={{ width: "100%", padding: "12px 50px", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", }}>
          {/* company logo */}
          {companyImages ? (<span title="Company Logo" style={{ display: "flex", alignItems: "center", }} >
            <img style={{ width: "100%", height: "45px", objectFit: "contain", }} alt="Company logo"
              src={isDarkMode ? companyImages?.companyDarkLogo : companyImages?.companyLogo}
            />
          </span>
          ) : (<p>Company Logo</p>)}
          {/* menu options + user info */}
          <div style={{ fontFamily: "Inter", display: "flex", gap: "12px", flexWrap: "wrap", }} >
            {/* Hold btn */}
            <button className="header-btn" title="Pause transaction for other sale"
              onClick={handleStop}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "36px", borderRadius: "8px", padding: "8px 12px", border: "1px solid #EAEAEA", backgroundColor: "#FFFFFF", color: "#515457", fontSize: "14px", fontWeight: "500", }} >
              Hold <PiHandPalm size={20} className="header-btn-icon" />
            </button>
            <span style={{ display: "flex", color: "#A2A8B8", justifyContent: "center", alignItems: "center", fontSize: "24px", fontWeight: "100", }} > | </span>
            {/* cashier dropdown */}
            <div style={{ position: "relative" }} ref={cashierRef}>
              <div onClick={() => setOpenCashier(!openCashier)}
                style={{ display: "flex", alignItems: "center", gap: "4px", height: "36px", borderRadius: "8px", padding: "8px 8px", cursor: "pointer", border: "1px solid #EAEAEA", backgroundColor: "#FFFFFF", color: "#515457", fontSize: "14px", fontWeight: "500", width: "173px", fontFamily: "Inter", }} >
                <div style={{ width: "24px", height: "22px", borderRadius: "50%", background: "#4A6CF7", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "bold", }} >
                  {userData?.name?.charAt(0) || "User"}
                </div>
                <span style={{ color: "rgb(81, 84, 87)" }}> {userData?.name.length > 6 ? userData?.name.slice(0, 6) : userData?.name}</span>
                <span style={{ color: "#727681c4" }}> ({userData?.role?.roleName || "User Role"}) </span>
                <span style={{ fontSize: "12px" }}> <MdOutlineKeyboardArrowDown size={20} /> </span>
              </div>
              {/* Dropdown */}
              {openCashier && (<div style={{ position: "absolute", top: "100%", right: 0, borderRadius: "8px", width: "172px", boxShadow: "0px 4px 8px rgba(0,0,0,0.06), 0px 8px 20px rgba(0,0,0,0.10)", zIndex: 1000, backgroundColor: "#FFFFFF", fontSize: "14px", display: "flex", flexDirection: "column", justifyContent: "center", padding: "8px 0", }} >
                {/* All Transactions */}
                <div onMouseEnter={() => setHoverIndex(0)} onMouseLeave={() => setHoverIndex(null)}
                  onClick={() => {
                    setShowTransactionPopup(true);
                    setOpenCashier(false);
                    setHoverIndex(null);
                  }}
                  style={{
                    color: "#0E101A", cursor: "pointer", padding: "8px",
                    backgroundColor: hoverIndex === 0 ? "#9ea0a231" : "transparent",
                  }}><span>All Transactions</span>
                </div>
                {/* Damage */}
                <div onMouseEnter={() => setHoverIndex(1)} onMouseLeave={() => setHoverIndex(null)}
                  onClick={() => {
                    setDamageReportModel(true);
                    setHoverIndex(null);
                    setOpenCashier(false);
                  }}
                  style={{
                    padding: "8px", color: "#0E101A", cursor: "pointer",
                    backgroundColor: hoverIndex === 1 ? "#9ea0a231" : "transparent",
                  }}> Add Damage </div>
                {/* Calculator */}
                <div onMouseEnter={() => setHoverIndex(2)} onMouseLeave={() => setHoverIndex(null)}
                  onClick={() => {
                    setCalculatorModel(true);
                    setHoverIndex(null);
                    setOpenCashier(false);
                  }}
                  style={{
                    padding: "8px", color: "#0E101A", cursor: "pointer",
                    backgroundColor: hoverIndex === 2 ? "#9ea0a231" : "transparent",
                  }}> Calculator </div>
                {/* Logout */}
                <div onMouseEnter={() => setHoverIndex(3)} onMouseLeave={() => setHoverIndex(null)}
                  style={{
                    padding: "8px", color: "#0E101A", cursor: "pointer",
                    backgroundColor: hoverIndex === 3 ? "#9ea0a231" : "transparent",
                  }}
                  onClick={GotoDash}
                > <span>Logout</span> </div>
              </div>
              )}
            </div>
          </div>
        </div>
        {/* main pannel */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", boxSizing: "border-box", }}
          onClick={(e) => { const tag = e.target.tagName; if (!["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"].includes(tag)) { searchInputRef.current?.focus(); } }}
        >
          {/* left */}
          <div style={{ width: "77%", height: "calc(100vh - 67px)", }}>
            {/* product search bar + scanner + sort & filter buttons */}
            <div style={{ width: "100%", alignItems: "center", gap: '12px', display: "inline-flex", fontFamily: "Inter", padding: '16px 12px', backgroundColor: "white", position: 'relative' }}
              ref={searchProductRef} >
              {/* Search input */}
              {productCardView === "grid" || productCardView === "list" ? (<div style={{ flex: "1 1 0%", height: "42px", padding: "11px 12px", background: "white", borderRadius: 8, outlineOffset: "-1px", justifyContent: "flex-start", alignItems: "center", display: "flex", border: "1px solid #EAEAEA", gap: 8, }} >
                <div data-property-1="Search" > <IoIosSearch size={20} /> </div>
                <input type="search"
                  ref={searchInputRef}
                  placeholder="Search by Product Name, Item Bar Code..."
                  style={{ width: "100%", border: "none", outline: "none", color: "#515457", }}
                  value={productSearchQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    handleProductSearch(q);
                    const selected = tryAutoSelectProductByBarcode(q);
                    if (selected) {
                      handleProductSearch("");
                    }
                  }}
                />
              </div>) : (
                <div style={{ flex: "1 1 0%", height: "42px", padding: "11px 12px", background: "white", borderRadius: 8, outlineOffset: "-1px", justifyContent: "flex-start", alignItems: "center", gap: 8, display: "flex", border: "1px solid #EAEAEA", }} >
                  <div data-property-1="Search" > <IoIosSearch size={20} /> </div>
                  <input type="search"
                    ref={searchInputRef}
                    placeholder="Search by Product Name, Item Bar Code..."
                    style={{ width: "100%", border: "none", outline: "none", color: "#515457", }}
                    value={searchProductQuery}
                    onFocus={() => { if (String(searchProductQuery || "").trim()) setSearchProduct(true); }}
                    onBlur={() => { setTimeout(() => { if (!document.activeElement || document.activeElement === document.body) { searchInputRef.current?.focus(); } }, 200); }}
                    onChange={(e) => {
                      const q = e.target.value;
                      setSearchProductQuery(q);
                      setSearchProduct(Boolean(String(q).trim()));
                      tryAutoSelectProductByBarcode(q);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && searchSuggestions.length > 0) {
                        const p = searchSuggestions[0];
                        openProductPopup(p);
                        setSearchProductQuery("");
                        setSearchProduct(false);
                      }
                    }}
                  />
                </div>
              )}
              {scanning && (<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", }} >
                <div style={{ width: "90%", maxWidth: 719, height: '420px', borderRadius: 8, overflow: "hidden", position: "relative", }} >
                  <video ref={videoRef}
                    style={{ width: "100%", height: 420, objectFit: "cover", }}
                    playsInline
                    muted
                  />
                  <button onClick={stopScanner}
                    className="btn btn-danger header-btn "
                    style={{ position: "absolute", top: 8, right: 8, zIndex: 10000, }}
                  > Close </button>
                </div>
              </div>)}
              {/* Sort by btn */}
              {productCardView === "grid" || productCardView === "list" ? (<button
                ref={sortByDropdownRef}
                onClick={() => setShowSortByModel((prev) => !prev)}
                style={{ border: "1px solid #EAEAEA", padding: "11px 12px", borderRadius: "8px", backgroundColor: "#FFFFFF", color: "#515457", fontSize: "14px", fontWeight: "500", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", position: "relative", cursor: "pointer", }} >
                <MdOutlineSort size={20} />
                <span> Sort By{" "}</span>
                <MdOutlineKeyboardArrowDown size={20} />
                {showSortByModel && (
                  <PosSortByModel
                    close={() => setShowSortByModel(false)}
                    value={productSortKey}
                    onSelect={(key) => {
                      setProductSortKey(key);
                      setProducts(
                        sortProductsList(products, key),
                      );
                    }}
                    onClear={() => {
                      setProductSortKey("");
                      setProducts(
                        filterProductsList(allProducts, {
                          selectedCategoryId: selectedCategory?._id ? String(selectedCategory._id) : "",
                          searchQuery: productSearchQuery,
                          filters: appliedProductFilters,
                        }),
                      );
                    }}
                  />
                )}
              </button>) : (<></>)}
              {/* Filters btn */}
              {productCardView === "grid" || productCardView === "list" ? (<button
                ref={filterDropdownRef}
                onClick={() =>
                  setShowFilterProductsModel((prev) => {
                    const next = !prev;
                    if (next) setDraftProductFilters(appliedProductFilters);
                    return next;
                  })
                }
                style={{ border: "1px solid #EAEAEA", padding: "11px 12px", borderRadius: "8px", backgroundColor: "#FFFFFF", color: "#515457", fontSize: "14px", fontWeight: "500", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px", position: "relative", cursor: "pointer", }} >
                <LiaFilterSolid size={18} />
                <span> Filters{" "}
                  {appliedFilterCount > 0 && (<span style={{ backgroundColor: "#1F7FFF", borderRadius: "50%", height: "20px", width: "20px", color: "white", padding: "2px", fontSize: "10px", justifyContent: "center", alignItems: "center", display: "inline-flex", }} >
                    {String(appliedFilterCount).padStart(2, "0")}
                  </span>)}
                </span>
                <MdOutlineKeyboardArrowDown size={20} />
                {showFilterProductsModel && (
                  <PosFilterProductModel
                    close={() => setShowFilterProductsModel(false)}
                    categories={categories}
                    brands={brands}
                    filters={draftProductFilters}
                    onChange={setDraftProductFilters}
                    onApply={applyDropdownFilters}
                    onClear={clearDropdownFilters}
                    maxPrice={filterMaxPrice}
                  />
                )}
              </button>) : (<></>)}
              {/* View Style btn */}
              <div style={{ border: "1px solid #EAEAEA", borderRadius: "8px", backgroundColor: "#FFFFFF", height: "42px", display: "flex", alignItems: "center", overflow: "hidden", }} >
                <div onClick={() => setProductCardView("grid")} title="Card View"
                  style={{
                    padding: "9px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "40px", borderRight: '1px solid #EAEAEA',
                    backgroundColor: productCardView === "grid" ? "#0d6efd" : "transparent",
                  }} >
                  <RxDashboard size={15} color={productCardView === "grid" ? "#fff" : "#515457"} />
                </div>
                <div onClick={() => setProductCardView("list")} title="List View"
                  style={{
                    padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "40px", borderRight: '1px solid #EAEAEA',
                    backgroundColor: productCardView === "list" ? "#0d6efd" : "transparent",
                  }} >
                  <IoIosList size={20} color={productCardView === "list" ? "#fff" : "#515457"} />
                </div>
                <div onClick={() => setProductCardView("standard")} title="Standard View"
                  style={{
                    padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "40px",
                    backgroundColor: productCardView === "standard" ? "#0d6efd" : "transparent",
                  }} >
                  <MdAddShoppingCart size={20} color={productCardView === "standard" ? "#fff" : "#515457"} />
                </div>
              </div>
              {searchProduct && (
                <div style={{ position: "absolute", top: "58px", left: '12px', right: 0, maxHeight: "300px", width: "65%", overflowY: "auto", zIndex: 1000, boxShadow: '0px 5px 14px rgba(0, 0, 0, 0.10)', }}>
                  <div style={{ width: '100%', height: '100%', paddingTop: 8, paddingBottom: 8, background: 'var(--White-White-1, white)', boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.10)', borderBottomRightRadius: 8, borderBottomLeftRadius: 8, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'inline-flex' }}>
                    {searchSuggestions.length === 0 ? (
                      <div style={{ width: "100%", padding: "10px 16px", color: "#727681", fontSize: 12 }}>
                        No products found related to "{searchProductQuery}"
                      </div>
                    ) : (
                      <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                        {searchSuggestions.map((p) => {
                          const variants = Array.isArray(p?.variants) ? p.variants : [];
                          const variantPrices = variants.map((v) => Number(v?.sellingPrice) || 0);
                          const candidatePrices = [
                            Number(p?.sellingPrice) || 0,
                            ...variantPrices,
                          ].filter((n) => Number.isFinite(n) && n > 0);
                          const displayPrice = candidatePrices.length ? Math.min(...candidatePrices) : 0;
                          return (
                            <div key={p._id}
                              onClick={() => {
                                openProductPopup(p);
                                setSearchProductQuery("");
                                setSearchProduct(false);
                              }}
                              style={{ width: "100%", paddingLeft: 16, paddingRight: 16, paddingTop: 10, paddingBottom: 10, background: "white", borderBottom: "1px solid #EAEAEA", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", }} >
                              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                <div style={{ color: "#0E101A", fontSize: 14, fontWeight: 500 }}>
                                  {p.productName} </div>
                                <div style={{ color: "#727681", fontSize: 12 }}>
                                  <FaBarcode /> {p.itemBarcode || ""} </div>
                              </div>
                              <div style={{ width: 288, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ width: 94, color: "#0E101A", fontSize: 14 }}>
                                  {Number(p.quantity || 0)} {p.unit || ""}</div>
                                <div style={{ width: 112, color: "#0E101A", fontSize: 14 }}>
                                  ₹ {displayPrice.toFixed(2)} </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {productCardView === "grid" || productCardView === "list" ? (
              <div style={{ width: "100%", height: 17, color: "#515457", fontSize: 14, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word", padding: '16px 18px' }} >
                (Showing 1 – {products.length} products of {allProducts.length}{" "} products)
              </div>) : (<div></div>)}
            {/* product cards */}
            <div style={{ width: "100%", height: productCardView !== "standard" ? "calc(100% - 110px)" : "calc(100% - 80px)", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 17, display: "inline-flex", padding: productCardView !== "standard" ? '24px 0px 0px 24px' : '0px 0px 0px 0px', backgroundColor: productCardView !== "standard" ? 'transparent' : '#e4e9ecff', overflow: 'auto' }} >
              {productCardView === "grid" ? (
                <div style={{ flex: 1, overflow: "auto", display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "flex-start", alignItems: "flex-start", alignContent: "flex-start", padding: "2px 8px 20px 2px", }} >
                  {products.length === 0 ? (<span>No Product Available</span>) : (
                    products.map((product, index) => {
                      const cartQuantity = getCartQuantityForProduct(product._id);
                      return (
                        <div key={product._id}
                          id={`product-card-${product._id}`}
                          className="card-product-hover"
                          style={{ width: "184px", minHeight: "294px", background: "#FFFFFF", borderRadius: 8, border: "1px solid #DBDBDB", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "inline-flex", cursor: "pointer", position: "relative", }} >
                          {product.images && product.images.length > 0 && product.images[0] ? (<img style={{ alignSelf: "stretch", height: 130, borderTopRightRadius: 8, borderTopLeftRadius: 8, borderBottom: "1px solid #DBDBDB", objectFit: "fill", width: "100%", }} alt={product.productName || "Product"}
                            src={product.images[0].url || product.images[0]}
                          />) : (
                            <div style={{ alignSelf: "stretch", height: 130, borderTopRightRadius: 8, borderTopLeftRadius: 8, borderBottom: "1px solid #DBDBDB", width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "0px 10px 10px 10px", }}>
                              <img style={{ width: '67px', objectFit: 'contain' }} alt={product.productName || "Product"} src={DEFAULT_PRODUCT_IMAGE} /></div>)}
                          <div style={{ alignSelf: "stretch", display: "flex", flexDirection: "column", fontFamily: "Inter", padding: "12px 12px", }} >
                            <div style={{ width: "100%", overflow: "hidden", display: "flex", justifyContent: "flex-start", flexDirection: 'column', gap: 8, }} >
                              <div style={{ width: '100%', fontSize: 14, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word", color: "#0E101A", }} >
                                <div style={{ color: "#8D8D8D", fontSize: "12px", }} >
                                  {product.brand?.brandName || "Brand"} • {product.category?.categoryName || "Category"}</div>
                                {product.productName.length > 19 ? product.productName.substring(0, 22) + "..." : product.productName}
                              </div>
                              <div style={{ color: "#0E101A", fontSize: 16, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word", }} >
                                {/* {taxSettings.priceIncludeGST ? "₹" + (product.sellingPrice + (product.sellingPrice * product.tax) / 100).toFixed(2) + "" : "₹" + product.sellingPrice.toFixed(2) + "/-"} */}
                                ₹{product.sellingPrice.toFixed(2)}/-
                                <del style={{ color: "#8D8D8D", fontSize: "12px", }} > {" "}₹{((Number(product?.variants?.[0]?.sellingPrice || 0) / 100) * 170).toFixed(2)}</del>
                              </div>
                              <div style={{ color: "#888888", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px dotted grey", padding: '0px 0px 8px 0px' }} >
                                <span>{product?.variants?.length || ""} colors&nbsp;</span>
                                <span>{product?.variants?.length || ""} sizes&nbsp;</span>
                                <span style={{ color: product.quantity > 0 ? "#888888" : "red", }}>
                                  {product.quantity} <span style={{ color: "#888888" }}>{(product?.variants?.[0]?.unit || "").length > 5 ? (product?.variants?.[0]?.unit || "").substring(0, 5) + ".." : (product?.variants?.[0]?.unit || "")}</span>
                                </span>
                              </div>
                            </div>
                            <button type="submit"
                              onClick={(e) => {
                                e.stopPropagation();
                                openProductPopup(product);
                              }}
                              disabled={!product?.variants?.length || Number(product.quantity || 0) <= 0}
                              style={{
                                width: '100%', marginTop: "10px", borderRadius: "4px", fontSize: "14px", padding: "5px 5px",
                                backgroundColor: !product?.variants?.length || Number(product.quantity || 0) <= 0 ? "#e6e6e65f" : "#1F7FFF",
                                color: !product?.variants?.length || Number(product.quantity || 0) <= 0 ? "#909090ff" : "white",
                                border: !product?.variants?.length || Number(product.quantity || 0) <= 0 ? "1px solid #d3d3d35f" : "1px solid #0084FF",
                                cursor: !product?.variants?.length || Number(product.quantity || 0) <= 0 ? "not-allowed" : "pointer",
                              }}>
                              {!product?.variants?.length || Number(product.quantity || 0) <= 0 ? "Out of Stock" : product?.variants?.length === 1 ? "Add Product" : product?.variants?.[0]?.serialNumbers?.length > 0 ? "Choose Serial No" : "Choose Variant"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : productCardView === "list" ? (<div style={{ overflow: "auto", display: "flex", flexDirection: "column", gap: "16px", padding: "2px 10px 20px 2px", width: "100%", }} >
                {products.length === 0 ? (<span>No Product Available</span>) : (
                  products.map((product, index) => {
                    const cartQuantity = getCartQuantityForProduct(product._id);
                    return (
                      <div key={product._id}
                        id={`product-card-${product._id}`}
                        className="card-product-hover"
                        style={{ width: "100%", maxHeight: "80px", background: "#FFFFFF", borderRadius: 8, border: "1px solid #DBDBDB", gap: 8, display: "inline-flex", position: "relative", justifyContent: "space-between", }} >
                        {/* image + name + brand + category */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", }} >
                          {/* product image */}
                          {product.images && product.images.length > 0 && product.images[0] ? (<img style={{ alignSelf: "stretch", height: '80px', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderBottom: "1px solid #DBDBDB", objectFit: "fill", width: "100px", }} alt={product.productName || "Product"}
                            src={product.images[0].url || product.images[0]}
                          />) : (
                            <div style={{ height: '80px', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, borderBottom: "1px solid #DBDBDB", width: "100px", display: 'flex', alignItems: 'center', justifyContent: 'center', }}>
                              <img style={{ width: '67px', overflow: 'hidden', objectFit: 'fill', }} alt={product.productName || "Product"}
                                src={DEFAULT_PRODUCT_IMAGE}
                              />
                            </div>)}
                          <div>
                            <div style={{ fontSize: 14, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word", color: "#0E101A", }} >
                              {product.productName} </div>
                            <div style={{ color: "#8D8D8D", fontSize: "12px", }} >
                              {product.brand?.brandName || "Brand"} • {product.category?.categoryName || "Category"} </div>
                          </div>
                        </div>
                        {/* price + variants + quantity + choose variant button */}
                        <div style={{ display: "flex", alignItems: "center", fontFamily: "Inter", padding: "0px 10px 10px 10px", gap: "24px", }} >
                          {/* price + variants + quantity */}
                          <div style={{ textAlign: 'end' }}>
                            <div style={{ color: "#0E101A", fontSize: 14, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word", }} >
                              {/* {taxSettings.priceIncludeGST ? "₹" + (product.sellingPrice + (product.sellingPrice * product.tax) / 100).toFixed(2) + "" : "₹" + product.sellingPrice.toFixed(2) + "/-"} */}
                              ₹{product.sellingPrice.toFixed(2)}/-
                              {" "}
                              <del style={{ color: "#8D8D8D", fontSize: "12px", }} >
                                {" "} ₹{((Number(product?.variants?.[0]?.sellingPrice || 0) / 100) * 170).toFixed(2)}
                              </del>
                            </div>
                            <div style={{ color: "#888888", fontSize: "12px", fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", display: "flex", alignItems: "center", justifyContent: "space-between", }} >
                              <span>{product?.variants?.length || ""} colors •&nbsp;</span><span>{product?.variants?.length || ""} sizes •&nbsp;</span><span style={{ color: product.quantity > 0 ? "#888888" : "red", }} >{product.quantity}<span style={{ color: "#888888" }}>{product?.variants?.[0]?.unit || ""}</span></span>
                            </div>
                          </div>
                          <button type="submit"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProductPopup(product);
                            }}
                            disabled={!product?.variants?.length || Number(product.quantity || 0) <= 0}
                            style={{
                              width: '160px', borderRadius: "4px", fontSize: "14px", padding: "5px 5px",
                              backgroundColor: !product?.variants?.length || Number(product.quantity || 0) <= 0 ? "#e6e6e65f" : "#1F7FFF",
                              color: !product?.variants?.length || Number(product.quantity || 0) <= 0 ? "#909090ff" : "white",
                              border: !product?.variants?.length || Number(product.quantity || 0) <= 0 ? "1px solid #d3d3d35f" : "1px solid #0084FF",
                              cursor: !product?.variants?.length || Number(product.quantity || 0) <= 0 ? "not-allowed" : "pointer",
                            }}
                          > {!product?.variants?.length || Number(product.quantity || 0) <= 0 ? "Out of Stock" : product?.variants?.length === 1 ? "Add Product" : "Choose Variant"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              ) : (
                <table className="table-responsive" style={{ width: "100%", borderCollapse: "collapse", overflowX: "auto", }} >
                  <thead style={{ position: "sticky", top: 0, zIndex: 10, height: "38px", }} >
                    <tr style={{ background: 'var(--Sidebar, #F3F8FB)' }}>
                      <td style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: "auto", fontWeight: "400", height: '38px' }} >
                        <span style={{ padding: '0px 0px 0px 8px' }}>
                          Product Name</span> </td>
                      <td style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: "auto", fontWeight: "400", }} >
                        Serial No.</td>
                      <td style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: "auto", fontWeight: "400", }} >
                        Qty </td>
                      <td style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: "auto", fontWeight: "400", }} >
                        Unit </td>
                      <td style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: "auto", fontWeight: "400", }} >
                        Price </td>
                      <td style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: "auto", fontWeight: "400", }} >
                        Discount </td>
                      <td style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: "auto", fontWeight: "400", }} >
                        Tax </td>
                      <td style={{ textAlign: "left", padding: "4px 16px", color: "#727681", fontSize: 14, width: "auto", fontWeight: "400", }} >
                        Amount </td>
                      <td style={{ textAlign: "center", padding: "4px 16px", color: "#727681", fontSize: 14, width: "20px", fontWeight: "400", }} >
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.length === 0 ? (<tr><td colSpan="10" style={{ padding: 0, }}>
                      <div style={{ height: "79vh", display: "flex", justifyContent: "center", alignItems: "center", color: 'black' }} >
                        <div style={{ outlineOffset: "-1px", flexDirection: "column", justifyContent: "center", alignItems: "center", display: "inline-flex", overflow: 'auto' }} >
                          <div style={{ justifyContent: "center", alignItems: "center", display: "flex", marginTop: "50px", fontFamily: "Inter", }} >
                            <img style={{ width: "100%", objectFit: "contain", }} alt="Empty Cart"
                              src={EmptyBag}
                            />
                          </div>
                          <span style={{ marginTop: "10px", color: "#0E101A", fontSize: "14px", }} >
                            No items in cart. Search and add products above.</span>
                        </div>
                      </div>
                    </td></tr>
                    ) : (
                      <>
                        {selectedItems.map((item, index) => (
                          <tr style={{ backgroundColor: '#fff', borderBottom: '1px solid #E5E8ED' }} key={item._id} >
                            <td style={{ padding: "4px 16px", verticalAlign: "middle", height: '59px' }} >
                              <div style={{ display: "flex", justifyContent: 'flex-start', gap: '30px', alignItems: "center", }} >
                                <div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}><span style={{ padding: '0px 0px 0px 8px' }}>{item.productName}</span></div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: '#727681', fontSize: 12 }}><span style={{ padding: '0px 0px 0px 8px' }}><FaBarcode /> {item.itemBarcode}</span></div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", }} >
                                  {(() => {
                                    const variantText = [item.selectedColor, item.selectedSize].filter(Boolean).join(" / ") || "";
                                    const labelText = variantText || "";
                                    const borderColor = item.selectedColor || "#7CDAFF";
                                    const textColor = item.selectedColor || "#005677";
                                    return (
                                      <div>
                                        {labelText === "" ? null : <label style={{ backgroundColor: "#E6F8FF", border: `1px solid ${borderColor}`, padding: "2px 6px", borderRadius: "4px", color: textColor, fontSize: "10px", fontWeight: "400", width: "auto", height: "20px", textAlign: "center", whiteSpace: "nowrap", }} >
                                          {labelText}
                                        </label>}
                                      </div>
                                    );
                                  })()}
                                  {(() => {
                                    const expiryText = getExpiryDisplayText(item.expiryDate);
                                    if (!expiryText) return null;
                                    const isExpired = expiryText.startsWith("Expired");
                                    return (
                                      <label style={{ backgroundColor: isExpired ? "#fbd7d7ff" : "#E6F8FF", border: isExpired ? "1px solid #f85f5fff" : "1px solid #7CDAFF", padding: "2px 6px", borderRadius: "4px", color: isExpired ? "#f91f1fff" : "#005677", fontSize: "10px", fontWeight: "400", width: "auto", height: "20px", textAlign: "center", }} >
                                        {expiryText}
                                      </label>
                                    );
                                  })()}
                                  {Number(item.warrantyPeriod) > 0 && (
                                    <label style={{ backgroundColor: "#E6F8FF", border: "1px solid #7CDAFF", padding: "2px 6px", borderRadius: "4px", color: "#005677", fontSize: "10px", fontWeight: "400", width: "120px", height: "20px", textAlign: "center", }} >
                                      {`${item.warrantyPeriod} Month Warranty`}
                                    </label>)}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "4px 10px", verticalAlign: "middle", }}> <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", }} >
                                {(() => {
                                  const serials = Array.isArray(item.selectedSerialnos)
                                    ? item.selectedSerialnos
                                    : (item.selectedSerialno ? [item.selectedSerialno] : []);
                                  const serialText = serials.length > 0 ? serials.join(", ") : item.isSerialized ? "No Serial No." : "";
                                  const labelText = serialText || "-";
                                  return (
                                    <div>
                                      {labelText === "" ? null : <label style={{ padding: "2px 6px", borderRadius: "4px", color: 'black', fontSize: "14px", fontWeight: "400", width: "auto", height: "20px", textAlign: "center", whiteSpace: "nowrap", }} >
                                        {labelText}
                                      </label>}
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            </td>
                            <td style={{ padding: "4px 16px", verticalAlign: "middle", }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}>
                                <div style={{ border: "1px solid #EAEAEA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", }} >
                                  <button onClick={() => updateItemQuantity(item._id, item.quantity - 1,)}
                                    disabled={item.quantity <= 1}
                                    style={{
                                      background: "#F8F9FB", border: "1px solid #EAEAEA", padding: "10px", fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px",
                                      cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
                                      opacity: item.quantity <= 1 ? 0.5 : 1,
                                    }}
                                  > <FiMinus /> </button>
                                  <div style={{ fontSize: "12px", fontWeight: 500, color: "#111827", }} > {String(item.quantity).padStart(2, "0")}</div>
                                  <button onClick={() => updateItemQuantity(item._id, item.quantity + 1,)}
                                    style={{ background: "#F8F9FB", border: "1px solid #EAEAEA", padding: "10px", cursor: "pointer", fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", borderTopRightRadius: "8px", borderBottomRightRadius: "8px", }} >
                                    <FiPlus />
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "4px 16px", verticalAlign: "middle", }}> <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}>
                              {item.unit || ""}</div>
                            </td>
                            <td style={{ padding: "4px 16px", verticalAlign: "middle", }}> <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}>
                              ₹ {item.sellingPrice}</div>
                            </td>
                            <td style={{ padding: "4px 16px", verticalAlign: "middle", }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}>
                                ₹ {(() => {
                                  const qty = Number(item?.quantity) || 0;
                                  const totalDiscount = Number(item?.totalDiscount) || 0;
                                  const perUnit = qty > 0 ? totalDiscount / qty : 0;
                                  return Number.isFinite(perUnit) ? perUnit.toFixed(2) : "0.00";
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: "4px 16px", verticalAlign: "middle", }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}>
                                ₹ {(() => {
                                  const qty = Number(item?.quantity) || 0;
                                  const totalTax = Number(calculateDiscountedTax(item)) || 0;
                                  const perUnit = qty > 0 ? totalTax / qty : 0;
                                  return Number.isFinite(perUnit) ? perUnit.toFixed(2) : "0.00";
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: "4px 16px", verticalAlign: "middle", }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}>
                                ₹ {(() => {
                                  const qty = Number(item?.quantity) || 0;
                                  const sellingPrice = Number(item?.sellingPrice) || 0;
                                  const totalDiscount = Number(item?.totalDiscount) || 0;
                                  const totalTax = Number(calculateDiscountedTax(item)) || 0;
                                  const discountPerUnit = qty > 0 ? totalDiscount / qty : 0;
                                  const taxPerUnit = qty > 0 ? totalTax / qty : 0;
                                  const perUnitTotal = Math.max(sellingPrice - (Number.isFinite(discountPerUnit) ? discountPerUnit : 0), 0) + (Number.isFinite(taxPerUnit) ? taxPerUnit : 0);
                                  return Number.isFinite(perUnitTotal) ? perUnitTotal.toFixed(2) : "0.00";
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: "4px 16px", verticalAlign: "middle", }}> <div style={{ display: "flex", alignItems: "center", gap: 12, color: 'black', fontSize: 14 }}>
                              <button onClick={() => removeItem(item._id)}
                                style={{ background: "none", border: "none", color: "#6C748C", cursor: "pointer", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", fontWeight: "600", }}
                                title="Remove item"
                              ><RiDeleteBinLine className="text-danger fs-4" /></button></div>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {/* right */}
          <div style={{ width: "23%", top: 8, backgroundColor: "#FAFAFA", padding: "12px", display: "flex", flexDirection: "column", justifyContent: productCardView !== "standard" ? "space-between" : "flex-start", }}>
            {/* customer details */}
            <div style={{ width: "100%", left: 0, marginTop: "16px", outlineOffset: "-1px", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", display: "inline-flex", }} >
              <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 4, display: "flex", }} >
                <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 4, display: "flex", position: "relative", }} >
                  <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "space-between", }} >
                    <div> <span style={{ color: "var(--Black-Black, #0E101A)", fontSize: 12, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                      Customer Name </span><span style={{ color: "var(--Danger, #D00003)", fontSize: 12, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} > * </span> </div>
                    {selectedCustomer && (<div style={{ cursor: "pointer", }} onClick={handleClearCustomer}> <RiDeleteBinLine /> </div>)}
                  </div>
                  {/*-----------------------when customer is added--------------------------*/}
                  <div style={{ height: '66px', width: '100%', alignSelf: "stretch", padding: '8px 16px', background: "white", borderRadius: 8, outline: "1px var(--White-Stroke, #EAEAEA) solid", outlineOffset: "-1px", justifyContent: "space-between", alignItems: "center", }}>
                    {selectedCustomer ? (
                      <div style={{ height: '46px', gap: '6px', display: "flex", flexDirection: "column", }} >
                        <div style={{ flexDirection: "column", justifyContent: "center", alignItems: "flex-start", display: "inline-flex", }} >
                          <div style={{ color: "var(--Black-Black, #0E101A)", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                            {selectedCustomer.name} | {selectedCustomer.phone || "No Phone"}
                          </div>
                        </div>
                        {/* customer coins and its details */}
                        <div style={{ width: '100%', display: "flex", justifyContent: "space-between", alignItems: "center", gap: '8px' }} >
                          <div style={{ justifyContent: "flex-start", alignItems: "flex-end", gap: 4, display: "inline-flex", }} >
                            <div style={{ color: "#1E1E1E", fontSize: 14, fontFamily: "Inter", fontWeight: "500", }} > 🪙 </div>
                            <div style={{ color: "var(--Black-Black, #0E101A)", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              {selectedCustomer.availablePoints} points
                            </div>
                          </div>
                          <div>
                            {selectedCustomer.totalDueAmount === 0 && (<div style={{ color: "var(--Danger, green)", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              To Collect: ₹ {selectedCustomer.balance.toFixed(2)}/- </div>)}
                            {selectedCustomer.totalDueAmount > 0 && (<div style={{ color: "var(--Danger, #D00003)", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              Due: ₹ {selectedCustomer.totalDueAmount.toFixed(2)}/- </div>)}
                          </div>
                          {selectedItems.length === 0 ||
                            selectedCustomer.availablePoints === 0 ? (<button style={{ padding: "1px 6px", background: "#1f80ff7e", border: "1px solid #1f80ff48", color: "white", borderRadius: 4, textDecoration: "none", fontSize: "14px", display: "flex", gap: "8px", alignItems: "center", cursor: "not-allowed", }} >
                              Apply </button>
                          ) : (
                            <button onClick={() => setApplycoinpopup(true)} style={{ padding: "1px 6px", background: "#1F7FFF", border: "1px solid #1F7FFF", color: "white", borderRadius: 4, textDecoration: "none", fontSize: "14px", display: "flex", gap: "8px", alignItems: "center", cursor: "pointer", }} >
                              Apply </button>
                          )}
                          {applycoinpopup && (
                            <div onClick={() => setApplycoinpopup(false)} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.27)", backdropFilter: "blur(1px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999999, }} >
                              <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "white", width: "auto", padding: "20px", borderRadius: "8px", overflow: "auto", display: "flex", flexDirection: "column", gap: "10px", }} >
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", }} >
                                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#0E101A", }} > Shopping Points </span>
                                  <span style={{ fontSize: "13px", fontWeight: "500", }} > Available to redeem - 🪙 <span style={{ color: "#1F7FFF" }}> {selectedCustomer.availablePoints < amountToCoin ? "0" : amountToCoin} points</span></span>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px", justifyContent: "start", marginTop: "6px", }} >
                                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#0E101A", }} > Apply Points </span>
                                  <div style={{ display: "flex", flexDirection: "row", gap: "4px", }} >
                                    <input type="radio"
                                      id="applypointsfull"
                                      checked={applyFull}
                                      onChange={() => {
                                        setApplyFull(true);
                                        const fullPoints = Math.floor(Number(amountToCoin) || 0,);
                                        setPointsToApply(fullPoints);
                                      }}
                                    />
                                    <label for="applypointsfull" style={{ fontSize: "13px", fontWeight: "500", }} > Full </label>
                                  </div>
                                </div>
                                <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center", }} >
                                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#0E101A", }} > Enter Points: </span>
                                  <div className="" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px", width: "100px", border: "1px solid #565657ff", padding: "6px 4px", borderRadius: 4, }} >
                                    <input type="number"
                                      id="enterpoints"
                                      placeholder="0"
                                      max={Math.floor(Number(amountToCoin) || 0)}
                                      value={pointsToApply}
                                      onChange={(e) => {
                                        setApplyFull(false);
                                        const fullPoints = Math.floor(Number(amountToCoin) || 0,);
                                        const raw = Math.floor(Math.max(0, Number(e.target.value) || 0),);
                                        const clamped = Math.min(raw, fullPoints);
                                        setPointsToApply(clamped);
                                      }}
                                      style={{ width: "100%", border: "none", outline: "none", }}
                                    />
                                    <span>🪙</span>
                                  </div>
                                  <span>=</span>
                                  <div className="" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "4px", width: "100px", border: "1px solid #565657ff", padding: "6px 6px", borderRadius: 4, }} >
                                    <span style={{ width: "100%", border: "none", outline: "none", fontSize: "14px", fontWeight: "600", color: "#0E101A", }} > {pointsToApply * 5} </span>
                                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#1F7FFF", }} > ₹ </span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "end", }}>
                                  <div onClick={() => {
                                    const maxPoints = Math.floor(Number(amountToCoin) || 0,);
                                    const requested = applyFull ? maxPoints : Math.floor(Number(pointsToApply) || 0);
                                    const clamped = Math.max(0, Math.min(requested, maxPoints),);
                                    setAppliedPoints(clamped);
                                    setApplycoinpopup(false);
                                  }}
                                    style={{ padding: "6px 15px", backgroundColor: "#1368EC", borderRadius: "8px", color: "white", cursor: "pointer", }} >
                                    <span>Apply</span>
                                  </div>
                                </div>
                              </div>
                            </div>)}
                        </div>
                      </div>
                    ) : (<>
                      <div style={{ width: '100%', height: '46px', marginTop: '5px' }}  >
                        <div style={{ color: "var(--Black-Black, #0E101A)", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "0px", }} >
                          <input type="number"
                            placeholder="Enter Phone No..."
                            value={searchQuery}
                            maxLength={10}
                            onChange={handleSearchChange}
                            style={{ width: "100%", border: "none", outline: 'none', height: '40px', background: "transparent", fontSize: 16, fontFamily: "Inter", fontWeight: "400", }}
                          />
                        </div>
                      </div>
                      {showDropdown && searchResults.length > 0 && (<div style={{ position: "absolute", top: "90px", left: 0, right: 0, backgroundColor: "white", border: "1px solid #E1E1E1", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: "300px", width: "100%", overflowY: "auto", zIndex: 1000, }} >
                        {searchResults.map((customer) => (
                          <div key={customer._id}
                            onClick={() => handleCustomerSelect(customer)}
                            style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", display: "flex", flexDirection: "column", gap: "4px", }} >
                            <div style={{ fontWeight: "600", color: "#333" }}>
                              {customer.name || "No Name"} </div>
                            <div style={{ fontSize: "11px", color: "#666" }}>
                              {customer.phone || "No Phone"} </div>
                          </div>))}
                      </div>)}
                      {searchResults.length === 0 && searchQuery.length > 0 && (<div style={{ position: "absolute", top: "90px", left: 0, right: 0, backgroundColor: "white", border: "1px solid #E1E1E1", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: "300px", width: "100%", overflowY: "auto", padding: "12px 16px", borderBottom: "1px solid #f0f0f0", cursor: "pointer", display: "flex", flexDirection: "column", justifyContent: "center", gap: "4px", zIndex: 1000, textAlign: "center", }} >
                        <span> <img src={no_customer} alt="no_customer" /> </span>
                        <span> No customer found by "{searchQuery}" this number.</span>
                        <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', textAlign: 'left' }}>
                          <input type="text"
                            placeholder="Enter Full Name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            className="form-control supplierinput shadow-none"
                            style={{ backgroundColor: "#F5F5F5", border: "1px solid #EAEAEA", padding: "10px 12px", borderRadius: "8px", }}
                          />
                          {errors.name && (<small className="text-danger">{errors.name}</small>)}
                          <input type="tel"
                            placeholder="Enter Phone No."
                            maxLength={10}
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            className="form-control supplierinput shadow-none"
                            style={{ backgroundColor: "#F5F5F5", border: "1px solid #EAEAEA", padding: "10px 12px", borderRadius: "8px", }}
                          />
                          {errors.phone && (<small className="text-danger">{errors.phone}</small>)}
                        </div>
                        <button onClick={handleCustomerSave}
                          disabled={customerSave}
                          style={{ backgroundColor: "#1F7FFF", border: "1px solid #1F7FFF", padding: "10px 12px", borderRadius: "8px", color: "white", }} >
                          <IoMdAddCircleOutline style={{ fontSize: 24 }} /> {customerSave ? "Adding..." : "Add Customer"}
                        </button>
                      </div>
                      )} </>)}
                  </div>
                </div>
              </div>
            </div>
            {/* cart items + pricing */}
            {productCardView === "grid" || productCardView === "list" ? (<div>
              {selectedItems.length === 0 ? (<div style={{ width: "100%", height: "calc(100vh - 200px)", paddingLeft: 24, paddingRight: 24, paddingTop: 16, paddingBottom: 16, marginTop: "16px", background: "white", borderRadius: 8, outline: "1px #EAEAEA solid", outlineOffset: "-1px", flexDirection: "column", justifyContent: "center", alignItems: "center", display: "inline-flex", overflow: 'auto' }} >
                <div style={{ justifyContent: "center", alignItems: "center", display: "flex", backgroundColor: "white", marginTop: "50px", fontFamily: "Inter", }} >
                  <img style={{ width: "100%", objectFit: "contain", }} alt="Empty Cart"
                    src={EmptyBag}
                  />
                </div>
                <span style={{ marginTop: "10px", marginBottom: "50px", color: "#0E101A", fontSize: "14px", }} >
                  Your Cart is Empty! </span>
              </div>
              ) : (
                <div style={{
                  width: "100%", paddingTop: 10, flexDirection: "column", alignItems: "center", display: "inline-flex", justifyContent: "space-between",
                  height: selectedCustomer ? 'calc(100vh - 210px)' : 'calc(100vh - 200px)',
                }} >
                  {/* selected products */}
                  <div style={{
                    alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", display: "flex", overflowY: "auto",
                    height: showPriceBreakup ? "calc(100vh - 580px)" : "calc(100vh - 360px)",
                  }}
                  > {selectedItems.map((item, index) => (
                    <div key={item._id} style={{ alignSelf: "stretch", justifyContent: "center", alignItems: "center", gap: 16, display: "flex", }} >
                      <div style={{ width: "100%", paddingBottom: '10px' }}>
                        <div style={{ width: "100%", justifyContent: "space-between", display: "flex", flexDirection: "column", fontFamily: "Inter", backgroundColor: "white", border: "1px solid #EAEAEA", borderRadius: "8px", padding: "5px", boxShadow: "0px 0px 1px 0px rgba(0, 0, 0, 0.10)", }} >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", paddingBottom: "10px" }} >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", }} >
                              <span style={{ width: "40px", height: "40px" }} >
                                {item.images && item.images.length > 0 && item.images.slice(0, 1).map((img, idx) => (
                                  <img key={idx} alt={`thumb-${idx}`} style={{ border: "1px solid #EAEAEA", width: "40px", height: "40px", objectFit: "fill", borderRadius: "8px", cursor: "pointer", }}
                                    src={img?.url || img}
                                  />))}
                                {item.images.length == 0 && (
                                  <img style={{ border: "1px solid #EAEAEA", width: "40px", height: "40px", objectFit: "fill", borderRadius: "8px", cursor: "pointer", }}
                                    src={DEFAULT_PRODUCT_IMAGE}
                                  />)}
                              </span>
                              <span style={{ display: "flex", flexDirection: "column", gap: "5px", }} >
                                <label style={{ color: "#0E101A", fontSize: "14px", fontWeight: "400", }} >
                                  {" "}{item.productName.length > 15 ? item.productName.slice(0, 15) + "..." : item.productName}{" "}
                                </label>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", }} >
                                  {(() => {
                                    const variantText = [item.selectedColor, item.selectedSize].filter(Boolean).join(" / ") || "";
                                    const serials = Array.isArray(item.selectedSerialnos)
                                      ? item.selectedSerialnos
                                      : (item.selectedSerialno ? [item.selectedSerialno] : []);
                                    const serialText = serials.length > 0 ? serials.join(", ") : item.isSerialized ? "No Serial No." : "";
                                    const labelText = serialText || variantText || "";
                                    const useSerialStyle = Boolean(serialText);
                                    const borderColor = useSerialStyle ? "#7CDAFF" : item.selectedColor || "#7CDAFF";
                                    const textColor = useSerialStyle ? "#005677" : item.selectedColor || "#005677";
                                    return (
                                      <div>
                                        {labelText === "" ? null : <label style={{ backgroundColor: "#E6F8FF", border: `1px solid ${borderColor}`, padding: "2px 6px", borderRadius: "4px", color: textColor, fontSize: "10px", fontWeight: "400", width: "auto", height: "20px", textAlign: "center", whiteSpace: "nowrap", }} >
                                          {labelText}
                                        </label>}
                                      </div>
                                    );
                                  })()}
                                  {(() => {
                                    const expiryText = getExpiryDisplayText(item.expiryDate);
                                    if (!expiryText) return null;
                                    const isExpired = expiryText.startsWith("Expired");
                                    return (
                                      <label style={{ backgroundColor: isExpired ? "#fbd7d7ff" : "#E6F8FF", border: isExpired ? "1px solid #f85f5fff" : "1px solid #7CDAFF", padding: "2px 6px", borderRadius: "4px", color: isExpired ? "#f91f1fff" : "#005677", fontSize: "10px", fontWeight: "400", width: "auto", height: "20px", textAlign: "center", }} >
                                        {expiryText}
                                      </label>
                                    );
                                  })()}
                                  {Number(item.warrantyPeriod) > 0 && (<label style={{ backgroundColor: "#E6F8FF", border: "1px solid #7CDAFF", padding: "2px 6px", borderRadius: "4px", color: "#005677", fontSize: "10px", fontWeight: "400", width: "120px", height: "20px", textAlign: "center", }} >
                                    {`${item.warrantyPeriod} Month Warranty`}
                                  </label>)}
                                </div>
                              </span>
                            </div>
                            <button onClick={() => removeItem(item._id)} title="Remove item" style={{ background: "none", border: "none", color: "#6C748C", cursor: "pointer", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", fontWeight: "600", }}
                            > ✕ </button>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", }} >
                            <div style={{ border: "1px solid #EAEAEA", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", }} >
                              <button onClick={() => updateItemQuantity(item._id, item.quantity - 1,)}
                                disabled={item.quantity <= 1}
                                style={{
                                  background: "#F8F9FB", border: "1px solid #EAEAEA", padding: "10px", fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", borderTopLeftRadius: "8px", borderBottomLeftRadius: "8px",
                                  cursor: item.quantity <= 1 ? "not-allowed" : "pointer",
                                  opacity: item.quantity <= 1 ? 0.5 : 1,
                                }}
                              > <FiMinus /> </button>
                              <div style={{ fontSize: "12px", fontWeight: 500, color: "#111827", }} > {String(item.quantity).padStart(2, "0")}</div>
                              <button onClick={() => updateItemQuantity(item._id, item.quantity + 1,)}
                                style={{ background: "#F8F9FB", border: "1px solid #EAEAEA", padding: "10px", cursor: "pointer", fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", borderTopRightRadius: "8px", borderBottomRightRadius: "8px", }} >
                                <FiPlus />
                              </button>
                            </div>
                            <div style={{ color: "#0E101A", fontSize: 14, fontFamily: "Inter", fontWeight: "600", wordWrap: "break-word", }} >
                              ₹ {item.sellingPrice}
                            </div>
                          </div>
                          <div style={{ justifyContent: "center", alignItems: "center", gap: 10, display: "flex", cursor: "pointer", }}
                            onClick={() => handleProductDiscountClick(item)}>
                            <div style={{ overflow: "hidden", justifyContent: "center", alignItems: "center", display: "flex", gap: "5px", }} >
                              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, }}
                              ></div>
                              <div style={{ alignSelf: "stretch", color: "#515457", fontSize: 14, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word", }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>))}
                  </div>
                  {/* Price block */}
                  <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 5, display: "flex", marginTop: "15px", border: "1px solid #EAEAEA", fontFamily: "Inter", boxShadow: "0px 0px 1px 0px rgba(0, 0, 0, 0.10)", borderTopLeftRadius: "10px", borderTopRightRadius: "10px", borderBottomRightRadius: "5px", borderBottomLefttRadius: "5px", padding: "5px 12px", backgroundColor: "white", }} >
                    <div style={{ position: "relative", width: "100%" }}>
                      <div style={{ position: "absolute", top: "-20px", left: "30%", border: "1px solid #A2A8B8", borderRadius: "4px", padding: "2px 8px", backgroundColor: "white", }} >
                        {!showPriceBreakup && (<span onClick={() => setShowPriceBreakup(true)}
                          style={{ color: "#0E101A", fontSize: "12px", cursor: "pointer", backgroundColor: "white", display: "flex", alignItems: "center", justifyContent: "center", }}
                        > Show Details <RiArrowDropUpLine />
                        </span>)}
                        {showPriceBreakup && (<div style={{ display: "flex", justifyContent: "end", alignItems: "center", width: "100%", cursor: "pointer", backgroundColor: "white", }} >
                          <span onClick={() => setShowPriceBreakup(false)}
                            style={{ color: "#0E101A", fontSize: "12px", cursor: "pointer", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", }}
                          > Hide Details <RiArrowDropDownLine />
                          </span>
                        </div>)}
                      </div>
                      {showPriceBreakup && (<>
                        <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 5, display: "flex", color: "#565656", padding: "10px 0px", }} >
                          <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              Sub Total </div>
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              ₹{subTotal.toFixed(2)} </div>
                          </div>
                          <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              Discount </div>
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              - ₹{discount.toFixed(2)} </div>
                          </div>
                          <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              Taxes </div>
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              + ₹{totalTax.toFixed(2)} </div>
                          </div>
                          {bagCharge > 0 && (
                            <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                              <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                                Bag Charges </div>
                              <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                                + ₹{bagCharge} </div>
                            </div>)}
                          {overallDiscountAmount > 0 && (<div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              Overall Discount </div>
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              - ₹{overallDiscountAmount.toFixed(2)} </div>
                          </div>)}
                          {appliedPoints > 0 && (
                            <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                              <div style={{ color: "#656B71", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                                Points Applied </div>
                              <div style={{ color: "#101010", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                                🪙{pointsToApply} = ₹{pointsToApply * 5} </div>
                            </div>
                          )}
                          <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                            <div style={{ color: "#656B71", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              Round Off </div>
                            <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                              ₹{(roundedAmount - (subTotal - discount - overallDiscountAmount + totalTax + bagCharge + additionalChargesTotal)).toFixed(2)} </div>
                          </div>
                          {additionalCharges.map((charge) => (
                            <div key={charge.name} style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                              <span style={{ color: "#565656", fontSize: 14 }}> {charge.name} </span>
                              <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                <span style={{ color: "#565656", fontSize: 14 }}> + ₹{Number(charge.amount || 0).toFixed(2)} </span>
                                <span onClick={() => handleRemoveAdditionalCharge(charge.name)}
                                  style={{ color: "#D00003", textDecoration: "underline", fontSize: "12px", cursor: "pointer", }} >
                                  Remove </span>
                              </span>
                            </div>
                          ))}
                          <div style={{
                            display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", overflow: "hidden", transition: "all 0.3s ease",
                            opacity: showExtraCharges ? 1 : 0,
                            maxHeight: showExtraCharges ? "100px" : "0px",
                          }} >
                            <select name="" id=""
                              value={draftChargeName}
                              onChange={(e) => {
                                const name = e.target.value;
                                setDraftChargeName(name);
                              }}
                              style={{ border: "none", outline: "none", background: "none", color: "rgb(101, 107, 113)", fontSize: "13px", }} >
                              <option value="Delivery Charge">Delivery Charge</option>
                              <option value="Shipping Charge">Shipping Charge</option>
                              <option value="Packing Charge">Packing Charge</option>
                              <option value="Adjustment">Adjustment</option>
                            </select>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px", }} >
                              ₹{" "}
                              <input type="number"
                                placeholder="0"
                                minLength={0}
                                value={draftChargeAmount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setDraftChargeAmount(value);
                                }}
                                style={{ border: "1px solid rgb(162, 168, 184)", fontSize: "12px", color: "black", backgroundColor: "white", borderRadius: "4px", width: "40px", outline: 'none', padding: '1px 0px 1px 3px' }}
                              />
                              <span onClick={handleAddDraftCharge}
                                style={{ border: "1px solid rgb(162, 168, 184)", borderRadius: "4px", padding: "0px 6px", fontSize: "12px", cursor: "pointer", color: "#0E101A", backgroundColor: "white", }} >
                                Add </span>
                              <span onClick={() => {
                                setShowExtraCharges(false);
                                setDraftChargeAmount("");
                              }}
                                style={{ color: "red", fontSize: "10px", cursor: "pointer", }} > X </span>
                            </span>
                          </div>
                        </div>
                        <div style={{ borderTop: "1px dotted grey", borderBottom: "1px dotted grey", display: "flex", justifyContent: "space-between", padding: "12px 0px", }} >
                          <button onClick={() => setShowExtraCharges(!showExtraCharges)}
                            style={{ border: "1px solid #A2A8B8", padding: "5px 5px", borderRadius: "8px", color: "#727681", backgroundColor: "#FFFFFF", fontSize: "12px", }}>
                            Add Extra Charges {showExtraCharges ? "-" : "+"} </button>
                          <div onClick={() => setOverallDiscountPopup(true)}
                            style={{ border: "1px solid #A2A8B8", padding: "5px 5px", borderRadius: "8px", color: "#727681", backgroundColor: "#FFFFFF", fontSize: "12px", cursor: "pointer", display: 'flex', alignItems: 'center' }}>
                            Overall Discount </div>
                          <button onClick={() => setShowPosCouponModel(true)}
                            style={{ border: "1px solid #A2A8B8", padding: "5px 5px", borderRadius: "8px", color: "#727681", backgroundColor: "#FFFFFF", fontSize: "12px", }}>
                            Apply Coupons + </button>
                        </div>
                      </>
                      )}
                    </div>
                    <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "flex", textAlign: "end", }} >
                      <div style={{ color: "#0E101A", fontSize: 14, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word", }} > Grand Total</div>
                      <div style={{ color: "#0E101A", fontSize: 18, fontFamily: "Inter", fontWeight: "500", wordWrap: "break-word", }} >
                        ₹{roundedAmount}
                        <div style={{ color: "#8D8D8D", fontSize: "12px" }}>{totalItems} item{totalItems.length > 1 ? 's' : ''} • {totalQuantity} unit{totalQuantity > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    {!proceedToPay && (
                      <button onClick={() => { checkPaymentPopup() }}
                        style={{
                          display: "flex", justifyContent: "center", alignItems: "center", padding: "8px 12px", borderRadius: "8px", color: "white", marginTop: "16px", border: "1px solid #1368EC", width: "100%", cursor: "pointer",
                          backgroundColor: selectedCustomer && selectedItems.length > 0 ? "#1F7FFF" : "#5991e6ff",
                        }}>
                        <span style={{ fontSize: "14px", }}> Proceed to Pay <FaArrowRightLong style={{ fontSize: 16 }} /> </span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>) : (
              // standard mode
              <div style={{ display: 'flex', justifyContent: 'space-between', flexDirection: 'column', height: 'calc(100vh - 195px)' }}>
                <div>
                  {selectedItems.length !== 0 ? (<><div style={{ display: 'flex', alignItems: 'center', height: '24px', width: '100%' }}><div style={{ width: '100%', background: 'var(--Black-Disable, #A2A8B8)', height: '1px' }} /></div>
                    <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 5, display: "flex", color: "#565656", padding: "10px 0px", }} >
                      <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          Sub Total </div>
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          ₹{subTotal.toFixed(2)} </div>
                      </div>
                      <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          Discount </div>
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          - ₹{discount.toFixed(2)} </div>
                      </div>
                      <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          Taxes </div>
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          + ₹{totalTax.toFixed(2)} </div>
                      </div>
                      {bagCharge > 0 && (
                        <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                          <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                            Bag Charges </div>
                          <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                            + ₹{bagCharge} </div>
                        </div>)}
                      {overallDiscountAmount > 0 && (<div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          Overall Discount </div>
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          - ₹{overallDiscountAmount.toFixed(2)} </div>
                      </div>)}
                      {appliedPoints > 0 && (<div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                        <div style={{ color: "#656B71", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          Points Applied </div>
                        <div style={{ color: "#101010", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          🪙{pointsToApply} = ₹{pointsToApply * 5} </div>
                      </div>
                      )}
                      <div style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                        <div style={{ color: "#656B71", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          Round Off </div>
                        <div style={{ color: "#565656", fontSize: 14, fontFamily: "Inter", fontWeight: "400", wordWrap: "break-word", }} >
                          ₹{(roundedAmount - (subTotal - discount - overallDiscountAmount + totalTax + bagCharge + additionalChargesTotal)).toFixed(2)} </div>
                      </div>
                      {additionalCharges.map((charge) => (<div key={charge.name} style={{ alignSelf: "stretch", justifyContent: "space-between", alignItems: "center", display: "inline-flex", }} >
                        <span style={{ color: "#565656", fontSize: 14 }}> {charge.name} </span>
                        <span style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ color: "#565656", fontSize: 14 }}> + ₹{Number(charge.amount || 0).toFixed(2)} </span>
                          <span onClick={() => handleRemoveAdditionalCharge(charge.name)}
                            style={{ color: "#D00003", textDecoration: "underline", fontSize: "12px", cursor: "pointer", }} >
                            Remove
                          </span>
                        </span>
                      </div>
                      ))}
                      <div style={{
                        display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", overflow: "hidden", transition: "all 0.3s ease",
                        opacity: showExtraCharges ? 1 : 0,
                        maxHeight: showExtraCharges ? "100px" : "0px",
                      }}
                      >
                        <select name="" id=""
                          value={draftChargeName}
                          onChange={(e) => {
                            const name = e.target.value;
                            setDraftChargeName(name);
                          }}
                          style={{ border: "none", outline: "none", background: "none", color: "rgb(101, 107, 113)", fontSize: "14px", }} >
                          <option value="Delivery Charge">Delivery Charge</option>
                          <option value="Shipping Charge">Shipping Charge</option>
                          <option value="Packing Charge">Packing Charge</option>
                          <option value="Adjustment">Adjustment</option>
                        </select>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", }} >
                          ₹{" "}
                          <input type="number"
                            placeholder="0"
                            minLength={0}
                            value={draftChargeAmount}
                            onChange={(e) => {
                              const value = e.target.value;
                              setDraftChargeAmount(value);
                            }}
                            style={{ border: "1px solid rgb(162, 168, 184)", fontSize: "12px", color: "black", backgroundColor: "white", borderRadius: "4px", width: "40px", outline: 'none', padding: '1px 0px 1px 3px' }}
                          />
                          <span onClick={handleAddDraftCharge}
                            style={{ border: "1px solid rgb(162, 168, 184)", borderRadius: "4px", padding: "0px 6px", fontSize: "12px", cursor: "pointer", color: "#0E101A", backgroundColor: "white", }} >
                            Add </span>
                          <span onClick={() => {
                            setShowExtraCharges(false);
                            setDraftChargeAmount("");
                          }}
                            style={{ color: "red", fontSize: "10px", cursor: "pointer", }} > X </span>
                        </span>
                      </div>
                      {/* <div style={{ border: "1px dotted #0D6828", backgroundColor: "#E0FFEA", width: "100%", padding: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "8px", }} >
                        <span style={{ display: "flex", alignItems: "center", gap: "3px", }} >
                          <span style={{ color: "#0D6828", fontSize: "14px" }} > Coupon Applied: </span>
                          <span style={{ color: "#0D6828", fontSize: "14px", fontWeight: "700", }} > NEW50 </span>
                          <span style={{ color: "#D00003", textDecoration: "underline", fontSize: "12px", }} >Remove</span>
                        </span>
                        <span style={{ color: "#0D6828", fontSize: "14px", fontWeight: "700", }} > -₹56</span>
                      </div> */}
                    </div></>) : (<div></div>)}
                  <div style={{ display: 'flex', alignItems: 'center', height: '24px', width: '100%' }}><div style={{ width: '100%', border: '1px dashed var(--Black-Disable, #A2A8B8)', height: '1px' }} /></div>
                  <div style={{ width: '100%', justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex' }}>
                    <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word' }}>
                      Grand Total</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 20, fontFamily: 'Inter', fontWeight: '500', wordWrap: 'break-word' }}>
                        ₹{roundedAmount}</div>
                      <div style={{ color: "#8D8D8D", fontSize: "12px" }}>
                        {totalItems} item {totalItems.length > 1 ? 's' : ''} • {totalQuantity} unit{totalQuantity > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', height: '24px', width: '100%' }}><div style={{ width: '100%', border: '1px dashed var(--Black-Disable, #A2A8B8)', height: '1px' }} /></div>
                  <div style={{ width: '100%', alignItems: 'center', gap: 16, display: "grid", justifyContent: 'space-between', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    {selectedCustomer && selectedItems.length > 0 ? (<div onClick={() => setOverallDiscountPopup(true)} style={{ height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                      <div style={{ color: 'black', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', }}>
                        Discount </div>
                    </div>) : (<div style={{ height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'not-allowed' }}>
                      <div style={{ color: 'var(--Black-Disable, #A2A8B8)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', }}>
                        Discount</div>
                    </div>)}
                    {selectedCustomer && selectedItems.length > 0 ? (<div onClick={() => setShowPosCouponModel(true)} style={{ height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                      <div style={{ color: 'var(--Black-Disable, #A2A8B8)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', }}>
                        Coupon</div>
                    </div>) : (<div style={{ height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'not-allowed' }}>
                      <div style={{ color: 'var(--Black-Disable, #A2A8B8)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', }}>
                        Coupon</div>
                    </div>)}
                    {selectedCustomer && selectedItems.length > 0 ? (<div onClick={() => setShowExtraCharges(!showExtraCharges)} style={{ height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                      <div style={{ color: 'black', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', }}>
                        Charges</div>
                    </div>) : (<div style={{ height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'not-allowed' }}>
                      <div style={{ color: 'var(--Black-Disable, #A2A8B8)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', }}>
                        Charges</div>
                    </div>)}
                  </div>
                </div>
                <div style={{ width: '100%', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 16, display: 'inline-flex' }}>
                  <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex' }}>
                    <div style={{ width: 127.66, height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex' }}>
                      <div style={{ color: 'var(--Black-Disable, #A2A8B8)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                        Cash Drawer</div>
                    </div>
                    <div onClick={() => { checkPaymentPopup() }} style={{ flex: '1 1 0', height: 66, padding: 8, backgroundColor: selectedCustomer && selectedItems.length > 0 ? "#1F7FFF" : "#5991e6ff", borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                      <div className="hoverProceed" style={{ color: 'var(--White-White-1, white)', fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word', }}>
                        Proceed To Pay <FaArrowRightLong style={{ fontSize: 16 }} /></div>
                    </div>
                  </div>
                  <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex' }}>
                    <div onClick={() => setNewSales(true)} style={{ flex: '1 1 0', height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                      <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                        + New</div>
                    </div>
                    <div onClick={() => setShowPosCustomerlistModel(true)} style={{ flex: '1 1 0', height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                      <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                        Customer</div>
                    </div>
                    <div style={{ flex: '1 1 0', height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex' }}>
                      <div style={{ textAlign: 'center', color: 'var(--Black-Disable, #A2A8B8)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                        Salesperson</div>
                    </div>
                  </div>
                  <div style={{ alignSelf: 'stretch', justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'inline-flex' }}>
                    {selectedItems.length > 0 ? (<div style={{ flex: '1 1 0', height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}
                      onClick={() => { setDamageReportModel(true); setHoverIndex(null); }}>
                      <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                        Damage</div>
                    </div>) : (
                      <div style={{ flex: '1 1 0', height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                        <div style={{ color: 'var(--Black-Disable, #A2A8B8)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                          Damage</div>
                      </div>)}
                    {selectedItems.length > 0 ? (<div onClick={() => setReturnModel(true)} style={{ flex: '1 1 0', height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                      <div style={{ color: 'black', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                        Return</div>
                    </div>) : (
                      <div style={{ flex: '1 1 0', height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                        <div style={{ color: 'var(--Black-Disable, #A2A8B8)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                          Return</div>
                      </div>)}
                    <div onClick={() => navigate(`/add-product`, { state: { from: location.pathname } })}
                      style={{ flex: '1 1 0', height: 66, padding: 8, background: 'var(--White-White-1, white)', borderRadius: 8, outline: '1px var(--White-Stroke, #EAEAEA) solid', outlineOffset: '-1px', justifyContent: 'center', alignItems: 'center', gap: 8, display: 'flex', cursor: 'pointer' }}>
                      <div style={{ color: 'var(--Black-Black, #0E101A)', fontSize: 14, fontFamily: 'Inter', fontWeight: '400', wordWrap: 'break-word' }}>
                        Inventory</div>
                    </div>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      {/* new sales model */}
      {newSales && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, }}>
        <div style={{ width: "370px", background: "white", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", boxSizing: "border-box", borderRadius: "8px", fontFamily: "Inter", padding: '24px', gap: '12px' }}>
          <span style={{ color: 'black' }}>Start a New Sale ?</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', wordWrap: 'break-word' }}>All items currently in the cart will be removed.</span>
            <span style={{ fontSize: '12px', wordWrap: 'break-word' }}>Do you want to continue?</span>
          </div>
          <div style={{ padding: "12px 0px 0px 0px", display: "flex", gap: "15px" }}>
            <div style={{ width: '100px', height: '35px', border: "1px solid #A2A8B8", backgroundColor: "#FFFFFF", borderRadius: "6px", color: "#727681", display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={() => setNewSales(false)}> Cancel </div>
            <div style={{ width: '100px', height: '35px', border: "1px solid #A2A8B8", backgroundColor: "#1368EC", borderRadius: "6px", color: "#fff", display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              onClick={handleNewSales}> Confirm </div>
          </div>
        </div>
      </div>)}

      {/* customer list model */}
      {showPosCustomerlistModel && (<PosCustomerlist onClose={() => setShowPosCustomerlistModel(false)} />)}

      {/* apply coupon model */}
      {showPosCouponModel && (<PosCouponModel onClose={() => setShowPosCouponModel(false)} />)}

      {/* transaction details popup */}
      {showTransactionPopup && (
        <PosTransaction
          searchdrop={searchdrop}
          activeQuickFilter={activeQuickFilter}
          handleSearchDropChange={handleSearchDropChange}
          handleClear={handleClear}
          loading={loading}
          posSales={posSales}
          currentPage={currentPage}
          totalSales={totalSales}
          totalPages={totalPages}
          handlePopupClose={handlePopupClose}
          handleQuickFilter={handleQuickFilter}
          handlePageChange={handlePageChange}
        />)}

      {/* choose variant popup */}
      {popupMode && popupSelectedProduct && (
        <ProductPopup
          selectedProduct={popupSelectedProduct}
          productImages={popupVariantImages}
          activeImageIndex={popupActiveImageIndex}
          setActiveImageIndex={setPopupActiveImageIndex}
          productColors={popupSelectedProduct.colors?.length > 0 ? popupSelectedProduct.colors : popupSelectedProduct.variants?.length > 0 ? [...new Set(popupSelectedProduct.variants.map((v) => v.color).filter(Boolean),),] : [""]}
          productSerialno={popupVariantSerials}
          selectedSerialnos={popupSelectedSerialnos}
          setSelectedSerialnos={setPopupSelectedSerialnos}
          productLot={popupSelectedProduct.lot || []}
          selectedColor={popupSelectedColor}
          setSelectedColor={setPopupSelectedColor}
          productSizes={popupSelectedProduct.sizes?.length > 0 ? popupSelectedProduct.sizes : popupSelectedProduct.variants?.length > 0 ? [...new Set(popupSelectedProduct.variants.map((v) => v.size).filter(Boolean),),] : [""]}
          selectedSize={popupSelectedSize}
          setSelectedSize={setPopupSelectedSize}
          selectedQty={popupSelectedQty}
          increaseQty={increasePopupQty}
          decreaseQty={decreasePopupQty}
          disableQty={false}
          onClose={closeProductPopups}
          price={popupDisplayPrice}
          mrp={popupSelectedVariant?.mrp ?? null}
          unit={popupSelectedVariant?.unit ?? popupSelectedProduct?.unit}
          expiryText={getExpiryDisplayText(popupSelectedVariant?.expiryDate)}
          mode={popupMode}
          onPrimaryClick={handleAddProductFromPopup}
          primaryLabel={popupEditCartItemId ? "Update Product" : "Add Product"}
          availableQty={popupAvailableQty}
        />)}

      {/* damage return popup */}
      {showDamageReportModel && (<CreateDamageModal closeModal={() => setDamageReportModel(false)} />)}

      {/* calculator model */}
      {showCalculatorModel && (<Calculator closeModal={() => setCalculatorModel(false)} />)}

      {/* return model */}
      {showReturnModel && (<PosReturn closeModal={() => setReturnModel(false)} />)}

      {/* Payment Settlement Model */}
      {showPaymentPopup && (<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999, }}
        onClick={onClose}>
        <div style={{ width: "100%", maxWidth: "451px", background: "white", display: "flex", flexDirection: "column", position: "relative", boxSizing: "border-box", borderRadius: "8px", fontFamily: "Inter", color: "#0e101a" }}
          onClick={(e) => e.stopPropagation()}>
          <div style={{ backgroundColor: "#F6F9FA", padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", borderBottom: "1px solid #EAEAEA", borderTopLeftRadius: "8px", borderTopRightRadius: "8px", }} >
            <label htmlFor="">Payment Settlement</label> <FiX onClick={onClose} style={{ cursor: "pointer" }} />
          </div>
          <div style={{ padding: "0px 12px", display: "flex", flexDirection: 'column', marginTop: "18px", marginBottom: "18px" }}>
            {cashPopup ? (<div style={{ width: "430px", background: "#F6F9FA", borderRadius: "14px", padding: "14px 14px 12px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "1px solid #E5E5E5", fontFamily: "Inter, sans-serif", }} >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", }} >
                <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#1E1E1E", }} > Cash Payment </h2>
              </div>
              <div style={{ background: "#EAF1F6", borderRadius: "0 0 0 0", padding: "14px 14px 12px 14px", minHeight: "126px", }} >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", }} >
                  <div style={{ width: "255px" }}>
                    <label style={{ display: "block", fontSize: "10px", color: "#4B5563", marginBottom: "6px", }} >Receive Amount</label>
                    <div style={{ position: "relative", width: "100%", }} >
                      <input type="text"
                        placeholder="Enter Amount"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        style={{ width: "100%", height: "28px", border: "1px solid #E5E7EB", borderRadius: "5px", outline: "none", padding: "0 42px 0 10px", fontSize: "11px", background: "#FFFFFF", color: "#111827", boxSizing: "border-box", }} />
                      <button style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", height: "18px", width: "30px", border: "none", borderRadius: "5px", background: "#1E90FF", color: "#fff", fontSize: "10px", fontWeight: 500, padding: "0 6px", cursor: "pointer", }}
                        onClick={() => setAmountReceived(roundedAmount)}>
                        Full </button>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => {
                        if (amountReceived && Number(amountReceived) > 0) {
                          createPosSale(
                            "Cash",
                            Number(amountReceived),
                            changeToReturn,
                          );
                          setCashPopup(false);
                          setShowPaymentPopup(false);
                          handleClearCustomer();
                        } else { alert("Please enter a valid amount received"); }
                      }}
                        style={{ marginTop: "30px", background: "#1E90FF", color: "#fff", border: "none", borderRadius: "5px", fontSize: "11px", fontWeight: 500, padding: "7px 12px", cursor: "pointer", boxShadow: "1px 1px 3px 0 rgba(0,0,0,0.25)", }} >
                        Cash Received </button>
                      <button onClick={() => setCashPopup(false)}
                        style={{ marginTop: "30px", background: "#aeb0b1ff", color: "#fff", border: "none", borderRadius: "5px", fontSize: "11px", fontWeight: 500, padding: "7px 12px", cursor: "pointer", boxShadow: "1px 1px 3px 0 rgba(0,0,0,0.25)", }} >
                        Cancel </button>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: "140px", paddingTop: "2px", }} >
                    <div style={{ fontSize: "13px", fontStyle: "italic", color: "#8A8F98", marginBottom: "6px", }} > Total Bill </div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: "#111827", lineHeight: 1, }} > ₹{roundedAmount}</div>
                  </div>
                </div>
              </div>
            </div>
            ) : (<>
              <div style={{ backgroundColor: "#1F7FFF", borderRadius: "12px", padding: "24px", width: "100%", border: '1px solid #A2A8B8', textAlign: "center", color: "#FFFFFF", height: "100px", flexDirection: "column", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <label htmlFor="" style={{ fontWeight: "600", fontSize: "25px" }}>₹{roundedAmount}</label>
                <label htmlFor="" style={{ fontWeight: "400", fontSize: "14px" }}>Total Payable Amount</label>
              </div>
              <div style={{ paddingBottom: "20px", paddingTop: "20px" }}>
                <label htmlFor="" style={{ color: "#0E101A", fontSize: "14px", fontWeight: "400", marginBottom: "10px" }}>Select Payment Mode</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", columnGap: "24px", rowGap: "24px", }}>
                  <div onClick={handleCash} style={{ cursor: "pointer", borderRadius: "12px", border: "1px solid #A2A8B8", width: "100%", padding: "24px", color: "#0E101A", fontSize: "16px", fontWeight: "400", display: 'flex', flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    <img src={cash_icon} alt="cash_icon" />
                    Cash
                  </div>
                  <div onClick={() => {
                    setSelectedPaymentMethod('upi');
                    handleUpiPopupChange();
                  }}
                    style={{ cursor: "pointer", borderRadius: "12px", border: "1px solid #A2A8B8", width: "100%", padding: "24px", color: "#0E101A", fontSize: "16px", fontWeight: "400", display: 'flex', flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    <img src={upi_icon} alt="upi_icon" />
                    UPI
                  </div>
                  <div style={{ cursor: "not-allowed", borderRadius: "12px", border: "1px solid #A2A8B8", width: "100%", padding: "24px", color: "#0E101A", fontSize: "16px", fontWeight: "400", display: 'flex', flexDirection: "column", justifyContent: "center", alignItems: "center" }}
                  // onClick={() => {
                  //   setSelectedPaymentMethod('card');
                  //   handleCardPopupChange();
                  // }}
                  ><img src={card_icon} alt="card_icon" />
                    Card
                  </div>
                  <div style={{ cursor: "not-allowed", borderRadius: "12px", border: "1px solid #A2A8B8", width: "100%", padding: "24px", color: "#0E101A", fontSize: "16px", fontWeight: "400", display: 'flex', flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    <img src={split_icon} alt="split_icon" />
                    Split
                  </div>
                </div>
                <div style={{ borderBottom: "1px dashed #A2A8B8", width: "100%", height: "1px", marginTop: "10px" }}></div>
              </div>
              <div style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: '16px' }}>
                <button onClick={onClose} style={{ borderRadius: "8px", padding: "8px 12px", border: " 1px solid #A2A8B8", color: "#727681", backgroundColor: "#FFFFFF" }}>Cancel</button>
                <button style={{ borderRadius: "8px", width: "100%", padding: "8px 12px", border: "1px solid #1F7FFF", color: "#FFFFFF", backgroundColor: "#1F7FFF" }}>Complete Transaction</button>
              </div>
            </>)}
          </div>
        </div>
      </div>)}

      {/* upi payment popup */}
      {upipopup && (<div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.27)", backdropFilter: "blur(1px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999999, }} >
        <div ref={UpiRef} style={{ width: "400px", padding: "10px 16px", overflowY: "auto", backgroundColor: "#fff", border: "1px solid #E1E1E1", borderRadius: "8px", }} >
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 0px", }} >
            <div style={{ textAlign: "center" }}>
              <div> <img src={Upi} alt="UPI" style={{ width: "200px", marginTop: "10px" }} /></div>
              <div style={{ width: "108%", marginTop: "10px", background: "linear-gradient(to right, #E3EDFF, #FFFFFF)", marginLeft: "-24px", marginRight: "-24px", padding: "10px 16px", }} >
                <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", }} >
                  <span style={{ fontSize: "20px", fontWeight: "600" }}> {companyDetails.companyName} </span>
                </div>
              </div>
              <div style={{ fontSize: "24px", fontWeight: "600", marginBottom: "20px", marginTop: "10px", color: "#1368EC", }} >
                ₹{roundedAmount}.00
              </div>
              <div style={{ margin: "auto", width: "50%" }}>
                <div style={{ padding: "0px", border: "2px dashed #ccc", borderRadius: "8px", marginBottom: "20px", }} >
                  <img src={qrCodeUrl} alt="QR Code" style={{ width: "100%", height: "100%" }} />
                </div>
              </div>
              <div style={{ padding: "12px 24px", backgroundColor: "#1368EC", color: "white", borderRadius: "8px", cursor: "pointer", display: "inline-block", }}
                onClick={() => {
                  createPosSale(
                    "UPI",
                    Number(roundedAmount),
                    changeToReturn,
                  );
                  setUpiPopup(false);
                  handleClearCustomer();
                }}>
                Complete </div>
              <div>
                <img src={Banks} alt="UPI" style={{ width: "350px", marginTop: "20px" }} />
              </div>
            </div>
          </div>
        </div>
      </div>)}

      {/* add card popup */}
      {cardpopup && (<div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.27)", backdropFilter: "blur(1px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999999, }} >
        <div ref={CardRef} style={{ width: "500px", padding: "10px 16px", overflowY: "auto", backgroundColor: "#fff", border: "1px solid #E1E1E1", borderRadius: "8px", }} >
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #E1E1E1", padding: "10px 0px", }} >
            <span>Enter Card details</span>
            <div style={{ position: "relative", top: "-5px", right: "-2px" }} >
              <span style={{ backgroundColor: "red", color: "white", padding: "5px 11px", borderRadius: "50%", cursor: "pointer", fontSize: "15px", }}
                onClick={closeCard} >
                x </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0px", width: "100%", gap: "15px", marginTop: "5px", }} >
            <div style={{ width: "100%" }}>
              <span>Card Number</span>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 15px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "1px solid #E6E6E6", width: "100%", marginTop: "5px", }} >
                <input type="text"
                  placeholder="1234567890123456"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  maxLength={16}
                  style={{ border: "none", outline: "none", width: "100%", backgroundColor: "#F9FAFB", }}
                  required
                />
              </div>
              {cardNumber && cardNumber.length !== 16 && (<div style={{ fontSize: "12px", color: "red", marginTop: "2px", }} > Card number must be exactly 16 digits </div>)}
            </div>
            <div style={{ width: "100%" }}>
              <span>Name on Card</span>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 15px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "1px solid #E6E6E6", width: "100%", marginTop: "5px", }} >
                <input type="text"
                  placeholder="Enter Card Holder Name"
                  value={cardHolderName}
                  onChange={handleCardHolderNameChange}
                  style={{ border: "none", outline: "none", width: "100%", backgroundColor: "#F9FAFB", }}
                  required
                />
              </div>
              {cardHolderName && !/^[a-zA-Z\s]+$/.test(cardHolderName) && (<div style={{ fontSize: "12px", color: "red", marginTop: "2px", }} > Name should contain only letters and spaces </div>)}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0px", width: "50%", gap: "15px", marginTop: "2px", }} >
            <div style={{ width: "100%" }}>
              <span>Valid till</span>
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 15px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "1px solid #E6E6E6", width: "100%", marginTop: "5px", }} >
                <input type="text"
                  placeholder="MM/YY"
                  value={validTill}
                  onChange={handleValidTillChange}
                  maxLength={5}
                  style={{ border: "none", outline: "none", width: "100%", backgroundColor: "#F9FAFB", }}
                  required
                />
              </div>
              {validTill && validTill.length > 0 && validTill.length < 5 && (<div style={{ fontSize: "12px", color: "red", marginTop: "2px", }} >Format: MM/YY (e.g., 12/25) </div>)}
            </div>
            <div style={{ width: "100%" }}>
              <span>CVV</span>
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 15px", backgroundColor: "#F9FAFB", borderRadius: "10px", border: "1px solid #E6E6E6", width: "100%", marginTop: "5px", }} >
                <input type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={handleCvvChange}
                  maxLength={3}
                  style={{ border: "none", outline: "none", width: "100%", backgroundColor: "#F9FAFB", }}
                  required
                />
              </div>
              {cvv && cvv.length !== 3 && (<div style={{ fontSize: "12px", color: "red", marginTop: "2px", }} > CVV must be exactly 3 digits </div>)}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px", marginBottom: "8px", }} >
            <div></div>
            <div style={{ padding: "3px 10px", backgroundColor: "white", border: "2px solid #E6E6E6", borderRadius: "8px", color: "#676767", }} >
              <span>Send OTP</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "8px", }} >
            <div style={{ display: "flex", gap: "15px" }}>
              {otp.map((digit, idx) => (
                <input key={idx} type="text"
                  maxLength="1"
                  value={digit}
                  ref={otpRefs[idx]}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  placeholder="0"
                  style={{ color: "#C2C2C2", width: "60px", height: "60px", textAlign: "center", borderRadius: "8px", padding: "8px", backgroundColor: "#F5F5F5", outline: "none", border: "none", fontSize: "50px", }}
                />
              ))}
            </div>
            <div style={{ marginTop: "10px", fontSize: "14px" }}>
              <span>Have not received the OTP? </span> <span style={{ color: "#1368EC" }}>Send again</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", marginBottom: "8px", }} >
            <div></div>
            <div style={{ padding: "3px 10px", backgroundColor: "#1368EC", border: "2px solid #E6E6E6", borderRadius: "8px", color: "white", cursor: "pointer", }}
              onClick={() => {
                createPosSale("Card");
                setCardPopup(false);
              }}
            ><span>Proceed to Pay</span>
            </div>
          </div>
        </div>
      </div>)}

      {/* product discount change popup */}
      {discountpopup && (<div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.27)", backdropFilter: "blur(1px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999999, }} >
        <div ref={DiscountRef} style={{ width: "700px", padding: "10px 16px", overflowY: "auto", backgroundColor: "#fff", border: "1px solid #E1E1E1", borderRadius: "8px", }} >
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #E1E1E1", padding: "10px 0px", }} >
            <div style={{ display: "flex", alignItems: "center", gap: "15px", }} >
              <div style={{ display: "flex", justifyContent: "center", backgroundColor: "white", width: "80px", height: "80px", alignItems: "center", borderRadius: "8px", overflow: "hidden", border: "2px solid #E6E6E6", }} >
                {selectedItemForDiscount.images && selectedItemForDiscount.images.length > 0 && selectedItemForDiscount.images[0] ? (
                  <img src={selectedItemForDiscount.images[0].url || selectedItemForDiscount.images[0]}
                    alt={selectedItemForDiscount.productName}
                    style={{ height: "100%", width: "100%", objectFit: "contain", maxWidth: "100%", maxHeight: "100%", }}
                    onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                  />
                ) : null}
                <div style={{
                  flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "24px",
                  display: selectedItemForDiscount.images && selectedItemForDiscount.images.length > 0 && selectedItemForDiscount.images[0] ? "none" : "flex",
                }} > <span style={{ fontSize: "10px" }}>No Image</span>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: "5px" }}>
                  <span style={{ color: "black", fontWeight: "600", fontSize: "20px", }} > {selectedItemForDiscount?.productName || "N/A"}</span>
                </div>
                <div style={{ display: "flex", gap: "15px", justifyContent: "space-around", alignItems: "center", }} >
                  <div style={{ marginBottom: "5px" }}>
                    <span style={{ color: "#676767" }}> Qty Available:{" "}</span>
                    <span>
                      {(() => {
                        const product = products.find(
                          (p) => p._id === selectedItemForDiscount._id,
                        );
                        return product ? product.quantity : "N/A";
                      })()}
                    </span>
                    <span>
                      {(() => {
                        const product = products.find(
                          (p) => p._id === selectedItemForDiscount._id,
                        );
                        return product ? product.unit : "N/A";
                      })()}
                    </span>
                  </div>
                  <div style={{ marginBottom: "5px" }}>
                    <span style={{ color: "#676767" }}>Rate: </span>
                    <span>₹{selectedItemForDiscount.sellingPrice} /-</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ position: "relative", top: "-5px", right: "-2px" }} >
              <span style={{ backgroundColor: "red", color: "white", padding: "5px 11px", borderRadius: "50%", cursor: "pointer", fontSize: "15px", }}
                onClick={closeDiscount} >
                x </span>
            </div>
          </div>
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", gap: "50px", marginTop: "15px", }} >
            <div style={{ width: "50%", display: "flex", justifyContent: "space-between", alignItems: "center", }} > <span style={{ fontSize: "25px", fontWeight: "500" }}> Quantity </span>
            </div>
            <div style={{ width: "25%", display: "flex", ustifyContent: "center", padding: "10px 0px", gap: "15px", marginTop: "2px", alignItems: "center", }} ></div>
            <div style={{ width: "25%", display: "flex", justifyContent: "center", padding: "10px 0px", gap: "15px", marginTop: "2px", alignItems: "center", }} >
              <button style={{
                display: "flex", borderRadius: "8px", alignItems: "center", justifyContent: "center", padding: "5px 12px",
                border: discountQuantity <= 1 ? "1px solid #E6E6E6" : "1px solid #E6E6E6",
                backgroundColor: discountQuantity <= 1 ? "white" : "#F9FAFB",
                cursor: discountQuantity <= 1 ? "not-allowed" : "pointer",
              }}
                onClick={() => handleQuantityChange(discountQuantity - 1)}
                disabled={discountQuantity <= 1} >
                - </button>
              <div><span>{discountQuantity}</span></div>
              <button style={{
                borderRadius: "8px", border: "1px solid #E6E6E6", backgroundColor: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", padding: "5px 12px",
                cursor: discountQuantity >= (selectedItemForDiscount.availableQuantity || 0) ? "not-allowed" : "pointer",
              }}
                onClick={() => handleQuantityChange(discountQuantity + 1)}
                disabled={discountQuantity >= (selectedItemForDiscount.availableQuantity || 0)} >
                + </button>
            </div>
          </div>
          {/* discount */}
          <div style={{ width: "100%", display: "flex", justifyContent: "space-between", }} >
            <div style={{ width: "50%", display: "flex", justifyContent: "space-between", alignItems: "center", }} >
              <span style={{ fontSize: "25px", fontWeight: "500" }}> Discount </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0px", width: "50%", gap: "15px", marginTop: "2px", alignItems: "center", }} >
              <div style={{ width: "100%", borderRadius: "8px", border: "1px solid #E6E6E6", backgroundColor: "#F9FAFB", display: "flex", alignItems: "center", }} >
                <div style={{ display: "flex", justifyContent: "center", padding: "10px 15px", backgroundColor: "white", borderRadius: "10px", borderRight: "1px solid #E6E6E6", width: "70%", }} >
                  <input type="number"
                    placeholder="00.00"
                    value={discountPercentage}
                    onChange={(e) => handleDiscountPercentageChange(e.target.value)}
                    style={{ border: "none", outline: "none", width: "100%", backgroundColor: "white", }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", width: "30%", justifyContent: "center", }} >
                  <span>%</span>
                </div>
              </div>
              <div> <span>or</span></div>
              <div style={{ width: "100%", borderRadius: "8px", border: "1px solid #E6E6E6", backgroundColor: "#F9FAFB", display: "flex", alignItems: "center", }} >
                <div style={{ display: "flex", justifyContent: "center", padding: "10px 15px", backgroundColor: "white", borderRadius: "10px", borderRight: "1px solid #E6E6E6", width: "70%", }} >
                  <input type="number"
                    placeholder="00.00"
                    value={discountFixed}
                    onChange={(e) =>
                      handleDiscountFixedChange(e.target.value)
                    }
                    style={{ border: "none", outline: "none", width: "100%", backgroundColor: "white", }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", width: "30%", justifyContent: "center", }} >
                  <span>₹</span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", marginBottom: "8px", }} >
            <div></div>
            <div style={{ padding: "3px 10px", backgroundColor: "#1368EC", border: "2px solid #E6E6E6", borderRadius: "8px", color: "white", cursor: "pointer", }}
              onClick={applyDiscountChanges}
            ><span>Apply</span>
            </div>
          </div>
        </div>
      </div>)}

      {overallDiscountPopup && (<div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.27)", backdropFilter: "blur(1px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999999, }} >
        <div style={{ width: "420px", padding: "16px 16px", backgroundColor: "white", borderRadius: "10px", border: "1px solid #E6E6E6", }} >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "16px", fontWeight: 600 }}> Overall Discount </span>
            <span onClick={() => setOverallDiscountPopup(false)} style={{ cursor: "pointer" }}
            > <FiX size={18} /> </span>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button onClick={() => setOverallDiscountType("Fixed")}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #E6E6E6", cursor: "pointer",
                backgroundColor: overallDiscountType === "Fixed" ? "#E5F0FF" : "white",
              }}
            > Amount (₹)</button>
            <button onClick={() => setOverallDiscountType("Percentage")}
              style={{
                flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid #E6E6E6", cursor: "pointer",
                backgroundColor: overallDiscountType === "Percentage" ? "#E5F0FF" : "white",
              }}
            > Percentage (%) </button>
          </div>
          <div style={{ marginTop: "14px" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "10px 15px", backgroundColor: "white", borderRadius: "10px", border: "1px solid #E6E6E6", width: "100%", }} >
              <input type="number"
                placeholder={overallDiscountType === "Percentage" ? "0" : "0.00"}
                value={overallDiscountValue}
                onChange={(e) => setOverallDiscountValue(e.target.value)}
                style={{ border: "none", outline: "none", width: "100%", backgroundColor: "white", }}
              />
            </div>
            <div style={{ marginTop: "10px", color: "#565656", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Current subtotal</span> <span>₹{Number(subTotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Item discount</span> <span>- ₹{Number(discount || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Overall discount</span> <span>- ₹{Number(overallDiscountAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", }} >
            <button onClick={() => {
              setOverallDiscountType("Fixed");
              setOverallDiscountValue("");
              setOverallDiscountPopup(false);
            }}
              style={{ padding: "8px 12px", backgroundColor: "#E5F0FF", borderRadius: "8px", color: "#1F7FFF", cursor: "pointer", border: 'none' }} >
              Clear
            </button>
            <button onClick={() => setOverallDiscountPopup(false)}
              style={{ padding: "8px 12px", backgroundColor: "#1368EC", border: "1px solid #1368EC", borderRadius: "8px", color: "white", cursor: "pointer", }} >
              Apply Discount
            </button>
          </div>
        </div>
      </div>)}

      {/* paymentpopup */}
      {paymentpopup && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.27)", backdropFilter: "blur(1px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 99999999 }} >
          <div style={{ width: '400px', padding: '10px 16px', overflowY: 'auto', backgroundColor: '#fff', border: '1px solid #E1E1E1', borderRadius: '8px', position: 'absolute', top: '100px', bottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid #E1E1E1', padding: '10px 0px', alignContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <img src={PaymentDone} alt="product" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
                <span>Payment Successful</span>
              </div>
            </div>
            <div style={{ width: '100%' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span>Invoice no.</span> <span>{selectedSale?.invoiceNumber || 'N/A'}</span>
              </div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span>Payment Mode</span> <span>{selectedSale?.paymentDetails?.paymentMethod || 'N/A'}</span>
              </div>
            </div>

            {/* Product-Wise Item Breakdown List */}
            <div style={{ width: '100%', marginTop: '15px', borderBottom: '1px dashed #E1E1E1', paddingBottom: '10px' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#676767' }}>Items Basket</span>
              </div>
              {(selectedSale?.items || selectedSale?.selectedItems || []).map((item, index) => {
                const itemPrice = item.sellingPrice !== undefined ? item.sellingPrice : (item.price !== undefined ? item.price : (item.unitPrice || 0));
                const itemQty = item.quantity || 1;
                const itemTotal = item.totalPrice || (itemPrice * itemQty);
                return (
                  <div key={index} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#333' }}>
                      {item.productName || 'Item'} <span style={{ color: '#888', fontSize: '12px' }}>x{itemQty}</span>
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '500' }}>₹{Number(itemTotal).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Payment Summary Layout Block */}
            <div style={{ width: '108%', marginTop: '10px', background: 'linear-gradient(to right, #E3EDFF, #FFFFFF)', marginLeft: '-16px', marginRight: '-16px', padding: '10px 16px' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                <span style={{ fontSize: '20px', fontWeight: '600' }}>Payment Summary</span>
              </div>

              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span>Total Amount</span>
                <span>₹{Number(selectedSale?.totals?.totalAmount ?? selectedSale?.totalAmount ?? 0).toFixed(2)}</span>
              </div>

              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                <span>Amount Received</span>
                <span>₹{Number(selectedSale?.paymentDetails?.amountReceived ?? selectedSale?.amountReceived ?? 0).toFixed(2)}</span>
              </div>

              {/* Safely check Amount Returned using a fallback comparison variable */}
              {(() => {
                const changeReturned = Number(selectedSale?.paymentDetails?.changeReturned ?? selectedSale?.changeReturned ?? 0);
                return changeReturned > 0 ? (
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span>Amount Returned</span>
                    <span>₹{changeReturned.toFixed(2)}</span>
                  </div>
                ) : null;
              })()}

              {/* Safely calculate and isolate Amount Due arithmetic */}
              {(() => {
                const total = Number(selectedSale?.totals?.totalAmount ?? selectedSale?.totalAmount ?? 0);
                const received = Number(selectedSale?.paymentDetails?.amountReceived ?? selectedSale?.amountReceived ?? 0);
                const dueAmount = total - received;

                return dueAmount > 0 ? (
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ color: '#D32F2F', fontWeight: '500' }}>Amount Due</span>
                    <span style={{ color: '#D32F2F', fontWeight: '600' }}>
                      ₹{dueAmount.toFixed(2)}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>

            <div style={{ width: '100%', marginTop: '20px' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: '600' }}>Customer</span>
              </div>
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginTop: '10px', gap: '5px' }}>
                <span>Name:</span> <span style={{ fontWeight: '600' }}>{selectedSale?.customer?.name || 'N/A'}</span>
              </div>
              <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginTop: '2px', gap: '5px' }}>
                <span style={{ color: '#676767' }}>Phone:</span> <span style={{ fontWeight: '600' }}>{selectedSale?.customer?.phone || 'N/A'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '8px', gap: '20px' }}>

              {/* Corrected Silent Printing Action Hook */}
              <div
                style={{
                  padding: '3px 10px', border: '2px solid #BBE1FF', borderRadius: '8px', display: 'flex', gap: '5px', alignItems: 'center',
                  backgroundColor: isGenerating ? '#ccc' : '#E3F3FF',
                  color: isGenerating ? '#666' : '#1368EC',
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                }}
                onClick={isGenerating ? null : async () => {
                  if (!selectedSale) {
                    toast.error("No invoice details selected to print.");
                    return;
                  }
                  try {
                    // 1. Generate the raw aligned text via your layout template handler
                    const rawThermalString = generateThermalBill(selectedSale);

                    // 2. Safely deliver the plain text string to your QZ Tray utility printer driver
                    await printThermalBill(rawThermalString, "", companyImages);
                    // toast.success("Receipt sent silently to thermal printer!");
                  } catch (err) {
                    // console.warn("QZ Tray communication failure. Running web layout render fallback...", err);
                    setInvoicePopup(true);
                    setTimeout(() => handleInvoicePrint(), 100);
                  }
                }}
              >
                <span><MdPrint /></span> <span>{isGenerating ? 'Generating...' : 'Print'}</span>
              </div>

              <div style={{
                padding: '3px 10px', border: '2px solid #E6E6E6', borderRadius: '8px', color: 'white', display: 'flex', gap: '5px', alignItems: 'center',
                backgroundColor: isGenerating ? '#ccc' : '#1368EC',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
              }}
                onClick={isGenerating ? null : () => {
                  setInvoicePopup(true);
                  setTimeout(() => handleDownloadPDF(), 100);
                }}
              > <span><AiOutlineDownload /></span>
                <span>{isGenerating ? 'Generating...' : 'Download'}</span>
              </div>
            </div>
            <div style={{ width: '108%', marginTop: '20px', marginLeft: '-16px', marginRight: '-16px', padding: '15px 16px', borderTop: '1px solid #E1E1E1', display: 'flex', justifyContent: 'center' }}>
              <div style={{ padding: '3px 10px', backgroundColor: '#E3F3FF', border: '2px solid #BBE1FF', borderRadius: '8px', color: '#1368EC', display: 'flex', gap: '5px', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => {
                  setPaymentPopup(false); setSelectedSale(null); setSelectedItems([]); setSelectedCustomer(null); setBagCharge(0); setAmountReceived(''); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setSubTotal(0); setTotalAmount(0); setRoundedAmount(0); setTotalTax(0); setTotalItems(0); setTotalQuantity(0); setDiscount(0); setCashPopup(false); setCardPopup(false); setUpiPopup(false); fetchPosSales(); setSelectedCategory(null); setProducts(allProducts); setUpdown(false); setSearchDrop(false); setCategoryValue(''); setSocketValue(''); setWarehouseValue(''); setExprationValue(''); setOtp(['', '', '', '']); setCountry(''); setState(''); setCity(''); setPinCode('');
                  if (formRef.current) {
                    formRef.current.reset();
                  }
                  const initialTabs = allProducts.reduce((acc, product) => {
                    acc[product._id] = "general";
                    return acc;
                  }, {});
                  setActiveTabs(initialTabs); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setPopup(false); setAddCustomerPopup(false); setDiscountPopup(false); setTransactionPopup(false); setSelectedSale(null); setCurrentPage(1); setTotalPages(1); setTotalSales(0); setLoading(false); setPosSales([]); setAmountReceived(''); setSearchQuery(''); setSearchResults([]); setShowDropdown(false); setPopup(false); setAddCustomerPopup(false); setDiscountPopup(false); setTransactionPopup(false); setSelectedSale(null); setCurrentPage(1); setTotalPages(1); setTotalSales(0); setLoading(false); setPosSales([]); setAmountReceived(''); window.location.reload();
                }}
              > <span><IoMdAdd /></span> <span>Create New Invoice</span></div>
            </div>
          </div>
        </div>
      )}

      {/* invoice popup */}
      {invoicepopup && (<div style={{ position: "fixed", top: "0", left: "0", width: "100%", height: "100%", backgroundColor: "rgba(199, 197, 197, 0.4)", backdropFilter: "blur(1px)", display: "flex", justifyContent: "center", overflowY: "auto", alignItems: "center", zIndex: 99999999, }} >
        <div ref={InvoiceRef} style={{ width: "450px", padding: "10px 16px", overflowY: "auto", backgroundColor: "#fff", border: "1px solid #E1E1E1", borderRadius: "8px", fontSize: "13px", }}>
          <div style={{ display: "flex", justifyContent: "center", padding: "10px 0px 10px 0px", alignContent: "center", }} >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", }} >
              <span>{companyDetails.companyName}</span>
              <span>{companyDetails.companyaddress}</span>
              <span>{companyDetails.companyphone && `Phone - ${companyDetails.companyphone}`}</span>
              <span>{companyDetails.companyemail}</span>
              <span>{companyDetails.gstin && `GST No. - ${companyDetails.gstin}`}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: "0px 0px 20px 0px", alignContent: "center", borderBottom: "1px solid #E1E1E1", }} >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", }} >
              <span>Tax Invoice</span> <span>Customer Copy</span>
            </div>
          </div>
          <div style={{ width: "100%", borderBottom: "1px solid #E1E1E1", paddingBottom: "10px", marginTop: "10px", }} >
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", }} >
              <span>Invoice - {selectedSale?.invoiceNumber || "N/A"}</span>
              <span> Time - {selectedSale?.saleDate
                ? new Date(selectedSale.saleDate).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }).replace(",", "")
                : "N/A"}
                {/* {selectedSale?.saleDate || "N/A"} */}
              </span>
            </div>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span> Payment Mode - {selectedSale?.paymentDetails?.paymentMethod || "N/A"} </span>
              <span>Status - {selectedSale?.status || "N/A"}</span>
            </div>
          </div>
          <div style={{ width: "100%", marginTop: "10px", padding: "10px 16px", borderBottom: "1px solid #E1E1E1", }} >
            <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse", marginBottom: "10px", }} >
              <thead><tr>
                <th style={{ borderBottom: "1px solid #E1E1E1", textAlign: "left", paddingBottom: "5px", }} > Name </th>
                <th style={{ borderBottom: "1px solid #E1E1E1", textAlign: "left", paddingBottom: "5px", }} > QTY </th>
                <th style={{ borderBottom: "1px solid #E1E1E1", textAlign: "left", paddingBottom: "5px", }} > Price/unit </th>
                <th style={{ borderBottom: "1px solid #E1E1E1", textAlign: "right", paddingBottom: "5px", }} > Total </th>
              </tr></thead>
              <tbody>
                {selectedSale?.items?.map((item, index) => (
                  <tr key={index} style={{}}>
                    <td style={{ textAlign: "left" }}>{item.productName}</td>
                    <td style={{ textAlign: "left" }}>{item.quantity} {item.unit}</td>
                    <td style={{ textAlign: "left" }}>₹{item.unitPrice}</td>
                    <td style={{ textAlign: "right" }}> ₹{item.totalPrice?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ width: "100%", marginTop: "10px", padding: "10px 16px", }} >
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", }} >
              <span style={{ fontSize: "20px", fontWeight: "600" }}> Payment Summary </span>
            </div>
            {/* sub total */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>Sub Total</span>
              <span>₹{Number(selectedSale?.totals?.subtotal ?? selectedSale?.subtotal ?? 0).toFixed(2)}</span>
            </div>
            {/* item discount */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>Item Discount</span><span> ₹{totalDiscountinvoice.toFixed(2)}</span>
            </div>
            {/* Overall Discount */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>Overall Discount</span>
              <span>₹{Number(selectedSale?.totals?.overallDiscount ?? selectedSale?.overallDiscount ?? selectedSale?.overallDiscountAmount ?? 0).toFixed(2)}</span>
            </div>
            {/* other charges included afterwards */}
            {selectedSale?.paymentDetails?.bagCharge > 0 && (<div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>Bag Charge</span><span> ₹{selectedSale?.paymentDetails?.bagCharge?.toFixed(2) || "0.00"}</span>
            </div>)}
            {selectedSale?.additionalCharges?.map((charge) => (
              <div key={charge._id || charge.name} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
                <span>{charge.name}</span><span> ₹{Number(charge.amount || 0).toFixed(2)}</span>
              </div>
            ))}
            {/* cgst calculation */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>CGST</span><span> ₹{totalTaxinvoice.toFixed(2) / 2}</span>
            </div>
            {/* sgst calculation */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>SGST</span><span> ₹{totalTaxinvoice.toFixed(2) / 2}</span>
            </div>
            {/* tax calculation */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>Total Tax</span><span> ₹{totalTaxinvoice.toFixed(2)}</span>
            </div>
            {/* grand total */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span style={{ fontWeight: "600", fontSize: "20px", }}>Grand Total</span><span style={{ fontWeight: "600", fontSize: "20px" }}>  ₹{selectedSale?.totals?.totalAmount || "0.00"}</span>
            </div>

            {/* amount received */}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "5px", }} >
              <span>Amount Received</span><span> ₹{selectedSale?.paymentDetails?.amountReceived?.toFixed(2) || "0.00"}</span>
            </div>
            {/* amount returned */}
            {selectedSale?.paymentDetails?.changeReturned > 0 && (<div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>Amount Returned</span><span> ₹{selectedSale?.paymentDetails?.changeReturned?.toFixed(2,) || "0.00"} </span>
            </div>)}
            {/* amount due */}
            {selectedSale?.totals?.totalAmount - selectedSale?.paymentDetails?.amountReceived?.toFixed(2) > 0 && (<div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px", }} >
              <span>Amount Due</span> <span> ₹{selectedSale?.totals?.totalAmount - selectedSale?.paymentDetails?.amountReceived?.toFixed(2,)} </span>
            </div>)}
          </div>
          <div style={{ width: "100%", marginTop: "10px", borderBottom: "1px solid #E1E1E1", padding: "10px 16px", marginBottom: "0px", }} >
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", }} >
              <span style={{ fontSize: "20px", fontWeight: "600" }}> Customer Details </span>
            </div>
            <div style={{ width: "100%", display: "flex", alignItems: "center", marginTop: "10px", gap: "5px", justifyContent: "space-between", }} >
              <span>Name:</span><span style={{ fontWeight: "600" }}> {selectedSale?.customer?.name || "N/A"} </span>
            </div>
            <div style={{ width: "100%", display: "flex", alignItems: "center", marginTop: "2px", gap: "5px", marginBottom: "20px", justifyContent: "space-between", }} >
              <span>Phone:</span><span style={{ fontWeight: "600" }}> {selectedSale?.customer?.phone || "N/A"} </span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", borderBottom: "1px solid #E1E1E1", padding: "10px 0px", alignContent: "center", marginBottom: "10px", }} >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", }} >
              <span>Thank You for Visiting {companyDetails.companyName}</span>
              <span>Have a Nice Day</span>
            </div>
          </div>
        </div>
      </div>)}
    </div>
  );
};

export default Pos;
