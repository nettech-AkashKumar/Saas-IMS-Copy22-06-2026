import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../../pages/config/axiosInstance";

const TaxAddModal = ({ fetchtaxs, cleanUpModal, closeModal, show }) => {
  const { t } = useTranslation();
  const [taxName, settaxName] = useState("");
  const [taxShortName, settaxShortName] = useState("");
  const [taxRate, settaxRate] = useState("");
  const [errors, setErrors] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const taxNameRef = useRef(null);

  const taxNameRegex = /^[A-Za-z\s()-]{2,100}$/;
  const taxShortNameRegex = /^[A-Za-z\s()-]{2,50}$/;
  const taxRateRegex = /^(?:\d{1,2})(\.\d{1,2})?$/;

  const resetForm = () => {
    settaxName("");
    settaxShortName("");
    settaxRate("");
    setErrors({});
  };

  useEffect(() => {
    if (show && taxNameRef.current) {
      taxNameRef.current.focus();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      setErrors({});
      taxNameRef.current?.focus();
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
    if (!taxNameRegex.test(taxName)) {
      newErrors.taxName = t("Tax name must be 2–50 letters only.");
    } else if (!taxName.trim()) {
      newErrors.taxName = t("Tax name is required.");
    }

    if (!taxShortNameRegex.test(taxShortName)) {
      newErrors.taxShortName = t("Tax short name must be 2–50 letters only.");
    } else if (!taxShortName.trim()) {
      newErrors.taxShortName = t("Tax short name is required.");
    }

    if (!taxRateRegex.test(taxRate)) {
      newErrors.taxRate = t("Tax rate must be a number with up to 2 decimal places.");
    } else if (!taxRate.trim()) {
      newErrors.taxRate = t("Tax rate is required.");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = {
      taxName,
      taxShortName,
      taxRate,
    };

    try {
      setIsAdding(true);
      await api.post(`/api/tax/add-tax`, formData);

      toast.success(t("Tax created successfully!"));
      handleClose();
      if (fetchtaxs) fetchtaxs();

      if (!closeModal) {
        window.$(`#add-taxs`).modal("hide");
      }
    } catch (error) {
      if (error?.response?.data?.message === "Tax with same Rate already exists") {
        setErrors({ taxRate: "Tax with same Rate already exists" });
      }
      // toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to create tax.");
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
    <div className={modalClass} id="add-taxs" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>

            {/* header */}
            <div className="modal-header">
              <h4>{t("Add Taxs")}</h4>
            </div>

            {/* inputs */}
            <div className="modal-body">

              {/* tax name input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Tax Name")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter Tax Name")}
                  maxLength={50}
                  className="form-control"
                  value={taxName}
                  ref={taxNameRef}
                  onChange={(e) => settaxName(e.target.value)}
                // required
                />
                {errors.taxName && <p className="text-danger">{errors.taxName}</p>}
              </div>

              {/* tax short name input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Tax Short Name")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter Tax Short Name")}
                  maxLength={50}
                  className="form-control"
                  value={taxShortName}
                  onChange={(e) => settaxShortName(e.target.value)}
                // required
                />
                {errors.taxShortName && <p className="text-danger">{errors.taxShortName}</p>}
              </div>

              {/* tax rate input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Tax Rate")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="number"
                  placeholder={t("Enter Tax Rate")}
                  min={0}
                  max={99.99}
                  step="any"
                  className="form-control"
                  value={taxRate}
                  onChange={(e) => settaxRate(e.target.value)}
                // required
                />
                {errors.taxRate && <p className="text-danger">{errors.taxRate}</p>}
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
                    {t("Adding tax...")}
                  </>
                ) : (
                  t("Add tax")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaxAddModal;
