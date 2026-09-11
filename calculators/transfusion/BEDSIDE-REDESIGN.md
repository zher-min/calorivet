# Bedside redesign — September 2026

Supersedes the earlier V1 page workflow. Nutrition code is unchanged. Existing advanced pure engines and their tests are retained for potential separate modules, but are not imported into the bedside page.

The page now performs the PCV mass balance reactively with required positive weight/current/target/product PCV; no Calculate button or empirical fallback. Target defaults to 20%, with 20/25/custom controls. kg/lb conversion uses the requested 2.20462 divisor. Shared CaloriVet font and theme tokens are used throughout.

## Explicit clinical interpretations

- Retain EBV 85 mL/kg dog and 55 mL/kg cat. The 15 kg, 10→20%, product 40% example therefore yields 318.75 mL, displayed 319 mL and 21.3 mL/kg, not the illustrative 338 mL.
- Minimum whole-blood donor weight uses volume / selected ceiling (18 dog, 12 cat), not a screening floor. The example gives 18 kg rounded up; this is a volume-only estimate, not donor eligibility. The optional donor helper separately flags the screening floor.
- Round minimum donor weight upward to 1 kg in dogs and 0.1 kg in cats. Internal calculation precision is preserved.
- No unsupported recommended-versus-maximum collection split is introduced.
- Packed-cell volume cannot be equated to donor whole-blood yield. The packed-cell transfusion result remains available, but numeric donor-weight and sufficiency estimates require an established component yield and are suppressed rather than falsely inferred.
- Numeric species-specific target claims were not established by the primary references checked. The requested 20/25% shortcuts are editable workflow presets, not attributed guideline endpoints. Use concise individualized-target guidance instead of claiming universal 20–25% dog or 18–20% cat targets.
- Large-volume warning uses existing Cornell whole-blood/pRBC upper common-dose ranges; it never caps a result.

The main screen excludes plasma, empirical/reverse modes, compatibility inputs, anticoagulants, transfusion rates/duration and monitoring schedules. Clinical notes and references are collapsed by default. No patient data is stored.
