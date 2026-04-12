import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { requireFacilitator } from '../middleware/auth';
import { getPatientAnalytics, getAggregateAnalytics } from '../services/analytics';
import { generateCSV } from '../services/export';
import { generatePatientPDF } from '../services/pdf';

const router = Router();

// POST /facilitators/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  try {
    const result = await pool.query('SELECT * FROM facilitators WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const facilitator = result.rows[0];
    const valid = await bcrypt.compare(password, facilitator.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign(
      { facilitator_id: facilitator.id, role: 'facilitator' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_FACILITATOR_EXPIRY || '8h' } as jwt.SignOptions
    );

    res.json({
      token,
      facilitator: {
        id: facilitator.id,
        username: facilitator.username,
        full_name: facilitator.full_name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /facilitators/patients — all patients with summary stats
router.get('/patients', requireFacilitator, async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT
        p.id, p.code, p.display_name, p.substances, p.updated_at,
        COUNT(DISTINCT pr.id) AS period_count,
        COUNT(DISTINCT CASE WHEN pr.type = 'relapse' THEN pr.id END) AS relapse_count,
        COUNT(DISTINCT CASE WHEN pr.type = 'abstinent' THEN pr.id END) AS abstinence_count,
        MAX(CASE WHEN pr.type = 'abstinent' THEN pr.duration_months END) AS longest_abstinence_months,
        COUNT(DISTINCT e.id) AS event_count
      FROM patients p
      LEFT JOIN periods pr ON pr.patient_id = p.id
      LEFT JOIN events e ON e.patient_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    res.json({ patients: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /facilitators/aggregate — aggregate trigger analytics
router.get('/aggregate', requireFacilitator, async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await getAggregateAnalytics();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /facilitators/export/csv
router.get('/export/csv', requireFacilitator, async (_req: Request, res: Response): Promise<void> => {
  try {
    const csv = await generateCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="recovery_research_export.csv"');
    // BOM for Excel UTF-8 compatibility
    res.send('\uFEFF' + csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /facilitators/patients/:id — single patient full data
router.get('/patients/:id', requireFacilitator, async (req: Request, res: Response): Promise<void> => {
  const patientId = parseInt(req.params.id);
  try {
    const patientResult = await pool.query('SELECT * FROM patients WHERE id = $1', [patientId]);
    if (patientResult.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const periodsResult = await pool.query(
      `SELECT * FROM periods WHERE patient_id = $1 ORDER BY (start_year * 12 + start_month) ASC`,
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

    const analytics = await getPatientAnalytics(patientId);

    res.json({ patient: patientResult.rows[0], periods, analytics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /facilitators/patients/:id/pdf
router.get('/patients/:id/pdf', requireFacilitator, async (req: Request, res: Response): Promise<void> => {
  const patientId = parseInt(req.params.id);
  try {
    const pdfBuffer = await generatePatientPDF(patientId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="patient_${patientId}_summary.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

export default router;
