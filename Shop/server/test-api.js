
const mongoose = require('mongoose');
const User = require('./models/userModel');

async function testApi() {
  await mongoose.connect('mongodb://localhost:27017/shop');
  
  // Create a shop user if not exists
  let user = await User.findOne({ email: 'testshop@example.com' });
  if (!user) {
    user = new User({ email: 'testshop@example.com', name: 'Test Shop', password: 'password123', is_shop: true });
    await user.save();
  }
  
  try {
    // 1. Send OTP
    const sendRes = await fetch('http://localhost:4009/api/user/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testshop@example.com', login_from: 'shop' })
    });
    const sendData = await sendRes.json();
    console.log('Send OTP Response:', sendData);
    
    // Get OTP from DB
    const updatedUser = await User.findOne({ email: 'testshop@example.com' });
    const actualOtp = updatedUser.otp;
    console.log('OTP generated in DB:', actualOtp);
    
    // 2. Verify OTP
    const verifyRes = await fetch('http://localhost:4009/api/user/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testshop@example.com', otp: actualOtp.toString(), login_from: 'shop' })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify OTP Response:', verifyData);
    
  } catch (err) {
    console.error('API Error:', err.response ? err.response.data : err.message);
  }
  
  process.exit(0);
}

testApi();
