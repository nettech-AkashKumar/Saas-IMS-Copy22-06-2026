import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../styles/Responsive.css";
import { RxCross2 } from "react-icons/rx";
import api from "../../../pages/config/axiosInstance";
import Select, { components } from "react-select";
import { toast } from "react-toastify";

const MultiValue = (props) => {
  const { index, getValue } = props;
  const maxToShow = 2;
  const selected = getValue();

  if (index < maxToShow) {
    return <components.MultiValue {...props} />;
  }

  if (index === maxToShow) {
    return (
      <div style={{ marginLeft: "5px", fontSize: "12px", color: "#666", alignSelf: "center" }}>
        +{selected.length - maxToShow} more...
      </div>
    );
  }
  return null;
};

const selectStyle = {
  border: "1px solid #E6EAED",
  color: "#848485",
  backgroundColor: "#ffffff",
  fontSize: "0.875rem",
  fontWeight: "400",
  lineHeight: "1.6",
  borderRadius: "0.35rem",
  padding: "0rem 6px",
  width: "100%",
  fill: "currentColor",
  outline: "none",
  boxShadow: "none",
  minHeight: "40px",
};

const AddAssignTarget = ({
  closeModal,
  editData = null,
  viewData = null,
  fetchAssignTargets,
  isView,
}) => {
  const [successMessage, setSuccessMessage] = useState("");
  const [frontErrorMessage, setFrontErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [brokers, setBrokers] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(false);

  const [form, setForm] = useState({
    assignToType: "Broker",
    assignToTarget: "",
    assignedToName: "",
    selectedSalesman: "",
    duration: "",
    targetMetric: "",
    targetValue: "",
    items: [],
    type: "",
    IncentiveValue: "",
  });

  const fetchBrokers = async () => {
    try {
      const res = await api.get("/api/broker/get");
      setBrokers(res.data.broker || []);
    } catch (error) {
      // console.log(error);
    }
  };

  const fetchSalesmen = async () => {
    try {
      const res = await api.get("/api/salesman/get");
      setSalesmen(res.data.salesman || []);
    } catch (error) {
      // console.log(error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProduct(true);
      const res = await api.get("/api/products");
      setProducts(res.data.products || []);
    } catch (error) {
      setProducts([]);
    } finally {
      setLoadingProduct(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
    fetchSalesmen();
    fetchProducts();
  }, []);

  // If salesman selected → salesman name; else → broker name
  const buildAssignedToName = (brokerId, salesmanId, brokerList, salesmanList) => {
    if (salesmanId) {
      const salesman = salesmanList.find((s) => s._id === salesmanId);
      return salesman?.salesmanName || "";
    }
    const broker = brokerList.find((b) => b._id === brokerId);
    return broker?.brokerName || "";
  };

  // Find the selected broker object
  const selectedBroker = brokers.find(
    (b) => String(b._id) === String(form.assignToTarget)
  );

  // Filter salesmen whose _id is in broker's assignSalesman array
  const brokerSalesmen = form.assignToTarget ? selectedBroker?.assignSalesman || [] : salesmen;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBrokerChange = (e) => {
    const selectedId = e.target.value;
    const assignedToName = buildAssignedToName(selectedId, "", brokers, salesmen);
    setForm((prev) => ({
      ...prev,
      assignToTarget: selectedId,
      assignedToName,
      selectedSalesman: "",
      assignToType: "Broker",
    }));
  };

  const handleSalesmanChange = (e) => {
    const selectedId = e.target.value;

    const assignedToName = buildAssignedToName(
      form.assignToTarget,
      selectedId,
      brokers,
      salesmen
    );

    setForm((prev) => ({
      ...prev,
      selectedSalesman: selectedId,
      assignedToName,
      assignToType: "Broker",
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setErrors({});
      setFrontErrorMessage("");

      const newErrors = {};

      // if (!form.assignToTarget) {
      //   newErrors.assignToTarget = "Select Broker is required";
      // }

      if (!form.duration) {
        newErrors.duration = "Duration is required";
      }
      if (!form.targetMetric) {
        newErrors.targetMetric = "Target Metric is required";
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      if (editData?._id) {
        const res = await api.put(
          `/api/assignTarget/update/${editData._id}`,
          form
        );

        if (res.status === 200) {
          setFrontErrorMessage(""); // clear old errors
          setSuccessMessage("Assign Target Updated Successfully");
          toast.success("Assign Target Updated Successfully");
          closeModal();
          fetchAssignTargets();
        }
      } else {
        const res = await api.post(
          "/api/assignTarget/add",
          form
        );

        if (res.status === 201) {
          setFrontErrorMessage(""); // clear old errors
          setSuccessMessage("Assign Target Added Successfully");
          toast.success("Assign Target Added Successfully");
          closeModal();
          fetchAssignTargets();
        }
      }

    } catch (error) {
      setSuccessMessage(""); // remove success if error occurs

      setFrontErrorMessage(
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const data = editData || viewData;

    if (data && products.length > 0) {
      setForm({
        assignToType: data.assignToType || "Broker",
        assignedToName: data.assignedToName || "",
        assignToTarget: typeof data.assignToTarget === "object" ? data.assignToTarget?._id : data.assignToTarget || "",
        selectedSalesman: typeof data.selectedSalesman === "object" ? data.selectedSalesman?._id : data.selectedSalesman || "",
        duration: data.duration || "",
        targetMetric: data.targetMetric || "",
        targetValue: data.targetValue || "",
        items: (data.items || []).map((item) => typeof item === "object" ? item._id : item),
        type: data.type || "",
        IncentiveValue: data.IncentiveValue || "",
      });
    }
  }, [editData, viewData, products]);

  const productOptions = products.map((product) => ({
    value: product._id,
    label: product.productName,
  }));

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
        overflow: "auto",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          maxWidth: "958px",
          padding: "30px 40px",
          borderRadius: "8px",
          overflow: "auto",
          maxHeight: "100vh",
        }}
      >
        <div>
          <div className="modal-content">

            {/* Close button */}
            <div
              className="modal-header"
              style={{
                borderBottom: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "end",
                borderRadius: "50%",
              }}
            >
              <button
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
                }}
                type="button"
                onClick={closeModal}
              >
                <RxCross2 style={{ color: "#727681", fontSize: "15px", fontWeight: 900 }} />
              </button>
            </div>

            {/* Messages */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                boxSizing: "border-box",
                pointerEvents: "none",
              }}
            >
              {frontErrorMessage && (
                <div
                  className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                  style={{
                    border: "1px solid #DC3545",
                    color: "#DC3545",
                    background: "#FFF1F3",
                    borderRadius: "8px",
                    padding: "10px",
                    margin: "15px 0",
                    pointerEvents: "auto",
                  }}
                >
                  <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                    {frontErrorMessage}
                  </label>
                </div>
              )}

              {successMessage && (
                <div
                  className="create-successfully-msg d-flex justify-content-between align-items-center mb-4"
                  style={{
                    border: "1px solid #0D6828",
                    color: "#0D6828",
                    background: "#EBFFF1",
                    borderRadius: "8px",
                    padding: "10px",
                    margin: "15px 0",
                  }}
                >
                  <label style={{ fontFamily: "Inter", fontSize: "14px" }}>
                    {successMessage}
                  </label>
                </div>
              )}
            </div>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
              <h5
                className="modal-title"
                style={{
                  color: "#0E101A",
                  fontWeight: 500,
                  fontSize: "22px",
                  fontFamily: '"Inter", sans-serif',
                  lineHeight: "120%",
                }}
              >
                {isView
                  ? "View Assign Target"
                  : editData?._id
                    ? "Edit Assign Target"
                    : "Assign New Target"}
              </h5>
            </div>

            <div className="modal-body">

              {/* Assigning details */}
              <div
                className="transporter-details"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  columnGap: "20px",
                }}
              >

                {/* Select Broker */}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Select Broker
                  </label>
                  <select
                    name="assignToTarget"
                    value={form.assignToTarget}
                    onChange={handleBrokerChange}
                    disabled={isView}
                    style={selectStyle}
                  >
                    <option value="" hidden>Select Broker</option>
                    {brokers.length === 0 ? (
                      <option value="" disabled>No Brokers Available</option>
                    ) : (
                      brokers.map((broker) => {
                        // console.log("Rendering broker:", broker); // 👈
                        return (
                          <option key={broker._id} value={broker._id}>
                            {broker.brokerName}
                          </option>
                        );
                      }))}
                  </select>
                  {errors.assignToTarget && (
                    <small className="text-danger">{errors.assignToTarget}</small>
                  )}
                </div>

                {/* Select Salesman */}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Select Salesman <span className="text-danger">*</span>
                  </label>
                  <select
                    name="selectedSalesman"
                    value={form.selectedSalesman}
                    onChange={handleSalesmanChange}
                    disabled={isView}
                    style={{
                      ...selectStyle,
                      color: "#848485",
                      cursor: "pointer",
                    }}
                  >
                    <option value="">
                      {brokerSalesmen.length === 0
                        ? "No salesmen available"
                        : "Select Salesman"}
                    </option>
                    {brokerSalesmen.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.salesmanName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Duration <span className="text-danger">*</span>
                  </label>
                  <select
                    name="duration"
                    value={form.duration}
                    onChange={handleChange}
                    disabled={isView}
                    style={selectStyle}
                  >
                    <option value="" hidden>Select Duration</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                  {errors.duration && (
                    <small className="text-danger">{errors.duration}</small>
                  )}
                </div>

                {/* Target Metric */}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Target Metric <span className="text-danger">*</span>
                  </label>
                  <select
                    name="targetMetric"
                    value={form.targetMetric}
                    onChange={handleChange}
                    disabled={isView}
                    style={selectStyle}
                  >
                    <option value="" hidden>Select Metric</option>
                    <option value="Amount">Amount</option>
                    <option value="Pieces">Pieces</option>
                  </select>
                  {errors.targetMetric && (
                    <small className="text-danger">{errors.targetMetric}</small>
                  )}
                </div>

                {/* Target Value */}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Target Value
                  </label>
                  <input
                    type="number"
                    name="targetValue"
                    value={form.targetValue}
                    onChange={handleChange}
                    disabled={isView}
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter Value"
                  />
                </div>

                {/* Product Specific */}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Product Specific?
                  </label>
                  <Select
                    isMulti
                    name="items"
                    isDisabled={isView}
                    options={productOptions}
                    placeholder="Select Product"
                    value={productOptions.filter((option) =>
                      form.items.includes(option.value)
                    )}
                    onChange={(selectedOptions) => {
                      setForm((prev) => ({
                        ...prev,
                        items: selectedOptions
                          ? selectedOptions.map((item) => item.value)
                          : [],
                      }));
                    }}
                    components={{ MultiValue }}
                    styles={{
                      control: (base) => ({
                        ...base,
                        border: "1px solid #E6EAED",
                        color: "#CACCD0",
                        backgroundColor: "#ffffff",
                        fontSize: "0.875rem",
                        fontWeight: "400",
                        lineHeight: "1.6",
                        borderRadius: "0.35rem",
                        padding: "0rem 6px",
                        width: "100%",
                        fill: "currentColor",
                        outline: "none",
                        boxShadow: "none",
                        minHeight: "40px",
                      }),
                    }}
                  />
                  {errors.items && (
                    <small className="text-danger">{errors.items}</small>
                  )}
                </div>
              </div>

              {/* Product Items Table */}
              {form.items.length > 0 && (
                <div
                  className="transporter-details"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(1, 1fr)",
                    columnGap: "20px",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead style={{ backgroundColor: "#E5F0FF" }}>
                      <tr style={{ border: "1px solid #EAEAEA" }}>
                        <th style={{ color: "#727681", fontWeight: "500", padding: "4px 8px" }}>
                          SI No
                        </th>
                        <th style={{ color: "#727681", fontWeight: "500", padding: "4px 8px" }}>
                          Items
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .filter((item) => form.items?.includes(item._id))
                        .map((item, index) => (
                          <tr
                            key={item._id}
                            style={{
                              borderBottom: "1px solid rgb(230, 234, 237)",
                              borderLeft: "1px solid rgb(230, 234, 237)",
                              borderRight: "1px solid rgb(230, 234, 237)",
                            }}
                          >
                            <td style={{ color: "#0E101A", fontWeight: "500", padding: "10px 8px" }}>
                              {index + 1}
                            </td>
                            <td style={{ color: "#A2A8B8", fontWeight: "500", padding: "10px 8px" }}>
                              {item.productName}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Incentive */}
              <div
                className="transporter-details"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  columnGap: "20px",
                }}
              >
                {/* Incentive Type */}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Incentive Type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    disabled={isView}
                    style={selectStyle}
                  >
                    <option value="" hidden>Select Incentive Type</option>
                    <option value="Fixed">Fixed</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                </div>

                {/* Incentive Value */}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Incentive Value
                  </label>
                  <input
                    type="number"
                    name="IncentiveValue"
                    value={form.IncentiveValue}
                    onChange={handleChange}
                    disabled={isView}
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter Value"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div
              className="modal-footer d-flex align-items-start justify-content-start"
              style={{ borderTop: "none" }}
            >
              {!isView && (
                <button
                  onClick={handleSave}
                  type="button"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? editData
                      ? "Updating..."
                      : "Saving Target..."
                    : "Save"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAssignTarget;