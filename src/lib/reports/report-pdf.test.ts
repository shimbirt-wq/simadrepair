import { describe, expect, it } from "vitest";
import type { EventReport, EventSummary } from "@/lib/reports/event-report";
import { csvCell } from "@/lib/reports/tickets-csv";
import { fit, textWidth } from "@/lib/reports/pdf";
import { renderEventReportPdf } from "@/lib/reports/report-pdf";

const summary: EventSummary = {
  registered: 412,
  cancelled: 9,
  received: 388,
  fixed: 301,
  cannotRepair: 44,
  collected: 330,
  uncollected: 15,
  inProgress: 43,
  fixRate: 0.87,
  medianHoursToReady: 26.4,
  averageRating: 4.6,
  ratings: 210,
};

const many = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => ({ label: `${prefix} with a rather long name number ${i + 1}`, count: 100 - i, registered: 100 - i, fixed: 80 - i }));

const fullReport: EventReport = {
  event: { id: "e1", name: "Computer Maintenance Week 2026 — Faculty of Computing", dates: "1–5 Nov 2026", venue: "Main Hall, Block B" },
  summary,
  topFaults: many("Fault", 12),
  topActions: many("Action", 12),
  byFaculty: many("Faculty", 15),
  byDeviceType: many("Device", 9),
  byTechnician: Array.from({ length: 30 }, (_, i) => ({ name: `Volunteer technician ${i + 1}`, fixed: 20 - (i % 20), cannotRepair: 2, open: 1, averageRating: 4.5 })),
  previous: [1, 2, 3].map((i) => ({ id: `p${i}`, name: `Maintenance Week ${2026 - i}`, summary })),
  generatedAt: new Date("2026-11-05T14:00:00Z"),
};

describe("event report PDF", () => {
  it("fits a busy event on exactly one page", () => {
    const pdf = renderEventReportPdf(fullReport).toString("latin1");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.match(/\/Type \/Page\b/g)).toHaveLength(1);
    expect(pdf).toContain("(Computer Maintenance Week 2026 - ");
    expect(pdf).toContain("(87%) Tj");
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
  });

  it("renders an empty first event", () => {
    const empty = { ...fullReport, topFaults: [], topActions: [], byFaculty: [], byDeviceType: [], byTechnician: [], previous: [] };
    expect(renderEventReportPdf(empty).toString("latin1")).toContain("nothing to compare yet");
  });

  it("truncates text to a width", () => {
    const cut = fit("A very long faculty name that will not fit", 80, 9);
    expect(cut.endsWith("...")).toBe(true);
    expect(textWidth(cut, 9)).toBeLessThanOrEqual(80);
  });
});

describe("csvCell", () => {
  it("quotes and defuses formulas", () => {
    expect(csvCell('Said "Ali", Jr')).toBe('"Said ""Ali"", Jr"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(null)).toBe("");
    expect(csvCell(3)).toBe("3");
  });
});
