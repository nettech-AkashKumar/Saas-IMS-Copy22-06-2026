import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// pages
import api from "../../../pages/config/axiosInstance";
import Pagination from "../../../components/Pagination";
import DeleteModal from "../../../components/ConfirmDelete";
import CreateDamageModal from "./CreateExpensesModal";
import EditExpensesModal from "./EditExpensesModal";
import { hasPermission } from "../../../utils/permission/hasPermission";
import { useAuth } from "../../../components/auth/AuthContext";

// icons
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import { TiDocumentText } from "react-icons/ti";
import { FaUser } from "react-icons/fa";
import { IoIosArrowBack } from "react-icons/io";

// images
import edit from "../../../assets/images/edit.png";
import deletebtn from "../../../assets/images/delete.png";

const ExpenseReport = ({ item }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [viewBarcode, setViewBarcode] = useState(null);
  const [viewOptions, setViewOptions] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const dropdownButtonRefs = useRef([]);
  const dropdownModelRef = useRef(null);
  const barcodeButtonRefs = useRef([]);
  const barcodeModelRef = useRef(null);
  const addButtonRef = useRef(null);
  const addModelRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [showDamageReportModel, setDamageReportModel] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [openRow, setOpenRow] = useState(null);

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

  const handleEditModal = (expense) => {
    setSelectedExpense(expense);
    setEditModal(true);
  };

  // Click outside for dropdown
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

  // Click outside for barcode preview
  useEffect(() => {
    if (viewBarcode === null) return;
    const handleClickOutside = (event) => {
      const isClickInsideModel = barcodeModelRef.current && barcodeModelRef.current.contains(event.target);
      const isClickInsideButton = barcodeButtonRefs.current[viewBarcode] && barcodeButtonRefs.current[viewBarcode].contains(event.target);
      if (!isClickInsideModel && !isClickInsideButton) {
        setViewBarcode(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode]);

  // Click outside for add/edit modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!showDamageReportModel) return;  // ← Only check if open
      const isClickInsideModel = addModelRef.current && addModelRef.current.contains(event.target);
      const isClickInsideButton = addButtonRef.current && addButtonRef.current.contains(event.target);
      if (!isClickInsideModel && !isClickInsideButton) {
        setDamageReportModel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDamageReportModel]);

  const [expenses, setExpenses] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedDate, setSelectedDate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  const fetchExpenses = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/expenses/active-expenses');
      setExpenses(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const baseFilteredExpenses = expenses.filter((item) => {
    const q = (searchTerm || "").toLowerCase();
    const matchesSearch =
      !q ||
      String(item.expenseTitle || "").toLowerCase().includes(q) ||
      String(item.paidTo || "").toLowerCase().includes(q);

    if (selectedDate) {
      const expenseDate = new Date(item.date);
      expenseDate.setHours(0, 0, 0, 0);
      const selDate = new Date(selectedDate);
      selDate.setHours(0, 0, 0, 0);
      return expenseDate.getTime() === selDate.getTime() && matchesSearch;
    }
    return matchesSearch;
  });

  const filteredExpenses = baseFilteredExpenses.filter((item) => {
    const status = (item.paymentStatus || "").toLowerCase();
    if (filterStatus === "All") return true;
    if (filterStatus === "Settled") {
      return status === "settled" || status === "paid";
    }
    if (filterStatus === "Unsettled") {
      return status === "unsettled" || status === "pending";
    }
    return true;
  });

  const handleDeleteExpense = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      setLoading(true);
      await api.delete(`/api/expenses/${deleteTargetId}`);
      toast.success("Expense deleted successfully!");
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      await fetchExpenses();
    } catch (err) {
      setShowDeleteModal(false);
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to delete expense");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirst, indexOfLast);
  const total = baseFilteredExpenses.length;
  const allSelected =
    filteredExpenses.length > 0 &&
    filteredExpenses.every((e) => selectedRowIds.has(e._id));

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(filteredExpenses.length / itemsPerPage));
    if (currentPage > tp) setCurrentPage(tp);
    if (currentPage < 1) setCurrentPage(1);
  }, [filteredExpenses.length, itemsPerPage]);

  const settledCount = baseFilteredExpenses.filter((e) => {
    const status = (e.paymentStatus || "").toLowerCase();
    return status === "settled" || status === "paid";
  }).length;

  const unsettledCount = baseFilteredExpenses.filter((e) => {
    const status = (e.paymentStatus || "").toLowerCase();
    return status === "unsettled" || status === "pending";
  }).length;

  const tabs = [
    { label: "All", key: "All", count: total },
    { label: "Settled", key: "Settled", count: settledCount },
    { label: "Unsettled", key: "Unsettled", count: unsettledCount },
  ];

  const handleExcel = async () => {
    try {
      if (selectedRowIds.size === 0) {
        toast.error("Select atleast 1 row to export data");
        return;
      }

      const columns = [
        "Expense Title",
        "Amount",
        "Payment Mode",
        "Paid By",
        "Status",
      ];

      let rowsSource = filteredExpenses.filter((e) =>
        selectedRowIds.has(e._id)
      );

      if (rowsSource.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const dataRows = rowsSource.map((e) => [
        e.expenseTitle || "",
        e.amount ?? "",
        e.paymentMode || "",
        e.paidTo || "",
        e.paymentStatus || "",
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Expenses");

      const headerRow = worksheet.addRow(columns);

      [20, 20, 20, 20, 20].forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFF00" },
        };
      });

      worksheet.getColumn(2).alignment = { horizontal: "center", vertical: "middle" };

      dataRows.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();

      saveAs(
        new Blob([buffer], {
          type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "expenses.xlsx"
      );

      toast.success("Expenses Excel file downloaded successfully!");
    } catch (err) {
      toast.error(
        err?.response?.data?.displayMessage ||
        err?.response?.data?.message ||
        err?.message ||
        "Error"
      );
    }
  };

  return (
    <div className="p-4">
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
            height: "33px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              height: "33px",
            }}
          >
            Expenses
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
          {hasPermission(user, "ExpenseReport", "create") && (
            <button
              className='button-hover'
              ref={addButtonRef}
              onClick={handleDamageReportModel}
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
              + Add Expenses
            </button>
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
          overflowY: "auto",
        }}
      >
        {/* tabs + Search Bar & export import */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            height: "33px",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              flexWrap: "wrap",
              height: "33px",
              maxWidth: "50%",
              minWidth: "auto",
            }}
          >
            {tabs.map((tab) => {
              const isActive = filterStatus === tab.key;
              return (
                <div
                  key={tab.label}
                  onClick={() => {
                    setFilterStatus(tab.key);
                    setCurrentPage(1);
                    setSelectedRowIds(new Set());
                  }}
                  style={{
                    padding: "4px 12px",
                    background: isActive ? "white" : "transparent",
                    borderRadius: 8,
                    boxShadow: isActive
                      ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                      : "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    color: "#0E101A",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                  <span style={{ color: "#727681" }}>{tab.count}</span>
                </div>
              );
            })}
          </div>

          {/* Search Bar & export import */}
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
              width: "50%",
            }}
          >
            <div
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
              <IoIosSearch className="fs-4" />
              <input
                type="search"
                placeholder="Search by Expense Title, Paid By..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedRowIds(new Set());
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
            >
              {/* Export Button */}
              {hasPermission(user, "ExpenseReport", "export") && (
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
        </div>

        {/* Table */}
        <div
          className="table-responsive"
          style={{
            overflowY: "auto",
            height: "calc(100vh - 310px)",
            maxHeight: '500px',
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
                    padding: "5px 5px",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: "400",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <input
                      type="checkbox"
                      style={{ width: 18, height: 18 }}
                      checked={allSelected}
                      // onChange={(e) => {
                      //   const next = new Set(selectedRowIds);
                      //   if (e.target.checked) {
                      //     currentExpenses.forEach((row) => row._id && next.add(row._id));
                      //   } else {
                      //     currentExpenses.forEach((row) => row._id && next.delete(row._id));
                      //   }
                      //   setSelectedRowIds(next);
                      // }}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const allIds = new Set(filteredExpenses.map((e) => e._id));
                          setSelectedRowIds(allIds);
                        } else {
                          setSelectedRowIds(new Set());
                        }
                      }}
                    />
                    Expense Title
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "5px 5px",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: "400",
                  }}
                >
                  Amount
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "5px 5px",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: "400",
                  }}
                >
                  Payment Mode
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "5px 5px",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: "400",
                  }}
                >
                  Attachment
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "5px 5px",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: "400",
                  }}
                >
                  Paid By
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "5px 5px",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: "400",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "5px 5px",
                    color: "#727681",
                    fontSize: 14,
                    fontWeight: "400",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : currentExpenses.length === 0 ? (
                <>
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                      No expenses found.
                    </td>
                  </tr>
                </>
              ) : (
                currentExpenses.map((item, index) => (
                  <tr key={index}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                      height: "46px",
                    }}
                    className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    onClick={() => {
                      setSelectedSupplier(item);
                      setOpenModal(true);
                    }}
                  >
                    {/* Name & status */}
                    <td style={{
                      textAlign: "left",
                      padding: "5px 5px", verticalAlign: "middle", cursor: 'pointer'
                    }}>
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 12 }}
                      >
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
                            }
                            setSelectedRowIds(next);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              color: "#0E101A",
                              whiteSpace: "nowrap",
                              display: "flex",
                              gap: "5px",
                              justifyContent: "center",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              setSelectedSupplier(item);
                              setOpenModal(true);
                            }}
                          >
                            <div>{item.expenseTitle}</div>
                            {(((item.paymentStatus || "").toLowerCase() === "unsettled") ||
                              ((item.paymentStatus || "").toLowerCase() === "pending")) && (
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "4px 8px",
                                    background: "#F7C7C9",
                                    color: "#d1191fff",
                                    borderRadius: 36,
                                    fontSize: 12,
                                    marginTop: 4,
                                  }}
                                >
                                  Unsettled
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td
                      style={{
                        textAlign: "left",
                        padding: "5px 5px",
                        fontSize: 14,
                        color: "#0E101A",
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedSupplier(item);
                        setOpenModal(true);
                      }}
                    >
                      ₹{item.amount}/-
                    </td>

                    {/* Payment Mode */}
                    <td
                      style={{
                        textAlign: "left",
                        padding: "5px 5px",
                        fontSize: 14,
                        color: "#0E101A",
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedSupplier(item);
                        setOpenModal(true);
                      }}
                    >
                      {item.paymentMode == "partial" ||
                        item.paymentMode == "upi" ? (
                        <>
                          {item.paymentMode == "upi" ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                background: "#F7F7C7",
                                color: "#7e7e10ff",
                                borderRadius: 36,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              • {(item.paymentMode).toUpperCase()}
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 8px",
                                background: "#FFF2D5",
                                color: "#f0a70aff",
                                borderRadius: 36,
                                fontSize: 12,
                                marginTop: 4,
                              }}
                            >
                              ! {(item.paymentMode).toUpperCase()}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {(item.paymentMode).toUpperCase()}
                        </>
                      )}
                    </td>

                    {/* attachement */}
                    <td
                      style={{
                        textAlign: "left",
                        padding: "5px 5px",
                        // fontSize: 14,
                        color: "#0E101A",
                        cursor: 'pointer',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          position: "relative",
                        }}
                        onClick={() => setViewBarcode(viewBarcode === index ? null : index)}  // ← null instead of false
                        ref={(el) => (barcodeButtonRefs.current[index] = el)}
                      >
                        <TiDocumentText
                          style={{
                            background: "#E5F0FF",
                            color: "#0f6ff5ff",
                            borderRadius: "4px",
                            padding: "1px 3px",
                            fontSize: "30px",
                          }}
                        />
                        {item.attachment}
                      </div>
                      {viewBarcode === index && (
                        <>
                          <div
                            style={{
                              top: 0,
                              right: 0,
                              background: "#1d1c1c63",
                              zIndex: 9999,
                              display: "flex",
                              flexDirection: "column",
                              width: "100%",
                              height: "100vh",
                              justifyContent: "center",
                              alignItems: "center",
                              position: "fixed",
                              transition: "right 0.4s ease",
                              overflowY: "auto",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div
                              ref={barcodeModelRef}
                              style={{
                                width: "auto",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: "400px",
                                  height: "auto",
                                  backgroundColor: "#E5F0FF",
                                  outfit: "contain",
                                  boxShadow: "10px 10px 40px rgba(0,0,0,0.10)",
                                  borderRadius: 16,
                                  padding: 16,
                                  border: "2px solid #dbdbdbff",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                {item.receipt[0]?.url ? (
                                  <img
                                    src={item.receipt[0]?.url}
                                    alt="Barcode"
                                    style={{ width: "100%" }}
                                  />
                                ) : (
                                  <div style={{ fontSize: '14px' }}>No Receipt Uploaded</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </td>

                    {/* paid by */}
                    <td
                      className=""
                      style={{
                        textAlign: "left",
                        padding: "5px 5px",
                        // fontSize: 14,
                        color: "#0E101A",
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedSupplier(item);
                        setOpenModal(true);
                      }}
                    >
                      <span className="d-flex align-items-center gap-1">
                        <FaUser
                          style={{
                            color: "#727681",
                            fontSize: "13px",
                          }}
                        />{" "}
                        {item.paidTo}
                      </span>
                    </td>
                    {/* Date */}
                    <td style={{
                      textAlign: "left",
                      padding: "5px 5px",
                    }}>
                      {new Date(item.createdAt).toLocaleDateString("en-IN")}
                    </td>

                    {/* Actions */}
                    <td
                      style={{
                        textAlign: "left",
                        padding: "5px 5px",
                        position: "relative",
                        overflow: "visible",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          // display: "flex",
                          // justifyContent: "center",
                          // alignItems: "center",
                          position: "relative",
                          cursor: "pointer",
                        }}
                        ref={(el) => (dropdownButtonRefs.current[index] = el)}
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
                                {item.paymentStatus === "Unsettled" && (
                                  <>
                                    {hasPermission(user, "ExpenseReport", "update") && (
                                      <div
                                        onClick={(e) => {
                                          e.stopPropagation();  // ← ADD/ENSURE THIS
                                          handleEditModal(item);
                                          setViewOptions(null);  // ← Close dropdown
                                        }}
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
                                          color: "#0E101A",
                                          textDecoration: "none",
                                        }}
                                        className="button-action"
                                      >
                                        <img src={edit} alt="" />
                                        <span style={{ color: "black" }}>Edit</span>
                                      </div>
                                    )}
                                  </>)}

                                {hasPermission(user, "ExpenseReport", "delete") && (
                                  <div
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
                                      color: "#0E101A",
                                      textDecoration: "none",
                                    }}
                                    className="button-action"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExpense(item._id);
                                      setViewOptions(null);
                                    }}
                                  >
                                    <img src={deletebtn} alt="" />
                                    <span style={{ color: "black" }}>Delete</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-2">
          <Pagination
            currentPage={currentPage}
            total={total}
            itemsPerPage={itemsPerPage}
            // onPageChange={(p) => {
            //   setCurrentPage(p);
            //   // setSelectedRowIds(new Set());
            // }}
            // onItemsPerPageChange={(n) => {
            //   setItemsPerPage(n);
            //   setCurrentPage(1);
            //   // setSelectedRowIds(new Set());
            // }}
            onPageChange={(p) => {
              setCurrentPage(p);
            }}

            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </div>

        <DeleteModal
          isOpen={showDeleteModal}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          itemName="expense"
        />
      </div>

      {/* add expense model */}
      {showDamageReportModel && (
        <CreateDamageModal
          modelRef={addModelRef}
          closeModal={() => setDamageReportModel(false)}
          onSaved={() => fetchExpenses()}
        />
      )}

      {/* edit modal */}
      {editModal && selectedExpense && (
        <EditExpensesModal
          modelRef={addModelRef}
          closeModal={() => setEditModal(false)}
          onSaved={() => {
            setEditModal(false);
            fetchExpenses();
          }}
          isEdit
          expense={selectedExpense}
        />
      )}

      {/* show expense details model */}
      {openModal && selectedSupplier && (
        <div style={{
          position: "fixed",
          top: 0,
          right: openModal ? "0%" : "-100%",
          width: "100%",
          height: "100vh",
          transition: "right 0.4s ease",
          zIndex: 9999,
          overflowY: "auto",
          background: "#1d1c1c63",
          display: 'flex',
          justifyContent: 'end'
        }}>
          {/* <SupplierDetails  /> */}
          <div
            onClose={() => setOpenModal(false)}
            className="dashboard"
            style={{ padding: "20px", fontFamily: '"Inter", sans-serif', position: 'relative', display: 'flex', height: '100vh', width: '850px' }}
          >
            {/* close button */}
            <span
              onClick={() => setOpenModal(false)}
              style={{
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid #EAEAEA",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                marginLeft: "5px",
                backgroundColor: "#FFFF",
                zIndex: '999999'
              }}>
              <IoIosArrowBack style={{ color: "#6C748C", fontSize: "18px" }} />
            </span>

            {/* expense details */}
            <div style={{ padding: "20px 24px", backgroundColor: "#FFFF", position: 'absolute', background: 'white', width: '800px', left: '50px', height: '100vh', top: '0px' }}>

              {/* heading */}
              <div className="d-flex justify-content-between px-2" style={{}} >
                <div style={{ display: "flex", alignItems: "center", borderBottom: '1px solid #EAEAEA', width: '100%' }}>
                  <h1 style={{ color: "#000000", fontWeight: 400, marginBottom: "20px" }}>Expense Details</h1>
                </div>
              </div>

              <div className="px-2" style={{ padding: '20px 0px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontWeight: '400' }}>{selectedSupplier.expenseTitle}</h3>
                  <span style={{ color: '#727681' }}>{selectedSupplier.notes}</span>
                </div>
                <div>
                  <div style={{
                    background: '#0D6828',
                    border: 'none',
                    padding: '2px 2px 2px 2px',
                    borderRadius: '8px',
                  }}>
                    <div style={{
                      border: 'none',
                      background: '#0D6828',
                      color: 'white',
                      padding: '0px 10px'
                    }}>
                      {["settled", "paid"].includes(
                        (selectedSupplier.paymentStatus || "").toLowerCase()
                      )
                        ? "Settled"
                        : "Unsettled"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-2" style={{ padding: '5px 0px' }}>
                <div style={{ borderTop: '1px solid #EAEAEA', width: '100%' }}>
                </div>
              </div>

              <div className="d-flex justify-content-between px-2 py-4 gap-4 w-100">
                <div
                  className="w-50"
                  style={{
                    width: "400px",
                    maxHeight: "450px",
                    height: 'auto',
                    backgroundColor: "#E5F0FF",
                    outfit: "contain",
                    borderRadius: 16,
                    border: "2px solid #dbdbdbff",
                    display: "flex",
                    flexDirection: "column",
                    overflow: 'hidden',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {selectedSupplier.receipt[0]?.url ? (<>
                    <img
                      src={selectedSupplier.receipt[0]?.url}
                      alt="receipt"
                      style={{ width: "100%", height: '100%', objectFit: 'fill' }}
                    />
                  </>) : <div style={{ fontSize: '14px' }}>No Receipt Uploaded</div>}
                </div>

                <div className="d-flex flex-column w-50">
                  <div>
                    <div style={{ fontSize: '14px' }}>Expense Amount</div>
                    <div style={{
                      border: '1px solid #EAEAEA',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      marginTop: '3px'
                    }}>{selectedSupplier.amount}</div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '14px', }}>Payment Mode</div>
                    <div style={{
                      border: '1px solid #EAEAEA',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      marginTop: '3px'
                    }}>{selectedSupplier.paymentMode}</div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '14px' }}>Paid By</div>
                    <div style={{
                      border: '1px solid #EAEAEA',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      marginTop: '3px'
                    }}>{selectedSupplier.paidTo}</div>
                  </div>
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '14px' }}>Date</div>
                    <div style={{
                      border: '1px solid #EAEAEA',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      marginTop: '3px'
                    }}>
                      {new Date(selectedSupplier.createdAt).toLocaleDateString("en-IN")}

                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>

  );
};

export default ExpenseReport;
