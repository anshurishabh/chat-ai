// server/scripts/makeAdmin.js — nai file banao
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('../models/User');
  const user = await User.findOneAndUpdate(
    { email: 'tumhari_email@gmail.com' },
    { isAdmin: true },
    { new: true }
  );
  console.log('Admin set:', user?.name, user?.isAdmin);
  process.exit();
});