"use client";

import { useState } from "react";
import TapDripRate from "../tap-drip-rate/TapDripRate";
import QuickBpm from "./QuickBpm";

type TapMode = "bpm" | "drip";

export default function TapRate() {
  const [mode, setMode] = useState<TapMode>("bpm");

  return <div className="tap-tool">
    <nav className="tap-tool__modes segmented" aria-label="Tap calculator mode">
      <button type="button" className={mode === "bpm" ? "active" : ""} aria-pressed={mode === "bpm"} onClick={() => setMode("bpm")}>BPM</button>
      <button type="button" className={mode === "drip" ? "active" : ""} aria-pressed={mode === "drip"} onClick={() => setMode("drip")}>Drip Rate</button>
    </nav>
    {mode === "bpm" ? <section className="tap-tool__panel" aria-label="BPM tap calculator"><QuickBpm /></section> : <section className="tap-tool__panel" aria-label="IV drip rate calculator"><TapDripRate /></section>}
  </div>;
}
