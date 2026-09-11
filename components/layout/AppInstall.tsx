"use client";

import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type InstallState = { installed: boolean; available: boolean; busy: boolean; install: () => Promise<boolean> };
const InstallContext = createContext<InstallState>({ installed: false, available: false, busy: false, install: async () => false });

export function AppInstallProvider({ children }: { children: ReactNode }) {
  const pending = useRef<InstallPrompt | null>(null);
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const checkDisplay = () => setInstalled(display.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    const ready = (event: Event) => { event.preventDefault(); pending.current = event as InstallPrompt; setAvailable(true); };
    const complete = () => { pending.current = null; setAvailable(false); setInstalled(true); };
    checkDisplay();
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", complete);
    display.addEventListener("change", checkDisplay);
    return () => { window.removeEventListener("beforeinstallprompt", ready); window.removeEventListener("appinstalled", complete); display.removeEventListener("change", checkDisplay); };
  }, []);
  async function install() {
    const event = pending.current;
    if (!event || busy) return false;
    pending.current = null;
    setAvailable(false);
    setBusy(true);
    try {
      await event.prompt();
      await event.userChoice;
      // Only appinstalled / standalone confirms installation, not a click or acceptance.
      return true;
    } catch { return false; }
    finally { setBusy(false); }
  }
  return <InstallContext.Provider value={{ installed, available, busy, install }}>{children}</InstallContext.Provider>;
}

export default function InstallApp() {
  const { installed, available, busy, install } = useContext(InstallContext);
  const [help, setHelp] = useState(false);
  const id = useId();
  if (installed) return null;
  return <div className="install-app">
    <button type="button" className="toolkit-button install-button" disabled={busy} aria-expanded={help} aria-controls={id} onClick={async () => {
      if (available) { if (!await install()) setHelp(true); }
      else setHelp(value => !value);
    }}><span aria-hidden="true">＋</span>{busy ? "Opening install…" : "Add to Home Screen"}</button>
    {help && <div id={id} className="install-help">
      <p><strong>iPhone / iPad:</strong> Open VetTools in Safari, tap Share → Add to Home Screen → Add. Keep “Open as Web App” enabled if shown.</p>
      <p><strong>Android:</strong> In Chrome, open the ⋮ menu → Add to Home screen or Install app.</p>
      <p><strong>Computer:</strong> Use the install icon or “Install this site as an app” in Chrome or Edge’s menu, if available.</p>
      <p>Using an in-app browser? Open <a href="https://vettools.zhermin96.chatgpt.site/" target="_blank" rel="noreferrer">VetTools</a> in your phone’s browser first. Installation options depend on your browser.</p>
      <p className="install-note">Internet is required to open VetTools. Adding it does not save patient inputs or enable offline access.</p>
      <button type="button" className="install-dismiss" onClick={() => setHelp(false)}>Hide instructions</button>
    </div>}
  </div>;
}
