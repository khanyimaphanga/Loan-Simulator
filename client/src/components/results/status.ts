import type { RiskCategory } from '../../types';
import type { IconName } from '@capitec/design-system';

export const RISK_STATUS: Record<RiskCategory, { label: string; tone: 'success' | 'warning' | 'danger'; icon: IconName }> = {
  low: { label: 'Strong chance', tone: 'success', icon: 'check' },
  medium: { label: 'Fair chance', tone: 'warning', icon: 'minus' },
  high: { label: 'Unlikely right now', tone: 'danger', icon: 'alert' },
};
