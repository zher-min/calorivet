"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Direction = "VND" | "MYR";
type RateStatus = "loading" | "live" | "fallback" | "manual";

const onlyNumber = (value: string) => value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
const parseAmount = (value: string) => Number(value) || 0;

const formatVnd = (value: number) => new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
}).format(value);

const formatMyr = (value: number) => new Intl.NumberFormat("en-MY", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

export default function Home() {
  const [direction, setDirection] = useState<Direction>("VND");
  const [amount, setAmount] = useState("1000000");
  const [ratePerHundred, setRatePerHundred] = useState("0.0155");
  const [rateDate, setRateDate] = useState("14 Jul 2026");
  const [rateStatus, setRateStatus] = useState<RateStatus>("loading");
  const [copied, setCopied] = useState(false);
  const manualOverride = useRef(false);

  async function loadLatestRate() {
    setRateStatus("loading");
    try {
      const response = await fetch("/api/rate", { cache: "no-store" });
      if (!response.ok) throw new Error("Rate unavailable");
      const data = await response.json() as { date: string; ratePerHundred: number };
      if (manualOverride.current) return;
      setRatePerHundred(String(data.ratePerHundred));
      setRateDate(new Date(`${data.date}T00:00:00`).toLocaleDateString("en-MY", {
        day: "numeric", month: "short", year: "numeric",
      }));
      setRateStatus("live");
    } catch {
      if (!manualOverride.current) setRateStatus("fallback");
    }
  }

  useEffect(() => { void loadLatestRate(); }, []);

  const rate = parseAmount(ratePerHundred) / 100;
  const sourceAmount = parseAmount(amount);
  const converted = useMemo(
    () => direction === "VND" ? sourceAmount * rate : rate > 0 ? sourceAmount / rate : 0,
    [direction, sourceAmount, rate],
  );

  const source = direction === "VND"
    ? { code: "VND", symbol: "₫", name: "Vietnamese dong", formatted: formatVnd(sourceAmount) }
    : { code: "MYR", symbol: "RM", name: "Malaysian ringgit", formatted: formatMyr(sourceAmount) };
  const target = direction === "VND"
    ? { code: "MYR", symbol: "RM", name: "Malaysian ringgit", formatted: formatMyr(converted) }
    : { code: "VND", symbol: "₫", name: "Vietnamese dong", formatted: formatVnd(converted) };
  const quickAmounts = direction === "VND" ? [100000, 500000, 1000000, 5000000] : [10, 50, 100, 500];

  function swapDirection() {
    setDirection(direction === "VND" ? "MYR" : "VND");
    setAmount(direction === "VND" ? converted.toFixed(2) : Math.round(converted).toString());
    setCopied(false);
  }

  async function copyResult() {
    await navigator.clipboard.writeText(`${target.symbol}${target.formatted} ${target.code}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#converter" aria-label="Duit Exchange home">
          <span className="brand-mark">D</span>
          <span><b>Duit Exchange</b><small>VND ↔ MYR</small></span>
        </a>
        <span className="rate-pill"><i className={rateStatus} />{rateStatus === "live" ? "Official daily rate" : rateStatus === "loading" ? "Checking latest rate" : rateStatus === "manual" ? "Custom rate" : "Indicative fallback"}</span>
      </header>

      <section className="intro">
        <p className="eyebrow">Vietnam ↔ Malaysia</p>
        <h1>Know what your<br /><em>money is worth.</em></h1>
        <p>A fast, fuss-free converter for Vietnamese dong and Malaysian ringgit.</p>
      </section>

      <section className="converter" id="converter" aria-label="Currency converter">
        <div className="converter-head">
          <div>
            <p className="eyebrow">Currency converter</p>
            <h2>Convert in seconds</h2>
          </div>
          <p className="updated">{rateStatus === "manual" ? "Custom rate" : rateStatus === "loading" ? "Checking latest rate…" : rateStatus === "fallback" ? "Fallback rate from" : "Rate updated"}<br /><b>{rateStatus === "manual" ? "Set by you" : rateDate}</b></p>
        </div>

        <div className="currency-card source-card">
          <div className="currency-label">
            <span>{source.code}</span>
            <div><b>{source.name}</b><small>You send</small></div>
          </div>
          <label className="amount-input">
            <span>{source.symbol}</span>
            <input
              aria-label={`Amount in ${source.name}`}
              inputMode="decimal"
              value={amount}
              onChange={(event) => { setAmount(onlyNumber(event.target.value)); setCopied(false); }}
            />
          </label>
          <div className="quick-amounts" aria-label="Quick amounts">
            {quickAmounts.map((item) => (
              <button key={item} type="button" onClick={() => setAmount(item.toString())}>
                {direction === "VND" ? `₫${formatVnd(item)}` : `RM${formatMyr(item)}`}
              </button>
            ))}
          </div>
        </div>

        <div className="swap-row">
          <span />
          <button className="swap" type="button" onClick={swapDirection} aria-label="Swap conversion direction">⇅</button>
          <span />
        </div>

        <div className="currency-card result-card" aria-live="polite">
          <div className="currency-label">
            <span>{target.code}</span>
            <div><b>{target.name}</b><small>You get</small></div>
          </div>
          <div className="result-amount"><span>{target.symbol}</span><strong>{target.formatted}</strong></div>
          <button className="copy" type="button" onClick={copyResult}>{copied ? "Copied!" : "Copy result"}</button>
        </div>

        <div className="rate-summary">
          <p><span>Rate used</span><b>₫100 = RM{formatMyr(parseAmount(ratePerHundred))}</b></p>
          <p><span>Reverse rate</span><b>RM1 = ₫{rate > 0 ? formatVnd(1 / rate) : "0"}</b></p>
        </div>

        <details className="rate-editor">
          <summary>Use a different rate</summary>
          <label>
            <span>MYR for every ₫100</span>
            <div><b>RM</b><input aria-label="MYR per 100 VND" inputMode="decimal" value={ratePerHundred} onChange={(event) => { manualOverride.current = true; setRateStatus("manual"); setRatePerHundred(onlyNumber(event.target.value)); }} /></div>
          </label>
          <button className="reload-rate" type="button" onClick={() => { manualOverride.current = false; void loadLatestRate(); }}>Reload official rate</button>
        </details>
      </section>

      <section className="note">
        <span>Good to know</span>
        <p>The latest available 09:00 reference rate is loaded from Bank Negara Malaysia via data.gov.my. Banks and money changers may include their own spread or fees.</p>
      </section>

      <footer><span>Built for everyday travel and transfers.</span><span>VND / MYR</span></footer>
    </main>
  );
}
