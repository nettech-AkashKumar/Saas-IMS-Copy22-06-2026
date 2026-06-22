import React, { useState } from "react";
import "./features.css";
// import Pos from "../assets/images/pos.png";
import Pos from "../assets/images/pos__2.png";
import Customer from "../assets/images/customer1.png";
import Stock from "../assets/images/stock.png";
// import Gst from "../assets/images/gst.png";
import Reports from "../assets/images/reports.png";
import Rewards from "../assets/images/rewards.png";
import Whatsapp from "../assets/images/whatsapp.png";
import Varient from "../assets/images/varient.png";
import Credit from "../assets/images/creditnote.png";

const features = [
  {
    id: "pos",
    title: "POS Billing",
    icon: "🧾",
    image: Pos,
    desc: "Create fast and professional bills with an integrated Point of Sale (POS) system.",
    points: [
      "Quick invoice generation",
      "Barcode support",
      "GST compliant billing",
      "Print or share invoices instantly",
    ],
  },
  {
    id: "stock",
    title: "Stock Management",
    icon: "📦",
    image: Stock,
    desc: "Track inventory efficiently with automated stock updates.",
    points: [
      "Real-time stock updates",
      "Low stock alerts",
      "Batch & expiry tracking",
      "Multi-warehouse support",
    ],
  },
  {
    id: "gst",
    title: "GST Billing & Verification",
    icon: "🧾",
    image: "/images/gst.png",
    desc: "Automated GST billing and return filing.",
    points: [
      "GST invoice generation",
      "GSTIN verification",
      "Auto tax calculation",
      "GST reports",
    ],
  },
  {
    id: "customer",
    title: "Customer & Supplier Management",
    icon: "👤",
    image: Customer,
    desc: "Manage customers and suppliers efficiently.",
    points: [
      "Customer ledger",
      "Supplier ledger",
      "Payment tracking",
      "Contact management",
    ],
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: "📊",
    image: Reports,
    desc: "Powerful insights into your business performance.",
    points: [
      "Sales reports",
      "Profit analysis",
      "Tax reports",
      "Inventory reports",
    ],
  },
  {
    id: "rewards",
    title: "Rewards, Offers & Coupons",
    icon: "🎁",
    image: Rewards,
    desc: "Boost customer loyalty with reward points, offers, and coupons.",
    points: [
      "Customer reward points",
      "Discount coupons",
      "Special promotional offers",
      "Loyalty program management",
    ],
  },
  {
    id: "credit",
    title: "Credit & Debit Notes",
    icon: "↩️",
    image: Credit,
    desc: "Manage returns and adjustments with credit and debit notes.",
    points: [
      "Generate credit notes",
      "Generate debit notes",
      "Return management",
      "Invoice adjustment tracking",
    ],
  },
  {
    id: "whatsapp",
    title: "WhatsApp Integration",
    icon: "💬",
    image: Whatsapp,
    desc: "Send invoices, reminders, and updates directly to customers via WhatsApp.",
    points: [
      "Send invoices on WhatsApp",
      "Payment reminders",
      "Order notifications",
      "Customer communication",
    ],
  },
  {
    id: "barcode",
    title: "Barcode Support",
    icon: "📷",
    image: Varient,
    desc: "Scan barcodes for fast billing and inventory management.",
    points: [
      "Barcode scanning",
      "Auto product detection",
      "Fast POS billing",
      "Inventory barcode tracking",
    ],
  },
];

export default function FeaturesSection() {
  const [active, setActive] = useState(features[0]);

  return (
    <section className="features-section">
      <h2 className="title">Powerful Features to Run Your Business Smoothly</h2>

      {/* Tabs */}
      <div className="feature-tabs">
        {features.map((item) => (
          <button
            key={item.id}
            className={`tab ${active.id === item.id ? "active" : ""}`}
            onClick={() => setActive(item)}
          >
            <span>{item.icon}</span> {item.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="feature-content">
        <div className="feature-image">
          <img src={active.image} alt="" />
        </div>

        <div className="feature-text">
          <h3>{active.title}</h3>
          <p>{active.desc}</p>

          <ul>
            {active.points.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
