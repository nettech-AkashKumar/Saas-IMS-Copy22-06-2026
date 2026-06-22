import React, { useState, useEffect, useMemo } from "react";
import { RxCross2 } from "react-icons/rx";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import {
  validateLRNumber,
  validateRRNumber,
  validateWagonNumber,
  validateTrainNumber,
} from "../../../utils/transportValidation.js";

const InvoiceAssignTransportModal = ({
  show,
  closeModal,
  invoice,
  onSuccess,
}) => {
  const [transportMode, setTransportMode] = useState("roadways");
  const [subMode, setSubMode] = useState("");
  
  // LR (Truck) fields
  const [transporter, setTransporter] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [driver, setDriver] = useState("");
  const [lrNo, setLrNo] = useState("");
  
  // RR (Train within roadways) fields - REMOVED (not used in new UI)
  // Railways (simple) fields
  const [railwayWagonNo, setRailwayWagonNo] = useState("");
  const [railwayTrainNo, setRailwayTrainNo] = useState("");
  const [rrbNo, setRrbNo] = useState("");
  
  // Charges
  const [freightCharge, setFreightCharge] = useState("");
  const [otherCharges, setOtherCharges] = useState("");
  
  // Validation errors
  const [lrError, setLrError] = useState("");
  const [rrError, setRrError] = useState("");
  const [wagonError, setWagonError] = useState("");
  const [trainError, setTrainError] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [transporterOptions, setTransporterOptions] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [driverOptions, setDriverOptions] = useState([]);

  // Fetch transport options when modal opens
  useEffect(() => {
    if (show) {
      fetchTransportData();
      // Pre-fill existing values if invoice has them
      if (invoice) {
        // Set transport mode
        setTransportMode(invoice.transportMode || "roadways");
        
        // Auto-set subMode based on transport mode
        if (invoice.transportMode === "roadways") {
          setSubMode("LR");
        } else if (invoice.transportMode === "railways") {
          setSubMode("RR");
        }
        
        // Set LR fields
        setTransporter(invoice.transporterId?._id || invoice.transporterId || "");
        setVehicle(invoice.vehicleId?._id || invoice.vehicleId || "");
        setDriver(invoice.driverId?._id || invoice.driverId || "");
        setLrNo(invoice.lrNo || "");
        
        // Set Railways simple fields
        setRailwayWagonNo(invoice.railwayWagonNo || "");
        setRailwayTrainNo(invoice.railwayTrainNo || "");
        setRrbNo(invoice.rrbNo || "");
        
        // Set charges
        setFreightCharge(invoice.freightCharge?.toString() || "");
        setOtherCharges(invoice.otherCharges?.toString() || "");
      }
    }
  }, [show, invoice]);

  const fetchTransportData = async () => {
    try {
      const [transportersRes, vehiclesRes, driversRes] = await Promise.all([
        api.get("/api/transporter/get"),
        api.get("/api/vehicle/get"),
        api.get("/api/driver/get")
      ]);
      setTransporterOptions(transportersRes.data.transporters || []);
      setVehicleOptions(vehiclesRes.data.vehicle || []);
      setDriverOptions(driversRes.data.driver || []);
    } catch (error) {
      console.error("Error fetching transport data:", error);
      toast.error("Failed to load transport data");
    }
  };

  // Validation handlers
  const handleLrNoChange = (value) => {
    setLrNo(value);
    const validation = validateLRNumber(value);
    setLrError(validation.error);
  };

  const handleRrbNoChange = (value) => {
    setRrbNo(value);
    const validation = validateRRNumber(value);
    setRrError(validation.error);
  };

  const handleWagonNoChange = (value) => {
    setRailwayWagonNo(value);
    const validation = validateWagonNumber(value);
    setWagonError(validation.error);
  };

  const handleTrainNoChange = (value) => {
    setRailwayTrainNo(value);
    const validation = validateTrainNumber(value);
    setTrainError(validation.error);
  };

  // Filter vehicles based on selected transporter's assignVehicleID array
  const filteredVehicleOptions = useMemo(() => {
    if (!transporter) return [];
    
    const selectedTransporter = transporterOptions.find(t => t._id === transporter);
    if (!selectedTransporter?.assignVehicleID) return [];
    
    const assignedVehicleIds = selectedTransporter.assignVehicleID.map(v => v._id || v);
    return vehicleOptions.filter(vehicle => assignedVehicleIds.includes(vehicle._id));
  }, [transporter, transporterOptions, vehicleOptions]);

  // Filter drivers based on selected transporter
  const filteredDriverOptions = useMemo(() => {
    if (!transporter) return [];
    
    const selectedTransporter = transporterOptions.find(t => t._id === transporter);
    if (!selectedTransporter?.assignDriverID) return [];
    
    const assignedDriverIds = selectedTransporter.assignDriverID.map(d => d._id || d);
    return driverOptions.filter(driver => assignedDriverIds.includes(driver._id));
  }, [transporter, transporterOptions, driverOptions]);

  useEffect(() => {
    setVehicle("");
    setDriver("");
  }, [transporter]);

  useEffect(() => {
    if (invoice && transporter) {
      // Set vehicle if exists in invoice
      if (invoice.vehicleId && !vehicle) {
        const vehicleId = invoice.vehicleId?._id || invoice.vehicleId;
        const vehicleExists = filteredVehicleOptions.some(v => v._id === vehicleId);
        if (vehicleExists) {
          setVehicle(vehicleId);
        }
      }
      
      // Set driver if exists in invoice
      if (invoice.driverId && !driver) {
        const driverId = invoice.driverId?._id || invoice.driverId;
        const driverExists = filteredDriverOptions.some(d => d._id === driverId);
        if (driverExists) {
          setDriver(driverId);
        }
      }
    }
  }, [transporter, filteredVehicleOptions, filteredDriverOptions, invoice]);

  const handleAssign = async () => {
    if (!invoice || !invoice._id) {
      toast.error("No invoice selected");
      return;
    }
    
    // Validate based on transport mode
    if (transportMode === "roadways") {
      if (lrNo && lrError) {
        toast.error(`Invalid LR Number format: ${lrError}`);
        return;
      }
      if (!transporter) {
        toast.error("Please select a transporter for LR");
        return;
      }
    }

    if (transportMode === "railways") {
      if (rrbNo && rrError) {
        toast.error(`Invalid RR Number format: ${rrError}`);
        return;
      }
      if (railwayWagonNo && wagonError) {
        toast.error(`Invalid Wagon Number format: ${wagonError}`);
        return;
      }
      if (railwayTrainNo && trainError) {
        toast.error(`Invalid Train Number format: ${trainError}`);
        return;
      }
    }
    
    setLoading(true);
    try {
      const payload = {
        transportMode: transportMode,
        subMode: transportMode === "roadways" ? "LR" : (transportMode === "railways" ? "RR" : null),
        
        // LR fields (for roadways)
        transporterId: transportMode === "roadways" ? (transporter || null) : null,
        vehicleId: transportMode === "roadways" ? (vehicle || null) : null,
        driverId: transportMode === "roadways" ? (driver || null) : null,
        lrNo: transportMode === "roadways" ? (lrNo || null) : null,
        
        // Railways fields
        railwayWagonNo: transportMode === "railways" ? (railwayWagonNo || null) : null,
        railwayTrainNo: transportMode === "railways" ? (railwayTrainNo || null) : null,
        rrbNo: transportMode === "railways" ? (rrbNo || null) : null,
        
        // Charges
        freightCharge: parseFloat(freightCharge) || 0,
        otherCharges: parseFloat(otherCharges) || 0,
      };
      
      const response = await api.put(`/api/invoices/${invoice._id}/transport`, payload);

      if (response.data.success) {
        toast.success("Transport assigned successfully!");
        if (onSuccess) onSuccess();
        closeModal();
        resetForm();
      }
    } catch (error) {
      console.error("Assign transport error:", error);
      toast.error(error?.response?.data?.message || "Failed to assign transport");
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setTransportMode("roadways");
    setSubMode("LR");
    setTransporter("");
    setVehicle("");
    setDriver("");
    setLrNo("");
    setRailwayWagonNo("");
    setRailwayTrainNo("");
    setRrbNo("");
    setFreightCharge("");
    setOtherCharges("");
    setLrError("");
    setRrError("");
    setWagonError("");
    setTrainError("");
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.27)",
        backdropFilter: "blur(1px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 99999999,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          width: "820px",
          padding: "30px 40px",
          borderRadius: "8px",
        }}
      >
        {/* Close Button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
          }}
        >
          <button
            type="button"
            onClick={closeModal}
            style={{
              color: "#727681",
              fontSize: "10px",
              fontWeight: 800,
              border: "2px solid #727681",
              borderRadius: "50%",
              backgroundColor: "transparent",
              width: "30px",
              height: "30px",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <RxCross2
              style={{
                color: "#727681",
                fontSize: "15px",
                fontWeight: 900,
              }}
            />
          </button>
        </div>

        {/* Heading */}
        <h5
          style={{
            color: "#0E101A",
            fontWeight: 500,
            fontSize: "32px",
            fontFamily: '"Inter", sans-serif',
            marginBottom: "24px",
          }}
        >
          Assign Transport
        </h5>

        {/* Invoice Info */}
        {invoice && (
          <div
            style={{
              marginBottom: "20px",
              padding: "10px",
              backgroundColor: "#f5f5f5",
              borderRadius: "8px",
            }}
          >
            <p style={{ margin: 0 }}>
              <strong>Invoice No:</strong> {invoice.invoiceNo}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Customer:</strong> {invoice.customerId?.name || "N/A"}
            </p>
          </div>
        )}

        {/* Transport Section - Updated UI */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "40px" }}>
          {/* Transport Mode Selection */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ color: "#727681" }}>Transport Mode</label>
            <select
              value={transportMode}
              onChange={(e) => {
                const newMode = e.target.value;
                setTransportMode(newMode);
                // AUTO-SELECT SUB-MODE BASED ON TRANSPORT MODE
                if (newMode === "roadways") {
                  setSubMode("LR");
                } else if (newMode === "railways") {
                  setSubMode("RR");
                } else {
                  setSubMode("");
                }
              }}
              style={{ width: "200px", height: "30px", border: "1px solid #A2A8B8", padding: "4px 12px", borderRadius: "8px", outline: "none" }}
            >
              <option value="" hidden>Select Transport Mode</option>
              <option value="roadways">🚛 Roadways (LR - Truck)</option>
              <option value="railways">🚆 Railways (RR - Train)</option>
            </select>
          </div>

          {/* Roadways - LR (Truck Transport) */}
          {transportMode === "roadways" && (
            <>
              {/* Hidden sub-mode indicator - just for display */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", color: "#727681" }}>Transport Type</label>
                <div style={{
                  padding: "4px 12px",
                  borderRadius: "8px",
                  border: "1px solid #A2A8B8",
                  width: "200px",
                  background: "#f5f5f5",
                  fontSize: "14px",
                  color: "#333"
                }}>
                  LR - Truck Transport
                </div>
              </div>

              {/* LR Number for Truck Transport */}
              <div>
                <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                  LR Number 
                  <span style={{ fontSize: "10px", color: "#6B7280" }}>(Format: LR/STATION/YYYY/XXXXXX)</span>
                </label>
                <input
                  type="text"
                  value={lrNo}
                  onChange={(e) => handleLrNoChange(e.target.value)}
                  placeholder="Enter LR Number"
                  style={{
                    border: `1px solid ${lrError ? '#ef4444' : '#D0D5DD'}`,
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    outline: "none",
                    fontSize: "14px",
                    color: "#667085"
                  }}
                />
                {lrError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{lrError}</div>}
              </div>

              {/* Select Transporter */}
              <div>
                <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Transporter</label>
                <select value={transporter} onChange={(e) => setTransporter(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }}>
                  <option value="">Select Transporter</option>
                  {transporterOptions.map((t) => (<option key={t._id} value={t._id}>{t.transporterName}</option>))}
                </select>
              </div>

              <div>
                <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Vehicle</label>
                <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }} disabled={!transporter || filteredVehicleOptions.length === 0}>
                  <option value="">Select Vehicle</option>
                  {filteredVehicleOptions.map((v) => (<option key={v._id} value={v._id}>{v.vehicleNumber} {v.vehicleType ? `(${v.vehicleType})` : ""}</option>))}
                </select>
                {transporter && filteredVehicleOptions.length === 0 && (<div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>No vehicles found for this transporter</div>)}
              </div>

              <div>
                <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Driver</label>
                <select value={driver} onChange={(e) => setDriver(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }} disabled={!transporter || filteredDriverOptions.length === 0}>
                  <option value="">Select Driver</option>
                  {filteredDriverOptions.map((d) => (<option key={d._id} value={d._id}>{d.driverName} {d.phoneNumber ? `(${d.phoneNumber})` : ""}</option>))}
                </select>
                {transporter && filteredDriverOptions.length === 0 && (<div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>No drivers found for this transporter</div>)}
              </div>
            </>
          )}

          {/* Railways - RR (Train Transport) */}
          {transportMode === "railways" && (
            <>
              {/* Hidden sub-mode indicator */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "12px", color: "#727681" }}>Transport Type</label>
                <div style={{
                  padding: "4px 12px",
                  borderRadius: "8px",
                  border: "1px solid #A2A8B8",
                  width: "200px",
                  background: "#f5f5f5",
                  fontSize: "14px",
                  color: "#333"
                }}>
                  RR - Train Transport
                </div>
              </div>
              
              <div style={{ flex: 1, minWidth: "180px" }}>
                <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                  RR Number
                  <span style={{ fontSize: "10px", color: "#6B7280" }}>(Format: PXYZ2024-123456)</span>
                </label>
                <input
                  type="text"
                  value={rrbNo}
                  onChange={(e) => handleRrbNoChange(e.target.value)}
                  placeholder="Enter RR Number"
                  style={{
                    border: `1px solid ${rrError ? '#ef4444' : '#D0D5DD'}`,
                    borderRadius: "8px",
                    padding: "10px 12px",
                    width: "100%",
                    outline: "none",
                    fontSize: "14px",
                    color: "#667085"
                  }}
                />
                {rrError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{rrError}</div>}
              </div>

              {/* Railways Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", gridColumn: "span 2" }}>
                <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                      Train No.
                    </label>
                    <input
                      type="text"
                      value={railwayTrainNo}
                      onChange={(e) => {
                        setRailwayTrainNo(e.target.value);
                        const validation = validateTrainNumber(e.target.value);
                        setTrainError(validation.error);
                      }}
                      placeholder="Enter Train No."
                      style={{
                        border: `1px solid ${trainError ? '#ef4444' : '#D0D5DD'}`,
                        borderRadius: "8px",
                        padding: "10px 12px",
                        width: "100%",
                        outline: "none",
                        fontSize: "14px",
                        color: "#667085"
                      }}
                    />
                    {trainError && (
                      <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>
                        {trainError}
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                      Wagon No.
                    </label>
                    <input
                      type="text"
                      value={railwayWagonNo}
                      onChange={(e) => {
                        setRailwayWagonNo(e.target.value);
                        const validation = validateWagonNumber(e.target.value);
                        setWagonError(validation.error);
                      }}
                      placeholder="Enter Wagon No. (Optional)"
                      style={{
                        border: `1px solid ${wagonError ? '#ef4444' : '#D0D5DD'}`,
                        borderRadius: "8px",
                        padding: "10px 12px",
                        width: "100%",
                        outline: "none",
                        fontSize: "14px",
                        color: "#667085"
                      }}
                    />
                    {wagonError && (
                      <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>
                        {wagonError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button
            onClick={closeModal}
            style={{
              backgroundColor: "transparent",
              border: "1px solid #D0D5DD",
              color: "#667085",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            style={{
              backgroundColor: "#1F7FFF",
              border: "none",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Assigning..." : "Assign Transport"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceAssignTransportModal;
// import React, { useState, useEffect, useMemo } from "react";
// import { RxCross2 } from "react-icons/rx";
// import api from "../../../pages/config/axiosInstance";
// import { toast } from "react-toastify";
// import {
//   validateLRNumber,
//   validateRRNumber,
//   validateWagonNumber,
//   validateTrainNumber,
// } from "../../../utils/transportValidation.js";

// const InvoiceAssignTransportModal = ({
//   show,
//   closeModal,
//   invoice,
//   onSuccess,
// }) => {
//    const [transportMode, setTransportMode] = useState("roadways");
//   const [subMode, setSubMode] = useState("");
  
//   // LR (Truck) fields
//   const [transporter, setTransporter] = useState("");
//   const [vehicle, setVehicle] = useState("");
//   const [driver, setDriver] = useState("");
//   const [lrNo, setLrNo] = useState("");
  
//   // RR (Train within roadways) fields
//   const [wagonNo, setWagonNo] = useState("");
//   const [trainNo, setTrainNo] = useState("");
//   const [railwayReceiptNo, setRailwayReceiptNo] = useState("");
  
//   // Railways (simple) fields
//   const [railwayWagonNo, setRailwayWagonNo] = useState("");
//   const [railwayTrainNo, setRailwayTrainNo] = useState("");
//   const [rrbNo, setRrbNo] = useState("");
  
//   // Charges
//   const [freightCharge, setFreightCharge] = useState("");
//   const [otherCharges, setOtherCharges] = useState("");
  
//   // Validation errors
//   const [lrError, setLrError] = useState("");
//   const [rrError, setRrError] = useState("");
//   const [wagonError, setWagonError] = useState("");
//   const [trainError, setTrainError] = useState("");
//   const [railwayReceiptError, setRailwayReceiptError] = useState("");
  
//   const [loading, setLoading] = useState(false);
//   const [transporterOptions, setTransporterOptions] = useState([]);
//   const [vehicleOptions, setVehicleOptions] = useState([]);
//   const [driverOptions, setDriverOptions] = useState([]);


//   // Fetch transport options when modal opens
//   useEffect(() => {
//     if (show) {
//       fetchTransportData();
//       // Pre-fill existing values if invoice has them
//       if (invoice) {
//         // Set transport mode
//         setTransportMode(invoice.transportMode || "roadways");
//         setSubMode(invoice.subMode || "");
        
//         // Set LR fields
//         setTransporter(invoice.transporterId?._id || invoice.transporterId || "");
//         setVehicle(invoice.vehicleId?._id || invoice.vehicleId || "");
//         setDriver(invoice.driverId?._id || invoice.driverId || "");
//         setLrNo(invoice.lrNo || "");
        
//         // Set RR fields (within roadways)
//         setWagonNo(invoice.wagonNo || "");
//         setTrainNo(invoice.trainNo || "");
//         setRailwayReceiptNo(invoice.railwayReceiptNo || "");
        
//         // Set Railways simple fields
//         setRailwayWagonNo(invoice.railwayWagonNo || "");
//         setRailwayTrainNo(invoice.railwayTrainNo || "");
//         setRrbNo(invoice.rrbNo || "");
        
//         // Set charges
//         setFreightCharge(invoice.freightCharge?.toString() || "");
//         setOtherCharges(invoice.otherCharges?.toString() || "");
//       }
//     }
//   }, [show, invoice]);


//   const fetchTransportData = async () => {
//     try {
//       const [transportersRes, vehiclesRes, driversRes] = await Promise.all([
//         api.get("/api/transporter/get"),
//         api.get("/api/vehicle/get"),
//         api.get("/api/driver/get")
//       ]);
//       setTransporterOptions(transportersRes.data.transporters || []);
//       setVehicleOptions(vehiclesRes.data.vehicle || []);
//       setDriverOptions(driversRes.data.driver || []);
//     } catch (error) {
//       console.error("Error fetching transport data:", error);
//       toast.error("Failed to load transport data");
//     }
//   };

//    // Validation handlers
//   const handleLrNoChange = (value) => {
//     setLrNo(value);
//     const validation = validateLRNumber(value);
//     setLrError(validation.error);
//   };

//   const handleRailwayReceiptNoChange = (value) => {
//     setRailwayReceiptNo(value);
//     const validation = validateRRNumber(value);
//     setRailwayReceiptError(validation.error);
//   };

//   const handleWagonNoChange = (value, type = "roadways") => {
//     if (type === "roadways") {
//       setWagonNo(value);
//       const validation = validateWagonNumber(value);
//       setWagonError(validation.error);
//     } else {
//       setRailwayWagonNo(value);
//       const validation = validateWagonNumber(value);
//       setWagonError(validation.error);
//     }
//   };

//   const handleTrainNoChange = (value, type = "roadways") => {
//     if (type === "roadways") {
//       setTrainNo(value);
//       const validation = validateTrainNumber(value);
//       setTrainError(validation.error);
//     } else {
//       setRailwayTrainNo(value);
//       const validation = validateTrainNumber(value);
//       setTrainError(validation.error);
//     }
//   };

//   const handleRrbNoChange = (value) => {
//     setRrbNo(value);
//     const validation = validateRRNumber(value);
//     setRrError(validation.error);
//   };


//   // Filter vehicles based on selected transporter's assignVehicleID array
//   const filteredVehicleOptions = useMemo(() => {
//     if (!transporter) return [];
    
//  const selectedTransporter = transporterOptions.find(t => t._id === transporter);
//     if (!selectedTransporter?.assignVehicleID) return [];
    
//     const assignedVehicleIds = selectedTransporter.assignVehicleID.map(v => v._id || v);
//     return vehicleOptions.filter(vehicle => assignedVehicleIds.includes(vehicle._id));
//   }, [transporter, transporterOptions, vehicleOptions]);

//  // Filter drivers based on selected transporter
//   const filteredDriverOptions = useMemo(() => {
//     if (!transporter) return [];
    
//     const selectedTransporter = transporterOptions.find(t => t._id === transporter);
//     if (!selectedTransporter?.assignDriverID) return [];
    
//     const assignedDriverIds = selectedTransporter.assignDriverID.map(d => d._id || d);
//     return driverOptions.filter(driver => assignedDriverIds.includes(driver._id));
//   }, [transporter, transporterOptions, driverOptions]);

//    useEffect(() => {
//     setVehicle("");
//     setDriver("");
//   }, [transporter]);

//   useEffect(() => {
//   if (invoice && transporter) {
//     // Set vehicle if exists in invoice
//     if (invoice.vehicleId && !vehicle) {
//       const vehicleId = invoice.vehicleId?._id || invoice.vehicleId;
//       const vehicleExists = filteredVehicleOptions.some(v => v._id === vehicleId);
//       if (vehicleExists) {
//         setVehicle(vehicleId);
//       }
//     }
    
//     // Set driver if exists in invoice
//     if (invoice.driverId && !driver) {
//       const driverId = invoice.driverId?._id || invoice.driverId;
//       const driverExists = filteredDriverOptions.some(d => d._id === driverId);
//       if (driverExists) {
//         setDriver(driverId);
//       }
//     }
//   }
// }, [transporter, filteredVehicleOptions, filteredDriverOptions, invoice]);


//   const handleAssign = async () => {
//     if (!invoice || !invoice._id) {
//       toast.error("No invoice selected");
//       return;
//     }
//     // Validate based on transport mode
//     if (transportMode === "roadways" && subMode === "LR") {
//       if (lrNo && lrError) {
//         toast.error(`Invalid LR Number format: ${lrError}`);
//         return;
//       }
//       if (!transporter) {
//         toast.error("Please select a transporter for LR");
//         return;
//       }
//     }

//     if (transportMode === "roadways" && subMode === "RR") {
//       if (railwayReceiptNo && railwayReceiptError) {
//         toast.error(`Invalid Railway Receipt Number format: ${railwayReceiptError}`);
//         return;
//       }
//     }

//     if (transportMode === "railways") {
//       if (rrbNo && rrError) {
//         toast.error(`Invalid RR Number format: ${rrError}`);
//         return;
//       }
//       if (railwayWagonNo && wagonError) {
//         toast.error(`Invalid Wagon Number format: ${wagonError}`);
//         return;
//       }
//       if (railwayTrainNo && trainError) {
//         toast.error(`Invalid Train Number format: ${trainError}`);
//         return;
//       }
//     }
//     setLoading(true);
//       try {
//       const payload = {
//         // Transport mode
//         transportMode: transportMode,
//         subMode: subMode || null,
        
//         // LR fields
//         transporterId: (transportMode === "roadways" && subMode === "LR") ? (transporter || null) : null,
//         vehicleId: (transportMode === "roadways" && subMode === "LR") ? (vehicle || null) : null,
//         driverId: (transportMode === "roadways" && subMode === "LR") ? (driver || null) : null,
//         lrNo: (transportMode === "roadways" && subMode === "LR") ? (lrNo || null) : null,
        
//         // RR fields (within roadways)
//         wagonNo: (transportMode === "roadways" && subMode === "RR") ? (wagonNo || null) : null,
//         trainNo: (transportMode === "roadways" && subMode === "RR") ? (trainNo || null) : null,
//         railwayReceiptNo: (transportMode === "roadways" && subMode === "RR") ? (railwayReceiptNo || null) : null,
        
//         // Railways simple fields
//         railwayWagonNo: transportMode === "railways" ? (railwayWagonNo || null) : null,
//         railwayTrainNo: transportMode === "railways" ? (railwayTrainNo || null) : null,
//         rrbNo: transportMode === "railways" ? (rrbNo || null) : null,
        
//         // Charges
//         freightCharge: parseFloat(freightCharge) || 0,
//         otherCharges: parseFloat(otherCharges) || 0,
//       };
//       const response = await api.put(`/api/invoices/${invoice._id}/transport`, payload);

//       if (response.data.success) {
//         toast.success("Transport assigned successfully!");
//         if (onSuccess) onSuccess();
//         closeModal();
//        resetForm();
//       }
//     } catch (error) {
//       console.error("Assign transport error:", error);
//       toast.error(error?.response?.data?.message || "Failed to assign transport");
//     } finally {
//       setLoading(false);
//     }
//   };
//    const resetForm = () => {
//     setTransportMode("roadways");
//     setSubMode("");
//     setTransporter("");
//     setVehicle("");
//     setDriver("");
//     setLrNo("");
//     setWagonNo("");
//     setTrainNo("");
//     setRailwayReceiptNo("");
//     setRailwayWagonNo("");
//     setRailwayTrainNo("");
//     setRrbNo("");
//     setFreightCharge("");
//     setOtherCharges("");
//     setLrError("");
//     setRrError("");
//     setWagonError("");
//     setTrainError("");
//     setRailwayReceiptError("");
//   };

//   if (!show) return null;

//   return (
//     <div
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         width: "100vw",
//         height: "100vh",
//         backgroundColor: "rgba(0,0,0,0.27)",
//         backdropFilter: "blur(1px)",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         zIndex: 99999999,
//       }}
//     >
//       <div
//         style={{
//           backgroundColor: "white",
//           width: "820px",
//           padding: "30px 40px",
//           borderRadius: "8px",
//         }}
//       >
//         {/* Close Button */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "flex-end",
//             marginBottom: "10px",
//           }}
//         >
//           <button
//             type="button"
//             onClick={closeModal}
//             style={{
//               color: "#727681",
//               fontSize: "10px",
//               fontWeight: 800,
//               border: "2px solid #727681",
//               borderRadius: "50%",
//               backgroundColor: "transparent",
//               width: "30px",
//               height: "30px",
//               cursor: "pointer",
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//             }}
//           >
//             <RxCross2
//               style={{
//                 color: "#727681",
//                 fontSize: "15px",
//                 fontWeight: 900,
//               }}
//             />
//           </button>
//         </div>

//         {/* Heading */}
//         <h5
//           style={{
//             color: "#0E101A",
//             fontWeight: 500,
//             fontSize: "32px",
//             fontFamily: '"Inter", sans-serif',
//             marginBottom: "24px",
//           }}
//         >
//           Assign Transport
//         </h5>

//         {/* Invoice Info */}
//         {invoice && (
//           <div
//             style={{
//               marginBottom: "20px",
//               padding: "10px",
//               backgroundColor: "#f5f5f5",
//               borderRadius: "8px",
//             }}
//           >
//             <p style={{ margin: 0 }}>
//               <strong>Invoice No:</strong> {invoice.invoiceNo}
//             </p>
//             <p style={{ margin: 0 }}>
//               <strong>Customer:</strong> {invoice.customerId?.name || "N/A"}
//             </p>
//           </div>
//         )}

// {/* Transport Section - Only ONE UI */}
//         <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "40px" }}>
//           {/* Transport Mode Selection */}
//           <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
//             <label style={{ color: "#727681" }}>Transport Mode <span className="text-danger">*</span></label>
//             <select
//               value={transportMode}
//               onChange={(e) => { setTransportMode(e.target.value); setSubMode(""); }}
//               style={{ width: "200px", height: "30px", border: "1px solid #A2A8B8", padding: "4px 12px", borderRadius: "8px", outline: "none" }}
//             >
//               <option value="" hidden>Select Transport Mode</option>
//               <option value="roadways">🚛 Roadways (LR/RR)</option>
//               <option value="railways">🚆 Railways</option>
//             </select>
//           </div>

//           {/* Roadways Sub-mode */}
//           {transportMode === "roadways" && (
//             <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
//               <label style={{ fontSize: "12px", color: "#727681" }}>Transport Type</label>
//               <select value={subMode} onChange={(e) => setSubMode(e.target.value)} style={{ padding: "4px 12px", borderRadius: "8px", border: "1px solid #A2A8B8", width: "200px" }}>
//                 <option value="">Select Type</option>
//                 <option value="LR">LR - Truck Transport</option>
//                 <option value="RR">RR - Train Transport</option>
//               </select>
//             </div>
//           )}

//           {/* ========== LR (Truck) FIELDS ========== */}
//           {transportMode === "roadways" && subMode === "LR" && (
//             <>
//               <div>
//                 <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
//                   LR Number <span style={{ fontSize: "10px", color: "#6B7280" }}>(Format: LR/STATION/YYYY/XXXXXX)</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={lrNo}
//                   onChange={(e) => handleLrNoChange(e.target.value)}
//                   placeholder="Enter LR Number"
//                   style={{
//                     border: `1px solid ${lrError ? '#ef4444' : '#D0D5DD'}`,
//                     borderRadius: "8px",
//                     padding: "10px 12px",
//                     width: "100%",
//                     outline: "none",
//                     fontSize: "14px",
//                     color: "#667085"
//                   }}
//                 />
//                 {lrError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{lrError}</div>}
//               </div>

//               <div>
//                 <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Transporter</label>
//                 <select value={transporter} onChange={(e) => setTransporter(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }}>
//                   <option value="">Select Transporter</option>
//                   {transporterOptions.map((t) => (<option key={t._id} value={t._id}>{t.transporterName}</option>))}
//                 </select>
//               </div>

//               <div>
//                 <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Vehicle</label>
//                 <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }} disabled={!transporter || filteredVehicleOptions.length === 0}>
//                   <option value="">Select Vehicle</option>
//                   {filteredVehicleOptions.map((v) => (<option key={v._id} value={v._id}>{v.vehicleNumber} {v.vehicleType ? `(${v.vehicleType})` : ""}</option>))}
//                 </select>
//                 {transporter && filteredVehicleOptions.length === 0 && (<div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>No vehicles found for this transporter</div>)}
//               </div>

//               <div>
//                 <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Select Driver</label>
//                 <select value={driver} onChange={(e) => setDriver(e.target.value)} style={{ border: "1px solid #D0D5DD", backgroundColor: "#ffffff", borderRadius: "8px", padding: "10px 12px", width: "100%", outline: "none", fontSize: "14px", color: "#667085" }} disabled={!transporter || filteredDriverOptions.length === 0}>
//                   <option value="">Select Driver</option>
//                   {filteredDriverOptions.map((d) => (<option key={d._id} value={d._id}>{d.driverName} {d.phoneNumber ? `(${d.phoneNumber})` : ""}</option>))}
//                 </select>
//                 {transporter && filteredDriverOptions.length === 0 && (<div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>No drivers found for this transporter</div>)}
//               </div>
//             </>
//           )}

//           {/* ========== RR (Train within Roadways) FIELDS ========== */}
//           {transportMode === "roadways" && subMode === "RR" && (
//             <>
//               <div>
//                 <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
//                   Railway Receipt No. <span style={{ fontSize: "10px", color: "#6B7280" }}>(Format: PXYZ2024-123456)</span>
//                 </label>
//                 <input
//                   type="text"
//                   value={railwayReceiptNo}
//                   onChange={(e) => handleRailwayReceiptNoChange(e.target.value)}
//                   placeholder="Enter Railway Receipt No."
//                   style={{
//                     border: `1px solid ${railwayReceiptError ? '#ef4444' : '#D0D5DD'}`,
//                     borderRadius: "8px",
//                     padding: "10px 12px",
//                     width: "100%",
//                     outline: "none",
//                     fontSize: "14px"
//                   }}
//                 />
//                 {railwayReceiptError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{railwayReceiptError}</div>}
//               </div>
//               <div>
//                 <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Train No.</label>
//                 <input
//                   type="text"
//                   value={trainNo}
//                   onChange={(e) => handleTrainNoChange(e.target.value)}
//                   placeholder="Enter Train No."
//                   style={{
//                     border: `1px solid ${trainError ? '#ef4444' : '#D0D5DD'}`,
//                     borderRadius: "8px",
//                     padding: "10px 12px",
//                     width: "100%",
//                     outline: "none",
//                     fontSize: "14px"
//                   }}
//                 />
//                 {trainError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{trainError}</div>}
//               </div>
//               <div>
//                 <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Wagon No.</label>
//                 <input
//                   type="text"
//                   value={wagonNo}
//                   onChange={(e) => handleWagonNoChange(e.target.value)}
//                   placeholder="Enter Wagon No."
//                   style={{
//                     border: `1px solid ${wagonError ? '#ef4444' : '#D0D5DD'}`,
//                     borderRadius: "8px",
//                     padding: "10px 12px",
//                     width: "100%",
//                     outline: "none",
//                     fontSize: "14px"
//                   }}
//                 />
//                 {wagonError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{wagonError}</div>}
//               </div>
//             </>
//           )}

//           {/* ========== RAILWAYS (Simple Mode) FIELDS ========== */}
//           {transportMode === "railways" && (
//             <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "12px", gridColumn: "span 3" }}>
//               <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
//                 <div style={{ flex: 1, minWidth: "180px" }}>
//                   <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Wagon No.</label>
//                   <input
//                     type="text"
//                     value={railwayWagonNo}
//                     onChange={(e) => handleWagonNoChange(e.target.value)}
//                     placeholder="Enter Wagon No."
//                     style={{
//                       border: `1px solid ${wagonError ? '#ef4444' : '#D0D5DD'}`,
//                       borderRadius: "8px",
//                       padding: "10px 12px",
//                       width: "100%",
//                       outline: "none",
//                       fontSize: "14px",
//                       color: "#667085"
//                     }}
//                   />
//                   {wagonError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{wagonError}</div>}
//                 </div>
//                 <div style={{ flex: 1, minWidth: "180px" }}>
//                   <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>Train No.</label>
//                   <input
//                     type="text"
//                     value={railwayTrainNo}
//                     onChange={(e) => handleTrainNoChange(e.target.value)}
//                     placeholder="Enter Train No."
//                     style={{
//                       border: `1px solid ${trainError ? '#ef4444' : '#D0D5DD'}`,
//                       borderRadius: "8px",
//                       padding: "10px 12px",
//                       width: "100%",
//                       outline: "none",
//                       fontSize: "14px",
//                       color: "#667085"
//                     }}
//                   />
//                   {trainError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{trainError}</div>}
//                 </div>
//                 <div style={{ flex: 1, minWidth: "180px" }}>
//                   <label style={{ color: "#727681", fontSize: "12px", marginBottom: "6px", display: "block" }}>
//                     RR Number <span style={{ fontSize: "10px", color: "#6B7280" }}>(Format: PXYZ2024-123456)</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={rrbNo}
//                     onChange={(e) => handleRrbNoChange(e.target.value)}
//                     placeholder="Enter RR Number"
//                     style={{
//                       border: `1px solid ${rrError ? '#ef4444' : '#D0D5DD'}`,
//                       borderRadius: "8px",
//                       padding: "10px 12px",
//                       width: "100%",
//                       outline: "none",
//                       fontSize: "14px",
//                       color: "#667085"
//                     }}
//                   />
//                   {rrError && <div style={{ color: "#ef4444", fontSize: "11px", marginTop: "4px" }}>{rrError}</div>}
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>


//          {/* Action Buttons */}
//         <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
//           <button
//             onClick={closeModal}
//             style={{
//               backgroundColor: "transparent",
//               border: "1px solid #D0D5DD",
//               color: "#667085",
//               padding: "8px 18px",
//               borderRadius: "8px",
//               fontSize: "14px",
//               fontWeight: 500,
//               cursor: "pointer",
//             }}
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleAssign}
//             disabled={loading}
//             style={{
//               backgroundColor: "#1F7FFF",
//               border: "none",
//               color: "#fff",
//               padding: "8px 18px",
//               borderRadius: "8px",
//               fontSize: "14px",
//               fontWeight: 500,
//               cursor: loading ? "not-allowed" : "pointer",
//               opacity: loading ? 0.7 : 1,
//             }}
//           >
//             {loading ? "Assigning..." : "Assign Transport"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default InvoiceAssignTransportModal;





// import React, {useState, useEffect} from "react";
// import { RxCross2 } from "react-icons/rx";
// import api from "../../../pages/config/axiosInstance"
// import {toast} from "react-toastify"

// const InvoiceAssignTransportModal = ({
//   show,
//   closeModal,
//   invoice, // Pass the selected invoice object
//   onSuccess, // Callback to refresh the invoice list
// }) => {
//   const [transporter, setTransporter] = useState("");
//   const [vehicle, setVehicle] = useState("");
//   const [driver, setDriver] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [transporterOptions, setTransporterOptions] = useState([]);
//   const [vehicleOptions, setVehicleOptions] = useState([]);
//   const [driverOptions, setDriverOptions] = useState([]);

//   // Fetch transport options when modal opens
//   useEffect(() => {
//     if (show) {
//       fetchTransportData();
//       // Pre-fill existing values if invoice has them
//       if (invoice) {
//         setTransporter(invoice.transporterId?._id || invoice.transporterId || "");
//         setVehicle(invoice.vehicleId?._id || invoice.vehicleId || "");
//         setDriver(invoice.driverId?._id || invoice.driverId || "");
//       }
//     }
//   }, [show, invoice]);

//   const fetchTransportData = async () => {
//     try {
//       const [transportersRes, vehiclesRes, driversRes] = await Promise.all([
//         api.get("/api/transporter/get"),
//         api.get("/api/vehicle/get"),
//         api.get("/api/driver/get")
//       ]);
//       setTransporterOptions(transportersRes.data.transporters || []);
//       setVehicleOptions(vehiclesRes.data.vehicle || []);
//       setDriverOptions(driversRes.data.driver || []);
//     } catch (error) {
//       console.error("Error fetching transport data:", error);
//       toast.error("Failed to load transport data");
//     }
//   };

//   // Filter vehicles based on selected transporter
//   const filteredVehicleOptions = vehicleOptions.filter(
//     (v) => !transporter || v.transporterId?._id === transporter || v.transporterId === transporter
//   );

//   // Filter drivers based on selected transporter
//   const filteredDriverOptions = driverOptions.filter(
//     (d) => !transporter || d.transporterId?._id === transporter || d.transporterId === transporter
//   );

//   const handleAssign = async () => {
//     if (!invoice || !invoice._id) {
//       toast.error("No invoice selected");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await api.put(`/api/invoices/${invoice._id}/transport`, {
//         transporterId: transporter || null,
//         vehicleId: vehicle || null,
//         driverId: driver || null,
//       });

//       if (response.data.success) {
//         toast.success("Transport assigned successfully!");
//         if (onSuccess) onSuccess(); // Refresh the invoice list
//         closeModal();
//         // Reset form
//         setTransporter("");
//         setVehicle("");
//         setDriver("");
//       }
//     } catch (error) {
//       console.error("Assign transport error:", error);
//       toast.error(error?.response?.data?.message || "Failed to assign transport");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!show) return null;

//  return (
//     <div
//       style={{
//         position: "fixed",
//         top: 0,
//         left: 0,
//         width: "100vw",
//         height: "100vh",
//         backgroundColor: "rgba(0,0,0,0.27)",
//         backdropFilter: "blur(1px)",
//         display: "flex",
//         justifyContent: "center",
//         alignItems: "center",
//         zIndex: 99999999,
//       }}
//     >
//       <div
//         style={{
//           backgroundColor: "white",
//           width: "820px",
//           padding: "30px 40px",
//           borderRadius: "8px",
//         }}
//       >
//         {/* Close Button */}
//         <div
//           style={{
//             display: "flex",
//             justifyContent: "flex-end",
//             marginBottom: "10px",
//           }}
//         >
//           <button
//             type="button"
//             onClick={closeModal}
//             style={{
//               color: "#727681",
//               fontSize: "10px",
//               fontWeight: 800,
//               border: "2px solid #727681",
//               borderRadius: "50%",
//               backgroundColor: "transparent",
//               width: "30px",
//               height: "30px",
//               cursor: "pointer",
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//             }}
//           >
//             <RxCross2
//               style={{
//                 color: "#727681",
//                 fontSize: "15px",
//                 fontWeight: 900,
//               }}
//             />
//           </button>
//         </div>

//         {/* Heading */}
//         <h5
//           style={{
//             color: "#0E101A",
//             fontWeight: 500,
//             fontSize: "32px",
//             fontFamily: '"Inter", sans-serif',
//             marginBottom: "24px",
//           }}
//         >
//           Assign Transport
//         </h5>

//         {/* Invoice Info */}
//         {invoice && (
//           <div
//             style={{
//               marginBottom: "20px",
//               padding: "10px",
//               backgroundColor: "#f5f5f5",
//               borderRadius: "8px",
//             }}
//           >
//             <p style={{ margin: 0 }}>
//               <strong>Invoice No:</strong> {invoice.invoiceNo}
//             </p>
//             <p style={{ margin: 0 }}>
//               <strong>Customer:</strong> {invoice.customerId?.name || "N/A"}
//             </p>
//           </div>
//         )}

//         {/* Fields */}
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(3, 1fr)",
//             gap: "14px",
//             marginBottom: "40px",
//           }}
//         >
//           {/* Transporter */}
//           <div>
//             <label
//               style={{
//                 color: "#727681",
//                 fontSize: "12px",
//                 marginBottom: "6px",
//                 display: "block",
//               }}
//             >
//               Select Transporter
//             </label>

//             <select
//               value={transporter}
//               onChange={(e) => {
//                 setTransporter(e.target.value);
//                 setVehicle(""); // Reset vehicle when transporter changes
//                 setDriver(""); // Reset driver when transporter changes
//               }}
//               style={{
//                 border: "1px solid #D0D5DD",
//                 backgroundColor: "#ffffff",
//                 borderRadius: "8px",
//                 padding: "10px 12px",
//                 width: "100%",
//                 outline: "none",
//                 fontSize: "14px",
//                 color: "#667085",
//               }}
//             >
//               <option value="">Select Transporter</option>
//               {transporterOptions.map((t) => (
//                 <option key={t._id} value={t._id}>
//                   {t.transporterName}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Vehicle */}
//           <div>
//             <label
//               style={{
//                 color: "#727681",
//                 fontSize: "12px",
//                 marginBottom: "6px",
//                 display: "block",
//               }}
//             >
//               Select Vehicle
//             </label>

//             <select
//               value={vehicle}
//               onChange={(e) => setVehicle(e.target.value)}
//               style={{
//                 border: "1px solid #D0D5DD",
//                 backgroundColor: "#ffffff",
//                 borderRadius: "8px",
//                 padding: "10px 12px",
//                 width: "100%",
//                 outline: "none",
//                 fontSize: "14px",
//                 color: "#667085",
//               }}
//               disabled={!transporter && filteredVehicleOptions.length === 0}
//             >
//               <option value="">Select Vehicle</option>
//               {filteredVehicleOptions.map((v) => (
//                 <option key={v._id} value={v._id}>
//                   {v.vehicleNumber} {v.vehicleType ? `(${v.vehicleType})` : ""}
//                 </option>
//               ))}
//             </select>
//             {transporter && filteredVehicleOptions.length === 0 && (
//               <div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>
//                 No vehicles found for this transporter
//               </div>
//             )}
//           </div>

//           {/* Driver */}
//           <div>
//             <label
//               style={{
//                 color: "#727681",
//                 fontSize: "12px",
//                 marginBottom: "6px",
//                 display: "block",
//               }}
//             >
//               Select Driver
//             </label>

//             <select
//               value={driver}
//               onChange={(e) => setDriver(e.target.value)}
//               style={{
//                 border: "1px solid #D0D5DD",
//                 backgroundColor: "#ffffff",
//                 borderRadius: "8px",
//                 padding: "10px 12px",
//                 width: "100%",
//                 outline: "none",
//                 fontSize: "14px",
//                 color: "#667085",
//               }}
//               disabled={!transporter && filteredDriverOptions.length === 0}
//             >
//               <option value="">Select Driver</option>
//               {filteredDriverOptions.map((d) => (
//                 <option key={d._id} value={d._id}>
//                   {d.driverName}
//                 </option>
//               ))}
//             </select>
//             {transporter && filteredDriverOptions.length === 0 && (
//               <div style={{ fontSize: "11px", color: "#ff9800", marginTop: "4px" }}>
//                 No drivers found for this transporter
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Button */}
//         <button
//           onClick={handleAssign}
//           disabled={loading}
//           style={{
//             backgroundColor: "#1F7FFF",
//             border: "none",
//             color: "#fff",
//             padding: "8px 18px",
//             borderRadius: "8px",
//             fontSize: "14px",
//             fontWeight: 500,
//             cursor: loading ? "not-allowed" : "pointer",
//             opacity: loading ? 0.7 : 1,
//           }}
//         >
//           {loading ? "Assigning..." : "Done"}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default InvoiceAssignTransportModal;