import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance.js";

export default function UpdateTransporterId({ billData, onClose }) {
  const [ewbNumber] = useState(billData?.ewayBillNo || "");
  const [transporterId, setTransporterId] = useState(billData?.transporterId || "");
  const [transporterName, setTransporterName] = useState(billData?.transporterName || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!transporterId.trim() || !transporterName.trim()) return toast.error("All logistics identification criteria required");
    try {
      const res = await api.post("/api/ewaybill/transporter/update", {
        eway_bill_number: ewbNumber,
        transporter_id: transporterId,
        transporter_name: transporterName
      }, { headers: { "x-tenant-db": localStorage.getItem("dbName") } });

      if (res.data?.success) {
        toast.success("Transporter agency bindings patched successfully");
        onClose();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update transporter assignment"); }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Assign / Alter Transporter Credentials</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">E-Way Bill Number</label>
              <input type="text" className="form-control bg-light" value={ewbNumber} readOnly />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Transporter Statutory ID (GSTIN/LID)</label>
              <input type="text" className="form-control text-uppercase" placeholder="e.g. 07AAAAA1111A1Z1" value={transporterId} onChange={(e) => setTransporterId(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Transporter Registered Legal Business Name</label>
              <input type="text" className="form-control" placeholder="e.g. BlueDart Express Logistics Ltd" value={transporterName} onChange={(e) => setTransporterName(e.target.value)} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Abort</button>
            <button type="submit" className="btn btn-dark">Re-Assign Agency Log</button>
          </div>
        </form>
      </div>
    </div>
  );
}