import React, { useState, useEffect, useRef } from "react";
import ThermalPrintInvoice from './ThermalPrintInvoice';
import { BiUpload } from 'react-icons/bi';
import settings_company_logo from "../../../assets/images/Gallery.png";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";

const ThermalPrint = ({ template, companyData, products, customer, onSave, isSaving, notesTermsSettings }) => {
  const [activeTemplate, setActiveTemplate] = useState("template1");
  const [signatureImage, setSignatureImage] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const signatureFileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    // Company header data
    companyLogo: "",
    companyAddress: "",
    companyEmail: "",
    companyPhone: "",
    companyGSTIN: "",

    // Field visibility
    showDate: true,
    showTime: true,
    showHSN: true,
    showTax: true,
    showPaymentMode: true,
    showDueAmount: true,
    showRewardEarned: true,
    showGreetings: true,

    // Template selection
    selectedTemplate: "template1",
    // Signature data
    signatureUrl: ""
  });

  // Initialize form data from props
  useEffect(() => {
    if (template) {
      setFormData(prev => ({
        ...prev,
        companyLogo: companyData?.companyLogo || "",
        companyAddress: companyData?.companyaddress || "",
        companyEmail: companyData?.companyemail || "",
        companyPhone: companyData?.companyphone || "",
        companyGSTIN: companyData?.gstin || "",
        ...template.fieldVisibility,
        selectedTemplate: template.selectedTemplate || "template1",
        signatureUrl: template.signatureUrl || ""
      }));
      setActiveTemplate(template.selectedTemplate || "template1");
      // Set signature preview if exists
      if (template.signatureUrl) {
        setSignaturePreview(template.signatureUrl);
      }
    } else if (companyData) {
      // Initialize from company data if no template
      setFormData(prev => ({
        ...prev,
        companyLogo: companyData?.companyLogo || "",
        companyAddress: companyData.companyaddress || "",
        companyEmail: companyData.companyemail || "",
        companyPhone: companyData.companyphone || "",
        companyGSTIN: companyData.gstin || ""
      }));
    }
  }, [template, companyData]);

  const handleTemplateSelect = (templateId) => {
    setActiveTemplate(templateId);
    setFormData(prev => ({
      ...prev,
      selectedTemplate: templateId
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleSignatureUploadClick = () => {
    signatureFileInputRef.current.click();
  };

  const handleSignatureFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, SVG, GIF)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size should be less than 2MB');
      return;
    }

    setSignatureImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setSignaturePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to server
    await uploadSignatureToServer(file);
  };

  const uploadSignatureToServer = async (file) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('signature', file);
      formData.append('type', 'signature');
      formData.append('templateType', 'thermal');

      if (companyData?._id) {
        formData.append('companyId', companyData._id);
      }

      const response = await api.post('/api/print-templates/upload-signature', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const signatureUrl = response.data.data.url;
        setFormData(prev => ({
          ...prev,
          signatureUrl: signatureUrl
        }));
        toast.success('Signature uploaded successfully');
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message || 
                error?.message || 
                "Failed to upload signature");
      console.error('Error uploading signature:', error);
      toast.error('Failed to upload signature');
    } finally {
      setIsUploading(false);
    }
  };

  const removeSignature = () => {
    setSignatureImage(null);
    setSignaturePreview("");
    setFormData(prev => ({
      ...prev,
      signatureUrl: ""
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // Prepare data for saving
      const saveData = {
        _id: template?._id, // Include _id if it exists to trigger update instead of create
        templateType: 'thermal',
        selectedTemplate: formData.selectedTemplate,
        fieldVisibility: {
          showDate: formData.showDate,
          showTime: formData.showTime,
          showHSN: formData.showHSN,
          showTax: formData.showTax,
          showPaymentMode: formData.showPaymentMode,
          showDueAmount: formData.showDueAmount,
          showRewardEarned: formData.showRewardEarned,
          showGreetings: formData.showGreetings
        },
        signatureUrl: formData.signatureUrl,
        // Company data to save back to company settings if needed
        companyData: {
          companyLogo: companyData?.companyLogo || "",
          companyaddress: formData.companyAddress,
          companyemail: formData.companyEmail,
          companyphone: formData.companyPhone,
          gstin: formData.companyGSTIN
        }
      };

      // Call the parent save function
      await onSave(saveData);
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || 
              error?.response?.data?.message || 
              error?.message || 
              "Error saving settings");
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="thermalPrint-container" style={{ display: "flex", alignItems: "stretch", gap: "20px", width: "100%", height: "calc(100vh - 160px)", backgroundColor: "#ffff" }}>
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          fontFamily: "Inter, sans-serif",
          flex: 1,
          height: "100%",
          overflowY: "auto",
          minWidth: 0,
          scrollbarWidth: "none",
          msOverflowStyle: "none"
        }}
      >
        {/* Header: Select Template + Save Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div style={{ fontSize: "16px", fontWeight: "500" }}>
            Select Template
          </div>
        </div>

        {/* Template Thumbnails */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            marginBottom: "40px",
            justifyContent: "start",
          }}
        >
          {/* Template 1 - Selected */}
          <label
            style={{ textAlign: "center", cursor: "pointer" }}
            onClick={() => handleTemplateSelect("template1")}
          >
            <div
              style={{
                width: "120px",
                height: "170px",
                backgroundColor: "#fff",
                border: activeTemplate === "template1" ? "2px solid #1F7FFF" : "none",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                marginBottom: "12px",
                position: "relative",
              }}
            >
              <div style={{ padding: "16px" }}>
                <div
                  style={{
                    height: "15px",
                    backgroundColor: "#E5E7EB",
                    marginBottom: "4px",
                  }}
                ></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: "40px",
                      height: "10px",
                      backgroundColor: "#E5E7EB",
                      marginBottom: "4px",
                    }}
                  ></span>
                  <span
                    style={{
                      display: "inline-block",
                      width: "40px",
                      height: "10px",
                      backgroundColor: "#E5E7EB",
                      marginBottom: "4px",
                    }}
                  ></span>
                </div>
                <div
                  style={{
                    height: "7px",
                    backgroundColor: "#E5E7EB",
                    marginBottom: "4px",
                  }}
                ></div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr 1fr",
                    gap: "4px",
                  }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      style={{ height: "7px", border: "1px solid #E5E7EB" }}
                    ></div>
                  ))}
                </div>
                {/*  */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    marginTop: "20px",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      width: "100%",
                      height: "2px",
                      background: "#D9D9D9",
                    }}
                  />

                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: "8px",
                        height: "2px",
                        backgroundColor: "#D9D9D9",
                      }}
                    ></span>
                    <span
                      style={{
                        display: "block",
                        width: "8px",
                        height: "2px",
                        backgroundColor: "#D9D9D9",
                      }}
                    ></span>
                  </div>

                  <span
                    style={{
                      display: "block",
                      width: "71px",
                      height: "1px",
                      backgroundColor: "#D9D9D9",
                    }}
                  ></span>
                  <span
                    style={{
                      display: "block",
                      width: "60px",
                      height: "1px",
                      backgroundColor: "#D9D9D9",
                    }}
                  ></span>

                  <span
                    style={{
                      display: "block",
                      width: "100%",
                      height: "1px",
                      background: "#D9D9D9",
                    }}
                  />
                </div>
                {/*  */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-evenly",
                    gap: "4px",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      height: "20px",
                      border: "1px #D9D9D9 solid",
                    }}
                  />
                  <div
                    style={{
                      width: "50px",
                      height: "20px",
                      border: "1px #D9D9D9 solid",
                    }}
                  />
                  <div
                    style={{
                      width: "50px",
                      height: "20px",
                      border: "1px #D9D9D9 solid",
                    }}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                width: "24px",
                height: "24px",
                backgroundColor: activeTemplate === "template1" ? "#1F7FFF" : "#D9D9D9",
                borderRadius: "50%",
                margin: "0 auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path
                  d="M1 5L5 9L13 1"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </label>

          {/* Template 2 & 3 */}
          {["template2", "template3"].map((templateId, idx) => (
            <label
              key={templateId}
              style={{ textAlign: "center", cursor: "pointer" }}
              onClick={() => handleTemplateSelect(templateId)}
            >
              <div
                style={{
                  width: "120px",
                  height: "170px",
                  backgroundColor: "#fff",
                  border: activeTemplate === templateId ? "2px solid #1F7FFF" : "none",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  marginBottom: "12px",
                  position: "relative",
                }}
              >
                <div style={{ padding: "16px" }}>
                  <div
                    style={{
                      height: "15px",
                      backgroundColor: "#E5E7EB",
                      marginBottom: "4px",
                    }}
                  ></div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "40px",
                        height: "10px",
                        backgroundColor: "#E5E7EB",
                        marginBottom: "4px",
                      }}
                    ></span>
                    <span
                      style={{
                        display: "inline-block",
                        width: "40px",
                        height: "10px",
                        backgroundColor: "#E5E7EB",
                        marginBottom: "4px",
                      }}
                    ></span>
                  </div>
                  <div
                    style={{
                      height: "7px",
                      backgroundColor: "#E5E7EB",
                      marginBottom: "4px",
                    }}
                  ></div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: "4px",
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div
                        key={i}
                        style={{ height: "7px", border: "1px solid #E5E7EB" }}
                      ></div>
                    ))}
                  </div>
                  {/*  */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      marginTop: "20px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: "100%",
                        height: "2px",
                        background: "#D9D9D9",
                      }}
                    />

                    <div
                      style={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <span
                        style={{
                          display: "block",
                          width: "8px",
                          height: "2px",
                          backgroundColor: "#D9D9D9",
                        }}
                      ></span>
                      <span
                        style={{
                          display: "block",
                          width: "8px",
                          height: "2px",
                          backgroundColor: "#D9D9D9",
                        }}
                      ></span>
                    </div>

                    <span
                      style={{
                        display: "block",
                        width: "71px",
                        height: "1px",
                        backgroundColor: "#D9D9D9",
                      }}
                    ></span>
                    <span
                      style={{
                        display: "block",
                        width: "60px",
                        height: "1px",
                        backgroundColor: "#D9D9D9",
                      }}
                    ></span>

                    <span
                      style={{
                        display: "block",
                        width: "100%",
                        height: "1px",
                        background: "#D9D9D9",
                      }}
                    />
                  </div>
                  {/*  */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-evenly",
                      gap: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "50px",
                        height: "20px",
                        border: "1px #D9D9D9 solid",
                      }}
                    />
                    <div
                      style={{
                        width: "50px",
                        height: "20px",
                        border: "1px #D9D9D9 solid",
                      }}
                    />
                    <div
                      style={{
                        width: "50px",
                        height: "20px",
                        border: "1px #D9D9D9 solid",
                      }}
                    />
                  </div>
                </div>
              </div>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  backgroundColor: activeTemplate === templateId ? "#1F7FFF" : "#D9D9D9",
                  borderRadius: "50%",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                  <path
                    d="M1 5L5 9L13 1"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </label>
          ))}
        </div>

        {/* Invoice Header Section */}
        <div style={{ marginBottom: "32px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px" }}
          >
            Invoice Header
          </h3>

          {/* Company Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "60px",
              marginBottom: "16px",
            }}
          >
            <label style={{ width: "160px", fontSize: "14px", color: "#374151" }}>
              Company Logo :
            </label>
            <div
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
              <img
                src={companyData?.companyLogo}
                alt="upload"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
          </div>

          {/* Form Fields */}
          {[
            {
              field: "companyAddress",
              label: "Company Address :",
              placeholder: "Enter Address Here",
              value: formData.companyAddress
            },
            {
              field: "companyEmail",
              label: "Company Email :",
              placeholder: "Enter Email",
              value: formData.companyEmail
            },
            {
              field: "companyPhone",
              label: "Company Phone No. :",
              placeholder: "Enter Phone No.",
              value: formData.companyPhone
            },
            {
              field: "companyGSTIN",
              label: "Company GSTIN :",
              placeholder: "Enter GSTIN",
              value: formData.companyGSTIN
            },
          ].map((field, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "60px",
                marginBottom: "16px",
              }}
            >
              <label
                style={{ width: "160px", fontSize: "14px", color: "#374151" }}
              >
                {field.label}
              </label>
              <input
                type="text"
                value={field.value}
                onChange={(e) => handleInputChange(field.field, e.target.value)}
                placeholder={field.placeholder}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #E5E7EB",
            margin: "32px 0",
          }}
        />

        {/* Date Time */}
        <div style={{ marginBottom: "32px" }}>
          {[
            { field: "showDate", label: "Date" },
            { field: "showTime", label: "Time" }
          ].map((item) => (
            <div
              key={item.field}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "60px",
                marginBottom: "16px",
              }}
            >
              <label
                style={{ width: "160px", fontSize: "14px", color: "#374151" }}
              >
                {item.label} :
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData[item.field]}
                  onChange={(e) => handleCheckboxChange(item.field, e.target.checked)}
                  style={{
                    width: "20px",
                    height: "20px",
                    accentColor: "#1F7FFF",
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>
          ))}
        </div>

        {/* Order Details */}
        <div style={{ marginBottom: "32px" }}>
          <h3
            style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px" }}
          >
            Order Details
          </h3>
          {[
            { field: "showHSN", label: "HSN" },
            { field: "showTax", label: "Tax" }
          ].map((item) => (
            <div
              key={item.field}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "60px",
                marginBottom: "16px",
              }}
            >
              <label
                style={{ width: "160px", fontSize: "14px", color: "#374151" }}
              >
                {item.label} :
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData[item.field]}
                  onChange={(e) => handleCheckboxChange(item.field, e.target.checked)}
                  style={{
                    width: "20px",
                    height: "20px",
                    accentColor: "#1F7FFF",
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>
          ))}
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #E5E7EB",
            margin: "32px 0",
          }}
        />

        {/* Invoice Footer */}
        <div>
          <h3
            style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px" }}
          >
            Invoice Footer
          </h3>

          {[
            { field: "showPaymentMode", label: "Payment Mode" },
            { field: "showDueAmount", label: "Due Amount" },
            { field: "showRewardEarned", label: "Reward Earned" },
            { field: "showGreetings", label: "Greetings" }
          ].map((item) => (
            <div
              key={item.field}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "60px",
                marginBottom: "16px",
              }}
            >
              <label
                style={{ width: "160px", fontSize: "14px", color: "#374151" }}
              >
                {item.label} :
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={formData[item.field]}
                  onChange={(e) => handleCheckboxChange(item.field, e.target.checked)}
                  style={{
                    width: "20px",
                    height: "20px",
                    accentColor: "#1F7FFF",
                    cursor: "pointer",
                  }}
                />
              </label>
            </div>
          ))}
          {/* ADD SIGNATURE UPLOAD SECTION HERE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "60px",
              marginTop: "24px",
              marginBottom: "24px",
            }}
          >
            <label
              style={{ width: "160px", fontSize: "14px", color: "#374151" }}
            >
              Signature :
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                onClick={handleSignatureUploadClick}
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
                {isUploading ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '2px solid #f3f3f3',
                      borderTop: '2px solid #1F7FFF',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '8px'
                    }}></div>
                    <span style={{ fontSize: '12px', color: '#727681' }}>Uploading...</span>
                  </div>
                ) : signaturePreview ? (
                  <img
                    src={signaturePreview}
                    alt="Signature"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: "8px",
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

                <input
                  type="file"
                  ref={signatureFileInputRef}
                  onChange={handleSignatureFileChange}
                  accept=".jpg,.jpeg,.png,.svg,.gif,image/jpeg,image/png,image/svg+xml,image/gif"
                  style={{ display: "none" }}
                />
              </div>

              {signaturePreview && (
                <button
                  onClick={removeSignature}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#FF4444",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              )}

              {signaturePreview && (
                <button
                  onClick={handleSignatureUploadClick}
                  style={{
                    textDecoration: "underline",
                    outline: "none",
                    color: "#1F7FFF",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "120%",
                    fontFamily: "inter",
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
              )}
            </div>
          </div>

          {/* Save Settings Button */}
          <div className="d-flex justify-content-end">
            <button
              onClick={handleSaveSettings}
              className="button-hover"
              disabled={isSaving}
              style={{
                width: "101px",
                height: "36px",
                padding: 8,
                background: isSaving ? "#7fb6ff" : "var(--Blue-Blue, #1F7FFF)",
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
                justifyContent: "center",
                alignItems: "center",
                cursor: isSaving ? "not-allowed" : "pointer"
              }}
            >
              {isSaving ? "Saving..." : "Save Setting"}
            </button>
          </div>
        </div>
      </div>

      <div className='dashboard' style={{ flex: 1, minWidth: 0, height: "calc(100vh - 250px)" }}>
        <ThermalPrintInvoice
          template={formData}
          companyData={{
            ...companyData,
            companyLogo: formData.companyLogo,
            companyaddress: formData.companyAddress,
            companyemail: formData.companyEmail,
            companyphone: formData.companyPhone,
            gstin: formData.companyGSTIN
          }}
          products={products}
          customer={customer}
          notesTermsSettings={notesTermsSettings}
        />
      </div>
    </div>
  )
}

export default ThermalPrint;