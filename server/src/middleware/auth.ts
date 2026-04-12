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
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as FacilitatorPayload;
    if (payload.role !== 'facilitator') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    req.facilitator = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
