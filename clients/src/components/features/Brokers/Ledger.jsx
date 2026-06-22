import React, { useEffect, useMemo, useState } from "react";
import DateFilterDropdown from "../../DateFilterDropdown";
import { MdUpdate } from "react-icons/md";
import dashcard_icon1 from "../../../assets/images/dashcard-1.png";
import dashcard_icon2 from "../../../assets/images/dashcard-2.png";
import dashcard_icon3 from "../../../assets/images/dashcard-3.png";
import dashcard_icon4 from "../../../assets/images/dashcardd-4.png";
import "../../../styles/style.css";
import "../../../styles/Responsive.css";
import "../../../styles/Dashboard.css";
import i_icon from "../../../assets/images/i.png";
import time from "../../../assets/images/time.png";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance";
import { Navigate, useNavigate } from "react-router-dom";

const Ledger = () => {

  const navigate = useNavigate();

  const [selectedDateRange, setSelectedDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const COLORS = ["#ff961c", "#f3e5df"];

  const styles = {
    Graphcard: {
      background: "white",
      border: "1px solid rgb(223 225 227 / 70%)",
      boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
      padding: "24px",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
      minWidth: "525.67px",
      height: "490px",
      overflowY: "hidden",
      boxSizing: "border-box",
    },
    GraphcardAdvert: {
      boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
      padding: "24px",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
      minWidth: "525.67px",
      height: "457px",
      overflowY: "hidden",
      boxSizing: "border-box",
    },
    Graphcardrecentorders: {
      background: "white",
      border: "1px solid rgb(223 225 227 / 70%)",
      boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px",
      padding: "24px",
      borderRadius: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      width: "100%",
      minWidth: "1083px",
      height: "457px",
      boxSizing: "border-box",
    },
    Graphheader: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
      paddingBottom: "10px",
    },
    Graphtitle: {
      fontWeight: "500",
      fontSize: "16px",
      color: "#0E101A",
      fontFamily: "Inter",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    Graphbadge: {
      background: "#E5F0FF",
      color: "#1F7FFF",
      padding: "4px 8px",
      borderRadius: "50px",
      fontSize: "16px",
      fontFamily: "Inter",
      fontWeight: "400",
    },
    Graphsubtext: {
      fontSize: "14px",
      color: "#6C748C",
      margin: "4px 0 16px 0",
      fontFamily: "Inter",
    },
    GraphsalesRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "8px",
    },
    Graphamount: {
      fontSize: "16px",
      fontWeight: "600",
      margin: "0",
    },
    Graphcurrency: {
      fontSize: "12px",
      fontWeight: "400",
    },
    Graphlabel: {
      fontSize: "12px",
      margin: "0",
    },
    Graphfooter: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "20px",
      fontSize: "14px",
      color: "#666",
      fontFamily: "Inter",
    },
    Graphlink: {
      color: "#1F7FFF",
      textDecoration: "none",
      fontFamily: "Inter",
      fontSize: "14px",
    },
    Graphupdate: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
    },

    // NEW reusable alignment styles
    GraphlegendWrap: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      columnGap: "24px",
      rowGap: "12px",
      width: "100%",
    },
    GraphlegendWrapSingle: {
      display: "grid",
      gridTemplateColumns: "minmax(0, 1fr)",
      width: "100%",
    },
    GraphlegendItem: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      minWidth: 0,
    },
    GraphlegendTop: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontFamily: "Inter",
      fontSize: "14px",
      fontWeight: "500",
      color: "#727681",
      whiteSpace: "nowrap",
    },
    GraphlegendBar: {
      width: "20px",
      height: "4px",
      borderRadius: "999px",
      flexShrink: 0,
    },
    GraphlegendValue: {
      color: "#0E101A",
      fontSize: "20px",
      fontWeight: "500",
      fontFamily: "Inter",
      lineHeight: 1.2,
      wordBreak: "break-word",
    },
    GraphlegendSubValue: {
      color: "#727681",
      fontSize: "12px",
      fontWeight: "400",
      fontFamily: "Inter",
      lineHeight: 1.2,
    },
  };

  const [invoices, setInvoices] = useState([]);
  const [assignedTargets, setAssignedTargets] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      setLoading(true);
      const res = await api.get('/api/invoices');
      if (res.data?.success && Array.isArray(res.data.invoices)) {
        let invoicesData = res.data.invoices;
        setInvoices(invoicesData);
        setLoading(false);
      }

    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to fetch invoices");
      setInvoices([]);
    }
    setLoading(false);
  };

  const fetchAssignedTargets = async () => {
    try {
      const res = await api.get("/api/assignTarget/get");
      const targets = res.data.assignTargets || res.data.data || [];
      setAssignedTargets(targets);
    } catch (err) {
      setAssignedTargets([]);
    }
  };

  const fetchSalesmen = async () => {
    try {
      const res = await api.get("/api/salesman/get");
      setSalesmen(
        res.data.salesman || 
        res.data.data ||
        []
      );
    } catch (err) {
      setSalesmen([]);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchInvoices(), fetchAssignedTargets(), fetchSalesmen()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const buildLeaderboard = () => {

    const filteredInvoices = invoices.filter((inv) => {
      if (!selectedDateRange.startDate || !selectedDateRange.endDate) return true;
      const invDate = new Date(inv.createdAt);
      return invDate >= selectedDateRange.startDate && invDate <= selectedDateRange.endDate;
    });

    // Step 1: group invoice items by salesman/broker id
    const grouped = filteredInvoices
      .flatMap((inv) =>
        (inv.itemsSalesman || [])
          .filter((item) => item.broker_salesman_id && item.broker_salesman_name)
          .map((item) => {
            const salesman = salesmen.find(
              (s) =>
                String(s._id) ===
                String(item.broker_salesman_id)
            );

            return {
              invoiceId: inv._id,
              invoiceNo: inv.invoiceNo,
              broker_salesman_id: item.broker_salesman_id,
              broker_salesman_name: item.broker_salesman_name,
              assignType: item.assignType,
              qty: Number(item.qty || 0),
              hasBroker: !!salesman?.brokerId,
              amount:
                Number(item.qty || 0) *
                Number(item.unitPrice || 0),
            };
          }))
      .reduce((acc, item) => {
        const key = item.broker_salesman_id;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            broker_salesman_name: item.broker_salesman_name,
            assignType: item.assignType,
            hasBroker: item.hasBroker,
            invoiceNos: [],
            invoiceIds: [],
            totalQty: 0,
            totalAmount: 0,
          };
        }
        acc[key].invoiceNos.push(item.invoiceNo);
        acc[key].invoiceIds.push(item.invoiceId);
        acc[key].totalQty += item.qty;
        acc[key].totalAmount += item.amount;
        return acc;
      }, {});

    // Step 2 & 3: merge assigned target into each grouped entry
    return Object.values(grouped).map((group) => {

      const target = assignedTargets.find((t) => {

        // salesman working under broker
        if (group.hasBroker) {
          const salesmanId =
            t.selectedSalesman?._id ||
            t.selectedSalesman;

          return (
            String(salesmanId) ===
            String(group.id)
          );
        }

        // independent salesman
        const salesmanId =
          t.selectedSalesman?._id ||
          t.selectedSalesman;

        return (
          String(salesmanId) ===
          String(group.id)
        );
      });

      // Determine achieved value and target value based on metric
      let achievedValue = 0;
      let targetValue = 0;
      let metricLabel = "";

      if (target) {
        targetValue = Number(target.targetValue || 0);
        metricLabel = target.targetMetric;

        if (target.targetMetric === "Pieces") {
          achievedValue = group.totalQty;
        } else {
          achievedValue = group.totalAmount;
        }
      }

      // Progress percentage capped at 100%
      const progressPercent =
        target && targetValue > 0
          ? Math.min((achievedValue / targetValue) * 100, 100)
          : 0;

      // Incentive calculation
      let targetSet = 0;
      if (target) {
        if (target.type === "Percentage") {
          targetSet = Number(target.IncentiveValue || 0);
        } else {
          targetSet = Number(target.IncentiveValue || 0);
        }
      }

      let incentiveEarned = 0;

      if (target && targetValue > 0) {
        const incentiveValue = Number(target.IncentiveValue || 0);
        const progressRatio = achievedValue / targetValue;

        if (target.type === "Percentage") {
          incentiveEarned =
            (group.totalAmount * incentiveValue) / 100;
        } else {
          incentiveEarned =
            incentiveValue * Math.min(progressRatio, 1);
        }
      }

      return {
        ...group,
        target,
        targetValue,
        achievedValue,
        metricLabel,
        progressPercent,
        targetSet,
        incentiveEarned,
      };
    });
  };

  const leaderboardRows = useMemo(() =>
    buildLeaderboard().sort((a, b) => b.progressPercent - a.progressPercent),
    [invoices, assignedTargets, selectedDateRange, salesmen]);

  const dashboardStats = useMemo(() => {

    const salesmanMap = salesmen.reduce((acc, s) => {
      acc[String(s._id)] = s;
      return acc;
    }, {});

    const leaderboardMap = leaderboardRows.reduce(
      (acc, row) => {
        acc[String(row.id)] = row;
        return acc;
      },
      {}
    );

    const totalRevenue = leaderboardRows.reduce(
      (sum, row) => sum + row.totalAmount,
      0
    );

    const totalOrders = invoices.filter((inv) =>
      (inv.itemsSalesman || []).some(
        (item) =>
          item.broker_salesman_id &&
          item.broker_salesman_name
      )
    ).length;

    const totalSalesQty = leaderboardRows.reduce(
      (sum, row) => sum + row.totalQty,
      0
    );

    const totalIncentiveEarned = leaderboardRows.reduce(
      (sum, row) => sum + row.incentiveEarned,
      0
    );

    const totalIncentivePotential =
      leaderboardRows.reduce((sum, row) => {
        if (!row.target) return sum;

        const incentiveValue = Number(
          row.target.IncentiveValue || 0
        );

        if (row.target.type === "Fixed") {
          return sum + incentiveValue;
        }

        if (row.metricLabel === "Amount") {
          return (
            sum +
            (row.targetValue * incentiveValue) /
            100
          );
        }

        const pricePerPiece =
          row.totalQty > 0
            ? row.totalAmount / row.totalQty
            : 0;

        const incentivePerPiece =
          (pricePerPiece *
            incentiveValue) /
          100;

        return (
          sum +
          incentivePerPiece *
          row.targetValue
        );
      }, 0);

    let salesmanAssigned = 0;
    let salesmanAchieved = 0;
    let brokerAssigned = 0;
    let brokerAchieved = 0;

    assignedTargets.forEach((target) => {
      const salesmanId = target.selectedSalesman
        ? (typeof target.selectedSalesman === 'object'
          ? String(target.selectedSalesman._id)
          : String(target.selectedSalesman))
        : null;

      if (!salesmanId) return;

      const salesman = salesmanMap[salesmanId];
      const row = leaderboardMap[salesmanId];
      const hasBroker = !!(salesman?.brokerId);
      const targetValue = Number(target.targetValue || 0);
      const incentiveValue = Number(target.IncentiveValue || 0);

      let assigned = 0;
      let achieved = row?.incentiveEarned || 0;

      if (target.type === "Fixed") {
        assigned = incentiveValue;
      } else if (target.targetMetric === "Amount") {
        assigned = (targetValue * incentiveValue) / 100;
      } else {
        const pricePerPiece = row?.totalQty > 0 ? row.totalAmount / row.totalQty : 0;
        assigned = ((pricePerPiece * incentiveValue) / 100) * targetValue;
      }

      if (hasBroker) {
        brokerAssigned += assigned;
        brokerAchieved += achieved;
      } else {
        salesmanAssigned += assigned;
        salesmanAchieved += achieved;
      }
    });

    const totalTargetAmount = leaderboardRows
      .filter((row) => row.metricLabel === "Amount")
      .reduce(
        (sum, row) => sum + row.targetValue,
        0
      );

    const totalTargetPieces = leaderboardRows
      .filter((row) => row.metricLabel === "Pieces")
      .reduce(
        (sum, row) => sum + row.targetValue,
        0
      );

    const achievedRevenue = leaderboardRows
      .filter((row) => row.metricLabel === "Amount")
      .reduce(
        (sum, row) => sum + row.achievedValue,
        0
      );

    const achievedPieces = leaderboardRows
      .filter((row) => row.metricLabel === "Pieces")
      .reduce(
        (sum, row) => sum + row.achievedValue,
        0
      );

    const totalTarget =
      totalTargetAmount +
      totalTargetPieces;

    const totalAchieved =
      achievedRevenue +
      achievedPieces;

    const completedPercent =
      totalTarget > 0
        ? Math.min(
          (totalAchieved /
            totalTarget) *
          100,
          100
        )
        : 0;

    return {
      totalRevenue,
      totalOrders,
      totalSalesQty,
      totalIncentiveEarned,
      totalIncentivePotential,
      totalTargetAmount,
      totalTargetPieces,
      achievedRevenue,
      achievedPieces,
      completedPercent,
      salesmanAssigned,
      salesmanAchieved,
      brokerAssigned,
      brokerAchieved,
    };
  }, [
    leaderboardRows,
    invoices,
    salesmen,
    assignedTargets,
  ]);

  const data = [
    {
      name: "Completed",
      value: dashboardStats.completedPercent,
    },
    {
      name: "Remaining",
      value: 100 - dashboardStats.completedPercent,
    },
  ];

  return (
    <div
      className="p-4  d-flex flex-column gap-4"
      style={{ overflowY: "auto", height: "calc(100vh - 60px)" }}
    >
      {/* header----------------------------------------------------------------------------------------------------------------------------------- */}
      <div className="dashboard-header-mobile">
        <h1
          className="dashboard-title-mobile d-none"
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: "30px",
            marginBottom: "0",
          }}
        >
          Sales Ledger
        </h1>

        <div
          className="dashbaord-header d-flex justify-content-between align-items-center w-100"
          style={{
            borderBottom: "1px solid rgb(194, 201, 209)",
            paddingBottom: "24px",
          }}
        >
          <div className="d-flex align-items-center" style={{ gap: "19px" }}>
            <h1
              className="dashboard-title"
              style={{
                fontFamily: '"Inter", sans-serif',
                fontSize: "30px",
                marginBottom: "0",
                color: "black",
              }}
            >
              Sales Ledger
            </h1>
            <DateFilterDropdown
              selectedDateRange={selectedDateRange}
              setSelectedDateRange={setSelectedDateRange}
            />
          </div>

          {/* <button
            className=""
            style={{
              backgroundColor: "white",
              border: "1px solid rgb(224, 222, 222)",
              borderRadius: "8px",
              color: "hsla(0, 1%, 36%, 1.00)",
              fontFamily: "Inter",
              fontSize: "15px",
              padding: "4px 12px",
            }}
          >
            Last Updated 20 min ago <MdUpdate />
          </button> */}
        </div>
      </div>

      {/* Cards----------------------------------------------------------------------------------------------------------------------------------- */}
      <div className="dashboard-card">
        <div
          className="dhaboard-card-1-container d-flex justify-content-between"
          style={{ gap: "30px" }}
        >
          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Total Revenue
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    {dashboardStats.totalRevenue.toLocaleString()}
                  </h5>
                  <span
                    className=""
                    style={{ fontSize: "14px", color: "#0E101A" }}
                  >
                    INR
                  </span>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon1}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Total Order
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    {dashboardStats.totalOrders.toLocaleString()}
                  </h5>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon2}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Sales Volume
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    {dashboardStats.totalSalesQty.toLocaleString()}
                  </h5>
                  <span
                    className=""
                    style={{ fontSize: "14px", color: "#0E101A" }}
                  >
                    PCS
                  </span>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon3}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>

          <div
            className="dash-card d-flex justify-content-between align-items-center bg-white position-relative"
            style={{
              height: "86px",
              paddingRight: "24px",
              paddingTop: "16px",
              paddingBottom: "16px",
              fontFamily: "Inter",
              boxShadow: "0px 1px 4px 0px rgba(0, 0, 0, 0.10)",
              border: "1px solid #E5F0FF",
              borderRadius: "8px",
            }}
          >
            <div className="d-flex align-items-center" style={{ gap: "24px" }}>
              <span
                style={{
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  borderLeft: "4px solid #1F7FFF",
                  width: "3px",
                  height: "50px",
                }}
              ></span>
              <div className="d-flex flex-column " style={{ gap: "11px" }}>
                <h6
                  className="mb-0 dash-card-title"
                  style={{ fontSize: "14px", color: "#727681" }}
                >
                  Pending Payouts
                </h6>
                <div className="d-flex align-items-end gap-2">
                  <h5
                    className="mb-0 dash-card-title"
                    style={{ fontSize: "22px", color: "#0E101A" }}
                  >
                    {dashboardStats.totalIncentiveEarned.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </h5>
                  <span
                    className=""
                    style={{ fontSize: "14px", color: "#0E101A" }}
                  >
                    INR
                  </span>
                </div>
              </div>
            </div>

            <div
              className="d-flex justify-content-center align-items-center rounded-circle"
              style={{
                width: "50px",
                height: "50px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E5F0FF",
              }}
            >
              <img
                src={dashcard_icon4}
                alt=""
                style={{ objectFit: "contain", width: "100%", height: "40px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Graph section--------------------------------------------------------------------------------------------------------------------------- */}
      <div
        className="graph-main-dashboard"
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div className="graph-container">
          <div className="graph-1-dash" style={styles.Graphcard}>
            <div style={{ width: "100$" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Commission Split <img src={i_icon} alt="i_icon" />
                  </span>
                </div>
              </div>
              <div style={styles.GraphsalesRow}>
                <div
                  className=" w-100"
                  style={{
                    padding: "16px 0",
                    fontFamily: '"Poppins", sans-serif',
                    fontWeight: "500",
                    fontSize: "14px",
                    color: "#727681",
                    borderBottom: "1px solid #C2C9D1",
                  }}
                >
                  <div className="d-flex flex-column gap-2">
                    <div className="d-flex" style={{ gap: "15px" }}>
                      <span
                        style={{
                          backgroundColor: "#13AA64",
                          width: "20px",
                          height: "4px",
                        }}
                      ></span>
                      <span
                        className="d-flex flex-column gap-2"
                        style={{
                          fontFamily: "Inter",
                          fontSize: "14px",
                          fontWeight: "500",
                        }}
                      >
                        Total Incentive
                        <div style={styles.GraphlegendValue}>
                          ₹{
                            dashboardStats.totalIncentivePotential.toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 2,
                              }
                            )
                          }
                        </div>
                      </span>
                    </div>
                  </div>
                </div>
                <div></div>
              </div>

              <div
                className="dashboard-card-graph-scroll"
                style={{
                  width: "100%",
                  height: "200px",
                  borderBottom: "1px solid rgb(194, 201, 209)",
                  padding: "15px 0",
                  boxSizing: "border-box",
                }}
              >
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex flex-column gap-2">
                    <label
                      htmlFor=""
                      className="d-flex justify-content-between"
                    >
                      <span
                        className="d-flex flex-column gap-2"
                        style={{
                          fontFamily: "Inter",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#727681",
                        }}
                      >
                        Sales Man
                      </span>

                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={styles.GraphlegendValue}>
                        ₹{dashboardStats.salesmanAchieved.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}

                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#727681",
                        }}
                      >
                        of ₹{dashboardStats.salesmanAssigned.toLocaleString()}
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#BBF3D9",
                        borderRadius: "4px",
                        padding: "10px 0px",
                        height: "20px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#13AA64",
                          height: "100%",
                          width: `${dashboardStats.salesmanAssigned
                            ? (
                              dashboardStats.salesmanAchieved /
                              dashboardStats.salesmanAssigned
                            ) * 100
                            : 0
                            }%`,
                          position: "absolute",
                          zIndex: "9999",
                          top: "0",
                          bottom: "0",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    <label
                      htmlFor=""
                      className="d-flex justify-content-between"
                    >
                      <span
                        className="d-flex flex-column gap-2"
                        style={{
                          fontFamily: "Inter",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#727681",
                        }}
                      >
                        Broker
                      </span>

                    </label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={styles.GraphlegendValue}>
                        ₹{dashboardStats.brokerAchieved.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#727681",
                        }}
                      >
                        of ₹{dashboardStats.brokerAssigned.toLocaleString()}
                      </div>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#BBF3D9",
                        borderRadius: "4px",
                        padding: "10px 0px",
                        height: "20px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: "#13AA64",
                          height: "100%",
                          width: `${dashboardStats.brokerAssigned
                            ? (
                              dashboardStats.brokerAchieved /
                              dashboardStats.brokerAssigned
                            ) * 100
                            : 0
                            }%`,
                          position: "absolute",
                          zIndex: "9999",
                          top: "0",
                          bottom: "0",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.Graphfooter}>
                <span style={styles.Graphlink}>
                  View All
                </span>
              </div>
            </div>
          </div>


          <div className="graph-1-dash" style={styles.Graphcard}>
            <div style={{ width: "100$" }}>
              <div style={{ borderBottom: "1px solid #C2C9D1" }}>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Performance Overview <img src={i_icon} alt="i_icon" />
                  </span>
                </div>
              </div>

              <div
                className="dashboard-card-graph-scroll"
                style={{
                  width: "100%",
                  borderBottom: "1px solid rgb(194, 201, 209)",
                  padding: "15px 0",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <ResponsiveContainer width="50%" height="">
                    <PieChart>
                      <Pie

                        data={data}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={85}
                        outerRadius={105}
                        cornerRadius={20}
                        paddingAngle={0}
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="d-flex flex-column">
                    <div style={styles.GraphsalesRow}>
                      <div
                        className=" w-100"
                        style={{
                          padding: "16px 0",
                          fontFamily: '"Poppins", sans-serif',
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#727681",

                        }}
                      >
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex" style={{ gap: "15px" }}>
                            <span
                              style={{
                                backgroundColor: "#FF8F1F",
                                width: "20px",
                                height: "4px",
                              }}
                            ></span>
                            <span
                              className="d-flex flex-column gap-2"
                              style={{
                                fontFamily: "Inter",
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              Total Target
                              <div style={styles.GraphlegendValue}>
                                ₹{dashboardStats.totalTargetAmount.toLocaleString()}
                                & {dashboardStats.totalTargetPieces.toLocaleString()} pcs
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div></div>
                    </div>
                    <div style={styles.GraphsalesRow}>
                      <div
                        className=" w-100"
                        style={{
                          padding: "16px 0",
                          fontFamily: '"Poppins", sans-serif',
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#727681",

                        }}
                      >
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex" style={{ gap: "15px" }}>
                            <span
                              style={{
                                backgroundColor: "#F9E2D9",
                                width: "20px",
                                height: "4px",
                              }}
                            ></span>
                            <span
                              className="d-flex flex-column gap-2"
                              style={{
                                fontFamily: "Inter",
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              Revenue Achieved
                              <div style={styles.GraphlegendValue}>
                                ₹{dashboardStats.achievedRevenue.toLocaleString()}
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div></div>
                    </div>
                    <div style={styles.GraphsalesRow}>
                      <div
                        className=" w-100"
                        style={{
                          padding: "16px 0",
                          fontFamily: '"Poppins", sans-serif',
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#727681",

                        }}
                      >
                        <div className="d-flex flex-column gap-2">
                          <div className="d-flex" style={{ gap: "15px" }}>
                            <span
                              style={{
                                backgroundColor: "#0D6828",
                                width: "20px",
                                height: "4px",
                              }}
                            ></span>
                            <span
                              className="d-flex flex-column gap-2"
                              style={{
                                fontFamily: "Inter",
                                fontSize: "14px",
                                fontWeight: "500",
                              }}
                            >
                              Commission Generated
                              <div style={styles.GraphlegendValue}>
                                ₹{
                                  dashboardStats.totalIncentiveEarned.toLocaleString(undefined, {
                                    maximumFractionDigits: 2,
                                  })
                                }
                              </div>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.Graphfooter}>
                <span style={styles.Graphlink}>
                  View All
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section--------------------------------------------------------------------------------------------------------------------------- */}
      <div
        className="graph-main-dashboard"
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <div className="graph-container">
          {/* 1st Sales Leaderboard */}
          <div className="graph-1-dash" style={styles.Graphcard}>
            <div style={{ width: "100%" }}>

              {/* header */}
              <div >
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Sales Leaderboard <img src={i_icon} alt="i_icon" />
                  </span>
                  {/* <span style={styles.Graphbadge}>
                    -%
                  </span> */}
                </div>
              </div>

              {/* table */}
              <div
                className="dashboard-card-graph-scroll"
                style={{
                  width: "100%",
                  borderBottom: "1px solid rgb(194, 201, 209)",
                  padding: "15px 0",
                  boxSizing: "border-box",
                }}
              >
                <div className="dashboard-card-graph-scroll"
                  style={{
                    height: "330px",
                    overflowX: "auto",
                    overflowY: "auto",
                    width: "100%",
                  }}>
                  <div style={{}}>
                    <table style={{
                      fontFamily: "Inter",
                      width: "100%",
                      borderCollapse: "collapse",
                    }}>
                      <thead style={{
                        backgroundColor: "#F3F8FB",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}>
                        <tr style={{ color: "#727681", fontSize: "14px" }}>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Rank
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Customer
                          </th>
                          {/* <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}>
                            QTYs
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}>
                            Amount
                          </th> */}
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Target
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Progress
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Incentive
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Incentive Earned
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}>
                            Payout
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboardRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: "center", padding: "40px 16px", color: "#727681", fontSize: "14px" }}>
                              No Record Found
                            </td>
                          </tr>
                        ) : leaderboardRows.map((group, idx) => (
                          <tr key={idx} style={{ fontSize: "14px" }}>
                            <td style={{ padding: "10px 16px", color: "#0E101A" }}>
                              #{idx + 1}
                            </td>
                            <td style={{ padding: "10px 16px" }}>
                              <div style={{ maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", flexDirection: "column", color: "#0E101A" }}>
                                {group.broker_salesman_name}
                                <span style={{ color: "#727681", fontSize: "12px" }}>
                                  {group.assignType === "broker" ? "Broker" : "Salesman"}
                                </span>
                              </div>
                            </td>
                            {/* <td style={{ padding: "10px 16px", textAlign: "center", color: "#0E101A" }}>
                              {group.totalQty}
                            </td>
                            <td style={{ padding: "10px 16px", textAlign: "center", color: "#0E101A" }}>
                              ₹{group.totalAmount.toLocaleString()}
                            </td> */}

                            <td style={{ padding: "10px 16px", whiteSpace: "nowrap", color: "#0E101A" }}>
                              {/* {group.target
                                ? group.target.type === "Percentage"
                                  ? `${group.targetSet}%`
                                  : `₹${group.targetSet}/-`
                                : "—"} */}
                              <span>{group.metricLabel === "Pieces" ? `${group.targetValue} pcs` : `₹${group.targetValue.toLocaleString()}`}</span>
                            </td>

                            {/* Progress */}
                            <td style={{ padding: "10px 16px", minWidth: "140px" }}>
                              {group.target ? (
                                <div>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#727681", marginBottom: "4px" }}>
                                    <span>{group.metricLabel === "Pieces" ? `${group.achievedValue} pcs` : `₹${group.achievedValue.toLocaleString()}`}</span>
                                    <span>{group.metricLabel === "Pieces" ? `${group.targetValue} pcs` : `₹${group.targetValue.toLocaleString()}`}</span>
                                  </div>
                                  <div style={{ backgroundColor: "#DDE9F9", borderRadius: "4px", height: "10px", overflow: "hidden" }}>
                                    <div style={{
                                      backgroundColor: group.progressPercent >= 100 ? "#13AA64" : group.progressPercent >= 60 ? "#1F7FFF" : "#FF961C",
                                      height: "100%",
                                      width: `${group.progressPercent}%`,
                                      borderRadius: "4px",
                                    }} />
                                  </div>
                                  <div style={{ fontSize: "11px", color: group.progressPercent >= 100 ? "#13AA64" : "#727681", marginTop: "3px", fontWeight: "500" }}>
                                    {group.progressPercent.toFixed(1)}%
                                    {/* {group.progressPercent >= 100 && " ✓"} */}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ backgroundColor: "#F0F0F0", borderRadius: "4px", height: "10px" }} />
                                  <div style={{ fontSize: "11px", color: "#AAAAAA", marginTop: "3px" }}>No target</div>
                                </div>
                              )}
                            </td>

                            <td
                              style={{
                                padding: "10px 16px",
                                whiteSpace: "nowrap",
                                color: "#0E101A",
                              }}
                            >
                              {group.target
                                ? group.target.type === "Percentage"
                                  ? `${group.target.IncentiveValue}%`
                                  : `₹${group.target.IncentiveValue}/-`
                                : "—"}
                            </td>

                            <td
                              style={{
                                padding: "10px 16px",
                                whiteSpace: "nowrap",
                                color: "#0E101A",
                              }}
                            >
                              {group.target
                                ? `₹${group.incentiveEarned.toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}/-`
                                : "—"}
                            </td>
                            <td style={{ padding: "10px 16px", textAlign: "right", color: "#0E101A" }}>Paid</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* view all */}
              <div style={styles.Graphfooter}>
                <span style={styles.Graphlink}>
                  View All
                </span>
              </div>
            </div>
          </div>

          {/* 2nd Sales Activity */}
          <div className="graph-1-dash" style={styles.Graphcard}>
            <div style={{ width: "100$" }}>
              <div>
                <div style={styles.Graphheader}>
                  <span style={styles.Graphtitle}>
                    Recent Sales Activity<img src={i_icon} alt="i_icon" />
                  </span>
                  {/* <span style={styles.Graphbadge}>
                    -%
                  </span> */}
                </div>
              </div>

              <div
                className="dashboard-card-graph-scroll"
                style={{
                  width: "100%",
                  borderBottom: "1px solid rgb(194, 201, 209)",
                  padding: "15px 0",
                  boxSizing: "border-box",
                }}
              >
                <div className="dashboard-card-graph-scroll"
                  style={{
                    height: "330px",
                    overflowX: "auto",
                    overflowY: "auto",
                    width: "100%",
                  }}>
                  <div style={{}}>
                    <table style={{
                      fontFamily: "Inter",
                      width: "100%",
                      borderCollapse: "collapse",
                    }}>
                      <thead style={{
                        backgroundColor: "#F3F8FB",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}>
                        <tr style={{ color: "#727681", fontSize: "14px" }}>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Invoice
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}>
                            Broker/Salesman
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}>
                            QTYs
                          </th>
                          <th style={{
                            padding: "10px 16px",
                            fontWeight: "400",
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}>
                            Amount Per Unit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="8" className="text-center py-4">
                              <div
                                className="spinner-border text-primary"
                                role="status"
                              >
                                <span className="visually-hidden">Loading...</span>
                              </div>
                            </td>
                          </tr>
                        ) : invoices.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-5 text-muted">
                              No invoices found
                            </td>
                          </tr>
                        ) : invoices.filter((inv) => {
                          if (!selectedDateRange.startDate || !selectedDateRange.endDate) return true;
                          const invDate = new Date(inv.createdAt);
                          return invDate >= selectedDateRange.startDate && invDate <= selectedDateRange.endDate;
                        }).flatMap((inv) =>
                          (inv.itemsSalesman || []).filter((item) => item.broker_salesman_id && item.broker_salesman_name)
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ textAlign: "center", padding: "40px 16px", color: "#727681", fontSize: "14px" }}>
                              No Record Found
                            </td>
                          </tr>
                        ) : (
                          invoices
                            .filter((inv) => {
                              if (!selectedDateRange.startDate || !selectedDateRange.endDate) return true;
                              const invDate = new Date(inv.createdAt);
                              return invDate >= selectedDateRange.startDate && invDate <= selectedDateRange.endDate;
                            }).flatMap((inv) =>
                              (inv.itemsSalesman || [])
                                .filter((item) => item.broker_salesman_id && item.broker_salesman_name)
                                .map((item, itemIdx) => (
                                  <tr
                                    key={`${inv._id}-${itemIdx}`}
                                    style={{
                                      fontSize: "14px",
                                    }}
                                  >
                                    <td style={{
                                      padding: "10px 16px",
                                      fontWeight: "400",
                                      whiteSpace: "nowrap",
                                      color: "#1F7FFF",
                                      cursor: "pointer",
                                    }}
                                      onClick={() => navigate(`/sales-invoice/${inv._id}`, {
                                        state: { from: "/ledger" }
                                      })}
                                    >
                                      {inv.invoiceNo}
                                    </td>
                                    <td style={{
                                      padding: "10px 16px",
                                      fontWeight: "400",
                                    }}>
                                      <div style={{
                                        maxWidth: "150px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        display: "flex",
                                        flexDirection: "column",
                                        color: "#0E101A"
                                      }}>
                                        <span>{item.broker_salesman_name}</span>
                                        <span style={{ color: "#727681", fontSize: "12px" }}>
                                          {item.assignType === "broker" ? "Broker" : "Salesman"}
                                        </span>
                                      </div>
                                    </td>
                                    <td style={{
                                      padding: "10px 16px",
                                      fontWeight: "400",
                                      textAlign: "center",
                                      whiteSpace: "nowrap",
                                      color: "#0E101A"
                                    }}>
                                      {item.qty}
                                    </td>
                                    <td style={{
                                      padding: "10px 16px",
                                      fontWeight: "400",
                                      textAlign: "center",
                                      whiteSpace: "nowrap",
                                      color: "#0E101A"
                                    }}>
                                      ₹{item.unitPrice}
                                    </td>
                                  </tr>
                                ))
                            ))}

                        {/* Show message if no orders - keeps original styling */}
                        {/* {lastWeekSales.length === 0 && (
                          <tr>
                            <td colSpan="6" style={{
                              padding: "32px 16px",
                              textAlign: "center",
                              color: "#727681",
                              fontSize: "14px",
                            }}>
                              No orders in the last 7 days
                            </td>
                          </tr>
                        )} */}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              <div style={styles.Graphfooter}>
                <span style={styles.Graphlink}>
                  View All
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ledger;
