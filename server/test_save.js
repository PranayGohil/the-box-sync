const mongoose = require('mongoose');
const User = require('./models/userModel');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const user = await User.findOne({});
  if (!user) {
    console.log('No user found');
    return process.exit();
  }
  console.log('Testing on user:', user.email);

  // Update password like resetAdminPassword does
  user.password = 'testpassword123';
  await user.save();
  console.log('Saved user');

  // Verify it saved
  const dbUser = await User.findById(user._id).select('passwordChangedAt').lean();
  console.log('dbUser after save:', dbUser);
  
  process.exit();
}

run();
