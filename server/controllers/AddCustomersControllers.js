const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

const createcustomers = async (req, res, next)=>{
    try {
        const {Customer: CustomersModel} = await getAutoModels(req);
        const newCustomer = new CustomersModel(req.body);
        await newCustomer.save();
        res.status(201).json(newCustomer);
        
    } catch (err) {
        next(err); // Pass error to global error handler
        res.status(400).json({Error : err.message});
    }
};

const getCustomers = async (req, res, next) =>{
    try {
        const {Customer: CustomersModel} = await getAutoModels(req);
        const customer = await  CustomersModel.find();
        res.status(200).json(customer);
    } catch (err) {
        next(err);
        res.status(500).json({Error :  err.message});
    }
}

module.exports = {createcustomers , getCustomers};