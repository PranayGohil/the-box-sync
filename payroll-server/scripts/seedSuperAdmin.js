require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const SuperAdmin = require("../models/superAdminModel");

const seedSuperAdmin = async () => {
  try {
    // Connect to Database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for seeding...");

    // Read from .env
    const username = process.env.SUPER_ADMIN_USERNAME;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const email = process.env.SUPER_ADMIN_EMAIL || "superadmin@example.com";

    if (!username || !password) {
      console.error("❌ Cannot seed: SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD must be in your .env file.");
      process.exit(1);
    }

    // Check if any Super Admin exists
    const adminCount = await SuperAdmin.countDocuments();
    if (adminCount > 0) {
      console.log("✅ Super Admins already exist in the database. No seeding required.");
      process.exit(0);
    }

    // Create the first Super Admin
    const superAdmin = new SuperAdmin({
      username,
      email,
      password, // Password will be hashed by the pre-save hook in the model
    });

    await superAdmin.save();
    console.log(`✅ Successfully seeded Super Admin: ${username}`);
    
    // Optional: Warn user to remove credentials from .env
    console.log("⚠️  SECURITY WARNING: You should now remove SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD from your .env file.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Super Admin:", error);
    process.exit(1);
  }
};

seedSuperAdmin();
