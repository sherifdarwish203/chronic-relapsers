import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatientAuth } from '../hooks/useAuth';
import Toast from '../components/Toast';

interface ToastState { message: string; type: 'success' | 'error' }

export default function PatientStart() {
  const navigate = useNavigate();
  const { login } = usePatientAuth();

  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEnter = async () => {
    if (!displayName.trim() || !code.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/patients/login', {
        code: code.trim().toUpperCase(),
        display_name: displayName.trim(),
      });
      login(res.data.token);
      navigate('/home');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setToast({ message: msg || 'حصل خطأ — حاول تاني', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEnter();
  };

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 sm:pt-8 bg-gray-50">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      <div className="w-full max-w-[520px] pb-6">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 gap-3">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">أهلاً بك</h2>
          <div className="w-10" />
        </div>

        {/* Intro card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm bg-green-50 border-2 border-green-200 p-4 sm:p-5 mb-4">
          <p className="text-xs sm:text-sm text-gray-700 leading-loose">
            هنا مش هنحكم على حاجة.<br />
            إحنا هنحكي قصتك مع بعض — الأوقات الكويسة والأوقات الصعبة — عشان نفهم إيه اللي كان بيحصل.<br />
            خطوة بخطوة، وانت مرتاح.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-5 space-y-4 mb-4">
          {/* First name */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              اسمك الأول
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="مثلاً: أحمد"
              className="input-base text-xs sm:text-sm"
              autoFocus
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              الكود الخاص بيك
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="مثلاً: A123456"
              className="input-base font-mono tracking-widest text-xs sm:text-sm"
              maxLength={7}
            />
            <p className="text-xs text-gray-400 mt-1">
              الكود موجود على الورقة اللي اديكها المعالج
            </p>
          </div>
        </div>

        <button
          onClick={handleEnter}
          disabled={!displayName.trim() || !code.trim() || loading}
          className="btn-primary w-full py-2 sm:py-3 text-xs sm:text-sm"
        >
          {loading ? 'جاري التحميل...' : 'دخول ←'}
        </button>
      </div>
    </div>
  );
}
