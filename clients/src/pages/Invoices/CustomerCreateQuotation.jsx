import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { format, addDays } from "date-fns";
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiChevronDown } from "react-icons/fi";
import { CiBarcode } from "react-icons/ci";
import { RiImageAddFill } from "react-icons/ri";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { RiDeleteBinLine } from "react-icons/ri";
import indialogo from "../../assets/images/india-logo.png";
import total_orders_icon from "../../assets/images/totalorders-icon.png";
import CompanyLogo from "../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../assets/images/taxinvoice.png";
import Qrcode from "../../assets/images/qrcode.png";
import api from "../config/axiosInstance";
import { toast } from "react-toastify";
import { toWords } from "number-to-words";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AddCustomers from "../Modal/customerModals/AddCustomerModal";
import { FiSearch } from "react-icons/fi";
import ProductDefaultImage from '../../../src/assets/images/product-default.png'
import PreviewQuotation from "./PreviewQuotation";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { FiMinus, FiPlus, FiX } from "react-icons/fi";
import { IoIosCheckmark } from "react-icons/io";
import { FaFilePdf, FaFileExcel, FaFileCsv, FaFileWord, FaFileAlt } from "react-icons/fa";

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

// Add this ProductPopup component before SerialNumberDropdown and CustomerCreateInvoice

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
  setLot,
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
  mode = "details",
  onPrimaryClick
}) => {
  const selectedSerialArr = Array.isArray(selectedSerialno) ? selectedSerialno : [];
  const maxSerials = Math.max(Number(selectedQty || 1), 1);

  // Get the variant that matches the currently selected lot
  const selectedLotVariant = productVariants?.find(
    v => String(v.lotNumber || "") === String(selectedLot || "")
  ) || null;

  // Serials come from the selected lot's variant, not the whole product
  const serialsForSelectedLot = selectedLotVariant
    ? (Array.isArray(selectedLotVariant.serialNumbers)
      ? selectedLotVariant.serialNumbers.filter(Boolean).map(String)
      : [])
    : (Array.isArray(productSerialno) ? productSerialno : []);

  // Qty for a specific lot variant
  const getVariantQty = (lotNumber) => {
    const v = productVariants?.find(
      vv => String(vv.lotNumber || "") === String(lotNumber || "")
    );
    return v ? Number(v.stockQuantity || v.openingQuantity || 0) : 0;
  };

  const handleSelectRandom = () => {
    if (Array.isArray(productLot) && productLot.length > 0) {
      const randomLot = productLot[0];
      if (setLot) setLot(randomLot);
      if (setSelectedLot) setSelectedLot(randomLot);
      setSelectedSerialno([]);
    }
    if (serialsForSelectedLot.length > 0) {
      setSelectedSerialno([serialsForSelectedLot[0]]);
    }
  };

  const hasBatchOrSerial =
    (Array.isArray(productLot) && productLot.length > 0) ||
    (serialsForSelectedLot.length > 0);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.30)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "380px", background: "white", display: "flex", flexDirection: "column", position: "relative", boxSizing: "border-box", borderRadius: "8px", fontFamily: "Inter", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
      >
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
                ₹{Number(price || selectedProduct?.sellingPrice || 0).toFixed(2)}
                {mrp && <del style={{ color: "#8D8D8D", fontSize: "11px", fontWeight: "400", marginLeft: "6px" }}>₹{mrp}</del>}
              </div>
            </div>
          </div>

          {/* Scrollable middle section */}
          <div style={{ maxHeight: "280px", overflow: "auto", padding: "10px 4px", borderBottom: "1px solid #C3C3C3", display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* ALL BATCHES */}
            {Array.isArray(productLot) && productLot.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "10px", color: "#666", fontWeight: 600, letterSpacing: "0.3px" }}>
                  Batches / Lot No.
                </span>
                {productLot.map((lot, idx) => {
                  const isSelected = String(lot) === String(selectedLot || "");
                  // Find the variant for this specific lot
                  const lotVariant = productVariants?.find(
                    v => String(v.lotNumber || "") === String(lot)
                  );
                  // Get this batch's specific quantity
                  const lotQty = lotVariant
                    ? Number(lotVariant.stockQuantity || lotVariant.openingQuantity || 0)
                    : 0;
                  const lotExpiry = lotVariant?.expiryDate
                    ? getExpiryDisplayText(lotVariant.expiryDate)
                    : expiryText;
                  return (
                    <label
                      key={idx}
                      style={{ border: `1px solid ${isSelected ? "#1F7FFF" : "#EAEAEA"}`, borderRadius: "4px", padding: "8px 10px", fontSize: "11px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: isSelected ? "#F0F7FF" : "#fff", transition: "all 0.15s" }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 500, color: "#222" }}>
                        <input
                          type="radio"
                          name="lot"
                          checked={isSelected}
                          onChange={() => {
                            if (setLot) setLot(lot);
                            if (setSelectedLot) setSelectedLot(lot);
                            // Reset serial selection when batch changes
                            setSelectedSerialno([]);
                          }}
                          style={{ accentColor: "#1F7FFF", cursor: "pointer" }}
                        />
                        {lot}
                      </span>
                      {lotExpiry && (
                        <span style={{ color: lotExpiry === "Expired" ? "#f91f1fff" : "#005677", fontSize: "10px", marginLeft: "8px" }}>
                          {lotExpiry}
                        </span>
                      )}
                      <span style={{ fontSize: "11px", color: "#555", fontWeight: 500, whiteSpace: "nowrap", marginLeft: "8px" }}>
                        {lotQty} units  {/* This will show correct quantity per batch */}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* SERIAL NUMBERS — shown always if available, multi-select via qty */}
            {serialsForSelectedLot.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "10px", color: "#666", fontWeight: 600, letterSpacing: "0.3px" }}>
                  Serial No. ({selectedSerialArr.length}/{maxSerials} selected)
                </span>
                {serialsForSelectedLot.map((sn, idx) => {
                  const isSelected = selectedSerialArr.includes(sn);
                  const disableUnchecked = !isSelected && selectedSerialArr.length >= maxSerials;

                  return (
                    <label
                      key={idx}
                      style={{
                        border: `1px solid ${isSelected ? "#1F7FFF" : "#EAEAEA"}`,
                        borderRadius: "4px",
                        padding: "8px 10px",
                        fontSize: "11px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: disableUnchecked ? "not-allowed" : "pointer",
                        background: isSelected ? "#F0F7FF" : "#fff",
                        opacity: disableUnchecked ? 0.5 : 1,
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? "#1F7FFF" : "#222"
                      }}>
                        <input
                          type="checkbox"  // Change from "radio" to "checkbox"
                          className="input-radio"
                          checked={isSelected}
                          disabled={disableUnchecked}
                          onChange={() => {
                            setSelectedSerialno((prev) => {
                              const arr = Array.isArray(prev) ? prev.map(String) : [];
                              if (arr.includes(sn)) {
                                return arr.filter(x => x !== sn);
                              }
                              if (arr.length >= maxSerials) {
                                // When max reached, don't allow selecting more
                                toast.warning(`Maximum ${maxSerials} serial numbers can be selected`);
                                return arr;
                              }
                              return [...arr, sn];
                            });
                          }}
                          style={{ accentColor: "#1F7FFF", cursor: disableUnchecked ? "not-allowed" : "pointer" }}
                        />
                        {sn}
                      </span>
                      <span style={{ fontSize: "11px", color: "#555", fontWeight: 500, whiteSpace: "nowrap", marginLeft: "8px" }}>
                        1 unit
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {(!Array.isArray(productLot) || productLot.length === 0) &&
              serialsForSelectedLot.length === 0 &&
              (!Array.isArray(productSerialno) || productSerialno.length === 0) && (
                <div style={{ textAlign: "center", color: "#aaa", fontSize: "12px", padding: "16px 0" }}>
                  No batch or serial numbers available
                </div>
              )}
          </div>

          {/* Quantity controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderTop: "1px solid #EAEAEA" }}>
            <span style={{ fontSize: "11px", color: "#444", fontWeight: 600 }}>Quantity</span>
            <div style={{ display: "flex", alignItems: "center", border: "1px solid #EAEAEA", borderRadius: "8px", overflow: "hidden" }}>
              <button
                onClick={decreaseQty}
                disabled={selectedQty <= 1}
                style={{ background: "#F8F9FB", border: "none", borderRight: "1px solid #EAEAEA", padding: "7px 11px", fontSize: "14px", color: "#111827", display: "flex", alignItems: "center", cursor: selectedQty <= 1 ? "not-allowed" : "pointer", opacity: selectedQty <= 1 ? 0.6 : 1 }}
              >
                <FiMinus size={13} />
              </button>
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", padding: "0 16px", minWidth: "36px", textAlign: "center" }}>
                {String(selectedQty).padStart(2, "0")}
              </div>
              <button
                onClick={increaseQty}
                disabled={disableQty}
                style={{ background: "#F8F9FB", border: "1px solid #EAEAEA", padding: "10px", fontSize: "12px", color: "#111827", display: "flex", alignItems: "center", borderTopRightRadius: "8px", borderBottomRightRadius: "8px", cursor: disableQty ? "not-allowed" : "pointer", opacity: disableQty ? 0.6 : 1 }}
              >
                <FiPlus size={13} />
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "8px", padding: "8px 4px 4px 4px" }}>
            {hasBatchOrSerial && (
              <button
                onClick={handleSelectRandom}
                style={{ flex: 1, background: "white", border: "1px solid #EAEAEA", padding: "10px 0", fontSize: "12px", fontWeight: 500, color: "#333", borderRadius: "6px", cursor: "pointer" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F5")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                Select Random
              </button>
            )}
            <button
              onClick={onPrimaryClick}
              style={{ flex: 1, backgroundColor: "#1F7FFF", border: "1px solid #0084FF", padding: "10px 0", fontSize: "12px", fontWeight: 500, color: "white", borderRadius: "6px", cursor: "pointer" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1a6fe0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1F7FFF")}
            >
              Add Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



// Add this import at the top with your other imports
const SerialNumberDropdown = ({
  product,
  onSelect,
  onQtyChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempQty, setTempQty] = useState(product.qty || 1);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const toggleSerialNo = (serialNo) => {
    const currentSelected = product.selectedSerialNos || [];
    const maxAllowed = product.qty || 1;
    let newSelected;

    if (currentSelected.includes(serialNo)) {
      newSelected = currentSelected.filter(sn => sn !== serialNo);
    } else {
      if (currentSelected.length >= maxAllowed) {
        newSelected = [...currentSelected.slice(0, maxAllowed - 1), serialNo];
      } else {
        newSelected = [...currentSelected, serialNo];
      }
    }

    onSelect(newSelected);
  };

  const handleSelectAll = () => {
    const allSerials = product.availableSerialNos || [];
    onSelect(allSerials);
    if (onQtyChange && allSerials.length !== product.qty) {
      onQtyChange(allSerials.length || 1);
    }
  };

  const handleClearAll = () => {
    onSelect([]);
    if (onQtyChange && 1 !== product.qty) {
      onQtyChange(1);
    }
  };

  const handleQtyChange = (newQty) => {
    const numericQty = parseInt(newQty) || 1;
    setTempQty(numericQty);

    if (onQtyChange) {
      onQtyChange(numericQty);
    }

    const currentSelected = product.selectedSerialNos || [];
    if (currentSelected.length > numericQty) {
      const trimmedSelection = currentSelected.slice(0, numericQty);
      onSelect(trimmedSelection);
    }
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      if (!isOpen) {
        updateDropdownPosition();
      }
      setIsOpen(!isOpen);
    }
  };

  const availableSerialNos = product.availableSerialNos || product.serialNumbers || [];
  const selectedSerialNos = product.selectedSerialNos || [];

  const filteredSerials = availableSerialNos.filter(serial =>
    serial.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxAllowed = product.qty || 1;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        ref={triggerRef}
        onClick={handleToggleDropdown}
        style={{
          width: '100%',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          padding: '8px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          color: disabled ? '#999' : '#333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontWeight: '500' }}>
            {selectedSerialNos.length > 0
              ? `${selectedSerialNos.length} selected`
              : 'Select Serial'}
          </span>
          {selectedSerialNos.length > 0 && (
            <span style={{ fontSize: '12px', color: '#666' }}>
              {selectedSerialNos.slice(0, 2).join(', ')}
              {selectedSerialNos.length > 2 ? `... (+${selectedSerialNos.length - 2} more)` : ''}
            </span>
          )}
        </div>
        <FiChevronDown style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
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
        >
          {/* Header */}
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: '#f8f9fa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Quantity:
                </span>
                <input
                  type="number"
                  min="1"
                  value={tempQty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  style={{
                    width: '60px',
                    padding: '4px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <span style={{ fontSize: '12px', color: '#666' }}>
                {selectedSerialNos.length}/{maxAllowed} selected
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <FiSearch style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }} />
              <input
                type="text"
                placeholder="Search serial numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 12px 6px 30px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '12px',
                  outline: 'none'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll();
                }}
                disabled={selectedSerialNos.length >= maxAllowed || availableSerialNos.length === 0}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: selectedSerialNos.length >= maxAllowed || availableSerialNos.length === 0 ? '#e0e0e0' : '#e8f4ff',
                  color: selectedSerialNos.length >= maxAllowed || availableSerialNos.length === 0 ? '#999' : '#1F7FFF',
                  border: '1px solid #d0e7ff',
                  borderRadius: '4px',
                  cursor: selectedSerialNos.length >= maxAllowed || availableSerialNos.length === 0 ? 'not-allowed' : 'pointer',
                  flex: 1
                }}
              >
                Select All
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: '#fff0f0',
                  color: '#d8484a',
                  border: '1px solid #ffd0d0',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Serial Numbers List */}
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {filteredSerials.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                {searchTerm ? 'No serial numbers found' : 'No serial numbers available'}
              </div>
            ) : (
              filteredSerials.map((serialNo) => (
                <div
                  key={serialNo}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: '#fff',
                    transition: 'background-color 0.2s',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedSerialNos.includes(serialNo) || selectedSerialNos.length < maxAllowed) {
                      toggleSerialNo(serialNo);
                    }
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = '#f8f9fa')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = '#fff')
                  }
                >
                  <div style={{ position: 'relative' }}>
                    <input
                      type="checkbox"
                      checked={selectedSerialNos.includes(serialNo)}
                      onChange={() => { }}
                      style={{
                        cursor: 'pointer',
                        width: '16px',
                        height: '16px'
                      }}
                    />
                    {!selectedSerialNos.includes(serialNo) && selectedSerialNos.length >= maxAllowed && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        cursor: 'not-allowed'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{
                      fontWeight: selectedSerialNos.includes(serialNo) ? '600' : '400',
                      color: selectedSerialNos.includes(serialNo) ? '#1F7FFF' : '#333',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {serialNo}
                    </span>
                  </div>
                  {selectedSerialNos.includes(serialNo) && (
                    <span style={{
                      fontSize: '12px',
                      color: '#1F7FFF',
                      backgroundColor: '#e8f4ff',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      Selected
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid #f0f0f0',
            backgroundColor: '#f8f9fa',
            fontSize: '12px',
            color: '#666'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Product Quantity: {product.qty || 1}</span>
              <span>Available Serial Nos: {availableSerialNos.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
function CustomerCreateQuotation() {
  const COL = {
    sl: 80,
    item: 260,
    md: 120,
    lg: 200,
  };

  const dividerStyle = {
    width: 1,
    height: 30,
    background: "#A2A8B8",
    // flexShrink: 0,
  };

  const headerTextStyle = {
    color: "#727681",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: "500",
    lineHeight: "16.8px",
    wordWrap: "break-word",
  };

  const headerCell = (width, justifyContent = "center") => ({
    width: 133,
    height: 30,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 4,
    paddingBottom: 4,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    display: "flex",
  });

  const bodyBox = (width) => ({
    width,
    minHeight: 32,
    alignSelf: "stretch",
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 4,
    paddingBottom: 4,
    justifyContent: "space-between",
    alignItems: "center",
    display: "flex",
    outline: "1px solid #EAEAEA",
    borderRadius: 4,
    background: "#fff",
    flexShrink: 0,
    boxSizing: "border-box",
  });

  const inputStyle = {
    width: "100%",
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 14,
    fontFamily: "Inter",
  };
  const viewManageRef = useRef(null); //for handle click outside for calendar
  const hasAddedInitialProduct = useRef(false);
  const { customerId, quotationId } = useParams();
  // console.log("Full params:", useParams()); // Log all params
  // console.log("Quotation ID:", quotationId);
  const navigate = useNavigate();
  // State for customer selection/selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  // const [editQuotationData, setEditQuotationData] = useState(false);
  // Add this to get location state for edit mode
  const location = useLocation();
  // for navigating after save start
  const sourcePage = location.state?.from || location.state?.sourcePage;
  const isFromCustomerPage = sourcePage === '/customers' || customerId;
  // end
  const viewQuotationData = location.state?.viewQuotation;
  const editQuotationData = location.state?.editQuotation;
  // Determine if we're editing and get the ID properly
  const isEditing = !!quotationId || !!editQuotationData?._id;
  const existingQuotationId = quotationId || editQuotationData?._id || viewQuotationData?._id;
  const isNegotiation = location.state?.isNegotiation || false;
  const isEditMode = !!quotationId || !!editQuotationData;
  const mode = location.state?.mode;

  const isViewMode = mode === 'view';
  const isEditModes = mode === 'edit';
  const hasExistingData = viewQuotationData || editQuotationData;
  const [isReadOnly, setIsReadOnly] = useState(isViewMode);
  const [isCreateModes, setIsCreateMode] = useState(false);
  const isCreateMode = !quotationId && !editQuotationData && !viewQuotationData;

  // for barcode scanner input
  const productSearchInputRef = useRef(null);

  // modal state
  const [openAddModal, setOpenAddModal] = useState(false);

  // State declarations in proper sequence
  const [loading, setLoading] = useState(true);
  const [productLoading, setProductLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [companyData, setCompanyData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);

  // check if we're in "create from navbar" mode (no customerId)
  const isFromNavbar = !customerId;
  // Customer state
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    gstin: "",
    customerId: "",
  });

  // Quotation basic info
  const [quotationDate, setQuotationDate] = useState(new Date());
  const [expiryDate, setExpiryDate] = useState(addDays(new Date(), 30));
  const [quotationNo, setQuotationNo] = useState("");
  const [validForDays, setValidForDays] = useState(30)
  const [validityDate, setValidityDate] = useState(addDays(new Date(), 30));
  const [viewValidityOptions, setViewValidityOptions] = useState(false);
  const [isValidityDatePickerOpen, setIsValidityDatePickerOpen] = useState(false);
  const validityDateRef = useRef(null);

  // Products state
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  // Search state
  const [searchData, setSearchData] = useState({});
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const pendingFocusRowIdRef = useRef(null);
  const focusNextProductRowInput = () => {
    const inputs = Array.from(document.querySelectorAll('input[data-row-id]'));
    if (inputs.length === 0) return;
    const visible = inputs.filter((el) => el && !el.disabled && el.offsetParent !== null);
    const candidates = (visible.length ? visible : inputs).slice().reverse();
    const target =
      candidates.find((el) => String(el.value || "").trim() === "") || candidates[0];
    target?.focus();
  };

  // Pricing and discounts
  const [additionalDiscountType, setAdditionalDiscountType] =
    useState("Percentage");
  const [additionalDiscountPct, setAdditionalDiscountPct] = useState("");
  const [additionalDiscountAmt, setAdditionalDiscountAmt] = useState("");

  // Additional charges
  const [additionalChargesDetails, setAdditionalChargesDetails] = useState({
    shipping: 0,
    handling: 0,
    packing: 0,
    service: 0,
    other: 0,
  });
  const [selectedChargeType, setSelectedChargeType] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  // Payment state
  const [customerPoints, setCustomerPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [shoppingPointsUsed, setShoppingPointsUsed] = useState("");
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [fullyReceived, setFullyReceived] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [amountToReturn, setAmountToReturn] = useState(0);

  // Status and attachments
  const [status, setStatus] = useState("draft");
  const [uploadedImages, setUploadedImages] = useState([]);

  // Modal states
  const [viewManageOptions, setViewManageOptions] = useState(false);
  const [viewQuotationOptions, setViewQuotationOptions] = useState(false);
  const [viewChargeOptions, setViewChargeOptions] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Add these state variables for pos
  const [popupMode, setPopupMode] = useState(null);
  const [popupSelectedProduct, setPopupSelectedProduct] = useState(null);
  const [popupSelectedColor, setPopupSelectedColor] = useState("");
  const [popupSelectedSize, setPopupSelectedSize] = useState("");
  const [popupSelectedSerialno, setPopupSelectedSerialno] = useState([]);
  const [popupSelectedLot, setPopupSelectedLot] = useState('');
  const [popupSelectedQty, setPopupSelectedQty] = useState(1);
  const [popupActiveImageIndex, setPopupActiveImageIndex] = useState(0);
  const [showVariantPopup, setShowVariantPopup] = useState(false);

  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
    priceIncludeGST: true,
    defaultGSTRate: "18",
    autoRoundOff: "0",
  });

  const handleBack = () => {
    navigate(location.state?.from || -1);
  }
  // Add this state with your other state declarations
  const [settings, setSettings] = useState({
    brand: false,
    category: false,
    subcategory: false,
    itembarcode: false,
    hsn: false,
    description: false,
    lotno: false,
    serialno: false,
    variants: { size: false, color: false },
    units: false,
    expiry: false,
  });

  // Add this useEffect to fetch settings
  useEffect(() => {
    fetchProductSettings();
  }, []);

  const fetchProductSettings = async () => {
    try {
      const response = await api.get('/api/system-settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          brand: data.brand || false,
          category: data.category || false,
          subcategory: data.subcategory || false,
          itembarcode: data.itembarcode || false,
          hsn: data.hsn || false,
          description: data.description || false,
          lotno: data.lotno || false,
          serialno: data.serialno || false,
          variants: {
            size: data.variants?.size || false,
            color: data.variants?.color || false
          },
          units: data.units || false,
          expiry: data.expiry || false,
        });
      }
    } catch (error) {
      // console.error("Error fetching system settings:", error);
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch system settings");
    }
  };

  // fetch tax setting
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
        toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch tax settings");
      }
    };
    loadTaxSettings();
  }, []);
  // Error state
  const [errors, setErrors] = useState({});

  // Refs
  const modelRef = useRef(null);
  const chargeRef = useRef(null);

  // Calculate totals - MOVE THIS BEFORE THE useEffect HOOKS THAT USE grandTotal
  const subtotal = products.reduce((sum, p) => {
    const qty = parseFloat(p.qty) || 0;
    const unitPrice = parseFloat(p.unitPrice) || 0;
    return sum + qty * unitPrice;
  }, 0);

  const totalTax = products.reduce((sum, p) => sum + (p.taxAmount || 0), 0);
  const itemsDiscount = products.reduce(
    (sum, p) => sum + (p.discountAmt || 0),
    0,
  );

  const additionalDiscountValue = useMemo(() => {
    let discount = 0;
    if (additionalDiscountType === "Percentage" && additionalDiscountPct) {
      const pct = Math.min(parseFloat(additionalDiscountPct), 100);
      discount = (subtotal * pct) / 100;
    } else if (additionalDiscountType === "Fixed" && additionalDiscountAmt) {
      discount = Math.min(parseFloat(additionalDiscountAmt), subtotal);
    }
    return discount;
  }, [additionalDiscountType, additionalDiscountPct, additionalDiscountAmt, subtotal]);

  // Add this validation effect after your other useEffect hooks
  useEffect(() => {
    // Prevent additional discount from exceeding subtotal
    if (additionalDiscountValue > subtotal) {
      if (additionalDiscountType === "Percentage") {
        if (additionalDiscountPct !== 100) {
          // If percentage discount would exceed subtotal, cap at 100%
          toast.warning("Discount percentage cannot exceed 100%");
          setAdditionalDiscountPct(100);
          setAdditionalDiscountAmt(subtotal);
        }
      } else if (additionalDiscountType === "Fixed") {
        if (additionalDiscountAmt !== subtotal) {
          // If fixed discount exceeds subtotal, cap at subtotal
          toast.warning("Discount amount cannot exceed subtotal");
          setAdditionalDiscountAmt(subtotal);
          // Recalculate percentage based on capped amount
          if (subtotal > 0) {
            setAdditionalDiscountPct(((subtotal / subtotal) * 100).toFixed(2));
          }
        }
      }
    }
  }, [additionalDiscountValue, subtotal, additionalDiscountType, additionalDiscountPct, additionalDiscountAmt]);
  // Calculate additional discount

  const totalDiscount = itemsDiscount + additionalDiscountValue;

  // Calculate additional charges total
  const additionalChargesTotal = Object.values(additionalChargesDetails).reduce(
    (sum, charge) => sum + parseFloat(charge || 0),
    0,
  );

  const POINT_VALUE = 10;
  const pointsRedeemedAmount =
    (usePoints ? parseFloat(shoppingPointsUsed) || 0 : 0) * POINT_VALUE;

  const grandTotalBefore =
    subtotal +
    totalTax +
    additionalChargesTotal -
    totalDiscount -
    pointsRedeemedAmount;
  const roundedTotal = autoRoundOff
    ? Math.round(grandTotalBefore)
    : grandTotalBefore;
  const roundOffAdded = roundedTotal - grandTotalBefore;
  const grandTotal = Math.max(0, roundedTotal);

  // for preview data start
  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      // console.log("Companyss data:", res.data);
      setCompanyData(res.data.data);
    } catch (error) {
      // console.error("Error fetching company profile:", error);
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch company profile");
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      setBanks(res.data.data);
      // console.log("banks", res.data.data);
    } catch (error) {
      // console.error("Error fetching bank details:", error);
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch bank details");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
      // console.log("reddd", res.data);
    } catch (error) {
      // console.error("Error fetching notes & terms settings:", error);
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch notes & terms settings");
    }
  };

  const fetchSignature = async () => {
    try {
      const res = await api.get("/api/print-templates/all");
      setTemplate(res.data.data);
      // console.log("ddrrr", res.data);
    } catch (error) {
      // console.error("Error fetching tempate settings:", error);
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch template settings");
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchSettings();
    fetchSignature();
    fetchBanks();
  }, []);

  // for preview data end

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

  // const popupVariantSerials = useMemo(() => {
  //   const serials = popupSelectedVariant?.serialNumbers;
  //   if (!Array.isArray(serials)) return [];
  //   return serials.filter(Boolean).map((s) => String(s));
  // }, [popupSelectedVariant]);

  const popupVariantSerials = useMemo(() => {
    if (!popupSelectedProduct?.variants?.length) return [];
    // If a lot is selected, show serials from that lot's variant
    if (popupSelectedLot) {
      const lotVariant = popupSelectedProduct.variants.find(
        v => String(v.lotNumber || '') === String(popupSelectedLot)
      );
      const serials = lotVariant?.serialNumbers;
      if (Array.isArray(serials)) return serials.filter(Boolean).map(String);
    }
    // Fall back to selected variant serials
    const serials = popupSelectedVariant?.serialNumbers;
    if (!Array.isArray(serials)) return [];
    return serials.filter(Boolean).map(String);
  }, [popupSelectedProduct, popupSelectedVariant, popupSelectedLot]);


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
    const sellingPrice = Number(popupSelectedVariant?.sellingPrice ?? popupSelectedProduct?.sellingPrice ?? 0);
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

    // Find the selected lot's variant to get its specific stock
    const lotVariant = popupSelectedProduct.variants?.find(
      v => String(v.lotNumber || "") === String(popupSelectedLot || "")
    );

    // Get max quantity based on selected lot
    let maxAllowed = 0;
    if (popupSelectedLot && lotVariant) {
      maxAllowed = Number(lotVariant.stockQuantity || lotVariant.openingQuantity || 0);
    } else {
      maxAllowed = Number(popupAvailableQty || 0);
    }

    if (popupSelectedQty < maxAllowed) {
      setPopupSelectedQty((prev) => prev + 1);
    } else {
      toast.warning(`Only ${maxAllowed} units available for this batch`);
    }
  };

  const decreasePopupQty = () => {
    if (popupSelectedQty > 1) {
      setPopupSelectedQty((prev) => prev - 1);
      // Trim serial selections to match reduced qty
      setPopupSelectedSerialno((prev) =>
        Array.isArray(prev) ? prev.slice(0, popupSelectedQty - 1) : []
      );
    }
  };

  const isMaxQtyReached = () => {
    const lotVariant = popupSelectedProduct?.variants?.find(
      v => String(v.lotNumber || "") === String(popupSelectedLot || "")
    );
    const maxAllowed = lotVariant
      ? Number(lotVariant.stockQuantity || lotVariant.openingQuantity || 0)
      : Number(popupAvailableQty || 0);
    return popupSelectedQty >= maxAllowed;
  };

  const closeProductPopups = () => {
    setPopupMode(null);
    setPopupSelectedProduct(null);
    setShowVariantPopup(false);
    setPopupSelectedLot('');
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
    const selectedSerials = Array.isArray(popupSelectedSerialno)
      ? popupSelectedSerialno.filter(Boolean)
      : [];

    if (popupVariantSerials.length > 0) {
      if (selectedSerials.length === 0) {
        toast.error("Please select at least one serial number");
        return;
      }
      if (selectedSerials.length !== popupSelectedQty) {
        toast.error(`Please select exactly ${popupSelectedQty} serial number(s)`);
        return;
      }
    }

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
      selectedSerialNos: selectedSerials,
      selectedLot: popupSelectedLot,
    });

    closeProductPopups();
    focusNextProductRowInput();
  };

  // Generate quotation number on component mount
  // useEffect(() => {
  //   const generateQuotationNumber = () => {
  //     const prefix = "QUOT";
  //     const date = new Date();
  //     const year = date.getFullYear();
  //     const month = String(date.getMonth() + 1).padStart(2, "0");
  //     const sequence = Math.floor(Math.random() * 1000)
  //       .toString()
  //       .padStart(3, "0");
  //     return `${prefix}${year}${month}${sequence}`;
  //   };
  //   setQuotationNo(generateQuotationNumber());
  // }, []);

  // Fetch customers for search (when in navbar mode)
  useEffect(() => {
    if (isFromNavbar) {
      fetchCustomersForSearch();
    }
  }, [isFromNavbar]);

  const fetchCustomersForSearch = async () => {
    try {
      const params = {}
      const response = await api.get("/api/customers/active-customers", { params });
      setAllCustomers(response.data?.customers || []);
      setFilteredCustomers(response.data?.customers || []);
    } catch (error) {
      // toast.error("Failed to load customers");
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to load customers");
    }
  };
  // Handle customer search
  // Handle customer search with both name and phone
  useEffect(() => {
    if (!customerSearch.trim() && !phoneSearch.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }
    const filtered = allCustomers.filter((cust) => {
      // Search by name
      const nameMatch = customerSearch.trim()
        ? cust.name?.toLowerCase().includes(customerSearch.toLowerCase())
        : false;

      // Search by phone
      const phoneMatch = phoneSearch.trim()
        ? cust.phone?.includes(phoneSearch)
        : false;

      // Search by email
      const emailMatch = customerSearch.trim()
        ? cust.email?.toLowerCase().includes(customerSearch.toLowerCase())
        : false;

      return nameMatch || phoneMatch || emailMatch;
    });

    setFilteredCustomers(filtered);
  }, [customerSearch, phoneSearch, allCustomers]);

  // Update expiry date when validForDays or quotationDate changes
  useEffect(() => {
    const newExpiryDate = addDays(quotationDate, validForDays);
    setExpiryDate(newExpiryDate);
  }, [quotationDate, validForDays]);

  // Handle click outside modals
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelRef.current && !modelRef.current.contains(event.target)) {
        setViewQuotationOptions(false);
      }
      if (chargeRef.current && !chargeRef.current.contains(event.target)) {
        setViewChargeOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate amount to return and auto-update fullyReceived
  // Calculate amount to return and auto-update fullyReceived
  useEffect(() => {
    const received = parseFloat(amountReceived) || 0;
    const toReturn = Math.max(0, received - grandTotal);
    setAmountToReturn(toReturn);
  }, [amountReceived, grandTotal]);

  // Auto-set amount received when fullyReceived is checked
  useEffect(() => {
    if (fullyReceived) {
      setAmountReceived(grandTotal.toFixed(2));
    }
  }, [fullyReceived, grandTotal]);

  // Auto-set amount received when fullyReceived is checked
  useEffect(() => {
    if (fullyReceived) {
      setAmountReceived(grandTotal.toFixed(2));
    }
  }, [fullyReceived, grandTotal]);

  // Auto-add new product row when last row is filled
  useEffect(() => {
    // Check if the last product row has been filled
    const lastProduct = products[products.length - 1];

    if (
      lastProduct &&
      lastProduct.itemName &&
      lastProduct.itemName.trim() !== ""
    ) {
      // Check if this is truly the last row (no empty rows after it)
      const timer = setTimeout(() => {
        // Don't add if there's already an empty row at the end
        const hasEmptyRow = products.some(
          (p) => !p.itemName || p.itemName.trim() === "",
        );

        if (!hasEmptyRow) {
          addProductRow({ focus: true });
        }
      }, 500); // 500ms delay for better UX

      return () => clearTimeout(timer);
    }
  }, [products]);

  useEffect(() => {
    const rowId = pendingFocusRowIdRef.current;
    if (!rowId) return;
    const input = document.querySelector(`[data-row-id="${rowId}"]`);
    if (!input) return;
    input.focus();
    pendingFocusRowIdRef.current = null;
  }, [products.length]);

  // Fetch customer and products data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setIsCreateMode(true)
      try {
        // Fetch customer details
        if (customerId) {
          const customerRes = await api.get(`/api/customers/${customerId}`);
          const c = customerRes.data;
          const addressParts = [];
          if (c.address) addressParts.push(c.address);
          if (c.city) addressParts.push(c.city);
          if (c.state) addressParts.push(c.state);
          if (c.country) addressParts.push(c.country);
          if (c.pincode) addressParts.push(c.pincode);

          // console.log("Fetched customeree", c);
          setCustomer({
            name: c?.name || "",
            phone: c?.phone || "",
            address: addressParts.join(", "),
            email: c?.email || "",
            gstin: c?.gstin || "",
            customerId: c._id, //store ID
          });

          // Fetch customer points
          try {
            const pointsRes = await api.get(
              `/api/customers/${customerId}/points`,
            );
            setCustomerPoints(pointsRes.data.customer?.availablePoints || 0);
          } catch (pointsErr) {
            setCustomerPoints(0);
          }
        }

        // Fetch products
        const productsRes = await api.get("/api/products?limit=1000");
        setProductLoading(true);
        const fetchedProducts = productsRes.data.products || productsRes.data;
        setAllProducts(fetchedProducts);
        setProductOptions(
          fetchedProducts.map((p) => ({
            value: p._id,
            label: p.productName,
            price: p.purchasePrice || 0, // Use purchase price for supplier
            taxRate: parseFloat(p.tax?.match(/\d+/)?.[0]) || 0,
            unit: p.unit || "Piece",
            hsnCode: p?.hsnCode || "",
            taxType: p.tax || "GST 0%",
            discountAmount: p.discountAmount || 0,
            discountType: p.discountType || "Percentage",
            imageUrl: p.images?.[0]?.url || p.images?.[0]?.secure_url || "",
            stock: p.stockQuantity || 0,
          })),
        );

        // Add initial product row
        if (!hasAddedInitialProduct.current && products.length === 0) {
          addProductRow({ focus: false });
          hasAddedInitialProduct.current = true;
        }
      } catch (err) {
        // toast.error("Failed to load data");
        toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to load data");
      } finally {
        setLoading(false);
        setProductLoading(false);
      }
    };
    loadData();
  }, [customerId]);

  // handle customer selection from dropdown
  const handleCustomerSelect = (selectedCustomer) => {
    const addressParts = [];

    // Add street address first
    if (selectedCustomer.address) addressParts.push(selectedCustomer.address);
    // Add city second
    if (selectedCustomer.city) addressParts.push(selectedCustomer.city);
    // Add state third
    if (selectedCustomer.state) addressParts.push(selectedCustomer.state);
    // Add country fourth
    if (selectedCustomer.country) addressParts.push(selectedCustomer.country);
    // Add pincode last
    if (selectedCustomer.pincode) addressParts.push(selectedCustomer.pincode);

    const formattedAddress = addressParts.join(", ");

    setCustomer({
      name: selectedCustomer.name || "",
      phone: selectedCustomer.phone || "",
      address: formattedAddress,
      email: selectedCustomer.email || "",
      gstin: selectedCustomer.gstin || "",
      customerId: selectedCustomer._id, // Store the ID
    });
    //  Fetch customer points
    api
      .get(`/api/customers/${selectedCustomer._id}/points`)
      .then((res) => {
        setCustomerPoints(res.data.customer?.availablePoints || 0);
      })
      .catch(() => setCustomerPoints(0));
    setCustomerSearch(selectedCustomer.name);
    setPhoneSearch(selectedCustomer.phone || "");
    setShowCustomerDropdown(false);
  };

  // handle new customer creation success
  const handleNewCustomerCreated = (newCustomer) => {
    fetchCustomersForSearch();
    // Auto select the newly created customer
    handleCustomerSelect(newCustomer);
    toast.success("Customer created successfully!");
  };

  // clear selected customer
  const handleClearCustomer = () => {
    setCustomer({
      name: "",
      phone: "",
      address: "",
      email: "",
      gstin: "",
      customerId: "",
    });
    setCustomerSearch("");
    setPhoneSearch("");
    setCustomerPoints(0);
  };

  // Initialize search data when products change
  useEffect(() => {
    if (products.length > 0 && allProducts.length > 0) {
      setSearchData((prev) => {
        const updated = { ...prev };
        products.forEach((p) => {
          if (!updated[p.id]) {
            // Filter out already-selected products right from initialization
            const alreadySelectedIds = products
              .filter(other => other.id !== p.id && other.productId)
              .map(other => other.productId);
            updated[p.id] = {
              term: "",
              filtered: allProducts.filter(prod => !alreadySelectedIds.includes(prod._id)),
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

  // Load quotation data for view/edit
  useEffect(() => {
    const loadQuotationData = () => {
      if (viewQuotationData) {
        populateFormWithQuotationData(viewQuotationData);
        setIsReadOnly(true);
        toast.info("Viewing quotation");
      } else if (editQuotationData) {
        populateFormWithQuotationData(editQuotationData);
        setIsReadOnly(false);
        toast.info("Editing quotation - You can modify and save changes");
      }
    };

    if (hasExistingData && !hasAddedInitialProduct.current) {
      loadQuotationData();
    }
  }, [viewQuotationData, editQuotationData]);

  // for load quotation data for edit/negotiations
  // Load quotation data for edit/negotiation
  useEffect(() => {
    const loadQuotationForEdit = async () => {
      // If we have quotationId from URL params
      if (quotationId) {
        try {
          setLoading(true);
          const response = await api.get(`/api/quotations/${quotationId}`);
          if (response.data.success) {
            const quotation = response.data.quotation;
            populateFormWithQuotationData(quotation);
            toast.info("Quotation loaded for editing. You can negotiate terms.");
          }
        } catch (error) {
          toast.error("Failed to load quotation data");
        } finally {
          setLoading(false);
        }
      }
      // If we have data passed via state (from quotation list)
      else if (editQuotationData) {
        populateFormWithQuotationData(editQuotationData);
        if (isNegotiation) {
          toast.info("Quotation loaded for negotiation. Modify terms as needed.");
        } else {
          toast.info("Quotation loaded for editing.");
        }
      }
    };

    if ((quotationId || editQuotationData) && !hasAddedInitialProduct.current) {
      loadQuotationForEdit();
    }
  }, [quotationId, editQuotationData]);

  // Helper functions
  const handleViewManage = () => setViewManageOptions(true);
  const handleViewQuotation = (open) => setViewQuotationOptions(open);
  const handleViewChargeOptions = () => setViewChargeOptions((prev) => !prev);

  // Add this helper near your other helpers:
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

    // A product should be hidden from dropdown only if:
    // 1. It's a non-variant product and already selected, OR
    // 2. It's a variant product and ALL its variants are selected
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

  const handleSearch = (e, rowId) => {
    if (isReadOnly) return;
    const term = e.target.value;
    const normalized = String(term || "").trim();
    const digits = normalized.replace(/\D/g, "").slice(0, 13);
    if (digits.length === 13 && !/[a-z]/i.test(normalized)) {
      const matched = (allProducts || []).find((p) => {
        const code = String(p?.itemBarcode || p?.itemBarCode || p?.itembarcode || "").replace(/\D/g, "");
        return code === digits;
      });
      if (matched) {
        handleProductSelect(matched, rowId);
        return;
      }
    }
    const alreadySelectedIds = getSelectedProductIds(rowId);

    const filtered = allProducts.filter((p) => {
      if (alreadySelectedIds.includes(p._id)) return false;
      const name = String(p?.productName || "").toLowerCase();
      const code = String(p?.itemBarcode || p?.itemBarCode || p?.itembarcode || "").toLowerCase();
      const t = normalized.toLowerCase();
      return name.includes(t) || code.includes(t);
    });

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
    if (isReadOnly) return;
    const inputElement = document.querySelector(`[data-row-id="${rowId}"]`);
    if (!inputElement) return;

    const rect = inputElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const dropdownHeight = 400;

    // Calculate available space below and above
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    let topPosition;
    let direction = 'down';

    // If not enough space below and more space above, position above
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      topPosition = rect.top + window.scrollY - dropdownHeight;
      direction = 'up';
    } else {
      // Position below the input
      topPosition = rect.bottom + window.scrollY;
      direction = 'down';
    }
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: "400px",
      maxHeight: "400px",
      overflowY: "auto",
      backgroundColor: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: "6px",
      boxShadow: "0 4px 12px rgba(0,0,0,.1)",
      zIndex: 10000,
    });

    setActiveSearchId(rowId);
  };

  const handleProductSelect = (product, rowId) => {
    // Find the exact product from allProducts to ensure we have the _id
    const exactProduct = allProducts.find((p) => p._id === product._id);

    if (!exactProduct) {
      toast.error("Product not found");
      return;
    }

    const variantsCount = Array.isArray(exactProduct?.variants) ? exactProduct.variants.length : 0;
    const hasMultipleVariants = variantsCount > 1;

    if (hasMultipleVariants) {
      // Check if product quantity is 0
      const availableStock = exactProduct.stockQuantity || 0;
      if (availableStock <= 0) {
        toast.error(`${exactProduct.productName} is out of stock!`);
        return;
      }
      // Show variant selection popup for products with multiple variants
      setPopupSelectedProduct(exactProduct);
      setPopupSelectedQty(1);
      setPopupActiveImageIndex(0);
      const firstVariant = exactProduct?.variants?.[0] || null;
      setPopupSelectedColor(firstVariant?.color || "");
      setPopupSelectedSize(firstVariant?.size || "");
      const firstSerials = Array.isArray(firstVariant?.serialNumbers) ? firstVariant.serialNumbers.filter(Boolean) : [];
      // setPopupSelectedSerialno(firstSerials.length === 1 ? firstSerials[0] : "");
      setPopupSelectedSerialno([]);
      setPopupMode("variant");
      setPopupSelectedLot("");
      setShowVariantPopup(true);
      return;
    }
    const firstVariant = exactProduct?.variants?.[0] || null;

    let serialNumbers = [];
    let lotNumber = "";
    let productDescription = exactProduct.description || "";
    if (firstVariant) {
      if (firstVariant.description) {
        productDescription = firstVariant.description;
      }
      // Get serial numbers from variant
      if (firstVariant.serialNumbers && Array.isArray(firstVariant.serialNumbers)) {
        serialNumbers = firstVariant.serialNumbers;
      }
      // Get lot number from variant
      if (firstVariant.lotNumber) {
        lotNumber = firstVariant.lotNumber;
      }
    } else {
      if (exactProduct.availableSerialNos && Array.isArray(exactProduct.availableSerialNos)) {
        serialNumbers = exactProduct.availableSerialNos;
      } else if (exactProduct.serialNumbers && Array.isArray(exactProduct.serialNumbers)) {
        serialNumbers = exactProduct.serialNumbers;
      } else if (exactProduct.serialno) {
        if (typeof exactProduct.serialno === 'string') {
          serialNumbers = exactProduct.serialno.split(',').map(s => s.trim()).filter(s => s);
        } else if (Array.isArray(exactProduct.serialno)) {
          serialNumbers = exactProduct.serialno;
        }
      }
    }
    const availableStock = exactProduct.stockQuantity || 0;
    if (availableStock <= 0) {
      toast.error("Product is out of stock");
      return;
    }

    // Update product data with productId
    updateProduct(rowId, "productId", exactProduct._id);
    updateProduct(rowId, "stock", availableStock);

    // Update with product details
    updateProduct(rowId, "itemName", exactProduct.productName);
    updateProduct(rowId, "name", exactProduct.productName);
    updateProduct(rowId, "unitPrice", exactProduct.sellingPrice || 0);
    updateProduct(rowId, "description", productDescription);
    updateProduct(
      rowId,
      "taxRate",
      parseFloat(exactProduct.tax?.match(/\d+/)?.[0]) || 0,
    );
    updateProduct(rowId, "taxType", exactProduct.tax || "GST 0%");
    // updateProduct(rowId, "unit", exactProduct.unit || "Piece");
    updateProduct(rowId, "unit", firstVariant?.unit || exactProduct.unit || "Piece");
    updateProduct(rowId, "hsnCode", exactProduct.hsn?.hsnCode || "");
    updateProduct(rowId, "decscription", exactProduct.description || "");
    updateProduct(rowId, "lotNumber", exactProduct.lotNumber || "");
    updateProduct(rowId, "availableSerialNos", serialNumbers);
    updateProduct(rowId, "selectedSerialNos", []);
    // Set quantity to 1 for newly added product
    updateProduct(rowId, "qty", 1)
    // Clear search term
    setSearchData((prev) => ({
      ...prev,
      [rowId]: {
        term: exactProduct.productName,
        filtered: [],
        isOpen: false,
      },
    }));

    // Close dropdown
    setDropdownStyle({});
    setActiveSearchId(null);
    setTimeout(() => focusNextProductRowInput(), 0);
    setTimeout(() => focusNextProductRowInput(), 650);
  };

const addVariantToRow = (productInfo) => {
  // Change selectedSerialno to selectedSerialnos to match what you're passing
  const { productId, description, variant, quantity, selectedColor, selectedSize, selectedSerialnos, selectedLot } = productInfo;

  // Create a unique identifier for this variant
  const variantSize = selectedSize || variant?.size || "";
  const variantColor = selectedColor || variant?.color || "";
  const serialKey = Array.isArray(selectedSerialnos) ? selectedSerialnos.sort().join(',') : '';
  const variantKey = `${productId}-${variantColor}-${variantSize}-${selectedLot}-${serialKey}`;

  // Check if this variant already exists in the products array
  const existingProductIndex = products.findIndex(p => {
    if (!p.productId || p.productId === "") return false;
    const existingSize = p.selectedSize || p.size || "";
    const existingColor = p.selectedColor || p.color || "";
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

  // Product doesn't exist, find empty row or create new one
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
  updateProduct(targetRowId, "description", description || variant?.description || popupSelectedProduct?.description || "");
  updateProduct(targetRowId, "unitPrice", variant.sellingPrice);
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
  updateProduct(targetRowId, "size", finalSize);
  updateProduct(targetRowId, "color", finalColor);

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

  const addProductRow = ({ focus = false } = {}) => {
    const newId = Date.now() + Math.random();
    if (focus) pendingFocusRowIdRef.current = newId;
    // Get currently selected product IDs to exclude from new row's dropdown
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
        description: "",
        lotNumber: "",
        availableSerialNos: [],
        selectedSerialNos: [],
        selectedColor: "",  // Add this
        selectedSize: "",   // Add this
        stock: 0,
      },
    ]);
    // Initialize search data for this new row
    setSearchData((prev) => ({
      ...prev,
      [newId]: {
        term: "",
        filtered: allProducts.filter(p => !currentlySelectedIds.includes(p._id)), // <-- filtered from start
        isOpen: false,
      },
    }));
  };

  const removeProductRow = (id) => {
    if (products.length > 1) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      // Also remove search data for this row
      setSearchData((prev) => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
    }
  };

  const calculateRowValues = (row, field, value) => {
    let updated = { ...row };

    // Recalculate line
    const qty = parseFloat(updated.qty) || 1;
    const unitPrice = parseFloat(updated.unitPrice) || 0;
    const baseAmount = qty * unitPrice;
    let discAmt = 0;
    let discPct = 0;

    // Check if discountAmt was manually entered (has value)
    if (
      field === "discountAmt" &&
      value !== "" &&
      !isNaN(parseFloat(value))
    ) {
      // User entered discount amount directly
      discAmt = parseFloat(parseFloat(value).toFixed(2)) || 0;
      discAmt = Math.min(discAmt, baseAmount);
      // Calculate percentage from amount
      discPct =
        baseAmount > 0
          ? parseFloat(((discAmt / baseAmount) * 100).toFixed(2))
          : 0;
      updated.discountPct = discPct;
      updated.discountAmt = discAmt;
    }
    // Check if discountPct was manually entered
    else if (
      field === "discountPct" &&
      value !== "" &&
      !isNaN(parseFloat(value))
    ) {
      discPct = parseFloat(parseFloat(value).toFixed(2)) || 0;
      discAmt = parseFloat(((baseAmount * discPct) / 100).toFixed(2));
      discAmt = Math.min(discAmt, baseAmount); // Cap discount at base amount
      updated.discountPct = discPct;
      updated.discountAmt = discAmt;
    }
    // Otherwise use existing values
    else {
      discPct = parseFloat(parseFloat(updated.discountPct || 0).toFixed(2));
      discAmt = parseFloat(((baseAmount * discPct) / 100).toFixed(2));
      discAmt = Math.min(discAmt, baseAmount);
      updated.discountPct = discPct;
      updated.discountAmt = discAmt;
    }

    // Calculate taxable amount (after discount)
    const taxableAmount = Math.max(baseAmount - discAmt, 0);

    // Calculate tax - always calculate tax for quotations
    const taxRate = parseFloat(updated.taxRate) || 0;
    const taxAmount = parseFloat(((taxableAmount * taxRate) / 100).toFixed(2));
    updated.taxAmount = taxAmount;

    // Calculate final amount - always include tax
    updated.amount = parseFloat((taxableAmount + taxAmount).toFixed(2));

    return updated;
  };

  const updateProduct = (id, field, value) => {
    setProducts((prev) => {
      // Check for duplicate product selection
      // if (field === "productId" && value) {
      //   const existingRowIndex = prev.findIndex(
      //     (p) => p.productId === value && p.id !== id
      //   );

      //   if (existingRowIndex !== -1) {
      //     const existingRow = prev[existingRowIndex];
      //     const newQty = (parseFloat(existingRow.qty) || 0) + 1;
      //     const availableStock = parseFloat(existingRow.stock) || 0;

      //     if (availableStock > 0 && newQty > availableStock) {
      //       toast.error(`Cannot exceed available stock of ${availableStock}`);
      //       return prev;
      //     }

      //     // toast.success(`Increased quantity for ${existingRow.itemName}`);

      //     // Update existing row and remove current row
      //     const updatedProducts = prev.map((p, idx) => {
      //       if (idx === existingRowIndex) {
      //         const updated = { ...p, qty: newQty };
      //         return calculateRowValues(updated, "qty", newQty);
      //       }
      //       return p;
      //     });

      //     // Remove the row being edited
      //     return updatedProducts.filter((p) => p.id !== id);
      //   }
      // }
      // Check for duplicate product selection - BUT skip for variant products
      if (field === "productId" && value) {
        // Get the current row to check if it has variant info
        const currentRow = prev.find(p => p.id === id);

        // Check if this row already has variant info (from addVariantToRow)
        const hasVariantInfo = currentRow?.selectedSize || currentRow?.selectedColor;
        const isNewRow = !currentRow?.productId;

        // Only check for duplicates if this is NOT a variant product
        // OR if the current row doesn't have variant info yet
        if (!hasVariantInfo && isNewRow) {
          const existingRowIndex = prev.findIndex(
            (p) => p.productId === value && p.id !== id && !p.selectedSize && !p.selectedColor
          );

          if (existingRowIndex !== -1) {
            const existingRow = prev[existingRowIndex];
            const newQty = (parseFloat(existingRow.qty) || 0) + 1;
            const availableStock = parseFloat(existingRow.stock) || 0;

            if (availableStock > 0 && newQty > availableStock) {
              toast.error(`Cannot exceed available stock of ${availableStock}`);
              return prev;
            }

            // Update existing row and remove current row
            const updatedProducts = prev.map((p, idx) => {
              if (idx === existingRowIndex) {
                const updated = { ...p, qty: newQty };
                return calculateRowValues(updated, "qty", newQty);
              }
              return p;
            });

            return updatedProducts.filter((p) => p.id !== id);
          }
        }
      }

      return prev.map((p) => {
        if (p.id !== id) return p;

        let updated = { ...p };

        // Handle quantity specially to enforce minimum of 1
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
            updated.qty = numValue;  // Don't force to 1
          } else if (numValue > availableStock && availableStock > 0) {
            updated.qty = availableStock;
            toast.error(`Cannot exceed available stock of ${availableStock}`);
          } else {
            updated.qty = numValue;
          }
        } else {
          updated[field] = value;
        }

        // If product selected from dropdown
        if (field === "productId" && value) {
          const isSameProduct = p.productId === value;
          const selected = allProducts.find((prod) => prod._id === value);
          if (selected) {
            let newQty = 1;
            if (isSameProduct) {
              newQty = (parseFloat(p.qty) || 0) + 1;
              const availableStock = parseFloat(selected.stockQuantity) || 0;
              if (availableStock > 0 && newQty > availableStock) {
                toast.error(`Cannot exceed available stock of ${availableStock}`);
                newQty = availableStock;
              }
            }

            // Calculate discount based on discountType
            let discountPct = 0;
            let discountAmt = 0;

            // Find product option for discount info
            const productOption = productOptions.find(
              (opt) => opt.value === value,
            );
            if (productOption) {
              if (productOption.discountType === "Percentage") {
                discountPct = parseFloat(
                  (productOption.discountAmount || 0).toFixed(2),
                );
              } else if (productOption.discountType === "Fixed") {
                discountAmt = productOption.discountAmount || 0;
                if (productOption.price > 0) {
                  discountPct = parseFloat(
                    ((discountAmt / productOption.price) * 100).toFixed(2),
                  );
                }
              }
            }
            updated = {
              ...updated,
              productId: value,
              itemName: selected.productName,
              name: selected.productName,
              unitPrice: selected.sellingPrice || 0,
              taxRate: parseFloat(selected.tax?.match(/\d+/)?.[0]) || 0,
              taxType: selected.tax || "GST 0%",
              unit: selected.unit || "Piece",
              hsnCode: selected.hsnCode || "",
              qty: newQty,
              stock: selected.stockQuantity || 0,
              discountPct: discountPct,
              discountAmt: discountAmt,
            };
          }
        }

        // Handle manual discount updates
        if (field === "discountPct") {
          const pctValue = parseFloat(parseFloat(value).toFixed(2)) || 0;
          updated.discountPct = pctValue;
        } else if (field === "discountAmt") {
          const amtValue = parseFloat(parseFloat(value).toFixed(2)) || 0;
          updated.discountAmt = amtValue;
        }

        return calculateRowValues(updated, field, value);
      });
    });
  };


  // Handle file upload - Support multiple file types
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);

    // Expanded allowed types
    const allowedTypes = [
      // Images
      "image/jpeg", "image/jpg", "image/png", "image/gif",
      // Documents
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
      "text/csv", // csv
      "application/msword", // doc
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
      "text/plain" // txt
    ];

    const validFiles = files.filter((file) => allowedTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      toast.error("Some files were not allowed. Allowed: Images, PDF, Excel, CSV, DOC, TXT");
    }

    const newFiles = validFiles.map((file) => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      filename: file.name,
      type: file.type,
      size: file.size
    }));

    setUploadedImages((prev) => [...prev, ...newFiles]);
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
        setAdditionalChargesDetails((prev) => ({
          ...prev,
          [chargeKey]: parseFloat(chargeAmount) || 0,
        }));
        setChargeAmount("");
        setSelectedChargeType("");
        setViewChargeOptions(false);
        toast.success(`${selectedChargeType} added: ₹${chargeAmount}`);
      }
    } else {
      toast.error("Please select a charge type and enter amount");
    }
  };

  // Handle date selection for quotation date
  const handleDateSelect = (option) => {
    const today = new Date();
    let selectedDate = new Date();

    switch (option) {
      case "Today":
        selectedDate = today;
        setQuotationDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Yesterday":
        selectedDate = new Date(today.setDate(today.getDate() - 1));
        setQuotationDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last Week":
        selectedDate = new Date(today.setDate(today.getDate() - 7));
        setQuotationDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last 15 Days":
        selectedDate = new Date(today.setDate(today.getDate() - 15));
        setQuotationDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Last Month":
        selectedDate = new Date(today.setMonth(today.getMonth() - 1));
        setQuotationDate(selectedDate);
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        break;
      case "Custom":
        setIsDatePickerOpen(true);
        break;
    }
  };

  // Handle validity date dropdown
  const handleValidityDateManage = () => {
    setViewValidityOptions(!viewValidityOptions);
  };

  // Handle validity date selection
  const handleValidityDateSelect = (option) => {
    let newValidityDate = new Date();

    switch (option) {
      case "Today":
        newValidityDate = new Date();
        break;
      case "Yesterday":
        newValidityDate = new Date();
        newValidityDate.setDate(newValidityDate.getDate() - 1);
        break;
      case "Last Week":
        newValidityDate = new Date();
        newValidityDate.setDate(newValidityDate.getDate() - 7);
        break;
      case "Last 15 Days":
        newValidityDate = new Date();
        newValidityDate.setDate(newValidityDate.getDate() - 15);
        break;
      case "Last Month":
        newValidityDate = new Date();
        newValidityDate.setMonth(newValidityDate.getMonth() - 1);
        break;
      case "Custom":
        setIsValidityDatePickerOpen(true);
        setViewValidityOptions(false);
        return;
      default:
        newValidityDate = addDays(new Date(), 30);
    }

    setValidityDate(newValidityDate);

    // Calculate and set validForDays based on difference from quotation date
    const diffTime = newValidityDate - quotationDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 1 && diffDays <= 365) {
      setValidForDays(diffDays);
    } else if (diffDays < 1) {
      setValidForDays(1);
    } else if (diffDays > 365) {
      setValidForDays(365);
    }

    setViewValidityOptions(false);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (isFromNavbar) {
      if (!customer.customerId) {
        newErrors.customerName = "Please select a customer";
      }
    } else {
      if (!customer.name.trim()) {
        newErrors.customerName = "Customer name is required";
      }
    }

    if (!customer.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(customer.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    if (!customer.address.trim()) {
      newErrors.address = "Address is required";
    }

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
    const invalidProducts = products.filter(p => {
      // Check if product is selected (has productId) but quantity is 0 or empty
      if (p.productId && (!p.qty || parseFloat(p.qty) === 0)) {
        return true;
      }
      return false;
    });

    if (invalidProducts.length > 0) {
      const productNames = invalidProducts.map(p => p.itemName || "Selected product").join(", ");
      toast.error(`Please set quantity for: ${productNames}`);
      return false;
    }

    return true;
  };

  // Helper function to populate form with quotation data
  const populateFormWithQuotationData = (quotation) => {
    setIsCreateMode(false);
    // Set customer data
    if (quotation.customerId) {
      const customerData = quotation.customerId;
      const addressParts = [];
      if (customerData.address) addressParts.push(customerData.address);
      if (customerData.city) addressParts.push(customerData.city);
      if (customerData.state) addressParts.push(customerData.state);
      if (customerData.country) addressParts.push(customerData.country);
      if (customerData.pincode) addressParts.push(customerData.pincode);

      setCustomer({
        name: customerData.name || "",
        phone: customerData.phone || "",
        address: addressParts.join(", "),
        email: customerData.email || "",
        gstin: customerData.gstin || "",
        customerId: customerData._id,
      });
      setCustomerSearch(customerData.name || "");
      setPhoneSearch(customerData.phone || "");

      // Fetch customer points
      if (customerData._id) {
        api.get(`/api/customers/${customerData._id}/points`)
          .then(res => setCustomerPoints(res.data.customer?.availablePoints || 0))
          .catch(() => setCustomerPoints(0));
      }
    }

    // Set quotation basic info
    if (quotation.quotationDate) setQuotationDate(new Date(quotation.quotationDate));
    if (quotation.expiryDate) setExpiryDate(new Date(quotation.expiryDate));
    if (quotation.validForDays) setValidForDays(quotation.validForDays);
    if (quotation.quotationNo) setQuotationNo(quotation.quotationNo);
    if (quotation.status) setStatus(quotation.status);

    // Set billing address if available
    if (quotation.billingAddress) {
      setCustomer(prev => ({ ...prev, address: quotation.billingAddress }));
    }

    // Set products
    if (quotation.items && quotation.items.length > 0) {
      const loadedProducts = quotation.items.map((item, index) => ({
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
        hsnCode: item.hsnCode,
        description: item.description || "",
        lotNumber: item.lotNumber || "",
        availableSerialNos: item.selectedSerialNos || [],
        selectedSerialNos: item.selectedSerialNos || [],
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        stock: item.stock || 0,
      }));
      setProducts(loadedProducts);
      hasAddedInitialProduct.current = true;
    }

    // Set additional discount
    if (quotation.additionalDiscount) {
      if (quotation.additionalDiscount.pct > 0) {
        setAdditionalDiscountType("Percentage");
        setAdditionalDiscountPct(quotation.additionalDiscount.pct);
      } else if (quotation.additionalDiscount.amt > 0) {
        setAdditionalDiscountType("Fixed");
        setAdditionalDiscountAmt(quotation.additionalDiscount.amt);
      }
    }

    // Set additional charges
    if (quotation.additionalChargesDetails) {
      setAdditionalChargesDetails({
        shipping: quotation.additionalChargesDetails.shipping || 0,
        handling: quotation.additionalChargesDetails.handling || 0,
        packing: quotation.additionalChargesDetails.packing || 0,
        service: quotation.additionalChargesDetails.service || 0,
        other: quotation.additionalChargesDetails.other || 0,
      });
    }

    // Set payment info
    if (quotation.grandTotal) {
      setAmountReceived(quotation.paidAmount?.toString() || "");
      setFullyReceived(quotation.fullyReceived || false);
    }

    // Set attachments if any
    if (quotation.attachments && quotation.attachments.length > 0) {
      const images = quotation.attachments.map(att => ({
        file: null,
        preview: att.url,
        filename: att.filename,
      }));
      setUploadedImages(images);
    }

    // Set round off
    if (quotation.autoRoundOff !== undefined) {
      setAutoRoundOff(quotation.autoRoundOff);
    }
  };

  // Handle form submission for quotation
  const handleSubmit = async (shouldPrint = false) => {

    if (!customer.customerId) {
      toast.error("Please select a customer first");
      return;
    }

    if (isSubmitting) {
      // console.log("Already submitting, returning...");
      return;
    }

    // FILTER OUT EMPTY PRODUCT ROWS - ADD THIS SECTION
    const nonEmptyProducts = products.filter(
      (p) =>
        p.productId &&
        p.productId.trim() !== "" &&
        p.itemName &&
        p.itemName.trim() !== "",
    );

    if (nonEmptyProducts.length !== products.length) {
      setProducts(nonEmptyProducts);
      // toast.info(`Removed ${products.length - nonEmptyProducts.length} empty row(s) before saving`,);
    }

    if (nonEmptyProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }
    if (!validateProductsBeforeSave()) {
      return;
    }

    // Check stock availability for all products before submitting
    for (const product of nonEmptyProducts) {
      if (product.productId) {
        try {
          const response = await api.get(`/api/products/${product.productId}`);
          const prodData = response.data;

          const availableStock = prodData.stockQuantity || 0;

          if (availableStock < (product.qty || 1)) {
            toast.error(
              `Insufficient stock for ${prodData.productName}! Available: ${availableStock}, Requested: ${product.qty}`,
            );
            setIsSubmitting(false);
            return; // Stop submission
          }
        } catch (error) {
          console.error(
            `Error checking stock for product ${product.productId}:`,
            error,
          );
          // Continue anyway if check fails
        }
      }
    }

    const { isValid, errors } = validateForm(nonEmptyProducts);
    if (!isValid) {
      const firstErrorKey = Object.keys(errors)[0];
      toast.error(errors[firstErrorKey]);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare FormData for file uploads
      const formData = new FormData();

      // Add all quotation data as separate fields
      // formData.append("customerId", customerId);
      // use customer.customerId in the form data
      formData.append("customerId", customer.customerId);
      formData.append("quotationDate", quotationDate.toISOString());
      formData.append("expiryDate", expiryDate.toISOString());
      formData.append("validForDays", validForDays);
      formData.append("billingAddress", customer.address);
      formData.append("shippingAddress", customer.address);
      formData.append("subtotal", subtotal);
      formData.append("totalTax", totalTax);
      formData.append("totalDiscount", totalDiscount);
      formData.append("additionalCharges", additionalChargesTotal);
      formData.append(
        "shoppingPointsUsed",
        usePoints ? parseFloat(shoppingPointsUsed) || 0 : 0,
      );
      formData.append("pointValue", POINT_VALUE);
      formData.append("autoRoundOff", autoRoundOff);
      formData.append("grandTotal", grandTotal);

      // Determine status based on payment
      // const finalStatus =
      //   fullyReceived || (parseFloat(amountReceived) || 0) >= grandTotal
      //     ? "paid"
      //     : "draft";
      // formData.append("status", finalStatus);
      formData.append("status", "draft");

      formData.append("fullyReceived", fullyReceived);
      formData.append("paidAmount", parseFloat(amountReceived) || 0);
      formData.append("notes", "");
      formData.append("termsAndConditions", "");

      // Add additional discount as object
      formData.append(
        "additionalDiscount[pct]",
        parseFloat(additionalDiscountPct) || 0,
      );
      formData.append(
        "additionalDiscount[amt]",
        parseFloat(additionalDiscountAmt) || 0,
      );

      // Add additional charges details as separate fields
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

      // Add items array
      nonEmptyProducts.forEach((p, index) => {
        formData.append(`items[${index}][productId]`, p.productId);
        formData.append(`items[${index}][itemName]`, p.itemName || p.name);
        formData.append(`items[${index}][hsnCode]`, p.hsnCode || "");
        formData.append(`items[${index}][description]`, p.description || "");
        formData.append(`items[${index}][lotNumber]`, p.lotNumber || "");
        formData.append(`items[${index}][qty]`, parseFloat(p.qty));
        formData.append(`items[${index}][unit]`, p.unit);
        formData.append(`items[${index}][unitPrice]`, parseFloat(p.unitPrice));
        formData.append(`items[${index}][taxType]`, `GST ${p.taxRate}%`);
        formData.append(`items[${index}][taxRate]`, p.taxRate);
        formData.append(`items[${index}][taxAmount]`, p.taxAmount);
        formData.append(
          `items[${index}][discountPct]`,
          parseFloat(p.discountPct) || 0,
        );
        formData.append(`items[${index}][discountAmt]`, p.discountAmt);
        formData.append(`items[${index}][amount]`, p.amount);
        formData.append(`items[${index}][selectedSerialNos]`, JSON.stringify(p.selectedSerialNos || []));
      });

      // Add uploaded images
      uploadedImages.forEach((image, index) => {
        formData.append(`attachments`, image.file, image.filename);
      });

      let response;
      const existingQuotationId = quotationId || editQuotationData?._id;
      // console.log("Updating quotation with ID:", existingQuotationId);
      // console.log("Customer ID being sent:", customer.customerId);
      // console.log("Customer Name being sent:", customer.name);
      // console.log("Full formData being sent:", Object.fromEntries(formData));

      // 🚨 CRITICAL: CHECK IF WE'RE UPDATING OR CREATING
      if (existingQuotationId) {
        // UPDATE EXISTING QUOTATION
        // console.log("Updating existing quotation:", quotationId);
        response = await api.put(`/api/quotations/${existingQuotationId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Quotation updated successfully!");
      } else {
        // CREATE NEW QUOTATION
        // console.log("Creating new quotation");
        response = await api.post("/api/quotations", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        toast.success("Quotation created successfully!");
      }

      // console.log("Response:", response.data);

      if (response.data.success) {
        const newQuotationId = response.data.quotation._id;

        if (shouldPrint) {
          // Navigate to print page for quotation
          navigate(`/skeleton?redirect=/showquotation/${newQuotationId}`); // Create this route
        }
        else {
          // Determine where to go back to
          if (isFromCustomerPage || customerId) {
            // If we came from customer page, go back to customer page
            navigate(`/skeleton?redirect=/customers`);
            toast.success("Quotation created successfully! Returning to customer page.");
          }
          else {
            // Navigate to show customer page
            navigate("/skeleton?redirect=/quotation");
          }
        }
      } else {
        toast.error(response.data.error || "Operation failed");
      }
    } catch (error) {
      // console.error("Quotation operation failed:", error);
      toast.error(error?.response?.data?.message || "Quotation operation failed");

      // Show detailed error information
      if (error.response?.data?.error) {
        toast.error(`Backend error: ${error.response.data.error}`);
      } else if (error.response?.data?.message) {
        toast.error(`Validation error: ${error.response.data.message}`);
      } else if (error.response?.data?.details) {
        const validationErrors = error.response.data.details.join(", ");
        toast.error(`Validation errors: ${validationErrors}`);
      } else if (error.response?.status === 500) {
        toast.error("Server error 500. Check backend logs.");
      } else {
        toast.error("Failed to process quotation. Please try again.");
      }

      // Log full error for debugging
      // console.log("Full error response:", error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for preview
  const parseNumber = (num) => parseFloat(num) || 0;
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewManageRef.current && !viewManageRef.current.contains(event.target)) {
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
      }
      // Add this for validity date
      if (validityDateRef.current && !validityDateRef.current.contains(event.target)) {
        setViewValidityOptions(false);
        setIsValidityDatePickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const styles = `
  .product-row:hover .delete-icon {
    opacity: 1 !important;
  }
  
  .product-row:hover {
    background-color: #f8f9fa !important;
  }
  
  /* Style for all input fields in the products table */
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
  
  /* For read-only inputs */
  .table-input-readonly {
    background: var(--Spinning-Frame, #E9F0F4);
  }
`;

  if (loading) return <div>Loading...</div>;

  // ... rest of your JSX remains the same ...
  return (
    <>
      <style>{styles}</style>
      <div className="p-4" style={{ height: "100vh" }}>
        <div className="">
          {/* Header */}
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0px 0px 16px 0px",
            }}
          >
            {/* Left: Title + Icon */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                height: "32px",
              }}
            >
              {/* Icon Container */}
              {/* <Link to="/quotation" style={{ textDecoration: "none" }}> */}
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
              {/* </Link> */}

              {/* Title */}
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
                {isViewMode ? "View Quotation" : (isEditMode ? (isNegotiation ? "Convert to Proforma Invocie" : "Edit Quotation") : "Create Quotation")}
              </h2>
            </div>

            {/* Right: Preview Button */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                height: "33px",
              }}
            >
              <div
                onClick={() => handleViewQuotation(true)}
                style={{
                  padding: "6px 16px",
                  background: "#1F7FFF",
                  border: "1px solid #1F7FFF",
                  borderRadius: 8,
                  textDecoration: "none",
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
              height: "calc(100vh - 180px)",
            }}
          >
            {/* Customer Details */}
            <div style={{ width: "100%" }}>

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
                Customer Details
              </div>

              {/* customer details + quotation dates */}
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
                  {/* left side = customer details */}
                  <div style={{
                    width: "50%",
                    borderRight: "2px solid #eee",
                  }}>
                    {/* customer name + phone no */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        gap: "45px",
                        width: '100%'
                      }}
                    >
                      {/* customer name */}
                      <div style={{ display: "flex", flexDirection: "column", width: '40%' }}>
                        <label>
                          Customer Name<span style={{ color: "red" }}>*</span>
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
                          className="customer-search-container"
                        >
                          {/* Input field */}
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {isFromNavbar && !customer.name && (
                              <FiSearch
                                style={{
                                  color: "#666",
                                  cursor: isFromNavbar ? "pointer" : "default",
                                  fontSize: "16px",
                                }}
                                onClick={() =>
                                  isFromNavbar && setShowCustomerDropdown(true)
                                }
                              />
                            )}
                            <input
                              type="text"
                              placeholder={
                                isFromNavbar
                                  ? "Search by name..."
                                  : "Enter Name"
                              }
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: isFromNavbar ? "pointer" : "text",
                                ...(isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                              }}
                              value={customer.name}
                              onChange={(e) => {
                                if (isFromNavbar) {
                                  // In navbar mode, show dropdown and search
                                  setCustomerSearch(e.target.value);
                                  setShowCustomerDropdown(true);
                                  // Don't update customer name directly - wait for selection
                                } else {
                                  // In customer page mode, update directly
                                  setCustomer({
                                    ...customer,
                                    name: e.target.value,
                                  });
                                }
                              }}
                              onFocus={() =>
                                isFromNavbar && setShowCustomerDropdown(true)
                              }
                              readOnly={isFromNavbar && customer.customerId || isReadOnly} // Read-only when customer is selected
                            />
                          </div>

                          {/* Action buttons */}
                          {isFromNavbar && !isReadOnly && (
                            <div style={{ display: "flex", gap: "4px" }}>
                              {customer.customerId ? (
                                // When customer is selected - show clear button
                                <button
                                  onClick={handleClearCustomer}
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
                                // When no customer - show add button
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

                          {/* Customer Dropdown */}
                          {isFromNavbar && showCustomerDropdown && (
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
                              {filteredCustomers.length === 0 ? (
                                <div
                                  style={{
                                    padding: "12px",
                                    color: "#666",
                                    textAlign: "center",
                                  }}
                                >
                                  {customerSearch.trim() ||
                                    phoneSearch.trim() ? (
                                    <>
                                      No customers found
                                      {customerSearch.trim() &&
                                        ` for name: "${customerSearch}"`}
                                      {phoneSearch.trim() &&
                                        ` for phone: "${phoneSearch}"`}
                                      <div style={{ marginTop: "8px" }}>
                                        <button
                                          onClick={() => {
                                            setOpenAddModal(true);
                                            setShowCustomerDropdown(false);
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
                                          + Add New Customer
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    "Start typing to search customers"
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
                                    {filteredCustomers.length} customer(s)
                                    found
                                    {customerSearch.trim() &&
                                      ` for name: "${customerSearch}"`}
                                    {phoneSearch.trim() &&
                                      ` for phone: "${phoneSearch}"`}
                                    <button
                                      onClick={() => {
                                        setOpenAddModal(true);
                                        setShowCustomerDropdown(false);
                                      }}
                                      style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#1F7FFF",
                                        cursor: "pointer",
                                        fontWeight: "500",
                                      }}
                                    >
                                      + Add new
                                    </button>
                                  </div>
                                  {filteredCustomers.map((cust) => (
                                    <div
                                      key={cust._id}
                                      onClick={() => handleCustomerSelect(cust)}
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
                                        {cust.name?.charAt(0).toUpperCase() ||
                                          "C"}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "500" }}>
                                          {cust.name}
                                        </div>
                                        <div
                                          style={{
                                            fontSize: "12px",
                                            color: "#666",
                                          }}
                                        >
                                          {cust.phone || "No phone"} • ✉️{" "}
                                          {cust.email || "No email"}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {errors.customerName && (
                          <div
                            style={{
                              color: "red",
                              fontSize: "12px",
                              marginTop: "4px",
                            }}
                          >
                            {errors.customerName}
                          </div>
                        )}
                      </div>

                      {/* phone number */}
                      <div style={{ display: "flex", flexDirection: "column", width: '40%' }}>
                        <label>
                          Phone No.<span style={{ color: "red" }}>*</span>
                        </label>
                        <div
                          style={{
                            width: "100%",
                            borderRadius: "8px",
                            border: "1px solid #EAEAEA",
                            padding: "6px 8px",
                            display: "flex",
                            gap: "16px",
                            marginTop: "4px",
                            alignItems: "center",
                            position: "relative",
                          }}
                          className="customer-search-container"
                        >
                          <div
                            className="d-flex "
                            style={{ borderRight: "1px solid #EAEAEA", width: '70px' }}
                          >
                            <img src={indialogo} alt="india-logo" />
                            <span
                              style={{ color: "black", padding: "0px 10px" }}
                            >
                              {" "}
                              +91{" "}
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
                            {isFromNavbar && !customer.customerId && (
                              <FiSearch
                                style={{
                                  color: "#666",
                                  cursor: isFromNavbar
                                    ? "pointer"
                                    : "default",
                                  fontSize: "16px",
                                }}
                                onClick={() =>
                                  isFromNavbar &&
                                  setShowCustomerDropdown(true)
                                }
                              />
                            )}
                            <input
                              type="text"
                              placeholder={
                                isFromNavbar
                                  ? "Search by phone..."
                                  : "Enter Customer No"
                              }
                              style={{
                                // width: "250px",
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: isFromNavbar ? "pointer" : "text",
                                ...(isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                              }}
                              value={
                                isFromNavbar ? phoneSearch : customer.phone
                              }
                              onChange={(e) => {
                                // Remove all non-numeric characters
                                const value = e.target.value.replace(
                                  /\D/g,
                                  "",
                                );
                                if (isFromNavbar) {
                                  // Update only phone search, clear customer search
                                  setPhoneSearch(value);
                                  setCustomerSearch(""); // Clear customer name search
                                  setShowCustomerDropdown(true);
                                } else {
                                  setCustomer({
                                    ...customer,
                                    phone: value,
                                  });
                                }
                              }}
                              onFocus={() =>
                                isFromNavbar && setShowCustomerDropdown(true)
                              }
                              readOnly={isFromNavbar && customer.customerId || isReadOnly}
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

                    {/* billing address */}
                    <div style={{ marginTop: "10px", width: "50%" }}>
                      <label>
                        Billing Address<span style={{ color: "red" }}>*</span>
                      </label>
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
                            ...(isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                          }}
                          value={customer.address}
                          onChange={(e) =>
                            setCustomer({
                              ...customer,
                              address: e.target.value,
                            })
                          }
                          readOnly={isReadOnly}
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

                  {/* Right side = quotation data + quotation number */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      gap: "10px",
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
                        {/* quotation date */}
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
                            Quotation Date
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
                              background: "#fff",
                            }}
                            onClick={handleViewManage}
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
                              {format(quotationDate, "dd MMM yyyy")}
                            </div>
                            <FiChevronDown />
                            {viewManageOptions && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "35px",
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

                            {/* DatePicker for Custom selection */}
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
                                  selected={quotationDate}
                                  onChange={(date) => {
                                    if (date) {
                                      setQuotationDate(date);
                                    }
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

                        {/* quotation number */}
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
                            Quotation no
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
                          >
                            <input
                              type="text"
                              value={quotationNo}
                              onChange={(e) => setQuotationNo(e.target.value)}
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
                              disabled={!isEditMode} // Only editable in edit mode
                            />
                          </div>
                        </div>
                        {/* for validity date start */}
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
                            Validity Date
                          </span>

                          <div
                            ref={validityDateRef}
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
                            onClick={handleValidityDateManage}
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
                              {format(validityDate, "dd MMM yyyy")}
                            </div>
                            <FiChevronDown />
                            {viewValidityOptions && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "35px",
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
                                      onClick={() => handleValidityDateSelect(option)}
                                    >
                                      <span style={{ color: "black" }}>{option}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* DatePicker for Custom selection */}
                            {isValidityDatePickerOpen && (
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
                                  selected={validityDate}
                                  onChange={(date) => {
                                    if (date) {
                                      setValidityDate(date);
                                      // Calculate validForDays based on selected validity date
                                      const diffTime = date - quotationDate;
                                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                      if (diffDays >= 1 && diffDays <= 365) {
                                        setValidForDays(diffDays);
                                      }
                                    }
                                    setIsValidityDatePickerOpen(false);
                                    setViewValidityOptions(false);
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
                                      setIsValidityDatePickerOpen(false);
                                      setViewValidityOptions(false);
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
                        {/* for validity date end */}
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
                    // onClick={() => handleViewQuotation(true)}
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
                </div>
              </div>

              {/* Products Table - Same as invoice */}
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  // overflowX: "auto",
                  cursor: "pointer",
                  zIndex: 999,
                }}
              >
                {/* Header */}
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
                  {/* Left side */}
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
                        minWidth: 200,
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
                      >Items</div>
                    </div>
                  </div>

                  {/* Right side */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexShrink: 0,
                    }}
                  >
                    {/* <div style={dividerStyle} /> */}
                    {settings.hsn && (
                    <div style={{
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
                    }}>
                      <div style={{
                        color: "#727681",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: "16.80px",
                        wordWrap: "break-word",
                      }}>HSN</div>
                    </div>
                    )}
                    <div style={dividerStyle} />
                    {settings.description && (
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
                          <div
                            style={{
                              color: "#727681",
                              fontSize: 14,
                              fontFamily: "Inter",
                              fontWeight: "500",
                              lineHeight: "16.80px",
                              wordWrap: "break-word",
                            }}
                          >Description</div>
                        </div>
                        <div style={dividerStyle} />
                      </>
                    )}

                    {settings.lotno && (
                      <>
                        <div
                          style={{
                            width: 100,
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
                          <div
                            style={{
                              color: "#727681",
                              fontSize: 14,
                              fontFamily: "Inter",
                              fontWeight: "500",
                              lineHeight: "16.80px",
                              wordWrap: "break-word",
                            }}
                          >Lot No</div>
                        </div>
                        <div style={dividerStyle} />
                      </>
                    )}

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
                      >Qty</div>
                    </div>
                    <div style={dividerStyle} />

                    {settings.serialno && (
                      <>
                        <div
                          style={{
                            width: 150,
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
                          >Serial No</div>
                        </div>
                        <div style={dividerStyle} />
                      </>
                    )}

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
                      >Unit Price</div>
                    </div>
                    <div style={dividerStyle} />

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
                          ...headerTextStyle,
                          color: taxSettings.enableGSTBilling
                            ? "#727681"
                            : "#A2A8B8",
                          opacity: taxSettings.enableGSTBilling ? 1 : 0.5,
                        }}
                      >
                        Tax
                      </div>
                    </div>
                    <div style={dividerStyle} />

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
                          ...headerTextStyle,
                          color: taxSettings.enableGSTBilling
                            ? "#727681"
                            : "#A2A8B8",
                          opacity: taxSettings.enableGSTBilling ? 1 : 0.5,
                        }}
                      >
                        Tax Amount
                      </div>
                    </div>
                    <div style={dividerStyle} />

                    <div style={{
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
                    }}>
                      <div style={headerTextStyle}>Discount</div>
                    </div>
                    <div style={dividerStyle} />

                    <div
                      style={{
                        width: 90,
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
                      >Amount</div>
                    </div>
                  </div>
                </div>

                {/* Body */}
                {!products || products.length === 0 ? (
                  <div
                    style={{
                      width: "100%",
                      padding: "16px",
                      textAlign: "center",
                      color: "#6b7280",
                      fontSize: 14,
                      background: "#fff",
                      borderLeft: "1px solid #EAEAEA",
                      borderRight: "1px solid #EAEAEA",
                      borderBottom: "1px solid #EAEAEA",
                      borderBottomLeftRadius: 8,
                      borderBottomRightRadius: 8,
                      boxSizing: "border-box",
                    }}
                  >
                    No Product found
                  </div>
                ) : (
                  <div
                    style={{
                      width: "max-content",
                      minWidth: "100%",
                      paddingLeft: 8,
                      paddingRight: 8,
                      paddingTop: 4,
                      paddingBottom: 4,
                      background: "#fff",
                      borderBottomRightRadius: 8,
                      borderBottomLeftRadius: 8,
                      borderLeft: "1px solid #EAEAEA",
                      borderRight: "1px solid #EAEAEA",
                      borderBottom: "1px solid #EAEAEA",
                      display: "flex",
                      flexDirection: "column",
                      boxSizing: "border-box",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                    }}
                  >
                    {products.map((p, idx) => (
                      <div
                        key={p.id}
                        className="product-row"
                        style={{
                          width: "100%",
                          minHeight: 56,
                          background: "#fff",
                          borderBottom:
                            idx !== products.length - 1
                              ? "1px solid #EAEAEA"
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          position: "relative",
                          zIndex: activeSearchId === p.id ? 0 : 1,
                          overflow: "visible",
                          boxSizing: "border-box",
                        }}
                      >
                        {!isReadOnly && (
                          <div
                            className="delete-icon"
                            style={{
                              position: "absolute",
                              left: 8,
                              top: "50%",
                              transform: "translateY(-50%)",
                              opacity: 0,
                              transition: "opacity 0.2s",
                              zIndex: 2,
                              width: 20,
                              height: 20,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                            }}
                          >
                            <RiDeleteBinLine
                              className="text-danger"
                              style={{ cursor: "pointer", fontSize: 16 }}
                              onClick={() => removeProductRow(p.id)}
                            />
                          </div>
                        )}

                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            paddingTop: 4,
                            paddingBottom: 4,
                            boxSizing: "border-box",
                          }}
                        >
                          {/* Left part */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                              flexShrink: 0,
                            }}
                          >
                            <div
                              style={{
                                width: COL.sl,
                                minHeight: 30,
                                paddingLeft: 2,
                                paddingTop: 4,
                                paddingBottom: 4,
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 8,
                                display: "flex",
                                flexShrink: 0,
                                boxSizing: "border-box",
                              }}
                            >
                              <div
                                style={{
                                  textAlign: "center",
                                  color: "#0E101A",
                                  fontSize: 14,
                                  fontFamily: "Inter",
                                  fontWeight: "400",
                                  lineHeight: "16.8px",
                                }}
                              >
                                {idx + 1}
                              </div>
                            </div>

                            <div
                              className="search-input-container"
                              style={{
                                width: COL.item,
                                flexShrink: 0,
                                position: "relative",
                                overflow: "visible",
                                boxSizing: "border-box",
                                width: 190
                              }}
                              onClick={(e) => {
                                if (isReadOnly) e.stopPropagation();
                              }}
                            >
                              <input
                                data-row-id={p.id}
                                ref={inputRef}
                                type="text"
                                readOnly={isReadOnly}
                                value={
                                  p.itemName || searchData[p.id]?.term || ""
                                }
                                onChange={(e) => {
                                  if (!isReadOnly) {
                                    handleSearch(e, p.id);
                                    if (isCreateMode) {
                                      openDropdown(p.id);
                                    }
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (isReadOnly) return;
                                  if (e.key !== "Enter") return;
                                  const raw = e.currentTarget.value;
                                  const normalized = String(raw || "").trim();
                                  const digits = normalized.replace(/\D/g, "").slice(0, 13);
                                  if (digits.length === 13 && !/[a-z]/i.test(normalized)) {
                                    const matched = (allProducts || []).find((prod) => {
                                      const code = String(prod?.itemBarcode || prod?.itemBarCode || prod?.itembarcode || "").replace(/\D/g, "");
                                      return code === digits;
                                    });
                                    if (matched) {
                                      handleProductSelect(matched, p.id);
                                      e.preventDefault();
                                      return;
                                    }
                                  }
                                  const first = (searchData[p.id]?.filtered || [])[0];
                                  if (first) {
                                    handleProductSelect(first, p.id);
                                    e.preventDefault();
                                  }
                                }}
                                // onFocus={() => {
                                //   if (!isReadOnly) {
                                //     openDropdown(p.id);
                                //     const alreadySelectedIds = getSelectedProductIds(p.id);
                                //     setSearchData((prev) => ({
                                //       ...prev,
                                //       [p.id]: {
                                //         ...prev[p.id],
                                //         isOpen: true,
                                //         filtered: allProducts.filter((prod) => !alreadySelectedIds.includes(prod._id)),
                                //       },
                                //     }));
                                //   }
                                // }}
                                onFocus={() => {
                                  //   if (!isReadOnly) {
                                  //     // First close any open dropdown to force clean re-render
                                  //     setSearchData((prev) => {
                                  //       const closed = {};
                                  //       Object.keys(prev).forEach((id) => {
                                  //         closed[id] = { ...prev[id], isOpen: false };
                                  //       });
                                  //       return closed;
                                  //     });

                                  //     // Then open this row's dropdown with freshly filtered data
                                  //     setTimeout(() => {
                                  //       openDropdown(p.id);
                                  //       const alreadySelectedIds = getSelectedProductIds(p.id);
                                  //       setSearchData((prev) => ({
                                  //         ...prev,
                                  //         [p.id]: {
                                  //           ...prev[p.id],
                                  //           isOpen: true,
                                  //           filtered: allProducts.filter((prod) => !alreadySelectedIds.includes(prod._id)),
                                  //         },
                                  //       }));
                                  //     }, 0);
                                  //   }
                                  // }}
                                  if (!isReadOnly && isCreateMode && !p.productId) {
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
                                  }
                                }}
                                onClick={(e) => {
                                  // In edit mode, open dropdown only on click
                                  if (!isReadOnly && !isCreateMode && !p.productId) {
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
                                  }
                                }}
                                placeholder="Search Product"
                                style={{
                                  ...inputStyle,
                                  padding: "8px 12px",
                                  boxSizing: "border-box",
                                  ...(isReadOnly ? { backgroundColor: "#f5f5f5", cursor: "default" } : {})
                                }}
                              />

                              {searchData[p.id]?.isOpen && (
                                <div
                                  // style={{
                                  //   ...dropdownStyle,
                                  //   maxHeight: "400px",
                                  //   width: "400px",
                                  // }}
                                  style={{
                                    position: "absolute",
                                    top: "100%",  // Always below the input
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
                                                alt="Image error"
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

                                            {product.description && (
                                              <div
                                                style={{
                                                  color: "#6b7280",
                                                  fontSize: "12px",
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "start",
                                                }}
                                              >
                                                Description:{" "}
                                                {product.description}
                                              </div>
                                            )}

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
                                                HSN: {product.hsn?.hsnCode}
                                              </div>
                                            </div>

                                            {product.lotNumber && (
                                              <div
                                                style={{
                                                  color: "#6b7280",
                                                  fontSize: "10px",
                                                  marginBottom: "2px",
                                                }}
                                              >
                                                Lot: {product.lotNumber}
                                              </div>
                                            )}

                                            {product.serialNumbers &&
                                              product.serialNumbers.length >
                                              0 && (
                                                <div
                                                  style={{
                                                    color: "#10b981",
                                                    fontSize: "10px",
                                                    marginBottom: "2px",
                                                  }}
                                                >
                                                  Serial Nos:{" "}
                                                  {product.serialNumbers.length}{" "}
                                                  available
                                                </div>
                                              )}

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
                                                {product.sellingPrice ||
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
                          </div>

                          {/* Right part */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              minHeight: 40,
                              flexShrink: 0,
                            }}
                          >
                            <div style={dividerStyle} />
                            {settings.hsn && (
                              <>
                                <div style={bodyBox(COL.md)}>
                                  <input
                                    type="text"
                                    placeholder="HSN Code"
                                    className="table-input"
                                    style={inputStyle}
                                    value={p?.hsnCode || ""}
                                    onChange={(e) =>
                                      updateProduct(
                                        p.id,
                                        "hsn",
                                        { ...p.hsn, hsnCode: e.target.value }
                                      )
                                    }
                                  />
                                </div>
                                <div style={dividerStyle} />
                              </>
                            )}
                            {settings.description && (
                              <>
                                <div style={bodyBox(COL.md)}>
                                  <input
                                    type="text"
                                    placeholder="Description"
                                    className="table-input"
                                    style={inputStyle}
                                    value={p.description || ""}
                                    onChange={(e) =>
                                      updateProduct(
                                        p.id,
                                        "description",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div style={dividerStyle} />
                              </>
                            )}

                            {settings.lotno && (
                              <>
                                <div style={{
                                  width: 100,
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
                                }}>
                                  <input
                                    type="text"
                                    placeholder="Lot No"
                                    className="table-input"
                                    style={inputStyle}
                                    value={p.lotNumber || ""}
                                    onChange={(e) =>
                                      updateProduct(
                                        p.id,
                                        "lotNumber",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div style={dividerStyle} />
                              </>
                            )}

                            <div style={{
                              width: "80px",
                              minHeight: 32,
                              alignSelf: "stretch",
                              paddingLeft: 12,
                              paddingRight: 12,
                              paddingTop: 4,
                              paddingBottom: 4,
                              justifyContent: "space-between",
                              alignItems: "center",
                              display: "flex",
                              outline: "1px solid #EAEAEA",
                              borderRadius: 4,
                              background: "#fff",
                              flexShrink: 0,
                              boxSizing: "border-box",

                            }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0"
                                min="1"
                                step="1"
                                className="table-input"
                                style={inputStyle}
                                value={p.qty === 0 || p.qty === "" ? "" : p.qty}
                                onChange={(e) => {
                                  const rawValue = e.target.value;
                                  if (rawValue === "") {
                                    updateProduct(p.id, "qty", "");
                                    return;
                                  }
                                  const numValue = parseFloat(rawValue);
                                  if (!isNaN(numValue)) {
                                    updateProduct(
                                      p.id,
                                      "qty",
                                      Math.max(1, numValue),
                                    );
                                  }
                                }}
                                onClick={(e) => e.target.select()}
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

                            <div style={dividerStyle} />

                            {settings.serialno && (
                              <>
                                <div
                                  style={{
                                    width: "150px",
                                    minHeight: 32,
                                    alignSelf: "stretch",
                                    paddingLeft: 12,
                                    paddingRight: 12,
                                    paddingTop: 4,
                                    paddingBottom: 4,
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    display: "flex",
                                    outline: "1px solid #EAEAEA",
                                    borderRadius: 4,
                                    background: "#fff",
                                    flexShrink: 0,
                                    boxSizing: "border-box",
                                    position: "relative",
                                    overflow: "visible",
                                  }}
                                  title={p.selectedSerialNos?.length > 0 ? p.selectedSerialNos.join(', ') : "No serial numbers selected"}
                                >
                                  {/* <SerialNumberDropdown
                                    product={p}
                                    onSelect={(selected) =>
                                      updateProduct(
                                        p.id,
                                        "selectedSerialNos",
                                        selected,
                                      )
                                    }
                                    onQtyChange={(newQty) =>
                                      updateProduct(p.id, "qty", newQty)
                                    }
                                    disabled={!p.productId || isReadOnly}
                                  /> */}
                                  <div style={{
                                    width: "100%",
                                    fontSize: "12px",
                                    color: p.selectedSerialNos?.length > 0 ? "#1F7FFF" : "#999",
                                    textAlign: "center",
                                    cursor: "default",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap"
                                  }}>
                                    {p.selectedSerialNos && p.selectedSerialNos.length > 0
                                      ? `${p.selectedSerialNos.length} selected`
                                      : "No serial selected"}
                                  </div>
                                </div>
                                <div style={dividerStyle} />
                              </>
                            )}

                            <div style={bodyBox(COL.md)}>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="0.00"
                                className="table-input"
                                style={inputStyle}
                                value={p.unitPrice}
                                onChange={(e) =>
                                  updateProduct(
                                    p.id,
                                    "unitPrice",
                                    e.target.value,
                                  )
                                }
                              />
                            </div>

                            <div style={dividerStyle} />

                            <div style={bodyBox(COL.md)}>
                              <input
                                type="text"
                                className={`table-input ${!taxSettings.enableGSTBilling ? "table-input-disabled" : ""}`}
                                style={{
                                  ...inputStyle,
                                  color: taxSettings.enableGSTBilling
                                    ? "inherit"
                                    : "#A2A8B8",
                                  cursor: "default",
                                }}
                                value={`${p.taxRate}%`}
                                readOnly
                              />
                            </div>

                            <div style={dividerStyle} />

                            <div style={bodyBox(COL.md)}>
                              <input
                                type="number"
                                className={`table-input ${!taxSettings.enableGSTBilling ? "table-input-disabled" : ""}`}
                                style={{
                                  ...inputStyle,
                                  color: taxSettings.enableGSTBilling
                                    ? "inherit"
                                    : "#A2A8B8",
                                  cursor: "default",
                                }}
                                value={p.taxAmount.toFixed(2)}
                                readOnly
                              />
                            </div>

                            <div style={dividerStyle} />

                            <div
                              style={{
                                width: COL.lg,
                                minHeight: 32,
                                alignSelf: "stretch",
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 4,
                                display: "flex",
                                flexShrink: 0,
                                boxSizing: "border-box",
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
                                  outline: "1px solid #EAEAEA",
                                  outlineOffset: "-1px",
                                  boxSizing: "border-box",
                                }}
                              >
                                <div
                                  style={{
                                    left: 1,
                                    top: 10,
                                    position: "absolute",
                                    color: "#0E101A",
                                    fontSize: 14,
                                    fontFamily: "Inter",
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
                                      background: "transparent",
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
                                    height: "100%",
                                    paddingRight: 4,
                                    left: 73,
                                    top: 1,
                                    position: "absolute",
                                    background: "#E9F0F4",
                                    outline: "1px solid #C2C9D1",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "inline-flex",
                                  }}
                                >
                                  <div
                                    style={{
                                      color: "#6C748C",
                                      fontSize: 14,
                                      fontFamily: "Poppins",
                                      fontWeight: "400",
                                      lineHeight: "16.8px",
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
                                  outline: "1px solid #EAEAEA",
                                  outlineOffset: "-1px",
                                  boxSizing: "border-box",
                                }}
                              >
                                <div
                                  style={{
                                    left: 1,
                                    top: 10,
                                    position: "absolute",
                                    color: "#0E101A",
                                    fontSize: 14,
                                    fontFamily: "Inter",
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
                                      background: "transparent",
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
                                    height: "100%",
                                    paddingRight: 4,
                                    left: 73,
                                    top: 1,
                                    position: "absolute",
                                    background: "#E9F0F4",
                                    outline: "1px solid #C2C9D1",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 4,
                                    display: "inline-flex",
                                  }}
                                >
                                  <div
                                    style={{
                                      color: "#6C748C",
                                      fontSize: 14,
                                      fontFamily: "Poppins",
                                      fontWeight: "400",
                                      lineHeight: "16.8px",
                                    }}
                                  >
                                    ₹
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div style={dividerStyle} />

                            <div style={{
                              width: "90px",
                              minHeight: 32,
                              alignSelf: "stretch",
                              paddingLeft: 12,
                              paddingRight: 12,
                              paddingTop: 4,
                              paddingBottom: 4,
                              justifyContent: "space-between",
                              alignItems: "center",
                              display: "flex",
                              outline: "1px solid #EAEAEA",
                              borderRadius: 4,
                              background: "#fff",
                              flexShrink: 0,
                              boxSizing: "border-box",
                            }}>
                              <input
                                type="number"
                                className="table-input"
                                style={inputStyle}
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
                {/* LEFT SIDE - Same as invoice */}
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
                            placeholder="00"
                            readOnly={isCreateMode || isReadOnly}
                            value={
                              additionalDiscountType === "Percentage"
                                ? additionalDiscountPct || ""
                                : additionalDiscountType === "Fixed"
                                  ? additionalDiscountAmt || ""
                                  : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = parseFloat(value);

                              if (additionalDiscountType === "Percentage") {
                                let pctValue = value === "" ? "" : Math.min(numValue, 100);
                                setAdditionalDiscountPct(
                                  pctValue === "" ? "" : pctValue,
                                );
                                if (
                                  value !== "" &&
                                  !isNaN(pctValue) &&
                                  subtotal > 0
                                ) {
                                  // Calculate and update fixed amount
                                  const fixedValue =
                                    (subtotal * pctValue) / 100;
                                  setAdditionalDiscountAmt(fixedValue);
                                } else {
                                  setAdditionalDiscountAmt("");
                                }
                              } else if (additionalDiscountType === "Fixed") {
                                let amtValue = value === "" ? "" : Math.min(numValue, subtotal);
                                setAdditionalDiscountAmt(
                                  amtValue === "" ? "" : amtValue,
                                );
                                if (
                                  value !== "" &&
                                  !isNaN(amtValue) &&
                                  subtotal > 0
                                ) {
                                  // Calculate and update percentage
                                  const pctValue = (amtValue / subtotal) * 100;
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
                              ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5", cursor: "not-allowed" } : {})
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
                              disabled={isCreateMode || isReadOnly}
                              value={additionalDiscountType}
                              onChange={(e) => {
                                const type = e.target.value;
                                setAdditionalDiscountType(type);
                                // Clear both values when switching type
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
                                cursor: (isCreateMode || isReadOnly) ? "not-allowed" : "pointer",
                                outline: "none",
                              }}
                            >
                              {/* <option value="">₹/%</option> */}
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
                    <div style={{ flex: "1" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "8px",
                        }}
                      >
                        Additional Charges
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          paddingRight: "6px",
                          position: "relative",
                          ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                        }}
                        ref={chargeRef}
                      >
                        <div
                          style={{
                            padding: "10px 12px",
                            fontSize: "14px",
                          }}
                        >
                          ₹
                        </div>

                        <input
                          placeholder="00"
                          readOnly={isCreateMode || isReadOnly}
                          className=""
                          style={{
                            flex: 1,
                            border: "none",
                            padding: "10px 12px",
                            outline: "none",
                            fontSize: "14px",
                            width: "400px",
                            ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5", cursor: "not-allowed" } : {})
                          }}
                          value={chargeAmount}
                          onChange={(e) => setChargeAmount(e.target.value)}
                        />
                        {!(isCreateMode || isReadOnly) && (
                          <>
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
                              }}
                              onClick={handleViewChargeOptions}
                            >
                              <span>
                                {selectedChargeType
                                  ? selectedChargeType.replace("charge", "")
                                  : "Charges"}
                              </span>{" "}
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
                                      }}
                                      className="button-action"
                                      onClick={() => handleChargeSelect(charge)}
                                    >
                                      <span style={{ color: "black" }}>
                                        {charge}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {!(isCreateMode || isReadOnly) && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={handleChargeDone}
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            borderRadius: "20px",
                            background: "#fff",
                            border: "1px solid #d1d5db",
                            color: "#2563eb",
                            marginTop: "25px",
                            cursor: "pointer",
                          }}
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Upload Images */}
                  {/* Upload Attachments */}
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginBottom: "8px",
                      }}
                    >
                      Attachments (Images, PDF, Excel, CSV)
                    </div>
                    {!isReadOnly && (
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
                        onClick={() => document.getElementById("file-upload").click()}
                      >
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/jpg,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                          onChange={handleFileUpload}
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
                    )}

                    {/* Display uploaded files with icons based on type */}
                    {uploadedImages.length > 0 && (
                      <div
                        style={{
                          marginTop: "10px",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        {uploadedImages.map((file, index) => (
                          <div key={index} style={{ position: "relative", width: "80px" }}>
                            {file.type?.startsWith('image/') ? (
                              <img
                                src={file.preview}
                                alt={`upload-${index}`}
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
                                {file.type?.includes('pdf') ? (
                                  <FaFilePdf size={30} color="#E74C3C" />
                                ) : file.type?.includes('sheet') || file.type?.includes('excel') || file.name?.endsWith('.xlsx') ? (
                                  <FaFileExcel size={30} color="#27AE60" />
                                ) : file.type?.includes('csv') ? (
                                  <FaFileCsv size={30} color="#3498DB" />
                                ) : file.type?.includes('word') ? (
                                  <FaFileWord size={30} color="#2980B9" />
                                ) : (
                                  <FaFileAlt size={30} color="#7F8C8D" />
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
                                  {file.filename.length > 15 ? file.filename.slice(0, 12) + "..." : file.filename}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                setUploadedImages((prev) => prev.filter((_, i) => i !== index))
                              }
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

                  <div
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
                  </div>

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
                              .map(
                                ([key, _]) =>
                                  key.charAt(0).toUpperCase() + key.slice(1),
                              )
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

                  {/* Shopping Points */}
                  <div
                    style={{
                      display: "flex",
                      width: "100%",
                      justifyContent: "space-between",
                      opacity: (isCreateMode || isReadOnly) ? 0.6 : 1
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={isCreateMode || true}
                          style={{ accentColor: "#ffffffff", cursor: "not-allowed" }}
                          checked={usePoints}
                          onChange={(e) => {
                            setUsePoints(e.target.checked);
                            if (!e.target.checked) {
                              setShoppingPointsUsed("");
                            }
                          }}
                        />
                        <span>Shopping Points</span>
                      </div>

                      <div style={{ fontSize: "12px", margin: "8px 0" }}>
                        Available - 🪙 {customerPoints} points
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "end",
                          marginBottom: "12px",
                          gap: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexDirection: "column",
                          }}
                        >
                          <span style={{ fontSize: "14px", color: "#6b7280" }}>
                            Point Used
                          </span>
                          <div
                            style={{
                              display: "flex",
                              border: "1px solid #e5e7eb",
                              justifyContent: "space-between",
                              width: "98px",
                              height: "40px",
                              ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                            }}
                          >
                            <input
                              placeholder="0"
                              className=""
                              style={{
                                width: "30px",
                                border: "none",
                                background: "transparent",
                                textAlign: "center",
                                fontSize: "14px",
                                outline: "none",
                                backgroundColor: (isCreateMode || isReadOnly) ? "#f5f5f5" : "white",
                                cursor: (isCreateMode || isReadOnly) ? "not-allowed" : "text",
                              }}
                              value={shoppingPointsUsed}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*$/.test(value)) {
                                  const points = parseInt(value) || 0;
                                  if (points > customerPoints) {
                                    toast.error(
                                      `Cannot use more than ${customerPoints} points`,
                                    );
                                    setShoppingPointsUsed(
                                      customerPoints.toString(),
                                    );
                                  } else {
                                    setShoppingPointsUsed(value);
                                  }
                                }
                              }}
                              disabled={!usePoints || isCreateMode || isReadOnly}
                            />
                            <div
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "1px",
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#e5e7eb",
                                justifyContent: "center",
                                width: "25px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  background: "#e5e7eb",
                                  padding: "0px 1px",
                                }}
                              >
                                🪙
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ marginTop: "25px" }}>=</span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: "6px",
                            flexDirection: "column",
                          }}
                        >
                          <span style={{ fontSize: "14px", color: "#6b7280" }}>
                            Amount
                          </span>

                          <div
                            style={{
                              display: "flex",
                              border: "1px solid #e5e7eb",
                              justifyContent: "space-between",
                              width: "98px",
                              height: "40px",
                              ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                            }}
                          >
                            <input
                              placeholder="0"
                              className=""
                              style={{
                                width: "30px",
                                border: "none",
                                background: "transparent",
                                textAlign: "center",
                                fontSize: "14px",
                                outline: "none",
                                backgroundColor: (isCreateMode || isReadOnly) ? "#f5f5f5" : "white",
                                cursor: "not-allowed",
                              }}
                              value={pointsRedeemedAmount.toFixed(2)}
                              readOnly
                            />
                            <div
                              style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "1px",
                                display: "flex",
                                alignItems: "center",
                                backgroundColor: "#e5e7eb",
                                justifyContent: "center",
                                width: "25px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  background: "#e5e7eb",
                                  padding: "0px 5px",
                                }}
                              >
                                ₹
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                      disabled={isCreateMode || isReadOnly}
                      style={{ accentColor: "#ffffffff" }}
                      checked={autoRoundOff}
                      onChange={(e) => setAutoRoundOff(e.target.checked)}
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

                  {/* Fully Received */}
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
                      disabled={isCreateMode || true}
                      style={{ accentColor: "#ffffffff", cursor: "not-allowed" }}
                      checked={false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFullyReceived(checked);
                        if (checked) {
                          setAmountReceived(grandTotal.toFixed(2));
                        }
                      }}
                    />
                    <span>Fully Received</span>
                  </div>

                  {/* Amount Inputs */}
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      marginTop: "12px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#6b7280",
                          marginBottom: "6px",
                        }}
                      >
                        Amount Received
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
                          ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                        }}
                      >
                        ₹
                        <input
                          placeholder="0.00"
                          disabled={isCreateMode || true}
                          readOnly
                          className=""
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          style={{
                            borderRadius: "10px",
                            border: "none",
                            background: "#f9fafb",
                            outline: "none",
                            width: "100%",
                            cursor: "not-allowed",
                            ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
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
                        Amount to Return
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
                          ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                        }}
                      >
                        ₹
                        <input
                          placeholder="0.00"
                          className=""
                          value={amountToReturn.toFixed(2)}
                          readOnly
                          style={{
                            borderRadius: "10px",
                            border: "none",
                            background: "#f9fafb",
                            outline: "none",
                            width: "100%",
                            cursor: "not-allowed",
                            ...(isCreateMode || isReadOnly ? { backgroundColor: "#f5f5f5" } : {})
                          }}
                        />
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
                {!isReadOnly ? (
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
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        textDecoration: "none",
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
                        {isSubmitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update" : "Save")}
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
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        textDecoration: "none",
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
                        {isSubmitting ? (isEditMode ? "Updating..." : "Saving...") : (isEditMode ? "Update & Print" : "Save & Print")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Customer Modal */}
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
            <div onClick={(e) => e.stopPropagation()} className="">
              <AddCustomers
                onClose={() => {
                  setOpenAddModal(false);
                  fetchCustomersForSearch();
                }}
                onSuccess={handleNewCustomerCreated}
              />
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {viewQuotationOptions && (
          <PreviewQuotation
            isOpen={viewQuotationOptions}
            onClose={() => setViewQuotationOptions(false)}
            quotationData={{
              quotationNo,
              quotationDate,
              expiryDate,
              validForDays,
              // items: products,
              items: products.map((p) => {
                const fullProduct = allProducts.find(
                  (prod) => prod._id === p.productId,
                );
                return {
                  ...p,
                  productId: fullProduct || p.productId,
                  // Get HSN code from the full product
                  hsnCode: fullProduct?.hsn?.hsnCode || p.hsnCode || "",
                  description: p.description || fullProduct?.description || "",
                  lotNumber: p.lotNumber || fullProduct?.lotNumber || "",
                  // Include serial numbers if available
                  selectedSerialNos: p.selectedSerialNos || [],
                  availableSerialNos: fullProduct?.availableSerialNos || [],
                };
              }),
              subtotal,
              totalTax,
              totalDiscount,
              pointsRedeemedAmount,
              additionalCharges: additionalChargesTotal,
              grandTotal,
            }}
            customerData={customer}
            companyData={companyData}
          />
        )}
        {/* variants selection popup */}
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
            setLot={setPopupSelectedLot}
            setSelectedLot={setPopupSelectedLot}
            selectedQty={popupSelectedQty}
            availableQty={popupAvailableQty}
            increaseQty={increasePopupQty}
            decreaseQty={decreasePopupQty}
            // disableQty={popupIsSerialized}
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

export default CustomerCreateQuotation;
