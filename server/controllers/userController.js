const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../utils/emailService");

const emailCheck = async (req, res) => {
  try {
    const userExists = await User.findOne({ email: req.body.email })
      .select("_id")
      .lean();

    return res.json({
      success: true,
      exists: !!userExists,
      message: userExists ? "User Already Exists" : "User Not Found",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const register = async (req, res) => {
  try {
    const { country, state, name, email } = req.body;

    if (!country || !state || !name || !email) {
      return res
        .status(400)
        .json({ message: "Country, state, name, and email are required" });
    }

    // Generate the prefix for the restaurant code
    const countryPrefix = country.toUpperCase();
    const statePrefix = state.toUpperCase();

    // Find the highest existing code for this country and state
    const latestUser = await User.findOne({
      country: countryPrefix,
      state: statePrefix,
    })
      .sort({ createdAt: -1 })
      .select("restaurant_code")
      .lean();

    let sequenceNumber = 1;

    if (latestUser) {
      const latestCode = latestUser.restaurant_code;
      const match = latestCode.match(
        new RegExp(`${statePrefix}(\\d+)${countryPrefix}`)
      );

      if (match) {
        sequenceNumber = parseInt(match[1], 10) + 1;
      }
    }

    const restaurantCode = `${statePrefix}${String(sequenceNumber).padStart(
      4,
      "0"
    )}${countryPrefix}`;

    // Create the new user with the generated restaurant code
    const userdata = {
      ...req.body,
      logo: req.file ? "/branding/logo/" + req.file.filename : null,
      restaurant_code: restaurantCode,
    };

    const newUser = new User(userdata);
    await newUser.save();

    const token = await newUser.generateAuthToken("Admin");
    res.cookie("jwttoken", token, {
      expires: new Date(Date.now() + 25892000000),
      httpOnly: true,
    });

    // Replace placeholders in the email template
    const regEmail = `
      <p>
        Dear <strong> ${name} </strong>,
      </p>
  
      <p>
        <br>We are pleased to inform you that your registration with TheBox has been successfully completed. Welcome to our community!
      </p>
  
      <p>
        Here are the details of your registration:
      </p>
  
      <p>
        <br><strong>Restaurant Code: </strong> ${restaurantCode}
        <br><strong>Email Address: </strong> ${email}
        <br><strong>Date of Registration: </strong> ${new Date().toLocaleDateString()}
      </p>
  
      <p>Please keep this information safe for your records.</p>
  
      <p>If you have any questions or need assistance, feel free to reach out to our customer support team at <span style="font-weight: bold; color: blue;">support@theboxsync.com</span>.</p>
  
      <p>Thank you for choosing TheBox. We look forward to providing you with a seamless and enjoyable experience.</p>
  
      <p>
        Best regards,
        <br>TheBox,
        <br><span style="font-weight: bold; color: blue;">support@theboxsync.com</span>
        <br><a href="https://theboxsync.com" style="font-weight: bold; color: blue;">theboxsync.com</a>
      </p>
      `;

    // await sendEmail({
    //   to: email,
    //   subject: "Successful Registration Confirmation for Your TheBox Account",
    //   html: regEmail,
    // });

    res.json({
      message: "Registered",
      restaurant_code: restaurantCode,
      token,
      user: { _id: newUser._id, email: newUser.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userExists = await User.findOne({ email }).select("+password");

    if (!userExists) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const matchPass = await bcrypt.compare(password, userExists.password);
    if (!matchPass) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Credentials" });
    }

    const token = await userExists.generateAuthToken("Admin");

    res.json({
      success: true,
      message: "Logged In",
      token,
      user: {
        _id: userExists._id,
        email: userExists.email,
      },
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    res.clearCookie("jwttoken");
    res.status(200).json({ message: "Logged Out" });
  } catch (error) {
    console.log(error);
  }
};

const getUserData = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user._id || req.user; // depending on how auth stores it

    const projection = {
      _id: 1,
      restaurant_code: 1,
      name: 1,
      logo: 1,
      gst_no: 1,
      fssai_no: 1,
      email: 1,
      mobile: 1,
      address: 1,
      country: 1,
      state: 1,
      city: 1,
      pincode: 1,
      createdAt: 1,
      taxInfo: 1,
      containerCharges: 1,
      purchasedPlan: 1,
      feedbackToken: 1,
      // don't include password, otp, feedbacks by default
    };

    const fetchuser = await User.findById(userId).select(projection).lean();

    if (!fetchuser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(fetchuser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUserDataByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const userdata = await User.findOne({ restaurant_code: code }).lean();
    if (!userdata) {
      return res.status(404).json({ message: "User not found" });
    }
    res.send(userdata);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error, message: "Server error" });
  }
};

const sendAdminOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found." });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
    user.otp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
    await user.save();

    // Replace placeholders in the email template
    const adminOtpMail = `
      <p>
        Dear ${user.name || "User"},
        <br>We received a request to reset the password for your TheBox account associated with this email address: ${email}.
      </p>
      <p>
        To proceed with the password reset, please use the following One Time Password (OTP):
      </p>
      <p><strong>OTP: ${otp}</strong></p>
      <p>
        Please enter this OTP on the password reset page to verify your identity and create a new password.
        If you did not initiate this password reset request, please ignore this email. Your account security is important to us.
      </p>
      <p>
        For further assistance or if you have any concerns, please contact our support team at <span style="font-weight: bold; color: blue;">support@theboxsync.com</span>.
      </p>
      <p>
        Thank you for choosing TheBox.
        <br>TheBox,
        <br><span style="font-weight: bold; color: blue;">support@theboxsync.com</span>
        <br><a href="https://theboxsync.com" style="font-weight: bold; color: blue;">theboxsync.com</a>
      </p>
      `;

    // Send OTP via email
    await sendEmail({
      to: email,
      subject: "OTP Verification for Password Reset from TheBox",
      html: adminOtpMail,
    });
    console.log("OTP sent to your email.", otp);
    res.json({ message: "OTP sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred while sending OTP." });
  }
};

const verifyAdminOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email }).select("otp otpExpiry").lean();
    if (!user) {
      return res.status(404).json({ message: "Email not found." });
    }

    if (user.otp !== parseInt(otp, 10) || Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // OTP is valid
    res.json({ verified: true, message: "OTP verified successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred while verifying OTP." });
  }
};

const resetAdminPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found." });
    }

    // Update the password
    user.password = newPassword;

    // Clear OTP fields
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Replace placeholders in the email template
    const passwordResetMail = `
      <p>
        Dear ${user.name || "User"},
        <br>We are writing to inform you that the password for your TheBox account has been successfully reset. Your account is now secured with the new password.
      </p>
      <p>
        If you have not initiated this password reset or if you have any concerns about your account security, please contact our support team immediately at support@theboxsync.com.
      </p>
      <p>
        Here are the details of your recent password reset:
      </p>
      <p>
        <strong>Email Address:</strong> ${email}<br>
        <strong>Date and Time of Password Reset:</strong> ${new Date().toLocaleString()}
      </p>
      <p>
        If you encountered any issues during the password reset process or need further assistance, feel free to reach out to us.
      </p>
      <p>
        Thank you for choosing TheBox. We appreciate your trust and look forward to providing you with an excellent experience.
      </p>
      <p>
        Thanks and Regards,<br>
        TheBox,<br>
        <span style="font-weight: bold; color: blue;">support@theboxsync.com</span><br>
        <a href="https://theboxsync.com" style="font-weight: bold; color: blue;">theboxsync.com</a>
      </p>
      `;

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: "Password Reset Successful for Your TheBox Account",
      html: passwordResetMail,
    });

    res.json({ message: "Password reset successfully." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "An error occurred while resetting password." });
  }
};

