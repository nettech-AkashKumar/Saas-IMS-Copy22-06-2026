import { useTranslation } from "react-i18next";
import {
  MdOutlineDashboard,
  MdOutlineCategory,
  MdStraighten,
  MdChecklist,
  MdVerified,
  MdQrCode,
  MdOutlinePointOfSale,
  MdOutlinePayments,
  MdOutlineSpeakerNotes,
} from "react-icons/md";
import {
  TbMapPin,
  TbUserShield,
  TbJumpRope,
  TbSettings,
  TbWorld,
  TbLogout,
  TbListDetails,
  TbBrandAsana,
  TbShoppingBag,
  TbFileUnknown,
  TbReportMoney,
  TbUsersGroup,
  TbUserDollar,
  TbBuildingWarehouse,
  TbFilePercent,
  TbGiftCard,
  TbBrandAppleArcade,
  TbFileInvoice,
  TbTrash,
  TbFileDescription,
} from "react-icons/tb";
import { GoPackage } from "react-icons/go";
import { CiBarcode } from "react-icons/ci";
import { HiArrowTrendingUp } from "react-icons/hi2";
import { PiWarningDiamond } from "react-icons/pi";
import { BsHSquare } from "react-icons/bs";
import { FaRegFileAlt } from "react-icons/fa";
import { SiFuturelearn } from "react-icons/si";
import { FaStackOverflow } from "react-icons/fa6";
import { GiExpense } from "react-icons/gi";
import { IoLogoWebComponent } from "react-icons/io5";
import { useAuth } from "../../auth/AuthContext";
import { BsActivity } from "react-icons/bs";

