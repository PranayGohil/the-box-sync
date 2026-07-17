const mongoose = require('mongoose');
const User = require('./models/userModel');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const users = await User.find({}).select('email passwordChangedAt').lean();
  console.log('Users:', users);
  
  process.exit();
}

run();
