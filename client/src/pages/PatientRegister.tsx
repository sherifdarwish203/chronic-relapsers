import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { usePatientAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';

interface ToastState { message: string; type: 'success' | 'error' }

export default function PatientRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = usePatientAuth();

  const token = searchParams.get('token');

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  const [toast, setToastState] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setToastState({ message: 'رابط الدعوة غير صحيح', type: 'error' });
      setValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const res = await api.get(`/auth/invitations/${token}`);
        const prefill = res.data.invitation.prefill;
        if (prefill.display_name) setDisplayName(prefill.display_name);
        if (prefill.email) setEmail(prefill.email);
        if (prefill.phone_number) setPhoneNumber(prefill.phone_number);
        setValidating(false);
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
        setToastState({ message: msg || 'رابط الدعوة غير صحيح', type: 'error' });
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleRegister = async () => {
    if (!displayName.trim() || !dateOfBirth) {
      setToastState({ message: 'الاسم وتاريخ الميلاد مطلوبان', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        token,
        display_name: displayName.trim(),
        email: email.trim() || undefined,
        phone_number: phoneNumber.trim() || undefined,
        date_of_birth: dateOfBirth,
      });
      login(res.data.token);
      setToastState({ message: 'تم إنشاء حسابك بنجاح!', type: 'success' });
      setTimeout(() => navigate('/timeline'), 500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToastState({ message: msg || 'حصل خطأ — حاول تاني', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRegister();
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mb-3" />
          <p className="text-gray-600">جاري التحقق من رابط الدعوة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 sm:pt-8 bg-gray-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToastState(null)} />
      )}

      <div className="w-full max-w-[520px] pb-6">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 gap-3">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">إنشاء حسابك</h2>
          <div className="w-10" />
        </div>

        {/* Intro card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm bg-blue-50 border-2 border-blue-200 p-4 sm:p-5 mb-4">
          <p className="text-xs sm:text-sm text-gray-700 leading-loose">
            أهلاً وسهلاً! 👋<br />
            معنا 14 يوم من الوصول الكامل مجانًا.<br />
            بعديها، ممكن تتفق مع معالج أو تدفع للاستمرار.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 space-y-4 mb-4">
          {/* Display name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              اسمك الأول *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="مثلاً: أحمد"
              className="input-base text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني (اختياري)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="البريد الإلكتروني"
              className="input-base text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              رقم الهاتف (اختياري)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="مثلاً: 0201000000000"
              className="input-base text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          {/* Date of birth */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              تاريخ الميلاد *
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-base text-xs sm:text-sm"
              disabled={loading}
            />
          </div>

          {/* Register button */}
          <button
            onClick={handleRegister}
            disabled={loading || !displayName.trim() || !dateOfBirth}
            className="btn-primary w-full text-xs sm:text-sm mt-6"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء حسابي'}
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-600 px-3">
          <p>
            بإنشاء حساب، أنت توافق على <a href="#" className="text-green-600 hover:underline">شروط الخدمة</a>
          </p>
        </div>
      </div>
    </div>
  );
}
