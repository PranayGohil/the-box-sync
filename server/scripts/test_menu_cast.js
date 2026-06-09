require("dotenv").config();
const mongoose = require("mongoose");
const Menu = require("../models/menuModel");

const MONGODB_URI = process.env.MONGODB_URI.replace(/"/g, "");

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to DB");

  const userObj = { _id: "6937b920f45bc0d16bde1cee", Role: "Manager" };

  try {
    console.log("Testing Menu.findOne with userObj...");
    const menu = await Menu.findOne({ user_id: userObj, category: "Test" });
    console.log("FindOne completed successfully, found:", menu);
  } catch (err) {
    console.error("FindOne failed with error:", err.message);
  }

  try {
    console.log("\nTesting new Menu save with userObj...");
    const newMenu = new Menu({
      user_id: userObj,
      category: "TestCategory",
      meal_type: "veg",
      dishes: [{ dish_name: "Test Dish", dish_price: 100 }]
    });
    await newMenu.save();
    console.log("Save completed successfully!");
    
    // Clean up
    await Menu.deleteOne({ _id: newMenu._id });
    console.log("Cleanup completed.");
  } catch (err) {
    console.error("Save failed with error:", err.message);
    console.error(err);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
