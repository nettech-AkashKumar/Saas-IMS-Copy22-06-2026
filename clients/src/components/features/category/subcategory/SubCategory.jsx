import React, { useEffect, useState, useRef } from "react";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import { TbEdit, TbTrash } from "react-icons/tb";
import "../../../../styles/category/category.css";
import BASE_URL from "../../../../pages/config/config";
import Select from "react-select";
import { CiCirclePlus } from "react-icons/ci";
import { FiXSquare } from "react-icons/fi";
import { toast } from "react-toastify";
import { sanitizeInput } from "../../../../utils/sanitize";
import axios from "axios";
import { GrFormPrevious } from "react-icons/gr";
import { MdNavigateNext } from "react-icons/md";
import DeleteAlert from "../../../../utils/sweetAlert/DeleteAlert";
import api from "../../../../pages/config/axiosInstance"
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { t } from "i18next";
import { hasPermission } from "../../../../utils/permission/hasPermission";
// IMS-Redisigne
import { BiCategory } from "react-icons/bi";
import { CiSearch } from "react-icons/ci";
import Pagination from "../../../../components/Pagination";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import CreateCategoryModal from "../CreateCategoryModel";
// import CategoryActionsModel from "./CategoryActionsModel";
import { Link } from "react-router-dom";
import cat_actions_icon from "../../../../assets/images/cat-actions-ico.png";
import cat_actions_icon2 from "../../../../assets/images/cat-actions-ico2.png";
import cat_actions_icon3 from "../../../../assets/images/cat-actions-ico3.png";
import BlankCategory from "../BlankCategory";

