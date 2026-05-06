import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatient } from '../hooks/usePatient';
import Toast from '../components/Toast';

interface ToastState { message: string; type: 'success' | 'error' }

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

export default function DailyPlanner() {
  const navigate = useNavigate();
  const { tools, addTool, updateTool, fetchMe } = usePatient();

  const [planDate, setPlanDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activities, setActivities] = useState<Record<number, PlannerActivity>>(
    Object.fromEntries(HOURS.map((h) => [h, {
      hour: h,
      activity_description: '',
      risk_level: 'low',
      location: '',
      with_whom: '',
      exact_time: '',
      safety_plan: '',
    }]))
  );
  const [toolId, setToolId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [safetyPlanModal, setSafetyPlanModal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Load tools on mount
  useEffect(() => {
    fetchMe();
    setLoading(false);
  }, []);

  // Find existing daily_planner tool
  useEffect(() => {
    const existingTool = tools.find((t) => t.tool_type === 'daily_planner');
    if (existingTool) {
      setToolId(existingTool.id);
      setShared(existingTool.shared_with_therapist);
      loadPlanForDate(existingTool.id, planDate);
    }
  }, [tools]);

  const loadPlanForDate = async (tId: number, date: string) => {
    try {
      const res = await api.get(`/tools/${tId}/planner/${date}`);
      const activitiesData: Record<number, PlannerActivity> = Object.fromEntries(
        HOURS.map((h) => {
          const existing = res.data.activities.find((a: any) => a.hour === h);
          return [
            h,
            existing || {
              hour: h,
              activity_description: '',
              risk_level: 'low',
              location: '',
              with_whom: '',
              exact_time: '',
              safety_plan: '',
            },
          ];
        })
      );
      setActivities(activitiesData);
    } catch {
      // No plan for this date yet — that's okay
    }
  };

  const handleDateChange = async (date: string) => {
    setPlanDate(date);
    if (toolId) {
      await loadPlanForDate(toolId, date);
    }
  };

  const handleActivityChange = (hour: number, field: string, value: string) => {
    setActivities((prev) => ({
      ...prev,
      [hour]: { ...prev[hour], [field]: value },
    }));
  };

  const handleSave = async () => {
    if (!toolId) {
      // Create new tool
      try {
        setSaving(true);
        const createRes = await api.post('/tools', { tool_type: 'daily_planner' });
        const newToolId = createRes.data.tool.id;
        setToolId(newToolId);

        // Save all activities for this date
        for (const hour of HOURS) {
          const activity = activities[hour];
          if (activity.activity_description.trim()) {
            await api.post(`/tools/${newToolId}/planner`, {
              plan_date: planDate,
              hour,
              activity_description: activity.activity_description,
              risk_level: activity.risk_level,
              location: activity.location,
              with_whom: activity.with_whom,
              exact_time: activity.exact_time,
              safety_plan: activity.safety_plan,
            });
          }
        }

        addTool(createRes.data.tool);
        setToast({ message: 'تم حفظ الخطة', type: 'success' });
      } catch (err) {
        console.error(err);
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      } finally {
        setSaving(false);
      }
    } else {
      // Update existing tool
      try {
        setSaving(true);
        for (const hour of HOURS) {
          const activity = activities[hour];
          if (activity.activity_description.trim()) {
            await api.post(`/tools/${toolId}/planner`, {
              plan_date: planDate,
              hour,
              activity_description: activity.activity_description,
              risk_level: activity.risk_level,
              location: activity.location,
              with_whom: activity.with_whom,
              exact_time: activity.exact_time,
              safety_plan: activity.safety_plan,
            });
          }
        }
        setToast({ message: 'تم حفظ الخطة', type: 'success' });
      } catch (err) {
        console.error(err);
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      } finally {
        setSaving(false);
      }
    }
  };

  const handleShare = async () => {
    if (!toolId) {
      setToast({ message: 'يجب حفظ الخطة أولاً', type: 'error' });
      return;
    }

    try {
      setSaving(true);
      await api.patch(`/tools/${toolId}/share`);
      setShared(true);
      updateTool(toolId, { shared_with_therapist: true });
      setToast({ message: 'تم المشاركة مع المعالج', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'خطأ في المشاركة', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const unplannedHours = HOURS.filter((h) => !activities[h].activity_description.trim()).length;
  const hasRiskWarning = unplannedHours > 4;

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center mb-2">
          <button onClick={() => navigate('/tools')} className="text-gray-500 hover:text-gray-700 ml-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-xl font-medium text-gray-800">جدول اليوم</h2>
          <div className="w-8" />
        </div>

        <p className="text-center text-sm text-gray-500 mb-4">
          خطط ليومك ساعة بساعة وحدد الأنشطة الآمنة والخطرة
        </p>

        {/* Date Picker */}
        <div className="card mb-4">
          <label className="text-sm font-medium text-gray-700 block mb-2">التاريخ</label>
          <input
            type="date"
            value={planDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="input-base w-full"
          />
        </div>

        {/* Warning if unplanned */}
        {hasRiskWarning && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-700">
              ⚠ أكثر من 4 ساعات غير مخطط لها — هذا يشكل خطرة
            </p>
          </div>
        )}

        {/* Hourly Grid */}
        <div className="card space-y-3 mb-4 max-h-[500px] overflow-y-auto">
          {HOURS.map((hour) => {
            const activity = activities[hour];
            const isEmpty = !activity.activity_description.trim();
            return (
              <div key={hour} className={`p-3 rounded-lg border ${
                isEmpty ? 'bg-gray-50 border-gray-200' :
                activity.risk_level === 'high' ? 'bg-red-50 border-red-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-gray-700 w-12">
                    {String(hour).padStart(2, '0')}:00
                  </span>
                  <button
                    onClick={() => handleActivityChange(hour, 'risk_level', activity.risk_level === 'low' ? 'high' : 'low')}
                    className={`px-2 py-1 rounded text-xs font-medium transition ${
                      activity.risk_level === 'high'
                        ? 'bg-red-200 text-red-700 hover:bg-red-300'
                        : 'bg-green-200 text-green-700 hover:bg-green-300'
                    }`}
                  >
                    {activity.risk_level === 'high' ? '⚠ عالي' : '✓ آمن'}
                  </button>
                </div>

                <input
                  type="text"
                  value={activity.activity_description}
                  onChange={(e) => handleActivityChange(hour, 'activity_description', e.target.value)}
                  placeholder="وصف النشاط (مثلاً: نوم، عمل، رياضة...)"
                  className="input-base w-full text-sm mb-2"
                />

                {!isEmpty && (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                      <input
                        type="text"
                        value={activity.location}
                        onChange={(e) => handleActivityChange(hour, 'location', e.target.value)}
                        placeholder="المكان"
                        className="input-base"
                      />
                      <input
                        type="text"
                        value={activity.with_whom}
                        onChange={(e) => handleActivityChange(hour, 'with_whom', e.target.value)}
                        placeholder="مع من"
                        className="input-base"
                      />
                    </div>

                    <input
                      type="text"
                      value={activity.exact_time}
                      onChange={(e) => handleActivityChange(hour, 'exact_time', e.target.value)}
                      placeholder="الوقت المحدد (مثلاً: 14:30-15:00)"
                      className="input-base w-full text-xs mb-2"
                    />

                    {activity.risk_level === 'high' && (
                      <button
                        onClick={() => setSafetyPlanModal(hour)}
                        className="w-full text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded py-1 px-2 transition"
                      >
                        📋 خطة الأمان
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? 'جاري الحفظ...' : '✓ حفظ'}
          </button>

          <button
            onClick={() => navigate(`/tools/daily-planner/view?date=${planDate}`)}
            className="w-full py-3 px-4 rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 transition"
          >
            📅 عرض الخطة كجدول زمني
          </button>

          <button
            onClick={handleShare}
            disabled={saving || !toolId || shared}
            className={`w-full py-3 px-4 rounded-xl font-medium transition ${
              shared
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {shared ? '✓ مشاركة مع المعالج' : 'مشاركة مع المعالج'}
          </button>

          <button
            onClick={() => navigate('/tools')}
            className="btn-secondary w-full"
          >
            رجوع
          </button>
        </div>

        {/* Safety Plan Modal */}
        {safetyPlanModal !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-end z-50">
            <div className="w-full bg-white rounded-t-3xl p-4 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">خطة الأمان للساعة {String(safetyPlanModal).padStart(2, '0')}:00</h3>
                <button onClick={() => setSafetyPlanModal(null)} className="text-gray-500 text-2xl">×</button>
              </div>

              <textarea
                value={activities[safetyPlanModal].safety_plan}
                onChange={(e) => handleActivityChange(safetyPlanModal, 'safety_plan', e.target.value)}
                placeholder="كيف ستتعامل مع الخطر؟ من ستتصل به؟ كيف سترغي الأشياء؟"
                rows={5}
                className="input-base w-full resize-none"
              />

              <button
                onClick={() => setSafetyPlanModal(null)}
                className="btn-primary w-full"
              >
                حفظ خطة الأمان
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
