require("dotenv").config();
const mongoose = require("mongoose");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const plans = await mongoose.connection.db.collection("subscriptionplans").find({}).toArray();
    console.log("PLANS IN DB:");
    console.log(JSON.stringify(plans, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
