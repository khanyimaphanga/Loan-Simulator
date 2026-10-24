import type { ImprovementLever } from '../../types';
import { Button, Card, Icon, VisuallyHidden } from '@capitec/design-system';

interface LeverListProps {
  levers: ImprovementLever[];
  onApply: (lever: ImprovementLever) => void;
}

/** The "path to yes": simulated changes, ranked by how much each would lift the likelihood. Only shown when there are some. */
export function LeverList({ levers, onApply }: LeverListProps) {
  return (
    <Card
      tone="accent"
      title="Boost your chances"
      titleIcon="sparkle"
      subtitle="We tested a few realistic changes. These would make the biggest difference:"
    >
      <ul className="levers">
        {levers.map((lever) => (
          <li key={lever.id} className="lever">
            <div className="lever__text">
              <p className="lever__title">{lever.title}</p>
              <p className="lever__desc">{lever.description}</p>
            </div>
            <div className="lever__action">
              <span className="lever__delta" aria-label={`Likelihood rises by ${lever.delta} points to ${lever.newLikelihood}%`}>
                <Icon name="trendUp" size={16} />+{lever.delta}%
              </span>
              <Button variant="secondary" size="sm" onClick={() => onApply(lever)}>
                Try this<VisuallyHidden>: {lever.title}</VisuallyHidden>
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
