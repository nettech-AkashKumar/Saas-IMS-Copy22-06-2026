import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// pages
import "../../../styles/category/category.css";
import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
import api from "../../../pages/config/axiosInstance.js";
import { useAuth } from "../../auth/AuthContext";
import Pagination from "../../../components/Pagination";
import DeleteModal from "../../ConfirmDelete.jsx";

// icons
import { IoIosSearch } from "react-icons/io";
import { TbFileExport } from "react-icons/tb";
import { AiOutlineThunderbolt } from "react-icons/ai";

// images
import edit from "../../../assets/images/edit.png";
import deletebtn from "../../../assets/images/delete.png";
import view from "../../../assets/images/view-details.png";
import AddAssignTarget from "./AddAssignTarget.jsx";

const AssignTarget = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("Broker");
  const [brokers, setBrokers] = useState([]);
  const [brokerTotalItems, setBrokerTotalItems] = useState(0);
  const [brokerCounts, setBrokerCounts] = useState({
    all: 0,
    active: 0,
    inactive: 0,
  });
  const [selectedBrokers, setSelectedBrokers] = useState(new Set());
  const [selectAllBrokersAcrossPages, setSelectAllBrokersAcrossPages] = useState(false);
  const brokerRowsCacheRef = useRef(new Map());
  const [salesmen, setSalesmen] = useState([]);
  const [salesmanTotalItems, setSalesmanTotalItems] = useState(0);
  const [salesmanCounts, setSalesmanCounts] = useState({ all: 0 });
  const [selectedSalesmen, setSelectedSalesmen] = useState(new Set());
  const [selectAllSalesmenAcrossPages, setSelectAllSalesmenAcrossPages] = useState(false);
  const salesmanRowsCacheRef = useRef(new Map());
  const [searchBroker, setSearchBroker] = useState("");
  const [searchSalesman, setSearchSalesman] = useState("");
  const [sortOrder, setSortOrder] = useState("Latest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteMode, setDeleteMode] = useState("single");
  const [showAddBrokerModal, setShowAddBrokerModal] = useState(false);
  const [showAddSalesmanModal, setShowAddSalesmanModal] = useState(false);
  const [viewOptions, setViewOptions] = useState(false);
  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [viewBrokerData, setViewBrokerData] = useState(null);
  const [viewSalesmanData, setViewSalesmanData] = useState(null);
  const [editDataBroker, setEditDataBroker] = useState(null);
  const [editDataSalesman, setEditDataSalesman] = useState(null);
  const [showAddAssignTraget, setshowAssignTraget] = useState(false);
  const [assignTargets, setAssignTargets] = useState([]);
  const [assignTargetTotalItems, setAssignTargetTotalItems] = useState(0);
  const [selectedSalesman, setSelectedSalesman] = useState("");
  const [selectedBroker, setSelectedBroker] = useState("");
  const [salesmanList, setSalesmanList] = useState([]);
  const [brokerList, setBrokerList] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState("");

  const fetchAssignTargets = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/assignTarget/get");

      let data = res.data.assignTargets || [];

      if (searchBroker.trim()) {
        const term = searchBroker.toLowerCase();
        data = data.filter(
          (item) =>
            item?.assignToType?.toLowerCase().includes(term) ||
            item?.assignedToName?.toLowerCase().includes(term) ||
            item?.duration?.toLowerCase().includes(term) ||
            item?.targetMetric?.toLowerCase().includes(term) ||
            item?.targetValue?.toString()?.includes(term) ||
            item?.type?.toLowerCase().includes(term) ||
            item?.assignToTarget?.salesmanName?.toLowerCase().includes(term) ||
            item?.assignToTarget?.brokerName?.toLowerCase().includes(term),
        );
      }

      if (selectedPerson) {
        data = data.filter(
          (item) => item?.assignToType === selectedPerson,
        );
      }

      if (sortOrder === "Latest") {
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else {
        data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }

      const totalItems = data.length;

      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedData = data.slice(startIndex, endIndex);

      setAssignTargets(paginatedData);
      setAssignTargetTotalItems(totalItems);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch assign targets",);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignTargets();
  }, [currentPage, itemsPerPage, searchBroker, selectedPerson, sortOrder]);

  const confirmDelete = async () => {
    try {
      setLoading(true);

      if (deleteMode === "single" && deleteTargetId) {
        await api.delete(`/api/assignTarget/delete/${deleteTargetId}`);

        toast.success("Assign Target deleted successfully");
      }

      fetchAssignTargets();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const handleDeleteAssignTarget = (id) => {
    setDeleteMode("single");
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const fetchFilterData = async () => {
    try {
      const [salesmanRes, brokerRes] = await Promise.all([
        api.get("/api/salesman/get"),
        api.get("/api/broker/get"),
      ]);

      setSalesmanList(salesmanRes.data.salesmen || []);
      setBrokerList(brokerRes.data.brokers || []);
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchFilterData();
  }, []);

  const cleanUpModal = () => {
    document.body.classList.remove("modal-open");
    document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());
    setTimeout(() => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }, 50);
  };

  const openDropdown = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      setOpenUpwards(true);
      setDropdownPos({ x: rect.left, y: rect.top - 6 });
    } else {
      setOpenUpwards(false);
      setDropdownPos({ x: rect.left, y: rect.bottom + 6 });
    }
    setViewOptions(viewOptions === index ? false : index);
  };

  const thStyle = {
    textAlign: "left",
    padding: "4px 16px",
    color: "#727681",
    fontSize: 14,
    fontWeight: "400",
  };
  const tdStyle = {
    padding: "4px 16px",
    fontSize: 14,
    color: "#0E101A",
    cursor: "pointer",
  };
  const actionMenuStyle = {
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
  };

  const ThreeDots = ({ index, onOpen }) => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        cursor: "pointer",
      }}
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
        onClick={(e) => onOpen(e, index)}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              background: "#6C748C",
              borderRadius: 2,
            }}
          />
        ))}
      </div>
    </div>
  );

  const DropdownMenu = ({ index, onEdit, onDelete, onView }) =>
    viewOptions === index ? (
      <div
        style={{
          position: "fixed",
          top: openUpwards ? dropdownPos.y - 80 : dropdownPos.y,
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
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={actionMenuStyle}
            className="button-action"
            onClick={onView}
          >
            <img src={view} alt="" />
            <span style={{ color: "black" }}>View</span>
          </div>
           {hasPermission(user, "AssignTarget", "update") && (
          <div
            style={actionMenuStyle}
            className="button-action"
            onClick={onEdit}
          >
            <img src={edit} alt="" />
            <span style={{ color: "black" }}>Edit</span>
          </div>
           )}
            {hasPermission(user, "AssignTarget", "delete") && (
          <div
            style={actionMenuStyle}
            className="button-action"
            onClick={onDelete}
          >
            <img src={deletebtn} alt="" />
            <span style={{ color: "black" }}>Delete</span>
          </div>
            )}
        </div>
      </div>
    ) : null;

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
          flexWrap: "wrap",
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
            Assign Target
          </h2>
        </div>

        {/* Right: Action Buttons */}
        {hasPermission(user, "AssignTarget", "create") && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: "33px",
            }}
          >
            <a
              title="Add Assign Button"
              className="button-hover"
              onClick={() => {
                setViewBrokerData(null);
                setEditDataBroker(null);
                setshowAssignTraget(true);
              }}
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
              + Assign Target
            </a>
          </div>
        )}
      </div>

      {/* /tab + search + list */}
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
        {/* tab + search bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Header */}
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
                fontSize: 16,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                lineHeight: "26.4px",
              }}
            >
              Track Target Performance
            </h2>
          </div>

          {/* Search Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
              width: "50%",
            }}
          >
            <div style={{
              padding: '8px 10px 8px 10px',
              border: "1px solid #EAEAEA",
              display: "flex",
              alignItems: "center",
              borderRadius: 8,
            }}>
              <select
                value={selectedPerson}
                onChange={(e) => {
                  setSelectedPerson(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  background: "#FCFCFC",
                  border: "none",
                  outline: "none",
                  gap: "5px",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
              >
                <option value="">All Type</option>
                <option value="Broker">Broker</option>
                <option value="Salesman">Salesman</option>
              </select>
            </div>
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
                placeholder="Search by Broker or Salesman..."
                value={searchBroker}
                onChange={(e) => {
                  setSearchBroker(e.target.value);
                  setCurrentPage(1);
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
          </div>
        </div>

        {/* table */}
        <div
          className="table-responsive"
          style={{
            overflowY: "auto",
            height: "calc(100vh - 310px)",
            maxHeight: "500px",
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
                    Type
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
                  Name
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
                  Duration
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
                  Target Metric
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
                  Target Value
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
                  Incentive
                </th>
                <th style={{ ...thStyle, textAlign: "center" }}>
                  {t("Action")}
                </th>
              </tr>
            </thead>
            <tbody style={{ overflowY: "auto" }}>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : assignTargets.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: 0 }}>
                    <div
                      style={{
                        marginTop: "20px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "rgba(255, 68, 31, 1)",
                      }}
                    >
                      No Assign Found
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {assignTargets.map((target, index) => (
                    <tr
                      key={target._id}
                      onClick={() => {
                        setEditDataBroker(null);
                        setViewBrokerData({
                          ...target,
                        });
                        setshowAssignTraget(true);
                      }}
                      style={{
                        borderBottom: "1px solid #EAEAEA",
                        height: "46px",
                      }}
                      className="table-hover"
                    >
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                      >
                        {target.assignToType || "-"}
                      </td>
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                      >
                        {target.assignedToName || "-"}
                      </td>
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                      >
                        {target.duration || "-"}
                      </td>
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                      >
                        {target.targetMetric || "-"}
                      </td>
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                      >
                        {target.targetValue ? `${target.targetMetric === "Amount" ? "₹ " : ""}` : ""}
                        {target.targetValue ? `${target.targetValue}` : ""}
                        {target.targetValue ? `${target.targetMetric === "Amount" ? "" : " Pieces"}` : "-"}
                      </td>
                      <td
                        style={{
                          padding: "4px 16px",
                          fontSize: 14,
                          color: "#0E101A",
                          cursor: "pointer",
                        }}
                      >
                        {target.type ? (target.type === "Percentage" ? "" : "₹ ") : ""}
                        {target.IncentiveValue ? target.IncentiveValue : "-"}
                        {target.type ? (target.type === "Percentage" ? "%" : "") : ""}
                      </td>
                      <td
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          ...tdStyle,
                          position: "relative",
                          overflow: "visible",
                          textAlign: "center",
                        }}
                      >
                        <ThreeDots index={index} onOpen={openDropdown} />
                        <DropdownMenu
                          index={index}
                          onView={() => {
                            setEditDataBroker(null);
                            setViewBrokerData({
                              ...target,
                            });
                            setshowAssignTraget(true);
                            setViewOptions(false);
                          }}
                          onEdit={() => {
                            setViewBrokerData(null);
                            setEditDataBroker({
                              ...target,
                            });
                            setshowAssignTraget(true);
                            setViewOptions(false);
                          }}
                          onDelete={() => {
                            handleDeleteAssignTarget(target._id);
                            setViewOptions(false);
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={currentPage}
            total={assignTargetTotalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {showAddAssignTraget && (
        <AddAssignTarget
          key={editDataBroker?._id || viewBrokerData?._id || "assign-target"}
          fetchAssignTargets={fetchAssignTargets}
          viewData={viewBrokerData}
          editData={editDataBroker}
          isView={!!viewBrokerData}
          cleanUpModal={cleanUpModal}
          closeModal={() => {
            setshowAssignTraget(false);
            setEditDataBroker(null);
            setViewBrokerData(null);
          }}
        />
      )}

      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          itemName="assign target"
        />
      )}
    </div>
  );
};

export default AssignTarget;
