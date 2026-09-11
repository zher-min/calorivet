"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  calculateAdditiveCRI,
  calculateReplacementCRI,
  calculateSyringeCRI,
  convertDoseToMgPerKgPerHour,
  convertMassToMg,
  formatVolumeMl,
  type CriError,
  type CriResult,
  type DoseTimeUnit,
  type MassUnit,
  type NormalizedDrug,
} from "./calculations";

type DrugRow = {
  id: number;
  dose: string;
  doseMassUnit: MassUnit;
  doseTimeUnit: DoseTimeUnit;
  stock: string;
  stockMassUnit: MassUnit;
};

const newDrug = (id: number): DrugRow => ({
  id, dose: "", doseMassUnit: "ug", doseTimeUnit: "hr", stock: "", stockMassUnit: "mg",
});
const parsePositive = (value: string) => {
  if (value.trim() === "" || value === "invalid") return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
};
const massLabel: Record<MassUnit, string> = { ug: "µg", mg: "mg", g: "g" };

function NumericInput({ label, value, onChange, unit }: { label: string; value: string; onChange: (value: string) => void; unit: string }) {
  const id = useId();
  const invalid = value !== "" && parsePositive(value) === null;
  return <label className="cri-field" htmlFor={id}>
    <span>{label}</span>
    <span className="cri-number-unit">
      <input id={id} type="number" inputMode="decimal" min="0" step="any" value={value === "invalid" ? "" : value}
        onChange={event => onChange(event.target.validity.badInput ? "invalid" : event.target.value)} aria-invalid={invalid} />
      <span>{unit}</span>
    </span>
    {invalid && <small>Enter a number greater than 0.</small>}
  </label>;
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly (readonly [T, string])[]; onChange: (value: T) => void }) {
  return <fieldset className="cri-segmented"><legend>{label}</legend><div>
    {options.map(([key, text]) => <button key={key} type="button" aria-pressed={value === key} className={value === key ? "active" : ""} onClick={() => onChange(key)}>{text}</button>)}
  </div></fieldset>;
}

