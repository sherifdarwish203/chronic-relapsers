import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatient } from '../hooks/usePatient';
import { useAutoExpandTextarea } from '../hooks/useAutoExpandTextarea';
import Toast from '../components/Toast';
import { calculateRiskScore } from '../utils/riskCalculation';

interface ToastState { message: string; type: 'success' | 'error' }

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

const CATEGORIES = ['people', 'places', 'situations', 'habits', 'instruments', 'emotions', 'thoughts'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  people: 'الأشخاص',
  places: 'الأماكن',
  situations: 'المواقف',
  habits: 'العادات',
  instruments: 'الأدوات',
  emotions: 'العواطف',
  thoughts: 'الأفكار'
};

export default function SafetyMap() {
  const navigate = useNavigate();
  const { tools, addTool, updateTool, fetchMe } = usePatient();

  const [triggers, setTriggers] = useState<SafeMapTrigger[]>([]);
  const [toolId, setToolId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<typeof CATEGORIES[number]>('people');
  const [saving, setSaving] = useState(false);
  const [shared, setShared] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [editingTrigger, setEditingTrigger] = useState<SafeMapTrigger | null>(null);
  const [loading, setLoading] = useState(true);

  // Load tools on mount
  useEffect(() => {
    fetchMe();
    setLoading(false);
  }, []);

  // Find existing safety_map tool
  useEffect(() => {
    const loadTriggers = async () => {
      const existingTool = tools.find((t) => t.tool_type === 'safety_map');
      if (existingTool) {
        setToolId(existingTool.id);
        setShared(existingTool.shared_with_therapist);
        try {
          const res = await api.get(`/tools/${existingTool.id}/safety-map`);
          if (res.data.triggers) {
            setTriggers(res.data.triggers);
          }
        } catch {
          // No triggers yet
        }
      }
    };

    if (tools.length > 0) {
      loadTriggers();
    }
  }, [tools]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'critical':
        return 'bg-black text-white border-black';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
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

  const handleSave = async () => {
    if (!toolId) {
      // Create new tool
      try {
        setSaving(true);
        const createRes = await api.post('/tools', { tool_type: 'safety_map' });
        const newToolId = createRes.data.tool.id;
        setToolId(newToolId);
        addTool(createRes.data.tool);
        setToast({ message: 'تم إنشاء خريطة الأمان', type: 'success' });
      } catch (err) {
        console.error(err);
        setToast({ message: 'خطأ في الحفظ', type: 'error' });
      } finally {
        setSaving(false);
      }
    } else {
      setToast({ message: 'تم حفظ خريطة الأمان', type: 'success' });
    }
  };

  const handleShare = async () => {
    if (!toolId) {
      setToast({ message: 'يجب إنشاء خريطة الأمان أولاً', type: 'error' });
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

  const categoryTriggers = triggers.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-4 pt-6">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="w-full max-w-[600px]">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 gap-3">
          <button onClick={() => navigate('/tools')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">خريطة الأمان</h2>
          <div className="w-10" />
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-600 mb-6 px-2">
          حدد مثيراتك الخارجية والداخلية وقيم مستوى خطورتها
        </p>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition min-h-10 ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Triggers List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm text-center text-gray-400 py-6">جاري التحميل...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            {categoryTriggers.length === 0 ? (
              <p className="text-center text-gray-400 py-6">لا توجد مثيرات في هذه الفئة بعد</p>
            ) : (
              <div className="space-y-2">
                {categoryTriggers.map((trigger) => (
                  <div
                    key={trigger.id}
                    onClick={() => setEditingTrigger(trigger)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition hover:shadow-md active:shadow-lg ${
                      trigger.risk_level === 'critical'
                        ? 'bg-black border-black'
                        : trigger.risk_level === 'high'
                        ? 'bg-red-50 border-red-300'
                        : trigger.risk_level === 'medium'
                        ? 'bg-yellow-50 border-yellow-300'
                        : 'bg-green-50 border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm sm:text-base break-words ${trigger.risk_level === 'critical' ? 'text-white' : 'text-gray-800'}`}>
                          {trigger.trigger_name}
                        </p>
                      </div>
                      <span
                        className={`text-xs sm:text-sm font-bold px-2 py-1 rounded border whitespace-nowrap flex-shrink-0 ${getRiskColor(trigger.risk_level)}`}
                      >
                        {getRiskEmoji(trigger.risk_level)} {trigger.risk_score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={async () => {
                // Create tool if it doesn't exist
                if (!toolId) {
                  try {
                    setSaving(true);
                    const createRes = await api.post('/tools', { tool_type: 'safety_map' });
                    const newToolId = createRes.data.tool.id;
                    setToolId(newToolId);
                    addTool(createRes.data.tool);

                    // Now open the modal for new trigger
                    setEditingTrigger({
                      id: 0,
                      tool_id: newToolId,
                      category: activeCategory,
                      trigger_name: '',
                      trigger_description: null,
                      risk_score: 50,
                      risk_level: 'medium',
                      notes: null,
                      category_data: {},
                      created_at: '',
                      updated_at: ''
                    });
                  } catch (err) {
                    console.error(err);
                    setToast({ message: 'خطأ في إنشاء خريطة الأمان', type: 'error' });
                  } finally {
                    setSaving(false);
                  }
                } else {
                  setEditingTrigger({
                    id: 0,
                    tool_id: toolId,
                    category: activeCategory,
                    trigger_name: '',
                    trigger_description: null,
                    risk_score: 50,
                    risk_level: 'medium',
                    notes: null,
                    category_data: {},
                    created_at: '',
                    updated_at: ''
                  });
                }
              }}
              disabled={saving}
              className="w-full mt-4 py-2 sm:py-3 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm sm:text-base font-medium transition disabled:opacity-50 min-h-10"
            >
              {saving ? 'جاري الإنشاء...' : '+ إضافة مثير جديد'}
            </button>
          </div>
        )}

        {/* Buttons */}
        <div className="space-y-3 pb-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full py-3 sm:py-4 text-sm sm:text-base"
          >
            {saving ? 'جاري الحفظ...' : '✓ حفظ'}
          </button>

          {toolId && (
            <button
              onClick={() => navigate(`/tools/safety-map/view?toolId=${toolId}`)}
              className="w-full py-3 sm:py-4 px-4 rounded-xl border-2 border-purple-200 bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 transition text-sm sm:text-base"
            >
              📊 عرض الخريطة
            </button>
          )}

          <button
            onClick={handleShare}
            disabled={saving || !toolId || shared}
            className={`w-full py-3 sm:py-4 px-4 rounded-xl font-medium transition text-sm sm:text-base ${
              shared
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
            }`}
          >
            {shared ? '✓ مشاركة مع المعالج' : 'مشاركة مع المعالج'}
          </button>

          <button
            onClick={() => navigate('/tools')}
            className="btn-secondary w-full py-3 sm:py-4 text-sm sm:text-base"
          >
            رجوع
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingTrigger && (
        <TriggerModal
          trigger={editingTrigger}
          toolId={toolId}
          onClose={() => setEditingTrigger(null)}
          onSave={async (updated) => {
            if (!toolId) {
              setToast({ message: 'خطأ: لم يتم إنشاء الأداة', type: 'error' });
              return;
            }
            try {
              if (editingTrigger.id === 0) {
                // New trigger
                const res = await api.post(`/tools/${toolId}/safety-map/triggers`, {
                  category: updated.category,
                  trigger_name: updated.trigger_name,
                  trigger_description: updated.trigger_description || null,
                  notes: updated.notes || null,
                  category_data: updated.category_data
                });
                setTriggers([...triggers, res.data.trigger]);
              } else {
                // Update existing
                const res = await api.patch(`/tools/${toolId}/safety-map/triggers/${updated.id}`, {
                  trigger_description: updated.trigger_description || null,
                  notes: updated.notes || null,
                  category_data: updated.category_data
                });
                setTriggers(triggers.map((t) => (t.id === updated.id ? res.data.trigger : t)));
              }
              setEditingTrigger(null);
              setToast({ message: 'تم حفظ المثير', type: 'success' });
            } catch (err) {
              console.error('Save error:', err);
              const errorMsg = (err as any)?.response?.data?.error || 'خطأ في الحفظ';
              setToast({ message: errorMsg, type: 'error' });
            }
          }}
          onDelete={async (id) => {
            if (!toolId || id === 0) return;
            try {
              await api.delete(`/tools/${toolId}/safety-map/triggers/${id}`);
              setTriggers(triggers.filter((t) => t.id !== id));
              setEditingTrigger(null);
              setToast({ message: 'تم حذف المثير', type: 'success' });
            } catch (err) {
              console.error(err);
              setToast({ message: 'خطأ في الحذف', type: 'error' });
            }
          }}
        />
      )}
    </div>
  );
}

// Trigger Edit Modal Component
function TriggerModal({
  trigger,
  toolId,
  onClose,
  onSave,
  onDelete
}: {
  trigger: SafeMapTrigger;
  toolId: number | null;
  onClose: () => void;
  onSave: (trigger: SafeMapTrigger) => void;
  onDelete: (id: number) => void;
}) {
  const [data, setData] = useState(trigger);
  const notesRef = useAutoExpandTextarea();

  // Recalculate risk score whenever category_data changes
  useEffect(() => {
    const { score, level } = calculateRiskScore(data.category, data.category_data);
    setData((prev) => ({
      ...prev,
      risk_score: score,
      risk_level: level
    }));
  }, [data.category_data, data.category]);

  const updateCategoryData = (key: string, value: any) => {
    setData({
      ...data,
      category_data: { ...data.category_data, [key]: value }
    });
  };

  const renderCategoryFields = () => {
    switch (data.category) {
      case 'people':
        return (
          <>
            <input
              type="text"
              placeholder="الاسم"
              value={data.trigger_name}
              onChange={(e) => setData({ ...data, trigger_name: e.target.value })}
              className="input-base w-full mb-2"
            />
            <select
              value={data.category_data.contact_frequency || 'monthly'}
              onChange={(e) => updateCategoryData('contact_frequency', e.target.value)}
              className="input-base w-full mb-2"
            >
              <option value="">اختر تكرار التواصل</option>
              <option value="daily">يومي</option>
              <option value="weekly">أسبوعي</option>
              <option value="monthly">شهري</option>
              <option value="rarely">نادراً</option>
            </select>
            <select
              value={data.category_data.current_contact_status || 'no_contact'}
              onChange={(e) => updateCategoryData('current_contact_status', e.target.value)}
              className="input-base w-full mb-2"
            >
              <option value="">هل أنت على تواصل معه؟</option>
              <option value="in_contact">نعم، على تواصل</option>
              <option value="no_contact">لا، لا توجد علاقة</option>
              <option value="trying_to_avoid">أحاول تجنبه</option>
            </select>
            <select
              value={data.category_data.usage_relationship || 'friend'}
              onChange={(e) => updateCategoryData('usage_relationship', e.target.value)}
              className="input-base w-full mb-2"
            >
              <option value="">العلاقة</option>
              <option value="together">كنا نستخدم معاً</option>
              <option value="dealer">كان تاجراً</option>
              <option value="enabler">كان يشجعني</option>
              <option value="friend">صديق</option>
              <option value="family">عائلة</option>
            </select>
            <input
              type="text"
              placeholder="رقم الهاتف (اختياري)"
              value={data.category_data.phone_number || ''}
              onChange={(e) => updateCategoryData('phone_number', e.target.value)}
              className="input-base w-full"
            />
          </>
        );
      case 'places':
        return (
          <>
            <input
              type="text"
              placeholder="اسم المكان"
              value={data.trigger_name}
              onChange={(e) => setData({ ...data, trigger_name: e.target.value })}
              className="input-base w-full mb-2"
            />
            <input
              type="text"
              placeholder="المواد المستخدمة هناك"
              value={data.category_data.substances_used || ''}
              onChange={(e) => updateCategoryData('substances_used', e.target.value)}
              className="input-base w-full mb-2"
            />
            <select
              value={data.category_data.current_frequency || 'monthly'}
              onChange={(e) => updateCategoryData('current_frequency', e.target.value)}
              className="input-base w-full mb-2"
            >
              <option value="">كم مرة تمر من هناك؟</option>
              <option value="daily">يومياً</option>
              <option value="weekly">أسبوعياً</option>
              <option value="monthly">شهرياً</option>
              <option value="rarely">نادراً</option>
            </select>
            <select
              value={data.category_data.avoidability || 'difficult'}
              onChange={(e) => updateCategoryData('avoidability', e.target.value)}
              className="input-base w-full mb-2"
            >
              <option value="">هل يمكن تجنب هذا المكان؟</option>
              <option value="easy">بسهولة</option>
              <option value="difficult">صعب</option>
              <option value="impossible">مستحيل</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.category_data.alternative_routes === true}
                onChange={(e) => updateCategoryData('alternative_routes', e.target.checked)}
              />
              هل لديك طرق بديلة؟
            </label>
          </>
        );
      case 'emotions':
        return (
          <>
            <select
              value={data.trigger_name}
              onChange={(e) => setData({ ...data, trigger_name: e.target.value })}
              className="input-base w-full mb-2"
            >
              <option value="">اختر العاطفة</option>
              <option value="القلق">القلق</option>
              <option value="الحزن">الحزن</option>
              <option value="الوحدة">الوحدة</option>
              <option value="الغضب">الغضب</option>
              <option value="الملل">الملل</option>
              <option value="الإحباط">الإحباط</option>
            </select>
            <textarea
              placeholder="متى تشعر بهذه العاطفة؟"
              value={data.category_data.when_felt || ''}
              onChange={(e) => updateCategoryData('when_felt', e.target.value)}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="ما الذي يثير هذه العاطفة؟"
              value={data.category_data.what_triggers || ''}
              onChange={(e) => updateCategoryData('what_triggers', e.target.value)}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="كيف تتعامل معها حالياً؟"
              value={data.category_data.current_coping || ''}
              onChange={(e) => updateCategoryData('current_coping', e.target.value)}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="استراتيجية صحية بديلة (مثل: الاتصال بصديق، الرياضة)"
              value={data.category_data.healthy_strategy || ''}
              onChange={(e) => updateCategoryData('healthy_strategy', e.target.value)}
              className="input-base w-full textarea-auto-expand"
            />
          </>
        );
      case 'thoughts':
        return (
          <>
            <textarea
              placeholder="الفكرة (مثلاً: 'مرة واحدة لن تضرني')"
              value={data.trigger_name}
              onChange={(e) => setData({ ...data, trigger_name: e.target.value })}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="متى تخطر ببالك؟"
              value={data.category_data.when_occurs || ''}
              onChange={(e) => updateCategoryData('when_occurs', e.target.value)}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <div className="mb-2">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                قوة الفكرة (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={data.category_data.frequency_strength || 5}
                onChange={(e) => updateCategoryData('frequency_strength', parseInt(e.target.value))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{data.category_data.frequency_strength || 5}/10</span>
            </div>
            <textarea
              placeholder="رد منطقي على هذه الفكرة (مثلاً: 'مرة واحدة = العودة للإدمان')"
              value={data.category_data.counter_argument || ''}
              onChange={(e) => updateCategoryData('counter_argument', e.target.value)}
              className="input-base w-full textarea-auto-expand"
            />
          </>
        );
      case 'situations':
        return (
          <>
            <select
              value={data.trigger_name}
              onChange={(e) => setData({ ...data, trigger_name: e.target.value })}
              className="input-base w-full mb-2"
            >
              <option value="">نوع الموقف</option>
              <option value="الضغط">الضغط والتوتر</option>
              <option value="الملل">الملل</option>
              <option value="النزاع">النزاع مع الآخرين</option>
              <option value="الاحتفال">الاحتفالات والحفلات</option>
              <option value="الصعوبات">الصعوبات المالية</option>
            </select>
            <textarea
              placeholder="متى يحدث هذا الموقف؟"
              value={data.category_data.when_happens || ''}
              onChange={(e) => updateCategoryData('when_happens', e.target.value)}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="كيف تتعامل معه حالياً؟"
              value={data.category_data.current_coping || ''}
              onChange={(e) => updateCategoryData('current_coping', e.target.value)}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="خطة بديلة صحية (اختياري)"
              value={data.category_data.alternative_plan || ''}
              onChange={(e) => updateCategoryData('alternative_plan', e.target.value)}
              className="input-base w-full textarea-auto-expand"
            />
          </>
        );
      case 'habits':
        return (
          <>
            <textarea
              placeholder="وصف العادة"
              value={data.trigger_name}
              onChange={(e) => setData({ ...data, trigger_name: e.target.value })}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="متى تفعل هذه العادة؟"
              value={data.category_data.when_done || ''}
              onChange={(e) => updateCategoryData('when_done', e.target.value)}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="ما الذي يثير هذه العادة؟"
              value={data.category_data.what_triggers || ''}
              onChange={(e) => updateCategoryData('what_triggers', e.target.value)}
              className="input-base w-full mb-2 textarea-auto-expand"
            />
            <textarea
              placeholder="هل يمكن استبدالها بعادة صحية؟"
              value={data.category_data.can_replace_with || ''}
              onChange={(e) => updateCategoryData('can_replace_with', e.target.value)}
              className="input-base w-full textarea-auto-expand"
            />
          </>
        );
      case 'instruments':
        return (
          <>
            <input
              type="text"
              placeholder="نوع الأداة (مثلاً: إبرة، أنبوبة)"
              value={data.trigger_name}
              onChange={(e) => setData({ ...data, trigger_name: e.target.value })}
              className="input-base w-full mb-2"
            />
            <input
              type="text"
              placeholder="أين تجدها؟"
              value={data.category_data.where_found || ''}
              onChange={(e) => updateCategoryData('where_found', e.target.value)}
              className="input-base w-full mb-2"
            />
            <select
              value={data.category_data.ease_of_access || 'moderate'}
              onChange={(e) => updateCategoryData('ease_of_access', e.target.value)}
              className="input-base w-full mb-2"
            >
              <option value="">مدى سهولة الوصول</option>
              <option value="easy">سهلة جداً</option>
              <option value="moderate">متوسطة</option>
              <option value="difficult">صعبة</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data.category_data.removed_access === true}
                onChange={(e) => updateCategoryData('removed_access', e.target.checked)}
              />
              هل أزلت إمكانية الوصول إليها؟
            </label>
          </>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full bg-white rounded-t-3xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {CATEGORY_LABELS[data.category]}
          </h3>
          <button onClick={onClose} className="text-gray-500 text-2xl">×</button>
        </div>

        <div className="space-y-3">
          {renderCategoryFields()}

          <textarea
            ref={notesRef}
            placeholder="ملاحظات شخصية (اختياري)"
            value={data.notes || ''}
            onChange={(e) => setData({ ...data, notes: e.target.value })}
            className="input-base w-full textarea-auto-expand"
          />

          {/* Risk Score Display */}
          <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm font-medium text-gray-700">
              مستوى الخطورة: <span className="font-bold text-lg">{data.risk_score}%</span>
            </p>
            <div className="mt-1 h-2 bg-gray-300 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  data.risk_level === 'critical'
                    ? 'bg-black'
                    : data.risk_level === 'high'
                    ? 'bg-red-500'
                    : data.risk_level === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${data.risk_score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          {data.id !== 0 && (
            <button
              onClick={() => onDelete(data.id)}
              className="flex-1 py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition"
            >
              حذف
            </button>
          )}
          <button
            onClick={() => {
              if (!data.trigger_name) {
                alert('الرجاء إدخال اسم المثير');
                return;
              }
              if (!data.category_data || Object.keys(data.category_data).length === 0) {
                alert('الرجاء ملء بيانات المثير');
                return;
              }
              onSave(data);
            }}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            حفظ
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
