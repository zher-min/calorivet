import CaloriVet from "../../../calculators/calorie/CaloriVet";
import { getCalculator } from "../../../config/calculators";
const calculator = getCalculator("calorie");
export const metadata = { title: `${calculator.name} | VetSlate`, description: calculator.homeDescription };
export default CaloriVet;