export const getMenuData = (user, t) => {
  if (!user) return [];

  // const { t } = useTranslation();
  // const { user } = useAuth();

  // 🛑 If no user (logged out or not yet logged in) → return empty sidebar
  // if (!user) return [];

  const id = user?._id;
  const permissions = user?.role?.modulePermissions || {};

  const canAccess = (module, action = "read") => {
    // ✅ Admin bypass: full access - check roleName instead of name
    // if (user?.role?.roleName?.toLowerCase() === "admin") return true;

    // If no permissions or module not defined → deny
    if (!permissions || !permissions[module]) {
      console.warn(
        `Module "${module}" not found in permissions for user ${user?.name}`,
      );
      return false;
    }

    const modulePerms = permissions[module];

    // ✅ Allow only if all:true or specific action:true
    return modulePerms?.all === true || modulePerms?.[action] === true;
  };

  const menu = [
    // MAIN
    {
      section: t("main"),
      key: "main",
      items: [
        canAccess("Dashboard", "read") && {
          label: t("dashboardsssss"),
          path: "/dashboard",
          icon: <MdOutlineDashboard className="icons" />,
        },
      ].filter(
        (item) =>
          item &&
          (!item.subItems || (item.subItems && item.subItems.length > 0)),
      ),
    },

    // FIXED Connect section:
    {
      section: t("Connect"),
      key: "Connect",
      items: [
        {
          key: "Connect",
          title: t("Connect"),
          icon: <TbBrandAppleArcade className="icons" />,
          subItems: [
            canAccess("Chat", "read") && { label: t("chat"), path: "/chat" },
            canAccess("Mail", "read") && {
              label: t("mail"),
              path: "/mail/inbox",
            },
            canAccess("Whatsapp", "read") && {
              label: t("whatsapp"),
              path: "/whatsapp",
            },
          ].filter(Boolean),
        },
      ].filter(
        (item) =>
          item &&
          (!item.subItems || (item.subItems && item.subItems.length > 0)),
      ),
    },

    // INVENTORY
    {
      section: t("inventory"),
      key: "inventory",
      items: [
        canAccess("Product", "read") && {
          label: t("Add Product"),
          path: "/add-product",
          icon: <GoPackage className="icons" />,
        },
        canAccess("Product", "read") && {
          label: t("All Products"),
          path: "/product",
          icon: <GoPackage className="icons" />,
        },
        // canAccess("Product", "read") && {
        //   label: t("expiredProducts"),
        //   path: "/expired-products",
        //   icon: <HiArrowTrendingUp className="icons" />,
        // },
        canAccess("Category", "read") && {
          label: t("category"),
          path: "/category-list",
          icon: <TbListDetails className="icons" />,
        },
        canAccess("Product", "read") && {
          label: t("Damage & Return"),
          path: "/damage-return",
          icon: <MdOutlineCategory className="icons" />,
        },
        canAccess("Product", "read") && {
          label: t("lowStocks"),
          path: "/low-stocks",
          icon: <PiWarningDiamond className="icons" />,
        },
        // canAccess("SubCategory", "read") && {
        //   label: t("subCategory"),
        //   path: "/sub-categories",
        //   icon: <MdOutlineCategory className="icons" />,
        // },
        // canAccess("Brand", "read") && {
        //   label: t("brands"),
        //   path: "/brand-list",
        //   icon: <TbBrandAsana className="icons" />,
        // },
        // canAccess("Unit", "read") && {
        //   label: t("units"),
        //   path: "/units",
        //   icon: <MdStraighten className="icons" />,
        // },
        canAccess("HSN", "read") && {
          label: t("hsn"),
          path: "/hsn",
          icon: <BsHSquare className="icons" />,
        },
        // canAccess("VariantAttributes", "read") && {
        //   label: t("variantAttributes"),
        //   path: "/variant-attributes",
        //   icon: <MdChecklist className="icons" />,
        // },
        // canAccess("Warranty", "read") && {
        //   label: t("warranties"),
        //   path: "/warranty",
        //   icon: <MdVerified className="icons" />,
        // },
        canAccess("Barcode", "read") && {
          label: t("printBarcode"),
          path: "/barcode",
          icon: <CiBarcode className="icons" />,
        },
      ].filter(Boolean),
    },

    // PEOPLES
    {
      section: t("peoples"),
      key: "Peoples",
      items: [
        canAccess("Customer", "read") && {
          label: t("customers"),
          path: "/customers",
          icon: <TbUsersGroup className="icons" />,
        },
        canAccess("Customer", "read") && {
          label: t("customersdue"),
          path: "/customerdueadvance",
          icon: <TbUsersGroup className="icons" />,
        },
        canAccess("Supplier", "read") && {
          label: t("suppliers"),
          path: "/supplier-list",
          icon: <TbUserDollar className="icons" />,
        },
      ].filter(
        (item) =>
          item &&
          (!item.subItems || (item.subItems && item.subItems.length > 0)),
      ),
    },

    // Remove Peoples section completely
    // Create a new section only for Warehouse

    // Warehouse section - update this:
    {
      section: t("warehouse"),
      key: "warehouse",
      items: [
        canAccess("Warehouse", "read") && {
          title: t("Warehouse"),
          icon: <TbBuildingWarehouse className="icons" />,
          key: "Warehouse",
          subItems: [
            // These are paths, not permission checks
            { label: t("All warehouse"), path: "/warehouse" },
            { label: t("Stock Movement Log"), path: "/stock-movement-log" },
          ],
        },
      ].filter(Boolean),
    },

    // PURCHASES
    {
      section: t("purchases"),
      key: "purchases",
      items: [
        canAccess("Purchase", "read") && {
          label: t("purchases"),
          path: "/purchase-list",
          icon: <TbShoppingBag className="icons" />,
        },
        canAccess("DebitNote", "read") && {
          label: t("Debit Note"),
          path: "/debit-note",
          icon: <MdQrCode className="icons" />,
        },
      ].filter(Boolean),
    },

    // STOCK
    {
      section: t("Stock"),
      key: "stock",
      items: [
        canAccess("Stock", "read") && {
          label: t("Purchase Stock"),
          path: "/manage-stocks",
          icon: <TbShoppingBag className="icons" />,
        },
        canAccess("StockAdjustment", "read") && {
          label: t("Stock Adjustment"),
          path: "/stock-adjustment",
          icon: <TbFileUnknown className="icons" />,
        },
      ].filter(Boolean),
    },

    // SALES
    {
      section: t("sales"),
      key: "sales",
      items: [
        canAccess("Sales", "read") && {
          label: t("sales"),
          path: "/online-orders",
          icon: <TbShoppingBag className="icons" />,
        },
        canAccess("CreditNote", "read") && {
          label: t("Credit Note"),
          path: "/credit-note",
          icon: <MdQrCode className="icons" />,
        },
        canAccess("POS", "read") && {
          label: t("pos"),
          path: "/pos",
          icon: <MdOutlinePointOfSale className="icons" />,
        },

        canAccess("Invoices", "read") && {
          label: t("invoices"),
          path: "/invoice",
          icon: <TbFileInvoice className="icons" />,
        },

        canAccess("Quotation", "read") && {
          label: t("quotation"),
          path: "/quotation-list",
          icon: <TbFileDescription className="icons" />,
        },
      ].filter(Boolean),
    },

    // PROMO
    // PROMO - Add PointsRewards
    {
      section: t("promo"),
      key: "promo",
      items: [
        canAccess("PointsRewards", "read") && {
          label: t("Points & Rewards"),
          path: "/point-rewards",
          icon: <TbFilePercent className="icons" />,
        },
        canAccess("Coupons", "read") && {
          label: t("coupons"),
          path: "/coupons",
          icon: <TbFilePercent className="icons" />,
        },
        canAccess("GiftCards", "read") && {
          label: t("giftCards"),
          path: "/gift-cards",
          icon: <TbGiftCard className="icons" />,
        },
      ].filter(Boolean),
    },

    // LOCATION
    {
      section: t("location"),
      items: [
        canAccess("Location", "read") && {
          title: t("location"),
          icon: <TbMapPin className="icons" />,
          key: "Location",
          subItems: [
            canAccess("Country", "read") && {
              label: t("countries"),
              path: "/countries",
            },
            canAccess("State", "read") && {
              label: t("states"),
              path: "/states",
            },
            canAccess("City", "read") && {
              label: t("cities"),
              path: "/cities",
            },
          ].filter(Boolean),
        },
      ].filter(
        (item) =>
          item &&
          (!item.subItems || (item.subItems && item.subItems.length > 0)),
      ),
    },

    // USER MANAGEMENT
    {
      section: t("userManagement"),
      items: [
        canAccess("Users", "read") && {
          label: t("users"),
          icon: <TbUserShield className="icons" />,
          path: "/Users",
        },
        canAccess("Roles", "read") && {
          label: t("rolesPermissions"),
          icon: <TbJumpRope className="icons" />,
          path: "/roles-permissions",
        },
      ].filter(Boolean),
    },

    // SETTINGS

    {
      section: t("settings"),

      items: [
        {
          label: t("settings"),
          icon: <TbLogout className="icons" />,
          path: "/settings/user-profile-settings",
        },

        canAccess("Settings", "read") && {
          title: t("generalSettings"),
          icon: <TbSettings className="icons" />,
          key: "generalSettings",
          subItems: [
            canAccess("Profile", "read") && {
              label: t("profile"),
              path: `/profile/${id}`,
            },
            canAccess("Security", "read") && {
              label: t("Security"),
              path: "/security-settings",
            },
          ].filter(Boolean),
        },
        canAccess("Website", "read") && {
          title: t("Website Settings"),
          icon: <TbWorld className="icons" />,
          key: "websiteSettings",
          subItems: [
            canAccess("CompanySettings", "read") && {
              label: t("Company Settings"),
              path: "/company-settings",
            },
            canAccess("Localization", "read") && {
              label: t("Localization"),
              path: "/language-settings",
            },
          ].filter(Boolean),
        },
      ].filter(
        (item) =>
          item &&
          (!item.subItems || (item.subItems && item.subItems.length > 0)),
      ),
    },

    // REPORTS
    // REPORTS - Use specific module
    {
      section: t("Reports"),
      key: "reports",
      items: [
        canAccess("PurchaseReport", "read") && {
          label: t("Purchase Report"),
          path: "/purchase-report",
          icon: <FaRegFileAlt className="icons" />,
        },
      ].filter(Boolean),
    },

    {
      section: t("Recycle Bin"),
      key: "delete",
      items: [
        canAccess("Trash", "read") && {
          label: t("Trash"),
          path: "/delete",
          icon: <TbTrash className="icons" />,
        },
      ].filter(Boolean), // or always show
    },
    {
      section: t("Activity"),
      key: "auditlog",
      items: [
        canAccess("Activity", "read") && {
          label: t("Audit Trail"),
          path: "/activity",
          icon: <BsActivity className="icons" />,
        },
      ].filter(Boolean), // or just always show: [{ label: t("Audit Trail"), path: "/activity", icon: <BsActivity className="icons" /> }]
    },

    // FINANCE & ACCOUNTS - Update to use specific modules
    {
      section: t("Reports"),
      key: "Reports",
      items: [
        canAccess("SalesReport", "read") && {
          label: t("Sales Report"),
          path: "/sales-report",
          icon: <TbReportMoney className="icons" />,
        },
        canAccess("PurchaseReport", "read") && {
          label: t("Purchase Report"),
          path: "/purchase-report",
          icon: <SiFuturelearn className="icons" />,
        },
        canAccess("InventoryReport", "read") && {
          label: t("Inventory Report"),
          path: "/inventory-report",
          icon: <FaStackOverflow className="icons" />,
        },
        canAccess("SupplierReport", "read") && {
          label: t("Supplier Report"),
          path: "/supplier-report",
          icon: <MdOutlinePayments className="icons" />,
        },
        canAccess("ReturnDamageReport", "read") && {
          label: t("Return & Damages Report"),
          path: "/return-damage-report",
          icon: <IoLogoWebComponent className="icons" />,
        },
        canAccess("CreditDebitNoteReport", "read") && {
          label: t("Credit & Debit Note Report"),
          path: "/credit&debit-note",
          icon: <MdOutlineSpeakerNotes className="icons" />,
        },
        canAccess("OverdueReport", "read") && {
          label: t("Overdue Report"),
          path: "/overdue-report",
          icon: <FaStackOverflow className="icons" />,
        },
        canAccess("ExpenseReport", "read") && {
          label: t("Expense Report"),
          path: "/expense-report",
          icon: <GiExpense className="icons" />,
        },
      ].filter(Boolean),
    },

    {
      section: t("Logout"),
      key: "Logout",
      items: [
        {
          label: t("logout"),
          icon: <TbLogout className="icons" />,
          path: "/logout",
        },
      ],
    },
  ];
  // ✅ Finally filter out empty sections
  return menu.filter((section) => section.items && section.items.length > 0);
};
