const cloudinary = require("../utils/cloudinary/cloudinary");
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

const validateBrokerImage = (file) => {
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    const maxSizeBytes = 1 * 1024 * 1024; // 1MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return "Only JPEG and PNG images are allowed.";
    }
    if (file.size > maxSizeBytes) {
        return "Image size must be less than 1MB.";
    }
    return null; // no error
};

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

exports.addBroker = async (req, res, next) => {
    try {
        const { Broker: BrokerModel, Salesman: SalesmanModel } = await getAutoModels(req);

        const {
            comissionType,
            brokerName,
            phoneNumber,
            email,
            gstin,
            address,
            country,
            state,
            city,
            pincode,
        } = req.body;

        const rawSalesman = req.body["assignSalesman[]"] || req.body.assignSalesman || [];
        const assignSalesman = Array.isArray(rawSalesman) ? rawSalesman : [rawSalesman].filter(Boolean);

        // duplicate phone check
        const existingBroker = await BrokerModel.findOne({
            phoneNumber: { $regex: new RegExp("^" + phoneNumber + "$", "i") },
        });
        if (existingBroker) {
            return res.status(400).json({ message: "Broker Phone Number already exists" });
        }

        // duplicate email check
        const existingBrokerEmail = await BrokerModel.findOne({
            email: { $regex: new RegExp("^" + email + "$", "i") },
        });
        if (existingBrokerEmail) {
            return res.status(400).json({ message: "Broker Email Id already exists" });
        }

        let brokerImage = [];

        if (req.files?.brokerImage?.[0]) {
            const uploaded = await uploadToCloudinary(
                req.files.brokerImage[0].buffer,
                "broker_documents/broker"
            );
            brokerImage = [uploaded];
        }

        if (req.files?.brokerImage?.[0]) {
            const imageError = validateBrokerImage(req.files.brokerImage[0]);
            if (imageError) {
                return res.status(400).json({ message: imageError, displayMessage: imageError });
            }
        }

        // ── CREATE broker first ──────────────────────────────────────
        const broker = new BrokerModel({
            comissionType,
            brokerName,
            phoneNumber,
            email,
            assignSalesman,
            brokerImage,
            gstin,
            address,
            country,
            state,
            city,
            pincode,
            isDeleted: false,
        });

        await broker.save();

        // ── THEN sync salesman (broker._id is now available) ─────────
        if (assignSalesman && assignSalesman.length > 0) {
            const salesmanIds = Array.isArray(assignSalesman) ? assignSalesman : [assignSalesman];
            await SalesmanModel.updateMany(
                { brokerId: broker._id },
                { $set: { brokerId: null, isAssigned: false } }
            );
            await SalesmanModel.updateMany(
                { _id: { $in: salesmanIds } },
                { $set: { brokerId: broker._id, isAssigned: true } }
            );
        }

        await broker.populate("assignSalesman");

        res.status(201).json({
            message: "Broker created successfully",
            broker,
        });

    } catch (error) {
        return next(error);
    }
};

exports.getBroker = async (req, res, next) => {
    try {
        const { Broker: BrokerModel } = await getAutoModels(req);
        const broker = await BrokerModel.find()
            .populate("assignSalesman")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Brokers fetched successfully",
            broker,
        });
    } catch (error) {
        return next(error);
    }
};

exports.deleteBroker = async (req, res, next) => {
    try {
        const { Broker: BrokerModel } = await getAutoModels(req);
        const broker = await BrokerModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
        if (!broker) {
            return res.status(404).json({ message: "Broker not found" });
        }
        res.status(200).json({
            message: "Broker deleted successfully",
            broker,
        });
    } catch (error) {
        return next(error);
    }
};

