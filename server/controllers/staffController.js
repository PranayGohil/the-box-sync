const Staff = require("../models/staffModel");
const fs = require("fs");
const path = require("path");

// ── GET /staff/get-positions ──────────────────────────────────────────────────
const getStaffPositions = async (req, res) => {
  try {
    const positions = await Staff.distinct("position", { user_id: req.user });
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /staff/get-all ────────────────────────────────────────────────────────
const getStaffData = async (req, res) => {
  try {
    const userId = req.user;
    const { page = 1, limit = 50 } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 50;

    const projection = {
      staff_id: 1,
      f_name: 1,
      l_name: 1,
      email: 1,
      phone_no: 1,
      position: 1,
      salary: 1,
      photo: 1,
      joining_date: 1,
      // attandance removed — now in Attendance collection
    };

    const [data, total] = await Promise.all([
      Staff.find({ user_id: userId })
        .select(projection)
        .sort({ f_name: 1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Staff.countDocuments({ user_id: userId }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /staff/get/:id ────────────────────────────────────────────────────────
const getStaffDataById = async (req, res) => {
  try {
    const staffId = req.params.id;
    const userId = req.user;

    const staff = await Staff.findOne({ _id: staffId, user_id: userId }).lean();

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /staff/add ───────────────────────────────────────────────────────────
const addStaff = async (req, res) => {
  try {
    const staffData = {
      ...req.body,
      user_id: req.user,
    };

    if (staffData.salary_structure && typeof staffData.salary_structure === "string") {
      try {
        staffData.salary_structure = JSON.parse(staffData.salary_structure);
      } catch (e) {
        console.error("Invalid salary_structure JSON");
      }
    }

    if (req.files?.photo?.[0]) {
      staffData.photo = `/staff/profile/${req.files.photo[0].filename}`;
    }
    if (req.files?.front_image?.[0]) {
      staffData.front_image = `/staff/id_cards/${req.files.front_image[0].filename}`;
    }
    if (req.files?.back_image?.[0]) {
      staffData.back_image = `/staff/id_cards/${req.files.back_image[0].filename}`;
    }

    const staff = await Staff.create(staffData);
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error("Error adding staff:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ── PUT /staff/edit/:id ───────────────────────────────────────────────────────
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const existingStaff = await Staff.findOne({ _id: id, user_id: userId });
    if (!existingStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const staffData = { ...req.body };

    const removeFile = (relativePath) => {
      if (!relativePath) return;
      const filename = path.basename(relativePath);
      let folder = "";
      if (relativePath.includes("/staff/profile")) folder = "staff/profile";
      else if (relativePath.includes("/staff/id_cards")) folder = "staff/id_cards";
      const fullPath = path.join(__dirname, "..", "uploads", folder, filename);
      fs.unlink(fullPath, (err) => {
        if (err) console.error(`Error deleting file: ${fullPath}`, err);
      });
    };

    if (req.files?.photo?.[0]) {
      removeFile(existingStaff.photo);
      staffData.photo = `/staff/profile/${req.files.photo[0].filename}`;
    }
    if (req.files?.front_image?.[0]) {
      removeFile(existingStaff.front_image);
      staffData.front_image = `/staff/id_cards/${req.files.front_image[0].filename}`;
    }
    if (req.files?.back_image?.[0]) {
      removeFile(existingStaff.back_image);
      staffData.back_image = `/staff/id_cards/${req.files.back_image[0].filename}`;
    }

    if (staffData.face_encoding) {
      try {
        staffData.face_encoding = JSON.parse(staffData.face_encoding);
      } catch (error) {
        console.error("Error parsing face_encoding:", error);
        return res.status(400).json({ error: "Invalid face encoding data" });
      }
    }

    if (staffData.salary_structure && typeof staffData.salary_structure === "string") {
      try {
        staffData.salary_structure = JSON.parse(staffData.salary_structure);
      } catch (e) {
        console.error("Invalid salary_structure JSON");
      }
    }

    const updatedStaff = await Staff.findOneAndUpdate(
      { _id: id, user_id: userId },
      { $set: staffData },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: "Staff updated successfully", staff: updatedStaff });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

// ── DELETE /staff/delete/:id ──────────────────────────────────────────────────
const deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const userId = req.user;

    const staffData = await Staff.findOne({ _id: staffId, user_id: userId });
    if (!staffData) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const deleteIfExists = (relativePath, folder) => {
      if (!relativePath) return;
      const filename = path.basename(relativePath);
      const fullPath = path.join(__dirname, "..", "uploads", folder, filename);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    };

    deleteIfExists(staffData.photo, "staff/profile");
    deleteIfExists(staffData.front_image, "staff/id_cards");
    deleteIfExists(staffData.back_image, "staff/id_cards");

    await Staff.deleteOne({ _id: staffId, user_id: userId });

    // NOTE: You may also want to delete the staff's attendance records:
    // const Attendance = require("../models/attendanceModel");
    // await Attendance.deleteMany({ staff_id: staffId });

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

// ── GET /staff/face-data ──────────────────────────────────────────────────────
const getAllFaceEncodings = async (req, res) => {
  try {
    const staff = await Staff.find({
      user_id: req.user,
      face_encoding: { $exists: true, $ne: null, $not: { $size: 0 } },
    })
      .select("_id staff_id f_name l_name email position face_encoding")
      .lean();

    res.json({ success: true, data: staff });
  } catch (err) {
    console.error("Error fetching encodings:", err);
    res.status(500).json({ success: false, error: "Failed to fetch face encodings" });
  }
};

module.exports = {
  getStaffPositions,
  getStaffData,
  getStaffDataById,
  addStaff,
  updateStaff,
  deleteStaff,
  getAllFaceEncodings,
};