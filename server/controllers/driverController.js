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
                    public_id: result.public_id
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
    } catch (_) { /* silent */ }
};

exports.addDriver = async (req, res, next) => {
    try {
        const { Driver: DriverModel } = await getAutoModels(req);
        const {
            driverName,
            phoneNumber,
            licenceNumber,
            vehicleId,
            licenceExpiry,
            joiningDate,
            transporterId,
            advance,
            creditDay,
            bankName,
            accountNumber,
            accountHolderName,
            accountType,
            ifscCode,
            branch,
        } = req.body;

        // check if there is any existing vehicle with the same number
        const existingDriver = await DriverModel.findOne({
            licenceNumber: { $regex: new RegExp("^" + licenceNumber + "$", "i") },
        });
        if (existingDriver) {
            return res.status(400).json({ message: "License Number already exists" });
        }

        let aadhaarCard = [];
        let panCard = [];
        let licenseCard = [];

        if (req.files?.aadhaarCard?.[0]) {
            const uploaded = await uploadToCloudinary(req.files.aadhaarCard[0].buffer, "driver_documents/aadhaar");
            aadhaarCard = [uploaded];
        }
        if (req.files?.panCard?.[0]) {
            const uploaded = await uploadToCloudinary(req.files.panCard[0].buffer, "driver_documents/pan");
            panCard = [uploaded];
        }
        if (req.files?.licenseCard?.[0]) {
            const uploaded = await uploadToCloudinary(req.files.licenseCard[0].buffer, "driver_documents/license");
            licenseCard = [uploaded];
        }

        // create new vehicle
        const driver = new DriverModel({
            driverName,
            phoneNumber,
            licenceNumber,
            vehicleId,
            licenceExpiry,
            joiningDate,
            transporterId,
            advance,
            creditDay,
            bankName,
            accountNumber,
            accountHolderName,
            accountType,
            ifscCode,
            branch,
            aadhaarCard,
            panCard,
            licenseCard,
            isDeleted: false,
        });

        await driver.save();
        await driver.populate("vehicleId");

        res.status(201).json({
            message: "Driver created successfully",
            driver,
        });

    } catch (error) {
        return next(error);
    }
}

exports.getDriver = async (req, res, next) => {
    try {
        const { Driver: DriverModel } = await getAutoModels(req);
        const driver = await DriverModel.find()
        .populate("vehicleId");

        res.status(200).json({
            message: "Drivers fetched successfully",
            driver,
        });
    } catch (error) {
        return next(error);
    }
}

exports.deleteDriver = async (req, res, next) => {
    try {
        const { Driver: DriverModel } = await getAutoModels(req);
        const driver = await DriverModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }

        const allFiles = [
            ...(driver.aadhaarCard || []),
            ...(driver.panCard || []),
            ...(driver.licenseCard || []),
        ];

        await Promise.all(allFiles.map(f => deleteFromCloudinary(f?.public_id)));

        res.status(200).json({
            message: "Driver deleted successfully",
            driver,
        });
    } catch (error) {
        return next(error);
    }
}

