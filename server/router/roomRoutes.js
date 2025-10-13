const express = require("express");
const authMiddleware = require("../middlewares/auth-middlewares");
const {
    addRoomCategory,
    getRoomCategories,
    getRoomCategoryById,
    updateRoomCategory,
    deleteRoomCategory,
    addRoom,
    getRooms,
    getRoomById,
    updateRoom,
    deleteRoom,
    updateRoomStatus,
    getAvailableRooms,
    getRoomsByCategory,
    getRoomStats,
    bulkUpdateRoomStatus,
} = require("../controllers/roomController");
const upload = require("../middlewares/upload");

const roomRouter = express.Router();

roomRouter.route("/category/add").post(authMiddleware, upload.array('room_imgs', 10), addRoomCategory);
roomRouter.route("/category/get").get(authMiddleware, getRoomCategories);
roomRouter.route("/category/get/:id").get(authMiddleware, getRoomCategoryById);
roomRouter.route("/category/update/:id").put(authMiddleware, upload.array('room_imgs', 10), updateRoomCategory);
roomRouter.route("/category/delete/:id").delete(authMiddleware, deleteRoomCategory);

roomRouter.route("/add").post(authMiddleware, upload.array('room_imgs', 10), addRoom);
roomRouter.route("/get").get(authMiddleware, getRooms);
roomRouter.route("/get/:id").get(authMiddleware, getRoomById);
roomRouter.route("/update/:id").put(authMiddleware, upload.array('room_imgs', 10), updateRoom);
roomRouter.route("/delete/:id").delete(authMiddleware, deleteRoom);
roomRouter.route("/update-status").put(authMiddleware, updateRoomStatus);
roomRouter.route("/get-available-rooms").get(authMiddleware, getAvailableRooms);
roomRouter.route("/get-by-category").get(authMiddleware, getRoomsByCategory);
roomRouter.route("/get-stats").get(authMiddleware, getRoomStats);
roomRouter.route("/bulk-update-status").put(authMiddleware, bulkUpdateRoomStatus);

module.exports = roomRouter;