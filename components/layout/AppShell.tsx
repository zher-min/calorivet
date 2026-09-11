"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { calculatorCategories } from "../../config/calculators";
import InstallApp from "./AppInstall";

export function CalculatorNavigation({ onSelect }: { onSelect: () => void }) {
  const pathname = usePathname();
  return <nav aria-label="Calculators">{calculatorCategories.map(category => <section className="nav-category" key={category.id}>
    <h3>{category.name}</h3>
    {category.calculators.map(item => <Link key={item.id} href={item.route} onClick={onSelect}
      aria-current={pathname === item.route ? "page" : undefined} className="calculator-nav-item">
      <strong>{item.brand}</strong><span>{item.shortName}</span><small>{item.description}</small>
      {pathname === item.route && <small className="active-label">Current calculator</small>}
    </Link>)}
  </section>)}</nav>;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  function close() { dialog.current?.close(); }
  useEffect(() => { close(); }, [pathname]);
  useEffect(() => () => { document.body.style.overflow = ""; }, []);
  return <>
    <header className="vetcalc-header">
      <Link className="vetcalc-brand" href="/">VetCalc<span>Veterinary Clinical Calculators</span></Link>
      <button ref={trigger} className="toolkit-button" aria-haspopup="dialog" aria-controls="calculator-drawer" onClick={() => {
        dialog.current?.showModal(); document.body.style.overflow = "hidden";
      }}><span aria-hidden="true">☷</span> Calculators</button>
    </header>
    <dialog id="calculator-drawer" ref={dialog} className="calculator-drawer" aria-labelledby="drawer-title"
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      onClose={() => { document.body.style.overflow = ""; trigger.current?.focus(); }}>
      <div className="drawer-content">
        <div className="drawer-heading"><h2 id="drawer-title">Calculators</h2><button className="toolkit-button" aria-label="Close calculators" onClick={close}>×</button></div>
        <CalculatorNavigation onSelect={close} />
        <InstallApp />
      </div>
    </dialog>
    {children}
  </>;
}
