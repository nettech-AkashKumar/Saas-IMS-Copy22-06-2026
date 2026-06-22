import React from 'react'
import whatsapp_interface from "../../../assets/images/whatsapp-interface.png";
import whatsapp_scanner from "../../../assets/images/whatsapp-scanner.png"

const WhatsappScanner = () => {
  return (

      <div className="px-4 py-4 overflow-auto" style={{height:"calc(100vh - 84px)"}}>
         <div className='d-flex justify-content-center flex-wrap overflow-y-auto' style={{gap:"120px"}}>
          {/* WhatsApp Interface  Image */}
               <div className="d-flex flex-column justify-content-center align-items-center">
                 <div className="text-center">
                   <h1
                     style={{ fontFamily: "Inter", fontSize: "32px", fontWeight: "400" }}
                   >
                     Connect WhatsApp
                   </h1>
                   <p
                     style={{
                       fontFamily: "Inter",
                       fontSize: "16px",
                       fontWeight: "400",
                       color: "#727681",
                     }}
                   >
                     Connect Your WhatsApp for Instant Invoice Sharing & <br /> Seamless
                     Communication
                   </p>
                 </div>
                 <img src={whatsapp_interface} alt="whatsapp_interface" />
               </div>
                <div style={{backgroundColor:"white",  width:"659px", height:"100vh", maxHeight:"592px", padding:"30px 20px", borderRadius:"16px", display:"flex", flexDirection:"column", justifyContent:"space-between"}}>
                     <div style={{display:"flex", flexDirection:"column", alignItems:"center"}}>
                        <img src={whatsapp_scanner} alt="whatsapp_scanner" />
                         <h6 style={{fontFamily:"Inter", fontSize:"20px",fontWeight:"500",color:"#0E101A"}}>Scan This QR</h6>
                     </div>
                       <div>
                        <h6 style={{fontFamily:"Inter", fontSize:"20px",fontWeight:"400",color:"#0E101A"}}>Steps to Link WhatsApp</h6>
                        <p style={{fontFamily:"Inter", fontSize:"16px",color:"#727681"}}><b style={{color:"black"}}>Step 1:</b> Open WhatsApp on your phone.</p>
                        <p style={{fontFamily:"Inter", fontSize:"16px",color:"#727681"}}><b style={{color:"black"}}>Step 2:</b> Go to Linked Devices → tap “Link a Device.”.</p>
                        <p style={{fontFamily:"Inter", fontSize:"16px",color:"#727681"}}><b style={{color:"black"}}>Step 3:</b> Scan the QR code shown on your IMS screen.</p>
                        <p style={{fontFamily:"Inter", fontSize:"16px",color:"#727681"}}><b style={{color:"black"}}>Step 4:</b> Once scanned, your WhatsApp will be successfully linked to the IMS.</p>
                       </div>
                </div>
    </div>
      </div>
     )
}

export default WhatsappScanner