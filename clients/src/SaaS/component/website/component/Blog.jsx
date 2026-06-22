import React, { useState } from "react";
import "./blog.css";
import { FiArrowRight, FiCalendar } from "react-icons/fi";

const blogData = [
  {
    id: 1,
    category: "Inventory",
    img: "/images/blog1.png",
    title:
      "Building Scalable Business Solutions Through Mobile App Development",
    desc: "Learn how to leverage modern inventory systems to scale your business.",
    date: "May 7, 2026",
  },
  {
    id: 2,
    category: "POS",
    img: "/images/blog2.png",
    title: "Advanced POS Systems for Retail Excellence",
    desc: "Discover the latest POS technologies transforming retail operations.",
    date: "May 6, 2026",
  },
  {
    id: 3,
    category: "Invoices",
    img: "/images/blog3.png",
    title: "Streamline Invoicing with Automated Systems",
    desc: "Reduce errors and improve cash flow with intelligent invoicing.",
    date: "May 5, 2026",
  },
  {
    id: 4,
    category: "Customers",
    img: "/images/blog4.png",
    title: "Customer Management Best Practices",
    desc: "Build lasting relationships with powerful CRM integration.",
    date: "May 4, 2026",
  },
];

const tabs = [
  "Recent",
  "Inventory",
  "Customers",
  "Purchase Order",
  "Invoice",
  "POS",
  "Quotations",
];

export default function BlogSection() {
  const [activeTab, setActiveTab] = useState("Recent");

  const filteredBlogs =
    activeTab === "Recent"
      ? blogData
      : blogData.filter((blog) => blog.category === activeTab);

  return (
    <section className="blog-section">
      <div className="blog-header">
        <h2>Latest Insights & Resources</h2>
        <p>Stay updated with industry trends and best practices</p>
      </div>

      {/* Blog Tabs */}
      <div className="blog-tabs-wrapper">
        <div className="blog-tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`blog-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Cards */}
      <div className="blog-grid">
        {filteredBlogs.length > 0 ? (
          filteredBlogs.map((blog) => (
            <div key={blog.id} className="blog-card">
              <div className="blog-image">
                <img src={blog.img} alt={blog.title} />
                <span className="blog-tag">{blog.category}</span>
              </div>
              <div className="blog-content">
                <h3>{blog.title}</h3>
                <p>{blog.desc}</p>
                <div className="blog-footer">
                  <span className="blog-date">
                    <FiCalendar size={14} /> {blog.date}
                  </span>
                  <a href="#" className="read-more">
                    Read More <FiArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#999", padding: "40px" }}>
            No blogs found
          </p>
        )}
      </div>
    </section>
  );
}
