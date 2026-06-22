import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import api from "../../../pages/config/axiosInstance.js";

// Import your 5 separate sub-components / forms
import CancelEwayBill from "./CancelEwayBill.jsx";
import UpdateVehiclePartB from "./UpdateTransportEwayBill.jsx";
import ExtendEwbValidity from "./ExtendValidtyEwayBill.jsx";
import UpdateTransporterId from "./UpdateTransportEwayBill.jsx";
import ViewEwbDetailsPdf from "./ViewEwbDetailsPdf.jsx";

import { IoIosSearch } from "react-icons/io";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { IoPrintOutline } from "react-icons/io5";
import { GrDocumentUpdate } from "react-icons/gr";
import { MdCancelPresentation } from "react-icons/md";
import { FaTruckMoving, FaRegCalendarPlus } from "react-icons/fa";

export default function EwayBillList() {
  const { t } = useTranslation();
  const [ewayBills, setEwayBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);

  // Dropdown UI Trackers
  const [viewOptions, setViewOptions] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const menuRef = useRef(null);

  // Active Selected Row Data Object
  const [activeBillItem, setActiveBillItem] = useState(null);

  // Modals / Separate Files Visibility States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showTransporterModal, setShowTransporterModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => { fetchEwayBills(); }, []);
  useEffect(() => { applyClientFilters(); }, [ewayBills, searchTerm, statusFilter]);

  const fetchEwayBills = async () => {
    try {
      setLoading(true);
      const tenantDb = localStorage.getItem("dbName") || "";
      const res = await api.get("/api/ewaybill/all", { headers: { "x-tenant-db": tenantDb } });
      if (res.data?.success) setEwayBills(res.data.data || []);
    } catch (error) {
      toast.error("Failed to retrieve E-Way Bill records");
    } finally { setLoading(false); }
  };

  const applyClientFilters = () => {
    let output = [...ewayBills];
    if (statusFilter !== "All") output = output.filter(b => b.status === statusFilter);
    if (searchTerm.trim() !== "") {
      const matchKey = searchTerm.toLowerCase();
      output = output.filter(b => 
        b.ewayBillNo?.toLowerCase().includes(matchKey) || b.invoiceNo?.toLowerCase().includes(matchKey)
      );
    }
    setFilteredBills(output);
  };

  return (
    <div className="p-4" style={{ backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold m-0 text-dark">E-Way Bills</h2>
          <small className="text-muted">Manage active transport transits and compliances</small>
        </div>
        <div>
          <Link to="/create-ewaybill" className="text-decoration-none">
            <button className="btn btn-primary fw-semibold px-4 py-2 shadow-sm">
              Generate E-Way Bill
            </button>
          </Link>
        </div>
      </div>

      <div className="card border-0 shadow-sm p-3 bg-white" style={{ borderRadius: "16px" }}>
        {/* Table Filter Controls */}
        <div className="d-flex justify-content-between align-items-center gap-3 mb-3 flex-wrap">
          <div className="d-flex p-1 bg-light" style={{ borderRadius: "10px", gap: "4px" }}>
            {["All", "GENERATED", "CANCELLED"].map((tab) => (
              <button key={tab} onClick={() => setStatusFilter(tab)} className={`btn btn-sm px-3 border-0 ${statusFilter === tab ? 'bg-white text-dark fw-semibold shadow-sm' : 'text-secondary'}`} style={{ borderRadius: '8px' }}>
                {tab}
              </button>
            ))}
          </div>
          <div className="position-relative" style={{ width: "300px" }}>
            <IoIosSearch className="position-absolute text-muted top-50 translate-middle-y start-0 ms-3 fs-5" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search records..." className="form-control ps-5" style={{ borderRadius: "8px" }} />
          </div>
        </div>

        {/* Data Grid */}
        <div className="table-responsive">
          <table className="table align-middle m-0">
            <thead>
              <tr className="bg-light">
                <th className="py-3 px-3">E-Way Bill No.</th>
                <th className="py-3">Consignee GSTIN</th>
                <th className="py-3">Invoice No</th>
                <th className="py-3">Vehicle No</th>
                <th className="py-3">Total Value</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-4">Loading warehouse data...</td></tr>
              ) : filteredBills.map((item, index) => (
                <tr key={item._id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td className="py-3 px-3 fw-semibold">{item.ewayBillNo || "DRAFT/FAILED"}</td>
                  <td className="py-3">{item.customerGSTIN || "-"}</td>
                  <td className="py-3">{item.invoiceNo || "-"}</td>
                  <td className="py-3 text-uppercase">{item.vehicleNo || "Not Assigned"}</td>
                  <td className="py-3 fw-bold">₹{Number(item.totalValue || 0).toLocaleString("en-IN")}</td>
                  <td className="py-3">
                    <span className={`badge px-2 py-1 ${item.status === 'GENERATED' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setOpenUpwards((window.innerHeight - rect.bottom) < 240);
                        setDropdownPos({ x: rect.left - 400, y: rect.bottom + window.scrollY });
                        setActiveBillItem(item);
                        setViewOptions(viewOptions === index ? false : index);
                      }}
                      className="btn btn-sm btn-link text-secondary"
                    >
                      <HiOutlineDotsHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dynamic Context Dropdown */}
        {viewOptions !== false && activeBillItem && (
          <div ref={menuRef} style={{ position: "absolute", left: `${dropdownPos.x}px`, top: `${openUpwards ? dropdownPos.y - 240 : dropdownPos - 100}px`, zIndex: 1050, background: "#fff", borderRadius: "8px", boxShadow: "0 px 10px 25px rgba(0,0,0,0.1)", border: "1px solid #E2E8F0", minWidth: "210px", padding: "6px" }}>
            <button
  className="w-100 border-0 bg-transparent text-start px-3 py-2 text-dark d-flex align-items-center gap-2"
  onClick={() => {
    setViewOptions(false);

    const pdfUrl = activeBillItem?.apiResponse?.message?.url;

    if (pdfUrl) {
      const finalUrl = pdfUrl.startsWith("http")
        ? pdfUrl
        : `https://${pdfUrl}`;

      window.open(finalUrl, "_blank");
    } else {
      console.error("EWB PDF URL not found");
    }
  }}
>
  <IoPrintOutline className="text-primary" size={15} />
  5. View EWB Details (PDF)
</button>
            <button className="w-100 border-0 bg-transparent text-start px-3 py-2 text-dark d-flex align-items-center gap-2" onClick={() => { setViewOptions(false); setShowVehicleModal(true); }} disabled={activeBillItem.status === "CANCELLED"}><FaTruckMoving className="text-muted" size={14} /> 2. Update Vehicle (Part B)</button>
            <button className="w-100 border-0 bg-transparent text-start px-3 py-2 text-dark d-flex align-items-center gap-2" onClick={() => { setViewOptions(false); setShowTransporterModal(true); }} disabled={activeBillItem.status === "CANCELLED"}><GrDocumentUpdate className="text-muted" size={13} /> 4. Update Transporter ID</button>
            <button className="w-100 border-0 bg-transparent text-start px-3 py-2 text-dark d-flex align-items-center gap-2" onClick={() => { setViewOptions(false); setShowExtendModal(true); }} disabled={activeBillItem.status === "CANCELLED"}><FaRegCalendarPlus className="text-muted" size={13} /> 3. Extend Validity</button>
            <hr className="my-1" />
            <button className="w-100 border-0 bg-transparent text-start px-3 py-2 text-danger d-flex align-items-center gap-2" onClick={() => { setViewOptions(false); setShowCancelModal(true); }} disabled={activeBillItem.status === "CANCELLED"}><MdCancelPresentation size={15} /> 1. Cancel E-Way Bill</button>
          </div>
        )}
      </div>

      {/* RENDER FORMS AND PASS AUTO-FILL DATA ROW DOWNWARD */}
      {showCancelModal && <CancelEwayBill billData={activeBillItem} onClose={() => { setShowCancelModal(false); fetchEwayBills(); }} />}
      {showVehicleModal && <UpdateVehiclePartB billData={activeBillItem} onClose={() => { setShowVehicleModal(false); fetchEwayBills(); }} />}
      {showExtendModal && <ExtendEwbValidity billData={activeBillItem} onClose={() => { setShowExtendModal(false); fetchEwayBills(); }} />}
      {showTransporterModal && <UpdateTransporterId billData={activeBillItem} onClose={() => { setShowTransporterModal(false); fetchEwayBills(); }} />}
      {showDetailsModal && <ViewEwbDetailsPdf billData={activeBillItem} onClose={() => setShowDetailsModal(false)} />}
    </div>
  );
}