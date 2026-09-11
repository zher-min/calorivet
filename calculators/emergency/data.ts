import type { ConcentrationDefinition, EmergencyCategory, EmergencyTreatment, TreatmentTooltip } from "./types";

const generalTooltip = (use: string, practical: string): TreatmentTooltip => ({
  use,
  action: "Provides the stated emergency treatment effect when clinically indicated.",
  caution: "Confirm indication, dose, concentration, route and patient-specific contraindications.",
  practical,
});

export const concentrationDefinitions: ConcentrationDefinition[] = [
  { key: "epinephrine", drugName: "Epinephrine", referenceValue: 1, unit: "mg/mL" },
  { key: "vasopressin", drugName: "Vasopressin", referenceValue: 20, unit: "U/mL" },
  { key: "atropine", drugName: "Atropine", referenceValue: null, unit: "mg/mL" },
  { key: "lidocaine", drugName: "Lidocaine", referenceValue: 20, unit: "mg/mL" },
  { key: "amiodarone", drugName: "Amiodarone", referenceValue: 50, unit: "mg/mL" },
  { key: "esmolol", drugName: "Esmolol", referenceValue: 10, unit: "mg/mL" },
  { key: "naloxone", drugName: "Naloxone", referenceValue: 0.4, unit: "mg/mL" },
  { key: "flumazenil", drugName: "Flumazenil", referenceValue: 0.1, unit: "mg/mL" },
  { key: "atipamezole", drugName: "Atipamezole", referenceValue: 5, unit: "mg/mL" },
  { key: "regular-insulin", drugName: "Regular insulin", referenceValue: 100, unit: "U/mL" },
  { key: "dextrose", drugName: "Dextrose", referenceValue: 50, unit: "%" },
  { key: "midazolam", drugName: "Midazolam", referenceValue: 5, unit: "mg/mL" },
  { key: "diazepam", drugName: "Diazepam", referenceValue: null, unit: "mg/mL" },
  { key: "phenobarbital", drugName: "Phenobarbital", referenceValue: null, unit: "mg/mL" },
  { key: "levetiracetam", drugName: "Levetiracetam", referenceValue: null, unit: "mg/mL" },
  { key: "furosemide", drugName: "Furosemide", referenceValue: 10, unit: "mg/mL" },
  { key: "mannitol", drugName: "Mannitol", referenceValue: 20, unit: "%" },
  { key: "fentanyl", drugName: "Fentanyl", referenceValue: 50, unit: "mcg/mL" },
  { key: "methadone", drugName: "Methadone", referenceValue: null, unit: "mg/mL" },
  { key: "n-acetylcysteine", drugName: "N-acetylcysteine", referenceValue: null, unit: "mg/mL" },
  { key: "fomepizole", drugName: "Fomepizole", referenceValue: null, unit: "mg/mL" },
  { key: "methocarbamol", drugName: "Methocarbamol", referenceValue: null, unit: "mg/mL" },
];

const recoverReference = { reference: "RECOVER CPR recommendations", referenceYear: 2024 };

