# IMS v2.0 - Complete Models Documentation
**Last Updated:** June 11, 2026  
**Project:** IMS-v2.0 (Inventory Management System + SaaS)

---

## Table of Contents
1. [Core Business Models](#core-business-models)
2. [Product & Inventory Models](#product--inventory-models)
3. [Sales & Invoice Models](#sales--invoice-models)
4. [Purchase & Supplier Models](#purchase--supplier-models)
5. [Financial & Accounting Models](#financial--accounting-models)
6. [User & Authentication Models](#user--authentication-models)
7. [Configuration & Settings Models](#configuration--settings-models)
8. [SaaS Master Models](#saas-master-models)
9. [Utility & Support Models](#utility--support-models)

---

## Core Business Models

### 1. **Product Model** (`productModels.js`)
- **Purpose:** Store all product/item information
- **Key Fields:**
  - `productName`: Name of the product
  - `category`: Reference to Category
  - `subcategory`: Reference to Subcategory
  - `brand`: Reference to Brand
  - `description`: Product description (max 30 words)
  - `itemBarcode`: Barcode number
  - `hsn`: HSN code reference
  - `lot_pricing`: Boolean flag for lot-based pricing
  - `manufacturingDate`: Manufacturing date
  - `expiryDate`: Product expiry date
  - `warrantyType`: Type of warranty
- **Relations:** Category, Subcategory, Brand, HSN
- **Capabilities:** Product variants, lot management, expiry tracking, warranty handling

### 2. **Customer Model** (`customerModel.js`)
- **Purpose:** Maintain customer information and relationships
- **Key Fields:**
  - Customer name, email, phone
  - Address (billing & shipping)
  - Credit limit & balance
  - Payment terms
  - Customer type (retail/wholesale)
- **Relations:** Invoices, Quotations, Credit Notes
- **Features:** Credit note tracking, payment history

### 3. **Supplier Model** (`supplierModel.js`)
- **Purpose:** Store supplier/vendor information
- **Key Fields:**
  - Supplier name, contact details
  - GST number, bank details
  - Payment terms
  - Warehouse references
  - Price lists
- **Relations:** Purchase orders, Debit notes, Payments
- **Capabilities:** Multi-supplier purchases, payment tracking

### 4. **Sales Model** (`salesModel.js`)
- **Purpose:** Record sales transactions
- **Key Fields:**
  - Sale date, reference number
  - Customer reference
  - Products with quantities & prices
  - Discounts & taxes
  - Payment status
  - Warehouse location
- **Relations:** Customer, Product, Warehouse, Invoice, Payment
- **Tracking:** Stock deduction, payment reconciliation

### 5. **Purchase Model** (`purchaseModels.js`)
- **Purpose:** Record purchase transactions from suppliers
- **Key Fields:**
  - Purchase date, reference number
  - Supplier reference
  - Products with quantities & costs
  - Discounts & taxes
  - Payment status
  - Warehouse destination
- **Relations:** Supplier, Product, Warehouse, Payment
- **Tracking:** Stock addition, payment reconciliation, GRN

---

## Product & Inventory Models

### 6. **Category Model** (`categoryModels.js`)
- **Purpose:** Product categorization
- **Hierarchy:** Parent-child category structure
- **Usage:** Product filtering, reporting

### 7. **SubCategory Model** (`subCateoryModal.js`)
- **Purpose:** Secondary level product categorization
- **Parent:** Links to Category
- **Usage:** Detailed product organization

### 8. **Brand Model** (`brandModels.js`)
- **Purpose:** Store product brands
- **Fields:** Brand name, description, logo URL
- **Usage:** Brand filtering, vendor classification

### 9. **Size Model** (`sizeModels.js`)
- **Purpose:** Size variants (S, M, L, XL, etc.)
- **Usage:** Product variant management

### 10. **Color Model** (`colorModels.js`)
- **Purpose:** Color variants
- **Usage:** Product variant management

### 11. **Variant Model** (`variantModel.js`)
- **Purpose:** Manage product variants (size + color combinations)
- **Fields:** SKU, variant name, pricing
- **Usage:** Complex product management

### 12. **HSN Model** (`hsnModels.js`)
- **Purpose:** HSN (Harmonized System of Nomenclature) codes for tax classification
- **Usage:** GST compliance, invoice generation

### 13. **Unit Model** (`unitsModels.js`)
- **Purpose:** Measurement units (KG, L, PC, BOX, etc.)
- **Usage:** Product quantity measurement

### 14. **Stock History Model** (`stockHistoryModels.js`)
- **Purpose:** Track stock movements and history
- **Fields:** Product, warehouse, quantity, transaction type
- **Usage:** Stock audit, inventory reconciliation

### 15. **Warehouse Model** (`warehouseModels.js`)
- **Purpose:** Store warehouse/godown information
- **Key Fields:**
  - Warehouse name, location
  - Address, manager details
  - Storage capacity
  - Zone management
- **Features:** Multiple warehouse support, zone management

### 16. **Sold Stock History Model** (`soldStockHistoryModel.js`)
- **Purpose:** Track sold item history with dates and details
- **Usage:** Analytics, returns management

---

## Sales & Invoice Models

### 17. **Invoice Model** (`invoiceModel.js`)
- **Purpose:** Customer invoice/bill generation
- **Key Fields:**
  - Sale reference
  - Customer details (billing & shipping)
  - Product line items with calculations
  - Totals: amount, tax, discount
  - Payment tracking
  - Invoice ID (unique)
- **Calculations:** Line totals, tax amounts, discounts

### 18. **Customer Invoice Model** (`CustomerInvoiceModel.js`)
- **Purpose:** Invoice-specific data for customers
- **Relations:** Customer, Sale, Products
- **Features:** Invoice status, payment terms

### 19. **Quotation Model** (`CustomerQuotationModel.js`)
- **Purpose:** Customer quotations/estimates
- **Similar to Invoice:** Products, pricing, terms
- **Difference:** Pre-sales quote, may not result in payment

### 20. **Proforma Invoice Model** (`CustomerProformaInvoiceModel.js`)
- **Purpose:** Preliminary invoice before actual sale
- **Usage:** Export documentation, advance billing
- **Fields:** Similar to Invoice

### 21. **Delivery Challan Model** (`DeliveryChallan.js`)
- **Purpose:** Track goods delivery
- **Fields:** Products, quantities, delivery address, date
- **Relations:** Sales, Customer, Warehouse
- **Usage:** Goods receipt tracking

### 22. **Credit Note Model** (`creditNoteModels.js`)
- **Purpose:** Reduce customer invoice amounts (returns, allowances)
- **Reverse Impact:** Reduces customer balance
- **Relations:** Original Invoice, Customer
- **Usage:** Sales returns, adjustments

### 23. **Customer Credit Note Model** (`customerCreditNoteModel.js`)
- **Purpose:** Customer-specific credit notes
- **Fields:** Reason, amount, original invoice reference

### 24. **Sales Payment History Model** (`salesPaymentHistoryModel.js`)
- **Purpose:** Track payment receipts for sales
- **Fields:** Payment date, amount, method, reference
- **Usage:** Payment reconciliation, aging analysis

### 25. **POS Sale Model** (`posSaleModel.js`)
- **Purpose:** Point-of-Sale transactions
- **Features:** Quick sales, retail transactions
- **Integration:** Real-time stock updates

### 26. **POS Return Model** (`posReturnModel.js`)
- **Purpose:** POS transaction returns
- **Relations:** POS Sale
- **Reverse Impact:** Stock restoration

---

## Purchase & Supplier Models

### 27. **Purchase Return Model** (`purchaseReturnModels.js`)
- **Purpose:** Returns to suppliers
- **Fields:** Original purchase reference, returned products/quantities
- **Reverse Impact:** Stock reduction, supplier credit

### 28. **Purchase Setting Model** (`purchaseSettingModels.js`)
- **Purpose:** Purchase configuration per company
- **Fields:** Terms, payment modes, default suppliers

### 29. **Supplier Debit Note Model** (`SupplierDebitNoteModal.js`)
- **Purpose:** Debit notes issued BY us to suppliers
- **Usage:** Supplier billing adjustments, penalties

### 30. **Damage Return Model** (`damageReturnModel.js`)
- **Purpose:** Track damaged product returns
- **Fields:** Product, quantity, damage reason, date
- **Impact:** Stock adjustment

---

## Financial & Accounting Models

### 31. **Invoice Settings Model** (`invoiceSettingsModel.js`)
- **Purpose:** Invoice generation settings per company
- **Fields:** Invoice prefix, numbering, tax setup, templates

### 32. **Balance Sheet Model** (`balanceSheetSchema.js`)
- **Purpose:** Financial position reporting
- **Structure:** Assets, liabilities, equity
- **Usage:** Financial analysis, compliance

### 33. **Debit Note Model** (`debitNoteModel.js`)
- **Purpose:** Debit notes for customer billing adjustments
- **Usage:** Billing corrections, additional charges

### 34. **GST Model** (`gstModels.js`)
- **Purpose:** GST configuration (tax setup)
- **Fields:** GST rates, categories, tax calculations

### 35. **Tax Model** (`taxModels.js`)
- **Purpose:** General tax configuration
- **Fields:** Tax name, rate, applicability

### 36. **Expense Report Model** (`ExpenseReportModal.js`)
- **Purpose:** Employee/company expense tracking
- **Fields:** Date, category, amount, approver status

### 37. **Coupon Model** (`CouponsModel.js`)
- **Purpose:** Discount/promotional coupons
- **Fields:** Code, discount %, validity, usage limit
- **Usage:** Sales promotion

### 38. **Gift Card Model** (`GiftCardModels.js`)
- **Purpose:** Gift card management
- **Fields:** Card number, balance, expiry, customer linked
- **Usage:** Customer retention, sales

### 39. **Points & Rewards Model** (`Points&RewardsModel.js`)
- **Purpose:** Loyalty program
- **Fields:** Points earned/redeemed, customer tier
- **Usage:** Customer incentives

### 40. **Warranty Model** (`warrantyModel.js`)
- **Purpose:** Product warranty tracking
- **Fields:** Warranty period, coverage, expiry
- **Relations:** Product, Customer

---

## User & Authentication Models

### 41. **User Model** (`user.js` / `usersModels.js`)
- **Purpose:** System users (admin, staff, manager, etc.)
- **Key Fields:**
  - Email, password (hashed)
  - Full name, phone
  - Role & permissions
  - Active status
  - Last login
- **Security:** Password hashing, OTP verification
- **Relations:** Role, Permissions, UserProfile

### 42. **UserProfile Model** (`UserProfile.js`)
- **Purpose:** Extended user information
- **Fields:** Avatar, phone, address, department
- **Relations:** User

### 43. **Role Model** (`roleModels.js`)
- **Purpose:** User roles (Admin, Manager, Staff, etc.)
- **Fields:** Role name, description, permissions array
- **Usage:** Access control

### 44. **Permission Model** (`Permission.js`)
- **Purpose:** Granular permissions for modules
- **Fields:** Permission name, module, action (create, read, update, delete)
- **Usage:** Fine-grained access control

### 45. **Module Model** (`moduleModel.js`)
- **Purpose:** Application modules/features
- **Fields:** Module name, description
- **Usage:** Module-level access control

### 46. **OTP Model** (`otpModels.js`)
- **Purpose:** One-time password for verification
- **Fields:** OTP code, expiry, user email, verified status
- **Usage:** 2FA, email verification

---

## Configuration & Settings Models

### 47. **Company Setting Model** (`companysettingmodal.js`)
- **Purpose:** Company-level configuration
- **Key Fields:**
  - Company name, logo, address
  - GST number, PAN, CIN
  - Currency, tax setup
  - Bank details
  - Email, phone
- **Relations:** Company bank accounts

### 48. **Company Bank Model** (`companyBankModel.js`)
- **Purpose:** Bank account details per company
- **Fields:** Bank name, account number, IFSC, branch
- **Usage:** Payment processing

### 49. **System Settings Model** (`systemSettingsModels.js`)
- **Purpose:** Global system configuration
- **Fields:** App name, default currency, date format, timezone
- **Usage:** System-wide defaults

### 50. **Barcode Settings Model** (`barcodeSettingsModel.js`)
- **Purpose:** Barcode generation configuration
- **Fields:** Format, prefix, suffix, length
- **Usage:** Product barcode generation

### 51. **Email Verification Model** (`EmailVerificationmodal.js`)
- **Purpose:** Email verification status
- **Fields:** Email, verification token, verified
- **Usage:** Account verification

### 52. **Mobile Verification Model** (`MobileVerificationModal.js`)
- **Purpose:** Phone/SMS verification status
- **Fields:** Phone, OTP, verified
- **Usage:** Account verification, 2FA

### 53. **Localization Model** (`LocalizationModal.js`)
- **Purpose:** Multi-language support configuration
- **Fields:** Language code, translations
- **Usage:** i18n support

### 54. **Print Template Model** (`printTemplateModel.js`)
- **Purpose:** Custom print templates for invoices, receipts, labels
- **Fields:** Template name, HTML content, style
- **Usage:** Report generation

### 55. **Notes & Terms Model** (`notesTermsModel.js`)
- **Purpose:** Standard notes and terms for documents
- **Fields:** Document type, notes, terms text
- **Usage:** Invoice/quotation footer text

### 56. **User Settings Model** (`userModal.js`)
- **Purpose:** Individual user preferences
- **Fields:** Theme, language, timezone, notifications
- **Relations:** User

### 57. **Device Management Model** (`DeviceManagementmodal.js`)
- **Purpose:** Track devices accessing the system
- **Fields:** Device ID, name, last login, active status
- **Usage:** Security, multi-device tracking

---

## SaaS Master Models

### 58. **Company Model (SaaS)** (`SaaS/master/Company.model.js`)
- **Purpose:** Tenant companies in SaaS
- **Key Fields:**
  - Company name, domain
  - Admin user ID
  - Subscription status
  - Database connection string
  - Created date, plan
- **Relations:** SuperAdmin, Plans, Tenants
- **Features:** Tenant isolation

### 59. **SuperAdmin Model** (`SaaS/master/SuperAdmin.js`)
- **Purpose:** SaaS super administrator accounts
- **Fields:** Email, password, phone, permissions
- **Usage:** SaaS platform management

### 60. **Pricing Model (SaaS)** (`SaaS/master/Pricing.js`)
- **Purpose:** SaaS pricing plans
- **Key Fields:**
  - Plan name, title, price
  - Currency symbol
  - Features array
  - Module permissions
  - Offer type (fixed/percentage)
  - Button text & URL
  - Display order
- **Usage:** Plan display, subscription management

### 61. **FAQ Model (SaaS)** (`SaaS/master/FAQ.js`)
- **Purpose:** Frequently asked questions
- **Key Fields:**
  - Question, answer
  - Category
  - Display order
- **Usage:** Website FAQ section

### 62. **Hero Content Model (SaaS)** (`SaaS/master/HeroContent.js`)
- **Purpose:** Hero section configuration
- **Key Fields:**
  - Title, subtitle
  - Feature cards (title, description)
  - CTA buttons (text, URLs)
  - Image URLs (left, phone, right slots for modern layout)
  - Template type (modern/classic)
- **Usage:** Landing page hero section customization

### 63. **OTP Model (SaaS)** (`SaaS/master/Otp.model.js`)
- **Purpose:** OTP management for SaaS platform
- **Fields:** Email, OTP code, expiry

### 64. **Reminder Template Model** (`SaaS/master/ReminderTemplate.model.js`)
- **Purpose:** Email reminder templates
- **Fields:** Template name, subject, body, variables
- **Usage:** Automated email reminders

### 65. **Reminder Send Log Model** (`SaaS/master/ReminderSendLog.model.js`)
- **Purpose:** Track sent reminders
- **Fields:** Template reference, recipient, sent date, status
- **Usage:** Reminder tracking

---

## Utility & Support Models

### 66. **Message Model** (`Message.js`)
- **Purpose:** In-app messaging system
- **Fields:** From user, to user, subject, message, read status
- **Usage:** Inter-user communication

### 67. **Notification Model** (`notificationModel.js`)
- **Purpose:** User notifications
- **Fields:** User, type, title, message, read status, action URL
- **Usage:** Real-time alerts

### 68. **Audit Log Model** (`auditLogModel.js`)
- **Purpose:** Track user actions for compliance
- **Key Fields:**
  - User reference
  - Action (create, update, delete)
  - Entity type & ID
  - Old value, new value
  - Timestamp
  - IP address
- **Usage:** Compliance, security, debugging

### 69. **Contact Message Model** (`contactMessageModel.js`)
- **Purpose:** Website contact form submissions
- **Fields:** Name, email, subject, message, reply status
- **Usage:** Customer inquiries, lead generation

### 70. **Counter Model** (`Counter.js`)
- **Purpose:** Auto-increment counters
- **Usage:** Generate sequential document numbers (Invoice #, PO #, etc.)

### 71. **Email Model** (`emailmodels.js`)
- **Purpose:** Email queue and history
- **Fields:** To, subject, body, attachment, sent status, retry count
- **Usage:** Async email sending

---

## Location & Administrative Models

### 72. **Country Model** (`countryModels.js`)
- **Purpose:** Countries (for shipping, tax)
- **Fields:** Name, code, region

### 73. **State Model** (`stateModels.js`)
- **Purpose:** States/provinces per country
- **Fields:** Name, code, country reference

### 74. **City Model** (`cityModels.js`)
- **Purpose:** Cities/towns per state
- **Fields:** Name, code, state reference

---

## Logistics & Shipping Models

### 75. **Driver Model** (`driverModel.js`)
- **Purpose:** Delivery driver information
- **Key Fields:**
  - Name, phone
  - License number
  - Vehicle reference
  - Active status
- **Relations:** Vehicle, Shipment

### 76. **Vehicle Model** (`vehicleModel.js`)
- **Purpose:** Company vehicles for delivery
- **Key Fields:**
  - Vehicle number, type
  - Capacity
  - Insurance details
  - Driver references
- **Relations:** Driver, Shipment

### 77. **Transporter Model** (`TransporterModels.js`)
- **Purpose:** Third-party transport providers
- **Key Fields:**
  - Company name, contact
  - GST number
  - Service areas
  - Rate card
- **Usage:** Outsourced logistics

### 78. **Shipment Model** (`ShipmentModal.js`)
- **Purpose:** Track shipments
- **Key Fields:**
  - Reference number
  - Driver, vehicle
  - Pickup & delivery addresses
  - Status tracking
  - Delivery date
- **Relations:** Driver, Vehicle, Transporter

### 79. **E-way Bill Model** (`E-wayBill/ewb.model.js`)
- **Purpose:** E-way bill for GST compliance (India)
- **Fields:** Bill number, from/to party, items, distance, valid until
- **Usage:** GST compliance for goods movement

---

## Legacy & Special Models

### 80. **Old Warehouse Model** (`OldWarehouseModels.js`)
- **Purpose:** Legacy warehouse data (backward compatibility)
- **Status:** Likely deprecated, kept for migration

### 81. **Bag Model** (`Bag.js`)
- **Purpose:** Bag/container management in warehouse
- **Usage:** Batch/lot tracking

### 82. **Broker Model** (`brokerModel.js`)
- **Purpose:** Broker/agent information
- **Fields:** Broker name, contact, commission rate
- **Usage:** Third-party sales/purchase agents

### 83. **Sales Target Model** (`assignTargetModels.js`)
- **Purpose:** Sales targets for staff
- **Key Fields:**
  - User reference
  - Target amount/quantity
  - Period
  - Achievement tracking
- **Usage:** Performance management

### 84. **Salesman Model** (`salesmanModel.js`)
- **Purpose:** Sales representatives
- **Fields:** Name, territory, target
- **Relations:** User, Sales, Quotations

### 85. **Conversation Model** (`conversationsControllers.js`)
- **Purpose:** Chat/conversation threads
- **Usage:** Internal communications, customer support

### 86. **Add Customers Model** (`AddCustomersModels.js`)
- **Purpose:** Bulk customer import/addition
- **Usage:** Data migration, batch operations

---

## Frontend Components & Context Models (Not Database Models)

**Note:** These are client-side structures, not MongoDB models:
- Redux state management
- Context providers (Socket, Auth, etc.)
- Form validation schemas
- Component state models

---

## API Client Functions (`adminApi.js`)

### Key API Functions for Models:
```javascript
// Products
export const getProducts() → fetch products
export const createProduct() → add new product
export const updateProduct() → modify product

// Sales & Invoices
export const createSale() → record sale
export const getInvoice() → fetch invoice
export const createInvoice() → generate invoice

// Customers
export const addCustomer() → add customer
export const getCustomerList() → fetch customers
export const updateCustomer() → modify customer

// Pricing (SaaS)
export const getPublicPricing() → fetch active pricing plans
export const getAllPricing() → fetch all plans (admin)
export const createPricing() → create new plan
export const updatePricing() → modify plan

// Hero Content (SaaS)
export const uploadHeroImage() → upload hero section images
export const getHeroByTemplateType() → fetch hero configuration

// FAQs (SaaS)
export const createFaq() → add FAQ
export const updateFaq() → edit FAQ
export const deleteFaq() → remove FAQ
```

---

## Data Flow Summary

### Customer Sale Journey:
Customer → Quotation → Sales → Invoice → Payment → Delivery Challan → Credit Note (if return)

### Supplier Purchase Journey:
Supplier → Purchase Order → Purchase → Payment → Purchase Return (if return) → Debit Note

### SaaS Journey:
Public Website (Hero, Pricing, FAQ) → Registration → Company Creation → Tenant Database → User Management

---

## Key Architecture Notes

### 1. **Master vs Tenant Database (SaaS)**
- **Master DB:** Companies, pricing, super admin, FAQs, hero content
- **Tenant DB:** Per-company data (users, sales, purchases, inventory)

### 2. **Multi-Tenancy Implementation**
- Each company has isolated database connection
- Tenant context passed in requests
- Module permissions configured per plan

### 3. **Stock Management**
- Real-time stock tracking via stock history
- Warehouse-wise inventory
- Lot/batch support for traceability

### 4. **Audit & Compliance**
- Audit logs for all critical operations
- GST/Tax compliance models
- E-way bill integration

### 5. **Scalability**
- Indexed fields for performance
- Lean queries where possible
- Historical data models for analytics

---

## Access Patterns

### By Role:
- **Admin:** All models full access
- **Manager:** Sales, purchases, inventory, reports
- **Staff:** Limited create/read (based on permission)
- **Customer:** View own orders, invoices, quotes

### By Feature:
- **Inventory:** Products, variants, warehouse, stock history
- **Sales:** Sales, invoices, quotations, credit notes, customers
- **Purchases:** Purchases, suppliers, returns, debit notes
- **Financials:** Invoices, payments, balance sheet, audit logs
- **Admin:** Users, roles, permissions, settings, audit logs
- **SaaS:** Pricing, FAQ, hero content, companies, super admin

---

**End of Documentation**
