import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';

// pages
import BASE_URL from "../../../../pages/config/config";
import api from "../../../../pages/config/axiosInstance"

const EditUnitModal = ({ selectedUnit, onUnitUpdated }) => {
  const { t } = useTranslation();
  const [unitsName, setUnitsName] = useState("");
  const [shortName, setShortName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const unitNameRegex = /^[A-Za-z\s]{2,50}$/;
  const shortNameRegex = /^[A-Za-z0-9().\/\-\s]{1,10}$/;

  const resetFormFromSelectedUnit = useCallback(() => {
    setUnitsName(selectedUnit?.unitsName || "");
    setShortName(selectedUnit?.shortName || "");
    setIsUpdating(false);
    setErrors({});
  }, [selectedUnit]);

  useEffect(() => {
    if (selectedUnit) {
      resetFormFromSelectedUnit();
    }
  }, [selectedUnit, resetFormFromSelectedUnit]);

  useEffect(() => {
    const modalEl = document.getElementById("edit-units");
    if (!modalEl) return;

    const handleHidden = () => {
      resetFormFromSelectedUnit();
    };

    modalEl.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalEl.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [resetFormFromSelectedUnit]);

  const handleCancel = () => {
    resetFormFromSelectedUnit();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUpdating) return; // Prevent concurrent operations

    setIsUpdating(true);

    try {

      let newErrors = {};

      if (!unitsName.trim()) {
        newErrors.unitsName = t("Unit name is required.");
      } else if (!unitNameRegex.test(unitsName)) {
        newErrors.unitsName = t("Unit name must be 2–50 letters only.");
      }

      if (!shortName.trim()) {
        newErrors.shortName = t("Short name is required.");
      } else if (!shortNameRegex.test(shortName)) {
        newErrors.shortName = t("Short name must be 1–10 letters only.");
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsUpdating(false);
        return;
      }

      const updatedData = {
        unitsName,
        shortName,
      };

      await api.put(
        `/api/unit/units/${selectedUnit._id}`,
        updatedData
      );
      // console.log("Update response:", response.data);

      // Close modal first
      window.$("#edit-units").modal("hide");
      cleanUpModal();

      toast.success("Units updated successfully!");

      // Refresh data
      onUnitUpdated();
      setIsUpdating(false);
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

        setIsUpdating(false);
        return; // ❗ IMPORTANT: stop execution
      }

      // fallback
      toast.error(errData?.message || "Failed to update unit");
      setIsUpdating(false);
    }
  };

  const cleanUpModal = () => {
    document.body.classList.remove("modal-open");
    document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
    setTimeout(() => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }, 50);
  };

  return (
    <div className="modal" id="edit-units" style={{
      backgroundColor: "rgba(0,0,0,0.27)",
      backdropFilter: "blur(1px)",
      zIndex: 1060
    }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">

          {/* header */}
          <div className="modal-header">
            <div className="page-title">
              <h4>{t("Edit Units")}</h4>
            </div>
            {/* <button
              type="button"
              className="close bg-danger text-white fs-16"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">×</span>
            </button> */}
          </div>

          <form onSubmit={handleSubmit}>

            {/* inputs */}
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
                  // onChange={(e) => setUnitsName(e.target.value)}
                  onChange={(e) => {
                    setUnitsName(e.target.value);
                    setErrors((prev) => ({ ...prev, unitsName: "" }));
                  }}
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
                  // onChange={(e) => setShortName(e.target.value)}
                  onChange={(e) => {
                    setShortName(e.target.value);
                    setErrors((prev) => ({ ...prev, shortName: "" }));
                  }}
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
                data-bs-dismiss="modal"
                onClick={() => {
                  handleCancel();
                  cleanUpModal();
                }}
              >
                {t("Cancel")}
              </button>
              <button type="submit" className="btn btn-primary" disabled={isUpdating}>
                {isUpdating ? [t('Updating...')] : [t('Save Changes')]}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUnitModal;
