import React, { useEffect, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Link, useLocation, useNavigate } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import BASE_URL from '../../../../pages/config/config';
import axios from 'axios';
import { TbEdit, TbRefresh, TbTrash } from 'react-icons/tb';
import { GrFormPrevious } from 'react-icons/gr';
import { MdNavigateNext } from 'react-icons/md';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import PDF from '../../../../assets/img/icons/pdf.svg'
import EXCEL from '../../../../assets/img/icons/excel.svg'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';
import api from "../../../../pages/config/axiosInstance"
import JsBarcode from "jsbarcode";
import { NavLink } from 'react-router-dom';
import Pagination from "../../../Pagination";
import DeleteModal from "../../../ConfirmDelete";
import { IoIosSearch, IoIosArrowDown } from "react-icons/io";
import { FiEdit } from "react-icons/fi";
import { FaArrowLeft, FaBarcode, FaFileImport } from "react-icons/fa6";
import { RiListView, RiDeleteBinLine } from "react-icons/ri";
import { MdOutlineViewSidebar, MdAddShoppingCart } from "react-icons/md";
import { TbFileImport, TbFileExport } from "react-icons/tb";
import { HiOutlineDocumentDuplicate } from "react-icons/hi";
import { RiBox3Line } from "react-icons/ri";
import { RiInboxArchiveFill, RiInboxUnarchiveFill } from "react-icons/ri";
import { LuReceiptText } from "react-icons/lu";
import { LuRefreshCcwDot } from "react-icons/lu";
import Barcode from '../../../../assets/images/barcode.jpg';
import stockin from '../../../../assets/images/stock-in.png'
import deletebtn from '../../../../assets/images/delete.png'
import { hasPermission } from '../../../../utils/permission/hasPermission';
import { useAuth } from "../../../auth/AuthContext";
import ProductDefaultImage from '../../../../assets/images/product-default.png'

