"use client";
import { useId, useRef, useState } from "react";
import type { RefObject } from "react";
import { BEDSIDE, EVIDENCE } from "./clinicalConstants";
import { calculateTransfusionVolume, calculateMinimumDonorWeight, calculateDonorCapacity, largeVolumeWarning, roundedVolume, roundedDose, weightInKg } from "./bedside";
import type { Species } from "./types";
import { Select, fmt } from "./components/Controls";
import ReferencePanel from "./components/ReferencePanel";

function NumericField({ label, value, onChange, unit, error, inputRef, placeholder }: { label: string; value: string; onChange: (v: string) => void; unit: string; error?: string; inputRef?: RefObject<HTMLInputElement | null>; placeholder?: string }) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const showError = error && (touched || value !== "");
  return <div className="field tx-bedside-field"><label htmlFor={id}>{label} <small>{unit}</small></label><input ref={inputRef} id={id} type="number" inputMode="decimal" step="any" value={value === "invalid" ? "" : value} placeholder={placeholder} onBlur={() => setTouched(true)} onChange={e => onChange(e.target.validity.badInput ? "invalid" : e.target.value)} aria-invalid={!!showError} aria-describedby={showError ? id + "-error" : undefined} />{showError && <small className="tx-inline-error" id={id + "-error"}>{error}</small>}</div>;
}
export default function Transfusion() {
  const [species, setSpecies] = useState<Species>("dog");
  const [unit, setUnit] = useState("kg"), [weight, setWeight] = useState("");
  const [current, setCurrent] = useState(""), [target, setTarget] = useState(String(BEDSIDE.defaultTargetPcv)), [productPcv, setProductPcv] = useState("");
  const [product, setProduct] = useState("wholeBlood"), [donorWeight, setDonorWeight] = useState("");
  const [custom, setCustom] = useState(false), [resetKey, setResetKey] = useState(0);
  const targetRef = useRef<HTMLInputElement>(null);
  const { errors, result } = calculateTransfusionVolume({ species, unit, weight, current, target, productPcv, product });
  const minimum = result ? calculateMinimumDonorWeight(species, result.volumeMl, product) : null;
  const capacity = calculateDonorCapacity(species, donorWeight, result?.volumeMl, product);
  function clear() { setWeight(""); setCurrent(""); setTarget(String(BEDSIDE.defaultTargetPcv)); setProductPcv(""); setDonorWeight(""); setCustom(false); setResetKey(k => k + 1); }
  return <main className={`toolkit-workspace tx-calculator tx-bedside${result ? " tx-has-sticky-result" : ""}`}>
    <header className="tx-bedside-heading"><div><h1>Blood Transfusion</h1><p>Dogs &amp; Cats</p></div><button type="button" className="reset-button tx-clear" onClick={clear}>Clear</button></header>
    <section className="workflow-card tx-bedside-card" aria-label="Transfusion calculator">
      <div key={resetKey} className="tx-bedside-form">
        <fieldset className="species-picker"><legend>Species</legend><div className="segmented">
          {(["dog", "cat"] as Species[]).map(item => <button key={item} type="button" aria-pressed={species === item} className={species === item ? "active" : ""} onClick={() => { setSpecies(item); setDonorWeight(""); }}><span className="species-emoji" aria-hidden="true">{item === "dog" ? "🐕" : "🐈"}</span>{item === "dog" ? "Dog" : "Cat"}</button>)}
        </div></fieldset>
        <div className="tx-weight-row"><NumericField label="Body weight" value={weight} onChange={setWeight} unit={unit} error={errors.weight} /><Select label="Weight unit" value={unit} onChange={next => { const kg = weightInKg(weight, unit); if (kg !== null) setWeight(String(next === "kg" ? kg : kg * BEDSIDE.poundsPerKg)); setUnit(next); }} options={["kg", "lb"]} /></div>
        <NumericField label="Current PCV/HCT" value={current} onChange={setCurrent} unit="%" error={errors.current} />
        <div><NumericField label="Target PCV/HCT" value={target} onChange={v => { setTarget(v); setCustom(!BEDSIDE.targetQuickOptions.some(n => n === Number(v))); }} unit="%" error={errors.target} inputRef={targetRef} />
          <div className="tx-presets" aria-label="Target PCV presets">{BEDSIDE.targetQuickOptions.map(value => <button type="button" key={value} aria-pressed={!custom && Number(target) === value} onClick={() => { setTarget(String(value)); setCustom(false); }}>{value}%</button>)}<button type="button" aria-pressed={custom} onClick={() => { setCustom(true); targetRef.current?.focus(); }}>Custom</button></div>
          <p className="tx-muted tx-target-help">Choose the target according to clinical status. Normalization of PCV is usually unnecessary.</p>
        </div>
        <NumericField label="Blood product PCV/HCT" value={productPcv} onChange={setProductPcv} unit="%" error={errors.productPcv} placeholder="40" />
        <Select label="Product type" value={product} onChange={setProduct} options={[["wholeBlood", "Whole blood"], ["pRbc", "Packed red blood cells"]]} />
      </div>
      <div aria-live="polite" aria-atomic="true">
        {result ? <section className="tx-bedside-result" aria-label="Transfusion result"><h2>Estimated transfusion volume</h2><strong>{fmt(roundedVolume(result.volumeMl), 0)} <span>mL</span></strong><p className="tx-dose">{roundedDose(result.volumeMlKg).toFixed(1)} mL/kg</p>
          <div className="tx-donor-min"><h3>Minimum donor weight</h3>{minimum ? <b>{fmt(minimum.roundedWeightKg, 1)} kg{species === "cat" && <small> lean BW</small>}</b> : <p className="tx-muted">Packed-cell yield is required to estimate donor weight.</p>}<p className="tx-muted">Volume-based estimate only. Donor eligibility and screening criteria still apply.</p></div>
          {largeVolumeWarning(product, result.volumeMlKg) && <p className="tx-compact-warning">⚠ Large calculated transfusion volume. Recheck target PCV and blood product PCV.</p>}
        </section> : <p className="tx-empty">Enter weight and valid PCV/HCT values to see the estimate.</p>}
      </div>
      <div className="tx-bedside-extras">
        <details><summary>Donor calculator</summary><NumericField key={resetKey + species} label={species === "cat" ? "Donor lean body weight" : "Donor weight"} value={donorWeight} onChange={setDonorWeight} unit="kg" error={!capacity ? "Enter a positive donor weight." : undefined} />
          {capacity && <><dl className="tx-capacity"><div><dt>Maximum collection under selected profile</dt><dd>{fmt(capacity.maximumCollectionMl)} mL</dd></div>{result && <div><dt>Required for this patient{product === "pRbc" ? " (packed cells)" : ""}</dt><dd>{fmt(roundedVolume(result.volumeMl), 0)} mL</dd></div>}</dl>
            {capacity.isMaximumVolumeSufficient !== null && <p>{capacity.isMaximumVolumeSufficient ? "✓ Maximum collection volume is sufficient for this patient." : "⚠ This donor alone cannot provide the calculated requirement."}</p>}
            {capacity.shortfallMl !== null && capacity.shortfallMl > 0 && <p>Additional volume required: {fmt(Math.ceil(capacity.shortfallMl), 0)} mL</p>}
            {capacity.belowScreeningFloor && <p className="tx-compact-warning">Below the selected donor screening-weight reference. Volume capacity does not establish eligibility.</p>}
          </>}
          <p className="tx-muted">Whole-blood ceiling: {BEDSIDE.donor[species].ceiling.value} mL/kg{species === "cat" ? " lean BW" : ""}, excluding anticoagulant. No separate recommended volume is assumed. {product === "pRbc" && "Whole-blood collection cannot be directly compared with packed-cell volume; component yield must be established."}</p>
          <p className="tx-muted">Donor health, age, body condition, blood typing, infectious-disease screening and local protocols still apply. Screening reference: {EVIDENCE.donor[species].floor.value} kg{species === "cat" ? " lean BW; ISFM uses a greater-than threshold." : "."}</p>
        </details>
        <details><summary>Clinical notes</summary><ul><li>Calculated volume is an estimate, not a transfusion prescription.</li><li>Use the actual measured PCV/HCT of the blood product.</li><li>Select the target according to clinical status. Normalization is generally unnecessary.</li><li>Reassess clinical response and PCV/HCT after transfusion.</li><li>Appropriate typing/crossmatching, donor screening and monitoring remain necessary.</li></ul></details>
        <ReferencePanel />
      </div>
    </section>
    {result && <aside className="tx-sticky-result" aria-label="Current transfusion estimate">
      <div><span>Estimated volume</span><strong>{fmt(roundedVolume(result.volumeMl), 0)} mL</strong></div>
      <div><span>Per kg</span><strong>{roundedDose(result.volumeMlKg).toFixed(1)} mL/kg</strong></div>
      <div><span>Min. donor{species === "cat" ? " · lean BW" : ""}</span><strong>{minimum ? `${fmt(minimum.roundedWeightKg, 1)} kg` : "Yield needed"}</strong></div>
      <p>Estimate only · donor screening still applies{largeVolumeWarning(product, result.volumeMlKg) ? " · ⚠ Recheck large volume" : ""}</p>
    </aside>}
  </main>;
}
