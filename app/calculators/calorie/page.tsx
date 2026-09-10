import CaloriVet from "../../../calculators/calorie/CaloriVet";
import { getCalculator } from "../../../config/calculators";
const calculator = getCalculator("calorie");
export const metadata = { title: `${calculator.brand} — ${calculator.name} | VetCalc`, description: calculator.homeDescription };
export default CaloriVet;
