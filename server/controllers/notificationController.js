const Notification = require("../models/notificationModel");

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    // Get latest 20 notifications for the logged-in restaurant admin
    const notifications = await Notification.find({
      restaurant_id: userId,
      receiver: "Admin",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { restaurant_id: userId, receiver: "Admin", read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.markSingleNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, restaurant_id: userId, receiver: "Admin" },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, message: "Notification marked as read", data: notification });
  } catch (error) {
    console.error("Error marking notification read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const notification = await Notification.findOneAndDelete({
      _id: id,
      restaurant_id: userId,
      receiver: "Admin"
    });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({
      restaurant_id: userId,
      receiver: "Admin"
    });
    res.status(200).json({ success: true, message: "All notifications deleted successfully" });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
