import React, { useState } from "react";
import munc_logo from "../../assets/Image/munc-logo.png";
import { GoPlus } from "react-icons/go";
import "../../assets/css/Responsive.css";
import { PiBuildingApartmentFill } from "react-icons/pi";
import { PiBagSimple } from "react-icons/pi";
import { MdOutlinePersonOutline } from "react-icons/md";
import { HiOutlineExclamationCircle } from "react-icons/hi2";
import { MdOutlinePayment } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { RxDotFilled } from "react-icons/rx";
import { GrFormCheckmark } from "react-icons/gr";
import { TbUserHexagon } from "react-icons/tb";
import { MdOutlineRocketLaunch } from "react-icons/md";

const superAdminCard = [
  {
    company: "Total Companies",
    data: "2231",
    percent: "+12%",
    icon: <PiBuildingApartmentFill />,
  },
  {
    company: "Active Companies",
    data: "98,698",
    percent: "+14%",
    icon: <PiBagSimple />,
  },
  {
    company: "Total Employee",
    data: "98,698",
    percent: "+12%",
    icon: <MdOutlinePersonOutline />,
  },
  {
    company: "Monthly Active User",
    data: "98,698",
    percent: "+12%",
    icon: <MdOutlinePersonOutline />,
  },
  {
    company: "Free Users",
    data: "98,698",
    percent: "+12%",
    icon: <MdOutlinePersonOutline />,
  },
  {
    company: "New Signups Today",
    data: "98,698",
    percent: "+12%",
    icon: <MdOutlinePersonOutline />,
  },
];
const revenueGrowthCard = [
  {
    title: "MRR",
    digit: "98,698",
  },
  {
    title: "ARR",
    digit: "98,698",
  },
  {
    title: "Upgraded",
    digit: "98,698",
  },
  {
    title: "Pending Payments",
    digit: "98,698",
  },
];
const openTicket = [
  {
    iconOne: <MdOutlinePayment />,
    issueName: "Payroll Issue",
    issueNumber: "54",
    issueType: "High",
    issueTypeIcon: <RxCross2 />,
  },
  {
    iconOne: <TbUserHexagon />,
    issueName: "Login Problem",
    issueNumber: "12",
    issueType: "Medium",
    issueTypeIcon: <RxDotFilled />,
  },
  {
    iconOne: <MdOutlineRocketLaunch />,
    issueName: "Feature Request",
    issueNumber: "03",
    issueType: "Low",
    issueTypeIcon: <GrFormCheckmark />,
  },
];
const AdminDashboard = () => {
  // Revenue Graph
  const width = 1000;
  const height = 280;
  const padding = 30;

  const data = [
    40, 38, 42, 40, 45, 39, 43, 46, 44, 37, 42, 48, 36, 40, 35, 41, 39, 42, 45,
    46, 48, 47, 50, 45, 47, 46, 49, 47,
  ];

  const splitIndex = 18;
  const [tooltip, setTooltip] = useState(null);

  const max = Math.max(...data);
  const min = Math.min(...data);

  const scaleX = (i) =>
    padding + (i * (width - padding * 2)) / (data.length - 1);

  const scaleY = (val) =>
    height - padding - ((val - min) / (max - min)) * (height - padding * 2);

  const buildPath = (start, end) =>
    data
      .slice(start, end)
      .map((d, i) => {
        const x = scaleX(i + start);
        const y = scaleY(d);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

  const xTicks = [
    { index: 0, label: "01" },
    { index: 6, label: "07" },
    { index: 14, label: "15" },
    { index: 22, label: "23" },
    { index: data.length - 1, label: "31" }, // ✅ FIX
  ];
  const gridLines = [
    scaleY(min), // bottom
    scaleY((min + max) / 2), // middle
    scaleY(max), // top
  ];

  // Subscription Breakdown Ring Chart
  const size = 170;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // values must sum to 100
  const segments = [
    { value: 30, color: "#FF9706" }, // orange
    { value: 33, color: "#34C300" }, // green
    { value: 65, color: "#5F4DFF" }, // purple
  ];

  let offset = 0;

  return (
    <div>
      {/* Navbar */}
      <nav
        className="super-admindahsboard-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 180px",
          border: "1px solid #BCBCBC",
        }}
      >
        <img
          style={{ objectFit: "contain", width: "100%", maxWidth: "150px" }}
          src={munc_logo}
          alt="munc_logo"
        />
        <button
          className=""
          style={{
            backgroundColor: "#407BFF",
            borderRadius: "8px",
            border: "none",
            padding: "12px 10px",
            width: "211px",
            color: "white",
            fontFamily: "Inter",
            fontSize: "clamp(9px,2vw,16px)",
            fontWeight: "400",
          }}
        >
          <GoPlus
            style={{ fontSize: "clamp(18px,2vw,20px)", fontWeight: "600" }}
          />
          Create
        </button>
      </nav>
      
      {/* Dahsboard container */}
      <div
        className="dashbaord-container super-admindahsboard-container"
        style={{
          backgroundColor: "#EAEAEA",
          padding: "39px 180px",
          height: "100vh",
          gap: "39px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Admin Dashboard */}
        <div className="companies-list" style={{ backgroundColor: "white", borderRadius: "8px", width: "100%", height: "200px", padding: "24px" }}>
          <h2 style={{ fontSize: "clamp(16px,2vw,20px)" }}>
            Welcome to Admin Dashboard !!
          </h2>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
