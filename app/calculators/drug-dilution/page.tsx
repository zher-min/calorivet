import DrugDilutionCalculator from "../../../calculators/drug-dilution/DrugDilutionCalculator";
import { getCalculator } from "../../../config/calculators";

const calculator = getCalculator("drug-dilution");
export const metadata = { title: `${calculator.name} | VetTools`, description: calculator.homeDescription };

export default function DrugDilutionPage() {
  return <main className="toolkit-workspace dd-page">
    <div className="toolkit-intro"><h1>Drug Dilution</h1></div>
    <DrugDilutionCalculator />
  </main>;
}
