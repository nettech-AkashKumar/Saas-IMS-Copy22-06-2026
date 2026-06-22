import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { format, addDays } from "date-fns";
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiChevronDown, FiMinus, FiPlus, FiX, FiSearch } from "react-icons/fi";
import { IoIosCloseCircleOutline, IoIosCheckmark } from "react-icons/io";
import { RiDeleteBinLine, RiImageAddFill } from "react-icons/ri";
import { CiBarcode } from "react-icons/ci";
import indialogo from "../../../assets/images/india-logo.png";
import total_orders_icon from "../../../assets/images/totalorders-icon.png";
import CompanyLogo from "../../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../../assets/images/taxinvoice.png";
import Qrcode from "../../../assets/images/qrcode.png";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { toWords } from "number-to-words";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import AddCustomers from "../../../pages/Modal/customerModals/AddCustomerModal";
import ProductDefaultImage from "../../../../src/assets/images/product-default.png";
import Signature from "../../../../src/assets/images/signature.jpg";
import PreviewInvoice from "../../../pages/Invoices/PreviewInvoice";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { FaFilePdf, FaFileExcel, FaFileCsv, FaFileWord, FaFileImage, FaFileAlt } from "react-icons/fa";
import {
  validateLRNumber,
  validateRRNumber,
  validateWagonNumber,
  validateTrainNumber,
  generateLRNumber,
  generateRRNumber,
  generateWagonNumber,
  generateTrainNumber,
  isRailwayAPIActive,
  NUMBERING_MODES
} from "../../../utils/transportValidation.js";


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

