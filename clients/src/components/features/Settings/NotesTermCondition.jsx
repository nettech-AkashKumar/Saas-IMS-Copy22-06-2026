import React, { useState, useEffect } from "react";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";

const NotesTermCondition = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for form data
  const [formData, setFormData] = useState({
    footerLine1: "",
    footerLine2: "",
    notesText: "",
    termsText: "",
    loyaltyMessage: ""
  });

  // Fetch existing settings
  const fetchSettings = async () => {
  try {
    setIsLoading(true);

    const response = await api.get('/api/notes-terms-settings');
    // console.log('Response:', response);
    
    if (response.data.success) {
      const settings = response.data.data;
      setFormData({
        footerLine1: settings.footerLine1 || "",
        footerLine2: settings.footerLine2 || "",
        notesText: settings.notesText || "",
        termsText: settings.termsText || "",
        loyaltyMessage: settings.loyaltyMessage || ""
      });
    } else {
      toast.error("Failed to load settings: " + (response.data.message || 'Unknown error'));
    }
  } catch (error) {
    toast.error(error?.response?.data?.displayMessage ||
              error?.response?.data?.message || 
              error?.message || 
              "Failed to load settings");
    console.error('Error fetching notes & terms settings:', error);
    console.error('Error response:', error.response);
    toast.error('Failed to load settings: ' + (error.message || 'Unknown error'));
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const response = await api.put('/api/notes-terms-settings', formData);
      
      if (response.data.success) {
        toast.success('Settings saved successfully!');
        // Refresh data
        await fetchSettings();
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage ||
              error?.response?.data?.message ||
              error?.message ||
              "Failed to save settings");
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className=""
        style={{
          background: "#ffff",
          fontFamily: "Inter, sans-serif",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 200px)"
        }}
      >
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className=""
      style={{
        background: "#ffff",
        fontFamily: "Inter, sans-serif",  
      }}
    >
      <div
        style={{
          color: "#0E101A",
          fontSize: 16,
          fontWeight: "500",
          marginBottom: 24,
        }}
      >
        Notes, Terms & Footer Settings
      </div>

      <div className="notes-termcondition-container" style={{ overflow: "scroll", height:"calc(100vh - 250px)", width: "100%", scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {/* Invoice Footer Message */}
        <div style={{ marginBottom: 32, }}>
          <div style={{ fontWeight: "500", fontSize: 14, color: "#0E101A", marginBottom: 16 }}>
            Invoice Footer Message
          </div>

          {/* Footer Line 1 */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 ,flexWrap:"wrap"}}>
            <label style={{ color: "#3D3D3D", fontSize: 14, paddingTop: 12 }}>
              Footer Line 1 :
            </label>
            <textarea
              value={formData.footerLine1}
              onChange={(e) => handleInputChange('footerLine1', e.target.value)}
              style={{
                width: 791,
                minHeight: 80,
                padding: 12,
                borderRadius: 8,
                outline: "none",
                border: "1px dashed #1616166b",
                outlineOffset: "-2px",
                background: "white",
                fontSize: 14,
                fontFamily: "Inter",
                resize: "none",
                overflow: "hidden"
              }}
            />
          </div>

          {/* Footer Line 2 */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap:"wrap" }}>
            <label style={{ color: "#3D3D3D", fontSize: 14, paddingTop: 12 }}>
              Footer Line 2 :
            </label>
            <textarea
              value={formData.footerLine2}
              onChange={(e) => handleInputChange('footerLine2', e.target.value)}
              style={{
                width: 791,
                minHeight: 80,
                padding: 12,
                borderRadius: 8,
                border: "1px dashed rgba(22, 22, 22, 0.42)",
                outlineOffset: "-2px",
                background: "white",
                fontSize: 14,
                fontFamily: "Inter",
                resize: "none",
                overflow: "hidden",
                outline: "none"
              }}
            />
          </div>
        </div>

        <hr style={{ border: "1px solid #EAEAEA", margin: "32px 0" }} />

        {/* Notes Section */}
        <div style={{ marginBottom: 32, }}>
          <div style={{ fontWeight: "500", fontSize: 14, color: "#0E101A", marginBottom: 16 }}>
            Notes Section
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap:"wrap" }}>
            <label style={{ color: "#3D3D3D", fontSize: 14, paddingTop: 12 }}>
              Notes Text :
            </label>
            <textarea
              value={formData.notesText}
              onChange={(e) => handleInputChange('notesText', e.target.value)}
              style={{
                width: 791,
                minHeight: 100,
                padding: 12,
                borderRadius: 8,
                border: "1px dashed rgba(22, 22, 22, 0.42)",
                outlineOffset: "-2px",
                background: "white",
                fontSize: 14,
                fontFamily: "Inter",
                resize: "none",
                overflow: "hidden",
                outline: "none"
              }}
            />
          </div>
        </div>

        <hr style={{ border: "1px solid #EAEAEA", margin: "32px 0" }} />

        {/* Terms & Conditions */}
        <div style={{ marginBottom: 32, }}>
          <div style={{ fontWeight: "500", fontSize: 14, color: "#0E101A", marginBottom: 16 }}>
            Terms & Conditions
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",flexWrap:"wrap" }}>
            <label style={{ color: "#3D3D3D", fontSize: 14, paddingTop: 12 }}>
              Terms & Condition Text :
            </label>
            <textarea
              value={formData.termsText}
              onChange={(e) => handleInputChange('termsText', e.target.value)}
              style={{
                width: 791,
                minHeight: 100,
                padding: 12,
                borderRadius: 8,
                border: "1px dashed rgba(22, 22, 22, 0.42)",
                outlineOffset: "-2px",
                background: "white",
                fontSize: 14,
                fontFamily: "Inter",
                resize: "none",
                overflow: "hidden",
                outline: "none"
              }}
            />
          </div>
        </div>

        <hr style={{ border: "1px solid #EAEAEA", margin: "32px 0" }} />

        {/* Loyalty Message */}
        <div style={{ marginBottom: 40, }}>
          <div style={{ fontWeight: "500", fontSize: 14, color: "#0E101A", marginBottom: 16 }}>
            Loyalty Message
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",flexWrap:"wrap" }}>
            <label style={{ color: "#3D3D3D", fontSize: 14, }}>
              Loyalty Message :
            </label>
            <textarea
              value={formData.loyaltyMessage}
              onChange={(e) => handleInputChange('loyaltyMessage', e.target.value)}
              style={{
                width: 791,
                minHeight: 100,
                padding: 12,
                borderRadius: 8,
                border: "1px dashed rgba(22, 22, 22, 0.42)",
                outlineOffset: "-2px",
                background: "white",
                fontSize: 14,
                fontFamily: "Inter",
                resize: "none",
                overflow: "hidden",
                outline: "none"
              }}
            />
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: "10px 24px",
              background: isSaving ? "#7fb6ff" : "#1F7FFF",
              color: "white",
              fontSize: 14,
              fontWeight: "500",
              fontFamily: "Inter",
              border: "none",
              borderRadius: 8,
              cursor: isSaving ? "not-allowed" : "pointer",
              boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
              minWidth: 140,
            }}
          >
            {isSaving ? "Saving..." : "Save Setting"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotesTermCondition;