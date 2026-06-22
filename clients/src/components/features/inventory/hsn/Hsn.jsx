import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink } from "react-router-dom";
import { toast } from 'react-toastify';
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// pages
import { useAuth } from "../../../auth/AuthContext";
import { sanitizeInput } from "../../../../utils/sanitize";
import { hasPermission } from '../../../../utils/permission/hasPermission';
import AddHsnModals from './AddHsnModals';
import api from "../../../../pages/config/axiosInstance"
import Pagination from "../../../../components/Pagination";
import DeleteModal from "../../../ConfirmDelete";

// icons
import { CiCirclePlus } from 'react-icons/ci';
import { TbEdit, TbTrash } from 'react-icons/tb';
import { GrFormPrevious } from "react-icons/gr";
import { MdNavigateNext } from "react-icons/md";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";

// images
import edit from "../../../../assets/images/edit.png";
import deletebtn from "../../../../assets/images/delete.png";

const HSNList = () => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [modalData, setModalData] = useState({ hsnCode: '', description: '', gstRate: '', id: null });
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [selectAllAcrossPages, setSelectAllAcrossPages] = useState(false);
  const selectedRowsCacheRef = useRef(new Map());
  const [allVisibleSelected, setAllVisibleSelected] = useState(false);
  const [activeRow, _setActiveRow] = useState(null);
  const [viewOptions, setViewOptions] = useState(false);
  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPage(1);
    setSelectedRowIds(new Set());
    setSelectAllAcrossPages(false);
    selectedRowsCacheRef.current = new Map();
  }, [search]);

  useEffect(() => {
    const cache = selectedRowsCacheRef.current;
    data.forEach((item) => {
      if (item && item._id) cache.set(item._id, item);
    });
  }, [data]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/hsn/paginated`, {
        params: { page, limit, search },
      });
      setData(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      // toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  }, [limit, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleDelete = (id) => {
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
      await api.delete(`/api/hsn/${deleteTargetId}`);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      load();
      toast.success("HSN deleted successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to delete HSN. Please try again.");
    }
  };

  const handleExcel = async () => {
    const tableColumns = ["HSN Code", "Description", "GST Rate", "Created At"];

    try {
      if (selectedRowIds.size === 0) {
        toast.error("Select atleast 1 row to export data");
        return;
      }

      // Fetch all HSN to get complete data in correct LIFO order
      const res = await api.get(`/api/hsn/all`);
      const allItems = res.data.data || res.data || [];

      // Filter to selected IDs, preserving backend LIFO order
      const rowsSource = allItems
        .filter((item) => selectedRowIds.has(item._id));

      if (!rowsSource || rowsSource.length === 0) {
        toast.error("No data available to export");
        return;
      }

      const tableRows = rowsSource.map((e) => [
        e.hsnCode || "",
        e.description || "",
        e.gstRate || "",
        e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "",
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("HSN");

      [20, 40, 20, 20].forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

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

      tableRows.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "hsn.xlsx",
      );

      toast.success("HSN Excel file downloaded successfully!");
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to export HSN data");
    }
  };

  const fileInputRef = useRef(null);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // const token = localStorage.getItem("token")
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        // Format to match backend model
        const formattedData = jsonData.map((item) => ({
          hsnCode: item["HSN Code"],
          description: item["Description"],
          gstRate: Number(item["GST Rate"]),
        }));

        // ✅ Send all at once
        const res = await api.post(`/api/hsn/import`, {
          hsnItems: formattedData,
        });

        toast.success(res.data.message);
        load();
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Import failed");
    }
  };

  const handleModalSubmit = async () => {
    let newErrors = {};
    const { hsnCode, description, gstRate } = modalData;

    // Validate HSN Code
    const hsnRegex = /^[0-9]{1,8}$/;
    if (!hsnCode || !String(hsnCode).trim()) {
      newErrors.hsnCode = "HSN code is required";
    } else if (!hsnRegex.test(String(hsnCode).trim())) {
      newErrors.hsnCode = "HSN code must be 8 digits";
    }

    // Validate Description
    if (!description || !String(description).trim()) {
      newErrors.description = "Description is required";
    }

    // Validate GST Rate
    const gstRateStr = String(gstRate ?? "").trim();
    if (!gstRateStr) {
      newErrors.gstRate = "GST rate is required";
    } else if (isNaN(gstRateStr)) {
      newErrors.gstRate = "GST rate must be a non-negative number";
    } else if (Number(gstRateStr) < 0) {
      newErrors.gstRate = "GST rate must be a non-negative number";
    } else if (Number(gstRateStr) > 100) {
      newErrors.gstRate = "GST rate must be between 0-100";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const cleanhsnCode = sanitizeInput(String(hsnCode).trim());
      const cleanhsnDescription = sanitizeInput(String(description).trim());
      const cleanGstRate = sanitizeInput(gstRateStr);  // already trimmed above

      if (modalData.id) {
        await api.put(`/api/hsn/${modalData.id}`, {
          hsnCode: cleanhsnCode,
          description: cleanhsnDescription,
          gstRate: Number(cleanGstRate),
        });
        toast.success("HSN updated successfully!");
      } else {
        await api.post(`/api/hsn`, {
          hsnCode: cleanhsnCode,
          description: cleanhsnDescription,
          gstRate: Number(cleanGstRate),
        });
        toast.success("HSN created successfully!");
      }

      setModalData({ hsnCode: '', description: '', gstRate: '', id: null });
      setShowModal(false);
      setErrors({});
      load();
    } catch (err) {
      if (err?.response?.data?.code === "DUPLICATE_KEY") {
        newErrors.hsnCode = "HSN code already exists";
        setErrors(newErrors);
        return;
      }
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to save HSN. Please try again");
    }
  };

  const openModal = (item = null) => {
    if (item) {
      setModalData({ hsnCode: item.hsnCode, description: item.description, gstRate: item.gstRate, id: item._id });
    } else {
      setModalData({ hsnCode: '', description: '', gstRate: '', id: null });
    }
    setErrors({}); // Clear any previous errors
    setShowModal(true);
  };

  useEffect(() => {
    const allCurrentPageIds = data.map(item => item._id);
    const allSelected = allCurrentPageIds.length > 0 && allCurrentPageIds.every(id => selectedRowIds.has(id));
    setAllVisibleSelected(allSelected);
  }, [data, selectedRowIds]);

  const handleToggleSelectAll = async (checked) => {
    if (!checked) {
      setSelectedRowIds(new Set());
      setSelectAllAcrossPages(false);
      return;
    }

    try {
      const res = await api.get(`/api/hsn/all`);
      let rows = res.data.data || res.data || [];
      if (!Array.isArray(rows)) rows = Array.isArray(res.data) ? res.data : [];

      const q = search.trim().toLowerCase();
      if (q) {
        rows = rows.filter((r) => {
          const code = String(r?.hsnCode || "").toLowerCase();
          const desc = String(r?.description || "").toLowerCase();
          const gstRate = String(r?.gstRate || "").toLowerCase();
          return code.includes(q) || desc.includes(q) || gstRate.includes(q);
        });
      }

      const cache = selectedRowsCacheRef.current;
      rows.forEach((r) => {
        if (r && r._id) cache.set(r._id, r);
      });

      setSelectedRowIds(new Set(rows.map((r) => r && r._id).filter(Boolean)));
      setSelectAllAcrossPages(true);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (viewOptions === false) return;

      const isClickInsideDropdown =
        modelRef.current && modelRef.current.contains(event.target);

      const isClickOnButton =
        buttonRefs.current[viewOptions] &&
        buttonRefs.current[viewOptions].contains(event.target);

      if (!isClickInsideDropdown && !isClickOnButton) {
        setViewOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [viewOptions]);

  return (
    <div className="p-4">
      {/* header, view style */}
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
            height: '33px'
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              height: '33px'
            }}
          >
            HSN
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
          {hasPermission(user, "HSN", "import") && (
            <>
              <div
                className="button-hover"
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
                }}
              >
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    hidden
                    onChange={handleImport}
                    ref={fileInputRef}
                  />
                  <TbFileExport className="fs-5" />
                  Import
                </label>
              </div>
            </>
          )}
          {hasPermission(user, "HSN", "create") && (
            <button
              className="button-hover"
              onClick={() => openModal()}
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
              }}
            >
              + Add HSN
            </button>
          )}
        </div>
      </div>

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
        {/* tab Search Bar + export import */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
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
              height: "38px",
              width: "auto",
            }}
          >
            {[
              { label: "All", count: total },
            ].map((tab) => (
              <div
                key={tab.label}
                style={{
                  padding: "6px 12px",
                  background: "white",
                  borderRadius: 8,
                  boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
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
            ))}
          </div>

          {/* select + Search Bar + export import */}
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
              width: "50%",
            }}
          >

            {/* {selectedRowIds.size > 0 && (
              <button className="btn btn-danger me-2" onClick={handleBulkDelete}>
                Delete ({selectedRowIds.size}) Selected
              </button>
            )} */}

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
                placeholder="Search by HSN code or Description..."
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); setSelectedRowIds(new Set()); }}
              />
            </div>

            {hasPermission(user, "HSN", "export") && (
              <div
                style={{
                  display: "inline-flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <button
                  title="Download Excel"
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
              </div>
            )}
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
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
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
                    HSN Code
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
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
                    fontWeight: "400",
                  }}
                >
                  GST Rate
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
                    fontWeight: "400",
                  }}
                >
                  Created Date
                </th>
                <th
                  style={{
                    textAlign: "center",
                    padding: "4px 16px",
                    color: "#727681",
                    fontSize: 14,
                    width: "auto",
                    fontWeight: "400",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ overflowY: "auto" }}>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
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
                    >No HSN Found
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((hsn, index) => (
                    <tr
                      key={hsn._id}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                        height: "46px",
                      }}
                      className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                    >
                      {/* hsn code */}
                      <td
                        style={{
                          padding: "4px 16px",
                          verticalAlign: "middle",
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
                              checked={selectedRowIds.has(hsn._id)}
                              onChange={(e) => {
                                const next = new Set(selectedRowIds);
                                if (e.target.checked) {
                                  if (hsn._id) next.add(hsn._id);
                                } else {
                                  if (hsn._id) next.delete(hsn._id);
                                  if (selectAllAcrossPages) setSelectAllAcrossPages(false);
                                }
                                setSelectedRowIds(next);
                              }}
                            />
                            <span className="checkmarks" />
                          </label>
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
                          >
                            {hsn.hsnCode}
                          </div>
                        </div>
                      </td>

                      {/* description */}
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                      >
                        <span>{hsn.description ? hsn.description?.length > 30 ? hsn.description.slice(0, 30) + '...' : hsn.description : '-'}</span>
                      </td>

                      {/* gst rate */}
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {hsn.gstRate ? hsn.gstRate + "%" : '0% (Exempt)'}
                      </td>

                      {/* created date */}
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                        }}
                      >
                        {new Date(hsn.createdAt).toLocaleDateString("en-GB", {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>

                      {/* Actions */}
                      <td
                        style={{
                          padding: "4px 16px",
                          position: "relative",
                          overflow: "visible",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setViewOptions(
                              viewOptions === index ? false : index
                            )
                          }
                          ref={(el) => (buttonRefs.current[index] = el)}
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
                              const rect =
                                e.currentTarget.getBoundingClientRect();

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

                              setViewOptions(
                                viewOptions === index ? false : index
                              );
                            }}
                          // ref={(el) =>(buttonRefs.current[index] = el)}
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
                                  }}
                                >
                                  {hasPermission(user, "HSN", "update") && (
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
                                        color: "#6C748C",
                                        textDecoration: "none",
                                      }}
                                      className="button-action"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openModal(hsn);
                                      }}
                                    >
                                      <img src={edit} alt="" />
                                      <span style={{ color: "black" }}>
                                        Edit
                                      </span>
                                    </div>
                                  )}

                                  {hasPermission(user, "HSN", "delete") && (
                                    <div
                                      onClick={() => handleDelete(hsn._id)}
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
                                      <span style={{ color: "black" }}>
                                        Delete
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={page}
            total={total}
            itemsPerPage={limit}
            onPageChange={(p) => {
              setPage(p);
            }}
            onItemsPerPageChange={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
        </div>
      </div>

      <AddHsnModals
        show={showModal}
        onClose={() => setShowModal(false)}
        modalData={modalData}
        setModalData={setModalData}
        onSubmit={handleModalSubmit}
        errors={errors}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName="product"
      />

    </div>

  );
};

export default HSNList;
