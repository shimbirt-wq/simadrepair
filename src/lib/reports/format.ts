/** Display helpers shared by the report page and the PDF. */

export const formatPercent = (rate: number | null) => (rate === null ? "-" : `${Math.round(rate * 100)}%`);

export function formatHours(hours: number | null) {
  if (hours === null) return "-";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours * 10) / 10} h`;
  return `${Math.round((hours / 24) * 10) / 10} days`;
}

export const formatRating = (rating: number | null) => (rating === null ? "-" : `${(Math.round(rating * 10) / 10).toFixed(1)} / 5`);
