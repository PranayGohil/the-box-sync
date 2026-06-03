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
    if (user.Role && user.Role !== "Admin" && user.Role !== "Super Admin" && user.Role !== "Staff") {
      let planQuery = user.Role;
      if (user.Role === "Manager") {
        planQuery = { $in: ["Manager", "QSR"] };
      }

      let hasAccess = false;
      const activeSubscription = await Subscription.findOne({
        user_id: user._id,
        plan_name: planQuery,
        status: "active",
        end_date: { $gt: new Date() }
      }).lean();

      if (activeSubscription) {
        hasAccess = true;
      }

      // Check implicit access based on purchased base plan
      const User = require("../models/userModel");
      const dbUser = await User.findById(user._id).select("purchasedPlan").lean();
      const tier = dbUser?.purchasedPlan;
      
      if (tier && !hasAccess) {
        const fineDineFeats = ['Manager', 'Captain Panel', 'KOT Panel', 'Kitchen Display System', 'Reservation Manager', 'Table Management', 'Scan For Menu', 'Feedback', 'Waiter Calling System', 'Dynamic Reports', 'Whatsapp-Invoice', 'Restaurant Website', 'Create Cashier'];
        const chainFeats = ['Manager', 'QSR', 'Captain Panel', 'KOT Panel', 'Kitchen Display System', 'Reservation Manager', 'Table Management', 'Token Management', 'Scan For Menu', 'Feedback', 'Waiter Calling System', 'Dynamic Reports', 'Whatsapp-Invoice', 'Restaurant Website', 'Payroll By The Box', 'Create Cashier'];
        
        if (tier === 'Fine Dine' && fineDineFeats.includes(user.Role)) hasAccess = true;
        if (tier === 'Chain' && chainFeats.includes(user.Role)) hasAccess = true;
        if ((tier === 'QSR' || tier === 'Café' || tier === 'Cloud') && ['QSR'].includes(user.Role)) hasAccess = true;
      }

      if (!hasAccess) {
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
