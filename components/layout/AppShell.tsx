"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ToolLauncher from "./ToolLauncher";
import InstallApp from "./AppInstall";
import FeedbackDialog from "./FeedbackDialog";

export function CalculatorNavigation({ onSelect }: { onSelect: (route: string) => void }) { return <nav aria-label="Calculators"><ToolLauncher onSelect={onSelect} /></nav>; }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  function close() { dialog.current?.close(); }
  useEffect(() => { close(); }, [pathname]);
  useEffect(() => () => { document.body.style.overflow = ""; }, []);
  return <>
    <header className="vetcalc-header">
      <Link className="vetcalc-brand" href="/" onClick={() => { if (pathname !== "/") setNavigatingTo("/"); }}>VetTools<span>Veterinary Clinical Calculators</span></Link>
      <button ref={trigger} className="toolkit-button" aria-haspopup="dialog" aria-controls="calculator-drawer" onClick={() => {
        dialog.current?.showModal(); document.body.style.overflow = "hidden";
      }}><span aria-hidden="true">☷</span> Calculators</button>
    </header>
    <dialog id="calculator-drawer" ref={dialog} className="calculator-drawer" aria-labelledby="drawer-title"
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      onClose={() => { document.body.style.overflow = ""; trigger.current?.focus(); }}>
      <div className="drawer-content">
        <div className="drawer-heading"><h2 id="drawer-title">Calculators</h2><button className="toolkit-button" aria-label="Close calculators" onClick={close}>×</button></div>
        <CalculatorNavigation onSelect={route => { close(); if (route !== pathname) setNavigatingTo(route); }} />
        <InstallApp />
      </div>
    </dialog>
    {navigatingTo && navigatingTo !== pathname && <div className="route-loading" role="status" aria-live="polite" aria-label="Loading calculator"><span className="route-loading-spinner" aria-hidden="true" /><strong>Loading calculator…</strong></div>}
    {children}
    <footer className="site-feedback-footer"><FeedbackDialog /></footer>
  </>;
}
