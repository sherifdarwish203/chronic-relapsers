import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { requirePatient } from '../middleware/auth';
import { sanitiseText, sanitiseArray } from '../middleware/validate';

const router = Router();

/**
 * Helper: Check if a freemium patient's trial has expired
 * Returns true if trial_expires_at < NOW() and payment_status is still 'trial_active'
 */
async function updateTrialStatusIfExpired(patient_id: number): Promise<void> {
  try {
    const patient = await pool.query(
      `SELECT trial_expires_at, payment_status FROM patients WHERE id = $1`,
      [patient_id]
    );

    if (patient.rows.length > 0) {
      const p = patient.rows[0];
      if (p.payment_status === 'trial_active' && p.trial_expires_at && new Date(p.trial_expires_at) < new Date()) {
        await pool.query(
          `UPDATE patients SET payment_status = $1 WHERE id = $2`,
          ['trial_expired_unpaid', patient_id]
        );
      }
    }
  } catch (error) {
    console.error('Error checking trial expiration:', error);
  }
}

// POST /patients/login — retrieve patient by code and update their display name
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const code = sanitiseText(req.body.code);
  const display_name = sanitiseText(req.body.display_name || '');

  if (!code) {
    res.status(400).json({ error: 'الكود مطلوب' });
    return;
  }
  if (!display_name) {
    res.status(400).json({ error: 'الاسم مطلوب' });
    return;
  }

  try {
    let patient;
    const existing = await pool.query('SELECT * FROM patients WHERE code = $1', [code]);

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'الكود غير موجود — تأكد من الكود مع المعالج' });
      return;
    }

    // Update display_name with whatever the patient typed
    const updated = await pool.query(
      'UPDATE patients SET display_name = $1 WHERE id = $2 RETURNING *',
      [display_name, existing.rows[0].id]
    );
    patient = updated.rows[0];

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

    const activitiesResult = await pool.query(
      `SELECT * FROM activities WHERE patient_id = $1
       ORDER BY (act_year * 12 + act_month) DESC, COALESCE(act_day, 0) DESC`,
      [patientId]
    );

    res.json({ patient, periods, activities: activitiesResult.rows });
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

// ============================================================================
// FREEMIUM REGISTRATION ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/auth/register
 * Freemium patient self-registration with invitation token
 * Public endpoint (no auth required)
 */
