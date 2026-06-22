import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

// pages
import "./CreditNote.css";
import InvoicePreviewModal from "../../../../components/InvoicePreviewModal";
import DatePicker from "../../../../components/DatePicker";
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import api from "../../../../pages/config/axiosInstance";

// icons
import { IoChevronDownOutline } from "react-icons/io5";
import { FiSearch } from "react-icons/fi";
import { IoClose } from "react-icons/io5";
import { RiDeleteBinLine } from "react-icons/ri";
import { PiCaretUpDownLight } from "react-icons/pi";

// images
import indialogo from "../../../../assets/images/india-logo.png";

const CustomerCreditNote = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State for customer selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // modal state
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  // for invoice search
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [totalCredited, setTotalCredited] = useState(0);
  const [balanceWarning, setBalanceWarning] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const dropdownRef = useRef(null);

  // Add taxSettings state
  const [taxSettings, setTaxSettings] = useState({
    enableGSTBilling: true,
    priceIncludeGST: true,
    defaultGSTRate: "18",
    autoRoundOff: "0"
  })

  // Check if we're in "create from navbar" mode
  const isFromNavbar = !location.state?.customer;

  // NEW STATE: Dual-table structure like Supplier Debit Note
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    customerId: "",
    customerName: "",
    phone: "",
    invoiceId: "", // This will store the actual invoice ID
    invoiceNumber: "", // This will store the invoice number for display
    date: new Date().toISOString().split("T")[0],
    subtotal: 0,
    discount: 0,
    totalTax: 0,
    shippingCharges: 0,
    // autoRoundOff: false,
    roundOff: 0,
    totalAmount: 0,
    fullyReceived: false,
    notes: "",
  });

  // Fetch customers and products on component mount
  useEffect(() => {
    fetchCustomers();
    fetchProducts();

    // If customer passed from navigation
    if (location.state?.customer) {
      handleCustomerSelect(location.state.customer);
    }
  }, []);

  // Fetch customer invoices when customer changes
  useEffect(() => {
    if (formData.customerId) {
      fetchCustomerInvoices(formData.customerId);
    } else {
      setCustomerInvoices([]);
      setFormData((prev) => ({
        ...prev,
        invoiceId: "",
        invoiceNumber: "",
      }));
      setAvailableItems([]);
      setSelectedItems([]);
    }
  }, [formData.customerId]);

  // Recalculate totals when selected items or other values change
  useEffect(() => {
    calculateTotals();
  }, [selectedItems, formData.shippingCharges, formData.autoRoundOff]);

  // Fetch customers for search (when in navbar mode)
  useEffect(() => {
    if (isFromNavbar) {
      fetchCustomers();
    }
  }, [isFromNavbar]);


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

  // Handle customer search
  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers(allCustomers);
      return;
    }
    const searchTerm = customerSearch.toLowerCase();
    const filtered = allCustomers.filter((cust) =>
      cust.name?.toLowerCase().includes(searchTerm) ||
      cust.phone?.includes(customerSearch) ||
      cust.email?.toLowerCase().includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  }, [customerSearch, allCustomers]);

  const handleBack = () => {
    navigate(location.state?.from || -1);
  }
  // fetch tax settings on component mount
  useEffect(() => {
    const loadTaxSettings = async () => {
      try {
        const response = await api.get('/api/tax-gst-settings');
        if (response.data.success) {
          const data = response.data.data;
          setTaxSettings({
            enableGSTBilling: data.enableGSTBilling !== false,
            priceIncludeGST: data.priceIncludeGST !== false,
            defaultGSTRate: data.defaultGSTRate || "18",
            autoRoundOff: data.autoRoundOff || "0"
          });
        }
      } catch (error) {
        // console.error("Error fetching tax settings:", error);
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load tax settings");
      }
    };
    loadTaxSettings();
  }, []);

  // Add this useEffect to load invoice data for conversion to credit note
  useEffect(() => {
    const loadInvoiceForConversion = async () => {
      const sourceInvoice = location.state?.sourceInvoice;
      const isFromInvoice = location.state?.isFromInvoice || false;
      const autoFill = location.state?.autoFill || false;


      if (sourceInvoice && isFromInvoice) {

        try {
          // The invoice data is already passed in the state
          const completeInvoice = sourceInvoice;

          if (!completeInvoice) {
            toast.error("No invoice data found");
            return;
          }

          // ========== 1. SET CUSTOMER DATA ==========
          if (completeInvoice.customerId) {
            const customerData = completeInvoice.customerId;

            // Format address if needed
            const addressParts = [];
            if (customerData.address) addressParts.push(customerData.address);
            if (customerData.city) addressParts.push(customerData.city);
            if (customerData.state) addressParts.push(customerData.state);
            if (customerData.country) addressParts.push(customerData.country);
            if (customerData.pincode) addressParts.push(customerData.pincode);

            setFormData(prev => ({
              ...prev,
              customerId: customerData._id,
              customerName: customerData.name || "",
              phone: customerData.phone || "",
              invoiceId: completeInvoice._id,
              invoiceNumber: completeInvoice.invoiceNo || "",
              date: new Date().toISOString().split("T")[0],
            }));

            // For navbar mode (isFromNavbar)
            if (!location.state?.customer) {
              setCustomerSearch(customerData.name || "");
            }

          }

          // ========== 2. CONVERT INVOICE ITEMS TO CREDIT NOTE ITEMS ==========
          if (completeInvoice.items && completeInvoice.items.length > 0) {

            const itemsFromInvoice = completeInvoice.items.map((item, index) => {
              let productName = item.itemName;
              let description = item.description || "";
              let unit = item.unit || "Pcs";
              let unitPrice = item.unitPrice || 0;
              let taxRate = item.taxRate || 0;
              let taxAmount = item.taxAmount || 0;
              let discountPercent = item.discountPct || 0;
              let discountAmount = item.discountAmt || 0;
              let amount = item.amount || 0;

              // If productId is populated (object), use its properties
              if (item.productId && typeof item.productId === 'object') {
                productName = item.productId.productName || item.itemName;
                description = item.productId.description || item.description || "";
                unit = item.productId.unit || item.unit || "Pcs";
                unitPrice = item.productId.sellingPrice || item.unitPrice || 0;
                if (item.productId.tax) {
                  const taxMatch = item.productId.tax.match(/\d+/);
                  taxRate = taxMatch ? parseFloat(taxMatch[0]) : item.taxRate || 0;
                }
              }

              return {
                id: index + 1,
                productId: item.productId?._id || item.productId,
                name: productName,
                description: description,
                quantity: item.qty || item.quantity || 1,
                originalQuantity: item.qty || item.quantity || 1,
                unit: unit,
                unitPrice: unitPrice,
                tax: `GST @ ${taxRate}%`,
                taxRate: taxRate,
                taxAmount: taxAmount,
                discountPercent: discountPercent,
                discountAmount: discountAmount,
                amount: amount,
                isSelected: false,
              };
            });

            setAvailableItems(itemsFromInvoice);
            setSelectedItems([]);
            toast.success(`Loaded ${itemsFromInvoice.length} items from invoice. Select items to return.`);
          } else {
            toast.warning("No items found in the invoice");
          }
        } catch (error) {
          console.error("Error processing invoice details:", error);
          toast.error(error?.response?.data?.message || "Failed to load invoice details");
        }
      }
    };

    loadInvoiceForConversion();
  }, [location.state]);



  const fetchCustomers = async () => {
    try {
      const response = await api.get("/api/customers");
      // Handle different response structures
      let customersData = [];
      if (Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        customersData = response.data.data;
      }
      setCustomers(customersData);
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

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/products");
      // Handle different response structures
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      }
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load products:", error);
      // toast.error("Failed to load products");
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load products");
    }
  };

  const fetchCustomerInvoices = async (customerId) => {
    try {
      setLoadingInvoices(true);
      // Try different endpoints
      let response;
      try {
        response = await api.get(`/api/invoices/customer/${customerId}`);
      } catch (firstError) {
        try {
          response = await api.get(`/api/invoices?customerId=${customerId}`);
        } catch (secondError) {
          // console.error("No invoice endpoint found");
          toast.error(error?.error?.response?.data?.displayMessage ||
            error?.error?.response?.data?.message ||
            error?.error?.message ||
            "Failed to load customer invoices");
          setCustomerInvoices([]);
          setFilteredInvoices([]);
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
      setFilteredInvoices(sortedInvoices);  // ADD THIS LINE
      setInvoiceSearch("");

      if (sortedInvoices.length === 0) {
        toast.info("No invoices found for this customer");
      }
    } catch (error) {
      // console.error("Failed to load customer invoices:", error);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load customer invoices");
      setCustomerInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };
  const filterInvoices = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredInvoices(customerInvoices);
      return;
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = customerInvoices.filter((invoice) => {
      const invoiceNumber = (invoice.invoiceNo || invoice.invoiceNumber || "").toLowerCase();
      const totalAmount = (invoice.totalAmount || invoice.grandTotal || 0).toString();
      return invoiceNumber.includes(searchLower) || totalAmount.includes(searchLower);
    });
    setFilteredInvoices(filtered);
  };

  // Search all invoices without requiring customer
  const searchAllInvoices = async (searchTerm) => {
    try {
      setLoadingInvoices(true);

      // If search term is empty, clear results
      if (!searchTerm.trim()) {
        setFilteredInvoices([]);
        setLoadingInvoices(false);
        return;
      }

      // Search invoices by invoice number or customer name
      const response = await api.get("/api/invoices", {
        params: {
          search: searchTerm,
          limit: 20,
          page: 1
        }
      });

      const invoices = response.data.invoices || response.data.data || [];

      // Filter only valid invoices (not cancelled/draft/void)
      const validInvoices = invoices.filter(
        (invoice) =>
          invoice.status !== 'cancelled' &&
          invoice.status !== 'draft' &&
          invoice.status !== 'void'
      );
      const processedInvoices = validInvoices.map(invoice => ({
        ...invoice,
        customerName: invoice.customerName || invoice.customerId?.name || "N/A"
      }));

      setFilteredInvoices(processedInvoices);
    } catch (error) {
      console.error("Error searching invoices:", error);
      setFilteredInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Search invoices by number ONLY (not by customer name)
const searchInvoiceByNumber = async (searchTerm) => {
  try {
    setLoadingInvoices(true);
    
    if (!searchTerm.trim()) {
      setFilteredInvoices([]);
      setLoadingInvoices(false);
      return;
    }
    
    const response = await api.get("/api/invoices", {
      params: {
        search: searchTerm.trim(),
        limit: 20,
        page: 1
      }
    });
    
    const invoices = response.data.invoices || response.data.data || [];
    
    const validInvoices = invoices.filter(
      (invoice) =>
        invoice.status !== 'cancelled' &&
        invoice.status !== 'draft' &&
        invoice.status !== 'void'
    );
    
    const processedInvoices = validInvoices.map(invoice => ({
      ...invoice,
      customerName: invoice.customerName || invoice.customerId?.name || "N/A"
    }));
    
    setFilteredInvoices(processedInvoices);
  } catch (error) {
    console.error("Error searching invoices:", error);
    setFilteredInvoices([]);
  } finally {
    setLoadingInvoices(false);
  }
};
  // Fetch remaining credit balance for invoice
  const fetchRemainingBalance = async (invoiceId) => {
    if (!invoiceId) return;

    try {
      setIsCheckingBalance(true);
      const response = await api.get(`/api/credit-notes/invoice/${invoiceId}/remaining-balance`);

      if (response.data.success) {
        const { invoiceTotal, totalCredited, remainingBalance } = response.data.data;
        setInvoiceTotal(invoiceTotal);
        setTotalCredited(totalCredited);
        setRemainingBalance(remainingBalance);

        if (remainingBalance <= 0) {
          setBalanceWarning(`This invoice has been fully credited (₹${totalCredited.toLocaleString('en-IN')} out of ₹${invoiceTotal.toLocaleString('en-IN')}). No more credit notes can be created.`);
        } else if (remainingBalance < invoiceTotal * 0.2) {
          setBalanceWarning(`⚠️ Only ₹${remainingBalance.toLocaleString('en-IN')} remains available for credit notes out of ₹${invoiceTotal.toLocaleString('en-IN')}`);
        } else {
          setBalanceWarning(`Available credit balance: ₹${remainingBalance.toLocaleString('en-IN')} out of ₹${invoiceTotal.toLocaleString('en-IN')}`);
        }
      }
    } catch (error) {
      setBalanceWarning("Could not fetch remaining balance information");
    } finally {
      setIsCheckingBalance(false);
    }
  };


  const handleCustomerSearch = (searchTerm) => {
    setCustomerSearch(searchTerm);
    setShowCustomerDropdown(true);

    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter((customer) => {
      const name = customer.name || customer.customerName || "";
      const phone = customer.phone || customer.mobile || "";
      const searchLower = searchTerm.toLowerCase();

      return (
        name.toLowerCase().includes(searchLower) || phone.includes(searchTerm)
      );
    });

    setFilteredCustomers(filtered);
  };

  const handleCustomerSelect = (customer) => {
    setFormData((prev) => ({
      ...prev,
      customerId: customer._id,
      customerName: customer.name,
      phone: customer.phone || "",
      invoiceId: "",
      invoiceNumber: "",
    }));

    // Clear items when customer changes
    setAvailableItems([]);
    setSelectedItems([]);

    if (isFromNavbar) {
      setCustomerSearch(customer.name);
      setShowCustomerDropdown(false);
    }
  };

  const handleClearCustomer = () => {
    setFormData((prev) => ({
      ...prev,
      customerId: "",
      customerName: "",
      phone: "",
      invoiceId: "",
      invoiceNumber: "",
    }));
    setAvailableItems([]);
    setSelectedItems([]);

    if (isFromNavbar) {
      setCustomerSearch("");
    }
  };


  const handleInvoiceSelect = async (invoice) => {
    try {
      // If invoice is from search, it might not have full customer details
      let fullInvoice = invoice;

      // If invoice doesn't have customerId object, fetch full details
      if (!invoice.customerId || typeof invoice.customerId === 'string' || !invoice.customerId.name) {
        const invoiceResponse = await api.get(`/api/invoices/${invoice._id}`);
        fullInvoice = invoiceResponse.data.invoice || invoiceResponse.data;
      }

      // Now fetch remaining balance
      await fetchRemainingBalance(fullInvoice._id);

      if (remainingBalance !== null && remainingBalance <= 0) {
        toast.error("Cannot create credit note. Invoice has already been fully credited.");
        return;
      }

      // Set customer data from full invoice
      if (fullInvoice.customerId) {
        const customerData = fullInvoice.customerId;
        const addressParts = [];
        if (customerData.address) addressParts.push(customerData.address);
        if (customerData.city) addressParts.push(customerData.city);
        if (customerData.state) addressParts.push(customerData.state);
        if (customerData.country) addressParts.push(customerData.country);
        if (customerData.pincode) addressParts.push(customerData.pincode);

        setFormData(prev => ({
          ...prev,
          customerId: customerData._id,
          customerName: customerData.name || "",
          phone: customerData.phone || "",
          invoiceId: fullInvoice._id,
          invoiceNumber: fullInvoice.invoiceNo || fullInvoice.invoiceNumber || "",
        }));

        // Set customer search
        setCustomerSearch(customerData.name || "");
      }

      if (!fullInvoice.items || fullInvoice.items.length === 0) {
        toast.error("Could not load invoice items");
        return;
      }

      // Map invoice items to available items
      const itemsFromInvoice = await Promise.all(
        fullInvoice.items.map(async (item, index) => {
          let productName = item.itemName || item.name || "Product";

          if (item.productId && !item.itemName && !item.name) {
            try {
              const productResponse = await api.get(`/api/products/${item.productId}`);
              if (productResponse.data) {
                const product = productResponse.data.product || productResponse.data;
                productName = product.productName || product.name || "Product";
              }
            } catch (err) {
              // console.error("Failed to fetch product details:", err);
            }
          }

          return {
            id: index + 1,
            productId: item.productId?._id || item.productId,
            name: productName,
            description: item.description || "",
            quantity: item.qty || item.quantity || 1,
            originalQuantity: item.qty || item.quantity || 1,
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

      setAvailableItems(itemsFromInvoice);
      setSelectedItems([]);

      toast.success(`Loaded ${itemsFromInvoice.length} items from invoice`);
    } catch (error) {
      console.error("Failed to load invoice details:", error);
      toast.error(error?.response?.data?.message || "Failed to load invoice details");
    }
  };
  // ===== DUAL-TABLE HANDLERS (Same as Supplier Debit Note) =====

  // Select item with quantity
  const handleSelectItem = (item, quantity) => {
    if (quantity <= 0) return;
    // Calculate current total of selected items
    const currentTotal = selectedItems.reduce((sum, selItem) => {
      return sum + ((selItem.returnQuantity || 0) * (selItem.unitPrice || 0));
    }, 0);

    const newItemTotal = quantity * (item.unitPrice || 0);
    const newGrandTotal = currentTotal + newItemTotal;

    // Check against remaining balance
    if (remainingBalance !== null && newGrandTotal > remainingBalance) {
      toast.error(`Cannot add item. Total would exceed remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}`);
      return;
    }

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
      setSelectedItems(updatedSelected);
    } else {
      // Add new
      const itemToSelect = {
        ...item,
        isSelected: true,
        returnQuantity: actualQty,
        originalQuantity: item.quantity,
      };
      calculateItemTotal(itemToSelect);
      setSelectedItems([...selectedItems, itemToSelect]);
    }
  };

  // Update quantity of already selected item
  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const item = availableItems.find((avItem) => avItem.id === itemId);
    if (!item) return;
    // Calculate current total excluding this item
    const currentTotalExcludingItem = selectedItems.reduce((sum, selItem) => {
      if (selItem.id !== itemId) {
        return sum + ((selItem.returnQuantity || 0) * (selItem.unitPrice || 0));
      }
      return sum;
    }, 0);

    const newItemTotal = newQuantity * (item.unitPrice || 0);
    const newGrandTotal = currentTotalExcludingItem + newItemTotal;

    if (remainingBalance !== null && newGrandTotal > remainingBalance) {
      toast.error(`Quantity would exceed remaining balance. Available: ₹${remainingBalance.toLocaleString('en-IN')}`);
      return;
    }

    const maxAllowed = item.quantity;
    const actualQty = Math.min(newQuantity, maxAllowed);

    const updatedSelected = selectedItems.map((selItem) =>
      selItem.id === itemId
        ? { ...selItem, returnQuantity: actualQty }
        : selItem
    );

    setSelectedItems(updatedSelected);
  };

  // Remove item from selected
  const handleRemoveItem = (itemId) => {
    const updatedSelected = selectedItems.filter(
      (selItem) => selItem.id !== itemId
    );
    setSelectedItems(updatedSelected);
  };

  // Calculate individual item total
  const calculateItemTotal = (item) => {
    if (!item) return;

    const subtotal = (item.returnQuantity || 0) * (item.unitPrice || 0);
    let discountAmount = item.discountAmount || 0;

    if (item.discountPercent > 0) {
      discountAmount = subtotal * (item.discountPercent / 100);
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);

    // Apply tax only if GST billing is enabled

    // const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
    const taxAmount = taxSettings.enableGSTBilling ? taxableAmount * ((item.taxRate || 0) / 100) : 0;
    const total = taxableAmount + taxAmount;

    item.discountAmount = parseFloat(discountAmount.toFixed(2));
    item.taxAmount = parseFloat(taxAmount.toFixed(2));
    item.amount = parseFloat(total.toFixed(2));
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

    // let totalAmount =
    //   subtotal + totalTax - totalDiscount + (formData.shippingCharges || 0);

    let totalAmount = subtotal - totalDiscount + (formData.shippingCharges || 0);

    // Add tax only if GST billing is enabled
    if (taxSettings.enableGSTBilling) {
      totalAmount += totalTax;
    }

    let roundOff = 0;
    // if (formData.autoRoundOff) {
    //   roundOff = Math.round(totalAmount) - totalAmount;
    //   totalAmount = Math.round(totalAmount);
    // }
    if (taxSettings.autoRoundOff !== "0" && taxSettings.enableGSTBilling) {
      const roundValue = parseInt(taxSettings.autoRoundOff);
      if (roundValue > 0) {
        const roundedTotal = Math.round(totalAmount / roundValue) * roundValue;
        roundOff = roundedTotal - totalAmount;
        totalAmount = roundedTotal;
      }
    }

    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      totalTax: parseFloat(totalTax.toFixed(2)),
      roundOff: parseFloat(roundOff.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    }));
  };

  // Handle form submission - SIMPLIFIED VERSION (no special endpoint)
  const handleSubmit = async (action) => {
    try {
      // Validation
      if (!formData.customerId) {
        toast.error(
          isFromNavbar
            ? "Please search and select a customer first"
            : "Please select a customer"
        );
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
      if (remainingBalance !== null && formData.totalAmount > remainingBalance) {
        toast.error(`Total amount exceeds remaining balance. Available: ₹${remainingBalance.toLocaleString('en-IN')}`);
        return;
      }
      setLoading(true);

      // Use the SAME credit note data structure for ALL cases
      const creditNoteData = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        phone: formData.phone,
        invoiceId: formData.invoiceId,
        invoiceNumber: formData.invoiceNumber,
        date: formData.date,
        reason: "returned_goods",
        items: validItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.description || "",
          quantity: item.returnQuantity,
          originalQuantity: item.originalQuantity || item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: taxSettings.enableGSTBilling ? item.taxRate : 0,
          taxAmount: item.taxAmount,
          taxType: `GST ${item.taxRate}%`,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          total: item.amount,
        })),
        subtotal: formData.subtotal,
        totalTax: formData.totalTax,
        taxSettings: taxSettings,
        totalDiscount: formData.discount,
        shippingCharges: formData.shippingCharges,
        roundOff: formData.roundOff,
        totalAmount: formData.totalAmount,
        // status: action === "save" ? "draft" : "issued",
        status: "pending",
        notes: formData.notes,
        fullyReceived: formData.fullyReceived,
      };

      // ALWAYS use the regular credit notes endpoint
      const response = await api.post("/api/credit-notes", creditNoteData);

      toast.success(
        `Credit note ${action === "save" ? "saved as issued" : "issued successfully"}`
      );

      // Navigate based on action
      navigate("/skeleton?redirect=/creditnotelist");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to save credit note"
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== RENDER FUNCTIONS =====
  const renderBalanceIndicator = () => {
    if (!formData.invoiceId || remainingBalance === null) return null;

    return (
      <div className="mb-3 p-3" style={{
        backgroundColor: remainingBalance <= 0 ? "#FEF2F2" : "#F0FDF4",
        borderRadius: "8px",
        border: `1px solid ${remainingBalance <= 0 ? "#FEE2E2" : "#DCFCE7"}`,
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <span style={{ fontWeight: 500, color: "#374151" }}>
            Invoice Credit Balance
          </span>
          <span style={{
            fontWeight: 600,
            fontSize: "16px",
            color: remainingBalance <= 0 ? "#DC2626" : "#059669"
          }}>
            ₹{remainingBalance.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="d-flex justify-content-between mt-2">
          <small style={{ color: "#6B7280" }}>
            Total Invoice: ₹{invoiceTotal.toLocaleString('en-IN')}
          </small>
          <small style={{ color: "#6B7280" }}>
            Already Credited: ₹{totalCredited.toLocaleString('en-IN')}
          </small>
        </div>
        {balanceWarning && (
          <div className="mt-2" style={{
            fontSize: "13px",
            color: remainingBalance <= 0 ? "#DC2626" : "#D97706",
            fontWeight: 500
          }}>
            {balanceWarning}
          </div>
        )}
      </div>
    );
  };

  // Render Available Items Table
  const renderAvailableItemsTable = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 16,
        display: "inline-flex",
      }}
    >
      <div
        style={{
          alignSelf: "stretch",
          justifyContent: "space-between",
          alignItems: "center",
          display: "inline-flex",
        }}
      >
        <div
          style={{
            color: "var(--Black-Black, #0E101A)",
            fontSize: 16,
            fontFamily: "Inter",
            fontWeight: "500",
            lineHeight: "19.20px",
            wordWrap: "break-word",
          }}
        >
          Available for Credit Notes
        </div>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          zIndex: 999,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: "max-content",
            minWidth: "100%",
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 6,
            paddingBottom: 6,
            background: "#E5F0FF",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          {/* left */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 80,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Sl No.
              </div>
            </div>

            <div
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Items
              </div>
            </div>
          </div>

          {/* right */}
          <div
            style={{
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              display: "flex",
            }}
          >
            {/* Available Qty */}
            <div
              style={{
                width: 120,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Available Qty
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Unit */}
            <div
              style={{
                width: 110,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Unit
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* unit price */}
            <div
              style={{
                width: 110,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Unit Price
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Tax */}
            <div
              style={{
                width: 120,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Tax
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Tax Amount */}
            <div
              style={{
                width: 120,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Tax Amount
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Discount */}
            <div
              style={{
                width: 200,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Discount
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Amount */}
            <div
              style={{
                width: 120,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Amount
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            alignSelf: "stretch",
            minHeight: "auto",
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
            background: "white",
            borderBottomRightRadius: 8,
            borderBottomLeftRadius: 8,
            borderLeft: "1px var(--White-Stroke, #EAEAEA) solid",
            borderRight: "1px var(--White-Stroke, #EAEAEA) solid",
            borderBottom: "1px var(--White-Stroke, #EAEAEA) solid",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "flex",
          }}
        >
          {availableItems.length > 0 ? (
            availableItems.map((item) => {
              const selectedItem = selectedItems.find(
                (selItem) => selItem.id === item.id
              );
              const isSelected = !!selectedItem;
              const selectedQty = selectedItem ? selectedItem.returnQuantity : 0;
              const remainingQty = Math.max(0, item.quantity - selectedQty);

              return (
                <div key={item.id}
                  style={{
                    width: "100%",
                    // height: 46,
                    background: "white",
                    borderBottom: "1px var(--White-Stroke, #EAEAEA) solid",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    display: "flex",
                    position: "relative",
                    // zIndex: activeSearchId === item.id ? 0 : 1,
                    overflow: "visible",
                  }}
                  className="product-row"
                >
                  <div
                    style={{
                      flex: "1 1 0%",
                      alignSelf: "stretch",
                      paddingTop: 4,
                      paddingBottom: 4,
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 8,
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        flex: "1 1 0%",
                        height: 40,
                        justifyContent: "flex-start",
                        alignItems: "center",
                        display: "flex",
                        gap: "15px",
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 30,
                          paddingLeft: 2,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 18,
                          display: "flex",
                        }}
                      >
                        <div>
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
                              borderRadius: 4,
                              border: "1px var(--White-Stroke, #EAEAEA) solid",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            textAlign: "center",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "16.80px",
                            wordWrap: "break-word",
                          }}
                        >
                          {item.id}
                        </div>
                      </div>

                      <div
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
                      </div>
                    </div>

                    <div
                      style={{
                        height: 40,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 12,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          width: 120,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <div
                          style={{
                            height: "40px",
                            padding: "4px 12px",
                            border: "none",
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
                                  handleUpdateQuantity(item.id, qty);
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
                                handleUpdateQuantity(item.id, qty);
                              } else {
                                handleSelectItem(item, qty);
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 110,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <select
                          className="form-select form-select-sm shadow-none"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            backgroundColor: "white",
                          }}
                          value={item.unit}
                          disabled
                        >
                          <option>{item.unit}</option>
                        </select>
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 110,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="text"
                          className="form-control shadow-none"
                          style={{
                            border: "none",
                            outline: "none",
                            backgroundColor: "white",
                          }}
                          value={`₹${item.unitPrice.toFixed(2)}`}
                          readOnly
                        />
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 120,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <select
                          className="form-select supplierselect shadow-none"
                          style={{
                            border: "none",
                            outline: "none",
                            backgroundColor: "white",
                          }}
                          value={item.tax}
                          disabled
                        >
                          <option>{item.tax}</option>
                        </select>
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 120,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="text"
                          placeholder="₹0.00"
                          className="form-control shadow-none"
                          style={{
                            border: "none",
                            outline: "none",
                          }}
                          value={`₹${item.taxAmount.toFixed(2)}`}
                          readOnly
                        />
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        className="items-cell"
                        style={{ width: "200px", position: "relative" }}
                      >
                        <div
                          className="discount-box"
                          style={{ display: "flex", gap: "10px" }}
                        >
                          <div style={{ position: "relative", width: "100%", }}>
                            <input
                              type="text"
                              className="form-control small shadow-none"
                              style={{
                                paddingRight: "30px",
                                width: "100%",
                                height: "42px",
                                border: "1px solid #EAEAEA",
                                backgroundColor: "white",
                              }}
                              value={`${item.discountPercent}%`}
                              readOnly
                            />
                            <div
                              className="symbol"
                              style={{
                                position: "absolute",
                                right: "0px",
                                top: "50%",
                                height: "42px",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                color: "#555",
                              }}
                            >
                              %{" "}
                            </div>
                          </div>
                          <div style={{ position: "relative", width: "100%", }}>
                            <input
                              type="text"
                              className="form-control small shadow-none"
                              style={{
                                width: "100%",
                                height: "42px",
                                border: "1px solid #EAEAEA",
                                backgroundColor: "white",
                              }}
                              value={`₹${item.discountAmount.toFixed(2)}`}
                              readOnly
                            />
                            <div
                              style={{
                                position: "absolute",
                                right: "0px",
                                top: "50%",
                                height: "42px",
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
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 120,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="text"
                          className="form-control shadow-none"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                          }}
                          placeholder="₹0.00"
                          value={`₹${item.amount.toFixed(2)}`}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                width: "100%",
                padding: "16px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              No items available. Please select an invoice to load items.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Selected Items Table
  const renderSelectedItemsTable = () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 16,
        display: "inline-flex",
      }}
    >
      <div
        style={{
          alignSelf: "stretch",
          justifyContent: "space-between",
          alignItems: "center",
          display: "inline-flex",
        }}
      >
        <div
          style={{
            color: "var(--Black-Black, #0E101A)",
            fontSize: 16,
            fontFamily: "Inter",
            fontWeight: "500",
            lineHeight: "19.20px",
            wordWrap: "break-word",
          }}
        >
          Selected for Credit Notes
        </div>
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          zIndex: 999,
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: "max-content",
            minWidth: "100%",
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 6,
            paddingBottom: 6,
            background: "#E5F0FF",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
          }}
        >
          {/* left */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 80,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Sl No.
              </div>
            </div>

            <div
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "flex-start",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Items
              </div>
            </div>
          </div>

          {/* right */}
          <div
            style={{
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
              display: "flex",
            }}
          >
            {/* Available Qty */}
            <div
              style={{
                width: 120,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Available Qty
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Unit */}
            <div
              style={{
                width: 110,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Unit
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* unit price */}
            <div
              style={{
                width: 110,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Unit Price
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Tax */}
            <div
              style={{
                width: 120,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Tax
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Tax Amount */}
            <div
              style={{
                width: 120,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Tax Amount
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Discount */}
            <div
              style={{
                width: 200,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Discount
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 30,
                background: "var(--Black-Disable, #A2A8B8)",
              }}
            />

            {/* Amount */}
            <div
              style={{
                width: 120,
                height: 30,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 4,
                paddingBottom: 4,
                justifyContent: "center",
                alignItems: "center",
                gap: 8,
                display: "flex",
              }}
            >
              <div
                style={{
                  color: "#727681",
                  fontSize: 14,
                  fontFamily: "Inter",
                  fontWeight: "500",
                  lineHeight: "16.80px",
                  wordWrap: "break-word",
                }}
              >
                Amount
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            alignSelf: "stretch",
            minHeight: "auto",
            paddingLeft: 8,
            paddingRight: 8,
            paddingTop: 4,
            paddingBottom: 4,
            background: "white",
            borderBottomRightRadius: 8,
            borderBottomLeftRadius: 8,
            borderLeft: "1px var(--White-Stroke, #EAEAEA) solid",
            borderRight: "1px var(--White-Stroke, #EAEAEA) solid",
            borderBottom: "1px var(--White-Stroke, #EAEAEA) solid",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            display: "flex",
          }}
        >
          {selectedItems.length > 0 ? (
            selectedItems.map((item, index) => {
              calculateItemTotal(item);
              return (
                <div key={item.id}
                  style={{
                    width: "100%",
                    // height: 46,
                    background: "white",
                    borderBottom: "1px var(--White-Stroke, #EAEAEA) solid",
                    justifyContent: "flex-start",
                    alignItems: "flex-start",
                    display: "flex",
                    position: "relative",
                    // zIndex: activeSearchId === item.id ? 0 : 1,
                    overflow: "visible",
                  }}
                  className="product-row"
                >
                  <div
                    style={{
                      flex: "1 1 0%",
                      alignSelf: "stretch",
                      paddingTop: 4,
                      paddingBottom: 4,
                      justifyContent: "flex-start",
                      alignItems: "center",
                      gap: 8,
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        flex: "1 1 0%",
                        height: 40,
                        justifyContent: "flex-start",
                        alignItems: "center",
                        display: "flex",
                        gap: "15px",
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 30,
                          paddingLeft: 2,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "center",
                          alignItems: "center",
                          gap: 18,
                          display: "flex",
                        }}
                      >
                        <div>
                          <RiDeleteBinLine
                            className="text-danger"
                            style={{
                              cursor: "pointer",
                              fontSize: "16px",
                            }}
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove item"
                          />
                        </div>
                        <div
                          style={{
                            textAlign: "center",
                            color: "var(--Black-Black, #0E101A)",
                            fontSize: 14,
                            fontFamily: "Inter",
                            fontWeight: "400",
                            lineHeight: "16.80px",
                            wordWrap: "break-word",
                          }}
                        >
                          {index + 1}
                        </div>
                      </div>

                      <div
                        className="search-input-container"
                        style={{
                          flex: "1 1 auto",
                          minWidth: 0,
                          position: "relative",
                          overflow: "visible",
                        }}
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
                      </div>
                    </div>

                    <div
                      style={{
                        height: 40,
                        justifyContent: "flex-end",
                        alignItems: "center",
                        gap: 12,
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          width: 120,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <div
                          style={{
                            height: "40px",
                            padding: "4px 12px",
                            border: "none",
                            width: "120px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <input
                            type="text"
                            className="form-control center shadow-none"
                            style={{
                              width: "100%",
                              border: "none",
                              outline: "none",
                              fontSize: 14,
                            }}
                            value={item.returnQuantity}
                            readOnly
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 110,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <select
                          className="form-select form-select-sm shadow-none"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            fontSize: 14,
                            backgroundColor: "transparent",
                          }}
                          value={item.unit}
                          disabled
                        >
                          <option>{item.unit}</option>
                        </select>
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 110,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="text"
                          className="form-control shadow-none"
                          style={{
                            border: "none",
                            outline: "none",
                            fontSize: 14,
                          }}
                          value={`₹${item.unitPrice.toFixed(2)}`}
                          readOnly
                        />
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 120,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="text"
                          className="form-control shadow-none"
                          style={{
                            border: "none",
                            outline: "none",
                            fontSize: 14,
                          }}
                          value={item.tax}
                          readOnly
                        />
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 120,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="text"
                          placeholder="₹0.00"
                          className="form-control shadow-none"
                          style={{
                            border: "none",
                            outline: "none",
                            fontSize: 14,
                          }}
                          value={`₹${item.taxAmount.toFixed(2)}`}
                          readOnly
                        />
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div className="items-cell"
                        style={{ width: "200px", position: "relative" }}
                      >
                        <div className="discount-box"
                          style={{ display: "flex", gap: "10px" }}
                        >
                          <div style={{ position: "relative", width: "100%", }}>
                            <input
                              type="text"
                              className="form-control small shadow-none"
                              style={{
                                paddingRight: "30px",
                                width: "100%",
                                height: "42px",
                                border: "1px solid #EAEAEA",
                                backgroundColor: "white",
                              }}
                              value={`${item.discountPercent}%`}
                              readOnly
                            />
                            <div
                              className="symbol"
                              style={{
                                position: "absolute",
                                right: "0px",
                                top: "50%",
                                height: "42px",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                                color: "#555",
                              }}
                            >
                              %{" "}
                            </div>
                          </div>

                          <div style={{ position: "relative", width: "100%", }}>
                            <input
                              type="text"
                              className="form-control small shadow-none"
                              style={{
                                width: "100%",
                                height: "42px",
                                border: "1px solid #EAEAEA",
                                backgroundColor: "white",
                              }}
                              value={`₹${item.discountAmount.toFixed(2)}`}
                              readOnly
                            />
                            <div
                              style={{
                                position: "absolute",
                                right: "0px",
                                top: "50%",
                                height: "42px",
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
                      </div>

                      <div
                        style={{
                          width: 1,
                          height: 30,
                          background: "var(--Black-Disable, #A2A8B8)",
                        }}
                      />

                      <div
                        style={{
                          width: 120,
                          alignSelf: "stretch",
                          paddingLeft: 12,
                          paddingRight: 12,
                          paddingTop: 4,
                          paddingBottom: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          outline: "1px var(--Stroke, #EAEAEA) solid",
                          borderRadius: 4,
                        }}
                      >
                        <input
                          type="text"
                          className="form-control shadow-none"
                          style={{
                            width: "100%",
                            border: "none",
                            outline: "none",
                            fontSize: 14,
                            backgroundColor: "transparent",
                          }}
                          value={`₹${item.amount.toFixed(2)}`}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                width: "100%",
                padding: "16px",
                textAlign: "center",
                color: "#6b7280",
                fontSize: "14px",
              }}
            >
              No items selected. Select items using checkboxes and quantity controls above.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="p-4" style={{ height: "100vh", overflow: "auto" }}>
        {/* Header */}
        <div
          // className="d-flex justify-content-between align-items-center mb-4"
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "15px",
          }}
        >
          <div
            // className="d-flex align-items-center"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              height: "32px",
            }}
          >
            {/* <Link to="/creditnotelist" style={{ marginRight: "10px" }}> */}
            <span
              onClick={handleBack}
              style={{
                backgroundColor: "white",
                width: "32px",
                height: "32px",
                borderRadius: "50px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                border: "1px solid #FCFCFC",
                cursor: "pointer",
              }}
            >
              <img src={total_orders_icon} alt="total_orders_icon" />
            </span>
            {/* </Link> */}
            <h4
              className="m-0"
              style={{
                margin: 0,
                color: "black",
                fontSize: 22,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                lineHeight: "26.4px",
              }}
            >
              Create Credit Notes
            </h4>
          </div>

          <button
            style={{
              fontFamily: '"Inter", sans-serif',
              fontWeight: 500,
              fontSize: "15px",
              lineHeight: "120%",
              color: "#FFFFFF",
              backgroundColor: "#1F7FFF",
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid #1F7FFF",
            }}
            onClick={() => setShowPreview(true)}
            disabled={!formData.customerId || selectedItems.length === 0}
          >
            View Invoice
          </button>
        </div>

        {/* Customer Section */}
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

          {/* Main Horizontal Wrapper */}
          <div style={{ width: "100%" }}>

            {/* customer details */}
            <div
              style={{
                color: "black",
                fontSize: "16px",
                fontFamily: "Inter",
                fontWeight: "500",
                lineHeight: "19.20px",
              }}
            >
              Customer Details
            </div>

            <div
              style={{
                display: "grid",
                gap: "16px",
                width: "100%",
                marginTop: "16px",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  display: "inline-flex",
                }}
              >
                {/* LEFT AREA */}
                <div style={{ width: "50%", borderRight: "2px solid #eee" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      gap: "45px",
                      width: "100%",
                    }}
                  >
                    {/* Customer Name */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "40%",
                      }}
                    >
                      <label>
                        Customer Name<span className="text-danger">*</span>
                      </label>
                      <div
                        className="customer-search-container"
                        style={{
                          width: "100%",
                          borderRadius: "8px",
                          border: "1px solid #A2A8B8",
                          padding: "6px 8px",
                          display: "flex",
                          gap: "4px",
                          marginTop: "4px",
                          alignItems: "center",
                          position: "relative",
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: '2px 0px'
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

                          <input
                            type="text"
                            placeholder={
                              isFromNavbar
                                ? "Search and select customer"
                                : location.state?.customer
                                  ? "Customer loaded from customer page"
                                  : "Customer"
                            }
                            style={{
                              border: "none",
                              outline: "none",
                              backgroundColor: isFromNavbar ? "#fff" : "#f8f9fa",
                              cursor: isFromNavbar ? "text" : "default",
                              paddingRight: isFromNavbar ? "40px" : "10px",
                              width: "100%",
                              boxSizing: "border-box",
                            }}
                            value={
                              isFromNavbar ? customerSearch : formData.customerName
                            }
                            readOnly={!isFromNavbar}
                            onChange={(e) => {
                              if (isFromNavbar) {
                                setCustomerSearch(e.target.value);
                                handleCustomerSearch(e.target.value);
                              }
                            }}
                            onFocus={() => {
                              if (isFromNavbar && customers.length === 0) {
                                fetchCustomers();
                              }
                              if (isFromNavbar) {
                                setShowCustomerDropdown(true);
                              }
                            }}
                          />
                        </div>

                        {/* ONLY FOR NON-ID ROUTE (isFromNavbar) */}
                        {isFromNavbar && (
                          <div
                            style={{
                              position: "absolute",
                              right: "10px",
                              top: "50%",
                              transform: "translateY(-50%)",
                            }}
                          >

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

                        {/* Customer Dropdown (only in non-ID route) */}
                        {isFromNavbar && showCustomerDropdown && (
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
                            {loading ? (
                              <div className="p-3 text-center text-muted">
                                Loading customers...
                              </div>
                            ) : filteredCustomers.length === 0 ? (
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
                                        {customer.phone || customer.mobile || "No phone"}
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
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div
                      // className="col-md-7"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        width: "40%",
                      }}
                    >
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
                            placeholder="Enter Phone"
                            style={{
                              border: "none",
                              outline: "none",
                              fontSize: "14px",
                            }}
                            value={formData.phone}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "end",
                    gap: "0px",
                    width: "50%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "end",
                      gap: "0px",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        height: 30,
                        justifyContent: "flex-start",
                        alignItems: "center",
                        display: "inline-flex",
                        gap: "16px",
                        cursor: "pointer",
                      }}
                    >

                      {/* RIGHT SIDE - Search by Invoice Number ONLY */}
<div style={{ position: "relative", width: 210 }}>
  <span
    style={{
      position: "absolute",
      top: "-7px",
      left: "12px",
      background: "#fff",
      padding: "0 6px",
      fontSize: "11px",
      color: "#6B7280",
      zIndex: 10,
    }}
  >
    Search by Invoice No.
  </span>

  <div
    ref={dropdownRef}
    style={{
      height: 38,
      border: "1px solid #A2A8B8",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "#fff",
      position: "relative",
    }}
  >
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: "3px",
        padding: "0 5px",
      }}
    >
      <FiSearch style={{ color: "#9CA3AF", fontSize: "14px" }} />
      <input
        type="text"
        placeholder="Search by Invoice No."
        value={invoiceSearch}
        onChange={(e) => {
          setInvoiceSearch(e.target.value);
          searchInvoiceByNumber(e.target.value);
          setIsInvoiceOpen(true);
        }}
        onFocus={() => {
          setIsInvoiceOpen(true);
        }}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          fontSize: "14px",
          backgroundColor: "transparent",
          padding: "8px 0",
        }}
      />
      {formData.invoiceId && (
        <IoClose
          style={{
            cursor: "pointer",
            color: "#9CA3AF",
            fontSize: "16px",
          }}
          onClick={() => {
            setFormData(prev => ({ 
              ...prev, 
              customerId: "",
              customerName: "",
              phone: "",
              invoiceId: "", 
              invoiceNumber: "",
            }));
            setCustomerSearch("");
            setInvoiceSearch("");
            setFilteredInvoices([]);
            setRemainingBalance(null);
            setAvailableItems([]);
            setSelectedItems([]);
          }}
        />
      )}
    </div>

    {/* Dropdown List */}
    {isInvoiceOpen && (
      <div
        style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          marginTop: "4px",
          backgroundColor: "#FFFFFF",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
          zIndex: 1000,
          maxHeight: "400px",
          overflowY: "auto",
        }}
      >
        {loadingInvoices ? (
          <div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
            <div className="spinner-border spinner-border-sm text-primary me-2" />
            Searching...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center", color: "#6b7280" }}>
            {invoiceSearch 
              ? `No invoices matching "${invoiceSearch}"` 
              : "Type to search by Invoice Number"}
          </div>
        ) : (
          filteredInvoices.map((invoice) => {
            const isSelected = formData.invoiceId === invoice._id;
            return (
              <div
                key={invoice._id}
                onClick={() => {
                  handleInvoiceSelect(invoice);
                  setIsInvoiceOpen(false);
                  setInvoiceSearch(invoice.invoiceNo || invoice.invoiceNumber || "");
                }}
                style={{
                  padding: "12px 16px",
                  fontSize: "14px",
                  cursor: "pointer",
                  color: isSelected ? "#0E101A" : "#374151",
                  fontWeight: isSelected ? "600" : "400",
                  backgroundColor: isSelected ? "#e5f0ff" : "transparent",
                  borderBottom: "1px solid #F0F0F0",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: isSelected ? "600" : "500" }}>
                    {invoice.invoiceNo || invoice.invoiceNumber}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
                    Customer: {invoice.customerName || invoice.customerId?.name || "N/A"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                    Date: {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : "No date"} | 
                    Amount: ₹{(invoice.totalAmount || invoice.grandTotal || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    )}
  </div>
</div>

                      {/* Date */}
                      <div style={{ position: "relative", width: 200 }}>
                        <span
                          style={{
                            position: "absolute",
                            top: "-7px",
                            left: "12px",
                            background: "#fff",
                            padding: "0 6px",
                            fontSize: "11px",
                            color: "#6B7280",
                            zIndex: 10,
                          }}
                        >
                          Credit Note Date
                        </span>

                        <div
                          className=""
                          style={{
                            height: 38,
                            padding: "0 10px",
                            border: "1px solid #A2A8B8",
                            borderRadius: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            cursor: "pointer",
                            background: "#fff",
                            gap: "8px",
                          }}>
                          <DatePicker
                            value={formData.date}
                            onChange={(selectedDate) =>
                              setFormData((prev) => ({
                                ...prev,
                                date: selectedDate,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* render balance indicator */}
          {renderBalanceIndicator()}
          {/* Available Items Table */}
          {renderAvailableItemsTable()}

          {/* Selected Items Table */}
          {renderSelectedItemsTable()}

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
            {/* Payment Left */}
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
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Add any notes or payment details..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Summary Right */}
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
                    ₹{formData.discount.toFixed(2)}
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>₹</span>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      style={{ width: "80px", padding: "2px 8px" }}
                      value={formData.shippingCharges}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          shippingCharges: parseFloat(e.target.value) || 0,
                        }))
                      }
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <hr style={{ color: "#727681" }} />

                <div className="summary-line">
                  <span>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.autoRoundOff}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          autoRoundOff: e.target.checked,
                        }))
                      }
                    />
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
                    {formData.roundOff >= 0 ? "+" : "-"}₹
                    {Math.abs(formData.roundOff).toFixed(2)}
                  </span>
                </div>

                <hr style={{ color: "#727681" }} />

                <div className="summary-line">
                  <h5
                    style={{
                      color: "#0E101A",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                    }}
                  >
                    Total Credit Amount :-
                  </h5>
                  <h4
                    style={{
                      color: "#0E101A",
                      fontWeight: 500,
                      fontSize: "16px",
                      lineHeight: "120%",
                      fontFamily: 'Inter", sans-serif',
                    }}
                  >
                    ₹{formData.totalAmount.toFixed(2)}
                  </h4>
                </div>

                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={formData.fullyReceived}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fullyReceived: e.target.checked,
                      }))
                    }
                  />
                  <label
                    className="form-check-label"
                    style={{
                      color: "#727681",
                      fontWeight: 400,
                      fontSize: "16px",
                    }}
                  >
                    Fully Settled
                  </label>
                </div>
                {remainingBalance !== null && formData.totalAmount > remainingBalance && formData.totalAmount > 0 && (
                  <div className="mt-2 text-danger" style={{ fontSize: "12px", textAlign: "right" }}>
                    ⚠️ Total exceeds available balance by ₹{(formData.totalAmount - remainingBalance).toLocaleString('en-IN')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div
          style={{
            width: "100%",
            justifyContent: "end",
            alignItems: "center",
            display: "flex",
            marginTop: 14,
          }}
        >
          <div
            style={{
              paddingLeft: 47,
              paddingRight: 0,
              justifyContent: "flex-start",
              alignItems: "flex-start",
              gap: 15,
              display: "inline-flex",
            }}
          >
            <button
              className="btn btn-outline-primary"
              style={{
                height: 36,
                padding: 8,
                fontWeight: 500,
                borderRadius: 8,
                padding: "10px",
                fontSize: "14px",
                lineHeight: "120%",
                fontFamily: '"Inter" sans-serif',
                border: "1px solid #1F7FFF",
                background: "var(--White-Universal-White, white)",
                boxShadow: "-1px -1px 4px rgba(0, 0, 0, 0.25) inset",
                color: "var(--Blue-Blue, #1F7FFF)",
                wordWrap: "break-word",
              }}
              onClick={() => handleSubmit("save")}
              disabled={
                loading ||
                !formData.customerId ||
                !formData.invoiceId ||
                selectedItems.filter((item) => (item.returnQuantity || 0) > 0).length === 0 ||
                (remainingBalance !== null && formData.totalAmount > remainingBalance)  // ✅ Add this
              }
            >
              {loading ? "Saving..." : "Save"}
            </button>

          </div>
        </div>

        <InvoicePreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          data={formData}
          type="credit-note"
        />

      </div>
    </div>
  );
};

export default CustomerCreditNote;