const SerialNumberDropdown = ({
  product,
  onSelect,
  onQtyChange,
  disabled = false,
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
        width: rect.width,
      });
    }
  };

  const toggleSerialNo = (serialNo) => {
    const currentSelected = product.selectedSerialNos || [];
    const maxAllowed = product.qty || 1;
    let newSelected;

    if (currentSelected.includes(serialNo)) {
      newSelected = currentSelected.filter((sn) => sn !== serialNo);
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

  const availableSerialNos =
    product.availableSerialNos || product.serialNumbers || [];
  const selectedSerialNos = product.selectedSerialNos || [];

  const filteredSerials = availableSerialNos.filter((serial) =>
    serial.toLowerCase().includes(searchTerm.toLowerCase()),
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        ref={triggerRef}
        onClick={handleToggleDropdown}
        style={{
          width: "100%",
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          padding: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "14px",
          color: disabled ? "#999" : "#333",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontWeight: "500" }}>
            {selectedSerialNos.length > 0
              ? `${selectedSerialNos.length} selected`
              : "Select Serial"}
          </span>
          {selectedSerialNos.length > 0 && (
            <span style={{ fontSize: "12px", color: "#666" }}>
              {selectedSerialNos.slice(0, 2).join(", ")}
              {selectedSerialNos.length > 2
                ? `... (+${selectedSerialNos.length - 2} more)`
                : ""}
            </span>
          )}
        </div>
        <FiChevronDown
          style={{
            transition: "transform 0.2s",
            transform: isOpen ? "rotate(180deg)" : "none",
          }}
        />
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
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid #f0f0f0",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span style={{ fontSize: "12px", color: "#666" }}>
                  Quantity:
                </span>
                <input
                  type="number"
                  min="1"
                  value={tempQty}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  style={{
                    width: "60px",
                    padding: "4px 8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "12px",
                    outline: "none",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <span style={{ fontSize: "12px", color: "#666" }}>
                {selectedSerialNos.length}/{maxAllowed} selected
              </span>
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", marginBottom: "8px" }}>
              <FiSearch
                style={{
                  position: "absolute",
                  left: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#999",
                }}
              />
              <input
                type="text"
                placeholder="Search serial numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 12px 6px 30px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "12px",
                  outline: "none",
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectAll();
                }}
                disabled={
                  selectedSerialNos.length >= maxAllowed ||
                  availableSerialNos.length === 0
                }
                style={{
                  padding: "4px 8px",
                  fontSize: "11px",
                  backgroundColor:
                    selectedSerialNos.length >= maxAllowed ||
                      availableSerialNos.length === 0
                      ? "#e0e0e0"
                      : "#e8f4ff",
                  color:
                    selectedSerialNos.length >= maxAllowed ||
                      availableSerialNos.length === 0
                      ? "#999"
                      : "#1F7FFF",
                  border: "1px solid #d0e7ff",
                  borderRadius: "4px",
                  cursor:
                    selectedSerialNos.length >= maxAllowed ||
                      availableSerialNos.length === 0
                      ? "not-allowed"
                      : "pointer",
                  flex: 1,
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
                  padding: "4px 8px",
                  fontSize: "11px",
                  backgroundColor: "#fff0f0",
                  color: "#d8484a",
                  border: "1px solid #ffd0d0",
                  borderRadius: "4px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Serial Numbers List */}
          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            {filteredSerials.length === 0 ? (
              <div
                style={{ padding: "16px", textAlign: "center", color: "#666" }}
              >
                {searchTerm
                  ? "No serial numbers found"
                  : "No serial numbers available"}
              </div>
            ) : (
              filteredSerials.map((serialNo) => (
                <div
                  key={serialNo}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      selectedSerialNos.includes(serialNo) ||
                      selectedSerialNos.length < maxAllowed
                    ) {
                      toggleSerialNo(serialNo);
                    }
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#fff")
                  }
                >
                  <div style={{ position: "relative" }}>
                    <input
                      type="checkbox"
                      checked={selectedSerialNos.includes(serialNo)}
                      onChange={() => { }}
                      style={{
                        cursor: "pointer",
                        width: "16px",
                        height: "16px",
                      }}
                    />
                    {!selectedSerialNos.includes(serialNo) &&
                      selectedSerialNos.length >= maxAllowed && (
                        <div
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: "rgba(255,255,255,0.7)",
                            cursor: "not-allowed",
                          }}
                        />
                      )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontWeight: selectedSerialNos.includes(serialNo)
                          ? "600"
                          : "400",
                        color: selectedSerialNos.includes(serialNo)
                          ? "#1F7FFF"
                          : "#333",
                        fontSize: "14px",
                        lineHeight: "1.4",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {serialNo}
                    </span>
                  </div>
                  {selectedSerialNos.includes(serialNo) && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#1F7FFF",
                        backgroundColor: "#e8f4ff",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      Selected
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "12px",
              borderTop: "1px solid #f0f0f0",
              backgroundColor: "#f8f9fa",
              fontSize: "12px",
              color: "#666",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Product Quantity: {product.qty || 1}</span>
              <span>Available Serial Nos: {availableSerialNos.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this ProductPopup component before SerialNumberDropdown and CreateDeliveryChallan

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
                ₹{selectedProduct?.sellingPrice?.toFixed(2)}
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


function CreateDeliveryChallan() {
  const COL = {
    sl: 80,
    item: 260,
    hsn: 120,
    md: 120,
    lg: 200,
  };

  const dividerStyle = {
    width: 1,
    height: 30,
    background: "#A2A8B8",
    flexShrink: 0,
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
  const isLoadingFromInvoiceRef = useRef(false);
  const { customerId } = useParams();
  const navigate = useNavigate();
  // State for customer selection/selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // for barcode scanner input
  const productSearchInputRef = useRef(null);
  // modal state
  const [openAddModal, setOpenAddModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [productLoading, setProductLoading] = useState(false);
  const [activeSearchId, setActiveSearchId] = useState(null);
  const [searchData, setSearchData] = useState({});
  // customergstin start
  const [customerGstin, setCustomerGstin] = useState("");
  const [customerState, setCustomerState] = useState("");
  const [customerPincode, setCustomerPincode] = useState("");
  const [customerCity, setCustomerCity] = useState("");
  // customergstin end
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
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [additionalDiscountType, setAdditionalDiscountType] =
    useState("Percentage"); // "Fixed" or "Percentage"

  const [companyData, setCompanyData] = useState(null);
  const [banks, setBanks] = useState([]);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);

  // Modals
  const [viewManageOptions, setViewManageOptions] = useState(false);
  const [viewInvoiceOptions, setViewInvoiceOptions] = useState(false);
  const [viewChargeOptions, setViewChargeOptions] = useState(false);
  const [selectedChargeType, setSelectedChargeType] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  // 2. Add state variables (add these to your existing state declarations)
  const [popupMode, setPopupMode] = useState(null);
  const [popupSelectedProduct, setPopupSelectedProduct] = useState(null);
  const [popupSelectedColor, setPopupSelectedColor] = useState("");
  const [popupSelectedSize, setPopupSelectedSize] = useState("");
  const [popupSelectedSerialno, setPopupSelectedSerialno] = useState('');
  const [popupSelectedQty, setPopupSelectedQty] = useState(1);
  const [popupActiveImageIndex, setPopupActiveImageIndex] = useState(0);
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState([]);

  // for proforma invocie
  const location = useLocation();
  const [mode, setMode] = useState("create"); // "create", "edit", "view"
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deliveryChallanId, setDeliveryChallanId] = useState(null);
  const sourceProforma = location.state?.sourceProforma;
  const isFromProforma = location.state?.isFromProforma || false;
  const sourceQuotation = location.state?.sourceQuotation;
  const isFromQuotation = location.state?.isFromQuotation || false;
  const [isConvertingFromProforma, setIsConvertingFromProforma] = useState(false);
  const [isConvertingFromQuotation, setIsConvertingFromQuotation] = useState(false);
  const [proformaIdRef, setProformaIdRef] = useState(null);
  const [quotationIdRef, setQuotationIdRef] = useState(null);
  // for transport, vehicle, driver
  const [transporter, setTransporter] = useState("");
  const [transporterId, setTransporterId] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [transporterOptions, setTransporterOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);
  const [challanType, setChallanType] = useState("other");
  const [searchInvoiceNo, setSearchInvoiceNo] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [challanDate, setChallanDate] = useState(new Date());
  const [purposeOfMovement, setPurposeOfMovement] = useState("");
  const [fromAddress, setFromAddress] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [challanNotes, setChallanNotes] = useState("");
  const [challanNo, setChallanNo] = useState("");

  // Transport related states
  const [transportMode, setTransportMode] = useState("roadways");
  const [subMode, setSubMode] = useState("");
  const [lrNo, setLrNo] = useState("");
  const [railwayReceiptNo, setRailwayReceiptNo] = useState("");
  const [wagonNo, setWagonNo] = useState("");
  const [trainNo, setTrainNo] = useState("");
  const [railwayWagonNo, setRailwayWagonNo] = useState("");
  const [railwayTrainNo, setRailwayTrainNo] = useState("");
  const [rrbNo, setRrbNo] = useState("");
  const [freightCharge, setFreightCharge] = useState("");
  const [otherCharges, setOtherCharges] = useState("");

  // Validation error states
  const [lrError, setLrError] = useState('');
  const [rrError, setRrError] = useState('');
  const [wagonError, setWagonError] = useState('');
  const [trainError, setTrainError] = useState('');
  const [railwayReceiptError, setRailwayReceiptError] = useState('');

  // Validation functions
  const handleLrNoChange = (value) => {
    setLrNo(value);
    const validation = validateLRNumber(value);
    setLrError(validation.error);
  };

  const handleRrbNoChange = (value) => {
    setRrbNo(value);
    setRailwayReceiptNo(value);
    const validation = validateRRNumber(value);
    setRrError(validation.error);
  };

  const handleRailwayReceiptNoChange = (value) => {
    setRailwayReceiptNo(value);
    const validation = validateRRNumber(value);
    setRailwayReceiptError(validation.error);
  };

  const handleWagonNoChange = (value) => {
    setWagonNo(value);
    const validation = validateWagonNumber(value);
    setWagonError(validation.error);
  };

  const handleTrainNoChange = (value) => {
    setTrainNo(value);
    const validation = validateTrainNumber(value);
    setTrainError(validation.error);
  };


  // State for due date
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // Default: 7 days from now
    return date;
  });

  // Refs for due date
  const viewDueDateRef = useRef(null);
  const [viewDueDateOptions, setViewDueDateOptions] = useState(false);
  const [isDueDatePickerOpen, setIsDueDatePickerOpen] = useState(false);

  const handleBack = () => {
    navigate(location.state?.from || -1)
  }

  // for system setting for serial no
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

  useEffect(() => {
    fetchProductSettings();
  }, []);

  // Check if we are in view or edit mode based on location state
  useEffect(() => {
    const state = location.state;

    if (state?.viewDeliveryChallan) {
      // View mode
      setMode("view");
      setIsReadOnly(true);
      setIsEditMode(false);
      setDeliveryChallanId(state.viewDeliveryChallan._id);
      loadDeliveryChallanData(state.viewDeliveryChallan);
    } else if (state?.editDeliveryChallan) {
      // Edit mode
      setMode("edit");
      setIsReadOnly(false);
      setIsEditMode(true);
      setDeliveryChallanId(state.editDeliveryChallan._id);
      loadDeliveryChallanData(state.editDeliveryChallan);
    } else if (state?.sourceDeliveryChallan) {
      // Converting from delivery challan to something else
      setMode("create");
      setIsReadOnly(false);
      setIsEditMode(false);
      loadDeliveryChallanData(state.sourceDeliveryChallan);
    }
  }, [location.state]);

  // Load delivery challan data for view/edit mode
  // Load delivery challan data for view/edit mode
  const loadDeliveryChallanData = (challanData) => {
    // console.log("Loading delivery challan data:", challanData);

    // Set basic info
    setChallanNo(challanData.challanNo);
    setChallanDate(new Date(challanData.challanDate));
    setDueDate(new Date(challanData.challanDate));

    // Set challan type
    setChallanType(challanData.challanType || "against_invoice");
    // ========== TRANSPORT FIELDS - ADD THIS SECTION ==========
    // Set transport mode and sub-mode
    if (challanData.transportMode) {
      setTransportMode(challanData.transportMode);
    }
    if (challanData.subMode) {
      setSubMode(challanData.subMode);
    }

    // LR fields (roadways)
    if (challanData.lrNo) setLrNo(challanData.lrNo);

    // RR fields (roadways sub-mode RR)
    if (challanData.railwayReceiptNo) setRailwayReceiptNo(challanData.railwayReceiptNo);
    if (challanData.wagonNo) setWagonNo(challanData.wagonNo);
    if (challanData.trainNo) setTrainNo(challanData.trainNo);

    // Railways (simple mode)
    if (challanData.railwayWagonNo) setRailwayWagonNo(challanData.railwayWagonNo);
    if (challanData.railwayTrainNo) setRailwayTrainNo(challanData.railwayTrainNo);
    if (challanData.rrbNo) setRrbNo(challanData.rrbNo);

    // Charges
    if (challanData.freightCharge !== undefined) setFreightCharge(challanData.freightCharge.toString());
    if (challanData.otherCharges !== undefined) setOtherCharges(challanData.otherCharges.toString());
    // ========== TRANSPORTER, VEHICLE, DRIVER ==========
    // Set transporter - Handle populated object or just ID
    if (challanData.transporterId) {
      if (typeof challanData.transporterId === 'object') {
        setTransporter(challanData.transporterId._id);
      } else {
        setTransporter(challanData.transporterId);
      }
    }

    // Set vehicle - Handle populated object or just ID
    if (challanData.vehicleId) {
      if (typeof challanData.vehicleId === 'object') {
        setVehicle(challanData.vehicleId._id);
      } else {
        setVehicle(challanData.vehicleId);
      }
    }

    // Set driver - Handle populated object or just ID
    if (challanData.driverId) {
      if (typeof challanData.driverId === 'object') {
        setDriver(challanData.driverId._id);
      } else {
        setDriver(challanData.driverId);
      }
    }

    // Set customer - Handle populated customer object
    if (challanData.customerId) {
      const customerData = challanData.customerId;
      const addressParts = [];
      if (customerData.address) addressParts.push(customerData.address);
      if (customerData.city) addressParts.push(customerData.city);
      if (customerData.state) addressParts.push(customerData.state);
      if (customerData.country) addressParts.push(customerData.country);
      if (customerData.pincode) addressParts.push(customerData.pincode);

      setCustomer({
        name: customerData.name || "",
        phone: customerData.phone || "",
        address: addressParts.join(", ") || customerData.address || "",
        email: customerData.email || "",
        gstin: customerData.gstin || "",
        customerId: customerData._id || customerData,
      });
      setCustomerSearch(customerData.name || "");
      setPhoneSearch(customerData.phone || "");
      setCustomerGstin(customerData.gstin || "");
      setCustomerState(customerData.state || "");
      setCustomerPincode(customerData.pincode || "");
      setCustomerCity(customerData.city || "");
    }

    // Set transport details - Handle populated objects
    if (challanData.transporterId) {
      setTransporter(challanData.transporterId._id || challanData.transporterId);
    }
    if (challanData.vehicleId) {
      setVehicle(challanData.vehicleId._id || challanData.vehicleId);
    }
    if (challanData.driverId) {
      setDriver(challanData.driverId._id || challanData.driverId);
    }

    // Set addresses
    setFromAddress(challanData.fromAddress || "");
    setToAddress(challanData.toAddress || "");
    setPurposeOfMovement(challanData.purposeOfMovement || "");
    setEwayBillNo(challanData.ewayBillNo || "");
    setChallanNotes(challanData.notes || "");

    // Set items/products - Map delivery challan items to invoice format
    if (challanData.items && challanData.items.length > 0) {
      const convertedProducts = challanData.items.map((item, index) => {
        // Get product details if productId is populated
        let productName = item.itemName;
        let unit = item.unit || "Piece";
        let sellingPrice = 0;
        let taxRate = 0;
        let hsnCode = "";

        if (item.productId && typeof item.productId === 'object') {
          productName = item.productId.productName || item.itemName;
          unit = item.productId.unit || item.unit || "Piece";
          sellingPrice = item.productId.sellingPrice || 0;
          taxRate = parseFloat(item.productId.tax?.match(/\d+/)?.[0]) || 0;
          hsnCode = item.productId.hsn?.hsnCode || "";
        }

        return {
          id: Date.now() + index + Math.random(),
          productId: item.productId?._id || item.productId,
          itemName: productName,
          name: productName,
          qty: item.qty || item.dispatchedQty || 1,
          unit: unit,
          unitPrice: sellingPrice,
          taxRate: taxRate,
          taxType: `GST ${taxRate}%`,
          taxAmount: 0,
          discountPct: 0,
          discountAmt: 0,
          amount: 0,
          hsnCode: hsnCode,
          description: item.description || "",
          lotNumber: item.lotNumber || "",
          availableSerialNos: item.serialNumbers || [],
          selectedSerialNos: item.serialNumbers || [],
          selectedColor: "",
          selectedSize: "",
          stock: 0,
        };
      });
      setProducts(convertedProducts);
      hasAddedInitialProduct.current = true;
    }
  };


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
          description: data.description || false,
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
      // console.error("Error fetching system settings:", error);
      // toast.error("Failed to fetch system settings");
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch system settings");
    }
  };

  // eway bill and chalan state
  const [eway, setEway] = useState(false);
  const [chalan, setChalan] = useState(false);

  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
    priceIncludeGST: true,
    defaultGSTRate: "18",
    autoRoundOff: "0",
  });

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
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch tax settings");
      }
    };
    loadTaxSettings();
  }, []);

  // ========== ADD SEARCH INVOICE FUNCTION ==========
  const searchInvoiceByNo = async () => {
    if (!searchInvoiceNo.trim()) {
      toast.error("Please enter invoice number");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/api/invoices/${searchInvoiceNo}`);
      if (response.data.success && response.data.invoice) {
        const invoice = response.data.invoice;
        setSelectedInvoice(invoice);

        // Auto-fill customer
        if (invoice.customerId) {
          setCustomer({
            name: invoice.customerId.name,
            phone: invoice.customerId.phone,
            address: invoice.customerId.address,
            email: invoice.customerId.email,
            gstin: invoice.customerId.gstin,
            customerId: invoice.customerId._id,
          });
          setCustomerSearch(invoice.customerId.name);
          setPhoneSearch(invoice.customerId.phone);
          setCustomerGstin(invoice.customerId.gstin || "");
          setCustomerState(invoice.customerId.state || "");
          setCustomerCity(invoice.customerId.city || "");
          setCustomerPincode(invoice.customerId.pincode || "");
        }

        // ========== ADD THIS: Populate payment info from invoice ==========
        // Set payment status from invoice
        if (invoice.status === 'paid' || invoice.fullyReceived) {
          setFullyReceived(true);
          setAmountReceived(invoice.grandTotal?.toString() || '0');
        } else if (invoice.paidAmount > 0) {
          setAmountReceived(invoice.paidAmount?.toString() || '0');
          setFullyReceived(false);
        } else {
          setAmountReceived("");
          setFullyReceived(false);
        }

        // ========== ADD THIS: Populate products from invoice ==========
        if (invoice.items && invoice.items.length > 0) {
          const invoiceProducts = invoice.items.map((item, index) => ({
            id: Date.now() + index + Math.random(),
            productId: item.productId?._id || item.productId,
            itemName: item.itemName,
            name: item.itemName,
            qty: item.qty,
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
            availableSerialNos: item.selectedSerialNos || [],
            selectedSerialNos: item.selectedSerialNos || [],
            selectedColor: item.selectedColor || "",
            selectedSize: item.selectedSize || "",
            stock: item.stock || 0,
          }));
          setProducts(invoiceProducts);
          hasAddedInitialProduct.current = true;
        }

        toast.success("Invoice found! Products, customer, and payment details loaded.");
      }
    } catch (error) {
      toast.error("Invoice not found");
      setSelectedInvoice(null);
    } finally {
      setLoading(false);
    }
  };
  // ========== END SEARCH INVOICE FUNCTION ==========

  // feth data on component mount
  useEffect(() => {
    const fetchTransportData = async () => {
      try {
        const [transportersRes, vehiclesRes, driversRes] = await Promise.all([
          api.get("/api/transporter/active-transporters"),
          api.get("/api/vehicle/active-vehicles"),
          api.get("/api/driver/active-drivers")
        ]);
        setTransporterOptions(transportersRes.data.transporters || []);
        setVehicleOptions(vehiclesRes.data.vehicles || vehiclesRes.data.vehicle || []);
        setDriverOptions(driversRes.data.drivers || driversRes.data.driver || []);
        // console.log("transporter data itemsad", transportersRes.data.transporters)
        // console.log("vehicle data", vehiclesRes.data.vehicle)
        // console.log("driver data", driversRes.data.driver)
      } catch (error) {
        console.error("Error fetching transport data:", error);
      }
    }
    fetchTransportData();
  }, []);

  // style for eway and chalan

  const checkboxStyle = (checked) => ({
    width: "20px",
    height: "20px",
    border: "1px solid #007aff",
    borderRadius: "4px",
    cursor: "pointer",
    appearance: "none",
    backgroundColor: checked ? "" : "#eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });
  const tickStyle = {
    color: "#007aff",
    fontSize: "14px",
    fontWeight: "bold",
    lineHeight: 1,
  };

  // for preview data start
  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      // console.log("Companyss data:", res.data);
      setCompanyData(res.data.data);
    } catch (error) {
      // console.error("Error fetching company profile:", error);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch company profile");
    }
  };

  const fetchBanks = async () => {
    try {
      const res = await api.get("/api/company-bank/list");
      setBanks(res.data.data);
      // console.log("banks", res.data.data);
    } catch (error) {
      // console.error("Error fetching bank details:", error);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch bank details");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
      // console.log("reddd", res.data);
    } catch (error) {
      // console.error("Error fetching notes & terms settings:", error);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch notes & terms settings");
    }
  }

  const fetchSignature = async () => {
    try {
      const res = await api.get("/api/print-templates/all");
      setTemplate(res.data.data);
      // console.log("ddrrr", res.data);
    } catch (error) {
      // console.error("Error fetching tempate settings:", error);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to fetch template settings");
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchSettings();
    fetchSignature();
    fetchBanks();
  }, []);

  // this is from proform invoice
  // Add this useEffect to load proforma data when converting
  useEffect(() => {
    const loadProformaForConversion = async () => {
      if (sourceProforma && isFromProforma) {
        setIsConvertingFromProforma(true);
        setProformaIdRef(sourceProforma._id);

        // Pre-fill customer data
        if (sourceProforma.customerId) {
          const customerData = sourceProforma.customerId;
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
        }

        // Convert proforma items to invoice items format
        if (sourceProforma.items && sourceProforma.items.length > 0) {
          const convertedProducts = sourceProforma.items.map((item, index) => ({
            id: Date.now() + index + Math.random(),
            productId: item.productId,
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
          setProducts(convertedProducts);
          hasAddedInitialProduct.current = true;
        }

        // Pre-fill other proforma data
        if (sourceProforma.billingAddress) {
          setCustomer(prev => ({ ...prev, address: sourceProforma.billingAddress }));
        }

        // Set due date (7 days from now for invoice)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        setDueDate(dueDate);

        // Set invoice date to today
        setInvoiceDate(new Date());

        // Pre-fill additional discount and charges
        if (sourceProforma.additionalDiscount) {
          if (sourceProforma.additionalDiscount.pct > 0) {
            setAdditionalDiscountType("Percentage");
            setAdditionalDiscountPct(sourceProforma.additionalDiscount.pct);
          } else if (sourceProforma.additionalDiscount.amt > 0) {
            setAdditionalDiscountType("Fixed");
            setAdditionalDiscountAmt(sourceProforma.additionalDiscount.amt);
          }
        }

        if (sourceProforma.additionalChargesDetails) {
          setAdditionalChargesDetails({
            shipping: sourceProforma.additionalChargesDetails.shipping || 0,
            handling: sourceProforma.additionalChargesDetails.handling || 0,
            packing: sourceProforma.additionalChargesDetails.packing || 0,
            service: sourceProforma.additionalChargesDetails.service || 0,
            other: sourceProforma.additionalChargesDetails.other || 0,
          });
        }

        // Pre-fill tax settings
        if (sourceProforma.taxSettings) {
          setTaxSettings(sourceProforma.taxSettings);
        }

        // ========== ADD THIS SECTION FOR ADVANCE PAYMENT ==========
        // Pre-fill advance payment information from proforma
        const proformaAdvancePaid = sourceProforma.advancePaid || 0;
        const proformaGrandTotal = sourceProforma.grandTotal || 0;
        const proformaDueAmount = sourceProforma.dueAmount || 0;

        // Set Amount Received (advance paid from proforma)
        if (proformaAdvancePaid > 0) {
          setAmountReceived(proformaAdvancePaid.toString());

          // If advance paid equals or exceeds grand total, mark as fully received
          if (proformaAdvancePaid >= proformaGrandTotal) {
            setFullyReceived(true);
          } else {
            setFullyReceived(false);
          }
        } else {
          setAmountReceived("");
          setFullyReceived(false);
        }

        // Show toast with advance payment info
        if (proformaAdvancePaid > 0) {
          toast.info(`Advance payment of ₹${proformaAdvancePaid.toFixed(2)} from Proforma Invoice will be applied to this invoice. Due amount: ₹${proformaDueAmount.toFixed(2)}`, {
            position: "top-right",
            autoClose: 5000,
          });
        }

        toast.info("Proforma loaded. Review and confirm to create Invoice.");
      }
    };

    loadProformaForConversion();
  }, [sourceProforma, isFromProforma]);

  useEffect(() => {
    const loadQuotationForConversion = async () => {
      if (sourceQuotation && isFromQuotation) {
        setIsConvertingFromQuotation(true);
        setQuotationIdRef(sourceQuotation._id);

        // Pre-fill customer data
        if (sourceQuotation.customerId) {
          const customerData = sourceQuotation.customerId;
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
        }

        // Convert quotation items to invoice items format
        if (sourceQuotation.items && sourceQuotation.items.length > 0) {
          const convertedProducts = sourceQuotation.items.map((item, index) => ({
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
          setProducts(convertedProducts);
          hasAddedInitialProduct.current = true;
        }

        // Pre-fill other quotation data
        if (sourceQuotation.billingAddress) {
          setCustomer(prev => ({ ...prev, address: sourceQuotation.billingAddress }));
        }

        // Set due date (7 days from now for invoice)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        setDueDate(dueDate);

        // Set invoice date to today
        setInvoiceDate(new Date());

        // Pre-fill additional discount and charges
        if (sourceQuotation.additionalDiscount) {
          if (sourceQuotation.additionalDiscount.pct > 0) {
            setAdditionalDiscountType("Percentage");
            setAdditionalDiscountPct(sourceQuotation.additionalDiscount.pct);
          } else if (sourceQuotation.additionalDiscount.amt > 0) {
            setAdditionalDiscountType("Fixed");
            setAdditionalDiscountAmt(sourceQuotation.additionalDiscount.amt);
          }
        }

        if (sourceQuotation.additionalChargesDetails) {
          setAdditionalChargesDetails({
            shipping: sourceQuotation.additionalChargesDetails.shipping || 0,
            handling: sourceQuotation.additionalChargesDetails.handling || 0,
            packing: sourceQuotation.additionalChargesDetails.packing || 0,
            service: sourceQuotation.additionalChargesDetails.service || 0,
            other: sourceQuotation.additionalChargesDetails.other || 0,
          });
        }

        // Pre-fill tax settings
        if (sourceQuotation.taxSettings) {
          setTaxSettings(sourceQuotation.taxSettings);
        }

        toast.info("Quotation loaded. Review and confirm to create Invoice.");
      }
    };

    loadQuotationForConversion();
  }, [sourceQuotation, isFromQuotation]);

  // Add these computed values (copy from POS)
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

  // filter vehicles based on selected transporter
  // Replace your existing filteredVehicleOptions and filteredDriverOptions with these:

  // Filter vehicles based on selected transporter - MATCHING INVOICE/SHIPMENT LOGIC
  const filteredVehicleOptions = useMemo(() => {
    if (!transporter) return [];

    // Find the selected transporter object from transporterOptions
    const selectedTransporter = transporterOptions.find(t => t._id === transporter);

    if (!selectedTransporter) return [];

    // Get vehicle IDs assigned to this transporter (handle both object and string formats)
    let assignedVehicleIds = [];
    if (selectedTransporter.assignVehicleID && Array.isArray(selectedTransporter.assignVehicleID)) {
      assignedVehicleIds = selectedTransporter.assignVehicleID.map(v => {
        // If it's an object with _id, return _id; if it's a string, return as is
        return v._id || v;
      });
    }

    if (assignedVehicleIds.length === 0) return [];

    // Filter vehicles that are assigned to this transporter
    return vehicleOptions.filter(vehicle =>
      assignedVehicleIds.includes(vehicle._id)
    );
  }, [transporter, transporterOptions, vehicleOptions]);

  // Filter drivers based on selected transporter - MATCHING INVOICE/SHIPMENT LOGIC
  const filteredDriverOptions = useMemo(() => {
    if (!transporter) return [];

    // Find the selected transporter object from transporterOptions
    const selectedTransporter = transporterOptions.find(t => t._id === transporter);

    if (!selectedTransporter || !selectedTransporter.assignDriverID) return [];

    // Get driver IDs assigned to this transporter
    const assignedDriverIds = selectedTransporter.assignDriverID.map(d => d._id || d);

    // Filter drivers that are assigned to this transporter
    return driverOptions.filter(driver =>
      assignedDriverIds.includes(driver._id)
    );
  }, [transporter, transporterOptions, driverOptions]);

  // Reset vehicle and driver when transporter changes

  useEffect(() => {
    if (isLoadingFromInvoiceRef.current) return; // skip reset during challan load
    setVehicle("");
    setDriver("");
  }, [transporter]);

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
      selectedSerialno: serialToUse,
      hsnCode: popupSelectedVariant.hsnCode || popupSelectedProduct.hsn?.hsnCode || "",
    });

    closeProductPopups();
    focusNextProductRowInput();
  };

  // for preview data end

  // Stock check function
  const checkStockAvailability = async (productId, requiredQty) => {
    if (!productId) return true;

    try {
      const response = await api.get(`/api/products/${productId}`);
      const product = response.data;

      // Use openingQuantity as stock
      const availableStock = product.openingQuantity || 0;

      if (availableStock < requiredQty) {
        toast.error(
          `Insufficient stock for ${product.productName}! Available: ${availableStock}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking stock:", error);
      return true; // Continue if check fails
    }
  };

  const closeAllDropdowns = () => {
    // Close date dropdowns
    setViewManageOptions(false);
    setIsDatePickerOpen(false);
    setViewDueDateOptions(false);
    setIsDueDatePickerOpen(false);

    // Close charges dropdown
    setViewChargeOptions(false);

    // Close customer dropdown
    setShowCustomerDropdown(false);

    // Close all product search dropdowns
    setSearchData((prev) => {
      const closed = {};
      Object.keys(prev).forEach((id) => {
        closed[id] = { ...prev[id], isOpen: false };
      });
      return closed;
    });
  };

  const handleViewManage = () => { closeAllDropdowns(); setViewManageOptions(prev => !prev); };
  const handleViewInvoice = (open) => setViewInvoiceOptions(open);
  const handleViewChargeOptions = () => setViewChargeOptions((prev) => !prev);

  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const chargeRef = useRef(null);

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

  // Handle due date selection
  const handleDueDateSelect = (option) => {
    const today = new Date();
    let selectedDate = new Date();

    switch (option) {
      case "7 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 7));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "15 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 15));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "30 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 30));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "45 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 45));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "60 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 60));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "90 Days":
        selectedDate = new Date(today.setDate(today.getDate() + 90));
        setDueDate(selectedDate);
        setViewDueDateOptions(false);
        break;
      case "Custom":
        setIsDueDatePickerOpen(true);
        break;
    }
  };

  // check if we're in "create from navbar" mode (no customerId)
  const isFromNavbar = !customerId;

  // Form state
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    gstin: "",
    customerId: "", //store actual custoemr id
  });

  const [customerPoints, setCustomerPoints] = useState(0);
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [invoiceNo, setInvoiceNo] = useState("");

  // useEffect(() => {
  //   const generateInvoiceNumber = () => {
  //     const prefix = "INV";
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

  // Fetch customers for search (when in navbar mode)
  useEffect(() => {
    if (isFromNavbar) {
      fetchCustomersForSearch();
    }
  }, [isFromNavbar]);

  const fetchCustomersForSearch = async () => {
    const params = {}
    try {
      const response = await api.get("/api/customers/active-customers", { params });
      setAllCustomers(response.data?.customers || []);
      setFilteredCustomers(response.data?.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
      // toast.error("Failed to load customers");
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load customers");
    }
  };

  // Handle customer search
  useEffect(() => {
    if (!customerSearch.trim() && !phoneSearch.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }
    const filtered = allCustomers.filter((cust) => {
      // Search by name (only if customerSearch has value)
      const nameMatch = customerSearch.trim()
        ? cust.name?.toLowerCase().includes(customerSearch.toLowerCase())
        : false;

      // Search by phone (only if phoneSearch has value)
      const phoneMatch = phoneSearch.trim()
        ? cust.phone?.includes(phoneSearch)
        : false;

      // Search by email (only if customerSearch has value)
      const emailMatch = customerSearch.trim()
        ? cust.email?.toLowerCase().includes(customerSearch.toLowerCase())
        : false;

      return nameMatch || phoneMatch || emailMatch;
    });

    setFilteredCustomers(filtered);
  }, [customerSearch, phoneSearch, allCustomers]);

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
  const [usePoints, setUsePoints] = useState(false);
  const [shoppingPointsUsed, setShoppingPointsUsed] = useState("");
  const [autoRoundOff, setAutoRoundOff] = useState(false);
  const [fullyReceived, setFullyReceived] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Fetch customer & products
  // Fetch customer & products
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch customer details
        if (customerId) {
          const customerRes = await api.get(`/api/customers/${customerId}`);
          const c = customerRes.data;
          const addressParts = [];
          if (c.city) addressParts.push(c.city);
          if (c.state) addressParts.push(c.state);
          if (c.country) addressParts.push(c.country);
          if (c.pincode) addressParts.push(c.pincode);
          const formattedAddress = addressParts.join(", ");

          setCustomer({
            name: c.name || "",
            phone: c.phone || "",
            address: formattedAddress,
            email: c.email || "",
            gstin: c.gstin || "",
            customerId: c._id,
          });

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

        // Enhance products with serial number information
        const enhancedProducts = await Promise.all(
          fetchedProducts.map(async (product) => {
            // Define serialNumbers inside the map function
            let serialNumbers = [];

            // Check if serialNumbers array exists directly
            if (product.serialNumbers && Array.isArray(product.serialNumbers)) {
              serialNumbers = product.serialNumbers;
            }
            // Check if serialno exists and handle different types
            else if (product.serialno) {
              if (typeof product.serialno === "string") {
                // If it's a string, split by commas
                serialNumbers = product.serialno
                  .split(",")
                  .map((sn) => sn.trim())
                  .filter((sn) => sn !== "");
              } else if (Array.isArray(product.serialno)) {
                // If it's already an array, use it directly
                serialNumbers = product.serialno;
              } else if (typeof product.serialno === "object") {
                // If it's an object, try to convert to array
                serialNumbers = Object.values(product.serialno).filter(
                  (sn) => sn,
                );
              }
            }

            // If no serial numbers found and we have a product ID, try to fetch details
            if (serialNumbers.length === 0 && product._id) {
              try {
                const response = await api.get(`/api/products/${product._id}`);
                const prodDetail = response.data;

                if (
                  prodDetail.serialNumbers &&
                  Array.isArray(prodDetail.serialNumbers)
                ) {
                  serialNumbers = prodDetail.serialNumbers;
                } else if (prodDetail.serialno) {
                  if (typeof prodDetail.serialno === "string") {
                    serialNumbers = prodDetail.serialno
                      .split(",")
                      .map((sn) => sn.trim())
                      .filter((sn) => sn);
                  } else if (Array.isArray(prodDetail.serialno)) {
                    serialNumbers = prodDetail.serialno;
                  } else if (typeof prodDetail.serialno === "object") {
                    serialNumbers = Object.values(prodDetail.serialno).filter(
                      (sn) => sn,
                    );
                  }
                }
              } catch (error) {
                // console.error(
                //   `Error fetching serial numbers for product ${product._id}:`,
                //   error,
                // );
                toast.error(error?.response?.data?.displayMessage ||
                  error?.response?.data?.message ||
                  error?.message ||
                  `Failed to fetch serial numbers for product ${product.productName}`);
              }
            }

            return {
              ...product,
              availableSerialNos: serialNumbers,
              lotNumber: product.lotNumber || "",
              description: product.description || "",
            };
          }),
        );

        setAllProducts(enhancedProducts);
        setFilteredProducts(enhancedProducts);

        setProductOptions(
          enhancedProducts.map((p) => ({
            value: p._id,
            label: p.productName,
            price: p.sellingPrice || 0,
            taxRate: parseFloat(p.tax?.match(/\d+/)?.[0]) || 0,
            unit: p.unit || "Piece",
            hsnCode: p?.hsnCode || "",
            taxType: p.tax || "GST 0%",
            discountAmount: p.discountAmount || 0,
            discountType: p.discountType || "Percentage",
            imageUrl: p.images?.[0]?.url || p.images?.[0]?.secure_url || "",
            description: p.description || "",
            lotNumber: p.lotNumber || "",
            availableSerialNos: p.availableSerialNos || [],
            stock: p.stockQuantity || 0,
            serialNumbers: p.availableSerialNos || [],
          })),
        );

        if (!hasAddedInitialProduct.current && products.length === 0) {
          addProductRow({ focus: false });
          hasAddedInitialProduct.current = true;
        }
      } catch (error) {
        console.error("Data fetch error:", error);
        // toast.error("Failed to load data");
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load data");
      } finally {
        setLoading(false);
        setProductLoading(false);
      }
    };
    loadData();
  }, [customerId]);


  // Add this useEffect to load sales order data for conversion
  useEffect(() => {
    const loadSalesOrderForConversion = async () => {
      const sourceSalesOrder = location.state?.sourceSalesOrder;
      const isFromSalesOrder = location.state?.isFromSalesOrder || false;

      // console.log("=== Loading Sales Order for Delivery Challan ===");
      // console.log("sourceSalesOrder:", sourceSalesOrder);
      // console.log("isFromSalesOrder:", isFromSalesOrder);

      if (sourceSalesOrder && isFromSalesOrder) {
        // console.log("Processing sales order conversion...");

        try {
          // ========== FIX: Fetch the complete sales order data with populated customer ==========
          // Just like convertToInvoice does!
          const response = await api.get(`/api/sales-orders/${sourceSalesOrder._id}`);
          if (response.data.success) {
            const completeSalesOrder = response.data.salesOrder;
            // console.log("Complete sales order with populated customer:", completeSalesOrder);

            // ========== 1. SET CUSTOMER DATA (Now it will be populated) ==========
            if (completeSalesOrder.customerId) {
              const customerData = completeSalesOrder.customerId;
              // console.log("Customer data (now populated):", customerData);

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

              // Set GST and location fields
              setCustomerGstin(customerData.gstin || "");
              setCustomerState(customerData.state || "");
              setCustomerPincode(customerData.pincode || "");
              setCustomerCity(customerData.city || "");
            }

            // ========== 2. SET ADDRESSES ==========
            setToAddress(completeSalesOrder.shippingAddress || completeSalesOrder.billingAddress || "");
            setFromAddress(completeSalesOrder.billingAddress || "");

            // ========== 3. SET TRANSPORT DETAILS ==========
            if (completeSalesOrder.transporterId) {
              const transporterId = completeSalesOrder.transporterId._id || completeSalesOrder.transporterId;
              setTransporter(transporterId);
            }
            if (completeSalesOrder.vehicleId) {
              const vehicleId = completeSalesOrder.vehicleId._id || completeSalesOrder.vehicleId;
              setVehicle(vehicleId);
            }
            if (completeSalesOrder.driverId) {
              const driverId = completeSalesOrder.driverId._id || completeSalesOrder.driverId;
              setDriver(driverId);
            }

            // Transport mode and LR/RR details
            if (completeSalesOrder.transportMode) setTransportMode(completeSalesOrder.transportMode);
            if (completeSalesOrder.subMode) setSubMode(completeSalesOrder.subMode);
            if (completeSalesOrder.lrNo) setLrNo(completeSalesOrder.lrNo);
            if (completeSalesOrder.railwayReceiptNo) setRailwayReceiptNo(completeSalesOrder.railwayReceiptNo);
            if (completeSalesOrder.wagonNo) setWagonNo(completeSalesOrder.wagonNo);
            if (completeSalesOrder.trainNo) setTrainNo(completeSalesOrder.trainNo);
            if (completeSalesOrder.railwayWagonNo) setRailwayWagonNo(completeSalesOrder.railwayWagonNo);
            if (completeSalesOrder.railwayTrainNo) setRailwayTrainNo(completeSalesOrder.railwayTrainNo);
            if (completeSalesOrder.rrbNo) setRrbNo(completeSalesOrder.rrbNo);
            if (completeSalesOrder.freightCharge) setFreightCharge(completeSalesOrder.freightCharge);
            if (completeSalesOrder.otherCharges) setOtherCharges(completeSalesOrder.otherCharges);

            // ========== 4. CONVERT ITEMS TO DELIVERY CHALLAN FORMAT ==========
            if (completeSalesOrder.items && completeSalesOrder.items.length > 0) {
              // console.log("Converting items from sales order:", completeSalesOrder.items);

              const convertedProducts = completeSalesOrder.items.map((item, index) => {
                // Get product name from the item
                let productName = item.itemName;
                let unit = item.unit || "Piece";
                let unitPrice = item.unitPrice || 0;
                let taxRate = item.taxRate || 0;
                let hsnCode = item.hsnCode || "";
                let description = item.description || "";
                let lotNumber = item.lotNumber || "";
                let selectedSerialNos = item.selectedSerialNos || [];

                // If productId is populated (object), use its properties
                if (item.productId && typeof item.productId === 'object') {
                  productName = item.productId.productName || item.itemName;
                  unit = item.productId.unit || item.unit || "Piece";
                  unitPrice = item.productId.sellingPrice || item.unitPrice || 0;
                  taxRate = parseFloat(item.productId.tax?.match(/\d+/)?.[0]) || item.taxRate || 0;
                  hsnCode = item.productId.hsn?.hsnCode || item.hsnCode || "";
                  description = item.productId.description || item.description || "";
                  lotNumber = item.productId.lotNumber || item.lotNumber || "";
                }

                return {
                  id: Date.now() + index + Math.random(),
                  productId: item.productId?._id || item.productId,
                  itemName: productName,
                  name: productName,
                  qty: item.qty || 1,
                  unit: unit,
                  unitPrice: unitPrice,
                  taxRate: taxRate,
                  taxType: `GST ${taxRate}%`,
                  taxAmount: item.taxAmount || 0,
                  discountPct: item.discountPct || 0,
                  discountAmt: item.discountAmt || 0,
                  amount: item.amount || 0,
                  hsnCode: hsnCode,
                  description: description,
                  lotNumber: lotNumber,
                  availableSerialNos: selectedSerialNos,
                  selectedSerialNos: selectedSerialNos,
                  selectedColor: item.selectedColor || "",
                  selectedSize: item.selectedSize || "",
                  stock: 0,
                };
              });

              setProducts(convertedProducts);
              hasAddedInitialProduct.current = true;
              // console.log("Converted products set:", convertedProducts);
            }

            toast.info("Sales Order loaded. Review and confirm to create Delivery Challan.");
          }
        } catch (error) {
          console.error("Error fetching sales order details:", error);
          toast.error("Failed to load sales order details");
        }
      }
    };

    loadSalesOrderForConversion();
  }, [location.state]);

  // Add this useEffect to load invoice data for conversion
  useEffect(() => {
    const loadInvoiceForConversion = async () => {
      const sourceInvoice = location.state?.sourceInvoice;
      const isFromInvoice = location.state?.isFromInvoice || false;

      // console.log("=== Loading Invoice for Delivery Challan ===");
      // console.log("sourceInvoice:", sourceInvoice);
      // console.log("isFromInvoice:", isFromInvoice);

      if (sourceInvoice && isFromInvoice) {
        // console.log("Processing invoice conversion...");

        try {
          // Fetch the complete invoice data with populated customer
          const response = await api.get(`/api/invoices/${sourceInvoice._id}`);
          if (response.data.success) {
            const completeInvoice = response.data.invoice;
            // console.log("Complete invoice with populated customer:", completeInvoice);

            // ========== 1. SET CUSTOMER DATA ==========
            if (completeInvoice.customerId) {
              const customerData = completeInvoice.customerId;

              const addressParts = [];
              if (customerData.address) addressParts.push(customerData.address);
              if (customerData.city) addressParts.push(customerData.city);
              if (customerData.state) addressParts.push(customerData.state);
              if (customerData.country) addressParts.push(customerData.country);
              if (customerData.pincode) addressParts.push(customerData.pincode);

              setSearchInvoiceNo(completeInvoice.invoiceNo || "");

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

              // Set GST and location fields
              setCustomerGstin(customerData.gstin || "");
              setCustomerState(customerData.state || "");
              setCustomerPincode(customerData.pincode || "");
              setCustomerCity(customerData.city || "");
            }

            // ========== 2. SET ADDRESSES ==========
            setToAddress(completeInvoice.shippingAddress || completeInvoice.billingAddress || "");
            setFromAddress(completeInvoice.billingAddress || "");

            // ========== 3. SET TRANSPORT DETAILS - WITHOUT localStorage ==========
            // Set transporter
            if (completeInvoice.transporterId) {
              const transporterId = completeInvoice.transporterId._id || completeInvoice.transporterId;
              // console.log("Setting transporter ID:", transporterId);
              setTransporter(transporterId);
            }

            // Set vehicle
            if (completeInvoice.vehicleId) {
              const vehicleId = completeInvoice.vehicleId._id || completeInvoice.vehicleId;
              // console.log("Setting vehicle ID:", vehicleId);
              setVehicle(vehicleId);
            }

            // Set driver
            if (completeInvoice.driverId) {
              const driverId = completeInvoice.driverId._id || completeInvoice.driverId;
              // console.log("Setting driver ID:", driverId);
              setDriver(driverId);
            }

            // ========== SET TRANSPORT MODE AND OTHER DETAILS ==========
            if (completeInvoice.transportMode) {
              setTransportMode(completeInvoice.transportMode);
            }
            if (completeInvoice.subMode) {
              setSubMode(completeInvoice.subMode);
            }
            if (completeInvoice.lrNo) {
              setLrNo(completeInvoice.lrNo);
            }
            if (completeInvoice.railwayReceiptNo) {
              setRailwayReceiptNo(completeInvoice.railwayReceiptNo);
            }
            if (completeInvoice.wagonNo) {
              setWagonNo(completeInvoice.wagonNo);
            }
            if (completeInvoice.trainNo) {
              setTrainNo(completeInvoice.trainNo);
            }
            if (completeInvoice.railwayWagonNo) {
              setRailwayWagonNo(completeInvoice.railwayWagonNo);
            }
            if (completeInvoice.railwayTrainNo) {
              setRailwayTrainNo(completeInvoice.railwayTrainNo);
            }
            if (completeInvoice.rrbNo) {
              setRrbNo(completeInvoice.rrbNo);
            }
            if (completeInvoice.freightCharge) {
              setFreightCharge(completeInvoice.freightCharge);
            }
            if (completeInvoice.otherCharges) {
              setOtherCharges(completeInvoice.otherCharges);
            }

            // ========== 4. CONVERT ITEMS ==========
            if (completeInvoice.items && completeInvoice.items.length > 0) {
              // console.log("Converting items from invoice:", completeInvoice.items);

              const convertedProducts = completeInvoice.items.map((item, index) => {
                let productName = item.itemName;
                let unit = item.unit || "Piece";
                let unitPrice = item.unitPrice || 0;
                let taxRate = item.taxRate || 0;
                let hsnCode = item.hsnCode || "";
                let description = item.description || "";
                let lotNumber = item.lotNumber || "";
                let selectedSerialNos = item.selectedSerialNos || [];

                if (item.productId && typeof item.productId === 'object') {
                  productName = item.productId.productName || item.itemName;
                  unit = item.productId.unit || item.unit || "Piece";
                  unitPrice = item.productId.sellingPrice || item.unitPrice || 0;
                  taxRate = parseFloat(item.productId.tax?.match(/\d+/)?.[0]) || item.taxRate || 0;
                  hsnCode = item.productId.hsn?.hsnCode || item.hsnCode || "";
                  description = item.productId.description || item.description || "";
                  lotNumber = item.productId.lotNumber || item.lotNumber || "";
                }
                // CRITICAL FIX: Preserve discount values from the invoice item
                const itemQty = item.qty || 1;
                const itemUnitPrice = unitPrice;
                const itemDiscountPct = item.discountPct || 0;
                const itemDiscountAmt = item.discountAmt || 0;
                const itemTaxRate = taxRate;

                // Recalculate using the item's own values (to ensure consistency)
                const baseAmount = itemQty * itemUnitPrice;
                let finalDiscountAmt = itemDiscountAmt;
                let finalDiscountPct = itemDiscountPct;

                // If discount percentage exists but amount is 0, calculate amount
                if (finalDiscountPct > 0 && finalDiscountAmt === 0) {
                  finalDiscountAmt = (baseAmount * finalDiscountPct) / 100;
                }
                // If discount amount exists but percentage is 0, calculate percentage
                else if (finalDiscountAmt > 0 && finalDiscountPct === 0 && baseAmount > 0) {
                  finalDiscountPct = (finalDiscountAmt / baseAmount) * 100;
                }

                const taxableAmount = baseAmount - finalDiscountAmt;
                const taxAmount = (taxableAmount * itemTaxRate) / 100;
                const amount = taxableAmount + taxAmount;
                return {
                  id: Date.now() + index + Math.random(),
                  productId: item.productId?._id || item.productId,
                  itemName: item.itemName || productName,
                  name: item.itemName || productName,
                  qty: itemQty,
                  unit: unit,
                  unitPrice: itemUnitPrice,
                  taxRate: itemTaxRate,
                  taxType: item.taxType || `GST ${itemTaxRate || 0}%`,
                  taxAmount: parseFloat(taxAmount.toFixed(2)),
                  discountPct: parseFloat(finalDiscountPct.toFixed(2)),
                  discountAmt: parseFloat(finalDiscountAmt.toFixed(2)),
                  amount: parseFloat(amount.toFixed(2)),
                  hsnCode: hsnCode,
                  description: description,
                  lotNumber: lotNumber,
                  availableSerialNos: selectedSerialNos,
                  selectedSerialNos: selectedSerialNos,
                  selectedColor: item.selectedColor || "",
                  selectedSize: item.selectedSize || "",
                  stock: 0,
                };
              });

              setProducts(convertedProducts);
              hasAddedInitialProduct.current = true;

              // Then in loadInvoiceForConversion, before setting transport:
              isLoadingFromInvoiceRef.current = true;

              if (completeInvoice.transporterId) {
                setTransporter(completeInvoice.transporterId?._id || completeInvoice.transporterId);
              }
              if (completeInvoice.vehicleId) {
                setVehicle(completeInvoice.vehicleId?._id || completeInvoice.vehicleId);
              }
              if (completeInvoice.driverId) {
                setDriver(completeInvoice.driverId?._id || completeInvoice.driverId);
              }

              setTimeout(() => {
                isLoadingFromInvoiceRef.current = false;
              }, 100);

              // Attachments from invoice:
              if (completeInvoice.attachments?.length > 0) {
                const existingAttachments = completeInvoice.attachments.map(att => ({
                  url: att.url,
                  public_id: att.public_id,
                  filename: att.filename,
                  type: att.fileType || "",
                  fileExt: att.filename?.split('.').pop()?.toLowerCase(),
                  preview: att.fileType?.startsWith('image/') ? att.url : null,
                  isNew: false,
                }));
                setUploadedAttachments(existingAttachments);
              }
            }

            toast.info("Invoice loaded. Review and confirm to create Delivery Challan.");
          }
        } catch (error) {
          console.error("Error fetching invoice details:", error);
          toast.error("Failed to load invoice details");
        }
      }
    };

    loadInvoiceForConversion();
  }, [location.state]);


  // Add this useEffect to validate transport selections after options load
  useEffect(() => {
    if (transporterOptions.length > 0 && transporter) {
      // Verify the selected transporter exists in options
      const exists = transporterOptions.some(t => t._id === transporter);
      if (!exists) {
        // console.log("Selected transporter not found in options:", transporter);
        setTransporter("");
      }
    }
  }, [transporterOptions]);

  useEffect(() => {
    if (vehicleOptions.length > 0 && vehicle) {
      const exists = vehicleOptions.some(v => v._id === vehicle);
      if (!exists) {
        // console.log("Selected vehicle not found in options:", vehicle);
        setVehicle("");
      }
    }
  }, [vehicleOptions]);

  useEffect(() => {
    if (driverOptions.length > 0 && driver) {
      const exists = driverOptions.some(d => d._id === driver);
      if (!exists) {
        // console.log("Selected driver not found in options:", driver);
        setDriver("");
      }
    }
  }, [driverOptions]);

  useEffect(() => {
    // Only run when transporter is set and we have options loaded
    if (transporter && transporterOptions.length > 0) {
      // console.log("Transporter set to:", transporter);
      // console.log("Available transporter options:", transporterOptions.map(t => ({ id: t._id, name: t.transporterName, vehicles: t.assignVehicleID?.length, drivers: t.assignDriverID?.length })));

      // Find the selected transporter
      const selectedTransporter = transporterOptions.find(t => t._id === transporter);

      if (selectedTransporter) {
        // console.log("Found selected transporter:", selectedTransporter.transporterName);

        // Check if we have pending vehicle/driver from invoice conversion
        // We need to get these from a ref or from state that was set during conversion

        // If vehicle is already set (from invoice conversion), verify it belongs to this transporter
        if (vehicle) {
          const vehicleExists = selectedTransporter.assignVehicleID?.some(v => {
            const vehicleId = v._id || v;
            return vehicleId === vehicle;
          });

          if (!vehicleExists) {
            // console.log("Vehicle not found in transporter's assigned vehicles, clearing");
            setVehicle("");
          } else {
            // console.log("Vehicle verified and belongs to transporter");
          }
        }

        // If driver is already set (from invoice conversion), verify it belongs to this transporter
        if (driver) {
          const driverExists = selectedTransporter.assignDriverID?.some(d => {
            const driverId = d._id || d;
            return driverId === driver;
          });

          if (!driverExists) {
            // console.log("Driver not found in transporter's assigned drivers, clearing");
            setDriver("");
          } else {
            // console.log("Driver verified and belongs to transporter");
          }
        }
      } else {
        // console.log("Transporter not found in options!");
      }
    }
  }, [transporter, transporterOptions]);

  // handle customer selection from dropdown
  // const handleCustomerSelect = (selectedCustomer) => {
  //   setCustomer({
  //     name: selectedCustomer.name || "",
  //     phone: selectedCustomer.phone || "",
  //     address: [
  //       selectedCustomer.country,
  //       selectedCustomer.city,
  //       selectedCustomer.state,
  //       selectedCustomer.pincode,
  //     ]
  //       .filter(Boolean)
  //       .join(", "),
  //     email: selectedCustomer.email || "",
  //     gstin: selectedCustomer.gstin || "",
  //     customerId: selectedCustomer._id, // Store the ID
  //   });

  //   // Update search fields with actual values
  //   setCustomerSearch(selectedCustomer.name || "");
  //   setPhoneSearch(selectedCustomer.phone || "");
  //   //  Fetch customer points
  //   api
  //     .get(`/api/customers/${selectedCustomer._id}/points`)
  //     .then((res) => {
  //       setCustomerPoints(res.data.customer?.availablePoints || 0);
  //     })
  //     .catch(() => setCustomerPoints(0));
  //   setShowCustomerDropdown(false);
  // };
  const handleCustomerSelect = (selectedCustomer) => {
    // Format address as: City, State, Country, Pincode
    const addressParts = [];
    if (selectedCustomer.address) addressParts.push(selectedCustomer.address);
    if (selectedCustomer.city) addressParts.push(selectedCustomer.city);
    if (selectedCustomer.state) addressParts.push(selectedCustomer.state);
    if (selectedCustomer.country) addressParts.push(selectedCustomer.country);
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

    // Set the new fields
    setCustomerGstin(selectedCustomer.gstin || "");
    setCustomerState(selectedCustomer.state || "");
    setCustomerPincode(selectedCustomer.pincode || "");
    setCustomerCity(selectedCustomer.city || "");

    // Update search fields with actual values
    setCustomerSearch(selectedCustomer.name || "");
    setPhoneSearch(selectedCustomer.phone || "");
    //  Fetch customer points
    api
      .get(`/api/customers/${selectedCustomer._id}/points`)
      .then((res) => {
        setCustomerPoints(res.data.customer?.availablePoints || 0);
      })
      .catch(() => setCustomerPoints(0));
    setShowCustomerDropdown(false);
  };

  // handle new customer creation success
  const handleNewCustomerCreated = (newCustomer) => {
    fetchCustomersForSearch();
    // Auto select the newly created customer
    handleCustomerSelect(newCustomer);
    toast.success("Customer created successfully!");
  };

  // Add this useEffect near your other useEffect hooks
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside any customer search container
      const customerContainers = document.querySelectorAll(
        ".customer-search-container",
      );
      let isInside = false;

      customerContainers.forEach((container) => {
        if (container.contains(event.target)) {
          isInside = true;
        }
      });

      if (!isInside && showCustomerDropdown) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCustomerDropdown]);

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
    setShowCustomerDropdown(false);
  };

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

  //   const getSelectedProductIds = (excludeRowId) => {
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
    const term = e.target.value;
    const normalized = String(term || "").trim();
    const alreadySelectedIds = getSelectedProductIds(rowId);
    const digits = normalized.replace(/\\D/g, "").slice(0, 13);
    if (digits.length === 13 && !/[a-z]/i.test(normalized)) {
      const matched = (allProducts || []).find((p) => {
        const code = String(p?.itemBarcode || p?.itemBarCode || p?.itembarcode || "").replace(/\\D/g, "");
        return code === digits;
      });
      if (matched) {
        handleProductSelect(matched, rowId);
        return;
      }
    }

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
    }

    ));
  };

  // Add this useEffect for handling click outside
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

  const openDropdown = (rowId) => {
    const inputElement = document.querySelector(`[data-row-id="${rowId}"]`);
    if (!inputElement) return;

    const rect = inputElement.getBoundingClientRect();

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

  // const handleProductSelect = (product, rowId) => {
  //   // console.log("Selected product:", {
  //   //   name: product.productName,
  //   //   lotNumber: product.lotNumber,
  //   //   description: product.description,
  //   //   availableSerialNos: product.availableSerialNos,
  //   // });
  //   let serialNumbers = [];
  //   if (
  //     product.availableSerialNos &&
  //     Array.isArray(product.availableSerialNos)
  //   ) {
  //     serialNumbers = product.availableSerialNos;
  //   } else if (product.serialNumbers && Array.isArray(product.serialNumbers)) {
  //     serialNumbers = product.serialNumbers;
  //   } else if (product.serialno) {
  //     if (typeof product.serialno === "string") {
  //       serialNumbers = product.serialno
  //         .split(",")
  //         .map((sn) => sn.trim())
  //         .filter((sn) => sn);
  //     } else if (Array.isArray(product.serialno)) {
  //       serialNumbers = product.serialno;
  //     }
  //   }
  //   // Check if product quantity is 0
  //   const availableStock = product.stockQuantity || 0;
  //   if (availableStock <= 0) {
  //     toast.error("Product quantity is 0");
  //     return;
  //   }

  //   // Check if this product is already in the products array
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

  //     // Remove the current empty row since we merged with existing
  //     removeProductRow(rowId);

  //     // Update search data for the current row (which will be removed)
  //     setSearchData((prev) => {
  //       const newData = { ...prev };
  //       delete newData[rowId];
  //       return newData;
  //     });

  //     // Close dropdown
  //     setActiveSearchId(null);
  //     setTimeout(() => focusNextProductRowInput(), 0);
  //     setTimeout(() => focusNextProductRowInput(), 650);
  //     return;
  //   }

  //   // If product doesn't exist already, proceed with normal selection
  //   const defaultTaxRate = taxSettings.defaultGSTRate || "0";
  //   const productTaxRate = parseFloat(product.tax?.match(/\d+/)?.[0]);
  //   const finalTaxRate = productTaxRate || parseFloat(defaultTaxRate);

  //   // Update product data with productId and available stock
  //   updateProduct(rowId, "productId", product._id);
  //   updateProduct(rowId, "stock", availableStock); // Store stock in row state for later use in updateProduct

  //   // Update with product details
  //   updateProduct(rowId, "itemName", product.productName);
  //   updateProduct(rowId, "name", product.productName);
  //   updateProduct(rowId, "unitPrice", product.sellingPrice || 0);
  //   updateProduct(
  //     rowId,
  //     "taxRate",
  //     parseFloat(product.tax?.match(/\d+/)?.[0]) || 0,
  //   );
  //   updateProduct(rowId, "taxType", product.tax || "GST 0%");
  //   updateProduct(rowId, "unit", product.unit || "Piece");
  //   updateProduct(rowId, "hsnCode", product.hsn?.hsnCode || "");
  //   updateProduct(rowId, "serialno", product.serialno || "");

  //   // Use product tax rate if exists, otherwise use default
  //   updateProduct(rowId, "taxRate", finalTaxRate);
  //   updateProduct(rowId, "taxType", product.tax || `GST${finalTaxRate}%`);
  //   updateProduct(rowId, "description", product.description || "");
  //   updateProduct(rowId, "lotNumber", product.lotNumber || "");
  //   updateProduct(rowId, "availableSerialNos", serialNumbers);
  //   updateProduct(rowId, "selectedSerialNos", []);

  //   // Set quantity to 1 for newly added product
  //   updateProduct(rowId, "qty", 1);

  //   // Update search data
  //   setSearchData((prev) => ({
  //     ...prev,
  //     [rowId]: {
  //       term: product.productName,
  //       filtered: [],
  //       isOpen: false,
  //     },
  //   }));

  //   // Close dropdown
  //   setActiveSearchId(null);
  //   setTimeout(() => focusNextProductRowInput(), 0);
  //   setTimeout(() => focusNextProductRowInput(), 650);
  // };

  const handleProductSelect = (product, rowId) => {
    const variantsCount = Array.isArray(product?.variants) ? product.variants.length : 0;

    // Check if product has multiple variants (more than 1)
    const hasMultipleVariants = variantsCount > 1;

    if (hasMultipleVariants) {
      const availableStock = product.stockQuantity || 0;
      if (availableStock <= 0) {
        toast.error(`${product.productName} is out of stock!`);
        return;
      }
      // Show variant selection popup for products with multiple variants (colors/sizes)
      setPopupSelectedProduct(product);
      setPopupSelectedQty(1);
      setPopupActiveImageIndex(0);
      const firstVariant = product?.variants?.[0] || null;
      setPopupSelectedColor(firstVariant?.color || "");
      setPopupSelectedSize(firstVariant?.size || "");
      const firstSerials = Array.isArray(firstVariant?.serialNumbers) ? firstVariant.serialNumbers.filter(Boolean) : [];
      setPopupSelectedSerialno(firstSerials.length === 1 ? firstSerials[0] : "");
      setPopupMode("variant");
      setShowVariantPopup(true);
      return;
    }
    const firstVariant = product?.variants?.[0] || null;

    // For single product (no variants or 1 variant) - use the original logic
    // This handles serial numbers through the SerialNumberDropdown in the table
    let serialNumbers = [];
    let lotNumber = "";
    let productDescription = product.description || "";
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
      if (
        product.availableSerialNos &&
        Array.isArray(product.availableSerialNos)
      ) {
        serialNumbers = product.availableSerialNos;
      } else if (product.serialNumbers && Array.isArray(product.serialNumbers)) {
        serialNumbers = product.serialNumbers;
      } else if (product.serialno) {
        if (typeof product.serialno === "string") {
          serialNumbers = product.serialno
            .split(",")
            .map((sn) => sn.trim())
            .filter((sn) => sn);
        } else if (Array.isArray(product.serialno)) {
          serialNumbers = product.serialno;
        }
      }
    }

    // Check if product quantity is 0
    const availableStock = product.stockQuantity || 0;
    if (availableStock <= 0) {
      toast.error("Product quantity is 0");
      return;
    }

    // Check if this product is already in the products array
    const existingProductIndex = products.findIndex(
      (p) => p.productId === product._id && p.id !== rowId,
    );

    if (existingProductIndex !== -1) {
      // If product already exists in another row, increase quantity of that row
      const existingRow = products[existingProductIndex];
      const currentQty = parseFloat(existingRow.qty) || 0;

      // Ensure we don't exceed available stock
      if (currentQty >= availableStock) {
        toast.error(`Cannot exceed available stock of ${availableStock}`);
        return;
      }

      const newQty = currentQty + 1;

      setProducts((prev) =>
        prev.map((p, idx) => {
          if (idx === existingProductIndex) {
            return {
              ...p,
              qty: newQty,
            };
          }
          return p;
        }),
      );

      // Update calculations for the existing row
      updateProduct(products[existingProductIndex].id, "qty", newQty);

      // Remove the current empty row since we merged with existing
      removeProductRow(rowId);

      // Update search data for the current row (which will be removed)
      setSearchData((prev) => {
        const newData = { ...prev };
        delete newData[rowId];
        return newData;
      });

      // Close dropdown
      setActiveSearchId(null);
      setTimeout(() => focusNextProductRowInput(), 0);
      setTimeout(() => focusNextProductRowInput(), 650);
      return;
    }

    // If product doesn't exist already, proceed with normal selection
    const defaultTaxRate = taxSettings.defaultGSTRate || "0";
    const productTaxRate = parseFloat(product.tax?.match(/\d+/)?.[0]);
    const finalTaxRate = productTaxRate || parseFloat(defaultTaxRate);

    // Update product data with productId and available stock
    updateProduct(rowId, "productId", product._id);
    updateProduct(rowId, "stock", availableStock);

    // Update with product details
    updateProduct(rowId, "itemName", product.productName);
    updateProduct(rowId, "name", product.productName);
    updateProduct(rowId, "unitPrice", product.sellingPrice || 0);
    updateProduct(rowId, "description", productDescription);
    updateProduct(
      rowId,
      "taxRate",
      parseFloat(product.tax?.match(/\d+/)?.[0]) || 0,
    );
    updateProduct(rowId, "taxType", product.tax || "GST 0%");
    updateProduct(rowId, "unit", product.unit || "Piece");
    updateProduct(rowId, "hsnCode", product.hsn?.hsnCode || "");
    updateProduct(rowId, "serialno", product.serialno || "");

    // Use product tax rate if exists, otherwise use default
    updateProduct(rowId, "taxRate", finalTaxRate);
    updateProduct(rowId, "taxType", product.tax || `GST${finalTaxRate}%`);
    updateProduct(rowId, "description", product.description || "");
    updateProduct(rowId, "lotNumber", product.lotNumber || "");
    updateProduct(rowId, "availableSerialNos", serialNumbers);
    updateProduct(rowId, "selectedSerialNos", []);

    // Set quantity to 1 for newly added product
    updateProduct(rowId, "qty", 1);

    // Update search data
    setSearchData((prev) => ({
      ...prev,
      [rowId]: {
        // term: product.productName,
        term: "",
        filtered: [],
        isOpen: false,
      },
    }));

    // Close dropdown
    setActiveSearchId(null);
    setTimeout(() => focusNextProductRowInput(), 0);
    setTimeout(() => focusNextProductRowInput(), 650);
  };

  const addVariantToRow = (productInfo) => {
    const { productId, description, variant, quantity, selectedColor, selectedSize, selectedSerialno, hsnCode } = productInfo;

    // Create a unique identifier for this variant (excluding quantity)
    const variantKey = `${productId}-${selectedColor}-${selectedSize}-${selectedSerialno || ''}`;

    // Check if this variant already exists in the products array (not empty rows)
    const existingProductIndex = products.findIndex(p => {
      // Skip empty rows
      if (!p.productId || p.productId === "") return false;

      // Create key for existing product
      const existingKey = `${p.productId}-${p.selectedColor || ''}-${p.selectedSize || ''}-${p.selectedSerialnos?.join(',') || ''}`;
      return existingKey === variantKey;
    });

    if (existingProductIndex !== -1) {
      // Product with same variant exists, increase quantity
      const existingRow = products[existingProductIndex];
      const currentQty = parseFloat(existingRow.qty) || 0;
      const availableStock = variant.stockQuantity || 0;

      // Check stock availability
      if (currentQty + quantity > availableStock) {
        toast.error(`Cannot exceed available stock of ${availableStock}`);
        return;
      }

      const newQty = currentQty + quantity;

      // Update the existing row quantity
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

      // Update calculations for the existing row
      updateProduct(products[existingProductIndex].id, "qty", newQty);

      // Close popup
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

    // Get product name from productInfo (passed from popup)
    const productName = productInfo.productName || popupSelectedProduct?.productName || "Product";

    // Update the row with variant info
    updateProduct(targetRowId, "productId", productId);
    updateProduct(targetRowId, "itemName", `${productName}${selectedColor ? ` (${selectedColor})` : ""}${selectedSize ? ` / ${selectedSize}` : ""}`);
    updateProduct(targetRowId, "name", `${productName}${selectedColor ? ` (${selectedColor})` : ""}${selectedSize ? ` / ${selectedSize}` : ""}`);
    const finalDescription = description || variant?.description || popupSelectedProduct?.description || "";
    updateProduct(targetRowId, "description", finalDescription);
    // updateProduct(targetRowId, "description", description);
    updateProduct(targetRowId, "hsnCode", hsnCode || variant.hsnCode || popupSelectedProduct?.hsn?.hsnCode || "");
    updateProduct(targetRowId, "unitPrice", variant.sellingPrice);
    updateProduct(targetRowId, "taxRate", parseFloat(variant.tax) || 0);
    updateProduct(targetRowId, "taxType", variant.taxType || `GST ${variant.tax || 0}%`);
    updateProduct(targetRowId, "unit", variant.unit);
    updateProduct(targetRowId, "qty", quantity);
    updateProduct(targetRowId, "stock", variant.stockQuantity);
    updateProduct(targetRowId, "lotNumber", variant.lotNumber || "");
    updateProduct(targetRowId, "selectedSerialNos", selectedSerialno ? [selectedSerialno] : []);
    updateProduct(targetRowId, "selectedColor", selectedColor);
    updateProduct(targetRowId, "selectedSize", selectedSize);

    // Update discount if any
    if (variant.discountAmount) {
      if (variant.discountType === "Percentage") {
        updateProduct(targetRowId, "discountPct", variant.discountAmount);
      } else {
        updateProduct(targetRowId, "discountAmt", variant.discountAmount);
      }
    }

    // Close popup
    setActiveSearchId(null);
    setShowVariantPopup(false);
    setPopupSelectedProduct(null);
    setTimeout(() => focusNextProductRowInput(), 100);
  };

  const addProductRow = ({ focus = false } = {}) => {
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
        description: "", // <-- Add this
        lotNumber: "", // <-- Add this
        availableSerialNos: [], // This should match what the dropdown expects
        selectedSerialNos: [], // <-- Add this
        selectedColor: "",  // Add this
        selectedSize: "",   // Add this
        stock: 0, // Initialize stock field
      },
    ]);
    // Initialize search data for this new row
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
      // Also remove search data for this row
      setSearchData((prev) => {
        const newData = { ...prev };
        delete newData[id];
        return newData;
      });
    }
  };

  // Add this function to validate products before saving
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

  const updateProduct = (id, field, value) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        let updated = { ...p };

        // Handle quantity specially to enforce minimum of 1 and maximum of stock
        if (field === "qty") {
          // Allow empty string to clear the field
          if (value === "") {
            updated.qty = "";
            return updated;
          }

          const numValue = parseFloat(value);

          // If it's not a valid number, set to empty
          if (isNaN(numValue)) {
            updated.qty = "";
            return updated;
          }

          const availableStock = parseFloat(updated.stock) || 0;

          // Allow 0 and positive numbers while typing
          if (numValue >= 0) {
            // Check stock only when value is > 0 and has a valid product
            if (numValue > availableStock && availableStock > 0 && updated.productId) {
              toast.error(`Cannot exceed available stock of ${availableStock}`);
              updated.qty = availableStock;
            } else {
              updated.qty = numValue;
            }
          }
          const maxAllowed = updated.qty;
          if (updated.selectedSerialNos?.length > maxAllowed) {
            updated.selectedSerialNos = updated.selectedSerialNos.slice(
              0,
              maxAllowed,
            );
          }
        } else if (field === "selectedSerialNos") {
          const maxAllowed = updated.qty || 1;
          updated.selectedSerialNos = value.slice(0, maxAllowed);
          if (value.length > 0 && value.length !== updated.qty) {
            updated.qty = value.length;
          }
        } else {
          updated[field] = value;
        }

        // If product selected from dropdown
        if (field === "productId") {
          updated.productId = value;
          const selected = productOptions.find((opt) => opt.value === value);
          if (selected) {
            // Calculate discount based on discountType
            let discountPct = 0;
            let discountAmt = 0;

            if (selected.discountType === "Percentage") {
              discountPct = parseFloat(
                (selected.discountAmount || 0).toFixed(2),
              );
            } else if (selected.discountType === "Fixed") {
              // For fixed amount, calculate percentage based on unit price
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
              serialno: selected.serialno || "",
              qty: 1,
              stock: selected.stock || 0, // Add stock here
              discountPct: discountPct, // Apply product discount
              discountAmt: discountAmt, // Apply product discount amount
            };
          }
        }

        // Handle manual discount updates - CRITICAL FIX
        if (field === "discountPct") {
          const pctValue = parseFloat(value) || 0;
          updated.discountPct = pctValue;
          // Don't update discountAmt here - it will be calculated in the recalculation section
        } else if (field === "discountAmt") {
          const amtValue = parseFloat(value) || 0;
          updated.discountAmt = amtValue;
          // Don't update discountPct here - it will be calculated in the recalculation section
        }

        // Recalculate line
        const qty = parseFloat(updated.qty) || 1;
        let unitPrice = parseFloat(updated.unitPrice) || 0;

        // calculate base amount (before any taxes or discounts)
        const baseAmount = qty * unitPrice;

        // calculate discount based on what was entered
        let discAmt = 0;
        let discPct = 0;

        // If discount amount was directly entered
        if (
          field === "discountAmt" &&
          value !== "" &&
          !isNaN(parseFloat(value))
        ) {
          discAmt = parseFloat(parseFloat(value).toFixed(2)) || 0;
          discAmt = Math.min(discAmt, baseAmount); // Cap discount at base amount
          discPct =
            baseAmount > 0
              ? parseFloat(((discAmt / baseAmount) * 100).toFixed(2))
              : 0;
          updated.discountPct = discPct;
          updated.discountAmt = discAmt;
        }
        // If discount percentage was entered
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
        // Calculate tax ONLY if GST billing is enabled
        const taxRate = parseFloat(updated.taxRate) || 0;
        const taxAmount = taxSettings.enableGSTBilling
          ? parseFloat(((taxableAmount * taxRate) / 100).toFixed(2))
          : 0;
        updated.taxAmount = taxAmount;

        // Calculate final amount
        let finalAmount = taxableAmount;

        // Add tax to final amount ONLY if GST is enabled
        if (taxSettings.enableGSTBilling) {
          finalAmount += taxAmount;
        }
        updated.amount = parseFloat(finalAmount.toFixed(2));
        return updated;
      }),
    );
  };

  // Calculate additional charges total
  const additionalChargesTotal = Object.values(additionalChargesDetails).reduce(
    (sum, charge) => sum + parseFloat(charge || 0),
    0,
  );

  // Calculate totals
  const subtotal = products.reduce((sum, p) => {
    const qty = parseFloat(p.qty) || 0;
    const unitPrice = parseFloat(p.unitPrice) || 0;
    return sum + qty * unitPrice;
  }, 0);

  // calculate total tax only if gst is enabled

  const totalTax = taxSettings.enableGSTBilling
    ? products.reduce((sum, p) => sum + (p.taxAmount || 0), 0)
    : 0;
  const itemsDiscount = products.reduce(
    (sum, p) => sum + (p.discountAmt || 0),
    0,
  );

  // Update this calculation in your existing code:
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
  const totalDiscount = itemsDiscount + additionalDiscountValue;

  const POINT_VALUE = 10;
  const pointsRedeemedAmount =
    (usePoints ? parseFloat(shoppingPointsUsed) || 0 : 0) * POINT_VALUE;

  const grandTotalBefore =
    subtotal -
    totalDiscount -
    pointsRedeemedAmount +
    (taxSettings.enableGSTBilling ? totalTax : 0) +
    additionalChargesTotal;

  // Apply auto round off if enabled
  let roundedTotal = grandTotalBefore;
  let roundOffAdded = 0;

  // Apply auto round off from tax settings
  if (taxSettings.autoRoundOff !== "0" && taxSettings.enableGSTBilling) {
    const roundValue = parseInt(taxSettings.autoRoundOff);
    if (roundValue > 0) {
      // Round to nearest specified value
      roundedTotal = Math.round(grandTotalBefore / roundValue) * roundValue;
      roundOffAdded = roundedTotal - grandTotalBefore;
    }
  }
  const grandTotal = Math.max(0, roundedTotal);

  // const roundedTotal = autoRoundOff
  //   ? Math.round(grandTotalBefore)
  //   : grandTotalBefore;
  // const roundOffAdded = roundedTotal - grandTotalBefore;
  // const grandTotal = Math.max(0, roundedTotal);

  useEffect(() => {
    if (fullyReceived) {
      setAmountReceived(grandTotal.toFixed(2));
    }
  }, [fullyReceived, grandTotal]);

  const amountToReturn = Math.max(
    0,
    (parseFloat(amountReceived) || 0) - grandTotal,
  );

  // // New Uto Round off calculation
  // let roundedTotal = grandTotalBefore;
  // if(taxSettings.autoRoundOff !== "0" && taxSettings.enableGSTBilling) {
  //   const roundValue = parseInt(taxSettings.autoRoundOff);
  //   if(roundValue > 0) {
  //     roundedTotal = Math.round(grandTotalBefore / roundValue) * roundValue;
  //   }
  // }
  // const roundOffAdded = roundedTotal - grandTotalBefore;
  // const grandTotal = Math.max(0, roundedTotal);

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    const validFiles = files.filter((file) => allowedTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      toast.error("Only JPG, JPEG, PNG files are allowed!");
    }

    const newImages = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      filename: file.name,
    }));

    setUploadedImages((prev) => [...prev, ...newImages]);
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
  // Replace or modify your handleDateSelect function
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

    // When from navbar, check if customer is selected
    if (isFromNavbar) {
      if (!customer.customerId) {
        newErrors.customerName = "Please select a customer";
      }
    } else {
      // When from customer page, check name directly
      if (!customer.name.trim()) {
        newErrors.customerName = "Customer name is required";
      }
    }
    if (!customer.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(customer.phone)) {
      newErrors.phone = "Phone number must be 10 digits";
    }

    // if (!customer.address.trim()) {
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

  const handleCreateDeliveryChallan = async (shouldPrint = false) => {
    const sourceSalesOrder = location.state?.sourceSalesOrder;
    const isFromSalesOrder = location.state?.isFromSalesOrder || false;
    const sourceInvoice = location.state?.sourceInvoice;
    const isFromInvoice = location.state?.isFromInvoice || false;

    if (!isFromSalesOrder && !isFromInvoice) {
      if (!customer.customerId) {
        toast.error("Please select a customer");
        return;
      }

      if (!transportMode) {
        toast.error("Please select transport mode");
        return;
      }

      if (transportMode === "roadways") {
        if (subMode === "LR") {
          if (!transporter) {
            toast.error("Please select a transporter");
            return;
          }
          if (!vehicle) {
            toast.error("Please select a vehicle");
            return;
          }
          if (!driver) {
            toast.error("Please select a driver");
            return;
          }
          if (!lrNo || lrNo.trim() === "") {
            toast.error("Please enter LR Number");
            return;
          }
        } else if (subMode === "RR") {
          if (!trainNo || trainNo.trim() === "") {
            toast.error("Please enter Train Number");
            return;
          }
          if (!railwayReceiptNo || railwayReceiptNo.trim() === "") {
            toast.error("Please enter Railway Receipt Number");
            return;
          }
        }
      } else if (transportMode === "railways") {
        if (!railwayTrainNo || railwayTrainNo.trim() === "") {
          toast.error("Please enter Train Number");
          return;
        }
        const trainValidation = validateTrainNumber(railwayTrainNo);
        if (trainValidation.error) {
          toast.error(trainValidation.error);
          return;
        }
        if (!rrbNo || rrbNo.trim() === "") {
          toast.error("Please enter RR Number");
          return;
        }
        const rrValidation = validateRRNumber(rrbNo);
        if (rrValidation.error) {
          toast.error(rrValidation.error);
          return;
        }
      } else {
        toast.error("Please select a valid transport mode");
        return;
      }

      if (getNonEmptyProducts().length === 0) {
        toast.error("Please add at least one product");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      let response;
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
      const formData = new FormData();
      // ========== PRIORITY 1: CONVERT FROM SALES ORDER ==========
      if (isFromSalesOrder && sourceSalesOrder) {
        // console.log("Creating Delivery Challan from Sales Order:", sourceSalesOrder);

        const itemsToDispatch = getNonEmptyProducts().map(item => ({
          productId: item.productId,
          itemName: item.itemName,
          dispatchedQty: item.qty,
          selectedSerialNos: item.selectedSerialNos || [],
          lotNumber: item.lotNumber || "",
          hsnCode: item.hsnCode || "",
          description: item.description || "",
          unit: item.unit,
        }));

        formData.append("sourceSalesOrderId", sourceSalesOrder._id);
        formData.append("sourceType", "SalesOrder");
        formData.append("transporterId", transporter || "");
        formData.append("vehicleId", vehicle || "");
        formData.append("driverId", driver || "");
        formData.append("itemsToDispatch", JSON.stringify(itemsToDispatch));
        formData.append("challanDate", challanDate.toISOString());
        formData.append("notes", challanNotes);
        formData.append("transportMode", transportMode);
        formData.append("subMode", subMode);
        formData.append("lrNo", lrNo || "");
        formData.append("railwayReceiptNo", railwayReceiptNo || "");
        formData.append("wagonNo", wagonNo || "");
        formData.append("trainNo", trainNo || "");
        formData.append("railwayWagonNo", railwayWagonNo || "");
        formData.append("railwayTrainNo", railwayTrainNo || "");
        formData.append("rrbNo", rrbNo || "");
        formData.append("freightCharge", parseFloat(freightCharge) || 0);
        formData.append("otherCharges", parseFloat(otherCharges) || 0);

        if (existingAttachments.length > 0) {
          formData.append("existingAttachments", JSON.stringify(existingAttachments));
        }
        newFiles.forEach((attachment) => {
          if (attachment.file instanceof File) {
            formData.append("attachments", attachment.file, attachment.filename);
          }
        });

        response = await api.post("/api/delivery-challans/create-from-salesOrder", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      // ========== PRIORITY 2: CONVERT FROM INVOICE ==========
      else if (isFromInvoice && sourceInvoice) {
        // console.log("Creating Delivery Challan from Invoice:", sourceInvoice);

        const itemsToDispatch = getNonEmptyProducts().map(item => ({
          productId: item.productId,
          itemName: item.itemName,
          dispatchedQty: item.qty,
          selectedSerialNos: item.selectedSerialNos || [],
          lotNumber: item.lotNumber || "",
          hsnCode: item.hsnCode || "",
          description: item.description || "",
          unit: item.unit,
        }));

        formData.append("sourceInvoiceId", sourceInvoice._id);
        formData.append("sourceType", "Invoice");
        formData.append("transporterId", transporter || "");
        formData.append("vehicleId", vehicle || "");
        formData.append("driverId", driver || "");
        formData.append("itemsToDispatch", JSON.stringify(itemsToDispatch));
        formData.append("challanDate", challanDate.toISOString());
        formData.append("notes", challanNotes);
        formData.append("transportMode", transportMode);
        formData.append("subMode", subMode);
        formData.append("lrNo", lrNo || "");
        formData.append("railwayReceiptNo", railwayReceiptNo || "");
        formData.append("wagonNo", wagonNo || "");
        formData.append("trainNo", trainNo || "");
        formData.append("railwayWagonNo", railwayWagonNo || "");
        formData.append("railwayTrainNo", railwayTrainNo || "");
        formData.append("rrbNo", rrbNo || "");
        formData.append("freightCharge", parseFloat(freightCharge) || 0);
        formData.append("otherCharges", parseFloat(otherCharges) || 0);
        if (existingAttachments.length > 0) {
          formData.append("existingAttachments", JSON.stringify(existingAttachments));
        }
        newFiles.forEach((attachment) => {
          if (attachment.file instanceof File) {
            formData.append("attachments", attachment.file, attachment.filename);
          }
        });

        response = await api.post("/api/delivery-challans/create-from-invoice", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      // ========== PRIORITY 3: INDEPENDENT CHALLAN ==========
      else {
        // For independent challan types
        const nonEmptyProducts = getNonEmptyProducts();
        formData.append("challanType", challanType);
        formData.append("customerId", customer.customerId);
        formData.append("customerGstin", customerGstin);
        formData.append("customerState", customerState);
        formData.append("customerCity", customerCity);
        formData.append("customerPincode", customerPincode);
        formData.append("transporterId", transporter || "");
        formData.append("vehicleId", vehicle || "");
        formData.append("driverId", driver || "");
        formData.append("items", JSON.stringify(nonEmptyProducts.map(item => ({
          productId: item.productId,
          itemName: item.itemName,
          qty: item.qty,
          unit: item.unit,
          serialNumbers: item.selectedSerialNos || [],
          lotNumber: item.lotNumber || "",
          hsnCode: item.hsnCode || "",
          description: item.description || "",
          discountPct: item.discountPct || 0,
          discountAmt: item.discountAmt || 0,
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 0,
          taxAmount: item.taxAmount || 0,
          amount: item.amount || 0,
        }))));
        formData.append("challanDate", challanDate.toISOString());
        formData.append("fromAddress", fromAddress);
        formData.append("toAddress", toAddress);
        formData.append("purposeOfMovement", purposeOfMovement);
        if (ewayBillNo) formData.append("ewayBillNo", ewayBillNo);
        formData.append("notes", challanNotes);
        formData.append("transportMode", transportMode);
        formData.append("subMode", subMode);
        formData.append("lrNo", lrNo || "");
        formData.append("railwayReceiptNo", railwayReceiptNo || "");
        formData.append("wagonNo", wagonNo || "");
        formData.append("trainNo", trainNo || "");
        formData.append("railwayWagonNo", railwayWagonNo || "");
        formData.append("railwayTrainNo", railwayTrainNo || "");
        formData.append("rrbNo", rrbNo || "");
        formData.append("freightCharge", parseFloat(freightCharge) || 0);
        formData.append("otherCharges", parseFloat(otherCharges) || 0);

        if (existingAttachments.length > 0) {
          formData.append("existingAttachments", JSON.stringify(existingAttachments));
        }
        newFiles.forEach((attachment) => {
          if (attachment.file instanceof File) {
            formData.append("attachments", attachment.file, attachment.filename);
          }
        });

        response = await api.post("/api/delivery-challans/create-independent", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      // if (response.data.success) {
      //   // Store the generated challan number
      //   const generatedChallanNo = response.data.deliveryChallan?.challanNo;
      //   setChallanNo(generatedChallanNo);

      //   toast.success(`Delivery Challan created successfully! Number: ${generatedChallanNo}`);

      //   if (shouldPrint) {
      //     // Navigate to print page for delivery challan
      //     navigate(`/show-delivery-challan/${response.data.deliveryChallan._id}`);
      //   } else {
      //     navigate("/deliverychallan");
      //   }
      // }
      if (response.data.success) {
        const createdChallan = response.data.deliveryChallan;
        setChallanNo(createdChallan?.challanNo);
        toast.success(`Delivery Challan created! Number: ${createdChallan?.challanNo}`);

        if (chalan) {
          // Convert the just-created challan to invoice via the new endpoint
          try {
            const invoiceRes = await api.post(
              `/api/delivery-challans/${createdChallan._id}/convert-to-invoice`
            );
            if (invoiceRes.data.success) {
              toast.success(
                `Invoice also created: ${invoiceRes.data.invoice.invoiceNo}`
              );
              if (shouldPrint) {
                navigate(`/show-invoice/${invoiceRes.data.invoice._id}`);
              } else {
                navigate("/deliverychallan");
              }
            }
          } catch (err) {
            toast.error("Challan saved but invoice creation failed");
            navigate("/deliverychallan");
          }
        } else if (shouldPrint) {
          navigate(`/show-delivery-challan/${createdChallan._id}`);
        } else {
          navigate("/deliverychallan");
        }
      }
    } catch (error) {
      // console.error("Error creating delivery challan:", error);
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to create delivery challan");
    } finally {
      setIsSubmitting(false);
    }
  };
  // Helper for preview
  const parseNumber = (num) => parseFloat(num) || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInvoiceSearch = event.target.closest('.invoice-search-container');
      if (
        !isInvoiceSearch && // Add this condition
        viewManageRef.current &&
        !viewManageRef.current.contains(event.target) &&
        viewDueDateRef.current &&
        !viewDueDateRef.current.contains(event.target)
      ) {
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
        setViewDueDateOptions(false);
        setIsDueDatePickerOpen(false);
      }
    };


    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside the Due Date dropdown container
      const isInsideDueDate = viewDueDateRef.current && viewDueDateRef.current.contains(event.target);
      const isInsideDueDatePicker = event.target.closest('.react-datepicker');
      const isInsideDueDateOptions = event.target.closest('.due-date-options');

      // Check if click is outside the Challan Date dropdown container
      const isInsideChallanDate = viewManageRef.current && viewManageRef.current.contains(event.target);
      const isInsideChallanDatePicker = event.target.closest('.react-datepicker');
      const isInsideChallanDateOptions = event.target.closest('.challan-date-options');

      // Check other dropdowns
      const isInsideCustomerSearch = event.target.closest('.customer-search-container');
      const isInsideProductSearch = event.target.closest('.search-input-container');
      const isInsideCharges = event.target.closest('.charges-container');
      const isInsideInvoiceSearch = event.target.closest('.invoice-search-container');

      // Close Due Date dropdown if clicking outside
      if (!isInsideDueDate &&
        !isInsideDueDatePicker &&
        !isInsideDueDateOptions &&
        viewDueDateOptions) {
        setViewDueDateOptions(false);
        setIsDueDatePickerOpen(false);
      }

      // Close Challan Date dropdown if clicking outside
      if (!isInsideChallanDate &&
        !isInsideChallanDatePicker &&
        !isInsideChallanDateOptions &&
        viewManageOptions) {
        setViewManageOptions(false);
        setIsDatePickerOpen(false);
      }

      // Close other dropdowns
      if (!isInsideCustomerSearch && showCustomerDropdown) {
        setShowCustomerDropdown(false);
      }

      if (!isInsideCharges && viewChargeOptions) {
        setViewChargeOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewDueDateOptions, viewManageOptions, showCustomerDropdown, viewChargeOptions]);

  useEffect(() => {
    const handleDatePickerClick = (event) => {
      // Don't close if clicking inside the date picker calendar
      if (event.target.closest('.react-datepicker')) {
        return;
      }
      // Don't close if clicking on the date picker input
      if (event.target.closest('.react-datepicker__input-container')) {
        return;
      }
    };

    document.addEventListener("click", handleDatePickerClick);
    return () => document.removeEventListener("click", handleDatePickerClick);
  }, []);
  // for auto product row add
  // useEffect(() => {
  //   // check if the last product row has been filled
  //   const lastProduct = products[products.length - 1];
  //   if (
  //     lastProduct &&
  //     lastProduct.itemName &&
  //     lastProduct.itemName.trim() !== ""
  //   ) {
  //     const  isLastRow = products.indexOf(lastProduct) === products.length - 1;
  //     if(isLastRow) {
  //     // Add a new row automatically
  //     const timer = setTimeout(() => {
  //       if (!hasAddedInitialProduct.current) {
  //         addProductRow();
  //         hasAddedInitialProduct.current = true;
  //       }
  //     }, 300);
  //     return () => clearTimeout(timer);
  //   }
  //   }
  // }, [products]);

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
      }, 500); // Increased delay for better UX

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

  // Add this function to filter out empty products
  const getNonEmptyProducts = () => {
    return products
      .filter(
        (p) =>
          p.productId &&
          p.productId.trim() !== "" &&
          p.itemName &&
          p.itemName.trim() !== "",
      )
      .map((p) => ({
        ...p,
        // Ensure selectedSerialNos exists
        selectedSerialNos: p.selectedSerialNos || [],
        // Ensure serialNumbers exists
        serialNumbers: p.serialNumbers || [],
        hsnCode: p.hsnCode || p.hsn || "",
      }));
  };

  // Update delivery challan (for edit mode)
  const handleUpdateDeliveryChallan = async (shouldPrint = false) => {
    if (!deliveryChallanId) {
      toast.error("No delivery challan ID found");
      return;
    }

    setIsSubmitting(true);

    try {
      // ========== PREPARE ATTACHMENTS ==========
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
      const formData = new FormData();

      formData.append("challanType", challanType);
      formData.append("customerId", customer.customerId);
      formData.append("customerGstin", customerGstin);
      formData.append("customerState", customerState);
      formData.append("customerCity", customerCity);
      formData.append("customerPincode", customerPincode);
      formData.append("transporterId", transporter || "");
      formData.append("vehicleId", vehicle || "");
      formData.append("driverId", driver || "");
      formData.append("items", JSON.stringify(getNonEmptyProducts().map(item => ({
        productId: item.productId,
        itemName: item.itemName,
        qty: item.qty,
        unit: item.unit,
        serialNumbers: item.selectedSerialNos || [],
        lotNumber: item.lotNumber || "",
        hsnCode: item.hsnCode || "",
        description: item.description || "",
      }))));
      formData.append("challanDate", challanDate.toISOString());
      formData.append("fromAddress", fromAddress);
      formData.append("toAddress", toAddress);
      formData.append("purposeOfMovement", purposeOfMovement);
      if (ewayBillNo) formData.append("ewayBillNo", ewayBillNo);
      formData.append("notes", challanNotes);
      formData.append("transportMode", transportMode);
      formData.append("subMode", subMode);
      formData.append("lrNo", lrNo || "");
      formData.append("railwayReceiptNo", railwayReceiptNo || "");
      formData.append("wagonNo", wagonNo || "");
      formData.append("trainNo", trainNo || "");
      formData.append("railwayWagonNo", railwayWagonNo || "");
      formData.append("railwayTrainNo", railwayTrainNo || "");
      formData.append("rrbNo", rrbNo || "");
      formData.append("freightCharge", parseFloat(freightCharge) || 0);
      formData.append("otherCharges", parseFloat(otherCharges) || 0);

      // Add attachments
      if (existingAttachments.length > 0) {
        formData.append("existingAttachments", JSON.stringify(existingAttachments));
      }
      newFiles.forEach((attachment) => {
        if (attachment.file instanceof File) {
          formData.append("attachments", attachment.file, attachment.filename);
        }
      });

      const response = await api.put(`/api/delivery-challans/${deliveryChallanId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        setUploadedAttachments([]);
        toast.success("Delivery Challan updated successfully!");

        if (shouldPrint) {
          navigate(`/show-delivery-challan/${response.data.deliveryChallan._id}`);
        } else {
          navigate("/delivery-challans");
        }
      }
    } catch (error) {
      // console.error("Error updating delivery challan:", error);
      toast.error(error.response?.data?.message || "Failed to update delivery challan");
    } finally {
      setIsSubmitting(false);
    }
  };


  if (loading) return <div>Loading...</div>;

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
                <FaArrowLeft style={{ color: "#A2A8B8" }} />
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
                {mode === "view" ? "View Delivery Challan" :
                  mode === "edit" ? "Edit Delivery Challan" :
                    isConvertingFromProforma ? "Convert Proforma to Sales Invoice" :
                      isConvertingFromQuotation ? "Convert Quotation to Sales Invoice" :
                        "Create Delivery Challan"}
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
                onClick={() => handleViewInvoice(true)}
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
            {/* ========== CHALLAN TYPE SELECTION ========== */}

            {/* Customer Details */}
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
                Customer Details
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
                    flexWrap: "wrap",
                  }}
                >
                  {/* left side = customer details */}
                  <div
                    style={{
                      width: "50%",
                      borderRight: "2px solid #eee",
                    }}
                  >
                    {/* customer name + phone no */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        gap: "45px",
                        width: "100%",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* customer name */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          width: "40%",
                          minWidth: "200px",
                        }}
                      >
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
                              readOnly={isReadOnly || (isFromNavbar && customer.customerId)}
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: (isReadOnly || (isFromNavbar && customer.customerId)) ? "default" : (isFromNavbar ? "pointer" : "text"),
                                backgroundColor: isReadOnly ? "#f9fafb" : "transparent",
                              }}
                              value={
                                isFromNavbar ? customerSearch : customer.name
                              }
                              onChange={(e) => {
                                if (isReadOnly) return;
                                if (isFromNavbar) {
                                  setCustomerSearch(e.target.value);
                                  setPhoneSearch("");
                                  setShowCustomerDropdown(true);
                                } else {
                                  setCustomer({
                                    ...customer,
                                    name: e.target.value,
                                  });
                                }
                              }}
                              onFocus={() => {
                                if (isReadOnly) return;
                                if (isFromNavbar && !customer.customerId) setShowCustomerDropdown(true);
                              }}
                              readOnly={isFromNavbar && customer.customerId}
                            />
                          </div>

                          {isFromNavbar && !isReadOnly && (
                            <div style={{ display: "flex", gap: "4px" }}>
                              {customer.customerId ? (
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
                                    {filteredCustomers.length} customer(s) found
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
                                        marginLeft: "8px",
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
                      </div>

                      {/* phone number */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          width: "40%",
                          minWidth: "200px",
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
                            {isFromNavbar && !customer.customerId && (
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
                                  ? "Search by phone..."
                                  : "Enter Customer No"
                              }
                              style={{
                                border: "none",
                                outline: "none",
                                fontSize: "14px",
                                cursor: isReadOnly ? "default" : (isFromNavbar ? "pointer" : "text"),
                              }}
                              value={isFromNavbar ? phoneSearch : customer.phone}
                              onChange={(e) => {
                                if (isReadOnly) return;
                                const value = e.target.value.replace(/\D/g, "");

                                if (isFromNavbar) {
                                  setPhoneSearch(value);
                                  setCustomerSearch("");
                                  setShowCustomerDropdown(true);
                                } else {
                                  setCustomer({
                                    ...customer,
                                    phone: value,
                                  });
                                }
                              }}
                              onFocus={() => {
                                if (isReadOnly) return;
                                if (isFromNavbar && !customer.customerId) setShowCustomerDropdown(true);
                              }}
                              readOnly={isReadOnly || (isFromNavbar && customer.customerId)}
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
                    <div style={{ marginTop: "10px", width: "100%" }}>
                      <label>Billing Address</label>
                      <div>
                        <textarea
                          placeholder="Enter Billing Address"
                          readOnly={isReadOnly}
                          style={{
                            width: "100%",
                            height: "80px",
                            borderRadius: "8px",
                            border: "1px dashed #EAEAEA",
                            padding: "8px",
                            marginTop: "4px",
                            resize: "none",
                            backgroundColor: isReadOnly ? "#f9fafb" : "white",
                          }}
                          value={customer.address}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            setCustomer({
                              ...customer,
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
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                      {/*  GSTIN */}
                      <div className="d-flex flex-column gap-1 w-100">
                        <label>
                          GSTIN<span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter GSTIN"
                          value={customerGstin}
                          onChange={(e) => setCustomerGstin(e.target.value)}
                          style={{
                            border: "1px solid #EAEAEA",
                            borderRadius: "8px",
                            padding: "6px 8px",
                          }}
                        />
                      </div>
                      {/*  State*/}
                      <div className="d-flex flex-column gap-1 w-100">
                        <label>
                          State<span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter State"
                          value={customerState}
                          onChange={(e) => setCustomerState(e.target.value)}
                          style={{
                            border: "1px solid #EAEAEA",
                            borderRadius: "8px",
                            padding: "6px 8px",
                          }}
                        />
                      </div>
                      {/* pincode */}
                      <div className="d-flex flex-column gap-1 w-100">
                        <label>
                          PinCode<span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter PinCode"
                          value={customerPincode}
                          onChange={(e) => setCustomerPincode(e.target.value)}
                          style={{
                            border: "1px solid #EAEAEA",
                            borderRadius: "8px",
                            padding: "6px 8px",
                          }}
                        />
                      </div>
                      {/* city */}
                      <div className="d-flex flex-column gap-1 w-100">
                        <label>
                          City<span style={{ color: "red" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Enter City"
                          value={customerCity}
                          onChange={(e) => setCustomerCity(e.target.value)}
                          style={{
                            border: "1px solid #EAEAEA",
                            borderRadius: "8px",
                            padding: "6px 8px",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {/* Right side = invoice data + due date + invoice number */}
                  {/* */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      gap: "0px",
                      width: "45%",
                    }}
                  >
                    <div
                    // style={{
                    //   display: "flex",
                    //   justifyContent: "end",
                    //   gap: "0px",
                    //   flexDirection: "column",
                    // }}
                    >
                      <div
                        style={{
                          height: 30,
                          justifyContent: "flex-start",
                          alignItems: "center",
                          display: "inline-flex",
                          gap: "16px",
                          cursor: "pointer",
                          flexWrap: "wrap",
                        }}
                      >
                        {/* Due Date - Updated with DatePicker */}
                        <div style={{ position: "relative", width: 180 }}>
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
                            Due Date
                          </span>
                          <div
                            ref={viewDueDateRef}
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
                            onClick={() => { closeAllDropdowns(); setViewDueDateOptions(true); }}
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
                              {format(dueDate, "dd MMM yyyy")}
                            </div>
                            <FiChevronDown />

                            {viewDueDateOptions && (
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
                                    "7 Days",
                                    "15 Days",
                                    "30 Days",
                                    "45 Days",
                                    "60 Days",
                                    "90 Days",
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
                                      onClick={() => handleDueDateSelect(option)}
                                    >
                                      <span style={{ color: "black" }}>{option}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Due DatePicker for Custom selection */}
                            {isDueDatePickerOpen && (
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
                                  selected={dueDate}
                                  onChange={(date) => {
                                    if (date) {
                                      setDueDate(date);
                                    }
                                    setIsDueDatePickerOpen(false);
                                    setViewDueDateOptions(false);
                                  }}
                                  inline
                                  calendarClassName="custom-calendar"
                                  minDate={new Date()}
                                />
                                <div
                                  style={{
                                    textAlign: "center",
                                    marginTop: "10px",
                                  }}
                                >
                                  <button
                                    onClick={() => {
                                      setIsDueDatePickerOpen(false);
                                      setViewDueDateOptions(false);
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

                        {/* Challan Date - Updated with DatePicker */}
                        <div style={{ position: "relative", width: 180 }}>
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
                            Challan Date
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
                            onClick={() => { closeAllDropdowns(); setIsDatePickerOpen(true); }}
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
                              {format(challanDate, "dd MMM yyyy")}
                            </div>
                            <FiChevronDown />
                          </div>

                          {/* DatePicker for Challan Date */}
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
                                selected={challanDate}
                                onChange={(date) => {
                                  if (date) {
                                    setChallanDate(date);
                                  }
                                  setIsDatePickerOpen(false);
                                  setViewDueDateOptions(false);
                                }}
                                onClickOutside={() => {
                                  setIsDueDatePickerOpen(false);
                                  setViewDueDateOptions(false);
                                }}
                                inline
                                calendarClassName="custom-calendar"
                                minDate={new Date()}
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

                        {/* Challan Number - Auto-generated/Editable field */}
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
                            Challan Number
                          </span>
                          <div
                            style={{
                              height: 38,
                              padding: "0 12px",
                              border: "1px solid #A2A8B8",
                              borderRadius: 8,
                              display: "flex",
                              alignItems: "center",
                              background: "#f9fafb", // Slightly different background to indicate auto-generated
                            }}
                          >
                            <input
                              type="text"
                              placeholder="Auto-generated on save"
                              value={challanNo}
                              readOnly
                              style={{
                                width: "100%",
                                border: "none",
                                outline: "none",
                                fontSize: 14,
                                fontFamily: "Inter",
                                fontWeight: "400",
                                background: "transparent",
                                color: challanNo ? "#0E101A" : "#9ca3af",
                              }}
                            />
                          </div>
                          {!challanNo && (
                            <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "4px", textAlign: "center" }}>
                              {/* Auto-generated on save */}
                            </div>
                          )}
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
              {/* heading + barcode scanner */}
              <div
                style={{
                  alignSelf: "stretch",
                  justifyContent: "space-between",
                  alignItems: "center",
                  display: "inline-flex",
                }}
              >
                {/* heading */}
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

                {/* barcode scanner */}
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
                    // onClick={() => handleViewInvoice(true)}
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

              {/* Products Table */}
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
                      <div style={{
                        color: "#727681",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: "16.80px",
                        wordWrap: "break-word",
                      }}>Sl No.</div>
                    </div>

                    <div style={{
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
                    }}>
                      <div style={{
                        color: "#727681",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: "16.80px",
                        wordWrap: "break-word",
                      }}>Items</div>
                    </div>
                  </div>

                  {/* <div style={dividerStyle} /> */}


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
                          }}>Description</div>
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
                          <div style={{
                            color: "#727681",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "500",
                            lineHeight: "16.80px",
                            wordWrap: "break-word",
                          }}>Lot No</div>
                        </div>
                        <div style={dividerStyle} />
                      </>
                    )}

                    <div style={{
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
                    }}>
                      <div style={{
                        color: "#727681",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: "16.80px",
                        wordWrap: "break-word",
                      }}>Qty</div>
                    </div>
                    <div style={dividerStyle} />

                    {settings.serialno && (
                      <>
                        <div style={{
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
                        }}>
                          <div style={{
                            color: "#727681",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "500",
                            lineHeight: "16.80px",
                            wordWrap: "break-word",
                          }}>Serial No</div>
                        </div>
                        <div style={dividerStyle} />
                      </>
                    )}

                    <div style={{
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
                    }}>
                      <div style={{
                        color: "#727681",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: "16.80px",
                        wordWrap: "break-word",
                      }}>Unit Price</div>
                    </div>
                    <div style={dividerStyle} />

                    <div style={{
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
                    }}>
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

                    <div style={{
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
                    }}>
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
                      <div
                        style={{
                          ...headerTextStyle,
                          color: taxSettings.enableGSTBilling
                            ? "#727681"
                            : "#A2A8B8",
                          opacity: taxSettings.enableGSTBilling ? 1 : 0.5,
                        }}
                      >
                        Discount
                      </div>
                    </div>
                    <div style={dividerStyle} />

                    <div style={{
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
                    }}>
                      <div style={{
                        color: "#727681",
                        fontSize: 14,
                        fontFamily: "Inter",
                        fontWeight: "500",
                        lineHeight: "16.80px",
                        wordWrap: "break-word",
                      }}>Amount</div>
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
                                width: 200,
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
                                  handleSearch(e, p.id);
                                  openDropdown(p.id);
                                }}
                                onKeyDown={(e) => {
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
                                placeholder="Search Product"
                                style={{
                                  ...inputStyle,
                                  padding: "8px 12px",
                                  boxSizing: "border-box",
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
                          </div>

                          {/* <div style={dividerStyle} /> */}
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
                                    readOnly={isReadOnly}
                                    onChange={(e) =>
                                      !isReadOnly
                                      &&
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
                                  width: "100px",
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
                                    placeholder="Lot Number"
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
                                readOnly={isReadOnly}
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
                                >
                                  <SerialNumberDropdown
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
                                  />
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
                            background: challanType === "against_invoice" && selectedInvoice ? "#f0f0f0" : "var(--White, white)",
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
                            readOnly={isReadOnly}
                            readOnly={challanType === "against_invoice" && selectedInvoice}
                            disabled={challanType === "against_invoice" && selectedInvoice}
                            value={
                              additionalDiscountType === "Percentage"
                                ? additionalDiscountPct || ""
                                : additionalDiscountType === "Fixed"
                                  ? additionalDiscountAmt || ""
                                  : ""
                            }
                            onChange={(e) => {
                              if (challanType === "against_invoice" && selectedInvoice) return;
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
                              background: isReadOnly ? "#f9fafb" : "transparent",
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
                                cursor: "pointer",
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
                                <span style={{ fontWeight: "500", textTransform: "capitalize" }}>
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
                          className=""
                          readOnly={isReadOnly}
                          style={{
                            flex: 1,
                            border: "none",
                            padding: "10px 12px",
                            outline: "none",
                            fontSize: "14px",
                            width: "400px",
                            background: isReadOnly ? "#f9fafb" : "transparent",
                          }}
                          value={chargeAmount}
                          onChange={(e) => {
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
                          }}
                          onClick={handleViewChargeOptions}
                        >
                          {selectedChargeType
                            ? selectedChargeType.replace("charge", "")
                            : "Charges"}{" "}
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
                  </div>

                  {/* new for transport assign in invoice */}
                  {/* <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "14px",
                      marginBottom: "40px",
                    }}
                  >
                   
                    <div>
                      <label
                        style={{
                          color: "#727681",
                          fontSize: "12px",
                          marginBottom: "6px",
                          display: "block",
                        }}
                      >
                        Select  Transport
                      </label>

                     <select
  value={transporter}
  onChange={(e) => {
    if (!isReadOnly) {
      const selectedId = e.target.value;
      setTransporter(selectedId);
    
      const selectedTransporter = transporterOptions.find(t => t._id === selectedId);
      if (selectedTransporter) {
      
        setTransporterId(selectedTransporter.transporterID || selectedTransporter.transporterId || "");
      } else {
        setTransporterId("");
      }
    }
  }}
  disabled={isReadOnly}
  style={{
    border: "1px solid #D0D5DD",
    backgroundColor: isReadOnly ? "#f9fafb" : "#ffffff",
    borderRadius: "8px",
    padding: "10px 12px",
    width: "100%",
    outline: "none",
    fontSize: "14px",
    color: "#667085",
  }}
>
  <option value="">Select Transport Mode</option>
  {transporterOptions.map((t) => (
    <option key={t._id} value={t._id}>{t.transporterName}</option>
  ))}
</select>
                    </div>

                     
                    <div>
                      <label
                        style={{
                          color: "#727681",
                          fontSize: "12px",
                          marginBottom: "6px",
                          display: "block",
                        }}
                      >
                        Select  Transport ID
                      </label>

                      <input
                    type="text"
                    placeholder="Transporter ID"
                    value={transporterId}
                    readOnly
                    onChange={(e) => setTransporterId(e.target.value)}
                   style={{
                          border: "1px solid #D0D5DD",
                          backgroundColor: isReadOnly ? "#f9fafb" : "#ffffff",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          width: "100%",
                          outline: "none",
                          fontSize: "14px",
                          color: "#667085",
                        }}
                  />
                    </div>

                   
                    <div>
                      <label
                        style={{
                          color: "#727681",
                          fontSize: "12px",
                          marginBottom: "6px",
                          display: "block",
                        }}
                      >
                        Select Vehicle
                      </label>

                      <select
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                        style={{
                          border: "1px solid #D0D5DD",
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          width: "100%",
                          outline: "none",
                          fontSize: "14px",
                          color: "#667085",
                        }}
                      >
                        <option value="">Select Vehicle Type</option>
                        {vehicleOptions.map((v) => (
                          <option key={v._id} value={v._id}>{v.vehicleNumber}</option>
                        ))}
                      </select>
                    </div>
                   
                    <div>
                      <label
                        style={{
                          color: "#727681",
                          fontSize: "12px",
                          marginBottom: "6px",
                          display: "block",
                        }}
                      >
                        Select Driver
                      </label>

                      <select
                        value={driver}
                        onChange={(e) => setDriver(e.target.value)}
                        style={{
                          border: "1px solid #D0D5DD",
                          backgroundColor: "#ffffff",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          width: "100%",
                          outline: "none",
                          fontSize: "14px",
                          color: "#667085",
                        }}
                      >
                        <option value="">Select Driver</option>
                        {driverOptions.map((d) => (
                          <option key={d._id} value={d._id}>{d.driverName}</option>
                        ))}
                      </select>
                    </div>
                  </div> */}
                  {/* Transport Section - ONLY roadways and railways (removed airways and shipways) */}
                  {/* Transport Section - WITH ROADWAYS (LR) and RAILWAYS support - Same as CreateShipments */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "40px" }}>
                    {/* Transport Mode Selection */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ color: "#727681" }}>Transport Mode<span style={{ color: "red" }}>*</span></label>
                      <select
                        value={transportMode}
                        readOnly={isReadOnly}
                        onChange={(e) => {
                          const newMode = e.target.value;
                          setTransportMode(newMode);

                          // AUTO-SELECT SUB-MODE BASED ON TRANSPORT MODE
                          if (newMode === "roadways") {
                            setSubMode("LR");  // Auto-select LR for roadways
                          } else if (newMode === "railways") {
                            setSubMode("RR");  // Auto-select RR for railways
                          } else {
                            setSubMode("");
                          }
                        }}
                        style={{ width: "200px", height: "30px", border: "1px solid #A2A8B8", padding: "4px 12px", borderRadius: "8px", outline: "none" }}
                      >
                        <option value="" hidden>Select Transport Mode</option>
                        <option value="roadways">🚛 Roadways (LR - Truck)</option>
                        <option value="railways">🚆 Railways (RR - Train)</option>
                      </select>
                    </div>

                    {/* Roadways - LR (Truck Transport) */}
                    {transportMode === "roadways" && (
                      <>
                        {/* Hidden sub-mode indicator - just for display, not a select dropdown */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "12px", color: "#727681" }}>Transport Type</label>
                          <div style={{
                            padding: "4px 12px",
                            borderRadius: "8px",
                            border: "1px solid #A2A8B8",
                            width: "200px",
                            background: "#f5f5f5",
                            fontSize: "14px",
                            color: "#333"
                          }}>
                            LR - Truck Transport
                          </div>
                        </div>

                        {/* LR Number for Truck Transport */}
                        <div>
                          <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                            LR Number <span style={{ color: "red" }}>*</span>
                            <span style={{ fontSize: "10px", color: "#6B7280" }}>(Format: LR/STATION/YYYY/XXXXXX)</span>
                          </label>
                          <input
                            type="text"
                            value={lrNo}
                            onChange={(e) => handleLrNoChange(e.target.value)}
                            placeholder="Enter LR Number"
                            style={{
                              border: `1px solid ${lrError ? '#ef4444' : '#D0D5DD'}`,
                              borderRadius: "8px",
                              padding: "10px 12px",
                              width: "100%",
                              outline: "none",
                              fontSize: "14px",
                              color: "#667085"
                            }}
                          />
                          {lrError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{lrError}</div>}
                        </div>

                        {/* Select Transporter */}
                        <div>
                          <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Transporter<span style={{ color: "red" }}>*</span></label>
                          <select value={transporter} onChange={(e) => setTransporter(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }}>
                            <option value="">Select Transporter</option>
                            {transporterOptions.map((t) => (<option key={t._id} value={t._id}>{t.transporterName}</option>))}
                          </select>
                        </div>

                        <div>
                          <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Vehicle<span style={{ color: "red" }}>*</span></label>
                          <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }} disabled={!transporter || filteredVehicleOptions.length === 0}>
                            <option value="">Select Vehicle</option>
                            {filteredVehicleOptions.map((v) => (<option key={v._id} value={v._id}>{v.vehicleNumber} {v.vehicleType ? `(${v.vehicleType})` : ""}</option>))}
                          </select>
                          {transporter && filteredVehicleOptions.length === 0 && (<div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>No vehicles found for this transporter</div>)}
                        </div>

                        <div>
                          <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Driver<span style={{ color: "red" }}>*</span></label>
                          <select value={driver} onChange={(e) => setDriver(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }} disabled={!transporter || filteredDriverOptions.length === 0}>
                            <option value="">Select Driver</option>
                            {filteredDriverOptions.map((d) => (<option key={d._id} value={d._id}>{d.driverName} {d.phoneNumber ? `(${d.phoneNumber})` : ""}</option>))}
                          </select>
                          {transporter && filteredDriverOptions.length === 0 && (<div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>No drivers found for this transporter</div>)}
                        </div>
                      </>
                    )}

                    {/* Railways - RR (Train Transport) */}
                    {transportMode === "railways" && (
                      <>
                        {/* Hidden sub-mode indicator */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "12px", color: "#727681" }}>Transport Type</label>
                          <div style={{
                            padding: "4px 12px",
                            borderRadius: "8px",
                            border: "1px solid #A2A8B8",
                            width: "200px",
                            background: "#f5f5f5",
                            fontSize: "14px",
                            color: "#333"
                          }}>
                            RR - Train Transport
                          </div>
                        </div>
                        <div style={{ flex: 1, minWidth: "180px" }}>
                          <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                            RR Number <span style={{ color: "red" }}>*</span>
                            <span style={{ fontSize: "10px", color: "#6B7280" }}>(Format: PXYZ2024-123456)</span>
                          </label>
                          <input
                            type="text"
                            value={rrbNo}
                            readOnly={isReadOnly}
                            onChange={(e) => handleRrbNoChange(e.target.value)}
                            placeholder="Enter RR Number"
                            style={{
                              border: `1px solid ${rrError ? '#ef4444' : '#D0D5DD'}`,
                              borderRadius: "8px",
                              padding: "10px 12px",
                              width: "100%",
                              outline: "none",
                              fontSize: "14px",
                              color: "#667085"
                            }}
                          />
                          {rrError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{rrError}</div>}
                        </div>

                        {/* Railways Fields */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px", gridColumn: "span 2" }}>
                          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                            <div style={{ flex: 1, minWidth: "180px" }}>
                              <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                                Train No. <span style={{ color: "red" }}>*</span>
                              </label>
                              <input
                                type="text"
                                value={railwayTrainNo}
                                readOnly={isReadOnly}
                                onChange={(e) => {
                                  setRailwayTrainNo(e.target.value);
                                  const validation = validateTrainNumber(e.target.value);
                                  setTrainError(validation.error);
                                }}
                                placeholder="Enter Train No."
                                style={{
                                  border: `1px solid ${trainError ? '#ef4444' : '#D0D5DD'}`,
                                  borderRadius: "8px",
                                  padding: "10px 12px",
                                  width: "100%",
                                  outline: "none",
                                  fontSize: "14px",
                                  color: "#667085"
                                }}
                              />
                              {trainError && (
                                <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>
                                  {trainError}
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: "180px" }}>
                              <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                                Wagon No.
                              </label>
                              <input
                                type="text"
                                value={railwayWagonNo}
                                onChange={(e) => {
                                  setRailwayWagonNo(e.target.value);
                                  const validation = validateWagonNumber(e.target.value);
                                  setWagonError(validation.error);
                                }}
                                placeholder="Enter Wagon No. (Optional)"
                                style={{
                                  border: `1px solid ${wagonError ? '#ef4444' : '#D0D5DD'}`,
                                  borderRadius: "8px",
                                  padding: "10px 12px",
                                  width: "100%",
                                  outline: "none",
                                  fontSize: "14px",
                                  color: "#667085"
                                }}
                              />
                              {wagonError && (
                                <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>
                                  {wagonError}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Upload Images */}
                  {/* Upload Attachments */}
                  <div style={{ marginTop: "20px" }}>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginBottom: "8px" }}>
                      Attachments (Images, PDF, Excel, CSV)
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
                  {/* e way bill and delivery chalan */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      marginTop: "20px",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      {/* <div style={checkboxStyle(eway)} onClick={() => setEway(!eway)}>
                        {eway && <span style={tickStyle}>✓</span>}
                      </div> */}
                      {/* <span
                        style={{
                          color: "#0E101A",
                          fontSize: "12px",
                          fontWeight: 400,
                          fontFamily: "inter, 'sans-serif'",
                        }}
                      >
                        Create E-way Bill
                      </span> */}
                    </label>

                    <label
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                    >
                      <div style={checkboxStyle(chalan)} onClick={() => setChalan(!chalan)}>
                        {chalan && <span style={tickStyle}>✓</span>}
                      </div>
                      <span
                        style={{
                          color: "#0E101A",
                          fontSize: "12px",
                          fontWeight: 400,
                          fontFamily: "inter, 'sans-serif'",
                        }}
                      >
                        Create Invoice
                      </span>
                    </label>
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

                  {/* Product/Item Discount - ADD THIS */}
                  <div
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
                  {/* update additional charge end */}

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
                          disabled={isReadOnly}
                          style={{ accentColor: "#ffffffff" }}
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
                                backgroundColor: "white",
                              }}
                              value={shoppingPointsUsed}
                              readOnly={isReadOnly}
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
                              disabled={!usePoints}
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
                                backgroundColor: "white",
                              }}
                              readOnly={isReadOnly}
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
                      disabled={isReadOnly}
                      style={{
                        accentColor: "#ffffffff",
                        cursor: isReadOnly ? "default" : "pointer"
                      }}
                      // checked={autoRoundOff}
                      checked={
                        taxSettings.autoRoundOff !== "0" &&
                        taxSettings.enableGSTBilling
                      }
                      // onChange={(e) => setAutoRoundOff(e.target.checked)}
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
                      style={{
                        accentColor: "#ffffffff",
                        cursor: challanType === "against_invoice" && selectedInvoice ? "not-allowed" : (isReadOnly ? "default" : "pointer")
                      }}
                      checked={fullyReceived}
                      disabled={challanType === "against_invoice" && selectedInvoice}
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
                          background: challanType === "against_invoice" && selectedInvoice ? "#f0f0f0" : "#f9fafb",
                          outline: "none",
                          display: "flex",
                        }}
                      >
                        ₹
                        <input
                          placeholder="0.00"
                          className=""
                          value={amountReceived}
                          readOnly={challanType === "against_invoice" && selectedInvoice}
                          disabled={fullyReceived || (challanType === "against_invoice" && selectedInvoice)}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          style={{
                            borderRadius: "10px",
                            border: "none",
                            background: challanType === "against_invoice" && selectedInvoice ? "#f0f0f0" : "#f9fafb",
                            outline: "none",
                            width: "100%",
                            cursor: challanType === "against_invoice" && selectedInvoice ? "not-allowed" : "text"
                          }}
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
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
            </div>
          </div>
          <div
            style={{
              width: "100%",
              justifyContent: "end",
              alignItems: "center",
              display: "flex",
              marginTop: 5,
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
              {/* SAVE BUTTON - Only one onClick handler */}
              {mode === "view" ? (
                // Close button for view mode
                <div
                  onClick={() => navigate("/delivery-challans")}
                  style={{
                    height: 36,
                    padding: "8px 20px",
                    background: "var(--White-Universal-White, white)",
                    borderRadius: 8,
                    outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                    outlineOffset: "-1.50px",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      color: "var(--Blue-Blue, #1F7FFF)",
                      fontSize: 14,
                      fontFamily: "Inter",
                      fontWeight: "500",
                    }}
                  >
                    Close
                  </div>
                </div>
              ) : (
                <>
                  {/* SAVE BUTTON for create/edit */}
                  <div
                    onClick={() => mode === "edit" ? handleUpdateDeliveryChallan(false) : handleCreateDeliveryChallan(false)}
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
                      {isSubmitting ? (mode === "edit" ? "Updating..." : "Saving...") : (mode === "edit" ? "Update" : "Save")}
                    </div>
                  </div>

                  <div
                    onClick={() => mode === "edit" ? handleUpdateDeliveryChallan(true) : handleCreateDeliveryChallan(true)}
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
                      {isSubmitting ? (mode === "edit" ? "Updating..." : "Saving...") : (mode === "edit" ? "Update & Print" : "Save & Print")}
                    </div>
                  </div>
                </>
              )}
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
                onSuccess={handleNewCustomerCreated} //Auto selected new customer
              />
            </div>
          </div>
        )}

        {/* Preview Modal */}
        <PreviewInvoice
          isOpen={viewInvoiceOptions}
          onClose={() => setViewInvoiceOptions(false)}
          invoiceData={{
            invoiceNo,
            invoiceDate,
            dueDate,
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
            paidAmount: amountReceived,
            taxSettings,
          }}
          customerData={customer}
          companyData={companyData}
        />
        {/* variants selection popup - USING POS COMPONENT */}
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
      </div>
    </>
  );
}

export default CreateDeliveryChallan;
