"use client";

import { useMemo, useState } from "react";

type Species = "Dog" | "Cat";
type Tab = "food" | "daily" | "lactation";

const factors: Record<Species, Record<string, number>> = {
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
const weekFactor: Record<Species, number[]> = {
  Dog: [0.75, 0.95, 1.1, 1.2],
  Cat: [0.9, 0.9, 1.2, 1.2, 1.1, 1, 0.8],
};

const round = (n: number, digits = 0) => Number.isFinite(n) ? n.toLocaleString("en-MY", { maximumFractionDigits: digits }) : "—";
const clampNumber = (value: string) => Math.max(0, Number(value) || 0);

function NumberField({ label, value, onChange, suffix = "%", step = "0.1", min = "0" }: { label: string; value: number; onChange: (value: number) => void; suffix?: string; step?: string; min?: string }) {
  return <label className="field"><span>{label}</span><div className="input-wrap"><input type="number" min={min} step={step} value={value} onChange={(e) => onChange(clampNumber(e.target.value))} /><b>{suffix}</b></div></label>;
}

function Segmented({ value, onChange }: { value: Species; onChange: (value: Species) => void }) {
  return <div className="segmented" aria-label="Species">{(["Dog", "Cat"] as Species[]).map((item) => <button key={item} className={value === item ? "active" : ""} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

function Result({ label, value, unit, accent = false }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return <div className={accent ? "result accent" : "result"}><span>{label}</span><strong>{value}</strong>{unit && <small>{unit}</small>}</div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("food");
  const [moisture, setMoisture] = useState(8.5);
  const [protein, setProtein] = useState(34);
  const [fat, setFat] = useState(16);
  const [fibre, setFibre] = useState(2.8);
  const [ash, setAsh] = useState(8);
  const [species, setSpecies] = useState<Species>("Dog");
  const [weight, setWeight] = useState(36.6);
  const [condition, setCondition] = useState("Weight loss");
  const [lSpecies, setLSpecies] = useState<Species>("Dog");
  const [lWeight, setLWeight] = useState(5);
  const [offspring, setOffspring] = useState(5);
  const [week, setWeek] = useState(1);

  const food = useMemo(() => {
    const carbohydrate = 100 - moisture - protein - fat - fibre - ash;
    const kcal100 = protein * 3.5 + fat * 8.5 + carbohydrate * 3.5;
    const energyTotal = kcal100 || 1;
    const dryBase = 100 - moisture;
    return { carbohydrate, kcal100, proteinEnergy: protein * 3.5 / energyTotal * 100, fatEnergy: fat * 8.5 / energyTotal * 100, carbEnergy: carbohydrate * 3.5 / energyTotal * 100, proteinDM: protein / dryBase * 100, fatDM: fat / dryBase * 100, fibreDM: fibre / dryBase * 100, ashDM: ash / dryBase * 100, carbDM: carbohydrate / dryBase * 100 };
  }, [moisture, protein, fat, fibre, ash]);

  const daily = useMemo(() => {
    const rer = 70 * Math.pow(weight, 0.75);
    const mer = rer * (factors[species][condition] ?? 1);
    const grams = food.kcal100 > 0 ? mer / (food.kcal100 / 100) : 0;
    return { rer, mer, grams };
  }, [weight, species, condition, food.kcal100]);

  const lactation = useMemo(() => {
    const rer = 70 * Math.pow(lWeight, 0.75);
    const n = offspringEnergy[lSpecies][Math.max(0, Math.min(7, offspring - 1))];
    const l = weekFactor[lSpecies][Math.max(0, Math.min(weekFactor[lSpecies].length - 1, week - 1))];
    const mer = lSpecies === "Dog" ? (145 / 70) * rer + n * lWeight * l : 100 * Math.pow(lWeight, 0.67) + n * lWeight * l;
    return { rer, mer, grams: food.kcal100 > 0 ? mer / (food.kcal100 / 100) : 0 };
  }, [lSpecies, lWeight, offspring, week, food.kcal100]);

  const invalidFood = food.carbohydrate < 0 || moisture >= 100;
  const switchSpecies = (next: Species) => { setSpecies(next); setCondition(Object.keys(factors[next])[0]); };
  const switchLSpecies = (next: Species) => { setLSpecies(next); setWeek(1); };

  return <main>
    <header className="topbar"><div className="brand"><div className="mark">C</div><div><b>CaloriVet</b><span>Nutrition calculator</span></div></div><div className="status"><i />Calculations stay on your device</div></header>
    <section className="hero"><div><p className="eyebrow">Veterinary nutrition toolkit</p><h1>Clear feeding estimates,<br /><em>without the spreadsheet.</em></h1><p>Analyse pet food, estimate daily energy needs, and calculate lactation requirements in one focused workspace.</p></div><div className="hero-stat"><span>Current food</span><strong>{round(food.kcal100, 1)}</strong><small>kcal / 100 g</small></div></section>

    <nav className="tabs" aria-label="Calculator sections">
      {([{ id: "food", n: "01", label: "Food analysis" }, { id: "daily", n: "02", label: "Daily requirement" }, { id: "lactation", n: "03", label: "Lactation" }] as const).map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={tab === item.id ? "active" : ""}><span>{item.n}</span>{item.label}</button>)}
    </nav>

    <section className="workspace">
      {tab === "food" && <><div className="panel inputs"><div className="panel-head"><div><p className="eyebrow">Guaranteed analysis</p><h2>What’s in the food?</h2></div><button className="reset" onClick={() => { setMoisture(8.5); setProtein(34); setFat(16); setFibre(2.8); setAsh(8); }}>Reset</button></div><p className="hint">Enter the percentages printed on the food label, as fed.</p><div className="field-grid"><NumberField label="Moisture" value={moisture} onChange={setMoisture} /><NumberField label="Crude protein" value={protein} onChange={setProtein} /><NumberField label="Crude fat" value={fat} onChange={setFat} /><NumberField label="Crude fibre" value={fibre} onChange={setFibre} /><NumberField label="Ash" value={ash} onChange={setAsh} /></div>{invalidFood && <div className="warning">These values total more than 100%. Check the label entries.</div>}</div><div className="panel output"><p className="eyebrow">Calculated result</p><h2>Food energy profile</h2><div className="primary-result"><span>Estimated caloric value</span><strong>{invalidFood ? "—" : round(food.kcal100, 1)}</strong><small>kcal / 100 g</small><p>{invalidFood ? "Correct the inputs to continue" : `${round(food.kcal100 * 10, 0)} kcal per kilogram`}</p></div><div className="result-grid"><Result label="Carbohydrate" value={invalidFood ? "—" : `${round(food.carbohydrate, 1)}%`} /><Result label="Protein energy" value={invalidFood ? "—" : `${round(food.proteinEnergy, 1)}%`} /><Result label="Fat energy" value={invalidFood ? "—" : `${round(food.fatEnergy, 1)}%`} /><Result label="Carb energy" value={invalidFood ? "—" : `${round(food.carbEnergy, 1)}%`} /></div><details><summary>View dry-matter composition</summary><div className="dm-list"><span>Protein <b>{round(food.proteinDM, 1)}%</b></span><span>Fat <b>{round(food.fatDM, 1)}%</b></span><span>Fibre <b>{round(food.fibreDM, 1)}%</b></span><span>Ash <b>{round(food.ashDM, 1)}%</b></span><span>Carbohydrate <b>{round(food.carbDM, 1)}%</b></span></div></details></div></>}

      {tab === "daily" && <><div className="panel inputs"><p className="eyebrow">Patient profile</p><h2>Daily energy requirement</h2><p className="hint">Choose the closest clinical or life-stage condition.</p><Segmented value={species} onChange={switchSpecies} /><NumberField label="Body weight" value={weight} onChange={setWeight} suffix="kg" /><label className="field"><span>Condition</span><select value={condition} onChange={(e) => setCondition(e.target.value)}>{Object.keys(factors[species]).map((item) => <option key={item}>{item}</option>)}</select></label><div className="food-link"><span>Using food energy</span><b>{round(food.kcal100, 1)} kcal / 100 g</b><button onClick={() => setTab("food")}>Edit food</button></div></div><div className="panel output"><p className="eyebrow">Daily estimate</p><h2>{species} feeding guide</h2><div className="primary-result coral"><span>Recommended feeding amount</span><strong>{round(daily.grams, 0)}</strong><small>grams / day</small><p>Based on an MER factor of {factors[species][condition]}× RER</p></div><div className="result-grid"><Result label="RER" value={round(daily.rer, 0)} unit="kcal/day" /><Result label="MER" value={round(daily.mer, 0)} unit="kcal/day" /></div><div className="range"><div><span>Lower estimate</span><b>{round(daily.grams * .5, 0)} g</b></div><div><span>Average</span><b>{round(daily.grams, 0)} g</b></div><div><span>Upper estimate</span><b>{round(daily.grams * 1.5, 0)} g</b></div></div></div></>}

      {tab === "lactation" && <><div className="panel inputs"><p className="eyebrow">Lactating patient</p><h2>Mother & litter details</h2><p className="hint">The available week range follows the workbook’s dog and cat tables.</p><Segmented value={lSpecies} onChange={switchLSpecies} /><NumberField label="Body weight" value={lWeight} onChange={setLWeight} suffix="kg" /><NumberField label="Number of offspring" value={offspring} onChange={(n) => setOffspring(Math.min(8, Math.max(1, Math.round(n))))} suffix="young" step="1" min="1" /><label className="field"><span>Lactation week</span><select value={week} onChange={(e) => setWeek(Number(e.target.value))}>{weekFactor[lSpecies].map((_, i) => <option key={i} value={i + 1}>Week {i + 1}</option>)}</select></label></div><div className="panel output"><p className="eyebrow">Lactation estimate</p><h2>Energy for mother & litter</h2><div className="primary-result coral"><span>Recommended feeding amount</span><strong>{round(lactation.grams, 0)}</strong><small>grams / day</small><p>{offspring} offspring · week {week}</p></div><div className="result-grid"><Result label="RER" value={round(lactation.rer, 0)} unit="kcal/day" /><Result label="Lactation MER" value={round(lactation.mer, 0)} unit="kcal/day" /></div><div className="range"><div><span>Lower estimate</span><b>{round(lactation.grams * .5, 0)} g</b></div><div><span>Average</span><b>{round(lactation.grams, 0)} g</b></div><div><span>Upper estimate</span><b>{round(lactation.grams * 1.5, 0)} g</b></div></div></div></>}
    </section>
    <footer><div className="notice"><b>Clinical note</b><p>RER, MER and feeding amounts are estimates and may vary by ±50%. Use clinical judgement, monitor body condition, and adjust for the individual patient.</p></div><span>Based on the supplied Caloric Distribution Calculator workbook.</span></footer>
  </main>;
}
