const Attendance = require("../models/attendanceModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const addAttendance = (req, res) => {
  try {
    const attendanceData = { ...req.body, restaurant_id: req.user };
    console.log(attendanceData);
    Attendance.create(attendanceData)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getAttendanceData = (req, res) => {
  try {
    Attendance.find({ restaurant_id: req.user })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getAttendanceDataById = (req, res) => {
  try {
    Attendance.findById(req.params.id)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const updateAttendance = (req, res) => {
  try {
    const attendanceData = { ...req.body, restaurant_id: req.user };
    console.log(attendanceData);
    Attendance.findByIdAndUpdate(req.params.id, attendanceData, { new: true })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const deleteAttendance = async (req, res) => {
  const { attendanceId, adminPassword } = req.body;

  try {
    // Verify admin password
    const admin = await User.findById(req.user);
    if (!admin) {
      console.log("Admin not found");
      return res.status(404).json({ message: "Admin not found." });
    }

    // Compare the entered password with the admin's hashed password
    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!isMatch) {
      console.log("Invalid admin password");
      return res.status(401).json({ message: "Invalid admin password." });
    }

    // Delete the attendance
    await Attendance.findByIdAndDelete(attendanceId);
    res.status(200).json({ message: "Attendance deleted successfully." });
  } catch (error) {
    console.error("Error deleting attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changeAttendancePassword = async (req, res) => {
  const { adminPassword, newPassword, attendanceId } = req.body;
  try {
    // Verify admin password
    const admin = await User.findById(req.user);
    if (!admin) {
      console.log("Admin not found");
      return res.status(404).json({ message: "Admin not found." });
    }

    // Compare the entered password with the admin's hashed password
    const isMatch = await bcrypt.compare(adminPassword, admin.password);
    if (!isMatch) {
      console.log("Invalid admin password");
      return res.status(401).json({ message: "Invalid admin password." });
    }

    // Hash new password and update attendance password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Attendance.findByIdAndUpdate(attendanceId, { password: hashedPassword });

    res.status(200).json({ message: "Attendance password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

const attendanceLogin = async (req, res) => {
  try {
    console.log(req.body);
    const { restaurant_code, username, password } = req.body;

    const user = await User.findOne({ restaurant_code });

    if (!user) {
      console.log("User not found");
      return res.json({ message: "Invalid restaurant code" });
    }
    console.log("user : " + user);
    const attendance = await Attendance.findOne({
      username,
      restaurant_id: user._id,
    });

    if (!attendance) {
      return res.json({ message: "Invalid Username" });
    }

    const isMatch = await bcrypt.compare(password, attendance.password);

    if (!isMatch) {
      return res.json({ message: "Invalid Password" });
    }

    token = await user.generateAuthToken("Attendance");
    res.cookie("jwttoken", token, {
      expires: new Date(Date.now() + 25892000000),
      httpOnly: true,
    });

    res.status(200).json({ message: "Logged In", token });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  addAttendance,
  getAttendanceData,
  getAttendanceDataById,
  updateAttendance,
  deleteAttendance,
  changeAttendancePassword,
  attendanceLogin,
};
