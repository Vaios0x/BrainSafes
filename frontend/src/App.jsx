import React from "react";
import { useTranslation } from "react-i18next";
import "./i18n";

export default function App() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => i18n.changeLanguage(lng);

  return (
    <div>
      <div style={{ float: "right" }}>
        <button onClick={() => changeLanguage("es")}>ES</button>
        <button onClick={() => changeLanguage("en")}>EN</button>
      </div>
      <h1>{t("welcome")}</h1>
      <p>{t("description")}</p>
      <button>{t("actions.login")}</button>
      <button>{t("actions.register")}</button>
    </div>
  );
} 