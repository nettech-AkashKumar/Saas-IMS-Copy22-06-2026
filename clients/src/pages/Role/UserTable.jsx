// components/Users/UserTable.jsx
import React, { useState } from "react";
import { BsThreeDots } from "react-icons/bs";
import { HiOutlineArrowsUpDown } from "react-icons/hi2";
import { FiEdit } from "react-icons/fi";
import { MdRemoveRedEye, MdOutlineChangeCircle } from "react-icons/md";
import DeleteICONImg from "../../assets/images/delete.png";
import ViewDetailsImg from "../../assets/images/view-details.png";
import EditICONImg from "../../assets/images/edit.png";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { hasPermission } from "../../utils/permission/hasPermission";
import ProductDefaultImage from '../../assets/images/product-default.png'
import { useAuth } from "../../components/auth/AuthContext";

const UserTable = ({
  users = [],
  loading = false,
  onEdit,
  onDelete,
  onViewDetails,
  openMenuIndex,
  setOpenMenuIndex,
  menuRef,
  selectedUsersForExport,
  handleCheckboxChange,
  selectAllForExport,
  handleSelectAllForExport,
  onRowClick,
}) => {
  const { user } = useAuth();
  const getStatusStyle = (status) => {
    switch (status) {
      case "Active":
        return { backgroundColor: "#D4F7C7", color: "#01774B" };
      case "Inactive":
        return { backgroundColor: "#F7C7C9", color: "#A80205" };
      case "Blacklist":
        return { backgroundColor: "#BBE1FF", color: "#003E70" };
      default:
        return { backgroundColor: "#EAEAEA", color: "#727681" };
    }
  };

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

  const formatLastLogin = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  if (loading) {
    return <div className="text-center py-5">Loading users...</div>;
  }

  if (users.length === 0) {
    return <div className="text-center py-5 text-muted">No users found</div>;
  }

  
const getPermissionsSummaryForRole = (role) => {
  if (!role || !role.modulePermissions || Object.keys(role.modulePermissions).length === 0) {
    return "Limited";
  }

  const allFull = Object.values(role.modulePermissions).every(modulePerms => {
    return modulePerms.create && modulePerms.read && modulePerms.update && modulePerms.delete;
  });

  return allFull ? "Full" : "Limited";
};

  return (
    <table
      style={{
        width: "100%",
        borderSpacing: "0 0px",
        fontFamily: "Inter",
      }}
    >
      <thead style={{ position: "sticky", top: 0, zIndex: 9 }}>
        <tr style={{ backgroundColor: "#F3F8FB", textAlign: "left" }}>
          <th
            style={{ padding: "8px 16px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="checkbox"
              id="select-all-users"
              checked={selectAllForExport}
              onChange={handleSelectAllForExport}
              style={{ marginRight: "8px" }}
              />
            <span style={{
              color: "#727681",
              fontSize: "14px",
              fontWeight: 400,
            }}>
              User
              </span>
            </div>
          </th>
          <th
            style={{
              padding: "12px 16px",
              color: "#727681",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Roles
          </th>
          <th
            style={{
              padding: "12px 16px",
              color: "#727681",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Last Login
          </th>
          <th
            style={{
              padding: "12px 16px",
              color: "#727681",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Permissions
          </th>
          <th
            style={{
              padding: "12px 16px",
              color: "#727681",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Status
            <HiOutlineArrowsUpDown style={{ marginLeft: "10px" }} />
          </th>
          <th
            style={{
              padding: "12px 16px",
              color: "#727681",
              fontSize: "14px",
              fontWeight: 400,
            }}
          >
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        {users.map((user, index) => (
          <tr
            key={user._id || index}
            onClick={(e) => onRowClick?.(user, e)}
            style={{cursor:"pointer",
              borderBottom: "1px solid #EAEAEA",
              // height: "46px",
            }}
            className={`table-hover ${activeRow === index ? "active-row" : ""}`}
          >
            {/* User column */}
            <td style={{ padding: "4px 16px" }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <input
                  type="checkbox"
                  checked={selectedUsersForExport.includes(user._id)}
                  onChange={() => handleCheckboxChange(user._id)}
                  style={{ marginRight: "8px" }}
                />
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "#D9D9D9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#727681",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      <img src={ProductDefaultImage} alt='Product Default Image' className="media-image" />
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0px",
                    }}
                  >
                    <span style={{ color: "#0E101A", fontSize: "14px" }}>
                      {user.name || "Unknown User"}
                    </span>
                    <span style={{ color: "#727681", fontSize: "14px" }}>
                      {user.email || "No email"}{" "}
                      {user.phone ? `& ${user.phone}` : ""}
                    </span>
                  </div>
                </div>
              </div>
            </td>

            {/* Role */}
            <td
              style={{
                padding: "4px 16px",
                color: "#0E101A",
                fontSize: "14px",
              }}
            >
              {user.role?.roleName || "No Role"}
            </td>

            {/* Last Login */}
            <td
              style={{
                padding: "4px 16px",
                color: "#0E101A",
                fontSize: "14px",
              }}
            >
              {formatLastLogin(user.lastLogin)}
            </td>

            {/* Permissions */}
            <td
              style={{
                padding: "4px 16px",
                color: "#0E101A",
                fontSize: "14px",
              }}
            >
              {/* {user.role?.permissions ? "Limited" : "Full"} */}
                 {getPermissionsSummaryForRole(user.role)}
            </td>

            {/* Status */}
            <td style={{ padding: "4px 16px" }}>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: "50px",
                  fontSize: "14px",
                  ...getStatusStyle(user.status),
                }}
              >
                {user.status || "Active"}
              </span>
            </td>

            {/* Actions */}
            <td style={{ padding: "4px 16px", textAlign: "center", position: "relative" }}>

              <button
                onClick={(e) => {
                  const rect =
                    e.currentTarget.getBoundingClientRect();e.stopPropagation();
                  setOpenMenuIndex(openMenuIndex === index ? null : index)

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
              >
                <HiOutlineDotsHorizontal size={28} color="grey" />
              </button>

              {openMenuIndex === index && (
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
                    ref={menuRef}
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
                    <ul
                      style={{
                        listStyle: "none",
                        marginBottom: "0",
                        display: "flex",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: "10px",
                        cursor: 'pointer'
                      }}
                    >
                       {/* {hasPermission(user, "Users", "update") && ( */}
                      <li
                        onClick={() => {
                          onEdit?.(user);
                          setOpenMenuIndex(null);
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
                        }}
                      >
                        <img src={EditICONImg} alt="cat_actions_icon" />
                        <label
                          style={{
                            color: "#0E101A",
                            fontFamily: "Inter",
                            fontSize: "16px",
                            textDecoration: "none",
                          }}
                        >
                          Edit
                        </label>
                      </li>
                      {/* )} */}
                      {/* <li
                        onClick={() => {
                          onViewDetails?.(user);
                          setOpenMenuIndex(null);
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
                        }}
                      >
                        <img src={ViewDetailsImg} alt="cat_actions_icon" />
                        <label
                          style={{
                            color: "#0E101A",
                            fontFamily: "Inter",
                            fontSize: "16px",
                            textDecoration: "none",
                          }}
                        >
                          View Details
                        </label>
                      </li> */}
                      {/* {hasPermission(user, "Users", "delete") && ( */}
                      <li
                        onClick={() => {
                          onDelete?.(user);
                          setOpenMenuIndex(null);
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
                        }}
                      >
                        <img src={DeleteICONImg} alt="cat_actions_icon" />
                        <label
                          style={{
                            color: "#0E101A",
                            fontFamily: "Inter",
                            fontSize: "16px",
                            textDecoration: "none",
                          }}
                        >
                          Delete
                        </label>
                      </li>
                      {/* )} */}
                    </ul>
                  </div>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UserTable;
