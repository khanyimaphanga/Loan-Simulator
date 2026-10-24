import { Button, Callout, Card, Confetti, Icon, VisuallyHidden } from '@capitec/design-system';
import { useEffect, useRef, useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { useSavedOptions } from '../../hooks/useSavedOptions';
import { useScenario } from '../../hooks/useScenario';
import type { EligibilityRequest, EligibilityResponse, LoanProduct } from '../../types';
import { ApplyBar } from './ApplyBar';
import { ApplyChecklist } from './ApplyChecklist';
import { ApplyDialog } from './ApplyDialog';
import { BudgetBreakdown } from './BudgetBreakdown';
import { CompareOptions } from './CompareOptions';
import { FactorList } from './FactorList';
import { LeverList } from './LeverList';
import { LikelihoodGauge } from './LikelihoodGauge';
import { OfferCard } from './OfferCard';
import { RepaymentChart } from './RepaymentChart';
import { WhatIfCard } from './WhatIfCard';

interface ResultsViewProps {
  initialRequest: EligibilityRequest;
  initialResult: EligibilityResponse;
  product: LoanProduct;
  onEdit: () => void;
  onRestart: () => void;
}

/**
 * Results are a live sandbox rather than a dead end: the sliders and "Try this" suggestions re-run the
 * simulation so people can work their way to a loan that fits.
 */
export function ResultsView({ initialRequest, initialResult, product, onEdit, onRestart }: ResultsViewProps) {
  const { scenario, key, setScenario, setLoan, applyLever, reset, isModified, result, rate, error, updating } = useScenario(
    initialRequest,
    initialResult,
    product,
  );
  const options = useSavedOptions(key);
  const [applyOpen, setApplyOpen] = useState(false);
  const [milestone, setMilestone] = useState(false);
  // One confetti burst per good-news moment: arriving with a likely yes, or a what-if that turns into one.
  const [celebration, setCelebration] = useState(initialResult.eligibilityResult.isEligible ? 1 : 0);
  const wasEligible = useRef(initialResult.eligibilityResult.isEligible);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const { eligibilityResult: verdict, recommendedLoan: loan, affordabilityAnalysis: analysis } = result;
  const canApply = verdict.isEligible && loan.recommendedAmount > 0;
  const ctaInView = useInView(ctaRef, canApply);
  const hasLevers = result.improvementLevers.length > 0;
  const diff = verdict.approvalLikelihood - initialResult.eligibilityResult.approvalLikelihood;
  const canSave = !updating && !options.current && !options.isFull && rate != null;
  const term = scenario.loanDetails.loanTerm;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    const eligible = result.eligibilityResult.isEligible;
    if (eligible && !wasEligible.current) {
      setMilestone(true);
      setCelebration((n) => n + 1);
    }
    if (!eligible) setMilestone(false);
    wasEligible.current = eligible;
  }, [result]);

  const saveOption = () => {
    if (!canSave) return;
    options.save(scenario, result, rate);
    setMilestone(false);
  };

  const saveButton = (
    <Button variant="secondary" size="sm" iconStart={options.current ? 'check' : 'bookmark'} disabled={!canSave} onClick={saveOption}>
      {options.current ? 'Saved' : 'Save this option'}
    </Button>
  );
  const openApply = () => setApplyOpen(true);

  return (
    <div className={canApply ? 'results results--can-apply container' : 'results container'}>
      {celebration > 0 && <Confetti key={celebration} />}
      <VisuallyHidden as="p" aria-live="polite">
        {updating ? '' : `Approval likelihood ${verdict.approvalLikelihood}%. ${verdict.decisionReason}`}
      </VisuallyHidden>

      <p className="eyebrow">Your result</p>
      <h1 className="results__title" ref={headingRef} tabIndex={-1}>
        {verdict.isEligible ? "Good news: you're likely to qualify" : "Not quite there yet. Here's how to get there."}
      </h1>

      {isModified && (
        <div className="scenario-banner" role="status">
          <Icon name="sparkle" />
          <span>
            You're exploring a what-if
            {diff !== 0 && (
              <strong className={diff > 0 ? 'text-success' : 'text-danger'}>
                {' '}
                ({diff > 0 ? '+' : ''}
                {diff}% vs your original)
              </strong>
            )}
          </span>
          <Button variant="ghost" size="sm" iconStart="refresh" onClick={reset}>
            Reset
          </Button>
        </div>
      )}

      {milestone && (
        <Callout tone="success" icon="sparkle" role="status" className="milestone" action={canSave ? saveButton : undefined}>
          <strong>You've found a loan you're likely to qualify for.</strong> Save it to compare with other options.
        </Callout>
      )}

      {error && (
        <Callout tone="danger" role="alert">
          {error}
        </Callout>
      )}

      <div className={updating ? 'results__grid is-updating' : 'results__grid'} aria-busy={updating}>
        <Card className="verdict" aria-labelledby="verdict-title">
          <VisuallyHidden as="h2" id="verdict-title">
            Eligibility
          </VisuallyHidden>
          <LikelihoodGauge likelihood={verdict.approvalLikelihood} risk={verdict.riskCategory} />
          <p className="verdict__reason">{verdict.decisionReason}</p>
        </Card>

        <OfferCard
          loan={loan}
          requested={scenario.loanDetails.requestedAmount}
          term={term}
          canApply={canApply}
          onApply={openApply}
          onUseMax={() => setLoan({ requestedAmount: loan.maxAmount })}
          ctaRef={ctaRef}
        />

        <WhatIfCard
          loanDetails={scenario.loanDetails}
          product={product}
          maxAmount={loan.maxAmount}
          analysis={analysis}
          onChange={setLoan}
          wide={!hasLevers}
          actions={saveButton}
        />
        {hasLevers && <LeverList levers={result.improvementLevers} onApply={applyLever} />}

        {options.saved.length > 0 && (
          <div className="results__wide">
            <CompareOptions
              options={options.saved}
              currentId={options.current?.id ?? null}
              onLoad={(option) => setScenario(option.request)}
              onRemove={options.remove}
            />
          </div>
        )}

        <BudgetBreakdown request={scenario} analysis={analysis} />
        <FactorList factors={result.factors} />

        {rate && (
          <div className="results__wide">
            <RepaymentChart schedule={rate.paymentSchedule} />
          </div>
        )}

        <div className="results__wide">
          <ApplyChecklist employmentStatus={initialRequest.personalInfo.employmentStatus} onApply={canApply ? openApply : undefined} />
        </div>
      </div>

      <div className="results__actions">
        <Button variant="secondary" iconStart="pencil" onClick={onEdit}>
          Edit my details
        </Button>
        <Button variant="ghost" iconStart="printer" onClick={() => window.print()}>
          Save as PDF
        </Button>
        <Button variant="ghost" iconStart="refresh" onClick={onRestart}>
          Start over
        </Button>
      </div>

      <p className="disclaimer">
        This is an estimate based on the information you gave and simulated lending rules. It isn't a credit offer or a credit check,
        and it doesn't affect your credit score.
      </p>

      {canApply && !ctaInView && !applyOpen && <ApplyBar loan={loan} term={term} onApply={openApply} />}

      <ApplyDialog
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        loan={loan}
        term={term}
        employmentStatus={initialRequest.personalInfo.employmentStatus}
      />
    </div>
  );
}
