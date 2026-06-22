import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../../pages/config/axiosInstance";

const AddUnitsModals = ({ fetchUnits, cleanUpModal, closeModal, show }) => {
  const { t } = useTranslation();
  const [unitsName, setUnitsName] = useState("");
  const [shortName, setShortName] = useState("");
  const [errors, setErrors] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const unitsNameRef = useRef(null);

  useEffect(() => {
    if (show && unitsNameRef.current) {
      unitsNameRef.current.focus();
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      setErrors({});
      unitsNameRef.current?.focus();
    }
  }, [show]);

  const unitNameRegex = /^[A-Za-z\s]{2,50}$/;
  const shortNameRegex = /^[A-Za-z0-9().\/\-\s]{1,10}$/;

  const resetForm = () => {
    setUnitsName("");
    setShortName("");
    setErrors({});
  };

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
    if (!unitNameRegex.test(unitsName)) {
      newErrors.unitsName = t("Unit name must be 2–50 letters only.");
    } else if (!unitsName.trim()) {
      newErrors.unitsName = t("Unit name is required.");
    }
    if (!shortNameRegex.test(shortName)) {
      newErrors.shortName = t("Short name must be 1–10 letters only.");
    } else if (!shortName.trim()) {
      newErrors.shortName = t("Short name is required.");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = {
      unitsName,
      shortName,
    };

    try {
      setIsAdding(true);
      await api.post(`/api/unit/units`, formData);

      toast.success(t("Unit created successfully!"));
      handleClose();
      if (fetchUnits) fetchUnits();

      // If not using closeModal (Bootstrap/jQuery mode)
      if (!closeModal) {
        window.$(`#add-units`).modal("hide");
      }
    } catch (error) {
      const errData = error?.response?.data;

      if (errData?.code === "DUPLICATE_KEY") {
        if (errData.field === "unitsName") {
          setErrors({ unitsName: "Unit name already exists." });
        } else if (errData.field === "shortName") {
          setErrors({ shortName: "Short name already exists." });
        } else {
          setErrors({ duplicateError: errData.message });
        }
        return;
      }
      // toast.error(errData?.message || "Failed to create unit.");
    }
    finally {
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
    <div className={modalClass} id="add-units" style={modalStyle}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>

            {/* header */}
            <div className="modal-header">
              <h4>{t("Add Units")}</h4>
              {/* <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                aria-label="Close"
              ></button> */}
            </div>

            {/* input fields */}
            <div className="modal-body">

              {/* unit name input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Unit")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter Unit Name")}
                  maxLength={50}
                  className="form-control"
                  value={unitsName}
                  ref={unitsNameRef}
                  onChange={(e) => setUnitsName(e.target.value)}
                // required
                />
                {errors.unitsName && <p className="text-danger">{errors.unitsName}</p>}
              </div>

              {/* short name input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Short Name")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter Short Name")}
                  maxLength={10}
                  className="form-control"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                // required
                />
                {errors.shortName && <p className="text-danger">{errors.shortName}</p>}
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
                    {t("Adding Unit...")}
                  </>
                ) : (
                  t("Add Unit")
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUnitsModals;
