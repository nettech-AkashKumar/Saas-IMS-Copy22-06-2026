import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../pages/config/axiosInstance";
import { sanitizeInput } from "../../../utils/sanitize";

// icons
import { CiCirclePlus } from "react-icons/ci";
import { IoCloseCircleOutline } from "react-icons/io5";

const AddBrandModal = ({ fetchBrands, cleanUpModal, closeModal, show }) => {
  const { t } = useTranslation();
  const [brandName, setBrandName] = useState("");
  const [status, setStatus] = useState(true); // true = Active
  const [selectedImages, setSelectedImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const brandNameRegex = /^[A-Za-z0-9\s]{2,50}$/;
  const fileInputRef = useRef(null);

  const brandNameRef = useRef(null);

  useEffect(() => {
    if (show && brandNameRef.current) {
      brandNameRef.current.focus();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      setErrors({});
      brandNameRef.current?.focus();
    }
  }, [show]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(
      (file) =>
        ["image/jpeg", "image/png"].includes(file.type) &&
        file.size <= 2 * 1024 * 1024
    );
    if (validFiles.length !== files.length) {
      toast.error(t("Only JPG/PNG up to 2MB allowed"));
    }
    setSelectedImages(validFiles);
    // Reset input value so the same file can be selected again if removed
    if (e.target) {
      e.target.value = null;
    }
  };

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setSelectedImages([]);
  };

  const resetForm = () => {
    setBrandName("");
    setStatus(true);
    setSelectedImages([]);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    if (closeModal) {
      closeModal();
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!brandNameRegex.test(brandName)) {
      newErrors.brandName = t(
        "Brand name must be 2–50 characters (letters, numbers, spaces only)."
      );
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = new FormData();
    formData.append("brandName", sanitizeInput(brandName));
    formData.append("status", status ? "Active" : "Inactive");

    selectedImages.forEach((file) => {
      if (file instanceof File) {
        formData.append("image", file);
      }
    });

    try {
      setIsAdding(true);
      await api.post("/api/brands/addBrands", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (fetchBrands) fetchBrands();

      // Close modal using React state if provided
      if (closeModal) {
        closeModal();
      }

      resetForm();
      toast.success(t("Brand added successfully!"));
    } catch (error) {
      toast.error(error.response?.data?.displayMessage || error.response?.data?.message || t("Failed to add brand. Please try again.")
      );
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="modal show d-block" id="add-brand" style={{
      backgroundColor: "rgba(0,0,0,0.27)",
      backdropFilter: "blur(1px)",
      zIndex: 1060
    }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div
            className="modal-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="page-title">
              <h4>{t("Add Brand")}</h4>
            </div>
            {/* <button
              type="button"
              className="btn-close"
              onClick={() => {
                handleClose();
                if (cleanUpModal) cleanUpModal();
              }}
              aria-label="Close"
            ></button> */}
          </div>
          <form onSubmit={handleAddBrand}>
            <div className="modal-body new-employee-field">
              <div className="profile-pic-upload mb-3">
                <div
                  className="profile-pic brand-pic"
                  onClick={() => fileInputRef.current.click()}
                  style={{ cursor: "pointer", position: "relative" }}
                >
                  {selectedImages.length > 0 && (
                    <div
                      onClick={handleRemoveImage}
                      style={{
                        position: "absolute",
                        top: -10,
                        right: -10,
                        background: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        zIndex: 10,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IoCloseCircleOutline size={24} color="#FF4D4F" />
                    </div>
                  )}
                  <span>
                    {selectedImages.length > 0 ? (
                      <img
                        src={URL.createObjectURL(selectedImages[0])}
                        alt="Preview"
                        height="40"
                        style={{
                          height: "102px",
                          width: "106px",
                          borderRadius: "4px",
                        }}
                      />
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><CiCirclePlus className="" /> {t("Add Image")}</div>
                        <span style={{ fontSize: '9px' }}>{t("JPEG, PNG up to 2 MB")}</span>
                      </>
                    )}{" "}
                  </span>
                </div>
                <div className=" mb-0">
                  <input
                    type="file"
                    id="brandImageInput"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">
                  {t("Brand Name")}
                  <span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter Brand Name")}
                  maxLength={50}
                  className="form-control"
                  value={brandName}
                  ref={brandNameRef}
                  onChange={(e) => setBrandName(e.target.value)}
                />
                {errors.brandName && (
                  <p className="text-danger">{errors.brandName}</p>
                )}
              </div>
              <div className="mb-0">
                <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                  <span className="status-label">{t("Status")}</span>
                  <input
                    type="checkbox"
                    id="user2"
                    className="check"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                  />
                  <label
                    htmlFor="user2"
                    className="checktoggle"
                    title={status ? t("Active") : t("Inactive")}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn me-2 btn-secondary"
                onClick={() => {
                  handleClose();
                  if (cleanUpModal) cleanUpModal();
                }}
              >
                {t("Cancel")}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {t("Adding Brand...")}
                  </>
                ) : (
                  t("Add Brand")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddBrandModal;
