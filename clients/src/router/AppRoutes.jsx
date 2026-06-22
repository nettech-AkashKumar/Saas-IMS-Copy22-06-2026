// import { Routes, Route, Navigate } from "react-router-dom";
// import { useMemo } from "react";
// // import Dashboard from "../pages/tenant/Dashboard";
// // import Dashboard from "../components/Dashboard/Admin/AdminDashboard";
// import Dashboard from "../../components/Dashboard/Admin/AdminDashboard";

// import AllLogin from "../component/LoginPage/AllLogin";
// import PrivateRoute from "../../utils/PrivateRoute";
// import MainLayouts from "../../components/LayoutsCopy/MainLayouts";

// /* ================= PRIVATE ROUTE ================= */
// // Delegated to apps/PrivateRoute.jsx which handles cross-subdomain token from URL
// import PrivateRouteGlobal from "./PrivateRoute";

// /* ================= PUBLIC ROUTE (LOGIN ONLY) ================= */
// function PublicRoute({ children }) {
//   const hasTokenInQuery = useMemo(() => {
//     const params = new URLSearchParams(window.location.search);
//     const token = params.get("token");
//     const subdomain = params.get("subdomain");
//     const dbName = params.get("dbName");

//     if (token) {
//       localStorage.setItem("token", token);
//       if (subdomain) localStorage.setItem("subdomain", subdomain);
//       if (dbName) localStorage.setItem("dbName", dbName);
//       window.history.replaceState(
//         {},
//         "",
//         `${window.location.pathname}${window.location.hash || ""}`,
//       );
//       return true;
//     }

//     return false;
//   }, []);

//   const token = localStorage.getItem("token");
//   return token || hasTokenInQuery ? (
//     <Navigate to="/dashboard" replace />
//   ) : (
//     children
//   );
// }

// /* ================= TENANT APP ================= */
// export default function TenantApp() {
//   return (
//     <Routes>
//       {/* Login */}
//       <Route
//         path="/login"
//         element={
//           <PublicRoute>
//             <AllLogin />
//           </PublicRoute>
//         }
//       />

//       <Route
//         path="/all-login"
//         element={
//           <PublicRoute>
//             <AllLogin />
//           </PublicRoute>
//         }
//       />

//       {/* <Route
//         element={
//           <PrivateRoute>
//             <MainLayouts />
//           </PrivateRoute>
//         }
//       ></Route> */}
//       {/* Dashboard */}
//       <Route
//         path="/dashboard"
//         element={
//           <PrivateRouteGlobal>
//             <Dashboard />
//           </PrivateRouteGlobal>
//         }
//       />

//       {/* Default: no token → login, token → dashboard (PrivateRoute handles) */}
//       <Route path="*" element={<Navigate to="/login" replace />} />
//     </Routes>
//   );
// }

// import { Routes, Route, Navigate } from "react-router-dom";
// import { useMemo } from "react";
// import Dashboard from "../SaaS/pages/tenant/Dashboard";
// import AllLogin from "../SaaS/component/LoginPage/AllLogin";
// import MainLayouts from "../components/LayoutsCopy/MainLayouts.jsx";

// /* ================= PRIVATE ROUTE ================= */
// // Delegated to apps/PrivateRoute.jsx which handles cross-subdomain token from URL
// import PrivateRouteGlobal from "../SaaS/apps/PrivateRoute";

// /* ================= PUBLIC ROUTE (LOGIN ONLY) ================= */
// function PublicRoute({ children }) {
//   const hasTokenInQuery = useMemo(() => {
//     const params = new URLSearchParams(window.location.search);
//     const token = params.get("token");
//     const subdomain = params.get("subdomain");
//     const dbName = params.get("dbName");

//     if (token) {
//       localStorage.setItem("token", token);
//       if (subdomain) localStorage.setItem("subdomain", subdomain);
//       if (dbName) localStorage.setItem("dbName", dbName);
//       window.history.replaceState(
//         {},
//         "",
//         `${window.location.pathname}${window.location.hash || ""}`,
//       );
//       return true;
//     }

//     return false;
//   }, []);

//   const token = localStorage.getItem("token");
//   return token || hasTokenInQuery ? (
//     <Navigate to="/dashboard" replace />
//   ) : (
//     children
//   );
// }

// /* ================= TENANT APP ================= */
// export default function TenantApp() {
//   return (
//     <Routes>
//       {/* Login */}
//       <Route
//         path="/login"
//         element={
//           <PublicRoute>
//             <AllLogin />
//           </PublicRoute>
//         }
//       />

//       <Route
//         path="/all-login"
//         element={
//           <PublicRoute>
//             <AllLogin />
//           </PublicRoute>
//         }
//       />

