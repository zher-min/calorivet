import PillCounter from '../../../calculators/pill-counter/PillCounter';
import { getCalculator } from '../../../config/calculators';
const tool = getCalculator('pill-counter');
export const metadata = { title: `${tool.name} | VetTools`, description: tool.homeDescription };
export default PillCounter;
