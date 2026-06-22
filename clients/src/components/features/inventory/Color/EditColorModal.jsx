import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../../pages/config/axiosInstance";

const EditColorModal = ({ selectedColor, onColorUpdated, cleanUpModal }) => {
  const { t } = useTranslation();
  const [colorName, setColorName] = useState("");
  const [colorCode, setColorCode] = useState("#000000");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const colorNameRegex = /^[A-Za-z\s]{2,50}$/;

  useEffect(() => {
    if (selectedColor) {
      setColorName(selectedColor.colorName || "");
      setColorCode(selectedColor.colorCode || "#000000");
      setErrors({});
    }
  }, [selectedColor]);

  const handleClose = () => {
    if (cleanUpModal) cleanUpModal();
    window.$("#edit-colors").modal("hide");
    setErrors({});
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
      setIsUpdating(true);
      await api.put(`/api/color/color/${selectedColor._id}`, formData);

      toast.success(t("Color updated successfully!"));
      handleClose();
      if (onColorUpdated) onColorUpdated();
    } catch (error) {
      if (error.response?.data?.message === "Color Name already exists"){
        setErrors({ colorName: t("Color Name already exists") });
      } else if (error.response?.data?.message === "Color Code already exists"){
        setErrors({ colorCode: t("Color Code already exists") });
      } else {
        toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || t("Failed to update color."));
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal fade" id="edit-colors" tabIndex="-1" aria-hidden="true"
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
              <h4>{t("Edit Color")}</h4>
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
                    // required
                    style={{ width: '50px', padding: '0', height: '38px' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    placeholder="#000000"
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
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {t("Updating Color...")}
                  </>
                ) : (
                  t("Save Changes")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditColorModal;
