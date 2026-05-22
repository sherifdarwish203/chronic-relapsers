import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db/pool';
import { requireFacilitator } from '../middleware/auth';

const router = Router();

// Middleware to verify admin status (for now, all facilitators are admins; future: add role-based access)
const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.facilitator) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // For MVP: all facilitators are admins. In future, check facilitator.role === 'admin'
  next();
};

// ============================================================================
// LICENSING TOKEN ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/admin/tokens
 * Create a new licensing token
 * Admin only
 */
router.post('/tokens', requireFacilitator, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { token_code, seat_count, assigned_facilitator_id, notes } = req.body;

    // Validation
    if (!token_code || !seat_count || seat_count <= 0) {
      return res.status(400).json({ error: 'token_code and seat_count (> 0) are required' });
    }

    // Check if token already exists
    const existingToken = await pool.query(
      'SELECT id FROM licensing_tokens WHERE token_code = $1',
      [token_code]
    );
    if (existingToken.rows.length > 0) {
      return res.status(409).json({ error: 'Token already exists' });
    }

    // Create token
    const result = await pool.query(
      `INSERT INTO licensing_tokens (token_code, seat_count, assigned_facilitator_id, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, token_code, seat_count, seats_used, assigned_facilitator_id, is_active, created_at, notes`,
      [token_code, seat_count, assigned_facilitator_id || null, notes || null]
    );

    res.status(201).json({ token: result.rows[0] });
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/admin/tokens
 * List all licensing tokens
 * Admin only
 */
router.get('/tokens', requireFacilitator, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, token_code, seat_count, seats_used, assigned_facilitator_id, is_active, created_at, assigned_at, notes
       FROM licensing_tokens
       ORDER BY created_at DESC`
    );

    res.json({ tokens: result.rows });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/v1/admin/tokens/:id/assign
 * Assign token to a facilitator
 * Admin only
 */
router.patch('/tokens/:id/assign', requireFacilitator, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { facilitator_id } = req.body;

    if (!facilitator_id) {
      return res.status(400).json({ error: 'facilitator_id is required' });
    }

    // Verify facilitator exists
    const facilCheck = await pool.query('SELECT id FROM facilitators WHERE id = $1', [facilitator_id]);
    if (facilCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Facilitator not found' });
    }

    // Update token
    const result = await pool.query(
      `UPDATE licensing_tokens
       SET assigned_facilitator_id = $1, assigned_at = NOW()
       WHERE id = $2
       RETURNING id, token_code, seat_count, seats_used, assigned_facilitator_id, is_active, created_at, assigned_at`,
      [facilitator_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({ token: result.rows[0] });
  } catch (error) {
    console.error('Error assigning token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/v1/admin/tokens/:id/deactivate
 * Deactivate a token (therapist loses ability to create managed accounts)
 * Admin only
 */
router.patch('/tokens/:id/deactivate', requireFacilitator, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE licensing_tokens
       SET is_active = FALSE
       WHERE id = $1
       RETURNING id, token_code, seat_count, seats_used, assigned_facilitator_id, is_active, created_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    res.json({ token: result.rows[0] });
  } catch (error) {
    console.error('Error deactivating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/admin/facilitators/:id/usage
 * Get seat usage for a specific facilitator
 * Admin only
 */
router.get('/facilitators/:id/usage', requireFacilitator, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get token for facilitator
    const tokenResult = await pool.query(
      'SELECT id, seat_count, seats_used FROM licensing_tokens WHERE assigned_facilitator_id = $1 AND is_active = TRUE',
      [id]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'No active token found for facilitator' });
    }

    const token = tokenResult.rows[0];
    const available = token.seat_count - token.seats_used;
    const percentage = Math.round((token.seats_used / token.seat_count) * 100);

    res.json({
      usage: {
        total: token.seat_count,
        used: token.seats_used,
        available,
        percentage
      }
    });
  } catch (error) {
    console.error('Error fetching seat usage:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// PAYMENT APPROVAL ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/admin/payments/:patient_id/approve
 * Approve direct patient payment (freemium upgrade to paid)
 * Admin only
 */
router.post('/payments/:patient_id/approve', requireFacilitator, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { patient_id } = req.params;

    // Verify patient exists
    const patientCheck = await pool.query('SELECT id FROM patients WHERE id = $1', [patient_id]);
    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Update payment status
    const result = await pool.query(
      `UPDATE patients
       SET payment_status = 'paid', payment_approved_at = NOW()
       WHERE id = $1
       RETURNING id, display_name, payment_status, payment_approved_at`,
      [patient_id]
    );

    res.json({
      patient: result.rows[0],
      message: 'Payment approved successfully'
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/admin/patients/pending-payments
 * List freemium patients awaiting payment approval
 * Admin only
 */
router.get('/patients/pending-payments', requireFacilitator, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, display_name, registration_type, trial_expires_at, payment_status, created_at
       FROM patients
       WHERE registration_type = 'freemium' AND payment_status = 'trial_expired_unpaid'
       ORDER BY trial_expires_at ASC`
    );

    res.json({
      patients: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
