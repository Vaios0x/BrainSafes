const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { sendEmailAlert, sendTelegramAlert, sendSlackAlert } = require("./alertChannels");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
app.use(bodyParser.json());

// MongoDB setup
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/analytics", { useNewUrlParser: true, useUnifiedTopology: true });

const metricSchema = new mongoose.Schema({
  type: String,
  user: String,
  value: Number,
  timestamp: { type: Date, default: Date.now },
  details: mongoose.Schema.Types.Mixed
});
const Metric = mongoose.model("Metric", metricSchema);

// Email alert setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.ALERT_EMAIL, pass: process.env.ALERT_PASS }
});

// Real-time metrics
io.on("connection", (socket) => {
  socket.on("metric", async (data) => {
    const metric = new Metric(data);
    await metric.save();
    io.emit("metric", data); // broadcast to all
    // Alertas avanzadas
    if (data.type === "error" || (data.value && data.value > 1000)) {
      const msg = `Evento crítico: ${JSON.stringify(data)}`;
      await sendEmailAlert(`Alerta: ${data.type}`, msg);
      await sendTelegramAlert(msg);
      await sendSlackAlert(msg);
    }
  });
});

// REST endpoint: métricas históricas
app.get("/metrics", async (req, res) => {
  const { type, user, from, to } = req.query;
  const query = {};
  if (type) query.type = type;
  if (user) query.user = user;
  if (from || to) query.timestamp = {};
  if (from) query.timestamp.$gte = new Date(from);
  if (to) query.timestamp.$lte = new Date(to);
  const metrics = await Metric.find(query).sort({ timestamp: -1 }).limit(1000);
  res.json(metrics);
});

// REST endpoint: métricas agregadas
app.get("/metrics/aggregate", async (req, res) => {
  const { type, period = "day" } = req.query;
  const group = {
    day: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
    hour: { $dateToString: { format: "%Y-%m-%d %H", date: "$timestamp" } }
  };
  const pipeline = [
    ...(type ? [{ $match: { type } }] : []),
    { $group: { _id: group[period] || group.day, count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ];
  const result = await Metric.aggregate(pipeline);
  res.json(result);
});

app.post("/metrics", async (req, res) => {
  const data = req.body;
  const metric = new Metric(data);
  await metric.save();
  io.emit("metric", data);
  res.json({ success: true });
});

server.listen(4000, () => console.log("Analytics backend listening on 4000")); 