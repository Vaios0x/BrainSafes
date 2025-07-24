import React, { useEffect, useState } from "react";
import { getCountry } from "../utils/geo";
import { useTranslation } from "react-i18next";

const LEGAL = {
  EU: {
    key: "gdpr",
    countries: ["ES", "FR", "DE", "IT", "PT", "NL", "BE", "SE", "FI", "DK", "IE", "PL", "AT", "GR", "CZ", "HU", "RO", "BG", "HR", "SK", "SI", "EE", "LV", "LT", "LU", "MT", "CY"],
  },
  US: {
    key: "ccpa",
    countries: ["US"]
  },
  BR: {
    key: "lgpd",
    countries: ["BR"]
  }
};

export default function LegalBanner() {
  const { t } = useTranslation();
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    getCountry().then(country => {
      if (!country) return;
      if (LEGAL.EU.countries.includes(country)) setBanner(t("legal.gdpr"));
      else if (LEGAL.US.countries.includes(country)) setBanner(t("legal.ccpa"));
      else if (LEGAL.BR.countries.includes(country)) setBanner(t("legal.lgpd"));
    });
  }, [t]);

  if (!banner) return null;
  return (
    <div style={{ background: "#ffe", border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
      {banner}
    </div>
  );
} 