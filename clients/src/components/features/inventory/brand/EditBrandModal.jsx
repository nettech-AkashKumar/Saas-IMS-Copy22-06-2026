import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

// pages
import api from "../../../../pages/config/axiosInstance";
import { sanitizeInput } from "../../../../utils/sanitize";

// icons
import { IoCloseCircleOutline } from "react-icons/io5";
import { CiCirclePlus } from "react-icons/ci";

const EditBrandModal = ({ brand, fetchBrands, cleanUpModal, closeModal }) => {
    const { t } = useTranslation();
    const [editBrandName, setEditBrandName] = useState("");
    // const [editStatus, setEditStatus] = useState(true);
    const [editImagePreview, setEditImagePreview] = useState("");
    const [selectedImages, setSelectedImages] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);
    const [errors, setErrors] = useState({});
    const brandNameRegex = /^[A-Za-z0-9\s]{2,50}$/;
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (brand) {
            setEditBrandName(brand.brandName || "");
            // setEditStatus(brand.status === "Active");
            setEditImagePreview(brand.image?.[0]?.url || "");
            setSelectedImages([]);
            setErrors({});
        }
    }, [brand]);

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
        if (validFiles[0]) {
            setEditImagePreview(URL.createObjectURL(validFiles[0]));
        }
        // Reset input value so the same file can be selected again if removed
        if (e.target) {
            e.target.value = null;
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setSelectedImages([]);
        setEditImagePreview("");
    };

    const handleEditBrand = async (e) => {
        e.preventDefault();
        if (isUpdating) return;
        setIsUpdating(true);
        let newErrors = {};
        if (!brandNameRegex.test(editBrandName)) {
            newErrors.editBrandName = t(
                "Brand name must be 2–50 characters (letters, numbers, spaces only)."
            );
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setIsUpdating(false);
            return;
        }

        const formData = new FormData();
        formData.append("brandName", sanitizeInput(editBrandName));
        // formData.append("status", editStatus ? "Active" : "Inactive");

        selectedImages.forEach((file) => {
            formData.append("image", file);
        });

        try {
            await api.put(`/api/brands/editBrands/${brand._id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (fetchBrands) fetchBrands();

            if (closeModal) {
                closeModal();
            }

            if (cleanUpModal) {
                cleanUpModal();
            }

            toast.success(t("Brand updated successfully!"));
        } catch (error) {
            if (error.response?.data?.message === "Brand already exists") {
                setErrors({ editBrandName: t("Brand already exists.") });
            } else {
                toast.error(error.response?.data?.displayMessage || error.response?.data?.message || t("Failed to update brand"));
            }
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="modal show d-block" id="edit-brand" style={{
            backgroundColor: "rgba(0,0,0,0.27)",
            backdropFilter: "blur(1px)",
            zIndex: 1060
        }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">

                    {/* heading */}
                    <div className="modal-header">
                        <div className="page-title">
                            <h4>{t("Edit Brand")}</h4>
                        </div>
                    </div>

                    {/* inputs */}
                    <form onSubmit={handleEditBrand}>
                        <div className="modal-body new-employee-field">

                            {/* image */}
                            <div className="profile-pic-upload mb-3">
                                <div
                                    className="profile-pic brand-pic"
                                    onClick={() => fileInputRef.current.click()}
                                    style={{ cursor: "pointer", position: "relative" }}
                                >
                                    {editImagePreview && (
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
                                        {editImagePreview ? (
                                            <img
                                                src={editImagePreview}
                                                alt="Current"
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
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <div className="mb-0">
                                        <input
                                            type="file"
                                            id="editBrandImageInput"
                                            ref={fileInputRef}
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            style={{ display: "none" }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* brand name */}
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
                                    value={editBrandName}
                                    onChange={(e) => setEditBrandName(e.target.value)}
                                />
                                {errors.editBrandName && (
                                    <p className="text-danger">{errors.editBrandName}</p>
                                )}
                            </div>

                            {/* status */}
                            {/* <div className="mb-0">
                                <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                                    <span className="status-label">{t("Status")}</span>
                                    <input
                                        type="checkbox"
                                        id="user4"
                                        className="check"
                                        checked={editStatus}
                                        onChange={(e) => setEditStatus(e.target.checked)}
                                    />
                                    <label
                                        htmlFor="user4"
                                        className="checktoggle"
                                        title={editStatus ? t("Active") : t("Inactive")}
                                    />
                                </div>
                            </div> */}
                        </div>

                        {/* buttons */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn me-2 btn-secondary"
                                onClick={() => {
                                    if (closeModal) closeModal();
                                    if (cleanUpModal) cleanUpModal();
                                }}
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
                                        {t("Saving Changes...")}
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

export default EditBrandModal;
