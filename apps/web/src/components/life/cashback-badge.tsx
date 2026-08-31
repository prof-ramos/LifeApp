import { Badge } from '@/components/ui/badge';

export function CashbackBadge({ rate }: { rate: number }) {
  return <Badge aria-label={`${rate}% de cashback`}>{rate}% cashback</Badge>;
}