function DrugCard({ drug, index, multiple, update, remove }: { drug: DrugRow; index: number; multiple: boolean; update: (patch: Partial<DrugRow>) => void; remove: () => void }) {
  const doseId = useId();
  const stockId = useId();
  const doseInvalid = drug.dose !== "" && parsePositive(drug.dose) === null;
  const stockInvalid = drug.stock !== "" && parsePositive(drug.stock) === null;
  return <section className="cri-drug-card" aria-labelledby={`drug-${drug.id}-title`}>
    <header><h3 id={`drug-${drug.id}-title`}>{multiple ? `Drug ${index + 1}` : "Drug"}</h3>
      {multiple && <button type="button" className="cri-remove" onClick={remove} aria-label={`Remove Drug ${index + 1}`}>Remove</button>}
    </header>
    <label className="cri-field" htmlFor={doseId}><span>Infusion dose rate</span>
      <span className="cri-dose-input"><input id={doseId} type="number" inputMode="decimal" min="0" step="any" value={drug.dose === "invalid" ? "" : drug.dose}
        onChange={event => update({ dose: event.target.validity.badInput ? "invalid" : event.target.value })} aria-invalid={doseInvalid} />
        <select aria-label={`Drug ${index + 1} dose mass unit`} value={drug.doseMassUnit} onChange={event => update({ doseMassUnit: event.target.value as MassUnit })}>{Object.entries(massLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        <span>/kg/</span><select aria-label={`Drug ${index + 1} dose time unit`} value={drug.doseTimeUnit} onChange={event => update({ doseTimeUnit: event.target.value as DoseTimeUnit })}><option value="min">min</option><option value="hr">hr</option></select>
      </span>{doseInvalid && <small>Enter a dose greater than 0.</small>}
    </label>
    <label className="cri-field" htmlFor={stockId}><span>Stock concentration</span>
      <span className="cri-stock-input"><input id={stockId} type="number" inputMode="decimal" min="0" step="any" value={drug.stock === "invalid" ? "" : drug.stock}
        onChange={event => update({ stock: event.target.validity.badInput ? "invalid" : event.target.value })} aria-invalid={stockInvalid} />
        <select aria-label={`Drug ${index + 1} stock mass unit`} value={drug.stockMassUnit} onChange={event => update({ stockMassUnit: event.target.value as MassUnit })}>{Object.entries(massLabel).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span>/mL</span>
      </span>{stockInvalid && <small>Enter a stock concentration greater than 0.</small>}
    </label>
  </section>;
}

const errorText: Record<CriError["code"], string> = {
  invalid_input: "Enter valid values greater than 0 in every required field.",
  stock_not_greater_than_target: "For add-to-volume preparation, each stock concentration must be greater than its required final concentration.",
  additive_fraction_too_high: "The combined drug-volume fraction must be less than 1. This preparation cannot be calculated as entered.",
  drug_volume_exceeds_final: "The total stock-drug volume exceeds the intended final syringe volume.",
};

export default function CriCalculator() {
  const [weight, setWeight] = useState("");
  const [delivery, setDelivery] = useState<"single" | "multiple">("single");
  const [mode, setMode] = useState<"bag" | "syringe">("bag");
  const [introduction, setIntroduction] = useState<"replace" | "add">("replace");
  const [bagVolume, setBagVolume] = useState("");
  const [syringeVolume, setSyringeVolume] = useState("");
  const [rate, setRate] = useState("");
  const nextId = useRef(2);
  const [drugs, setDrugs] = useState<DrugRow[]>([newDrug(1)]);
  const activeDrugs = delivery === "single" ? drugs.slice(0, 1) : drugs;

  const calculation = useMemo<CriResult | CriError | null>(() => {
    const weightKg = parsePositive(weight);
    const rateMlHr = parsePositive(rate);
    const volumeMl = parsePositive(mode === "bag" ? bagVolume : syringeVolume);
    if (weightKg === null || rateMlHr === null || volumeMl === null) return null;
    const normalized: NormalizedDrug[] = [];
    for (const drug of activeDrugs) {
      const dose = parsePositive(drug.dose);
      const stock = parsePositive(drug.stock);
      if (dose === null || stock === null) return null;
      const doseMgPerKgHr = convertDoseToMgPerKgPerHour(dose, drug.doseMassUnit, drug.doseTimeUnit);
      const stockMgPerMl = convertMassToMg(stock, drug.stockMassUnit);
      if (doseMgPerKgHr === null || stockMgPerMl === null) return null;
      normalized.push({ doseMgPerKgHr, stockMgPerMl });
    }
    const common = { weightKg, rateMlHr, drugs: normalized };
    if (mode === "syringe") return calculateSyringeCRI({ ...common, finalVolumeMl: volumeMl });
    if (introduction === "add") return calculateAdditiveCRI({ ...common, bagVolumeMl: volumeMl });
    return calculateReplacementCRI({ ...common, finalVolumeMl: volumeMl });
  }, [weight, rate, mode, bagVolume, syringeVolume, introduction, activeDrugs]);

  const updateDrug = (id: number, patch: Partial<DrugRow>) => setDrugs(current => current.map(drug => drug.id === id ? { ...drug, ...patch } : drug));
  const addDrug = () => { const id = nextId.current++; setDrugs(current => [...current, newDrug(id)]); };
  const removeDrug = (id: number) => setDrugs(current => current.length > 1 ? current.filter(drug => drug.id !== id) : current);
  const result = calculation?.ok ? calculation : null;
  const setupLabel = mode === "bag" ? "Fluid rate" : "Pump rate";

  return <div className="cri-calculator">
    <section className="cri-card cri-setup-card">
      <NumericInput label="Body weight" value={weight} onChange={setWeight} unit="kg" />
      <div className="cri-choice-grid">
        <Segmented label="Drug delivery" value={delivery} options={[["single", "Single drug"], ["multiple", "Multiple drugs"]]} onChange={setDelivery} />
        <Segmented label="Delivery mode" value={mode} options={[["bag", "Fluid bag"], ["syringe", "Syringe pump"]]} onChange={setMode} />
      </div>
    </section>

    <div className="cri-drugs">{activeDrugs.map((drug, index) => <DrugCard key={drug.id} drug={drug} index={index} multiple={delivery === "multiple"} update={patch => updateDrug(drug.id, patch)} remove={() => removeDrug(drug.id)} />)}</div>
    {delivery === "multiple" && <button type="button" className="toolkit-button cri-add-drug" onClick={addDrug}>+ Add drug</button>}

    <section className="cri-card">
      <h2>Preparation</h2>
      {mode === "bag" ? <>
        <NumericInput label="Bag volume" value={bagVolume} onChange={setBagVolume} unit="mL" />
        <div className="cri-presets" aria-label="Common bag volumes">{[100, 250, 500, 1000].map(value => <button key={value} type="button" aria-pressed={bagVolume === String(value)} onClick={() => setBagVolume(String(value))}>{value} mL</button>)}</div>
        <Segmented label="Drug introduction method" value={introduction} options={[["replace", "Replace volume"], ["add", "Add to volume"]]} onChange={setIntroduction} />
      </> : <NumericInput label="Final syringe volume" value={syringeVolume} onChange={setSyringeVolume} unit="mL" />}
      <NumericInput label={setupLabel} value={rate} onChange={setRate} unit="mL/hr" />
      {calculation && !calculation.ok && <p className="cri-inline-error" role="alert">{errorText[calculation.code]}</p>}
    </section>

    {result && <section className="cri-result" aria-live="polite">
      <span className="cri-result-label">Result</span>
      <div className="cri-drug-results">{result.drugs.map((drug, index) => <div key={activeDrugs[index].id}>
        <span>{delivery === "multiple" ? `Drug ${index + 1} — add` : "Drug volume to add"}</span>
        <strong>{formatVolumeMl(drug.drugVolumeMl)} mL</strong>
        <small>Dose delivered: {activeDrugs[index].dose} {massLabel[activeDrugs[index].doseMassUnit]}/kg/{activeDrugs[index].doseTimeUnit}</small>
      </div>)}</div>
      <dl className="cri-result-grid">
        {mode === "bag" && introduction === "replace" && <div><dt>{delivery === "multiple" ? "Total fluid to remove" : "Fluid to remove"}</dt><dd>{formatVolumeMl(result.fluidToRemoveMl ?? 0)} mL</dd></div>}
        {mode === "bag" && introduction === "add" && <div><dt>Original bag volume</dt><dd>{formatVolumeMl(result.originalVolumeMl)} mL</dd></div>}
        {mode === "syringe" && <div><dt>Diluent volume</dt><dd>{formatVolumeMl(result.diluentVolumeMl ?? 0)} mL</dd></div>}
        <div><dt>{mode === "bag" ? "Final prepared volume" : "Final syringe volume"}</dt><dd>{formatVolumeMl(result.finalVolumeMl)} mL</dd></div>
        <div><dt>{setupLabel}</dt><dd>{formatVolumeMl(result.rateMlHr)} mL/hr</dd></div>
        <div><dt>Estimated duration</dt><dd>{result.durationHr.toFixed(1)} hr</dd></div>
      </dl>
      {result.drugs.some(drug => drug.drugVolumeMl < 0.1) && <p className="cri-micro-warning">Very small drug volume. Verify measurement accuracy and consider appropriate dilution where clinically suitable.</p>}
    </section>}
  </div>;
}
