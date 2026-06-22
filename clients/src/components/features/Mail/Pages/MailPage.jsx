import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from "../SideBar/EmailSidebar"


const MailPage = () => {
  return (
  
   
      <div className="py-4 px-4"
        style={{
          display: "flex",
          width: "100%",
          gap: "15px",
          flexDirection: "row",
          flexWrap: "nowrap",
          transition: "all 0.3s ease",
          height: "calc(100vh - 70px)"
          
        }}
      >
        <Sidebar />
        <Outlet />
      </div>
   
  
  )
}

export default MailPage;
