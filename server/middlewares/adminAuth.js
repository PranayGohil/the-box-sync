const adminAuth = (req, res, next) => {
  try {
    console.log("User data:", req.user);
    if (req.user.Role !== "Admin") {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = adminAuth;
