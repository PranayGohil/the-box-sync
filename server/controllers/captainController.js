const Captain = require("../models/captainModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const addCaptain = (req, res) => {
  try {
    const captainData = { ...req.body, user_id: req.user };
    console.log(captainData);
    Captain.create(captainData)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getCaptainData = (req, res) => {
  try {
    Captain.find({ user_id: req.user })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getCaptainDataById = (req, res) => {
  try {
    Captain.findById(req.params.id)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const updateCaptain = (req, res) => {
  try {
    const captainData = { ...req.body, user_id: req.user };
    console.log(captainData);
    Captain.findByIdAndUpdate(req.params.id, captainData, { new: true })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const deleteCaptain = async (req, res) => {
  const { captainId, adminPassword } = req.body;

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

    // Delete the captain
    await Captain.findByIdAndDelete(captainId);
    res.status(200).json({ message: "Captain deleted successfully." });
  } catch (error) {
    console.error("Error deleting captain:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changeCaptainPassword = async (req, res) => {
  const { adminPassword, newPassword, captainId } = req.body;
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

    // Hash new password and update captain password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Captain.findByIdAndUpdate(captainId, { password: hashedPassword });

    res.status(200).json({ message: "Captain password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

const captainLogin = async (req, res) => {
  try {
    console.log(req.body);
    const { restaurant_code, username, password } = req.body;

    const user = await User.findOne({ restaurant_code });

    if (!user) {
      console.log("User not found");
      return res.json({ message: "Invalid restaurant code" });
    }
    console.log("captain : " + user);

    const captain = await Captain.findOne({
      username: username,
      user_id: user._id,
    });

   

    if (!captain) {
      return res.json({ message: "Invalid Username" });
    }

    const isMatch = await bcrypt.compare(password, captain.password);

    if (!isMatch) {
      return res.json({ message: "Invalid Password" });
    }

    token = await user.generateAuthToken("Captain");
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
  addCaptain,
  getCaptainData,
  getCaptainDataById,
  updateCaptain,
  deleteCaptain,
  changeCaptainPassword,
  captainLogin,
};
