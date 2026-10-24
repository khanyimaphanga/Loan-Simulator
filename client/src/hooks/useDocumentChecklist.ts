import { STORAGE_KEYS } from '../lib/storage';
import type { EmploymentStatus } from '../types';
import { useSessionState } from './useSessionState';

interface ChecklistItem {
  id: string;
  label: string;
}

const BANK_3_MONTHS: ChecklistItem = { id: 'bank', label: "Your last 3 months' bank statements" };

// Typical documents for a South African personal loan. Proof of income depends on how someone earns.
const INCOME_PROOF: Record<EmploymentStatus, ChecklistItem[]> = {
  employed: [{ id: 'payslip', label: 'Your latest payslip' }, BANK_3_MONTHS],
  self_employed: [
    { id: 'bank', label: "Your last 6 months' bank statements" },
    { id: 'business', label: 'Proof of business income, such as recent financial statements' },
  ],
  retired: [{ id: 'pension', label: 'Your latest pension or annuity statement' }, BANK_3_MONTHS],
  unemployed: [BANK_3_MONTHS],
};

/** The documents to have ready for an application, and which ones have been ticked off this session. */
export function useDocumentChecklist(status: EmploymentStatus) {
  const items = [
    { id: 'id', label: 'Your green barcoded ID book or smart ID card' },
    ...INCOME_PROOF[status],
    { id: 'address', label: 'Proof of address from the last 3 months' },
  ];
  const [done, setDone] = useSessionState<Record<string, boolean>>(STORAGE_KEYS.checklist, {});
  const readyCount = items.filter((item) => done[item.id]).length;

  return {
    items,
    done,
    readyCount,
    allReady: readyCount === items.length,
    toggle: (id: string, checked: boolean) => setDone((d) => ({ ...d, [id]: checked })),
  };
}
