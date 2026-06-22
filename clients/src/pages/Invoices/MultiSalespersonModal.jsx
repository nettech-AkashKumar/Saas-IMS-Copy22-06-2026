import React, { useState, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { FaBarcode } from "react-icons/fa";

const MultiSalespersonModal = ({
  isOpen,
  onClose,
  products,
  salesmenList,
  existingAssignments,
  assignTargets,
  brokersList = [],
  onSave,
}) => {
  const [items, setItems] = useState([]);
  const isInitialized = useRef(false);

  const getEligibleAssigneesForProduct = (productId) => {
    if (!assignTargets || assignTargets.length === 0) {
      return salesmenList.map(s => ({ ...s, _assignType: "salesman", _displayName: s.salesmanName }));
    }

    const matchingTargets = assignTargets.filter(target => {
      const hasItems = target.items && target.items.length > 0;
      if (!hasItems) return true;
      return target.items.some(itemId =>
        (itemId?._id || itemId)?.toString() === productId?.toString()
      );
    });

    if (matchingTargets.length === 0) return [];

    const assignees = [];
    const addedIds = new Set();

    matchingTargets.forEach(target => {
      if (target.selectedSalesman) {
        const salesmanId =
          (target.selectedSalesman?._id || target.selectedSalesman)?.toString();

        if (salesmanId && !addedIds.has(salesmanId)) {
          const salesman = salesmenList.find(
            (s) => s._id?.toString() === salesmanId
          );

          if (salesman) {
            // find broker containing this salesman
            const broker = brokersList?.find((b) =>
              b.assignSalesman?.some(
                (s) => (s._id || s)?.toString() === salesmanId
              )
            );

            assignees.push({
              ...salesman,
              _assignType: "salesman",
              _displayName: broker
                ? `${salesman.salesmanName} (${broker.brokerName})`
                : salesman.salesmanName,
            });

            addedIds.add(salesmanId);
          }
        }
      } else if (target.assignToType === "Broker" && target.assignToTarget) {
        const brokerId = target.assignToTarget?._id
          ? target.assignToTarget._id.toString()
          : target.assignToTarget?.toString();

        if (brokerId && !addedIds.has(brokerId)) {
          const broker = brokersList?.find(b => b._id?.toString() === brokerId);
          if (broker) {
            assignees.push({
              ...broker,
              _id: broker._id,
              _assignType: "broker",
              _displayName: broker.brokerName,
            });
            addedIds.add(brokerId);
          } else {
            assignees.push({
              _id: brokerId,
              _assignType: "broker",
              _displayName: target.assignedToName || "Broker",
            });
            addedIds.add(brokerId);
          }
        }
      }
    });
    return assignees;
  };

  useEffect(() => {
    if (isOpen && products && products.length > 0) {
      // ✅ Use correct field name
      const hasAssignments = items.some(item => item.broker_salesman_id);

      if (!isInitialized.current || !hasAssignments) {
        const mappedItems = products
          .filter(p => p.productId && p.productId !== "")
          .map(product => {
            const existing = existingAssignments?.find(a => a.productItemId === product.id);
            return {
              id: product.id,
              productId: product.productId,
              name: product.itemName || product.name,
              code: product.hsnCode || product.itemBarcode || "N/A",
              qty: product.qty || 1,
              broker_salesman_id: existing?.broker_salesman_id || "",
              broker_salesman_name: existing?.broker_salesman_name || "",
              assignType: existing?.assignType || "salesman",
            };
          });
        setItems(mappedItems);
        isInitialized.current = true;
      }
    }

    if (!isOpen) {
      isInitialized.current = false;
    }
  }, [isOpen, products, existingAssignments]);

  const handleSalesmanChange = (itemId, assigneeId) => {

    const selectedSalesman = salesmenList.find(s => s._id?.toString() === assigneeId);
    const selectedBroker = brokersList.find(b => b._id?.toString() === assigneeId);
    const assignType = selectedSalesman ? "salesman" : "broker";
    const displayName = selectedSalesman?.salesmanName || selectedBroker?.brokerName || "";

    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? {
            ...item,
            broker_salesman_id: assigneeId,
            broker_salesman_name: displayName,
            assignType,
          }
          : item
      )
    );
  };

  const handleSave = () => {
    const assignments = items.map(item => ({
      productItemId: item.id,
      productId: item.productId,
      itemName: item.name,
      qty: item.qty,
      broker_salesman_id: item.broker_salesman_id || null,
      broker_salesman_name: item.broker_salesman_name || "",
      assignType: item.assignType || "salesman",
    }));

    const unassigned = assignments.filter(a => !a.broker_salesman_id);
    // if (unassigned.length > 0) {
    //   if (window.confirm(`${unassigned.length} product(s) have no salesman/broker assigned. Continue anyway?`)) {
    //     onSave(assignments);
    //     onClose();
    //   }
    // } else {
    onSave(assignments);
    onClose();
    // }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999999,
        fontFamily: "Inter, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "900px",
          maxWidth: "90%",
          maxHeight: "80vh",
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          position: "relative",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 600, margin: 0, color: "#0E101A" }}>
            Multi Salesperson
          </h3>
          <IoClose size={24} style={{ cursor: "pointer", color: "#666" }} onClick={onClose} />
        </div>

        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 0.8fr 2fr",
            background: "#F5F6F8",
            padding: "12px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#555",
            marginBottom: "8px",
          }}
        >
          <div>Product Name & Code</div>
          <div style={{ textAlign: "center" }}>Quantity</div>
          <div>Select Salesman</div>
        </div>

        {/* Rows */}
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#999" }}>
            No products added yet. Please add products to the invoice first.
          </div>
        ) : (
          items.map((item) => {
            const eligibleAssignees = getEligibleAssigneesForProduct(item.productId);
            return (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 0.8fr 2fr",
                  alignItems: "center",
                  padding: "14px 20px",
                  borderBottom: "1px solid #ECECEC",
                  backgroundColor: "#fff",
                }}
              >
                {/* Product Info */}
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 500, color: "#222", marginBottom: "4px" }}>
                    {item.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#8A8A8A", fontSize: "12px" }}>
                    <FaBarcode size={12} />
                    <span>HSN: {item.code !== "N/A" ? item.code : "Not available"}</span>
                  </div>
                </div>

                {/* Qty */}
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#1F7FFF", textAlign: "center" }}>
                  {item.qty}
                </div>

                {/* Select Dropdown */}
                <div>
                  {eligibleAssignees.length === 0 ? (
                    <div style={{
                      height: "44px", border: "1px dashed #DADADA", borderRadius: "8px",
                      display: "flex", alignItems: "center", paddingLeft: "14px",
                      fontSize: "13px", color: "#aaa", background: "#FAFAFA"
                    }}>
                      No salesman/broker assigned to this product
                    </div>
                  ) : (
                    <>
                      <select
                        value={item.broker_salesman_id}
                        onChange={(e) => handleSalesmanChange(item.id, e.target.value)}
                        style={{
                          width: "100%", height: "44px",
                          borderRadius: "8px", padding: "0 14px", fontSize: "14px",
                          outline: "none",
                          border: `1px solid ${item.broker_salesman_id ? "#1F7FFF" : "#DADADA"}`,
                          color: "#222", cursor: "pointer",
                          background: item.broker_salesman_id ? "#F0F7FF" : "#fff",
                        }}
                      >
                        <option value="">Select Salesman</option>
                        {eligibleAssignees.map((assignee) => (
                          <option key={assignee._id} value={assignee._id}>
                            {assignee._assignType === "broker" ? "🏢 " : "👤 "}
                            {assignee._displayName}
                          </option>
                        ))}
                      </select>
                      {item.broker_salesman_id && (
                        <div style={{ fontSize: "11px", color: "#28a745", marginTop: "4px" }}>
                          ✓ Assigned to: <span style={{ color: "#000000ff", marginLeft: "6px" }}>{item.broker_salesman_name}</span>
                          {item.assignType === "broker" ? (
                            <span style={{ color: "#1F7FFF", marginLeft: "6px" }}>(Broker)</span>
                          ) : (
                            <span style={{ color: "#b319a6ff", marginLeft: "6px" }}>(Salesman)</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Summary */}
        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            background: "#F8F9FA",
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "13px", color: "#666" }}>Total Products: <strong>{items.length}</strong></span>
            <span style={{ marginLeft: "20px", fontSize: "13px", color: "#666" }}>
              Assigned: <strong>{items.filter(i => i.broker_salesman_id).length}</strong>
            </span>
            <span style={{ marginLeft: "20px", fontSize: "13px", color: "#666" }}>
              Unassigned: <strong>{items.filter(i => !i.broker_salesman_id).length}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #ECECEC",
          }}
        >
          <button
            onClick={onClose}
            style={{ padding: "10px 20px", background: "#fff", border: "1px solid #DADADA", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{ padding: "10px 28px", background: "#1F7FFF", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
          >
            Save Assignments
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiSalespersonModal;