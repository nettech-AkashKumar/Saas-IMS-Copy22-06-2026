import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaBoxOpen,
  FaBuilding,
  FaExchangeAlt,
  FaTruck,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../pages/config/axiosInstance";

// Modernized theme configuration & input layout styles
const inputStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  padding: "10px 14px",
  width: "100%",
  fontSize: "14px",
  color: "#1E293B",
  backgroundColor: "#FFFFFF",
  transition: "all 0.2s ease-in-out",
  outline: "none",
};

const textareaStyle = {
  border: "1px solid #E2E8F0",
  borderRadius: "8px",
  padding: "10px 14px",
  width: "100%",
  minHeight: "45px",
  fontSize: "14px",
  color: "#1E293B",
  backgroundColor: "#FFFFFF",
  transition: "all 0.2s ease-in-out",
  outline: "none",
};

const labelStyle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#475569",
  marginBottom: "6px",
  display: "block",
};

export default function CreateEwayBill() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [transporters, setTransporters] = useState([]);
 

  const [form, setForm] = useState({
    dbName: localStorage.getItem("dbName") || "",
    transactionType: "outward",
    subType: "Supply",
    subSupplyDescription: "",
    documentType: "Delivery Challan",
    documentNo: "",
    documentDate: "",
    // 2.1 Bill From Entity
    BillFromSenderName: "",
    BillFromSenderGSTIN: "",
    BillFromSenderState: "",
    // 2.2 Dispatch Origin Address
    DispatchAddress: "",
    DispatchPlace: "",
    DispatchPincode: "",
    DispatchDistrict: "",
    fromName: "",
    fromGSTIN: "",
    fromState: "",
    dispatchAddress: "",
    dispatchAddress2: "",
    dispatchPlace: "",
    dispatchPincode: "",
    dispatchDistrict: "",
    toName: "",
    toGSTIN: "",
    toState: "",
    shipAddress: "",
    shipAddress2: "",
    shipPlace: "",
    shipPincode: "",
    shipDistrict: "",
    productName: "",
    description: "",
    hsn: "",
    qty: "",
    unit: "BOX",
    taxableValue: "",
    cgst: "",
    sgst: "",
    igst: "",
    cess: "",
    otherValue: "0",
    transporterName: "",
    transporterId: "",
    transportMode: "1",
    distance: "",
    vehicleType: "R",
    vehicleNo: "",
    transporterDocNo: "",
    transporterDocDate: "",
    transactionTypeCode: "1",
    cessNonAdvolValue: "0",
    generateStatus: "1",
    userRef: "",
    locationCode: "",
    ewayBillStatus: "ABC",
    autoPrint: "N",
    email: "",
    deleteRecord: "N",
  });

  // Effect to automatically parse and populate state data transmitted from the Delivery Challan List
