import CalculatorSection from "../../components/calculators/CalculatorSection";
import { getCalculator } from "../../config/calculators";

const sections = ["Patient", "Blood Product", "Transfusion Requirement", "Compatibility", "Donor Collection", "Administration & Monitoring", "References"];

export default function Transfusion() {
  const calculator = getCalculator("transfusion");
  return <main className="toolkit-workspace transfusion-workspace">
    <div className="toolkit-intro"><h1>{calculator.name}</h1><p>Dogs &amp; Cats</p></div>
    <p className="clinical-status" role="note">In development. Transfusion calculations and clinical guidance are not yet available.</p>
    {sections.map((title, index) => <CalculatorSection key={title} number={String(index + 1).padStart(2, "0")} title={title}>
      <p className="section-pending">{title === "References" ? "Clinical references will accompany the validated calculation methods." : "Available with the upcoming clinical calculator."}</p>
    </CalculatorSection>)}
  </main>;
}
