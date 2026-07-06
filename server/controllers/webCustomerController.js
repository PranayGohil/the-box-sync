const WebCustomer = require('../models/webCustomerModel');
const Menu = require('../models/menuModel');
const Order = require('../models/orderModel');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const Otp = require('../models/otpModel');
const { sendEmail } = require('../utils/emailService');

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

exports.getCustomer = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const customerData = {
            _id: customer._id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            addresses: customer.addresses,
            cart: customer.cart,
        };

        res.status(200).json({
            success: true,
            data: customerData,
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer',
            error: error.message,
        });
    }
}

exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone } = req.body;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        customer.name = name || customer.name;
        customer.email = email || customer.email;
        customer.phone = phone || customer.phone;

        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Customer updated successfully',
            data: customer,
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating customer',
            error: error.message,
        });
    }
};

exports.addAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            address, exact_location, city, state, country, pincode, tag, 
            place_id, formatted_address, latitude, longitude, 
            postal_code, locality, sublocality 
        } = req.body;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const latVal = latitude !== undefined && latitude !== '' ? Number(latitude) : undefined;
        const lngVal = longitude !== undefined && longitude !== '' ? Number(longitude) : undefined;

        customer.addresses.push({
            address,
            exact_location,
            city,
            state,
            country,
            pincode,
            tag: tag || "Home",
            place_id,
            formatted_address,
            latitude: latVal,
            longitude: lngVal,
            postal_code,
            locality,
            sublocality,
            location: (latVal && lngVal) ? {
                type: "Point",
                coordinates: [lngVal, latVal]
            } : undefined
        });

        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Address added successfully',
            data: customer,
        });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding address',
            error: error.message,
        });
    }
};

exports.editAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            addressId, address, city, state, country, pincode, tag, 
            place_id, formatted_address, latitude, longitude, 
            postal_code, locality, sublocality 
        } = req.body;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const addressIndex = customer.addresses.findIndex((addr) => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        const oldAddr = customer.addresses[addressIndex].toObject ? customer.addresses[addressIndex].toObject() : customer.addresses[addressIndex];
        const latVal = latitude !== undefined && latitude !== '' ? Number(latitude) : oldAddr.latitude;
        const lngVal = longitude !== undefined && longitude !== '' ? Number(longitude) : oldAddr.longitude;

        customer.addresses[addressIndex] = {
            ...oldAddr,
            address,
            city,
            state,
            country,
            pincode,
            tag: tag || oldAddr.tag || "Home",
            place_id: place_id || oldAddr.place_id,
            formatted_address: formatted_address || oldAddr.formatted_address,
            latitude: latVal,
            longitude: lngVal,
            postal_code: postal_code || oldAddr.postal_code,
            locality: locality || oldAddr.locality,
            sublocality: sublocality || oldAddr.sublocality,
            location: (latVal && lngVal) ? {
                type: "Point",
                coordinates: [lngVal, latVal]
            } : oldAddr.location
        };

        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: customer,
        });
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating address',
            error: error.message,
        });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { addressId } = req.body;
	console.log("Address Id : ", addressId)
        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const addressIndex = customer.addresses.findIndex((addr) => addr._id.toString() === addressId);
        if (addressIndex === -1) {
	console.log("Address Not Found")
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        customer.addresses.splice(addressIndex, 1);

        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
            data: customer,
        });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting address',
            error: error.message,
        });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { id } = req.params;
        const { dish_id, quantity } = req.body;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const menu = await Menu.findOne({ "dishes._id": dish_id });
        if (!menu) {
            return res.status(404).json({
                success: false,
                message: 'Dish not found',
            });
        }

        const product = menu.dishes.find((d) => d._id.toString() === dish_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        const existingCartItem = customer.cart.find((item) => item.dish_id.toString() === dish_id);
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
            console.log(existingCartItem);
            customer.cart[customer.cart.indexOf(existingCartItem)] = existingCartItem;
            await customer.save();

            res.status(200).json({
                success: true,
                message: 'Product quantity updated in cart successfully',
                data: customer,
            });
        } else {
            customer.cart.push({
                dish_id: product._id,
                quantity,
            });

            await customer.save();

            res.status(200).json({
                success: true,
                message: 'Product added to cart successfully',
                data: customer,
            })
        }

    } catch (error) {
        console.error('Error adding product to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding product to cart',
            error: error.message,
        });
    }
};

exports.getCart = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await WebCustomer.findById(id).populate('cart.dish_id');
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        res.status(200).json({
            success: true,
            data: customer.cart,
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart',
            error: error.message,
        });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { id } = req.params;
        const { dish_id } = req.body;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const productIndex = customer.cart.findIndex((item) => item.dish_id.toString() === dish_id);
        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart',
            });
        }

        customer.cart.splice(productIndex, 1);

        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Product removed from cart successfully',
            data: customer,
        });
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing product from cart',
            error: error.message,
        });
    }
}

