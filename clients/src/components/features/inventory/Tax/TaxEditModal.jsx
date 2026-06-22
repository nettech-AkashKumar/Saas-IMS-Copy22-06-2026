import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../../pages/config/axiosInstance";

const TaxEditModal = ({ selectedtax, ontaxUpdated, cleanUpModal }) => {
  const { t } = useTranslation();
  const [taxName, settaxName] = useState("");
  const [taxShortName, settaxShortName] = useState("");
  const [taxRate, settaxRate] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const taxNameRegex = /^[A-Za-z\s()-]{2,50}$/;
  const taxShortNameRegex = /^[A-Za-z\s()-]{2,50}$/;
  const taxRateRegex = /^(?:\d{1,2})(\.\d{1,2})?$/;

  useEffect(() => {
    if (selectedtax) {
      settaxName(selectedtax.taxName || "");
      settaxShortName(selectedtax.taxShortName || "");
      settaxRate(selectedtax.taxRate ?? "");
      setErrors({});
    }
  }, [selectedtax]);

  const handleClose = () => {
    if (cleanUpModal) cleanUpModal();
    window.$("#edit-taxs").modal("hide");
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!taxNameRegex.test(taxName)) {
      newErrors.taxName = t("tax name must be 2–100 letters only.");
    }
    if (!taxShortNameRegex.test(taxShortName)) {
      newErrors.taxShortName = t("tax short name must be 2–50 letters only.");
    }
    if (!taxRateRegex.test(taxRate)) {
      newErrors.taxRate = t("tax rate must be a number with up to 2 decimal places.");
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
      setIsUpdating(true);
      await api.put(`/api/tax/tax/${selectedtax._id}`, formData);

      toast.success(t("Tax updated successfully!"));
      handleClose();
      if (ontaxUpdated) ontaxUpdated();
    } catch (error) {

      // const errData = error?.response?.data;

      // if (errData?.code === "DUPLICATE_KEY") {
      //   if (errData.field === "taxName") {
      //     setErrors({ taxName: "Tax name already exists." });
      //   } else if (errData.field === "taxRate") {
      //     setErrors({ taxRate: "Tax rate already exists." });
      //   } else {
      //     setErrors({ duplicateError: errData.message });
      //   }

      //   setIsUpdating(false);
      //   return; // ❗ IMPORTANT: stop execution
      // }
      // toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to update tax.");
      // toast.error(errData?.message || "Failed to update tax");
      if (error?.response?.data?.message === "Tax with same Rate already exists") {
        setErrors({ taxRate: "Tax with same Rate already exists" });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modal fade" id="edit-taxs" tabIndex="-1" aria-hidden="true"
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
              <h4>{t("Edit Tax")}</h4>
            </div>

            {/* inputs */}
            <div className="modal-body">

              {/* name input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Tax Name")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter tax Name")}
                  maxLength={50}
                  className="form-control"
                  value={taxName}
                  onChange={(e) => settaxName(e.target.value)}
                // required
                />
                {errors.taxName && <p className="text-danger">{errors.taxName}</p>}
              </div>

              {/* short name input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Tax Short Name")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("Enter tax Short Name")}
                  maxLength={50}
                  className="form-control"
                  value={taxShortName}
                  onChange={(e) => settaxShortName(e.target.value)}
                // required
                />
                {errors.taxShortName && <p className="text-danger">{errors.taxShortName}</p>}
              </div>

              {/* rate input */}
              <div className="mb-3">
                <label className="form-label">
                  {t("Tax Rate")}<span className="text-danger ms-1">*</span>
                </label>
                <input
                  type="number"
                  placeholder={t("Enter tax Rate")}
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
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    {t("Updating tax...")}
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

export default TaxEditModal;
