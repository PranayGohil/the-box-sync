require("dotenv").config();
const mongoose = require("mongoose");
const Manager = require("../models/managerModel");
const User = require("../models/userModel");

const MONGODB_URI = process.env.MONGODB_URI.replace(/"/g, "");

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");

  const users = await User.find({}).select("restaurant_code name email").lean();
  for (const u of users) {
    console.log(`Restaurant: ${u.name || u.email}, Code: ${u.restaurant_code}, ID: ${u._id}`);
    const managers = await Manager.find({ user_id: u._id }).lean();
    for (const m of managers) {
      console.log(`  Manager Username: ${m.username}`);
    }
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
