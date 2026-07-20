const express = require("express");
const router = express.Router();
const rosterController = require("../controllers/rosterController");
const authMiddleware = require("../middlewares/auth-middlewares");

router.post("/week", authMiddleware, rosterController.getRoster);
router.post("/bulk-save", authMiddleware, rosterController.bulkSaveRoster);

module.exports = router;
