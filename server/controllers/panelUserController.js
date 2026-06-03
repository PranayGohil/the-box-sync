const Manager = require("../models/managerModel");
const Kot = require("../models/kotModel");
const QSR = require("../models/QSRModel");
const Captain = require("../models/captainModel");
const HotelManager = require("../models/hotelManagerModel");
const User = require("../models/userModel");
const Subscription = require("../models/subscriptionModel");
const Cashier = require("../models/cashierModel");

const bcrypt = require("bcryptjs");

const panelModels = {
  Manager: Manager,
  QSR: Manager,
  "KOT Panel": Kot,
  "Captain Panel": Captain,
  "Hotel Manager": HotelManager,
  "Create Cashier": Cashier,
};

const getModel = (planName) => {
  const model = panelModels[planName];
  if (!model) throw new Error(`No model found for ${planName}`);
  return model;
};

exports.getPanelUser = async (req, res) => {
  try {
    const { planName } = req.params;
    const userId = req.user._id;

    const Model = getModel(planName);

    // For Cashier, return all accounts (multi-cashier support)
    if (planName === "Create Cashier") {
      const accounts = await Model.find({ user_id: userId }).lean();
      return res.status(200).json({ exists: accounts.length > 0, data: accounts });
    }

    const account = await Model.findOne({ user_id: userId });
    res.status(200).json({ exists: !!account, data: account });
  } catch (err) {
    console.error("Error in getPanelUser:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.createOrUpdatePanelUser = async (req, res) => {
  try {
    const { planName } = req.params;
    const userId = req.user._id;
    const { username, password, adminPassword, accountId, cashier_type } = req.body;

    // Verify admin password if password is being set
    if (password) {
      const admin = await User.findById(userId).select('+password');
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }
      if (!adminPassword) {
        return res.status(400).json({ message: "Admin password is required" });
      }
      const isMatch = await bcrypt.compare(adminPassword, admin.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid admin password" });
      }
    }

    const Model = getModel(planName);
    let account;

    // Multi-cashier support: for Cashier plan, use accountId to determine create vs update
    if (planName === "Create Cashier") {
      if (accountId) {
        // Edit existing cashier by its _id
        account = await Model.findOne({ _id: accountId, user_id: userId });
        if (!account) {
          return res.status(404).json({ message: "Cashier account not found" });
        }
        if (username) account.username = username;
        if (password) account.password = password;
        if (cashier_type) account.cashier_type = cashier_type;
      } else {
        // Create a brand new cashier account
        account = new Model({ user_id: userId, username, password, cashier_type: cashier_type || 'qsr' });
      }
    } else {
      // Standard single-account panels: find or create
      account = await Model.findOne({ user_id: userId });
      if (account) {
        account.username = username;
        if (password) account.password = password;
      } else {
        account = new Model({ user_id: userId, username, password });
      }
    }

    await account.save();
    res.status(200).json({ message: "Panel user saved successfully", data: account });
  } catch (err) {
    console.error("Error in createOrUpdatePanelUser:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.changePanelPassword = async (req, res) => {
  try {
    const { planName } = req.params;
    const userId = req.user._id;
    const { adminPassword, newPassword } = req.body;

    // Verify admin password
    const admin = await User.findById(userId).select('+password');
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin password" });
    }

    // Get correct panel model
    const Model = getModel(planName);
    const panelUser = await Model.findOne({ user_id: userId }).select('+password');
    if (!panelUser) {
      return res.status(404).json({ message: "Panel account not found" });
    }

    // Update panel password (will hash via pre-save)
    panelUser.password = newPassword;
    await panelUser.save();

    res.status(200).json({ message: "Panel password updated successfully" });
  } catch (err) {
    console.error("Error in changePanelPassword:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deletePanelUser = async (req, res) => {
  try {
    const { planName } = req.params;
    const userId = req.user._id;
    const adminPassword = req.body.adminPassword || req.headers['x-admin-password'] || req.query.adminPassword;

    if (!adminPassword) {
      return res.status(400).json({ message: "Admin password is required to delete credentials." });
    }

    // Verify admin password
    const admin = await User.findById(userId).select('+password');
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin password" });
    }

    const Model = getModel(planName);
    const deleted = await Model.findOneAndDelete({ user_id: userId });

    if (!deleted) {
      return res.status(404).json({ message: "Account not found" });
    }

    res.status(200).json({ message: "Panel user deleted successfully" });
  } catch (err) {
    console.error("Error in deletePanelUser:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a specific cashier by its _id (for multi-cashier support)
exports.deleteCashierById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cashierId } = req.params;
    const adminPassword = req.body.adminPassword;

    if (!adminPassword) {
      return res.status(400).json({ message: "Admin password is required." });
    }

    const admin = await User.findById(userId).select('+password');
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin password" });
    }

    const deleted = await Cashier.findOneAndDelete({ _id: cashierId, user_id: userId });
    if (!deleted) {
      return res.status(404).json({ message: "Cashier not found" });
    }

    res.status(200).json({ message: "Cashier deleted successfully" });
  } catch (err) {
    console.error("Error in deleteCashierById:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.panelLogin = async (req, res) => {
  try {
    const { planName } = req.params;
    const { restaurant_code, username, password } = req.body;
    console.log("Req.body : ", req.body);
    console.log(
      "Restaurant Code : ",
      restaurant_code,
      "Username : ",
      username,
      "password : ",
      password
    );
    const user = await User.findOne({ restaurant_code });

    if (!user) {
      console.log("User not found");
      return res.json({ message: "Invalid restaurant code" });
    }

    if (!user.isApproved) {
      console.log("User not approved by super admin");
      return res.json({ message: "Your account is pending activation from the Theboxsync side. We will notify you once it is activated." });
    }

    const Model = getModel(planName);
    const panelUser = await Model.findOne({ username, user_id: user._id });
    console.log("Model : " + planName);

    if (!panelUser) {
      console.log("Panel user not found");
      return res.json({ message: "Invalid Username" });
    }

    const isMatch = await bcrypt.compare(password, panelUser.password);
    if (!isMatch) {
      return res.json({ message: "Invalid Password" });
    }

    // Verify active subscription for the requested panel
    let subQuery = {
      user_id: user._id,
      plan_name: planName,
      status: "active",
      end_date: { $gt: new Date() }
    };

    if (planName === "Manager") {
      subQuery.plan_name = { $in: ["Manager", "QSR"] };
    }

    let hasAccess = false;
    const activeSubscription = await Subscription.findOne(subQuery);
    if (activeSubscription) {
      hasAccess = true;
    }

    // Check implicit access based on purchased base plan
    const tier = user.purchasedPlan;
    if (tier && !hasAccess) {
      const fineDineFeats = ['Manager', 'Captain Panel', 'KOT Panel', 'Reservation Manager', 'Table Management', 'Scan For Menu', 'Feedback', 'Waiter Calling System', 'Dynamic Reports', 'Whatsapp-Invoice', 'Restaurant Website', 'Create Cashier'];
      const chainFeats = ['Manager', 'QSR', 'Captain Panel', 'KOT Panel', 'Reservation Manager', 'Table Management', 'Token Management', 'Scan For Menu', 'Feedback', 'Waiter Calling System', 'Dynamic Reports', 'Whatsapp-Invoice', 'Restaurant Website', 'Payroll By The Box', 'Create Cashier'];

      if (tier === 'Fine Dine' && fineDineFeats.includes(planName)) hasAccess = true;
      if (tier === 'Chain' && chainFeats.includes(planName)) hasAccess = true;
      if ((tier === 'QSR' || tier === 'Café' || tier === 'Cloud') && ['QSR'].includes(planName)) hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: `No active subscription for ${planName}. Please purchase or renew the plan.` });
    }

    const token = await user.generateAuthToken(planName);

    res.status(200).json({ message: "Logged In", token, user, panelUser });
  } catch (err) {
    console.error("Error in panelLogin:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
