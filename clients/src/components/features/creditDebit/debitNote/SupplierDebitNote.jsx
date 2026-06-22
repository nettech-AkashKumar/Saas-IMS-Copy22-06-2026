import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../../../pages/config/axiosInstance";
import { toast } from "react-toastify";

// pages
import DatePicker from "../../../../components/DatePicker";
import Pagination from "../../../../components/Pagination";

// icons
import { IoChevronDownOutline } from "react-icons/io5";
import { RiArrowDropDownLine, RiDeleteBinLine } from "react-icons/ri";
import { FaCheckSquare, FaSquare } from "react-icons/fa";
import { PiCaretUpDownLight } from "react-icons/pi";
import { FiSearch } from "react-icons/fi";
import { LuCalendarMinus2 } from "react-icons/lu";
import { FiChevronDown } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

// images
import total_orders_icon from "../../../../assets/images/totalorders-icon.png";
import indialogo from "../../../../assets/images/india-logo.png";

const SupplierDebitNote = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { supplierId } = useParams();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [supplierInvoices, setSupplierInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [remainingBalance, setRemainingBalance] = useState(null);
  const [poTotal, setPoTotal] = useState(0);
  const [totalDebited, setTotalDebited] = useState(0);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [balanceWarning, setBalanceWarning] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1
  });
  const [debitNotes, setDebitNotes] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);

  // Determine where we're coming from
  const isFromPurchase = location.state?.type === "purchase";
  const isFromSupplier = location.state?.type === "supplier";
  const isFromNavbar =
    !supplierId &&
    !location.state?.supplier &&
    !isFromPurchase &&
    !isFromSupplier;

  // Form state
  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    phone: "",
    invoiceId: "",
    invoiceNumber: "",
    purchaseOrderNo: "",
    date: new Date().toISOString().split("T")[0],
    subtotal: 0,
    discount: 0,
    shippingCharges: 0,
    autoRoundOff: false,
    roundOff: 0,
    totalAmount: 0,
    fullyReceived: false,
    notes: "",
  });
  const handleBack = () => {
    navigate(location.state?.from || -1);
  }

  // Main useEffect
  useEffect(() => {
    // console.log("Loading with state:", {
    //   isFromPurchase,
    //   isFromSupplier,
    //   supplierId,
    //   invoice: location.state?.invoice,
    //   supplierInInvoice: location.state?.invoice?.supplierId,
    // });

    if (isFromSupplier && supplierId) {
      fetchSupplierFromId(supplierId);
    } else if (isFromPurchase && location.state?.invoice) {
      const invoice = location.state.invoice;
      // console.log("Loading from purchase:", {
      //   invoice,
      //   supplierId: invoice.supplierId,
      //   type: typeof invoice.supplierId,
      // });
      handleInvoiceSelect(invoice);

      if (invoice.supplierId) {
        if (typeof invoice.supplierId === "object" && invoice.supplierId._id) {
          // console.log(
          //   "Using supplier from invoice object:",
          //   invoice.supplierId,
          // );
          handleSupplierSelect(invoice.supplierId);
        } else if (typeof invoice.supplierId === "string") {
          // console.log("Fetching supplier by ID:", invoice.supplierId);
          fetchSupplierFromId(invoice.supplierId).catch((err) => {
            // console.warn("Supplier fetch failed, using invoice data:", err);
            if (invoice.supplierName) {
              handleSupplierSelect({
                _id: invoice.supplierId,
                supplierName: invoice.supplierName,
                name: invoice.supplierName,
                phone: "",
              });
            }
          });
        }
      } else if (invoice.supplierName) {
        // console.log("Using supplier name from invoice:", invoice.supplierName);
        handleSupplierSelect({
          _id: "temp_" + Date.now(),
          supplierName: invoice.supplierName,
          name: invoice.supplierName,
          phone: "",
        });
      } else {
        toast.error("Invoice has no supplier information");
      }
    } else if (location.state?.supplier) {
      handleSupplierSelect(location.state.supplier);
    } else if (supplierId) {
      fetchSupplierFromId(supplierId);
    }
  }, [supplierId, location.state]);

  useEffect(() => {
    if (supplierId) {
      fetchSupplierFromId(supplierId);
    }
  }, [supplierId]);

  useEffect(() => {
    if (location.state?.supplier) {
      handleSupplierSelect(location.state.supplier);
    }
  }, [location.state]);

  useEffect(() => {
    if (isFromNavbar) {
      fetchAllSuppliers();
    }
  }, []);

  const fetchAllSuppliers = async () => {
    try {
      setLoadingSuppliers(true);
      const response = await api.get("/api/suppliers");
      let suppliersData = [];
      if (Array.isArray(response.data)) {
        suppliersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        suppliersData = response.data.data;
      } else if (
        response.data?.suppliers &&
        Array.isArray(response.data.suppliers)
      ) {
        suppliersData = response.data.suppliers;
      }

      setSuppliers(suppliersData);
      setFilteredSuppliers(suppliersData);
    } catch (error) {
      // console.error("Failed to load suppliers:", error);
      // toast.error("Failed to load suppliers");
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load suppliers");
    } finally {
      setLoadingSuppliers(false);
    }
  };

  // fetch debit notes
  const fetchDebitNotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      // Add filters if needed
      if (formData.supplierId) {
        params.supplierId = formData.supplierId;
      }

      const response = await api.get('/api/supplier-debit-notes', { params });

      if (response.data.success) {
        setDebitNotes(response.data.debitNotes);
        setPagination(prev => ({
          ...prev,
          totalCount: response.data.pagination.totalCount,
          totalPages: response.data.pagination.totalPages,
          page: response.data.pagination.page,
          limit: response.data.pagination.limit
        }));
      }
    } catch (error) {
      // console.error("Failed to fetch debit notes:", error);
      toast.error(error?.response?.data?.message || "Failed to load debit notes");
    } finally {
      setLoading(false);
    }
  };

  // Call this when component mounts and when pagination changes
  useEffect(() => {
    fetchDebitNotes();
  }, [pagination.page, pagination.limit]);
  const fetchRemainingBalance = async (invoiceId) => {
    if (!invoiceId) return;

    try {
      setIsCheckingBalance(true);
      const response = await api.get(`/api/supplier-debit-notes/purchase-order/${invoiceId}/remaining-balance`);

      if (response.data.success) {
        const { poTotal, totalDebited, remainingBalance, debitNotesCount } = response.data.data;

        setPoTotal(poTotal);
        setTotalDebited(totalDebited);
        setRemainingBalance(remainingBalance);

        if (remainingBalance <= 0) {
          setBalanceWarning(`This purchase order has been fully debited (₹${totalDebited.toLocaleString('en-IN')} out of ₹${poTotal.toLocaleString('en-IN')}). No more debit notes can be created.`);
          toast.warning("This purchase order has reached its debit limit");
        } else if (remainingBalance < poTotal * 0.2) {
          setBalanceWarning(`⚠️ Only ₹${remainingBalance.toLocaleString('en-IN')} remains available for debit notes out of ₹${poTotal.toLocaleString('en-IN')}`);
          toast.info(`Remaining balance: ₹${remainingBalance.toLocaleString('en-IN')}`);
        } else {
          setBalanceWarning(`Available balance: ₹${remainingBalance.toLocaleString('en-IN')} out of ₹${poTotal.toLocaleString('en-IN')}`);
        }
        return remainingBalance;
      }
      return null;
    } catch (error) {
      // console.error("Failed to fetch remaining balance:", error);
      // Don't show error toast as it might be annoying, just log it
      setBalanceWarning("Could not fetch remaining balance information");
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const handleSupplierSearch = (searchTerm) => {
    setSupplierSearch(searchTerm);
    setShowSupplierDropdown(true);

    if (!searchTerm.trim()) {
      setFilteredSuppliers(suppliers);
      return;
    }

    const filtered = suppliers.filter((supplier) => {
      const name =
        supplier.supplierName || supplier.name || supplier.company || "";
      const phone = supplier.phone || supplier.mobile || "";
      const searchLower = searchTerm.toLowerCase();

      return (
        name.toLowerCase().includes(searchLower) || phone.includes(searchTerm)
      );
    });

    setFilteredSuppliers(filtered);
  };

  // Fetch supplier invoices when supplier changes
  useEffect(() => {
    if (formData.supplierId) {
      fetchSupplierInvoices(formData.supplierId);
    } else {
      setSupplierInvoices([]);
      setFormData((prev) => ({
        ...prev,
        invoiceId: "",
        invoiceNumber: "",
      }));
      setAvailableItems([]);
      setSelectedItems([]);
    }
  }, [formData.supplierId]);

  useEffect(() => {
    calculateTotals();
  }, [selectedItems, formData.shippingCharges, formData.autoRoundOff]);

  const fetchSupplierFromId = async (id) => {
    try {
      if (!id) {
        toast.error("No supplier ID provided");
        return;
      }

      setLoading(true);
      const response = await api.get(`/api/suppliers/${id}`);

      if (!response.data) {
        toast.error("Supplier not found or invalid response");
        return;
      }

      const supplier = response.data.supplier || response.data;

      if (supplier) {
        handleSupplierSelect(supplier);
        if (!isFromPurchase) {
          fetchSupplierInvoices(supplier._id);
          setTimeout(() => setIsInvoiceOpen(true), 500);
        }
      } else {
        toast.error("Supplier data is empty");
      }
    } catch (error) {
      // console.error("Failed to fetch supplier:", error);
      if (!isFromPurchase) {
        // toast.error("Failed to load supplier details");
        toast.error(error?.response?.data?.displayMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Failed to load supplier details");
      } else {
        // console.warn("Supplier not found, but continuing with invoice data...");
      }
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredInvoices(supplierInvoices);
      return;
    }
    const searchLower = searchTerm.toLowerCase();
    const filtered = supplierInvoices.filter((invoice) => {
      const invoiceNumber = (invoice.invoiceNo || invoice.invoiceNumber || invoice.purchaseNo || "").toLowerCase();
      const grandTotal = (invoice.grandTotal || 0).toString();

      return invoiceNumber.includes(searchLower) || grandTotal.includes(searchLower);
    });
    setFilteredInvoices(filtered);
  };

  // Search all purchase orders without requiring supplier
const searchAllPurchaseOrders = async (searchTerm) => {
  try {
    setLoadingInvoices(true);
    
    // If search term is empty, clear results
    if (!searchTerm.trim()) {
      setFilteredInvoices([]);
      setLoadingInvoices(false);
      return;
    }
    
    // Search purchase orders by PO number or supplier name
    const response = await api.get("/api/purchase", {
      params: {
        search: searchTerm,
        limit: 20,
        page: 1
      }
    });
    
    const purchaseOrders = response.data.purchases || response.data.data || [];
    
    // Filter only valid purchase orders
    const validPOs = purchaseOrders.filter(
      (po) =>
        po.status !== 'cancelled' &&
        po.status !== 'draft'
    );
     const processedPOs = validPOs.map(po => ({
      ...po,
      supplierName: po.supplierName || po.supplierId?.supplierName || po.supplierId?.name || "N/A"
    }));
    
    setFilteredInvoices(processedPOs);
  } catch (error) {
    console.error("Error searching purchase orders:", error);
    setFilteredInvoices([]);
  } finally {
    setLoadingInvoices(false);
  }
};

// Search purchase orders by number ONLY (not by supplier name)
const searchPurchaseOrderByNumber = async (searchTerm) => {
  try {
    setLoadingInvoices(true);
    
    // If search term is empty, clear results
    if (!searchTerm.trim()) {
      setFilteredInvoices([]);
      setLoadingInvoices(false);
      return;
    }
    
    // Search by purchase order number only
    const response = await api.get("/api/purchase", {
      params: {
        search: searchTerm.trim(),
        limit: 20,
        page: 1
      }
    });
    
    let purchaseOrders = response.data.purchases || response.data.data || [];
    
    // Filter only valid purchase orders
    const validPOs = purchaseOrders.filter(
      (po) =>
        po.status !== 'cancelled' &&
        po.status !== 'draft'
    );
    
    // Process to ensure supplier name is accessible
    const processedPOs = validPOs.map(po => ({
      ...po,
      supplierName: po.supplierName || po.supplierId?.supplierName || po.supplierId?.name || "N/A"
    }));
    
    setFilteredInvoices(processedPOs);
  } catch (error) {
    console.error("Error searching purchase orders:", error);
    setFilteredInvoices([]);
  } finally {
    setLoadingInvoices(false);
  }
};

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Click outside handler for invoice dropdown
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

  const fetchProducts = async () => {
    try {
      const response = await api.get("/api/products");
      let productsData = [];
      if (Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        productsData = response.data.data;
      } else if (
        response.data?.products &&
        Array.isArray(response.data.products)
      ) {
        productsData = response.data.products;
      }
      setProducts(productsData);
    } catch (error) {
      // console.error("Failed to load products:", error);
      // toast.error("Failed to load products");
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load products");
    }
  };

  const fetchSupplierInvoices = async (supplierId) => {
    try {
      setLoadingInvoices(true);

      const response = await api.get(`/api/purchase?supplierId=${supplierId}`,);

      let invoicesData = [];

      if (response.data && Array.isArray(response.data)) {
        invoicesData = response.data;
      }else if (response.data?.purchases && Array.isArray(response.data.purchases)) {
  invoicesData = response.data.purchases;
}  

      const filtered = invoicesData.filter(
        (invoice) =>
          invoice.status !== "cancelled" && invoice.status !== "draft",
      );

      setSupplierInvoices(filtered);
      setFilteredInvoices(filtered);
      setInvoiceSearch("");

      if (filtered.length === 0) {
        toast.info("No purchase orders found for this supplier.");
      }
    } catch (error) {
      // console.error("Failed to load purchase orders:", error);
      toast.error(error?.response?.data?.displayMessage ||
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load purchase orders for supplier");
      setSupplierInvoices([]);
      setFilteredInvoices([]);
    } finally {
      setLoadingInvoices(false);
    }
  };
  const handleSupplierSelect = (supplier) => {
    if (!supplier) {
      // console.warn("handleSupplierSelect called with null/undefined supplier");
      return;
    }

    const supplierData = {
      _id: supplier._id || supplier.id || "unknown",
      supplierName:
        supplier.supplierName ||
        supplier.name ||
        supplier.company ||
        "Unknown Supplier",
      phone: supplier.phone || supplier.mobile || supplier.contactNumber || "",
    };

    setFormData((prev) => ({
      ...prev,
      supplierId: supplierData._id,
      supplierName: supplierData.supplierName,
      phone: supplierData.phone,
      invoiceId: "",
      invoiceNumber: "",
    }));
    setAvailableItems([]);
    setSelectedItems([]);

    if (isFromNavbar) {
      setSupplierSearch(supplierData.supplierName || "");
      setShowSupplierDropdown(false);
    }
    setTimeout(() => {
      setIsInvoiceOpen(true);
      if (formData.supplierId || supplierData._id) {
        fetchSupplierInvoices(supplierData._id);
      }
    }, 300);
  };

// const handleInvoiceSelect = async (invoice) => {
//   try {
//     // If invoice is from search, it might not have full supplier details
//     let fullInvoice = invoice;
    
//     // If invoice doesn't have supplier details, fetch full details
//     if (!invoice.supplierId || typeof invoice.supplierId === 'string' || !invoice.supplierId.name) {
//       const invoiceResponse = await api.get(`/api/purchase/${invoice._id}`);
//       fullInvoice = invoiceResponse.data.purchaseOrder || invoiceResponse.data;
//     }

//     if (!fullInvoice || !fullInvoice.items) {
//       toast.error("Could not load invoice items");
//       return;
//     }
//      // Fetch remaining balance and use the RETURNED value, not stale state
//     const currentRemainingBalance = await fetchRemainingBalance(fullInvoice._id);

//     if (currentRemainingBalance !== null && currentRemainingBalance <= 0) {
//       toast.error("Cannot create debit note. Purchase order has already been fully debited.");
//       return;
//     }

//     // Fetch remaining balance first
//     // await fetchRemainingBalance(fullInvoice._id);

//     // // Check if remaining balance is zero or negative
//     // if (remainingBalance !== null && remainingBalance <= 0) {
//     //   toast.error("Cannot create debit note. Purchase order has already been fully debited.");
//     //   return;
//     // }

//     // Set supplier data from full invoice
//     if (fullInvoice.supplierId) {
//       const supplierData = fullInvoice.supplierId;
//       handleSupplierSelect(supplierData);
//     } else if (fullInvoice.supplierName) {
//       handleSupplierSelect({
//         _id: fullInvoice.supplierId || "temp_" + Date.now(),
//         supplierName: fullInvoice.supplierName,
//         name: fullInvoice.supplierName,
//         phone: fullInvoice.phone || "",
//       });
//     }

//     const purchaseOrderNumber = 
//       fullInvoice.purchaseNo ||
//       fullInvoice.invoiceNo ||
//       fullInvoice.purchaseOrderNo ||
//       fullInvoice.poNumber ||
//       "";

//     const itemsFromInvoice = await Promise.all(
//       fullInvoice.items.map(async (item, index) => {
//         let productName = item.itemName || item.name || "Product";

//         if (item.productId && !item.itemName && !item.name) {
//           try {
//             const productResponse = await api.get(`/api/products/${item.productId}`);
//             if (productResponse.data) {
//               const product = productResponse.data.product || productResponse.data;
//               productName = product.productName || product.name || "Product";
//             }
//           } catch (err) {
//             toast.error(err?.response?.data?.message || "Failed to fetch product details");
//           }
//         }

//         return {
//           id: index + 1,
//           productId: item.productId?._id || item.productId,
//           name: productName,
//           description: item.description || "",
//           quantity: item.qty || item.quantity || 1,
//           originalQuantity: item.qty || item.quantity || 1,
//           maxAvailable: item.qty || item.quantity || 1,
//           unit: item.unit || "Pcs",
//           unitPrice: item.unitPrice || item.price || 0,
//           tax: item.taxType || `GST @ ${item.taxRate || 5}%`,
//           taxRate: item.taxRate || 5,
//           taxAmount: item.taxAmount || 0,
//           discountPercent: item.discountPct || 0,
//           discountAmount: item.discountAmt || 0,
//           amount: item.amount || 0,
//           isSelected: false,
//         };
//       })
//     );

//     setAvailableItems(itemsFromInvoice);
//     setSelectedItems([]);
    
//     setFormData((prev) => ({
//       ...prev,
//       invoiceId: fullInvoice._id,
//       invoiceNumber: purchaseOrderNumber,
//       purchaseOrderNo: purchaseOrderNumber,
//     }));

//     toast.success(`Loaded ${itemsFromInvoice.length} items from purchase order`);
//   } catch (error) {
//     console.error("Failed to load invoice details:", error);
//     toast.error(error?.response?.data?.message || "Failed to load invoice details");
//   }
// };
const handleInvoiceSelect = async (invoice) => {
  try {
    // First, fetch remaining balance
    const currentRemainingBalance = await fetchRemainingBalance(invoice._id);
    
    if (currentRemainingBalance !== null && currentRemainingBalance <= 0) {
      toast.error("Cannot create debit note. Purchase order has already been fully debited.");
      return;
    }

    // Get the purchase order number
    const purchaseOrderNumber = 
      invoice.purchaseNo ||
      invoice.invoiceNo ||
      invoice.purchaseOrderNo ||
      invoice.poNumber ||
      "";

    // Check if invoice has items
    if (!invoice.items || invoice.items.length === 0) {
      toast.error("No items found in this purchase order");
      return;
    }

    // Process items from invoice (same as credit note)
    const itemsFromInvoice = await Promise.all(
      invoice.items.map(async (item, index) => {
        let productName = item.itemName || item.name || "Product";

        if (item.productId && !item.itemName && !item.name) {
          try {
            const productId = typeof item.productId === 'object' ? item.productId._id : item.productId;
            if (productId) {
              const productResponse = await api.get(`/api/products/${productId}`);
              if (productResponse.data) {
                const product = productResponse.data.product || productResponse.data;
                productName = product.productName || product.name || "Product";
              }
            }
          } catch (err) {
            console.warn("Could not fetch product details:", err);
          }
        }

        return {
          id: index + 1,
          productId: typeof item.productId === 'object' ? item.productId._id : item.productId,
          name: productName,
          description: item.description || "",
          quantity: item.qty || item.quantity || 1,
          originalQuantity: item.qty || item.quantity || 1,
          maxAvailable: item.qty || item.quantity || 1,
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

    // Update state
    setAvailableItems(itemsFromInvoice);
    setSelectedItems([]);
    
    // Set form data with invoice details
    setFormData((prev) => ({
      ...prev,
      invoiceId: invoice._id,
      invoiceNumber: purchaseOrderNumber,
      purchaseOrderNo: purchaseOrderNumber,
      // Only set supplier if not already set or if it's different
      ...(prev.supplierId === "" && invoice.supplierId ? {
        supplierId: typeof invoice.supplierId === 'object' ? invoice.supplierId._id : invoice.supplierId,
        supplierName: invoice.supplierName || invoice.supplierId?.supplierName || invoice.supplierId?.name || "",
        phone: invoice.phone || invoice.supplierId?.phone || "",
      } : {})
    }));

    // If no supplier is set and we have supplier data in the invoice, set it
    if (!formData.supplierId && invoice.supplierId) {
      const supplierData = typeof invoice.supplierId === 'object' 
        ? invoice.supplierId 
        : { _id: invoice.supplierId, supplierName: invoice.supplierName || "Supplier" };
      
      handleSupplierSelect(supplierData);
    }

    toast.success(`Loaded ${itemsFromInvoice.length} items from purchase order`);
    
    // Close dropdown
    setIsInvoiceOpen(false);
    
  } catch (error) {
    console.error("Failed to load invoice details:", error);
    toast.error(error?.response?.data?.message || "Failed to load invoice details");
  }
};  
const toggleItemSelection = (item, fromAvailable = true) => {
    if (fromAvailable) {
      // Moving from available to selected - PARTIAL SELECTION
      const updatedAvailable = [...availableItems];
      const itemIndex = updatedAvailable.findIndex(
        (avItem) => avItem.id === item.id,
      );

      if (itemIndex !== -1) {
        const itemToSelect = {
          ...item,
          isSelected: true,
          returnQuantity: 1,
          originalQuantity: item.quantity,
        };

        setSelectedItems([...selectedItems, itemToSelect]);
      }
    } else {
      // Moving from selected back to available
      const updatedSelected = selectedItems.filter(
        (selectedItem) => selectedItem.id !== item.id,
      );
      setSelectedItems(updatedSelected);
    }
  };

  // Handle partial quantity selection
  const handlePartialSelection = (item, returnQuantity) => {
    const updatedAvailable = availableItems
      .map((avItem) => {
        if (avItem.id === item.id) {
          return {
            ...avItem,
            quantity: Math.max(0, avItem.quantity - returnQuantity), // Reduce available quantity
          };
        }
        return avItem;
      })
      .filter((avItem) => avItem.quantity > 0); // Remove if quantity becomes 0

    const itemToSelect = {
      ...item,
      isSelected: true,
      returnQuantity: returnQuantity,
      originalQuantity: item.quantity, // Store original total
    };
    setAvailableItems(updatedAvailable);
    setSelectedItems([...selectedItems, itemToSelect]);
  };

  // Handle selecting an item with quantity
  // const handleSelectItem = (item, quantity) => {
  //   if (quantity <= 0) return;

  //   const maxAllowed = item.quantity;
  //   const actualQty = Math.min(quantity, maxAllowed);

  //   // Check if already selected
  //   const existingIndex = selectedItems.findIndex(
  //     (selItem) => selItem.id === item.id,
  //   );

  //   if (existingIndex !== -1) {
  //     // Update existing
  //     const updatedSelected = [...selectedItems];
  //     updatedSelected[existingIndex] = {
  //       ...updatedSelected[existingIndex],
  //       returnQuantity: actualQty,
  //     };
  //     setSelectedItems(updatedSelected);
  //   } else {
  //     // Add new
  //     const itemToSelect = {
  //       ...item,
  //       isSelected: true,
  //       returnQuantity: actualQty,
  //       originalQuantity: item.quantity,
  //     };
  //     setSelectedItems([...selectedItems, itemToSelect]);
  //   }
  // };

  const handleSelectItem = (item, quantity) => {
    if (quantity <= 0) return;
    const currentTotal = selectedItems.reduce((sum, selItem) => {
      return sum + ((selItem.returnQuantity || 0) * (selItem.unitPrice || 0));
    }, 0);
    const newItemTotal = quantity * (item.unitPrice || 0);
    const newGrandTotal = currentTotal + newItemTotal;
    if (remainingBalance !== null && newGrandTotal > remainingBalance) {
      toast.error(`Cannot add item. Total would exceed remaining balance of ₹${remainingBalance.toLocaleString('en-IN')}`);
      return;
    }
    const maxAllowed = item.quantity;
    const actualQty = Math.min(quantity, maxAllowed);
    const existingIndex = selectedItems.findIndex(
      (selItem) => selItem.id === item.id,
    );

    if (existingIndex !== -1) {
      const updatedSelected = [...selectedItems];
      updatedSelected[existingIndex] = {
        ...updatedSelected[existingIndex],
        returnQuantity: actualQty,
      };
      setSelectedItems(updatedSelected);
    } else {
      const itemToSelect = {
        ...item,
        isSelected: true,
        returnQuantity: actualQty,
        originalQuantity: item.quantity,
      };
      setSelectedItems([...selectedItems, itemToSelect]);
    }
  };

  // Update quantity of already selected item
  // const handleUpdateQuantity = (itemId, newQuantity) => {
  //   if (newQuantity <= 0) {
  //     handleRemoveItem(itemId);
  //     return;
  //   }

  //   const item = availableItems.find((avItem) => avItem.id === itemId);
  //   if (!item) return;

  //   const maxAllowed = item.quantity;
  //   const actualQty = Math.min(newQuantity, maxAllowed);

  //   const updatedSelected = selectedItems.map((selItem) =>
  //     selItem.id === itemId
  //       ? { ...selItem, returnQuantity: actualQty }
  //       : selItem,
  //   );

  //   setSelectedItems(updatedSelected);
  // };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    const item = availableItems.find((avItem) => avItem.id === itemId);
    if (!item) return;
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
        : selItem,
    );

    setSelectedItems(updatedSelected);
  };

  const renderBalanceIndicator = () => {
    if (!formData.invoiceId || remainingBalance === null) return null;

    return (
      <div
        className="mb-2 p-3"
        style={{
          backgroundColor: remainingBalance <= 0 ? "#FEF2F2" : "#F0FDF4",
          borderRadius: "8px",
          border: `1px solid ${remainingBalance <= 0 ? "#FEE2E2" : "#DCFCE7"}`,
          width: "500px"
        }}>
        <div className="d-flex justify-content-between align-items-center">
          <span style={{ fontWeight: 500, color: "#374151" }}>
            Purchase Order Balance
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
            Total PO Value: ₹{poTotal.toLocaleString('en-IN')}
          </small>
          <small style={{ color: "#6B7280" }}>
            Already Debited: ₹{totalDebited.toLocaleString('en-IN')}
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

  const handleRemoveItem = (itemId) => {
    const updatedSelected = selectedItems.filter(
      (selItem) => selItem.id !== itemId,
    );
    setSelectedItems(updatedSelected);
  };

  const handleReturnQuantityChange = (itemId, value) => {
    const parsedValue = parseInt(value) || 0;
    const updatedSelected = selectedItems.map((item) => {
      if (item.id === itemId) {
        const maxQuantity = item.originalQuantity || item.quantity;
        const returnQuantity = Math.min(Math.max(0, parsedValue), maxQuantity);
        const updatedItem = {
          ...item,
          returnQuantity,
        };
        calculateItemTotal(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setSelectedItems(updatedSelected);
  };

  const handleSelectedItemChange = (itemId, field, value) => {
    const updatedSelected = selectedItems.map((item) => {
      if (item.id === itemId) {
        const updatedItem = {
          ...item,
          [field]: field === "unit" ? value : parseFloat(value) || 0,
        };
        calculateItemTotal(updatedItem);
        return updatedItem;
      }
      return item;
    });
    setSelectedItems(updatedSelected);
  };

  const calculateItemTotal = (item) => {
    if (!item) return;

    // Calculate subtotal
    const quantity = item.returnQuantity || 0;
    const unitPrice = item.unitPrice || 0;
    const subtotal = quantity * unitPrice;

    // Calculate discount
    let discountAmount = item.discountAmount || 0;
    const discountPercent = item.discountPercent || 0;

    if (discountPercent > 0 && discountAmount === 0) {
      discountAmount = subtotal * (discountPercent / 100);
    } else if (discountAmount > 0 && discountPercent === 0) {
      discountPercent = (discountAmount / subtotal) * 100;
    }

    // Calculate taxable amount
    const taxableAmount = Math.max(0, subtotal - discountAmount);

    // Calculate tax
    const taxRate = item.taxRate || 0;
    const taxAmount = taxableAmount * (taxRate / 100);

    // Calculate total
    const total = taxableAmount + taxAmount;

    // Round to 2 decimal places
    item.discountAmount = parseFloat(discountAmount.toFixed(2));
    item.taxAmount = parseFloat(taxAmount.toFixed(2));
    item.amount = parseFloat(total.toFixed(2));

    return {
      discountAmount: item.discountAmount,
      taxAmount: item.taxAmount,
      amount: item.amount
    };
  };

  // Calculate totals based on selected items
  const calculateTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    selectedItems.forEach((item) => {
      // Ensure item has proper calculations
      if (!item.discountAmount || !item.taxAmount || !item.amount) {
        calculateItemTotal(item);
      }

      const itemSubtotal = (item.returnQuantity || 0) * (item.unitPrice || 0);
      subtotal += itemSubtotal;
      totalDiscount += item.discountAmount || 0;
      totalTax += item.taxAmount || 0;
    });

    // Calculate total amount
    let totalAmount = subtotal + totalTax - totalDiscount + (formData.shippingCharges || 0);

    // Apply round off
    let roundOff = 0;
    if (formData.autoRoundOff) {
      roundOff = Math.round(totalAmount) - totalAmount;
      totalAmount = Math.round(totalAmount);
    }

    // Update form data with proper rounding
    setFormData((prev) => ({
      ...prev,
      subtotal: parseFloat(subtotal.toFixed(2)),
      discount: parseFloat(totalDiscount.toFixed(2)),
      tax: parseFloat(totalTax.toFixed(2)),
      roundOff: parseFloat(roundOff.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
    }));
  };

  const isSubmitDisabled = () => {
    return loading ||
      !formData.supplierId ||
      !formData.invoiceId ||
      selectedItems.filter((item) => (item.returnQuantity || 0) > 0).length === 0 ||
      (remainingBalance !== null && formData.totalAmount > remainingBalance);
  };

  // Handle form submission
  const handleSubmit = async (action) => {
    try {
      if (!formData.supplierId) {
        toast.error(
          isFromNavbar
            ? "Please search and select a supplier first"
            : "Please select a supplier",
        );
        return;
      }

      if (!formData.invoiceId) {
        toast.error("Please select an invoice");
        return;
      }

      const validItems = selectedItems.filter(
        (item) => (item.returnQuantity || 0) > 0,
      );
      if (validItems.length === 0) {
        toast.error("Please set return quantity for selected items");
        return;
      }

      setLoading(true);

      const debitNoteData = {
        supplierId: formData.supplierId,
        supplierName: formData.supplierName,
        phone: formData.phone,
        invoiceId: formData.invoiceId,
        supplierInvoiceNo: formData.invoiceNumber,
        purchaseOrderNo: formData.purchaseOrderNo || formData.invoiceNumber,
        date: formData.date,
        reason: "defective_goods",
        items: validItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          description: item.description || "",
           originalQuantity: item.originalQuantity || item.quantity,
          quantity: item.returnQuantity,
          originalQuantity: item.originalQuantity || item.quantity,
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
        additionalCharges: formData.shippingCharges,
        roundOff: formData.roundOff,
        totalAmount: formData.totalAmount,
        // status: action === "save" ? "draft" : "issued",
        status:"issued",
        notes: formData.notes,
        fullyReceived: formData.fullyReceived,
      };

      // console.log("Submitting debit note:", debitNoteData);

      const response = await api.post(
        "/api/supplier-debit-notes",
        debitNoteData,
      );
      if (action !== "save" && formData.invoiceId) {
        try {
          await api.put(`/api/purchase/${formData.invoiceId}`, {
            debitNoteCreated: true,
            debitNoteId: response.data.debitNote._id,
            status: "partial"  // or keep existing status
          });
          // console.log("Purchase order updated with debit note reference");
        } catch (updateError) {
          // console.warn("Could not update purchase order:", updateError);
        }
      }

      toast.success(`Debit note ${action === "save" ? "saved as issued" : "issued successfully"}`,);

      // Navigate based on action
      navigate("/skeleton?redirect=/debit-note");
    } catch (error) {
      // console.error("Submit error:", error);
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Failed to save debit note",
      );
    } finally {
      setLoading(false);
    }
  };

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
          Available for Debit Notes
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
                (selItem) => selItem.id === item.id,
              );
              const isSelected = !!selectedItem;
              const selectedQty = selectedItem
                ? selectedItem.returnQuantity
                : 0;

              // Calculate remaining available quantity
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
                                // Checkbox checked - select with quantity 1
                                handleSelectItem(item, 1);
                              } else {
                                // Checkbox unchecked - remove from selected
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
                              %
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
                              ₹
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
          Selected for Debit Notes
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
            selectedItems.map((item, index) => (
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
                      }}>
                      <div>
                        <RiDeleteBinLine
                          className="text-danger"
                          style={{
                            cursor: "pointer",
                            fontSize: "18px",
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
                            %
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
                            ₹
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
            ))
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsInvoiceOpen(false);
      }
      if (
        showSupplierDropdown &&
        !event.target.closest(".supplier-search-container")
      ) {
        setShowSupplierDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSupplierDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSupplierDropdown &&
        !event.target.closest(".supplier-search-container")
      ) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSupplierDropdown]);

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
            {/* <Link
              to={
                location.state?.from === "/purchase-list"
                  ? "/purchase-list"
                  : location.state?.from === "/supplier-list"
                    ? "/supplier-list"
                    : "/dashboard"
              }
              style={{ marginRight: "10px" }}
            > */}
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
            <h2
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
              Create Debit Notes
            </h2>
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
                {/* LEFT AREA (Supplier + Phone) */}
                <div style={{ width: "50%", borderRight: "2px solid #eee" }}>
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
                      <div
                        className="supplier-search-container"
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
                          {!formData.supplierId && (
                            <FiSearch
                              style={{
                                color: "#666",
                                cursor: "pointer",
                                fontSize: "16px",
                              }}
                            />
                          )}
                          <input
                            type="text"
                            // className="form-control supplierinput shadow-none"
                            placeholder={
                              isFromPurchase
                                ? "Supplier loaded from purchase order"
                                : isFromSupplier
                                  ? "Supplier loaded from supplier page"
                                  : isFromNavbar
                                    ? "Search and select supplier"
                                    : "Supplier"
                            }
                            style={{
                              width: "100%", // Takes full width of parent
                              border: "none",
                              outline: "none",
                              fontSize: "14px",
                              backgroundColor: isFromNavbar ? "#fff" : "#fff",
                              cursor: isFromNavbar ? "text" : "default",
                              boxSizing: "border-box", // Important: includes padding in width calculation
                            }}
                            value={
                              isFromNavbar ? supplierSearch : formData.supplierName
                            }
                            readOnly={!isFromNavbar}
                            onChange={(e) => {
                              if (isFromNavbar) {
                                handleSupplierSearch(e.target.value);
                              }
                            }}
                            onFocus={() => {
                              if (isFromNavbar && suppliers.length === 0) {
                                fetchAllSuppliers();
                              }
                              if (isFromNavbar) {
                                setShowSupplierDropdown(true);
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

                            {/* Show cross icon when supplier is selected */}
                            {formData.supplierId && (
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
                                  // Clear supplier and reset form for non-ID route
                                  setFormData((prev) => ({
                                    ...prev,
                                    supplierId: "",
                                    supplierName: "",
                                    phone: "",
                                    invoiceId: "",
                                    invoiceNumber: "",
                                    subtotal: 0,
                                    discount: 0,
                                    totalAmount: 0,
                                  }));
                                  setSupplierSearch("");
                                  setAvailableItems([]);
                                  setSelectedItems([]);
                                  setSupplierInvoices([]);
                                  setShowSupplierDropdown(true);

                                  // Focus back on the input
                                  setTimeout(() => {
                                    const input = document.querySelector(
                                      ".supplier-search-container input",
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
                                title="Clear supplier and search another"
                              />
                            )}
                          </div>
                        )}

                        {/* Supplier Dropdown (only in non-ID route) */}
                        {isFromNavbar && showSupplierDropdown && (
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
                              width: "100%", // Match input width
                              boxSizing: "border-box", // Same as input
                            }}
                          >
                            {loadingSuppliers ? (
                              <div className="p-3 text-center text-muted">
                                Loading suppliers...
                              </div>
                            ) : filteredSuppliers.length === 0 ? (
                              <div className="p-3 text-center text-muted">
                                {supplierSearch.trim()
                                  ? "No suppliers found"
                                  : "Type to search suppliers"}
                              </div>
                            ) : (
                              filteredSuppliers.map((supplier) => (
                                <div
                                  key={supplier._id}
                                  className="supplier-dropdown-item"
                                  style={{
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f0f0f0",
                                    transition: "background-color 0.2s",
                                  }}
                                  onClick={() => {
                                    handleSupplierSelect(supplier);
                                    setSupplierSearch(
                                      supplier.supplierName || supplier.name || "",
                                    );
                                    setShowSupplierDropdown(false);
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
                                        {supplier.supplierName ||
                                          supplier.name ||
                                          supplier.company}
                                      </div>
                                      <div
                                        style={{ fontSize: "12px", color: "#666" }}
                                      >
                                        {supplier.phone ||
                                          supplier.mobile ||
                                          "No phone"}
                                      </div>
                                    </div>
                                    <small
                                      style={{ color: "#888", fontSize: "12px" }}
                                    >
                                      {supplier.email || ""}
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

                {/* RIGHT SIDE (Supplier Invoice No + Date) */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "end",
                    gap: "0px",
                    width: "50%",
                    marginTop: "30px",
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
{/* RIGHT SIDE - Search by Purchase Order Number ONLY */}
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
    Search by Purchase No.
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
        placeholder="Search by Purchase No."
        value={invoiceSearch}
        onChange={(e) => {
          setInvoiceSearch(e.target.value);
          searchPurchaseOrderByNumber(e.target.value);
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
              supplierId: "",
              supplierName: "",
              phone: "",
              invoiceId: "", 
              invoiceNumber: "",
              purchaseOrderNo: "",
            }));
            setSupplierSearch("");
            setInvoiceSearch("");
            setFilteredInvoices([]);
            setRemainingBalance(null);
            setAvailableItems([]);
            setSelectedItems([]);
          }}
        />
      )}
    </div>

    {/* Dropdown List - Shows Purchase Orders */}
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
              ? `No purchase orders matching "${invoiceSearch}"` 
              : "Type to search by Purchase Order Number"}
          </div>
        ) : (
          filteredInvoices.map((po) => {
            const isSelected = formData.invoiceId === po._id;
            const poNumber = po.purchaseNo || po.invoiceNo || po.purchaseOrderNo || "";
            
            return (
              <div
                key={po._id}
                onClick={() => {
                  handleInvoiceSelect(po);
                  setIsInvoiceOpen(false);
                  setInvoiceSearch(poNumber);
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
                    {poNumber}
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>
                    Supplier: {po.supplierName || po.supplierId?.supplierName || po.supplierId?.name || "N/A"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                    Date: {po.purchaseDate ? new Date(po.purchaseDate).toLocaleDateString() : "No date"} | 
                    Amount: ₹{(po.grandTotal || 0).toLocaleString("en-IN")}
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
                          Debit Date
                        </span>

                        <div
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
                          }}
                          onClick={() => setViewReceiptDateOptions(true)}
                        >
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

          {/* ADD BALANCE INDICATOR HERE - Right after the supplier details section */}
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
                    ₹{formData.discount.toFixed(2)} </span>
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
                    {formData.roundOff >= 0 ? "+" : "-"} ₹{Math.abs(formData.roundOff).toFixed(2)}
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
                      fontSize: "16px",
                      lineHeight: "120%",
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

                {/* Show balance exceeded warning */}
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
            marginTop: 16,
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
              disabled={isSubmitDisabled()}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDebitNote;

