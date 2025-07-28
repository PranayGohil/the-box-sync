const Order = require("../models/orderModel");

const showKOTs = async (req, res) => {
  try {
    const orderData = await Order.find({
      $and: [
        { restaurant_id: req.user },
        {
          $or: [
            { order_status: "KOT" },
            // { order_status: "KOT and Print" },
            {
              $and: [
                { order_status: "Paid" },
                { order_items: { $elemMatch: { status: "Preparing" } } },
              ],
            },
          ],
        },
      ],
    });

    res.json(orderData);
  } catch (error) {
    console.error("Error fetching KOTs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateDishStatus = async (req, res) => {
  try {
    const { orderId, dishId, status } = req.body;

    await Order.updateOne(
      { _id: orderId, "order_items._id": dishId },
      { $set: { "order_items.$.status": status } }
    );

    res.status(200).json({ success: true, message: "Dish status updated." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error updating dish status.", error });
  }
};

const updateAllDishStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    await Order.updateOne(
      { _id: orderId },
      { $set: { "order_items.$[].status": status } }
    );

    res
      .status(200)
      .json({ success: true, message: "All dish statuses updated." });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating all dish statuses.",
      error,
    });
  }
};

module.exports = {
  showKOTs,
  updateDishStatus,
  updateAllDishStatus,
};
