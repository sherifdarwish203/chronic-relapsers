import { Router, Request, Response } from 'express';
import pool from '../db';
import { requirePatient } from '../middleware/auth';
import { validatePeriodDates, calcDurationMonths, sanitiseText } from '../middleware/validate';

const router = Router();

// POST /periods — create a new period
router.post('/', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const { type, start_month, start_year, end_month, end_year } = req.body;
  const note = sanitiseText(req.body.note);
  const substances: string[] = Array.isArray(req.body.substances) ? req.body.substances : [];
  const urge_data = (req.body.urge_data && typeof req.body.urge_data === 'object') ? req.body.urge_data : null;

  // Validate type
  const validTypes = ['abstinent', 'relapse', 'reduced'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: 'نوع الفترة غير صالح' });
    return;
  }

  // Validate dates
  const dateError = validatePeriodDates({ start_month, start_year, end_month, end_year });
  if (dateError) {
    res.status(422).json({ error: dateError });
    return;
  }

  const duration_months = calcDurationMonths(start_month, start_year, end_month, end_year);

  try {
    // Get max sort_order for this patient
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) as max_order FROM periods WHERE patient_id = $1',
      [patientId]
    );
    const sort_order = maxOrder.rows[0].max_order + 1;

    const result = await pool.query(
      `INSERT INTO periods (patient_id, type, start_month, start_year, end_month, end_year, duration_months, note, substances, urge_data, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [patientId, type, start_month, start_year, end_month || null, end_year || null, duration_months, note || null, substances, urge_data, sort_order]
    );

    res.status(201).json({ period: { ...result.rows[0], events: [] } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /periods/:id — update a period
router.patch('/:id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const periodId = parseInt(req.params.id);

  // Verify ownership
  const existing = await pool.query(
    'SELECT * FROM periods WHERE id = $1 AND patient_id = $2',
    [periodId, patientId]
  );
  if (existing.rows.length === 0) {
    res.status(404).json({ error: 'الفترة غير موجودة' });
    return;
  }

  const current = existing.rows[0];
  const type = req.body.type || current.type;
  const start_month = req.body.start_month ?? current.start_month;
  const start_year = req.body.start_year ?? current.start_year;
  const end_month = req.body.end_month !== undefined ? req.body.end_month : current.end_month;
  const end_year = req.body.end_year !== undefined ? req.body.end_year : current.end_year;
  const note = req.body.note !== undefined ? sanitiseText(req.body.note) : current.note;
  const substances: string[] = req.body.substances !== undefined
    ? (Array.isArray(req.body.substances) ? req.body.substances : [])
    : current.substances;
  const urge_data = req.body.urge_data !== undefined
    ? ((req.body.urge_data && typeof req.body.urge_data === 'object') ? req.body.urge_data : null)
    : current.urge_data;

  const dateError = validatePeriodDates({ start_month, start_year, end_month, end_year });
  if (dateError) {
    res.status(422).json({ error: dateError });
    return;
  }

  const duration_months = calcDurationMonths(start_month, start_year, end_month, end_year);

  try {
    const result = await pool.query(
      `UPDATE periods SET type=$1, start_month=$2, start_year=$3, end_month=$4, end_year=$5,
       duration_months=$6, note=$7, substances=$8, urge_data=$9
       WHERE id=$10 AND patient_id=$11
       RETURNING *`,
      [type, start_month, start_year, end_month || null, end_year || null, duration_months, note, substances, urge_data, periodId, patientId]
    );

    const events = await pool.query('SELECT * FROM events WHERE period_id = $1', [periodId]);
    res.json({ period: { ...result.rows[0], events: events.rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// PATCH /periods/:id/urge — save urge assessment data only
router.patch('/:id/urge', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const periodId = parseInt(req.params.id);

  const existing = await pool.query(
    'SELECT id, type FROM periods WHERE id = $1 AND patient_id = $2',
    [periodId, patientId]
  );
  if (existing.rows.length === 0) {
    res.status(404).json({ error: 'الفترة غير موجودة' });
    return;
  }
  if (existing.rows[0].type !== 'reduced') {
    res.status(400).json({ error: 'تقييم الرغبة متاح فقط لفترات فكرة ضرب' });
    return;
  }

  const urge_data = req.body.urge_data;
  if (!urge_data || typeof urge_data !== 'object') {
    res.status(400).json({ error: 'بيانات التقييم مطلوبة' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE periods SET urge_data = $1 WHERE id = $2 AND patient_id = $3 RETURNING *`,
      [urge_data, periodId, patientId]
    );
    const events = await pool.query('SELECT * FROM events WHERE period_id = $1', [periodId]);
    res.json({ period: { ...result.rows[0], events: events.rows } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// DELETE /periods/:id
router.delete('/:id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const periodId = parseInt(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM periods WHERE id = $1 AND patient_id = $2 RETURNING id',
      [periodId, patientId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'الفترة غير موجودة' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
