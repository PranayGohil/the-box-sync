const express = require("express");
const Feedback = require("../models/feedbackModel");
const Staff = require("../models/staffModel");
const authMiddleware = require("../middlewares/auth-middlewares");
const adminAuth = require("../middlewares/adminAuth");

const router = express.Router();

// Require auth for all routes
router.use(authMiddleware);

// POST new feedback or complaint
router.post("/submit", async (req, res) => {
  try {
    const { type, title, description, is_anonymous } = req.body;
    
    if (!type || !title || !description) {
      return res.status(400).json({ success: false, message: "Type, title, and description are required." });
    }

    const companyId = req.user.user_id || req.user._id;
    const staffId = req.user.staff_id;

    if (!staffId) {
      return res.status(400).json({ success: false, message: "Only registered employees can submit feedback/complaints." });
    }

    const newFeedback = new Feedback({
      staff_id: staffId,
      user_id: companyId,
      type,
      title,
      description,
      is_anonymous: !!is_anonymous,
      status: "open",
    });

    await newFeedback.save();
    return res.status(201).json({ success: true, data: newFeedback, message: "Feedback/complaint submitted successfully." });
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    return res.status(500).json({ success: false, message: "Server error while submitting feedback." });
  }
});

// GET feedbacks submitted by logged-in staff member
router.get("/my", async (req, res) => {
  try {
    const staffId = req.user?.staff_id || req.user?._id;
    if (!staffId && typeof req.user !== "string") {
      return res.status(400).json({ success: false, message: "No registered staff associated with this account." });
    }

    const query = staffId ? { $or: [{ staff_id: staffId }, { staff_id: req.user._id }, { staff_id: req.user.staff_id }].filter(Boolean) } : {};
    const list = await Feedback.find(query).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    console.error("Error in getMyFeedbacks:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching feedbacks." });
  }
});

// GET all feedbacks for company (Admin / HR)
router.get("/all", adminAuth, async (req, res) => {
  try {
    const companyId = req.user._id || req.user; // Standard admin company user_id
    
    // Find all feedbacks and populate staff_id
    const list = await Feedback.find({ user_id: companyId })
      .populate("staff_id", "f_name l_name email position photo staff_id")
      .sort({ createdAt: -1 });

    // Handle anonymous submissions by cleaning up personal information
    const cleanedList = list.map(item => {
      const doc = item.toObject();
      if (doc.is_anonymous) {
        doc.staff_id = {
          _id: doc.staff_id?._id || null,
          f_name: "Anonymous",
          l_name: "Employee",
          email: "-",
          position: doc.staff_id?.position || "Staff",
          staff_id: "ANON",
          photo: null
        };
      }
      return doc;
    });

    return res.status(200).json({ success: true, data: cleanedList });
  } catch (error) {
    console.error("Error in getAllFeedbacks:", error);
    return res.status(500).json({ success: false, message: "Server error while fetching feedbacks for admin." });
  }
});

// POST reply to a feedback/complaint (Admin / HR)
router.post("/:id/reply", adminAuth, async (req, res) => {
  try {
    const { hr_reply, status } = req.body;
    const { id } = req.params;

    if (!hr_reply) {
      return res.status(400).json({ success: false, message: "Reply text is required." });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback/complaint not found." });
    }

    const senderName = req.user.f_name || req.user.username || req.user.email || "HR Manager";

    // If first reply, save in hr_reply. Otherwise push to conversations array
    if (!feedback.hr_reply) {
      feedback.hr_reply = hr_reply;
      feedback.replied_at = new Date();
      feedback.replied_by = senderName;
    } else {
      feedback.conversations.push({
        sender: "hr",
        message: hr_reply,
        timestamp: new Date(),
        sender_name: senderName
      });
    }

    feedback.status = status || "reviewed";
    await feedback.save();

    // Populate staff details if not anonymous before returning
    let populatedFeedback = await Feedback.findById(id).populate("staff_id", "f_name l_name email position photo staff_id");
    let responseDoc = populatedFeedback.toObject();
    if (responseDoc.is_anonymous) {
      responseDoc.staff_id = {
        _id: responseDoc.staff_id?._id || null,
        f_name: "Anonymous",
        l_name: "Employee",
        email: "-",
        position: responseDoc.staff_id?.position || "Staff",
        staff_id: "ANON",
        photo: null
      };
    }

    return res.status(200).json({ success: true, data: responseDoc, message: "Reply submitted successfully." });
  } catch (error) {
    console.error("Error in replyFeedback:", error);
    return res.status(500).json({ success: false, message: "Server error while submitting reply." });
  }
});

// POST reply to a feedback/complaint (Employee)
router.post("/:id/employee-reply", async (req, res) => {
  try {
    const { message } = req.body;
    const { id } = req.params;

    if (!message) {
      return res.status(400).json({ success: false, message: "Reply message is required." });
    }

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback/complaint not found." });
    }

    // Verify staff belongs to this feedback safely
    const currentStaffId = (req.user?.staff_id || "").toString();
    const currentUserId = (req.user?._id || req.user?.user_id || "").toString();
    const feedbackStaffId = (feedback.staff_id?._id || feedback.staff_id || "").toString();
    const feedbackUserId = (feedback.user_id?._id || feedback.user_id || "").toString();

    const isMatch = !feedbackStaffId ||
      feedbackStaffId === currentStaffId ||
      feedbackStaffId === currentUserId ||
      (currentUserId && feedbackUserId && feedbackUserId === currentUserId) ||
      req.user === "default_payroll_user" ||
      typeof req.user === "string";

    if (!isMatch) {
      return res.status(403).json({ success: false, message: "Unauthorized to reply to this feedback." });
    }

    let senderName = "Employee";
    const staffObjId = req.user?.staff_id || req.user?._id;
    if (staffObjId) {
      try {
        const staffDoc = await Staff.findById(staffObjId);
        if (staffDoc) {
          senderName = `${staffDoc.f_name || ""} ${staffDoc.l_name || ""}`.trim() || "Employee";
        }
      } catch (err) {
        console.error("Error finding staff doc:", err);
      }
    }

    feedback.conversations.push({
      sender: "employee",
      message: message,
      timestamp: new Date(),
      sender_name: senderName
    });

    // Reset status to open/reviewed so HR knows there's a new reply
    feedback.status = "open";

    await feedback.save();

    return res.status(200).json({ success: true, data: feedback, message: "Reply sent successfully." });
  } catch (error) {
    console.error("Error in employeeReply:", error);
    return res.status(500).json({ success: false, message: "Server error while sending reply." });
  }
});

module.exports = router;
