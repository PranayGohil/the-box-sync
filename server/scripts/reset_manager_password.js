require("dotenv").config();
const mongoose = require("mongoose");
const Manager = require("../models/managerModel");

const MONGODB_URI = process.env.MONGODB_URI.replace(/"/g, "");

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");

  const manager = await Manager.findOne({ username: "sardarji_londonwaley_qsr" });
  if (!manager) {
    console.log("Manager not found");
    await mongoose.disconnect();
    return;
  }

  manager.password = "password"; // Allow mongoose hook to hash it exactly once
  await manager.save();

  console.log("Password reset successfully for sardarji_londonwaley_qsr to 'password'");
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
