const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const user = await User.findOne({});
  user.passwordChangedAt = new Date();
  await user.save();
  console.log('Saved user');

  const dbUser = await User.findById(user._id).select('passwordChangedAt').lean();
  console.log('dbUser after save:', dbUser);
  
  process.exit();
}

run();
