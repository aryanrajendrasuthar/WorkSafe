import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, format = 'MMM d, yyyy') {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {};

  if (format === 'MMM d, yyyy') {
    options.month = 'short';
    options.day = 'numeric';
    options.year = 'numeric';
  } else if (format === 'relative') {
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return d.toLocaleDateString('en-US', options);
}

export function getRiskColor(score: number) {
  if (score >= 75) return 'text-risk-critical';
  if (score >= 50) return 'text-risk-high';
  if (score >= 25) return 'text-risk-medium';
  return 'text-risk-low';
}

export function getRiskBgColor(score: number) {
  if (score >= 75) return 'bg-red-50 text-red-700 border-red-200';
  if (score >= 50) return 'bg-orange-50 text-orange-700 border-orange-200';
  if (score >= 25) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-green-50 text-green-700 border-green-200';
}

export function getRiskLabel(score: number) {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

export function getPainColor(intensity: number) {
  if (intensity >= 8) return '#ef4444';
  if (intensity >= 6) return '#f97316';
  if (intensity >= 4) return '#f59e0b';
  if (intensity >= 2) return '#84cc16';
  return '#22c55e';
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}
