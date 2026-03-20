import { useEffect } from "react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

/**
 * Loads the Umami analytics script only when the user has accepted all cookies.
 * When the user declines, no analytics script is injected and any existing
 * umami tracking is disabled via the opt-out mechanism.
 */
export default function AnalyticsLoader() {
  const { analyticsAllowed } = useCookieConsent();

  useEffect(() => {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

    if (!endpoint || !websiteId) return;

    const scriptId = "umami-analytics";

    if (analyticsAllowed) {
      // Load analytics script if not already loaded
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.defer = true;
        script.src = `${endpoint}/umami`;
        script.setAttribute("data-website-id", websiteId);
        document.head.appendChild(script);
      }
      // Remove opt-out flag if previously set
      localStorage.removeItem("umami.disabled");
    } else {
      // Remove the script if it was loaded
      const existing = document.getElementById(scriptId);
      if (existing) {
        existing.remove();
      }
      // Set Umami opt-out flag so even if script loads it won't track
      localStorage.setItem("umami.disabled", "1");
    }
  }, [analyticsAllowed]);

  return null;
}
