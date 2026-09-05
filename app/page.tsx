"use client";

import { KeyboardEvent, useMemo, useRef, useState } from "react";

type Species = "Dog" | "Cat";
type Tab = "daily" | "food" | "lactation";

const tabOrder: Tab[] = ["daily", "food", "lactation"];

const activityFactors: Record<Species, Record<string, number>> = {
  Dog: {
    "Typical intact pet": 1.8,
    "Typical neutered pet": 1.6,
    "Obese prone": 1.4,
    "Weight loss": 1,
    "Weight gain (intact)": 1.8,
    "Weight gain (neutered)": 1.6,
    "Working — light": 2,
    "Working — moderate": 3,
    "Working — heavy": 6,
    "Critical care": 1,
    "Growing (<4 months)": 2,
    "Growing (>4 months)": 3,
  },
  Cat: {
    "Typical intact pet": 1.4,
    "Typical neutered pet": 1.2,
    "Obese prone": 1,
    "Weight loss": 0.8,
    "Weight gain (intact)": 1.4,
    "Weight gain (neutered)": 1.2,
    "Active cat": 1.6,
    "Critical care": 1,
    "Growing (<4 months)": 2,
    "Growing (>4 months)": 3,
  },
};

const offspringEnergy: Record<Species, number[]> = {
  Dog: [24, 48, 72, 96, 108, 120, 132, 144],
  Cat: [18, 18, 60, 60, 70, 70, 70, 70],
};

const lactationWeekFactor: Record<Species, number[]> = {
  Dog: [0.75, 0.95, 1.1, 1.2],
  Cat: [0.9, 0.9, 1.2, 1.2, 1.1, 1, 0.8],
};

const defaultFood = { moisture: 8.5, protein: 34, fat: 16, fibre: 2.8, ash: 8 };

const formatNumber = (value: number, digits = 0) =>
  Number.isFinite(value)
    ? value.toLocaleString("en-MY", { maximumFractionDigits: digits })
    : "—";

const positiveNumber = (value: string) => Math.max(0, Number(value) || 0);

function NumberField({
  id,
  label,
  value,
  onChange,
  suffix,
  step = "0.1",
  min = "0",
  describedBy,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
  step?: string;
  min?: string;
  describedBy?: string;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <span className="input-wrap">
        <input
          id={id}
          type="number"
          min={min}
          step={step}
          value={value}
          aria-describedby={describedBy}
          onChange={(event) => onChange(positiveNumber(event.target.value))}
        />
        <b aria-hidden="true">{suffix}</b>
      </span>
    </label>
  );
}

