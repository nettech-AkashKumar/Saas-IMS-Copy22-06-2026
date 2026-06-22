/**
 * ============================
 * ✅ AUTO MODEL INITIALIZER
 * ============================
 * 
 * Middleware/Helper that automatically initializes models
 * for the request's tenant/master context
 * 
 * Usage in controllers:
 *   const Models = await getAutoModels(req);
 *   const User = Models.User;
 *   const Role = Models.Role;
 *   etc.
 */

const connectMasterDB = require("../../config/SaaS/masterDb");
const User = require("../../models/usersModels");
const Role = require("../../models/roleModels");
const Product = require("../../models/productModels");
const Category = require("../../models/categoryModels");
const Brand = require("../../models/brandModels");
const CompanySetting = require("../../models/settings/companysettingmodal");
const SystemSettings = require("../../models/systemSettingsModels");
const Warehouse = require("../../models/warehouseModels");
const Supplier = require("../../models/supplierModel");
const Customer = require("../../models/customerModel");
// const Purchase = require("../../models/purchaseModels");
const Sales = require("../../models/salesModel");
const PosSale = require("../../models/posSaleModel");
const PosReturn = require("../../models/posReturnModel");
const Invoice = require("../../models/invoiceModel");
const Tax = require("../../models/taxModels");
const Unit = require("../../models/unitsModels");
const Size = require("../../models/sizeModels");
const Color = require("../../models/colorModels");
const UserProfile = require("../../models/UserProfile");
const Email = require("../../models/emailmodels");
const Otp = require("../../models/otpModels");
const CustomerInvoice = require("../../models/CustomerInvoiceModel");
const PurchaseOrder = require("../../models/CreatePurchaseOrderModel.js");
const GRN = require("../../models/GRNModel.js");
const CreatePurchase = require("../../models/CreatePurchaseModel.js");
const DamageReturn = require("../../models/damageReturnModel");
const Coupon = require("../../models/CouponsModel");
const TaxGst = require("../../models/settings/taxGstModel");
const DeviceSession = require("../../models/settings/DeviceManagementmodal");
const StockHistory = require("../../models/stockHistoryModels");
const PaymentHistory = require("../../models/salesPaymentHistoryModel");
const Subcategory = require("../../models/subCateoryModal");
const HSN = require("../../models/hsnModels");
const RewardSystem = require("../../models/Points&RewardsModel.js");
const Expense = require("../../models/ExpenseReportModal.js");
const AuditLog = require("../../models/auditLogModel");
const Bag = require("../../models/Bag");
const BalanceSheet = require("../../models/balanceSheetSchema");
const CreditNote = require("../../models/creditNoteModels");
const DebitNote = require("../../models/debitNoteModel");
const Message = require("../../models/Message");
const Notification = require("../../models/notificationModel");
const PurchaseReturn = require("../../models/purchaseReturnModels");
const Quotation = require("../../models/CustomerQuotationModel");
const Variant = require("../../models/variantModel");
const CompanyBank = require("../../models/settings/companyBankModel.js");
const SupplierDebitNote = require("../../models/SupplierDebitNoteModal");
const CustomerCreditNote = require("../../models/customerCreditNoteModel");
// for proforma invoice
const CustomerProformaInvoice = require("../../models/CustomerProformaInvoiceModel.js")
const Vehicle = require("../../models/vehicleModel");
const Driver = require("../../models/driverModel");
const Transporter = require ("../../models/TransporterModels.js")
const Counter = require("../../models/Counter.js")
const SalesOrder = require("../../models/SalesOrder.js")
const DeliveryChallan = require("../../models/DeliveryChallan");
const Broker = require("../../models/brokerModel.js");
const Salesman = require("../../models/salesmanModel.js");
const AssignTarget = require("../../models/assignTargetModels.js");
const Shipment = require("../../models/ShipmentModal.js");



const getConnection = async (req, options = {}) => {
  if (!req || typeof req !== 'object') {
    throw new Error('getConnection: req object is missing or invalid. Ensure you are passing the Express request object.');
  }
  const preferMaster = options.preferMaster === true;

  if (!preferMaster && req.db) {
    return req.db;
  }

  if (!preferMaster && !req.db) {
    throw new Error('getConnection: req.db is undefined. Tenant database connection is missing. Ensure tenant DB middleware is applied.');
  }

  if (req.masterDB) {
    return req.masterDB;
  }

  const masterDB = await connectMasterDB();
  req.masterDB = masterDB;
  return masterDB;
};

