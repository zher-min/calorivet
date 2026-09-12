import BsaCalculator from "../../../calculators/bsa/BsaCalculator";
import { getCalculator } from "../../../config/calculators";

const calculator = getCalculator("bsa");
export const metadata = { title: `${calculator.name} | VetSlate`, description: calculator.homeDescription };

export default function BsaPage() {
  return <main className="toolkit-workspace bsa-page">
    <h1>Body Surface Area Calculator</h1>
    <BsaCalculator />
  </main>;
}
