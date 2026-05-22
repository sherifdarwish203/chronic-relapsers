import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { requireFacilitator } from '../middleware/auth';
import { randomBytes } from 'crypto';

const router = Router();

/**
 * Generate a short random token for invitation links
 * Format: 24 character hex string (12 bytes)
 */
function generateInvitationToken(): string {
  return randomBytes(12).toString('hex');
}

// ============================================================================
// THERAPIST FREEMIUM INVITATION ENDPOINTS
// ============================================================================

/**
 * POST /api/v1/facilitators/invitations
 * Generate a freemium invitation link for a patient
 * Therapist can pre-fill optional patient metadata
 * NOTE: No seats are deducted; therapist can create unlimited invitation links
 */
router.post('/facilitators/invitations', requireFacilitator, async (req: Request, res: Response) => {
  try {
    const facilitator_id = req.facilitator!.id;
    const { display_name, email, phone_number } = req.body;

    // Generate unique token
    let token_code = generateInvitationToken();
    let tokenExists = true;
    let attempts = 0;
    const maxAttempts = 5;

    while (tokenExists && attempts < maxAttempts) {
      const existing = await pool.query(
        'SELECT id FROM patient_invitations WHERE token_code = $1',
        [token_code]
      );
      if (existing.rows.length === 0) {
        tokenExists = false;
      } else {
        token_code = generateInvitationToken();
        attempts++;
      }
    }

    if (tokenExists) {
      return res.status(500).json({ error: 'Failed to generate unique token' });
    }

    // Create invitation record
    const result = await pool.query(
      `INSERT INTO patient_invitations (token_code, facilitator_id, display_name, email, phone_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, token_code, facilitator_id, display_name, email, phone_number, created_at`,
      [token_code, facilitator_id, display_name || null, email || null, phone_number || null]
    );

    const invitation = result.rows[0];
    const invite_link = `https://rehab.recoverypsychcenter.com/register?token=${token_code}`;

    res.status(201).json({
      invitation: {
        ...invitation,
        invite_link
      },
      message: 'Invitation link created successfully'
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/facilitators/invitations
 * List all invitation links created by this therapist
 * Includes pending and used invitations
 */
router.get('/facilitators/invitations', requireFacilitator, async (req: Request, res: Response) => {
  try {
    const facilitator_id = req.facilitator!.id;

    const result = await pool.query(
      `SELECT
         id,
         token_code,
         display_name,
         email,
         phone_number,
         used_at,
         patient_id,
         cancelled_at,
         created_at,
         CASE
           WHEN cancelled_at IS NOT NULL THEN 'cancelled'
           WHEN used_at IS NOT NULL THEN 'used'
           ELSE 'pending'
         END as status
       FROM patient_invitations
       WHERE facilitator_id = $1
       ORDER BY created_at DESC`,
      [facilitator_id]
    );

    const invitations = result.rows.map(inv => ({
      ...inv,
      invite_link: inv.cancelled_at ? null : `https://rehab.recoverypsychcenter.com/register?token=${inv.token_code}`
    }));

    res.json({
      invitations,
      count: invitations.length,
      pending: invitations.filter(i => i.status === 'pending').length,
      used: invitations.filter(i => i.status === 'used').length,
      cancelled: invitations.filter(i => i.status === 'cancelled').length
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/v1/facilitators/invitations/:token/revoke
 * Revoke an unused invitation link
 * If the invitation hasn't been used, it can be cancelled and regenerated
 */
router.patch('/facilitators/invitations/:token/revoke', requireFacilitator, async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const facilitator_id = req.facilitator!.id;

    // Verify invitation belongs to this facilitator
    const invCheck = await pool.query(
      'SELECT id, used_at FROM patient_invitations WHERE token_code = $1 AND facilitator_id = $2',
      [token, facilitator_id]
    );

    if (invCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found or does not belong to you' });
    }

    const invitation = invCheck.rows[0];

    if (invitation.used_at) {
      return res.status(409).json({ error: 'Cannot revoke an invitation that has already been used' });
    }

    // Mark as cancelled
    const result = await pool.query(
      `UPDATE patient_invitations
       SET cancelled_at = NOW()
       WHERE token_code = $1
       RETURNING id, token_code, display_name, cancelled_at`,
      [token]
    );

    res.json({
      invitation: result.rows[0],
      message: 'Invitation revoked successfully'
    });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// PATIENT REGISTRATION ENDPOINTS (Public, no auth required)
// ============================================================================

/**
 * GET /api/v1/auth/invitations/:token
 * Validate and retrieve invitation metadata (pre-filled form data)
 * Public endpoint (no auth required)
 */
router.get('/auth/invitations/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `SELECT token_code, display_name, email, phone_number, used_at, cancelled_at
       FROM patient_invitations
       WHERE token_code = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitation = result.rows[0];

    // Check if invitation has already been used
    if (invitation.used_at) {
      return res.status(409).json({ error: 'This invitation has already been used' });
    }

    // Check if invitation has been cancelled
    if (invitation.cancelled_at) {
      return res.status(410).json({ error: 'This invitation has been cancelled' });
    }

    // Return pre-fill data
    res.json({
      invitation: {
        token_code: invitation.token_code,
        prefill: {
          display_name: invitation.display_name,
          email: invitation.email,
          phone_number: invitation.phone_number
        }
      }
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
