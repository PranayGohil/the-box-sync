const Order = require("../models/orderModel");
const Customer = require("../models/customerModel");
const TokenCounter = require("../models/TokenCounter");
const Table = require("../models/tableModel");

const cron = require("node-cron");

const addCustomer = (req, res) => {
  try {
    const customerData = { ...req.body, restaurant_id: req.user };
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

const getOrderData = (req, res) => {
  console.log(req.params.id);
  try {
    Order.find({ _id: req.params.id })
      .then((data) => res.json({data, success: true}))
      .catch((err) => res.json(err));
  } catch (error) {
    console.log(error);
  }
};

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

const generateToken = async (restaurant_id, source) => {
  const today = new Date();
  const dateOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let tokenCounter = await TokenCounter.findOne({
    date: dateOnly,
    restaurant_id,
    source,
  });

  if (!tokenCounter) {
    tokenCounter = new TokenCounter({
      date: dateOnly,
      lastToken: 0,
      restaurant_id: restaurant_id,
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
    savedOrder = await Order.findByIdAndUpdate(table.order_id, orderInfo, { new: true });
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
  const tableDocument = await Table.findOne({ "tables._id": tableId });
  if (tableDocument) {
    const table = tableDocument.tables.id(tableId);
    if (table) {
      table.current_status = "Empty";
      table.order_id = null;
      await tableDocument.save();
    }
  }
};


const orderController = async (req, res) => {
  try {
    console.log(req.body);

    let { orderInfo, table_id: tableId, customerInfo } = req.body;
    const orderId = orderInfo.order_id;
    orderInfo.restaurant_id = req.user;

    let savedOrder;

    // ✅ 1. Save customer if provided
    if (customerInfo && (customerInfo.phone || customerInfo.email)) {
      const customer = new Customer(customerInfo);
      const savedCustomer = await customer.save();
      orderInfo.customer_id = savedCustomer._id;
    }

    // ✅ 2. Update item statuses based on order status
    if (orderInfo.order_status === "KOT" || orderInfo.order_source === "QSR") {
      orderInfo.order_items = orderInfo.order_items.map(item => ({
        ...item,
        status: item.status === "Pending" ? "Preparing" : item.status
      }));
    }

    if (orderInfo.order_status === "Cancelled") {
      orderInfo.order_items = orderInfo.order_items.map(item => ({
        ...item,
        status: "Cancelled"
      }));

      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, { new: true });

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
        order: savedOrder
      });
    }

    // ✅ 3. Handle Dine In
    if (orderInfo.order_type === "Dine In") {
      if (!tableId) {
        return res.status(400).json({ message: "Table ID is required for Dine In orders" });
      }

      savedOrder = await handleDineInOrder(orderId, orderInfo, tableId);
      return res.status(200).json({
        status: "success",
        message: "Order processed successfully",
        order: savedOrder.order,
        table: savedOrder.table
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
      savedOrder = await Order.findByIdAndUpdate(orderId, orderInfo, { new: true });
      if (!savedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      return res.status(200).json({
        status: "success",
        message: "Order updated successfully",
        order: savedOrder
      });
    } else {
      // New order
      const newOrder = new Order(orderInfo);
      savedOrder = await newOrder.save();
      return res.status(200).json({
        status: "success",
        message: "Order created successfully",
        order: savedOrder,
        orderId: savedOrder._id
      });
    }

  } catch (error) {
    console.error("Error processing order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// const orderController = async (req, res) => {
//   try {
//     console.log(req.body);
//     let orderData = { ...req.body.orderInfo, restaurant_id: req.user };
//     const { table_id: tableId, customerInfo } = req.body;
//     const orderId = orderData.order_id; 
//     let savedOrder;

//     if (customerInfo.phone !== "" || customerInfo.email !== "") {
//       const customer = new Customer(customerInfo);
//       const savedCustomer = await customer.save();
//       orderData = { ...orderData, customer_id: savedCustomer._id };
//     }

//     if (orderData.order_status === "KOT" || orderData.order_source === "QSR") {
//       orderData.order_items = orderData.order_items.map((item) => ({
//         ...item,
//         status: item.status === "Pending" ? "Preparing" : item.status,
//       }));
//     }

//     if (orderData.order_status === "Cancelled") {
//       orderData.order_items = orderData.order_items.map((item) => ({
//         ...item,
//         status: "Cancelled",
//       }));

//       savedOrder = await Order.findByIdAndUpdate(orderId, orderData, {
//         new: true,
//       });

//       if (!savedOrder) {
//         return res.status(404).json({ message: "Order not found" });
//       }

//       return res.status(200).json({
//         status: "success",
//         message: "Order updated successfully",
//         order: savedOrder,
//       });
//     }

//     if (orderData.order_type === "Dine In") {
//       if (!tableId) {
//         return res
//           .status(400)
//           .json({ message: "Table ID is required for Dine In orders" });
//       }

//       const tableDocument = await Table.findOne({ "tables._id": tableId });

//       if (!tableDocument) {
//         return res.status(404).json({ message: "Table not found" });
//       }

//       const table = tableDocument.tables.id(tableId);

//       if (!table) {
//         return res.status(404).json({ message: "Table not found" });
//       }

//       if (table.current_status === "Empty" || table.order_id === null) {
//         const newOrder = new Order(orderData);
//         savedOrder = await newOrder.save();
//         table.current_status = savedOrder.order_status;
//         table.order_id = savedOrder._id;
//       } else {
//         savedOrder = await Order.findByIdAndUpdate(table.order_id, orderData, {
//           new: true,
//         });
//         if (savedOrder.order_status !== "Paid") {
//           table.current_status = savedOrder.order_status;
//         } else {
//           table.current_status = "Empty";
//           table.order_id = null;
//         }
//       }

//       await tableDocument.save();

//       return res.status(200).json({
//         status: "success",
//         message: "Order processed successfully",
//         order: savedOrder,
//         table: tableDocument,
//       });
//     } else {
//       if (
//         orderData.order_type === "Takeaway" ||
//         orderData.order_type === "QSR Dine In"
//       ) {
//         if (!orderId) {
//           orderData.token = await generateToken(
//             req.user,
//             orderData.order_source
//           );
//         }
//       }
//       if (orderId) {
//         savedOrder = await Order.findByIdAndUpdate(orderId, orderData, {
//           new: true,
//         });

//         if (!savedOrder) {
//           return res.status(404).json({ message: "Order not found" });
//         }

//         return res.status(200).json({
//           status: "success",
//           message: "Order updated successfully",
//           order: savedOrder,
//         });
//       } else {
//         const newOrder = new Order(orderData);
//         savedOrder = await newOrder.save();
//         const insertedOrderId = savedOrder._id;

//         return res.status(200).json({
//           status: "success",
//           message: "Order created successfully",
//           order: savedOrder,
//           orderId: insertedOrderId,
//         });
//       }
//     }
//   } catch (error) {
//     console.error("Error processing order:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const orderHistory = async (req, res) => {
  try {
    const orderData = await Order.find({ restaurant_id: req.user });
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
  getCustomerData,
  orderController,
  orderHistory,
};
