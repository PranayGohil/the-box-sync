const mongoose = require('mongoose');
const User = require('./server/models/userModel');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/shop', { useNewUrlParser: true, useUnifiedTopology: true });
  
  let user = await User.findOne({});
  if (!user) {
    user = new User({ email: 'test@example.com', name: 'Test', password: 'abc', is_shop: true });
    await user.save();
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000);
  user.otp = otp;
  user.otpExpiry = Date.now() + 10 * 60 * 1000;
  await user.save();
  
  const updatedUser = await User.findOne({ _id: user._id });
  console.log('Saved OTP:', updatedUser.otp, 'Expected:', otp);
  console.log('Saved Expiry:', updatedUser.otpExpiry);
  
  if (updatedUser.otp !== parseInt(otp.toString(), 10)) {
    console.log('OTP MISMATCH!');
  }
  
  if (Date.now() > updatedUser.otpExpiry) {
    console.log('EXPIRED IMMEDIATELY!');
  } else {
    console.log('Expiry OK');
  }
  
  process.exit(0);
}

test();
