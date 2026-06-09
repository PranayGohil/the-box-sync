const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const mongoURI = process.env.MONGODB_URI;

const run = async () => {
  try {
    console.log("Connecting to:", mongoURI);
    await mongoose.connect(mongoURI);
    console.log("Connected successfully to MongoDB!");

    const db = mongoose.connection.db;

    const users = await db.collection("users").find({}, { projection: { _id: 1, name: 1, email: 1, role: 1 } }).toArray();
    console.log("Database Users:", users);

    const corruptCount = await db.collection("inventories").countDocuments({ user_id: "[object Object]" });
    console.log("Corrupt inventory count (user_id = '[object Object]'):", corruptCount);

    const normalCount = await db.collection("inventories").countDocuments({ user_id: { $ne: "[object Object]" } });
    console.log("Normal inventory count:", normalCount);

    const someCorrupt = await db.collection("inventories").find({ user_id: "[object Object]" }).limit(3).toArray();
    console.log("Sample corrupt inventories:", someCorrupt);

    const someNormal = await db.collection("inventories").find({ user_id: { $ne: "[object Object]" } }).limit(3).toArray();
    console.log("Sample normal inventories:", someNormal);

    if (corruptCount > 0 && users.length > 0) {
      // Find the first user who is a manager or owner
      const targetUser = users.find(u => u.email === "rushimaru83@gmail.com") || users[0];
      if (targetUser) {
        const targetIdStr = String(targetUser._id);
        console.log(`Fixing ${corruptCount} corrupt records to belong to user: ${targetIdStr} (${targetUser.email})`);
        const result = await db.collection("inventories").updateMany(
          { user_id: "[object Object]" },
          { $set: { user_id: targetIdStr } }
        );
        console.log("Update result:", result);
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
