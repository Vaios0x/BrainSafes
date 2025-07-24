const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function notifyBadgeByEmail(userEmail, badgeName, badgeURI) {
  await transporter.sendMail({
    from: 'BrainSafes <noreply@brainsafes.com>',
    to: userEmail,
    subject: `¡Has recibido un nuevo badge: ${badgeName}!`,
    html: `
      <h2>¡Felicidades!</h2>
      <p>Has recibido el badge <b>${badgeName}</b> por tu logro en BrainSafes.</p>
      <p>Puedes verlo aquí: <a href="https://ipfs.io/ipfs/${badgeURI.replace('ipfs://', '')}">Ver badge</a></p>
    `,
  });
}

async function saveInAppNotification(userWallet, title, message, link) {
  await Notification.create({
    wallet: userWallet.toLowerCase(),
    title,
    message,
    link,
    read: false,
    createdAt: new Date(),
  });
}

module.exports = { notifyBadgeByEmail, saveInAppNotification }; 