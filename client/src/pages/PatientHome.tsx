import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatient } from '../hooks/usePatient';
import { calcAbstinenceDays, formatAbstinenceAr, getAbstinenceBadge } from '../utils/dates';

interface DailyReason {
  reason_number: number;
  reason_text: string;
}

export default function PatientHome() {
  const navigate = useNavigate();
  const { patient, periods, activities, tools, loading, fetchMe } = usePatient();
  const [dailyReason, setDailyReason] = useState<DailyReason | null>(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Load daily rotating reason
  useEffect(() => {
    const loadDailyReason = async () => {
      const twentyReasonsTool = tools.find((t) => t.tool_type === 'twenty_reasons');
      if (!twentyReasonsTool) {
        setDailyReason(null);
        return;
      }

      try {
        const res = await api.get(`/tools/${twentyReasonsTool.id}`);
        if (res.data.tool.reasons && res.data.tool.reasons.length > 0) {
          // Use day of year as index to rotate through reasons
          const today = new Date();
          const dayOfYear = Math.floor(
            (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
          );
          const reasonIndex = dayOfYear % res.data.tool.reasons.length;
          setDailyReason(res.data.tool.reasons[reasonIndex]);
        }
      } catch (err) {
        console.error('Failed to load daily reason:', err);
      }
    };

    if (!loading) {
      loadDailyReason();
    }
  }, [tools, loading]);

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
    <div className="min-h-screen flex justify-center p-4 pt-6 sm:pt-8 bg-gray-50">
      <div className="w-full max-w-[520px] pb-6">

        {/* Greeting */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">
            أهلاً {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">رحلة التعافي — يوم بيوم</p>
        </div>

        {/* Abstinence counter card */}
        {loading ? (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 text-center text-gray-400 py-6 sm:py-8 mb-6">جاري التحميل...</div>
        ) : badge && durationText ? (
          <div className={`bg-white rounded-lg sm:rounded-xl shadow-sm border-2 ${badge.borderClass} ${badge.bgClass} text-center mb-6 p-6 sm:p-8`}>
            <div className="text-4xl sm:text-5xl mb-3">{badge.emoji}</div>
            <div className={`text-base sm:text-lg font-bold mb-2 ${badge.colorClass}`}>{badge.label}</div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{durationText}</div>
            <div className="text-xs sm:text-sm text-gray-500 italic">{badge.message}</div>
          </div>
        ) : (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border-2 border-gray-200 text-center mb-6 p-6 sm:p-8">
            <div className="text-4xl sm:text-5xl mb-3">🌱</div>
            <p className="text-xs sm:text-sm text-gray-500">
              سجّل فترة امتناع في الجدول الزمني لتظهر هنا مدة تعافيك
            </p>
          </div>
        )}

        {/* Daily Rotating Reason */}
        {dailyReason && (
          <div className="bg-white rounded-lg sm:rounded-xl shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 mb-6 p-4 sm:p-5">
            <p className="text-xs sm:text-sm text-yellow-700 font-medium mb-2">💭 حافزك اليومي</p>
            <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
              السبب {dailyReason.reason_number}: <span className="font-semibold">{dailyReason.reason_text}</span>
            </p>
            <p className="text-xs text-yellow-600 mt-2 cursor-pointer hover:underline" onClick={() => navigate('/tools/twenty-reasons')}>
              ← عرض جميع الأسباب
            </p>
          </div>
        )}

        {/* Quick stats */}
        {!loading && (
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm text-center p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-green-600">
                {periods.filter((p) => p.type === 'abstinent').length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">فترات امتناع</div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm text-center p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{activities.length}</div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">أنشطة علاجية</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={() => navigate('/timeline')}
            className="btn-primary w-full text-right flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base"
          >
            <span>←</span>
            <span>الجدول الزمني</span>
          </button>

          <button
            onClick={() => navigate('/activities')}
            className="w-full rounded-lg sm:rounded-xl border-2 border-blue-200 bg-blue-50 text-blue-700 font-medium py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base flex items-center justify-between hover:bg-blue-100 transition"
          >
            <span>←</span>
            <span>الأنشطة العلاجية</span>
          </button>

          <button
            onClick={() => navigate('/tools')}
            className="w-full rounded-lg sm:rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 font-medium py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base flex items-center justify-between hover:bg-purple-100 transition"
          >
            <span>←</span>
            <span>الأدوات العلاجية</span>
          </button>

          <button
            onClick={() => navigate('/summary')}
            disabled={periods.length === 0}
            className="btn-secondary w-full text-right flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 text-sm sm:text-base disabled:opacity-40"
          >
            <span>←</span>
            <span>الملخص</span>
          </button>
        </div>
      </div>
    </div>
  );
}