function SpeciesPicker({
  id,
  value,
  onChange,
}: {
  id: string;
  value: Species;
  onChange: (value: Species) => void;
}) {
  return (
    <fieldset className="species-picker">
      <legend>Species</legend>
      <div className="segmented" id={id}>
        {(["Dog", "Cat"] as Species[]).map((species) => (
          <button
            key={species}
            type="button"
            aria-pressed={value === species}
            className={value === species ? "active" : ""}
            onClick={() => onChange(species)}
          >
            <span aria-hidden="true">{species === "Dog" ? "◖" : "◇"}</span>
            {species}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {unit && <small>{unit}</small>}
    </div>
  );
}

function FeedingRange({ grams }: { grams: number | null }) {
  const points = [
    { label: "Lower", factor: 0.5 },
    { label: "Average", factor: 1 },
    { label: "Upper", factor: 1.5 },
  ];

  return (
    <div className="feeding-range" aria-label="Feeding range from 50 to 150 percent">
      {points.map((point) => (
        <div key={point.label}>
          <span>{point.label} · {point.factor * 100}%</span>
          <b>{grams === null ? "—" : formatNumber(grams * point.factor)} g</b>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("daily");
  const [moisture, setMoisture] = useState(defaultFood.moisture);
  const [protein, setProtein] = useState(defaultFood.protein);
  const [fat, setFat] = useState(defaultFood.fat);
  const [fibre, setFibre] = useState(defaultFood.fibre);
  const [ash, setAsh] = useState(defaultFood.ash);
  const [species, setSpecies] = useState<Species>("Dog");
  const [weight, setWeight] = useState(36.6);
  const [condition, setCondition] = useState("Weight loss");
  const [lactationSpecies, setLactationSpecies] = useState<Species>("Dog");
  const [lactationWeight, setLactationWeight] = useState(5);
  const [offspring, setOffspring] = useState(5);
  const [week, setWeek] = useState(1);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ daily: null, food: null, lactation: null });

  const food = useMemo(() => {
    const carbohydrate = 100 - moisture - protein - fat - fibre - ash;
    const kcal100 = protein * 3.5 + fat * 8.5 + carbohydrate * 3.5;
    const dryMatter = 100 - moisture;
    const energyTotal = kcal100 || 1;

    return {
      carbohydrate,
      kcal100,
      proteinEnergy: (protein * 3.5 * 100) / energyTotal,
      fatEnergy: (fat * 8.5 * 100) / energyTotal,
      carbohydrateEnergy: (carbohydrate * 3.5 * 100) / energyTotal,
      proteinDryMatter: (protein * 100) / dryMatter,
      fatDryMatter: (fat * 100) / dryMatter,
      fibreDryMatter: (fibre * 100) / dryMatter,
      ashDryMatter: (ash * 100) / dryMatter,
      carbohydrateDryMatter: (carbohydrate * 100) / dryMatter,
    };
  }, [moisture, protein, fat, fibre, ash]);

  const invalidFood = food.carbohydrate < 0 || moisture >= 100 || food.kcal100 <= 0;

  const daily = useMemo(() => {
    if (weight <= 0 || invalidFood) return null;
    const rer = 70 * Math.pow(weight, 0.75);
    const factor = activityFactors[species][condition] ?? 1;
    const mer = rer * factor;
    return { rer, mer, grams: mer / (food.kcal100 / 100), factor };
  }, [condition, food.kcal100, invalidFood, species, weight]);

  const lactation = useMemo(() => {
    if (lactationWeight <= 0 || invalidFood) return null;
    const rer = 70 * Math.pow(lactationWeight, 0.75);
    const litterFactor = offspringEnergy[lactationSpecies][offspring - 1];
    const weekFactor = lactationWeekFactor[lactationSpecies][week - 1];
    const mer = lactationSpecies === "Dog"
      ? (145 / 70) * rer + litterFactor * lactationWeight * weekFactor
      : 100 * Math.pow(lactationWeight, 0.67) + litterFactor * lactationWeight * weekFactor;

    return { rer, mer, grams: mer / (food.kcal100 / 100) };
  }, [food.kcal100, invalidFood, lactationSpecies, lactationWeight, offspring, week]);

  function changeSpecies(next: Species) {
    setSpecies(next);
    setCondition(Object.keys(activityFactors[next])[0]);
  }

  function changeLactationSpecies(next: Species) {
    setLactationSpecies(next);
    setWeek(1);
  }

  function resetFood() {
    setMoisture(defaultFood.moisture);
    setProtein(defaultFood.protein);
    setFat(defaultFood.fat);
    setFibre(defaultFood.fibre);
    setAsh(defaultFood.ash);
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, current: Tab) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const currentIndex = tabOrder.indexOf(current);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabOrder.length - 1
        : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabOrder.length) % tabOrder.length;
    const next = tabOrder[nextIndex];
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  const tabs: { id: Tab; number: string; label: string }[] = [
    { id: "daily", number: "01", label: "Daily requirement" },
    { id: "food", number: "02", label: "Food analysis" },
    { id: "lactation", number: "03", label: "Lactation" },
  ];

  return (
    <main>
      <a className="skip-link" href="#calculator">Skip to calculator</a>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CaloriVet home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>
            <b>CaloriVet</b>
            <small>Body-weight calorie planner</small>
          </span>
        </a>
        <p className="privacy"><i aria-hidden="true" /> Calculations stay on this device</p>
      </header>

      <section className="intro" id="top" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Veterinary nutrition calculator</p>
          <h1 id="page-title">Turn body weight into a <em>clear feeding plan.</em></h1>
          <p>Estimate daily energy needs and feeding amounts for dogs and cats using your food’s caloric profile.</p>
        </div>
        <aside className="food-summary" aria-label="Current food energy">
          <span>Food energy in use</span>
          <strong>{invalidFood ? "—" : formatNumber(food.kcal100, 1)}</strong>
          <small>kcal / 100 g</small>
          <button type="button" onClick={() => setTab("food")}>Edit food analysis <span aria-hidden="true">→</span></button>
        </aside>
      </section>

      <section className="calculator-shell" id="calculator" aria-label="Calorie calculator">
        <div className="tabs" role="tablist" aria-label="Calculator sections">
          {tabs.map((item) => (
            <button
              key={item.id}
              ref={(node) => { tabRefs.current[item.id] = node; }}
              id={`tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              tabIndex={tab === item.id ? 0 : -1}
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
              onKeyDown={(event) => handleTabKeyDown(event, item.id)}
            >
              <span>{item.number}</span>
              {item.label}
            </button>
          ))}
        </div>

        {tab === "daily" && (
          <div className="workspace" id="panel-daily" role="tabpanel" aria-labelledby="tab-daily">
            <section className="panel input-panel" aria-labelledby="daily-input-title">
              <p className="eyebrow">Patient profile</p>
              <h2 id="daily-input-title">Body weight & condition</h2>
              <p className="supporting">Choose the closest life stage or clinical condition. Results update as you type.</p>
              <SpeciesPicker id="daily-species" value={species} onChange={changeSpecies} />
              <NumberField id="daily-weight" label="Body weight" value={weight} onChange={setWeight} suffix="kg" />
              <label className="field" htmlFor="daily-condition">
                <span>Condition</span>
                <select id="daily-condition" value={condition} onChange={(event) => setCondition(event.target.value)}>
                  {Object.keys(activityFactors[species]).map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <div className="linked-food">
                <span>Food energy</span>
                <b>{invalidFood ? "Needs review" : `${formatNumber(food.kcal100, 1)} kcal / 100 g`}</b>
                <button type="button" onClick={() => setTab("food")}>Edit</button>
              </div>
            </section>

            <section className="panel result-panel" aria-labelledby="daily-result-title" aria-live="polite">
              <p className="eyebrow">Daily estimate</p>
              <h2 id="daily-result-title">{species} feeding guide</h2>
              <div className="primary-result">
                <span>Recommended feeding amount</span>
                <div><strong>{daily ? formatNumber(daily.grams) : "—"}</strong><small>grams / day</small></div>
                <p>{daily ? `Calculated at ${daily.factor}× resting energy requirement` : "Enter a valid weight and food profile to continue"}</p>
              </div>
              <div className="metric-grid">
                <Metric label="Resting energy (RER)" value={daily ? formatNumber(daily.rer) : "—"} unit="kcal / day" />
                <Metric label="Maintenance energy (MER)" value={daily ? formatNumber(daily.mer) : "—"} unit="kcal / day" />
              </div>
              <FeedingRange grams={daily?.grams ?? null} />
            </section>
          </div>
        )}

        {tab === "food" && (
          <div className="workspace" id="panel-food" role="tabpanel" aria-labelledby="tab-food">
            <section className="panel input-panel" aria-labelledby="food-input-title">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Guaranteed analysis</p>
                  <h2 id="food-input-title">What’s in the food?</h2>
                </div>
                <button className="reset-button" type="button" onClick={resetFood}>Reset</button>
              </div>
              <p className="supporting" id="food-help">Enter the percentages from the food label, as fed. If ash is not listed, use 2% as an estimate.</p>
              <div className="field-grid">
                <NumberField id="moisture" label="Moisture" value={moisture} onChange={setMoisture} suffix="%" describedBy="food-help" />
                <NumberField id="protein" label="Crude protein" value={protein} onChange={setProtein} suffix="%" />
                <NumberField id="fat" label="Crude fat" value={fat} onChange={setFat} suffix="%" />
                <NumberField id="fibre" label="Crude fibre" value={fibre} onChange={setFibre} suffix="%" />
                <NumberField id="ash" label="Ash" value={ash} onChange={setAsh} suffix="%" />
              </div>
              {invalidFood && <p className="warning" role="alert">The nutrient values must total less than 100%. Check the label entries.</p>}
            </section>

            <section className="panel result-panel" aria-labelledby="food-result-title" aria-live="polite">
              <p className="eyebrow">Calculated result</p>
              <h2 id="food-result-title">Caloric distribution</h2>
              <div className="primary-result food-result">
                <span>Estimated caloric value</span>
                <div><strong>{invalidFood ? "—" : formatNumber(food.kcal100, 1)}</strong><small>kcal / 100 g</small></div>
                <p>{invalidFood ? "Correct the inputs to continue" : `${formatNumber(food.kcal100 * 10)} kcal per kilogram`}</p>
              </div>
              <div className="distribution" aria-label="Calories from protein, fat, and carbohydrate">
                <div style={{ "--value": `${Math.max(0, food.proteinEnergy)}%` } as React.CSSProperties}><span>Protein</span><b>{invalidFood ? "—" : `${formatNumber(food.proteinEnergy, 1)}%`}</b></div>
                <div style={{ "--value": `${Math.max(0, food.fatEnergy)}%` } as React.CSSProperties}><span>Fat</span><b>{invalidFood ? "—" : `${formatNumber(food.fatEnergy, 1)}%`}</b></div>
                <div style={{ "--value": `${Math.max(0, food.carbohydrateEnergy)}%` } as React.CSSProperties}><span>Carbohydrate</span><b>{invalidFood ? "—" : `${formatNumber(food.carbohydrateEnergy, 1)}%`}</b></div>
              </div>
              <details>
                <summary>View dry-matter composition</summary>
                <div className="dry-matter-list">
                  <span>Protein <b>{invalidFood ? "—" : `${formatNumber(food.proteinDryMatter, 1)}%`}</b></span>
                  <span>Fat <b>{invalidFood ? "—" : `${formatNumber(food.fatDryMatter, 1)}%`}</b></span>
                  <span>Fibre <b>{invalidFood ? "—" : `${formatNumber(food.fibreDryMatter, 1)}%`}</b></span>
                  <span>Ash <b>{invalidFood ? "—" : `${formatNumber(food.ashDryMatter, 1)}%`}</b></span>
                  <span>Carbohydrate <b>{invalidFood ? "—" : `${formatNumber(food.carbohydrateDryMatter, 1)}%`}</b></span>
                </div>
              </details>
            </section>
          </div>
        )}

        {tab === "lactation" && (
          <div className="workspace" id="panel-lactation" role="tabpanel" aria-labelledby="tab-lactation">
            <section className="panel input-panel" aria-labelledby="lactation-input-title">
              <p className="eyebrow">Lactating patient</p>
              <h2 id="lactation-input-title">Mother & litter details</h2>
              <p className="supporting">Week options follow the dog and cat lactation tables in the original workbook.</p>
              <SpeciesPicker id="lactation-species" value={lactationSpecies} onChange={changeLactationSpecies} />
              <NumberField id="lactation-weight" label="Body weight" value={lactationWeight} onChange={setLactationWeight} suffix="kg" />
              <label className="field" htmlFor="offspring">
                <span>Number of offspring</span>
                <select id="offspring" value={offspring} onChange={(event) => setOffspring(Number(event.target.value))}>
                  {offspringEnergy[lactationSpecies].map((_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}
                </select>
              </label>
              <label className="field" htmlFor="lactation-week">
                <span>Lactation week</span>
                <select id="lactation-week" value={week} onChange={(event) => setWeek(Number(event.target.value))}>
                  {lactationWeekFactor[lactationSpecies].map((_, index) => <option key={index + 1} value={index + 1}>Week {index + 1}</option>)}
                </select>
              </label>
            </section>

            <section className="panel result-panel" aria-labelledby="lactation-result-title" aria-live="polite">
              <p className="eyebrow">Lactation estimate</p>
              <h2 id="lactation-result-title">Energy for mother & litter</h2>
              <div className="primary-result">
                <span>Recommended feeding amount</span>
                <div><strong>{lactation ? formatNumber(lactation.grams) : "—"}</strong><small>grams / day</small></div>
                <p>{offspring} offspring · week {week}</p>
              </div>
              <div className="metric-grid">
                <Metric label="Resting energy (RER)" value={lactation ? formatNumber(lactation.rer) : "—"} unit="kcal / day" />
                <Metric label="Lactation energy (MER)" value={lactation ? formatNumber(lactation.mer) : "—"} unit="kcal / day" />
              </div>
              <FeedingRange grams={lactation?.grams ?? null} />
            </section>
          </div>
        )}
      </section>

      <footer>
        <div className="clinical-note">
          <span aria-hidden="true">i</span>
          <div><b>Clinical note</b><p>RER, MER, and feeding amounts are estimates with a wide possible range. Monitor body condition and adjust for the individual patient with veterinary guidance.</p></div>
        </div>
        <p>Based on the supplied Caloric Distribution Calculator workbook.</p>
      </footer>
    </main>
  );
}
