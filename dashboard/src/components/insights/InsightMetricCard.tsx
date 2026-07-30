import type { LucideIcon } from 'lucide-react';
import type { InsightTone } from '../../lib/insightsApi';

const toneStyles: Record<InsightTone, { bg: string; color: string }> = {
  positive: { bg: 'rgba(22,163,74,0.1)', color: '#16a34a' },
  neutral: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
  warning: { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
  critical: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
};

interface Props {
  label: string;
  value: string;
  detail: string;
  tone: InsightTone;
  Icon: LucideIcon;
}

export default function InsightMetricCard({ label, value, detail, tone, Icon }: Props) {
  const toneStyle = toneStyles[tone];

  return (
    <div className="stat-card" style={{ display: 'grid', gap: '0.7rem' }}>
      <div className="stat-card-icon" style={{ background: toneStyle.bg }}>
        <Icon size={17} color={toneStyle.color} />
      </div>
      <div className="stat-card-value mono" style={{ fontSize: '1.55rem' }}>{value}</div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-sub" style={{ lineHeight: 1.55 }}>{detail}</div>
    </div>
  );
}