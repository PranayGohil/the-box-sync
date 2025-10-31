const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const { createInquiry, getAllInquiries, updateInquiryStatus } = require("../controllers/inquiryController");

const inquiryRouter = express.Router();

inquiryRouter.route("/create").post(createInquiry);
inquiryRouter.route("/get-all").get(authMiddleware, getAllInquiries);
inquiryRouter.route("/update-status/:id").put(authMiddleware, updateInquiryStatus);

module.exports = inquiryRouter;
