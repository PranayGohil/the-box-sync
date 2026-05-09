const jwt = require("jsonwebtoken");
const Subscription = require("../models/subscriptionModel");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token is missing or invalid format" });
    }

    const token = authHeader.split(" ")[1];
    const user = jwt.verify(token, process.env.JWT_SECRETKEY);
    req.user = user;
    
    // Subscription Check for Non-Admin Panels
    if (user.Role && user.Role !== "Admin" && user.Role !== "Super Admin") {
      const activeSubscription = await Subscription.findOne({
        user_id: user._id,
        plan_name: user.Role,
        status: "active",
        end_date: { $gt: new Date() }
      }).lean();

      if (!activeSubscription) {
        return res.status(403).json({ 
          message: `Your subscription for ${user.Role} has expired or been blocked. Please contact your restaurant admin.` 
        });
      }
    }
    
    next();
  } catch (error) {
    console.error("Authentication Error:", error.message);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token has expired" });
    }
    return res.status(401).json({ message: "Invalid or unauthorized token" });
  }
};

module.exports = authMiddleware;
