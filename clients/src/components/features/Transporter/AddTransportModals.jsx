import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../styles/Responsive.css";
import { RxCross2 } from "react-icons/rx";
import { useNavigate } from "react-router-dom";
import api from "../../../pages/config/axiosInstance";
import { RiArrowDropDownLine, RiVerifiedBadgeLine } from "react-icons/ri";
import { GoUpload } from "react-icons/go";
import Select, { components } from "react-select";

const MultiValue = (props) => {
  const { index, getValue } = props;
  const maxToShow = 2;
  const selected = getValue();

  if (index < maxToShow) {
    return <components.MultiValue {...props} />;
  }

  if (index === maxToShow) {
    return (
      <div
        style={{
          marginLeft: "5px",
          fontSize: "12px",
          color: "#666",
          alignSelf: "center",
        }}
      >
        +{selected.length - maxToShow} more...
      </div>
    );
  }

  return null;
};

const AddTransportModals = ({ onClose, editData = null, fetchTransporters, isView, }) => {

  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState("");
  const [frontErrorMessage, setFrontErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [isGstinVerified, setIsGstinVerified] = useState(false);
  const [gstVerifyButton, setGstVerifyButton] = useState(false);
  const [showBankDetails, setshowBankDetails] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  // Add this state after the files state
  const [existingFiles, setExistingFiles] = useState({
    doc1: null, // will hold { url, public_id } from server
    doc2: null,
    doc3: null,
  });

  const [form, setForm] = useState({
    transporterName: "",
    ownerName: "",
    transporterGST: "",
    transporterID: "",
    assignDriverID: [],
    assignVehicleID: [],
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    accountType: "",
    ifscCode: "",
    branchName: "",
  });

  const driverOptions = drivers
    .filter((driver) => {
      const isCurrentSelected =
        editData?.assignDriverID?.some(
          (d) => String(d._id || d) === String(driver._id)
        );

      // show selected drivers
      if (isCurrentSelected) {
        return true;
      }

      // hide already assigned
      return !driver.isAssigned;
    })
    .map((driver) => ({
      value: driver._id,
      label: driver.driverName,
    }));

  const vehicleOptions = vehicles
    .filter((vehicle) => {
      const isCurrentSelected =
        editData?.assignVehicleID?.some(
          (v) => String(v._id || v) === String(vehicle._id)
        );

      if (isCurrentSelected) {
        return true;
      }

      return !vehicle.isAssigned;
    })
    .map((vehicle) => ({
      value: vehicle._id,
      label: vehicle.vehicleNumber,
    }));

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleBankDetails = () => {
    setshowBankDetails((prev) => !prev);
  };

  const [files, setFiles] = useState({
    doc1: null,
    doc2: null,
    doc3: null,
  });

  const handleFileChange = (e, field) => {
    if (e.target.files.length > 0) {
      setFiles({
        ...files,
        [field]: e.target.files[0],
      });
    }
  };

  const getShortName = (name) => {
    if (!name) return "Upload";
    const ext = name.split(".").pop(); // pdf, png
    const base = name.substring(0, 2); // first 4 letters
    return base + ".." + ext;
  };
  const removeFile = (field) => {
    setFiles({
      ...files,
      [field]: null,
    });
  };

  // Sanitization function (from old code)
  const sanitizeInput = (input) => {
    if (typeof input !== "string") return input;
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  };

  // GST Verify State
  const [gstError, setGstError] = useState(null);
  const [gstResponse, setGstResponse] = useState(null);
  const [gstLoading, setGstLoading] = useState(false);
  const [gstVerified, setGstVerified] = useState(false);

  // GST Verify Logic
  const handleSearch = async () => {
    const gst = (form.transporterGST || "").trim().toUpperCase();

    if (!gst) {
      setGstError("Please enter a GSTIN.");
      setGstVerified(false);
      return;
    }

    // optional: frontend format check before API call
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
    if (!gstRegex.test(gst)) {
      setErrors((prev) => ({
        ...prev,
        gstin: "Invalid GSTIN format",
      }));
      return;
    }

    setGstLoading(true);
    setGstError(null);
    setGstVerified(false);
    setGstResponse(null);

    try {
      const res = await api.get(`/api/gst/${encodeURIComponent(gst)}`);
      const data = res.data;
      setGstResponse(data);
      const verified = data && data.error === false;
      if (verified) {
        setGstVerified(true);
        setErrors((prev) => ({
          ...prev,
          gstin: "",
        }));
      } else {
        setGstVerified(false);
        setErrors((prev) => ({
          ...prev,
          gstin: "GST is not verified",
        }));
        setFrontErrorMessage("GST is not verified");
        setTimeout(() => {
          setFrontErrorMessage("");
        }, 1500);
      }
    } catch (err) {
      setGstError(
        err?.response?.data?.message || err?.response?.data || err.message,
      );
      setGstVerified(false);
      setErrors((prev) => ({
        ...prev,
        gstin: "GST verification failed",
      }));
      setFrontErrorMessage("GST verifcation failed");
      setTimeout(() => {
        setFrontErrorMessage("");
      }, 1000);
    } finally {
      setGstLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const res = await api.get("/api/driver/get");
      setDrivers(res.data.driver || []);
    } catch (error) {
    }
  };
  const fetchVehicles = async () => {
    try {
      const res = await api.get("/api/vehicle/get");

      setVehicles(res.data.vehicle || []);
    } catch (error) {
    }
  };
  useEffect(() => {
    fetchDrivers();
    fetchVehicles();
  }, []);

  const handleSave = async () => {
    setErrors({});
    setFrontErrorMessage("");
    setSuccessMessage("");

    let newErrors = {};

    // validation
    if (!form.transporterName.trim()) {
      newErrors.transporterName = "Transporter Name is required";
    }
      if (!form.transporterName.trim()) {
      newErrors.transporterID = "Transporter ID is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      Object.keys(form).forEach((key) => {
        if (Array.isArray(form[key])) {
          form[key].forEach((item) => {
            formData.append(`${key}[]`, item);
          });
        } else {
          formData.append(key, form[key] || "");
        }
      });
      // append files
      if (files.doc1) formData.append("doc1", files.doc1);
      if (files.doc2) formData.append("doc2", files.doc2);
      if (files.doc3) formData.append("doc3", files.doc3);

      let res;

      if (editData?._id) {
        res = await api.put(
          `/api/transporter/update/${editData._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
        setSuccessMessage("Transporter Updated Successfully");
      }

      else {
        res = await api.post("/api/transporter/add", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setSuccessMessage("Transporter Added Successfully");
      }

      // refresh list
      if (fetchTransporters) {
        fetchTransporters();
      }

      // close modal after delay
      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 2000);
    } catch (err) {
      setFrontErrorMessage(
        err?.response?.data?.message || "Something went wrong",
      );

      // auto remove error
      setTimeout(() => {
        setFrontErrorMessage("");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (editData) {
      setForm({
        transporterName: editData.transporterName || "",
        ownerName: editData.ownerName || "",
        transporterGST: editData.transporterGST || "",
        transporterID: editData.transporterID || "",
        assignDriverID:
          editData.assignDriverID?.map((d) => d._id || d) || [],
        assignVehicleID:
          editData.assignVehicleID?.map((v) => v._id || v) || [],
        bankName: editData.bankName || "",
        accountNumber: editData.accountNumber || "",
        accountHolderName: editData.accountHolderName || "",
        accountType: editData.accountType || "",
        ifscCode: editData.ifscCode || "",
        branchName: editData.branchName || "",
      });

      // existing uploaded files from backend
      setExistingFiles({
        doc1: editData.doc1 || null,
        doc2: editData.doc2 || null,
        doc3: editData.doc3 || null,
      });

      // open bank section automatically if data exists
      if (editData.bankName || editData.accountNumber || editData.ifscCode) {
        setshowBankDetails(true);
      }
    }
  }, [editData]);

  //fetchbank through ifsc code
  const fetchBankDetails = async (ifsc) => {
    try {
      const res = await fetch(`https://ifsc.razorpay.com/${ifsc}`);

      if (!res.ok) {
        throw new Error("Invalid IFSC");
      }

      const data = await res.json();

      setForm((prev) => ({
        ...prev,
        bankName: data.BANK || "",
        branchName: data.BRANCH || "",
      }));
    } catch (error) {
      console.log(error);

      toast.error("Invalid IFSC Code");

      setForm((prev) => ({
        ...prev,
        bankName: "",
        branchName: "",
      }));
    }
  };

  return (
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

          {/* close button */}
          <div
            className="modal-header"
            style={{
              borderBottom: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "end",
              borderRadius: "50%",
              //   padding: "5px 5px",
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
              onClick={onClose}
            >
              <RxCross2
                style={{ color: "#727681", fontSize: "15px", fontWeight: 900 }}
              />
            </button>
          </div>

          {/* Success Message */}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
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
                ? "View Transporter"
                : editData
                  ? "Edit Transporter"
                  : "Add Transporter"}
            </h5>
          </div>

          <div className="modal-body">
            {/* Transporter Details */}
            <div
              className="transporter-details"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                columnGap: "20px",
              }}
            >
              {/*Transporter Name */}
              <div className="mb-3 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Transporter Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  name="transporterName"
                  value={form.transporterName}
                  onChange={handleChange}
                  disabled={isView}
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter transporter name"
                  style={{ height: "40px" }}
                />
                {errors.transporterName && (
                  <small className="text-danger">
                    {errors.transporterName}
                  </small>
                )}
              </div>

              {/*Owner Name */}
              <div className="mb-3 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Owner Name
                </label>
                <input
                  type="text"
                  name="ownerName"
                  value={form.ownerName}
                  onChange={handleChange}
                  disabled={isView}
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter owner name"
                  style={{ height: "40px" }}
                />
                {errors.ownerName && (
                  <small className="text-danger">{errors.ownerName}</small>
                )}
              </div>

              {/* GSTIN with Verify */}
              <div className="mb-3 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Transporter GSTIN
                </label>

                {/* <div className="d-flex align-items-center form-control supplierinput shadow-none" style={{   height:"40px"}}> */}
                <input
                  // className="f supplierinput shadow-none"
                  type="text"
                  placeholder="Enter GSTIN"
                  //                   name="transporterGST"
                  // value={form.transporterGST}
                  // onChange={(e) => {
                  //   const upper = e.target.value.toUpperCase();
                  //   setForm((prev) => ({ ...prev, transporterGST: upper }));
                  // }}
                  className="form-control supplierinput shadow-none"
                  name="transporterGST"
                  value={form.transporterGST}
                  onChange={handleChange}
                  disabled={isView}
                  style={{
                    // border: "none",
                    // outline: "none",
                    // flex: 1,
                    // color: "#CACCD0",
                    height: "40px"

                  }}

                />

                {/* {!gstVerified && !gstLoading && form.transporterGST && (
                    <>
                      {gstVerifyButton && (
                        <button
                          type="button"
                          onClick={handleSearch}
                          style={{
                            padding: "2px 8px",
                            background: "rgb(31, 127, 255)",
                            color: "white",
                            borderRadius: "4px",
                            fontSize: "13px",
                            border: "none",
                            marginLeft: "8px",
                            cursor: "pointer",
                          }}
                        >
                          Verify
                        </button>
                      )}
                    </>
                  )} */}

                {/* Show Verifying text */}
                {/* {gstLoading && (
                    <span
                      style={{
                        fontSize: "13px",
                        color: "#1f7fff",
                        marginLeft: "8px",
                      }}
                    >
                      Verifying...
                    </span>
                  )} */}

                {/* Show Green Icon AFTER success */}
                {/* {gstVerified && !gstLoading && (
                    <RiVerifiedBadgeLine
                      style={{
                        color: "green",
                        fontSize: "22px",
                        marginLeft: "8px",
                      }}
                    />
                  )} */}
                {/* </div> */}
                {errors.transporterGST && (
                  <small className="text-danger d-block mt-1">
                    {errors.transporterGST}
                  </small>
                )}
              </div>

                     {/*  Transporter ID */}
              <div className="mb-3 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Transporter ID <span className="text-danger">*</span>
                </label>

                
                <input
                  type="text"
                  placeholder="Enter Transpporter Id"
               
                  className="form-control supplierinput shadow-none"
                  name="transporterID"
                  value={form.transporterID}
                  onChange={handleChange}
                  disabled={isView}
                  style={{
                  
                    height: "40px"

                  }}

                />

             
                {errors.transporterID && (
                  <small className="text-danger d-block mt-1">
                    {errors.transporterID}
                  </small>
                )}
              </div>

              {/*Assign Vehicle No. */}
              <div className="mb-1 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Assign Vehicle No.
                </label>
                <Select
                  isMulti
                  name="assignVehicleID"
                  isDisabled={isView}
                  options={vehicleOptions}
                  placeholder="Select assign vehicle no"
                  value={vehicleOptions.filter((option) =>
                    form.assignVehicleID.includes(option.value),
                  )}
                  onChange={(selectedOptions) => {
                    setForm((prev) => ({
                      ...prev,
                      assignVehicleID: selectedOptions
                        ? selectedOptions.map((item) => item.value)
                        : [],
                    }));
                  }}
                  components={{ MultiValue }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      border: "1px solid #E6EAED",
                      color: "#9ea2a5",
                      backgroundColor: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: "400",
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
                {errors.assignVehicleID && (
                  <small className="text-danger">
                    {errors.assignVehicleID}
                  </small>
                )}
              </div>

              {/*Assign Driver */}
              <div className="mb-2 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Assign Driver
                </label>
                <Select
                  isMulti
                  name="assignDriverID"
                  isDisabled={isView}
                  options={driverOptions}
                  placeholder="Select assign driver"
                  value={driverOptions.filter((option) =>
                    form.assignDriverID.includes(option.value),
                  )}
                  onChange={(selectedOptions) => {
                    setForm((prev) => ({
                      ...prev,
                      assignDriverID: selectedOptions
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
                {errors.assignDriverID && (
                  <small className="text-danger">{errors.assignDriverID}</small>
                )}
              </div>

              
            </div>

            <hr style={{ height: "1.2px", backgroundColor: "#EAEAEA" }} />

            {/* bank details */}
            <label
              onClick={toggleBankDetails}
              htmlFor=""
              style={{
                fontSize: "14px",
                color: "rgb(13, 110, 253)",
                fontWeight: "500",
                marginBottom: "24px",
                backgroundColor: "rgb(243, 248, 251)",
                border: "1px solid rgb(229, 240, 255)",
                padding: "8px 12px",
                borderRadius: "8px",
                width: "100%",
                justifyContent: "space-between",
                display: "flex",
              }}
            >
              <span style={{ color: "rgb(13, 110, 253)" }}>
                {" "}
                + Add Bank Account{" "}
              </span>
              <span>
                <RiArrowDropDownLine
                  style={{
                    color: "grey",
                    fontSize: "20px",
                    transition: "0.3s",
                    transform: showBankDetails
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                />
              </span>
            </label>
            {showBankDetails && (
              <div
                //  className="d-flex flex-wrap justify-content-between mt-2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  columnGap: "20px",
                  marginBottom: "20px",
                }}
              >
                {/*Enter Account No.*/}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Account No.
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={handleChange}
                    disabled={isView}
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter account no."
                    style={{ height: "40px" }}
                  />
                  {errors.accountNumber && (
                    <small className="text-danger">
                      {errors.accountNumber}
                    </small>
                  )}
                </div>
                {/*IFSC Code*/}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    // name="ifscCode"
                    // value={form.ifscCode}
                    // onChange={handleChange}
                    name="ifscCode"
                    maxLength={11}
                    value={form.ifscCode || ""}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();

                      setForm((prev) => ({
                        ...prev,
                        ifscCode: value,
                      }));

                      // fetch when length = 11
                      if (value.length === 11) {
                        fetchBankDetails(value);
                      }
                    }}
                    disabled={isView}
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter IFSC code"
                    style={{ height: "40px" }}
                  />
                  {errors.ifscCode && (
                    <small className="text-danger">{errors.ifscCode}</small>
                  )}
                </div>

                {/*Bank Name*/}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Bank Name
                  </label>
                  <input
                    // type="text"
                    // name="bankName"
                    // value={form.bankName}
                    // onChange={handleChange}
                    name="bankName"
                    value={form.bankName || ""}
                    disabled={isView}
                    readOnly
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter bank name"
                    style={{ height: "40px" }}
                  />
                  {errors.bankName && (
                    <small className="text-danger">{errors.bankName}</small>
                  )}
                </div>

                {/*Branch Name*/}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Branch Name
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    // value={form.branchName}
                    value={form.branchName || ""}
                    onChange={handleChange}
                    disabled={isView}
                    readOnly
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter bank branch address"
                    style={{ height: "40px" }}
                  />
                  {errors.branchName && (
                    <small className="text-danger">{errors.branchName}</small>
                  )}
                </div>

                {/*Account Holder Name*/}
                <div className="mb-3 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={form.accountHolderName}
                    onChange={handleChange}
                    disabled={isView}
                    className="form-control supplierinput shadow-none"
                    placeholder="Enter account holder name"
                    style={{ height: "40px" }}
                  />
                  {errors.accountHolderName && (
                    <small className="text-danger">
                      {errors.accountHolderName}
                    </small>
                  )}
                </div>

                {/*Account Type* */}
                <div className="mb-1 w-100">
                  <label
                    className="supplierlabel mb-1"
                    style={{ color: "#727681", fontSize: "12px" }}
                  >
                    Account Type
                  </label>
                  <select
                    name="accountType"
                    value={form.accountType}
                    onChange={handleChange}
                    disabled={isView}
                    style={{
                      border: "1px solid #E6EAED",
                      color: "#9ea2a5",
                      backgroundColor: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: "400",
                      lineHeight: "1.6",
                      borderRadius: "0.35rem",
                      padding: "0rem 0.85rem",
                      width: "100%",
                      fill: "currentColor",
                      outline: "none",
                      height: "40px"
                    }}
                  >
                    <option value="">Select account type</option>
                    <option value="Saving">Saving</option>
                    <option value="Current">Current</option>
                  </select>
                  {errors.accountType && (
                    <small className="text-danger">{errors.accountType}</small>
                  )}
                </div>

                {/* add new bank button*/}
                {/* <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "7px",
                    marginTop: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      overflow: "hidden",
                      border: "2px solid var(--Blue, #1F7FFF)",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      cursor: "pointer",
                      borderRadius: "4px",
                    }}
                    // onClick={() => setVariants([...variants, { images: [], existingImages: [] }])}
                  >
                    <div
                      style={{
                        color: "#1F7FFF",
                        fontSize: "13px",
                        fontWeight: "600",
                      }}
                    >
                      +
                    </div>
                  </div>
                  <span
                    style={{
                      color: "var(--Black, #212436)",
                      fontSize: "16px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "19.20px",
                      cursor: "pointer",
                    }}
                    // onClick={() => setVariants([...variants, { images: [], existingImages: [] }])}
                  >
                    Add New Bank Account
                  </span>
                </div> */}
              </div>
            )}

            <hr style={{ height: "1.2px", backgroundColor: "#EAEAEA" }} />

            {/* Upload Document */}
            <div
              className="upload-document-add-transporter"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                columnGap: "20px",
              }}
            >
              {/*Upload Document1*/}
              <div className="mb-3 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Upload Document 1
                </label>
                {!files.doc1 && existingFiles.doc1?.length > 0 ? (
                  <>
                    <div
                      style={{
                        position: "relative",
                        border: "1px solid #EAEAEA",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <a
                        href={existingFiles.doc1[0]?.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#1F7FFF",
                          fontSize: "14px",
                          textDecoration: "underline",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "80%",
                        }}
                      >
                        <img
                          src={existingFiles.doc1[0]?.url}
                          alt="doc1"
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "8px",
                          }}
                        />
                      </a>
                      <button
                        type="button"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "60%",
                          color: "red",
                          border: "2px solid red",
                          borderRadius: "50%",
                          backgroundColor: "transparent",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onClick={() =>
                          setExistingFiles((prev) => ({ ...prev, doc1: null }))
                        }
                      >
                        <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      onClick={() => {
                        if (!isView) {
                          document.getElementById("doc1").click();
                        }
                      }}
                      style={{
                        // maxWidth: "207px",
                        border: "1px solid #EAEAEA",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        color: "#0E101A",
                        height: "40px"
                      }}
                    >
                      <span style={{ color: "#0E101A", fontSize: "14px" }}>
                        {files.doc1 ? getShortName(files.doc1.name) : "Upload"}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {files.doc1 && !isView ? (
                          <button
                            style={{
                              color: "#727681",
                              fontSize: "10px",
                              fontWeight: 800,
                              border: "2px solid #727681",
                              borderRadius: "50%",
                              backgroundColor: "transparent",
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // ❗ prevent file open
                              removeFile("doc1");
                            }}
                          >
                            <RxCross2
                              style={{
                                color: "#727681",
                                fontSize: "12px",
                                fontWeight: 900,
                              }}
                            />
                          </button>
                        ) : (
                          <GoUpload
                            style={{
                              fontSize: "18px",
                              fontWeight: "bolder",
                              color: "#0E101A",
                            }}
                          />
                        )}
                      </div>

                      <input
                        id="doc1"
                        type="file"
                        onChange={(e) => handleFileChange(e, "doc1")}
                        style={{ display: "none" }}
                      />
                    </div>
                    {errors.doc1 && (
                      <small className="text-danger">{errors.doc1}</small>
                    )}
                  </>
                )}
              </div>
              {/*Upload Document2*/}
              <div className="mb-3 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Upload Document 2
                </label>
                {!files.doc2 && existingFiles.doc2?.length > 0 ? (
                  <>
                    <div
                      style={{
                        position: "relative",
                        border: "1px solid #EAEAEA",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <a
                        href={existingFiles.doc2[0]?.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#1F7FFF",
                          fontSize: "14px",
                          textDecoration: "underline",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "80%",
                        }}
                      >
                        <img
                          src={existingFiles.doc2[0]?.url}
                          alt="doc2"
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "8px",
                          }}
                        />
                      </a>
                      <button
                        type="button"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "60%",
                          color: "red",
                          border: "2px solid red",
                          borderRadius: "50%",
                          backgroundColor: "transparent",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onClick={() =>
                          setExistingFiles((prev) => ({ ...prev, doc2: null }))
                        }
                      >
                        <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      onClick={() => {
                        if (!isView) {
                          document.getElementById("doc2").click();
                        }
                      }}
                      style={{
                        // maxWidth: "207px",
                        border: "1px solid #EAEAEA",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        color: "#0E101A",
                        height: "40px"
                      }}
                    >
                      <span style={{ color: "#0E101A", fontSize: "14px" }}>
                        {files.doc2 ? getShortName(files.doc2.name) : "Upload"}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {files.doc2 && !isView ? (
                          <button
                            style={{
                              color: "#727681",
                              fontSize: "10px",
                              fontWeight: 800,
                              border: "2px solid #727681",
                              borderRadius: "50%",
                              backgroundColor: "transparent",
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // ❗ prevent file open
                              removeFile("doc2");
                            }}
                          >
                            <RxCross2
                              style={{
                                color: "#727681",
                                fontSize: "12px",
                                fontWeight: 900,
                              }}
                            />
                          </button>
                        ) : (
                          <GoUpload
                            style={{
                              fontSize: "18px",
                              fontWeight: "bolder",
                              color: "#0E101A",
                            }}
                          />
                        )}
                      </div>

                      <input
                        id="doc2"
                        type="file"
                        onChange={(e) => handleFileChange(e, "doc2")}
                        style={{ display: "none" }}
                      />
                    </div>
                    {errors.doc2 && (
                      <small className="text-danger">{errors.doc2}</small>
                    )}
                  </>
                )}
              </div>
              {/*Upload Document3*/}
              <div className="mb-3 w-100">
                <label
                  className="supplierlabel mb-1"
                  style={{ color: "#727681", fontSize: "12px" }}
                >
                  Upload Document 3
                </label>
                {!files.doc3 && existingFiles.doc3?.length > 0 ? (
                  <>
                    <div
                      style={{
                        position: "relative",
                        border: "1px solid #EAEAEA",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <a
                        href={existingFiles.doc3[0]?.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "#1F7FFF",
                          fontSize: "14px",
                          textDecoration: "underline",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "80%",
                        }}
                      >
                        <img
                          src={existingFiles.doc3[0]?.url}
                          alt="doc3"
                          style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "8px",
                          }}
                        />
                      </a>
                      <button
                        type="button"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "60%",
                          color: "red",
                          border: "2px solid red",
                          borderRadius: "50%",
                          backgroundColor: "transparent",
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          flexShrink: 0,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        onClick={() =>
                          setExistingFiles((prev) => ({ ...prev, doc3: null }))
                        }
                      >
                        <RxCross2 style={{ color: "red", fontSize: "12px" }} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      onClick={() => {
                        if (!isView) {
                          document.getElementById("doc3").click();
                        }
                      }}
                      style={{
                        // maxWidth: "207px",
                        border: "1px solid #EAEAEA",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        color: "#0E101A",
                        height: "40px"
                      }}
                    >
                      <span style={{ color: "#0E101A", fontSize: "14px" }}>
                        {files.doc3 ? getShortName(files.doc3.name) : "Upload"}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {files.doc3 && !isView ? (
                          <button
                            style={{
                              color: "#727681",
                              fontSize: "10px",
                              fontWeight: 800,
                              border: "2px solid #727681",
                              borderRadius: "50%",
                              backgroundColor: "transparent",
                              width: "20px",
                              height: "20px",
                              cursor: "pointer",
                            }}
                            onClick={(e) => {
                              e.stopPropagation(); // ❗ prevent file open
                              removeFile("doc3");
                            }}
                          >
                            <RxCross2
                              style={{
                                color: "#727681",
                                fontSize: "12px",
                                fontWeight: 900,
                              }}
                            />
                          </button>
                        ) : (
                          <GoUpload
                            style={{
                              fontSize: "18px",
                              fontWeight: "bolder",
                              color: "#0E101A",
                            }}
                          />
                        )}
                      </div>

                      <input
                        id="doc3"
                        type="file"
                        onChange={(e) => handleFileChange(e, "doc3")}
                        style={{ display: "none" }}
                      />
                    </div>
                    {errors.doc3 && (
                      <small className="text-danger">{errors.doc3}</small>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* save button */}
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
                    : "Saving..."
                  : editData
                    ? "Update"
                    : "Save"}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AddTransportModals;
