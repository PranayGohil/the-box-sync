require("dotenv").config();
require("express-async-errors");
require('./cron/reservationCron');
require('./cron/dailyStockCron');
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./utils/db");
const uploadRouter = require("./router/upload-router");
const chargeRouter = require("./router/chargeRoutes");
const feedbackRouter = require("./router/feedbackRoutes");
const inventoryRouter = require("./router/inventoryRoutes");
const kotRouter = require("./router/kotRoutes");
const menuRouter = require("./router/menuRoutes");
const orderRouter = require("./router/orderRoutes");
const staffRouter = require("./router/staffRoutes");

const subscriptionRouter = require("./router/subscriptionRoutes");
const tableRouter = require("./router/tableRoutes");
const userRouter = require("./router/userRoutes");
const inquiryRouter = require("./router/inquiryRoutes");
const superAdminRouter = require("./router/superAdminRoutes");
const websiteRouter = require("./router/websiteRoutes");
const customerQueryRouter = require("./router/customerQueryRoutes");
const PanelRouter = require("./router/panelUserRoutes");
const statisticsRouter = require("./router/statisticsRoutes.js");
const roomRouter = require("./router/roomRoutes.js");
const hotelBookingRouter = require("./router/hotelBookingRoutes.js");
const customerRouter = require("./router/customerRoutes.js");
const webCustomerRouter = require("./router/webCustomerRoutes.js");
const otpRouter = require("./router/otpRoutes.js");
const waiterRouter = require("./router/waiterRoutes.js");
const reservationRouter = require("./router/reservationRoutes.js");
const dailyStockRouter = require("./router/dailyStockRoutes.js");
const loyaltyRouter = require("./router/loyaltyRoutes.js");
const notificationRouter = require("./router/notificationRoutes");
const campaignTemplateRouter = require("./router/campaignTemplateRoutes");

const PORT = process.env.PORT;
// const ORIGINS = process.env.ORIGINS ? process.env.ORIGINS.split(",") : [];

const app = express();

// create HTTP server and pass to socket
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Replace with frontend domain in production
    methods: ["GET", "POST"],
  },
});

const connectedUsers = {}; // Track employees

const emitToUser = (userId, event, data) => {
  const socketId = connectedUsers[userId];
  if (socketId && io) {
    io.to(socketId).emit(event, data);
  }
};

module.exports = { emitToUser };

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("register", ({ userId, role }) => {
    const key = `${userId}_${role}`;
    connectedUsers[key] = socket.id;
    console.log("Connected users:", connectedUsers);
  });

  socket.on("join_restaurant_room", (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    console.log(`Socket ${socket.id} joined restaurant room: restaurant_${restaurantId}`);
  });

  socket.on("join_customer_room", (customerId) => {
    socket.join(`customer_${customerId}`);
    console.log(`Socket ${socket.id} joined customer room: customer_${customerId}`);
  });

  socket.on("join_order_room", (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`Socket ${socket.id} joined order room: order_${orderId}`);
  });

  socket.on("approve_order", async ({ orderId }) => {
    try {
      const Order = require("./models/orderModel");
      const order = await Order.findById(orderId);
      if (order) {
        order.order_status = "KOT";
        const { getTargetItemStatus } = require("./controllers/orderController");
        const targetStatus = await getTargetItemStatus(order.user_id);
        order.order_items = order.order_items.map((item) => ({
          ...item,
          status: item.status === "Pending" ? targetStatus : item.status,
        }));
        await order.save();

        console.log(`Socket: Order ${orderId} approved and set to KOT`);
        // Broadcast
        let restaurantId = order.user_id ? order.user_id.toString() : null;
        let customerId = order.customer_id ? order.customer_id.toString() : null;
        if (restaurantId) {
          io.to(`restaurant_${restaurantId}`).emit("kot_update", order);
          io.to(`restaurant_${restaurantId}`).emit("order_updated", order);
        }
        if (customerId) {
          io.to(`customer_${customerId}`).emit("order_updated", order);
        }
        io.to(`order_${orderId}`).emit("order_updated", order);
      }
    } catch (err) {
      console.error("Socket approve_order error:", err);
    }
  });

  socket.on("reject_order", async ({ orderId }) => {
    try {
      const Order = require("./models/orderModel");
      const order = await Order.findById(orderId);
      if (order) {
        order.order_status = "Rejected";
        order.order_items = order.order_items.map((item) => ({
          ...item,
          status: "Cancelled",
        }));
        await order.save();

        console.log(`Socket: Order ${orderId} rejected`);
        // Broadcast
        let restaurantId = order.user_id ? order.user_id.toString() : null;
        let customerId = order.customer_id ? order.customer_id.toString() : null;
        if (restaurantId) {
          io.to(`restaurant_${restaurantId}`).emit("kot_update", order);
          io.to(`restaurant_${restaurantId}`).emit("order_updated", order);
        }
        if (customerId) {
          io.to(`customer_${customerId}`).emit("order_updated", order);
        }
        io.to(`order_${orderId}`).emit("order_updated", order);
      }
    } catch (err) {
      console.error("Socket reject_order error:", err);
    }
  });

  socket.on("disconnect", () => {
    for (let id in connectedUsers) {
      if (connectedUsers[id] === socket.id) delete connectedUsers[id];
    }
  });
});

app.set("io", io);
app.set("connectedUsers", connectedUsers);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors());
// app.use(
//   cors({
//     origin: ORIGINS,
//     credentials: true,
//   })
// );

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "../landing-page")));

app.use("/api/upload", uploadRouter);
app.use("/api/charge", chargeRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/kot", kotRouter);
app.use("/api/menu", menuRouter);
app.use("/api/order", orderRouter);
app.use("/api/staff", staffRouter);


app.use("/api/subscription", subscriptionRouter);
app.use("/api/table", tableRouter);
app.use("/api/user", userRouter);
app.use("/api/inquiry", inquiryRouter);
app.use("/api/website", websiteRouter);
app.use("/api/customerquery", customerQueryRouter);
app.use("/api/panel-user", PanelRouter);
app.use("/api/superadmin", superAdminRouter);
app.use("/api/statistics", statisticsRouter);
app.use("/api/room", roomRouter);
app.use("/api/hotel-booking", hotelBookingRouter);
app.use("/api/customer", customerRouter);
app.use("/api/web-customer", webCustomerRouter);
app.use("/api/otp", otpRouter)
app.use("/api/waiter", waiterRouter);
app.use("/api/reservation", reservationRouter);
app.use("/api/daily-stock", dailyStockRouter);
app.use("/api/loyalty", loyaltyRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/campaign-template", campaignTemplateRouter);


const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
