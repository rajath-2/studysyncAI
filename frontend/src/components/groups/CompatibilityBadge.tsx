import { getCompatibilityBadgeClass, getCompatibilityLabel } from '@/services/compatibility';

interface CompatibilityBadgeProps {
  score: number;
  showLabel?: boolean;
}

export function CompatibilityBadge({ score, showLabel = true }: CompatibilityBadgeProps) {
  const colorClass = getCompatibilityBadgeClass(score);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      <span className="font-bold mr-1">{score}%</span>
      {showLabel && <span>{getCompatibilityLabel(score)}</span>}
    </span>
  );
}