import React, { useState } from "react";
import tick from "../../../assets/images/tick.png";
import Category from "../category/Category";
import cross_button from "../../../assets/images/cross-button-icon.png";

const CreateCategoryModel = ({
  closeModal,
  modalId,
  categoryName,
  onCategoryChange,
  subCategoryName,
  onSubCategoryChange,
  onSubmit,
  errors,
  submitLabel = "Save",
}) => {
  const [title, setTitle] = useState("Create Category"); // h1 text control
  const [showSuccess, setShowSuccess] = useState(false); // hide/show success box
  const [showCategory, setShowCategory] = useState(false);

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
        id={modalId}
        className="create-category-modelbox"
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
        <form onSubmit={onSubmit}>
          <div className="add-category-form d-flex gap-3 pt-3 pb-5">
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
                value={categoryName}
                onChange={onCategoryChange}
                placeholder="Enter Name"
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
            <div className="d-flex flex-column gap-1 w-100">
              <label
                htmlFor=""
                style={{
                  color: "black",
                  fontFamily: "Inter",
                  fontSize: "13px",
                }}
              >
                Sub Category
              </label>
              <input
                className="border-hover"
                type="text"
                value={subCategoryName}
                onChange={onSubCategoryChange}
                placeholder="Enter subcategory name"
                style={{
                  border: "1px solid #dfddddff",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
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
              width: "49px",
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
      {showCategory && <Category />}
    </div>
  );
};

export default CreateCategoryModel;
