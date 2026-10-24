import { Button, Callout, Card, Checkbox, Meter } from '@capitec/design-system';
import { useDocumentChecklist } from '../../hooks/useDocumentChecklist';
import type { EmploymentStatus } from '../../types';

interface ApplyChecklistProps {
  employmentStatus: EmploymentStatus;
  /** Offered once everything is ticked, if the current result is one they can apply for. */
  onApply?: () => void;
}

export function ApplyChecklist({ employmentStatus, onApply }: ApplyChecklistProps) {
  const { items, done, readyCount, allReady, toggle } = useDocumentChecklist(employmentStatus);
  const progress = `${readyCount} of ${items.length} ready`;

  return (
    <Card
      title="Get ready to apply"
      titleIcon="check"
      subtitle="Having these to hand makes a real application much quicker. Tick them off as you find them."
    >
      <div className="checklist__progress">
        <strong>{progress}</strong>
        <Meter value={readyCount} max={items.length} tone={allReady ? 'success' : 'brand'} label="Documents ready" valueText={progress} />
      </div>
      <ul className="checklist">
        {items.map((item) => (
          <li key={item.id}>
            <Checkbox label={item.label} checked={!!done[item.id]} onChange={(checked) => toggle(item.id, checked)} />
          </li>
        ))}
      </ul>
      {allReady && (
        <Callout
          tone="success"
          role="status"
          action={
            onApply && (
              <Button size="sm" iconEnd="arrowRight" onClick={onApply}>
                Apply now
              </Button>
            )
          }
        >
          You're all set. You have everything you'd typically need when you decide to apply.
        </Callout>
      )}
    </Card>
  );
}
