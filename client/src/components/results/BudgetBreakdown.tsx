import { Badge, Card, StatList, type BadgeTone } from '@capitec/design-system';
import { useState } from 'react';
import { formatPercent, formatRand } from '../../lib/format';
import type { AffordabilityScore, EligibilityRequest, EligibilityResponse } from '../../types';

const AFFORDABILITY: Record<AffordabilityScore, { label: string; tone: BadgeTone }> = {
  excellent: { label: 'Excellent', tone: 'success' },
  good: { label: 'Good', tone: 'success' },
  fair: { label: 'Fair', tone: 'warning' },
  poor: { label: 'Stretched', tone: 'danger' },
};

interface BudgetBreakdownProps {
  request: EligibilityRequest;
  analysis: EligibilityResponse['affordabilityAnalysis'];
}

interface Segment {
  id: string;
  label: string;
  amount: number;
  colorVar: string;
}

/** Where every rand of income goes once the new repayment is added. Legend doubles as the data table. */
export function BudgetBreakdown({ request, analysis }: BudgetBreakdownProps) {
  const [active, setActive] = useState<string | null>(null);
  const income = request.financialInfo.monthlyIncome;
  const debt = request.financialInfo.existingDebt ?? 0;
  const living = request.financialInfo.monthlyExpenses - debt;
  const leftOver = analysis.remainingAfterLoan;
  const overBudget = leftOver < 0;
  const affordability = AFFORDABILITY[analysis.affordabilityScore];

  const segments: Segment[] = [
    { id: 'living', label: 'Living costs', amount: living, colorVar: '--color-chart-living' },
    { id: 'debt', label: 'Existing debt', amount: debt, colorVar: '--color-chart-debt' },
    { id: 'loan', label: 'This loan', amount: analysis.newRepayment, colorVar: '--color-chart-loan' },
  ].filter((s) => s.amount > 0);

  // When over budget, scale to total outgoings so the overflow is visible against the income marker.
  const scale = Math.max(income, segments.reduce((s, x) => s + x.amount, 0));
  const pct = (n: number) => `${(n / scale) * 100}%`;

  return (
    <Card title="Your monthly budget" subtitle={`How your ${formatRand(income)} income would be spent with this loan.`}>

      <div className="budget-bar" onMouseLeave={() => setActive(null)}>
        {segments.map((s) => (
          <span
            key={s.id}
            className={`budget-bar__segment${active && active !== s.id ? ' is-dimmed' : ''}`}
            style={{ width: pct(s.amount), background: `var(${s.colorVar})` }}
            onMouseEnter={() => setActive(s.id)}
            title={`${s.label}: ${formatRand(s.amount)}`}
          />
        ))}
        {!overBudget && <span className="budget-bar__segment budget-bar__segment--rest" style={{ width: pct(leftOver) }} />}
        {overBudget && <span className="budget-bar__income-marker" style={{ left: pct(income) }} aria-hidden="true" />}
      </div>

      <ul className="legend-table">
        {segments.map((s) => (
          <li
            key={s.id}
            className={active && active !== s.id ? 'is-dimmed' : undefined}
            onMouseEnter={() => setActive(s.id)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="swatch" style={{ background: `var(${s.colorVar})` }} aria-hidden="true" />
            <span className="legend-table__label">{s.label}</span>
            <span className="legend-table__value">{formatRand(s.amount)}</span>
            <span className="legend-table__share">{Math.round((s.amount / income) * 100)}%</span>
          </li>
        ))}
        <li className="legend-table__total">
          <span className="swatch swatch--outline" aria-hidden="true" />
          <span className="legend-table__label">{overBudget ? 'Shortfall' : 'Left over'}</span>
          <span className={`legend-table__value${overBudget ? ' text-danger' : ''}`}>{formatRand(leftOver)}</span>
          <span className="legend-table__share">{Math.round((leftOver / income) * 100)}%</span>
        </li>
      </ul>

      <StatList
        items={[
          { label: 'Existing debt vs income', value: formatPercent(analysis.debtToIncomeRatio) },
          { label: 'Loan vs yearly income', value: formatPercent(analysis.loanToIncomeRatio) },
          {
            label: 'Affordability',
            value: (
              <Badge tone={affordability.tone} size="sm">
                {affordability.label}
              </Badge>
            ),
          },
        ]}
      />
    </Card>
  );
}
