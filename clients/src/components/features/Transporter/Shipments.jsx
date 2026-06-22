import React, { useEffect, useState, useRef, useMemo } from "react";
import { FiSearch } from "react-icons/fi";
import { TbFileExport, TbTrash } from "react-icons/tb";
import Pagination from "../../../components/Pagination";
import api from "../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import ConfirmDeleteModal from "../../ConfirmDelete";
import { useNavigate } from "react-router-dom";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasPermission } from "../../../utils/permission/hasPermission";
import { useAuth } from "../../auth/AuthContext";
import { RiArrowDropDownLine } from "react-icons/ri";
import ShipmentsDetailsView from "./ShipmentsDetailsView";
import AddTransportModals from "./AddTransportModals"; // Import the transport modal
import { Link } from "react-router-dom";
import DateFilterDropdown from "../../../components/DateFilterDropdown";
import InvoiceAssignTransportModal from "../../../components/features/Transporter/InvoiceAssignTransportModal";
import PreviewInvoice from "../../../pages/Invoices/PreviewInvoice";
import { IoPrint } from "react-icons/io5";
import { ShipmentPrintContent } from "../../features/Transporter/ShipmentPrintContent.jsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";



// Status options for shipment
const SHIPMENT_STATUS = {
  DRAFT: "draft",           // Add this
  ASSIGNED: "assigned",
  IN_TRANSIT: "in_transit",
  OUT_FOR_DELIVERY: "out_for_delivery",
  DELIVERED: "delivered",
  FAILED: "failed",
  CANCELLED: "cancelled"
};

const STATUS_DISPLAY = {
  draft: { label: "Draft", bgColor: "#F3F4F6", color: "#6B7280" },
  assigned: { label: "Assigned", bgColor: "#EAF3FF", color: "#1F7FFF" },
  in_transit: { label: "In Transit", bgColor: "#FFF3E0", color: "#ED6C02" },
  out_for_delivery: { label: "Out for Delivery", bgColor: "#E8F5E9", color: "#2E7D32" },
  delivered: { label: "Delivered", bgColor: "#E8F5E9", color: "#2E7D32" },
  failed: { label: "Failed", bgColor: "#FFEBEE", color: "#D32F2F" },
  cancelled: { label: "Cancelled", bgColor: "#FFEBEE", color: "#D32F2F" }
};

// Modal for cancellation reason
const CancelReasonModal = ({ isOpen, onClose, onConfirm, shipmentNo, isSubmitting }) => {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setReasonError("Please enter a cancellation reason");
      return;
    }
    setReasonError("");
    onConfirm(reason);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "16px",
          width: "90%",
          maxWidth: "500px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          fontFamily: "'Inter', sans-serif",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #EAEAEA",
            backgroundColor: "#FEF2F2",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#FEE2E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12M12 16H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#DC2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#0E101A",
                  margin: 0,
                }}
              >
                Cancel Shipment
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6B7280",
                  margin: "4px 0 0 0",
                }}
              >
                Shipment No: {shipmentNo}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#0E101A",
                marginBottom: "8px",
              }}
            >
              Cancellation Reason <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <textarea
              rows="4"
              placeholder="Please provide a reason for cancelling this shipment..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim()) {
                  setReasonError("");
                }
              }}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: reasonError ? "1px solid #EF4444" : "1px solid #D1D5DB",
                outline: "none",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
                resize: "vertical",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#1F7FFF";
              }}
              onBlur={(e) => {
                if (!reasonError) {
                  e.target.style.borderColor = "#D1D5DB";
                }
              }}
            />
            {reasonError && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#EF4444",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.33" />
                  <path d="M7 4V7M7 10H7.01" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" />
                </svg>
                {reasonError}
              </p>
            )}
          </div>

          {/* Example reasons */}
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "8px",
              }}
            >
              Common reasons:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {[
                "Customer request",
                "Wrong address",
                "Product unavailable",
                "Delivery delayed",
                "Payment issue",
              ].map((exampleReason) => (
                <button
                  key={exampleReason}
                  onClick={() => {
                    setReason(exampleReason);
                    setReasonError("");
                  }}
                  style={{
                    padding: "4px 12px",
                    fontSize: "12px",
                    borderRadius: "16px",
                    border: "1px solid #E5E7EB",
                    backgroundColor: "#F9FAFB",
                    color: "#374151",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#EAF3FF";
                    e.currentTarget.style.borderColor = "#1F7FFF";
                    e.currentTarget.style.color = "#1F7FFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                    e.currentTarget.style.borderColor = "#E5E7EB";
                    e.currentTarget.style.color = "#374151";
                  }}
                >
                  {exampleReason}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #EAEAEA",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            backgroundColor: "#F9FAFB",
          }}
        >
          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid #D1D5DB",
              backgroundColor: "#fff",
              color: "#374151",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isSubmitting ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "#F3F4F6";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#DC2626",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "500",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              opacity: isSubmitting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.backgroundColor = "#B91C1C";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#DC2626";
            }}
          >
            {isSubmitting ? (
              <>
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #fff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
                Processing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 4H14M5.33333 7.33333V10.6667M10.6667 7.33333V10.6667M4 4H12V12.6667C12 13.0203 11.687 13.3333 11.3333 13.3333H4.66667C4.313 13.3333 4 13.0203 4 12.6667V4Z"
                    stroke="white"
                    strokeWidth="1.33"
                    strokeLinecap="round"
                  />
                </svg>
                Confirm Cancellation
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default function Shipments() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const navigate = useNavigate();
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [selectAllGlobal, setSelectAllGlobal] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedShipmentForTransport, setSelectedShipmentForTransport] = useState(null);
  // Add this state for cancellation modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedShipmentForCancel, setSelectedShipmentForCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });


  // for preview invocie
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedInvoiceForPreview, setSelectedInvoiceForPreview] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const [statusCounts, setStatusCounts] = useState({
    All: 0,
    "Not Assigned": 0,
    "Assigned": 0,
    "In Transit": 0,
    "Out for Delivery": 0,
    "Delivered": 0,
    "Failed": 0,
    "Cancelled": 0
  });

  const fetchStatusCounts = async () => {
    try {
      // Fetch all shipments without pagination to get counts
      // Or better: have a separate API endpoint for counts
      const res = await api.get("/api/shipments", {
        params: {
          limit: 10000,  // Get all to calculate counts
          page: 1
        }
      });

      const allShipments = res.data.data?.shipments || [];

      const counts = {
        All: allShipments.length,
        "Assigned": allShipments.filter(s => s.status === "assigned").length,
        "In Transit": allShipments.filter(s => s.status === "in_transit").length,
        "Out for Delivery": allShipments.filter(s => s.status === "out_for_delivery").length,
        "Delivered": allShipments.filter(s => s.status === "delivered").length,
        "Failed": allShipments.filter(s => s.status === "failed").length,
        "Cancelled": allShipments.filter(s => s.status === "cancelled").length,
      };

      setStatusCounts(counts);
    } catch (error) {
      console.error("Failed to fetch status counts:", error);
    }
  };

  // Call fetchStatusCounts on component mount and when shipments change
  useEffect(() => {
    fetchStatusCounts();
  }, []);

  const getAllowedNextStatuses = (currentStatus) => {
    const transitions = {
      'draft': [
        { value: "assigned", label: "Assigned" },
        { value: "cancelled", label: "Cancelled" }
      ],
      'assigned': [
        { value: "in_transit", label: "In Transit" },
        { value: "cancelled", label: "Cancelled" },
        { value: "failed", label: "Failed" }
      ],
      'in_transit': [
        { value: "out_for_delivery", label: "Out for Delivery" },
        { value: "failed", label: "Failed" },
        { value: "cancelled", label: "Cancelled" }
      ],
      'out_for_delivery': [
        { value: "delivered", label: "Delivered" },
        { value: "failed", label: "Failed" },
        { value: "cancelled", label: "Cancelled" }
      ],
      'delivered': [], // No further transitions
      'failed': [
        { value: "assigned", label: "Retry - Assign Again" },
        { value: "cancelled", label: "Cancelled" }
      ],
      'cancelled': [] // No further transitions
    };

    return transitions[currentStatus] || [];
  };

  const menuRef = useRef();
  const detailsRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const menuItems = [
    {
      label: "Print",  // ADD THIS
      icon: <IoPrint size={18} />,
      action: "print",
    },

    ...(hasPermission(user, "shipments", "delete")
      ? [
        {
          label: "Delete",
          icon: <TbTrash size={18} />,
          action: "delete",
        },
      ]
      : []),
  ];

