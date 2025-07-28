const User = require("../models/userModel");
const crypto = require("crypto");

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

    // Validate required fields
    if (!feedbackToken || !customer_name || !rating || !feedback) {
      return res.json({ success: false, message: "Missing required fields." });
    }

    // Find user by feedbackToken
    const user = await User.findOne({ feedbackToken });
    console.log("User:", user);
    if (!user) {
      return res.json({ success: false, message: "Invalid feedback token." });
    }

    // Create feedback object
    const newFeedback = {
      customer_name,
      customer_email: customer_email || "", // Optional
      customer_phone: customer_phone || "", // Optional
      rating,
      feedback,
    };

    // Add feedback to user
    user.feedbacks.push(newFeedback);
    await user.save();

    res.json({
      success: true,
      message: "Feedback added successfully.",
      feedback: newFeedback,
    });
  } catch (error) {
    console.error("Error adding feedback:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const getFeedbacks = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }
    const feedbacks = user.feedbacks;
    console.log(feedbacks);
    res.json({ success: true, feedbacks });
  } catch (error) {
    console.error("Error getting feedback data:", error);
    res.json({ success: false, message: "Internal server error." });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const userId = req.user;
    const feedbackId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }
    const feedbackIndex = user.feedbacks.findIndex(
      (feedback) => feedback._id.toString() === feedbackId
    );
    if (feedbackIndex === -1) {
      return res.json({ success: false, message: "Feedback not found." });
    }
    user.feedbacks.splice(feedbackIndex, 1);
    await user.save();
    res.json({ success: true, message: "Feedback deleted successfully." });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.json({ success: false, message: "Internal server error." });
  }
};

const replyFeedback = async (req, res) => {
  try {
    const userId = req.user;
    const feedbackId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }
    const feedbackIndex = user.feedbacks.findIndex(
      (feedback) => feedback._id.toString() === feedbackId
    );
    if (feedbackIndex === -1) {
      return res.json({ success: false, message: "Feedback not found." });
    }

    const feedback = user.feedbacks[feedbackIndex];
    const { reply } = req.body;

    await sendEmail({
      to: feedback.customer_email,
      subject: "Feedback Reply",
      html: reply,
    });

    res.json({ success: true, message: "Feedback replied successfully." });
  } catch (error) {
    console.error("Error replying to feedback:", error);
    res.json({ success: false, message: "Internal server error." });
  }
};

const generateFeedbackToken = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);
    console.log("User:", userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    const token = () => {
      const token = crypto.randomBytes(16).toString("hex"); // Generate a random token
      this.feedbackToken = token;
      return token;
    };
    user.feedbackToken = token();
    console.log("token", user.feedbackToken);
    await user.save();

    res.json({ feedbackToken: user.feedbackToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addFeedback,
  getFeedbacks,
  deleteFeedback,
  replyFeedback,
  generateFeedbackToken,
};
