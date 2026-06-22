import React, { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import Select from "react-select";
import { format } from "date-fns";
import { FaCalendarAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "../styles/Responsive.css";

export default function DateRangePicker() {
  const [openDatePicker, setOpenDatePicker] = useState(false);
  const [selectedRange, setSelectedRange] = useState({
    startDate: new Date(2025, 2, 15),
    endDate: new Date(2025, 2, 22),
    key: "selection",
  });

  const [selectedOption, setSelectedOption] = useState({
    value: "custom",
    label: "Select Date Range",
  });

  const dateRef = useRef(null);

  // close popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateRef.current && !dateRef.current.contains(event.target)) {
        setOpenDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "today", label: "Today" },
    { value: "this_week", label: "This Week" },
    { value: "this_month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
  ];

  const handleSelect = (ranges) => {
    setSelectedRange(ranges.selection);
    setOpenDatePicker(false);
  };

  return (
    <div className="d-flex justify-content-center align-items-center">
      <div
        className="d-flex align-items-center border px-2"
        style={{
          position: "relative",
          borderRadius: "8px",
          backgroundColor: "white",
          border: "1px solid rgb(224, 222, 222)",
        }}
      >
        {/* Left Dropdown */}
        <div className="date-range-dashboard" style={{ width: "190px" }}>
          <Select
            value={selectedOption}
            onChange={(opt) => setSelectedOption(opt)}
            options={options}
            className="react-select-container"
            classNamePrefix="react-select"
            styles={{
              control: (base) => ({
                ...base,
                border: "none",
                boxShadow: "none",
                background: "transparent",
                fontSize: "15px",
                cursor: "pointer",
              }),
              singleValue: (base) => ({
                ...base,
                color: "rgba(107, 105, 105, 1)",
                fontSize: "15px",
                fontFamily: '"Inter", sans-serif',
              }),
              indicatorSeparator: () => ({ display: "none" }),
              dropdownIndicator: (base) => ({
                ...base,
                color: "rgba(136, 135, 135, 1)",
              }),
            }}
          />
        </div>

        {/* Divider */}
        <div
          className="border-start mx-2"
          style={{ height: "25px", opacity: 0.4 }}
        ></div>

        {/* Date Range Display */}
        <div
          className="date-range-container d-flex align-items-center gap-2 flex-grow-1"
          style={{ cursor: "pointer" }}
          onClick={() => setOpenDatePicker(!openDatePicker)}
        >
          <FaCalendarAlt
            size={12}
            style={{ color: "rgba(150, 147, 147, 1)" }}
          />
          <span
            style={{
              color: "rgba(107, 105, 105, 1)",
              fontFamily: '"Inter", sans-serif',
            }}
          >
            {`${format(selectedRange.startDate, "dd MMM")} - ${format(
              selectedRange.endDate,
              "dd MMM"
            )}`}
          </span>
          {openDatePicker ? (
            <FaChevronUp size={12} style={{ color: "rgba(150, 147, 147, 1)" }} />
          ) : (
            <FaChevronDown
              size={12}
              style={{ color: "rgba(150, 147, 147, 1)" }}
            />
          )}
        </div>

        {/* Calendar Popup */}
        {openDatePicker && (
          <div
            ref={dateRef}
            className="position-absolute top-100 start-50 translate-middle-x mt-2 bg-white border rounded-3 shadow-lg p-2"
            style={{ zIndex: 2000 }}
          >
            <DateRange
              ranges={[selectedRange]}
              onChange={handleSelect}
              rangeColors={["#0d6efd"]}
              moveRangeOnFirstSelection={false}
              editableDateInputs={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
