import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance.js";

export default function CancelEwayBill({ billData, onClose }) {
  // Auto-filled from row select data
  const [ewbNumber] = useState(billData?.ewayBillNo || "");
  const [reasonOfCancel, setReasonOfCancel] = useState("1"); // Default: 1-Duplicate
  const [cancelRemark, setCancelRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cancelRemark.trim()) return toast.error("Please add cancellation comments");
    try {
      setSubmitting(true);
      const res = await api.post("/api/ewaybill/cancel", {
        eway_bill_number: ewbNumber,
        reason_of_cancel: reasonOfCancel,
        cancel_remark: cancelRemark
      }, { headers: { "x-tenant-db": localStorage.getItem("dbName") } });

      if (res.data?.success) {
        toast.success("E-Way Bill marked as Cancelled successfully");
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancellation request failed");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="modal d-block bg-dark bg-opacity-50" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <form className="modal-content" onSubmit={handleSubmit}>
          <div className="modal-header">
            <h5 className="modal-title fw-bold text-danger">Cancel E-Way Bill</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label fw-semibold">E-Way Bill Number (Auto-filled)</label>
              <input type="text" className="form-control bg-light" value={ewbNumber} readOnly />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Reason for Cancellation</label>
              <select className="form-select" value={reasonOfCancel} onChange={(e) => setReasonOfCancel(e.target.value)}>
                <option value="1">1 - Duplicate Generation</option>
                <option value="2">2 - Data Entry Mistake</option>
                <option value="3">3 - Order Cancelled</option>
                <option value="4">4 - Others</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">Remarks / Comments</label>
              <textarea className="form-control" rows="3" placeholder="Enter formal justification context..." value={cancelRemark} onChange={(e) => setCancelRemark(e.target.value)} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-danger" disabled={submitting}>{submitting ? "Processing..." : "Confirm Cancellation"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}