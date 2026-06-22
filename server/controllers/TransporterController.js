
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const ApiError = require("../utils/ApiError");

exports.createTransporter = async (req, res, next) => {
  try {
    const { Transporter: TransporterModels, Driver: DriverModel, Vehicle: VehicleModel, } = await getAutoModels(req);

    const {
      transporterName,
      ownerName,
      transporterGST,
      transporterID,
      assignDriverID,
      assignVehicleID,
      bankName,
      accountNumber,
      accountHolderName,
      accountType,
      ifscCode,
      branchName,
    } = req.body;

    const assignDrivers =
      req.body["assignDriverID[]"] ||
      req.body.assignDriverID ||
      [];

    const assignVehicles =
      req.body["assignVehicleID[]"] ||
      req.body.assignVehicleID ||
      [];

    // Check duplicate transporter
    const existingTransporterName = await TransporterModels.findOne({
      transporterName: {
        $regex: new RegExp("^" + transporterName + "$", "i"),
      },
    });
     const existingTransporterID = await TransporterModels.findOne({
      transporterID: {
        $regex: new RegExp("^" + transporterID + "$", "i"),
      },
    });

    if (existingTransporterName) {
      return res
        .status(400)
        .json({ message: "Transporter Name already exists" });
    }
      if (existingTransporterID) {
      return res
        .status(400)
        .json({ message: "Transporter ID already exists" });
    }

    // Helper function for upload
    const uploadToCloudinary = async (files) => {
      if (!files || files.length === 0) return [];

      return Promise.all(
        files.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "transporter_images" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );
            stream.end(file.buffer);
          });
        })
      );
    };

    // Upload each doc separately
    const doc1Uploads = await uploadToCloudinary(req.files?.doc1);
    const doc2Uploads = await uploadToCloudinary(req.files?.doc2);
    const doc3Uploads = await uploadToCloudinary(req.files?.doc3);

    // Format response
    const formatImages = (uploads) =>
      uploads.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));

    // Save transporter
    const transporter = new TransporterModels({
      transporterName,
      ownerName,
      transporterGST,
      transporterID,
      assignDriverID: Array.isArray(assignDrivers) ? assignDrivers : [assignDrivers],
      assignVehicleID: Array.isArray(assignVehicles) ? assignVehicles : [assignVehicles],
      bankName,
      accountNumber,
      accountHolderName,
      accountType,
      ifscCode,
      branchName,
      isDeleted: false,
      doc1: formatImages(doc1Uploads),
      doc2: formatImages(doc2Uploads),
      doc3: formatImages(doc3Uploads),
    });

    await transporter.save();

    await DriverModel.updateMany(
      {
        _id: {
          $in: Array.isArray(assignDrivers)
            ? assignDrivers
            : [assignDrivers],
        },
      },
      {
        $set: {
          isAssigned: true,
        },
      }
    );

    await VehicleModel.updateMany(
      {
        _id: {
          $in: Array.isArray(assignVehicles)
            ? assignVehicles
            : [assignVehicles],
        },
      },
      {
        $set: {
          isAssigned: true,
        },
      }
    );

    // SINGLE RESPONSE ONLY
    res.status(201).json({
      message: "Transporter created successfully",
      transporter,
    });
  } catch (error) {
    return next(ApiError.internal("Error creating transporter"));
  }
};

