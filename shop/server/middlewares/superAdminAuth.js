const jwt = require("jsonwebtoken");

const superAdminAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
    
    if (decoded.Role !== "Super Admin") {
      return res.status(403).json({ message: "Forbidden: Super Admin access required" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.error("Super Admin Auth Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

module.exports = superAdminAuth;
