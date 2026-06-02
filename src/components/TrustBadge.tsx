/**
 * TrustBadge — Contextual trust score display component.
 *
 * Uses the Trust Intelligence Engine's getTrustScoreStyle() to produce
 * dynamically colored badges with smooth visual transitions.
 *
 * Safe for client and server rendering — no hooks, no state.
 */

import { getTrustScoreStyle } from '@/services/trustEngine';

interface TrustBadgeProps {
  score: number;
  showBar?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function TrustBadge({
  score,
  showBar = true,
  showLabel = false,
  size = 'md',
  className = '',
}: TrustBadgeProps) {
  const style = getTrustScoreStyle(score);

  const textSize =
    size === 'sm' ? 'text-xs' :
    size === 'lg' ? 'text-base font-bold' :
    'text-sm font-semibold';

  const barWidth = size === 'sm' ? 'w-16' : size === 'lg' ? 'w-28' : 'w-20';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showBar && (
        <div className={`${barWidth} h-1.5 bg-slate-100 rounded-full overflow-hidden flex-shrink-0`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${style.bar}`}
            style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          />
        </div>
      )}
      <span className={`${textSize} ${style.text} tabular-nums transition-colors duration-300`}>
        {score}
      </span>
      {showLabel && (
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${style.badge} transition-colors duration-300`}>
          {style.label}
        </span>
      )}
    </div>
  );
}
