import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatientAuth } from '../hooks/useAuth';
import TriggerTags from '../components/TriggerTags';
import Toast from '../components/Toast';
import { SUBSTANCES } from '../constants/presets';

interface Toast { message: string; type: 'success' | 'error' }

export default function PatientStart() {
  const navigate = useNavigate();
  const { login } = usePatientAuth();

  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [substances, setSubstances] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleStart = async () => {
    if (!displayName.trim() || !code.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/patients/login', {
        code: code.trim(),
        display_name: displayName.trim(),
      });
      login(res.data.token);
      // Update substances if selected
      if (substances.length > 0) {
        await api.patch('/patients/me', { substances });
      }
      showToast('أهلاً بك!', 'success');
      setTimeout(() => navigate('/timeline'), 800);
    } catch {
      showToast('حصل خطأ — حاول تاني', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/patients/login', {
        code: code.trim(),
        display_name: '',
      });
      login(res.data.token);
      navigate('/timeline');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      if (msg === 'لم يتم العثور على بيانات بهذا الكود') {
        showToast('لم يتم العثور على بيانات بهذا الكود', 'error');
      } else {
        showToast('حصل خطأ — حاول تاني', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center p-4 pt-8">
      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 ml-3">
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسمك أو اسم تُفضّله
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="مثلاً: أحمد..."
              className="input-base"
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
              placeholder="مثلاً: A001..."
              className="input-base"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              ده الكود اللي هتستخدمه للرجوع لبياناتك
            </p>
          </div>

          {/* Substances */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              المادة أو المواد المعنية
            </label>
            <TriggerTags
              options={SUBSTANCES}
              selected={substances}
              onChange={setSubstances}
              colorScheme="green"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 space-y-3">
          <button
            onClick={handleLoad}
            disabled={!code.trim() || loading}
            className="btn-secondary w-full"
          >
            تحميل بيانات سابقة
          </button>
          <button
            onClick={handleStart}
            disabled={!displayName.trim() || !code.trim() || loading}
            className="btn-primary w-full"
          >
            {loading ? 'جاري التحميل...' : 'نبدأ ←'}
          </button>
        </div>
      </div>
    </div>
  );
}
