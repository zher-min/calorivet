"use client";

import { useMemo, useState } from "react";
import styles from "./simple.module.css";

type Species = "Dog" | "Cat";

const factors: Record<Species, Record<string, number>> = {
  Dog: {
    "Typical intact pet": 1.8,
    "Typical neutered pet": 1.6,
    "Obese prone": 1.4,
    "Weight loss": 1,
    "Weight gain (intact)": 1.8,
    "Weight gain (neutered)": 1.6,
    "Working - light": 2,
    "Working - moderate": 3,
    "Working - heavy": 6,
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

const weekFactors: Record<Species, number[]> = {
  Dog: [0.75, 0.95, 1.1, 1.2],
  Cat: [0.9, 0.9, 1.2, 1.2, 1.1, 1, 0.8],
};

const format = (value: number, digits = 1) =>
  Number.isFinite(value) ? value.toFixed(digits) : "-";

function Field({ label, value, onChange, suffix }: { label: string; value: number; onChange: (value: number) => void; suffix: string }) {
  return (
    <label className={styles.field}>
      <span>{label}</span>
      <div><input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))} /><small>{suffix}</small></div>
    </label>
  );
}

export default function SimpleCalculator() {
  const [moisture, setMoisture] = useState(8.5);
  const [protein, setProtein] = useState(34);
  const [fat, setFat] = useState(16);
  const [fibre, setFibre] = useState(2.8);
  const [ash, setAsh] = useState(8);
  const [species, setSpecies] = useState<Species>("Dog");
  const [weight, setWeight] = useState(36.6);
  const [condition, setCondition] = useState("Weight loss");
  const [lactationSpecies, setLactationSpecies] = useState<Species>("Dog");
  const [lactationWeight, setLactationWeight] = useState(5);
  const [offspring, setOffspring] = useState(5);
  const [week, setWeek] = useState(1);

  const food = useMemo(() => {
    const carbohydrate = 100 - moisture - protein - fat - fibre - ash;
    const kcal100 = protein * 3.5 + fat * 8.5 + carbohydrate * 3.5;
    return { carbohydrate, kcal100 };
  }, [moisture, protein, fat, fibre, ash]);

  const daily = useMemo(() => {
    const rer = 70 * Math.pow(weight, 0.75);
    const mer = rer * factors[species][condition];
    const grams = food.kcal100 > 0 ? mer / (food.kcal100 / 100) : 0;
    return { rer, mer, grams };
  }, [weight, species, condition, food.kcal100]);

  const lactation = useMemo(() => {
    const rer = 70 * Math.pow(lactationWeight, 0.75);
    const n = offspringEnergy[lactationSpecies][offspring - 1];
    const l = weekFactors[lactationSpecies][week - 1];
    const mer = lactationSpecies === "Dog"
      ? (145 / 70) * rer + n * lactationWeight * l
      : 100 * Math.pow(lactationWeight, 0.67) + n * lactationWeight * l;
    const grams = food.kcal100 > 0 ? mer / (food.kcal100 / 100) : 0;
    return { rer, mer, grams };
  }, [lactationSpecies, lactationWeight, offspring, week, food.kcal100]);

  const invalid = food.carbohydrate < 0 || moisture >= 100;

  function changeSpecies(next: Species) {
    setSpecies(next);
    setCondition(Object.keys(factors[next])[0]);
  }

  function changeLactationSpecies(next: Species) {
    setLactationSpecies(next);
    setWeek(1);
  }

  return (
    <main className={styles.page}>
      <h1>Pet Calorie Calculator</h1>
      <p className={styles.intro}>Enter the values below. Results update automatically.</p>

      <section>
        <h2>1. Food analysis</h2>
        <div className={styles.grid}>
          <div>
            <Field label="Moisture" value={moisture} onChange={setMoisture} suffix="%" />
            <Field label="Crude protein" value={protein} onChange={setProtein} suffix="%" />
            <Field label="Crude fat" value={fat} onChange={setFat} suffix="%" />
            <Field label="Crude fibre" value={fibre} onChange={setFibre} suffix="%" />
            <Field label="Ash" value={ash} onChange={setAsh} suffix="%" />
          </div>
          <div className={styles.results}>
            {invalid ? <p className={styles.error}>Nutrient values cannot total more than 100%.</p> : <>
              <p><span>Carbohydrate</span><strong>{format(food.carbohydrate)}%</strong></p>
              <p><span>Calories</span><strong>{format(food.kcal100)} kcal/100 g</strong></p>
              <p><span>Calories per kg</span><strong>{format(food.kcal100 * 10, 0)} kcal</strong></p>
            </>}
          </div>
        </div>
      </section>

      <section>
        <h2>2. Daily feeding</h2>
        <div className={styles.grid}>
          <div>
            <label className={styles.field}><span>Species</span><select value={species} onChange={(event) => changeSpecies(event.target.value as Species)}><option>Dog</option><option>Cat</option></select></label>
            <Field label="Body weight" value={weight} onChange={setWeight} suffix="kg" />
            <label className={styles.field}><span>Condition</span><select value={condition} onChange={(event) => setCondition(event.target.value)}>{Object.keys(factors[species]).map((item) => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className={styles.results}>
            <p><span>RER</span><strong>{format(daily.rer, 0)} kcal/day</strong></p>
            <p><span>MER</span><strong>{format(daily.mer, 0)} kcal/day</strong></p>
            <p><span>Food per day</span><strong>{invalid ? "-" : `${format(daily.grams, 0)} g`}</strong></p>
          </div>
        </div>
      </section>

      <section>
        <h2>3. Lactation</h2>
        <div className={styles.grid}>
          <div>
            <label className={styles.field}><span>Species</span><select value={lactationSpecies} onChange={(event) => changeLactationSpecies(event.target.value as Species)}><option>Dog</option><option>Cat</option></select></label>
            <Field label="Body weight" value={lactationWeight} onChange={setLactationWeight} suffix="kg" />
            <label className={styles.field}><span>Number of offspring</span><select value={offspring} onChange={(event) => setOffspring(Number(event.target.value))}>{offspringEnergy[lactationSpecies].map((_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}</select></label>
            <label className={styles.field}><span>Week</span><select value={week} onChange={(event) => setWeek(Number(event.target.value))}>{weekFactors[lactationSpecies].map((_, index) => <option key={index} value={index + 1}>Week {index + 1}</option>)}</select></label>
          </div>
          <div className={styles.results}>
            <p><span>RER</span><strong>{format(lactation.rer, 0)} kcal/day</strong></p>
            <p><span>MER</span><strong>{format(lactation.mer, 0)} kcal/day</strong></p>
            <p><span>Food per day</span><strong>{invalid ? "-" : `${format(lactation.grams, 0)} g`}</strong></p>
          </div>
        </div>
      </section>

      <p className={styles.note}>These are estimates. Monitor the individual patient and adjust using clinical judgement.</p>
      <a className={styles.back} href="/">View the polished version</a>
    </main>
  );
}
