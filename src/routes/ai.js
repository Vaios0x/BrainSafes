const express = require("express");
const router = express.Router();
const axios = require("axios");

// OpenAI Chat
router.post("/openai/chat", async (req, res) => {
  const { prompt } = req.body;
  try {
    const r = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    res.json({ result: r.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gemini Chat
router.post("/gemini/chat", async (req, res) => {
  const { prompt } = req.body;
  try {
    const r = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    res.json({ result: r.data.candidates[0].content.parts[0].text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HuggingFace Generate
router.post("/huggingface/generate", async (req, res) => {
  const { prompt } = req.body;
  try {
    const r = await axios.post(
      "https://api-inference.huggingface.co/models/gpt2",
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );
    res.json({ result: r.data[0].generated_text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Procesamiento NLP (sentimiento, resumen, entidades) vía OpenAI
router.post("/openai/nlp", async (req, res) => {
  const { text, task } = req.body;
  let prompt = "";
  if (task === "sentiment") prompt = `Analiza el sentimiento del siguiente texto: '${text}'.`;
  else if (task === "summary") prompt = `Resume el siguiente texto: '${text}'.`;
  else if (task === "entities") prompt = `Extrae las entidades nombradas del siguiente texto: '${text}'.`;
  else return res.status(400).json({ error: "Tarea NLP no soportada" });
  try {
    const r = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    res.json({ result: r.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 