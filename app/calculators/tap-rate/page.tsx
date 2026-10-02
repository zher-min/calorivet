import TapRate from '../../../calculators/tap-rate/TapRate';
import { getCalculator } from '../../../config/calculators';

const tool = getCalculator('tap-rate');
export const metadata = { title: `${tool.name} | VetSlate`, description: tool.homeDescription };

export default function TapRatePage() {
  return <main className="toolkit-workspace tap-rate-page">
    <div className="toolkit-intro">
      <h1>BPM / Drip Rate</h1>
      <p>Tap a repeated event or observed IV fluid drops to estimate the current rate.</p>
    </div>
    <TapRate />
  </main>;
}
