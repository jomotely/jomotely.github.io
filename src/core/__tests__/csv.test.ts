import { describe, expect, it } from 'vitest';
import { csvEscape, parseCsv, toCsv } from '../csv';

describe('csvEscape', () => {
  it('leaves plain text alone', () => {
    expect(csvEscape('plain')).toBe('plain');
  });
  it('wraps fields containing commas', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
  });
  it('doubles embedded quotes', () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });
  it('wraps fields containing newlines', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('toCsv / parseCsv round-trip', () => {
  it('round-trips complex rows per RFC 4180', () => {
    const rows: (string | number | null)[][] = [
      ['column', 'title', 'notes'],
      ['saved', 'Frontend Dev', 'Met at meetup, "follow up" soon\nsecond line'],
      ['offer', 'مهندس برمجيات', null],
      ['interview', 'Salary, equity, remote', '45,000 – 55,000'],
    ];
    const csv = toCsv(rows);
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM so Excel renders Arabic
    const parsed = parseCsv(csv);
    expect(parsed).toEqual(rows.map((r) => r.map((c) => (c === null ? '' : String(c)))));
  });

  it('strips the BOM before parsing', () => {
    expect(parseCsv('\uFEFFa,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('handles CRLF, trailing newline and empty fields', () => {
    expect(parseCsv('a,b,c\r\n1,,3\r\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
    ]);
  });

  it('keeps embedded newlines inside quoted fields', () => {
    const parsed = parseCsv('title,notes\n"Job A","line one\nline two"');
    expect(parsed[1][1]).toBe('line one\nline two');
  });
});
