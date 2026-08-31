import { Badge } from '../ui/badge';

export function CashbackBadge({ rate }: { rate: number }) {
  return <Badge>{rate}% cashback</Badge>;
}
