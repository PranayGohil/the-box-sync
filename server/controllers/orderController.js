const Order = require("../models/orderModel");
const Customer = require("../models/customerModel");
const TokenCounter = require("../models/TokenCounter");
const Table = require("../models/tableModel");

const cron = require("node-cron");

cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date();
    const dateOnly = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    await TokenCounter.deleteMany({ date: { $lt: dateOnly } });
    console.log("Token counter reset successfully.");
  } catch (error) {
    console.error("Error resetting token counter:", error);
  }
});

const addCustomer = (req, res) => {
  try {
    const customerData = { ...req.body, user_id: req.user };
    Customer.create(customerData)
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getCustomerData = (req, res) => {
  try {
    Customer.find({ _id: req.params.id })
      .then((data) => res.json(data))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

const getOrderData = async (req, res) => {
  console.log(req.user);
  try {
    // Find the order first
    const orderData = await Order.findById(req.params.id);

    if (!orderData) {
      return res.json({
        success: false,
        message: "Order not found",
      });
    }

    let responseData = orderData.toObject();

    // If order has customer_id, fetch customer details
    if (orderData.customer_id) {
      const customerData = await Customer.findById(orderData.customer_id);

      if (customerData) {
        responseData.customer_details = customerData;
      }
    }

    res.json({
      data: responseData,
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const getActiveOrders = async (req, res) => {
  try {
    const { source } = req.body;
    console.log("Source : ", source);

    if (!source)
      return res.status(400).json({ message: "Source not provided" });

    let activeDineInTables = [];
    if (source === "Manager") {
      // Active Dine In Tables
      activeDineInTables = await Order.find({
        order_type: "Dine In",
        order_status: { $in: ["KOT", "Save"] },
        user_id: req.user,
      });
    }

    if (source === "QSR") {
      // Active Dine In Tables
      activeDineInTables = await Order.find({
        order_type: "Dine In",
        $or: [
          { order_status: { $ne: "Paid" } },
          { "order_items.status": "Preparing" },
        ],
        user_id: req.user,
        order_source: source,
      });
    }

    // Active Takeaways & Deliveries
    const activeTakeawaysAndDeliveries = await Order.find({
      order_type: { $in: ["Takeaway", "Delivery"] },
      $or: [
        { order_status: { $ne: "Paid" } },
        { "order_items.status": "Preparing" },
      ],
      user_id: req.user,
      order_source: source,
    });

    res.json({
      activeDineInTables,
      activeTakeawaysAndDeliveries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

const generateToken = async (user_id, source) => {
  const today = new Date();
  const dateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let tokenCounter = await TokenCounter.findOne({
    date: dateOnly,
    user_id,
    source,
  });

  if (!tokenCounter) {
    tokenCounter = new TokenCounter({
      date: dateOnly,
      lastToken: 0,
      user_id: user_id,
      source: source,
    });
  }

  tokenCounter.lastToken += 1;
  await tokenCounter.save();

  return tokenCounter.lastToken;
};

const handleDineInOrder = async (orderId, orderInfo, tableId) => {
  const tableDocument = await Table.findOne({ "tables._id": tableId });
  if (!tableDocument) throw new Error("Table not found");

  const table = tableDocument.tables.id(tableId);
  if (!table) throw new Error("Table not found");

  let savedOrder;

  if (table.current_status === "Empty" || table.order_id === null) {
    // New order
    const newOrder = new Order(orderInfo);
    savedOrder = await newOrder.save();

    table.current_status = savedOrder.order_status;
    table.order_id = savedOrder._id;
  } else {
    // Existing order
    savedOrder = await Order.findByIdAndUpdate(table.order_id, orderInfo, {
      new: true,
    });
    if (!savedOrder) throw new Error("Order not found");

    if (savedOrder.order_status !== "Paid") {
      table.current_status = savedOrder.order_status;
    } else {
      table.current_status = "Empty";
      table.order_id = null;
    }
  }

  await tableDocument.save();

  return { order: savedOrder, table: tableDocument };
};

const clearTable = async (tableId) => {
  try {
    await Table.findByIdAndUpdate(tableId, {
      current_status: "",
      order_id: null,
    });
  } catch (error) {
    console.error("Error clearing table:", error);
  }
};

const updateTableStatus = async (tableId, status, orderId = null) => {
  try {
    await Table.findByIdAndUpdate(tableId, {
      current_status: status,
      order_id: orderId,
    });
  } catch (error) {
    console.error("Error updating table status:", error);
  }
};

const orderController = async (req, res) => {
  try {
    console.log(req.body);

    let { orderInfo, table_id: tableId, customerInfo } = req.body;
    const orderId = orderInfo.order_id;
    orderInfo.user_id = req.user;

    let savedOrder;

    // ✅ 1. Save customer if provided
    if (customerInfo && (customerInfo.phone || customerInfo.email)) {
      const customer = new Customer(customerInfo);
      const savedCustomer = await customer.save();
      orderInfo.customer_id = savedCustomer._id;
    }

    // ✅ 2. Update item statuses based on order status
    if (orderInfo.order_status === "KOT" || orderInfo.order_source === "QSR") {
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? "Preparing" : item.status,
      }));
    }

    if (orderInfo.order_status === "Cancelled") {
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: "Cancelled",
      }));

      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
        new: true,
      });

      if (!savedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // 🧹 Also empty the table if dine-in order
      if (orderInfo.order_type === "Dine In" && tableId) {
        await clearTable(tableId);
      }

      return res.status(200).json({
        status: "success",
        message: "Order cancelled successfully",
        order: savedOrder,
      });
    }

    // ✅ 3. Handle Dine In
    if (orderInfo.order_type === "Dine In") {
      if (!tableId) {
        return res
          .status(400)
          .json({ message: "Table ID is required for Dine In orders" });
      }

      savedOrder = await handleDineInOrder(orderId, orderInfo, tableId);
      return res.status(200).json({
        status: "success",
        message: "Order processed successfully",
        order: savedOrder.order,
        table: savedOrder.table,
      });
    }

    // ✅ 4. Handle Takeaway & QSR Dine In
    if (["Takeaway", "QSR Dine In"].includes(orderInfo.order_type)) {
      // Generate token if new order
      if (!orderId) {
        orderInfo.token = await generateToken(req.user, orderInfo.order_source);
      }
    }

    if (orderId) {
      // Existing order: update
      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
        new: true,
      });
      if (!savedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      return res.status(200).json({
        status: "success",
        message: "Order updated successfully",
        order: savedOrder,
      });
    } else {
      // New order
      const newOrder = new Order(orderInfo);
      savedOrder = await newOrder.save();
      return res.status(200).json({
        status: "success",
        message: "Order created successfully",
        order: savedOrder,
        orderId: savedOrder._id,
      });
    }
  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const dineInController = async (req, res) => {
  try {
    console.log("Dine-in order request:", req.body);

    let { orderInfo, table_id: tableId, customerInfo } = req.body;
    const orderId = orderInfo.order_id;
    orderInfo.user_id = req.user;

    // if (!tableId) {
    //   console.error("Table ID is required for Dine In orders");
    //   return res
    //     .status(400)
    //     .json({ message: "Table ID is required for Dine In orders" });
    // }

    let savedOrder;
    let savedCustomer;

    // ✅ 1. Save customer if provided
    if (
      customerInfo &&
      (customerInfo.phone || customerInfo.email || customerInfo.name)
    ) {
      try {
        // Check if customer already exists
        let existingCustomer = null;
        if (customerInfo.phone) {
          existingCustomer = await Customer.findOne({
            phone: customerInfo.phone,
          });
        } else if (customerInfo.email) {
          existingCustomer = await Customer.findOne({
            email: customerInfo.email,
          });
        }

        if (existingCustomer) {
          // Update existing customer
          savedCustomer = await Customer.findByIdAndUpdate(
            existingCustomer._id,
            customerInfo,
            { new: true }
          );
        } else {
          // Create new customer
          const customer = new Customer(customerInfo);
          savedCustomer = await customer.save();
        }

        orderInfo.customer_id = savedCustomer._id;
      } catch (error) {
        console.error("Error handling customer:", error);
      }
    }

    // ✅ 2. Update item statuses based on order status
    if (orderInfo.order_status === "KOT") {
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? "Preparing" : item.status,
      }));
    }

    // ✅ 3. Handle order cancellation
    if (orderInfo.order_status === "Cancelled") {
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: "Cancelled",
      }));

      if (orderId) {
        savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
          new: true,
        });
        if (!savedOrder) {
          console.error("Order not found for cancellation");
          return res.status(404).json({ message: "Order not found" });
        }
      }

      // Clear the table
      await clearTable(tableId);

      return res.status(200).json({
        status: "success",
        message: "Order cancelled successfully",
        order: savedOrder,
      });
    }

    // ✅ 4. Handle existing order update
    if (orderId) {
      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
        new: true,
      });

      if (!savedOrder) {
        console.error("Order not found for update");
        return res.status(404).json({ message: "Order not found" });
      }

      // Update table status based on order status
      if (orderInfo.order_status === "Save") {
        await updateTableStatus(tableId, "Save", orderId);
      } else if (orderInfo.order_status === "KOT") {
        await updateTableStatus(tableId, "KOT", orderId);
      } else if (orderInfo.order_status === "Paid") {
        await clearTable(tableId);
      }

      return res.status(200).json({
        status: "success",
        message: "Order updated successfully",
        order: savedOrder,
      });
    }

    // ✅ 5. Handle new order creation
    const token = await generateToken(req.user, orderInfo.order_source);
    orderInfo.token = token;

    const newOrder = new Order(orderInfo);
    savedOrder = await newOrder.save();

    // Update table status
    if (orderInfo.order_status === "Save") {
      await updateTableStatus(tableId, "Save", savedOrder._id);
    } else if (orderInfo.order_status === "KOT") {
      await updateTableStatus(tableId, "KOT", savedOrder._id);
    }

    return res.status(200).json({
      status: "success",
      message: "Order created successfully",
      order: savedOrder,
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error("Error processing dine-in order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const takeawayController = async (req, res) => {
  try {
    console.log("Takeaway order request:", req.body);

    let { orderInfo, customerInfo } = req.body;
    const orderId = orderInfo.order_id;
    orderInfo.user_id = req.user;

    let savedOrder;
    let savedCustomer;

    // ✅ 1. Save customer if provided
    if (
      customerInfo &&
      (customerInfo.phone || customerInfo.email || customerInfo.name)
    ) {
      try {
        // Check if customer already exists
        let existingCustomer = null;
        if (customerInfo.phone) {
          existingCustomer = await Customer.findOne({
            phone: customerInfo.phone,
          });
        } else if (customerInfo.email) {
          existingCustomer = await Customer.findOne({
            email: customerInfo.email,
          });
        }

        if (existingCustomer) {
          // Update existing customer
          savedCustomer = await Customer.findByIdAndUpdate(
            existingCustomer._id,
            customerInfo,
            { new: true }
          );
        } else {
          // Create new customer
          const customer = new Customer(customerInfo);
          savedCustomer = await customer.save();
        }

        orderInfo.customer_id = savedCustomer._id;
      } catch (error) {
        console.error("Error handling customer:", error);
      }
    }

    // ✅ 2. Update item statuses based on order status
    if (orderInfo.order_status === "KOT") {
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? "Preparing" : item.status,
      }));
    }

    // ✅ 3. Handle order cancellation
    if (orderInfo.order_status === "Cancelled") {
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: "Cancelled",
      }));

      if (orderId) {
        savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
          new: true,
        });
        if (!savedOrder) {
          return res.status(404).json({ message: "Order not found" });
        }
      }

      return res.status(200).json({
        status: "success",
        message: "Order cancelled successfully",
        order: savedOrder,
      });
    }

    // ✅ 4. Handle existing order update
    if (orderId) {
      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
        new: true,
      });

      if (!savedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json({
        status: "success",
        message: "Order updated successfully",
        order: savedOrder,
      });
    }

    // ✅ 5. Handle new order creation
    // Generate token for new takeaway orders
    const token = await generateToken(req.user, orderInfo.order_source);
    orderInfo.token = token;

    const newOrder = new Order(orderInfo);
    savedOrder = await newOrder.save();

    return res.status(200).json({
      status: "success",
      message: "Order created successfully",
      order: savedOrder,
      orderId: savedOrder._id,
      token: token,
    });
  } catch (error) {
    console.error("Error processing takeaway order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deliveryController = async (req, res) => {
  try {
    console.log("Delivery order request:", req.body);

    let { orderInfo, customerInfo } = req.body;
    const orderId = orderInfo.order_id;
    orderInfo.user_id = req.user;

    // ✅ Validate required fields for delivery
    if (
      !customerInfo ||
      !customerInfo.name ||
      !customerInfo.phone ||
      !customerInfo.address
    ) {
      return res.status(400).json({
        message:
          "Customer name, phone, and address are required for delivery orders",
      });
    }

    let savedOrder;
    let savedCustomer;

    // ✅ 1. Save customer (required for delivery)
    try {
      // Check if customer already exists
      let existingCustomer = null;
      if (customerInfo.phone) {
        existingCustomer = await Customer.findOne({
          phone: customerInfo.phone,
        });
      } else if (customerInfo.email) {
        existingCustomer = await Customer.findOne({
          email: customerInfo.email,
        });
      }

      if (existingCustomer) {
        // Update existing customer
        savedCustomer = await Customer.findByIdAndUpdate(
          existingCustomer._id,
          customerInfo,
          { new: true }
        );
      } else {
        // Create new customer
        const customer = new Customer(customerInfo);
        savedCustomer = await customer.save();
      }

      orderInfo.customer_id = savedCustomer._id;
    } catch (error) {
      console.error("Error handling customer:", error);
      return res
        .status(500)
        .json({ message: "Error saving customer information" });
    }

    // ✅ 2. Update item statuses based on order status
    if (orderInfo.order_status === "KOT") {
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? "Preparing" : item.status,
      }));
    }

    // ✅ 3. Handle order cancellation
    if (orderInfo.order_status === "Cancelled") {
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: "Cancelled",
      }));

      if (orderId) {
        savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
          new: true,
        });
        if (!savedOrder) {
          return res.status(404).json({ message: "Order not found" });
        }
      }

      return res.status(200).json({
        status: "success",
        message: "Order cancelled successfully",
        order: savedOrder,
      });
    }

    // ✅ 4. Handle existing order update
    if (orderId) {
      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
        new: true,
      });

      if (!savedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      return res.status(200).json({
        status: "success",
        message: "Order updated successfully",
        order: savedOrder,
        customer: savedCustomer,
      });
    }

    // ✅ 5. Handle new order creation
    const newOrder = new Order(orderInfo);
    savedOrder = await newOrder.save();

    return res.status(200).json({
      status: "success",
      message: "Order created successfully",
      order: savedOrder,
      customer: savedCustomer,
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error("Error processing delivery order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const orderHistory = async (req, res) => {
  try {
    const orderData = await Order.find({ user_id: req.user });
    console.log(req.user);
    if (!orderData) {
      return res.json({ success: false, message: "Order not found" });
    }
    console.log(orderData);
    res.json({ success: true, message: "Order found", data: orderData });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  addCustomer,
  getOrderData,
  getActiveOrders,
  getCustomerData,
  orderController,
  orderHistory,
  dineInController,
  takeawayController,
  deliveryController,
};
