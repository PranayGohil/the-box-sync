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

const { sendEmail } = require("../utils/emailService");

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

const replyToInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText } = req.body;

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    // Update DB
    inquiry.reply = replyText;
    inquiry.status = "Resolved";
    await inquiry.save();

    // Send email
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="background: #23b3f4; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
            <h2 style="color: #fff; margin: 0;">Inquiry Response</h2>
          </div>
          <div style="padding: 24px; background: #fafafa;">
            <p style="color: #333; font-size: 16px;">Dear <strong>${inquiry.name}</strong>,</p>
            <p style="color: #555;">Thank you for reaching out to us regarding <strong>${inquiry.purpose}</strong>.</p>
            
            <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0; color: #4a5568; font-size: 14px; border-bottom: 1px solid #eee; padding-bottom: 8px;"><strong>Your Original Message:</strong></p>
              <p style="color: #666; font-style: italic; margin: 0;">"${inquiry.message}"</p>
            </div>

            <div style="background: #ebf8ff; border: 1px solid #90cdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0 0 12px 0; color: #2b6cb0; font-size: 14px; border-bottom: 1px solid #bee3f8; padding-bottom: 8px;"><strong>Our Reply:</strong></p>
              <p style="color: #2c5282; margin: 0; white-space: pre-wrap;">${replyText}</p>
            </div>

            <p style="color: #555;">If you have any further questions, feel free to reply to this email.</p>
            <p style="color: #555; margin-top: 24px;">Best regards,<br><strong>The TheBox Team</strong></p>
          </div>
        </div>
      `;

      await sendEmail({
        to: inquiry.email,
        subject: `Response to your inquiry: ${inquiry.purpose}`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error("Failed to send inquiry reply email:", emailError);
      // Don't fail the request if email fails, but maybe alert
    }

    res.json({ success: true, message: "Reply sent successfully", inquiry });
  } catch (error) {
    console.error("Error replying to inquiry:", error);
    res.status(500).json({ success: false, message: "Failed to send reply" });
  }
};

module.exports = { createInquiry, getAllInquiries, updateInquiryStatus, replyToInquiry };
