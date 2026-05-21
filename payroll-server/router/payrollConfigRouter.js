const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth-middlewares");
const { getConfig, updateConfig } = require("../controllers/payrollConfigController");

router.route("/").get(authMiddleware, getConfig);
router.route("/").put(authMiddleware, updateConfig);

module.exports = router;