const LowStock = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('low');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const shownToastsRef = useRef(new Set());
  const [outOfStockProducts, setOutOfStockProducts] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('lowStockNotificationsEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filteredOutOfStockProducts, setFilteredOutOfStockProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeRow, setActiveRow] = useState(null);

  const toggleRow = (index) => {
    const newOpen = openRow === index ? null : index;
    setOpenRow(newOpen);
    if (newOpen === null && activeRow === index) {
      setActiveRow(null);
    } else if (newOpen !== null) {
      setActiveRow(index);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  const getExportData = () => {
    const currentProducts = activeTab === 'low' ? filteredProducts : filteredOutOfStockProducts;
    return currentProducts.map(product => ({
      productName: product.productName || 'N/A',
      category: product.category?.categoryName || 'N/A',
      stockQuantity: product.stockQuantity || 0,
      itemBarcode: product.itemBarcode || 0,
      purchasePrice: product.purchasePrice || 0,
    }));
  };

  useEffect(() => {
    localStorage.setItem('lowStockNotificationsEnabled', JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/api/products');
      const allProducts = res.data.products || res.data || [];

      const lowStockProducts = allProducts.map(p => {
        const quantity = Number(p.stockQuantity ?? 0);
        let newQuantitySum = 0;

        if (Array.isArray(p.newQuantity)) {
          newQuantitySum = p.newQuantity.reduce((acc, n) => {
            const num = Number(n);
            return acc + (isNaN(num) ? 0 : num);
          }, 0);
        } else if (typeof p.newQuantity === 'number') {
          newQuantitySum = Number(p.newQuantity);
        }

        const availableQty = quantity + newQuantitySum;

        return { ...p, availableQty };
      })
        .filter(p => {
          if (typeof p.minStockToMaintain !== 'number') return false;
          if (p.stockQuantity <= 0) return false;

          return p.stockQuantity < p.minStockToMaintain;
        });

      setProducts(lowStockProducts);
      setFilteredProducts(lowStockProducts); // Initialize filtered products

      // Out of stock products
      const outStock = allProducts.map(p => {
        // Always calculate availableQty since it doesn't exist as a field in DB
        const quantity = Number(p.stockQuantity ?? 0);
        let newQuantitySum = 0;

        if (Array.isArray(p.newQuantity)) {
          newQuantitySum = p.newQuantity.reduce((acc, n) => {
            const num = Number(n);
            return acc + (isNaN(num) ? 0 : num);
          }, 0);
        } else if (typeof p.newQuantity === 'number') {
          newQuantitySum = Number(p.newQuantity);
        }

        const availableQty = quantity + newQuantitySum;
        return { ...p, availableQty };
      })
        .filter(p => {
          // Products are out of stock if availableQty <= 0 OR base quantity is 0
          const baseQuantity = Number(p.stockQuantity ?? 0);
          return p.stockQuantity <= 0 || baseQuantity === 0;
        });
      setOutOfStockProducts(outStock);
      setFilteredOutOfStockProducts(outStock); // Initialize filtered out of stock products

      // Out of stock toast will be shown only when tab is opened

      // Show a single toast with all low stock product names
      const newProducts = lowStockProducts.filter(product => !shownToastsRef.current.has(product._id));
      if (newProducts.length > 0 && notificationsEnabled) {
        const names = newProducts.map(product => `${product.productName || product.name || 'N/A'} (Available: ${product.availableQty})`).join(', ');
        toast.warn(`Low Stock: ${names}`, {
          position: 'top-right',
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        newProducts.forEach(product => shownToastsRef.current.add(product._id));
      }
    } catch (err) {
      // console.error('Error fetching products:', err);
      // console.error('Error details:', err.response?.data || err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchCategories();
    fetchWarehouses();
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
    setCurrentPage(1); // reset pagination on search
  }, [
    searchTerm,
    products,
    outOfStockProducts,
    selectedWarehouse,
    selectedCategory,
  ]);

  const getCurrentProducts = () => {
    return activeTab === 'low' ? filteredProducts : filteredOutOfStockProducts;
  };

  const getCurrentPageProducts = () => {
    const currentProducts = getCurrentProducts();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return currentProducts.slice(startIndex, endIndex);
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAll = () => {
    const currentPageProducts = getCurrentPageProducts();
    const currentPageProductIds = currentPageProducts.map(product => product._id);

    if (selectAll) {
      // Deselect all current page products
      setSelectedProducts(prev => prev.filter(id => !currentPageProductIds.includes(id)));
    } else {
      // Select all current page products
      setSelectedProducts(prev => {
        const newSelected = [...prev];
        currentPageProductIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
      try {
        // const token = localStorage.getItem("token");

        // Delete all selected products
        await Promise.all(
          selectedProducts.map(productId =>
            api.delete(`/api/products/pro/${productId}`)
          )
        );

        // Update both product lists
        setProducts(prev => prev.filter(p => !selectedProducts.includes(p._id)));
        setOutOfStockProducts(prev => prev.filter(p => !selectedProducts.includes(p._id)));

        // Clear selections
        setSelectedProducts([]);
        setSelectAll(false);

        toast.success(`${selectedProducts.length} products deleted successfully!`);
      } catch (err) {
        // console.error("Failed to delete products:", err);
        toast.error("Failed to delete some products. Please try again.");
      }
    }
  };

  useEffect(() => {
    const currentPageProducts = getCurrentPageProducts();
    const currentPageProductIds = currentPageProducts.map(product => product._id);
    const allCurrentPageSelected = currentPageProductIds.length > 0 &&
      currentPageProductIds.every(id => selectedProducts.includes(id));
    setSelectAll(allCurrentPageSelected);
  }, [selectedProducts, currentPage, activeTab, filteredProducts, filteredOutOfStockProducts]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedProducts([]);
    setSelectAll(false);
  }, [activeTab, selectedWarehouse, selectedCategory]);

  const handlePdf = () => {
    const doc = new jsPDF();
    const title = activeTab === 'low' ? 'Low Stock Products' : 'Out of Stock Products';
    doc.text(title, 14, 15);
    const tableColumns = ["Product Name", "Category", "Available Qty", "Item Barcode", "Purchase Price"];

    const currentPageProducts = getCurrentPageProducts();
    const exportRows = selectedProducts.length > 0
      ? currentPageProducts.filter((p) => selectedProducts.includes(p._id))
      : currentPageProducts;

    const tableRows = exportRows.map((e) => [
      e.productName || 'N/A',
      e.category?.categoryName || 'N/A',
      e.stockQuantity ?? 0,
      e.itemBarcode || 'N/A',
      e.purchasePrice ?? 0,
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [155, 155, 155],
        textColor: "white",
      },
      theme: "striped",
    });

    const filename = activeTab === 'low' ? 'low-stock-products.pdf' : 'out-of-stock-products.pdf';
    doc.save(filename);
  };

  const handleExcel = () => {
    const stockData = getExportData();
    const tableColumns = ["SKU", "Product Name", "Category", "Brand", "Available Qty", "Alert Level", "Supplier", "Warehouse"];

    const tableRows = stockData.map((e) => [
      e.sku,
      e.productName,
      e.category,
      e.brand,
      e.availableQty,
      e.quantityAlert,
      e.supplier,
      e.warehouse,
    ]);

    const data = [tableColumns, ...tableRows];

    const worksheet = XLSX.utils.aoa_to_sheet(data);

    const workbook = XLSX.utils.book_new();
    const sheetName = activeTab === 'low' ? 'LowStockProducts' : 'OutOfStockProducts';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const filename = activeTab === 'low' ? 'low-stock-products.xlsx' : 'out-of-stock-products.xlsx';
    XLSX.writeFile(workbook, filename);
  };

  const [categories, setCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      // const token = localStorage.getItem("token");
      const res = await api.get('/api/category/categories');
      setCategories(res.data.categories || res.data || []);
    } catch (error) {
      // console.error("Error fetching categories:", error);
      setCategories([]);
    }
  };

  const [warehouses, setWarehouses] = useState([]);

  const fetchWarehouses = async () => {
    try {
      // const token = localStorage.getItem("token");
      const res = await api.get('/api/warehouse');
      const warehouseData = res.data.data || res.data.warehouses || res.data || [];
      setWarehouses(warehouseData);
    } catch (error) {
      // console.error("Error fetching warehouses:", error);
      setWarehouses([]);
    }
  };

  const applyFilters = () => {
    let low = [...products];
    let out = [...outOfStockProducts];

    // 🔍 SEARCH FILTER
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();

      low = low.filter(p =>
        (p.productName || '').toLowerCase().includes(term)
      );

      out = out.filter(p =>
        (p.productName || '').toLowerCase().includes(term)
      );
    }

    // 🏢 WAREHOUSE FILTER
    if (selectedWarehouse) {
      low = low.filter(p =>
        (p.warehouseName || p.warehouse || '')
          .toLowerCase()
          .includes(selectedWarehouse.toLowerCase())
      );

      out = out.filter(p =>
        (p.warehouseName || p.warehouse || '')
          .toLowerCase()
          .includes(selectedWarehouse.toLowerCase())
      );
    }

    // 🗂 CATEGORY FILTER
    if (selectedCategory) {
      low = low.filter(p =>
        (p.category?.categoryName || '')
          .toLowerCase()
          .includes(selectedCategory.toLowerCase())
      );

      out = out.filter(p =>
        (p.category?.categoryName || '')
          .toLowerCase()
          .includes(selectedCategory.toLowerCase())
      );
    }

    setFilteredProducts(low);
    setFilteredOutOfStockProducts(out);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedWarehouse('');
    setSelectedCategory('');
    setFilteredProducts(products);
    setFilteredOutOfStockProducts(outOfStockProducts);
  };

  const handleReset = () => {
    resetFilters();
  };

  const handleWarehouseFilter = (warehouseName) => {
    setSelectedWarehouse(warehouseName);
  };

  const handleCategoryFilter = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const exportToPDF = (data, title) => {
    const doc = new jsPDF();
    doc.text(title, 14, 15);
    const tableColumns = ["SKU", "Product Name", "Category", "Brand", "Available Qty", "Alert Level", "Supplier", "Warehouse"];

    const tableRows = data.map((e) => [
      e.sku || 'N/A',
      e.productName || e.name || 'N/A',
      e.category?.categoryName || e.category || 'N/A',
      e.brand?.brandName || 'N/A',
      e.availableQty || 0,
      e.quantityAlert || 0,
      e.supplierName || 'N/A',
      e.warehouseName || e.warehouse || 'N/A',
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [155, 155, 155],
        textColor: "white",
      },
      theme: "striped",
    });

    const filename = title.toLowerCase().replace(/\s+/g, '-') + '.pdf';
    doc.save(filename);
  };

  const exportToExcel = (data, title) => {
    const tableColumns = ["SKU", "Product Name", "Category", "Brand", "Available Qty", "Alert Level", "Supplier", "Warehouse"];

    const tableRows = data.map((e) => [
      e.sku || 'N/A',
      e.productName || e.name || 'N/A',
      e.category?.categoryName || e.category || 'N/A',
      e.brand?.brandName || 'N/A',
      e.availableQty || 0,
      e.quantityAlert || 0,
      e.supplierName || 'N/A',
      e.warehouseName || e.warehouse || 'N/A',
    ]);

    const dataForExcel = [tableColumns, ...tableRows];

    const worksheet = XLSX.utils.aoa_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    const sheetName = title.replace(/\s+/g, '');
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    const filename = title.toLowerCase().replace(/\s+/g, '-') + '.xlsx';
    XLSX.writeFile(workbook, filename);
  };

  const [viewBarcode, setViewBarcode] = useState([]);
  const [viewOptions, setViewOptions] = useState([]);

  const buttonRefs = useRef([]);
  const modelRef = useRef(null); // reference to modal area

  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0 });
  const [openUpwards, setOpenUpwards] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // close only when:
      const isClickInsideModel =
        modelRef.current && modelRef.current.contains(event.target);

      const isClickInsideButton =
        buttonRefs.current[viewBarcode] &&
        buttonRefs.current[viewBarcode].contains(event.target);

      buttonRefs.current[viewOptions] &&
        buttonRefs.current[viewOptions].contains(event.target);

      if (!isClickInsideModel && !isClickInsideButton) {
        setViewBarcode(false);
        setViewOptions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [viewBarcode][viewOptions]);

  const tabs = [
    { label: 'low', count: filteredProducts.length, active: true },
    { label: 'out', count: filteredOutOfStockProducts.length, },
  ];

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const handleDelete = (id) => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await api.delete(`/api/products/pro/${deleteTargetId}`);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      await fetchProducts();
    } catch (err) {
      setShowDeleteModal(false);
      // console.error("Delete product error:", err);
    }
  };

  // Handle Barcode rendering for list view popup
  useEffect(() => {
    if (viewBarcode) {
      const allProducts = [...products, ...outOfStockProducts];
      const product = allProducts.find(p => p._id === viewBarcode);

      if (product && product.itemBarcode) {
        setTimeout(() => {
          const element = document.getElementById(`barcode-svg-${viewBarcode}`);
          if (element) {
            try {
              let format = "CODE128";
              // if (/^\d{12,13}$/.test(product.itemBarcode)) format = "EAN13";
              JsBarcode(element, product.itemBarcode, {
                format: format,
                lineColor: "#000",
                width: 2,
                height: 100,
                displayValue: true,
              });
            } catch (e) {
              // Fallback or retry
              try {
                JsBarcode(element, product.itemBarcode, {
                  format: "CODE128",
                  lineColor: "#000",
                  width: 2,
                  height: 100,
                  displayValue: true,
                });
              } catch (err) { }
            }
          }
        }, 100);
      }
    }
  }, [viewBarcode, products, outOfStockProducts]);

  return (
    <div className='px-4 py-4'>
      {/* back, header, view style */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0px', // Optional: padding for container
        height: '32px'
      }}>
        {/* Left: Title + Icon */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
        }}>
          <h2 style={{
            margin: 0,
            color: 'black',
            fontSize: 22,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            lineHeight: '26.4px',
          }}>
            Low Stocks
          </h2>
        </div>
      </div>

      {/* main body */}
      <div style={{
        width: '100%',
        marginTop: '8px',
        minHeight: "auto",
        maxHeight: "calc(100vh - 130px)",
        padding: 16,
        background: 'white',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Search Bar & export import */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          height: '33px',
          width: '100%',
        }}>

          <div style={{
            height: '33px',
            position: 'relative',
            padding: '8px 16px 8px 20px',
            display: 'flex',
            borderRadius: 8,
            alignItems: 'center',
            background: '#FCFCFC',
            border: '1px solid #EAEAEA',
            gap: '5px',
            color: 'rgba(19.75, 25.29, 61.30, 0.40)',
            width: "50%",
          }}>
            <IoIosSearch className="fs-4" />
            <input
              type="search"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: 14,
                background: '#FCFCFC',
                color: 'rgba(19.75, 25.29, 61.30, 0.40)',
              }}
            />
          </div>

          <div
            style={{
              display: 'inline-flex',
              justifyContent: 'end',
              alignItems: 'center',
              gap: 16,
              height: '33px',
              width: '50%'
            }}
          >
            {/* Export Button */}
            {hasPermission ("LowStocks", "export") && (
            <button
              style={{
                display: 'flex',
                height: '33px',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 9,
                padding: '8px 16px',
                background: '#FCFCFC',
                borderRadius: 8,
                outline: '1px solid #EAEAEA',
                outlineOffset: '-1px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 400,
                lineHeight: '16.8px',
                color: '#0E101A',
              }}
              onClick={handlePdf} title={t("Download PDF")}
            >
              <TbFileExport className='fs-5 text-secondary' />
              Export
            </button>
            )}
          </div>

        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: 8,
          padding: 2,
          background: "#F3F8FB",
          borderRadius: 8,
          flexWrap: "wrap",
          height: "38px",
          width: 'fit-content',
        }}>
          {tabs.map((tab) => {
            const isActive = tab.label === activeTab;
            return (
              <div
                key={tab.label}
                onClick={() => setActiveTab(tab.label)}
                style={{
                  padding: '6px 12px',
                  background: isActive ? 'white' : 'transparent',
                  borderRadius: 8,
                  boxShadow: isActive
                    ? '0px 1px 4px rgba(0, 0, 0, 0.10)'
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  cursor: 'pointer',
                  color: '#0E101A',
                }}
              >
                {tab.label === 'low' ? 'Low Stock' : 'Out of Stock'}
                <span style={{ color: '#727681' }}>{tab.count}</span>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="table-responsive" style={{
          overflowY: "auto",
          maxHeight: '510px',
        }}>
          <table
            className="table-responsive"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              overflowX: "auto",
            }}
          >
            {/* Header */}
            <thead style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              height: '38px'
            }}>
              <tr style={{ background: '#F3F8FB' }}>
                <th style={{ textAlign: 'left', padding: '4px 16px', color: '#727681', fontSize: 14, width: 80, fontWeight: '500' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <input
                      type="checkbox"
                      style={{ width: 18, height: 18 }}
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                    Product Name & Category
                  </div>
                </th>
                <th style={{ textAlign: 'left', padding: '4px 16px', color: '#727681', fontSize: 14, width: 100, fontWeight: '500' }}>
                  Available Quantity
                </th>
                <th style={{ textAlign: 'left', padding: '4px 16px', color: '#727681', fontSize: 14, width: 200, fontWeight: '500' }}>
                  Item Code
                </th>
                <th style={{ textAlign: 'left', padding: '4px 16px', color: '#727681', fontSize: 14, width: 123, fontWeight: '500' }}>
                  Purchase Price
                </th>
                <th style={{ textAlign: 'center', padding: '4px 16px', color: '#727681', fontSize: 14, width: 100, fontWeight: '500' }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {getCurrentPageProducts().length > 0 ? (
                getCurrentPageProducts().map(product => (
                  <tr key={product._id}
                    style={{
                      borderBottom: "1px solid #EAEAEA",
                      height: "46px",
                    }}
                    className={`table-hover ${activeRow === product._id ? "active-row" : ""}`}
                    onClick={() =>
                      navigate(
                        `/product/view/${product._id}`, { state: { from: location.pathname } }
                      )
                    }
                  >
                    {/* Product Name & Category */}
                    <td style={{ padding: '8px 16px', verticalAlign: 'middle', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="checkbox"
                          style={{ width: 18, height: 18 }}
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => handleProductSelect(product._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <a className="avatar avatar-md">
                          {product.images?.[0] ? (
                            <img src={product.images[0].url} alt={product.productName} className="media-image" />
                          ) : (
                            <img src={ProductDefaultImage} alt='Product Default Image' className="media-image" />
                          )}
                        </a>
                        <div
                          onClick={() =>
                            navigate(
                              `/product/view/${product._id}`, { state: { from: location.pathname } }
                            )
                          }
                          style={{ fontSize: 14, color: '#0E101A', whiteSpace: 'nowrap', display: 'flex', gap: '5px', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}>
                          <div>{product.productName}</div>
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: '#FFE0FC',
                            color: '#AE009B',
                            borderRadius: 36,
                            fontSize: 12,
                            marginTop: 4,
                          }}>
                            {product.category?.categoryName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td style={{ padding: '8px 16px', fontSize: 14, color: '#0E101A', cursor: 'pointer' }}>
                      <div
                        style={{ textDecoration: 'none' }}
                      >
                        <span style={{ color: product.stockQuantity < product.minStockToMaintain ? "#D8484A" : "#727681" }}>{product.stockQuantity} {product.unit.toLowerCase()}</span>
                      </div>
                    </td>

                    {/* Item Code */}
                    <td style={{ padding: '8px 16px', fontSize: 14, color: '#0E101A', cursor: 'pointer' }} onClick={(e) => e.stopPropagation(e)}>

                      {product.itemBarcode ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            position: "relative",
                          }}
                          onClick={() =>
                            setViewBarcode(
                              viewBarcode === product._id ? false : product._id
                            )
                          }
                          ref={(el) =>
                            (buttonRefs.current[product._id] = el)
                          }
                        >
                          {product.itemBarcode}
                          {product.itemBarcode ? (
                            <FaBarcode className="fs-6 text-secondary" />
                          ) : (
                            "-"
                          )}
                        </div>
                      ) : (
                        "-"
                      )}

                      {viewBarcode === product._id && (
                        <>
                          <div
                            style={{
                              position: "fixed",
                              inset: 0,
                              background: "rgba(0,0,0,0.5)",
                              zIndex: 999999,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              ref={modelRef}
                              style={{
                                width: "70%",
                                backgroundColor: "#f5f4f4ff",
                                borderRadius: 16,
                                padding: 24,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  width: "300px",
                                  height: "auto",
                                  backgroundColor: "white",
                                  outfit: "contain",
                                  boxShadow:
                                    "10px 10px 40px rgba(0,0,0,0.10)",
                                  borderRadius: 16,
                                  padding: 16,
                                  border: "2px solid #dbdbdbff",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 8,
                                }}
                              >
                                <span>
                                  {product.productName} / ₹{product.purchasePrice}/-
                                </span>
                                <div className="d-flex justify-content-center align-items-center">
                                  <svg id={`barcode-svg-${product._id}`}></svg>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </td>

                    {/* Purchase Price */}
                    <td style={{ padding: '8px 16px', fontSize: 14, color: '#0E101A', cursor: 'pointer' }}>
                      {product.purchasePrice}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '8px 16px', position: 'relative', overflow: 'visible', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        position: 'relative',
                        cursor: 'pointer',
                      }}
                        onClick={() =>
                          setViewOptions(
                            viewOptions === product._id ? false : product._id
                          )
                        }
                        ref={(el) => (buttonRefs.current[product._id] = el)}
                      >
                        <div style={{
                          width: 24,
                          height: 24,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}

                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();

                            const dropdownHeight = 260; // your menu height
                            const spaceBelow = window.innerHeight - rect.bottom;
                            const spaceAbove = rect.top;

                            // decide direction
                            if (
                              spaceBelow < dropdownHeight &&
                              spaceAbove > dropdownHeight
                            ) {
                              setOpenUpwards(true);
                              setDropdownPos({
                                x: rect.left,
                                y: rect.top - 6, // position above button
                              });
                            } else {
                              setOpenUpwards(false);
                              setDropdownPos({
                                x: rect.left,
                                y: rect.bottom + 6, // position below button
                              });
                            }

                            setViewOptions(viewOptions === product._id ? false : product._id);
                          }}
                          ref={(el) => (buttonRefs.current[product._id] = el)}
                        >
                          <div style={{ width: 4, height: 4, background: '#6C748C', borderRadius: 2 }} />
                          <div style={{ width: 4, height: 4, background: '#6C748C', borderRadius: 2 }} />
                          <div style={{ width: 4, height: 4, background: '#6C748C', borderRadius: 2 }} />

                        </div>
                        {viewOptions === product._id && (
                          <>
                            <div
                              style={{
                                position: "fixed",
                                top: openUpwards
                                  ? dropdownPos.y - 90
                                  : dropdownPos.y,
                                left: dropdownPos.x - 80,
                                zIndex: 999999,
                              }}
                            >
                              <div
                                ref={modelRef}
                                style={{
                                  background: "white",
                                  padding: 8,
                                  borderRadius: 12,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                  minWidth: 180,
                                  height: "auto", // height must match dropdownHeight above
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                }}
                              >
                                {/* <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 8,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontFamily: 'Inter, sans-serif',
                                        fontSize: 16,
                                        fontWeight: 400,
                                        color: '#6C748C',
                                        textDecoration: 'none',
                                      }}
                                      className='button-action'
                                    >
                                      <img src={stockin} alt="" />
                                      <span style={{ color: 'black' }}>Add To PO</span>
                                    </div> */}
                                    {hasPermission(user, "LowStocks", "delete") && (
                                <div
                                  onClick={() =>
                                    handleDelete(product._id)
                                  }
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontFamily: 'Inter, sans-serif',
                                    fontSize: 16,
                                    fontWeight: 400,
                                    color: '#6C748C',
                                    textDecoration: 'none',
                                  }}
                                  className='button-action'
                                >
                                  <img src={deletebtn} alt="" />
                                  <span style={{ color: 'black' }}>Delete</span>
                                </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))) : (
                <tr style={{ borderBottom: "1px solid #FCFCFC", height: '46px' }}>
                  <td
                    colSpan={5}
                    style={{
                      padding: '8px 16px',
                      verticalAlign: 'middle',
                      textAlign: 'center',
                      fontSize: 14,
                      color: '#6C748C',
                    }}
                  >
                    No Record Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="page-redirect-btn">
          <Pagination
            currentPage={currentPage}
            total={
              activeTab === 'low'
                ? filteredProducts.length
                : filteredOutOfStockProducts.length
            }
            itemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onItemsPerPageChange={(n) => {
              setItemsPerPage(n);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <DeleteModal
        isOpen={showDeleteModal}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        itemName="product"
      />

    </div>

  );
};

export default LowStock;
