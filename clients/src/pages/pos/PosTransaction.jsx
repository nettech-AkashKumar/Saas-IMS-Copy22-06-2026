import React, { useEffect, useRef, useState, useMemo, useLayoutEffect, } from "react";

// pages
import "react-toastify/dist/ReactToastify.css";


//icons
import { IoIosSearch, IoIosArrowBack, IoIosArrowForward, IoMdAddCircleOutline, IoIosList, IoIosCheckmark, } from "react-icons/io";

const PosTransaction = ({ searchdrop, activeQuickFilter, handleSearchDropChange, handleClear, loading, posSales, currentPage, totalSales, totalPages, handlePopupClose, handleQuickFilter, handlePageChange }) => {

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
            }}
        >
            <div
                style={{
                    width: "80vw",
                    height: "auto",
                    padding: "10px 16px",
                    overflowY: "auto",
                    backgroundColor: "#fff",
                    border: "1px solid #E1E1E1",
                    borderRadius: "8px",
                    position: "relative",
                }}
            >
                {/* header */}
                <div
                    style={{
                        border: "1px solid #E1E1E1",
                        padding: "5px 0px",
                        borderRadius: "8px",
                        alignItems: "center",
                        marginTop: "5px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            padding: "5px 20px",
                            alignItems: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: "15px",
                                    alignItems: "center",
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor: activeQuickFilter === "all" ? "#1368EC" : "transparent",
                                        color: activeQuickFilter === "all" ? "white" : "black",
                                        padding: "5px 8px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleQuickFilter("all")}
                                >
                                    All
                                </div>
                                <div
                                    style={{
                                        backgroundColor: activeQuickFilter === "paid" ? "#1368EC" : "transparent",
                                        color: activeQuickFilter === "paid" ? "white" : "black",
                                        padding: "5px 8px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleQuickFilter("paid")}
                                >
                                    Paid
                                </div>
                                <div
                                    style={{
                                        backgroundColor: activeQuickFilter === "due" ? "#1368EC" : "transparent",
                                        color: activeQuickFilter === "due" ? "white" : "black",
                                        padding: "5px 8px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleQuickFilter("due")}
                                >
                                    Due
                                </div>
                                <div
                                    style={{
                                        backgroundColor: activeQuickFilter === "due" ? "#1368EC" : "transparent",
                                        color: activeQuickFilter === "due" ? "white" : "black",
                                        padding: "5px 8px",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => handleQuickFilter("due")}
                                >
                                    Return
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                alignItems: "center",
                            }}
                        >
                            {/* close button */}
                            <div style={{ cursor: "pointer" }}>
                                <span
                                    style={{
                                        border: "2px solid #727681",
                                        borderRadius: "50px",
                                        width: "25px",
                                        height: "25px",
                                        backgroundColor: "white",
                                        color: "#727681",
                                        fontWeight: "500",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        fontSize: "13px",
                                    }}
                                    onClick={handlePopupClose}
                                >
                                    x
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* table */}
                <div
                    style={{
                        border: "1px solid #ccc",
                        marginTop: "10px",
                        borderRadius: "8px",
                        height: "60vh",
                        overflowY: "auto",
                    }}
                >
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead style={{ backgroundColor: "#E6E6E6" }}>
                            <tr style={{ color: "#676767" }}>
                                <th style={{ padding: "8px", borderTopLeftRadius: "8px" }}>Invoice No.</th>
                                <th>Customer</th>
                                <th>Sold Items</th>
                                <th>Date & Time</th>
                                <th>Total Amount</th>
                                <th>Points Used</th>
                                <th>Due Amount</th>
                                <th>Payment Method</th>
                                <th style={{ borderTopRightRadius: "8px" }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        style={{ textAlign: "center", padding: "20px" }}
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : posSales.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        style={{ textAlign: "center", padding: "20px" }}
                                    >
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                posSales.map((sale) => (
                                    <tr
                                        key={sale._id}
                                        style={{ borderBottom: "1px solid #E6E6E6" }}
                                    >
                                        <td
                                            style={{
                                                padding: "8px",
                                                position: "relative",
                                                width: "140px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    color: "#1368EC",
                                                    top: "7px",
                                                    position: "absolute",
                                                }}
                                            >
                                                {sale.invoiceNumber || "N/A"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "8px", position: "relative" }}>
                                            <div style={{ top: "5px", position: "absolute" }}>
                                                <div style={{ fontWeight: "600" }}>
                                                    {sale.customer?.name || "N/A"}
                                                </div>
                                                <div style={{ fontSize: "12px", color: "#666" }}>
                                                    {sale.customer?.phone || "N/A"}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "8px" }}>
                                            <div style={{ fontSize: "12px" }}>
                                                {sale.items?.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            marginBottom: "4px",
                                                        }}
                                                    >
                                                        {item.images && item.images.length > 0 ? (
                                                            <img
                                                                src={item.images[0]}
                                                                alt={item.productName}
                                                                style={{
                                                                    width: "30px",
                                                                    height: "30px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "4px",
                                                                    border: "1px solid #ddd",
                                                                }}
                                                            />
                                                        ) : null}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', width: '100%', padding: '0px 8px' }}>
                                                            <div>
                                                                <div style={{ fontWeight: "500" }}>
                                                                    {item.productName || "N/A"}
                                                                </div>
                                                                {item.serialNumbers?.length > 0 && <div style={{ fontWeight: "500", backgroundColor: "#E6F8FF", border: `1px solid #7CDAFF`, padding: "1px 6px", borderRadius: "4px", color: "#1368EC", fontSize: "10px", width: "auto", textAlign: "center", whiteSpace: "nowrap", }}>
                                                                    {item.serialNumbers?.join(", ") || ""}
                                                                </div>}
                                                                <div
                                                                    style={{
                                                                        fontSize: "11px",
                                                                        color: "#666",
                                                                    }}
                                                                >
                                                                    Qty: {item.quantity} × ₹
                                                                    {item.unitPrice?.toFixed(2) || "0.00"}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                {item.status === "Return" ? <span style={{ outline: 'red', padding: '2px 3px', background: '#ff02021c', color: 'red', borderRadius: '4px' }}>Returned</span> : ""}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td style={{ position: "relative" }}>
                                            <div style={{ top: "5px", position: "absolute" }}>
                                                {new Date(sale.saleDate).toLocaleDateString(
                                                    "en-IN",
                                                )}
                                                <br />
                                                <span style={{ fontSize: "12px", color: "#666" }}>
                                                    {new Date(sale.saleDate).toLocaleTimeString(
                                                        "en-IN",
                                                    )}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ position: "relative" }}>
                                            <div style={{ top: "5px", position: "absolute" }}>
                                                ₹{sale.totals?.totalAmount?.toFixed(2) || "0.00"}
                                            </div>
                                        </td>
                                        <td style={{ position: "relative" }}>
                                            <div style={{ top: "5px", position: "absolute" }}>
                                                🪙 {sale.pointsUsed || "0"} = ₹
                                                {sale.pointsUsed * 5 || "0.00"}
                                            </div>
                                        </td>
                                        <td style={{ position: "relative" }}>
                                            <div style={{ top: "5px", position: "absolute" }}>
                                                {sale.paymentDetails?.dueAmount > 0 ? (
                                                    <span
                                                        style={{
                                                            color: "#dc3545",
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        ₹{sale.paymentDetails.dueAmount.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: "#28a745" }}>₹0.00</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ position: "relative" }}>
                                            <div style={{ top: "5px", position: "absolute" }}>
                                                {sale.paymentDetails?.paymentMethod || "N/A"}
                                            </div>
                                        </td>
                                        <td style={{ position: "relative" }}>
                                            <div style={{ top: "7px", position: "absolute" }}>
                                                <span
                                                    style={{
                                                        padding: "4px 8px",
                                                        borderRadius: "4px",
                                                        backgroundColor:
                                                            sale.status === "Paid"
                                                                ? "#d4edda"
                                                                : sale.status === "Due"
                                                                    ? "#fff3cd"
                                                                    : "#721c24",
                                                        color:
                                                            sale.status === "Paid"
                                                                ? "#155724"
                                                                : sale.status === "Due"
                                                                    ? "#856404"
                                                                    : "#721c24",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    {sale.status}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* pagination */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "end",
                        marginTop: "10px",
                        padding: "0px 10px",
                        gap: "10px",
                    }}
                >
                    <div
                        style={{
                            padding: "6px 12px",
                            borderRadius: "5px",
                            border: "1px solid #E6E6E6",
                            backgroundColor: "#FFFFFF",
                            color: "#333",
                            boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        10 per page
                    </div>
                    <div
                        style={{
                            padding: "6px 12px",
                            borderRadius: "5px",
                            border: "1px solid #E6E6E6",
                            backgroundColor: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            gap: "15px",
                            color: "#333",
                            boxShadow: "0px 0px 5px rgba(0, 0, 0, 0.1)",
                        }}
                    >
                        <span>
                            {(currentPage - 1) * 10 + 1} -{" "}
                            {Math.min(currentPage * 10, totalSales)} of {totalSales}
                        </span>
                        <span style={{ color: "#ccc" }}>|</span>
                        <IoIosArrowBack
                            style={{
                                color: currentPage > 1 ? "#333" : "#ccc",
                                cursor: currentPage > 1 ? "pointer" : "not-allowed",
                            }}
                            onClick={() =>
                                currentPage > 1 && handlePageChange(currentPage - 1)
                            }
                        />
                        <IoIosArrowForward
                            style={{
                                color: currentPage < totalPages ? "#333" : "#ccc",
                                cursor:
                                    currentPage < totalPages ? "pointer" : "not-allowed",
                            }}
                            onClick={() =>
                                currentPage < totalPages &&
                                handlePageChange(currentPage + 1)
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PosTransaction