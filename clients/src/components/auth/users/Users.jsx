// pages/Users/Users.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiSearch } from "react-icons/fi";
import { LuUserPlus } from "react-icons/lu";
import { TbFileExport } from "react-icons/tb";
import Select from "react-select";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from "file-saver";
import { RxCross2 } from "react-icons/rx";

import Pagination from "../../../components/Pagination";
import ConfirmDeleteModal from "../../../components/ConfirmDelete";
import UserTable from "../../../pages/Role/UserTable";
import RoleTable from "../../../pages/Role/RoleTable";
import api from "../../../pages/config/axiosInstance";
import Iconss from "../../../assets/images/Iconss.png";
import { FaArrowLeft } from "react-icons/fa";
import { IoSearch } from "react-icons/io5";
import UserDetails from "./UserDetails";
import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { hasPermission } from "../../../utils/permission/hasPermission";
import { useAuth } from "../../auth/AuthContext";


const Users = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Active tab state
  const [activeTab, setActiveTab] = useState("user");

  // User states
  const [users, setUsers] = useState([]);
  const [activeRoles, setActiveRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedUsersForExport, setSelectedUsersForExport] = useState([]);
  const [selectAllForExport, setSelectAllForExport] = useState(false);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const menuRef = useRef(null);
  //this state for switching inside role tabe user
  const [roleViewMode, setRoleViewMode] = useState("roles"); // roles | users
  const [selectedRoleForView, setSelectedRoleForView] = useState(null);
  const [selectedRolesForExport, setSelectedRolesForExport] = useState([]);
  const [selectAllRolesForExport, setSelectAllRolesForExport] = useState(false);


  // Role states
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);

  // Modal states
  const [openModal, setOpenModal] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(false);
  const [frontErrorMessage, setFrontErrorMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDetailsModal, setOPenDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleDeleteModal, setShowRoleDeleteModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Active");
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedRoleForForm, setSelectedRoleForForm] = useState(null);
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const detailsRef = useRef(null);
  const [fileError, setFileError] = useState("");

  // State for edit user
  const [editUserData, setEditUserData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "",
    status: "Active",
    profileImage: null,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [roleCurrentPage, setRoleCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Validation rules
  const nameRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const [errors, setErrors] = useState({});

  // Fetch data
  // useEffect(() => {
  //   if (activeTab === "user") {
  //     fetchUsers();
  //     fetchActiveRoles();
  //   } else {
  //     fetchRoles();
  //   }
  // }, [activeTab]);

  useEffect(() => {
    fetchUsers();
    fetchActiveRoles();
    fetchRoles();
  }, []);

  useEffect(() => {
    if (activeTab === "user") {
      fetchUsers();
      fetchActiveRoles();
    } else if (activeTab === "roles") {
      fetchRoles();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/api/user/getuser`);
      // console.log("fetchuserddd", res.data)
      setUsers(res.data || []);
    } catch (error) {
      // console.error(err);
      if (error?.response?.data?.errors) {
        // If backend returns field-specific errors
        setErrors(error.response.data.errors);
      } else {
        // Show general error message
        setFrontErrorMessage(
          error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          "Failed to load user"
        );
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setFrontErrorMessage("");
        }, 3000);
      }
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/api/role/getRole");
      setRoles(res.data || []);
    } catch (error) {
      // toast.error("Failed to load roles");
      if (error?.response?.data?.errors) {
        // If backend returns field-specific errors
        setErrors(error.response.data.errors);
      } else {
        // Show general error message
        setFrontErrorMessage(
          error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          "Failed to load roles"
        );
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setFrontErrorMessage("");
        }, 3000);
      }
    }
  };

  // First, update the fetchActiveRoles function to ensure it's working correctly:
  const fetchActiveRoles = async () => {
    try {
      const res = await api.get("/api/role/getRole/active");
      // console.log("Active roles response:", res.data);

      // ✅ Data already formatted for react-select
      setActiveRoles(res.data || []);
    } catch (error) {
      // console.error("Error fetching active roles", error);
      // toast.error("Failed to load roles");
      if (error?.response?.data?.errors) {
        // If backend returns field-specific errors
        setErrors(error.response.data.errors);
      } else {
        // Show general error message
        setFrontErrorMessage(
          error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          "Failed to load roles"
        );
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setFrontErrorMessage("");
        }, 3000);
      }
    }
  };
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
        setOpenMenuIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter data
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const fullName = (user.name || "").toLowerCase();
      const email = (user.email || "").toLowerCase();
      const phone = (user.phone || "").toLowerCase();
      const search = (searchTerm || "").trim().toLowerCase();

      const matchesSearch = fullName.includes(search) || email.includes(search) || phone.includes(search);
      const matchesStatus = selectedStatus
        ? (user.status || "").toLowerCase() === selectedStatus.toLowerCase()
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, selectedStatus, users]);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) =>
      role.roleName?.toLowerCase().includes(roleSearchTerm.toLowerCase())
    );
  }, [roles, roleSearchTerm]);

  // Reset page when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setSelectAllForExport(false);
      return;
    }

    const allSelected = filteredUsers.every(user =>
      selectedUsersForExport.includes(user._id)
    );

    setSelectAllForExport(allSelected);
  }, [selectedUsersForExport, filteredUsers]);

  useEffect(() => {
    if (filteredRoles.length === 0) {
      setSelectAllRolesForExport(false);
      return;
    }

    const allSelected = filteredRoles.every(role =>
      selectedRolesForExport.includes(role._id)
    );

    setSelectAllRolesForExport(allSelected);
  }, [selectedRolesForExport, filteredRoles]);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setRoleCurrentPage(1);
  }, [activeTab]);

  // Paginate data
  const paginatedUsers = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const paginatedRoles = useMemo(() => {
    const indexOfLastItem = roleCurrentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredRoles.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredRoles, roleCurrentPage, itemsPerPage]);

  // Validation for create user
  const validateForm = () => {
    let newErrors = {};

    // Name validation - prevent numbers
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (/\d/.test(name)) {
      newErrors.name = "Name cannot contain numbers";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone validation - only digits, exactly 10
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = "Phone must be exactly 10 digits";
    } else if (!/^\d+$/.test(cleanPhone)) {
      newErrors.phone = "Phone must contain only numbers";
    }

    // Role validation
    if (!selectedRoleForForm) {
      newErrors.role = "Role is required";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (!passwordRegex.test(password)) {
      newErrors.password = "Password must be 8+ chars, include uppercase, lowercase, number & symbol";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateUpdateForm = () => {
    let newErrors = {};

    // Name validation - prevent numbers
    if (!editUserData.name?.trim()) {
      newErrors.name = "Name is required";
    } else if (/\d/.test(editUserData.name)) {
      newErrors.name = "Name cannot contain numbers";
    } else if (editUserData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    if (!editUserData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(editUserData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone validation - only digits, exactly 10
    const cleanPhone = editUserData.phone?.replace(/\D/g, '') || '';
    if (!cleanPhone) {
      newErrors.phone = "Phone number is required";
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = "Phone must be exactly 10 digits";
    } else if (!/^\d+$/.test(cleanPhone)) {
      newErrors.phone = "Phone must contain only numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (value, isEdit = false) => {
    // Only allow letters and spaces
    const cleaned = value.replace(/[^A-Za-z\s]/g, '');
    if (isEdit) {
      setEditUserData({ ...editUserData, name: cleaned });
      // Clear error while typing
      if (errors.name) {
        setErrors(prev => ({ ...prev, name: '' }));
      }
    } else {
      setName(cleaned);
      if (errors.name) {
        setErrors(prev => ({ ...prev, name: '' }));
      }
    }
  };

  const handlePhoneChange = (value, isEdit = false) => {
    // Only allow digits, max 10
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    if (isEdit) {
      setEditUserData({ ...editUserData, phone: cleaned });
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    } else {
      setPhone(cleaned);
      if (errors.phone) {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    }
  };

  const handleEmailChange = (value, isEdit = false) => {
    if (isEdit) {
      setEditUserData({ ...editUserData, email: value });
      if (errors.email) {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    } else {
      setEmail(value);
      if (errors.email) {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }
  };
  // Handle create user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Await the async validation
    const isValid = await validateForm();
    if (!isValid) {
      setLoading(false);
      return;
    }

    const formData = new FormData();
    const cleanPhone = phone.replace(/\D/g, '');

    formData.append("name", name);
    formData.append("username", username);
    formData.append("email", email);
    formData.append("phone", cleanPhone);
    formData.append("password", password);
    formData.append("role", selectedRoleForForm?.value || "");

    if (selectedImages.length > 0) {
      selectedImages.forEach((file) => {
        formData.append("profileImage", file);
      });
    }

    try {
      const res = await api.post(`/api/user/add`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // toast.success("User added successfully!");

      // Reset form
      setName("");
      setUsername("");
      setEmail("");
      setPhone("");
      setPassword("");
      setSelectedRoleForForm(null);
      setSelectedImages([]);
      setErrors({});

      // Show success message
      setSuccessMessage(true);
      setTimeout(() => {
        setSuccessMessage(false);
        setOpenModal(false);
      }, 1500);

      fetchUsers();
    } catch (error) {
      if (error?.response?.data?.errors) {
        // If backend returns field-specific errors
        setErrors(error.response.data.errors);
      } else {
        // Show general error message
        setFrontErrorMessage(
          error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          "Failed to add user"
        );
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setFrontErrorMessage("");
        }, 3000);
      }
    } finally {
      setLoading(false)
    }
  };


  // Handle update user
  const handleUpdate = async (e) => {
    e.preventDefault();
    const isValid = await validateUpdateForm();
    if (!isValid) return;

    try {
      const formData = new FormData();
      const cleanPhone = editUserData.phone.replace(/\D/g, '');
      formData.append("name", editUserData.name);
      formData.append("username", editUserData.username);
      formData.append("email", editUserData.email);
      formData.append("phone", cleanPhone);
      formData.append("status", editUserData.status);

      if (editUserData.role?.value) {
        formData.append("role", editUserData.role.value);
      }

      if (editUserData.profileImage && typeof editUserData.profileImage !== "string") {
        formData.append("profileImage", editUserData.profileImage);
      }

      await api.put(`/api/user/update/${editUserId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("User updated successfully");
      // 🔥 HARD REFRESH
      setTimeout(() => {
        window.location.reload();
      }, 300);
      fetchUsers();
      setOpenModal(false);
      setEditUserId(null);
      setErrors({});
    } catch (error) {
      if (error?.response?.data?.errors) {
        // If backend returns field-specific errors
        setErrors(error.response.data.errors);
      } else {
        // Show general error message
        setFrontErrorMessage(
          error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          "Failed to update user"
        );
        // Auto-hide after 3 seconds
        setTimeout(() => {
          setFrontErrorMessage("");
        }, 3000);
      }
      // console.error(error);
    }
  };

  // handle user row click
  const handleUserROwClick = (user, event) => {
    if (!event.target.closest('input[type="checkbox"]') &&
      !event.target.closest('.button-action')
    ) {
      setSelectedUser(user);
      setOPenDetailsModal(true);
    }
  }

  // Open edit modal
  const handleOpenEditModal = (user) => {
    // console.log("User data for edit:", user);

    const selectedRole = activeRoles.find(
      (role) => role.value === user.role?._id
    );

    setEditUserId(user._id);
    setEditUserData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || "",
      role: selectedRole || null,
      status: user.status || "Active",
      profileImage:
        typeof user.avatar === "string" ? user.avatar : user.avatar || null,
    });

    setOpenModal("edit");
  };

  // Handle file changes
  // const handleFileChange = (e) => {
  //   const files = Array.from(e.target.files);
  //   const oversizedFile = files.find((file) => file.size > 1 * 1024 * 1024);
  //   if (oversizedFile) {
  //     toast.error(`File ${oversizedFile.name} exceeds 1MB size limit.`);
  //     e.target.value = null;
  //     return;
  //   }
  //   setSelectedImages(files);
  // };
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const oversizedFile = files.find((file) => file.size > 1 * 1024 * 1024);
    if (oversizedFile) {
      setFileError(`File ${oversizedFile.name} exceeds 1MB size limit.`);
      e.target.value = null;
      return;
    }
    setFileError("");  // clear error on valid file
    setSelectedImages(files);
  };

  // const handleEditFileChange = (e) => {
  //   const file = e.target.files[0];
  //   if (file && file.size > 1 * 1024 * 1024) {
  //     toast.error(`File ${file.name} exceeds 1MB size limit.`);
  //     e.target.value = null;
  //     return;
  //   }
  //   setEditUserData({
  //     ...editUserData,
  //     profileImage: file,
  //   });
  // };

  // Checkbox handlers
  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 1 * 1024 * 1024) {
      setFileError(`File ${file.name} exceeds 1MB size limit.`);
      e.target.value = null;
      return;
    }
    setFileError("");  // clear error on valid file
    setEditUserData({
      ...editUserData,
      profileImage: file,
    });
  };

  const handleCheckboxChange = (id) => {
    setSelectedUsersForExport((prev) => {
      if (prev.includes(id)) {
        return prev.filter(userId => userId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllForExport = () => {
    if (selectAllForExport) {
      setSelectedUsersForExport([]);
    } else {
      setSelectedUsersForExport(filteredUsers.map(user => user._id));
      // setSelectAllForExport(true);
    }
  };

  // Handle exports
  const handleExport = (format) => {
    if (activeTab === "user") {
      handleExportUsers(format);
    } else if (activeTab === "roles") {
      handleExportRoles(format);
    }
  };

  const handleExportUsers = (format) => {
    const usersToExport = filteredUsers.filter(user =>
      selectedUsersForExport.includes(user._id)
    );

    if (usersToExport.length === 0) {
      toast.error("Select at least 1 users");
      return;
    }

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text("User List", 14, 16);
      const tableColumn = ["Sr no.", "Name", "Email", "Role", "Phone", "Status", "Last Login"];
      const tableRows = [];
      usersToExport.forEach((user, index) => {
        const userData = [
          index + 1,
          user.name,
          user.email,
          user.roleName || user.role?.roleName || "N/A",
          user.phone,
          user.status || "N/A",
          user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never"
        ];
        tableRows.push(userData);
      });
      autoTable(doc, {
        startY: 20,
        head: [tableColumn],
        body: tableRows,
      });
      doc.save('user_list.pdf');
    }
  };

  const handleExportRoles = (format) => {
    const rolesToExport = filteredRoles.filter(role =>
      selectedRolesForExport.includes(role._id)
    );

    if (rolesToExport.length === 0) {
      toast.error("Select at least 1 roles");
      return;
    }

    if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text("Role List", 14, 16);
      const tableColumn = ["Sr no.", "Role Name", "Status", "Created At"];
      const tableRows = [];
      rolesToExport.forEach((role, index) => {
        // const roleData = [
        //   index + 1,
        //   role.roleName || "N/A",
        //   role.isActive ? "Active" : "Inactive",
        //   role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "N/A"
        // ];
        const roleData = [
          index + 1,
          role.roleName || "N/A",
          role.status || "N/A",                     // ✅ matches the table's displayed status
          role.createdAt ? new Date(role.createdAt).toLocaleDateString() : "N/A"
        ];
        tableRows.push(roleData);
      });
      autoTable(doc, {
        startY: 20,
        head: [tableColumn],
        body: tableRows,
      });
      doc.save('role_list.pdf');
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await api.delete(`/api/user/userDelete/${selectedUser._id}`);
      toast.success("User deleted successfully!");
      fetchUsers();
    } catch (error) {
      // toast.error("Failed to delete user");
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete user");
    } finally {
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  // Handle delete role
  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    try {
      await api.delete(`/api/role/delete/${selectedRole._id}`);
      toast.success("Role deleted successfully!");
      fetchRoles();
    } catch (error) {
      // toast.error("Failed to delete role");
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete role");
    } finally {
      setShowRoleDeleteModal(false);
      setSelectedRole(null);
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setName("");
    setUsername("");
    setEmail("");
    setPhone("");
    setPassword("");
    setSelectedRoleForForm(null);
    setSelectedImages([]);
    setErrors({});
    setFileError("");
  };

  // Status style function
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

  // Format last login
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
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Render search and filters based on active tab
  const renderSearchAndFilters = () => {
    if (activeTab === "user") {
      return (
        <>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              width: "150px",
              padding: "6px 16px 6px 15px",
              backgroundColor: "#FCFCFC",
              border: "1px solid #EAEAEA",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 400,
              color: "rgba(19, 25, 61, 0.40)",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blacklist">Blacklist</option>
          </select>
          <div
            style={{
              width: "100%",
              position: "relative",
              padding: "4px 8px 4px 20px",
              display: "flex",
              borderRadius: 8,
              alignItems: "center",
              background: "#FCFCFC",
              border: "1px solid #EAEAEA",
              gap: "5px",
              color: "rgba(19.75, 25.29, 61.30, 0.40)",
            }}
          >
            <IoSearch className="fs-5" />
            <input
              type="search"
              placeholder="Search Users..."
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 14,
                background: "#FCFCFC",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </>
      );
    } else {
      return (
        <div
          className=""
          style={{
            width: "100%",
            position: "relative",
            padding: "4px 8px 4px 20px",
            display: "flex",
            borderRadius: 8,
            alignItems: "center",
            background: "#FCFCFC",
            border: "1px solid #EAEAEA",
            gap: "5px",
            color: "rgba(19.75, 25.29, 61.30, 0.40)",
          }}
        >
          <FiSearch className="fs-5" />
          <input
            placeholder="Search Roles..."
            type="search"
            className=""
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              fontSize: 14,
              background: "#FCFCFC",
              color: "rgba(19.75, 25.29, 61.30, 0.40)",
            }}
            value={roleSearchTerm}
            onChange={(e) => setRoleSearchTerm(e.target.value)}
          />
        </div>
      );
    }
  };

  const handleRoleRowClick = (role) => {
    setSelectedRoleForView(role);
    setRoleViewMode("users")
  }

  const usersBySelectedRole = useMemo(() => {
    if (!selectedRoleForView) return [];
    return users.filter((u) => u.role?._id === selectedRoleForView?._id)
  }, [users, selectedRoleForView])


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDetailsModal && detailsRef.current && !detailsRef.current.contains(event.target)) {
        setOPenDetailsModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [openDetailsModal]);


  return (
    <div className="p-4" style={{ fontFamily: '"Inter", sans-serif', overflow: "hidden", }}>
      {/* Header */}
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
          {/* <div style={{
                width: 32,
                height: "33px",
                background: 'white',
                borderRadius: 53,
                border: '1.07px solid #EAEAEA',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <FaArrowLeft style={{ color: '#A2A8B8' }} />
              </div> */}

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
            User & Roles
          </h2>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          height: "33px",
        }}>
          {hasPermission(user, "Users", "create") && (
            <button
              className="button-hover"
              onClick={() => {
                if (activeTab === "user") {
                  resetCreateForm();
                  setOpenModal("create");
                } else {
                  navigate("/create-role");
                }
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
              }}
            >
              <LuUserPlus className="fs-6" /> {activeTab === "user" ? "Add User" : "Add Role"}
            </button>
          )}
        </div>
      </div>

      {/* Main Card */}
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
          minHeight: "calc(100vh - 170px)",
        }}
      >
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
            <div
              onClick={() => setActiveTab("user")}
              style={{
                padding: "6px 12px",
                backgroundColor: activeTab === "user" ? "white" : "transparent",
                boxShadow: activeTab === "user" ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "#0E101A",
                cursor: "pointer",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  color: "#0E101A",
                  fontSize: "14px",
                  fontWeight: "400",
                }}
              >
                User
              </div>
              <div
                style={{
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: "400",
                }}
              >
                {users.length}
              </div>
            </div>
            <div
              style={{
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "#0E101A",
                cursor: "pointer",
                borderRadius: 8,
                backgroundColor: activeTab === "roles" ? "white" : "transparent",
                boxShadow: activeTab === "roles" ? "0px 1px 4px rgba(0, 0, 0, 0.10)" : "none",
              }}
              onClick={() => setActiveTab("roles")}
            >
              <div
                style={{
                  color: "#0E101A",
                  fontSize: "14px",
                  fontWeight: "400",
                }}
              >
                Roles
              </div>
              <div
                style={{
                  color: "#727681",
                  fontSize: "14px",
                  fontWeight: "400",
                }}
              >
                {roles.length}
              </div>
            </div>
          </div>

          {/* Search and Filters Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              gap: "24px",
              height: "33px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: "24px",
              }}
            >
              {renderSearchAndFilters()}
            </div>
            {hasPermission(user, "Users", "export") && (
              <div className=""
                style={{
                  display: "inline-flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 16,
                }}>
                <button
                  title="Export"
                  onClick={() => handleExport('pdf')}
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

        {/* Table Container */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, maxHeight: "calc(100vh - 355px)" }}>
          {activeTab === "roles" && roleViewMode === "users" && (
            <div style={{ marginBottom: "12px" }}>
              <button
                onClick={() => {
                  setRoleViewMode("roles");
                  setSelectedRoleForView(null);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#0E101A",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <FaArrowLeft />  Back to Roles
              </button>
            </div>
          )}
          <div
            className="table-responsive"
            style={{
              // height: "490px",
              overflowY: "auto",
              overflowX: "hidden",
              // scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* USER TAB */}
            {activeTab === "user" && (
              <UserTable
                users={paginatedUsers}
                loading={!users.length}
                onEdit={(user) => handleOpenEditModal(user)}
                onDelete={(user) => {
                  setSelectedUser(user);
                  setShowDeleteModal(true);
                }}
                onRowClick={handleUserROwClick}
                openMenuIndex={openMenuIndex}
                setOpenMenuIndex={setOpenMenuIndex}
                menuRef={menuRef}
                selectedUsersForExport={selectedUsersForExport}
                handleCheckboxChange={handleCheckboxChange}
                selectAllForExport={selectAllForExport}
                handleSelectAllForExport={handleSelectAllForExport}
              />
            )}

            {/* ROLES TAB – ROLE LIST */}
            {activeTab === "roles" && roleViewMode === "roles" && (
              <RoleTable
                roles={paginatedRoles}
                loading={!roles.length}
                openMenuIndex={openMenuIndex}
                setOpenMenuIndex={setOpenMenuIndex}
                menuRef={menuRef}
                onDelete={(role) => {
                  setSelectedRole(role);
                  setShowRoleDeleteModal(true);
                }}
                onRowClick={handleRoleRowClick}
                selectedRolesForExport={selectedRolesForExport}
                handleCheckboxChange={(id) => {
                  setSelectedRolesForExport(prev =>
                    prev.includes(id)
                      ? prev.filter(roleId => roleId !== id)
                      : [...prev, id]
                  );
                }}
                selectAllForExport={selectAllRolesForExport}
                handleSelectAllForExport={() => {
                  if (selectAllRolesForExport) {
                    setSelectedRolesForExport([]);
                  } else {
                    setSelectedRolesForExport(filteredRoles.map(role => role._id));
                  }
                  // setSelectAllRolesForExport(!selectAllRolesForExport);
                }}
              />
            )}

            {/* ROLES TAB – USERS OF SELECTED ROLE */}
            {activeTab === "roles" && roleViewMode === "users" && (
              <UserTable
                users={usersBySelectedRole}
                loading={false}
                onEdit={(user) => handleOpenEditModal(user)}
                onDelete={(user) => {
                  setSelectedUser(user);
                  setShowDeleteModal(true);
                }}
                openMenuIndex={openMenuIndex}
                setOpenMenuIndex={setOpenMenuIndex}
                menuRef={menuRef}
                selectedUsersForExport={selectedUsersForExport}
                handleCheckboxChange={handleCheckboxChange}
                selectAllForExport={selectAllForExport}
                handleSelectAllForExport={handleSelectAllForExport}
              />
            )}
          </div>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          {activeTab === "user" ? (
            <Pagination
              currentPage={currentPage}
              total={filteredUsers.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setCurrentPage(page)}
              onItemsPerPageChange={(newPerPage) => {
                setItemsPerPage(newPerPage);
                setCurrentPage(1);
              }}
            />
          ) : (
            <Pagination
              currentPage={roleCurrentPage}
              total={filteredRoles.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => setRoleCurrentPage(page)}
              onItemsPerPageChange={(newPerPage) => {
                setItemsPerPage(newPerPage);
                setRoleCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* Create/Edit User Modal */}
      {(openModal === "create" || openModal === "edit") && (
        <div
          className=""
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.27)",
            backdropFilter: "blur(1px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 99999999,
          }}
        >
          <div className="" style={{
            backgroundColor: "white",
            width: "900px",
            padding: "20px 100px",
            borderRadius: "8px",
          }}>

            <div className="">
              <div className="modal-header" style={{ borderBottom: "none", display: "flex", alignItems: "center", justifyContent: "end", borderRadius: "50%", padding: "5px 5px" }}>
                <button
                  style={{
                    color: "#727681",
                    fontSize: "10px",
                    fontWeight: 800,
                    border: "2px solid #727681",
                    borderRadius: "50%",
                    backgroundColor: "transparent",
                    width: "30px",
                    height: "30px",
                    cursor: "pointer"
                  }}
                  type="button"
                  onClick={() => {
                    setOpenModal(false);
                    resetCreateForm();
                    setFileError("");
                  }}
                >
                  <RxCross2 style={{ color: "#727681", fontSize: "15px", fontWeight: 900 }} />
                </button>
              </div>

              <div style={{}}>
                {successMessage && (
                  <div
                    className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                    style={{
                      border: "1px solid #0D6828",
                      color: "#0D6828",
                      background: "#EBFFF1",
                      borderRadius: "8px",
                      padding: "10px",
                      margin: "15px 0",
                    }}
                  >
                    <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                      User Successfully Created
                    </label>
                  </div>
                )}
              </div>

              {frontErrorMessage && (
                <div
                  className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                  style={{
                    border: "1px solid #DC3545",
                    color: "#DC3545",
                    background: "#FFF1F3",
                    borderRadius: "8px",
                    padding: "10px",
                    margin: "15px 0",
                    pointerEvents: "auto",
                  }}
                >
                  <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                    {frontErrorMessage}
                  </label>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", margin: "10px 0px" }}>
                <h5 className="modal-title" style={{ color: "#0E101A", fontWeight: 500, fontSize: "22px", fontFamily: '"Inter", sans-serif', lineHeight: "120%" }}>
                  {openModal === "create" ? "Add User" : "Edit User"}
                </h5>
              </div>

              <form onSubmit={openModal === "create" ? handleAddUser : handleUpdate}>
                <div className="modal-body">
                  {/* Image Upload */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      border: "2px dashed #dadadaff",
                      padding: "10px",
                      borderRadius: "8px",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      className="add-image-circle"
                      style={{
                        border: "2px dashed #dadadaff",
                        width: "100px",
                        height: "100px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "grey",
                        cursor: "pointer",
                        borderRadius: "50%",
                        overflow: "hidden",
                      }}
                      onClick={() => openModal === "create" ? addFileInputRef.current?.click() : editFileInputRef.current?.click()}
                    >
                      {(openModal === "create" ? selectedImages.length > 0 : editUserData.profileImage) ? (
                        <img
                          src={openModal === "create" ? URL.createObjectURL(selectedImages[0]) :
                            (typeof editUserData.profileImage === "string" ? editUserData.profileImage : URL.createObjectURL(editUserData.profileImage))}
                          alt="Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            pointerEvents: "none",
                            borderRadius: "50%",
                          }}
                        />
                      ) : (
                        <span style={{ color: "#676767", fontSize: "32px", fontWeight: 400, lineHeight: "18px" }}>
                          +
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      ref={openModal === "create" ? addFileInputRef : editFileInputRef}
                      style={{ display: "none" }}
                      onChange={openModal === "create" ? handleFileChange : handleEditFileChange}
                    />

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          textAlign: "center",
                          backgroundColor: "#E3F3FF",
                          color: "#1368EC",
                          border: "1px solid #BBE1FF",
                          borderRadius: "15px",
                          width: "150px",
                          height: "45px",
                          cursor: "pointer",
                        }}
                        onClick={() => openModal === "create" ? addFileInputRef.current?.click() : editFileInputRef.current?.click()}
                      >
                        <img src={Iconss} alt="" style={{ width: "20px", height: "20px" }} />
                        <span className="setting-imgupload-btn">
                          {openModal === "create" ? "Upload Image" : "Change Image"}
                        </span>
                      </div>
                      <p style={{ color: "#888888", fontFamily: '"Roboto", sans-serif', fontWeight: 400, fontSize: "12px", marginTop: "10px" }}>
                        Upload an image below 1MB, Accepted File format JPG, PNG
                      </p>


                    </div>


                    <div className="invisible">;lpk</div>
                  </div>
                  {/* Show file error if any */}
                  {fileError && (
                    <div style={{ color: "#dc3545", fontSize: "12px", marginTop: "1px", textAlign: "" }}>
                      {fileError}
                    </div>
                  )}

                  {/* User Details */}
                  <div style={{ display: "flex", alignItems: "center", margin: "10px 0px" }}>
                    <h5 className="modal-title" style={{ color: "#0E101A", fontWeight: 500, fontSize: "22px", fontFamily: '"Inter", sans-serif', lineHeight: "120%" }}>User Details</h5>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between">
                    {/* First Name */}
                    <div className="col-6 mb-3" style={{ paddingRight: '20px' }}>
                      <label className="form-label supplierlabel">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control supplierinput shadow-none"
                        placeholder="Enter Name"
                        value={openModal === "create" ? name : editUserData.name}
                        onChange={(e) => openModal === "create"
                          ? handleNameChange(e.target.value, false)
                          : handleNameChange(e.target.value, true)
                        }
                      />
                      {errors.name && <p className="text-danger" style={{ fontSize: "12px" }}>{errors.name}</p>}
                    </div>

                    {/* Phone */}
                    <div className="col-6 mb-3" style={{ paddingLeft: "20px" }}>
                      <label className="form-label supplierlabel">
                        Phone No. <span className="text-danger">*</span>
                      </label>
                      <div className="input-group">
                        <span className="input-group-text" style={{ backgroundColor: '#fff' }}>
                          <img src="https://flagcdn.com/in.svg" alt="India" width="20" className="me-1" />
                          +91
                        </span>
                        <input
                          type="tel"
                          className="form-control supplierinput shadow-none"
                          placeholder="Enter Phone"
                          value={openModal === "create" ? phone : editUserData.phone}
                          onChange={(e) => openModal === "create"
                            ? handlePhoneChange(e.target.value, false)
                            : handlePhoneChange(e.target.value, true)
                          }
                          maxLength={10}
                          style={errors.phone ? { borderColor: "#dc3545" } : {}}
                        />
                      </div>
                      {errors.phone && <p className="text-danger" style={{ fontSize: "12px", marginTop: "5px" }}>{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between">
                    {/* Email */}
                    <div className="col-6 mb-3" style={{ paddingRight: '20px' }}>
                      <label className="form-label supplierlabel">
                        Email <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        className="form-control supplierinput shadow-none"
                        placeholder="Enter Email"
                        value={openModal === "create" ? email : editUserData.email}
                        onChange={(e) => openModal === "create"
                          ? handleEmailChange(e.target.value, false)
                          : handleEmailChange(e.target.value, true)
                        }
                        readOnly={openModal === "edit"}
                        style={errors.email ? { borderColor: "#dc3545" } : {}}
                      />
                      {errors.email && <p className="text-danger" style={{ fontSize: "12px", marginTop: "5px" }}>{errors.email}</p>}
                    </div>

                    {/* Role */}
                    <div className="col-6 mb-3" style={{ paddingLeft: "20px" }}>
                      <label className="form-label supplierlabel">
                        Role <span className="text-danger">*</span>
                      </label>
                      <Select
                        options={activeRoles}
                        value={openModal === "create" ? selectedRoleForForm : editUserData.role}
                        // onChange={(selectedOption) => openModal === "create" ? setSelectedRoleForForm(selectedOption) : setEditUserData({ ...editUserData, role: selectedOption })}
                        onChange={(selectedOption) => {
                          if (openModal === "create") {
                            setSelectedRoleForForm(selectedOption);
                            if (errors.role) {
                              setErrors(prev => ({ ...prev, role: '' }));
                            }
                          } else {
                            setEditUserData({ ...editUserData, role: selectedOption });
                            if (errors.role) {
                              setErrors(prev => ({ ...prev, role: '' }));
                            }
                          }
                        }}
                        placeholder="Assign Role"
                        isSearchable
                        styles={{
                          control: (base) => ({
                            ...base,
                            border: "1px solid #dee2e6",
                            borderRadius: "8px",
                            fontSize: "14px",
                            minHeight: "38px",
                          }),
                        }}
                      />
                      {errors.role && <p className="text-danger" style={{ fontSize: "12px", marginTop: "5px" }}>{errors.role}</p>}
                    </div>
                  </div>

                  <div className="d-flex flex-wrap justify-content-between">
                    {/* Status (Edit only) */}
                    {openModal === "edit" && (
                      <div className="col-5 mb-3">
                        <label className="form-label supplierlabel">Status</label>
                        <select
                          className=""
                          styles={{
                            border: "1px solid #dee2e6",
                            borderRadius: "8px",
                            fontSize: "14px",
                            minHeight: "38px",
                          }}
                          value={editUserData.status}
                          onChange={(e) => setEditUserData({ ...editUserData, status: e.target.value })}
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Blacklist">Blacklist</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Login Credentials (Create only) */}
                  {openModal === "create" && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", margin: "10px 0px", marginTop: "30px" }}>
                        <h5 className="modal-title" style={{ color: "#0E101A", fontWeight: 500, fontSize: "22px", fontFamily: '"Inter", sans-serif', lineHeight: "120%" }}>Login Credentials</h5>
                      </div>

                      <div className="d-flex flex-wrap justify-content-between">
                        {/* Username */}
                        <div className="col-6 mb-3" style={{ paddingRight: '20px' }}>
                          <label className="form-label supplierlabel">
                            Username <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control supplierinput shadow-none"
                            placeholder="Enter Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                        </div>

                        {/* Password */}
                        <div className="col-6 mb-3" style={{ paddingLeft: "20px" }}>
                          <label className="form-label supplierlabel">
                            Password <span className="text-danger">*</span>
                          </label>
                          <input
                            type="password"
                            className="form-control supplierinput shadow-none"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          {errors.password && <p className="text-danger" style={{ fontSize: "12px", marginTop: "5px" }}>{errors.password}</p>}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="modal-footer d-flex align-items-start justify-content-start" style={{ borderTop: "none" }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving..." : openModal === "create" ? "Save" : "Save"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* Confirm Delete Modals */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete ${selectedUser?.name}?`}
      />

      <ConfirmDeleteModal
        isOpen={showRoleDeleteModal}
        onCancel={() => {
          setShowRoleDeleteModal(false);
          setSelectedRole(null);
        }}
        onConfirm={handleDeleteRole}
        title="Delete Role"
        message={`Are you sure you want to delete ${selectedRole?.roleName}?`}
      />

      {/* user detail page */}
      {openDetailsModal && selectedUser && (
        <>
          {/* Back button */}
          <span onClick={() => setOPenDetailsModal(false)}
            style={{
              cursor: "pointer",
              position: "fixed",
              left: "calc(100vw - 760px)",
              top: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #EAEAEA",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              zIndex: 10000,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            {openDetailsModal ? <IoIosArrowBack style={{ color: "#6C748C", fontSize: "18px" }} /> : <IoIosArrowForward style={{ color: "#6C748C", fontSize: "18px" }} />}
          </span>
          {/* Side panel */}
          <div
            ref={detailsRef}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "740px",
              height: "100vh",
              background: "white",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
              zIndex: 999,
              overflowY: "auto"
            }}
          >
            <UserDetails
              data={selectedUser}
              onEdit={(user) => {
                setOPenDetailsModal(false);
                handleOpenEditModal(user)
              }}
            />
          </div>
        </>
      )}
    </div>

  );
};

export default Users;