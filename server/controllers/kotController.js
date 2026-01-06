// controllers/kotController.js
const Order = require("../models/orderModel");

// Helper: validate ObjectId-like string (if needed)
const isValidId = (id) => !!id && typeof id === "string" && id.length >= 12;


const showKOTs = async (req, res) => {
  try {
    const userId = req.user._id; // keep same shape you use elsewhere
    const {
      order_source,                // optional query param
      sort = "-order_date"         // default newest first
    } = req.query;

    // Build match filter
    const match = {
      user_id: userId,
      $or: [
        { order_status: "KOT" },
        {
          $and: [
            { order_status: "Paid" },
            { "order_items.status": "Preparing" },
          ],
        },
      ],
    };

    if (order_source) {
      const sources = order_source.split(",").map(s => s.trim());
      match.order_source = sources.length > 1 ? { $in: sources } : sources[0];
    }

    // Pipeline returns only necessary fields and filters order_items to only relevant ones
    const pipeline = [
      { $match: match },
      // Optionally filter order_items to only items not Completed (so kitchen only sees pending)
      { $sort: { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 } }, // basic sort parse
    ];
    const orders = await Order.aggregate(pipeline).exec();

    return res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.error("showKOTs error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateDishStatus = async (req, res) => {
  try {
    const { orderSource, orderId, dishId, status } = req.body;
    if (!orderSource || !orderId || !dishId || !status) {
      res.status(404).json({ success: false, message: "Something was Missing" });
    }
    await Order.updateOne(
      {
        _id: orderId,
        "order_items._id": dishId
      },
      {
        $set: { "order_items.$.status": status }
      }
    );

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");

    console.log("updateAllDishStatus: Emitting updates for orderSource:", orderSource);

    if (orderSource === "Manager" || orderSource === "Captain") {
      const keyManager = `${req.user._id}_Manager`;
      if (io && connectedUsers && connectedUsers[keyManager]) {
        io.to(connectedUsers[keyManager]).emit(
          "dish_status_updated", { orderId, status }
        );
      }
      const keyCaptain = `${req.user._id}_Captain`;
      if (io && connectedUsers && connectedUsers[keyCaptain]) {
        io.to(connectedUsers[keyCaptain]).emit(
          "dish_status_updated", { orderId, status }
        );
      }
    } else if (orderSource === "QSR") {
      const key = `${req.user._id}_QSR`;
      if (io && connectedUsers && connectedUsers[key]) {
        io.to(connectedUsers[key]).emit(
          "dish_status_updated", { orderId, status }
        );
      }
    }

    res.status(200).json({ success: true, message: "Dish status updated." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating dish status.", error });
  }
};

const updateAllDishStatus = async (req, res) => {
  try {
    const userId = req.user;
    const { orderSource, orderId, status, forOnlyPreparing = false } = req.body;

    if (!isValidId(orderId) || !status) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }

    // If you only want to update dishes that are currently 'Preparing', use arrayFilters.
    // Otherwise update all items' status.
    if (forOnlyPreparing) {
      // Only change items that are Preparing
      const result = await Order.updateOne(
        { _id: orderId, user_id: userId },
        { $set: { "order_items.$[elem].status": status } },
        { arrayFilters: [{ "elem.status": "Preparing" }] }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");

      console.log("updateAllDishStatus: Emitting updates for orderSource:", orderSource);

      if (orderSource === "Manager" || orderSource === "Captain") {
        const keyManager = `${req.user._id}_Manager`;
        if (io && connectedUsers && connectedUsers[keyManager]) {
          io.to(connectedUsers[keyManager]).emit(
            "dish_status_updated", { orderId, status }
          );
        }
        const keyCaptain = `${req.user._id}_Captain`;
        if (io && connectedUsers && connectedUsers[keyCaptain]) {
          io.to(connectedUsers[keyCaptain]).emit(
            "dish_status_updated", { orderId, status }
          );
        }
      } else if (orderSource === "QSR") {
        const key = `${req.user._id}_QSR`;
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit(
            "dish_status_updated", { orderId, status }
          );
        }
      }

      return res.json({ success: true, message: "Preparing items updated", result });
    } else {
      // Update all items
      const result = await Order.updateOne(
        { _id: orderId, user_id: userId },
        { $set: { "order_items.$[].status": status } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");

      if (orderSource === "Manager" || orderSource === "Captain") {
        const keyManager = `${req.user._id}_Manager`;
        if (io && connectedUsers && connectedUsers[keyManager]) {
          io.to(connectedUsers[keyManager]).emit(
            "dish_status_updated", { orderId, status }
          );
        }
        const keyCaptain = `${req.user._id}_Captain`;
        if (io && connectedUsers && connectedUsers[keyCaptain]) {
          io.to(connectedUsers[keyCaptain]).emit(
            "dish_status_updated", { orderId, status }
          );
        }
      } else if (orderSource === "QSR") {
        const key = `${req.user._id}_QSR`;
        if (io && connectedUsers && connectedUsers[key]) {
          io.to(connectedUsers[key]).emit(
            "dish_status_updated", { orderId, status }
          );
        }
      }

      return res.json({ success: true, message: "All item statuses updated", result });
    }
  } catch (err) {
    console.error("updateAllDishStatus error:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

module.exports = { showKOTs, updateDishStatus, updateAllDishStatus };