useEffect(() => {
  if (location.state?.sourceDeliveryChallan) {
    const challan = location.state.sourceDeliveryChallan;

    // Pull and fallback the first active index entity arrays safe metrics
    const primaryItem = challan.items?.[0] || {};

    // Compute document dates to YYYY-MM-DD input formats smoothly
    let mappedDate = "";
    if (challan.challanDate) {
      try {
        mappedDate = new Date(challan.challanDate)
          .toISOString()
          .split("T")[0];
      } catch (e) {
        console.error("Invalid challan date structural parsed attempt:", e);
      }
    }

    setForm((prev) => ({
      ...prev,
      transactionType: "outward",
      subType: challan.purposeOfMovement || "Supply",
      documentType: challan.documentType || "Delivery Challan",
      documentNo: challan.challanNo || "",
      documentDate: mappedDate,

      // Origin Entity parameters mappings
      // BILL FROM
      BillFromSenderName: challan.fromName || challan.companyName || "",
      BillFromSenderGSTIN: challan.fromGstin || challan.gstin || "",
      BillFromSenderState: challan.fromState || challan.state || "",

      // DISPATCH
      DispatchAddress: challan.fromAddress || challan.dispatchAddress || "",
      DispatchPlace: challan.fromPlace || challan.dispatchPlace || "",
      DispatchPincode: challan.fromPincode || challan.dispatchPincode || "",
      DispatchDistrict: challan.dispatchDistrict || challan.fromDistrict || "",

      // Client / Destination Entity parameters mappings
      toName: challan.customerId?.name || challan.toName || "",
      toGSTIN: challan.customerGstin || challan.customerId?.gstin || "",
      toState: challan.customerState || challan.customerId?.state || "",
      shipAddress: challan.toAddress || "",
      shipPlace: challan.customerCity || "",
      shipPincode: challan.customerPincode || "",

      // Consignment Core Parameters
      productName:
        primaryItem.itemName ||
        primaryItem.name ||
        primaryItem.productName ||
        "",
      description: primaryItem.description || "",
      hsn: primaryItem.hsnCode || primaryItem.hsn || "",
      qty: primaryItem.qty || primaryItem.quantity || "",
      unit: primaryItem.unit || "BOX",
      taxableValue: challan.totalTaxableValue || primaryItem.taxableAmount || "",

      // Logistics configuration updates
      vehicleNo: challan.vehicleId?.vehicleNumber || challan.vehicleNo || "",
      transporterName:
        challan.transporterId?.transporterName ||
        challan.transporterName ||
        "",
      transporterDocNo: challan.transporterDocNo || "",
    }));
  } 
  // ADDED: Autofill data mappings when redirected from Sales Invoice
  else if (location.state?.sourceInvoice) {
    const invoice = location.state.sourceInvoice;
    
    // Support either structured items or fallback arrays inside database model structures
    const invoiceItems = invoice.items || invoice.itemList || [];
    const primaryItem = invoiceItems[0] || {};

    let mappedInvoiceDate = "";
    if (invoice.invoiceDate) {
      try {
        mappedInvoiceDate = new Date(invoice.invoiceDate)
          .toISOString()
          .split("T")[0];
      } catch (e) {
        console.error("Invalid invoice date parsed attempt:", e);
      }
    }

    setForm((prev) => ({
      ...prev,
      transactionType: "outward",
      subType: "Supply",
      documentType: "Tax Invoice",
      documentNo: invoice.invoiceNo || "",
      documentDate: mappedInvoiceDate,

      // Receiver Fields (Bill To / Ship To Details mapped from customer record inside reference)
      toName: invoice.customerId?.name || "",
      toGSTIN: invoice.customerId?.gstin || invoice.customerGstin || "",
      toState: invoice.customerId?.state || invoice.customerState || "",
      shipAddress: invoice.customerId?.address || invoice.shippingAddress || "",
      shipPlace: invoice.customerId?.city || invoice.customerCity || "",
      shipPincode: invoice.customerId?.pincode || invoice.customerPincode || "",
      shipDistrict: invoice.customerId?.district || "",

      // Consignment Product Details
      productName: primaryItem.name || primaryItem.productName || primaryItem.itemName || "",
      description: primaryItem.description || "",
      hsn: primaryItem.hsnCode || primaryItem.hsn || "",
      qty: primaryItem.qty || primaryItem.quantity || "",
      unit: primaryItem.unit || "PCS",
      taxableValue: invoice.taxableAmount || primaryItem.taxableAmount || invoice.grandTotal || "",

      // Dynamic Tax Rates Extraction
      cgst: primaryItem.cgstRate || primaryItem.cgst || "",
      sgst: primaryItem.sgstRate || primaryItem.sgst || "",
      igst: primaryItem.igstRate || primaryItem.igst || "",

      // Logistics & Transporter fallbacks if predefined inside Invoice model
      vehicleNo: invoice.vehicleNo || "",
      transporterName: invoice.transporterName || "",
      transporterDocNo: invoice.transporterDocNo || "",
    }));
  }
}, [location.state]);

  // Fast, synchronous text updating
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Safe side-effect: Automated distance calculation isolated from UI inputs
  useEffect(() => {
    const from = form.dispatchPincode?.trim();
    const to = form.shipPincode?.trim();

    if (/^\d{6}$/.test(from) && /^\d{6}$/.test(to)) {
      api
        .get("/api/ewaybill/distance", {
          params: { from, to },
          headers: { "x-tenant-db": form.dbName },
        })
        .then((res) => {
          if (res.data?.distance) {
            setForm((current) => ({
              ...current,
              distance: String(res.data.distance),
            }));
          }
        })
        .catch((err) => {
          console.error("Distance lookup error:", err.message);
        });
    }
  }, [form.dispatchPincode, form.shipPincode, form.dbName]);

  // settings through data fetch in Dispatch From Details
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const res = await api.get(`/api/companyprofile/get?t=${Date.now()}`);

        const data = res?.data?.data || res?.data;

        // company profile formData
        setForm((prev) => ({
          ...prev,

          // 2.1 Bill From Entity
          BillFromSenderName: data?.companyName || "",
          BillFromSenderGSTIN: data?.gstin || "",
          BillFromSenderState: data?.state || "",

          // 2.2 Dispatch Origin Address
          DispatchAddress: data?.companyaddress || "",
          DispatchPlace: data?.district || "",
          DispatchPincode: data?.pincode || "",
          DispatchDistrict: data?.district || "",
        }));
      } catch (error) {
        console.log("Error fetching company profile:", error);
      }
    };

    fetchCompanyProfile();
  }, []);


