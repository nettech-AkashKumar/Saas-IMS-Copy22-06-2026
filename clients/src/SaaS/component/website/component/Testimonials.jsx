
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Form } from "react-bootstrap";
import BASE_URL from "../config/config";
import { useTheme } from "../../Context/TheamContext/ThemeContext";
import { MdOutlineCancel, MdOutlineDoneAll } from "react-icons/md";
import { useLocation } from "react-router-dom";
import NumericInput from "../../Utils/InputBox/NumericInput";
import { GoEyeClosed } from "react-icons/go";
import { RxEyeOpen } from "react-icons/rx";
import { convertToAmPm } from "../../Utils/GetDayFormatted";
import TittleHeader from "../TittleHeader/TittleHeader";
import toast from "react-hot-toast";
import api from "../config/api";
import imageCompression from "browser-image-compression";
import { GrFormNext } from "react-icons/gr";
import { LuCheck } from "react-icons/lu";
import { IoChevronBack, IoChevronForward } from "react-icons/io5";

const initialForm = {
  profile: null,
  email: "",
  password: "",
  accountAccess: "",
  role: "",
  gender: "",
  firstName: "",
  lastName: "",
  dob: "",
  contactNo: "",
  department: "",
  position: "",
  doj: "",
  reportingManager: "",
  reportingHr: "",
  shift: "",
  bankName: "",
  bankAccount: "",
  bankIFSC: "",
  uan: "",
  pan: "",
  locationType: "On Site",
  isFullandFinal: "No",
  status: "active",
};

