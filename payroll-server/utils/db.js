const mongoose = require("mongoose");
const uri = process.env.MONGODB_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log("database connected successfully to primary Atlas URI");
    } catch (error) {
        console.error("database connection to primary Atlas URI failed:", error.message);
        console.log("Attempting fallback to local MongoDB (mongodb://127.0.0.1:27017/the_box_payroll)...");
        try {
            await mongoose.connect("mongodb://127.0.0.1:27017/the_box_payroll");
            console.log("database connected successfully to local fallback MongoDB");
        } catch (localError) {
            console.error("Local fallback MongoDB connection also failed:", localError.message);
            console.error("Please ensure either your MongoDB Atlas cluster allows connection from your current IP or a local MongoDB server is running.");
            process.exit(0);
        }
    }
};

module.exports = connectDB;