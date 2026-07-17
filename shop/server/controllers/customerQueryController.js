const CustomerQuery = require("../models/customerQueryModel");
const User = require("../models/userModel");

const addCustomerQuery = async (req, res) => {
  try {
    console.log("req.body", req.body);
    const user_id = req.user;
    const { message, purpose } = req.body;
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: "User not found" });
    console.log("user", user);
    const user_name = user.name;
    const query = await CustomerQuery.create({
      user_name,
      user_id,
      purpose,
      message,
    });
    res.status(201).json(query);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

const getCustomerQueryByUserId = async (req, res) => {
  try {
    console.log("req.params.user_id", req.params.user_id);
    const queries = await CustomerQuery.find({
      user_id: req.params.user_id,
    }).sort({ created_at: -1 });
    console.log("queries", queries);
    res.json(queries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch queries" });
  }
};

const getCustomerQueryByPlanName = async (req, res) => {
  try {
    const user_id = req.user; // Assuming this is _id
    const purpose = "Against Blocked Subscription: " + req.params.plan_name;

    const existingQuery = await CustomerQuery.findOne({
      user_id,
      purpose,
      completed_at: null,
    });

    if (existingQuery) {
      res.json({ exists: true, query: existingQuery });
    } else {
      res.json({ exists: false });
    }
  } catch (err) {
    console.error("Failed to fetch query:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const completeQuery = async (req, res) => {
  try {
    const { queryId } = req.body;
    await CustomerQuery.findByIdAndUpdate(queryId, {
      completed_at: new Date(),
    });
    res.json({ success: true, message: "Query marked as completed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to complete query" });
  }
};

module.exports = {
  addCustomerQuery,
  getCustomerQueryByPlanName,
  getCustomerQueryByUserId,
  completeQuery,
};
