import { Router, Request, Response } from 'express';
import pool from '../db';
import { requirePatient } from '../middleware/auth';
import { sanitiseText } from '../middleware/validate';

const router = Router();

// GET /activities
router.get('/', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  try {
    const result = await pool.query(
      `SELECT * FROM activities WHERE patient_id = $1
       ORDER BY (act_year * 12 + act_month) DESC, COALESCE(act_day, 0) DESC`,
      [patientId]
    );
    res.json({ activities: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// POST /activities
router.post('/', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const { act_month, act_year, type } = req.body;
  const act_day = req.body.act_day ? parseInt(req.body.act_day) : null;
  const therapist = sanitiseText(req.body.therapist);
  const summary = sanitiseText(req.body.summary);

  const validTypes = ['individual', 'group', 'community'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: 'نوع النشاط غير صالح' });
    return;
  }

  if (!act_month || !act_year) {
    res.status(400).json({ error: 'تاريخ النشاط مطلوب' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO activities (patient_id, act_day, act_month, act_year, type, therapist, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patientId, act_day, parseInt(act_month), parseInt(act_year), type, therapist || null, summary || null]
    );
    res.status(201).json({ activity: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /activities/:id
router.delete('/:id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const activityId = parseInt(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM activities WHERE id = $1 AND patient_id = $2 RETURNING id',
      [activityId, patientId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'النشاط غير موجود' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
