export const calculatorCategories = [
  {
    id: "nutrition", name: "Nutrition", calculators: [{
      id: "calorie", brand: "CaloriVet", name: "Calorie & Feeding Calculator",
      shortName: "Calorie & Feeding", route: "/calculators/calorie",
      description: "Energy requirements, feeding amounts and weight-management calculations",
      homeDescription: "Estimate energy requirements, calculate feeding quantities and support weight-management planning for dogs and cats.",
      species: ["dog", "cat"], status: "active",
    }],
  },
  {
    id: "transfusion", name: "Transfusion Medicine", calculators: [{
      id: "transfusion", brand: "Blood Transfusion", name: "Blood Transfusion Calculator",
      shortName: "Dogs & Cats", route: "/calculators/transfusion",
      description: "Transfusion volume and whole-blood donor requirements",
      homeDescription: "Estimate transfusion volume, minimum whole-blood donor weight and donor collection capacity for dogs and cats.",
      species: ["dog", "cat"], status: "active",
    }],
  },
  {
    id: "parasite", name: "Parasite Prevention", calculators: [{
      id: "parasite", brand: "Parasite Selector", name: "Parasite Selector",
      shortName: "Dogs & Cats", route: "/calculators/parasite",
      description: "Find protection and compare clinic products",
      homeDescription: "Compare parasite coverage and help select appropriate preventative products. Prototype with unverified product-label data.",
      species: ["dog", "cat"], status: "prototype", kind: "tool",
    }],
  },
  {
    id: "clinical-utilities", name: "Clinical Utilities", calculators: [
      {
        id: "tap-rate", brand: "Tap Rate", name: "Tap Rate",
        shortName: "Rate per minute", route: "/calculators/tap-rate",
        description: "Tap repeatedly to measure events per minute",
        homeDescription: "Measure a repeated event rate per minute with a simple tap interface.",
        species: [], status: "active", kind: "tool",
      },
      {
        id: "bsa", brand: "Body Surface Area", name: "Body Surface Area Calculator",
        shortName: "Dogs & Cats", route: "/calculators/bsa",
        description: "Calculate body surface area from body weight",
        homeDescription: "Calculate veterinary body surface area for dogs and cats from body weight.",
        species: ["dog", "cat"], status: "active",
      },
      {
        id: "pill-counter", brand: "Pill Counter", name: "Pill Counter",
        shortName: "Tablet counting", route: "/calculators/pill-counter",
        description: "Count tablets and capsules from a photo with editable markers",
        homeDescription: "Detect and verify individual tablets or capsules locally in your browser.",
        species: [], status: "prototype", kind: "tool",
      },
    ],
  },
  {
    id: "pharmacology", name: "Pharmacology", calculators: [{
      id: "cri", brand: "Constant Rate Infusion", name: "Constant Rate Infusion (CRI)",
      shortName: "CRI preparation", route: "/calculators/cri",
      description: "Calculate stock-drug volumes for fluid bags and syringe pumps",
      homeDescription: "Calculate how much stock drug to add for a prescribed constant rate infusion.",
      species: [], status: "active",
    }],
  },
  {
    id: "emergency", name: "Emergency & Critical Care", calculators: [{
      id: "emergency", brand: "Emergency Drug Calculator", name: "Emergency Drug Calculator",
      shortName: "RECOVER CPR & emergency treatments", route: "/calculators/emergency",
      description: "Weight-based crash-sheet drug and treatment calculations",
      homeDescription: "Calculate RECOVER CPR drugs and common emergency treatment doses from one patient weight.",
      species: ["dog", "cat"], status: "active",
    }],
  },
] as const;

export const calculators = calculatorCategories.flatMap(category => category.calculators.map(calculator => ({ ...calculator, category: category.name })));
export type Calculator = (typeof calculators)[number];
export function getCalculator(id: string) {
  const calculator = calculators.find(item => item.id === id);
  if (!calculator) throw new Error(`Unknown calculator: ${id}`);
  return calculator;
}
