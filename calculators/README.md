# Calculator modules

Add a module here, an `app/calculators/<id>/page.tsx` route and an entry in `config/calculators.ts`. The home page and navigation consume that registry. Keep state in the calculator, never in the application shell.

CaloriVet's unchanged formulas, validation and constants are in `calorie/calculations.ts`; its sources are in `calorie/references.ts`, with contextual warnings in `calorie/CaloriVet.tsx`. Regression tests live in `tests/calculations.test.mjs`.

Transfusion is a page shell only. Implement the separately supplied clinical specification before enabling clinical inputs or results. New medical constants must be named objects with value, unit and sourceId; references should be local to that calculator and record title, organization/authors, year, URL, optional DOI/version/access date and the constants or recommendations supported. Do not place medical constants or formulas in shared components. Add pure calculation and validation tests with each method.
