import type { CountRow, EventReport, GroupRow } from "@/lib/reports/event-report";
import { formatHours, formatPercent, formatRating } from "@/lib/reports/format";
import { A4, fit, hex, OnePagePdf } from "@/lib/reports/pdf";

/** One-page event summary for faculty heads and management (AD3). */

const ACCENT = hex("#0F7A45");
const ACCENT_SOFT = hex("#E3F2EA");
const INK = hex("#141A17");
const MUTED = hex("#5F6B65");
const LINE = hex("#DCE3DF");
const SURFACE = hex("#F5F7F6");
const WHITE = hex("#FFFFFF");

const M = 40;
const W = A4.width - M * 2;
const stamp = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Mogadishu" });

function heading(pdf: OnePagePdf, x: number, y: number, label: string) {
  pdf.text(x, y, label.toUpperCase(), { size: 7.5, bold: true, color: MUTED });
}

function tiles(pdf: OnePagePdf, y: number, items: Array<[string, string]>, height: number, valueSize: number) {
  const gap = 8;
  const w = (W - gap * (items.length - 1)) / items.length;
  items.forEach(([label, value], i) => {
    const x = M + i * (w + gap);
    pdf.rect(x, y, w, height, SURFACE);
    pdf.text(x + 9, y + 15, label, { size: 7.5, color: MUTED });
    pdf.text(x + 9, y + height - 10, value, { size: valueSize, bold: true, color: INK });
  });
}

function bars(pdf: OnePagePdf, x: number, y: number, w: number, title: string, rows: CountRow[], max = 6) {
  heading(pdf, x, y, title);
  const shown = rows.slice(0, max);
  if (shown.length === 0) pdf.text(x, y + 18, "No repairs recorded yet.", { size: 8.5, color: MUTED });
  const top = Math.max(1, ...shown.map((r) => r.count));
  const labelW = w * 0.45;
  shown.forEach((row, i) => {
    const rowY = y + 16 + i * 16;
    pdf.text(x, rowY + 8, fit(row.label, labelW - 6, 8.5), { size: 8.5, color: INK });
    const barW = Math.max(2, ((w - labelW - 28) * row.count) / top);
    pdf.rect(x + labelW, rowY, barW, 10, ACCENT);
    pdf.text(x + labelW + barW + 4, rowY + 8, String(row.count), { size: 8.5, color: INK });
  });
}

type Column = { label: string; width: number; align?: "left" | "right" };

function table(pdf: OnePagePdf, x: number, y: number, title: string, columns: Column[], rows: string[][], empty: string) {
  heading(pdf, x, y, title);
  let cx = x;
  const positions = columns.map((c) => {
    const left = cx;
    cx += c.width;
    return c.align === "right" ? left + c.width : left;
  });
  const headY = y + 16;
  columns.forEach((c, i) => pdf.text(positions[i], headY, c.label, { size: 7.5, color: MUTED, align: c.align }));
  pdf.line(x, headY + 4, cx, LINE);
  if (rows.length === 0) pdf.text(x, headY + 17, empty, { size: 8.5, color: MUTED });
  rows.forEach((row, r) => {
    const rowY = headY + 17 + r * 14;
    row.forEach((cell, i) => {
      const c = columns[i];
      pdf.text(positions[i], rowY, i === 0 ? fit(cell, c.width - 6, 8.5) : cell, { size: 8.5, color: INK, align: c.align });
    });
  });
  return headY + 17 + Math.max(1, rows.length) * 14;
}

const groupRows = (rows: GroupRow[], max: number) => {
  const shown = rows.slice(0, max);
  const rest = rows.slice(max);
  if (rest.length) shown[shown.length - 1] = rest.reduce((acc, r) => ({ label: "Other", registered: acc.registered + r.registered, fixed: acc.fixed + r.fixed }), { ...shown[shown.length - 1], label: "Other" });
  return shown.map((r) => [r.label, String(r.registered), String(r.fixed)]);
};

