import React from 'react';
import PurchaseImg from "../../../../assets/images/purchase.png"
import { LuUserPlus } from "react-icons/lu";
import { Link } from 'react-router-dom';
import { MdOutlineAddShoppingCart } from 'react-icons/md';
import { hasPermission } from '../../../../utils/permission/hasPermission';

import { useAuth } from "../../../auth/AuthContext";

const EmptyGRN = () => {
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
         GRN Verification
        </p>
        <p style={{ width: "350px", marginBottom: "16px" }}>
          <span style={{ fontSize: "16px", color: "#727681" }}>👋 No GRN records available.<br/>
           Create a GRN against a Purchase Order to verify received goods and update inventory.</span>
        </p>
        <img src={PurchaseImg} alt="supplier" style={{ width: "240px", marginBottom: "20px" }} />
      </div>
    </div>
  )
}

export default EmptyGRN;