import qz from "qz-tray";

qz.security.setCertificatePromise(function(resolve, reject) { resolve(null); });
qz.security.setSignaturePromise(function(toSign) { return function(resolve, reject) { resolve(); }; });

// ==========================================================
// PREVENT DUPLICATE CONNECTIONS
// ==========================================================

let qzConnecting = false;

// ==========================================================
// CONNECT TO QZ TRAY
// ==========================================================

export const connectQZ = async () => {

  try {

    // Prevent reconnect spam
    if (qz.websocket.isActive()) {
      return true;
    }

    // Prevent duplicate simultaneous calls
    if (qzConnecting) {
      return false;
    }

    qzConnecting = true;

    console.log("Attempting QZ Tray connection...");

    await qz.websocket.connect();

    console.log("QZ Tray Connected Successfully");

    return true;

  } catch (error) {

    console.error("QZ Tray Connection Failed:", error);

    alert(
      "QZ Tray not connected.\n\n" +
      "Please ensure:\n" +
      "1. QZ Tray is installed\n" +
      "2. QZ Tray is running\n" +
      "3. Open https://localhost:8181 once\n" +
      "4. Accept certificate if prompted\n" +
      "5. Reload the website"
    );

    return false;

  } finally {

    qzConnecting = false;
  }
};

// ==========================================================
// DISCONNECT QZ
// ==========================================================

export const disconnectQZ = async () => {
  try {

    if (qz.websocket.isActive()) {
      await qz.websocket.disconnect();
      console.log("QZ Tray disconnected");
    }

  } catch (error) {

    console.error("QZ disconnect error:", error);
  }
};

// ==========================================================
// GET AVAILABLE PRINTERS
// ==========================================================

export const getAvailablePrinters = async () => {
  try {

    const isConnected = await connectQZ();

    if (!isConnected) {
      return [];
    }

    const printers = await qz.printers.find();

    console.log("Available printers:", printers);

    return printers || [];

  } catch (error) {

    console.error("Failed to fetch printers:", error);

    return [];
  }
};

// ==========================================================
// AUTO DETECT BEST THERMAL PRINTER
// ==========================================================

const detectThermalPrinter = async () => {

  try {
  
    const printers = await qz.printers.find();

    if (!printers || printers.length === 0) {
      return null;
    }
    
    const thermalKeywords = [
      "pos",
      "thermal",
      "epson",
      "tvs",
      "xp",
      "xprinter",
      "rongta",
      "bixolon",
      "receipt",
      "80mm",
      "58mm"
    ];

    const matchedPrinter = printers.find((printer) => {

      const lower = printer.toLowerCase();

      return thermalKeywords.some((keyword) =>
        lower.includes(keyword)
      );
    });

    return matchedPrinter || printers[0];

  } catch (error) {

    console.error("Printer detection failed:", error);

    return null;
  }
};

// ==========================================================
// PRINT THERMAL BILL
// ==========================================================

