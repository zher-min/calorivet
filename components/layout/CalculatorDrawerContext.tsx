"use client";

import { createContext, useContext } from "react";

type CalculatorDrawerContextValue = {
  openCalculatorDrawer: () => void;
};

export const CalculatorDrawerContext = createContext<CalculatorDrawerContextValue | null>(null);

export function useCalculatorDrawer() {
  const context = useContext(CalculatorDrawerContext);
  if (!context) throw new Error("useCalculatorDrawer must be used inside AppShell");
  return context;
}