const handleDateChange = (dates) => {
  setDateRange({
    startDate: dates.startDate,
    endDate: dates.endDate
  });
  setCurrentPage(1);
};

  // Counter for shipment number
  let shipmentCounter = 1;

  // Generate Shipment Number (auto-generated)
  const generateShipmentNo = (invoiceNo, index) => {
    // Format: SHP-XXXX (where XXXX is sequential number)
    const seq = String(shipmentCounter++).padStart(4, '0');
    return `SHP-${seq}`;
  };

  // Calculate total delivery charge from additionalChargesDetails
  const calculateDeliveryCharge = (additionalChargesDetails) => {
    if (!additionalChargesDetails) return 0;

    // Sum all charges: shipping + handling + packing + service + other
    const charges = additionalChargesDetails;
    return (
      (charges.shipping || 0) +
      (charges.handling || 0) +
      (charges.packing || 0) +
      (charges.service || 0) +
      (charges.other || 0)
    );
  };

  // Fetch shipments from Shipment API
  const fetchShipments = async () => {
    setLoading(true);

    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...(search && { search })
      };

      // ADD DATE RANGE FILTER - This is missing!
 if (dateRange?.startDate && dateRange?.endDate) {
      const startDate = new Date(dateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();
      
      console.log("Date filter applied:", params.startDate, params.endDate);
    }


      // Filter by status tab
      if (activeTab !== "All") {
        const statusMap = {
          "Assigned": "assigned",        // Changed from "Assigned": "booked"
          "In Transit": "in_transit",
          "Out for Delivery": "out_for_delivery",
          "Delivered": "delivered",
          "Failed": "failed",
          "Cancelled": "cancelled"
        };
        params.status = statusMap[activeTab];
      }

      // Fetch from shipments API
      const res = await api.get("/api/shipments", { params });

      const shipmentData = res.data.data?.shipments || [];
      const totalFromAPI = res.data.data?.pagination?.total || 0;
      setTotal(totalFromAPI);

      // Transform shipment data for table display
      const transformedShipments = shipmentData.map((shipment) => {
        // Determine status display
        const shipmentStatus = shipment.status || 'draft';

        // Get transport details based on mode
        let transportModeDisplay = shipment.transportMode || 'N/A';
        let transportDetails = '';

        if (shipment.transportMode === 'roadways') {
          if (shipment.subMode === 'LR') {
            transportModeDisplay = 'Roadways (LR)';
            transportDetails = shipment.lrNo ? `LR: ${shipment.lrNo}` : '';
          } else if (shipment.subMode === 'RR') {
            transportModeDisplay = 'Railways (RR)';
            transportDetails = `Wagon: ${shipment.wagonNo || 'N/A'}, Train: ${shipment.trainNo || 'N/A'}`;
          }
        } else if (shipment.transportMode === 'railways') {
          transportModeDisplay = 'Railways';
          transportDetails = `Wagon: ${shipment.railwayWagonNo || 'N/A'}, Train: ${shipment.railwayTrainNo || 'N/A'}`;
        }

        // Calculate total delivery charge
        const deliveryCharge = (shipment.freightCharge || 0) + (shipment.otherCharges || 0);

        // Get transporter/driver names
        const transporterName = shipment.transporterId?.transporterName || 'Not Assigned';
        const driverName = shipment.driverId?.driverName || 'Not Assigned';
        const vehicleNumber = shipment.vehicleId?.vehicleNumber || 'Not Assigned';

        return {
          _id: shipment._id,
          shipmentNo: shipment.shipmentNo,
          invoiceNo: shipment.invoiceNo || 'N/A',
          invoiceId: shipment.invoiceId,
          consignorData: {
            name: shipment.consignor?.name || 'N/A',
            phone: shipment.consignor?.phone || '',
            address: shipment.consignor?.address || shipment.fromAddress || '',
            email: shipment.consignor?.email || '',
            gstin: shipment.consignor?.gstin || '',
            customerId: shipment.consignor?.customerId
          },
          customerData: {
            name: shipment.consignee?.name || 'N/A',
            phone: shipment.consignee?.phone || '',
            address: shipment.consignee?.address || shipment.toAddress || '',
            email: shipment.consignee?.email || '',
            gstin: shipment.consignee?.gstin || '',
            customerId: shipment.consignee?.customerId
          },
          customer: shipment.consignee?.name || 'N/A',
          deliveryAddress: shipment.toAddress || shipment.consignee?.address || 'N/A',
          dispatchDate: shipment.shipmentDate,
          totalAmount: shipment.grandTotal || shipment.totalCharges || 0,  // Use grandTotal
          deliveryCharge: (shipment.freightCharge || 0) + (shipment.otherCharges || 0),
          status: shipment.status || 'draft',
          transportMode: shipment.transportMode || 'N/A',
          transportDetails: '',
          // Railway specific fields - FIXED
          wagonNo: shipment.wagonNo || shipment.railwayWagonNo,
          trainNo: shipment.trainNo || shipment.railwayTrainNo,
          railwayReceiptNo: shipment.railwayReceiptNo,  // For roadways RR
          lrNo: shipment.lrNo,
          subMode: shipment.subMode,
          // Transport references
          transporter: {
            id: shipment.transporterId?._id,
            name: shipment.transporterId?.transporterName || 'Not Assigned'
          },
          vehicle: {
            id: shipment.vehicleId?._id,
            number: shipment.vehicleId?.vehicleNumber || 'Not Assigned'
          },
          driver: {
            id: shipment.driverId?._id,
            name: shipment.driverId?.driverName || 'Not Assigned',
            phone: shipment.driverId?.phoneNumber
          },
          hasTransporter: !!shipment.transporterId,
          // Raw data for details modal
          rawShipment: shipment
        };
      });

      setShipments(transformedShipments);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load shipments");
      setShipments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };
  // Update shipment status
  // In Shipments.jsx, update the updateShipmentStatus function:
  const updateShipmentStatus = async (shipmentId, newStatus, notes = null) => {
    setUpdatingStatusId(shipmentId);
    try {
      const payload = {
        status: newStatus,
        notes: notes || `Status updated to ${newStatus}`
      };

      const response = await api.put(`/api/shipments/${shipmentId}/status`, payload);

      if (response.data.success) {
        toast.success(`Shipment ${STATUS_DISPLAY[newStatus]?.label || newStatus}`);
        fetchShipments(); // Refresh the list
        fetchStatusCounts(); // Refresh counts
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Failed to update shipment status");
    } finally {
      setUpdatingStatusId(null);
      setOpenStatusDropdownId(null);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [currentPage, itemsPerPage, search, activeTab, dateRange]);


  // Add this import at the top of your Shipments.js file
  const handlePrintShipment = async (shipment) => {
    try {
      toast.info("Preparing print...");

      // Fetch complete shipment data
      const response = await api.get(`/api/shipments/${shipment._id}`);
      if (response.data.success) {
        const shipmentData = response.data.shipment;

        // Fetch company data
        const companyRes = await api.get(`/api/companyprofile/get`);
        const companyData = companyRes.data.data;

        // Fetch terms settings
        const termsRes = await api.get("/api/notes-terms-settings");
        const terms = termsRes.data.data;

        // Fetch template settings
        const templateRes = await api.get("/api/print-templates/all");
        const template = templateRes.data.data;

        // Fetch bank details
        const banksRes = await api.get("/api/company-bank/list");
        const banks = banksRes.data.data;

        // Create temporary div for printing
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        document.body.appendChild(tempDiv);

        // Dynamically import and render ShipmentPrintContent
        const { createRoot } = await import('react-dom/client');

        const root = createRoot(tempDiv);
        root.render(
          <ShipmentPrintContent
            shipment={shipmentData}
            customer={shipmentData.consignor}
            companyData={companyData}
            banks={banks}
            terms={terms}
            template={template}
          />
        );

        // Wait and print
        setTimeout(() => {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            const printContent = tempDiv.cloneNode(true);
            printWindow.document.write(`
<!DOCTYPE html>
<html>
  <head>
    <title>Shipment ${shipmentData.shipmentNo || ''}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'IBM Plex Mono', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; padding: 20px; background: white; }
      @media print { body { padding: 0; margin: 0; } }
      table { page-break-inside: avoid; }
      tr { page-break-inside: avoid; }
    </style>
  </head>
  <body>
    ${printContent.innerHTML}
    <script>
      window.onload = () => {
        setTimeout(() => {
          window.print();
          window.onafterprint = () => window.close();
        }, 500);
      };
    <\/script>
  </body>
</html>
          `);
            printWindow.document.close();
          }
          document.body.removeChild(tempDiv);
          toast.dismiss();
        }, 500);
      }
    } catch (error) {
      toast.error("Failed to load shipment for printing");
    }
    setOpenMenuIndex(null);
  };
  const handleMenuAction = async (action, shipment) => {
    setOpenMenuIndex(null);
    switch (action) {
      case "view":
        setSelectedShipment(shipment);
        setOpenDetailsModal(true);
        break;
      case "transport":
        setSelectedShipmentForTransport(shipment);
        setShowAssignModal(true);
        break;
      case "print":
        await handlePrintShipment(shipment);
        break;
      case "delete":
        setSelectedShipment(shipment);
        setShowDeleteModal(true);
        break;
      default:
        break;
    }
  };

  // Tabs with counts
  const tabsData = [
    { label: "All", value: "All" },
    { label: "Assigned", value: "assigned" },        // Changed from "Assigned"
    { label: "In Transit", value: "in_transit" },
    { label: "Out for Delivery", value: "out_for_delivery" },
    { label: "Delivered", value: "delivered" },
    { label: "Failed", value: "failed" },
    { label: "Cancelled", value: "cancelled" }
  ];

  // Calculate counts for tabs
  const tabCounts = useMemo(() => {
    return statusCounts;
  }, [statusCounts]);

  // Filter shipments based on search
  const filteredShipments = useMemo(() => {
    if (!shipments.length) return [];

    let filtered = [...shipments];

    if (search.trim()) {
      const searchTerm = search.toLowerCase();
      filtered = filtered.filter(shipment =>
        shipment.shipmentNo?.toLowerCase().includes(searchTerm) ||
        shipment.invoiceNo?.toLowerCase().includes(searchTerm) ||
        shipment.customer?.toLowerCase().includes(searchTerm) ||
        shipment.transporter?.name?.toLowerCase().includes(searchTerm) ||
        shipment.driver?.name?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply tab filter (status)
    if (activeTab !== "All") {
      const statusMap = {
        "Assigned": "assigned",
        "In Transit": "in_transit",
        "Out for Delivery": "out_for_delivery",
        "Delivered": "delivered",
        "Failed": "failed",
        "Cancelled": "cancelled"
      };
      filtered = filtered.filter(s => s.status === statusMap[activeTab]);
    }

    return filtered;
  }, [shipments, search, activeTab]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuIndex(null);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setOpenStatusDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    setSelectedRowIds(new Set());
    setSelectAllGlobal(false);
  }, [activeTab, search]);
  const calculateDeliveryChargeForExport = (shipment) => {
  // Check raw shipment first
  if (shipment.rawShipment?.additionalChargesDetails) {
    const charges = shipment.rawShipment.additionalChargesDetails;
    return (
      (charges.shipping || 0) +
      (charges.handling || 0) +
      (charges.packing || 0) +
      (charges.service || 0) +
      (charges.other || 0)
    );
  }
  // Fallback to shipment level
  if (shipment.additionalChargesDetails) {
    const charges = shipment.additionalChargesDetails;
    return (
      (charges.shipping || 0) +
      (charges.handling || 0) +
      (charges.packing || 0) +
      (charges.service || 0) +
      (charges.other || 0)
    );
  }
  return shipment.deliveryCharge || 0;
};

  // Handle export to PDF
// Handle export to Excel
const handleExportExcel = async () => {
  if (selectedRowIds.size === 0) {
    toast.error("Please select at least one shipment to export");
    return;
  }
  try {
    const dataToExport = selectedRowIds.size > 0
      ? filteredShipments.filter(s => selectedRowIds.has(s._id))
      : filteredShipments;

    if (dataToExport.length === 0) {
      toast.error("No shipments to export");
      return;
    }

    // Helper function to get document number based on transport mode
    const getDocumentNumberForExport = (shipment) => {
      if (shipment.subMode === 'LR') {
        return shipment.lrNo || 'N/A';
      } else if (shipment.subMode === 'RR') {
        return shipment.railwayReceiptNo || 'N/A';
      } else if (shipment.transportMode === 'railways') {
        return shipment.railwayReceiptNo || 'N/A';
      }
      return 'N/A';
    };

    // Helper function to get transport details
    const getTransportDetailsForExport = (shipment) => {
      if (shipment.subMode === 'LR') {
        return `Transporter: ${shipment.transporter?.name || 'N/A'} | Driver: ${shipment.driver?.name || 'N/A'} | Vehicle: ${shipment.vehicle?.number || 'N/A'}`;
      } else if (shipment.subMode === 'RR') {
        return `Train: ${shipment.trainNo || 'N/A'} | Wagon: ${shipment.wagonNo || 'N/A'}`;
      } else if (shipment.transportMode === 'railways') {
        const trainNo = shipment.rawShipment?.railwayTrainNo || shipment.trainNo || 'N/A';
        const wagonNo = shipment.rawShipment?.railwayWagonNo || shipment.wagonNo || 'N/A';
        return `Train: ${trainNo} | Wagon: ${wagonNo}`;
      }
      return 'N/A';
    };

    // Helper function to get transport mode label
    const getTransportModeLabelForExport = (shipment) => {
      if (shipment.transportMode === 'roadways') {
        if (shipment.subMode === 'LR') {
          return 'Roadways (Truck)';
        } else if (shipment.subMode === 'RR') {
          return 'Railways (Train)';
        }
        return 'Roadways';
      } else if (shipment.transportMode === 'railways') {
        return 'Railways (Train)';
      }
      return shipment.transportMode || 'N/A';
    };

    // Define columns for Excel - ADDED Document No. column
    const tableColumns = [
      // "S.No",
      "Shipment No.",
      "Invoice No.",
      "Transport Mode",
      "Document No.",        // NEW COLUMN
      "Transport Details",   // NEW COLUMN for detailed info
      "Customer",
      "Delivery Address",
      "Total Amount",
      "Delivery Charge",
      "Status"
    ];

    // Prepare table rows with new columns
    const tableRows = dataToExport.map((shipment, index) => [
      // index + 1,
      shipment.shipmentNo || "-",
      shipment.invoiceNo || "-",
      getTransportModeLabelForExport(shipment),
      getDocumentNumberForExport(shipment),           // Document No.
      getTransportDetailsForExport(shipment),         // Transport Details
      shipment.customer || "-",
      shipment.deliveryAddress?.substring(0, 50) || "N/A",
      `₹${(shipment.totalAmount || 0).toFixed(2)}`,
      `₹${(calculateDeliveryChargeForExport(shipment)).toFixed(2)}`,
      STATUS_DISPLAY[shipment.status]?.label || shipment.status || "N/A"
    ]);

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Shipments");

    // Add header row with styling
    const headerRow = worksheet.addRow(tableColumns);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "99c5ff" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.font = { bold: true };
    });

    // Set column widths (adjusted for new columns)
    [8, 18, 18, 18, 20, 35, 25, 35, 15, 15, 15].forEach((width, i) => {
      worksheet.getColumn(i + 1).width = width;
    });

    // Add data rows
    tableRows.forEach((row) => worksheet.addRow(row));

    // Generate filename
    const filename = `shipments-${dataToExport.length}-${format(new Date(), 'yyyy-MM-dd')}`;

    // Generate and download Excel file
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${filename}.xlsx`
    );

    toast.success(`Exported ${dataToExport.length} shipment(s) as Excel`);

  } catch (error) {
    toast.error(error?.message || "Failed to generate Excel file");
  }
};

  // Select all checkbox effect
  useEffect(() => {
    const allPageIds = filteredShipments.map(s => s._id);
    const allSelected = allPageIds.length > 0 && allPageIds.every(id => selectedRowIds.has(id));
    setSelectAllGlobal(allSelected);
  }, [selectedRowIds, filteredShipments]);

  const handleRowClick = (shipment) => {
    setSelectedShipment(shipment);
    setOpenDetailsModal(true);
  };

  // Close details modal
  const closeDetailsModal = () => {
    setOpenDetailsModal(false);
    setSelectedShipment(null);
  };

  // Handle preview invoice when clicking on invoice number
  const handlePreviewInvoice = async (shipment) => {
    // Check if invoiceId exists in shipment
    if (shipment.invoiceId) {
      try {
        const response = await api.get(`/api/invoices/${shipment.invoiceId}`);
        if (response.data.success) {
          const invoiceData = response.data.invoice;

          // Get customer data from the invoice (this will be the consignee/receiver)
          let customerForPreview = null;

          if (invoiceData.customerId) {
            // If invoice has customerId populated
            const cust = invoiceData.customerId;
            const addressParts = [];
            if (cust.address) addressParts.push(cust.address);
            if (cust.city) addressParts.push(cust.city);
            if (cust.state) addressParts.push(cust.state);
            if (cust.country) addressParts.push(cust.country);
            if (cust.pincode) addressParts.push(cust.pincode);

            customerForPreview = {
              name: cust.name || '',
              phone: cust.phone || '',
              address: addressParts.join(", ") || cust.address || '',
              email: cust.email || '',
              gstin: cust.gstin || ''
            };
          } else {
            // Fallback to shipment's consignee data
            customerForPreview = {
              name: shipment.customerData?.name || '',
              phone: shipment.customerData?.phone || '',
              address: shipment.customerData?.address || '',
              email: shipment.customerData?.email || '',
              gstin: shipment.customerData?.gstin || ''
            };
          }

          setSelectedInvoiceForPreview({
            invoiceId: shipment.invoiceId,
            invoiceData: invoiceData,
            customerData: customerForPreview  // Use the correct customer data
          });
          setShowPreviewModal(true);
        }
      } catch (error) {
        toast.error("Failed to fetch invoice details");
      }
    } else if (shipment.rawShipment?.invoiceId) {
      // Similar handling for rawShipment
      try {
        const response = await api.get(`/api/invoices/${shipment.rawShipment.invoiceId}`);
        if (response.data.success) {
          const invoiceData = response.data.invoice;
          let customerForPreview = null;

          if (invoiceData.customerId) {
            const cust = invoiceData.customerId;
            const addressParts = [];
            if (cust.address) addressParts.push(cust.address);
            if (cust.city) addressParts.push(cust.city);
            if (cust.state) addressParts.push(cust.state);
            if (cust.country) addressParts.push(cust.country);
            if (cust.pincode) addressParts.push(cust.pincode);

            customerForPreview = {
              name: cust.name || '',
              phone: cust.phone || '',
              address: addressParts.join(", ") || cust.address || '',
              email: cust.email || '',
              gstin: cust.gstin || ''
            };
          } else {
            customerForPreview = {
              name: shipment.customerData?.name || '',
              phone: shipment.customerData?.phone || '',
              address: shipment.customerData?.address || '',
              email: shipment.customerData?.email || '',
              gstin: shipment.customerData?.gstin || ''
            };
          }

          setSelectedInvoiceForPreview({
            invoiceId: shipment.rawShipment.invoiceId,
            invoiceData: invoiceData,
            customerData: customerForPreview
          });
          setShowPreviewModal(true);
        }
      } catch (error) {
        toast.error("Failed to fetch invoice details");
      }
    } else {
      toast.error("No invoice associated with this shipment");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuIndex(null);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setOpenStatusDropdownId(null);
      }
      // Add this for details modal
      if (openDetailsModal && detailsRef.current && !detailsRef.current.contains(e.target)) {
        setOpenDetailsModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDetailsModal]);

  return (
    <div className="p-4" style={{ fontFamily: '"Inter", sans-serif' }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: '33px',
          }}
        >
          <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
            Shipments
          </h3>
        </div>

        <div className="d-flex align-items-center gap-3" style={{ cursor: "pointer" }}>
          {/* <DateFilterDropdown onChange={handleDateChange} /> */}
          <DateFilterDropdown
            // onChange={handleDateChange}
            selectedDateRange={dateRange}
            setSelectedDateRange={setDateRange}
          />
          {hasPermission(user, "shipments", "create") && (
            <Link to="/create-shipments">
              <button
                title="Create Quotation"
                className="button-hover"
                style={{
                  borderRadius: "8px",
                  padding: "5px 16px",
                  border: "1px solid #1F7FFF",
                  color: "rgb(31, 127, 255)",
                  fontFamily: "Inter",
                  backgroundColor: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                + Create Shipments
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        overflowX: "auto",
        width: "100%",
        padding: 16,
        background: "white",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {/* Tabs + Search + Export */}
        <div className="d-flex gap-3 align-items-center justify-content-between w-100 flex-wrap">
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div style={{
              background: "#F3F8FB",
              padding: 3,
              borderRadius: 8,
              display: "flex",
              gap: 8,
              overflowX: "auto",
              height: "38px",
            }}>
              {tabsData.map((tab) => (
                <div
                  key={tab.label}
                  onClick={() => setActiveTab(tab.label)}
                  role="button"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    background: activeTab === tab.label ? "#fff" : "transparent",
                    boxShadow: activeTab === tab.label ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ fontSize: 14, color: "#0E101A" }}>{tab.label}</span>
                  <span style={{ color: "#727681", fontSize: 14 }}>{tabCounts[tab.label] || 0}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", height: "38px" }}>
            <div style={{
              position: "relative",
              padding: "8px 16px",
              display: "flex",
              borderRadius: 8,
              alignItems: "center",
              background: "#FCFCFC",
              border: "1px solid #EAEAEA",
              gap: "5px",
            }}>
              <FiSearch className="fs-5" />
              <input
                type="search"
                style={{
                  width: "250px",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                }}
                placeholder="Search by shipment, invoice, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {hasPermission(user, "Shipments", "export") && (
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "8px 16px",
                  background: "#FCFCFC",
                  borderRadius: 8,
                  border: "1px solid #EAEAEA",
                  fontSize: 14,
                  fontWeight: 400,
                  color: "#0E101A",
                  cursor: filteredShipments.length > 0 ? "pointer" : "not-allowed",
                  opacity: filteredShipments.length > 0 ? 1 : 0.5,
                }}
                onClick={handleExportExcel}
                disabled={filteredShipments.length === 0}
              >
                <TbFileExport className="fs-5" style={{ color: "#6C748C" }} />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 310px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "#F3F8FB" }}>
              <tr>
                <th style={{ padding: "12px 8px", width: 40 }}>
                  <input type="checkbox" checked={selectAllGlobal} onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRowIds(new Set(filteredShipments.map(s => s._id)));
                    } else {
                      setSelectedRowIds(new Set());
                    }
                  }} />
                </th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Shipment No.</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Transport Mode</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Document No.</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Customer</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Delivery Address</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Dispatch Date</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Invoice No.</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Total Amount</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Delivery Charge</th>
                <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 400 }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "center", fontWeight: 400 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 40, textAlign: "center", color: "#FF441F" }}>
                    No Shipments Found
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment, idx) => {
                  const statusInfo = STATUS_DISPLAY[shipment.status] || STATUS_DISPLAY.assigned;
                  // Get document number based on transport mode
                  const getDocumentNumber = () => {
                    if (shipment.subMode === 'LR') {
                      return shipment.lrNo || 'N/A';
                    } else if (shipment.subMode === 'RR') {
                      return shipment.railwayReceiptNo || 'N/A';
                    } else if (shipment.transportMode === 'railways') {
                      return shipment.railwayReceiptNo || 'N/A';
                    }
                    return 'N/A';
                  };

                  const getTransportDetails = () => {
                    if (shipment.subMode === 'LR') {
                      return `Transport: ${shipment.transporter?.name || 'N/A'} | Driver: ${shipment.driver?.name || 'N/A'}`;
                    } else if (shipment.subMode === 'RR') {
                      return `Train: ${shipment.trainNo || 'N/A'} | Wagon: ${shipment.wagonNo || 'N/A'}`;
                    } else if (shipment.transportMode === 'railways') {
                      // Use railwayTrainNo and railwayWagonNo from raw shipment
                      const trainNo = shipment.rawShipment?.railwayTrainNo || shipment.trainNo || 'N/A';
                      const wagonNo = shipment.rawShipment?.railwayWagonNo || shipment.wagonNo || 'N/A';
                      return `Train: ${trainNo} | Wagon: ${wagonNo}`;
                    }
                    return 'N/A';
                  };
                  return (
                    <tr key={shipment._id} style={{ borderBottom: "1px solid #EAEAEA", cursor: "pointer" }} onClick={() => handleRowClick(shipment)}>
                      <td style={{ padding: "12px 8px" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.has(shipment._id)}
                          onChange={(e) => {
                            const next = new Set(selectedRowIds);
                            if (e.target.checked) next.add(shipment._id);
                            else next.delete(shipment._id);
                            setSelectedRowIds(next);
                          }}
                        />
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500, color: "#1F7FFF" }}>
                        {shipment.shipmentNo}
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          backgroundColor: shipment.transportMode === 'roadways' ? "#E8F5E9" : "#E3F2FD",
                          color: shipment.transportMode === 'roadways' ? "#2E7D32" : "#1565C0",
                          fontSize: "12px",
                          fontWeight: 500
                        }}>
                          {shipment.transportMode}
                          {/* {shipment.subMode && ` (${shipment.subMode})`} */}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        <div>
                          <strong>{getDocumentNumber()}</strong>
                          <div style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                            {getTransportDetails()}
                          </div>
                        </div>
                      </td>

                      {/* <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        <div>
                          <div>{shipment.transporter?.name}</div>
                          <small style={{ color: "#666" }}>{shipment.driver?.name}</small>
                        </div>
                      </td> */}
                      <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        {shipment.customer}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, maxWidth: 250 }}>
                        {shipment.deliveryAddress?.substring(0, 60)}...
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        {new Date(shipment.dispatchDate).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#1F7FFF", cursor: "pointer", textDecoration: "underline" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewInvoice(shipment);
                        }}>
                        {shipment.invoiceNo}
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 500 }}>
                        ₹{(shipment.rawShipment?.grandTotal || shipment.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        ₹{(shipment.rawShipment?.additionalCharges ||
                          (shipment.rawShipment?.freightCharge || 0) + (shipment.rawShipment?.otherCharges || 0) || 0).toLocaleString('en-IN')}
                      </td>

                      {/* <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              setOpenStatusDropdownId(openStatusDropdownId === shipment._id ? null : shipment._id);
                              const dropdownHeight = 350;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;

                              if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                                setOpenUpwards(true);
                                setDropdownPos({ x: rect.left, y: rect.top - 6 });
                              } else {
                                setOpenUpwards(false);
                                setDropdownPos({ x: rect.left, y: rect.bottom + 6 });
                              }
                            }}
                            style={{
                              background: statusInfo.bgColor,
                              color: statusInfo.color,
                              border: "none",
                              borderRadius: "50px",
                              padding: "5px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "13px",
                              cursor: "pointer",
                              minWidth: "120px",
                              justifyContent: "space-between"
                            }}
                            disabled={updatingStatusId === shipment._id}
                          >
                            {updatingStatusId === shipment._id ? (
                              <div className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
                            ) : (
                              <>
                                {statusInfo.label}
                                <RiArrowDropDownLine size={18} />
                              </>
                            )}
                          </button>

                          {openStatusDropdownId === shipment._id && (
                            <div
                              ref={statusDropdownRef}
                              style={{
                                position: "fixed",
                                top: openUpwards ? dropdownPos.y - 260 : dropdownPos.y,
                                left: dropdownPos.x - 100,
                                background: "white",
                                borderRadius: 12,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                zIndex: 10000,
                                minWidth: 160,
                                overflow: "hidden",
                                padding: "8px 0",
                              }}
                            >
                              {[
                                { value: "assigned", label: "Assigned" },
                                { value: "in_transit", label: "In Transit" },
                                { value: "out_for_delivery", label: "Out for Delivery" },
                                { value: "delivered", label: "Delivered" },
                                { value: "failed", label: "Failed" },
                                { value: "cancelled", label: "Cancelled" }
                              ].map((statusOption) => {
                                const statusColor = STATUS_DISPLAY[statusOption.value]?.color || "#333";
                                const statusBgColor = STATUS_DISPLAY[statusOption.value]?.bgColor || "transparent";

                                return (
                                  <div
                                    key={statusOption.value}
                                    onClick={() => updateShipmentStatus(shipment._id, statusOption.value)}
                                    style={{
                                      padding: "10px 16px",
                                      cursor: "pointer",
                                      fontSize: 14,
                                      transition: "0.2s",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      backgroundColor: shipment.status === statusOption.value ? "#EAF3FF" : "transparent"
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = shipment.status === statusOption.value ? "#EAF3FF" : "transparent")}
                                  >
                                    <span
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        backgroundColor: statusColor,
                                        display: "inline-block"
                                      }}
                                    />
                                    <span style={{ color: statusColor }}>{statusOption.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td> */}
                      <td style={{ padding: "12px 16px" }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();

                              // Don't allow opening dropdown for terminal statuses
                              const terminalStatuses = ['delivered', 'cancelled'];
                              if (terminalStatuses.includes(shipment.status)) {
                                toast.info(`Shipment is ${shipment.status} and cannot be changed further`);
                                return;
                              }

                              const rect = e.currentTarget.getBoundingClientRect();
                              setOpenStatusDropdownId(openStatusDropdownId === shipment._id ? null : shipment._id);
                              const dropdownHeight = 350;
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const spaceAbove = rect.top;

                              if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                                setOpenUpwards(true);
                                setDropdownPos({ x: rect.left, y: rect.top - 6 });
                              } else {
                                setOpenUpwards(false);
                                setDropdownPos({ x: rect.left, y: rect.bottom + 6 });
                              }
                            }}
                            style={{
                              background: statusInfo.bgColor,
                              color: statusInfo.color,
                              border: "none",
                              borderRadius: "50px",
                              padding: "5px 12px",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "13px",
                              cursor: ['delivered', 'cancelled'].includes(shipment.status) ? "not-allowed" : "pointer",
                              minWidth: "120px",
                              justifyContent: "space-between",
                              opacity: ['delivered', 'cancelled'].includes(shipment.status) ? 0.7 : 1
                            }}
                            disabled={updatingStatusId === shipment._id || ['delivered', 'cancelled'].includes(shipment.status)}
                          >
                            {updatingStatusId === shipment._id ? (
                              <div className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
                            ) : (
                              <>
                                {statusInfo.label}
                                {!['delivered', 'cancelled'].includes(shipment.status) && <RiArrowDropDownLine size={18} />}
                              </>
                            )}
                          </button>

                          {openStatusDropdownId === shipment._id && !['delivered', 'cancelled'].includes(shipment.status) && (
                            <div
                              ref={statusDropdownRef}
                              style={{
                                position: "fixed",
                                top: openUpwards ? dropdownPos.y - 260 : dropdownPos.y,
                                left: dropdownPos.x - 100,
                                background: "white",
                                borderRadius: 12,
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                zIndex: 10000,
                                minWidth: 180,
                                overflow: "hidden",
                                padding: "8px 0",
                              }}
                            >
                              {/* to change */}
                              {getAllowedNextStatuses(shipment.status).map((statusOption) => {
                                const statusColor = STATUS_DISPLAY[statusOption.value]?.color || "#333";
                                return (
                                  <div
                                    key={statusOption.value}
                                    onClick={() => {
                                      // For cancelled status, show modal instead of prompt
                                      if (statusOption.value === 'cancelled') {
                                        setSelectedShipmentForCancel(shipment);
                                        setCancelReason("");
                                        setShowCancelModal(true);
                                        setOpenStatusDropdownId(null);
                                      } else {
                                        updateShipmentStatus(shipment._id, statusOption.value);
                                      }
                                    }}
                                    style={{
                                      padding: "10px 16px",
                                      cursor: "pointer",
                                      fontSize: 14,
                                      transition: "0.2s",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "10px",
                                      backgroundColor: shipment.status === statusOption.value ? "#EAF3FF" : "transparent"
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = shipment.status === statusOption.value ? "#EAF3FF" : "transparent")}
                                  >
                                    <span
                                      style={{
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        backgroundColor: statusColor,
                                        display: "inline-block"
                                      }}
                                    />
                                    <span style={{ color: statusColor }}>{statusOption.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setOpenMenuIndex(openMenuIndex === shipment._id ? null : shipment._id);
                            const dropdownHeight = 150;
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;
                            if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                              setOpenUpwards(true);
                              setDropdownPos({ x: rect.left, y: rect.top - 6 });
                            } else {
                              setOpenUpwards(false);
                              setDropdownPos({ x: rect.left, y: rect.bottom + 6 });
                            }
                          }}
                          style={{ background: "none", border: "none", cursor: "pointer" }}
                        >
                          <HiOutlineDotsHorizontal size={20} color="#666" />
                        </button>

                        {openMenuIndex === shipment._id && (
                          <div
                            ref={menuRef}
                            style={{
                              position: "fixed",
                              top: openUpwards ? dropdownPos.y - 100 : dropdownPos.y,
                              left: dropdownPos.x - 80,
                              background: "white",
                              borderRadius: 8,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              zIndex: 10000,
                              minWidth: 150,
                              padding: "8px 0",
                            }}
                          >
                            {menuItems.map((item) => (
                              <div
                                key={item.action}
                                onClick={() => handleMenuAction(item.action, shipment)}
                                style={{
                                  padding: "8px 16px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                  fontSize: 14,
                                  transition: "0.2s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                {item.icon}
                                <span>{item.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          total={total}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
          onItemsPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {openDetailsModal && selectedShipment && (
        <>
          <div
            onClick={closeDetailsModal}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 9998,
            }}
          />
          <div
            ref={detailsRef}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "740px",
              height: "100vh",
              background: "white",
              boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
              zIndex: 9999,
              overflowY: "auto",
            }}
          >
            <ShipmentsDetailsView
              data={selectedShipment}
              onClose={closeDetailsModal}
              onEdit={() => {
                closeDetailsModal();
              }}
            />
          </div>
        </>
      )}

      {showAssignModal && selectedShipmentForTransport && (
        <InvoiceAssignTransportModal
          show={showAssignModal}
          closeModal={() => {
            setShowAssignModal(false);
            setSelectedShipmentForTransport(null);
          }}
          invoice={selectedShipmentForTransport}
          onSuccess={() => {
            fetchShipments(); // Refresh the list
            setShowAssignModal(false);
            setSelectedShipmentForTransport(null);
          }}
        />
      )}

      {/* Preview Invoice Modal */}
      {showPreviewModal && selectedInvoiceForPreview && (
        <PreviewInvoice
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedInvoiceForPreview(null);
          }}
          invoiceId={selectedInvoiceForPreview.invoiceId}
          invoiceData={selectedInvoiceForPreview.invoiceData}
          customerData={selectedInvoiceForPreview.customerData}
          companyData={null}
        />
      )}
      {/* Cancellation reason modal */}
      <CancelReasonModal
  isOpen={showCancelModal}
  onClose={() => {
    setShowCancelModal(false);
    setSelectedShipmentForCancel(null);
    setCancelReason("");
  }}
  onConfirm={async (reason) => {
    if (selectedShipmentForCancel) {
      setIsSubmittingCancel(true);
      try {
        await updateShipmentStatus(selectedShipmentForCancel._id, 'cancelled', reason);
        setShowCancelModal(false);
        setSelectedShipmentForCancel(null);
        setCancelReason("");
      } finally {
        setIsSubmittingCancel(false);
      }
    }
  }}
  shipmentNo={selectedShipmentForCancel?.shipmentNo}
  isSubmitting={isSubmittingCancel}
/>
    </div>
  );
}




