import CriCalculator from "../../../calculators/cri/CriCalculator";
import { getCalculator } from "../../../config/calculators";

const calculator = getCalculator("cri");
export const metadata = { title: `${calculator.name} | VetSlate`, description: calculator.homeDescription };

export default function CriPage() {
  return <main className="toolkit-workspace cri-page">
    <div className="toolkit-intro"><h1>Constant Rate Infusion Calculator</h1></div>
    <CriCalculator />
  </main>;
}
