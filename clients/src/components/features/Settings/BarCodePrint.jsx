import React, { useState, useEffect } from "react";
import NormalPrint from "./../Settings/NormalPrint";
import ThermalPrint from "./../Settings/ThermalPrint";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const BarCodePrint = () => {
  const [activeTabs, setActiveTabs] = useState("barcode");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notesTermsSettings, setNotesTermsSettings] = useState({});

  // Barcode Settings State
  const [barcodeSettings, setBarcodeSettings] = useState({
    useSamePrefixForAll: false,
    definePerDocumentType: true,
    showBarcodeLabel: true,
    barcodeHeight: 16,
    barcodeFontSize: 16,
    documentTypes: []
  });

  // Print Template Settings
  const [normalTemplate, setNormalTemplate] = useState(null);
  const [thermalTemplate, setThermalTemplate] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [sampleProducts, setSampleProducts] = useState([]);
  const [sampleCustomer, setSampleCustomer] = useState(null);

  // Fetch barcode settings
  const fetchBarcodeSettings = async () => {
    try {
      const response = await api.get('/api/barcode-settings/with-company');

      if (response.data.success) {
        const { settings, company } = response.data.data;
        setBarcodeSettings({
          useSamePrefixForAll: settings.useSamePrefixForAll || false,
          definePerDocumentType: settings.definePerDocumentType || true,
          showBarcodeLabel: settings.showBarcodeLabel || true,
          barcodeHeight: settings.barcodeHeight || 16,
          barcodeFontSize: settings.barcodeFontSize || 16,
          documentTypes: settings.documentTypes || []
        });

        if (company) {
          setCompanyData(company);
        }
      }
    } catch (error) {
     toast.error(error?.response?.data?.displayMessage || 
              error?.response?.data?.message || 
              error?.message || 
              "Failed to load barcode settings");
      console.error('Error fetching barcode settings:', error);
      toast.error('Failed to load barcode settings');
    }
  };

  // Fetch print template settings
  // Fetch print template settings
  const fetchTemplateSettings = async (type) => {
    try {
      const response = await api.get(`/api/print-templates?type=${type}&includeData=true`);

      if (response.data.success) {
        const { template, company, sampleProducts, sampleCustomer } = response.data.data;

        if (type === 'normal') {
          setNormalTemplate(template);
        } else {
          setThermalTemplate(template);
        }

        // Set related data
        if (company) setCompanyData(company);
        if (sampleProducts) setSampleProducts(sampleProducts);
        if (sampleCustomer) setSampleCustomer(sampleCustomer);
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage || 
              error?.response?.data?.message || 
              error?.message || 
              `Failed to load ${type} print template`);
      console.error(`Error fetching ${type} template:`, error);
      toast.error(`Failed to load ${type} print template`);
    }
  };

  // Fetch all settings on component mount
  useEffect(() => {
    const fetchAllSettings = async () => {
      setIsLoading(true);
      try {
        // Fetch barcode settings
        await fetchBarcodeSettings();

        // Fetch print templates
        await fetchTemplateSettings('normal');
        await fetchTemplateSettings('thermal');
        await fetchNotesTermsSettings();
      } catch (error) {
          toast.error(error?.response?.data?.displayMessage ||
              error?.response?.data?.message || 
              error?.message || 
              "Failed to load print settings");
        console.error('Error fetching settings:', error);
        toast.error('Failed to load print settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllSettings();
  }, []);

  // Add this function after your other fetch functions:
  const fetchNotesTermsSettings = async () => {
    try {
      const response = await api.get('/api/notes-terms-settings');
      if (response.data.success) {
        setNotesTermsSettings(response.data.data || {});
      }
    } catch (error) {
        toast.error(error?.response?.data?.displayMessage ||
              error?.response?.data?.message || 
              error?.message || 
              "Failed to load notes & terms settings");
      console.error('Error fetching notes & terms settings:', error);
      // Leave as empty object - defaults will be used
      setNotesTermsSettings({});
    }
  };
  // Handle barcode settings changes
  const handleBarcodeSettingChange = (field, value) => {
    setBarcodeSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle document type changes
  const handleDocumentTypeChange = (index, field, value) => {
    const updatedDocumentTypes = [...barcodeSettings.documentTypes];
    updatedDocumentTypes[index] = {
      ...updatedDocumentTypes[index],
      [field]: value
    };

    // Update example if prefix or suffix changes
    if (field === 'prefix' || field === 'suffix') {
      const prefix = field === 'prefix' ? value : updatedDocumentTypes[index].prefix;
      const suffix = field === 'suffix' ? value : updatedDocumentTypes[index].suffix;
      updatedDocumentTypes[index].example = `${prefix}12${suffix}`;
    }

    // Update example if format changes
    if (field === 'format') {
      const suffix = updatedDocumentTypes[index].suffix;
      updatedDocumentTypes[index].example = `${value}12${suffix}`;
    }

    setBarcodeSettings(prev => ({
      ...prev,
      documentTypes: updatedDocumentTypes
    }));
  };

  // Save barcode settings
  const handleSaveBarcodeSettings = async () => {
    try {
      setIsSaving(true);

      // Prepare data for saving
      const saveData = {
        ...barcodeSettings,
        companyId: companyData?._id
      };

      const response = await api.put('/api/barcode-settings', saveData);

      if (response.data.success) {
        toast.success('Barcode settings saved successfully');
      }
    } catch (error) {
        toast.error(error?.response?.data?.displayMessage ||
              error?.response?.data?.message || 
              error?.message || 
              "Failed to save barcode settings");
      console.error('Error saving barcode settings:', error);
      toast.error('Failed to save barcode settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Save print template settings

  const handleSavePrintTemplate = async (type, templateData) => {
    try {
      setIsSaving(true);

      // Prepare the data in the format your backend expects
      const saveData = {
        templateType: type,
        selectedTemplate: templateData.selectedTemplate || 'template1',
        fieldVisibility: templateData.fieldVisibility || {},
        layoutConfig: templateData.layoutConfig || {},
        templateName: templateData.templateName || `${type === 'normal' ? 'Normal' : 'Thermal'} Template`,
        isDefault: templateData.isDefault || false,
        signatureUrl: templateData.signatureUrl || '', // ADD THIS LINE
        companyId: companyData?._id
      };

      // If there's company data in templateData, update it
      if (templateData.companyData) {
        try {
          await api.put('/api/companyprofile/update', templateData.companyData);
        } catch (companyError) {
          toast.error(companyError?.response?.data?.displayMessage ||
              companyError?.response?.data?.message || 
              companyError?.message || 
              "Failed to update company data");
          console.error('Error updating company data:', companyError);
          // We continue saving the template even if company data fails
        }
      }

      // Use template._id if it exists (for update), otherwise create new
      // Also use api.put for updates and api.post for creation if your backend follows that convention
      const isUpdate = !!templateData._id;
      const url = isUpdate
        ? `/api/print-templates/${templateData._id}`
        : '/api/print-templates';

      const response = isUpdate
        ? await api.put(url, saveData)
        : await api.post(url, saveData);

      if (response.data.success) {
        toast.success(`${type === 'normal' ? 'Normal' : 'Thermal'} print template saved`);

        // Update the template in state
        if (type === 'normal') {
          setNormalTemplate(response.data.data);
        } else {
          setThermalTemplate(response.data.data);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        `Failed to save ${type} template`);
      console.error(`Error saving ${type} template:`, error);
      toast.error(`Failed to save ${type} template`);
    } finally {
      setIsSaving(false);
    }
  };
  // Reset barcode settings to defaults
  const handleResetToDefaults = async () => {
    if (window.confirm('Are you sure you want to reset all barcode settings to defaults?')) {
      try {
        setIsSaving(true);
        const response = await api.post('/api/barcode-settings/reset');

        if (response.data.success) {
          toast.success('Barcode settings reset to defaults');
          // Refresh barcode settings
          await fetchBarcodeSettings();
        }
      } catch (error) {
        toast.error(error?.response?.data?.displayMessage ||
              error?.response?.data?.message || 
              error?.message || 
              "Failed to reset barcode settings");
        console.error('Error resetting barcode settings:', error);
        toast.error('Failed to reset barcode settings');
      } finally {
        setIsSaving(false);
      }
    }
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
        <span>Loading print settings...</span>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <div
        style={{
          borderRadius: "16px",
          fontFamily: "Inter, sans-serif",
          color: "#0E101A",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginBottom: "32px",
            overflowX: "auto"
          }}
        >
          <div
            style={{
              padding: "8px 0",
              borderBottom: activeTabs === "barcode" ? "2px solid #0E101A" : "none",
              color: activeTabs === "barcode" ? "#0E101A" : "#727681",
              fontWeight: activeTabs === "barcode" ? "600" : "500",
              fontSize: "16px",
              cursor: "pointer"
            }}
            onClick={() => setActiveTabs("barcode")}
          >
            Barcode
          </div>
          <div
            style={{
              borderBottom: activeTabs === "normal" ? "2px solid #0E101A" : "none",
              color: activeTabs === "normal" ? "#0E101A" : "#727681",
              fontWeight: activeTabs === "normal" ? "600" : "500",
              padding: "8px 0",
              fontSize: "16px",
              cursor: "pointer",
            }}
            onClick={() => setActiveTabs("normal")}
          >
            Normal Print
          </div>
          <div
            style={{
              borderBottom: activeTabs === "thermal" ? "2px solid #0E101A" : "none",
              color: activeTabs === "thermal" ? "#0E101A" : "#727681",
              fontWeight: activeTabs === "thermal" ? "600" : "500",
              padding: "8px 0",
              fontSize: "16px",
              cursor: "pointer",
            }}
            onClick={() => setActiveTabs("thermal")}
          >
            Thermal Print
          </div>
        </div>

        {activeTabs === "barcode" && (
          <>
            {/* Barcode Settings Container */}
            <div className="dashboard" style={{ height: "calc(100vh - 250px)", overflow: "auto" }}>
              {/* Radio Options */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  marginBottom: "32px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={barcodeSettings.useSamePrefixForAll}
                    onChange={(e) => handleBarcodeSettingChange('useSamePrefixForAll', e.target.checked)}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span style={{color:'black'}}>Use the same barcode prefix for all document types</span>
                </label>
              </div>

              {/* Document Type Table */}
              <div
                className="barcode-table"
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #EAEAEA",
                  borderRadius: "8px",
                  overflow: "hidden",
                  marginBottom: "32px",
                  padding: "8px 12px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    fontSize: "14px",
                    cursor: "pointer",
                    margin: "10px 0px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={barcodeSettings.definePerDocumentType}
                    onChange={(e) => handleBarcodeSettingChange('definePerDocumentType', e.target.checked)}
                    style={{ width: "16px", height: "16px", marginTop: "2px" }}
                  />
                  <span style={{color:'black'}}>Define per document type</span>
                </label>

                {/* Header */}
                <div
                  style={{
                    backgroundColor: "#F3F8FB",
                    padding: "12px 16px",
                    display: "grid",
                    gridTemplateColumns: "300px repeat(4, 1fr)",
                    gap: "16px",
                    fontSize: "14px",
                    color: "#A2A8B8",
                    fontWeight: "500",
                  }}
                >
                  <div>Document Type</div>
                  <div style={{ textAlign: "center" }}>Format</div>
                  <div style={{ textAlign: "center" }}>Prefix</div>
                  <div style={{ textAlign: "center" }}>Suffix</div>
                  <div style={{ textAlign: "center" }}>Example</div>
                </div>

                {/* Rows */}
                {barcodeSettings.documentTypes.map((doc, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 16px",
                      display: "grid",
                      gridTemplateColumns: "300px repeat(4, 1fr)",
                      gap: "16px",
                      alignItems: "center",
                      borderTop: idx === 0 ? "none" : "1px solid #FCFCFC",
                      backgroundColor: "#fff",
                    }}
                  >
                    <div style={{ fontSize: "14px", color: "#727681" }}>
                      {doc.documentType}
                    </div>

                    {/* Format */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <select
                        value={doc.format}
                        onChange={(e) => handleDocumentTypeChange(idx, 'format', e.target.value)}
                        style={{
                          width: "100px",
                          padding: "8px 12px",
                          border: "1px solid #A2A8B8",
                          borderRadius: "4px",
                          backgroundColor: "#fff",
                          fontSize: "14px",
                        }}
                      >
                        <option value="INV-">INV-</option>
                        <option value="PO-">PO-</option>
                        <option value="QT-">QT-</option>
                        <option value="DN-">DN-</option>
                        <option value="CN-">CN-</option>
                      </select>
                    </div>

                    {/* Prefix */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <input
                        type="text"
                        value={doc.prefix}
                        onChange={(e) => handleDocumentTypeChange(idx, 'prefix', e.target.value)}
                        style={{
                          width: "100px",
                          padding: "8px 12px",
                          border: "1px solid #A2A8B8",
                          borderRadius: "4px",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    {/* Suffix */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <input
                        type="text"
                        value={doc.suffix}
                        onChange={(e) => handleDocumentTypeChange(idx, 'suffix', e.target.value)}
                        style={{
                          width: "100px",
                          padding: "8px 12px",
                          border: "1px solid #A2A8B8",
                          borderRadius: "4px",
                          textAlign: "center",
                          fontSize: "14px",
                        }}
                      />
                    </div>

                    {/* Example (Read-only) */}
                    <div style={{ textAlign: "center" }}>
                      <input
                        type="text"
                        value={doc.example}
                        readOnly
                        style={{
                          width: "100px",
                          padding: "8px 12px",
                          border: "1px solid #A2A8B8",
                          borderRadius: "4px",
                          backgroundColor: "#f9f9f9",
                          textAlign: "center",
                          color: "#727681",
                          fontSize: "14px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ width: "800px" }}>
                {/* Display & Output Options */}
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "20px",
                  }}
                >
                  Display & Output Options
                </div>

                {/* Show Barcode Label */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#3D3D3D",
                      }}
                    >
                      Show Barcode Label :
                    </div>
                    <div
                      style={{ fontSize: "14px", color: "#727681", marginTop: "4px" }}
                    >
                      Option to show product name or price below barcode.
                    </div>
                  </div>
                  <label
                    style={{
                      width: "120px",
                      display: "flex",
                      alignItems: "center",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={barcodeSettings.showBarcodeLabel}
                      onChange={(e) => handleBarcodeSettingChange('showBarcodeLabel', e.target.checked)}
                      style={{
                        width: "20px",
                        height: "20px",
                        accentColor: "#1F7FFF",
                      }}
                    />
                  </label>
                </div>

                {/* Barcode Height */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#3D3D3D",
                      }}
                    >
                      Choose barcode height :
                    </div>
                    <div
                      style={{ fontSize: "14px", color: "#727681", marginTop: "4px" }}
                    >
                      Adjust the vertical size of the barcode.
                    </div>
                  </div>
                  <input
                    type="number"
                    value={barcodeSettings.barcodeHeight}
                    onChange={(e) => handleBarcodeSettingChange('barcodeHeight', parseInt(e.target.value))}
                    min="10"
                    max="100"
                    style={{
                      width: "120px",
                      padding: "10px 12px",
                      border: "1px solid #A2A8B8",
                      borderRadius: "8px",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  />
                </div>

                {/* Barcode Font Size */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "32px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#3D3D3D",
                      }}
                    >
                      Choose barcode font size :
                    </div>
                    <div
                      style={{ fontSize: "14px", color: "#727681", marginTop: "4px" }}
                    >
                      Adjust the size of the text displayed below the barcode.
                    </div>
                  </div>
                  <input
                    type="number"
                    value={barcodeSettings.barcodeFontSize}
                    onChange={(e) => handleBarcodeSettingChange('barcodeFontSize', parseInt(e.target.value))}
                    min="8"
                    max="72"
                    style={{
                      width: "120px",
                      padding: "10px 12px",
                      border: "1px solid #A2A8B8",
                      borderRadius: "8px",
                      fontSize: "14px",
                      textAlign: "center",
                    }}
                  />
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="settingbarcode-btn d-flex justify-content-end gap-2">
                <button
                  onClick={handleResetToDefaults}
                  className="button-hover"
                  disabled={isSaving}
                  style={{
                    width: "150px",
                    height: "36px",
                    padding: 8,
                    background: "#FFFFFF",
                    border: "1px solid #E6E6E6",
                    borderRadius: 8,
                    color: "#676767",
                    fontSize: 14,
                    fontFamily: "Inter",
                    fontWeight: "500",
                    lineHeight: 16.8,
                    wordWrap: "break-word",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  Reset to Defaults
                </button>

                <button
                  onClick={handleSaveBarcodeSettings}
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
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isSaving ? "not-allowed" : "pointer"
                  }}
                >
                  {isSaving ? "Saving..." : "Save Setting"}
                </button>
              </div>
            </div>
          </>
        )}

        {activeTabs === "normal" && normalTemplate && (
          <NormalPrint
            template={normalTemplate}
            companyData={companyData}
            products={sampleProducts}
            customer={sampleCustomer}
            onSave={(updatedTemplate) => handleSavePrintTemplate('normal', updatedTemplate)}
            isSaving={isSaving}
            notesTermsSettings={notesTermsSettings}
          />
        )}

        {activeTabs === "thermal" && thermalTemplate && (
          <ThermalPrint
            template={thermalTemplate}
            companyData={companyData}
            products={sampleProducts}
            customer={sampleCustomer}
            onSave={(updatedTemplate) => handleSavePrintTemplate('thermal', updatedTemplate)}
            isSaving={isSaving}
            notesTermsSettings={notesTermsSettings}
          />
        )}
      </div>
    </div>
  );
};

export default BarCodePrint;
