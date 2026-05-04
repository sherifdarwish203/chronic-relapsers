import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatient, Activity } from '../hooks/usePatient';
import Toast from '../components/Toast';
import { ACTIVITY_TYPE_OPTIONS, ACTIVITY_TYPES, ARABIC_MONTHS } from '../constants/presets';
import { getYearOptions } from '../utils/dates';

interface ToastState { message: string; type: 'success' | 'error' }

const TYPE_CONFIG: Record<string, { bg: string; border: string; text: string }> = {
  individual: { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700' },
  group:      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  community:  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
};

export default function Activities() {
  const navigate = useNavigate();
  const { activities, loading, fetchMe, addActivity, removeActivity } = usePatient();

  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [type, setType] = useState('individual');
  const [actDay, setActDay] = useState('');
  const [actMonth, setActMonth] = useState('');
  const [actYear, setActYear] = useState('');
  const [therapist, setTherapist] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const resetForm = () => {
    setType('individual');
    setActDay(''); setActMonth(''); setActYear('');
    setTherapist(''); setSummary('');
    setShowForm(false);
  };

  const canSubmit = actMonth && actYear && !submitting;

  const handleAdd = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await api.post('/activities', {
        type,
        act_day: actDay ? parseInt(actDay) : undefined,
        act_month: parseInt(actMonth),
        act_year: parseInt(actYear),
        therapist: therapist || undefined,
        summary: summary || undefined,
      });
      addActivity(res.data.activity as Activity);
      resetForm();
      setToast({ message: 'تم تسجيل النشاط ✓', type: 'success' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'حصل خطأ';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذا النشاط؟')) return;
    try {
      await api.delete(`/activities/${id}`);
      removeActivity(id);
      setToast({ message: 'تم الحذف', type: 'success' });
    } catch {
      setToast({ message: 'حصل خطأ في الحذف', type: 'error' });
    }
  };

  const years = getYearOptions();
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: ARABIC_MONTHS[i + 1] }));

  const formatActivityDate = (a: Activity) => {
    const day = a.act_day ? `${a.act_day} ` : '';
    return `${day}${ARABIC_MONTHS[a.act_month]} ${a.act_year}`;
  };

  const showTherapistField = type === 'individual' || type === 'group';

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center mb-4">
          <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-gray-700 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-xl font-medium text-gray-800">الأنشطة العلاجية</h2>
          <div className="w-8" />
        </div>

        {/* Activity list */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">جاري التحميل...</div>
        ) : (
          <div className="space-y-3 mb-4">
            {activities.length === 0 && !showForm && (
              <p className="text-center text-gray-400 text-sm py-6">
                لم يتم تسجيل أي نشاط بعد
              </p>
            )}
            {activities.map((activity) => {
              const cfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.individual;
              return (
                <div key={activity.id} className={`${cfg.bg} border ${cfg.border} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-semibold text-sm ${cfg.text}`}>
                      {ACTIVITY_TYPES[activity.type]}
                    </span>
                    <span className="text-xs text-gray-500">{formatActivityDate(activity)}</span>
                  </div>
                  {activity.therapist && (
                    <p className="text-xs text-gray-600 mb-1">المعالج: {activity.therapist}</p>
                  )}
                  {activity.summary && (
                    <blockquote className={`border-r-4 ${cfg.border} pr-3 italic text-sm text-gray-700 mb-2`}>
                      "{activity.summary}"
                    </blockquote>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="btn-danger text-xs"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition"
          >
            + إضافة نشاط علاجي
          </button>
        ) : (
          <div className="card space-y-4 mb-4">
            <h3 className="font-semibold text-gray-800">تسجيل نشاط جديد</h3>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع النشاط</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="input-base">
                {ACTIVITY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ النشاط</label>
              <div className="grid grid-cols-3 gap-2">
                <select value={actDay} onChange={(e) => setActDay(e.target.value)} className="input-base">
                  <option value="">اليوم</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select value={actMonth} onChange={(e) => setActMonth(e.target.value)} className="input-base">
                  <option value="">الشهر</option>
                  {monthOptions.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select value={actYear} onChange={(e) => setActYear(e.target.value)} className="input-base">
                  <option value="">السنة</option>
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Therapist — shown for individual + group */}
            {showTherapistField && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المعالج <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={therapist}
                  onChange={(e) => setTherapist(e.target.value)}
                  placeholder="مثلاً: د. أحمد"
                  className="input-base"
                />
              </div>
            )}

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ملخص النشاط <span className="text-gray-400 font-normal">(اختياري)</span>
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="مثلاً: تكلمنا عن المحفزات وكيف أتعامل معها..."
                rows={3}
                className="input-base h-auto py-2 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button onClick={resetForm} className="btn-secondary flex-1">إلغاء</button>
              <button onClick={handleAdd} disabled={!canSubmit} className="btn-primary flex-1">
                {submitting ? '...' : 'إضافة ✓'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
