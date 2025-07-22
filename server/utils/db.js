const mongoose = require("mongoose");
const uri = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log("database connected");
    } catch (error) {
        console.error("database connection failed");
        process.exit(0);
    }
};

module.exports = connectDB;