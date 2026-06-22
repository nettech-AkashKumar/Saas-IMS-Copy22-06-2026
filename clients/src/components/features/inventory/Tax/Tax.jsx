import React, { useEffect, useRef, useState } from "react";
import { TbEdit, TbTrash, TbFileExport } from "react-icons/tb";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// pages
import { hasPermission } from "../../../../utils/permission/hasPermission.jsx";
import { useAuth } from "../../../auth/AuthContext.js";
import api from "../../../../pages/config/axiosInstance.js";
import AddtaxModal from "./TaxAddModal.jsx";
import EdittaxModal from "./TaxEditModal.jsx";
import Pagination from '../../../../components/Pagination.jsx';
import DeleteModal from '../../../ConfirmDelete.jsx';

// icons
import { IoIosSearch } from "react-icons/io";

// images
import edit from "../../../../assets/images/edit.png";
import deletebtn from "../../../../assets/images/delete.png";

const Tax = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [taxData, settaxData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAddtaxModal, setShowAddtaxModal] = useState(false);
  const [selectedtax, setSelectedtax] = useState(null);
  const [selectedtaxs, setSelectedtaxs] = useState([]);
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
    fetchtaxs();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedtaxs([]);
  }, [searchTerm]);

  const fetchtaxs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/tax/active-tax');
      settaxData(res.data?.taxs ?? []);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to fetch taxs");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (tax) => {
    setSelectedtax(tax);
    window.$("#edit-taxs").modal("show");
  };

  const handleCheckboxChange = (taxId) => {
    setSelectedtaxs((prev) =>
      prev.includes(taxId)
        ? prev.filter((id) => id !== taxId)
        : [...prev, taxId]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = taxData
        .filter((s) => {
          const q = searchTerm.toLowerCase().trim();
          const qNumeric = q.replaceAll("%", "").trim();
          const matchesSearch =
            s.taxName?.toLowerCase().includes(q) ||
            String(s.taxRate ?? "").includes(qNumeric);
          return matchesSearch;
        })
        .map((tax) => tax._id);
      setSelectedtaxs(allFilteredIds);
    } else {
      setSelectedtaxs([]);
    }
  };

  const exportToExcel = async () => {
    try {
      if (selectedtaxs.length === 0) {
        toast.error("Select atleast 1 row to export data");
        return;
      }

      const rowsSource = taxData.filter((tax) => selectedtaxs.includes(tax._id));

      if (rowsSource.length === 0) {
        toast.error(t("No data available to export"));
        return;
      }

      const tableColumns = [t("Tax Name"), t("Tax Short Name"), t("Tax Rate"), t("Created Date")];
      const tableRows = rowsSource.map((tax) => [
        tax.taxName || "",
        tax.taxShortName || "",
        tax.taxRate + "%" || "",
        tax.createdAt ? new Date(tax.createdAt).toLocaleDateString("en-GB") : "-",
      ]);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Taxs List");

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

      [25, 15, 20, 20].forEach((w, i) => {
        worksheet.getColumn(i + 1).width = w;
      });

      tableRows.forEach((row) => worksheet.addRow(row));

      worksheet.getColumn(2).alignment = { horizontal: "center", vertical: "middle" };

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        "taxs-list.xlsx",
      );

      toast.success(t("Tax Excel file exported successfully!"));
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Error");
    }
  };

  const handleDeletetax = (taxId) => {
    setDeleteMode("single");
    setDeleteTargetId(taxId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      if (deleteMode === "single" && deleteTargetId) {
        await api.delete(`/api/tax/tax/${deleteTargetId}`);
        toast.success(t("Tax deleted successfully"));
      } else if (deleteMode === "bulk" && selectedtaxs.length > 0) {
        await Promise.all(selectedtaxs.map((id) => api.delete(`/api/tax/tax/${id}`)));
        toast.success(t("Selected taxs deleted successfully"));
        setSelectedtaxs([]);
      }
      setShowDeleteModal(false);
      fetchtaxs();
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || error?.response?.data?.message || error?.message || "Failed to delete tax(s)");
    } finally {
      setLoading(false);
    }
  };

  const counts = {
    all: taxData.length,
  };

  const filteredtaxs = taxData
    .filter((s) => {
      const q = searchTerm.toLowerCase().trim();
      const qNumeric = q.replaceAll("%", "").trim();
      const matchesSearch =
        s.taxName?.toLowerCase().includes(q) ||
        s.taxShortName?.toLowerCase().includes(q) ||
        String(s.taxRate ?? "").includes(qNumeric);
      return matchesSearch;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const paginatedtaxs = filteredtaxs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalItems = filteredtaxs.length;

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
            Tax
          </h2>
        </div>

        {/* Right: Action Buttons */}
         {hasPermission(user, "Tax", "write") && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            height: "33px",
          }}
        >
          <a
            title="Add Tax"
            className="button-hover"
            onClick={() => setShowAddtaxModal(true)}
            style={{
              borderRadius: "8px",
              padding: "5px 16px",
              border: "1px solid #1F7FFF",
              color: "rgb(31, 127, 255)",
              fontFamily: "Inter",
              backgroundColor: "white",
              fonttax: "14px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
            }}
          >+ Add tax</a>
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
                  fonttax: 14,
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
                  fonttax: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                placeholder={t("Search by Tax Name or Tax Rate...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* export */}
            {hasPermission(user, "Tax", "Export") && (
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
                  fonttax: 14,
                  fontWeight: 400,
                  color: "#0E101A",
                  height: "33px",
                }}
                onClick={exportToExcel}
              >
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
                    fonttax: 14,
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
                        checked={filteredtaxs.length > 0 && selectedtaxs.length === filteredtaxs.length}
                        onChange={handleSelectAll}
                      />
                      <span className="checkmarks" />
                    </label>
                    {t("Tax Name")}
                  </div>
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fonttax: 14,
                    width: "auto",
                    fontWeight: "400",
                  }}>
                  {t("Tax Short Name")}
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fonttax: 14,
                    width: "auto",
                    fontWeight: "400",
                  }}>
                  {t("Tax Rate")}
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "4px 16px",
                    color: "#727681",
                    fonttax: 14,
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
                    fonttax: 14,
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
              ) : paginatedtaxs.length > 0 ? (
                paginatedtaxs.map((tax, index) => (
                  <tr
                    key={tax._id}
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
                            checked={selectedtaxs.includes(tax._id)}
                            onChange={() => handleCheckboxChange(tax._id)}
                          />
                          <span className="checkmarks" />
                        </label>
                        <div
                          style={{
                            fonttax: 14,
                            color: "#0E101A",
                            whiteSpace: "nowrap",
                            display: "flex",
                            gap: "5px",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                          }}>
                          {tax.taxName}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fonttax: 14,
                        color: "#0E101A",
                        cursor: "pointer",
                      }}>
                      {tax.taxShortName}
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fonttax: 14,
                        color: "#0E101A",
                        cursor: "pointer",
                      }}>
                      {tax.taxRate} {tax.taxRate === 0 ? "% (Exempt)" : "%"}
                    </td>
                    <td
                      style={{
                        padding: "4px 16px",
                        fonttax: 14,
                        color: "#0E101A",
                        cursor: "pointer",
                      }}>
                      {new Date(tax.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="" style={{
                      padding: "4px 16px",
                      position: "relative",
                      overflow: "visible",
                    }}>
                      {/* <div className="edit-delete-action">
                        {hasPermission(user, "tax", "update") && (
                          <a className="me-2 p-2" onClick={() => handleEditClick(tax)}>
                            <TbEdit />
                          </a>
                        )}
                        {hasPermission(user, "tax", "delete") && (
                          <a className="p-2" onClick={() => handleDeletetax(tax._id)}>
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
                                {hasPermission(user, "tax", "update") && (
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
                                    onClick={() => handleEditClick(tax)}
                                  >
                                    <img src={edit} alt="" />
                                    <span style={{ color: "black" }}>
                                      Edit
                                    </span>
                                  </div>
                                )}

                                {hasPermission(user, "tax", "delete") && (
                                  <div
                                    onClick={() => handleDeletetax(tax._id)}
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
                    >
                      No Tax Found
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
            total={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </div>

      </div>

      {showAddtaxModal && (
        <AddtaxModal
          show={showAddtaxModal}
          closeModal={() => setShowAddtaxModal(false)}
          fetchtaxs={fetchtaxs}
          cleanUpModal={cleanUpModal}
        />
      )}

      <EdittaxModal
        selectedtax={selectedtax}
        ontaxUpdated={fetchtaxs}
        cleanUpModal={cleanUpModal}
      />

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        itemName={t("tax")}
      />
    </div>
  );
};

export default Tax;
