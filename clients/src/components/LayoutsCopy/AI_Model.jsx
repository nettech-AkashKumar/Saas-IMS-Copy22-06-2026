import React, { useState } from 'react'
import ai from '../../assets/images/AI.png'
import { PiUploadSimpleLight } from "react-icons/pi";
import { IoIosArrowRoundUp } from "react-icons/io";
import { IoClose } from "react-icons/io5";    // <-- Close Icon

const AI_Model = ({ onClose }) => {     // <-- NEW PROP
  const [message, setMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setUploadedFile(file);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "0",
        left: "0",
        bottom: "0",
        zIndex: "9999",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.27)",
        backdropFilter: "blur(0.1px)",
        width: "100%",
      }}
    >
      {/* Outer Box */}
      <div
        style={{
          width: "810px",
          height: "620px",
          backgroundColor: "white",
          borderRadius: 20,
          boxShadow: "0px 0px 25px 4px rgba(0, 123, 255, 0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ❌ CLOSE BUTTON */}
        {/* <div
          onClick={onClose}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            cursor: "pointer",
            zIndex: 1000,
            background: "#fff",
            padding: "4px",
            borderRadius: "50%",
            boxShadow: "0px 2px 6px rgba(0,0,0,0.2)",
          }}
        >
          <IoClose size={22} color="#000" />
        </div> */}
        
        {/* Header */}
        <div className='d-flex align-items-center justify-content-between px-3 py-2'>
          
           <div className='d-flex align-items-center gap-1'>
             <img width={25} src={ai} alt="ai" />
            <span
              style={{
                fontSize: 15,
                fontFamily: "Inter",
                fontWeight: 500,
                color: "#000",
              }}
            >
              Munshi ji
            </span>
           </div>
            
          <div style={{ display: "flex", justifyContent: "end" }}>
          <button
            onClick={onClose}
            style={{
              border: "2px solid #727681",
              borderRadius: "50px",
              width: "25px",
              height: "25px",
              backgroundColor: "white",
              color: "#727681",
              fontWeight: "600",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "15px",
            }}
          >
            x
          </button>
          </div>
          
        </div>

        {/* CHAT AREA */}
        <div style={{
          padding:'5px',
        }}>
          <div style={{
            height: '460px',
            border:'1px solid #EAEAEA',
            padding:'5px 10px',
            borderRadius:'6px',
          }}>
            <span>Thinking...</span>
          </div>
        <input 
          type='search'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type something here to search..."
          style={{
            // flex: 1,
            // height: 100,
            width:'100%',
            border: "none",
            outline: "none",
            resize: "none",
            padding: "14px",
            fontFamily: "Inter",
            fontSize: 14,
            color: "#000",
          }}
        />
        </div>

        {/* BOTTOM BAR */}
        <div
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "white"
          }}
        >
          <input
            type="file"
            id="fileUpload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          <div
            onClick={() => document.getElementById("fileUpload").click()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid #ddd",
              padding: "6px 12px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            <PiUploadSimpleLight size={18} />
            <span
              style={{
                fontSize: 14,
                color: "#4D4D4D",
                fontFamily: "Inter",
              }}
            >
              Upload
            </span>
          </div>

          <div
            style={{
              width: 32,
              height: 32,
              background: "#282828",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            onClick={() => console.log("Message:", message)}
          >
            <IoIosArrowRoundUp size={20} color='white' />
          </div>
        </div>

        {uploadedFile && (
          <div
            style={{
              padding: "0 14px 14px 14px",
              fontSize: 12,
              color: "#444",
              fontFamily: "Inter",
            }}
          >
            Uploaded: {uploadedFile.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default AI_Model;
