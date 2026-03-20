import { useState, useEffect } from "react";

export type CookieConsentStatus = "accepted" | "declined" | null;

const COOKIE_CONSENT_KEY = "lgpd_cookie_consent";

export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsentStatus>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") return stored;
    return null;
  });

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setConsent("accepted");
  };

  const decline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setConsent("declined");
  };

  const hasConsented = consent !== null;
  const analyticsAllowed = consent === "accepted";

  return { consent, accept, decline, hasConsented, analyticsAllowed };
}
