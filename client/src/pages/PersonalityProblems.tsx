import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../hooks/usePatient';
import { useAutoExpandTextarea } from '../hooks/useAutoExpandTextarea';
import api from '../api/client';

interface ProblemExample {
  id: number;
  example_text: string;
  example_date: string;
  created_at: string;
}

interface Problem {
  id: number;
  tool_id: number;
  problem_name: string;
  problem_description: string;
  examples: ProblemExample[];
  created_at: string;
  updated_at: string;
}

export default function PersonalityProblems() {
  const navigate = useNavigate();
  const { tools, addTool, fetchMe } = usePatient();

  const [toolId, setToolId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [shared, setShared] = useState(false);

  // Form state for new problem
  const [newProblemName, setNewProblemName] = useState('');
  const [newProblemDesc, setNewProblemDesc] = useState('');

  // Example form state
  const [expandedProblemId, setExpandedProblemId] = useState<number | null>(null);
  const [newExampleText, setNewExampleText] = useState('');
  const [newExampleDate, setNewExampleDate] = useState(new Date().toISOString().split('T')[0]);

  // Auto-expand textareas
  const problemDescRef = useAutoExpandTextarea();
  const exampleTextRef = useAutoExpandTextarea();

  // Load tools on mount
  useEffect(() => {
    fetchMe();
    setLoading(false);
  }, []);

  // Find existing personality_problems tool
  useEffect(() => {
    const existingTool = tools.find((t) => t.tool_type === 'personality_problems');
    if (existingTool) {
      setToolId(existingTool.id);
      setShared(existingTool.shared_with_therapist);
      // Fetch problems
      api.get(`/tools/${existingTool.id}/personality-problems`).then((res) => {
        setProblems(res.data.problems || []);
      });
    }
  }, [tools]);

  const handleAddProblem = async () => {
    if (!newProblemName.trim() || !newProblemDesc.trim()) {
      setError('اسم العيب والوصف مطلوبان');
      return;
    }

    try {
      let currentToolId = toolId;

      // Create tool if it doesn't exist
      if (!currentToolId) {
        const createRes = await api.post('/tools', { tool_type: 'personality_problems' });
        currentToolId = createRes.data.tool.id;
        setToolId(currentToolId);
        addTool(createRes.data.tool);
      }

      // Add problem
      const res = await api.post(`/tools/${currentToolId}/personality-problems`, {
        problem_name: newProblemName,
        problem_description: newProblemDesc
      });

      setProblems([res.data.problem, ...problems]);
      setNewProblemName('');
      setNewProblemDesc('');
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في الحفظ');
    }
  };

  const handleUpdateProblem = async (problemId: number) => {
    const problem = problems.find(p => p.id === problemId);
    if (!problem) return;

    if (!problem.problem_name.trim() || !problem.problem_description.trim()) {
      setError('اسم العيب والوصف مطلوبان');
      return;
    }

    try {
      const res = await api.patch(`/tools/${toolId}/personality-problems/${problemId}`, {
        problem_name: problem.problem_name,
        problem_description: problem.problem_description
      });

      setProblems(problems.map(p => p.id === problemId ? res.data.problem : p));
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في التحديث');
    }
  };

  const handleDeleteProblem = async (problemId: number) => {
    if (!window.confirm('هل أنت متأكدة من حذف هذا العيب وجميع أمثلته؟')) return;

    if (!toolId) return;

    try {
      await api.delete(`/tools/${toolId}/personality-problems/${problemId}`);
      setProblems(problems.filter(p => p.id !== problemId));
      setError(null);
    } catch (err) {
      setError((err as any).response?.data?.error || 'خطأ في الحذف');
    }
  };

  const handleAddExample = async (problemId: number) => {
    if (!newExampleText.trim()) {
      setError('نص المثال مطلوب');
      return;
    }

    if (!toolId) return;

    try {
      const res = await api.post(`/tools/${toolId}/personality-problems/${problemId}/examples`, {
        example_text: newExampleText,
        example_date: newExampleDate
      });

      setProblems(problems.map(p => {
        if (p.id === problemId) {
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

  const handleDeleteExample = async (problemId: number, exampleId: number) => {
    if (!toolId) return;

    try {
      await api.delete(`/tools/${toolId}/personality-problems/${problemId}/examples/${exampleId}`);
      setProblems(problems.map(p => {
        if (p.id === problemId) {
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
          <h1 className="text-lg sm:text-xl font-bold">العيوب الشخصيه</h1>
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
        {/* Add New Problem Form */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <h3 className="font-bold mb-4 text-center text-base">أضيفي عيباً جديداً</h3>

          <input
            type="text"
            value={newProblemName}
            onChange={(e) => setNewProblemName(e.target.value)}
            placeholder="اسم العيب..."
            className="input-base w-full mb-3"
            maxLength={100}
          />

          <textarea
            ref={problemDescRef}
            value={newProblemDesc}
            onChange={(e) => setNewProblemDesc(e.target.value)}
            placeholder="مفهوم العيب (كما تفهمينه بكلماتك الخاصة)..."
            className="input-base w-full mb-3 textarea-auto-expand"
            maxLength={500}
          />

          <button
            onClick={handleAddProblem}
            className="btn-primary w-full"
          >
            + إضافة العيب
          </button>
        </div>

        {/* Problems List */}
        {problems.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            <p>لا توجد عيوب حتى الآن</p>
            <p className="text-sm mt-2">ابدأي بكتابة العيوب التي تسعين لتحسينها</p>
          </div>
        ) : (
          <div className="space-y-4">
            {problems.map((problem) => (
              <div
                key={problem.id}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition"
              >
                {/* Problem Header */}
                <div className="flex justify-between items-start mb-3 cursor-pointer gap-2" onClick={() => setExpandedProblemId(expandedProblemId === problem.id ? null : problem.id)}>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={problem.problem_name}
                      onChange={(e) => {
                        const updated = { ...problem, problem_name: e.target.value };
                        setProblems(problems.map(p => p.id === problem.id ? updated : p));
                      }}
                      onBlur={() => handleUpdateProblem(problem.id)}
                      className="font-bold text-base sm:text-lg text-gray-800 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none mb-2 w-full break-words"
                      maxLength={100}
                    />
                    <textarea
                      value={problem.problem_description}
                      onChange={(e) => {
                        const updated = { ...problem, problem_description: e.target.value };
                        setProblems(problems.map(p => p.id === problem.id ? updated : p));
                      }}
                      onBlur={() => handleUpdateProblem(problem.id)}
                      className="text-gray-700 text-sm bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none w-full resize-none textarea-auto-expand"
                      maxLength={500}
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProblem(problem.id);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm flex-shrink-0 p-1"
                  >
                    ❌
                  </button>
                </div>

                {/* Example Count Badge */}
                <div className="text-xs text-gray-500 mb-3">
                  {problem.examples.length === 0 ? 'لا توجد أمثلة' : `${problem.examples.length} ${problem.examples.length === 1 ? 'مثال' : 'أمثلة'}`}
                </div>

                {/* Expanded Examples Section */}
                {expandedProblemId === problem.id && (
                  <div className="border-t pt-4 mt-4">
                    {/* Examples List */}
                    {problem.examples.length > 0 && (
                      <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                        {problem.examples.map((example) => {
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
                                  onClick={() => handleDeleteExample(problem.id, example.id)}
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
                        value={expandedProblemId === problem.id ? newExampleText : ''}
                        onChange={(e) => setNewExampleText(e.target.value)}
                        placeholder="ماذا فعلتِ للتعامل مع هذا العيب؟"
                        className="input-base w-full mb-2 text-sm textarea-auto-expand"
                        maxLength={300}
                      />
                      <input
                        type="date"
                        value={expandedProblemId === problem.id ? newExampleDate : new Date().toISOString().split('T')[0]}
                        onChange={(e) => setNewExampleDate(e.target.value)}
                        className="input-base w-full mb-2 text-sm"
                      />
                      <button
                        onClick={() => handleAddExample(problem.id)}
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
