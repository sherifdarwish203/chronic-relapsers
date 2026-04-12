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
      navigate('/timeline');
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
    <div className="min-h-screen flex justify-center p-4 pt-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      <div className="w-full max-w-[480px]">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-xl font-medium text-gray-800">أهلاً بك</h2>
          <div className="w-8" />
        </div>

        {/* Intro card */}
        <div className="card mb-4 bg-green-50 border-green-200">
          <p className="text-sm text-gray-700 leading-loose">
            هنا مش هنحكم على حاجة.<br />
            إحنا هنحكي قصتك مع بعض — الأوقات الكويسة والأوقات الصعبة — عشان نفهم إيه اللي كان بيحصل.<br />
            خطوة بخطوة، وانت مرتاح.
          </p>
        </div>

        {/* Form card */}
        <div className="card space-y-4">
          {/* First name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسمك الأول
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="مثلاً: أحمد"
              className="input-base"
              autoFocus
            />
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الكود الخاص بيك
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="مثلاً: A123456"
              className="input-base font-mono tracking-widest"
              maxLength={7}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              الكود موجود على الورقة اللي اديكها المعالج
            </p>
          </div>
        </div>

        <button
          onClick={handleEnter}
          disabled={!displayName.trim() || !code.trim() || loading}
          className="btn-primary w-full mt-4"
        >
          {loading ? 'جاري التحميل...' : 'دخول ←'}
        </button>
      </div>
    </div>
  );
}
