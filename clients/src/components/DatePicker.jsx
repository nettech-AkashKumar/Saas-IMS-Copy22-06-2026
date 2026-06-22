import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";
import { IoChevronDownOutline, IoChevronUpOutline } from "react-icons/io5";
import select_range_date from "../assets/images/select-date.png";
import { LuCalendarMinus2 } from "react-icons/lu";

export default function DateFilterDropdown({
  padding = "8px 14px",
  value = "",
  onChange = () => { }
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const dropdownRef = useRef(null);

  // Format the date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Select Date";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return "Select Date";
    }
  };

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

  // Helper function to get date string in YYYY-MM-DD format
  const getDateString = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Handle Today
  const handleSelectToday = () => {
    const today = new Date();
    onChange(getDateString(today));
    setIsOpen(false);
  };

  // Handle Yesterday
  const handleSelectYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    onChange(getDateString(yesterday));
    setIsOpen(false);
  };

  // Handle Last Week (last 7 days from today)
  const handleSelectLastWeek = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    onChange(getDateString(lastWeek));
    setIsOpen(false);
  };

  // Handle Last 15 Days
  const handleSelectLast15Days = () => {
    const last15Days = new Date();
    last15Days.setDate(last15Days.getDate() - 15);
    onChange(getDateString(last15Days));
    setIsOpen(false);
  };

  // Handle Last Month
  const handleSelectLastMonth = () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    onChange(getDateString(lastMonth));
    setIsOpen(false);
  };

  // Handle Custom Date Selection
  const handleDateSelect = (date) => {
    onChange(getDateString(date));
    setShowCalendar(false);
    setIsOpen(false);
  };

  const displayLabel = value ? formatDate(value) : "Select Date";

  // Define all date options
  const dateOptions = [
    { label: "Today", handler: handleSelectToday },
    { label: "Yesterday", handler: handleSelectYesterday },
    { label: "Last Week", handler: handleSelectLastWeek },
    { label: "Last 15 Days", handler: handleSelectLast15Days },
    { label: "Last Month", handler: handleSelectLastMonth },
    { label: "Custom Date", handler: () => setShowCalendar(true) },
  ];

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          // padding: padding,
          border: "none",
          // borderRadius: "12px",
          backgroundColor: "transparent",
          cursor: "pointer",
          fontSize: "15px",
          fontFamily: '"Inter", sans-serif',
          minWidth: "180px",
        }}
      >
        <LuCalendarMinus2 />
        <span style={{ flex: 1, textAlign: "left" }}>{displayLabel}</span>
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
            width: "180px",
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
          }}
        >
          {/* Render all date options */}
          {dateOptions.map((option, index) => (
            <div
              key={index}
              onClick={option.handler}
              style={{
                padding: "12px 16px",
                fontSize: "14px",
                fontFamily: '"Inter", sans-serif',
                color: "#374151",
                fontWeight: "500",
                backgroundColor: "transparent",
                cursor: "pointer",
                transition: "all 0.2s ease",
                borderBottom: index === dateOptions.length - 2 ? "1px solid #E5E7EB" : "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e5f0ff";
                e.currentTarget.style.color = "#0E101A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#374151";
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}

      {/* Calendar for Custom Date Selection */}
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
            zIndex: 9999,
            padding: "12px",
          }}
        >
          <DatePicker
            selected={value ? new Date(value) : null}
            onChange={handleDateSelect}
            maxDate={new Date()} // Prevents future date selection
            inline
            dateFormat="yyyy-MM-dd"
          />
        </div>
      )}

      {/* Fade In Animation */}
      <style jsx>{`
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