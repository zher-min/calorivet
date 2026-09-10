import Transfusion from "../../../calculators/transfusion/Transfusion";
import { getCalculator } from "../../../config/calculators";
const calculator = getCalculator("transfusion");
export const metadata = { title: `${calculator.name} | VetCalc`, description: calculator.homeDescription };
export default Transfusion;
