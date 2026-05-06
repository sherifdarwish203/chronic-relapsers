import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { usePatient } from '../hooks/usePatient';

interface PlannerActivity {
  hour: number;
  activity_description: string;
  risk_level: 'low' | 'high';
  location: string;
  with_whom: string;
  exact_time: string;
  safety_plan: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function DailyPlannerView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tools, fetchMe } = usePatient();

  const [planDate, setPlanDate] = useState<string>(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState<Record<number, PlannerActivity>>({});
  const [loading, setLoading] = useState(true);

  // Load tools on mount
  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    const loadPlan = async () => {
      const plannerTool = tools.find((t) => t.tool_type === 'daily_planner');
      if (!plannerTool) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/tools/${plannerTool.id}/planner/${planDate}`);
        const activitiesMap: Record<number, PlannerActivity> = {};
        for (const activity of res.data.activities) {
          activitiesMap[activity.hour] = activity;
        }
        setActivities(activitiesMap);
        setLoading(false);
      } catch {
        // No plan for this date
        setLoading(false);
      }
    };

    if (tools.length > 0) {
      loadPlan();
    }
  }, [planDate, tools]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTimeBlock = (hour: number) => {
    const startHour = String(hour).padStart(2, '0');
    const endHour = String((hour + 1) % 24).padStart(2, '0');
    return `${startHour}:00 - ${endHour}:00`;
  };

  const plannedCount = HOURS.filter((h) => activities[h]?.activity_description).length;
  const riskCount = HOURS.filter((h) => activities[h]?.risk_level === 'high').length;

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 bg-gray-50">
      <div className="w-full max-w-[600px]">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/tools/daily-planner')}
            className="text-gray-500 hover:text-gray-700 ml-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-2xl font-bold text-gray-800">جدول اليوم</h2>
          <div className="w-8" />
        </div>

        {/* Date Display */}
        <div className="text-center mb-6">
          <p className="text-lg font-semibold text-gray-800">{formatDate(planDate)}</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card bg-blue-50 border-2 border-blue-200 text-center py-3">
            <div className="text-2xl font-bold text-blue-600">{plannedCount}/24</div>
            <div className="text-xs text-gray-600 mt-1">ساعات مخطط لها</div>
          </div>
          <div className="card bg-green-50 border-2 border-green-200 text-center py-3">
            <div className="text-2xl font-bold text-green-600">{HOURS.length - plannedCount}</div>
            <div className="text-xs text-gray-600 mt-1">ساعات فارغة</div>
          </div>
          <div className="card bg-red-50 border-2 border-red-200 text-center py-3">
            <div className="text-2xl font-bold text-red-600">{riskCount}</div>
            <div className="text-xs text-gray-600 mt-1">ساعات عالية الخطر</div>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="card text-center text-gray-500 py-6">جاري التحميل...</div>
        ) : (
          <div className="space-y-2">
            {HOURS.map((hour) => {
              const activity = activities[hour];
              const isEmpty = !activity?.activity_description;

              return (
                <div
                  key={hour}
                  className={`p-4 rounded-lg border-l-4 ${
                    isEmpty
                      ? 'bg-gray-50 border-l-gray-300'
                      : activity.risk_level === 'high'
                      ? 'bg-red-50 border-l-red-500'
                      : 'bg-green-50 border-l-green-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-mono font-bold text-gray-700">
                      {formatTimeBlock(hour)}
                    </div>
                    {activity && (
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          activity.risk_level === 'high'
                            ? 'bg-red-200 text-red-700'
                            : 'bg-green-200 text-green-700'
                        }`}
                      >
                        {activity.risk_level === 'high' ? '⚠ عالي الخطر' : '✓ آمن'}
                      </span>
                    )}
                  </div>

                  {isEmpty ? (
                    <p className="text-sm text-gray-400 italic">لا يوجد نشاط مخطط</p>
                  ) : (
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-gray-800">
                        {activity.activity_description}
                      </p>
                      {activity.exact_time && (
                        <p className="text-gray-600">
                          ⏰ {activity.exact_time}
                        </p>
                      )}
                      {activity.location && (
                        <p className="text-gray-600">
                          📍 {activity.location}
                        </p>
                      )}
                      {activity.with_whom && (
                        <p className="text-gray-600">
                          👥 مع {activity.with_whom}
                        </p>
                      )}
                      {activity.risk_level === 'high' && activity.safety_plan && (
                        <div className="mt-2 p-2 bg-red-100 rounded border-l-2 border-red-500">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            خطة الأمان:
                          </p>
                          <p className="text-xs text-red-600">{activity.safety_plan}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 mt-6">
          <button
            onClick={() => window.print()}
            className="btn-primary w-full"
          >
            🖨 اطبع الخطة
          </button>

          <button
            onClick={() => navigate('/tools/daily-planner')}
            className="btn-secondary w-full"
          >
            العودة للتعديل
          </button>
        </div>
      </div>
    </div>
  );
}
