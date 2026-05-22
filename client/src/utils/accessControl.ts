/**
 * Access control utilities for freemium/trial enforcement
 */

export interface PatientAccessStatus {
  payment_status?: 'trial_active' | 'trial_expired_unpaid' | 'paid' | 'therapist_linked';
  trial_expires_at?: string;
  registration_type?: 'code' | 'freemium' | 'therapist_managed';
}

/**
 * Check if patient can edit data (write access)
 * Returns false only for trial_expired_unpaid status
 */
export function canEditPatientData(patient: PatientAccessStatus): boolean {
  return patient.payment_status !== 'trial_expired_unpaid';
}

/**
 * Check if patient is in read-only mode
 */
export function isReadOnlyMode(patient: PatientAccessStatus): boolean {
  return patient.payment_status === 'trial_expired_unpaid';
}

/**
 * Get remaining trial days (null if not in trial)
 */
export function getRemainingTrialDays(patient: PatientAccessStatus): number | null {
  if (patient.payment_status !== 'trial_active' || !patient.trial_expires_at) {
    return null;
  }

  try {
    const now = new Date();
    const expiryDate = new Date(patient.trial_expires_at);
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  } catch {
    return null;
  }
}

/**
 * Get user-friendly message about trial status
 */
export function getTrialStatusMessage(patient: PatientAccessStatus): string | null {
  const daysLeft = getRemainingTrialDays(patient);

  if (patient.payment_status === 'trial_active' && daysLeft !== null) {
    if (daysLeft === 0) {
      return 'ينتهي التجريبي اليوم';
    }
    return `${daysLeft} أيام متبقية من التجريبي`;
  }

  if (patient.payment_status === 'trial_expired_unpaid') {
    return 'انتهت فترة التجريبي. قم بالدفع أو ارتبط بمعالج للمتابعة.';
  }

  return null;
}

/**
 * Get upgrade/payment options for trial_expired_unpaid patient
 */
export function getUpgradeOptions(patient: PatientAccessStatus) {
  if (patient.payment_status === 'trial_expired_unpaid') {
    return {
      canPay: true,
      canLinkToTherapist: true,
    };
  }
  return {
    canPay: false,
    canLinkToTherapist: false,
  };
}
