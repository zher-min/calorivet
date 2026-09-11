import CalculatorCard from "../components/calculators/CalculatorCard";
import { calculators } from "../config/calculators";
import InstallApp from "../components/layout/AppInstall";

export default function Home() {
  return <main className="toolkit-workspace">
    <div className="toolkit-intro"><h1>VetTools</h1><p className="toolkit-subtitle">Veterinary Clinical Calculators</p><p>Fast, practical calculators for veterinary clinical practice.</p></div>
    <div className="toolkit-grid">{calculators.map(calculator => <CalculatorCard key={calculator.id} calculator={calculator} />)}</div>
    <InstallApp />
  </main>;
}
