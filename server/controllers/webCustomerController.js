const WebCustomer = require('../models/webCustomerModel');
const bcrypt = require('bcryptjs');

exports.registerCustomer = async (req, res) => {
    try {
        const { restaurant_code, name, email, phone, password } = req.body;

        if (!restaurant_code || !name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }
        // Check if customer with same phone already exists
        const existingPhone = await WebCustomer.findOne({ phone, restaurant_code });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                message: 'User with this phone number already exists',
            });
        }

        const existingEmail = await WebCustomer.findOne({ email, restaurant_code });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists',
            });
        }

        const newCustomer = new WebCustomer({
            restaurant_code,
            name,
            email,
            phone,
            password,
        });

        await newCustomer.save();

        const token = await newCustomer.generateAuthToken();

        res.status(201).json({
            success: true,
            message: 'Customer added successfully',
            token,
            data: newCustomer,
        });
    } catch (error) {
        console.error('Error adding customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding customer',
            error: error.message,
        });
    }
};

exports.loginCustomer = async (req, res) => {
    try {
        const { restaurant_code, email, password } = req.body;

        if (!restaurant_code || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        const user = await WebCustomer.findOne({ email, restaurant_code });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const matchPass = await bcrypt.compare(password, user.password);
        if (!matchPass) {
            return res.status(400).json({
                success: false,
                message: 'Invalid password',
            });
        }

        const token = await user.generateAuthToken();
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            data: user,
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message,
        });
    }
};

exports.updateCustomer = async (req, res) => {};