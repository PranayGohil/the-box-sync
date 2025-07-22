const Manager = require("../models/managerModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const addManager = (req, res) => {
  try {
    console.log("Hello" + req.body);
    const managerData = { ...req.body, restaurant_id: req.user };
    console.log(managerData);
    Manager.create(managerData)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const managerLogin = async (req, res) => {
  try {
    console.log(req.body);
    const { restaurant_code, username, password } = req.body;

    const user = await User.findOne({ restaurant_code });

    if (!user) {
      console.log("User not found");
      return res.json({ message: "Invalid restaurant code" });
    }
    console.log("user : " + user);
    const manager = await Manager.findOne({
      username,
      restaurant_id: user._id,
    });

    if (!manager) {
      return res.json({ message: "Invalid Username" });
    }

    const isMatch = await bcrypt.compare(password, manager.password);

    if (!isMatch) {
      return res.json({ message: "Invalid Password" });
    }

    token = await user.generateAuthToken("Manager");
    res.cookie("jwttoken", token, {
      expires: new Date(Date.now() + 25892000000),
      httpOnly: true,
    });

    res.status(200).json({ message: "Logged In", token });
  } catch (error) {
    console.log(error);
  }
};

const getManagerData = async (req, res) => {
  try {
    if (req.user != null) {
      const manager = req.user;
      const managerdata = await Manager.find({ restaurant_id: manager._id });
      res.send(managerdata);
    } else {
      res.send("Null");
    }
  } catch (error) {
    console.log(error);
  }
};

const getManagerDataById = async (req, res) => {
  try {
    const manager = await Manager.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    res.json(manager);
  } catch (error) {
    console.error("Error fetching manager:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateManager = async (req, res) => {
  try {
    const { id } = req.params;
    const manager = await Manager.findById(id);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }
    const updatedManager = await Manager.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );
    res.json(updatedManager);
  } catch (error) {
    console.error("Error updating manager:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteManager = async (req, res) => {
  console.log("Delete Manager : ", req.body);
  const { managerId, adminPassword } = req.body;
  console.log("Manager Id : ", adminPassword);

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

    // Delete the manager
    await Manager.findByIdAndDelete(managerId);
    console.log("Manager deleted successfully.");
    res.status(200).json({ message: "Manager deleted successfully." });
  } catch (error) {
    console.error("Error deleting manager:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const changeManagerPassword = async (req, res) => {
  const { adminPassword, newPassword, managerId } = req.body;

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

    // Hash new password and update manager password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await Manager.findByIdAndUpdate(managerId, { password: hashedPassword });

    res.status(200).json({ message: "Manager password updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred." });
  }
};

module.exports = {
  addManager,
  managerLogin,
  getManagerData,
  getManagerDataById,
  updateManager,
  deleteManager,
  changeManagerPassword,
};
