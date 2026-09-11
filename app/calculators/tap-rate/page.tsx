import TapRate from '../../../calculators/tap-rate/TapRate';
import { getCalculator } from '../../../config/calculators';

const tool = getCalculator('tap-rate');
export const metadata = { title: `${tool.name} | VetTools`, description: tool.homeDescription };

export default function TapRatePage() {
  return <main className="toolkit-workspace tap-rate-page">
    <h1>Tap Rate</h1>
    <TapRate />
  </main>;
}
