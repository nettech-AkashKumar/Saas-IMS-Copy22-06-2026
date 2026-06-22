import React from 'react';
import Debitt from "../../../../assets/images/debitnote.png"
import { Link } from 'react-router-dom';
import { MdOutlineAddShoppingCart } from 'react-icons/md';
import { hasPermission } from '../../../../utils/permission/hasPermission';
import { useAuth } from "../../../auth/AuthContext";

const EmptyDebitNote = () => {
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
                    Debit Note
                </p>
                <p style={{ width: "400px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "16px", color: "#727681" }}>👋 You don’t have any debit notes at the moment. Please create one to continue.</span>
                </p>
                <img src={Debitt} alt="debit" style={{ width: "240px", marginBottom: "20px" }} />
                {hasPermission(user, "DebitNote", "create") && (
                <Link to='/m/create-debitnote' style={{ textDecoration: "none" }}><button style={{ background: "#1F7FFF", border: "1px solid #1F7FFF", borderRadius: "8px", padding: "8px 16px", color: "#FFFFFF", fontWeight: 400, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}><MdOutlineAddShoppingCart />Create Debit Note</button></Link>)}
            </div>
        </div>
    )
}

export default EmptyDebitNote;
