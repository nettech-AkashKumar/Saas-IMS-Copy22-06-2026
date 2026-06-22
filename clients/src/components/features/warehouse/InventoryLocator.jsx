import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import { FiSearch, FiTrash2 } from "react-icons/fi";
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";
import { Link, useLocation } from "react-router-dom";
import api from "../../../pages/config/axiosInstance";
import ProductDefaultImage from "../../../assets/images/product-default.png";

function InventoryLocator() {
  const [showSearchProducts, setShowSearchProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const searchRef = useRef(null);
  const [warehouses, setWarehouses] = useState([]);
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [bins, setBins] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [allocatedMap, setAllocatedMap] = useState({});
  const token = localStorage.getItem("token");

  const [visibleFields, setVisibleFields] = useState(["warehouse"]);

  const [dropdowns, setDropdowns] = useState({
    warehouse: false,
    zone: false,
    rack: false,
    shelf: false,
    bin: false,
  });

  const [selectedValues, setSelectedValues] = useState({
    warehouse: "",
    zone: "",
    rack: "",
    shelf: "",
    bin: "",
  });

  const [selectedLocation, setSelectedLocation] = useState({
    warehouse: null,
    zone: null,
    rack: null,
    shelf: null,
    bin: null,
  });

  const dropdownRefs = {
    warehouse: useRef(null),
    zone: useRef(null),
    rack: useRef(null),
    shelf: useRef(null),
    bin: useRef(null),
  };

  const dropdownOptions = {
    warehouse: warehouses,
    zone: zones,
    rack: racks,
    shelf: shelves,
    bin: bins,
  };

  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchProducts(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(dropdownRefs).forEach((key) => {
        if (
          dropdownRefs[key].current &&
          !dropdownRefs[key].current.contains(event.target)
        ) {
          setDropdowns((prev) => ({ ...prev, [key]: false }));
        }
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchAllocatedMap = async () => {
    try {
      const res = await api.get("/api/warehouse/product-allocation");
      const map = {};
      (res.data.data || []).forEach((row) => {
        const id = row.id?.toString();
        if (id) {
          map[id] = (map[id] || 0) + Number(row.allocatedQty || 0);
        }
      });
      setAllocatedMap(map);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllocatedMap();
  }, []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await api.get("/api/warehouse/active");
        setWarehouses(res.data.data || []);
      } catch (error) {
        console.log(error);
      }
    };
    fetchWarehouses();
  }, []);

  const fetchProducts = async (currentSelected = selectedProducts) => {
    try {
      setLoading(true);
      const res = await api.get("/api/products", {
        params: { search },
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(
        (res.data.products || []).map((product) => {
          const totalStock = Number(product.stockQuantity || 0);
          const dbAssigned = Number(product.assignedQuantity || 0);
          const sessionAssigned =
            currentSelected.find((p) => p._id === product._id)?.assignQty || 0;
          return {
            ...product,
            availableQuantity: totalStock - dbAssigned - sessionAssigned,
          };
        }),
      );
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search]);

  const drillDown = (sv, sl, warehouseObj) => {
    const newVisible = ["warehouse"];

    // ── ZONE ──
    const zonesData = warehouseObj?.zones || [];
    setZones(zonesData);

    let resolvedZone = sl.zone;
    if (zonesData.length === 0) {
      setSelectedValues(sv);
      setSelectedLocation(sl);
      setVisibleFields(newVisible);
      return;
    }
    if (zonesData.length === 1) {
      resolvedZone = zonesData[0];
      sl = { ...sl, zone: resolvedZone };
      sv = { ...sv, zone: resolvedZone.zoneName };
    } else {
      newVisible.push("zone");
      if (!resolvedZone) {
        setRacks([]);
        setShelves([]);
        setBins([]);
        setSelectedValues(sv);
        setSelectedLocation(sl);
        setVisibleFields(newVisible);
        return;
      }
    }

    // ── RACK ──
    const racksData = resolvedZone?.racks || [];
    setRacks(racksData);

    let resolvedRack = sl.rack;
    if (racksData.length === 0) {
      setSelectedValues(sv);
      setSelectedLocation(sl);
      setVisibleFields(newVisible);
      return;
    }
    if (racksData.length === 1) {
      resolvedRack = racksData[0];
      sl = { ...sl, rack: resolvedRack };
      sv = { ...sv, rack: resolvedRack.rackName };
    } else {
      newVisible.push("rack");
      if (!resolvedRack) {
        setShelves([]);
        setBins([]);
        setSelectedValues(sv);
        setSelectedLocation(sl);
        setVisibleFields(newVisible);
        return;
      }
    }

    // ── SHELF ──
    const shelvesData = resolvedRack?.shelves || [];
    setShelves(shelvesData);

    let resolvedShelf = sl.shelf;
    if (shelvesData.length === 0) {
      setSelectedValues(sv);
      setSelectedLocation(sl);
      setVisibleFields(newVisible);
      return;
    }
    if (shelvesData.length === 1) {
      resolvedShelf = shelvesData[0];
      sl = { ...sl, shelf: resolvedShelf };
      sv = { ...sv, shelf: resolvedShelf.shelfName };
    } else {
      newVisible.push("shelf");
      if (!resolvedShelf) {
        setBins([]);
        setSelectedValues(sv);
        setSelectedLocation(sl);
        setVisibleFields(newVisible);
        return;
      }
    }

    // ── BIN ──
    const binsData = resolvedShelf?.bins || [];
    setBins(binsData);

    if (binsData.length === 0) {
      setSelectedValues(sv);
      setSelectedLocation(sl);
      setVisibleFields(newVisible);
      return;
    }
    if (binsData.length === 1) {
      const autoBin = binsData[0];
      sl = { ...sl, bin: autoBin };
      sv = {
        ...sv,
        bin: typeof autoBin === "string" ? autoBin : autoBin.binName,
      };
    } else {
      newVisible.push("bin");
    }

    setSelectedValues(sv);
    setSelectedLocation(sl);
    setVisibleFields(newVisible);
  };

  const handleAssignProduct = async () => {
    try {
      if (selectedProducts.length === 0) {
        toast.error("Please add products");
        return;
      }

      const invalidProduct = selectedProducts.find(
        (p) => !p.assignQty || Number(p.assignQty) < 1,
      );
      if (invalidProduct) {
        toast.error(
          `Please enter a quantity of at least 1 for "${invalidProduct.productName}"`,
        );
        return;
      }

      if (!selectedLocation.warehouse) {
        toast.error("Please select a warehouse");
        return;
      }

      if (!selectedLocation.zone) {
        toast.error("Please select a zone");
        return;
      }

      const payload = {
        warehouseId: selectedLocation.warehouse._id,
        zoneName: selectedLocation.zone.zoneName,
        rackName: selectedLocation.rack?.rackName || "",
        shelfName: selectedLocation.shelf?.shelfName || "",
        binName:
          typeof selectedLocation.bin === "string"
            ? selectedLocation.bin
            : selectedLocation.bin?.binName || "",
        products: selectedProducts.map((product) => ({
          productId: product._id,
          quantity: Number(product.assignQty),
          unit: product.unit || "Pcs",
        })),
      };

      await api.post("/api/warehouse/assign-product", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Products Assigned Successfully");

      setSelectedProducts([]);
      setSelectedValues({ warehouse: "", zone: "", rack: "", shelf: "", bin: "" });
      setSelectedLocation({ warehouse: null, zone: null, rack: null, shelf: null, bin: null });
      setZones([]);
      setRacks([]);
      setShelves([]);
      setBins([]);
      setSearch("");
      setShowSearchProducts(false);
      setVisibleFields(["warehouse"]);
      await fetchProducts([]);
      await fetchAllocatedMap();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDropdownSelect = (field, item) => {
    setDropdowns((prev) => ({ ...prev, [field]: false }));

    if (field === "warehouse") {
      const baseSv = { warehouse: item.warehouseName, zone: "", rack: "", shelf: "", bin: "" };
      const baseSl = { warehouse: item, zone: null, rack: null, shelf: null, bin: null };
      drillDown(baseSv, baseSl, item);
      return;
    }

    if (field === "zone") {
      const sv = { ...selectedValues, zone: item.zoneName, rack: "", shelf: "", bin: "" };
      const sl = { ...selectedLocation, zone: item, rack: null, shelf: null, bin: null };
      drillDown(sv, sl, selectedLocation.warehouse);
      return;
    }

    if (field === "rack") {
      const sv = { ...selectedValues, rack: item.rackName, shelf: "", bin: "" };
      const sl = { ...selectedLocation, rack: item, shelf: null, bin: null };
      drillDown(sv, sl, selectedLocation.warehouse);
      return;
    }

    if (field === "shelf") {
      const sv = { ...selectedValues, shelf: item.shelfName, bin: "" };
      const sl = { ...selectedLocation, shelf: item, bin: null };
      drillDown(sv, sl, selectedLocation.warehouse);
      return;
    }

    if (field === "bin") {
      setSelectedValues((prev) => ({ ...prev, bin: item.binName }));
      setSelectedLocation((prev) => ({ ...prev, bin: item }));
    }
  };

  return (
    <div className="p-4" style={{ height: "100vh" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Link
            to={location.state?.from || "/dashboard"}
            style={{
              width: 32,
              height: 32,
              background: "white",
              borderRadius: 53,
              border: "1.07px solid #EAEAEA",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <FaArrowLeft style={{ color: "#A2A8B8" }} />
          </Link>
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            Assign Transfer Product to Location
          </h2>
        </div>

        <div
          style={{
            width: "100%",
            padding: "16px",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #EAEAEA",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            overflowX: "auto",
            overflowY: "auto",
            height: "calc(100vh - 155px)",
            position: "relative",
          }}
        >
          <form
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            <div style={{ borderBottom: "1px solid #EAEAEA" }}>
              <div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    marginBottom: "10px",
                    color: "#000000",
                  }}
                >
                  Product Details
                </h3>
              </div>

              {/* Search */}
              <div
                ref={searchRef}
                style={{ position: "relative", marginBottom: "10px" }}
              >
                <FiSearch
                  size={18}
                  color="#9CA3AF"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "14px",
                    transform: "translateY(-50%)",
                    zIndex: 1,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by name, barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => setShowSearchProducts(true)}
                  style={{
                    width: "100%",
                    border: "1px solid #EAEAEA",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    paddingLeft: "38px",
                    fontSize: "15px",
                    outline: "none",
                  }}
                />

                {showSearchProducts && (
                  <div
                    style={{
                      position: "absolute",
                      top: "48px",
                      left: 0,
                      width: "100%",
                      background: "#fff",
                      border: "1px solid #EAEAEA",
                      borderRadius: "12px",
                      padding: "12px",
                      zIndex: 1000,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      maxHeight: "320px",
                      overflowY: "auto",
                    }}
                  >
                    {products.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          border: "1px solid #EAEAEA",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <img
                            src={item.images?.[0]?.url || ProductDefaultImage}
                            alt="product"
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "6px",
                              objectFit: "cover",
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#111827",
                              }}
                            >
                              {item.productName}
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#727681",
                                marginTop: "2px",
                              }}
                            >
                              {item.itemBarcode}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const alreadyAdded = selectedProducts.some(
                              (p) => p._id === item._id,
                            );
                            if (alreadyAdded) {
                              setSelectedProducts((prev) =>
                                prev.filter((p) => p._id !== item._id),
                              );
                            } else {
                              setSelectedProducts((prev) => [
                                ...prev,
                                {
                                  ...item,
                                  assignQty: 0,
                                  unit: item.unit || "Pcs",
                                },
                              ]);
                            }
                          }}
                          style={{
                            background: selectedProducts.some(
                              (p) => p._id === item._id,
                            )
                              ? "#ffffff"
                              : "#1F7FFF",
                            color: selectedProducts.some(
                              (p) => p._id === item._id,
                            )
                              ? "#1F7FFF"
                              : "#fff",
                            border: "1px solid #1F7FFF",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "14px",
                            cursor: "pointer",
                          }}
                        >
                          {selectedProducts.some((p) => p._id === item._id)
                            ? "Added"
                            : "+ Add"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* TABLE */}
              <div
                style={{ overflowY: "auto", width: "100%", height: "330px" }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#F3F8FB", height: "54px" }}>
                      {[
                        "Sr No.",
                        "Product Name",
                        "Assigned Qty",
                        "Unit",
                        "Available Qty",
                        "Action",
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            textAlign: i === 5 ? "center" : "left",
                            padding: "12px 16px",
                            color: "#727681",
                            fontSize: 14,
                            fontWeight: 400,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6">
                          <div
                            style={{
                              height: "250px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              fontSize: "16px",
                              fontWeight: 500,
                              color: "#727681",
                            }}
                          >
                            No Product Selected
                          </div>
                        </td>
                      </tr>
                    ) : (
                      selectedProducts.map((item, index) => (
                        <tr
                          key={item._id}
                          style={{ borderBottom: "1px solid #EAEAEA" }}
                        >
                          {/* Sr No. */}
                          <td
                            style={{
                              padding: "12px 28px",
                              fontSize: 14,
                              color: "#0E101A",
                            }}
                          >
                            {index + 1}
                          </td>

                          {/* Product Name */}
                          <td style={{ padding: "12px 28px" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <img
                                src={
                                  item.images?.[0]?.url || ProductDefaultImage
                                }
                                alt="product"
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "6px",
                                  objectFit: "cover",
                                  border: "1px solid #F1F1F1",
                                }}
                              />
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#0E101A",
                                  fontWeight: 500,
                                }}
                              >
                                {item.productName}
                              </div>
                            </div>
                          </td>

                          {/* Assigned Qty */}
                          <td style={{ padding: "12px 28px" }}>
                            <input
                              type="number"
                              max={item.availableQuantity || 0}
                              value={item.assignQty}
                              onChange={(e) => {
                                const dbProduct = products.find(
                                  (p) => p._id === item._id,
                                );
                                const totalStock = Number(
                                  dbProduct?.stockQuantity || 0,
                                );
                                const totalAllocated =
                                  allocatedMap[item._id?.toString()] || 0;
                                const maxQty = totalStock - totalAllocated;

                                const raw = e.target.value;
                                if (raw === "" || raw === "0") {
                                  const updated = [...selectedProducts];
                                  updated[index].assignQty = "";
                                  setSelectedProducts(updated);
                                  return;
                                }

                                let value = Number(raw);
                                if (value > maxQty) {
                                  toast.error(
                                    `Only ${maxQty} quantity available`,
                                  );
                                  value = maxQty;
                                }
                                const updated = [...selectedProducts];
                                updated[index].assignQty = value;
                                setSelectedProducts(updated);
                              }}
                              style={{
                                width: "120px",
                                height: "40px",
                                border: "1px solid #D1D5DB",
                                borderRadius: "8px",
                                padding: "0 12px",
                                fontSize: "14px",
                                outline: "none",
                              }}
                            />
                          </td>

                          {/* Unit */}
                          <td
                            style={{
                              padding: "12px 28px",
                              fontSize: "14px",
                              color: "#0E101A",
                            }}
                          >
                            {item.unit || "Pcs"}
                          </td>

                          {/* Available Qty */}
                          <td style={{ padding: "12px 28px" }}>
                            <div
                              style={{
                                width: "140px",
                                height: "40px",
                                border: "1px solid #D1D5DB",
                                borderRadius: "8px",
                                padding: "0 12px",
                                display: "flex",
                                alignItems: "center",
                                background: "#fff",
                              }}
                            >
                              <span>
                                {(() => {
                                  const dbProduct = products.find(
                                    (p) => p._id === item._id,
                                  );
                                  const totalStock = Number(
                                    dbProduct?.stockQuantity || 0,
                                  );
                                  const totalAllocated =
                                    allocatedMap[item._id?.toString()] || 0;
                                  return (
                                    totalStock -
                                    totalAllocated -
                                    Number(item.assignQty || 0)
                                  );
                                })()}
                              </span>
                            </div>
                          </td>

                          {/* Action */}
                          <td
                            style={{
                              padding: "12px 28px",
                              textAlign: "center",
                            }}
                          >
                            <FiTrash2
                              size={18}
                              color="#FF4D4F"
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                setSelectedProducts((prev) =>
                                  prev.filter((p) => p._id !== item._id),
                                )
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Location Section */}
            <div>
              <span
                style={{
                  margin: 0,
                  color: "#000000",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                Assign to Location
              </span>

              <div
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  marginTop: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "20px",
                    width: "100%",
                  }}
                >
                  {visibleFields.map((field) => (
                    <div key={field} style={{ minWidth: "200px", flex: "1" }}>
                      <label
                        style={{
                          fontSize: "12px",
                          color: "#727681",
                          marginBottom: "6px",
                          display: "block",
                          textTransform: "capitalize",
                        }}
                      >
                        {field}
                      </label>
                      <div
                        ref={dropdownRefs[field]}
                        style={{
                          width: "100%",
                          height: "40px",
                          padding: "0 12px",
                          background: "#fff",
                          borderRadius: "8px",
                          border: "1px solid #EAEAEA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          position: "relative",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          onClick={() =>
                            setDropdowns((prev) => ({
                              ...prev,
                              [field]: !prev[field],
                            }))
                          }
                          style={{
                            width: "100%",
                            fontSize: "14px",
                            color: selectedValues[field]
                              ? "#0E101A"
                              : "#727681",
                          }}
                        >
                          {selectedValues[field] || `Select ${field}`}
                        </div>
                        <div
                          onClick={() =>
                            setDropdowns((prev) => ({
                              ...prev,
                              [field]: !prev[field],
                            }))
                          }
                        >
                          {dropdowns[field] ? (
                            <IoIosArrowUp />
                          ) : (
                            <IoIosArrowDown />
                          )}
                        </div>

                        {dropdowns[field] && (
                          <div
                            style={{
                              position: "absolute",
                              top: "44px",
                              left: 0,
                              right: 0,
                              background: "#fff",
                              border: "1px solid #EAEAEA",
                              borderRadius: "8px",
                              overflow: "hidden",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                              zIndex: 1000,
                              maxHeight: "220px",
                              overflowY: "auto",
                            }}
                          >
                            {dropdownOptions[field].length === 0 ? (
                              <div
                                style={{
                                  padding: "10px 14px",
                                  fontSize: "14px",
                                  color: "#727681",
                                }}
                              >
                                No options available
                              </div>
                            ) : (
                              dropdownOptions[field].map((item, index) => (
                                <div
                                  key={index}
                                  onClick={() =>
                                    handleDropdownSelect(field, item)
                                  }
                                  className="button-hover"
                                  style={{
                                    padding: "10px 14px",
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    borderBottom:
                                      index !==
                                      dropdownOptions[field].length - 1
                                        ? "1px solid #F3F4F6"
                                        : "none",
                                  }}
                                >
                                  {field === "warehouse"
                                    ? item.warehouseName
                                    : field === "zone"
                                      ? item.zoneName
                                      : field === "rack"
                                        ? item.rackName
                                        : field === "shelf"
                                          ? item.shelfName
                                          : field === "bin"
                                            ? item.binName
                                            : ""}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedValues({
                  warehouse: "",
                  zone: "",
                  rack: "",
                  shelf: "",
                  bin: "",
                });
                setSelectedLocation({
                  warehouse: null,
                  zone: null,
                  rack: null,
                  shelf: null,
                  bin: null,
                });
                setZones([]);
                setRacks([]);
                setShelves([]);
                setBins([]);
                setVisibleFields(["warehouse"]);
                setSelectedProducts([]);
              }}
              style={{
                background: "#ffffff",
                color: "#1F7FFF",
                border: "1px solid #1F7FFF",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAssignProduct}
              style={{
                background: "#1F7FFF",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "10px",
              }}
            >
              Assign Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryLocator;