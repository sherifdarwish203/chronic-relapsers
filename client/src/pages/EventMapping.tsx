import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { usePatient, Event } from '../hooks/usePatient';
import StepDots from '../components/StepDots';
import EventCard from '../components/EventCard';
import TriggerTags from '../components/TriggerTags';
import Toast from '../components/Toast';
import { FEELINGS, EXTERNAL_TRIGGERS, INTERNAL_TRIGGERS, ARABIC_MONTHS, CLASSIFICATIONS, SAW_IT_COMING } from '../constants/presets';

interface ToastState { message: string; type: 'success' | 'error' }

export default function EventMapping() {
  const { period_id } = useParams<{ period_id: string }>();
  const navigate = useNavigate();
  const { periods, fetchMe, addEvent, removeEvent } = usePatient();

  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState('weeks');

  // Step 2
  const [feelings, setFeelings] = useState<string[]>([]);

  // Step 3
  const [externalTriggers, setExternalTriggers] = useState<string[]>([]);

  // Step 4
  const [internalTriggers, setInternalTriggers] = useState<string[]>([]);

  // Step 5
  const [classification, setClassification] = useState('');
  const [sawItComing, setSawItComing] = useState('');

  useEffect(() => {
    if (periods.length === 0) fetchMe();
  }, [periods.length, fetchMe]);

  const currentPeriod = periods.find((p) => p.id === parseInt(period_id || '0'));

  const periodTitle = currentPeriod
    ? `${ARABIC_MONTHS[currentPeriod.start_month]} ${currentPeriod.start_year}`
    : '';

  const resetWizard = () => {
    setStep(1);
    setDescription(''); setTimeframe('weeks');
    setFeelings([]);
    setExternalTriggers([]);
    setInternalTriggers([]);
    setClassification(''); setSawItComing('');
  };

  const handleSaveEvent = async () => {
    if (!classification || !period_id) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/periods/${period_id}/events`, {
        description,
        timeframe,
        feelings,
        external_triggers: externalTriggers,
        internal_triggers: internalTriggers,
        classification,
        saw_it_coming: sawItComing || null,
      });
      addEvent(parseInt(period_id), res.data.event as Event);
      setToast({ message: 'تم حفظ الحدث ✓', type: 'success' });
      resetWizard();
    } catch {
      setToast({ message: 'حصل خطأ — حاول تاني', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await api.delete(`/events/${eventId}`);
      removeEvent(parseInt(period_id || '0'), eventId);
      setToast({ message: 'تم الحذف', type: 'success' });
    } catch {
      setToast({ message: 'حصل خطأ في الحذف', type: 'error' });
    }
  };

  const periodEvents = currentPeriod?.events || [];

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center mb-1">
          <button onClick={() => navigate('/timeline')} className="text-gray-500 hover:text-gray-700 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-xl font-medium text-gray-800">قبل الانتكاسة</h2>
          <div className="w-8" />
        </div>
        <p className="text-center text-sm text-gray-500 mb-4">{periodTitle}</p>

        {/* Previously recorded events */}
        {periodEvents.length > 0 && (
          <div className="card mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              الأحداث المسجلة ({periodEvents.length})
            </h4>
            <div className="space-y-2">
              {periodEvents.map((event) => (
                <EventCard key={event.id} event={event} onDelete={handleDeleteEvent} />
              ))}
            </div>
          </div>
        )}

        {/* Step dots */}
        <StepDots total={5} current={step} />

        {/* Step card */}
        <div className="card">

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-1">إيه اللي كان بيحصل؟</h3>
              <p className="text-sm text-gray-500 mb-3">فكر في الفترة اللي سبقت الانتكاسة...</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب بحرية..."
                rows={4}
                className="input-base h-auto py-2 resize-none mb-3"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ده كان قبلها بـ...</label>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="input-base">
                  <option value="same_day">نفس اليوم</option>
                  <option value="days">أيام قبلها</option>
                  <option value="weeks">أسابيع قبلها</option>
                  <option value="months">شهور قبلها</option>
                </select>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!description.trim()}
                  className="btn-primary"
                >
                  التالي ←
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-1">كنت حاسس بإيه؟</h3>
              <p className="text-sm text-gray-500 mb-3">اختر كل المشاعر اللي كانت موجودة</p>
              <TriggerTags options={FEELINGS} selected={feelings} onChange={setFeelings} colorScheme="blue" />
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← رجوع</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">التالي ←</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h3 className="font-bold text-amber-700 mb-1">أسباب خارجية؟</h3>
              <p className="text-sm text-gray-500 mb-3">أحداث أو مواقف من الحياة</p>
              <TriggerTags options={EXTERNAL_TRIGGERS} selected={externalTriggers} onChange={setExternalTriggers} colorScheme="amber" />
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">← رجوع</button>
                <button onClick={() => setStep(4)} className="btn-primary flex-1">التالي ←</button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h3 className="font-bold text-blue-700 mb-1">أسباب داخلية؟</h3>
              <p className="text-sm text-gray-500 mb-3">أفكار أو أحاسيس من جوّاك</p>
              <TriggerTags options={INTERNAL_TRIGGERS} selected={internalTriggers} onChange={setInternalTriggers} colorScheme="blue" />
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep(3)} className="btn-secondary flex-1">← رجوع</button>
                <button onClick={() => setStep(5)} className="btn-primary flex-1">التالي ←</button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3">ما هو السبب الرئيسي؟</h3>
              <div className="space-y-2 mb-5">
                {Object.entries(CLASSIFICATIONS).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setClassification(val)}
                    className={`w-full text-right p-3 rounded-xl border transition text-sm
                      ${classification === val
                        ? 'bg-[#DCFCE7] border-primary text-green-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <h4 className="font-medium text-gray-700 mb-2">هل حسيت إنها جاية؟</h4>
              <div className="flex gap-2 mb-5">
                {Object.entries(SAW_IT_COMING).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSawItComing(val)}
                    className={`flex-1 p-2 rounded-xl border text-sm transition
                      ${sawItComing === val
                        ? 'bg-[#DCFCE7] border-primary text-green-700 font-medium'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(4)} className="btn-secondary flex-1">← رجوع</button>
                <button
                  onClick={handleSaveEvent}
                  disabled={!classification || submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? '...' : 'حفظ الحدث ✓'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back to timeline */}
        <div className="mt-4">
          <button onClick={() => navigate('/timeline')} className="btn-secondary w-full">
            ← العودة للجدول
          </button>
        </div>
      </div>
    </div>
  );
}
