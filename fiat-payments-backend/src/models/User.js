const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  wallet: { type: String, unique: true, required: true, lowercase: true },
  email: { type: String },
  isPremium: { type: Boolean, default: false },
  premiumSince: { type: Date },
  premiumSource: { type: String, enum: ['onramp', 'fiat', 'admin'] },
  lastPaymentId: { type: String },
  kycStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  kycProvider: { type: String },
  kycId: { type: String },
  kycUpdatedAt: { type: Date },
  // Puedes agregar más campos: KYC, cursos, etc.
});

module.exports = mongoose.model('User', userSchema); 