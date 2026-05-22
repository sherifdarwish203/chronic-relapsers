import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Toast from '../components/Toast';

interface ToastState { message: string; type: 'success' | 'error' }

interface Patient {
  id: number;
  display_name: string;
  code: string;
  registration_type: 'code' | 'freemium' | 'therapist_managed';
  payment_status: 'trial_active' | 'trial_expired_unpaid' | 'paid' | 'therapist_linked';
  trial_expires_at?: string;
  created_at: string;
}

export default function PatientList() {
  const navigate = useNavigate();
  const [toast, setToastState] = useState<ToastState | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/facilitators/patients');
      setPatients(res.data.patients || []);
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToastState({ message: msg || 'خطأ في جلب قائمة المرضى', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getRegistrationBadge = (type: string) => {
    switch (type) {
      case 'code':
        return { label: 'شفرة', color: 'bg-gray-100 text-gray-700' };
      case 'freemium':
        return { label: 'دعوة', color: 'bg-blue-100 text-blue-700' };
      case 'therapist_managed':
        return { label: 'حساب مباشر', color: 'bg-purple-100 text-purple-700' };
      default:
        return { label: '', color: '' };
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'trial_active':
        return { label: 'تجريبي نشط', color: 'bg-yellow-100 text-yellow-700' };
      case 'trial_expired_unpaid':
        return { label: 'انتهى التجريبي', color: 'bg-red-100 text-red-700' };
      case 'paid':
        return { label: 'معتمد', color: 'bg-green-100 text-green-700' };
      case 'therapist_linked':
        return { label: 'مرتبط', color: 'bg-green-100 text-green-700' };
      default:
        return { label: '', color: '' };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const getDaysUntilExpire = (expiresAt?: string) => {
    if (!expiresAt) return null;
    try {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 0) return 'انتهى';
      if (days === 0) return 'اليوم';
      return `${days} أيام`;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-3" />
          <p className="text-gray-600">جاري تحميل قائمة المرضى...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 sm:pt-8 bg-gray-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToastState(null)} />
      )}

      <div className="w-full max-w-[900px] pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">المرضى ({patients.length})</h2>
          </div>
          <button
            onClick={() => navigate('/dashboard/invite-patient')}
            className="btn-primary text-xs sm:text-sm"
          >
            + إضافة مريض
          </button>
        </div>

        {patients.length === 0 ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-600 text-sm">لم تضف أي مرضى حتى الآن</p>
            <button
              onClick={() => navigate('/dashboard/invite-patient')}
              className="btn-primary mt-4 inline-block text-xs sm:text-sm"
            >
              أضف مريض
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {patients.map((patient) => {
              const regBadge = getRegistrationBadge(patient.registration_type);
              const payBadge = getPaymentBadge(patient.payment_status);
              const daysLeft = getDaysUntilExpire(patient.trial_expires_at);

              return (
                <div
                  key={patient.id}
                  onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
                  className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-gray-300"
                >
                  {/* Name and Code */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-800">
                        {patient.display_name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">الشفرة: {patient.code}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${regBadge.color}`}>
                        {regBadge.label}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${payBadge.color}`}>
                        {payBadge.label}
                      </span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="text-xs text-gray-600">
                    <p>تاريخ الإضافة: {formatDate(patient.created_at)}</p>
                    {patient.trial_expires_at && patient.payment_status === 'trial_active' && (
                      <p className="text-yellow-700 mt-1">
                        ⏱️ التجربة تنتهي في: {daysLeft}
                      </p>
                    )}
                    {patient.trial_expires_at && patient.payment_status === 'trial_expired_unpaid' && (
                      <p className="text-red-700 mt-1">
                        ❌ انتهت التجربة {formatDate(patient.trial_expires_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
