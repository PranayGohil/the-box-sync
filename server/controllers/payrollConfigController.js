const PayrollConfig = require("../models/PayrollConfig");

// GET /api/payroll-config
const getConfig = async (req, res) => {
  try {
    const user_id = req.user;
    let config = await PayrollConfig.findOne({ user_id });

    if (!config) {
      config = await PayrollConfig.create({ user_id });
    }

    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error("Error getting payroll config:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// PUT /api/payroll-config
const updateConfig = async (req, res) => {
  try {
    const user_id = req.user;
    const { active_earnings, statutory_config, org_rules } = req.body;

    let config = await PayrollConfig.findOne({ user_id });

    if (!config) {
      config = new PayrollConfig({ user_id });
    }

    if (active_earnings) config.active_earnings = active_earnings;
    
    if (statutory_config) {
        config.statutory_config = {
            ...config.statutory_config,
            ...statutory_config
        };
    }
    
    if (org_rules) {
        config.org_rules = {
            ...config.org_rules,
            ...org_rules
        };
    }

    await config.save();
    res.status(200).json({ success: true, data: config, message: "Config updated successfully" });
  } catch (error) {
    console.error("Error updating payroll config:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { getConfig, updateConfig };
