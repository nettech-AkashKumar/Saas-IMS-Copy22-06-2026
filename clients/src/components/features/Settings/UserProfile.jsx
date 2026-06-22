import React, { useEffect, useRef, useState } from "react";
import settings_company_logo from "../../../assets/images/Gallery.png";
import "../../../styles/Responsive.css";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import imageCompression from "browser-image-compression";
import { useAuth } from "../../auth/AuthContext";

const UserProfile = () => {
  const { user, setUser } = useAuth();
  const id = user?._id || user?.id;

  const [userData, setUserData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageFiles, setImageFiles] = useState({ profileImage: null });
  const fileInputRef = useRef(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isToggling2FA, setIsToggling2FA] = useState(false);
  // Handle image upload (from old component)
  const handleIconClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size (from old component)
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > 1) {
      toast.error(
        "Upload image size exceeded 1MB. Please upload an image 1MB or less.",
      );
      return;
    }

    //      try {
    //     // Compress image (from old component)
    //     const compressedFile = await imageCompression(file, {
    //       maxSizeMB: 1,
    //       maxWidthOrHeight: 800,
    //       useWebWorker: true,
    //     });

    //     // Show preview (from old component)
    //     const preview = URL.createObjectURL(compressedFile);
    //     setPreviewUrl(preview);
    //     setImageFiles({ profileImage: compressedFile });

    //     // Upload image immediately (like old component does)
    //     await handleImageUpload(compressedFile);
    //   } catch (error) {
    //     toast.error(error?.response?.data?.displayMessage ||
    //       error?.response?.data?.message ||
    //       error?.message ||
    //       "Failed to process image");
    //     console.error("Compression failed:", error);
    //     toast.error("Failed to process image");
    //   }
    // };

    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      // preview only
      const preview = URL.createObjectURL(compressedFile);

      setPreviewUrl(preview);

      // store file temporarily
      setImageFiles({
        profileImage: compressedFile,
      });
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to process image",
      );
    }
  };

  // Handle 2FA Toggle
  const handleToggle2FA = async () => {
    if (!id) return;

    setIsToggling2FA(true);
    try {
      const currentStatus = userData?.twoFactorEnabled || false;
      const newStatus = !currentStatus;

      const response = await api.put(`/api/user/toggle-2fa/${id}`, {
        twoFactorEnabled: newStatus,
      });

      if (response.data.success || response.status === 200) {
        toast.success(
          newStatus
            ? "Two-factor authentication enabled successfully"
            : "Two-factor authentication disabled successfully",
        );

        // Update local user data
        setUserData((prev) => ({
          ...prev,
          twoFactorEnabled: newStatus,
        }));

        // Also update AuthContext if user object exists
        if (setUser && user) {
          setUser({
            ...user,
            twoFactorEnabled: newStatus,
          });
        }
      } else {
        toast.error(response.data.message || "Failed to update 2FA settings");
      }
    } catch (error) {
      console.error("Error toggling 2FA:", error);
      toast.error(
        error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update two-factor authentication settings",
      );
    } finally {
      setIsToggling2FA(false);
    }
  };

  // handlesave
  const handleSaveSettings = async () => {
    if (!imageFiles.profileImage) {
      toast.warning("Please select image");
      return;
    }

    const formData = new FormData();

    formData.append("profileImage", imageFiles.profileImage);

    try {
      setIsUpdating(true);

      const res = await api.put(`/api/user/update/${id}`, formData);

      if (res.data?.profileImage?.url) {
        setPreviewUrl(res.data.profileImage.url);
      }

      toast.success("Profile image updated");

      await fetchUser();
      location.reload();
    } catch (error) {
      console.error(error);

      toast.error(
        error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile image",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Upload image function (from old component)
  const handleImageUpload = async (compressedFile) => {
    if (!compressedFile || !id) {
      toast.warn("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", compressedFile);

    try {
      setIsUpdating(true);
      const res = await api.put(`/api/user/update/${id}`, formData);

      if (res.data?.profileImage?.url) {
        setPreviewUrl(res.data.profileImage.url);
        toast.success("Profile image updated");

        // Refresh user data
        await fetchUser();
      } else {
        await fetchUser();
        toast.success("Profile image updated");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile image",
      );
      console.error("Error uploading image:", error);
      toast.error("Failed to update profile image");
    } finally {
      setIsUpdating(false);
    }
  };

  // Fetch user data (from old component, simplified)
  const fetchUser = async () => {
    if (!id) return;

    try {
      const res = await api.get(`/api/user/${id}`);
      const user = res.data;

      setUserData(user);

      // Set profile image
      if (user.profileImage?.url) {
        setPreviewUrl(user.profileImage.url);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load user profile",
      );
      console.error("Error fetching user", error);
      toast.error("Failed to load user profile");
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

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
          User Profile
        </div>

        <div
          className="setting-user-profile"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Profile Photo - Only editable field */}
          <div
            className="settings-profile-photo"
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <label
              style={{
                width: "180px",
                color: "#3D3D3D",
                fontSize: "14px",
              }}
            >
              Profile Photo :
            </label>

            {isUpdating ? (
              <div
                style={{
                  gridColumn: "2",
                  marginTop: "8px",
                }}
              >
                <p
                  style={{
                    color: "#1F7FFF",
                    fontSize: "12px",
                  }}
                >
                  Uploading image...
                </p>
              </div>
            ) : (
              <>
                <div
                  onClick={handleIconClick}
                  style={{
                    width: "100px",
                    height: "100px",
                    background: "white",
                    border: "2px dashed #7276816b",
                    outlineOffset: "-2px",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                  ) : (
                    <>
                      <img
                        src={settings_company_logo}
                        alt="upload"
                        style={{ width: "24px", height: "24px" }}
                      />
                      <span
                        style={{
                          marginTop: "8px",
                          fontSize: "14px",
                          color: "#0E101A",
                        }}
                      >
                        Upload
                      </span>
                    </>
                  )}
                </div>

                {/* Hidden file input - from old component */}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </>
            )}
          </div>

          {/* Name - Read-only */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}
            >
              Name :
            </label>

            <div style={{ flex: 1, maxWidth: "792px" }}>
              <div
                style={{
                  height: "40px",
                  padding: "8px 12px",
                  background: "#F5F5F5",
                  borderRadius: "8px",
                  border: "1px solid #EAEAEA",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#0E101A",
                  }}
                >
                  {userData?.name || "Loading..."}
                </span>
              </div>
            </div>
          </div>

          {/* Phone - Read-only */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{
                width: "180px",
                color: "#3D3D3D",
                fontSize: "14px",
              }}
            >
              Phone No:
            </label>

            <div style={{ flex: 1, maxWidth: "792px" }}>
              <div
                style={{
                  height: "40px",
                  padding: "8px 12px",
                  background: "#F5F5F5",
                  borderRadius: "8px",
                  border: "1px solid #EAEAEA",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRight: "1px solid #A2A8B8",
                    paddingRight: "8px",
                  }}
                >
                  <img
                    src="https://flagcdn.com/in.svg"
                    alt="IN"
                    style={{
                      width: "27px",
                      height: "17px",
                      borderRadius: "4px",
                    }}
                  />
                  <span style={{ marginLeft: "6px", color: "#0E101A" }}>
                    +91
                  </span>
                </div>

                <span
                  style={{
                    fontSize: "14px",
                    color: "#0E101A",
                  }}
                >
                  {userData?.phone || "Loading..."}
                </span>
              </div>
            </div>
          </div>

          {/* Email - Read-only */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}
            >
              Email :
            </label>

            <div style={{ flex: 1, maxWidth: "792px" }}>
              <div
                style={{
                  height: "40px",
                  padding: "8px 12px",
                  background: "#F5F5F5",
                  borderRadius: "8px",
                  border: "1px solid #EAEAEA",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#0E101A",
                    flex: 1,
                  }}
                >
                  {userData?.email || "Loading..."}
                </span>
                {/* {userData?.twoFactorEnabled !== true ?
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "159px", height: "25px", backgroundColor: "#FFF2D5", borderRadius: "50px", padding: "4px" }}>
                    <span style={{ color: '#CF4F00', fontFamily: "Inter", fontSize: "14px" }}>! Verificaion Pending</span>
                  </div>
                  : null} */}
              </div>
            </div>
          </div>
          {/* Two-Factor Authentication Toggle - Separate Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <label
              style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}
            >
              Two-Factor Auth :
            </label>

            <div style={{ flex: 1, maxWidth: "792px" }}>
              <div
                style={{
                  height: "40px",
                  padding: "8px 12px",
                  background: "#F5F5F5",
                  borderRadius: "8px",
                  border: "1px solid #EAEAEA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "#0E101A",
                  }}
                >
                  {userData?.twoFactorEnabled ? "Enabled" : "Disabled"}
                </span>

                <button
                  onClick={handleToggle2FA}
                  disabled={isToggling2FA}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    width: "44px",
                    height: "24px",
                    backgroundColor: userData?.twoFactorEnabled
                      ? "#1F7FFF"
                      : "#ccc",
                    borderRadius: "12px",
                    border: "none",
                    cursor: isToggling2FA ? "not-allowed" : "pointer",
                    transition: "background-color 0.2s ease",
                    padding: "2px",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: userData?.twoFactorEnabled ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "left 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
              </div>
              {isToggling2FA && (
                <span
                  style={{
                    fontSize: "12px",
                    color: "#1F7FFF",
                    marginTop: "4px",
                    display: "inline-block",
                  }}
                >
                  Updating...
                </span>
              )}
              <p
                style={{
                  fontSize: "11px",
                  color: "#888",
                  marginTop: "4px",
                  marginBottom: "0",
                }}
              >
                {userData?.twoFactorEnabled
                  ? "✓ Two-factor authentication is enabled. You'll receive an OTP on login from new devices."
                  : "Enable two-factor authentication for extra security"}
              </p>
            </div>
          </div>

          {/* Save Settings Button - Now works for all fields */}
          <div className="d-flex justify-content-end">
            <div
              // onClick={() => location.reload()}
              onClick={handleSaveSettings}
              className="button-hover"
              disabled={isUpdating}
              style={{
                width: "101px",
                height: "36px",
                padding: 8,
                background: "var(--Blue-Blue, #1F7FFF)",
                boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                borderRadius: 8,
                outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                outlineOffset: "-1.50px",
                color: "white",
                fontSize: 14,
                fontFamily: "Inter",
                fontWeight: "500",
                lineHeight: 16.8,
                wordWrap: "break-word",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isUpdating ? "not-allowed" : "pointer",
              }}
            >
              {/* Save Setting */}
              {isUpdating ? "Saving..." : "Save Setting"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

// main code without 2fa enable
// import React, { useEffect, useRef, useState } from "react";
// import settings_company_logo from "../../../assets/images/Gallery.png";
// import "../../../styles/Responsive.css";
// import api from "../../../pages/config/axiosInstance";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import imageCompression from "browser-image-compression";
// import { useAuth } from "../../auth/AuthContext";

// const UserProfile = () => {
//   const { user } = useAuth();
//   const id = user?._id || user?.id;

//   const [userData, setUserData] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [imageFiles, setImageFiles] = useState({ profileImage: null });
//   const fileInputRef = useRef(null);
//   const [isUpdating, setIsUpdating] = useState(false);
//   console.log("User ID:", userData); // Debugging log

//   // Handle image upload (from old component)
//   const handleIconClick = () => {
//     fileInputRef.current.click();
//   };

//   const handleFileChange = async (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     // Check file size (from old component)
//     const fileSizeMB = file.size / 1024 / 1024;
//     if (fileSizeMB > 1) {
//       toast.error(
//         "Upload image size exceeded 1MB. Please upload an image 1MB or less.",
//       );
//       return;
//     }

//   //      try {
//   //     // Compress image (from old component)
//   //     const compressedFile = await imageCompression(file, {
//   //       maxSizeMB: 1,
//   //       maxWidthOrHeight: 800,
//   //       useWebWorker: true,
//   //     });

//   //     // Show preview (from old component)
//   //     const preview = URL.createObjectURL(compressedFile);
//   //     setPreviewUrl(preview);
//   //     setImageFiles({ profileImage: compressedFile });

//   //     // Upload image immediately (like old component does)
//   //     await handleImageUpload(compressedFile);
//   //   } catch (error) {
//   //     toast.error(error?.response?.data?.displayMessage ||
//   //       error?.response?.data?.message ||
//   //       error?.message ||
//   //       "Failed to process image");
//   //     console.error("Compression failed:", error);
//   //     toast.error("Failed to process image");
//   //   }
//   // };

//    try {
//     const compressedFile = await imageCompression(file, {
//       maxSizeMB: 1,
//       maxWidthOrHeight: 800,
//       useWebWorker: true,
//     });

//     // preview only
//     const preview = URL.createObjectURL(compressedFile);

//     setPreviewUrl(preview);

//     // store file temporarily
//     setImageFiles({
//       profileImage: compressedFile,
//     });

//   } catch (error) {
//     console.error(error);

//     toast.error(
//       error?.response?.data?.displayMessage ||
//       error?.response?.data?.message ||
//       error?.message ||
//       "Failed to process image"
//     );
//   }
// };

// // handlesave
// const handleSaveSettings = async () => {
//   if (!imageFiles.profileImage) {
//     toast.warning("Please select image");
//     return;
//   }

//   const formData = new FormData();

//   formData.append("profileImage", imageFiles.profileImage);

//   try {
//     setIsUpdating(true);

//     const res = await api.put(
//       `/api/user/update/${id}`,
//       formData
//     );

//     if (res.data?.profileImage?.url) {
//       setPreviewUrl(res.data.profileImage.url);
//     }

//     toast.success("Profile image updated");

//     await fetchUser();
//     location.reload();

//   } catch (error) {
//     console.error(error);

//     toast.error(
//       error?.response?.data?.displayMessage ||
//       error?.response?.data?.message ||
//       error?.message ||
//       "Failed to update profile image"
//     );

//   } finally {
//     setIsUpdating(false);
//   }
// };

//   // Upload image function (from old component)
//   const handleImageUpload = async (compressedFile) => {
//     if (!compressedFile || !id) {
//       toast.warn("Please select an image");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("profileImage", compressedFile);

//     try {
//       setIsUpdating(true);
//       const res = await api.put(`/api/user/update/${id}`, formData);

//       if (res.data?.profileImage?.url) {
//         setPreviewUrl(res.data.profileImage.url);
//         toast.success("Profile image updated");

//         // Refresh user data
//         await fetchUser();
//       } else {
//         await fetchUser();
//         toast.success("Profile image updated");
//       }
//     } catch (error) {
//       toast.error(
//         error?.response?.data?.displayMessage ||
//           error?.response?.data?.message ||
//           error?.message ||
//           "Failed to update profile image",
//       );
//       console.error("Error uploading image:", error);
//       toast.error("Failed to update profile image");
//     } finally {
//       setIsUpdating(false);
//     }
//   };

//   // Fetch user data (from old component, simplified)
//   const fetchUser = async () => {
//     if (!id) return;

//     try {
//       const res = await api.get(`/api/user/${id}`);
//       const user = res.data;

//       setUserData(user);

//       // Set profile image
//       if (user.profileImage?.url) {
//         setPreviewUrl(user.profileImage.url);
//       }
//     } catch (error) {
//       toast.error(
//         error?.response?.data?.displayMessage ||
//           error?.response?.data?.message ||
//           error?.message ||
//           "Failed to load user profile",
//       );
//       console.error("Error fetching user", error);
//       toast.error("Failed to load user profile");
//     }
//   };

//   useEffect(() => {
//     fetchUser();
//   }, [id]);

//   return (
//     <div>
//       <div
//         className="setting-user-profile-container"
//         style={{
//           fontFamily: "Inter, sans-serif",
//           backgroundColor: "#fff",
//           // overflow: "auto",
//           // height: "100vh"
//         }}
//       >
//         <div
//           style={{
//             marginBottom: "32px",
//             fontSize: "16px",
//             fontWeight: "500",
//             color: "#0E101A",
//           }}
//         >
//           User Profile
//         </div>

//         <div
//           className="setting-user-profile"
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             gap: "24px",
//           }}
//         >
//           {/* Profile Photo - Only editable field */}
//           <div
//             className="settings-profile-photo"
//             style={{
//               display: "flex",
//               justifyContent: "space-between",
//               width: "100%",
//             }}
//           >
//             <label
//               style={{
//                 width: "180px",
//                 color: "#3D3D3D",
//                 fontSize: "14px",
//               }}
//             >
//               Profile Photo :
//             </label>

//             {isUpdating ? (
//               <div
//                 style={{
//                   gridColumn: "2",
//                   marginTop: "8px",
//                 }}
//               >
//                 <p
//                   style={{
//                     color: "#1F7FFF",
//                     fontSize: "12px",
//                   }}
//                 >
//                   Uploading image...
//                 </p>
//               </div>
//             ) : (
//               <>
//                 <div
//                   onClick={handleIconClick}
//                   style={{
//                     width: "100px",
//                     height: "100px",
//                     background: "white",
//                     border: "2px dashed #7276816b",
//                     outlineOffset: "-2px",
//                     borderRadius: "8px",
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     cursor: "pointer",
//                   }}
//                 >
//                   {previewUrl ? (
//                     <img
//                       src={previewUrl}
//                       alt="Profile"
//                       style={{
//                         width: "100%",
//                         height: "100%",
//                         objectFit: "cover",
//                         borderRadius: "6px",
//                       }}
//                     />
//                   ) : (
//                     <>
//                       <img
//                         src={settings_company_logo}
//                         alt="upload"
//                         style={{ width: "24px", height: "24px" }}
//                       />
//                       <span
//                         style={{
//                           marginTop: "8px",
//                           fontSize: "14px",
//                           color: "#0E101A",
//                         }}
//                       >
//                         Upload
//                       </span>
//                     </>
//                   )}
//                 </div>

//                 {/* Hidden file input - from old component */}
//                 <input
//                   type="file"
//                   accept="image/*"
//                   style={{ display: "none" }}
//                   ref={fileInputRef}
//                   onChange={handleFileChange}
//                 />
//               </>
//             )}
//           </div>

//           {/* Name - Read-only */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "20px",
//               justifyContent: "space-between",
//               flexWrap: "wrap",
//             }}
//           >
//             <label
//               style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}
//             >
//               Name :
//             </label>

//             <div style={{ flex: 1, maxWidth: "792px" }}>
//               <div
//                 style={{
//                   height: "40px",
//                   padding: "8px 12px",
//                   background: "#F5F5F5",
//                   borderRadius: "8px",
//                   border: "1px solid #EAEAEA",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 <span
//                   style={{
//                     fontSize: "14px",
//                     color: "#0E101A",
//                   }}
//                 >
//                   {userData?.name || "Loading..."}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Phone - Read-only */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "20px",
//               justifyContent: "space-between",
//               flexWrap: "wrap",
//             }}
//           >
//             <label
//               style={{
//                 width: "180px",
//                 color: "#3D3D3D",
//                 fontSize: "14px",
//               }}
//             >
//               Phone No:
//             </label>

//             <div style={{ flex: 1, maxWidth: "792px" }}>
//               <div
//                 style={{
//                   height: "40px",
//                   padding: "8px 12px",
//                   background: "#F5F5F5",
//                   borderRadius: "8px",
//                   border: "1px solid #EAEAEA",
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "8px",
//                 }}
//               >
//                 <div
//                   style={{
//                     display: "flex",
//                     alignItems: "center",
//                     borderRight: "1px solid #A2A8B8",
//                     paddingRight: "8px",
//                   }}
//                 >
//                   <img
//                     src="https://flagcdn.com/in.svg"
//                     alt="IN"
//                     style={{
//                       width: "27px",
//                       height: "17px",
//                       borderRadius: "4px",
//                     }}
//                   />
//                   <span style={{ marginLeft: "6px", color: "#0E101A" }}>
//                     +91
//                   </span>
//                 </div>

//                 <span
//                   style={{
//                     fontSize: "14px",
//                     color: "#0E101A",
//                   }}
//                 >
//                   {userData?.phone || "Loading..."}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Email - Read-only */}
//           <div
//             style={{
//               display: "flex",
//               alignItems: "center",
//               gap: "20px",
//               justifyContent: "space-between",
//               flexWrap: "wrap",
//             }}
//           >
//             <label
//               style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}
//             >
//               Email :
//             </label>

//             <div style={{ flex: 1, maxWidth: "792px" }}>
//               <div
//                 style={{
//                   height: "40px",
//                   padding: "8px 12px",
//                   background: "#F5F5F5",
//                   borderRadius: "8px",
//                   border: "1px solid #EAEAEA",
//                   display: "flex",
//                   alignItems: "center",
//                 }}
//               >
//                 <span
//                   style={{
//                     fontSize: "14px",
//                     color: "#0E101A",
//                     flex: 1,
//                   }}
//                 >
//                   {userData?.email || "Loading..."}
//                 </span>
//                 {/* {userData?.twoFactorEnabled !== true ?
//                   <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "159px", height: "25px", backgroundColor: "#FFF2D5", borderRadius: "50px", padding: "4px" }}>
//                     <span style={{ color: '#CF4F00', fontFamily: "Inter", fontSize: "14px" }}>! Verificaion Pending</span>
//                   </div>
//                   : null} */}

//               </div>
//             </div>
//           </div>

//           {/* Save Settings Button - Now works for all fields */}
//           <div className="d-flex justify-content-end">
//             <div
//               // onClick={() => location.reload()}
//               onClick={handleSaveSettings}
//               className="button-hover"
//               disabled={isUpdating}
//               style={{
//                 width: "101px",
//                 height: "36px",
//                 padding: 8,
//                 background: "var(--Blue-Blue, #1F7FFF)",
//                 boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
//                 borderRadius: 8,
//                 outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
//                 outlineOffset: "-1.50px",
//                 color: "white",
//                 fontSize: 14,
//                 fontFamily: "Inter",
//                 fontWeight: "500",
//                 lineHeight: 16.8,
//                 wordWrap: "break-word",
//                 border: "none",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 cursor: isUpdating ? "not-allowed" : "pointer",
//               }}
//             >
//               {/* Save Setting */}
//               {isUpdating ? "Saving..." : "Save Setting"}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserProfile;
