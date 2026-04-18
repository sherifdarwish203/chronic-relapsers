import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient, UrgeData } from '../hooks/usePatient';
import StepDots from '../components/StepDots';
import TriggerTags from '../components/TriggerTags';
import Toast from '../components/Toast';
import { EXTERNAL_TRIGGERS, INTERNAL_TRIGGERS, CRAVING_MANAGEMENT, CONTROLLED_OPTIONS, ARABIC_MONTHS } from '../constants/presets';

interface ToastState { message: string; type: 'success' | 'error' }

export default function UrgeAssessment() {
  const { period_id } = useParams<{ period_id: string }>();
  const navigate = useNavigate();
  const { periods, fetchMe, updatePeriodUrgeData } = usePatient();

  const [step, setStep] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: triggers
  const [extTriggers, setExtTriggers] = useState<string[]>([]);
  const [intTriggers, setIntTriggers] = useState<string[]>([]);

  // Step 2: management
  const [strategies, setStrategies] = useState<string[]>([]);
  const [managementText, setManagementText] = useState('');

  // Step 3: controlled
  const [controlled, setControlled] = useState<'yes' | 'partial' | 'not_yet' | ''>('');

  // Step 4: help sought
  const [helpReachedOut, setHelpReachedOut] = useState<boolean | null>(null);
  const [helpWho, setHelpWho] = useState('');

  // Step 5: prevention activity
  const [prevAttended, setPrevAttended] = useState<boolean | null>(null);
  const [prevWhat, setPrevWhat] = useState('');

  // Step 6: remaining craving
  const [stillPresent, setStillPresent] = useState<boolean | null>(null);
  const [intensity, setIntensity] = useState<number | null>(null);

  useEffect(() => {
    if (periods.length === 0) fetchMe();
  }, [periods.length, fetchMe]);

  const currentPeriod = periods.find((p) => p.id === parseInt(period_id || '0'));

  // Pre-fill if editing
  useEffect(() => {
    if (currentPeriod?.urge_data) {
      const d = currentPeriod.urge_data;
      setExtTriggers(d.triggers.external);
      setIntTriggers(d.triggers.internal);
      setStrategies(d.management.strategies);
      setManagementText(d.management.free_text || '');
      setControlled(d.controlled || '');
      setHelpReachedOut(d.help_sought.reached_out);
      setHelpWho(d.help_sought.who || '');
      setPrevAttended(d.prevention_activity.attended);
      setPrevWhat(d.prevention_activity.what || '');
      setStillPresent(d.remaining_craving.still_present);
      setIntensity(d.remaining_craving.intensity);
    }
  }, [currentPeriod?.id]);

  const periodTitle = currentPeriod
    ? `${ARABIC_MONTHS[currentPeriod.start_month]} ${currentPeriod.start_year}`
    : '';

  const handleSave = async () => {
    if (!period_id || !controlled) return;
    setSubmitting(true);
    try {
      const urgeData: UrgeData = {
        triggers: { external: extTriggers, internal: intTriggers },
        management: { strategies, free_text: managementText.trim() || null },
        controlled: controlled as 'yes' | 'partial' | 'not_yet',
        help_sought: { reached_out: helpReachedOut ?? false, who: helpWho.trim() || null },
        prevention_activity: { attended: prevAttended ?? false, what: prevWhat.trim() || null },
        remaining_craving: { still_present: stillPresent ?? false, intensity: stillPresent ? intensity : null },
      };
      await updatePeriodUrgeData(parseInt(period_id), urgeData);
      setToast({ message: 'تم حفظ التقييم ✓', type: 'success' });
      setTimeout(() => navigate('/timeline'), 1000);
    } catch {
      setToast({ message: 'حصل خطأ — حاول تاني', type: 'error' });
      setSubmitting(false);
    }
  };

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
          <h2 className="flex-1 text-center text-xl font-medium text-gray-800">تقييم فكرة الضرب</h2>
          <div className="w-8" />
        </div>
        <p className="text-center text-sm text-gray-500 mb-4">{periodTitle}</p>

        <StepDots total={6} current={step} />

        <div className="card">

          {/* STEP 1: Triggers */}
          {step === 1 && (
            <div>
              <h3 className="font-bold text-amber-700 mb-1">إيه اللي أثار الرغبة؟</h3>
              <p className="text-sm text-gray-500 mb-3">اختر كل اللي ينطبق</p>

              <p className="text-xs font-medium text-amber-700 mb-2">أسباب خارجية</p>
              <TriggerTags options={EXTERNAL_TRIGGERS} selected={extTriggers} onChange={setExtTriggers} colorScheme="amber" />

              <p className="text-xs font-medium text-blue-700 mt-4 mb-2">أسباب داخلية</p>
              <TriggerTags options={INTERNAL_TRIGGERS} selected={intTriggers} onChange={setIntTriggers} colorScheme="blue" />

              <div className="mt-4 flex justify-end">
                <button onClick={() => setStep(2)} className="btn-primary">التالي ←</button>
              </div>
            </div>
          )}

          {/* STEP 2: Management strategies */}
          {step === 2 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-1">إزّاي تعاملت مع الرغبة؟</h3>
              <p className="text-sm text-gray-500 mb-3">اختر كل ما استخدمته</p>
              <TriggerTags options={CRAVING_MANAGEMENT} selected={strategies} onChange={setStrategies} colorScheme="green" />
              <textarea
                value={managementText}
                onChange={(e) => setManagementText(e.target.value)}
                placeholder="أي تفاصيل إضافية..."
                rows={3}
                className="input-base h-auto py-2 resize-none mt-3"
              />
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← رجوع</button>
                <button onClick={() => setStep(3)} className="btn-primary flex-1">التالي ←</button>
              </div>
            </div>
          )}

          {/* STEP 3: Controlled */}
          {step === 3 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3">هل قدرت تتحكم في الرغبة؟</h3>
              <div className="space-y-2 mb-5">
                {Object.entries(CONTROLLED_OPTIONS).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setControlled(val as 'yes' | 'partial' | 'not_yet')}
                    className={`w-full text-right p-3 rounded-xl border transition text-sm
                      ${controlled === val
                        ? 'bg-[#FFFBEB] border-amber-400 text-amber-800 font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="btn-secondary flex-1">← رجوع</button>
                <button onClick={() => setStep(4)} disabled={!controlled} className="btn-primary flex-1">التالي ←</button>
              </div>
            </div>
          )}

          {/* STEP 4: Help sought */}
          {step === 4 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3">هل طلبت مساعدة من حد؟</h3>
              <div className="flex gap-3 mb-4">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setHelpReachedOut(val)}
                    className={`flex-1 p-3 rounded-xl border text-sm transition
                      ${helpReachedOut === val
                        ? 'bg-[#FFFBEB] border-amber-400 text-amber-800 font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {val ? 'آه' : 'لأ'}
                  </button>
                ))}
              </div>
              {helpReachedOut && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">مين؟</label>
                  <input
                    type="text"
                    value={helpWho}
                    onChange={(e) => setHelpWho(e.target.value)}
                    placeholder="مثلاً: صاحبي، المعالج..."
                    className="input-base"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep(3)} className="btn-secondary flex-1">← رجوع</button>
                <button onClick={() => setStep(5)} disabled={helpReachedOut === null} className="btn-primary flex-1">التالي ←</button>
              </div>
            </div>
          )}

          {/* STEP 5: Prevention activity */}
          {step === 5 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3">هل حضرت نشاط وقاية؟</h3>
              <div className="flex gap-3 mb-4">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setPrevAttended(val)}
                    className={`flex-1 p-3 rounded-xl border text-sm transition
                      ${prevAttended === val
                        ? 'bg-[#FFFBEB] border-amber-400 text-amber-800 font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {val ? 'آه' : 'لأ'}
                  </button>
                ))}
              </div>
              {prevAttended && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">إيه النشاط؟</label>
                  <input
                    type="text"
                    value={prevWhat}
                    onChange={(e) => setPrevWhat(e.target.value)}
                    placeholder="مثلاً: اجتماع AA، جلسة جماعية..."
                    className="input-base"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setStep(4)} className="btn-secondary flex-1">← رجوع</button>
                <button onClick={() => setStep(6)} disabled={prevAttended === null} className="btn-primary flex-1">التالي ←</button>
              </div>
            </div>
          )}

          {/* STEP 6: Remaining craving */}
          {step === 6 && (
            <div>
              <h3 className="font-bold text-gray-800 mb-3">هل لسه في رغبة في التعاطي؟</h3>
              <div className="flex gap-3 mb-4">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => { setStillPresent(val); if (!val) setIntensity(null); }}
                    className={`flex-1 p-3 rounded-xl border text-sm transition
                      ${stillPresent === val
                        ? 'bg-[#FFFBEB] border-amber-400 text-amber-800 font-medium'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {val ? 'آه' : 'لأ'}
                  </button>
                ))}
              </div>
              {stillPresent && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">شدة الرغبة (١ = خفيفة، ٥ = شديدة جداً)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setIntensity(n)}
                        className={`flex-1 p-3 rounded-xl border text-sm font-bold transition
                          ${intensity === n
                            ? 'bg-[#FFFBEB] border-amber-400 text-amber-800'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setStep(5)} className="btn-secondary flex-1">← رجوع</button>
                <button
                  onClick={handleSave}
                  disabled={stillPresent === null || (stillPresent && !intensity) || submitting || !controlled}
                  className="btn-primary flex-1"
                >
                  {submitting ? '...' : 'حفظ التقييم ✓'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4">
          <button onClick={() => navigate('/timeline')} className="btn-secondary w-full">
            ← العودة للجدول
          </button>
        </div>
      </div>
    </div>
  );
}
