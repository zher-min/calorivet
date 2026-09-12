"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { calculators } from "../../config/calculators";
import { useToolFavourites } from "./useToolFavourites";
const groups = ["Emergency & Critical Care", "Drug Calculations", "Nutrition & Preventive Care", "Clinical Utilities"];
export default function ToolLauncher({ onSelect }: { onSelect: (route: string) => void }) {
  const { ids, toggle } = useToolFavourites(); const [editing, setEditing] = useState(false); const pathname = usePathname();
  const byId = new Map(calculators.map(item => [item.id, item]));
  const tile = (item: typeof calculators[number], favourite = false) => <div className="launcher-tile-wrap" key={`${favourite ? "fav-" : ""}${item.id}`}><Link href={item.route} onClick={() => onSelect(item.route)} aria-current={pathname === item.route ? "page" : undefined} className="launcher-tile" aria-label={item.name}><span className="launcher-emoji" aria-hidden="true">{item.emoji}</span><span className="launcher-label">{item.shortName}</span>{item.status === "prototype" && <small className="launcher-wip">WIP</small>}</Link>{editing && <button type="button" className="launcher-star" onClick={() => toggle(item.id)} aria-label={`${ids.includes(item.id) ? "Remove" : "Add"} ${item.name} ${ids.includes(item.id) ? "from" : "to"} favourites`}>{ids.includes(item.id) ? "★" : "☆"}</button>}</div>;
  return <div className="tool-launcher"><div className="launcher-actions"><button type="button" className="toolkit-button" onClick={() => setEditing(value => !value)}>{editing ? "Done" : "Edit favourites"}</button></div>{ids.length > 0 && <section className="launcher-section"><h3>★ Favourites</h3><div className="launcher-grid">{ids.map(id => byId.get(id)).filter(Boolean).map(item => tile(item!, true))}</div></section>}{groups.map(group => <section className="launcher-section" key={group}><h3>{group}</h3><div className="launcher-grid">{calculators.filter(item => (group === "Drug Calculations" ? ["bsa", "cri", "drug-dilution"].includes(item.id) : group === "Emergency & Critical Care" ? ["emergency", "transfusion", "tap-rate", "urine-output"].includes(item.id) : group === "Nutrition & Preventive Care" ? ["calorie", "parasite"].includes(item.id) : item.id === "pill-counter")).map(item => tile(item))}</div></section>)}</div>;
}