//       <Route
//         element={
//           <PrivateRouteGlobal>
//             <MainLayouts />
//           </PrivateRouteGlobal>
//         }
//       >
//         <Route
//           element={
//             <PrivateRoute>
//               <MainLayouts />
//             </PrivateRoute>
//           }
//         >
//           {/* Dashboard */}
//           <Route
//             path="/dashboard"
//             element={
//               <PrivateRouteGlobal>
//                 <Dashboard />
//               </PrivateRouteGlobal>
//             }
//           />
//         </Route>
//       </Route>

//       {/* Default: no token → login, token → dashboard (PrivateRoute handles) */}
//       <Route path="*" element={<Navigate to="/login" replace />} />
//     </Routes>
//   );
// }

// ----------------main code----------------

import React from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

import Login from "../components/auth/Login/Login";
import Register from "../components/auth/Register/Register";
import ForgotPassword from "../components/auth/ForgotPassword/ForgotPassword";
import Dashboard from "../components/Dashboard/Admin/AdminDashboard";
// import Setting from "../settings/Setting";
import ResetPassword from "../components/auth/ResetPassword/ResetPassword";
import ChangePassword from "../components/auth/ChangePassword/ChangePassword";
import Profile from "../pages/profile/Profile";
import PrivateRoute from "../utils/PrivateRoute";
import PublicRoute from "../utils/PublicRoute.jsx";
import Product from "../components/features/inventory/product/Product";
import ChooseToAddProduct from "../components/features/inventory/product/ChooseToAddProduct.jsx";
import ProductCreate from "../components/features/inventory/product/ProductCreate";
import ProductView from "../components/features/inventory/product/ProductView.jsx";
import DamageReturn from "../components/features/inventory/Damage&Return/DamageReturn.jsx";
import ExpriedProduct from "../components/features/inventory/product/ExpriedProduct";
import Category from "../components/features/category/Category";
import SubCategory from "../components/features/category/subcategory/SubCategory";
import Users from "../components/auth/users/Users";
import Role from "../pages/Role/Role";
import Logout from "../components/auth/Logout/Logout.jsx"; // adjust path if needed
import Coupons from "../components/features/Promo/Coupons.jsx";
import GiftCard from "../components/features/Promo/GiftCard.jsx";
import "../i18n.js"; // Import here
import Chat from "../components/features/Chat/Chat.jsx";
import Activities from "../components/activities.jsx";
import ViewAllNotifications from "../components/ViewAllNotifications.jsx";
import Barcode from "../components/features/inventory/barcode/Barcode.jsx";
import MailPage from "../components/features/Mail/Pages/MailPage.jsx";
import Inbox from "../components/features/Mail/EmailLayout/Inbox.jsx";
import Starred from "../components/features/Mail/EmailLayout/Starred.jsx";
import Sent from "../components/features/Mail/EmailLayout/Sent.jsx";
import Drafts from "../components/features/Mail/EmailLayout/Drafts";
import Importants from "../components/features/Mail/EmailLayout/Importants.jsx";
import Spam from "../components/features/Mail/EmailLayout/Spam.jsx";
import Deleted from "../components/features/Mail/EmailLayout/Deleted.jsx";
import EmailMessages from "../components/features/Mail/EmailMessages/EmailMessages.jsx";
import Purchase from "../components/features/purchase/Purchases/Purchase.jsx";
// import PurchaseOrder from "../components/features/purchase/PurchaseOrder/PurchaseOrder.jsx";
import PurchaseOrder from "../components/features/purchase/Purchases/PurchaseOrder.jsx";
import Hsn from "../components/features/inventory/hsn/Hsn.jsx";
import DebitNote from "../components/features/creditDebit/debitNote/DebitNote.jsx";
import CustomerCreditNote from "../components/features/creditDebit/creditNote/CustomerCreditNote.jsx";
import Sales from "../components/features/sales/Sales.jsx";
import SalesDashboard from "../components/features/sales/SalesDashboard.jsx";
import SaleReturn from "../components/features/sales/return/SaleReturn.jsx";
import AllCustomer from "../components/features/customers/AllCustomers.jsx";
import LowStock from "../components/features/stock/lowstock/LowStock.jsx";
import InvoiceTemplate from "../pages/Invoices/Invoice.jsx";   //this is my real invoice page 
import SaleHistory from "../../../clients/src/components/features/sales/SaleHistory.jsx";
import ViewSales from "../components/features/sales/ViewSales.jsx";
import Invoice from "../components/features/sales/Invoice.jsx";
import SalePaymentHistory from "../../../clients/src/components/features/sales/SalesPaymentHistory.jsx";
import Pos from "../pages/pos/Pos.jsx";
import BalanceSheet from "../pages/finance&accounts/balance_sheet/BalanceSheet.jsx";
import ProfitLoss from "../pages/finance&accounts/profit_loss/ProfitLoss.jsx";
import ProfitLossDateChoose from "../pages/finance&accounts/profit_loss/ProfitLossDateChoose.jsx";
import ProfitLossSelectDate from "../pages/finance&accounts/profit_loss/ProfitLossSelectDate.jsx";
import ExpenseForm from "../pages/finance&accounts/expense_report/ExpenseForm.jsx";
import ExpenseFormEdit from "../pages/finance&accounts/expense_report/ExpenseFromEdit.jsx";
import BC from "../pages/finance&accounts/b2b&b2c/BC.jsx";
import PaymentHistory from "../pages/finance&accounts/payment_history/PaymentHistory.jsx";
import Credit from "../pages/finance&accounts/credit&debit_note/Credit.jsx";
import Debit from "../pages/finance&accounts/credit&debit_note/Debit.jsx";
import ExpenseReportProductModal from "../pages/finance&accounts/expense_report/ExpenseReportProductModal.jsx";
import SalesReport from "../pages/finance&accounts/SalesReport.jsx";
import PurchaseReport from "../pages/finance&accounts/PurchaseReport.jsx";
import InventoryReport from "../pages/finance&accounts/InventoryReport.jsx";
import SupplierReport from "../pages/finance&accounts/SupplierReport.jsx";
import DamageReport from "../pages/finance&accounts/DamageReport.jsx";
import DamageReturnReport from "../pages/finance&accounts/DamageReturnReport.jsx";
import CreditNoteReport from "../pages/finance&accounts/credit&debit_note/CreditDebitNotes.jsx";
import DebitNoteReport from "../pages/finance&accounts/credit&debit_note/DebitNoteReport.jsx";

