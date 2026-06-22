const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

// Create a new variant
const createVariant = async (req, res) => {
    try {
        const { Variant } = await getAutoModels(req);
        const newVarient = new Variant(req.body);
        await newVarient.save();
        res.status(201).json(newVarient);
    } catch (err) {
        res.status(400).json({ Error: err.message });
    }
};

// Get all variants
const getVariant = async (req, res) => {
    try {
        const { Variant } = await getAutoModels(req);
        const variants = await Variant.find();
        res.status(200).json(variants);
    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
};

// Update a variant
const updateVariant = async (req, res) => {
    try {
        const { Variant: VarientModel } = await getAutoModels(req);
        const id = req.params.id;
        const updatedVarient = await VarientModel.findByIdAndUpdate(id, req.body, { new: true });
        res.status(200).json(updatedVarient);
    } catch (err) {
        res.status(400).json({ Error: err.message });
    }
};

// Delete a variant
const deleteVariant = async (req, res) => {
    try {
        const { Variant: VarientModel } = await getAutoModels(req);
        const { id } = req.params;
        const deletedVarient = await VarientModel.findByIdAndDelete(id);
        if (!deletedVarient) {
            return res.status(404).json({ error: 'Variant not found' });
        }
        res.status(200).json({ message: 'Variant deleted successfully', data: deletedVarient });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete variant', details: err.message });
    }
};

// Get all unique variants with status:true
const getActiveVariants = async (req, res) => {
    try {
        const { Variant: VarientModel } = await getAutoModels(req);
        const variants = await VarientModel.find({ status: true }).distinct('variant');
        res.status(200).json(variants);
    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
};

// Get all values for a selected variant with status:true
const getValuesByVariant = async (req, res) => {
    try {
        const { Variant: VarientModel } = await getAutoModels(req);
        const { variant } = req.params;
        const values = await VarientModel.find({ status: true, variant }).select('value -_id');
        res.status(200).json(values.map(v => v.value));
    } catch (err) {
        res.status(500).json({ Error: err.message });
    }
};

module.exports = { createVariant, getVariant, updateVariant, deleteVariant, getActiveVariants, getValuesByVariant };