import { Button, Card } from '@capitec/design-system';
import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useElementWidth } from '../../hooks/useElementWidth';
import { formatRand, formatRandCents } from '../../lib/format';
import type { PaymentRow } from '../../types';

const HEIGHT = 220;
const PAD = { top: 12, right: 8, bottom: 28, left: 56 };

/** Stacked monthly bars (principal + interest). Hover, or focus and use arrow keys, to inspect a month. */
export function RepaymentChart({ schedule }: { schedule: PaymentRow[] }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const n = schedule.length;
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  // Round the y-axis up to a clean step so ticks read R0 / R5k / R10k rather than R9.4k.
  const step = 2000;
  const max = Math.ceil((Math.max(...schedule.map((r) => r.payment)) * 1.05) / step) * step;
  const slot = plotW / n;
  const gap = n > 48 ? 1 : 2;
  const barW = Math.max(1, slot - gap);
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, max / 2, max];
  const labelEvery = n > 36 ? 12 : 6;

  const indexFromPointer = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left - PAD.left) / slot);
    return i >= 0 && i < n ? i : null;
  };

  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -n, End: n };
    if (!(e.key in moves)) return;
    e.preventDefault();
    setActive((i) => Math.min(n - 1, Math.max(0, (i ?? -1) + moves[e.key])));
  };

  const row = active != null ? schedule[active] : null;
  const totalInterest = schedule.reduce((s, r) => s + r.interest, 0);

  return (
    <Card
      title="Repayments over time"
      subtitle={`Early payments are mostly interest. Over the term you'd pay ${formatRand(totalInterest)} in interest.`}
      actions={
        <Button variant="ghost" size="sm" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable}>
          {showTable ? 'Show chart' : 'Show table'}
        </Button>
      }
    >

      <ul className="legend" aria-label="Legend">
        <li>
          <span className="swatch" style={{ background: 'var(--color-chart-principal)' }} aria-hidden="true" /> Principal
        </li>
        <li>
          <span className="swatch" style={{ background: 'var(--color-chart-interest)' }} aria-hidden="true" /> Interest
        </li>
      </ul>

      {showTable ? (
        <div className="table-scroll" tabIndex={0} aria-label="Repayment schedule table">
          <table className="schedule-table">
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Payment</th>
                <th scope="col">Principal</th>
                <th scope="col">Interest</th>
                <th scope="col">Balance</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((r) => (
                <tr key={r.month}>
                  <th scope="row">{r.month}</th>
                  <td>{formatRandCents(r.payment)}</td>
                  <td>{formatRandCents(r.principal)}</td>
                  <td>{formatRandCents(r.interest)}</td>
                  <td>{formatRandCents(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart" ref={ref}>
          <svg
            width={width}
            height={HEIGHT}
            className="chart__svg"
            role="img"
            tabIndex={0}
            aria-label={`Bar chart of ${n} monthly repayments split into principal and interest. Use arrow keys to inspect each month.`}
            onPointerMove={(e) => setActive(indexFromPointer(e))}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
          >
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="chart__grid" />
                <text x={PAD.left - 8} y={y(t)} className="chart__axis" textAnchor="end" dominantBaseline="middle">
                  {t >= 1000 ? `R${(t / 1000).toFixed(t % 1000 ? 1 : 0)}k` : `R${t}`}
                </text>
              </g>
            ))}
            {schedule.map((r, i) => {
              const x = PAD.left + i * slot + gap / 2;
              const dim = active != null && active !== i;
              // Principal sits on the baseline; interest stacks on top with a 2px surface gap between.
              const pTop = y(r.principal);
              const iTop = y(r.principal + r.interest);
              return (
                <g key={r.month} opacity={dim ? 0.45 : 1}>
                  <rect x={x} y={pTop} width={barW} height={y(0) - pTop} fill="var(--color-chart-principal)" rx={Math.min(2, barW / 2)} />
                  <rect x={x} y={iTop} width={barW} height={Math.max(0, pTop - iTop - 2)} fill="var(--color-chart-interest)" rx={Math.min(2, barW / 2)} />
                </g>
              );
            })}
            {schedule.map((r, i) =>
              r.month === 1 || r.month % labelEvery === 0 ? (
                <text key={r.month} x={PAD.left + i * slot + slot / 2} y={HEIGHT - 8} className="chart__axis" textAnchor="middle">
                  {r.month === 1 ? 'Month 1' : r.month}
                </text>
              ) : null,
            )}
          </svg>
          {row && (
            <div
              className="chart__tooltip"
              role="status"
              style={{ left: Math.min(width - 180, Math.max(0, PAD.left + active! * slot - 80)) }}
            >
              <p className="chart__tooltip-title">Month {row.month}</p>
              <dl>
                <div>
                  <dt>
                    <span className="swatch" style={{ background: 'var(--color-chart-principal)' }} /> Principal
                  </dt>
                  <dd>{formatRandCents(row.principal)}</dd>
                </div>
                <div>
                  <dt>
                    <span className="swatch" style={{ background: 'var(--color-chart-interest)' }} /> Interest
                  </dt>
                  <dd>{formatRandCents(row.interest)}</dd>
                </div>
                <div>
                  <dt>Balance after</dt>
                  <dd>{formatRandCents(row.balance)}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
