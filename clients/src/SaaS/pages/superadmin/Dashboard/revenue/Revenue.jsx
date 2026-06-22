import React, { useMemo } from "react";
import { FiCalendar, FiSettings } from "react-icons/fi";
import ReactApexChart from "react-apexcharts";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const clampPercent = (value) => {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
};

const Revenue = ({ stats = {}, totalCard = {} }) => {
  const yearlyRevenue = Number(totalCard.totalEarnings || 0);
  const companiesCount = Number(
    totalCard.totalCompanies || stats.totalCompanies || 0,
  );

  const monthlyBars = useMemo(() => {
    const base = Math.max(yearlyRevenue / 12, 1);
    const factors = [
      0.48, 0.38, 0.54, 0.82, 0.88, 0.95, 0.83, 0.84, 0.84, 0.9, 0.28, 0.84,
    ];
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return factors.map((factor, index) => {
      const value = Math.round(base * factor);
      return {
        label: monthLabels[index],
        value,
      };
    });
  }, [yearlyRevenue]);

  const maxMonthValue = Math.max(...monthlyBars.map((item) => item.value), 1);

  const planCounts = {
    free: Number(totalCard.freePlanCount || 0),
    standard: Number(totalCard.standardPlanCount || 0),
    pro: Number(totalCard.proPlanCount || 0),
  };

  const totalPlans = Math.max(
    planCounts.free + planCounts.standard + planCounts.pro,
    1,
  );

  const freePercent = clampPercent((planCounts.free / totalPlans) * 100);
  const standardPercent = clampPercent(
    (planCounts.standard / totalPlans) * 100,
  );
  const proPercent = clampPercent((planCounts.pro / totalPlans) * 100);

  const weekBars = [
    { day: "M", value: Math.max(Math.round(companiesCount * 0.42), 1) },
    { day: "T", value: Math.max(Math.round(companiesCount * 0.63), 1) },
    { day: "W", value: Math.max(Math.round(companiesCount * 0.22), 1) },
    { day: "T", value: Math.max(Math.round(companiesCount * 0.82), 1) },
    { day: "F", value: Math.max(Math.round(companiesCount * 0.63), 1) },
    { day: "S", value: Math.max(Math.round(companiesCount * 0.63), 1) },
    { day: "S", value: Math.max(Math.round(companiesCount * 0.63), 1) },
  ];

  const weekMax = Math.max(...weekBars.map((item) => item.value), 1);

  const revenueChartOptions = useMemo(
    () => ({
      chart: {
        id: "revenue-monthly",
        toolbar: { show: false },
        background: "transparent",
        fontFamily: "'Segoe UI Variable', 'Segoe UI', sans-serif",
      },
      colors: ["#f59c42"],
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.3,
          gradientToColors: ["#d9831f"],
          opacityFrom: 1,
          opacityTo: 0.85,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "52%",
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "rgba(219,227,240,0.7)",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        categories: monthlyBars.map((bar) => bar.label),
        labels: {
          style: {
            colors: "#6d7b91",
            fontSize: "12px",
            fontWeight: 500,
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        max: maxMonthValue,
        tickAmount: 4,
        labels: {
          formatter: (value) => `₹${Math.round(value / 1000)}K`,
          style: {
            colors: "#6d7b91",
            fontSize: "11px",
          },
        },
      },
      tooltip: {
        theme: "light",
        y: {
          formatter: (value) => formatCurrency(value),
        },
      },
      legend: { show: false },
    }),
    [maxMonthValue, monthlyBars],
  );

  const revenueChartSeries = useMemo(
    () => [{ name: "Revenue", data: monthlyBars.map((bar) => bar.value) }],
    [monthlyBars],
  );

  const donutSeries = useMemo(
    () => [planCounts.free, planCounts.standard, planCounts.pro],
    [planCounts.free, planCounts.pro, planCounts.standard],
  );

  const donutOptions = useMemo(
    () => ({
      chart: {
        type: "donut",
        toolbar: { show: false },
        background: "transparent",
        fontFamily: "'Segoe UI Variable', 'Segoe UI', sans-serif",
      },
      labels: ["Basic", "Premium", "Enterprise"],
      colors: ["#f59c42", "#f9be05", "#2f80ed"],
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      plotOptions: {
        pie: {
          donut: {
            size: "62%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total",
                fontSize: "12px",
                fontWeight: 600,
                color: "#6d7b91",
                formatter: (w) =>
                  w.globals.seriesTotals.reduce((a, b) => a + b, 0),
              },
              value: {
                fontSize: "22px",
                fontWeight: 700,
                color: "#122033",
              },
            },
          },
        },
      },
      legend: { show: false },
      tooltip: {
        theme: "light",
        y: {
          formatter: (value) => `${value} companies`,
        },
      },
    }),
    [],
  );

  const companiesOptions = useMemo(
    () => ({
      chart: {
        id: "companies-weekly",
        toolbar: { show: false },
        background: "transparent",
        fontFamily: "'Segoe UI Variable', 'Segoe UI', sans-serif",
      },
      colors: ["#0d5eff"],
      fill: {
        type: "gradient",
        gradient: {
          shade: "light",
          type: "vertical",
          shadeIntensity: 0.2,
          gradientToColors: ["#0a2d89"],
          opacityFrom: 1,
          opacityTo: 0.8,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 10,
          columnWidth: "55%",
        },
      },
      dataLabels: { enabled: false },
      grid: {
        borderColor: "rgba(219,227,240,0.7)",
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
      },
      xaxis: {
        categories: weekBars.map((bar) => bar.day),
        labels: {
          style: {
            colors: "#6d7b91",
            fontSize: "12px",
            fontWeight: 500,
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        max: weekMax,
        tickAmount: 4,
        labels: {
          style: {
            colors: "#6d7b91",
            fontSize: "11px",
          },
        },
      },
      legend: { show: false },
      tooltip: {
        theme: "light",
        y: {
          formatter: (value) => `${value} companies`,
        },
      },
    }),
    [weekBars, weekMax],
  );

  const companiesSeries = useMemo(
    () => [{ name: "Companies", data: weekBars.map((bar) => bar.value) }],
    [weekBars],
  );

  return (
    <section className="sa-revenue-grid">
      <article className="sa-revenue-card sa-revenue-card--wide">
        <header className="sa-revenue-card__header">
          <div>
            <p className="sa-eyebrow" style={{ margin: 0 }}>
              Analytics
            </p>
            <h3 style={{ margin: "4px 0 0" }}>Revenue Overview</h3>
          </div>
          <span className="sa-revenue-pill">
            <FiCalendar /> 2026
          </span>
        </header>

        <div className="sa-revenue-card__body">
          <div className="sa-revenue-summary">
            <strong>{formatCurrency(yearlyRevenue)}</strong>
            <p>
              <span>+40%</span> increased from last year
            </p>
          </div>
          <span className="sa-revenue-legend">Monthly Revenue</span>
        </div>

        <div className="sa-apex-chart sa-apex-chart--revenue">
          <ReactApexChart
            options={revenueChartOptions}
            series={revenueChartSeries}
            type="bar"
            height={260}
          />
        </div>
      </article>

      <article className="sa-revenue-card sa-revenue-card--plans">
        <header className="sa-revenue-card__header">
          <div>
            <p className="sa-eyebrow" style={{ margin: 0 }}>
              Distribution
            </p>
            <h3 style={{ margin: "4px 0 0" }}>Top Plans</h3>
          </div>
          <span className="sa-revenue-pill">
            <FiCalendar /> This Month
          </span>
        </header>

        <div className="sa-apex-chart sa-apex-chart--donut">
          <ReactApexChart
            options={donutOptions}
            series={donutSeries}
            type="donut"
            height={240}
          />
        </div>

        <div className="sa-plan-breakdown-list">
          <div>
            <span>
              <span className="dot-basic" />
              Basic
            </span>
            <strong>{freePercent}%</strong>
          </div>
          <div>
            <span>
              <span className="dot-premium" />
              Premium
            </span>
            <strong>{standardPercent}%</strong>
          </div>
          <div>
            <span>
              <span className="dot-enterprise" />
              Enterprise
            </span>
            <strong>{proPercent}%</strong>
          </div>
        </div>
      </article>

      <article className="sa-revenue-card sa-revenue-card--companies">
        <header className="sa-revenue-card__header">
          <div>
            <p className="sa-eyebrow" style={{ margin: 0 }}>
              Growth
            </p>
            <h3 style={{ margin: "4px 0 0" }}>Companies</h3>
          </div>
          <span className="sa-revenue-pill sa-revenue-pill--highlight">
            <FiCalendar /> This Week
          </span>
        </header>

        <div className="sa-apex-chart sa-apex-chart--companies">
          <ReactApexChart
            options={companiesOptions}
            series={companiesSeries}
            type="bar"
            height={230}
          />
        </div>

        <p className="sa-week-footer">
          <em>+6%</em> {companiesCount} total companies registered
        </p>
      </article>
    </section>
  );
};

export default Revenue;
