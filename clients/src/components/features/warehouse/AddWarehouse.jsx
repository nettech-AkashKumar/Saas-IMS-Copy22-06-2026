import React, { useState, useRef, useEffect } from "react";
import Select from "react-select";
import { Country, State, City } from "country-state-city";

/* <========---- icons ----=========> */
import { FaArrowLeft } from "react-icons/fa6";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance";

function AddWarehouse() {
  const location = useLocation();
  const navigate = useNavigate();
  const editWarehouse = location.state?.warehouse;
  const warehouseId = editWarehouse?.id || editWarehouse?._id;
  const [isEdit, setIsEdit] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedWarehouseType, setSelectedWarehouseType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Active");
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [save, setSave] = useState(false);
  const [errors, setErrors] = useState({
    warehouseName: "",
    warehouseCode: "",
    warehouseType: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    addressLine2: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
  });
  const [form, setForm] = useState({
    warehouseName: "",
    warehouseCode: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    addressLine2: "",
    pincode: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    let cleanedValue = value;

    if (name === "pincode") {
      cleanedValue = value.replace(/\D/g, "").slice(0, 6);
    }

    if (name === "contactPerson") {
      cleanedValue = value.replace(/[^A-Za-z\s]/g, "");
    }

    if (name === "phone") {
      cleanedValue = value.replace(/\D/g, "").slice(0, 10);
    }

    setForm((prev) => ({
      ...prev,
      [name]: cleanedValue,
    }));
  };

  const handleGenerateCode = () => {
    setForm((prev) => ({
      ...prev,
      warehouseCode: `WH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    }));
  };

  useEffect(() => {
    if (!editWarehouse) {
      return;
    }

    setIsEdit(true);
    setForm({
      warehouseName: editWarehouse.name || editWarehouse.warehouseName || "",
      warehouseCode: editWarehouse.code || editWarehouse.warehouseCode || "",
      contactPerson:
        editWarehouse.manager ||
        editWarehouse.warehouseOwner ||
        editWarehouse.contactPerson ||
        "",
      phone: editWarehouse.phone || "",
      email: editWarehouse.email || "",
      address: editWarehouse.address || "",
      addressLine2: "",
      pincode: editWarehouse.pinCode || editWarehouse.pincode || "",
    });
    setSelectedStatus(editWarehouse.status || "Active");
    setSelectedWarehouseType(
      editWarehouse.space || editWarehouse.warehouseType || "",
    );

    if (editWarehouse.country) {
      const countryOption = Country.getAllCountries().find(
        (country) => country.name === editWarehouse.country,
      );
      setSelectedCountry(
        countryOption
          ? { value: countryOption.isoCode, label: countryOption.name }
          : null,
      );

      if (countryOption && editWarehouse.state) {
        const stateOption = State.getStatesOfCountry(
          countryOption.isoCode,
        ).find((state) => state.name === editWarehouse.state);
        setSelectedState(
          stateOption
            ? { value: stateOption.isoCode, label: stateOption.name }
            : null,
        );

        if (stateOption && editWarehouse.city) {
          const cityOption = City.getCitiesOfState(
            countryOption.isoCode,
            stateOption.isoCode,
          ).find((city) => city.name === editWarehouse.city);
          setSelectedCity(
            cityOption
              ? { value: cityOption.name, label: cityOption.name }
              : null,
          );
        }
      }
    }
  }, [editWarehouse]);

  // ✅ Fixed: added email regex, kept contactPerson & phone rules
  const validateField = (name, value) => {
    if (!value || String(value).trim() === "") {
      return "This field is required";
    }

    if (name === "contactPerson") {
      const nameRegex = /^[A-Za-z\s]+$/;
      if (!nameRegex.test(value.trim())) {
        return "Only alphabets and spaces are allowed";
      }
    }

    if (name === "phone") {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(value.trim())) {
        return "Contact Number must be exactly 10 digits";
      }
    }

    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        return "Please enter a valid email address";
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSave(true);

    const payload = {
      warehouseName: form.warehouseName.trim(),
      warehouseCode: form.warehouseCode.trim(),
      warehouseOwner: form.contactPerson.trim(),
      warehouseManager: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      phoneWork: "",
      address:
        `${form.address.trim()}${form.addressLine2.trim() ? ` ${form.addressLine2.trim()}` : ""}`.trim(),
      country: selectedCountry?.label || "",
      state: selectedState?.label || "",
      city: selectedCity?.label || "",
      pinCode: form.pincode.trim(),
      status: selectedStatus || "Active",
      space: selectedWarehouseType,
    };

    // ✅ Fixed: all 5 issues now validated
    const newErrors = {
      warehouseName: validateField("warehouseName", payload.warehouseName),
      warehouseCode: validateField("warehouseCode", payload.warehouseCode),
      warehouseType: selectedWarehouseType ? "" : "Please select a warehouse type",
      contactPerson: validateField("contactPerson", form.contactPerson),
      phone: validateField("phone", payload.phone),
      email: validateField("email", payload.email),
      address: validateField("address", form.address.trim()),
      country: validateField("country", payload.country),
      state: validateField("state", payload.state),
      city: validateField("city", payload.city),
      pincode: validateField("pincode", payload.pinCode),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error !== "")) {
      toast.error("Please fill all required warehouse fields correctly.");
      setSave(false);
      return;
    }

    try {
      if (isEdit && warehouseId) {
        await api.patch(`/api/warehouse/${warehouseId}`, payload);
        toast.success("Warehouse updated successfully");
      } else {
        await api.post("/api/warehouse", payload);
        toast.success("Warehouse added successfully");
      }
      navigate("/warehouse");
    } catch (error) {
      console.error("Add warehouse error:", error.response || error.message);
      toast.error(
        error.response?.data?.message ||
        "Failed to add warehouse. Please try again.",
      );
    } finally {
      setSave(false);
    }
  };

  const dropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);

  const countryOptions = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));

  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.value).map((state) => ({
      value: state.isoCode,
      label: state.name,
    }))
    : [];

  const cityOptions =
    selectedCountry && selectedState
      ? City.getCitiesOfState(selectedCountry.value, selectedState.value).map(
        (city) => ({
          value: city.name,
          label: city.name,
        }),
      )
      : [];

  const handleCountryChange = (selectedOption) => {
    setSelectedCountry(selectedOption);
    setSelectedState(null);
    setSelectedCity(null);
  };

  const handleStateChange = (selectedOption) => {
    setSelectedState(selectedOption);
    setSelectedCity(null);
  };

  const handleCityChange = (selectedOption) => {
    setSelectedCity(selectedOption);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }

      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target)
      ) {
        setStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="p-4" style={{ height: "100vh" }}>
      {/* Header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
          flexWrap: "wrap",
        }}
      >
        {/* Left */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
          }}
        >
          {/* Back Button */}
          <Link
            to={location.state?.from || "/dashboard"}
            style={{
              width: 32,
              height: 32,
              background: "white",
              borderRadius: 53,
              border: "1.07px solid #EAEAEA",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>

          {/* Title */}
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            {isEdit ? "Edit Warehouse" : "Add New Warehouse"}
          </h2>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            width: "100%",
            padding: "16px",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #EAEAEA",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "calc(100vh - 200px)",
            position: "relative",
            marginBottom: "20px",
          }}
        >
          {/* General Details */}
          <div
            style={{
              width: "100%",
              borderBottom: "1px solid #EAEAEA",
              paddingBottom: "24px",
            }}
          >
            {/* Heading */}
            <div
              style={{
                color: "black",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Basic Information
            </div>

            {/* Inputs */}
            <div
              style={{
                rowGap: "20px",
                columnGap: "50px",
                width: "100%",
                marginTop: "16px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              {/* Warehouse Name */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <span
                  style={{
                    color: "#727681",
                    fontSize: "12px",
                    fontWeight: 400,
                  }}
                >
                  Warehouse Name <span
                    style={{
                      color: "var(--Danger, #D00003)",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    *
                  </span>
                </span>
                <input
                  type="text"
                  name="warehouseName"
                  value={form.warehouseName}
                  onChange={handleChange}
                  placeholder="Enter Warehouse Name"
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1px solid #EAEAEA",
                    borderRadius: 8,
                    padding: "0px 12px",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {/* ✅ Already existed */}
                {errors.warehouseName && (
                  <small className="text-danger">{errors.warehouseName}</small>
                )}
              </div>

              {/* Warehouse Code */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "var(--Black-Grey, #727681)",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    Warehouse Code
                  </span>

                  <span
                    style={{
                      color: "var(--Danger, #D00003)",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    *
                  </span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    display: "flex",
                  }}
                >
                  <input
                    type="text"
                    name="warehouseCode"
                    value={form.warehouseCode}
                    readOnly
                    placeholder="Warehouse Code"
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      color: "var(--Black-Black, #0E101A)",
                      fontSize: "14px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      outline: "none",
                    }}
                  />

                  {!isEdit && (
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      style={{
                        padding: "4px 8px",
                        background: "#1F7FFF",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        style={{
                          color: "white",
                          fontSize: "12px",
                          fontFamily: "Inter",
                          fontWeight: "400",
                        }}
                      >
                        Generate
                      </span>
                    </button>
                  )}
                </div>
                {/* ✅ Fixed: show error when code not generated */}
                {errors.warehouseCode && (
                  <small className="text-danger">{errors.warehouseCode}</small>
                )}
              </div>

              {/* Warehouse Type Dropdown */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    Warehouse Type
                  </span>

                  <span
                    style={{
                      color: "#D00003",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    *
                  </span>
                </div>

                <div
                  ref={dropdownRef}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    display: "flex",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  <div
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      display: "flex",
                      gap: "5px",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        color: "#0E101A",
                        fontSize: "14px",
                        fontFamily: "Inter",
                        fontWeight: "400",
                        lineHeight: "14.40px",
                        width: "100%",
                      }}
                    >
                      {selectedWarehouseType || "Select Warehouse Type"}
                    </span>
                  </div>

                  <div onClick={() => setDropdownOpen(!dropdownOpen)}>
                    {dropdownOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
                  </div>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "42px",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #E1E1E1",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        maxHeight: "300px",
                        overflowY: "auto",
                        zIndex: 1000,
                      }}
                    >
                      {[
                        "Cold Storage",
                        "Distribution Center",
                        "Retail Warehouse",
                        "Private Warehouse",
                        "Public Warehouse",
                        "Smart Warehouse",
                      ].map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedWarehouseType(item);
                            setDropdownOpen(false);
                          }}
                          className="button-hover"
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontSize: 14,
                            color: "#0E101A",
                            borderBottom:
                              index !== 5 ? "1px solid #F3F3F3" : "none",
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {/* ✅ Fixed: warehouse type error now displayed */}
                {errors.warehouseType && (
                  <small className="text-danger">{errors.warehouseType}</small>
                )}
              </div>

              {/* Status Dropdown */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                    }}
                  >
                    Status
                  </span>

                  <span
                    style={{
                      color: "#D00003",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                    }}
                  >
                    *
                  </span>
                </div>

                <div
                  ref={statusDropdownRef}
                  style={{
                    width: "100%",
                    height: "40px",
                    padding: "0 12px",
                    background: "white",
                    borderRadius: "8px",
                    border: "1px solid #EAEAEA",
                    justifyContent: "space-between",
                    alignItems: "center",
                    display: "flex",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                    }}
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  >
                    <span
                      style={{
                        color: "#0E101A",
                        fontSize: "14px",
                        fontFamily: "Inter",
                        fontWeight: "400",
                      }}
                    >
                      {selectedStatus || "Select Status"}
                    </span>
                  </div>

                  <div
                    onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  >
                    {statusDropdownOpen ? <IoIosArrowUp /> : <IoIosArrowDown />}
                  </div>

                  {statusDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "42px",
                        left: 0,
                        right: 0,
                        backgroundColor: "white",
                        border: "1px solid #E1E1E1",
                        borderRadius: "8px",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        zIndex: 1000,
                      }}
                    >
                      {["Active", "Inactive"].map((item, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setSelectedStatus(item);
                            setStatusDropdownOpen(false);
                          }}
                          className="button-hover"
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontSize: 14,
                            color: "#0E101A",
                            borderBottom:
                              index !== 1 ? "1px solid #F3F3F3" : "none",
                          }}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information*/}
          <div
            style={{
              width: "100%",
              borderBottom: "1px solid #EAEAEA",
              paddingBottom: "24px",
            }}
          >
            {/* Heading */}
            <div
              style={{
                color: "black",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Contact Information
            </div>

            {/* Inputs */}
            <div
              style={{
                rowGap: "20px",
                columnGap: "50px",
                width: "100%",
                marginTop: "16px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              {/* Contact Person */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    Contact Person
                  </span>

                  <span
                    style={{
                      color: "var(--Danger, #D00003)",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    *
                  </span>
                </div>
                <input
                  type="text"
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleChange}
                  placeholder="Enter Name"
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1px solid #EAEAEA",
                    borderRadius: 8,
                    padding: "0px 12px",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {/* ✅ Fixed: error display was missing */}
                {errors.contactPerson && (
                  <small className="text-danger">{errors.contactPerson}</small>
                )}
              </div>

              {/* Contact Number */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    Contact Number
                  </span>

                  <span
                    style={{
                      color: "var(--Danger, #D00003)",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    *
                  </span>
                </div>
                <input
                  type="text"
                  name="phone"
                  maxLength={10}
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter Contact Number"
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1px solid #EAEAEA",
                    borderRadius: 8,
                    padding: "0px 12px",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {/* ✅ Already existed */}
                {errors.phone && (
                  <small className="text-danger">{errors.phone}</small>
                )}
              </div>

              {/* Email */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    Email
                  </span>

                  <span
                    style={{
                      color: "var(--Danger, #D00003)",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    *
                  </span>
                </div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter Email"
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1px solid #EAEAEA",
                    borderRadius: 8,
                    padding: "0px 12px",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {/* ✅ Fixed: error display was missing + regex added in validateField */}
                {errors.email && (
                  <small className="text-danger">{errors.email}</small>
                )}
              </div>
            </div>
          </div>

          {/* Address Information*/}
          <div
            style={{
              width: "100%",
            }}
          >
            {/* Heading */}
            <div
              style={{
                color: "black",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              Address Information
            </div>

            {/* Inputs */}
            <div
              style={{
                rowGap: "20px",
                columnGap: "50px",
                width: "100%",
                marginTop: "16px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "flex-start",
              }}
            >
              {/* Address Line 1 */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    Address line 1
                  </span>

                  <span
                    style={{
                      color: "var(--Danger, #D00003)",
                      fontSize: "12px",
                      fontFamily: "Inter",
                      fontWeight: "400",
                      lineHeight: "14.40px",
                    }}
                  >
                    *
                  </span>
                </div>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter Address"
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1px solid #EAEAEA",
                    borderRadius: 8,
                    padding: "0px 12px",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
                {/* ✅ Fixed: error display was missing */}
                {errors.address && (
                  <small className="text-danger">{errors.address}</small>
                )}
              </div>

              {/* Address Line 2 */}
              <div
                style={{
                  width: "22%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: 400,
                    }}
                  >
                    Address Line 2
                  </span>
                </div>
                <input
                  type="text"
                  name="addressLine2"
                  value={form.addressLine2}
                  onChange={handleChange}
                  placeholder="Enter Address"
                  style={{
                    width: "100%",
                    height: 40,
                    border: "1px solid #EAEAEA",
                    borderRadius: 8,
                    padding: "0px 12px",
                    outline: "none",
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            {/* Country, State, City Dropdowns */}
            <div className="d-flex flex-wrap justify-content-between mt-4">
              <div className="col-3 mb-3" style={{ paddingRight: "20px" }}>
                <label className="form-label supplierlabel">
                  Country <span className="text-danger">*</span>
                </label>
                <Select
                  options={countryOptions}
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  placeholder="Select Country"
                  className="supplierinput"
                  styles={{
                    control: (base) => ({
                      ...base,
                      boxShadow: "none",
                      borderColor: "#ced4da",
                      position: "relative",
                    }),
                  }}
                />
                {errors.country && (
                  <small className="text-danger">{errors.country}</small>
                )}
              </div>

              <div className="col-3 mb-3" style={{ paddingRight: "20px" }}>
                <label className="form-label supplierlabel">
                  State <span className="text-danger">*</span>
                </label>
                <Select
                  options={stateOptions}
                  value={selectedState}
                  onChange={handleStateChange}
                  placeholder="Select State"
                  isDisabled={!selectedCountry}
                  className="supplierinput"
                  styles={{
                    control: (base) => ({
                      ...base,
                      boxShadow: "none",
                      borderColor: "#ced4da",
                    }),
                  }}
                />
                {errors.state && (
                  <small className="text-danger">{errors.state}</small>
                )}
              </div>

              <div className="col-3 mb-3" style={{ paddingRight: "10px" }}>
                <label className="form-label supplierlabel">
                  City <span className="text-danger">*</span>
                </label>
                <Select
                  options={cityOptions}
                  value={selectedCity}
                  onChange={handleCityChange}
                  placeholder="Select City"
                  isDisabled={!selectedState}
                  className="supplierinput"
                  styles={{
                    control: (base) => ({
                      ...base,
                      boxShadow: "none",
                      borderColor: "#ced4da",
                    }),
                  }}
                />
                {errors.city && (
                  <small className="text-danger">{errors.city}</small>
                )}
              </div>

              <div className="col-3 mb-3" style={{ paddingLeft: "10px" }}>
                <label className="form-label supplierlabel">Pin code</label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  className="form-control supplierinput shadow-none"
                  placeholder="Enter Pin Code"
                  maxLength="6"
                />
                {errors.pincode && (
                  <small className="text-danger">{errors.pincode}</small>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel and Save Button */}
        <div
          style={{
            width: "100%",
            justifyContent: "end",
            alignItems: "center",
            display: "flex",
            marginTop: 16,
          }}
        >
          <div
            style={{
              paddingLeft: 47,
              paddingRight: 47,
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: 8,
              display: "inline-flex",
            }}
          >
            <Link
              to="/warehouse"
              style={{
                height: 36,
                padding: 8,
                background: "var(--White-Universal-White, white)",
                boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                borderRadius: 8,
                outline: "1.50px var(--Blue-Blue, #1F7FFF) solid",
                outlineOffset: "-1.50px",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 4,
                display: "flex",
                cursor: save ? "not-allowed" : "pointer",
              }}
            >
              <div
                style={{
                  color: "var(--Blue-Blue, #1F7FFF)",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: 5,
                  wordWrap: "break-word",
                }}
              >
                Cancel
              </div>
            </Link>
            <button
              type="submit"
              className="button-color button-hover d-flex justify-content-center align-items-center"
              style={{
                height: 36,
                padding: 8,
                boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                borderRadius: 8,
                outlineOffset: "-1.50px",
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 4,
                display: "flex",
                cursor: save ? "not-allowed" : "pointer",
              }}
              disabled={save}
            >
              <div
                style={{
                  color: "white",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: 5,
                  wordWrap: "break-word",
                }}
              >
                {save
                  ? isEdit
                    ? "Updating..."
                    : "Saving..."
                  : isEdit
                    ? "Update"
                    : "Save"}
              </div>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddWarehouse;