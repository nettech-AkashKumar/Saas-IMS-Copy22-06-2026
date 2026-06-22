class ApiError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, "BAD_REQUEST", message || "Bad Request", details);
  }

  static unauthorized(message, details) {
    return new ApiError(401, "UNAUTHORIZED", message || "Unauthorized", details);
  }

  static forbidden(message, details) {
    return new ApiError(403, "FORBIDDEN", message || "Forbidden", details);
  }

  static notFound(message, details) {
    return new ApiError(404, "NOT_FOUND", message || "Not Found", details);
  }

  static conflict(message, details) {
    return new ApiError(409, "CONFLICT", message || "Conflict", details);
  }

  static internal(message, details) {
    return new ApiError(500, "INTERNAL_ERROR", message || "Server Error", details);
  }
}

module.exports = ApiError;
