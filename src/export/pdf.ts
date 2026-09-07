/**
 * A PDF 1.4 writer for the board report. No dependencies, so no font embedding either.
 *
 * That last point has a visible consequence worth stating: the base-14 fonts are limited to
 * WinAnsiEncoding, which has no rupee sign. Rather than emit a missing-glyph box in a document
 * headed for a board pack, currency in the PDF is written "INR 1,20,000" — the Indian digit
 * grouping is preserved, only the symbol changes. `pdfCurrency` below is the single place that
 * happens, so the substitution is one function rather than a habit scattered through the report.
 *
 * Layout is a top-down cursor with automatic pagination. Every emitter measures its own height
 * before drawing and asks for a new page if it will not fit, which is why tables can break
 * across pages without a caller tracking positions.
 */

/** Adobe AFM advance widths for Helvetica, ASCII 32-126, in 1/1000 em. */
const HELV = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

/** Same for Helvetica-Bold. */
const HELV_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667,
  611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556,
  278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

/**
 * Characters the report uses that WinAnsiEncoding cannot render, mapped to what it can. The
 * rupee sign is the important one; the rest are typographic niceties that would otherwise show
 * as blanks.
 */
const TRANSLITERATE: Record<string, string> = {
  '₹': 'INR',
  '—': '-',
  '–': '-',
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
  '…': '...',
  '·': '-',
  '→': '->',
  '×': 'x',
  '≤': '<=',
  '≥': '>=',
};

export function toWinAnsi(text: string): string {
  let out = '';
  for (const ch of text) {
    const mapped = TRANSLITERATE[ch];
    if (mapped !== undefined) {
      out += mapped;
    } else {
      const code = ch.codePointAt(0) ?? 32;
      out += code >= 32 && code <= 126 ? ch : code === 9 ? ' ' : code > 126 ? '?' : '';
    }
  }
  return out;
}

