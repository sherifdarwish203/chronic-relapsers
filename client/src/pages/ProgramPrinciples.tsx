import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../hooks/usePatient';
import { useAutoExpandTextarea } from '../hooks/useAutoExpandTextarea';
import api from '../api/client';

interface PrincipleExample {
  id: number;
  example_text: string;
  example_date: string;
  created_at: string;
}

interface Principle {
  id: number;
  tool_id: number;
  principle_name: string;
  principle_description: string;
  examples: PrincipleExample[];
  created_at: string;
  updated_at: string;
}

export default function ProgramPrinciples() {
  const navigate = useNavigate();
  const { tools, addTool, fetchMe } = usePatient();

  const [toolId, setToolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [shared, setShared] = useState(false);

  // Form state for new principle
  const [newPrincipleName, setNewPrincipleName] = useState('');
  const [newPrincipleDesc, setNewPrincipleDesc] = useState('');

  // Example form state
  const [expandedPrincipleId, setExpandedPrincipleId] = useState<number | null>(null);
  const [newExampleText, setNewExampleText] = useState('');
  const [newExampleDate, setNewExampleDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto-expand textareas
  const principleDescRef = useAutoExpandTextarea();
  const exampleTextRef = useAutoExpandTextarea();

  // Load tools on mount
  useEffect(() => {
    fetchMe();
    setLoading(false);
  }, []);

  // Find existing program_principles tool
  useEffect(() => {
    const existingTool = tools.find((t) => t.tool_type === 'program_principles');
    if (existingTool) {
      setToolId(existingTool.id);
      setShared(existingTool.shared_with_therapist);
      // Fetch principles
      api.get(`/tools/${existingTool.id}/principles`).then((res) => {
        setPrinciples(res.data.principles || []);
      });
    }
  }, [tools]);

  const handleAddPrinciple = async () => {
    if (!newPrincipleName.trim() || !newPrincipleDesc.trim()) {
      setError('اسم المبدأ والوصف مطلوبان');
      return;
    }

    try {
      let currentToolId = toolId;

      // Create tool if it doesn't exist
      if (!currentToolId) {
        const createRes = await api.post('/tools', { tool_type: 'program_principles' });
        currentToolId = createRes.data.tool.id;
        setToolId(currentToolId);
        addTool(createRes.data.tool);
      }

      // Add principle
      const res = await api.post(`/tools/${currentToolId}/principles`, {
        principle_name: newPrincipleName,
        principle_description: newPrincipleDesc
      });

      setPrinciples([res.data.principle, ...principles]);
      setNewPrincipleName('');
      setNewPrincipleDesc('');
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في الحفظ');
    }
  };

  const handleUpdatePrinciple = async (principleId: number) => {
    const principle = principles.find(p => p.id === principleId);
    if (!principle) return;

    if (!principle.principle_name.trim() || !principle.principle_description.trim()) {
      setError('اسم المبدأ والوصف مطلوبان');
      return;
    }

    try {
      const res = await api.patch(`/tools/${toolId}/principles/${principleId}`, {
        principle_name: principle.principle_name,
        principle_description: principle.principle_description
      });

      setPrinciples(principles.map(p => p.id === principleId ? res.data.principle : p));
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في التحديث');
    }
  };

  const handleDeletePrinciple = async (principleId: number) => {
    if (!window.confirm('هل أنت متأكدة من حذف هذا المبدأ وجميع أمثلته؟')) return;

    if (!toolId) return;

    try {
      await api.delete(`/tools/${toolId}/principles/${principleId}`);
      setPrinciples(principles.filter(p => p.id !== principleId));
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في الحذف');
    }
  };

  const handleAddExample = async (principleId: number) => {
    if (!newExampleText.trim()) {
      setError('نص المثال مطلوب');
      return;
    }

    if (!toolId) return;

    try {
      const res = await api.post(`/tools/${toolId}/principles/${principleId}/examples`, {
        example_text: newExampleText,
        example_date: newExampleDate
      });

      setPrinciples(principles.map(p => {
        if (p.id === principleId) {
          return {
            ...p,
            examples: [res.data.example, ...p.examples].sort((a, b) =>
              new Date(b.example_date).getTime() - new Date(a.example_date).getTime()
            )
          };
        }
        return p;
      }));

      setNewExampleText('');
      setNewExampleDate(new Date().toISOString().split('T')[0]);
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في إضافة المثال');
    }
  };

  const handleDeleteExample = async (principleId: number, exampleId: number) => {
    if (!toolId) return;

    try {
      await api.delete(`/tools/${toolId}/principles/${principleId}/examples/${exampleId}`);
      setPrinciples(principles.map(p => {
        if (p.id === principleId) {
          return {
            ...p,
            examples: p.examples.filter(e => e.id !== exampleId)
          };
        }
        return p;
      }));
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في الحذف');
    }
  };

  const handleShare = async () => {
    if (!toolId) return;
    try {
      await api.patch(`/tools/${toolId}/share`, { shared_with_therapist: true });
      setShared(true);
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في المشاركة');
    }
  };

  if (loading) return <div className="p-4 text-center">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tools')} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-xl font-bold">مبادئ البرنامج</h1>
        </div>
        <button
          onClick={handleShare}
          disabled={shared}
          className={`px-3 py-1 text-xs sm:text-sm rounded whitespace-nowrap ${shared ? 'bg-gray-200 text-gray-500' : 'btn-primary'}`}
        >
          {shared ? 'مشترك ✓' : 'مشاركة'}
        </button>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 text-sm mx-4 mt-3 rounded">{error}</div>}

      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {/* Add New Principle Form */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="font-bold mb-4 text-center text-base">أضيفي مبدأ جديد</h3>

          <input
            type="text"
            value={newPrincipleName}
            onChange={(e) => setNewPrincipleName(e.target.value)}
            placeholder="اسم المبدأ..."
            className="input-base w-full mb-3"
            maxLength={100}
          />

          <textarea
            ref={principleDescRef}
            value={newPrincipleDesc}
            onChange={(e) => setNewPrincipleDesc(e.target.value)}
            placeholder="مفهوم المبدأ (كما تفهمينه بكلماتك الخاصة)..."
            className="input-base w-full mb-3 textarea-auto-expand"
            maxLength={500}
          />

          <button
            onClick={handleAddPrinciple}
            className="btn-primary w-full"
          >
            + إضافة المبدأ
          </button>
        </div>

        {/* Principles List */}
        {principles.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            <p>لا توجد مبادئ حتى الآن</p>
            <p className="text-sm mt-2">ابدأي بكتابة المبادئ التي تكتشفينها</p>
          </div>
        ) : (
          <div className="space-y-4">
            {principles.map((principle) => (
              <div
                key={principle.id}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition"
              >
                {/* Principle Header */}
                <div className="flex justify-between items-start mb-3 cursor-pointer gap-2" onClick={() => setExpandedPrincipleId(expandedPrincipleId === principle.id ? null : principle.id)}>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={principle.principle_name}
                      onChange={(e) => {
                        const updated = { ...principle, principle_name: e.target.value };
                        setPrinciples(principles.map(p => p.id === principle.id ? updated : p));
                      }}
                      onBlur={() => handleUpdatePrinciple(principle.id)}
                      className="font-bold text-base sm:text-lg text-gray-800 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none mb-2 w-full break-words"
                      maxLength={100}
                    />
                    <textarea
                      value={principle.principle_description}
                      onChange={(e) => {
                        const updated = { ...principle, principle_description: e.target.value };
                        setPrinciples(principles.map(p => p.id === principle.id ? updated : p));
                      }}
                      onBlur={() => handleUpdatePrinciple(principle.id)}
                      className="text-gray-700 text-sm bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none w-full resize-none textarea-auto-expand"
                      maxLength={500}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePrinciple(principle.id);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm flex-shrink-0 p-1"
                  >
                    ❌
                  </button>
                </div>

                {/* Example Count Badge */}
                <div className="text-xs text-gray-500 mb-3">
                  {principle.examples.length === 0 ? 'لا توجد أمثلة' : `${principle.examples.length} ${principle.examples.length === 1 ? 'مثال' : 'أمثلة'}`}
                </div>

                {/* Expanded Examples Section */}
                {expandedPrincipleId === principle.id && (
                  <div className="border-t pt-4 mt-4">
                    {/* Examples List */}
                    {principle.examples.length > 0 && (
                      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                        {principle.examples.map((example) => {
                          const exDate = new Date(example.example_date);
                          const dateStr = exDate.toLocaleDateString('ar-EG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });

                          return (
                            <div key={example.id} className="bg-gray-50 p-3 rounded text-sm">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-gray-500 text-xs">📅 {dateStr}</p>
                                <button
                                  onClick={() => handleDeleteExample(principle.id, example.id)}
                                  className="text-red-600 hover:text-red-800 text-xs p-1"
                                >
                                  ❌
                                </button>
                              </div>
                              <p className="text-gray-700 break-words">{example.example_text}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Example Form */}
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <label className="text-xs font-medium text-blue-700 block mb-2">+ أضيفي مثالاً</label>
                      <textarea
                        ref={exampleTextRef}
                        value={expandedPrincipleId === principle.id ? newExampleText : ''}
                        onChange={(e) => setNewExampleText(e.target.value)}
                        placeholder="ماذا فعلتِ لتطبيق هذا المبدأ؟"
                        className="input-base w-full mb-2 text-sm textarea-auto-expand"
                        maxLength={300}
                      />
                      <input
                        type="date"
                        value={expandedPrincipleId === principle.id ? newExampleDate : new Date().toISOString().split('T')[0]}
                        onChange={(e) => setNewExampleDate(e.target.value)}
                        className="input-base w-full mb-2 text-sm"
                      />
                      <button
                        onClick={() => handleAddExample(principle.id)}
                        className="btn-primary w-full text-sm"
                      >
                        حفظ المثال
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