exports.updateCart = async (req, res) => {
    try {
        const { id } = req.params;
        const { dish_id, quantity } = req.body;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const productIndex = customer.cart.findIndex((item) => item.dish_id.toString() === dish_id);
        if (productIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Product not found in cart',
            });
        }
        console.log(customer.cart[productIndex].quantity + " And " + quantity);
        customer.cart[productIndex].quantity = quantity;
        console.log(customer.cart);

        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Product quantity updated in cart successfully',
            data: customer,
        });
    } catch (error) {
        console.error('Error updating product quantity in cart:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product quantity in cart',
            error: error.message,
        });
    }
}
exports.getCustomerOrders = async (req, res) => {
    try {
        const { id } = req.params;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        const orders = await Order.find({ customer_id: id }).sort({ _id: -1 });
        if (!orders) {
            return res.status(404).json({
                success: false,
                message: 'Orders not found',
            });
        }

        res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer orders',
            error: error.message,
        });
    }
};

exports.getCustomerOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const orderData = await Order.findById(orderId);
        if (!orderData) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        let responseData = orderData.toObject();

        if (orderData.customer_id) {
            let customerData = await WebCustomer.findById(orderData.customer_id);
            if (customerData) {
                const customerObj = customerData.toObject();
                if (!customerObj.address && Array.isArray(customerObj.addresses) && customerObj.addresses.length > 0) {
                    const defaultAddr = customerObj.addresses.find(a => a.is_default) || customerObj.addresses[0];
                    customerObj.address = `${defaultAddr.address}, ${defaultAddr.city}, ${defaultAddr.pincode}`;
                }
                responseData.customer_details = customerObj;
            }
        }

        res.status(200).json({
            success: true,
            data: responseData,
        });
    } catch (error) {
        console.error('Error fetching customer order details:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer order details',
            error: error.message,
        });
    }
};

function generateOtp(length = 6) {
    let otp = '';
    while (otp.length < length) {
        const byte = crypto.randomBytes(1)[0] % 10;
        otp += byte.toString();
    }
    return otp.slice(0, length);
}

exports.requestOtp = async (req, res) => {
    try {
        const { email, restaurant_code } = req.body;
        if (!email || !restaurant_code) {
            return res.status(400).json({ success: false, message: 'Email and restaurant code are required' });
        }

        let customer = await WebCustomer.findOne({ email, restaurant_code });
        if (!customer) {
            // Auto-register a new web customer record with placeholder values
            customer = new WebCustomer({
                restaurant_code,
                email,
                name: '',
                phone: '',
                password: crypto.randomBytes(16).toString('hex'), // satisfies save hook
            });
            await customer.save();
        }

        const otpPlain = generateOtp(6);
        const codeHash = await bcrypt.hash(otpPlain, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

        const otpDoc = new Otp({
            email,
            codeHash,
            purpose: 'web_customer_login',
            expiresAt,
        });
        await otpDoc.save();

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background: #f27a1a; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
              <h2 style="color: #fff; margin: 0;">Verify Your Email</h2>
            </div>
            <div style="padding: 24px; background: #fafafa;">
              <p style="color: #333; font-size: 16px;">Hi there,</p>
              <p style="color: #555;">Please use the following One Time Password (OTP) to log in to your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="background: #f27a1a; color: #fff; padding: 12px 24px; font-size: 28px; font-weight: bold; border-radius: 6px; letter-spacing: 4px;">${otpPlain}</span>
              </div>
              <p style="color: #555; text-align: center;">This code will expire in <strong>10 minutes</strong>.</p>
              <p style="color: #555; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
              <p style="color: #555; margin-top: 24px;">Best regards,<br><strong>The TheBox Team</strong></p>
            </div>
          </div>
        `;

        try {
            await sendEmail({
                to: email,
                subject: "Login Verification Code",
                html: emailHtml,
            });
        } catch (mailErr) {
            console.error('Mail send failed, logging to console:', mailErr);
            console.log(`\n===============================================\n[DEVELOPMENT OTP] Verification Code for ${email} is: ${otpPlain}\n===============================================\n`);
        }

        res.status(200).json({ success: true, message: 'Verification code sent successfully' });
    } catch (error) {
        console.error('Error in requestOtp:', error);
        res.status(500).json({ success: false, message: 'Failed to request verification code', error: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { email, code, restaurant_code } = req.body;
        if (!email || !code || !restaurant_code) {
            return res.status(400).json({ success: false, message: 'Email, verification code, and restaurant code are required' });
        }

        const customer = await WebCustomer.findOne({ email, restaurant_code });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Find latest valid OTP for this email
        const now = new Date();
        const otpDoc = await Otp.findOne({
            email,
            purpose: 'web_customer_login',
            expiresAt: { $gt: now },
        }).sort({ createdAt: -1 }).exec();

        if (!otpDoc) {
            return res.status(400).json({ success: false, message: 'No active verification code found or it has expired' });
        }

        if (otpDoc.attempts >= 5) {
            return res.status(429).json({ success: false, message: 'Too many failed verification attempts. Please request a new code.' });
        }

        const match = await bcrypt.compare(String(code), otpDoc.codeHash);
        if (!match) {
            otpDoc.attempts = (otpDoc.attempts || 0) + 1;
            await otpDoc.save();
            return res.status(400).json({ success: false, message: 'Invalid verification code' });
        }

        otpDoc.verified = true;
        await otpDoc.save();

        const token = await customer.generateAuthToken();
        res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            token,
            data: customer,
        });
    } catch (error) {
        console.error('Error in verifyOtp:', error);
        res.status(500).json({ success: false, message: 'Verification failed', error: error.message });
    }
};
