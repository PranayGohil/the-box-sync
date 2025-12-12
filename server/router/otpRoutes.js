// routes/otpRoutes.js
const express = require('express');
const otpRouter = express.Router();
const otpController = require('../controllers/otpController');

// POST /user/send-verification
otpRouter.post('/send-verification', otpController.sendVerification);

// POST /user/verify-email
otpRouter.post('/verify-email', otpController.verifyCode);

module.exports = otpRouter;
