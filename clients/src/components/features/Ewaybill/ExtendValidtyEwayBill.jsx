import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance.js";

export default function ExtendEwbValidity({ billData, onClose }) {
  const [ewbNumber] = useState(billData?.ewayBillNo || "");
  const [remainingDistance, setRemainingDistance] = useState("");
  const [reasonCode, setReasonCode] = useState("1"); // 1-Natural Calamity, 2-Breakdown...
  const [remarks, setRemarks] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!remainingDistance) return toast.error("Remaining travel distance field mandatory");
    try {
      const res = await api.post("/api/ewaybill/extend-validity", {
        eway_bill_number: ewbNumber,
        remaining_distance: Number(remainingDistance),
        extend_validity_reason: reasonCode,
        extend_remarks: remarks,
        consignment_status: "M", // In-Transit
        transit_type: "R" // Road
      }, { headers: { "x-tenant-db": localStorage.getItem("dbName") } });

      if (res.data?.success) {
        toast.success("E-Way Bill validity period extended successfully");
        onClose();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Extension process aborted"); }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header bg-light">
            <h5 className="modal-title fw-bold">Extend Document Validity Window</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">E-Way Bill Reference ID</label>
              <input type="text" className="form-control bg-light" value={ewbNumber} readOnly />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Remaining Transit Distance (KM)</label>
              <input type="number" className="form-control" placeholder="e.g. 140" value={remainingDistance} onChange={(e) => setRemainingDistance(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Extension Context Reason Code</label>
              <select className="form-select" value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
                <option value="1">1 - Natural Calamity / Weather Obstruction</option>
                <option value="2">2 - Mechanical Breakdown Delay</option>
                <option value="3">3 - Transhipment Processing Issues</option>
                <option value="4">4 - Traffic Congestion / Accident Blockades</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Justification Comments</label>
              <input type="text" className="form-control" placeholder="Add custom delay explanation details..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Dismiss</button>
            <button type="submit" className="btn btn-warning fw-semibold text-dark">Apply Dynamic Extension</button>
          </div>
        </form>
      </div>
    </div>
  );
}