const ApiError = require("../utils/ApiError");

const isValidObjectId = (value) =>
  typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);

const toPositiveInt = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return null;
  return n;
};

const validateProductsListQuery = (req, res, next) => {
  const { page, limit, category, subcategory, hsn, brand } = req.query || {};

  if (page !== undefined) {
    const p = toPositiveInt(page);
    if (!p) {
      return next(ApiError.badRequest("Invalid page. Must be a positive integer.", { page }));
    }
  }

  if (limit !== undefined) {
    const l = toPositiveInt(limit);
    if (!l) {
      return next(ApiError.badRequest("Invalid limit. Must be a positive integer.", { limit }));
    }
    if (l > 1000) {
      return next(ApiError.badRequest("Invalid limit. Max allowed is 1000.", { limit }));
    }
  }

  if (category !== undefined && !isValidObjectId(String(category))) {
    return next(ApiError.badRequest("Invalid category id.", { category }));
  }
  if (subcategory !== undefined && !isValidObjectId(String(subcategory))) {
    return next(ApiError.badRequest("Invalid subcategory id.", { subcategory }));
  }
  if (hsn !== undefined && !isValidObjectId(String(hsn))) {
    return next(ApiError.badRequest("Invalid hsn id.", { hsn }));
  }
  if (brand !== undefined && !isValidObjectId(String(brand))) {
    return next(ApiError.badRequest("Invalid brand id.", { brand }));
  }

  void res;
  return next();
};

module.exports = validateProductsListQuery;
