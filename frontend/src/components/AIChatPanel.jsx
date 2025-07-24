import React, { useState } from "react";
import axios from "axios";

const MODELS = [
  { key: "openai", label: "OpenAI GPT-4" },
  { key: "gemini", label: "Gemini (Google AI)" }
];

export default function AIChatPanel() {
  const [model, setModel] = useState(MODELS[0].key);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse("");
    try {
      const url = model === "openai" ? "/ai/openai/chat" : "/ai/gemini/chat";
      const res = await axios.post(url, { prompt });
      setResponse(res.data.result);
    } catch (err) {
      setResponse("Error: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h3>Chat IA (OpenAI / Gemini)</h3>
      <form onSubmit={handleSend}>
        <select value={model} onChange={e => setModel(e.target.value)}>
          {MODELS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
        </select>
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Escribe tu pregunta o prompt..."
          style={{ width: 350 }}
          required
        />
        <button type="submit" disabled={loading}>Enviar</button>
      </form>
      {loading && <div>Cargando respuesta...</div>}
      {response && (
        <div style={{ marginTop: 20, background: "#f8f8f8", padding: 10, borderRadius: 4 }}>
          <b>Respuesta:</b><br />
          <pre style={{ whiteSpace: "pre-wrap" }}>{response}</pre>
        </div>
      )}
    </div>
  );
} 