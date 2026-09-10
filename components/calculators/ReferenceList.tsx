export interface ClinicalReference {
  id: string; title: string; organization?: string; authors?: string[]; year?: number;
  url: string; doi?: string; accessedAt?: string; version?: string; supports: string[];
}
export default function ReferenceList({ references }: { references: readonly ClinicalReference[] }) {
  return <div className="purpose-sources" aria-label="References and methodology">{references.map(source => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.title} <span aria-hidden="true">↗</span></a>)}</div>;
}
