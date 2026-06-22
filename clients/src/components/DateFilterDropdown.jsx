import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { IoChevronDownOutline, IoChevronUpOutline } from "react-icons/io5";
import select_range_date from "../assets/images/select-date.png";
import { format } from "date-fns";

const dateOptions = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_week", label: "Last Week" },
  { value: "last_15_days", label: "Last 15 Days" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom" },
];

export default function DateFilterDropdown({
  padding = "6px 14px",
  selectedDateRange,
  setSelectedDateRange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [tempDateRange, setTempDateRange] = useState([null, null]);
  const [startDate, endDate] = tempDateRange;
  const dropdownRef = useRef(null);

  // Initialize tempDateRange from props
  useEffect(() => {
    if (selectedDateRange?.startDate && selectedDateRange?.endDate) {
      setTempDateRange([selectedDateRange.startDate, selectedDateRange.endDate]);
    }
  }, [selectedDateRange]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDisplayLabel = () => {
    if (!selectedOption) {
      return "Select Date Range";
    }
    if (selectedOption?.value === "all") {
      return "All";
    }

    if (selectedDateRange.startDate && selectedDateRange.endDate) {
      return `${format(selectedDateRange.startDate, 'dd/MM/yyyy')} - ${format(selectedDateRange.endDate, 'dd/MM/yyyy')}`;
    }

    return "Select Date Range";
  };

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);

    if (option.value === "all") {
      setSelectedDateRange({
        startDate: null,
        endDate: null
      });
      setTempDateRange([null, null]);
      setShowCalendar(false);
      return;
    }

    if (option.value === "custom") {
      setShowCalendar(true);
      // Reset temp dates to current selected dates or null
      setTempDateRange([
        selectedDateRange.startDate,
        selectedDateRange.endDate
      ]);
    } else {
      setShowCalendar(false);
      calculateAndSetDateRange(option.value);
    }
  };

  const calculateAndSetDateRange = (optionValue) => {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    switch (optionValue) {
      case "today":
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "yesterday":
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        startDate = new Date(yesterday);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "last_week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "last_15_days":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 15);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      case "last_month":
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        break;

      default:
        // Clear filter
        startDate = null;
        endDate = null;
    }

    // Update parent state
    setSelectedDateRange({
      startDate,
      endDate
    });

    // Reset temp range
    setTempDateRange([null, null]);
  };

  const handleApplyCustomRange = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    const startDateWithTime = new Date(startDate);
    startDateWithTime.setHours(0, 0, 0, 0);

    const endDateWithTime = new Date(endDate);
    endDateWithTime.setHours(23, 59, 59, 999);

    // Update parent state
    setSelectedDateRange({
      startDate: startDateWithTime,
      endDate: endDateWithTime
    });

    // Update selected option
    setSelectedOption({
      value: "custom",
      label: `${format(startDateWithTime, 'dd/MM/yyyy')} - ${format(endDateWithTime, 'dd/MM/yyyy')}`
    });

    // Close dropdowns
    setShowCalendar(false);
    setIsOpen(false);
  };


  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: padding,
          border: "1px solid #D1D5DB",
          borderRadius: "12px",
          backgroundColor: "#FFFFFF",
          cursor: "pointer",
          fontSize: "15px",
          fontFamily: '"Inter", sans-serif',
          color: "#374151",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          transition: "all 0.2s",
          minWidth: "200px",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)")}
      >
        <img src={select_range_date} alt="select-date" style={{ width: "18px", height: "18px" }} />
        <span style={{ flex: 1, textAlign: "left" }}>{getDisplayLabel()}</span>
        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
          {isOpen ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
        </span>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "8px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            border: "1px solid #E5E7EB",
            overflow: "hidden",
            zIndex: 9999,
            animation: "fadeIn 0.2s ease-out",
            minWidth: "200px",
            padding: '5px 5px'
          }}
        >

          {dateOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option)}
              style={{
                padding: "8px 16px",
                fontSize: "14px",
                borderRadius: '8px',
                fontFamily: '"Inter", sans-serif',
                color: selectedOption?.value === option.value ? "#0E101A" : "#374151",
                fontWeight: selectedOption?.value === option.value ? "600" : "500",
                backgroundColor:
                  selectedOption?.value === option.value ? "#e5f0ff" : "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom: option.value === "custom" ? "1px solid #f0f0f0" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e5f0ff";
                e.currentTarget.style.color = "#0E101A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  selectedOption?.value === option.value ? "#e5f0ff" : "transparent";
                e.currentTarget.style.color =
                  selectedOption?.value === option.value ? "#0E101A" : "#374151";
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Custom Range Calendar */}
      {showCalendar && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "8px",
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
            border: "1px solid #E5E7EB",
            zIndex: 10000,
            padding: "12px",
          }}
        >
          <DatePicker
            selectsRange
            inline
            startDate={startDate}
            endDate={endDate}
            onChange={(update) => {
              setTempDateRange(update);
            }}
            monthsShown={1}
          />

          <div style={{ marginTop: "10px", display: "flex", gap: "8px", justifyContent: "center" }}>
            <button
              onClick={handleApplyCustomRange}
              disabled={!startDate || !endDate}
              style={{
                padding: "8px 16px",
                backgroundColor: startDate && endDate ? "#1F7FFF" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: startDate && endDate ? "pointer" : "not-allowed",
                fontSize: "14px",
                flex: 1,
              }}
            >
              Apply
            </button>

            <button
              onClick={() => {
                setShowCalendar(false);
                setTempDateRange([null, null]);
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#f5f5f5",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
          </div>

          {startDate && !endDate && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "8px", textAlign: "center" }}>
              tap again for single select <br /> drag to select range
            </div>
          )}
        </div>
      )}

      {/* Fade In Animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}