export const recoverTreatments: EmergencyTreatment[] = [
  {
    id: "cpr-epinephrine", drugName: "Epinephrine", indication: "RECOVER CPR", species: ["dog", "cat"], concentrationKey: "epinephrine", dominant: true,
    doseOptions: [{ id: "iv-io", label: "IV/IO", doseMin: 0.01, doseUnit: "mg/kg", route: "IV/IO", administration: "Repeat approximately every 3–5 minutes when indicated." }],
    tooltip: generalTooltip("Vasopressor treatment during CPR.", "Repeat according to the current CPR cycle and guideline when indicated."), note: "Repeat approximately every 3–5 minutes when indicated.", ...recoverReference,
  },
  {
    id: "cpr-vasopressin", drugName: "Vasopressin", indication: "RECOVER CPR", species: ["dog", "cat"], concentrationKey: "vasopressin",
    doseOptions: [{ id: "iv-io", label: "IV/IO", doseMin: 0.8, doseUnit: "U/kg", route: "IV/IO" }],
    tooltip: generalTooltip("Alternative vasopressor during CPR when clinically indicated.", "Verify the vial is labelled in units per mL."), ...recoverReference,
  },
  {
    id: "cpr-atropine", drugName: "Atropine", indication: "RECOVER CPR", species: ["dog", "cat"], concentrationKey: "atropine",
    doseOptions: [{ id: "iv-io", label: "IV/IO", doseMin: 0.04, doseMax: 0.054, doseUnit: "mg/kg", route: "IV/IO" }],
    tooltip: generalTooltip("Early CPR administration when clinically indicated.", "Enter the concentration printed on the clinic stock before using the volume."),
    note: "Current RECOVER guidance supports early administration when clinically indicated rather than repeated routine administration throughout CPR.", ...recoverReference,
  },
  {
    id: "cpr-lidocaine", drugName: "Lidocaine", indication: "Refractory VF / pulseless VT", species: ["dog"], concentrationKey: "lidocaine",
    doseOptions: [{ id: "iv-io", label: "Dog · IV/IO", doseMin: 2, doseUnit: "mg/kg", route: "IV/IO", administration: "Approximately 2–4 minutes when used for refractory VF/pVT." }],
    tooltip: generalTooltip("Refractory VF/pVT in dogs.", "Use at the indicated CPR timing and confirm species before administration."), ...recoverReference,
  },
  {
    id: "cpr-amiodarone", drugName: "Amiodarone", indication: "Refractory VF / pulseless VT", species: ["cat"], concentrationKey: "amiodarone",
    doseOptions: [{ id: "iv-io", label: "Cat · IV/IO", doseMin: 5, doseUnit: "mg/kg", route: "IV/IO", administration: "Approximately 2–4 minutes." }],
    tooltip: generalTooltip("Refractory VF/pVT in cats.", "Use at the indicated CPR timing and verify the actual stock concentration."), ...recoverReference,
  },
  {
    id: "cpr-esmolol", drugName: "Esmolol", indication: "Refractory VF / pulseless VT", species: ["dog", "cat"], concentrationKey: "esmolol",
    doseOptions: [{ id: "iv", label: "IV", doseMin: 0.5, doseUnit: "mg/kg", route: "IV", administration: "Approximately 3–5 minutes when indicated." }],
    tooltip: generalTooltip("Refractory VF/pVT when clinically indicated.", "Confirm the current CPR recommendation and patient rhythm before use."), ...recoverReference,
  },
  {
    id: "cpr-naloxone", drugName: "Naloxone", indication: "CPR reversal drug", species: ["dog", "cat"], concentrationKey: "naloxone",
    doseOptions: [{ id: "reversal", label: "Reversal", doseMin: 0.04, doseUnit: "mg/kg", route: "Per protocol" }],
    tooltip: generalTooltip("Opioid reversal during resuscitation when relevant.", "Confirm suspected opioid exposure and the intended route."), ...recoverReference,
  },
  {
    id: "cpr-flumazenil", drugName: "Flumazenil", indication: "CPR reversal drug", species: ["dog", "cat"], concentrationKey: "flumazenil",
    doseOptions: [{ id: "reversal", label: "Reversal", doseMin: 0.01, doseUnit: "mg/kg", route: "Per protocol" }],
    tooltip: generalTooltip("Benzodiazepine reversal during resuscitation when relevant.", "Confirm exposure, indication and patient seizure risk."), ...recoverReference,
  },
  {
    id: "cpr-atipamezole", drugName: "Atipamezole", indication: "CPR reversal drug", species: ["dog", "cat"], concentrationKey: "atipamezole",
    doseOptions: [{ id: "reversal", label: "Reversal", doseMin: 100, doseUnit: "mcg/kg", route: "Per protocol" }],
    tooltip: generalTooltip("Alpha-2 agonist reversal during resuscitation when relevant.", "The dose is in micrograms while the reference concentration is in mg/mL; verify both units."), ...recoverReference,
  },
];

export const defibrillationTreatments: EmergencyTreatment[] = [
  {
    id: "defib-biphasic", drugName: "Biphasic external", indication: "Defibrillation", species: ["dog", "cat"], displayAllOptions: true,
    doseOptions: [{ id: "initial", label: "Initial shock", doseMin: 2, doseMax: 4, doseUnit: "J/kg", route: "External" }],
    tooltip: generalTooltip("External defibrillation during a shockable arrest rhythm.", "Confirm defibrillator type, pad contact and current RECOVER sequence."),
    note: "If unsuccessful: approximately 4 J/kg or twice the initially selected energy, according to the applicable RECOVER recommendation.", ...recoverReference,
  },
  {
    id: "defib-monophasic", drugName: "Monophasic external", indication: "Defibrillation", species: ["dog", "cat"], displayAllOptions: true,
    doseOptions: [{ id: "shock", label: "Shock", doseMin: 4, doseMax: 6, doseUnit: "J/kg", route: "External" }],
    tooltip: generalTooltip("External defibrillation using a monophasic device.", "Verify device waveform and follow the current CPR sequence."), ...recoverReference,
  },
];

