import React, { useState } from "react";
import axios from "axios";

const TASKS = [
  { key: "sentiment", label: "Análisis de Sentimiento" },
  { key: "summary", label: "Resumen" },
  { key: "entities", label: "Extracción de Entidades" }
];

export default function NLPAnalyzer() {
  const [task, setTask] = useState(TASKS[0].key);
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult("");
    try {
      const res = await axios.post("/ai/openai/nlp", { text, task });
      setResult(res.data.result);
    } catch (err) {
      setResult("Error: " + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h3>Procesamiento de Lenguaje Natural (NLP)</h3>
      <form onSubmit={handleAnalyze}>
        <select value={task} onChange={e => setTask(e.target.value)}>
          {TASKS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Introduce el texto a analizar..."
          rows={4}
          style={{ width: 400 }}
          required
        />
        <button type="submit" disabled={loading}>Analizar</button>
      </form>
      {loading && <div>Analizando...</div>}
      {result && (
        <div style={{ marginTop: 20, background: "#f8f8f8", padding: 10, borderRadius: 4 }}>
          <b>Resultado:</b><br />
          <pre style={{ whiteSpace: "pre-wrap" }}>{result}</pre>
        </div>
      )}
    </div>
  );
} 