import React, { useState, useEffect } from "react";
import { getPublicFAQs, updatePublicFAQs } from "../../../../services/adminApi";
import { useSocket } from "../../../../../Context/SocketContext";
import "./faq-design.css";
import { LuPlus, LuSave, LuX } from "react-icons/lu";
// import { LuPlus, LuTrash2, LuEdit2, LuSave, LuX } from "react-icons/lu";
import { TiEdit, TiTrash } from "react-icons/ti";

export default function FaqEditor() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({ question: "", answer: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const socketContext = useSocket();
  const { connectSocket, broadcastCMSUpdate } = socketContext || {};

  useEffect(() => {
    // Try to connect socket, but don't block FAQ loading if it fails
    if (connectSocket) {
      try {
        connectSocket(import.meta.env.VITE_API_URL);
      } catch (err) {
        console.warn("⚠️ Socket connection warning (non-blocking):", err);
      }
    }
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      console.log("📝 SuperAdmin FAQ: Loading FAQs...");
      const data = await getPublicFAQs();
      console.log("✅ SuperAdmin FAQ: FAQs loaded:", data);
      setFaqs(data || []);
    } catch (error) {
      console.error("❌ SuperAdmin FAQ: Failed to load FAQs:", error);
      alert("Failed to load FAQs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFAQ = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setFormData({ question: "", answer: "" });
  };

  const handleEditFAQ = (index) => {
    setEditingIndex(index);
    setIsAdding(false);
    setFormData({ ...faqs[index] });
  };

  const handleDeleteFAQ = async (index) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        setIsSaving(true);
        const updatedFAQs = faqs.filter((_, i) => i !== index);
        console.log("🗑️ SuperAdmin FAQ: Deleting FAQ at index:", index);
        await updatePublicFAQs(updatedFAQs);
        setFaqs(updatedFAQs);

        // Broadcast update via Socket if available
        if (broadcastCMSUpdate && typeof broadcastCMSUpdate === "function") {
          try {
            broadcastCMSUpdate({ section: "faqs", action: "delete", index });
          } catch (socketErr) {
            console.warn(
              "⚠️ Socket broadcast failed (non-blocking):",
              socketErr,
            );
          }
        }

        console.log("✅ SuperAdmin FAQ: FAQ deleted successfully");
        alert("FAQ deleted successfully!");
      } catch (error) {
        console.error("❌ SuperAdmin FAQ: Failed to delete FAQ:", error);
        alert("Failed to delete FAQ: " + error.message);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSave = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert("Please fill in both question and answer");
      return;
    }

    try {
      setIsSaving(true);
      let updatedFAQs;

      if (editingIndex !== null) {
        console.log("✏️ SuperAdmin FAQ: Updating FAQ at index:", editingIndex);
        updatedFAQs = faqs.map((faq, index) =>
          index === editingIndex ? formData : faq,
        );
      } else {
        console.log("➕ SuperAdmin FAQ: Adding new FAQ");
        updatedFAQs = [...faqs, formData];
      }

      await updatePublicFAQs(updatedFAQs);
      setFaqs(updatedFAQs);

      // Broadcast update via Socket if available
      if (broadcastCMSUpdate && typeof broadcastCMSUpdate === "function") {
        try {
          broadcastCMSUpdate({
            section: "faqs",
            action: editingIndex !== null ? "update" : "create",
            data: updatedFAQs,
          });
        } catch (socketErr) {
          console.warn("⚠️ Socket broadcast failed (non-blocking):", socketErr);
        }
      }

      setFormData({ question: "", answer: "" });
      setEditingIndex(null);
      setIsAdding(false);

      console.log("✅ SuperAdmin FAQ: FAQ saved successfully");
      alert(
        editingIndex !== null
          ? "FAQ updated successfully!"
          : "FAQ added successfully!",
      );
    } catch (error) {
      console.error("❌ SuperAdmin FAQ: Failed to save FAQ:", error);
      alert("Failed to save FAQ: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ question: "", answer: "" });
    setEditingIndex(null);
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="faq-editor-container">
        <div className="loading-spinner">
          <p>Loading FAQs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="faq-editor-container">
      <div className="faq-editor-header">
        <div className="header-content">
          <h1>FAQ Management</h1>
          <p className="header-subtitle">
            Manage frequently asked questions for your website
          </p>
        </div>
        <button
          className="add-faq-btn"
          onClick={handleAddFAQ}
          disabled={isSaving}
        >
          <LuPlus size={18} /> Add New FAQ
        </button>
      </div>

      {(isAdding || editingIndex !== null) && (
        <div className="faq-form-section">
          <div className="form-header">
            <h2>{editingIndex !== null ? "Edit FAQ" : "Add New FAQ"}</h2>
            <button
              className="close-form-btn"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <LuX size={20} />
            </button>
          </div>

          <div className="form-content">
            <div className="form-group">
              <label htmlFor="question">Question *</label>
              <input
                id="question"
                type="text"
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="e.g., What is an Inventory Management System?"
                className="form-input"
                disabled={isSaving}
              />
              <span className="char-count">{formData.question.length}/200</span>
            </div>

            <div className="form-group">
              <label htmlFor="answer">Answer *</label>
              <textarea
                id="answer"
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                placeholder="Enter detailed answer here..."
                className="form-textarea"
                rows="6"
                disabled={isSaving}
              />
              <span className="char-count">{formData.answer.length}/1000</span>
            </div>

            <div className="form-actions">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                <LuSave size={18} />
                {isSaving ? "Saving..." : "Save FAQ"}
              </button>
              <button
                className="cancel-btn"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="faq-list-section">
        <div className="list-header">
          <h2>Current FAQs</h2>
          <span className="faq-count">{faqs.length} FAQs</span>
        </div>

        {faqs.length > 0 ? (
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className="faq-list-item">
                <div className="faq-item-number">{index + 1}</div>
                <div className="faq-item-content">
                  <h3 className="faq-item-question">{faq.question}</h3>
                  <p className="faq-item-answer">{faq.answer}</p>
                </div>
                <div className="faq-item-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEditFAQ(index)}
                    title="Edit this FAQ"
                    disabled={isSaving}
                  >
                    <TiEdit size={18} />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteFAQ(index)}
                    title="Delete this FAQ"
                    disabled={isSaving}
                  >
                    <TiTrash size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">❓</div>
            <p className="empty-title">No FAQs yet</p>
            <p className="empty-description">
              Add your first FAQ to get started
            </p>
            <button className="add-first-btn" onClick={handleAddFAQ}>
              <LuPlus size={16} /> Add First FAQ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
