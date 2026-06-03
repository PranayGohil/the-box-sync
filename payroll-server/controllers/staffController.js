const Staff = require("../models/staffModel");
const StaffAttendance = require("../models/staffAttendanceModel");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

// Helper to convert and compress image to webp
const convertToWebp = async (file) => {
  if (!file) return null;
  
  const originalPath = file.path;
  const ext = path.extname(originalPath);
  const directory = path.dirname(originalPath);
  const baseName = path.basename(originalPath, ext);
  
  const newFilename = `${baseName}.webp`;
  const destinationPath = path.join(directory, newFilename);
  
  try {
    await sharp(originalPath)
      .resize({
        width: 1200,
        height: 1200,
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(destinationPath);
      
    // Delete the original file
    fs.unlink(originalPath, (err) => {
      if (err) console.error(`Error deleting original file: ${originalPath}`, err);
    });
    
    return newFilename;
  } catch (error) {
    console.error("Error converting image to webp:", error);
    // Fallback to original filename if sharp fails
    return file.filename;
  }
};

// ── Helper: get today's date in IST (YYYY-MM-DD) ─────────────────────────────
const getTodayIST = () => {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
};

// ── GET /staff/get-positions ──────────────────────────────────────────────────
const getStaffPositions = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const positions = await Staff.distinct("position", { user_id: userId });
    res.json({ success: true, data: positions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /staff/get-all ────────────────────────────────────────────────────────
const getStaffData = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
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
    
    let adminUserId;
    let isStaff = false;
    let loggedInStaffId = null;

    if (req.user && typeof req.user === "object") {
        if (req.user.Role === "Staff") {
            adminUserId = req.user._id;
            isStaff = true;
            loggedInStaffId = req.user.staff_id;
        } else {
            adminUserId = req.user._id || req.user;
        }
    } else {
        adminUserId = req.user;
    }

    if (isStaff && staffId !== loggedInStaffId) {
        return res.status(403).json({ success: false, message: "Forbidden: You can only access your own profile." });
    }

    const staff = await Staff.findOne({ _id: staffId, user_id: adminUserId }).lean();

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
    const userId = req.user?._id || req.user;
    const staffData = {
      ...req.body,
      user_id: userId,
    };

    // Support mapping face_descriptor or face_encoding from frontend
    const faceDataRaw = req.body.face_descriptor || req.body.face_encoding;
    if (faceDataRaw) {
      try {
        staffData.face_encoding = typeof faceDataRaw === "string" ? JSON.parse(faceDataRaw) : faceDataRaw;
      } catch (error) {
        console.error("Error parsing face_encoding/face_descriptor:", error);
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

    if (staffData.increment_plan && typeof staffData.increment_plan === "string") {
      try {
        staffData.increment_plan = JSON.parse(staffData.increment_plan);
      } catch (e) {
        console.error("Invalid increment_plan JSON");
      }
    }

    if (staffData.custom_weekly_offs && typeof staffData.custom_weekly_offs === "string") {
      try {
        staffData.custom_weekly_offs = JSON.parse(staffData.custom_weekly_offs);
      } catch (e) {
        console.error("Invalid custom_weekly_offs JSON");
      }
    }

    if (staffData.leave_policy_configuration && typeof staffData.leave_policy_configuration === "string") {
      try {
        staffData.leave_policy_configuration = JSON.parse(staffData.leave_policy_configuration);
      } catch (e) {
        console.error("Invalid leave_policy_configuration JSON");
      }
    }

    if (req.files?.photo?.[0]) {
      const webpFilename = await convertToWebp(req.files.photo[0]);
      staffData.photo = `/staff/profile/${webpFilename}`;
    }
    if (req.files?.front_image?.[0]) {
      const webpFilename = await convertToWebp(req.files.front_image[0]);
      staffData.front_image = `/staff/id_cards/${webpFilename}`;
    }
    if (req.files?.back_image?.[0]) {
      const webpFilename = await convertToWebp(req.files.back_image[0]);
      staffData.back_image = `/staff/id_cards/${webpFilename}`;
    }

    const staff = await Staff.create(staffData);
    res.json({ success: true, data: staff });
  } catch (error) {
    console.error("Error adding staff:", error);
    res.status(500).json({ success: false, error: error.message || "Server error" });
  }
};

// ── PUT /staff/edit/:id ───────────────────────────────────────────────────────
const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user;

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
      const webpFilename = await convertToWebp(req.files.photo[0]);
      staffData.photo = `/staff/profile/${webpFilename}`;
    }
    if (req.files?.front_image?.[0]) {
      removeFile(existingStaff.front_image);
      const webpFilename = await convertToWebp(req.files.front_image[0]);
      staffData.front_image = `/staff/id_cards/${webpFilename}`;
    }
    if (req.files?.back_image?.[0]) {
      removeFile(existingStaff.back_image);
      const webpFilename = await convertToWebp(req.files.back_image[0]);
      staffData.back_image = `/staff/id_cards/${webpFilename}`;
    }

    const faceDataRaw = req.body.face_descriptor || req.body.face_encoding;
    if (faceDataRaw) {
      try {
        staffData.face_encoding = typeof faceDataRaw === "string" ? JSON.parse(faceDataRaw) : faceDataRaw;
      } catch (error) {
        console.error("Error parsing face_encoding/face_descriptor:", error);
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

    if (staffData.increment_plan && typeof staffData.increment_plan === "string") {
      try {
        staffData.increment_plan = JSON.parse(staffData.increment_plan);
      } catch (e) {
        console.error("Invalid increment_plan JSON");
      }
    }

    if (staffData.custom_weekly_offs && typeof staffData.custom_weekly_offs === "string") {
      try {
        staffData.custom_weekly_offs = JSON.parse(staffData.custom_weekly_offs);
      } catch (e) {
        console.error("Invalid custom_weekly_offs JSON");
      }
    }

    if (staffData.leave_policy_configuration && typeof staffData.leave_policy_configuration === "string") {
      try {
        staffData.leave_policy_configuration = JSON.parse(staffData.leave_policy_configuration);
      } catch (e) {
        console.error("Invalid leave_policy_configuration JSON");
      }
    }

    if (!staffData.password) {
      delete staffData.password;
    }

    Object.assign(existingStaff, staffData);
    const updatedStaff = await existingStaff.save();

    res.json({ success: true, message: "Staff updated successfully", staff: updatedStaff });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ success: false, error: error.message || "Server error" });
  }
};

// ── DELETE /staff/delete/:id ──────────────────────────────────────────────────
const deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const userId = req.user?._id || req.user;

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
    const userId = req.user?._id || req.user;
    const today = getTodayIST();

    const query = {
      user_id: userId,
      face_encoding: { $exists: true, $ne: null, $not: { $size: 0 } },
    };

    if (req.user && typeof req.user === "object" && req.user.Role === "Staff") {
      query._id = req.user.staff_id;
    }

    const staff = await Staff.find(query)
      .select("_id staff_id f_name l_name email position photo face_encoding")
      .lean();

    if (staff.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Fetch today's attendance records for all matched staff in a single query
    const staffIds = staff.map((s) => s._id);
    const todayRecords = await StaffAttendance.find({
      staff_id: { $in: staffIds },
      date: today,
    }).lean();

    // Build a map: staffId (string) → attendance record
    const attendanceMap = {};
    todayRecords.forEach((record) => {
      attendanceMap[record.staff_id.toString()] = record;
    });

    // Merge todayAttendance into each staff member
    const result = staff.map((s) => ({
      ...s,
      todayAttendance: attendanceMap[s._id.toString()] || null,
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error fetching encodings:", err);
    res.status(500).json({ success: false, error: "Failed to fetch face encodings" });
  }
};

// ── GET /staff/get-next-id ────────────────────────────────────────────────────
const getNextStaffIdController = async (req, res) => {
  try {
    const userId = req.user?._id || req.user;
    const lastStaff = await Staff.findOne({ user_id: userId })
      .sort({ _id: -1 })
      .select("staff_id")
      .lean();
      
    const lastId = lastStaff ? lastStaff.staff_id : null;
    
    const getNextStaffId = (lastId) => {
      if (!lastId) return "STF001";
      
      const match = lastId.match(/^(.*?)(\d+)$/);
      if (!match) {
        return `${lastId}001`;
      }
      
      const prefix = match[1];
      const numberStr = match[2];
      const nextNumber = parseInt(numberStr, 10) + 1;
      const paddedNumber = String(nextNumber).padStart(numberStr.length, '0');
      
      return `${prefix}${paddedNumber}`;
    };
    
    const nextId = getNextStaffId(lastId);
    res.json({ success: true, data: nextId });
  } catch (error) {
    console.error("Error generating next staff ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
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
  getNextStaffIdController,
};