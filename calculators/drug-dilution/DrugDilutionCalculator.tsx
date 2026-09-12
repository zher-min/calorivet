"use client";

import { useMemo, useState } from "react";
import {
  CONCENTRATION_UNITS, SMALL_VOLUME_WARNING_ML, calculateDilution,
  calculateDosePreparation, calculateExistingDilution, convertConcentration,
  formatConcentration, formatVolume, mgPerMlToPercent, percentToMgPerMl,
  type ConcentrationUnit, type DoseUnit,
} from "./calculations";

const PERCENT_NOTE = "% is interpreted as % w/v (grams per 100 mL). Verify the product label, as percentage notation may represent a different concentration basis for some products.";
const positive = (value: string) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : null;
const nonNegative = (value: string) => value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const unitOptions = Object.entries(CONCENTRATION_UNITS) as [ConcentrationUnit, { label: string }][];

function PercentInfo() { return <span className="dd-info" title={PERCENT_NOTE} aria-label={PERCENT_NOTE} tabIndex={0}>ⓘ</span>; }
function ConcentrationField({ label, value, unit, onValue, onUnit }: { label: string; value: string; unit: ConcentrationUnit; onValue: (v: string) => void; onUnit: (v: ConcentrationUnit) => void }) {
  const invalid = value !== "" && positive(value) === null;
  return <label className="dd-field"><span>{label}{unit === "percent_wv" && <PercentInfo />}</span><span className="dd-input-select"><input type="number" inputMode="decimal" min="0" step="any" value={value} aria-invalid={invalid} onChange={e => onValue(e.target.validity.badInput ? "" : e.target.value)} /><select value={unit} onChange={e => onUnit(e.target.value as ConcentrationUnit)}>{unitOptions.map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></span>{invalid && <small>Enter a concentration greater than 0.</small>}</label>;
}
function VolumeField({ label, value, onChange, allowZero = false }: { label: string; value: string; onChange: (v: string) => void; allowZero?: boolean }) {
  const parsed = allowZero ? nonNegative(value) : positive(value);
  const invalid = value !== "" && parsed === null;
  return <label className="dd-field"><span>{label}</span><span className="dd-input-unit"><input type="number" inputMode="decimal" min="0" step="any" value={value} aria-invalid={invalid} onChange={e => onChange(e.target.validity.badInput ? "" : e.target.value)} /><span>mL</span></span>{invalid && <small>{allowZero ? "Enter zero or a positive value." : "Enter a value greater than 0."}</small>}</label>;
}
function ResultRows({ rows }: { rows: [string, string][] }) { return <dl className="dd-result-rows">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>; }

export default function DrugDilutionCalculator() {
  const [stock, setStock] = useState(""); const [stockUnit, setStockUnit] = useState<ConcentrationUnit>("mg_per_ml");
  const [desired, setDesired] = useState(""); const [desiredUnit, setDesiredUnit] = useState<ConcentrationUnit>("mg_per_ml"); const [finalVolume, setFinalVolume] = useState("");
  const [reverseStock, setReverseStock] = useState(""); const [reverseUnit, setReverseUnit] = useState<ConcentrationUnit>("mg_per_ml"); const [reverseStockVolume, setReverseStockVolume] = useState(""); const [reverseDiluent, setReverseDiluent] = useState(""); const [reverseOutput, setReverseOutput] = useState<ConcentrationUnit>("mg_per_ml");
  const [dose, setDose] = useState(""); const [doseUnit, setDoseUnit] = useState<DoseUnit>("mg"); const [doseStock, setDoseStock] = useState(""); const [doseStockUnit, setDoseStockUnit] = useState<ConcentrationUnit>("mg_per_ml"); const [doseFinalVolume, setDoseFinalVolume] = useState("");
  const [percent, setPercent] = useState(""); const [mgPerMl, setMgPerMl] = useState("");
  const [intermediateStock, setIntermediateStock] = useState(""); const [intermediateStockUnit, setIntermediateStockUnit] = useState<ConcentrationUnit>("mg_per_ml"); const [intermediateDesired, setIntermediateDesired] = useState(""); const [intermediateDesiredUnit, setIntermediateDesiredUnit] = useState<ConcentrationUnit>("mg_per_ml"); const [intermediateVolume, setIntermediateVolume] = useState("");

  const main = useMemo(() => { const a = positive(stock), b = positive(desired), v = positive(finalVolume); return a && b && v ? calculateDilution({ value: a, unit: stockUnit }, { value: b, unit: desiredUnit }, v) : null; }, [stock, desired, finalVolume, stockUnit, desiredUnit]);
  const desiredExceedsStock = positive(stock) !== null && positive(desired) !== null && convertConcentration(Number(desired), desiredUnit, "mg_per_ml") > convertConcentration(Number(stock), stockUnit, "mg_per_ml");
  const reverse = useMemo(() => { const c = positive(reverseStock), sv = positive(reverseStockVolume), d = nonNegative(reverseDiluent); return c && sv && d !== null ? calculateExistingDilution({ value: c, unit: reverseUnit }, sv, d) : null; }, [reverseStock, reverseStockVolume, reverseDiluent, reverseUnit]);
  const preparedDose = useMemo(() => { const d = positive(dose), c = positive(doseStock), v = positive(doseFinalVolume); return d && c && v ? calculateDosePreparation(d, doseUnit, { value: c, unit: doseStockUnit }, v) : null; }, [dose, doseUnit, doseStock, doseStockUnit, doseFinalVolume]);
  const intermediate = useMemo(() => { const a = positive(intermediateStock), b = positive(intermediateDesired), v = positive(intermediateVolume); return a && b && v ? calculateDilution({ value: a, unit: intermediateStockUnit }, { value: b, unit: intermediateDesiredUnit }, v) : null; }, [intermediateStock, intermediateDesired, intermediateVolume, intermediateStockUnit, intermediateDesiredUnit]);
  const reset = () => { setStock(""); setDesired(""); setFinalVolume(""); setStockUnit("mg_per_ml"); setDesiredUnit("mg_per_ml"); setReverseStock(""); setReverseStockVolume(""); setReverseDiluent(""); setReverseUnit("mg_per_ml"); setReverseOutput("mg_per_ml"); setDose(""); setDoseUnit("mg"); setDoseStock(""); setDoseStockUnit("mg_per_ml"); setDoseFinalVolume(""); setPercent(""); setMgPerMl(""); setIntermediateStock(""); setIntermediateDesired(""); setIntermediateVolume(""); };
  const updatePercent = (value: string) => { setPercent(value); const n = nonNegative(value); setMgPerMl(n === null ? "" : formatConcentration(percentToMgPerMl(n))); };
  const updateMg = (value: string) => { setMgPerMl(value); const n = nonNegative(value); setPercent(n === null ? "" : formatConcentration(mgPerMlToPercent(n))); };
  const smallMain = main && main.stockVolumeMl < SMALL_VOLUME_WARNING_ML;

  return <div className="dd-calculator">
    <section className="dd-card dd-main">
      <ConcentrationField label="Stock concentration" value={stock} unit={stockUnit} onValue={setStock} onUnit={setStockUnit} />
      <ConcentrationField label="Desired concentration" value={desired} unit={desiredUnit} onValue={setDesired} onUnit={setDesiredUnit} />
      <VolumeField label="Desired final volume" value={finalVolume} onChange={setFinalVolume} />
      {desiredExceedsStock && <p className="dd-error" role="alert">Desired concentration exceeds the stock concentration and cannot be achieved by dilution.</p>}
    </section>

    {main && <section className="dd-result" aria-live="polite"><span>Prepare</span><ResultRows rows={[["Stock drug", `${formatVolume(main.stockVolumeMl)} mL`], ["Diluent", `${formatVolume(main.diluentVolumeMl)} mL`], ["Final volume", `${formatVolume(main.finalVolumeMl)} mL`], ["Final concentration", `${formatConcentration(convertConcentration(main.finalConcentrationMgPerMl, "mg_per_ml", desiredUnit))} ${CONCENTRATION_UNITS[desiredUnit].label}`]]} /></section>}
    {smallMain && <div className="dd-small-warning"><p>Very small measurable volume. Consider preparing an intermediate dilution for more accurate measurement.</p><details><summary>Intermediate dilution</summary><div className="dd-details-body"><ConcentrationField label="Stock concentration" value={intermediateStock} unit={intermediateStockUnit} onValue={setIntermediateStock} onUnit={setIntermediateStockUnit} /><ConcentrationField label="Desired intermediate concentration" value={intermediateDesired} unit={intermediateDesiredUnit} onValue={setIntermediateDesired} onUnit={setIntermediateDesiredUnit} /><VolumeField label="Intermediate final volume" value={intermediateVolume} onChange={setIntermediateVolume} />{intermediate && <ResultRows rows={[["Stock drug", `${formatVolume(intermediate.stockVolumeMl)} mL`], ["Diluent", `${formatVolume(intermediate.diluentVolumeMl)} mL`]]} />}</div></details></div>}
    <button type="button" className="dd-reset" onClick={reset}>Reset</button>

    <details className="dd-tool"><summary>Verify existing dilution</summary><div className="dd-details-body"><ConcentrationField label="Stock concentration" value={reverseStock} unit={reverseUnit} onValue={setReverseStock} onUnit={setReverseUnit} /><VolumeField label="Stock drug volume" value={reverseStockVolume} onChange={setReverseStockVolume} /><VolumeField label="Diluent added" value={reverseDiluent} onChange={setReverseDiluent} allowZero /><label className="dd-field"><span>Output concentration unit</span><select className="dd-full-select" value={reverseOutput} onChange={e => setReverseOutput(e.target.value as ConcentrationUnit)}>{unitOptions.map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>{reverse && <ResultRows rows={[["Final volume", `${formatVolume(reverse.finalVolumeMl)} mL`], ["Total drug", `${formatConcentration(reverse.totalDrugMg)} mg`], ["Final concentration", `${formatConcentration(convertConcentration(reverse.finalConcentrationMgPerMl, "mg_per_ml", reverseOutput))} ${CONCENTRATION_UNITS[reverseOutput].label}`]]} />}</div></details>

    <details className="dd-tool"><summary>Prepare a specific dose</summary><div className="dd-details-body"><label className="dd-field"><span>Required total dose</span><span className="dd-input-select"><input type="number" inputMode="decimal" min="0" step="any" value={dose} onChange={e => setDose(e.target.validity.badInput ? "" : e.target.value)} /><select value={doseUnit} onChange={e => setDoseUnit(e.target.value as DoseUnit)}><option value="mg">mg</option><option value="ug">µg</option></select></span></label><ConcentrationField label="Stock concentration" value={doseStock} unit={doseStockUnit} onValue={setDoseStock} onUnit={setDoseStockUnit} /><VolumeField label="Desired final volume" value={doseFinalVolume} onChange={setDoseFinalVolume} />{preparedDose && <ResultRows rows={[["Stock drug", `${formatVolume(preparedDose.stockVolumeMl)} mL`], ["Diluent", `${formatVolume(preparedDose.diluentVolumeMl)} mL`], ["Final concentration", `${formatConcentration(preparedDose.finalConcentrationMgPerMl)} mg/mL`]]} />}{preparedDose && preparedDose.stockVolumeMl < SMALL_VOLUME_WARNING_ML && <p className="dd-small-inline">Very small measurable volume. Consider preparing an intermediate dilution for more accurate measurement.</p>}</div></details>

    <details className="dd-tool"><summary>Concentration Converter</summary><div className="dd-details-body"><div className="dd-converter"><label><span>% w/v <PercentInfo /></span><input type="number" inputMode="decimal" min="0" step="any" value={percent} onChange={e => updatePercent(e.target.validity.badInput ? "" : e.target.value)} /></label><strong aria-hidden="true">⇄</strong><label><span>mg/mL</span><input type="number" inputMode="decimal" min="0" step="any" value={mgPerMl} onChange={e => updateMg(e.target.validity.badInput ? "" : e.target.value)} /></label></div></div></details>
    <p className="dd-disclaimer">Clinical calculation support tool only. Verify drug concentration, compatibility, preparation instructions, and dosing before administration.</p>
  </div>;
}
