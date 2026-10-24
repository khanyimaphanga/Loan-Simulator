import type { ScoreFactor } from '../../types';
import { Card, Icon, Meter, type IconName, type MeterTone } from '@capitec/design-system';

const IMPACT: Record<ScoreFactor['impact'], { icon: IconName; label: string; tone: MeterTone }> = {
  positive: { icon: 'check', label: 'Helping', tone: 'success' },
  neutral: { icon: 'minus', label: 'Neutral', tone: 'neutral' },
  negative: { icon: 'alert', label: 'Holding you back', tone: 'danger' },
};

/** Explainable decisioning: each factor's contribution to the likelihood, in plain language. */
export function FactorList({ factors }: { factors: ScoreFactor[] }) {
  return (
    <Card title="Why you got this result" subtitle="Four things shape your likelihood. Here's how each one scored.">
      <ul className="factors">
        {factors.map((f) => (
          <li key={f.id} className={`factor factor--${f.impact}`}>
            <div className="factor__head">
              <span className="factor__label">{f.label}</span>
              <span className="factor__impact">
                <Icon name={IMPACT[f.impact].icon} size={14} strokeWidth={2.5} />
                {IMPACT[f.impact].label}
              </span>
            </div>
            <Meter
              value={f.points}
              max={f.maxPoints}
              tone={IMPACT[f.impact].tone}
              label={`${f.label} score`}
              valueText={`${f.points} of ${f.maxPoints} points`}
            />
            <p className="factor__detail">
              {f.detail} <span className="factor__points">{f.points}/{f.maxPoints} pts</span>
            </p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