export function renderEventReportPdf(report: EventReport): Buffer {
  const pdf = new OnePagePdf();
  const s = report.summary;

  // Header band
  pdf.rect(0, 0, A4.width, 96, ACCENT);
  pdf.text(M, 32, "SIMAD UNIVERSITY IT SERVICE DESK", { size: 8, bold: true, color: ACCENT_SOFT });
  pdf.text(M, 58, fit(report.event.name, W, 20, true), { size: 20, bold: true, color: WHITE });
  pdf.text(M, 78, `${report.event.dates}  ·  ${report.event.venue}`, { size: 9.5, color: ACCENT_SOFT });

  let y = 116;
  tiles(
    pdf,
    y,
    [
      ["Registered", String(s.registered)],
      ["Received", String(s.received)],
      ["Fixed", String(s.fixed)],
      ["Cannot repair", String(s.cannotRepair)],
      ["Collected", String(s.collected)],
      ["Uncollected", String(s.uncollected)],
    ],
    50,
    18,
  );
  y += 58;
  tiles(
    pdf,
    y,
    [
      ["Fix rate (of finished)", formatPercent(s.fixRate)],
      ["Median time, received to ready", formatHours(s.medianHoursToReady)],
      [`Average rating (${s.ratings} ${s.ratings === 1 ? "rating" : "ratings"})`, formatRating(s.averageRating)],
    ],
    44,
    15,
  );

  y += 72;
  const half = (W - 24) / 2;
  bars(pdf, M, y, half, "Top faults found", report.topFaults);
  bars(pdf, M + half + 24, y, half, "Top work done", report.topActions);

  y += 16 + 6 * 16 + 18;
  const groupCols = (label: string): Column[] => [
    { label, width: half - 110 },
    { label: "Registered", width: 55, align: "right" },
    { label: "Fixed", width: 55, align: "right" },
  ];
  const a = table(pdf, M, y, "By faculty", groupCols("Faculty"), groupRows(report.byFaculty, 7), "No requests yet.");
  const b = table(pdf, M + half + 24, y, "By device type", groupCols("Device"), groupRows(report.byDeviceType, 7), "No requests yet.");

  y = Math.max(a, b) + 14;
  y =
    table(
      pdf,
      M,
      y,
      report.byTechnician.length > 8 ? `Technicians (top 8 of ${report.byTechnician.length})` : "Technicians",
      [
        { label: "Technician", width: W - 240 },
        { label: "Fixed", width: 60, align: "right" },
        { label: "Cannot repair", width: 70, align: "right" },
        { label: "Open", width: 50, align: "right" },
        { label: "Rating", width: 60, align: "right" },
      ],
      report.byTechnician.slice(0, 8).map((t) => [t.name, String(t.fixed), String(t.cannotRepair), String(t.open), formatRating(t.averageRating)]),
      "No technician work recorded yet.",
    ) + 14;

  const compare = [{ name: `${report.event.name} (this event)`, summary: s }, ...report.previous.map((p) => ({ name: p.name, summary: p.summary }))];
  table(
    pdf,
    M,
    y,
    "Compared with previous events",
    [
      { label: "Event", width: W - 280 },
      { label: "Registered", width: 70, align: "right" },
      { label: "Fixed", width: 60, align: "right" },
      { label: "Fix rate", width: 70, align: "right" },
      { label: "Rating", width: 80, align: "right" },
    ],
    report.previous.length ? compare.map((e) => [e.name, String(e.summary.registered), String(e.summary.fixed), formatPercent(e.summary.fixRate), formatRating(e.summary.averageRating)]) : [],
    "This is the first event, so there is nothing to compare yet.",
  );

  pdf.line(M, A4.height - 40, M + W, LINE);
  pdf.text(M, A4.height - 26, `Generated ${stamp.format(report.generatedAt)}`, { size: 7.5, color: MUTED });
  pdf.text(M + W, A4.height - 26, "Faculty of Computing Engineering Team", { size: 7.5, color: MUTED, align: "right" });

  return pdf.toBuffer(`${report.event.name} - report`);
}
