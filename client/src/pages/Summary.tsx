import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../hooks/usePatient';
import { usePatientAuth } from '../hooks/useAuth';
import SummarySection from '../components/SummarySection';
import { formatDurationAr } from '../utils/dates';
import { CLASSIFICATIONS } from '../constants/presets';

export default function Summary() {
  const navigate = useNavigate();
  const { patient, periods, fetchMe } = usePatient();
  const { logout } = usePatientAuth();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const abstinencePeriods = periods.filter((p) => p.type === 'abstinent');
  const relapsePeriods = periods.filter((p) => p.type === 'relapse');
  const longestAbstinence = abstinencePeriods.reduce(
    (max, p) => Math.max(max, p.duration_months || 0), 0
  );

  // Pattern analysis from events
  const allEvents = periods.flatMap((p) => p.events);
  const classificationCounts = { i: 0, x: 0, b: 0 };
  const feelingCount: Record<string, number> = {};
  const extCount: Record<string, number> = {};
  const intCount: Record<string, number> = {};

  for (const event of allEvents) {
    if (event.classification === 'i') classificationCounts.i++;
    else if (event.classification === 'x') classificationCounts.x++;
    else if (event.classification === 'b') classificationCounts.b++;
    for (const f of event.feelings || []) feelingCount[f] = (feelingCount[f] || 0) + 1;
    for (const t of event.external_triggers || []) extCount[t] = (extCount[t] || 0) + 1;
    for (const t of event.internal_triggers || []) intCount[t] = (intCount[t] || 0) + 1;
  }

  const topItems = (map: Record<string, number>, n: number) =>
    Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);

  const topFeelings = topItems(feelingCount, 5);
  const topExt = topItems(extCount, 4);
  const topInt = topItems(intCount, 4);

  const lastUpdated = patient?.updated_at
    ? new Date(patient.updated_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const handlePrint = () => window.print();

  const handleGoHome = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6">
      <div className="w-full max-w-[520px] print-full">

        {/* Header */}
        <div className="flex items-center mb-2 no-print">
          <button onClick={() => navigate('/timeline')} className="text-gray-500 hover:text-gray-700 ml-3">
            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-xl font-medium text-gray-800">
            {patient?.display_name || 'ملخصك'}
          </h2>
          <div className="w-8" />
        </div>
        {patient && (
          <p className="text-center text-xs text-gray-400 mb-4 no-print">كود: {patient.code}</p>
        )}

        {/* Print header (hidden on screen) */}
        <div className="hidden print:block mb-4">
          <h1 className="text-lg font-bold">رحلة التعافي — {patient?.display_name}</h1>
          <p className="text-sm text-gray-600">كود: {patient?.code} | التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        {/* Section A: Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{abstinencePeriods.length}</p>
            <p className="text-xs text-green-600 mt-1">فترات امتناع</p>
          </div>
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{relapsePeriods.length}</p>
            <p className="text-xs text-red-600 mt-1">انتكاسات</p>
          </div>
        </div>

        {/* Section B: Longest abstinence */}
        {longestAbstinence > 0 && (
          <div className="bg-[#F0FDF4] border border-[#86EFAC] rounded-xl p-4 mb-4 text-center">
            <p className="text-xs text-green-600 mb-1">أطول فترة امتناع</p>
            <p className="text-2xl font-bold text-green-700">{formatDurationAr(longestAbstinence)}</p>
          </div>
        )}

        {/* Section C: Timeline */}
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-800 mb-4">الجدول الزمني</h3>
          {periods.length === 0 ? (
            <p className="text-sm text-gray-400 text-center">لا توجد فترات مسجلة</p>
          ) : (
            <SummarySection periods={periods} />
          )}
        </div>

        {/* Section D: Personal pattern */}
        {allEvents.length > 0 && (
          <div className="card mb-4 page-break">
            <h3 className="font-semibold text-gray-800 mb-3">نمطك الشخصي</h3>

            {/* Classification counts */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
              <div className="bg-blue-50 rounded-lg p-2">
                <p className="font-bold text-blue-700">{classificationCounts.i}</p>
                <p className="text-xs text-blue-600">داخلي</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-2">
                <p className="font-bold text-amber-700">{classificationCounts.x}</p>
                <p className="text-xs text-amber-600">خارجي</p>
              </div>
              <div className="bg-green-50 rounded-lg p-2">
                <p className="font-bold text-green-700">{classificationCounts.b}</p>
                <p className="text-xs text-green-600">الاثنان</p>
              </div>
            </div>

            {/* Top feelings */}
            {topFeelings.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-1">أكثر المشاعر تكراراً</p>
                <div className="flex flex-wrap gap-1">
                  {topFeelings.map(([name, count]) => (
                    <span key={name} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                      {name} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top external */}
            {topExt.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-1">أكثر الأسباب الخارجية</p>
                <div className="flex flex-wrap gap-1">
                  {topExt.map(([name, count]) => (
                    <span key={name} className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">
                      {name} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Top internal */}
            {topInt.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">أكثر الأسباب الداخلية</p>
                <div className="flex flex-wrap gap-1">
                  {topInt.map(([name, count]) => (
                    <span key={name} className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                      {name} ({count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section E: Last updated */}
        {lastUpdated && (
          <p className="text-center text-xs text-gray-400 mb-6">آخر تحديث: {lastUpdated}</p>
        )}

        {/* Buttons */}
        <div className="space-y-3 no-print">
          <button onClick={handlePrint} className="btn-primary w-full">
            طباعة / تحميل PDF
          </button>
          <button onClick={() => navigate('/timeline')} className="btn-secondary w-full">
            ← تعديل الجدول
          </button>
          <button onClick={handleGoHome} className="btn-secondary w-full text-gray-500">
            الصفحة الرئيسية
          </button>
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 text-center text-xs text-gray-500 border-t pt-4">
          Recovery Center for Psychiatry & Addiction — Alexandria, Egypt
        </div>
      </div>
    </div>
  );
}
