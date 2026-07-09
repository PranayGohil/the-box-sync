const PayrollConfig = require("../models/PayrollConfig");

// GET /api/payroll-config
const getConfig = async (req, res) => {
  try {
    const user_id = req.user;
    if (req.query.all === 'true') {
      const configs = await PayrollConfig.find({ user_id });
      return res.status(200).json({ success: true, data: configs });
    }
    const branchId = req.query.branch_id && req.query.branch_id !== 'null' ? req.query.branch_id : null;
    let config = await PayrollConfig.findOne({ user_id, branch_id: branchId });

    if (!config) {
      if (branchId) {
        let globalConfig = await PayrollConfig.findOne({ user_id, branch_id: null });
        if (!globalConfig) {
          globalConfig = await PayrollConfig.create({ user_id, branch_id: null });
        }
        const configObj = globalConfig.toObject();
        delete configObj._id;
        delete configObj.createdAt;
        delete configObj.updatedAt;
        configObj.branch_id = branchId;
        config = await PayrollConfig.create(configObj);
      } else {
        config = await PayrollConfig.create({ user_id, branch_id: null });
      }
    } else {
      let isUpdated = false;
      
      // Migration: If config doesn't have custom_earnings field at all, seed defaults.
      // IMPORTANT: do NOT reset if it's an empty array — that means user deleted all earnings.
      if (config.custom_earnings == null) {
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
        isUpdated = true;
      }

      // Migration: If config doesn't have custom_deductions field at all, seed defaults.
      // IMPORTANT: do NOT reset if it's an empty array — that means user deleted all deductions.
      if (config.custom_deductions == null) {
        config.custom_deductions = [
          { id: "tds", label: "Income Tax (TDS)", is_active: false },
          { id: "loan", label: "Loan Recovery", is_active: false },
          { id: "advance", label: "Salary Advance", is_active: false },
          { id: "other_deduction", label: "Other Deduction", is_active: false }
        ];
        isUpdated = true;
      }

      if (isUpdated) {
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
    const branchId = req.query.branch_id && req.query.branch_id !== 'null' ? req.query.branch_id : null;
    const { custom_earnings, custom_deductions, statutory_config, org_rules, network_restrictions, wfh_config, global_weekly_offs } = req.body;

    let config = await PayrollConfig.findOne({ user_id, branch_id: branchId });

    if (!config) {
      if (branchId) {
        let globalConfig = await PayrollConfig.findOne({ user_id, branch_id: null });
        if (!globalConfig) {
          globalConfig = await PayrollConfig.create({ user_id, branch_id: null });
        }
        const configObj = globalConfig.toObject();
        delete configObj._id;
        delete configObj.createdAt;
        delete configObj.updatedAt;
        configObj.branch_id = branchId;
        config = new PayrollConfig(configObj);
      } else {
        config = new PayrollConfig({ user_id, branch_id: null });
      }
    }

    if (custom_earnings !== undefined) {
      config.custom_earnings = custom_earnings;
      config.markModified('custom_earnings');
    }
    if (custom_deductions !== undefined) {
      config.custom_deductions = custom_deductions;
      config.markModified('custom_deductions');
    }
    
    if (statutory_config) {
        config.statutory_config = {
            ...config.statutory_config,
            ...statutory_config
        };
        config.markModified('statutory_config');
    }
    
    if (org_rules) {
        config.org_rules = {
            ...config.org_rules,
            ...org_rules
        };
        config.markModified('org_rules');
    }

    if (global_weekly_offs !== undefined) {
        config.global_weekly_offs = global_weekly_offs;
        config.markModified('global_weekly_offs');
    }

    if (network_restrictions !== undefined) {
      config.network_restrictions = network_restrictions;
      config.markModified('network_restrictions');
    }

    if (wfh_config) {
      config.wfh_config = {
          ...config.wfh_config,
          ...wfh_config
      };
      config.markModified('wfh_config');
    }

    if (req.body.document_templates) {
      config.document_templates = {
        ...config.document_templates,
        ...req.body.document_templates
      };
      config.markModified('document_templates');
    }

    await config.save();
    res.status(200).json({ success: true, data: config, message: "Config updated successfully" });
  } catch (error) {
    console.error("Error updating payroll config:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { getConfig, updateConfig };
