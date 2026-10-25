/** "Computer Maintenance Week 2026" → "computer-maintenance-week-2026-report.pdf" */
export function exportFileName(eventName: string, kind: string, extension: string) {
  const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "event";
  return `${slug}-${kind}.${extension}`;
}
