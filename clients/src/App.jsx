// import React, { useEffect, useState, createContext } from "react";
// import { BrowserRouter } from "react-router-dom";
// import AppRoutes from "./router/AppRoutes";
// import LanguageSwitcher from "./utils/LanguageSwitch/LanguageSwitcher";
// import "./i18n"; // Import i18n config
// import { InboxProvider } from "./components/features/Mail/SideBar/InboxContext";
// import { ToastContainer } from "react-toastify";
// import api from "./pages/config/axiosInstance";

// export const AppRefreshContext = createContext();
// const App = () => {
//   const [refreshKey, setRefreshKey] = useState(0);

//   const refreshApp = () => {
//     setRefreshKey((prev) => prev + 1);
//   };
//   const [favicon, setFavicon] = useState(null);
//   useEffect(() => {
//     const fetchCompany = async () => {
//       try {
//         const res = await api.get("/api/companyprofile/get", {
//           withCredentials: true,
//         });

//         if (res.data?.data?.companyFavicon) {
//           setFavicon(res.data.data.companyFavicon);
//         }
//       } catch (err) {
//         console.error("Failed to load favicon");
//       }
//     };

//     fetchCompany();
//   }, []);

//   // 🔥 GLOBAL FAVICON EFFECT
//   useEffect(() => {
//     let link = document.querySelector("link[rel='icon']");

//     if (!link) {
//       link = document.createElement("link");
//       link.rel = "icon";
//       document.head.appendChild(link);
//     }

//     if (favicon) {
//       link.href = favicon + "?v=" + Date.now(); // cache bust
//     } else {
//       link.remove(); // 🔥 favicon remove if null
//     }

//     // Cleanup when App unmounts
//     return () => {
//       link?.remove();
//     };
//   }, [favicon]);

//   useEffect(() => {
//     const title = localStorage.getItem("companyTitle") || "IMS";
//     document.title = title;
//   }, []);
//   return (
//     <AppRefreshContext.Provider value={{ refreshKey, refreshApp }}>
//       <BrowserRouter>
//         {/* <LanguageSwitcher /> */}
//         <InboxProvider>
//           <ToastContainer />
//           <AppRoutes key={refreshKey} />
//         </InboxProvider>
//       </BrowserRouter>
//     </AppRefreshContext.Provider>
//   );
// };

// export default App;

