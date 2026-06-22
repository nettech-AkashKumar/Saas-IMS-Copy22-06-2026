import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance.js";

export default function UpdateVehiclePartB({ billData, onClose }) {
  const [ewbNumber] = useState(billData?.ewayBillNo || "");
  const [vehicleNo, setVehicleNo] = useState(billData?.vehicleNo || "");
  const [vehicleType, setVehicleType] = useState("REGULAR");
  const [reasonCode, setReasonCode] = useState("1"); // Default: 1-Breakdown
  const [modeOfTransport, setModeOfTransport] = useState("1"); // 1-Road

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNo.trim()) return toast.error("Vehicle registration plate number required");
    try {
      const res = await api.post("/api/ewaybill/vehicle/update", {
        eway_bill_number: ewbNumber,
        vehicle_number: vehicleNo.toUpperCase(),
        vehicle_type: vehicleType,
        reason_code_for_vehicle_updation: reasonCode,
        mode_of_transport: modeOfTransport
      }, { headers: { "x-tenant-db": localStorage.getItem("dbName") } });

      if (res.data?.success) {
        toast.success("Transit vehicle updated successfully");
        onClose();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to alter vehicle data"); }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Update Vehicle Number (Part B)</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">E-Way Bill Target Number</label>
              <input type="text" className="form-control bg-light" value={ewbNumber} readOnly />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">New Vehicle Number</label>
              <input type="text" className="form-control text-uppercase" placeholder="e.g. DL1CA1234" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} required />
            </div>
            <div className="row">
              <div className="col mb-3">
                <label className="form-label">Vehicle Logistics Profile</label>
                <select className="form-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                  <option value="REGULAR">Regular Cargo Carrier</option>
                  <option value="ODC">Over Dimensional Cargo (ODC)</option>
                </select>
              </div>
              <div className="col mb-3">
                <label className="form-label">Update Reason</label>
                <select className="form-select" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
                  <option value="1">1 - Transhipment / Breakdown</option>
                  <option value="2">2 - Non availability of vehicle</option>
                  <option value="3">3 - Multi-Modal Transit Shift</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Update Fleet Dispatch</button>
          </div>
        </form>
      </div>
    </div>
  );
}