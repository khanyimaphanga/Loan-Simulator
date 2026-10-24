import { Badge } from '@capitec/design-system';
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber';
import type { RiskCategory } from '../../types';
import { RISK_STATUS } from './status';

interface LikelihoodGaugeProps {
  likelihood: number;
  risk: RiskCategory;
}

// Semicircle centred at (100, 100), radius 80.
const ARC = 'M 20 100 A 80 80 0 0 1 180 100';

export function LikelihoodGauge({ likelihood, risk }: LikelihoodGaugeProps) {
  const shown = Math.round(useAnimatedNumber(likelihood));
  const status = RISK_STATUS[risk];
  return (
    <div className={`gauge gauge--${status.tone}`}>
      <svg viewBox="0 0 200 112" className="gauge__svg" role="img" aria-label={`Approval likelihood ${likelihood}%: ${status.label}`}>
        <path d={ARC} pathLength={100} className="gauge__track" />
        <path d={ARC} pathLength={100} className="gauge__value" style={{ strokeDashoffset: 100 - likelihood }} />
      </svg>
      <div className="gauge__readout" aria-hidden="true">
        <span className="gauge__number">
          {shown}
          <span className="gauge__pct">%</span>
        </span>
        <span className="eyebrow">approval likelihood</span>
      </div>
      <Badge tone={status.tone} icon={status.icon}>
        {status.label}
      </Badge>
    </div>
  );
}