// semi working
import React, { useEffect, useState, createContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import api from "./pages/config/axiosInstance";
import { RegisterProvider } from "./SaaS/context/RegisterContext";
import Home from "./SaaS/component/website/page/Home";
import TenantApp from "./SaaS/apps/TenantApp";
import { InboxProvider } from "./components/features/Mail/SideBar/InboxContext";
import { ToastContainer } from "react-toastify";
import AppRoutes from "./router/AppRoutes";
// Public //--------------------------------------------------------------------------------------
import RegisterLoginDetailsAdmin from "./SaaS/pages/public/RegisterLoginDetailsAdmin";
import RegisterSelectPlan from "./SaaS/pages/public/RegisterSelectPlan";
import SuccessMessage from "./SaaS/pages/public/SuccessMessage";
import AdminDashboard from "./SaaS/pages/public/AdminDashboard";
export const AppRefreshContext = createContext();
// Super Admin //--------------------------------------------------------------------------------------
import SuperAdminLayout from "./SaaS/pages/superadmin/AdminLayout/SuperAdminLayout";
import SuperAdminDashboard from "./SaaS/pages/superadmin/Dashboard/SuperAdminDashboard";
import AdminCompanyTable from "./SaaS/pages/superadmin/companyDetails/AdminCompanyTable";
import CompanyDetails from "./SaaS/pages/superadmin/companyDetails/CompanyDetails";
import ReminderPage from "./SaaS/pages/superadmin/reminder/ReminderPage";
import CreateReminder from "./SaaS/pages/superadmin/reminder/CreateReminder";
import ReminderTemplates from "./SaaS/pages/superadmin/reminder/ReminderTemplates";
import GrowthPage from "./SaaS/pages/superadmin/GrowthPage";
import Hero from "./SaaS/pages/superadmin/WebsiteSettings/Hero/Hero";
import Pricing from "./SaaS/pages/superadmin/WebsiteSettings/Pricing/Pricing";
import Faqs from "./SaaS/pages/superadmin/WebsiteSettings/Faqs/Faqs";
import ContactMessages from "./SaaS/pages/superadmin/WebsiteSettings/ContactMessages/ContactMessages";
import SettingsPage from "./SaaS/pages/superadmin/SettingsPage";
import SecurityPage from "./SaaS/pages/superadmin/SecurityPage";

// route//------------------------------
import PrivateRoute from "./SaaS/apps/PrivateRoute";
import AllLogin from "./SaaS/component/LoginPage/AllLogin";

function App() {
  const host = window.location.hostname;
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshApp = () => {
    setRefreshKey((prev) => prev + 1);
  };
  const [favicon, setFavicon] = useState(null);
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await api.get("/api/companyprofile/get", {
          withCredentials: true,
        });

        if (res.data?.data?.companyFavicon) {
          setFavicon(res.data.data.companyFavicon);
        }
      } catch (err) {
        console.error("Failed to load favicon");
      }
    };

    fetchCompany();
  }, []);

  // 🔥 GLOBAL FAVICON EFFECT
  useEffect(() => {
    let link = document.querySelector("link[rel='icon']");

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    if (favicon) {
      link.href = favicon + "?v=" + Date.now(); // cache bust
    } else {
      link.remove(); // 🔥 favicon remove if null
    }

    // Cleanup when App unmounts
    return () => {
      link?.remove();
    };
  }, [favicon]);

  useEffect(() => {
    const title = localStorage.getItem("companyTitle") || "IMS";
    document.title = title;
  }, []);

  // Public website (company registration, landing page)
  if (host === "localhost" || host === "imsmymunc.com") {
    return (
      <RegisterProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/register-login-details"
              element={<RegisterLoginDetailsAdmin />}
            />
            <Route
              path="/register/:step"
              element={<RegisterLoginDetailsAdmin />}
            />
            <Route path="/all-login" element={<AllLogin />} />
            <Route path="/login" element={<AllLogin />} />
            <Route path="/admin/login" element={<AllLogin />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
          </Routes>
          {/* <Home /> */}
        </BrowserRouter>
      </RegisterProvider>
    );
  }

  // Super Admin
  if (host.startsWith("admin.")) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/all-login" element={<AllLogin />} />
          <Route path="/admin/login" element={<AllLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <SuperAdminLayout />
              </PrivateRoute>
            }
          >
            {/* Dashboard Home */}
            <Route index element={<SuperAdminDashboard />} />

            {/* Company list */}
            <Route path="companies" element={<AdminCompanyTable />} />

            {/* Company Details */}
            <Route path="companies/:id" element={<CompanyDetails />} />

            {/* Reminder */}
            <Route path="reminder" element={<ReminderPage />} />

            {/* Templates */}
            <Route path="templates" element={<ReminderTemplates />} />

            {/* Create Reminder */}
            <Route path="create-reminder" element={<CreateReminder />} />
            <Route
              path="create-reminder/:templateId"
              element={<CreateReminder />}
            />

            {/* Website */}
            <Route path="hero" element={<Hero />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="faqs" element={<Faqs />} />
            <Route path="contact-messages" element={<ContactMessages />} />

            {/* Growth */}
            <Route path="growth" element={<GrowthPage />} />

            {/* Super Admin settings */}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="security" element={<SecurityPage />} />

            {/* Fallback for nested admin routes */}
            <Route
              path="*"
              element={<Navigate to="/admin/dashboard" replace />}
            />
          </Route>
          <Route path="*" element={<Navigate to="/all-login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Tenant subdomains → amar.localhost / abc.imsmymunc.com
  return (
    <BrowserRouter>
      <InboxProvider>
        <AppRoutes key={refreshKey} />
      </InboxProvider>
    </BrowserRouter>
  );
}

export default App;
