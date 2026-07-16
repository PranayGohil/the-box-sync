const express = require("express");
const {
  createInquiry,
  getAllInquiries,
  updateInquiryStatus,
  replyToInquiry
} = require("../controllers/inquiryController");
const authMiddleware = require("../middlewares/auth-middlewares");

const inquiryRouter = express.Router();

inquiryRouter.route("/create").post(createInquiry);
inquiryRouter.route("/get-all").get(authMiddleware, getAllInquiries);
inquiryRouter.route("/update-status/:id").put(authMiddleware, updateInquiryStatus);
inquiryRouter.route("/reply/:id").post(authMiddleware, replyToInquiry);

module.exports = inquiryRouter;
