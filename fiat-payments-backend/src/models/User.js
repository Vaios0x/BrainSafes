const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: String,
  wallet: { type: String, unique: true, sparse: true },
  roles: { type: [String], default: ['user'] },
});

const User = mongoose.model('User', userSchema);
module.exports = { User }; 