/**
 * Get all connection-scoped models based on request context
 * Automatically selects Master or Tenant models
 * 
 * @param {Object} req - Express request object
 * @returns {Object} All models bound to correct connection
 */
const getAutoModels = async (req) => {
  const conn = await getConnection(req);
  const isTenant = Boolean(req.db);

  return {
    User: isTenant ? User.forTenant(conn) : User.forMaster(conn),
    Role: isTenant ? Role.forTenant(conn) : Role.forMaster(conn),
    Product: isTenant ? Product.forTenant(conn) : Product.forMaster(conn),
    Category: isTenant ? Category.forTenant(conn) : Category.forMaster(conn),
    Brand: isTenant ? Brand.forTenant(conn) : Brand.forMaster(conn),
    CompanySetting: isTenant ? CompanySetting.forTenant(conn) : CompanySetting.forMaster(conn),
    SystemSettings: isTenant ? SystemSettings.forTenant(conn) : SystemSettings.forMaster(conn),
    Warehouse: isTenant ? Warehouse.forTenant(conn) : Warehouse.forMaster(conn),
    Supplier: isTenant ? Supplier.forTenant(conn) : Supplier.forMaster(conn),
    Customer: isTenant ? Customer.forTenant(conn) : Customer.forMaster(conn),
    CreatePurchase: isTenant ? CreatePurchase.forTenant(conn) : CreatePurchase.forMaster(conn),
    Sales: isTenant ? Sales.forTenant(conn) : Sales.forMaster(conn),
    PosSale: isTenant ? PosSale.forTenant(conn) : PosSale.forMaster(conn),
    PosReturn: isTenant ? PosReturn.forTenant(conn) : PosReturn.forMaster(conn),
    Invoice: isTenant ? Invoice.forTenant(conn) : Invoice.forMaster(conn),
    Tax: isTenant ? Tax.forTenant(conn) : Tax.forMaster(conn),
    Unit: isTenant ? Unit.forTenant(conn) : Unit.forMaster(conn),
    Size: isTenant ? Size.forTenant(conn) : Size.forMaster(conn),
    Color: isTenant ? Color.forTenant(conn) : Color.forMaster(conn),
    UserProfile: isTenant ? UserProfile.forTenant(conn) : UserProfile.forMaster(conn),
    Email: isTenant ? Email.forTenant(conn) : Email.forMaster(conn),
    Otp: isTenant ? Otp.forTenant(conn) : Otp.forMaster(conn),
    CustomerInvoice: isTenant ? CustomerInvoice.forTenant(conn) : CustomerInvoice.forMaster(conn),
    CreatePurchase: isTenant ? CreatePurchase.forTenant(conn) : CreatePurchase.forMaster(conn),
    Coupon: isTenant ? Coupon.forTenant(conn) : Coupon.forMaster(conn),
    DamageReturn: isTenant ? DamageReturn.forTenant(conn) : DamageReturn.forMaster(conn),
    BalanceSheet: isTenant ? BalanceSheet.forTenant(conn) : BalanceSheet.forMaster(conn),
    AuditLog: isTenant ? AuditLog.forTenant(conn) : AuditLog.forMaster(conn),
    Bag: isTenant ? Bag.forTenant(conn) : Bag.forMaster(conn),
    CreditNote: isTenant ? CreditNote.forTenant(conn) : CreditNote.forMaster(conn),
    DebitNote: isTenant ? DebitNote.forTenant(conn) : DebitNote.forMaster(conn),
    Message: isTenant ? Message.forTenant(conn) : Message.forMaster(conn),
    Notification: isTenant ? Notification.forTenant(conn) : Notification.forMaster(conn),
    PurchaseOrder: isTenant ? PurchaseOrder.forTenant(conn) : PurchaseOrder.forMaster(conn),
    GRN: isTenant ? GRN.forTenant(conn) : GRN.forMaster(conn),
    CreatePurchase: isTenant ? CreatePurchase.forTenant(conn) : CreatePurchase.forMaster(conn),
    PurchaseReturn: isTenant ? PurchaseReturn.forTenant(conn) : PurchaseReturn.forMaster(conn),
    Quotation: isTenant ? Quotation.forTenant(conn) : Quotation.forMaster(conn),
    Variant: isTenant ? Variant.forTenant(conn) : Variant.forMaster(conn),
    Company: isTenant ? CompanySetting.forTenant(conn) : CompanySetting.forMaster(conn),
    TaxGst: isTenant ? TaxGst.forTenant(conn) : TaxGst.forMaster(conn),
    DeviceSession: isTenant ? DeviceSession.forTenant(conn) : DeviceSession.forMaster(conn),
    StockHistory: isTenant ? StockHistory.forTenant(conn) : StockHistory.forMaster(conn),
    PaymentHistory: isTenant ? PaymentHistory.forTenant(conn) : PaymentHistory.forMaster(conn),
    Subcategory: isTenant ? Subcategory.forTenant(conn) : Subcategory.forMaster(conn),
    HSN: isTenant ? HSN.forTenant(conn) : HSN.forMaster(conn),
    RewardSystem: isTenant ? RewardSystem.forTenant(conn) : RewardSystem.forMaster(conn),
    Expense: isTenant ? Expense.forTenant(conn) : Expense.forMaster(conn),
    CompanyBank: isTenant ? CompanyBank.forTenant(conn) : CompanyBank.forMaster(conn),
      SupplierDebitNote: isTenant ? SupplierDebitNote.forTenant(conn) : SupplierDebitNote.forMaster(conn),
    CustomerCreditNote: isTenant ? CustomerCreditNote.forTenant(conn) : CustomerCreditNote.forMaster(conn),
    CustomerProformaInvoice : isTenant ? CustomerProformaInvoice.forTenant(conn) : CustomerProformaInvoice.forMaster(conn),
    Transporter : isTenant ? Transporter.forTenant(conn) : Transporter.forMaster(conn),
    Vehicle : isTenant ? Vehicle.forTenant(conn) : Vehicle.forMaster(conn),
    Driver : isTenant ? Driver.forTenant(conn) : Driver.forMaster(conn),
    Counter : isTenant ? Counter.forTenant(conn) : Counter.forMaster(conn),
    SalesOrder: isTenant ? SalesOrder.forTenant(conn) : SalesOrder.forMaster(conn),
    DeliveryChallan: isTenant ? DeliveryChallan.forTenant(conn) : DeliveryChallan.forMaster(conn),
    Broker: isTenant ? Broker.forTenant(conn) : Broker.forMaster(conn),
    Salesman: isTenant ? Salesman.forTenant(conn) : Salesman.forMaster(conn),
    AssignTarget: isTenant ? AssignTarget.forTenant(conn) : AssignTarget.forMaster(conn),
    Shipment: isTenant ? Shipment.forTenant(conn) : Shipment.forMaster(conn),
  };
};

