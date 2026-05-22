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

// POST /facilitators — create a new facilitator account (requires facilitator auth)
router.post('/', requireFacilitator, async (req: Request, res: Response): Promise<void> => {
  const username = (req.body.username || '').toString().trim().toLowerCase();
  const password = (req.body.password || '').toString();
  const full_name = (req.body.full_name || '').toString().trim();

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters' });
    return;
  }

  try {
    const existing = await pool.query('SELECT id FROM facilitators WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO facilitators (username, password_hash, full_name)
       VALUES ($1, $2, $3)
       RETURNING id, username, full_name, created_at`,
      [username, password_hash, full_name || null]
    );

    res.status(201).json({ facilitator: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /facilitators/patients — generate a new patient code and create the record
router.post('/patients', requireFacilitator, async (req: Request, res: Response): Promise<void> => {
  const display_name = (req.body.display_name || '').toString().trim() || 'مريض جديد';

  try {
    // Generate a unique code: one uppercase letter + 6 digits (e.g. A123456)
    let code = '';
    let attempts = 0;
    while (attempts < 20) {
      const letter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A–Z
      const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
      code = letter + digits;
      const existing = await pool.query('SELECT id FROM patients WHERE code = $1', [code]);
      if (existing.rows.length === 0) break;
      attempts++;
    }
    if (!code) {
      res.status(500).json({ error: 'Could not generate a unique code' });
      return;
    }

    const result = await pool.query(
      `INSERT INTO patients (code, display_name, substances)
       VALUES ($1, $2, $3) RETURNING id, code, display_name, created_at`,
      [code, display_name, []]
    );

    res.status(201).json({ patient: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /facilitators/patients/:id — update patient name and/or substances
router.patch('/patients/:id', requireFacilitator, async (req: Request, res: Response): Promise<void> => {
  const patientId = parseInt(req.params.id);
  const display_name = (req.body.display_name || '').toString().trim();
  const substances: string[] = Array.isArray(req.body.substances) ? req.body.substances : [];

  if (!display_name) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE patients SET display_name = $1, substances = $2 WHERE id = $3 RETURNING *`,
      [display_name, substances, patientId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }
    res.json({ patient: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /facilitators/seat-usage — get seat availability for this therapist
router.get('/seat-usage', requireFacilitator, async (req: Request, res: Response): Promise<void> => {
  const facilitator_id = req.facilitator!.id;

  try {
    // Get active token for this facilitator
    const tokenResult = await pool.query(
      `SELECT seat_count, seats_used FROM licensing_tokens
       WHERE assigned_facilitator_id = $1 AND is_active = TRUE
       LIMIT 1`,
      [facilitator_id]
    );

    if (tokenResult.rows.length === 0) {
      // Facilitator has no token; assume grandfathered with unlimited
      res.json({
        usage: {
          total: 999999,
          used: 0,
          available: 999999,
          percentage: 0,
          unlimited: true
        }
      });
      return;
    }

    const token = tokenResult.rows[0];
    const available = token.seat_count - token.seats_used;
    const percentage = Math.round((token.seats_used / token.seat_count) * 100);

    res.json({
      usage: {
        total: token.seat_count,
        used: token.seats_used,
        available,
        percentage,
        unlimited: false
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /facilitators/patients/create — create therapist-managed patient account (charges seat immediately)
router.post('/patients/create', requireFacilitator, async (req: Request, res: Response): Promise<void> => {
  const facilitator_id = req.facilitator!.id;
  const { display_name, username, password, date_of_birth, email, phone_number } = req.body;

  // Validation
  if (!display_name || !username || !password || !date_of_birth) {
    res.status(400).json({ error: 'display_name, username, password, and date_of_birth are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  try {
    // Check token and available seats
    const tokenResult = await pool.query(
      `SELECT id, seat_count, seats_used FROM licensing_tokens
       WHERE assigned_facilitator_id = $1 AND is_active = TRUE
       LIMIT 1`,
      [facilitator_id]
    );

    let token_id = null;
    let checkSeats = false;

    if (tokenResult.rows.length > 0) {
      const token = tokenResult.rows[0];
      token_id = token.id;
      checkSeats = true;

      // Check if seats available
      if (token.seats_used >= token.seat_count) {
        res.status(403).json({ error: 'لا توجد مقاعد متاحة — اشتري المزيد' });
        return;
      }
    }

    // Check if username already exists
    const userCheck = await pool.query('SELECT id FROM patients WHERE code = $1', [username]);
    if (userCheck.rows.length > 0) {
      res.status(409).json({ error: 'Username already exists' });
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Create patient (use username as code for therapist-managed)
    const patientResult = await pool.query(
      `INSERT INTO patients (
        code, display_name, registration_type, facilitator_id,
        payment_status, password_hash
      ) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, display_name, registration_type, facilitator_id, payment_status, created_at`,
      [username, display_name, 'therapist_managed', facilitator_id, 'therapist_linked', password_hash]
    );

    const patient = patientResult.rows[0];

    // Deduct seat from token
    if (token_id) {
      await pool.query(
        `UPDATE licensing_tokens SET seats_used = seats_used + 1 WHERE id = $1`,
        [token_id]
      );
    }

    res.status(201).json({
      patient: {
        id: patient.id,
        display_name: patient.display_name,
        username: patient.code,
        registration_type: patient.registration_type,
        payment_status: patient.payment_status
      },
      message: 'تم إنشاء الحساب بنجاح. تم خصم مقعد واحد من رصيدك.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /facilitators/patients — therapist's patients (filtered by facilitator_id)
router.get('/patients', requireFacilitator, async (req: Request, res: Response): Promise<void> => {
  const facilitator_id = req.facilitator!.id;

  try {
    const result = await pool.query(`
      SELECT
        p.id, p.code, p.display_name, p.substances, p.updated_at,
        p.registration_type, p.payment_status, p.trial_expires_at, p.facilitator_id,
        COUNT(DISTINCT pr.id) AS period_count,
        COUNT(DISTINCT CASE WHEN pr.type = 'relapse' THEN pr.id END) AS relapse_count,
        COUNT(DISTINCT CASE WHEN pr.type = 'abstinent' THEN pr.id END) AS abstinence_count,
        MAX(CASE WHEN pr.type = 'abstinent' THEN pr.duration_months END) AS longest_abstinence_months,
        COUNT(DISTINCT e.id) AS event_count
      FROM patients p
      LEFT JOIN periods pr ON pr.patient_id = p.id
      LEFT JOIN events e ON e.patient_id = p.id
      WHERE p.facilitator_id = $1
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `, [facilitator_id]);

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
