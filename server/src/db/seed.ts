import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
import bcrypt from 'bcrypt';
import pool from './index';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed facilitator
    const passwordHash = await bcrypt.hash('Recovery2024!', 12);
    await client.query(
      `INSERT INTO facilitators (username, password_hash, full_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ['dr.sherif', passwordHash, 'Dr. Sherif Darwish']
    );

    // Seed Patient 1
    const p1 = await client.query(
      `INSERT INTO patients (code, display_name, substances)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET display_name = EXCLUDED.display_name, substances = EXCLUDED.substances
       RETURNING id`,
      ['A001', 'أحمد', ['كحول', 'أفيونات']]
    );
    const p1Id = p1.rows[0].id;

    // Clear existing periods/events for patient 1 to avoid duplicates on re-seed
    await client.query('DELETE FROM periods WHERE patient_id = $1', [p1Id]);

    // Patient 1 Period 1: abstinent Mar 2020 → Aug 2021 (17 months)
    await client.query(
      `INSERT INTO periods (patient_id, type, start_month, start_year, end_month, end_year, duration_months, note, sort_order)
       VALUES ($1, 'abstinent', 3, 2020, 8, 2021, 17, 'بدأت العلاج', 1)`,
      [p1Id]
    );

    // Patient 1 Period 2: relapse Sep 2021 → Jan 2022 (4 months)
    const p1Period2 = await client.query(
      `INSERT INTO periods (patient_id, type, start_month, start_year, end_month, end_year, duration_months, note, sort_order)
       VALUES ($1, 'relapse', 9, 2021, 1, 2022, 4, 'حصل خلاف في الأسرة', 2)
       RETURNING id`,
      [p1Id]
    );
    const p1Period2Id = p1Period2.rows[0].id;

    // Event for period 2
    await client.query(
      `INSERT INTO events (period_id, patient_id, description, timeframe, feelings, external_triggers, internal_triggers, classification, saw_it_coming)
       VALUES ($1, $2, 'كنت وحيد جداً', 'weeks', $3, $4, $5, 'b', 'p')`,
      [p1Period2Id, p1Id, ['وحدة', 'حزن'], ['ضغوط أسرية'], []]
    );

    // Patient 1 Period 3: abstinent Feb 2022 → present
    await client.query(
      `INSERT INTO periods (patient_id, type, start_month, start_year, end_month, end_year, duration_months, note, sort_order)
       VALUES ($1, 'abstinent', 2, 2022, NULL, NULL, NULL, 'رجعت للعلاج ولقيت دعم', 3)`,
      [p1Id]
    );

    // Seed Patient 2
    const p2 = await client.query(
      `INSERT INTO patients (code, display_name, substances)
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO UPDATE SET display_name = EXCLUDED.display_name, substances = EXCLUDED.substances
       RETURNING id`,
      ['B002', 'سارة', ['بنزوديازيبينات']]
    );
    const p2Id = p2.rows[0].id;

    await client.query('DELETE FROM periods WHERE patient_id = $1', [p2Id]);

    // Patient 2 Period 1: abstinent Jan 2019 → Dec 2019 (11 months)
    await client.query(
      `INSERT INTO periods (patient_id, type, start_month, start_year, end_month, end_year, duration_months, note, sort_order)
       VALUES ($1, 'abstinent', 1, 2019, 12, 2019, 11, 'بدأت العلاج النفسي', 1)`,
      [p2Id]
    );

    // Patient 2 Period 2: relapse Jan 2020 → Jun 2020 (5 months)
    const p2Period2 = await client.query(
      `INSERT INTO periods (patient_id, type, start_month, start_year, end_month, end_year, duration_months, note, sort_order)
       VALUES ($1, 'relapse', 1, 2020, 6, 2020, 5, 'ضغط الشغل', 2)
       RETURNING id`,
      [p2Id]
    );
    const p2Period2Id = p2Period2.rows[0].id;

    await client.query(
      `INSERT INTO events (period_id, patient_id, description, timeframe, feelings, external_triggers, internal_triggers, classification, saw_it_coming)
       VALUES ($1, $2, 'ضغط شديد في العمل', 'weeks', $3, $4, $5, 'i', 'n')`,
      [p2Period2Id, p2Id, ['ضغط نفسي', 'قلق'], [], ['إيقاف الدواء']]
    );

    // Patient 2 Period 3: abstinent Jul 2020 → present
    await client.query(
      `INSERT INTO periods (patient_id, type, start_month, start_year, end_month, end_year, duration_months, note, sort_order)
       VALUES ($1, 'abstinent', 7, 2020, NULL, NULL, NULL, 'غيّرت الشغل', 3)`,
      [p2Id]
    );

    await client.query('COMMIT');
    console.log('Seed completed successfully.');
    console.log('  Facilitator: dr.sherif / Recovery2024!');
    console.log('  Patients: A001 (أحمد), B002 (سارة)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
