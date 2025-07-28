const jwt = require("jsonwebtoken");

const superAdminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username === process.env.SUPER_ADMIN_USERNAME &&
      password === process.env.SUPER_ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { superEmail: process.env.SUPER_ADMIN_EMAIL, Role: "Super Admin" },
        process.env.JWT_SECRETKEY,
        { expiresIn: "30d" }
      );
      // Optional: set a session or cookie
      res.cookie("jwttoken", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 86400000,
      });

      return res.status(200).json({ message: "Login successful" });
    }

    return res.status(401).json({ message: "Invalid credentials" });
  } catch (error) {
    console.error("Super Admin Login Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { superAdminLogin };
