require("dotenv").config();
const mongoose = require("mongoose");
const Menu = require("../models/menuModel");

const MONGODB_URI = process.env.MONGODB_URI.replace(/"/g, "");

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");

  const menus = await Menu.find({}).lean();
  console.log(`Total menu documents: ${menus.length}`);
  
  const userIds = new Set();
  menus.forEach(m => {
    userIds.add(m.user_id);
  });

  console.log("Unique user_ids in menus:", Array.from(userIds));

  menus.forEach(m => {
    if (m.user_id === "[object Object]") {
      console.log(`Found buggy menu document: ID ${m._id}, Category: ${m.category}, meal_type: ${m.meal_type}`);
    }
  });

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
