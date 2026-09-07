/**
 * A minimal OOXML spreadsheet writer: enough of the format to emit a real .xlsx, no more.
 *
 * Deliberate simplifications, each with a reason:
 *   - Inline strings instead of a shared string table. A control register has few repeated
 *     strings, so the table would save little and the indirection is a whole extra failure mode.
 *   - A fixed style palette declared once here rather than a general styling API. Every sheet
 *     this app writes wants the same six or seven cell treatments, and a fixed palette means
 *     the numFmt ids and the cellXfs indices cannot drift apart.
 *   - No charts, no tables, no conditional formatting. A regulator opens this to read numbers
 *     and to sort and filter them, which autofilter and a frozen header cover.
 *
 * Currency is formatted by Excel from a raw number, never pre-formatted into a string. A cell
 * holding "₹1,20,000" is text: it will not sum, sort or pivot, which defeats the point of
 * shipping a spreadsheet rather than a PDF.
 */
import { buildZip, utf8, xmlEscape, type ZipEntry } from './zip';

/** Fixed style slots. The numbers are indices into cellXfs below and must stay in step. */
export const STYLE = {
  DEFAULT: 0,
  HEADER: 1,
  TEXT_WRAP: 2,
  INR: 3,
  PERCENT: 4,
  INTEGER: 5,
  NOTE: 6,
  BOLD: 7,
  TITLE: 8,
  MONO: 9,
  INR_BOLD: 10,
} as const;

export type CellValue = string | number | null;

export interface Cell {
  v: CellValue;
  s?: number;
}

export interface Sheet {
  name: string;
  /** Column widths in Excel's character units. Length defines the sheet's column count. */
  columns: number[];
  rows: Cell[][];
  /** Rows above this index are frozen. 1 freezes the header row. */
  freezeRow?: number;
  /** e.g. "A3:H120" — omit for no filter. */
  autoFilter?: string;
}