/**
 * Specific model getter for Tenant context
 * Use this when you KNOW it's a tenant request
 * 
 * @param {Object} req - Express request object
 * @returns {Object} All models bound to tenant connection
 */
const getTenantModels = (req) => {
  if (!req.db || !req.user?.tenant) {
    throw new Error("Tenant context not available - ensure auth middleware sets req.db and req.user.tenant");
  }

  return {
    User: User.forTenant(req.db),
    Role: Role.forTenant(req.db),
    Product: Product.forTenant(req.db),
    Category: Category.forTenant(req.db),
    Brand: Brand.forTenant(req.db),
    CompanySetting: CompanySetting.forTenant(req.db),
    SystemSettings: SystemSettings.forTenant(req.db),
    Warehouse: Warehouse.forTenant(req.db),
    Supplier: Supplier.forTenant(req.db),
    Customer: Customer.forTenant(req.db),
    // Purchase: Purchase.forTenant(req.db),
    Sales: Sales.forTenant(req.db),
    PosSale: PosSale.forTenant(req.db),
    PosReturn: PosReturn.forTenant(req.db),
    Invoice: Invoice.forTenant(req.db),
    Tax: Tax.forTenant(req.db),
    Unit: Unit.forTenant(req.db),
    Size: Size.forTenant(req.db),
    Color: Color.forTenant(req.db),
    UserProfile: UserProfile.forTenant(req.db),
    Email: Email.forTenant(req.db),
    Otp: Otp.forTenant(req.db),
    CustomerInvoice: CustomerInvoice.forTenant(req.db),
    PurchaseOrder: PurchaseOrder.forMaster(conn),
    GRN: GRN.forMaster(conn),
    CreatePurchase: CreatePurchase.forTenant(req.db),
    DamageReturn: DamageReturn.forTenant(req.db),
    Coupon: Coupon.forTenant(req.db),
    BalanceSheet: BalanceSheet.forTenant(req.db),
    AuditLog: AuditLog.forTenant(req.db),
    Bag: Bag.forTenant(req.db),
    CreditNote: CreditNote.forTenant(req.db),
    DebitNote: DebitNote.forTenant(req.db),
    Message: Message.forTenant(req.db),
    Notification: Notification.forTenant(req.db),
    CreatePurchase: CreatePurchase.forTenant(req.db),
    PurchaseReturn: PurchaseReturn.forTenant(req.db),
    Quotation: Quotation.forTenant(req.db),
    Variant: Variant.forTenant(req.db),
    Company: CompanySetting.forTenant(req.db),
    TaxGst: TaxGst.forTenant(req.db),
    DeviceSession: DeviceSession.forTenant(req.db),
    StockHistory: StockHistory.forTenant(req.db),
    PaymentHistory: PaymentHistory.forTenant(req.db),
    Subcategory: Subcategory.forTenant(req.db),
    HSN: HSN.forTenant(req.db),
    RewardSystem: RewardSystem.forTenant(req.db),
    Expense: Expense.forTenant(req.db),
    CompanyBank: CompanyBank.forTenant(req.db),
    Transporter: Transporter.forTenant(req.db),
    Vehicle: Vehicle.forTenant(req.db),
    Driver: Driver.forTenant(req.db),
    SalesOrder: SalesOrder.forTenant(req.db),
    DeliveryChallan: DeliveryChallan.forTenant(req.db),
    Broker: Broker.forTenant(req.db),
    Salesman: Salesman.forTenant(req.db),
    AssignTarget: AssignTarget.forTenant(req.db),
    Shipment: Shipment.forTenant(req.db),
  };
};

