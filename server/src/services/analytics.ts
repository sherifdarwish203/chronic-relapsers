import pool from '../db';

interface FreqItem {
  name: string;
  count: number;
}

function countFrequency(arrays: string[][]): FreqItem[] {
  const map: Record<string, number> = {};
  for (const arr of arrays) {
    for (const item of arr) {
      if (item) map[item] = (map[item] || 0) + 1;
    }
  }
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getPatientAnalytics(patientId: number) {
  const events = await pool.query(
    `SELECT feelings, external_triggers, internal_triggers, classification
     FROM events WHERE patient_id = $1`,
    [patientId]
  );

  const rows = events.rows;
  if (rows.length === 0) return null;

  const classificationCounts = { i: 0, x: 0, b: 0 };
  for (const row of rows) {
    if (row.classification === 'i') classificationCounts.i++;
    else if (row.classification === 'x') classificationCounts.x++;
    else if (row.classification === 'b') classificationCounts.b++;
  }

  const topFeelings = countFrequency(rows.map((r) => r.feelings || [])).slice(0, 5);
  const topExternal = countFrequency(rows.map((r) => r.external_triggers || [])).slice(0, 4);
  const topInternal = countFrequency(rows.map((r) => r.internal_triggers || [])).slice(0, 4);

  return {
    event_count: rows.length,
    classification_counts: classificationCounts,
    top_feelings: topFeelings,
    top_external_triggers: topExternal,
    top_internal_triggers: topInternal,
  };
}

export async function getAggregateAnalytics() {
  const patientCount = await pool.query('SELECT COUNT(*) FROM patients');
  const relapseCount = await pool.query(`SELECT COUNT(*) FROM periods WHERE type = 'relapse'`);
  const events = await pool.query(
    `SELECT feelings, external_triggers, internal_triggers, classification, saw_it_coming FROM events`
  );

  const rows = events.rows;
  const totalEvents = rows.length;

  const classificationCounts = { i: 0, x: 0, b: 0 };
  const sawItComing = { y: 0, p: 0, n: 0 };

  for (const row of rows) {
    if (row.classification === 'i') classificationCounts.i++;
    else if (row.classification === 'x') classificationCounts.x++;
    else if (row.classification === 'b') classificationCounts.b++;

    if (row.saw_it_coming === 'y') sawItComing.y++;
    else if (row.saw_it_coming === 'p') sawItComing.p++;
    else if (row.saw_it_coming === 'n') sawItComing.n++;
  }

  const internalPct = totalEvents ? Math.round((classificationCounts.i / totalEvents) * 100) : 0;
  const externalPct = totalEvents ? Math.round((classificationCounts.x / totalEvents) * 100) : 0;
  const bothPct = totalEvents ? Math.round((classificationCounts.b / totalEvents) * 100) : 0;

  const topFeelings = countFrequency(rows.map((r) => r.feelings || [])).slice(0, 5);
  const topExternal = countFrequency(rows.map((r) => r.external_triggers || [])).slice(0, 5);
  const topInternal = countFrequency(rows.map((r) => r.internal_triggers || [])).slice(0, 5);

  return {
    total_patients: parseInt(patientCount.rows[0].count),
    total_relapses: parseInt(relapseCount.rows[0].count),
    total_events: totalEvents,
    internal_pct: internalPct,
    external_pct: externalPct,
    both_pct: bothPct,
    top_feelings: topFeelings,
    top_external_triggers: topExternal,
    top_internal_triggers: topInternal,
    saw_it_coming: sawItComing,
  };
}
