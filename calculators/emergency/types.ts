export type EmergencySpecies = "dog" | "cat";
export type DoseUnit = "mg/kg" | "mcg/kg" | "g/kg" | "U/kg" | "mg/kg/hr" | "mcg/kg/hr" | "U/kg/hr" | "mL/kg" | "mL/kg/min" | "J/kg";
export type ConcentrationUnit = "mg/mL" | "mcg/mL" | "g/mL" | "U/mL" | "%";
export type WarningLevel = "info" | "caution" | "warning";

export type TreatmentTooltip = {
  use: string;
  action: string;
  caution: string;
  practical: string;
};

export type ConcentrationDefinition = {
  key: string;
  drugName: string;
  referenceValue: number | null;
  unit: ConcentrationUnit;
};

export type DoseOption = {
  id: string;
  label: string;
  doseMin: number;
  doseMax?: number;
  doseUnit: DoseUnit;
  route: string;
  administration?: string;
  durationMinutes?: [number, number];
  species?: EmergencySpecies[];
};

export type EmergencyTreatment = {
  id: string;
  drugName: string;
  indication: string;
  species: EmergencySpecies[];
  doseOptions: DoseOption[];
  concentrationKey?: string;
  fixedFormulation?: string;
  displayAllOptions?: boolean;
  dominant?: boolean;
  cumulativeMaxMgKg?: number;
  tooltip: TreatmentTooltip;
  warnings?: { level: WarningLevel; text: string }[];
  note?: string;
  reference?: string;
  referenceYear?: number;
};

export type EmergencyCategory = {
  id: string;
  name: string;
  treatments: EmergencyTreatment[];
};
