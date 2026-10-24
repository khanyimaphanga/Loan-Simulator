import { Button, Callout, Dialog, StatList } from '@capitec/design-system';
import { useState } from 'react';
import { useDocumentChecklist } from '../../hooks/useDocumentChecklist';
import { formatMonths, formatPercent, formatRand } from '../../lib/format';
import type { EligibilityResponse, EmploymentStatus } from '../../types';

interface ApplyDialogProps {
  open: boolean;
  onClose: () => void;
  loan: EligibilityResponse['recommendedLoan'];
  term: number;
  employmentStatus: EmploymentStatus;
}

/** A review step before committing: the loan in one place, and a plain account of what happens next. */
export function ApplyDialog({ open, onClose, loan, term, employmentStatus }: ApplyDialogProps) {
  const [started, setStarted] = useState(false);
  const close = () => {
    onClose();
    setStarted(false);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={started ? "You're on your way" : 'Apply for your loan'}
      actions={
        started ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="ghost" onClick={close}>
              Not now
            </Button>
            <Button iconEnd="arrowRight" onClick={() => setStarted(true)}>
              Start my application
            </Button>
          </>
        )
      }
    >
      {started ? (
        <Callout tone="success" icon="check">
          In the live service you'd now confirm your identity and upload your documents, with your answers already filled in. This is
          a simulation, so nothing has been submitted.
        </Callout>
      ) : (
        <Review loan={loan} term={term} employmentStatus={employmentStatus} />
      )}
    </Dialog>
  );
}

function Review({ loan, term, employmentStatus }: Omit<ApplyDialogProps, 'open' | 'onClose'>) {
  const { items, readyCount, allReady } = useDocumentChecklist(employmentStatus);

  return (
    <>
      <div className="apply-summary">
        <p className="apply-summary__amount">{formatRand(loan.recommendedAmount)}</p>
        <p className="apply-summary__payment">
          <strong>{formatRand(loan.monthlyPayment)}</strong> a month for {formatMonths(term)}
        </p>
        <StatList
          items={[
            { label: 'Estimated interest rate', value: formatPercent(loan.interestRate, 2) },
            { label: "Total you'd repay", value: formatRand(loan.totalRepayment) },
          ]}
        />
      </div>

      <div>
        <h3 className="apply-steps__title">What happens next</h3>
        <ol className="apply-steps">
          <li>
            <strong>Confirm it's you.</strong> A quick identity check. Your answers from the simulator carry over.
          </li>
          <li>
            <strong>Share your documents.</strong>{' '}
            {allReady
              ? "You've got everything ready."
              : `You've ticked off ${readyCount} of ${items.length}. You can add the rest as you go.`}
          </li>
          <li>
            <strong>Get your final offer.</strong> You'll see your exact rate and repayment before you accept anything.
          </li>
        </ol>
      </div>

      <p className="apply-note">This is an estimate. Your final offer depends on a credit check and verifying your income.</p>
    </>
  );
}
