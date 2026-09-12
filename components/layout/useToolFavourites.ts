"use client";
import { useEffect, useState } from "react";
import { calculators } from "../../config/calculators";
const KEY = "vettools:favourites";
export function useToolFavourites() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => { const timer = window.setTimeout(() => { try { const raw = window.localStorage.getItem(KEY); const parsed = raw ? JSON.parse(raw) : []; const valid = new Set(calculators.map(item => item.id)); setIds(Array.from(new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string" && valid.has(id)) : []))); } catch { setIds([]); } }, 0); return () => window.clearTimeout(timer); }, []);
  function toggle(id: string) { setIds(current => { const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id]; try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* device storage may be unavailable */ } return next; }); }
  return { ids, toggle };
}
