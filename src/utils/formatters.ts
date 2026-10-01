/**
 * Formatting helpers for PGA TOUR 2K25 Course Explorer
 * Adheres strictly to Section 52: Standardized course-length yardage/metre formatting.
 */

import { CourseDataProvider } from '../services/CourseDataProvider';

export function formatYardage(yards: number, unitPreference: 'yards' | 'metres' | 'both' = 'yards'): string {
  if (!yards || isNaN(yards)) return 'Yardage not available';

  const formattedYards = `${yards.toLocaleString()} yards`;
  const metres = CourseDataProvider.yardsToMetres(yards);
  const formattedMetres = `${metres.toLocaleString()} metres`;

  if (unitPreference === 'metres') {
    return formattedMetres;
  }
  if (unitPreference === 'both') {
    return `${formattedYards} / ${metres.toLocaleString()} m`;
  }
  return formattedYards;
}

export function formatDifficulty(score: number): { text: string; colorClass: string; badgeBg: string } {
  const rounded = score.toFixed(1);
  if (score < 5.0) {
    return {
      text: `${rounded} / 10 · Easy`,
      colorClass: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/40 border-emerald-700/40 text-emerald-300',
    };
  }
  if (score < 7.5) {
    return {
      text: `${rounded} / 10 · Moderate`,
      colorClass: 'text-amber-400',
      badgeBg: 'bg-amber-950/40 border-amber-700/40 text-amber-300',
    };
  }
  if (score < 9.0) {
    return {
      text: `${rounded} / 10 · Difficult`,
      colorClass: 'text-orange-400',
      badgeBg: 'bg-orange-950/40 border-orange-700/40 text-orange-300',
    };
  }
  return {
    text: `${rounded} / 10 · Very Difficult`,
    colorClass: 'text-rose-400',
    badgeBg: 'bg-rose-950/40 border-rose-700/40 text-rose-300',
  };
}

export function formatDate(dateString: string): string {
  if (!dateString) return 'Not available';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
