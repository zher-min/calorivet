"use client";

import { useMemo, useState } from "react";
import {
  activityFactors,
  calculateDailyEnergy,
  calculateFeedingAmount,
  calculateGuaranteedAnalysis,
  calculateLactationEnergy,
  lactationWeekFactor,
  offspringEnergy,
  parseFiniteNumber,
  selectFoodEnergy,
  type GuaranteedAnalysisInput,
  type ManufacturerEnergyUnit,
  type Species,
} from "./calculations";

type View = "feeding" | "lactation";

const emptyAnalysis: Record<keyof GuaranteedAnalysisInput, string> = {
  moisture: "",
  protein: "",
  fat: "",
  fibre: "",
  ash: "",
};

const formatNumber = (value: number, digits = 0) =>
  value.toLocaleString("en-MY", { maximumFractionDigits: digits });

const formatRange = (minimum: number, maximum: number, unit: string) =>
  `${formatNumber(minimum)}–${formatNumber(maximum)} ${unit}`;

function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  step = "0.1",
  min,
  max,
  error,
  hint,
  primary = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix: string;
  step?: string;
  min?: string;
  max?: string;
  error?: string;
  hint?: string;
  primary?: boolean;
}) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <label className={`field${primary ? " primary-field" : ""}`} htmlFor={id}>
      <span>{label}</span>
      <span className={`input-wrap${error ? " invalid" : ""}`}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
        <b aria-hidden="true">{suffix}</b>
      </span>
      {hint && <small className="field-hint" id={`${id}-hint`}>{hint}</small>}
      {error && <small className="field-error" id={`${id}-error`}>{error}</small>}
    </label>
  );
}

