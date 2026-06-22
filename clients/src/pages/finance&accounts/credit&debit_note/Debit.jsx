import React, { useEffect, useState, useRef } from "react";
import { MdAddShoppingCart } from "react-icons/md";
import { FiEdit, FiSearch } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import "react-datepicker/dist/react-datepicker.css";
import { Link } from "react-router-dom";
import { FaCheck } from "react-icons/fa6";
import { RxCross2 } from "react-icons/rx";
import { MdRemoveRedEye } from "react-icons/md";
import ViewDetailsImg from "../../../assets/images/view-details.png";
import EditICONImg from "../../../assets/images/edit.png";
import Pagination from "../../../components/Pagination";

const tabsData = [
  { label: "All Orders", count: 156 },
  { label: "Processing", count: 91 },
  { label: "Approved", count: 91 },
  { label: "Cancelled", count: 52 },
];
const menuItems = [
  {
    label: "Edit",
    icon: <img src={EditICONImg} size={18} />,
    link: "",
    action: "details",
  },
  {
    label: "View Details",
    icon: <img src={ViewDetailsImg} size={18} />,
    link: "",
    action: "details",
  },
];

const rowsSample = [
  {
    supplier: "Jethalal Gada (12 items)",
    invoice: "INV-012",
    dates: "12/08/25",
    returntype: "Partial",
    paymentmode: "UPI",
    status: { label: "Processing", type: "warning" },
    totalamount: "₹ 3,200/-",
    dueamount: "₹ 1,200/-",
  },
  {
    supplier: "Jethalal Gada (12 items)",
    invoice: "INV-012",
    dates: "12/08/25",
    returntype: "Full",
    paymentmode: "Card",
    status: { label: "Cancelled", type: "danger" },
    totalamount: "₹ 3,200/-",
    dueamount: "₹ 00/-",
  },
  {
    supplier: "Jethalal Gada (12 items)",
    invoice: "INV-012",
    dates: "12/08/25",
    returntype: "Partial",
    paymentmode: "cash",
    status: { label: "Processing", type: "warning" },
    totalamount: "₹ 3,200/-",
    dueamount: "₹ 1,200/-",
  },
  {
    supplier: "Jethalal Gada (12 items)",
    invoice: "INV-012",
    dates: "12/08/25",
    returntype: "Full",
    paymentmode: "Cheque",
    status: { label: "Approved", type: "success" },
    totalamount: "₹ 3,200/-",
    dueamount: "₹ 00/-",
  },
  {
    supplier: "Jethalal Gada (12 items)",
    invoice: "INV-012",
    dates: "12/08/25",
    returntype: "Full",
    paymentmode: "Net Banking",
    status: { label: "Approved", type: "success" },
    totalamount: "₹ 3,200/-",
    dueamount: "₹ 00/-",
  },
];

const statusStyles = {
  success: {
    color: "#01774B",
    bg: "transparent",
    dot: false,
    icon: <FaCheck size={12} />,
  },
  danger: {
    color: "#A80205",
    bg: "transparent",
    dot: false,
    icon: <RxCross2 size={12} />,
  },
  warning: { color: "#7E7000", bg: "#F7F7C7", dot: true },
};

const returnTypeStyles = {
  Partial: {
    color: "#DAC100",
  },
  Full: {
    color: "#0078D9",
  },
};

