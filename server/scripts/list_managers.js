require("dotenv").config();
const mongoose = require("mongoose");
const Manager = require("../models/managerModel");
const User = require("../models/userModel");

const MONGODB_URI = process.env.MONGODB_URI.replace(/"/g, "");

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");

  const managers = await Manager.find({}).lean();
  console.log(`Total managers: ${managers.length}`);
  for (const m of managers) {
    const parentUser = await User.findById(m.user_id).lean();
    console.log(`Manager Username: ${m.username}, user_id: ${m.user_id}, Parent Restaurant: ${parentUser ? parentUser.name : "Not Found"}`);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
