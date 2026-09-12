import UrineOutputCalculator from "../../../calculators/urine-output/UrineOutputCalculator";
import { getCalculator } from "../../../config/calculators";

const calculator = getCalculator("urine-output");
export const metadata = { title: `${calculator.name} | VetSlate`, description: calculator.homeDescription };

export default function UrineOutputPage() {
  return <main className="toolkit-workspace uo-page">
    <h1>Urine Output Calculator</h1>
    <UrineOutputCalculator />
  </main>;
}
