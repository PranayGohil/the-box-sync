const errorHandler = (err, req, res, next) => {
  console.error("🔥 Global Error Handler Caught:", err);

  // Default error format
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";

  // Handle specific MongoDB/Mongoose errors safely without leaking internal structure
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      error: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate field value entered",
      error: Object.keys(err.keyValue).map((key) => `${key} already exists`),
    });
  }

  // Handle JWT errors globally
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please log in again.",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Your token has expired. Please log in again.",
    });
  }

  // Standard response for all other unhandled errors
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal Server Error" : message,
    // Only send the stack trace if we are strictly not in production
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
