require("dotenv").config();
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

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
