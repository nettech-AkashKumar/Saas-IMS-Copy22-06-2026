import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { RxCross2, RxDashboard } from "react-icons/rx";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../../styles/Responsive.css";
import { VscArrowSmallRight, VscArrowSmallLeft } from "react-icons/vsc";
import { RiDeleteBin6Line, RiStackLine } from "react-icons/ri";
import { Check } from "lucide-react";
import api from "../../../pages/config/axiosInstance";

function AddZones({
  closeModal,
  warehouseId: initialWarehouseId,
  editZone = null,
  fetchWarehouses,
}) {
  const [active, setActive] = useState(false);
  const [stepper, setstepper] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [racks, setRacks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId || "");

  const selectedWarehouse = warehouses.find(
    (warehouse) => warehouse._id === warehouseId,
  );

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await api.get("/api/warehouse/active");

      setWarehouses(response.data.data || []);
    } catch (error) {
      console.log(error);
    }
  };

  const [zoneData, setZoneData] = useState({
    zoneCode: "",
    zoneName: "",
    type: "",
    capacity: "",
    notes: "",
  });

  useEffect(() => {
    if (editZone) {
      setZoneData({
        zoneCode: editZone.zoneCode || "",
        zoneName: editZone.zoneName || "",
        type: editZone.type || "",
        capacity: editZone.capacity || "",
        notes: editZone.notes || "",
      });

      setRacks(
        (editZone.racks || []).map((rack) => ({
          id: rack._id || Date.now() + Math.random(),

          code: rack.rackCode || "",

          name: rack.rackName || "",

          active: rack.active || false,

          shelves: (rack.shelves || []).map((shelf) => ({
            id: shelf._id || Date.now() + Math.random(),

            name: shelf.shelfName || "",

            active: shelf.active || false,

            bins: shelf.bins || [],
          })),
        })),
      );
    }
  }, [editZone]);

