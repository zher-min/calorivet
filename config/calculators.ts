export const calculatorCategories = [
  {
    id: "emergency", name: "Emergency & Critical Care", calculators: [{
      id: "emergency", brand: "Emergency Drug Calculator", name: "Emergency Drug Calculator", shortName: "Emergency", emoji: "🚨",
      route: "/calculators/emergency",
      description: "Weight-based crash-sheet drug and treatment calculations", homeDescription: "Calculate RECOVER CPR drugs and common emergency treatment doses from one patient weight.", species: ["dog", "cat"], status: "active",
    }],
  },
  {
    id: "transfusion", name: "Emergency & Critical Care", calculators: [{
      id: "transfusion", brand: "Blood Transfusion", name: "Blood Transfusion Calculator", shortName: "Transfusion", emoji: "🩸",
      route: "/calculators/transfusion",
      description: "Transfusion volume and whole-blood donor requirements", homeDescription: "Estimate transfusion volume, minimum whole-blood donor weight and donor collection capacity for dogs and cats.", species: ["dog", "cat"], status: "active",
    }],
  },
  {
    id: "pharmacology", name: "Drug Calculations", calculators: [{
      id: "cri", brand: "Constant Rate Infusion", name: "Constant Rate Infusion Calculator", shortName: "CRI", emoji: "💉", route: "/calculators/cri",
      description: "Calculate stock-drug volumes for fluid bags and syringe pumps", homeDescription: "Calculate how much stock drug to add for a prescribed constant rate infusion.", species: [], status: "active",
    }, {
      id: "drug-dilution", brand: "Drug Dilution", name: "Drug Dilution Calculator", shortName: "Dilution", emoji: "🧪", route: "/calculators/drug-dilution",
      description: "Calculate and verify drug dilutions across common concentration units", homeDescription: "Prepare and verify drug dilutions, specific doses and percentage concentrations.", species: [], status: "active",
    }],
  },
  {
    id: "nutrition", name: "Nutrition & Preventive Care", calculators: [{
      id: "calorie", brand: "Calorie & Feeding Calculator", name: "Calorie & Feeding Calculator", shortName: "Calories", emoji: "🍖", route: "/calculators/calorie",
      description: "Energy requirements, feeding amounts and weight-management calculations",
      homeDescription: "Estimate energy requirements, calculate feeding quantities and support weight-management planning for dogs and cats.",
      species: ["dog", "cat"], status: "active",
    }],
  },
  {
    id: "parasite", name: "Parasite Prevention", calculators: [{
      id: "parasite", brand: "Parasite Selector", name: "Parasite Selector", emoji: "🪱",
      shortName: "Parasites", route: "/calculators/parasite",
      description: "Find protection and compare clinic products",
      homeDescription: "Compare parasite coverage and help select appropriate preventative products. Prototype with unverified product-label data.",
      species: ["dog", "cat"], status: "prototype", kind: "tool",
    }],
  },
  {
    id: "clinical-utilities", name: "Clinical Utilities", calculators: [
      {
        id: "tap-rate", brand: "Quick BPM", name: "Quick BPM", emoji: "🫁",
        shortName: "Quick BPM", route: "/calculators/tap-rate",
        description: "Tap repeatedly to measure events per minute",
        homeDescription: "Measure a repeated event rate per minute with a simple tap interface.",
        species: [], status: "active", kind: "tool",
      },
      {
        id: "bsa", brand: "Body Surface Area Calculator", name: "Body Surface Area Calculator", emoji: "📐",
        shortName: "BSA", route: "/calculators/bsa",
        description: "Calculate body surface area from body weight",
        homeDescription: "Calculate veterinary body surface area for dogs and cats from body weight.",
        species: ["dog", "cat"], status: "active",
      },
      {
        id: "urine-output", brand: "Urine Output Calculator", name: "Urine Output Calculator", emoji: "🚽",
        shortName: "Urine Output", route: "/calculators/urine-output",
        description: "Calculate urine output from volume, weight and collection time",
        homeDescription: "Calculate urine output in mL/kg/hr for hospitalized patient monitoring.",
        species: [], status: "active",
      },
      {
        id: "pill-counter", brand: "Pill Counter", name: "Pill Counter", emoji: "💊",
        shortName: "Pill Counter", route: "/calculators/pill-counter",
        description: "Count tablets and capsules from a photo with editable markers",
        homeDescription: "Detect and verify individual tablets or capsules locally in your browser.",
        species: [], status: "prototype", kind: "tool",
      },
      {
        id: "fetal-age", brand: "Ultrasound Fetal Age Calculator", name: "Ultrasound Fetal Age Calculator", shortName: "Fetal Age", emoji: "🐣", route: "/calculators/fetal-age",
        description: "Estimate gestational stage from ultrasound fetometry", homeDescription: "Estimate gestational age and approximate parturition timing from canine and feline ultrasound measurements.", species: ["dog", "cat"], status: "prototype", kind: "tool",
      },
    ],
  },
] as const;

export const calculators = calculatorCategories.flatMap(category => category.calculators.map(calculator => ({ ...calculator, category: category.name })));
export type Calculator = (typeof calculators)[number];
export function getCalculator(id: string) {
  const calculator = calculators.find(item => item.id === id);
  if (!calculator) throw new Error(`Unknown calculator: ${id}`);
  return calculator;
}
