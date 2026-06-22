const cloudinary = require("../utils/cloudinary/cloudinary");
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder },
            (error, result) => {
                if (error) reject(error);
                else resolve({
                    url: result.secure_url,
                    public_id: result.public_id,
                });
            }
        );
        stream.end(buffer);
    });
};

const deleteFromCloudinary = async (public_id) => {
    if (!public_id) return;

    try {
        await cloudinary.uploader.destroy(public_id);
    } catch (_) { }
};

exports.addVehicle = async (req, res, next) => {
    try {
        const { Vehicle: VehicleModel } = await getAutoModels(req);

        const {
            vehicleType,
            vehicleNumber,
            capacity,
            insuranceExpiry,
            lastServiceDate,
            assignDriver,
            assignTransporter,
        } = req.body;

        // duplicate check
        const existingVehicle = await VehicleModel.findOne({
            vehicleNumber: {
                $regex: new RegExp("^" + vehicleNumber + "$", "i"),
            },
        });

        if (existingVehicle) {
            return res.status(400).json({
                message: "Vehicle Number already exists",
            });
        }

        let vehicleImage = [];
        let polutionPaper = [];
        let ownerCard = [];

        // vehicle image
        if (req.files?.vehicleImage?.[0]) {
            const uploaded = await uploadToCloudinary(
                req.files.vehicleImage[0].buffer,
                "vehicle_documents/vehicle"
            );

            vehicleImage = [uploaded];
        }

        // pollution paper
        if (req.files?.polutionPaper?.[0]) {
            const uploaded = await uploadToCloudinary(
                req.files.polutionPaper[0].buffer,
                "vehicle_documents/polution"
            );

            polutionPaper = [uploaded];
        }

        // owner card
        if (req.files?.ownerCard?.[0]) {
            const uploaded = await uploadToCloudinary(
                req.files.ownerCard[0].buffer,
                "vehicle_documents/owner"
            );

            ownerCard = [uploaded];
        }

        const vehicle = new VehicleModel({
            vehicleType,
            vehicleNumber,
            capacity,
            insuranceExpiry,
            lastServiceDate,
            assignDriver,
            assignTransporter,
            vehicleImage,
            polutionPaper,
            ownerCard,
            isDeleted: false,
        });

        await vehicle.save();
        await vehicle.populate("assignDriver");
        await vehicle.populate("assignTransporter");

        res.status(201).json({
            message: "Vehicle created successfully",
            vehicle,
        });

    } catch (error) {
        return next(error);
    }
};

exports.getVehicle = async (req, res, next) => {
    try {
        const { Vehicle: VehicleModel } = await getAutoModels(req);
        const vehicle = await VehicleModel.find()
            .populate("assignDriver")
            .populate("assignTransporter");

        res.status(200).json({
            message: "Vehicles fetched successfully",
            vehicle,
        });
    } catch (error) {
        return next(error);
    }
}

exports.deleteVehicle = async (req, res, next) => {
    try {
        const { Vehicle: VehicleModel } = await getAutoModels(req);
        const vehicle = await VehicleModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }
        res.status(200).json({
            message: "Vehicle deleted successfully",
            vehicle,
        });
    } catch (error) {
        return next(error);
    }
}

