import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../../pages/config/axiosInstance";

const AddSizeModal = ({ fetchSizes, cleanUpModal, closeModal, show }) => {
  const { t } = useTranslation();
  const [sizeName, setSizeName] = useState("");
  const [errors, setErrors] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const sizeNameRef = useRef(null);

  const sizeNameRegex = /^[A-Za-z0-9\s()-]{2,50}$/;

  const resetForm = () => {
    setSizeName("");
    setErrors({});
  };

  useEffect(() => {
    if (show && sizeNameRef.current) {
      sizeNameRef.current.focus();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      setErrors({});
      sizeNameRef.current?.focus();
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
    if (!sizeNameRegex.test(sizeName)) {
      newErrors.sizeName = t("Size name must be 2–50 letters or numbers only.");
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = {
      sizeName,
    };

    try {
      setIsAdding(true);
      await api.post(`/api/size/add-size`, formData);

      toast.success(t("Size created successfully!"));
      handleClose();
      if (fetchSizes) fetchSizes();

      if (!closeModal) {
        window.$(`#add-sizes`).modal("hide");
      }
    } catch (error) {

      const errData = error?.response?.data;

      if (errData?.code === "DUPLICATE_KEY") {
        if (errData.field === "sizeName") {
          setErrors({ sizeName: "Size name already exists." });
        } else {
          setErrors({ duplicateError: errData.message });
        }
        return;
      }
      // toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to create size.");
    } finally {
      setIsAdding(false);
    }
  };

  const modalClass = show ? "modal show d-block" : "modal";

  const modalStyle = show ? {
    backgroundColor: "rgba(0,0,0,0.27)",
    backdropFilter: "blur(1px)",
    zIndex: 1060
  } : {};

  return (
    <div className={modalClass} id="add-sizes" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>

            {/* header */}
            <div className="modal-header">
              <h4>{t("Add Sizes")}</h4>
            </div>

            {/* inputs */}
            <div className="modal-body">

              {/* name input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Size Name")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter Size Name")}
                  maxLength={50}
                  ref={sizeNameRef}
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
                disabled={isAdding}
              >
                {isAdding ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {t("Adding Size...")}
                  </>
                ) : (
                  t("Add Size")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSizeModal;
