# Blood transfusion V1 — implementation record

Based on the two user-supplied clinical and implementation specifications, September 2026. This condensed record retains the operative requirements; the full supplied specification remains in the task history. Source metadata and numeric assumptions are auditable in `references.ts` and `clinicalConstants.ts`.

## Clinical scope

Veterinary-professional estimation and decision support for dogs and cats. Six numbered single-scroll sections: recipient, estimated requirement, compatibility, independent donor collection, administration/monitoring, references. Client-side only; no patient identifier, persistence, network calculation service, drug doses or new dependencies. Nutrition behavior must remain unchanged.

## Calculation contract

- RBC mass balance: `(targetPCV-currentPCV)/productPCV × EBV × weight`. Display mL and mL/kg, product, weight and all PCV/EBV assumptions. No target or product PCV defaults. PCVs use percent numbers, not fractions.
- Dog EBV default 85 mL/kg; Merck range 80–90. Cat default 55; range 40–60. Overrides are explicit.
- Cat whole-blood empirical estimate: `PCV increase × 2 × weight`. Secondary when product PCV is known, empirical-only when blank. Invalid product PCV is not the same as missing PCV. Never use for pRBC.
- Reverse PCV: `currentPCV + volume × productPCV/(EBV × weight)`. Independent of target PCV. Reject a prediction over 100%, rather than clamp it.
- Cornell common-dose comparison: whole blood 12–20, pRBC 6–10 mL/kg. Caution only; never cap a result.
- Plasma: positive weight × positive intended dose. Merck coagulopathy ranges: dog 10–20, cat 6–10 mL/kg; Cornell fresh/fresh-frozen plasma 6–12 mL/kg. No PCV equation or hypoproteinemia replacement calculation.
- Platelets and cryoprecipitate: reference only, approximately one unit per 10 kg with respective Merck/Cornell source and product-unit variability.
- Dog donor: collection ceiling `weight × 18`; minimum required weight `max(20, planned/18)`. Typical Italian profile 350–450 mL and at least 3 months between donations.
- Cat donor: lean-weight ceiling `weight × 12`; minimum `max(4.5, planned/12)`. Alternate Italian reference `min(weight × 15,70)` is informational, not the selected ceiling.
- Open feline ACD-A/CPD/CPDA-1 collection: anticoagulant `blood/7`, final total `blood + anticoagulant`. Sodium citrate `blood/9` only after confirmation of intended administration within 24 hours. Never calculate for commercial prefilled systems or recommend heparin.
- Planning rate: `clinician-selected volume / duration`, divided by recipient weight for mL/kg/hour. No universal safe rate; no automatic donor/recipient volume transfer.
- Massive transfusion: strict `>0.5 × EBV × weight` in 3 hours or `>EBV × weight` in 24 hours. Warn and advise ionized-calcium/intensified monitoring. Inconsistent overlapping-window totals are rejected.

## Interpretation register

1. **Feline EBV wording:** 55 is within 40–60 but its mathematical midpoint is 50. Retained 55 as requested and explicitly labelled an implementation assumption, not a midpoint/guideline default.
2. **Crossmatch timing:** prose says >4 days dogs/>2 cats, supplied function uses ≥. Implemented the conservative inclusive function boundaries and disclosed the distinction from the Merck transfusion page. Exact-boundary tests are included.
3. **Feline screening floor:** ISFM describes >4.5 kg lean BW; requested equation uses max(4.5,...). The operational floor remains 4.5, with source wording disclosed. Passing arithmetic never establishes donor eligibility.
4. **Blood vs anticoagulant:** donor ceiling and intended collection use blood volume alone. Routine 40–60 mL feline collection context includes anticoagulant. Show the final total separately.
5. **EBV technical bounds:** selected 20–150 mL/kg as broad input guardrails, not a clinical reference. Weights >150 kg prompt review but have no biological hard cap. Non-finite/overflow results are suppressed.
6. **Plasma compatibility:** RBC type matching and major-crossmatch timing must not be applied as plasma matching rules. Show product/blood-bank-specific guidance instead.
7. **Prediction rounding:** calculations retain full precision; volume display normally uses one decimal, dose two. Neither empirical nor mass-balance estimates imply exact attained PCV.
8. **Current blood-bank policy:** Pet Blood Bank UK's 2026 feline service uses a different collection policy (6.6 mL/kg on its donation-session page); it supports practical screening context, not the selected ISFM 12 mL/kg ceiling.
9. **State boundaries:** species changes clear recipient inputs, compatibility state and administration plans; donor species/weight remain independent. Product changes clear product-specific inputs. All outputs derive from current state, never cached results.

## Compatibility and monitoring

Dog negative recipients require negative RBCs; positive recipients can receive either with inventory considerations. Weak-positive recipient/donor interpretation is disclosed. Cat A/B use matched blood; AB may receive type A pRBC only when AB unavailable. Unknown typing/history triggers caution. First dog major crossmatch is case-dependent; first/subsequent cat crossmatch suggested; inclusive timing alerts as above.

Donor screening includes exam, health/medication/procedure/vaccination/reproductive/transfusion/travel history, CBC/PCV/Hb, typing, geographically appropriate infection screening and at least annual retesting, temperament/welfare and donor-unit-recipient traceability. Italian Hb profile: dog 13, cat 10 g/dL, not below analyzer reference intervals. No universal infectious panel; future Malaysia/Southeast Asia guidance can be added locally.

Administration includes slow initiation for approximately 15 minutes when clinically appropriate, cardiac/renal/TACO cautions, dedicated line and appropriate filter, no medications/calcium-containing fluids, gravity or blood-validated pump, and close observation during/after transfusion. TRACS canine RBC filter reference 170–260 µm. Monitoring covers temperature, pulse/heart/respiratory parameters, mucosa, blood pressure, mentation, urine/hemolysis and acute reaction signs. Visible professional disclaimer retained at the end.

## Verification

Automated cases cover the ten mandatory examples plus missing/invalid/overflow inputs, exact warning thresholds, species/product exclusions, reverse round-trip, commercial anticoagulant exclusion and cautions. Existing nutrition tests are retained. Browser verification covers desktop/mobile layout, reactive results and invalid-result clearing. No source changes to CaloriVet are included in this module work.
