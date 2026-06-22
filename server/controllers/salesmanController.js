const cloudinary = require("../utils/cloudinary/cloudinary");
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

const validateSalesmanImage = (file) => {
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

exports.addSalesman = async (req, res, next) => {
    try {
        const { Salesman: SalesmanModel, Broker: BrokerModel } = await getAutoModels(req);
        const {
            salesmanName, phoneNumber, email, brokerId,
            gstin, address, country, state, city, pincode
        } = req.body;

        const existingSalesman = await SalesmanModel.findOne({
            phoneNumber: { $regex: new RegExp("^" + phoneNumber + "$", "i") },
        });
        if (existingSalesman) {
            return res.status(400).json({ message: "Salesman Phone Number already exists" });
        }

        let salesmanImage = [];
        if (req.files?.salesmanImage?.[0]) {
            const uploaded = await uploadToCloudinary(req.files.salesmanImage[0].buffer, "salesman_documents/image");
            salesmanImage = [uploaded];
        }

        if (req.files?.salesmanImage?.[0]) {
            const imageError = validateSalesmanImage(req.files.salesmanImage[0]);
            if (imageError) {
                return res.status(400).json({ message: imageError, displayMessage: imageError });
            }
        }

        const salesman = new SalesmanModel({
            salesmanName, phoneNumber, email,
            brokerId: brokerId || null,
            salesmanImage,
            isDeleted: false,
            gstin, address, country, state, city, pincode,
            isAssigned: !!brokerId,
        });

        await salesman.save();

        // ✅ Push salesman into broker's assignSalesman array
        if (brokerId) {
            await BrokerModel.findByIdAndUpdate(
                brokerId,
                { $addToSet: { assignSalesman: salesman._id } }
            );
        }

        await salesman.populate("brokerId");

        res.status(201).json({ message: "Salesman created successfully", salesman });
    } catch (error) {
        return next(error);
    }
};

exports.getSalesman = async (req, res, next) => {
    try {
        const { Salesman: SalesmanModel } = await getAutoModels(req);
        const salesman = await SalesmanModel.find()
            .populate("brokerId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Salesmen fetched successfully",
            salesman,
        });
    } catch (error) {
        return next(error);
    }
}

exports.deleteSalesman = async (req, res, next) => {
    try {
        const { Salesman: SalesmanModel, Broker: BrokerModel } = await getAutoModels(req);
        const salesman = await SalesmanModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
        if (!salesman) {
            return res.status(404).json({ message: "Salesman not found" });
        }

        // ✅ Remove from broker's assignSalesman array
        if (salesman.brokerId) {
            await BrokerModel.findByIdAndUpdate(
                salesman.brokerId,
                { $pull: { assignSalesman: salesman._id } }
            );
        }

        const allFiles = [...(salesman.salesmanImage || [])];
        await Promise.all(allFiles.map(f => deleteFromCloudinary(f?.public_id)));

        res.status(200).json({ message: "Salesman deleted successfully", salesman });
    } catch (error) {
        return next(error);
    }
};

exports.updateSalesman = async (req, res, next) => {
    try {
        const { Salesman: SalesmanModel, Broker: BrokerModel } = await getAutoModels(req);
        const { id } = req.params;

        const {
            salesmanName, phoneNumber, email, brokerId,
            gstin, address, country, state, city, pincode, removeSalesmanImage,
        } = req.body;

        if (phoneNumber !== undefined) {
            const duplicate = await SalesmanModel.findOne({
                phoneNumber: { $regex: new RegExp("^" + phoneNumber + "$", "i") },
                _id: { $ne: id },
            });
            if (duplicate) {
                return res.status(400).json({ message: "Salesman Phone Number already exists" });
            }
        }

        const existingSalesman = await SalesmanModel.findById(id);
        if (!existingSalesman) {
            return res.status(404).json({ message: "Salesman not found" });
        }

        if (brokerId !== undefined) {
            const oldBrokerId = existingSalesman.brokerId?.toString();
            const newBrokerId = brokerId || null;

            // Remove from old broker if broker changed
            if (oldBrokerId && oldBrokerId !== newBrokerId) {
                await BrokerModel.findByIdAndUpdate(
                    oldBrokerId,
                    { $pull: { assignSalesman: id } }
                );
            }

            // Add to new broker
            if (newBrokerId && oldBrokerId !== newBrokerId) {
                await BrokerModel.findByIdAndUpdate(
                    newBrokerId,
                    { $addToSet: { assignSalesman: id } }
                );
            }
        }

        // Image handling (unchanged)
        let salesmanImage = existingSalesman.salesmanImage || [];

        if (req.files?.salesmanImage?.[0]) {
            const imageError = validateSalesmanImage(req.files.salesmanImage[0]);
            if (imageError) {
                return res.status(400).json({ message: imageError, displayMessage: imageError });
            }
        }

        if (req.files?.salesmanImage?.[0]) {
            if (existingSalesman.salesmanImage?.[0]?.public_id) {
                await deleteFromCloudinary(existingSalesman.salesmanImage[0].public_id);
            }
            const uploaded = await uploadToCloudinary(
                req.files.salesmanImage[0].buffer, "salesman_documents/image"
            );
            salesmanImage = [uploaded];
        } else if (removeSalesmanImage === "true") {
            if (existingSalesman.salesmanImage?.[0]?.public_id) {
                await deleteFromCloudinary(existingSalesman.salesmanImage[0].public_id);
            }
            salesmanImage = [];
        }

        const updateData = {};
        if (salesmanName !== undefined) updateData.salesmanName = salesmanName;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (email !== undefined) updateData.email = email;
        if (gstin !== undefined) updateData.gstin = gstin;
        if (address !== undefined) updateData.address = address;
        if (country !== undefined) updateData.country = country;
        if (state !== undefined) updateData.state = state;
        if (city !== undefined) updateData.city = city;
        if (pincode !== undefined) updateData.pincode = pincode;
        updateData.salesmanImage = salesmanImage;
        if (brokerId !== undefined) {
            updateData.brokerId = brokerId || null;
            updateData.isAssigned = !!brokerId;
        }

        const salesman = await SalesmanModel.findByIdAndUpdate(
            id, { $set: updateData }, { new: true, runValidators: true }
        ).populate("brokerId");

        if (!salesman) {
            return res.status(404).json({ message: "Salesman not found" });
        }

        res.status(200).json({ message: "Salesman updated successfully", salesman });
    } catch (error) {
        return next(error);
    }
};

exports.getActiveSalesman = async (req, res) => {
    try {
        const { Salesman: SalesmanModel } = await getAutoModels(req);
        const salesman = await SalesmanModel.find({ isDeleted: false })
            .populate("brokerId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Salesmen fetched successfully",
            salesman,  // ✅ matches res.data.salesman in frontend
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getDeletedSalesman = async (req, res) => {
    try {
        const { Salesman: SalesmanModel } = await getAutoModels(req);
        const salesman = await SalesmanModel.find({ isDeleted: true }).sort({
            createdAt: -1,
        });
        res.status(200).json({ salesman });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.restoreSalesman = async (req, res) => {
    try {
        const { Salesman: SalesmanModel } = await getAutoModels(req);
        const updated = await SalesmanModel.findByIdAndUpdate(
            req.params.id,
            { isDeleted: false },
            { new: true }
        );
        if (!updated) return res.status(404).json({ error: "Salesman not found" });
        res.status(200).json({ message: "Salesman restored successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};