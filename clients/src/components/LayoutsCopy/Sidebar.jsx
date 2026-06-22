import React, { useState, useEffect, useContext } from "react";
import "../../styles/sidebar.css";
import munc_logo from "../../assets/images/munc-logo.png";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { IoIosArrowDown } from "react-icons/io";
import {
  MdDriveEta,
  MdEmojiTransportation,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import UserId from "../../assets/images/user-logo.png";
import all_p from "../../assets/images/allp-icon.png";
import cat_icon from "../../assets/images/cat-icon.png";
import exp_icon from "../../assets/images/exp-icon.png";
import dam_icon from "../../assets/images/dam-icon.png";
import low_icon from "../../assets/images/low-icon.png";
import cus_icon from "../../assets/images/cus-icon.png";
import dues_icon from "../../assets/images/over-icon.png";
import generateinvoice from "../../assets/images/create-icon1.png";
import "../../styles/Responsive.css";
import { FaAnglesLeft } from "react-icons/fa6";
import { useAuth } from "../../components/auth/AuthContext";
import { IoLogOutOutline } from "react-icons/io5";
import api from "../../pages/config/axiosInstance";
import { read } from "xlsx";
import { RxCross2 } from "react-icons/rx";
import creater_logo from "../../assets/images/munc-logo.png";
import deliverychallan from "../../assets/images/create-sale.png";

//icons
import { RiDashboardHorizontalLine } from "react-icons/ri";
import { LuMail } from "react-icons/lu";
import { SiWhatsapp } from "react-icons/si";
import { LuMessagesSquare } from "react-icons/lu";
import { LuBoxes } from "react-icons/lu";
import { LuShapes } from "react-icons/lu";
import { LuBiohazard } from "react-icons/lu";
import { LuDiamondMinus } from "react-icons/lu";
import { LuCombine } from "react-icons/lu";
import { LuPrinter } from "react-icons/lu";
import { LuUsers } from "react-icons/lu";
import { LuClipboardList } from "react-icons/lu";
import { LuShoppingBag } from "react-icons/lu";
import { LuScrollText } from "react-icons/lu";
import { LuPackageCheck } from "react-icons/lu";
import { LuNotebookPen } from "react-icons/lu";
import { LuNotepadText } from "react-icons/lu";
import { LuReceiptIndianRupee } from "react-icons/lu";
import { LuFileInput } from "react-icons/lu";
import { LuFileCheck2 } from "react-icons/lu";
import { LuFileBox } from "react-icons/lu";
import { RiFileUserLine } from "react-icons/ri";
import { LuFileX2 } from "react-icons/lu";
import { LuFileChartPie } from "react-icons/lu";
import { LuFileClock } from "react-icons/lu";
import { GrTag } from "react-icons/gr";
import { MdAdUnits } from "react-icons/md";
import { IoColorPaletteOutline } from "react-icons/io5";
import { IoResize } from "react-icons/io5";
import { FaShippingFast } from "react-icons/fa";
import { VscNotebookTemplate } from "react-icons/vsc";
import { PiWarehouseBold } from "react-icons/pi";
import { MdOutlineInventory2 } from "react-icons/md";
import { TbTransfer } from "react-icons/tb";
import { MdQrCode2 } from "react-icons/md";
import { VscGraph } from "react-icons/vsc";

const Sidebar = () => {
  const { user: authUser, logout } = useAuth();
  const userData = authUser;
  // console.log("usersrs", userData);
  const [loginPop, setloginPop] = useState(false);
  // const [users, setUser] = useState(null); // ❌ REMOVED - use authUser instead
  const userObj = authUser;
  const userId = authUser?._id;
  const { user } = useAuth();
  // ✅ User already loaded from AuthContext - no need to refetch constantly

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout", {}, { withCredentials: true });
      logout();
      navigate("/login");
    } catch (err) {
      // console.error("Logout error:", err);
    }
  };

  // const permissions = user?.role?.modulePermissions || {};
  if (!user) return null;

  const id = user?._id || user?.id;
  const permissions = user?.role?.modulePermissions || {};

  const canAccess = (module, action = "read") => {
    // ✅ Admin bypass: full access - check roleName instead of name
    // if (user?.role?.roleName?.toLowerCase() === "admin") return true;

    // If no permissions or module not defined → deny
    if (!permissions || !permissions[module]) {
      // console.warn(`Module "${module}" not found in permissions for user ${user?.name}`);
      return false;
    }

    const modulePerms = permissions[module];

    // ✅ Allow only if all:true or specific action:true
    return modulePerms?.all === true || modulePerms?.[action] === true;
  };

  const [openDropdown, setOpenDropdown] = useState(null);
  const handleToggle = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // Close button handler
  const handleSidebarClose = () => {
    const sidebar = document.querySelector(".sidebarmenu-container");
    sidebar?.classList.remove("sidebar-active");
    setSidebarActive(false);
  };

  const hasInventoryAccess =
    canAccess("AddProduct", "read") ||
    canAccess("Product", "read") ||
    canAccess("Brand", "read") ||
    canAccess("Category", "read") ||
    canAccess("Units", "read") ||
    canAccess("Color", "read") ||
    canAccess("Size", "read") ||
    canAccess("Tax", "read") ||
    canAccess("HSN", "read") ||
    canAccess("DamageRecord", "read") ||
    // canAccess("LowStocks", "read") ||
    canAccess("Barcode", "read");

  const hasMainAccess = canAccess("Dashboard", "read");
  // canAccess("POS", "read")

  const hasConnectAccess =
    canAccess("Whatsapp", "read") ||
    canAccess("Chat", "read") ||
    canAccess("Mail", "read");

  const hasCustomerAccess =
    canAccess("Customer", "read") ||
    canAccess("DuesAdvance", "read");

  const hasBrokerAccess =
    canAccess("AssignTarget", "read") ||
    canAccess("Ledger", "read") ||
    canAccess("BrokerSalesman", "read");

  const hasTransport =
    canAccess("VehicleDriver", "read") ||
    canAccess("Transporter", "read") ||
    canAccess("Shipments", "read");

  const hasSuppliersAccess = canAccess("Supplier", "read");

  const hasPurachseOrderAccess =
    canAccess("PurchaseOrder", "read") ||
    canAccess("GRNverification", "read") ||
    canAccess("Purchase", "read") ||
    canAccess("DebitNote", "read");

  const hasSalesOrderAccess =
    canAccess("Sales", "read") ||
    canAccess("Invoices", "read") ||
    canAccess("Quotation", "read") ||
    canAccess("Ewaybill", "read") ||
    canAccess("OverdueInvoice", "read") ||
    canAccess("Delivery Challan", "read") ||
    canAccess("CreditNote", "read");

  const hasMyOnlineStoreAcess = canAccess("MyOnlineStore", "read");

  const hasWarehouseAccess =
    canAccess("Warehouse", "read") ||
    // canAccess("StockMovementLog", "read") ||
    canAccess("Zones", "read") ||
    canAccess("ProductAllocation", "read") ||
    canAccess("QRCode", "read") ||
    canAccess("QRCodeScan", "read") ||
    canAccess("TransferProduct", "read") ||
    canAccess("Dispatch", "read");

  const hasExpensesAccess = canAccess("Expense", "read");

  const hasPointRewardsAccess = canAccess("PointsRewards", "read");

  const hasTrashAccess = canAccess("Trash", "read");

  const hasRepostrsacces =
    canAccess("SalesReport", "read") ||
    canAccess("PurchaseReport", "read") ||
    canAccess("InventoryReport", "read") ||
    canAccess("ProductWiseReport", "read") ||
    canAccess("SupplierReport", "read") ||
    canAccess("DamageReport", "read") ||
    canAccess("CreditNoteReport", "read") ||
    canAccess("DebitNoteReport", "read") ||
    canAccess("ExpireReport", "read") ||
    canAccess("CustomerOverdueReport", "read") ||
    canAccess("SupplierOverdueReport", "read") ||
    canAccess("ExpensesReport", "read");

  const hasSettingsAccess = canAccess("Settings", read);

  // const stopToggle = (e) => {
  //   e.stopPropagation();
  // };

  const location = useLocation();

  const routeDropdownMap = {
    "/dashboard": "main",

    "/whatsapp": "connect",
    "/chat": "connect",
    "/mail": "connect",

    "/product": "inventory",
    "/brand-list": "inventory",
    "/category-list": "inventory",
    "/units": "inventory",
    "/color": "inventory",
    "/size": "inventory",
    "/tax": "inventory",
    "/hsn": "inventory",
    "/damage-record": "inventory",
    "/damage-return": "inventory",
    // "/low-stocks": "inventory",
    "/barcode": "inventory",

    "/customers": "customers",
    "/customerdueadvance": "customers",

    "/broker-salesman": "broker",
    "/ledger": "broker",
    "/assign-target": "broker",

    "/transport": "transport",
    "/vehicle-driver": "transport",
    "/shipments": "transport",

    "/supplier-list": "suppliers",

    "/purchase-list": "purchase",
    "/debit-note": "purchase",

    "/online-orders": "sales",

    "/invoice": "sales",
    "/quotation": "sales",
    "/ewaybill": "sales",
    "/overdueinvoice": "sales",
    "/deliverychallan": "sales",
    "/creditnotelist": "sales",
    "/proforma-invoices": "sales",

    "/Warehouse": "warehouse",
    // "/stockmovement": "warehouse",
    "/zones": "warehouse",
    "/product-allocation": "warehouse",
    "/qr-code": "warehouse",
    "/qr-code-scan": "warehouse",
    // "/transfer-product": "warehouse",
    "/dispatch": "warehouse",

    "/expense": "Expense",

    "/trash": "Trash",

    "/sales-report": "reports",
    "/purchase-report": "reports",
    "/inventory-report": "reports",
    "/product-wise-report": "reports",
    "/supplier-report": "reports",
    "/damage-report": "reports",
    "/credit-note-report": "reports",
    "/debit-note-report": "reports",
    "/expire-report": "reports",
    "/customer-overdue-report": "reports",
    "/supplier-overdue-report": "reports",
    "/expense-report": "reports",

    "/users": "Users Role & Management",

    "/settings": "settings",
  };

  useEffect(() => {
    const currentPath = location.pathname;

    const matchedDropdown = Object.keys(routeDropdownMap)
      .sort((a, b) => b.length - a.length)
      .find((path) => currentPath.startsWith(path));

    if (matchedDropdown) {
      setOpenDropdown(routeDropdownMap[matchedDropdown]);
    }
  }, [location.pathname]);

  return (
    <div>
      <div
        id="sidebarMenu"
        className="sidebarmenu-container"
        style={{
          width: "235px",
          height: "100vh",
          backgroundColor: "white",
          padding: "16px 16px 16px 16px",
          zIndex: "11",
        }}
      >
        {/* Close Button */}
        <div
          className="close-btn"
          onClick={handleSidebarClose}
          style={{
            position: "absolute",
            right: "-20px",
            top: "50px",
            backgroundColor: "rgb(185 212 228)",
            borderRadius: "50px",
            padding: "5px",
            width: "35px",
            height: "35px",
            // display: "flex",
            alignItems: "center",
            justifyContent: "center",
            display: "none",
          }}
        >
          <FaAnglesLeft className="close-icon" size={22} color="#52adfa" />
        </div>

        {/* {companyImages && ( */}
        <div
          className="sidebar-logoss d-flex justify-content-center"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <img
            src={creater_logo}
            alt="company-logo"
            style={{ objectFit: "contain", maxHeight: "30px", width: "100%" }}
          />
        </div>
        {/* )} */}

        {/* Siebar Menu Link */}
        <div className="sidebar-menu-link">
          {/* Main  */}
          {hasMainAccess && (
            <ul className="sidebarmenu">
              <hr style={{ height: "1px", color: "#979797ff" }} />

              <li
                className="user-role-li"
                style={{ fontSize: "10px", paddingBottom: "5px" }}
              >
                <NavLink
                  className="sidebarmenu-title"
                  to="dashboard"
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Dashboard
                </NavLink>
              </li>
              <hr style={{ height: "1px", color: "#979797ff" }} />
            </ul>
          )}

          {/* Connect */}
          {hasConnectAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("connect")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Connect</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "connect" ? "rotate" : ""}`}
                    style={{
                      transform:
                        openDropdown === "connect" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "connect" ? "open" : ""
                    }`}
                >
                  {canAccess("Mail", "read") && (
                    <li>
                      <NavLink to="/mail/inbox">
                        <LuMail className="fs-6" />
                        Mail
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Whatsapp", "read") && (
                    <li>
                      <NavLink to="whatsapp">
                        <SiWhatsapp className="fs-6" />
                        Whats App
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Chat", "read") && (
                    <li>
                      <NavLink to="/chat">
                        <LuMessagesSquare className="fs-6" />
                        Chat
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            </ul>
          )}

          {/* Inventory */}
          {hasInventoryAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("inventory")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Inventory</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "inventory" ? "rotate" : ""}`}
                    style={{
                      transform:
                        openDropdown === "inventory" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "inventory" ? "open" : ""
                    }`}
                >
                  {canAccess("Product", "read") && (
                    <li>
                      <NavLink to="product">
                        <LuBoxes className="fs-6" />
                        All Products
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Category", "read") && (
                    <li>
                      <NavLink to="category-list">
                        <LuShapes className="fs-6" />
                        Category
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Brand", "read") && (
                    <li>
                      <NavLink to="brand-list">
                        <GrTag className="fs-6" />
                        Brand
                      </NavLink>
                    </li>
                  )}
                  {canAccess("HSN", "read") && (
                    <li>
                      <NavLink to="hsn">
                        <LuCombine className="fs-6" />
                        HSN
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Units", "read") && (
                    <li>
                      <NavLink to="units">
                        <MdAdUnits className="fs-6" />
                        Units
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Tax", "read") && (
                    <li>
                      <NavLink to="tax">
                        <LuBoxes className="fs-6" />
                        Tax
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Size", "read") && (
                    <li>
                      <NavLink to="size">
                        <IoResize className="fs-6" />
                        Size
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Color", "read") && (
                    <li>
                      <NavLink to="color">
                        <IoColorPaletteOutline className="fs-6" />
                        Color
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DamageRecord", "read") && (
                    <li>
                      <NavLink to="damage-record">
                        <LuBiohazard className="fs-6" />
                        Damage Record
                      </NavLink>
                    </li>
                  )}
                  {/* {canAccess("LowStocks", "read") && (
                    <li>
                      <NavLink to="low-stocks">
                        <LuDiamondMinus className="fs-6" />
                        Low Stocks
                      </NavLink>
                    </li>
                  )} */}
                  {canAccess("Barcode", "read") && (
                    <li>
                      <NavLink to="barcode">
                        <LuPrinter className="fs-6" />
                        Print Barcode
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              {/* <hr style={{height:"1px", color:"#979797ff"}}/> */}
            </ul>
          )}

          {/* Customers */}
          {hasCustomerAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("customers")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Customers</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "customers" ? "rotate" : ""}`}
                    style={{
                      transform:
                        openDropdown === "customers" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "customers" ? "open" : ""}`}
                >
                  {canAccess("Customer", "read") && (
                    <li>
                      <NavLink to="customers">
                        <LuUsers className="fs-6" />
                        All Customers
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DuesAdvance", "read") && (
                    <li>
                      <NavLink to="customerdueadvance">
                        <LuClipboardList className="fs-6" />
                        Dues & Advance
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              {/* <hr style={{height:"1px", color:"#979797ff"}}/> */}
            </ul>
          )}

          {/* Supplires */}
          {hasSuppliersAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li
                className="user-role-li"
                style={{ fontSize: "10px", paddingBottom: "10px" }}
              >
                <NavLink
                  className="sidebarmenu-title"
                  to="supplier-list"
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Suppliers
                </NavLink>
              </li>
            </ul>
          )}

          {/* broker */}
          {hasBrokerAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("broker")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Broker</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "broker" ? "rotate" : ""}`}
                    style={{
                      transform:
                        openDropdown === "broker" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "broker" ? "open" : ""}`}
                >
                  {canAccess("BrokerSalesman", "read") && (
                    <li>
                      <NavLink to="broker-salesman">
                        <LuUsers className="fs-6" />
                        Broker & Salesman
                      </NavLink>
                    </li>
                  )}
                  {canAccess("AssignTarget", "read") && (
                    <li>
                      <NavLink to="assign-target">
                        <LuClipboardList className="fs-6" />
                        Assign Target
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Ledger", "read") && (
                    <li>
                      <NavLink to="ledger">
                        <VscGraph className="fs-6" />
                        Ledger
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              {/* <hr style={{height:"1px", color:"#979797ff"}}/> */}
            </ul>
          )}

          {/* Purchase Order */}
          {hasPurachseOrderAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("purchase")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Purchase Order</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "purchase" ? "rotate" : ""}`}
                    style={{
                      transform:
                        openDropdown === "purchase" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "purchase" ? "open" : ""}`}
                >
                  {canAccess("PurchaseOrder", "read") && (
                    <li>
                      <NavLink to="/purchaseorder-list">
                        <LuShoppingBag className="fs-6" />
                        Purchase Order
                      </NavLink>
                    </li>
                  )}
                  {canAccess("GRNverification", "read") && (
                    <li>
                      <NavLink to="/grnverification-list">
                        <LuShoppingBag className="fs-6" />
                        GRN Verification
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Purchase", "read") && (
                    <li>
                      <NavLink to="purchase-list">
                        <LuShoppingBag className="fs-6" />
                        Purchase
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DebitNote", "read") && (
                    <li>
                      <NavLink to="debit-note">
                        <LuScrollText className="fs-6" />
                        Debit Note
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            </ul>
          )}

          {/* Sales*/}
          {hasSalesOrderAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("sales")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Sales</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "sales" ? "rotate" : ""}`}
                    style={{
                      transform:
                        openDropdown === "sales" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "sales" ? "open" : ""}`}
                >
                  {canAccess("Quotation", "read") && (
                    <li>
                      <NavLink to="quotation">
                        <LuNotepadText className="fs-6" />
                        Quotaion
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Proforma", "read") && (
                    <li>
                      <NavLink to="proforma-invoices">
                        <LuNotepadText className="fs-6" />
                        Proforma Invoice
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Sales", "read") && (
                    <li>
                      <NavLink to="online-orders">
                        <LuPackageCheck className="fs-6" />
                        Sale Order
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Invoices", "read") && (
                    <li>
                      <NavLink to="invoice">
                        <LuNotebookPen className="fs-6" />
                        Sale Invoice
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Ewaybill", "read") && (
                    <li>
                      <NavLink to="ewaybill">
                        <VscNotebookTemplate className="fs-6" />
                        E-way Bill
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Delivery Challan", "read") && (
                    <li>
                      <NavLink to="deliverychallan">
                        <img
                          src={deliverychallan}
                          alt=""
                          style={{ width: "16px" }}
                        />
                        Delivery Challan
                      </NavLink>
                    </li>
                  )}
                  {canAccess("CreditNote", "read") && (
                    <li>
                      <NavLink to="creditnotelist">
                        <LuReceiptIndianRupee className="fs-6" />
                        Credit Note
                      </NavLink>
                    </li>
                  )}
                  {/* {canAccess("OverdueInvoice", "read") && ( */}
                  <li>
                    <NavLink to="overdueinvoice">
                      <VscNotebookTemplate className="fs-6" />
                      Overdue Invoice
                    </NavLink>
                  </li>
                  {/* )} */}
                </ul>
              </li>
            </ul>
          )}

          {hasWarehouseAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "18px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("warehouse")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Warehouse</span>

                  <MdOutlineKeyboardArrowRight
                    size={14}
                    style={{
                      transform:
                        openDropdown === "warehouse" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown */}
                <ul
                  className={`dropdown ${openDropdown === "warehouse" ? "open" : ""
                    }`}
                >
                  {canAccess("Warehouse", "read") && (
                    <li>
                      <NavLink to="Warehouse">
                        <LuPackageCheck className="fs-6" />
                        Warehouse
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Zones", "read") && (
                    <li>
                      <NavLink to="zones">
                        <PiWarehouseBold className="fs-6" />
                        Zones
                      </NavLink>
                    </li>)}
                  {canAccess("ProductAllocation", "read") && (
                    <li>
                      <NavLink to="product-allocation">
                        <MdOutlineInventory2 className="fs-6" />
                        Product Allocation
                      </NavLink>
                    </li>)}
                  {canAccess("QRCode", "read") && (
                    <li>
                      <NavLink to="qr-code">
                        <LuPrinter className="fs-6" />
                        Print QR Code
                      </NavLink>
                    </li>)}
                  {canAccess("QRCodeScan", "read") && (
                    <li>
                      <NavLink to="qr-code-scan">
                        <MdQrCode2 className="fs-6" />
                        Scan QR Code
                      </NavLink>
                    </li>)}
                  {canAccess("TransferProduct", "read") && (
                    <li>
                      <NavLink to="transfer-product">
                        <TbTransfer className="fs-6" />
                        Transfer Product
                      </NavLink>
                    </li>)}
                  {canAccess("Dispatch", "read") && (
                    <li>
                      <NavLink to="dispatch">
                        <LuPackageCheck className="fs-6" />
                        Dispatch
                      </NavLink>
                    </li>)}
                  {/* {canAccess("StockMovement", "read") && (
                    <li>
                      <NavLink to="stockmovement">
                        <LuNotepadText className="fs-6" />
                        Stock Movement
                      </NavLink>
                    </li>
                  )} */}
                </ul>
              </li>
            </ul>
          )}

          {/* Transport */}
          {hasTransport && (
            <ul className="sidebarmenu" style={{ paddingBottom: "0px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("transport")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Transport</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "customers" ? "rotate" : ""}`}
                    style={{
                      transform:
                        openDropdown === "transport" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "transport" ? "open" : ""}`}
                >
                  {canAccess("VehicleDriver", "read") && (
                    <li>
                      <NavLink to="vehicle-driver">
                        <MdDriveEta className="fs-6" />
                        Vehicles & Driver
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Transporter", "read") && (
                    <li>
                      <NavLink to="transport">
                        <MdEmojiTransportation className="fs-6" />
                        Transporter
                      </NavLink>
                    </li>
                  )}
                  {canAccess("Shipments", "read") && (
                    <li>
                      <NavLink to="shipments">
                        <FaShippingFast className="fs-6" />
                        Shipments
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              <hr style={{ height: "1px", color: "#979797ff" }} />
            </ul>
          )}

          {/* My Online Store */}
          {hasMyOnlineStoreAcess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "0px" }}>
              <li className="sidebarmenu-item">
                <div
                  onClick={() => handleToggle("myonlinestore")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>My Online Store</span>
                  <button
                    style={{
                      border: "1px solid #4105F5",
                      borderRadius: "50px",
                      backgroundColor: "transparent",
                      padding: "4px 8px",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      color: "#4105F5",
                      fontWeight: "500",
                    }}
                  >
                    UPCOMING
                  </button>
                </div>
              </li>
              <hr style={{ height: "1px", color: "#979797ff" }} />
            </ul>
          )}

          {/* Expenses */}
          {hasExpensesAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              {canAccess("Expense", "read") && (
                <li
                  className="expenses-li"
                  style={{ fontSize: "15px", paddingBottom: "10px" }}
                >
                  <NavLink
                    to="expense"
                    style={{
                      fontSize: "15px",
                      textDecoration: "none",
                      color: "black",
                    }}
                  >
                    Expense
                  </NavLink>
                </li>
              )}
            </ul>
          )}

          {/* Points & Rewards */}
          {hasPointRewardsAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li
                className="pointsrewards-li"
                style={{ fontSize: "15px", paddingBottom: "10px" }}
              >
                <NavLink
                  to="point-rewards"
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Points & Rewards
                </NavLink>
              </li>
            </ul>
          )}

          {/* Trash */}
          {hasTrashAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              {canAccess("Trash", "read") && (
                <li
                  className="trash-li"
                  style={{ fontSize: "15px", paddingBottom: "10px" }}
                >
                  <NavLink
                    to="trash"
                    style={{
                      fontSize: "15px",
                      textDecoration: "none",
                      color: "black",
                    }}
                  >
                    Trash
                  </NavLink>
                </li>
              )}
            </ul>
          )}

          {/* Reports */}
          {hasRepostrsacces && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px", }}>
              <li
                className="sidebarmenu-item"
                style={{ paddingBottom: "10px" }}
              >
                <div
                  onClick={() => handleToggle("reports")}
                  className="sidebarmenu-title"
                  style={{ color: "black", fontSize: "14px" }}
                >
                  <span>Reports</span>
                  <MdOutlineKeyboardArrowRight
                    size={14}
                    // className={`dropdown-icon ${openDropdown === "reports" ? "rotate" : ""}`}
                    style={{
                      transform:
                        openDropdown === "reports" ? "rotate(90deg)" : "",
                    }}
                  />
                </div>

                {/* Dropdown items */}
                <ul
                  className={`dropdown ${openDropdown === "reports" ? "open" : ""}`}
                >
                  {canAccess("SalesReport", "read") && (
                    <li>
                      <NavLink to="sales-report">
                        <LuFileInput className="fs-6" />
                        Sales Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("PurchaseReport", "read") && (
                    <li>
                      <NavLink to="purchase-report">
                        <LuFileCheck2 className="fs-6" />
                        Purchase Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("InventoryReport", "read") && (
                    <li>
                      <NavLink to="inventory-report">
                        <LuFileBox className="fs-6" />
                        Product Timeline
                      </NavLink>
                    </li>
                  )}
                  {canAccess("ProductWiseReport", "read") && (
                    <li>
                      <NavLink to="product-wise-report">
                        <LuFileBox className="fs-6" />
                        Product Wise Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("SupplierReport", "read") && (
                    <li>
                      <NavLink to="supplier-report">
                        <RiFileUserLine className="fs-6" />
                        Supplier Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DamageReport", "read") && (
                    <li>
                      <NavLink to="damage-report">
                        <LuFileX2 className="fs-6" />
                        Damage Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("CreditNoteReport", "read") && (
                    <li>
                      <NavLink to="credit-note-report">
                        <LuFileChartPie className="fs-6" />
                        Credit Note Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("DebitNoteReport", "read") && (
                    <li>
                      <NavLink to="debit-note-report">
                        <LuFileChartPie className="fs-6" />
                        Debit Note Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("ExpireReport", "read") && (
                    <li>
                      <NavLink to="expire-report">
                        <LuFileChartPie className="fs-6" />
                        Expire Report
                      </NavLink>
                    </li>
                  )}
                  {canAccess("CustomerOverdueReport", "read") && (
                    <li>
                      <NavLink to="customer-overdue-report">
                        <LuFileClock className="fs-6" />
                        Customer Overdue
                      </NavLink>
                    </li>
                  )}
                  {canAccess("SupplierOverdueReport", "read") && (
                    <li>
                      <NavLink to="supplier-overdue-report">
                        <LuFileClock className="fs-6" />
                        Supplier Overdue
                      </NavLink>
                    </li>
                  )}
                  {canAccess("ExpensesReport", "read") && (
                    <li>
                      <NavLink to="expenses-report">
                        <LuFileClock className="fs-6" />
                        Expense Report
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
              {/* <hr style={{height:"1px", color:"#979797ff"}}/> */}
            </ul>
          )}

          {/* User Role and managemnt */}
          {canAccess("Users", "read") && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li
                className="user-role-li"
                style={{ fontSize: "10px", paddingBottom: "10px" }}
              >
                <NavLink
                  className="sidebarmenu-title"
                  to="users"
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Users Role & Management
                </NavLink>
              </li>
            </ul>
          )}

          {/* Settings */}
          {hasSettingsAccess && (
            <ul className="sidebarmenu" style={{ paddingBottom: "10px" }}>
              <li
                className="user-role-li"
                style={{ fontSize: "10px", paddingBottom: "10px" }}
              >
                <NavLink
                  className="sidebarmenu-title"
                  to="settings/user-profile-settings"
                  style={{
                    fontSize: "15px",
                    textDecoration: "none",
                    color: "black",
                  }}
                >
                  Settings
                </NavLink>
              </li>
            </ul>
          )}
        </div>
        {/* User Info */}
        {userData ? (
          <div
            className="d-flex justify-content-between align-items-center"
            style={{
              backgroundColor: "white",
              position: "absolute",
              bottom: "5px",
              width: "200px",
            }}
          >
            <div className="d-flex gap-2">
              {/* Profile Image OR First Letter */}
              {userData?.profileImage?.url ? (
                <img
                  src={userData.profileImage.url}
                  alt="Profile"
                  style={{
                    borderRadius: "50px",
                    objectFit: "fil",
                    height: "40px",
                    width: "40px",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "40px",
                    width: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#e5e7eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                  }}
                >
                  {userData?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}

              {/* User Info */}
              <div className="user-id-info">
                <p
                  style={{
                    marginBottom: "0",
                    color: "black",
                    fontSize: "14px",
                    fontFamily: "Inter",
                  }}
                >
                  {userData?.name || "User"}
                </p>
                <p
                  style={{
                    marginBottom: "0",
                    color: "grey",
                    fontSize: "14px",
                    fontFamily: "Inter",
                  }}
                >
                  {userData?.role?.roleName || "User"}
                </p>
              </div>
            </div>

            {/* Logout */}
            <IoLogOutOutline
              onClick={setloginPop}
              color="red"
              title="Logout"
              size={18}
              style={{ cursor: "pointer" }}
            />
          </div>
        ) : null}

        {/* Logout PopUp */}
        {loginPop && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.30)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            {/* Modal Box */}
            <div
              style={{
                backgroundColor: "white",
                width: "420px",
                maxWidth: "92vw",
                borderRadius: "12px",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
                overflow: "hidden",
                padding: "15px 20px 10px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: "600",
                    color: "#1F2937",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Confirm Logout
                </span>
              </div>

              {/* Body */}
              <div
                style={{
                  padding: "0px 0px 10px 0px",
                  textAlign: "center",
                  borderBottom: "1px solid #F1F1F1",
                  width: "100%",
                }}
              >
                <p
                  style={{
                    margin: "0 0 0px 0",
                    fontSize: "18px",
                    color: "#9c9da0ff",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  Are You Sure You Want to Logout ?
                </p>
              </div>

              {/* Footer Buttons */}
              <div
                style={{
                  padding: "15px 0px",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => setloginPop(false)}
                  style={{
                    padding: "6px 10px",
                    fontSize: "18px",
                    fontWeight: "400",
                    color: "#6B7280",
                    backgroundColor: "#6b728038",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    minWidth: "80px",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#F3F4F6")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#6b728038")
                  }
                >
                  Cancel
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    padding: "6px 10px",
                    fontSize: "18px",
                    fontWeight: "400",
                    color: "#EF4444",
                    backgroundColor: "#ef44443f ",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    minWidth: "80px",
                  }}
                  onMouseEnter={(e) =>
                    (e.target.style.backgroundColor = "#F3F4F6")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.backgroundColor = "#ef44443f")
                  }
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
