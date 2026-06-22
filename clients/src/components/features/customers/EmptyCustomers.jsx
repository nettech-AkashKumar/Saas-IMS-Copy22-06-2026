import React, { useState } from "react";
import Customerr from "../../../assets/images/Customers.png";
import Customerrvector from "../../../assets/images/CustomerVector.png";
import { LuUserPlus } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import AddCustomers from "../../../pages/Modal/customerModals/AddCustomerModal";
import { hasPermission } from "../../../utils/permission/hasPermission";
import { useAuth } from "../../auth/AuthContext";

const EmptyCustomers = () => {
  const { user } = useAuth();
  const [openAddModal, setOpenAddModal] = useState(false);
  const navigate = useNavigate();
  return (

        <div
          className="px-4 py-4"
          style={{
            maxHeight: "80vh",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "500px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              marginTop: "10vh",
              textAlign: "center",
              fontWeight: 400,
              lineHeight: "120%",
            }}
          >
            <p
              style={{
                fontSize: "32px",
                color: "#000000",
                marginBottom: "20px",
              }}
            >
              Customer Details
            </p>
            <p style={{ width: "380px", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", color: "#727681" }}>
                👋 Looks like your Customer list is empty.
                <br />
                Add your first Customer to create invoices and sales.
              </span>
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={Customerrvector}
                alt="supplier"
                style={{
                  backgroundColor: "#E7EDF3",
                  width: "100px",
                  margin: "60px 0px",
                }}
              />
              <img
                src={Customerr}
                alt="supplier"
                style={{
                  position: "absolute",
                  width: "240px",
                  marginBottom: "20px",
                }}
              />
            </div>
            {hasPermission(user, "Customer", "Create") && (
            <button
              onClick={() => setOpenAddModal(true)}
              style={{
                background: "#1F7FFF",
                border: "1px solid #1F7FFF",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#FFFFFF",
                fontWeight: 400,
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <LuUserPlus />
              Add Customer
            </button>
            )}
          </div>
          {/* Add Customer Modal */}
          {openAddModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
              }}
              onClick={() => setOpenAddModal(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <AddCustomers
                  onClose={() => {
                    setOpenAddModal(false);
                    navigate("/customers");
                  }}
                />
              </div>
            </div>
          )}
        </div>
   
  );
};

export default EmptyCustomers;
