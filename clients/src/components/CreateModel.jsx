import React from "react";
import { Link } from "react-router-dom";
import createinvoice from "../assets/images/create-icon1.png"
import createsale from "../assets/images/create-sale.png"
import createpurchase from "../assets/images/create-purchase.png"
import generateqto from "../assets/images/generate-qto.png"
import createdebitnote from "../assets/images/create-debitnote.png"
import createcreditnote from "../assets/images/create-creditnote.png"
import { hasPermission } from "../utils/permission/hasPermission";
import { useAuth } from "../components/auth/AuthContext";




const CreateModel = ({onClose }) => {
     const { user } = useAuth();
  return (
    <div
      style={{
        position: "absolute",
        top: "60px", // just below the navbar
        right: "12px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        zIndex: 1000,
        padding: "10px 10px",
        // width:"100%",
        // maxWidth: "220px",
        // height:"250px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >

      <ul style={{ listStyle: "none", paddingLeft: "0", marginBottom: "0" }}>
         {hasPermission (user, "Quotation", "create") && (
         <li >
          <Link onClick={onClose}  to="/create-quotition" className='button-action' style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", color: "#0E101A", fontFamily: "Inter", fontSize: "16px" }}>
            <img src={generateqto} alt="" />
            Generate Quotation
          </Link>
        </li>
         )}
          {hasPermission (user, "Proforma", "create") && (
         <li >
          <Link onClick={onClose}  to="/create-proforma" className='button-action' style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", color: "#0E101A", fontFamily: "Inter", fontSize: "16px" }}>
            <img src={generateqto} alt="" />
            Create Proforma
          </Link>
        </li>
          )}
           {hasPermission (user, "Invoices", "create") && (
        <li >
          <Link  onClick={onClose} to="/createinvoice" className='button-action' style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", color: "#0E101A", fontFamily: "Inter", fontSize: "16px" }}>
            <img src={createinvoice} alt="" />
            Create Invoice
          </Link>
        </li>
           )}
        {/* <li >
          <Link className='button-action' style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", color: "#0E101A", fontFamily: "Inter", fontSize: "16px" }}>
            <img src={createsale} alt="" />
            Create Sales
          </Link>
        </li> */}
         {hasPermission (user, "Purchase", "create") && (
        <li >
          <Link onClick={onClose}  to="/create-purchase" className='button-action' style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", color: "#0E101A", fontFamily: "Inter", fontSize: "16px" }}>
            <img src={createpurchase} alt="" />
            Create Purchase
          </Link>
        </li>
         )}
          {hasPermission (user, "DebitNote", "create") && (
        <li >
          <Link onClick={onClose}  to="/create-supplier-debitnote" className='button-action' style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", color: "#0E101A", fontFamily: "Inter", fontSize: "16px" }}>
            <img src={createdebitnote} alt="" />
            Create Debit Note
          </Link>
        </li>
          )}
           {hasPermission (user, "CreditNote", "create") && (
        <li >
          <Link onClick={onClose}  to="/credit-note" className='button-action' style={{ padding: "8px 12px", borderRadius: "8px", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px", color: "#0E101A", fontFamily: "Inter", fontSize: "16px" }}>
            <img src={createcreditnote} alt="" />
            Create Credit Note
          </Link>
        </li>
           )}
      </ul>
    </div>
  );
};

export default CreateModel;