useEffect(() => {
  const sourceDC = location.state?.sourceDeliveryChallan;

  if (sourceDC?._id) {
    setForm((prev) => ({
      ...prev,
      deliveryChallanId: sourceDC._id,
    }));
  }
}, [location.state]); // 👈 FIXED



  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await api.get("/api/customers");

        // backend response safe handling
        const customerData =
          res?.data?.customers || res?.data?.data || res?.data || [];

        setCustomers(customerData);
      } catch (error) {
        console.log("Customer fetch error:", error);
      }
    };

    fetchCustomers();
  }, []);

  const handleCustomerSelect = (e) => {
    const customerId = e.target.value;

    const selectedCustomer = customers.find((cust) => cust._id === customerId);

    if (!selectedCustomer) return;

    // setForm((prev) => ({
    //   ...prev,

    //   // Bill To
    //   toName: selectedCustomer.name || "",
    //   toGSTIN: selectedCustomer.gstin || "",
    //   toState: selectedCustomer.state || "",

    //   // Shipping
    //   shipAddress: selectedCustomer.address || "",
    //   shipAddress2: selectedCustomer.address2 || "",
    //   shipPlace: selectedCustomer.city || "",
    //   shipPincode: selectedCustomer.pincode || "",
    //   shipDistrict: selectedCustomer.district || "",

    //   // Optional
    //   email: selectedCustomer.email || "",
    //   phone: selectedCustomer.phone || "",
    // }));
   setForm((prev) => ({
  ...prev,
  selectedCustomer: customerId,
  toName: selectedCustomer.name || "",
  toGSTIN: selectedCustomer.gstin || "",
  toState: selectedCustomer.state || "",
  shipAddress: selectedCustomer.address || "",
  shipAddress2: selectedCustomer.address2 || "",
  shipPlace: selectedCustomer.city || "",
  shipPincode: selectedCustomer.pincode || "",
  shipDistrict: selectedCustomer.district || "",
}));
 
  };


  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products");

        const productData =
          res?.data?.products || res?.data?.data || res?.data || [];

        setProducts(productData);
      } catch (error) {
        console.log("Product fetch error:", error);
      }
    };

    fetchProducts();
  }, []);
  const handleProductSelect = (e) => {
    const productId = e.target.value;

    const selectedProduct = products.find(
      (product) => product._id === productId,
    );

    if (!selectedProduct) return;

    // first variant
    const firstVariant = selectedProduct.variants?.[0] || {};

    setForm((prev) => ({
      ...prev,
        
      selectedProduct: productId,
      // product
      productName: selectedProduct.productName || "",

      description: selectedProduct.description || "",

      // HSN
      hsn: selectedProduct.hsn?.hsnCode || selectedProduct.hsn || "",

      // qty
      qty:
        firstVariant.stockQuantity ||
        selectedProduct.legacy_stockQuantity ||
        "",

      // unit
      unit: firstVariant.unit || selectedProduct.legacy_unit || "PCS",

      // price
      taxableValue:
        firstVariant.sellingPrice || selectedProduct.legacy_sellingPrice || "",
    }));
  };
  useEffect(() => {
    const fetchTransporters = async () => {
      try {
        const res = await api.get("/api/transporter/get");

        const transporterData =
          res?.data?.transporters || res?.data?.data || res?.data || [];

        setTransporters(transporterData);
      } catch (error) {
        console.log("Transporter fetch error:", error);
      }
    };

    fetchTransporters();
  }, []);
  const handleTransporterSelect = (e) => {
    const transporterId = e.target.value;

    const selectedTransporter = transporters.find(
      (transporter) => transporter._id === transporterId,
    );

    if (!selectedTransporter) return;

    // first assigned vehicle
    const assignedVehicle = selectedTransporter?.assignVehicleID?.[0] || {};

    setForm((prev) => ({
      ...prev,

        selectedTransporter: transporterId,
      // transporter
      transporterName: selectedTransporter.transporterName || "",

      transporterId: selectedTransporter.transporterID || "",

      // GST
      transporterGST: selectedTransporter.transporterGST || "",

      // vehicle
      vehicleNo: assignedVehicle.vehicleNumber || prev.vehicleNo || "",

      // optional
      transporterDocNo: prev.transporterDocNo || `LR-${Date.now()}`,
    }));
  };

 const handleSubmit = async () => {
  try {
    setLoading(true);

    const isInterState =
      form.BillFromSenderState
        ?.trim()
        ?.toLowerCase() !==
      form.toState
        ?.trim()
        ?.toLowerCase();

    const taxable = Number(
      form.taxableValue || 0
    );

    const cgstRate = isInterState
      ? 0
      : Number(form.cgst || 0);

    const sgstRate = isInterState
      ? 0
      : Number(form.sgst || 0);

    const igstRate = isInterState
      ? Number(form.igst || 0)
      : 0;

    const cessRate = Number(
      form.cess || 0
    );

    const cgstAmount =
      (taxable * cgstRate) / 100;

    const sgstAmount =
      (taxable * sgstRate) / 100;

    const igstAmount =
      (taxable * igstRate) / 100;

    const cessAmount =
      (taxable * cessRate) / 100;

    const totalInvoice =
      taxable +
      cgstAmount +
      sgstAmount +
      igstAmount +
      cessAmount;

  const payload = {
  dbName: form.dbName,

  // FIXED: single source of truth
  deliveryChallanId: form.deliveryChallanId || null,

  userGstin: form.BillFromSenderGSTIN,
  supply_type: form.transactionType,
  sub_supply_type: form.subType,
  sub_supply_description: form.subSupplyDescription,
  document_type: form.documentType,
  document_number: form.documentNo || `INV-${Date.now()}`,
  document_date: form.documentDate
    ? form.documentDate.split("-").reverse().join("/")
    : "",

  gstin_of_consignor: form.BillFromSenderGSTIN,
  legal_name_of_consignor: form.BillFromSenderName,
  address1_of_consignor: form.DispatchAddress,
  address2_of_consignor: "",
  place_of_consignor: form.DispatchPlace,
  pincode_of_consignor: Number(form.DispatchPincode),
  state_of_consignor: form.BillFromSenderState,
  actual_from_state_name: form.BillFromSenderState,

  gstin_of_consignee: form.toGSTIN,
  legal_name_of_consignee: form.toName,
  address1_of_consignee: form.shipAddress,
  address2_of_consignee: form.shipAddress2,
  place_of_consignee: form.shipPlace,
  pincode_of_consignee: Number(form.shipPincode),
  state_of_supply: form.toState,
  actual_to_state_name: form.toState,

  transaction_type: Number(form.transactionTypeCode || 1),

  total_invoice_value: Number(totalInvoice),
  taxable_amount: Number(taxable),
  cgst_amount: Number(cgstAmount),
  sgst_amount: Number(sgstAmount),
  igst_amount: Number(igstAmount),
  cess_amount: Number(cessAmount),

  transporter_id: form.transporterId,
  transporter_name: form.transporterName,

  transportation_mode:
    form.transportMode === "1"
      ? "Road"
      : form.transportMode === "2"
      ? "Rail"
      : form.transportMode === "3"
      ? "Air"
      : "Ship",

  transportation_distance: String(form.distance || "0"),
  vehicle_number: form.vehicleNo,

  vehicle_type:
    form.vehicleType === "R"
      ? "Regular"
      : "Over Dimensional Cargo",

  itemList: [
    {
      product_name: form.productName,
      product_description: form.description || form.productName,
      hsn_code: form.hsn,
      quantity: Number(form.qty),
      unit_of_product: form.unit || "BOX",
      cgst_rate: Number(cgstRate),
      sgst_rate: Number(sgstRate),
      igst_rate: Number(igstRate),
      cess_rate: Number(cessRate || 0),
      cessNonAdvol: Number(form.cessNonAdvolValue || 0),
      taxable_amount: Number(taxable),
    },
  ],
};

    console.log(
      "EWB PAYLOAD =>",
      payload
    );

    const res = await api.post(
      "/api/ewaybill/generate",
      payload,
      {
        headers: {
          "x-tenant-db":
            form.dbName,
        },
      }
    );

    if (
      res.data?.data?.message
        ?.ewayBillNo
    ) {
      alert(
        `EWB Generated Successfully : ${res.data.data.message.ewayBillNo}`
      );
    } else {
      alert(
        res.data?.data?.message ||
          "Generation Failed"
      );
    }
  } catch (err) {
    console.log(
      "EWB GENERATE ERROR =>",
      err
    );

    alert(
      err?.response?.data?.message ||
        "Generation failed"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div
      style={{
        height: "100vh",
        background: "#F8FAFC",
        fontFamily: "'Inter', sans-serif",
      }}
      className="p-4 d-flex flex-column"
    >
      {/* Header section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            style={{
              border: "1px solid #E2E8F0",
              background: "#FFF",
              borderRadius: "8px",
              width: "38px",
              height: "38px",
            }}
            className="d-flex align-items-center justify-content-center text-secondary shadow-sm"
          >
            <FaArrowLeft size={14} />
          </button>
          <div>
            <h4
              className="fw-bold m-0 text-dark"
              style={{ letterSpacing: "-0.5px" }}
            >
              Create E-Way Bill
            </h4>
            <small className="text-muted">
              Generate new movement passes for goods distribution
            </small>
          </div>
        </div>
        <button
          className="btn px-4 fw-medium shadow-sm"
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E2E8F0",
            color: "#475569",
            borderRadius: "8px",
          }}
        >
          Preview Form
        </button>
      </div>

      {/* Main scrolling wrapper container */}
      <div
        style={{
          background: "#FFFFFF",
          padding: "28px",
          borderRadius: "16px",
          flex: 1,
          overflowY: "auto",
          border: "1px solid #E2E8F0",
        }}
        className="shadow-sm"
      >
        {/* SECTION 1: TRANSACTION DETAILS */}
        <div className="mb-5">
          <div
            className="d-flex align-items-center gap-2 mb-3 pb-2"
            style={{ borderBottom: "2px solid #F1F5F9" }}
          >
            <FaExchangeAlt className="text-primary" />
            <h5
              className="m-0 fw-bold text-secondary"
              style={{ fontSize: "16px" }}
            >
              1. Transaction Details
            </h5>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <label style={labelStyle}>Transaction Direction</label>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn flex-fill py-2 text-center transition-all"
                  style={{
                    borderRadius: "8px",
                    fontSize: "14px",
                    border:
                      form.transactionType === "outward"
                        ? "2px solid #3B82F6"
                        : "1px solid #E2E8F0",
                    backgroundColor:
                      form.transactionType === "outward" ? "#EFF6FF" : "#FFF",
                    color:
                      form.transactionType === "outward"
                        ? "#1D4ED8"
                        : "#64748B",
                    fontWeight:
                      form.transactionType === "outward" ? "600" : "400",
                  }}
                  onClick={() =>
                    setForm({ ...form, transactionType: "outward" })
                  }
                >
                  Outward
                </button>
                <button
                  type="button"
                  className="btn flex-fill py-2 text-center transition-all"
                  style={{
                    borderRadius: "8px",
                    fontSize: "14px",
                    border:
                      form.transactionType === "inward"
                        ? "2px solid #3B82F6"
                        : "1px solid #E2E8F0",
                    backgroundColor:
                      form.transactionType === "inward" ? "#EFF6FF" : "#FFF",
                    color:
                      form.transactionType === "inward" ? "#1D4ED8" : "#64748B",
                    fontWeight:
                      form.transactionType === "inward" ? "600" : "400",
                  }}
                  onClick={() =>
                    setForm({ ...form, transactionType: "inward" })
                  }
                >
                  Inward
                </button>
              </div>
            </div>

            <div className="col-md-4">
              <label style={labelStyle}>Sub Supply Type</label>
              <select
                name="subType"
                value={form.subType}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="Supply">Supply</option>
                <option value="Export">Export</option>
                <option value="Import">Import</option>
                <option value="Job Work">Job Work</option>
              </select>
            </div>

            <div className="col-md-4">
              <FormField
                label="Sub Supply Description"
                name="subSupplyDescription"
                placeholder="Enter Description"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <FormField
                label="Document Type"
                name="documentType"
                placeholder="e.g. Tax Invoice"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <FormField
                label="Document Number"
                name="documentNo"
                placeholder="Enter Document No."
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <FormField
                type="date"
                label="Document Date"
                name="documentDate"
                form={form}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: DISPATCH AND ORIGIN INFORMATION */}
        <div className="mb-5">
          <div
            className="d-flex align-items-center gap-2 mb-3 pb-2"
            style={{ borderBottom: "2px solid #F1F5F9" }}
          >
            <FaBuilding className="text-primary" />
            <h5
              className="m-0 fw-bold text-secondary"
              style={{ fontSize: "16px" }}
            >
              2. Dispatch From Details
            </h5>
          </div>

          <div
            className="p-3 mb-4"
            style={{
              borderRadius: "10px",
              border: "1px solid #F1F5F9",
              background: "#F8FAFC",
            }}
          >
            <h6 className="fw-bold mb-3 text-dark" style={{ fontSize: "13px" }}>
              2.1 Bill From Entity
            </h6>
            <div className="row g-3">
              <div className="col-md-4">
                <FormField
                  label="Sender Name"
                  name="BillFromSenderName"
                  placeholder="Legal/Trade Name"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <FormField
                  label="Sender GSTIN"
                  name="BillFromSenderGSTIN"
                  placeholder="15-digit GSTIN"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <FormField
                  label="Sender State"
                  name="BillFromSenderState"
                  placeholder="State Name"
                  form={form}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div
            className="p-3"
            style={{
              borderRadius: "10px",
              border: "1px solid #F1F5F9",
              background: "#F8FAFC",
            }}
          >
            <h6 className="fw-bold mb-3 text-dark" style={{ fontSize: "13px" }}>
              2.2 Dispatch Origin Address
            </h6>
            <div className="row g-3">
              <div className="col-md-3">
                <FormTextArea
                  label="Address Line 1"
                  name="DispatchAddress"
                  placeholder="Building/Floor/Street"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              {/* <div className="col-md-3"><FormTextArea label="Address Line 2" name="DispatchPlace" placeholder="Locality/Area" form={form} onChange={handleChange} /></div> */}
              <div className="col-md-2">
                <FormField
                  label="Dispatch Place"
                  name="DispatchPlace"
                  placeholder="City/Town"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2">
                <FormField
                  label="Pincode"
                  name="DispatchPincode"
                  placeholder="6-digit ZIP"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2">
                <FormField
                  label="District"
                  name="DispatchDistrict"
                  placeholder="District Name"
                  form={form}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: RECIPIENT INFORMATION */}
        <div className="mb-5">
          <div
            className="d-flex align-items-center gap-2 mb-3 pb-2"
            style={{ borderBottom: "2px solid #F1F5F9" }}
          >
            <FaBuilding className="text-success" />
            <h5
              className="m-0 fw-bold text-secondary"
              style={{ fontSize: "16px" }}
            >
              3. Bill To Details
            </h5>
          </div>

          <div
            className="p-3 mb-4"
            style={{
              borderRadius: "10px",
              border: "1px solid #F1F5F9",
              background: "#F8FAFC",
            }}
          >
            <h6 className="fw-bold mb-3 text-dark" style={{ fontSize: "13px" }}>
              3.1 Consignee Entity
            </h6>
            <div className="row g-3">
              {/* <div className="col-md-4"><FormField label="Client Name" name="toName" placeholder="Legal/Trade Name" form={form} onChange={handleChange} /></div> */}
                 {/* Customer Dropdown */}
  <div className="col-md-4">
    <label style={labelStyle}>Select Customer</label>

    <select
      style={inputStyle}
      onChange={handleCustomerSelect}
      value={form.selectedCustomer || ""}
    >
      <option value="">Select Customer</option>

      {customers.map((customer) => (
        <option key={customer._id} value={customer._id}>
          {customer.name} - {customer.phone}
        </option>
      ))}
    </select>
  </div>
             
              <div className="col-md-4">
                <FormField
                  label="Client GSTIN"
                  name="toGSTIN"
                  placeholder="15-digit GSTIN"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-4">
                <FormField
                  label="Client State"
                  name="toState"
                  placeholder="State Name"
                  form={form}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div
            className="p-3"
            style={{
              borderRadius: "10px",
              border: "1px solid #F1F5F9",
              background: "#F8FAFC",
            }}
          >
            <h6 className="fw-bold mb-3 text-dark" style={{ fontSize: "13px" }}>
              3.2 Shipping Terminal Destination
            </h6>
            <div className="row g-3">
              <div className="col-md-3">
                <FormTextArea
                  label="Address Line 1"
                  name="shipAddress"
                  placeholder="Building/Floor/Street"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              {/* <div className="col-md-3"><FormTextArea label="Address Line 2" name="shipAddress2" placeholder="Locality/Area" form={form} onChange={handleChange} /></div> */}
              <div className="col-md-2">
                <FormField
                  label="Destination Place"
                  name="shipPlace"
                  placeholder="City/Town"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2">
                <FormField
                  label="Pincode"
                  name="shipPincode"
                  placeholder="6-digit ZIP"
                  form={form}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-2">
                <FormField
                  label="District"
                  // name="shipPlace"
                  name="shipDistrict"
                  placeholder="District Name"
                  form={form}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: INVENTORY AND VALUE CALCULATION */}
        <div className="mb-5">
          <div
            className="d-flex align-items-center gap-2 mb-3 pb-2"
            style={{ borderBottom: "2px solid #F1F5F9" }}
          >
            <FaBoxOpen className="text-warning" />
            <h5
              className="m-0 fw-bold text-secondary"
              style={{ fontSize: "16px" }}
            >
              4. Consignment Item Details
            </h5>
          </div>

          <div className="row g-3">
            {/* <div className="col-md-4"><FormField label="Product Name" name="productName" placeholder="Item Name" form={form} onChange={handleChange} /></div> */}
           <div className="col-md-4">
  <label style={labelStyle}>Select Product</label>

  <select
    style={inputStyle}
    onChange={handleProductSelect}
    value={form.selectedProduct || ""}
  >
    <option value="">Select Product</option>

    {products.map((product) => (
      <option key={product._id} value={product._id}>
        {product.productName}
      </option>
    ))}
  </select>