router.post('/auth/register', async (req: Request, res: Response): Promise<void> => {
  const { token, display_name, email, phone_number, date_of_birth } = req.body;

  // Validation
  if (!token) {
    res.status(400).json({ error: 'رمز الدعوة مطلوب' });
    return;
  }
  if (!display_name) {
    res.status(400).json({ error: 'الاسم مطلوب' });
    return;
  }
  if (!date_of_birth) {
    res.status(400).json({ error: 'تاريخ الميلاد مطلوب' });
    return;
  }

  try {
    // Validate invitation token
    const invResult = await pool.query(
      `SELECT id, facilitator_id, used_at, cancelled_at FROM patient_invitations WHERE token_code = $1`,
      [token]
    );

    if (invResult.rows.length === 0) {
      res.status(404).json({ error: 'رمز الدعوة غير صحيح' });
      return;
    }

    const invitation = invResult.rows[0];

    if (invitation.used_at) {
      res.status(409).json({ error: 'تم استخدام هذه الدعوة بالفعل' });
      return;
    }

    if (invitation.cancelled_at) {
      res.status(410).json({ error: 'تم إلغاء هذه الدعوة' });
      return;
    }

    // Generate unique code for patient (for backward compatibility)
    let code = `F${Math.random().toString().slice(2, 8).padStart(6, '0')}`;
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 5) {
      const codeCheck = await pool.query('SELECT id FROM patients WHERE code = $1', [code]);
      if (codeCheck.rows.length === 0) {
        codeExists = false;
      } else {
        code = `F${Math.random().toString().slice(2, 8).padStart(6, '0')}`;
        attempts++;
      }
    }

    if (codeExists) {
      res.status(500).json({ error: 'خطأ في إنشاء الحساب' });
      return;
    }

    // Create patient with freemium registration
    const trialStart = new Date();
    const trialExpires = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const patientResult = await pool.query(
      `INSERT INTO patients (
        code, display_name, registration_type, facilitator_id, trial_start_at, trial_expires_at, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, code, display_name, registration_type, facilitator_id, trial_start_at, trial_expires_at, payment_status, created_at`,
      [code, display_name, 'freemium', invitation.facilitator_id || null, trialStart, trialExpires, 'trial_active']
    );

    const patient = patientResult.rows[0];

    // Mark invitation as used
    await pool.query(
      `UPDATE patient_invitations SET used_at = NOW(), patient_id = $1 WHERE id = $2`,
      [patient.id, invitation.id]
    );

    // Create JWT token
    const jwtToken = jwt.sign(
      { patient_id: patient.id, code: patient.code, role: 'patient' },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_PATIENT_EXPIRY || '30d' } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'تم إنشاء حسابك بنجاح! لديك 14 يومًا من الوصول الكامل مجانًا',
      token: jwtToken,
      patient: {
        id: patient.id,
        display_name: patient.display_name,
        registration_type: patient.registration_type,
        trial_expires_at: patient.trial_expires_at,
        payment_status: patient.payment_status
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

// ============================================================================
// PATIENT ACCESS STATUS & LINKING ENDPOINTS
// ============================================================================

/**
 * GET /api/v1/patients/me/access-status
 * Get current access status (trial info, payment status, can edit)
 * Patient only
 */
router.get('/me/access-status', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;

  try {
    const result = await pool.query(
      `SELECT
         id, registration_type, trial_start_at, trial_expires_at, payment_status, payment_approved_at, facilitator_id
       FROM patients WHERE id = $1`,
      [patientId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'المريض غير موجود' });
      return;
    }

    const patient = result.rows[0];

    // Check if trial has expired
    await updateTrialStatusIfExpired(patientId);

    // Re-fetch after potential status update
    const updated = await pool.query(
      `SELECT payment_status, trial_expires_at FROM patients WHERE id = $1`,
      [patientId]
    );
    const currentStatus = updated.rows[0];

    const can_edit = !['trial_expired_unpaid'].includes(currentStatus.payment_status);

    res.json({
      access: {
        registration_type: patient.registration_type,
        payment_status: currentStatus.payment_status,
        trial_expires_at: patient.trial_expires_at,
        is_linked_to_therapist: patient.facilitator_id !== null,
        can_edit,
        trial_days_remaining: patient.trial_expires_at
          ? Math.max(
              0,
              Math.ceil((new Date(patient.trial_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            )
          : null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

/**
 * POST /api/v1/patients/me/link-to-therapist
 * Freemium patient links to a therapist (upgrades to therapist_linked status)
 * Patient provides a therapist-generated invitation code or token
 * Patient only
 */
router.post('/me/link-to-therapist', requirePatient, async (req: Request, res: Response): Promise<void> => {
  const patientId = req.patient!.patient_id;
  const { invitation_token } = req.body;

  if (!invitation_token) {
    res.status(400).json({ error: 'رمز الدعوة مطلوب' });
    return;
  }

  try {
    // Verify invitation exists and get therapist
    const invResult = await pool.query(
      `SELECT facilitator_id FROM patient_invitations WHERE token_code = $1 AND cancelled_at IS NULL`,
      [invitation_token]
    );

    if (invResult.rows.length === 0) {
      res.status(404).json({ error: 'رمز الدعوة غير صحيح أو ملغى' });
      return;
    }

    const facilitator_id = invResult.rows[0].facilitator_id;

    if (!facilitator_id) {
      res.status(400).json({ error: 'هذه الدعوة لا ترتبط بمعالج محدد' });
      return;
    }

    // Update patient status
    const result = await pool.query(
      `UPDATE patients
       SET facilitator_id = $1, payment_status = $2
       WHERE id = $3
       RETURNING id, display_name, facilitator_id, payment_status`,
      [facilitator_id, 'therapist_linked', patientId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'المريض غير موجود' });
      return;
    }

    res.json({
      message: 'تم الارتباط مع المعالج بنجاح!',
      patient: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
});

export default router;
