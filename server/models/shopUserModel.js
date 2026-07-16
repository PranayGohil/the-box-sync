const mongoose = require("mongoose");

// Create secondary connection for Shop Database
const shopDbConnection = mongoose.createConnection(process.env.SHOP_DB_URI);

shopDbConnection.on('error', (err) => {
    console.error("Shop DB connection error:", err);
});

shopDbConnection.once('open', () => {
    console.log("Connected to Shop DB (secondary connection)");
});

// Import the existing user schema
const User = require("./userModel");
const userSchema = User.schema;

// Bind it to the shop connection
const ShopUser = shopDbConnection.model("users", userSchema);

module.exports = ShopUser;
