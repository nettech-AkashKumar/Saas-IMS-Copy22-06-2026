// pages/Role/Role.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUser } from "react-icons/fa";
import { BsThreeDots } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import { LuUserPlus } from "react-icons/lu";
import { TbFileExport } from "react-icons/tb";
import Pagination from "../../components/Pagination";
import ConfirmDeleteModal from "../../components/ConfirmDelete";
import api from "../../pages/config/axiosInstance";

const Role = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/role/getRole");
      setRoles(res.data || []);
    } catch (err) {
      console.error("Error fetching roles", err);
      // toast.error("Failed to load roles");
      toast.error(err?.response?.data?.displayMessage ||
                err?.response?.data?.message || 
                err?.message || 
                "Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  // Filter roles based on search
  const filteredRoles = roles.filter((role) =>
    role.roleName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Paginate roles
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle delete
  const handleDelete = async () => {
    try {
      await api.delete(`/api/role/delete/${selectedRole._id}`);
      toast.success("Role deleted successfully!");
      fetchRoles();
      setShowDeleteModal(false);
      setSelectedRole(null);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to delete role";
      // toast.error(errorMessage);
      toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message || 
                error?.message || 
                "Failed to delete role");
    }
  };

  // Menu items for actions
  const menuItems = [
    {
      label: "Edit",
      action: "edit",
    },
    {
      label: "View Permissions",
      action: "permissions",
    },
    {
      label: "Delete",
      action: "delete",
      color: "#dc3545",
    },
  ];

  const handleMenuAction = (action, role) => {
    setOpenMenuIndex(null);
    switch (action) {
      case "edit":
        navigate(`/edit-role/${role._id}`, { state: { role } });
        break;
      case "permissions":
        localStorage.setItem("selectedRoleName", role.roleName);
        navigate("/permissions", { state: { role } });
        break;
      case "delete":
        setSelectedRole(role);
        setShowDeleteModal(true);
        break;
      default:
        break;
    }
  };

  // Get permissions summary
  const getPermissionsSummary = (role) => {
    if (!role.sections || role.sections.length === 0) return "Limited";

    // Check if all permissions in all modules are enabled
    const allFull = role.sections.every(section =>
      section.modules.every(module => {
        if (!module.checked) return false;
        const perms = module.permissions || {};
        return perms.create && perms.read && perms.update && perms.delete;
      })
    );

    return allFull ? "Full" : "Limited";
  };

  // Handle export
  const handleExport = async (format) => {
    try {
      if (format === 'pdf') {
        // Implement PDF export
        toast.info("PDF export coming soon");
      } else if (format === 'excel') {
        // Implement Excel export
        toast.info("Excel export coming soon");
      }
    } catch (error) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div style={{ fontFamily: '"Inter", sans-serif' }}>

          {/* Main Card */}
          <div style={{ background: "white", borderRadius: 16, padding: 20 }}>
            {/* Search + Export */}
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-end  mb-4">
              <div className="d-flex align-items-center gap-3">
                {/* Search */}
                <div
                  className="d-flex align-items-center search-box"
                  style={{
                    background: "#FCFCFC",
                    padding: "4px 20px",
                    borderRadius: 8,
                    border: "1px solid #EAEAEA",
                    minHeight: 32,
                  }}
                >
                  <FiSearch style={{ color: "#14193D66" }} />
                  <input
                    className="form-control border-0 shadow-none"
                    style={{ background: "transparent", padding: 0 }}
                    placeholder="Search roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                {/* Export dropdown */}
                <div className="dropdown">
                  <button
                    className="btn d-flex align-items-center"
                    style={{
                      background: "#FCFCFC",
                      border: "1px solid #EAEAEA",
                      borderRadius: 8,
                      padding: "4px 14px",
                      fontSize: "14px",
                      color: "#0E101A",
                      height: "32px",
                      fontWeight: 500,
                    }}
                    type="button"
                    id="exportDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <TbFileExport style={{ color: "#14193D66", marginRight: "10px" }} />
                    Export
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="exportDropdown">
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => handleExport('pdf')}
                      >
                        Export as PDF
                      </button>
                    </li>
                    <li>
                      <button
                        className="dropdown-item"
                        onClick={() => handleExport('excel')}
                      >
                        Export as Excel
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive" style={{ maxHeight: "600px" }}>
              <table
                className="table mb-0"
                style={{ borderSpacing: 0, borderCollapse: "separate" }}
              >
                <thead>
                  <tr>
                    {["Roles", "Members", "Permissions", "Actions"].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          backgroundColor: "#F3F8FB",
                          fontWeight: 400,
                          fontSize: 14,
                          color: "#727681",
                          padding: "12px 16px",
                          position: "sticky",
                          top: 0,
                          zIndex: 10,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5">
                        Loading roles...
                      </td>
                    </tr>
                  ) : paginatedRoles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5 text-muted">
                        {searchTerm ? "No roles found matching your search" : "No roles found"}
                      </td>
                    </tr>
                  ) : (
                    paginatedRoles.map((role, index) => (
                      <tr key={role._id} style={{ verticalAlign: "middle" }}>
                        {/* Role Name */}
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 14, color: "#0E101A" }}>
                            {role.roleName}
                          </div>
                        </td>

                        {/* Members Count */}
                        <td style={{ padding: "14px 16px" }}>
                          <div className="d-flex align-items-center" style={{ gap: 8 }}>
                            <span style={{ color: "#0E101A", fontSize: 14 }}>
                              {role.memberCount || 0}
                            </span>
                            <FaUser style={{ color: "#6C748C", fontSize: 14 }} />
                          </div>
                        </td>

                        {/* Permissions */}
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              padding: "4px 12px",
                              borderRadius: "50px",
                              fontSize: "14px",
                              backgroundColor: getPermissionsSummary(role) === "Full" ? "#D4F7C7" : "#F7C7C9",
                              color: getPermissionsSummary(role) === "Full" ? "#01774B" : "#A80205",
                            }}
                          >
                            {getPermissionsSummary(role)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "8px 16px", position: "relative" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "start",
                              alignItems: "center",
                              position: "relative",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuIndex(openMenuIndex === index ? null : index);
                            }}
                          >
                            {/* Three dots button */}
                            <div
                              style={{
                                width: 24,
                                height: 24,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
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

                            {/* Dropdown menu */}
                            {openMenuIndex === index && (
                              <div
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                  right: 0,
                                  marginTop: 6,
                                  width: 180,
                                  backgroundColor: "#fff",
                                  borderRadius: 12,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  border: "1px solid #E5E7EB",
                                  zIndex: 9999,
                                  overflow: "hidden",
                                }}
                              >
                                {menuItems.map((item) => (
                                  <div
                                    key={item.action}
                                    onClick={() => handleMenuAction(item.action, role)}
                                    className="button-action"
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 12,
                                      padding: "10px 12px",
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: 14,
                                      fontWeight: 400,
                                      cursor: "pointer",
                                      color: item.color || "#333",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "#e3f2fd";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "transparent";
                                    }}
                                  >
                                    <span>{item.label}</span>
                                  </div>
                                ))}
                              </div>
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
                total={filteredRoles.length}
                itemsPerPage={itemsPerPage}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </div>

          {/* Confirm Delete Modal */}
          <ConfirmDeleteModal
            isOpen={showDeleteModal}
            onCancel={() => {
              setShowDeleteModal(false);
              setSelectedRole(null);
            }}
            onConfirm={handleDelete}
            title="Delete Role"
            message="Are you sure you want to delete this role? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
          />
        </div>
      </div>
    </div>
  );
};

export default Role;