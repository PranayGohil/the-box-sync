const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Customer = require("../models/customerModel");
const WebCustomer = require("../models/webCustomerModel");
const TokenCounter = require("../models/TokenCounter");
const Table = require("../models/tableModel");
const Notification = require("../models/notificationModel");

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
    const { source } = req.query;
    console.log("Source:", req.query);
    if (!source)
      return res.status(400).json({ message: "Source not provided" });

    let activeDineInTables = [];
    if (source === "Manager") {
      // Active Dine In Tables
      activeDineInTables = await Order.find({
        user_id: req.user,
        order_type: "Dine In",
        order_status: { $in: ["KOT", "Save"] },
      }).sort({ "order_date": -1 }).lean();
    }

    if (source === "QSR") {
      // Active Dine In Tables
      activeDineInTables = await Order.find({
        user_id: req.user,
        order_source: source,
        order_type: "Dine In",
        $or: [
          { order_status: { $ne: "Paid" } },
          { "order_items.status": "Preparing" },
        ],
      }).sort({ "order_date": -1 }).lean();
    }

    // Active Takeaways & Deliveries
    const activeTakeawaysAndDeliveries = await Order.find({
      user_id: req.user,
      order_source: source,
      order_type: { $in: ["Takeaway", "Delivery"] },
      $or: [
        { order_status: { $ne: "Paid" } },
        { "order_items.status": "Preparing" },
      ],
    }).sort({ "order_date": -1 }).lean();

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
    let { orderInfo, tableId, customerInfo } = req.body;
    const orderId = orderInfo.order_id;
    orderInfo.user_id = req.user;
    console.log("Order Info : ", req.body);

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

      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");

      const key = `${req.user._id}_KOT`; // or however you store admin socket
      console.log("kot Key", key)
      if (io && connectedUsers && connectedUsers[key]) {
        io.to(connectedUsers[key]).emit(
          "kot_update"
        );
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
        console.error("Order not found for update");
        return res.status(404).json({ message: "Order not found" });
      }

      // Update table status based on order status
      if (orderInfo.order_status === "Save") {
        await updateTableStatus(tableId, "Save", orderId);
      } else if (orderInfo.order_status === "KOT") {
        await updateTableStatus(tableId, "KOT", orderId);
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");
        console.log("Now it's time for kot refresh", connectedUsers)

        const key = `${req.user._id}_KOT`; // or however you store admin socket
        console.log("kot Key", key)
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit(
            "kot_update"
          );
        }
      } else if (orderInfo.order_status === "Paid") {
        await clearTable(tableId);
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        const key = `${req.user._id}_KOT`; // or however you store admin socket
        console.log("kot Key", key)
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit(
            "kot_update"
          );
        }
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
      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");
      console.log("Now it's time for kot refresh", connectedUsers)

      const key = `${req.user._id}_KOT`; // or however you store admin socket
      console.log("kot Key", key)
      if (io && connectedUsers && connectedUsers[key]) {
        io.to(connectedUsers[key]).emit(
          "kot_update"
        );
      }
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

      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");

      const key = `${req.user._id}_KOT`; // or however you store admin socket
      console.log("kot Key", key)
      if (io && connectedUsers && connectedUsers[key]) {
        io.to(connectedUsers[key]).emit(
          "kot_update"
        );
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

      if (savedOrder.order_status === "KOT" || savedOrder.order_status === "Paid") {
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");
        console.log("Now it's time for kot refresh", connectedUsers)

        const key = `${req.user._id}_KOT`; // or however you store admin socket
        console.log("kot Key", key)
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit(
            "kot_update"
          );
        }
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

    if (savedOrder.order_status === "KOT" || savedOrder.order_status === "Paid") {
      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");
      console.log("Now it's time for kot refresh", connectedUsers)

      const key = `${req.user._id}_KOT`; // or however you store admin socket
      console.log("kot Key", key)
      if (io && connectedUsers && connectedUsers[key]) {
        io.to(connectedUsers[key]).emit(
          "kot_update"
        );
      }
    }

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

      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");

      const key = `${req.user._id}_KOT`; // or however you store admin socket
      console.log("kot Key", key)
      if (io && connectedUsers && connectedUsers[key]) {
        io.to(connectedUsers[key]).emit(
          "kot_update"
        );
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

      if (savedOrder.order_status === "KOT" || savedOrder.order_status === "Paid") {
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");
        console.log("Now it's time for kot refresh", connectedUsers)

        const key = `${req.user._id}_KOT`; // or however you store admin socket
        console.log("kot Key", key)
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit(
            "kot_update"
          );
        }
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

    if (savedOrder.order_status === "KOT" || savedOrder.order_status === "Paid") {
      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");
      console.log("Now it's time for kot refresh", connectedUsers)

      const key = `${req.user._id}_KOT`; // or however you store admin socket
      console.log("kot Key", key)
      if (io && connectedUsers && connectedUsers[key]) {
        io.to(connectedUsers[key]).emit(
          "kot_update"
        );
      }
    }

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

const deliveryFromSiteController = async (req, res) => {
  try {
    let { orderInfo, customerInfo } = req.body;
    const orderId = orderInfo.order_id;
    const restaurant_code = req.params.rescode;

    const restauant = await User.findOne({ restaurant_code });

    if (!restauant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    orderInfo.user_id = restauant._id;

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
        existingCustomer = await WebCustomer.findOne({
          phone: customerInfo.phone,
        });
      } else if (customerInfo.email) {
        existingCustomer = await WebCustomer.findOne({
          email: customerInfo.email,
        });
      }

      if (existingCustomer) {
        // Update existing customer
        savedCustomer = await WebCustomer.findByIdAndUpdate(
          existingCustomer._id,
          customerInfo,
          { new: true }
        );
      } else {
        // Create new customer
        const customer = new WebCustomer(customerInfo);
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

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");

    const userId = restauant._id;
    const role = "Admin";
    const key = `${userId}_${role}`;
    if (key && connectedUsers[key]) {
      const notification = await Notification.create({
        restaurant_id: restauant._id,
        sender: "Web Customer",
        receiver: "Admin",
        type: "web_order_recieved",
        data: savedOrder,
      });
      io.to(connectedUsers[key]).emit("web_order_recieved", notification);
    }

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
    const {
      order_source,
      order_status,
      order_type,      // NEW: Filter by order type
      table_area,      // NEW: Filter by table area
      from,
      to,
      search,
      page = 1,
      limit = 20,
      sortBy = "updated_at",
      sortOrder = "desc",
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNumber - 1) * pageSize;

    const filter = {
      user_id: req.user,
    };

    // Existing filters
    if (order_source) {
      let sources = order_source;

      // Handle axios array serialization
      if (typeof order_source === 'object') {
        sources = Object.values(order_source);
      }

      if (Array.isArray(sources)) {
        filter.order_source = { $in: sources };
      } else {
        filter.order_source = sources;
      }
    }
    if (order_status) filter.order_status = order_status;

    // NEW: Order Type Filter
    if (order_type) {
      filter.order_type = order_type;
    }

    // NEW: Table Area Filter (case-insensitive partial match)
    if (table_area) {
      filter.table_area = new RegExp(table_area, "i");
    }

    // Date Range Filter
    if (from || to) {
      filter.order_date = {};
      if (from) filter.order_date.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.order_date.$lte = toDate;
      }
    }

    // Search Filter
    if (search) {
      const regex = new RegExp("^" + search, "i");
      filter.$or = [
        { customer_name: regex },
        { table_no: regex }
      ];
    }

    // Sorting
    const sort = {
      [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    // Projection
    const projection = {
      token: 1,
      table_no: 1,
      table_area: 1,
      order_type: 1,
      order_status: 1,
      order_source: 1,
      bill_amount: 1,
      total_amount: 1,
      order_date: 1,
      customer_name: 1,
      payment_type: 1,
      updated_at: 1,
    };

    // Parallel execution of query and count
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select(projection)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      message: "Order list",
      data: orders,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("orderHistory error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
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
  deliveryFromSiteController,
};
