import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import DatePicker from "../../../../components/DatePicker";
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { IoChevronDownOutline } from "react-icons/io5";
import { RiDeleteBinLine } from "react-icons/ri";
import { PiCaretUpDownLight } from "react-icons/pi";

// for preview
import { IoIosCloseCircleOutline } from "react-icons/io";
import { format } from "date-fns";
import { toWords } from "number-to-words";
import CompanyLogo from "../../../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../../../assets/images/taxinvoice.png";
import Qrcode from "../../../../assets/images/qrcode.png";
import indialogo from "../../../../assets/images/india-logo.png";

const DebitNoteViewEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [debitNote, setDebitNote] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);
  // for preview
  const [viewInvoiceOptions, setViewInvoiceOptions] = useState(false);
  const modelRef = useRef(null);

  // Form state - EXACTLY SAME as creation page
  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    phone: "",
    invoiceId: "",
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    subtotal: 0,
    discount: 0,
    shippingCharges: 0,
    autoRoundOff: false,
    roundOff: 0,
    totalAmount: 0,
    fullyReceived: false,
    notes: "",
    reason: "defective_goods",
  });

  // Add this function near other handler functions
  const handleViewInvoice = (open) => setViewInvoiceOptions(open);

  // Fetch debit note details
  useEffect(() => {
    if (id) {
      fetchDebitNoteDetails();
    }
  }, [id]);

  // Fetch supplier invoices when supplier changes
  useEffect(() => {
    if (formData.supplierId && isEditMode) {
      fetchSupplierInvoices(formData.supplierId);
    }
  }, [formData.supplierId, isEditMode]);

  // Recalculate totals when selected items or other values change
  useEffect(() => {
    if (isEditMode) {
      calculateTotals();
    }
  }, [
    selectedItems,
    formData.shippingCharges,
    formData.autoRoundOff,
    isEditMode,
  ]);

  const fetchDebitNoteDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/supplier-debit-notes/${id}`);
      const data = response.data.debitNote;

      if (!data) {
        toast.error("Debit note not found");
        navigate("/debit-notes-list");
        return;
      }

      setDebitNote(data);

      // Set form data from fetched debit note
      setFormData({
        supplierId: data.supplierId?._id || data.supplierId || "",
        supplierName: data.supplierName || "",
        phone: data.phone || "",
        invoiceId: data.invoiceId?._id || data.invoiceId || "",
        invoiceNumber: data.supplierInvoiceNo || "",
        date: new Date(data.date).toISOString().split("T")[0],
        subtotal: data.subtotal || 0,
        discount: data.totalDiscount || 0,
        shippingCharges: data.additionalCharges || 0,
        autoRoundOff: Math.abs(data.roundOff || 0) > 0,
        roundOff: data.roundOff || 0,
        totalAmount: data.totalAmount || 0,
        fullyReceived: data.status === "settled",
        notes: data.notes || "",
        reason: data.reason || "defective_goods",
      });

      // Convert items to match create form structure
      const itemsFromDebitNote =
        data.items?.map((item, index) => ({
          id: index + 1,
          productId: item.productId?._id || item.productId,
          name: item.name || "Product",
          description: item.description || "",
          quantity: item.quantity || 1,
          originalQuantity: item.quantity || 1,
          returnQuantity: item.quantity || 1,
          unit: item.unit || "Pcs",
          unitPrice: item.unitPrice || 0,
          tax: `GST @ ${item.taxRate || 5}%`,
          taxRate: item.taxRate || 5,
          taxAmount: item.taxAmount || 0,
          discountPercent: item.discountPercent || 0,
          discountAmount: item.discountAmount || 0,
          amount: item.total || 0,
          isSelected: true,
        })) || [];

      // In view mode, all items are selected and shown in selected items
      setSelectedItems(itemsFromDebitNote);
      setAvailableItems([]); // No available items in view/edit of existing debit note
    } catch (error) {
      console.error("Failed to fetch debit note details:", error);
      // toast.error("Failed to load debit note details");
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load debit note details",
      );
      navigate("/debit-notes-list");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupplierInvoices = async (supplierId) => {
    try {
      if (!isEditMode) return;

      setLoadingInvoices(true);
      const response = await api.get(
        `/api/purchase-orders?supplierId=${supplierId}`,
      );

      let invoicesData = [];
      if (response.data && Array.isArray(response.data)) {
        invoicesData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        invoicesData = response.data.data;
      } else if (
        response.data?.purchaseOrders &&
        Array.isArray(response.data.purchaseOrders)
      ) {
        invoicesData = response.data.purchaseOrders;
      }

      const filteredInvoices = invoicesData.filter(
        (invoice) =>
          invoice.status !== "cancelled" && invoice.status !== "draft",
      );

      setSupplierInvoices(filteredInvoices);
    } catch (error) {
      console.error("Failed to load invoices:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load invoices"
      );
      setSupplierInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handle invoice selection (only in edit mode)
  const handleInvoiceSelect = async (invoice) => {
    if (!isEditMode) return;

    try {
      let invoiceDetails = invoice;

      if (typeof invoice === "string" || (invoice._id && !invoice.items)) {
        const invoiceResponse = await api.get(
          `/api/purchase-orders/${invoice._id || invoice}`,
        );
        if (invoiceResponse.data?.purchaseOrder) {
          invoiceDetails = invoiceResponse.data.purchaseOrder;
        } else if (invoiceResponse.data?.invoice) {
          invoiceDetails = invoiceResponse.data.invoice;
        } else {
          invoiceDetails = invoiceResponse.data;
        }
      }

      if (!invoiceDetails || !invoiceDetails.items) {
        toast.error("Could not load invoice items");
        return;
      }

      // Map purchase order items to debit note items
      const itemsFromInvoice = await Promise.all(
        invoiceDetails.items.map(async (item, index) => {
          let productName = item.itemName || item.name || "Product";

          if (item.productId && !item.itemName && !item.name) {
            try {
              const productResponse = await api.get(
                `/api/products/${item.productId}`,
              );
              if (productResponse.data) {
                const product =
                  productResponse.data.product || productResponse.data;
                productName = product.productName || product.name || "Product";
              }
            } catch (err) {
              // console.error("Failed to fetch product details:", err);
              toast.error(
                err.response?.data?.error ||
                  err.response?.data?.message ||
                  "Failed to fetch product details"
              );
            }
          }

          return {
            id: index + 1,
            productId: item.productId?._id || item.productId,
            name: productName,
            description: item.description || "",
            quantity: item.qty || item.quantity || 1,
            originalQuantity: item.qty || item.quantity || 1,
            returnQuantity: 0,
            unit: item.unit || "Pcs",
            unitPrice: item.unitPrice || item.price || 0,
            tax: item.taxType || `GST @ ${item.taxRate || 5}%`,
            taxRate: item.taxRate || 5,
            taxAmount: item.taxAmount || 0,
            discountPercent: item.discountPct || 0,
            discountAmount: item.discountAmt || 0,
            amount: item.amount || 0,
            isSelected: false,
          };
        }),
      );

      // Set all items as available initially
      setAvailableItems(itemsFromInvoice);
      setSelectedItems([]);

      setFormData((prev) => ({
        ...prev,
        invoiceId: invoiceDetails._id,
        invoiceNumber:
          invoiceDetails.invoiceNo || invoiceDetails.invoiceNumber || "",
      }));

      setIsInvoiceOpen(false);
    } catch (error) {
      console.error("Failed to load invoice details:", error);
      // toast.error("Failed to load invoice details");
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to load invoice details"
      );

    }
  };

  // Calculate individual item total
  const calculateItemTotal = (item) => {
    if (!item) return item;

    const subtotal = (item.returnQuantity || 0) * (item.unitPrice || 0);
    let discountAmount = item.discountAmount || 0;

    if (item.discountPercent > 0) {
      discountAmount = subtotal * (item.discountPercent / 100);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
    const total = taxableAmount + taxAmount;

    return {
      ...item,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      amount: parseFloat(total.toFixed(2)),
    };
  };

  // Calculate totals based on selected items
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    selectedItems.forEach((item) => {
      const itemSubtotal = (item.returnQuantity || 0) * (item.unitPrice || 0);
      subtotal += itemSubtotal;
      totalDiscount += item.discountAmount || 0;
      totalTax += item.taxAmount || 0;
    });

    let totalAmount =
      subtotal + totalTax - totalDiscount + (formData.shippingCharges || 0);

    let roundOff = 0;
    if (formData.autoRoundOff) {
      roundOff = Math.round(totalAmount) - totalAmount;
      totalAmount = Math.round(totalAmount);
    }

    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      roundOff: parseFloat(roundOff.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    }));
  };

  // Handle selecting an item with quantity (edit mode only)
  const handleSelectItem = (item, quantity) => {
    if (!isEditMode) return;

    if (quantity <= 0) return;

    const maxAllowed = item.quantity;
    const actualQty = Math.min(quantity, maxAllowed);

    // Check if already selected
    const existingIndex = selectedItems.findIndex(
      (selItem) => selItem.id === item.id,
    );

    if (existingIndex !== -1) {
      // Update existing
      const updatedSelected = [...selectedItems];
      updatedSelected[existingIndex] = {
        ...updatedSelected[existingIndex],
        returnQuantity: actualQty,
      };
      const recalculatedItem = calculateItemTotal(
        updatedSelected[existingIndex],
      );
      updatedSelected[existingIndex] = recalculatedItem;
      setSelectedItems(updatedSelected);
    } else {
      // Add new
      const itemToSelect = {
        ...item,
        isSelected: true,
        returnQuantity: actualQty,
        originalQuantity: item.quantity,
      };
      const recalculatedItem = calculateItemTotal(itemToSelect);
      setSelectedItems([...selectedItems, recalculatedItem]);
    }
  };

  // Remove item from selected (edit mode only)
  const handleRemoveItem = (itemId) => {
    if (!isEditMode) return;

    const updatedSelected = selectedItems.filter(
      (selItem) => selItem.id !== itemId,
    );
    setSelectedItems(updatedSelected);
  };

  // Handle return quantity change in selected items (edit mode only)
  const handleReturnQuantityChange = (itemId, value) => {
    if (!isEditMode) return;

    const parsedValue = parseInt(value) || 0;
    const updatedSelected = selectedItems.map((item) => {
      if (item.id === itemId) {
        const maxQuantity = item.originalQuantity || item.quantity;
        const returnQuantity = Math.min(Math.max(0, parsedValue), maxQuantity);
        const updatedItem = {
          ...item,
          returnQuantity,
        };
        return calculateItemTotal(updatedItem);
      }
      return item;
    });
    setSelectedItems(updatedSelected);
  };

  // Handle form field changes
  const handleFormChange = (field, value) => {
    if (!isEditMode) return;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle edit mode
  const handleEditToggle = () => {
    if (debitNote?.status === "settled" || debitNote?.status === "cancelled") {
      toast.error(`Cannot edit a ${debitNote.status} debit note`);
      return;
    }
    setIsEditMode(!isEditMode);

    // If turning off edit mode, reset to original data
    if (isEditMode) {
      fetchDebitNoteDetails();
    }
  };

  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      console.log("Company data:", res.data);
      setCompanyData(res.data.data);
    } catch (error) {
      // console.error("Error fetching company profile:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch company profile"
      );
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
      console.log("Terms data:", res.data);
    } catch (error) {
      // console.error("Error fetching notes & terms settings:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch notes & terms settings"
      );
    }
  };

  const fetchSignature = async () => {
    try {
      const res = await api.get("/api/print-templates/all");
      setTemplate(res.data.data);
      console.log("Template data:", res.data);
    } catch (error) {
      // console.error("Error fetching template settings:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to fetch template settings"
      );
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchSettings();
    fetchSignature();
  }, []);

  // Handle save
  const handleSubmit = async (action) => {
    try {
      if (!isEditMode) return;

      // Validation
      if (!formData.supplierId) {
        toast.error("Please select a supplier");
        return;
      }

      if (!formData.invoiceId) {
        toast.error("Please select an invoice");
        return;
      }

      // Check if any selected items have return quantity > 0
      const validItems = selectedItems.filter(
        (item) => (item.returnQuantity || 0) > 0,
      );
      if (validItems.length === 0) {
        toast.error("Please set return quantity for selected items");
        return;
      }

      setSaving(true);

      const debitNoteData = {
        date: formData.date,
        notes: formData.notes,
        reason: formData.reason,
        additionalCharges: formData.shippingCharges,
        roundOff: formData.autoRoundOff ? formData.roundOff : 0,
        items: validItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.description || "",
          quantity: item.returnQuantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          total: item.amount,
        })),
        subtotal: formData.subtotal,
        totalDiscount: formData.discount,
        totalAmount: formData.totalAmount,
      };

      console.log("Updating debit note:", debitNoteData);

      const response = await api.put(
        `/api/supplier-debit-notes/${id}`,
        debitNoteData,
      );

      toast.success("Debit note updated successfully");

      // Turn off edit mode and refresh data
      setIsEditMode(false);
      fetchDebitNoteDetails();

      // If save & print, open print dialog
      if (action === "saveAndPrint" && "save") {
        setTimeout(() => {
          // window.print();
          navigate("/debit-note");
        }, 500);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to update debit note",
      );
    } finally {
      setSaving(false);
    }
  };

const renderAvailableItemsTable = () => {
  // Only show in edit mode
  if (!isEditMode) return null;

  if (availableItems.length === 0) {
    return (
      <div className="mb-4">
        <h6 className="section-title">Available for Debit Notes</h6>
        <div className="text-center text-muted py-3">
          No available items. Select an invoice to see items.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h6 className="section-title">Available for Debit Notes</h6>
      <table className="table po-table mt-3 table-bordered-custom">
        <thead style={{ textAlign: "center" }}>
          <tr>
            <th style={{ width: "70px", position: "relative" }}>Sl No.</th>
            <th style={{ textAlign: "left", position: "relative" }}>Items</th>
            <th style={{ position: "relative" }}>Available Qty</th>
            <th style={{ position: "relative" }}>Unit</th>
            <th style={{ position: "relative" }}>Unit Price</th>
            <th style={{ position: "relative" }}>Tax</th>
            <th style={{ position: "relative" }}>Tax Amount</th>
            <th style={{ position: "relative" }}>Discount</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {availableItems.map((item) => {
            const selectedItem = selectedItems.find(
              (selItem) => selItem.id === item.id,
            );
            const isSelected = !!selectedItem;
            const selectedQty = selectedItem
              ? selectedItem.returnQuantity
              : 0;

            return (
              <tr key={item.id}>
                <td
                  className="numslno"
                  style={{
                    border: "2px solid #1F7FFF",
                    position: "relative",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSelectItem(item, 1);
                      } else {
                        handleRemoveItem(item.id);
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      width: "18px",
                      height: "18px",
                      margin: "0 10px",
                    }}
                  />
                  {item.id}
                </td>
                <td
                  className="itemsno items-cell"
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    className="form-control supplierinput shadow-none"
                    style={{
                      outline: "none !important",
                      border: "none",
                    }}
                    value={item.name}
                    readOnly
                  />
                </td>
                <td
                  className="items-cell"
                  style={{ width: "100px", position: "relative" }}
                >
                  <div
                    style={{
                      height: "40px",
                      padding: "4px 12px",
                      border: "1px solid #A2A8B8",
                      width: "120px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <input
                        min="0"
                        max={item.quantity}
                        value={selectedQty}
                        onChange={(e) => {
                          let qty = Number(e.target.value);
                          if (qty < 0) qty = 0;
                          if (qty > item.quantity) qty = item.quantity;

                          if (qty === 0) {
                            handleRemoveItem(item.id);
                          } else if (isSelected) {
                            // Update existing
                            const updatedSelected = selectedItems.map(selItem => 
                              selItem.id === item.id 
                                ? calculateItemTotal({...selItem, returnQuantity: qty})
                                : selItem
                            );
                            setSelectedItems(updatedSelected);
                          } else {
                            handleSelectItem(item, qty);
                          }
                        }}
                        type="text"
                        placeholder="0"
                        style={{
                          border: "none",
                          outline: "none",
                          backgroundColor: "transparent",
                          width: "15px",
                        }}
                      />
                      <span
                        style={{
                          paddingRight: "5px",
                          fontSize: "13px",
                          color: "#555",
                          pointerEvents: "none",
                          fontWeight: 500,
                        }}
                      >
                        / {item.quantity}
                      </span>
                    </div>
                    <PiCaretUpDownLight
                      style={{
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickY = e.clientY - rect.top;
                        const isUp = clickY < rect.height / 2;

                        let qty = isUp ? selectedQty + 1 : selectedQty - 1;
                        if (qty < 0) qty = 0;
                        if (qty > item.quantity) qty = item.quantity;

                        if (qty === 0) {
                          handleRemoveItem(item.id);
                        } else if (isSelected) {
                          // Update existing
                          const updatedSelected = selectedItems.map(selItem => 
                            selItem.id === item.id 
                              ? calculateItemTotal({...selItem, returnQuantity: qty})
                              : selItem
                          );
                          setSelectedItems(updatedSelected);
                        } else {
                          handleSelectItem(item, qty);
                        }
                      }}
                    />
                  </div>
                </td>
                <td
                  className="items-cell"
                  style={{ width: "100px", position: "relative" }}
                >
                  <input
                    type="text"
                    className="form-control form-select-sm shadow-none"
                    style={{
                      width: "100%",
                      border: "1px solid #A2A8B8",
                      backgroundColor: "white",
                      textAlign: "center",
                    }}
                    value={item.unit}
                    readOnly
                  />
                </td>
                <td
                  className="items-cell"
                  style={{ width: "150px", position: "relative" }}
                >
                  <input
                    type="text"
                    className="form-control shadow-none"
                    style={{
                      border: "1px solid #A2A8B8",
                      backgroundColor: "white",
                    }}
                    value={`₹${item.unitPrice.toFixed(2)}`}
                    readOnly
                  />
                </td>
                <td
                  className="items-cell"
                  style={{ width: "150px", position: "relative" }}
                >
                  <input
                    type="text"
                    className="form-control supplierselect shadow-none"
                    style={{
                      border: "1px solid #A2A8B8",
                      backgroundColor: "white",
                    }}
                    value={item.tax}
                    readOnly
                  />
                </td>
                <td
                  className="items-cell"
                  style={{ width: "130px", position: "relative" }}
                >
                  <input
                    type="text"
                    placeholder="₹0.00"
                    className="form-control shadow-none"
                    style={{
                      border: "1px solid #A2A8B8",
                      backgroundColor: "#f8f9fa",
                    }}
                    value={`₹${item.taxAmount.toFixed(2)}`}
                    readOnly
                  />
                </td>
                <td
                  className="items-cell"
                  style={{ width: "200px", position: "relative" }}
                >
                  <div
                    className="discount-box"
                    style={{ display: "flex", gap: "10px" }}
                  >
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="form-control small shadow-none"
                        style={{
                          paddingRight: "30px",
                          width: "100%",
                          border: "1px solid #A2A8B8",
                          backgroundColor: "white",
                        }}
                        value={`${item.discountPercent || 0}%`}
                        readOnly
                      />
                      <div
                        className="symbol"
                        style={{
                          position: "absolute",
                          right: "0px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "#555",
                        }}
                      >
                        %{" "}
                      </div>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="form-control small shadow-none"
                        style={{
                          width: "100%",
                          border: "1px solid #A2A8B8",
                          backgroundColor: "white",
                        }}
                        value={`₹${item.discountAmount?.toFixed(2) || "0.00"}`}
                        readOnly
                      />
                      <div
                        style={{
                          position: "absolute",
                          right: "0px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "#555",
                        }}
                        className="symbol"
                      >
                        ₹{" "}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ width: "150px" }}>
                  <input
                    type="text"
                    className="form-control shadow-none"
                    style={{
                      width: "100%",
                      border: "1px solid #A2A8B8",
                      backgroundColor: "#f8f9fa",
                    }}
                    value={`₹${item.amount.toFixed(2)}`}
                    readOnly
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

  const renderInProcessTable = () => (
    <div className="mb-4">
      <h6 className="section-title">
        {isEditMode ? "Selected for Debit Notes" : "In Process"}
      </h6>
      <table className="table po-table mt-3 table-bordered-custom">
        <thead style={{ textAlign: "center" }}>
          <tr>
            <th style={{ width: "70px", position: "relative" }}>Sl No.</th>
            <th style={{ textAlign: "left", position: "relative" }}>Items</th>
            <th style={{ position: "relative" }}>
              {isEditMode ? "Return Qty" : "Qty"}
            </th>
            <th style={{ position: "relative" }}>Unit</th>
            <th style={{ position: "relative" }}>Unit Price</th>
            <th style={{ position: "relative" }}>Tax</th>
            <th style={{ position: "relative" }}>Tax Amount</th>
            <th style={{ position: "relative" }}>Discount</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.length > 0 ? (
            selectedItems.map((item, index) => (
              <tr key={item.id}>
                <td
                  className="numslno"
                  style={{
                    border: "2px solid #1F7FFF",
                    position: "relative",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      justifyContent: "center",
                    }}
                  >
                    {isEditMode && (
                      <RiDeleteBinLine
                        className="text-danger"
                        style={{
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove item"
                      />
                    )}
                    {index + 1}
                  </div>
                </td>
                <td
                  className="itemsno items-cell"
                  style={{ position: "relative" }}
                >
                  <input
                    type="text"
                    className="form-control supplierinput shadow-none"
                    style={{
                      outline: "none !important",
                      border: "none",
                    }}
                    value={item.name}
                    readOnly
                  />
                </td>
                <td
                  className="items-cell"
                  style={{ width: "100px", position: "relative" }}
                >
                  {isEditMode ? (
                    <div
                      style={{
                        height: "40px",
                        padding: "4px 12px",
                        border: "1px solid #A2A8B8",
                        width: "120px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <input
                          min="0"
                          max={item.originalQuantity || item.quantity}
                          value={item.returnQuantity || 0}
                          onChange={(e) => {
                            let qty = Number(e.target.value);
                            if (qty < 0) qty = 0;
                            if (qty > (item.originalQuantity || item.quantity))
                              qty = item.originalQuantity || item.quantity;
                            handleReturnQuantityChange(item.id, qty);
                          }}
                          type="text"
                          style={{
                            border: "none",
                            outline: "none",
                            backgroundColor: "transparent",
                            width: "15px",
                          }}
                        />
                        <span
                          style={{
                            paddingRight: "5px",
                            fontSize: "13px",
                            color: "#555",
                            pointerEvents: "none",
                            fontWeight: 500,
                          }}
                        >
                          / {item.originalQuantity || item.quantity}
                        </span>
                      </div>
                      <PiCaretUpDownLight
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickY = e.clientY - rect.top;
                          const isUp = clickY < rect.height / 2;

                          let qty = isUp
                            ? (item.returnQuantity || 0) + 1
                            : (item.returnQuantity || 0) - 1;
                          if (qty < 0) qty = 0;
                          if (qty > (item.originalQuantity || item.quantity))
                            qty = item.originalQuantity || item.quantity;
                          handleReturnQuantityChange(item.id, qty);
                        }}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-control form-control-sm shadow-none"
                      style={{
                        width: "100%",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                        textAlign: "center",
                      }}
                      value={item.quantity}
                      readOnly
                    />
                  )}
                </td>
                <td
                  className="items-cell"
                  style={{ width: "100px", position: "relative" }}
                >
                  {isEditMode ? (
                    <select
                      className="form-select form-select-sm shadow-none"
                      style={{
                        width: "100%",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "white",
                      }}
                      value={item.unit}
                      onChange={(e) => {
                        const updatedSelected = selectedItems.map((selItem) =>
                          selItem.id === item.id
                            ? { ...selItem, unit: e.target.value }
                            : selItem,
                        );
                        setSelectedItems(updatedSelected);
                      }}
                    >
                      <option>Pcs</option>
                      <option>Kg</option>
                      <option>Gram</option>
                      <option>Liter</option>
                      <option>Meter</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control form-select-sm shadow-none"
                      style={{
                        width: "100%",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                        textAlign: "center",
                      }}
                      value={item.unit}
                      readOnly
                    />
                  )}
                </td>
                <td
                  className="items-cell"
                  style={{ width: "150px", position: "relative" }}
                >
                  {isEditMode ? (
                    <input
                      type="text"
                      className="form-control shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "white",
                      }}
                      value={`₹${item.unitPrice.toFixed(2)}`}
                      onChange={(e) => {
                        const value = e.target.value.replace("₹", "");
                        const updatedSelected = selectedItems.map((selItem) =>
                          selItem.id === item.id
                            ? calculateItemTotal({
                                ...selItem,
                                unitPrice: parseFloat(value) || 0,
                              })
                            : selItem,
                        );
                        setSelectedItems(updatedSelected);
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-control shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={`₹${item.unitPrice.toFixed(2)}`}
                      readOnly
                    />
                  )}
                </td>
                <td
                  className="items-cell"
                  style={{ width: "150px", position: "relative" }}
                >
                  {isEditMode ? (
                    <select
                      className="form-select supplierselect shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "white",
                      }}
                      value={item.tax}
                      onChange={(e) => {
                        const taxRate =
                          parseFloat(e.target.value.match(/\d+/)?.[0]) || 5;
                        const updatedSelected = selectedItems.map((selItem) =>
                          selItem.id === item.id
                            ? calculateItemTotal({
                                ...selItem,
                                tax: e.target.value,
                                taxRate: taxRate,
                              })
                            : selItem,
                        );
                        setSelectedItems(updatedSelected);
                      }}
                    >
                      <option>GST @ 5%</option>
                      <option>GST @ 12%</option>
                      <option>GST @ 18%</option>
                      <option>GST @ 28%</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control supplierselect shadow-none"
                      style={{
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                      }}
                      value={item.tax}
                      readOnly
                    />
                  )}
                </td>
                <td
                  className="items-cell"
                  style={{ width: "130px", position: "relative" }}
                >
                  <input
                    type="text"
                    placeholder="₹0.00"
                    className="form-control shadow-none"
                    style={{
                      border: "1px solid #A2A8B8",
                      backgroundColor: "#f8f9fa",
                    }}
                    value={`₹${item.taxAmount.toFixed(2)}`}
                    readOnly
                  />
                </td>
                <td
                  className="items-cell"
                  style={{ width: "200px", position: "relative" }}
                >
                  <div
                    className="discount-box"
                    style={{ display: "flex", gap: "10px" }}
                  >
                    <div style={{ position: "relative" }}>
                      {isEditMode ? (
                        <input
                          type="text"
                          className="form-control small shadow-none"
                          style={{
                            paddingRight: "30px",
                            width: "100%",
                            border: "1px solid #A2A8B8",
                            backgroundColor: "white",
                          }}
                          value={`${item.discountPercent}%`}
                          onChange={(e) => {
                            const value = e.target.value.replace("%", "");
                            const updatedSelected = selectedItems.map(
                              (selItem) =>
                                selItem.id === item.id
                                  ? calculateItemTotal({
                                      ...selItem,
                                      discountPercent: parseFloat(value) || 0,
                                    })
                                  : selItem,
                            );
                            setSelectedItems(updatedSelected);
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          className="form-control small shadow-none"
                          style={{
                            paddingRight: "30px",
                            width: "100%",
                            border: "1px solid #A2A8B8",
                            backgroundColor: "#f8f9fa",
                          }}
                          value={`${item.discountPercent}%`}
                          readOnly
                        />
                      )}
                      <div
                        className="symbol"
                        style={{
                          position: "absolute",
                          right: "0px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "#555",
                        }}
                      >
                        %{" "}
                      </div>
                    </div>
                    <div style={{ position: "relative" }}>
                      {isEditMode ? (
                        <input
                          type="text"
                          className="form-control small shadow-none"
                          style={{
                            width: "100%",
                            border: "1px solid #A2A8B8",
                            backgroundColor: "white",
                          }}
                          value={`₹${item.discountAmount.toFixed(2)}`}
                          onChange={(e) => {
                            const value = e.target.value.replace("₹", "");
                            const updatedSelected = selectedItems.map(
                              (selItem) =>
                                selItem.id === item.id
                                  ? calculateItemTotal({
                                      ...selItem,
                                      discountAmount: parseFloat(value) || 0,
                                    })
                                  : selItem,
                            );
                            setSelectedItems(updatedSelected);
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          className="form-control small shadow-none"
                          style={{
                            width: "100%",
                            border: "1px solid #A2A8B8",
                            backgroundColor: "#f8f9fa",
                          }}
                          value={`₹${item.discountAmount.toFixed(2)}`}
                          readOnly
                        />
                      )}
                      <div
                        style={{
                          position: "absolute",
                          right: "0px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                          color: "#555",
                        }}
                        className="symbol"
                      >
                        ₹{" "}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ width: "150px" }}>
                  <input
                    type="text"
                    className="form-control shadow-none"
                    style={{
                      width: "100%",
                      border: "1px solid #A2A8B8",
                      backgroundColor: "#f8f9fa",
                    }}
                    value={`₹${item.amount.toFixed(2)}`}
                    readOnly
                  />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="9" className="text-center text-muted py-3">
                No items selected.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsInvoiceOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelRef.current && !modelRef.current.contains(event.target)) {
        setViewInvoice(false);
      }
    };

    if (viewInvoiceOptions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [viewInvoiceOptions]);

  if (loading) {
    return (
      <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
        <div className="text-center py-5">Loading...</div>
      </div>
    );
  }

  if (!debitNote) {
    return (
      <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
        <div className="text-center py-5">Debit note not found</div>
      </div>
    );
  }

  const statusColors = {
    draft: { bg: "#FEF3C7", color: "#92400E", label: "Draft" },
    issued: { bg: "#DBEAFE", color: "#1E40AF", label: "Issued" },
    settled: { bg: "#D1FAE5", color: "#065F46", label: "Settled" },
    cancelled: { bg: "#FEE2E2", color: "#991B1B", label: "Cancelled" },
  };

  const statusInfo = statusColors[debitNote.status] || statusColors.draft;

  return (
    <div>
      <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <Link to="/debit-note" style={{ marginRight: "10px" }}>
              <span
                style={{
                  backgroundColor: "white",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  border: "1px solid #FCFCFC",
                }}
              >
                <img src={total_orders_icon} alt="total_orders_icon" />
              </span>
            </Link>
            <div>
              <h4
                className="m-0"
                style={{
                  fontSize: "22px",
                  color: "#0E101A",
                  fontFamily: '"Inter", sans-serif',
                  fontWeight: 500,
                  lineHeight: "120%",
                }}
              >
                Debit Note
              </h4>
            </div>
          </div>

          {/* Right: Preview and Edit Buttons */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              height: "33px",
            }}
          >
            <div
              onClick={() => handleViewInvoice(true)}
              style={{
                padding: "6px 16px",
                background: "#1F7FFF",
                border: "1px solid #1F7FFF",
                borderRadius: 8,
                textDecoration: "none",
                fontSize: "14px",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                height: "33px",
                color: "white",
                cursor: "pointer",
              }}
            >
              <span className="fs-6">Preview</span>
            </div>

            {/* Edit Button - Only in view mode for non-settled/cancelled notes */}
            {!isEditMode &&
              debitNote.status !== "settled" &&
              debitNote.status !== "cancelled" && (
                <button
                  className="btn btn-primary"
                  style={{
                    padding: "6px 16px",
                    color: "#FFFFFF",
                    fontWeight: 500,
                    fontSize: "14px",
                    lineHeight: "120%",
                    height: "33px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  onClick={handleEditToggle}
                >
                  Edit
                </button>
              )}

            {/* Cancel Edit Button - Only in edit mode */}
            {isEditMode && (
              <button
                className="btn btn-outline-primary"
                style={{
                  fontWeight: 500,
                  padding: "6px 16px",
                  fontSize: "14px",
                  lineHeight: "120%",
                  border: "1px solid #1F7FFF",
                  height: "33px",
                  display: "flex",
                  alignItems: "center",
                }}
                onClick={handleEditToggle}
                disabled={saving}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* Supplier Details Section */}
        <div
         style={{
            width: "100%",
            padding: "16px",
            background: "var(--White, white)",
            borderRadius: "16px",
            border: "1px var(--Stroke, #EAEAEA) solid",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: "24px",
            display: "flex",
            overflowX: "auto",
            height: "calc(100vh - 200px)",
          }}
        >
          <div style={{ width: "100%" }}>
            {/* header */}
          <div
              style={{
                color: "black",
                fontSize: "16px",
                fontFamily: "Inter",
                fontWeight: "500",
                lineHeight: "19.20px",
              }}
            >
              Supplier Details
            </div>
            <div
              style={{
                display: "grid",
                gap: "16px",
                width: "100%",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  display: "inline-flex",
                  marginTop: "16px",
                }}
              >

          <div style={{ width: "50%", borderRight: "2px solid #eee" }}>
            {/* LEFT AREA (Supplier + Phone) */}
            <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      gap: "45px",
                      width: "100%",
                    }}
                  >
              {/* Supplier Name */}
              <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "40%",
                      }}
                    >
                      <label>
                        Supplier Name<span style={{ color: "red" }}>*</span>
                      </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="form-control supplierinput shadow-none"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #A2A8B8",
                      backgroundColor: isEditMode ? "white" : "#f8f9fa",
                      cursor: isEditMode ? "text" : "default",
                    }}
                    value={formData.supplierName}
                    readOnly={!isEditMode}
                    onChange={(e) =>
                      handleFormChange("supplierName", e.target.value)
                    }
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div  style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "40%",
                      }}>
                 <label>
                        Phone No.<span style={{ color: "red" }}>*</span>
                      </label>
                      <div
                        className="supplier-search-container"
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          border: "1px solid #A2A8B8",
                          padding: "8px 8px",
                          display: "flex",
                          gap: "16px",
                          marginTop: "4px",
                          alignItems: "center",
                          position: "relative",
                        }}
                      >

               <div
                          className="d-flex"
                          style={{
                            borderRight: "1px solid #EAEAEA",
                            width: "70px",
                          }}
                        >
                  <img src={indialogo} alt="india-logo" />
                   <span
                            style={{ color: "black", padding: "0px 10px" }}
                          >
                            +91
                          </span>
                          </div>
                          <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                  <input
                    type="tel"
                    // className="form-control supplierinput shadow-none"
                    placeholder="Enter Phone"
                    style={{
                      border: "1px solid #A2A8B8",
                      backgroundColor: isEditMode ? "white" : "#f8f9fa",
                    }}
                    value={formData.phone}
                    readOnly={!isEditMode}
                    onChange={(e) => handleFormChange("phone", e.target.value)}
                  />
                </div>
              </div>
            </div>
            </div>

            {/* Middle line */}
            <div
              style={{
                width: "1px",
                height: "70px",
                backgroundColor: "#E0E0E0",
                margin: "0 20px",
              }}
            ></div>

            {/* RIGHT SIDE (Supplier Invoice No + Date) */}
            <div className="d-flex flex-column gap-3">
              {/* Invoice Dropdown - Only editable in edit mode */}
              <div className="d-flex justify-content-end">
                <div
                  ref={dropdownRef}
                  style={{ position: "relative", width: "100%" }}
                >
                  <div
                    onClick={() =>
                      isEditMode && setIsInvoiceOpen(!isInvoiceOpen)
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 14px",
                      border: "1px solid #D1D5DB",
                      borderRadius: "12px",
                      backgroundColor: isEditMode ? "#FFFFFF" : "#f8f9fa",
                      cursor: isEditMode ? "pointer" : "default",
                      fontSize: "14px",
                      fontFamily: '"Inter", sans-serif',
                      color: isEditMode ? "#374151" : "#6b7280",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                      transition: "all 0.2s",
                      height: "37px",
                    }}
                    onMouseEnter={(e) =>
                      isEditMode &&
                      (e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(0,0,0,0.15)")
                    }
                    onMouseLeave={(e) =>
                      isEditMode &&
                      (e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(0,0,0,0.1)")
                    }
                  >
                    <span style={{ flex: 1 }}>
                      {formData.invoiceNumber || "Purchase Invoice No"}
                    </span>
                    {isEditMode && (
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                        <IoChevronDownOutline />
                      </span>
                    )}
                  </div>

                  {isEditMode && isInvoiceOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "8px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                        border: "1px solid #E5E7EB",
                        overflow: "hidden",
                        zIndex: 9999,
                        maxHeight: "240px",
                        overflowY: "auto",
                      }}
                    >
                      {loadingInvoices ? (
                        <div
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          Loading invoices...
                        </div>
                      ) : supplierInvoices.length === 0 ? (
                        <div
                          style={{
                            padding: "12px",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          No invoices found
                        </div>
                      ) : (
                        supplierInvoices.map((invoice) => (
                          <div
                            key={invoice._id}
                            onClick={() => handleInvoiceSelect(invoice)}
                            style={{
                              padding: "12px 16px",
                              fontSize: "12px",
                              fontFamily: '"Inter", sans-serif',
                              cursor: "pointer",
                              color:
                                formData.invoiceId === invoice._id
                                  ? "#0E101A"
                                  : "#374151",
                              fontWeight:
                                formData.invoiceId === invoice._id
                                  ? "600"
                                  : "500",
                              backgroundColor:
                                formData.invoiceId === invoice._id
                                  ? "#e5f0ff"
                                  : "transparent",
                              transition: "all 0.2s ease",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#e5f0ff")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                formData.invoiceId === invoice._id
                                  ? "#e5f0ff"
                                  : "transparent")
                            }
                          >
                            {invoice.invoiceNo || invoice.invoiceNumber}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div className="d-flex justify-content-end gap-2">
                <div className="" style={{ marginLeft: "-10px" }}>
                  {isEditMode ? (
                    <DatePicker
                      padding="6px 10px"
                      value={formData.date}
                      onChange={(selectedDate) =>
                        handleFormChange("date", selectedDate)
                      }
                    />
                  ) : (
                    <div
                      style={{
                        padding: "10px 14px",
                        border: "1px solid #D1D5DB",
                        borderRadius: "12px",
                        backgroundColor: "#f8f9fa",
                        fontSize: "14px",
                        color: "#374151",
                      }}
                    >
                      {new Date(formData.date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
          </div>
          </div>
          {/* TABLE RENDERING LOGIC */}
          {!isEditMode ? (
            <>
              {/* In View mode: Show "In Process" table */}
              {renderInProcessTable()}

              {/* In View mode: Also show "Available for Debit Notes" table */}
              <div className="mb-4">
                <h6 className="section-title">Available for Debit Notes</h6>
                <table className="table po-table mt-3 table-bordered-custom">
                  <thead style={{ textAlign: "center" }}>
                    <tr>
                      <th style={{ width: "70px", position: "relative" }}>
                        Sl No.
                      </th>
                      <th style={{ textAlign: "left", position: "relative" }}>
                        Items
                      </th>
                      <th style={{ position: "relative" }}>Qty</th>
                      <th style={{ position: "relative" }}>Unit</th>
                      <th style={{ position: "relative" }}>Unit Price</th>
                      <th style={{ position: "relative" }}>Tax</th>
                      <th style={{ position: "relative" }}>Tax Amount</th>
                      <th style={{ position: "relative" }}>Discount</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.length > 0 ? (
                      selectedItems.map((item, index) => (
                        <tr key={item.id}>
                          <td
                            className="numslno"
                            style={{
                              border: "2px solid #1F7FFF",
                              position: "relative",
                              textAlign: "center",
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            className="itemsno items-cell"
                            style={{ position: "relative" }}
                          >
                            <input
                              type="text"
                              className="form-control supplierinput shadow-none"
                              style={{
                                outline: "none !important",
                                border: "none",
                              }}
                              value={item.name}
                            />
                          </td>
                          <td
                            className="items-cell"
                            style={{
                              width: "100px",
                              position: "relative",
                              textAlign: "center",
                            }}
                          >
                            <input
                              type="text"
                              className="form-control form-control-sm shadow-none"
                              style={{
                                width: "100%",
                                border: "1px solid #A2A8B8",
                                backgroundColor: "#f8f9fa",
                                textAlign: "center",
                              }}
                              value={item.quantity}
                            />
                          </td>
                          <td
                            className="items-cell"
                            style={{
                              width: "100px",
                              position: "relative",
                              textAlign: "center",
                            }}
                          >
                            <input
                              type="text"
                              className="form-control form-select-sm shadow-none"
                              style={{
                                width: "100%",
                                border: "1px solid #A2A8B8",
                                backgroundColor: "#f8f9fa",
                                textAlign: "center",
                              }}
                              value={item.unit}
                            />
                          </td>
                          <td
                            className="items-cell"
                            style={{
                              width: "150px",
                              position: "relative",
                              textAlign: "center",
                            }}
                          >
                            <input
                              type="text"
                              className="form-control shadow-none"
                              style={{
                                border: "1px solid #A2A8B8",
                                backgroundColor: "#f8f9fa",
                              }}
                              value={`₹${item.unitPrice.toFixed(2)}`}
                            />
                          </td>
                          <td
                            className="items-cell"
                            style={{
                              width: "150px",
                              position: "relative",
                              textAlign: "center",
                            }}
                          >
                            <div style={{ padding: "8px", color: "#0E101A" }}>
                              <input
                                type="text"
                                className="form-control supplierselect shadow-none"
                                style={{
                                  border: "1px solid #A2A8B8",
                                  backgroundColor: "#f8f9fa",
                                }}
                                value={item.tax}
                              />
                            </div>
                          </td>
                          <td
                            className="items-cell"
                            style={{
                              width: "130px",
                              position: "relative",
                              textAlign: "center",
                            }}
                          >
                            <input
                              type="text"
                              placeholder="₹0.00"
                              className="form-control shadow-none"
                              style={{
                                border: "1px solid #A2A8B8",
                                backgroundColor: "#f8f9fa",
                              }}
                              value={`₹${item.taxAmount.toFixed(2)}`}
                            />
                          </td>
                          <td
                            className="items-cell"
                            style={{ width: "200px", position: "relative" }}
                          >
                            <div
                              className="discount-box"
                              style={{ display: "flex", gap: "10px" }}
                            >
                              {/* Discount % */}
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  className="form-control small shadow-none"
                                  style={{
                                    paddingRight: "30px",
                                    width: "100%",
                                    border: "1px solid #A2A8B8",
                                    backgroundColor: "#f8f9fa",
                                  }}
                                  value={`${item.discountPercent || 0}%`}
                                  readOnly
                                />
                                <div 
                                className="discount-box symbol"
                                  style={{
                                    position: "absolute",
                                    right: "0px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                    color: "#555",
                                  }}
                                >
                                  %
                                </div>
                              </div>

                              {/* Discount Amount */}
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  className="form-control small shadow-none"
                                  style={{
                                    width: "100%",
                                    border: "1px solid #A2A8B8",
                                    backgroundColor: "#f8f9fa",
                                  }}
                                  value={`₹${item.discountAmount?.toFixed(2) || "0.00"}`}
                                  readOnly
                                />
                                <div
                                className="discount-box symbol"
                                  style={{
                                    position: "absolute",
                                    right: "0px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                    color: "#555",
                                  }}
                                >
                                  ₹
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ width: "150px", textAlign: "center" }}>
                            <input
                              type="text"
                              className="form-control shadow-none"
                              style={{
                                width: "100%",
                                border: "1px solid #A2A8B8",
                                backgroundColor: "#f8f9fa",
                              }}
                              value={`₹${Math.round(item.amount.toFixed(2))}`}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-3">
                          No items available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* In Edit mode: Show "Available for Debit Notes" table (with checkboxes) */}
              {renderAvailableItemsTable()}

              {/* In Edit mode: Show "Selected for Debit Notes" */}
              {renderInProcessTable()}
            </>
          )}

          {/* Payment + Summary */}
          <div
            style={{
              background: "#fff",
              padding: "2px",
              width: "100%",
              marginTop: 10,
              display: "flex",
              justifyContent: "space-between",
              gap: "32px",
              width: "100%",
            }}
          >
            <div
              style={{
                width: "50%",
                paddingRight: "32px",
                borderRight: "2px solid #eee",
              }}
            >
                <div
                style={{
                  marginBottom: "24px",
                  color: "var(--Black-Black, #0E101A)",
                  fontSize: 16,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "19.20px",
                  wordWrap: "break-word",
                }}
              >
                Payment Details
              </div>
                <div className="mt-3">
                  {isEditMode ? (
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Add any notes or payment details..."
                      value={formData.notes}
                      onChange={(e) =>
                        handleFormChange("notes", e.target.value)
                      }
                      style={{ backgroundColor: "white" }}
                    />
                  ) : (
                    <div
                      style={{
                        color: "#0E101A",
                        fontSize: "14px",
                        padding: "12px",
                        backgroundColor: "#F8F9FA",
                        borderRadius: "8px",
                        minHeight: "80px",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {formData.notes || "No notes provided"}
                    </div>
                  )}
                </div>
            </div>


           <div style={{ width: "50%" }}>
              <div className="p-4">
                <div className="summary-line">
                  <span
                    style={{
                      color: "#0E101A",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                    }}
                  >
                    Subtotal (with GST):
                  </span>
                  <span
                    style={{
                      color: "#0E101A",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                    }}
                  >
                    ₹{formData.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="summary-line">
                  <span
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                    }}
                  >
                    Discount:
                  </span>
                  <span
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                    }}
                  >
                    {formData.discount === 0
                      ? "00"
                      : `₹${formData.discount.toFixed(2)}`}
                  </span>
                </div>
                <div className="summary-line">
                  <span
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                    }}
                  >
                    Shipping Charges:
                  </span>
                  <span
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
                    }}
                  >
                    {formData.shippingCharges === 0
                      ? "00"
                      : `₹${formData.shippingCharges.toFixed(2)}`}
                  </span>
                </div>

                <div className="summary-line">
                  <span
                    style={{
                      color: "#0E101A",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                      marginLeft: "10px",
                    }}
                  >
                    Auto Round-off
                  </span>
                  <span
                    style={{
                      color: "#0E101A",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                    }}
                  >
                    {formData.roundOff > 0 ? "+" : ""}₹
                    {Math.abs(formData.roundOff).toFixed(2)}
                  </span>
                </div>
                <hr style={{ color: "#727681" }} />
                <div className="summary-line">
                  <h5 style={{ color: "#0E101A", lineHeight: "120%" }}>
                    Total Amount :-
                  </h5>
                  <h4
                    style={{
                      color: "#0E101A",
                      fontWeight: 500,
                      fontSize: "20px",
                      lineHeight: "120%",
                    }}
                  >
                    ₹{formData.totalAmount.toFixed(2)}
                  </h4>
                </div>

                {/* Save Buttons - Only shown in edit mode */}
                {isEditMode && (
                  <div className="d-flex justify-content-end gap-2 mt-3">
                    <button
                      className="btn btn-outline-primary"
                      style={{
                        fontWeight: 500,
                        padding: "10px",
                        fontSize: "14px",
                        lineHeight: "120%",
                        border: "1px solid #1F7FFF",
                      }}
                      onClick={() => handleSubmit("save")}
                      disabled={
                        saving ||
                        !formData.supplierId ||
                        !formData.invoiceId ||
                        selectedItems.filter(
                          (item) => (item.returnQuantity || 0) > 0,
                        ).length === 0
                      }
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{
                        padding: "10px",
                        color: "#FFFFFF",
                        fontWeight: 500,
                        fontSize: "14px",
                        lineHeight: "120%",
                      }}
                      onClick={() => handleSubmit("saveAndPrint")}
                      disabled={
                        saving ||
                        !formData.supplierId ||
                        !formData.invoiceId ||
                        selectedItems.filter(
                          (item) => (item.returnQuantity || 0) > 0,
                        ).length === 0
                      }
                    >
                      {saving ? "Saving..." : "Save & Print"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Preview Modal */}
        {viewInvoiceOptions && (
          <>
            <div
              style={{
                position: "absolute",
                top: "0px",
                left: "0px",
                zIndex: 999999,
                width: "100%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                backgroundColor: "rgba(0, 0, 0, 0.27)",
                backdropFilter: "blur(0.1px)",
                overflow: "auto",
              }}
              onClick={(e) =>
                e.target === e.currentTarget && handleViewInvoice(false)
              }
            >
              <div
                style={{
                  background: "#F3F5F6",
                  padding: 6,
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  width: "60%",
                  height: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  position: "absolute",
                }}
                ref={modelRef}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    paddingLeft: 36.37,
                    paddingRight: 36.37,
                    padding: "16px 36px 36px 36px",
                  }}
                >
                  <div
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        marginBottom: "10px",
                      }}
                    >
                      Preview
                    </div>
                    <div
                      style={{
                        color: "red",
                        padding: "9px",
                        background: "white",
                        border: "1px solid #EAEAEA",
                        borderRadius: "50%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        cursor: "pointer",
                      }}
                      onClick={() => handleViewInvoice(false)}
                    >
                      <IoIosCloseCircleOutline />
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      paddingTop: 20,
                      position: "relative",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignItems: "flex-start",
                      gap: 18.18,
                      display: "inline-flex",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        position: "relative",
                        fontFamily: "IBM Plex Mono",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          left: 0,
                          top: 0,
                          background: "var(--White-White-1, white)",
                          boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.10)",
                          padding: "10px 30px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div style={{ width: "100px" }}>
                            <img
                              src={companyData?.companyLogo || CompanyLogo}
                              alt="company logo"
                              style={{ width: "100%", objectFit: "contain" }}
                            />
                          </div>
                          <div style={{ width: "130px" }}>
                            {/* <img
                              src={TaxInvoiceLogo}
                              alt="tax invoice"
                              style={{ width: "100%", objectFit: "contain" }}
                            /> */}
                            Debit Note
                          </div>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: 0.76,
                            left: 31.77,
                            background: "var(--White-Stroke, #EAEAEA)",
                            marginTop: "8px",
                          }}
                        />
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "2px",
                          }}
                        >
                          <span>
                            DEBIT NOTE Date -{" "}
                            {format(new Date(formData.date), "dd MMM yyyy")}
                          </span>
                          <span style={{ marginRight: "12px" }}>
                            DEBIT NOTE No. -{" "}
                            {debitNote.debitNoteNumber ||
                              "DN-" + debitNote._id?.slice(-6)}
                          </span>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: 0.76,
                            left: 31.77,
                            marginTop: "1px",
                            background: "var(--White-Stroke, #EAEAEA)",
                          }}
                        />
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-around",
                            marginTop: "2px",
                            alignItems: "center",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                        >
                          <div
                            style={{
                              borderRight: "1px solid #EAEAEA",
                              width: "50%",
                              textAlign: "center",
                            }}
                          >
                            <span>From</span>
                          </div>
                          <div style={{ width: "50%", textAlign: "center" }}>
                            <span>Supplier Details</span>
                          </div>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-around",
                            marginTop: "2px",
                            alignItems: "center",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                        >
                          <div
                            style={{
                              borderRight: "1px solid #EAEAEA",
                              width: "50%",
                              padding: "3px",
                            }}
                          >
                            <div>
                              Name :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {companyData?.companyName ||
                                  "Kasper Infotech Pvt. Ltd."}
                              </span>
                            </div>
                            <div>
                              Address : {companyData?.companyaddress || ""}
                            </div>
                            <div style={{ marginTop: "8px" }}>
                              Phone : {companyData?.companyphone || ""}
                            </div>
                            <div>Email : {companyData?.companyemail || ""}</div>
                            <div>GSTIN : {companyData?.gstin || ""}</div>
                          </div>
                          <div style={{ width: "50%", padding: "3px" }}>
                            <div>
                              Name :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {formData.supplierName}
                              </span>
                            </div>
                            <div>
                              Address :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {/* Add supplier address if available */}
                                {debitNote.supplierId?.address.city || "N/A"}
                              </span>
                            </div>
                            <div style={{ marginTop: "8px" }}>
                              Phone :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {formData.phone}
                              </span>
                            </div>
                            <div style={{ marginTop: "0px" }}>
                              Email :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {/* Add supplier email if available */}
                                {debitNote.supplierId?.email || "N/A"}
                              </span>
                            </div>
                            <div style={{ marginTop: "0px" }}>
                              GSTIN :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {/* Add supplier GSTIN if available */}
                                {debitNote.supplierId?.gstin || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="table-responsive mt-3">
                          <table
                            className=""
                            style={{
                              width: "100%",
                              border: "1px solid #EAEAEA",
                              borderCollapse: "collapse",
                            }}
                          >
                            <thead style={{ textAlign: "center" }}>
                              <tr>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  rowSpan="2"
                                >
                                  Sr No.
                                </th>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  rowSpan="2"
                                >
                                  Name of the Products
                                </th>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  rowSpan="2"
                                >
                                  HSN
                                </th>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  rowSpan="2"
                                >
                                  QTY
                                </th>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  rowSpan="2"
                                >
                                  Rate
                                </th>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  colSpan="2"
                                >
                                  Tax
                                </th>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    fontWeight: "400",
                                  }}
                                  rowSpan="2"
                                >
                                  Total
                                </th>
                              </tr>
                              <tr>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    width: "40px",
                                    fontWeight: "400",
                                  }}
                                >
                                  %
                                </th>
                                <th
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    borderBottom: "1px solid #EAEAEA",
                                    width: "40px",
                                    fontWeight: "400",
                                  }}
                                >
                                  ₹
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedItems.map((item, idx) => (
                                <tr key={idx}>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      height: "40px",
                                      textAlign: "center",
                                    }}
                                  >
                                    {idx + 1}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      padding: "0px 20px",
                                    }}
                                  >
                                    {item.name || ""}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    {/* Fetch HSN code if available */}
                                    {item.hsnCode || "-"}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.quantity || ""}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.unitPrice
                                      ? `₹${(item.unitPrice || 0).toFixed(2)}`
                                      : ""}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    {item.taxRate || "0"}%
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    ₹{(item.taxAmount || 0).toFixed(2)}
                                  </td>
                                  <td
                                    style={{
                                      borderRight: "1px solid #EAEAEA",
                                      textAlign: "center",
                                    }}
                                  >
                                    ₹{(item.amount || 0).toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              {/* Empty rows for remaining space */}
                              <tr>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    height: "250px",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    padding: "0px 20px",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                ></td>
                                <td
                                  style={{
                                    borderRight: "1px solid #EAEAEA",
                                    textAlign: "center",
                                  }}
                                ></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-around",
                            marginTop: "15px",
                            borderTop: "1px solid #EAEAEA",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                        >
                          <div
                            style={{
                              borderRight: "",
                              width: "50%",
                              padding: "3px",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <u>Total in words</u>
                            <div
                              style={{
                                fontSize: "12px",
                                marginTop: "5px",
                                fontWeight: "600",
                              }}
                            >
                              {toWords(formData.totalAmount).toUpperCase()}{" "}
                              RUPEES ONLY
                            </div>
                            <div
                              style={{
                                width: "100%",
                                height: 0.76,
                                left: 31.77,
                                background: "var(--White-Stroke, #EAEAEA)",
                                marginTop: "10px",
                              }}
                            />
                          </div>
                          <div
                            style={{
                              width: "50%",
                              padding: "3px",
                              borderLeft: "1px solid #EAEAEA",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #EAEAEA",
                                padding: "2px 8px",
                              }}
                            >
                              <span>Sub-total</span>
                              <span style={{ color: "black" }}>
                                ₹{formData.subtotal.toFixed(2)}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #EAEAEA",
                                padding: "2px 8px",
                              }}
                            >
                              <span>Discount</span>
                              <span style={{ color: "black" }}>
                                ₹{formData.discount.toFixed(2)}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #EAEAEA",
                                padding: "2px 8px",
                              }}
                            >
                              <span>Shipping Charges</span>
                              <span style={{ color: "black" }}>
                                ₹{formData.shippingCharges.toFixed(2)}
                              </span>
                            </div>
                            {formData.roundOff !== 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  borderBottom: "1px solid #EAEAEA",
                                  padding: "2px 8px",
                                }}
                              >
                                <span>Round Off</span>
                                <span style={{ color: "black" }}>
                                  {formData.roundOff > 0 ? "+" : "-"}₹
                                  {Math.abs(formData.roundOff).toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderBottom: "1px solid #EAEAEA",
                                padding: "2px 8px",
                              }}
                            >
                              <span
                                style={{ fontWeight: "700", fontSize: "20px" }}
                              >
                                Total
                              </span>
                              <span
                                style={{
                                  color: "black",
                                  fontWeight: "600",
                                  fontSize: "20px",
                                }}
                              >
                                ₹{formData.totalAmount.toFixed(2)}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "1px 8px",
                              }}
                            >
                              <span>Due Amount</span>
                              <span style={{ color: "black" }}>
                                ₹
                                {Math.max(
                                  0,
                                  formData.totalAmount -
                                    (parseFloat(debitNote.paidAmount) || 0),
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "space-around",
                            borderBottom: "1px solid #EAEAEA",
                          }}
                        >
                          <div
                            style={{
                              borderRight: "",
                              width: "50%",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            }}
                          >
                            <u>Term & Conditions</u>
                            <div
                              style={{
                                marginTop: "10px",
                                fontSize: "12px",
                                textAlign: "center",
                              }}
                            >
                              {terms?.termsText ||
                                "1. This is a debit note for the above mentioned items.\n2. Please adjust this amount in your next payment.\n3. Original invoice: " +
                                  formData.invoiceNumber +
                                  "\n4. Reason: " +
                                  formData.reason
                                    .replace(/_/g, " ")
                                    .toUpperCase()}
                            </div>
                          </div>

                          <div
                            style={{
                              width: "50%",
                              borderLeft: "1px solid #EAEAEA",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                borderTop: "1px solid #EAEAEA",
                                padding: "1px 8px",
                                marginTop: "60px",
                              }}
                            >
                              <span
                                style={{ fontWeight: "500", fontSize: "10px" }}
                              >
                                Signature
                              </span>
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            display: "flex",
                          }}
                        >
                          <span style={{ marginTop: "5px" }}>
                            Status:{" "}
                            <strong>{debitNote.status?.toUpperCase()}</strong>
                            {formData.fullyReceived &&
                              " • ✓ Payment Fully Received"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DebitNoteViewEdit;
