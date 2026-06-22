import { useEffect, useState } from "react";
import axios from "axios";
import BASE_URL from "../config/config";
import "../../styles/permissions.css";
import { IoIosArrowDown } from "react-icons/io";
import { IoIosArrowUp } from "react-icons/io";
import { toast } from "react-toastify";
import api from "../../pages/config/axiosInstance"
import total_orders_icon from "../../assets/images/totalorders-icon.png";
import { Link } from "react-router-dom";

// ✅ Keep your modules in sync with sidebar
const modules = {
  Dashboard: ["Dashboard"],
  Connect: ["Chat", "Mail"],
  Inventory: [
    "Product",
    "Category",
    "SubCategory",
    "Brand",
    "Unit",
    "HSN",
    "VariantAttributes",
    "Warranties",
    "PrintBarcode",
  ],
  Peoples: ["Customer", "Supplier"],
  Warehouse: ["Warehouse", "Stock Movement Log"],
  Purchases: ["Purchase", "DebitNote"],
  Stocks: ["Stock", "StockAdjustment"],
  Sales: ["Sales", "Invoices", "POS", "CreditNote"],
  Promo: ["Coupons", "GiftCards"],
  Locations: ["Country", "State", "City"],
  "User Management": ["Users", "Roles"],
  Settings: [
    "Profile Settings",
    "Security",
    "Website",
    "CompanySettings",
    "Localization",
  ],
  Reports: ["PurchaseReport"],
  "Finance & Accounts": [
    "BalanceSheet",
    "ProfitLoss",
    "OverdueReport",
    "ExpenseReport",
    "B2B_B2C",
    "PaymentHistory",
    "CreditDebitNote",
  ],
};

const permissionFields = [
  "Read",
  "Write",
  "Update",
  "Delete",
  "Import",
  "Export",
];

// ✅ ToggleSwitch Component
const ToggleSwitch = ({ checked, onChange }) => (
  <label className="switch">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="slider"></span>
  </label>
);

const Permission = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/api/role/getRole');
      setRoles(res.data);
      
      // Set default selected role if none selected
      if (res.data.length > 0 && !selectedRole) {
        setSelectedRole(res.data[0]); // Select first role by default
      }
    } catch (err) {
      console.error("Error fetching roles", err);
      toast.error("Failed to load roles", {
        position: 'top-center'
      });
    }
  };

  useEffect(() => {
    if (selectedRole && selectedRole._id) {
      fetchRolePermissions(selectedRole._id);
    } else {
      // Clear permissions if no role is selected
      setRolePermissions({});
    }
  }, [selectedRole]);

  const fetchRolePermissions = async (roleId) => {
    // Add validation check
    if (!roleId || roleId === "undefined" || roleId === "null") {
      console.warn("Invalid role ID:", roleId);
      setRolePermissions({});
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/api/role/roleById/${roleId}`);
      setRolePermissions(res.data?.modulePermissions || {});
    } catch (err) {
      console.error("Error fetching role permissions", err);
      toast.error("Failed to load permissions for this role", {
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (module, field) => {
    setRolePermissions((prev) => {
      const current = prev[module] || {
        read: false,
        write: false,
        update: false,
        delete: false,
        import: false,
        export: false,
        all: false,
      };

      if (field === "Allow All") {
        const toggleAll = !current.all;
        return {
          ...prev,
          [module]: {
            read: toggleAll,
            write: toggleAll,
            update: toggleAll,
            delete: toggleAll,
            import: toggleAll,
            export: toggleAll,
            all: toggleAll,
          },
        };
      }

      const lowerKey = field.toLowerCase();
      const updated = { ...current, [lowerKey]: !current[lowerKey] };
      updated.all = [
        "read",
        "write",
        "update",
        "delete",
        "import",
        "export",
      ].every((key) => updated[key]);

      return { ...prev, [module]: updated };
    });
  };

  const handleGroupChange = (group) => {
    const groupModules = modules[group];

    setRolePermissions((prev) => {
      const updatedPermissions = { ...prev };
      // toggle: if first module of group is fully checked, uncheck all, else check all
      const first = prev[groupModules[0]] || {};
      const toggleOn = !(
        first.read &&
        first.write &&
        first.update &&
        first.delete &&
        first.import &&
        first.export
      );

      groupModules.forEach((m) => {
        updatedPermissions[m] = {
          read: toggleOn,
          write: toggleOn,
          update: toggleOn,
          delete: toggleOn,
          import: toggleOn,
          export: toggleOn,
          all: toggleOn,
        };
      });

      return updatedPermissions;
    });
  };

  const isGroupChecked = (group) => {
    const groupModules = modules[group];
    return groupModules.every((m) => {
      const perms = rolePermissions[m] || {};
      return (
        perms.read &&
        perms.write &&
        perms.update &&
        perms.delete &&
        perms.import &&
        perms.export
      );
    });
  };

  const handleSubmit = async () => {
    // FIXED: Add proper validation
    if (!selectedRole || !selectedRole._id || selectedRole._id === "undefined") {
      toast.info("Please select a valid role.", {
        position: 'top-center'
      });
      return;
    }

    try {
      // FIXED: Pass the role ID correctly
      await api.put(`/api/role/update/${selectedRole._id}`, {
        modulePermissions: rolePermissions
      });
      
      // FIXED: Refresh permissions with the correct role ID
      fetchRolePermissions(selectedRole._id);
      
      toast.success("Permissions updated successfully.", {
        position: 'top-center'
      });
    } catch (err) {
      console.error("Error updating permissions", err);
      toast.error("Failed to update permissions.", {
        position: 'top-center'
      });
    }
  };

  return (
  
        <div className="px-4 py-4">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Icon Container */}
            <Link to="/Users" style={{ textDecoration: "none" }}>
              <span
                style={{
                  backgroundColor: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "1px solid #FCFCFC",
                  cursor: "pointer",
                  marginBottom: "10px"
                }}
              >
                <img src={total_orders_icon} alt="total_orders_icon" />
              </span>
            </Link>
            <h4 className="roleshder">Roles & Permission</h4>
            <hr style={{ color: "#E6E6E6", height: "1px" }} />
          </div>

          <div className="mb-4">
            <label className="form-label slctlble">Select Role:</label>
            <select
              className="form-select slctlblechose"
              value={selectedRole?._id || ""}
              onChange={(e) => {
                const roleId = e.target.value;
                if (!roleId) {
                  setSelectedRole(null);
                  return;
                }
                
                const selected = roles.find((role) => role._id === roleId);
                if (selected) {
                  setSelectedRole(selected);
                }
              }}
            >
              <option value="">-- Select Role --</option>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.roleName} {role.status === "Inactive" ? "(Inactive)" : ""}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Loading permissions...</p>
          ) : selectedRole ? (
            <>
              <div className="mb-3">
                <h5>Editing permissions for: <strong>{selectedRole.roleName}</strong></h5>
              </div>
              
              {Object.entries(modules).map(([group, modules]) => {
                const expanded = expandedGroups[group] ?? false;
                return (
                  <div key={group} className="mb-3 border rounded">
                    {/* group header */}
                    <div
                      className="d-flex align-items-center justify-content-between p-2"
                      style={{ background: "#f5f5f5", cursor: "pointer" }}
                      onClick={() => toggleGroup(group)}
                    >
                      <div>
                        <input
                          type="checkbox"
                          checked={isGroupChecked(group)}
                          title={`Select all for ${group}`}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleGroupChange(group);
                          }}
                        />{" "}
                        <strong>{group}</strong>
                      </div>
                      <span>
                        {expanded ? <IoIosArrowDown /> : <IoIosArrowUp />}
                      </span>
                    </div>
                    {expanded && (
                      <table className="table table-bordered tpermsion">
                        <thead className="tpermsionthd">
                          <tr>
                            <th>{group}</th>
                            <th className="text-center">Allow All</th>
                            {permissionFields.map((perm) => (
                              <th key={perm} className="text-center">
                                {perm}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {modules.map((module) => {
                            const perms = rolePermissions[module] || {};
                            return (
                              <tr key={module}>
                                <td style={{ paddingLeft: "30px" }}>{module}</td>
                                <td className="text-center">
                                  <ToggleSwitch
                                    checked={!!perms.all}
                                    onChange={() =>
                                      handlePermissionChange(module, "Allow All")
                                    }
                                  />
                                </td>
                                {permissionFields.map((p) => {
                                  const key = p.toLowerCase();
                                  return (
                                    <td key={p} className="text-center">
                                      <ToggleSwitch
                                        checked={!!perms[key]}
                                        onChange={() =>
                                          handlePermissionChange(module, p)
                                        }
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
              <button className="btn btn-primary mt-3" onClick={handleSubmit}>
                Save Permissions
              </button>
            </>
          ) : (
            <p>Please select a role to edit permissions.</p>
          )}
        </div>
     
  );
};

export default Permission;