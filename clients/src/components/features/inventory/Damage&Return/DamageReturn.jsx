import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// pages
import api from "../../../../pages/config/axiosInstance";
import Pagination from "../../../Pagination";
import DeleteModal from "../../../ConfirmDelete";
import CreateDamageModal from "./CreateDamageModal";
import EditDamageModal from "./EditDamageModal";
import ViewDamageModal from "./ViewDamageModal";
import EmptyDamageReturn from "./EmptyDamageReturn";
import { hasPermission } from "../../../../utils/permission/hasPermission";
import { useAuth } from "../../../auth/AuthContext";

// icons
import { TbEdit, TbTrash, TbFileExport } from "react-icons/tb";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FiEdit } from "react-icons/fi";
import { RiListView, RiDeleteBinLine } from "react-icons/ri";
import { HiOutlineDocumentDuplicate } from "react-icons/hi";
import { RiInboxArchiveFill, RiInboxUnarchiveFill } from "react-icons/ri";
import { LuReceiptText } from "react-icons/lu";
import { LuPackageSearch } from "react-icons/lu";
import { LuRefreshCcwDot } from "react-icons/lu";
import { MdOutlineKeyboardArrowRight, MdOutlineKeyboardArrowLeft, MdOutlineKeyboardDoubleArrowRight, MdOutlineKeyboardDoubleArrowLeft, } from "react-icons/md";

// images
import edit from '../../../../assets/images/edit.png'
import deletebtn from '../../../../assets/images/delete.png'
import ProductDefaultImage from '../../../../assets/images/product-default.png'

