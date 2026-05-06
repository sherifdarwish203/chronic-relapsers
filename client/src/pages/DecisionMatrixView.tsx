import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';

interface DecisionItem {
  id: number;
  category: 'pros_using' | 'cons_using' | 'pros_abstinent' | 'cons_abstinent';
  item_text: string;
  position_order: number;
  created_at: string;
}

interface DecisionMatrixData {
  pros_using: DecisionItem[];
  cons_using: DecisionItem[];
  pros_abstinent: DecisionItem[];
  cons_abstinent: DecisionItem[];
}

const categoryLabels = {
  pros_using: { ar: 'مميزات الشرب', color: 'bg-red-50', borderColor: 'border-red-500', textColor: 'text-red-700' },
  cons_using: { ar: 'عيوب الشرب', color: 'bg-red-50', borderColor: 'border-red-500', textColor: 'text-red-700' },
  pros_abstinent: { ar: 'مميزات التبطيل', color: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-700' },
  cons_abstinent: { ar: 'عيوب التبطيل', color: 'bg-green-50', borderColor: 'border-green-500', textColor: 'text-green-700' },
};

export default function DecisionMatrixView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toolIdParam = searchParams.get('toolId');
  const toolId = toolIdParam ? parseInt(toolIdParam) : null;

  const [items, setItems] = useState<DecisionMatrixData>({
    pros_using: [],
    cons_using: [],
    pros_abstinent: [],
    cons_abstinent: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTool = async () => {
      if (!toolId || isNaN(toolId)) {
        setError('معرّف الأداة غير صالح');
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/tools/${toolId}`);
        const toolItems = res.data.tool.items || [];

        const organized: DecisionMatrixData = {
          pros_using: [],
          cons_using: [],
          pros_abstinent: [],
          cons_abstinent: [],
        };

        toolItems.forEach((item: DecisionItem) => {
          organized[item.category].push(item);
        });

        setItems(organized);
      } catch (err) {
        console.error('Failed to load tool:', err);
        setError('خطأ في تحميل الأداة');
      } finally {
        setLoading(false);
      }
    };

    loadTool();
  }, [toolId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate('/tools')} className="btn-secondary">
            العودة للأدوات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center p-4 pt-6 pb-6 bg-gray-50">
      <div className="w-full max-w-[900px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/tools')} className="text-gray-500 hover:text-gray-700 p-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">جدول الأرباح و الخسائر</h1>
          <button
            onClick={() => window.print()}
            className="text-blue-600 hover:text-blue-700 p-2 text-xs sm:text-sm font-medium"
            title="طباعة"
          >
            🖨️ اطبعي
          </button>
        </div>

        {/* 2x2 Grid View */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Top Left: Pros Abstinent (Green) */}
          <div className={`${categoryLabels.pros_abstinent.color} border-2 ${categoryLabels.pros_abstinent.borderColor} rounded-lg p-6`}>
            <h2 className={`${categoryLabels.pros_abstinent.textColor} text-lg sm:text-xl font-bold mb-4`}>
              ✅ مميزات التبطيل
            </h2>
            <div className="space-y-2">
              {items.pros_abstinent.length === 0 ? (
                <p className="text-gray-400 italic">لا توجد نقاط مضافة</p>
              ) : (
                items.pros_abstinent.map((item) => (
                  <div key={item.id} className="bg-white rounded p-3 border-l-4 border-green-500">
                    <p className="text-gray-800 text-sm sm:text-base">{item.item_text}</p>
                  </div>
                ))
              )}
            </div>
            <p className="text-gray-500 text-xs mt-4">
              {items.pros_abstinent.length} نقاط
            </p>
          </div>

          {/* Top Right: Pros Using (Red) */}
          <div className={`${categoryLabels.pros_using.color} border-2 ${categoryLabels.pros_using.borderColor} rounded-lg p-6`}>
            <h2 className={`${categoryLabels.pros_using.textColor} text-lg sm:text-xl font-bold mb-4`}>
              ❌ مميزات الشرب
            </h2>
            <div className="space-y-2">
              {items.pros_using.length === 0 ? (
                <p className="text-gray-400 italic">لا توجد نقاط مضافة</p>
              ) : (
                items.pros_using.map((item) => (
                  <div key={item.id} className="bg-white rounded p-3 border-l-4 border-red-500">
                    <p className="text-gray-800 text-sm sm:text-base">{item.item_text}</p>
                  </div>
                ))
              )}
            </div>
            <p className="text-gray-500 text-xs mt-4">
              {items.pros_using.length} نقاط
            </p>
          </div>

          {/* Bottom Left: Cons Abstinent (Green) */}
          <div className={`${categoryLabels.cons_abstinent.color} border-2 ${categoryLabels.cons_abstinent.borderColor} rounded-lg p-6`}>
            <h2 className={`${categoryLabels.cons_abstinent.textColor} text-lg sm:text-xl font-bold mb-4`}>
              ⚠️ عيوب التبطيل
            </h2>
            <div className="space-y-2">
              {items.cons_abstinent.length === 0 ? (
                <p className="text-gray-400 italic">لا توجد نقاط مضافة</p>
              ) : (
                items.cons_abstinent.map((item) => (
                  <div key={item.id} className="bg-white rounded p-3 border-l-4 border-green-500">
                    <p className="text-gray-800 text-sm sm:text-base">{item.item_text}</p>
                  </div>
                ))
              )}
            </div>
            <p className="text-gray-500 text-xs mt-4">
              {items.cons_abstinent.length} نقاط
            </p>
          </div>

          {/* Bottom Right: Cons Using (Red) */}
          <div className={`${categoryLabels.cons_using.color} border-2 ${categoryLabels.cons_using.borderColor} rounded-lg p-6`}>
            <h2 className={`${categoryLabels.cons_using.textColor} text-lg sm:text-xl font-bold mb-4`}>
              ⚠️ عيوب الشرب
            </h2>
            <div className="space-y-2">
              {items.cons_using.length === 0 ? (
                <p className="text-gray-400 italic">لا توجد نقاط مضافة</p>
              ) : (
                items.cons_using.map((item) => (
                  <div key={item.id} className="bg-white rounded p-3 border-l-4 border-red-500">
                    <p className="text-gray-800 text-sm sm:text-base">{item.item_text}</p>
                  </div>
                ))
              )}
            </div>
            <p className="text-gray-500 text-xs mt-4">
              {items.cons_using.length} نقاط
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-bold text-blue-900 mb-4">الملخص</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{items.pros_abstinent.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">مميزات التبطيل</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{items.pros_using.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">مميزات الشرب</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{items.cons_abstinent.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">عيوب التبطيل</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{items.cons_using.length}</p>
              <p className="text-xs sm:text-sm text-gray-600">عيوب الشرب</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="btn-primary w-full py-3"
          >
            🖨️ اطبعي الجدول
          </button>
          <button
            onClick={() => navigate(`/tools/decision-matrix`)}
            className="btn-secondary w-full py-3"
          >
            تحرير
          </button>
          <button
            onClick={() => navigate('/tools')}
            className="btn-secondary w-full py-3"
          >
            رجوع للأدوات
          </button>
        </div>
      </div>
    </div>
  );
}
