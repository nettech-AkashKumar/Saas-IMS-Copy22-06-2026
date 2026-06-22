const EWBModel = require("../../models/E-wayBill/ewb.model");
const { getAutoModels } = require("../../utils/SaaS/autoModelInitializer");
const {
  generateEWBService,
  cancelEWB,
  updateVehicleService,
  extendEWBValidity,
  updateTransporterService,
  getEwayBillDetails,
} = require("../../services/ewb.service");

// =====================================
// HELPER: GET TENANT MODEL
// =====================================
const getEWB = (req) => {
  if (!req.db) {
    throw new Error("DB connection missing for EWB model");
  }

  return EWBModel.forTenant(req.db);
};

// =====================================
// GENERATE EWB
// =====================================
exports.generateEWBController = async (req, res) => {
  try {
    console.time("TOTAL");

    console.log("TENANT DB =>", req.db.name);
    console.log("REQUEST BODY =>", req.body);

    const EWB = getEWB(req);

    const { DeliveryChallan: DeliveryChallanModel } =
      await getAutoModels(req);

    const deliveryChallanId = req.body.deliveryChallanId || null;

    // ==============================
    // DUPLICATE CHECK
    // ==============================
    const existing = await EWB.findOne({
      invoiceNo: req.body.document_number,
      status: "GENERATED",
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "EWB already generated",
        ewayBillNo: existing.ewayBillNo,
      });
    }

    // ==============================
    // CALL API
    // ==============================
    console.time("API_CALL");

    const result = await generateEWBService(req.body);

    console.timeEnd("API_CALL");

    console.log("API RESULT =>", result);

    const ewbData =
      typeof result.message === "object"
        ? result.message
        : {};

    // ==============================
    // DATE FIX (IMPORTANT)
    // ==============================
    const parseEWBDate = (str) => {
      if (!str) return null;

      // format: 28/05/2026 04:54:00 PM
      const [datePart, timePart, meridian] = str.split(" ");
      if (!datePart || !timePart) return null;

      const [day, month, year] = datePart.split("/");
      let [hours, minutes, seconds] = timePart.split(":");

      if (meridian === "PM" && hours !== "12") {
        hours = String(Number(hours) + 12);
      }
      if (meridian === "AM" && hours === "12") {
        hours = "00";
      }

      return new Date(
        `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
      );
    };

    const parsedEWBDate = parseEWBDate(ewbData.ewayBillDate);
    const parsedValidUpto = parseEWBDate(ewbData.validUpto);

    // ==============================
    // SAVE EWB
    // ==============================
    console.time("DB_SAVE");

    const saved = await EWB.create({
      invoiceNo: req.body.document_number,
      deliveryChallanId,

      userGstin: req.body.userGstin,
      customerGSTIN: req.body.gstin_of_consignee,
      vehicleNo: req.body.vehicle_number,
      totalValue: req.body.total_invoice_value,

      ewayBillNo: String(ewbData.ewayBillNo || ""),

      // FIXED DATE
      ewayBillDate: parsedEWBDate,
      validUpto: parsedValidUpto,

      status: ewbData.ewayBillNo ? "GENERATED" : "FAILED",

      errorMessage: ewbData.alert || ewbData.error || "",

      apiResponse: result,
    });

    console.timeEnd("DB_SAVE");

    // ==============================
    // UPDATE DELIVERY CHALLAN
    // ==============================
    if (deliveryChallanId) {
      await DeliveryChallanModel.findByIdAndUpdate(
        deliveryChallanId,
        {
          ewbId: saved._id, // FIXED (was ewayBillId wrong)

          ewayBillNo: saved.ewayBillNo,
          ewayBillDate: saved.ewayBillDate,
          ewbStatus: saved.status,

          updatedAt: new Date(),
        }
      );

      console.log("Delivery Challan updated with EWB details");
    }

    console.timeEnd("TOTAL");

    return res.status(200).json({
      success: true,
      data: result,
      ewb: saved,
    });

  } catch (err) {
    console.log("GENERATE ERROR =>", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: err.response?.data || err.message,
    });
  }
};


// =====================================
// CANCEL EWB
// =====================================
exports.cancelEwayBill = async (req, res) => {
  try {
    const EWB = getEWB(req);

    const {
      eway_bill_number,
      reason_of_cancel,
      cancel_remark,
    } = req.body;

    // validation
    if (
      !eway_bill_number ||
      !reason_of_cancel ||
      !cancel_remark
    ) {
      return res.status(400).json({
        success: false,
        message:
          "eway_bill_number, reason_of_cancel and cancel_remark are required",
      });
    }

    // find EWB in tenant DB
    const ewbDoc = await EWB.findOne({
      ewayBillNo: String(eway_bill_number),
    });

    if (!ewbDoc) {
      return res.status(404).json({
        success: false,
        message: "EWB not found",
      });
    }

    // prevent double cancel
    if (ewbDoc.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "EWB already cancelled",
      });
    }

    // Masters India payload
    const payload = {
      userGstin: ewbDoc.userGstin, // always from DB
      eway_bill_number: Number(
        eway_bill_number
      ),
      reason_of_cancel,
      cancel_remark,
      data_source: "erp",
    };

    const apiRes = await cancelEWB(
      payload
    );

    // update DB
    await EWB.findOneAndUpdate(
      {
        ewayBillNo: String(
          eway_bill_number
        ),
      },
      {
        status: "CANCELLED",
        cancelReason:
          reason_of_cancel,
        cancelRemark:
          cancel_remark,
        cancelResponse: apiRes,
      },
      { new: true }
    );

    return res.json({
      success: true,
      data: apiRes,
    });

  } catch (err) {
    console.log(
      "CANCEL ERROR =>",
      err.response?.data ||
        err.message
    );

    return res.status(500).json({
      success: false,
      message:
        err.response?.data ||
        err.message,
    });
  }
};


// =====================================
// GET ALL EWB
// =====================================
exports.getAllEWB = async (
  req,
  res
) => {
  try {
    const EWB = getEWB(req);

    const data = await EWB.find()
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: data.length,
      data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



// =====================================
// GET EWB BY ID
// =====================================
exports.getEWBById = async (req, res) => {
  try {
    const EWB = getEWB(req);

    const { id } = req.params;

    const data = await EWB.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "EWB not found",
      });
    }

    return res.json({
      success: true,
      data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};



exports.getEWBByNumber = async (req, res) => {
  try {
    const EWB = getEWB(req);

    const { ewayBillNo } = req.params;

    const data = await EWB.findOne({ ewayBillNo });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    return res.json({
      success: true,
      data,
    });

  } catch (err) {
    return res.status(500).json({
      success:false,
      message: err.message
    });
  }
};




exports.updateVehicleController = async (req, res) => {
  try {
    const EWB = getEWB(req);

    const {
      eway_bill_number,
      vehicle_number,
      vehicle_type,
      place_of_consignor,
      state_of_consignor,
      reason_code_for_vehicle_updation,
      reason_for_vehicle_updation,
      transporter_document_number,
      transporter_document_date,
      mode_of_transport,
    } = req.body;

    if (!eway_bill_number || !vehicle_number) {
      return res.status(400).json({
        success: false,
        message:
          "EWB number and vehicle number required",
      });
    }

    // find EWB in DB
    const ewbDoc = await EWB.findOne({
      ewayBillNo: String(
        eway_bill_number
      ),
    });

    if (!ewbDoc) {
      return res.status(404).json({
        success: false,
        message: "EWB not found",
      });
    }

    // prevent update on cancelled
    if (ewbDoc.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled EWB cannot be updated",
      });
    }

    const payload = {
      userGstin:
        ewbDoc.userGstin ||
        ewbDoc.customerGSTIN,
      eway_bill_number: Number(
        eway_bill_number
      ),
      vehicle_number,
      vehicle_type,
      place_of_consignor,
      state_of_consignor,
      reason_code_for_vehicle_updation,
      reason_for_vehicle_updation,
      transporter_document_number,
      transporter_document_date,
      mode_of_transport,
      data_source: "erp",
    };

    const apiRes =
      await updateVehicleService(
        payload
      );

    await EWB.findOneAndUpdate(
      {
        ewayBillNo: String(
          eway_bill_number
        ),
      },
      {
        vehicleNo:
          vehicle_number,
        vehicleUpdateResponse:
          apiRes,
        updatedAt:
          new Date(),
      }
    );

    return res.json({
      success: true,
      data: apiRes,
    });

  } catch (err) {
    console.log(
      "VEHICLE UPDATE ERROR =>",
      err.response?.data ||
        err.message
    );

    return res.status(500).json({
      success: false,
      message:
        err.response?.data ||
        err.message,
    });
  }
};


exports.extendValidityController =
  async (req, res) => {
    try {
      const EWB =
        getEWB(req);

      const {
        eway_bill_number,
        vehicle_number,
        place_of_consignor,
        state_of_consignor,
        remaining_distance,
        transporter_document_number,
        transporter_document_date,
        mode_of_transport,
        extend_validity_reason,
        extend_remarks,
        consignment_status,
        from_pincode,
        transit_type,
        address_line1,
        address_line2,
        address_line3,
      } = req.body;

      const ewbDoc =
        await EWB.findOne({
          ewayBillNo:
            String(
              eway_bill_number
            ),
        });

      if (!ewbDoc) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "EWB not found",
          });
      }

      const payload = {
        userGstin:
          ewbDoc.userGstin ||
          ewbDoc.customerGSTIN,
        eway_bill_number:
          Number(
            eway_bill_number
          ),
        vehicle_number,
        place_of_consignor,
        state_of_consignor,
        remaining_distance,
        transporter_document_number,
        transporter_document_date,
        mode_of_transport,
        extend_validity_reason,
        extend_remarks,
        consignment_status,
        from_pincode,
        transit_type,
        address_line1,
        address_line2,
        address_line3,
      };

      const apiRes =
        await extendEWBValidity(
          payload
        );

      await EWB.findOneAndUpdate(
        {
          ewayBillNo:
            String(
              eway_bill_number
            ),
        },
        {
          validUpto:
            apiRes.message
              ?.validUpto,
          validityExtensionResponse:
            apiRes,
        }
      );

      return res.json({
        success: true,
        data: apiRes,
      });

    } catch (err) {
      console.log(
        "EXTEND ERROR =>",
        err.response?.data ||
          err.message
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            err.response
              ?.data ||
            err.message,
        });
    }
  };


  exports.updateTransporterController =
  async (req, res) => {
    try {
      const EWB =
        getEWB(req);

      const {
        eway_bill_number,
        transporter_id,
        transporter_name,
      } = req.body;

      if (
        !eway_bill_number ||
        !transporter_id ||
        !transporter_name
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "All fields are required",
          });
      }

      const ewbDoc =
        await EWB.findOne({
          ewayBillNo:
            String(
              eway_bill_number
            ),
        });

      if (!ewbDoc) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "EWB not found",
          });
      }

      const payload = {
        userGstin:
          ewbDoc.userGstin ||
          ewbDoc.customerGSTIN,
        eway_bill_number:
          Number(
            eway_bill_number
          ),
        transporter_id,
        transporter_name,
      };

      const apiRes =
        await updateTransporterService(
          payload
        );

      await EWB.findOneAndUpdate(
        {
          ewayBillNo:
            String(
              eway_bill_number
            ),
        },
        {
          transporterId:
            transporter_id,
          transporterName:
            transporter_name,
          transporterUpdateResponse:
            apiRes,
        }
      );

      return res.json({
        success: true,
        data: apiRes,
      });

    } catch (err) {
      console.log(
        "TRANSPORTER UPDATE ERROR =>",
        err.response?.data ||
          err.message
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            err.response
              ?.data ||
            err.message,
        });
    }
  };


  exports.getEWBDetailsController =
  async (req, res) => {
    try {
      const EWB =
        getEWB(req);

      const {
        ewayBillNo,
      } = req.params;

      const ewbDoc =
        await EWB.findOne({
          ewayBillNo:
            String(
              ewayBillNo
            ),
        });

      if (!ewbDoc) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "EWB not found",
          });
      }

      const result =
        await getEwayBillDetails(
          ewbDoc.userGstin ||
            ewbDoc.customerGSTIN,
          ewayBillNo
        );

      return res.json({
        success: true,
        data: result,
      });

    } catch (err) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            err.response
              ?.data ||
            err.message,
        });
    }
  };
  