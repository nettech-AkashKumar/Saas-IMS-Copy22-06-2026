import React, { useState, useEffect } from "react";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";

const Taxes_GST = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    enableGSTBilling: true,
    defaultGSTRate: "18",
    defaultGSTRateEnabled: true,
    priceIncludeGST: true,
    autoRoundOff: "0",
    autoRoundOffEnabled: false
  });

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/tax-gst-settings');
      
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          enableGSTBilling: data.enableGSTBilling !== undefined ? data.enableGSTBilling : true,
          defaultGSTRate: data.defaultGSTRate || "18",
          defaultGSTRateEnabled: !!data.defaultGSTRate && data.defaultGSTRate !== "",
          priceIncludeGST: data.priceIncludeGST !== undefined ? data.priceIncludeGST : true,
          autoRoundOff: data.autoRoundOff || "0",
          autoRoundOffEnabled: data.autoRoundOff !== "0"
        });
      }
    } catch (error) {
      console.error('Error fetching tax & GST settings:', error);
      // toast.error('Failed to load tax & GST settings');
      toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load tax & GST settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Prepare data for API
      const saveData = {
        enableGSTBilling: settings.enableGSTBilling,
        defaultGSTRate: settings.defaultGSTRateEnabled ? settings.defaultGSTRate : "",
        priceIncludeGST: settings.priceIncludeGST,
        autoRoundOff: settings.autoRoundOffEnabled ? settings.autoRoundOff : "0"
      };

      const response = await api.put('/api/tax-gst-settings', saveData);
      
      if (response.data.success) {
        toast.success('Tax & GST settings saved successfully!');
        // Refresh data
        await fetchSettings();
      }
    } catch (error) {
      // console.error('Error saving tax & GST settings:', error);
      toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message || 
                error?.message || 
                "Failed to save tax & GST settings");
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save tax & GST settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all tax & GST settings to defaults?')) {
      try {
        setIsSaving(true);
        const response = await api.post('/api/tax-gst-settings/reset');
        
        if (response.data.success) {
          toast.success('Tax & GST settings reset to defaults');
          await fetchSettings();
        }
      } catch (error) {
        console.error('Error resetting tax & GST settings:', error);
        // toast.error('Failed to reset tax & GST settings');
        toast.error(error?.response?.data?.displayMessage ||
                  error?.response?.data?.message || 
                  error?.message || 
                  "Failed to reset tax & GST settings");
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle default GST rate checkbox
  const handleDefaultGSTRateToggle = (checked) => {
    setSettings(prev => ({
      ...prev,
      defaultGSTRateEnabled: checked,
      defaultGSTRate: checked ? "18" : ""
    }));
  };

  // Handle auto round off checkbox
  const handleAutoRoundOffToggle = (checked) => {
    setSettings(prev => ({
      ...prev,
      autoRoundOffEnabled: checked,
      autoRoundOff: checked ? "1" : "0"
    }));
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#fff'
      }}>
        <span>Loading tax & GST settings...</span>
      </div>
    );
  }

  return (
    <div
     className="taxesgst"
      style={{
        background: "#fff",
        fontFamily: "'Inter', sans-serif",
        minHeight: "100vh",
        padding: "32px",
      }}
    >
      {/* Page Title */}
      <div
        style={{
          fontSize: 18,
          fontWeight: "600",
          color: "#0E101A",
          marginBottom: 32,
        }}
      >
        Taxes & GST
      </div>
      <div style={{overflow:"auto", scrollbarWidth:"none", msOverflowStyle: "none", maxHeight:"calc(100vh - 360px)", width:"100%"}}>
      {/* Enable GST Billing */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          maxWidth: 610,
          flexWrap:"wrap"
        }}
      >
        <label
          style={{
            fontSize: 14,
            color: "#3D3D3D",
            fontWeight: "400",
          }}
        >
          Enable GST Billing :
        </label>
        <input
          type="checkbox"
          checked={settings.enableGSTBilling}
          onChange={(e) => handleCheckboxChange('enableGSTBilling', e.target.checked)}
          disabled={isSaving}
          style={{
            width: 20,
            height: 20,
            accentColor: "#1F7FFF",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        />
      </div>

      {/* Add Default GST Rates */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          maxWidth: 930,
          flexWrap:"wrap"
        }}
      >
        <label
          style={{
            fontSize: 14,
            color: "#3D3D3D",
            fontWeight: "400",
          }}
        >
          Add Default GST Rates :
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="checkbox"
            checked={settings.defaultGSTRateEnabled}
            onChange={(e) => handleDefaultGSTRateToggle(e.target.checked)}
            disabled={isSaving}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          />
          <select
            value={settings.defaultGSTRate}
            onChange={(e) => handleInputChange('defaultGSTRate', e.target.value)}
            disabled={!settings.defaultGSTRateEnabled || isSaving}
            style={{
              width: 310,
              height: 40,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid #EAEAEA",
              background: settings.defaultGSTRateEnabled ? "white" : "#f5f5f5",
              fontSize: 14,
              color: settings.defaultGSTRateEnabled ? "#0E101A" : "#aaa",
              cursor: (settings.defaultGSTRateEnabled && !isSaving) ? "pointer" : "not-allowed",
              outline: "none"
            }}
          >
            <option value="0">0%</option>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
            <option value="28">28%</option>
          </select>
        </div>
      </div>

      {/* Price Include GST */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          maxWidth: 610,
          flexWrap:"wrap"
        }}
      >
        <label
          style={{
            fontSize: 14,
            color: "#3D3D3D",
            fontWeight: "400",
          }}
        >
          Price Include GST :
        </label>
        <input
          type="checkbox"
          checked={settings.priceIncludeGST}
          onChange={(e) => handleCheckboxChange('priceIncludeGST', e.target.checked)}
          disabled={isSaving}
          style={{
            width: 20,
            height: 20,
            accentColor: "#1F7FFF",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        />
      </div>

      {/* Auto Round Off */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 40,
          maxWidth: 930,
          flexWrap:"wrap"
        }}
      >
        <div>
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              display: "block",
              marginBottom: 4,
            }}
          >
            Auto Round Off :
          </label>
          <div style={{ fontSize: 12, color: "#888" }}>
            Select how to round invoice totals
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="checkbox"
            checked={settings.autoRoundOffEnabled}
            onChange={(e) => handleAutoRoundOffToggle(e.target.checked)}
            disabled={isSaving}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          />
          <select
            value={settings.autoRoundOff}
            onChange={(e) => handleInputChange('autoRoundOff', e.target.value)}
            disabled={!settings.autoRoundOffEnabled || isSaving}
            style={{
              width: 310,
              height: 40,
              padding: "0 12px",
              borderRadius: 8,
              border: "1px solid #EAEAEA",
              background: settings.autoRoundOffEnabled ? "white" : "#f5f5f5",
              fontSize: 14,
              cursor: (settings.autoRoundOffEnabled && !isSaving) ? "pointer" : "not-allowed",
              outline: "none"
            }}
          >
            <option value="0">No Rounding</option>
            <option value="standard">Standard</option>
            <option value="1">Round to Nearest 1</option>
            <option value="5">Round to Nearest 5</option>
            <option value="10">Round to Nearest 10</option>
          </select>
        </div>
      </div>

      {/* Save button*/}
      <div className="resetsave-btn" style={{ display: "flex", justifyContent: "flex-end", gap: 16 ,flexWrap:"wrap"}}>
        <button
          onClick={handleResetToDefaults}
          disabled={isSaving}
          style={{
            padding: "10px 24px",
            background: "#FFFFFF",
            color: "#676767",
            fontSize: 14,
            fontWeight: "500",
            fontFamily: "'Inter', sans-serif",
            border: "1px solid #E6E6E6",
            borderRadius: 8,
            cursor: isSaving ? "not-allowed" : "pointer",
            minHeight: 40,
            opacity: isSaving ? 0.7 : 1
          }}
        >
          Reset to Defaults
        </button>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            padding: "10px 32px",
            background: isSaving ? "#7fb6ff" : "#1F7FFF",
            color: "white",
            fontSize: 14,
            fontWeight: "500",
            fontFamily: "'Inter', sans-serif",
            border: "none",
            borderRadius: 8,
            cursor: isSaving ? "not-allowed" : "pointer",
            boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
            minHeight: 40,
            opacity: isSaving ? 0.7 : 1
          }}
        >
          {isSaving ? "Saving..." : "Save Setting"}
        </button>
      </div>
      </div>
    </div>
  );
};

export default Taxes_GST;