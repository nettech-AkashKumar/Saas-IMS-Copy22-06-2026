const { formatDate } = require("./formatter");

exports.mapInvoiceToEWB = (invoice) => {

  return {

    // =====================================
    // BASIC DETAILS
    // =====================================

    userGstin:
      invoice.gstin ||
      "05AAABB0639G1Z8",

    supply_type: "outward",

    sub_supply_type: "Supply",

    sub_supply_description: "",

    document_type: "Tax Invoice",

    document_number:
      invoice.invoiceNo,

    document_date:
      formatDate(invoice.date),

    // =====================================
    // CONSIGNOR DETAILS
    // =====================================

    gstin_of_consignor:
      invoice.gstin ||
      "05AAABB0639G1Z8",

    legal_name_of_consignor:
      invoice.companyName ||
      "My Company Pvt Ltd",

    address1_of_consignor:
      invoice.fromAddress1 ||
      "Industrial Area",

    address2_of_consignor:
      invoice.fromAddress2 ||
      "Phase 1",

    place_of_consignor:
      invoice.fromCity ||
      "Dehradun",

    pincode_of_consignor:
      Number(
        invoice.fromPincode
      ) || 248001,

    state_of_consignor:
      invoice.fromState ||
      "UTTARAKHAND",

    actual_from_state_name:
      invoice.fromState ||
      "UTTARAKHAND",

    // =====================================
    // CONSIGNEE DETAILS
    // =====================================

    gstin_of_consignee:
      invoice.customerGSTIN ||
      "05AAABC0181E1ZE",

    legal_name_of_consignee:
      invoice.customerName ||
      "Customer Pvt Ltd",

    address1_of_consignee:
      invoice.toAddress1 ||
      "Business Park",

    address2_of_consignee:
      invoice.toAddress2 ||
      "Sector 10",

    place_of_consignee:
      invoice.toCity ||
      "Haridwar",

    pincode_of_consignee:
      Number(
        invoice.toPincode
      ) || 249401,

    state_of_supply:
      invoice.toState ||
      "UTTARAKHAND",

    actual_to_state_name:
      invoice.toState ||
      "UTTARAKHAND",

    // =====================================
    // TAX DETAILS
    // =====================================

    transaction_type: 1,

    other_value: 0,

    total_invoice_value:
      Number(invoice.total) || 0,

    taxable_amount:
      Number(invoice.taxable) || 0,

    cgst_amount:
      Number(invoice.cgst) || 0,

    sgst_amount:
      Number(invoice.sgst) || 0,

    igst_amount:
      Number(invoice.igst) || 0,

    cess_amount: 0,

    cess_nonadvol_value: 0,

    // =====================================
    // TRANSPORT DETAILS
    // =====================================

    transporter_id:
      invoice.transporterId ||
      "05AAABB0639G1Z8",

    transporter_name:
      invoice.transporterName ||
      "Fast Transport",

    transporter_document_number:
      "TRN001",

    transporter_document_date:
      formatDate(invoice.date),

    transportation_mode:
      "Road",

    transportation_distance:
      String(
        invoice.distance || 50
      ),

    vehicle_number:
      invoice.vehicleNo ||
      "UK07AB1234",

    vehicle_type:
      "Regular",

    // =====================================
    // EXTRA DETAILS
    // =====================================

    generate_status: 1,

    data_source: "erp",

    user_ref:
      invoice.invoiceNo,

    location_code: "MAIN",

    eway_bill_status: "ACT",

    auto_print: "N",

    email: "",

    delete_record: "N",

    // =====================================
    // PRODUCT ITEMS
    // =====================================

    itemList: (invoice.items || [])
      .map((i) => ({

        product_name:
          i.name ||
          "Steel Rod",

        product_description:
          i.description ||
          i.name ||
          "Steel Rod",

        hsn_code:
          i.hsn ||
          "7214",

        quantity:
          Number(i.qty) || 1,

        unit_of_product:
          i.unit || "NOS",

        cgst_rate:
          Number(i.cgst) || 9,

        sgst_rate:
          Number(i.sgst) || 9,

        igst_rate:
          Number(i.igst) || 0,

        cess_rate: 0,

        cessNonAdvol: 0,

        taxable_amount:
          Number(i.taxable) || 0,

      })),

  };

};