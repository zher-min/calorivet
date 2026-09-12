"use client";

import { useCalculatorDrawer } from "./CalculatorDrawerContext";

export default function OpenCalculatorsButton() {
  const { openCalculatorDrawer } = useCalculatorDrawer();
  return <button type="button" className="home-calculators-button" onClick={openCalculatorDrawer}>
    <span aria-hidden="true">☷</span>
    Open toolbox
  </button>;
}
