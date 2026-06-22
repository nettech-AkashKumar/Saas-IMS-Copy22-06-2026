import React, { useEffect, useState } from "react";
import { getContactMessages } from "../../../../services/adminApi";
import "../../SuperAdminDashboard.css";

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getContactMessages();
      setMessages(res.data || []);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="sa-main">
      <header className="sa-topbar">
        <div className="sa-topbar__left">
          <div>
            <p className="sa-eyebrow">Super Admin</p>
            <h1>Contact Messages</h1>
          </div>
        </div>
      </header>

      <section className="sa-panel">
        {loading ? (
          <p>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p>No contact messages found.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="thead-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Product</th>
                  <th>Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m._id}>
                    <td>{m.name || "-"}</td>
                    <td>{m.email || "-"}</td>
                    <td>{m.phone || "-"}</td>
                    <td>{m.product || "-"}</td>
                    <td style={{ whiteSpace: "pre-wrap", maxWidth: 360 }}>
                      {m.message || "-"}
                    </td>
                    <td>{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
