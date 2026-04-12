import { Router, Request, Response } from 'express';
import pool from '../db';
import { requirePatient } from '../middleware/auth';

const router = Router();

// DELETE /events/:id — delete a single event
router.delete('/:id', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const eventId = parseInt(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 AND patient_id = $2 RETURNING id',
      [eventId, patientId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'الحدث غير موجود' });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
