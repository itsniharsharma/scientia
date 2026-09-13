import type { TableBlock } from '../core/types';

/**
 * Converts a raw table (row 0 = headers) into a semantically readable text
 * block for retrieval, per the spec's example:
 *
 *   Plan | Price | Students        ->   Free Plan:
 *   Free | 0     | 50                    Price: 0
 *   Pro  | 999   | 500                   Student capacity: 50
 *
 * The first column of each data row is treated as that row's label/entity
 * name; remaining columns become "Header: value" lines under it. This suits
 * the common "entity x attributes" documentation table shape (pricing
 * tiers, feature limits, plan comparisons). Unusual table shapes (e.g. a
 * two-dimensional matrix with no natural row label) will format less
 * cleanly — a known, documented limitation rather than a silent failure.
 */
export function formatTableAsText(table: TableBlock): string {
  const { headers, rows } = table;
  if (rows.length === 0) return '';

  const [labelHeader, ...attributeHeaders] = headers;
  const lines: string[] = [];

  for (const row of rows) {
    const [label, ...values] = row;
    lines.push(`${label || labelHeader}:`);
    attributeHeaders.forEach((header, i) => {
      if (values[i] !== undefined && values[i] !== '') {
        lines.push(`${header}: ${values[i]}`);
      }
    });
    lines.push('');
  }

  return lines.join('\n').trim();
}

/** Builds a TableBlock from pdf-parse's raw string[][] table output. */
export function buildTableBlock(rawTable: string[][], page: number): TableBlock | null {
  if (rawTable.length === 0) return null;
  const [headerRow, ...dataRows] = rawTable;
  const headers = headerRow.map((h) => h.trim());
  const rows = dataRows
    .map((row) => row.map((cell) => cell.trim()))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (rows.length === 0) return null;

  return { type: 'table', headers, rows, page };
}
