import { useState, useEffect } from "react";
import { Cookie, X, Shield } from "lucide-react";

const COOKIE_CONSENT_KEY = "lgpd_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay so it doesn't flash on initial render
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(255, 255, 255, 0.97)",
        borderTop: "2px solid #e8c4b8",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.10)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
        backdropFilter: "blur(8px)",
      }}
      role="dialog"
      aria-label="Consentimento de cookies"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        style={{
          background: "#fdf0ea",
          borderRadius: "50%",
          padding: "10px",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Cookie size={22} color="#b5451b" />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: "260px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
          <Shield size={14} color="#b5451b" />
          <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "#1a1a1a" }}>
            Privacidade e Cookies — LGPD
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#555", margin: 0, lineHeight: "1.5" }}>
          Utilizamos cookies essenciais para o funcionamento do sistema e cookies analíticos para melhorar sua experiência. Seus dados de saúde são tratados com total sigilo, conforme a{" "}
          <a
            href="/privacidade"
            style={{ color: "#b5451b", textDecoration: "underline", fontWeight: "600" }}
          >
            Política de Privacidade
          </a>{" "}
          e a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </p>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "10px", flexShrink: 0, flexWrap: "wrap" }}>
        <button
          onClick={handleDecline}
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            background: "white",
            color: "#555",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
        >
          Apenas essenciais
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: "8px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#b5451b",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#9a3a16")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#b5451b")}
        >
          Aceitar todos
        </button>
      </div>

      {/* Close button */}
      <button
        onClick={handleDecline}
        aria-label="Fechar banner de cookies"
        style={{
          position: "absolute",
          top: "10px",
          right: "12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#aaa",
          padding: "4px",
          display: "flex",
          alignItems: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#555")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#aaa")}
      >
        <X size={16} />
      </button>
    </div>
  );
}
