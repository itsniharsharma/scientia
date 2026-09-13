import { describe, it, expect } from 'vitest';
import { formatTableAsText, buildTableBlock } from '../../modules/rag/ingestion/table-formatter';

describe('buildTableBlock', () => {
  it('splits header row from data rows and trims cells', () => {
    const block = buildTableBlock([['Plan ', ' Price', 'Students'], [' Free', '0', '50']], 3);
    expect(block).toEqual({ type: 'table', headers: ['Plan', 'Price', 'Students'], rows: [['Free', '0', '50']], page: 3 });
  });

  it('returns null for a table with only a header row', () => {
    expect(buildTableBlock([['Plan', 'Price']], 1)).toBeNull();
  });

  it('drops fully-empty data rows', () => {
    const block = buildTableBlock([['Plan', 'Price'], ['', ''], ['Pro', '999']], 1);
    expect(block?.rows).toEqual([['Pro', '999']]);
  });
});

describe('formatTableAsText', () => {
  it('converts a pricing table into the spec\'s "Field: value" representation', () => {
    const text = formatTableAsText({
      type: 'table',
      headers: ['Plan', 'Price', 'Students'],
      rows: [
        ['Free', '0', '50'],
        ['Pro', '999', '500'],
      ],
      page: 12,
    });

    expect(text).toContain('Free:');
    expect(text).toContain('Price: 0');
    expect(text).toContain('Students: 50');
    expect(text).toContain('Pro:');
    expect(text).toContain('Price: 999');
    expect(text).toContain('Students: 500');
  });

  it('never emits an attribute line for an empty cell', () => {
    const text = formatTableAsText({
      type: 'table',
      headers: ['Plan', 'Price', 'Notes'],
      rows: [['Free', '0', '']],
      page: 1,
    });
    expect(text).not.toContain('Notes:');
  });
});
