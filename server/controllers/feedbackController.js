const User = require("../models/userModel");
const crypto = require("crypto");
const { sendEmail } = require("../utils/emailService");

const addFeedback = async (req, res) => {
  try {
    const {
      feedbackToken,
      customer_name,
      customer_email,
      customer_phone,
      rating,
      feedback,
    } = req.body;

    if (!feedbackToken || !customer_name || !rating || !feedback) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const newFeedback = {
      customer_name,
      customer_email: customer_email || "",
      customer_phone: customer_phone || "",
      rating,
      feedback,
      date: new Date(),
    };

    const result = await User.updateOne(
      { feedbackToken }, // uses index
      { $push: { feedbacks: newFeedback } }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid feedback token." });
    }

    return res.json({
      success: true,
      message: "Feedback added successfully.",
      feedback: newFeedback,
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const getFeedbacks = async (req, res) => {
  try {
    const userId = req.user;

    const { page = 1, limit = 20 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 20;

    // Read only feedbacks field
    const user = await User.findById(userId).select("feedbacks").lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const total = user.feedbacks.length;
    const start = (pageNumber - 1) * pageSize;
    const end = start + pageSize;
    const pageFeedbacks = user.feedbacks
      .slice(start, end)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first

    return res.json({
      success: true,
      feedbacks: pageFeedbacks,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Error getting feedback data:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const userId = req.user;
    const feedbackId = req.params.id;

    const result = await User.updateOne(
      { _id: userId },
      { $pull: { feedbacks: { _id: feedbackId } } }
    );

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Feedback not found." });
    }

    return res.json({
      success: true,
      message: "Feedback deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const replyFeedback = async (req, res) => {
  try {
    const userId = req.user;
    const feedbackId = req.params.id;
    const { reply } = req.body;

    if (!reply) {
      return res
        .status(400)
        .json({ success: false, message: "Reply content is required." });
    }

    const user = await User.findOne({
      _id: userId,
      "feedbacks._id": feedbackId,
    })
      .select("feedbacks.$") // only the matching feedback
      .lean();

    if (!user || !user.feedbacks || user.feedbacks.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Feedback not found." });
    }

    const feedback = user.feedbacks[0];

    if (!feedback.customer_email) {
      return res.status(400).json({
        success: false,
        message: "Feedback does not have a customer email.",
      });
    }

    await sendEmail({
      to: feedback.customer_email,
      subject: "Feedback Reply",
      html: reply,
    });

    return res.json({
      success: true,
      message: "Feedback replied successfully.",
    });
  } catch (error) {
    console.error("Error replying to feedback:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const generateFeedbackToken = async (req, res) => {
  try {
    const userId = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const token = crypto.randomBytes(16).toString("hex");
    user.feedbackToken = token;
    await user.save();

    return res.json({ success: true, feedbackToken: user.feedbackToken });
  } catch (error) {
    console.error("Error generating feedback token:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  addFeedback,
  getFeedbacks,
  deleteFeedback,
  replyFeedback,
  generateFeedbackToken,
};
