import React, { useState, useEffect } from "react";
import cross_button from "../../../assets/images/cross-button-icon.png";

const CreateEditSubCategoryModel = ({
  closeModal,
  modelAddRef,
 subcategory, 
 onSubmit,
  submitLabel = "Update",
}) => {
  const [title] = useState("Edit Sub Category");
  const [editSubCategoryName, setEditSubCategoryName] = useState("");

  // ✅ Prefill subcategory name (SAME AS CATEGORY LOGIC)
   useEffect(() => {
    if (subcategory?.name) {
      setEditSubCategoryName(subcategory.name);
    }
  }, [subcategory]);

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

        <h1 style={{ color: "#0E101A", fontSize: "22px", fontFamily: "Inter" }}>
          {title}
        </h1>

        <form
          onSubmit={(e) => {
    e.preventDefault();
    onSubmit({
  _id: subcategory._id,
  name: editSubCategoryName,
  categoryId: subcategory.category, // pass current category
});
  }}
        >
          <div className="add-category-form d-flex flex-column gap-3 pt-3 pb-5">
            <div className="d-flex flex-column gap-1 w-100">
              <label
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
                value={editSubCategoryName}
                onChange={(e) => setEditSubCategoryName(e.target.value)}
                required
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

export default CreateEditSubCategoryModel;
