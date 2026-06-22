import React from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet, useLocation, matchPath } from "react-router-dom";



const MainLayouts = () => {
  const location = useLocation();

  // check if current route is addproduct
  const hideSidebar =
    location.pathname === "/createinvoice" ||
    location.pathname === "/create-quotition" ||
    location.pathname === "/create-ewaybill" ||
    location.pathname === "/createdeliverychallan" ||
    location.pathname === "/create-proforma" ||
    location.pathname === "/create-supplier-debitnote" ||
    location.pathname === "/add-product" ||
    location.pathname === "/product/edit" ||
    location.pathname === "/viewproduct" ||
    location.pathname === "/add-warehouse" ||
    location.pathname === "/create-shipments" ||
    location.pathname === "/m/create-creditnote" ||
    location.pathname === "/skeleton-two" ||
    location.pathname === "/createdispatch" ||
    location.pathname === "/create-purchase-order" ||
    location.pathname === "/create-purchase" ||
    // for role
    location.pathname === "/create-role" ||
    matchPath("/edit-role/:id", location.pathname) ||

    // for edit view product
    matchPath("/product/edit/:id", location.pathname) ||
    matchPath("/product/view/:id", location.pathname) ||
    // for invoice, quotation, credit note
    matchPath("/createinvoice/:customerId", location.pathname) ||
    matchPath("/create-quotition/:customerId", location.pathname) ||
    matchPath("/create-proforma/:id", location.pathname) ||
    matchPath("/edit-proforma/:proformaId", location.pathname) ||
    matchPath("/view-proforma/:proformaId", location.pathname) ||
    matchPath("/create-proforma-from-quotation/:quotationId", location.pathname) ||
    location.pathname === "/credit-note" ||
    matchPath("/credit-note/:customerId", location.pathname) ||
    // for purchaseorder, debit note
    matchPath("/create-purchase-orders/:supplierId", location.pathname) ||
    location.pathname === "/create-purchase-orders" ||
    matchPath("/create-supplier-debitnote/:supplierId", location.pathname) ||
    // ========== ADD SALES ORDER ROUTES HERE ==========
    // Sales Order creation routes
    location.pathname === "/create-sales-order" ||
    matchPath("/create-sales-order/:customerId", location.pathname) ||
    matchPath("/sales-order/:orderId", location.pathname) ||
    matchPath("/show-sales-order/:orderId", location.pathname);

  location.pathname === "/create-debitnote";
  return (
    <div
      className="main-layouts"
      style={{
        backgroundColor: "#EFEFEF",
        display: "flex",
        overflow: "hidden",
        maxHeight: "100vh",
      }}
    >
      {!hideSidebar && <Sidebar />}

      <div
        className="right-layouts d-flex flex-column"
        style={{
          width: hideSidebar ? "100%" : "calc(100% - 235px)",

        }}
      >
        <Navbar />
        <div style={{ borderLeft: "1px solid #e0dedeff" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default MainLayouts;
