const Customer = require("../models/customerModel");
// const HotelBooking = require("../models/hotelBookingModel");

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

// ── QSR Customer List (aggregated from orders) ────────────────────────────────
exports.getQSRCustomerList = async (req, res) => {
  try {
    const Order = require("../models/orderModel");
    const user_id = req.user._id
      ? req.user._id.toString()
      : req.user.toString();

    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "total_orders",
      sortOrder = "desc",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;
    const sortDir = sortOrder === "asc" ? 1 : -1;

    // Allowed sort fields mapped to aggregation field names
    const sortFieldMap = {
      total_orders: "total_orders",
      total_amount: "total_amount",
      last_order_date: "last_order_date",
    };
    const sortField = sortFieldMap[sortBy] || "total_orders";

    // Base match — scoped to this restaurant and only orders with a phone number
    const baseMatch = {
      user_id: user_id,
      customer_phone: { $exists: true, $nin: [null, ""] },
    };

    // If search is provided, filter by phone or name
    if (search && search.trim() !== "") {
      baseMatch.$or = [
        { customer_name: { $regex: search.trim(), $options: "i" } },
        { customer_phone: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Aggregation pipeline
    const aggregationPipeline = [
      { $match: baseMatch },
      {
        $group: {
          _id: "$customer_phone",
          name: { $last: "$customer_name" },
          phone: { $first: "$customer_phone" },
          total_orders: { $sum: 1 },
          total_amount: { $sum: { $ifNull: ["$total_amount", 0] } },
          last_order_date: { $max: "$order_date" },
          first_order_date: { $min: "$order_date" },
          // Track order type frequency to find the most used
          order_types: { $push: "$order_type" },
        },
      },
      {
        $addFields: {
          // Pick the first element when sorted (most frequent type will be first after $sort)
          most_used_type: {
            $let: {
              vars: {
                types: "$order_types",
              },
              in: {
                $ifNull: [
                  { $arrayElemAt: ["$order_types", 0] },
                  "Takeaway",
                ],
              },
            },
          },
        },
      },
      { $sort: { [sortField]: sortDir } },
    ];

    // Count total distinct customers (for pagination)
    const countPipeline = [
      { $match: baseMatch },
      { $group: { _id: "$customer_phone" } },
      { $count: "total" },
    ];

    // Summary pipeline
    const summaryPipeline = [
      { $match: { user_id: user_id } },
      {
        $group: {
          _id: null,
          total_orders: { $sum: 1 },
          total_revenue: { $sum: { $ifNull: ["$total_amount", 0] } },
        },
      },
    ];
    const distinctCustomerCountPipeline = [
      { $match: { user_id: user_id, customer_phone: { $exists: true, $nin: [null, ""] } } },
      { $group: { _id: "$customer_phone" } },
      { $count: "total" },
    ];

    const [rawData, countResult, summaryResult, customerCountResult] = await Promise.all([
      Order.aggregate([...aggregationPipeline, { $skip: skip }, { $limit: limitNum }]),
      Order.aggregate(countPipeline),
      Order.aggregate(summaryPipeline),
      Order.aggregate(distinctCustomerCountPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const pages = Math.ceil(total / limitNum);
    const summaryRaw = summaryResult[0] || {};
    const totalCustomers = customerCountResult[0]?.total || 0;

    // Derive most_used_type from order_types array (simple mode calculation)
    const data = rawData.map((c) => {
      const types = c.order_types || [];
      const freq = {};
      types.forEach((t) => { if (t) freq[t] = (freq[t] || 0) + 1; });
      const most_used_type = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0] || null;
      return {
        name: c.name || null,
        phone: c.phone,
        total_orders: c.total_orders,
        total_amount: parseFloat((c.total_amount || 0).toFixed(2)),
        last_order_date: c.last_order_date,
        first_order_date: c.first_order_date,
        most_used_type,
      };
    });

    return res.status(200).json({
      success: true,
      data,
      total,
      page: pageNum,
      pages,
      summary: {
        total_customers: totalCustomers,
        total_orders: summaryRaw.total_orders || 0,
        total_revenue: parseFloat((summaryRaw.total_revenue || 0).toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error fetching QSR customer list:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching customer list",
      error: error.message,
    });
  }
};

// ── QSR Customer Orders (all orders for a phone number) ───────────────────────
exports.getQSRCustomerOrders = async (req, res) => {
  try {
    const Order = require("../models/orderModel");
    const user_id = req.user._id
      ? req.user._id.toString()
      : req.user.toString();

    const { phone } = req.params;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    const orders = await Order.find({
      user_id: user_id,
      customer_phone: phone,
    }).sort({ order_date: -1 }).lean();

    if (orders.length === 0) {
      return res.status(200).json({
        success: true,
        customer: { phone },
        summary: { total_orders: 0, total_amount: 0, first_order: null, last_order: null },
        orders: [],
      });
    }

    // Build summary
    const totalAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
    const dates = orders.map((o) => new Date(o.order_date));
    const firstOrder = new Date(Math.min(...dates));
    const lastOrder = new Date(Math.max(...dates));

    // Normalise order fields for the frontend
    const normalisedOrders = orders.map((o) => ({
      _id: o._id,
      token: o.token,
      order_number: o.order_no,
      order_type: o.order_type,
      status: o.order_status,
      payment_type: o.payment_type,
      created_at: o.order_date,
      items: o.order_items || [],
      sub_total: o.sub_total || 0,
      cgst_amount: o.cgst_amount || 0,
      sgst_amount: o.sgst_amount || 0,
      vat_amount: o.vat_amount || 0,
      discount_amount: o.discount_amount || 0,
      waveoff_amount: o.waveoff_amount || 0,
      total: o.total_amount || 0,
      table_no: o.table_no,
      waiter: o.waiter,
      comment: o.comment,
    }));

    return res.status(200).json({
      success: true,
      customer: {
        name: orders[0]?.customer_name || null,
        phone,
      },
      summary: {
        total_orders: orders.length,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        first_order: firstOrder,
        last_order: lastOrder,
      },
      orders: normalisedOrders,
    });
  } catch (error) {
    console.error("Error fetching QSR customer orders:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching customer orders",
      error: error.message,
    });
  }
};
