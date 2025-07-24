const express = require("express");
const router = express.Router();
const axios = require("axios");

// Obtener cursos de Moodle
router.get("/moodle/courses/:userId", async (req, res) => {
  const { userId } = req.params;
  // Simulación: integración real con API de Moodle
  // const MOODLE_URL = "https://tu-moodle.com/webservice/rest/server.php";
  // const TOKEN = "tu_token";
  // const result = await axios.get(MOODLE_URL, { params: { wstoken: TOKEN, wsfunction: "core_enrol_get_users_courses", moodlewsrestformat: "json", userid: userId } });
  // res.json(result.data);
  res.json([
    { id: 1, name: "Blockchain 101", progress: 80 },
    { id: 2, name: "Smart Contracts", progress: 100 }
  ]);
});

// Obtener cursos de Blackboard
router.get("/blackboard/courses/:userId", async (req, res) => {
  const { userId } = req.params;
  // Simulación: integración real con API de Blackboard
  // const BB_URL = "https://tu-blackboard.com/learn/api/public/v1/courses";
  // const ACCESS_TOKEN = "tu_access_token";
  // const result = await axios.get(`${BB_URL}?userId=${userId}`, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });
  // res.json(result.data.results);
  res.json([
    { id: "bb1", name: "AI Fundamentals", progress: 60 },
    { id: "bb2", name: "Data Science", progress: 90 }
  ]);
});

module.exports = router; 