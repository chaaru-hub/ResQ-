import React from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldCheck } from 'lucide-react';

export const PriorityBadge = ({ level = 'Medium', score = null, showIcon = true }) => {
  const normalized = (level || 'Medium').toLowerCase();

  let badgeClass = 'badge-medium';
  let IconComponent = Info;
  let label = level;

  if (normalized.includes('critical') || (score !== null && score >= 80)) {
    badgeClass = 'badge-critical';
    IconComponent = AlertTriangle;
    label = 'Critical';
  } else if (normalized.includes('high') || (score !== null && score >= 60)) {
    badgeClass = 'badge-high';
    IconComponent = AlertCircle;
    label = 'High';
  } else if (normalized.includes('medium') || (score !== null && score >= 40)) {
    badgeClass = 'badge-medium';
    IconComponent = Info;
    label = 'Medium';
  } else if (normalized.includes('low') || (score !== null && score < 40)) {
    badgeClass = 'badge-low';
    IconComponent = ShieldCheck;
    label = 'Low';
  }

  return (
    <span className={badgeClass}>
      {showIcon && <IconComponent className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {score !== null && <span className="ml-1 opacity-80">({score})</span>}
    </span>
  );
};
