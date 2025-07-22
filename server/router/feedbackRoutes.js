const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  addFeedback,
  getFeedbacks,
  deleteFeedback,
  replyFeedback,
  generateFeedbackToken,
} = require("../controllers/feedbackController");
const adminAuth = require("../middlewares/adminAuth");

const feedbackRouter = express.Router();

feedbackRouter.route("/addfeedback").post(authMiddleware, addFeedback);
feedbackRouter.route("/getfeedbacks").get(authMiddleware, getFeedbacks);
feedbackRouter
  .route("/deletefeedback/:id")
  .delete(authMiddleware, deleteFeedback);
feedbackRouter.route("/replyfeedback/:id").post(authMiddleware, replyFeedback);
feedbackRouter
  .route("/generate-feedback-token")
  .post(authMiddleware, adminAuth, generateFeedbackToken);

module.exports = feedbackRouter;
