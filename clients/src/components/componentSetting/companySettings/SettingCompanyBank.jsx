import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance";

const SettingCompanyBank = () => {
  /* ================= STATE ================= */
  const [isUpdating, setIsUpdating] = useState(false);
  const [bankId, setBankId] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [existingQr, setExistingQr] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
    upiId: "",
    isDefault: true,
  });

  const [errors, setErrors] = useState({});

  /* ================= REGEX ================= */
  const regex = {
    bankName: /^[A-Za-z ]{3,50}$/,
    holder: /^[A-Za-z ]{3,50}$/,
    account: /^[0-9]{9,18}$/,
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
    upi: /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/,
    branch: /^[A-Za-z0-9\s,.-]{3,50}$/,
  };

  /* ================= VALIDATION ================= */
  const validateField = (name, value) => {
    let error;

    if (name === "bankName" && !regex.bankName.test(value))
      error = "Enter valid bank name";

    if (name === "accountHolderName" && !regex.holder.test(value))
      error = "Enter valid account holder name";

    if (name === "accountNumber" && !regex.account.test(value))
      error = "Account number must be 9–18 digits";

    if (name === "ifsc" && !regex.ifsc.test(value))
      error = "Invalid IFSC code";

    if (name === "upiId" && value && !regex.upi.test(value))
      error = "Invalid UPI ID";
    if (name === "branch" && value && value.length > 0 && !regex.branch.test(value))
      error = "Branch name must be 3-50 characters and contain only letters, numbers, space, commas, dots, and hyphens"

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const validateForm = () => {
    let valid = true;
    Object.entries(formData).forEach(([k, v]) => {
      if (k !== "isDefault" && validateField(k, v)) valid = false;
    });
    return valid;
  };

  /* ================= CHANGE ================= */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    validateField(name, value);
  };

  /* ================= FETCH DEFAULT BANK ================= */
  const fetchBank = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/api/company-bank/list");

      if (res.data?.success && res.data.data && res.data.data.length > 0) {
        let bankData;

        // Try to find default bank
        const defaultBank = res.data.data.find(bank => bank.isDefault);

        if (defaultBank) {
          bankData = defaultBank;
        } else if (res.data.data.length > 0) {
          bankData = res.data.data[0];
        }

        if (bankData) {
          setFormData({
            bankName: bankData.bankName || "",
            accountHolderName: bankData.accountHolderName || "",
            accountNumber: bankData.accountNumber || "",
            ifsc: bankData.ifsc || "",
            branch: bankData.branch || "",
            upiId: bankData.upiId || "",
            isDefault: bankData.isDefault ?? true,
          });
          setExistingQr(bankData.qrCode || null);
          setBankId(bankData._id);
          setIsUpdating(true);
        } else {
          resetForm();
        }
      } else {
        resetForm();
      }
    } catch (error) {
      console.log("No existing bank found or error:", error);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to reset form
  const resetForm = () => {
    setFormData({
      bankName: "",
      accountHolderName: "",
      accountNumber: "",
      ifsc: "",
      branch: "",
      upiId: "",
      isDefault: true,
    });
    setExistingQr(null);
    setBankId(null);
    setIsUpdating(false);
    setQrFile(null);
  };

  useEffect(() => {
    fetchBank();
  }, []);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Fix validation errors");
      return;
    }

    setIsLoading(true);

    try {
      const form = new FormData();

      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value);
      });

      // Append QR file if selected
      if (qrFile) {
        form.append("qrCode", qrFile);
      }

      let response;

      if (isUpdating && bankId) {
        // UPDATE existing bank
        response = await api.put(`/api/company-bank/update/${bankId}`, form, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success("Bank details updated successfully");
      } else {
        // CREATE new bank
        response = await api.post("/api/company-bank/add", form, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success("Bank details saved successfully");
      }

      // Reset file input
      setQrFile(null);

      // Refresh data
      fetchBank();

    } catch (error) {
      console.error("Submit error:", error);
      const errorMessage = error.response?.data?.message || error.message;
      toast.error(`Failed to ${isUpdating ? 'update' : 'save'} bank details: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  /* ================= UI ================= */
  if (isLoading && !isUpdating) {
    return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={{}}>
      <form onSubmit={handleSubmit} style={{
        padding: "20px",
        margin: "0 auto"
      }}>
        <h1 style={{
          fontFamily: "'Roboto', sans-serif",
          fontWeight: "500",
          color: "#0E101A",
          fontSize: "16px",
          marginBottom: "20px"
        }}>Bank Details</h1>
        <div style={{ maxHeight: "calc(100vh - 300px)", overflow: "auto", msOverflowStyle: "none", scrollbarWidth: "none", }}>
          {/* Bank Name */}
          <div className="setting-bankinput" style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <label style={{
                color: "#3D3D3D",
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "400",
                fontSize: "14px",
                lineHeight: "14px"
              }}>Bank Name</label>
              <span style={{ color: "red", marginLeft: "4px" }}>*</span>
            </span>
            <div>
              <input
                style={{
                  background: "#fbfbfb",
                  border: "1px solid #c2c2c2",
                  borderRadius: "8px",
                  padding: "10px",
                  outline: "none",
                  color: "#676767",
                  fontSize: "14px",
                  fontWeight: "400",
                  lineHeight: "18px",
                  height: "38px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.bankName && (
                <span style={{ color: "red", fontSize: "12px", display: "block", marginTop: "4px" }}>{errors.bankName}</span>
              )}
            </div>
          </div>

          {/* Account Holder */}
          <div className="setting-bankinput" style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <label style={{
                color: "#3D3D3D",
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "400",
                fontSize: "14px",
                lineHeight: "14px"
              }}>Account Holder Name</label>
              <span style={{ color: "red", marginLeft: "4px" }}>*</span>
            </span>
            <div>
              <input
                style={{
                  background: "#fbfbfb",
                  border: "1px solid #c2c2c2",
                  borderRadius: "8px",
                  padding: "10px",
                  outline: "none",
                  color: "#676767",
                  fontSize: "14px",
                  fontWeight: "400",
                  lineHeight: "18px",
                  height: "38px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
                name="accountHolderName"
                value={formData.accountHolderName}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.accountHolderName && (
                <span style={{ color: "red", fontSize: "12px", display: "block", marginTop: "4px" }}>{errors.accountHolderName}</span>
              )}
            </div>
          </div>

          {/* Account Number */}
          <div className="setting-bankinput" style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <label style={{
                color: "#3D3D3D",
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "400",
                fontSize: "14px",
                lineHeight: "14px"
              }}>Account Number</label>
              <span style={{ color: "red", marginLeft: "4px" }}>*</span>
            </span>
            <div>
              <input
                style={{
                  background: "#fbfbfb",
                  border: "1px solid #c2c2c2",
                  borderRadius: "8px",
                  padding: "10px",
                  outline: "none",
                  color: "#676767",
                  fontSize: "14px",
                  fontWeight: "400",
                  lineHeight: "18px",
                  height: "38px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.accountNumber && (
                <span style={{ color: "red", fontSize: "12px", display: "block", marginTop: "4px" }}>{errors.accountNumber}</span>
              )}
            </div>
          </div>

          {/* IFSC */}
          <div className="setting-bankinput" style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <label style={{
                color: "#3D3D3D",
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "400",
                fontSize: "14px",
                lineHeight: "14px"
              }}>IFSC Code</label>
              <span style={{ color: "red", marginLeft: "4px" }}>*</span>
            </span>
            <div>
              <input
                style={{
                  background: "#fbfbfb",
                  border: "1px solid #c2c2c2",
                  borderRadius: "8px",
                  padding: "10px",
                  outline: "none",
                  color: "#676767",
                  fontSize: "14px",
                  fontWeight: "400",
                  lineHeight: "18px",
                  height: "38px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
                name="ifsc"
                value={formData.ifsc}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.ifsc && (
                <span style={{ color: "red", fontSize: "12px", display: "block", marginTop: "4px" }}>{errors.ifsc}</span>
              )}
            </div>
          </div>

          {/* Branch */}
          <div className="setting-bankinput" style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <label style={{
                color: "#3D3D3D",
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "400",
                fontSize: "14px",
                lineHeight: "14px"
              }}>Branch</label>
            </span>
            <div>
              <input
                style={{
                  background: "#fbfbfb",
                  border: "1px solid #c2c2c2",
                  borderRadius: "8px",
                  padding: "10px",
                  outline: "none",
                  color: "#676767",
                  fontSize: "14px",
                  fontWeight: "400",
                  lineHeight: "18px",
                  height: "38px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                disabled={isLoading}
                maxLength="50"
                title={formData.branch || "Enter branch name"}
                placeholder="Enter branch name"
              />
              {formData.branch && (
                <div style={{
                  fontSize: "11px",
                  color: "#999",
                  marginTop: "4px",
                  textAlign: "right"
                }}>
                  {formData.branch.length}/50
                </div>
              )}
              {errors.branch && (
                <span style={{ color: "red", fontSize: "12px", display: "block", marginTop: "4px" }}>{errors.branch}</span>
              )}
            </div>
          </div>

          {/* UPI */}
          <div className="setting-bankinput" style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <span style={{ display: "flex", alignItems: "center" }}>
              <label style={{
                color: "#3D3D3D",
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "400",
                fontSize: "14px",
                lineHeight: "14px"
              }}>UPI ID</label>
            </span>
            <div>
              <input
                style={{
                  background: "#fbfbfb",
                  border: "1px solid #c2c2c2",
                  borderRadius: "8px",
                  padding: "10px",
                  outline: "none",
                  color: "#676767",
                  fontSize: "14px",
                  fontWeight: "400",
                  lineHeight: "18px",
                  height: "38px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.upiId && (
                <span style={{ color: "red", fontSize: "12px", display: "block", marginTop: "4px" }}>{errors.upiId}</span>
              )}
            </div>
          </div>

          {/* QR Code */}
          {/* QR Code */}
          <div
            className="setting-bankinput"
            style={{
              display: "grid",
              gridTemplateColumns: "180px 2fr",
              alignItems: "flex-start",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <span>
              <label
                style={{
                  color: "#3D3D3D",
                  fontFamily: "'Roboto', sans-serif",
                  fontSize: "14px",
                }}
              >
                UPI QR Code
              </label>
            </span>

            <div>
              {/* Hidden file input */}
              <input
                id="qrUpload"
                type="file"
                accept="image/*"
                onChange={(e) => setQrFile(e.target.files[0])}
                disabled={isLoading}
                style={{ display: "none" }}
              />

              {/* Custom upload button */}
              <label
                htmlFor="qrUpload"
                style={{
                  display: "inline-block",
                  padding: "8px 16px",
                  backgroundColor: "#fbfbfb",
                  border: "1px dashed #c2c2c2",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#007cff",
                }}
              >
                {qrFile ? "Change QR Code" : "Upload QR Code"}
              </label>

              {/* Existing QR */}
              {existingQr && !qrFile && (
                <div style={{ marginTop: "10px" }}>
                  <p style={{ fontSize: "12px", color: "#666" }}>Current QR:</p>
                  <img
                    src={existingQr}
                    alt="QR"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "contain",
                      border: "1px solid #e6e6e6",
                      borderRadius: "4px",
                      padding: "4px",
                    }}
                  />
                </div>
              )}

              {/* Preview new QR */}
              {qrFile && (
                <div style={{ marginTop: "10px" }}>
                  <p style={{ fontSize: "12px", color: "#666" }}>New QR Preview:</p>
                  <img
                    src={URL.createObjectURL(qrFile)}
                    alt="Preview"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: "contain",
                      border: "1px solid #e6e6e6",
                      borderRadius: "4px",
                      padding: "4px",
                    }}
                  />
                </div>
              )}
            </div>
          </div>


          {/* Default */}
          <div className="settingbank-defoultcheck" style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            alignItems: "center",
            gap: "15px",
            marginBottom: "20px"
          }}>
            <div></div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                disabled={isLoading}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer"
                }}
              />
              <label style={{
                color: "#3D3D3D",
                fontFamily: "'Roboto', sans-serif",
                fontWeight: "400",
                fontSize: "14px",
                lineHeight: "14px",
                cursor: "pointer"
              }}>
                Default Bank
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="setting-bank-svbtn" style={{
            display: "grid",
            gridTemplateColumns: "180px 1fr",
            alignItems: "center",
            gap: "15px",
            marginTop: "20px"
          }}>
            <div></div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 24px",
                  backgroundColor: isLoading ? "#ccc" : "#007cff",
                  color: "#FFFFFF",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontFamily: "'Roboto', sans-serif",
                  fontWeight: "400",
                  minWidth: "120px"
                }}
              >
                {isLoading ? "Processing..." : (isUpdating ? "Update Changes" : "Save Changes")}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingCompanyBank;