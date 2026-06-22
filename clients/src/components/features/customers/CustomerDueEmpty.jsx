import React, {useState} from 'react'
import CustomerDue from "../../../assets/images/CustomerDue.png";
import { useNavigate } from 'react-router-dom';

const CustomerDueEmpty = () => {
    const [openAddModal, setOpenAddModal] = useState(false);
    const navigate = useNavigate();
    return (
     
        <div className='' style={{ maxHeight: "80vh", display: "flex", justifyContent: "center", }}>
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
                    Customer Dues and Advance
                </p>
                <p style={{ width: "450px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "16px", color: "#727681" }}>At this moment, there are no outstanding dues owed by the customer, nor any advance payments received from them.</span>
                </p>
                <img src={CustomerDue} alt="supplier" style={{ width: "240px", marginBottom: "20px" }} />
            </div>
        </div>
       
    )
}

export default CustomerDueEmpty;