/**
 * Specific model getter for Master context
 * Use this when you KNOW it's a master/admin request
 * 
 * @param {Object} req - Express request object
 * @returns {Object} All models bound to master connection
 */
const getMasterModels = async (req) => {
  const conn = await getConnection(req, { preferMaster: true });

  return {
    User: User.forMaster(conn),
    Role: Role.forMaster(conn),
    Product: Product.forMaster(conn),
    Category: Category.forMaster(conn),
    Brand: Brand.forMaster(conn),
    CompanySetting: CompanySetting.forMaster(conn),
    SystemSettings: SystemSettings.forMaster(conn),
    Warehouse: Warehouse.forMaster(conn),
    Supplier: Supplier.forMaster(conn),
    Customer: Customer.forMaster(conn),
    // Purchase: Purchase.forMaster(conn),
    Sales: Sales.forMaster(conn),
    Invoice: Invoice.forMaster(conn),
    Tax: Tax.forMaster(conn),
    Unit: Unit.forMaster(conn),
    Size: Size.forMaster(conn),
    Color: Color.forMaster(conn),
    UserProfile: UserProfile.forMaster(conn),
    Email: Email.forMaster(conn),
    Otp: Otp.forMaster(conn),
    CustomerInvoice: CustomerInvoice.forMaster(conn),
    CreatePurchase: CreatePurchase.forMaster(conn),
    DamageReturn: DamageReturn.forMaster(conn),
    Coupon: Coupon.forMaster(conn),
    BalanceSheet: BalanceSheet.forMaster(conn),
    AuditLog: AuditLog.forMaster(conn),
    Bag: Bag.forMaster(conn),
    CreditNote: CreditNote.forMaster(conn),
    DebitNote: DebitNote.forMaster(conn),
    Message: Message.forMaster(conn),
    Notification: Notification.forMaster(conn),
    Purchase: CreatePurchase.forMaster(conn),
    PurchaseReturn: PurchaseReturn.forMaster(conn),
    Quotation: Quotation.forMaster(conn),
    Variant: Variant.forMaster(conn),
    Company: CompanySetting.forMaster(conn),
    TaxGst: TaxGst.forMaster(conn),
    DeviceSession: DeviceSession.forMaster(conn),
    StockHistory: StockHistory.forMaster(conn),
    PaymentHistory: PaymentHistory.forMaster(conn),
    Subcategory: Subcategory.forMaster(conn),
    HSN: HSN.forMaster(conn),
    RewardSystem: RewardSystem.forMaster(conn),
    Expense: Expense.forMaster(conn),
    CompanyBank: CompanyBank.forMaster(conn),
    Transporter: Transporter.forMaster(conn),
    Vehicle: Vehicle.forMaster(conn),
    Driver: Driver.forMaster(conn),
    SalesOrder: SalesOrder.forMaster(conn),
     DeliveryChallan: DeliveryChallan.forMaster(conn),
    Broker: Broker.forMaster(conn),
    AssignTarget: AssignTarget.forMaster(conn),
    Shipment: Shipment.forMaster(conn),
  };
};

module.exports = {
  getAutoModels,
  getTenantModels,
  getMasterModels,
};
