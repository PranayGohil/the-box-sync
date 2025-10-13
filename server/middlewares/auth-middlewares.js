const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) {  
      const user = jwt.verify(token, process.env.JWT_SECRETKEY);
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  } catch (error) {
    console.log(error.message);
    res.send("Null");
  }
};

module.exports = authMiddleware;
