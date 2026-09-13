"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ToolLauncher from "./ToolLauncher";
import InstallApp from "./AppInstall";
import FeedbackDialog from "./FeedbackDialog";
import ThemeToggle from "./ThemeToggle";
import { CalculatorDrawerContext } from "./CalculatorDrawerContext";

export function CalculatorNavigation({ onSelect }: { onSelect: (route: string) => void }) { return <nav aria-label="Toolbox"><ToolLauncher onSelect={onSelect} /></nav>; }

export default function AppShell({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  function close() { dialog.current?.close(); }
  function open() { dialog.current?.showModal(); document.body.style.overflow = "hidden"; }
  useEffect(() => { close(); }, [pathname]);
  useEffect(() => () => { document.body.style.overflow = ""; }, []);
  return <CalculatorDrawerContext.Provider value={{ openCalculatorDrawer: open }}>
    <header className="vetcalc-header">
      <Link className="vetcalc-brand" href="/" aria-label="VetSlate home" onClick={() => { if (pathname !== "/") setNavigatingTo("/"); }}><picture><img className="brand-logo-light" src="/brand/vetslate-logo.svg" alt="VetSlate" /><img className="brand-logo-dark" src="/brand/vetslate-logo-dark.svg" alt="" /></picture><span>Clinical support, made simple</span></Link>
      <div className="header-actions"><ThemeToggle /><button ref={trigger} className="toolkit-button" aria-haspopup="dialog" aria-controls="calculator-drawer" onClick={open}><span aria-hidden="true">☷</span> Toolbox</button></div>
    </header>
    <dialog id="calculator-drawer" ref={dialog} className="calculator-drawer" aria-labelledby="drawer-title"
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      onClose={() => { document.body.style.overflow = ""; trigger.current?.focus(); }}>
      <div className="drawer-content">
        <div className="drawer-heading"><h2 id="drawer-title">Toolbox</h2><button className="toolkit-button" aria-label="Close toolbox" onClick={close}>×</button></div>
        <InstallApp />
        <CalculatorNavigation onSelect={route => { close(); if (route !== pathname) setNavigatingTo(route); }} />
      </div>
    </dialog>
    {navigatingTo && navigatingTo !== pathname && <div className="route-loading" role="status" aria-live="polite" aria-label="Loading"><img className="route-loading-mark" src="/brand/vetslate-symbol.svg" alt="" /><span className="route-loading-spinner" aria-hidden="true" /><strong>Loading…</strong></div>}
    {children}
    <footer className="site-feedback-footer"><FeedbackDialog /></footer>
  </CalculatorDrawerContext.Provider>;
}