const handleSaveZone = async () => {
  try {
    // Default to 1 rack → 1 shelf → 1 bin if user added nothing
    const racksToSave =
  racks.length > 0
    ? racks.map((rack) => ({
        ...rack,
        shelves:
          rack.shelves.length > 0
            ? rack.shelves.map((shelf) => ({
                ...shelf,
                bins:
                  shelf.bins.length > 0
                    ? shelf.bins
                    : [{ binName: "BIN-1", products: [] }],
              }))
            : [
                {
                  id: "default-shelf",
                  name: rack.name
                    ? `${rack.name}-Shelf-1`
                    : "Default Shelf",
                  active: true,
                  bins: [{ binName: "BIN-1", products: [] }],
                },
              ],
      }))
    : [
        {
          id: "default",
          code: "R-01",
          name: "Default Rack",
          active: true,
          shelves: [
            {
              id: "default-shelf",
              name: "Default Shelf",
              active: true,
              bins: [{ binName: "BIN-1", products: [] }],
            },
          ],
        },
      ];
      
    const payload = {
      zones: [
        {
          zoneCode: zoneData.zoneCode,
          zoneName: zoneData.zoneName,
          type: zoneData.type,
          capacity: zoneData.capacity,
          notes: zoneData.notes,
          racks: racksToSave.map((rack) => ({
            rackCode: rack.code,
            rackName: rack.name,
            active: rack.active,
            shelves: rack.shelves.map((shelf) => ({
              shelfName: shelf.name,
              active: shelf.active,
              bins: shelf.bins,
            })),
          })),
        },
      ],
    };

    const warehouseResponse = await api.get(`/api/warehouse/${warehouseId}`);
    const warehouseData = warehouseResponse.data.warehouse;
    let updatedZones = [...(warehouseData.zones || [])];

    if (editZone) {
      updatedZones = updatedZones.map((zone) =>
        zone._id === editZone._id
          ? {
              ...zone,
              zoneCode: zoneData.zoneCode,
              zoneName: zoneData.zoneName,
              type: zoneData.type,
              capacity: zoneData.capacity,
              notes: zoneData.notes,
              racks: racksToSave.map((rack) => ({
                rackCode: rack.code,
                rackName: rack.name,
                active: rack.active,
                shelves: rack.shelves.map((shelf) => ({
                  shelfName: shelf.name,
                  active: shelf.active,
                  bins: shelf.bins,
                })),
              })),
            }
          : zone,
      );
    } else {
      updatedZones.push(payload.zones[0]);
    }

    await api.patch(`/api/warehouse/${warehouseId}`, { zones: updatedZones });

    toast.success("Zone saved successfully");
    if (fetchWarehouses) await fetchWarehouses();
    closeModal();
  } catch (error) {
    console.log(error);
  }
};

  const handleGenerateZoneCode = () => {
    setZoneData((prev) => ({
      ...prev,
      zoneCode: `ZN-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    }));
  };

  const nextStep = () => {
    // STEP 1 VALIDATION

    if (currentStep === 1) {
      if (!zoneData.zoneName.trim()) {
        toast.error("Zone Name is required");
        return;
      }

      if (!warehouseId) {
        toast.error("Please select warehouse");
        return;
      }
    }

    // MOVE STEP BY STEP

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Add rack logic
  const handleAddRack = () => {
    setRacks([
      ...racks,
      {
        id: Date.now(),

        code: "",

        name: "",

        active: false,

        shelves: [],
      },
    ]);
  };

  // delete rack
  const handleDeleteRack = (id) => {
    setRacks(racks.filter((rack) => rack.id !== id));
  };

  // toggle active
  const handleToggleRack = (id) => {
    setRacks(
      racks.map((rack) =>
        rack.id === id ? { ...rack, active: !rack.active } : rack,
      ),
    );
  };

  // Add shelves logic
  const handleAddShelf = (rackId) => {
    setRacks(
      racks.map((rack) =>
        rack.id === rackId
          ? {
              ...rack,

              shelves: [
                ...rack.shelves,

                {
                  id: Date.now(),

                  name: "",

                  active: false,

                  bins: [],
                },
              ],
            }
          : rack,
      ),
    );
  };

  const handleDeleteShelf = (rackId, shelfId) => {
    setRacks(
      racks.map((rack) =>
        rack.id === rackId
          ? {
              ...rack,

              shelves: rack.shelves.filter((shelf) => shelf.id !== shelfId),
            }
          : rack,
      ),
    );
  };

  const handleToggleShelf = (rackId, shelfId) => {
    setRacks(
      racks.map((rack) =>
        rack.id === rackId
          ? {
              ...rack,

              shelves: rack.shelves.map((shelf) =>
                shelf.id === shelfId
                  ? {
                      ...shelf,

                      active: !shelf.active,
                    }
                  : shelf,
              ),
            }
          : rack,
      ),
    );
  };

  const handleBinCountChange = (rackId, shelfId, count) => {
    setRacks(
      racks.map((rack) =>
        rack.id === rackId
          ? {
              ...rack,

              shelves: rack.shelves.map((shelf) =>
                shelf.id === shelfId
                  ? {
                      ...shelf,

                      bins: Array.from(
                        {
                          length: Number(count) || 0,
                        },

                        (_, i) => ({
                          binName: `BIN-${i + 1}`,
                          products: [],
                        }),
                      ),
                    }
                  : shelf,
              ),
            }
          : rack,
      ),
    );
  };

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
        overflow: "auto",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          maxWidth: "1124px",
          width: "100%",
          padding: "30px 40px",
          borderRadius: "8px",
          overflow: "auto",
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between">
          {/* Header */}

          <div className="d-flex flex-column">
            <h5
              className="modal-title"
              style={{
                color: "#0E101A",
                fontWeight: 600,
                fontSize: "18px",
                fontFamily: '"Inter", sans-serif',
                lineHeight: "120%",
              }}
            >
              {/* {isView
                ? "View Assign Target"
                : editData?._id
                  ? "Edit Assign Target"
                  : "Assign New Target"} */}
              Set up zone
            </h5>
            <p
              style={{ color: "#727681", fontSize: "16px", fontWeight: "400" }}
            >
              Configure zone, sections, shelves and compartments in one flow.
            </p>
          </div>

          {/* close button */}
          <div
            className="modal-header"
            style={{
              borderBottom: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "end",
              borderRadius: "50%",
              //   padding: "5px 5px",
            }}
          >
            <button
              style={{
                color: "#727681",
                fontSize: "10px",
                fontWeight: 800,
                border: "2px solid #727681",
                borderRadius: "50%",
                backgroundColor: "transparent",
                width: "30px",
                height: "30px",
                cursor: "pointer",
              }}
              type="button"
              onClick={closeModal}
            >
              <RxCross2
                style={{
                  color: "#727681",
                  fontSize: "15px",
                  fontWeight: 900,
                }}
              />
            </button>
          </div>
        </div>

        {/* stepper section */}
        <div className="d-flex justify-content-between gap-4">
          {/* Step 1 */}
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                backgroundColor:
                  currentStep > 1
                    ? "#0E6ECA"
                    : currentStep === 1
                      ? "#fff"
                      : "#F3F4F6",

                color: currentStep === 1 ? "#0E6ECA" : "#99A1AF",
                borderRadius: "50px",
                height: "32px",
                width: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "500",
                border:
                  currentStep === 1
                    ? "2px solid #0E6ECA"
                    : "2px solid transparent",
                transition: "0.3s ease",
              }}
            >
              {currentStep > 1 ? (
                <Check size={16} strokeWidth={3} color="#FFFFFF" />
              ) : (
                "1"
              )}
            </span>

            <span
              style={{
                fontSize: "14px",
                fontWeight: currentStep === 1 ? "600" : "400",
                color: currentStep >= 1 ? "#0E101A" : "#99A1AF",
              }}
            >
              Zone Details
            </span>

            <span
              style={{
                backgroundColor: currentStep > 1 ? "#0E6ECA" : "#F3F4F6",
                height: "4px",
                width: "100px",
                borderRadius: "10px",
              }}
            ></span>
          </div>

          {/* Step 2 */}
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                backgroundColor:
                  currentStep > 2
                    ? "#0E6ECA"
                    : currentStep === 2
                      ? "#fff"
                      : "#F3F4F6",

                color: currentStep === 2 ? "#0E6ECA" : "#99A1AF",
                borderRadius: "50px",
                height: "32px",
                width: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "500",
                border:
                  currentStep === 2
                    ? "2px solid #0E6ECA"
                    : "2px solid transparent",
                transition: "0.3s ease",
              }}
            >
              {currentStep > 2 ? (
                <Check size={16} strokeWidth={3} color="#FFFFFF" />
              ) : (
                "2"
              )}
            </span>

            <span
              style={{
                fontSize: "14px",
                fontWeight: currentStep === 2 ? "600" : "400",
                color: currentStep >= 2 ? "#0E101A" : "#99A1AF",
              }}
            >
              Rack
            </span>

            <span
              style={{
                backgroundColor: currentStep > 2 ? "#0E6ECA" : "#F3F4F6",
                height: "4px",
                width: "100px",
                borderRadius: "10px",
              }}
            ></span>
          </div>

          {/* Step 3 */}
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                backgroundColor:
                  currentStep > 3
                    ? "#0E6ECA"
                    : currentStep === 3
                      ? "#fff"
                      : "#F3F4F6",

                color: currentStep === 3 ? "#0E6ECA" : "#99A1AF",
                borderRadius: "50px",
                height: "32px",
                width: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "500",
                border:
                  currentStep === 3
                    ? "2px solid #0E6ECA"
                    : "2px solid transparent",
                transition: "0.3s ease",
              }}
            >
              {currentStep > 3 ? (
                <Check size={16} strokeWidth={3} color="#FFFFFF" />
              ) : (
                "3"
              )}
            </span>

            <span
              style={{
                fontSize: "14px",
                fontWeight: currentStep === 3 ? "600" : "400",
                color: currentStep >= 3 ? "#0E101A" : "#99A1AF",
              }}
            >
              Shelves
            </span>

            <span
              style={{
                backgroundColor: currentStep > 3 ? "#0E6ECA" : "#F3F4F6",
                height: "4px",
                width: "100px",
                borderRadius: "10px",
              }}
            ></span>
          </div>

          {/* Step 4 */}
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                backgroundColor:
                  currentStep > 4
                    ? "#0E6ECA"
                    : currentStep === 4
                      ? "#fff"
                      : "#F3F4F6",

                color: currentStep === 4 ? "#0E6ECA" : "#99A1AF",
                borderRadius: "50px",
                height: "32px",
                width: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "500",
                border:
                  currentStep === 4
                    ? "2px solid #0E6ECA"
                    : "2px solid transparent",
                transition: "0.3s ease",
              }}
            >
              {currentStep > 4 ? (
                <Check size={16} strokeWidth={3} color="#FFFFFF" />
              ) : (
                "4"
              )}
            </span>

            <span
              style={{
                fontSize: "14px",
                fontWeight: currentStep === 4 ? "600" : "400",
                color: currentStep >= 4 ? "#0E101A" : "#99A1AF",
              }}
            >
              Bins
            </span>

            <span
              style={{
                backgroundColor: currentStep > 4 ? "#0E6ECA" : "#F3F4F6",
                height: "4px",
                width: "100px",
                borderRadius: "10px",
              }}
            ></span>
          </div>

          {/* Step 5 */}
          <div className="d-flex align-items-center gap-2">
            <span
              style={{
                backgroundColor:
                  currentStep > 5
                    ? "#0E6ECA"
                    : currentStep === 5
                      ? "#fff"
                      : "#F3F4F6",

                color: currentStep === 5 ? "#0E6ECA" : "#99A1AF",
                borderRadius: "50px",
                height: "32px",
                width: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "500",
                border:
                  currentStep === 5
                    ? "2px solid #0E6ECA"
                    : "2px solid transparent",
                transition: "0.3s ease",
              }}
            >
              {currentStep > 5 ? (
                <Check size={16} strokeWidth={3} color="#FFFFFF" />
              ) : (
                "5"
              )}
            </span>

            <span
              style={{
                fontSize: "14px",
                fontWeight: currentStep === 5 ? "600" : "400",
                color: currentStep >= 5 ? "#0E101A" : "#99A1AF",
              }}
            >
              Review
            </span>
          </div>
        </div>

        <hr style={{ backgroundColor: "#E6EAF0", height: "1px", margin: "0" }}/>

        <form action="">
          {/* zone details step-1 */}
          {currentStep === 1 && (
            <div>
              {/* warehouse */}
              <div
                className="d-flex flex-column gap-1"
                style={{ paddingBottom: "20px" }}
              >
                <label
                  htmlFor=""
                  style={{
                    color: "#727681",
                    fontSize: "12px",
                    fontWeight: "400",
                  }}
                >
                  Warehouse
                </label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  style={{
                    border: "1px solid #EAEAEA",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    color: "#0E101A",
                  }}
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              {/* code+Name+Type+Capacity+Notes */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "20px",
                }}
              >
                {/* Zone Code */}
                <div className="d-flex flex-column gap-1">
                  <label
                    htmlFor=""
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: "400",
                    }}
                  >
                    Zone Code
                  </label>

                  <div
                    style={{
                      border: "1px solid #EAEAEA",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      color: "#727681",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Zone Code"
                      value={zoneData.zoneCode}
                      readOnly
                      style={{
                        border: "none",
                        outline: "none",
                        width: "100%",
                        background: "transparent",
                        fontSize: "14px",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateZoneCode}
                      style={{
                        border: "none",
                        background: "#1F7FFF",
                        color: "#fff",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      Generate
                    </button>
                  </div>
                </div>
                {/*  Zone Name  */}
                <div className="d-flex flex-column gap-1">
                  <label
                    htmlFor=""
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: "400",
                    }}
                  >
                    Zone Name <span className="text-danger">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Enter ZoneName"
                    value={zoneData.zoneName}
                    onChange={(e) =>
                      setZoneData({
                        ...zoneData,
                        zoneName: e.target.value,
                      })
                    }
                    style={{
                      border: "1px solid #EAEAEA",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      color: "#0E101A",
                    }}
                  />
                </div>
                {/* Type */}
                <div className="d-flex flex-column gap-1">
                  <label
                    htmlFor=""
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: "400",
                    }}
                  >
                    Type
                  </label>
                  <select
                    value={zoneData.type}
                    onChange={(e) =>
                      setZoneData({
                        ...zoneData,
                        type: e.target.value,
                      })
                    }
                    style={{
                      border: "1px solid #EAEAEA",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      color: "#0E101A",
                    }}
                  >
                    <option value="" hidden>
                      Select Type
                    </option>
                    <option value="Ambient">Ambient</option>
                    <option value="Cold Chain">Cold Chain</option>
                    <option value="High Velocity">High Velocity</option>
                    <option value="Bulk">Bulk</option>
                    <option value="Hazmat">Hazmat</option>
                    <option value="Returns">Returns</option>
                  </select>
                </div>
                {/*  Capacity(m3)  */}
                <div className="d-flex flex-column gap-1">
                  <label
                    htmlFor=""
                    style={{
                      color: "#727681",
                      fontSize: "12px",
                      fontWeight: "400",
                    }}
                  >
                    Capacity (m3)
                  </label>

                  <input
                    type="number"
                    placeholder="Enter Capacity"
                    value={zoneData.capacity}
                    onChange={(e) =>
                      setZoneData({
                        ...zoneData,
                        capacity: e.target.value,
                      })
                    }
                    style={{
                      border: "1px solid #EAEAEA",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      color: "#0E101A",
                    }}
                  />
                </div>
              </div>

              {/*  Notes  */}
              <div
                className="d-flex flex-column gap-1"
                style={{ padding: "20px 0" }}
              >
                <label
                  htmlFor=""
                  style={{
                    color: "#727681",
                    fontSize: "12px",
                    fontWeight: "400",
                  }}
                >
                  Notes
                </label>

                <textarea
                  placeholder="Optional description"
                  value={zoneData.notes}
                  onChange={(e) =>
                    setZoneData({
                      ...zoneData,
                      notes: e.target.value,
                    })
                  }
                  style={{
                    border: "1px solid #EAEAEA",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    color: "#0E101A",
                    height: "100px",
                  }}
                ></textarea>
              </div>
            </div>
          )}

          {/* Rack step-2 */}
          {currentStep === 2 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "25px",
              }}
            >
              {/* Header - button */}
              <div className="d-flex justify-content-between">
                <div className="d-flex flex-column gap-1">
                  <h5
                    className="modal-title d-flex align-items-center gap-1"
                    style={{
                      color: "#0E101A",
                      fontWeight: 600,
                      fontSize: "18px",
                      fontFamily: '"Inter", sans-serif',
                      lineHeight: "120%",
                    }}
                  >
                    {/* {isView
                ? "View Assign Target"
                : editData?._id
                  ? "Edit Assign Target"
                  : "Assign New Target"} */}
                    <RxDashboard /> Racks
                  </h5>
                  <p
                    style={{
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: "400",
                    }}
                  >
                    Break the zone into logical racks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddRack}
                  style={{
                    backgroundColor: "#F8FAFD",
                    border: "1px solid #E0E5EB",
                    padding: "9px 8px",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "4000",
                    color: "#0E101A",
                  }}
                >
                  + Add Rack
                </button>
              </div>

              {/* No rack message */}
              {racks.length === 0 && (
                <div
                  style={{
                    border: "1px dashed #D0D5DD",
                    borderRadius: "10px",
                    padding: "35px",
                    textAlign: "center",
                    // background: "#FAFAFA",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#727681",
                      fontSize: "15px",
                      fontWeight: "500",
                    }}
                  >
                    No rack added yet
                  </p>

                  <span
                    style={{
                      color: "#99A1AF",
                      fontSize: "13px",
                    }}
                  >
                    Click on "Add Rack" to create racks
                  </span>
                </div>
              )}

              {/* Rack List */}
              {racks.map((rack) => (
                <div
                  key={rack.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "20px",
                    border: "1px solid #E6EAF0",
                    borderRadius: "8px",
                    padding: "15px",
                  }}
                >
                  {/* Code */}
                  <div
                    className="d-flex flex-column gap-1"
                    style={{ width: "100%" }}
                  >
                    <label
                      style={{
                        color: "#0E101A",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      Code
                    </label>

                    <input
                      type="text"
                      placeholder="WH-ZN-S1"
                      value={rack.code}
                      onChange={(e) => {
                        const updated = racks.map((item) =>
                          item.id === rack.id
                            ? { ...item, code: e.target.value }
                            : item,
                        );

                        setRacks(updated);
                      }}
                      style={{
                        border: "1px solid #EAEAEA",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        color: "#727681",
                      }}
                    />
                  </div>

                  {/* Name */}
                  <div
                    className="d-flex flex-column gap-1"
                    style={{ width: "100%" }}
                  >
                    <label
                      style={{
                        color: "#0E101A",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      Name
                    </label>

                    <input
                      type="text"
                      placeholder="Rack One"
                      value={rack.name}
                      onChange={(e) => {
                        const updated = racks.map((item) =>
                          item.id === rack.id
                            ? { ...item, name: e.target.value }
                            : item,
                        );

                        setRacks(updated);
                      }}
                      style={{
                        border: "1px solid #EAEAEA",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        color: "#727681",
                      }}
                    />
                  </div>

                  {/* toggle + delete */}
                  <div className="d-flex align-items-center gap-3">
                    {/* toggle */}
                    {/* <div
                      onClick={() => handleToggleRack(rack.id)}
                      style={{
                        width: "48px",
                        height: "24px",
                        borderRadius: "50px",
                        background: rack.active ? "#155A7A" : "#dfdede",
                        position: "relative",
                        cursor: "pointer",
                        transition: "0.3s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: "1px",
                          left: rack.active ? "24px" : "2px",
                          transition: "0.3s ease",
                        }}
                      />
                    </div> */}

                    {/* delete */}
                    {/* <span
                      onClick={() => handleDeleteRack(rack.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <RiDeleteBin6Line color="red" size={20} />
                    </span> */}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Shelves Step 3 */}
          {currentStep === 3 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "25px",
              }}
            >
              {/* Header */}
              <div className="d-flex flex-column gap-1">
                <h5
                  className="modal-title d-flex align-items-center gap-1"
                  style={{
                    color: "#0E101A",
                    fontWeight: 600,
                    fontSize: "18px",
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                  }}
                >
                  {/* {isView
                ? "View Assign Target"
                : editData?._id
                  ? "Edit Assign Target"
                  : "Assign New Target"} */}
                  <RiStackLine /> Shelves per rack
                </h5>
                <p
                  style={{
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: "400",
                  }}
                >
                  Add shelves manually or generate in bulk.
                </p>
              </div>

              <div
                style={{ border: "1px solid #E0E5EB", borderRadius: "12px" }}
              >
                {/* title + Button */}
                <div
                  style={{
                    backgroundColor: "#F5F8FC",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    height: "64px",
                  }}
                >
                  <label
                    htmlFor=""
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#0E101A",
                    }}
                  >
                    WH-ZN-S1 · rack 1
                  </label>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <button
                      style={{
                        backgroundColor: "#F8FAFD",
                        border: "1px solid #E0E5EB",
                        padding: "9px 12px",
                        color: "#727681",
                        fontWeight: "400",
                        borderRadius: "8px",
                      }}
                    >
                      Bulk Count
                    </button>
                  </div>
                </div>

                {/* No shelves message */}
                {racks.every((rack) => rack.shelves.length === 0) && (
                  <div
                    style={{
                      border: "1px dashed #D0D5DD",
                      borderRadius: "10px",
                      padding: "35px",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: "#727681",
                        fontSize: "15px",
                        fontWeight: "500",
                      }}
                    >
                      No shelves added yet
                    </p>

                    <span
                      style={{
                        color: "#99A1AF",
                        fontSize: "13px",
                      }}
                    >
                      Click on "+ Shelf" to create shelves
                    </span>
                  </div>
                )}

                {racks.map((rack) => (
                  <div
                    key={rack.id}
                    style={{
                      border: "1px solid #E0E5EB",

                      borderRadius: "12px",

                      marginBottom: "20px",
                    }}
                  >
                    {/* HEADER */}

                    <div
                      style={{
                        backgroundColor: "#F5F8FC",

                        borderTopLeftRadius: "12px",

                        borderTopRightRadius: "12px",

                        padding: "20px",

                        display: "flex",

                        justifyContent: "space-between",

                        alignItems: "center",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "16px",

                          fontWeight: "500",

                          color: "#0E101A",
                        }}
                      >
                        {rack.name}
                      </label>

                      <button
                        type="button"
                        onClick={() => handleAddShelf(rack.id)}
                        style={{
                          backgroundColor: "#F8FAFD",

                          border: "1px solid #E0E5EB",

                          padding: "9px 12px",

                          color: "#0E101A",

                          borderRadius: "8px",
                        }}
                      >
                        + Shelf
                      </button>
                    </div>

                    {/* SHELVES */}

                    {rack.shelves.map((shelf) => (
                      <div
                        key={shelf.id}
                        style={{
                          display: "flex",

                          alignItems: "center",

                          padding: "15px",

                          gap: "10px",
                        }}
                      >
                        {/* INPUT */}

                        <input
                          type="text"
                          placeholder="Shelf Name"
                          value={shelf.name}
                          onChange={(e) => {
                            setRacks(
                              racks.map((r) =>
                                r.id === rack.id
                                  ? {
                                      ...r,

                                      shelves: r.shelves.map((s) =>
                                        s.id === shelf.id
                                          ? {
                                              ...s,

                                              name: e.target.value,
                                            }
                                          : s,
                                      ),
                                    }
                                  : r,
                              ),
                            );
                          }}
                          style={{
                            border: "1px solid #EAEAEA",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            width: "100%",
                          }}
                        />

                        {/* TOGGLE */}
                        {/* <div
                          onClick={() => handleToggleShelf(rack.id, shelf.id)}
                          style={{
                            width: "48px",
                            height: "24px",
                            borderRadius: "50px",
                            background: shelf.active ? "#155A7A" : "#dfdede",
                            position: "relative",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              background: "#fff",
                              position: "absolute",
                              top: "1px",
                              left: shelf.active ? "24px" : "2px",
                            }}
                          />
                        </div> */}

                        {/* DELETE */}
                        {/* <span
                          onClick={() => handleDeleteShelf(rack.id, shelf.id)}
                          style={{
                            cursor: "pointer",
                          }}
                        >
                          <RiDeleteBin6Line color="red" size={20} />
                        </span> */}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bins step-4 */}
          {currentStep === 4 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "25px",
              }}
            >
              {/* Header */}
              <div className="d-flex flex-column gap-1">
                <h5
                  className="modal-title d-flex align-items-center gap-1"
                  style={{
                    color: "#0E101A",
                    fontWeight: 600,
                    fontSize: "18px",
                    fontFamily: '"Inter", sans-serif',
                    lineHeight: "120%",
                  }}
                >
                  {/* {isView
                ? "View Assign Target"
                : editData?._id
                  ? "Edit Assign Target"
                  : "Assign New Target"} */}
                  <RiStackLine /> Bins per shelf
                </h5>
                <p
                  style={{
                    color: "#727681",
                    fontSize: "14px",
                    fontWeight: "400",
                  }}
                >
                  Set how many bins each shelf has.
                </p>
              </div>

              <div
                style={{ border: "1px solid #E0E5EB", borderRadius: "12px" }}
              >
                {/* title */}
                <div
                  style={{
                    backgroundColor: "#F5F8FC",
                    borderTopLeftRadius: "12px",
                    borderTopRightRadius: "12px",
                    padding: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    height: "64px",
                  }}
                >
                  <label
                    htmlFor=""
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      color: "#0E101A",
                    }}
                  >
                    WH-ZN-S1 · rack 1
                  </label>
                </div>

                {racks.map((rack) => (
                  <div
                    key={rack.id}
                    style={{
                      border: "1px solid #E0E5EB",

                      borderRadius: "12px",

                      marginBottom: "20px",
                    }}
                  >
                    {/* HEADER */}

                    <div
                      style={{
                        backgroundColor: "#F5F8FC",

                        borderTopLeftRadius: "12px",

                        borderTopRightRadius: "12px",

                        padding: "20px",
                      }}
                    >
                      <label
                        style={{
                          fontSize: "16px",

                          fontWeight: "500",

                          color: "#0E101A",
                        }}
                      >
                        {rack.name}
                      </label>
                    </div>

                    {/* SHELVES */}

                    {rack.shelves.map((shelf) => (
                      <div
                        key={shelf.id}
                        style={{
                          display: "flex",

                          alignItems: "center",

                          padding: "15px",

                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",

                            padding: "12px",

                            border: "1px solid #E6EAF0",

                            borderRadius: "8px",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <span>{shelf.name}</span>

                            <div className="d-flex align-items-center gap-2">
                              <span>Count</span>

                              <input
                                type="number"
                                min="0"
                                value={shelf.bins.length}
                                onChange={(e) =>
                                  handleBinCountChange(
                                    rack.id,
                                    shelf.id,
                                    e.target.value,
                                  )
                                }
                                style={{
                                  border: "1px solid #E0E5EB",

                                  padding: "8px 12px",

                                  borderRadius: "6px",

                                  width: "90px",
                                }}
                              />
                            </div>
                          </div>

                          {/* BIN PREVIEW */}

                          <div
                            style={{
                              display: "flex",

                              flexWrap: "wrap",

                              gap: "8px",

                              marginTop: "12px",
                            }}
                          >
                            {shelf.bins.map((bin, index) => (
                              <div
                                key={index}
                                style={{
                                  background: "#E2E8F0",

                                  padding: "6px 10px",

                                  borderRadius: "6px",

                                  fontSize: "12px",
                                }}
                              >
                                {bin.binName}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              <div className="d-flex justify-content-between gap-5 w-full">
                <div
                  style={{
                    padding: "24px",
                    border: "1px solid #E0E5EB",
                    width: "100%",
                    borderRadius: "12px",
                  }}
                >
                  <div className="d-flex flex-column gap-2">
                    <span>Rack</span>
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#0E101A",
                      }}
                    >
                      {racks.length}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: "24px",
                    border: "1px solid #E0E5EB",
                    width: "100%",
                    borderRadius: "12px",
                  }}
                >
                  <div className="d-flex flex-column gap-2">
                    <span
                      style={{
                        fontWeight: "400",
                        fontSize: "14px",
                        color: "#727681",
                      }}
                    >
                      Shelf
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#0E101A",
                      }}
                    >
                      {racks.reduce(
                        (total, rack) => total + rack.shelves.length,
                        0,
                      )}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: "24px",
                    border: "1px solid #E0E5EB",
                    width: "100%",
                    borderRadius: "12px",
                  }}
                >
                  <div className="d-flex flex-column gap-2">
                    <span
                      style={{
                        fontWeight: "400",
                        fontSize: "14px",
                        color: "#727681",
                      }}
                    >
                      Bin
                    </span>
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontSize: "16px",
                        fontWeight: "600",
                        fontStyle: "semi-bold",
                      }}
                    >
                      {racks.reduce(
                        (total, rack) =>
                          total +
                          rack.shelves.reduce(
                            (shelfTotal, shelf) =>
                              shelfTotal + shelf.bins.length,
                            0,
                          ),
                        0,
                      )}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: "24px",
                    border: "1px solid #E0E5EB",
                    width: "100%",
                    borderRadius: "12px",
                  }}
                >
                  <div className="d-flex flex-column gap-2">
                    <span>Type</span>
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#0E101A",
                      }}
                    >
                      {zoneData.type || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className="mt-3 border rounded-3 p-4"
                style={{
                  borderColor: "#E0E5EB",
                }}
              >
                <div
                  className="d-flex gap-2 align-items-center"
                  style={{
                    fontSize: "14px",
                    color: "#0E101A",
                    fontWeight: "600",
                  }}
                >
                  <span>{zoneData.zoneName || "Zone Name"}</span>

                  <span>• {zoneData.zoneCode || "Zone Code"}</span>

                  <span>• {zoneData.type || "Zone Type"}</span>
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#727681",
                    fontWeight: "400",
                  }}
                >
                  <span>
                    In
                    {selectedWarehouse?.warehouseName || "Warehouse"}
                  </span>
                </div>

                {/* <div
                  className="d-flex gap-2 align-items-center"
                  style={{
                    fontSize: "14px",
                    color: "#727681",
                    fontWeight: "500",
                  }}
                >
                  <span>
                    <RxDashboard size={12} /> {rack.code} • {rack.name}
                  </span>
                </div>
                <div
                  className="d-flex gap-2 align-items-center ms-3"
                  style={{
                    fontSize: "14px",
                    color: "#727681",
                    fontWeight: "500",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, auto)",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      <RiStackLine size={12} /> SH1 • Shelf 1
                    </span>

                    <span>
                      <RiStackLine size={12} /> SH1 • Shelf 1
                    </span>
                  </div>
                </div>
                <div
                  className="d-flex gap-2 align-items-center"
                  style={{
                    fontSize: "14px",
                    color: "#727681",
                    fontWeight: "500",
                  }}
                >
                  <span>
                    <RxDashboard size={12} /> S1 • Rack 1
                  </span>
                </div>
                <div
                  className="d-flex gap-2 align-items-center ms-3"
                  style={{
                    fontSize: "14px",
                    color: "#727681",
                    fontWeight: "500",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, auto)",
                      gap: "12px",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      <RiStackLine size={12} /> SH1 • Shelf 1
                    </span>

                    <span>
                      <RiStackLine size={12} /> SH1 • Shelf 1
                    </span>
                  </div>
                </div> */}

                {racks.length === 0 ? (
                  <div
                    style={{
                      marginTop: "20px",
                      padding: "16px",
                      border: "1px dashed #D0D5DD",
                      borderRadius: "8px",
                      textAlign: "center",
                      color: "#727681",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    Zone created without racks, shelves or bins
                  </div>
                ) : (
                  racks.map((rack) => (
                    <div
                      key={rack.id}
                      style={{
                        marginTop: "14px",
                      }}
                    >
                      {/* RACK */}

                      <div
                        className="d-flex gap-2 align-items-center"
                        style={{
                          fontSize: "14px",
                          color: "#727681",
                          fontWeight: "500",
                        }}
                      >
                        <span>
                          <RxDashboard size={12} /> {rack.code} • {rack.name}
                        </span>
                      </div>

                      {/* SHELVES */}

                      <div
                        className="ms-4 mt-2"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {rack.shelves.map((shelf) => (
                          <div
                            key={shelf.id}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            {/* SHELF NAME */}

                            <span
                              style={{
                                fontSize: "14px",
                                color: "#727681",
                                fontWeight: "500",
                              }}
                            >
                              <RiStackLine size={12} /> {shelf.name}
                            </span>

                            {/* BINS */}

                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                                marginLeft: "18px",
                              }}
                            >
                              {shelf.bins.map((bin, index) => (
                                <span
                                  key={index}
                                  style={{
                                    background: "#F3F4F6",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    color: "#0E101A",
                                    fontWeight: "500",
                                  }}
                                >
                                  {bin.binName}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <hr
            style={{
              backgroundColor: "#E6EAF0",
              height: "1px",
              margin: "10px 0",
            }}
          />
          {/* Next+Prev-button */}
          <div className="d-flex justify-content-end gap-2">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset -1px -1px 4px 0px rgba(0, 0, 0, 0.25)",
                  border: "1px solid #1F7FFF",
                  backgroundColor: "white",
                  borderRadius: "8px",
                  padding: "8px",
                  height: "36px",
                  color: "#1F7FFF",
                }}
              >
                {" "}
                <VscArrowSmallLeft />
                Prev
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (currentStep === 5) {
                  handleSaveZone();
                } else {
                  nextStep();
                }
              }}
              style={{
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "inset -1px -1px 4px 0px rgba(0, 0, 0, 0.25)",
                backgroundColor: "#1F7FFF",
                borderRadius: "8px",
                padding: "8px",
                color: "white",
                border: "none",
                height: "36px",
              }}
            >
              {currentStep === 5 ? "Submit" : "Next"}

              {currentStep !== 5 && <VscArrowSmallRight />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddZones;
