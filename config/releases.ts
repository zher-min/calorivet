export type VetToolsRelease = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: readonly string[];
  current?: boolean;
};

export const releases: readonly VetToolsRelease[] = [
  { version: "v4.0.0", date: "2026-09-13", title: "Introducing VetSlate", summary: "VetTools is now VetSlate, with a refreshed identity and a more consistent clinical interface.", changes: ["Renamed the navigation drawer to Toolbox and introduced dark-mode styling.", "Standardized calculator titles, WIP badges, categories and support notices."], current: true },
  { version: "v3.11.0", date: "2026-09-12", title: "Unified clinical interface", summary: "A cleaner shared interface and a release-focused VetTools home.", changes: ["Unified typography and shared Dog/Cat controls across tools.", "Added a concise What’s New home with direct access to the calculator launcher."] },
  { version: "v3.10.2", date: "2026-09-12", title: "Emergency Quick Jump fix", summary: "Kept the mobile Quick Jump menu visible above its bottom toolbar.", changes: ["Improved mobile menu positioning and access."] },
  { version: "v3.10.1", date: "2026-09-12", title: "Fetal Age integration", summary: "Completed launcher registration and interface polish for fetal-age estimation.", changes: ["Added Fetal Age to the tool registry as WIP.", "Polished measurement selection and navigation metadata."] },
  { version: "v3.10.0", date: "2026-09-12", title: "Ultrasound Fetal Age Calculator", summary: "Added canine and feline ICC/BPD fetal-age and parturition estimates.", changes: ["Included multiple-fetus averaging, measurement guidance and clinical references."] },
  { version: "v3.9.0", date: "2026-09-12", title: "Tool launcher and favourites", summary: "Introduced the compact emoji tool grid and locally saved favourites.", changes: ["Added category-based navigation and resilient browser-local favourites."] },
  { version: "v3.8.1", date: "2026-09-12", title: "Navigation feedback", summary: "Added visible loading feedback while moving between calculators.", changes: ["Improved calculator navigation responsiveness."] },
  { version: "v3.8.0", date: "2026-09-12", title: "Drug Dilution Calculator", summary: "Added dilution, verification, dose-preparation and concentration conversion tools.", changes: ["Supports mixed concentration units and % w/v conversion."] },
  { version: "v3.7.0", date: "2026-09-12", title: "Urine Output Calculator", summary: "Added rapid mL/kg/hr calculation with a persistent interpreted result.", changes: ["Included live normal, reduced, oliguria, anuria and increased states."] },
  { version: "v3.6.1", date: "2026-09-12", title: "Pill Counter safeguards", summary: "Combined performance, worker and memory protections for the WIP pill detector.", changes: ["Moved detection work off the main interface.", "Reduced image and detector memory use and gated the experimental tool."] },
  { version: "v3.6.0", date: "2026-09-12", title: "Pill Counter prototype", summary: "Added a local, browser-side tablet counting prototype with manual correction.", changes: ["Photos remain on-device and detected markers can be added, removed or undone."] },
  { version: "v3.5.2", date: "2026-09-12", title: "RECOVER Quick Doses", summary: "Added a compact calculated emergency dose sheet for the current patient weight.", changes: ["Improved rapid bedside access to CPR volumes."] },
  { version: "v3.5.1", date: "2026-09-12", title: "Compact emergency workflow", summary: "Reduced emergency-page density and improved access to treatments and concentrations.", changes: ["Added focused treatment expansion and concentration management."] },
  { version: "v3.5.0", date: "2026-09-12", title: "Emergency Drug Calculator", summary: "Added a weight-aware RECOVER crash sheet and emergency treatment modules.", changes: ["Included locally persistent clinic concentrations and species-aware dose calculations."] },
  { version: "v3.4.0", date: "2026-09-11", title: "Constant Rate Infusion Calculator", summary: "Added single- and multi-drug CRI preparation for bags and syringe pumps.", changes: ["Supports replace-volume and add-to-volume preparation methods."] },
  { version: "v3.3.0", date: "2026-09-11", title: "Body Surface Area Calculator", summary: "Added immediate canine and feline BSA calculation from body weight.", changes: ["Included the small-patient chemotherapy protocol caution."] },
  { version: "v3.2.0", date: "2026-09-11", title: "Quick BPM", summary: "Added a one-handed tap-based rate utility for repeated clinical events.", changes: ["Uses recent intervals, accidental-tap protection and automatic reset."] },
  { version: "v3.1.1", date: "2026-09-11", title: "Parasite prototype safeguards", summary: "Marked the Parasite Selector clearly as work in progress.", changes: ["Preserved testing access without presenting unverified coverage as final guidance."] },
  { version: "v3.1.0", date: "2026-09-11", title: "Parasite Selector prototype", summary: "Added product matching and side-by-side parasite coverage comparison.", changes: ["Created a structured, updateable clinic-product data layer."] },
  { version: "v3.0.0", date: "2026-09-11", title: "VetTools", summary: "Established the VetTools identity and installable app branding.", changes: ["Renamed the umbrella platform and introduced the VetTools app icon."] },
  { version: "v2.2.0", date: "2026-09-11", title: "Installable clinical toolkit", summary: "Added home-screen installation, fully clickable tool cards and shared feedback.", changes: ["Improved app-like access across mobile and desktop."] },
  { version: "v2.1.1", date: "2026-09-11", title: "Simplified transfusion workflow", summary: "Made transfusion results reactive and aligned species controls with CaloriVet.", changes: ["Added a compact bottom result panel for bedside use."] },
  { version: "v2.1.0", date: "2026-09-10", title: "Blood Transfusion Calculator", summary: "Added evidence-linked recipient, compatibility, donor and administration support.", changes: ["Kept clinical formulas and source metadata separate from presentation."] },
  { version: "v2.0.0", date: "2026-09-10", title: "Multi-calculator platform", summary: "Refactored CaloriVet into a scalable clinical calculator platform.", changes: ["Added shared navigation, direct calculator routes and a central registry."] },
  { version: "v1.5.0", date: "2026-09-05", title: "Weight-management guidance", summary: "Added guideline-based MER ranges and a compact BCS target-weight helper.", changes: ["Kept BCS estimation optional within the weight-loss workflow."] },
  { version: "v1.4.0", date: "2026-09-05", title: "Consultation workflow", summary: "Added feeding midpoints, consultation actions and private feedback.", changes: ["Improved practical use during nutrition consultations."] },
  { version: "v1.3.0", date: "2026-09-05", title: "Lactation workflow", summary: "Integrated lactation requirements into the main feeding workflow.", changes: ["Preserved a continuous single-page calculator experience."] },
  { version: "v1.2.0", date: "2026-09-05", title: "Feeding calculation improvements", summary: "Corrected growth factors and improved food entry and mobile results.", changes: ["Strengthened clinical inputs and responsive result presentation."] },
  { version: "v1.1.1", date: "2026-09-05", title: "Clinical methodology and wording", summary: "Polished calculator typography and documented its energy methods.", changes: ["Clarified Modified Atwater, RER and MER methodology."] },
  { version: "v1.1.0", date: "2026-09-05", title: "Integrated feeding workflow", summary: "Connected calorie requirements with practical feeding quantities.", changes: ["Added the accessible continuous nutrition workflow."] },
  { version: "v1.0.0", date: "2026-07-12", title: "Initial CaloriVet calculator", summary: "The first working calorie calculator that became VetTools.", changes: ["Introduced the core veterinary calorie calculation experience."] },
] as const;
