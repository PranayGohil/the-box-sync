const mongoose = require('mongoose');
const User = require('./models/userModel');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const user = await User.findOne({ Role: 'Admin' });
  if (!user) {
    console.log('No admin found');
    return process.exit();
  }

  // Issue token
  const token = await user.generateAuthToken('Admin');
  const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
  console.log('Token iat:', decoded.iat);

  // Change password to trigger passwordChangedAt
  user.password = 'newpassword123';
  await user.save();
  console.log('Password changed');

  const dbUserAuthCheck = await User.findById(decoded._id).select('passwordChangedAt').lean();
  console.log('dbUserAuthCheck:', dbUserAuthCheck);

  if (dbUserAuthCheck && dbUserAuthCheck.passwordChangedAt) {
    console.log('Type of passwordChangedAt:', typeof dbUserAuthCheck.passwordChangedAt);
    console.log('Is Date?', dbUserAuthCheck.passwordChangedAt instanceof Date);
    
    const changedTimestamp = parseInt(dbUserAuthCheck.passwordChangedAt.getTime() / 1000, 10);
    console.log('changedTimestamp:', changedTimestamp);
    
    if (decoded.iat < changedTimestamp) {
      console.log('SUCCESS: Token invalidated!');
    } else {
      console.log('FAIL: Token still valid!', decoded.iat, changedTimestamp);
    }
  } else {
    console.log('FAIL: dbUserAuthCheck or passwordChangedAt is missing');
  }

  process.exit();
}

run();
