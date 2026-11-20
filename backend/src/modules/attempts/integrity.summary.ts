// Turns an attempt's raw integrity signals into what the teacher sees.
//
// Signals come grouped by episode. One episode is one stretch of time away
// from the exam, e.g. FOCUS_LOST (alt-tab starts) → TAB_HIDDEN (the exam tab
// was covered) → RETURNED. It is reported once, as its most severe signal, and
// lasts from its first signal to the RETURNED that closes it. A screenshot
// shortcut is its own single-signal episode.

export type IntegritySignal =
  | 'FOCUS_LOST'
  | 'TAB_HIDDEN'
  | 'PAGE_EXIT'
  | 'SCREENSHOT_KEY'
  | 'RETURNED';

export type IntegrityIncidentType = Exclude<IntegritySignal, 'RETURNED'>;

export interface IntegrityIncident {
  type: IntegrityIncidentType;
  at: string;
  // null when the student never came back on that device (e.g. closed the
  // tab and finished elsewhere), or for a screenshot shortcut.
  durationSeconds: number | null;
}

export interface IntegritySummary {
  flagged: boolean;
  tabSwitches: number;
  pageExits: number;
  focusLosses: number;
  screenshotAttempts: number;
  timeAwaySeconds: number;
  incidents: IntegrityIncident[];
}

// Enough for the teacher to see the pattern; the counts always cover everything.
export const MAX_REPORTED_INCIDENTS = 50;

const AWAY_SEVERITY: Partial<Record<IntegritySignal, number>> = {
  FOCUS_LOST: 1,
  TAB_HIDDEN: 2,
  PAGE_EXIT: 3,
};

export function summarizeIntegrity(
  events: { episodeId: string; type: IntegritySignal; occurredAt: Date }[],
): IntegritySummary {
  const episodes = new Map<string, typeof events>();
  for (const e of events) {
    const list = episodes.get(e.episodeId);
    if (list) list.push(e);
    else episodes.set(e.episodeId, [e]);
  }

  const incidents: (IntegrityIncident & { atMs: number })[] = [];
  for (const signals of episodes.values()) {
    const screenshot = signals
      .filter((s) => s.type === 'SCREENSHOT_KEY')
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())[0];
    if (screenshot) {
      incidents.push({
        type: 'SCREENSHOT_KEY',
        at: screenshot.occurredAt.toISOString(),
        atMs: screenshot.occurredAt.getTime(),
        durationSeconds: null,
      });
    }

    const away = signals.filter((s) => AWAY_SEVERITY[s.type] !== undefined);
    if (away.length === 0) continue;

    const startMs = Math.min(...away.map((s) => s.occurredAt.getTime()));
    const worst = away.reduce((a, b) => (AWAY_SEVERITY[b.type]! > AWAY_SEVERITY[a.type]! ? b : a));
    const returns = signals
      .filter((s) => s.type === 'RETURNED')
      .map((s) => s.occurredAt.getTime())
      .sort((a, b) => a - b);
    const endMs = returns.find((t) => t >= startMs) ?? returns.at(-1);

    incidents.push({
      type: worst.type as IntegrityIncidentType,
      at: new Date(startMs).toISOString(),
      atMs: startMs,
      durationSeconds: endMs === undefined ? null : Math.max(0, Math.round((endMs - startMs) / 1000)),
    });
  }

  incidents.sort((a, b) => a.atMs - b.atMs);
  const count = (type: IntegrityIncidentType) => incidents.filter((i) => i.type === type).length;

  return {
    flagged: incidents.length > 0,
    tabSwitches: count('TAB_HIDDEN'),
    pageExits: count('PAGE_EXIT'),
    focusLosses: count('FOCUS_LOST'),
    screenshotAttempts: count('SCREENSHOT_KEY'),
    timeAwaySeconds: incidents.reduce((sum, i) => sum + (i.durationSeconds ?? 0), 0),
    incidents: incidents.slice(0, MAX_REPORTED_INCIDENTS).map(({ atMs: _atMs, ...rest }) => rest),
  };
}
