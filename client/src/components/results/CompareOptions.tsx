import { Badge, Button, Card, IconButton, Meter, StatList } from '@capitec/design-system';
import { MAX_SAVED, type SavedOption } from '../../hooks/useSavedOptions';
import { formatMonths, formatRand } from '../../lib/format';
import { RISK_STATUS } from './status';

interface CompareOptionsProps {
  options: SavedOption[];
  /** The option currently loaded in the simulator, if it's one of the saved ones. */
  currentId: string | null;
  onLoad: (option: SavedOption) => void;
  onRemove: (id: string) => void;
}

/** Side-by-side view of saved what-ifs, so trade-offs (chance vs cost) are easy to weigh. */
export function CompareOptions({ options, currentId, onLoad, onRemove }: CompareOptionsProps) {
  const bestChance = options.length > 1 ? Math.max(...options.map((o) => o.likelihood)) : null;
  const lowestCost = options.length > 1 ? Math.min(...options.map((o) => o.totalRepayment)) : null;

  return (
    <Card
      title="Compare your options"
      titleIcon="bookmark"
      subtitle={
        options.length < MAX_SAVED
          ? `Save up to ${MAX_SAVED} options from "Fine-tune your loan" to weigh them up. Load one to keep exploring from there.`
          : `You can compare ${MAX_SAVED} options at a time. Remove one to save another.`
      }
    >
      <ul className="options">
        {options.map((option, i) => {
          const status = RISK_STATUS[option.risk];
          const { requestedAmount, loanTerm } = option.request.loanDetails;
          const isCurrent = option.id === currentId;
          return (
            <li key={option.id} className={`option${isCurrent ? ' option--current' : ''}`}>
              <div className="option__head">
                <span className="option__name">Option {i + 1}</span>
                <IconButton icon="trash" label={`Remove option ${i + 1}`} className="option__remove" onClick={() => onRemove(option.id)} />
              </div>
              <p className="option__amount">{formatRand(requestedAmount)}</p>
              <p className="option__terms">
                <strong>{formatRand(option.monthly)}</strong>/month for {formatMonths(loanTerm)}
              </p>
              <div className="option__badges">
                {option.likelihood === bestChance && (
                  <Badge tone="success" icon="trendUp" size="sm">
                    Best chance
                  </Badge>
                )}
                {option.totalRepayment === lowestCost && (
                  <Badge tone="brand" icon="check" size="sm">
                    Lowest total cost
                  </Badge>
                )}
              </div>
              <Meter value={option.likelihood} tone={status.tone} label={`Option ${i + 1} approval likelihood`} />
              <StatList
                plain
                items={[
                  { label: 'Chance of approval', value: `${option.likelihood}% · ${status.label}` },
                  { label: "Total you'd repay", value: formatRand(option.totalRepayment) },
                ]}
              />
              <Button variant={isCurrent ? 'ghost' : 'secondary'} size="sm" disabled={isCurrent} onClick={() => onLoad(option)}>
                {isCurrent ? 'Showing now' : 'Load this option'}
              </Button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
