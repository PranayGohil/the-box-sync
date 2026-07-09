const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Website = require("../models/WebsiteModel");
const DistanceCache = require("../models/DistanceCacheModel");
const googleMapsService = require("../utils/googleMapsService");
const Customer = require("../models/customerModel");
const WebCustomer = require("../models/webCustomerModel");
const TokenCounter = require("../models/TokenCounter");
const Table = require("../models/tableModel");
const Menu = require("../models/menuModel");
const Notification = require("../models/notificationModel");
const OrderCounter = require("../models/orderCounterModel");
const { processOrderLoyalty } = require("./loyaltyController");
const mongoose = require("mongoose");

const recalculateOrderTotals = (orderInfo) => {
  if (!orderInfo || !Array.isArray(orderInfo.order_items)) return orderInfo;

  let sub_total = 0;

  orderInfo.order_items = orderInfo.order_items.map((item) => {
    let basePrice = item.dish_price; // Default fallback

    // If selected_variant exists and has a price, use it
    if (item.selected_variant && typeof item.selected_variant.price === "number") {
      basePrice = item.selected_variant.price;
    } else if (item.selected_variant && typeof item.selected_variant.price === "string") {
      basePrice = Number(item.selected_variant.price) || 0;
    }

    let addonsSum = 0;
    if (Array.isArray(item.selected_addons)) {
      item.selected_addons.forEach((addon) => {
        if (typeof addon.price === "number") {
          addonsSum += addon.price;
        } else if (typeof addon.price === "string") {
          addonsSum += Number(addon.price) || 0;
        }
      });
    }

    const finalDishPrice = basePrice + addonsSum;
    item.dish_price = finalDishPrice;

    const itemSubtotal = Math.round(finalDishPrice * (Number(item.quantity) || 1) * 100) / 100;
    sub_total += itemSubtotal;

    return item;
  });

  orderInfo.sub_total = Math.round(sub_total * 100) / 100;

  const cgst_percent = Number(orderInfo.cgst_percent) || 0;
  const sgst_percent = Number(orderInfo.sgst_percent) || 0;
  const vat_percent = Number(orderInfo.vat_percent) || 0;

  const cgst_amount = Math.round(((sub_total * cgst_percent) / 100) * 100) / 100;
  const sgst_amount = Math.round(((sub_total * sgst_percent) / 100) * 100) / 100;
  const vat_amount = Math.round(((sub_total * vat_percent) / 100) * 100) / 100;

  orderInfo.cgst_amount = cgst_amount;
  orderInfo.sgst_amount = sgst_amount;
  orderInfo.vat_amount = vat_amount;

  const bill_amount = Math.round((sub_total + cgst_amount + sgst_amount + vat_amount) * 100) / 100;
  orderInfo.bill_amount = bill_amount;

  const discount_amount = Number(orderInfo.discount_amount) || 0;
  const waveoff_amount = Number(orderInfo.waveoff_amount) || 0;

  const total_amount = Math.max(0, Math.round((bill_amount - discount_amount - waveoff_amount) * 100) / 100);
  orderInfo.total_amount = total_amount;

  return orderInfo;
};

const getTargetItemStatus = async (userId) => {
  try {
    if (!userId) return "Completed";
    const Subscription = require("../models/subscriptionModel");
    const Kot = require("../models/kotModel");
    const User = require("../models/userModel");

    const user = await User.findById(userId).lean();
    if (!user) return "Completed";

    // 1. Check if user has KOT Panel subscription active
    let hasKotSub = false;
    const activeSub = await Subscription.findOne({
      user_id: userId,
      plan_name: "KOT Panel",
      status: "active",
      end_date: { $gt: new Date() }
    }).lean();

    if (activeSub) {
      hasKotSub = true;
    } else {
      const tier = user.purchasedPlan || 'QSR';
      if (tier === 'Fine Dine' || tier === 'Chain') {
        hasKotSub = true;
      }
    }

    if (!hasKotSub) return "Completed";

    // 2. Check if KOT Panel user has been created
    const kotUserExists = await Kot.findOne({ user_id: userId }).lean();
    return kotUserExists ? "Preparing" : "Completed";
  } catch (err) {
    console.error("Error in getTargetItemStatus:", err);
    return "Completed";
  }
};

