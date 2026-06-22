import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import api from "../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import JsBarcode from "jsbarcode";

import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import { TiTick } from "react-icons/ti";

import SupplierLogo from "../../assets/images/SupplierLogo.png";
import Pagination from "../../components/Pagination";
import Barcode from "../../assets/images/barcode.jpg";
import { hasPermission } from "../../utils/permission/hasPermission";

import { useAuth } from "../../components/auth/AuthContext";

function SupplierReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewBarcode, setViewBarcode] = useState(null);
  const [viewOptions, setViewOptions] = useState([]);
  const buttonRefs = useRef([]);
  const modelRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierData, setSupplierData] = useState([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());
  const [supplierSearchData, setSupplierSearchData] = useState({});
  const supplierRef = useRef(null);
  const handleSupplierSearch = (e, id) => {
    const term = e.target.value;

    const filtered = suppliers.filter((s) =>
      s.name.toLowerCase().includes(term.toLowerCase()),
    );

    setSupplierSearchData((prev) => ({
      ...prev,
      [id]: {
        term,
        filtered,
        isOpen: true,
      },
    }));
  };
  const openSupplierDropdown = (id) => {
    setSupplierSearchData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isOpen: true,
        filtered: suppliers,
      },
    }));
  };
  const handleSelectSupplier = (supplier, id) => {
    setSelectedSupplier(supplier._id);

    setSupplierSearchData((prev) => ({
      ...prev,
      [id]: {
        term: supplier.name,
        filtered: [],
        isOpen: false,
      },
    }));
  };

  const [activeRow, setActiveRow] = useState(null);

  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     // close only when:
  //     const isClickInsideModel =
  //       modelRef.current && modelRef.current.contains(event.target);

  //     const isClickInsideButton =
  //       buttonRefs.current[viewBarcode] &&
  //       buttonRefs.current[viewBarcode].contains(event.target);

  //     buttonRefs.current[viewOptions] &&
  //       buttonRefs.current[viewOptions].contains(event.target);

  //     if (!isClickInsideModel && !isClickInsideButton) {
  //       setViewBarcode(false);
  //       setViewOptions(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, [viewBarcode, viewOptions]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Barcode modal logic
      const isClickInsideModel =
        modelRef.current && modelRef.current.contains(event.target);

      const isClickInsideButton =
        buttonRefs.current[viewBarcode] &&
        buttonRefs.current[viewBarcode].contains(event.target);

      // ✅ NEW: supplier dropdown check
      const isClickInsideSupplier =
        supplierRef.current && supplierRef.current.contains(event.target);

      if (!isClickInsideModel && !isClickInsideButton) {
        setViewBarcode(false);
        setViewOptions(false);
      }

      // ✅ CLOSE supplier dropdown
      if (!isClickInsideSupplier) {
        setSupplierSearchData((prev) => ({
          ...prev,
          supplier: {
            ...prev["supplier"],
            isOpen: false,
          },
        }));
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode, viewOptions]);

  const tabs = [{ label: "All", count: 156, active: true }];

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/suppliers/active-suppliers");
      setSuppliers(res.data.suppliers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSupplierStatistics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(itemsPerPage),
        search: String(searchTerm || ""),
      }).toString();
      const res = await api.get(
        `/api/purchase-orders/supplier/${selectedSupplier}?${params}`,
      );
      // console.log("Supplier statistics:", res.data);
      const data = res?.data;
      const list = Array.isArray(data?.invoices)
        ? data.invoices
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setSupplierData(list);
      setTotalInvoices(Number(data?.pagination?.total || list.length || 0));
    } catch (err) {
      toast.error("Failed to load supplier statistics");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (selectedSupplier) {
      fetchSupplierStatistics();
    }
  }, [selectedSupplier, page, itemsPerPage, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const handleSelectRow = (id) => {
    const newSelected = new Set(selectedRowIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRowIds(newSelected);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(supplierData.map((item) => item._id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  useEffect(() => {
    setSelectedRowIds(new Set());
  }, [supplierData]);

  // const handlePdf = () => {
  //   const doc = new jsPDF();
  //   doc.text("Supplier Data", 14, 15);
  //   const tableColumns = [
  //     "Products Name",
  //     "Category",
  //     "Item Code",
  //     "Unit Purchased",
  //     "Total Cost",
  //     "Available Quantity",
  //     "Status",
  //   ];

  //   const visibleRows = selectedRowIds.size > 0
  //     ? supplierData.filter((e) => selectedRowIds.has(e._id))
  //     : supplierData;

  //   const tableRows = visibleRows.map((e) => [
  //     e.items?.[0]?.itemName,
  //     e.items?.[0]?.productId?.category?.categoryName,
  //     e.items?.[0]?.productId?.itemBarcode,
  //     e.items?.[0]?.qty,
  //     e.grandTotal,
  //     e.items?.[0]?.productId?.stockQuantity,
  //     e.status,
  //   ]);

  //   autoTable(doc, {
  //     head: [tableColumns],
  //     body: tableRows,
  //     startY: 20,
  //     styles: {
  //       fontSize: 8,
  //     },
  //     headStyles: {
  //       fillColor: [155, 155, 155],
  //       textColor: "white",
  //     },
  //     theme: "striped",
  //   });

  //   doc.save("suppliers.pdf");
  // };

  // Handle Barcode rendering for list view popup
  const handlePdf = () => {
    // ❗ Step 1: Check selection
    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one record to export");
      return;
    }

    // ❗ Step 2: Filter only selected rows
    const dataToExport = supplierData.filter((item) =>
      selectedRowIds.has(item._id),
    );

    if (!dataToExport.length) {
      toast.warning("No data to export");
      return;
    }

    try {
      const doc = new jsPDF("portrait", "mm", "a4");

      // Header
      doc.setFontSize(18);
      doc.text("Supplier Report", 105, 15, { align: "center" });

      doc.setFontSize(10);
      doc.text(`Total Records: ${dataToExport.length}`, 105, 22, {
        align: "center",
      });

      // Table data
      const tableData = dataToExport.map((e, index) => [
        index + 1,
        e.items?.[0]?.itemName || "N/A",
        e.items?.[0]?.productId?.category?.categoryName || "N/A",
        e.items?.[0]?.productId?.itemBarcode || "N/A",
        e.items?.[0]?.qty || 0,
        `₹${e.grandTotal || 0}`,
        e.items?.[0]?.productId?.stockQuantity || 0,
        e.status || "N/A",
      ]);

      // autoTable(doc, {
      //   startY: 28,
      //   head: [
      //     [
      //       "Sr no.",
      //       "Product",
      //       "Category",
      //       "Barcode",
      //       "Qty",
      //       "Total Cost",
      //       "Available",
      //       "Status",
      //     ],
      //   ],
      //   body: tableData,
      //   theme: "grid",
      //   headStyles: {
      //     fillColor: [155, 155, 155],
      //     textColor: "white",
      //   },
      //   styles: { fontSize: 9 },
      // });

      doc.save(`supplier_report_${Date.now()}.pdf`);

      toast.success(`Exported ${dataToExport.length} record(s)`);

      // ✅ Clear selection after export
      setSelectedRowIds(new Set());
    } catch (error) {
      console.error(error);
      toast.error("Failed to export PDF");
    }
  };

  useEffect(() => {
    if (viewBarcode !== false && supplierData[viewBarcode]) {
      const order = supplierData[viewBarcode];
      const itemBarcode = order.items?.[0]?.productId?.itemBarcode;

      if (itemBarcode) {
        setTimeout(() => {
          const element = document.getElementById(`barcode-svg-${viewBarcode}`);
          if (element) {
            try {
              let format = "CODE128";
              // if (/^\d{12,13}$/.test(itemBarcode)) format = "EAN13";
              JsBarcode(element, itemBarcode, {
                format: format,
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
              });
            } catch (e) {
              // Fallback or retry
              try {
                JsBarcode(element, itemBarcode, {
                  format: "CODE128",
                  lineColor: "#000",
                  width: 2,
                  height: 100,
                  displayValue: true,
                });
              } catch (err) { }
            }
          }
        }, 100);
      }
    }
  }, [viewBarcode, supplierData]);

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "91vh" }}>
      {/* back, header, view style */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px", // Optional: padding for container
        }}
      >
        {/* Left: Title + Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: "33px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              height: "33px",
            }}
          >
            Supplier Report
          </h2>
        </div>
      </div>

      {/* main body */}
      <div
        style={{
          overflowX: "auto",
          width: "100%",
          padding: 16,
          background: "white",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* tabs + Search Bar & import */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            height: "33px",
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              padding: 2,
              background: "#F3F8FB",
              borderRadius: 8,
              flexWrap: "wrap",
              maxWidth: "50%",
              width: "fit-content",
            }}
          >
            {tabs.map((tab) => (
              <div
                key={tab.label}
                style={{
                  padding: "4px 12px",
                  background: tab.active ? "white" : "transparent",
                  borderRadius: 8,
                  boxShadow: tab.active
                    ? "0px 1px 4px rgba(0, 0, 0, 0.10)"
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                  color: "#0E101A",
                }}
              >
                {tab.label}
                <span style={{ color: "#727681" }}>{tab.count}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "inline-flex",
              justifyContent: "end",
              alignItems: "center",
              gap: 16,
              width: "50%",
              height: "33px",
            }}
          >
            {/* search bar */}
            <div
              style={{
                width: "50%",
                position: "relative",
                padding: "5px 0px 5px 10px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
                height: "33px",
              }}
            >
              <IoIosSearch className="fs-4" />
              <input
                type="search"
                placeholder="Search"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                  color: "rgba(19.75, 25.29, 61.30, 0.40)",
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Export Button */}
            {hasPermission(user, "SupplierReport", "export") && (
              <button
                title="Export"
                onClick={handlePdf}
                style={{
                  display: "flex",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: 9,
                  padding: "8px 16px",
                  background: "#FCFCFC",
                  borderRadius: 8,
                  outline: "1px solid #EAEAEA",
                  outlineOffset: "-1px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  fontWeight: 400,
                  height: "33px",
                  color: "#0E101A",
                }}
              >
                <TbFileExport className="fs-5 text-secondary" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* select supplier + text & logo */}
        <div style={{}}>
          {/* select supplier*/}
          <div
            style={{
              display: "inline-flex",
              justifyContent: "start",
              alignItems: "center",
              gap: 16,
              width: "34%",
              height: "33px",
            }}
          >
            {/* <div
              style={{
                width: "100%",
                position: "relative",
                padding: "5px 10px 5px 10px",
                display: "flex",
                borderRadius: 8,
                alignItems: "center",
                background: "#FCFCFC",
                border: "1px solid #EAEAEA",
                gap: "5px",
                color: "rgba(19.75, 25.29, 61.30, 0.40)",
                height: "33px",
              }}
            >
              <select
                value={selectedSupplier || ""}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                placeholder="Search"
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "#FCFCFC",
                }}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier, index) => (
                  <option key={index} value={supplier._id}>{supplier.name}</option>
                ))}
              </select>
              
            </div> */}
            <div
              ref={supplierRef}
              style={{ position: "relative", width: "100%" }}
            >
              {/* Input like your product search */}
              <input
                type="text"
                value={supplierSearchData["supplier"]?.term || ""}
                onChange={(e) => handleSupplierSearch(e, "supplier")}
                onFocus={() => openSupplierDropdown("supplier")}
                placeholder="Search Supplier"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #EAEAEA",
                  background: "#FCFCFC",
                  borderRadius: "6px",
                  outline: "none",
                }}
              />

              {/* Dropdown */}
              {supplierSearchData["supplier"]?.isOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "100%",
                    maxHeight: "200px",
                    overflowY: "auto",
                    background: "#FCFCFC",
                    border: "1px solid #EAEAEA",
                    borderRadius: "6px",
                    zIndex: 1000,
                  }}
                >
                  {supplierSearchData["supplier"]?.filtered?.length > 0 ? (
                    supplierSearchData["supplier"].filtered.map((s) => (
                      <div
                        key={s._id}
                        onClick={() => handleSelectSupplier(s, "supplier")}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid #F5F5F5",
                        }}
                      >
                        {s.name}
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: "8px 12px", color: "#999" }}>
                      No supplier found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* after supplier is selected */}
        <div className="table-responsive" style={{ overflowY: "auto", height: "calc(100vh - 310px)", maxHeight: "505px" }}>
          {selectedSupplier && (
            <>
              {/* Table */}
              <div>
                <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  {/* Header */}
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}
                  >
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: 80,
                          fontWeight: "400",
                        }}
                      >
                        {/* <div
                        style={{ display: "flex", alignItems: "center", gap: 12 }}
                      >
                        <input
                          type="checkbox"
                          style={{ width: 18, height: 18 }}
                          onChange={handleSelectAll}
                          checked={supplierData.length > 0 && supplierData.every((item) => selectedRowIds.has(item._id))}
                        />
                        Product Name & Category
                      </div> */}
                        Supplier Name
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: 200,
                          fontWeight: "400",
                        }}
                      >
                        Phome Number
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: 123,
                          fontWeight: "400",
                        }}
                      >
                        GST IN
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: 112,
                          fontWeight: "400",
                        }}
                      >
                        PAN
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: 100,
                          fontWeight: "400",
                        }}
                      >
                        Total Business
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: 100,
                          fontWeight: "400",
                        }}
                      >
                        Balance
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {supplierData.map((supplier, index) => (
                      <tr
                        key={index}
                        style={{
                          borderBottom: "1px solid #EAEAEA",
                          height: "46px",
                        }}
                        className={`table-hover ${activeRow === index ? "active-row" : ""}`}
                        onClick={() =>
                          navigate(`/supplier/view/${supplier._id}`, {
                            state: { from: location.pathname },
                          })
                        }
                      >
                        {/* Supplier Name */}
                        <td
                          style={{
                            padding: "8px 16px",
                            verticalAlign: "middle",
                            height: "46px",
                            cursor: "pointer",
                          }}
                        >
                          {/* <div
                          style={{ display: "flex", alignItems: "center", gap: 12 }}
                        >
                          <input
                            type="checkbox"
                            style={{ width: 18, height: 18 }}
                            checked={selectedRowIds.has(product._id)}
                            onChange={() => handleSelectRow(product._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                color: "#0E101A",
                                whiteSpace: "nowrap",
                                display: "flex",
                                gap: "5px",
                                justifyContent: "center",
                                alignItems: "center",
                                cursor: 'pointer',
                              }}
                            >
                              <div>{product.items?.[0]?.itemName || "N/A"}</div>
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "4px 8px",
                                  background: "#FFE0FC",
                                  color: "#AE009B",
                                  borderRadius: 36,
                                  fontSize: 12,
                                  marginTop: 4,
                                }}
                              >
                                {product.items?.[0]?.productId?.category?.categoryName || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div> */}
                          {supplier.name || "N/A"}
                        </td>

                        {/* Item Code */}
                        <td
                          style={{
                            padding: "8px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                          }}
                        // onClick={(e) => e.stopPropagation()}
                        >
                          {/* <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            position: "relative",
                          }}
                          onClick={() =>
                            setViewBarcode(viewBarcode === index ? false : index)
                          }
                          ref={(el) => (buttonRefs.current[index] = el)}
                        >
                          {product.items?.[0]?.productId?.itemBarcode || "N/A"}
                          <FaBarcode className="fs-6 text-secondary" />
                        </div>
                        {viewBarcode === index && (
                          <>
                            <div
                              style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0,0,0,0.5)",
                                zIndex: 999999,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div
                                ref={modelRef}
                                style={{
                                  width: "70%",
                                  backgroundColor: "#f5f4f4ff",
                                  borderRadius: 16,
                                  padding: 24,
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    width: "300px",
                                    height: "auto",
                                    backgroundColor: "white",
                                    outfit: "contain",
                                    boxShadow: "10px 10px 40px rgba(0,0,0,0.10)",
                                    borderRadius: 16,
                                    padding: 16,
                                    border: "2px solid #dbdbdbff",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                  }}
                                >
                                  <span>
                                    {product.items?.[0]?.itemName || "N/A"} / ₹{product.items?.[0]?.productId?.purchasePrice + "/-" || "N/A"}
                                  </span>
                                  <div className="d-flex justify-content-center align-items-center">
                                    <svg id={`barcode-svg-${index}`}></svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )} */}
                          {supplier.phoneNumber || "N/A"}
                        </td>

                        {/* unit purchased */}
                        <td
                          style={{
                            padding: "8px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                            cursor: "pointer",
                          }}
                        >
                          {/* {product.items?.[0]?.qty || "N/A"} */}
                          {supplier.gstIn || "N/A"}
                        </td>

                        {/* total cost */}
                        <td
                          style={{
                            padding: "8px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                            cursor: "pointer",
                          }}
                        >
                          {/* ₹{product.grandTotal}/- */}
                          {supplier.pan || "N/A"}
                        </td>

                        {/* available quantity */}
                        <td
                          style={{
                            padding: "8px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                            cursor: "pointer",
                          }}
                        >
                          {/* {Array.isArray(product.items)
                          ? product.items
                            .map((it) =>
                              it?.productId?.stockQuantity ?? "N/A"
                            )
                            .join(", ")
                          : "N/A"} */}
                          ₹{supplier.totalBusiness || "N/A"}/-
                        </td>

                        {/* status */}
                        <td
                          style={{
                            padding: "8px 16px",
                            fontSize: 14,
                            color: "#0E101A",
                            cursor: "pointer",
                          }}
                        >
                          {/* <span
                          style={{
                            display: "inline-block",
                            padding: "4px 8px",
                            background: product.status === "received" ? "#D4F7C7" : product.status === "Pending" ? "#FFF2D5" : "#F7C7C9",
                            color: product.status === "received" ? "#379c13ff" : product.status === "Pending" ? "#CF4F00" : "#A80205",
                            borderRadius: 36,
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          {product.status === "received" ? <TiTick /> : product.status === "Pending" ? "!" : "x"} {(product.status).toUpperCase()}
                        </span> */}
                          ₹{supplier.balance || "N/A"}/-
                        </td>
                      </tr>
                    ))}
                    {supplierData.length === 0 && (
                      <tr>
                        <td colSpan="9" className="text-center p-3">
                          <span className="" style={{}}>
                            No Record Found
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={page}
                  total={totalInvoices}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(p) => setPage(p)}
                  onItemsPerPageChange={(n) => {
                    setItemsPerPage(n);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupplierReport;
