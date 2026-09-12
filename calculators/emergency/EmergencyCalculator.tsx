"use client";

import { useEffect, useMemo, useState } from "react";
import EmergencyDrugCard from "./EmergencyDrugCard";
import { calculateEmergencyDose, formatRange } from "./calculations";
import { concentrationDefinitions, defibrillationTreatments, emergencyCategories, recoverTreatments } from "./data";
import type { EmergencySpecies, EmergencyTreatment } from "./types";

const STORAGE_KEY = "vettools-emergency-concentrations-v1";
const referenceConcentrations = Object.fromEntries(concentrationDefinitions.map(item => [item.key, item.referenceValue === null ? "" : String(item.referenceValue)]));

function useEmergencyConcentrations() {
  const [values, setValues] = useState<Record<string, string>>(referenceConcentrations);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
        if (stored && typeof stored === "object") {
          const overrides: Record<string, string> = {};
          for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
            if (key in referenceConcentrations && typeof value === "string") {
              // Atropine previously had no reference concentration; migrate that old blank value to 1 mg/mL.
              if (key === "atropine" && value.trim() === "") continue;
              overrides[key] = value;
            }
          }
          setValues(current => ({ ...current, ...overrides }));
        }
      } catch { /* Keep reference values if browser storage is unavailable or invalid. */ }
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch { /* Calculator remains usable without storage. */ }
  }, [values, loaded]);
  const update = (key: string, value: string) => setValues(current => ({ ...current, [key]: value }));
  const reset = (key: string) => setValues(current => ({ ...current, [key]: referenceConcentrations[key] }));
  const resetAll = () => setValues(referenceConcentrations);
  return { values, update, reset, resetAll };
}