const SubCategory = () => {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [subCategoryName, setSubCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(true);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const [errors, setErrors] = useState({});
  const nameRegex = /^[A-Za-z]{2,}$/;

  // Edit form state variables to prevent direct mutation
  const [editSubCategoryName, setEditSubCategoryName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSelectedCategory, setEditSelectedCategory] = useState(null);
  const [editStatus, setEditStatus] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // NEW STATE: track selected subcategories for bulk delete
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const fetchCategories = async () => {
    try {
      // const token = localStorage.getItem("token");
      const res = await api.get("/api/category/categories");
      // Map data for react-select
      const options = res.data.map((category) => ({
        value: category._id, // or category.categoryName
        label: category.categoryName,
        code: category.categoryCode,
        original: category,
      }));

      setCategories(options);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryChange = (selectedOption) => {
    setSelectedCategory(selectedOption);
    console.log("Selected category:", selectedOption);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Cleanup old URLs
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setImages(files);

    const previews = files.map((file) => URL.createObjectURL(file));
    setImages(files);
    setImagePreviews(previews);
  };

  // 👉 Handle single checkbox toggle
  const handleCheckboxChange = (id) => {
    setSelectedSubCategories((prev) =>
      prev.includes(id) ? prev.filter((subId) => subId !== id) : [...prev, id]
    );
  };

  // 👉 Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedSubCategories([]);
    } else {
      setSelectedSubCategories(paginatedSubCategories.map((s) => s._id));
    }
    setSelectAll(!selectAll);
  };

  // 👉 Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedSubCategories.length === 0) {
      toast.warn("No subcategories selected!");
      return;
    }

    // if (
    //   !window.confirm("Are you sure you want to delete selected subcategories?")
    // ) {
    //   return;
    // }

    
    const confirmed = await DeleteAlert({});
    if (!confirmed) return;


    try {
      // const token = localStorage.getItem("token");
      await Promise.all(
        selectedSubCategories.map((id) =>
          api.delete(`/api/subcategory/subcategories/${id}`)
        )
      );
      toast.success("Selected subcategories deleted successfully");
      fetchSubcategories();
      setSelectedSubCategories([]);
      setSelectAll(false);
    } catch (error) {
      if (error.res?.status === 401) {
        toast.error("Unauthorized: Please login again");
      } else if (error.res?.status === 403) {
        toast.error(
          "Forbidden: You don't have permission to delete subcategories"
        );
      } else {
        toast.error(
          error.res?.data?.message ||
          "Failed to delete selected subcategories"
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!nameRegex.test(subCategoryName)) {
      newErrors.subCategoryName =
        "Enter a valid subcategory name (letters only, min 2 chars)";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsAdding(true)
      // const token = localStorage.getItem("token");
      if (!selectedCategory || !subCategoryName || !description) {
        toast.error("Please fill in all required fields.");
        return;
      }

      // Sanitize before sending
      const cleanName = sanitizeInput(subCategoryName);
      const cleanDescription = sanitizeInput(description);

      const formData = new FormData();
      formData.append("subCategoryName", cleanName);
      formData.append("description", cleanDescription);
      formData.append("status", status);

      images.forEach((file) => formData.append("images", file));

      const res = await api.post(
        `/api/subcategory/categories/${selectedCategory.value}/subcategories`,
        formData
      );

      toast.success(result.message);

      // ✅ Reset form fields
      setSubCategoryName("");
      setDescription("");
      setStatus(true); // or whatever default
      setImages([]);
      setImagePreviews([]);
      setSelectedCategory(null);

      // Force immediate cleanup before fetching data
      forceCleanupModal();
      closeAddModal();

      // Fetch updated data after modal cleanup
      setTimeout(() => {
        fetchSubcategories();
      }, 100);
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error(error.message || "Failed to add subcategory");
      closeAddModal();
    } finally {
      setIsAdding(false)
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    try {
      // const token = localStorage.getItem("token");
      const res = await api.get("/api/subcategory/subcategories");
      const list = res.data.subcategories || res.data;
      console.log('llsst', list)
      setSubcategories(list);
         setTotal(res.data.total || list.length)
     
    } catch (error) {
      console.error("Failed to load subcategories:", error);
        setTotal(0);
    }
  };

  const filteredSubCategories = subcategories.filter(
    (subcat) =>
      subcat.subCategoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subcat.description &&
        subcat.description.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (subcat.category?.categoryName &&
        subcat.category.categoryName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subcat.category?.categoryCode &&
        subcat.category.categoryCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedSubCategories = filteredSubCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredSubCategories.length / itemsPerPage);

  const handleUpdate = async (e) => {
    e.preventDefault();

    // Prevent multiple simultaneous operations
    if (isUpdating) return;
    setIsUpdating(true);

    let newErrors = {};
    if (!nameRegex.test(editSubCategoryName)) {
      newErrors.subCategoryName =
        "Enter a valid subcategory name (letters only min 2 chars)";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      setIsUpdating(false);
      return;
    }

    try {
      // const token = localStorage.getItem("token");
      const cleanName = sanitizeInput(editSubCategoryName);
      const cleanDescription = sanitizeInput(editDescription);

      const formData = new FormData();
      formData.append("subCategoryName", cleanName);
      formData.append("description", cleanDescription);
      formData.append("status", editStatus);
      formData.append(
        "categoryId",
        editSelectedCategory?.value || editingSubCategory.categoryId
      );

      if (images.length > 0) {
        images.forEach((file) => formData.append("images", file));
      }

      const res = await api.put(
        `/api/subcategory/subcategory/${editingSubCategory._id}`,
        formData
      );
      toast.success("Subcategory updated successfully!");

      // Close modal first
      closeEditModal();

      // Clear editing state after modal is closed
      setEditingSubCategory(null);
      setEditSubCategoryName("");
      setEditDescription("");
      setEditSelectedCategory(null);
      setEditStatus(true);
      setImages([]);
      setImagePreviews([]);
      setErrors({});
      setSelectedCategory(null);
      setIsUpdating(false);
      closeEditModal();

      // Fetch updated data after state is cleared
      await fetchSubcategories();
    } catch (error) {
      toast.error(error.message || "Failed to update subcategory");

      // Close modal first
      closeEditModal();

      // Clear editing state even on error
      setEditingSubCategory(null);
      setEditSubCategoryName("");
      setEditDescription("");
      setEditSelectedCategory(null);
      setEditStatus(true);
      setImages([]);
      setImagePreviews([]);
      setErrors({});
      setSelectedCategory(null);
      setIsUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    // if (!window.confirm("Are you sure you want to delete this subcategory?")) {
    //   return;
    // }
    
        const confirmed = await DeleteAlert({});
        if (!confirmed) return;
    
    try {
      // const token = localStorage.getItem("token");
      const res = await api.delete(
        `/api/subcategory/subcategories/${id}`
      );
      toast.success(res.data.message || "Subcategory deleted successfully");
      fetchSubcategories();
    } catch (error) {
      toast.error(
        error.res?.data?.message || "Failed to delete subcategory"
      );
    }
  };

  // Enhanced modal cleanup functions for Bootstrap 5
  const forceCleanupModal = () => {
    // Remove ALL modal backdrops (in case there are multiple)
    const backdrops = document.querySelectorAll(".modal-backdrop");
    backdrops.forEach((backdrop) => backdrop.remove());

    // Remove modal-open class and reset body styles
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
    document.body.style.paddingRight = "";
    document.body.style.marginRight = "";

    // Remove any Bootstrap 5 specific classes
    document.body.classList.remove("modal-backdrop");
    document.documentElement.style.overflow = "";

    // Force remove any lingering modal states
    const modals = document.querySelectorAll(".modal.show");
    modals.forEach((modal) => {
      modal.classList.remove("show");
      modal.style.display = "none";
      modal.setAttribute("aria-hidden", "true");
      modal.removeAttribute("aria-modal");
    });
  };

  const closeAddModal = () => {
    // Close modal immediately
    const modal = window.$("#add-category");
    modal.modal("hide");

    // Force immediate cleanup
    forceCleanupModal();

    // Additional cleanup after animation
    setTimeout(() => {
      forceCleanupModal();
    }, 100);
  };

  // const closeEditModal = () => {
  //   // Close modal immediately
  //   const modal = window.$("#edit-category");
  //   modal.modal("hide");

  //   window.$("#edit-category").modal("hide");
  //   document.body.classList.remove("modal-open");
  //   document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
  // };
  const closeEditModal = () => {
    const modalElement = document.getElementById("edit-category");
    if (modalElement) {
      modalElement.classList.remove("show");
      modalElement.style.display = "none";
      document.body.classList.remove("modal-open");
      document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
    }
  };


  // Cancel handlers for modals
  const handleCancelAdd = () => {
    // Clear form fields
    setSubCategoryName("");
    setDescription("");
    setStatus(true);
    setImages([]);
    setImagePreviews([]);
    setSelectedCategory(null);
    setErrors({});

    closeAddModal();
  };

  const handleCancelEdit = () => {
    // Clear editing state completely
    setEditingSubCategory(null);
    setEditSubCategoryName("");
    setEditDescription("");
    setEditSelectedCategory(null);
    setEditStatus(true);
    setImages([]);
    setImagePreviews([]);
    setErrors({});

    // Clear any selected category state that might interfere
    setSelectedCategory(null);

    closeEditModal();
  };

  //pdf download------------------------------------------------------------------------------------------------------------------------------------------

  const handlePdf = () => {
    const doc = new jsPDF();
    doc.text("Sub Category", 14, 15);
    const tableColumns = [
      "Category Code",
      "Category",
      "Sub Category",
      "Description",
    ];

    const tableRows = subcategories.map((e) => [
      e.category?.categoryCode,
      e.category?.categoryName,
      e.subCategoryName,
      e.description,
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [155, 155, 155],
        textColor: "white",
      },
      theme: "striped",
    });

    doc.save("sub-categories.pdf");
  };

  //csv upload--------------------------------------------------------------------------------------------------------------------------------------------------

  const handleCSV = () => {
    const tableHeader = [
      "Category Code",
      "Category",
      "Sub Category",
      "Description",
    ];
    const csvRows = [
      tableHeader.join(","),
      ...subcategories.map((e) =>
        [
          e.category?.categoryCode,
          e.category?.categoryName,
          e.subCategoryName,
          e.description,
        ].join(",")
      ),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sub-category.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //excel export--------------------------------------------------------------------------------------------------------------------------------------------------

  const handleExcel = () => {
    // Prepare data for Excel export
    const excelData = subcategories.map((subcategory) => ({
      "Category Code": subcategory.category?.categoryCode || "",
      Category: subcategory.category?.categoryName || "",
      "Sub Category": subcategory.subCategoryName || "",
      Description: subcategory.description || "",
      Status: subcategory.status ? "Active" : "Inactive",
      "Created On": subcategory.createdAt
        ? new Date(subcategory.createdAt).toLocaleDateString()
        : "",
    }));

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better formatting
    const columnWidths = [
      { wch: 15 }, // Category Code
      { wch: 25 }, // Category
      { wch: 25 }, // Sub Category
      { wch: 30 }, // Description
      { wch: 12 }, // Status
      { wch: 15 }, // Created On
    ];
    worksheet["!cols"] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sub Categories");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "sub-categories.xlsx");
  };

 // IMS-Redesigne
    const [showAddCategoryModel, setShowAddCategoryModel] = useState(false);
  const [activeTab, setActiveTab] = useState("category"); // <-- default category
  const [showCategoryActionsModel, setShowCategoryActionsModel] = useState(false);
  const buttonRefs = useRef([]);
  const modelRef = useRef(null); // reference to modal area
    // const [itemsPerPage, setItemsPerPage] = useState(10);
    const [total, setTotal] = useState(0);

  // handle button click
  const handleCreateClick = () => {
    setShowCategoryActionsModel((prev) => !prev); // toggles open/close
  };

  // ✅ close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // close only when:
      const isClickInsideModel =
        modelRef.current && modelRef.current.contains(event.target);

      const isClickInsideButton =
        buttonRefs.current[showCategoryActionsModel] &&
        buttonRefs.current[showCategoryActionsModel].contains(event.target);

      if (!isClickInsideModel && !isClickInsideButton) {
        setShowCategoryActionsModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCategoryActionsModel]);


  const Subcategory = [
    {
      SubCategoryName: "Men’s Jeans",
      ParentCategory: "09",
      NoOfProducts: "212",
    },
    {
      SubCategoryName: "Men’s Jeans",
      ParentCategory: "09",
      NoOfProducts: "212",
    },
    {
      SubCategoryName: "Men’s Jeans",
      ParentCategory: "09",
      NoOfProducts: "212",
    },
    {
      SubCategoryName: "Men’s Jeans",
      ParentCategory: "09",
      NoOfProducts: "212",
    },
    {
      SubCategoryName: "Men’s Jeans",
      ParentCategory: "09",
      NoOfProducts: "212",
    },
    {
      SubCategoryName: "Men’s Jeans",
      ParentCategory: "09",
      NoOfProducts: "212",
    },
  ];


  return (
    <div className="page-wrapper">
       <div className="content">
        {subcategories.length === 0 ? (<>
        <BlankCategory />
        </>) : (<>
        <div className="">
          <div className="category-header d-flex justify-content-between align-items-center">
            <h1
              style={{
                color: "#0E101A",
                fontSize: 22,
                fontFamily: "Inter",
                fontWeight: "500",
              }}
            >
              Category
            </h1>
            <button
              onClick={setShowAddCategoryModel}
              className="button-hover d-flex align-items-center gap-1"
              style={{
                borderRadius: "8px",
                padding: "5px 16px",
                border: "1px solid rgb(31, 127, 255)",
                color: "rgb(31, 127, 255)",
                fontFamily: "Inter",
                backgroundColor: "white",
              }}
            >
              <BiCategory /> Add Category
            </button>
          </div>

          <div
            className="category-datalist-container my-4"
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            <div className="category-datalist-btn-container d-flex justify-content-between align-items-center flex-wrap">
              <div
                className="category-btn-container d-flex justify-content-between align-items-center"
                style={{
                  fontFamily: "Inter",
                  backgroundColor: "#F3F8FB",
                  height: "33",
                  borderRadius: "8px",
                  padding: "2px",
                  fontSize: "14px",
                  gap: "8px",
                }}
              >
                {/* CATEGORY BUTTON */}
                <button
                  onClick={() => setActiveTab("category")}
                  style={{
                    backgroundColor:
                      activeTab === "category" ? "white" : "transparent",
                    color: activeTab === "category" ? "#0E101A" : "#000",
                    boxShadow:
                      activeTab === "category"
                        ? "rgba(149, 157, 165, 0.2) 0px 8px 24px"
                        : "",
                    borderRadius: activeTab === "category" ? "8px" : "0px",
                    border: "none",
                    padding: "6px 12px",
                  }}
                >
                  Category <span style={{ color: "#727681" }}>6</span>
                </button>
                {/* SUB CATEGORY BUTTON */}
                <button
                  onClick={() => setActiveTab("subcategory")}
                  style={{
                    backgroundColor:
                      activeTab === "subcategory" ? "white" : "transparent",
                    color: activeTab === "subcategory" ? "#0E101A" : "#000",
                    boxShadow:
                      activeTab === "subcategory"
                        ? "rgba(149, 157, 165, 0.2) 0px 8px 24px"
                        : "",
                    borderRadius: activeTab === "subcategory" ? "8px" : "0px",
                    border: "none",
                    padding: "6px 12px",
                  }}
                >
                  Sub-Category <span style={{ color: "#727681" }}>126</span>
                </button>
              </div>
              <div
                className="category-list-search-input d-flex align-items-center"
                style={{
                  backgroundColor: "#ffffffff",
                  border: "1px solid #e0dedeff",
                  width: "465px",
                  padding: "5px 16px",
                  borderRadius: "8px",
                }}
              >
                <CiSearch size={20} />
                <input
                  type="text"
                  placeholder={t("Category")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    backgroundColor: "transparent",
                    fontSize: "15px",
                  }}
                />
              </div>
            </div>
            {/* ------- Tables Container ------- */}
            <div
              style={{
                maxHeight: "calc(100vh - 320px)",
                overflowY: "auto",
                overflowX: "auto",
              }}
            >
              {/* Category-data-table */}
              {activeTab === "category" && (
                <table className="w-100 my-3">
                  <thead style={{ backgroundColor: "#F3F8FB", height: "38px" }}>
                    <tr>
                      <th
                        style={{
                          padding: "4px 16px",
                          color: "#727681",
                          fontWeight: "400",
                        }}
                      >
                        Category Name
                      </th>
                      <th
                        style={{
                          padding: "4px 16px",
                          color: "#727681",
                          fontWeight: "400",
                        }}
                      >
                        Sub Category
                      </th>
                      <th
                        style={{
                          padding: "4px 16px",
                          color: "#727681",
                          fontWeight: "400",
                        }}
                      >
                        No. Of Products
                      </th>
                      <th
                        style={{
                          padding: "4px 16px",
                          color: "#727681",
                          fontWeight: "400",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: "Inter", fontSize: "14px",}}>
                    {paginatedSubCategories.length === 0 ? (<>
                    <tr>
                            <td
                              colSpan={4}
                              style={{
                                padding: "8px 16px",
                                verticalAlign: "middle",
                                textAlign: "center",
                                fontSize: 14,
                                color: "#6C748C",
                              }}
                            >
                              No Record Found
                            </td>
                          </tr>
                    </>) : (<>
                    {paginatedSubCategories.map((item, idx) => (
                      <tr key={idx} style={{ height: "46px"  ,borderBottom:"1px solid #EAEAEA" }}>
                        <td style={{ padding: "4px 16px" }}>
                          {item.category?.categoryName}
                        </td>
                        <td style={{ padding: "4px 16px" }}>
                          {item.subCategoryName}
                        </td>
                        <td style={{ padding: "4px 16px" }}>
                          {item.NoOfProducts}
                        </td>
                        <td style={{ padding: "4px 16px" }}>
                          <HiOutlineDotsHorizontal
                            size={28}
                            color="grey"
                            onClick={() =>
                              setShowCategoryActionsModel(
                                showCategoryActionsModel === idx ? false : idx
                              )
                            }
                            ref={(el) => (buttonRefs.current[idx] = el)}
                          />

                          {showCategoryActionsModel === idx && (
                            // Actions Model
                            <div
                              ref={modelRef}
                              style={{
                                backgroundColor: "white",
                                width: "210px",
                                // height:"176px",
                                borderRadius: "16px",
                                // padding: "8px",
                                position: "absolute",
                                zIndex: 1000,
                                right: "130px",
                                //  top:"px",
                                boxShadow:
                                  "rgba(149, 157, 165, 0.2) 0px 8px 24px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <ul
                                style={{
                                  listStyle: "none",
                                  marginBottom: "0",
                                  display: "flex",
                                  justifyContent: "center",
                                  flexDirection: "column",
                                  gap: "10px",
                                  padding: "15px 0px",
                                }}
                              >
                                <li
                                  className="button-action"
                                  style={{
                                    color: "#0E101A",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: " 5px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <img
                                    src={cat_actions_icon}
                                    alt="cat_actions_icon"
                                  />
                                  <Link
                                    style={{
                                      color: "#0E101A",
                                      fontFamily: "Inter",
                                      fontSize: "16px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    Edit
                                  </Link>
                                </li>
                                <li
                                  className="button-action"
                                  style={{
                                    color: "#0E101A",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: " 5px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <img
                                    src={cat_actions_icon2}
                                    alt="cat_actions_icon"
                                  />
                                  <Link
                                    style={{
                                      color: "#0E101A",
                                      fontFamily: "Inter",
                                      fontSize: "16px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    View Details
                                  </Link>
                                </li>
                                <li
                                  className="button-action"
                                  style={{
                                    color: "#0E101A",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: " 5px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <img
                                    src={cat_actions_icon3}
                                    alt="cat_actions_icon"
                                  />
                                  <Link
                                    style={{
                                      color: "#0E101A",
                                      fontFamily: "Inter",
                                      fontSize: "16px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    Delete
                                  </Link>
                                </li>
                                <li
                                  className="button-action"
                                  style={{
                                    color: "#0E101A",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: " 5px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <img
                                    src={cat_actions_icon}
                                    alt="cat_actions_icon"
                                  />
                                  <Link
                                    style={{
                                      color: "#0E101A",
                                      fontFamily: "Inter",
                                      fontSize: "16px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    Add Subcategory
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}</>)}
                    
                  </tbody>
                </table>
              )}
              {/* Sub-category-data-table */}
              {activeTab === "subcategory" && (
                <table className="w-100 my-3">
                  <thead style={{ backgroundColor: "#F3F8FB", height: "38px" }}>
                    <tr>
                      <th
                        style={{
                          padding: "4px 16px",
                          color: "#727681",
                          fontWeight: "400",
                        }}
                      >
                        Sub-Category Name
                      </th>
                      <th
                        style={{
                          padding: "4px 16px",
                          color: "#727681",
                          fontWeight: "400",
                        }}
                      >
                        Parent Category
                      </th>
                      <th
                        style={{
                          padding: "4px 16px",
                          color: "#727681",
                          fontWeight: "400",
                        }}
                      >
                        No. Of Products
                      </th>
                      <th
                        style={{
                          padding: "4px 16px",
                          color: "#727681",
                          fontWeight: "400",
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ fontFamily: "Inter", fontSize: "14px" }}>
                    {Subcategory.map((item, idx) => (
                      <tr key={idx} style={{ height: "46px" }}>
                        <td style={{ padding: "4px 16px" }}>
                          {item.SubCategoryName}
                        </td>
                        <td style={{ padding: "4px 16px" }}>
                          {item.ParentCategory}
                        </td>
                        <td style={{ padding: "4px 16px" }}>
                          {item.NoOfProducts}
                        </td>
                        <td style={{ padding: "4px 16px" }}>
                          <HiOutlineDotsHorizontal
                            size={28}
                            color="grey"
                            onClick={() =>
                              setShowCategoryActionsModel(
                                showCategoryActionsModel === idx ? false : idx
                              )
                            }
                            ref={(el) => (buttonRefs.current[idx] = el)}
                          />
                          {showCategoryActionsModel === idx && (
                            // Actions Model
                            <div
                              ref={modelRef}
                              style={{
                                backgroundColor: "white",
                                width: "210px",
                                // height:"176px",
                                borderRadius: "16px",
                                // padding: "8px",
                                position: "absolute",
                                zIndex: 1000,
                                right: "130px",
                                //  top:"px",
                                boxShadow:
                                  "rgba(149, 157, 165, 0.2) 0px 8px 24px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <ul
                                style={{
                                  listStyle: "none",
                                  marginBottom: "0",
                                  display: "flex",
                                  justifyContent: "center",
                                  flexDirection: "column",
                                  gap: "10px",
                                  padding: "15px 0px",
                                }}
                              >
                                <li
                                  className="button-hover"
                                  style={{
                                    color: "#0E101A",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: " 5px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <img
                                    src={cat_actions_icon}
                                    alt="cat_actions_icon"
                                  />
                                  <Link
                                    style={{
                                      color: "#0E101A",
                                      fontFamily: "Inter",
                                      fontSize: "16px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    Edit
                                  </Link>
                                </li>
                                <li
                                  className="button-hover"
                                  style={{
                                    color: "#0E101A",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: " 5px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <img
                                    src={cat_actions_icon2}
                                    alt="cat_actions_icon"
                                  />
                                  <Link
                                    style={{
                                      color: "#0E101A",
                                      fontFamily: "Inter",
                                      fontSize: "16px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    View Details
                                  </Link>
                                </li>
                                <li
                                  className="button-hover"
                                  style={{
                                    color: "#0E101A",
                                    fontFamily: "Inter",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: " 5px 10px",
                                    borderRadius: "8px",
                                  }}
                                >
                                  <img
                                    src={cat_actions_icon3}
                                    alt="cat_actions_icon"
                                  />
                                  <Link
                                    style={{
                                      color: "#0E101A",
                                      fontFamily: "Inter",
                                      fontSize: "16px",
                                      textDecoration: "none",
                                    }}
                                  >
                                    Delete
                                  </Link>
                                </li>
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="page-redirect-btn">
              <Pagination 
               currentPage={currentPage}
                    total={total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={(p) => setCurrentPage(p)}
                    onItemsPerPageChange={(n) => {
                      setItemsPerPage(n);
                      setCurrentPage(1);
                    }}
              />
            </div>
          </div>
          {showAddCategoryModel && (
            <CreateCategoryModal
              closeModal={() => setShowAddCategoryModel(false)}
            />
          )}
          {/* {showCategoryActionsModel && (
  <div ref={modelRef}>
    <CategoryActionsModel />
  </div>
)} */}
        </div>
        </>)}
        
      </div>
    </div>
  );
};

export default SubCategory;
