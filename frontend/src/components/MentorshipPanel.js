import React, { useState } from "react";
import { useMentorship } from "../hooks/useMentorship";

export default function MentorshipPanel({ contractAddress }) {
  const {
    registerMentor,
    requestMentorship,
    acceptMentorship,
    endMentorship,
    submitFeedback,
    loading,
    error
  } = useMentorship(contractAddress);

  const [mentor, setMentor] = useState("");
  const [mentorshipId, setMentorshipId] = useState("");
  const [rating, setRating] = useState("");
  const [feedback, setFeedback] = useState("");

  return (
    <div>
      <h3>Registro de Mentor</h3>
      <button onClick={registerMentor} disabled={loading}>Registrarse como mentor</button>
      <h3>Solicitar Mentoría</h3>
      <input value={mentor} onChange={e => setMentor(e.target.value)} placeholder="Dirección del mentor" />
      <button onClick={() => requestMentorship(mentor)} disabled={loading}>Solicitar</button>
      <h3>Aceptar Mentoría</h3>
      <input value={mentorshipId} onChange={e => setMentorshipId(e.target.value)} placeholder="ID de mentoría" />
      <button onClick={() => acceptMentorship(mentorshipId)} disabled={loading}>Aceptar</button>
      <h3>Finalizar Mentoría</h3>
      <button onClick={() => endMentorship(mentorshipId)} disabled={loading}>Finalizar</button>
      <h3>Enviar Feedback</h3>
      <input value={rating} onChange={e => setRating(e.target.value)} placeholder="Rating (1-5)" />
      <input value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Feedback" />
      <button onClick={() => submitFeedback(mentorshipId, rating, feedback)} disabled={loading}>Enviar</button>
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
    </div>
  );
} 