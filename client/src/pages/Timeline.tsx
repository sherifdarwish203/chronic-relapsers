import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatient, Period } from '../hooks/usePatient';
import { useAutoExpandTextarea } from '../hooks/useAutoExpandTextarea';
import PeriodCard from '../components/PeriodCard';
import Toast from '../components/Toast';
import { ARABIC_MONTHS, SUBSTANCES } from '../constants/presets';
import TriggerTags from '../components/TriggerTags';
import { validateDates, getYearOptions } from '../utils/dates';

interface ToastState { message: string; type: 'success' | 'error' }

const PERIOD_TYPE_OPTIONS = [
  { value: 'abstinent', label: 'فترة امتناع' },
  { value: 'relapse', label: 'انتكاسة / عودة للتعاطي' },
  { value: 'reduced', label: 'فكرة ضرب' },
];

const NOTE_LABELS: Record<string, string> = {
  abstinent: 'إيه اللي ساعدك تبدأ فترة الامتناع دي؟ إيه اللي اتغير؟',
  relapse: 'إيه اللي حصل اللي أدى للانتكاسة دي؟ (ملخص سريع)',
  reduced: 'إيه اللي أثار عندك فكرة ضرب دي؟ (ملخص سريع)',
};

const NOTE_PLACEHOLDERS: Record<string, string> = {
  abstinent: 'مثلاً: بدأت علاج، اتقرّبت من الأسرة، غيّرت البيئة...',
  relapse: 'مثلاً: كنت تحت ضغط شديد، حصل خلاف، وقفت عن الدواء...',
  reduced: 'مثلاً: حسيت بضغط شديد، شفت شخص بيتعاطى...',
};

