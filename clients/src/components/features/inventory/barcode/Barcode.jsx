import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from "jsbarcode";
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// pages
import barcodeDetector from '../../../../utils/barcodeDetector';
import api from "../../../../pages/config/axiosInstance"

// icons
import { IoIosSearch } from "react-icons/io";
import { AiFillProduct } from "react-icons/ai";
import { FaFilePdf } from "react-icons/fa6";
import { IoPrint } from "react-icons/io5";
import { TbEye, TbRefresh, TbTrash } from 'react-icons/tb';
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";

// images
import ProductDefaultImage from '../../../../assets/images/product-default.png'

function Barcode() {
  const [allProducts, setAllProducts] = useState([]);
  const [product, setProduct] = useState({
    productName: "",
    price: "",
    quantity: "",
    barcode: "",
    uniqueBarcodes: [],
    showProductName: false,
    showSku: false,
    showPrice: false,
    showExpiryDate: false,
    showQuantity: false,
  });
  const [numberOfBarcodes, setNumberOfBarcodes] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [labelFormat, setLabelFormat] = useState('');
  const [pageSize, setPageSize] = useState('');
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const lookupDetectorRef = useRef(null);
  const lookupVideoRef = useRef(null);
  const lookupDetectionLockRef = useRef(false);
  const isSelectingRef = useRef(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isVariantPopupOpen, setIsVariantPopupOpen] = useState(false);
  const [variantPopupProduct, setVariantPopupProduct] = useState(null);
  const [variantPopupSelectedVariantId, setVariantPopupSelectedVariantId] = useState(null);
  const [variantPopupMatchedBarcode, setVariantPopupMatchedBarcode] = useState("");
  const lastSearchBarcodeRef = useRef("");
  const formRef = useRef(null);
  const searchRef = useRef(null);
  const printRef = useRef(null);
  const [errors, setErrors] = useState({});
  const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");
  const getProductVariants = (prod) => (Array.isArray(prod?.variants) ? prod.variants : []);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/products?sort=createdAt&order=desc&limit=1000`);
      const data = response.data?.products || response.data?.data || response.data || [];
      // Sort LIFO — latest first
      const sorted = [...data].sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      setAllProducts(sorted);
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAllProducts();
  }, []);

  const findVariantByBarcodeDigits = (prod, digits) => {
    const normalized = normalizeDigits(digits);
    if (!normalized) return null;
    const variants = getProductVariants(prod);
    return variants.find((v) =>
      normalizeDigits(v?.barcode) === normalized ||
      normalizeDigits(v?.itemBarcode) === normalized
    ) || null;
  };

  const normalizeVariant = (v) => ({
    ...v,
    barcode: String(v?.barcode || v?.itemBarcode || "").trim(),
  });

  const applyVariantSelection = (prod, variant) => {
    if (!prod || !variant) return;
    const v = normalizeVariant(variant);
    setSelectedProduct(prod);
    setSelectedVariant(v);
    setSearchQuery(prod.productName || "");
    setProducts([]);
    setShowDropdown(false);
    const barcodeVal = String(v?.barcode || prod?.itemBarcode || "").trim();
    setProduct((prev) => ({
      ...prev,
      productName: prod.productName || '',
      sku: prod.sku || '',
      price: Number(v?.sellingPrice ?? prod?.sellingPrice ?? prev.price ?? 0),
      quantity: Number(v?.stockQuantity ?? prod?.quantity ?? prev.quantity ?? 0),
      img: prod.images && prod.images[0] ? prod.images[0].url : '',
      expiryDate: v?.expiryDate || '',
      barcode: barcodeVal,
      barcodeImg: '',
      uniqueBarcodes: [],
    }));
  };

  const applySelectedProductAndVariant = (prod, preferredVariant = null, matchedBarcode = "") => {
    if (!prod) return;
    const variants = getProductVariants(prod);

    // ✅ Only auto-resolve if there's a matched barcode or exactly 1 variant
    const resolvedVariant = preferredVariant
      || (matchedBarcode ? findVariantByBarcodeDigits(prod, matchedBarcode) : null)
      || (variants.length === 1 ? variants[0] : null);

    setSelectedProduct(prod);
    setSearchQuery(prod.productName || "");
    setProducts([]);
    setShowDropdown(false);

    if (variants.length > 1) {
      // ✅ Don't pre-select any variant — leave it null until user picks
      const initial = preferredVariant || (matchedBarcode ? findVariantByBarcodeDigits(prod, matchedBarcode) : null);
      setVariantPopupProduct(prod);
      setVariantPopupMatchedBarcode(String(matchedBarcode || "").trim());
      setVariantPopupSelectedVariantId(initial?._id ? String(initial._id) : null); // ✅ null if no match
      setIsVariantPopupOpen(true);
      setSelectedVariant(null);          // ✅ no variant selected yet
      setSelectedProduct(null);          // ✅ don't show in table until variant is confirmed
      setProduct((prev) => ({
        ...prev,
        productName: "",
        sku: "",
        price: "",
        quantity: "",
        img: "",
        expiryDate: "",
        barcode: "",
        barcodeImg: "",
        uniqueBarcodes: [],
      }));
      return;
    }

    applyVariantSelection(prod, resolvedVariant);
  };

  const validateBarcodeForm = () => {
    let newErrors = {};
    if (!selectedProduct) {
      newErrors.selectedProduct = "Please select any product";
    }
    if (selectedProduct) {
      const variants = getProductVariants(selectedProduct);
      if (variants.length > 1 && !selectedVariant) {
        newErrors.selectedVariant = "Please select a variant";
      }
    }
    if (!numberOfBarcodes || Number(numberOfBarcodes) <= 0) {
      newErrors.numberOfBarcodes = "Enter Number of Barcode to print";
    }
    if (!labelFormat) {
      newErrors.labelFormat = "Please select Label Format";
    }
    if (!pageSize) {
      newErrors.pageSize = "Please select Page Type & Size";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (isFormOpen && (product.barcode || product.uniqueBarcodes.length > 0)) {
      const timer = setTimeout(() => {
        const count = parseInt(numberOfBarcodes, 10) || 1;
        const barcodes = product.uniqueBarcodes.length > 0 ? product.uniqueBarcodes : [product.barcode];
        for (let i = 0; i < count; i++) {
          const code = barcodes[i] || barcodes[0];
          if (!code) continue;
          const svgId = `barcode-svg-${i}`;
          const element = document.getElementById(svgId);
          if (element) {
            try {
              let format = 'CODE128';
              JsBarcode(element, code, {
                format,
                lineColor: '#000',
                width: 2,
                height: 100,
                margin: 10,
                displayValue: true,
                fontSize: 16,
                textMargin: 6,
              });
            } catch (_e) {
              void _e;
              JsBarcode(element, code, {
                format: 'CODE128',
                lineColor: '#000',
                width: 2,
                height: 100,
                margin: 10,
                displayValue: true,
                fontSize: 16,
                textMargin: 6,
              });
            }
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen, product.barcode, product.uniqueBarcodes, numberOfBarcodes]);

  const searchProducts = (query) => {
    if (!query || query.length < 1) {
      // Show all products when query is empty
      setProducts(allProducts);
      setShowDropdown(true);
      return;
    }
    const lower = query.toLowerCase();
    const filtered = allProducts.filter((p) =>
      p.productName?.toLowerCase().includes(lower) ||
      String(p.itemBarcode || "").includes(lower)
    );
    setProducts(filtered);
    setShowDropdown(true);
  };

  const handlePreview = async (productId) => {
    try {
      if (!productId) return;
      const preferredBarcode = String(selectedVariant?.barcode || "").trim();
      if (preferredBarcode) {
        setProduct((prev) => ({
          ...prev,
          productName: selectedProduct?.productName || prev.productName,
          price: Number(selectedVariant?.sellingPrice ?? selectedProduct?.sellingPrice ?? prev.price ?? 0),
          quantity: Number(selectedVariant?.stockQuantity ?? selectedProduct?.quantity ?? prev.quantity ?? 0),
          barcode: preferredBarcode,
          uniqueBarcodes: [],
        }));
        setIsFormOpen(true);
        return;
      }
      const res = await api.get(`/api/products/preview/${productId}`);
      if (res && res.data) {
        const prod = res.data;
        const barcodeVal = prod.itemBarcode ? String(prod.itemBarcode).trim() : '';
        setSelectedProduct((prev) => ({
          ...prev,
          _id: prod._id,
          productName: prod.productName,
          sellingPrice: prod.sellingPrice || prod.sellingPrice,
          itemBarcode: barcodeVal || null,
          openingQuantity: prod.openingQuantity,
          images: prod.images || prev.images,
        }));
        setProduct((prev) => ({ ...prev, productName: prod.productName || prev.productName, price: prod.sellingPrice || prev.price, unit: prod.unit || prev.unit, barcode: barcodeVal, uniqueBarcodes: barcodeVal ? [barcodeVal] : [] }));
        setIsFormOpen(true);
      } else {
        toast.error('Unable to fetch product for preview');
      }
    } catch (err) {
      toast.error('Unable to fetch product for preview');
    }
  };

  useEffect(() => {
    if (isSelectingRef.current) return;
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        const trimmed = String(searchQuery || "").trim();
        const digits = normalizeDigits(trimmed);
        const isNumericOnly = trimmed.length > 0 && !/[a-z]/i.test(trimmed) && /^[\d\s-]+$/.test(trimmed);
        if (isNumericOnly && digits.length === 13) {
          if (lastSearchBarcodeRef.current !== digits) {
            lastSearchBarcodeRef.current = digits;
            lookupAndSelectByCode(digits, { openLookupModal: false });
          }
          setShowDropdown(false);
          return;
        }
        searchProducts(searchQuery); // ✅ now client-side
      } else {
        // ✅ Show all products when query is cleared
        setProducts(allProducts);
        setShowDropdown(false); // only show on focus, not when cleared
      }
    }, 150); // reduced debounce since it's client-side now
    return () => clearTimeout(timeoutId);
  }, [searchQuery, allProducts]);

  const handleProductSelect = (selectedProduct) => {
    isSelectingRef.current = true;
    setShowDropdown(false);
    setProducts([]);
    if (errors.selectedProduct || errors.selectedVariant) {
      setErrors((prev) => ({ ...prev, selectedProduct: "", selectedVariant: "" }));
    }
    applySelectedProductAndVariant(selectedProduct);
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 0);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedProduct(null);
    setSelectedVariant(null);
    setIsVariantPopupOpen(false);
    setVariantPopupProduct(null);
    setVariantPopupSelectedVariantId(null);
    setVariantPopupMatchedBarcode("");
    setProduct({
      productName: "",
      sku: "",
      price: "",
      expiryDate: "",
      quantity: "",
      barcode: "",
      barcodeImg: "",
      uniqueBarcodes: [],
      showProductName: false,
      showSku: false,
      showPrice: false,
      showExpiryDate: false,
      showQuantity: false,
    });
    setProducts([]);
    setShowDropdown(false);
    setLabelFormat('');
    setPageSize('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (name === 'numberOfBarcodes') {
      setNumberOfBarcodes(value);
    } else if (name === 'labelFormat') {
      setLabelFormat(value);
    } else if (name === 'pageSize') {
      setPageSize(value);
    } else if (name === 'searchQuery') {
      setSearchQuery(value);
    } else {
      setProduct(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const generateBarcode = () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    const variants = getProductVariants(selectedProduct);
    const resolvedVariant = selectedVariant || (variants.length === 1 ? variants[0] : null);
    if (variants.length > 1 && !resolvedVariant) {
      toast.error("Please select a variant first");
      return;
    }
    const existingBarcode = String(resolvedVariant?.barcode || selectedProduct.itemBarcode || product.barcode || "").trim();
    if (existingBarcode) {
      toast.warn('This product already has a barcode. Showing preview.');
      setProduct((prev) => ({ ...prev, barcode: existingBarcode, uniqueBarcodes: [] }));
      setIsFormOpen(true);
      return;
    }
    setLoading(true);
    (async () => {
      try {
        const variantId = resolvedVariant?._id ? String(resolvedVariant._id) : null;
        const body = variantId ? { productId: selectedProduct._id, variantId } : { productId: selectedProduct._id };
        const res = await api.post(`/api/products/generate-barcode`, body);
        const code = String(res?.data?.barcode || "").trim();
        const updated = res?.data?.product || null;
        if (!code) {
          toast.error("Failed to generate barcode from server");
          return;
        }
        if (updated) {
          setSelectedProduct(updated);
          if (variantId && Array.isArray(updated?.variants)) {
            const updatedVariant = updated.variants.find((v) => String(v?._id) === variantId) || null;
            setSelectedVariant(updatedVariant || resolvedVariant);
          }
        } else {
          setSelectedVariant((prev) => prev ? ({ ...prev, barcode: code }) : prev);
        }
        setProduct((prev) => ({
          ...prev,
          productName: selectedProduct.productName || prev.productName,
          barcode: code,
          uniqueBarcodes: [],
        }));
        setIsFormOpen(true);
      } catch (err) {
        toast.error('Failed to generate barcode from server');
      } finally {
        setLoading(false);
      }
    })();
  };

  const lookupAndSelectByCode = async (code, { openLookupModal = false } = {}) => {
    try {
      const trimmed = String(code || '').trim();
      if (!trimmed) {
        toast.error('Please enter a barcode to lookup');
        return;
      }
      const res = await api.get(`/api/products/barcode/${encodeURIComponent(trimmed)}`);
      if (res && res.data) {
        const prod = res.data;
        const matchedBarcode = prod.matchedBarcode || trimmed;
        const matchedVariant = prod.matchedVariant || findVariantByBarcodeDigits(prod, matchedBarcode);
        applySelectedProductAndVariant(prod, matchedVariant, matchedBarcode);
        const barcodeVal = String(matchedVariant?.barcode || prod.itemBarcode || "").trim();
        if (openLookupModal) {
          setProduct((prev) => ({ ...prev, productName: prod.productName || prev.productName, price: prod.sellingPrice || prev.price, unit: prod.unit || prev.unit, barcode: barcodeVal, uniqueBarcodes: barcodeVal ? [barcodeVal] : [] }));
          setTimeout(() => {
            const svg = document.getElementById('barcode-lookup-svg');
            if (svg && barcodeVal) {
              const format = 'CODE128';
              JsBarcode(svg, barcodeVal, { format, lineColor: '#000', width: 2, height: 100, margin: 10, displayValue: true, fontSize: 16, textMargin: 6 });
            }
          }, 150);
          setIsLookupOpen(true);
        }
        try {
          const label = prod.productName ? `${prod.productName}` : 'Product found';
          const priceLabel = prod.sellingPrice != null ? ` - ₹${Number(prod.sellingPrice).toFixed(2)}` : '';
        } catch (_e) {
          void _e;
        }
        try {
          if (typeof window !== 'undefined' && window.CustomEvent) {
            window.dispatchEvent(new CustomEvent('barcode:found', { detail: prod }));
          }
        } catch (_e) {
          void _e;
        }
      } else {
        toast.error('Product not found for this barcode');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to lookup barcode');
    }
  };

  useEffect(() => {
    let mounted = true;
    const startDetector = async () => {
      if (!isLookupOpen) return;
      const videoEl = lookupVideoRef.current || document.getElementById('barcode-lookup-video');
      if (!videoEl) return;
      const onDetected = async (code) => {
        if (!code) return;
        if (lookupDetectionLockRef.current) return;
        lookupDetectionLockRef.current = true;
        try {
          await lookupAndSelectByCode(code, { openLookupModal: true });
          if (navigator && navigator.vibrate) navigator.vibrate(80);
        } catch (_err) {
          void _err;
        }
        setTimeout(() => { lookupDetectionLockRef.current = false; }, 1500);
      };
      try {
        lookupDetectorRef.current = await barcodeDetector.startVideoDetector(videoEl, onDetected, { formats: ['code_128'], autoStopOnDetect: false, cooldownMs: 1500 });
      } catch (err) {
      }
    };
    if (isLookupOpen && mounted) startDetector();
    return () => {
      mounted = false;
      if (lookupDetectorRef.current && typeof lookupDetectorRef.current.stop === 'function') {
        try { lookupDetectorRef.current.stop(); } catch (_e) { void _e; }
        lookupDetectorRef.current = null;
      }
    };
  }, [isLookupOpen]);

  const handlePrint = () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcodes</title>
          <style>
            @media print {
              body {
                margin: 0;
                padding: 10mm;
                font-family: Arial, sans-serif;
              }
              .barcode-scanner-link {
                border: 2px solid #E6E6E6;
                border-radius: 8px;
                padding: 16px 24px;
                width: 320px;
                height: 280px;
                box-sizing: border-box;
                page-break-inside: avoid;
                text-align: left;
                font-size: 14px;
                margin: 0 auto 16px auto;
              }
              .barcode-scanner-link svg {
                width: 100%;
                height: 60px;
                margin-top: 10px;
              }
              .barcode-scanner-link h6, .barcode-scanner-link p {
                margin: 0 0 5px 0;
              }
              @page {
                size: A4;
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <div id="barcode-print-root">${printContent}</div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            (${function (barcodes, numberOfBarcodes) {
        for (let i = 0; i < (numberOfBarcodes || 1); i++) {
          const svg = document.getElementById(`barcode-svg-${i}`);
          if (svg) {
            window.JsBarcode(svg, barcodes[i] || barcodes[0] || '', {
              format: "CODE128",
              lineColor: "#000",
              width: 3,
              height: 100,
              displayValue: true
            });
          }
        }
        window.onload = function () {
          window.print();
          window.onafterprint = function () {
            window.close();
          };
        };
      }.toString()})(${JSON.stringify(product.uniqueBarcodes)}, ${numberOfBarcodes || 1});
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  useEffect(() => {
    if (!isVariantPopupOpen) return;
    if (!variantPopupProduct) return;
    const digits = normalizeDigits(variantPopupMatchedBarcode);
    if (!digits) return;
    const v = findVariantByBarcodeDigits(variantPopupProduct, digits);
    if (v?._id) setVariantPopupSelectedVariantId(String(v._id));
  }, [isVariantPopupOpen, variantPopupProduct, variantPopupMatchedBarcode]);

  const handleDownloadPDF = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    const element = printRef.current;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save('barcodes.pdf');
    } catch (error) {
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
    setSearchQuery('');
    setNumberOfBarcodes('');
    setProduct({
      productName: "",
      sku: "",
      price: "",
      expiryDate: "",
      quantity: "",
      barcode: "",
      barcodeImg: "",
      uniqueBarcodes: [],
      showProductName: false,
      showSku: false,
      showPrice: false,
      showExpiryDate: false,
      showQuantity: false,
    });
    setProducts([]);
    setShowDropdown(false);
    setLabelFormat('');
    setPageSize('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        closeForm();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const hasBarcode = selectedVariant?.barcode || selectedProduct?.itemBarcode || product.barcode;

  return (
    <div className="p-4">

      {/* header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              lineHeight: "26.4px",
            }}
          >
            Print Barcode
          </h2>
        </div>
      </div>

      <div style={{ height: "calc(100vh - 150px)" }}>

        {/* select product */}
        <div className='card p-4'>
          <div className="mb-1 search-form seacrh-barcode-item" >
            <div className="search-form">
              <label className="form-label fs-6">Select Product<span className="text-danger">*</span></label>
              {!selectedProduct && (<div ref={searchRef} className="position-relative">
                <input
                  type="text"
                  placeholder="Search by Product Name..."
                  name="searchQuery"
                  className="form-control"
                  value={searchQuery}
                  onChange={handleChange}
                  onFocus={() => {
                    setProducts(allProducts);
                    setShowDropdown(true);
                  }}
                />
                <IoIosSearch className="fs-4" />
                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    maxHeight: '175px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {products.length > 0 ? (
                      products.map((productItem) => (
                        <div
                          key={productItem._id}
                          onMouseDown={(e) => {
                            e.preventDefault(); // IMPORTANT
                            handleProductSelect(productItem);
                          }}
                          style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'white';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontWeight: '500', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {productItem?.images[0]?.url ? (
                                <div style={{ width: '32px', height: '32px', border: '1px solid #eee', backgroundColor: '#eee', borderRadius: '6px' }}>
                                  <img src={productItem?.images[0]?.url} style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: '6px' }} />
                                </div>) : (
                                <div style={{ width: '32px', height: '32px' }}>
                                  <img src={ProductDefaultImage} alt='Product Default Image' className="media-image" />
                                </div>
                              )}
                            </div>
                            <div>
                              {productItem.productName}
                              {productItem?.hsnCode && (
                                <div style={{ fontSize: 12, color: "#6c757d", }}>
                                  HSN: {String(productItem.hsnCode)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '15px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        {loading ? 'Searching...' : 'No products found'}
                      </div>
                    )}
                  </div>
                )}
              </div>)}
              {errors.selectedProduct && <div className="text-danger">{errors.selectedProduct}</div>}
              {errors.selectedVariant && <div className="text-danger">{errors.selectedVariant}</div>}
            </div>
          </div>

          {/* Selected Product Display */}
          {selectedProduct && (
            <div className="col-lg-12">
              <div className="p-3 bg-light rounded border mb-1">
                <div className="table-responsive rounded border">
                  <table className="table">
                    <thead>
                      <tr style={{ background: "#F3F8FB" }}>
                        <th>Product Name</th>
                        <th>Barcode</th>
                        <th className="text-center no-sort bg-secondary-transparent">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          {/* <div style={{ fontWeight: '500', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {selectedProduct.images[0] ? (
                              <div style={{ width: '32px', height: '32px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: '#eee' }}>
                                <img src={selectedProduct.images[0]?.url} alt="product" style={{ width: '100%', height: '100%', objectFit: 'fill', borderRadius: '6px', }} />
                              </div>
                            ) : (<div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: 6,
                                background: "#eee",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                                color: "#666",
                              }}
                            >
                              {selectedProduct.productName?.charAt(0).toUpperCase() || "N/A"}
                            </div>)}
                          </div> */}
                          <div>
                            <span style={{ fontSize: 14, color: '#333' }}>{selectedProduct.productName}</span>
                          </div>
                        </td>
                        <td>
                          {(selectedVariant?.barcode || selectedProduct?.itemBarcode) && (
                            <div style={{ fontSize: 14, color: "#6c757d", display: "flex", alignItems: "center", gap: '4px' }}>
                              <span><FaBarcode style={{ color: '#6c757d' }} /></span>
                              <span>{String(selectedVariant?.barcode || selectedProduct?.itemBarcode)}</span>
                            </div>
                          )}
                        </td>
                        <td className="action-table-data">
                          <div className="edit-delete-action">
                            <a onClick={clearSearch} data-bs-toggle="modal" data-bs-target="#delete-modal" className="barcode-delete-icon">
                              <TbTrash data-feather="trash-2" className="feather-trash-2" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!selectedProduct && (
            <div style={{ border: '1px solid #e6e6e6ff', color: "#999797ff", backgroundColor: "white", padding: '13px', borderRadius: '8px', marginTop: '24px', textAlign: 'center' }}>
              <AiFillProduct style={{ fontSize: '25px' }} />
              <br />
              <span style={{ color: '#1368EC' }}>Search Product to Generate Barcode</span>
            </div>
          )}
        </div>

        {/* set barcode details */}
        <div className='card p-4 mt-3'>
          <label className="form-label fs-6">Set Barcode Details</label>
          <div className="mt-3" style={{ display: 'flex', gap: '24px', width: '100%', justifyContent: 'space-between' }}>
            <div className="" style={{ width: '33%' }}>
              <div className="mb-3">
                <label className="form-label">Number of Barcode to print<span className="text-danger">*</span></label>
                <input
                  type="number"
                  name="numberOfBarcodes"
                  value={numberOfBarcodes}
                  onChange={handleChange}
                  min="1"
                  placeholder='Enter Number of Barcode to print'
                  className="form-control"
                  style={{ border: '1px solid #ccc', padding: '10px', }}
                />
                {errors.numberOfBarcodes && <div className="text-danger">{errors.numberOfBarcodes}</div>}
              </div>
            </div>

            <div className="" style={{ width: '33%' }}>
              <div className="mb-3">
                <label className="form-label">Lable Format
                  <span className="text-danger">*</span>
                </label>
                <select className="form-select" style={{ border: '1px solid #ccc' }} type="text" name='labelFormat' value={labelFormat} onChange={handleChange}>
                  <option value="">--Select Lable--</option>
                  <option value="large">Large</option>
                  <option value="mediam">Mediam</option>
                  <option value="small">Small</option>
                </select>
                {errors.labelFormat && <div className="text-danger">{errors.labelFormat}</div>}
              </div>
            </div>

            <div className="" style={{ width: '33%' }}>
              <div className="mb-3">
                <label className="form-label">Page Type & Size
                  <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select" style={{ border: '1px solid #ccc' }}
                  name="pageSize"
                  value={pageSize}
                  onChange={handleChange}
                >
                  <option value="">--Select Page Size--</option>
                  <option value="a4">A4</option>
                </select>
                {errors.pageSize && <div className="text-danger">{errors.pageSize}</div>}
              </div>
            </div>
          </div>

          <div className="paper-search-size">
            <div className="align-items-center">
              <div className="mt-3" style={{ display: 'flex', gap: '24px', width: '100%', justifyContent: 'flex-start' }} >
                <div className="">
                  <div className="search-toggle-list">
                    <p>Show Product Name</p>
                    <div className="m-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <input
                          type="checkbox"
                          id="showProductName"
                          className="check"
                          name="showProductName"
                          checked={product.showProductName}
                          onChange={handleChange}
                        />
                        <label htmlFor="showProductName" className="checktoggle mb-0" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="">
                  <div className="search-toggle-list">
                    <p>Show Price</p>
                    <div className="m-0">
                      <div className="status-toggle modal-status d-flex justify-content-between align-items-center">
                        <input
                          type="checkbox"
                          id="showPrice"
                          className="check"
                          name="showPrice"
                          checked={product.showPrice}
                          onChange={handleChange}
                        />
                        <label htmlFor="showPrice" className="checktoggle mb-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="barcode-content-list border-top pt-3 mt-3">
            <div className="search-barcode-button">
              <button
                type="button"
                onClick={() => {
                  if (!validateBarcodeForm()) return;

                  const existing = String(selectedVariant?.barcode || selectedProduct?.itemBarcode || product.barcode || "").trim();
                  if (existing) {
                    setProduct((prev) => ({ ...prev, barcode: existing, uniqueBarcodes: [] }));
                    setIsFormOpen(true);
                    return;
                  }
                  generateBarcode();
                }}
                className="btn btn-submit btn-primary me-2 mt-0"
              >
                <span><TbEye className="fas fa-eye me-1" /></span>
                {hasBarcode ? "Preview Barcode" : "Generate Barcode"}
              </button>
              <a onClick={closeForm} className="btn btn-cancel btn-secondary fs-13 me-2">
                Clear
              </a>
            </div>
          </div>
        </div>

        {/* Show Barcode SVG */}
        {isFormOpen && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} >
            <div id="prints-barcode">
              <div className="modal-dialog modal-dialog-centered stock-adjust-modal barcode-modal">
                <div className="modal-content">
                  <div className="modal-header">
                    <h4>Barcode Preview</h4>
                    <button
                      type="button"
                      className="close"
                      onClick={() => setIsFormOpen(false)}
                    >
                      ×
                    </button>
                  </div>
                  <div className="modal-body pb-0">
                    <div className="d-flex justify-content-end">
                      <a onClick={handleDownloadPDF} className="btn btn-cancel close-btn btn-danger shadow-none me-2">
                        <span><FaFilePdf className="fas fa-print me-2" /></span>
                      </a>
                      <a onClick={handlePrint} className="btn btn-cancel close-btn btn-danger shadow-none">
                        <span><IoPrint className="fas fa-print me-2" /></span>
                        Print Barcode</a>
                    </div>
                    <div ref={printRef} className="row mt-3 mb-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {/* Show fetched product details for preview: name, price, unit, available qty */}
                      {/* {product.productName && (
                    <div style={{ width: '100%', marginBottom: '8px' }}>
                      <strong>{product.productName}</strong>
                      <div style={{ fontSize: '14px', color: '#444' }}>
                        {product.price != null && <span style={{ marginRight: '12px' }}>Price: ₹{Number(product.price).toFixed(2)}</span>}
                        {selectedProduct?.openingQuantity != null && <span style={{ marginRight: '12px' }}>Available Qty: {selectedProduct.openingQuantity}pic</span>}
                        {selectedProduct?.itemBarcode != null && <span> Barcode: {selectedProduct.itemBarcode}</span>}
                      </div>
                    </div>
                  )} */}
                      {Array.from({ length: numberOfBarcodes || 1 }).map((_, index) => (
                        <div key={index} className="col-sm-4" style={{
                          width: 'calc(49% - 0px)',
                          display: 'inline-block',
                          verticalAlign: 'top',
                          boxSizing: 'border-box',
                        }}>
                          <div className="barcode-scanner-link text-center" style={{
                            padding: '15px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            backgroundColor: '#fff',
                            margin: '5px 0',
                            width: '98%',
                            height: 'auto',
                          }}>
                            {product.showProductName && product.productName && (
                              <h6 style={{ color: 'black' }}>{product.productName}</h6>
                            )}

                            {product.showPrice && product.price && (
                              <p style={{ color: 'black' }}>Price: ₹{product.price.toFixed(2)}</p>
                            )}
                            {product.barcode && (
                              <svg id={`barcode-svg-${index}`}></svg>
                            )}
                          </div>
                        </div>))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>)}

        {/* Lookup-by-barcode modal (separate from prints-barcode) */}
        {isLookupOpen && (
          <div className="modal fade show" id="prints-barcode-by-code" style={{ display: 'block', backgroundColor: 'rgba(199, 197, 197, 0.4)', backdropFilter: 'blur(1px)' }}>
            <div className="modal-dialog modal-dialog-centered stock-adjust-modal barcode-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Lookup Barcode</h4>
                  </div>
                  <button type="button" className="close bg-danger text-white fs-16 shadow-none" onClick={() => { setIsLookupOpen(false); }} aria-label="Close">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body pb-0">
                  <div ref={printRef} className="row mt-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {product.productName && (
                      <div style={{ width: '100%', marginBottom: '8px' }}>
                        <strong>{product.productName}</strong>
                        <div style={{ fontSize: '14px', color: '#444' }}>
                          {product.price != null && <span style={{ marginRight: '12px' }}>Price: ₹{Number(product.price).toFixed(2)}</span>}
                          {product.unit && <span style={{ marginRight: '12px' }}>Unit: {product.unit}</span>}
                          {selectedProduct?.openingQuantity != null && <span>Available: {selectedProduct.openingQuantity}</span>}
                          {selectedProduct?.itemBarcode != null && <span> Barcode: {selectedProduct.itemBarcode}</span>}
                        </div>
                      </div>
                    )}
                    <div className="col-sm-12" style={{ width: '100%', display: 'inline-block' }}>
                      <div className="barcode-scanner-link text-center" style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#fff', margin: '5px 0' }}>
                        {/* small visible camera preview for scanning */}
                        <div style={{ marginBottom: '8px' }}>
                          <video id="barcode-lookup-video" ref={lookupVideoRef} style={{ width: 240, height: 160, borderRadius: 6, background: '#000' }} autoPlay muted playsInline />
                        </div>
                        {product.barcode && (
                          <svg id={`barcode-lookup-svg`}></svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isVariantPopupOpen && variantPopupProduct && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered stock-adjust-modal barcode-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <div className="page-title">
                    <h4>Select Variant</h4>
                  </div>
                  <button
                    type="button"
                    className="close bg-danger text-white fs-16 shadow-none"
                    onClick={() => {
                      setIsVariantPopupOpen(false);
                      setVariantPopupProduct(null);
                      setVariantPopupSelectedVariantId(null);
                      setVariantPopupMatchedBarcode("");
                    }}
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div style={{ fontWeight: 600, marginBottom: 10, color: "#111827" }}>
                    {variantPopupProduct?.productName || "Product"}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflowY: "auto" }}>
                    {getProductVariants(variantPopupProduct).map((rawV) => {
                      const v = normalizeVariant(rawV);
                      const id = v?._id ? String(v._id) : "";
                      const isActive = id && String(variantPopupSelectedVariantId || "") === id;
                      const barcodeVal = String(v?.barcode || "").trim();
                      return (
                        <div
                          key={id || `${String(v?.color || "")}:${String(v?.size || "")}:${barcodeVal}`}
                          onClick={() => setVariantPopupSelectedVariantId(id || null)}
                          style={{
                            border: isActive ? "1px solid #1F7FFF" : "1px solid #e5e7eb",
                            background: isActive ? "#EFF6FF" : "#fff",
                            borderRadius: 8,
                            padding: 10,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <div style={{ color: "#111827", fontWeight: 600, fontSize: 14 }}>
                              {String(v?.size || "").trim() || String(v?.color || "").trim()
                                ? `${String(v?.size || "").trim()} ${String(v?.color || "").trim()}`.trim()
                                : "Variant"}
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                              <FaBarcode style={{ color: '#6c757d' }} /> {barcodeVal || "-"}
                            </div>
                          </div>
                          <div style={{ color: "#111827", fontSize: 14, fontWeight: 600 }}>
                            ₹{Number(v?.sellingPrice ?? 0) || 0}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                    <button
                      type="button"
                      className="btn btn-cancel btn-secondary fs-13"
                      onClick={() => {
                        setIsVariantPopupOpen(false);
                        setVariantPopupProduct(null);
                        setVariantPopupSelectedVariantId(null);
                        setVariantPopupMatchedBarcode("");
                        setSelectedProduct(null);   // ✅ clear since user cancelled without selecting
                        setSelectedVariant(null);
                        setSearchQuery("");          // ✅ reset search too
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-submit btn-primary fs-13"
                      onClick={() => {
                        const variants = getProductVariants(variantPopupProduct);
                        const rawChosen = variants.find(
                          (variant) => String(variant?._id || "") === String(variantPopupSelectedVariantId || "")
                        ) || null;
                        if (!rawChosen) {
                          toast.error("Please select a variant");
                          return;
                        }
                        const chosen = normalizeVariant(rawChosen);
                        applyVariantSelection(variantPopupProduct, chosen);
                        setIsVariantPopupOpen(false);
                        setVariantPopupProduct(null);
                        setVariantPopupSelectedVariantId(null);
                        setVariantPopupMatchedBarcode("");
                      }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Barcode;
