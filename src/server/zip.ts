import { deflateRaw } from "node:zlib";
import { promisify } from "node:util";

const deflate = promisify(deflateRaw);

/**
 * A minimal ZIP writer.
 *
 * ZIP rather than tar.gz because the backup is downloaded onto a Windows
 * desktop, where a .zip opens on double-click and a .tar.gz does not — and
 * because ZIP compresses per entry, so the SQL dump can be deflated while
 * already-compressed webp images are stored as-is instead of being run through
 * deflate for a fraction of a percent.
 *
 * Written by hand because the project has no archive dependency and this needs
 * about a hundred lines. It emits entries as it goes so the response streams
 * rather than being assembled in memory.
 *
 * Deliberately not implemented: ZIP64. It is only required past 4 GB or 65535
 * entries, and `addFile` throws before either can silently produce a corrupt
 * archive.
 */

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

const STORE = 0;
const DEFLATE = 8;

/** Bit 11 tells the reader the filename is UTF-8, not the legacy code page. */
const UTF8_FLAG = 0x0800;

const MAX_ENTRIES = 65_535;
const MAX_TOTAL = 0xffff_ffff;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** ZIP stores timestamps in the 1980-epoch MS-DOS format, at 2-second accuracy. */
function dosTime(date: Date): { time: number; date: number } {
  const year = Math.max(date.getFullYear(), 1980);
  return {
    time:
      (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

type Entry = {
  name: Buffer;
  crc: number;
  method: number;
  compressed: number;
  uncompressed: number;
  offset: number;
  time: number;
  date: number;
};

export class ZipWriter {
  private readonly entries: Entry[] = [];
  private offset = 0;

  /** Chunks are handed to this as they are produced. */
  constructor(private readonly write: (chunk: Buffer) => void) {}

  /**
   * @param compress false for data that is already compressed (webp, jpeg,
   *   png), where deflate costs CPU and saves nothing.
   */
  async addFile(
    name: string,
    content: Buffer,
    { compress = true, mtime = new Date() }: { compress?: boolean; mtime?: Date } = {},
  ): Promise<void> {
    if (this.entries.length >= MAX_ENTRIES) {
      throw new Error("Слишком много файлов для ZIP без ZIP64");
    }

    const body = compress ? Buffer.from(await deflate(content)) : content;
    // Deflate can grow incompressible input; storing it is then both smaller
    // and faster to read back.
    const useDeflate = compress && body.length < content.length;
    const payload = useDeflate ? body : content;

    const nameBuf = Buffer.from(name, "utf8");
    const { time, date } = dosTime(mtime);
    const crc = crc32(content);

    const header = Buffer.alloc(30);
    header.writeUInt32LE(LOCAL_SIG, 0);
    header.writeUInt16LE(20, 4); // version needed
    header.writeUInt16LE(UTF8_FLAG, 6);
    header.writeUInt16LE(useDeflate ? DEFLATE : STORE, 8);
    header.writeUInt16LE(time, 10);
    header.writeUInt16LE(date, 12);
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(payload.length, 18);
    header.writeUInt32LE(content.length, 22);
    header.writeUInt16LE(nameBuf.length, 26);
    header.writeUInt16LE(0, 28); // extra field length

    this.entries.push({
      name: nameBuf,
      crc,
      method: useDeflate ? DEFLATE : STORE,
      compressed: payload.length,
      uncompressed: content.length,
      offset: this.offset,
      time,
      date,
    });

    this.write(header);
    this.write(nameBuf);
    this.write(payload);
    this.offset += header.length + nameBuf.length + payload.length;

    if (this.offset > MAX_TOTAL) {
      throw new Error("Архив больше 4 ГБ — требуется ZIP64");
    }
  }

  /** Writes the central directory. Nothing may be added after this. */
  finish(): void {
    const start = this.offset;

    for (const entry of this.entries) {
      const record = Buffer.alloc(46);
      record.writeUInt32LE(CENTRAL_SIG, 0);
      record.writeUInt16LE(20, 4); // version made by
      record.writeUInt16LE(20, 6); // version needed
      record.writeUInt16LE(UTF8_FLAG, 8);
      record.writeUInt16LE(entry.method, 10);
      record.writeUInt16LE(entry.time, 12);
      record.writeUInt16LE(entry.date, 14);
      record.writeUInt32LE(entry.crc, 16);
      record.writeUInt32LE(entry.compressed, 20);
      record.writeUInt32LE(entry.uncompressed, 24);
      record.writeUInt16LE(entry.name.length, 28);
      record.writeUInt16LE(0, 30); // extra
      record.writeUInt16LE(0, 32); // comment
      record.writeUInt16LE(0, 34); // disk number
      record.writeUInt16LE(0, 36); // internal attrs
      record.writeUInt32LE(0, 38); // external attrs
      record.writeUInt32LE(entry.offset, 42);

      this.write(record);
      this.write(entry.name);
      this.offset += record.length + entry.name.length;
    }

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(EOCD_SIG, 0);
    eocd.writeUInt16LE(0, 4); // this disk
    eocd.writeUInt16LE(0, 6); // disk with central directory
    eocd.writeUInt16LE(this.entries.length, 8);
    eocd.writeUInt16LE(this.entries.length, 10);
    eocd.writeUInt32LE(this.offset - start, 12);
    eocd.writeUInt32LE(start, 16);
    eocd.writeUInt16LE(0, 20); // comment length

    this.write(eocd);
    this.offset += eocd.length;
  }
}
