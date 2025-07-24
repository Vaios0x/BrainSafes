const nodemailer = require("nodemailer");
const axios = require("axios");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.ALERT_EMAIL, pass: process.env.ALERT_PASS }
});

async function sendEmailAlert(subject, text) {
  await transporter.sendMail({
    from: process.env.ALERT_EMAIL,
    to: process.env.ALERT_EMAIL,
    subject,
    text
  });
}

async function sendTelegramAlert(text) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text
  });
}

async function sendSlackAlert(text) {
  if (!process.env.SLACK_WEBHOOK_URL) return;
  await axios.post(process.env.SLACK_WEBHOOK_URL, { text });
}

module.exports = { sendEmailAlert, sendTelegramAlert, sendSlackAlert }; 