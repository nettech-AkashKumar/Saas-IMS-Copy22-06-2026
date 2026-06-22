import React, { useState, useEffect } from "react";
import axios from "axios";
import EmailMessages from "../EmailMessages/EmailMessages";
import BASE_URL from "../../../../pages/config/config";
import { useInbox } from "../../../../components/features/Mail/SideBar/InboxContext";
import api from "../../../../pages/config/axiosInstance"
import { useAuth } from "../../../auth/AuthContext"
import ProductDefaultImage from '../../../../assets/images/product-default.png';

const Inbox = () => {
  const { user } = useAuth();
  const [emails, setEmails] = useState([]);
  const { setEmails: updateEmailList, fetchInboxCount, setInboxCount } = useInbox();

  const fetchInboxEmails = async () => {
    try {
      // const token = localStorage.getItem("token");
      const res = await api.get("/api/email/mail/receive");

      const formatted = res.data.data.map((email) => {
        const senderName =
          // email.from?.firstName
          // ? `${email.from.firstName} ${email.from.lastName || ''}`.trim()
          // : "Unknown";
          email.from?.name || "Unknown";
        const senderEmail = email.from?.email || "No email";
        const profileImage = email.from?.profileImage?.url || email.from?.profileImage || ProductDefaultImage || null;
        const initials = senderName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

        return {
          ...email,
          sender: {
            name: senderName,
            email: senderEmail,
            profileImage,
            initials,
            backgroundColor: "#5e35b1",
          },
          subject: email.subject,
          messagePreview: (email.body || "").slice(0, 50) + "...",
          time:
            email.createdAt && !isNaN(new Date(email.createdAt))
              ? new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              }).format(new Date(email.createdAt))
              : "Invalid Date",
          status: { dotColor: "red" },
          folders: {
            galleryCount: email.attachments?.length || 0,
          },
          tags: {
            starred: email.starred,
            extraLabelCount: 0,
          },
        };
      });

      const inboxOnly = formatted.filter((email) => email.type === "inbox");
      setEmails(inboxOnly);
      const unreadCount = inboxOnly.filter((e) => !e.isRead).length;
      setInboxCount(unreadCount);
    } catch (error) {
      console.error("Failed to fetch inbox emails", error);
    }
  };

  useEffect(() => {
    fetchInboxEmails();
  }, []);


  const handleToggleStar = async (id, currentStarred) => {
    // 1️⃣ Optimistic update
    setEmails((prevEmails) =>
      prevEmails.map((email) =>
        email._id === id
          ? { ...email, tags: { ...email.tags, starred: !currentStarred } }
          : email
      )
    );

    try {
      // const token = localStorage.getItem("token");
      await api.put(`/api/email/mail/star/${id}`,
        { starred: !currentStarred },
      );
      // ✅ Success: do nothing else, state already updated
    } catch (error) {
      console.error("Failed to update starred status", error);
      // Optional: revert if API fails
      setEmails((prevEmails) =>
        prevEmails.map((email) =>
          email._id === id
            ? { ...email, tags: { ...email.tags, starred: currentStarred } }
            : email
        )
      );
    }
  };


  const markAsRead = async (emailId) => {
    try {
      // const token = localStorage.getItem("token");
      // const userEmail = JSON.parse(localStorage.getItem("user"))?.email?.toLowerCase();  // Get userEmail locally if needed for logs
      const userEmail = user?.email?.toLowerCase();
      // console.log("🔹 readInboxEmails called for emailId:", emailId, "by user:", userEmail);
      // console.log("Token present:", !!token);

      // 1. Optimistic UI update (local only, for instant feel)
      setEmails((prevEmails) =>
        prevEmails.map((email) =>
          email._id === emailId
            ? { ...email, isRead: true, status: { ...email.status, dotColor: "transparent" } }
            : email
        )
      );
      setInboxCount((prev) => Math.max(prev - 1, 0));  // Optimistic count decrement


      const res = await api.put(
        `/api/email/mail/read/${emailId}`,
        {},
        // { headers: { Authorization: `Bearer ${token}` } }
      );

      // console.log("Response from backend:", res.data);

      if (res.data.success) {
        // console.log("Backend confirmed email marked as read");
        // update local state
        // setEmails((prevEmails) => prevEmails.map((email) => email._id === emailId ? {...email, isRead:true, status:{...email.status, dotColor:'transparent'}} : email));

        // fetchInboxCount();
        // update local state
        updateEmailList((prevEmails) =>
          prevEmails.map((email) =>
            email._id === emailId && !email.isRead
              ? { ...email, status: { ...email.status, dotColor: "transparent" }, isRead: true }
              : email
          )
        );
      }
      else {
        throw new Error(res.data.message || "Failed to mark as read");
      }

      await fetchInboxCount();  //single call, awaited for sync
      // console.log("📄 Updated local email list");

      // setInboxCount((prev) => Math.max(prev - 1, 0));
      // setTimeout(fetchInboxCount, 500);

      // 3️⃣ Optional: fetch fresh count from backend to be sure
      // fetchInboxCount();
    } catch (error) {
      console.error("Failed to mark email as read", error);
      setEmails((prevEmails) =>
        prevEmails.map((email) =>
          email._id === emailId
            ? { ...email, isRead: false, status: { ...email.status, dotColor: "red" } }  // Assuming red for unread
            : email
        )
      );
      setInboxCount((prev) => Math.max(prev + 1, 0));  // Revert count
    }
  };


  return (
    <EmailMessages
      filteredEmails={emails}
      handleToggleStar={handleToggleStar}
      handleEmailClick={markAsRead}
    />
  );
};

export default Inbox;
