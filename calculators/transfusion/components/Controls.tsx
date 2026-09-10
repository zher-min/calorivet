import { useId } from "react";
import type { Warning } from "../types";
export const fmt = (value: number, digits = 1) => value.toLocaleString("en-MY", { maximumFractionDigits: digits });
export function Field({ label, value, onChange, unit, hint }: { label: string; value: string; onChange: (value: string) => void; unit: string; hint?: string }) {
  const id = useId();
  return <label className="tx-field" htmlFor={id}><span>{label} <small>{unit}</small></span><input id={id} type="number" inputMode="decimal" step="any" value={value === "invalid" ? "" : value} onChange={event => onChange(event.target.validity.badInput ? "invalid" : event.target.value)} aria-invalid={value === "invalid" || undefined} aria-describedby={hint ? `${id}-hint` : undefined} />{value === "invalid" && <small>Enter a valid number.</small>}{hint && <small id={`${id}-hint`}>{hint}</small>}</label>;
}
export function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: readonly (string | readonly [string, string])[] }) {
  const id = useId();
  return <label className="tx-field" htmlFor={id}><span>{label}</span><select id={id} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => { const [key, text] = typeof option === "string" ? [option, option] : option; return <option key={key} value={key}>{text}</option>; })}</select></label>;
}
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="tx-check"><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} />{label}</label>;
}
export function Notice({ warning }: { warning: Warning | null }) { return warning && <p className={`tx-notice tx-${warning.severity}`}><b>{warning.severity === "error" ? "Check inputs / criteria: " : warning.severity === "caution" ? "Caution: " : "Information: "}</b>{warning.message}</p>; }
export function Errors({ errors }: { errors: string[] }) { return errors.length > 0 && <div className="tx-notice tx-error"><b>Required before calculation</b><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>; }
