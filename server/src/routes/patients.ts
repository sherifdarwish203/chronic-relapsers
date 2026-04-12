import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { requirePatient } from '../middleware/auth';
import { sanitiseText, sanitiseArray } from '../middleware/validate';

const router = Router();

// POST /patients/login — create or retrieve patient
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const code = sanitiseText(req.body.code);
  const display_name = sanitiseText(req.body.display_name || '');

  if (!code) {
    res.status(400).json({ error: 'الكود مطلوب' });
    return;
  }

  try {
    let patient;
    const existing = await pool.query('SELECT * FROM patients WHERE code = $1', [code]);

    if (existing.rows.length > 0) {
      patient = existing.rows[0];
      // Update display_name if provided and different
      if (display_name && display_name !== patient.display_name) {
        const updated = await pool.query(
          'UPDATE patients SET display_name = $1 WHERE id = $2 RETURNING *',
          [display_name, patient.id]
        );
        patient = updated.rows[0];
      }
    } else {
      if (!display_name) {
        res.status(404).json({ error: 'لم يتم العثور على بيانات بهذا الكود' });
        return;
      }
      const created = await pool.query(
        'INSERT INTO patients (code, display_name, substances) VALUES ($1, $2, $3) RETURNING *',
        [code, display_name, []]
      );
      patient = created.rows[0];
    }

    const token = jwt.sign(
      { patient_id: patient.id, code: patient.code, role: 'patient' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_PATIENT_EXPIRY || '30d' } as jwt.SignOptions
    );

    res.json({ token, patient });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// GET /patients/me — return patient with periods and events
router.get('/me', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;

  try {
    const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [patientId]);
    if (patientResult.rows.length === 0) {
      res.status(404).json({ error: 'المريض غير موجود' });
      return;
    }
    const patient = patientResult.rows[0];

    const periodsResult = await pool.query(
      `SELECT * FROM periods WHERE patient_id = $1
       ORDER BY (start_year * 12 + start_month) ASC`,
      [patientId]
    );

    const periods = await Promise.all(
      periodsResult.rows.map(async (period) => {
        const eventsResult = await pool.query(
          'SELECT * FROM events WHERE period_id = $1 ORDER BY created_at ASC',
          [period.id]
        );
        return { ...period, events: eventsResult.rows };
      })
    );

    res.json({ patient, periods });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /patients/me — update substances
router.patch('/me', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const substances = sanitiseArray(req.body.substances);

  try {
    const result = await pool.query(
      'UPDATE patients SET substances = $1 WHERE id = $2 RETURNING *',
      [substances, patientId]
    );
    res.json({ patient: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
