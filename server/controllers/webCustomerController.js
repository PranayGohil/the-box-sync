const WebCustomer = require('../models/webCustomerModel');
const Menu = require('../models/menuModel');
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
        const { address, city, state, country, pincode } = req.body;

        const customer = await WebCustomer.findById(id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found',
            });
        }

        customer.addresses.push({
            address,
            city,
            state,
            country,
            pincode,
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
        const { addressId, address, city, state, country, pincode } = req.body;

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

        customer.addresses[addressIndex] = {
            ...customer.addresses[addressIndex],
            address,
            city,
            state,
            country,
            pincode,
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
            data: customer,
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