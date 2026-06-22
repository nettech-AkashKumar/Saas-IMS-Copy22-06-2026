import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import api from "../../pages/config/axiosInstance";
import Pagination from "../../components/Pagination";
import ViewDamageModal from "../../components/features/inventory/Damage&Return/ViewDamageModal";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FiEdit } from "react-icons/fi";
import { RiListView, RiDeleteBinLine } from "react-icons/ri";
import { HiOutlineDocumentDuplicate } from "react-icons/hi";
import { RiInboxArchiveFill, RiInboxUnarchiveFill } from "react-icons/ri";
import { LuReceiptText } from "react-icons/lu";
import { LuPackageSearch } from "react-icons/lu";
import { LuRefreshCcwDot } from "react-icons/lu";
import Dollarimg from "../../assets/images/dollar.png";
import Orderimg from "../../assets/images/order.png";
import Purchaseimg from "../../assets/images/profit-cash.png";
import Dueamountimg from "../../assets/images/number-one.png";
import { MdOutlineKeyboardArrowRight, MdOutlineKeyboardArrowLeft, MdOutlineKeyboardDoubleArrowRight, MdOutlineKeyboardDoubleArrowLeft, } from "react-icons/md";

function DamageReport() {

  const statsTop = [
    {
      title: "Total Damage",
      value: "0",
      currency: "",
      image: Dollarimg,
      link: "",
    },
    {
      title: "Damaged Quantity",
      value: "0",
      currency: "",
      image: Orderimg,
      link: "",
    },
    {
      title: "Damage Cost",
      value: "0",
      currency: "INR",
      image: Purchaseimg,
      link: "",
    },
    {
      title: "Net Loss",
      value: "0",
      currency: "INR",
      image: Dueamountimg,
      link: "",
    },
  ];
  const [viewOptions, setViewOptions] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [showDamageReportModel, setDamageReportModel] = useState(false);
  const [reports, setReports] = useState([]);
  const [rdata, setRData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [viewDamageReportModel, setViewDamageReportModel] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null); // For pre-fill
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [editDamageReportModel, setEditDamageReportModel] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [initialStats, setInitialStats] = useState(statsTop);
  const [activeRow, setActiveRow] = useState(null);

  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

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

  const handleDeleteDamageReport = async (item) => {
    try {
      if (!item?._id) return;
      await api.delete(`/api/damage-return/${item._id}`);
      setViewOptions(null);
      fetchRecords();
    } catch (err) {
      // optionally handle error UI
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/category/categories");
      setCategories(res.data);
    } catch (error) {
      // console.error("Error fetching categories:", error);
    }
  };
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      const allDataRes = await api.get("/api/damage-return");
      const allData = allDataRes.data || {};
      setRData(allData.items || []);

      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery && searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get("/api/damage-return", { params });
      const data = res.data || {};
      setRecords(Array.isArray(data.items) ? data.items : []);
      setTotalRecords(Number(data.total) || 0);
    } catch (err) {
      setRecords([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRecords();
    window.onDamageCreated = fetchRecords;
    return () => {
      delete window.onDamageCreated;
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
      const isClickInsideModel =
        dropdownModelRef.current &&
        dropdownModelRef.current.contains(event.target);
      const isClickInsideButton =
        dropdownButtonRefs.current[viewOptions] &&
        dropdownButtonRefs.current[viewOptions].contains(event.target);
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
      await fetchRecords();
    } catch (err) {
      setShowDeleteModal(false);
      // console.error("Delete product error:", err);
    }
  };

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "91vh" }}>
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
              Damage Report
            </h2>
          </div>

          {/* Right: Action Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          ></div>
        </div>

        {/* Top stat cards */}
        <div className="d-flex flex-wrap g-3 mb-3">
          {initialStats.map((s, idx) => (
            <Link
              to={s.link}
              key={idx}
              className="col-3"
              style={{ textDecoration: "none", paddingRight: s.title === "Net Loss" ? "0px" : "30px", }}
            >
              <div
                className="d-flex justify-content-between align-items-center bg-white position-relative"
                style={{
                  width: "100%",
                  height: "86px",
                  padding: "16px 24px 16px 16px",
                  fontFamily: "Inter",
                  boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
                  border: "1px solid #E5F0FF",
                  borderRadius: "8px",
                  backgroundColor: "#FFFFFF",
                }}
              >
                {/* Blue Left Accent Line */}
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "4px",
                    height: "70%",
                    backgroundColor: "#1F7FFF",
                    borderRadius: "1px 10px 1px 10px",
                  }}
                ></span>

                {/* Left Content */}
                <div
                  className="d-flex align-items-center"
                  style={{ gap: "24px" }}
                >
                  <div className="d-flex flex-column" style={{ gap: "11px" }}>
                    <h6
                      className="mb-0"
                      style={{
                        fontSize: "14px",
                        color: "#727681",
                        fontWeight: "500",
                      }}
                    >
                      {s.title}
                    </h6>
                    <div className="d-flex align-items-end gap-2">
                      <h5
                        className="mb-0"
                        style={{
                          fontSize: "22px",
                          color: "#0E101A",
                          fontWeight: "600",
                        }}
                      >
                        {s.value}
                      </h5>
                      {s.currency && (
                        <span style={{ fontSize: "14px", color: "#0E101A" }}>
                          {s.currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Icon Circle */}
                <div
                  className="d-flex justify-content-center align-items-center rounded-circle"
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E5F0FF",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={s.image}
                    alt={s.title}
                    style={{
                      width: "36px",
                      height: "36px",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* main content */}
        <div
          style={{
            overflowX: "auto",
            width: "100%",
            padding: 16,
            background: "white",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {/* Search Bar & export import */}
          <div className="d-flex justify-content-start gap-2 align-items-center">
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
                }}
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  width: "400px",
                  position: "relative",
                  padding: "8px 15px",
                  display: "flex",
                  borderRadius: 8,
                  alignItems: "center",
                  background: "#FCFCFC",
                  border: "1px solid #EAEAEA",
                  gap: "5px",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
              >
                <IoIosSearch className="fs-5" />
                <input
                  type="search"
                  placeholder="Search"
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
                  }}
                />
              </div>

              <div
                style={{
                  display: "inline-flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 16,
                }}
              ></div>
            </div>
          </div>

          {/* Table */}
          <div
            style={{
              overflowY: "auto",
              height: "calc(100vh - 310px)",
              maxHeight: '505px',
            }}
          >
            <table
              className="table-responsive"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                overflowX: "auto",
              }}
            >
              {/* Header */}
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
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 80,
                      fontWeight: "400",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      {/* <input type="checkbox" style={{ width: 18, height: 18 }} /> */}
                      Date
                    </div>
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 100,
                      fontWeight: "400",
                    }}
                  >
                    Damage Ref No.
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 123,
                      fontWeight: "400",
                    }}
                  >
                    Product Name
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 112,
                      fontWeight: "400",
                    }}
                  >
                    Item Code
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 112,
                      fontWeight: "400",
                    }}
                  >
                    Damage Qty
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 112,
                      fontWeight: "400",
                    }}
                  >
                    Unit
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 112,
                      fontWeight: "400",
                    }}
                  >
                    Batch No.
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 112,
                      fontWeight: "400",
                    }}
                  >
                    Unit Cost
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 112,
                      fontWeight: "400",
                    }}
                  >
                    Damage Value
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "4px 16px",
                      color: "#727681",
                      fontSize: 14,
                      // width: 112,
                      fontWeight: "400",
                    }}
                  >
                    Reason
                  </th>

                </tr>
              </thead>

              <tbody style={{ overflowY: "auto" }}>
                {records.length === 0 ? (
                  <tr
                    style={{
                      borderBottom: "1px solid #FCFCFC",
                      height: "46px",
                    }}
                  >
                    <td
                      colSpan={10}
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
                ) : (
                  records.map((rec, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                        height: "46px",
                      }}
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    >
                      {/* date */}
                      <td
                        style={{
                          padding: "8px 16px",
                          verticalAlign: "middle",
                          cursor: "pointer",
                          color: '#0E101A'
                        }}
                        onClick={(e) => {
                          handleDamageReportViewModel(rec);
                        }}
                      >
                        {new Date(rec.createdAt || 0).toLocaleString("en-GB", { day: "2-digit", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                      </td>

                      {/* damage reference no */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDamageReportViewModel(rec);
                        }}
                      >
                        {/* {rec?.category?.categoryName || "-"} */}
                        {/* {rec?.quantity ?? 0} */}
                        -
                      </td>

                      {/* product name */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          // FIXED: Add stopPropagation
                          e.stopPropagation();
                          handleDamageReportViewModel(rec);
                        }}
                      >
                        {rec?.product?.productName ?? "-"}
                      </td>

                      {/* item code */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          // FIXED: Add stopPropagation
                          e.stopPropagation();
                          handleDamageReportViewModel(rec);
                        }}
                      >
                        {rec?.product?.itemBarcode ?? "-"}
                      </td>

                      {/* quantity */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}>
                        {rec?.quantity ?? 0}
                      </td>

                      {/* unit */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}>
                          -
                      </td>

                      {/* batch no */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}>
                          -
                      </td>

                      {/* unit cost */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}>
                          -
                      </td>

                      {/* damage value */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}>
                          -
                      </td>

                      {/* reason */}
                      <td
                        style={{
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}>
                          {rec?.remarks ?? "-"}
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

      {viewDamageReportModel && (
        <ViewDamageModal
          closeModal={() => setViewDamageReportModel(false)}
          selectedProduct={selectedProduct}
        />
      )}
    </div>
  );
}

export default DamageReport;
