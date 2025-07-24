const User = require('../models/User');

async function setPremium(wallet, source, paymentId) {
  const now = new Date();
  const user = await User.findOneAndUpdate(
    { wallet: wallet.toLowerCase() },
    {
      $set: {
        isPremium: true,
        premiumSince: now,
        premiumSource: source,
        lastPaymentId: paymentId,
      },
    },
    { upsert: true, new: true }
  );
  return user;
}

async function setKYC(wallet, status, provider, kycId) {
  const now = new Date();
  const user = await User.findOneAndUpdate(
    { wallet: wallet.toLowerCase() },
    {
      $set: {
        kycStatus: status,
        kycProvider: provider,
        kycId,
        kycUpdatedAt: now,
      },
    },
    { upsert: true, new: true }
  );
  return user;
}

module.exports = { setPremium, setKYC }; 