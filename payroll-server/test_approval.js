require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/userModel");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  const users = await User.find().limit(1);
  if(users.length > 0) {
    const user = users[0];
    user.isApproved = false;
    await user.save();
    console.log(`User ${user.email} set to isApproved: false`);
  } else {
    console.log("No users found");
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
