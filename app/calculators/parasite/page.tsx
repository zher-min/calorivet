import ParasiteSelector from '../../../calculators/parasite/ParasiteSelector';
import { getCalculator } from '../../../config/calculators';
const tool = getCalculator('parasite');
export const metadata = { title: `${tool.name} | VetTools`, description: tool.homeDescription };
export default ParasiteSelector;
