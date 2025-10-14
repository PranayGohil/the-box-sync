const Order = require("../models/orderModel");
const Kot = require("../models/kotModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const showKOTs = async (req, res) => {
  try {
    const orderData = await Order.find({
      $and: [
        { user_id: req.user },
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

const kotLogin = async (req, res) => {
  try {
    console.log(req.body);
    const { restaurant_code, username, password } = req.body;

    const user = await User.findOne({ restaurant_code });

    if (!user) {
      console.log("User not found");
      return res.json({ message: "Invalid restaurant code" });
    }
    console.log("kot : " + user);

    const kot = await Kot.findOne({
      username: username,
      user_id: user._id,
    });

   

    if (!kot) {
      return res.json({ message: "Invalid Username" });
    }

    const isMatch = await bcrypt.compare(password, kot.password);

    if (!isMatch) {
      return res.json({ message: "Invalid Password" });
    }

    token = await user.generateAuthToken("Kot");
    res.cookie("jwttoken", token, {
      expires: new Date(Date.now() + 25892000000),
      httpOnly: true,
    });

    res.status(200).json({ message: "Logged In", token });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  showKOTs,
  updateDishStatus,
  updateAllDishStatus,
  kotLogin
};
