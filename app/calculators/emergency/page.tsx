import EmergencyCalculator from "../../../calculators/emergency/EmergencyCalculator";
import { getCalculator } from "../../../config/calculators";

const calculator = getCalculator("emergency");
export const metadata = { title: `${calculator.name} | VetTools`, description: calculator.homeDescription };

export default EmergencyCalculator;
