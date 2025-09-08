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

feedbackRouter.route("/add").post(authMiddleware, addFeedback);
feedbackRouter.route("/get").get(authMiddleware, getFeedbacks);
feedbackRouter
  .route("/delete/:id")
  .delete(authMiddleware, deleteFeedback);
feedbackRouter.route("/reply/:id").post(authMiddleware, replyFeedback);
feedbackRouter
  .route("/generate-token")
  .post(authMiddleware, adminAuth, generateFeedbackToken);

module.exports = feedbackRouter;
