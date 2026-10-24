import { Badge, Icon, Meter, Spinner, VisuallyHidden } from '@capitec/design-system';
import { useEffect, useRef, useState } from 'react';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { formatRand } from '../lib/format';
import type { EligibilityResponse } from '../types';
import { RISK_STATUS } from './results/status';

/** How far the estimate moved after the last change, shown briefly so cause and effect are obvious. */
function useRecentChange(value: number | null, holdMs = 2500) {
  const previous = useRef<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  useEffect(() => {
    if (value == null) return;
    const before = previous.current;
    previous.current = value;
    if (before == null || before === value) return;
    setChange(value - before);
    const timer = setTimeout(() => setChange(null), holdMs);
    return () => clearTimeout(timer);
  }, [value, holdMs]);
  return change;
}

interface LiveChanceProps {
  live: EligibilityResponse | null;
  unlocked: boolean;
}

/** "Your chances so far": unlocks after the money step and reacts to every answer from then on. */
export function LiveChance({ live, unlocked }: LiveChanceProps) {
  const likelihood = live?.eligibilityResult.approvalLikelihood ?? null;
  const shown = Math.round(useAnimatedNumber(likelihood ?? 0));
  const change = useRecentChange(likelihood);
  const status = live ? RISK_STATUS[live.eligibilityResult.riskCategory] : null;

  return (
    <section className="chance" aria-labelledby="chance-title">
      <p className="eyebrow" id="chance-title">
        Your chances so far
      </p>
      {!unlocked ? (
        <p className="chance__locked">
          <Icon name="lock" size={18} />
          <span>Finish “Your money” to see your chances. They'll update as you go.</span>
        </p>
      ) : !live || !status ? (
        <p className="chance__locked">
          <Spinner size="sm" /> Working out your chances…
        </p>
      ) : (
        <>
          <div className="chance__headline">
            <span className="chance__value" aria-hidden="true">
              {shown}%
            </span>
            <Badge tone={status.tone} icon={status.icon} size="sm">
              {status.label}
            </Badge>
            {change != null && (
              <span className={`chance__change chance__change--${change > 0 ? 'up' : 'down'}`} aria-hidden="true" key={`${likelihood}`}>
                {change > 0 ? '▲' : '▼'} {Math.abs(change)}
              </span>
            )}
          </div>
          <Meter
            value={live.eligibilityResult.approvalLikelihood}
            tone={status.tone}
            label="Approval likelihood so far"
            className="chance__meter"
          />
          <p className="chance__note">
            {live.recommendedLoan.maxAmount > 0 ? (
              <>
                Your budget fits a loan of up to <strong>{formatRand(live.recommendedLoan.maxAmount)}</strong>.
              </>
            ) : (
              "Your budget doesn't leave room for a repayment yet."
            )}
          </p>
          <VisuallyHidden as="p" aria-live="polite">
            {`Approval chance so far ${live.eligibilityResult.approvalLikelihood}%, ${status.label}.`}
          </VisuallyHidden>
        </>
      )}
    </section>
  );
}

/** Compact version for the phone action bar, where the side panel is off-screen while answering. */
export function ChancePill({ live }: { live: EligibilityResponse | null }) {
  if (!live) return null;
  const status = RISK_STATUS[live.eligibilityResult.riskCategory];
  return (
    <span className="chance-pill" aria-hidden="true">
      <Badge tone={status.tone} icon={status.icon} size="sm">
        {live.eligibilityResult.approvalLikelihood}% chance
      </Badge>
    </span>
  );
}
