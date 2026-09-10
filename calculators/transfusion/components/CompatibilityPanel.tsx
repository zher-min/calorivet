import { useState } from "react";
import { compatibility, crossmatchAlert } from "../warnings";
import { EVIDENCE as E } from "../clinicalConstants";
import type { Species, Product, History } from "../types";
import { Field, Select, Notice } from "./Controls";
export default function CompatibilityPanel({ species, product }: { species: Species; product: Product }) {
  const [recipient, setRecipient] = useState("Unknown"), [donor, setDonor] = useState("Unknown"), [history, setHistory] = useState<History>("unknown"), [days, setDays] = useState("");
  const options = species === "dog" ? ["Unknown", "Positive", "Negative"] : ["Unknown", "A", "B", "AB"];
  return <>
    {product !== "plasma" && <><div className="tx-grid">
      <Select label={species === "dog" ? "Recipient DEA 1" : "Recipient AB blood type"} value={recipient} onChange={setRecipient} options={options} />
      <Select label={species === "dog" ? "Product/donor DEA 1" : "Product/donor AB blood type"} value={donor} onChange={setDonor} options={options} />
      <Select label="Previous transfusion?" value={history} onChange={value => { setHistory(value as History); setDays(""); }} options={[["unknown", "Unknown"], ["none", "No"], ["yes", "Yes"]]} />
      {history === "yes" && <Field label="Days since previous transfusion" value={days} onChange={setDays} unit="days" />}
    </div><Notice warning={crossmatchAlert(species, history, days)} /><small>Timing alert uses ≥{E.crossmatchDays[species].value} days; conservative inclusive boundary. <a href="#tx-references">Source and interpretation</a>.</small></>}
    <Notice warning={compatibility(species, product, recipient, donor)} />
  </>;
}
