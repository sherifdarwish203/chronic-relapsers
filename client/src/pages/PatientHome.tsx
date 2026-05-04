import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../hooks/usePatient';
import { calcAbstinenceDays, formatAbstinenceAr, getAbstinenceBadge } from '../utils/dates';

export default function PatientHome() {
  const navigate = useNavigate();
  const { patient, periods, activities, loading, fetchMe } = usePatient();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Derive abstinence start automatically:
  // 1. If the most recent period is an ongoing relapse → currently relapsing, no counter
  // 2. Otherwise take the LATER of:
  //    a. The month after the most recently ENDED relapse
  //    b. The start of any ongoing abstinent period
  const abstinenceStart = (() => {
    if (!periods.length) return null;

    const byStartDesc = [...periods].sort(
      (a, b) => (b.start_year * 12 + b.start_month) - (a.start_year * 12 + a.start_month)
    );
    const mostRecent = byStartDesc[0];
    if (mostRecent.type === 'relapse' && !mostRecent.end_month) return null; // currently relapsing

    const lastEndedRelapse = periods
      .filter((p) => p.type === 'relapse' && p.end_month && p.end_year)
      .sort((a, b) => (b.end_year! * 12 + b.end_month!) - (a.end_year! * 12 + a.end_month!))[0] || null;

    const ongoingAbstinent = periods
      .filter((p) => p.type === 'abstinent' && !p.end_month)
      .sort((a, b) => (b.start_year * 12 + b.start_month) - (a.start_year * 12 + a.start_month))[0] || null;

    if (!lastEndedRelapse && !ongoingAbstinent) return null;

    // Month after the last ended relapse
    let relapseNextMonth = 0, relapseNextYear = 0;
    if (lastEndedRelapse) {
      relapseNextMonth = lastEndedRelapse.end_month! + 1;
      relapseNextYear = lastEndedRelapse.end_year!;
      if (relapseNextMonth > 12) { relapseNextMonth = 1; relapseNextYear++; }
    }

    const relapseAbs = lastEndedRelapse ? relapseNextYear * 12 + relapseNextMonth : -Infinity;
    const abstinentAbs = ongoingAbstinent
      ? ongoingAbstinent.start_year * 12 + ongoingAbstinent.start_month
      : -Infinity;

    if (relapseAbs >= abstinentAbs) {
      return { month: relapseNextMonth, year: relapseNextYear, day: null as number | null };
    }
    return {
      month: ongoingAbstinent!.start_month,
      year: ongoingAbstinent!.start_year,
      day: ongoingAbstinent!.start_day,
    };
  })();

  const abstinenceDays = abstinenceStart
    ? calcAbstinenceDays(abstinenceStart.month, abstinenceStart.year, abstinenceStart.day)
    : null;

  const badge = abstinenceDays !== null ? getAbstinenceBadge(abstinenceDays) : null;
  const durationText = abstinenceDays !== null ? formatAbstinenceAr(abstinenceDays) : null;

  const firstName = patient?.display_name?.split(' ')[0] || '';

  return (
    <div className="min-h-screen flex justify-center p-4 pt-8">
      <div className="w-full max-w-[480px]">

        {/* Greeting */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            أهلاً {firstName} 👋
          </h1>
          <p className="text-sm text-gray-500">رحلة التعافي — يوم بيوم</p>
        </div>

        {/* Abstinence counter card */}
        {loading ? (
          <div className="card text-center text-gray-400 py-6">جاري التحميل...</div>
        ) : badge && durationText ? (
          <div className={`card border-2 ${badge.borderClass} ${badge.bgClass} text-center mb-6`}>
            <div className="text-5xl mb-3">{badge.emoji}</div>
            <div className={`text-lg font-bold mb-1 ${badge.colorClass}`}>{badge.label}</div>
            <div className="text-3xl font-bold text-gray-800 mb-2">{durationText}</div>
            <div className="text-sm text-gray-500 italic">{badge.message}</div>
          </div>
        ) : (
          <div className="card border-2 border-gray-200 bg-gray-50 text-center mb-6">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-sm text-gray-500">
              سجّل فترة امتناع في الجدول الزمني لتظهر هنا مدة تعافيك
            </p>
          </div>
        )}

        {/* Quick stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="card text-center py-3">
              <div className="text-2xl font-bold text-green-600">
                {periods.filter((p) => p.type === 'abstinent').length}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">فترات امتناع</div>
            </div>
            <div className="card text-center py-3">
              <div className="text-2xl font-bold text-blue-600">{activities.length}</div>
              <div className="text-xs text-gray-500 mt-0.5">أنشطة علاجية</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/timeline')}
            className="btn-primary w-full text-right flex items-center justify-between px-5"
          >
            <span>←</span>
            <span>الجدول الزمني</span>
          </button>

          <button
            onClick={() => navigate('/activities')}
            className="w-full rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-medium py-3 px-5 flex items-center justify-between hover:bg-blue-100 transition"
          >
            <span>←</span>
            <span>الأنشطة العلاجية</span>
          </button>

          <button
            onClick={() => navigate('/summary')}
            disabled={periods.length === 0}
            className="btn-secondary w-full text-right flex items-center justify-between px-5 disabled:opacity-40"
          >
            <span>←</span>
            <span>الملخص</span>
          </button>
        </div>
      </div>
    </div>
  );
}
