export default function CalculatorSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return <section className="clinical-section" aria-labelledby={`section-${number}`}>
    <h2 id={`section-${number}`}><span>{number}</span> {title}</h2>{children}
  </section>;
}
