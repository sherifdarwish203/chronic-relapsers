import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { usePatient } from '../hooks/usePatient';
import Toast from '../components/Toast';
import { useAutoExpandTextarea } from '../hooks/useAutoExpandTextarea';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface DecisionItem {
  id: number;
  category: 'pros_using' | 'cons_using' | 'pros_abstinent' | 'cons_abstinent';
  item_text: string;
  position_order: number;
  created_at: string;
}

const EXPLANATION_TEXT = `**الطريق للتعافي: سهم التغيير**

**١- فهم الرحلة**

التعافي مش خط مستقيم من "أنا بشرب أو بستخدم" إلى "أنا بقيت ناجح ومستقر".

التعافي عملية بيولوجية ونفسية، وبتاخد وقت ومراحل.

في المخ، الإدمان بيأثر على منطقة اسمها "مركز المكافأة"، ودي المنطقة اللي بتطلع دوبامين وبتخلينا نحس بالمتعة أو الرضا أو إن في حاجة كويسة حصلت.

لما المخ يتعود على المخدر أو الكحول، المادة تبدأ تاخد مكان النظام الطبيعي ده. ومع الوقت، مركز المكافأة الطبيعي يضعف، وكأن المخ بقى مطفي أو ضلم.

علشان كده التغيير مش مجرد قرار وخلاص.
التغيير محتاج إن النظام ده يتبني من جديد، خطوة ورا خطوة، وبترتيب معين.

---

**٢- مربع القرار: الواجب بتاعك**

قبل ما الواحد يبدأ يتحرك في طريق التعافي، لازم يبقى صادق مع نفسه.

معظم الناس ما بتشربش أو تستخدم من غير سبب. في ناس بتستخدم علشان تعرف تتعامل مع الناس، أو تحس بثقة، أو تهرب من ضغط الحياة، أو تسكت مشاعر صعبة.

علشان كده لازم الواحد يبص على أربع حاجات بوضوح:

**مميزات الشرب أو الاستخدام:**
إيه اللي المادة كانت بتعملهولك؟
هل كانت بتخليك اجتماعي أكتر؟
هل كانت بتديك ثقة؟
هل كانت بتخليك تهرب من الضغط؟
هل كانت بتسكت وجع معين جواك؟

**عيوب الشرب أو الاستخدام:**
إيه اللي خسرته؟
فلوس؟ صحة؟ شغل؟ أهل؟ علاقات؟ مشاكل قانونية؟ كرامتك؟ احترامك لنفسك؟

**عيوب التبطيل:**
إيه اللي خايف تخسره لما تبطل؟
صحابك القدام؟ النظام اللي أنت متعود عليه؟ الإحساس إنك عارف تعيش بالطريقة دي؟
ولا خايف تواجه مشاعرك من غير مخدر أو كحول؟

**مميزات التبطيل:**
إيه الهدف؟
صحة؟ استقرار؟ راحة بال؟ سيطرة على نفسك؟ علاقة أحسن بأهلك؟ حياة فيها معنى؟

---

**٣- سهم التغيير**

الفكرة المهمة هنا إن التغيير بيفشل لما نتخيل إننا حننط من الحياة القديمة مباشرة لحياة أحسن، من غير ما نعدي على المرحلة الصعبة اللي في النص.

أي تغيير حقيقي بيمشي كده:

**مميزات الحالة القديمة:**
في الأول، المادة بتبان كأنها حل.
بتدي ثقة.
بتسهل العلاقات.
بتسكت الوجع.
بتدي إحساس مؤقت بالسيطرة.

**عيوب الحالة القديمة:**
بعد فترة، التكلفة بتظهر.
الصحة بتتأثر.
الفلوس بتضيع.
العلاقات بتبوظ.
المشاكل بتزيد.
والحياة تبدأ تبقى أضيق وأصعب.

**عيوب الحالة الجديدة: منطقة الخطر**
ودي أخطر مرحلة في التعافي.

الواحد يبقى بطل، بس لسه ما حسش بمكاسب التبطيل.
لسه مشاعره متلخبطة.
لسه المخ ما رجعش يفرز المتعة بشكل طبيعي.
لسه فاقد الصحبة القديمة.
لسه حاسس بالفراغ.
ولسه مسؤوليات الحياة واقفة قدامه تقيلة.

هنا ناس كتير بتنتكس.
مش لأن التبطيل فشل، لكن لأنهم واقفين في أصعب حتة في سهم التغيير، قبل ما يوصلوا للمكسب الحقيقي.

**مميزات الحالة الجديدة:**
بعد الصبر والاستمرار، تبدأ المكاسب تظهر.
استقرار.
احترام للنفس.
هدوء.
صحة أحسن.
علاقات أوضح.
وحياة عملية ممكن الواحد يعتمد فيها على نفسه.

---

**٤- عمودين مهمين للنجاة**

إزاي الواحد يعدي من منطقة الخطر دي؟

**أول حاجة: الصحبة والدعم**

ماينفعش الواحد يعمل الرحلة دي لوحده.

محتاج يبقى وسط ناس فاهمة، وناس بتشد بعض لفوق.
لو واحد ضعف، التانيين يسندوه.
لو واحد نسي هو بدأ ليه، المجموعة تفكره.
لو واحد وقع، مايتسابش لوحده.

الصحبة هنا مش رفاهية.
الصحبة جزء من العلاج.

**تاني حاجة: معنى أكبر من الرغبة**

من أقوى الحاجات اللي بتحمي من الاشتياق والرغبة إن الواحد يلاقي معنى أكبر من نفسه.

حاجة يحس إنها أهم من الشرب أو الاستخدام.
هدف. رسالة. مسؤولية. إيمان. دور. انتماء.

---

**الخلاصة**

التغيير صعب، لكنه ممكن.

المشكلة إننا ساعات بنفتكر إن أصعب أيام التعافي معناها إننا فشلنا.
لكن الحقيقة إن أصعب أيام التعافي ممكن تكون هي المرحلة اللي قبل الاستقرار مباشرة.

زي ما البلاد أوقات بتمر بأصعب لحظاتها قبل ما تبدأ تتحسن، الإنسان كمان ممكن يمر بأصعب مرحلة في تعافيه قبل ما يوصل لحياة أهدى وأنضف وأكثر استقرار.

المهم إنك تفهم أنت واقف فين على سهم التغيير.
وماتفتكرش إن صعوبة المرحلة معناها إن الطريق غلط.
ساعات الصعوبة دي معناها إنك قربت تدخل على مرحلة جديدة.`;

