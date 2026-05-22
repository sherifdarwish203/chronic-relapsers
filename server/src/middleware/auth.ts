import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface PatientPayload {
  patient_id: number;
  code: string;
  role: 'patient';
}

export interface FacilitatorPayload {
  facilitator_id: number;
  role: 'facilitator';
}

declare global {
  namespace Express {
    interface Request {
      patient?: PatientPayload;
      facilitator?: FacilitatorPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}

export function requirePatient(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'غير مصرح — تسجيل الدخول مطلوب' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as PatientPayload;
    if (payload.role !== 'patient') {
      res.status(403).json({ error: 'غير مصرح' });
      return;
    }
    req.patient = payload;
    next();
  } catch {
    res.status(401).json({ error: 'رمز المصادقة غير صالح أو منتهي' });
  }
}

export function requireFacilitator(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'غير مصرح — تسجيل الدخول مطلوب' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as FacilitatorPayload;
    if (payload.role !== 'facilitator') {
      res.status(403).json({ error: 'غير مصرح' });
      return;
    }
    req.facilitator = payload;
    next();
  } catch {
    res.status(401).json({ error: 'رمز المصادقة غير صالح أو منتهي' });
  }
}

/**
 * Middleware: Check read-only access for freemium patients with expired trials
 * Applied to endpoints that modify patient data (POST, PATCH, DELETE on periods/events/tools)
 * Returns 403 if patient.payment_status === 'trial_expired_unpaid'
 */
export async function checkWriteAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.patient) {
    // Not a patient request; skip
    next();
    return;
  }

  try {
    // Import pool here to avoid circular dependency
    const { pool } = require('../db/pool');

    const result = await pool.query(
      `SELECT payment_status, trial_expires_at FROM patients WHERE id = $1`,
      [req.patient.patient_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'المريض غير موجود' });
      return;
    }

    const patient = result.rows[0];

    // Check if trial has expired
    if (
      patient.payment_status === 'trial_active' &&
      patient.trial_expires_at &&
      new Date(patient.trial_expires_at) < new Date()
    ) {
      // Update status
      await pool.query(
        `UPDATE patients SET payment_status = $1 WHERE id = $2`,
        ['trial_expired_unpaid', req.patient.patient_id]
      );
      patient.payment_status = 'trial_expired_unpaid';
    }

    // Block write access for trial_expired_unpaid
    if (patient.payment_status === 'trial_expired_unpaid') {
      res.status(403).json({
        error: 'قدم الوصول انتهى. يرجى الترقية أو الارتباط بمعالج',
        can_edit: false,
        upgrade_options: ['pay', 'link_to_therapist']
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking write access:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
}

/**
 * Middleware: Enforce multi-tenancy for facilitator access to patient data
 * Verifies that patient belongs to the requesting therapist
 * Used in GET /facilitators/patients/:id endpoints
 */
export async function verifyPatientBelongsToTherapist(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.facilitator) {
    // Not a facilitator request; skip
    next();
    return;
  }

  try {
    const { pool } = require('../db/pool');
    const patient_id = parseInt(req.params.id);

    if (!patient_id) {
      res.status(400).json({ error: 'Patient ID is required' });
      return;
    }

    const result = await pool.query(
      `SELECT id, facilitator_id FROM patients WHERE id = $1`,
      [patient_id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Patient not found' });
      return;
    }

    const patient = result.rows[0];

    // Check multi-tenancy: patient must belong to this therapist
    if (patient.facilitator_id !== req.facilitator.facilitator_id) {
      res.status(403).json({ error: 'غير مصرح للوصول إلى هذا المريض' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error verifying patient-therapist relationship:', error);
    res.status(500).json({ error: 'خطأ في الخادم' });
  }
}
