import React, { useState } from "react";
import login_background from "../../assets/Image/debitnote.png";
import munc_logo from "../../assets/Image/munc-logo.png";
import { Link } from "react-router-dom";
import "../../assets/css/Responsive.css";
import PopUpIndustryChoose from "./PopUpIndustryChoose";
import { useRegister } from "../../context/RegisterContext";
import { useNavigate } from "react-router-dom";

const RegisterCompanyDetails = () => {
  const [showSelectIndustry, setshowSelectIndustry] = useState(false);

  // All fields controlled
  const [form, setForm] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    employeeSize: "",
    industry: "",
    gst: "",
    subdomain: "",
    website: "",
  });

  const { registerData, setRegisterData } = useRegister();
  const navigate = useNavigate();

  // Validate all required fields
  const handleNext = () => {
    if (
      !form.companyName ||
      !form.companyEmail ||
      !form.companyPhone ||
      !form.employeeSize ||
      !form.industry ||
      !form.subdomain
    ) {
      return alert("All fields except GST/Website are required");
    }
    setRegisterData({
      ...registerData,
      ...form,
    });
    navigate("/register-select-plan");
  };

  // Industry selection callback
  const handleIndustrySelect = (industry) => {
    setForm({ ...form, industry });
    setshowSelectIndustry(false);
  };

  return (
    <div>
      <div className="d-flex" style={{ height: "100vh" }}>
        {/* login-container */}
        <div
          className="login-container"
          style={{
            backgroundColor: "white",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Inter",
          }}
        >
          <div
            className="register-account-container"
            style={{
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* munc logo */}
            <img
              src={munc_logo}
              alt="munc_logo"
              style={{
                maxWidth: "214px",
                width: "100%",
                paddingBottom: "15px",
              }}
            />

            {/* register account head title */}
            <div className="register-account-head-title text-center">
              <h3
                style={{
                  fontSize: "clamp(14px,2vw,20px)",
                  fontWeight: "600",
                  color: "#000000",
                }}
              >
                Register your Account
              </h3>
              <p
                style={{
                  fontSize: "clamp(14px,2vw,14px)",
                  color: "#1E1E1E",
                  fontWeight: "400",
                }}
              >
                Enter Company Details
              </p>
            </div>

            {/* register company details form */}
            <form action="" style={{ display: "flex", gap: "16px", flexDirection: "column" }} onSubmit={e => e.preventDefault()}>
              {/* Company Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontWeight: "400", fontSize: "clamp(12px,2vw,14px)", color: "#000000" }}>
                  Company Name
                </label>
                <input
                  value={form.companyName}
                  onChange={e => setForm({ ...form, companyName: e.target.value })}
                  className="input-placeholder input-outline input-all-box"
                  type="text"
                  placeholder="Enter Name"
                  style={{
                    width: "400px",
                    border: "1px solid #DEDEDE",
                    backgroundColor: "#FBFBFB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    outline: "none",
                  }}
                />
              </div>

              {/* Company Phone Number */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontWeight: "400", fontSize: "clamp(12px,2vw,14px)", color: "#000000" }}>
                  Company Phone Number
                </label>
                <input
                  value={form.companyPhone}
                  onChange={e => setForm({ ...form, companyPhone: e.target.value })}
                  className="input-placeholder input-outline input-all-box"
                  type="tel"
                  placeholder="Enter Phone Number"
                  style={{
                    width: "400px",
                    border: "1px solid #DEDEDE",
                    backgroundColor: "#FBFBFB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    outline: "none",
                  }}
                  maxLength={15}
                />
              </div>

              {/* Company Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontWeight: "400", fontSize: "clamp(12px,2vw,14px)", color: "#000000" }}>
                  Company Email
                </label>
                <input
                  value={form.companyEmail}
                  onChange={e => setForm({ ...form, companyEmail: e.target.value })}
                  className="input-placeholder input-outline input-all-box"
                  type="email"
                  placeholder="Enter Company Email"
                  style={{
                    width: "400px",
                    border: "1px solid #DEDEDE",
                    backgroundColor: "#FBFBFB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    outline: "none",
                  }}
                />
              </div>

              <div className="subdomain-compnay-inp" style={{ display: "flex", gap: "16px" }}>
                {/* employee size */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontWeight: "400", fontSize: "clamp(12px,2vw,14px)", color: "#000000" }}>
                    Employee Size
                  </label>
                  <select
                    value={form.employeeSize}
                    onChange={e => setForm({ ...form, employeeSize: e.target.value })}
                    className="input-outline input-all-box"
                    style={{
                      backgroundColor: "#FBFBFB",
                      width: "192px",
                      border: "1px solid #DEDEDE",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      outline: "none",
                      fontFamily: "Inter",
                      fontSize: "clamp(12px,2vw,14px)",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">Select</option>
                    <option value="0-10">0 - 10 Employees</option>
                    <option value="10-25">10 - 25 Employees</option>
                    <option value="25-50">25 - 50 Employees</option>
                    <option value="50-100">50 - 100 Employees</option>
                    <option value="100+">100+ Employees</option>
                  </select>
                </div>

                {/* Business Type */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontWeight: "400", fontSize: "clamp(12px,2vw,14px)", color: "#000000" }}>
                    Business Type
                  </label>
                  <div
                    onClick={() => setshowSelectIndustry(true)}
                    className="input-outline input-all-box"
                    style={{
                      backgroundColor: "#FBFBFB",
                      width: "192px",
                      border: "1px solid #DEDEDE",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      outline: "none",
                      fontFamily: "Inter",
                      fontSize: "clamp(12px,2vw,14px)",
                      cursor: "pointer"
                    }}
                  >
                    {form.industry ? form.industry : "Tap and Choose 👈"}
                  </div>
                </div>
              </div>

              {/* GST NUMBER */}
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <label style={{ fontWeight: "400", fontSize: "clamp(12px,2vw,14px)", color: "#000000" }}>
                  GST Number (Optional)
                </label>
                <input
                  value={form.gst}
                  onChange={e => setForm({ ...form, gst: e.target.value })}
                  className="input-placeholder input-outline input-all-box"
                  type="text"
                  placeholder="Enter GST Number"
                  style={{
                    width: "400px",
                    border: "1px solid #DEDEDE",
                    backgroundColor: "#FBFBFB",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    outline: "none",
                  }}
                />
              </div>

              {/* SUBDOMAIN and COMPANY WEBSITE */}
              <div className="subdomain-compnay-inp" style={{ display: "flex", gap: "16px" }}>
                {/* subdomain */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontWeight: "400", fontSize: "clamp(12px,2vw,14px)", color: "#000000" }}>
                    Subdomain
                  </label>
                  <input
                    value={form.subdomain}
                    onChange={e => setForm({ ...form, subdomain: e.target.value })}
                    className="subdomain-inp input-placeholder input-outline input-all-box"
                    type="text"
                    placeholder="Subdomain"
                    style={{
                      width: "192px",
                      border: "1px solid #DEDEDE",
                      backgroundColor: "#FBFBFB",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      outline: "none",
                    }}
                  />
                </div>

                {/* website */}
                <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                  <label style={{ fontWeight: "400", fontSize: "clamp(12px,2vw,14px)", color: "#000000" }}>
                    Company Website (Optional)
                  </label>
                  <input
                    value={form.website}
                    onChange={e => setForm({ ...form, website: e.target.value })}
                    className="company-web-inp input-placeholder input-outline input-all-box"
                    type="text"
                    placeholder="Company Web"
                    style={{
                      width: "192px",
                      border: "1px solid #DEDEDE",
                      backgroundColor: "#FBFBFB",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* available subdomain */}
              {form.subdomain && (
                <label
                  htmlFor=""
                  style={{
                    fontWeight: "400",
                    fontSize: "clamp(12px,2vw,14px)",
                    color: "green",
                    marginTop: "-12px",
                  }}
                >
                  <span style={{ color: "black" }}>Your Subdomain:</span> www.{form.subdomain}.munc.com ✅
                </label>
              )}

              {/* Agree Checkbox */}
              <label
                htmlFor=""
                style={{
                  fontWeight: "400",
                  fontSize: "clamp(12px,2vw,14px)",
                  color: "#000000",
                }}
              >
                <input type="checkbox" /> I Agree to the Terms & Conditions and Privacy Policy.
              </label>

              {/* Next Button */}
              <button
                onClick={handleNext}
                className="input-all-box"
                style={{
                  backgroundColor: "#0084FF",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  width: "400px",
                  border: "none",
                  color: "white",
                  fontSize: "clamp(14px,2vw,16px)",
                  fontWeight: "500",
                }}
              >
                Next
              </button>
            </form>
          </div>
        </div>

        {/* login-background */}
        <div
          className="login-background"
          style={{
            backgroundColor: "#0447AA",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img src={login_background} alt="login_background" style={{ width: "100%", maxWidth: "782px" }} />
        </div>
      </div>

      {showSelectIndustry && (
        <PopUpIndustryChoose
          setshowSelectIndustry={setshowSelectIndustry}
          selectIndustry={handleIndustrySelect}
        />
      )}
    </div>
  );
};

export default RegisterCompanyDetails;

// import React, { useState } from "react";
// import login_background from "../../assets/Image/debitnote.png";
// import munc_logo from "../../assets/Image/munc-logo.png";
// import { Link } from "react-router-dom";
// import "../../assets/css/Responsive.css";
// import PopUpIndustryChoose from "./PopUpIndustryChoose";
//   import { useRegister } from "../../context/RegisterContext";
// import { useNavigate } from "react-router-dom";
// const RegisterCompanyDetails = () => {
//   const [subdomain, setSubdomain] = useState("");
//   const [showSelectIndustry, setshowSelectIndustry]= useState(false)

// const [form, setForm] = useState({
//   companyName: "",
//   companyEmail: "",
//   companyPhone: "",
//   employeeSize: "",
//   gst: "",
//   subdomain: "",
//   website: "",
// });


// const { registerData, setRegisterData } = useRegister();
// const navigate = useNavigate();

// const handleNext = () => {
//   if (!form.companyName || !form.subdomain) {
//     return alert("Company Name and Subdomain required");
//   }

//   setRegisterData({
//     ...registerData,
//     ...form,
//   });

//   navigate("/register-select-plan");
// };

//   const handleSubdomain = (e) => {
//     setSubdomain(e.target.value);
//   };

  

//   return (
//     <div>
//       <div className="d-flex" style={{ height: "100vh" }}>

//         {/* login-container */}
//         <div
//           className="login-container"
//           style={{
//             backgroundColor: "white",
//             width: "100%",
//             // height: "100vh",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             fontFamily: "Inter",

//           }}
//         >
//           <div
//             className="register-account-container"
//             style={{
//               padding: "40px",
//               display: "flex",
//               flexDirection: "column",
//               justifyContent: "center",
//               alignItems: "center",
//             }}
//           >
//             {/* munc logo */}
//             <img
//               src={munc_logo}
//               alt="munc_logo"
//               style={{
//                 maxWidth: "214px",
//                 width: "100%",
//                 paddingBottom: "15px",
//               }}
//             />

//             {/* register account head title */}
//             <div className="register-account-head-title text-center">
//               <h3
//                 style={{
//                   fontSize: "clamp(14px,2vw,20px)",
//                   fontWeight: "600",
//                   color: "#000000",
//                 }}
//               >
//                 Register your Account
//               </h3>
//               <p
//                 style={{
//                   fontSize: "clamp(14px,2vw,14px)",
//                   color: "#1E1E1E",
//                   fontWeight: "400",
//                 }}
//               >
//                 Enter Company Details
//               </p>
//             </div>

//             {/* register company details form */}
//             <form action="" style={{ display: "flex", gap: "16px", flexDirection: "column" }}>

//               {/* Company Name */}
//               <div
//                 style={{ display: "flex", flexDirection: "column", gap: "5px" }}
//               >
//                 <label
//                   htmlFor=""
//                   style={{
//                     fontWeight: "400",
//                     fontSize: "clamp(12px,2vw,14px)",
//                     color: "#000000",
//                   }}
//                 >
//                   Company Name
//                 </label>
//                 <input
//                   className="input-placeholder input-outline input-all-box"
//                   type="text"
//                   placeholder="Enter Name"
//                   style={{
//                     width: "400px",
//                     border: "1px solid #DEDEDE",
//                     backgroundColor: "#FBFBFB",
//                     borderRadius: "8px",
//                     padding: "12px 16px",
//                     outline: "none",
//                   }}
//                 />
//               </div>

//               {/* Company Phone Number */}
//               <div
//                 style={{ display: "flex", flexDirection: "column", gap: "5px" }}
//               >
//                 <label
//                   htmlFor=""
//                   style={{
//                     fontWeight: "400",
//                     fontSize: "clamp(12px,2vw,14px)",
//                     color: "#000000",
//                   }}
//                 >
//                   Company Phone Number
//                 </label>
//                 <input
//                   className="input-placeholder input-outline input-all-box"
//                   type="number"
//                   placeholder="Enter Phone Number"
//                   style={{
//                     width: "400px",
//                     border: "1px solid #DEDEDE",
//                     backgroundColor: "#FBFBFB",
//                     borderRadius: "8px",
//                     padding: "12px 16px",
//                     outline: "none",
//                   }}
//                 />
//               </div>

//               {/* Company Email */}
//               <div
//                 style={{ display: "flex", flexDirection: "column", gap: "5px" }}
//               >
//                 <label
//                   htmlFor=""
//                   style={{
//                     fontWeight: "400",
//                     fontSize: "clamp(12px,2vw,14px)",
//                     color: "#000000",
//                   }}
//                 >
//                   Company Email
//                 </label>
//                 <input
//                   className="input-placeholder input-outline input-all-box"
//                   type="email"
//                   placeholder="Enter Company Email"
//                   style={{
//                     width: "400px",
//                     border: "1px solid #DEDEDE",
//                     backgroundColor: "#FBFBFB",
//                     borderRadius: "8px",
//                     padding: "12px 16px",
//                     outline: "none",
//                   }}
//                 />
//               </div>

//               <div className="subdomain-compnay-inp" style={{ display: "flex", gap: "16px", }}>
//                 {/* employee size */}
//                 <div
//                   style={{ display: "flex", flexDirection: "column", gap: "5px" }}
//                 >
//                   <label
//                     htmlFor=""
//                     style={{
//                       fontWeight: "400",
//                       fontSize: "clamp(12px,2vw,14px)",
//                       color: "#000000",
//                     }}
//                   >
//                     Employee Size
//                   </label>

//                   <select
//                     className="input-outline input-all-box"
//                     name=""
//                     id=""
//                     style={{
//                       // width: "100%",
//                       backgroundColor: "#FBFBFB",
//                       width: "192px",
//                       border: "1px solid #DEDEDE",
//                       borderRadius: "8px",
//                       padding: "12px 16px",
//                       outline: "none",
//                       // color: "#BABABA",
//                       fontFamily: "Inter",
//                       fontSize: "clamp(12px,2vw,14px)",
//                       cursor:"pointer"
//                     }}
//                   >
//                     <option value="">Select</option>
//                     <option value="">0 - 10 Employees</option>
//                     <option value="">10 - 25 Employees</option>
//                     <option value="">25 - 50 Employees</option>
//                     <option value="">50 - 100 Employees</option>
//                     <option value="">100+ Employees</option>
//                   </select>
//                 </div>

//                 {/* Business Type */}
//                 <div
//                   style={{ display: "flex", flexDirection: "column", gap: "5px" }}
//                 >
//                   <label
//                     htmlFor=""
//                     style={{
//                       fontWeight: "400",
//                       fontSize: "clamp(12px,2vw,14px)",
//                       color: "#000000",
//                     }}
//                   >
//                     Business Type
//                   </label>

//                   <div
//                     onClick={setshowSelectIndustry}
//                     className="input-outline input-all-box"
//                     name=""
//                     id=""
//                     style={{
//                       // width: "100%",
//                       backgroundColor: "#FBFBFB",
//                       width: "192px",
//                       border: "1px solid #DEDEDE",
//                       borderRadius: "8px",
//                       padding: "12px 16px",
//                       outline: "none",
//                       // color: "#BABABA",
//                       fontFamily: "Inter",
//                       fontSize: "clamp(12px,2vw,14px)",
//                       cursor:"pointer"
//                     }}
//                   >
//                     Tap and Choose 👈
//                   </div>
//                 </div>
//               </div>

//               {/* GST NUMBER */}
//               <div
//                 style={{ display: "flex", flexDirection: "column", gap: "5px" }}
//               >
//                 <label
//                   htmlFor=""
//                   style={{
//                     fontWeight: "400",
//                     fontSize: "clamp(12px,2vw,14px)",
//                     color: "#000000",
//                   }}
//                 >
//                   GST Number (Optional)
//                 </label>
//                 <input
//                   className="input-placeholder input-outline input-all-box"
//                   type="text"
//                   placeholder="Enter GST Number"
//                   style={{
//                     width: "400px",
//                     border: "1px solid #DEDEDE",
//                     backgroundColor: "#FBFBFB",
//                     borderRadius: "8px",
//                     padding: "12px 16px",
//                     outline: "none",
//                   }}
//                 />
//               </div>

//               {/* SUBDOMAIN and COMPANY WEBSITE */}
//               <div className="subdomain-compnay-inp" style={{ display: "flex", gap: "16px", }}>
//                 {/* subdomain */}
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "5px",

//                   }}
//                 >
//                   <label
//                     htmlFor=""
//                     style={{
//                       fontWeight: "400",
//                       fontSize: "clamp(12px,2vw,14px)",
//                       color: "#000000",
//                     }}
//                   >
//                     Subdomain
//                   </label>
//                   <input
//                     className="subdomain-inp input-placeholder input-outline input-all-box"
//                     type="text"
//                     placeholder="Subdomain"
//                     value={subdomain}
//                     onChange={(e) => setSubdomain(e.target.value)}
//                     style={{
//                       width: "192px",
//                       border: "1px solid #DEDEDE",
//                       backgroundColor: "#FBFBFB",
//                       borderRadius: "8px",
//                       padding: "12px 16px",
//                       outline: "none",
//                     }}
//                   />
//                 </div>

//                 {/* website */}
//                 <div
//                   style={{
//                     display: "flex",
//                     flexDirection: "column",
//                     gap: "5px",

//                   }}
//                 >
//                   <label
//                     htmlFor=""
//                     style={{
//                       fontWeight: "400",
//                       fontSize: "clamp(12px,2vw,14px)",
//                       color: "#000000",
//                     }}
//                   >
//                     Company Website (Optional)
//                   </label>
//                   <input
//                     className="company-web-inp input-placeholder input-outline input-all-box"
//                     type="text"
//                     placeholder="Company Web"
//                     style={{

//                       width: "192px",
//                       border: "1px solid #DEDEDE",
//                       backgroundColor: "#FBFBFB",
//                       borderRadius: "8px",
//                       padding: "12px 16px",
//                       outline: "none",
//                     }}
//                   />
//                 </div>
//               </div>

//               {/* available subdomain */}
//               {subdomain && (
//                 <label
//                   htmlFor=""
//                   style={{
//                     fontWeight: "400",
//                     fontSize: "clamp(12px,2vw,14px)",
//                     color: "green",
//                     marginTop: "-12px",
//                   }}
//                 >
//                   <span style={{ color: "black" }}>Your Subdomain:</span> www.{subdomain}.munc.com ✅
//                 </label>
//               )}

//               {/* Agree Checkbox */}
//               <label
//                 htmlFor=""
//                 style={{
//                   fontWeight: "400",
//                   fontSize: "clamp(12px,2vw,14px)",
//                   color: "#000000",
//                 }}
//               >
//                 <input type="checkbox" /> I Agree to the Terms & Conditions and
//                 Privacy Policy.
//               </label>

//               {/* Next Button */}
             
//                 <button
//                 onClick={handleNext}
//                   className="input-all-box"
//                   style={{
//                     backgroundColor: "#0084FF",
//                     padding: "12px 16px",
//                     borderRadius: "8px",
//                     width: "400px",
//                     border: "none",
//                     color: "white",
//                     fontSize: "clamp(14px,2vw,16px)",
//                     fontWeight: "500",
//                   }}
//                 >
//                   Next
//                 </button>
              
//               {/* <Link to="/register-select-plan">
//                 <button
//                   className="input-all-box"
//                   style={{
//                     backgroundColor: "#0084FF",
//                     padding: "12px 16px",
//                     borderRadius: "8px",
//                     width: "400px",
//                     border: "none",
//                     color: "white",
//                     fontSize: "clamp(14px,2vw,16px)",
//                     fontWeight: "500",
//                   }}
//                 >
//                   Next
//                 </button>
//               </Link> */}

//             </form>
//           </div>
//         </div>

//         {/* login-background */}
//         <div
//           className="login-background"
//           style={{
//             backgroundColor: "#0447AA",
//             width: "100%",
            
//             // height: "100vh",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//           }}
//         >
//           <img src={login_background} alt="login_background" style={{ width: "100%", maxWidth: "782px" }} />
//         </div>
//       </div>
       
//       {showSelectIndustry && 
          
//         <PopUpIndustryChoose setshowSelectIndustry={setshowSelectIndustry}/>
//       }
     
//     </div>
//   );
// };

// export default RegisterCompanyDetails;