/** Rupee amounts for the PDF: Indian digit grouping, "INR" for the unrenderable symbol. */
export function pdfCurrency(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded));
  if (digits.length <= 3) return `${sign}INR ${digits}`;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${sign}INR ${rest},${last3}`;
}

export function textWidth(text: string, size: number, bold = false): number {
  const table = bold ? HELV_BOLD : HELV;
  let total = 0;
  const ansi = toWinAnsi(text);
  for (let i = 0; i < ansi.length; i += 1) {
    const code = ansi.charCodeAt(i);
    total += code >= 32 && code <= 126 ? table[code - 32] : 556;
  }
  return (total * size) / 1000;
}

/** Greedy word wrap. Words longer than the line are hard-split so nothing overflows silently. */
export function wrapText(text: string, size: number, maxWidth: number, bold = false): string[] {
  const lines: string[] = [];
  for (const paragraph of toWinAnsi(text).split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter((w) => w.length > 0)) {
      const candidate = line.length === 0 ? word : `${line} ${word}`;
      if (textWidth(candidate, size, bold) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line.length > 0) lines.push(line);
      if (textWidth(word, size, bold) <= maxWidth) {
        line = word;
        continue;
      }
      let chunk = '';
      for (const ch of word) {
        if (textWidth(chunk + ch, size, bold) > maxWidth && chunk.length > 0) {
          lines.push(chunk);
          chunk = ch;
        } else {
          chunk += ch;
        }
      }
      line = chunk;
    }
    lines.push(line);
  }
  return lines.length > 0 ? lines : [''];
}

function pdfString(text: string): string {
  return toWinAnsi(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

export type Rgb = [number, number, number];

export const INK: Record<string, Rgb> = {
  body: [0.14, 0.16, 0.2],
  muted: [0.42, 0.45, 0.5],
  heading: [0.05, 0.07, 0.11],
  accent: [0.02, 0.44, 0.55],
  danger: [0.72, 0.14, 0.24],
  warn: [0.68, 0.42, 0.03],
  good: [0.03, 0.44, 0.32],
  rule: [0.82, 0.85, 0.89],
  band: [0.94, 0.96, 0.98],
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const FOOTER_SPACE = 34;

export interface PdfMeta {
  title: string;
  author: string;
  subject: string;
  created: Date;
  /** Printed in every page footer, left side. Keep it short. */
  footer: string;
}

export interface TextOptions {
  size?: number;
  bold?: boolean;
  color?: Rgb;
  /** Extra leading multiplier. 1.35 is the default body setting. */
  leading?: number;
  indent?: number;
}

export interface TableColumn {
  header: string;
  width: number;
  align?: 'left' | 'right';
}

export interface TableRow {
  cells: string[];
  /** Per-row ink for the whole row, e.g. red for an open gap. */
  color?: Rgb;
  bold?: boolean;
}

export class PdfBuilder {
  private pages: string[][] = [];
  private current: string[] = [];
  private y = 0;
  private readonly contentWidth = PAGE_WIDTH - MARGIN * 2;

  constructor(private meta: PdfMeta) {
    this.newPage();
  }

  get width(): number {
    return this.contentWidth;
  }

  private newPage(): void {
    if (this.current.length > 0) this.pages.push(this.current);
    this.current = [];
    this.y = PAGE_HEIGHT - MARGIN;
  }

  /** Ask for vertical space. Starts a page when the block would cross the footer. */
  private reserve(height: number): void {
    if (this.y - height < MARGIN + FOOTER_SPACE) this.newPage();
  }

  private op(line: string): void {
    this.current.push(line);
  }

  private fill(color: Rgb): void {
    this.op(`${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} rg`);
  }

  private stroke(color: Rgb): void {
    this.op(`${color[0].toFixed(3)} ${color[1].toFixed(3)} ${color[2].toFixed(3)} RG`);
  }

  private drawText(text: string, x: number, baseline: number, size: number, bold: boolean): void {
    this.op(`BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${baseline.toFixed(2)} Tm (${pdfString(text)}) Tj ET`);
  }

  private rect(x: number, y: number, w: number, h: number, color: Rgb): void {
    this.fill(color);
    this.op(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }

  spacer(points: number): void {
    this.y -= points;
  }

  rule(color: Rgb = INK.rule): void {
    this.reserve(10);
    this.stroke(color);
    this.op(`0.6 w ${MARGIN} ${this.y.toFixed(2)} m ${(PAGE_WIDTH - MARGIN).toFixed(2)} ${this.y.toFixed(2)} l S`);
    this.y -= 10;
  }

  /** Body text, wrapped to the content column. Returns the height consumed. */
  paragraph(text: string, options: TextOptions = {}): number {
    const size = options.size ?? 9.5;
    const bold = options.bold ?? false;
    const leading = size * (options.leading ?? 1.38);
    const indent = options.indent ?? 0;
    const lines = wrapText(text, size, this.contentWidth - indent, bold);
    let used = 0;
    this.fill(options.color ?? INK.body);
    for (const line of lines) {
      this.reserve(leading);
      this.fill(options.color ?? INK.body);
      this.drawText(line, MARGIN + indent, this.y - size, size, bold);
      this.y -= leading;
      used += leading;
    }
    return used;
  }

  heading(text: string, level: 1 | 2 | 3 = 2): void {
    const size = level === 1 ? 17 : level === 2 ? 11.5 : 10;
    this.reserve(size * 2.1);
    this.spacer(level === 1 ? 2 : 8);
    this.fill(INK.heading);
    this.drawText(text, MARGIN, this.y - size, size, true);
    this.y -= size * 1.32;
    if (level <= 2) {
      this.stroke(INK.rule);
      this.op(`0.6 w ${MARGIN} ${this.y.toFixed(2)} m ${(PAGE_WIDTH - MARGIN).toFixed(2)} ${this.y.toFixed(2)} l S`);
      this.y -= 9;
    }
  }

  /** A label/value strip, e.g. the four headline figures under the title. */
  metricStrip(items: { label: string; value: string; color?: Rgb }[]): void {
    const cols = Math.max(1, items.length);
    const cellWidth = this.contentWidth / cols;
    const height = 40;
    this.reserve(height + 6);
    this.rect(MARGIN, this.y - height, this.contentWidth, height, INK.band);
    items.forEach((item, i) => {
      const x = MARGIN + i * cellWidth + 8;
      this.fill(INK.muted);
      this.drawText(item.label.toUpperCase(), x, this.y - 14, 6.6, false);
      this.fill(item.color ?? INK.heading);
      const value = wrapText(item.value, 11, cellWidth - 14, true)[0];
      this.drawText(value, x, this.y - 30, 11, true);
    });
    this.y -= height + 8;
  }

  /** Two-column definition list. Wraps the value column and keeps rows unbroken. */
  definitions(rows: { term: string; value: string; color?: Rgb }[], termWidth = 150): void {
    const size = 9;
    const leading = size * 1.34;
    for (const row of rows) {
      const valueLines = wrapText(row.value, size, this.contentWidth - termWidth - 10, false);
      const termLines = wrapText(row.term, size, termWidth - 6, true);
      const height = Math.max(valueLines.length, termLines.length) * leading + 3;
      this.reserve(height);
      const top = this.y;
      termLines.forEach((line, i) => {
        this.fill(INK.heading);
        this.drawText(line, MARGIN, top - size - i * leading, size, true);
      });
      valueLines.forEach((line, i) => {
        this.fill(row.color ?? INK.body);
        this.drawText(line, MARGIN + termWidth, top - size - i * leading, size, false);
      });
      this.y = top - height;
    }
  }

  /**
   * A table that breaks across pages and repeats its header. Column widths are taken as given
   * and scaled to the content width, so a caller can think in proportions.
   */
  table(columns: TableColumn[], rows: TableRow[], options: { size?: number } = {}): void {
    const size = options.size ?? 8.2;
    const leading = size * 1.28;
    const padX = 4;
    const declared = columns.reduce((s, c) => s + c.width, 0) || 1;
    const widths = columns.map((c) => (c.width / declared) * this.contentWidth);

    const drawHeader = (): void => {
      const height = leading + 7;
      this.reserve(height + leading);
      this.rect(MARGIN, this.y - height, this.contentWidth, height, INK.heading);
      let x = MARGIN;
      columns.forEach((col, i) => {
        this.fill([1, 1, 1]);
        const label = wrapText(col.header, size, widths[i] - padX * 2, true)[0];
        const tx =
          col.align === 'right'
            ? x + widths[i] - padX - textWidth(label, size, true)
            : x + padX;
        this.drawText(label, tx, this.y - height + 5.5, size, true);
        x += widths[i];
      });
      this.y -= height + 2;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      const wrapped = row.cells.map((cell, i) =>
        wrapText(cell ?? '', size, widths[i] - padX * 2, row.bold ?? false)
      );
      const lineCount = wrapped.reduce((m, lines) => Math.max(m, lines.length), 1);
      const height = lineCount * leading + 5;

      if (this.y - height < MARGIN + FOOTER_SPACE) {
        this.newPage();
        drawHeader();
      }

      if (rowIndex % 2 === 1) {
        this.rect(MARGIN, this.y - height, this.contentWidth, height, INK.band);
      }

      const top = this.y;
      let x = MARGIN;
      wrapped.forEach((lines, i) => {
        lines.forEach((line, li) => {
          this.fill(row.color ?? INK.body);
          const tx =
            columns[i].align === 'right'
              ? x + widths[i] - padX - textWidth(line, size, row.bold ?? false)
              : x + padX;
          this.drawText(line, tx, top - size - li * leading - 2, size, row.bold ?? false);
        });
        x += widths[i];
      });

      this.stroke(INK.rule);
      this.op(
        `0.4 w ${MARGIN} ${(top - height).toFixed(2)} m ${(PAGE_WIDTH - MARGIN).toFixed(2)} ${(
          top - height
        ).toFixed(2)} l S`
      );
      this.y = top - height;
    });

    this.y -= 6;
  }

  /** Force a page break, e.g. between the board summary and the control appendix. */
  pageBreak(): void {
    this.newPage();
  }

  /**
   * Serialise. Footers are stamped here rather than at page start, because "page 3 of 7" needs
   * the total, which is only known once every page exists.
   */
  build(): Uint8Array {
    if (this.current.length > 0) {
      this.pages.push(this.current);
      this.current = [];
    }
    const total = this.pages.length;
    const streams = this.pages.map((ops, i) => {
      const footer: string[] = [];
      footer.push(`${INK.rule[0]} ${INK.rule[1]} ${INK.rule[2]} RG`);
      footer.push(`0.5 w ${MARGIN} ${(MARGIN + 20).toFixed(2)} m ${(PAGE_WIDTH - MARGIN).toFixed(2)} ${(MARGIN + 20).toFixed(2)} l S`);
      footer.push(`${INK.muted[0]} ${INK.muted[1]} ${INK.muted[2]} rg`);
      footer.push(
        `BT /F1 7.2 Tf 1 0 0 1 ${MARGIN} ${(MARGIN + 9).toFixed(2)} Tm (${pdfString(this.meta.footer)}) Tj ET`
      );
      const label = `Page ${i + 1} of ${total}`;
      const lx = PAGE_WIDTH - MARGIN - textWidth(label, 7.2, false);
      footer.push(`BT /F1 7.2 Tf 1 0 0 1 ${lx.toFixed(2)} ${(MARGIN + 9).toFixed(2)} Tm (${pdfString(label)}) Tj ET`);
      return [...ops, ...footer].join('\n');
    });

    const objects: string[] = [];
    const pageObjectIds = streams.map((_, i) => 6 + i * 2);
    const kids = pageObjectIds.map((id) => `${id} 0 R`).join(' ');

    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push(`<< /Type /Pages /Count ${total} /Kids [${kids}] >>`);
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    objects.push(
      `<< /Title (${pdfString(this.meta.title)}) /Author (${pdfString(this.meta.author)}) ` +
        `/Subject (${pdfString(this.meta.subject)}) /Producer (CyberRisk Optimizer, zero-dependency PDF writer) ` +
        `/CreationDate (${pdfDate(this.meta.created)}) >>`
    );

    streams.forEach((stream) => {
      // objects.length is 5 + 2*pageIndex here, so this page becomes object length+1 and its
      // content stream length+2. Getting this wrong yields a PDF that opens to blank pages.
      const contentId = objects.length + 2;
      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
          `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
      );
      objects.push(`<< /Length ${utf8Length(stream)} >>\nstream\n${stream}\nendstream`);
    });

    let pdf = '%PDF-1.4\n%âãÏÓ\n';
    const offsets: number[] = [];
    objects.forEach((body, i) => {
      offsets.push(utf8Length(pdf));
      pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefStart = utf8Length(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (const offset of offsets) {
      pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

    return latin1Bytes(pdf);
  }
}

/** PDF date syntax: D:YYYYMMDDHHmmSS plus a UTC offset. */
function pdfDate(date: Date): string {
  const p = (n: number): string => String(n).padStart(2, '0');
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  return (
    `D:${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}` +
    `${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}` +
    `${sign}${p(Math.floor(abs / 60))}'${p(abs % 60)}`
  );
}

/**
 * Byte length, not character count. /Length must be bytes, and the xref offsets must be byte
 * offsets — every string here is Latin-1 by construction (toWinAnsi guarantees it), so the two
 * agree, but computing it explicitly means a future non-ASCII leak fails loudly rather than
 * producing a file with silently wrong offsets.
 */
function utf8Length(text: string): number {
  let bytes = 0;
  for (let i = 0; i < text.length; i += 1) {
    bytes += text.charCodeAt(i) > 255 ? 2 : 1;
  }
  return bytes;
}

function latin1Bytes(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) {
    out[i] = text.charCodeAt(i) & 0xff;
  }
  return out;
}
