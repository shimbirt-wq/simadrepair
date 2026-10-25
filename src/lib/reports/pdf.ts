/**
 * A tiny one-page PDF writer: Helvetica text, filled rectangles and lines.
 * Enough for the event summary without a PDF dependency. Coordinates are in
 * points from the top-left corner; drawing outside the page throws, so a
 * layout that would spill onto a second page fails loudly in tests.
 */

export const A4 = { width: 595.28, height: 841.89 };

type Rgb = [number, number, number];
export type TextOptions = { size?: number; bold?: boolean; color?: Rgb; align?: "left" | "right" };

// Helvetica advance widths (1/1000 em) for ASCII 32–126.
const WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278,
  500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556,
  500, 722, 500, 500, 500, 334, 260, 334, 584,
];

export function hex(value: string): Rgb {
  const n = parseInt(value.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/** Maps text to WinAnsi (Latin-1 range); anything else becomes a close ASCII stand-in. */
export function toWinAnsi(text: string): string {
  return text
    .replace(/[–—]/g, "-")
    .replace(/→/g, "->")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "?");
}

export function textWidth(text: string, size: number, bold = false) {
  let units = 0;
  for (const char of toWinAnsi(text)) {
    const code = char.charCodeAt(0);
    units += code >= 32 && code <= 126 ? WIDTHS[code - 32] : 556;
  }
  return (units / 1000) * size * (bold ? 1.06 : 1);
}

/** Shortens text with "..." so it fits in `max` points. */
export function fit(text: string, max: number, size: number, bold = false) {
  if (textWidth(text, size, bold) <= max) return text;
  let cut = text;
  while (cut.length > 1 && textWidth(`${cut}...`, size, bold) > max) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}...`;
}

const escape = (text: string) => toWinAnsi(text).replace(/[\\()]/g, (c) => `\\${c}`);
const num = (n: number) => (Math.round(n * 100) / 100).toString();
const color = ([r, g, b]: Rgb, op: "rg" | "RG") => `${num(r)} ${num(g)} ${num(b)} ${op}`;

export class OnePagePdf {
  private ops: string[] = [];
  constructor(private readonly margin = 20) {}

  private check(y: number, h = 0) {
    if (y < 0 || y + h > A4.height - this.margin) throw new Error(`PDF content does not fit on one page (y=${Math.round(y + h)}).`);
  }

  rect(x: number, y: number, w: number, h: number, fill: Rgb) {
    this.check(y, h);
    this.ops.push(`${color(fill, "rg")} ${num(x)} ${num(A4.height - y - h)} ${num(w)} ${num(h)} re f`);
  }

  line(x1: number, y: number, x2: number, stroke: Rgb, width = 0.5) {
    this.check(y);
    this.ops.push(`${color(stroke, "RG")} ${num(width)} w ${num(x1)} ${num(A4.height - y)} m ${num(x2)} ${num(A4.height - y)} l S`);
  }

  /** `y` is the baseline. */
  text(x: number, y: number, value: string, { size = 9, bold = false, color: fill = [0, 0, 0], align = "left" }: TextOptions = {}) {
    this.check(y);
    const left = align === "right" ? x - textWidth(value, size, bold) : x;
    this.ops.push(`BT /${bold ? "F2" : "F1"} ${num(size)} Tf ${color(fill, "rg")} ${num(left)} ${num(A4.height - y)} Td (${escape(value)}) Tj ET`);
  }

  toBuffer(title: string): Buffer {
    const content = this.ops.join("\n");
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(A4.width)} ${num(A4.height)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
      `<< /Title (${escape(title)}) /Producer (SIMADRepair) >>`,
    ];
    let out = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((body, index) => {
      offsets.push(Buffer.byteLength(out, "latin1"));
      out += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });
    const xref = Buffer.byteLength(out, "latin1");
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    out += offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
    out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(out, "latin1");
  }
}
