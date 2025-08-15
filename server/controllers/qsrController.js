const QSR = require("../models/QSRModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const addQSR = (req, res) => {
  try {
    const qsrData = { ...req.body, restaurant_id: req.user };
    console.log(qsrData);
    QSR.create(qsrData)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getQSRData = (req, res) => {
  try {
    QSR.find({ restaurant_id: req.user })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getQSRDataById = (req, res) => {
  try {
    QSR.findById(req.params.id)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const updateQSR = (req, res) => {
  try {
    const qsrData = { ...req.body, restaurant_id: req.user };
    console.log(qsrData);
    QSR.findByIdAndUpdate(req.params.id, qsrData, { new: true })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const deleteQSR = async (req, res) => {
  const { qsrId, adminPassword } = req.body;

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

    // Delete the qsr
    await QSR.findByIdAndDelete(qsrId);
    res.status(200).json({ message: "QSR deleted successfully." });
  } catch (error) {
    console.error("Error deleting qsr:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changeQSRPassword = async (req, res) => {
  const { adminPassword, newPassword, qsrId } = req.body;
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

    // Hash new password and update qsr password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await QSR.findByIdAndUpdate(qsrId, { password: hashedPassword });

    res.status(200).json({ message: "Qsr password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

const qsrLogin = async (req, res) => {
  try {
    console.log(req.body);
    const { restaurant_code, username, password } = req.body;

    const user = await User.findOne({ restaurant_code });

    if (!user) {
      console.log("User not found");
      return res.json({ message: "Invalid restaurant code" });
    }
    console.log("user : " + user);
    const qsr = await QSR.findOne({
      username,
      restaurant_id: user._id,
    });

    if (!qsr) {
      return res.json({ message: "Invalid Username" });
    }

    const isMatch = await bcrypt.compare(password, qsr.password);

    if (!isMatch) {
      return res.json({ message: "Invalid Password" });
    }

    token = await user.generateAuthToken("QSR");
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
  addQSR,
  getQSRData,
  getQSRDataById,
  updateQSR,
  deleteQSR,
  changeQSRPassword,
  qsrLogin,
};
