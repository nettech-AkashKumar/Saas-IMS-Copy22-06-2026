import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// pages
import api from "../../../../pages/config/axiosInstance";
import { sanitizeInput } from "../../../../utils/sanitize";

// icons
import { RxCrossCircled } from "react-icons/rx";

// images
import tick from "../../../../assets/images/tick.png";

const EditDamageModal = ({ closeModal, selectedProduct }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    quantity: "",
    remarks: "",
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const newErrors = {};
    if (!quantity) newErrors.quantity = "Quantity is required.";
    if (Number(quantity) > maxQuantity) newErrors.quantity = `Quantity cannot exceed ${maxQuantity}`;
    if (!remarks) newErrors.remarks = "Remarks are required.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setFormData({
      quantity: Number(quantity),
      remarks: remarks ? sanitizeInput(remarks) : "",
    });

    try {
      if (!selectedCategoryId || !selectedProductId) return;
      const payload = {
        category: selectedCategoryId,
        product: selectedProductId,
        quantity: Number(quantity),
        remarks: remarks ? sanitizeInput(remarks) : "",
      };
      await api.put(`/api/damage-return/${selectedProduct._id}`, payload);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (typeof (window).onDamageCreated === "function") {
          (window).onDamageCreated();
        }
        closeModal();
      }, 1000);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to edit damage report");
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 1000);
    }
  };

  const handleInnerClick = (e) => {
    e.stopPropagation();
  };

  const handleChildClick = (e) => {
    e.stopPropagation();
  };

  // useEffect(() => {
  //   if (selectedProduct) {
  //     setSelectedCategoryId(selectedProduct.category?._id || "");
  //     setSelectedProductId(selectedProduct.product?._id || "");
  //     setQuantity(String(selectedProduct.quantity || ""));
  //     setRemarks(selectedProduct.remarks || "");

  //     // Calculate max quantity: current available stock + quantity already in this damage record
  //     // const currentStock = selectedProduct.product?.stockQuantity || 0;
  //     // const currentDamageQty = selectedProduct.quantity || 0;
  //     // setMaxQuantity(currentStock + currentDamageQty);

  //     const currentStock = selectedProduct.product?.stockQuantity || 0;
  //     const currentDamageQty = selectedProduct.quantity || 0;
  //     setMaxQuantity(currentStock + currentDamageQty);
  //   }
  // }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedCategoryId(selectedProduct.category?._id || "");
      setSelectedProductId(selectedProduct.product?._id || "");
      setQuantity(String(selectedProduct.quantity || ""));
      setRemarks(selectedProduct.remarks || "");

      const currentStock = selectedProduct.product?.stockQuantity || 0;
      const thisDamageQty = selectedProduct.quantity || 0;

      setMaxQuantity(currentStock + thisDamageQty);
    }
  }, [selectedProduct]);

  const onQuantityChange = (e) => {
    const valStr = e.target.value;
    if (valStr === "") {
      setQuantity("");
      return;
    }
    const valNum = Number(valStr);
    if (Number.isNaN(valNum)) return;

    const clamped = Math.max(0, Math.min(valNum, maxQuantity));
    setQuantity(String(clamped));
  };

  const onRemarksChange = (e) => {
    const val = e.target.value;
    setRemarks(val);

    // Clear remarks error if now filled
    if (val.trim()) {
      setErrors(prev => ({ ...prev, remarks: "" }));
    }
  };

  return (
    <div
      onClick={closeModal}
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
    >
      <div
        onClick={handleInnerClick}
        // ref={modelRef}
        className="create-category-modelbox"
        style={{
          backgroundColor: "white",
          width: "800px",
          padding: "50px 40px",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "end" }}>
          <button
            onClick={(e) => {  // FIXED: Stop on X
              e.stopPropagation();
              closeModal();
            }}
            style={{
              border: "2px solid #727681",
              borderRadius: "50px",
              width: "25px",
              height: "25px",
              backgroundColor: "white",
              color: "#727681",
              fontWeight: "500",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "13px",
            }}
          >
            x
          </button>
        </div>

        {showSuccess && (
          <div
            className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
            style={{
              border: "1px solid #0D6828",
              color: "#0D6828",
              background: '#EBFFF1',
              borderRadius: "8px",
              padding: "10px",
              margin: "15px 0",
            }}
            onClick={handleChildClick}
          >
            <label htmlFor="" style={{ fontFamily: "Inter", fontSize: "14px" }}>
              <img src={tick} alt="tick" /> Damage Successfully Created
            </label>
          </div>
        )}

        {showError && (
          <div
            className="create-error-msg d-flex justify-content-between align-items-center mb-4"
            style={{
              border: "1px solid #D62D20",
              color: "#D62D20",
              background: '#FFEBE6',
              borderRadius: "8px",
              padding: "10px",
              margin: "15px 0",
            }}
            onClick={handleChildClick}
          >
            <label htmlFor="" style={{ fontFamily: "Inter", fontSize: "14px" }}>
              <RxCrossCircled /> Failed to Edit Damage.
            </label>
          </div>
        )}

        <h1 style={{ color: "#0E101A", fontSize: "22px", fontFamily: "Inter" }}>
          Edit Damage
        </h1>
        <form onSubmit={handleSave}>
          <div className="add-category-form d-flex gap-3 pt-3 pb-3">
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Category <span style={{ color: "red" }}>*</span>
              </label>
              <div
                className="border-hover"
                type="name"
                placeholder="Enter Name"
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  outline: "none",
                }}
              >{selectedProduct?.category?.categoryName || ''}
              </div>
            </div>
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Product <span style={{ color: "red" }}>*</span>
              </label>
              <div
                className="border-hover"
                type="name"
                placeholder="Enter Name"
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  outline: "none",
                }}
              >{selectedProduct?.product?.productName || ''}
              </div>
            </div>
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Quantity <span style={{ color: "red" }}>*</span> <span style={{ color: "grey" }}>(Available Qty: {maxQuantity})</span>
              </label>
              <input
                onClick={handleChildClick}
                className="border-hover"
                type="number"
                min={1}
                max={maxQuantity || 1}
                value={quantity}
                onChange={onQuantityChange}
                placeholder="Enter Quantity"
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  outline: "none",
                  color: '#0E101A',
                }}
              />
              {errors.quantity && (
                <div style={{ color: "red", fontSize: "12px" }}>{errors.quantity}</div>
              )}
            </div>
          </div>

          <div className="d-flex flex-column gap-1 w-100 pb-4">
            <label
              htmlFor=""
              style={{
                color: "black",
                fontFamily: "Inter",
                fontSize: "13px",
              }}
            >
              Review <span style={{ color: "red" }}>*</span>
            </label>
            <textarea
              className="border-hover"
              onClick={handleChildClick}
              onChange={onRemarksChange}
              value={remarks}
              rows={3}
              maxLength={50}
              placeholder="Enter Remarks (max 50 characters)"
              style={{
                border: "1px solid #dfddddff",
                padding: "8px 12px",
                borderRadius: "8px",
                fontFamily: "Inter",
                color: "#0E101A",
                outline: "none",
              }}
            >
            </textarea>
            {errors.remarks && (
              <div style={{ color: "red", fontSize: "12px" }}>{errors.remarks}</div>
            )}
          </div>

          <button
            type="submit"
            className="button-hover"
            style={{
              backgroundColor: "rgb(31, 127, 255)",
              // color: "white",
              fontFamily: "Inter",
              border: "none",
              borderRadius: "8px",
              padding: "4px 8px",
            }}
          >
            <div style={{ textDecoration: "none", color: "white" }}>Save</div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditDamageModal;
