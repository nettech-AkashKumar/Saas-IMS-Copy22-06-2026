import React from 'react'
import { MdOutlinePhone } from "react-icons/md";
import { MdOutlineMail } from "react-icons/md";

const Supports = () => {
  return (
    <div>
          <div
                className="setting-user-profile-container"
                style={{
                  fontFamily: "Inter, sans-serif",
                  backgroundColor: "#fff",
                  // overflow: "auto",
                  // height: "100vh"
                }}
              >
                <div
                  style={{
                    marginBottom: "32px",
                    fontSize: "16px",
                    fontWeight: "500",
                    color: "#0E101A",
                  }}
                >
                Supports
                </div>

                 <div style={{fontFamily:"Inter" , display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", textAlign:"center", gap:"15px"}}>
                   <span style={{color:"#0E101A", fontWeight:"500", fontSize:"16px"}}>Contact Us</span>
                   <span style={{color:"#727681", fontWeight:"400", fontSize:"14px"}}>Connect with our team for product inquiries, partnerships, or technical support. <br /> We are committed to providing timely and reliable assistance.</span>
                   <div className='d-flex gap-4'>
                     <div style={{border:'1px solid #EAEAEA', width:"275px", height:"84px", borderRadius:"8px", padding:"16px", display:"flex",flexDirection:"column", justifyContent:"center", gap:"10px"}}>
                       <span style={{color:"#0E101A", fontSize:"14px", fontWeight:"500"}}><MdOutlinePhone /> Phone No.</span>
                       <span style={{color:"#0E101A", fontSize:"14px", fontWeight:"500"}}>+91 80064 48800</span>
                     </div>
                      <div style={{border:'1px solid #EAEAEA', width:"275px", height:"84px", borderRadius:"8px", padding:"16px", display:"flex",flexDirection:"column", justifyContent:"center", gap:"10px"}}>
                       <span style={{color:"#0E101A", fontSize:"14px", fontWeight:"500"}}><MdOutlineMail/> Email</span>
                       <span style={{color:"#0E101A", fontSize:"14px", fontWeight:"500"}}>support@imsmymunc.com</span>
                     </div>
                   </div>
                 </div>
        
                   
              </div>
    </div>
  )
}

export default Supports