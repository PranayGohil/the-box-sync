const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const { kioskLogin, kioskMe } = require("../controllers/kioskController");

const kioskRouter = express.Router();

// Public — no token needed to login
kioskRouter.post("/login", kioskLogin);

// Protected — requires the kiosk JWT issued on login
kioskRouter.get("/me", authMiddleware, kioskMe);

module.exports = kioskRouter;
