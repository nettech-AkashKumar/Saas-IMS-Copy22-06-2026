import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// icons
import { TbEdit, TbTrash, TbFileExport } from "react-icons/tb";
import EditColorModal from "./EditColorModal.jsx";
import AddColorModal from "./AddColorModal.jsx";
import { IoIosSearch } from "react-icons/io";

// pages
import { hasPermission } from "../../../../utils/permission/hasPermission.jsx";
import { useAuth } from "../../../auth/AuthContext.js";
import api from "../../../../pages/config/axiosInstance.js";
import Pagination from '../../../Pagination.jsx';
import DeleteModal from '../../../ConfirmDelete.jsx';

// images
import edit from "../../../../assets/images/edit.png";
import deletebtn from "../../../../assets/images/delete.png";

const Colors = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [colorData, setColorData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddColorModal, setShowAddColorModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedColors, setSelectedColors] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteMode, setDeleteMode] = useState("single");
  const [loading, setLoading] = useState(false);
  const [viewOptions, setViewOptions] = useState(false);
  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    fetchColors();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedColors([]);
  }, [searchTerm]);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/color/active-color');
      setColorData(res.data?.colors || []);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch colors.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (color) => {
    setSelectedColor(color);
    window.$("#edit-colors").modal("show");
  };

  const handleCheckboxChange = (colorId) => {
    setSelectedColors((prev) =>
      prev.includes(colorId)
        ? prev.filter((id) => id !== colorId)
        : [...prev, colorId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = filteredColors.map((color) => color._id);
      setSelectedColors(allFilteredIds);
    } else {
      setSelectedColors([]);
    }
  };

  const exportToExcel = async () => {
    try {
      if (selectedColors.length === 0) {
        toast.error("Select atleast 1 row to export data");
        return;
      }

      const rowsSource = colorData.filter((color) => selectedColors.includes(color._id));

      if (rowsSource.length === 0) {
        toast.error(t("No data available to export"));
        return;
      }

      const tableColumns = [t("Color Name"), t("Color Code"), t("Created Date")];
      const tableRows = rowsSource.map((color) => [
        color.colorName || "",
        color.colorCode || "",
        color.createdAt ? new Date(color.createdAt).toLocaleDateString("en-GB") : "-",
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Colors List");

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

      [30, 20, 20, 20].forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      tableRows.forEach((row) => worksheet.addRow(row));

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "colors-list.xlsx",
      );

      toast.success(t("Colors Excel file exported successfully!"));
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const handleDeleteColor = (colorId) => {
    setDeleteMode("single");
    setDeleteTargetId(colorId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      if (deleteMode === "single" && deleteTargetId) {
        await api.delete(`/api/color/color/${deleteTargetId}`);
        toast.success(t("Color deleted successfully"));
      } else if (deleteMode === "bulk" && selectedColors.length > 0) {
        await Promise.all(selectedColors.map((id) => api.delete(`/api/color/color/${id}`)));
        toast.success(t("Selected colors deleted successfully"));
        setSelectedColors([]);
      }
      setShowDeleteModal(false);
      fetchColors();
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to delete color(s).");
    } finally {
      setLoading(false);
    }
  };

  const counts = {
    all: colorData.length,
  };

  const filteredColors = colorData
    .filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const qNoHash = q.startsWith("#") ? q.slice(1) : q;
      const codeNoHash = String(c.colorCode || "").toLowerCase().replace("#", "");
      const matchesSearch =
        c.colorName?.toLowerCase().includes(q) ||
        (qNoHash.length > 0 && codeNoHash.includes(qNoHash));
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const paginatedColors = filteredColors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const cleanUpModal = () => {
    document.body.classList.remove("modal-open");
    document.querySelectorAll(".modal-backdrop").forEach(el => el.remove());
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
        setViewOptions(false); // ✅ CLOSE DROPDOWN
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [viewOptions]);

  return (
    <div className="p-4">

      {/* header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px", // Optional: padding for container
          flexWrap: "wrap"
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
              lineHeight: "26.4px",
            }}
          >
            Color
          </h2>
        </div>

        {/* Right: Action Buttons */}
        {hasPermission(user, "Color", "write") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: "33px",
            }}
          >
            <a
              title="Add Color"
              className="button-hover"
              onClick={() => setShowAddColorModal(true)}
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
            >+ Add Color</a>
          </div>
        )}
      </div>

      {/* main body */}
      <div style={{
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
      }}>

        {/* tabs + search + export */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}>
          {/* tabs */}
          <div style={{
            display: "flex",
            gap: 8,
            padding: 2,
            background: "#F3F8FB",
            borderRadius: 8,
            flexWrap: "wrap",
            height: "38px",
            width: "auto",
          }}>
            {["All"].map((tab) => (
              <div
                key={tab}
                // className={`px-3 py-1 rounded cursor-pointer ${statusFilter === tab ? "bg-white shadow-sm" : ""}`}
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
                onClick={() => setStatusFilter(tab)}
              >
                {t(tab)}
                <span style={{ color: "#727681" }}>{counts[tab.toLowerCase()]}</span>
              </div>
            ))}
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
              <IoIosSearch className="fs-4" />
              <input
                type="search"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                placeholder={t("Search by Color Name or Code...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* export */}
            {hasPermission(user, "Color", "Export") && (
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
                    <label className="checkboxs">
                      <input
                        type="checkbox"
                        checked={filteredColors.length > 0 && selectedColors.length === filteredColors.length}
                        onChange={handleSelectAll}
                      />
                      <span className="checkmarks" />
                    </label>
                    {t("Color Name")}
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
                  {t("Color Code")}
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
                  {t("Created Date")}
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
                  {t("Action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedColors.length > 0 ? (
                paginatedColors.map((color, index) => (
                  <tr
                    key={color._id}
                    className="table-hover"
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                      height: "46px",
                    }}>
                    <td style={{
                      padding: "4px 16px",
                      verticalAlign: "middle",
                    }}>
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
                            checked={selectedColors.includes(color._id)}
                            onChange={() => handleCheckboxChange(color._id)}
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
                          }}>
                          {color.colorName}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        cursor: "pointer",
                      }}>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 20, height: 20, background: color.colorCode, borderRadius: '50%', border: '1px solid #ddd' }}></div>
                        {color.colorCode.slice(1)}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        cursor: "pointer",
                      }}>
                      {new Date(color.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="" style={{
                      padding: "4px 16px",
                      position: "relative",
                      overflow: "visible",
                    }}>
                      {/* <div className="edit-delete-action">
                        {hasPermission(user, "Color", "update") && (
                          <a className="me-2 p-2" onClick={() => handleEditClick(color)}>
                            <TbEdit />
                          </a>
                        )}
                        {hasPermission(user, "Color", "delete") && (
                          <a className="p-2" onClick={() => handleDeleteColor(color._id)}>
                            <TbTrash />
                          </a>
                        )}
                      </div> */}
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
                        {/* 3 dots*/}
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

                        {/* option model */}
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
                                {hasPermission(user, "Color", "update") && (
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
                                    onClick={() => handleEditClick(color)}
                                  >
                                    <img src={edit} alt="" />
                                    <span style={{ color: "black" }}>
                                      Edit
                                    </span>
                                  </div>
                                )}
                                {hasPermission(user, "Color", "delete") && (
                                  <div
                                    onClick={() => handleDeleteColor(color._id)}
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
                ))) : (
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
                    >No Color Found
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={currentPage}
            total={filteredColors.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>

      </div>

      {showAddColorModal && (
        <AddColorModal
          show={showAddColorModal}
          closeModal={() => setShowAddColorModal(false)}
          fetchColors={fetchColors}
          cleanUpModal={cleanUpModal}
        />
      )}

      <EditColorModal
        selectedColor={selectedColor}
        onColorUpdated={fetchColors}
        cleanUpModal={cleanUpModal}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemName={t("color")}
      />
    </div>
  );
};

export default Colors;
