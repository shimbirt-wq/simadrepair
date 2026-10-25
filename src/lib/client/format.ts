/** "now", "12m", "3h", "2d" — compact age for cards. */
export function shortAge(fromIso: string, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 60000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const dateTime = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Mogadishu" });

export function formatDateTime(iso: string | Date) {
  return dateTime.format(new Date(iso));
}
