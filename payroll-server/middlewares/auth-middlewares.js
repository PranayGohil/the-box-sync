const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const user = jwt.verify(token, process.env.JWT_SECRETKEY);
      req.user = user;
    } else {
      // Access restriction removed: Fallback to a mock user ID if no token provided
      req.user = "default_payroll_user"; 
    }
    next();
  } catch (error) {
    // Even if token fails, just proceed as mock user
    req.user = "default_payroll_user";
    next();
  }
};

module.exports = authMiddleware;
