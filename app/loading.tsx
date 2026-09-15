"use client";

import { useEffect, useState } from "react";

const FALLBACK_DELAY_MS = 400;

export default function Loading() {
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setShowFallback(true), FALLBACK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!showFallback) return null;
  return <div className="route-loading route-loading--boundary route-loading--minimal" role="status" aria-live="polite" aria-label="Loading VetSlate">
    <img className="route-loading-mark" src="/brand/vetslate-symbol.svg" alt="VetSlate" />
  </div>;
}
