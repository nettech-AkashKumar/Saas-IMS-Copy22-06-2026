import React from 'react';
import PurchaseImg from "../../../../assets/images/purchase.png"
import { LuUserPlus } from "react-icons/lu";
import { Link } from 'react-router-dom';
import { MdOutlineAddShoppingCart } from 'react-icons/md';
import { hasPermission } from '../../../../utils/permission/hasPermission';

import { useAuth } from "../../../auth/AuthContext";

const CreatePurchase = () => {
  const { user } = useAuth();
  return (
    <div className='px-4 py-2' style={{ maxHeight: "80vh", display: "flex", justifyContent: "center", }}>
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
          Purchase Order
        </p>
        <p style={{ width: "350px", marginBottom: "16px" }}>
          <span style={{ fontSize: "16px", color: "#727681" }}>👋 Looks like your Purchase list is empty.<br/>
            Add your first Purchase to create purchase order.</span>
        </p>
        <img src={PurchaseImg} alt="supplier" style={{ width: "240px", marginBottom: "20px" }} />
        {hasPermission(user, "Purchase", "create") && (
        <Link to='/m/create-purchaseorder' style={{ textDecoration: "none" }}>
        <button style={{ background: "#1F7FFF", border: "1px solid #1F7FFF", borderRadius: "8px", padding: "8px 16px", color: "#FFFFFF", fontWeight: 400, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}><MdOutlineAddShoppingCart />Create Purchase</button></Link>)}
      </div>
    </div>
  )
}

export default CreatePurchase;