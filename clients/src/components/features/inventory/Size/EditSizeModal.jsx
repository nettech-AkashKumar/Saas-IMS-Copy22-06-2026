import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../../pages/config/axiosInstance";

const EditSizeModal = ({ selectedSize, onSizeUpdated, cleanUpModal }) => {
  const { t } = useTranslation();
  const [sizeName, setSizeName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const sizeNameRegex = /^[A-Za-z0-9\s()-]{2,50}$/;

  useEffect(() => {
    if (selectedSize) {
      setSizeName(selectedSize.sizeName || "");
      setErrors({});
    }
  }, [selectedSize]);

  const handleClose = () => {
    if (cleanUpModal) cleanUpModal();
    window.$("#edit-sizes").modal("hide");
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!sizeNameRegex.test(sizeName)) {
      newErrors.sizeName = t("Size name must be 2–50 letters or number only.");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = {
      sizeName,
    };

    try {
      setIsUpdating(true);
      await api.put(`/api/size/size/${selectedSize._id}`, formData);

      toast.success(t("Size updated successfully!"));
      handleClose();
      if (onSizeUpdated) onSizeUpdated();
    } catch (error) {
      const errData = error?.response?.data;

      if (errData?.code === "DUPLICATE_KEY") {
        if (errData.field === "sizeName") {
          setErrors({ sizeName: "Size name already exists." });
        } else {
          setErrors({ duplicateError: errData.message });
        }

        setIsUpdating(false);
        return; // ❗ IMPORTANT: stop execution
      }
      // toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to update size.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal fade" id="edit-sizes" tabIndex="-1" aria-hidden="true"
      style={{
        backgroundColor: "rgba(0,0,0,0.27)",
        backdropFilter: "blur(1px)",
        zIndex: 1060
      }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>

            {/* header */}
            <div className="modal-header">
              <h4>{t("Edit Size")}</h4>
            </div>

            {/* inputs */}
            <div className="modal-body">

              {/* size name input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Size Name")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter Size Name")}
                  maxLength={50}
                  className="form-control"
                  value={sizeName}
                  onChange={(e) => setSizeName(e.target.value)}
                // required
                />
                {errors.sizeName && <p className="text-danger">{errors.sizeName}</p>}
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
                    {t("Updating Size...")}
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

export default EditSizeModal;
