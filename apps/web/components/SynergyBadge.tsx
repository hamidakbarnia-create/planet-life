import { BADGE_STYLES } from '@/lib/synergy';
import type { SynergyBadge as Badge } from '@/lib/people-storage';

export function SynergyBadgePill({
  badge,
  label,
}: {
  badge: Badge;
  label: string;
}) {
  const s = BADGE_STYLES[badge];
  return (
    <span
      className="fi text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {label}
    </span>
  );
}