const broadcastOrderUpdate = (req, order) => {
  try {
    const io = req.app.get("io");
    if (!io) return;

    // Extract string representation of restaurant ID
    let restaurantId = null;
    if (order.user_id) {
      restaurantId = typeof order.user_id === "object" && order.user_id._id
        ? order.user_id._id.toString()
        : order.user_id.toString();
    }

    // Extract string representation of customer ID
    let customerId = null;
    if (order.customer_id) {
      customerId = typeof order.customer_id === "object" && order.customer_id._id
        ? order.customer_id._id.toString()
        : order.customer_id.toString();
    }

    const orderId = order._id ? order._id.toString() : null;

    // 1. Broadcast to the restaurant room (POS dashboard, QSR dashboard)
    if (restaurantId) {
      io.to(`restaurant_${restaurantId}`).emit("kot_update", order);
      io.to(`restaurant_${restaurantId}`).emit("order_updated", order);
      console.log(`Socket: Broadcasted order change to restaurant_${restaurantId}`);
    }

    // 2. Broadcast to the customer room (Website order history)
    if (customerId) {
      io.to(`customer_${customerId}`).emit("order_updated", order);
      console.log(`Socket: Broadcasted order change to customer_${customerId}`);
    }

    // 3. Broadcast to the specific order room
    if (orderId) {
      io.to(`order_${orderId}`).emit("order_updated", order);
      console.log(`Socket: Broadcasted order change to order_${orderId}`);
    }

    console.log(`Realtime room broadcast completed for order ${orderId}`);
  } catch (err) {
    console.error("Error broadcasting order update:", err);
  }
};

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