export const printThermalBill = async (
  saleData,
  printerName = "",
  companyDetails = null
) => {

  const isConnected = await connectQZ();

  if (!isConnected) {
    throw new Error("Could not communicate with local QZ Tray.");
  }

  try {

    // ==========================================================
    // SELECT PRINTER
    // ==========================================================

    let chosenPrinter = null;

    if (printerName) {

      chosenPrinter = printerName;

    } else {

      chosenPrinter = await detectThermalPrinter();
    }

    if (!chosenPrinter) {
      throw new Error("No printer detected on this machine.");
    }

    console.log("Using Printer:", chosenPrinter);

    // ==========================================================
    // CREATE PRINT CONFIG
    // ==========================================================

    const config = qz.configs.create(chosenPrinter, {
      encoding: "UTF-8",
      altPrinting: false,
      copies: 1
    });

    // ==========================================================
    // EXTRACT LOGO
    // ==========================================================

    const activeLogo =
      companyDetails?.logoUrl ||
      companyDetails?.logo ||
      saleData?.logoUrl ||
      saleData?.logo ||
      null;

    // ==========================================================
    // TEMPLATE STRING MODE
    // ==========================================================

    if (typeof saleData === "string") {

      const payload = [];

      if (activeLogo) {

        payload.push(
          {
            type: "raw",
            format: "command",
            data: "\x1B\x61\x01"
          },
          {
            type: "raw",
            format: "image",
            data: activeLogo,
            options: {
              language: "escpos",
              dotDensity: "double"
            }
          },
          {
            type: "raw",
            format: "plain",
            data: "\n"
          }
        );
      }

      payload.push({
        type: "raw",
        format: "plain",
        data: saleData
      });

      await qz.print(config, payload);

      console.log("Template printed successfully");

      return;
    }

    // ==========================================================
    // FORMATTER
    // ==========================================================

    const formatNum = (value) => {
      const num = parseFloat(value);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    };

    const payload = [];

    // ==========================================================
    // ESC/POS COMMANDS
    // ==========================================================

    const CENTER = "\x1B\x61\x01";
    const LEFT = "\x1B\x61\x00";

    const DOUBLE_FONT = "\x1B\x21\x20";
    const NORMAL_FONT = "\x1B\x21\x00";

    const BOLD_ON = "\x1B\x45\x01";
    const BOLD_OFF = "\x1B\x45\x00";

    const CUT_PAPER = "\x1B\x6D";

    const FEED_PAPER = "\x1B\x64\x04";

    const LINE =
      "----------------------------------------\n";

    // ==========================================================
    // LOGO
    // ==========================================================

    if (activeLogo) {

      payload.push(
        {
          type: "raw",
          format: "command",
          data: CENTER
        },
        {
          type: "raw",
          format: "image",
          data: activeLogo,
          options: {
            language: "escpos",
            dotDensity: "double"
          }
        },
        {
          type: "raw",
          format: "plain",
          data: "\n"
        }
      );
    }

    const lines = [];

    // ==========================================================
    // HEADER
    // ==========================================================

    lines.push(CENTER);

    lines.push(
      DOUBLE_FONT +
      BOLD_ON +
      `${(
        companyDetails?.companyName ||
        "RETAIL STORE"
      ).toUpperCase()}\n` +
      BOLD_OFF +
      NORMAL_FONT
    );

    if (companyDetails?.companyaddress) {
      lines.push(`${companyDetails.companyaddress}\n`);
    }

    if (companyDetails?.companyphone) {
      lines.push(`Tel: ${companyDetails.companyphone}\n`);
    }

    if (
      companyDetails?.gstin ||
      companyDetails?.gstNumber
    ) {
      lines.push(
        `GSTIN: ${
          companyDetails.gstin ||
          companyDetails.gstNumber
        }\n`
      );
    }

    lines.push(LINE);

    // ==========================================================
    // BILL INFO
    // ==========================================================

    lines.push(LEFT);

    lines.push(
      `Invoice No : ${
        saleData?.invoiceNumber || "N/A"
      }\n`
    );

    const printDate = saleData?.createdAt
      ? new Date(saleData.createdAt).toLocaleString()
      : new Date().toLocaleString();

    lines.push(`Date       : ${printDate}\n`);

    lines.push(
      `Pay Mode   : ${
        saleData?.paymentDetails?.paymentMethod ||
        "N/A"
      }\n`
    );

    if (saleData?.customer?.name) {

      lines.push(
        `Customer   : ${saleData.customer.name}\n`
      );

      if (saleData?.customer?.phone) {
        lines.push(
          `Contact    : ${saleData.customer.phone}\n`
        );
      }
    }

    lines.push(LINE);

    // ==========================================================
    // ITEMS HEADER
    // ==========================================================

    lines.push(
      "Item Name      Qty    Rate      Total\n"
    );

    lines.push(LINE);

    // ==========================================================
    // ITEMS
    // ==========================================================

    const items =
      saleData?.items ||
      saleData?.selectedItems ||
      [];

    items.forEach((item) => {

      const name =
        (item.productName || "Item")
          .substring(0, 14)
          .padEnd(14);

      const qty =
        String(item.quantity || 1).padStart(4);

      const rateValue =
        item.sellingPrice ??
        item.salePrice ??
        item.price ??
        0;

      const rate =
        formatNum(rateValue).padStart(10);

      const total =
        formatNum(
          parseFloat(rateValue) *
          parseInt(item.quantity || 1, 10)
        ).padStart(11);

      lines.push(
        `${name}${qty} ${rate}${total}\n`
      );
    });

    lines.push(LINE);

    // ==========================================================
    // TOTALS
    // ==========================================================

    const totalAmount =
      parseFloat(
        saleData?.totalAmount ||
        saleData?.totals?.totalAmount ||
        0
      );

    const tax =
      parseFloat(
        saleData?.tax ||
        saleData?.totals?.totalTax ||
        0
      );

    const discount =
      parseFloat(
        saleData?.discount ||
        saleData?.totals?.discount ||
        0
      );

    const subtotal =
      totalAmount - tax + discount;

    const padLabel = (label, value) => {

      const val = formatNum(value);

      const spaces =
        40 - label.length - val.length;

      return `${label}${" ".repeat(
        spaces > 0 ? spaces : 1
      )}${val}\n`;
    };

    lines.push(
      padLabel("Sub Total", subtotal)
    );

    if (discount > 0) {
      lines.push(
        padLabel("Discount (-)", discount)
      );
    }

    if (tax > 0) {

      const halfTax = tax / 2;

      lines.push(
        padLabel("CGST", halfTax)
      );

      lines.push(
        padLabel("SGST", halfTax)
      );
    }

    lines.push(LINE);

    const totalLabel = "GRAND TOTAL";

    const totalValue = formatNum(totalAmount);

    const totalSpaces =
      40 -
      totalLabel.length -
      totalValue.length;

    lines.push(
      BOLD_ON +
      totalLabel +
      " ".repeat(
        totalSpaces > 0 ? totalSpaces : 1
      ) +
      totalValue +
      BOLD_OFF +
      "\n"
    );

    lines.push(LINE);

    const amountReceived =
      saleData?.amountReceived ||
      saleData?.paymentDetails?.amountReceived ||
      0;

    lines.push(
      padLabel(
        "Amount Received",
        amountReceived
      )
    );

    const changeReturned =
      parseFloat(
        saleData?.changeReturned ||
        saleData?.paymentDetails?.changeReturned ||
        0
      );

    if (
      !isNaN(changeReturned) &&
      changeReturned > 0
    ) {
      lines.push(
        padLabel(
          "Change Returned",
          changeReturned
        )
      );
    }

    // ==========================================================
    // FOOTER
    // ==========================================================

    lines.push(LINE);

    lines.push(CENTER);

    lines.push(
      BOLD_ON +
      "THANK YOU FOR SHOPPING!\n" +
      BOLD_OFF
    );

    lines.push("Visit Again\n\n\n");

    lines.push(FEED_PAPER);

    lines.push(CUT_PAPER);

    // ==========================================================
    // FINAL PAYLOAD
    // ==========================================================

    payload.push({
      type: "raw",
      format: "plain",
      data: lines.join("")
    });

    // ==========================================================
    // PRINT
    // ==========================================================

    await qz.print(config, payload);

    console.log("Invoice printed successfully");

    return true;

  } catch (error) {

    console.error(
      "Print Error inside structural alignment routine:",
      error
    );

    throw error;
  }
};