require("dotenv").config();
require("express-async-errors");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./utils/db");
const uploadRouter = require("./router/upload-router");
const staffRouter = require("./router/staffRoutes");
const staffAttendanceRouter = require("./router/staffAttendanceRoutes");
const staffPayrollRouter = require("./router/staffPayrollRouter.js");
const payrollConfigRouter = require("./router/payrollConfigRouter.js");

const userRouter = require("./router/userRoutes");
const superAdminRouter = require("./router/superAdminRoutes");
const PanelRouter = require("./router/panelUserRoutes");
const kioskRouter = require("./router/kioskRoutes");

const PORT = process.env.PORT;

const app = express();

// Create HTTP server and attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const connectedUsers = {};

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

// Serve uploaded files (staff photos, ID cards, etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/upload", uploadRouter);
app.use("/api/staff", staffRouter);
app.use("/api/attendance", staffAttendanceRouter);
app.use("/api/payroll", staffPayrollRouter);
app.use("/api/payroll-config", payrollConfigRouter);

app.use("/api/user", userRouter);
app.use("/api/superadmin", superAdminRouter);
app.use("/api/panel-user", PanelRouter);
app.use("/api/kiosk", kioskRouter);
app.use("/api/holidays", require("./router/holidayRouter"));
app.use("/api/leave-policy", require("./router/leavePolicyRouter"));
app.use("/api/leave", require("./router/leaveRouter"));
app.use("/api/salary-advance", require("./router/salaryAdvanceRouter"));

const errorHandler = require("./middlewares/errorHandler");
app.use(errorHandler);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Payroll server running on port ${PORT}`);
  });
});