function SpeciesPicker({ value, onChange, prefix }: { value: Species; onChange: (value: Species) => void; prefix: string }) {
  return (
    <fieldset className="species-picker">
      <legend>Species</legend>
      <div className="segmented" id={`${prefix}-species`}>
        {(["Dog", "Cat"] as Species[]).map((item) => (
          <button key={item} type="button" aria-pressed={value === item} className={value === item ? "active" : ""} onClick={() => onChange(item)}>
            <span className="species-emoji" aria-hidden="true">{item === "Dog" ? "🐕" : "🐈"}</span>
            {item}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StepHeader({ id, number, title, copy }: { id: string; number: string; title: string; copy: string }) {
  return (
    <div className="step-header">
      <span>{number}</span>
      <div><h2 id={id}>{title}</h2><p>{copy}</p></div>
    </div>
  );
}

function EnergyResult({ minimum, maximum, rer, mer }: { minimum: number; maximum: number; rer: number; mer: number }) {
  return (
    <section className="energy-result" aria-live="polite" aria-label="Estimated daily energy requirement">
      <p>Estimated daily energy requirement</p>
      <strong>{formatRange(minimum, maximum, "kcal/day")}</strong>
      <div><span>RER {formatNumber(rer)} kcal/day</span><span>MER midpoint {formatNumber(mer)} kcal/day</span></div>
      <small>This range allows for individual variation around the estimated MER.</small>
    </section>
  );
}

function ClinicalDisclaimer() {
  return (
    <div className="clinical-disclaimer" role="note">
      <span aria-hidden="true">i</span>
      <p>Estimated feeding amount only. Individual requirements may vary with body condition, activity level, health status, environment and treatment goals. Use as a starting guide and adjust according to clinical response and body-weight trends. Veterinary supervision is recommended.</p>
    </div>
  );
}

function FoodEnergyControls({
  idPrefix,
  manufacturerEnabled,
  onManufacturerEnabledChange,
  manufacturerValue,
  onManufacturerValueChange,
  manufacturerUnit,
  onManufacturerUnitChange,
  manufacturerError,
  analysisEnabled,
  onAnalysisEnabledChange,
  analysis,
  onAnalysisChange,
  onClearAnalysis,
  guaranteedAnalysis,
  selectedFoodEnergy,
  foodMessage,
}: {
  idPrefix: string;
  manufacturerEnabled: boolean;
  onManufacturerEnabledChange: (value: boolean) => void;
  manufacturerValue: string;
  onManufacturerValueChange: (value: string) => void;
  manufacturerUnit: ManufacturerEnergyUnit;
  onManufacturerUnitChange: (value: ManufacturerEnergyUnit) => void;
  manufacturerError?: string;
  analysisEnabled: boolean;
  onAnalysisEnabledChange: (value: boolean) => void;
  analysis: Record<keyof GuaranteedAnalysisInput, string>;
  onAnalysisChange: (field: keyof GuaranteedAnalysisInput, value: string) => void;
  onClearAnalysis: () => void;
  guaranteedAnalysis: ReturnType<typeof calculateGuaranteedAnalysis>;
  selectedFoodEnergy: ReturnType<typeof selectFoodEnergy>;
  foodMessage: string | null;
}) {
  return (
    <>
      <div className="source-options">
        <label className="source-option">
          <input type="checkbox" checked={manufacturerEnabled} onChange={(event) => onManufacturerEnabledChange(event.target.checked)} />
          <span><b>Caloric value provided by manufacturer</b><small>Accepts kcal/kg or kcal/100 g · preferred source</small></span>
        </label>
        {manufacturerEnabled && (
          <div className="conditional-panel manufacturer-panel">
            <NumberField
              id={`${idPrefix}-manufacturer-kcal`}
              label="Manufacturer caloric density"
              value={manufacturerValue}
              onChange={onManufacturerValueChange}
              suffix={manufacturerUnit}
              min="0.01"
              step="0.1"
              error={manufacturerError}
              hint={`Enter ${manufacturerUnit} from the product label or manufacturer.`}
            />
            <label className="field" htmlFor={`${idPrefix}-manufacturer-unit`}>
              <span>Energy unit</span>
              <select id={`${idPrefix}-manufacturer-unit`} value={manufacturerUnit} onChange={(event) => onManufacturerUnitChange(event.target.value as ManufacturerEnergyUnit)}>
                <option value="kcal/kg">kcal/kg</option>
                <option value="kcal/100g">kcal/100 g</option>
              </select>
            </label>
          </div>
        )}

        <label className="source-option">
          <input type="checkbox" checked={analysisEnabled} onChange={(event) => onAnalysisEnabledChange(event.target.checked)} />
          <span><b>Guaranteed Analysis available</b><small>Estimate energy from nutrients listed on the label</small></span>
        </label>
        {analysisEnabled && (
          <div className="conditional-panel analysis-panel">
            <div className="analysis-heading"><div><h3>Guaranteed Analysis</h3><p>All five values are required. No nutrient value is assumed.</p></div><button type="button" onClick={onClearAnalysis}>Clear</button></div>
            <div className="analysis-grid">
              <NumberField id={`${idPrefix}-ga-protein`} label="Crude protein" value={analysis.protein} onChange={(value) => onAnalysisChange("protein", value)} suffix="%" min="0" max="100" />
              <NumberField id={`${idPrefix}-ga-fat`} label="Crude fat" value={analysis.fat} onChange={(value) => onAnalysisChange("fat", value)} suffix="%" min="0" max="100" />
              <NumberField id={`${idPrefix}-ga-fibre`} label="Crude fibre" value={analysis.fibre} onChange={(value) => onAnalysisChange("fibre", value)} suffix="%" min="0" max="100" />
              <NumberField id={`${idPrefix}-ga-moisture`} label="Moisture" value={analysis.moisture} onChange={(value) => onAnalysisChange("moisture", value)} suffix="%" min="0" max="100" />
              <NumberField id={`${idPrefix}-ga-ash`} label="Ash" value={analysis.ash} onChange={(value) => onAnalysisChange("ash", value)} suffix="%" min="0" max="100" hint="If ash is not listed, obtain or enter a clinically justified estimate." />
            </div>

            {!guaranteedAnalysis.valid && (
              <div className="analysis-status" role="status">
                {guaranteedAnalysis.missing.length > 0 && <p><b>Required:</b> {guaranteedAnalysis.missing.join(", ")}</p>}
                {guaranteedAnalysis.errors.map((error) => <p key={error}>{error}</p>)}
              </div>
            )}

            {guaranteedAnalysis.valid && (
              <div className="analysis-results" aria-live="polite">
                <div className="analysis-energy"><span>Estimated food energy</span><strong>{formatNumber(guaranteedAnalysis.kcalKg)} kcal/kg</strong>{selectedFoodEnergy?.source === "manufacturer" && <small>Calculated for nutrition reference; manufacturer value remains active.</small>}</div>
                <div className="distribution" aria-label="Caloric distribution">
                  <div><span>Protein energy</span><b>{formatNumber(guaranteedAnalysis.proteinEnergy, 1)}%</b></div>
                  <div><span>Fat energy</span><b>{formatNumber(guaranteedAnalysis.fatEnergy, 1)}%</b></div>
                  <div><span>Carbohydrate energy</span><b>{formatNumber(guaranteedAnalysis.carbohydrateEnergy, 1)}%</b></div>
                  <div><span>Calculated carbohydrate</span><b>{formatNumber(guaranteedAnalysis.carbohydrate, 1)}%</b></div>
                </div>
                <details>
                  <summary>View dry-matter composition</summary>
                  <div className="dry-matter-list">
                    <span>Protein <b>{formatNumber(guaranteedAnalysis.dryMatter.protein, 1)}%</b></span>
                    <span>Fat <b>{formatNumber(guaranteedAnalysis.dryMatter.fat, 1)}%</b></span>
                    <span>Fibre <b>{formatNumber(guaranteedAnalysis.dryMatter.fibre, 1)}%</b></span>
                    <span>Ash <b>{formatNumber(guaranteedAnalysis.dryMatter.ash, 1)}%</b></span>
                    <span>Carbohydrate <b>{formatNumber(guaranteedAnalysis.dryMatter.carbohydrate, 1)}%</b></span>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedFoodEnergy && (
        <div className="active-energy" aria-live="polite">
          <span>Food energy used for feeding estimate</span>
          <strong>{formatNumber(selectedFoodEnergy.kcalKg)} kcal/kg</strong>
          <small>{selectedFoodEnergy.source === "manufacturer" ? "Manufacturer-provided value" : "Estimated from Guaranteed Analysis"}</small>
        </div>
      )}
      {foodMessage && <div className="info-message" role="status">{foodMessage}</div>}
    </>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("feeding");
  const [species, setSpecies] = useState<Species>("Dog");
  const [weight, setWeight] = useState("");
  const [condition, setCondition] = useState("Typical intact pet");
  const [manufacturerEnabled, setManufacturerEnabled] = useState(false);
  const [manufacturerKcalKg, setManufacturerKcalKg] = useState("");
  const [manufacturerUnit, setManufacturerUnit] = useState<ManufacturerEnergyUnit>("kcal/kg");
  const [analysisEnabled, setAnalysisEnabled] = useState(false);
  const [analysis, setAnalysis] = useState(emptyAnalysis);
  const [lactationSpecies, setLactationSpecies] = useState<Species>("Dog");
  const [lactationWeight, setLactationWeight] = useState("");
  const [offspring, setOffspring] = useState(5);
  const [week, setWeek] = useState(1);

  const dailyEnergy = useMemo(() => calculateDailyEnergy(weight, species, condition), [condition, species, weight]);
  const guaranteedAnalysis = useMemo(() => calculateGuaranteedAnalysis(analysis), [analysis]);
  const selectedFoodEnergy = useMemo(() => selectFoodEnergy({
    manufacturerEnabled,
    manufacturerKcalKg,
    manufacturerUnit,
    guaranteedAnalysisEnabled: analysisEnabled,
    guaranteedAnalysis,
  }), [analysisEnabled, guaranteedAnalysis, manufacturerEnabled, manufacturerKcalKg, manufacturerUnit]);
  const feedingAmount = useMemo(() => calculateFeedingAmount(dailyEnergy, selectedFoodEnergy?.kcalKg ?? null), [dailyEnergy, selectedFoodEnergy]);
  const lactationEnergy = useMemo(
    () => calculateLactationEnergy(lactationWeight, lactationSpecies, offspring, week),
    [lactationSpecies, lactationWeight, offspring, week],
  );
  const lactationFeeding = useMemo(
    () => calculateFeedingAmount(lactationEnergy ? { ...lactationEnergy, mer: lactationEnergy.mer } : null, selectedFoodEnergy?.kcalKg ?? null),
    [lactationEnergy, selectedFoodEnergy],
  );

  const weightValue = parseFiniteNumber(weight);
  const weightError = weight !== "" && (weightValue === null || weightValue <= 0)
    ? "Enter a body weight greater than 0 kg."
    : undefined;
  const manufacturerValue = parseFiniteNumber(manufacturerKcalKg);
  const manufacturerError = manufacturerEnabled && manufacturerKcalKg !== "" && (manufacturerValue === null || manufacturerValue <= 0)
    ? "Enter a caloric density greater than 0 kcal/kg."
    : undefined;
  const lactationWeightValue = parseFiniteNumber(lactationWeight);
  const lactationWeightError = lactationWeight !== "" && (lactationWeightValue === null || lactationWeightValue <= 0)
    ? "Enter a body weight greater than 0 kg."
    : undefined;

  function changeSpecies(next: Species) {
    setSpecies(next);
    setCondition(Object.keys(activityFactors[next])[0]);
  }

  function changeAnalysis(field: keyof GuaranteedAnalysisInput, value: string) {
    setAnalysis((current) => ({ ...current, [field]: value }));
  }

  function changeLactationSpecies(next: Species) {
    setLactationSpecies(next);
    setWeek(1);
  }

  const foodMessage = !manufacturerEnabled && !analysisEnabled
    ? "Enter the food’s caloric value or Guaranteed Analysis to estimate the feeding amount."
    : selectedFoodEnergy === null
      ? "Complete a valid food-energy source to estimate the feeding amount."
      : null;
  const displayedEnergy = view === "feeding" ? dailyEnergy : lactationEnergy;
  const displayedFeeding = view === "feeding" ? feedingAmount : lactationFeeding;
  const hasMobileResult = Boolean(displayedEnergy && displayedFeeding);

  return (
    <main className={hasMobileResult ? "has-mobile-result" : undefined}>
      <a className="skip-link" href="#calculator">Skip to calculator</a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CaloriVet home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span><b>CaloriVet</b><small>Clinical feeding calculator</small></span>
        </a>
        <p className="privacy"><i aria-hidden="true" /> Calculations stay on this device</p>
      </header>

      <section className="intro" id="top" aria-labelledby="page-title">
        <h1 id="page-title">CaloriVet Feeding Calculator</h1>
        <details className="calculator-purpose">
          <summary>What is this calculator for?</summary>
          <div className="purpose-card">
            <p>Estimates daily calorie needs and a starting feeding amount in g/day for dogs and cats using manufacturer food energy or Guaranteed Analysis.</p>
            <p><b>Patient energy method:</b> RER (resting energy requirement) = 70 × body weight (kg)<sup>0.75</sup>. MER (maintenance energy requirement) = RER × the selected life-stage or condition factor. These are starting estimates and should be adjusted according to body-weight and body-condition trends.</p>
            <p><b>Guaranteed Analysis method:</b> Food energy is estimated with the AAFCO Modified Atwater formula: ME (kcal/kg) = 10 × [(3.5 × protein) + (8.5 × fat) + (3.5 × NFE)]. NFE is calculated carbohydrate.</p>
            <div className="purpose-sources">
              <a href="https://www.aaha.org/resources/2021-aaha-nutrition-and-weight-management-guidelines/weight-reduction-in-the-obese-pet/" target="_blank" rel="noreferrer">AAHA energy guidance <span aria-hidden="true">↗</span></a>
              <a href="https://www.aafco.org/resources/startups/calorie-content/" target="_blank" rel="noreferrer">AAFCO food-energy method <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </details>
      </section>

      <nav className="view-switch" aria-label="Calculator type">
        <button type="button" className={view === "feeding" ? "active" : ""} aria-pressed={view === "feeding"} onClick={() => setView("feeding")}>Standard feeding</button>
        <button type="button" className={view === "lactation" ? "active" : ""} aria-pressed={view === "lactation"} onClick={() => setView("lactation")}>Lactation</button>
      </nav>

      {view === "feeding" && (
        <div className="workflow" id="calculator">
          <section className="workflow-card patient-card" aria-labelledby="patient-heading">
            <StepHeader id="patient-heading" number="01" title="Patient information" copy="Start with body weight, then choose the closest clinical or life-stage factor." />
            <div className="patient-grid">
              <NumberField id="body-weight" label="Body weight" value={weight} onChange={setWeight} suffix="kg" min="0.01" step="0.01" error={weightError} primary />
              <SpeciesPicker value={species} onChange={changeSpecies} prefix="patient" />
              <label className="field condition-field" htmlFor="condition">
                <span>Condition / life stage</span>
                <select id="condition" value={condition} onChange={(event) => setCondition(event.target.value)}>
                  {Object.keys(activityFactors[species]).map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
            {dailyEnergy ? (
              <EnergyResult {...dailyEnergy} />
            ) : (
              <div className="pending-result" aria-live="polite"><span>Estimated daily energy requirement</span><p>Enter a valid body weight to calculate kcal/day.</p></div>
            )}
          </section>

          <div className="flow-arrow" aria-hidden="true">↓</div>

          <section className="workflow-card" aria-labelledby="food-heading">
            <StepHeader id="food-heading" number="02" title="Food energy information" copy="Use a manufacturer value when available, or estimate energy from Guaranteed Analysis." />
            <FoodEnergyControls
              idPrefix="standard"
              manufacturerEnabled={manufacturerEnabled}
              onManufacturerEnabledChange={setManufacturerEnabled}
              manufacturerValue={manufacturerKcalKg}
              onManufacturerValueChange={setManufacturerKcalKg}
              manufacturerUnit={manufacturerUnit}
              onManufacturerUnitChange={setManufacturerUnit}
              manufacturerError={manufacturerError}
              analysisEnabled={analysisEnabled}
              onAnalysisEnabledChange={setAnalysisEnabled}
              analysis={analysis}
              onAnalysisChange={changeAnalysis}
              onClearAnalysis={() => setAnalysis(emptyAnalysis)}
              guaranteedAnalysis={guaranteedAnalysis}
              selectedFoodEnergy={selectedFoodEnergy}
              foodMessage={foodMessage}
            />
          </section>

          <div className="flow-arrow" aria-hidden="true">↓</div>

          <section className="workflow-card feeding-card" aria-labelledby="feeding-heading">
            <StepHeader id="feeding-heading" number="03" title="Estimated feeding amount" copy="Calculated only when valid patient and food-energy information are available." />
            {feedingAmount ? (
              <>
                <div className="feeding-result" aria-live="polite">
                  <span>Estimated amount to feed</span>
                  <strong>{formatRange(feedingAmount.minimum, feedingAmount.maximum, "g/day")}</strong>
                  <small>Midpoint: {formatNumber(feedingAmount.midpoint)} g/day · starting guide only</small>
                </div>
                <ClinicalDisclaimer />
              </>
            ) : (
              <div className="pending-result final-pending" aria-live="polite">
                <span>Estimated amount to feed</span>
                <p>{dailyEnergy ? (foodMessage ?? "Correct the invalid food-energy entry to continue.") : "Enter a valid body weight and food-energy information to calculate g/day."}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {view === "lactation" && (
        <div className="workflow lactation-workflow" id="calculator">
          <section className="workflow-card" aria-labelledby="lactation-heading">
            <StepHeader id="lactation-heading" number="01" title="Lactation patient" copy="Estimate energy needs during lactation using body weight, litter size and stage of lactation." />
            <div className="patient-grid lactation-grid">
              <NumberField id="lactation-weight" label="Body weight" value={lactationWeight} onChange={setLactationWeight} suffix="kg" min="0.01" step="0.01" error={lactationWeightError} primary />
              <SpeciesPicker value={lactationSpecies} onChange={changeLactationSpecies} prefix="lactation" />
              <label className="field" htmlFor="offspring"><span>Number of offspring</span><select id="offspring" value={offspring} onChange={(event) => setOffspring(Number(event.target.value))}>{offspringEnergy[lactationSpecies].map((_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>
              <label className="field" htmlFor="lactation-week"><span>Lactation week</span><select id="lactation-week" value={week} onChange={(event) => setWeek(Number(event.target.value))}>{lactationWeekFactor[lactationSpecies].map((_, index) => <option key={index + 1} value={index + 1}>Week {index + 1}</option>)}</select></label>
            </div>
            {lactationEnergy ? (
              <EnergyResult {...lactationEnergy} />
            ) : (
              <div className="pending-result" aria-live="polite"><span>Estimated daily energy requirement</span><p>Enter a valid body weight to calculate kcal/day.</p></div>
            )}
          </section>

          <div className="flow-arrow" aria-hidden="true">↓</div>

          <section className="workflow-card" aria-labelledby="lactation-food-heading">
            <StepHeader id="lactation-food-heading" number="02" title="Food energy information" copy="Enter the food information here without leaving the lactation calculator." />
            <FoodEnergyControls
              idPrefix="lactation"
              manufacturerEnabled={manufacturerEnabled}
              onManufacturerEnabledChange={setManufacturerEnabled}
              manufacturerValue={manufacturerKcalKg}
              onManufacturerValueChange={setManufacturerKcalKg}
              manufacturerUnit={manufacturerUnit}
              onManufacturerUnitChange={setManufacturerUnit}
              manufacturerError={manufacturerError}
              analysisEnabled={analysisEnabled}
              onAnalysisEnabledChange={setAnalysisEnabled}
              analysis={analysis}
              onAnalysisChange={changeAnalysis}
              onClearAnalysis={() => setAnalysis(emptyAnalysis)}
              guaranteedAnalysis={guaranteedAnalysis}
              selectedFoodEnergy={selectedFoodEnergy}
              foodMessage={foodMessage}
            />
          </section>

          <div className="flow-arrow" aria-hidden="true">↓</div>

          <section className="workflow-card feeding-card" aria-labelledby="lactation-feeding-heading">
            <StepHeader id="lactation-feeding-heading" number="03" title="Estimated feeding amount" copy="Calculated from the lactation energy requirement and selected food energy." />
            {lactationFeeding ? (
              <>
                <div className="feeding-result"><span>Estimated amount to feed</span><strong>{formatRange(lactationFeeding.minimum, lactationFeeding.maximum, "g/day")}</strong><small>Midpoint: {formatNumber(lactationFeeding.midpoint)} g/day</small></div>
                <ClinicalDisclaimer />
              </>
            ) : (
              <div className="pending-result final-pending" aria-live="polite">
                <span>Estimated amount to feed</span>
                <p>{lactationEnergy ? (foodMessage ?? "Correct the invalid food-energy entry to continue.") : "Enter a valid body weight and food-energy information to calculate g/day."}</p>
              </div>
            )}
          </section>
        </div>
      )}

      {displayedEnergy && displayedFeeding && (
        <aside className="mobile-result-bar" aria-label="Current calculation result" aria-live="polite">
          <div><span>Daily energy</span><strong>{formatRange(displayedEnergy.minimum, displayedEnergy.maximum, "kcal/day")}</strong></div>
          <div><span>Feed amount</span><strong>{formatRange(displayedFeeding.minimum, displayedFeeding.maximum, "g/day")}</strong></div>
        </aside>
      )}

      <footer><p>CaloriVet · Veterinary nutrition estimates for dogs and cats</p></footer>
    </main>
  );
}
