"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { calculatorCategories, calculators } from "../../config/calculators";
import { useToolFavourites } from "./useToolFavourites";
export default function ToolLauncher({ onSelect }: { onSelect: (route: string) => void }) {
  const { ids, toggle } = useToolFavourites(); const [editing, setEditing] = useState(false); const pathname = usePathname();
  const byId = new Map(calculators.map(item => [item.id, item]));
  const groups = calculatorCategories.reduce<{ name: string; items: typeof calculators }[]>((result, category) => {
    const existing = result.find(group => group.name === category.name);
    const items = category.calculators.map(item => ({ ...item, category: category.name })) as typeof calculators;
    if (existing) existing.items.push(...items); else result.push({ name: category.name, items: [...items] });
    return result;
  }, []);
  const tile = (item: typeof calculators[number], favourite = false) => <div className="launcher-tile-wrap" key={`${favourite ? "fav-" : ""}${item.id}`}><Link href={item.route} onClick={() => onSelect(item.route)} aria-current={pathname === item.route ? "page" : undefined} className="launcher-tile" aria-label={item.name}><span className="launcher-emoji" aria-hidden="true">{item.emoji}</span><span className="launcher-label">{item.shortName}</span>{item.status === "prototype" && <small className="launcher-wip">WIP</small>}</Link>{editing && <button type="button" className="launcher-star" onClick={() => toggle(item.id)} aria-label={`${ids.includes(item.id) ? "Remove" : "Add"} ${item.name} ${ids.includes(item.id) ? "from" : "to"} favourites`}>{ids.includes(item.id) ? "★" : "☆"}</button>}</div>;
  return <div className="tool-launcher"><div className="launcher-actions"><button type="button" className="toolkit-button" onClick={() => setEditing(value => !value)}>{editing ? "Done" : "Edit favourites"}</button></div>{ids.length > 0 && <section className="launcher-section"><h3>★ Favourites</h3><div className="launcher-grid">{ids.map(id => byId.get(id)).filter(Boolean).map(item => tile(item!, true))}</div></section>}{groups.map(group => <section className="launcher-section" key={group.name}><h3>{group.name}</h3><div className="launcher-grid">{group.items.map(item => tile(item))}</div></section>)}</div>;
}
