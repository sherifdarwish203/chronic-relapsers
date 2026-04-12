import { stringify } from 'csv-stringify/sync';
import pool from '../db';

export async function generateCSV(): Promise<string> {
  const result = await pool.query(`
    SELECT
      p.code AS patient_code,
      p.substances,
      pr.id AS period_id,
      pr.type AS period_type,
      pr.start_month, pr.start_year,
      pr.end_month, pr.end_year,
      pr.duration_months,
      pr.note AS period_note,
      e.id AS event_id,
      e.description AS event_description,
      e.timeframe AS event_timeframe,
      e.feelings,
      e.external_triggers,
      e.internal_triggers,
      e.classification,
      e.saw_it_coming
    FROM patients p
    LEFT JOIN periods pr ON pr.patient_id = p.id
    LEFT JOIN events e ON e.period_id = pr.id
    ORDER BY p.code, pr.id, e.id
  `);

  const rows = result.rows.map((row) => ({
    patient_code: row.patient_code,
    substance_1: row.substances?.[0] || '',
    substance_2: row.substances?.[1] || '',
    substance_3: row.substances?.[2] || '',
    period_id: row.period_id || '',
    period_type: row.period_type || '',
    start_month: row.start_month || '',
    start_year: row.start_year || '',
    end_month: row.end_month || '',
    end_year: row.end_year || '',
    duration_months: row.duration_months || '',
    period_note: row.period_note || '',
    event_id: row.event_id || '',
    event_description: row.event_description || '',
    event_timeframe: row.event_timeframe || '',
    feelings: (row.feelings || []).join(';'),
    external_triggers: (row.external_triggers || []).join(';'),
    internal_triggers: (row.internal_triggers || []).join(';'),
    classification: row.classification || '',
    saw_it_coming: row.saw_it_coming || '',
  }));

  return stringify(rows, { header: true });
}