exports.getAllTransporters = async (req, res, next) => {
  try {
    const { Transporter: TransporterModels } = await getAutoModels(req);

    const transporters = await TransporterModels.find()
      .populate(
        "assignVehicleID",
        "vehicleType vehicleNumber capacity status"
      )
      .populate(
        "assignDriverID",
        "driverName mobileNumber"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      transporters,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTransporter = async (req, res, next) => {
  try {
    const { Transporter: TransporterModels } = await getAutoModels(req);
    const { id } = req.params;
    const oldTransporter = await TransporterModels.findById(id);

    if (!oldTransporter) {
      return res.status(404).json({
        success: false,
        message: "Transporter not found",
      });
    }

    const assignDrivers =
      req.body["assignDriverID[]"] ||
      req.body.assignDriverID ||
      [];

    const assignVehicles =
      req.body["assignVehicleID[]"] ||
      req.body.assignVehicleID ||
      [];

    const {
      Driver: DriverModel,
      Vehicle: VehicleModel,
    } = await getAutoModels(req);

    await DriverModel.updateMany(
      {
        _id: {
          $in: oldTransporter.assignDriverID,
        },
      },
      {
        $set: {
          isAssigned: false,
        },
      }
    );

    await VehicleModel.updateMany(
      {
        _id: {
          $in: oldTransporter.assignVehicleID,
        },
      },
      {
        $set: {
          isAssigned: false,
        },
      }
    );

    const updatedData = {
      ...req.body,

      assignDriverID: Array.isArray(assignDrivers) ? assignDrivers : [assignDrivers],

      assignVehicleID: Array.isArray(assignVehicles) ? assignVehicles : [assignVehicles],
    };

    const uploadToCloudinary = async (files) => {
      if (!files || files.length === 0) return [];

      return Promise.all(
        files.map((file) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "transporter_images" },
              (error, result) => {
                if (error) return reject(error);
                resolve(result);
              }
            );

            stream.end(file.buffer);
          });
        })
      );
    };

    // upload docs
    const doc1Uploads = await uploadToCloudinary(req.files?.doc1);
    const doc2Uploads = await uploadToCloudinary(req.files?.doc2);
    const doc3Uploads = await uploadToCloudinary(req.files?.doc3);

    // format
    const formatImages = (uploads) =>
      uploads.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));

    if (doc1Uploads.length > 0) {
      updatedData.doc1 = formatImages(doc1Uploads);
    }

    if (doc2Uploads.length > 0) {
      updatedData.doc2 = formatImages(doc2Uploads);
    }

    if (doc3Uploads.length > 0) {
      updatedData.doc3 = formatImages(doc3Uploads);
    }

    const updatedTransporter =
      await TransporterModels.findByIdAndUpdate(
        id,
        updatedData,
        { new: true }
      );

    await DriverModel.updateMany(
      {
        _id: {
          $in: Array.isArray(assignDrivers)
            ? assignDrivers
            : [assignDrivers],
        },
      },
      {
        $set: {
          isAssigned: true,
        },
      }
    );

    await VehicleModel.updateMany(
      {
        _id: {
          $in: Array.isArray(assignVehicles)
            ? assignVehicles
            : [assignVehicles],
        },
      },
      {
        $set: {
          isAssigned: true,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Transporter Updated Successfully",
      transporter: updatedTransporter,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateTransporterStatus = async (req, res) => {
  try {

    const { Transporter: TransporterModels } = await getAutoModels(req);
    const { id } = req.params;
    const { status } = req.body;
    const transporter = await TransporterModels.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!transporter) {
      return res.status(404).json({
        success: false,
        message: "Transporter not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      transporter,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

exports.deleteTransporter = async (req, res) => {
  try {
    const { Transporter: TransporterModels, Driver: DriverModel, Vehicle: VehicleModel, } = await getAutoModels(req);

    const { id } = req.params;

    await TransporterModels.findByIdAndUpdate(id, { isDeleted: true });

    const transporter = await TransporterModels.findById(id);

    if (transporter) {

      await DriverModel.updateMany(
        {
          _id: {
            $in: transporter.assignDriverID,
          },
        },
        {
          $set: {
            isAssigned: false,
          },
        }
      );

      await VehicleModel.updateMany(
        {
          _id: {
            $in: transporter.assignVehicleID,
          },
        },
        {
          $set: {
            isAssigned: false,
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      message: "Transporter Deleted Successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

exports.getActiveTransporters = async (req, res) => {
  try {
    const { Transporter: TransporterModels } = await getAutoModels(req);
    const transporters = await TransporterModels.find({ isDeleted: false }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      message: "Active Transporters Fetched Successfully",
      transporters,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getDeletedTransporters = async (req, res) => {
  try {
    const { Transporter: TransporterModels } = await getAutoModels(req);
    const transporter = await TransporterModels.find({ isDeleted: true }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      success: true,
      message: "Deleted Transporters Fetched Successfully",
      transporter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.restoreTransporter = async (req, res) => {
  try {
    const { Transporter: TransporterModels } = await getAutoModels(req);
    const { id } = req.params;
    await TransporterModels.findByIdAndUpdate(id, { isDeleted: false });
    const transporter = await TransporterModels.findById(id);
    if (!transporter) {
      return res.status(404).json({
        success: false,
        message: "Transporter not found",
      });
    }
    res.status(200).json({
      success: true,
      message: "Transporter Restored Successfully",
      transporter,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};