import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  QrCode,
  Edit,
  Trash2,
  Warehouse,
  Grid2X2,
  Layers3,
  Package,
} from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import QRCode from "qrcode";
import AddZones from "./AddZones";
import api from "../../../pages/config/axiosInstance";
import "./warehouse.css";
import ProductDefaultImage from '../../../assets/images/product-default.png'
import DeleteModal from "../../ConfirmDelete.jsx";
import { toast } from "react-toastify";
import { hasPermission } from "../../../utils/permission/hasPermission.jsx";
import { useAuth } from "../../auth/AuthContext";

function Zones() {
     const { user } = useAuth();
  const location = useLocation();
  const { id: routeWarehouseId } = useParams();
  const [showAddzones, setshowAddzones] = useState(false);
  const [editZoneData, setEditZoneData] = useState(null);

  const [expandedZones, setExpandedZones] = useState({});
  const [expandedRacks, setExpandedRacks] = useState({});
  const [expandedShelves, setExpandedShelves] = useState({});

  const [qrcodePopup, setQrCodePopup] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);

  const [warehouses, setWarehouses] = useState([]);
  const [warehouseData, setWarehouseData] = useState({ name: "", warehouseCode: "", zones: [], _id: null });
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [selectedView, setSelectedView] = useState({ type: "warehouse", data: null });
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [warehouseError, setWarehouseError] = useState(null);

  // Products state
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const queryWarehouseId = new URLSearchParams(location.search).get("warehouseId");
  const queryZoneId = new URLSearchParams(location.search).get("zoneId");
  const resolvedWarehouseId = location?.state?._id || routeWarehouseId || queryWarehouseId;

  const toggleZone = (id) => setExpandedZones((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleRack = (id) => setExpandedRacks((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleShelf = (id) => setExpandedShelves((prev) => ({ ...prev, [id]: !prev[id] }));

  const openQrPopup = async (code) => {
    if (!code) return;
    try {
      const url = await QRCode.toDataURL(String(code), {
        width: 250,
        margin: 2,
        color: { dark: "#111827", light: "#FFFFFF" },
      });
      setQrImageUrl(url);
      setQrCodeData(code);
      setQrCodePopup(true);
    } catch (err) {
      console.log("QR generation error:", err);
    }
  };

  const normalizeWarehouse = (warehouse) => ({
    _id: warehouse._id,
    name: warehouse.warehouseName || warehouse.warehouseCode || "Warehouse",
    warehouseCode: warehouse.warehouseCode || "",
    status: warehouse.status || "Active",
    zones: (warehouse.zones || []).map((zone, zoneIndex) => ({
      _id: zone._id,
      id: (zone._id?.toString?.()) || zone.zoneCode || `zone-${zoneIndex + 1}`,
      name: zone.zoneName || zone.zoneCode || `Zone ${zoneIndex + 1}`,
      zoneName: zone.zoneName || "",
      zoneCode: zone.zoneCode || "",
      zoneQRCode: zone.zoneQRCode || "",
      type: zone.type || "",
      capacity: zone.capacity || "",
      notes: zone.notes || "",
      label: [zone.zoneName || zone.zoneCode, zone.type].filter(Boolean).join(" • "),
      sections: `${zone.racks?.length || 0} rack${zone.racks?.length === 1 ? "" : "s"}`,
      products: zone.products || [],
      racks: (zone.racks || []).map((rack, rackIndex) => ({
        _id: rack._id,
        id: (rack._id?.toString?.()) || rack.rackCode || `rack-${rackIndex + 1}`,
        name: rack.rackName || rack.rackCode || `Rack ${rackIndex + 1}`,
        rackName: rack.rackName || "",
        rackCode: rack.rackCode || "",
        rackQRCode: rack.rackQRCode || "",
        active: rack.active || false,
        products: rack.products || [],
        shelves: (rack.shelves || []).map((shelf, shelfIndex) => ({
          _id: shelf._id,
          id: (shelf._id?.toString?.()) || shelf.shelfCode || `shelf-${shelfIndex + 1}`,
          name: shelf.shelfName || shelf.shelfCode || `Shelf ${shelfIndex + 1}`,
          shelfName: shelf.shelfName || "",
          shelfQRCode: shelf.shelfQRCode || "",
          active: shelf.active || false,
          products: shelf.products || [],
          bins: (shelf.bins || []).map((bin) =>
            typeof bin === "string"
              ? { binName: bin, binQRCode: "", products: [], _id: null }
              : { ...bin, _id: bin._id || null, binQRCode: bin.binQRCode || "", products: bin.products || [] }
          ),
        })),
      })),
    })),
  });

  // Collect all product IDs + metadata from a warehouse for bulk fetch
  const collectProductEntries = (normalizedWarehouse) => {
    const entries = [];
    const pushEntry = (productId, meta) => {
      entries.push({ productId: productId.toString(), ...meta });
    };
    for (const zone of normalizedWarehouse.zones || []) {
      for (const p of zone.products || []) {
        pushEntry(p.productId, { warehouseId: normalizedWarehouse._id?.toString(), zoneId: zone.id, rackId: null, shelfId: null, binName: null, quantity: p.quantity, unit: p.unit });
      }
      for (const rack of zone.racks || []) {
        for (const p of rack.products || []) {
          pushEntry(p.productId, { warehouseId: normalizedWarehouse._id?.toString(), zoneId: zone.id, rackId: rack.id, shelfId: null, binName: null, quantity: p.quantity, unit: p.unit });
        }
        for (const shelf of rack.shelves || []) {
          for (const p of shelf.products || []) {
            pushEntry(p.productId, { warehouseId: normalizedWarehouse._id?.toString(), zoneId: zone.id, rackId: rack.id, shelfId: shelf.id, binName: null, quantity: p.quantity, unit: p.unit });
          }
          for (const bin of shelf.bins || []) {
            for (const p of bin.products || []) {
              pushEntry(p.productId, { warehouseId: normalizedWarehouse._id?.toString(), zoneId: zone.id, rackId: rack.id, shelfId: shelf.id, binName: bin.binName, quantity: p.quantity, unit: p.unit });
            }
          }
        }
      }
    }
    return entries;
  };

  const fetchProductDetails = async (entries) => {
    if (!entries.length) { setAllProducts([]); setFilteredProducts([]); return; }
    try {
      setLoadingProducts(true);
      const uniqueIds = [...new Set(entries.map((e) => e.productId))];
      const res = await api.get("/api/products", { params: { ids: uniqueIds.join(",") } });
      const productMap = {};
      for (const p of res.data.products || []) {
        productMap[p._id.toString()] = p;
      }
      const enriched = entries.map((entry) => {
        const dbProduct = productMap[entry.productId];
        return {
          ...entry,
          productName: dbProduct?.productName || "Unknown",
          itemBarcode: dbProduct?.itemBarcode || "-",
          image: dbProduct?.images?.[0]?.url || null,
        };
      });
      setAllProducts(enriched);
      setFilteredProducts(enriched);
    } catch (err) {
      console.log("fetchProductDetails error:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Filter products based on selectedView
  useEffect(() => {
    if (!allProducts.length) { setFilteredProducts([]); return; }
    const type = selectedView?.type;
    if (type === "warehouse" || !type) { setFilteredProducts(allProducts); return; }
    if (type === "zone") { setFilteredProducts(allProducts.filter((p) => p.zoneId === selectedView.data?.id)); return; }
    if (type === "rack") { setFilteredProducts(allProducts.filter((p) => p.rackId === selectedView.data?.id)); return; }
    if (type === "shelf") { setFilteredProducts(allProducts.filter((p) => p.shelfId === selectedView.data?.id)); return; }
    if (type === "bin") {
      const binName = selectedView.data?.binName;
      const shelfId = selectedView.shelf?.id;
      setFilteredProducts(allProducts.filter((p) => p.binName === binName && p.shelfId === shelfId));
      return;
    }
  }, [selectedView, allProducts]);

  const openWarehouseInSidebar = async (warehouse, selectedZoneId = null) => {
    const normalized = normalizeWarehouse(warehouse);
    setWarehouseData(normalized);
    setSelectedWarehouseId(String(normalized._id));
    setExpandedZones({});
    setExpandedRacks({});
    setExpandedShelves({});
    const entries = collectProductEntries(normalized);
    await fetchProductDetails(entries);
    if (selectedZoneId) {
      const selectedZone = normalized.zones.find(
        (zone) => String(zone._id) === String(selectedZoneId) || String(zone.id) === String(selectedZoneId)
      );
      if (selectedZone) {
        setSelectedView({ type: "zone", data: selectedZone });
        setExpandedZones((prev) => ({ ...prev, [selectedZone.id]: true }));
        return;
      }
    }
    setSelectedView({ type: "warehouse", data: normalized });
  };

  useEffect(() => {
    const loadWarehouse = async () => {
      setLoadingWarehouse(true);
      setWarehouseError(null);
      try {
        const { data } = await api.get("/api/warehouse/active");
        const activeWarehouses = data.data || [];
        setWarehouses(activeWarehouses);
        let responseWarehouse = null;
        if (resolvedWarehouseId) {
          responseWarehouse = activeWarehouses.find((w) => String(w._id) === String(resolvedWarehouseId));
          if (!responseWarehouse) {
            const { data: detailData } = await api.get(`/api/warehouse/${resolvedWarehouseId}`);
            responseWarehouse = detailData.warehouse;
          }
        }
        if (!responseWarehouse) responseWarehouse = activeWarehouses[0];
        if (!responseWarehouse) { setWarehouseError("No warehouse data available"); return; }
        await openWarehouseInSidebar(responseWarehouse, queryZoneId);
      } catch (error) {
        setWarehouseError(error?.response?.data?.message || error?.message || "Unable to load warehouse");
      } finally {
        setLoadingWarehouse(false);
      }
    };
    loadWarehouse();
  }, [resolvedWarehouseId]);

  const isViewActive = (type, id) => selectedView?.type === type && (selectedView?.data?.id === id || selectedView?.data?._id?.toString() === id);

  // ── DELETE HELPERS ──
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const refreshCurrentWarehouse = async (wId) => {
    try {
      const { data } = await api.get(`/api/warehouse/${wId}?includeInactive=true`);
      const listRes = await api.get("/api/warehouse/active");
      setWarehouses(listRes.data.data || []);
      await openWarehouseInSidebar(data.warehouse);
    } catch (err) {
      console.log("refreshCurrentWarehouse error:", err);
    }
  };

  const confirmDelete = async () => {
    try {
      const t = deleteTarget;
      const wId = location?.state?._id || warehouseData._id;

      if (t.type === "warehouse") {
        await api.delete(`/api/warehouse/${wId}`);
        toast.success("Warehouse deleted successfully");
        const { data } = await api.get("/api/warehouse/active");
        setWarehouses(data.data || []);
        if (data.data.length > 0) await openWarehouseInSidebar(data.data[0]);
        else { setWarehouseData({ name: "", warehouseCode: "", zones: [], _id: null }); setSelectedWarehouseId(null); }

      } else if (t.type === "zone") {
        await api.delete(`/api/warehouse/${wId}/zones/${t.zoneId}`);
        toast.success("Zone deleted successfully");
        await refreshCurrentWarehouse(wId);
        setSelectedView({ type: "warehouse", data: warehouseData });

      } else if (t.type === "rack") {
        await api.delete(`/api/warehouse/${wId}/zones/${t.zoneId}/racks/${t.rackId}`);
        toast.success("Rack deleted successfully");
        await refreshCurrentWarehouse(wId);
        setSelectedView({ type: "zone", data: selectedView.zone || null });

      } else if (t.type === "shelf") {
        await api.delete(`/api/warehouse/${wId}/zones/${t.zoneId}/racks/${t.rackId}/shelves/${t.shelfId}`);
        toast.success("Shelf deleted successfully");
        await refreshCurrentWarehouse(wId);
        setSelectedView({ type: "rack", data: selectedView.rack || null, zone: selectedView.zone || null });

      } else if (t.type === "bin") {
        await api.delete(`/api/warehouse/${wId}/zones/${t.zoneId}/racks/${t.rackId}/shelves/${t.shelfId}/bins/${t.binId}`);
        toast.success("Bin deleted successfully");
        await refreshCurrentWarehouse(wId);
        setSelectedView({ type: "shelf", data: selectedView.shelf || null, rack: selectedView.rack || null, zone: selectedView.zone || null });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Delete failed");
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  // ── REUSABLE DELETE TRIGGER ──
  const triggerDelete = (type, label, ids = {}) => {
    setDeleteTarget({ type, label, ...ids });
    setShowDeleteModal(true);
  };

  // Shared button styles
  const iconBtn = {
    border: "1px solid #D1D5DB",
    background: "#F9FAFB",
    borderRadius: "10px",
    padding: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "90vh" }}>
      {/* PAGE HEADER */}
      <div className="d-flex justify-content-between align-items-center flex-wrap" style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>Zones</h3>
        {warehouseError && <div style={{ color: "#DC2626" }}>{warehouseError}</div>}
        {loadingWarehouse && <div style={{ color: "#475569" }}>Loading warehouse zones...</div>}
        {hasPermission (user, "zones", "create") && (
        <div
          onClick={() => setshowAddzones(true)}
          className="button-hover"
          style={{ fontFamily: "Inter", borderRadius: "8px", padding: "5px 16px", border: "1px solid #1F7FFF", color: "#1F7FFF", backgroundColor: "white", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
        >
          <Warehouse size={16} /> Add Zones
        </div>
        )}
      </div>

      <div className="d-flex flex-wrap" style={{ gap: "10px" }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: window.innerWidth < 992 ? "100%" : "26%", minWidth: 0, background: "#fff", borderRadius: "16px", padding: "18px 16px", height: "calc(100vh - 170px)" }}>
          <h4 style={{ marginTop: 0, marginBottom: "22px", fontSize: "14px", letterSpacing: "1px", color: "#111827" }}>HIERARCHY</h4>
          <div style={{ marginBottom: "10px", fontSize: "12px", letterSpacing: "1px", color: "#6B7280", fontWeight: 600 }}>WAREHOUSES</div>

          {warehouses.length > 0 ? (
            <div style={{ marginBottom: "16px", height: "calc(100vh - 270px)", overflowY: "auto" }}>
              {warehouses.map((warehouse) => {
                const wId = warehouse._id?.toString?.() || warehouse.warehouseCode;
                const isActiveWarehouse = String(wId) === String(selectedWarehouseId);
                const normalizedWarehouse = normalizeWarehouse(warehouse);

                return (
                  <div key={wId}>
                    {/* WAREHOUSE ROW */}
                    <div
                      onClick={() => openWarehouseInSidebar(warehouse)}
                      style={{
                        background: isActiveWarehouse && selectedView.type === "warehouse" ? "#DBEAFE" : "#fff",
                        borderRadius: "10px", padding: "10px 12px", marginBottom: "6px", cursor: "pointer",
                        border: isActiveWarehouse && selectedView.type === "warehouse" ? "1px solid #2563EB" : "1px solid #E5E7EB",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563EB", fontWeight: "600" }}>
                        {isActiveWarehouse ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        <Warehouse size={15} />
                        <span style={{ fontSize: 14 }}>{warehouse.warehouseName || warehouse.warehouseCode || "Warehouse"}</span>
                      </div>
                    </div>

                    {/* ZONES */}
                    {isActiveWarehouse && normalizedWarehouse.zones.length > 0 && (
                      <div style={{ paddingLeft: "12px" }}>
                        {normalizedWarehouse.zones.map((zone) => {
                          const zoneActive = isViewActive("zone", zone.id);
                          return (
                            <div key={zone.id}>
                              <div
                                onClick={() => { toggleZone(zone.id); setSelectedView({ type: "zone", data: zone }); }}
                                style={{
                                  display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px",
                                  marginBottom: "2px", borderRadius: "8px", cursor: "pointer",
                                  background: zoneActive ? "#DBEAFE" : "transparent",
                                  border: zoneActive ? "1px solid #2563EB" : "1px solid transparent",
                                  fontWeight: zoneActive ? "600" : "500", color: "#111827",
                                }}
                              >
                                {expandedZones[zone.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <Package size={14} />
                                <span style={{ fontSize: 13 }}>{zone.name}</span>
                              </div>

                              {/* RACKS */}
                              {expandedZones[zone.id] && zone.racks.map((rack) => {
                                const rackActive = isViewActive("rack", rack.id);
                                return (
                                  <div key={rack.id}>
                                    <div
                                      onClick={() => { toggleRack(rack.id); setSelectedView({ type: "rack", data: rack, zone }); }}
                                      style={{
                                        display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px 7px 28px",
                                        marginBottom: "2px", borderRadius: "8px", cursor: "pointer",
                                        background: rackActive ? "#DBEAFE" : "transparent",
                                        border: rackActive ? "1px solid #2563EB" : "1px solid transparent",
                                        fontWeight: rackActive ? "600" : "400", color: "#111827",
                                      }}
                                    >
                                      {expandedRacks[rack.id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                      <Grid2X2 size={13} />
                                      <span style={{ fontSize: 13 }}>{rack.name}</span>
                                    </div>

                                    {/* SHELVES */}
                                    {expandedRacks[rack.id] && rack.shelves.map((shelf) => {
                                      const shelfActive = isViewActive("shelf", shelf.id);
                                      return (
                                        <div key={shelf.id}>
                                          <div
                                            onClick={() => { toggleShelf(shelf.id); setSelectedView({ type: "shelf", data: shelf, rack, zone }); }}
                                            style={{
                                              display: "flex", alignItems: "center", gap: "8px", padding: "7px 10px 7px 48px",
                                              marginBottom: "2px", borderRadius: "8px", cursor: "pointer",
                                              background: shelfActive ? "#DBEAFE" : "transparent",
                                              border: shelfActive ? "1px solid #2563EB" : "1px solid transparent",
                                              fontWeight: shelfActive ? "600" : "400", color: "#111827",
                                            }}
                                          >
                                            {expandedShelves[shelf.id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                            <Layers3 size={13} />
                                            <span style={{ fontSize: 13 }}>{shelf.name}</span>
                                          </div>

                                          {/* BINS */}
                                          {expandedShelves[shelf.id] && shelf.bins.map((bin, binIdx) => {
                                            const binActive = selectedView?.type === "bin" && selectedView?.data?.binName === bin.binName && selectedView?.shelf?.id === shelf.id;
                                            return (
                                              <div
                                                key={binIdx}
                                                onClick={() => setSelectedView({ type: "bin", data: bin, shelf, rack, zone })}
                                                style={{
                                                  display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px 6px 68px",
                                                  marginBottom: "2px", borderRadius: "8px", cursor: "pointer",
                                                  background: binActive ? "#DBEAFE" : "transparent",
                                                  border: binActive ? "1px solid #2563EB" : "1px solid transparent",
                                                  fontSize: "13px", fontWeight: binActive ? "600" : "400", color: "#111827",
                                                }}
                                              >
                                                <Package size={12} />
                                                {bin.binName}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "#6B7280", fontSize: 14 }}>No warehouses found.</div>
          )}
        </div>

        {/* ── RIGHT SECTION ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="warehouse-container">

            {/* ── WAREHOUSE HEADER CARD ── */}
            <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#111827" }}>
                    {warehouseData.name}
                  </h2>
                  <span style={{ background: "#DCFCE7", color: "#15803D", padding: "4px 12px", borderRadius: "20px", fontSize: "14px", fontWeight: "500" }}>✓ Active</span>
                </div>
                <p style={{ marginTop: "8px", color: "#6B7280", fontSize: "15px" }}>
                  {selectedView.type === "warehouse" && `${warehouseData.name} · ${warehouseData.zones?.length || 0} Zones`}
                  {selectedView.type === "zone" && `Selected Zone: ${selectedView.data?.name}`}
                  {selectedView.type === "rack" && `Selected Rack: ${selectedView.data?.name}`}
                  {selectedView.type === "shelf" && `Selected Shelf: ${selectedView.data?.name}`}
                  {selectedView.type === "bin" && `Selected Bin: ${selectedView.data?.binName}`}
                </p>
              </div>

              {/* Header action buttons — Edit + QR + Delete (warehouse only) */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => { setEditZoneData(selectedView.data); setshowAddzones(true); }}
                  style={{ ...iconBtn, padding: "10px 14px", gap: "8px" }}
                >
                  <Edit size={16} /> Edit
                </button>
                <button
                  onClick={() => openQrPopup(warehouseData.warehouseCode)}
                  style={iconBtn}
                >
                  <QrCode size={18} />
                </button>
                {/* Warehouse-level delete — only visible when no deeper item is selected */}
                {selectedView.type === "warehouse" && (
                  <button
                    onClick={() => triggerDelete("warehouse", warehouseData.name)}
                    style={iconBtn}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </button>
                )}
              </div>
            </div>

            {/* ── ZONE VIEW ── */}
            {selectedView?.type === "zone" && (
              <div className="zone-container">
                <div className="zone-header">
                  <div className="zone-info">
                    <h2>{selectedView.data.name}</h2>
                    <p className="section-count">{selectedView.data.sections}</p>
                  </div>
                  {/* Zone QR + Delete */}
                  <div className="zone-icons" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <div
                      onClick={() => openQrPopup(selectedView.data.zoneQRCode || selectedView.data.zoneCode)}
                      style={iconBtn}
                    >
                      <QrCode size={18} />
                    </div>
                    <button
                      onClick={() =>
                        triggerDelete("zone", selectedView.data.name, {
                          zoneId: selectedView.data._id || selectedView.data.zoneCode,  // ✅ fallback
                        })
                      }
                      style={iconBtn}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </button>
                  </div>
                </div>
                <div className="racks-container">
                  {selectedView.data.racks.map((rack) => (
                    <div
                      key={rack.id}
                      className="rack-wrapper"
                      onClick={() => setSelectedView({ type: "rack", data: rack, zone: selectedView.data })}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="side-shelf">Shelf</div>
                      <div className="rack">
                        <div className="rack-header">{rack.name}</div>
                        <div className="rack-grid">
                          {rack.shelves.map((shelf) => (
                            <div key={shelf.id} className="rack-row">
                              {shelf.bins.map((bin, idx) => (
                                <div key={idx} className="position">{bin.binName}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── RACK VIEW ── */}
            {selectedView?.type === "rack" && (
              <div style={{ background: "#fff", borderRadius: "14px", padding: "20px", border: "2px solid #5b7fa6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>{selectedView.data.name}</h3>
                    <p style={{ marginTop: "4px", color: "#6B7280" }}>{selectedView.data.shelves.length} Shelves</p>
                  </div>
                  {/* Rack QR + Delete */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => openQrPopup(selectedView.data.rackQRCode || selectedView.data.rackCode || selectedView.data.name)}
                      style={iconBtn}
                    >
                      <QrCode size={18} />
                    </button>
                    <button
                      onClick={() =>
                        triggerDelete("rack", selectedView.data.name, {
                          zoneId: selectedView.zone?._id || selectedView.zone?.zoneCode,   // ✅ fallback
                          rackId: selectedView.data._id || selectedView.data.rackCode,     // ✅ fallback
                        })
                      }
                      style={iconBtn}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {selectedView.data.shelves.map((shelf) => (
                    <div
                      key={shelf.id}
                      onClick={() => setSelectedView({ type: "shelf", data: shelf, rack: selectedView.data, zone: selectedView.zone })}
                      style={{ background: "#E5E7EB", borderRadius: "10px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "15px", fontWeight: "600", color: "#111827" }}>{shelf.name}</span>
                        <span style={{ fontSize: "13px", color: "#6B7280" }}>{shelf.bins.length} Bins</span>
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); openQrPopup(shelf.shelfQRCode || shelf.shelfName); }} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                        <QrCode size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SHELF VIEW ── */}
            {selectedView?.type === "shelf" && (
              <div style={{ background: "#fff", borderRadius: "18px", padding: "24px", border: "2px solid #5b7fa6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "700", color: "#111827" }}>{selectedView.data.name}</h2>
                    <p style={{ marginTop: "6px", color: "#6B7280", fontSize: "14px" }}>{selectedView.zone?.name} • {selectedView.rack?.name}</p>
                  </div>
                  {/* Shelf QR + Delete */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => openQrPopup(selectedView.data.shelfQRCode || selectedView.data.shelfName)}
                      style={iconBtn}
                    >
                      <QrCode size={18} />
                    </button>
                    <button
                      onClick={() =>
                        triggerDelete("shelf", selectedView.data.name, {
                          zoneId: selectedView.zone?._id || selectedView.zone?.zoneCode,   // ✅ fallback
                          rackId: selectedView.rack?._id || selectedView.rack?.rackCode,   // ✅ fallback
                          shelfId: selectedView.data._id || selectedView.data.shelfName,   // ✅ fallback
                        })
                      }
                      style={iconBtn}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </button>
                  </div>
                </div>
                <div style={{ background: "#F8FAFC", borderRadius: "16px", padding: "24px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                    {selectedView.data.bins.map((bin, idx) => {
                      const binActive = selectedView?.type === "bin" && selectedView?.data?.binName === bin.binName;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedView({ type: "bin", data: bin, shelf: selectedView.data, rack: selectedView.rack, zone: selectedView.zone })}
                          style={{ background: binActive ? "#F8FAFC" : "#E5E7EB", border: binActive ? "2px solid #3B82F6" : "1px solid transparent", borderRadius: "10px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                        >
                          <div style={{ fontSize: "15px", fontWeight: "500", color: "#111827" }}>{bin.binName}</div>
                          <div onClick={(e) => { e.stopPropagation(); openQrPopup(bin.binQRCode || bin.binName); }} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <QrCode size={20} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── BIN VIEW ── */}
            {selectedView?.type === "bin" && (
              <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", border: "2px solid #5b7fa6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#111827" }}>{selectedView.data.binName}</h3>
                    <p style={{ marginTop: "4px", color: "#6B7280", fontSize: "14px" }}>
                      {selectedView.zone?.name} • {selectedView.rack?.name} • {selectedView.shelf?.name}
                    </p>
                  </div>
                  {/* Bin QR + Delete */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={() => openQrPopup(selectedView.data.binQRCode || selectedView.data.binName)}
                      style={iconBtn}
                    >
                      <QrCode size={18} />
                    </button>
                    <button
                      onClick={() => {
                        const matchedBin = selectedView.shelf?.bins?.find((b) => b.binName === selectedView.data?.binName);
                        triggerDelete("bin", selectedView.data.binName, {
                          zoneId: selectedView.zone?._id || selectedView.zone?.zoneCode,    // ✅ fallback
                          rackId: selectedView.rack?._id || selectedView.rack?.rackCode,    // ✅ fallback
                          shelfId: selectedView.shelf?._id || selectedView.shelf?.shelfName, // ✅ fallback
                          binId: matchedBin?._id || matchedBin?.binName,                    // ✅ fallback
                        });
                      }}
                      style={iconBtn}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
                  {selectedView.shelf?.bins.map((bin, idx) => {
                    const isActive = selectedView.data?.binName === bin.binName;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedView({ ...selectedView, data: bin })}
                        style={{ background: isActive ? "#EFF6FF" : "#E5E7EB", border: isActive ? "2px solid #3B82F6" : "1px solid transparent", borderRadius: "8px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                      >
                        <span style={{ fontSize: "15px", fontWeight: "500", color: "#111827" }}>{bin.binName}</span>
                        <div onClick={(e) => { e.stopPropagation(); openQrPopup(bin.binQRCode || bin.binName); }} style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                          <QrCode size={20} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── PRODUCT TABLE ── */}
          <div style={{ width: "100%", background: "#fff", borderRadius: "16px", padding: "16px", marginTop: "20px" }}>
            <div style={{ marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                Products
                {selectedView?.type === "zone" && ` in ${selectedView.data?.name}`}
                {selectedView?.type === "rack" && ` in ${selectedView.data?.name}`}
                {selectedView?.type === "shelf" && ` in ${selectedView.data?.name}`}
                {selectedView?.type === "bin" && ` in ${selectedView.data?.binName}`}
              </span>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>
                {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "400px", width: "100%", WebkitOverflowScrolling: "touch" }}>
              <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse" }}>
                <thead style={{ position: "sticky", top: 0, zIndex: 5, background: "#F3F8FB" }}>
                  <tr>
                    {["Product", "Item Code", "Location", "Available QTY"].map((heading, index) => (
                      <th key={index} style={{ padding: "14px 16px", textAlign: "left", color: "#727681", fontSize: "14px", fontWeight: "500", borderBottom: "1px solid #E5E7EB", whiteSpace: "nowrap" }}>
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingProducts ? (
                    <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: 14 }}>Loading products...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan="4" style={{ padding: "40px", textAlign: "center", color: "#6B7280", fontSize: 14 }}>No products assigned here</td></tr>
                  ) : (
                    filteredProducts.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <img
                              src={item.image || ProductDefaultImage}
                              alt={item.productName}
                              style={{ width: "42px", height: "42px", borderRadius: "10px", objectFit: "cover", border: "1px solid #E5E7EB", flexShrink: 0 }}
                              onError={(e) => { e.target.src = ProductDefaultImage; }}
                            />
                            <span style={{ fontSize: "14px", fontWeight: "500", color: "#111827" }}>{item.productName}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "14px", color: "#111827", whiteSpace: "nowrap" }}>{item.itemBarcode || "-"}</td>
                        <td style={{ padding: "14px 16px", fontSize: "13px", color: "#6B7280", whiteSpace: "nowrap" }}>
                          {item.binName || "Zone level"}
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "14px", color: "#111827", whiteSpace: "nowrap" }}>
                          {item.quantity} {item.unit || ""}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── QR CODE POPUP ── */}
      {qrcodePopup && (
        <div onClick={() => { setQrCodePopup(false); setQrImageUrl(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "300px", backgroundColor: "white", boxShadow: "10px 10px 40px rgba(0,0,0,0.15)", borderRadius: 16, padding: 24, border: "2px solid #E5E7EB", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {qrImageUrl ? (
              <img src={qrImageUrl} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 8 }} />
            ) : (
              <div style={{ width: 220, height: 220, background: "#F3F4F6", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#6B7280", fontSize: 14 }}>Generating...</div>
            )}
            <span style={{ fontSize: 12, color: "#6B7280", fontFamily: "monospace", textAlign: "center", wordBreak: "break-all", padding: "0 8px" }}>{qrCodeData}</span>
            <a href={qrImageUrl} download={`qr-${qrCodeData}.png`} style={{ background: "#1F7FFF", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, cursor: "pointer", textDecoration: "none", fontWeight: 500, width: "100%", textAlign: "center" }}>Download QR</a>
            <button onClick={() => { setQrCodePopup(false); setQrImageUrl(null); }} style={{ background: "transparent", border: "1px solid #E5E7EB", borderRadius: 8, padding: "8px 24px", fontSize: 14, cursor: "pointer", color: "#374151", width: "100%" }}>Close</button>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT ZONE MODAL ── */}
      {showAddzones && (
        <AddZones
          warehouseId={location?.state?._id || warehouseData._id}
          editZone={editZoneData}
          fetchWarehouses={async () => {
            try {
              const { data } = await api.get("/api/warehouse/active");
              setWarehouses(data.data || []);
              const updatedWarehouse = data.data.find((w) => String(w._id) === String(location?.state?._id || warehouseData._id));
              if (updatedWarehouse) await openWarehouseInSidebar(updatedWarehouse);
            } catch (error) {
              console.log(error);
            }
          }}
          closeModal={() => { setshowAddzones(false); setEditZoneData(null); }}
        />
      )}

      {/* ── DELETE CONFIRM MODAL ── */}
      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.label || "this item"}
      />
    </div>
  );
}

export default Zones;