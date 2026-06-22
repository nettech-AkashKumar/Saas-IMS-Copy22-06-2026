import React, { useState, useEffect } from "react";
import EmailMessages from "../EmailMessages/EmailMessages";
import axios from "axios";
import BASE_URL from "../../../../pages/config/config";
import api from "../../../../pages/config/axiosInstance"
import ProductDefaultImage from '../../../../assets/images/product-default.png';

const Sent = ({ onToggleStar }) => {
  const [emails, setEmails] = useState([]);

const fetchSentEmails = async () => {
    try {
      // const token = localStorage.getItem("token");
      const res = await api.get("/api/email/mail/getsentemail");

      const formatted = res.data.data.map((email) => {
        const senderName =
          // email.from?.firstName
          // ? `${email.from.firstName} ${email.from.lastName || ""}`.trim()
          //   : "Unknown";
        email.from?.name || "Unknown";

        const initials = senderName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return {
          ...email,
          sender: {
            name: senderName,
            profileImage: email.from?.profileImage?.url || email.from?.profileImage || ProductDefaultImage || null,
            initials,
            backgroundColor: "#5e35b1",
          },
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
          tags: { starred: email.starred || false },
          folders: { galleryCount: email.attachments?.length || 0 },
        };
      });

      setEmails(formatted);
    } catch (err) {
      console.error("Failed to fetch sent emails", err);
      toast.error(err?.response?.data?.message || "Failed to fetch sent emails");
    }
  };

  useEffect(() => {
    fetchSentEmails();
    const interval = setInterval(fetchSentEmails, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, []);



  const handleToggleStar = async (id, currentStarred) => {
    try {
      // const token = localStorage.getItem("token");
      await api.put(`/api/email/mail/star/${id}`, 
        { starred: !currentStarred },
      );

      setEmails((prevEmails) =>
        prevEmails.map((email) =>
          email._id === id
            ? { ...email, tags: { ...email.tags, starred: !currentStarred } }
            : email
        )
      );
    } catch (error) {
      console.error("Failed to update starred status", error);
      toast.error(error?.response?.data?.message || "Failed to update starred status");
    }
  };

  return (
    <EmailMessages
      filteredEmails={emails}
      handleToggleStar={handleToggleStar}
    />
  );
};

export default Sent;