/** 0 -> A, 25 -> Z, 26 -> AA. */
export function columnName(index: number): string {
  let n = index;
  let name = '';
  do {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return name;
}

/** Excel rejects []:*?/\ in sheet names and truncates past 31 characters. */
function sheetName(raw: string): string {
  const cleaned = raw.replace(/[[\]:*?/\\]/g, '-').trim() || 'Sheet';
  return cleaned.slice(0, 31);
}

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/**
 * The style part. numFmt 164 is the Indian-format rupee. Excel's own #,##0 groups in
 * thousands, so the lakh/crore positions have to be spelled out.
 *
 * The obvious spelling — a repeated group, `"₹"\ ##,##,##0` — is the recipe Excel documents,
 * but LibreOffice ignores the repetition and falls back to plain thousands grouping, so a
 * workbook opened in Calc showed ₹ 6,857,300 where Excel would have shown ₹ 68,57,300. Since
 * a regulator or a board member may well open this in Calc, the grouping is instead expressed
 * as magnitude bands with *literal* escaped commas, which both applications honour:
 * up to ₹99,999 plain, ₹1,00,000 upward in lakhs, ₹1,00,00,000 upward in crores.
 *
 * Two consequences of that spelling are deliberate and constrained elsewhere:
 *   - A format may carry at most two conditions plus a fallback, and the fallback cannot
 *     carry a sign, so a negative amount would render without its minus. Callers must never
 *     put a negative number in an INR cell; scripts/check-exports.cjs asserts none do.
 *   - Above ₹99,99,99,999 the leftmost group stops subdividing (₹ 1000,00,00,000 rather than
 *     ₹ 1,000,00,00,000). Adding further comma positions is not a fix — unused ones emit
 *     stray leading commas. The figure stays correct; only its grouping degrades.
 */
const STYLES_XML = `${XML_DECL}
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="3">
<numFmt numFmtId="164" formatCode="[&gt;=10000000]&quot;₹&quot;\\ #\\,##\\,##\\,##0;[&gt;=100000]&quot;₹&quot;\\ #\\,##\\,##0;&quot;₹&quot;\\ #,##0"/>
<numFmt numFmtId="165" formatCode="0.0%"/>
<numFmt numFmtId="166" formatCode="#,##0"/>
</numFmts>
<fonts count="6">
<font><sz val="10"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="10"/><name val="Calibri"/></font>
<font><i/><sz val="9"/><color rgb="FF64748B"/><name val="Calibri"/></font>
<font><b/><sz val="14"/><name val="Calibri"/></font>
<font><sz val="9"/><name val="Consolas"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF0F172A"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top/><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="11">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top"/></xf>
<xf numFmtId="164" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
</cellXfs>
</styleSheet>`;

function sheetXml(sheet: Sheet): string {
  const cols = sheet.columns
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('');

  const rows = sheet.rows
    .map((cells, r) => {
      const rowNumber = r + 1;
      const body = cells
        .map((cell, c) => {
          if (cell.v === null || cell.v === undefined || cell.v === '') {
            // Still emit the cell when it carries a style, so borders stay continuous.
            return cell.s === undefined
              ? ''
              : `<c r="${columnName(c)}${rowNumber}" s="${cell.s}"/>`;
          }
          const ref = `${columnName(c)}${rowNumber}`;
          const style = cell.s === undefined ? '' : ` s="${cell.s}"`;
          if (typeof cell.v === 'number' && Number.isFinite(cell.v)) {
            return `<c r="${ref}"${style}><v>${cell.v}</v></c>`;
          }
          return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${xmlEscape(
            String(cell.v)
          )}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowNumber}">${body}</row>`;
    })
    .join('');

  const freeze =
    sheet.freezeRow && sheet.freezeRow > 0
      ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${sheet.freezeRow}" topLeftCell="A${
          sheet.freezeRow + 1
        }" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
      : '';
  const filter = sheet.autoFilter ? `<autoFilter ref="${sheet.autoFilter}"/>` : '';

  return `${XML_DECL}
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${freeze}<sheetFormatPr defaultRowHeight="14"/><cols>${cols}</cols><sheetData>${rows}</sheetData>${filter}</worksheet>`;
}

export interface WorkbookMeta {
  title: string;
  creator: string;
  created: Date;
}

export function buildXlsx(sheets: Sheet[], meta: WorkbookMeta): Uint8Array {
  const named = sheets.map((s, i) => ({ ...s, name: sheetName(s.name) || `Sheet${i + 1}` }));

  const contentTypes = `${XML_DECL}
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${named
  .map(
    (_, i) =>
      `<Override PartName="/xl/worksheets/sheet${
        i + 1
      }.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  )
  .join('\n')}
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
</Types>`;

  const rootRels = `${XML_DECL}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
</Relationships>`;

  const workbook = `${XML_DECL}
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>
${named
  .map((s, i) => `<sheet name="${xmlEscape(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
  .join('\n')}
</sheets>
</workbook>`;

  const workbookRels = `${XML_DECL}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${named
  .map(
    (_, i) =>
      `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${
        i + 1
      }.xml"/>`
  )
  .join('\n')}
<Relationship Id="rId${named.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const iso = meta.created.toISOString().replace(/\.\d+Z$/, 'Z');
  const core = `${XML_DECL}
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${xmlEscape(meta.title)}</dc:title>
<dc:creator>${xmlEscape(meta.creator)}</dc:creator>
<cp:lastModifiedBy>${xmlEscape(meta.creator)}</cp:lastModifiedBy>
<dcterms:created xsi:type="dcterms:W3CDTF">${iso}</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">${iso}</dcterms:modified>
</cp:coreProperties>`;

  const entries: ZipEntry[] = [
    { name: '[Content_Types].xml', data: utf8(contentTypes) },
    { name: '_rels/.rels', data: utf8(rootRels) },
    { name: 'docProps/core.xml', data: utf8(core) },
    { name: 'xl/workbook.xml', data: utf8(workbook) },
    { name: 'xl/_rels/workbook.xml.rels', data: utf8(workbookRels) },
    { name: 'xl/styles.xml', data: utf8(STYLES_XML) },
    ...named.map((s, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: utf8(sheetXml(s)),
    })),
  ];

  return buildZip(entries, meta.created);
}
