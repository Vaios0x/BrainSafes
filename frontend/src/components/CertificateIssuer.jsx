import React, { useState } from "react";
import axios from "axios";

export default function CertificateIssuer() {
  const [form, setForm] = useState({ to: "", degree: "", university: "", issuedAt: "", uri: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post("/university/issue-certificate", form);
      setResult(res.data);
    } catch (err) {
      setResult({ success: false, error: err.response?.data?.error || err.message });
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto" }}>
      <h3>Emitir Certificado NFT</h3>
      <form onSubmit={handleSubmit}>
        <input name="to" value={form.to} onChange={handleChange} placeholder="Dirección del estudiante" required />
        <input name="degree" value={form.degree} onChange={handleChange} placeholder="Título" required />
        <input name="university" value={form.university} onChange={handleChange} placeholder="Universidad" required />
        <input name="issuedAt" value={form.issuedAt} onChange={handleChange} placeholder="Fecha (YYYY-MM-DD)" required />
        <input name="uri" value={form.uri} onChange={handleChange} placeholder="Metadata URI (opcional)" />
        <button type="submit" disabled={loading}>Emitir</button>
      </form>
      {result && (
        <div style={{ marginTop: 20 }}>
          {result.success ? (
            <div>
              <b>Certificado emitido correctamente</b><br />
              Tx: <a href={`https://arbiscan.io/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer">{result.txHash}</a>
            </div>
          ) : (
            <div style={{ color: "red" }}>Error: {result.error}</div>
          )}
        </div>
      )}
    </div>
  );
} 