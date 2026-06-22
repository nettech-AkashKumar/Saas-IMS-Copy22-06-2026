import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { BsBell } from "react-icons/bs";
import { toast } from "react-toastify";

// pages
import "../../styles/Navbar.css";
import "../../styles/Responsive.css";
import { useSocket } from "../../Context/SocketContext";
import api from "../../pages/config/axiosInstance";
import Activities from '../activities'
import SearchningFor from "./SearchningFor";
import { useAuth } from "../../components/auth/AuthContext";
import { SIDEBAR_SEARCH_ROUTES } from "../../utils/sidebarSearchConfig";

// icons
import { CiSearch } from "react-icons/ci";
import { IoSettingsOutline } from "react-icons/io5";
import { PiBellThin } from "react-icons/pi";
import { GoPlus } from "react-icons/go";
import { TbMaximize, TbZoomScan } from "react-icons/tb";
import { RiMenu2Line } from "react-icons/ri";

// images
import nav_logo from "../../assets/images/kasper-logo.png";
import pos_icon from "../../assets/images/pos-icon.png";
import ai from "../../assets/images/AI.png";
import CreateModel from "../CreateModel";
import AI_Model from "./AI_Model";
import { MdOutlineZoomOutMap, MdZoomInMap, MdZoomOutMap } from "react-icons/md";
import { hasPermission } from "../../utils/permission/hasPermission.jsx";