const generateOrderNo = async (userId) => {
  const counter = await OrderCounter.findOneAndUpdate(
    { user_id: userId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const padded = String(counter.seq).padStart(6, "0");
  return `ORD-${padded}`;
};

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
      let customerData = await Customer.findById(orderData.customer_id);

      if (!customerData) {
        customerData = await WebCustomer.findById(orderData.customer_id);
      }

      if (customerData) {
        const customerObj = customerData.toObject();
        if (!customerObj.address && Array.isArray(customerObj.addresses) && customerObj.addresses.length > 0) {
          const defaultAddr = customerObj.addresses.find(a => a.is_default) || customerObj.addresses[0];
          customerObj.address = `${defaultAddr.address}, ${defaultAddr.city}, ${defaultAddr.pincode}`;
        }
        responseData.customer_details = customerObj;
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
          { order_status: { $nin: ["Paid", "Cancelled"] } },
          { "order_items.status": "Preparing" },
        ],
      }).sort({ "order_date": -1 }).lean();
    }

    // Active Takeaways & Deliveries
    const activeTakeawaysAndDeliveries = await Order.find({
      user_id: req.user,
      order_source: { $in: [source, "Restaurant Website"] },
      order_type: { $in: ["Takeaway", "Delivery"] },
      $or: [
        { order_status: { $nin: ["Paid", "Cancelled"] } },
        { "order_items.status": "Preparing" },
      ],
    }).sort({ "order_date": -1 }).lean();

    for (let order of activeTakeawaysAndDeliveries) {
      if (!order.customer_name && order.customer_id) {
        let customer = await Customer.findById(order.customer_id);
        if (!customer) {
          customer = await WebCustomer.findById(order.customer_id);
        }
        if (customer) {
          order.customer_name = customer.name;
        }
      }
    }

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

    orderInfo = recalculateOrderTotals(orderInfo);

    let savedOrder;

    // ✅ 1. Save customer if provided
    if (customerInfo && (customerInfo.phone || customerInfo.email)) {
      const customer = new Customer(customerInfo);
      const savedCustomer = await customer.save();
      orderInfo.customer_id = savedCustomer._id;
    }

    // ✅ 2. Update item statuses based on order status
    if (orderInfo.order_status === "KOT" || orderInfo.order_source === "QSR") {
      const targetStatus = await getTargetItemStatus(orderInfo.user_id);
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? targetStatus : item.status,
      }));
    }

    if (orderInfo.order_status === "Cancelled") {
      let isDeleted = false;
      if (orderId) {
        const existingOrder = await Order.findById(orderId);
        if (existingOrder && existingOrder.order_status === "Save" && existingOrder.order_items.every(item => item.status === "Pending")) {
          await Order.findByIdAndDelete(orderId);
          isDeleted = true;
        }
      }

      if (isDeleted) {
        if (orderInfo.order_type === "Dine In" && tableId) {
          await clearTable(tableId);
        }
        return res.status(200).json({
          status: "success",
          message: "Order deleted successfully",
          deleted: true,
        });
      }

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

// Add this helper at top of controller file
const assignCountersToItems = async (userId, orderItems) => {
  // Fetch all menus for this user
  const menus = await Menu.find({ user_id: userId });

  // Build dish_name → counter map
  const dishCounterMap = {};
  menus.forEach(menu => {
    const counter = menu.counter || "Default";
    menu.dishes.forEach(dish => {
      dishCounterMap[dish.dish_name] = counter;
    });
  });

  // Inject counter into each order item
  return orderItems.map(item => ({
    ...item,
    counter: item.counter || dishCounterMap[item.dish_name] || "Default"
    // item.counter check → preserves existing value on update (don't overwrite old orders)
  }));
};

const addKotsFlag = async (userId, orderItems) => {
  // Fetch all menus for this user
  const menus = await Menu.find({ user_id: userId });

  // Build dish_name → hide_on_kot map
  const hideOnKOTsDishSet = {};
  menus.forEach(menu => {
    const hideOnKot = menu.hide_on_kot || false;
    menu.dishes.forEach(dish => {
      hideOnKOTsDishSet[dish.dish_name] = hideOnKot;
    });
  });

  // Inject hide_on_kot flag into each order item
  return orderItems.map(item => ({
    ...item,
    hide_on_kot: hideOnKOTsDishSet[item.dish_name] || item.hide_on_kot || false
  }));
};

const dineInController = async (req, res) => {
  try {
    let { orderInfo, tableId, customerInfo } = req.body;
    const orderId = orderInfo.order_id;
    orderInfo.user_id = req.user._id;

    orderInfo = recalculateOrderTotals(orderInfo);

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
      const targetStatus = await getTargetItemStatus(orderInfo.user_id);
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? targetStatus : item.status,
      }));
    }
    // assign counters to items (only if menu exists, safe fallback)
    orderInfo.order_items = await assignCountersToItems(req.user, orderInfo.order_items);
    orderInfo.order_items = await addKotsFlag(req.user, orderInfo.order_items);

    // ✅ 3. Handle order cancellation
    if (orderInfo.order_status === "Cancelled") {
      let isDeleted = false;
      if (orderId) {
        const existingOrder = await Order.findById(orderId);
        if (existingOrder && existingOrder.order_status === "Save" && existingOrder.order_items.every(item => item.status === "Pending")) {
          await Order.findByIdAndDelete(orderId);
          isDeleted = true;
        }
      }

      if (isDeleted) {
        // Clear the table
        await clearTable(tableId);

        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        const key = `${req.user._id}_KOT`; // or however you store admin socket
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit("kot_update");
        }

        return res.status(200).json({
          status: "success",
          message: "Order deleted successfully",
          deleted: true,
        });
      }

      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: "Cancelled",
      }));

      // 🔥 Reset all financial calculations to zero for cancelled orders
      orderInfo.bill_amount = 0;
      orderInfo.sub_total = 0;
      orderInfo.cgst_amount = 0;
      orderInfo.sgst_amount = 0;
      orderInfo.vat_amount = 0;
      orderInfo.discount_amount = 0;
      orderInfo.waveoff_amount = 0;
      orderInfo.total_amount = 0;
      orderInfo.paid_amount = 0;

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
      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) {
        console.error("Order not found for update");
        return res.status(404).json({ message: "Order not found" });
      }

      if (orderInfo.order_status !== "Save") {
        if (!existingOrder.order_no) {
          orderInfo.order_no = await generateOrderNo(req.user);
        }
        if (!existingOrder.token) {
          orderInfo.token = await generateToken(req.user, orderInfo.order_source || existingOrder.order_source);
        }
      }

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
        if (savedOrder.customer_id) {
          await processOrderLoyalty(
            req.user,
            savedOrder._id,
            savedOrder.total_amount,
            savedOrder.customer_id,
            req.body.redeemedPoints || 0
          );
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
      }

      return res.status(200).json({
        status: "success",
        message: "Order updated successfully",
        order: savedOrder,
      });
    }

    // ✅ 5. Handle new order creation
    let token = null;
    if (orderInfo.order_status !== "Save") {
      token = await generateToken(req.user, orderInfo.order_source);
      orderInfo.token = token;
      orderInfo.order_no = await generateOrderNo(req.user);
    }

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
    } else if (orderInfo.order_status === "Paid") {
      await clearTable(tableId);
      if (savedOrder.customer_id) {
        await processOrderLoyalty(
          req.user,
          savedOrder._id,
          savedOrder.total_amount,
          savedOrder.customer_id,
          req.body.redeemedPoints || 0
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
    orderInfo.user_id = req.user._id;

    orderInfo = recalculateOrderTotals(orderInfo);

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
      const targetStatus = await getTargetItemStatus(orderInfo.user_id);
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? targetStatus : item.status,
      }));
    }

    // assign counters to items (only if menu exists, safe fallback)
    orderInfo.order_items = await assignCountersToItems(req.user, orderInfo.order_items);
    orderInfo.order_items = await addKotsFlag(req.user, orderInfo.order_items);

    // ✅ 3. Handle order cancellation
    if (orderInfo.order_status === "Cancelled") {
      let isDeleted = false;
      if (orderId) {
        const existingOrder = await Order.findById(orderId);
        if (existingOrder && existingOrder.order_status === "Save" && existingOrder.order_items.every(item => item.status === "Pending")) {
          await Order.findByIdAndDelete(orderId);
          isDeleted = true;
        }
      }

      if (isDeleted) {
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        const key = `${req.user._id}_KOT`; // or however you store admin socket
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit("kot_update");
        }

        return res.status(200).json({
          status: "success",
          message: "Order deleted successfully",
          deleted: true,
        });
      }

      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: "Cancelled",
      }));

      // 🔥 Reset all financial calculations to zero for cancelled orders
      orderInfo.bill_amount = 0;
      orderInfo.sub_total = 0;
      orderInfo.cgst_amount = 0;
      orderInfo.sgst_amount = 0;
      orderInfo.vat_amount = 0;
      orderInfo.discount_amount = 0;
      orderInfo.waveoff_amount = 0;
      orderInfo.total_amount = 0;
      orderInfo.paid_amount = 0;

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
      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (orderInfo.order_status !== "Save") {
        if (!existingOrder.order_no) {
          orderInfo.order_no = await generateOrderNo(req.user);
        }
        if (!existingOrder.token) {
          orderInfo.token = await generateToken(req.user, orderInfo.order_source || existingOrder.order_source);
        }
      }

      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
        new: true,
      });

      if (!savedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (savedOrder.order_status === "KOT" || savedOrder.order_status === "Paid") {
        if (savedOrder.order_status === "Paid" && savedOrder.customer_id) {
          await processOrderLoyalty(
            req.user,
            savedOrder._id,
            savedOrder.total_amount,
            savedOrder.customer_id,
            req.body.redeemedPoints || 0
          );
        }
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
    let token = null;
    if (orderInfo.order_status !== "Save") {
      token = await generateToken(req.user, orderInfo.order_source);
      orderInfo.token = token;
      orderInfo.order_no = await generateOrderNo(req.user);
    }

    const newOrder = new Order(orderInfo);
    savedOrder = await newOrder.save();


    if (savedOrder.order_status === "KOT" || savedOrder.order_status === "Paid") {
      if (savedOrder.order_status === "Paid" && savedOrder.customer_id) {
        await processOrderLoyalty(
          req.user,
          savedOrder._id,
          savedOrder.total_amount,
          savedOrder.customer_id,
          req.body.redeemedPoints || 0
        );
      }
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
    orderInfo.user_id = req.user._id;

    orderInfo = recalculateOrderTotals(orderInfo);

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
      const targetStatus = await getTargetItemStatus(orderInfo.user_id);
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? targetStatus : item.status,
      }));
    }

    // assign counters to items (only if menu exists, safe fallback)
    orderInfo.order_items = await assignCountersToItems(req.user, orderInfo.order_items);
    orderInfo.order_items = await addKotsFlag(req.user, orderInfo.order_items);

    // ✅ 3. Handle order cancellation
    if (orderInfo.order_status === "Cancelled") {
      let isDeleted = false;
      if (orderId) {
        const existingOrder = await Order.findById(orderId);
        if (existingOrder && existingOrder.order_status === "Save" && existingOrder.order_items.every(item => item.status === "Pending")) {
          await Order.findByIdAndDelete(orderId);
          isDeleted = true;
        }
      }

      if (isDeleted) {
        const io = req.app.get("io");
        const connectedUsers = req.app.get("connectedUsers");

        const key = `${req.user._id}_KOT`; // or however you store admin socket
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit("kot_update");
        }

        return res.status(200).json({
          status: "success",
          message: "Order deleted successfully",
          deleted: true,
        });
      }

      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: "Cancelled",
      }));

      // 🔥 Reset all financial calculations to zero for cancelled orders
      orderInfo.bill_amount = 0;
      orderInfo.sub_total = 0;
      orderInfo.cgst_amount = 0;
      orderInfo.sgst_amount = 0;
      orderInfo.vat_amount = 0;
      orderInfo.discount_amount = 0;
      orderInfo.waveoff_amount = 0;
      orderInfo.total_amount = 0;
      orderInfo.paid_amount = 0;

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
      const existingOrder = await Order.findById(orderId);
      if (!existingOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (orderInfo.order_status !== "Save") {
        if (!existingOrder.order_no) {
          orderInfo.order_no = await generateOrderNo(req.user);
        }
        if (!existingOrder.token) {
          orderInfo.token = await generateToken(req.user, orderInfo.order_source || existingOrder.order_source);
        }
      }

      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
        new: true,
      });

      if (!savedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (savedOrder.order_status === "KOT" || savedOrder.order_status === "Paid") {
        if (savedOrder.order_status === "Paid" && savedOrder.customer_id) {
          await processOrderLoyalty(
            req.user,
            savedOrder._id,
            savedOrder.total_amount,
            savedOrder.customer_id,
            req.body.redeemedPoints || 0
          );
        }
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
    let token = null;
    if (orderInfo.order_status !== "Save") {
      token = await generateToken(req.user, orderInfo.order_source);
      orderInfo.token = token;
      orderInfo.order_no = await generateOrderNo(req.user);
    }

    const newOrder = new Order(orderInfo);
    savedOrder = await newOrder.save();

    if (savedOrder.order_status === "KOT" || savedOrder.order_status === "Paid") {
      if (savedOrder.order_status === "Paid" && savedOrder.customer_id) {
        await processOrderLoyalty(
          req.user,
          savedOrder._id,
          savedOrder.total_amount,
          savedOrder.customer_id,
          req.body.redeemedPoints || 0
        );
      }
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

const isRestaurantOpen = (settings) => {
  if (!settings) return true;

  const now = new Date();
  
  // Use Indian Standard Time (IST) if needed, but standard Date local time is fine for local servers / users.
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDay = dayNames[now.getDay()];
  
  const currentHours = String(now.getHours()).padStart(2, '0');
  const currentMinutes = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHours}:${currentMinutes}`;

  const convertTo24h = (timeStr) => {
    if (!timeStr) return "00:00";
    if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
    
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return timeStr;
    
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();
    
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const dayMatches = (dayConfig, currentDayName) => {
    const config = dayConfig.trim().toLowerCase();
    const cur = currentDayName.trim().toLowerCase();
    
    if (config === "everyday" || config === "every day") return true;
    if (config === cur) return true;
    
    const dayIndices = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    };
    
    const curIdx = dayIndices[cur];
    
    if (config.includes("-") || config.includes("to")) {
      const parts = config.split(/[-–]|to/).map(s => s.trim());
      if (parts.length === 2) {
        const startDay = parts[0];
        const endDay = parts[1];
        const startIdx = dayIndices[startDay];
        const endIdx = dayIndices[endDay];
        
        if (startIdx !== undefined && endIdx !== undefined) {
          if (startIdx <= endIdx) {
            return curIdx >= startIdx && curIdx <= endIdx;
          } else {
            return curIdx >= startIdx || curIdx <= endIdx;
          }
        }
      }
    }
    
    return false;
  };

  if (settings.opening_hours && settings.opening_hours.length > 0) {
    let matchedDaySlot = false;
    let isOpenInMatchedSlot = false;
    
    for (const slot of settings.opening_hours) {
      if (slot.day && dayMatches(slot.day, currentDay)) {
        matchedDaySlot = true;
        const fromTime = convertTo24h(slot.from);
        const toTime = convertTo24h(slot.to);
        
        if (fromTime <= toTime) {
          if (currentTime >= fromTime && currentTime <= toTime) {
            isOpenInMatchedSlot = true;
          }
        } else {
          if (currentTime >= fromTime || currentTime <= toTime) {
            isOpenInMatchedSlot = true;
          }
        }
      }
    }
    
    if (matchedDaySlot) return isOpenInMatchedSlot;
  }

  if (settings.open_time_from && settings.open_time_to) {
    const fromTime = convertTo24h(settings.open_time_from);
    const toTime = convertTo24h(settings.open_time_to);
    
    if (fromTime <= toTime) {
      return currentTime >= fromTime && currentTime <= toTime;
    } else {
      return currentTime >= fromTime || currentTime <= toTime;
    }
  }

  return true;
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

    const settings = await Website.findOne({ user_id: restauant._id.toString() });
    if (settings && !isRestaurantOpen(settings)) {
      return res.status(400).json({
        message: "Sorry, we are currently closed. Please check our opening hours."
      });
    }

    orderInfo.user_id = restauant._id;
    if (customerInfo && customerInfo.name) {
      orderInfo.customer_name = customerInfo.name;
    }

    orderInfo = recalculateOrderTotals(orderInfo);

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
      // If the order already has a customer_id (logged-in web customer), use it directly
      if (orderInfo.customer_id) {
        const existingLoggedIn = await WebCustomer.findById(orderInfo.customer_id);
        if (existingLoggedIn) {
          savedCustomer = existingLoggedIn;
          // Update name/phone if they were missing (new user filling first order)
          if (customerInfo.name && !existingLoggedIn.name) {
            existingLoggedIn.name = customerInfo.name;
          }
          if (customerInfo.phone && !existingLoggedIn.phone) {
            existingLoggedIn.phone = customerInfo.phone;
          }
          await existingLoggedIn.save();
        }
      }

      // Fallback: lookup by phone or email (scoped to restaurant_code)
      if (!savedCustomer) {
        let existingCustomer = null;
        if (customerInfo.phone) {
          existingCustomer = await WebCustomer.findOne({
            phone: customerInfo.phone,
            restaurant_code,
          });
        }
        if (!existingCustomer && customerInfo.email) {
          existingCustomer = await WebCustomer.findOne({
            email: customerInfo.email,
            restaurant_code,
          });
        }

        if (existingCustomer) {
          savedCustomer = existingCustomer;
        } else {
          // Create new customer with restaurant_code
          const customer = new WebCustomer({
            ...customerInfo,
            restaurant_code,
          });
          savedCustomer = await customer.save();
        }
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
      const targetStatus = await getTargetItemStatus(orderInfo.user_id);
      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: item.status === "Pending" ? targetStatus : item.status,
      }));
    }

    // ✅ 3. Handle order cancellation
    if (orderInfo.order_status === "Cancelled") {
      let isDeleted = false;
      if (orderId) {
        const existingOrder = await Order.findById(orderId);
        if (existingOrder && existingOrder.order_status === "Save" && existingOrder.order_items.every(item => item.status === "Pending")) {
          await Order.findByIdAndDelete(orderId);
          isDeleted = true;
        }
      }

      if (isDeleted) {
        return res.status(200).json({
          status: "success",
          message: "Order deleted successfully",
          deleted: true,
        });
      }

      orderInfo.order_items = orderInfo.order_items.map((item) => ({
        ...item,
        status: "Cancelled",
      }));

      // 🔥 Reset all financial calculations to zero for cancelled orders
      orderInfo.bill_amount = 0;
      orderInfo.sub_total = 0;
      orderInfo.cgst_amount = 0;
      orderInfo.sgst_amount = 0;
      orderInfo.vat_amount = 0;
      orderInfo.discount_amount = 0;
      orderInfo.waveoff_amount = 0;
      orderInfo.total_amount = 0;
      orderInfo.paid_amount = 0;

      if (orderId) {
        savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, {
          new: true,
        });
        if (!savedOrder) {
          return res.status(404).json({ message: "Order not found" });
        }
        broadcastOrderUpdate(req, savedOrder);
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

      broadcastOrderUpdate(req, savedOrder);

      return res.status(200).json({
        status: "success",
        message: "Order updated successfully",
        order: savedOrder,
        customer: savedCustomer,
      });
    }

    // ✅ 5. Handle new order creation
    orderInfo.order_no = await generateOrderNo(restauant._id);
    const newOrder = new Order(orderInfo);
    savedOrder = await newOrder.save();

    broadcastOrderUpdate(req, savedOrder);

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");

    const userId = restauant._id;
    const role = "Manager";
    const key = `${userId}_${role}`;
    if (key && connectedUsers[key]) {
      const notification = await Notification.create({
        restaurant_id: restauant._id,
        sender: "Web Customer",
        receiver: "Manager",
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
      sortBy = "order_no",
      sortOrder = "desc",
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 20, 1);
    const skip = (pageNumber - 1) * pageSize;

    const filter = {
      user_id: req.user._id ? String(req.user._id) : String(req.user),
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

    // Build aggregation pipeline to pin 'Save' orders to top,
    // then sort by the requested field (default: order_no desc)
    const sortDir = sortOrder === "asc" ? 1 : -1;

    const aggregationPipeline = [
      // 1. Match the filter
      { $match: filter },

      // 2. Add computed fields for sorting:
      //    - _sort_priority: 0 = Save (shown first), 1 = everything else
      //    - _sort_order_no: numeric version of order_no string for correct numeric sort
      {
        $addFields: {
          _sort_priority: {
            $cond: [{ $eq: ["$order_status", "Save"] }, 0, 1],
          },
          _sort_order_no: {
            $convert: {
              input: {
                $cond: [
                  {
                    $and: [
                      { $eq: [{ $type: "$order_no" }, "string"] },
                      { $gte: [{ $strLenCP: "$order_no" }, 5] },
                    ],
                  },
                  { $substrCP: ["$order_no", 4, 10] },
                  "$order_no",
                ],
              },
              to: "int",
              onError: 0,
              onNull: 0,
            },
          },
        },
      },

      // 3. Sort: priority ASC (Save first), then by requested field
      {
        $sort: sortBy === "order_no"
          ? { _sort_priority: 1, _sort_order_no: sortDir }
          : { _sort_priority: 1, [sortBy]: sortDir },
      },

      // 4. Project only needed fields (drop the computed helper fields)
      {
        $project: {
          order_no: 1,
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
        },
      },

      // 5. Paginate
      { $skip: skip },
      { $limit: pageSize },
    ];

    // Parallel execution of aggregation and count
    const [orders, total] = await Promise.all([
      Order.aggregate(aggregationPipeline),
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

const updateOrderStatus = async (req, res) => {
  try {
    const { status, customer_name, customer_phone } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (customer_name !== undefined) {
      order.customer_name = customer_name;
    }
    if (customer_phone !== undefined) {
      order.customer_phone = customer_phone;
      if (customer_phone) {
        try {
          let existingCustomer = await Customer.findOne({ phone: customer_phone });
          if (existingCustomer) {
            existingCustomer.name = customer_name || existingCustomer.name || order.customer_name;
            await existingCustomer.save();
            order.customer_id = existingCustomer._id;
          } else {
            const newCust = new Customer({
              phone: customer_phone,
              name: customer_name || order.customer_name || 'Guest',
              user_id: order.user_id
            });
            const savedCust = await newCust.save();
            order.customer_id = savedCust._id;
          }
        } catch (err) {
          console.error("Error creating/linking customer:", err);
        }
      }
    }

    if (status) {
      if (status === "Cancelled" && order.order_status === "Save") {
        await Order.findByIdAndDelete(orderId);
        // broadcast update
        broadcastOrderUpdate(req, { ...order.toObject(), order_status: "Cancelled", deleted: true });
        return res.json({ success: true, message: "Order deleted", order: { ...order.toObject(), order_status: "Cancelled", deleted: true } });
      }

      order.order_status = status;
      if (status === "KOT") {
        const targetStatus = await getTargetItemStatus(order.user_id);
        order.order_items = order.order_items.map((item) => ({
          ...item,
          status: item.status === "Pending" ? targetStatus : item.status,
        }));
      } else if (status === "Cancelled" || status === "Rejected") {
        order.order_items = order.order_items.map((item) => ({
          ...item,
          status: "Cancelled",
        }));
      }
    }

    await order.save();

    broadcastOrderUpdate(req, order);

    res.json({ success: true, order });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

const calculateDeliveryController = async (req, res) => {
  try {
    const { customer_place_id, customer_lat, customer_lng, subtotal = 0 } = req.body;
    const restaurant_code = req.params.rescode;

    if (!customer_place_id) {
      return res.status(400).json({ success: false, message: "Customer Place ID is required." });
    }

    const restaurant = await User.findOne({ restaurant_code });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found." });
    }

    const settings = await Website.findOne({ user_id: restaurant._id });
    if (!settings || !settings.delivery?.enabled) {
      return res.status(400).json({ success: false, message: "Delivery is not enabled for this restaurant." });
    }

    const deliveryConfig = settings.delivery;

    // 1. Try to find distance in persistent MongoDB DistanceCache
    let cachedDistance = await DistanceCache.findOne({
      restaurant_id: restaurant._id.toString(),
      customer_place_id: customer_place_id
    });

    let roadDistance = 0;
    let duration = "15 min"; // default fallback

    if (cachedDistance) {
      roadDistance = cachedDistance.road_distance;
      duration = cachedDistance.duration || duration;
    } else {
      // 2. Fetch fresh road distance from Google Routes API
      const origin = {
        placeId: settings.place_id,
        latitude: settings.latitude,
        longitude: settings.longitude
      };
      const destination = {
        placeId: customer_place_id,
        latitude: customer_lat,
        longitude: customer_lng
      };

      try {
        const routeData = await googleMapsService.computeRoadDistance(origin, destination);
        roadDistance = routeData.road_distance;
        duration = routeData.duration;

        // Save to cache
        await DistanceCache.create({
          restaurant_id: restaurant._id.toString(),
          customer_place_id: customer_place_id,
          road_distance: roadDistance,
          duration: duration
        });
      } catch (err) {
        console.error("Routes API Error:", err);
        return res.status(400).json({
          success: false,
          message: "Unable to calculate a valid road delivery route to this location."
        });
      }
    }

    // 3. Validate against maximum distance
    if (deliveryConfig.max_distance && roadDistance > deliveryConfig.max_distance) {
      return res.status(400).json({
        success: false,
        message: `Delivery unavailable. Maximum delivery limit is ${deliveryConfig.max_distance} km (road distance is ${roadDistance} km).`,
        distance: roadDistance
      });
    }

    // 4. Validate against minimum order
    if (deliveryConfig.minimum_order && subtotal < deliveryConfig.minimum_order) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${deliveryConfig.minimum_order} is required for delivery.`,
        distance: roadDistance
      });
    }

    // 5. Calculate delivery charge
    let deliveryCharge = 0;

    // Check free radius rule first
    if (deliveryConfig.free_radius && roadDistance <= deliveryConfig.free_radius) {
      deliveryCharge = 0;
    } else if (deliveryConfig.charge_type === "fixed") {
      deliveryCharge = deliveryConfig.fixed_charge || 0;
    } else if (deliveryConfig.charge_type === "distance_based" && deliveryConfig.slabs?.length > 0) {
      const sortedSlabs = [...deliveryConfig.slabs].sort((a, b) => a.to_km - b.to_km);
      let matchedCharge = null;

      for (let i = 0; i < sortedSlabs.length; i++) {
        const slab = sortedSlabs[i];
        const prevLimit = i === 0 ? 0 : sortedSlabs[i - 1].to_km;
        if (roadDistance > prevLimit && roadDistance <= slab.to_km) {
          matchedCharge = slab.charge;
          break;
        }
      }

      if (matchedCharge === null) {
        return res.status(400).json({
          success: false,
          message: `Delivery unavailable. No charge slab matches the road distance of ${roadDistance} km.`,
          distance: roadDistance
        });
      }

      deliveryCharge = matchedCharge;
    }

    return res.json({
      success: true,
      distance: roadDistance,
      duration,
      delivery_charge: deliveryCharge
    });

  } catch (error) {
    console.error("Error in calculateDeliveryController:", error);
    return res.status(500).json({ success: false, message: "Error calculating delivery details." });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id, user_id: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.order_status !== "Save") {
      return res.status(400).json({ success: false, message: "Only unpaid saved orders can be deleted" });
    }
    await Order.deleteOne({ _id: id });
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete Order Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
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
  calculateDeliveryController,
  updateOrderStatus,
  getTargetItemStatus,
  deleteOrder,
};