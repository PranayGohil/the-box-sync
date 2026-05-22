const PayrollConfig = require("../models/PayrollConfig");

// GET /api/payroll-config
const getConfig = async (req, res) => {
  try {
    const user_id = req.user;
    let config = await PayrollConfig.findOne({ user_id });

    if (!config) {
      config = await PayrollConfig.create({ user_id });
    } else {
      // Migration: If config doesn't have custom_earnings, add default.
      if (!config.custom_earnings || config.custom_earnings.length === 0) {
        config.custom_earnings = [
          { id: "basic", label: "Basic Salary", is_active: true },
          { id: "hra", label: "HRA", is_active: true },
          { id: "conveyance", label: "Conveyance", is_active: true },
          { id: "medical", label: "Medical Allowance", is_active: false },
          { id: "special", label: "Special Allowance", is_active: false },
          { id: "other", label: "Other Allowance", is_active: false }
        ];
        
        // If old active_earnings exists, migrate the is_active status
        if (config.active_earnings && config.active_earnings.length > 0) {
          config.custom_earnings = config.custom_earnings.map(e => ({
            ...e,
            is_active: config.active_earnings.includes(e.id)
          }));
        }
        await config.save();
      }
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
    const { custom_earnings, statutory_config, org_rules } = req.body;

    let config = await PayrollConfig.findOne({ user_id });

    if (!config) {
      config = new PayrollConfig({ user_id });
    }

    if (custom_earnings) config.custom_earnings = custom_earnings;
    
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
