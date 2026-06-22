import React, { useEffect, useRef, useState, useCallback } from "react";
import { FiSearch } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import Pagination from "../../../components/Pagination";
import api from "../../../pages/config/axiosInstance";
import ProductDefaultImage from "../../../assets/images/product-default.png";
import { QrCode, X, Camera, Flashlight } from "lucide-react";

// ─── QR Camera Modal ──────────────────────────────────────────────────────────
const QRScannerModal = ({ onClose, onScan }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const jsQRRef = useRef(null);
  const [status, setStatus] = useState("Initializing camera…");
  const [error, setError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Load jsQR dynamically
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js";
    script.async = true;
    script.onload = () => {
      jsQRRef.current = window.jsQR;
      startCamera();
    };
    script.onerror = () => setError("Failed to load QR library.");
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const startCamera = async () => {
    try {
      setStatus("Opening camera…");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Check torch support
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities?.() || {};
      if (caps.torch) setTorchSupported(true);

      setStatus("Scanning — point at a QR code");
      requestAnimationFrame(tick);
    } catch (err) {
      if (err.name === "NotAllowedError") {
        setError(
          "Camera permission denied. Please allow camera access and try again.",
        );
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Could not start camera: " + err.message);
      }
    }
  };

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !jsQRRef.current) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQRRef.current(
      imageData.data,
      imageData.width,
      imageData.height,
      {
        inversionAttempts: "dontInvert",
      },
    );

    if (code && !scanned) {
      setScanned(true);
      handleScanned(code.data);
      return;
    }

    animFrameRef.current = requestAnimationFrame(tick);
  }, [scanned]);

  const handleScanned = (data) => {
    setStatus("✅ QR Code scanned!");
    stopCamera();
    setTimeout(() => {
      onScan(data);
      onClose();
    }, 400);
  };

  const stopCamera = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    const newState = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: newState }] });
      setTorchOn(newState);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(480px, 95vw)",
          background: "#0E101A",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <QrCode size={20} color="#60A5FA" />
            <span
              style={{
                color: "#fff",
                fontWeight: 600,
                fontSize: 15,
                fontFamily: "Inter, sans-serif",
              }}
            >
              Scan QR Code
            </span>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Camera view */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4/3",
            background: "#000",
          }}
        >
          {error ? (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
                gap: 12,
              }}
            >
              <Camera size={40} color="#EF4444" />
              <p
                style={{
                  color: "#EF4444",
                  textAlign: "center",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                }}
              >
                {error}
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                playsInline
                muted
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              {/* Scan overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                }}
              >
                {/* Dark corners */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.35)",
                  }}
                />

                {/* Scan frame */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 200,
                    height: 200,
                  }}
                >
                  {/* Corner brackets */}
                  {[
                    {
                      top: 0,
                      left: 0,
                      borderTop: "3px solid #60A5FA",
                      borderLeft: "3px solid #60A5FA",
                      borderRadius: "8px 0 0 0",
                    },
                    {
                      top: 0,
                      right: 0,
                      borderTop: "3px solid #60A5FA",
                      borderRight: "3px solid #60A5FA",
                      borderRadius: "0 8px 0 0",
                    },
                    {
                      bottom: 0,
                      left: 0,
                      borderBottom: "3px solid #60A5FA",
                      borderLeft: "3px solid #60A5FA",
                      borderRadius: "0 0 0 8px",
                    },
                    {
                      bottom: 0,
                      right: 0,
                      borderBottom: "3px solid #60A5FA",
                      borderRight: "3px solid #60A5FA",
                      borderRadius: "0 0 8px 0",
                    },
                  ].map((style, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        width: 28,
                        height: 28,
                        ...style,
                      }}
                    />
                  ))}

                  {/* Scan line animation */}
                  <div
                    style={{
                      position: "absolute",
                      left: 6,
                      right: 6,
                      height: 2,
                      background:
                        "linear-gradient(90deg, transparent, #60A5FA, transparent)",
                      animation: "scanLine 2s linear infinite",
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#0E101A",
          }}
        >
          <p
            style={{
              color: scanned ? "#34D399" : "#9CA3AF",
              fontSize: 13,
              fontFamily: "Inter, sans-serif",
              margin: 0,
              transition: "color 0.3s",
            }}
          >
            {status}
          </p>
          {torchSupported && !error && (
            <button
              onClick={toggleTorch}
              title="Toggle flashlight"
              style={{
                background: torchOn ? "#60A5FA" : "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 8,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: torchOn ? "#0E101A" : "#fff",
                transition: "all 0.2s",
              }}
            >
              {/* Flashlight icon fallback if lucide doesn't have it */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6l-6 6" />
                <path d="M15 3l6 6-6.343 6.343A8 8 0 1 1 8.657 8.657L15 3z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Scan line keyframe — injected via style tag */}
      <style>{`
                @keyframes scanLine {
                    0% { top: 6px; opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: calc(100% - 8px); opacity: 0; }
                }
            `}</style>
    </div>
  );
};

const UpdateStockModal = ({ show, onClose, product, onUpdate }) => {
  const [quantity, setQuantity] = useState("");

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{
        backgroundColor: "rgba(0,0,0,0.27)",
        backdropFilter: "blur(1px)",
        zIndex: 1060,
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div
            className="modal-header"
            style={{
              borderBottom: "none",
            }}
          >
            <h4>Stock Out Product</h4>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "3px solid #EAEAEA",
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label
                style={{
                  fontFamily: "Inter",
                  fontSize: "12px",
                  color: "#6B7280",
                  fontWeight: "500",
                  fontStyle: "medium",
                }}
              >
                Product Name
              </label>
              <span
                style={{
                  display: "block",
                  color: "#1F2937",
                  fontSize: "14px",
                  fontWeight: "600",
                  fontFamily: "Inter",
                  fontStyle: "semi-bold",
                }}
              >
                {product?.product || "-"}
              </span>
            </div>

            <div className="mb-3">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <label
                    style={{
                      fontFamily: "Inter",
                      fontSize: "12px",
                      color: "#6B7280",
                      fontWeight: "500",
                      fontStyle: "medium",
                    }}
                  >
                    Location Code
                  </label>
                  <span
                    style={{
                      display: "block",
                      color: "#1F2937",
                      fontSize: "14px",
                      fontWeight: "600",
                      fontFamily: "Inter",
                      fontStyle: "semi-bold",
                    }}
                  >
                    {product?.locationCode || 0}
                  </span>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "Inter",
                      fontSize: "12px",
                      color: "#6B7280",
                      fontWeight: "500",
                      fontStyle: "medium",
                    }}
                  >
                    Current Quantity
                  </label>
                  <span
                    style={{
                      display: "block",
                      color: "#1F2937",
                      fontSize: "14px",
                      fontWeight: "600",
                      fontFamily: "Inter",
                      fontStyle: "semi-bold",
                    }}
                  >
                    {product?.allocatedQty || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">QTY</label>

              <input
                type="number"
                value={quantity}
                min="1"
                max={product?.allocatedQty || 0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  const maxQty = Number(product?.allocatedQty || 0);

                  if (value <= maxQty) {
                    setQuantity(e.target.value);
                  }
                }}
                style={{
                  width: "100%",
                  border: "1px solid #E5E7EB",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div className="modal-footer gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (!quantity) {
                  alert("Please enter quantity");
                  return;
                }

                if (Number(quantity) > Number(product?.allocatedQty || 0)) {
                  alert("Quantity exceeds available stock");
                  return;
                }

                onUpdate(product, quantity);
              }}
            >
              Update Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const QRCodeScan = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const warehouseRef = useRef(null);
  const [warehouseDropdown, setWarehouseDropdown] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [updateStock, setUpdateStock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // QR Scanner state
  const [showScanner, setShowScanner] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        warehouseRef.current &&
        !warehouseRef.current.contains(event.target)
      ) {
        setWarehouseDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchAllocatedProducts();
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await api.get("/api/warehouse/active");
      setWarehouses(res.data.data || []);
    } catch (error) {
      /* ignore */
    }
  };

  const fetchAllocatedProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/warehouse/product-allocation");
      setTransferData(res.data.data || []);
    } catch (error) {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  // Called when QR is successfully scanned
  const handleQRScanned = (scannedValue) => {
    setSearch(scannedValue);
    setCurrentPage(1);
  };

  // Filter by search and warehouse
  const filteredData = transferData.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      item.product?.toLowerCase().includes(q) ||
      item.sku?.toLowerCase().includes(q) ||
      item.locationCode?.toLowerCase().includes(q) ||
      item.warehouse?.toLowerCase().includes(q) ||
      item.zone?.toLowerCase().includes(q) ||
      item.rack?.toLowerCase().includes(q) ||
      item.shelf?.toLowerCase().includes(q) ||
      item.bins?.toLowerCase().includes(q);

    const matchesWarehouse =
      !selectedWarehouse || item.warehouse === selectedWarehouse;
    const matchesDate =
      !selectedDate ||
      (item.date &&
        new Date(item.date).toISOString().slice(0, 10) === selectedDate);

    return matchesSearch && matchesWarehouse && matchesDate;
  });

  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedWarehouse, selectedDate]);

  const handleUpdateStock = async (
  product,
  quantity
) => {
  try {
    await api.post("/api/warehouse/stock-out", {
      warehouseName: product.warehouse,
      zoneName: product.zone,
      rackName: product.rack,
      shelfName: product.shelf,
      binName: product.bins,
      productId: product.id,
      quantity: Number(quantity),
    });

    await fetchAllocatedProducts();

    setUpdateStock(false);
    setSelectedProduct(null);
  } catch (error) {
    console.log(error);
  }
};

  return (
    <div className="p-4" style={{ overflowY: "auto", height: "100vh" }}>
      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScannerModal
          onClose={() => setShowScanner(false)}
          onScan={handleQRScanned}
        />
      )}

      {updateStock && (
        <UpdateStockModal
          show={updateStock}
          product={selectedProduct}
          onUpdate={handleUpdateStock}
          onClose={() => {
            setUpdateStock(false);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ marginBottom: "20px" }}
      >
        <h3 style={{ fontSize: 22, color: "#0E101A", fontWeight: 500 }}>
          Scan QR Code
        </h3>
      </div>

      {/* Main Card */}
      <div
        style={{
          width: "100%",
          padding: 16,
          background: "white",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          fontFamily: "Inter, sans-serif",
          minHeight: "calc(100vh - 170px)",
        }}
      >
        {/* Filters */}
        <div
          style={{
            display: "flex",
            justifyContent: "end",
            gap: "12px",
            height: "40px",
            width: "100%",
            alignItems: "center",
          }}
        >
          {/* Search input */}
          <div
            style={{
              flex: 2,
              position: "relative",
              padding: "8px 16px 8px 36px",
              display: "flex",
              borderRadius: 8,
              alignItems: "center",
              background: "#FCFCFC",
              border: "1px solid #EAEAEA",
              gap: "5px",
            }}
          >
            <FiSearch
              className="fs-5"
              style={{ position: "absolute", left: 12, color: "#9CA3AF" }}
            />
            <input
              type="search"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                fontSize: 14,
                background: "#FCFCFC",
                color: "#0E101A",
              }}
              placeholder="Search by Product Name, location code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* QR Scan Button */}
          <button
            onClick={() => setShowScanner(true)}
            title="Scan QR Code"
            style={{
              border: "1px solid #D1D5DB",
              background: "#F9FAFB",
              borderRadius: "10px",
              padding: "2px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s, border-color 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#EFF6FF";
              e.currentTarget.style.borderColor = "#93C5FD";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#F9FAFB";
              e.currentTarget.style.borderColor = "#D1D5DB";
            }}
          >
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <QrCode size={20} color="#374151" />
            </div>
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowY: "auto", height: "calc(100vh - 320px)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
              <tr style={{ background: "#F3F8FB" }}>
                {[
                  "Product",
                  "Location Code",
                  "Allocated Qty",
                  "Movement Type",
                  "Action",
                ].map((label, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      color: "#727681",
                      fontSize: 14,
                      fontWeight: 400,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="text-center py-4"
                    style={{ color: "#727681", fontSize: 14 }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : !search.trim() ? (
                <tr>
                  <td colSpan="9">
                    <div
                      style={{
                        height: "300px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "16px",
                        color: "#727681",
                      }}
                    >
                      <QrCode size={46} color="#D1D5DB" />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 500 }}>
                          Search or scan a QR code to find products
                        </span>
                        <span style={{ fontSize: 13, color: "#9CA3AF" }}>
                          Use the{" "}
                          <QrCode
                            size={13}
                            style={{ verticalAlign: "middle" }}
                          />{" "}
                          button to open your camera
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9">
                    <div
                      style={{
                        height: "250px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "#727681",
                        fontSize: 16,
                        fontWeight: 500,
                      }}
                    >
                      No results match your search
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((transfer, index) => (
                  <tr
                    key={`${transfer.id}-${index}`}
                    style={{ borderBottom: "1px solid #EAEAEA" }}
                  >
                    {/* Product */}
                    <td style={{ padding: "7px 16px", minWidth: "240px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <img
                          src={transfer.image || ProductDefaultImage}
                          alt={transfer.product}
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "6px",
                            objectFit: "cover",
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            e.target.src = ProductDefaultImage;
                          }}
                        />
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#0E101A",
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "180px",
                          }}
                        >
                          {transfer.product || "-"}
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {transfer.locationCode || "-"}
                    </td>
                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#0E101A",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {transfer.allocatedQty || 0}
                    </td>

                    {/* Movement Type */}
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          background:
                            transfer.movementType === "Bin"
                              ? "#ECFDF3"
                              : transfer.movementType === "Shelf"
                                ? "#EFF6FF"
                                : transfer.movementType === "Rack"
                                  ? "#FFF7ED"
                                  : transfer.movementType === "Zone"
                                    ? "#F5F3FF"
                                    : "#F3F4F6",
                          color:
                            transfer.movementType === "Bin"
                              ? "#027A48"
                              : transfer.movementType === "Shelf"
                                ? "#1D4ED8"
                                : transfer.movementType === "Rack"
                                  ? "#C2410C"
                                  : transfer.movementType === "Zone"
                                    ? "#6D28D9"
                                    : "#374151",
                        }}
                      >
                        {transfer.movementType || "-"}
                      </span>
                    </td>

                    <td
                      style={{
                        padding: "12px 16px",
                        fontSize: 14,
                        color: "#2563EB",
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      <span
                        onClick={() => {
                          setSelectedProduct(transfer);
                          setUpdateStock(true);
                        }}
                      >
                        Stock Out
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="page-redirect-btn px-2">
          <Pagination
            currentPage={currentPage}
            total={search.trim() ? filteredData.length : 0}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default QRCodeScan;
