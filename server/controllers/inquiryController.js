const Inquiry = require("../models/inquiryModel");

const createInquiry = async (req, res) => {
  try {
    const { name, email, phone, city, restaurant_name, purpose, message } = req.body;
    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      city,
      restaurant_name,
      purpose,
      message,
      status: "Pending",
    });
    res.status(200).json({
      success: true,
      message: "Inquiry created successfully",
      inquiry,
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch inquiries" });
  }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await Inquiry.findByIdAndUpdate(id, { status });
    res.json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

module.exports = { createInquiry, getAllInquiries, updateInquiryStatus };
