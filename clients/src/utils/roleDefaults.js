// utils/roleDefaults.js
export const ALL_MODULES = {
  // Main
  "Dashboard": "Dashboard",

  // Connect
  "Chat": "Chat",
  "Mail": "Mail",
  "Whatsapp": "Whatsapp",

  // Inventory
  "Product": "Product",
  "Brand": "Brand",
  "Category": "Category",
  "Units": "Units",
  "Color": "Color",
  "Size": "Size",
  "Tax": "Tax",
  "SubCategory": "SubCategory",
  "DamageRecord": "DamageRecord",
  "LowStocks": "LowStocks",
  "HSN": "HSN",
  "Barcode": "Barcode",

  // "Unit": "Unit",

  // "VariantAttributes": "VariantAttributes",
  // "Warranty": "Warranty",

  // Customer
  "Customer": "Customer",
  "DuesAdvance": "DuesAdvance",
  "Supplier": "Supplier",

  // BrokerSalesman
  "BrokerSalesman": "BrokerSalesman",
  "Ledger": "Ledger",
  "AssignTarget": "AssignTarget",

  // Transporter
  "VehicleDriver": "VehicleDriver",
  "Transporter": "Transporter",
  "Shipments": "Shipments",


  // Warehouse
  "Warehouse": "Warehouse",
  "Zones": "Zones",
  "ProductAllocation": "ProductAllocation",
  "TransferProduct": "TransferProduct",
  "QRCode": "QRCode",
  "QRCodeScan": "QRCodeScan",
  "Dispatch": "Dispatch",

  // Purchases
  "PurchaseOrder": "PurchaseOrder",
  "GRNverification": "GRNverification",
  "Purchase": "Purchase",
  "DebitNote": "DebitNote",

  // Stock
  // "Stock": "Stock",
  // "StockAdjustment": "StockAdjustment",

  // Sales
  "Sales": "Sales",
  "CreditNote": "CreditNote",
  "Invoices": "Invoices",
  "Quotation": "Quotation",
  "Proforma": "Proforma",
  "Ewaybill": "Ewaybill",
  "Delivery Challan": "Delivery Challan",

  // POS
  "POS": "POS",

  //My Online Store
  "MyOnlineStore": "MyOnlineStore",

  // Promo
  // "Coupons": "Coupons",
  // "GiftCards": "GiftCards",
  "PointsRewards": "PointsRewards", // Added for Points & Rewards

  "Trash": "Trash",

  "Expense": "Expense", // Added for Expense

  // Location
  // "Location": "Location", 
  // "Country": "Country",
  // "State": "State",
  // "City": "City",

  // User Management
  "Users": "Users",
  // "Roles": "Roles",
  // "CreateRoles": "CreateRoles",

  // Settings
  "Settings": "Settings",
  // "Profile": "Profile",
  // "Security": "Security",
  // "Website": "Website",
  "CompanySettings": "CompanySettings",
  "BankDetails": "BankDetails",

  // "Localization": "Localization",

  // Finance & Accounts
  // "Finance": "Finance",
  // "Reports": "Reports",

  // Reports
  "SalesReport": "SalesReport", // Added
  "PurchaseReport": "PurchaseReport",
  "InventoryReport": "InventoryReport", // Added
  "ProductWiseReport": "ProductWiseReport", // Added
  "SupplierReport": "SupplierReport", // Added
  "DamageReport": "DamageReport", // Added
  "CreditNoteReport": "CreditNoteReport", // Added
  "DebitNoteReport": "DebitNoteReport", // Added
  "ExpireReport": "ExpireReport", // Added
  "CustomerOverdueReport": "CustomerOverdueReport", // Added
  "SupplierOverdueReport": "SupplierOverdueReport", // Added
  "ExpensesReport": "ExpensesReport", // Added

  // Special sections (for warehouse sub-items)
  // "AllWarehouse": "AllWarehouse",
  // "StockMovementLog": "StockMovementLog",

  "Activity": "Activity",
};

export const DEFAULT_PERMISSIONS = {
  export: false,
  import: false,
  create: false,
  read: false,
  update: false,
  delete: false,
};

export const GROUPED_MODULES = {
  Main: [
    "Dashboard"
  ],
  Connect: [
    "Chat",
    "Mail",
    "Whatsapp"
  ],
  Inventory: [
    "Product",
    "Brand",
    "Category",
    "Units",
    "Color",
    "Size",
    "Tax",
    "SubCategory",
    "DamageRecord",
    "LowStocks",
    "HSN",
    "Barcode",
  ],
  Customer: [
    "Customer",
    "DuesAdvance",
    "Supplier"
  ],
  BrokerSalesman: [
    "BrokerSalesman",
    "Ledger",
    "AssignTarget"
  ],
  Transporter: [
    "VehicleDriver",
    "Transporter",
    "Shipments"
  ],
  Warehouse: [
    "Warehouse",
    "Zones",
    "ProductAllocation",
    "TransferProduct",
    "QRCode",
    "QRCodeScan",
    "Dispatch"
  ],
  Purchases: [
    "PurchaseOrder",
    "GRNverification",
    "Purchase",
    "DebitNote"
  ],
  Sales: [
    "Sales",
    "CreditNote",
    "Invoices",
    "Quotation",
    "Proforma",
    "Ewaybill",
    "Delivery Challan",
  ],
  POS: ["POS"],
  MyOnlineStore: ["MyOnlineStore"],
  Promo: ["PointsRewards"],
  Trash: ["Trash"],
  Expense: ["Expense"],
  UserManagement: ["Users"],
  Settings: [
    "Settings",
    "CompanySettings",
    "BankDetails"
  ],
  Reports: [
    "SalesReport",
    "PurchaseReport",
    "InventoryReport",
    "ProductWiseReport",
    "SupplierReport",
    "DamageReport",
    "CreditNoteReport",
    "DebitNoteReport",
    "ExpireReport",
    "CustomerOverdueReport",
    "SupplierOverdueReport",
    "ExpensesReport",
  ],
  Special: [
    "Activity",
  ],
};