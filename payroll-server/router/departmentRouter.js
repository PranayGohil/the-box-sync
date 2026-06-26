const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const auth = require("../middlewares/auth-middlewares");

router.post("/create", auth, departmentController.createDepartment);
router.get("/get", auth, departmentController.getDepartments);
router.delete("/delete/:id", auth, departmentController.deleteDepartment);
router.post("/assign", auth, departmentController.assignStaff);
router.post("/update-structure/:id", auth, departmentController.updateStructure);

module.exports = router;