exports.updateVehicle = async (req, res, next) => {
    try {
        const { Vehicle: VehicleModel } = await getAutoModels(req);

        const { id } = req.params;

        const {
            vehicleType,
            vehicleNumber,
            capacity,
            insuranceExpiry,
            lastServiceDate,
            assignDriver,
            assignTransporter,
            removeVehicleImage,
            removePolutionPaper,
            removeOwnerCard,
        } = req.body;

        // duplicate check
        if (vehicleNumber !== undefined) {
            const duplicate = await VehicleModel.findOne({
                vehicleNumber: {
                    $regex: new RegExp("^" + vehicleNumber + "$", "i"),
                },
                _id: { $ne: id },
            });

            if (duplicate) {
                return res.status(400).json({
                    message: "Vehicle Number already exists",
                });
            }
        }

        // existing vehicle
        const existingVehicle = await VehicleModel.findById(id);

        if (!existingVehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
            });
        }

        let vehicleImage = existingVehicle.vehicleImage || [];
        let polutionPaper = existingVehicle.polutionPaper || [];
        let ownerCard = existingVehicle.ownerCard || [];

        if (req.files?.vehicleImage?.[0]) {

            if (existingVehicle.vehicleImage?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingVehicle.vehicleImage[0].public_id
                );
            }

            const uploaded = await uploadToCloudinary(
                req.files.vehicleImage[0].buffer,
                "vehicle_documents/vehicle"
            );

            vehicleImage = [uploaded];

        } else if (removeVehicleImage === "true") {

            if (existingVehicle.vehicleImage?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingVehicle.vehicleImage[0].public_id
                );
            }

            vehicleImage = [];
        }

        if (req.files?.polutionPaper?.[0]) {

            if (existingVehicle.polutionPaper?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingVehicle.polutionPaper[0].public_id
                );
            }

            const uploaded = await uploadToCloudinary(
                req.files.polutionPaper[0].buffer,
                "vehicle_documents/polution"
            );

            polutionPaper = [uploaded];

        } else if (removePolutionPaper === "true") {

            if (existingVehicle.polutionPaper?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingVehicle.polutionPaper[0].public_id
                );
            }

            polutionPaper = [];
        }

        if (req.files?.ownerCard?.[0]) {

            if (existingVehicle.ownerCard?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingVehicle.ownerCard[0].public_id
                );
            }

            const uploaded = await uploadToCloudinary(
                req.files.ownerCard[0].buffer,
                "vehicle_documents/owner"
            );

            ownerCard = [uploaded];

        } else if (removeOwnerCard === "true") {

            if (existingVehicle.ownerCard?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingVehicle.ownerCard[0].public_id
                );
            }

            ownerCard = [];
        }

        const updateData = {};

        if (vehicleType !== undefined)
            updateData.vehicleType = vehicleType;

        if (vehicleNumber !== undefined)
            updateData.vehicleNumber = vehicleNumber;

        if (capacity !== undefined)
            updateData.capacity = capacity;

        if (insuranceExpiry !== undefined)
            updateData.insuranceExpiry = insuranceExpiry;

        if (lastServiceDate !== undefined)
            updateData.lastServiceDate = lastServiceDate;

        if (assignDriver)
            updateData.assignDriver = assignDriver;

        if (assignTransporter)
            updateData.assignTransporter = assignTransporter;

        // save updated image arrays
        updateData.vehicleImage = vehicleImage;
        updateData.polutionPaper = polutionPaper;
        updateData.ownerCard = ownerCard;

        const vehicle = await VehicleModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("assignDriver")
            .populate("assignTransporter");

        if (!vehicle) {
            return res.status(404).json({
                message: "Vehicle not found",
            });
        }

        res.status(200).json({
            message: "Vehicle updated successfully",
            vehicle,
        });

    } catch (error) {
        return next(error);
    }
};

exports.getActiveVehicle = async (req, res, next) => {
    try {
        const { Vehicle: VehicleModel } = await getAutoModels(req);
        const vehicle = await VehicleModel.find({ isDeleted: false }).populate("assignDriver").populate("assignTransporter");
        res.status(200).json({
            message: "Active vehicles retrieved successfully",
            vehicle,
        });
    } catch (error) {
        return next(error);
    }
};

exports.getDeletedVehicle = async (req, res, next) => {
    try {
        const { Vehicle: VehicleModel } = await getAutoModels(req);
        const vehicle = await VehicleModel.find({ isDeleted: true }).populate("assignDriver").populate("assignTransporter");
        res.status(200).json({
            message: "Deleted vehicles retrieved successfully",
            vehicle,
        });
    } catch (error) {
        return next(error);
    }
};

exports.restoreVehicle = async (req, res, next) => {
    try {
        const { Vehicle: VehicleModel } = await getAutoModels(req);
        const vehicle = await VehicleModel.findByIdAndUpdate(req.params.id, { isDeleted: false });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }
        res.status(200).json({
            message: "Vehicle restored successfully",
            vehicle,
        });
    } catch (error) {
        return next(error);
    }
};