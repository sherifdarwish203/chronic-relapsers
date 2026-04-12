import { Router, Request, Response } from 'express';
import pool from '../db';
import { requirePatient } from '../middleware/auth';
import { sanitiseText, sanitiseArray } from '../middleware/validate';

const router = Router();

// POST /periods/:period_id/events — add an event to a relapse period
router.post('/:period_id/events', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const periodId = parseInt(req.params.period_id);

  // Verify period belongs to patient
  const periodResult = await pool.query(
    'SELECT * FROM periods WHERE id = $1 AND patient_id = $2',
    [periodId, patientId]
  );
  if (periodResult.rows.length === 0) {
    res.status(404).json({ error: 'الفترة غير موجودة' });
    return;
  }

  const description = sanitiseText(req.body.description);
  if (!description) {
    res.status(400).json({ error: 'وصف الحدث مطلوب' });
    return;
  }

  const validTimeframes = ['same_day', 'days', 'weeks', 'months'];
  const timeframe = req.body.timeframe && validTimeframes.includes(req.body.timeframe)
    ? req.body.timeframe
    : null;

  const validClassifications = ['i', 'x', 'b'];
  const classification = validClassifications.includes(req.body.classification)
    ? req.body.classification
    : null;

  const validSawItComing = ['y', 'p', 'n'];
  const saw_it_coming = validSawItComing.includes(req.body.saw_it_coming)
    ? req.body.saw_it_coming
    : null;

  const feelings = sanitiseArray(req.body.feelings);
  const external_triggers = sanitiseArray(req.body.external_triggers);
  const internal_triggers = sanitiseArray(req.body.internal_triggers);

  try {
    const result = await pool.query(
      `INSERT INTO events (period_id, patient_id, description, timeframe, feelings, external_triggers, internal_triggers, classification, saw_it_coming)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [periodId, patientId, description, timeframe, feelings, external_triggers, internal_triggers, classification, saw_it_coming]
    );
    res.status(201).json({ event: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
