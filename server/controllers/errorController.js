const ApiError = require("../utils/ApiError");

const errorPing = (req, res) => {
  res.status(200).json({
    success: true,
    message: "OK",
    timestamp: new Date().toISOString(),
  });
};

const notFound = (req, res, next) => {
  next(
    ApiError.notFound("Route not found", {
      method: req.method,
      path: req.originalUrl,
    }),
  );
};

const errorHandler = (err, req, res, next) => {
  let statusCode = Number(err && err.statusCode) || 500;
  let code = (err && err.code) || (statusCode === 500 ? "INTERNAL_ERROR" : "ERROR");
  let message =
    (err && err.message) ||
    (statusCode === 404 ? "Not Found" : "Something went wrong");

  if (err && err.name === "ValidationError") {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    const firstKey = err.errors ? Object.keys(err.errors)[0] : null;
    message = firstKey && err.errors[firstKey] && err.errors[firstKey].message
      ? err.errors[firstKey].message
      : "Validation failed";
  } else if (err && err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = "Invalid value provided";
    if (err.path) message = `Invalid ${err.path}`;
  } else if (err && err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    const keys = err.keyValue ? Object.keys(err.keyValue) : [];
    message = keys.length ? `Duplicate value for ${keys.join(", ")}` : "Duplicate value";
  } else if (err && err.name === "MulterError") {
    statusCode = 400;
    code = "UPLOAD_ERROR";
    message = err.message || "File upload error";
  } else if (err && err.type === "entity.parse.failed") {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Invalid JSON payload";
  }

  const payload = {
    success: false,
    code,
    message,
    displayMessage: code ? `${code}: ${message}` : message,
  };

  res.status(statusCode).json(payload);
  void next;
};

module.exports = {
  errorPing,
  notFound,
  errorHandler,
};
