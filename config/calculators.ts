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
      description: "Recipient requirements, donor collection and transfusion planning",
      homeDescription: "Estimate recipient transfusion requirements, assess donor collection limits and support transfusion planning.",
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
