import type { SourceId } from "./references";
const item = <T extends number | readonly number[]>(value: T, unit: string, sourceId: SourceId, note = "") => ({ value, unit, sourceId, note });
export const EVIDENCE = {
  ebv: { dog: item(85, "mL/kg", "merck", "Implementation default: midpoint of canine range."), cat: item(55, "mL/kg", "merck", "Implementation default within feline range, not its midpoint (50).") },
  ebvRange: { dog: item([80, 90], "mL/kg", "merck"), cat: item([40, 60], "mL/kg", "merck") },
  commonDose: { wholeBlood: item([12, 20], "mL/kg", "cornell"), pRbc: item([6, 10], "mL/kg", "cornell") },
  plasma: { dog: item([10, 20], "mL/kg", "merck"), cat: item([6, 10], "mL/kg", "merck"), cornell: item([6, 12], "mL/kg", "cornell") },
  empirical: item(2, "mL/kg per PCV percentage point", "isfm", "Feline whole blood only; imperfect empirical prediction."),
  donor: {
    dog: { floor: item(20, "kg", "italy"), ceiling: item(18, "mL/kg", "italy"), typical: item([350, 450], "mL", "italy"), interval: item(3, "months", "italy"), hb: item(13, "g/dL", "italy") },
    cat: { floor: item(4.5, "kg lean BW", "isfm", "V1 operational floor; ISFM describes >4.5 kg lean BW."), ceiling: item(12, "mL/kg lean BW", "isfm"), range: item([10, 12], "mL/kg", "isfm"), typical: item([40, 60], "mL including anticoagulant", "isfm"), age: item([1, 8], "years", "isfm"), hb: item(10, "g/dL", "italy"), alternativeRate: item(15, "mL/kg", "italy"), alternativeCap: item(70, "mL", "italy"), alternativeRange: item([11, 15], "mL/kg", "italy") },
  },
  anticoagulant: { standard: item(7, "mL blood per mL anticoagulant", "isfm"), citrate: item(9, "mL blood per mL anticoagulant", "isfm"), citrateHours: item(24, "hours", "isfm") },
  crossmatchDays: { dog: item(4, "days", "merck", "Inclusive ≥4 per requested conservative implementation; transfusion page says >4."), cat: item(2, "days", "merck", "Inclusive ≥2 per requested conservative implementation; transfusion page says >2.") },
  massive: { fraction3h: item(0.5, "estimated blood volumes / 3 h", "tracs"), fraction24h: item(1, "estimated blood volumes / 24 h", "tracs") },
  firstMinutes: item(15, "minutes", "merck"), filter: item([170, 260], "µm, canine RBC", "tracs"),
  platelet: item(10, "kg per unit", "merck"), cryo: item(10, "kg per unit", "cornell"),
} as const;
// Technical review/validation bounds, not recommended clinical values.
export const TECHNICAL = { ebvMin: 20, ebvMax: 150, pcvMax: 100, weightReviewKg: 150 } as const;
export const productNames = { wholeBlood: "Whole blood", pRbc: "pRBC", plasma: "Plasma" } as const;