const calciumTooltip: TreatmentTooltip = {
  use: "Cardiac stabilization in severe hyperkalemia or treatment of symptomatic hypocalcemia.",
  action: "Increases extracellular calcium and stabilizes myocardial membranes.",
  caution: "Does not lower serum potassium.",
  practical: "Administer slowly with ECG monitoring.",
};
const insulinTooltip: TreatmentTooltip = {
  use: "Temporarily reduces serum potassium.", action: "Drives potassium intracellularly.",
  caution: "Can cause severe hypoglycemia.", practical: "Pair with dextrose where indicated and monitor glucose and potassium.",
};
const furosemideTooltip: TreatmentTooltip = {
  use: "Cardiogenic pulmonary edema.", action: "Loop diuretic.",
  caution: "May worsen dehydration, hypovolemia, renal perfusion, or electrolyte abnormalities.",
  practical: "Do not administer reflexively for respiratory distress unless cardiogenic edema is suspected.",
};

export const emergencyCategories: EmergencyCategory[] = [
  { id: "hyperkalemia", name: "Hyperkalemia", treatments: [
    { id: "hk-calcium", drugName: "Calcium gluconate 10%", indication: "Hyperkalemia", species: ["dog", "cat"], fixedFormulation: "10%",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.5, doseMax: 1.5, doseUnit: "mL/kg", route: "IV", administration: "Approximately 15–30 minutes." }], tooltip: calciumTooltip,
      warnings: [{ level: "caution", text: "Cardiac membrane stabilization only. Does not lower serum potassium. ECG monitoring recommended." }] },
    { id: "hk-insulin", drugName: "Regular insulin", indication: "Hyperkalemia", species: ["dog", "cat"], concentrationKey: "regular-insulin",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.25, doseMax: 0.5, doseUnit: "U/kg", route: "IV" }], tooltip: insulinTooltip,
      warnings: [{ level: "warning", text: "Administer with dextrose unless clinically inappropriate. Monitor blood glucose and potassium." }] },
    { id: "hk-dextrose", drugName: "Dextrose", indication: "Hyperkalemia", species: ["dog", "cat"], concentrationKey: "dextrose",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.25, doseMax: 0.5, doseUnit: "g/kg", route: "IV" }], tooltip: generalTooltip("Dextrose support accompanying insulin therapy where indicated.", "Choose dilution deliberately and monitor blood glucose."), note: "Equivalent to 0.5–1 mL/kg when using 50% dextrose." },
  ]},
  { id: "hypoglycemia", name: "Hypoglycemia", treatments: [
    { id: "hypoglycemia-dextrose", drugName: "Dextrose", indication: "Hypoglycemia", species: ["dog", "cat"], concentrationKey: "dextrose",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.25, doseMax: 0.5, doseUnit: "g/kg", route: "IV" }], tooltip: generalTooltip("Emergency glucose replacement in hypoglycemia.", "Dilution before IV administration is generally appropriate; monitor response."),
      note: "Equivalent to 0.5–1 mL/kg of 50% dextrose. Dilution before IV administration is generally appropriate, and ongoing dextrose supplementation may subsequently be required." },
  ]},
  { id: "hypocalcemia", name: "Hypocalcemia", treatments: [
    { id: "hypocalcemia-calcium", drugName: "Calcium gluconate 10%", indication: "Symptomatic hypocalcemia", species: ["dog", "cat"], fixedFormulation: "10%",
      doseOptions: [{ id: "slow-iv", label: "Slow IV", doseMin: 0.5, doseMax: 1.5, doseUnit: "mL/kg", route: "Slow IV" }], tooltip: calciumTooltip,
      note: "Equivalent approximately to 5–15 mg/kg elemental calcium.", warnings: [{ level: "warning", text: "Administer slowly with ECG monitoring. Reduce or stop administration if significant bradycardia or arrhythmia develops." }] },
  ]},
  { id: "seizures", name: "Seizures / Status Epilepticus", treatments: [
    { id: "seizure-midazolam", drugName: "Midazolam", indication: "First-line seizure treatment", species: ["dog", "cat"], concentrationKey: "midazolam",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.1, doseMax: 0.25, doseUnit: "mg/kg", route: "IV" }, { id: "in", label: "Intranasal", doseMin: 0.2, doseUnit: "mg/kg", route: "IN" }],
      tooltip: generalTooltip("First-line treatment for active seizures/status epilepticus.", "Select the intended route before reading the calculated volume.") },
    { id: "seizure-diazepam", drugName: "Diazepam", indication: "First-line seizure treatment", species: ["dog", "cat"], concentrationKey: "diazepam",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.5, doseUnit: "mg/kg", route: "IV" }, { id: "rectal", label: "Rectal", doseMin: 1, doseMax: 2, doseUnit: "mg/kg", route: "Rectal" }],
      tooltip: generalTooltip("Treatment for active seizures/status epilepticus.", "Select IV or rectal administration and enter the actual stock concentration.") },
    { id: "seizure-midazolam-cri", drugName: "Midazolam CRI", indication: "Ongoing seizure control", species: ["dog", "cat"], concentrationKey: "midazolam",
      doseOptions: [{ id: "cri", label: "CRI", doseMin: 0.25, doseMax: 0.4, doseUnit: "mg/kg/hr", route: "IV CRI" }],
      tooltip: generalTooltip("Ongoing seizure control after initial stabilization.", "The displayed mL/hr uses the entered solution concentration; use a prepared-solution concentration if diluted."),
      note: "If using a diluted preparation, enter the final prepared solution concentration rather than the stock-vial concentration." },
    { id: "seizure-phenobarbital", drugName: "Phenobarbital", indication: "Additional antiseizure therapy", species: ["dog", "cat"], concentrationKey: "phenobarbital", cumulativeMaxMgKg: 20,
      doseOptions: [{ id: "loading", label: "Loading dose", doseMin: 4, doseMax: 6, doseUnit: "mg/kg", route: "IV" }],
      tooltip: generalTooltip("Additional loading therapy for ongoing seizures.", "Track every loading dose and reassess before further administration."), note: "Typical cumulative loading ceiling: 20 mg/kg." },
    { id: "seizure-levetiracetam", drugName: "Levetiracetam", indication: "Additional antiseizure therapy", species: ["dog", "cat"], concentrationKey: "levetiracetam",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 30, doseMax: 60, doseUnit: "mg/kg", route: "IV", administration: "Approximately 5–15 minutes." }],
      tooltip: generalTooltip("Additional treatment for status epilepticus.", "Administer over the stated interval and enter the actual product concentration.") },
  ]},
  { id: "anaphylaxis", name: "Anaphylaxis", treatments: [
    { id: "anaphylaxis-epinephrine", drugName: "Epinephrine", indication: "Anaphylaxis", species: ["dog", "cat"], concentrationKey: "epinephrine", dominant: true,
      doseOptions: [{ id: "im", label: "IM", doseMin: 0.01, doseUnit: "mg/kg", route: "IM", administration: "May repeat approximately every 5–15 minutes when clinically indicated." }],
      tooltip: generalTooltip("First-line treatment for anaphylaxis.", "Confirm the epinephrine concentration carefully before administration."), note: "May repeat approximately every 5–15 minutes when clinically indicated." },
  ]},
  { id: "pulmonary-edema", name: "Cardiogenic Pulmonary Edema", treatments: [
    { id: "pulmonary-furosemide", drugName: "Furosemide", indication: "Cardiogenic pulmonary edema", species: ["dog", "cat"], concentrationKey: "furosemide", displayAllOptions: true,
      doseOptions: [
        { id: "dog-bolus", label: "Bolus", species: ["dog"], doseMin: 2, doseMax: 4, doseUnit: "mg/kg", route: "IV/IM" },
        { id: "dog-cri", label: "CRI", species: ["dog"], doseMin: 0.25, doseMax: 1, doseUnit: "mg/kg/hr", route: "IV CRI" },
        { id: "cat-bolus", label: "Bolus", species: ["cat"], doseMin: 0.5, doseMax: 2, doseUnit: "mg/kg", route: "IV/IM" },
        { id: "cat-cri", label: "CRI", species: ["cat"], doseMin: 0.25, doseMax: 0.6, doseUnit: "mg/kg/hr", route: "IV CRI" },
      ], tooltip: furosemideTooltip },
  ]},
  { id: "tbi", name: "Raised Intracranial Pressure / TBI", treatments: [
    { id: "tbi-mannitol", drugName: "Mannitol", indication: "Raised intracranial pressure / TBI", species: ["dog", "cat"], concentrationKey: "mannitol",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.5, doseMax: 1, doseUnit: "g/kg", route: "IV", administration: "Approximately 15 minutes." }],
      tooltip: { use: "Osmotherapy for suspected raised ICP.", action: "Creates an osmotic gradient that draws water from cerebral tissue.", caution: "Use cautiously in severe hypovolemia/dehydration.", practical: "Inspect for crystallization and use an appropriate filter." } },
    { id: "tbi-hts", drugName: "Hypertonic saline 7.2%", indication: "Raised intracranial pressure / TBI", species: ["dog", "cat"], fixedFormulation: "7.2%",
      doseOptions: [{ id: "general", label: "General", doseMin: 1, doseMax: 6, doseUnit: "mL/kg", route: "IV", administration: "Approximately 15 minutes." }, { id: "tbi", label: "TBI preset", doseMin: 3, doseMax: 4, doseUnit: "mL/kg", route: "IV", administration: "Approximately 15 minutes." }],
      tooltip: generalTooltip("Hypertonic therapy for selected patients with raised ICP/TBI.", "The stated mL/kg dose is tied to 7.2% saline; do not substitute another concentration directly.") },
  ]},
  { id: "shock", name: "Hypovolemic Shock", treatments: [
    { id: "shock-crystalloid", drugName: "Balanced isotonic crystalloid", indication: "Hypovolemic shock", species: ["dog", "cat"],
      doseOptions: [{ id: "dog", label: "Dog aliquot", species: ["dog"], doseMin: 15, doseMax: 20, doseUnit: "mL/kg", route: "IV", administration: "Approximately over 15–30 minutes." }, { id: "cat", label: "Cat aliquot", species: ["cat"], doseMin: 5, doseMax: 10, doseUnit: "mL/kg", route: "IV", administration: "Approximately over 15–30 minutes." }],
      tooltip: generalTooltip("Aliquot-based resuscitation for hypovolemic shock.", "Give bolus, reassess perfusion, and repeat only if clinically indicated."), note: "Give bolus → reassess → repeat if clinically indicated." },
  ]},
  { id: "analgesia", name: "Emergency Analgesia", treatments: [
    { id: "analgesia-fentanyl", drugName: "Fentanyl", indication: "Emergency analgesia", species: ["dog", "cat"], concentrationKey: "fentanyl", displayAllOptions: true,
      doseOptions: [
        { id: "dog-bolus", label: "Bolus", species: ["dog"], doseMin: 2, doseMax: 10, doseUnit: "mcg/kg", route: "IV" },
        { id: "dog-cri", label: "CRI", species: ["dog"], doseMin: 2, doseMax: 20, doseUnit: "mcg/kg/hr", route: "IV CRI" },
        { id: "cat-bolus", label: "Bolus", species: ["cat"], doseMin: 2, doseMax: 5, doseUnit: "mcg/kg", route: "IV" },
        { id: "cat-cri", label: "CRI", species: ["cat"], doseMin: 2, doseMax: 5, doseUnit: "mcg/kg/hr", route: "IV CRI" },
      ], tooltip: generalTooltip("Potent opioid analgesia in selected emergency patients.", "Titrate to effect and monitor ventilation, cardiovascular status and sedation.") },
    { id: "analgesia-methadone", drugName: "Methadone", indication: "Emergency analgesia", species: ["dog", "cat"], concentrationKey: "methadone",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.1, doseMax: 0.5, doseUnit: "mg/kg", route: "IV" }, { id: "im", label: "IM", doseMin: 0.1, doseMax: 0.5, doseUnit: "mg/kg", route: "IM" }, { id: "sc", label: "SC", doseMin: 0.1, doseMax: 0.5, doseUnit: "mg/kg", route: "SC" }],
      tooltip: generalTooltip("Opioid analgesia in selected emergency patients.", "Select the intended route and monitor analgesic effect and adverse effects.") },
  ]},
  { id: "toxicology", name: "Toxicology / Antidotes", treatments: [
    { id: "tox-naloxone", drugName: "Naloxone", indication: "Opioid toxicity", species: ["dog", "cat"], concentrationKey: "naloxone",
      doseOptions: [{ id: "iv", label: "IV", doseMin: 0.01, doseMax: 0.04, doseUnit: "mg/kg", route: "IV" }, { id: "im-in", label: "IM/IN", doseMin: 0.04, doseMax: 0.16, doseUnit: "mg/kg", route: "IM/IN" }],
      tooltip: generalTooltip("Reversal of clinically important opioid effects.", "Select the intended route and reassess response after administration.") },
    { id: "tox-nac", drugName: "N-acetylcysteine", indication: "Acetaminophen toxicity", species: ["dog", "cat"], concentrationKey: "n-acetylcysteine", displayAllOptions: true,
      doseOptions: [{ id: "loading", label: "Loading", doseMin: 140, doseUnit: "mg/kg", route: "Per protocol" }, { id: "maintenance", label: "Then q6h", doseMin: 70, doseUnit: "mg/kg", route: "Per protocol" }],
      tooltip: generalTooltip("Antidotal treatment for acetaminophen toxicity.", "Calculate loading and maintenance doses separately and reassess the required course."), note: "Typical course: 5–7 additional doses depending on protocol; reassess rather than assuming every patient requires the full course." },
    { id: "tox-fomepizole", drugName: "Fomepizole", indication: "Ethylene glycol toxicity", species: ["dog", "cat"], concentrationKey: "fomepizole", displayAllOptions: true,
      doseOptions: [
        { id: "dog-0", label: "0 hr", species: ["dog"], doseMin: 20, doseUnit: "mg/kg", route: "IV" }, { id: "dog-12", label: "12 hr", species: ["dog"], doseMin: 15, doseUnit: "mg/kg", route: "IV" }, { id: "dog-24", label: "24 hr", species: ["dog"], doseMin: 15, doseUnit: "mg/kg", route: "IV" }, { id: "dog-36", label: "36 hr", species: ["dog"], doseMin: 5, doseUnit: "mg/kg", route: "IV" },
        { id: "cat-0", label: "0 hr", species: ["cat"], doseMin: 125, doseUnit: "mg/kg", route: "Per protocol" }, { id: "cat-12", label: "12 hr", species: ["cat"], doseMin: 31.3, doseUnit: "mg/kg", route: "Per protocol" }, { id: "cat-24", label: "24 hr", species: ["cat"], doseMin: 31.3, doseUnit: "mg/kg", route: "Per protocol" }, { id: "cat-36", label: "36 hr", species: ["cat"], doseMin: 31.3, doseUnit: "mg/kg", route: "Per protocol" },
      ], tooltip: generalTooltip("Scheduled antidotal therapy for ethylene glycol exposure.", "Calculate each scheduled dose separately and verify timing and protocol."), warnings: [{ level: "caution", text: "Feline fomepizole use is extra-label; follow the applicable current protocol." }] },
    { id: "tox-methocarbamol", drugName: "Methocarbamol", indication: "Tremorgenic / metaldehyde-type intoxication", species: ["dog", "cat"], concentrationKey: "methocarbamol", cumulativeMaxMgKg: 330,
      doseOptions: [{ id: "iv", label: "Slow IV to effect", doseMin: 55, doseMax: 220, doseUnit: "mg/kg", route: "Slow IV" }],
      tooltip: generalTooltip("Control of tremors in selected tremorgenic intoxications.", "Administer slowly to effect and track the complete 24-hour cumulative dose."), note: "Maximum: 330 mg/kg over 24 hours." },
    { id: "tox-ile", drugName: "Intravenous lipid emulsion 20%", indication: "Selected lipophilic toxins", species: ["dog", "cat"], fixedFormulation: "20%", displayAllOptions: true,
      doseOptions: [{ id: "bolus", label: "Bolus", doseMin: 1.5, doseMax: 4, doseUnit: "mL/kg", route: "IV" }, { id: "infusion", label: "Infusion", doseMin: 0.25, doseUnit: "mL/kg/min", route: "IV", administration: "Approximately 30–60 minutes.", durationMinutes: [30, 60] }],
      tooltip: generalTooltip("Adjunctive treatment for appropriate lipophilic toxins.", "The stated protocol is tied to 20% lipid emulsion; calculate bolus and infusion separately."), warnings: [{ level: "warning", text: "Use only for appropriate lipophilic toxins. Intravenous lipid emulsion is not a universal antidote." }] },
  ]},
];
