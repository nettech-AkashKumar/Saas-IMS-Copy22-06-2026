// import { createContext, useContext, useState } from "react";

// const InboxContext = createContext();

// export const InboxProvider = ({ children }) => {
//   const [inboxCount, setInboxCount] = useState(0);

//     // Optional: you can store the full emails list here if needed
//   const [emails, setEmails] = useState([]);

//   return (
//     <InboxContext.Provider value={{ inboxCount, setInboxCount,  emails, setEmails }}>
//       {children}
//     </InboxContext.Provider>
//   );
// };

// export const useInbox = () => useContext(InboxContext);

import { createContext, useContext, useState, useEffect } from "react";
import api from "../../../../pages/config/axiosInstance";
import { useAuth } from "../../../auth/AuthContext";

const InboxContext = createContext();

export const InboxProvider = ({ children }) => {
  const [inboxCount, setInboxCount] = useState(0);
  const [emails, setEmails] = useState([]);
  const { user, authReady } = useAuth();

  const fetchInboxCount = async () => {
    try {
      // const token = localStorage.getItem("token");
      // const token = Cookies.get("token")
      const res = await api.get("/api/email/mail/inbox-count", {
        skipAuthInterceptor: true,
      });
      // if (res.data?.count !== undefined) {
      // console.log("📊 Fetched inboxCount from backend:", res.data.count);
      if (res.data?.success && res.data?.count !== undefined) {
        // console.log("📊 Server count updated:", res.data.count);
        setInboxCount(res.data.count);
      }
    } catch (e) {
      // console.log("Error fetching inbox count:", error);
      // console.error("❌ fetchInboxCount error:", error.response?.status || error.message);
      void e;
    }
  };
  useEffect(() => {
    if (!authReady || !user) return;
    let interval;
    fetchInboxCount();
    interval = setInterval(fetchInboxCount, 10000); // 10s to reduce load
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authReady, user]);

  return (
    <InboxContext.Provider
      value={{ inboxCount, setInboxCount, emails, setEmails, fetchInboxCount }}
    >
      {children}
    </InboxContext.Provider>
  );
};

export const useInbox = () => {
  const context = useContext(InboxContext);
  if (!context) {
    throw new Error("useInbox must be used within an InboxProvider");
  }
  return context;
};
