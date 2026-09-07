/**
 * A ZIP writer, because .xlsx is a ZIP of XML parts and this app ships no dependencies.
 *
 * STORE only — no DEFLATE. That is a deliberate trade: implementing deflate correctly is a
 * few hundred lines of Huffman coding for a file that is a few hundred kilobytes of XML, and
 * the ZIP specification has always permitted stored entries. Excel, LibreOffice and Python's
 * zipfile all read them. The cost is file size, which for a control register is irrelevant.
 *
 * Everything is little-endian, and every offset is recorded as the archive is built rather
 * than recomputed at the end, because a central-directory offset that disagrees with the
 * local header by one byte produces a file that opens nowhere and reports nothing useful.
 */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** DOS timestamp: 7-bit year from 1980, and seconds at two-second resolution. */
function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

export interface ZipEntry {
  /** Path inside the archive, forward slashes, no leading slash. */
  name: string;
  data: Uint8Array;
}

/** Growable little-endian byte sink. Avoids counting bytes twice to size a buffer up front. */
class ByteSink {
  private chunks: Uint8Array[] = [];
  length = 0;

  push(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this.length += bytes.length;
  }

  u16(value: number): void {
    this.push(new Uint8Array([value & 0xff, (value >>> 8) & 0xff]));
  }

  u32(value: number): void {
    this.push(
      new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff])
    );
  }

  concat(): Uint8Array {
    const out = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

export function utf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;
/** Bit 11: filenames are UTF-8. Ours are ASCII, but declaring it costs nothing. */
const FLAG_UTF8 = 0x0800;
const VERSION = 20;

/**
 * Build a ZIP archive. Entry order is preserved, which matters for .xlsx: some readers expect
 * [Content_Types].xml first, and it is free to put it there.
 */
export function buildZip(entries: ZipEntry[], modified = new Date()): Uint8Array {
  const { time, date } = dosDateTime(modified);
  const body = new ByteSink();
  const central = new ByteSink();

  for (const entry of entries) {
    const name = utf8(entry.name);
    const sum = crc32(entry.data);
    const offset = body.length;

    body.u32(LOCAL_SIG);
    body.u16(VERSION);
    body.u16(FLAG_UTF8);
    body.u16(0); // stored
    body.u16(time);
    body.u16(date);
    body.u32(sum);
    body.u32(entry.data.length);
    body.u32(entry.data.length);
    body.u16(name.length);
    body.u16(0); // no extra field
    body.push(name);
    body.push(entry.data);

    central.u32(CENTRAL_SIG);
    central.u16(VERSION); // version made by
    central.u16(VERSION); // version needed
    central.u16(FLAG_UTF8);
    central.u16(0);
    central.u16(time);
    central.u16(date);
    central.u32(sum);
    central.u32(entry.data.length);
    central.u32(entry.data.length);
    central.u16(name.length);
    central.u16(0); // extra
    central.u16(0); // comment
    central.u16(0); // disk number
    central.u16(0); // internal attributes
    central.u32(0); // external attributes
    central.u32(offset);
    central.push(name);
  }

  const out = new ByteSink();
  const archive = body.concat();
  const directory = central.concat();
  out.push(archive);
  out.push(directory);
  out.u32(EOCD_SIG);
  out.u16(0);
  out.u16(0);
  out.u16(entries.length);
  out.u16(entries.length);
  out.u32(directory.length);
  out.u32(archive.length);
  out.u16(0); // no archive comment
  return out.concat();
}

/**
 * XML text escaping. Control characters below 0x20 other than tab/newline/return are illegal in
 * XML 1.0 at any escaping level, so they are dropped rather than encoded — a scanner
 * description carrying a stray 0x07 would otherwise produce a workbook Excel refuses to open.
 */
export function xmlEscape(value: string): string {
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