</div>

{/* ADD THIS */}
<div className="col-md-4">
  <FormField
    label="Product Name"
    name="productName"
    placeholder="Item Name"
    form={form}
    onChange={handleChange}
  />
</div>
            <div className="col-md-5">
              <FormField
                label="Product Description"
                name="description"
                placeholder="Technical specs"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-3">
              <FormField
                label="HSN Code"
                name="hsn"
                placeholder="System Code"
                form={form}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-2">
              <FormField
                label="Quantity"
                name="qty"
                placeholder="Count"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <FormField
                label="Unit Type"
                name="unit"
                placeholder="e.g. BOX, KGS"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <FormField
                label="Taxable Total Value"
                name="taxableValue"
                placeholder="₹ Value before tax"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <FormField
                label="Other Charge Value"
                name="otherValue"
                placeholder="Advol value additions"
                form={form}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-2">
              <FormField
                label="CGST (%)"
                name="cgst"
                placeholder="Rate %"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <FormField
                label="SGST (%)"
                name="sgst"
                placeholder="Rate %"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-2">
              <FormField
                label="IGST (%)"
                name="igst"
                placeholder="Rate %"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-3">
              <FormField
                label="CESS (%)"
                name="cess"
                placeholder="Rate %"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-3">
              <FormField
                label="Cess Non-Advol Value"
                name="cessNonAdvolValue"
                placeholder="Fixed non-advol sum"
                form={form}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: LOGISTICS DISPATCH SYSTEM */}
        <div className="mb-4">
          <div
            className="d-flex align-items-center gap-2 mb-3 pb-2"
            style={{ borderBottom: "2px solid #F1F5F9" }}
          >
            <FaTruck className="text-danger" />
            <h5
              className="m-0 fw-bold text-secondary"
              style={{ fontSize: "16px" }}
            >
              5. Logistics & Transportation Setup
            </h5>
          </div>

          <div className="row g-4">
            {/* <div className="col-md-4"><FormField label="Transporter Company Name" name="transporterName" placeholder="Carrier Name" form={form} onChange={handleChange} /></div> */}
            <div className="col-md-4">
              <label style={labelStyle}>Select Transporter</label>

              <select
                style={inputStyle}
                onChange={handleTransporterSelect}
                // defaultValue=""
                // value={form.selectedCustomer || ""}
                value={form.selectedTransporter || ""}
              >
                <option value="">Select Transporter</option>

                {transporters.map((transporter) => (
                  <option key={transporter._id} value={transporter._id}>
                    {transporter.transporterName} -{transporter.transporterID}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <FormField
                label="Transporter ID"
                name="transporterId"
                placeholder="Carrier unique ID"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <div className="d-flex flex-column h-100 justify-content-end">
                <label style={labelStyle}>Total Distance (KM)</label>
                <input
                  type="text"
                  name="distance"
                  value={form.distance || ""}
                  onChange={handleChange}
                  placeholder="Distance metrics"
                  style={inputStyle}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: "#64748B",
                    marginTop: "4px",
                  }}
                  className="fst-italic"
                >
                  Auto-calculated using local matrix pin networks. Editable.
                </span>
              </div>
            </div>

            <div className="col-md-6">
              <label style={labelStyle}>Transit Carrier Mechanism</label>
              <div className="d-flex gap-2 flex-wrap">
                {[
                  { id: "1", label: "Road" },
                  { id: "2", label: "Rail" },
                  { id: "3", label: "Air" },
                  { id: "4", label: "Ship" },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className="btn px-3 py-2 flex-fill transition-all text-sm"
                    style={{
                      borderRadius: "8px",
                      fontSize: "13px",
                      border:
                        form.transportMode === mode.id
                          ? "2px solid #3B82F6"
                          : "1px solid #E2E8F0",
                      backgroundColor:
                        form.transportMode === mode.id ? "#EFF6FF" : "#FFF",
                      color:
                        form.transportMode === mode.id ? "#1D4ED8" : "#64748B",
                      fontWeight:
                        form.transportMode === mode.id ? "600" : "400",
                    }}
                    onClick={() => setForm({ ...form, transportMode: mode.id })}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-md-6">
              <label style={labelStyle}>Vehicle Structural Type</label>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn flex-fill py-2 transition-all"
                  style={{
                    borderRadius: "8px",
                    fontSize: "13px",
                    border:
                      form.vehicleType === "R"
                        ? "2px solid #3B82F6"
                        : "1px solid #E2E8F0",
                    backgroundColor:
                      form.vehicleType === "R" ? "#EFF6FF" : "#FFF",
                    color: form.vehicleType === "R" ? "#1D4ED8" : "#64748B",
                    fontWeight: form.vehicleType === "R" ? "600" : "400",
                  }}
                  onClick={() => setForm({ ...form, vehicleType: "R" })}
                >
                  Regular Cargo
                </button>
                <button
                  type="button"
                  className="btn flex-fill py-2 transition-all"
                  style={{
                    borderRadius: "8px",
                    fontSize: "13px",
                    border:
                      form.vehicleType === "O"
                        ? "2px solid #3B82F6"
                        : "1px solid #E2E8F0",
                    backgroundColor:
                      form.vehicleType === "O" ? "#EFF6FF" : "#FFF",
                    color: form.vehicleType === "O" ? "#1D4ED8" : "#64748B",
                    fontWeight: form.vehicleType === "O" ? "600" : "400",
                  }}
                  onClick={() => setForm({ ...form, vehicleType: "O" })}
                >
                  Over Dimensional Cargo (ODC)
                </button>
              </div>
            </div>

            <div className="col-md-4">
              <FormField
                label="Vehicle Plate Number"
                name="vehicleNo"
                placeholder="e.g. DL-01-A-1234"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <FormField
                label="Transport Document No"
                name="transporterDocNo"
                placeholder="Challan / LR No"
                form={form}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-4">
              <FormField
                type="date"
                label="Transport Document Date"
                name="transporterDocDate"
                form={form}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* PANEL FOOTER */}
        <div
          className="d-flex justify-content-end gap-3 mt-5 pt-3"
          style={{ borderTop: "1px solid #E2E8F0" }}
        >
          <button
            className="btn px-4 py-2 text-secondary fw-semibold"
            style={{
              borderRadius: "8px",
              border: "1px solid #CBD5E1",
              background: "#FFF",
              fontSize: "14px",
            }}
            onClick={() => navigate(-1)}
          >
            Cancel & Exit
          </button>
          <button
            className="btn px-5 py-2 text-white fw-semibold d-flex align-items-center justify-content-center"
            style={{
              borderRadius: "8px",
              backgroundColor: loading ? "#93C5FD" : "#2563EB",
              border: "none",
              minWidth: "160px",
              fontSize: "14px",
            }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm"></span>
            ) : (
              "Generate E-Way Bill"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-components moved outside parent component block to prevent re-creation focus loss
const FormField = ({
  label,
  name,
  placeholder,
  disabled = false,
  type = "text",
  form,
  onChange,
}) => (
  <div className="d-flex flex-column h-100 justify-content-end">
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      name={name}
      value={form[name] || ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={inputStyle}
      onFocus={(e) => {
        e.target.style.borderColor = "#3B82F6";
        e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.15)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#E2E8F0";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

const FormTextArea = ({ label, name, placeholder, form, onChange }) => (
  <div className="d-flex flex-column h-100 justify-content-end">
    <label style={labelStyle}>{label}</label>
    <textarea
      name={name}
      value={form[name] || ""}
      onChange={onChange}
      placeholder={placeholder}
      style={textareaStyle}
      onFocus={(e) => {
        e.target.style.borderColor = "#3B82F6";
        e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.15)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "#E2E8F0";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);