exports.updateBroker = async (req, res, next) => {
    try {
        const { Broker: BrokerModel, Salesman: SalesmanModel } = await getAutoModels(req);

        const { id } = req.params;

        const {
            comissionType,
            brokerName,
            phoneNumber,
            email,
            removeBrokerImage,
            gstin,
            address,
            country,
            state,
            city,
            pincode,
            isAssigned,
        } = req.body;

        const rawSalesman = req.body["assignSalesman[]"] || req.body.assignSalesman || [];
        const assignSalesman = Array.isArray(rawSalesman) ? rawSalesman : [rawSalesman].filter(Boolean);

        // ── duplicate phone check ────────────────────────────────────
        if (phoneNumber !== undefined) {
            const duplicate = await BrokerModel.findOne({
                phoneNumber: { $regex: new RegExp("^" + phoneNumber + "$", "i") },
                _id: { $ne: id },
            });
            if (duplicate) {
                return res.status(400).json({ message: "Broker Number already exists" });
            }
        }

        // ── fetch existing broker ────────────────────────────────────
        const existingBroker = await BrokerModel.findById(id);
        if (!existingBroker) {
            return res.status(404).json({ message: "Broker not found" });
        }

        // ── handle image upload/removal ──────────────────────────────
        let brokerImage = existingBroker.brokerImage || [];

        if (req.files?.brokerImage?.[0]) {
            const imageError = validateBrokerImage(req.files.brokerImage[0]);
            if (imageError) {
                return res.status(400).json({ message: imageError, displayMessage: imageError });
            }
        }

        if (req.files?.brokerImage?.[0]) {
            if (existingBroker.brokerImage?.[0]?.public_id) {
                await deleteFromCloudinary(existingBroker.brokerImage[0].public_id);
            }
            const uploaded = await uploadToCloudinary(
                req.files.brokerImage[0].buffer,
                "broker_documents/broker"
            );
            brokerImage = [uploaded];
        } else if (removeBrokerImage === "true") {
            if (existingBroker.brokerImage?.[0]?.public_id) {
                await deleteFromCloudinary(existingBroker.brokerImage[0].public_id);
            }
            brokerImage = [];
        }

        // ── build update payload ─────────────────────────────────────
        const updateData = {};

        if (comissionType !== undefined) updateData.comissionType = comissionType;
        if (brokerName !== undefined) updateData.brokerName = brokerName;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (email !== undefined) updateData.email = email;
        if (isAssigned !== undefined) updateData.isAssigned = isAssigned;
        if (gstin !== undefined) updateData.gstin = gstin;
        if (address !== undefined) updateData.address = address;
        if (pincode !== undefined) updateData.pincode = pincode;
        if (country !== undefined) updateData.country = country;
        if (state !== undefined) updateData.state = state;
        if (city !== undefined) updateData.city = city;
        updateData.brokerImage = brokerImage;

        // ── sync salesman (updateData is now declared) ───────────────
        const newSalesmanIds = assignSalesman.filter(Boolean);
        const oldSalesmanIds = (existingBroker.assignSalesman || []).map((s) => s.toString());

        // Unassign salesmen that were removed
        const removedIds = oldSalesmanIds.filter((old) => !newSalesmanIds.includes(old));
        if (removedIds.length > 0) {
            await SalesmanModel.updateMany(
                { _id: { $in: removedIds } },
                { $set: { brokerId: null, isAssigned: false } }
            );
        }

        // Assign newly added salesmen
        if (newSalesmanIds.length > 0) {
            await SalesmanModel.updateMany(
                { _id: { $in: newSalesmanIds } },
                { $set: { brokerId: id, isAssigned: true } }
            );
        }

        updateData.assignSalesman = newSalesmanIds; // ✅ updateData exists here

        // ── update broker ────────────────────────────────────────────
        const updatedBroker = await BrokerModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("assignSalesman");

        if (!updatedBroker) {
            return res.status(404).json({ message: "Broker not found" });
        }

        res.status(200).json({
            message: "Broker updated successfully",
            broker: updatedBroker,
        });

    } catch (error) {
        return next(error);
    }
};

exports.getActiveBrokers = async (req, res, next) => {
    try {
        const { Broker: BrokerModel } = await getAutoModels(req);
        const broker = await BrokerModel.find({ isDeleted: false })
            .populate("assignSalesman")
            .sort({ createdAt: -1 });  // ✅ add sort to match getBroker

        res.status(200).json({
            message: "Active brokers retrieved successfully",
            broker,  // ✅ was "brokers", frontend expects "broker"
        });
    } catch (error) {
        return next(error);
    }
};

exports.getDeletedBrokers = async (req, res, next) => {
    try {
        const { Broker: BrokerModel } = await getAutoModels(req);
        const broker = await BrokerModel.find({ isDeleted: true })
        .populate("assignSalesman")
        .sort({ createdAt: -1 });
        
        res.status(200).json({
            message: "Deleted brokers retrieved successfully",
            broker,
        });
    } catch (error) {
        return next(error);
    }
};

exports.restoreBroker = async (req, res, next) => {
    try {
        const { Broker: BrokerModel } = await getAutoModels(req);
        const id = req.params.id;
        const broker = await BrokerModel.findByIdAndUpdate(
            id,
            { $set: { isDeleted: false } },
            { new: true, runValidators: true }
        ).populate("assignSalesman");
        if (!broker) {
            return res.status(404).json({ message: "Broker not found" });
        }
        res.status(200).json({
            message: "Broker restored successfully",
            broker,
        });
    } catch (error) {
        return next(error);
    }
};
