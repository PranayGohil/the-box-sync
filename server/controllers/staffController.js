const Staff = require("../models/staffModel");
const fs = require("fs");
const path = require("path");

const getStaffPositions = (req, res) => {
  try {
    Staff.distinct("position", { user_id: req.user }).then((data) =>
      res.json(data)
    );
  } catch (error) {
    console.log(error);
  }
};

const getStaffData = (req, res) => {
  try {
    Staff.find({ user_id: req.user })
      .then((data) => {
        res.json(data);
      })
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getStaffDataById = (req, res) => {
  try {
    const staffId = req.params.id;
    Staff.findOne({ _id: staffId }).then((data) => {
      res.json(data);
    });
  } catch (error) {
    console.log(error);
  }
};

const addStaff = (req, res) => {
  try {
    const staffData = {
      ...req.body,
      user_id: req.user,
    };

    // If files are uploaded, store their paths
    if (req.files.photo) {
      staffData.photo = `/staff/profile/${req.files.photo[0].filename}`;
    }
    if (req.files.front_image) {
      staffData.front_image = `/staff/id_cards/${req.files.front_image[0].filename}`;
    }
    if (req.files.back_image) {
      staffData.back_image = `/staff/id_cards/${req.files.back_image[0].filename}`;
    }

    Staff.create(staffData)
      .then((data) => res.json(data))
      .catch((err) => res.status(500).json({ error: err.message }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the current staff data before updating
    const existingStaff = await Staff.findById(id);
    if (!existingStaff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const staffData = {
      ...req.body,
      user_id: req.user,
    };

    // Helper to remove old file
    const removeFile = (filePath) => {
      if (filePath) {
        const fullPath = path.join(__dirname, "..", "public", filePath);
        fs.unlink(fullPath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${fullPath}`, err);
          }
        });
      }
    };

    // If new files are uploaded, delete old ones and set new paths
    if (req.files?.photo?.[0]) {
      removeFile("../uploads" + existingStaff.photo); // delete old
      staffData.photo = `/staff/profile/${req.files.photo[0].filename}`;
    }
    if (req.files?.front_image?.[0]) {
      removeFile("../uploads" + existingStaff.front_image);
      staffData.front_image = `/staff/id_cards/${req.files.front_image[0].filename}`;
    }
    if (req.files?.back_image?.[0]) {
      removeFile("../uploads" + existingStaff.back_image);
      staffData.back_image = `/staff/id_cards/${req.files.back_image[0].filename}`;
    }

    // Parse face_encoding if it exists
    if (staffData.face_encoding) {
      try {
        staffData.face_encoding = JSON.parse(staffData.face_encoding);
      } catch (error) {
        console.error("Error parsing face_encoding:", error);
        return res.status(400).json({ error: "Invalid face encoding data" });
      }
    }

    // Update the staff member
    const updatedStaff = await Staff.findByIdAndUpdate(
      id,
      { $set: staffData },
      { new: true, runValidators: true }
    );

    res.json({
      message: "Staff updated successfully",
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    res.status(500).json({ error: "Server error" });
  }
};


const deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id; // This is the staff ID you want to delete
    const staffData = await Staff.findById(staffId);

    if (!staffData) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (staffData.photo) {
      console.log("Photo Found");
      const oldPhotoPath = path.join(
        __dirname,
        `../uploads/staff/profile/${staffData.photo}`
      );
      console.log("Old Path : ", oldPhotoPath);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      } else {
        console.log("Photo Not Found");
      }
    }

    if (staffData.front_image) {
      const oldFrontImagePath = path.join(
        __dirname,
        `../uploads/staff/id_cards/${staffData.front_image}`
      );
      if (fs.existsSync(oldFrontImagePath)) {
        fs.unlinkSync(oldFrontImagePath);
      }
    }

    if (staffData.back_image) {
      const oldBackImagePath = path.join(
        __dirname,
        `../uploads/staff/id_cards/${staffData.back_image}`
      );
      if (fs.existsSync(oldBackImagePath)) {
        fs.unlinkSync(oldBackImagePath);
      }
    }

    Staff.deleteOne({ _id: staffId })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
  }
};

const checkIn = async (req, res) => {
  const { staff_id, date, in_time } = req.body;
  try {
    const staff = await Staff.findById(staff_id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Check if attendance for today already exists
    const todayAttendance = staff.attandance.find((a) => a.date === date);

    if (todayAttendance) {
      todayAttendance.in_time = in_time;
      todayAttendance.status = "present";
    } else {
      staff.attandance.push({
        date,
        in_time,
        status: "present",
      });
    }

    await staff.save();
    res.status(200).json({ message: "Check-in successful" });
  } catch (error) {
    console.error("Error in Check-In:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Handle Check-Out
const checkOut = async (req, res) => {
  const { staff_id, date, out_time } = req.body;
  try {
    const staff = await Staff.findById(staff_id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const todayAttendance = staff.attandance.find((a) => a.date === date);

    if (todayAttendance) {
      todayAttendance.out_time = out_time;
    } else {
      // If somehow check-in was missed, create entry with only out_time
      staff.attandance.push({
        date,
        out_time,
        status: "present",
      });
    }

    await staff.save();
    res.status(200).json({ message: "Check-out successful" });
  } catch (error) {
    console.error("Error in Check-Out:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Handle Mark Absent
const markAbsent = async (req, res) => {
  const { staff_id, date } = req.body;
  try {
    const staff = await Staff.findById(staff_id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Check if already marked
    const todayAttendance = staff.attandance.find((a) => a.date === date);

    if (todayAttendance) {
      todayAttendance.status = "absent";
      todayAttendance.in_time = null;
      todayAttendance.out_time = null;
    } else {
      staff.attandance.push({
        date,
        status: "absent",
      });
    }

    await staff.save();
    res.status(200).json({ message: "Marked Absent successfully" });
  } catch (error) {
    console.error("Error in Mark Absent:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const getAllFaceEncodings = async (req, res) => {
  try {
    const staff = await Staff.find(
      {
        face_encoding: {
          $exists: true,
          $ne: null,
          $not: { $size: 0 },
        },
        user_id: req.user,
      },
      "_id staff_id f_name l_name email position face_encoding attandance"
    );

    res.json(staff);
  } catch (err) {
    console.error("Error fetching encodings:", err);
    res.status(500).json({ error: "Failed to fetch face encodings" });
  }
};

module.exports = {
  getStaffPositions,
  getStaffData,
  getStaffDataById,
  addStaff,
  updateStaff,
  deleteStaff,
  checkIn,
  checkOut,
  markAbsent,
  getAllFaceEncodings,
};