export default function EmergencyCalculator() {
  const [weight, setWeight] = useState("");
  const [species, setSpecies] = useState<EmergencySpecies>("dog");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [toxin, setToxin] = useState<string | null>(null);
  const [quickDosesOpen, setQuickDosesOpen] = useState(false);
  const concentrations = useEmergencyConcentrations();
  const parsedWeight = Number(weight);
  const weightKg = weight.trim() !== "" && Number.isFinite(parsedWeight) && parsedWeight > 0 ? parsedWeight : null;
  const weightInvalid = weight.trim() !== "" && weightKg === null;
  const selectedCategory = emergencyCategories.find(category => category.id === categoryId) ?? null;
  const toxins = useMemo(() => [...new Set(emergencyCategories.find(category => category.id === "toxicology")?.treatments.map(treatment => treatment.indication) ?? [])], []);

  const renderTreatment = (treatment: EmergencyTreatment) => {
    const concentrationDefinition = treatment.concentrationKey ? concentrationDefinitions.find(item => item.key === treatment.concentrationKey) : undefined;
    return <EmergencyDrugCard key={treatment.id} treatment={treatment} species={species} weightKg={weightKg}
      concentrationDefinition={concentrationDefinition} concentrationValue={concentrationDefinition ? concentrations.values[concentrationDefinition.key] : undefined}
      onConcentrationChange={concentrationDefinition ? value => concentrations.update(concentrationDefinition.key, value) : undefined}
      onResetConcentration={concentrationDefinition ? () => concentrations.reset(concentrationDefinition.key) : undefined} />;
  };

  const recoverForSpecies = recoverTreatments.filter(treatment => treatment.species.includes(species));
  const primary = recoverForSpecies.filter(treatment => ["cpr-epinephrine", "cpr-vasopressin", "cpr-atropine"].includes(treatment.id));
  const refractory = recoverForSpecies.filter(treatment => treatment.indication.startsWith("Refractory"));
  const reversal = recoverForSpecies.filter(treatment => treatment.indication === "CPR reversal drug");
  const categoryTreatments = selectedCategory?.treatments.filter(treatment => treatment.species.includes(species) && (selectedCategory.id !== "toxicology" || treatment.indication === toxin)) ?? [];
  useEffect(() => {
    if (!quickDosesOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setQuickDosesOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [quickDosesOpen]);

  const quickRows = recoverForSpecies.map(treatment => {
    const option = treatment.doseOptions.find(item => !item.species || item.species.includes(species));
    const definition = treatment.concentrationKey ? concentrationDefinitions.find(item => item.key === treatment.concentrationKey) : undefined;
    const concentration = definition ? Number(concentrations.values[definition.key]) : null;
    const validConcentration = concentration !== null && Number.isFinite(concentration) && concentration > 0 ? concentration : null;
    const result = option && weightKg !== null ? calculateEmergencyDose(weightKg, option, validConcentration, definition?.unit) : null;
    return { treatment, option, definition, concentration: validConcentration, result };
  });

  return <main className="toolkit-workspace em-page">
    <div className="toolkit-intro"><h1>Emergency Drug Calculator</h1></div>
    <section className="em-patient" aria-label="Patient">
      <label><span>Weight</span><span className="em-weight-input"><input type="number" inputMode="decimal" min="0" step="any" value={weight} onChange={event => setWeight(event.target.value)} aria-invalid={weightInvalid} /><span>kg</span></span>
        {weightInvalid && <small>Enter a weight greater than 0.</small>}</label>
      <fieldset className="species-picker"><legend>Species</legend><div className="segmented">
        {(["dog", "cat"] as EmergencySpecies[]).map(item => <button key={item} type="button" aria-pressed={species === item} className={species === item ? "active" : ""} onClick={() => setSpecies(item)}><span className="species-emoji" aria-hidden="true">{item === "dog" ? "🐕" : "🐈"}</span>{item === "dog" ? "Dog" : "Cat"}</button>)}
      </div></fieldset>
    </section>

    <nav className="em-floating-actions" aria-label="Emergency calculator shortcuts">
      <button type="button" onClick={() => setQuickDosesOpen(true)}>Quick doses</button>
      <details className="em-quick-nav"><summary>Quick jump</summary><div><a href="#recover-title">RECOVER CPR</a><a href="#other-title">Other treatments</a><a href="#em-settings">Concentrations</a></div></details>
    </nav>

    {quickDosesOpen && <div className="em-quick-overlay" role="dialog" aria-modal="true" aria-labelledby="quick-doses-title" onMouseDown={event => { if (event.target === event.currentTarget) setQuickDosesOpen(false); }}>
      <section className="em-quick-sheet">
        <header><div><h2 id="quick-doses-title">RECOVER quick doses</h2><p>{weightKg ? `${weightKg} kg · ${species === "dog" ? "Dog" : "Cat"}` : `Enter weight · ${species === "dog" ? "Dog" : "Cat"}`}</p></div><button type="button" aria-label="Close quick doses" onClick={() => setQuickDosesOpen(false)}>×</button></header>
        <div className="em-quick-table" role="table" aria-label="Calculated RECOVER drug doses">
          <div className="em-quick-table-head" role="row"><span role="columnheader">Drug</span><span role="columnheader">Dose</span><span role="columnheader">Give</span></div>
          {quickRows.map(({ treatment, option, definition, concentration, result }) => <div className="em-quick-row" role="row" key={treatment.id}>
            <span role="cell"><strong>{treatment.drugName}</strong><small>{definition ? `${concentration ?? "--"} ${definition.unit}` : treatment.indication}</small></span>
            <span role="cell">{option ? `${option.doseMin}${option.doseMax !== undefined ? `–${option.doseMax}` : ""} ${option.doseUnit.replaceAll("mcg", "µg")}` : "--"}</span>
            <strong role="cell">{result?.volumeMinMl !== null && result?.volumeMinMl !== undefined && result?.volumeMaxMl !== null && result?.volumeMaxMl !== undefined ? `${formatRange(result.volumeMinMl, result.volumeMaxMl, "volume")} mL` : "--"}</strong>
          </div>)}
        </div>
      </section>
    </div>}

    <section className="em-recover" aria-labelledby="recover-title">
      <header className="em-section-heading"><span>01</span><div><h2 id="recover-title">RECOVER CPR</h2><p>2024 crash-sheet calculations</p></div></header>
      <div className="em-card-grid">{primary.map(renderTreatment)}</div>
      <details className="em-treatment-group"><summary>Refractory VF / pulseless VT</summary><div className="em-card-grid">{refractory.map(renderTreatment)}</div></details>
      <details className="em-treatment-group"><summary>CPR reversal drugs</summary><div className="em-card-grid">{reversal.map(renderTreatment)}</div></details>
      <details className="em-treatment-group"><summary>Defibrillation</summary><div className="em-card-grid em-defib-grid">{defibrillationTreatments.map(renderTreatment)}</div></details>
    </section>

    <section className="em-other" aria-labelledby="other-title">
      <header className="em-section-heading"><span>02</span><div><h2 id="other-title">Other Emergency Treatments</h2></div></header>
      <div className="em-category-list">{emergencyCategories.map(category => {
        const active = categoryId === category.id;
        return <div className={`em-category-item${active ? " active" : ""}`} key={category.id}>
          <button type="button" aria-expanded={active} onClick={() => { setCategoryId(active ? null : category.id); setToxin(null); }}>{category.name}<span aria-hidden="true">{active ? "−" : "+"}</span></button>
          {active && category.id === "toxicology" && <div className="em-toxin-selector"><span>Select toxin</span><div>{toxins.map(item => <button type="button" key={item} aria-pressed={toxin === item} onClick={() => setToxin(item)}>{item}</button>)}</div></div>}
          {active && category.id !== "toxicology" && <div className="em-selected-category"><div className="em-card-grid">{categoryTreatments.map(renderTreatment)}</div></div>}
          {active && category.id === "toxicology" && toxin && <div className="em-selected-category"><h3>{toxin}</h3><div className="em-card-grid">{categoryTreatments.map(renderTreatment)}</div></div>}
        </div>;
      })}</div>
    </section>

    <details className="em-settings" id="em-settings"><summary>Concentration settings</summary><p>Enter the concentrations stocked by your clinic. Changes update every matching drug card and are stored only in this browser.</p>
      <div className="em-concentration-directory">{concentrationDefinitions.map(item => <label key={item.key}><span>{item.drugName}</span><span><input type="number" inputMode="decimal" min="0" step="any" value={concentrations.values[item.key]} onChange={event => concentrations.update(item.key, event.target.value)} aria-label={`${item.drugName} concentration`} /><small>{item.unit}</small></span></label>)}</div>
      <button type="button" className="toolkit-button" onClick={concentrations.resetAll}>Reset all emergency drug concentrations</button>
    </details>
    <section className="em-disclaimer"><strong>Clinical Decision Support Only</strong>
      <p>This calculator is intended to assist veterinary professionals with emergency drug and treatment calculations. It does not replace clinical judgment, patient assessment, current treatment guidelines, or verification of drug concentration, dose, route, and contraindications.</p>
      <p>Always confirm all calculations before administration. Drug concentrations and recommendations may vary between products, institutions, patients, and updated guidelines.</p>
      <p>VetTools should be used as a support tool only, not as the sole basis for treatment decisions.</p>
    </section>
  </main>;
}
