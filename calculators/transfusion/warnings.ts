import { EVIDENCE as E, TECHNICAL } from "./clinicalConstants.ts";
import { nonnegative, positive } from "./validation.ts";
import type { History, Input, Product, Species, Warning } from "./types.ts";
export function doseWarning(product: Exclude<Product, "plasma">, dose: number): Warning | null {
  const [low, high] = E.commonDose[product].value;
  if (!Number.isFinite(dose)) return { severity: "error", message: "Invalid calculated dose." };
  return dose < low || dose > high ? { severity: "caution", message: `Calculated dose is ${dose > high ? "above" : "below"} the common ${low}–${high} mL/kg reference range. The calculated volume has not been reduced or capped.` } : null;
}
export function crossmatchAlert(species: Species, history: History, days: Input): Warning {
  if (history === "unknown") return { severity: "caution", message: "Unknown transfusion history: strongly consider major crossmatching; do not assume transfusion-naïve status." };
  if (history === "yes") {
    const elapsed = nonnegative(days);
    if (elapsed === null) return { severity: "caution", message: "Enter valid days since prior transfusion. Timing is uncertain; strongly consider major crossmatching." };
    if (elapsed >= E.crossmatchDays[species].value) return { severity: "caution", message: "Major crossmatch strongly recommended." };
  }
  return species === "cat" ? { severity: "caution", message: "Major crossmatch suggested in addition to blood typing when possible, including before subsequent transfusions." } : { severity: "info", message: history === "none" ? "Transfusion-naïve dog: major crossmatch is case-dependent; assess the clinical situation." : "Consider major crossmatching before repeat transfusion." };
}
export function compatibility(species: Species, product: Product, recipient: string, donor: string): Warning {
  if (product === "plasma") return { severity: "info", message: "Plasma compatibility requires product-specific assessment. RBC matching rules and major-crossmatch timing are not applied to plasma here; follow blood-bank/local protocols." };
  const options = species === "dog" ? ["Positive", "Negative"] : ["A", "B", "AB"];
  if (!options.includes(recipient) || !options.includes(donor)) return { severity: "caution", message: "Confirm recipient and product blood typing before interpreting compatibility." };
  if (species === "dog") {
    if (recipient === "Negative" && donor === "Positive") return { severity: "error", message: "DEA 1 mismatch: a negative recipient requires a DEA 1-negative RBC product." };
    return { severity: "info", message: "DEA 1 type criteria met; this does not establish full compatibility. Matched positive products conserve negative inventory. Treat weak-positive recipients as negative and weak-positive donors as positive." };
  }
  if (recipient === "AB" && donor === "A" && product === "pRbc") return { severity: "caution", message: "Type A pRBC may be used for a type AB cat if AB product is unavailable. Confirm with blood-bank/local protocol and crossmatch." };
  return recipient === donor ? { severity: "info", message: "AB type matched. Other feline alloantibodies remain possible; type matching does not replace crossmatching." } : { severity: "error", message: "Feline blood-type mismatch. Use type-matched blood; the type AB recipient/type A exception applies to pRBC only." };
}
export function weightWarning(weight: Input): Warning | null { const n = positive(weight); return n !== null && n > TECHNICAL.weightReviewKg ? { severity: "caution", message: "Unusually high dog/cat body weight: verify the kg entry. This is a review prompt, not a calculation cap." } : null; }
export const ongoingWarning = (on: boolean): Warning | null => on ? { severity: "caution", message: "Ongoing blood loss or hemolysis may cause achieved PCV to differ substantially. Reassess clinically and repeat PCV/Hct." } : null;
export const overloadWarning = (cardiac: boolean, renal: boolean, overload: boolean): Warning | null => cardiac || renal || overload ? { severity: "caution", message: "Increased volume-overload risk. A slower individualized administration strategy may be appropriate." } : null;
