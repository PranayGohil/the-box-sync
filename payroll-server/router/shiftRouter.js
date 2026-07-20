const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");
const authMiddleware = require("../middlewares/auth-middlewares");

router.post("/create", authMiddleware, shiftController.createShift);
router.get("/all", authMiddleware, shiftController.getShifts);
router.put("/update/:shiftId", authMiddleware, shiftController.updateShift);
router.delete("/delete/:shiftId", authMiddleware, shiftController.deleteShift);

module.exports = router;
