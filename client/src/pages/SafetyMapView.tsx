import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

interface SafeMapTrigger {
  id: number;
  tool_id: number;
  category: 'people' | 'places' | 'situations' | 'habits' | 'instruments' | 'emotions' | 'thoughts';
  trigger_name: string;
  trigger_description: string | null;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  notes: string | null;
  category_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  people: 'الأشخاص',
  places: 'الأماكن',
  situations: 'المواقف',
  habits: 'العادات',
  instruments: 'الأدوات',
  emotions: 'العواطف',
  thoughts: 'الأفكار'
};

export default function SafetyMapView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toolId = searchParams.get('toolId');

  const [triggers, setTriggers] = useState<SafeMapTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  });

  useEffect(() => {
    const loadTriggers = async () => {
      if (!toolId) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/tools/${toolId}/safety-map`);
        const triggerList = res.data.triggers || [];
        setTriggers(triggerList);

        // Calculate stats
        const newStats = {
          total: triggerList.length,
          low: triggerList.filter((t: SafeMapTrigger) => t.risk_level === 'low').length,
          medium: triggerList.filter((t: SafeMapTrigger) => t.risk_level === 'medium').length,
          high: triggerList.filter((t: SafeMapTrigger) => t.risk_level === 'high').length,
          critical: triggerList.filter((t: SafeMapTrigger) => t.risk_level === 'critical').length
        };
        setStats(newStats);
      } catch (err) {
        console.error('Failed to load triggers:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTriggers();
  }, [toolId]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'medium':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'high':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'critical':
        return 'bg-black border-black text-white';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getRiskEmoji = (level: string) => {
    switch (level) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      case 'critical':
        return '⚫';
      default:
        return '⚪';
    }
  };

  const triggersByCategory = triggers.reduce((acc, trigger) => {
    if (!acc[trigger.category]) {
      acc[trigger.category] = [];
    }
    acc[trigger.category].push(trigger);
    return acc;
  }, {} as Record<string, SafeMapTrigger[]>);

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 bg-gray-50">
      <div className="w-full max-w-[800px]">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/tools/safety-map')}
            className="text-gray-500 hover:text-gray-700 ml-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-2xl font-bold text-gray-800">خريطة الأمان</h2>
          <div className="w-8" />
        </div>

        {loading ? (
          <div className="card text-center text-gray-400 py-8">جاري التحميل...</div>
        ) : (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <div className="card bg-gray-50 border-2 border-gray-200 text-center py-3">
                <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                <div className="text-xs text-gray-600 mt-1">إجمالي المثيرات</div>
              </div>
              <div className="card bg-green-50 border-2 border-green-200 text-center py-3">
                <div className="text-2xl font-bold text-green-600">{stats.low}</div>
                <div className="text-xs text-gray-600 mt-1">منخفضة</div>
              </div>
              <div className="card bg-yellow-50 border-2 border-yellow-200 text-center py-3">
                <div className="text-2xl font-bold text-yellow-600">{stats.medium}</div>
                <div className="text-xs text-gray-600 mt-1">متوسطة</div>
              </div>
              <div className="card bg-red-50 border-2 border-red-200 text-center py-3">
                <div className="text-2xl font-bold text-red-600">{stats.high}</div>
                <div className="text-xs text-gray-600 mt-1">عالية</div>
              </div>
              <div className="card bg-black text-white text-center py-3">
                <div className="text-2xl font-bold">{stats.critical}</div>
                <div className="text-xs mt-1">حرجة</div>
              </div>
            </div>

            {/* Triggers by Category */}
            {triggers.length === 0 ? (
              <div className="card text-center text-gray-500 py-8">لم يتم تعريف أي مثيرات بعد</div>
            ) : (
              <div className="space-y-6">
                {Object.entries(triggersByCategory).map(([category, categoryTriggers]) => (
                  <div key={category} className="card">
                    <h3 className="text-lg font-bold text-gray-800 mb-3 pb-2 border-b-2 border-gray-200">
                      {CATEGORY_LABELS[category]}
                    </h3>
                    <div className="space-y-2">
                      {categoryTriggers.map((trigger) => (
                        <div
                          key={trigger.id}
                          className={`p-4 rounded-lg border-2 ${getRiskColor(trigger.risk_level)}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base">
                                {trigger.trigger_name}
                              </h4>
                              {trigger.trigger_description && (
                                <p className="text-sm opacity-80 mt-1">{trigger.trigger_description}</p>
                              )}
                            </div>
                            <span className="text-lg font-bold ml-2">
                              {getRiskEmoji(trigger.risk_level)} {trigger.risk_score}%
                            </span>
                          </div>

                          {/* Category-specific data */}
                          {trigger.category === 'people' && trigger.category_data && (
                            <div className="text-sm space-y-1 mt-2 opacity-90">
                              {trigger.category_data.contact_frequency && (
                                <p>📞 التكرار: {trigger.category_data.contact_frequency}</p>
                              )}
                              {trigger.category_data.current_contact_status && (
                                <p>👤 الحالة: {trigger.category_data.current_contact_status}</p>
                              )}
                              {trigger.category_data.usage_relationship && (
                                <p>🔗 العلاقة: {trigger.category_data.usage_relationship}</p>
                              )}
                            </div>
                          )}

                          {trigger.category === 'places' && trigger.category_data && (
                            <div className="text-sm space-y-1 mt-2 opacity-90">
                              {trigger.category_data.substances_used && (
                                <p>💊 المواد: {trigger.category_data.substances_used}</p>
                              )}
                              {trigger.category_data.current_frequency && (
                                <p>📍 التكرار: {trigger.category_data.current_frequency}</p>
                              )}
                              {trigger.category_data.avoidability && (
                                <p>🛑 التجنب: {trigger.category_data.avoidability}</p>
                              )}
                            </div>
                          )}

                          {trigger.category === 'emotions' && trigger.category_data && (
                            <div className="text-sm space-y-1 mt-2 opacity-90">
                              {trigger.category_data.healthy_strategy && (
                                <p>✓ الاستراتيجية: {trigger.category_data.healthy_strategy}</p>
                              )}
                            </div>
                          )}

                          {trigger.category === 'thoughts' && trigger.category_data && (
                            <div className="text-sm space-y-1 mt-2 opacity-90">
                              {trigger.category_data.frequency_strength && (
                                <p>💪 القوة: {trigger.category_data.frequency_strength}/10</p>
                              )}
                              {trigger.category_data.counter_argument && (
                                <p>🛡️ الرد: {trigger.category_data.counter_argument}</p>
                              )}
                            </div>
                          )}

                          {trigger.notes && (
                            <div className="text-sm mt-2 p-2 bg-white bg-opacity-50 rounded italic">
                              📝 {trigger.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <button
                onClick={() => window.print()}
                className="btn-primary w-full"
              >
                🖨 اطبع الخريطة
              </button>
              <button
                onClick={() => navigate('/tools/safety-map')}
                className="btn-secondary w-full"
              >
                العودة للتعديل
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