import CustomerOverdueReport from "../pages/finance&accounts/overdue_report/OverdueReport.jsx";
import Expense from "../pages/finance&accounts/expense_report/ExpenseReport.jsx";
import PosHeader from "../pages/pos/posHead/PosHeader.jsx";
import OtpVerification from "../components/auth/TwoStepOtpVerification.jsx";
import CustomerCreateQuotation from "../pages/Invoices/CustomerCreateQuotation.jsx";
import Trash from "../pages/Delete/Trash.jsx";
import AddSalesModal from "../pages/Modal/SalesModal/AddSalesModal.jsx";
import ActivityLog from "../pages/AuditLog/ActivityLog.jsx";
import EmptyCustomers from "../components/features/customers/EmptyCustomers.jsx";
import CustomerCreateInvoice from "../pages/Invoices/CustomerCreateInvoice.jsx";
import CustomerCreateSalesOrder from "../pages/Invoices/CustomerCreateSalesOrder.jsx";
import CustomerCreateProformaInvoice from "../pages/Invoices/CustomerCreateProformaInvoice.jsx";
import ProformaInvoices from "../pages/Invoices/ProformaInvoice.jsx";
// import ShowProformaInvoice from "../pages/Invoices/ShowProformaInvoice.jsx";
import Skeletontwo from "../components/SkeletonTwo.jsx";
import Skeleton from "../components/Skeleton.jsx";
import CustomerDuesAdvanceList from "../components/features/customers/CustomerDuesAdvanceList.jsx";
import CustomerDueEmpty from "../components/features/customers/CustomerDueEmpty.jsx";
import ShowCustomerInvoice from "../pages/Invoices/ShowCustomerInvoice.jsx";
import PointsRewards from "../components/features/Promo/PointsRewards.jsx";
import CreateShoppingPoints from "../components/features/Promo/CreateShoppingPoints.jsx";
import ShowCustomerInvoiceQuotation from "../pages/Invoices/ShowCustomerInvoiceQuotation.jsx";
import SupplierList from "../components/features/suppliers/SupplierList.jsx";
import EmptySupplier from "../components/features/suppliers/EmptySupplier.jsx";
import SupplierDetails from "../components/features/suppliers/SupplierDetails.jsx";
import CreatePurchase from "../pages/Invoices/CreatePurchase.jsx";
import SupplierDebitNote from "../components/features/creditDebit/debitNote/SupplierDebitNote.jsx";
import ShowPurchaseInvoice from "../pages/Invoices/ShowPurchaseInvoice.jsx";
import RecentViewInvoice from "../pages/Invoices/RecentViewInvoice.jsx";
import WhatsappInterface from "../components/features/Whatsapp/WhatsappInterface.jsx";
import WhatsappScanner from "../components/features/Whatsapp/WhatsappScanner.jsx";
import SettingsLayouts from "../components/features/Settings/SettingsLayouts.jsx";
import UserProfile from "../components/features/Settings/UserProfile.jsx";
import SettingsCompanyDetails from "../components/features/Settings/SettingsCompanyDetails.jsx";
import NormalPrint from "../components/features/Settings/NormalPrint.jsx";
import NormalPrintInvoice from "../components/features/Settings/NormalPrintInvoice.jsx";
import ThermalPrintInvoice from "../components/features/Settings/ThermalPrintInvoice.jsx";
import ThermalPrint from "../components/features/Settings/ThermalPrint.jsx";
import NotesTermCondition from "../components/features/Settings/NotesTermCondition.jsx";
import Taxes_GST from "../components/features/Settings/Taxes_GST.jsx";
import CreateRole from "../pages/Modal/CreateRole.jsx";
import EditRole from "../pages/Modal/EditRole.jsx";
import BarCodePrint from "../components/features/Settings/BarCodePrint.jsx";
import MainLayouts from "../components/LayoutsCopy/MainLayouts.jsx";
import Quotation from "../pages/Invoices/Quotation.jsx";
import DebitNoteViewEdit from "../components/features/creditDebit/debitNote/DebitNoteViewEdit.jsx";
import EmptyDebitNote from "../components/features/creditDebit/debitNote/EmptyDebitNote.jsx";
import CreditNoteList from "../components/features/creditDebit/creditNote/CreditNoteList.jsx";
import SettingCompanyBank from "../components/componentSetting/companySettings/SettingCompanyBank.jsx";
import EmptyPurchase from "../components/features/purchase/Purchases/EmptyPurchase.jsx";
import PurchaseViewDetails from "../components/features/purchase/Purchases/PurchaseViewDetails.jsx";
import System_Setting from "../components/features/Settings/System_Setting.jsx";
import CustomerCreditNoteViewEdit from "../components/features/creditDebit/creditNote/CustomerCreditNoteViewEdit .jsx";
import AccessDenied from "../components/AccessDenied.jsx";
import PermissionRoute from "./PermissionRoute.jsx";
import UserDetails from "../components/auth/users/UserDetails.jsx";
import PricingPlans from "../components/features/Settings/PricingPlans.jsx";
import Supports from "../components/features/Settings/Supports.jsx";
import Brand from "../components/features/inventory/brand/Brand.jsx";
import Units from "../components/features/inventory/units/Units.jsx";
import Color from "../components/features/inventory/Color/Colors.jsx";
import Size from "../components/features/inventory/Size/Size.jsx";
import Tax from "../components/features/inventory/Tax/Tax.jsx";
import AllLogin from "../SaaS/component/LoginPage/AllLogin.jsx";
import Transport from "../components/features/Transporter/Transport.jsx";
import VehicleDriver from "../components/features/Transporter/VehicleDriver.jsx";
import Shipments from "../components/features/Transporter/Shipments.jsx";
import Warehouse from "../components/features/warehouse/Warehouse.jsx";
import AddWarehouse from "../components/features/warehouse/AddWarehouse.jsx";
import WarehouseDetails from "../components/features/warehouse/WarehouseDetails.jsx";
import StockMovement from "../components/features/warehouse/StockMovementLog.jsx";
import Zones from "../components/features/warehouse/Zones.jsx";
import ProductAllocation from "../components/features/warehouse/ProductAllocation.jsx";
import TransferProduct from "../components/features/warehouse/TransferProduct.jsx";
import Dispatch from "../components/features/warehouse/Dispach.jsx";
import CreateDispatch from "../components/features/warehouse/CreateDispatch.jsx";
import QrCode from "../components/features/warehouse/QrCode.jsx";
import AddQrCode from "../components/features/warehouse/AddQrCode.jsx";
import QRCodeScan from "../components/features/warehouse/QRCodeScan.jsx";
import AddTransfer from "../components/features/warehouse/AddTransfer.jsx";
import AssignProduct from "../components/features/warehouse/AssignProduct.jsx";
import InventoryLocator from "../components/features/warehouse/InventoryLocator.jsx";
import ShowProformaInvoice from "../pages/Invoices/ShowCustomerProformaInvoice.jsx";
import EwayBill from "../components/features/Ewaybill/ewaybill.jsx";
import DeliverychallanList from "../components/features/DeliveryChallan/DeliverychallanList.jsx";
import CreateDeliveryChallan from "../components/features/DeliveryChallan/CreateDeliveryChallan.jsx";
import ShowSalesOrder from "../pages/Invoices/ShowSalesOrder.jsx";
import CreateEwayBill from "../components/features/Ewaybill/CreateEwayBiil.jsx";
import CreateShipments from "../components/features/Transporter/CreateShipments.jsx";
import PrintDeliveryChallan from "../pages/Invoices/PrintDeliveryChallan.jsx";
import ShowDeliveryChallan from "../pages/Invoices/ShowDeliveryChallan.jsx";
import PreviewDeliveryChallan from "../pages/Invoices/PreviewDelivery.jsx";
import BrokerSalesman from "../components/features/Brokers/broker_salesman.jsx";
import Ledger from "../components/features/Brokers/Ledger.jsx";
import AssignTarget from "../components/features/Brokers/AssignTarget.jsx";
import OverdueInvoice from "../components/features/OverdueInvoice/OverdueInvoice.jsx";
import CreatePurchaseOrder from "../pages/Invoices/CreatePurchaseOrder.jsx";
import GRNVerification from "../components/features/purchase/Purchases/GRNVerification.jsx";
import ConvertGRNVerificationForm from "../pages/Invoices/ConvertGRNVerificationForm.jsx";
import ProductWiseReport from "../pages/finance&accounts/ProductWiseReport.jsx";
import ExpireReport from "../pages/finance&accounts/ExpireReoptr.jsx";
import ExpensesReport from "../pages/finance&accounts/ExpensesReport.jsx";
import SupplierOverdueReport from "../pages/finance&accounts/SupplierOverdueReport.jsx";
// import CreditNoteReport from "../pages/finance&accounts/CreditNoteReport.jsx";
// import AddZones from "../components/features/warehouse/AddZones.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ================= ACCESS DENIED ================= */}
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* ---------- Public routes ---------- */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
            {/* <AllLogin /> */}
          </PublicRoute>
        }
      />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
            {/* <AllLogin /> */}
          </PublicRoute>
        }
      />

      <Route
        path="/otp"
        element={
          // <PublicRoute>
          <OtpVerification />
          // </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      <Route
        path="/change-password"
        element={
          <PublicRoute>
            <ChangePassword />
          </PublicRoute>
        }
      />

      <Route path="/logout" element={<Logout />} />

      <Route
        element={
          <PrivateRoute>
            <MainLayouts />
          </PrivateRoute>
        }
      >
        {/* <Route element={<PermissionRoute module="Dashboard" />}> */}
        <Route path="/home" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* </Route> */}

        <Route path="/profile" element={<Profile />} />
        <Route path="/activities" element={<Activities />} />
        <Route
          path="/ViewAllNotifications"
          element={<ViewAllNotifications />}
        />

        {/* product */}
        <Route element={<PermissionRoute module="Product" />}>
          <Route path="/product" element={<Product />} />
        </Route>
        <Route path="/product/edit/:id" element={<ProductCreate />} />
        <Route path="/product/view/:id" element={<ProductView />} />
        <Route path="/choose-adproduct" element={<ChooseToAddProduct />} />
        <Route path="/add-product" element={<ProductCreate />} />
        <Route path="/expired-products" element={<ExpriedProduct />} />

        {/* category */}
        <Route element={<PermissionRoute module="Category" />}>
          <Route path="/category-list" element={<Category />} />
        </Route>

        {/* sub - category */}
        <Route element={<PermissionRoute module="SubCategory" />}>
          <Route path="/sub-categories" element={<SubCategory />} />
        </Route>

        {/* brand */}
        <Route element={<PermissionRoute module="Brand" />}>
          <Route path="/brand-list" element={<Brand />} />
        </Route>

        {/* size */}
        <Route element={<PermissionRoute module="Size" />}>
          <Route path="/size" element={<Size />} />
        </Route>

        {/* color */}
        <Route element={<PermissionRoute module="Color" />}>
          <Route path="/color" element={<Color />} />
        </Route>

        {/* units */}
        <Route element={<PermissionRoute module="Units" />}>
          <Route path="/units" element={<Units />} />
        </Route>

        {/* tax */}
        <Route element={<PermissionRoute module="Tax" />}>
          <Route path="/tax" element={<Tax />} />
        </Route>

        {/* low - out of stocks */}
        <Route element={<PermissionRoute module="LowStocks" />}>
          <Route path="/low-stocks" element={<LowStock />} />
        </Route>

        {/* hsn */}
        <Route element={<PermissionRoute module="HSN" />}>
          <Route path="/hsn" element={<Hsn />} />
        </Route>

        {/* damage records */}
        <Route element={<PermissionRoute module="DamageRecord" />}>
          <Route path="/damage-record" element={<DamageReturn />} />
        </Route>

        {/* barcode */}
        <Route element={<PermissionRoute module="Barcode" />}>
          <Route path="/barcode" element={<Barcode />} />
        </Route>

        {/* user - roles */}
        <Route element={<PermissionRoute module="Users" />}>
          <Route path="/users" element={<Users />} />
          <Route path="/usersdetails" element={<UserDetails />} />
          <Route path="/roles-permissions" element={<Role />} />
          <Route path="/create-role" element={<CreateRole />} />
          <Route path="/edit-role/:id" element={<EditRole />} />
        </Route>

        {/* chat */}
        <Route element={<PermissionRoute module="Chat" />}>
          <Route path="/chat" element={<Chat />} />
        </Route>

        {/* whatsapp */}
        <Route element={<PermissionRoute module="Whatsapp" />}>
          <Route path="/whatsapp" element={<WhatsappInterface />} />
          <Route path="/whatsapp-scanner" element={<WhatsappScanner />} />
        </Route>

        {/* points and rewards */}
        <Route element={<PermissionRoute module="PointsRewards" />}>
          <Route path="/point-rewards" element={<PointsRewards />} />
          <Route
            path="/createshoppingpoints"
            element={<CreateShoppingPoints />}
          />
          <Route path="/skeleton" element={<Skeleton />} />
          <Route path="/coupons" element={<Coupons />} />
          <Route path="/gift-cards" element={<GiftCard />} />
        </Route>

        {/* debit note */}
        <Route element={<PermissionRoute module="DebitNote" />}>
          <Route path="/debit-note" element={<DebitNote />} />
        </Route>

        {/* credit note */}
        <Route
          path="/credit-note/:customerId"
          element={<CustomerCreditNote />}
        />
        <Route path="/credit-note" element={<CustomerCreditNote />} />

        {/* purchase */}
        <Route element={<PermissionRoute module="Purchase" />}>
          <Route path="/empty-purchase" element={<EmptyPurchase />} />
          <Route path="/purchase-list" element={<Purchase />} />
          <Route
            path="/show-purchase/:id"
            element={<PurchaseViewDetails />}
          />
          <Route path="/purchase" element={<PurchaseOrder />} />
          {/* <Route path="/purchase-returns" element={<PurchaseReturn />} /> */}
        </Route>

        {/* sales */}
        <Route element={<PermissionRoute module="Sales" />}>
          <Route path="/online-orders" element={<Sales />} />
        </Route>
        <Route path="/sales-returns" element={<SaleReturn />} />
        <Route path="/sales/view/:id" element={<ViewSales />} />
        <Route path="/invoice/:invoiceId" element={<Invoice />} />
        <Route path="/sales-log" element={<SaleHistory />} />
        <Route path="/sales-payment" element={<PaymentHistory />} />
        <Route
          path="/create-quotition/:customerId"
          element={<CustomerCreateQuotation />}
        />
        <Route path="/create-quotition" element={<CustomerCreateQuotation />} />
        <Route path="/create-quotition/:quotationId" element={<CustomerCreateQuotation />} />
        <Route path="/sales-dashboard" element={<SalesDashboard />} />
        <Route
          path="/sales-invoice/:id"
          element={<RecentViewInvoice type="sales" />}
        />
        <Route
          path="/purchase-orders/:id"
          element={<RecentViewInvoice type="purchase" />}
        />
        <Route path="/add-sales" element={<AddSalesModal />} />
        <Route element={<PermissionRoute module="CreditNote" />}>
          <Route path="/creditnotelist" element={<CreditNoteList />} />
          <Route
            path="/edit-creditnote/:id"
            element={<CustomerCreditNoteViewEdit />}
          />
          <Route
            path="/creditnote-details/:id"
            element={<CustomerCreditNoteViewEdit />}
          />
        </Route>

        {/* warehouse */}
        <Route element={<PermissionRoute module="Warehouse" />}>
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/add-warehouse" element={<AddWarehouse />} />
          <Route path="/warehousedetails" element={<WarehouseDetails />} />
          <Route path="/stockmovement" element={<StockMovement />} />
          <Route path="/zones" element={<Zones />} />
          {/* <Route path="/add-zones" element={<AddZones />} /> */}
          <Route path="/qr-code" element={<QrCode />} />
          <Route path="/add-qr-code" element={<AddQrCode />} />
          <Route path="/qr-code-scan" element={<QRCodeScan />} />
          <Route path="/transfer-product" element={<TransferProduct />} />
          <Route path="/product-allocation" element={<ProductAllocation />} />
          <Route path="/dispatch" element={<Dispatch />} />
          <Route path="/createdispatch" element={<CreateDispatch />} />
          <Route path="/add-transfer" element={<AddTransfer />} />
          <Route path="/assign-product" element={<AssignProduct />} />
          <Route path="/warehousedetails/:id" element={<WarehouseDetails />} />
          <Route path="/inventory-locator" element={<InventoryLocator />} />
        </Route>

        {/* invoice */}
        <Route element={<PermissionRoute module="Invoices" />}>
          <Route path="/invoice" element={<InvoiceTemplate />} />
        </Route>

        {/* delete */}
        <Route path="/trash" element={<Trash />} />

        {/* activity */}
        <Route path="/activity" element={<ActivityLog />} />

        {/* customer */}
        <Route element={<PermissionRoute module="Customer" />}>
          <Route path="/empty-customers" element={<EmptyCustomers />} />
          <Route path="/customers" element={<AllCustomer />} />
        </Route>

        {/* broker & salesman */}
        <Route path="/broker-salesman" element={<BrokerSalesman />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="/assign-target" element={<AssignTarget />} />

        {/* dues advance */}
        <Route element={<PermissionRoute module="DuesAdvance" />}>
          <Route path="/customerdueempty" element={<CustomerDueEmpty />} />
          <Route
            path="/customerdueadvance"
            element={<CustomerDuesAdvanceList />}
          />
        </Route>

        {/* credit Note, invoice, generate quotition */}
        <Route
          path="/createinvoice/:customerId"
          element={<CustomerCreateInvoice />}
        />
        <Route
          path="/create-sales-order"
          element={<CustomerCreateSalesOrder />}
        />
        <Route path="/create-sales-order/:id" element={<CustomerCreateSalesOrder />} />

        {/* proforma */}
        <Route path="/proforma-invoices" element={<ProformaInvoices />} />
        <Route
          path="/create-proforma/:proformaId"
          element={<CustomerCreateProformaInvoice />}
        />
        <Route
          path="/create-proforma"
          element={<CustomerCreateProformaInvoice />}
        />
        <Route
          path="/edit-proforma/:proformaId"
          element={<CustomerCreateProformaInvoice />}
        />
        <Route
          path="/view-proforma/:proformaId"
          element={<CustomerCreateProformaInvoice />}
        />
        <Route
          path="/create-proforma-from-quotation/:quotationId"
          element={<CustomerCreateProformaInvoice />}
        />

        {/* eway bill */}
        <Route path="/ewaybill" element={<EwayBill />} />
        <Route path="/create-ewaybill" element={<CreateEwayBill />} />

        {/* overdueinvoice */}
        <Route path="/overdueinvoice" element={<OverdueInvoice />} />

        {/* delivery challan */}
        <Route path="/deliverychallan" element={<DeliverychallanList />} />
        <Route
          path="/createdeliverychallan"
          element={<CreateDeliveryChallan />}
        />
        <Route
          path="/show-delivery-challan/:id"
          element={<ShowDeliveryChallan />}
        />
        <Route
          path="/print-delivery-challan/:id"
          element={<PrintDeliveryChallan />}
        />

        {/* View Proforma Invoice */}
        {/* <Route 
          path="/show-proforma/:proformaId" 
          element={<ShowProformaInvoice />} 
        /> */}

        {/* Optional: Proforma Invoices List (if you have this component) */}
        {/* <Route 
          path="/proforma-invoices" 
          element={<ProformaInvoicesList />} 
        /> */}
        {/* for proforma end */}

        <Route
          path="/show-sales-order/:salesOrderId"
          element={<ShowSalesOrder />}
        />
        <Route path="/createinvoice/" element={<CustomerCreateInvoice />} />
        <Route
          path="/showinvoice/:invoiceId"
          element={<ShowCustomerInvoice />}
        />
        <Route
          path="/showquotation/:quotationId"
          element={<ShowCustomerInvoiceQuotation />}
        />
        <Route
          path="/showproforma/:proformaId"
          element={<ShowProformaInvoice />}
        />
        <Route path="skeleton-two" element={<Skeletontwo />} />

        {/* Transport */}
        <Route element={<PermissionRoute module="Transport" />}>
          <Route path="/transport" element={<Transport />} />
          <Route path="/vehicle-driver" element={<VehicleDriver />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/create-shipments" element={<CreateShipments />} />
        </Route>

        {/* suppplier */}
        <Route element={<PermissionRoute module="Supplier" />}>
          <Route path="/empty-supplier" element={<EmptySupplier />} />
          <Route path="/supplier-list" element={<SupplierList />} />
          <Route path="/supplier-details" element={<SupplierDetails />} />
        </Route>

        {/* invoice, quotation, credit note */}
        {/* for create purchase order and purchaseorderlist */}
         <Route
          path="/create-purchase-order"
          element={<CreatePurchaseOrder />}
        />
        <Route
          path="/purchaseorder-list"
          element={<PurchaseOrder />}
        />
         <Route
          path="/grnverification-list"
          element={<GRNVerification />}
        />
         <Route
          path="/convertgrnverificationform"
          element={<ConvertGRNVerificationForm />}
        />
        <Route
          path="/create-purchase/:supplierId"
          element={<CreatePurchase />}
        />
        <Route
          path="/create-purchase"
          element={<CreatePurchase />}
        />
        <Route
          path="/purchase-preview/:purchaseId"
          element={<ShowPurchaseInvoice />}
        />
        <Route
          path="/create-supplier-debitnote/:supplierId"
          element={<SupplierDebitNote />}
        />
        <Route
          path="/create-supplier-debitnote"
          element={<SupplierDebitNote />}
        />
        <Route path="/empty-debitnote" element={<EmptyDebitNote />} />
        <Route path="/edit-debitnote/:id" element={<DebitNoteViewEdit />} />
        <Route path="/debitnote-details/:id" element={<DebitNoteViewEdit />} />
        <Route element={<PermissionRoute module="Quotation" />}>
          <Route path="/quotation" element={<Quotation />} />
        </Route>

        {/* ------------------ MAIL ROUTES ------------------ */}
        <Route element={<PermissionRoute module="Mail" />}>
          <Route path="/mail" element={<MailPage />}>
            <Route path="inbox" element={<Inbox />} />
            <Route path="starred" element={<Starred />} />
            <Route path="sent" element={<Sent />} />
            <Route path="drafts" element={<Drafts />} />
            <Route path="important" element={<Importants />} />
            <Route path="allemails" element={<EmailMessages />} />
            <Route path="spam" element={<Spam />} />
            <Route path="deleted" element={<Deleted />} />
          </Route>
        </Route>

        {/* ------------------ REPORTS / Finance & Accounts ------------------ */}
        <Route path="/balance-sheet" element={<BalanceSheet />} />
        <Route path="/profit&loss" element={<ProfitLoss />} />
        <Route
          path="/profit_lossdate_choose"
          element={<ProfitLossDateChoose />}
        />
        <Route
          path="/profit_lossselect_date"
          element={<ProfitLossSelectDate />}
        />
        <Route path="/add_expenses" element={<ExpenseForm />} />
        <Route path="/expenseformedit" element={<ExpenseFormEdit />} />
        <Route
          path="/expensereportproduct-modal"
          element={<ExpenseReportProductModal />}
        />
        <Route path="/bc" element={<BC />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        <Route path="/credit" element={<Credit />} />
        <Route path="/debit" element={<Debit />} />
        <Route path="/payment" element={<SalePaymentHistory />} />

        {/* Reports */}
        <Route element={<PermissionRoute module="SalesReport" />}>
          <Route path="/sales-report" element={<SalesReport />} />
        </Route>

        <Route element={<PermissionRoute module="PurchaseReport" />}>
          <Route path="/purchase-report" element={<PurchaseReport />} />
        </Route>

        <Route element={<PermissionRoute module="InventoryReport" />}>
          <Route path="/inventory-report" element={<InventoryReport />} />
        </Route>

        <Route path="product-wise-report" element={<ProductWiseReport />} />

        <Route element={<PermissionRoute module="SupplierReport" />}>
          <Route path="/supplier-report" element={<SupplierReport />} />
        </Route>

        <Route element={<PermissionRoute module="DamageReport" />}>
          <Route path="/damage-report" element={<DamageReport />} />
        </Route>

        <Route path="/damage-return-report" element={<DamageReturnReport />} />

        <Route element={<PermissionRoute module="CreditNoteReport" />}>
          <Route path="/credit-note-report" element={<CreditNoteReport />} />
        </Route>

        <Route path="/debit-note-report" element={<DebitNoteReport />} />

        <Route path="expire-report" element={<ExpireReport />} />

        <Route element={<PermissionRoute module="CustomerOverdueReport" />}>
          <Route path="/customer-overdue-report" element={<CustomerOverdueReport />} />
        </Route>

        <Route path="supplier-overdue-report" element={<SupplierOverdueReport />} />

        <Route path="expenses-report" element={<ExpensesReport />} />

        <Route element={<PermissionRoute module="Expense" />}>
          <Route path="/expense" element={<Expense />} />
        </Route>


        {/* Settings */}
        <Route element={<PermissionRoute module="Settings" />}>
          <Route path="/settings" element={<SettingsLayouts />}>
            <Route path="user-profile-settings" element={<UserProfile />} />
            <Route element={<PermissionRoute module="CompanySettings" />}>
              <Route
                path="company-settings"
                element={<SettingsCompanyDetails />}
              />
            </Route>
            <Route element={<PermissionRoute module="BankDetails" />}>
              <Route path="company-bank" element={<SettingCompanyBank />} />
            </Route>
            <Route path="barcode-print" element={<BarCodePrint />} />
            <Route path="normal-print" element={<NormalPrint />} />
            <Route
              path="normalprint-invoice"
              element={<NormalPrintInvoice />}
            />
            <Route
              path="thermalprint-invoice"
              element={<ThermalPrintInvoice />}
            />
            <Route path="thermal-print" element={<ThermalPrint />} />
            <Route
              path="notes-term-condition"
              element={<NotesTermCondition />}
            />
            <Route path="taxes-gst" element={<Taxes_GST />} />
            <Route path="system-setting" element={<System_Setting />} />
            <Route path="pricing-plans" element={<PricingPlans />} />
            <Route path="supports" element={<Supports />} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/pos"
        element={
          <>
            <PosHeader />
            <Pos />
          </>
        }
      />

      {/* ---------- Catch-all route ---------- */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
