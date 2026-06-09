require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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

  const commonPasswords = ["123456", "password", "sardarji", "sardarji_londonwaley_qsr"];
  for (const pw of commonPasswords) {
    const isMatch = await bcrypt.compare(pw, manager.password);
    if (isMatch) {
      console.log(`Match found! Password is: "${pw}"`);
      await mongoose.disconnect();
      return;
    }
  }

  console.log("No match found for common passwords.");
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
