import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance";

// ICONS
import { IoIosArrowDown, IoIosArrowUp } from "react-icons/io";

function QrCode() {
  const [warehouseDropdown, setWarehouseDropdown] = useState(false);
  const [zoneDropdown, setZoneDropdown] = useState(false);
  const [rackDropdown, setRackDropdown] = useState(false);
  const [binDropdown, setBinDropdown] = useState(false);

  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedRack, setSelectedRack] = useState("");
  const [selectedShelf, setSelectedShelf] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [zones, setZones] = useState([]);
  const [racks, setRacks] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [selectedBin, setSelectedBin] = useState("");
  const [bins, setBins] = useState([]);
  const [binItemDropdown, setBinItemDropdown] = useState(false);
  const [barcodeData, setBarcodeData] = useState([]);
  const [selectAllWarehouses, setSelectAllWarehouses] = useState(false);
  const [selectAllZones, setSelectAllZones] = useState(false);
  const [selectAllRacks, setSelectAllRacks] = useState(false);
  const [selectAllShelves, setSelectAllShelves] = useState(false);
  const [selectAllBins, setSelectAllBins] = useState(false);

  const warehouseRef = useRef(null);
  const zoneRef = useRef(null);
  const rackRef = useRef(null);
  const binRef = useRef(null);
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

      if (zoneRef.current && !zoneRef.current.contains(event.target)) {
        setZoneDropdown(false);
      }

      if (rackRef.current && !rackRef.current.contains(event.target)) {
        setRackDropdown(false);
      }

      if (binRef.current && !binRef.current.contains(event.target)) {
        setBinDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await api.get("/api/warehouse");
        setWarehouses(response.data.data || []);
      } catch (error) {
        console.log("Warehouse fetch error", error);
      }
    };

    fetchWarehouses();
  }, []);

  return (
    <div
      className="p-4"
      style={{
        overflowY: "auto",
        height: "90vh",
      }}
    >
      {/* Header */}
      <div
        className="d-flex justify-content-between align-items-center flex-wrap"
        style={{ marginBottom: "20px" }}
      >
        <div>
          <h3
            style={{
              fontSize: 22,
              color: "#0E101A",
              fontWeight: 500,
            }}
          >
            Print QR Code
          </h3>
        </div>
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
          minHeight: "150px",
        }}
      >
        {/* Filters */}
        <div
          style={{
            width: "100%",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          {/* Warehouse */}
          <div
            style={{
              flex: "1 1 240px",
              minWidth: "240px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
              style={{
                color: "#727681",
                fontSize: "12px",
                fontWeight: "400",
              }}
            >
              Warehouse
            </label>

            <div
              ref={warehouseRef}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                background: "white",
                borderRadius: "8px",
                border: "1px solid #EAEAEA",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                onClick={() => setWarehouseDropdown(!warehouseDropdown)}
                style={{ width: "100%" }}
              >
                {/* FIX: show "All Warehouses" when selectAllWarehouses is true */}
                <span style={{ fontSize: "14px" }}>
                  {selectAllWarehouses
                    ? "All Warehouses"
                    : selectedWarehouse
                    ? selectedWarehouse.warehouseName ||
                      selectedWarehouse.warehouseCode
                    : "Select Warehouse"}
                </span>
              </div>

              <div onClick={() => setWarehouseDropdown(!warehouseDropdown)}>
                {warehouseDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
              </div>

              {warehouseDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #E1E1E1",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {warehouses.map((warehouse, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedWarehouse(warehouse);
                        setZones(warehouse.zones || []);
                        setWarehouseDropdown(false);
                        // FIX: reset selectAll flag when a specific item is chosen
                        setSelectAllWarehouses(false);
                        setSelectAllZones(false);
                        setSelectAllRacks(false);
                        setSelectAllShelves(false);
                        setSelectAllBins(false);
                        // reset lower selections
                        setSelectedZone("");
                        setSelectedRack("");
                        setSelectedShelf("");
                        setSelectedBin("");
                      }}
                      className="button-hover"
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {warehouse.warehouseName || warehouse.warehouseCode}
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      setSelectAllWarehouses(true);
                      setSelectAllZones(false);
                      setSelectAllRacks(false);
                      setSelectAllShelves(false);
                      setSelectAllBins(false);
                      setSelectedWarehouse("");
                      setSelectedZone("");
                      setSelectedRack("");
                      setSelectedShelf("");
                      setSelectedBin("");
                      setWarehouseDropdown(false);
                    }}
                    className="button-hover"
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderTop: "1px solid #EAEAEA",
                      fontWeight: 600,
                      color: "#1F7FFF",
                    }}
                  >
                    Select All Warehouses
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Zone */}
          <div
            style={{
              flex: "1 1 240px",
              minWidth: "240px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
              style={{
                color: "#727681",
                fontSize: "12px",
              }}
            >
              Zone
            </label>

            <div
              ref={zoneRef}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                background: "white",
                borderRadius: "8px",
                border: "1px solid #EAEAEA",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                onClick={() => setZoneDropdown(!zoneDropdown)}
                style={{ width: "100%" }}
              >
                {/* FIX: show "All Zones" when selectAllZones is true */}
                <span style={{ fontSize: "14px" }}>
                  {selectAllZones
                    ? "All Zones"
                    : selectedZone
                    ? selectedZone.zoneName || selectedZone.zoneCode
                    : "Select Zone"}
                </span>
              </div>

              <div onClick={() => setZoneDropdown(!zoneDropdown)}>
                {zoneDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
              </div>

              {zoneDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #E1E1E1",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {zones.map((zone, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedZone(zone);
                        setRacks(zone.racks || []);
                        setZoneDropdown(false);
                        // FIX: reset selectAll flags when a specific item is chosen
                        setSelectAllZones(false);
                        setSelectAllRacks(false);
                        setSelectAllShelves(false);
                        setSelectAllBins(false);
                        setSelectedRack("");
                        setSelectedShelf("");
                        setSelectedBin("");
                      }}
                      className="button-hover"
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {zone.zoneName || zone.zoneCode}
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      setSelectAllZones(true);
                      setSelectAllRacks(false);
                      setSelectAllShelves(false);
                      setSelectAllBins(false);
                      setSelectedZone("");
                      setSelectedRack("");
                      setSelectedShelf("");
                      setSelectedBin("");
                      setZoneDropdown(false);
                    }}
                    className="button-hover"
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderTop: "1px solid #EAEAEA",
                      fontWeight: 600,
                      color: "#1F7FFF",
                    }}
                  >
                    Select All Zones
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Rack */}
          <div
            style={{
              flex: "1 1 240px",
              minWidth: "240px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
              style={{
                color: "#727681",
                fontSize: "12px",
              }}
            >
              Rack
            </label>

            <div
              ref={rackRef}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                background: "white",
                borderRadius: "8px",
                border: "1px solid #EAEAEA",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                onClick={() => setRackDropdown(!rackDropdown)}
                style={{ width: "100%" }}
              >
                {/* FIX: show "All Racks" when selectAllRacks is true */}
                <span style={{ fontSize: "14px" }}>
                  {selectAllRacks
                    ? "All Racks"
                    : selectedRack
                    ? selectedRack.rackName || selectedRack.rackCode
                    : "Select Rack"}
                </span>
              </div>

              <div onClick={() => setRackDropdown(!rackDropdown)}>
                {rackDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
              </div>

              {rackDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #E1E1E1",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {racks.map((rack, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedRack(rack);
                        setShelves(rack.shelves || []);
                        setRackDropdown(false);
                        // FIX: reset selectAll flags when a specific item is chosen
                        setSelectAllRacks(false);
                        setSelectAllShelves(false);
                        setSelectAllBins(false);
                        setSelectedShelf("");
                        setSelectedBin("");
                      }}
                      className="button-hover"
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {rack.rackName || rack.rackCode}
                    </div>
                  ))}
                  <div
                    onClick={() => {
                      setSelectAllRacks(true);
                      setSelectAllShelves(false);
                      setSelectAllBins(false);
                      setSelectedRack("");
                      setSelectedShelf("");
                      setSelectedBin("");
                      setRackDropdown(false);
                    }}
                    className="button-hover"
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderTop: "1px solid #EAEAEA",
                      fontWeight: 600,
                      color: "#1F7FFF",
                    }}
                  >
                    Select All Racks
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Shelf */}
          <div
            style={{
              flex: "1 1 240px",
              minWidth: "240px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
              style={{
                color: "#727681",
                fontSize: "12px",
              }}
            >
              Shelf
            </label>

            <div
              ref={binRef}
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                background: "white",
                borderRadius: "8px",
                border: "1px solid #EAEAEA",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                onClick={() => setBinDropdown(!binDropdown)}
                style={{ width: "100%" }}
              >
                {/* FIX: show "All Shelves" when selectAllShelves is true */}
                <span style={{ fontSize: "14px" }}>
                  {selectAllShelves
                    ? "All Shelves"
                    : selectedShelf
                    ? selectedShelf.shelfName || selectedShelf.shelfCode
                    : "Select Shelf"}
                </span>
              </div>

              <div onClick={() => setBinDropdown(!binDropdown)}>
                {binDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
              </div>

              {binDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #E1E1E1",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {shelves.map((shelf, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedShelf(shelf);
                        setBins(shelf.bins || []);
                        setBinDropdown(false);
                        // FIX: reset selectAll flags when a specific item is chosen
                        setSelectAllShelves(false);
                        setSelectAllBins(false);
                        setSelectedBin("");
                      }}
                      className="button-hover"
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      {shelf.shelfName || shelf.shelfCode}
                    </div>
                  ))}

                  <div
                    onClick={() => {
                      setSelectAllShelves(true);
                      setSelectAllBins(false);
                      setSelectedShelf("");
                      setSelectedBin("");
                      setBinDropdown(false);
                    }}
                    className="button-hover"
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderTop: "1px solid #EAEAEA",
                      fontWeight: 600,
                      color: "#1F7FFF",
                    }}
                  >
                    Select All Shelves
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bin */}
          <div
            style={{
              flex: "1 1 240px",
              minWidth: "240px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <label
              style={{
                color: "#727681",
                fontSize: "12px",
              }}
            >
              Bin
            </label>

            <div
              style={{
                width: "100%",
                height: "40px",
                padding: "0 12px",
                background: "white",
                borderRadius: "8px",
                border: "1px solid #EAEAEA",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                onClick={() => setBinItemDropdown(!binItemDropdown)}
                style={{ width: "100%" }}
              >
                {/* FIX: show "All Bins" when selectAllBins is true */}
                <span style={{ fontSize: "14px" }}>
                  {selectAllBins
                    ? "All Bins"
                    : selectedBin
                    ? selectedBin.binName
                    : "Select Bin"}
                </span>
              </div>

              <div onClick={() => setBinItemDropdown(!binItemDropdown)}>
                {binItemDropdown ? <IoIosArrowUp /> : <IoIosArrowDown />}
              </div>

              {binItemDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #E1E1E1",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    zIndex: 1000,
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {bins.map((bin, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        setSelectedBin(bin);
                        setBinItemDropdown(false);
                        // FIX: reset selectAll flag when a specific item is chosen
                        setSelectAllBins(false);
                      }}
                      className="button-hover"
                      style={{
                        padding: "10px 14px",
                        cursor: "pointer",
                      }}
                    >
                      {bin.binName}
                    </div>
                  ))}

                  <div
                    onClick={() => {
                      setSelectAllBins(true);
                      setSelectedBin("");
                      setBinItemDropdown(false);
                    }}
                    className="button-hover"
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderTop: "1px solid #EAEAEA",
                      fontWeight: 600,
                      color: "#1F7FFF",
                    }}
                  >
                    Select All Bins
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "12px",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            style={{
              minWidth: "140px",
              height: "40px",
            }}
            disabled={isSearching}
            onClick={() => {
              let data = [];

              // =========================
              // SELECT ALL CONDITIONS
              // =========================

              if (selectAllWarehouses) {
                data = warehouses.map((warehouse) => ({
                  type: "Warehouse",
                  name: warehouse.warehouseName || warehouse.warehouseCode,
                  barcodeValue:
                    warehouse.warehouseQRCode || warehouse.warehouseCode,
                }));
              } else if (selectAllZones) {
                data = zones.map((zone) => ({
                  type: "Zone",
                  name: zone.zoneName || zone.zoneCode,
                  barcodeValue: zone.zoneQRCode || zone.zoneCode,
                }));
              } else if (selectAllRacks) {
                data = racks.map((rack) => ({
                  type: "Rack",
                  name: rack.rackName || rack.rackCode,
                  barcodeValue: rack.rackQRCode || rack.rackCode,
                }));
              } else if (selectAllShelves) {
                data = shelves.map((shelf) => ({
                  type: "Shelf",
                  name: shelf.shelfName || shelf.shelfCode,
                  barcodeValue: shelf.shelfQRCode || shelf.shelfCode,
                }));
              } else if (selectAllBins) {
                data = bins.map((bin) => ({
                  type: "Bin",
                  name: bin.binName,
                  barcodeValue: bin.binQRCode || bin.binName,
                }));
              }

              // =========================
              // SINGLE SELECTION LOGIC
              // =========================
              else {
                if (!selectedWarehouse) {
                  toast.warning("Please select a warehouse");
                  return;
                }

                // Warehouse Only
                if (
                  selectedWarehouse &&
                  !selectedZone &&
                  !selectedRack &&
                  !selectedShelf &&
                  !selectedBin
                ) {
                  data.push({
                    type: "Warehouse",
                    name:
                      selectedWarehouse.warehouseName ||
                      selectedWarehouse.warehouseCode,
                    barcodeValue: selectedWarehouse.warehouseCode,
                  });
                }

                // Zone Only
                else if (
                  selectedWarehouse &&
                  selectedZone &&
                  !selectedRack &&
                  !selectedShelf &&
                  !selectedBin
                ) {
                  data.push({
                    type: "Zone",
                    name: selectedZone.zoneName || selectedZone.zoneCode,
                    barcodeValue:
                      selectedZone.zoneQRCode || selectedZone.zoneCode,
                  });
                }

                // Rack Only
                else if (
                  selectedWarehouse &&
                  selectedZone &&
                  selectedRack &&
                  !selectedShelf &&
                  !selectedBin
                ) {
                  data.push({
                    type: "Rack",
                    name: selectedRack.rackName || selectedRack.rackCode,
                    barcodeValue:
                      selectedRack.rackQRCode || selectedRack.rackCode,
                  });
                }

                // Shelf
                else if (
                  selectedWarehouse &&
                  selectedZone &&
                  selectedRack &&
                  selectedShelf &&
                  !selectedBin
                ) {
                  data.push({
                    type: "Shelf",
                    name: selectedShelf.shelfName || selectedShelf.shelfCode,
                    barcodeValue:
                      selectedShelf.shelfQRCode || selectedShelf.shelfCode,
                  });
                }

                // Bin
                else if (
                  selectedWarehouse &&
                  selectedZone &&
                  selectedRack &&
                  selectedShelf &&
                  selectedBin
                ) {
                  data.push({
                    type: "Bin",
                    name: selectedBin.binName,
                    barcodeValue: selectedBin.binQRCode || selectedBin.binName,
                  });
                }
              }

              navigate("/add-qr-code", {
                state: {
                  from: location.pathname,
                  barcodeData: data,
                },
              });
            }}
          >
            {isSearching ? (
              <>
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i>
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QrCode;