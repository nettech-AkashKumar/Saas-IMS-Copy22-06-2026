import React from "react";
import { RxCross2 } from "react-icons/rx";

const ConfirmDeleteModal = ({ isOpen, onCancel, onConfirm, itemName = "this item" }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.27)",
        backdropFilter: "blur(1px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999999,
      }}
      onClick={onCancel} // click outside → close
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
        }}
        onClick={(e) => e.stopPropagation()} // prevent close when clicking inside
      >
        {/* Header */}
        <div
          style={{
            // padding: "20px 24px 16px",
            // borderBottom: "1px solid #F1F1F1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
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
            Confirm Delete
          </span>

          <button
            onClick={onCancel}
            style={{
              background: "none",
              fontSize: "30px",
              cursor: "pointer",
              color: "#676869ff",
              width: "26px",
              height: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #9CA3AF",
              borderRadius: "50%",
            }}
          >
            <RxCross2 />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "0px 0px 10px 0px", textAlign: "left", borderBottom: "1px solid #F1F1F1", }}>
          <p
            style={{
              margin: "0 0 0px 0",
              fontSize: "18px",
              color: "#9c9da0ff",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Are you sure want to delete ?
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
            onClick={onCancel}
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
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#F3F4F6")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#6b728038")}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
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
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#F3F4F6")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#ef44443f")}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;