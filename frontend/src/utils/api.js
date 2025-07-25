const API_URL = "http://localhost:3000/api"; // Cambia según tu backend

export async function getUser(userId) {
  const res = await fetch(`${API_URL}/user/${userId}`);
  if (!res.ok) throw new Error("Error al obtener usuario");
  return res.json();
}

export async function createPayment(data) {
  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear pago");
  return res.json();
} 