import Link from "next/link";
import type { Calculator } from "../../config/calculators";

export default function CalculatorCard({ calculator }: { calculator: Calculator }) {
  return <article className="toolkit-card">
    <p className="toolkit-category">{calculator.category}</p>
    <h2>{calculator.brand}</h2>
    <p className="toolkit-subtitle">{calculator.id === "calorie" ? calculator.name : calculator.shortName}</p>
    <p>{calculator.homeDescription}</p>
    <Link className="toolkit-open" href={calculator.route}>Open Calculator <span aria-hidden="true">→</span></Link>
  </article>;
}
