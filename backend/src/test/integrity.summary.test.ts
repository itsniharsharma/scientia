import { describe, it, expect } from 'vitest';
import { summarizeIntegrity, MAX_REPORTED_INCIDENTS } from '../modules/attempts/integrity.summary';

const T0 = Date.parse('2026-11-20T10:00:00.000Z');
const at = (seconds: number) => new Date(T0 + seconds * 1000);

describe('summarizeIntegrity', () => {
  it('reports a clean attempt as not flagged', () => {
    expect(summarizeIntegrity([])).toEqual({
      flagged: false,
      tabSwitches: 0,
      pageExits: 0,
      focusLosses: 0,
      screenshotAttempts: 0,
      timeAwaySeconds: 0,
      incidents: [],
    });
  });

  it('collapses an alt-tab (focus lost, then tab hidden) into one tab switch', () => {
    const s = summarizeIntegrity([
      { episodeId: 'e1', type: 'FOCUS_LOST', occurredAt: at(10) },
      { episodeId: 'e1', type: 'TAB_HIDDEN', occurredAt: at(10.2) },
      { episodeId: 'e1', type: 'RETURNED', occurredAt: at(57) },
    ]);
    expect(s.flagged).toBe(true);
    expect(s.tabSwitches).toBe(1);
    expect(s.focusLosses).toBe(0);
    expect(s.timeAwaySeconds).toBe(47);
    expect(s.incidents).toEqual([
      { type: 'TAB_HIDDEN', at: at(10).toISOString(), durationSeconds: 47 },
    ]);
  });

  it('counts each kind separately and orders incidents by time', () => {
    const s = summarizeIntegrity([
      { episodeId: 's1', type: 'SCREENSHOT_KEY', occurredAt: at(300) },
      { episodeId: 'e2', type: 'FOCUS_LOST', occurredAt: at(120) },
      { episodeId: 'e2', type: 'RETURNED', occurredAt: at(123) },
      { episodeId: 'e3', type: 'TAB_HIDDEN', occurredAt: at(200) },
      { episodeId: 'e3', type: 'PAGE_EXIT', occurredAt: at(201) },
      { episodeId: 'e3', type: 'RETURNED', occurredAt: at(260) },
    ]);
    expect([s.focusLosses, s.pageExits, s.tabSwitches, s.screenshotAttempts]).toEqual([1, 1, 0, 1]);
    expect(s.incidents.map((i) => i.type)).toEqual(['FOCUS_LOST', 'PAGE_EXIT', 'SCREENSHOT_KEY']);
    expect(s.timeAwaySeconds).toBe(3 + 60);
  });

  it('flags an episode the student never came back from, with unknown duration', () => {
    const s = summarizeIntegrity([{ episodeId: 'e1', type: 'TAB_HIDDEN', occurredAt: at(5) }]);
    expect(s.flagged).toBe(true);
    expect(s.incidents[0].durationSeconds).toBeNull();
    expect(s.timeAwaySeconds).toBe(0);
  });

  it('is not fooled by signals arriving out of order', () => {
    const s = summarizeIntegrity([
      { episodeId: 'e1', type: 'RETURNED', occurredAt: at(30) },
      { episodeId: 'e1', type: 'TAB_HIDDEN', occurredAt: at(10) },
      { episodeId: 'e1', type: 'FOCUS_LOST', occurredAt: at(9) },
    ]);
    expect(s.incidents).toEqual([{ type: 'TAB_HIDDEN', at: at(9).toISOString(), durationSeconds: 21 }]);
  });

  it('ignores a lone RETURNED', () => {
    expect(summarizeIntegrity([{ episodeId: 'e1', type: 'RETURNED', occurredAt: at(1) }]).flagged).toBe(false);
  });

  it('caps the incident list but never the counts', () => {
    const events = Array.from({ length: MAX_REPORTED_INCIDENTS + 10 }, (_, i) => ({
      episodeId: `e${i}`,
      type: 'FOCUS_LOST' as const,
      occurredAt: at(i * 10),
    }));
    const s = summarizeIntegrity(events);
    expect(s.focusLosses).toBe(MAX_REPORTED_INCIDENTS + 10);
    expect(s.incidents).toHaveLength(MAX_REPORTED_INCIDENTS);
  });
});
