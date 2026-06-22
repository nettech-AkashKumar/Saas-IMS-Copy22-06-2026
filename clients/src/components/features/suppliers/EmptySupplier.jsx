import React, { useState } from 'react';
import Supplierr from "../../../assets/images/supplier.png"
import { LuUserPlus } from "react-icons/lu";
import { Link, useNavigate } from 'react-router-dom';
import AddSupplier from '../../../pages/Modal/suppliers/AddSupplierModals';
import { hasPermission } from '../../../utils/permission/hasPermission';

import { useAuth } from "../../auth/AuthContext";

const EmptySupplier = () => {
  const { user } = useAuth();
  const [openAddModal, setOpenAddModal] = useState(false);
  const navigate = useNavigate();
  return (
   
      <div className="p-4">
        <div style={{ maxHeight: "80vh", display: "flex", justifyContent: "center", }}>
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
            <p style={{ fontSize: '32px', color: "#000000", marginBottom: "20px" }}>
              Supplier Details
            </p>
            <p style={{ width: "300px", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", color: "#727681" }}>👋 Looks like your Supplier list is empty.
                Add your first Supplier to create purchase order.</span>
            </p>
            <img src={Supplierr} alt="supplier" style={{ width: "240px", marginBottom: "20px" }} />
            {hasPermission(user, "Supplier", "create") && (
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
              Add Supplier
            </button>
            )}
          </div>
          {/* Add Customer Modal */}
          {openAddModal && (
            <div
              // style={{
              //   position: "fixed",
              //   inset: 0,
              //   background: "rgba(0,0,0,0.5)",
              //   display: "flex",
              //   alignItems: "center",
              //   justifyContent: "center",
              //   zIndex: 9999,
              // }}
              //  style={{ backgroundColor: rgba(0, 0, 0, 0.27)}}
              onClick={() => setOpenAddModal(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <AddSupplier
                  onClose={() => {
                    setOpenAddModal(false);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    
  )
}

export default EmptySupplier;