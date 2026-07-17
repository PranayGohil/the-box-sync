const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
  getNotifications,
  markNotificationsRead,
  markSingleNotificationRead,
  deleteNotification,
  deleteAllNotifications,
} = require("../controllers/notificationController");

const notificationRouter = express.Router();

notificationRouter.route("/")
  .get(authMiddleware, getNotifications)
  .delete(authMiddleware, deleteAllNotifications);

notificationRouter.route("/mark-read").put(authMiddleware, markNotificationsRead);
notificationRouter.route("/mark-read/:id").put(authMiddleware, markSingleNotificationRead);
notificationRouter.route("/:id").delete(authMiddleware, deleteNotification);

module.exports = notificationRouter;
