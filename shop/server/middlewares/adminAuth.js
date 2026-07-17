const adminAuth = (req, res, next) => {
  try {
    if (!req.user || req.user.Role !== "Admin") {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  } catch (error) {
    console.error("Admin Auth Error:", error);
    return res.status(500).json({ message: "Internal server error during authorization" });
  }
};

module.exports = adminAuth;
