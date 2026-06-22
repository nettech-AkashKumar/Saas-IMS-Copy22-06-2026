import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import DatePicker from "../../../../components/DatePicker";
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";
import { IoChevronDownOutline } from "react-icons/io5";
import { RiDeleteBinLine } from "react-icons/ri";
import { PiCaretUpDownLight } from "react-icons/pi";
import { FiSearch } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

// for preview
import { IoIosCloseCircleOutline } from "react-icons/io";
import { format } from "date-fns";
import { toWords } from "number-to-words";
import CompanyLogo from "../../../../assets/images/kasperlogo.png";
import TaxInvoiceLogo from "../../../../assets/images/taxinvoice.png";
import Qrcode from "../../../../assets/images/qrcode.png";


const CustomerCreditNoteViewEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // State for customer selection (in edit mode)
  const [customerSearch, setCustomerSearch] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [creditNote, setCreditNote] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [terms, setTerms] = useState(null);
  const [template, setTemplate] = useState(null);

  // for preview
  const [viewInvoiceOptions, setViewInvoiceOptions] = useState(false);
  const modelRef = useRef(null);

  // Check if we're in "create from navbar" mode
  const isFromNavbar = !location.state?.customer;

  // Form state - EXACTLY SAME as creation page
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
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
    reason: "returned_goods",
  });

  // Add this function near other handler functions
  const handleViewInvoice = (open) => setViewInvoiceOptions(open);

  // Fetch credit note details
  useEffect(() => {
    if (id) {
      fetchCreditNoteDetails();
    }
  }, [id]);

  // Fetch customer invoices when customer changes
  useEffect(() => {
    if (formData.customerId && isEditMode) {
      fetchCustomerInvoices(formData.customerId);
    }
  }, [formData.customerId, isEditMode]);

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

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsInvoiceOpen(false);
      }
      if (!event.target.closest('.customer-search-container')) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchCreditNoteDetails = async () => {
    try {
      if (!id || id === "all" || !isValidObjectId(id)) {
        toast.error("Invalid credit note ID");
        navigate("/creditnotelist");
        return;
      }
      setLoading(true);
      const response = await api.get(`/api/credit-notes/${id}`);
      const data = response.data.creditNote || response.data;

      console.log("Credit note data from API:", data); // ADD THIS
      console.log("Items in credit note:", data.items); // ADD THIS

      if (!data) {
        toast.error("Credit note not found");
        navigate("/credit-notes");
        return;
      }

      setCreditNote(data);

      // Safe date parsing - handle invalid dates
      let formattedDate;
      try {
        const dateValue = data.date ? new Date(data.date) : new Date();
        // check if date is valid 
        if (isNaN(dateValue.getTime())) {
          throw new Error("Invalid date");
        }
        formattedDate = dateValue.toISOString().split("T")[0];
      } catch (error) {
        // console.warn("Invalid date from API, using current date:", error);
        toast.error(error?.response?.data?.displayMessage || 
              error?.response?.data?.message || 
              error?.message || 
              "Invalid date from API, using current date");
        formattedDate = new Date().toISOString().split("T")[0];
      }


      // Set form data from fetched credit note
      setFormData({
        customerId: data.customerId?._id || data.customerId || "",
        customerName: data.customerName || "",
        phone: data.phone || "",
        invoiceId: data.invoiceId?._id || data.invoiceId || "",
        invoiceNumber: data.invoiceNumber || "",
        // date: new Date(data.date).toISOString().split("T")[0],
        date: formattedDate,
        subtotal: data.subtotal || 0,
        discount: data.totalDiscount || 0,
        shippingCharges: data.shippingCharges || 0,
        autoRoundOff: Math.abs(data.roundOff || 0) > 0,
        roundOff: data.roundOff || 0,
        totalAmount: data.totalAmount || 0,
        fullyReceived: data.fullyReceived || false,
        notes: data.notes || "",
        reason: data.reason || "returned_goods",
      });

      // Convert items to match create form structure
      const itemsFromCreditNote =
        data.items?.map((item, index) => {
          const hsnValue = item.hsnCode ||
            item.hsn ||
            item.productId?.hsnCode ||
            item.productId?.hsn ||
            "";
          return {
            id: index + 1,
            productId: item.productId?._id || item.productId,
            name: item.name || "Product",
            description: item.description || "",
            quantity: item.quantity || 1,
            originalQuantity: item.originalQuantity || item.quantity || 1,
            returnQuantity: item.quantity || 1,
            unit: item.unit || "Pcs",
            hsn: hsnValue,
            hsnCode: hsnValue,
            unitPrice: item.unitPrice || 0,
            tax: `GST @ ${item.taxRate || 5}%`,
            taxRate: item.taxRate || 5,
            taxAmount: item.taxAmount || 0,
            discountPercent: item.discountPercent || 0,
            discountAmount: item.discountAmount || 0,
            amount: item.total || 0,
            isSelected: true,
          }
        }) || [];

      // In view mode, all items are selected and shown in selected items
      setSelectedItems(itemsFromCreditNote);
      setAvailableItems([]); // No available items in view/edit of existing credit note

      // Set customer search for edit mode
      setCustomerSearch(data.customerName || "");
    } catch (error) {
      console.error("Failed to fetch credit note details:", error);
      // toast.error("Failed to load credit note details");
      toast.error(error?.response?.data?.displayMessage || 
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load credit note details");
      navigate("/credit-notes");
    } finally {
      setLoading(false);
    }
  };
  const isValidObjectId = (id) => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  }

  const fetchCustomerInvoices = async (customerId) => {
    try {
      if (!isEditMode) return;

      setLoadingInvoices(true);
      let response;
      try {
        response = await api.get(`/api/invoices/customer/${customerId}`);
      } catch (firstError) {
        try {
          response = await api.get(`/api/invoices?customerId=${customerId}`);
        } catch (secondError) {
          // console.error("No invoice endpoint found");
          toast.error(firstError?.response?.data?.displayMessage ||
                    firstError?.response?.data?.message || 
                    firstError?.message || 
                    "Failed to load customer invoices");
          setCustomerInvoices([]);
          return;
        }
      }

      // Handle response structure
      let invoicesData = [];
      if (Array.isArray(response.data)) {
        invoicesData = response.data;
      } else if (response.data?.invoices && Array.isArray(response.data.invoices)) {
        invoicesData = response.data.invoices;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        invoicesData = response.data.data;
      }

      const validInvoices = invoicesData.filter(
        (invoice) =>
          invoice.status !== 'cancelled' &&
          invoice.status !== 'draft' &&
          invoice.status !== 'void'
      );

      // Sort by date (newest first)
      const sortedInvoices = validInvoices.sort((a, b) =>
        new Date(b.invoiceDate || b.createdAt) - new Date(a.invoiceDate || a.createdAt)
      );

      setCustomerInvoices(sortedInvoices);
    } catch (error) {
      // console.error("Failed to load customer invoices:", error);
      toast.error(error?.response?.data?.displayMessage || 
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load customer invoices");
      setCustomerInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Handle customer search
  const handleCustomerSearch = (searchTerm) => {
    setCustomerSearch(searchTerm);
    setShowCustomerDropdown(true);

    if (!searchTerm.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }

    const filtered = allCustomers.filter((customer) => {
      const name = customer.name || customer.customerName || "";
      const phone = customer.phone || customer.mobile || "";
      const searchLower = searchTerm.toLowerCase();

      return (
        name.toLowerCase().includes(searchLower) || phone.includes(searchTerm)
      );
    });

    setFilteredCustomers(filtered);
  };

  const fetchAllCustomers = async () => {
    try {
      const response = await api.get("/api/customers");
      let customersData = [];
      if (Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        customersData = response.data.data;
      }
      setAllCustomers(customersData);
      setFilteredCustomers(customersData);
    } catch (error) {
      console.error("Failed to load customers:", error);
      // toast.error("Failed to load customers");
      toast.error(error?.response?.data?.displayMessage || 
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load customers");
    }
  };

  const handleCustomerSelect = (customer) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.name || customer.customerName,
      phone: customer.phone || "",
      invoiceId: "",
      invoiceNumber: "",
    }));

    // Clear items when customer changes
    setAvailableItems([]);
    setSelectedItems([]);

    if (isFromNavbar) {
      setCustomerSearch(customer.name || customer.customerName);
      setShowCustomerDropdown(false);
    }
  };

  // Handle invoice selection (only in edit mode)
  const handleInvoiceSelect = async (invoice) => {
    if (!isEditMode) return;

    try {
      // Fetch full invoice details with items
      const invoiceResponse = await api.get(`/api/invoices/${invoice._id}`);
      const invoiceDetails = invoiceResponse.data.invoice || invoiceResponse.data;

      if (!invoiceDetails || !invoiceDetails.items) {
        toast.error("Could not load invoice items");
        return;
      }

      // Map invoice items to available items
      const itemsFromInvoice = await Promise.all(
        invoiceDetails.items.map(async (item, index) => {
          let productName = item.itemName || item.name || "Product";
          let hsnValue = item.hsnCode || item.hsn || "";

          if (item.productId && !item.itemName && !item.name) {
            try {
              const productResponse = await api.get(`/api/products/${item.productId}`);
              if (productResponse.data) {
                const product = productResponse.data.product || productResponse.data;
                productName = product.productName || product.name || "Product";
                hsnValue = product.hsnCode || product.hsn || "";
              }
            } catch (err) {
              // console.error("Failed to fetch product details:", err);
              toast.error(err?.response?.data?.displayMessage || 
                        err?.response?.data?.message || 
                        err?.message || 
                        "Failed to fetch product details");
            }
          }

          return {
            id: index + 1,
            productId: item.productId?._id || item.productId,
            name: productName,
            hsn: hsnValue,
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
        })
      );

      // Set all items as available initially
      setAvailableItems(itemsFromInvoice);
      setSelectedItems([]);

      setFormData((prev) => ({
        ...prev,
        invoiceId: invoiceDetails._id,
        invoiceNumber: invoiceDetails.invoiceNo || invoiceDetails.invoiceNumber || "",
      }));

      setIsInvoiceOpen(false);
      toast.success(`Loaded ${itemsFromInvoice.length} items from invoice`);
    } catch (error) {
      console.error("Failed to load invoice details:", error);
      // toast.error("Failed to load invoice details");
      toast.error(error?.response?.data?.displayMessage || 
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load invoice details");
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
      (selItem) => selItem.id === item.id
    );

    if (existingIndex !== -1) {
      // Update existing
      const updatedSelected = [...selectedItems];
      updatedSelected[existingIndex] = {
        ...updatedSelected[existingIndex],
        returnQuantity: actualQty,
      };
      const recalculatedItem = calculateItemTotal(
        updatedSelected[existingIndex]
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
      (selItem) => selItem.id !== itemId
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
    if (creditNote?.status === "applied" || creditNote?.status === "cancelled") {
      toast.error(`Cannot edit a ${creditNote.status} credit note`);
      return;
    }
    setIsEditMode(!isEditMode);

    // If turning off edit mode, reset to original data
    if (isEditMode) {
      fetchCreditNoteDetails();
    } else {
      // Load customers for dropdown
      fetchAllCustomers();
    }
  };

  const fetchCompanyData = async () => {
    try {
      const res = await api.get(`/api/companyprofile/get`);
      console.log("Company data:", res.data);
      setCompanyData(res.data.data);
    } catch (error) {
      // console.error("Error fetching company profile:", error);
      toast.error(error?.response?.data?.displayMessage || 
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load company profile");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/notes-terms-settings");
      setTerms(res.data.data);
      console.log("Terms data:", res.data);
    } catch (error) {
      // console.error("Error fetching notes & terms settings:", error);
      toast.error(error?.response?.data?.displayMessage || 
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load notes & terms settings");
    }
  };



  const [printSettings, setPrintSettings] = useState({
    showHSN: true,
    showDescription: true,
    showRate: true,
    showTax: true,
    showTotalsInWords: true,
    showBankDetails: true,
    showTermsConditions: true,
    signatureUrl: "",
  });
  const fetchPrintTemplate = async () => {
    try {
      const res = await api.get("/api/print-templates", {
        params: {
          type: "normal",
          includeData: false,
        },
      });

      if (res.data.success && res.data.data) {
        const templateData = res.data.data;
        const template = templateData.template;

        if (template) {
          // ✅ Store the entire template, not just signature
          setTemplate(template);

          // ✅ Set ALL print settings from template
          setPrintSettings({
            showHSN: template.fieldVisibility?.showHSN !== false,
            showDescription:
              template.fieldVisibility?.showDescription !== false,
            showRate: template.fieldVisibility?.showRate !== false,
            showTax: template.fieldVisibility?.showTax !== false,
            showTotalsInWords:
              template.fieldVisibility?.showTotalsInWords !== false,
            showBankDetails:
              template.fieldVisibility?.showBankDetails !== false,
            showTermsConditions:
              template.fieldVisibility?.showTermsConditions !== false,
            signatureUrl: template.signatureUrl || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching print template", error);
      // Set defaults on error
      setPrintSettings({
        showHSN: true,
        showDescription: true,
        showRate: true,
        showTax: true,
        showTotalsInWords: true,
        showBankDetails: true,
        showTermsConditions: true,
        signatureUrl: "",
      });
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchPrintTemplate();
    fetchSettings();
    // fetchSignature();
    // fetchBanks();
  }, []);
  const fetchSignature = async () => {
    try {
      const res = await api.get("/api/print-templates/all");
      setTemplate(res.data.data);
      console.log("Template data:", res.data);
    } catch (error) {
      // console.error("Error fetching template settings:", error);
      toast.error(error?.response?.data?.displayMessage || 
                error?.response?.data?.message || 
                error?.message || 
                "Failed to load template settings");
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
      if (!formData.customerId) {
        toast.error("Please select a customer");
        return;
      }

      if (!formData.invoiceId) {
        toast.error("Please select an invoice");
        return;
      }

      // Check if any selected items have return quantity > 0
      const validItems = selectedItems.filter(
        (item) => (item.returnQuantity || 0) > 0
      );
      if (validItems.length === 0) {
        toast.error("Please set return quantity for selected items");
        return;
      }

      setSaving(true);

      const creditNoteData = {
        date: formData.date,
        notes: formData.notes,
        reason: formData.reason,
        shippingCharges: formData.shippingCharges,
        roundOff: formData.autoRoundOff ? formData.roundOff : 0,
        items: validItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.description || "",
          quantity: item.returnQuantity,
          originalQuantity: item.originalQuantity || item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          total: item.amount,
          hsnCode: item.hsn || item.hsnCode || "",
        })),
        subtotal: formData.subtotal,
        totalDiscount: formData.discount,
        totalAmount: formData.totalAmount,
      };

      console.log("Updating credit note:", creditNoteData);

      const response = await api.put(
        `/api/credit-notes/${id}`,
        creditNoteData
      );

      toast.success("Credit note updated successfully");

      // Turn off edit mode and refresh data
      setIsEditMode(false);
      fetchCreditNoteDetails();

      // If save & print, open print dialog
      if (action === "saveAndPrint") {
        setTimeout(() => {
          navigate("/creditnotelist");
        }, 500);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to update credit note"
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
          <h6 className="section-title">Available for Credit Notes</h6>
          <div className="text-center text-muted py-3">
            No available items. Select an invoice to see items.
          </div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <h6 className="section-title">Available for Credit Notes</h6>
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
                (selItem) => selItem.id === item.id
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
                                  ? calculateItemTotal({ ...selItem, returnQuantity: qty })
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
                                ? calculateItemTotal({ ...selItem, returnQuantity: qty })
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
      {isEditMode 
        ? "Selected for Credit Notes" 
        : creditNote?.status === "approved" 
          ? "Credited Items" 
          : "Items to be Credited"}
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
                            : selItem
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
                            : selItem
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
                            : selItem
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
                                  : selItem
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
                                  : selItem
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

  if (loading) {
    return (
      <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
        <div className="text-center py-5">Loading...</div>
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
        <div className="text-center py-5">Credit note not found</div>
      </div>
    );
  }

  const statusColors = {
    pending: { bg: "#DBEAFE", color: "#1E40AF", label: "Processing" },
  approved: { bg: "#D1FAE5", color: "#065F46", label: "Approved" },
  rejected: { bg: "#FEE2E2", color: "#991B1B", label: "Rejected" },
  };

  const statusInfo = statusColors[creditNote.status] || statusColors.pending;

  return (
    <div>
      <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center">
            <Link to="/creditnotelist" style={{ marginRight: "10px" }}>
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
                Credit Note
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

            {/* Edit Button - Only in view mode for non-applied/cancelled notes */}
            {!isEditMode &&
              creditNote.status !== "approved" &&
              creditNote.status !== "rejected" && (
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

        {/* Customer Details Section */}
        <div
          className="section-card"
          style={{
            padding: "20px",
            height: "auto",
            overflow: "auto",
            maxHeight: "calc(100vh - 160px)",
          }}
        >
          <h6 className="section-title">Customer Details</h6>

          <div className="d-flex justify-content-between mb-4">
            {/* LEFT AREA (Customer + Phone) */}
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              {/* Customer Name */}
              <div className="col-md-7">
                <label className="form-label supplierlabel">
                  Customer Name <span className="text-danger">*</span>
                </label>
                <div
                  className="customer-search-container"
                  style={{ position: "relative" }}
                >
                  {isEditMode ? (
                    <>
                      <input
                        type="text"
                        className="form-control supplierinput shadow-none"
                        placeholder="Search and select customer"
                        style={{
                          border: "1px solid #A2A8B8",
                          backgroundColor: isEditMode ? "#fff" : "#f8f9fa",
                          cursor: isEditMode ? "text" : "default",
                          paddingRight: isEditMode ? "40px" : "10px",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                        value={customerSearch}
                        readOnly={!isEditMode}
                        onChange={(e) => {
                          handleCustomerSearch(e.target.value);
                        }}
                        onFocus={() => {
                          if (isEditMode && allCustomers.length === 0) {
                            fetchAllCustomers();
                          }
                          if (isEditMode) {
                            setShowCustomerDropdown(true);
                          }
                        }}
                      />

                      {/* Icons for edit mode */}
                      {isEditMode && (
                        <div
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                        >
                          {/* Show search icon when no customer selected */}
                          {!formData.customerId && (
                            <FiSearch
                              style={{
                                color: "#666",
                                pointerEvents: "none",
                              }}
                            />
                          )}

                          {/* Show cross icon when customer is selected */}
                          {formData.customerId && (
                            <IoClose
                              style={{
                                color: "#666",
                                cursor: "pointer",
                                fontSize: "20px",
                                padding: "2px",
                                borderRadius: "50%",
                                backgroundColor: "#f0f0f0",
                                transition: "all 0.2s",
                              }}
                              onClick={() => {
                                // Clear customer and reset form for non-ID route
                                setFormData((prev) => ({
                                  ...prev,
                                  customerId: "",
                                  customerName: "",
                                  phone: "",
                                  invoiceId: "",
                                  invoiceNumber: "",
                                  subtotal: 0,
                                  discount: 0,
                                  totalAmount: 0,
                                }));
                                setCustomerSearch("");
                                setAvailableItems([]);
                                setSelectedItems([]);
                                setCustomerInvoices([]);
                                setShowCustomerDropdown(true);

                                // Focus back on the input
                                setTimeout(() => {
                                  const input = document.querySelector(
                                    ".customer-search-container input",
                                  );
                                  if (input) input.focus();
                                }, 100);
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#e0e0e0";
                                e.currentTarget.style.color = "#ff4444";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#f0f0f0";
                                e.currentTarget.style.color = "#666";
                              }}
                              title="Clear customer and search another"
                            />
                          )}
                        </div>
                      )}

                      {/* Customer Dropdown (only in edit mode) */}
                      {isEditMode && showCustomerDropdown && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: "2px",
                            backgroundColor: "#FFFFFF",
                            borderRadius: "8px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                            border: "1px solid #E5E7EB",
                            overflow: "hidden",
                            zIndex: 1000,
                            maxHeight: "300px",
                            overflowY: "auto",
                            width: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          {filteredCustomers.length === 0 ? (
                            <div className="p-3 text-center text-muted">
                              {customerSearch.trim()
                                ? "No customers found"
                                : "Type to search customers"}
                            </div>
                          ) : (
                            filteredCustomers.map((customer) => (
                              <div
                                key={customer._id}
                                className="customer-dropdown-item"
                                style={{
                                  padding: "12px 16px",
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f0f0f0",
                                  transition: "background-color 0.2s",
                                }}
                                onClick={() => {
                                  handleCustomerSelect(customer);
                                  setCustomerSearch(
                                    customer.name || customer.customerName || "",
                                  );
                                  setShowCustomerDropdown(false);
                                }}
                                onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "#f5f5f5")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.backgroundColor = "white")
                                }
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <div
                                      style={{ fontWeight: "500", color: "#333" }}
                                    >
                                      {customer.name || customer.customerName || ""}
                                    </div>
                                    <div
                                      style={{ fontSize: "12px", color: "#666" }}
                                    >
                                      {customer.phone ||
                                        customer.mobile ||
                                        "No phone"}
                                    </div>
                                  </div>
                                  <small
                                    style={{ color: "#888", fontSize: "12px" }}
                                  >
                                    {customer.email || ""}
                                  </small>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control supplierinput shadow-none"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #A2A8B8",
                        backgroundColor: "#f8f9fa",
                        cursor: "default",
                      }}
                      value={formData.customerName}
                      readOnly
                    />
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="col-md-7">
                <label className="form-label supplierlabel">Phone No.</label>
                <div className="input-group">
                  <span
                    className="input-group-text bg-white"
                    style={{ border: "1px solid #A2A8B8" }}
                  >
                    <img
                      src="https://flagcdn.com/in.svg"
                      alt="India"
                      width="20"
                      className="me-1"
                    />
                    +91
                  </span>
                  <input
                    type="tel"
                    className="form-control supplierinput shadow-none"
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

            {/* Middle line */}
            <div
              style={{
                width: "1px",
                height: "70px",
                backgroundColor: "#E0E0E0",
                margin: "0 20px",
              }}
            ></div>

            {/* RIGHT SIDE (Customer Invoice No + Date) */}
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
                      {formData.invoiceNumber || "Customer Invoice No"}
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
                      ) : customerInvoices.length === 0 ? (
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
                        customerInvoices.map((invoice) => (
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
                            {invoice.dueAmount > 0 &&
                              ` — Due ₹${invoice.dueAmount.toFixed(2)}`}
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
          {/* TABLE RENDERING LOGIC */}
          {!isEditMode ? (
            <>
              {/* In View mode: Show "In Process" table */}
              {renderInProcessTable()}

              {/* In View mode: Also show "Available for Credit Notes" table */}
              <div className="mb-4">
                <h6 className="section-title">Available for Credit Notes</h6>
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
              {/* In Edit mode: Show "Available for Credit Notes" table (with checkboxes) */}
              {renderAvailableItemsTable()}

              {/* In Edit mode: Show "Selected for Credit Notes" */}
              {renderInProcessTable()}
            </>
          )}

          {/* Payment + Summary */}
          <div className="row">
            <div className="col-md-7">
              <div className="">
                <h6 className="section-title" style={{ color: "#0E101A" }}>
                  Payment Details
                </h6>
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
            </div>

            <div className="col-md-5">
              <div className="p-4">
                <div className="summary-line">
                  <span
                    style={{
                      color: "#0E101A",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "120%",
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
                    }}
                  >
                    {formData.roundOff > 0 ? "+" : ""}₹
                    {Math.abs(formData.roundOff).toFixed(2)}
                  </span>
                </div>
                <hr style={{ color: "#727681" }} />
                <div className="summary-line">
                  <h5 style={{ color: "#0E101A", lineHeight: "120%" }}>
                    Total Credit Amount :-
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

                {formData.fullyReceived && (
                  <div
                    className="mt-3 p-3"
                    style={{
                      backgroundColor: "#D1FAE5",
                      borderRadius: "8px",
                      border: "1px solid #A7F3D0",
                    }}
                  >
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={formData.fullyReceived}
                        onChange={(e) =>
                          handleFormChange("fullyReceived", e.target.checked)
                        }
                        disabled={!isEditMode || creditNote.status === "applied"}
                        style={{ cursor: isEditMode ? "pointer" : "default" }}
                      />
                      <label
                        className="form-check-label"
                        style={{
                          color: "#065F46",
                          fontWeight: 500,
                          fontSize: "16px",
                        }}
                      >
                        Fully Settled
                      </label>
                    </div>
                  </div>
                )}

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
                        !formData.customerId ||
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
                        !formData.customerId ||
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
        {/* Preview Modal - You can copy the same preview modal from your Debit Note */}
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
                            <img
                              src={TaxInvoiceLogo}
                              alt="tax invoice"
                              style={{ width: "100%", objectFit: "contain" }}
                            />
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
                            CREDIT NOTE Date -{" "}
                            {format(new Date(formData.date), "dd MMM yyyy")}
                          </span>
                          <span style={{ marginRight: "12px" }}>
                            CREDIT NOTE No. -{" "}
                            {creditNote.creditNoteNumber ||
                              "CN-" + creditNote._id?.slice(-6)}
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
                            <span>Customer Details</span>
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
                                {formData.customerName}
                              </span>
                            </div>
                            <div>
                              Address :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {/* Add customer address if available */}
                                {creditNote.customerId?.address?.city ||
                                  creditNote.customerId?.city ||
                                  creditNote.customerId?.address || "N/A"}
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
                                {/* Add customer email if available */}
                                {creditNote.customerId?.email || "N/A"}
                              </span>
                            </div>
                            <div style={{ marginTop: "0px" }}>
                              GSTIN :{" "}
                              <span
                                style={{ color: "black", fontWeight: "600" }}
                              >
                                {/* Add customer GSTIN if available */}
                                {creditNote.customerId?.gstin || "N/A"}
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
                              {console.log("selectedItemsss", selectedItems)}
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
                                    {item.hsn || (item.hsnCode || "-")}
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
                                Total Credit Amount
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
                              <span>Applied Amount</span>
                              <span style={{ color: "black" }}>
                                ₹
                                {(creditNote.appliedAmount || 0).toFixed(2)}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "1px 8px",
                              }}
                            >
                              <span>Remaining Credit</span>
                              <span style={{ color: "black" }}>
                                ₹
                                {Math.max(
                                  0,
                                  formData.totalAmount - (creditNote.appliedAmount || 0)
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
                                `1. This is a credit note for the above mentioned items.
2. This credit note can be applied against future invoices.
3. Original invoice: ${formData.invoiceNumber}
4. Reason: ${(formData.reason || "returned_goods").replace(/_/g, " ").toUpperCase()}
5. Valid for 12 months from the date of issue.
6. Credit note must be applied within the validity period.`}
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
                              {printSettings.signatureUrl ? (
                                <img
                                  src={printSettings.signatureUrl}
                                  alt="Signature"
                                  style={{
                                    maxWidth: "150px",
                                    maxHeight: "60px",
                                    objectFit: "contain",
                                    marginBottom: "5px",
                                  }}
                                  onError={(e) => {
                                    console.log(
                                      "Signature failed to load:",
                                      printSettings.signatureUrl,
                                    );
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div style={{ fontWeight: 500, fontSize: 10 }}>
                                  Signature
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            width: "100%",
                            justifyContent: "center",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "10px",
                          }}
                        >
                          <span>
                            Status:{" "}
                            <strong>{creditNote.status?.toUpperCase()}</strong>
                            {formData.fullyReceived &&
                              " • ✓ Fully Settled"}
                          </span>
                          {formData.invoiceNumber && (
                            <span style={{ fontSize: "12px", color: "#666" }}>
                              Original Invoice: {formData.invoiceNumber}
                            </span>
                          )}
                          {creditNote.appliedToInvoice && (
                            <span style={{ fontSize: "12px", color: "#666" }}>
                              Applied to Invoice: {creditNote.appliedToInvoice}
                            </span>
                          )}
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

export default CustomerCreditNoteViewEdit;