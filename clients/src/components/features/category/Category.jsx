import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { sanitizeInput } from "../../../utils/sanitize";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// pages
import DeleteAlert from "../../../utils/sweetAlert/DeleteAlert";
import api from "../../../pages/config/axiosInstance";
import Pagination from "../../Pagination";
import CreateCategoryModal from "./CreateCategoryModel";
import { hasPermission } from '../../../utils/permission/hasPermission';
import { useAuth } from "../../auth/AuthContext";
import CreateSubCategoryModel from "./CreateSubCategoryModel";
import ConfirmDelete from "../../../components/ConfirmDelete";
import CreateEditCategoryModel from "./CreateEditCategoryModel";
import CreateEditSubCategoryModel from "./CreateEditSubCategoryModel";

// icons
import { TbFileExport } from "react-icons/tb";
import { toast } from "react-toastify";
import { BiCategory } from "react-icons/bi";
import { CiSearch } from "react-icons/ci";
import { HiOutlineDotsHorizontal } from "react-icons/hi";

// images
import blankCategory_img from "../../../assets/images/categoryblank.png";
import cat_icon from "../../../assets/images/cat-icon.svg";
import AddSubCategory from "../../../assets/images/cat-actions-ico.png";
import Edit from "../../../assets/images/edit.png";
import Delete from "../../../assets/images/delete.png";
import { MdSearchOff } from "react-icons/md";

const Category = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingSubCategory, setLoadingSubCategory] = useState(false);
  const nameRegex = /^[A-Za-z']{2,}$/;
  const slugRegex = /^[a-z0-9-]{2,}$/;

  // Edit state
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editCategorySlug, setEditCategorySlug] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // IMS-REDISGNE
  const [showAddCategoryModel, setShowAddCategoryModel] = useState(false);
  const [showAddSubCategoryModel, setShowAddSubCategoryModel] = useState(false);
  const [activeTab, setActiveTab] = useState("category"); // <-- default category
  const [showActionsFor, setShowActionsFor] = useState(null);
  const buttonRefs = useRef({});
  const modelRef = useRef(null); // reference to modal area
  const modelAddRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [products, setProducts] = useState([]);
  const [activeRow, setActiveRow] = useState(null);
  const [openRow, setOpenRow] = useState(null);
  const [showDeleteModel, setShowDeleteModel] = useState(false);
  const [showEditCategoryModel, setShowEditCategoryModel] = useState(false);
  const [showEditSubCategoryModel, setShowEditSubCategoryModel] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  // handle button click
  // const handleCreateClick = () => {
  //   setShowCategoryActionsModel((prev) => !prev); // toggles open/close
  // };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showAddSubCategoryModel &&
        modelAddRef.current &&
        !modelAddRef.current.contains(event.target)
      ) {
        setShowAddSubCategoryModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddSubCategoryModel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showAddSubCategoryModel &&
        modelAddRef.current &&
        !modelAddRef.current.contains(event.target)
      ) {
        setShowAddSubCategoryModel(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAddSubCategoryModel]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showActionsFor) return;

      const isClickInsideModel =
        modelRef.current && modelRef.current.contains(event.target);
      const isClickInsideButton =
        buttonRefs.current[showActionsFor] &&
        buttonRefs.current[showActionsFor].contains(event.target);

      if (!isClickInsideModel && !isClickInsideButton) {
        setShowActionsFor(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showActionsFor]);

  // Real-time validation for categoryName
  const validateCategoryName = (value) => {
    if (!value) {
      return "Category name is required";
    }
    // if (!nameRegex.test(value)) {
    //   return "Category Name Contains Letters Only.";
    // }
    return "";
  };

  // Handle category name change with real-time validation
  const handleCategoryNameChange = (e) => {
    const value = e.target.value;
    if (isEditMode) {
      setEditCategoryName(value);
    } else {
      setCategoryName(value);
    }
    setErrors((prev) => ({
      ...prev,
      categoryName: validateCategoryName(value),
    }));
  };

  const handleEditCategoryNameChange = (e) => {
    const value = e.target.value;
    setEditCategoryName(value);
    setErrors((prev) => ({
      ...prev,
      categoryName: validateCategoryName(value),
    }));
  };

  const handleBulkDelete = async () => {
    const confirmed = await DeleteAlert({});
    if (!confirmed) return;

    try {
      // const token = localStorage.getItem("token");
      await api.post("/api/category/categories/bulk-delete", {
        ids: selectedCategories,
      });
      toast.success("Selected categories deleted");
      setSelectedCategories([]);
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Bulk delete failed. Please try again");
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategory(true);
      const res = await api.get("/api/category/categories");

      // Filter out soft-deleted categories and their subcategories
      const activeCategories = res.data.filter(cat => cat.isDelete !== true);

      // Also filter subcategories inside each category
      const filteredCategories = activeCategories.map(cat => ({
        ...cat,
        subcategories: (cat.subcategories || []).filter(sub => sub.isDelete !== true)
      }));

      setCategories(filteredCategories);
      setLoadingCategory(false);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to load categories");
      setLoadingCategory(false);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  //Fetch Products
  const fetchProducts = React.useCallback(async () => {
    // const token = localStorage.getItem("token");
    const params = {
      page: currentPage,
      limit: itemsPerPage,
    };

    try {
      const res = await api.get(`/api/products`, {
        // headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setProducts(res.data.products);
      setTotal(res.data.total);
      // Initialize all to "general"
      const initialTabs = res.data.products.reduce((acc, product) => {
        acc[product._id] = "general";
        return acc;
      }, {});
    } catch (error) {
      setProducts([]);
      setTotal(0);
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch products");
    }
  }, [selectedCategory, currentPage, itemsPerPage]);
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    newErrors.categoryName = validateCategoryName(categoryName);
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    try {
      setLoadingCategory(true);
      await api.post("/api/category/categories", {
        categoryName: categoryName.trim(),
        subCategoryName: subCategoryName?.trim() || "",
      });

      setLoadingCategory(false);
      toast.success("Category created successfully!");

      setCategoryName("");
      setSubCategoryName("");
      setErrors({});
      fetchCategories(); // Refresh table only on success
      setShowAddCategoryModel(false);

    } catch (error) {
      setLoadingCategory(false); // ✅ Always reset loading state

      const status = error?.response?.status;
      const message = error?.response?.data?.message || error?.response?.data?.displayMessage || error?.message;

      // Handle 409 Conflict - duplicate category
      if (status === 409) {
        setErrors((prev) => ({
          ...prev,
          categoryName: message || "Category already exists",
        }));
        // Don't close modal, don't refresh table, don't clear inputs
        return;
      }

      // Handle other errors
      // toast.error(message || "Error creating category");
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();

    if (!subCategoryName.trim()) {
      setErrors({ subCategoryName: "Subcategory name is required" });
      return;
    }

    setLoadingSubCategory(true);
    if (!selectedCategory?._id) {
      setErrors({ selectedCategory: "Category not selected" });
      return;
    }

    try {
      await api.post(`/api/subcategory/categories/${selectedCategory._id}/subcategories`,
        {
          name: subCategoryName.trim(),
        }
      );

      toast.success("Subcategory added successfully");

      setShowAddSubCategoryModel(false);
      setSelectedCategory(null);
      setSubCategoryName("");
      setErrors({});
      fetchCategories(); // refresh category list
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to add subcategory");
    }
  };

  const handleUpdate = async (updatedName) => {
    const validationError = validateCategoryName(updatedName);
    if (validationError) {
      setErrors({ categoryName: validationError });
      return;
    }
    try {
      setLoadingCategory(true);
      await api.put(`/api/category/categories/${selectedCategory._id}`, // ✅ BACKTICKS
        {
          categoryName: sanitizeInput(updatedName),
        }
      );
      setErrors({});
      setLoadingCategory(false);
      toast.success("Category updated successfully");
      setShowEditCategoryModel(false);
      fetchCategories();
    } catch (error) {
      setLoadingCategory(false);
      if (error?.response?.status === 409) {
        setErrors((prev) => ({
          ...prev,
          categoryName: "Category Name already exists",
        }));
      }
      // toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to update category");
    }
  };

  const filteredCategories = categories.filter((category) =>
    category?.categoryName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // All subcategories with parent info
  const allSubcategories = categories.flatMap((cat) =>
    (cat.subcategories || []).map((sub) => ({
      ...sub,
      parentCategory: cat.categoryName,
      parentId: cat._id,
    }))
  );

  // Filtered subcategories (for search)
  const filteredSubcategories = allSubcategories.filter((sub) =>
    sub.name?.toLowerCase().includes(searchTerm.toLowerCase().trim()) || sub.parentCategory?.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Dynamic pagination based on active tab
  const currentItems =
    activeTab === "category"
      ? filteredCategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
      : filteredSubcategories.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

  const totalItems =
    activeTab === "category"
      ? filteredCategories.length
      : filteredSubcategories.length;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedCategories = filteredCategories.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  const handleDeleteClick = (id, type = "category") => {
    if (type === "subcategory") {
      setSelectedSubcategory(id);
    } else {
      setSelectedCategory(id);
    }
    setShowDeleteModel(true);
  };

  const hanleDelete = (id) => {
    setSelectedCategory(id);
  };

  // CSV, Excel, and PDF export functions (unchanged)
  const handleCSV = () => {
    const tableHeader = [
      "Category Code",
      "Category",
      "Category slug",
      "Created On",
    ];
    const csvRows = [
      tableHeader.join(","),
      ...categories.map((e) => [e.categoryName, e.createdAt].join(",")),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "category.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedRowIds(new Set());
    setSelectAllAcrossPages(false);
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const allCurrentPageIds = currentItems.map(item => item._id);
    const allSelected = allCurrentPageIds.length > 0 && allCurrentPageIds.every(id => selectedRowIds.has(id));
    setAllVisibleSelected(allSelected);
  }, [currentItems, selectedRowIds]);

  const handleToggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedRowIds(new Set());
      setSelectAllAcrossPages(false);
      return;
    }

    const rows = activeTab === "category" ? filteredCategories : filteredSubcategories;
    const allIds = rows.map((r) => r && r._id).filter(Boolean);
    setSelectedRowIds(new Set(allIds));
    setSelectAllAcrossPages(true);
  };

  const handleExcel = async () => {
    try {
      const tableColumns = activeTab === "category"
        ? ["Category Name", "No Of Sub Categories", "Sub Categories List", "No. Of Products", "Created On"]
        : ["Sub Category", "Parent Category", "No Of Products"];

      let rowsSource = [];
      if (selectedRowIds.size === 0) {
        toast.error("Select atleast 1 row to export data");
        return;
      }

      rowsSource = (activeTab === "category" ? filteredCategories : filteredSubcategories).filter((item) =>
        selectedRowIds.has(item._id)
      );

      if (!rowsSource || rowsSource.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const tableRows = activeTab === "category"
        ? rowsSource.map((e) => [
          e.categoryName,
          e.subcategories?.length || 0,
          e.subcategories?.map((s) => s.name).join(", ") || "",
          products?.filter((p) => {
            const productCatId = typeof p.category === "string" ? p.category : p.category?._id;
            return productCatId === e._id && p.isDelete !== true;
          }).length || 0,
          e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "-",
        ])
        : rowsSource.map((e) => [
          e.name,
          e.parentCategory || "-",
          products?.filter((p) => {
            const productSubId =
              typeof p.subcategory === "string"
                ? p.subcategory
                : p.subcategory?._id;
            const productSubIdAlt =
              typeof p.subCategory === "string"
                ? p.subCategory
                : p.subCategory?._id;
            return (
              (productSubId || productSubIdAlt) === e._id && p.isDelete !== true
            );
          }).length || 0,
        ]);

      const workbook = new ExcelJS.Workbook();
      const sheetName = activeTab === "category" ? "Categories" : "Subcategories";
      const worksheet = workbook.addWorksheet(sheetName);

      const headerRow = worksheet.addRow(tableColumns);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "99c5ff" },
        };
        cell.border = {
          top: { style: "thin", color: { argb: "338bff" } },
          left: { style: "thin", color: { argb: "338bff" } },
          bottom: { style: "thin", color: { argb: "338bff" } },
          right: { style: "thin", color: { argb: "338bff" } },
        };
      });

      const columnWidths = activeTab === "category"
        ? [25, 25, 40, 25, 20]
        : [25, 25, 15];
      columnWidths.forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      worksheet.getColumn(2).alignment = { horizontal: "center", vertical: "middle" };
      if (activeTab === "category") {
        worksheet.getColumn(4).alignment = { horizontal: "center", vertical: "middle" };
      } else {
        worksheet.getColumn(3).alignment = { horizontal: "center", vertical: "middle" };
      }

      tableRows.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        activeTab === "category" ? "categories.xlsx" : "subcategories.xlsx",
      );

      toast.success(`${activeTab === "category" ? "Categories" : "Subcategories"} Excel file downloaded successfully!`);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const fileInputRef = React.useRef();

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx")) {
      toast.error("Please select a valid Excel file");
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const requiredFields = [
          "Category Code",
          "Category",
          "Category slug",
          "Created On",
        ];
        const valid = results.data.every((row) =>
          requiredFields.every((f) => f in row && row[f] !== "")
        );
        if (!valid) {
          toast.error("File structure does not match the required schema.");
          return;
        }
        try {
          const token = localStorage.getItem("token");
          await api.post("/api/category/categories", results.data);
          toast.success("Imported successfully!");
          fetchCategories();
        } catch (error) {
          toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error while importing categories");
        }
      },
    });
  };

  const handlePdf = () => {
    const doc = new jsPDF();
    doc.text("Category", 14, 15);
    const tableColumns = [
      "Category Name",
      "Sub Categories",
      "Number of Products",
    ];
    const tableRows = categories.map((e) => [
      e.categoryName,
      e.subcategories?.map((s) => s.name).join(", ") || 0,
      // e.products.filter((p) => p.category === e.categoryName).length || 0,
      e.products?.filter((p) => {
        const productCatId =
          typeof p.category === "string"
            ? p.category
            : p.category?._id;
        return productCatId === e._id && p.isDelete !== true;
      }).length || 0,
    ]);
    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [155, 155, 155], textColor: "white" },
      theme: "striped",
    });
    doc.save("categories-subcategories.pdf");
  };

  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
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
  const totalSubCategories =
    categories?.reduce(
      (total, cat) => total + (cat.subcategories?.length || 0),
      0
    ) || 0;

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setEditCategoryName(category?.categoryName || "");
    setErrors({});
    setShowEditCategoryModel(true);
  };

  const handleEditSubCategory = async ({ _id, name, categoryId }) => {
    if (!_id) return toast.error("Subcategory not selected");

    try {
      setLoadingSubCategory(true);
      await api.put(`/api/subcategory/${_id}`, { name, categoryId });
      setLoadingSubCategory(false);
      toast.success("Subcategory updated successfully");
      setShowEditSubCategoryModel(false);
      setSelectedSubcategory(null);
      fetchCategories();
    } catch (error) {
      setLoadingSubCategory(false);
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to update subcategory");
    }
  };

  return (
    <div className="p-4">
      {categories.length === 0 ? (
        <>
          <div
            className="d-flex flex-column justify-content-center align-items-center py-5 overflow-y-auto"
            style={{ Height: "calc(100vh - 60px)" }}
          >
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
              <p
                style={{
                  fontSize: "16px",
                  fontFamily: "Inter",
                  fontWeight: "400",
                  color: "#727681",
                }}
              >
                You haven’t created any categories yet—add your first one now.
              </p>
            </div>
            <img
              className="py-5"
              src={blankCategory_img}
              alt="blankCategory_img"
            />
            <button
              onClick={() => setShowAddCategoryModel(true)}
              className="button-hover button-color"
              style={{
                border: "none",
                // backgroundColor: "rgb(31, 127, 255)",
                color: "white",
                fontSize: 16,
                fontFamily: "Inter",
                fontWeight: "500",
                borderRadius: "8px",
                padding: "8px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
              }}
            >
              {" "}
              <img src={cat_icon} alt="cat_icon" />
              Create Category
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="">

            {/* header */}
            <div style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0px 0px 16px 0px", // Optional: padding for container
            }}>
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
              {hasPermission(user, "Category", "create") && (
                <button
                  onClick={() => setShowAddCategoryModel(true)}
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
              )}
            </div>

            {/* body table */}
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}
            >
              {/* tab + search + export */}
              <div className="category-datalist-btn-container d-flex justify-content-between align-items-center flex-wrap">

                {/* tab */}
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
                    Category{" "}
                    <span style={{ color: "#727681" }}>
                      {categories?.length || 0}
                    </span>
                  </button>
                  {/* SUB CATEGORY BUTTON */}
                  <button
                    onClick={() => {
                      setActiveTab("subcategory");
                      setOpenRow(null);
                    }}
                    style={{
                      backgroundColor:
                        activeTab === "subcategory" ? "white" : "transparent",
                      color: activeTab === "subcategory" ? "#0E101A" : "#000",
                      boxShadow:
                        activeTab === "subcategory"
                          ? "rgba(149, 157, 165, 0.2) 0px 8px 24px"
                          : "",
                      borderRadius:
                        activeTab === "subcategory" ? "8px" : "0px",
                      border: "none",
                      padding: "6px 12px",
                    }}
                  >
                    Sub-Category{" "}
                    <span style={{ color: "#727681" }}>
                      {totalSubCategories}
                    </span>
                  </button>
                </div>

                {/* search */}
                <div
                  className=""
                  style={{
                    display: "flex",
                    justifyContent: "end",
                    gap: "24px",
                    height: "33px",
                    width: "50%",
                  }}
                >
                  <div
                    className=""
                    style={{
                      width: "50%",
                      position: "relative",
                      padding: "8px 16px 8px 20px",
                      display: "flex",
                      borderRadius: 8,
                      alignItems: "center",
                      background: "#FCFCFC",
                      border: "1px solid #EAEAEA",
                      gap: "5px",
                      color: "rgba(19.75, 25.29, 61.30, 0.40)",
                    }}
                  >
                    <CiSearch className="fs-4" />
                    <input
                      type="search"
                      placeholder={activeTab === "category" ? "Search by Category..." : "Search by Category or Sub-Category..."}
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // ✅ IMPORTANT
                      }}
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        background: "#FCFCFC",
                        color: "rgba(19.75, 25.29, 61.30, 0.40)",
                      }}
                    />
                  </div>
                  {hasPermission(user, "Category", "export") && (
                    <button
                      title="Export"
                      onClick={handleExcel}
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 9,
                        padding: "8px 16px",
                        background: "#FCFCFC",
                        borderRadius: 8,
                        outline: "1px solid #EAEAEA",
                        outlineOffset: "-1px",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "Inter, sans-serif",
                        fontSize: 14,
                        fontWeight: 400,
                        color: "#0E101A",
                        height: "33px",
                      }}
                    >
                      <TbFileExport className="fs-5 text-secondary" />
                      Export
                    </button>
                  )}
                </div>
              </div>

              {/* ------- Tables Container ------- */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}
              >
                {/* Category-data-table */}
                {activeTab === "category" && (
                  <table
                    className="table-responsive"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      overflowX: "auto",
                    }}>
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        height: "38px",
                      }}
                    >
                      <tr style={{ background: "#F3F8FB" }}>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <label className="checkboxs">
                              <input
                                type="checkbox"
                                style={{ width: 18, height: 18 }}
                                checked={selectAllAcrossPages || allVisibleSelected}
                                onChange={(e) => {
                                  handleToggleSelectAll(e.target.checked);
                                }}
                              />
                              <span className="checkmarks" />
                            </label>
                            Category Name
                          </div>
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
                    <tbody style={{ fontFamily: "Inter", fontSize: "14px" }}>
                      {loadingCategory ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedCategories.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: 0 }}>
                            <div
                              style={{
                                marginTop: "20px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: 'rgba(255, 68, 31, 1)'
                              }}
                            >
                              No Category Found
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          {paginatedCategories.map((item, idx) => (
                            <React.Fragment key={idx}>
                              <tr
                                style={{
                                  height: "46px",
                                  borderBottom:
                                    "1px solid rgba(233, 233, 241, 1)",
                                }}
                                className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                              >
                                <td
                                  style={{
                                    padding: "4px 16px",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                    }}
                                  >
                                    <label className="checkboxs">
                                      <input
                                        type="checkbox"
                                        style={{ width: 18, height: 18 }}
                                        checked={selectedRowIds.has(item._id)}
                                        onChange={(e) => {
                                          const next = new Set(selectedRowIds);
                                          if (e.target.checked) {
                                            if (item._id) next.add(item._id);
                                          } else {
                                            if (item._id) next.delete(item._id);
                                            if (selectAllAcrossPages) setSelectAllAcrossPages(false);
                                          }
                                          setSelectedRowIds(next);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className="checkmarks" />
                                    </label>
                                    <span
                                      onClick={() => toggleRow(idx)}
                                      style={{ cursor: "pointer", color: "#0E101A" }}
                                    >
                                      {item.categoryName}
                                    </span>
                                  </div>
                                </td>
                                <td
                                  onClick={() => toggleRow(idx)}
                                  style={{
                                    padding: "4px 16px",
                                    cursor: "pointer",
                                    color: "#0E101A",
                                  }}
                                >
                                  {item.subcategories?.length}
                                </td>
                                <td
                                  onClick={() => toggleRow(idx)}
                                  style={{
                                    padding: "4px 16px",
                                    cursor: "pointer",
                                    color: "#0E101A",
                                  }}
                                >
                                  {
                                    products?.filter((p) => {
                                      const productCatId =
                                        typeof p.category === "string"
                                          ? p.category
                                          : p.category?._id;
                                      return productCatId === item._id && p.isDelete !== true;
                                    }).length
                                  }
                                </td>
                                <td style={{ padding: "4px 16px", textAlign: "center", position: "relative" }}>
                                  <button
                                    onClick={(e) => {
                                      const rect =
                                        e.currentTarget.getBoundingClientRect();
                                      setShowActionsFor(
                                        showActionsFor === item._id
                                          ? null
                                          : item._id
                                      )
                                      const dropdownHeight = 260; // your menu height
                                      const spaceBelow =
                                        window.innerHeight - rect.bottom;
                                      const spaceAbove = rect.top;

                                      // decide direction
                                      if (
                                        spaceBelow < dropdownHeight &&
                                        spaceAbove > dropdownHeight
                                      ) {
                                        setOpenUpwards(true);
                                        setDropdownPos({
                                          x: rect.left,
                                          y: rect.top - 6, // position above button
                                        });
                                      } else {
                                        setOpenUpwards(false);
                                        setDropdownPos({
                                          x: rect.left,
                                          y: rect.bottom + 6, // position below button
                                        });
                                      }
                                    }}
                                    className="btn"
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      padding: 4,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      position: "relative",
                                    }}
                                    aria-label="actions"
                                    ref={(el) =>
                                      (buttonRefs.current[item._id] = el)
                                    }
                                  >
                                    <HiOutlineDotsHorizontal size={28} color="grey" />
                                  </button>

                                  {showActionsFor === item._id && (
                                    // Actions Model
                                    <div
                                      style={{
                                        position: "fixed",
                                        top: openUpwards
                                          ? dropdownPos.y - 145
                                          : dropdownPos.y,
                                        left: dropdownPos.x - 80,
                                        zIndex: 999999,
                                      }}
                                    >
                                      <div
                                        ref={modelRef}
                                        style={{
                                          background: "white",
                                          padding: 8,
                                          borderRadius: 12,
                                          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                          minWidth: 180,
                                          height: "auto", // height must match dropdownHeight above
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: 4,
                                          cursor: "pointer",
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
                                          }}
                                        >
                                          {hasPermission(user, "Category", "update") && (
                                            <li
                                              onClick={() => {
                                                openEditModal(item);
                                                setShowActionsFor(null);
                                              }}
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
                                                cursor: "pointer",
                                              }}
                                            >
                                              <img
                                                src={Edit}
                                                alt="cat_actions_icon"
                                              />
                                              <label
                                                style={{
                                                  color: "#0E101A",
                                                  fontFamily: "Inter",
                                                  fontSize: "16px",
                                                  textDecoration: "none",
                                                  cursor: "pointer",
                                                }}
                                              >
                                                Edit
                                              </label>
                                            </li>
                                          )}
                                          {hasPermission(user, "Category", "delete") && (
                                            <li
                                              onClick={() => {
                                                handleDeleteClick(
                                                  item._id,
                                                  "category"
                                                );
                                                setShowActionsFor(null);
                                              }}
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
                                                cursor: "pointer",
                                              }}
                                            >
                                              <img
                                                src={Delete}
                                                alt="cat_actions_icon"
                                              />
                                              <label
                                                style={{
                                                  color: "#0E101A",
                                                  fontFamily: "Inter",
                                                  fontSize: "16px",
                                                  textDecoration: "none",
                                                  cursor: "pointer",
                                                }}
                                              >
                                                Delete
                                              </label>
                                            </li>
                                          )}
                                          {hasPermission(user, "Category", "create") && (
                                            <li
                                              onClick={() => {
                                                setSelectedCategory(item);
                                                setSubCategoryName("");
                                                setShowAddSubCategoryModel(true);
                                                setShowActionsFor(null);
                                              }}
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
                                                cursor: "pointer",
                                              }}
                                            >
                                              <img
                                                src={AddSubCategory}
                                                alt="cat_actions_icon"
                                              />
                                              <label
                                                style={{
                                                  color: "#0E101A",
                                                  fontFamily: "Inter",
                                                  fontSize: "16px",
                                                  textDecoration: "none",
                                                  cursor: "pointer",
                                                }}
                                              >
                                                Add Subcategory
                                              </label>
                                            </li>
                                          )}
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </td>
                              </tr>
                              {/* COLLAPSE ROW EXACT SAME DESIGN KE NICHE */}
                              <tr>
                                <td colSpan="7" style={{ padding: "0" }}>
                                  <div
                                    style={{
                                      maxHeight:
                                        openRow === idx ? "500px" : "0px",
                                      overflow: "hidden",
                                      transition: "max-height 0.4s ease",
                                      backgroundColor: "#E5F0FF",
                                    }}
                                  >
                                    {/* Collapse Content */}
                                    <div
                                      style={{
                                        padding: "16px",
                                        display: "flex",
                                        gap: "80px",
                                      }}
                                    >
                                      <label htmlFor="">Sub Category:-</label>
                                      <span>
                                        {item.subcategories.length === 0 ? (
                                          <>
                                            <span
                                              style={{ fontStyle: "italic" }}
                                            >
                                              Empty Sub Category
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            {item.subcategories?.map(
                                              (sub, i) => {
                                                const { background, text } =
                                                  getTextAndBgColor(sub.name);

                                                return (
                                                  <span
                                                    key={sub._id || i}
                                                    style={{
                                                      backgroundColor:
                                                        background,
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
                                                  </span>
                                                );
                                              }
                                            )}
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>
                )}

                {/* Sub-category-data-table */}
                {activeTab === "subcategory" && (
                  <table
                    className="table-responsive"
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      overflowX: "auto",
                    }}>
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                        height: "38px",
                      }}
                    >
                      <tr style={{ background: "#F3F8FB" }}>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                            }}
                          >
                            <label className="checkboxs">
                              <input
                                type="checkbox"
                                style={{ width: 18, height: 18 }}
                                checked={selectAllAcrossPages || allVisibleSelected}
                                onChange={(e) => {
                                  handleToggleSelectAll(e.target.checked);
                                }}
                              />
                              <span className="checkmarks" />
                            </label>
                            Sub-Category Name
                          </div>
                        </th>
                        <th
                          style={{
                            padding: "4px 16px",
                            color: "#727681",
                            fontWeight: "400",
                          }}
                        >
                          Category
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
                      {loadingSubCategory ? (
                        <tr>
                          <td colSpan="6" className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : currentItems.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: 0 }}>
                            <div
                              style={{
                                marginTop: "20px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: 'rgba(255, 68, 31, 1)'
                              }}
                            >
                              <MdSearchOff fontSize="large" />
                              No Sub category Found
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentItems.map((sub, idx) => (
                          <tr
                            key={sub._id}
                            style={{
                              height: "46px",
                              borderBottom: "1px solid rgb(233, 233, 241)",
                            }}
                            className={`table-hover ${activeRow === idx ? "active-row" : ""}`}
                          >
                            <td style={{ padding: "4px 16px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <label className="checkboxs">
                                  <input
                                    type="checkbox"
                                    style={{ width: 18, height: 18 }}
                                    checked={selectedRowIds.has(sub._id)}
                                    onChange={(e) => {
                                      const next = new Set(selectedRowIds);
                                      if (e.target.checked) {
                                        if (sub._id) next.add(sub._id);
                                      } else {
                                        if (sub._id) next.delete(sub._id);
                                        if (selectAllAcrossPages) setSelectAllAcrossPages(false);
                                      }
                                      setSelectedRowIds(next);
                                    }}
                                  />
                                  <span className="checkmarks" />
                                </label>
                                <span style={{ color: "#0E101A" }}>
                                  {sub.name}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: "4px 16px" }}>
                              <span style={{ color: "#0E101A" }}>
                                {sub.parentCategory}
                              </span>
                            </td>
                            <td style={{ padding: "4px 16px" }}>
                              <span style={{ color: "#0E101A" }}>
                                {
                                  products?.filter((p) => {
                                    const productSubId =
                                      typeof p.subcategory === "string"
                                        ? p.subcategory
                                        : p.subcategory?._id;
                                    return (
                                      productSubId === sub._id &&
                                      p.isDelete !== true
                                    );
                                  }).length
                                }
                              </span>
                            </td>
                            <td style={{ padding: "4px 16px" }}>
                              <button
                                onClick={(e) => {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  setShowActionsFor(
                                    showActionsFor === sub._id
                                      ? null
                                      : sub._id
                                  )
                                  const dropdownHeight = 260; // your menu height
                                  const spaceBelow =
                                    window.innerHeight - rect.bottom;
                                  const spaceAbove = rect.top;

                                  // decide direction
                                  if (
                                    spaceBelow < dropdownHeight &&
                                    spaceAbove > dropdownHeight
                                  ) {
                                    setOpenUpwards(true);
                                    setDropdownPos({
                                      x: rect.left,
                                      y: rect.top - 6, // position above button
                                    });
                                  } else {
                                    setOpenUpwards(false);
                                    setDropdownPos({
                                      x: rect.left,
                                      y: rect.bottom + 6, // position below button
                                    });
                                  }
                                }}
                                ref={(el) =>
                                  (buttonRefs.current[sub._id] = el)
                                }
                                className="btn"
                                style={{
                                  border: "none",
                                  background: "transparent",
                                  padding: 4,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  position: "relative",
                                }}
                                aria-label="actions"
                              >
                                <HiOutlineDotsHorizontal size={28} color="grey" />
                              </button>
                              {showActionsFor === sub._id && (
                                <div
                                  style={{
                                    position: "fixed",
                                    top: openUpwards
                                      ? dropdownPos.y - 100
                                      : dropdownPos.y,
                                    left: dropdownPos.x - 80,
                                    zIndex: 999999,
                                  }}
                                >
                                  <div
                                    ref={modelRef}
                                    style={{
                                      background: "white",
                                      padding: 8,
                                      borderRadius: 12,
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                      minWidth: 180,
                                      height: "auto", // height must match dropdownHeight above
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 4,
                                      cursor: "pointer",
                                    }}
                                  >
                                    <ul
                                      style={{
                                        listStyle: "none",
                                        marginBottom: "0",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                      }}
                                    >
                                      <li
                                        onClick={() => {
                                          setSelectedSubcategory(sub);
                                          setShowEditSubCategoryModel(true);
                                          setShowActionsFor(null);
                                        }}
                                        className="button-action"
                                        style={{
                                          color: "#0E101A",
                                          fontFamily: "Inter",
                                          fontSize: "16px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          padding: "5px 10px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <img
                                          src={Edit}
                                          alt="edit"
                                        />
                                        <label
                                          style={{
                                            color: "#0E101A",
                                            fontFamily: "Inter",
                                            fontSize: "16px",
                                          }}
                                        >
                                          Edit
                                        </label>
                                      </li>
                                      {/* <li
                                        className="button-action"
                                        style={{
                                          color: "#0E101A",
                                          fontFamily: "Inter",
                                          fontSize: "16px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          padding: "5px 10px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <img
                                          src={cat_actions_icon2}
                                          alt="view"
                                        />
                                        <label
                                          style={{
                                            color: "#0E101A",
                                            fontFamily: "Inter",
                                            fontSize: "16px",
                                          }}
                                        >
                                          View Details
                                        </label>
                                      </li> */}
                                      <li
                                        onClick={() => {
                                          handleDeleteClick(
                                            sub._id,
                                            "subcategory"
                                          );
                                          setShowActionsFor(null);
                                        }}
                                        className="button-action"
                                        style={{
                                          color: "#0E101A",
                                          fontFamily: "Inter",
                                          fontSize: "16px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          padding: "5px 10px",
                                          borderRadius: "8px",
                                        }}
                                      >
                                        <img
                                          src={Delete}
                                          alt="delete"
                                        />
                                        <label
                                          style={{
                                            color: "#0E101A",
                                            fontFamily: "Inter",
                                            fontSize: "16px",
                                          }}
                                        >
                                          Delete
                                        </label>
                                      </li>
                                    </ul>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentPage}
                  total={totalItems} // Dynamic total based on tab
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => {
                    setCurrentPage(page);
                  }}
                  onItemsPerPageChange={(count) => {
                    setItemsPerPage(count);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {showAddCategoryModel && (
        <CreateCategoryModal
          closeModal={() => {
            setShowAddCategoryModel(false);
            setCategoryName("");
            setSubCategoryName("");
            setErrors({});
            setIsEditMode(false);
          }}
          modalId="categoryModal"
          title={isEditMode ? [t("Edit Category")] : [t("Add Category")]}
          isEditMode={isEditMode}
          categoryName={isEditMode ? editCategoryName : categoryName}
          subCategoryName={subCategoryName} // ✅ ADD THIS
          onSubCategoryChange={(e) => setSubCategoryName(e.target.value)}
          onCategoryChange={handleCategoryNameChange}
          onSubmit={handleSubmit}
          submitLabel={isEditMode ? [t("Update")] : [t("Save")]}
          errors={errors}
        />
      )}

      {showAddSubCategoryModel && (
        <CreateSubCategoryModel
          modelAddRef={modelAddRef}
          errors={errors}
          closeModal={() => {
            setShowAddSubCategoryModel(false);
            setSubCategoryName("");
            setSelectedCategory(null);
            setErrors({});
          }}
          categoryName={selectedCategory?.categoryName} // ✅
          subCategoryName={subCategoryName} // ✅
          onSubCategoryChange={(e) => {
            setSubCategoryName(e.target.value);

            setErrors((prev) => ({
              ...prev,
              subCategoryName: "",
            }));
          }}
          onSubmit={handleAddSubCategory}
        />
      )}

      {showDeleteModel && (
        <ConfirmDelete
          isOpen={showDeleteModel}
          errors={errors}
          onCancel={() => {
            setShowDeleteModel(false);
            setSelectedCategory(null);
            setSelectedSubcategory(null);
          }}
          onConfirm={async () => {
            try {
              if (selectedSubcategory) {
                // Delete subcategory
                await api.delete(`/api/subcategory/${selectedSubcategory}`);
                toast.success("Subcategory deleted successfully!");
              } else if (selectedCategory) {
                // Delete category
                await api.delete(
                  `/api/category/categories/${selectedCategory}`
                );
                toast.success("Category deleted successfully!");
              }
              fetchCategories();
            } catch (error) {
              console.error("Delete error:", error);
              toast.error("Failed to delete item");
            } finally {
              setShowDeleteModel(false);
              setSelectedCategory(null);
              setSelectedSubcategory(null);
            }
          }}
          title="Confirm Deletion"
          message={
            selectedSubcategory
              ? "Are you sure you want to delete this subcategory? This action cannot be undone."
              : "Are you sure you want to delete this category? All associated subcategories will also be affected."
          }
        />
      )}

      {showEditCategoryModel && (
        <CreateEditCategoryModel
          closeModal={() => setShowEditCategoryModel(false)}
          category={selectedCategory} // 👈 pass full object
          categoryName={editCategoryName}
          onCategoryChange={handleEditCategoryNameChange}
          errors={errors}
          onSubmit={handleUpdate}
          submitLabel="Update"
        />
      )}

      {showEditSubCategoryModel && (
        <CreateEditSubCategoryModel
          closeModal={() => setShowEditSubCategoryModel(false)}
          subcategory={selectedSubcategory}
          onSubmit={handleEditSubCategory}
          errors={errors}
        />
      )}
    </div>

  );
};

export default Category;