const updateUser = async (req, res) => {
  const userId = req.user;
  const { ...updates } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // ✅ Save uploaded logo path if available
    if (req.file && req.file.fieldname === "logo") {
      updates.logo = `/branding/logo/${req.file.filename}`;
    }

    // ✅ Update fields
    Object.keys(updates).forEach((key) => {
      if (user[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    await user.save();
    res.status(200).json({ message: "User information updated successfully." });
  } catch (error) {
    console.error("Error updating user information:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const updateTax = async (req, res) => {
  const { gst_no, taxInfo } = req.body;
  const userId = req.user;

  try {
    await User.findByIdAndUpdate(userId, {
      gst_no,
      taxInfo: {
        cgst: taxInfo?.cgst ?? 0,
        sgst: taxInfo?.sgst ?? 0,
        vat: taxInfo?.vat ?? 0,
      },
    });

    res.status(200).json({
      success: true,
      message: "Tax information updated successfully.",
    });
  } catch (error) {
    console.error("Error updating tax info:", error);
    res.status(500).send("Failed to update tax information.");
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 50;

    const projection = {
      _id: 1,
      restaurant_code: 1,
      name: 1,
      email: 1,
      mobile: 1,
      country: 1,
      state: 1,
      city: 1,
      createdAt: 1,
      purchasedPlan: 1,
    };

    const [users, total] = await Promise.all([
      User.find()
        .select(projection)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      User.countDocuments(),
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

module.exports = {
  emailCheck,
  register,
  login,
  logout,
  getUserData,
  getUserDataByCode,
  sendAdminOtp,
  verifyAdminOtp,
  resetAdminPassword,
  updateUser,
  updateTax,
  getAllUsers,
};
