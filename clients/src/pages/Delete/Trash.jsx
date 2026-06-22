import React, { useEffect, useState } from "react";

// pages
import api from "../../pages/config/axiosInstance"
import Pagination from "../../components/Pagination";

// icons
import { TbTrash, TbRestore } from "react-icons/tb";

const tabList = ['Products', 'Categories', 'Subcategories', 'Brands', 'HSN', 'Units', 'Tax', 'Sizes', 'Colors', 'Customers', 'Suppliers', 'Salesman', 'Broker', 'Vehicles', 'Drivers', 'Transporters', 'Points & Rewards', 'Expenses'];

const Trash = () => {
  const [loading, setLoading] = useState(false);
  const [tabs, setTabs] = useState(tabList);
  const [currentTab, setCurrentTab] = useState(tabList[0]);

  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreTargetId, setRestoreTargetId] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const handleTabClick = (tab) => {
    setCurrentTab(tab);
    setTabs(tabList);
    getExistingProducts();
  };

  // Products list---------------------------------------------------------------------------------------------------------

  const [existingProducts, setExistingProducts] = useState([]);
  const [currentProductsPage, setCurrentProductsPage] = useState(1);
  const [itemsProductsPerPage, setItemsProductsPerPage] = useState(10);

  const getExistingProducts = async () => {
    setLoading(true);
    try {
      // const response = await api.get("/api/products/all-existing-products");
      const response = await api.get("/api/products/deleted");

      // const data = response.data;
      // const list = Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : []);

      // setExistingProducts(list);
      setExistingProducts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExistingProducts();
  }, []);

  const productsArray = Array.isArray(existingProducts) ? existingProducts : [];

  const totalProductsItems = productsArray.length;

  const paginatedProducts = productsArray.slice(
    (currentProductsPage - 1) * itemsProductsPerPage,
    currentProductsPage * itemsProductsPerPage
  );

  // Category----------------------------------------------------------------------------------------------------------
  const [existingCategory, setExistingCategory] = useState([]);
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [itemsCategoryPerPage, setItemsCategoryPerPage] = useState(10);

  const getExistingCategory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/category/deleted");
      setExistingCategory(response.data);
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExistingCategory();
  }, []);

  const categoryArray = Array.isArray(existingCategory) ? existingCategory : [];

  const totalCategoryItems = categoryArray.length;

  const paginatedCategory = categoryArray.slice(
    (currentCategoryPage - 1) * itemsCategoryPerPage,
    currentCategoryPage * itemsCategoryPerPage
  );

  // Subcategory---------------------------------------------------------------------------------------------------------
  const [existingSubcategory, setExistingSubcategory] = useState([]);
  const [currentSubcategoryPage, setCurrentSubcategoryPage] = useState(1);
  const [itemsSubcategoryPerPage, setItemsSubcategoryPerPage] = useState(10);

  const getExistingSubcategory = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/subcategory/deleted");
      setExistingSubcategory(response.data);
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExistingSubcategory();
  }, []);

  const subcategoryArray = Array.isArray(existingSubcategory) ? existingSubcategory : [];

  const totalSubcategoryItems = subcategoryArray.length;

  const paginatedSubcategory = subcategoryArray.slice(
    (currentSubcategoryPage - 1) * itemsSubcategoryPerPage,
    currentSubcategoryPage * itemsSubcategoryPerPage
  );

  // Brand---------------------------------------------------------------------------------------------------------
  const [existingBrand, setExistingBrand] = useState([]);
  const [currentBrandPage, setCurrentBrandPage] = useState(1);
  const [itemsBrandPerPage, setItemsBrandPerPage] = useState(10);

  const getExistingBrand = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/brands/deleted");
      // setExistingBrand(response.data);
      setExistingBrand(response.data?.brands ?? []);
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExistingBrand();
  }, []);

  const brandArray = Array.isArray(existingBrand) ? existingBrand : [];

  const totalBrandItems = brandArray.length;

  const paginatedBrand = brandArray.slice(
    (currentBrandPage - 1) * itemsBrandPerPage,
    currentBrandPage * itemsBrandPerPage
  );

  // HSN---------------------------------------------------------------------------------------------------------
  const [existingHSN, setExistingHSN] = useState([]);
  const [currentHSNPage, setCurrentHSNPage] = useState(1);
  const [itemsHSNPerPage, setItemsHSNPerPage] = useState(10);

  const getExistingHSN = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/hsn/deleted");
      setExistingHSN(response.data);
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExistingHSN();
  }, []);

  const hsnArray = Array.isArray(existingHSN) ? existingHSN : [];

  const totalHSNItems = hsnArray.length;

  const paginatedHSN = hsnArray.slice(
    (currentHSNPage - 1) * itemsHSNPerPage,
    currentHSNPage * itemsHSNPerPage
  );

  // Unit---------------------------------------------------------------------------------------------------------
  const [existingUnit, setExistingUnit] = useState([]);
  const [currentUnitPage, setCurrentUnitPage] = useState(1);
  const [itemsUnitPerPage, setItemsUnitPerPage] = useState(10);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/unit/deleted');
      setExistingUnit(res.data?.units ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const unitArray = Array.isArray(existingUnit) ? existingUnit : [];

  const totalUnitItems = unitArray.length;

  const paginatedUnit = unitArray.slice(
    (currentUnitPage - 1) * itemsUnitPerPage,
    currentUnitPage * itemsUnitPerPage
  );

  // Tax---------------------------------------------------------------------------------------------------------
  const [existingTax, setExistingTax] = useState([]);
  const [currentTaxPage, setCurrentTaxPage] = useState(1);
  const [itemsTaxPerPage, setItemsTaxPerPage] = useState(10);

  const getExistingTax = async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/tax/deleted");
      setExistingTax(response.data?.taxs ?? []);
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getExistingTax();
  }, []);

  const taxArray = Array.isArray(existingTax) ? existingTax : [];

  const totalTaxItems = taxArray.length;

  const paginatedTax = taxArray.slice(
    (currentTaxPage - 1) * itemsTaxPerPage,
    currentTaxPage * itemsTaxPerPage
  );

  // Size---------------------------------------------------------------------------------------------------------
  const [existingSize, setExistingSize] = useState([]);
  const [currentSizePage, setCurrentSizePage] = useState(1);
  const [itemsSizePerPage, setItemsSizePerPage] = useState(10);

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/size/deleted');
      setExistingSize(res.data?.sizes ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const sizeArray = Array.isArray(existingSize) ? existingSize : [];

  const totalSizeItems = sizeArray.length;

  const paginatedSize = sizeArray.slice(
    (currentSizePage - 1) * itemsSizePerPage,
    currentSizePage * itemsSizePerPage
  );

  // Color---------------------------------------------------------------------------------------------------------
  const [existingColor, setExistingColor] = useState([]);
  const [currentColorPage, setCurrentColorPage] = useState(1);
  const [itemsColorPerPage, setItemsColorPerPage] = useState(10);

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/color/deleted');
      setExistingColor(res.data?.colors ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const colorArray = Array.isArray(existingColor) ? existingColor : [];

  const totalColorItems = colorArray.length;

  const paginatedColor = colorArray.slice(
    (currentColorPage - 1) * itemsColorPerPage,
    currentColorPage * itemsColorPerPage
  );

  // Customer---------------------------------------------------------------------------------------------------------
  const [existingCustomer, setExistingCustomer] = useState([]);
  const [currentCustomerPage, setCurrentCustomerPage] = useState(1);
  const [itemsCustomerPerPage, setItemsCustomerPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/customers/deleted');
      setExistingCustomer(res.data?.customers ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const customerArray = Array.isArray(existingCustomer) ? existingCustomer : [];

  const totalCustomerItems = customerArray.length;

  const paginatedCustomer = customerArray.slice(
    (currentCustomerPage - 1) * itemsCustomerPerPage,
    currentCustomerPage * itemsCustomerPerPage
  );

  // Supplier---------------------------------------------------------------------------------------------------------
  const [existingSupplier, setExistingSupplier] = useState([]);
  const [currentSupplierPage, setCurrentSupplierPage] = useState(1);
  const [itemsSupplierPerPage, setItemsSupplierPerPage] = useState(10);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/suppliers/deleted');
      setExistingSupplier(res.data?.suppliers ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const supplierArray = Array.isArray(existingSupplier) ? existingSupplier : [];

  const totalSupplierItems = supplierArray.length;

  const paginatedSupplier = supplierArray.slice(
    (currentSupplierPage - 1) * itemsSupplierPerPage,
    currentSupplierPage * itemsSupplierPerPage
  );

  // Expense---------------------------------------------------------------------------------------------------------
  const [existingExpense, setExistingExpense] = useState([]);
  const [currentExpensePage, setCurrentExpensePage] = useState(1);
  const [itemsExpensePerPage, setItemsExpensePerPage] = useState(10);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/expenses/deleted');
      setExistingExpense(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchExpenses();
  }, []);

  const expenseArray = Array.isArray(existingExpense) ? existingExpense : [];

  const totalExpenseItems = expenseArray.length;

  const paginatedExpense = expenseArray.slice(
    (currentExpensePage - 1) * itemsExpensePerPage,
    currentExpensePage * itemsExpensePerPage
  );

  // Salesman---------------------------------------------------------------------------------------------------------
  const [existingSalesman, setExistingSalesman] = useState([]);
  const [currentSalesmanPage, setCurrentSalesmanPage] = useState(1);
  const [itemsSalesmanPerPage, setItemsSalesmanPerPage] = useState(10);

  useEffect(() => {
    fetchSalesmen();
  }, []);

  const fetchSalesmen = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/salesman/deleted');
      setExistingSalesman(res.data?.salesman ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const salesmanArray = Array.isArray(existingSalesman) ? existingSalesman : [];

  const totalSalesmanItems = salesmanArray.length;

  const paginatedSalesman = salesmanArray.slice(
    (currentSalesmanPage - 1) * itemsSalesmanPerPage,
    currentSalesmanPage * itemsSalesmanPerPage
  );

  // Broker---------------------------------------------------------------------------------------------------------
  const [existingBroker, setExistingBroker] = useState([]);
  const [currentBrokerPage, setCurrentBrokerPage] = useState(1);
  const [itemsBrokerPerPage, setItemsBrokerPerPage] = useState(10);

  useEffect(() => {
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/broker/deleted');
      setExistingBroker(res.data?.broker ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const brokerArray = Array.isArray(existingBroker) ? existingBroker : [];

  const totalBrokerItems = brokerArray.length;

  const paginatedBroker = brokerArray.slice(
    (currentBrokerPage - 1) * itemsBrokerPerPage,
    currentBrokerPage * itemsBrokerPerPage
  );

  // Vehicle---------------------------------------------------------------------------------------------------------
  const [existingVehicle, setExistingVehicle] = useState([]);
  const [currentVehiclePage, setCurrentVehiclePage] = useState(1);
  const [itemsVehiclePerPage, setItemsVehiclePerPage] = useState(10);

  useEffect(() => {
    fetchVehicles();
  }, []);
  
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/vehicle/deleted');
      setExistingVehicle(res.data?.vehicle ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const vehicleArray = Array.isArray(existingVehicle) ? existingVehicle : [];

  const totalVehicleItems = vehicleArray.length;

  const paginatedVehicle = vehicleArray.slice(
    (currentVehiclePage - 1) * itemsVehiclePerPage,
    currentVehiclePage * itemsVehiclePerPage
  );

  // Driver---------------------------------------------------------------------------------------------------------
  const [existingDriver, setExistingDriver] = useState([]);
  const [currentDriverPage, setCurrentDriverPage] = useState(1);
  const [itemsDriverPerPage, setItemsDriverPerPage] = useState(10);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/driver/deleted');
      setExistingDriver(res.data?.driver ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const driverArray = Array.isArray(existingDriver) ? existingDriver : [];

  const totalDriverItems = driverArray.length;

  const paginatedDriver = driverArray.slice(
    (currentDriverPage - 1) * itemsDriverPerPage,
    currentDriverPage * itemsDriverPerPage
  );

  // Transporter---------------------------------------------------------------------------------------------------------
  const [existingTransporter, setExistingTransporter] = useState([]);
  const [currentTransporterPage, setCurrentTransporterPage] = useState(1);
  const [itemsTransporterPerPage, setItemsTransporterPerPage] = useState(10);

  useEffect(() => {
    fetchTransporters();
  }, []);

  const fetchTransporters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/transporter/deleted');
      setExistingTransporter(res.data?.transporter ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const transporterArray = Array.isArray(existingTransporter) ? existingTransporter : [];

  const totalTransporterItems = transporterArray.length;

  const paginatedTransporter = transporterArray.slice(
    (currentTransporterPage - 1) * itemsTransporterPerPage,
    currentTransporterPage * itemsTransporterPerPage
  );

  // Points & Rewards---------------------------------------------------------------------------------------------------------
  const [existingPoints, setExistingPoints] = useState([]);
  const [currentPointsPage, setCurrentPointsPage] = useState(1);
  const [itemsPointsPerPage, setItemsPointsPerPage] = useState(10);

  useEffect(() => {
    fetchPoints();
  }, []);

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/reward-systems/deleted');
      setExistingPoints(res.data?.rewards ?? []);
    } catch (err) {
      toast.error(err?.response?.data?.displayMessage || err?.response?.data?.message || err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  const pointsArray = Array.isArray(existingPoints) ? existingPoints : [];

  const totalPointsItems = pointsArray.length;

  const paginatedPoints = pointsArray.slice(
    (currentPointsPage - 1) * itemsPointsPerPage,
    currentPointsPage * itemsPointsPerPage
  );

  // open modal with target id-----------------------------------------------------------------------------------------
  const handleRestoreClick = (id) => {
    setRestoreTargetId(id);
    setShowRestoreModal(true);
  };

  const cancelRestore = () => {
    setShowRestoreModal(false);
    setRestoreTargetId(null);
  };

  const confirmRestore = async () => {
    if (!restoreTargetId) return;
    setRestoring(true);
    try {

      if (currentTab === 'Products') {
        await api.patch(`/api/products/restore/${restoreTargetId}`);
        setExistingProducts((prev) =>
          prev.filter((p) => p._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Categories') {
        await api.patch(`/api/category/restore/${restoreTargetId}`);
        setExistingCategory((prev) =>
          prev.filter((c) => c._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Subcategories') {
        await api.patch(`/api/subcategory/restore/${restoreTargetId}`);
        setExistingSubcategory((prev) =>
          prev.filter((s) => s._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Brands') {
        await api.patch(`/api/brands/restore/${restoreTargetId}`);
        setExistingBrand((prev) =>
          prev.filter((b) => b._id !== restoreTargetId)
        );
      }

      if (currentTab === 'HSN') {
        await api.patch(`/api/hsn/restore/${restoreTargetId}`);
        setExistingHSN((prev) =>
          prev.filter((h) => h._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Units') {
        await api.patch(`/api/unit/restore/${restoreTargetId}`);
        setExistingUnit((prev) =>
          prev.filter((u) => u._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Tax') {
        await api.patch(`/api/tax/restore/${restoreTargetId}`);
        setExistingTax((prev) =>
          prev.filter((t) => t._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Sizes') {
        await api.patch(`/api/size/restore/${restoreTargetId}`);
        setExistingSize((prev) =>
          prev.filter((s) => s._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Colors') {
        await api.patch(`/api/color/restore/${restoreTargetId}`);
        setExistingColor((prev) =>
          prev.filter((c) => c._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Customers') {
        await api.patch(`/api/customers/restore/${restoreTargetId}`);
        setExistingCustomer((prev) =>
          prev.filter((c) => c._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Suppliers') {
        await api.patch(`/api/suppliers/restore/${restoreTargetId}`);
        setExistingSupplier((prev) =>
          prev.filter((s) => s._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Expenses') {
        await api.patch(`/api/expenses/restore/${restoreTargetId}`);
        setExistingExpense((prev) =>
          prev.filter((e) => e._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Salesman') {
        await api.patch(`/api/salesman/restore/${restoreTargetId}`);
        setExistingSalesman((prev) =>
          prev.filter((s) => s._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Broker') {
        await api.patch(`/api/broker/restore/${restoreTargetId}`);
        setExistingBroker((prev) =>
          prev.filter((b) => b._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Vehicles') {
        await api.patch(`/api/vehicle/restore/${restoreTargetId}`);
        setExistingVehicle((prev) =>
          prev.filter((v) => v._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Drivers') {
        await api.patch(`/api/driver/restore/${restoreTargetId}`);
        setExistingDriver((prev) =>
          prev.filter((d) => d._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Transporters') {
        await api.patch(`/api/transporter/restore/${restoreTargetId}`);
        setExistingTransporter((prev) =>
          prev.filter((t) => t._id !== restoreTargetId)
        );
      }

      if (currentTab === 'Points & Rewards') {
        await api.patch(`/api/reward-systems/restore/${restoreTargetId}`);
        setExistingPoints((prev) =>
          prev.filter((p) => p._id !== restoreTargetId)
        );
      }

      setShowRestoreModal(false);
      setRestoreTargetId(null);
    } catch (error) {
      console.error("Error restoring product:", error);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="p-4" style={{ height: "100vh" }}>

      {/* Restore Confirm Modal */}
      {showRestoreModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: 24,
              width: 360,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TbRestore style={{ fontSize: 24, color: "#1F7FFF" }} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
                Restore Product
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "#727681" }}>
              Are you sure you want to restore this item? It will be moved
              back to your related list.
            </p>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button
                onClick={cancelRestore}
                disabled={restoring}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "1px solid #EAEAEA",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmRestore}
                disabled={restoring}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "#1F7FFF",
                  color: "white",
                  cursor: restoring ? "not-allowed" : "pointer",
                  fontSize: 14,
                  fontFamily: "Inter, sans-serif",
                  opacity: restoring ? 0.7 : 1,
                }}
              >
                {restoring ? "Restoring..." : "Restore"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* header */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
          flexWrap: "wrap"
        }}
      >
        {/* Left: Title + Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: "33px",

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
            Trash
          </h2>
        </div>
      </div>

      {/* main content */}
      <div style={{
        width: "100%",
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        minHeight: "500px",
        height: 'calc(100vh - 315px)',
      }}>
        {/* left */}
        <div style={{
          width: "20%",
          border: '1px solid #EAEAEA',
          borderRadius: '8px',
          backgroundColor: 'white',
          height: '100%',
          padding: "16px",
          overflowY: "auto",
        }}>
          {tabs.map((tab) => (
            <div
              key={tab}
              style={{
                padding: 12,
                cursor: "pointer",
                fontSize: 14,
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                lineHeight: "26.4px",
                color: currentTab === tab ? "#1F7FFF" : "#727681",
                border: currentTab === tab ? "1px solid #1F7FFF" : "none",
                backgroundColor: currentTab === tab ? "#E5F0FF" : "transparent",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </div>
          ))}
        </div>

        {/* right */}
        <div style={{
          width: "80%",
          border: '1px solid #EAEAEA',
          borderRadius: '8px',
          backgroundColor: 'white',
          height: '100%',
        }}>
          {currentTab === "Products" && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Product Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingProducts.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Product Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedProducts.map((product) => (
                          <tr key={product._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {product.productName}
                                </div>
                              </div>
                            </td>

                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(product._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentProductsPage}
                  total={totalProductsItems}
                  itemsPerPage={itemsProductsPerPage}
                  onPageChange={(p) => {
                    setCurrentProductsPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsProductsPerPage(n);
                    setCurrentProductsPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === "Categories" && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Category Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingCategory.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Category Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedCategory.map((category) => (
                          <tr key={category._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {category.categoryName}
                                </div>
                              </div>
                            </td>

                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(category._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentCategoryPage}
                  total={totalCategoryItems}
                  itemsPerPage={itemsCategoryPerPage}
                  onPageChange={(p) => {
                    setCurrentCategoryPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsCategoryPerPage(n);
                    setCurrentCategoryPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === "Subcategories" && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Subcategory Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingSubcategory.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Subcategory Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedSubcategory.map((subcategory) => (
                          <tr key={subcategory._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {subcategory.name}
                                </div>
                              </div>
                            </td>

                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(subcategory._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentSubcategoryPage}
                  total={totalSubcategoryItems}
                  itemsPerPage={itemsSubcategoryPerPage}
                  onPageChange={(p) => {
                    setCurrentSubcategoryPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsSubcategoryPerPage(n);
                    setCurrentSubcategoryPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Brands' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Brand Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingBrand.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Brand Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedBrand.map((brand) => (
                          <tr key={brand._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {brand.brandName}
                                </div>
                              </div>
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(brand._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentBrandPage}
                  total={totalBrandItems}
                  itemsPerPage={itemsBrandPerPage}
                  onPageChange={(p) => {
                    setCurrentBrandPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsBrandPerPage(n);
                    setCurrentBrandPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'HSN' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          HSN Code
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingHSN.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No HSN Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedHSN.map((hsn) => (
                          <tr key={hsn._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {hsn.hsnCode}
                                </div>
                              </div>
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(hsn._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentHSNPage}
                  total={totalHSNItems}
                  itemsPerPage={itemsHSNPerPage}
                  onPageChange={(p) => {
                    setCurrentHSNPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsHSNPerPage(n);
                    setCurrentHSNPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Units' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Unit Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingUnit.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Unit Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedUnit.map((unit) => (
                          <tr key={unit._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {unit.unitsName}
                                </div>
                              </div>
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(unit._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentUnitPage}
                  total={totalUnitItems}
                  itemsPerPage={itemsUnitPerPage}
                  onPageChange={(p) => {
                    setCurrentUnitPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsUnitPerPage(n);
                    setCurrentUnitPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Tax' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Tax Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Tax Short Name
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Tax Rate
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingTax.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Tax Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedTax.map((tax) => (
                          <tr key={tax._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {tax.taxName}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                              color: "black",
                            }}>
                              {tax.taxShortName}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "left",
                                color: "black",
                              }}>
                              {tax.taxRate}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(tax._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentTaxPage}
                  total={totalTaxItems}
                  itemsPerPage={itemsTaxPerPage}
                  onPageChange={(p) => {
                    setCurrentTaxPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsTaxPerPage(n);
                    setCurrentTaxPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Sizes' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Size Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingSize.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Size Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedSize.map((size) => (
                          <tr key={size._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {size.sizeName}
                                </div>
                              </div>
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(size._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentSizePage}
                  total={totalSizeItems}
                  itemsPerPage={itemsSizePerPage}
                  onPageChange={(p) => {
                    setCurrentSizePage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsSizePerPage(n);
                    setCurrentSizePage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Colors' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Color Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Color Code
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingColor.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Color Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedColor.map((color) => (
                          <tr key={color._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {color.colorName}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              <div className="d-flex align-items-center gap-2">
                                <div style={{ width: 20, height: 20, background: color.colorCode, borderRadius: '50%', border: '1px solid #ddd' }}></div>
                                {color.colorCode.slice(1)}
                              </div>
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(color._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentColorPage}
                  total={totalColorItems}
                  itemsPerPage={itemsColorPerPage}
                  onPageChange={(p) => {
                    setCurrentColorPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsColorPerPage(n);
                    setCurrentColorPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Customers' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Customer Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Phone No.
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingCustomer.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Customer Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedCustomer.map((customer) => (
                          <tr key={customer._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {customer.name}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {customer.phone}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(customer._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentCustomerPage}
                  total={totalCustomerItems}
                  itemsPerPage={itemsCustomerPerPage}
                  onPageChange={(p) => {
                    setCurrentCustomerPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsCustomerPerPage(n);
                    setCurrentCustomerPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Suppliers' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Supplier Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Phone No.
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingSupplier.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Supplier Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedSupplier.map((supplier) => (
                          <tr key={supplier._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {supplier.supplierName}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {supplier.phone}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(supplier._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentSupplierPage}
                  total={totalSupplierItems}
                  itemsPerPage={itemsSupplierPerPage}
                  onPageChange={(p) => {
                    setCurrentSupplierPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsSupplierPerPage(n);
                    setCurrentSupplierPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Expenses' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Expense Title
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Date
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Payment Type
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingExpense.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Expense Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedExpense.map((expense) => (
                          <tr key={expense._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {expense.expenseTitle}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                      {new Date(expense.date).toLocaleDateString("en-GB")}
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {expense.paymentMode}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(expense._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentExpensePage}
                  total={totalExpenseItems}
                  itemsPerPage={itemsExpensePerPage}
                  onPageChange={(p) => {
                    setCurrentExpensePage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsExpensePerPage(n);
                    setCurrentExpensePage(1);
                  }}
                />
              </div>
            </div>
          )}
          
          {currentTab === 'Salesman' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Salesman Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Phone No.
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingSalesman.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Salesman Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedSalesman.map((salesman) => (
                          <tr key={salesman._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {salesman.salesmanName}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {salesman.phoneNumber}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(salesman._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentSalesmanPage}
                  total={totalSalesmanItems}
                  itemsPerPage={itemsSalesmanPerPage}
                  onPageChange={(p) => {
                    setCurrentSalesmanPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsSalesmanPerPage(n);
                    setCurrentSalesmanPage(1);
                  }}
                />
              </div>
            </div>
          )}
          
          {currentTab === 'Broker' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Broker Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Phone No.
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingBroker.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Broker Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedBroker.map((broker) => (
                          <tr key={broker._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {broker.brokerName}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {broker.phoneNumber}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(broker._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentBrokerPage}
                  total={totalBrokerItems}
                  itemsPerPage={itemsBrokerPerPage}
                  onPageChange={(p) => {
                    setCurrentBrokerPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsBrokerPerPage(n);
                    setCurrentBrokerPage(1);
                  }}
                />
              </div>
            </div>
          )}
          
          {currentTab === 'Vehicles' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Vehicle No.
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Vehicle Type
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingVehicle.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Vehicle Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedVehicle.map((vehicle) => (
                          <tr key={vehicle._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {vehicle.vehicleNumber}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {vehicle.vehicleType}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(vehicle._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentVehiclePage}
                  total={totalVehicleItems}
                  itemsPerPage={itemsVehiclePerPage}
                  onPageChange={(p) => {
                    setCurrentBrokerPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsVehiclePerPage(n);
                    setCurrentVehiclePage(1);
                  }}
                />
              </div>
            </div>
          )}
          
          {currentTab === 'Drivers' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Driver Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        License Number
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingDriver.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Driver Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedDriver.map((driver) => (
                          <tr key={driver._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {driver.driverName}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {driver.licenceNumber}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(driver._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentDriverPage}
                  total={totalDriverItems}
                  itemsPerPage={itemsDriverPerPage}
                  onPageChange={(p) => {
                    setCurrentDriverPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsDriverPerPage(n);
                    setCurrentDriverPage(1);
                  }}
                />
              </div>
            </div>
          )}
          
          {currentTab === 'Points & Rewards' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Points & Rewards Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Reward Type
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingPoints.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Points & Rewards Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedPoints.map((points) => (
                          <tr key={points._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {points.offerName}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {points.rewardType}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(points._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentPointsPage}
                  total={totalPointsItems}
                  itemsPerPage={itemsPointsPerPage}
                  onPageChange={(p) => {
                    setCurrentPointsPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsPointsPerPage(n);
                    setCurrentPointsPage(1);
                  }}
                />
              </div>
            </div>
          )}

          {currentTab === 'Transporters' && (
            <div
              style={{
                width: "100%",
                minHeight: "auto",
                maxHeight: "calc(100vh - 160px)",
                padding: 16,
                background: "white",
                borderRadius: 16,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: "Inter, sans-serif",
              }}>

              {/* table */}
              <div
                className="table-responsive"
                style={{
                  overflowY: "auto",
                  height: "calc(100vh - 310px)",
                  maxHeight: '500px',
                }}>
                <table
                  className="table-responsive"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    overflowX: "auto",
                  }}>
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      height: "38px",
                    }}>
                    <tr style={{ background: "#F3F8FB" }}>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          Transporter / Owner Name
                        </div>
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Transporter ID.
                      </th>
                      <th
                        style={{
                          textAlign: "center",
                          padding: "4px 16px",
                          color: "#727681",
                          fontSize: 14,
                          width: "auto",
                          fontWeight: "400",
                        }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody style={{ overflowY: 'auto' }}>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : existingTransporter.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ padding: 0 }}>
                          <div
                            style={{
                              marginTop: "20px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                              color: 'rgba(255, 68, 31, 1)'
                            }}
                          >
                            No Transporter Found
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {paginatedTransporter.map((transporter) => (
                          <tr key={transporter._id}
                            style={{
                              borderBottom: "1px solid #EAEAEA",
                              height: "46px",
                            }}
                            className="table-hover">
                            <td style={{
                              padding: "4px 16px",
                              verticalAlign: "middle",
                            }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 14,
                                    color: "#0E101A",
                                    whiteSpace: "nowrap",
                                    display: "flex",
                                    gap: "5px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    cursor: "pointer",
                                  }}>
                                  {transporter.transporterName} - {transporter.ownerName}
                                </div>
                              </div>
                            </td>
                            <td style={{
                              padding: "4px 16px",
                              position: "relative",
                              overflow: "visible",
                              textAlign: "left",
                            }}>
                              {transporter.transporterID}
                            </td>
                            <td className=""
                              style={{
                                padding: "4px 16px",
                                position: "relative",
                                overflow: "visible",
                                textAlign: "center",
                              }}>
                              <span
                                className="badge fw-medium fs-10 bg-danger text-white"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRestoreClick(transporter._id)}
                              >
                                <TbRestore style={{ fontSize: 16 }} />
                                Restore
                              </span>
                            </td>
                          </tr>
                        ))}
                      </>)}
                  </tbody>
                </table>
              </div>

              {/* pagination */}
              <div className="page-redirect-btn px-2">
                <Pagination
                  currentPage={currentTransporterPage}
                  total={totalTransporterItems}
                  itemsPerPage={itemsTransporterPerPage}
                  onPageChange={(p) => {
                    setCurrentTransporterPage(p);
                  }}
                  onItemsPerPageChange={(n) => {
                    setItemsTransporterPerPage(n);
                    setCurrentTransporterPage(1);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Trash;