export default function DebitNoteList() {
  const [activeTab, setActiveTab] = useState("All Orders");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [modalContent, setModalContent] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const menuRef = useRef(null);
  const [debitNotes, setDebitNotes] = useState([]);
const [loading, setLoading] = useState(true);
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;
const [totalCount, setTotalCount] = useState(0);


  const handleClick = (text) => {
    setModalContent(text);
    setOpenModal(true);
    setOpenMenu(false);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredRows = rowsSample.filter((r) =>
    r.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const cardStyle = {
    borderRadius: 12,
    boxShadow: "rgba(0, 0, 0, 0.1)",
    padding: 16,
    background: "white",
  };

  const menuItemStyle = (highlight = false) => ({
    padding: "10px 14px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    fontSize: 14,
    color: "#333",
    background: highlight ? "#E8F0FF" : "transparent",
  });

  const fetchDebitNotes = async (page = 1) => {
  try {
    setLoading(true);

    const res = await api.get("/api/debit-notes", {
      params: {
        page,
        limit: itemsPerPage,
        search,
      },
    });

    if (res.data.success) {
      setDebitNotes(res.data.data);
      setTotalCount(res.data.total);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  fetchDebitNotes(currentPage);
}, [currentPage, search]);


  return (
    <div className="container-fluid p-3">
      {/* Header: back + title + right-side controls */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center justify-content-center gap-3">
          <h3
            style={{
              fontSize: "22px",
              color: "#0E101A",
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              lineHeight: "120%",
            }}
          >
            Debit Notes
          </h3>
        </div>

        <div className="d-flex align-items-center gap-3">
          {/* Create Debit*/}
          <Link style={{ textDecoration: "none" }} to="/m/empty-debitnote">
            <button
              className="btn d-flex align-items-center"
              style={{
                background: "#fff",
                border: "1.5px solid #1F7FFF",
                color: "#1F7FFF",
                borderRadius: "8px",
                padding: "8px 16px",
                boxShadow: "-1px -1px 1.6px rgba(0,0,0,0.08) inset",
                fontWeight: 500,
                fontSize: "14px",
                fontFamily: '"Inter", sans-serif',
              }}
            >
              <MdAddShoppingCart style={{ marginRight: 8, fontSize: "16px" }} />
              Create Debit Note
            </button>
          </Link>
        </div>
      </div>

      {/* Search + Tabs */}
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
        }}
      >
        <div className="d-flex">
          <div className="col-12 col-md-6 d-flex align-items-center">
            <div
              style={{
                background: "#F3F8FB",
                padding: 3,
                borderRadius: 8,
                display: "flex",
                gap: 8,
                overflowX: "auto",
              }}
            >
              {tabsData.map((t) => {
                const active = activeTab === t.label;
                return (
                  <div
                    key={t.label}
                    onClick={() => setActiveTab(t.label)}
                    role="button"
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: active ? "#fff" : "transparent",
                      boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      cursor: "pointer",
                      minWidth: 90,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ fontSize: 14, color: "#0E101A" }}>
                      {t.label}
                    </div>
                    <div style={{ color: "#727681", fontSize: 14 }}>
                      {t.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="col-12 col-md-6 d-flex align-items-center justify-content-end">
            <div className="d-flex align-items-center gap-4">
              {/* Search Box */}
              <div
                className="d-flex align-items-center search-box"
                style={{
                  background: "#FCFCFC",
                  padding: "5px 16px",
                  borderRadius: 8,
                  border: "1px solid #EAEAEA",
                  width: "465px",
                }}
              >
                <FiSearch style={{ color: "#14193D66" }} />
                <input
                  type="search"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    backgroundColor: "transparent",
                    fontSize: "15px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table card */}
        <div style={{ ...cardStyle }}>
          <div className="table-responsive">
            <table
              className="table align-middle"
              style={{ fontSize: 14, marginBottom: 0 }}
            >
              <thead>
                <tr style={{ border: "none" }}>
                  <th style={{ width: 0, backgroundColor: "#F3F8FB" }}>
                    <input type="checkbox" aria-label="select row" />
                  </th>
                  <th
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Supplier Name
                  </th>
                  <th
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Invoice No.
                  </th>
                  <th
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Return Type
                  </th>
                  <th
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Payment Mode
                  </th>
                  <th
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Total Amount
                  </th>
                  <th
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Due Amount
                  </th>
                  <th
                    className="text-center"
                    style={{
                      width: 60,
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "120%",
                      fontFamily: '"inter" sans-serif"',
                      backgroundColor: "#F3F8FB",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {debitNotes.map((row, idx) => {
                  const sty =
                    statusStyles[row.status.type] || statusStyles.warning;

                  return (
                    <tr key={idx} style={{ borderBottom: "none" }}>
                      {/* Checkbox */}
                      <td className="text-center">
                        <input type="checkbox" aria-label="select row" />
                      </td>

                      {/* Supplier */}
                      <td style={{ color: "#0E101A" }}>{row.supplier}</td>

                      {/* Invoice */}
                      <td>{row.invoice}</td>

                      {/* Dates */}
                      <td>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {row.dates.split(" & ").map((d, i) => (
                            <span key={i}>{d}</span>
                          ))}
                        </div>
                      </td>
                      {/* Return Type */}
                      <td
                        style={{
                          color: returnTypeStyles[row.returntype].color,
                        }}
                      >
                        {row.returntype}
                      </td>
                      {/* Payment Mode */}
                      <td>{row.paymentmode}</td>
                      {/* Status chip */}
                      <td>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "6px 10px",
                            borderRadius: 50,
                            background: sty.bg,
                            color: sty.color,
                            fontSize: 14,
                            minWidth: 120,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {sty.dot ? (
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 20,
                                background: sty.color,
                                display: "inline-block",
                              }}
                            />
                          ) : (
                            <span style={{ color: sty.color }}>{sty.icon}</span>
                          )}
                          {row.status.label}
                        </div>
                      </td>

                      {/* Amount */}
                      <td>{row.totalamount}</td>
                      {/* Due Amount */}
                      <td>{row.dueamount}</td>

                      {/* Actions */}
                      <td className="text-center">
                        <button
                          onClick={() =>
                            setOpenMenu(openMenu === idx ? null : idx)
                          }
                          className="btn"
                          style={{
                            border: "none",
                            background: "transparent",
                            padding: 4,
                            display: "flex",
                            alignItems: "center",
                          }}
                          aria-label="actions"
                        >
                          <BsThreeDots style={{ color: "#6C748C" }} />
                        </button>
                        {openMenu === idx && (
                          <div
                            ref={menuRef}
                            style={{
                              position: "absolute",
                              right: 140,
                              width: "210px",
                              backgroundColor: "#ffff",
                              borderRadius: "12px",
                              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
                              border: "1px solid #E5E7EB",
                              overflow: "hidden",
                              animation: "fadeIn 0.2s ease-out",
                              zIndex: 1000,
                            }}
                          >
                            {menuItems.map((item) =>
                              item.action === "delete" ? (
                                <div
                                  key={item.action}
                                  onClick={() => {
                                    setSelectedUser(idx);
                                    setShowDeleteModal(true);
                                    setOpenMenu(false);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "8px 18px",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    transition: "0.2s",
                                    textDecoration: "none",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "#e3f2fd";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                      "transparent";
                                  }}
                                >
                                  <span style={{ fontSize: "18px" }}>
                                    {item.icon}
                                  </span>
                                  <span>{item.label}</span>
                                </div>
                              ) : (
                                <Link
                                  key={item.action}
                                  to={item.link}
                                  onClick={() => setOpenMenu(false)}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "8px 18px",
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "#344054",
                                    textDecoration: "none",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                      "#e3f2fd")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.backgroundColor =
                                      "transparent")
                                  }
                                >
                                  {item.icon} <span>{item.label}</span>
                                </Link>
                              )
                            )}
                            {/* animation */}
                            <style>{`
                                                            @keyframes fadeIn {
                                                              from { opacity: 0; transform: translateY(-6px); }
                                                              to { opacity: 1; transform: translateY(0); }
                                                            }
                                                          `}</style>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* No results */}
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-muted py-4">
                      No rows found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Pagination />
      </div>
    </div>
  );
}
