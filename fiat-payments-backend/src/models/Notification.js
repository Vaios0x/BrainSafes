const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  wallet: { type: String, required: true, lowercase: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema); 