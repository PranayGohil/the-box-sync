const User = require("../models/userModel");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Customer = require("../models/customerModel");
const WebCustomer = require("../models/webCustomerModel");
const { sendEmail } = require("../utils/emailService");

const addFeedback = async (req, res) => {
  try {
    const {
      restaurant_token,
      customer_name,
      customer_email,
      customer_phone,
      rating,
      feedback,
      order_id,
      tags,
    } = req.body;

    if (!restaurant_token || !customer_name || !rating || !feedback) {
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
      order_id: order_id || null,
      tags: Array.isArray(tags) ? tags : [],
    };

    const result = await User.updateOne(
      { restaurant_token }, // uses index
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
      .select("name feedbacks.$") // only the matching feedback
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

    const textContent = `Hi ${feedback.customer_name},\n\nThank you for sharing your feedback with ${user.name || "us"}.\n\nReply:\n${reply}\n\nOriginal Feedback:\n"${feedback.feedback}"\nRating: ${feedback.rating || "N/A"}/5\n\nBest regards,\nThe ${user.name || "TheBox"} Team`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: #7444FD; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
          <h2 style="color: #fff; margin: 0;">Feedback Reply</h2>
        </div>
        <div style="padding: 24px; background: #fafafa;">
          <p style="color: #333; font-size: 16px;">Hi <strong>${feedback.customer_name}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.6; white-space: pre-line;">${reply}</p>
          
          <div style="margin-top: 24px; padding: 16px; background: #f1f5f9; border-left: 4px solid #7444FD; border-radius: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase;">Your Feedback:</p>
            <p style="margin: 0; font-style: italic; color: #334155; line-height: 1.5;">"${feedback.feedback}"</p>
            ${feedback.rating ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #fbbf24;">Rating: ${'★'.repeat(feedback.rating)}${'☆'.repeat(5 - feedback.rating)}</p>` : ''}
          </div>
          
          <p style="color: #555; margin-top: 24px; font-size: 15px;">Best regards,<br><strong>The ${user.name || 'TheBox'} Team</strong></p>
        </div>
        <div style="padding: 12px 24px; background: #f0f0f0; border-radius: 0 0 6px 6px; text-align: center; font-size: 12px; color: #999;">
          Sent via <strong style="color: #7444FD;">TheBox</strong>
        </div>
      </div>
    `;

    await sendEmail({
      to: feedback.customer_email,
      subject: `Feedback Reply - ${user.name || 'TheBox'}`,
      text: textContent,
      html: htmlContent,
    });

    await User.updateOne(
      { _id: userId, "feedbacks._id": feedbackId },
      { $set: { "feedbacks.$.reply": reply } }
    );

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
    user.restaurant_token = token;
    await user.save();

    return res.json({ success: true, restaurant_token: user.restaurant_token });
  } catch (error) {
    console.error("Error generating feedback token:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getOrderDetailForFeedback = async (req, res) => {
  try {
    const { orderNo } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required." });
    }

    const restaurant = await User.findOne({ restaurant_token: token });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Invalid restaurant token." });
    }

    // Search for order under this restaurant (case-insensitive for order_no, or match ObjectId directly)
    const isObjectId = mongoose.Types.ObjectId.isValid(orderNo);
    const orderQuery = {
      user_id: restaurant._id.toString()
    };
    if (isObjectId) {
      orderQuery.$or = [{ order_no: orderNo.toUpperCase() }, { _id: orderNo }];
    } else {
      orderQuery.order_no = orderNo.toUpperCase();
    }

    const order = await Order.findOne(orderQuery);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    let customerEmail = "";
    let customerPhone = order.customer_phone || "";
    let customerName = order.customer_name || "";

    if (order.customer_id) {
      let customer = await Customer.findById(order.customer_id);
      if (!customer) {
        customer = await WebCustomer.findById(order.customer_id);
      }
      if (customer) {
        customerEmail = customer.email || "";
        if (customer.phone) customerPhone = customer.phone;
        if (customer.name) customerName = customer.name;
      }
    }

    // Check if there is already feedback submitted for this order
    let existingFeedback = null;
    if (restaurant.feedbacks && restaurant.feedbacks.length > 0) {
      existingFeedback = restaurant.feedbacks.find(
        f => f.order_id && f.order_id.toString() === order._id.toString()
      );
    }

    return res.json({
      success: true,
      data: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        order_id: order._id,
        order_no: order.order_no || "",
        existing_feedback: existingFeedback ? {
          customer_name: existingFeedback.customer_name || "",
          customer_email: existingFeedback.customer_email || "",
          customer_phone: existingFeedback.customer_phone || "",
          rating: existingFeedback.rating,
          feedback: existingFeedback.feedback,
          tags: existingFeedback.tags || [],
          reply: existingFeedback.reply || null,
          date: existingFeedback.date
        } : null
      }
    });
  } catch (error) {
    console.error("Error fetching order detail for feedback:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  addFeedback,
  getFeedbacks,
  deleteFeedback,
  replyFeedback,
  generateFeedbackToken,
  getOrderDetailForFeedback,
};
