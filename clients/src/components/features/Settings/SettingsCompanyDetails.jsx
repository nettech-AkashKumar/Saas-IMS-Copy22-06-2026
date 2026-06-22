import React, { useRef, useState, useEffect } from "react";
import settings_company_logo from "../../../assets/images/Gallery.png";
import "../../../styles/Settings.css";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RiVerifiedBadgeLine } from "react-icons/ri";


const SettingsCompanyDetails = () => {

  // GST Verify State
  const [gstError, setGstError] = useState(null);
  const [gstResponse, setGstResponse] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);
  const [gstVerifyButton, setGstVerifyButton] = useState(false);

  // State for form data
  const [formData, setFormData] = useState({
    companyName: "",
    companyTitle: "",
    companyPhone: "",
    companyEmail: "",
    gstin: "",
    businessType: "",
    alternativePhone: "",
    website: "",
    panNo: "",
    country: "",
    state: "",
    district: "",
    pincode: "",
    companyAddress: "",
    billingAddress: "",
    shippingAddress: "",
  });

  // State for branding images
  const [imageFiles, setImageFiles] = useState({
    companyLogo: null,
    companyIcon: null,
    companyFavicon: null,
    companyDarkLogo: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    companyLogo: null,
    companyIcon: null,
    companyFavicon: null,
    companyDarkLogo: null,
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState(null);

  const fileInputRefs = {
    companyLogo: useRef(null),
    companyIcon: useRef(null),
    companyFavicon: useRef(null),
    companyDarkLogo: useRef(null),
  };

  // Validation regex patterns
  const textRegex = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[0-9]{10}$/;
  const urlRegex = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  const [errors, setErrors] = useState({});

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle image upload click
  const handleIconClick = (fieldName) => {
    fileInputRefs[fieldName].current.click();
  };

  // Handle file change - UPDATED to handle image-only uploads
const handleFileChange = async (event, fieldName) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileSizeMB = file.size / 1024 / 1024;
  if (fileSizeMB > 1) {
    toast.error("Upload image size exceeded 1MB. Please upload an image 1MB or less.");
    return;
  }

  if (!file.type.startsWith('image/')) {
    toast.error("Please upload an image file (JPG, PNG)");
    return;
  }

  // Just store preview and file — no upload yet
  const preview = URL.createObjectURL(file);
  setPreviewUrls((prev) => ({ ...prev, [fieldName]: preview }));
  setImageFiles((prev) => ({ ...prev, [fieldName]: file }));
};

  // Upload single image - FIXED: Include all existing form data
  const handleImageUpload = async (file, fieldName) => {
    if (!file) return;

    const formDataToSend = new FormData();

    // Add the image file
    formDataToSend.append(fieldName, file);

    // Add all existing company data to avoid validation errors
    if (existingProfile) {
      // Use existing profile data for required fields
      formDataToSend.append("companyName", existingProfile.companyName || "");
      formDataToSend.append("companyTitle", formData.companyTitle);
      formDataToSend.append("companyemail", existingProfile.companyemail || "");
      formDataToSend.append("companyphone", existingProfile.companyphone || "");
      formDataToSend.append("companyaddress", existingProfile.companyaddress || "");
      formDataToSend.append("companycountry", existingProfile.companycountry || "");
      formDataToSend.append("companywebsite", existingProfile.website || existingProfile.companywebsite || "");
      formDataToSend.append("gstin", existingProfile.gstin || "");
      formDataToSend.append("cin", existingProfile.cin || "");

      // Add other fields if they exist
      if (existingProfile.companyfax) formDataToSend.append("companyfax", existingProfile.companyfax);
      if (existingProfile.companycountry) formDataToSend.append("companycountry", existingProfile.companycountry);
      if (existingProfile.companystate) formDataToSend.append("companystate", existingProfile.companystate);
      if (existingProfile.companycity) formDataToSend.append("companycity", existingProfile.companycity);
      if (existingProfile.companypostalcode) formDataToSend.append("companypostalcode", existingProfile.companypostalcode);
      if (existingProfile.companydescription) formDataToSend.append("companydescription", existingProfile.companydescription);
      if (existingProfile.panNo) formDataToSend.append("panNo", existingProfile.panNo);
      if (existingProfile.country) formDataToSend.append("country", existingProfile.country);
      if (existingProfile.state) formDataToSend.append("state", existingProfile.state);
      if (existingProfile.district) formDataToSend.append("district", existingProfile.district);
      if (existingProfile.pincode) formDataToSend.append("pincode", existingProfile.pincode);
      if (existingProfile.businessType) formDataToSend.append("businessType", existingProfile.businessType);
      if (existingProfile.alternativePhone) formDataToSend.append("alternativePhone", existingProfile.alternativePhone);
      if (existingProfile.billingAddress) formDataToSend.append("billingAddress", existingProfile.billingAddress);
      if (existingProfile.shippingAddress) formDataToSend.append("shippingAddress", existingProfile.shippingAddress);
    }

    try {
      setIsUpdating(true);
      const res = await api.post(`/api/companyprofile/send`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success(`Image updated successfully`);

        fetchCompanyProfile(); // Refresh data
      }
    } catch (error) {
      console.error(`Error uploading ${fieldName}:`, error);
      toast.error(`Failed to update image`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Fetch company profile
  const fetchCompanyProfile = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(`/api/companyprofile/get?t=${Date.now()}`);
      // console.log('rewwq', res.data)

      if (res.data.success && res.data.data) {
        const profile = res.data.data;
        setExistingProfile(profile);

        // Map backend fields to frontend form data
        setFormData({
          companyName: profile.companyName || "",
          companyTitle: profile.companyTitle || "",
          companyPhone: profile.companyphone || "",
          companyEmail: profile.companyemail || "",
          gstin: profile.gstin || "",
          businessType: profile.businessType || profile.companydescription || "",
          alternativePhone: profile.alternativePhone || profile.companyfax || "",
          website: profile.website || profile.companywebsite || "",
          panNo: profile.panNo || "",
          country: profile.country || "",
          state: profile.state || "",
          district: profile.district || "",
          pincode: profile.pincode || "",
          companyAddress: profile.companyaddress || "",
          billingAddress: profile.billingAddress || profile.companyaddress || "",
          shippingAddress: profile.shippingAddress || profile.companyaddress || "",
        });
        if (profile.gstin) {
          setGstVerified(true);
        }

        // Set preview URLs for images
        if (profile.companyLogo) {
          setPreviewUrls(prev => ({ ...prev, companyLogo: profile.companyLogo }));
        }
        if (profile.companyIcon) {
          setPreviewUrls(prev => ({ ...prev, companyIcon: profile.companyIcon }));
        }
        if (profile.companyFavicon) {
          setPreviewUrls(prev => ({ ...prev, companyFavicon: profile.companyFavicon }));
        }
        if (profile.companyDarkLogo) {
          setPreviewUrls(prev => ({ ...prev, companyDarkLogo: profile.companyDarkLogo }));
        }
      }
    } catch (error) {
      console.error("Error fetching company profile:", error);
      // Don't show error if no profile exists yet
      if (error.response?.status !== 404) {
        // toast.error("Failed to load company details");
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load company details");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  // 🔥 COMPANY TITLE → BROWSER TAB (FIXED PLACE)
  useEffect(() => {
    document.title =
      formData.companyTitle?.trim() ||
      formData.companyName?.trim() ||
      "Company Settings";
  }, [formData.companyTitle, formData.companyName]);


  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <span>Loading company details...</span>
      </div>
    );
  }

  const hasSavedGstin = !!(existingProfile && existingProfile.gstin);

  // Handle form submission for all fields
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasSavedGstin && formData.gstin && !gstVerified && gstVerifyButton) {
      toast.error("Please verify GSTIN before saving");
      return;
    }

    try {
      setIsUpdating(true);

      // Prepare data for backend
      const formDataToSend = new FormData();

      // Add all form fields
      formDataToSend.append("companyName", formData.companyName);
      formDataToSend.append("companyTitle", formData.companyTitle);
      formDataToSend.append("companyemail", formData.companyEmail);
      formDataToSend.append("companyphone", formData.companyPhone);
      formDataToSend.append("companywebsite", formData.website);
      formDataToSend.append("gstin", formData.gstin);
      formDataToSend.append("panNo", formData.panNo);
      formDataToSend.append("country", formData.country);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("district", formData.district);
      formDataToSend.append("pincode", formData.pincode);
      formDataToSend.append("businessType", formData.businessType);
      formDataToSend.append("alternativePhone", formData.alternativePhone);
      formDataToSend.append("companyfax", formData.alternativePhone); // Map to companyfax for backward compatibility
      formDataToSend.append("companyaddress", formData.companyAddress);
      formDataToSend.append("billingAddress", formData.billingAddress);
      formDataToSend.append("shippingAddress", formData.shippingAddress);
      formDataToSend.append("companydescription", formData.businessType); // For backward compatibility
      // 🔥 GLOBAL TITLE SAVE
      localStorage.setItem(
        "companyTitle",
        formData.companyTitle || formData.companyName
      );

      document.title =
        formData.companyTitle || formData.companyName || "IMS";

      // Add default values for required fields that might be empty
      formDataToSend.append("companycountry", "India");
      formDataToSend.append("companystate", "");
      formDataToSend.append("companycity", "");
      formDataToSend.append("companypostalcode", "");
      formDataToSend.append("cin", "");

      // Add any pending image files
      Object.entries(imageFiles).forEach(([field, file]) => {
        if (file) {
          formDataToSend.append(field, file);
        }
      });

      const res = await api.post(`/api/companyprofile/send`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success("Company details saved successfully");
        setTimeout(() => {
          window.location.reload();
        }, 300);
        fetchCompanyProfile(); // Refresh data
      }
    } catch (error) {
      console.error("Error saving company details:", error);
      if (error.response?.data?.message) {
        // toast.error(error.response.data.message);
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to save company details");
      } else {
        toast.error("Failed to save company details");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  // Branding images configuration
  const brandingImages = [
    {
      field: "companyLogo",
      label: "Company Logo",
      description: "Main logo displayed on the platform",
    },
    {
      field: "companyIcon",
      label: "Company Icon",
      description: "Small icon for browser tabs and favicon",
    },
    {
      field: "companyFavicon",
      label: "Favicon",
      description: "16x16 icon for browser favorites",
    },
    // {
    //   field: "companyDarkLogo",
    //   label: "Dark Mode Logo",
    //   description: "Logo for dark theme interface",
    // },
  ];

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <span>Loading company details...</span>
      </div>
    );
  }

  // GST Verify Logic
  const handleSearch = async () => {
    const gst = (formData.gstin || "").trim().toUpperCase(); // ✅ fixed

    if (!gst) {
      setGstError("Please enter a GSTIN.");
      setGstVerified(false);
      return;
    }

    // optional: frontend format check before API call
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    if (!gstRegex.test(gst)) {
      toast.error("Invalid GSTIN format.");
      setGstVerified(false);
      return;
    }

    setGstLoading(true);
    setGstError(null);
    setGstVerified(false);
    setGstResponse(null);

    try {
      const res = await api.get(`/api/gst/${encodeURIComponent(gst)}`);
      const data = res.data;
      setGstResponse(data);
      const verified = data && data.error === false;
      if (verified) {
        setGstVerified(true);
        toast.success("GST Verified");
      } else {
        setGstVerified(false);
        toast.error("GST is not verified");
      }
    } catch (err) {
      setGstError(
        err?.response?.data?.message || err?.response?.data || err.message
      );
      setGstVerified(false);
      toast.error("GST verification failed");
    } finally {
      setGstLoading(false);
    }
  };

  return (
    <div className="">
      <div
        className="setting-company-details-container"
        style={{
          fontFamily: "Inter, sans-serif",
          backgroundColor: "#fff",
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
          Company Details
        </div>

        <form onSubmit={handleSubmit}>
          <div className="company-details-container" style={{ display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto", height: "calc(100vh - 250px)" }}>

            {/* Company Logo */}
            <div className="settings-company-logo" style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center"
            }}>
              <label
                style={{
                  width: "180px",
                  color: "#3D3D3D",
                  fontSize: "14px",
                }}
              >
                Company Logo :
              </label>

              <div
                onClick={() => handleIconClick("companyLogo")}
                style={{
                  width: "100px",
                  height: "100px",
                  background: "white",
                  border: previewUrls.companyLogo ? "2px solid #727681" : "2px dashed #7276816b",
                  outlineOffset: "-2px",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {previewUrls.companyLogo ? (
                  <img
                    src={previewUrls.companyLogo}
                    alt="Company Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      borderRadius: "6px"
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

              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRefs.companyLogo}
                onChange={(e) => handleFileChange(e, "companyLogo")}
              />
            </div>

            {/* Company Name */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                Company Name :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #A2A8B8",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* <input
                    type="text"
                    placeholder="Enter Company Name"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  /> */}
                  <span>{formData.companyName}</span>
                </div>
              </div>
            </div>

            {/* Company Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                Company Title<span style={{ color: "red" }}>*</span> :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #A2A8B8",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter Company Title"
                    value={formData.companyTitle}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyTitle: e.target.value,
                      }))
                    }
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Company Phone */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label
                style={{
                  width: "180px",
                  color: "#3D3D3D",
                  fontSize: "14px",
                }}
              >
                Company Phone :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
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
                      style={{ width: "27px", height: "17px", borderRadius: "4px" }}
                    />
                    <span style={{ marginLeft: "6px", color: "#0E101A" }}>
                      +91
                    </span>
                  </div>

                  {/* <input
                    type="text"
                    placeholder="Enter Company Phone No."
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleChange}
                    maxLength="10"
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  /> */}
                  <span>{formData.companyPhone}</span>
                </div>
              </div>
            </div>

            {/* Company Email */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                Company Email :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* <input
                    type="email"
                    placeholder="Enter Company Email"
                    name="companyEmail"
                    value={formData.companyEmail}
                    onChange={handleChange}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  /> */}
                  <span>{formData.companyEmail}</span>
                </div>
              </div>
            </div>

            {/* GSTIN */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                GSTIN :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  {hasSavedGstin ? (
                    <>
                      <span style={{ color: "black" }}>{formData.gstin}</span>
                      <RiVerifiedBadgeLine
                        style={{
                          color: "green",
                          fontSize: "22px",
                          marginLeft: "8px",
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Enter GSTIN to verify..."
                        name="gstin"
                        value={formData.gstin}
                        onChange={(e) => {
                          const upper = e.target.value.toUpperCase();
                          setFormData((prev) => ({ ...prev, gstin: upper }));
                          setGstError(null);
                          setGstVerified(false);
                        }}
                        style={{
                          border: "none",
                          outline: "none",
                          flex: 1,
                          fontSize: "14px",
                          color: "#0E101A",
                        }}
                      />
                      {!gstVerified && !gstLoading && formData.gstin && (
                        <>
                          {gstVerifyButton && (
                            <button
                              type="button"
                              onClick={handleSearch}
                              style={{
                                padding: "2px 8px",
                                background: "rgb(31, 127, 255)",
                                color: "white",
                                borderRadius: "4px",
                                fontSize: "13px",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              Verify
                            </button>)}
                        </>
                      )}
                      {gstLoading && (
                        <span
                          style={{
                            fontSize: "13px",
                            color: "#1f7fff",
                          }}
                        >
                          Verifying...
                        </span>
                      )}
                      {gstVerified && !gstLoading && formData.gstin && (
                        <RiVerifiedBadgeLine
                          style={{
                            color: "green",
                            fontSize: "22px",
                            marginLeft: "8px",
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Business Type */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                Business Type :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter Business Type"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Alternative Number */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                Alternative Contact No. :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter Alternate Contact No."
                    name="alternativePhone"
                    value={formData.alternativePhone}
                    onChange={handleChange}
                    maxLength="10"
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Website */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                Website :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter Website link"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* PAN No */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                PAN No. :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter Company PAN"
                    name="panNo"
                    value={formData.panNo}
                    onChange={handleChange}
                    maxLength="10"
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Country */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                Country :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* State */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                State :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* district */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                District :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Pincode */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "space-between" }}>
              <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                Pincode :
              </label>

              <div style={{ flex: 1, maxWidth: "792px" }}>
                <div
                  style={{
                    height: "40px",
                    padding: "8px 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Enter pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    style={{
                      border: "none",
                      outline: "none",
                      flex: 1,
                      fontSize: "14px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Company Address */}
            <div style={{ display: "flex", gap: "20px", justifyContent: "space-between", flexWrap: "wrap" }}>
              <label
                style={{
                  width: "180px",
                  color: "#3D3D3D",
                  fontSize: "14px",
                  paddingTop: "12px",
                }}
              >
                Company Address <span style={{ color: "red" }}>*</span> :
              </label>

              <div style={{ flex: 1, maxWidth: "791px" }}>
                <div
                  style={{
                    minHeight: "100px",
                    padding: "12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "2px dashed #EAEAEA",
                    outlineOffset: "-2px",
                    position: "relative",
                  }}
                >
                  <textarea
                    placeholder="Enter Company Address"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    rows="4"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontSize: "14px",
                      color: "#0E101A",
                      fontFamily: "Inter, sans-serif",
                    }}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div style={{ display: "flex", gap: "20px", justifyContent: "space-between", flexWrap: "wrap" }}>
              <label
                style={{
                  width: "180px",
                  color: "#3D3D3D",
                  fontSize: "14px",
                  paddingTop: "12px",
                }}
              >
                Billing Address<span style={{ color: "red" }}>*</span> :
              </label>

              <div style={{ flex: 1, maxWidth: "791px" }}>
                <div
                  style={{
                    minHeight: "100px",
                    padding: "12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "2px dashed #EAEAEA",
                    outlineOffset: "-2px",
                  }}
                >
                  <textarea
                    placeholder="Enter Billing Address"
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    rows="4"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontSize: "14px",
                      color: "#0E101A",
                      fontFamily: "Inter, sans-serif",
                    }}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div style={{ display: "flex", gap: "20px", justifyContent: "space-between", flexWrap: "wrap" }}>
              <label
                style={{
                  width: "180px",
                  color: "#3D3D3D",
                  fontSize: "14px",
                  paddingTop: "12px",
                }}
              >
                Shipping Address<span style={{ color: "red" }}>*</span> :
              </label>

              <div style={{ flex: 1, maxWidth: "791px" }}>
                <div
                  style={{
                    minHeight: "100px",
                    padding: "12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "2px dashed #EAEAEA",
                    outlineOffset: "-2px",
                  }}
                >
                  <textarea
                    placeholder="Enter Shipping Address"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    rows="4"
                    style={{
                      width: "100%",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontSize: "14px",
                      color: "#0E101A",
                      fontFamily: "Inter, sans-serif",
                    }}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Branding Section */}
            <div style={{ marginTop: "32px", borderTop: "1px solid #EAEAEA", paddingTop: "24px" }}>
              <div style={{ marginBottom: "24px", fontSize: "16px", fontWeight: "500", color: "#0E101A" }}>
                Branding
              </div>

              {brandingImages.map((item, index) => (
                <div key={index} style={{
                  display: "grid",
                  gridTemplateColumns: "245px 1fr",
                  alignItems: "center",
                  marginBottom: "16px"
                }}>
                  <label style={{ width: "180px", color: "#3D3D3D", fontSize: "14px" }}>
                    {item.label} :
                  </label>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      onClick={() => handleIconClick(item.field)}
                      style={{
                        width: "60px",
                        height: "60px",
                        background: "white",
                        border: previewUrls[item.field] ? "2px solid #727681" : "2px dashed #7276816b",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        position: "relative",
                        overflow: "hidden"
                      }}
                    >
                      {previewUrls[item.field] ? (
                        <img
                          src={previewUrls[item.field]}
                          alt={item.label}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            borderRadius: "6px"
                          }}
                        />
                      ) : (
                        <img
                          src={settings_company_logo}
                          alt="upload"
                          style={{ width: "24px", height: "24px" }}
                        />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", color: "#0E101A", marginBottom: "4px" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: "12px", color: "#727681" }}>
                        {item.description} <b>(Max file size: 1MB)</b>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleIconClick(item.field)}
                      style={{
                        padding: "6px 12px",
                        background: "#1F7FFF",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer"
                      }}
                    >
                      {previewUrls[item.field] ? "Change" : "Upload"}
                    </button>

                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      ref={fileInputRefs[item.field]}
                      onChange={(e) => handleFileChange(e, item.field)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Save Settings Button */}
            <div className="d-flex justify-content-end">
              <button
                type="submit"
                className="button-hover"
                disabled={isUpdating}
                style={{
                  width: "101px",
                  height: "36px",
                  padding: 8,
                  background: isUpdating ? "#7fb6ff" : "var(--Blue-Blue, #1F7FFF)",
                  boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                  borderRadius: 8,
                  outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                  outlineOffset: "-1.50px",
                  color: "white",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  wordWrap: "break-word",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: isUpdating ? "not-allowed" : "pointer"
                }}
              >
                {isUpdating ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsCompanyDetails;