export default function Timeline() {
  const navigate = useNavigate();
  const { patient, periods, loading, fetchMe, addPeriod, removePeriod } = usePatient();
  const noteRef = useAutoExpandTextarea(); // Dedicated ref for note textarea

  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Form state
  const [type, setType] = useState('abstinent');
  const [startDay, setStartDay] = useState('');
  const [startMonth, setStartMonth] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endMonth, setEndMonth] = useState('');
  const [endYear, setEndYear] = useState('');
  const [note, setNote] = useState('');
  const [substances, setSubstances] = useState<string[]>([]);
  const [dateError, setDateError] = useState<string | null>(null);
  const [overlapError, setOverlapError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Validate dates on any date field change
  useEffect(() => {
    if (startMonth && startYear) {
      const err = validateDates(startMonth, startYear, endMonth || null, endYear || null);
      setDateError(err);
    }
  }, [startMonth, startYear, endMonth, endYear]);

  // Overlap check against existing periods
  useEffect(() => {
    if (type === 'reduced' || !startMonth || !startYear) { setOverlapError(null); return; }
    const MAX = 999999;
    const newStart = parseInt(startYear) * 12 + parseInt(startMonth);
    const newEnd = endMonth && endYear ? parseInt(endYear) * 12 + parseInt(endMonth) : MAX;
    const hit = periods.find((p) => {
      if (p.type === 'reduced') return false;
      const pStart = p.start_year * 12 + p.start_month;
      const pEnd = p.end_month && p.end_year ? p.end_year * 12 + p.end_month : MAX;
      return newStart <= pEnd && newEnd >= pStart;
    });
    if (hit) {
      const label = hit.type === 'abstinent' ? 'فترة امتناع' : 'انتكاسة';
      setOverlapError(`هذه الفترة تتداخل مع ${label} مسجلة مسبقاً`);
    } else {
      setOverlapError(null);
    }
  }, [startMonth, startYear, endMonth, endYear, type, periods]);

  const resetForm = () => {
    setType('abstinent');
    setStartDay(''); setStartMonth(''); setStartYear('');
    setEndMonth(''); setEndYear('');
    setNote('');
    setSubstances([]);
    setDateError(null);
    setOverlapError(null);
    setShowForm(false);
  };

  const canSubmit = startMonth && startYear && !dateError && !overlapError && !submitting;

  const handleAddPeriod = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        start_day: startDay ? parseInt(startDay) : undefined,
        start_month: parseInt(startMonth),
        start_year: parseInt(startYear),
        note: note || undefined,
        substances: type === 'relapse' ? substances : [],
      };
      if (type !== 'reduced' && endMonth && endYear) {
        payload.end_month = parseInt(endMonth);
        payload.end_year = parseInt(endYear);
      }
      const res = await api.post('/periods', payload);
      addPeriod(res.data.period as Period);
      resetForm();
      setToast({ message: 'تمت إضافة الفترة', type: 'success' });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'حصل خطأ';
      setToast({ message: msg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل تريد حذف هذه الفترة؟')) return;
    try {
      await api.delete(`/periods/${id}`);
      removePeriod(id);
      setToast({ message: 'تم الحذف', type: 'success' });
    } catch {
      setToast({ message: 'حصل خطأ في الحذف', type: 'error' });
    }
  };

  const years = getYearOptions();
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: ARABIC_MONTHS[i + 1] }));

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-4 pt-6 pb-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center justify-center mb-2 gap-3">
          <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">الجدول الزمني</h2>
          <div className="w-10" />
        </div>
        {patient && (
          <p className="text-center text-xs sm:text-sm text-gray-500 mb-4">{patient.display_name}</p>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-4 text-[11px] sm:text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />فترة امتناع</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />انتكاسة</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />فكرة ضرب</span>
        </div>

        {/* Period list */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">جاري التحميل...</div>
        ) : (
          <div className="space-y-3 mb-4">
            {periods.map((period) => (
              <PeriodCard key={period.id} period={period} onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* Add period button / form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-sm text-gray-500 hover:border-primary hover:text-primary transition"
          >
            + إضافة فترة
          </button>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4 space-y-4 mb-4">
            <h3 className="font-semibold text-base sm:text-lg text-gray-800">إضافة فترة جديدة</h3>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">النوع</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-base"
              >
                {PERIOD_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'reduced' ? 'تاريخ فكرة الضرب' : 'تاريخ البداية'}
              </label>
              {type === 'reduced' ? (
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={startDay}
                    onChange={(e) => setStartDay(e.target.value)}
                    className="input-base"
                  >
                    <option value="">اليوم</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className="input-base"
                  >
                    <option value="">الشهر</option>
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    className="input-base"
                  >
                    <option value="">السنة</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(e.target.value)}
                    className={`input-base ${dateError && startMonth ? 'input-error' : ''}`}
                  >
                    <option value="">شهر البداية</option>
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    className={`input-base ${dateError && startYear ? 'input-error' : ''}`}
                  >
                    <option value="">سنة البداية</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {overlapError && (
              <p className="text-[12px] text-error -mt-2">{overlapError}</p>
            )}

            {/* End date — hidden for فكرة ضرب */}
            {type !== 'reduced' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ النهاية <span className="text-gray-400 font-normal">(اتركه فارغ = مستمرة)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={endMonth}
                    onChange={(e) => setEndMonth(e.target.value)}
                    className={`input-base ${dateError ? 'input-error' : ''}`}
                  >
                    <option value="">فارغ = مستمرة</option>
                    {monthOptions.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    value={endYear}
                    onChange={(e) => setEndYear(e.target.value)}
                    className={`input-base ${dateError ? 'input-error' : ''}`}
                  >
                    <option value="">—</option>
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                {dateError && (
                  <p className="text-[12px] text-error mt-1">{dateError}</p>
                )}
              </div>
            )}

            {/* Substances — only for relapse */}
            {type === 'relapse' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المادة المستخدمة في هذه الفترة
                </label>
                <TriggerTags
                  options={SUBSTANCES}
                  selected={substances}
                  onChange={setSubstances}
                  colorScheme="amber"
                />
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {NOTE_LABELS[type]}
              </label>
              <textarea
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={NOTE_PLACEHOLDERS[type]}
                className="input-base py-2 resize-none textarea-auto-expand"
              />
            </div>

            {/* Form buttons */}
            <div className="flex gap-2">
              <button
                onClick={resetForm}
                className="btn-secondary flex-1"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddPeriod}
                disabled={!canSubmit}
                className="btn-primary flex-1"
              >
                {submitting ? '...' : 'إضافة ✓'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom navigation */}
        <div className="mt-6 space-y-3 pb-6">
          <button
            onClick={() => navigate('/summary')}
            disabled={periods.length === 0}
            className="btn-primary w-full"
          >
            حفظ ومشاهدة الملخص ←
          </button>
          <button
            onClick={() => navigate('/home')}
            className="btn-secondary w-full"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
}
