import { useNavigate } from 'react-router-dom';
import { usePatient } from '../hooks/usePatient';

export default function Tools() {
  const navigate = useNavigate();
  const { tools, loading } = usePatient();

  const toolCards = [
    {
      id: 'twenty-reasons',
      title: '20 سبب للامتناع',
      description: 'اكتب 20 سبب لماذا تريد الامتناع — هذه الأسباب ستظهر لك يومياً كحافز',
      emoji: '✨',
      icon: '💭',
    },
    {
      id: 'black-pictures',
      title: 'الصور السوداء',
      description: 'اكتب 5 قصص عن أوقات وصلت فيها للقاع — اقرأها عندما تشعر برغبة في الانتكاسة',
      emoji: '🖼️',
      icon: '📖',
    },
    {
      id: 'daily-planner',
      title: 'جدول اليوم',
      description: 'خطط ليومك ساعة بساعة، حدد الأنشطة الآمنة والخطرة، وخطط للتعامل مع الأوقات الصعبة',
      emoji: '📅',
      icon: '⏰',
    },
    {
      id: 'safety-map',
      title: 'خريطة الأمان',
      description: 'حدد مثيراتك الخارجية والداخلية وقيم مستوى خطورة كل منها',
      emoji: '🗺️',
      icon: '⚠️',
    },
    {
      id: 'personal-triangle',
      title: 'المثلث الشخصي',
      description: 'تواصل داخلي بين ثلاث أصوات: الضحية والمعتدي والمراقب — اكتبي رسالتك يومياً',
      emoji: '🔺',
      icon: '💬',
    },
    {
      id: 'principles',
      title: 'مبادئ البرنامج',
      description: 'اكتشفي وعرّفي مبادئ برنامجك الشخصية، وسجلي الأمثلة على تطبيقها',
      emoji: '🏛️',
      icon: '📜',
    },
    {
      id: 'personality-problems',
      title: 'العيوب الشخصيه',
      description: 'حددي العيوب التي تسعين لتحسينها، وسجلي خطواتك نحو التحسن',
      emoji: '🔧',
      icon: '💪',
    },
    {
      id: 'decision-matrix',
      title: 'جدول الأرباح و الخسائر',
      description: 'قارني بين مميزات وعيوب الشرب والامتناع — فهمي حقاً ماذا تكسبين وماذا تخسرين',
      emoji: '⚖️',
      icon: '📊',
    },
  ];

  const getToolStatus = (toolId: string) => {
    const toolType = toolId === 'twenty-reasons' ? 'twenty_reasons' :
                      toolId === 'black-pictures' ? 'black_pictures' :
                      toolId === 'daily-planner' ? 'daily_planner' :
                      toolId === 'safety-map' ? 'safety_map' :
                      toolId === 'personal-triangle' ? 'personal_triangle' :
                      toolId === 'principles' ? 'program_principles' :
                      toolId === 'decision-matrix' ? 'decision_matrix' :
                      'personality_problems';
    return tools.find((t) => t.tool_type === toolType);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-4 pt-6">
      <div className="w-full max-w-[520px]">
        {/* Header */}
        <div className="flex items-center justify-center mb-6 gap-3">
          <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">الأدوات العلاجية</h2>
          <div className="w-10" />
        </div>

        <p className="text-center text-xs sm:text-sm text-gray-500 mb-6 px-2">
          أدوات تساعدك على التعافي والحفاظ على الامتناع
        </p>

        {/* Tools Grid */}
        {loading ? (
          <div className="text-center text-gray-400 py-8">جاري التحميل...</div>
        ) : (
          <div className="space-y-3 mb-6">
            {toolCards.map((tool) => {
              const status = getToolStatus(tool.id);
              return (
                <button
                  key={tool.id}
                  onClick={() => navigate(`/tools/${tool.id}`)}
                  className="w-full text-right p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-green-50 transition block active:bg-green-50"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="text-2xl sm:text-3xl flex-shrink-0">{tool.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-gray-800 mb-1 text-right break-words">{tool.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed text-right">{tool.description}</p>
                      {status && (
                        <p className={`text-xs mt-2 ${status.shared_with_therapist ? 'text-green-600 font-medium' : 'text-amber-600'}`}>
                          {status.shared_with_therapist ? '✓ مشاركة مع المعالج' : '✎ مسودة'}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Bottom navigation */}
        <div className="space-y-3 pb-6">
          <button
            onClick={() => navigate('/home')}
            className="btn-secondary w-full"
          >
            رجوع
          </button>
        </div>
      </div>
    </div>
  );
}
