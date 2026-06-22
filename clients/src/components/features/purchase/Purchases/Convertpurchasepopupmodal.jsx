import React from "react";
import { IoIosCheckmark } from "react-icons/io";
import { RxCross2 } from "react-icons/rx";

const Convertpurchasepopupmodal = ({
  isOpen,
  onCancel,
  onConfirm,
  currentStatus,
  type = "purchase" // Add this prop: "purchase" or "debit"
}) => {
  if (!isOpen) return null;

  // Determine which statuses are clickable based on type
  const getClickableStatus = () => {
    if (type === "purchase") {
      return ["converted"]; // Purchase orders with "converted" status are clickable
    } else if (type === "debit") {
      return ["issued"]; // Debit notes with "issued" status are clickable
    }
    else if (type === "credit") {
      return ["pending"]; // Credit notes with "converted" status are clickable
    }
    return ["converted"]; // Default
  };

  // Determine what status to send on approve/reject
  const getStatusMapping = () => {
    if (type === "purchase") {
      return {
        approve: "received",
        reject: "cancelled"
      };
    } else if (type === "debit") {
      return {
        approve: "settled",
        reject: "cancelled"
      }
    }
    else if (type === "credit") {
      return {
        approve: "approved",
        reject: "rejected"
      }
    }
    return {
      approve: "received",
      reject: "cancelled"
    }
  }

  const clickableStatuses = getClickableStatus();
  const isClickable = clickableStatuses.includes(currentStatus);
  const statusMapping = getStatusMapping();

  // Determine modal content
  const getModalContent = () => {
    if (isClickable) {
      let title, message;

      if (type === "purchase") {
        title = "Update Purchase Order Status";
        message = (
          <>
          Are you sure you want to update this
          <br/>
          purchase order?
          </>
        );
      } else if (type === "debit") {
        title = "Update Debit Note Status";
        message = (
          <>
          Are you sure you want to update this
          <br/>
           debit note?
          </>
        );
      } else if (type === "credit") { // Add this
        title = "Update Credit Note Status";
        message = (
          <>
          Are you sure you want to update this
          <br/>
          credit note?
          </>
        );
      }

      return {
        title,
        message,
        showButtons: true
      };
    }

    return {
      title: "Cannot Change Status",
      message: "This status has already been finalized and cannot be changed.",
      showButtons: false
    };
  };

  const content = getModalContent();

  return (
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
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: "#FFFFFF",
          width: "350px",
          maxWidth: "92vw",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)",
          overflow: "hidden",
          position:"relative"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#f0f0f0";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <RxCross2 size={20} color="#727681" />
        </button>
        {/* Header */}
        {/* <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: "#1F2937",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {content.title}
          </h3>
        </div> */}

        {/* Body */}
        <div style={{ padding: "24px", textAlign: "left" }}>
          <p
            style={{
              margin: "0 0 8px 0",
              fontSize: "15px",
              color: "#4B5563",
              lineHeight: "1.5",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {content.message}
          </p>
        </div>

        {/* Footer Buttons */}
        {content.showButtons && (
          <div
            style={{
              padding: "0 15px 15px",
              display: "flex",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <button
              onClick={() => onConfirm(statusMapping.reject)}
              style={{
                padding: "5px 15px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#DC2626",
                backgroundColor: "#fee2e2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                cursor: "pointer",
                minWidth: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#FECACA")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#FEE2E2")}
            >
              <RxCross2 style={{ fontWeight: 500 }} /> Reject
            </button>
            <button
              onClick={() => onConfirm(statusMapping.approve)}
              style={{
                padding: "5px 15px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#059669",
                backgroundColor: "#d1fae5",
                border: "1px solid #34D399",
                borderRadius: "8px",
                cursor: "pointer",
                minWidth: "120px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#A7F3D0")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#D1FAE5")}
            >
              <IoIosCheckmark style={{ fontWeight: 500 }} /> Approve
            </button>
          </div>
        )}

        {/* If buttons are not shown */}
        {!content.showButtons && (
          <div
            style={{
              padding: "0 24px 24px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <button
              onClick={onCancel}
              style={{
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                backgroundColor: "#F3F4F6",
                border: "1px solid #D1D5DB",
                borderRadius: "8px",
                cursor: "pointer",
                minWidth: "120px",
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div >
  );
};

export default Convertpurchasepopupmodal;
