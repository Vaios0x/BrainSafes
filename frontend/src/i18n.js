import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Definir las traducciones directamente
const resources = {
  es: {
    translation: {
      "navbar": {
        "home": "Inicio",
        "dashboard": "Panel",
        "certificates": "Certificados",
        "courses": "Cursos",
        "badges": "Insignias",
        "community": "Comunidad",
        "mentoring": "Mentoría",
        "loans": "Préstamos",
        "profile": "Perfil",
        "admin": "Administración",
        "login": "Iniciar sesión",
        "logout": "Cerrar sesión",
        "connectWallet": "Conectar Wallet",
        "walletConnected": "Wallet Conectada",
        "disconnectWallet": "Desconectar Wallet"
      }
    }
  },
  en: {
    translation: {
      "navbar": {
        "home": "Home",
        "dashboard": "Dashboard",
        "certificates": "Certificates",
        "courses": "Courses",
        "badges": "Badges",
        "community": "Community",
        "mentoring": "Mentoring",
        "loans": "Loans",
        "profile": "Profile",
        "admin": "Admin",
        "login": "Login",
        "logout": "Logout",
        "connectWallet": "Connect Wallet",
        "walletConnected": "Wallet Connected",
        "disconnectWallet": "Disconnect Wallet"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "es",
    interpolation: { escapeValue: false }
  });

export default i18n; 