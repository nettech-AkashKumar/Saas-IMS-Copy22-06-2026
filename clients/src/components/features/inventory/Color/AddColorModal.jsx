import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../../pages/config/axiosInstance";

const AddColorModal = ({ fetchColors, cleanUpModal, closeModal, show }) => {
  const { t } = useTranslation();
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("#000000");
  const [errors, setErrors] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const colorNameRef = useRef(null);

  const colorNameRegex = /^[A-Za-z\s]{2,50}$/;

  const resetForm = () => {
    setColorName("");
    setColorCode("#000000");
    setErrors({});
  };

  useEffect(() => {
    if (show && colorNameRef.current) {
      colorNameRef.current.focus();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      setErrors({});
      colorNameRef.current?.focus();
    }
  }, [show]);

  const handleClose = () => {
    resetForm();
    if (closeModal) {
      closeModal();
    }
    if (cleanUpModal) {
      cleanUpModal();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!colorNameRegex.test(colorName)) {
      newErrors.colorName = t("Color name must be 2–50 letters only.");
    } else if (!colorName) {
      newErrors.colorName = t("Color name is required.");
    }

    if (!colorCode) {
      newErrors.colorCode = t("Color code is required.");
    } else if (!/^#[0-9A-Fa-f]{6}$/.test(colorCode)) {
      newErrors.colorCode = t("Color code must be a valid hexadecimal color code.");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = {
      colorName,
      colorCode,
    };

    try {
      setIsAdding(true);
      await api.post(`/api/color/add-color`, formData);

      toast.success(t("Color created successfully!"));
      handleClose();
      if (fetchColors) fetchColors();

      if (!closeModal) {
        window.$(`#add-colors`).modal("hide");
      }
    } catch (error) {
      if (error.response?.data?.message === "Color Name already exists") {
        setErrors({ colorName: t("Color Name already exists") });
      } else if (error.response?.data?.message === "Color Code already exists") {
        setErrors({ colorCode: t("Color Code already exists") });
      } else {
        toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || t("Failed to create color."));
      }
    } finally {
      setIsAdding(false);
    }
  };

  const modalClass = show ? "modal show d-block fade" : "modal";

  const modalStyle = show ? {
    backgroundColor: "rgba(0,0,0,0.27)",
    backdropFilter: "blur(1px)",
    zIndex: 1060
  } : {};

  return (
    <div className={modalClass}
      id="add-colors"
      style={{
        backgroundColor: "rgba(0,0,0,0.27)",
        backdropFilter: "blur(1px)",
        zIndex: 1060
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>

            {/* heading */}
            <div className="modal-header">
              <h4>{t("Add Colors")}</h4>
            </div>

            {/* inputs */}
            <div className="modal-body">

              {/* color name */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Color Name")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t("Enter Color Name")}
                  ref={colorNameRef}
                  maxLength={50}
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                // required
                />
                {errors.colorName && <p className="text-danger">{errors.colorName}</p>}
              </div>

              {/* color code */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Color Code")}<span className="text-danger ms-1">*</span>
                </label>
                <div className="d-flex align-items-center gap-2">
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    required
                    style={{ width: '50px', padding: '0', height: '38px' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t("Enter Color Code")}
                    maxLength={7}
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                  // placeholder="#000000"
                  />
                </div>
                {errors.colorCode && <p className="text-danger">{errors.colorCode}</p>}
              </div>
            </div>

            {/* buttons */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn me-2 btn-secondary"
                onClick={handleClose}
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
                    {t("Adding Color...")}
                  </>
                ) : (
                  t("Add Color")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddColorModal;