function DamageReturn() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [viewOptions, setViewOptions] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [showDamageReportModel, setDamageReportModel] = useState(false);
  const [rdata, setRData] = useState([]);
  const [hasAnyData, setHasAnyData] = useState(null); // null = loading
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [viewDamageReportModel, setViewDamageReportModel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);  // For pre-fill
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [editDamageReportModel, setEditDamageReportModel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [selectedDamageIds, setSelectedDamageIds] = useState([]);

  const selectedRowsCacheRef = useRef(new Map());
  const isFilterActive = searchQuery.trim() !== "" || selectedCategory !== "";

  useEffect(() => {
    const cache = selectedRowsCacheRef.current;

    rdata.forEach((r) => {
      if (r && r._id) cache.set(r._id, r);
    });
  }, [rdata]);

  const handleDamageReportModel = () => {
    setDamageReportModel(true);
  };

  const handleDamageReportViewModel = (product) => {
    setSelectedProduct(product);
    setViewDamageReportModel(true);
  };

  const handleEditDamageReportModel = (product) => {
    setSelectedProduct(product);
    setEditDamageReportModel(true);
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/damage-return/categories");
      setCategories(res.data);
      if (selectedCategory && !res.data?.some((c) => c?._id === selectedCategory)) {
        setSelectedCategory("");
        setCurrentPage(1);
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch categories");
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCheckboxChange = (id, row) => {
    if (!id) return;
    if (row && row._id) selectedRowsCacheRef.current.set(row._id, row);
    setSelectedDamageIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;

    const allIds = rdata.map((r) => r && r._id).filter(Boolean);

    if (allIds.length === 0) return;

    if (checked) {
      rdata.forEach((row) => {
        if (row && row._id) {
          selectedRowsCacheRef.current.set(row._id, row);
        }
      });
      setSelectedDamageIds(allIds);
    } else {
      setSelectedDamageIds([]);
    }
  };

  const exportToExcel = async () => {
    try {
      if (selectedDamageIds.length === 0) {
        toast.error(t("Select atleast 1 row to export data"));
        return;
      }

      const rowsSource = rdata.filter((rec) =>
        selectedDamageIds.includes(rec._id)
      );

      if (!rowsSource || rowsSource.length === 0) {
        toast.error(t("No data available to export"));
        return;
      }

      const tableColumns = [t("Product Name"), t("Category"), t("Quantity"), t("Remark"), t("Created Date")];
      const tableRows = rowsSource.map((rec) => [
        rec?.product?.productName || "",
        rec?.category?.categoryName || "",
        `${rec?.quantity ?? 0} ${(rec?.product?.unit || "").toLowerCase()}`.trim(),
        rec?.remarks || "",
        rec?.createdAt ? new Date(rec.createdAt).toLocaleDateString("en-GB") : "-",
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Damage Returns");

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

      [28, 25, 20, 60, 20].forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      tableRows.forEach((row) => worksheet.addRow(row));
      worksheet.getColumn(3).alignment = { horizontal: "center", vertical: "middle" };
      worksheet.getColumn(5).alignment = { horizontal: "center", vertical: "middle" };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "damage-returns.xlsx",
      );

      toast.success(t("Damage Product Excel file exported successfully!"));
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get("/api/damage-return", { params });
      const data = res.data || {};
      const items = Array.isArray(data.items) ? data.items : [];

      setRecords(items);
      setTotalRecords(Number(data.total) || 0);

      if (!searchQuery.trim() && !selectedCategory) {
        setHasAnyData(items.length > 0);
      } else if (hasAnyData === null) {
        const unfiltered = await api.get("/api/damage-return", {
          params: { page: 1, limit: 1 },
        });
        const unfilteredItems = unfiltered.data?.items || [];
        setHasAnyData(unfilteredItems.length > 0);
      }
    } catch (err) {
      setRecords([]);
      setTotalRecords(0);
      setHasAnyData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    (window).onDamageCreated = fetchRecords;
    return () => {
      delete (window).onDamageCreated;
    };
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedCategory, searchQuery, currentPage, itemsPerPage]);

  const dropdownButtonRefs = useRef([]);
  const dropdownModelRef = useRef(null);
  const addButtonRef = useRef(null);

  useEffect(() => {
    if (viewOptions === null) return;
    const handleClickOutside = (event) => {
      const isClickInsideModel = dropdownModelRef.current && dropdownModelRef.current.contains(event.target);
      const isClickInsideButton = dropdownButtonRefs.current[viewOptions] && dropdownButtonRefs.current[viewOptions].contains(event.target);
      if (!isClickInsideModel && !isClickInsideButton) {
        setViewOptions(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewOptions]);

  const handleDelete = (id) => {
    setDeleteTargetId(id?._id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/damage-return/${deleteTargetId}`);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      toast.success("Damage product deleted successfully!");
      await fetchRecords();
      fetchCategories();
    } catch (err) {
      setShowDeleteModal(false);
      toast.error(
        err?.response?.data?.displayMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete damage report"
      );
    }
  };

  const isAllSelected = rdata.length > 0 && selectedDamageIds.length === rdata.length;

  return (
    <div className="p-4">
      {hasAnyData === null ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : !hasAnyData && !isFilterActive ? (
        <>
          <EmptyDamageReturn />
          {showDamageReportModel && (
            <CreateDamageModal
              closeModal={async () => {
                setDamageReportModel(false);
                await fetchRecords();
                fetchCategories();
              }}
            />
          )}
        </>
      ) : (
        <>
          <div>
            {/* back, header, view style */}
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0px 0px 16px 0px", // Optional: padding for container
              }}
            >
              {/* Left: Title + Icon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: "black",
                    fontSize: 22,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 500,
                    lineHeight: "26.4px",
                  }}
                >
                  Damage Products
                </h2>
              </div>

              {/* Right: Action Buttons */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  height: "33px",
                }}
              >
                {hasPermission(user, "DamageRecord", "create") && (
                  <a
                    className="button-hover"
                    onClick={handleDamageReportModel}
                    ref={addButtonRef}
                    style={{
                      borderRadius: "8px",
                      padding: "5px 16px",
                      border: "1px solid #1F7FFF",
                      color: "rgb(31, 127, 255)",
                      fontFamily: "Inter",
                      backgroundColor: "white",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    + Add Damage
                  </a>
                )}
              </div>
            </div>

            {/* main content */}
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
              {/* tabs + search + export */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}>
                {/* select */}
                <div
                  className=""
                  style={{
                    padding: "0px 15px 0px 4px",
                    border: "1px solid #dfddddff",
                    borderRadius: "8px",
                    color: "grey",
                    background: "#FCFCFC",
                    cursor: "pointer",
                  }}
                >
                  <select
                    className=""
                    name=""
                    id=""
                    style={{
                      border: "none",
                      padding: "8px 12px",
                      fontFamily: "Inter",
                      background: "#FCFCFC",
                      color: "grey",
                      outline: "none",
                      cursor: "pointer",
                    }}
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                      // setSelectedDamageIds([]);
                    }}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.categoryName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* search + export */}
                <div style={{
                  display: "flex",
                  justifyContent: "end",
                  gap: "24px",
                  height: "33px",
                  width: "50%",
                }}>
                  {/* search */}
                  <div style={{
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
                  }}>
                    <IoIosSearch className="fs-5" />
                    <input
                      type="search"
                      placeholder="Search by Product Name..."
                      style={{
                        width: "100%",
                        border: "none",
                        outline: "none",
                        fontSize: 14,
                        background: "#FCFCFC",
                        color: "rgba(19.75, 25.29, 61.30, 0.40)",
                      }}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                        // setSelectedDamageIds([]);
                      }}
                    />
                  </div>

                  {/* export */}
                   {hasPermission(user, "DamageRecord", "Export") && (
                  <div style={{
                    display: "inline-flex",
                    justifyContent: "flex-start",
                    alignItems: "center",
                    gap: 16,
                  }}>
                    <button
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
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
                      onClick={exportToExcel}>
                      <TbFileExport className="fs-5 text-secondary" />
                      {t("Export")}
                    </button>
                  </div>
                   )}
                </div>
              </div>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
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
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <label className="checkboxs" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                            />
                            <span className="checkmarks" />
                          </label>
                          Product Name & Category
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Quantity
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Remark
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto', }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Damage Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      records.map((rec, index) => (
                        <tr key={index}
                          style={{
                            borderBottom: "1px solid #EAEAEA",
                            height: "46px",
                          }}
                          className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                        >
                          {/* Product Name & Category */}
                          <td
                            style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}
                            onClick={() => {
                              setActiveRow(index);
                              handleDamageReportViewModel(rec);
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                              <label className="checkboxs" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={selectedDamageIds.includes(rec._id)}
                                  onChange={() => handleCheckboxChange(rec._id, rec)}
                                />
                                <span className="checkmarks" />
                              </label>

                              {/* image */}
                              <a className="avatar avatar-md w-35 h-35">
                                {rec?.product?.images?.[0] ? (
                                  <img
                                    src={rec.product.images[0].url}
                                    alt={rec.product.productName}
                                    className="me-1"
                                    style={{ objectFit: 'fit', width: '100%', height: '100%', borderRadius: '6px', }}
                                  />
                                ) : (
                                  <img
                                    src={ProductDefaultImage}
                                    alt='Product Default Image'
                                    className="me-1"
                                    style={{ objectFit: 'fit', width: '100%', height: '100%', borderRadius: '6px', }}
                                  />
                                )}
                              </a>

                              {/* product name + category */}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDamageReportViewModel(rec);
                                }}>
                                <div style={{ fontSize: 14, color: '#0E101A', whiteSpace: 'nowrap', display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center' }}>
                                  <div>
                                    {rec?.product?.productName || "-"}
                                  </div>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 8px',
                                    background: '#FFE0FC',
                                    color: '#AE009B',
                                    borderRadius: 36,
                                    fontSize: 12,
                                    marginTop: 4,
                                  }}>
                                    {rec?.category?.categoryName || "-"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* quantity */}
                          <td
                            style={{
                              padding: "8px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {  // FIXED: Add stopPropagation
                              e.stopPropagation();
                              handleDamageReportViewModel(rec);
                            }}
                          >
                            {rec?.quantity ?? 0} {rec?.product?.unit?.toLowerCase() || ""}
                          </td>

                          {/* remark */}
                          <td
                            style={{
                              padding: "8px 16px",
                              fontSize: 14,
                              color: "#0E101A",
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {  // FIXED: Add stopPropagation
                              e.stopPropagation();
                              handleDamageReportViewModel(rec);
                            }}
                            title={rec?.remarks || "-"}
                          >
                            {rec?.remarks.length > 30 ? rec?.remarks.slice(0, 30) + "..." : rec?.remarks || "-"}
                          </td>

                          {/* Actions */}
                          <td
                            style={{
                              padding: "8px 16px",
                              position: "relative",
                              overflow: "visible",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                position: "relative",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                style={{
                                  width: 24,
                                  height: 24,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();

                                  const dropdownHeight = 260; // your menu height
                                  const spaceBelow = window.innerHeight - rect.bottom;
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
                                  setViewOptions(viewOptions === index ? null : index);
                                  e.stopPropagation();
                                }}
                                ref={(el) => (dropdownButtonRefs.current[index] = el)}
                              >
                                <div
                                  style={{
                                    width: 4,
                                    height: 4,
                                    background: "#6C748C",
                                    borderRadius: 2,
                                  }}
                                />
                                <div
                                  style={{
                                    width: 4,
                                    height: 4,
                                    background: "#6C748C",
                                    borderRadius: 2,
                                  }}
                                />
                                <div
                                  style={{
                                    width: 4,
                                    height: 4,
                                    background: "#6C748C",
                                    borderRadius: 2,
                                  }}
                                />
                              </div>
                              {viewOptions === index && (
                                <>
                                  <div
                                    style={{
                                      position: "fixed",
                                      top: openUpwards
                                        ? dropdownPos.y - 110
                                        : dropdownPos.y,
                                      left: dropdownPos.x - 80,
                                      zIndex: 999999,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div
                                      ref={dropdownModelRef}
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
                                      }}
                                    >
                                      {hasPermission(user, "DamageRecord", "delete") && (
                                        <div
                                          onClick={(e) => { e.stopPropagation(); handleEditDamageReportModel(rec); setViewOptions(null) }}
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            border: "none",
                                            cursor: "pointer",
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: 16,
                                            fontWeight: 400,
                                            color: "#6C748C",
                                            textDecoration: "none",
                                          }}
                                          className="button-action"
                                        >
                                          <img src={edit} alt="" />
                                          <span style={{ color: 'black' }}>Edit</span>
                                        </div>
                                      )}
                                      {hasPermission(user, "DamageRecord", "update") && (
                                        <div
                                          onClick={(e) => { e.stopPropagation(); handleDelete(rec); setViewOptions(null) }}
                                          style={{
                                            display: "flex",
                                            justifyContent: "flex-start",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "8px 12px",
                                            borderRadius: 8,
                                            border: "none",
                                            cursor: "pointer",
                                            fontFamily: "Inter, sans-serif",
                                            fontSize: 16,
                                            fontWeight: 400,
                                            color: "#6C748C",
                                            textDecoration: "none",
                                          }}
                                          className="button-action"
                                        >
                                          <img src={deletebtn} alt="" />
                                          <span style={{ color: 'black' }}>Delete</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}

                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentPage}
                  total={totalRecords}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                  onItemsPerPageChange={(n) => {
                    setItemsPerPage(n);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {showDamageReportModel && (
        <CreateDamageModal
          closeModal={async () => {
            setDamageReportModel(false);
            fetchCategories();
            await fetchRecords();
          }}
        />
      )}

      {editDamageReportModel && (
        <EditDamageModal
          closeModal={async () => {
            setEditDamageReportModel(false);
            fetchCategories();
            await fetchRecords();
          }}
          selectedProduct={selectedProduct}
        />
      )}

      {viewDamageReportModel && (
        <ViewDamageModal
          closeModal={() => setViewDamageReportModel(false)}
          selectedProduct={selectedProduct}
        />
      )}

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName="product"
      />

    </div>
  );
}

export default DamageReturn;
