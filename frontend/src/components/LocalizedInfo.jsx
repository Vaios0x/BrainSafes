import React from "react";
import { useTranslation } from "react-i18next";

export default function LocalizedInfo({ date = new Date(), amount = 1234.56, number = 9876543 }) {
  const { i18n } = useTranslation();
  const lang = i18n.language || "es";

  // Ejemplo: localización de fecha
  const formattedDate = new Intl.DateTimeFormat(lang, { dateStyle: "full", timeStyle: "short" }).format(date);
  // Ejemplo: localización de moneda
  const formattedAmount = new Intl.NumberFormat(lang, { style: "currency", currency: lang === "es" ? "EUR" : "USD" }).format(amount);
  // Ejemplo: localización de número
  const formattedNumber = new Intl.NumberFormat(lang).format(number);

  return (
    <div style={{ margin: 20 }}>
      <div><b>Fecha:</b> {formattedDate}</div>
      <div><b>Importe:</b> {formattedAmount}</div>
      <div><b>Número:</b> {formattedNumber}</div>
    </div>
  );
} 