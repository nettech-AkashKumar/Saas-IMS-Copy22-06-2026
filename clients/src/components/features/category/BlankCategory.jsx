// Empty-Category-Page
import React,{useState} from "react";
import blankCategory_img from "../../../assets/images/categoryblank.png";
import cat_icon from "../../../assets/images/cat-icon.svg";
import CreateCategoryModel from "./CreateCategoryModel";

const BlankCategory = () => {
  const [showCreateCategoryModel, setShowCreateCategoryModel] = useState(false)
  return (
    <div className="d-flex flex-column justify-content-center align-items-center py-5 overflow-y-auto" style={{Height:"calc(100vh - 60px)"}}>
      <div className="text-center">
        <h1
          style={{
            color: "black",
            fontSize: 32,
            fontFamily: "Inter",
            fontWeight: "400",
          }}
        >
          Category
        </h1>
        <p style={{ fontSize:"16px", fontFamily: "Inter", fontWeight: "400", color:"#727681" }}>
          You haven’t created any categories yet—add your first one now.
        </p>
      </div>
      <img className="py-5" src={blankCategory_img} alt="blankCategory_img" />
      <button
       onClick={setShowCreateCategoryModel}
       className="button-hover button-color"
        style={{
          border: "none",
          color: "white",
          fontSize: 16,
          fontFamily: "Inter",
          fontWeight: "500",
          borderRadius: "8px",
          padding:"8px 16px",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          gap:"5px"
        }}
      >
        {" "}
        <img src={cat_icon} alt="cat_icon" />
        Create Category
      </button>
      
    </div>
  );
};

export default BlankCategory;
