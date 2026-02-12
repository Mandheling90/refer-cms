import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'Y' | 'N' | string;
  activeLabel?: string;
  inactiveLabel?: string;
}

export function StatusBadge({
  status,
  activeLabel = '사용',
  inactiveLabel = '미사용',
}: StatusBadgeProps) {
  const isActive = status === 'Y';
  return (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  );
}
