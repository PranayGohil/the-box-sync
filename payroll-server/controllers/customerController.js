const Customer = require("../models/customerModel");
const HotelBooking = require("../models/hotelBookingModel");

// Add new customer
exports.addCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      id_proof,
      date_of_birth,
      anniversary,
      tag,
    } = req.body;
    const user_id = req.user;

    // Check if customer with same phone already exists
    const existingCustomer = await Customer.findOne({ user_id, phone });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this phone number already exists",
      });
    }

    const newCustomer = new Customer({
      user_id,
      name,
      email,
      phone,
      address,
      id_proof,
      date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
      anniversary: anniversary ? new Date(anniversary) : null,
      tag: tag || [],
    });

    await newCustomer.save();

    res.status(201).json({
      success: true,
      message: "Customer added successfully",
      data: newCustomer,
    });
  } catch (error) {
    console.error("Error adding customer:", error);
    res.status(500).json({
      success: false,
      message: "Error adding customer",
      error: error.message,
    });
  }
};

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const user_id = req.user;
    const { search } = req.query;

    const query = { user_id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const customers = await Customer.find(query).sort({ _id: -1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customers",
      error: error.message,
    });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;

    const customer = await Customer.findOne({ _id: id, user_id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer",
      error: error.message,
    });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;
    const {
      name,
      email,
      phone,
      address,
      id_proof,
      date_of_birth,
      anniversary,
      tag,
    } = req.body;

    const customer = await Customer.findOne({ _id: id, user_id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if phone is being changed and if it's already taken
    if (phone && phone !== customer.phone) {
      const existingCustomer = await Customer.findOne({
        _id: { $ne: id },
        user_id,
        phone,
      });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: "Phone number already exists",
        });
      }
    }

    const updateData = {
      ...(name && { name }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(id_proof && { id_proof }),
      ...(date_of_birth && { date_of_birth: new Date(date_of_birth) }),
      ...(anniversary && { anniversary: new Date(anniversary) }),
      ...(tag && { tag }),
    };

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      message: "Error updating customer",
      error: error.message,
    });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;

    const customer = await Customer.findOne({ _id: id, user_id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if customer has any bookings
    const bookingCount = await HotelBooking.countDocuments({ customer_id: id });

    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete customer with existing bookings",
      });
    }

    await Customer.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting customer",
      error: error.message,
    });
  }
};

// Get customer booking history
exports.getCustomerBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user;

    const customer = await Customer.findOne({ _id: id, user_id });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const bookings = await HotelBooking.find({ customer_id: id })
      .populate("room_id")
      .populate("category_id")
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      customer: customer,
      bookings: bookings,
    });
  } catch (error) {
    console.error("Error fetching customer bookings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching customer bookings",
      error: error.message,
    });
  }
};