const Navbar = () => {
  
  const [ShowCreateModel, setShowCreateModel] = useState(false);
  const [sidebarActive, setSidebarActive] = useState(false);
  const serchingRef = useRef(null);
  const serchingBtnRef = useRef(null);
  const notificationRef = useRef(null);
  const notificationBtnRef = useRef(null);
  const [showRecentSearch, setShowRecentSearch] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [dropdownActive, setDropdownActive] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { connectSocket, getSocket } = useSocket();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [companyImages, setCompanyImages] = useState(null);
  const [showAiModel, setShowAiModel] = useState(false)
  const aiModelRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // fetch company details
  useEffect(() => {
    const fetchCompanyDetails = async () => {
      try {
        const res = await api.get(`/api/companyprofile/get`, {
          withCredentials: true
        });
        if (res.status === 200) {
          setCompanyImages(res.data.data);
          // console.log("res.data", res.data.data)
        }
      } catch (error) {
        toast.error("Unable to find company details", {
          position: "top-center",
        });
      }
    };
    fetchCompanyDetails();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userId = user?._id || user?.id;

    // Fetch notification count
    const fetchNotificationCount = async () => {
      try {
        if (!userId) return;
        const res = await api.get(`/api/notifications/unread/${userId}`);
        setNotificationCount(res.data.count || 0);
      } catch (error) {
        // console.error("Error fetching notification count:", error);
      }
    };
    fetchNotificationCount();

    // Initialize socket connection for real-time notifications
    const socketInstance = connectSocket(api.defaults.baseURL);
    const socket = socketInstance;

    if (socket) {
      // Register current user so server can route events correctly
      if (socket.connected) {
        socket.emit("add-user", userId);
      } else {
        socket.on("connect", () => {
          socket.emit("add-user", userId);
        });
      }

      // Listen for new notifications
      const handleNewNotification = (notificationData) => {
        // console.log("🔔 New notification received:", notificationData);
        setNotificationCount((prev) => prev + 1);
      };

      socket.on("new-notification", handleNewNotification);

      return () => {
        socket.off("new-notification", handleNewNotification);
      };
    }
  }, [user]);

  const handleUnreadCountChange = (count) => {
    setNotificationCount(Math.max(0, Number(count) || 0));
  };

  const settingGoToPage = () => {
    navigate("/settings/user-profile-settings");
  };

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    const sidebar = document.querySelector(".sidebarmenu-container");
    sidebar?.classList.toggle("sidebar-active");
    setSidebarActive((prev) => !prev);
  };

  const canAccess = (module, action = "read") => {
    // ✅ Admin bypass: full access - check roleName instead of name
    if (user?.role?.roleName?.toLowerCase() === "admin") return true;

    // If no permissions or module not defined → deny
    if (!permissions || !permissions[module]) {
      // console.warn(`Module "${module}" not found in permissions for user ${user?.name}`);
      return false;
    }

    const modulePerms = permissions[module];

    // ✅ Allow only if all:true or specific action:true
    return modulePerms?.all === true || modulePerms?.[action] === true;
  };

  if (!user) return null;

  const id = user?._id || user?.id;
  const permissions = user?.role?.modulePermissions || {};

  // Serach function logic
  const [searchText, setSearchText] = useState("");
  const [filteredRoutes, setFilteredRoutes] = useState([]);

  const handleSearch = (value) => {
    setSearchText(value);

    if (!value.trim()) {
      setFilteredRoutes([]);
      return;
    }

    const results = SIDEBAR_SEARCH_ROUTES.filter((route) =>
      route.label.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredRoutes(results);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setFilteredRoutes([]);
    setSearchText("");
    setShowRecentSearch(false);
  };

  const modelRef = useRef(null);
  const buttonRef = useRef(null);

  const handleCreateClick = () => {
    setShowCreateModel(prev => !prev); // toggles open/close
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close search dropdown
      if (
        serchingRef.current &&
        !serchingRef.current.contains(event.target) &&
        serchingBtnRef.current &&
        !serchingBtnRef.current.contains(event.target)
      ) {
        setShowRecentSearch(false);
      }

      // Close create modal
      if (
        modelRef.current &&
        !modelRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowCreateModel(false);
      }

      // Close notification dropdown
      if (
        dropdownActive &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target) &&
        notificationBtnRef.current &&
        !notificationBtnRef.current.contains(event.target)
      ) {
        setDropdownActive(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownActive]);

  const handleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      // console.error("Fullscreen toggle failed:", err);
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "white",
        // height: "300px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e0dedeff",
      }}
    >
      <nav
        style={{
          width: "100%",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px 0px 0px",
        }}
      >
        <div style={{
          // width: "100%",
          height: "60px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          {/*Mobile Toggle Button  */}
          <div
            className={`mobile-toggle-btn d-none ${sidebarActive ? "active" : ""
              }`}
            id="mobileToggleBtn"
            onClick={handleSidebarToggle}
            style={{ border: "2px solid rgb(31, 127, 255)" }}
          >
            <RiMenu2Line
              className="open-icon"
              size={25}
              color="rgb(31, 127, 255)"
            />
          </div>

          {/* company logo */}
          {companyImages && (
            <div
              // className="nav-logo" 
              style={{
                // width: "120px",
                height: "60px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: '5px 5px',
                // border:'1px solid #292525ff'
              }}>
              <img
                src={
                  isDarkMode
                    ? companyImages.companyDarkLogo
                    : companyImages.companyLogo
                }
                alt="company-logo"
                style={{ width: "100%", height: "100%", objectFit: "contain", }}
              />
            </div>
          )}
        </div>

        {/* search bar */}
        <div
          ref={serchingBtnRef}
          className="nav-search-input border-hover d-flex align-items-center gap-1"
          style={{
            backgroundColor: "#FCFCFC",
            border: "1px solid #EAEAEA",
            width: "550px",
            padding: "5px 16px",
            borderRadius: "8px",
            position: "relative"
          }}
        >
          <CiSearch size={20} style={{ color: "#6C748C", fontWeight: "500" }} />
          <input
            onClick={() => {
              if (searchText.trim()) setShowRecentSearch(true);
            }}
            onChange={(e) => {
              handleSearch(e.target.value);
              setShowRecentSearch(e.target.value.trim().length > 0);
            }}
            type="search"
            placeholder="Search"
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              backgroundColor: "transparent",

            }}
          />
          <div
            onClick={setShowAiModel}
            className="ai d-flex justify-content-center align-items-center"
            style={{
              backgroundColor: "#E9F0F4",
              borderRadius: "4px",
              padding: "4px 4px",
              cursor: "pointer",
            }}
          >
            <img style={{ width: "100%" }} src={ai} alt="ai" />
          </div>
        </div>

        {/* right side options */}
        <div className="d-flex align-items-center gap-3">

          {/* zoom button */}
          {isFullscreen ? (
            <MdZoomInMap
              id="btnFullscreen"
              style={{ cursor: "pointer", fontSize: "22px", color: "#84878a" }}
              onClick={handleFullscreen}
              title="Exit Fullscreen"
              className="nav-zoom"
            />
          ) : (
            <MdZoomOutMap
              id="btnFullscreen"
              style={{
                cursor: "pointer",
                fontSize: "22px",
                color: "#84878a",
              }}
              onClick={handleFullscreen}
              title="Enter Fullscreen"
              className="nav-zoom"
            />
          )}
          {/* settings */}
          {hasPermission (user ,"Settings", "read") && (
            <div className="icon-hover nav-setting">
              <IoSettingsOutline
                size={24}
                onClick={settingGoToPage}
                cursor="pointer"
                title="Settings"
              />
            </div>
          )}

          {/* notification */}
          <div className="nav-user-info  d-flex align-items-center gap-3">

            <div style={{ position: "relative" }}
              ref={notificationBtnRef}
              className="icon-hover"
              onClick={(e) => {
                e.preventDefault();
                setDropdownActive(!dropdownActive);
              }}>
              <BsBell size={21} cursor="pointer" title="Notifications" />
              {notificationCount > 0 && (
                <span
                  className="badge rounded-pill"
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    backgroundColor: "red",
                    color: "white",
                    fontSize: "10px",
                    minWidth: "18px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                    border: "1px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                  }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </div>

            {dropdownActive && (
              <div
                ref={notificationRef}
                className=""
                style={{ borderRadius: "8px", position: "absolute", top: "55px", right: "80px", zIndex: 1000, }}
              >
                <Activities onUnreadCountChange={handleUnreadCountChange} onClose={() => setDropdownActive(false)} />
              </div>
            )}

          </div>

          {/* POS */}
          {hasPermission (user, "POS", "create")&& (
            <button
              className="button-color button-hover d-flex justify-content-center align-items-center nav-posbar"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="POS MACHINE"
              style={{
                padding: "8px",
                width: "65px",
                height: "36px",
                gap: "4px",

              }}
            >
              <img src={pos_icon} alt="pos_icon" />
              <Link
                to="/pos"
                style={{
                  textDecoration: "none",
                  color: "white",
                  fontFamily: "Inter",
                  fontSize: "14px",


                }}
              >
                POS
              </Link>
            </button>
          )}

          {/* Create Model */}
          <button
            ref={buttonRef}
            onClick={handleCreateClick}
            className="create-btn button-hover button-color"
            style={{
              // backgroundColor: "#1F7FFF",
              color: "white",
              border: "none",
              fontFamily: 'Inter',
              fontSize: "14px",
              padding: "8px",
              borderRadius: "8px",
              width: "89px",
              height: "36px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <GoPlus size={20} />
            Create
          </button>
        </div>
      </nav>

      {ShowCreateModel && (
        <div ref={modelRef}>
          <CreateModel onClose={() => setShowCreateModel(false)} />
        </div>
      )}

      {showAiModel &&
        <div ref={aiModelRef}>
          <AI_Model onClose={() => setShowAiModel(false)} />
        </div>
      }

      {showRecentSearch && (
        <div ref={serchingRef}>
          <SearchningFor results={filteredRoutes} onSelect={handleNavigate} />
        </div>
      )}

    </div>
  );
};

export default Navbar;
