import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

// pages
import api from "../../../pages/config/axiosInstance";

// icons
import { RxCross2 } from "react-icons/rx";

// images
import tick from "../../../assets/images/tick.png";
import cross_button from "../../../assets/images/cross-button-icon.png";

const CreateEditCategoryModel = ({
  closeModal,
  modelAddRef,
  category,
  categoryName,
  onCategoryChange,
  onSubmit,
  errors,
  submitLabel = "Save",
}) => {
  const [title, setTitle] = useState("Edit Category");
  const [showSuccess, setShowSuccess] = useState(false);
  const [subcategories, setSubcategories] = useState([]);

  const [localCategoryName, setLocalCategoryName] = useState("");

  // Prefill input
  useEffect(() => {
    if (category?.categoryName) {
      setLocalCategoryName(category.categoryName);
    }
  }, [category]);

  // 🔹 FETCH SUBCATEGORIES
  useEffect(() => {
    if (category?._id) {
      fetchSubcategories();
    }
  }, [category]);

  const fetchSubcategories = async () => {
    try {
      const res = await api.get(`/api/subcategory/by-category/${category._id}`);
      const activeSubcategories = res.data.filter(sub => sub.isDelete !== true);
      setSubcategories(activeSubcategories);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to load subcategories");
      setSubcategories([]);
    }
  };

  // ❌ REMOVE SUBCATEGORY
  const removeSubCategory = async (id) => {
    if (!id) return;

    try {
      // CORRECT ENDPOINT
      const response = await api.delete(`/api/subcategory/${id}`);

      // Axios throws on non-2xx by default, so if we reach here → success
      setSubcategories((prev) => prev.filter((s) => s._id !== id));
      toast.success("Subcategory removed successfully");

    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to remove subcategory");
    }
  };

  const getTextAndBgColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 6) - hash);
    }

    // Spread values better
    const hue = Math.abs(hash * 37) % 360; // stronger spread
    const saturation = 55 + (hash % 25); // 55–80
    const lightBg = 82 + (hash % 8); // 82–90
    const lightText = 22 + (hash % 10); // 22–32

    return {
      background: `hsl(${hue}, ${saturation}%, ${lightBg}%)`,
      text: `hsl(${hue}, ${saturation}%, ${lightText}%)`,
    };
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.27)",
        backdropFilter: "blur(1px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999999,
      }}
    >
      <div
        className="create-category-modelbox"
        ref={modelAddRef}
        style={{
          backgroundColor: "white",
          width: "800px",
          padding: "50px 40px",
          borderRadius: "8px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "end" }}>
          <button
            onClick={closeModal}
            style={{
              outline: "none",
              border: "none",
              backgroundColor: "transparent",
            }}
          >
            <img src={cross_button} alt="cross_button" />
          </button>
        </div>
        {showSuccess && (
          <div
            className="create-successfully-msg d-flex justify-content-between align-items-center"
            style={{
              backgroundColor: "#EBFFF1",
              border: "1px solid #0D6828",
              color: "#0D6828",
              borderRadius: "8px",
              padding: "10px",
              margin: "15px 0",
            }}
          >
            <label htmlFor="" style={{ fontFamily: "Inter", fontSize: "14px" }}>
              <img src={tick} alt="tick" /> Customer Successfully Created
            </label>
          </div>
        )}
        <h1 style={{ color: "#0E101A", fontSize: "22px", fontFamily: "Inter" }}>
          {title}
        </h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value =
              typeof categoryName === "string" ? categoryName : localCategoryName;
            onSubmit(value);
          }}
        >
          <div className="add-category-form d-flex flex-column gap-3 pt-3 pb-5">
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Create Name <span style={{ color: "red" }}>*</span>
              </label>
              <input
                className="border-hover"
                type="text"
                value={typeof categoryName === "string" ? categoryName : localCategoryName}
                onChange={(e) => {
                  if (typeof categoryName === "string" && typeof onCategoryChange === "function") {
                    onCategoryChange(e);
                  } else {
                    setLocalCategoryName(e.target.value);
                  }
                }}
                required
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
              {errors?.categoryName && (
                <small style={{ color: "red", fontSize: "12px" }}>
                  {errors.categoryName}
                </small>
              )}
            </div>

            <div className="d-flex flex-column gap-2">
              <label
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Sub Category
              </label>

              {subcategories.length === 0 ? (
                <span style={{ fontStyle: "italic" }}>Empty Sub Category</span>
              ) : (
                <div className="d-flex flex-wrap gap-2">
                  {subcategories?.map((sub, i) => {
                    const { background, text } = getTextAndBgColor(sub.name);

                    return (
                      <span
                        key={sub._id || i}
                        style={{
                          backgroundColor: background,
                          color: text,
                          margin: "2px",
                          padding: "4px 8px",
                          borderRadius: "36px",
                          display: "inline-block",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {sub.name}
                        <RxCross2
                          size={12}
                          style={{ cursor: "pointer" }}
                          onClick={() => removeSubCategory(sub._id)}
                        />
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="button-hover button-color"
            style={{
              fontFamily: "Inter",
              border: "none",
              borderRadius: "8px",
              padding: "8px",
              color: "white",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateEditCategoryModel;