exports.updateDriver = async (req, res, next) => {
    try {
        const { Driver: DriverModel } = await getAutoModels(req);
        const { id } = req.params;

        const {
            driverName,
            phoneNumber,
            vehicleId,
            licenceNumber,
            licenceExpiry,
            joiningDate,
            transporterId,
            advance,
            creditDay,
            bankName,
            accountNumber,
            accountHolderName,
            accountType,
            ifscCode,
            branch,
            removeAadhaarCard,
            removePanCard,
            removeLicenseCard,
        } = req.body;

        // Check duplicate licence number
        if (licenceNumber !== undefined) {
            const duplicate = await DriverModel.findOne({
                licenceNumber: {
                    $regex: new RegExp("^" + licenceNumber + "$", "i"),
                },
                _id: { $ne: id },
            });

            if (duplicate) {
                return res
                    .status(400)
                    .json({ message: "License Number already exists" });
            }
        }

        // Existing driver
        const existingDriver = await DriverModel.findById(id);

        if (!existingDriver) {
            return res.status(404).json({
                message: "Driver not found",
            });
        }

        // Existing file arrays
        let aadhaarCard = existingDriver.aadhaarCard || [];
        let panCard = existingDriver.panCard || [];
        let licenseCard = existingDriver.licenseCard || [];

        if (req.files?.aadhaarCard?.[0]) {
            // delete old file
            if (existingDriver.aadhaarCard?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingDriver.aadhaarCard[0].public_id
                );
            }

            // upload new file
            const uploaded = await uploadToCloudinary(
                req.files.aadhaarCard[0].buffer,
                "driver_documents/aadhaar"
            );

            aadhaarCard = [uploaded];

        } else if (removeAadhaarCard === "true") {

            // remove existing
            if (existingDriver.aadhaarCard?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingDriver.aadhaarCard[0].public_id
                );
            }

            aadhaarCard = [];
        }

        if (req.files?.panCard?.[0]) {

            if (existingDriver.panCard?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingDriver.panCard[0].public_id
                );
            }

            const uploaded = await uploadToCloudinary(
                req.files.panCard[0].buffer,
                "driver_documents/pan"
            );

            panCard = [uploaded];

        } else if (removePanCard === "true") {

            if (existingDriver.panCard?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingDriver.panCard[0].public_id
                );
            }

            panCard = [];
        }

        if (req.files?.licenseCard?.[0]) {

            if (existingDriver.licenseCard?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingDriver.licenseCard[0].public_id
                );
            }

            const uploaded = await uploadToCloudinary(
                req.files.licenseCard[0].buffer,
                "driver_documents/license"
            );

            licenseCard = [uploaded];

        } else if (removeLicenseCard === "true") {

            if (existingDriver.licenseCard?.[0]?.public_id) {
                await deleteFromCloudinary(
                    existingDriver.licenseCard[0].public_id
                );
            }

            licenseCard = [];
        }

        const updateData = {};

        if (driverName !== undefined)
            updateData.driverName = driverName;

        if (phoneNumber !== undefined)
            updateData.phoneNumber = phoneNumber;

        if (licenceNumber !== undefined)
            updateData.licenceNumber = licenceNumber;

        if (licenceExpiry !== undefined)
            updateData.licenceExpiry = licenceExpiry;

        if (joiningDate !== undefined)
            updateData.joiningDate = joiningDate;

        if (advance !== undefined)
            updateData.advance = advance;

        if (creditDay !== undefined)
            updateData.creditDay = creditDay;

        if (bankName !== undefined)
            updateData.bankName = bankName;

        if (accountNumber !== undefined)
            updateData.accountNumber = accountNumber;

        if (accountHolderName !== undefined)
            updateData.accountHolderName = accountHolderName;

        if (accountType !== undefined)
            updateData.accountType = accountType;

        if (ifscCode !== undefined)
            updateData.ifscCode = ifscCode;

        if (branch !== undefined)
            updateData.branch = branch;

        // save updated image arrays
        updateData.aadhaarCard = aadhaarCard;
        updateData.panCard = panCard;
        updateData.licenseCard = licenseCard;

        // ObjectId fields
        if (vehicleId) {
            updateData.vehicleId = vehicleId;
        }

        if (transporterId) {
            updateData.transporterId = transporterId;
        }

        // Update driver
        const driver = await DriverModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        ).populate("vehicleId");

        if (!driver) {
            return res.status(404).json({
                message: "Driver not found",
            });
        }

        res.status(200).json({
            message: "Driver updated successfully",
            driver,
        });

    } catch (error) {
        return next(error);
    }
};

exports.getActiveDriver = async (req, res, next) => {
    try {
        const { Driver: DriverModel } = await getAutoModels(req);
        const driver = await DriverModel.find({ isDeleted: false }).populate("vehicleId");
        res.status(200).json({
            message: "Active drivers retrieved successfully",
            driver,
        });
    } catch (error) {
        return next(error);
    }
};

exports.getDeletedDriver = async (req, res, next) => {
    try {
        const { Driver: DriverModel } = await getAutoModels(req);
        const driver = await DriverModel.find({ isDeleted: true }).populate("vehicleId");
        res.status(200).json({
            message: "Deleted drivers retrieved successfully",
            driver,
        });
    } catch (error) {
        return next(error);
    }
};

exports.restoreDriver = async (req, res, next) => {
    try {
        const { Driver: DriverModel } = await getAutoModels(req);
        const driver = await DriverModel.findByIdAndUpdate(req.params.id, { isDeleted: false });
        if (!driver) {
            return res.status(404).json({ message: "Driver not found" });
        }
        res.status(200).json({
            message: "Driver restored successfully",
            driver,
        });
    } catch (error) {
        return next(error);
    }
};