const categoryLabels = {
  pros_using: { ar: 'مميزات الشرب', icon: '❌' },
  cons_using: { ar: 'عيوب الشرب', icon: '⚠️' },
  pros_abstinent: { ar: 'مميزات التبطيل', icon: '✅' },
  cons_abstinent: { ar: 'عيوب التبطيل', icon: '⚠️' },
};

const categoryPlaceholders = {
  pros_using: 'مثلاً: تخفف من القلق، تخليني أنام...',
  cons_using: 'مثلاً: صحتي تأثرت، خسرت فلوس...',
  pros_abstinent: 'مثلاً: حياة أفضل، احترام نفسي...',
  cons_abstinent: 'مثلاً: الملل، تفاعلات الانسحاب صعبة...',
};

export default function DecisionMatrix() {
  const navigate = useNavigate();
  const { tools, addTool, updateTool } = usePatient();

  // Create separate refs for each textarea to fix auto-expand bug
  const prosUsingRef = useAutoExpandTextarea();
  const consUsingRef = useAutoExpandTextarea();
  const prosAbstinentRef = useAutoExpandTextarea();
  const consAbstinentRef = useAutoExpandTextarea();

  const [toolId, setToolId] = useState<number | null>(null);
  const [items, setItems] = useState<Record<string, DecisionItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState<Record<string, string>>({
    pros_using: '',
    cons_using: '',
    pros_abstinent: '',
    cons_abstinent: '',
  });
  const [showExplanation, setShowExplanation] = useState(true);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [addingCategory, setAddingCategory] = useState<string | null>(null);

  useEffect(() => {
    const initTool = async () => {
      try {
        // Check if tool already exists in the tools array
        let existingTool = tools.find((t) => t.tool_type === 'decision_matrix');

        // If not found in tools array, fetch all tools to find it
        if (!existingTool) {
          try {
            const res = await api.get('/tools');
            const foundTool = res.data.tools?.find((t: any) => t.tool_type === 'decision_matrix');
            if (foundTool) {
              existingTool = foundTool;
            }
          } catch {
            // If fetching fails, continue without a tool (user can create one)
          }
        }

        if (existingTool) {
          setToolId(existingTool.id);
          // Fetch tool content with items
          const res = await api.get(`/tools/${existingTool.id}`);
          setItems(
            res.data.tool.items?.reduce((acc: any, item: DecisionItem) => {
              if (!acc[item.category]) acc[item.category] = [];
              acc[item.category].push(item);
              return acc;
            }, {}) || {}
          );
        }
      } catch (err) {
        console.error('Failed to load tool:', err);
        setToast({ message: 'خطأ في تحميل الأداة', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    initTool();
  }, [tools]);

  const handleCreateTool = async () => {
    try {
      const res = await api.post('/tools', { tool_type: 'decision_matrix' });
      setToolId(res.data.tool.id);
      addTool(res.data.tool);
    } catch (err) {
      console.error('Failed to create tool:', err);
      setToast({ message: 'خطأ في إنشاء الأداة', type: 'error' });
    }
  };

  const handleAddItem = async (category: string) => {
    const text = newItemText[category as keyof typeof newItemText]?.trim();
    if (!text || !toolId) return;

    setAddingCategory(category);
    try {
      const res = await api.post(`/tools/${toolId}/decision-matrix/items`, {
        category,
        item_text: text,
      });

      const newItem = res.data.item;
      setItems((prev) => ({
        ...prev,
        [category]: [...(prev[category] || []), newItem],
      }));

      setNewItemText((prev) => ({
        ...prev,
        [category]: '',
      }));

      setExpandedCategory(null);
      setToast({ message: 'تم إضافة النقطة', type: 'success' });
    } catch (err) {
      console.error('Failed to add item:', err);
      setToast({ message: 'خطأ في إضافة النقطة', type: 'error' });
    } finally {
      setAddingCategory(null);
    }
  };

  const handleDeleteItem = async (itemId: number, category: string) => {
    if (!toolId) return;

    setDeletingItemId(itemId);
    try {
      await api.delete(`/tools/${toolId}/decision-matrix/items/${itemId}`);

      setItems((prev) => ({
        ...prev,
        [category]: prev[category]?.filter((item: DecisionItem) => item.id !== itemId) || [],
      }));

      setToast({ message: 'تم حذف النقطة', type: 'success' });
    } catch (err) {
      console.error('Failed to delete item:', err);
      setToast({ message: 'خطأ في حذف النقطة', type: 'error' });
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleShare = async () => {
    if (!toolId) return;

    setSaving(true);
    try {
      await api.patch(`/tools/${toolId}/share`);
      updateTool(toolId, { shared_with_therapist: true });
      setToast({ message: 'تم مشاركة الأداة مع المعالج', type: 'success' });
    } catch (err) {
      console.error('Failed to share:', err);
      setToast({ message: 'خطأ في المشاركة', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 pb-6 bg-gray-50">
      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 gap-3">
          <button onClick={() => navigate('/tools')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">جدول الأرباح و الخسائر</h2>
          <div className="w-10" />
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

        {!toolId ? (
          <button
            onClick={handleCreateTool}
            disabled={saving}
            className="btn-primary w-full py-3 mb-4 disabled:opacity-50"
            aria-label="إنشاء أداة جدول الأرباح والخسائر"
          >
            {saving ? 'جاري الإنشاء...' : 'ابدأي بإنشاء الأداة'}
          </button>
        ) : (
          <>
            {/* Explanation Card */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg sm:rounded-xl p-4 sm:p-5 mb-6">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-sm sm:text-base font-bold text-blue-900">سهم التغيير</h3>
                <svg
                  className={`w-4 h-4 text-blue-900 transition-transform ${showExplanation ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {showExplanation && (
                <div className="mt-4 text-xs sm:text-sm text-gray-800 leading-relaxed max-h-96 overflow-y-auto space-y-3">
                  {EXPLANATION_TEXT.split('\n\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              )}
            </div>

            {/* 2x2 Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              {/* Pros Abstinent - Top Left (Green) */}
              <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-sm p-4">
                <h3 className="text-sm sm:text-base font-bold text-green-700 mb-3">
                  ✅ مميزات التبطيل
                </h3>
                <div className="space-y-2 mb-4 min-h-[100px]">
                  {(items['pros_abstinent'] || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm bg-green-50 p-2 rounded">
                      <span className="flex-1">{item.item_text}</span>
                      <button
                        onClick={() => handleDeleteItem(item.id, 'pros_abstinent')}
                        disabled={deletingItemId === item.id}
                        className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 disabled:opacity-50"
                        aria-label={`حذف: ${item.item_text}`}
                      >
                        {deletingItemId === item.id ? '...' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>

                {expandedCategory === 'pros_abstinent' && (
                  <div className="space-y-2">
                    <textarea
                      ref={prosAbstinentRef}
                      value={newItemText.pros_abstinent}
                      onChange={(e) => setNewItemText({ ...newItemText, pros_abstinent: e.target.value })}
                      placeholder={categoryPlaceholders.pros_abstinent}
                      maxLength={500}
                      className="input-base textarea-auto-expand text-xs sm:text-sm w-full resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedCategory(null)}
                        className="btn-secondary flex-1 py-1 text-xs"
                        aria-label="إلغاء إضافة نقطة جديدة"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleAddItem('pros_abstinent')}
                        disabled={!newItemText.pros_abstinent.trim() || addingCategory === 'pros_abstinent'}
                        className="btn-primary flex-1 py-1 text-xs disabled:opacity-40"
                        aria-label="حفظ النقطة الجديدة"
                      >
                        {addingCategory === 'pros_abstinent' ? '...' : 'حفظ'}
                      </button>
                    </div>
                  </div>
                )}

                {expandedCategory !== 'pros_abstinent' && (
                  <button
                    onClick={() => setExpandedCategory('pros_abstinent')}
                    className="text-green-600 hover:text-green-700 text-xs sm:text-sm w-full py-1"
                    aria-label="إضافة نقطة جديدة إلى مميزات التبطيل"
                  >
                    + أضيفي نقطة
                  </button>
                )}
              </div>

              {/* Pros Using - Top Right (Red) */}
              <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-4">
                <h3 className="text-sm sm:text-base font-bold text-red-700 mb-3">
                  ❌ مميزات الشرب
                </h3>
                <div className="space-y-2 mb-4 min-h-[100px]">
                  {(items['pros_using'] || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm bg-red-50 p-2 rounded">
                      <span className="flex-1">{item.item_text}</span>
                      <button
                        onClick={() => handleDeleteItem(item.id, 'pros_using')}
                        disabled={deletingItemId === item.id}
                        className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 disabled:opacity-50"
                        aria-label={`حذف: ${item.item_text}`}
                      >
                        {deletingItemId === item.id ? '...' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>

                {expandedCategory === 'pros_using' && (
                  <div className="space-y-2">
                    <textarea
                      ref={prosUsingRef}
                      value={newItemText.pros_using}
                      onChange={(e) => setNewItemText({ ...newItemText, pros_using: e.target.value })}
                      placeholder={categoryPlaceholders.pros_using}
                      maxLength={500}
                      className="input-base textarea-auto-expand text-xs sm:text-sm w-full resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedCategory(null)}
                        className="btn-secondary flex-1 py-1 text-xs"
                        aria-label="إلغاء إضافة نقطة جديدة"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleAddItem('pros_using')}
                        disabled={!newItemText.pros_using.trim() || addingCategory === 'pros_using'}
                        className="btn-primary flex-1 py-1 text-xs disabled:opacity-40"
                        aria-label="حفظ النقطة الجديدة"
                      >
                        {addingCategory === 'pros_using' ? '...' : 'حفظ'}
                      </button>
                    </div>
                  </div>
                )}

                {expandedCategory !== 'pros_using' && (
                  <button
                    onClick={() => setExpandedCategory('pros_using')}
                    className="text-red-600 hover:text-red-700 text-xs sm:text-sm w-full py-1"
                    aria-label="إضافة نقطة جديدة إلى مميزات الشرب"
                  >
                    + أضيفي نقطة
                  </button>
                )}
              </div>

              {/* Cons Abstinent - Bottom Left (Green) */}
              <div className="bg-white border-l-4 border-green-500 rounded-lg shadow-sm p-4">
                <h3 className="text-sm sm:text-base font-bold text-green-700 mb-3">
                  ⚠️ عيوب التبطيل
                </h3>
                <div className="space-y-2 mb-4 min-h-[100px]">
                  {(items['cons_abstinent'] || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm bg-green-50 p-2 rounded">
                      <span className="flex-1">{item.item_text}</span>
                      <button
                        onClick={() => handleDeleteItem(item.id, 'cons_abstinent')}
                        disabled={deletingItemId === item.id}
                        className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 disabled:opacity-50"
                        aria-label={`حذف: ${item.item_text}`}
                      >
                        {deletingItemId === item.id ? '...' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>

                {expandedCategory === 'cons_abstinent' && (
                  <div className="space-y-2">
                    <textarea
                      ref={consAbstinentRef}
                      value={newItemText.cons_abstinent}
                      onChange={(e) => setNewItemText({ ...newItemText, cons_abstinent: e.target.value })}
                      placeholder="مثلاً: الملل، تفاعلات الانسحاب صعبة..."
                      maxLength={500}
                      className="input-base textarea-auto-expand text-xs sm:text-sm w-full resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedCategory(null)}
                        className="btn-secondary flex-1 py-1 text-xs"
                        aria-label="إلغاء إضافة نقطة جديدة"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleAddItem('cons_abstinent')}
                        disabled={!newItemText.cons_abstinent.trim() || addingCategory === 'cons_abstinent'}
                        className="btn-primary flex-1 py-1 text-xs disabled:opacity-40"
                        aria-label="حفظ النقطة الجديدة"
                      >
                        {addingCategory === 'cons_abstinent' ? '...' : 'حفظ'}
                      </button>
                    </div>
                  </div>
                )}

                {expandedCategory !== 'cons_abstinent' && (
                  <button
                    onClick={() => setExpandedCategory('cons_abstinent')}
                    className="text-green-600 hover:text-green-700 text-xs sm:text-sm w-full py-1"
                    aria-label="إضافة نقطة جديدة إلى عيوب التبطيل"
                  >
                    + أضيفي نقطة
                  </button>
                )}
              </div>

              {/* Cons Using - Bottom Right (Red) */}
              <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-4">
                <h3 className="text-sm sm:text-base font-bold text-red-700 mb-3">
                  ⚠️ عيوب الشرب
                </h3>
                <div className="space-y-2 mb-4 min-h-[100px]">
                  {(items['cons_using'] || []).map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs sm:text-sm bg-red-50 p-2 rounded">
                      <span className="flex-1">{item.item_text}</span>
                      <button
                        onClick={() => handleDeleteItem(item.id, 'cons_using')}
                        disabled={deletingItemId === item.id}
                        className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0 disabled:opacity-50"
                        aria-label={`حذف: ${item.item_text}`}
                      >
                        {deletingItemId === item.id ? '...' : '✕'}
                      </button>
                    </div>
                  ))}
                </div>

                {expandedCategory === 'cons_using' && (
                  <div className="space-y-2">
                    <textarea
                      ref={consUsingRef}
                      value={newItemText.cons_using}
                      onChange={(e) => setNewItemText({ ...newItemText, cons_using: e.target.value })}
                      placeholder={categoryPlaceholders.cons_using}
                      maxLength={500}
                      className="input-base textarea-auto-expand text-xs sm:text-sm w-full resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedCategory(null)}
                        className="btn-secondary flex-1 py-1 text-xs"
                        aria-label="إلغاء إضافة نقطة جديدة"
                      >
                        إلغاء
                      </button>
                      <button
                        onClick={() => handleAddItem('cons_using')}
                        disabled={!newItemText.cons_using.trim() || addingCategory === 'cons_using'}
                        className="btn-primary flex-1 py-1 text-xs disabled:opacity-40"
                        aria-label="حفظ النقطة الجديدة"
                      >
                        {addingCategory === 'cons_using' ? '...' : 'حفظ'}
                      </button>
                    </div>
                  </div>
                )}

                {expandedCategory !== 'cons_using' && (
                  <button
                    onClick={() => setExpandedCategory('cons_using')}
                    className="text-red-600 hover:text-red-700 text-xs sm:text-sm w-full py-1"
                    aria-label="إضافة نقطة جديدة إلى عيوب الشرب"
                  >
                    + أضيفي نقطة
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pb-6">
              <button
                onClick={handleShare}
                disabled={saving}
                className="btn-primary w-full py-2 sm:py-3 text-xs sm:text-sm disabled:opacity-50"
                aria-label="حفظ ومشاركة جدول الأرباح والخسائر مع المعالج"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ وشارك مع المعالج ✓'}
              </button>
              <button
                onClick={() => navigate(`/tools/decision-matrix/view?toolId=${toolId}`)}
                className="btn-primary w-full py-2 sm:py-3 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
                aria-label="عرض جدول الأرباح والخسائر في شكل مصفوفة"
              >
                عرض الجدول 📊
              </button>
              <button
                onClick={() => navigate('/tools')}
                className="btn-secondary w-full py-2 sm:py-3 text-xs sm:text-sm"
                aria-label="الرجوع إلى قائمة الأدوات"
              >
                رجوع
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
