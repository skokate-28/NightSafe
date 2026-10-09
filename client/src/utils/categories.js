import {
  Lightbulb, AlertTriangle, ShoppingBag, ShieldAlert,
  Eye, Construction, HelpCircle,
} from 'lucide-react';

export const CATEGORIES = [
  { value: 'poorly_lit', label: 'Poorly Lit', color: '#F59E0B', icon: Lightbulb },
  { value: 'harassment', label: 'Harassment', color: '#EF4444', icon: AlertTriangle },
  { value: 'theft', label: 'Theft', color: '#F97316', icon: ShoppingBag },
  { value: 'assault', label: 'Assault', color: '#DC2626', icon: ShieldAlert },
  { value: 'suspicious_activity', label: 'Suspicious Activity', color: '#A855F7', icon: Eye },
  { value: 'unsafe_infrastructure', label: 'Unsafe Infrastructure', color: '#6B7280', icon: Construction },
  { value: 'other', label: 'Other', color: '#9CA3AF', icon: HelpCircle },
];

export function getCategory(value) {
  return CATEGORIES.find((c) => c.value === value) || CATEGORIES[CATEGORIES.length - 1];
}

export const SEVERITY_LABELS = {
  1: 'Minor',
  2: 'Low',
  3: 'Moderate',
  4: 'High',
  5: 'Critical',
};
