import React, { useState, useEffect, useRef } from "react";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

const System_Setting = () => {
  const [dropdown, setDropDown] = useState(false);
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    category: false,
    subcategory: false,
    brand: false,
    description: false,
    itembarcode: false,
    hsn: false,
    units: false,
    lotno: false,
    pricing: false,
    serialno: false,
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropDown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/system-settings');
      if (response.data.success) {
        const data = response.data.data;
        setSettings({
          category: data.category || false,
          subcategory: data.subcategory || false,
          brand: data.brand || false,
          description: data.description || false,
          itembarcode: data.itembarcode || false,
          hsn: data.hsn || false,
          units: data.units || false,
          lotno: data.lotno || false,
          pricing: data.pricing || false,
          serialno: data.serialno || false,
        });
      }
    } catch (error) {
      // console.error("Error fetching system settings:", error);
      // toast.error("Failed to fetch system settings");
      toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message || 
                error?.message || 
                "Failed to fetch system settings");
    }
  };

  const handleCheckboxChange = (field, subField = null) => {
    if (field === "variants") {
      setSettings((prev) => ({
        ...prev,
        variants: {
          ...prev.variants,
          [subField]: !prev.variants[subField],
        },
      }));
    } else if (field === "lotno") {
      setSettings((prev) => {
        const isCurrentlyLot = prev.lotno === true;
        return {
          ...prev,
          lotno: !isCurrentlyLot,
          pricing: isCurrentlyLot ? true : false,
        };
      });
    } else if (field === "pricing") {
      setSettings((prev) => {
        const isCurrentlyPricing = prev.pricing === true;
        return {
          ...prev,
          pricing: !isCurrentlyPricing,
          lotno: isCurrentlyPricing ? true : false,
        };
      });
    } else {
      setSettings((prev) => ({
        ...prev,
        [field]: !prev[field],
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/system-settings', settings);
      if (response.data.success) {
        toast.success("System settings updated successfully");
        // Optionally update local state with response data if needed, but we already have it
      }
    } catch (error) {
      // console.error("Error updating system settings:", error);
      // toast.error("Failed to update system settings");
      toast.error(error?.response?.data?.displayMessage ||
                error?.response?.data?.message || 
                error?.message || 
                "Failed to update system settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
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
        System Settings
      </div>

      <div style={{ overflow: "auto", height: "calc(100vh - 330px)", width: '100%' }}>

        {/* generat settings heading */}
        <div
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#0E101A",
            marginBottom: 20,
          }}
        >
          General:-
        </div>

        {/* category */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Category :
          </label>
          <input
            type="checkbox"
            checked={settings.category}
            onChange={() => handleCheckboxChange('category')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* subcategory */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Subcategory :
          </label>
          <input
            type="checkbox"
            checked={settings.subcategory}
            onChange={() => handleCheckboxChange('subcategory')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Brand :
          </label>
          <input
            type="checkbox"
            checked={settings.brand}
            onChange={() => handleCheckboxChange('brand')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* description */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Description :
          </label>
          <input
            type="checkbox"
            checked={settings.description}
            onChange={() => handleCheckboxChange('description')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>
        {/* item serial no */}
        <div
  style={{
    display: "flex",
    alignItems: "center",
    marginBottom: 24,
    width: '100%'
  }}
>
  <label
    style={{
      fontSize: 14,
      color: "#3D3D3D",
      fontWeight: "400",
      width: '50%',
    }}
  >
    Serial No :
  </label>
  <input
    type="checkbox"
    checked={settings.serialno}
    onChange={() => handleCheckboxChange('serialno')}
    style={{
      width: 20,
      height: 20,
      accentColor: "#1F7FFF",
      cursor: "pointer",
    }}
  />
</div>

        {/* item barcode */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Item Barcode :
          </label>
          <input
            type="checkbox"
            checked={settings.itembarcode}
            onChange={() => handleCheckboxChange('itembarcode')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* hsn */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            HSN :
          </label>
          <input
            type="checkbox"
            checked={settings.hsn}
            onChange={() => handleCheckboxChange('hsn')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Unit */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Unit :
          </label>
          <input
            type="checkbox"
            checked={settings.units}
            onChange={() => handleCheckboxChange('units')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
        </div>

        {/* lot / Pricing heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            // justifyContent: "space-around",
            marginBottom: 24,
            // maxWidth: 610,
            width: '100%'
          }}
        >
          <label
            style={{
              fontSize: 14,
              color: "#3D3D3D",
              fontWeight: "400",
              width: '50%',
            }}
          >
            Lot / Pricing :
          </label>
          <input
            type="checkbox"
            checked={settings.lotno}
            onChange={() => handleCheckboxChange('lotno')}
            style={{
              width: 20,
              height: 20,
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
          <span>&nbsp;Lot</span>
          <input
            type="checkbox"
            checked={settings.pricing}
            onChange={() => handleCheckboxChange('pricing')}
            style={{
              width: 20,
              height: 20,
              marginLeft: '30px',
              accentColor: "#1F7FFF",
              cursor: "pointer",
            }}
          />
          <span>&nbsp;Pricing</span>
        </div>

        {/* Save Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 16,
            marginTop: 50,
            marginBottom: 20,
            marginRight: 10
          }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: "10px 32px",
              background: loading ? "#ccc" : "#1F7FFF",
              color: "white",
              fontSize: 14,
              fontWeight: "500",
              fontFamily: "'Inter', sans-serif",
              border: "none",
              borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "inset -1px -1px 4px rgba(0,0,0,0.25)",
              minHeight: 40,
              opacity: 1
            }}
          >
            {loading ? "Saving..." : "Save Setting"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default System_Setting;
