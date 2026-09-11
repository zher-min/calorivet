import Link from "next/link";
import type { Calculator } from "../../config/calculators";

export default function CalculatorCard({ calculator }: { calculator: Calculator }) {
  const isTool = 'kind' in calculator && calculator.kind === 'tool';
  return <Link className="toolkit-card" href={calculator.route} aria-label={`Open ${calculator.brand} ${isTool ? 'tool' : 'calculator'}`}>
    <p className="toolkit-category">{calculator.category}</p>
    <h2>{calculator.brand}</h2>
    <p className="toolkit-subtitle">{calculator.id === "calorie" ? calculator.name : calculator.shortName}</p>
    <p>{calculator.homeDescription}</p>
    <span className="toolkit-open">{isTool ? 'Open Tool' : 'Open Calculator'} <span aria-hidden="true">→</span></span>
  </Link>;
}