const EmployeeForm = (props) => {
  const location = useLocation();

  const route = location.pathname.split("/")[1];

  const [seePass, setSeepass] = useState(false);
  const [roleData, setRoleData] = useState([]);
  const [positionData, setPositionData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [filterManagerData, setFilterManagerData] = useState([]);
  const [filterHrData, setFilterHrData] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [error, setError] = useState(null);
  const { darkMode } = useTheme();
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  // steps for the form
  const [step, setStep] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    loadRoleInfo();
    loadPositionInfo();
    loadDepartmentInfo();
    loadEmployeeData();
    fetchShifts();
  }, []);

  // Auto-sync status based on isFullandFinal
  useEffect(() => {
    if (form.isFullandFinal === "Yes") {
      setForm((prev) => ({ ...prev, status: "Inactive" }));
    } else if (form.isFullandFinal === "No") {
      setForm((prev) => ({ ...prev, status: "active" }));
    }
  }, [form.isFullandFinal]);

  // in this all form items step 1 form
  const PayrollData = [
    {
      id: 1,
      pageName: "Personal Details",
    },
    {
      id: 2,
      pageName: "Employee Details",
    },
    {
      id: 3,
      pageName: "Bank Details",
    },
  ];

  // edit by aman
  const compressImageIfSmall = async (file) => {
    const sizeKB = file.size / 1024;

    // If image is already above 200KB → no need to compress
    if (sizeKB >= 200) return file;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      initialQuality: 0.8,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error("Compression error:", error);
      return file;
    }
  };

  // Manager/HR filter
  const managerFilterHandler = (value) => {
    setForm({ ...form, accountAccess: value });
    if (+value === 2 || +value === 4 || +value === 1) {
      const data = rowData.filter((val) => +val.Account === 1);
      setFilterManagerData(data);
    } else if (+value === 3) {
      const data = rowData.filter((val) => +val.Account === 4);
      setFilterManagerData(data);
    }
    const hrData = rowData.filter((val) => val.Account === 2);
    setFilterHrData(hrData);
  };

  // ============================================================
  // FORM VALIDATION FUNCTION
  // ============================================================
  // Description: Validates form data based on current step
  // Returns: Object with field names as keys and error messages as values
  //
  // EXAMPLE USAGE:
  //   const errors = validateForm(1);  // Validate only step 1
  //   if (errors.firstName) console.log(errors.firstName); // "First name required"
  //   
  //   const allErrors = { ...validateForm(1), ...validateForm(2), ...validateForm(3) };
  //   if (Object.keys(allErrors).length === 0) { // No errors, proceed with submit
  //     submitForm();
  //   }

  
  const validateForm = (currentStep) => {
  const errors = {};

  // Common Regex (Production Grade)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[^\s]{8,}$/;
  const mobileRegex = /^[6-9]\d{9}$/;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  const uanRegex = /^\d{12}$/;
  const accountRegex = /^\d{9,18}$/;

  // ================= STEP 1 =================
  if (currentStep === 1) {
    // First Name
    if (!form.firstName?.trim()) {
      errors.firstName = "First name required";
    } else if (form.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    }

    // Email
    if (!form.email?.trim()) {
      errors.email = "Email required";
    } else if (!emailRegex.test(form.email.trim())) {
      errors.email = "Invalid email format (e.g., user@company.com)";
    }

    // Password
    if (!form.password) {
      errors.password = "Password required";
    } else if (!passwordRegex.test(form.password)) {
      errors.password =
        "Password must contain uppercase, lowercase, number, special character & be 8+ characters";
    }

    // Contact Number
    if (!form.contactNo?.trim()) {
      errors.contactNo = "Contact number required";
    } else if (!mobileRegex.test(form.contactNo.trim())) {
      errors.contactNo =
        "Enter valid 10-digit Indian mobile number starting with 6-9";
    }

    // DOB with Age & Future Check
    if (!form.dob) {
      errors.dob = "Date of birth required";
    } else {
      const dobDate = new Date(form.dob);
      const today = new Date();

      if (dobDate > today) {
        errors.dob = "Date of birth cannot be in the future";
      } else {
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) age--;

        if (age < 18) {
          errors.dob = "Employee must be at least 18 years old";
        }
      }
    }

    // Gender
    if (!form.gender) {
      errors.gender = "Gender required";
    }

    // Profile Image
    if (form.profile) {
      const allowed = ["image/jpeg", "image/png", "image/jpg"];
      if (!allowed.includes(form.profile.type)) {
        errors.profile = "Only JPG or PNG allowed";
      }
      const sizeMB = form.profile.size / (1024 * 1024);
      if (sizeMB > 10) {
        errors.profile = "Image must be less than 10MB";
      }
    }
  }

  // ================= STEP 2 =================
  if (currentStep === 2) {
    if (!form.accountAccess) errors.accountAccess = "Account access required";
    if (!form.role) errors.role = "Role required";
    if (!form.position) errors.position = "Position required";
    if (!form.department) errors.department = "Department required";

   if (!form.doj) {
  errors.doj = "Date of joining required";
} else {
  const dojDate = new Date(form.doj);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1 month future limit
  const oneMonthLater = new Date(today);
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  if (dojDate > oneMonthLater) {
    errors.doj = "Joining date cannot be more than 1 month in the future";
  } else if (form.dob && dojDate <= new Date(form.dob)) {
    errors.doj = "Joining date must be after date of birth";
  }
}

    if (!form.shift) errors.shift = "Shift required";
    if (!form.locationType) errors.locationType = "Location type required";
  }

  // ================= STEP 3 =================
  if (currentStep === 3) {
    // PAN (Required)
    if (!form.pan?.trim()) {
      errors.pan = "PAN number required";
    } else {
      const panValue = form.pan.trim().toUpperCase();
      if (!panRegex.test(panValue)) {
        errors.pan = "Invalid PAN format. Example: ABCDE1234F";
      }
    }

    // Bank Name
    if (form.bankName?.trim() && form.bankName.trim().length < 3) {
      errors.bankName = "Bank name must be at least 3 characters";
    }

    // Bank Account
    if (form.bankAccount && !accountRegex.test(form.bankAccount)) {
      errors.bankAccount = "Bank account must be 9–18 digits";
    }

    // IFSC
    if (form.bankIFSC) {
      const ifscValue = form.bankIFSC.toUpperCase();
      if (!ifscRegex.test(ifscValue)) {
        errors.bankIFSC = "Invalid IFSC format (e.g., HDFC0001234)";
      }
    }

    // UAN
    if (form.uan && !uanRegex.test(form.uan)) {
      errors.uan = "UAN must be exactly 12 digits";
    }
  }

  return errors;
};

  // Edit Employee Form by  Aman

  // --------------------------
  // Handle input change
  // --------------------------
  const handleChange = async (e) => {
    const { name, value, type, files } = e.target;
    let sanitizedValue = value.trimStart();

    if (name === "email") sanitizedValue = value.toLowerCase().trim();
    if (name === "firstName" || name === "lastName")
      sanitizedValue = value.replace(/[^a-zA-Z ]/g, "");
    if (name === "contactNo")
      sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
    if (name === "pan")
      sanitizedValue = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 10);
    if (name === "uan") sanitizedValue = value.replace(/\D/g, "").slice(0, 12);
    if (name === "bankAccount")
      sanitizedValue = value.replace(/\D/g, "").slice(0, 16);
    if (name === "bankIFSC")
      sanitizedValue = value.replace(/\s+/g, "").toUpperCase().slice(0, 12);

    // if (type === "file") sanitizedValue = files[0];
    if (type === "file" && name === "profile") {
      let uploadedFile = files[0];

      // Auto compress (if you added compression)
      uploadedFile = await compressImageIfSmall(uploadedFile);
      sanitizedValue = uploadedFile;

      // 🔥 Create preview image
      setPreview(URL.createObjectURL(uploadedFile));
    }

    setForm({ ...form, [name]: sanitizedValue });

    // Remove error for this field if valid
    setFormErrors((prev) => {
      const newErrors = { ...prev };
      if (name === "bankName" && sanitizedValue.length >= 3)
        delete newErrors.bankName;
      if (
        name === "bankAccount" &&
        sanitizedValue.length >= 9 &&
        sanitizedValue.length <= 16
      )
        delete newErrors.bankAccount;
      if (
        name === "bankIFSC" &&
        /^[A-Z]{4}0[A-Z0-9]{6}$/i.test(sanitizedValue.length === 12)
      )
        delete newErrors.bankIFSC;
      if (name === "UANNumber" && sanitizedValue.length === 12)
        delete newErrors.UANNumber;
      if (name === "pan" && sanitizedValue.length === 10) delete newErrors.pan;
      return newErrors;
    });
  };

  // Data loading functions
  const loadEmployeeData = () => {
    api.get(`/api/employee`, {}).then((response) => {
      if (Array.isArray(response.data)) {
        setRowData([]);
        response.data.forEach((data) => {
          let temp = {
            Email: data["Email"],
            Account:
              data["Account"] === 1
                ? 1
                : data["Account"] === 2
                  ? 2
                  : data["Account"] === 3
                    ? 3
                    : data["Account"] === 4
                      ? 4
                      : "",
            FirstName: data["FirstName"],
            LastName: data["LastName"],
            empID: data["empID"],
            BankName: data["BankName"],
            BankAccount: data["BankAccount"],
            BankIFSC: data["BankIFSC"],
            UANNumber: data["UANNumber"],
            LocationType: data["LocationType"],
          };
          setRowData((prevData) => [...prevData, temp]);
        });
      }
    });
  };
  const loadRoleInfo = () => {
    api.get(`/api/role`, {}).then((response) => setRoleData(response.data));
  };
  const loadPositionInfo = () => {
    api
      .get(`/api/position`, {})
      .then((response) => setPositionData(response.data));
  };
  const loadDepartmentInfo = () => {
    api
      .get(`/api/department`, {})
      .then((response) => setDepartmentData(response.data));
  };
  const fetchShifts = async () => {
    try {
      const response = await api.get(`/api/shifts`, {});
      if (Array.isArray(response.data)) setShifts(response.data);
    } catch (error) {}
  };

  // // Submit handler
  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   const errors = validateForm();
  //   setFormErrors(errors);
  //   if (Object.keys(errors).length === 0) {
  //     props.onEmployeeSubmit(e, form);
  //   }
  // };
  // --------------------------
  // Submit handler
  // --------------------------
  const handleSubmit = (e) => {
    e.preventDefault();
    // const errors = validateForm();
    //  validateForm(1); aman
    const errors = {
      ...validateForm(1),
      ...validateForm(2),
      ...validateForm(3),
    };

    setFormErrors(errors);

    console.log("Form Errors:", errors);
    if (Object.keys(errors).length === 0) {
      props.onEmployeeSubmit(form);
    } else {
      toast.error("Please fill the required form before submitting");
    }
  };

  // Calculate max DOB = Today - 18 years
  const today = new Date();
  const adultDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  const maxDOB = adultDate.toISOString().split("T")[0];

  return (
    <div className="container-fluid py-3">
      <TittleHeader
        title={"Create New Employee"}
        message={"You can create new user here."}
      />

      <div
        style={{ position: "relative", maxHeight: "80vh" }}
        className="d-flex flex-column flex-md-row  gap-2 justify-content-between mt-2"
      >
        <div
          className="d-flex flex-column gap-2 rounded-2"
          style={{
            height: "fit-content",
            width: "18%",
            whiteSpace: "pre",
            color: darkMode
              ? "var(--secondaryDashColorDark)"
              : "var(--primaryDashMenuColor)",
            position: "sticky",
            top: "0",
          }}
        >
          <div className="my-0 p-3">
            <h6 className="m-0 d-flex align-items-center gap-2">
              <span>{currentStep - 1}/3</span>
              <span className="d-none d-md-flex"> Completed</span>
            </h6>
          </div>

          <div className="d-flex flex-row w-100 flex-md-column gap-3 gap-md-2">
            {PayrollData.map((stepItem, index) => {
              const stepNumber = stepItem.id;
              const isCompleted = currentStep > stepNumber;
              const isActive = currentStep === stepNumber;

              return (
                <div
                  key={stepItem.id}
                  className="d-flex align-items-center gap-3"
                  style={{
                    borderTop: isCompleted
                      ? "5px solid #007aff"
                      : darkMode
                        ? "5px solid rgba(213, 215, 218, 1)"
                        : "5px solid rgba(75, 77, 78, 0.93)",
                    padding: ".25rem .625rem .625rem .625rem",
                    width: "100%",
                  }}
                >
                  {/* Completed ✔ */}
                  {isCompleted ? (
                    <span
                      className="badge-success d-flex align-items-center justify-content-center"
                      style={{
                        height: "2rem",
                        width: "2rem",
                        borderRadius: "50%",
                        border: "2px solid #07aaff",
                      }}
                    >
                      <LuCheck />
                    </span>
                  ) : isActive ? (
                    // Active Step
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        height: "2rem",
                        width: "2rem",
                        borderRadius: "50%",
                        border: "2px solid #07aaff",
                        background: darkMode
                          ? "rgba(255, 255, 255, 0.76)"
                          : "rgba(54, 54, 54, 0.73)",
                      }}
                    >
                      {stepNumber}
                    </div>
                  ) : (
                    // Inactive step
                    <div
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        height: "2rem",
                        width: "2rem",
                        borderRadius: "50%",
                        background: darkMode
                          ? "rgba(206, 200, 200, 0.76)"
                          : "rgba(73, 72, 72, 0.73)",
                      }}
                    >
                      {stepNumber}
                    </div>
                  )}

                  <div className="d-none d-md-flex flex-column">
                    <h6 className="my-0">{stepItem.pageName}</h6>
                    <p className="my-0">{stepItem.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="d-flex flex-column gap-3 flex-grow-1 p-2 rounded-2"
          style={{ width: "100%", overflow: "hidden" }}
        >
          {/* in this code aman */}
          <form
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            style={{
              height: "fit-content",
              maxHeight: "75vh",
              color: darkMode
                ? "var(--secondaryDashColorDark)"
                : "var(--primaryDashMenuColor)",
              position: "relative",
              overflow: "auto",
            }}
            className={`d-flex flex-column flex-grow-1 p-2  rounded-2 mb-2 rounded-2`}
          >
            <div className="d-flex flex-column w-100 gap-2">
              <div
                style={{ height: "fit-content" }}
                className="d-flex align-items-start justify-content-between"
              ></div>
              <div
                style={{
                  height: "66vh",
                  overflow: "auto",
                  position: "relative",

                  border: darkMode
                    ? "1px solid rgba(193,189,189)"
                    : "1px solid rgba(193,189,189)",
                }}
                className={`rounded-2`}
              >
                <div
                  className="mt-0 mb-0"
                  style={{
                    padding: "20px",
                  }}
                >
                  <div
                    className=" row  row-gap-2 m-0"
                    encType="multipart/form-data"
                  >
                    {step === 1 && (
                      <>
                        <label
                          style={{
                            color: darkMode
                              ? "var(--secondaryDashColorDark)"
                              : "var(--secondaryDashMenuColor)",
                          }}
                        >
                          Profile Image
                        </label>
                        <div className="form-input mb-3">
                          <label
                            htmlFor="profileUpload"
                            className="p-1 text-center d-flex flex-column align-items-center justify-content-center"
                            style={{
                              border: "1px solid #887c7dff",
                              color: "#887c7dff",
                              cursor: "pointer",
                              borderRadius: "30px",
                              height: "120px",
                              width: "200px",
                              background: darkMode ? "#f3f3f3" : "#2d2d2d",
                              overflow: "hidden",
                            }}
                          >
                            {preview ? (
                              <img
                                src={preview}
                                alt="Preview"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "20px",
                                }}
                              />
                            ) : (
                              <>
                                <span className="fs-1 fw-bold">+</span>
                                <div>Click to upload</div>
                              </>
                            )}
                          </label>

                          <input
                            id="profileUpload"
                            type="file"
                            accept="image/*"
                            // name="profileImage"
                            name="profile"
                            onChange={handleChange}
                            style={{ display: "none" }}
                          />

                          {formErrors.profile && (
                            <span className="text-danger">
                              {formErrors.profile}
                            </span>
                          )}
                        </div>

                        {/* Column 1 */}
                        <div className="col-12 col-md-6">
                          {/* First Name */}
                          <label
                            style={{
                              color: darkMode
                                ? "var(--secondaryDashColorDark)"
                                : "var(--secondaryDashMenuColor)",
                            }}
                          >
                            First Name <sup className="text-danger">*</sup>
                          </label>
                          <div className="form-input mb-3">
                            <input
                              className={`form-control rounded-2 ${
                                darkMode
                                  ? "bg-light text-dark"
                                  : "bg-dark text-light"
                              }`}
                              type="text"
                              placeholder="First Name"
                              name="firstName"
                              value={form.firstName}
                              onChange={handleChange}
                            />
                            {formErrors.firstName && (
                              <span className="text-danger">
                                {formErrors.firstName}
                              </span>
                            )}
                          </div>

                          {/* Last Name */}
                          <label
                            style={{
                              color: darkMode
                                ? "var(--secondaryDashColorDark)"
                                : "var(--secondaryDashMenuColor)",
                            }}
                          >
                            Last Name <sup className="text-danger">*</sup>
                          </label>
                          <div className="form-input mb-3">
                            <input
                              className={`form-control rounded-2 ${
                                darkMode
                                  ? "bg-light text-dark"
                                  : "bg-dark text-light"
                              }`}
                              type="text"
                              placeholder="Last Name"
                              name="lastName"
                              value={form.lastName}
                              onChange={handleChange}
                            />
                            {formErrors.lastName && (
                              <span className="text-danger">
                                {formErrors.lastName}
                              </span>
                            )}
                          </div>

                          {/* Email */}
                          <label
                            style={{
                              color: darkMode
                                ? "var(--secondaryDashColorDark)"
                                : "var(--secondaryDashMenuColor)",
                            }}
                          >
                            Email <sup className="text-danger">*</sup>
                          </label>
                          <div className="form-input mb-3">
                            <input
                              className={`form-control rounded-2 ${
                                darkMode
                                  ? "bg-light text-dark"
                                  : "bg-dark text-light"
                              }`}
                              type="email"
                              placeholder="Email"
                              name="email"
                              value={form.email}
                              onChange={handleChange}
                            />
                            {formErrors.email && (
                              <span className="text-danger">
                                {formErrors.email}
                              </span>
                            )}
                          </div>

                          {/* Password */}
                          <label
                            style={{
                              color: darkMode
                                ? "var(--secondaryDashColorDark)"
                                : "var(--secondaryDashMenuColor)",
                            }}
                          >
                            Password <sup className="text-danger">*</sup>
                          </label>
                          <div className="form-input position-relative mb-3">
                            <input
                              className={`form-control rounded-2 ${
                                darkMode
                                  ? "bg-light text-dark"
                                  : "bg-dark text-light"
                              }`}
                              placeholder="Password"
                              type={seePass ? "text" : "password"}
                              name="password"
                              value={form.password}
                              onChange={handleChange}
                            />
                            <span
                              className="fs-5 text-muted"
                              style={{
                                position: "absolute",
                                top: "50%",
                                right: "10px",
                                cursor: "pointer",
                                transform: "translateY(-50%)",
                              }}
                              onClick={() => setSeepass(!seePass)}
                            >
                              {seePass ? <GoEyeClosed /> : <RxEyeOpen />}
                            </span>

                            {formErrors.password && (
                              <span className="text-danger">
                                {formErrors.password}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Column 2 */}
                        <div className="col-12 col-md-6">
                          {/* Contact No */}
                          <label
                            style={{
                              color: darkMode
                                ? "var(--secondaryDashColorDark)"
                                : "var(--secondaryDashMenuColor)",
                            }}
                          >
                            Contact No <sup className="text-danger">*</sup>
                          </label>
                          <div className="form-input mb-3">
                            <NumericInput
                              value={form.contactNo}
                              maxLength={10}
                              placeholder="Contact No"
                              onChange={(val) =>
                                setForm({ ...form, contactNo: val })
                              }
                            />
                            {formErrors.contactNo && (
                              <span className="text-danger">
                                {formErrors.contactNo}
                              </span>
                            )}
                          </div>

                          {/* DOB */}
                          <label
                            style={{
                              color: darkMode
                                ? "var(--secondaryDashColorDark)"
                                : "var(--secondaryDashMenuColor)",
                            }}
                          >
                            DOB <sup className="text-danger">*</sup>
                          </label>

                          <div className="form-input mb-3">
                            <input
                              className={`form-control rounded-2 ${
                                darkMode
                                  ? "bg-light text-dark"
                                  : "bg-dark text-light"
                              }`}
                              type="date"
                              name="dob"
                              value={form.dob}
                              onChange={handleChange}
                              max={new Date().toISOString().split("T")[0]} // ✔ BLOCK FUTURE YEARS
                            />

                            {formErrors.dob && (
                              <span className="text-danger">
                                {formErrors.dob}
                              </span>
                            )}
                          </div>

                          {/* Gender */}
                          <label
                            style={{
                              color: darkMode
                                ? "var(--secondaryDashColorDark)"
                                : "var(--secondaryDashMenuColor)",
                            }}
                          >
                            Gender <sup className="text-danger">*</sup>
                          </label>
                          <div className="d-flex gap-3 mb-3">
                            <Form.Check
                              inline
                              type="radio"
                              label="Male"
                              value="male"
                              name="gender"
                              onChange={handleChange}
                              checked={form.gender === "male"}
                            />
                            <Form.Check
                              inline
                              type="radio"
                              label="Female"
                              value="female"
                              name="gender"
                              onChange={handleChange}
                              checked={form.gender === "female"}
                            />
                          </div>
                          {formErrors.gender && (
                            <span className="text-danger">
                              {formErrors.gender}
                            </span>
                          )}
                        </div>
                      </>
                    )}

                    {/* step 2 form */}
                    {step === 2 && (
                   <>2</>
                    )}

                    {/* step 3 form */}
                    {step === 3 && (
                    <>3</>
                    )}
                  </div>
                  <hr className="m-0 py-1" style={{ opacity: "0" }} />
                </div>
              </div>
            </div>
            {/* nav btn */}

            {step === 1 && (
              <div className="p-2 d-flex flex-column gap-2 mt-2">
                <div
                  className={`d-flex align-items-end p-2 rounded-2 bg-red-200 justify-content-end ${
                    darkMode ? "bg-light text-dark" : "bg-dark text-light"
                  }`}
                >
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      const errors = validateForm(1);
                      setFormErrors(errors);
                      if (Object.keys(errors).length === 0) {
                        setStep(2);
                        setCurrentStep(2);
                      } else {
                        toast.error("Please fill Personal Details correctly");
                      }
                    }}
                  >
                    Next <GrFormNext />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-2 d-flex flex-column gap-2 mt-2">
                <div
                  className={`d-flex align-items-between p-2 rounded-2 justify-content-between ${
                    darkMode ? "bg-light text-dark" : "bg-dark text-light"
                  }`}
                >
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      setStep(1);
                    }}
                  >
                    <IoChevronBack /> Back
                  </button>

                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      const errors = validateForm(2);
                      setFormErrors(errors);
                      if (Object.keys(errors).length === 0) {
                        setStep(3);
                        setCurrentStep(3);
                      } else {
                        toast.error("Please fill Employee Details correctly");
                      }
                    }}
                  >
                    Next <GrFormNext />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="p-2 d-flex flex-column gap-2 mt-2">
                <div
                  className={`d-flex align-items-between p-2 rounded-2 justify-content-between ${
                    darkMode ? "bg-light text-dark" : "bg-dark text-light"
                  }`}
                >
                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    onClick={(e) => {
                      e.preventDefault();
                      setStep(2);
                      setCurrentStep(2);
                    }}
                  >
                    <IoChevronBack /> Back
                  </button>

                  <button
                    className="btn btn-primary d-flex align-items-center gap-2"
                    type="submit"
                  >
                    Submit <MdOutlineDoneAll />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;


