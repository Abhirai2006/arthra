import { useEffect, useState } from "react";
import "../cookie-consent.css";

const CONSENT_KEY = "arthra-analytics-consent";

function loadAnalytics() {
  if (document.querySelector("script[data-arthra-analytics]")) return;
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT?.replace(/\/$/, "");
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
  if (!endpoint || !websiteId) return;
  const script = document.createElement("script");
  script.defer = true;
  script.src = `${endpoint}/umami`;
  script.dataset.websiteId = websiteId;
  script.dataset.arthraAnalytics = "true";
  document.head.appendChild(script);
}

export function CookieConsent() {
  const [choice, setChoice] = useState<"accepted" | "rejected" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (saved === "accepted" || saved === "rejected") setChoice(saved);
    if (saved === "accepted") loadAnalytics();
  }, []);

  const decide = (next: "accepted" | "rejected") => {
    localStorage.setItem(CONSENT_KEY, next);
    setChoice(next);
    if (next === "accepted") loadAnalytics();
  };

  if (choice) return null;
  return <aside className="cookie-consent" aria-label="Cookie preference" role="region"><div><strong>Choose analytics preference</strong><p>Arthra uses optional, privacy-respecting analytics to understand public-site visits. Private finance data is never sent to site analytics.</p><a href="/privacy">Read the privacy policy</a></div><div className="cookie-consent__actions"><button type="button" className="cookie-consent__decline" onClick={() => decide("rejected")}>Essential only</button><button type="button" className="cookie-consent__accept" onClick={() => decide("accepted")}>Allow analytics</button></div></aside>;
}
